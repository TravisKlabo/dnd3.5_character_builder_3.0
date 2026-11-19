import { beforeAll, describe, expect, it } from "vitest";
import {
  beginPrestigeLevelUp, classDefinitions, cloneCharacter, dragonlancePrestigeClasses, initialCharacter,
  validateLevelUp,
  type Character, type ClassId, type PrestigeClassId,
} from "../src/domain";
import { featCatalog } from "../src/data/characterCatalog";
import { getClassSpells, loadSpellCatalog } from "../src/data/spellCatalog";
import { findStoreItem } from "../src/data/equipmentCatalog";
import { formatPrestigeClassDetails } from "../src/creationRules";
import { getMovement } from "../src/movementRules";
import { parseCharacter } from "../src/validation";
import { getMaximumHitPoints } from "../src/hitPoints";
import { getRedWizardNewSpellWarnings } from "../src/redWizardRules";
import {
  featQualifies, getAvailableFeats, getBaseAttackBonus, getBaseSave,
  getChosenFeats, getClassFeatureDisplay, getFeatSlots, getNewLevelUpFeatSlots,
  getImprovedInitiativeBonus,
  getCasterLevel, getSkillFocusBonus, getSpellSaveDC, isWeaponProficient,
  getSkillTrickGrantFeatSlots,
  getPrestigeClassEligibilityErrors, getPrestigeClassPrerequisiteErrors,
  getArmorClassValues, getArmorShieldProficiencies, getEffectiveSpellcastingClassLevel,
  getInitiativeModifier, getPrestigeSpellcastingClassOptions, isClassSkill,
  getSavingThrow, getSkillPointsPerLevel, getWizardBonusFeatWarnings,
  normalizeFeatSelections, baseSpellSlots, getDailySpellSlots, getKnownSpellLimit,
  getKnownSpellReplacementLevelLimit, getLevelUpSpellWarnings, getSpellcastingClassLevels,
  hasSpellLevelAtClassLevel,
  getCharacterLanguages, getPrestigeFeatureChoice, getPrestigeFeatureChoiceWarnings,
  getDragonDiscipleSlotOptions,
  getAvailableSkillCount,
  getRedWizardSpellPower, getRedWizardProhibitedSchools,
} from "../src/rules";

beforeAll(loadSpellCatalog);

it("applies Red Wizard advancement, prohibited schools, caster power and the level-five feat slot", () => {
  let character = hero("wizard", 13);
  character.coreWizardSpecializationSchool = "Abjuration";
  character.redWizardSpecializationSchool = "Abjuration";
  character.redWizardProhibitedSchools = ["Evocation"];
  character.knownSpellsByClass = { wizard: ["Fireball"] };
  const firstOriginal = cloneCharacter(character);
  let draft = beginPrestigeLevelUp(character, "red-wizard", "wizard");
  draft.specialPrerequisiteConfirmed = true;
  expect(getPrestigeFeatureChoiceWarnings(draft)).toEqual([]);
  character = draft.proposed;
  for (let level = 2; level <= 10; level++) {
    draft = beginPrestigeLevelUp(character, "red-wizard", "wizard");
    if (level === 5) draft.proposed.featSelections = { "red-wizard-5": "empower-spell" };
    expect(getPrestigeFeatureChoiceWarnings(draft)).toEqual([]);
    character = draft.proposed;
  }
  const loaded = parseCharacter(JSON.parse(JSON.stringify(character)));
  expect(getRedWizardSpellPower(loaded, "wizard")).toBe(5);
  expect(getCasterLevel("wizard", 13, loaded)).toBe(28);
  expect(getSpellSaveDC(loaded, "wizard", 3, "Abjuration"))
    .toBe(getSpellSaveDC(firstOriginal, "wizard", 3, "Abjuration") + 1);
  expect(getRedWizardProhibitedSchools(loaded)).toContain("Evocation");
  const slot = getFeatSlots(loaded).find(({ id }) => id === "red-wizard-5")!;
  const unselected = { ...loaded, featSelections: {} };
  expect(getAvailableFeats(unselected, slot).map(({ id }) => id)).toContain("empower-spell");
  expect(getAvailableFeats(unselected, slot).map(({ id }) => id)).not.toContain("toughness");
  const invalidImported = parseCharacter({
    ...loaded,
    featSelections: { "red-wizard-5": "toughness" },
  });
  expect(getChosenFeats(invalidImported)).not.toContain("toughness");
  const proposed = {
    ...firstOriginal,
    knownSpellsByClass: { wizard: ["Fireball", "Cone of Cold"] },
    redWizardProhibitedSchools: ["Evocation"],
    classLevels: [
      { classId: "wizard", level: 14 },
      { classId: "wizard", prestigeClassId: "red-wizard", level: 1 },
    ],
  } satisfies Character;
  expect(getRedWizardNewSpellWarnings({
    ...beginPrestigeLevelUp(firstOriginal, "red-wizard", "wizard"),
    proposed,
  }, true)).toContain("A Red Wizard cannot learn a new Evocation spell.");
  expect(() => parseCharacter({ ...loaded, redWizardProhibitedSchools: ["Abjuration"] }))
    .toThrow(/Red Wizard levels require/);
});

it("advances qualifying Archmage casting and permanently reserves distinct slots", () => {
  const character = hero("wizard", 13);
  character.classLevels.push({ classId: "sorcerer", level: 5 });
  expect(getPrestigeSpellcastingClassOptions(character, "archmage")).toEqual(["wizard"]);
  const first = beginPrestigeLevelUp(character, "archmage", "wizard");
  expect(getPrestigeFeatureChoiceWarnings(first)).not.toEqual([]);
  first.proposed.highArcanaChoices = [{ ability: "Arcane Fire", classId: "wizard", slot: 9 }];
  expect(getPrestigeFeatureChoiceWarnings(first)).not.toEqual([]);
  first.proposed.highArcanaChoices = [{ ability: "Spell Power", classId: "wizard", slot: 5 }];
  expect(getPrestigeFeatureChoiceWarnings(first)).toEqual([]);
  expect(getCasterLevel("wizard", 13, first.proposed)).toBe(15);
  expect(getDailySpellSlots(first.proposed, "wizard", 14, 5)).toBe(
    getDailySpellSlots({ ...first.proposed, highArcanaChoices: [] }, "wizard", 14, 5) - 1,
  );
  const second = beginPrestigeLevelUp(first.proposed, "archmage", "wizard");
  second.proposed.highArcanaChoices = [...first.proposed.highArcanaChoices, {
    ability: "Spell-Like Ability", classId: "wizard", slot: 7, reserve: 7, spellNote: "DM-approved spell conversion",
  }];
  expect(getPrestigeFeatureChoiceWarnings(second)).toEqual([]);
  const saved = parseCharacter(JSON.parse(JSON.stringify(second.proposed)));
  expect(getDailySpellSlots(saved, "wizard", 15, 7)).toBe(0);
  expect(getDailySpellSlots(saved, "sorcerer", 5, 2)).toBe(getDailySpellSlots(character, "sorcerer", 5, 2));
  expect(getEffectiveSpellcastingClassLevel(saved, "wizard")).toBe(15);
  expect(() => parseCharacter({ ...saved, highArcanaChoices: [] })).toThrow(/Archmage history/);
});

it("locks Dragon Disciple slots to previously castable levels without advancing casting", () => {
  const base = hero("sorcerer", 6);
  const originalSlots = getDailySpellSlots(base, "sorcerer", 6, 3);
  let character = base;
  for (let level = 1; level <= 10; level++) {
    const draft = beginPrestigeLevelUp(character, "dragon-disciple");
    const prior = character.dragonDiscipleBonusSlots ?? [];
    draft.proposed.dragonDiscipleVariety = "Bronze";
    if ([1, 2, 4, 5, 6, 8, 9].includes(level)) {
      expect(getPrestigeFeatureChoiceWarnings(draft)).not.toEqual([]);
      expect(getDragonDiscipleSlotOptions(draft).map((slot) => slot.level)).toEqual([1, 2, 3]);
      draft.proposed.dragonDiscipleBonusSlots = [...prior, { classId: "sorcerer", level: 4 }];
      expect(getPrestigeFeatureChoiceWarnings(draft)).not.toEqual([]);
      draft.proposed.dragonDiscipleBonusSlots.at(-1)!.level = 3;
    }
    expect(getPrestigeFeatureChoiceWarnings(draft)).toEqual([]);
    character = draft.proposed;
  }
  const saved = parseCharacter(JSON.parse(JSON.stringify(character)));
  expect(saved.abilities).toMatchObject({ str: 18, con: 12, int: 20, cha: 20 });
  expect(getCasterLevel("sorcerer", 6, saved)).toBe(6);
  expect(getKnownSpellLimit(saved, "sorcerer", 6, 3)).toBe(getKnownSpellLimit(base, "sorcerer", 6, 3));
  expect(getDailySpellSlots(saved, "sorcerer", 6, 3)).toBe(originalSlots + 7);
  expect(getArmorClassValues(saved).normal).toBe(getArmorClassValues(base).normal + 4);
  expect(getArmorClassValues(saved).touch).toBe(getArmorClassValues(base).touch);
  expect(getAvailableSkillCount(saved) - getAvailableSkillCount(base)).toBe(73);
  expect(() => parseCharacter({ ...saved, dragonDiscipleBonusSlots: [] })).toThrow(/Dragon Disciple levels/);
});

describe("Loremaster and Hierophant advancement", () => {
  it("requires earned, distinct Loremaster choices and advances casting independently of class features", () => {
    let character = hero("wizard", 8);
    character.abilities.int = 14;
    const first = beginPrestigeLevelUp(character, "loremaster", "wizard");
    expect(getPrestigeFeatureChoice(first)?.options).not.toContain("The Lore of True Stamina");
    expect(getPrestigeFeatureChoiceWarnings(first)).not.toEqual([]);
    first.proposed.loremasterSecrets = ["Secret Health"];
    expect(getPrestigeFeatureChoiceWarnings(first)).toEqual([]);
    expect(getMaximumHitPoints(first.proposed)).toBe(getMaximumHitPoints(character) + 3);
    character = beginPrestigeLevelUp(first.proposed, "loremaster", "wizard").proposed;
    const third = beginPrestigeLevelUp(character, "loremaster", "wizard");
    third.proposed.loremasterSecrets = ["Secret Health", "Secret Health"];
    expect(getPrestigeFeatureChoiceWarnings(third)).not.toEqual([]);
    third.proposed.loremasterSecrets = ["Secret Health", "Secrets of Inner Strength"];
    const fourth = beginPrestigeLevelUp(third.proposed, "loremaster", "wizard");
    expect(getPrestigeFeatureChoice(fourth)?.options).not.toContain("Common");
    fourth.proposed.loremasterLanguages = ["Draconic"];
    expect(getPrestigeFeatureChoiceWarnings(fourth)).toEqual([]);
    const loaded = parseCharacter(JSON.parse(JSON.stringify(fourth.proposed)));
    expect(getCharacterLanguages(loaded)).toContain("Draconic");
    expect(getEffectiveSpellcastingClassLevel(loaded, "wizard")).toBe(12);
    expect(getFeatSlots(loaded).some((slot) => slot.id === "wizard-10")).toBe(false);
    expect(isClassSkill(loaded, "Knowledge (nature)", "loremaster")).toBe(true);
    expect(() => parseCharacter({ ...loaded, loremasterLanguages: [] })).toThrow(/Loremaster language history/);
  });

  it("adds Hierophant caster levels and cumulative Spell Power without granting new spells", () => {
    const character = hero("cleric", 13);
    character.abilities.wis = 18;
    const first = beginPrestigeLevelUp(character, "hierophant");
    expect(getPrestigeFeatureChoice(first)?.options).not.toContain("Power of Nature");
    expect(getPrestigeFeatureChoice(first)?.options).toContain("Gift of the Divine");
    expect(getPrestigeFeatureChoiceWarnings(first)).not.toEqual([]);
    first.proposed.hierophantAbilities = ["Spell Power"];
    const second = beginPrestigeLevelUp(first.proposed, "hierophant");
    second.proposed.hierophantAbilities = ["Spell Power", "Spell Power"];
    expect(getPrestigeFeatureChoiceWarnings(second)).toEqual([]);
    const loaded = parseCharacter(JSON.parse(JSON.stringify(second.proposed)));
    expect(getEffectiveSpellcastingClassLevel(loaded, "cleric")).toBe(13);
    expect(getCasterLevel("cleric", 13, loaded)).toBe(17);
    expect(getDailySpellSlots(loaded, "cleric", 13, 8)).toBe(getDailySpellSlots(character, "cleric", 13, 8));
    expect(() => parseCharacter({ ...loaded, hierophantAbilities: ["Power of Nature", "Spell Power"] }))
      .toThrow(/Hierophant ability history/);
    const featChoice = { ...loaded, hierophantAbilities: ["Spell Power", "Metamagic Feat"] } satisfies Character;
    const slot = getFeatSlots(featChoice).find((candidate) => candidate.id === "hierophant-2")!;
    expect(getAvailableFeats(featChoice, slot).map(({ id }) => id)).toContain("extend-spell");
    expect(getAvailableFeats(featChoice, slot).map(({ id }) => id)).not.toContain("toughness");
  });
});

function hero(classId: ClassId, level: number) {
  const character = cloneCharacter(initialCharacter);
  character.race = "Human";
  character.alignment = "Neutral Good";
  character.abilities = { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 18 };
  character.classLevels = [{ classId, level }];
  return character;
}

function wizardSlot(character: Character, level = 5) {
  const slot = getFeatSlots(character).find(({ id }) => id === `wizard-${level}`);
  if (!slot) throw new Error("Missing Wizard bonus slot.");
  return slot;
}

function feat(id: string) {
  const entry = featCatalog.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing feat ${id}.`);
  return entry;
}

describe("PHB class chassis and bonus feats", () => {
  const classes = [
    ["barbarian", 12, 4, 1, ["fortitude"], false],
    ["bard", 6, 6, 0.75, ["reflex", "will"], true],
    ["cleric", 8, 2, 0.75, ["fortitude", "will"], true],
    ["druid", 8, 4, 0.75, ["fortitude", "will"], true],
    ["fighter", 10, 2, 1, ["fortitude"], false],
    ["monk", 8, 4, 0.75, ["fortitude", "reflex", "will"], false],
    ["paladin", 10, 2, 1, ["fortitude"], true],
    ["ranger", 8, 6, 1, ["fortitude", "reflex"], true],
    ["rogue", 6, 8, 0.75, ["reflex"], false],
    ["sorcerer", 4, 2, 0.5, ["will"], true],
    ["wizard", 4, 2, 0.5, ["will"], true],
  ] as const;

  it.each(classes)("matches %s's source chassis at every level from 1 to 20", (
    classId, hitDie, skillPoints, attackRate, goodSaves, spellcasting,
  ) => {
    const character = hero(classId, 1);
    character.race = "Half-Elf";
    character.abilities.int = 10;
    expect(classDefinitions[classId]).toMatchObject({ hitDie, skillPoints, spellcasting });
    expect(getSkillPointsPerLevel(character, classId)).toBe(skillPoints);
    for (let level = 1; level <= 20; level += 1) {
      character.classLevels = [{ classId, level }];
      expect(getBaseAttackBonus(character)).toBe(Math.floor(level * attackRate));
      for (const save of ["fortitude", "reflex", "will"] as const) {
        expect(getBaseSave(character, save)).toBe(
          goodSaves.some((candidate) => candidate === save)
            ? 2 + Math.floor(level / 2) : Math.floor(level / 3),
        );
      }
    }
  });

  it("adds Divine Grace separately without improving the Paladin's base Will save", () => {
    const character = hero("paladin", 1);
    character.alignment = "Lawful Good";
    character.abilities.wis = 12;
    character.abilities.cha = 16;
    expect(getSavingThrow(character, "will").total).toBe(1);
    for (const level of [2, 3, 6, 12, 20]) {
      character.classLevels[0].level = level;
      expect(getBaseSave(character, "will")).toBe(Math.floor(level / 3));
      expect(getSavingThrow(character, "will").total).toBe(Math.floor(level / 3) + 4);
    }
    character.alignment = "Neutral Good";
    expect(getSavingThrow(character, "will").total).toBe(7);
  });

  it("starts the Monk's actual speed bonus at level 3, not the table's premature feature label", () => {
    const character = hero("monk", 2);
    expect(getMovement(character).speed).toBe(30);
    expect(getClassFeatureDisplay(character).some(({ ability }) => ability === "Fast Movement")).toBe(false);
    character.classLevels[0].level = 3;
    expect(getMovement(character).speed).toBe(40);
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Monk 3", ability: "Fast Movement",
    });
  });

  it("restricts all four Wizard bonus slots but leaves general feats unrestricted", () => {
    const character = hero("wizard", 20);
    for (const level of [5, 10, 15, 20]) {
      const slot = wizardSlot(character, level);
      expect(slot.wizardOnly).toBe(true);
      for (const allowed of ["empower-spell", "craft-wand", "spell-mastery"])
        expect(featQualifies(character, feat(allowed), slot)).toBe(true);
      for (const excluded of ["improved-initiative", "spell-focus", "weapon-focus"])
        expect(featQualifies(character, feat(excluded), slot)).toBe(false);
    }
    expect(featQualifies(character, feat("improved-initiative"), { fighterOnly: false })).toBe(true);
    expect(getChosenFeats(character)).toContain("scribe-scroll");
  });

  it("retains prerequisites in Wizard slots and derives the new slot during level-up", () => {
    const original = hero("wizard", 4);
    const proposed = hero("wizard", 5);
    expect(getNewLevelUpFeatSlots(original, proposed)).toContainEqual(wizardSlot(proposed));
    expect(featQualifies(proposed, feat("craft-wand"), wizardSlot(proposed))).toBe(true);
    expect(featQualifies(proposed, feat("craft-staff"), wizardSlot(proposed))).toBe(false);
  });

  it("permits reserve feats and the verified MMIV racial exception", () => {
    const character = hero("wizard", 5);
    character.knownSpellsByClass = { wizard: ["Fireball"] };
    expect(featQualifies(character, feat("fiery-burst"), wizardSlot(character))).toBe(true);
    expect(featQualifies(character, feat("githyanki-battlecaster"), wizardSlot(character))).toBe(false);
    character.classLevels.push({ classId: "fighter", level: 1 });
    character.race = "Githyanki";
    expect(featQualifies(character, feat("githyanki-battlecaster"), wizardSlot(character))).toBe(true);
    expect(featQualifies(character, feat("githyanki-battlecaster"), { fighterOnly: true })).toBe(true);
  });

  it.each([
    ["fearsome-necromancy", "Necromancy"],
    ["toughening-transmutation", "Transmutation"],
    ["unsettling-enchantment", "Enchantment"],
  ] as const)("limits %s's Wizard bonus exception to its specialist", (id, school) => {
    const character = hero("wizard", 5);
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": school };
    expect(featQualifies(character, feat(id), { fighterOnly: false })).toBe(true);
    expect(featQualifies(character, feat(id), wizardSlot(character))).toBe(false);
    character.coreWizardSpecializationSchool = school;
    expect(featQualifies(character, feat(id), wizardSlot(character))).toBe(true);
  });

  it("warns about invalid saved Wizard choices, preserves input, and normalizes replacements", () => {
    const character = hero("wizard", 5);
    character.featSelections = { "wizard-5": "improved-initiative" };
    expect(getWizardBonusFeatWarnings(character)[0]).toContain("not a permitted Wizard bonus feat");
    expect(getChosenFeats(character)).not.toContain("improved-initiative");
    expect(getImprovedInitiativeBonus(character)).toBe(0);
    expect(normalizeFeatSelections(character, character.featSelections)).toEqual({});
    expect(character.featSelections).toEqual({ "wizard-5": "improved-initiative" });
    character.featSelections["wizard-5"] = "spell-focus";
    character.featSpellSchoolSelections = { "wizard-5": "Evocation" };
    expect(getSpellSaveDC(character, "wizard", 1, "Evocation")).toBe(15);
    character.featSelections["wizard-5"] = "skill-focus";
    character.featSkillSelections = { "wizard-5": "Spellcraft" };
    expect(getSkillFocusBonus(character, "Spellcraft")).toBe(0);
    character.featSelections["wizard-5"] = "mage-slayer";
    expect(getCasterLevel("wizard", 5, character)).toBe(5);
    character.featSelections["wizard-5"] = "martial-weapon-proficiency";
    character.featWeaponSelections = { "wizard-5": "Longsword" };
    const sword = findStoreItem("Longsword (Medium)");
    if (!sword) throw new Error("Missing proficiency regression weapon.");
    expect(isWeaponProficient(character, sword)).toBe(false);
    character.featSelections["wizard-5"] = "endurance";
    character.feats = ["Endurance"];
    character.skills = { "Knowledge (geography)": 8 };
    expect(getPrestigeClassPrerequisiteErrors(character, "horizon-walker"))
      .toContain("Endurance is required.");
    character.featSelections["wizard-5"] = "cool-head";
    expect(getSkillTrickGrantFeatSlots(character)).toEqual([]);
    character.feats = [];
    character.featSelections["wizard-5"] = "empower-spell";
    expect(normalizeFeatSelections(character, character.featSelections)).toEqual(character.featSelections);
    expect(getWizardBonusFeatWarnings(character)).toEqual([]);
    expect(getAvailableFeats(character, wizardSlot(character), "wizard-5")
      .some(({ id }) => id === "empower-spell")).toBe(true);
  });

  it("uses the historical multiclass slot's caster level instead of future levels", () => {
    const character = hero("wizard", 10);
    character.classLevels.unshift({ classId: "fighter", level: 1 });
    character.hitPointRolls = [
      { characterLevel: 1, classId: "fighter", classLevel: 1, hitDie: 10, roll: 10, hpIncrease: 10 },
      ...Array.from({ length: 10 }, (_, index) => ({
        characterLevel: index + 2, classId: "wizard" as const, classLevel: index + 1,
        hitDie: 4, roll: 4, hpIncrease: 4,
      })),
    ];
    expect(wizardSlot(character).characterLevel).toBe(6);
    expect(featQualifies(character, feat("craft-staff"), wizardSlot(character))).toBe(false);
    expect(featQualifies(character, feat("craft-staff"), wizardSlot(character, 10))).toBe(false);
    expect(featQualifies(character, feat("craft-wand"), wizardSlot(character))).toBe(true);
  });
});

describe("represented DMG prestige entry requirements", () => {
  const requirements = (character: Character, id: PrestigeClassId, confirm = true) =>
    getPrestigeClassPrerequisiteErrors(character, id, confirm);

  it("checks Blackguard's mechanical requirements separately from the DM-confirmed contact", () => {
    const character = hero("fighter", 6);
    character.alignment = "Neutral Evil";
    character.skills = { Hide: 5, "Knowledge (religion)": 2 };
    character.feats = ["Power Attack", "Cleave", "Improved Sunder"];
    expect(requirements(character, "blackguard")).toEqual([]);
    expect(requirements(character, "blackguard", false)).toEqual([
      expect.stringContaining("peaceful contact with a summoned evil outsider"),
    ]);
    character.alignment = "Neutral";
    character.classLevels[0].level = 5;
    character.skills.Hide = 4;
    character.skills["Knowledge (religion)"] = 1;
    character.feats.pop();
    expect(requirements(character, "blackguard")).toEqual(expect.arrayContaining([
      "Alignment must be Any evil.", "Base attack bonus must be +6.", "Hide must have 5 ranks.",
      "Knowledge (religion) must have 2 ranks.", "Improved Sunder is required.",
    ]));
  });

  it("checks Red Wizard access without treating Thay or Tattoo Focus as default core options", () => {
    const character = hero("wizard", 5);
    character.alignment = "Lawful Neutral";
    character.skills = { Spellcraft: 8 };
    character.feats = ["Empower Spell", "Extend Spell"];
    expect(requirements(character, "red-wizard")).toEqual([]);
    expect(requirements(character, "red-wizard", false)).toEqual([
      expect.stringContaining("Thayan origin and Tattoo Focus"),
    ]);
    character.alignment = "Lawful Good";
    character.race = "Elf";
    character.skills.Spellcraft = 7;
    character.classLevels[0].level = 4;
    character.feats = ["Extend Spell", "Extend Spell"];
    expect(requirements(character, "red-wizard")).toEqual(expect.arrayContaining([
      "Alignment must be Any nongood.", "Race must be one of: Human.", "Spellcraft must have 8 ranks.",
      "Choose 3 distinct feats from the required categories.", "Ability to cast arcane spells of level 3 is required.",
    ]));
  });

  it("shows independent prestige spell lists and the Blackguard-only summoning restriction", () => {
    expect(formatPrestigeClassDetails(dragonlancePrestigeClasses.blackguard)).toMatch(
      /Class spells \(independent casting\): Level 1:.*Corrupt Weapon.*Level 3:.*Protection from Elements.*Level 4:.*Summon Monster IV.*only evil creatures/,
    );
    expect(formatPrestigeClassDetails(dragonlancePrestigeClasses.assassin)).toMatch(
      /Class spells \(independent casting\): Level 1:.*True Strike.*Level 4:.*Poison/,
    );
  });

  it.each([
    ["assassin", "int", 6, 3, 3],
    ["blackguard", "wis", 10, 2, 1],
  ] as const)("tracks %s thresholds, slots and caster level separately from Wizard", (id, ability, die, first, fourth) => {
    const character = hero("wizard", 5);
    character.alignment = "Neutral Evil";
    character.abilities[ability] = 11;
    const proposed = beginPrestigeLevelUp(character, id).proposed;
    expect(dragonlancePrestigeClasses[id].hitDie).toBe(die);
    expect(getSpellcastingClassLevels(proposed)).toEqual([{ classId: "wizard", level: 5 }, { classId: id, level: 1 }]);
    expect(getPrestigeSpellcastingClassOptions(character, id)).toEqual([]);
    expect(getCasterLevel("wizard", 5, proposed)).toBe(5);
    expect(getCasterLevel(id, 1, proposed)).toBe(1);
    expect(hasSpellLevelAtClassLevel(id, 1, 0)).toBe(false);
    expect(hasSpellLevelAtClassLevel(id, 1, 1)).toBe(true);
    expect(hasSpellLevelAtClassLevel(id, 1, 2)).toBe(false);
    expect(getDailySpellSlots(proposed, id, 1, 1)).toBe(0);
    proposed.abilities[ability] = 12;
    expect(getDailySpellSlots(proposed, id, 1, 1)).toBe(1);
    expect(getSpellSaveDC(proposed, id, 1)).toBe(12);
    for (const [spellLevel, classLevel] of [[1, 1], [2, 3], [3, 5], [4, 7]]) {
      expect(hasSpellLevelAtClassLevel(id, classLevel - 1, spellLevel)).toBe(false);
      expect(hasSpellLevelAtClassLevel(id, classLevel, spellLevel)).toBe(true);
      expect(baseSpellSlots(id, classLevel, spellLevel)).toBe(0);
      proposed.abilities[ability] = 9 + 2 * spellLevel;
      expect(getDailySpellSlots(proposed, id, classLevel, spellLevel)).toBe(0);
      proposed.abilities[ability] += 1;
      expect(getDailySpellSlots(proposed, id, classLevel, spellLevel)).toBe(1);
    }
    expect(baseSpellSlots(id, 10, 1)).toBe(first);
    expect(baseSpellSlots(id, 10, 4)).toBe(fourth);
  });

  it("uses the complete independent spell lists at their prestige levels", () => {
    const assassin = getClassSpells("assassin");
    const blackguard = getClassSpells("blackguard");
    expect([1, 2, 3, 4].map((level) => assassin.filter((spell) => spell.level === level).length))
      .toEqual([8, 9, 6, 8]);
    expect([1, 2, 3, 4].map((level) => blackguard.filter((spell) => spell.level === level).length))
      .toEqual([7, 8, 6, 5]);
    expect(assassin).toContainEqual(expect.objectContaining({ name: "True Strike", level: 1 }));
    expect(assassin).not.toContainEqual(expect.objectContaining({ name: "Magic Missile" }));
    expect(blackguard).toContainEqual(expect.objectContaining({ name: "Protection from Energy", level: 3 }));
    expect(blackguard).toContainEqual(expect.objectContaining({ name: "Summon Monster IV", level: 4, description: expect.stringContaining("only evil creatures") }));
    expect(getClassSpells("cleric")).not.toContainEqual(expect.objectContaining({ name: "Corrupt Weapon" }));
  });

  it("requires Assassin learning at available levels and limits replacements to qualifying level-ups", () => {
    const character = hero("rogue", 6);
    character.abilities.int = 11;
    const first = beginPrestigeLevelUp(character, "assassin").proposed;
    expect(getKnownSpellLimit(first, "assassin", 1, 1)).toBe(0);
    expect(getLevelUpSpellWarnings(character, first)).toEqual([]);
    first.abilities.int = 12;
    expect(getKnownSpellLimit(first, "assassin", 1, 1)).toBe(2);
    first.knownSpellsByClass = { assassin: ["Sleep", "Magic Missile"] };
    expect(getLevelUpSpellWarnings(character, first)).toEqual(["Learn 1 additional 1st-level Assassin spell."]);
    first.knownSpellsByClass.assassin = ["Sleep", "Ghost Sound"];
    expect(getLevelUpSpellWarnings(character, first)).toEqual([]);
    first.classLevels[1].level = 5;
    expect(getKnownSpellLimit(first, "assassin", 5, 3)).toBe(0);
    first.abilities.int = 16;
    expect(getKnownSpellLimit(first, "assassin", 5, 3)).toBe(2);
    const sixth = beginPrestigeLevelUp(first, "assassin").proposed;
    expect(getKnownSpellReplacementLevelLimit(first, sixth, "assassin")).toBe(1);
    const seventh = beginPrestigeLevelUp(sixth, "assassin").proposed;
    expect(getKnownSpellReplacementLevelLimit(sixth, seventh, "assassin")).toBeUndefined();
    const eighth = beginPrestigeLevelUp(seventh, "assassin").proposed;
    expect(getKnownSpellReplacementLevelLimit(seventh, eighth, "assassin")).toBe(2);
  });

  it("checks Archmage's skill ranks and scoped feats before enabling advancement", () => {
    const character = hero("wizard", 13);
    character.skills = { "Knowledge (arcana)": 15, Spellcraft: 15 };
    character.featSelections = { "general-1": "skill-focus", "general-3": "spell-focus", "general-6": "spell-focus" };
    character.featSkillSelections = { "general-1": "Spellcraft" };
    character.featSpellSchoolSelections = { "general-3": "Abjuration", "general-6": "Evocation" };
    character.knownSpellsByClass = { wizard: ["Dismissal", "Cloudkill", "Cone of Cold", "Dominate Person", "Finger of Death"] };
    expect(requirements(character, "archmage")).toEqual([]);
    expect(getPrestigeClassEligibilityErrors(character, "archmage")).toEqual([]);
    character.skills.Spellcraft = 14;
    character.featSkillSelections["general-1"] = "Knowledge (arcana)";
    character.featSpellSchoolSelections["general-6"] = "Abjuration";
    expect(requirements(character, "archmage")).toEqual(expect.arrayContaining([
      "Spellcraft must have 15 ranks.",
      "Skill Focus (Spellcraft) is required.",
      "Spell Focus in 2 distinct schools is required.",
    ]));
  });

  it("counts distinct schools of known high-level arcane spells and requires actual 7th-level access", () => {
    const character = hero("wizard", 13);
    const repertoire = ["Dismissal", "Cloudkill", "Cone of Cold", "Dominate Person", "Finger of Death"];
    const castError = "Ability to cast a known level 7 arcane spell is required.";
    const schoolsError = "Know arcane spells of level 5 or higher from at least 5 schools.";
    character.classLevels.push({ classId: "cleric", level: 13 });
    character.knownSpellsByClass = {
      wizard: [...repertoire.slice(0, -1), "Feeblemind", "Limited Wish", "Flame Strike"],
      cleric: ["Destruction"],
    };
    expect(requirements(character, "archmage")).toContain(schoolsError);
    expect(requirements(character, "archmage")).not.toContain(castError);
    character.knownSpellsByClass.wizard = repertoire;
    character.abilities.int = 16;
    expect(requirements(character, "archmage")).toContain(castError);
    character.abilities.int = 18;
    character.wizardBarredSchools = ["Necromancy", "Illusion"];
    expect(requirements(character, "archmage")).toEqual(expect.arrayContaining([castError, schoolsError]));
  });

  it("requires an elf archer's bow-specific focus and arcane spell access, not an invented class restriction", () => {
    const character = hero("bard", 8);
    character.race = "Elf";
    character.feats = ["Point Blank Shot", "Precise Shot"];
    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": "Longbow" };
    expect(requirements(character, "arcane-archer")).toEqual([]);
    character.featWeaponSelections["general-1"] = "Longsword";
    expect(requirements(character, "arcane-archer")).toContain("Weapon Focus in Longbow or Shortbow is required.");
    character.featWeaponSelections["general-1"] = "Shortbow";
    character.race = "Human";
    expect(requirements(character, "arcane-archer").some((error) => error.startsWith("Race must"))).toBe(true);
    character.race = "Half-Elf";
    character.classLevels = [{ classId: "fighter", level: 6 }];
    expect(requirements(character, "arcane-archer")).toContain("Ability to cast arcane spells of level 1 is required.");
  });

  it("checks all Arcane Trickster entry skills, nonlawful alignment, spells and sneak attack", () => {
    const character = hero("wizard", 5);
    character.classLevels.push({ classId: "rogue", level: 3 });
    character.skills = { "Decipher Script": 7, "Disable Device": 7, "Escape Artist": 7, "Knowledge (arcana)": 4 };
    character.knownSpellsByClass = { wizard: ["Mage Hand"] };
    expect(requirements(character, "arcane-trickster")).toEqual([]);
    character.classLevels[1].level = 2;
    expect(requirements(character, "arcane-trickster")).toContain("Sneak attack +2d6 is required.");
    character.classLevels[1].level = 3;
    character.alignment = "Lawful Good";
    expect(requirements(character, "arcane-trickster")).toContain("Alignment must be Any nonlawful.");
    character.alignment = "Chaotic Neutral";
    character.skills["Disable Device"] = 6;
    expect(requirements(character, "arcane-trickster")).toContain("Disable Device must have 7 ranks.");
  });

  it("does not require Rogue levels or Dexterity for Assassin, and surfaces its manual condition", () => {
    const character = hero("fighter", 5);
    character.alignment = "Lawful Evil";
    character.skills = { Disguise: 4, Hide: 8, "Move Silently": 8 };
    expect(requirements(character, "assassin")).toEqual([]);
    expect(requirements(character, "assassin", false)[0]).toMatch(/^Confirm this special prerequisite:/);
    character.skills.Hide = 7;
    expect(requirements(character, "assassin")).toContain("Hide must have 8 ranks.");
    character.alignment = "Lawful Neutral";
    expect(requirements(character, "assassin")).toContain("Alignment must be Any evil.");
  });

  it("accepts a Bard Dragon Disciple, checks Draconic/spontaneous casting, and keeps creature type manual", () => {
    const character = hero("bard", 5);
    character.skills = { "Knowledge (arcana)": 8 };
    character.languages.push("Draconic");
    expect(requirements(character, "dragon-disciple")).toEqual([]);
    expect(requirements(character, "dragon-disciple", false)[0]).toContain("neither a dragon nor a half-dragon");
    character.languages = ["Common"];
    character.skills["Speak Language"] = 1;
    character.speakLanguages = ["Draconic"];
    expect(requirements(character, "dragon-disciple")).toEqual([]);
    character.speakLanguages = [];
    expect(requirements(character, "dragon-disciple")).toContain("Draconic language is required.");
    character.classLevels = [{ classId: "wizard", level: 5 }];
    expect(requirements(character, "dragon-disciple")).toContain("Ability to cast arcane spells without preparation is required.");
  });

  it("uses Duelist's actual feats and skill ranks without a Combat Expertise requirement", () => {
    const character = hero("ranger", 6);
    character.feats = ["Dodge", "Mobility", "Weapon Finesse"];
    character.skills = { "Perform (dance)": 3, Tumble: 5 };
    expect(requirements(character, "duelist")).toEqual([]);
    character.feats = ["Dodge", "Combat Expertise", "Weapon Finesse"];
    expect(requirements(character, "duelist")).toContain("Mobility is required.");
    character.skills.Tumble = 4;
    expect(requirements(character, "duelist")).toContain("Tumble must have 5 ranks.");
  });

  it("checks Dwarven Defender's lawful alignment and all three feats, not invented Constitution", () => {
    const character = hero("fighter", 7);
    character.race = "Dwarf";
    character.alignment = "Lawful Neutral";
    character.feats = ["Dodge", "Endurance", "Toughness"];
    expect(requirements(character, "dwarven-defender")).toEqual([]);
    character.feats = ["Dodge", "Endurance"];
    expect(requirements(character, "dwarven-defender")).toContain("Toughness is required.");
    character.alignment = "Neutral Good";
    expect(requirements(character, "dwarven-defender")).toContain("Alignment must be Any lawful.");
  });

  it("requires all martial weapons and 3rd-level arcane spells for Eldritch Knight", () => {
    const character = hero("wizard", 5);
    character.classLevels.push({ classId: "fighter", level: 1 });
    expect(requirements(character, "eldritch-knight")).toEqual([]);
    character.classLevels.pop();
    character.featSelections = { "general-1": "martial-weapon-proficiency" };
    character.featWeaponSelections = { "general-1": "Longsword" };
    character.prestigeClass = "eldritch-knight";
    expect(requirements(character, "eldritch-knight")).toContain("Proficiency with all martial weapons is required.");
    character.hasAllMartialWeaponProficiencies = true;
    character.classLevels[0].level = 4;
    expect(requirements(character, "eldritch-knight")).toContain("Ability to cast arcane spells of level 3 is required.");
  });

  it("requires religion 15, metamagic and 7th-level divine spells for Hierophant", () => {
    const character = hero("cleric", 13);
    character.skills = { "Knowledge (religion)": 15 };
    character.feats = ["Empower Spell"];
    expect(requirements(character, "hierophant")).toEqual([]);
    character.classLevels[0].level = 12;
    expect(requirements(character, "hierophant")).toContain("Ability to cast divine spells of level 7 is required.");
    character.feats = ["Craft Wand"];
    expect(requirements(character, "hierophant")).toContain("Choose 1 distinct feats from the required categories.");
  });

  it("does not invent BAB or base-class restrictions for Horizon Walker", () => {
    const character = hero("wizard", 5);
    character.skills = { "Knowledge (geography)": 8 };
    character.feats = ["Endurance"];
    expect(requirements(character, "horizon-walker")).toEqual([]);
    character.skills["Knowledge (geography)"] = 7;
    expect(requirements(character, "horizon-walker")).toContain("Knowledge (geography) must have 8 ranks.");
  });

  it("checks Loremaster's two Knowledge skills, scoped Skill Focus, category count and spell repertoire", () => {
    const character = hero("wizard", 7);
    character.skills = { "Knowledge (arcana)": 10, "Knowledge (religion)": 10 };
    character.featSelections = { "general-1": "skill-focus", "general-3": "empower-spell", "general-6": "craft-wand" };
    character.featSkillSelections = { "general-1": "Knowledge (arcana)" };
    const divinations = getClassSpells("wizard").filter((spell) => spell.school.startsWith("Divination") && spell.level <= 4);
    const thirdLevelSpell = divinations.find((spell) => spell.level >= 3);
    if (!thirdLevelSpell) throw new Error("Missing high-level divination.");
    character.knownSpellsByClass = {
      wizard: [thirdLevelSpell.name, ...divinations.filter((spell) => spell.name !== thirdLevelSpell.name).slice(0, 6).map((spell) => spell.name)],
    };
    expect(character.knownSpellsByClass.wizard).toHaveLength(7);
    expect(requirements(character, "loremaster")).toEqual([]);
    const qualifiedSpells = [...character.knownSpellsByClass.wizard ?? []];
    character.knownSpellsByClass.wizard = divinations
      .filter((spell) => spell.level < 3).slice(0, 7).map((spell) => spell.name);
    expect(character.knownSpellsByClass.wizard).toHaveLength(7);
    expect(requirements(character, "loremaster")).toContain("Ability to cast 7 different Divination spells, including one of level 3 or higher, is required.");
    character.knownSpellsByClass.wizard = qualifiedSpells;
    character.knownSpellsByClass.wizard?.pop();
    expect(requirements(character, "loremaster")).toContain("Ability to cast 7 different Divination spells, including one of level 3 or higher, is required.");
    character.featSkillSelections["general-1"] = "Spellcraft";
    expect(requirements(character, "loremaster")).toContain("Skill Focus in a Knowledge skill is required.");
    character.skills["Knowledge (religion)"] = 9;
    expect(requirements(character, "loremaster").some((error) => error.startsWith("At least 2 distinct"))).toBe(true);
  });

  it("requires both spellcasting traditions and both skills for Mystic Theurge", () => {
    const character = hero("wizard", 3);
    character.classLevels.push({ classId: "cleric", level: 3 });
    character.skills = { "Knowledge (arcana)": 6, "Knowledge (religion)": 6 };
    expect(requirements(character, "mystic-theurge")).toEqual([]);
    for (const index of [0, 1]) {
      character.classLevels[index].level = 2;
      expect(requirements(character, "mystic-theurge")).toContain(`Ability to cast ${index === 0 ? "arcane" : "divine"} spells of level 2 is required.`);
      character.classLevels[index].level = 3;
    }
    character.skills["Knowledge (religion)"] = 5;
    expect(requirements(character, "mystic-theurge")).toContain("Knowledge (religion) must have 6 ranks.");
  });

  it("requires dance specifically for Shadowdancer, not arbitrary Perform ranks", () => {
    const character = hero("fighter", 7);
    character.feats = ["Combat Reflexes", "Dodge", "Mobility"];
    character.skills = { Hide: 10, "Move Silently": 8, "Perform (dance)": 5 };
    expect(requirements(character, "shadowdancer")).toEqual([]);
    character.skills["Perform (dance)"] = 4;
    character.skills["Perform (sing)"] = 10;
    expect(requirements(character, "shadowdancer")).toContain("Perform (dance) must have 5 ranks.");
  });

  it("requires Conjuration Spell Focus and actual Lesser Planar Ally casting for Thaumaturgist", () => {
    const character = hero("cleric", 7);
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Conjuration" };
    expect(requirements(character, "thaumaturgist")).toEqual([]);
    character.featSpellSchoolSelections["general-1"] = "Evocation";
    expect(requirements(character, "thaumaturgist")).toContain("Spell Focus (Conjuration) is required.");
    character.classLevels[0].level = 6;
    character.knownSpellsByClass = { cleric: ["Lesser Planar Ally"] };
    expect(requirements(character, "thaumaturgist")).toContain("Ability to cast Lesser Planar Ally is required.");
  });

  it("enables every DMG prestige class progression", () => {
    const entries = Object.values(dragonlancePrestigeClasses).filter(({ source, levelUpEnabled }) =>
      source === "core-35-srd" && !levelUpEnabled,
    );
    expect(entries).toEqual([]);
    expect(Object.values(dragonlancePrestigeClasses).filter(({ source }) => source === "core-35-srd"))
      .toHaveLength(16);
    expect(formatPrestigeClassDetails(dragonlancePrestigeClasses.loremaster)).toContain("7 different Divination spells");
  });

  it("attributes and certifies the full DMG prestige roster", () => {
    const names = Object.values(dragonlancePrestigeClasses)
      .filter((definition) => definition.sourceBook === "Dungeon Master's Guide (3.5)")
      .map((definition) => definition.name)
      .sort();
    expect(names).toEqual([
      "Arcane Archer", "Arcane Trickster", "Archmage", "Assassin",
      "Blackguard", "Dragon Disciple", "Duelist", "Dwarven Defender",
      "Eldritch Knight", "Hierophant", "Horizon Walker", "Loremaster",
      "Mystic Theurge", "Red Wizard", "Shadowdancer", "Thaumaturgist",
    ]);
  });

  describe("playable DMG prestige advancement", () => {
    it("preserves both Mystic Theurge advancements when either casting target changes", () => {
      const character = hero("wizard", 3);
      character.classLevels.push({ classId: "cleric", level: 3 }, { classId: "druid", level: 1 });
      character.skills = { "Knowledge (arcana)": 6, "Knowledge (religion)": 6 };
      expect(getPrestigeClassEligibilityErrors(character, "mystic-theurge")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "mystic-theurge", "wizard", "cleric").proposed;
      first.hitPointRolls = [{
        classId: "wizard", divineSpellcastingClassId: "cleric", prestigeClassId: "mystic-theurge",
        classLevel: 1, characterLevel: 8, hitDie: 4, roll: 3, hpIncrease: 3,
      }];
      const second = beginPrestigeLevelUp(first, "mystic-theurge", "wizard", "druid").proposed;
      const restored = parseCharacter(JSON.parse(JSON.stringify(second)));
      expect(getEffectiveSpellcastingClassLevel(restored, "wizard")).toBe(5);
      expect(getEffectiveSpellcastingClassLevel(restored, "cleric")).toBe(4);
      expect(getEffectiveSpellcastingClassLevel(restored, "druid")).toBe(2);
    });

    it("requires a new legal Horizon Walker terrain at each level and preserves prior choices", () => {
      let character = hero("ranger", 5);
      character.skills = { "Knowledge (geography)": 8 };
      expect(getPrestigeClassEligibilityErrors(character, "horizon-walker")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "horizon-walker");
      const terrainError = "Choose one new terrain mastery. Planar choices unlock at Horizon Walker level 6.";
      expect(validateLevelUp(first)).toContain(terrainError);
      first.proposed.horizonWalkerTerrainMasteries = ["Cold"];
      expect(validateLevelUp(first)).toContain(terrainError);
      for (const terrain of ["Aquatic", "Desert", "Forest", "Hills", "Marsh"] as const) {
        const draft = beginPrestigeLevelUp(character, "horizon-walker");
        draft.proposed.horizonWalkerTerrainMasteries = [...(character.horizonWalkerTerrainMasteries ?? []), terrain];
        expect(validateLevelUp(draft)).not.toContain(terrainError);
        character = draft.proposed;
      }
      const sixth = beginPrestigeLevelUp(character, "horizon-walker");
      const prior = character.horizonWalkerTerrainMasteries ?? [];
      sixth.proposed.horizonWalkerTerrainMasteries = [...prior, "Aquatic"];
      expect(validateLevelUp(sixth)).toContain(terrainError);
      expect(() => parseCharacter(sixth.proposed)).toThrow(/terrain history/);
      sixth.proposed.horizonWalkerTerrainMasteries = ["Plains", ...prior.slice(1), "Cold"];
      expect(validateLevelUp(sixth)).toContain(terrainError);
      sixth.proposed.horizonWalkerTerrainMasteries = [...prior, "Mountains"];
      expect(validateLevelUp(sixth)).not.toContain(terrainError);
      sixth.proposed.horizonWalkerTerrainMasteries = [...prior, "Cold"];
      expect(validateLevelUp(sixth)).not.toContain(terrainError);
      const restored = parseCharacter(JSON.parse(JSON.stringify(sixth.proposed)));
      expect(getClassFeatureDisplay(restored)).toContainEqual({
        source: "Horizon Walker 6", ability: "Terrain Mastery: Cold", isPrestigeClass: true,
      });
    });

    it("adds Shadowdancer's narrow proficiencies and retains Dexterity to flat-footed AC at level two", () => {
      const character = hero("wizard", 17);
      character.abilities.dex = 16;
      character.skills = { Hide: 10, "Move Silently": 8, "Perform (dance)": 5 };
      character.feats = ["Combat Reflexes", "Dodge", "Mobility"];
      expect(getPrestigeClassEligibilityErrors(character, "shadowdancer")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "shadowdancer");
      expect(validateLevelUp(first)).toEqual([]);
      expect(getArmorShieldProficiencies(first.proposed)).toContain("armor-proficiency-light");
      expect(getArmorShieldProficiencies(first.proposed)).not.toContain("shield-proficiency");
      const rapier = findStoreItem("Rapier");
      const kukri = findStoreItem("Kukri");
      if (!rapier || !kukri) throw new Error("Missing proficiency test weapons.");
      expect(isWeaponProficient(character, rapier)).toBe(false);
      expect(isWeaponProficient(first.proposed, rapier)).toBe(true);
      expect(isWeaponProficient(first.proposed, kukri)).toBe(false);
      const second = beginPrestigeLevelUp(first.proposed, "shadowdancer").proposed;
      expect(getEffectiveSpellcastingClassLevel(second, "wizard")).toBe(17);
      expect(getArmorClassValues(second).flatFooted).toBe(getArmorClassValues(first.proposed).flatFooted + 3);
      expect(getClassFeatureDisplay(second)).toContainEqual({
        source: "Shadowdancer 2", ability: "Evasion", isPrestigeClass: true,
      });
    });

    it("advances Thaumaturgist casting and grants Augment Summoning without a selectable slot", () => {
      const character = hero("cleric", 7);
      character.featSelections = { "general-1": "spell-focus" };
      character.featSpellSchoolSelections = { "general-1": "Conjuration" };
      expect(getPrestigeClassEligibilityErrors(character, "thaumaturgist")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "thaumaturgist", "cleric").proposed;
      expect(getEffectiveSpellcastingClassLevel(first, "cleric")).toBe(8);
      expect(getBaseSave(first, "will")).toBe(getBaseSave(character, "will") + 2);
      expect(getChosenFeats(first)).not.toContain("augment-summoning");
      const second = beginPrestigeLevelUp(first, "thaumaturgist", "cleric").proposed;
      expect(getChosenFeats(second)).toContain("augment-summoning");
      expect(getNewLevelUpFeatSlots(first, second).map(({ id }) => id)).toEqual(["general-9"]);
      second.featSelections["general-3"] = "augment-summoning";
      expect(getChosenFeats(second).filter((id) => id === "augment-summoning")).toHaveLength(1);
      const fifth = Array.from({ length: 3 }).reduce<Character>(
        (current) => beginPrestigeLevelUp(current, "thaumaturgist", "cleric").proposed, second,
      );
      expect(getEffectiveSpellcastingClassLevel(fifth, "cleric")).toBe(12);
      expect(getPrestigeClassEligibilityErrors(fifth, "thaumaturgist")).toEqual([
        "Thaumaturgist is already at its maximum level (5).",
      ]);
    });

    it("advances Arcane Trickster casting from level one without moving earlier advancement to a different caster", () => {
      const character = hero("wizard", 5);
      character.alignment = "Chaotic Neutral";
      character.classLevels.push({ classId: "rogue", level: 3 }, { classId: "cleric", level: 1 });
      character.skills = { "Decipher Script": 7, "Disable Device": 7, "Escape Artist": 7, "Knowledge (arcana)": 4 };
      character.knownSpellsByClass = { wizard: ["Mage Hand"] };
      expect(getPrestigeClassEligibilityErrors(character, "arcane-trickster")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "arcane-trickster", "wizard").proposed;
      expect(getEffectiveSpellcastingClassLevel(first, "wizard")).toBe(6);
      first.hitPointRolls = [
        { characterLevel: 9, classId: "cleric", classLevel: 1, hitDie: 8, roll: 3, hpIncrease: 3 },
        { characterLevel: 10, classId: "wizard", prestigeClassId: "arcane-trickster", classLevel: 1, hitDie: 4, roll: 3, hpIncrease: 3 },
        { characterLevel: 11, classId: "bard", classLevel: 1, hitDie: 6, roll: 3, hpIncrease: 3 },
      ];
      first.classLevels.push({ classId: "bard", level: 1 });
      expect(getPrestigeSpellcastingClassOptions(first, "arcane-trickster")).toEqual(["wizard", "cleric"]);
      const second = beginPrestigeLevelUp(first, "arcane-trickster", "cleric").proposed;
      expect(getEffectiveSpellcastingClassLevel(second, "wizard")).toBe(6);
      expect(getEffectiveSpellcastingClassLevel(second, "cleric")).toBe(2);
      expect(getClassFeatureDisplay(second)).toContainEqual({
        source: "Arcane Trickster 2", ability: "Sneak Attack +1d6", isPrestigeClass: true,
      });
    });

    it("gives Eldritch Knight a fighter-category feat at first level and advances casting only from second", () => {
      const character = hero("wizard", 5);
      character.classLevels.push({ classId: "fighter", level: 1 });
      expect(getPrestigeClassEligibilityErrors(character, "eldritch-knight")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "eldritch-knight", "wizard").proposed;
      expect(getEffectiveSpellcastingClassLevel(first, "wizard")).toBe(5);
      const slot = getNewLevelUpFeatSlots(character, first).find(({ id }) => id === "eldritch-knight-1");
      if (!slot) throw new Error("Missing Eldritch Knight bonus feat slot.");
      expect(featQualifies(first, feat("improved-initiative"), slot)).toBe(true);
      expect(featQualifies(first, feat("empower-spell"), slot)).toBe(false);
      expect(featQualifies(first, feat("weapon-specialization"), slot)).toBe(false);
      const second = beginPrestigeLevelUp(first, "eldritch-knight", "wizard").proposed;
      expect(getEffectiveSpellcastingClassLevel(second, "wizard")).toBe(6);
      expect(getNewLevelUpFeatSlots(first, second)).not.toContainEqual(expect.objectContaining({ id: slot.id }));
    });

    it("adds a real Arcane Archer level without advancing the qualifying arcane class", () => {
      const character = hero("bard", 8);
      character.race = "Elf";
      character.feats = ["Point Blank Shot", "Precise Shot"];
      character.featSelections = { "general-1": "weapon-focus" };
      character.featWeaponSelections = { "general-1": "Longbow" };
      expect(getPrestigeClassEligibilityErrors(character, "arcane-archer")).toEqual([]);
      const draft = beginPrestigeLevelUp(character, "arcane-archer");
      const { proposed } = draft;
      expect(validateLevelUp(draft)).toEqual([]);
      expect(getEffectiveSpellcastingClassLevel(proposed, "bard")).toBe(8);
      expect(getBaseAttackBonus(proposed)).toBe(getBaseAttackBonus(character) + 1);
      for (const [save, delta] of [["fortitude", 2], ["reflex", 2], ["will", 0]] as const)
        expect(getBaseSave(proposed, save)).toBe(getBaseSave(character, save) + delta);
      expect(getArmorShieldProficiencies(proposed)).toContain("armor-proficiency-medium");
      expect(getArmorShieldProficiencies(proposed)).not.toContain("armor-proficiency-heavy");
      expect(isClassSkill(proposed, "Use Rope", "arcane-archer")).toBe(true);
      expect(getClassFeatureDisplay(proposed)).toContainEqual({
        source: "Arcane Archer 1", ability: "Enhance Arrow +1", isPrestigeClass: true,
      });
    });

    it("adds Duelist initiative and gates Grace on armor and shield use", () => {
      const character = hero("fighter", 6);
      character.skills = { Tumble: 5, "Perform (dance)": 3 };
      character.feats = ["Dodge", "Mobility", "Weapon Finesse"];
      character.featSelections = { "general-6": "improved-initiative" };
      character.abilities.dex = 14;
      expect(getPrestigeClassEligibilityErrors(character, "duelist")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "duelist").proposed;
      expect(isClassSkill(first, "Perform (dance)", "duelist")).toBe(true);
      expect(isClassSkill(first, "Hide", "duelist")).toBe(false);
      const fourth = Array.from({ length: 3 }).reduce<Character>(
        (current) => beginPrestigeLevelUp(current, "duelist").proposed, first,
      );
      expect(getInitiativeModifier(fourth)).toBe(8);
      expect(getSavingThrow(fourth, "reflex").total).toBe(getBaseSave(fourth, "reflex") + 4);
      fourth.equipment = { ...fourth.equipment, Shield: "Buckler" };
      expect(getSavingThrow(fourth, "reflex").total).toBe(getBaseSave(fourth, "reflex") + 2);
    });

    it("scales Defender dodge AC, retains it flat-footed with Uncanny Dodge, and caps advancement", () => {
      const character = hero("fighter", 7);
      character.race = "Dwarf";
      character.alignment = "Lawful Neutral";
      character.feats = ["Dodge", "Endurance", "Toughness"];
      character.abilities.dex = 14;
      expect(getPrestigeClassEligibilityErrors(character, "dwarven-defender")).toEqual([]);
      const first = beginPrestigeLevelUp(character, "dwarven-defender").proposed;
      const baseline = getArmorClassValues(character);
      expect(getArmorClassValues(first).touch).toBe(baseline.touch + 1);
      expect(getArmorClassValues(first).flatFooted).toBe(baseline.flatFooted);
      const second = beginPrestigeLevelUp(first, "dwarven-defender").proposed;
      expect(getArmorClassValues(second).flatFooted).toBe(baseline.flatFooted + 3);
      const tenth = Array.from({ length: 8 }).reduce<Character>(
        (current) => beginPrestigeLevelUp(current, "dwarven-defender").proposed, second,
      );
      expect(getArmorClassValues(tenth).touch).toBe(baseline.touch + 4);
      expect(getPrestigeClassEligibilityErrors(tenth, "dwarven-defender")).toEqual([
        "Dwarven Defender is already at its maximum level (10).",
      ]);
    });
  });
});
