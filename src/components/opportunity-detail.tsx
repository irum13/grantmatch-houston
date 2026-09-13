"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  FileCheck2,
  SearchX,
} from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { getOpportunity } from "@/data/opportunities";
import {
  documentLabel,
  formatAmountRange,
  fundingTypeLabel,
} from "@/lib/format";
import { matchOpportunity } from "@/lib/matching";

export function OpportunityDetail({ opportunityId }: { opportunityId: string }) {
  const { profile, hydrated, liveOpportunities } = useGrantMatch();
  const opportunity =
    getOpportunity(opportunityId) ??
    liveOpportunities.find((item) => item.id === opportunityId);

  if (!hydrated) return null;

  if (!profile || !opportunity) {
    return (
      <div className="page-shell empty-state">
        <SearchX size={42} />
        <h1>Match details unavailable</h1>
        <p>
          Your profile may have expired, or this opportunity is no longer in
          the current dataset.
        </p>
        <div className="button-row">
          <Link href="/demo" className="button primary">
            Restart demo
          </Link>
          <Link href="/matches" className="button secondary">
            Back to matches
          </Link>
        </div>
      </div>
    );
  }

  const match = matchOpportunity(profile, opportunity);

  return (
    <>
      <section className="detail-hero">
        <div className="page-shell">
          <Link href="/matches" className="detail-breadcrumb">
            <ArrowLeft size={15} />
            Back to funding matches
          </Link>
          <div className="detail-title-row">
            <div>
              <div className="match-meta">
                <span className="type-pill">
                  {fundingTypeLabel(opportunity.fundingType)}
                </span>
                <span className={`status-pill ${match.verdict}`}>
                  {match.verdict} match
                </span>
                <span className={`status-pill ${opportunity.status}`}>
                  {opportunity.status}
                </span>
                {opportunity.demoOnly && (
                  <span className="status-pill verify">fictional demo</span>
                )}
              </div>
              <h1>{opportunity.name}</h1>
              <p>
                {opportunity.provider} ·{" "}
                {formatAmountRange(opportunity.amountMin, opportunity.amountMax)}{" "}
                · {opportunity.geographicScope}
              </p>
            </div>
            <div className="detail-score">
              <strong>{match.score}%</strong>
              <span>recommendation score</span>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-content">
        <div className="page-shell detail-grid">
          <div>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Why it matches</h2>
                  <p>
                    Evidence based on the profile you reviewed and confirmed.
                  </p>
                </div>
              </div>
              <div className="reason-list">
                {match.reasons.map((reason) => (
                  <div className="reason-row" key={reason}>
                    <span className="reason-icon good">
                      <Check size={14} />
                    </span>
                    <div>
                      <strong>Aligned</strong>
                      <p>{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {match.concerns.length > 0 && (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Potential issues</h2>
                    <p>
                      Resolve or verify these before investing time in an
                      application.
                    </p>
                  </div>
                </div>
                <div className="reason-list">
                  {match.concerns.map((concern) => (
                    <div className="reason-row" key={concern}>
                      <span className="reason-icon warn">
                        <AlertTriangle size={14} />
                      </span>
                      <div>
                        <strong>Attention needed</strong>
                        <p>{concern}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Requirement evidence</h2>
                  <p>
                    A percentage never overrides a missing hard requirement.
                  </p>
                </div>
              </div>
              <div className="requirement-list">
                {match.evidence.map((item, index) => (
                  <div
                    className="requirement-row"
                    key={`${item.label}-${index}`}
                  >
                    <strong>{item.label}</strong>
                    <span>
                      {item.founderValue} · {item.requirement}
                    </span>
                    <span className={`status-pill ${item.state}`}>
                      {item.state === "satisfied"
                        ? "Satisfied"
                        : item.state === "missing"
                          ? "Missing"
                          : "Verify"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="sticky-panel">
            <section className="readiness">
              <div className="readiness-score">
                <div>
                  <span>Application readiness</span>
                  <strong>{match.readiness}%</strong>
                </div>
                <FileCheck2 size={28} />
              </div>
              <div className="meter" aria-label={`${match.readiness}% ready`}>
                <span style={{ width: `${match.readiness}%` }} />
              </div>
              <p>Biggest remaining task: {match.biggestTask}</p>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Opportunity facts</h3>
                </div>
              </div>
              <div className="profile-list">
                <div className="profile-item">
                  <span>Deadline</span>
                  <span>{opportunity.deadline}</span>
                </div>
                <div className="profile-item">
                  <span>Complexity</span>
                  <span>{opportunity.applicationComplexity}</span>
                </div>
                <div className="profile-item">
                  <span>Last verified</span>
                  <span>{opportunity.lastVerified}</span>
                </div>
                <div className="profile-item">
                  <span>Documents missing</span>
                  <span>
                    {match.missingDocuments.length
                      ? match.missingDocuments.map(documentLabel).join(", ")
                      : "None identified"}
                  </span>
                </div>
              </div>
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="button secondary"
                style={{ width: "100%", marginTop: 16 }}
              >
                View official source
                <ExternalLink size={15} />
              </a>
            </section>

            <Link
              href={`/matches/${opportunity.id}/plan`}
              className="button primary"
              style={{ width: "100%", marginTop: 14 }}
            >
              Build my action plan
              <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
