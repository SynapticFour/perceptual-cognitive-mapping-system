import { expect, test } from "@playwright/test";

const FORBIDDEN = [
  "for research purposes",
  "für forschungszwecke",
  "research participation",
  "forschungsteilnahme",
  "scientific research",
  "wissenschaftliche forschung",
  "research questionnaire",
  "forschungsfragebogen",
  "einwilligung in die forschung",
  "completely anonymous",
  "vollständig anonym",
];

test("consent page has no pre-ticked box and no research-purpose wording in de and en", async ({
  page,
}) => {
  for (const path of ["/consent", "/de/consent"]) {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();
    const boxes = page.locator('input[type="checkbox"]');
    const count = await boxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(boxes.nth(i)).not.toBeChecked();
    }
    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const phrase of FORBIDDEN) {
      expect(text, `${path} contains ${phrase}`).not.toContain(phrase);
    }
  }
});
