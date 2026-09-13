import { OpportunityDetail } from "@/components/opportunity-detail";
import { fundingOpportunities } from "@/data/opportunities";

export function generateStaticParams() {
  return fundingOpportunities.map((opportunity) => ({ id: opportunity.id }));
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpportunityDetail opportunityId={id} />;
}
