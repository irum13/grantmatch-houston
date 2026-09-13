import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hasGoogleServiceScope,
  validGoogleAccessToken,
} from "@/lib/google";

const gmailSchema = z.object({
  kind: z.literal("gmail"),
  to: z.string().email().optional().or(z.literal("")),
  subject: z.string().min(1).max(180),
  body: z.string().min(1).max(8000),
});

const calendarSchema = z.object({
  kind: z.literal("calendar"),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(180),
        description: z.string().max(1000),
        date: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
});

const actionSchema = z.discriminatedUnion("kind", [
  gmailSchema,
  calendarSchema,
]);

function base64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function createDraft(
  accessToken: string,
  input: z.infer<typeof gmailSchema>,
) {
  const message = [
    `To: ${input.to ?? ""}`,
    `Subject: ${input.subject.replaceAll("\r", " ").replaceAll("\n", " ")}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n");
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: { raw: base64Url(message) } }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Gmail draft creation failed");
  return (await response.json()) as { id: string };
}

async function createCalendarEvents(
  accessToken: string,
  input: z.infer<typeof calendarSchema>,
) {
  const ids: string[] = [];
  try {
    for (const milestone of input.milestones) {
      const parsed = new Date(milestone.date);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid milestone date");
      }
      const date = parsed.toISOString().slice(0, 10);
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: milestone.title,
            description: milestone.description,
            start: { date },
            end: {
              date: new Date(parsed.getTime() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10),
            },
            transparency: "transparent",
          }),
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error("Calendar event creation failed");
      const event = (await response.json()) as { id: string };
      ids.push(event.id);
    }
    return ids;
  } catch (error) {
    await Promise.allSettled(
      ids.map((id) =>
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          },
        ),
      ),
    );
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "The Google action is invalid." },
      { status: 400 },
    );
  }

  const token = await validGoogleAccessToken();
  if (!token || !hasGoogleServiceScope(token, parsed.data.kind)) {
    return NextResponse.json(
      {
        ok: false,
        requiresAuth: true,
        service: parsed.data.kind,
        message: `Connect Google ${parsed.data.kind === "gmail" ? "Gmail" : "Calendar"} to continue.`,
      },
      { status: 401 },
    );
  }

  try {
    if (parsed.data.kind === "gmail") {
      const draft = await createDraft(token.accessToken, parsed.data);
      return NextResponse.json({
        ok: true,
        live: true,
        id: draft.id,
        message: "An unsent Gmail draft was created. Nothing was sent.",
      });
    }

    const eventIds = await createCalendarEvents(token.accessToken, parsed.data);
    return NextResponse.json({
      ok: true,
      live: true,
      id: eventIds.join(", "),
      message: `${eventIds.length} Google Calendar milestones were created.`,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        live: false,
        message:
          "Google could not create the requested item. No partial result is treated as complete.",
      },
      { status: 502 },
    );
  }
}
