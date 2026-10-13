import { createHmac, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isSandboxCheckoutPath } from "./sandbox-checkout-path";
import {
  PAYZLI_TEST_CARD_NUMBER,
  assertSandboxOrigin,
  buildCaptureContextBody,
  buildSaleBody,
  readMicroformLibrary,
  readPaymentResult,
  signPayzliPost,
} from "./payzli-sandbox";

const credentials = {
  merchantId: "test_merchant",
  keyId: "test-key",
  sharedSecret: Buffer.from("sandbox-secret").toString("base64"),
};

describe("sandbox checkout path", () => {
  it("opens only the sandbox checkout without the public preview gate", () => {
    expect(isSandboxCheckoutPath("/sandbox/checkout")).toBe(true);
    expect(isSandboxCheckoutPath("/sandbox/checkout/")).toBe(true);
    expect(isSandboxCheckoutPath("/")).toBe(false);
    expect(isSandboxCheckoutPath("/merchant-health")).toBe(false);
  });
});

describe("Payzli sandbox request", () => {
  it("keeps the card number off the server payment body", () => {
    const body = buildSaleBody({
      transientToken: "header.payload.signature-token",
      amount: "1.00",
      reference: "sandbox-1",
      billTo: {
        firstName: "Test",
        lastName: "Patient",
        address1: "1 Market St",
        locality: "San Francisco",
        administrativeArea: "CA",
        postalCode: "94105",
        email: "sandbox@example.com",
      },
    });
    const parsed = JSON.parse(body) as {
      orderInformation: { amountDetails: { totalAmount: string } };
      tokenInformation: { transientTokenJwt: string };
    };

    expect(body).not.toContain(PAYZLI_TEST_CARD_NUMBER.replaceAll(" ", ""));
    expect(parsed.orderInformation.amountDetails.totalAmount).toBe("1.00");
    expect(parsed.tokenInformation.transientTokenJwt).toBe("header.payload.signature-token");
    expect(body).not.toContain("card");
  });

  it("limits the card field session to the local checkout origin", () => {
    const body = JSON.parse(buildCaptureContextBody("http://localhost:5173/sandbox/checkout")) as {
      targetOrigins: string[];
      clientVersion: string;
    };
    expect(body.clientVersion).toBe("v2");
    expect(body.targetOrigins).toEqual(["http://localhost:5173"]);
    expect(() => assertSandboxOrigin("https://example.com")).toThrow(/not allowed/);
  });

  it("signs the sandbox post with the shared secret", () => {
    const body = "{\"ok\":true}";
    const signed = signPayzliPost({
      path: "/microform/v2/sessions",
      body,
      credentials,
      date: "Sun, 04 Oct 2026 21:00:00 GMT",
      host: "apitest.cybersource.com",
    });
    const digest = `SHA-256=${createHash("sha256").update(body, "utf8").digest("base64")}`;
    const signing = [
      "host: apitest.cybersource.com",
      "date: Sun, 04 Oct 2026 21:00:00 GMT",
      "request-target: post /microform/v2/sessions",
      `digest: ${digest}`,
      "v-c-merchant-id: test_merchant",
    ].join("\n");
    const signature = createHmac("sha256", Buffer.from(credentials.sharedSecret, "base64")).update(signing, "utf8").digest("base64");

    expect(signed.headers.digest).toBe(digest);
    expect(signed.headers["v-c-merchant-id"]).toBe("test_merchant");
    expect(signed.headers.signature).toContain(`signature="${signature}"`);
    expect(signed.url).toBe("https://apitest.cybersource.com/microform/v2/sessions");
  });

  it("signs a meta key with the portfolio id and sends the clinic merchant id", () => {
    const signed = signPayzliPost({
      path: "/microform/v2/sessions",
      body: "{}",
      credentials: { ...credentials, portfolioId: "portfolio_1" },
      date: "Sun, 04 Oct 2026 21:00:00 GMT",
      host: "apitest.cybersource.com",
    });
    expect(signed.headers["v-c-merchant-id"]).toBe("test_merchant");
    expect(signed.headers.signature).not.toBe(
      signPayzliPost({
        path: "/microform/v2/sessions",
        body: "{}",
        credentials,
        date: "Sun, 04 Oct 2026 21:00:00 GMT",
        host: "apitest.cybersource.com",
      }).headers.signature,
    );
  });

  it("reads the card field library from the capture context", () => {
    const payload = Buffer.from(
      JSON.stringify({
        ctx: [{ data: { clientLibrary: "https://testflex.cybersource.com/flex.js", clientLibraryIntegrity: "sha256-abc" } }],
      }),
    ).toString("base64url");
    const library = readMicroformLibrary(`aaa.${payload}.bbb`);
    expect(library.clientLibrary).toBe("https://testflex.cybersource.com/flex.js");
    expect(library.clientLibraryIntegrity).toBe("sha256-abc");
  });

  it("reads the payment id returned by the sandbox", () => {
    expect(readPaymentResult({ id: "pay_123", status: "AUTHORIZED", reconciliationId: "rec_1" })).toEqual({
      id: "pay_123",
      status: "AUTHORIZED",
      reconciliationId: "rec_1",
    });
  });
});

describe("sandbox checkout page", () => {
  const source = readFileSync(join(process.cwd(), "src/routes/sandbox/checkout.tsx"), "utf8");

  it("shows the sandbox test card and keeps secrets out of the page", () => {
    expect(source).toContain("4111 1111 1111 1111");
    expect(source).not.toContain('from "../../lib/payzli-sandbox"');
    expect(source).toContain('id="card-number"');
    expect(source).toContain('id="card-cvv"');
    expect(source).not.toContain("PAYZLI_SHARED_SECRET");
    expect(source).not.toContain("PAYZLI_KEY_ID");
  });
});
