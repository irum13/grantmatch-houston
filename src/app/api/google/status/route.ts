import { NextRequest, NextResponse } from "next/server";
import {
  clearGoogleToken,
  getGoogleToken,
  googleConfigured,
  hasGoogleServiceScope,
  GoogleService,
} from "@/lib/google";

const services: GoogleService[] = ["drive", "gmail", "calendar"];

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(
    "service",
  ) as GoogleService | null;
  const token = await getGoogleToken();

  return NextResponse.json({
    configured: googleConfigured(),
    connected: Boolean(token),
    services: Object.fromEntries(
      services.map((service) => [
        service,
        hasGoogleServiceScope(token, service),
      ]),
    ),
    requestedConnected:
      requested && services.includes(requested)
        ? hasGoogleServiceScope(token, requested)
        : undefined,
  });
}

export async function DELETE() {
  await clearGoogleToken();
  return NextResponse.json({ ok: true });
}
