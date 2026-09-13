import { DocumentKind, FundingNeed, FundingType } from "@/lib/types";

const fundingNeedLabels: Record<FundingNeed, string> = {
  startup: "Startup costs",
  equipment: "Equipment",
  technology: "Technology",
  research: "R&D",
  "product-development": "Product development",
  hiring: "Hiring",
  training: "Employee training",
  pilot: "Pilot / testing",
  expansion: "Expansion",
  marketing: "Marketing",
  "working-capital": "Working capital",
  "business-support": "Business support",
};

const fundingTypeLabels: Record<FundingType, string> = {
  grant: "Grant",
  competition: "Competition",
  "matching-program": "Matching program",
  accelerator: "Accelerator",
  loan: "Loan",
  support: "Free support",
};

const documentLabels: Record<DocumentKind, string> = {
  "business-plan": "Business plan",
  "pitch-deck": "Pitch deck",
  "project-budget": "Project budget",
  financials: "Financial documentation",
  registration: "Business registration",
  "project-description": "Project description",
  "letter-of-support": "Letter of support",
};

export function formatCurrency(value: number) {
  if (value === 0) return "No cash award";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatAmountRange(min: number, max: number) {
  if (min === 0 && max === 0) return "No-cost support";
  if (min === max) return formatCurrency(max);
  if (min === 0) return `Up to ${formatCurrency(max)}`;
  return `${formatCurrency(min)}–${formatCurrency(max)}`;
}

export function fundingNeedLabel(need: FundingNeed) {
  return fundingNeedLabels[need];
}

export function fundingTypeLabel(type: FundingType) {
  return fundingTypeLabels[type];
}

export function documentLabel(kind: DocumentKind) {
  return documentLabels[kind];
}

export function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    idea: "Idea",
    mvp: "MVP",
    testing: "Testing",
    revenue: "Early revenue",
    growth: "Growth",
  };
  return labels[stage] ?? stage;
}

export function timelineLabel(timeline: string) {
  const labels: Record<string, string> = {
    asap: "ASAP",
    "1-3-months": "1–3 months",
    "3-6-months": "3–6 months",
    "6-plus-months": "6+ months",
  };
  return labels[timeline] ?? timeline;
}
