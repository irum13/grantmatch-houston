"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  SearchX,
  Sparkles,
} from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { FounderProfile } from "@/lib/types";
import {
  formatCurrency,
  fundingNeedLabel,
  stageLabel,
  timelineLabel,
} from "@/lib/format";

export default function ProfileReviewPage() {
  const router = useRouter();
  const { profile, updateProfile, hydrated } = useGrantMatch();

  if (!hydrated) return null;
  if (!profile) {
    return (
      <div className="page-shell empty-state">
        <SearchX size={40} />
        <h1>No profile to review</h1>
        <p>Tell us about your business before confirming a funding profile.</p>
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

  function set<K extends keyof FounderProfile>(
    key: K,
    value: FounderProfile[K],
  ) {
    updateProfile({ [key]: value } as Partial<FounderProfile>);
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-shell">
          <div className="section-heading">
            <span className="eyebrow">
              <Sparkles size={14} />
              AI-assisted profile review
            </span>
            <h1>Here&apos;s what GrantMatch understood.</h1>
            <p>
              Correct anything that is wrong. This confirmed profile—not an
              unchecked AI guess—will drive eligibility and ranking.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell workspace-layout">
        <div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Business profile</h2>
                <p>All fields remain editable before matching.</p>
              </div>
              <span className="status-pill possible">Needs confirmation</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="review-name">Business name</label>
                <input
                  id="review-name"
                  value={profile.name}
                  onChange={(event) => set("name", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="review-industry">Industry</label>
                <input
                  id="review-industry"
                  value={profile.industry}
                  onChange={(event) => set("industry", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="review-location">Location</label>
                <input
                  id="review-location"
                  value={profile.location}
                  onChange={(event) => set("location", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="review-stage">Stage</label>
                <select
                  id="review-stage"
                  value={profile.stage}
                  onChange={(event) =>
                    set("stage", event.target.value as FounderProfile["stage"])
                  }
                >
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="testing">Testing</option>
                  <option value="revenue">Revenue</option>
                  <option value="growth">Growth</option>
                </select>
              </div>
              <div className="field full">
                <label htmlFor="review-description">Business description</label>
                <textarea
                  id="review-description"
                  value={profile.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Funding request</h2>
                <p>The permitted use of money strongly affects fit.</p>
              </div>
            </div>
            <div className="profile-list">
              <div className="profile-item">
                <span>Amount requested</span>
                <span>{formatCurrency(profile.fundingAmount)}</span>
              </div>
              <div className="profile-item">
                <span>Uses</span>
                <span>
                  {profile.fundingNeeds.map(fundingNeedLabel).join(", ")}
                </span>
              </div>
              <div className="profile-item">
                <span>Timeline</span>
                <span>{timelineLabel(profile.fundingTimeline)}</span>
              </div>
              <div className="profile-item">
                <span>Stage</span>
                <span>{stageLabel(profile.stage)}</span>
              </div>
            </div>
            <button
              type="button"
              className="button ghost small"
              style={{ marginTop: 12 }}
              onClick={() => router.push("/onboarding")}
            >
              Edit funding request
            </button>
          </section>
        </div>

        <aside className="sticky-panel">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Readiness inputs</h3>
                <p>
                  {profile.documents.length} selected document
                  {profile.documents.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {profile.documents.length ? (
              <div className="document-list">
                {profile.documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <FileText size={17} />
                    <div>
                      <strong>{document.name}</strong>
                      <span>{document.kind.replaceAll("-", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice neutral">
                No files selected. You can still match and add documents later.
              </div>
            )}
          </section>

          <section className="panel">
            <div className="notice">
              <CheckCircle2 size={18} />
              By continuing, you confirm that this profile accurately describes
              your business and current funding request.
            </div>
            <button
              type="button"
              className="button primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => router.push("/matching")}
            >
              Confirm and find funding
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="button ghost"
              style={{ width: "100%", marginTop: 7 }}
              onClick={() => router.push("/documents")}
            >
              <ArrowLeft size={15} />
              Back to documents
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
