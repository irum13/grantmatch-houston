export type BusinessStage =
  | "idea"
  | "mvp"
  | "testing"
  | "revenue"
  | "growth";

export type BusinessType =
  | "startup"
  | "small-business"
  | "student"
  | "research";

export type FundingNeed =
  | "startup"
  | "equipment"
  | "technology"
  | "research"
  | "product-development"
  | "hiring"
  | "training"
  | "pilot"
  | "expansion"
  | "marketing"
  | "working-capital"
  | "business-support";

export type FundingType =
  | "grant"
  | "competition"
  | "matching-program"
  | "accelerator"
  | "loan"
  | "support";

export type OpportunityStatus =
  | "active"
  | "forecasted"
  | "verify"
  | "closed";

export type DocumentKind =
  | "business-plan"
  | "pitch-deck"
  | "project-budget"
  | "financials"
  | "registration"
  | "project-description"
  | "letter-of-support";

export interface FounderDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  format: "PDF" | "XLSX" | "DOCX";
  summary: string;
}

export interface FounderProfile {
  id: string;
  name: string;
  slug: string;
  type: BusinessType;
  location: string;
  county: string;
  zipCode?: string;
  industry: string;
  description: string;
  stage: BusinessStage;
  revenueBand: "pre-revenue" | "under-50k" | "50k-250k" | "over-250k";
  employees: number;
  forProfit: boolean;
  incorporated: boolean;
  studentFounder: boolean;
  universityAffiliated: boolean;
  technologyComponent: boolean;
  researchComponent: boolean;
  fundingAmount: number;
  fundingNeeds: FundingNeed[];
  fundingTimeline: "asap" | "1-3-months" | "3-6-months" | "6-plus-months";
  ownershipAttributes: string[];
  documents: FounderDocument[];
}

export interface FundingOpportunity {
  id: string;
  name: string;
  provider: string;
  fundingType: FundingType;
  amountMin: number;
  amountMax: number;
  eligibleLocations: string[];
  businessStages: BusinessStage[];
  industries: string[];
  allowedUses: FundingNeed[];
  disallowedUses: FundingNeed[];
  forProfitEligible: boolean;
  requiresIncorporation: boolean;
  requiresUniversityAffiliation: boolean;
  requiresTechnology: boolean;
  requiresResearch: boolean;
  minEmployees?: number;
  maxEmployees?: number;
  revenueRequirement?: string;
  requiredDocuments: DocumentKind[];
  deadline: string;
  status: OpportunityStatus;
  sourceUrl: string;
  applicationUrl: string;
  lastVerified: string;
  geographicScope: string;
  description: string;
  applicationComplexity: "low" | "medium" | "high";
  matchingRequirement?: string;
  demoOnly?: boolean;
}

export type EvidenceState = "satisfied" | "missing" | "verify";

export interface MatchEvidence {
  label: string;
  requirement: string;
  founderValue: string;
  state: EvidenceState;
  blocking?: boolean;
}

export interface OpportunityMatch {
  opportunity: FundingOpportunity;
  score: number;
  verdict: "strong" | "possible" | "poor";
  eligibility: "likely" | "verify" | "unlikely";
  fit: "strong" | "moderate" | "poor";
  readiness: number;
  evidence: MatchEvidence[];
  reasons: string[];
  concerns: string[];
  missingDocuments: DocumentKind[];
  biggestTask: string;
}
