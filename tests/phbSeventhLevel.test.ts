import { beforeAll, describe, expect, it } from "vitest";
import { findSpellByName, getClassSpells, getSrdSpellSourceBook, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbSeventhLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);
const phbSpells = srdSpells.filter(({ sourceBook }) => !sourceBook);

describe("PHB catalog minimum-level-7 spell definitions", () => {
  it("covers the complete group and every higher-level variant exactly once", () => {
    const lower = new Set(srdSpells.filter(({ level }) => level < 7).map(({ name }) => name));
    const names = [...new Set(srdSpells
      .filter(({ level, name }) => level === 7 && !lower.has(name))
      .map(({ name }) => name))].sort();
    expect(names).toEqual(phbSeventhLevelSpellCases.map(({ name }) => name));
    expect(names).toHaveLength(49);
    expect(srdSpells.filter(({ name }) => names.includes(name))).toHaveLength(55);
    expect(phbSeventhLevelSpellCases.every(({ levels }) => Object.keys(levels).length > 0)).toBe(true);
    expect(phbSpells).toHaveLength(715);
    expect(new Set(phbSpells.map(({ name }) => name)).size).toBe(605);
  });

  it.each(phbSeventhLevelSpellCases)("matches $name's supplied PHB headers (p. $page) and all class projections", (expected) => {
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

  it.each([
    ["Animate Plants", ["one Large-or-smaller plant per three caster levels", "Huge counts as 2", "Gargantuan 4", "Colossal 8", "no hardness", "plant creatures", "nonliving plant material", "Entangle", "1 hour/level", "No save"]],
    ["Arcane Sight, Greater", ["automatically reveals", "visible creatures/objects", "Does not identify magic items", "cannot be made permanent"]],
    ["Blasphemy", ["40-ft.-radius", "equal HD dazed", "CL-1 weakened", "CL-5 paralyzed", "CL-10 killed", "undead are destroyed", "Strength decreases 2d6", "Will -4", "Spell resistance"]],
    ["Changestaff", ["Huge treant-like", "24 ft.", "unable to converse with treants", "0 hp", "28 days", "cannot adventure"]],
    ["Control Undead", ["2 HD per caster level", "30 ft.", "regardless of language", "do not attack you", "remember being controlled", "bone and raw meat"]],
    ["Control Weather", ["2-mile-radius", "10 minutes", "gradually", "standard action", "Contradictory conditions", "dispels atmospheric phenomena", "4d12 hours", "druid doubles duration and radius to 3 miles"]],
    ["Creeping Doom", ["one centipede swarm per two caster levels", "maximum ten", "share other creatures' spaces", "standard action", "within 100 ft.", "No save or spell resistance"]],
    ["Cure Serious Wounds, Mass", ["3d8 +1 per caster level", "maximum +35", "one creature per caster level", "30 ft.", "damages undead", "Will"]],
    ["Delayed Blast Fireball", ["maximum 20d6", "up to 5 rounds", "cannot change", "10-ft. range increment", "25% chance"]],
    ["Destruction", ["consumes its remains", "not its gear", "10d6", "True Resurrection", "carefully worded Wish", "500 gp"]],
    ["Dictum", ["40-ft.-radius", "equal HD deafened", "CL-1 slowed", "CL-5 paralyzed", "CL-10 killed", "Will -4", "whether or not they hear"]],
    ["Ethereal Jaunt", ["invisible and insubstantial", "half normal speed", "60 ft.", "cannot attack material creatures", "force effects and abjurations", "1d6 damage per 5 ft."]],
    ["Finger of Death", ["one living creature", "Fortitude success", "3d6 +1 damage", "maximum +25", "can still kill"]],
    ["Fire Storm", ["two 10-ft. cubes per caster level", "maximum 20d6", "natural vegetation", "plant creatures", "Reflex half", "resistance applies"]],
    ["Forcecage", ["20-ft. cube", "10-ft. cube", "Too-large creatures cause failure", "Teleport", "ethereal travel is blocked", "Disintegrate", "half-inch bars/gaps", "spells/breath pass through", "1,500 gp"]],
    ["Grasping Hand", ["grapple once/round", "without harming", "caster level", "Large size modifier", "+16", "move action", "leather glove"]],
    ["Hold Person, Mass", ["humanoids", "30 ft.", "each target saves Will", "full-round action", "Spell resistance"]],
    ["Holy Word", ["40 ft.", "that hear the word", "equal HD deafened", "CL-1 blinded", "CL-5 paralyzed", "CL-10 killed", "Will -4", "whether or not they hear it"]],
    ["Inflict Serious Wounds, Mass", ["3d8 +1 damage per caster level", "maximum +35", "one creature per caster level", "30 ft.", "Will half", "Heals undead"]],
    ["Insanity", ["continuous Confusion", "Will negates", "Remove Curse does not", "Greater Restoration", "Miracle"]],
    ["Instant Summons", ["10 lb.", "6 ft.", "Arcane Mark", "1,000-gp sapphire", "Only you", "reveals that creature's identity", "another plane", "claimed ownership"]],
    ["Invisibility, Mass", ["180 ft.", "cannot see one another", "Each individual becomes visible", "attacks"]],
    ["Limited Wish", ["Sorcerer/Wizard spells up to 6th", "other spells up to 5th", "7th-level save DC", "300 XP", "1,000 gp"]],
    ["Mage’s Magnificent Mansion", ["three 10-ft. cubes per caster level", "Only designated creatures", "12 people per level", "two visible", "conditions do not pass", "5 gp"]],
    ["Mage’s Sword", ["+3", "4d6+3 force", "19-20/x2", "ethereal/incorporeal", "standard action", "cannot be physically damaged", "spell resistance", "250 gp"]],
    ["Phase Door", ["through wood, plaster or stone", "10 ft. deep", "5 ft. per three levels", "Medium-or-smaller", "two charges", "Blocks light, sound and spells", "half caster level"]],
    ["Power Word Blind", ["200 current hp", "50 hp or less permanent", "51-100 hp", "101-200 hp", "Above 200 hp unaffected", "without save"]],
    ["Prismatic Spray", ["8 HD or less", "2d4 rounds", "20 fire", "40 acid", "80 electricity", "1d6 Con damage", "petrifies", "Insanity", "another plane"]],
    ["Refuge", ["same-plane teleport", "willingly given", "heavy load", "touching familiar", "within 10 ft.", "cannot choose whether to travel", "1,500 gp"]],
    ["Regenerate", ["severed body parts", "1 round", "2d10 rounds", "4d8", "maximum +35", "all nonlethal damage", "no effect on undead"]],
    ["Restoration, Greater", ["all negative levels", "one week per caster level", "highest level attained", "permanent ability drain", "Does not restore levels or Constitution lost to death", "500 XP"]],
    ["Resurrection", ["10 years per caster level", "Disintegrate dust", "full hp/health", "prepared spells", "loses one level", "2 Con", "cannot be repaired", "free and willing", "10,000 gp"]],
    ["Reverse Gravity", ["one 10-ft. cube per two caster levels", "within 1 round", "Reflex-save to grab a handhold", "fliers/levitators", "does not apply"]],
    ["Sequester", ["2-ft. cube per level", "all sight", "Touch and devices", "comatose", "attended or magical objects", "not creatures"]],
    ["Shadow Conjuration, Greater", ["6th level or lower", "summoning", "creation", "60%", "60% chance", "not other conjuration subschools"]],
    ["Simulacrum", ["half the original's levels/HD", "twice your caster level", "Disguise", "or ever gain power", "24 hours", "100 gp per hp", "100 XP per HD", "minimum 1,000 XP", "100 gp per HD"]],
    ["Spell Turning", ["targeted spells", "not area/effect or touch spells", "1d4+6", "Partial remainder", "random resonating field", "planar rift"]],
    ["Statue", ["hardness 8", "retaining its hp", "see/hear/smell", "need not eat or breathe", "free action", "Will negates"]],
    ["Summon Monster VII", ["7th-level list", "1d3", "6th-level list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "or teleport/planar travel"]],
    ["Summon Nature’s Ally VII", ["7th-level list", "1d3", "6th-level list", "1d4+1", "any lower list", "30 ft.", "cannot summon/conjure", "or teleport/planar travel"]],
    ["Sunbeam", ["standard action each round", "one per three caster levels", "maximum six", "4d6", "double if sunlight harms", "1d6 per caster level", "maximum 20d6", "destroyed on failed save", "fungi, mold, oozes and slimes"]],
    ["Symbol of Stunning", ["60 ft.", "1d6 rounds", "Will negates", "150-hp activation budget", "not explicitly remove", "10-minutes/level", "5,000 gp", "DC 32"]],
    ["Symbol of Weakness", ["60 ft.", "3d6 Strength damage", "Fortitude negates", "no hp limit", "10 minutes/level", "5,000 gp", "DC 32"]],
    ["Teleport Object", ["50 lb.", "3 cu. ft.", "not creatures or magical forces", "Will negates", "spell resistance applies", "Ethereal Plane", "targeted Dispel Magic"]],
    ["Teleport, Greater", ["no distance limit", "off-target chance", "reliable description", "return you to the origin", "Cannot travel between planes"]],
    ["Transmute Metal to Wood", ["40-ft.-radius", "SR 20 + caster level", "artifacts are immune", "-2 attack/damage", "break on natural 1-2", "loses 2 armor bonus", "natural 19-20", "permanent"]],
    ["Vision", ["caster-level check", "maximum +25", "DC 20", "25 for detailed information", "30 for rumors", "incomplete answer", "vague answer", "100 XP"]],
    ["Waves of Exhaustion", ["living creatures", "no save", "Already exhausted", "Spell resistance"]],
    ["Word of Chaos", ["40 ft.", "that hear the word", "equal HD deafened", "CL-1 stunned", "CL-5 confused", "CL-10 killed", "1d10 minutes", "Will -4", "whether or not they hear"]],
  ] as const)("retains %s's verified effect limits in every variant", (name, limits) => {
    const variants = srdSpells.filter((spell) => spell.name === name);
    expect(variants.length).toBeGreaterThan(0);
    for (const spell of variants) {
      for (const limit of limits) expect(spell.description.toLowerCase()).toContain(limit.toLowerCase());
    }
  });

  it("preserves Mystic inheritance for healing and every higher-level variant", () => {
    expect(getClassSpells("mystic", "dragonlance-user-pack").find((spell) => spell.name === "Cure Serious Wounds, Mass"))
      .toMatchObject({ level: 7, school: "Conjuration (Healing)", range: "Close (25 ft. + 5 ft./2 levels)" });
    expect(srdSpells.filter(({ name }) => ["Finger of Death", "Fire Storm", "Refuge", "Regenerate", "Reverse Gravity"].includes(name))
      .every((spell) => spell.description === findSpellByName(spell.name)?.description)).toBe(true);
  });
});
