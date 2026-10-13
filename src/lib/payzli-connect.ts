export const PAYZLI_CONNECT_DEMO_ORIGIN = "https://demo.connect.payzli.com";
export const PAYZLI_CONNECT_PRODUCTION_ORIGIN = "https://connect.payzli.com";
export const CREATE_MERCHANT_ACCOUNT_PATH = "/api/v3/connect/create_merchant_account";

export const INDUSTRIES = [
  { id: 1, label: "Airlines" },
  { id: 2, label: "Apparel" },
  { id: 3, label: "Auto" },
  { id: 4, label: "Car rental" },
  { id: 5, label: "Direct marketing" },
  { id: 6, label: "Government" },
  { id: 7, label: "Healthcare" },
  { id: 8, label: "Lodging" },
  { id: 9, label: "Supermarket" },
  { id: 10, label: "MOTO / internet" },
  { id: 11, label: "Other" },
  { id: 12, label: "Petroleum" },
  { id: 13, label: "Personal services" },
  { id: 14, label: "Professional services" },
  { id: 15, label: "Quick service restaurants" },
  { id: 16, label: "Retail" },
  { id: 17, label: "Restaurants" },
  { id: 18, label: "Transportation" },
  { id: 19, label: "Wholesale" },
] as const;

export const SIGNER_TITLES = [
  { id: 0, label: "CEO" },
  { id: 1, label: "CFO" },
  { id: 11, label: "Owner" },
  { id: 12, label: "Partner" },
  { id: 13, label: "President" },
  { id: 8, label: "Managing member" },
] as const;

export const VOLUME_BANDS = [
  { id: "up_to_250k", label: "Up to $250,000" },
  { id: "250k_500k", label: "$250,000 to $500,000" },
  { id: "500k_1m", label: "$500,000 to $1 million" },
  { id: "1m_2_5m", label: "$1 million to $2.5 million" },
  { id: "2_5m_5m", label: "$2.5 million to $5 million" },
  { id: "5m_10m", label: "$5 million to $10 million" },
  { id: "over_10m", label: "Over $10 million" },
] as const;

export type VolumeBand = (typeof VOLUME_BANDS)[number]["id"];
export type CardChannel = "card_present" | "card_not_present";
export type RiskClass = "standard" | "restricted" | "prohibited";
export type DocumentTier = 1 | 2 | 3;

export type LineOfBusiness = {
  id: string;
  label: string;
  risk: RiskClass;
};

export const LINES_OF_BUSINESS: LineOfBusiness[] = [
  { id: "general", label: "General retail, clinic, or professional services", risk: "standard" },
  { id: "healthcare_clinic", label: "Healthcare clinic", risk: "standard" },
  { id: "restaurant", label: "Restaurant or in-person food service", risk: "standard" },
  { id: "non_profit", label: "Charity or non-profit", risk: "restricted" },
  { id: "telemedicine", label: "Telemedicine", risk: "restricted" },
  { id: "nutraceuticals", label: "Nutraceuticals", risk: "restricted" },
  { id: "cbd", label: "CBD", risk: "restricted" },
  { id: "subscription", label: "Continuity or subscription marketing", risk: "restricted" },
  { id: "credit_repair", label: "Credit repair", risk: "restricted" },
  { id: "debt_collection", label: "Collections or debt repayment", risk: "restricted" },
  { id: "pharmacy", label: "Internet pharmacy", risk: "restricted" },
  { id: "vape", label: "Vape, e-cigarette, or tobacco", risk: "restricted" },
  { id: "firearms", label: "Firearms, guns, or ammunition", risk: "restricted" },
  { id: "gambling_licensed", label: "Licensed gambling or gaming", risk: "restricted" },
  { id: "cannabis", label: "Cannabis or marijuana, including THC over 0.3%", risk: "prohibited" },
  { id: "crypto", label: "Cryptocurrency or NFT", risk: "prohibited" },
  { id: "adult_streaming", label: "Adult media streaming", risk: "prohibited" },
  { id: "unregulated_gambling", label: "Unregulated gambling", risk: "prohibited" },
  { id: "payday", label: "Payday or short-term loans", risk: "prohibited" },
  { id: "money_transfer", label: "Money transfer or payment facilitation", risk: "prohibited" },
  { id: "mlm", label: "Multi-level marketing", risk: "prohibited" },
];

export type ApplicationDocument = {
  id: string;
  label: string;
  attachmentType: number;
};

const TIER_1_DOCUMENTS: ApplicationDocument[] = [
  { id: "government_id", label: "Government-issued photo ID for each signer", attachmentType: 1 },
  { id: "articles", label: "Articles of incorporation or equivalent formation document", attachmentType: 2 },
  { id: "bank_letter", label: "Voided check, bank letter, or other deposit-account proof", attachmentType: 3 },
];

const TIER_2_EXTRA: ApplicationDocument[] = [
  { id: "processing_statements", label: "Last 3 months of payment processing statements", attachmentType: 4 },
  { id: "bank_statements", label: "Last 3 months of business bank statements", attachmentType: 5 },
  { id: "marketing", label: "Marketing materials or website captures", attachmentType: 6 },
  { id: "terms", label: "Customer terms, guarantees, or subscription agreement", attachmentType: 7 },
];

const TIER_3_STATEMENTS: ApplicationDocument[] = [
  { id: "processing_statements", label: "Last 6 months of payment processing statements", attachmentType: 4 },
  { id: "bank_statements", label: "Last 6 months of business bank statements", attachmentType: 5 },
  { id: "marketing", label: "Marketing materials or website captures", attachmentType: 6 },
  { id: "terms", label: "Customer terms, guarantees, or subscription agreement", attachmentType: 7 },
];

const HIGH_VOLUME_DOCUMENTS: ApplicationDocument[] = [
  { id: "financial_statements", label: "Year-to-date financial statements", attachmentType: 8 },
  { id: "tax_returns", label: "Last two years of CPA financials or corporate tax returns", attachmentType: 9 },
];

export type ApplicationAssessment = {
  blocked: boolean;
  tier: DocumentTier | null;
  documents: ApplicationDocument[];
  message: string;
};

export function assessApplication(input: {
  lineOfBusiness: string;
  channel: CardChannel;
  monthlyVolume: VolumeBand;
}): ApplicationAssessment {
  const line = LINES_OF_BUSINESS.find((item) => item.id === input.lineOfBusiness);
  if (!line) {
    return { blocked: true, tier: null, documents: [], message: "Choose a line of business." };
  }
  if (line.risk === "prohibited") {
    return {
      blocked: true,
      tier: null,
      documents: [],
      message: "Payzli does not board this line of business.",
    };
  }

  const tier = documentTier(line.risk, input.channel, input.monthlyVolume);
  const documents = documentsForTier(tier, input.monthlyVolume);
  return {
    blocked: false,
    tier,
    documents,
    message: `Document tier ${tier}. Upload every file in this list before submitting.`,
  };
}

export type MerchantApplicationInput = {
  organizationName: string;
  dbaName: string;
  businessTypeName: string;
  taxId: string;
  businessPhone: string;
  businessEmail: string;
  websiteUrl: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  mailingAddress1: string;
  mailingCity: string;
  mailingState: string;
  mailingPostalCode: string;
  signerFirstName: string;
  signerLastName: string;
  signerBirthDate: string;
  signerEmail: string;
  signerPhone: string;
  signerOwnership: number;
  signerTitle: number;
  signerSsn: string;
  driverLicenseState: string;
  driverLicenseNumber: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: "Checking" | "Savings";
  industryId: number;
  mccCode: string;
  mccDescription: string;
};

export function buildCreateMerchantBody(input: MerchantApplicationInput): string {
  const address = {
    address_line1: input.address1,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: "US",
  };
  const mailing = input.mailingAddress1.trim()
    ? {
        address_line1: input.mailingAddress1,
        city: input.mailingCity,
        state: input.mailingState,
        postal_code: input.mailingPostalCode,
        country: "US",
      }
    : address;
  return JSON.stringify({
    State: {
      organization_details: {
        organization_name: input.organizationName,
        dba_name: input.dbaName || input.organizationName,
        description: input.businessTypeName,
        website_url: input.websiteUrl,
        business_phone_number: input.businessPhone,
        business_email: input.businessEmail,
        tax_id: digits(input.taxId),
      },
      businessAddress: address,
      mailingAddress: mailing,
      merchantPersonsDetails: [
        {
          first_name: input.signerFirstName,
          last_name: input.signerLastName,
          birth_date: input.signerBirthDate,
          personal_email_address: input.signerEmail,
          personal_phone_number: input.signerPhone,
          ownership_percent: input.signerOwnership,
          ssn: digits(input.signerSsn),
          title: input.signerTitle,
          home_address: address,
          ddl_state: input.driverLicenseState,
          ddl_number: input.driverLicenseNumber,
        },
      ],
      bankAccountDetails: [
        {
          bank_name: input.bankName,
          bank_routing_number: digits(input.routingNumber),
          bank_account_number: digits(input.accountNumber),
          account_type: input.accountType,
        },
      ],
      industry_id: input.industryId,
      merchantMccPrices: {
        mcc_code: input.mccCode,
        description: input.mccDescription,
      },
    },
  });
}

export type ConnectCallResult = {
  succeeded: boolean;
  output: string;
  errorCode: string;
  errorMessage: string;
};

export function readConnectResult(payload: unknown): ConnectCallResult {
  if (!payload || typeof payload !== "object") {
    return { succeeded: false, output: "", errorCode: "", errorMessage: "Payzli returned an unreadable response." };
  }
  const record = payload as { Succeeded?: unknown; Output?: unknown; ErrorCode?: unknown; ErrorMessage?: unknown };
  return {
    succeeded: record.Succeeded === true,
    output: typeof record.Output === "string" ? record.Output : "",
    errorCode: typeof record.ErrorCode === "string" ? record.ErrorCode : "",
    errorMessage: typeof record.ErrorMessage === "string" ? record.ErrorMessage : "",
  };
}

export function connectPortalLabel(origin: string): "Demo portal" | "Production portal" {
  return origin === PAYZLI_CONNECT_PRODUCTION_ORIGIN ? "Production portal" : "Demo portal";
}

export function connectFailureMessage(result: ConnectCallResult, action = "create this merchant account"): string {
  if (result.errorCode === "PERMISSION_DENIED") {
    return `Payzli accepted this key for reference data, and refused to ${action}.`;
  }
  return result.errorMessage || result.errorCode || "Payzli did not accept the request.";
}

export type PortalStepState = "complete" | "blocked" | "waiting" | "unavailable";

export type PortalStep = {
  id: "reference" | "application" | "create" | "bank" | "verify";
  title: string;
  state: PortalStepState;
  detail: string;
};

export type ApplicationDraft = {
  organizationName: string;
  businessTypeName: string;
  taxId: string;
  businessPhone: string;
  businessEmail: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  mailingSame: boolean;
  mailingAddress1: string;
  mailingCity: string;
  mailingState: string;
  mailingPostalCode: string;
  signerFirstName: string;
  signerLastName: string;
  signerBirthDate: string;
  signerEmail: string;
  signerPhone: string;
  signerSsn: string;
  driverLicenseState: string;
  driverLicenseNumber: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  mccCode: string;
  selectedDocumentIds: string[];
};

export function applicationDraftReady(assessment: ApplicationAssessment, draft: ApplicationDraft): boolean {
  if (assessment.blocked) return false;
  const values = [
    draft.organizationName,
    draft.businessTypeName,
    draft.taxId,
    draft.businessPhone,
    draft.businessEmail,
    draft.address1,
    draft.city,
    draft.state,
    draft.postalCode,
    draft.signerFirstName,
    draft.signerLastName,
    draft.signerBirthDate,
    draft.signerEmail,
    draft.signerPhone,
    draft.signerSsn,
    draft.driverLicenseState,
    draft.driverLicenseNumber,
    draft.bankName,
    draft.routingNumber,
    draft.accountNumber,
    draft.mccCode,
  ];
  if (!draft.mailingSame) {
    values.push(draft.mailingAddress1, draft.mailingCity, draft.mailingState, draft.mailingPostalCode);
  }
  if (values.some((value) => value.trim().length === 0)) return false;
  return assessment.documents.every((document) => draft.selectedDocumentIds.includes(document.id));
}

export function previewPortalSteps(input: {
  referenceReady: boolean;
  referenceDetail: string;
  portalLabel: string;
  applicationReady: boolean;
  assessment: ApplicationAssessment;
}): PortalStep[] {
  const blocked = input.assessment.blocked;
  const stopped = "Submission is stopped.";
  return [
    step("reference", "Reference data", input.referenceReady ? "complete" : "waiting", input.referenceDetail),
    step("application", "Application", blocked ? "blocked" : input.applicationReady ? "complete" : "waiting", input.assessment.message),
    step(
      "create",
      "Create account and attachments",
      blocked ? "blocked" : "waiting",
      blocked ? stopped : `Submit the form to create the merchant account in the ${input.portalLabel} and upload documents.`,
    ),
    step(
      "bank",
      "Bank, Plaid, and e-sign",
      blocked ? "blocked" : "waiting",
      blocked ? stopped : "Account and routing numbers go with the application. Plaid and e-sign run after Payzli returns a merchant account.",
    ),
    step(
      "verify",
      "Read the application back",
      blocked ? "blocked" : "waiting",
      blocked ? stopped : `The ${input.portalLabel} is checked after the account exists.`,
    ),
  ];
}

export function submittedPortalSteps(input: {
  referenceDetail: string;
  createDetail: string;
  merchantAccountId: string;
  attachmentDetail: string;
  attachmentsAccepted: boolean;
  bankDetail: string;
  bankState: "complete" | "unavailable" | "waiting";
  verifyDetail: string;
  verified: boolean;
}): PortalStep[] {
  const created = input.merchantAccountId.length > 0;
  return [
    step("reference", "Reference data", "complete", input.referenceDetail),
    step("application", "Application", "complete", "The application passed the local checks."),
    step(
      "create",
      "Create account and attachments",
      !created ? "blocked" : input.attachmentsAccepted ? "complete" : "unavailable",
      created ? `${input.createDetail} ${input.attachmentDetail}` : input.createDetail,
    ),
    step("bank", "Bank, Plaid, and e-sign", created ? input.bankState : "waiting", input.bankDetail),
    step(
      "verify",
      "Read the application back",
      input.verified ? "complete" : created ? "unavailable" : "waiting",
      input.verifyDetail,
    ),
  ];
}

export function organizationNameFrom(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.organization_name === "string" && record.organization_name.trim()) return record.organization_name;
  for (const child of Object.values(record)) {
    if (!child || typeof child !== "object") continue;
    const found = organizationNameFrom(child);
    if (found) return found;
  }
  return "";
}

function step(id: PortalStep["id"], title: string, state: PortalStepState, detail: string): PortalStep {
  return { id, title, state, detail };
}

export type IndustryMatch = {
  mccCode: string;
  description: string;
};

export function filesWithAttachmentTypes<T extends { documentId: string }>(
  documents: ApplicationDocument[],
  files: T[],
): Array<T & { attachmentType: number }> {
  return files.flatMap((file) => {
    const document = documents.find((item) => item.id === file.documentId);
    if (!document) return [];
    return [{ ...file, attachmentType: document.attachmentType }];
  });
}

export function filterIndustries(industries: IndustryMatch[], query: string): IndustryMatch[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  return industries
    .filter((item) => item.mccCode.includes(needle) || item.description.toLowerCase().includes(needle))
    .slice(0, 12);
}

function documentTier(risk: RiskClass, channel: CardChannel, volume: VolumeBand): DocumentTier {
  const column = risk === "restricted" && channel === "card_not_present" ? "high" : channel === "card_present" && risk === "standard" ? "low" : "medium";
  const matrix: Record<VolumeBand, Record<"low" | "medium" | "high", DocumentTier>> = {
    up_to_250k: { low: 1, medium: 1, high: 2 },
    "250k_500k": { low: 2, medium: 2, high: 3 },
    "500k_1m": { low: 1, medium: 2, high: 3 },
    "1m_2_5m": { low: 2, medium: 2, high: 3 },
    "2_5m_5m": { low: 3, medium: 2, high: 3 },
    "5m_10m": { low: 3, medium: 3, high: 3 },
    over_10m: { low: 3, medium: 3, high: 3 },
  };
  return matrix[volume][column];
}

function documentsForTier(tier: DocumentTier, volume: VolumeBand): ApplicationDocument[] {
  if (tier === 1) return TIER_1_DOCUMENTS;
  if (tier === 2) return [...TIER_1_DOCUMENTS, ...TIER_2_EXTRA];
  const documents = [...TIER_1_DOCUMENTS, ...TIER_3_STATEMENTS];
  if (volume !== "up_to_250k") documents.push(...HIGH_VOLUME_DOCUMENTS);
  return documents;
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}
