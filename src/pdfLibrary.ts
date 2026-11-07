import type { RulesetId } from "./domain";

export type PdfRulesetScope = "all" | "core-35-srd" | "dragonlance-user-pack";

export interface PdfDocumentMetadata {
  id: string;
  name: string;
  scope: PdfRulesetScope;
  addedAt: string;
  size: number;
}

export interface StoredPdfDocument extends PdfDocumentMetadata {
  pdf: Blob;
}

export function isPdfRulesetScope(value: string): value is PdfRulesetScope {
  return value === "all" || value === "core-35-srd" || value === "dragonlance-user-pack";
}

export function getPdfScopeForRuleset(ruleset: RulesetId): Exclude<PdfRulesetScope, "all"> {
  return ruleset === "core-35-srd" ? "core-35-srd" : "dragonlance-user-pack";
}

export function getPdfScopeLabel(scope: PdfRulesetScope): string {
  switch (scope) {
    case "all":
      return "All rulesets";
    case "core-35-srd":
      return "Core SRD";
    case "dragonlance-user-pack":
      return "Dragonlance";
  }
}

export function getApplicablePdfDocuments(
  documents: PdfDocumentMetadata[],
  ruleset: RulesetId,
): PdfDocumentMetadata[] {
  const activeScope = getPdfScopeForRuleset(ruleset);
  return documents.filter((document) => document.scope === "all" || document.scope === activeScope);
}
