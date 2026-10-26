import { expect, it } from "vitest";
import { getClassSpells, loadSpellCatalog, spells } from "../src/data/spellCatalog";

it("defers all spell data until explicitly requested and deduplicates concurrent loads", async () => {
  expect(spells).toHaveLength(0);
  expect(() => getClassSpells("wizard")).toThrow("has not loaded");
  const first = loadSpellCatalog();
  expect(loadSpellCatalog()).toBe(first);
  await first;
  expect(spells.length).toBeGreaterThan(700);
  const count = spells.length;
  await loadSpellCatalog();
  expect(spells).toHaveLength(count);
});
