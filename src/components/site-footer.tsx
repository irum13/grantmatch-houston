import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        <div>
          <strong>GrantMatch Houston</strong>
          <p>Explainable funding guidance for Houston founders.</p>
        </div>
        <div className="footer-links">
          <Link href="/demo">Demo</Link>
          <Link href="/onboarding">Use my business</Link>
          <a
            href="https://www.houstontx.gov/obo/"
            target="_blank"
            rel="noreferrer"
          >
            Houston OBO
          </a>
        </div>
        <p className="footer-disclaimer">
          Informational screening only. Confirm final eligibility with each
          funding organization.
        </p>
      </div>
    </footer>
  );
}
