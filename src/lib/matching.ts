import { documentLabel, fundingNeedLabel } from "@/lib/format";
import {
  FounderProfile,
  FundingOpportunity,
  MatchEvidence,
  OpportunityMatch,
} from "@/lib/types";

function locationMatch(profile: FounderProfile, opportunity: FundingOpportunity) {
  return opportunity.eligibleLocations.some((location) => {
    if (location === "Texas") return true;
    if (location === "Harris") return profile.county === "Harris";
    return profile.location.toLowerCase().includes(location.toLowerCase());
  });
}

function industryMatch(profile: FounderProfile, opportunity: FundingOpportunity) {
  if (opportunity.industries.includes("all")) return true;
  const industry = profile.industry.toLowerCase();
  return opportunity.industries.some((term) => industry.includes(term));
}

function amountMatch(profile: FounderProfile, opportunity: FundingOpportunity) {
  if (opportunity.amountMin === 0 && opportunity.amountMax === 0) return true;
  return (
    profile.fundingAmount >= opportunity.amountMin &&
    profile.fundingAmount <= opportunity.amountMax
  );
}

function overlapUses(
  profile: FounderProfile,
  opportunity: FundingOpportunity,
) {
  return profile.fundingNeeds.filter((need) =>
    opportunity.allowedUses.includes(need),
  );
}

function evidence(
  label: string,
  requirement: string,
  founderValue: string,
  passed: boolean,
  blocking = false,
): MatchEvidence {
  return {
    label,
    requirement,
    founderValue,
    state: passed ? "satisfied" : blocking ? "missing" : "verify",
    blocking: blocking && !passed,
  };
}

export function matchOpportunity(
  profile: FounderProfile,
  opportunity: FundingOpportunity,
): OpportunityMatch {
  const reasons: string[] = [];
  const concerns: string[] = [];
  const matchEvidence: MatchEvidence[] = [];
  let eligibilityPoints = 0;
  let fitPoints = 0;
  let hardBlockers = 0;

  const hasLocation = locationMatch(profile, opportunity);
  matchEvidence.push(
    evidence(
      "Location",
      opportunity.geographicScope,
      `${profile.location}, ${profile.county} County`,
      hasLocation,
      true,
    ),
  );
  if (hasLocation) {
    eligibilityPoints += 12;
    reasons.push("Your Houston-area location is within the program scope.");
  } else {
    hardBlockers += 1;
    concerns.push("Your location appears outside the eligible service area.");
  }

  const entityEligible = profile.forProfit && opportunity.forProfitEligible;
  matchEvidence.push(
    evidence(
      "Entity type",
      "For-profit businesses accepted",
      profile.forProfit ? "For-profit" : "Not for-profit",
      entityEligible,
      true,
    ),
  );
  if (entityEligible) eligibilityPoints += 6;
  else hardBlockers += 1;

  const stageEligible = opportunity.businessStages.includes(profile.stage);
  matchEvidence.push(
    evidence(
      "Business stage",
      opportunity.businessStages.join(", "),
      profile.stage,
      stageEligible,
      true,
    ),
  );
  if (stageEligible) {
    eligibilityPoints += 10;
    reasons.push("Your current business stage is accepted.");
  } else {
    hardBlockers += 1;
    concerns.push("The program targets a different business stage.");
  }

  if (opportunity.requiresIncorporation) {
    matchEvidence.push(
      evidence(
        "Incorporation",
        "Registered business required",
        profile.incorporated ? "Incorporated" : "Not yet incorporated",
        profile.incorporated,
        true,
      ),
    );
    if (profile.incorporated) eligibilityPoints += 5;
    else {
      hardBlockers += 1;
      concerns.push("Business registration must be completed before applying.");
    }
  } else {
    eligibilityPoints += 5;
  }

  if (opportunity.requiresUniversityAffiliation) {
    matchEvidence.push(
      evidence(
        "University affiliation",
        "University affiliation required",
        profile.universityAffiliated ? "Affiliated" : "Not affiliated",
        profile.universityAffiliated,
        true,
      ),
    );
    if (profile.universityAffiliated) eligibilityPoints += 5;
    else {
      hardBlockers += 1;
      concerns.push("University affiliation is required.");
    }
  } else {
    eligibilityPoints += 5;
  }

  if (opportunity.requiresTechnology) {
    matchEvidence.push(
      evidence(
        "Technology",
        "Technology component required",
        profile.technologyComponent ? profile.industry : "No technology component",
        profile.technologyComponent,
        true,
      ),
    );
    if (profile.technologyComponent) eligibilityPoints += 4;
    else {
      hardBlockers += 1;
      concerns.push("A qualifying technology component is required.");
    }
  } else {
    eligibilityPoints += 4;
  }

  if (opportunity.requiresResearch) {
    matchEvidence.push(
      evidence(
        "Research activity",
        "R&D activity required",
        profile.researchComponent ? "Active R&D" : "No formal R&D",
        profile.researchComponent,
        true,
      ),
    );
    if (profile.researchComponent) eligibilityPoints += 3;
    else {
      hardBlockers += 1;
      concerns.push("The program requires active research or commercialization.");
    }
  } else {
    eligibilityPoints += 3;
  }

  const employeesEligible =
    (opportunity.minEmployees === undefined ||
      profile.employees >= opportunity.minEmployees) &&
    (opportunity.maxEmployees === undefined ||
      profile.employees <= opportunity.maxEmployees);
  if (
    opportunity.minEmployees !== undefined ||
    opportunity.maxEmployees !== undefined
  ) {
    const range = `${opportunity.minEmployees ?? 0}–${opportunity.maxEmployees ?? "unlimited"} employees`;
    matchEvidence.push(
      evidence(
        "Team size",
        range,
        `${profile.employees} employees`,
        employeesEligible,
        true,
      ),
    );
    if (!employeesEligible) {
      hardBlockers += 1;
      concerns.push("Your team size falls outside the stated range.");
    }
  }
  if (employeesEligible) eligibilityPoints += 5;

  const operatingRevenueRequired =
    opportunity.revenueRequirement?.toLowerCase().includes("operating") ||
    opportunity.revenueRequirement?.toLowerCase().includes("two years");
  const revenueEligible =
    !operatingRevenueRequired || profile.revenueBand !== "pre-revenue";
  if (opportunity.revenueRequirement) {
    matchEvidence.push(
      evidence(
        "Revenue",
        opportunity.revenueRequirement,
        profile.revenueBand.replaceAll("-", " "),
        revenueEligible,
        true,
      ),
    );
    if (!revenueEligible) {
      hardBlockers += 1;
      concerns.push("Operating revenue or history is required.");
    }
  }

  const uses = overlapUses(profile, opportunity);
  const useRatio = uses.length / Math.max(profile.fundingNeeds.length, 1);
  fitPoints += Math.round(useRatio * 20);
  if (uses.length > 0) {
    reasons.push(
      `${uses.map(fundingNeedLabel).join(" and ")} are permitted uses.`,
    );
  } else {
    concerns.push("Your intended use of funds does not align with this program.");
  }

  const hasDisallowedUse = profile.fundingNeeds.some((need) =>
    opportunity.disallowedUses.includes(need),
  );
  if (hasDisallowedUse) {
    fitPoints = Math.max(0, fitPoints - 6);
    concerns.push("At least one stated funding need is explicitly restricted.");
  }

  const requestedAmountFits = amountMatch(profile, opportunity);
  matchEvidence.push(
    evidence(
      "Funding amount",
      opportunity.amountMax === 0
        ? "No direct award"
        : `$${opportunity.amountMin.toLocaleString()}–$${opportunity.amountMax.toLocaleString()}`,
      `$${profile.fundingAmount.toLocaleString()} requested`,
      requestedAmountFits,
    ),
  );
  if (requestedAmountFits) {
    fitPoints += 9;
    reasons.push("Your requested amount fits the available range.");
  } else {
    fitPoints += 2;
    concerns.push("The available award does not fully match your requested amount.");
  }

  if (industryMatch(profile, opportunity)) {
    fitPoints += 6;
    reasons.push("Your industry aligns with the opportunity focus.");
  } else {
    concerns.push("The opportunity has a weaker industry alignment.");
  }

  const availableDocumentKinds = new Set(
    profile.documents.map((document) => document.kind),
  );
  const missingDocuments = opportunity.requiredDocuments.filter(
    (kind) => !availableDocumentKinds.has(kind),
  );
  const readiness =
    opportunity.requiredDocuments.length === 0
      ? 100
      : Math.round(
          ((opportunity.requiredDocuments.length - missingDocuments.length) /
            opportunity.requiredDocuments.length) *
            100,
        );

  opportunity.requiredDocuments.forEach((kind) => {
    const present = availableDocumentKinds.has(kind);
    matchEvidence.push({
      label: documentLabel(kind),
      requirement: "Required document",
      founderValue: present ? "Available" : "Not found",
      state: present ? "satisfied" : "missing",
    });
  });

  if (missingDocuments.length) {
    concerns.push(
      `Missing ${missingDocuments.map(documentLabel).join(", ")}.`,
    );
  }

  const rawScore = eligibilityPoints + fitPoints + Math.round(readiness * 0.16);
  const score = Math.max(
    12,
    Math.min(98, rawScore - hardBlockers * 13),
  );
  const verdict =
    hardBlockers > 0 || score < 55
      ? "poor"
      : score >= 78
        ? "strong"
        : "possible";
  const eligibility =
    hardBlockers > 0 ? "unlikely" : concerns.length > 2 ? "verify" : "likely";
  const fit = useRatio >= 0.66 && requestedAmountFits ? "strong" : useRatio > 0 ? "moderate" : "poor";
  const biggestTask = missingDocuments.length
    ? `Prepare ${documentLabel(missingDocuments[0]).toLowerCase()}.`
    : hardBlockers > 0
      ? concerns[0]
      : "Confirm final eligibility with the funding organization.";

  return {
    opportunity,
    score,
    verdict,
    eligibility,
    fit,
    readiness,
    evidence: matchEvidence,
    reasons: reasons.slice(0, 4),
    concerns: concerns.slice(0, 4),
    missingDocuments,
    biggestTask,
  };
}

export function rankOpportunities(
  profile: FounderProfile,
  opportunities: FundingOpportunity[],
) {
  return opportunities
    .map((opportunity) => matchOpportunity(profile, opportunity))
    .sort((a, b) => b.score - a.score);
}
