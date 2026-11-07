import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PdfLibrary } from "../src/components/PdfLibrary";
import { listPdfDocuments } from "../src/pdfLibraryStorage";
import type { PdfDocumentMetadata } from "../src/pdfLibrary";

vi.mock("../src/pdfLibraryStorage", () => ({
  deletePdfDocument: vi.fn(),
  listPdfDocuments: vi.fn(),
  loadPdfDocument: vi.fn(),
  savePdfDocument: vi.fn(),
}));

const documents: PdfDocumentMetadata[] = [
  { id: "core", name: "Core Rules.pdf", scope: "core-35-srd", addedAt: "2026-01-01", size: 10 },
  { id: "dragonlance", name: "Dragonlance Rules.pdf", scope: "dragonlance-user-pack", addedAt: "2026-01-02", size: 20 },
];

describe("PDF library screen", () => {
  beforeEach(() => {
    vi.mocked(listPdfDocuments).mockResolvedValue(documents);
  });

  it("only lists PDFs matching the active character ruleset", async () => {
    render(<PdfLibrary ruleset="core-35-srd" />);

    expect(await screen.findByText("Core Rules.pdf")).toBeDefined();
    expect(screen.queryByText("Dragonlance Rules.pdf")).toBeNull();
    expect(screen.getByText("1 PDF is hidden because it belongs to another ruleset.")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Show other rulesets' PDFs for reference"));
    expect(screen.getByText("Dragonlance Rules.pdf")).toBeDefined();
    expect(screen.getByText("These references do not change or apply rules to the active character.")).toBeDefined();
  });
});
