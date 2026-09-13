import { describe, expect, it } from "vitest";
import { demoScenarios } from "@/data/demo-scenarios";
import { getOpportunity } from "@/data/opportunities";
import { matchOpportunity, rankOpportunities } from "@/lib/matching";

function requiredOpportunity(id: string) {
  const opportunity = getOpportunity(id);
  if (!opportunity) throw new Error(`Missing test opportunity: ${id}`);
  return opportunity;
}

describe("GrantMatch scoring", () => {
  it("prioritizes R&D funding for the healthcare technology scenario", () => {
    const profile = structuredClone(demoScenarios[0]);
    profile.fundingNeeds = ["research", "product-development"];

    const ranked = rankOpportunities(profile, [
      requiredOpportunity("demo-tech-development"),
      requiredOpportunity("demo-small-business-equipment"),
    ]);

    expect(ranked[0].opportunity.id).toBe("demo-tech-development");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reasons.join(" ")).toContain("permitted uses");
  });

  it("materially changes fit when the stated use of funds changes", () => {
    const equipmentProgram = requiredOpportunity(
      "demo-small-business-equipment",
    );
    const equipmentProfile = structuredClone(demoScenarios[1]);
    equipmentProfile.fundingNeeds = ["equipment", "expansion"];
    const researchProfile = structuredClone(equipmentProfile);
    researchProfile.fundingNeeds = ["research"];

    const equipmentMatch = matchOpportunity(equipmentProfile, equipmentProgram);
    const researchMatch = matchOpportunity(researchProfile, equipmentProgram);

    expect(equipmentMatch.score).toBeGreaterThan(researchMatch.score);
    expect(equipmentMatch.fit).toBe("strong");
    expect(researchMatch.fit).toBe("poor");
  });

  it("does not hide a hard eligibility blocker behind full readiness", () => {
    const profile = structuredClone(demoScenarios[0]);
    const opportunity = requiredOpportunity(
      "demo-research-commercialization",
    );
    const match = matchOpportunity(profile, opportunity);

    expect(match.readiness).toBe(100);
    expect(match.verdict).toBe("poor");
    expect(match.eligibility).toBe("unlikely");
    expect(
      match.evidence.some(
        (item) =>
          item.label === "University affiliation" &&
          item.state === "missing" &&
          item.blocking,
      ),
    ).toBe(true);
  });

  it("calculates document readiness from required documents", () => {
    const profile = structuredClone(demoScenarios[0]);
    const opportunity = requiredOpportunity("demo-tech-development");
    const match = matchOpportunity(profile, opportunity);

    expect(match.readiness).toBe(75);
    expect(match.missingDocuments).toEqual(["letter-of-support"]);
    expect(match.biggestTask).toContain("letter of support");
  });
});
