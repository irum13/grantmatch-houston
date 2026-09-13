import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hasGoogleServiceScope,
  validGoogleAccessToken,
} from "@/lib/google";
import { DocumentKind, FounderDocument } from "@/lib/types";

const requestSchema = z.object({
  fileIds: z
    .array(z.string().regex(/^[A-Za-z0-9_-]+$/))
    .min(1)
    .max(6),
});

function documentKind(name: string): DocumentKind {
  const value = name.toLowerCase();
  if (value.includes("budget")) return "project-budget";
  if (value.includes("pitch") || value.includes("deck")) return "pitch-deck";
  if (value.includes("financial")) return "financials";
  if (value.includes("registration")) return "registration";
  if (value.includes("project")) return "project-description";
  return "business-plan";
}

function formatForMimeType(mimeType: string): FounderDocument["format"] {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "XLSX";
  }
  if (mimeType.includes("wordprocessing") || mimeType.includes("word")) {
    return "DOCX";
  }
  return "PDF";
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Choose between one and six valid Drive files." },
      { status: 400 },
    );
  }

  const token = await validGoogleAccessToken();
  if (!token || !hasGoogleServiceScope(token, "drive")) {
    return NextResponse.json(
      { ok: false, requiresAuth: true, message: "Google Drive access expired." },
      { status: 401 },
    );
  }

  try {
    const documents = await Promise.all(
      parsed.data.fileIds.map(async (id): Promise<FounderDocument> => {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,modifiedTime`,
          {
            headers: { Authorization: `Bearer ${token.accessToken}` },
            cache: "no-store",
          },
        );
        if (!response.ok) throw new Error("Drive metadata request failed");
        const file = (await response.json()) as {
          id: string;
          name: string;
          mimeType: string;
        };
        return {
          id: `drive-${file.id}`,
          name: file.name,
          kind: documentKind(file.name),
          format: formatForMimeType(file.mimeType),
          summary:
            "Selected from Google Drive. Only this file's metadata is retained in the current session.",
        };
      }),
    );

    return NextResponse.json({ ok: true, documents });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "One or more selected files could not be read. No broad Drive listing was requested.",
      },
      { status: 502 },
    );
  }
}
