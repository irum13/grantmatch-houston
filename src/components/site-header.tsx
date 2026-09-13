"use client";

import Link from "next/link";
import { CircleHelp, Landmark, MapPin } from "lucide-react";
import { useGrantMatch } from "@/components/grantmatch-provider";

export function SiteHeader() {
  const { mode, profile } = useGrantMatch();

  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Link href="/" className="brand" aria-label="GrantMatch Houston home">
          <span className="brand-mark" aria-hidden="true">
            <Landmark size={20} strokeWidth={2.2} />
          </span>
          <span>
            GrantMatch <strong>Houston</strong>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Primary navigation">
          {profile && (
            <span className={`mode-badge ${mode}`}>
              {mode === "demo" ? "Demo mode" : "My business"}
            </span>
          )}
          <span className="coverage-label">
            <MapPin size={15} />
            Houston-first
          </span>
          <Link href="/#judge-guide" className="nav-link">
            <CircleHelp size={17} />
            <span>Judge guide</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
