import "server-only";
import { createClient } from "@supabase/supabase-js";
import { fundingOpportunities } from "@/data/opportunities";
import { FundingOpportunity } from "@/lib/types";

interface OpportunityRow {
  id: string;
  name: string;
  provider: string;
  funding_type: FundingOpportunity["fundingType"];
  amount_min: number;
  amount_max: number;
  eligible_locations: string[];
  business_stages: FundingOpportunity["businessStages"];
  industries: string[];
  allowed_uses: FundingOpportunity["allowedUses"];
  disallowed_uses: FundingOpportunity["disallowedUses"];
  for_profit_eligible: boolean;
  requires_incorporation: boolean;
  requires_university_affiliation: boolean;
  requires_technology: boolean;
  requires_research: boolean;
  min_employees?: number;
  max_employees?: number;
  revenue_requirement?: string;
  required_documents: FundingOpportunity["requiredDocuments"];
  deadline: string;
  status: FundingOpportunity["status"];
  source_url: string;
  application_url: string;
  last_verified: string;
  geographic_scope: string;
  description: string;
  application_complexity: FundingOpportunity["applicationComplexity"];
  matching_requirement?: string;
  demo_only: boolean;
}

function fromRow(row: OpportunityRow): FundingOpportunity {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    fundingType: row.funding_type,
    amountMin: row.amount_min,
    amountMax: row.amount_max,
    eligibleLocations: row.eligible_locations,
    businessStages: row.business_stages,
    industries: row.industries,
    allowedUses: row.allowed_uses,
    disallowedUses: row.disallowed_uses,
    forProfitEligible: row.for_profit_eligible,
    requiresIncorporation: row.requires_incorporation,
    requiresUniversityAffiliation: row.requires_university_affiliation,
    requiresTechnology: row.requires_technology,
    requiresResearch: row.requires_research,
    minEmployees: row.min_employees,
    maxEmployees: row.max_employees,
    revenueRequirement: row.revenue_requirement,
    requiredDocuments: row.required_documents,
    deadline: row.deadline,
    status: row.status,
    sourceUrl: row.source_url,
    applicationUrl: row.application_url,
    lastVerified: row.last_verified,
    geographicScope: row.geographic_scope,
    description: row.description,
    applicationComplexity: row.application_complexity,
    matchingRequirement: row.matching_requirement,
    demoOnly: row.demo_only,
  };
}

export async function listPublicOpportunities() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      source: "bundled-curated-data",
      opportunities: fundingOpportunities.filter((item) => !item.demoOnly),
    };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("funding_opportunities")
    .select("*")
    .neq("status", "closed")
    .eq("demo_only", false)
    .order("name");

  if (error || !data || data.length === 0) {
    return {
      source: "bundled-curated-data",
      opportunities: fundingOpportunities.filter((item) => !item.demoOnly),
    };
  }

  return {
    source: "supabase",
    opportunities: (data as OpportunityRow[]).map(fromRow),
  };
}
