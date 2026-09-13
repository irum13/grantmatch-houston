"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  LockKeyhole,
  SearchX,
  Trash2,
} from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { GoogleDrivePicker } from "@/components/google-drive-picker";
import { DocumentKind, FounderDocument } from "@/lib/types";

function guessDocumentKind(name: string): DocumentKind {
  const normalized = name.toLowerCase();
  if (normalized.includes("budget")) return "project-budget";
  if (normalized.includes("pitch") || normalized.includes("deck")) {
    return "pitch-deck";
  }
  if (normalized.includes("financial")) return "financials";
  if (normalized.includes("registration")) return "registration";
  return "business-plan";
}

export default function DocumentsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile, hydrated } = useGrantMatch();
  const [driveMessage, setDriveMessage] = useState("");

  if (!hydrated) return null;
  if (!profile) {
    return (
      <div className="page-shell empty-state">
        <SearchX size={40} />
        <h1>Complete your business profile first</h1>
        <p>Document analysis is connected to a confirmed founder profile.</p>
        <div className="button-row">
          <button
            className="button primary"
            onClick={() => router.push("/onboarding")}
          >
            Start onboarding
          </button>
        </div>
      </div>
    );
  }

  const founderProfile = profile;

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const additions: FounderDocument[] = files.map((file, index) => {
      const extension = file.name.split(".").pop()?.toUpperCase();
      const format =
        extension === "XLSX" ? "XLSX" : extension === "DOCX" ? "DOCX" : "PDF";
      return {
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        kind: guessDocumentKind(file.name),
        format,
        summary: "Selected for profile and readiness analysis.",
      };
    });
    updateProfile({ documents: [...founderProfile.documents, ...additions] });
    event.target.value = "";
  }

  function removeDocument(id: string) {
    updateProfile({
      documents: founderProfile.documents.filter(
        (document) => document.id !== id,
      ),
    });
  }

  function addDriveDocuments(documents: FounderDocument[]) {
    updateProfile({
      documents: [
        ...founderProfile.documents.filter(
          (current) =>
            !documents.some((document) => document.id === current.id),
        ),
        ...documents,
      ],
    });
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-shell">
          <div className="section-heading">
            <span className="eyebrow">Optional · Step 5 of 5</span>
            <h1>Do you have business documents?</h1>
            <p>
              Documents improve readiness checks. GrantMatch only analyzes files
              you explicitly choose, and you can skip this step.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell workspace-layout">
        <div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Choose how to add documents</h2>
                <p>Business plans, pitch decks, and budgets are most useful.</p>
              </div>
            </div>
            <div className="choice-grid">
              <button
                type="button"
                className="choice-card"
                onClick={() => inputRef.current?.click()}
              >
                <FilePlus2 size={22} />
                <strong style={{ marginTop: 10 }}>Upload files</strong>
                <span>Choose PDF, DOCX, or XLSX files from this device.</span>
              </button>
              <GoogleDrivePicker
                onDocuments={addDriveDocuments}
                onMessage={setDriveMessage}
              />
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx"
              onChange={addFiles}
              style={{ display: "none" }}
            />
            {driveMessage && (
              <div className="notice amber" style={{ marginTop: 16 }}>
                {driveMessage}
              </div>
            )}
            <div className="notice" style={{ marginTop: 16 }}>
              <LockKeyhole size={18} />
              Avoid uploading tax IDs, bank statements, passwords, or full tax
              returns. The hackathon MVP does not need them.
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Selected documents</h2>
                <p>
                  {profile.documents.length
                    ? `${profile.documents.length} document${
                        profile.documents.length === 1 ? "" : "s"
                      } ready for review.`
                    : "No documents selected. You can still receive matches."}
                </p>
              </div>
            </div>
            {profile.documents.length > 0 ? (
              <div className="document-list">
                {profile.documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <div className="feature-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <strong>{document.name}</strong>
                      <span>{document.summary}</span>
                    </div>
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={() => removeDocument(document.id)}
                      aria-label={`Remove ${document.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice neutral">
                Document readiness will be lower until supporting files are
                available.
              </div>
            )}
          </section>
        </div>

        <aside className="sticky-panel">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Continue when ready</h3>
                <p>
                  You&apos;ll review every extracted profile field before
                  matching begins.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="button primary"
              style={{ width: "100%" }}
              onClick={() => router.push("/profile/review")}
            >
              Review my profile
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="button ghost"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => router.push("/profile/review")}
            >
              Skip documents for now
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
