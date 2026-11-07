import { describe, expect, it } from "vitest";
import {
  getApplicablePdfDocuments,
  getPdfScopeForRuleset,
  getPdfScopeLabel,
  type PdfDocumentMetadata,
} from "../src/pdfLibrary";

const documents: PdfDocumentMetadata[] = [
  { id: "general", name: "General Reference.pdf", scope: "all", addedAt: "2026-01-01", size: 10 },
  { id: "core", name: "Core Rules.pdf", scope: "core-35-srd", addedAt: "2026-01-02", size: 20 },
  { id: "dragonlance", name: "Dragonlance Rules.pdf", scope: "dragonlance-user-pack", addedAt: "2026-01-03", size: 30 },
];

describe("PDF library ruleset filtering", () => {
  it("shows only general and Core SRD PDFs for Core characters", () => {
    expect(getApplicablePdfDocuments(documents, "core-35-srd").map(({ id }) => id))
      .toEqual(["general", "core"]);
  });

  it("shows only general and Dragonlance PDFs for Dragonlance characters", () => {
    expect(getApplicablePdfDocuments(documents, "dragonlance-user-pack").map(({ id }) => id))
      .toEqual(["general", "dragonlance"]);
  });

  it("maps Dragonlance character variants to the Dragonlance library scope", () => {
    expect(getPdfScopeForRuleset("dragonlance-monster-classes")).toBe("dragonlance-user-pack");
    expect(getPdfScopeLabel("dragonlance-user-pack")).toBe("Dragonlance");
  });
});
