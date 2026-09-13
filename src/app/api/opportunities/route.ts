import { NextResponse } from "next/server";
import { listPublicOpportunities } from "@/lib/opportunity-repository";

export async function GET() {
  const result = await listPublicOpportunities();
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
