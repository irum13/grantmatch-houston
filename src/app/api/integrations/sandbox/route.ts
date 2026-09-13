import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpportunity } from "@/data/opportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  kind: z.enum(["gmail", "calendar"]),
  opportunityId: z.string().min(1).max(100),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

function base64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

const demoCredentialNames = [
  "GOOGLE_DEMO_CLIENT_ID",
  "GOOGLE_DEMO_CLIENT_SECRET",
  "GOOGLE_DEMO_REFRESH_TOKEN",
] as const;

function getDemoCredentials() {
  const rawValues = [
    process.env.GOOGLE_DEMO_CLIENT_ID,
    process.env.GOOGLE_DEMO_CLIENT_SECRET,
    process.env.GOOGLE_DEMO_REFRESH_TOKEN,
  ] as const;
  const values = rawValues.map((value) => value?.trim());
  const missing = demoCredentialNames.filter((_, index) => !values[index]);
  const missingStates = missing.map((name) => {
    const index = demoCredentialNames.indexOf(name);
    const rawValue = rawValues[index];
    const state =
      rawValue === undefined
        ? "undefined"
        : rawValue.length === 0
          ? "empty"
          : "whitespace-only";
    return `${name}=${state}`;
  });

  return {
    credentials:
      missing.length === 0
        ? {
            clientId: values[0] as string,
            clientSecret: values[1] as string,
            refreshToken: values[2] as string,
          }
        : null,
    missing,
    missingStates,
  };
}

async function getDemoAccessToken(): Promise<{
  accessToken: string | null;
  missing: readonly string[];
  missingStates: readonly string[];
}> {
  const configuration = getDemoCredentials();
  if (!configuration.credentials) {
    return {
      accessToken: null,
      missing: configuration.missing,
      missingStates: configuration.missingStates,
    };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: configuration.credentials.clientId,
      client_secret: configuration.credentials.clientSecret,
      refresh_token: configuration.credentials.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to authorize the Google demo account");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google returned no access token");
  return { accessToken: data.access_token, missing: [], missingStates: [] };
}

async function createGmailDraft(accessToken: string, opportunityName: string) {
  const message = [
    "To:",
    `Subject: GrantMatch demo - eligibility question for ${opportunityName}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "This is a safe GrantMatch Houston sandbox draft.",
    "It has no recipient and cannot be sent automatically.",
    "No judge-provided content or private business information is included.",
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

async function createCalendarEvent(
  accessToken: string,
  opportunityName: string,
) {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 45 * 60 * 1000);

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `GrantMatch demo: review ${opportunityName}`,
        description:
          "Safe sandbox event created by GrantMatch Houston. No private founder information is included.",
        start: { dateTime: start.toISOString(), timeZone: "America/Chicago" },
        end: { dateTime: end.toISOString(), timeZone: "America/Chicago" },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error("Calendar event creation failed");
  return (await response.json()) as { id: string };
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientKey = forwarded?.split(",")[0]?.trim() ?? "local";

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      {
        ok: false,
        live: false,
        message: "Demo sandbox limit reached. Try again in ten minutes.",
      },
      { status: 429 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        live: false,
        message: "The requested sandbox action is invalid.",
      },
      { status: 400 },
    );
  }

  const opportunity = getOpportunity(parsed.data.opportunityId);
  if (!opportunity) {
    return NextResponse.json(
      {
        ok: false,
        live: false,
        message: "The selected opportunity could not be found.",
      },
      { status: 404 },
    );
  }

  try {
    const tokenResult = await getDemoAccessToken();
    if (!tokenResult.accessToken) {
      console.warn(
        `[GrantMatch sandbox] Preview fallback: ${tokenResult.missingStates.join(", ")}`,
      );
      return NextResponse.json(
        {
          ok: true,
          live: false,
          id: `preview-${crypto.randomUUID()}`,
          message:
            "The safe action was validated. Add demo Google credentials at deployment to create the external object live.",
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-GrantMatch-Sandbox-Mode": "preview-missing-runtime-config",
            "X-GrantMatch-Missing-Config": tokenResult.missing.join(","),
            "X-GrantMatch-Missing-Config-State":
              tokenResult.missingStates.join(","),
          },
        },
      );
    }

    const result =
      parsed.data.kind === "gmail"
        ? await createGmailDraft(tokenResult.accessToken, opportunity.name)
        : await createCalendarEvent(tokenResult.accessToken, opportunity.name);

    return NextResponse.json(
      {
        ok: true,
        live: true,
        id: result.id,
        message:
          parsed.data.kind === "gmail"
            ? "An unsent, recipient-free draft was created in the project demo account."
            : "A fixed, non-sensitive event was created in the project demo calendar.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-GrantMatch-Sandbox-Mode": "live",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        live: false,
        message:
          "Google rejected the sandbox action. The preview remains available.",
      },
      { status: 502 },
    );
  }
}
