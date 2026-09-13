import Link from "next/link";
import { ArrowRight, FlaskConical, HeartPulse, Utensils } from "lucide-react";
import { demoScenarios } from "@/data/demo-scenarios";
import {
  formatCurrency,
  fundingNeedLabel,
  stageLabel,
} from "@/lib/format";

const icons = {
  "houston-ai-health": HeartPulse,
  "bayou-bites-kitchen": Utensils,
  "carbonloop-materials": FlaskConical,
};

export default function DemoPage() {
  return (
    <>
      <section className="page-intro">
        <div className="page-shell page-intro-row">
          <div className="section-heading">
            <span className="eyebrow">Demo mode · No sign-in required</span>
            <h1>Choose a founder scenario.</h1>
            <p>
              Start with a realistic fictional business, inspect its documents,
              and see how changing the funding need changes the result.
            </p>
          </div>
          <Link href="/onboarding" className="button secondary small">
            Use my own business
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="page-shell" style={{ paddingBottom: 80 }}>
        <div className="scenario-grid">
          {demoScenarios.map((scenario) => {
            const Icon = icons[scenario.slug as keyof typeof icons];
            return (
              <article className="scenario-card" key={scenario.id}>
                <div className="scenario-icon">
                  <Icon size={23} />
                </div>
                <h2>{scenario.name}</h2>
                <p>{scenario.description}</p>
                <div className="chip-row">
                  <span className="mini-chip">{scenario.location}</span>
                  <span className="mini-chip">{stageLabel(scenario.stage)}</span>
                  <span className="mini-chip">
                    Seeking {formatCurrency(scenario.fundingAmount)}
                  </span>
                  <span className="mini-chip">
                    {scenario.fundingNeeds
                      .slice(0, 2)
                      .map(fundingNeedLabel)
                      .join(" + ")}
                  </span>
                </div>
                <Link
                  href={`/demo/${scenario.slug}`}
                  className="button primary"
                >
                  Try this scenario
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
        <div className="notice neutral" style={{ marginTop: 22 }}>
          These businesses, files, and demo-only funding programs are fictional.
          Real public resources remain linked to their official sources.
        </div>
      </section>
    </>
  );
}
