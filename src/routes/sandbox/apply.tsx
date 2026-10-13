import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  INDUSTRIES,
  LINES_OF_BUSINESS,
  SIGNER_TITLES,
  VOLUME_BANDS,
  applicationDraftReady,
  assessApplication,
  filesWithAttachmentTypes,
  previewPortalSteps,
  type ApplicationDocument,
  type CardChannel,
  type PortalStep,
  type VolumeBand,
} from "../../lib/payzli-connect";

const applicationInput = z.object({
  organizationName: z.string().trim().min(2).max(120),
  dbaName: z.string().trim().max(120),
  businessTypeId: z.string().trim().min(1).max(8),
  businessTypeName: z.string().trim().min(2).max(80),
  taxId: z.string().trim().regex(/^(\d{2}-?\d{7}|\d{9})$/),
  businessPhone: z.string().trim().min(10).max(20),
  businessEmail: z.string().trim().email(),
  websiteUrl: z.union([z.literal(""), z.string().trim().url()]),
  address1: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(50),
  state: z.string().trim().length(2),
  postalCode: z.string().trim().min(5).max(10),
  mailingAddress1: z.string().trim().max(80),
  mailingCity: z.string().trim().max(50),
  mailingState: z.string().trim().max(2),
  mailingPostalCode: z.string().trim().max(10),
  signerFirstName: z.string().trim().min(1).max(50),
  signerLastName: z.string().trim().min(1).max(50),
  signerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  signerEmail: z.string().trim().email(),
  signerPhone: z.string().trim().min(10).max(20),
  signerOwnership: z.number().min(1).max(100),
  signerTitle: z.number().int().min(0).max(16),
  signerSsn: z.string().trim().regex(/^\d{3}-?\d{2}-?\d{4}$/),
  driverLicenseState: z.string().trim().length(2),
  driverLicenseNumber: z.string().trim().min(4).max(20),
  bankName: z.string().trim().min(2).max(80),
  routingNumber: z.string().trim().regex(/^\d{9}$/),
  accountNumber: z.string().trim().regex(/^\d{4,17}$/),
  accountType: z.enum(["Checking", "Savings"]),
  industryId: z.number().int().min(1).max(19),
  mccCode: z.string().trim().regex(/^\d{4}$/),
  mccDescription: z.string().trim().min(2).max(120),
  lineOfBusiness: z.string().trim().min(2),
  channel: z.enum(["card_present", "card_not_present"]),
  monthlyVolume: z.enum(["up_to_250k", "250k_500k", "500k_1m", "1m_2_5m", "2_5m_5m", "5m_10m", "over_10m"]),
  referenceDetail: z.string().trim().max(500),
  files: z.array(z.object({
    documentId: z.string().min(2),
    fileName: z.string().min(1).max(180),
    dataBase64: z.string().min(8).max(6_000_000),
  })).max(12),
});

const searchInput = z.object({ query: z.string().trim().min(2).max(40) });

const loadReference = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { loadReferenceStatus } = await import("../../lib/payzli-connect.server");
      return await loadReferenceStatus();
    } catch (error) {
      throw new Error(errorText(error));
    }
  });

const searchMcc = createServerFn({ method: "POST" })
  .validator((data: unknown) => searchInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const { searchIndustries } = await import("../../lib/payzli-connect.server");
      return await searchIndustries(data.query);
    } catch (error) {
      throw new Error(errorText(error));
    }
  });

const submitApplication = createServerFn({ method: "POST" })
  .validator((data: unknown) => applicationInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const assessment = assessApplication(data);
      if (assessment.blocked || !assessment.tier) throw new Error(assessment.message);
      const missing = assessment.documents.filter((document) => !data.files.some((file) => file.documentId === document.id));
      const required = missing[0];
      if (required) throw new Error(`Upload ${required.label}.`);
      const { runApplicationFlow } = await import("../../lib/payzli-connect.server");
      return await runApplicationFlow({
        ...data,
        files: filesWithAttachmentTypes(assessment.documents, data.files).map((file) => ({
          documentId: file.documentId,
          fileName: file.fileName,
          attachmentType: file.attachmentType,
          bytes: Buffer.from(file.dataBase64, "base64"),
        })),
        referenceDetail: data.referenceDetail,
      });
    } catch (error) {
      throw new Error(errorText(error));
    }
  });

export const Route = createFileRoute("/sandbox/apply")({
  head: () => ({
    meta: [
      { title: "Merchant application" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ApplyPage,
});

type BusinessType = { id: string; name: string };
type MccMatch = { mccCode: string; description: string };

function ApplyPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [referenceReady, setReferenceReady] = useState(false);
  const [portalLabel, setPortalLabel] = useState("Connect portal");
  const [referenceNote, setReferenceNote] = useState("Loading business types from the Payzli Connect portal.");
  const [mailingSame, setMailingSame] = useState(true);
  const [mailingAddress1, setMailingAddress1] = useState("");
  const [mailingCity, setMailingCity] = useState("");
  const [mailingState, setMailingState] = useState("");
  const [mailingPostalCode, setMailingPostalCode] = useState("");
  const [submittedSteps, setSubmittedSteps] = useState<PortalStep[] | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [businessTypeId, setBusinessTypeId] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [signerFirstName, setSignerFirstName] = useState("");
  const [signerLastName, setSignerLastName] = useState("");
  const [signerBirthDate, setSignerBirthDate] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [signerOwnership, setSignerOwnership] = useState("100");
  const [signerTitle, setSignerTitle] = useState("11");
  const [signerSsn, setSignerSsn] = useState("");
  const [driverLicenseState, setDriverLicenseState] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"Checking" | "Savings">("Checking");
  const [industryId, setIndustryId] = useState("7");
  const [mccQuery, setMccQuery] = useState("");
  const [mccMatches, setMccMatches] = useState<MccMatch[]>([]);
  const [mccCode, setMccCode] = useState("");
  const [mccDescription, setMccDescription] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("healthcare_clinic");
  const [channel, setChannel] = useState<CardChannel>("card_not_present");
  const [monthlyVolume, setMonthlyVolume] = useState<VolumeBand>("up_to_250k");
  const [files, setFiles] = useState<Record<string, File>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [merchantAccountId, setMerchantAccountId] = useState("");

  const assessment = assessApplication({ lineOfBusiness, channel, monthlyVolume });
  const draftReady = applicationDraftReady(assessment, {
    organizationName,
    businessTypeName: businessTypes.find((item) => item.id === businessTypeId)?.name ?? "",
    taxId,
    businessPhone,
    businessEmail,
    address1,
    city,
    state,
    postalCode,
    mailingSame,
    mailingAddress1,
    mailingCity,
    mailingState,
    mailingPostalCode,
    signerFirstName,
    signerLastName,
    signerBirthDate,
    signerEmail,
    signerPhone,
    signerSsn,
    driverLicenseState,
    driverLicenseNumber,
    bankName,
    routingNumber,
    accountNumber,
    mccCode,
    selectedDocumentIds: Object.keys(files),
  });
  const steps = submittedSteps ?? previewPortalSteps({
    referenceReady,
    referenceDetail: referenceNote,
    portalLabel,
    applicationReady: draftReady,
    assessment,
  });

  useEffect(() => {
    let active = true;
    loadReference()
      .then((status) => {
        if (!active) return;
        setBusinessTypes(status.businessTypes);
        setBusinessTypeId(status.businessTypes[0]?.id ?? "");
        setReferenceReady(status.ready);
        setPortalLabel(status.portal === "production" ? "Production portal" : "Demo portal");
        setReferenceNote(status.detail);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setReferenceNote(reason instanceof Error ? reason.message : "Business types are unavailable.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSearchMcc() {
    setError("");
    try {
      setMccMatches(await searchMcc({ data: { query: mccQuery } }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "MCC search failed.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMerchantAccountId("");
    if (!referenceReady) {
      setError("Business types are still loading.");
      return;
    }
    if (assessment.blocked) {
      setError(assessment.message);
      return;
    }
    setPending(true);
    try {
      const businessType = businessTypes.find((item) => item.id === businessTypeId);
      const encoded = await encodeFiles(assessment.documents, files);
      const result = await submitApplication({
        data: {
          organizationName,
          dbaName,
          businessTypeId,
          businessTypeName: businessType?.name ?? "",
          taxId,
          businessPhone,
          businessEmail,
          websiteUrl,
          address1,
          city,
          state,
          postalCode,
          mailingAddress1: mailingSame ? address1 : mailingAddress1,
          mailingCity: mailingSame ? city : mailingCity,
          mailingState: mailingSame ? state : mailingState,
          mailingPostalCode: mailingSame ? postalCode : mailingPostalCode,
          signerFirstName,
          signerLastName,
          signerBirthDate,
          signerEmail,
          signerPhone,
          signerOwnership: Number(signerOwnership),
          signerTitle: Number(signerTitle),
          signerSsn,
          driverLicenseState,
          driverLicenseNumber,
          bankName,
          routingNumber,
          accountNumber,
          accountType,
          industryId: Number(industryId),
          mccCode,
          mccDescription,
          lineOfBusiness,
          channel,
          monthlyVolume,
          referenceDetail: referenceNote,
          files: encoded,
        },
      });
      setMerchantAccountId(result.merchantAccountId);
      setSubmittedSteps(result.steps);
      const createStep = result.steps.find((item) => item.id === "create");
      if (!result.merchantAccountId && createStep) setError(createStep.detail);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The application could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{portalLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Merchant application</h1>
        <p className="mt-2 text-sm text-muted-foreground">{`Submissions go to the ${portalLabel}. This page is not linked from the public site.`}</p>
        <p className="mt-2 text-sm text-muted-foreground">{referenceNote}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((item, index) => (
          <li key={item.id} className="rounded-md border border-border bg-card p-3 text-sm">
            <p className="font-semibold text-foreground">{index + 1}. {item.title}</p>
            <p className="mt-1 uppercase tracking-wide text-muted-foreground">{stepStateLabel(item.state)}</p>
            <p className="mt-1 text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ol>

      <form className="merchant-application flex flex-col gap-8" onSubmit={onSubmit}>
        <Section title="Business">
          <Field label="Legal name" id="organization-name">
            <Input id="organization-name" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
          </Field>
          <Field label="DBA" id="dba-name">
            <Input id="dba-name" value={dbaName} onChange={(event) => setDbaName(event.target.value)} />
          </Field>
          <Field label="Entity type" id="business-type">
            <select id="business-type" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={businessTypeId} onChange={(event) => setBusinessTypeId(event.target.value)} required>
              {businessTypes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="EIN or SSN" id="tax-id">
              <Input id="tax-id" value={taxId} onChange={(event) => setTaxId(event.target.value)} required />
            </Field>
            <Field label="Phone" id="business-phone">
              <Input id="business-phone" value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} required />
            </Field>
          </div>
          <Field label="Email" id="business-email">
            <Input id="business-email" type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} required />
          </Field>
          <Field label="Website" id="website">
            <Input id="website" type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://" />
          </Field>
          <Field label="Street address" id="address">
            <Input id="address" value={address1} onChange={(event) => setAddress1(event.target.value)} required />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" id="city">
              <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} required />
            </Field>
            <Field label="State" id="state">
              <Input id="state" maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase())} required />
            </Field>
            <Field label="ZIP" id="zip">
              <Input id="zip" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground" htmlFor="mailing-same">
            <input id="mailing-same" type="checkbox" checked={mailingSame} onChange={(event) => setMailingSame(event.target.checked)} />
            Mailing address is the same as the business address
          </label>
          {mailingSame ? null : (
            <>
              <Field label="Mailing street" id="mailing-address">
                <Input id="mailing-address" value={mailingAddress1} onChange={(event) => setMailingAddress1(event.target.value)} required />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Mailing city" id="mailing-city">
                  <Input id="mailing-city" value={mailingCity} onChange={(event) => setMailingCity(event.target.value)} required />
                </Field>
                <Field label="Mailing state" id="mailing-state">
                  <Input id="mailing-state" maxLength={2} value={mailingState} onChange={(event) => setMailingState(event.target.value.toUpperCase())} required />
                </Field>
                <Field label="Mailing ZIP" id="mailing-zip">
                  <Input id="mailing-zip" value={mailingPostalCode} onChange={(event) => setMailingPostalCode(event.target.value)} required />
                </Field>
              </div>
            </>
          )}
        </Section>

        <Section title="Signer">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" id="signer-first">
              <Input id="signer-first" value={signerFirstName} onChange={(event) => setSignerFirstName(event.target.value)} required />
            </Field>
            <Field label="Last name" id="signer-last">
              <Input id="signer-last" value={signerLastName} onChange={(event) => setSignerLastName(event.target.value)} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" id="signer-birth">
              <Input id="signer-birth" type="date" value={signerBirthDate} onChange={(event) => setSignerBirthDate(event.target.value)} required />
            </Field>
            <Field label="Title" id="signer-title">
              <select id="signer-title" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={signerTitle} onChange={(event) => setSignerTitle(event.target.value)}>
                {SIGNER_TITLES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" id="signer-email">
              <Input id="signer-email" type="email" value={signerEmail} onChange={(event) => setSignerEmail(event.target.value)} required />
            </Field>
            <Field label="Phone" id="signer-phone">
              <Input id="signer-phone" value={signerPhone} onChange={(event) => setSignerPhone(event.target.value)} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ownership percent" id="ownership">
              <Input id="ownership" inputMode="numeric" value={signerOwnership} onChange={(event) => setSignerOwnership(event.target.value)} required />
            </Field>
            <Field label="SSN" id="ssn">
              <Input id="ssn" autoComplete="off" value={signerSsn} onChange={(event) => setSignerSsn(event.target.value)} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID state" id="license-state">
              <Input id="license-state" maxLength={2} value={driverLicenseState} onChange={(event) => setDriverLicenseState(event.target.value.toUpperCase())} required />
            </Field>
            <Field label="ID number" id="license-number">
              <Input id="license-number" value={driverLicenseNumber} onChange={(event) => setDriverLicenseNumber(event.target.value)} required />
            </Field>
          </div>
        </Section>

        <Section title="Bank account">
          <Field label="Bank name" id="bank-name">
            <Input id="bank-name" value={bankName} onChange={(event) => setBankName(event.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Routing number" id="routing">
              <Input id="routing" inputMode="numeric" value={routingNumber} onChange={(event) => setRoutingNumber(event.target.value)} required />
            </Field>
            <Field label="Account number" id="account">
              <Input id="account" inputMode="numeric" autoComplete="off" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} required />
            </Field>
          </div>
          <Field label="Account type" id="account-type">
            <select id="account-type" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={accountType} onChange={(event) => setAccountType(event.target.value as "Checking" | "Savings")}>
              <option value="Checking">Checking</option>
              <option value="Savings">Savings</option>
            </select>
          </Field>
        </Section>

        <Section title="Processing profile">
          <Field label="Industry" id="industry">
            <select id="industry" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={industryId} onChange={(event) => setIndustryId(event.target.value)}>
              {INDUSTRIES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Line of business" id="line">
            <select id="line" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={lineOfBusiness} onChange={(event) => setLineOfBusiness(event.target.value)}>
              {LINES_OF_BUSINESS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Card channel" id="channel">
              <select id="channel" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={channel} onChange={(event) => setChannel(event.target.value as CardChannel)}>
                <option value="card_not_present">Card not present</option>
                <option value="card_present">Card present</option>
              </select>
            </Field>
            <Field label="Average monthly volume" id="volume">
              <select id="volume" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value as VolumeBand)}>
                {VOLUME_BANDS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <Field label="Find MCC" id="mcc-query">
              <Input id="mcc-query" value={mccQuery} onChange={(event) => setMccQuery(event.target.value)} placeholder="8011 or doctor" />
            </Field>
            <Button type="button" variant="outline" className="mt-6" onClick={onSearchMcc}>Search</Button>
          </div>
          {mccMatches.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {mccMatches.map((item) => (
                <li key={item.mccCode}>
                  <button
                    type="button"
                    className="text-left text-foreground underline-offset-2 hover:underline"
                    onClick={() => {
                      setMccCode(item.mccCode);
                      setMccDescription(item.description);
                    }}
                  >
                    {item.mccCode} — {item.description}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm text-muted-foreground">Selected MCC: {mccCode ? `${mccCode} ${mccDescription}` : "None"}</p>
          <p className="text-sm text-foreground">{assessment.message}</p>
        </Section>

        {assessment.documents.length > 0 ? (
          <Section title="Documents">
            {assessment.documents.map((document) => (
              <Field key={document.id} label={document.label} id={document.id}>
                <Input
                  id={document.id}
                  type="file"
                  className={files[document.id] ? "has-file" : undefined}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setFiles((current) => {
                      const next = { ...current };
                      if (file) next[document.id] = file;
                      else delete next[document.id];
                      return next;
                    });
                  }}
                />
              </Field>
            ))}
          </Section>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={pending || !referenceReady || !draftReady}>
          {pending ? "Submitting..." : `Submit to ${portalLabel}`}
        </Button>
      </form>

      {merchantAccountId ? (
        <section className="rounded-md border border-border bg-card p-4 text-sm" aria-live="polite">
          <p className="font-semibold text-foreground">Application sent to the {portalLabel}</p>
          <p className="mt-2 break-all text-muted-foreground">Merchant account ID: {merchantAccountId}</p>
        </section>
      ) : null}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
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

function stepStateLabel(state: PortalStep["state"]): string {
  if (state === "complete") return "Complete";
  if (state === "blocked") return "Blocked";
  if (state === "unavailable") return "Unavailable";
  return "Waiting";
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The application could not be submitted.";
}

async function encodeFiles(documents: ApplicationDocument[], files: Record<string, File>) {
  const encoded = [];
  for (const document of documents) {
    const file = files[document.id];
    if (!file) continue;
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    encoded.push({ documentId: document.id, fileName: file.name, dataBase64: btoa(binary) });
  }
  return encoded;
}
