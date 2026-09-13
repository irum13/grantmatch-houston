import { expect, test } from "@playwright/test";

test("judge completes the full demo funding journey", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Funding that fits/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Try the demo" })).toBeVisible();

  await page.getByRole("link", { name: "Try the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a founder scenario." }),
  ).toBeVisible();

  const healthScenario = page
    .getByRole("article")
    .filter({ hasText: "HoustonAI Health" });
  await healthScenario.getByRole("link", { name: "Try this scenario" }).click();

  await expect(
    page.getByRole("heading", { name: "HoustonAI Health" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Analyze business documents" })
    .click();
  await expect(
    page.getByRole("button", { name: "Documents analyzed" }),
  ).toBeVisible();

  await page.getByLabel("Funding amount").selectOption("75000");
  await page.getByLabel("Primary use of funds").selectOption("research");
  await page.getByRole("button", { name: "Find funding" }).click();

  await expect(
    page.getByRole("heading", { name: "Funding matches" }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Why not? Opportunities")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Houston Technology Development Challenge",
    }),
  ).toBeVisible();

  const topMatch = page
    .getByRole("article")
    .filter({ hasText: "Houston Technology Development Challenge" });
  await topMatch.getByRole("link", { name: "View match" }).click();

  await expect(
    page.getByRole("heading", { name: "Requirement evidence" }),
  ).toBeVisible();
  await expect(page.getByText("Application readiness")).toBeVisible();
  await page.getByRole("link", { name: "Build my action plan" }).click();

  await expect(
    page.getByRole("heading", { name: "Application milestones" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview Gmail draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Gmail draft preview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run in demo sandbox" }).click();
  await expect(page.getByText(/safe action was validated/i)).toBeVisible();
});

test("real-user onboarding reaches profile review without credentials", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Use my own business" }).click();

  await page.getByLabel("Business name").fill("Space City Robotics");
  await page
    .getByRole("button", { name: /Early-stage startup/ })
    .click();
  await page.getByLabel("ZIP code").fill("77002");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByLabel("Business description")
    .fill(
      "We are building an AI robotics platform and testing an MVP with Houston manufacturers.",
    );
  await page.getByLabel("Primary industry").fill("Manufacturing technology");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(
    page.getByRole("heading", { name: "Where are you today?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "MVP" }).click();
  await page.getByLabel("Employees, including founders").fill("4");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "R&D" }).click();
  await page.getByRole("button", { name: "Product development" }).click();
  await page.getByLabel("Amount requested").fill("60000");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByRole("button", { name: /Business is incorporated/ })
    .click();
  await page.getByRole("button", { name: /Technology is central/ }).click();
  await page
    .getByRole("button", { name: "Continue to documents" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Do you have business documents?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip documents for now" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Here's what GrantMatch understood.",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Business name")).toHaveValue(
    "Space City Robotics",
  );
});

test("mobile landing and demo pages do not overflow horizontally", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium");

  await page.goto("/");
  const landingDimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(landingDimensions.scrollWidth).toBeLessThanOrEqual(
    landingDimensions.clientWidth,
  );

  await page.getByRole("link", { name: "Try the demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a founder scenario." }),
  ).toBeVisible();
  const demoDimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(demoDimensions.scrollWidth).toBeLessThanOrEqual(
    demoDimensions.clientWidth,
  );
});
