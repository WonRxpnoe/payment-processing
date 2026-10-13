/**
 * Connect application flow — smoke and fetch mocks.
 * Machine-only. No network.
 * Run: npm run test:smoke
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assessApplication, previewPortalSteps } from "./payzli-connect";
import {
  clearIndustryCache,
  createMerchantAccount,
  loadReferenceStatus,
  readConnectCredentials,
  runApplicationFlow,
  searchIndustries,
  type ApplicationFlowResult,
} from "./payzli-connect.server";
import type { MerchantApplicationInput } from "./payzli-connect";

const demoEnv = {
  PAYZLI_CONNECT_BASE_URL: "https://demo.connect.payzli.com",
  PAYZLI_CONNECT_TOKEN: "test-token",
} as NodeJS.ProcessEnv;

const application: MerchantApplicationInput = {
  organizationName: "Kithpay Connect Test",
  dbaName: "Kithpay Connect Test",
  businessTypeName: "LLC Private",
  taxId: "12-3456789",
  businessPhone: "4155550100",
  businessEmail: "sandbox@example.com",
  websiteUrl: "https://example.com",
  address1: "1 Market St",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  mailingAddress1: "2 Mission St",
  mailingCity: "San Francisco",
  mailingState: "CA",
  mailingPostalCode: "94107",
  signerFirstName: "Test",
  signerLastName: "Applicant",
  signerBirthDate: "1985-04-12",
  signerEmail: "sandbox@example.com",
  signerPhone: "4155550100",
  signerOwnership: 100,
  signerTitle: 11,
  signerSsn: "000-00-0000",
  driverLicenseState: "CA",
  driverLicenseNumber: "D1234567",
  bankName: "Test Bank",
  routingNumber: "021000021",
  accountNumber: "000123456789",
  accountType: "Checking",
  industryId: 7,
  mccCode: "8011",
  mccDescription: "Doctors and physicians",
};

const storedFile = {
  documentId: "government_id",
  fileName: "id.txt",
  attachmentType: 1,
  bytes: Buffer.from("photo-id"),
};

type MockResponse = { status?: number; body: unknown };
type RecordedCall = { url: string; body: string; authorization: string; form: boolean };

function installFetch(routes: Record<string, MockResponse>): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      body: typeof init?.body === "string" ? init.body : "",
      authorization: headers.get("authorization") ?? "",
      form: typeof FormData !== "undefined" && init?.body instanceof FormData,
    });
    const match = Object.entries(routes).find(([path]) => url.includes(path));
    const response = match?.[1] ?? { status: 500, body: { Succeeded: false, ErrorMessage: "Unmocked Connect call." } };
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  });
  return calls;
}

function states(result: ApplicationFlowResult): string[] {
  return result.steps.map((step) => step.state);
}

beforeEach(() => {
  clearIndustryCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearIndustryCache();
});

describe("step 1 reference data — smoke", () => {
  it("rejects a host that is not Payzli Connect", () => {
    expect(() => readConnectCredentials({ PAYZLI_CONNECT_BASE_URL: "https://example.com", PAYZLI_CONNECT_TOKEN: "token" })).toThrow(
      "Connect origin is not a Payzli Connect host.",
    );
  });

  it("requires a token or a username and password", () => {
    expect(() => readConnectCredentials({ PAYZLI_CONNECT_BASE_URL: "https://demo.connect.payzli.com" })).toThrow(
      "Connect credentials are not configured",
    );
  });
});

describe("step 1 reference data — mock", () => {
  it("loads business types and reports that templates are missing", async () => {
    const calls = installFetch({
      get_business_types: {
        body: {
          Succeeded: true,
          Output: { BusinessTypes: [{ business_type_id: "5", business_type_name: "LLC Private" }] },
        },
      },
      get_merchant_templates: { status: 500, body: { Succeeded: false, ErrorCode: "SERVER_FAULT", ErrorMessage: "Server fault" } },
    });

    const status = await loadReferenceStatus(demoEnv);

    expect(status.ready).toBe(true);
    expect(status.businessTypes).toEqual([{ id: "5", name: "LLC Private" }]);
    expect(status.detail).toContain("Business types loaded");
    expect(status.detail).toContain("Merchant templates are not available");
    expect(calls.map((call) => call.url)).toEqual([
      "https://demo.connect.payzli.com/api/v3/connect/get_business_types",
      "https://demo.connect.payzli.com/api/v3/connect/get_merchant_templates",
    ]);
    expect(calls.every((call) => call.authorization === "Bearer test-token")).toBe(true);
  });

  it("exchanges a username and password for a token before the lookup", async () => {
    const calls = installFetch({
      get_token: { body: { Succeeded: true, Output: { token: "issued-token" } } },
      get_business_types: {
        body: { Succeeded: true, Output: { BusinessTypes: [{ business_type_id: "3", business_type_name: "Sole Proprietorship" }] } },
      },
      get_merchant_templates: { body: { Succeeded: true, Output: { templates: [] } } },
    });

    const status = await loadReferenceStatus({
      PAYZLI_CONNECT_BASE_URL: "https://demo.connect.payzli.com",
      PAYZLI_CONNECT_USERNAME: "partner@example.com",
      PAYZLI_CONNECT_PASSWORD: "secret-value",
    });

    expect(status.detail).toContain("Merchant templates loaded.");
    expect(calls[0]?.url).toContain("/api/v1/connect/auth/get_token");
    expect(calls[0]?.body).toContain("partner@example.com");
    expect(calls[1]?.authorization).toBe("Bearer issued-token");
    expect(calls[1]?.body).not.toContain("secret-value");
  });

  it("searches industries from one mocked list and then uses the cache", async () => {
    const calls = installFetch({
      get_industries: {
        body: {
          Succeeded: true,
          Output: {
            Industries: [
              { mcc_code: "8011", description: "Doctors and physicians" },
              { mcc_code: "0742", description: "Veterinary Services" },
            ],
          },
        },
      },
    });

    const first = await searchIndustries("doctor", demoEnv);
    const second = await searchIndustries("8011", demoEnv);

    expect(first).toEqual([{ mccCode: "8011", description: "Doctors and physicians" }]);
    expect(second).toEqual([{ mccCode: "8011", description: "Doctors and physicians" }]);
    expect(calls).toHaveLength(1);
  });

  it("names the production portal and does not reuse the other host's industry list", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("get_business_types")) {
        return new Response(JSON.stringify({
          Succeeded: true,
          Output: { BusinessTypes: [{ business_type_id: "5", business_type_name: "LLC Private" }] },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (url.includes("get_merchant_templates")) {
        return new Response(JSON.stringify({ Succeeded: true, Output: {} }), { status: 200, headers: { "content-type": "application/json" } });
      }
      const description = url.startsWith("https://connect.payzli.com") ? "Production clinics" : "Doctors and physicians";
      return new Response(JSON.stringify({
        Succeeded: true,
        Output: { Industries: [{ mcc_code: "8011", description }] },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const liveEnv = { PAYZLI_CONNECT_BASE_URL: "https://connect.payzli.com", PAYZLI_CONNECT_TOKEN: "live-token" } as NodeJS.ProcessEnv;
    const status = await loadReferenceStatus(liveEnv);
    const demo = await searchIndustries("8011", demoEnv);
    const live = await searchIndustries("8011", liveEnv);

    expect(status.portal).toBe("production");
    expect(status.detail).toContain("Business types loaded from the Production portal.");
    expect(status.detail).not.toContain("Demo portal");
    expect(demo[0]?.description).toBe("Doctors and physicians");
    expect(live[0]?.description).toBe("Production clinics");
    expect(calls.filter((url) => url.includes("get_industries"))).toHaveLength(2);
  });
});

describe("step 2 application — smoke", () => {
  it("keeps a clinic on tier 1 and blocks a prohibited line", () => {
    const clinic = assessApplication({ lineOfBusiness: "healthcare_clinic", channel: "card_not_present", monthlyVolume: "up_to_250k" });
    const banned = assessApplication({ lineOfBusiness: "crypto", channel: "card_present", monthlyVolume: "up_to_250k" });
    expect(clinic.blocked).toBe(false);
    expect(clinic.documents.map((item) => item.id)).toEqual(["government_id", "articles", "bank_letter"]);
    expect(banned.blocked).toBe(true);
    expect(banned.documents).toEqual([]);
  });
});

describe("step 2 application — mock", () => {
  it("decides the application without calling Payzli", () => {
    const calls = installFetch({});
    const assessment = assessApplication({ lineOfBusiness: "telemedicine", channel: "card_not_present", monthlyVolume: "250k_500k" });
    const unfinished = previewPortalSteps({ referenceReady: true, referenceDetail: "Ready.", portalLabel: "Demo portal", applicationReady: false, assessment });
    const ready = previewPortalSteps({ referenceReady: true, referenceDetail: "Ready.", portalLabel: "Demo portal", applicationReady: true, assessment });
    expect(assessment.tier).toBe(3);
    expect(unfinished.find((step) => step.id === "application")?.state).toBe("waiting");
    expect(ready.find((step) => step.id === "application")?.state).toBe("complete");
    expect(calls).toEqual([]);
  });
});

describe("step 3 create account and attachments — smoke", () => {
  it("targets the create endpoint that does not email the merchant away", async () => {
    const calls = installFetch({
      create_merchant_account: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });
    await expect(createMerchantAccount(application, demoEnv)).rejects.toThrow("refused to create");
    expect(calls[0]?.url).toBe("https://demo.connect.payzli.com/api/v3/connect/create_merchant_account");
    expect(calls[0]?.url).not.toContain("create_merchant_account_v3");
    expect(calls[0]?.body).toContain("000000000");
    expect(calls[0]?.body).not.toContain("000-00-0000");
    expect(calls[0]?.body).toContain("021000021");
  });
});

describe("step 3 create account and attachments — mock", () => {
  it("stores the attachment only after the account id comes back", async () => {
    const calls = installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-1" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
      complete_and_esign: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
      get_merchant_application: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });

    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    const attachmentCall = calls.find((call) => call.url.includes("add_attachments"));

    expect(result.merchantAccountId).toBe("merchant-1");
    expect(result.steps.find((step) => step.id === "create")?.detail).toContain("1 files stored.");
    expect(attachmentCall?.form).toBe(true);
    expect(attachmentCall?.url).toContain("merchant_account_id=merchant-1");
    expect(attachmentCall?.url).toContain("attachment_type=1");
    expect(calls.findIndex((call) => call.url.includes("create_merchant_account"))).toBeLessThan(
      calls.findIndex((call) => call.url.includes("add_attachments")),
    );
  });

  it("does not upload when create is refused", async () => {
    const calls = installFetch({
      create_merchant_account: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });
    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    expect(result.steps.find((step) => step.id === "create")?.state).toBe("blocked");
    expect(calls.some((call) => call.url.includes("add_attachments"))).toBe(false);
  });

  it("keeps the account and marks attachments unavailable when the file is refused", async () => {
    installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-6" } },
      add_attachments: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
      get_plaid_link_token: { body: { Succeeded: true } },
      complete_and_esign: { body: { Succeeded: true } },
      get_merchant_application: { body: { Succeeded: true, Output: { organization_name: "Kithpay Connect Test" } } },
    });
    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    const create = result.steps.find((step) => step.id === "create");
    expect(result.merchantAccountId).toBe("merchant-6");
    expect(create?.state).toBe("unavailable");
    expect(create?.detail).toContain("refused to store this attachment");
    expect(result.steps.find((step) => step.id === "bank")?.state).toBe("complete");
    expect(result.steps.find((step) => step.id === "verify")?.state).toBe("complete");
  });
});

describe("step 4 bank, Plaid, and e-sign — smoke", () => {
  it("waits to open Plaid until a merchant account exists", () => {
    const steps = previewPortalSteps({
      referenceReady: true,
      referenceDetail: "Ready.",
      portalLabel: "Demo portal",
      applicationReady: false,
      assessment: assessApplication({ lineOfBusiness: "healthcare_clinic", channel: "card_present", monthlyVolume: "up_to_250k" }),
    });
    expect(steps.find((step) => step.id === "bank")?.detail).toContain("Plaid and e-sign run after");
  });
});

describe("step 4 bank, Plaid, and e-sign — mock", () => {
  it("records Plaid and e-sign separately and still finishes when e-sign is refused", async () => {
    installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-2" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { body: { Succeeded: true, Output: "link-token" } },
      complete_and_esign: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
      get_merchant_application: { body: { Succeeded: true, Output: { organization_details: { organization_name: "Kithpay Connect Test" } } } },
    });

    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    const bank = result.steps.find((step) => step.id === "bank");
    expect(bank?.state).toBe("complete");
    expect(bank?.detail).toContain("Plaid link token issued.");
    expect(bank?.detail).toContain("refused to complete e-sign");
  });

  it("does not call Plaid or e-sign when create is refused", async () => {
    const calls = installFetch({
      create_merchant_account: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });
    const result = await runApplicationFlow({ ...application, files: [], referenceDetail: "Ready." }, demoEnv);
    expect(result.steps.find((step) => step.id === "bank")?.state).toBe("waiting");
    expect(calls.some((call) => call.url.includes("get_plaid_link_token") || call.url.includes("complete_and_esign"))).toBe(false);
  });
});

describe("step 5 read the application back — smoke", () => {
  it("names the read-back step and leaves it waiting before submit", () => {
    const steps = previewPortalSteps({
      referenceReady: false,
      referenceDetail: "Loading.",
      portalLabel: "Demo portal",
      applicationReady: false,
      assessment: assessApplication({ lineOfBusiness: "healthcare_clinic", channel: "card_not_present", monthlyVolume: "up_to_250k" }),
    });
    expect(steps.map((step) => step.id)).toEqual(["reference", "application", "create", "bank", "verify"]);
    expect(steps.find((step) => step.id === "verify")?.state).toBe("waiting");
  });
});

describe("step 5 read the application back — mock", () => {
  it("reads the business name back from the demo portal", async () => {
    const calls = installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-3" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { body: { Succeeded: true } },
      complete_and_esign: { body: { Succeeded: true } },
      get_merchant_application: { body: { Succeeded: true, Output: { organization_details: { organization_name: "Kithpay Connect Test" } } } },
    });

    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    const verify = result.steps.find((step) => step.id === "verify");
    const readCall = calls.find((call) => call.url.includes("get_merchant_application"));
    expect(verify?.state).toBe("complete");
    expect(verify?.detail).toBe("Demo portal returned Kithpay Connect Test.");
    expect(readCall?.body).toBe('{"merchant_account_id":"merchant-3"}');
  });

  it("keeps the created account when read-back is refused", async () => {
    installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-4" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { body: { Succeeded: true } },
      complete_and_esign: { body: { Succeeded: true } },
      get_merchant_application: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });
    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Ready." }, demoEnv);
    expect(result.merchantAccountId).toBe("merchant-4");
    expect(result.steps.find((step) => step.id === "create")?.state).toBe("complete");
    expect(result.steps.find((step) => step.id === "verify")?.state).toBe("unavailable");
  });
});

describe("all five steps — smoke", () => {
  it("lists the five portal steps in order before anything is submitted", () => {
    const steps = previewPortalSteps({
      referenceReady: true,
      referenceDetail: "Business types loaded.",
      portalLabel: "Demo portal",
      applicationReady: false,
      assessment: assessApplication({ lineOfBusiness: "healthcare_clinic", channel: "card_not_present", monthlyVolume: "up_to_250k" }),
    });
    expect(steps.map((step) => [step.id, step.state])).toEqual([
      ["reference", "complete"],
      ["application", "waiting"],
      ["create", "waiting"],
      ["bank", "waiting"],
      ["verify", "waiting"],
    ]);
  });
});

describe("all five steps — mock", () => {
  it("completes reference through read-back on the demo host", async () => {
    const calls = installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-5" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { body: { Succeeded: true } },
      complete_and_esign: { body: { Succeeded: true } },
      get_merchant_application: { body: { Succeeded: true, Output: { organization_details: { organization_name: "Kithpay Connect Test" } } } },
    });

    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Business types loaded." }, demoEnv);

    expect(states(result)).toEqual(["complete", "complete", "complete", "complete", "complete"]);
    expect(calls.every((call) => call.url.startsWith("https://demo.connect.payzli.com"))).toBe(true);
    expect(calls.some((call) => call.url.includes("create_merchant_account_v3"))).toBe(false);
  });

  it("stops after create on the same five steps when the demo key cannot create", async () => {
    const calls = installFetch({
      create_merchant_account: { status: 400, body: { Succeeded: false, ErrorCode: "PERMISSION_DENIED", ErrorMessage: "Bad request" } },
    });
    const result = await runApplicationFlow({ ...application, files: [storedFile], referenceDetail: "Business types loaded." }, demoEnv);
    expect(states(result)).toEqual(["complete", "complete", "blocked", "waiting", "waiting"]);
    expect(calls).toHaveLength(1);
  });

  it("sends the same five calls to the production host when that origin is configured", async () => {
    const calls = installFetch({
      create_merchant_account: { body: { Succeeded: true, Output: "merchant-live" } },
      add_attachments: { body: { Succeeded: true } },
      get_plaid_link_token: { body: { Succeeded: true } },
      complete_and_esign: { body: { Succeeded: true } },
      get_merchant_application: { body: { Succeeded: true, Output: { organization_name: "Kithpay Connect Test" } } },
    });
    const result = await runApplicationFlow(
      { ...application, files: [storedFile], referenceDetail: "Ready." },
      { PAYZLI_CONNECT_BASE_URL: "https://connect.payzli.com", PAYZLI_CONNECT_TOKEN: "live-token" },
    );
    expect(states(result)).toEqual(["complete", "complete", "complete", "complete", "complete"]);
    expect(result.steps.find((step) => step.id === "create")?.detail).toContain("Production portal accepted merchant account merchant-live.");
    expect(result.steps.find((step) => step.id === "verify")?.detail).toBe("Production portal returned Kithpay Connect Test.");
    expect(calls.every((call) => call.url.startsWith("https://connect.payzli.com"))).toBe(true);
    expect(calls.every((call) => call.authorization === "Bearer live-token")).toBe(true);
  });
});
