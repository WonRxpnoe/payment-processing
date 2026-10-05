import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const SANDBOX_TEST_CARD = "4111 1111 1111 1111";
const SANDBOX_SUCCESS_AMOUNT = "1.00";

const captureInput = z.object({
  origin: z.string().url(),
});

const billToInput = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  address1: z.string().trim().min(1).max(80),
  locality: z.string().trim().min(1).max(50),
  administrativeArea: z.string().trim().length(2),
  postalCode: z.string().trim().min(3).max(10),
  email: z.string().trim().email(),
});

const paymentInput = z.object({
  transientToken: z.string().min(20),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  billTo: billToInput,
});

const createSandboxCaptureContext = createServerFn({ method: "POST" })
  .validator((data: unknown) => captureInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const { createMicroformSession } = await import("../../lib/payzli-sandbox.server");
      return await createMicroformSession(data.origin);
    } catch (error) {
      throw new Error(errorText(error));
    }
  });

const chargeSandboxPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => paymentInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const { chargeSandboxCard } = await import("../../lib/payzli-sandbox.server");
      return await chargeSandboxCard(data);
    } catch (error) {
      throw new Error(errorText(error));
    }
  });

export const Route = createFileRoute("/sandbox/checkout")({
  head: () => ({
    meta: [
      { title: "Sandbox checkout" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SandboxCheckoutPage,
});

type MicroformField = {
  load: (selector: string) => void;
};

type Microform = {
  createField: (type: "number" | "securityCode", options: { placeholder: string }) => MicroformField;
  createToken: (
    options: { expirationMonth: string; expirationYear: string },
    callback: (error: { message?: string } | null, token?: string) => void,
  ) => void;
};

type FlexCheckout = {
  microform: (type: "card", options: { styles: Record<string, Record<string, string>> }) => Microform;
};

declare global {
  interface Window {
    Flex?: new (captureContext: string) => FlexCheckout;
  }
}

const EMPTY_RESULT = { status: "", id: "" };

function SandboxCheckoutPage() {
  const microformRef = useRef<Microform | null>(null);
  const [ready, setReady] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [amount, setAmount] = useState(SANDBOX_SUCCESS_AMOUNT);
  const [expirationMonth, setExpirationMonth] = useState("12");
  const [expirationYear, setExpirationYear] = useState("2028");
  const [firstName, setFirstName] = useState("Test");
  const [lastName, setLastName] = useState("Patient");
  const [address1, setAddress1] = useState("1 Market St");
  const [locality, setLocality] = useState("San Francisco");
  const [administrativeArea, setAdministrativeArea] = useState("CA");
  const [postalCode, setPostalCode] = useState("94105");
  const [email, setEmail] = useState("sandbox@example.com");

  useEffect(() => {
    let cancelled = false;
    const fields: HTMLElement[] = [];

    async function mountCardFields() {
      setSetupError("");
      setReady(false);
      try {
        const session = await createSandboxCaptureContext({ data: { origin: window.location.origin } });
        await loadFlexScript(session.clientLibrary, session.clientLibraryIntegrity);
        if (cancelled || !window.Flex) return;
        const flex = new window.Flex(session.captureContext);
        const microform = flex.microform("card", {
          styles: {
            input: { "font-size": "16px", "font-family": "Manrope, Arial, sans-serif", color: "#1d1d1f" },
            ":focus": { color: "#1d1d1f" },
            valid: { color: "#1b873f" },
            invalid: { color: "#c62828" },
          },
        });
        const number = microform.createField("number", { placeholder: "Card number" });
        const securityCode = microform.createField("securityCode", { placeholder: "CVV" });
        number.load("#card-number");
        securityCode.load("#card-cvv");
        fields.push(document.querySelector("#card-number") as HTMLElement, document.querySelector("#card-cvv") as HTMLElement);
        microformRef.current = microform;
        if (!cancelled) setReady(true);
      } catch (error) {
        if (!cancelled) setSetupError(errorText(error));
      }
    }

    void mountCardFields();
    return () => {
      cancelled = true;
      microformRef.current = null;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const microform = microformRef.current;
    if (!microform) {
      setSubmitError("Card fields are still loading.");
      return;
    }
    setPending(true);
    setSubmitError("");
    setResult(EMPTY_RESULT);
    try {
      const transientToken = await requestTransientToken(microform, expirationMonth, expirationYear);
      const payment = await chargeSandboxPayment({
        data: {
          transientToken,
          amount,
          billTo: { firstName, lastName, address1, locality, administrativeArea, postalCode, email },
        },
      });
      setResult({ status: payment.status, id: payment.id });
    } catch (error) {
      setSubmitError(errorText(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-5 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payzli sandbox</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Test clinic checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Card number and CVV are entered in Payzli secure fields. Use test card {SANDBOX_TEST_CARD}, any future
          expiration date, and any three-digit CVV. Amount {SANDBOX_SUCCESS_AMOUNT} is the sandbox success amount.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="Amount (USD)" id="amount">
          <Input id="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiration month" id="expiration-month">
            <Input id="expiration-month" inputMode="numeric" maxLength={2} value={expirationMonth} onChange={(event) => setExpirationMonth(event.target.value)} required />
          </Field>
          <Field label="Expiration year" id="expiration-year">
            <Input id="expiration-year" inputMode="numeric" maxLength={4} value={expirationYear} onChange={(event) => setExpirationYear(event.target.value)} required />
          </Field>
        </div>
        <Field label="Card number" id="card-number">
          <div id="card-number" className="h-9 overflow-hidden rounded-md border border-input bg-background px-3 py-2" />
        </Field>
        <Field label="CVV" id="card-cvv">
          <div id="card-cvv" className="h-9 w-32 overflow-hidden rounded-md border border-input bg-background px-3 py-2" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="first-name">
            <Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </Field>
          <Field label="Last name" id="last-name">
            <Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </Field>
        </div>
        <Field label="Billing address" id="address">
          <Input id="address" value={address1} onChange={(event) => setAddress1(event.target.value)} required />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" id="city">
            <Input id="city" value={locality} onChange={(event) => setLocality(event.target.value)} required />
          </Field>
          <Field label="State" id="state">
            <Input id="state" maxLength={2} value={administrativeArea} onChange={(event) => setAdministrativeArea(event.target.value)} required />
          </Field>
          <Field label="ZIP" id="zip">
            <Input id="zip" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required />
          </Field>
        </div>
        <Field label="Email" id="email">
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        {setupError ? <p className="text-sm text-destructive">{setupError}</p> : null}
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        <Button type="submit" disabled={!ready || pending}>
          {pending ? "Authorizing..." : "Pay in sandbox"}
        </Button>
      </form>

      {result.id ? (
        <section className="rounded-md border border-border bg-card p-4 text-sm" aria-live="polite">
          <p className="font-semibold text-foreground">Payment {result.status}</p>
          <p className="mt-2 break-all text-muted-foreground">Payment ID: {result.id}</p>
        </section>
      ) : null}
    </main>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Sandbox checkout is unavailable.";
}

function requestTransientToken(microform: Microform, expirationMonth: string, expirationYear: string): Promise<string> {
  return new Promise((resolve, reject) => {
    microform.createToken({ expirationMonth, expirationYear }, (error, token) => {
      if (error || !token) {
        reject(new Error(error?.message || "Card details were not accepted."));
        return;
      }
      resolve(token);
    });
  });
}

function loadFlexScript(src: string, integrity: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      if (window.Flex) resolve();
      else reject(new Error("Payzli card fields could not be loaded."));
    };
    const fail = () => reject(new Error("Payzli card fields could not be loaded."));
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing && window.Flex) {
      existing.dataset.loaded = "true";
      finish();
      return;
    }
    const script = existing ?? document.createElement("script");
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      finish();
    };
    script.onerror = fail;
    if (!existing) document.head.appendChild(script);
  });
}
