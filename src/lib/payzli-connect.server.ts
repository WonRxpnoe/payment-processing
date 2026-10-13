import {
  CREATE_MERCHANT_ACCOUNT_PATH,
  PAYZLI_CONNECT_DEMO_ORIGIN,
  PAYZLI_CONNECT_PRODUCTION_ORIGIN,
  buildCreateMerchantBody,
  connectFailureMessage,
  connectPortalLabel,
  filterIndustries,
  organizationNameFrom,
  readConnectResult,
  submittedPortalSteps,
  type IndustryMatch,
  type MerchantApplicationInput,
  type PortalStep,
} from "./payzli-connect";

export type ConnectCredentials = {
  origin: string;
  token?: string;
  username?: string;
  password?: string;
};

export class PayzliConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayzliConnectError";
  }
}

type BusinessType = {
  id: string;
  name: string;
};

export type ReferenceStatus = {
  businessTypes: BusinessType[];
  ready: boolean;
  detail: string;
  portal: "demo" | "production";
};

export type ApplicationFlowResult = {
  merchantAccountId: string;
  steps: PortalStep[];
};

type StoredFile = {
  documentId: string;
  fileName: string;
  attachmentType: number;
  bytes: Buffer;
};

let industryCache: { origin: string; industries: IndustryMatch[] } | null = null;

export function clearIndustryCache(): void {
  industryCache = null;
}

export function readConnectCredentials(env: NodeJS.ProcessEnv = process.env): ConnectCredentials {
  const configured = env["PAYZLI_CONNECT_BASE_URL"]?.trim();
  const origin = configured || PAYZLI_CONNECT_DEMO_ORIGIN;
  if (origin !== PAYZLI_CONNECT_DEMO_ORIGIN && origin !== PAYZLI_CONNECT_PRODUCTION_ORIGIN) {
    throw new PayzliConnectError("Connect origin is not a Payzli Connect host.");
  }
  const token = env["PAYZLI_CONNECT_TOKEN"]?.trim();
  const username = env["PAYZLI_CONNECT_USERNAME"]?.trim();
  const password = env["PAYZLI_CONNECT_PASSWORD"]?.trim();
  if (!token && !(username && password)) {
    throw new PayzliConnectError("Connect credentials are not configured on the server.");
  }
  return {
    origin,
    ...(token ? { token } : {}),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}

export async function loadReferenceStatus(env: NodeJS.ProcessEnv = process.env): Promise<ReferenceStatus> {
  const credentials = readConnectCredentials(env);
  const businessTypes = await loadBusinessTypes(env);
  let templates = "Merchant templates are not available on this key.";
  try {
    const payload = await postConnect("/api/v3/connect/get_merchant_templates", {}, env, "load merchant templates");
    const result = readConnectResult(payload);
    templates = result.succeeded ? "Merchant templates loaded." : "Merchant templates are not available on this key.";
  } catch {
    templates = "Merchant templates are not available on this key.";
  }
  return {
    businessTypes,
    ready: businessTypes.length > 0,
    portal: credentials.origin === PAYZLI_CONNECT_PRODUCTION_ORIGIN ? "production" : "demo",
    detail: `Business types loaded from the ${connectPortalLabel(credentials.origin)}. ${templates}`,
  };
}

export async function loadBusinessTypes(env: NodeJS.ProcessEnv = process.env): Promise<BusinessType[]> {
  const payload = await postConnect("/api/v3/connect/get_business_types", {}, env, "load business types");
  const result = readConnectResult(payload);
  if (!result.succeeded) throw new PayzliConnectError(connectFailureMessage(result, "load business types"));
  const output = (payload as { Output?: { BusinessTypes?: Array<{ business_type_id?: string; business_type_name?: string }> } }).Output;
  const types = output?.BusinessTypes ?? [];
  return types
    .filter((item) => item.business_type_id && item.business_type_name)
    .map((item) => ({ id: item.business_type_id as string, name: item.business_type_name as string }));
}

export async function searchIndustries(query: string, env: NodeJS.ProcessEnv = process.env): Promise<IndustryMatch[]> {
  const origin = readConnectCredentials(env).origin;
  if (!industryCache || industryCache.origin !== origin) {
    const payload = await postConnect("/api/v3/connect/get_industries", {}, env, "load industries");
    const result = readConnectResult(payload);
    if (!result.succeeded) throw new PayzliConnectError(connectFailureMessage(result, "load industries"));
    const industries = (payload as { Output?: { Industries?: Array<{ mcc_code?: string; description?: string }> } }).Output?.Industries ?? [];
    industryCache = {
      origin,
      industries: industries
        .filter((item) => item.mcc_code && item.description)
        .map((item) => ({ mccCode: item.mcc_code as string, description: item.description as string })),
    };
  }
  return filterIndustries(industryCache.industries, query);
}

export async function createMerchantAccount(
  input: MerchantApplicationInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const payload = await postConnect(CREATE_MERCHANT_ACCOUNT_PATH, JSON.parse(buildCreateMerchantBody(input)) as unknown, env, "create this merchant account");
  const result = readConnectResult(payload);
  if (!result.succeeded || !result.output) throw new PayzliConnectError(connectFailureMessage(result, "create this merchant account"));
  return result.output;
}

export async function runApplicationFlow(
  input: MerchantApplicationInput & { files: StoredFile[]; referenceDetail: string },
  env: NodeJS.ProcessEnv = process.env,
): Promise<ApplicationFlowResult> {
  let merchantAccountId = "";
  let createDetail = "";
  try {
    merchantAccountId = await createMerchantAccount(input, env);
    createDetail = `${connectPortalLabel(readConnectCredentials(env).origin)} accepted merchant account ${merchantAccountId}.`;
  } catch (error) {
    createDetail = error instanceof Error ? error.message : "Payzli did not accept the application.";
  }

  const attachment = merchantAccountId
    ? await storeAttachments(merchantAccountId, input.files, env)
    : { detail: "Documents wait for a merchant account.", stored: 0, accepted: false };
  const bank = merchantAccountId
    ? await bankAndSignatureStatus(merchantAccountId, env)
    : {
        state: "waiting" as const,
        detail: "Account and routing numbers are in the application. Plaid and e-sign wait for a merchant account.",
      };
  const verify = merchantAccountId
    ? await readMerchantApplication(merchantAccountId, env)
    : { verified: false, detail: "Read-back waits for a merchant account." };

  return {
    merchantAccountId,
    steps: submittedPortalSteps({
      referenceDetail: input.referenceDetail,
      createDetail,
      merchantAccountId,
      attachmentDetail: attachment.detail,
      attachmentsAccepted: attachment.accepted,
      bankDetail: bank.detail,
      bankState: bank.state,
      verifyDetail: verify.detail,
      verified: verify.verified,
    }),
  };
}

export async function uploadMerchantAttachment(
  input: { merchantAccountId: string; fileName: string; attachmentType: number; bytes: Buffer },
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const credentials = readConnectCredentials(env);
  const token = await bearerToken(credentials);
  const params = new URLSearchParams({
    merchant_account_id: input.merchantAccountId,
    attachment_file_name: input.fileName,
    attachment_type: String(input.attachmentType),
  });
  const body = new FormData();
  body.set("file", new Blob([new Uint8Array(input.bytes)]), input.fileName);
  const response = await fetch(`${credentials.origin}/api/v3/connect/add_attachments?${params}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body,
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : {};
  const result = readConnectResult(payload);
  if (!response.ok || !result.succeeded) throw new PayzliConnectError(connectFailureMessage(result, "store this attachment"));
}

async function storeAttachments(
  merchantAccountId: string,
  files: StoredFile[],
  env: NodeJS.ProcessEnv,
): Promise<{ detail: string; stored: number; accepted: boolean }> {
  const failures: string[] = [];
  let stored = 0;
  for (const file of files) {
    try {
      await uploadMerchantAttachment(
        { merchantAccountId, fileName: file.fileName, attachmentType: file.attachmentType, bytes: file.bytes },
        env,
      );
      stored += 1;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : file.fileName);
    }
  }
  if (failures.length > 0) return { stored, accepted: false, detail: `${stored} files stored. ${failures.join(" ")}` };
  return { stored, accepted: true, detail: `${stored} files stored.` };
}

async function bankAndSignatureStatus(
  merchantAccountId: string,
  env: NodeJS.ProcessEnv,
): Promise<{ state: "complete" | "unavailable"; detail: string }> {
  const plaid = await callLabel("Plaid", () => requestPlaidLink(merchantAccountId, env));
  const esign = await callLabel("E-sign", () => requestEsign(merchantAccountId, env));
  const state = plaid.ok || esign.ok ? "complete" : "unavailable";
  return { state, detail: `${plaid.detail} ${esign.detail}` };
}

async function requestPlaidLink(merchantAccountId: string, env: NodeJS.ProcessEnv): Promise<string> {
  const payload = await postConnect(
    "/api/v3/connect/get_plaid_link_token",
    { merchant_account_id: merchantAccountId, product: 0, platform: 0 },
    env,
    "open Plaid",
  );
  const result = readConnectResult(payload);
  if (!result.succeeded) throw new PayzliConnectError(connectFailureMessage(result, "open Plaid"));
  return "Plaid link token issued.";
}

async function requestEsign(merchantAccountId: string, env: NodeJS.ProcessEnv): Promise<string> {
  const payload = await postConnect(
    "/api/v3/connect/complete_and_esign",
    { merchant_account_id: merchantAccountId },
    env,
    "complete e-sign",
  );
  const result = readConnectResult(payload);
  if (!result.succeeded) throw new PayzliConnectError(connectFailureMessage(result, "complete e-sign"));
  return "E-sign completed.";
}

async function readMerchantApplication(
  merchantAccountId: string,
  env: NodeJS.ProcessEnv,
): Promise<{ verified: boolean; detail: string }> {
  try {
    const payload = await postConnect(
      "/api/v3/connect/get_merchant_application",
      { merchant_account_id: merchantAccountId },
      env,
      "read the application back",
    );
    const result = readConnectResult(payload);
    if (!result.succeeded) {
      return { verified: false, detail: connectFailureMessage(result, "read the application back") };
    }
    const name = organizationNameFrom((payload as { Output?: unknown }).Output);
    const portal = connectPortalLabel(readConnectCredentials(env).origin);
    return {
      verified: true,
      detail: name ? `${portal} returned ${name}.` : `${portal} returned the application.`,
    };
  } catch (error) {
    return { verified: false, detail: error instanceof Error ? error.message : "Read-back failed." };
  }
}

async function callLabel(label: string, action: () => Promise<string>): Promise<{ ok: boolean; detail: string }> {
  try {
    return { ok: true, detail: `${label}: ${await action()}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : `${label} is unavailable.`;
    return { ok: false, detail: `${label}: ${message}` };
  }
}

async function postConnect(path: string, body: unknown, env: NodeJS.ProcessEnv, action?: string): Promise<unknown> {
  const credentials = readConnectCredentials(env);
  const token = await bearerToken(credentials);
  const response = await fetch(`${credentials.origin}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload: unknown = {};
  try {
    payload = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    throw new PayzliConnectError("Payzli returned an unreadable response.");
  }
  if (!response.ok) {
    throw new PayzliConnectError(connectFailureMessage(readConnectResult(payload), action));
  }
  return payload;
}

async function bearerToken(credentials: ConnectCredentials): Promise<string> {
  if (credentials.token) return credentials.token;
  const response = await fetch(`${credentials.origin}/api/v1/connect/auth/get_token`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ username: credentials.username, password: credentials.password }),
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : {};
  const result = readConnectResult(payload);
  const token = (payload as { Output?: { token?: string } }).Output?.token;
  if (!response.ok || !result.succeeded || !token) {
    throw new PayzliConnectError(connectFailureMessage(result, "sign in"));
  }
  return token;
}
