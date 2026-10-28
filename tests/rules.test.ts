import { beforeAll, describe, expect, it } from "vitest";
import { abilityModifier, armorClass, beginLevelUp, changeRace, cloneCharacter,
  hitPointGain, initialCharacter, levelUpHitPointGain, nextClassLevel, validateLevelUp } from "../src/domain";
import { baseSpellSlots, featQualifies, getBaseAttackBonus, getBaseSave,
  getEquipmentArmorClass, getEquippedWeaponStats, getLevelUpAlignmentWarnings,
  getAvailableBonusLanguages, getClassFeatureDisplay, getLanguageBonusSlots,
  getRacialSkillBonus, formatRaceDetails, getSkillMaximum, getSpentSkillPoints,
  getTwoWeaponAttackPenalty, isClassAlignmentAllowed } from "../src/rules";
import { featCatalog } from "../src/data/characterCatalog";
import { getClassSpells, loadSpellCatalog, spells } from "../src/data/spellCatalog";

beforeAll(loadSpellCatalog);

describe("character rules preserved from 2.0", () => {
  it("uses D&D ability modifiers and a minimum one hit point gain", () => {
    expect([7, 8, 9, 10, 11, 12, 18].map(abilityModifier)).toEqual([-2, -1, -1, 0, 0, 1, 4]);
    const character = cloneCharacter(initialCharacter);
    character.abilities.con = 3;
    expect(hitPointGain(character, 1)).toBe(1);
  });

  it("applies a level-up Constitution modifier increase to existing and new Hit Dice", () => {
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "fighter", level: 3 }];
    original.abilities.con = 13;
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    proposed.abilities.con = 14;
    expect(levelUpHitPointGain(original, proposed, 5)).toBe(10);
  });

  it("keeps all level-up changes separate from the finalized character", () => {
    const original = cloneCharacter(initialCharacter);
    original.inventory = { "Longsword (Medium)": 1 };
    const snapshot = cloneCharacter(original);
    const draft = beginLevelUp(original, "wizard");
    draft.proposed.skills.Spellcraft = 2;
    draft.proposed.inventory["Longsword (Medium)"] = 5;
    draft.proposed.knownSpells.push("Magic Missile");
    draft.proposed.abilities.int = 18;
    expect(original).toEqual(snapshot);
    expect(draft.original).toEqual(snapshot);
    expect(draft.proposed.classLevels).toEqual([
      { classId: "fighter", level: 1 }, { classId: "wizard", level: 1 },
    ]);
    expect(nextClassLevel(draft.proposed, "wizard")).toBe(2);
  });

  it("requires a hit point roll before confirmation, preserving current behavior", () => {
    const draft = beginLevelUp(cloneCharacter(initialCharacter), "fighter");
    expect(validateLevelUp(draft)).toContain("Roll hit points before confirming the level-up.");
    draft.hitPointRoll = 6;
    expect(validateLevelUp(draft)).toEqual([]);
    draft.proposed.classLevels[0].level = 5;
    expect(validateLevelUp(draft)).toContain("A level-up must add exactly one class level.");
  });

  it("requires an ability increase at level four", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels[0].level = 3;
    const draft = beginLevelUp(character, "fighter");
    draft.hitPointRoll = 5;
    expect(validateLevelUp(draft)).toContain("Choose an ability score to increase before confirming the level-up.");
    draft.abilityIncrease = "str";
    expect(validateLevelUp(draft)).toEqual([]);
  });

  it("reverses old race modifiers before applying the next race", () => {
    const dwarf = changeRace(initialCharacter, "Dwarf");
    expect(dwarf.abilities.con).toBe(12);
    expect(changeRace(dwarf, "Human").abilities).toEqual(initialCharacter.abilities);
  });

  it("uses core racial language slots and bonus-language lists", () => {
    const human = cloneCharacter(initialCharacter);
    human.abilities.int = 10;
    expect(getLanguageBonusSlots(human)).toBe(0);
    human.abilities.int = 12;
    expect(getLanguageBonusSlots(human)).toBe(1);
    expect(getAvailableBonusLanguages(human, "core-35-srd")).toContain("Ignan");
    expect(getAvailableBonusLanguages(human, "core-35-srd")).not.toContain("Kender");

    const dwarf = cloneCharacter(human);
    dwarf.race = "Dwarf";
    expect(getAvailableBonusLanguages(dwarf, "core-35-srd")).toContain("Undercommon");
    expect(getAvailableBonusLanguages(dwarf, "core-35-srd")).not.toContain("Abyssal");

    const halfOrc = cloneCharacter(human);
    halfOrc.race = "Half-orc";
    expect(getAvailableBonusLanguages(halfOrc, "core-35-srd")).toContain("Abyssal");
    expect(getAvailableBonusLanguages(halfOrc, "core-35-srd")).not.toContain("Terran");
  });

  it("applies only the racial skill bonuses specified for each core race", () => {
    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    expect(getRacialSkillBonus(gnome, "Listen")).toBe(2);
    expect(getRacialSkillBonus(gnome, "Craft")).toBe(0);

    const halfElf = cloneCharacter(initialCharacter);
    halfElf.race = "Half-elf";
    expect(getRacialSkillBonus(halfElf, "Search")).toBe(1);
    expect(getRacialSkillBonus(halfElf, "Diplomacy")).toBe(2);
    expect(getRacialSkillBonus(halfElf, "Gather Information")).toBe(2);
  });

  it("shows size and base speed in core race details", () => {
    expect(formatRaceDetails({
      id: "human",
      name: "Human",
      source: "core-35-srd",
      size: "Medium",
      speed: 30,
      abilityModifiers: {},
    })).toContain("Size Medium; Speed 30 ft.");
  });

  it("sums multiclass attack and save progressions", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }, { classId: "wizard", level: 2 }];
    expect(getBaseAttackBonus(character)).toBe(5);
    expect(getBaseSave(character, "fortitude")).toBe(4);
    expect(getBaseSave(character, "will")).toBe(4);
  });

  it("displays class features at their class-level unlocks", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "monk", level: 1 }];
    character.classFeatures = [
      "Bonus Feat",
      "Flurry of Blows",
      "Improved Unarmed Strike",
      "Evasion",
    ];
    const firstLevelFeatures = getClassFeatureDisplay(character);
    expect(firstLevelFeatures).toContainEqual({
      source: "Monk 1",
      ability: "Flurry of Blows",
    });
    expect(firstLevelFeatures.some(({ ability }) => ability === "Evasion")).toBe(false);

    character.classLevels[0].level = 2;
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Monk 2",
      ability: "Evasion",
    });

    character.classLevels.push({ classId: "wizard", level: 1 });
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Wizard 1",
      ability: "Scribe Scroll",
    });

    character.classLevels = [{ classId: "barbarian", level: 1 }];
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Barbarian 1",
      ability: "Illiteracy",
    });
    character.classLevels = [{ classId: "monk", level: 20 }];
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Monk 20",
      ability: "Slow Fall (any distance)",
    });
    character.classLevels = [{ classId: "paladin", level: 20 }];
    expect(getClassFeatureDisplay(character).some(
      ({ ability }) => ability === "Holy Champion",
    )).toBe(false);
  });

  it("preserves armor dexterity limits, size, and masterwork attack benefits", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.dex = 18;
    character.abilities.str = 14;
    character.equipment = { Armor: "Full Plate (Medium)", Shield: "Heavy Steel Shield (Medium)" };
    expect(getEquipmentArmorClass(character)).toBe(21);
    expect(armorClass(changeRace(character, "Halfling"))).toBeGreaterThan(armorClass(character));
    const stats = getEquippedWeaponStats(character, "Masterwork Longsword (Medium)");
    expect(stats?.attack).toBe(4);
    expect(stats?.damage).toBe("1d8+2");
  });

  it("preserves cross-class rank limits and feat prerequisites", () => {
    expect(getSkillMaximum(initialCharacter, "Climb")).toBe(4);
    expect(getSkillMaximum(initialCharacter, "Spellcraft")).toBe(2);
    const powerAttack = featCatalog.find((feat) => feat.id === "power-attack");
    expect(powerAttack).toBeDefined();
    if (!powerAttack) throw new Error("Missing Power Attack fixture.");
    expect(featQualifies(initialCharacter, powerAttack, { fighterOnly: false })).toBe(false);
    const character = cloneCharacter(initialCharacter);
    character.abilities.str = 13;
    expect(featQualifies(character, powerAttack, { fighterOnly: false })).toBe(true);
    character.equipment = { "Main Weapon": "Longsword (Medium)", "Off Hand Weapon": "Dagger (Medium)" };
    expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(-4);
    expect(getTwoWeaponAttackPenalty(character, "Off Hand Weapon")).toBe(-8);
  });

  it("uses exact cross-class rank caps and preserves rank costs by class", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    expect(getSkillMaximum(character, "Spellcraft")).toBe(2.5);

    character.classLevels = [{ classId: "fighter", level: 1 }];
    character.skills.Spellcraft = 1;
    character.skillRanksByClass = { fighter: { Spellcraft: 1 } };
    expect(getSpentSkillPoints(character)).toBe(2);

    character.classLevels.push({ classId: "wizard", level: 1 });
    character.skills.Spellcraft = 2;
    character.skillRanksByClass.wizard = { Spellcraft: 1 };
    expect(getSpentSkillPoints(character)).toBe(3);
  });

  it("requires the correct caster level for item creation feats", () => {
    const scribeScroll = featCatalog.find((feat) => feat.id === "scribe-scroll");
    const craftWand = featCatalog.find((feat) => feat.id === "craft-wand");
    const fighter = cloneCharacter(initialCharacter);
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 1 }];

    if (!scribeScroll || !craftWand) throw new Error("Missing item creation feat fixture.");
    expect(featQualifies(fighter, scribeScroll, { fighterOnly: false })).toBe(false);
    expect(featQualifies(wizard, scribeScroll, { fighterOnly: false })).toBe(true);
    expect(featQualifies(wizard, craftWand, { fighterOnly: false })).toBe(false);
    wizard.classLevels[0].level = 5;
    expect(featQualifies(wizard, craftWand, { fighterOnly: false })).toBe(true);
  });

  it("does not allow general feats as fighter bonus feats", () => {
    const combatCasting = featCatalog.find((feat) => feat.id === "combat-casting");
    const toughness = featCatalog.find((feat) => feat.id === "toughness");
    if (!combatCasting || !toughness) throw new Error("Missing fighter feat fixture.");
    expect(featQualifies(initialCharacter, combatCasting, { fighterOnly: true })).toBe(false);
    expect(featQualifies(initialCharacter, toughness, { fighterOnly: true })).toBe(false);
  });

  it("enforces core class alignment restrictions on level-up", () => {
    const character = cloneCharacter(initialCharacter);
    character.alignment = "Chaotic Good";
    expect(isClassAlignmentAllowed("barbarian", character.alignment)).toBe(true);
    expect(isClassAlignmentAllowed("monk", character.alignment)).toBe(false);
    expect(getLevelUpAlignmentWarnings(character, "paladin")).toEqual([
      "Cannot take a Paladin level with Chaotic Good; this class must be Lawful Good.",
    ]);
    character.alignment = "Lawful Good";
    expect(getLevelUpAlignmentWarnings(character, "paladin")).toEqual([]);
  });
});

describe("spell catalog", () => {
  it("loads once and indexes class lists without changing their content", async () => {
    const count = spells.length;
    await Promise.all([loadSpellCatalog(), loadSpellCatalog()]);
    expect(spells.length).toBe(count);
    expect(count).toBeGreaterThan(700);
    expect(getClassSpells("wizard")).toEqual(spells.filter((spell) => spell.classes.includes("wizard")));
    expect(getClassSpells("wizard")).toBe(getClassSpells("wizard"));
    expect(getClassSpells("cleric").some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
  });

  it("keeps multiclass spell slots tied to class level", () => {
    expect(baseSpellSlots("wizard", 1, 1)).toBe(1);
    expect(baseSpellSlots("wizard", 3, 2)).toBe(1);
    expect(baseSpellSlots("fighter", 5, 2)).toBe(0);
  });
});
