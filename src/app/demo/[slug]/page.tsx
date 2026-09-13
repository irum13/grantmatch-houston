import { notFound } from "next/navigation";
import { DemoWorkspace } from "@/components/demo-workspace";
import { getDemoScenario } from "@/data/demo-scenarios";

export default async function DemoScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenario = getDemoScenario(slug);

  if (!scenario) notFound();

  return <DemoWorkspace scenario={scenario} />;
}
