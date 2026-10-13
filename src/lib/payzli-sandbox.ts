import { createHmac, createHash } from "node:crypto";

export const PAYZLI_SANDBOX_HOST = "apitest.cybersource.com";
export const PAYZLI_TEST_CARD_NUMBER = "4111 1111 1111 1111";
export const PAYZLI_SUCCESS_AMOUNT = "1.00";

const CARD_NETWORKS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERSCLUB"] as const;

export type PayzliCredentials = {
  merchantId: string;
  keyId: string;
  sharedSecret: string;
  portfolioId?: string;
};

export type SignedPayzliRequest = {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
};

export type MicroformLibrary = {
  captureContext: string;
  clientLibrary: string;
  clientLibraryIntegrity: string;
};

export type SandboxBillTo = {
  firstName: string;
  lastName: string;
  address1: string;
  locality: string;
  administrativeArea: string;
  postalCode: string;
  email: string;
};

export type SandboxPaymentResult = {
  id: string;
  status: string;
  reconciliationId?: string;
};

export class PayzliSandboxError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PayzliSandboxError";
  }
}

export function assertSandboxOrigin(origin: string): string {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new PayzliSandboxError("Checkout origin is invalid.", 400);
  }

  const local = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (!local) {
    throw new PayzliSandboxError("Checkout origin is not allowed for this sandbox page.", 400);
  }

  return url.origin;
}

export function buildCaptureContextBody(origin: string): string {
  return JSON.stringify({
    clientVersion: "v2",
    targetOrigins: [assertSandboxOrigin(origin)],
    allowedCardNetworks: CARD_NETWORKS,
    allowedPaymentTypes: ["CARD"],
  });
}

export function buildSaleBody(input: { transientToken: string; amount: string; billTo: SandboxBillTo; reference: string }): string {
  if (!/^\d+\.\d{2}$/.test(input.amount)) {
    throw new PayzliSandboxError("Amount must use two decimal places.", 400);
  }
  if (!input.transientToken || input.transientToken.length < 20) {
    throw new PayzliSandboxError("Card token is missing.", 400);
  }

  return JSON.stringify({
    clientReferenceInformation: { code: input.reference },
    processingInformation: { capture: true },
    orderInformation: {
      amountDetails: { totalAmount: input.amount, currency: "USD" },
      billTo: {
        firstName: input.billTo.firstName,
        lastName: input.billTo.lastName,
        address1: input.billTo.address1,
        locality: input.billTo.locality,
        administrativeArea: input.billTo.administrativeArea,
        postalCode: input.billTo.postalCode,
        country: "US",
        email: input.billTo.email,
      },
    },
    tokenInformation: { transientTokenJwt: input.transientToken },
  });
}

export function signPayzliPost(input: {
  path: string;
  body: string;
  credentials: PayzliCredentials;
  date: string;
  host?: string;
}): SignedPayzliRequest {
  const host = input.host ?? PAYZLI_SANDBOX_HOST;
  const method = "post";
  const digest = `SHA-256=${createHash("sha256").update(input.body, "utf8").digest("base64")}`;
  const signatureMerchantId = input.credentials.portfolioId || input.credentials.merchantId;
  const signing = [
    `host: ${host}`,
    `date: ${input.date}`,
    `request-target: ${method} ${input.path}`,
    `digest: ${digest}`,
    `v-c-merchant-id: ${signatureMerchantId}`,
  ].join("\n");
  const secret = Buffer.from(input.credentials.sharedSecret, "base64");
  const signature = createHmac("sha256", secret).update(signing, "utf8").digest("base64");

  return {
    url: `https://${host}${input.path}`,
    method: "POST",
    body: input.body,
    headers: {
      host,
      date: input.date,
      digest,
      "v-c-merchant-id": input.credentials.merchantId,
      "content-type": "application/json",
      signature: `keyid="${input.credentials.keyId}", algorithm="HmacSHA256", headers="host date request-target digest v-c-merchant-id", signature="${signature}"`,
    },
  };
}

export function readMicroformLibrary(captureContext: string): MicroformLibrary {
  const token = captureContext.trim().replace(/^"|"$/g, "");
  const payload = decodeJwtPayload(token);
  const entry = payload.ctx?.[0]?.data;
  if (!entry?.clientLibrary || !entry.clientLibraryIntegrity) {
    throw new PayzliSandboxError("Payzli did not return the card field library.", 502);
  }
  if (!entry.clientLibrary.startsWith("https://")) {
    throw new PayzliSandboxError("Payzli returned an unexpected card field library.", 502);
  }

  return {
    captureContext: token,
    clientLibrary: entry.clientLibrary,
    clientLibraryIntegrity: entry.clientLibraryIntegrity,
  };
}

export function readPaymentResult(payload: unknown): SandboxPaymentResult {
  if (!payload || typeof payload !== "object") {
    throw new PayzliSandboxError("Payzli returned an unreadable payment response.", 502);
  }
  const record = payload as { id?: unknown; status?: unknown; reconciliationId?: unknown };
  if (typeof record.id !== "string" || typeof record.status !== "string") {
    throw new PayzliSandboxError("Payzli did not return a payment id.", 502);
  }
  return {
    id: record.id,
    status: record.status,
    reconciliationId: typeof record.reconciliationId === "string" ? record.reconciliationId : undefined,
  };
}

export function payzliErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: unknown; reason?: unknown };
    const message = typeof parsed.message === "string" ? parsed.message : "";
    const reason = typeof parsed.reason === "string" ? parsed.reason : "";
    const combined = [message, reason].filter(Boolean).join(" ");
    if (combined) return combined;
  } catch {
    // Response was not JSON.
  }
  if (status === 401) {
    return "Payzli rejected the sandbox key. A Meta Key also needs the Kinspring portfolio ID.";
  }
  return `Payzli sandbox request failed (${status}).`;
}

type CaptureContextPayload = {
  ctx?: Array<{ data?: { clientLibrary?: string; clientLibraryIntegrity?: string } }>;
};

function decodeJwtPayload(token: string): CaptureContextPayload {
  const segment = token.split(".")[1];
  if (!segment) throw new PayzliSandboxError("Payzli returned an unreadable checkout session.", 502);
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
  try {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as CaptureContextPayload;
  } catch {
    throw new PayzliSandboxError("Payzli returned an unreadable checkout session.", 502);
  }
}
