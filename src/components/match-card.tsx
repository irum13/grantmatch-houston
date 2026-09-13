import Link from "next/link";
import { ArrowRight, AlertTriangle, Clock3 } from "lucide-react";
import {
  formatAmountRange,
  fundingTypeLabel,
} from "@/lib/format";
import { OpportunityMatch } from "@/lib/types";

export function MatchCard({ match }: { match: OpportunityMatch }) {
  const { opportunity } = match;
  return (
    <article className={`match-card ${match.verdict}`}>
      <div className="score-ring" aria-label={`${match.score}% recommendation`}>
        {match.score}%
      </div>
      <div className="match-main">
        <span className="match-provider">{opportunity.provider}</span>
        <h2>{opportunity.name}</h2>
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
            <span className="status-pill verify">demo opportunity</span>
          )}
        </div>
        <p className="match-rationale">
          {formatAmountRange(opportunity.amountMin, opportunity.amountMax)} ·{" "}
          {match.reasons[0] ?? opportunity.description}
        </p>
        {match.concerns[0] && (
          <p className="match-concern">
            <AlertTriangle
              size={13}
              style={{ display: "inline", marginRight: 5 }}
            />
            {match.concerns[0]}
          </p>
        )}
        <p className="match-rationale">
          <Clock3
            size={13}
            style={{ display: "inline", marginRight: 5 }}
          />
          Deadline: {opportunity.deadline} · Readiness {match.readiness}%
        </p>
      </div>
      <div className="match-action">
        <Link href={`/matches/${opportunity.id}`} className="button secondary small">
          View match
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
