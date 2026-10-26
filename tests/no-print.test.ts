import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : Promise.resolve([target]);
  }));
  return groups.flat();
}

it("has no application printing APIs, print styles, preview markup, or print URL modes", async () => {
  const files = [...await sourceFiles("src"), ...await sourceFiles("desktop")];
  const forbidden = /window\.print\s*\(|\.printToPDF\s*\(|webContents\.print\s*\(|@media\s+print\b|print-preview|reference-print|modern-print|print-button|\.get\(["']print["']\)/;
  for (const file of files.filter((name) => /\.(tsx?|css|cjs)$/.test(name))) {
    expect(await readFile(file, "utf8"), file).not.toMatch(forbidden);
  }
});
