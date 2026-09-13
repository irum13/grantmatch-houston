import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().min(20).max(2000),
  providedIndustry: z.string().max(100).optional(),
});

const extractionSchema = z.object({
  industry: z.string().min(2).max(100),
  technologyComponent: z.boolean(),
  researchComponent: z.boolean(),
  suggestedStage: z
    .enum(["idea", "mvp", "testing", "revenue", "growth"])
    .optional(),
  rationale: z.string().min(1).max(300),
});

function heuristicExtraction(
  description: string,
  providedIndustry?: string,
): z.infer<typeof extractionSchema> {
  const value = description.toLowerCase();
  const industry =
    providedIndustry ||
    (/\b(health|patient|clinic|medical)\b/.test(value)
      ? "Healthcare technology"
      : /\b(food|restaurant|kitchen|catering)\b/.test(value)
        ? "Food and hospitality"
        : /\b(energy|carbon|climate|emission)\b/.test(value)
          ? "Climate and energy"
          : /\b(software|platform|ai|app|technology)\b/.test(value)
            ? "Software technology"
            : "Business services");
  const technologyComponent =
    /\b(ai|software|platform|app|technology|algorithm|hardware|data)\b/.test(
      value,
    );
  const researchComponent =
    /\b(research|r&d|prototype|experiment|clinical|commercializ|patent)\b/.test(
      value,
    );
  const suggestedStage = /\brevenue|customers|sales\b/.test(value)
    ? "revenue"
    : /\b(testing|pilot|prototype)\b/.test(value)
      ? "testing"
      : /\bmvp\b/.test(value)
        ? "mvp"
        : "idea";
  return {
    industry,
    technologyComponent,
    researchComponent,
    suggestedStage,
    rationale:
      "Signals were inferred from the business description and remain editable.",
  };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide a business description of at least 20 characters." },
      { status: 400 },
    );
  }

  const fallback = heuristicExtraction(
    parsed.data.description,
    parsed.data.providedIndustry,
  );
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ extraction: fallback, source: "heuristic" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract a conservative funding profile. Return JSON with industry, technologyComponent, researchComponent, suggestedStage, and rationale. Do not invent facts. suggestedStage must be idea, mvp, testing, revenue, or growth.",
          },
          {
            role: "user",
            content: JSON.stringify(parsed.data),
          },
        ],
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("AI extraction failed");
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned no extraction");
    const extraction = extractionSchema.parse(JSON.parse(content));
    return NextResponse.json({ extraction, source: "ai" });
  } catch {
    return NextResponse.json({
      extraction: fallback,
      source: "heuristic-fallback",
      message:
        "AI extraction was unavailable, so conservative local extraction was used.",
    });
  }
}
