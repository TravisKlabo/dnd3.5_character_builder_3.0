import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SpellSheets } from "../src/components/SpellSheet";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions, cloneCharacter, initialCharacter, type ClassId } from "../src/domain";
import { getSpellSaveDC } from "../src/rules";
import { srdSpells } from "../src/srdSpells";
import { phbThirdLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);

function caster(classId: ClassId = "druid", level = 9) {
  const character = cloneCharacter(initialCharacter);
  character.race = "Human";
  character.classLevels = [{ classId, level }];
  character.abilities = { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 18 };
  character.featSelections = {};
  return character;
}

describe("PHB minimum-level-3 spell definitions", () => {
  it("covers the complete group and all its class-level records exactly once", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 3).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 3 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbThirdLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(79);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(101);
  });

  it.each(phbThirdLevelSpellCases)("matches $name's printed headers (p. $page) and every class-list projection", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(variants.length).toBeGreaterThan(0);
    expect(Object.fromEntries(variants.flatMap(({ classes, level }) => classes.map((id) => [id, level]))))
      .toEqual(expected.levels);
    for (const spell of variants) {
      for (const field of ["school", "components", "castingTime", "range", "duration", "savingThrow"] as const) {
        expect(normalize(spell[field]), `${expected.name}: ${field}`).toBe(normalize(expected[field]));
      }
      expect(spell.description).toBe(findSpellByName(expected.name)?.description);
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

  it.each([
    ["Animate Dead", ["2 HD per caster level", "4 HD per caster level", "25 gp per undead HD", "Destroyed undead cannot"]],
    ["Arcane Sight", ["120 ft.", "without concentration", "standard action", "currently available"]],
    ["Bestow Curse", ["minimum 1", "each turn", "Cannot be dispelled"]],
    ["Blink", ["50% miss chance", "20% miss chance", "three-quarters speed", "force effects and abjurations"]],
    ["Call Lightning", ["3d6 electricity", "3d10", "standard action", "maximum ten", "not underwater"]],
    ["Charm Monster", ["any type or size", "opposed Charisma", "Will negates", "break the charm"]],
    ["Clairaudience/Clairvoyance", ["stationary", "sight or hearing", "only on your plane", "magical darkness prevents"]],
    ["Command Plants", ["2 HD per caster level", "opposed Charisma", "not", "ordinary plants"]],
    ["Confusion", ["15-ft.-radius", "01-10", "11-20", "21-50", "51-70", "71-100", "next turn"]],
    ["Contagion", ["without incubation", "normal DC", "Later saves use the disease DC", "slimy doom 14"]],
    ["Create Food and Water", ["three humans or one horse per caster level", "24 hours", "water remains clean"]],
    ["Crushing Despair", ["30-ft. cone", "weapon damage, not all damage", "Good Hope"]],
    ["Cure Serious Wounds", ["3d8 hp", "maximum +15", "damages undead", "Will half"]],
    ["Daylight", ["60 ft.", "another 60 ft.", "not sunlight", "vampires"]],
    ["Deep Slumber", ["10 total HD", "lowest HD first", "standard action wakes", "ordinary noise does not"]],
    ["Deeper Darkness", ["60-ft. radius", "20% concealment", "Daylight restores prevailing"]],
    ["Diminish Plants", ["one-third size", "half a mile", "by one-third", "plant creatures"]],
    ["Discern Lies", ["one in range each round", "deliberate known lies", "honest mistakes", "does not apply"]],
    ["Dispel Magic", ["maximum +10", "DC 11", "each ongoing spell", "at most one", "1d4 rounds", "Cannot undo instantaneous"]],
    ["Displacement", ["50% miss chance", "targeted normally", "True Seeing"]],
    ["Dominate Animal", ["move action", "two or more size categories larger", "ignored"]],
    ["Explosive Runes", ["6d6 force", "no save", "Reflex for half", "Failed dispelling"]],
    ["Fear", ["panicked", "shaken for 1 round", "Will save"]],
    ["Fireball", ["20-ft.-radius spread", "maximum 10d6", "Reflex half", "ranged touch"]],
    ["Flame Arrow", ["fifty", "+1d6 fire", "do not ignite struck creatures"]],
    ["Fly", ["60 ft.", "40 ft.", "good maneuverability", "running is not", "1d6 rounds", "antimagic"]],
    ["Gaseous Form", ["DR 10/magic", "perfect flight 10 ft.", "Cannot attack", "cannot enter liquid"]],
    ["Geas, Lesser", ["7 HD or fewer", "until completed", "maximum -8", "minimum score 1", "not Dispel Magic"]],
    ["Glibness", ["+30", "not feinting", "DC 15 + your caster level"]],
    ["Glyph of Warding", ["maximum 5d8", "3rd level or lower", "200 gp", "not class/HD/level"]],
    ["Good Hope", ["+2 morale", "weapon damage, not all damage", "Crushing Despair"]],
    ["Halt Undead", ["three undead", "Mindless undead get no save", "breaks the effect"]],
    ["Haste", ["one extra held-weapon attack", "during a full attack", "+1 dodge", "twice its normal speed", "no extra action"]],
    ["Heal Mount", ["10 hp per caster level", "maximum 150", "paladin special mount", "negative levels"]],
    ["Helping Hand", ["5 miles", "only if willing", "240 ft./round", "4 hours"]],
    ["Illusory Script", ["30 minutes", "50 gp", "at least 1 minute"]],
    ["Inflict Serious Wounds", ["3d8 damage", "maximum +15", "heals undead"]],
    ["Invisibility Purge", ["5 ft. per caster level", "while", "Does not dispel"]],
    ["Invisibility Sphere", ["later arrivals do not", "only its own", "recipient's attack ends the whole"]],
    ["Keen Edge", ["piercing/slashing", "fifty", "Does not stack", "cannot affect natural"]],
    ["Lightning Bolt", ["120-ft. line", "maximum 10d6", "Reflex half"]],
    ["Magic Circle against Chaos", ["Protection from Chaos", "nonlawful summoned", "nonlawful called"]],
    ["Magic Circle against Evil", ["Protection from Evil", "nongood summoned", "nongood called"]],
    ["Magic Circle against Good", ["Protection from Good", "nonevil summoned", "nonevil called"]],
    ["Magic Circle against Law", ["Protection from Law", "nonchaotic summoned", "nonchaotic called"]],
    ["Magic Fang, Greater", ["maximum +5", "all its natural weapons +1", "enhancement"]],
    ["Magic Vestment", ["maximum +5", "clothing", "+0"]],
    ["Magic Weapon, Greater", ["maximum +5", "fifty", "monk's unarmed strike"]],
    ["Major Image", ["sound, smell and thermal", "react appropriately", "+3 rounds"]],
    ["Meld into Stone", ["100 lb.", "5d6", "DC 18", "Passwall expels safely"]],
    ["Neutralize Poison", ["do not repair prior hp or ability damage", "immune to new poison", "not merely delaying"]],
    ["Nondetection", ["DC 11", "DC 15", "50 gp"]],
    ["Phantom Steed", ["AC 18", "maximum 240 ft.", "12 Air Walk", "14 flight"]],
    ["Plant Growth", ["5 ft.", "10 ft. for Large+", "by one-third", "plant creatures"]],
    ["Poison", ["1d10 Constitution", "after 1 minute", "separate Fortitude", "half your caster level", "Wisdom modifier"]],
    ["Prayer", ["+1 luck", "weapon damage", "Does not modify ability checks"]],
    ["Quench", ["maximum +15", "maximum 15d6", "1d4 hours", "artifacts are immune"]],
    ["Ray of Exhaustion", ["ranged touch", "fatigued target becomes exhausted", "successful save", "ends when"]],
    ["Remove Blindness/Deafness", ["either", "does not restore missing", "Counters and dispels"]],
    ["Remove Curse", ["minimum caster levels", "Does not cleanse", "discard"]],
    ["Remove Disease", ["parasites", "green slime", "Does not prevent later reinfection"]],
    ["Repel Vermin", ["below one-third", "Will save", "2d6"]],
    ["Scrying", ["another plane +5", "5% chance", "24 hours", "1,000-gp mirror", "100-gp holy-water"]],
    ["Sculpt Sound", ["same unchangeable alteration", "words you do not know", "prevents verbal"]],
    ["Searing Light", ["maximum 5d8", "maximum 10d6", "maximum 10d8", "maximum 5d6"]],
    ["Secret Page", ["3 sq. ft.", "twice ends", "Comprehend Languages alone cannot"]],
    ["Sepia Snake Sigil", ["25 words", "1d4 days", "500 gp", "vulnerable to outside injury"]],
    ["Shrink Item", ["nonmagical", "2 cu. ft.", "one-sixteenth in each dimension", "ends the spell"]],
    ["Sleet Storm", ["40 ft. in radius", "DC 10 Balance", "failure by 5+", "No save or spell resistance"]],
    ["Slow", ["one move or standard action", "not both or full-round", "Halve speed", "Haste"]],
    ["Speak with Dead", ["one question per two caster levels", "Different alignment", "last week", "became undead"]],
    ["Stinking Cloud", ["20-ft.-high", "save again each round", "1d4+1 rounds after leaving"]],
    ["Stone Shape", ["10 cu. ft. +1 cu. ft.", "30% failure", "No save"]],
    ["Summon Monster III", ["1d3", "2nd list", "1d4+1", "1st list", "cannot summon/conjure", "descriptor"]],
    ["Summon Nature’s Ally III", ["1d3", "2nd list", "1d4+1", "1st list", "cannot summon/conjure", "descriptor"]],
    ["Tiny Hut", ["nine other Medium", "leaving it yourself ends", "not a weapon or spell barrier", "75+ mph"]],
    ["Vampiric Touch", ["maximum 10d6", "temporary hp, not healing", "current hp +10", "1 hour"]],
    ["Water Breathing", ["Divide the total duration", "evenly", "without losing air breathing"]],
    ["Water Walk", ["per caster level", "heat still damages", "60 ft./round"]],
  ] as const)("retains %s's verified effect boundaries across variants", (name, boundaries) => {
    const variants = srdSpells.filter((spell) => spell.name === name);
    expect(variants.length).toBeGreaterThan(0);
    for (const spell of variants) {
      for (const boundary of boundaries) expect(spell.description).toContain(boundary);
    }
  });

  it("preserves Mystic inheritance and Dragonlance-only Bard healing restrictions", () => {
    const name = "Cure Serious Wounds";
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === name))
      .toMatchObject({ level: 3, school: "Conjuration (Healing)", range: "Touch" });
    expect(getClassSpells("bard").some((spell) => spell.name === name)).toBe(true);
    expect(getClassSpells("bard", "dragonlance-user-pack").some((spell) => spell.name === name)).toBe(false);
    expect(getClassSpells("druid").find((spell) => spell.name === name))
      .toMatchObject({ level: 4, school: "Conjuration (Healing)" });
  });
});

describe("Poison's caster-level-based save DC (PHB p. 262)", () => {
  it.each([
    ["druid", 5, 3, 16],
    ["druid", 9, 3, 18],
    ["druid", 10, 3, 19],
    ["cleric", 7, 4, 17],
    ["cleric", 11, 4, 19],
  ] as const)("uses half %s caster level %i plus Wisdom, not spell level %i", (id, level, spellLevel, expected) => {
    const spell = getClassSpells(id).find(({ name }) => name === "Poison");
    expect(spell?.saveDCFormula).toBe("half-caster-level-wisdom");
    expect(getSpellSaveDC(caster(id, level), id, spellLevel, spell?.school, true, spell?.saveDCFormula))
      .toBe(expected);
  });

  it("uses the casting class's caster level, not total HD or a Heighten slot, while keeping Spell Focus", () => {
    const character = caster("cleric", 9);
    character.classLevels.push({ classId: "fighter", level: 5 });
    character.featSelections = { "general-1": "spell-focus", "general-3": "greater-spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Necromancy", "general-3": "Necromancy" };
    for (const spellLevel of [4, 5]) {
      expect(getSpellSaveDC(character, "cleric", spellLevel, "Necromancy", true, "half-caster-level-wisdom"))
        .toBe(20);
    }
    expect(getSpellSaveDC(character, "cleric", 4, "Necromancy")).toBe(20);
    character.abilities.wis = 22;
    expect(getSpellSaveDC(character, "cleric", 4, "Necromancy", true, "half-caster-level-wisdom"))
      .toBe(22);
  });

  it.each([false, true])("shows the correct spell-row DC with prepared metamagic controls: %s", (metamagic) => {
    const character = caster("druid", 9);
    character.preparedSpells = ["Poison"];
    if (metamagic) character.featSelections = { "general-1": "extend-spell" };
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    const row = screen.getByRole("row", { name: /^1 Poison\b/ });
    expect(within(row).getByText(metamagic ? "Copy 1: DC 18" : "DC 18")).toBeDefined();
    expect(within(row).queryByText(/^DC 17$/)).toBeNull();
  });
});
