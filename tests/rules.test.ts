import { beforeAll, describe, expect, it } from "vitest";
import { abilityModifier, armorClass, beginLevelUp, beginPrestigeLevelUp, carryingCapacity, changeRace, cloneCharacter, raceDefinitions,
  hitPointGain, initialCharacter, levelUpHitPointGain, nextClassLevel, sizeModifier, validateLevelUp,
  getEffectiveCharacterLevel, getTotalHitDice, isValidHitDieRoll,
  type FeatDefinition, type RangerFavoredEnemyChoice } from "../src/domain";
import { baseSpellSlots, featQualifies, getBaseAttackBonus, getBaseSave,
  getDailySpellSlots, getEquipmentArmorClass, getEquippedWeaponStats,
  getLevelUpAlignmentWarnings, getLevelUpSpellWarnings,
  getAvailableBonusLanguages, getClassFeatureDisplay, getClassFeatureSkillSynergy,
  getDragonlanceRangerPatron, getDragonlanceRangerWarnings,
  getDragonlanceDruidWarnings,
  getRangerFavoredEnemyBonus, getRangerFavoredEnemyChoiceLevels,
  getRangerFavoredEnemyLabel, getRangerFavoredEnemyWarnings,
  getChosenFeats,
  getLanguageBonusSlots, getCharacterLanguages, getRacialLanguages,
  getAvailableSpeakLanguages, getSpeakLanguageRankCount, getSpeakLanguageWarnings,
  getHumanRegionalLanguages, getAutomaticLanguages,
  getAvailableFeats, getFeatSlots, getChronologicalFeatSlots, getLevelUpSkillWarnings, getRacialSkillBonus,
  getLevelUpSkillSourceId, getPrestigeClassEligibilityErrors, getSkillPointsPerLevel,
  getKnightOfCrownHeroicInitiativeBonus,
  getDwarfStabilityBonus, getRacialSkillContextOptions, getRacialSpellLikeAbilities, getSkillCheckModifier, getSkillTotalTooltip,
  getRaceDefinitionForCharacter,
  getMovement,
  getImprovedInitiativeBonus, getInitiativeModifier,
  getNewLevelUpFeatSlots, getSavingThrow, getSkillMaximum, getSpentSkillPoints,
  getAvailableSkillCount, getAvailableSkillCountForSource, getSpentSkillPointsForSource,
  isClassSkill, canIncreaseSkillRank,
  normalizeFeatSelections,
  getTwoWeaponAttackPenalty, alignmentDistance, isClericAlignmentAllowed,
  isClassAlignmentAllowed } from "../src/rules";
import { featCatalog } from "../src/data/characterCatalog";
import { classFeatureDescriptions } from "../src/data/classFeatureDescriptions";
import { getClassSpells, loadSpellCatalog, spells } from "../src/data/spellCatalog";
import { formatRaceDetails } from "../src/creationRules";
import { getConstitutionHitPointAdjustment, getEffectiveAbilityScore } from "../src/abilityEquipment";

beforeAll(loadSpellCatalog);

describe("Dragonlance feats", () => {
  it("includes the sourcebook's Chapter 2 feats with the correct source", () => {
    const dragonlanceFeats = featCatalog.filter(
      (feat) => feat.source === "dragonlance-user-pack",
    );
    expect(dragonlanceFeats.map((feat) => feat.id).sort()).toEqual([
      "cornered-rat",
      "draconian-breath-weapon",
      "flyby-breath",
      "honor-bound",
      "hulking-brute",
      "improved-draconian-breath-weapon",
      "improved-resist-dragonfear",
      "reserves-of-strength",
      "resist-dragonfear",
      "spear-of-doom",
      "spectacular-death-throes",
      "strafing-breath",
      "tremendous-charge",
    ]);
    expect(
      dragonlanceFeats.every(
        (feat) => feat.sourceBook === "Dragonlance Campaign Setting (3.5)",
      ),
    ).toBe(true);
  });

  it("enforces the Dragonlance feats' modeled race, save, and skill prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.race = "Gully Dwarf";
    character.classLevels = [{ classId: "fighter", level: 1 }];
    const corneredRat = featCatalog.find((feat) => feat.id === "cornered-rat");
    const slot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-1",
    );
    if (!corneredRat || !slot) throw new Error("Missing Dragonlance feat fixture.");

    expect(featQualifies(character, corneredRat, slot)).toBe(true);
    character.race = "Human";
    expect(featQualifies(character, corneredRat, slot)).toBe(false);

    character.race = "Baaz Draconian";
    character.classLevels = [{ classId: "fighter", level: 1 }];
    const draconianBreath = featCatalog.find(
      (feat) => feat.id === "draconian-breath-weapon",
    );
    const draconianSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!draconianBreath || !draconianSlot)
      throw new Error("Missing Draconian Breath Weapon fixture.");
    expect(featQualifies(character, draconianBreath, draconianSlot)).toBe(false);
    character.classLevels = [{ classId: "wizard", level: 1 }];
    expect(featQualifies(character, draconianBreath, draconianSlot)).toBe(true);

    const tremendousCharge = featCatalog.find(
      (feat) => feat.id === "tremendous-charge",
    );
    if (!tremendousCharge) throw new Error("Missing Tremendous Charge fixture.");
    character.race = "Human";
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.skills.Ride = 1;
    const thirdLevelSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!thirdLevelSlot) throw new Error("Missing third-level feat fixture.");
    expect(featQualifies(character, tremendousCharge, thirdLevelSlot)).toBe(false);
    character.featSelections = { "general-1": "mounted-combat" };
    expect(featQualifies(character, tremendousCharge, thirdLevelSlot)).toBe(true);
  });

  it("restricts Hulking Brute to a first-level feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.race = "Minotaur";
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const hulkingBrute = featCatalog.find((feat) => feat.id === "hulking-brute");
    const firstLevelSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-1",
    );
    const thirdLevelSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!hulkingBrute || !firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing Hulking Brute slot fixture.");

    expect(featQualifies(character, hulkingBrute, firstLevelSlot)).toBe(true);
    expect(featQualifies(character, hulkingBrute, thirdLevelSlot)).toBe(false);
    expect(
      getAvailableFeats(character, firstLevelSlot).map((feat) => feat.id),
    ).toContain("hulking-brute");
    expect(
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id),
    ).not.toContain("hulking-brute");
  });

  it("checks modeled draconian breath weapons for Flyby Breath feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.race = "Baaz Draconian";
    character.classLevels = [{ classId: "fighter", level: 9 }];
    character.featSelections = { "general-1": "flyby-attack" };
    const flybyBreath = featCatalog.find((feat) => feat.id === "flyby-breath");
    const strafingBreath = featCatalog.find((feat) => feat.id === "strafing-breath");
    const slots = getFeatSlots(character);
    const sixthLevelSlot = slots.find((slot) => slot.id === "general-6");
    const ninthLevelSlot = slots.find((slot) => slot.id === "general-9");
    if (!flybyBreath || !strafingBreath || !sixthLevelSlot || !ninthLevelSlot)
      throw new Error("Missing breath-feat prerequisite fixture.");

    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(false);
    expect(
      getAvailableFeats(character, sixthLevelSlot).map((feat) => feat.id),
    ).not.toContain("flyby-breath");
    character.featSelections["general-3"] = "draconian-breath-weapon";
    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(true);
    expect(
      getAvailableFeats(character, sixthLevelSlot).map((feat) => feat.id),
    ).toContain("flyby-breath");
    expect(featQualifies(character, strafingBreath, ninthLevelSlot)).toBe(false);
    character.featSelections["general-6"] = "flyby-breath";
    expect(featQualifies(character, strafingBreath, ninthLevelSlot)).toBe(true);

    character.race = "Human";
    character.featSelections = { "general-1": "flyby-attack" };
    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(true);
    expect(flybyBreath.description).toContain("verify fly speed");
    expect(strafingBreath.description).toContain("resolve the area calculation manually");
  });

  it("does not count prerequisite feats from later character levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Human";
    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.featSelections = {
      "general-1": "spell-penetration",
      "human-1": "greater-spell-penetration",
    };
    const slots = getChronologicalFeatSlots(character);
    const firstLevelSlot = slots.find((slot) => slot.id === "general-1");
    const humanBonusSlot = slots.find((slot) => slot.id === "human-1");
    const thirdLevelSlot = slots.find((slot) => slot.id === "general-3");
    if (!firstLevelSlot || !humanBonusSlot || !thirdLevelSlot)
      throw new Error("Missing chronological feat prerequisite fixture.");

    expect(slots.slice(0, 3).map((slot) => slot.id)).toEqual([
      "general-1",
      "human-1",
      "general-3",
    ]);
    expect(
      getAvailableFeats(character, humanBonusSlot, "human-1").map((feat) => feat.id),
    ).toContain("greater-spell-penetration");
    expect(
      normalizeFeatSelections(character, character.featSelections),
    ).toEqual({
      "general-1": "spell-penetration",
      "human-1": "greater-spell-penetration",
    });

    const laterPrerequisite = {
      ...character,
      featSelections: {
        "general-1": "greater-spell-penetration",
        "general-3": "spell-penetration",
      },
    };
    expect(
      getAvailableFeats(laterPrerequisite, firstLevelSlot, "general-1").map(
        (feat) => feat.id,
      ),
    ).not.toContain("greater-spell-penetration");
    expect(
      normalizeFeatSelections(laterPrerequisite, laterPrerequisite.featSelections),
    ).toEqual({ "general-3": "spell-penetration" });

    const earlierPrerequisite = {
      ...character,
      featSelections: { "general-1": "spell-penetration" },
    };
    const greaterSpellPenetration = featCatalog.find(
      (feat) => feat.id === "greater-spell-penetration",
    );
    if (!greaterSpellPenetration)
      throw new Error("Missing Greater Spell Penetration fixture.");
    expect(
      featQualifies(
        earlierPrerequisite,
        greaterSpellPenetration,
        thirdLevelSlot,
        "general-3",
      ),
    ).toBe(true);
    expect(
      getAvailableFeats(earlierPrerequisite, thirdLevelSlot, "general-3").map(
        (feat) => feat.id,
      ),
    ).toContain("greater-spell-penetration");
    expect(
      normalizeFeatSelections(earlierPrerequisite, {
        ...earlierPrerequisite.featSelections,
        "general-3": "greater-spell-penetration",
      }),
    ).toEqual({
      "general-1": "spell-penetration",
      "general-3": "greater-spell-penetration",
    });
  });

  it("does not use a later same-level slot to satisfy a feat prerequisite", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Human";
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.featSelections = {
      "general-1": "greater-spell-penetration",
      "human-1": "spell-penetration",
    };
    const generalSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    if (!generalSlot) throw new Error("Missing first-level feat fixture.");

    expect(
      getAvailableFeats(character, generalSlot, "general-1").map((feat) => feat.id),
    ).not.toContain("greater-spell-penetration");
    expect(
      normalizeFeatSelections(character, character.featSelections),
    ).toEqual({ "human-1": "spell-penetration" });
  });

  it("orders class bonus feats by the character level they were gained", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.int = 13;
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.hitPointRolls = Array.from({ length: 4 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    character.featSelections = {
      "fighter-4": "combat-expertise",
      "general-3": "improved-trip",
    };
    const generalSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!generalSlot) throw new Error("Missing third-level feat fixture.");

    expect(
      getAvailableFeats(character, generalSlot, "general-3").map((feat) => feat.id),
    ).not.toContain("improved-trip");
    expect(
      normalizeFeatSelections(character, character.featSelections),
    ).toEqual({ "fighter-4": "combat-expertise" });

    character.classLevels = [
      { classId: "fighter", level: 2 },
      { classId: "wizard", level: 1 },
    ];
    character.hitPointRolls = [
      ...character.hitPointRolls.slice(0, 2),
      {
        characterLevel: 3,
        classId: "wizard",
        classLevel: 1,
        hitDie: 4,
        roll: 4,
        hpIncrease: 4,
      },
    ];
    character.featSelections = {
      "fighter-2": "combat-expertise",
      "general-3": "improved-trip",
    };
    const earlierGeneralSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!earlierGeneralSlot)
      throw new Error("Missing third-level feat fixture.");
    expect(
      getAvailableFeats(character, earlierGeneralSlot, "general-3").map(
        (feat) => feat.id,
      ),
    ).toContain("improved-trip");
  });

  it("does not apply later ability increases to earlier feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.int = 13;
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.abilityScoreIncreasesByLevel = { 4: "int" };
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing chronological ability prerequisite fixtures.");

    expect(
      getAvailableFeats(character, thirdLevelSlot, "general-3").map(
        (feat) => feat.id,
      ),
    ).not.toContain("combat-expertise");
    expect(
      getAvailableFeats(character, sixthLevelSlot, "general-6").map(
        (feat) => feat.id,
      ),
    ).toContain("combat-expertise");
  });

  it("does not apply later skill ranks to earlier feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.skills.Ride = 1;
    character.featSelections = { "general-1": "mounted-combat" };
    character.skillRanksByLevel = {
      1: { Ride: 0 },
      2: { Ride: 0 },
      3: { Ride: 0 },
      4: { Ride: 1 },
      5: { Ride: 1 },
    };
    const tremendousCharge = featCatalog.find(
      (feat) => feat.id === "tremendous-charge",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!tremendousCharge || !thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing historical skill prerequisite fixtures.");

    expect(
      featQualifies(character, tremendousCharge, thirdLevelSlot, "general-3"),
    ).toBe(false);
    expect(
      featQualifies(character, tremendousCharge, sixthLevelSlot, "general-6"),
    ).toBe(true);
  });

  it("does not use class features gained after an earlier feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "barbarian", level: 3 }];
    character.hitPointRolls = Array.from({ length: 3 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "barbarian" as const,
      classLevel: index + 1,
      hitDie: 12 as const,
      roll: 6,
      hpIncrease: 6,
    }));
    const uncannyDodgeFeat = {
      id: "uncanny-dodge-prerequisite-test",
      name: "Uncanny Dodge Prerequisite Test",
      source: "core-35-srd",
      description: "",
      prerequisites: { classFeatures: ["Uncanny Dodge"] },
    } satisfies FeatDefinition;
    const firstLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing historical class-feature prerequisite fixtures.");

    expect(featQualifies(character, uncannyDodgeFeat, firstLevelSlot)).toBe(
      false,
    );
    expect(featQualifies(character, uncannyDodgeFeat, thirdLevelSlot)).toBe(
      true,
    );
  });

  it("uses class levels available at the feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.hitPointRolls = Array.from({ length: 4 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    character.featSelections = { "general-1": "weapon-focus" };
    const weaponSpecialization = featCatalog.find(
      (feat) => feat.id === "weapon-specialization",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const fourthLevelFighterSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "fighter-4",
    );
    if (!weaponSpecialization || !thirdLevelSlot || !fourthLevelFighterSlot)
      throw new Error("Missing historical class-level prerequisite fixtures.");

    expect(
      featQualifies(character, weaponSpecialization, thirdLevelSlot),
    ).toBe(false);
    expect(
      featQualifies(character, weaponSpecialization, fourthLevelFighterSlot),
    ).toBe(true    );
  });

  it("tracks class levels in their multiclass order", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "fighter", level: 2 },
      { classId: "wizard", level: 2 },
    ];
    character.hitPointRolls = [
      {
        characterLevel: 1,
        classId: "fighter",
        classLevel: 1,
        hitDie: 10,
        roll: 5,
        hpIncrease: 5,
      },
      {
        characterLevel: 2,
        classId: "wizard",
        classLevel: 1,
        hitDie: 4,
        roll: 2,
        hpIncrease: 2,
      },
      {
        characterLevel: 3,
        classId: "fighter",
        classLevel: 2,
        hitDie: 10,
        roll: 5,
        hpIncrease: 5,
      },
      {
        characterLevel: 4,
        classId: "wizard",
        classLevel: 2,
        hitDie: 4,
        roll: 2,
        hpIncrease: 2,
      },
    ];
    const fighterLevelFeat = {
      id: "historical-multiclass-prerequisite-test",
      name: "Historical Multiclass Prerequisite Test",
      source: "core-35-srd",
      description: "",
      prerequisites: { classLevels: { fighter: 2 } },
    } satisfies FeatDefinition;
    const firstLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing historical multiclass prerequisite fixtures.");

    expect(featQualifies(character, fighterLevelFeat, firstLevelSlot)).toBe(
      false,
    );
    expect(featQualifies(character, fighterLevelFeat, thirdLevelSlot)).toBe(
      true,
    );
  });

  it("uses base saves available at the feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.hitPointRolls = Array.from({ length: 6 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    const fortitudeFeat = {
      id: "historical-fortitude-prerequisite-test",
      name: "Historical Fortitude Prerequisite Test",
      source: "core-35-srd",
      description: "",
      prerequisites: { baseSaves: { fortitude: 4 } },
    } satisfies FeatDefinition;
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing historical save prerequisite fixtures.");

    expect(featQualifies(character, fortitudeFeat, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, fortitudeFeat, sixthLevelSlot)).toBe(true);
  });

  it("uses caster level and spell access available at the feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 9 }];
    character.abilities.int = 13;
    character.abilityScoreIncreasesByLevel = { 8: "int" };
    character.hitPointRolls = Array.from({ length: 9 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "wizard" as const,
      classLevel: index + 1,
      hitDie: 4 as const,
      roll: 2,
      hpIncrease: 2,
    }));
    const craftWand = featCatalog.find((feat) => feat.id === "craft-wand");
    const empowerSpell = featCatalog.find((feat) => feat.id === "empower-spell");
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const ninthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-9",
    );
    if (
      !craftWand ||
      !empowerSpell ||
      !thirdLevelSlot ||
      !sixthLevelSlot ||
      !ninthLevelSlot
    )
      throw new Error("Missing historical spell prerequisite fixtures.");

    expect(featQualifies(character, craftWand, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, craftWand, sixthLevelSlot)).toBe(true);
    expect(featQualifies(character, empowerSpell, sixthLevelSlot)).toBe(false);
    expect(featQualifies(character, empowerSpell, ninthLevelSlot)).toBe(true);
  });

  it("counts prestige spellcasting advancement only after that prestige level", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.abilities.int = 16;
    character.classLevels = [
      { classId: "wizard", level: 4 },
      { classId: "fighter", level: 1 },
      {
        classId: "wizard",
        prestigeClassId: "wizard-of-high-sorcery",
        level: 1,
      },
    ];
    character.hitPointRolls = [
      ...Array.from({ length: 4 }, (_, index) => ({
        characterLevel: index + 1,
        classId: "wizard" as const,
        classLevel: index + 1,
        hitDie: 4 as const,
        roll: 2,
        hpIncrease: 2,
      })),
      {
        characterLevel: 5,
        classId: "fighter",
        classLevel: 1,
        hitDie: 10,
        roll: 5,
        hpIncrease: 5,
      },
      {
        characterLevel: 6,
        classId: "wizard",
        prestigeClassId: "wizard-of-high-sorcery",
        classLevel: 1,
        hitDie: 4,
        roll: 2,
        hpIncrease: 2,
      },
    ];
    const thirdLevelArcaneFeat = {
      id: "historical-prestige-spell-access-test",
      name: "Historical Prestige Spell Access Test",
      source: "core-35-srd",
      description: "",
      prerequisites: { arcaneSpellLevel: 3 },
    } satisfies FeatDefinition;
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing prestige spell-access prerequisite fixtures.");

    expect(
      featQualifies(character, thirdLevelArcaneFeat, thirdLevelSlot),
    ).toBe(false);
    expect(
      featQualifies(character, thirdLevelArcaneFeat, sixthLevelSlot),
    ).toBe(true);
  });

  it("does not apply class levels before racial Hit Dice history records them", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.race = "Baaz Draconian";
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.hitPointRolls = [
      {
        characterLevel: 3,
        classId: "wizard",
        classLevel: 1,
        hitDie: 4,
        roll: 2,
        hpIncrease: 2,
      },
    ];
    const scribeScroll = featCatalog.find((feat) => feat.id === "scribe-scroll");
    const firstLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!scribeScroll || !firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing racial Hit Dice prerequisite fixtures.");

    expect(featQualifies(character, scribeScroll, firstLevelSlot)).toBe(false);
    expect(featQualifies(character, scribeScroll, thirdLevelSlot)).toBe(true);
  });

  it("does not use unrecorded later class levels for an earlier feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 5 }];
    const craftWand = featCatalog.find((feat) => feat.id === "craft-wand");
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!craftWand || !thirdLevelSlot)
      throw new Error("Missing incomplete-history prerequisite fixtures.");

    expect(featQualifies(character, craftWand, thirdLevelSlot)).toBe(false);
  });

  it("makes Resist Dragonfear available at its base attack bonus prerequisite", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.baseAttackBonusByLevel = { 1: 1, 2: 2, 3: 3, 4: 4 };
    const firstLevelSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-1",
    );
    const thirdLevelSlot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing chronological base attack prerequisite fixtures.");

    expect(
      getAvailableFeats(character, firstLevelSlot).map((feat) => feat.id),
    ).not.toContain("resist-dragonfear");
    expect(
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id),
    ).toContain("resist-dragonfear");
  });
});

describe("character rules preserved from 2.0", () => {
  it("uses the Dragonlance Mystic's sourcebook skill-point rate", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Human";
    character.abilities.int = 14;

    expect(getSkillPointsPerLevel(character, "mystic")).toBe(5);
  });

  it("allows Noble entry only at 1st character level, but permits advancing an existing Noble", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 1 }];
    expect(() => beginLevelUp(fighter, "noble")).toThrow(
      "The Noble class can only be taken at 1st character level.",
    );

    const noble = cloneCharacter(initialCharacter);
    noble.classLevels = [{ classId: "noble", level: 1 }];
    const draft = beginLevelUp(noble, "noble");
    expect(validateLevelUp(draft)).toEqual([]);
  });

  it("uses D&D ability modifiers and a minimum one hit point gain", () => {
    expect([7, 8, 9, 10, 11, 12, 18].map(abilityModifier)).toEqual([-2, -1, -1, 0, 0, 1, 4]);
    const character = cloneCharacter(initialCharacter);
    character.abilities.con = 3;
    expect(hitPointGain(character, 1)).toBe(1);
  });

  it("accepts only whole-number Hit Die results within the die range", () => {
    expect([1, 4].every((roll) => isValidHitDieRoll(roll, 4))).toBe(true);
    expect([0, 5, 1.5, Number.NaN].some((roll) => isValidHitDieRoll(roll, 4))).toBe(false);
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

  it("includes racial Hit Dice in derived rules while keeping them separate from class levels", () => {
    const raceId = "test-racial-hd";
    const previousRace = raceDefinitions[raceId];
    raceDefinitions[raceId] = {
      id: raceId,
      name: "Test Racial HD",
      source: "dragonlance-user-pack",
      abilityModifiers: {},
      levelAdjustment: 1,
      racialHitDice: {
        count: 2,
        hitDie: 12,
        baseAttackBonus: "good",
        fortitude: "good",
        reflex: "good",
        will: "good",
        skillPoints: 6,
        classSkills: ["Spot"],
      },
    };

    try {
      const character = cloneCharacter(initialCharacter);
      character.race = "Test Racial HD";
      character.ruleset = "dragonlance-user-pack";
      character.skills = { Spot: 2 };
      character.skillRanksByClass = { "racial-hit-dice": { Spot: 2 } };

      expect(character.classLevels).toEqual([{ classId: "fighter", level: 1 }]);
      expect(getTotalHitDice(character)).toBe(3);
      expect(getEffectiveCharacterLevel(character)).toBe(4);
      expect(getBaseAttackBonus(character)).toBe(3);
      const saves = ["fortitude", "reflex", "will"] as const;
      expect(saves.map((save) => getBaseSave(character, save))).toEqual([5, 3, 3]);
      expect(getFeatSlots(character).map((slot) => slot.id)).toEqual([
        "general-1",
        "general-3",
        "fighter-1",
      ]);
      expect(getAvailableSkillCountForSource(character, "racial-hit-dice")).toBe(30);
      expect(getAvailableSkillCountForSource(character, "fighter")).toBe(2);
      expect(getAvailableSkillCount(character)).toBe(32);
      expect(getSpentSkillPointsForSource(character, "racial-hit-dice")).toBe(2);
      expect(getSpentSkillPoints(character)).toBe(2);
      expect(isClassSkill(character, "Spot", "racial-hit-dice")).toBe(true);
      expect(getSkillMaximum(character, "Spot")).toBe(6);
      expect(getSkillMaximum(character, "Spot", "racial-hit-dice")).toBe(6);
      expect(
        canIncreaseSkillRank(character, "Spot", undefined, undefined, true, "racial-hit-dice"),
      ).toBe(true);
      expect(
        canIncreaseSkillRank(character, "Spot", undefined, undefined, true, "fighter"),
      ).toBe(true);
      const mixedSkillSources = cloneCharacter(character);
      mixedSkillSources.skills.Spot = 5;
      mixedSkillSources.skillRanksByClass.fighter = { Spot: 2 };
      mixedSkillSources.skillRanksByClass["racial-hit-dice"].Spot = 3;
      expect(
        canIncreaseSkillRank(
          mixedSkillSources,
          "Spot",
          undefined,
          undefined,
          true,
          "racial-hit-dice",
        ),
      ).toBe(true);

      character.equipment.Neck = "Amulet of Health +2";
      expect(getConstitutionHitPointAdjustment(character)).toBe(3);

      const levelUp = beginLevelUp(character, "fighter");
      levelUp.proposed.abilities.con = 12;
      expect(levelUpHitPointGain(character, levelUp.proposed, 1)).toBe(5);
      expect(validateLevelUp(levelUp)).toContain(
        "Choose an ability score to increase before confirming the level-up.",
      );

      const coreCharacter = cloneCharacter(character);
      coreCharacter.ruleset = "core-35-srd";
      expect(getTotalHitDice(coreCharacter)).toBe(1);
      expect(getEffectiveCharacterLevel(coreCharacter)).toBe(1);
      expect(getBaseAttackBonus(coreCharacter)).toBe(1);
    } finally {
      if (previousRace) raceDefinitions[raceId] = previousRace;
      else delete raceDefinitions[raceId];
    }
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

  it("validates level-up choices without rolling hit points", () => {
    const draft = beginLevelUp(cloneCharacter(initialCharacter), "fighter");
    expect(validateLevelUp(draft)).toEqual([]);
    draft.proposed.classLevels[0].level = 5;
    expect(validateLevelUp(draft)).toContain("A level-up must add exactly one class level.");
  });

  it("allows Toughness to be selected more than once", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.featSelections = { "general-1": "toughness" };
    const nextGeneralSlot = getFeatSlots(character).find((slot) => slot.id === "general-3");
    if (!nextGeneralSlot) throw new Error("Missing third-level general feat fixture.");
    expect(getAvailableFeats(character, nextGeneralSlot).map((feat) => feat.id))
      .toContain("toughness");
  });

  it("requires an ability increase at level four", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels[0].level = 3;
    const draft = beginLevelUp(character, "fighter");
    expect(validateLevelUp(draft)).toContain("Choose an ability score to increase before confirming the level-up.");
    draft.abilityIncrease = "str";
    expect(validateLevelUp(draft)).toEqual([]);
  });

  it("counts an Intelligence increase only for the level being gained", () => {
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "fighter", level: 3 }];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    proposed.abilities.int = 12;

    expect(getLevelUpSkillWarnings(original, proposed)).toEqual([
      "Spend all new skill points (4 remaining).",
    ]);
  });

  it("reverses old race modifiers before applying the next race", () => {
    const dwarf = changeRace(initialCharacter, "Dwarf");
    expect(dwarf.abilities.con).toBe(12);
    expect(changeRace(dwarf, "Human").abilities).toEqual(initialCharacter.abilities);
  });

  it("applies Kender mechanics only with the Dragonlance ruleset", () => {
    const coreKender = cloneCharacter(initialCharacter);
    coreKender.race = "Kender";
    coreKender.languages = ["Common", "Kenderspeak"];
    expect(sizeModifier(coreKender)).toBe(0);
    expect(carryingCapacity(coreKender)).toEqual({ light: 33, medium: 66, heavy: 100 });
    expect(getRacialSkillBonus(coreKender, "Spot")).toBe(0);
    expect(getSavingThrow(coreKender, "will", ["fear"]).immune).toBe(false);
    expect(getCharacterLanguages(coreKender)).toEqual(["Common"]);
    expect(changeRace(initialCharacter, "Kender").abilities).toEqual(initialCharacter.abilities);

    const dragonlanceKender = cloneCharacter(initialCharacter);
    dragonlanceKender.ruleset = "dragonlance-user-pack";
    dragonlanceKender.race = "Kender";
    expect(sizeModifier(dragonlanceKender)).toBe(1);
    expect(carryingCapacity(dragonlanceKender)).toEqual({ light: 24, medium: 49, heavy: 75 });
    expect(getRacialSkillBonus(dragonlanceKender, "Spot")).toBe(2);
    expect(getRacialSkillBonus(dragonlanceKender, "Concentration")).toBe(-4);
    expect(getSavingThrow(dragonlanceKender, "will").total).toBe(1);
    expect(getSavingThrow(dragonlanceKender, "will", ["fear"]).immune).toBe(true);
    expect(getRacialLanguages(dragonlanceKender)).toEqual(["Common", "Kenderspeak"]);
    expect(getCharacterLanguages(dragonlanceKender)).toContain("Kenderspeak");
    const kenderBonusLanguages = getAvailableBonusLanguages(
      dragonlanceKender,
      "dragonlance-user-pack",
    );
    expect(kenderBonusLanguages).toHaveLength(5);
    expect(kenderBonusLanguages).toEqual(
      expect.arrayContaining(["Dwarven", "Ergot", "Elven", "Goblin", "Solamnic"]),
    );
    const changedRace = changeRace({ ...initialCharacter, ruleset: "dragonlance-user-pack" }, "Kender");
    expect(changedRace.abilities).toMatchObject({ str: 8, dex: 12, wis: 8 });
  });

  it("applies source-backed Irda and minotaur adjustments and languages only in Dragonlance", () => {
    const coreMinotaur = cloneCharacter(initialCharacter);
    coreMinotaur.race = "Minotaur";
    expect(getRacialLanguages(coreMinotaur)).toEqual(["Common"]);
    expect(getRacialSkillBonus(coreMinotaur, "Intimidate")).toBe(0);

    const dragonlanceCharacter = {
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-monster-classes" as const,
    };
    const minotaur = changeRace(dragonlanceCharacter, "Minotaur");
    expect(minotaur.abilities).toMatchObject({ str: 14, dex: 8, con: 10, int: 8, cha: 8 });
    expect(getRacialLanguages(minotaur)).toEqual(["Common", "Kothian"]);
    expect(getRacialSkillBonus(minotaur, "Intimidate")).toBe(2);
    expect(getRacialSkillBonus(minotaur, "Swim")).toBe(2);
    expect(getRacialSkillBonus(minotaur, "Use Rope")).toBe(2);
    expect(getAvailableBonusLanguages(minotaur, "dragonlance-monster-classes"))
      .toEqual(["Kalinese", "Nordmaarian", "Ogre", "Saifhum"]);

    const irda = changeRace(dragonlanceCharacter, "Irda");
    expect(irda.abilities).toMatchObject({ con: 8, int: 12, wis: 10, cha: 12 });
    expect(getRacialLanguages(irda)).toEqual(["Common", "High Ogre"]);
    expect(getAvailableBonusLanguages(irda, "dragonlance-monster-classes"))
      .toEqual(["Dwarven", "Elven", "Kothian", "Sylvan"]);
    expect(raceDefinitions.irda.levelAdjustment).toBe(2);

    irda.languages = ["Common", "Minotaur"];
    expect(getCharacterLanguages(irda)).toContain("Kothian");
    expect(getCharacterLanguages(irda)).not.toContain("Minotaur");
  });

  it("models Baaz and Kapak racial Hit Dice, languages, and gendered class skills", () => {
    const dragonlanceCharacter = {
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-monster-classes" as const,
    };
    const baaz = changeRace(dragonlanceCharacter, "Baaz Draconian");
    expect(baaz.abilities).toMatchObject({ con: 12, int: 8, wis: 8 });
    expect(getTotalHitDice(baaz)).toBe(3);
    expect(getEffectiveCharacterLevel(baaz)).toBe(4);
    expect(getBaseAttackBonus(baaz)).toBe(3);
    const saves = ["fortitude", "reflex", "will"] as const;
    expect(saves.map((save) => getBaseSave(baaz, save))).toEqual([5, 3, 3]);
    expect(getRacialLanguages(baaz)).toEqual(["Common"]);
    expect(getAvailableBonusLanguages(baaz, "dragonlance-monster-classes"))
      .toEqual(["Goblin", "Nerakese", "Ogre"]);
    expect(getAvailableSkillCountForSource(baaz, "racial-hit-dice")).toBe(25);
    expect(getSkillMaximum(baaz, "Spot", "racial-hit-dice")).toBe(6);
    expect(isClassSkill(baaz, "Bluff", "racial-hit-dice")).toBe(false);

    baaz.gender = "Male";
    expect(isClassSkill(baaz, "Bluff", "racial-hit-dice")).toBe(true);
    expect(isClassSkill(baaz, "Diplomacy", "racial-hit-dice")).toBe(false);
    baaz.gender = "Female";
    expect(isClassSkill(baaz, "Bluff", "racial-hit-dice")).toBe(false);
    expect(isClassSkill(baaz, "Diplomacy", "racial-hit-dice")).toBe(true);

    const kapak = changeRace(dragonlanceCharacter, "Kapak Draconian");
    expect(kapak.abilities).toMatchObject({ dex: 12, con: 12, int: 8, wis: 8 });
    expect(getEffectiveCharacterLevel(kapak)).toBe(5);
    expect(getBaseAttackBonus(kapak)).toBe(3);
    expect(saves.map((save) => getBaseSave(kapak, save))).toEqual([5, 3, 3]);
    expect(getRacialLanguages(kapak)).toEqual(["Common"]);
    expect(getAvailableBonusLanguages(kapak, "dragonlance-monster-classes"))
      .toEqual(["Goblin", "Nerakese", "Ogre"]);
  });

  it("applies Dragonlance elf racial traits without changing Core half-elves", () => {
    const dragonlanceCharacter = {
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-user-pack" as const,
    };
    const qualinesti = changeRace(dragonlanceCharacter, "Qualinesti Elf");
    expect(qualinesti.abilities).toMatchObject({ str: 10, dex: 12, con: 8, int: 10 });
    expect(getRacialSkillBonus(qualinesti, "Diplomacy")).toBe(1);
    expect(getRacialSkillBonus(qualinesti, "Sense Motive")).toBe(1);
    expect(getRacialSkillBonus(qualinesti, "Listen")).toBe(2);
    expect(getSavingThrow(qualinesti, "will", ["enchantment"]).total).toBe(2);

    const silvanesti = changeRace(dragonlanceCharacter, "Silvanesti Elf");
    expect(silvanesti.abilities).toMatchObject({ str: 10, dex: 12, con: 8, int: 12, cha: 8 });
    expect(getRacialSkillBonus(silvanesti, "Knowledge (arcana)")).toBe(1);
    expect(getRacialSkillBonus(silvanesti, "Spellcraft")).toBe(1);

    const coreHalfElf = cloneCharacter(initialCharacter);
    coreHalfElf.race = "Half-elf";
    expect(getRaceDefinitionForCharacter(coreHalfElf)?.traits).toBeUndefined();
    const dragonlanceHalfElf = { ...coreHalfElf, ruleset: "dragonlance-user-pack" as const };
    expect(getRaceDefinitionForCharacter(dragonlanceHalfElf)?.traits)
      .toEqual(["Elvensight (low-light vision and darkvision 30 ft.)"]);
  });

  it("applies Kagonesti racial traits and languages only with Dragonlance rules", () => {
    const coreKagonesti = cloneCharacter(initialCharacter);
    coreKagonesti.race = "Kagonesti Elf";
    expect(getRacialLanguages(coreKagonesti)).toEqual(["Common"]);
    expect(getRacialSkillBonus(coreKagonesti, "Survival")).toBe(0);

    const kagonesti = changeRace({
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-user-pack",
    }, "Kagonesti Elf");
    expect(kagonesti.abilities).toMatchObject({
      str: 10,
      dex: 12,
      con: 10,
      int: 8,
      wis: 10,
      cha: 8,
    });
    expect(getMovement(kagonesti)).toMatchObject({ baseSpeed: 30, speed: 30 });
    expect(getRacialSkillBonus(kagonesti, "Listen")).toBe(2);
    expect(getRacialSkillBonus(kagonesti, "Knowledge (nature)")).toBe(1);
    expect(getRacialSkillBonus(kagonesti, "Survival")).toBe(1);
    expect(getRacialLanguages(kagonesti)).toEqual(["Elven", "Sylvan"]);
    expect(getAvailableBonusLanguages(kagonesti)).toEqual([
      "Common",
      "Ergot",
      "Gnoll",
      "Goblin",
      "Ogre",
      "Solamnic",
    ]);
    expect(getSavingThrow(kagonesti, "will", ["sleep"]).immune).toBe(true);
    expect(getSavingThrow(kagonesti, "will", ["enchantment"]).total).toBe(2);
  });

  it("uses the sourcebook's distinct Qualinesti and Silvanesti language choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.languages = [];

    const qualinesti = changeRace(character, "Qualinesti Elf");
    expect(getRacialLanguages(qualinesti)).toEqual(["Common", "Elven"]);
    expect(getAvailableBonusLanguages(qualinesti)).toEqual([
      "Abanasinian",
      "Dwarven",
      "Ergot",
      "Goblin",
      "Ogre",
      "Sylvan",
    ]);

    const silvanesti = changeRace(character, "Silvanesti Elf");
    expect(getRacialLanguages(silvanesti)).toEqual(["Elven"]);
    expect(getCharacterLanguages(silvanesti)).toEqual(["Elven"]);
    expect(getAvailableBonusLanguages(silvanesti)).toEqual([
      "Common",
      "Dwarven",
      "Ergot",
      "Goblin",
      "Kharolian",
      "Khur",
      "Kenderspeak",
      "Ogre",
      "Sylvan",
    ]);
  });

  it("applies source-backed shared and subrace sea-elf mechanics", () => {
    const coreDargonesti = cloneCharacter(initialCharacter);
    coreDargonesti.race = "Dargonesti Elf";
    expect(getMovement(coreDargonesti).swimSpeed).toBeUndefined();
    expect(getRacialLanguages(coreDargonesti)).toEqual(["Common"]);

    const dragonlanceCharacter = {
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-monster-classes" as const,
    };
    const dargonesti = changeRace(dragonlanceCharacter, "Dargonesti Elf");
    expect(dargonesti.abilities).toMatchObject({ str: 12, dex: 12, con: 10, int: 10, wis: 10, cha: 8 });
    expect(raceDefinitions["dargonesti-elf"].levelAdjustment).toBe(1);
    expect(getMovement(dargonesti)).toMatchObject({
      baseSpeed: 30,
      speed: 30,
      baseSwimSpeed: 30,
      swimSpeed: 30,
    });
    expect(getRacialSkillBonus(dargonesti, "Swim")).toBe(8);
    expect(getRacialSkillBonus(dargonesti, "Listen")).toBe(2);
    expect(getRacialLanguages(dargonesti)).toEqual(["Aquan", "Dargonesti"]);
    expect(getAvailableBonusLanguages(dargonesti, "dragonlance-monster-classes"))
      .toEqual(["Common", "Elven", "Ergot"]);
    expect(getSavingThrow(dargonesti, "will", ["enchantment"]).total).toBe(2);
    expect(getSavingThrow(dargonesti, "will", ["sleep"]).immune).toBe(true);

    dargonesti.classLevels = [{ classId: "wizard", level: 4 }];
    expect(getRacialSpellLikeAbilities(dargonesti).map(({ name, casterLevel }) =>
      ({ name, casterLevel }),
    )).toEqual([
      { name: "Blur", casterLevel: 4 },
      { name: "Dancing Lights", casterLevel: 4 },
      { name: "Darkness", casterLevel: 4 },
      { name: "Obscuring Mist", casterLevel: 4 },
    ]);
    dargonesti.abilities.int = 9;
    expect(getRacialSpellLikeAbilities(dargonesti)).toEqual([]);

    const dimernesti = changeRace(dragonlanceCharacter, "Dimernesti Elf");
    expect(dimernesti.abilities).toMatchObject({ str: 10, dex: 12, con: 10, int: 12, wis: 8, cha: 8 });
    expect(getRacialLanguages(dimernesti)).toEqual(["Elven", "Dimernesti"]);
    expect(getAvailableBonusLanguages(dimernesti, "dragonlance-monster-classes"))
      .toEqual(["Aquan", "Common", "Ergot", "Kothian"]);
    expect(getMovement(dimernesti).swimSpeed).toBe(30);
    expect(getRacialSkillBonus(dimernesti, "Swim")).toBe(8);
    expect(getSavingThrow(dimernesti, "fortitude", ["sleep"]).immune).toBe(true);
    expect(formatRaceDetails(raceDefinitions["dargonesti-elf"]))
      .toContain("Swim 30 ft.; Level adjustment +1");
  });

  it("uses core racial language slots and bonus-language lists", () => {
    const human = cloneCharacter(initialCharacter);
    human.abilities.int = 10;
    expect(getLanguageBonusSlots(human)).toBe(0);
    human.abilities.int = 12;
    expect(getLanguageBonusSlots(human)).toBe(1);
    expect(getAvailableBonusLanguages(human, "core-35-srd")).toContain("Ignan");
    expect(getAvailableBonusLanguages(human, "core-35-srd")).not.toContain("Kender");
    expect(getAvailableBonusLanguages(human, "core-35-srd")).not.toContain("Kenderspeak");
    expect(getAvailableBonusLanguages(human, "core-35-srd")).not.toContain("Magius");
    expect(getAvailableBonusLanguages({
      ...human,
      ruleset: "dragonlance-user-pack",
    }, "dragonlance-user-pack")).toContain("Magius");

    const dwarf = cloneCharacter(human);
    dwarf.race = "Dwarf";
    expect(getAvailableBonusLanguages(dwarf, "core-35-srd")).toContain("Undercommon");
    expect(getAvailableBonusLanguages(dwarf, "core-35-srd")).not.toContain("Abyssal");

    const halfOrc = cloneCharacter(human);
    halfOrc.race = "Half-orc";
    expect(getAvailableBonusLanguages(halfOrc, "core-35-srd")).toContain("Abyssal");
    expect(getAvailableBonusLanguages(halfOrc, "core-35-srd")).not.toContain("Terran");
    expect(getAvailableBonusLanguages(human, "core-35-srd")).not.toContain("Abanasinian");
    expect(getAvailableBonusLanguages({
      ...human,
      ruleset: "dragonlance-user-pack",
    }, "dragonlance-user-pack")).toContain("Hand Talk");
  });

  it("uses Dragonlance human regional languages and setting-specific race lists", () => {
    const human = cloneCharacter(initialCharacter);
    human.ruleset = "dragonlance-user-pack";
    human.abilities.int = 10;
    expect(getHumanRegionalLanguages(human)).toContain("Icespeak");
    expect(getRacialLanguages(human)).toEqual(["Common"]);
    human.regionalLanguage = "Icespeak";
    expect(getRacialLanguages(human)).toEqual(["Common", "Icespeak"]);
    expect(getCharacterLanguages(human)).toEqual(["Common", "Icespeak"]);
    expect(getLanguageBonusSlots(human)).toBe(0);
    expect(changeRace(human, "Dwarf").regionalLanguage).toBeUndefined();

    const gnome = { ...human, race: "Gnome", regionalLanguage: undefined };
    expect(getAvailableBonusLanguages(gnome)).toEqual([
      "Dwarven",
      "Ergot",
      "Ogre",
      "Solamnic",
    ]);

    const dwarf = { ...human, race: "Dwarf", regionalLanguage: undefined };
    expect(getAvailableBonusLanguages(dwarf)).toEqual([
      "Giant",
      "Gnome",
      "Hammertalk",
    ]);
  });

  it("grants secret Druidic only to Druids and does not offer it as a bonus language", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.languages.push("Druidic");
    expect(getAvailableBonusLanguages(fighter)).not.toContain("Druidic");
    expect(getCharacterLanguages(fighter)).not.toContain("Druidic");

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 1 }];
    expect(getAutomaticLanguages(druid)).toContain("Druidic");
    expect(getCharacterLanguages(druid)).toContain("Druidic");
    expect(getAvailableBonusLanguages(druid)).not.toContain("Druidic");
    const dwarfDruid = cloneCharacter(druid);
    dwarfDruid.race = "Dwarf";
    expect(getAvailableBonusLanguages(dwarfDruid)).toContain("Sylvan");
  });

  it("allows Wizards to select Draconic as a racial bonus language", () => {
    const dwarfWizard = cloneCharacter(initialCharacter);
    dwarfWizard.race = "Dwarf";
    dwarfWizard.classLevels = [{ classId: "wizard", level: 1 }];
    expect(getAvailableBonusLanguages(dwarfWizard)).toContain("Draconic");

    dwarfWizard.classLevels = [{ classId: "fighter", level: 1 }];
    expect(getAvailableBonusLanguages(dwarfWizard)).not.toContain("Draconic");
  });

  it("uses full Speak Language ranks for separate, non-overlapping language choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.race = "Human";
    character.regionalLanguage = "Icespeak";
    character.languages = ["Elven"];
    character.skills["Speak Language"] = 2.5;
    character.speakLanguages = ["Nestari", "Kolshet"];

    expect(getSpeakLanguageRankCount(character)).toBe(2);
    expect(getCharacterLanguages(character)).toEqual([
      "Common",
      "Icespeak",
      "Elven",
      "Nestari",
      "Kolshet",
    ]);
    expect(getSpeakLanguageWarnings(character)).toEqual([]);
    expect(getAvailableSpeakLanguages(character, 0)).toContain("Nestari");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Nestari");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Common");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Icespeak");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Elven");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Druidic");
    expect(getAvailableSpeakLanguages(character)).not.toContain("Magius");

    character.speakLanguages = ["Nestari", "Nestari", "Magius"];
    expect(getSpeakLanguageWarnings(character)).toEqual(
      expect.arrayContaining([
        "Remove extra Speak Language choices; only one language is learned per full rank.",
        "Nestari is selected more than once for Speak Language.",
        "Magius has no spoken form and cannot be selected with Speak Language.",
      ]),
    );
    expect(getCharacterLanguages(character)).not.toContain("Magius");
  });

  it("requires a language choice when a level-up adds a full Speak Language rank", () => {
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "fighter", level: 1 }];
    original.skills["Speak Language"] = 0.5;
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;
    proposed.skills["Speak Language"] = 1;

    expect(getLevelUpSkillWarnings(original, proposed)).toContain(
      "Choose a language for each Speak Language rank (1 unassigned).",
    );
  });

  it("applies only the racial skill bonuses specified for each core race", () => {
    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    expect(getRacialSkillBonus(gnome, "Listen")).toBe(2);
    expect(getRacialSkillBonus(gnome, "Craft")).toBe(0);
    gnome.skills.Craft = 1;
    expect(getRacialSkillContextOptions(gnome, "Craft")).toEqual([
      { condition: "alchemy", label: "Alchemy", bonus: 2 },
    ]);
    expect(getSkillCheckModifier(gnome, "Craft")).toBe(1);
    expect(getSkillCheckModifier(gnome, "Craft", "alchemy")).toBe(3);

    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    dwarf.skills.Search = 1;
    dwarf.skills.Appraise = 1;
    dwarf.skills.Craft = 1;
    expect(getRacialSkillBonus(dwarf, "Search")).toBe(0);
    expect(getRacialSkillContextOptions(dwarf, "Search")).toEqual([
      {
        condition: "unusual-stonework",
        label: "Unusual stonework (including within 10 ft.)",
        bonus: 2,
      },
    ]);
    expect(getSkillCheckModifier(dwarf, "Search")).toBe(1);
    expect(getSkillCheckModifier(dwarf, "Search", "unusual-stonework")).toBe(3);
    expect(getSkillCheckModifier(dwarf, "Appraise", "stone-or-metal")).toBe(3);
    expect(getSkillCheckModifier(dwarf, "Craft", "stone-or-metal")).toBe(3);
    expect(getSkillTotalTooltip(dwarf, "Search", "unusual-stonework")).toContain(
      "Dwarf (Unusual stonework (including within 10 ft.)): +2",
    );

    const halfElf = cloneCharacter(initialCharacter);
    halfElf.race = "Half-elf";
    expect(getRacialSkillBonus(halfElf, "Search")).toBe(1);
    expect(getRacialSkillBonus(halfElf, "Diplomacy")).toBe(2);
    expect(getRacialSkillBonus(halfElf, "Gather Information")).toBe(2);
  });

  it("adds Improved Initiative once to the initiative modifier", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.dex = 14;
    expect(getInitiativeModifier(character)).toBe(2);

    character.featSelections["general-1"] = "improved-initiative";
    expect(getImprovedInitiativeBonus(character)).toBe(4);
    expect(getInitiativeModifier(character)).toBe(6);

    character.featSelections["fighter-1"] = "improved-initiative";
    expect(getInitiativeModifier(character)).toBe(6);
  });

  it.each([
    ["fortitude", "great-fortitude"],
    ["reflex", "lightning-reflexes"],
    ["will", "iron-will"],
  ] as const)("applies the %s saving throw feat", (save, featId) => {
    const character = cloneCharacter(initialCharacter);
    character.featSelections["general-1"] = featId;

    const result = getSavingThrow(character, save);
    expect(result.total).toBe(getBaseSave(character, save) + 2);
    expect(result.detail).toContain("feat +2");
  });

  it("stacks Iron Will with a matching racial bonus and resistance, but not another copy", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Gnome";
    character.featSelections["general-1"] = "iron-will";
    character.featSelections["fighter-1"] = "iron-will";
    character.equipment.Shoulders = "Cloak of Resistance +2";

    const result = getSavingThrow(character, "will", ["illusion"]);
    expect(result.total).toBe(6);
    expect(result.detail).toContain("illusion racial +2");
    expect(result.detail).toContain("feat +2");
    expect(result.detail).toContain("resistance +2");
  });

  it("applies Paladin Divine Grace and disease/fear immunity only while Lawful Good", () => {
    const character = cloneCharacter(initialCharacter);
    character.alignment = "Lawful Good";
    character.abilities.cha = 18;
    character.classLevels = [{ classId: "paladin", level: 2 }];

    const saveAbilities = {
      fortitude: "con",
      reflex: "dex",
      will: "wis",
    } as const;
    for (const save of ["fortitude", "reflex", "will"] as const) {
      const result = getSavingThrow(character, save);
      expect(result.detail).toContain("Divine Grace +4");
      expect(result.total).toBe(
        getBaseSave(character, save) +
        abilityModifier(getEffectiveAbilityScore(character, saveAbilities[save])) + 4,
      );
    }

    character.abilities.cha = 8;
    expect(getSavingThrow(character, "fortitude").detail).not.toContain("Divine Grace");
    character.abilities.cha = 18;
    character.classLevels[0].level = 3;
    character.hitPoints = 1;
    character.currentHitPoints = 0;
    expect(getSavingThrow(character, "will", ["fear"]).immune).toBe(true);
    expect(getSavingThrow(character, "fortitude", ["disease"]).immune).toBe(true);
    character.currentHitPoints = -1;
    expect(getSavingThrow(character, "will", ["fear"]).immune).toBe(false);

    character.currentHitPoints = 1;
    character.alignment = "Neutral Good";
    for (const save of ["fortitude", "reflex", "will"] as const) {
      expect(getSavingThrow(character, save).detail).not.toContain("Divine Grace");
    }
    expect(getSavingThrow(character, "will", ["fear"]).immune).toBe(false);
    expect(getSavingThrow(character, "fortitude", ["disease"]).immune).toBe(false);
  });

  it("applies Druid nature-lure saves and poison immunity only while neutrally aligned", () => {
    const character = cloneCharacter(initialCharacter);
    character.alignment = "Neutral Good";
    character.classLevels = [{ classId: "druid", level: 4 }];

    const baseWill = getSavingThrow(character, "will").total;
    const feyWill = getSavingThrow(character, "will", ["fey-spell-like"]);
    expect(feyWill.total).toBe(baseWill + 4);
    expect(feyWill.detail).toContain("Resist Nature's Lure +4");
    expect(getSavingThrow(character, "fortitude", ["poison"]).immune).toBe(false);

    character.classLevels[0].level = 9;
    expect(getSavingThrow(character, "fortitude", ["poison"]).immune).toBe(true);
    character.alignment = "Chaotic Good";
    expect(getSavingThrow(character, "will", ["fey-spell-like"]).total).toBe(
      getSavingThrow(character, "will").total,
    );
    expect(getSavingThrow(character, "fortitude", ["poison"]).immune).toBe(false);
  });

  it("applies Divine Grace once when gained from Knight of the Rose", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.alignment = "Lawful Good";
    character.abilities.cha = 18;
    character.classLevels = [{
      classId: "fighter",
      prestigeClassId: "knight-of-the-rose",
      level: 3,
    }];
    character.classLevels.push({ classId: "paladin", level: 2 });

    const detail = getSavingThrow(character, "will").detail;
    expect(detail).toContain("Divine Grace +4");
    expect((detail.match(/Divine Grace/g) ?? []).length).toBe(1);
  });

  it("calculates Gnome spell-like ability access and save DCs", () => {
    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    gnome.abilities.cha = 14;
    expect(getRacialSpellLikeAbilities(gnome).map((ability) => ({
      name: ability.name,
      usesPerDay: ability.usesPerDay,
      casterLevel: ability.casterLevel,
      saveDC: ability.saveDC,
      racialSaveDcBonus: ability.racialSaveDcBonus,
    }))).toEqual([
      { name: "Speak with Animals", usesPerDay: 1, casterLevel: 1, saveDC: undefined, racialSaveDcBonus: 0 },
      { name: "Dancing Lights", usesPerDay: 1, casterLevel: 1, saveDC: undefined, racialSaveDcBonus: 0 },
      { name: "Ghost Sound", usesPerDay: 1, casterLevel: 1, saveDC: 13, racialSaveDcBonus: 1 },
      { name: "Prestidigitation", usesPerDay: 1, casterLevel: 1, saveDC: undefined, racialSaveDcBonus: 0 },
    ]);

    gnome.abilities.cha = 9;
    expect(getRacialSpellLikeAbilities(gnome).map((ability) => ability.name))
      .toEqual(["Speak with Animals"]);
    expect(getRacialSpellLikeAbilities(cloneCharacter(initialCharacter))).toEqual([]);
  });

  it("scales Irda spell-like abilities with character level and Charisma", () => {
    const irda = cloneCharacter(initialCharacter);
    irda.ruleset = "dragonlance-monster-classes";
    irda.race = "Irda";
    irda.classLevels = [{ classId: "wizard", level: 5 }];
    irda.abilities.cha = 14;

    const abilities = getRacialSpellLikeAbilities(irda);
    expect(abilities.map(({ name, usesPerDay, casterLevel }) =>
      ({ name, usesPerDay, casterLevel }),
    )).toEqual([
      { name: "Dancing Lights", usesPerDay: 1, casterLevel: 5 },
      { name: "Detect Magic", usesPerDay: 1, casterLevel: 5 },
      { name: "Flare", usesPerDay: 1, casterLevel: 5 },
      { name: "Ghost Sound", usesPerDay: 1, casterLevel: 5 },
      { name: "Light", usesPerDay: 1, casterLevel: 5 },
      { name: "Mage Hand", usesPerDay: 1, casterLevel: 5 },
    ]);
    expect(abilities.filter(({ saveDC }) => saveDC !== undefined).map(({ name, saveDC }) =>
      ({ name, saveDC }),
    )).toEqual([
      { name: "Flare", saveDC: 12 },
      { name: "Ghost Sound", saveDC: 12 },
    ]);
  });

  it("applies Dwarf Stability only to grounded bull rush and trip checks", () => {
    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    expect(getDwarfStabilityBonus(dwarf, "bull-rush", true)).toBe(4);
    expect(getDwarfStabilityBonus(dwarf, "trip", true)).toBe(4);
    expect(getDwarfStabilityBonus(dwarf, "bull-rush", false)).toBe(0);
    expect(getDwarfStabilityBonus(dwarf, "trip", false)).toBe(0);
    expect(getDwarfStabilityBonus(dwarf, undefined, true)).toBe(0);
    expect(getDwarfStabilityBonus(cloneCharacter(initialCharacter), "trip", true)).toBe(0);

    for (const race of ["Hill Dwarf", "Mountain Dwarf", "Dark Dwarf"]) {
      const variant = { ...cloneCharacter(initialCharacter), race, ruleset: "dragonlance-user-pack" as const };
      expect(getDwarfStabilityBonus(variant, "trip", true)).toBe(4);
    }
  });

  it("uses sourcebook dwarf variants and gives Gully Dwarves their distinct traits", () => {
    const dragonlanceCharacter = {
      ...cloneCharacter(initialCharacter),
      ruleset: "dragonlance-user-pack" as const,
    };
    const hillDwarf = changeRace(dragonlanceCharacter, "Hill Dwarf");
    expect(getSavingThrow(hillDwarf, "fortitude", ["poison"]).total).toBe(5);
    expect(getAvailableBonusLanguages(hillDwarf)).toEqual(["Elven", "Goblin", "Ogre"]);

    const mountainDwarf = changeRace(dragonlanceCharacter, "Mountain Dwarf");
    expect(getAvailableBonusLanguages(mountainDwarf)).toEqual(["Giant", "Gnome", "Hammertalk"]);

    const darkDwarf = changeRace(dragonlanceCharacter, "Dark Dwarf");
    expect(darkDwarf.abilities).toMatchObject({ con: 12, cha: 6 });
    expect(getRacialSkillBonus(darkDwarf, "Hide")).toBe(2);
    expect(getRaceDefinitionForCharacter(darkDwarf)?.specialAbilities)
      .toContain("Darkvision 120 ft.");

    const gullyDwarf = changeRace(dragonlanceCharacter, "Gully Dwarf");
    expect(gullyDwarf.abilities).toMatchObject({
      str: 10,
      dex: 12,
      con: 12,
      int: 6,
      cha: 6,
    });
    expect(getRacialLanguages(gullyDwarf)).toEqual(["Gullytalk", "Common"]);
    expect(getAvailableBonusLanguages(gullyDwarf)).toEqual([]);
    expect(getRacialSkillBonus(gullyDwarf, "Hide")).toBe(2);
    expect(getRacialSkillBonus(gullyDwarf, "Survival")).toBe(2);
    expect(getRacialSkillContextOptions(gullyDwarf, "Diplomacy")).toContainEqual({
      condition: "pitiable",
      label: "Appealing to an enemy not to harm you",
      bonus: 4,
    });
    expect(getSavingThrow(gullyDwarf, "fortitude", ["disease"]).total).toBe(5);
    expect(getSavingThrow(gullyDwarf, "reflex", ["poison"]).total).toBe(1);
    expect(getSavingThrow(gullyDwarf, "will", ["fear"]).total).toBe(-4);
  });

  it("applies the Small-size Hide bonus and includes it in the check breakdown", () => {
    const halfling = cloneCharacter(initialCharacter);
    halfling.race = "Halfling";
    expect(getSkillCheckModifier(halfling, "Hide")).toBe(4);
    expect(getSkillTotalTooltip(halfling, "Hide")).toContain("Small size (Hide): +4");

    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    expect(getSkillCheckModifier(dwarf, "Hide")).toBe(0);
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

  it("records sleep immunity and low-light vision details for Elves and Half-Elves", () => {
    const elfDetails = formatRaceDetails(raceDefinitions.elf);
    const halfElfDetails = formatRaceDetails(raceDefinitions["half-elf"]);
    expect(elfDetails).toContain("Immune to magical sleep effects");
    expect(halfElfDetails).toContain("Immune to sleep spells and similar magical effects");
    for (const details of [elfDetails, halfElfDetails]) {
      expect(details).toContain("see twice as far as humans in starlight, moonlight, torchlight");
      expect(details).toContain("retain color and detail");
    }
  });

  it("sums multiclass attack and save progressions", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }, { classId: "wizard", level: 2 }];
    expect(getBaseAttackBonus(character)).toBe(5);
    expect(getBaseSave(character, "fortitude")).toBe(4);
    expect(getBaseSave(character, "will")).toBe(4);
  });

  it("does not grant anchor-class progression to an incomplete prestige-class entry", () => {
    const baseCharacter = cloneCharacter(initialCharacter);
    baseCharacter.classLevels = [{ classId: "fighter", level: 2 }];
    const prestigeCharacter = cloneCharacter(baseCharacter);
    prestigeCharacter.classLevels.push({
      classId: "fighter",
      prestigeClassId: "arcane-archer",
      level: 3,
    });

    expect(getBaseAttackBonus(prestigeCharacter)).toBe(getBaseAttackBonus(baseCharacter));
    for (const save of ["fortitude", "reflex", "will"] as const) {
      expect(getBaseSave(prestigeCharacter, save)).toBe(getBaseSave(baseCharacter, save));
    }
    expect(getAvailableSkillCount(prestigeCharacter)).toBe(getAvailableSkillCount(baseCharacter));
    expect(isClassSkill(prestigeCharacter, "Spellcraft", "arcane-archer")).toBe(false);
    expect(isClassSkill(prestigeCharacter, "Spellcraft")).toBe(false);
  });

  it("checks Knight of the Crown prerequisites and the Knightly Council requirement", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.alignment = "Lawful Good";
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.skills = {
      ...character.skills,
      Diplomacy: 2,
      "Knowledge (religion)": 2,
      Ride: 2,
    };
    character.featSelections = { "general-1": "honor-bound" };
    character.feats = ["Honor-bound"];

    const specialPrerequisiteErrors = getPrestigeClassEligibilityErrors(
      character,
      "knight-of-the-crown",
      false,
    );
    expect(specialPrerequisiteErrors).toHaveLength(1);
    expect(specialPrerequisiteErrors[0]).toMatch(/^Confirm this special prerequisite:/);
    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-crown"),
    ).toEqual([]);

    character.alignment = "Neutral Good";
    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-crown"),
    ).toContain("Alignment must be Lawful Good.");
  });

  it("applies Knight of the Crown skill, attack, save, and feature progression", () => {
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.alignment = "Lawful Good";
    original.classLevels = [{ classId: "fighter", level: 4 }];
    original.feats = ["Honor-bound"];
    original.featSelections = { "general-1": "honor-bound" };
    const draft = beginPrestigeLevelUp(original, "knight-of-the-crown");
    const proposed = draft.proposed;

    expect(draft.specialPrerequisiteConfirmed).toBe(false);
    expect(getLevelUpSkillSourceId(original, proposed)).toBe("knight-of-the-crown");
    expect(getSkillPointsPerLevel(proposed, "knight-of-the-crown")).toBe(3);
    expect(getAvailableSkillCountForSource(proposed, "knight-of-the-crown")).toBe(3);
    expect(getBaseAttackBonus(proposed)).toBe(5);
    expect(getBaseSave(proposed, "fortitude")).toBe(6);
    expect(getBaseSave(proposed, "reflex")).toBe(1);
    expect(getClassFeatureDisplay(proposed)).toContainEqual({
      source: "Knight of the Crown 1",
      ability: "Strength of Honor (1/day)",
    });

    proposed.skills["Knowledge (religion)"] = 3;
    proposed.skillRanksByClass = {
      ...proposed.skillRanksByClass,
      "knight-of-the-crown": { "Knowledge (religion)": 3 },
    };
    expect(getLevelUpSkillWarnings(original, proposed)).toEqual([]);

    proposed.classLevels.at(-1)!.level = 5;
    expect(getKnightOfCrownHeroicInitiativeBonus(proposed)).toBe(2);
  });

  it("applies Knightly Courage, Honorable Will, Aura of Courage, and Honor-bound saves", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.cha = 14;
    character.classLevels = [
      { classId: "fighter", level: 4 },
      { classId: "fighter", prestigeClassId: "knight-of-the-crown", level: 4 },
    ];
    const baseWill = getSavingThrow(character, "will").total;
    expect(getSavingThrow(character, "will", ["fear"]).total - baseWill).toBe(2);
    expect(getSavingThrow(character, "will", ["compulsion"]).total - baseWill).toBe(2);

    character.featSelections = { "general-1": "honor-bound" };
    expect(getSavingThrow(character, "will", ["oath"]).total - baseWill).toBe(2);
    character.honorBoundSuspended = true;
    expect(getSavingThrow(character, "will", ["oath"]).total).toBe(baseWill);

    character.classLevels.at(-1)!.level = 9;
    expect(getSavingThrow(character, "will", ["fear"]).immune).toBe(true);
  });

  it("applies timed Strength of Honor ability modifiers to effective scores", () => {
    const character = cloneCharacter(initialCharacter);
    character.combatEffects = [{
      name: "Strength of Honor",
      remainingRounds: 5,
      modifiers: { attack: 0, armorClass: 0, saves: 0, damage: 0, checks: 0 },
      abilityModifiers: { str: 4 },
    }];
    expect(getEffectiveAbilityScore(character, "str")).toBe(14);
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
    const secondLevelFeatures = getClassFeatureDisplay(character);
    expect(secondLevelFeatures).toContainEqual({
      source: "Monk 2",
      ability: "Evasion",
    });
    expect(secondLevelFeatures).toContainEqual({
      source: "Monk 2",
      ability: "Fast Movement",
    });
    expect(secondLevelFeatures.some(({ ability }) => ability === "Unarmored Speed +10 ft.")).toBe(false);
    character.classLevels[0].level = 3;
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Monk 3",
      ability: "Unarmored Speed +10 ft.",
    });

    character.classLevels.push({ classId: "wizard", level: 1 });
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Wizard 1",
      ability: "Scribe Scroll",
    });
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Wizard 1",
      ability: "Spellbook",
    });
    character.classLevels = [{ classId: "wizard", level: 10 }];
    expect(getClassFeatureDisplay(character)).toContainEqual({
      source: "Wizard 10",
      ability: "Wizard Bonus Feat",
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

  it("grants Wizard bonus feat slots and automatically includes Scribe Scroll", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 20 }];
    const wizardSlots = getFeatSlots(character).filter((slot) =>
      slot.id.startsWith("wizard-"),
    );
    expect(wizardSlots.map(({ id }) => id)).toEqual([
      "wizard-5",
      "wizard-10",
      "wizard-15",
      "wizard-20",
    ]);
    expect(wizardSlots.every(({ fighterOnly }) => !fighterOnly)).toBe(true);
    expect(getChosenFeats(character)).toContain("scribe-scroll");
    const firstLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelSlot) throw new Error("Missing first-level feat slot.");
    expect(
      getAvailableFeats(character, firstLevelSlot).map(({ id }) => id),
    ).not.toContain("scribe-scroll");
    expect(classFeatureDescriptions["Wizard Bonus Feat"]).toContain(
      "Wizard levels 5, 10, 15, and 20",
    );
  });

  it("displays Noble features at their Dragonlance class-table levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "noble", level: 1 }];
    character.classFeatures = ["Bonus Class Skill", "Favor +1"];
    expect(getClassFeatureDisplay(character)).toEqual([
      { source: "Noble 1", ability: "Bonus Class Skill" },
      { source: "Noble 1", ability: "Favor +1" },
    ]);

    character.classLevels[0].level = 20;
    const nobleFeatures = getClassFeatureDisplay(character).filter(
      ({ source }) => source.startsWith("Noble "),
    );
    expect(nobleFeatures.map(({ ability }) => ability)).toEqual([
      "Bonus Class Skill",
      "Favor +1",
      "Inspire Confidence (1/day)",
      "Favor +2",
      "Coordinate +1",
      "Inspire Confidence (2/day)",
      "Favor +3",
      "Coordinate +2",
      "Inspire Confidence (3/day)",
      "Inspire Greatness (1 ally)",
      "Favor +4",
      "Coordinate +3",
      "Inspire Confidence (4/day)",
      "Inspire Greatness (2 allies)",
      "Favor +5",
      "Inspire Confidence (5/day)",
      "Inspire Greatness (3 allies)",
      "Coordinate +4",
      "Coordinate +5",
      "Inspire Greatness (4 allies)",
    ]);
    for (const { ability } of nobleFeatures)
      expect(classFeatureDescriptions[ability]).toBeDefined();
  });

  it.each([
    ["bard", 1, "Bardic Knowledge", "Knowledge (history)"],
    ["druid", 1, "Wild Empathy", "Handle Animal"],
    ["ranger", 1, "Wild Empathy", "Handle Animal"],
    ["cleric", 1, "Turn or Rebuke Undead", "Knowledge (religion)"],
    ["paladin", 4, "Turn Undead", "Knowledge (religion)"],
  ] as const)(
    "grants the feature synergy for %s %s only at 5 source ranks",
    (classId, level, feature, sourceSkill) => {
      const character = cloneCharacter(initialCharacter);
      character.classLevels = [{ classId, level }];
      character.skills[sourceSkill] = 4.5;
      expect(getClassFeatureSkillSynergy(character, feature)).toBeNull();
      character.skills[sourceSkill] = 5;
      expect(getClassFeatureSkillSynergy(character, feature)).toEqual({
        sourceSkill,
        bonus: 2,
        checkLabel: feature === "Turn or Rebuke Undead"
          ? "turning or rebuking checks against undead"
          : feature === "Turn Undead"
            ? "turning checks against undead"
            : `${feature} checks`,
      });
    },
  );

  it("does not grant a class-feature synergy when the character lacks that feature", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 20 }];
    character.skills["Knowledge (history)"] = 5;
    expect(getClassFeatureSkillSynergy(character, "Bardic Knowledge")).toBeNull();
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

  it("checks all direct prerequisites in Great Cleave and Greater Two-Weapon Fighting chains", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 11 }];
    character.abilities.str = 13;
    character.abilities.dex = 19;
    const greatCleave = featCatalog.find((feat) => feat.id === "great-cleave");
    const greaterTwoWeaponFighting = featCatalog.find(
      (feat) => feat.id === "greater-two-weapon-fighting",
    );
    if (!greatCleave || !greaterTwoWeaponFighting)
      throw new Error("Missing feat prerequisite fixture.");

    character.featSelections = { "general-1": "cleave" };
    expect(featQualifies(character, greatCleave, { fighterOnly: false })).toBe(false);
    character.featSelections["general-2"] = "power-attack";
    expect(featQualifies(character, greatCleave, { fighterOnly: false })).toBe(true);

    character.featSelections = { "general-1": "improved-two-weapon-fighting" };
    expect(
      featQualifies(character, greaterTwoWeaponFighting, { fighterOnly: false }),
    ).toBe(false);
    character.featSelections["general-2"] = "two-weapon-fighting";
    expect(
      featQualifies(character, greaterTwoWeaponFighting, { fighterOnly: false }),
    ).toBe(true);
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

  it("offers Ranger combat-style feats by level and preserves the chosen style", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 11 }];
    const styleSlots = getFeatSlots(character).filter(
      (slot) => slot.rangerStyleLevel !== undefined,
    );
    expect(styleSlots.map((slot) => slot.id)).toEqual([
      "ranger-style-2",
      "ranger-style-6",
      "ranger-style-11",
    ]);

    const choicesAtLevel = (level: 2 | 6 | 11) => {
      const slot = styleSlots.find((candidate) => candidate.rangerStyleLevel === level);
      if (!slot) throw new Error(`Missing Ranger style slot at level ${level}.`);
      return getAvailableFeats(character, slot).map((feat) => feat.id);
    };

    expect(choicesAtLevel(2)).toEqual(["rapid-shot", "two-weapon-fighting"]);
    character.featSelections = { "ranger-style-2": "rapid-shot" };
    expect(choicesAtLevel(6)).toContain("manyshot");
    expect(choicesAtLevel(6)).not.toContain("improved-two-weapon-fighting");
    character.featSelections["ranger-style-6"] = "manyshot";
    expect(choicesAtLevel(11)).toContain("improved-precise-shot");
    expect(choicesAtLevel(11)).not.toContain("greater-two-weapon-fighting");

    character.featSelections = {
      "ranger-style-2": "two-weapon-fighting",
      "ranger-style-6": "improved-two-weapon-fighting",
    };
    expect(choicesAtLevel(11)).toContain("greater-two-weapon-fighting");
    expect(choicesAtLevel(11)).not.toContain("improved-precise-shot");
  });

  it("enforces Ranger style feat prerequisites for non-style feat slots", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 11 }];
    const generalSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!generalSlot) throw new Error("Missing general feat fixture.");

    expect(getAvailableFeats(character, generalSlot).map((feat) => feat.id)).not.toContain(
      "rapid-shot",
    );
    character.abilities.dex = 13;
    character.featSelections = { "general-1": "point-blank-shot" };
    expect(getAvailableFeats(character, generalSlot).map((feat) => feat.id)).toContain(
      "rapid-shot",
    );
  });

  it("checks prerequisites for the Ranger style feats when chosen normally", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 11 }];
    character.abilities.dex = 19;
    character.featSelections = {
      "general-1": "point-blank-shot",
      "general-3": "rapid-shot",
      "general-6": "precise-shot",
      "general-9": "two-weapon-fighting",
      "human-1": "improved-two-weapon-fighting",
    };

    for (const id of [
      "rapid-shot",
      "manyshot",
      "improved-precise-shot",
      "two-weapon-fighting",
      "improved-two-weapon-fighting",
      "greater-two-weapon-fighting",
    ]) {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Ranger feat fixture: ${id}.`);
      expect(featQualifies(character, feat, { fighterOnly: false })).toBe(true);
    }
  });

  it("allows style paths to be backfilled for existing Rangers", () => {
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "ranger", level: 5 }];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 6;

    expect(
      getNewLevelUpFeatSlots(original, proposed)
        .filter((slot) => slot.rangerStyleLevel !== undefined)
        .map((slot) => slot.id),
    ).toEqual(["ranger-style-2", "ranger-style-6"]);

    proposed.featSelections = { "ranger-style-2": "rapid-shot" };
    const levelSixSlot = getFeatSlots(proposed).find(
      (slot) => slot.rangerStyleLevel === 6,
    );
    if (!levelSixSlot) throw new Error("Missing Ranger level-six style slot.");
    expect(getAvailableFeats(proposed, levelSixSlot).map((feat) => feat.id)).toContain(
      "manyshot",
    );
  });

  it("preserves a Ranger style choice when the character already has that feat", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.dex = 15;
    character.classLevels = [{ classId: "ranger", level: 2 }];
    character.featSelections = { "general-1": "two-weapon-fighting" };

    expect(
      normalizeFeatSelections(character, {
        ...character.featSelections,
        "ranger-style-2": "two-weapon-fighting",
      }),
    ).toMatchObject({
      "general-1": "two-weapon-fighting",
      "ranger-style-2": "two-weapon-fighting",
    });
  });

  it("offers Monk bonus feats at levels 1, 2, and 6 without their normal prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "monk", level: 6 }];
    const bonusSlots = getFeatSlots(character).filter(
      (slot) => slot.monkBonusLevel !== undefined,
    );
    expect(bonusSlots.map((slot) => slot.id)).toEqual([
      "monk-1",
      "monk-2",
      "monk-6",
    ]);

    const expectedOptions = [
      ["improved-grapple", "stunning-fist"],
      ["combat-reflexes", "deflect-arrows"],
      ["improved-disarm", "improved-trip"],
    ];
    bonusSlots.forEach((slot, index) => {
      expect(
        new Set(getAvailableFeats(character, slot).map((feat) => feat.id)),
      ).toEqual(new Set(expectedOptions[index]));
    });

    const generalSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    if (!generalSlot) throw new Error("Missing general feat fixture.");
    for (const id of [
      "improved-grapple",
      "stunning-fist",
      "deflect-arrows",
      "improved-disarm",
      "improved-trip",
    ]) {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Monk feat fixture: ${id}.`);
      expect(featQualifies(character, feat, generalSlot)).toBe(false);
    }

    const firstLevelMonk = cloneCharacter(initialCharacter);
    firstLevelMonk.classLevels = [{ classId: "monk", level: 1 }];
    firstLevelMonk.abilities.dex = 13;
    const firstLevelGeneralSlot = getFeatSlots(firstLevelMonk).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelGeneralSlot) throw new Error("Missing first-level general feat.");
    const regularChoices = getAvailableFeats(firstLevelMonk, firstLevelGeneralSlot)
      .map((feat) => feat.id);
    expect(regularChoices).toContain("improved-grapple");
    expect(regularChoices).toContain("deflect-arrows");
    expect(regularChoices).not.toContain("stunning-fist");
  });

  it("backfills missing Monk bonus-feat choices and rejects duplicate feats", () => {
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "monk", level: 5 }];
    original.featSelections = { "monk-1": "stunning-fist" };
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 6;

    expect(
      getNewLevelUpFeatSlots(original, proposed)
        .filter((slot) => slot.monkBonusLevel !== undefined)
        .map((slot) => slot.id),
    ).toEqual(["monk-2", "monk-6"]);

    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "monk", level: 2 }];
    character.featSelections = { "general-1": "combat-reflexes" };
    const monkSecondLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "monk-2",
    );
    if (!monkSecondLevelSlot) throw new Error("Missing Monk second-level bonus feat.");
    expect(
      getAvailableFeats(character, monkSecondLevelSlot).map((feat) => feat.id),
    ).not.toContain("combat-reflexes");
    expect(
      normalizeFeatSelections(character, {
        ...character.featSelections,
        "monk-2": "combat-reflexes",
      }),
    ).toEqual({ "general-1": "combat-reflexes" });
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

  it.each([
    ["barbarian", "Lawful Good", false],
    ["barbarian", "Chaotic Good", true],
    ["bard", "Lawful Neutral", false],
    ["bard", "True Neutral", true],
    ["druid", "Chaotic Good", false],
    ["druid", "Neutral Good", true],
    ["monk", "Neutral Good", false],
    ["monk", "Lawful Evil", true],
    ["paladin", "Lawful Neutral", false],
    ["paladin", "Lawful Good", true],
  ] as const)("checks the %s alignment restriction for %s", (classId, alignment, allowed) => {
    expect(isClassAlignmentAllowed(classId, alignment)).toBe(allowed);
  });

  it("limits Clerics to one alignment axis and reserves True Neutral for neutral deities", () => {
    expect(alignmentDistance("Neutral Good", "Lawful Neutral")).toBe(2);
    expect(isClericAlignmentAllowed("Lawful Good", "Neutral Good")).toBe(true);
    expect(isClericAlignmentAllowed("Neutral Good", "Lawful Neutral")).toBe(false);
    expect(isClericAlignmentAllowed("Neutral Good", "True Neutral")).toBe(true);
    expect(isClericAlignmentAllowed("True Neutral", "Neutral Good")).toBe(false);
    expect(isClericAlignmentAllowed("True Neutral", "True Neutral")).toBe(true);

    const character = cloneCharacter(initialCharacter);
    character.alignment = "Lawful Neutral";
    character.deity = "pelor";
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([
      "Cannot take a Cleric level with Lawful Neutral; it must be within one step of Pelor.",
    ]);
    character.alignment = "Neutral Good";
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([]);
    character.deity = undefined;
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([
      "Choose a deity before taking a Cleric level.",
    ]);
  });

  it("uses Dragonlance cleric alignment lists and blocks deities without divine spells", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.deity = "shinare";
    character.alignment = "Chaotic Neutral";
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([
      "Cannot take a Cleric level with Chaotic Neutral; Shinare permits Lawful Neutral, True Neutral.",
    ]);

    character.alignment = "True Neutral";
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([]);
    character.deity = "solinari";
    expect(getLevelUpAlignmentWarnings(character, "cleric")).toEqual([
      "Solinari grants no divine spells or cleric domains; a Cleric level is unavailable.",
    ]);
  });

  it("enforces Dragonlance Ranger patrons and requires one before divine spellcasting", () => {
    expect(getDragonlanceRangerPatron("Lawful Good")?.id).toBe("habbakuk");
    expect(getDragonlanceRangerPatron("Neutral Good")?.id).toBe("habbakuk");
    expect(getDragonlanceRangerPatron("True Neutral")?.id).toBe("chislev");
    expect(getDragonlanceRangerPatron("Chaotic Evil")?.id).toBe("zeboim");

    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.alignment = "Lawful Good";
    original.classLevels = [{ classId: "ranger", level: 3 }];
    original.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Dragon",
      bonusTargetLevel: 1,
    }];
    expect(getDragonlanceRangerWarnings(original, 3)).toEqual([]);
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "A Dragonlance Ranger must choose a nature deity by Ranger level 4 to cast divine spells (Habbakuk for good, Chislev for neutral, or Zeboim for evil alignment).",
    ]);

    proposed.abilities.wis = 18;
    proposed.deity = "chislev";
    expect(getDragonlanceRangerWarnings(proposed, 4)).toEqual([
      "A Dragonlance Ranger with Lawful Good alignment must follow Habbakuk.",
    ]);
    expect(getDailySpellSlots(proposed, "ranger", 4, 1)).toBe(0);
    proposed.deity = "habbakuk";
    expect(getDragonlanceRangerWarnings(proposed, 4)).toEqual([]);
    expect(getDailySpellSlots(proposed, "ranger", 4, 1)).toBeGreaterThan(0);
    expect(classFeatureDescriptions["Favored Enemy"]).toContain("organization");
  });

  it("requires PHB-listed subtypes for Humanoid and Outsider favored enemies", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    character.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Outsider",
      subtype: "lawful",
      bonusTargetLevel: 1,
    }];
    expect(getRangerFavoredEnemyLabel(character.rangerFavoredEnemies[0])).toBe(
      "Outsider (lawful)",
    );
    expect(getRangerFavoredEnemyWarnings(character)).toEqual([]);

    character.rangerFavoredEnemies[0].subtype = "";
    expect(getRangerFavoredEnemyWarnings(character)).toContain(
      "Choose a subtype at level 1.",
    );
    character.rangerFavoredEnemies[0] = {
      ...character.rangerFavoredEnemies[0],
      target: "Humanoid",
      subtype: "elf",
    };
    expect(getRangerFavoredEnemyWarnings(character)).toEqual([]);
    expect(classFeatureDescriptions["Favored Enemy"]).toContain(
      "Humanoids and outsiders require a PHB-listed subtype.",
    );
  });

  it("describes cleric turning and domain features", () => {
    expect(classFeatureDescriptions["Turn or Rebuke Undead"]).toContain("3 + Charisma modifier");
    expect(classFeatureDescriptions["Turn or Rebuke Undead"]).toContain("5 ranks in Knowledge (religion)");
    expect(classFeatureDescriptions.Domains).toContain("one separate domain spell slot");
  });

  it("documents Paladin resources and class features", () => {
    expect(classFeatureDescriptions["Lay on Hands"]).toContain("Paladin level × positive Charisma modifier");
    expect(classFeatureDescriptions["Divine Health"]).toContain("immune to all diseases");
    expect(classFeatureDescriptions["Special Mount"]).toContain("2 hours per Paladin level");
    expect(classFeatureDescriptions["Remove Disease (5/week)"]).toContain("five times per week");
  });

  it("documents Druid elemental forms, companion level stacking, and neutral alignment spellcasting", () => {
    expect(classFeatureDescriptions["Wild Shape (elemental 1/day, up to Large)"]).toContain(
      "At Druid level 16, elemental forms may be Small, Medium, or Large",
    );
    expect(classFeatureDescriptions["Wild Shape (elemental 3/day, Huge elemental)"]).toContain(
      "Huge elementals are also available",
    );
    expect(classFeatureDescriptions["Animal Companion"]).toContain(
      "Levels in multiple classes that grant an animal companion stack",
    );

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 4 }];
    druid.alignment = "Neutral Good";
    druid.abilities.wis = 16;
    expect(getDailySpellSlots(druid, "druid", 4, 1)).toBeGreaterThan(0);
    druid.alignment = "Chaotic Good";
    expect(getDailySpellSlots(druid, "druid", 4, 1)).toBe(0);
  });

  it("documents Bardic Knowledge and Bardic Music rules", () => {
    expect(classFeatureDescriptions["Bardic Knowledge"]).toContain(
      "Bard level + Intelligence modifier",
    );
    expect(classFeatureDescriptions["Bardic Knowledge"]).toContain(
      "5 ranks in Knowledge (history)",
    );
    expect(classFeatureDescriptions["Bardic Music"]).toContain(
      "Daily uses equal Bard level",
    );
    expect(classFeatureDescriptions["Bardic Music"]).toContain(
      "21 for Mass Suggestion",
    );
    expect(classFeatureDescriptions["Bardic Music"]).toContain(
      "you cannot cast spells or activate scrolls or wands",
    );
    expect(classFeatureDescriptions.Countersong).toContain(
      "use your check result instead of its save",
    );
    for (const feature of [
      "Inspire Competence",
      "Suggestion",
      "Inspire Greatness",
      "Song of Freedom",
      "Inspire Heroics",
      "Mass Suggestion",
    ])
      expect(classFeatureDescriptions[feature]).toBeDefined();
  });

  it("documents familiar acquisition and shared Wizard/Sorcerer levels", () => {
    expect(classFeatureDescriptions["Summon Familiar"]).toContain(
      "24 hours and 100 gp in materials",
    );
    expect(classFeatureDescriptions["Summon Familiar"]).toContain(
      "Wizard and Sorcerer levels stack",
    );
    expect(classFeatureDescriptions["Summon Familiar"]).toContain(
      "within 1 mile",
    );
  });

  it("grants Ranger Track and Endurance as class features and feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    expect(getChosenFeats(character)).toContain("track");
    expect(getChosenFeats(character)).not.toContain("endurance");

    character.classLevels[0].level = 3;
    expect(getChosenFeats(character)).toContain("track");
    expect(getChosenFeats(character)).toContain("endurance");

    character.classLevels = [{ classId: "fighter", level: 3 }];
    expect(getChosenFeats(character)).not.toContain("track");
    expect(getChosenFeats(character)).not.toContain("endurance");
  });

  it("requires Dragonlance Druids to follow an alignment-matched nature deity to cast spells", () => {
    const druid = cloneCharacter(initialCharacter);
    druid.ruleset = "dragonlance-user-pack";
    druid.classLevels = [{ classId: "druid", level: 1 }];
    druid.alignment = "Neutral Good";
    druid.abilities.wis = 16;
    expect(getDragonlanceDruidWarnings(druid)).toEqual([
      "A Dragonlance Druid with Neutral Good alignment must follow Habbakuk.",
    ]);
    expect(getDailySpellSlots(druid, "druid", 1, 1)).toBe(0);

    druid.deity = "chislev";
    expect(getDragonlanceDruidWarnings(druid)).toEqual([
      "A Dragonlance Druid with Neutral Good alignment must follow Habbakuk.",
    ]);
    druid.deity = "habbakuk";
    expect(getDragonlanceDruidWarnings(druid)).toEqual([]);
    expect(getDailySpellSlots(druid, "druid", 1, 1)).toBeGreaterThan(0);

    druid.alignment = "Lawful Neutral";
    expect(getDragonlanceDruidWarnings(druid)).toEqual([
      "A Dragonlance Druid with Lawful Neutral alignment must follow Chislev.",
    ]);
    druid.deity = "zeboim";
    druid.alignment = "Neutral Evil";
    expect(getDragonlanceDruidWarnings(druid)).toEqual([]);

    const original = cloneCharacter(druid);
    original.classLevels = [{ classId: "druid", level: 1 }];
    original.deity = undefined;
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "A Dragonlance Druid with Neutral Evil alignment must follow Zeboim.",
    ]);
    expect(getDragonlanceDruidWarnings({
      ...druid,
      ruleset: "core-35-srd",
      deity: undefined,
    })).toEqual([]);
  });

  it("tracks Ranger favored-enemy unlocks, distinct targets, and allocated bonus increases", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "ranger", level: 10 }];
    const choices: RangerFavoredEnemyChoice[] = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Humanoid",
        subtype: "Elf",
        bonusTargetLevel: 1,
      },
      {
        classLevel: 5,
        kind: "organization",
        target: "Knights of Solamnia",
        bonusTargetLevel: 1,
      },
      {
        classLevel: 10,
        kind: "creature",
        target: "Undead",
        bonusTargetLevel: 10,
      },
    ];
    character.rangerFavoredEnemies = choices;
    const humanoidChoice = choices.find((choice) => choice.classLevel === 1);
    if (!humanoidChoice) throw new Error("Missing level-one favored enemy fixture.");

    expect(getRangerFavoredEnemyChoiceLevels(20)).toEqual([1, 5, 10, 15, 20]);
    expect(getRangerFavoredEnemyLabel(humanoidChoice)).toBe("Humanoid (Elf)");
    expect(getRangerFavoredEnemyBonus(choices, 1)).toBe(4);
    expect(getRangerFavoredEnemyBonus(choices, 5)).toBe(2);
    expect(getRangerFavoredEnemyBonus(choices, 10)).toBe(4);
    expect(getRangerFavoredEnemyWarnings(character)).toEqual([]);

    character.ruleset = "core-35-srd";
    expect(getRangerFavoredEnemyWarnings(character)).toContain(
      "Organizations require Dragonlance rules.",
    );
  });

  it("requires a different enemy and a +2 bonus assignment at each Ranger milestone", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 5 }];
    expect(getRangerFavoredEnemyWarnings(character)).toEqual([
      "Choose a favored enemy at level 1.",
      "Choose a favored enemy at level 5.",
    ]);
    character.rangerFavoredEnemies = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Animal",
        bonusTargetLevel: 1,
      },
      {
        classLevel: 5,
        kind: "creature",
        target: "Animal",
        bonusTargetLevel: 5,
      },
    ];

    expect(getRangerFavoredEnemyWarnings(character)).toContain(
      "Choose a different favored enemy at level 5.",
    );
  });
});

describe("spell catalog", () => {
  it("loads once and indexes class lists without changing their content", async () => {
    const count = spells.length;
    await Promise.all([loadSpellCatalog(), loadSpellCatalog()]);
    expect(spells.length).toBe(count);
    expect(count).toBeGreaterThan(700);
    expect(getClassSpells("wizard")).toEqual(spells.filter((spell) =>
      spell.classes.includes("wizard") && spell.source !== "dragonlance-user-pack",
    ));
    expect(getClassSpells("wizard")).toBe(getClassSpells("wizard"));
    expect(getClassSpells("cleric").some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
  });

  it("keeps multiclass spell slots tied to class level", () => {
    expect(baseSpellSlots("wizard", 1, 1)).toBe(1);
    expect(baseSpellSlots("wizard", 3, 2)).toBe(1);
    expect(baseSpellSlots("fighter", 5, 2)).toBe(0);
  });
});
