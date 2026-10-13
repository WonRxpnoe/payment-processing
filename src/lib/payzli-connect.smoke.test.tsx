import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isOpenSandboxPath } from "./sandbox-checkout-path";
import {
  CREATE_MERCHANT_ACCOUNT_PATH,
  applicationDraftReady,
  assessApplication,
  buildCreateMerchantBody,
  connectFailureMessage,
  filesWithAttachmentTypes,
  filterIndustries,
  organizationNameFrom,
  previewPortalSteps,
  readConnectResult,
  submittedPortalSteps,
  type MerchantApplicationInput,
} from "./payzli-connect";

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

describe("merchant application rules", () => {
  it("blocks a prohibited line of business before any portal call", () => {
    const result = assessApplication({
      lineOfBusiness: "cannabis",
      channel: "card_present",
      monthlyVolume: "up_to_250k",
    });
    expect(result.blocked).toBe(true);
    expect(result.documents).toEqual([]);
  });

  it("asks a card-not-present clinic for the tier 1 package", () => {
    const result = assessApplication({
      lineOfBusiness: "healthcare_clinic",
      channel: "card_not_present",
      monthlyVolume: "up_to_250k",
    });
    expect(result.tier).toBe(1);
    expect(result.documents.map((item) => item.id)).toEqual(["government_id", "articles", "bank_letter"]);
  });

  it("asks telemedicine for six months of statements above $250,000", () => {
    const result = assessApplication({
      lineOfBusiness: "telemedicine",
      channel: "card_not_present",
      monthlyVolume: "250k_500k",
    });
    expect(result.tier).toBe(3);
    expect(result.documents.some((item) => item.label.includes("6 months"))).toBe(true);
    expect(result.documents.some((item) => item.id === "tax_returns")).toBe(true);
  });

  it("follows the Payzli volume matrix, including the $2.5 million medium cell", () => {
    const tier = (lineOfBusiness: string, channel: "card_present" | "card_not_present", monthlyVolume: "up_to_250k" | "250k_500k" | "500k_1m" | "1m_2_5m" | "2_5m_5m" | "5m_10m" | "over_10m") =>
      assessApplication({ lineOfBusiness, channel, monthlyVolume }).tier;
    expect(tier("healthcare_clinic", "card_present", "up_to_250k")).toBe(1);
    expect(tier("healthcare_clinic", "card_not_present", "up_to_250k")).toBe(1);
    expect(tier("telemedicine", "card_not_present", "up_to_250k")).toBe(2);
    expect(tier("healthcare_clinic", "card_present", "250k_500k")).toBe(2);
    expect(tier("healthcare_clinic", "card_not_present", "250k_500k")).toBe(2);
    expect(tier("telemedicine", "card_not_present", "250k_500k")).toBe(3);
    expect(tier("healthcare_clinic", "card_present", "500k_1m")).toBe(1);
    expect(tier("healthcare_clinic", "card_not_present", "500k_1m")).toBe(2);
    expect(tier("telemedicine", "card_not_present", "500k_1m")).toBe(3);
    expect(tier("healthcare_clinic", "card_present", "1m_2_5m")).toBe(2);
    expect(tier("healthcare_clinic", "card_not_present", "1m_2_5m")).toBe(2);
    expect(tier("telemedicine", "card_not_present", "1m_2_5m")).toBe(3);
    expect(tier("healthcare_clinic", "card_present", "2_5m_5m")).toBe(3);
    expect(tier("healthcare_clinic", "card_not_present", "2_5m_5m")).toBe(2);
    expect(tier("telemedicine", "card_present", "2_5m_5m")).toBe(2);
    expect(tier("telemedicine", "card_not_present", "2_5m_5m")).toBe(3);
    expect(tier("healthcare_clinic", "card_present", "5m_10m")).toBe(3);
    expect(tier("healthcare_clinic", "card_not_present", "5m_10m")).toBe(3);
    expect(tier("telemedicine", "card_not_present", "over_10m")).toBe(3);
  });

  it("keeps the application step waiting until the draft and its files are present", () => {
    const assessment = assessApplication({ lineOfBusiness: "healthcare_clinic", channel: "card_not_present", monthlyVolume: "up_to_250k" });
    const draft = {
      organizationName: application.organizationName,
      businessTypeName: application.businessTypeName,
      taxId: application.taxId,
      businessPhone: application.businessPhone,
      businessEmail: application.businessEmail,
      address1: application.address1,
      city: application.city,
      state: application.state,
      postalCode: application.postalCode,
      mailingSame: true,
      mailingAddress1: "",
      mailingCity: "",
      mailingState: "",
      mailingPostalCode: "",
      signerFirstName: application.signerFirstName,
      signerLastName: application.signerLastName,
      signerBirthDate: application.signerBirthDate,
      signerEmail: application.signerEmail,
      signerPhone: application.signerPhone,
      signerSsn: application.signerSsn,
      driverLicenseState: application.driverLicenseState,
      driverLicenseNumber: application.driverLicenseNumber,
      bankName: application.bankName,
      routingNumber: application.routingNumber,
      accountNumber: application.accountNumber,
      mccCode: application.mccCode,
      selectedDocumentIds: ["government_id", "articles"],
    };
    expect(applicationDraftReady(assessment, draft)).toBe(false);
    expect(applicationDraftReady(assessment, { ...draft, selectedDocumentIds: ["government_id", "articles", "bank_letter"] })).toBe(true);
  });
});

describe("merchant application payload", () => {
  it("builds the create-account body and keeps the SSN digits only", () => {
    const body = buildCreateMerchantBody(application);
    const parsed = JSON.parse(body) as {
      State: {
        organization_details: { organization_name: string; tax_id: string };
        businessAddress: { address_line1: string };
        mailingAddress: { address_line1: string };
        merchantPersonsDetails: Array<{ ssn: string; birth_date: string }>;
        industry_id: number;
      };
    };
    expect(CREATE_MERCHANT_ACCOUNT_PATH).toBe("/api/v3/connect/create_merchant_account");
    const signer = parsed.State.merchantPersonsDetails[0];
    expect(parsed.State.organization_details.organization_name).toBe("Kithpay Connect Test");
    expect(parsed.State.organization_details.tax_id).toBe("123456789");
    expect(signer?.ssn).toBe("000000000");
    expect(signer?.birth_date).toBe("1985-04-12");
    expect(parsed.State.industry_id).toBe(7);
    expect(parsed.State.mailingAddress.address_line1).toBe("2 Mission St");
    expect(parsed.State.businessAddress.address_line1).toBe("1 Market St");
    expect(body).not.toContain("create_merchant_account_v3");
  });

  it("copies the whole business address when mailing is blank and does not mix a partial mailing address", () => {
    const blank = JSON.parse(buildCreateMerchantBody({
      ...application,
      mailingAddress1: "",
      mailingCity: "",
      mailingState: "",
      mailingPostalCode: "",
    })) as { State: { mailingAddress: { address_line1: string; city: string } } };
    const partial = JSON.parse(buildCreateMerchantBody({
      ...application,
      mailingAddress1: "9 Pine St",
      mailingCity: "",
      mailingState: "CA",
      mailingPostalCode: "94111",
    })) as { State: { mailingAddress: { address_line1: string; city: string } } };
    expect(blank.State.mailingAddress).toMatchObject({ address_line1: "1 Market St", city: "San Francisco" });
    expect(partial.State.mailingAddress).toMatchObject({ address_line1: "9 Pine St", city: "" });
  });

  it("drops a file that is not on the document list instead of filing it as a photo ID", () => {
    const documents = assessApplication({
      lineOfBusiness: "healthcare_clinic",
      channel: "card_not_present",
      monthlyVolume: "up_to_250k",
    }).documents;
    const files = filesWithAttachmentTypes(documents, [
      { documentId: "government_id", fileName: "id.txt" },
      { documentId: "not_a_document", fileName: "extra.txt" },
    ]);
    expect(files).toEqual([{ documentId: "government_id", fileName: "id.txt", attachmentType: 1 }]);
  });

  it("explains a demo key that can read and cannot create", () => {
    expect(connectFailureMessage(readConnectResult({
      Succeeded: false,
      ErrorCode: "PERMISSION_DENIED",
      ErrorMessage: "Bad request",
    }))).toContain("refused to create");
  });

  it("filters MCC matches from the portal industry list", () => {
    const matches = filterIndustries(
      [
        { mccCode: "8011", description: "Doctors and physicians" },
        { mccCode: "0742", description: "Veterinary Services" },
      ],
      "doctor",
    );
    expect(matches).toEqual([{ mccCode: "8011", description: "Doctors and physicians" }]);
  });
});

describe("portal flow", () => {
  it("stops the later steps when the line of business is prohibited", () => {
    const assessment = assessApplication({
      lineOfBusiness: "cannabis",
      channel: "card_present",
      monthlyVolume: "up_to_250k",
    });
    const steps = previewPortalSteps({
      referenceReady: true,
      referenceDetail: "Business types loaded.",
      portalLabel: "Demo portal",
      applicationReady: false,
      assessment,
    });
    expect(steps.map((item) => item.state)).toEqual(["complete", "blocked", "blocked", "blocked", "blocked"]);
    expect(steps[1]?.detail).toContain("does not board");
  });

  it("keeps Plaid and read-back waiting when create is refused", () => {
    const steps = submittedPortalSteps({
      referenceDetail: "Business types loaded.",
      createDetail: "Payzli accepted the demo key for reference data, and refused to create this merchant account.",
      merchantAccountId: "",
      attachmentDetail: "Documents wait for a merchant account.",
      attachmentsAccepted: false,
      bankDetail: "Account and routing numbers are in the application. Plaid and e-sign wait for a merchant account.",
      bankState: "waiting",
      verifyDetail: "Read-back waits for a merchant account.",
      verified: false,
    });
    expect(steps.find((item) => item.id === "create")?.state).toBe("blocked");
    expect(steps.find((item) => item.id === "bank")?.state).toBe("waiting");
    expect(steps.find((item) => item.id === "verify")?.state).toBe("waiting");
  });

  it("marks read-back complete when the portal returns the business name", () => {
    expect(organizationNameFrom({ organization_details: { organization_name: "Kithpay Connect Test" } })).toBe("Kithpay Connect Test");
    const steps = submittedPortalSteps({
      referenceDetail: "Business types loaded.",
      createDetail: "Demo portal accepted merchant account account-1.",
      merchantAccountId: "account-1",
      attachmentDetail: "3 files stored.",
      attachmentsAccepted: true,
      bankDetail: "Plaid: Plaid link token issued. E-sign: E-sign completed.",
      bankState: "complete",
      verifyDetail: "Demo portal returned Kithpay Connect Test.",
      verified: true,
    });
    expect(steps.find((item) => item.id === "verify")?.state).toBe("complete");
    expect(steps.find((item) => item.id === "bank")?.detail).toContain("Plaid");
  });
});

describe("application page", () => {
  const page = readFileSync(join(process.cwd(), "src/routes/sandbox/apply.tsx"), "utf8");
  const home = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");
  const root = readFileSync(join(process.cwd(), "src/routes/__root.tsx"), "utf8");

  it("stays off the public homepage and outside the coming-soon cover", () => {
    expect(isOpenSandboxPath("/sandbox/apply")).toBe(true);
    expect(isOpenSandboxPath("/")).toBe(false);
    expect(home).not.toContain("/sandbox/apply");
    expect(root).toContain("isOpenSandboxPath");
    expect(page).toContain("Merchant application");
    expect(page).toContain("Mailing address is the same");
    expect(page).toContain("applicationDraftReady");
    expect(page).toContain("!referenceReady");
    expect(page).toContain("filesWithAttachmentTypes");
    expect(page).toContain("merchant-application");
    expect(page).toContain("previewPortalSteps");
    expect(readFileSync(join(process.cwd(), "src/styles.css"), "utf8")).toContain(".merchant-application input::placeholder");
    expect(page).toContain("runApplicationFlow");
    expect(page).not.toContain("PAYZLI_CONNECT_TOKEN");
    expect(page).not.toContain("PAYZLI_CONNECT_PASSWORD");
  });
});
