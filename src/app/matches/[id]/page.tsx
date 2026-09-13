import { OpportunityDetail } from "@/components/opportunity-detail";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpportunityDetail opportunityId={id} />;
}
