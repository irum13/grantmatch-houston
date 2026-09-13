import { NextResponse } from "next/server";
import {
  hasGoogleServiceScope,
  validGoogleAccessToken,
} from "@/lib/google";

export async function GET() {
  const token = await validGoogleAccessToken();
  if (!token || !hasGoogleServiceScope(token, "drive")) {
    return NextResponse.json(
      {
        ok: false,
        requiresAuth: true,
        message: "Connect Google Drive before choosing files.",
      },
      { status: 401 },
    );
  }

  const apiKey = process.env.GOOGLE_PICKER_API_KEY;
  const appId = process.env.GOOGLE_CLOUD_PROJECT_NUMBER;
  if (!apiKey || !appId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Google Picker is not configured for this deployment. Upload remains available.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    accessToken: token.accessToken,
    apiKey,
    appId,
  });
}
