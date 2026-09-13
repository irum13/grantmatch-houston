import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Database,
  FileSearch,
  MapPin,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import liveGmailIntegration from "@/assets/live-gmail-integration.png";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="page-shell hero-grid">
          <div>
            <span className="eyebrow">
              <MapPin size={14} />
              Built for Houston founders
            </span>
            <h1 className="display-title">
              Funding that fits <em>your</em> business.
            </h1>
            <p className="hero-copy">
              GrantMatch turns your business needs into a clear, explainable
              funding roadmap—so you know what is worth pursuing and exactly
              what to do next.
            </p>
            <div className="button-row">
              <Link href="/demo" className="button primary">
                Try the demo
                <ArrowRight size={18} />
              </Link>
              <Link href="/onboarding" className="button secondary">
                Use my own business
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} />
                No sign-in for demo
              </span>
              <span>
                <ShieldCheck size={15} />
                Source-linked results
              </span>
              <span>
                <Sparkles size={15} />
                Explainable recommendations
              </span>
            </div>
          </div>

          <div className="hero-preview" aria-label="Funding match preview">
            <div className="preview-window">
              <div className="preview-header">
                <strong>Funding matches</strong>
                <div className="preview-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="preview-body">
                <div className="preview-profile">
                  <strong>HoustonAI Health</strong>
                  <span>Houston · MVP · Seeking $50K · R&amp;D</span>
                </div>
                <div className="preview-match">
                  <div className="preview-score">
                    <span>Strong match</span>
                    <span>91%</span>
                  </div>
                  <h3>Technology Development Program</h3>
                  <p>Grant · $25K–$75K · Deadline Dec. 15</p>
                  <div className="chip-row">
                    <span className="mini-chip">Eligible</span>
                    <span className="mini-chip">R&amp;D aligned</span>
                    <span className="mini-chip">78% ready</span>
                  </div>
                </div>
                <div className="preview-match">
                  <div className="preview-score">
                    <span style={{ color: "#9a5a08" }}>Possible match</span>
                    <span style={{ color: "#9a5a08" }}>67%</span>
                  </div>
                  <h3>Houston Founder Launch Award</h3>
                  <p>Competition · Up to $30K · 1 item to verify</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="page-shell">
          <div className="section-heading centered">
            <span className="eyebrow">From uncertainty to action</span>
            <h2>More than a list of grants.</h2>
            <p>
              GrantMatch evaluates eligibility, real-world fit, and application
              readiness—then explains every recommendation.
            </p>
          </div>
          <div className="three-column">
            <article className="feature-card">
              <div className="feature-icon">
                <FileSearch size={22} />
              </div>
              <h3>Understand your business</h3>
              <p>
                We turn your description and selected documents into a funding
                profile you can review and correct.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <SearchCheck size={22} />
              </div>
              <h3>See why it matches</h3>
              <p>
                Every result shows the requirements you satisfy, possible
                blockers, permitted uses, and source evidence.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <Route size={22} />
              </div>
              <h3>Know what to do next</h3>
              <p>
                Convert a promising match into a document checklist, realistic
                timeline, calendar plan, and outreach draft.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-shell">
          <div className="section-heading">
            <span className="eyebrow">Trusted inputs</span>
            <h2>Local knowledge, live discovery.</h2>
            <p>
              Curated Houston and Texas programs are combined with federal
              opportunity search, while every recommendation keeps the original
              source visible.
            </p>
          </div>
          <div className="three-column">
            <article className="feature-card">
              <div className="feature-icon">
                <Database size={22} />
              </div>
              <h3>Houston + Texas</h3>
              <p>
                High-quality local programs, competitions, financing
                alternatives, and founder support resources.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <BadgeCheck size={22} />
              </div>
              <h3>Verified context</h3>
              <p>
                Status, last-verified date, location, requirements, permitted
                uses, and application source stay attached to every record.
              </p>
            </article>
            <article className="feature-card">
              <div className="feature-icon">
                <CalendarCheck size={22} />
              </div>
              <h3>Application-ready</h3>
              <p>
                Missing documents become tasks, and deadlines become milestones
                instead of another forgotten browser tab.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="judge-guide">
        <div className="page-shell judge-guide">
          <div>
            <span className="eyebrow">Judge guide</span>
            <h2>See the full story in under two minutes.</h2>
            <p>
              The demo uses fictional founders and safe documents. No Google
              account or private information is required.
            </p>
            <Link href="/demo" className="button primary">
              Start recommended demo
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="judge-steps">
            <div className="judge-step">
              <span>1</span>
              Choose the AI Healthcare founder scenario.
            </div>
            <div className="judge-step">
              <span>2</span>
              Analyze its seeded business plan, budget, and pitch deck.
            </div>
            <div className="judge-step">
              <span>3</span>
              Change the funding purpose and watch recommendations respond.
            </div>
            <div className="judge-step">
              <span>4</span>
              Open a match and generate the application action plan.
            </div>
          </div>
          <figure className="judge-evidence">
            <div className="judge-evidence-meta">
              <span className="judge-evidence-label">
                <BadgeCheck size={16} />
                Live deployed evidence
              </span>
              <span>Captured from the project demo account</span>
            </div>
            <Image
              className="judge-evidence-image"
              src={liveGmailIntegration}
              alt="Gmail showing the unsent GrantMatch demo draft created by the live deployed integration"
              sizes="(max-width: 900px) 100vw, 1120px"
              unoptimized
            />
            <figcaption>
              <strong>Live Gmail integration:</strong> GrantMatch created an
              unsent draft in the project demo account.
              <span>
                This screenshot is evidence from the live deployed demo, not a
                mockup.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
