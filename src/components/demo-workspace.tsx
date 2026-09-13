"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  FileText,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import {
  formatCurrency,
  fundingNeedLabel,
  stageLabel,
  timelineLabel,
} from "@/lib/format";
import { FounderProfile, FundingNeed } from "@/lib/types";

const adjustableNeeds: FundingNeed[] = [
  "research",
  "product-development",
  "equipment",
  "hiring",
  "expansion",
];

export function DemoWorkspace({ scenario }: { scenario: FounderProfile }) {
  const router = useRouter();
  const { setProfile, setMode } = useGrantMatch();
  const [amount, setAmount] = useState(scenario.fundingAmount);
  const [need, setNeed] = useState<FundingNeed>(scenario.fundingNeeds[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    setMode("demo");
    setProfile(structuredClone(scenario));
  }, [scenario, setMode, setProfile]);

  function analyzeDocuments() {
    setAnalyzing(true);
    window.setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 900);
  }

  function runMatching() {
    setProfile({
      ...scenario,
      fundingAmount: amount,
      fundingNeeds: [need],
    });
    router.push("/matching");
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-shell page-intro-row">
          <div className="section-heading">
            <span className="eyebrow">Demo mode · Fictional founder</span>
            <h1>{scenario.name}</h1>
            <p>{scenario.description}</p>
          </div>
          <div className="chip-row">
            <span className="mini-chip">{scenario.location}</span>
            <span className="mini-chip">{stageLabel(scenario.stage)}</span>
            <span className="mini-chip">
              {scenario.revenueBand.replaceAll("-", " ")}
            </span>
          </div>
        </div>
      </section>

      <div className="page-shell workspace-layout">
        <div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Business documents</h2>
                <p>
                  Seeded files make document analysis testable without connecting
                  a personal Google account.
                </p>
              </div>
              <span className="status-pill verify">
                {scenario.documents.length} files
              </span>
            </div>

            <div className="document-list">
              {scenario.documents.map((document) => {
                const Icon =
                  document.format === "XLSX" ? FileSpreadsheet : FileText;
                return (
                  <div className="document-row" key={document.id}>
                    <div className="feature-icon">
                      <Icon size={19} />
                    </div>
                    <div>
                      <strong>{document.name}</strong>
                      <span>{document.summary}</span>
                    </div>
                    <span className="document-type">{document.format}</span>
                  </div>
                );
              })}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="button secondary"
                onClick={analyzeDocuments}
                disabled={analyzing || analyzed}
              >
                {analyzing ? (
                  <ScanSearch size={17} />
                ) : analyzed ? (
                  <Check size={17} />
                ) : (
                  <Sparkles size={17} />
                )}
                {analyzing
                  ? "Analyzing files..."
                  : analyzed
                    ? "Documents analyzed"
                    : "Analyze business documents"}
              </button>
            </div>
            {analyzed && (
              <div className="notice" style={{ marginTop: 16 }}>
                <Check size={18} />
                GrantMatch found the business stage, technology focus, funding
                needs, and project budget. Review the extracted profile before
                matching.
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Adjust this scenario</h2>
                <p>
                  Change one variable to see the recommendation order respond.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="amount">Funding amount</label>
                <select
                  id="amount"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                >
                  <option value={25000}>$25,000</option>
                  <option value={50000}>$50,000</option>
                  <option value={75000}>$75,000</option>
                  <option value={100000}>$100,000</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="need">Primary use of funds</label>
                <select
                  id="need"
                  value={need}
                  onChange={(event) =>
                    setNeed(event.target.value as FundingNeed)
                  }
                >
                  {adjustableNeeds.map((item) => (
                    <option value={item} key={item}>
                      {fundingNeedLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        <aside className="sticky-panel">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Here&apos;s what we understood</h3>
                <p>Demo data loaded from this founder scenario.</p>
              </div>
            </div>
            <div className="profile-list">
              <div className="profile-item">
                <span>Business</span>
                <span>{scenario.type.replace("-", " ")}</span>
              </div>
              <div className="profile-item">
                <span>Location</span>
                <span>{scenario.location}</span>
              </div>
              <div className="profile-item">
                <span>Industry</span>
                <span>{scenario.industry}</span>
              </div>
              <div className="profile-item">
                <span>Stage</span>
                <span>{stageLabel(scenario.stage)}</span>
              </div>
              <div className="profile-item">
                <span>Funding need</span>
                <span>{fundingNeedLabel(need)}</span>
              </div>
              <div className="profile-item">
                <span>Amount</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="profile-item">
                <span>Timeline</span>
                <span>{timelineLabel(scenario.fundingTimeline)}</span>
              </div>
            </div>
            <button
              type="button"
              className="button primary"
              style={{ width: "100%", marginTop: 20 }}
              onClick={runMatching}
            >
              Find funding
              <ArrowRight size={17} />
            </button>
          </section>
          <div className="notice amber" style={{ marginTop: 14 }}>
            Demo opportunities are clearly labelled. Never treat fictional data
            as an active funding offer.
          </div>
        </aside>
      </div>
    </>
  );
}
