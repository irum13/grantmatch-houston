import { NextRequest, NextResponse } from "next/server";
import {
  createPkce,
  getGoogleToken,
  googleConfigured,
  googleScopes,
  GoogleService,
  storeOAuthState,
} from "@/lib/google";

const services = new Set<GoogleService>(["drive", "gmail", "calendar"]);

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service") as GoogleService;
  const requestedReturnTo =
    request.nextUrl.searchParams.get("returnTo") ?? "/";
  const returnTo =
    requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/";

  if (!services.has(service) || !googleConfigured()) {
    const fallback = new URL(returnTo, request.nextUrl.origin);
    fallback.searchParams.set(
      "googleError",
      !googleConfigured() ? "not_configured" : "invalid_service",
    );
    return NextResponse.redirect(fallback);
  }

  const { verifier, challenge } = createPkce();
  const state = crypto.randomUUID();
  await storeOAuthState({
    state,
    verifier,
    service,
    returnTo,
    createdAt: Date.now(),
  });

  const existingToken = await getGoogleToken();
  const requestedScopes = new Set([
    ...googleScopes[service],
    ...(existingToken?.scope.split(" ") ?? []),
  ]);
  const callbackUrl = `${request.nextUrl.origin}/api/google/callback`;
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", [...requestedScopes].join(" "));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("access_type", "offline");
  authorizeUrl.searchParams.set("include_granted_scopes", "true");
  authorizeUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authorizeUrl);
}
