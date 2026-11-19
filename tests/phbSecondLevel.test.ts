import { beforeAll, describe, expect, it } from "vitest";
import { findSpellByName, getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { classDefinitions } from "../src/domain";
import { srdSpells } from "../src/srdSpells";
import { phbSecondLevelSpellCases } from "./phbSpellCases";

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

beforeAll(loadSpellCatalog);

describe("PHB minimum-level-2 spell definitions", () => {
  it("covers the complete remaining group without repeating the audited trap alias", () => {
    const lowerLevel = new Set(srdSpells.filter(({ level }) => level < 2).map(({ name }) => name));
    const remaining = [...new Set(srdSpells
      .filter(({ level, name }) => level === 2 && !lowerLevel.has(name) && name !== "Leomund’s Trap")
      .map(({ name }) => name))].sort();
    expect(remaining).toEqual(phbSecondLevelSpellCases.map(({ name }) => name));
    expect(remaining).toHaveLength(88);
    expect(srdSpells.filter(({ name }) => remaining.includes(name))).toHaveLength(110);
  });

  it.each(phbSecondLevelSpellCases)("matches $name's printed headers (p. $page) in every variant and class list", (expected) => {
    const variants = srdSpells.filter(({ name }) => name === expected.name);
    expect(Object.fromEntries(variants.flatMap(({ classes, level }) => classes.map((id) => [id, level]))))
      .toEqual(expected.levels);
    const canonical = findSpellByName(expected.name);
    expect(canonical).toBeDefined();
    for (const spell of variants) {
      for (const field of ["school", "components", "castingTime", "range", "duration", "savingThrow"] as const) {
        expect(normalize(spell[field]), `${expected.name}: ${field}`).toBe(normalize(expected[field]));
      }
      expect(spell.description).toBe(canonical?.description);
      for (const { id: classId } of Object.values(classDefinitions)) {
        if (!spell.classes.includes(classId)) continue;
        expect(getClassSpells(classId).find(({ name }) => name === spell.name)).toMatchObject({
          level: spell.level,
          school: spell.school,
          components: spell.components,
          castingTime: spell.castingTime,
          range: spell.range,
          duration: spell.duration,
          savingThrow: spell.savingThrow,
          description: spell.description,
        });
      }
    }
  });

  it.each([
    ["Acid Arrow", ["2d4 acid", "maximum six additional rounds at caster level 18", "No splash", "resistance does not apply"]],
    ["Aid", ["+1 morale", "1d8 temporary hp", "maximum +10"]],
    ["Align Weapon", ["fifty", "Cannot affect natural weapons", "chosen alignment descriptor"]],
    ["Alter Self", ["your own creature type", "maximum 5 HD", "racial bonus feats", "stops functioning"]],
    ["Animal Trance", ["2d6 total HD", "Intelligence 1 or 2", "trained to attack or guard"]],
    ["Arcane Lock", ["break DC increases by 10", "10 minutes", "25 gp"]],
    ["Augury", ["maximum 90%", "30 minutes", "same topic use the first roll"]],
    ["Barkskin", ["enhancement bonus to natural armor", "maximum +5 at caster level 12"]],
    ["Bear’s Endurance", ["+4 enhancement", "not temporary hit points"]],
    ["Blur", ["20% miss chance", "See Invisibility does not", "True Seeing does"]],
    ["Calm Emotions", ["ends the spell for all", "Suppresses", "resume afterward"]],
    ["Chill Metal", ["0, 1d4, 2d4, 2d4, 2d4, 1d4, 0", "Underwater", "deals no damage"]],
    ["Command Undead", ["opposed Charisma", "mindless undead receives no save", "must hear you"]],
    ["Consecrate", ["+3 sacred", "cannot be created or summoned", "doubles", "25 gp"]],
    ["Cure Moderate Wounds", ["2d8 hp", "maximum +10", "undead", "Will for half"]],
    ["Darkness", ["20% concealment even against darkvision", "higher-level light spells are unaffected"]],
    ["Daze Monster", ["6 HD or fewer", "7 or more HD", "1 round"]],
    ["Death Knell", ["-1 hp or fewer", "+1 effective caster level", "grants no additional spell access"]],
    ["Desecrate", ["-3 profane", "+1 hp/HD", "4 HD per caster level"]],
    ["Detect Thoughts", ["round 3", "Intelligence 26+", "at least 10 above", "1 round"]],
    ["Enthrall", ["4+ HD or Wisdom 16+", "1d3 rounds", "ends it"]],
    ["False Life", ["1d10 temporary hp", "maximum +10"]],
    ["Find Traps", ["insight", "maximum +10", "Does not grant the ability to disable"]],
    ["Fire Trap", ["5-ft.-radius", "maximum +20", "Reflex half", "25 gp"]],
    ["Flame Blade", ["melee touch", "maximum +10", "Strength does not add"]],
    ["Flaming Sphere", ["move action", "2d6 fire", "Reflex negates", "vanishes beyond range"]],
    ["Fog Cloud", ["20-ft.-high", "11+ mph", "4 rounds", "21+ mph", "1 round"]],
    ["Fox’s Cunning", ["+4 enhancement", "neither additional bonus spells nor skill points"]],
    ["Ghoul Touch", ["living humanoid", "1d6+2 rounds", "10 ft.", "sickens"]],
    ["Glitterdust", ["-40", "Will save prevents blindness only"]],
    ["Heroism", ["+2 morale", "attack rolls, saves and skill checks"]],
    ["Hold Animal", ["one animal", "full-round action", "save again"]],
    ["Hold Person", ["one humanoid", "full-round action", "save again"]],
    ["Hypnotic Pattern", ["2d4 + caster level", "maximum +10", "lowest HD first", "Sightless"]],
    ["Inflict Moderate Wounds", ["2d8 damage", "maximum +10", "Will half", "heals undead"]],
    ["Invisibility", ["Attacking a creature ends", "Dropped items become visible", "emitted light"]],
    ["Knock", ["at most two", "10 minutes, not dispelled", "portcullis"]],
    ["Levitate", ["willing creature", "100 lb.", "20 ft.", "maximum -5"]],
    ["Make Whole", ["10 cu. ft.", "Does not restore lost magic or repair broken magic rods", "including constructs"]],
    ["Mirror Image", ["1d4", "maximum eight", "size modifier + Dexterity"]],
    ["Misdirection", ["their caster succeeds on a Will save", "Does not fool other divinations"]],
    ["Protection from Arrows", ["damage reduction 10/magic", "not immunity", "maximum 100"]],
    ["Protection from Energy", ["12 points per caster level", "maximum 120", "used first"]],
    ["Pyrotechnics", ["120 ft.", "1d4+1 rounds", "-4 Strength and Dexterity penalties", "no spell resistance"]],
    ["Rage", ["per three caster levels", "+2 morale", "-2 AC", "no fatigue"]],
    ["Reduce Animal", ["willing Small, Medium, Large or Huge animal", "+2 size Dexterity", "-2 size Strength"]],
    ["Remove Paralysis", ["two targets", "+4 resistance", "three or four", "+2 resistance"]],
    ["Rope Trick", ["up to eight creatures", "one of those spaces", "16,000 lb."]],
    ["Scare", ["Frighten", "fewer than 6 HD", "shaken for 1 round", "not the panicked condition"]],
    ["Scorching Ray", ["two at caster level 7", "three at caster level 11", "separate ranged touch", "4d6"]],
    ["See Invisibility", ["invisible and ethereal", "Does not reveal hidden creatures"]],
    ["Shatter", ["1 lb. per level each", "10 lb. per level", "maximum 10d6"]],
    ["Shield Other", ["+1 deflection", "+1 resistance", "50 gp each", "beyond close range"]],
    ["Silence", ["20-ft.-radius", "Blocks verbal spellcasting", "unattended objects and points receive neither"]],
    ["Snare", ["DC 23", "1d6", "otherwise it only entangles", "AC 7 and 5 hp"]],
    ["Sound Burst", ["1d8 sonic", "prevents 1 round of stunning, not the damage"]],
    ["Spectral Hand", ["Spend 1d4 hp", "4th level or lower", "+2", "unless the hand is destroyed"]],
    ["Spider Climb", ["20-ft. climb speed", "hands must be free", "cannot run"]],
    ["Spike Growth", ["1d4 piercing damage per 5 ft.", "24 hours", "10 minutes"]],
    ["Spiritual Weapon", ["maximum +5", "BAB plus Wisdom", "Redirecting costs a move action", "successful resistance dispels"]],
    ["Status", ["per three caster levels", "same plane", "death"]],
    ["Summon Monster II", ["1d3 of the same kind", "30 ft.", "cannot summon others or teleport"]],
    ["Summon Nature’s Ally II", ["1d3 of the same kind", "30 ft.", "cannot summon others or teleport"]],
    ["Summon Swarm", ["cannot control", "2 rounds afterward"]],
    ["Touch of Idiocy", ["a single 1d6 penalty", "not ability damage", "below 1", "No save"]],
    ["Tree Shape", ["+10 natural armor", "Dexterity 0 and speed 0", "free action"]],
    ["Warp Wood", ["-4 on attacks", "Make Whole cannot reverse"]],
    ["Web", ["All caught are entangled", "full-round DC 20 Strength or DC 25 Escape Artist", "2d4 fire"]],
    ["Whispering Wind", ["25 words", "1 mile per level", "whether anyone is there or not"]],
    ["Wind Wall", ["Arrows and bolts miss automatically", "30% miss chance", "massive missiles are unaffected"]],
    ["Wood Shape", ["10 cu. ft. +1 cu. ft.", "30% failure"]],
    ["Zone of Truth", ["failing a Will save", "may refuse answers", "leaving the area"]],
  ] as const)("retains %s's source-verified effect limits in all variants", (name, boundaries) => {
    for (const spell of srdSpells.filter((candidate) => candidate.name === name)) {
      for (const boundary of boundaries) expect(spell.description).toContain(boundary);
    }
  });

  it("keeps Mystic inheritance and setting-specific Bard healing filters intact", () => {
    const spell = getClassSpells("cleric").find(({ name }) => name === "Cure Moderate Wounds");
    expect(getClassSpells("mystic", "dragonlance-user-pack").find(({ name }) => name === spell?.name))
      .toMatchObject({ ...spell, level: 2 });
    expect(getClassSpells("bard").some(({ name }) => name === "Cure Moderate Wounds")).toBe(true);
    expect(getClassSpells("bard", "dragonlance-user-pack").some(({ name }) => name === "Cure Moderate Wounds"))
      .toBe(false);
  });
});
