import { beforeAll, describe, expect, it } from "vitest";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbFifthLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);
const phbSpells = srdSpells.filter(({ sourceBook }) => !sourceBook);

describe("PHB catalog minimum-level-5 spell definitions", () => {
  it("covers the complete group and every higher-level variant exactly once", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 5).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 5 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbFifthLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(64);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(74);
    expect(phbFifthLevelSpellCases.every(({ levels }) => Object.keys(levels).length > 0)).toBe(true);
    expect(phbSpells).toHaveLength(715);
    expect(new Set(phbSpells.map(({ name }) => name)).size).toBe(605);
  });

  it.each(phbFifthLevelSpellCases)("matches $name's supplied PHB headers (p. $page) and all class projections", (expected) => {
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
    ["Atonement", ["truly repentant", "same deity", "500 XP", "cannot compel", "prayer device worth 500 gp"]],
    ["Awaken", ["caster must pass a Will save", "DC 10", "+2 HD", "cannot remain an animal companion", "250 XP"]],
    ["Baleful Polymorph", ["at most 1 HD", "+4 if the form would be fatal", "retain own hp", "lose class features", "all carried gear drops", "After 24 consecutive hours", "ooze and plant", "unconsciousness ends it"]],
    ["Call Lightning Storm", ["5d6 electricity", "5d10", "maximum 15 bolts", "standard action", "not underwater"]],
    ["Cloudkill", ["3 HD or fewer without a save", "4-6 HD", "overlapping at 6 HD", "ask the DM", "Constitution damage", "Poison immunity", "No spell resistance"]],
    ["Command, Greater", ["same Command", "one living creature per caster level", "30 ft.", "after its first", "saves Will again"]],
    ["Commune", ["one yes/no question per caster level", "within the entity's knowledge", "five words", "Discussing", "100 XP"]],
    ["Cone of Cold", ["60-ft. cone", "maximum 15d6", "Reflex half"]],
    ["Contact Other Plane", ["one question per two caster levels", "Intelligence check, not a save", "falling to 8", "DC 7/8/9", "DC 10/12/14/16", "no answer"]],
    ["Control Winds", ["40 ft. high", "80 ft.", "one category per three caster levels", "concentration", "each round", "No spell resistance"]],
    ["Cure Light Wounds, Mass", ["one creature per caster level", "30 ft.", "maximum +25", "damages undead", "Will half"]],
    ["Dispel Good", ["+4 deflection", "good extraplanar", "one enchantment", "either discharge ends"]],
    ["Dispel Law", ["+4 deflection", "lawful extraplanar", "one enchantment", "either discharge ends"]],
    ["Dispel Magic, Greater", ["maximum +20", "DC 11", "Remove Curse", "at most one", "1d4 rounds", "counterspell, not automatically"]],
    ["Disrupting Weapon", ["HD are no greater than your caster level", "fails Will", "resistance does not protect against destruction"]],
    ["Dream", ["one-way", "any length", "Cannot learn", "automatically failing saves", "do not sleep or dream"]],
    ["Fabricate", ["10 cu. ft.", "1 cu. ft.", "Cannot create or transmute creatures or magic items", "Craft check", "1 round"]],
    ["False Vision", ["40-ft.-radius", "stays static", "ordinary sight", "250 gp", "No save or spell resistance"]],
    ["Feeblemind", ["Intelligence and Charisma to 1", "Arcane spellcasters take -4", "Heal, Limited Wish", "Still recognizes"]],
    ["Hallow", ["40-ft.-radius", "interred corpses", "+4 sacred", "Druid version lacks", "one year", "does not dispel", "1,000 gp"]],
    ["Heroism, Greater", ["+4 morale", "immunity to fear", "temporary hp", "maximum 20", "not healing"]],
    ["Inflict Light Wounds, Mass", ["maximum +25", "one creature per caster level", "30 ft.", "heals undead", "convert to Mass Inflict"]],
    ["Insect Plague", ["per three caster levels", "maximum six", "contiguous area", "never pursue", "No save or spell resistance"]],
    ["Interposing Hand", ["+4 cover AC", "2,000 lb.", "AC 20", "full undamaged hp", "move action"]],
    ["Mage’s Faithful Hound", ["Small-or-larger", "30 ft.", "+10", "2d6+3", "intruder's turn", "over 100 ft."]],
    ["Mage’s Private Sanctum", ["30-ft. cube", "outgoing sound", "Those inside see out", "Does not prevent physical passage", "Sending or Message"]],
    ["Magic Jar", ["100 gp", "10 ft. per caster level", "line of effect", "full-round", "Retain mental", "not its spells", "standard action", "kill stranded souls"]],
    ["Major Creation", ["1 cu. ft.", "not cold iron", "plants 2 hours/level", "precious metals 20 minutes/level", "gems 10 minutes/level", "1 round/level"]],
    ["Mind Fog", ["-10 competence", "Wisdom checks and Will saves, not Wisdom scores", "2d6 rounds", "30 minutes", "21+ mph"]],
    ["Mirage Arcana", ["20-ft. cube", "tactile", "including changing or adding structures", "Cannot disguise, hide or add creatures"]],
    ["Mislead", ["Greater Invisibility", "independent of concentration", "cannot actually attack or cast", "3 rounds", "no spell resistance"]],
    ["Nightmare", ["1d10 damage", "24 hours", "unknown +10", "body part -10", "Dispel Evil", "10 minutes"]],
    ["Overland Flight", ["40 ft.", "30 ft.", "average maneuverability", "not run", "forced marches", "1d6 rounds", "antimagic"]],
    ["Passwall", ["5-ft.-by-8-ft.", "not metal", "maximum 25 ft.", "nearest exit", "far exit"]],
    ["Permanency", ["minimum caster level", "500-4,500 XP", "higher-level caster", "two per Permanency", "DM-approved research"]],
    ["Persistent Image", ["four 10-ft. cubes", "predetermined script", "without concentration", "intelligible speech"]],
    ["Planar Binding, Lesser", ["exactly one elemental or outsider", "up to 6 HD", "inward-facing", "resistance does not prevent arrival", "natural 1", "one day per caster level"]],
    ["Plane Shift", ["up to eight", "5-500 miles", "return trip", "forked metal rod", "Unwilling targets save Will"]],
    ["Prying Eyes", ["1d4 + caster level", "1 hp, AC 18", "maximum +15", "25 words", "no live feed", "Beyond 1 mile"]],
    ["Raise Dead", ["one day per caster level", "5,000 gp", "2 Constitution", "hp equal to current HD", "50%", "missing body parts", "death effects"]],
    ["Righteous Might", ["+4 size Strength", "+2 size Constitution", "+2 enhancement", "DR 3/evil", "6 at caster level 12", "9 at 15", "do not stack"]],
    ["Secret Chest", ["1 cu. ft.", "5,000 gp chest", "50 gp replica", "75%", "60 days", "5% per day", "even with Wish"]],
    ["Seeming", ["per two caster levels", "30 ft.", "same body type", "no sound, touch or abilities", "+10 Disguise", "Death restores"]],
    ["Shadow Evocation", ["4th level or lower", "damage to 20%", "nondamaging effects instead have no effect", "Ordinary saves still apply", "Objects automatically"]],
    ["Shadow Walk", ["shadowy illumination", "one touched creature per caster level", "50 miles/hour", "1d10 x100", "1d4 hours"]],
    ["Slay Living", ["melee touch", "Fortitude", "3d6 damage + caster level", "no stated cap"]],
    ["Song of Discord", ["20-ft.-radius", "50%", "start of each turn", "nearest target", "otherwise acts normally", "unconscious"]],
    ["Spell Resistance", ["12 + your caster level", "not character level", "harmless"]],
    ["Suggestion, Mass", ["one living creature per caster level", "30 ft.", "Obviously harmful", "completing the activity ends it", "before expiration"]],
    ["Summon Monster V", ["one 5th-list", "1d3", "4th list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Summon Nature’s Ally V", ["one 5th-list", "1d3", "4th list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "descriptor"]],
    ["Symbol of Pain", ["-4 on attacks, skill checks and ability checks, not saves", "Fortitude negates", "No hp limit", "1 hour after leaving", "1,000 gp", "DC 30"]],
    ["Symbol of Sleep", ["10 HD or fewer", "3d6 x10 minutes", "nonmagical waking fails", "No hp limit", "1,000 gp", "DC 30"]],
    ["Telekinesis", ["25 lb./caster level", "maximum 375 lb.", "20 ft./round", "maximum 15", "no provoking", "no Strength damage bonus", "Hurled creatures/attended items save Will"]],
    ["Telepathic Bond", ["one willing creature per three caster levels", "Intelligence 3+", "30 ft.", "not across planes", "only two creatures"]],
    ["Teleport", ["100 miles per caster level", "same plane", "per three caster levels", "1d20+80", "1d10 x1d10%", "1d10 damage"]],
    ["Transmute Mud to Rock", ["two 10-ft. cubes per caster level", "Reflex to escape", "Counters and dispels", "no spell resistance"]],
    ["Transmute Rock to Mud", ["natural unworked nonmagical", "at most 10 ft. deep", "5 ft.", "-2 attacks/AC", "8d6 bludgeoning", "Cannot affect worked stone"]],
    ["True Seeing", ["120 ft.", "Ethereal Plane", "fog/concealment", "mundane disguises", "Cannot be extended through scrying", "250 gp"]],
    ["Unhallow", ["40-ft.-radius", "+4 profane", "Druid version lacks", "one year", "does not prevent creating undead", "does not dispel", "1,000 gp"]],
    ["Wall of Force", ["flat vertical", "10-ft. square", "Immune to damage and Dispel Magic", "gaze attacks pass through", "teleportation bypasses"]],
    ["Wall of Stone", ["5-ft. square", "1 inch thick per four caster levels", "existing stone", "hardness 8", "15 hp per inch", "Reflex"]],
    ["Wall of Thorns", ["25 minus AC excluding Dexterity/dodge", "minimum 0", "5 points above 20", "remaining still", "Not a living plant"]],
    ["Waves of Fatigue", ["30-ft. cone", "without a save", "Already fatigued creatures are unaffected, not exhausted", "rest"]],
  ] as const)("retains %s's verified effect limits in every variant", (name, limits) => {
    const variants = srdSpells.filter((spell) => spell.name === name);
    expect(variants.length).toBeGreaterThan(0);
    for (const spell of variants) {
      for (const limit of limits) expect(spell.description.toLowerCase()).toContain(limit.toLowerCase());
    }
  });

  it("preserves Mystic inheritance and Dragonlance-only Bard healing restrictions", () => {
    const name = "Cure Light Wounds, Mass";
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === name))
      .toMatchObject({ level: 5, school: "Conjuration (Healing)", range: "Close (25 ft. + 5 ft./2 levels)" });
    expect(getClassSpells("bard").some((spell) => spell.name === name)).toBe(true);
    expect(getClassSpells("bard", "dragonlance-user-pack").some((spell) => spell.name === name)).toBe(false);
    expect(getClassSpells("druid").find((spell) => spell.name === name))
      .toMatchObject({ level: 6, school: "Conjuration (Healing)" });
  });
});
