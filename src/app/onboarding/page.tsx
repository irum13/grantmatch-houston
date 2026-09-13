"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";
import { FundingNeed, FounderProfile } from "@/lib/types";
import { fundingNeedLabel } from "@/lib/format";

const businessTypes = [
  { value: "startup", label: "Early-stage startup", hint: "A scalable new venture" },
  { value: "small-business", label: "New / small business", hint: "A local product or service" },
  { value: "student", label: "Student-founded", hint: "A founder or team currently studying" },
  { value: "research", label: "Research spinout", hint: "Commercializing research or IP" },
] as const;

const fundingNeeds: FundingNeed[] = [
  "research",
  "product-development",
  "equipment",
  "technology",
  "hiring",
  "training",
  "pilot",
  "marketing",
  "expansion",
  "working-capital",
];

const initialProfile: FounderProfile = {
  id: "",
  slug: "",
  name: "",
  type: "startup",
  location: "Houston",
  county: "Harris",
  zipCode: "",
  industry: "",
  description: "",
  stage: "idea",
  revenueBand: "pre-revenue",
  employees: 0,
  forProfit: true,
  incorporated: false,
  studentFounder: false,
  universityAffiliated: false,
  technologyComponent: false,
  researchComponent: false,
  fundingAmount: 50000,
  fundingNeeds: [],
  fundingTimeline: "1-3-months",
  ownershipAttributes: [],
  documents: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, setMode } = useGrantMatch();
  const [step, setStep] = useState(0);
  const [profile, update] = useState<FounderProfile>(initialProfile);
  const [extracting, setExtracting] = useState(false);
  const [extractionNote, setExtractionNote] = useState("");

  function set<K extends keyof FounderProfile>(
    key: K,
    value: FounderProfile[K],
  ) {
    update((current) => ({ ...current, [key]: value }));
  }

  function toggleNeed(need: FundingNeed) {
    set(
      "fundingNeeds",
      profile.fundingNeeds.includes(need)
        ? profile.fundingNeeds.filter((item) => item !== need)
        : [...profile.fundingNeeds, need],
    );
  }

  const canContinue = [
    Boolean(profile.name && profile.location),
    Boolean(profile.description.length >= 20 && profile.industry),
    true,
    profile.fundingNeeds.length > 0 && profile.fundingAmount > 0,
    true,
  ][step];

  function finish() {
    const normalized: FounderProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
      slug: profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      studentFounder: profile.type === "student" || profile.studentFounder,
      universityAffiliated:
        profile.type === "research" || profile.universityAffiliated,
      researchComponent:
        profile.type === "research" || profile.researchComponent,
    };
    setMode("real");
    setProfile(normalized);
    router.push("/documents");
  }

  async function continueFromCurrentStep() {
    if (step !== 1) {
      setStep(step + 1);
      return;
    }

    if (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "static-judge") {
      setExtractionNote(
        "The public judge build uses the confirmed fields below. Live AI extraction is enabled in the server deployment.",
      );
      setStep(2);
      return;
    }

    setExtracting(true);
    setExtractionNote("");
    try {
      const response = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: profile.description,
          providedIndustry: profile.industry,
        }),
      });
      const result = (await response.json()) as {
        extraction?: {
          industry: string;
          technologyComponent: boolean;
          researchComponent: boolean;
          suggestedStage?: FounderProfile["stage"];
          rationale: string;
        };
        source?: string;
      };
      if (result.extraction) {
        update((current) => ({
          ...current,
          industry: result.extraction?.industry ?? current.industry,
          technologyComponent:
            result.extraction?.technologyComponent ??
            current.technologyComponent,
          researchComponent:
            result.extraction?.researchComponent ?? current.researchComponent,
          stage: result.extraction?.suggestedStage ?? current.stage,
        }));
        setExtractionNote(
          result.source === "ai"
            ? "AI extracted profile signals. You can correct them on the next steps."
            : "Local fallback extraction was used. All suggested signals remain editable.",
        );
      }
      setStep(2);
    } catch {
      setExtractionNote(
        "Extraction was unavailable. Continue by confirming the profile manually.",
      );
      setStep(2);
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="onboarding-shell">
        <div className="stepper" aria-label={`Step ${step + 1} of 5`}>
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              className={`stepper-item ${
                item < step ? "complete" : item === step ? "active" : ""
              }`}
              key={item}
            >
              <span className="stepper-dot">
                {item < step ? <Check size={13} /> : item + 1}
              </span>
              {item < 4 && <span className="stepper-line" />}
            </div>
          ))}
        </div>

        <section className="onboarding-card">
          {step === 0 && (
            <>
              <h1>Tell us about your business.</h1>
              <p>
                Start with the basics. We use location because many Houston-area
                programs have strict geographic boundaries.
              </p>
              <div className="field" style={{ marginBottom: 20 }}>
                <label htmlFor="business-name">Business name</label>
                <input
                  id="business-name"
                  value={profile.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Example: HoustonAI Health"
                />
              </div>
              <span className="field-label">What type of business are you?</span>
              <div className="choice-grid" style={{ marginTop: 9 }}>
                {businessTypes.map((type) => (
                  <button
                    type="button"
                    className={`choice-card ${
                      profile.type === type.value ? "selected" : ""
                    }`}
                    onClick={() => set("type", type.value)}
                    key={type.value}
                  >
                    <strong>{type.label}</strong>
                    <span>{type.hint}</span>
                  </button>
                ))}
              </div>
              <div className="form-grid" style={{ marginTop: 20 }}>
                <div className="field">
                  <label htmlFor="location">Location</label>
                  <select
                    id="location"
                    value={profile.location}
                    onChange={(event) => {
                      const location = event.target.value;
                      set("location", location);
                      set(
                        "county",
                        location === "Other Texas" ? "Other" : "Harris",
                      );
                    }}
                  >
                    <option>Houston</option>
                    <option>Harris County</option>
                    <option>Greater Houston</option>
                    <option>Other Texas</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="zip">ZIP code</label>
                  <input
                    id="zip"
                    inputMode="numeric"
                    value={profile.zipCode}
                    onChange={(event) => set("zipCode", event.target.value)}
                    placeholder="77002"
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1>What are you building?</h1>
              <p>
                Use your own words. GrantMatch will extract useful signals, then
                ask you to confirm them before matching.
              </p>
              <div className="field">
                <label htmlFor="description">Business description</label>
                <textarea
                  id="description"
                  value={profile.description}
                  onChange={(event) => set("description", event.target.value)}
                  placeholder="We're building a software platform that helps..."
                />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label htmlFor="industry">Primary industry</label>
                <input
                  id="industry"
                  value={profile.industry}
                  onChange={(event) => set("industry", event.target.value)}
                  placeholder="Example: Healthcare technology"
                />
              </div>
              <div className="notice" style={{ marginTop: 18 }}>
                AI extraction will suggest stage, technology, and R&amp;D
                signals, but you remain the source of truth.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1>Where are you today?</h1>
              <p>
                Business stage and operating history are common eligibility
                requirements.
              </p>
              {extractionNote && (
                <div className="notice" style={{ marginBottom: 18 }}>
                  {extractionNote}
                </div>
              )}
              <span className="field-label">Current stage</span>
              <div className="filters" style={{ marginTop: 9 }}>
                {(["idea", "mvp", "testing", "revenue", "growth"] as const).map(
                  (stage) => (
                    <button
                      type="button"
                      className={`filter-chip ${
                        profile.stage === stage ? "active" : ""
                      }`}
                      onClick={() => set("stage", stage)}
                      key={stage}
                    >
                      {stage === "mvp"
                        ? "MVP"
                        : stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ),
                )}
              </div>
              <div className="form-grid" style={{ marginTop: 22 }}>
                <div className="field">
                  <label htmlFor="revenue">Annual revenue</label>
                  <select
                    id="revenue"
                    value={profile.revenueBand}
                    onChange={(event) =>
                      set(
                        "revenueBand",
                        event.target.value as FounderProfile["revenueBand"],
                      )
                    }
                  >
                    <option value="pre-revenue">Pre-revenue</option>
                    <option value="under-50k">Less than $50K</option>
                    <option value="50k-250k">$50K–$250K</option>
                    <option value="over-250k">$250K+</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="employees">Employees, including founders</label>
                  <input
                    id="employees"
                    type="number"
                    min={0}
                    max={500}
                    value={profile.employees}
                    onChange={(event) =>
                      set("employees", Number(event.target.value))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1>What will the money be used for?</h1>
              <p>
                This is the strongest fit signal. Select every use that is part
                of this funding request.
              </p>
              <div className="choice-grid">
                {fundingNeeds.map((need) => (
                  <button
                    type="button"
                    className={`choice-chip ${
                      profile.fundingNeeds.includes(need) ? "selected" : ""
                    }`}
                    onClick={() => toggleNeed(need)}
                    key={need}
                  >
                    {fundingNeedLabel(need)}
                  </button>
                ))}
              </div>
              <div className="form-grid" style={{ marginTop: 22 }}>
                <div className="field">
                  <label htmlFor="funding-amount">Amount requested</label>
                  <input
                    id="funding-amount"
                    type="number"
                    min={1000}
                    step={1000}
                    value={profile.fundingAmount}
                    onChange={(event) =>
                      set("fundingAmount", Number(event.target.value))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="timeline">When do you need it?</label>
                  <select
                    id="timeline"
                    value={profile.fundingTimeline}
                    onChange={(event) =>
                      set(
                        "fundingTimeline",
                        event.target.value as FounderProfile["fundingTimeline"],
                      )
                    }
                  >
                    <option value="asap">ASAP</option>
                    <option value="1-3-months">1–3 months</option>
                    <option value="3-6-months">3–6 months</option>
                    <option value="6-plus-months">6+ months</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1>Final eligibility signals.</h1>
              <p>
                These help prevent false-positive recommendations. We will ask
                more specific questions only when an opportunity requires them.
              </p>
              <div className="choice-grid">
                {[
                  {
                    key: "incorporated" as const,
                    label: "Business is incorporated",
                    hint: "Registered legal business entity",
                  },
                  {
                    key: "technologyComponent" as const,
                    label: "Technology is central",
                    hint: "Software, hardware, or technical innovation",
                  },
                  {
                    key: "researchComponent" as const,
                    label: "Active R&D",
                    hint: "Research, prototype, or commercialization work",
                  },
                  {
                    key: "universityAffiliated" as const,
                    label: "University affiliated",
                    hint: "Student, faculty, licensed IP, or spinout",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    className={`choice-card ${
                      profile[item.key] ? "selected" : ""
                    }`}
                    onClick={() => set(item.key, !profile[item.key])}
                    key={item.key}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                ))}
              </div>
              <div className="notice neutral" style={{ marginTop: 18 }}>
                GrantMatch is designed for for-profit businesses. Sensitive
                ownership details are not required for this initial match.
              </div>
            </>
          )}

          <div className="onboarding-actions">
            <button
              type="button"
              className="button ghost"
              onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              type="button"
              className="button primary"
              disabled={!canContinue || extracting}
              onClick={() =>
                step === 4 ? finish() : void continueFromCurrentStep()
              }
            >
              {extracting
                ? "Understanding your business..."
                : step === 4
                  ? "Continue to documents"
                  : "Continue"}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
