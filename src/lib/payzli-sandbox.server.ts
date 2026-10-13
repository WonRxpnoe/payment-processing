import {
  PAYZLI_SANDBOX_HOST,
  PayzliSandboxError,
  buildCaptureContextBody,
  buildSaleBody,
  payzliErrorMessage,
  readMicroformLibrary,
  readPaymentResult,
  signPayzliPost,
  type MicroformLibrary,
  type PayzliCredentials,
  type SandboxBillTo,
  type SandboxPaymentResult,
} from "./payzli-sandbox";

export function readPayzliCredentials(env: NodeJS.ProcessEnv = process.env): PayzliCredentials {
  const merchantId = env.PAYZLI_MERCHANT_ID?.trim();
  const keyId = env.PAYZLI_KEY_ID?.trim();
  const sharedSecret = env.PAYZLI_SHARED_SECRET?.trim();
  const portfolioId = env.PAYZLI_PORTFOLIO_ID?.trim();
  if (!merchantId || !keyId || !sharedSecret) {
    throw new PayzliSandboxError("Sandbox credentials are not configured on the server.", 500);
  }
  return { merchantId, keyId, sharedSecret, portfolioId: portfolioId || undefined };
}

export async function createMicroformSession(origin: string, env: NodeJS.ProcessEnv = process.env): Promise<MicroformLibrary> {
  const body = buildCaptureContextBody(origin);
  const responseText = await postPayzli("/microform/v2/sessions", body, readPayzliCredentials(env));
  return readMicroformLibrary(responseText);
}

export async function chargeSandboxCard(
  input: { transientToken: string; amount: string; billTo: SandboxBillTo },
  env: NodeJS.ProcessEnv = process.env,
): Promise<SandboxPaymentResult> {
  const body = buildSaleBody({
    ...input,
    reference: `sandbox-${Date.now()}`,
  });
  const responseText = await postPayzli("/pts/v2/payments", body, readPayzliCredentials(env));
  return readPaymentResult(JSON.parse(responseText) as unknown);
}

async function postPayzli(path: string, body: string, credentials: PayzliCredentials): Promise<string> {
  const signed = signPayzliPost({
    path,
    body,
    credentials,
    date: new Date().toUTCString(),
    host: PAYZLI_SANDBOX_HOST,
  });
  const response = await fetch(signed.url, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new PayzliSandboxError(payzliErrorMessage(response.status, text), response.status);
  }
  return text;
}
