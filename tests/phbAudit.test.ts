import { beforeAll, describe, expect, it } from "vitest";
import { cloneCharacter, initialCharacter, type ClassId } from "../src/domain";
import { featCatalog } from "../src/data/characterCatalog";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { getMaximumHitPoints, getToughnessHitPointBonus } from "../src/hitPoints";
import {
  getAvailableFeatSpellSchoolChoices, getSpellSaveDC, getWizardBonusFeatWarnings,
} from "../src/rules";
import { getSpellSchoolName } from "../src/spellFormatting";
import { srdSpells } from "../src/srdSpells";
import { parseCharacter } from "../src/validation";
import { phbLowLevelSpellCases } from "./phbSpellCases";

beforeAll(loadSpellCatalog);

function hero(classId: ClassId = "wizard", level = 10) {
  const character = cloneCharacter(initialCharacter);
  character.race = "Human";
  character.classLevels = [{ classId, level }];
  character.abilities = { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 18 };
  character.featSelections = {};
  character.hitPoints = 20;
  return character;
}

function feat(id: string) {
  const result = featCatalog.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing feat ${id}.`);
  return result;
}

const words = (value: string) => value.trim().split(/\s+/);
const normalizedHeader = (value: string) => value.replace(/\s+/g, "").toLowerCase();

describe("PHB feat definitions (printed pp. 87-102)", () => {
  const fighterFeats = words(`
    blind-fight combat-expertise improved-disarm improved-feint improved-trip
    whirlwind-attack combat-reflexes dodge mobility spring-attack
    exotic-weapon-proficiency improved-critical improved-initiative
    improved-unarmed-strike improved-grapple deflect-arrows snatch-arrows
    stunning-fist mounted-combat mounted-archery ride-by-attack spirited-charge
    trample point-blank-shot far-shot precise-shot improved-precise-shot
    rapid-shot manyshot shot-on-the-run power-attack cleave great-cleave
    improved-bull-rush improved-overrun improved-sunder quick-draw rapid-reload
    improved-shield-bash two-weapon-fighting two-weapon-defense
    improved-two-weapon-fighting greater-two-weapon-fighting weapon-finesse
    weapon-focus weapon-specialization greater-weapon-focus greater-weapon-specialization
  `);
  const metamagic = words(`
    empower-spell enlarge-spell extend-spell heighten-spell maximize-spell
    quicken-spell silent-spell still-spell widen-spell
  `);
  const crafting = words(`
    brew-potion craft-magic-arms-and-armor craft-rod craft-staff craft-wand
    craft-wondrous-item forge-ring scribe-scroll
  `);

  it("preserves all 109 entries and the source's exact Fighter/metamagic/crafting sets", () => {
    const phb = featCatalog.filter((entry) => entry.sourceBook === "Player's Handbook (3.5)");
    expect(phb).toHaveLength(109);
    expect(new Set(phb.map(({ id }) => id)).size).toBe(109);
    expect(phb.filter(({ fighterBonus }) => fighterBonus).map(({ id }) => id).sort())
      .toEqual(fighterFeats.sort());
    for (const [category, expected] of [["metamagic", metamagic], ["item-creation", crafting]] as const) {
      expect(phb.filter(({ categories }) => categories?.includes(category)).map(({ id }) => id).sort())
        .toEqual(expected.sort());
    }
  });

  it.each([
    ["scribe-scroll", 1], ["brew-potion", 3], ["craft-wondrous-item", 3],
    ["craft-magic-arms-and-armor", 5], ["craft-wand", 5], ["craft-rod", 9],
    ["craft-staff", 12], ["forge-ring", 12],
  ] as const)("requires caster level %s's printed threshold", (id, casterLevel) => {
    expect(feat(id).prerequisites).toEqual({ casterLevel });
  });

  it.each([
    ["combat-expertise", { abilities: { int: 13 } }],
    ["dodge", { abilities: { dex: 13 } }],
    ["power-attack", { abilities: { str: 13 } }],
    ["two-weapon-fighting", { abilities: { dex: 15 } }],
    ["manyshot", { abilities: { dex: 17 }, baseAttackBonus: 6, feats: ["point-blank-shot", "rapid-shot"] }],
    ["improved-precise-shot", { abilities: { dex: 19 }, baseAttackBonus: 11, feats: ["point-blank-shot", "precise-shot"] }],
    ["stunning-fist", { abilities: { dex: 13, wis: 13 }, baseAttackBonus: 8, feats: ["improved-unarmed-strike"] }],
    ["whirlwind-attack", { abilities: { dex: 13, int: 13 }, baseAttackBonus: 4, feats: ["combat-expertise", "dodge", "mobility", "spring-attack"] }],
    ["leadership", { minimumCharacterLevel: 6 }],
    ["spell-mastery", { classLevels: { wizard: 1 } }],
    ["augment-summoning", { spellFocusSchools: ["Conjuration"] }],
  ])("preserves %s's source prerequisite set", (id, prerequisites) => {
    expect(feat(String(id)).prerequisites).toEqual(prerequisites);
  });

  it("requires Greater Spell Focus to match the school and permits repeating it for a new school", () => {
    const character = hero();
    character.featSelections = {
      "general-1": "spell-focus", "general-3": "spell-focus",
      "general-6": "greater-spell-focus", "general-9": "greater-spell-focus",
    };
    character.featSpellSchoolSelections = {
      "general-1": "Evocation", "general-3": "Illusion", "general-6": "Evocation",
    };
    expect(getAvailableFeatSpellSchoolChoices(character, "general-9", "greater-spell-focus"))
      .toEqual(["Illusion"]);
  });

  it("uses Complete Arcane p. 86's swift-action update without allowing spontaneous Quicken", () => {
    const description = feat("quicken-spell").description;
    expect(description).toContain("swift action");
    expect(description).toContain("sharing your swift-action limit");
    expect(description).toContain("spontaneously cast spells cannot be quickened");
    expect(description).not.toContain("free action");
  });

  it("stacks legal Toughness selections without granting HP for an invalid saved Wizard bonus pick", () => {
    const character = hero();
    character.featSelections = {
      "general-1": "toughness", "general-3": "toughness", "wizard-5": "toughness",
    };
    expect(getWizardBonusFeatWarnings(character)).toHaveLength(1);
    expect(getToughnessHitPointBonus(character)).toBe(6);
    expect(getMaximumHitPoints(character)).toBe(26);
    expect(character.featSelections["wizard-5"]).toBe("toughness");
  });
});

describe("PHB level-zero/one spell headers", () => {
  it("covers every represented spell available at level zero or one in any core class", () => {
    const lowLevel = srdSpells.filter(
      ({ level, sourceBook }) => level <= 1 && !sourceBook,
    );
    expect(lowLevel).toHaveLength(120);
    expect(phbLowLevelSpellCases).toHaveLength(115);
    expect([...new Set(lowLevel.map(({ name }) => name))].sort())
      .toEqual(phbLowLevelSpellCases.map(({ name }) => name).sort());
  });

  describe("PHB Phantom Trap / Leomund's Trap duplicate migration", () => {
    const canonical = "Leomund’s Trap";

    it("leaves unrelated imported characters and their existing lists untouched", () => {
      const character = hero();
      character.knownSpells = ["Magic Missile", "Magic Missile"];
      expect(parseCharacter(character)).toBe(character);
      expect(character.knownSpells).toEqual(["Magic Missile", "Magic Missile"]);
    });

    it("preserves spellbook ownership, acquisition, mastery, preparation and learning metadata", () => {
      const character = hero();
      character.knownSpells = ["Phantom Trap"];
      character.knownSpellsByClass = { wizard: ["Phantom Trap"] };
      character.knownSpellClasses = { "Phantom Trap": "wizard" };
      character.preparedSpells = ["Phantom Trap", "Phantom Trap"];
      character.preparedSpellsByClass = { wizard: [...character.preparedSpells] };
      character.spellAcquisitionByClass = { wizard: { "Phantom Trap": "scroll" } };
      character.wizardSpellLearning = {
        "Phantom Trap": { source: "scroll", learnedAt: "2026-01-01T00:00:00.000Z", spellcraftTotal: 20 },
      };
      character.featSpellMasterySelections = { "general-1": ["Phantom Trap"] };
      character.preparedSpellSlotLevelsByClass = { wizard: { "Phantom Trap": [2, 6] } };
      character.quickenByClass = { wizard: { "Phantom Trap": [false, true] } };
      const original = cloneCharacter(character);
      const migrated = parseCharacter(character);
      expect(migrated.knownSpells).toEqual([canonical]);
      expect(migrated.knownSpellsByClass?.wizard).toEqual([canonical]);
      expect(migrated.knownSpellClasses).toEqual({ [canonical]: "wizard" });
      expect(migrated.preparedSpells).toEqual([canonical, canonical]);
      expect(migrated.preparedSpellsByClass?.wizard).toEqual([canonical, canonical]);
      expect(migrated.spellAcquisitionByClass?.wizard).toEqual({ [canonical]: "scroll" });
      expect(migrated.wizardSpellLearning?.[canonical]).toEqual(original.wizardSpellLearning?.["Phantom Trap"]);
      expect(migrated.featSpellMasterySelections?.["general-1"]).toEqual([canonical]);
      expect(migrated.preparedSpellSlotLevelsByClass?.wizard).toEqual({ [canonical]: [2, 6] });
      expect(migrated.quickenByClass?.wizard).toEqual({ [canonical]: [false, true] });
      expect(character).toEqual(original);
      expect(parseCharacter(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
    });

    it.each([
      "empowerByClass", "maximizeByClass", "extendByClass", "enlargeByClass",
      "quickenByClass", "silentByClass", "stillByClass", "widenByClass", "sculptByClass",
    ] as const)("merges alias copies without misaligning %s or Heighten slots", (field) => {
      const character = hero();
      character.knownSpells = ["Phantom Trap", canonical];
      character.preparedSpellsByClass = { wizard: ["Phantom Trap", canonical, "Phantom Trap"] };
      character[field] = { wizard: { "Phantom Trap": [false, true] } };
      character.preparedSpellSlotLevelsByClass = { wizard: { [canonical]: [4], "Phantom Trap": [2, 6] } };
      const migrated = parseCharacter(character);
      expect(migrated.knownSpells).toEqual([canonical]);
      expect(migrated.preparedSpellsByClass?.wizard).toEqual([canonical, canonical, canonical]);
      expect(migrated[field]?.wizard).toEqual({ [canonical]: [false, false, true] });
      expect(migrated.preparedSpellSlotLevelsByClass?.wizard).toEqual({ [canonical]: [4, 2, 6] });
    });

    it("pads an unmodified legacy copy after a modified canonical copy", () => {
      const character = hero();
      character.preparedSpellsByClass = { wizard: ["Phantom Trap", canonical] };
      character.extendByClass = { wizard: { [canonical]: [true] } };
      character.preparedSpellSlotLevelsByClass = { wizard: { [canonical]: [5] } };
      const migrated = parseCharacter(character);
      expect(migrated.extendByClass?.wizard).toEqual({ [canonical]: [true, false] });
      expect(migrated.preparedSpellSlotLevelsByClass?.wizard).toEqual({ [canonical]: [5, 2] });
    });

    it("preserves tracking for legacy flat preparations on a multiclass character", () => {
      const character = hero();
      character.classLevels.unshift({ classId: "cleric", level: 1 });
      character.knownSpellClasses = { "Phantom Trap": "wizard", [canonical]: "wizard" };
      character.preparedSpells = ["Phantom Trap", canonical];
      character.preparedSpellsByClass = { cleric: [] };
      character.extendByClass = { wizard: { [canonical]: [true] } };
      const migrated = parseCharacter(character);
      expect(migrated.preparedSpells).toEqual([canonical, canonical]);
      expect(migrated.extendByClass?.wizard).toEqual({ [canonical]: [true, false] });
    });

    it("does not discard conflicting acquisition or class ownership records", () => {
      const character = hero();
      character.spellAcquisitionByClass = { wizard: { "Phantom Trap": "scroll", [canonical]: "level-up" } };
      expect(() => parseCharacter(character)).toThrow(/saved acquisition or class ownership records conflict/);
      character.spellAcquisitionByClass = undefined;
      character.knownSpellClasses = { "Phantom Trap": "wizard", [canonical]: "sorcerer" };
      expect(() => parseCharacter(character)).toThrow(/saved acquisition or class ownership records conflict/);
    });

    it("accepts identical learning metadata regardless of JSON property order", () => {
      const character = hero();
      character.wizardSpellLearning = {
        "Phantom Trap": { source: "scroll", learnedAt: "2026-01-01T00:00:00.000Z" },
        [canonical]: { learnedAt: "2026-01-01T00:00:00.000Z", source: "scroll" },
      };
      expect(Object.keys(parseCharacter(character).wizardSpellLearning ?? {})).toEqual([canonical]);
    });
  });

  it.each(phbLowLevelSpellCases)("matches $name's printed headers (p. $page), including all class-level variants", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(variants.length).toBeGreaterThan(0);
    expect(Object.fromEntries(variants.flatMap((spell) => spell.classes.map((classId) => [classId, spell.level]))))
      .toEqual(expected.levels);
    for (const spell of variants) {
      for (const field of ["school", "components", "castingTime", "range", "duration", "savingThrow"] as const) {
        expect(normalizedHeader(spell[field]), `${expected.name}: ${field}`)
          .toBe(normalizedHeader(expected[field]));
      }
    }
  });

  it.each([
    ["Evocation [Fire]", "Evocation"],
    ["Necromancy [Fear, Mind-Affecting]", "Necromancy"],
    ["Illusion (Pattern) [Mind-Affecting]", "Illusion"],
    ["Conjuration (Creation) [Acid]", "Conjuration"],
    ["Divination", "Divination"],
  ] as const)("recognizes %s's base school for Spell Focus", (header, school) => {
    const character = hero();
    character.featSelections = { "general-1": "spell-focus", "general-3": "greater-spell-focus" };
    character.featSpellSchoolSelections = { "general-1": school, "general-3": school };
    expect(getSpellSchoolName(header)).toBe(school);
    expect(getSpellSaveDC(character, "wizard", 1, header)).toBe(17);
    expect(getSpellSaveDC(hero(), "wizard", 1, header)).toBe(15);
  });

  it("keeps the Gnome illusion bonus separate from scoped Spell Focus", () => {
    const character = hero();
    character.race = "Gnome";
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion [Mind-Affecting]")).toBe(16);
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Pattern) [Mind-Affecting]")).toBe(17);
    expect(getSpellSaveDC(character, "wizard", 1, "Evocation [Fire]")).toBe(15);
  });

  it("applies focus to the actual catalog's newly preserved descriptors", () => {
    const character = hero();
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Evocation" };
    const spell = findSpellByName("Burning Hands");
    if (!spell) throw new Error("Missing Burning Hands.");
    expect(spell.school).toBe("Evocation [Fire]");
    expect(getSpellSaveDC(character, "wizard", spell.level, spell.school)).toBe(16);
  });

  it("removes all Conjuration (Healing) Bard variants only in Dragonlance", () => {
    const healingNames = ["Cure Light Wounds", "Cure Moderate Wounds", "Cure Serious Wounds", "Cure Critical Wounds"];
    const core = getClassSpells("bard");
    const dragonlance = getClassSpells("bard", "dragonlance-user-pack");
    for (const name of healingNames) {
      expect(core.some((spell) => spell.name === name)).toBe(true);
      expect(dragonlance.some((spell) => spell.name === name)).toBe(false);
    }
    expect(getClassSpells("cleric", "dragonlance-user-pack").some(({ name }) => name === "Cure Light Wounds")).toBe(true);
  });

  it.each([
    ["Magic Missile", "maximum five at caster level 9"],
    ["Ray of Enfeeblement", "not ability damage"],
    ["Lullaby", "Will saves against sleep effects"],
    ["Shield", "+4 shield bonus"],
    ["Faerie Fire", "Magical darkness of 2nd level or higher still functions"],
    ["Divine Favor", "minimum +1, maximum +3"],
    ["Produce Flame", "Each attack consumes 1 minute"],
  ])("retains %s's repaired effect boundary", (name, boundary) => {
    const spell = findSpellByName(name);
    expect(spell?.description).toContain(boundary);
  });
});
