import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

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

function textOf(file: string): string {
  return JSON.stringify(
    JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8")),
  ).toLowerCase();
}

describe("consent copy", () => {
  it("has no pre-ticked checkbox in the consent page", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/[locale]/consent/page.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/defaultChecked/);
    expect(source).toContain("useState(false)");
    expect(source).toContain("cloud_opt_in_privacy_link");
  });

  it("has no research-purpose wording in the German and English message files", () => {
    for (const file of ["messages/en.json", "messages/de.json"]) {
      const text = textOf(file);
      for (const phrase of FORBIDDEN) {
        expect(text, `${file} contains ${phrase}`).not.toContain(phrase);
      }
    }
  });
});
