import { ActionPlan } from "@/components/action-plan";

export default async function MatchActionPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActionPlan opportunityId={id} />;
}
