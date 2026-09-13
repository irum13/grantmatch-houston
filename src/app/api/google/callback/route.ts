import { NextRequest, NextResponse } from "next/server";
import {
  consumeOAuthState,
  getGoogleToken,
  GoogleToken,
  storeGoogleToken,
} from "@/lib/google";

function errorRedirect(origin: string, returnTo: string, code: string) {
  const url = new URL(returnTo, origin);
  url.searchParams.set("googleError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const savedState = await consumeOAuthState();
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (!savedState) {
    return errorRedirect(request.nextUrl.origin, "/", "expired_state");
  }
  if (oauthError) {
    return errorRedirect(
      request.nextUrl.origin,
      savedState.returnTo,
      oauthError,
    );
  }
  if (!code || returnedState !== savedState.state) {
    return errorRedirect(
      request.nextUrl.origin,
      savedState.returnTo,
      "invalid_state",
    );
  }

  const callbackUrl = `${request.nextUrl.origin}/api/google/callback`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
      code_verifier: savedState.verifier,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return errorRedirect(
      request.nextUrl.origin,
      savedState.returnTo,
      "token_exchange_failed",
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  const existing = await getGoogleToken();
  const token: GoogleToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? existing?.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
  await storeGoogleToken(token);

  const successUrl = new URL(savedState.returnTo, request.nextUrl.origin);
  successUrl.searchParams.set("googleConnected", savedState.service);
  return NextResponse.redirect(successUrl);
}
