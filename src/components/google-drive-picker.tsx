"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud } from "lucide-react";
import { FounderDocument } from "@/lib/types";

interface PickerDocument {
  id: string;
  name?: string;
  mimeType?: string;
}

interface PickerData {
  action: string;
  docs?: PickerDocument[];
}

interface PickerInstance {
  setVisible: (visible: boolean) => void;
}

interface PickerBuilderInstance {
  addView: (view: DocsViewInstance) => PickerBuilderInstance;
  setOAuthToken: (token: string) => PickerBuilderInstance;
  setDeveloperKey: (key: string) => PickerBuilderInstance;
  setAppId: (appId: string) => PickerBuilderInstance;
  setCallback: (
    callback: (data: PickerData) => void,
  ) => PickerBuilderInstance;
  build: () => PickerInstance;
}

interface DocsViewInstance {
  setIncludeFolders: (include: boolean) => DocsViewInstance;
  setSelectFolderEnabled: (enabled: boolean) => DocsViewInstance;
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: () => void) => void;
    };
    google?: {
      picker: {
        Action: { PICKED: string };
        PickerBuilder: new () => PickerBuilderInstance;
        DocsView: new () => DocsViewInstance;
      };
    };
  }
}

function loadPickerLibrary() {
  return new Promise<void>((resolve, reject) => {
    if (window.gapi && window.google?.picker) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-picker-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-picker-script";
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Picker failed to load"));
    document.head.appendChild(script);
  });
}

export function GoogleDrivePicker({
  onDocuments,
  onMessage,
}: {
  onDocuments: (documents: FounderDocument[]) => void;
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function importFiles(fileIds: string[]) {
    const response = await fetch("/api/google/drive/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      documents?: FounderDocument[];
      message?: string;
    };
    if (!response.ok || !result.documents) {
      throw new Error(result.message ?? "Drive files could not be imported");
    }
    onDocuments(result.documents);
    onMessage(
      `${result.documents.length} selected Drive file${
        result.documents.length === 1 ? "" : "s"
      } added to this session.`,
    );
  }

  async function openPicker() {
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch("/api/google/picker-token", {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        ok: boolean;
        requiresAuth?: boolean;
        accessToken?: string;
        apiKey?: string;
        appId?: string;
        message?: string;
      };

      if (response.status === 401 || result.requiresAuth) {
        router.push(
          "/api/google/authorize?service=drive&returnTo=%2Fdocuments",
        );
        return;
      }
      if (
        !response.ok ||
        !result.accessToken ||
        !result.apiKey ||
        !result.appId
      ) {
        throw new Error(result.message ?? "Google Picker is unavailable");
      }

      await loadPickerLibrary();
      await new Promise<void>((resolve) => {
        window.gapi?.load("picker", resolve);
      });
      if (!window.google?.picker) {
        throw new Error("Google Picker did not initialize");
      }

      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(result.accessToken)
        .setDeveloperKey(result.apiKey)
        .setAppId(result.appId)
        .setCallback((data) => {
          if (
            data.action === window.google?.picker.Action.PICKED &&
            data.docs?.length
          ) {
            void importFiles(data.docs.map((document) => document.id)).catch(
              (error: unknown) =>
                onMessage(
                  error instanceof Error
                    ? error.message
                    : "Drive import failed",
                ),
            );
          }
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      onMessage(
        error instanceof Error ? error.message : "Google Drive is unavailable",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="choice-card"
      onClick={openPicker}
      disabled={busy}
    >
      <Cloud size={22} />
      <strong style={{ marginTop: 10 }}>
        {busy ? "Opening Google Drive..." : "Connect Google Drive"}
      </strong>
      <span>Authorize and choose only the files you want analyzed.</span>
    </button>
  );
}
