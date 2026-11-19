import { beforeAll, describe, expect, it } from "vitest";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbSixthLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);
const phbSpells = srdSpells.filter(({ sourceBook }) => !sourceBook);

describe("PHB catalog minimum-level-6 spell definitions", () => {
  it("covers the complete group and every higher-level variant exactly once", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 6).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 6 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbSixthLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(64);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(76);
    expect(phbSixthLevelSpellCases.every(({ levels }) => Object.keys(levels).length > 0)).toBe(true);
    expect(phbSpells).toHaveLength(715);
    expect(new Set(phbSpells.map(({ name }) => name)).size).toBe(605);
  });

  it.each(phbSixthLevelSpellCases)("matches $name's supplied PHB headers (p. $page) and all class projections", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(variants.length).toBeGreaterThan(0);
    expect(Object.fromEntries(variants.flatMap(({ classes, level }) => classes.map((id) => [id, level]))))
      .toEqual(expected.levels);
    for (const spell of variants) {
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

  it.each([
    ["Acid Fog", ["2d6 acid", "starting immediately", "movement is 5 ft.", "no 5-foot steps", "31+ mph", "No save or spell resistance"]],
    ["Analyze Dweomer", ["free action", "one per caster level", "remaining charges", "24 hours", "artifacts", "1,500 gp"]],
    ["Animate Objects", ["nonmagical", "Small-or-smaller", "Colossal 32", "Cannot animate worn or carried", "move action"]],
    ["Antilife Shell", ["10-ft.-radius hemisphere", "Does not exclude constructs, elementals, outsiders or undead", "collapses", "resistance applies"]],
    ["Antimagic Field", ["suppresses, not dispels", "durations keep running", "incorporeal undead", "Instantaneous conjuration", "Dispel Magic cannot"]],
    ["Banishment", ["2 HD per caster level", "30 ft.", "+1", "+2 save DC", "rare items", "focus is optional", "manual"]],
    ["Bear’s Endurance, Mass", ["+4 enhancement Constitution", "one creature per caster level", "30 ft.", "not temporary hp"]],
    ["Blade Barrier", ["20 ft. long per caster level", "maximum 15d6", "initially caught", "negate damage", "+4 AC, +2 Reflex"]],
    ["Bull’s Strength, Mass", ["+4 enhancement Strength", "one creature per caster level", "30 ft.", "harmless"]],
    ["Cat’s Grace, Mass", ["+4 enhancement Dexterity", "one creature per caster level", "30 ft.", "Reflex"]],
    ["Chain Lightning", ["maximum 20d6", "maximum 20", "30 ft. of the primary", "rounded down", "same DC", "no target can be struck twice"]],
    ["Charm Monster, Mass", ["living creatures", "twice your caster level", "at least one regardless of HD", "Not control", "+5"]],
    ["Circle of Death", ["maximum 20d4", "9+ HD are immune", "lowest HD first", "leftover HD", "500 gp"]],
    ["Contingency", ["one-third caster level", "maximum 6th", "at least 10 minutes", "Only one", "must carry", "1,500 gp"]],
    ["Create Undead", ["At night", "one corpse", "12-14", "15-17", "18+", "Not automatically controlled", "50 gp per created HD"]],
    ["Cure Moderate Wounds, Mass", ["2d8", "maximum +30", "one creature per caster level", "30 ft.", "damages undead", "Will"]],
    ["Disintegrate", ["ranged touch", "first creature or object", "maximum 40d6", "5d6", "leaves its gear", "10-ft. cube", "force objects"]],
    ["Eagle’s Splendor, Mass", ["+4 enhancement Charisma", "one creature per caster level", "30 ft.", "no bonus spells"]],
    ["Eyebite", ["move action", "10+ HD", "5-9 HD", "4 or fewer HD", "not sleep", "Remove Curse, not Heal"]],
    ["Find the Path", ["shortest physical route", "same plane", "not to an object or creature", "does not predict", "Maze in 1 round"]],
    ["Fire Seeds", ["four acorns or eight", "maximum 20d6", "Direct hits allow no save", "1d8 + caster level", "within 200 ft.", "5 ft."]],
    ["Flesh to Stone", ["made of flesh", "carried gear", "not dead", "damage to the statue persists", "Fortitude"]],
    ["Forbiddance", ["60-ft. cube", "one alignment axis", "6d6", "12d6", "already inside", "password bypasses damage, not travel", "1,500 gp plus", "1,000 gp plus"]],
    ["Forceful Hand", ["+4 cover AC", "+14 Strength", "without a speed limit", "AC 20", "undamaged hp", "move action"]],
    ["Fox’s Cunning, Mass", ["+4 enhancement Intelligence", "one creature per caster level", "30 ft.", "no bonus spells or extra skill points"]],
    ["Freezing Sphere", ["10-ft.-radius", "maximum 15d6", "maximum 15d8", "6 inches", "1,500", "full-round DC 25", "no save"]],
    ["Geas/Quest", ["any HD", "understands you", "no initial save", "certain death", "open-ended", "3d6", "24 hours", "two above"]],
    ["Globe of Invulnerability", ["Immobile", "4th level or lower", "already present", "cast through or out", "Targeted Dispel", "class spell level"]],
    ["Glyph of Warding, Greater", ["5 sq. ft.", "maximum 10d8", "6th level or lower", "own spell level sets the save DC", "DC 31", "400 gp"]],
    ["Guards and Wards", ["200 sq. ft.", "20 ft. high", "regrowing in 10 minutes", "50%", "two recurring Stinking Clouds", "individual effects"]],
    ["Harm", ["maximum 150", "Will half", "below 1 hp", "Heal on undead", "manually"]],
    ["Heal", ["maximum 150", "ability damage", "insanity", "Does not remove negative levels", "not a blanket cure", "Harm against undead"]],
    ["Heroes’ Feast", ["one creature per caster level", "uninterrupted hour", "12 hours", "maximum +10", "+1 morale", "temporary hp"]],
    ["Inflict Moderate Wounds, Mass", ["maximum +30", "one creature per caster level", "30 ft.", "Heals undead", "spontaneously"]],
    ["Ironwood", ["5 lb.", "does not burn", "metal-affecting magic does not", "Druid-usable", "half the normal weight", "+1 enhancement"]],
    ["Irresistible Dance", ["Living", "1d4+1", "cannot take other actions", "-4 AC", "-10 Reflex", "on its turn", "No saving throw"]],
    ["Liveoak", ["healthy Huge oak", "one word per caster level", "10 ft.", "300 ft.", "Only one Liveoak", "roots it immediately"]],
    ["Mage’s Lucubration", ["Wizard-only", "5th level or lower", "actually cast", "24 hours", "material components", "uncast"]],
    ["Move Earth", ["not rock", "750-ft. square", "10 ft. deep", "4 hours 10 minutes", "Cannot tunnel", "too slow"]],
    ["Owl’s Wisdom, Mass", ["+4 enhancement Wisdom", "one creature per caster level", "30 ft.", "no bonus spells"]],
    ["Permanent Image", ["thermal", "20-ft. cube", "Concentration", "static", "100 gp", "no spell resistance"]],
    ["Planar Ally", ["12 HD", "two of the same kind", "30 ft.", "before service", "100 gp", "500 gp", "1,000 gp", "250 XP"]],
    ["Planar Binding", ["elemental or outsider", "three of the same kind", "12 HD", "inward-facing", "independently", "natural 1", "one day per caster level"]],
    ["Programmed Image", ["intelligible speech", "20-ft. cube", "Waits permanently", "1 round per caster level", "not an unseen quality", "25 gp"]],
    ["Project Image", ["move action", "free action", "blinded/deafened", "touch-or-longer", "only illusions", "break in line of effect", "5 gp"]],
    ["Repel Wood", ["Fixed 60-ft. line", "40 ft. per round", "dragging carriers", "over 3 inches", "does not follow you", "no save or spell resistance"]],
    ["Repulsion", ["10-ft. radius per caster level", "Will", "Does not force them back", "melee within reach", "ranged attacks", "50 gp"]],
    ["Scrying, Greater", ["1 standard action", "1 hour per caster level", "only V/S", "150 ft.", "another plane grants +5", "24 hours", "Read Magic and Tongues"]],
    ["Shout, Greater", ["60-ft. cone", "10d6 sonic", "maximum 20d6", "stuns 1 round", "4d6 rounds", "Reflex", "Cannot penetrate Silence"]],
    ["Spellstaff", ["material components when stored", "one stored spell per staff", "one Spellstaff per caster", "normal allotment", "discharged"]],
    ["Stone Tell", ["natural or worked stone", "concealed behind or beneath", "limited perspective", "DM determines"]],
    ["Stone to Flesh", ["any-size petrified", "fixed DC 15 Fortitude", "separate", "1-3 ft.", "10 ft. long", "stone golem"]],
    ["Summon Monster VI", ["one 6th-list", "1d3", "5th list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Summon Nature’s Ally VI", ["one 6th-list", "1d3", "5th list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Symbol of Fear", ["60-ft.-radius", "panicked for 1 round", "150-hp", "does not explicitly remove", "Covering suppresses", "reentering", "1,000 gp", "DC 31"]],
    ["Symbol of Persuasion", ["60-ft.-radius", "1 hour per caster level", "No hp limit", "active 10 minutes", "Not domination", "5,000 gp", "DC 31"]],
    ["Sympathetic Vibration", ["freestanding", "2d10 damage per round", "ignoring hardness", "Cannot affect creatures", "no save", "tuning fork"]],
    ["Transformation", ["+4 enhancement", "+4 natural armor", "+5 competence", "character level", "maximum +20", "Lose spellcasting", "potion"]],
    ["Transport via Plants", ["living normal plants", "Medium or larger", "not plant creatures", "specified dead destination fails", "per three caster levels", "kills all travelers"]],
    ["Undeath to Death", ["maximum 20d4", "9+ HD are immune", "lowest HD first", "Will negates, not Fortitude", "500 gp"]],
    ["Veil", ["appearance, feel and smell", "30 ft.", "+10", "slain subjects revert", "Observers", "cannot use spell resistance", "Does not grant"]],
    ["Wall of Iron", ["5-ft. square", "1 inch thick per four", "hardness 10", "30 hp per inch", "DC 40 Strength", "10d6", "Huge+", "50 gp"]],
    ["Wind Walk", ["per three caster levels", "DR 10/magic", "10 ft. (perfect)", "600 ft./round", "5 rounds each", "dismiss individually", "60 ft./round"]],
    ["Word of Recall", ["when preparing", "10-ft.-by-10-ft.", "same plane", "per three caster levels", "exceeding limits fails", "Unwilling creatures cannot"]],
  ] as const)("retains %s's verified effect limits in every variant", (name, limits) => {
    const variants = srdSpells.filter((spell) => spell.name === name);
    expect(variants.length).toBeGreaterThan(0);
    for (const spell of variants) {
      for (const limit of limits) expect(spell.description.toLowerCase()).toContain(limit.toLowerCase());
    }
  });

  it("preserves Mystic inheritance and Dragonlance-only Bard healing restrictions", () => {
    const name = "Cure Moderate Wounds, Mass";
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === name))
      .toMatchObject({ level: 6, school: "Conjuration (Healing)", range: "Close (25 ft. + 5 ft./2 levels)" });
    expect(getClassSpells("bard").some((spell) => spell.name === name)).toBe(true);
    expect(getClassSpells("bard", "dragonlance-user-pack").some((spell) => spell.name === name)).toBe(false);
    expect(getClassSpells("druid").find((spell) => spell.name === name))
      .toMatchObject({ level: 7, school: "Conjuration (Healing)" });
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === "Heal"))
      .toMatchObject({ level: 6, school: "Conjuration (Healing)" });
  });
});
