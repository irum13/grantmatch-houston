"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit3, SearchX, Sparkles } from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { MatchCard } from "@/components/match-card";
import { fundingOpportunities } from "@/data/opportunities";
import {
  formatCurrency,
  fundingNeedLabel,
  stageLabel,
} from "@/lib/format";
import { rankOpportunities } from "@/lib/matching";
import { FundingOpportunity } from "@/lib/types";

type Filter = "all" | "strong" | "possible" | "grant" | "competition" | "support";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All recommended" },
  { value: "strong", label: "Strong" },
  { value: "possible", label: "Possible" },
  { value: "grant", label: "Grants" },
  { value: "competition", label: "Competitions" },
  { value: "support", label: "Support" },
];

export default function MatchesPage() {
  const {
    profile,
    mode,
    hydrated,
    liveOpportunities,
    setLiveOpportunities,
  } = useGrantMatch();
  const [filter, setFilter] = useState<Filter>("all");
  const [liveSearch, setLiveSearch] = useState<{
    status: "idle" | "loading" | "complete" | "error";
    opportunities: FundingOpportunity[];
    message?: string;
  }>({ status: "idle", opportunities: [] });

  useEffect(() => {
    if (mode !== "real" || !profile || liveSearch.status !== "idle") return;

    Promise.all([
      fetch("/api/opportunities", { cache: "no-store" }).then(
        async (response) =>
          (await response.json()) as {
            opportunities?: FundingOpportunity[];
          },
      ),
      fetch("/api/grants/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: profile.industry,
          description: profile.description,
        }),
      }).then(async (response) => ({
        response,
        data: (await response.json()) as {
          opportunities?: FundingOpportunity[];
          message?: string;
        },
      })),
    ])
      .then(([curatedResult, grantsResult]) => {
        const federal = grantsResult.data.opportunities ?? [];
        setLiveOpportunities([
          ...(curatedResult.opportunities ?? []),
          ...federal,
        ]);
        setLiveSearch({
          status: grantsResult.response.ok ? "complete" : "error",
          opportunities: federal,
          message: grantsResult.data.message,
        });
      })
      .catch(() => {
        setLiveSearch({
          status: "error",
          opportunities: [],
          message: "Live federal search could not be reached.",
        });
      });
  }, [
    mode,
    profile,
    liveSearch.status,
    setLiveOpportunities,
  ]);

  const matches = useMemo(() => {
    if (!profile) return [];
    const curated =
      mode === "demo"
        ? fundingOpportunities
        : fundingOpportunities.filter((opportunity) => !opportunity.demoOnly);
    const applicable = [
      ...new Map(
        [...curated, ...liveOpportunities].map((opportunity) => [
          opportunity.id,
          opportunity,
        ]),
      ).values(),
    ];
    return rankOpportunities(profile, applicable);
  }, [profile, mode, liveOpportunities]);

  if (!hydrated) return null;

  if (!profile) {
    return (
      <div className="page-shell empty-state">
        <SearchX size={42} />
        <h1>No business profile found</h1>
        <p>
          Choose a demo scenario or tell us about your business before running
          GrantMatch.
        </p>
        <div className="button-row">
          <Link href="/demo" className="button primary">
            Choose a demo
          </Link>
          <Link href="/onboarding" className="button secondary">
            Use my business
          </Link>
        </div>
      </div>
    );
  }

  const recommended = matches.filter((match) => match.verdict !== "poor");
  const ruledOut = matches.filter((match) => match.verdict === "poor");
  const strongCount = matches.filter((match) => match.verdict === "strong").length;
  const possibleCount = matches.filter(
    (match) => match.verdict === "possible",
  ).length;
  const visible = recommended.filter((match) => {
    if (filter === "all") return true;
    if (filter === "strong" || filter === "possible") {
      return match.verdict === filter;
    }
    return match.opportunity.fundingType === filter;
  });

  return (
    <div className="page-shell dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} />
            Personalized funding roadmap
          </span>
          <h1>Funding matches</h1>
          <p>
            {strongCount} strong · {possibleCount} possible · {ruledOut.length}{" "}
            ruled out
          </p>
        </div>
        <Link
          href={mode === "demo" ? `/demo/${profile.slug}` : "/profile/review"}
          className="button secondary small"
        >
          <Edit3 size={14} />
          Edit profile
        </Link>
      </header>

      <div className="profile-summary">
        <strong>{profile.name}</strong>
        <span className="mini-chip">{profile.location}</span>
        <span className="mini-chip">{stageLabel(profile.stage)}</span>
        <span className="mini-chip">
          Seeking {formatCurrency(profile.fundingAmount)}
        </span>
        {profile.fundingNeeds.map((need) => (
          <span className="mini-chip" key={need}>
            {fundingNeedLabel(need)}
          </span>
        ))}
      </div>

      <div className="filters" aria-label="Filter funding matches">
        {filters.map((item) => (
          <button
            type="button"
            className={`filter-chip ${filter === item.value ? "active" : ""}`}
            onClick={() => setFilter(item.value)}
            key={item.value}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="results-layout">
        <div>
          <div className="match-list">
            {visible.map((match) => (
              <MatchCard match={match} key={match.opportunity.id} />
            ))}
            {visible.length === 0 && (
              <div className="panel empty-state">
                <SearchX size={32} />
                <h2>No results in this filter</h2>
                <p>Try another category to view your recommended resources.</p>
              </div>
            )}
          </div>

          <section className="why-not">
            <h2>Why not? Opportunities GrantMatch ruled out</h2>
            <div className="match-list">
              {ruledOut.slice(0, 4).map((match) => (
                <MatchCard match={match} key={match.opportunity.id} />
              ))}
            </div>
          </section>
        </div>

        <aside className="sticky-panel">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>How results are ranked</h3>
                <p>Recommendation scores are explainable, not guarantees.</p>
              </div>
            </div>
            <div className="profile-list">
              <div className="profile-item">
                <span>Eligibility</span>
                <span>Location + requirements</span>
              </div>
              <div className="profile-item">
                <span>Fit</span>
                <span>Use + amount + stage</span>
              </div>
              <div className="profile-item">
                <span>Readiness</span>
                <span>Required documents</span>
              </div>
              <div className="profile-item">
                <span>Reliability</span>
                <span>Source + verification date</span>
              </div>
            </div>
          </section>
          {mode === "real" && (
            <div
              className={`notice ${
                liveSearch.status === "error" ? "amber" : ""
              }`}
              style={{ marginTop: 14 }}
            >
              {liveSearch.status === "idle" ||
              liveSearch.status === "loading"
                ? "Searching Grants.gov for live federal opportunities…"
                : liveSearch.status === "complete"
                  ? `${liveSearch.opportunities.length} live Grants.gov opportunities added. Detailed eligibility still requires verification.`
                  : liveSearch.message}
            </div>
          )}
          {mode === "demo" && (
            <div className="notice amber" style={{ marginTop: 14 }}>
              Demo-only programs are fictional and visibly labelled. Public
              resources link to their official providers.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
