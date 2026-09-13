"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  FileText,
  Mail,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { getOpportunity } from "@/data/opportunities";
import { documentLabel } from "@/lib/format";
import { matchOpportunity } from "@/lib/matching";

interface Milestone {
  title: string;
  description: string;
  date: string;
  isoDate: string;
}

interface IntegrationReceipt {
  ok: boolean;
  live: boolean;
  id?: string;
  message: string;
}

function buildMilestones(deadline: string): Milestone[] {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(deadline)
    ? new Date(`${deadline}T12:00:00`)
    : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const offsets = [35, 25, 14, 7, 0];
  const titles = [
    "Confirm final eligibility",
    "Gather missing documents",
    "Complete first application draft",
    "Review and resolve gaps",
    "Submit application",
  ];
  const descriptions = [
    "Review the official source and clarify unresolved requirements.",
    "Prepare budget, evidence, registration, and letters of support.",
    "Draft the narrative using only confirmed business information.",
    "Check every requirement and ask a trusted reviewer for feedback.",
    "Complete the funder's submission process before the deadline.",
  ];

  return titles.map((title, index) => {
    const date = new Date(parsed);
    date.setDate(date.getDate() - offsets[index]);
    return {
      title,
      description: descriptions[index],
      isoDate: date.toISOString(),
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  });
}

export function ActionPlan({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const { profile, mode, hydrated, liveOpportunities } = useGrantMatch();
  const opportunity =
    getOpportunity(opportunityId) ??
    liveOpportunities.find((item) => item.id === opportunityId);
  const [preview, setPreview] = useState<"email" | "calendar" | null>(null);
  const [receipt, setReceipt] = useState<IntegrationReceipt | null>(null);
  const [running, setRunning] = useState(false);

  const milestones = useMemo(
    () => buildMilestones(opportunity?.deadline ?? "Rolling"),
    [opportunity?.deadline],
  );

  if (!hydrated) return null;
  if (!profile || !opportunity) {
    return (
      <div className="page-shell empty-state">
        <SearchX size={40} />
        <h1>Action plan unavailable</h1>
        <p>Open a funding match first to create its application roadmap.</p>
        <div className="button-row">
          <Link href="/matches" className="button primary">
            Back to matches
          </Link>
        </div>
      </div>
    );
  }

  const selectedOpportunity = opportunity;
  const founderProfile = profile;
  const match = matchOpportunity(founderProfile, selectedOpportunity);
  const emailBody = `Hello,\n\nI am evaluating ${selectedOpportunity.name} for a Houston-based ${founderProfile.industry.toLowerCase()} business. Could you confirm whether our ${founderProfile.stage.toUpperCase()}-stage, ${founderProfile.revenueBand.replaceAll("-", " ")} company is eligible and whether the program permits ${founderProfile.fundingNeeds.join(", ")} costs?\n\nThank you.`;

  async function runSandbox(kind: "gmail" | "calendar") {
    setRunning(true);
    setReceipt(null);
    try {
      const response = await fetch("/api/integrations/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, opportunityId }),
      });
      const result = (await response.json()) as IntegrationReceipt;
      setReceipt(result);
    } catch {
      setReceipt({
        ok: false,
        live: false,
        message: "The integration sandbox could not be reached.",
      });
    } finally {
      setRunning(false);
    }
  }

  async function runUserAction(kind: "gmail" | "calendar") {
    setRunning(true);
    setReceipt(null);
    try {
      const response = await fetch("/api/google/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "gmail"
            ? {
                kind,
                to: "",
                subject: `Eligibility question — ${selectedOpportunity.name}`,
                body: emailBody,
              }
            : {
                kind,
                milestones: milestones.map((milestone) => ({
                  title: `${selectedOpportunity.name}: ${milestone.title}`,
                  description: milestone.description,
                  date: milestone.isoDate,
                })),
              },
        ),
      });
      const result = (await response.json()) as IntegrationReceipt & {
        requiresAuth?: boolean;
      };
      if (response.status === 401 && result.requiresAuth) {
        const returnTo = window.location.pathname;
        router.push(
          `/api/google/authorize?service=${kind}&returnTo=${encodeURIComponent(returnTo)}`,
        );
        return;
      }
      setReceipt(result);
    } catch {
      setReceipt({
        ok: false,
        live: false,
        message: "The Google action could not be reached.",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-shell">
          <Link
            href={`/matches/${opportunity.id}`}
            className="detail-breadcrumb"
          >
            <ArrowLeft size={15} />
            Back to match evidence
          </Link>
          <div className="section-heading">
            <span className="eyebrow">Your funding action plan</span>
            <h1>Turn this match into progress.</h1>
            <p>
              A practical roadmap for {opportunity.name}, built from your
              readiness gaps and the stated deadline.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell" style={{ paddingBottom: 72 }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Application milestones</h2>
              <p>
                Dates are planning guidance. The official deadline remains the
                source of truth.
              </p>
            </div>
            <span className="status-pill strong">
              {milestones.length} milestones
            </span>
          </div>
          <div className="timeline-list">
            {milestones.map((milestone, index) => (
              <div className="timeline-row" key={milestone.title}>
                <span className="timeline-date">{milestone.date}</span>
                <div>
                  <strong>
                    {index + 1}. {milestone.title}
                  </strong>
                  <p>{milestone.description}</p>
                </div>
                {index === 0 && <Check size={17} color="#19734d" />}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Document checklist</h2>
              <p>Readiness is currently {match.readiness}%.</p>
            </div>
          </div>
          <div className="requirement-list">
            {opportunity.requiredDocuments.map((kind) => {
              const available = !match.missingDocuments.includes(kind);
              return (
                <div className="requirement-row" key={kind}>
                  <strong>{documentLabel(kind)}</strong>
                  <span>
                    {available
                      ? "Found in your selected files"
                      : "Prepare before applying"}
                  </span>
                  <span
                    className={`status-pill ${
                      available ? "satisfied" : "missing"
                    }`}
                  >
                    {available ? "Available" : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Take action with Google</h2>
              <p>
                Review first. GrantMatch never sends email or changes a calendar
                without a separate action.
              </p>
            </div>
          </div>
          <div className="action-grid">
            <article className="action-card">
              <div className="integration-icon">
                <Mail size={22} />
              </div>
              <h3>Draft an eligibility question</h3>
              <p>
                Prepare a concise question about stage, revenue, and permitted
                uses. Nothing is sent automatically.
              </p>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setPreview("email");
                  setReceipt(null);
                }}
              >
                Preview Gmail draft
              </button>
            </article>
            <article className="action-card">
              <div className="integration-icon">
                <CalendarDays size={22} />
              </div>
              <h3>Add the application plan</h3>
              <p>
                Preview five preparation milestones before creating calendar
                events.
              </p>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setPreview("calendar");
                  setReceipt(null);
                }}
              >
                Preview Calendar plan
              </button>
            </article>
            <article className="action-card">
              <div className="integration-icon">
                <FileText size={22} />
              </div>
              <h3>Open the official application</h3>
              <p>
                Continue on the provider&apos;s website after confirming final
                eligibility and current program status.
              </p>
              <a
                href={opportunity.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="button secondary"
              >
                Open application
                <ExternalLink size={15} />
              </a>
            </article>
          </div>
        </section>

        {preview && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {preview === "email"
                    ? "Gmail draft preview"
                    : "Calendar plan preview"}
                </h2>
                <p>
                  {mode === "demo"
                    ? "Demo sandbox uses a project-owned test account and fixed safe actions."
                    : "Connect your Google account only when you are ready to create this action."}
                </p>
              </div>
              <span className="status-pill verify">Preview only</span>
            </div>

            {preview === "email" ? (
              <div className="notice neutral" style={{ whiteSpace: "pre-wrap" }}>
                <strong>Subject: Eligibility question — {opportunity.name}</strong>
                {"\n\n"}
                {emailBody}
              </div>
            ) : (
              <div className="timeline-list">
                {milestones.map((milestone) => (
                  <div className="timeline-row" key={milestone.title}>
                    <span className="timeline-date">{milestone.date}</span>
                    <div>
                      <strong>{milestone.title}</strong>
                      <p>{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="button-row">
              {mode === "demo" ? (
                <button
                  type="button"
                  className="button primary"
                  disabled={running}
                  onClick={() =>
                    runSandbox(preview === "email" ? "gmail" : "calendar")
                  }
                >
                  <ShieldCheck size={17} />
                  {running ? "Running safe sandbox..." : "Run in demo sandbox"}
                </button>
              ) : (
                <button
                  type="button"
                  className="button primary"
                  disabled={running}
                  onClick={() =>
                    runUserAction(preview === "email" ? "gmail" : "calendar")
                  }
                >
                  {running ? "Connecting..." : "Connect Google to create"}
                </button>
              )}
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setPreview(null);
                  setReceipt(null);
                }}
              >
                Cancel
              </button>
            </div>

            {receipt && (
              <div
                className={`notice ${receipt.ok ? "" : "amber"}`}
                style={{ marginTop: 16 }}
              >
                {receipt.ok ? <Check size={18} /> : <ShieldCheck size={18} />}
                <div>
                  <strong>
                    {receipt.live ? "Live integration receipt" : "Safe preview receipt"}
                  </strong>
                  <br />
                  {receipt.message}
                  {receipt.id ? ` Receipt ID: ${receipt.id}` : ""}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
