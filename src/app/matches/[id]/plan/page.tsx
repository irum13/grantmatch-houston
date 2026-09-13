import { ActionPlan } from "@/components/action-plan";
import { fundingOpportunities } from "@/data/opportunities";

export function generateStaticParams() {
  return fundingOpportunities.map((opportunity) => ({ id: opportunity.id }));
}

export default async function MatchActionPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActionPlan opportunityId={id} />;
}
