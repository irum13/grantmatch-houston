import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";

export type GoogleService = "drive" | "gmail" | "calendar";

export interface GoogleToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
}

export interface GoogleOAuthState {
  state: string;
  verifier: string;
  service: GoogleService;
  returnTo: string;
  createdAt: number;
}

const TOKEN_COOKIE = "grantmatch_google";
const STATE_COOKIE = "grantmatch_google_state";

export const googleScopes: Record<GoogleService, string[]> = {
  drive: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.file",
  ],
  gmail: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.compose",
  ],
  calendar: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ],
};

function encryptionKey() {
  const configured = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!configured) return null;
  return createHash("sha256").update(configured).digest();
}

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
}

function encrypt(value: object) {
  const key = encryptionKey();
  if (!key) throw new Error("Google token encryption is not configured");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decrypt<T>(value: string): T | null {
  try {
    const key = encryptionKey();
    if (!key) return null;
    const payload = Buffer.from(value, "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
        "utf8",
      ),
    ) as T;
  } catch {
    return null;
  }
}

export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export async function storeOAuthState(state: GoogleOAuthState) {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, encrypt(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });
}

export async function consumeOAuthState() {
  const cookieStore = await cookies();
  const value = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!value) return null;
  const state = decrypt<GoogleOAuthState>(value);
  if (!state || Date.now() - state.createdAt > 10 * 60 * 1000) return null;
  return state;
}

export async function storeGoogleToken(token: GoogleToken) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, encrypt(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getGoogleToken() {
  const value = (await cookies()).get(TOKEN_COOKIE)?.value;
  return value ? decrypt<GoogleToken>(value) : null;
}

export async function clearGoogleToken() {
  (await cookies()).delete(TOKEN_COOKIE);
}

export async function validGoogleAccessToken() {
  const token = await getGoogleToken();
  if (!token) return null;
  if (token.expiresAt > Date.now() + 60_000) return token;
  if (!token.refreshToken) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const refreshed = (await response.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };
  const nextToken: GoogleToken = {
    accessToken: refreshed.access_token,
    refreshToken: token.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
    scope: refreshed.scope ?? token.scope,
  };
  await storeGoogleToken(nextToken);
  return nextToken;
}

export function hasGoogleServiceScope(
  token: GoogleToken | null,
  service: GoogleService,
) {
  if (!token) return false;
  return googleScopes[service]
    .filter((scope) => scope.startsWith("https://"))
    .every((scope) => token.scope.split(" ").includes(scope));
}
