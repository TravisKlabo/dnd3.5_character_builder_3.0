import { beforeAll, describe, expect, it } from "vitest";
import { findSpellByName, getClassSpells, getSrdSpellSourceBook, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbEighthLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);
const phbSpells = srdSpells.filter(({ sourceBook }) => !sourceBook);

describe("PHB catalog minimum-level-8 spell definitions", () => {
  it("covers the complete group and every higher-level variant exactly once", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 8).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 8 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbEighthLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(46);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(49);
    expect(phbEighthLevelSpellCases.every(({ levels }) => Object.keys(levels).length > 0)).toBe(true);
    expect(phbSpells).toHaveLength(715);
    expect(new Set(phbSpells.map(({ name }) => name)).size).toBe(605);
  });

  it.each(phbEighthLevelSpellCases)("matches $name's supplied PHB headers (p. $page) and all class projections", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(variants.length).toBeGreaterThan(0);
    expect(Object.fromEntries(variants.flatMap(({ classes, level }) => classes.map((id) => [id, level]))))
      .toEqual(expected.levels);
    for (const spell of variants) {
      expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
      for (const field of ["school", "components", "castingTime", "range", "duration", "savingThrow"] as const) {
        expect(normalize(spell[field]), `${expected.name}: ${field}`).toBe(normalize(expected[field]));
        expect(spell[field]).not.toMatch(/Target|This spell|CHAPTER/);
      }
      expect(spell.description).toBe(findSpellByName(expected.name)?.description);
      expect(spell.description).not.toMatch(/googletag|quantserve|qevents|<script/);
      for (const { id } of Object.values(classDefinitions)) {
        if (spell.classes.includes(id)) {
          expect(getClassSpells(id).find(({ name }) => name === spell.name)).toMatchObject({
            level: spell.level, school: spell.school, components: spell.components,
            castingTime: spell.castingTime, range: spell.range, duration: spell.duration,
            savingThrow: spell.savingThrow, description: spell.description,
          });
        }
      }
    }
  });
});
