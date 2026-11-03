import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("styles printable character sheets for letter-size printing", async () => {
  const stylesheet = await readFile(
    "src/components/PrintableCharacterSheet.css",
    "utf8",
  );
  expect(stylesheet).toMatch(/@media\s+print\s*\{/);
  expect(stylesheet).toMatch(/@page\s*\{\s*size:\s*letter portrait;\s*margin:\s*0;\s*\}/);
  expect(stylesheet).toMatch(/body \* \{\s*visibility: hidden !important;/);
  expect(stylesheet).toMatch(/\.print-sheet-view, \.print-sheet-view \* \{\s*visibility: visible !important;/);
  expect(stylesheet).toMatch(/\.print-sheet-actions \{\s*display: none !important;/);
  expect(stylesheet).toMatch(/\.reference-sheet-page \{\s*width: 8\.5in !important;\s*height: 11in !important;/);
});
