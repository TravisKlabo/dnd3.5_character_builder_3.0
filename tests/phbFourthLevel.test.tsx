import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SpellSheets } from "../src/components/SpellSheet";
import { getClericDomainSpellOptions } from "../src/clericDomains";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions, cloneCharacter, initialCharacter, type ClassId } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbFourthLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);

function caster(classId: ClassId = "cleric", level = 9) {
  const character = cloneCharacter(initialCharacter);
  character.race = "Human";
  character.classLevels = [{ classId, level }];
  character.abilities = { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 18 };
  character.featSelections = {};
  return character;
}

describe("PHB catalog minimum-level-4 spell definitions", () => {
  it("covers every title and variant, including four domain-only titles", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 4).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 4 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbFourthLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(68);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(87);
    expect(phbFourthLevelSpellCases.filter(({ levels }) => Object.keys(levels).length === 0)
      .map(({ name }) => name)).toEqual(["Chaos Hammer", "Holy Smite", "Order’s Wrath", "Unholy Blight"]);
  });

  it.each(phbFourthLevelSpellCases)("matches $name's printed headers (p. $page) and all class projections", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(variants.length).toBeGreaterThan(0);
    expect(Object.fromEntries(variants.flatMap(({ classes, level }) => classes.map((id) => [id, level]))))
      .toEqual(expected.levels);
    for (const spell of variants) {
      for (const field of ["school", "components", "castingTime", "range", "duration", "savingThrow"] as const) {
        expect(normalize(spell[field]), `${expected.name}: ${field}`).toBe(normalize(expected[field]));
      }
      expect(spell.description).toBe(findSpellByName(expected.name)?.description);
      expect(spell.description).not.toMatch(/googletag|quantserve|qevents|<script|Hypertext d20/i);
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
    ["Air Walk", ["Gargantuan or smaller", "45 degrees", "half normal speed", "1d6 rounds", "antimagic"]],
    ["Animal Growth", ["per two caster levels", "+8 size Strength", "+4 size Constitution", "DR 10/magic", "no control"]],
    ["Antiplant Shell", ["plant creatures and animated plants", "collapses", "10-ft.-radius"]],
    ["Arcane Eye", ["30 ft./round", "10 ft./round", "1-inch", "concentration", "inert"]],
    ["Black Tentacles", ["caster level +8", "1d6+4 bludgeoning", "immune to damage", "No save or spell resistance"]],
    ["Blight", ["maximum 15d6", "ordinary plant", "surrounding plants and soil are unaffected"]],
    ["Break Enchantment", ["maximum +15", "DC 11", "DC 25", "5 or lower", "without cleansing"]],
    ["Chaos Hammer", ["maximum 5d8", "lawful outsiders", "maximum 10d6", "1d6 rounds", "quarter"]],
    ["Commune with Nature", ["up to three facts", "1 mile", "100 ft.", "constructed or settled"]],
    ["Control Water", ["2 ft. per caster level", "minimum depth 1 inch", "halve one horizontal", "Slow, Will negates"]],
    ["Cure Critical Wounds", ["4d8 hp", "maximum +20", "damages undead", "Will half"]],
    ["Death Ward", ["energy drain and negative energy", "Does not remove existing negative levels", "poison or petrification"]],
    ["Detect Scrying", ["40-ft.-radius", "opposed caster-level", "ties favoring you", "direction and distance"]],
    ["Dimension Door", ["one willing", "per three caster levels", "cannot take any more actions", "next turn", "1,000 ft."]],
    ["Dimensional Anchor", ["ranged touch", "already astral/ethereal", "summoned creatures returning", "No save"]],
    ["Dismissal", ["base spell DC + your caster level - target HD", "20%", "wrong plane"]],
    ["Dispel Chaos", ["+4 deflection", "chaotic extraplanar", "one enchantment", "either discharge ends"]],
    ["Dispel Evil", ["+4 deflection", "evil extraplanar", "one enchantment", "either discharge ends"]],
    ["Divination", ["one week", "70%", "maximum 90%", "reuse the original roll", "25 gp"]],
    ["Divine Power", ["character level", "maximum +20", "+6 enhancement", "1 temporary hp per caster level", "not healing"]],
    ["Dominate Person", ["one humanoid", "move action", "same plane", "save at +2", "suppresses control"]],
    ["Enervation", ["1d4 negative levels", "maximum 15", "cannot become permanent", "Undead instead", "x5 temporary hp"]],
    ["Enlarge Person, Mass", ["one humanoid per caster level", "30 ft.", "+2 size Strength", "not speed", "do not stack"]],
    ["Fire Shield", ["halves cold", "halves fire", "prevents all damage", "maximum +15", "reach weapons"]],
    ["Flame Strike", ["maximum 15d6", "Half is fire", "unaffected by fire resistance", "Reflex half"]],
    ["Freedom of Movement", ["resist a grapple", "escape a grapple/pin", "not water breathing", "thrown-weapon"]],
    ["Giant Vermin", ["three normal centipedes", "two spiders", "one scorpion", "18-19 Gargantuan", "20+ Colossal"]],
    ["Globe of Invulnerability, Lesser", ["immobile", "including cantrips", "already active", "area dispel cannot"]],
    ["Hallucinatory Terrain", ["30-ft. cube", "Structures, equipment and creatures", "neither hidden nor changed"]],
    ["Hold Monster", ["one living creature of any type", "full-round action", "save again", "fall or drown"]],
    ["Holy Smite", ["maximum 5d8", "evil outsiders", "maximum 10d6", "1 round", "quarter"]],
    ["Holy Sword", ["+5 holy", "+2d6", "Supersedes existing", "rather than stacking", "1 round after"]],
    ["Ice Storm", ["3d6 bludgeoning", "2d6 cold", "1 round", "Listen checks take -4"]],
    ["Illusory Wall", ["1 ft. by 10 ft. by 10 ft.", "pass through", "without removing it", "nonsight"]],
    ["Imbue with Spell Ability", ["Intelligence 5+", "Wisdom 9+", "5+, also one 2nd-level", "slot remains unavailable"]],
    ["Inflict Critical Wounds", ["4d8 damage", "maximum +20", "Will half", "heals undead"]],
    ["Invisibility, Greater", ["attacking does not end it", "Does not silence", "dropped items become visible"]],
    ["Legend Lore", ["1d4 x10 minutes", "1d10 days", "2d6 weeks", "250 gp", "50 gp each"]],
    ["Locate Creature", ["long range", "within 30 ft.", "broad creature type", "Running water blocks"]],
    ["Mark of Justice", ["willing or restrained", "Bestow Curse", "Cannot be dispelled", "at least equal"]],
    ["Minor Creation", ["nonliving plant matter", "1 cu. ft.", "skill check", "material component", "fail"]],
    ["Mnemonic Enhancer", ["three extra spell levels", "half a level", "1 round before", "24 hours", "50 gp"]],
    ["Modify Memory", ["5 minutes", "same amount of time", "leaving range", "Does not cancel", "contrary to nature"]],
    ["Order’s Wrath", ["30-ft. cube", "maximum 5d8", "chaotic outsiders", "maximum 10d6", "dazes for 1 round"]],
    ["Phantasmal Killer", ["first saves Will", "then requires Fortitude", "still deals 3d6", "reflect"]],
    ["Planar Ally, Lesser", ["up to 6 HD", "100 XP", "100/500/1,000 gp per HD", "1 round bargaining", "descriptor"]],
    ["Polymorph", ["lowest of caster level, subject HD and 15", "extraordinary special attacks", "not extraordinary special qualities", "not ability damage", "incompatible gear melds"]],
    ["Rainbow Pattern", ["24 total HD", "lowest HD first", "30 ft./round", "danger grants a new save", "sightless"]],
    ["Reduce Person, Mass", ["one humanoid per caster level", "30 ft.", "+2 size Dexterity", "not speed", "do not stack"]],
    ["Reincarnate", ["one week", "1 hour", "2 Constitution", "death effects", "1,000 gp"]],
    ["Resilient Sphere", ["immovable", "1 ft. in diameter", "breathes normally", "targeted Dispel Magic"]],
    ["Restoration", ["negative levels", "all temporary ability damage", "one chosen ability", "one day per caster level", "100 gp"]],
    ["Rusting Grasp", ["nonmagical ferrous", "magical metal items are immune", "1d6 points", "maximum +15", "one melee touch per round"]],
    ["Secure Shelter", ["20-ft.-square", "No magical heating/cooling", "Alarm", "if its focus", "Eight bunks"]],
    ["Sending", ["25 words", "familiar creature", "Intelligence 1", "5% failure", "No save or spell resistance"]],
    ["Shadow Conjuration", ["only Sorcerer/Wizard", "(summoning) or (creation)", "20%", "one-fifth normal hp", "spell resistance always"]],
    ["Shout", ["5d6 sonic", "2d6 rounds", "maximum 15d6", "Cannot penetrate Silence"]],
    ["Solid Fog", ["Speed is 5 ft.", "melee damage take -2", "No 5-ft. steps", "31+ mph", "1d6"]],
    ["Spell Immunity", ["unbeatable spell resistance", "ignore spell resistance", "Only one", "whole schools"]],
    ["Spike Stones", ["1d8 piercing damage per 5 ft.", "24 hours", "10 minutes", "DC 29", "cannot be disabled"]],
    ["Stoneskin", ["DR 10/adamantine", "maximum 150", "250 gp"]],
    ["Summon Monster IV", ["1d3", "3rd list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Summon Nature’s Ally IV", ["1d3", "3rd list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Tree Stride", ["living trees", "same kind", "full-round action", "3,000 ft.", "500 ft.", "exiting a tree"]],
    ["Unholy Blight", ["maximum 5d8", "good outsiders", "maximum 10d6", "1d4 rounds", "not Heal or Remove Disease"]],
    ["Wall of Fire", ["one chosen side", "maximum +20", "Double all damage to undead", "20 cold damage"]],
    ["Wall of Ice", ["3 hp per inch", "15 + caster level", "adjacent creature", "hemisphere breach does not"]],
    ["Zone of Silence", ["5-ft.-radius", "sonic/language-dependent", "lip-reading", "verbal casting inside"]],
  ] as const)("retains %s's verified effect boundaries across variants", (name, boundaries) => {
    const variants = srdSpells.filter((spell) => spell.name === name);
    expect(variants.length).toBeGreaterThan(0);
    for (const spell of variants) {
      for (const boundary of boundaries) expect(spell.description).toContain(boundary);
    }
  });

  it.each([
    ["chaos", "Chaotic Neutral", "Chaos Hammer"],
    ["good", "Neutral Good", "Holy Smite"],
    ["law", "Lawful Neutral", "Order's Wrath"],
    ["evil", "Neutral Evil", "Unholy Blight"],
  ] as const)("preserves %s domain access without ordinary class-list access", (domain, alignment, name) => {
    const character = caster();
    character.deity = "";
    character.alignment = alignment;
    character.clericDomains = [domain, "magic"];
    expect(getClericDomainSpellOptions(character, 4)).toContainEqual({ domain, spell: name, note: undefined });
    const spell = findSpellByName(name);
    expect(spell).toMatchObject({ level: 4, classes: [], components: "V, S" });
    for (const { id } of Object.values(classDefinitions)) {
      expect(getClassSpells(id).some((entry) => entry.name === spell?.name)).toBe(false);
    }
    expect(getClassSpells("mystic", "dragonlance-user-pack").some((entry) => entry.name === spell?.name)).toBe(false);
  });

  it("preserves Mystic inheritance and setting-specific Bard healing restrictions", () => {
    const name = "Cure Critical Wounds";
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === name))
      .toMatchObject({ level: 4, school: "Conjuration (Healing)", range: "Touch" });
    expect(getClassSpells("bard").some((spell) => spell.name === name)).toBe(true);
    expect(getClassSpells("bard", "dragonlance-user-pack").some((spell) => spell.name === name)).toBe(false);
    expect(getClassSpells("druid").find((spell) => spell.name === name))
      .toMatchObject({ level: 5, school: "Conjuration (Healing)" });
  });
});

describe("Dismissal's target-dependent save DC (PHB p. 222)", () => {
  it("marks every class variant for explicit adjustment without changing ordinary spell DCs", () => {
    const variants = srdSpells.filter(({ name }) => name === "Dismissal");
    expect(variants).toHaveLength(2);
    expect(variants.every(({ saveDCAdjustment }) => saveDCAdjustment === "caster-level-minus-target-hd")).toBe(true);
    expect(srdSpells.filter(({ saveDCAdjustment }) => saveDCAdjustment).every(({ name }) => name === "Dismissal")).toBe(true);
  });

  it.each([false, true])("labels the DC as a base and displays the formula with metamagic controls: %s", (metamagic) => {
    const character = caster();
    character.preparedSpells = ["Dismissal", "Hold Person"];
    if (metamagic) character.featSelections = { "general-1": "heighten-spell" };
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    const row = screen.getByRole("row", { name: /^1 Dismissal\b/ });
    expect(within(row).getByText(metamagic ? "Copy 1: Base DC 18" : "Base DC 18")).toBeDefined();
    expect(within(row).getByText("Final DC = base DC + caster level - target HD")).toBeDefined();
    const ordinary = screen.getByRole("row", { name: /^1 Hold Person\b/ });
    expect(within(ordinary).getByText(metamagic ? "Copy 1: DC 16" : "DC 16")).toBeDefined();
    expect(within(ordinary).queryByText(/Final DC =/)).toBeNull();
  });
});
