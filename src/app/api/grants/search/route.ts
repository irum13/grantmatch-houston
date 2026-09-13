import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FundingOpportunity } from "@/lib/types";

const requestSchema = z.object({
  industry: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
});

interface GrantHit {
  id?: string | number;
  opportunityId?: string | number;
  opportunityNumber?: string;
  number?: string;
  title?: string;
  opportunityTitle?: string;
  agencyName?: string;
  agency?: string;
  closeDate?: string;
  openDate?: string;
  oppStatus?: string;
}

function normalizeHit(hit: GrantHit): FundingOpportunity | null {
  const id = hit.id ?? hit.opportunityId;
  const title = hit.title ?? hit.opportunityTitle;
  if (!id || !title) return null;

  const opportunityNumber = hit.opportunityNumber ?? hit.number ?? String(id);
  const status = hit.oppStatus?.toLowerCase().includes("forecast")
    ? "forecasted"
    : "active";
  const detailUrl = `https://www.grants.gov/search-results-detail/${id}`;

  return {
    id: `grants-gov-${String(id)}`,
    name: title,
    provider: hit.agencyName ?? hit.agency ?? "U.S. federal agency",
    fundingType: "grant",
    amountMin: 0,
    amountMax: 0,
    eligibleLocations: ["Texas"],
    businessStages: ["idea", "mvp", "testing", "revenue", "growth"],
    industries: ["all"],
    allowedUses: ["research", "product-development", "pilot", "technology"],
    disallowedUses: [],
    forProfitEligible: true,
    requiresIncorporation: true,
    requiresUniversityAffiliation: false,
    requiresTechnology: false,
    requiresResearch: false,
    requiredDocuments: ["business-plan", "project-budget", "project-description"],
    deadline: hit.closeDate ?? "See Grants.gov",
    status,
    sourceUrl: detailUrl,
    applicationUrl: detailUrl,
    lastVerified: new Date().toISOString().slice(0, 10),
    geographicScope: "Federal opportunity; applicant eligibility must be verified",
    description: `Live Grants.gov result ${opportunityNumber}. Detailed for-profit and small-business eligibility must be confirmed in the official notice.`,
    applicationComplexity: "high",
  };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { opportunities: [], message: "A valid industry is required." },
      { status: 400 },
    );
  }

  const keywords = [
    parsed.data.industry,
    parsed.data.description?.match(
      /\b(technology|health|energy|climate|manufacturing|research|software)\b/i,
    )?.[0],
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const response = await fetch("https://api.grants.gov/v1/api/search2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: keywords,
        oppStatuses: "posted|forecasted",
        rows: 8,
        startRecordNum: 0,
      }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Grants.gov returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: { oppHits?: GrantHit[] };
    };
    const opportunities = (payload.data?.oppHits ?? [])
      .map(normalizeHit)
      .filter(
        (opportunity): opportunity is FundingOpportunity =>
          opportunity !== null,
      )
      .slice(0, 5);

    return NextResponse.json({
      opportunities,
      query: keywords,
      source: "Grants.gov Search2",
    });
  } catch {
    return NextResponse.json(
      {
        opportunities: [],
        query: keywords,
        source: "Grants.gov Search2",
        message:
          "Live federal search is temporarily unavailable. Curated Houston and Texas results are still shown.",
      },
      { status: 502 },
    );
  }
}
