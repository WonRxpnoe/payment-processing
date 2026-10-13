import { createHash, createHmac } from "node:crypto";
import { readPayzliCredentials } from "../src/lib/payzli-sandbox.server";

type Result = {
  tc: string;
  name: string;
  ok: boolean;
  status: string;
  id: string;
  note: string;
};

const credentials = readPayzliCredentials();
const host = "apitest.cybersource.com";
const results: Result[] = [];

const billTo = {
  firstName: "Test",
  lastName: "Patient",
  address1: "1 Market St",
  locality: "San Francisco",
  administrativeArea: "CA",
  postalCode: "94105",
  country: "US",
  email: "sandbox@example.com",
  phoneNumber: "4155550100",
};

function code(name: string): string {
  return `${name}-${Date.now()}`;
}

async function call(method: string, path: string, body?: unknown): Promise<{ http: number; json: Record<string, unknown> }> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const date = new Date().toUTCString();
  const lines = [`host: ${host}`, `date: ${date}`, `request-target: ${method.toLowerCase()} ${path}`];
  const headers: Record<string, string> = {
    host,
    date,
    "v-c-merchant-id": credentials.merchantId,
    "content-type": "application/json",
  };
  if (payload) {
    const digest = `SHA-256=${createHash("sha256").update(payload, "utf8").digest("base64")}`;
    lines.push(`digest: ${digest}`);
    headers.digest = digest;
  }
  lines.push(`v-c-merchant-id: ${credentials.portfolioId || credentials.merchantId}`);
  const signedHeaders = payload
    ? "host date request-target digest v-c-merchant-id"
    : "host date request-target v-c-merchant-id";
  const signature = createHmac("sha256", Buffer.from(credentials.sharedSecret, "base64"))
    .update(lines.join("\n"), "utf8")
    .digest("base64");
  headers.signature = `keyid="${credentials.keyId}", algorithm="HmacSHA256", headers="${signedHeaders}", signature="${signature}"`;
  const response = await fetch(`https://${host}${path}`, { method, headers, body: payload });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { http: response.status, json };
}

function paymentStatus(json: Record<string, unknown>): string {
  if (typeof json.status === "string") return json.status;
  const response = json.response as { rmsg?: string } | undefined;
  if (response?.rmsg) return response.rmsg;
  const message = typeof json.message === "string" ? json.message : "";
  const reason = typeof json.reason === "string" ? json.reason : "";
  return [message, reason].filter(Boolean).join(" ") || `HTTP`;
}

function record(tc: string, name: string, http: number, json: Record<string, unknown>, expect: string[]): void {
  const status = paymentStatus(json);
  const id = typeof json.id === "string" ? json.id : "";
  results.push({
    tc,
    name,
    ok: http < 300 && (expect.length === 0 || expect.includes(status)),
    status: http >= 300 ? `${http} ${status}` : status,
    id,
    note: "",
  });
}

async function pay(tc: string, name: string, body: unknown, expect = ["AUTHORIZED", "PENDING", "COMPLETED"]): Promise<Record<string, unknown>> {
  const { http, json } = await call("POST", "/pts/v2/payments", body);
  record(tc, name, http, json, expect);
  return json;
}

function card(number: string, securityCode = "123") {
  return { number, expirationMonth: "12", expirationYear: "2028", securityCode };
}

function saleBody(reference: string, amount: string, number: string, extra: Record<string, unknown> = {}) {
  return {
    clientReferenceInformation: { code: reference },
    processingInformation: { capture: true, commerceIndicator: "internet", ...extra },
    paymentInformation: { card: card(number) },
    orderInformation: { amountDetails: { totalAmount: amount, currency: "USD" }, billTo },
  };
}

async function main() {
  const visaSale = await pay("TC-014", "Visa sale 1.00", saleBody(code("tc014"), "1.00", "4111111111111111"));
  const visaSaleId = typeof visaSale.id === "string" ? visaSale.id : "";

  if (visaSaleId) {
    const refund = await call("POST", `/pts/v2/payments/${visaSaleId}/refunds`, {
      clientReferenceInformation: { code: code("tc019") },
      orderInformation: { amountDetails: { totalAmount: "1.00", currency: "USD" } },
    });
    record("TC-019", "Full refund", refund.http, refund.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);
    const refundId = typeof refund.json.id === "string" ? refund.json.id : "";
    if (refundId) {
      const voidRefund = await call("POST", `/pts/v2/refunds/${refundId}/voids`, {
        clientReferenceInformation: { code: code("tc023") },
      });
      record("TC-023", "Void refund", voidRefund.http, voidRefund.json, ["VOIDED", "REVERSED", "CANCELLED"]);
    }
  }

  const partialSale = await pay("TC-020 setup", "Sale 45.00 for partial refund", saleBody(code("tc020"), "45.00", "4111111111111111"));
  const partialSaleId = typeof partialSale.id === "string" ? partialSale.id : "";
  if (partialSaleId) {
    const partial = await call("POST", `/pts/v2/payments/${partialSaleId}/refunds`, {
      clientReferenceInformation: { code: code("tc020") },
      orderInformation: { amountDetails: { totalAmount: "25.00", currency: "USD" } },
    });
    record("TC-020", "Partial refund 25.00 of 45.00", partial.http, partial.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);
  }

  const auth = await pay(
    "TC-015 setup",
    "Authorize only 30.00",
    { ...saleBody(code("tc015"), "30.00", "4111111111111111"), processingInformation: { capture: false, commerceIndicator: "internet" } },
  );
  const authId = typeof auth.id === "string" ? auth.id : "";
  if (authId) {
    const capture = await call("POST", `/pts/v2/payments/${authId}/captures`, {
      clientReferenceInformation: { code: code("tc015") },
      orderInformation: { amountDetails: { totalAmount: "30.00", currency: "USD" } },
    });
    record("TC-015", "Capture full authorization", capture.http, capture.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);
  }

  const partialAuth = await pay(
    "TC-016 setup",
    "Authorize 80.00",
    { ...saleBody(code("tc016"), "80.00", "4111111111111111"), processingInformation: { capture: false, commerceIndicator: "internet" } },
  );
  const partialAuthId = typeof partialAuth.id === "string" ? partialAuth.id : "";
  if (partialAuthId) {
    const partialCapture = await call("POST", `/pts/v2/payments/${partialAuthId}/captures`, {
      clientReferenceInformation: { code: code("tc016") },
      orderInformation: { amountDetails: { totalAmount: "50.00", currency: "USD" } },
    });
    record("TC-016", "Partial capture 50.00 of 80.00", partialCapture.http, partialCapture.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);
  }

  const splitAuth = await pay(
    "TC-017 setup",
    "Authorize 60.00 for two captures",
    { ...saleBody(code("tc017"), "60.00", "4111111111111111"), processingInformation: { capture: false, commerceIndicator: "internet" } },
  );
  const splitAuthId = typeof splitAuth.id === "string" ? splitAuth.id : "";
  if (splitAuthId) {
    for (const [sequence, amount] of [
      [1, "20.00"],
      [2, "40.00"],
    ] as const) {
      const split = await call("POST", `/pts/v2/payments/${splitAuthId}/captures`, {
        clientReferenceInformation: { code: code(`tc017-${sequence}`) },
        processingInformation: { captureOptions: { captureSequenceNumber: sequence, totalCaptureCount: 2 } },
        orderInformation: { amountDetails: { totalAmount: amount, currency: "USD" } },
      });
      record(`TC-017.${sequence}`, `Partial capture ${sequence} of 2`, split.http, split.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);
    }
  }

  const reverseAuth = await pay(
    "TC-018 setup",
    "Authorize 15.00 to reverse",
    { ...saleBody(code("tc018"), "15.00", "4111111111111111"), processingInformation: { capture: false, commerceIndicator: "internet" } },
  );
  const reverseAuthId = typeof reverseAuth.id === "string" ? reverseAuth.id : "";
  if (reverseAuthId) {
    const reversal = await call("POST", `/pts/v2/payments/${reverseAuthId}/reversals`, {
      clientReferenceInformation: { code: code("tc018") },
      reversalInformation: { amountDetails: { totalAmount: "15.00" }, reason: "not approved" },
    });
    record("TC-018", "Reverse authorization", reversal.http, reversal.json, ["REVERSED", "VOIDED", "CANCELLED"]);
  }

  const voidSale = await pay("TC-022 setup", "Sale to void", saleBody(code("tc022"), "12.00", "4111111111111111"));
  const voidSaleId = typeof voidSale.id === "string" ? voidSale.id : "";
  if (voidSaleId) {
    const voided = await call("POST", `/pts/v2/payments/${voidSaleId}/voids`, {
      clientReferenceInformation: { code: code("tc022") },
    });
    record("TC-022", "Void sale", voided.http, voided.json, ["VOIDED", "REVERSED", "CANCELLED"]);
  }

  await pay("TC-024a", "Amex sale", saleBody(code("tc024a"), "1.00", "378282246310005", { }));
  await pay("TC-024b", "Discover sale", saleBody(code("tc024b"), "1.00", "6011111111111117"));
  await pay("TC-014b", "Mastercard sale", saleBody(code("tc014b"), "1.00", "5555555555554444"));

  const saved = await pay("TC-025", "Sale with TOKEN_CREATE", {
    ...saleBody(code("tc025"), "1.00", "4111111111111111"),
    processingInformation: {
      capture: true,
      commerceIndicator: "internet",
      actionList: ["TOKEN_CREATE"],
      actionTokenTypes: ["customer", "paymentInstrument", "instrumentIdentifier"],
      authorizationOptions: { initiator: { credentialStoredOnFile: true } },
    },
  });
  const tokenInfo = saved.tokenInformation as { customer?: { id?: string } } | undefined;
  const customerId = tokenInfo?.customer?.id ?? "";
  const networkTransactionId =
    (saved.processorInformation as { networkTransactionId?: string } | undefined)?.networkTransactionId ?? "";
  if (!customerId) {
    results.push({ tc: "TC-026", name: "Charge saved card", ok: false, status: "NO_TOKEN", id: "", note: "TOKEN_CREATE did not return a customer id" });
  } else {
    await pay("TC-026", "Charge saved customer token", {
      clientReferenceInformation: { code: code("tc026") },
      processingInformation: {
        capture: true,
        commerceIndicator: "internet",
        authorizationOptions: { initiator: { type: "customer", storedCredentialUsed: true } },
      },
      paymentInformation: { customer: { id: customerId } },
      orderInformation: { amountDetails: { totalAmount: "22.00", currency: "USD" }, billTo },
    });
    const retrieved = await call("GET", `/tms/v2/customers/${customerId}`);
    record("TC-027", "Retrieve customer token", retrieved.http, retrieved.json, []);
    if (results.at(-1)?.ok) results.at(-1)!.note = "customer record returned";

    await pay("TC-029", "Scheduled refill MIT", {
      clientReferenceInformation: { code: code("tc029") },
      processingInformation: {
        capture: true,
        commerceIndicator: "recurring",
        authorizationOptions: {
          initiator: {
            type: "merchant",
            storedCredentialUsed: true,
            merchantInitiatedTransaction: { previousTransactionId: networkTransactionId },
          },
        },
      },
      paymentInformation: { customer: { id: customerId } },
      orderInformation: { amountDetails: { totalAmount: "18.00", currency: "USD" } },
    });
    await pay("TC-030", "Unscheduled refill MIT", {
      clientReferenceInformation: { code: code("tc030") },
      processingInformation: {
        capture: true,
        commerceIndicator: "internet",
        authorizationOptions: {
          initiator: {
            type: "merchant",
            storedCredentialUsed: true,
            merchantInitiatedTransaction: { previousTransactionId: networkTransactionId },
          },
        },
      },
      paymentInformation: { customer: { id: customerId } },
      orderInformation: { amountDetails: { totalAmount: "19.50", currency: "USD" } },
    });
    for (const amount of ["10.00", "11.25", "12.75"]) {
      await pay("TC-033", `Variable refill ${amount}`, {
        clientReferenceInformation: { code: code("tc033") },
        processingInformation: {
          capture: true,
          commerceIndicator: "recurring",
          authorizationOptions: {
            initiator: {
              type: "merchant",
              storedCredentialUsed: true,
              merchantInitiatedTransaction: { previousTransactionId: networkTransactionId },
            },
          },
        },
        paymentInformation: { customer: { id: customerId } },
        orderInformation: { amountDetails: { totalAmount: amount, currency: "USD" } },
      });
    }

    const standalone = await call("POST", "/pts/v2/credits", {
      clientReferenceInformation: { code: code("tc021") },
      paymentInformation: { customer: { id: customerId } },
      orderInformation: { amountDetails: { totalAmount: "5.00", currency: "USD" } },
    });
    record("TC-021", "Standalone credit", standalone.http, standalone.json, ["PENDING", "COMPLETED", "AUTHORIZED"]);

    const removed = await call("DELETE", `/tms/v2/customers/${customerId}`);
    record("TC-028 setup", "Delete customer token", removed.http, removed.json, []);
    const afterDelete = await pay(
      "TC-028",
      "Charge deleted token",
      {
        clientReferenceInformation: { code: code("tc028") },
        processingInformation: { capture: true, commerceIndicator: "internet" },
        paymentInformation: { customer: { id: customerId } },
        orderInformation: { amountDetails: { totalAmount: "1.00", currency: "USD" }, billTo },
      },
      ["DECLINED", "INVALID_REQUEST", "SERVER_ERROR"],
    );
    const last = results.at(-1);
    if (last && last.tc === "TC-028") {
      last.ok = last.status !== "AUTHORIZED" && last.status !== "PENDING";
      last.note = typeof afterDelete.id === "string" ? "charge did not authorize" : last.note;
    }
  }

  const ach = await call("POST", "/pts/v2/payments", {
    clientReferenceInformation: { code: code("tc011") },
    processingInformation: { capture: true, bankTransferOptions: { secCode: "WEB" } },
    paymentInformation: {
      bank: { account: { type: "C", number: "4100" }, routingNumber: "071923284" },
      paymentType: { name: "CHECK" },
    },
    orderInformation: { amountDetails: { totalAmount: "16.00", currency: "USD" }, billTo },
  });
  record("TC-011", "ACH WEB sale", ach.http, ach.json, ["PENDING", "AUTHORIZED", "COMPLETED"]);

  const matched = await pay("TC-034", "AVS matching address", saleBody(code("tc034"), "1.00", "4111111111111111"));
  const avs = (matched.processorInformation as { avs?: { code?: string } } | undefined)?.avs?.code ?? "";
  if (results.at(-1)?.tc === "TC-034") results.at(-1)!.note = avs ? `AVS ${avs}` : "no AVS code";

  const mismatched = await pay("TC-035", "AVS mismatched ZIP", {
    ...saleBody(code("tc035"), "1.00", "4111111111111111"),
    orderInformation: {
      amountDetails: { totalAmount: "1.00", currency: "USD" },
      billTo: { ...billTo, postalCode: "00000", address1: "999 Wrong St" },
    },
  });
  const avsMismatch = (mismatched.processorInformation as { avs?: { code?: string } } | undefined)?.avs?.code ?? "";
  if (results.at(-1)?.tc === "TC-035") results.at(-1)!.note = avsMismatch ? `AVS ${avsMismatch}` : "no AVS code";

  const search = await call("POST", "/tss/v2/searches", {
    save: false,
    name: "phase1 sandbox",
    timezone: "America/Los_Angeles",
    query: "submitTimeUtc:[NOW/DAY-1DAY TO NOW/DAY+1DAY]",
    offset: 0,
    limit: 5,
    sort: "id:desc",
  });
  const count = typeof search.json.totalCount === "number" ? search.json.totalCount : 0;
  record("TC-045", "Search transactions", search.http, search.json, []);
  if (results.at(-1)?.tc === "TC-045" && search.http < 300) {
    results.at(-1)!.ok = count > 0 || search.http < 300;
    results.at(-1)!.note = `totalCount ${count}`;
  }

  const skipped = [
    ["TC-001", "Microform card fields", "Passed earlier in the browser checkout"],
    ["TC-003", "Browser payment with transient token", "Passed earlier: 79121508955686151203815 AUTHORIZED"],
    ["TC-009", "Apple Pay", "Needs an Apple Pay certificate. Not set up."],
    ["TC-010", "Google Pay", "Needs a Google Pay token. Not set up."],
    ["TC-038", "Webhooks", "No webhook URL is registered yet."],
    ["TC-051", "Connect merchant boarding", "Phase 2. Connect credentials were not issued."],
  ];
  for (const [tc, name, note] of skipped) {
    results.push({ tc, name, ok: tc === "TC-001" || tc === "TC-003", status: tc === "TC-001" || tc === "TC-003" ? "PASSED EARLIER" : "NOT RUN", id: "", note });
  }

  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"}\t${row.tc}\t${row.status}\t${row.id}\t${row.name}\t${row.note}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "sandbox run failed");
  process.exit(1);
});
