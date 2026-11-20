import { beforeAll, describe, expect, it } from "vitest";
import { abilityModifier, armorClass, beginLevelUp, beginPrestigeLevelUp, carryingCapacity, changeRace, classDefinitions, cloneCharacter, deityDefinitions, raceDefinitions,
  hitPointGain, initialCharacter, levelUpHitPointGain, nextClassLevel, sizeModifier, validateLevelUp,
  dragonlancePrestigeClasses, getEffectiveCharacterLevel, getTotalHitDice, isValidHitDieRoll,
  type Character,
  type PrestigeClassId,
  type FeatDefinition, type RangerFavoredEnemyChoice } from "../src/domain";
import { baseSpellSlots, featQualifies, getBaseAttackBonus, getBaseSave,
  getDailySpellSlots, getEquipmentArmorClass, getEquippedWeaponStats,
  getLevelUpAlignmentWarnings, getLevelUpSpellWarnings,
  getAvailableBonusLanguages, getClassFeatureDisplay, getClassFeatureSkillSynergy,
  getDragonlanceRangerPatron, getDragonlanceRangerWarnings,
  getDragonlanceDruidWarnings,
  getRangerFavoredEnemyBonus, getRangerFavoredEnemyChoiceLevels,
  getRangerFavoredEnemyLabel, getRangerFavoredEnemyWarnings,
  getChosenFeats, getCasterLevel,
  getLanguageBonusSlots, getCharacterLanguages, getRacialLanguages,
  getAvailableSpeakLanguages, getSpeakLanguageRankCount, getSpeakLanguageWarnings,
  getHumanRegionalLanguages, getAutomaticLanguages, getSkillAbility,
  getClericUndeadTurningMode, requiresManualClericUndeadTurningMode,
  getAvailableFeats, getFeatSlots, getChronologicalFeatSlots, getLevelUpSkillWarnings, getRacialSkillBonus,
  getAvailableSkillTricks, getAvailableSkillTrickGrants, getSkillTrickCountsByCategory,
  getSkillTrickGrantFeatSlots, getSkillTrickLimit,
  getLevelUpSkillSourceId, getPrestigeClassEligibilityErrors, getSkillPointsPerLevel,
  getKnightOfCrownHeroicInitiativeBonus,
  getDwarfStabilityBonus, getRacialSkillContextOptions, getRacialSpellLikeAbilities, getSkillCheckModifier, getSkillTotalTooltip,
  getRaceDefinitionForCharacter,
  getImprovedInitiativeBonus, getInitiativeModifier,
  getNewLevelUpFeatSlots, getSavingThrow, getSkillMaximum, getSpentSkillPoints,
  getAvailableSkillCount, getAvailableSkillCountForSource, getSpentSkillPointsForSource,
  getAvailableFeatSpellSchoolChoices, getFeatSpellSchoolSelectionWarnings,
  getAvailableFeatWeaponChoices,
  getPowerAttackLimit,
  isClassSkill, canIncreaseSkillRank,
  normalizeFeatSelections,
  normalizeFeatSpellSchoolSelections,
  getTwoWeaponAttackPenalty, alignmentDistance, isClericAlignmentAllowed,
  isClassAlignmentAllowed } from "../src/rules";
import { getMovement } from "../src/movementRules";
import { featCatalog, skills } from "../src/data/characterCatalog";
import { alternativeClassFeatures } from "../src/data/characterCatalog";
import { skillTrickCatalog } from "../src/data/skillTricks";
import { classFeatureDescriptions } from "../src/data/classFeatureDescriptions";
import { prestigeClassFeatureDescriptions } from "../src/data/prestigeClassFeatureDescriptions";
import { getClassSpells, getSpellLevelForClass, loadSpellCatalog, spells } from "../src/data/spellCatalog";
import { formatRaceDetails } from "../src/creationRules";
import { getConstitutionHitPointAdjustment, getEffectiveAbilityScore } from "../src/abilityEquipment";
import { srdSpells } from "../src/srdSpells";
import { dragonlanceSpells } from "../src/data/dragonlanceSpells";
import { clericDomains } from "../src/data/clericDomains";

beforeAll(loadSpellCatalog);

describe("skill trick rules", () => {
  const characterAtLevel = (level: number) => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level }];
    return character;
  };

  it("catalogs the 42 skill tricks by their sourcebook categories", () => {
    expect(skillTrickCatalog).toHaveLength(42);
    const categoryCounts = skillTrickCatalog.reduce<Record<string, number>>(
      (counts, trick) => ({
        ...counts,
        [trick.category]: (counts[trick.category] ?? 0) + 1,
      }),
      {},
    );
    expect(categoryCounts).toEqual({
      interaction: 6,
      manipulation: 12,
      mental: 7,
      movement: 17,
    });

  });

  it("enforces prerequisites for flexible, size-limited, feat, and proficiency tricks", () => {
    const character = characterAtLevel(8);
    Object.assign(character.skills, {
      "Knowledge (arcana)": 5,
      Bluff: 1,
      "Sleight of Hand": 8,
      Spellcraft: 8,
      "Escape Artist": 8,
      "Use Rope": 5,
    });
    const available = () =>
      new Set(getAvailableSkillTricks(character).map((trick) => trick.id));

    expect(available()).toContain("collector-of-stories");
    expect(available()).toContain("false-theurgy");
    expect(available()).toContain("easy-escape");
    expect(available()).not.toContain("hidden-blade");
    character.feats = ["quick-draw"];
    expect(available()).toContain("hidden-blade");

    const humanSize = raceDefinitions.human.size;
    raceDefinitions.human.size = "Large";
    character.race = "human";
    try {
      expect(available()).not.toContain("easy-escape");
    } finally {
      raceDefinitions.human.size = humanSize;
    }

    character.classLevels = [{ classId: "fighter", level: 8 }];
    expect(available()).not.toContain("whip-climber");
    character.featSelections = { "general-1": "exotic-weapon-proficiency" };
    character.featWeaponSelections = { "general-1": "Whip" };
    expect(available()).toContain("whip-climber");
  });

  it("enforces the character-level limit, one paid trick per level, and the two-point cost", () => {
    const character = characterAtLevel(4);
    character.skills.Jump = 5;
    character.skills.Tumble = 8;
    character.skillTricksByLevel = {
      1: [{ trickId: "extreme-leap", sourceId: "rogue" }],
      2: [{ trickId: "tumbling-crawl", sourceId: "rogue" }],
    };
    expect(getSkillTrickLimit(character)).toBe(2);
    expect(getAvailableSkillTricks(character)).toHaveLength(0);

    character.classLevels = [{ classId: "rogue", level: 5 }];
    expect(getSkillTrickLimit(character)).toBe(3);
    expect(getAvailableSkillTricks(character).length).toBeGreaterThan(0);
    character.skillTricksByLevel[5] = [
      { trickId: "nimble-stand", sourceId: "rogue" },
    ];
    expect(getAvailableSkillTricks(character)).toHaveLength(0);

    const withOnePaidTrick = characterAtLevel(3);
    withOnePaidTrick.skillTricksByLevel = {
      1: [{ trickId: "extreme-leap", sourceId: "rogue" }],
      2: [{ trickId: "healing-hands", featSlotId: "general-3" }],
    };
    const withoutTricks = characterAtLevel(3);
    expect(getSpentSkillPoints(withOnePaidTrick) - getSpentSkillPoints(withoutTricks))
      .toBe(2);
  });

  it("checks category prerequisites and grants up to two free tricks per feat", () => {
    const requirements = [
      ["cool-head", "mental", ["collector-of-stories", "listen-to-this"]],
      ["freerunner", "movement", ["extreme-leap", "nimble-stand"]],
      ["sure-hand", "manipulation", ["healing-hands", "hidden-blade"]],
      ["sweet-talker", "interaction", ["assume-quirk", "group-fake-out"]],
    ] as const;
    for (const [featId, category, trickIds] of requirements) {
      const character = characterAtLevel(6);
      character.skillTricksByLevel = {
        1: [{ trickId: trickIds[0], sourceId: "rogue" }],
        2: [{ trickId: trickIds[1], sourceId: "rogue" }],
      };
      const slot = getChronologicalFeatSlots(character).find(
        (candidate) => candidate.id === "general-6",
      );
      const feat = featCatalog.find((candidate) => candidate.id === featId);
      if (!slot || !feat)
        throw new Error(`Missing ${featId} skill trick feat fixture.`);
      expect(
        getSkillTrickCountsByCategory(character)[category],
      ).toBe(2);
      expect(featQualifies(character, feat, slot)).toBe(true);
    }

    const character = characterAtLevel(6);
    character.skills["Sleight of Hand"] = 8;
    character.skills.Heal = 5;
    character.skills["Escape Artist"] = 8;
    character.feats = ["quick-draw"];
    character.featSelections = { "general-6": "sure-hand" };
    character.skillTricksByLevel = {
      1: [{ trickId: "hidden-blade", sourceId: "rogue" }],
      2: [{ trickId: "sudden-draw", sourceId: "rogue" }],
    };
    expect(getSkillTrickLimit(character)).toBe(4);
    expect(
      getSkillTrickGrantFeatSlots(character).map((slot) => slot.slotId),
    ).toEqual(["general-6"]);
    expect(
      getAvailableSkillTrickGrants(character, "general-6").map(
        (trick) => trick.id,
      ),
    ).toContain("healing-hands");

    character.skillTricksByLevel[6] = [
      { trickId: "healing-hands", featSlotId: "general-6" },
      { trickId: "easy-escape", featSlotId: "general-6" },
    ];
    expect(getSkillTrickCountsByCategory(character).manipulation).toBe(4);
    expect(getAvailableSkillTrickGrants(character, "general-6")).toHaveLength(0);
    expect(getSpentSkillPoints(character)).toBe(
      getSpentSkillPoints({
        ...character,
        skillTricksByLevel: {
          1: [{ trickId: "hidden-blade", sourceId: "rogue" }],
          2: [{ trickId: "sudden-draw", sourceId: "rogue" }],
        },
      }),
    );
  });
});

describe("feat prerequisite loss", () => {
  it("disables a feat until its ability prerequisite returns without deleting the selection", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    character.abilities.str = 13;
    character.featSelections = { "general-1": "power-attack" };

    expect(getPowerAttackLimit(character)).toBe(1);
    character.abilities.str = 12;
    expect(getChosenFeats(character)).not.toContain("power-attack");
    expect(getPowerAttackLimit(character)).toBe(0);
    expect(
      normalizeFeatSelections(character, character.featSelections),
    ).toEqual({ "general-1": "power-attack" });

    character.abilities.str = 13;
    expect(getChosenFeats(character)).toContain("power-attack");
  });

  it("disables dependent feats when an earlier prerequisite feat becomes unusable", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 8 }];
    character.abilities.dex = 13;
    character.abilities.wis = 13;
    character.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "stunning-fist",
      "general-6": "fists-of-iron",
    };

    expect(getChosenFeats(character)).toContain("fists-of-iron");
    character.abilities.dex = 12;
    expect(getChosenFeats(character)).not.toContain("stunning-fist");
    expect(getChosenFeats(character)).not.toContain("fists-of-iron");
  });

  it("preserves Monk and Ranger class-feat prerequisite exceptions", () => {
    const monk = cloneCharacter(initialCharacter);
    monk.classLevels = [{ classId: "monk", level: 2 }];
    monk.abilities.dex = 8;
    monk.featSelections = { "monk-2": "deflect-arrows" };
    expect(getChosenFeats(monk)).toContain("deflect-arrows");

    const ranger = cloneCharacter(initialCharacter);
    ranger.classLevels = [{ classId: "ranger", level: 2 }];
    ranger.abilities.dex = 8;
    ranger.featSelections = { "ranger-style-2": "two-weapon-fighting" };
    expect(getChosenFeats(ranger)).toContain("two-weapon-fighting");
  });
});

function withCompletePrestigeProgression(id: PrestigeClassId, run: () => void) {
  const original = dragonlancePrestigeClasses[id];
  dragonlancePrestigeClasses[id] = {
    ...original,
    hitDie: 6,
    skillPoints: 2,
    baseAttackBonus: "poor",
    fortitude: "poor",
    reflex: "poor",
    will: "good",
    classSkills: ["Knowledge (arcana)"],
    maximumLevel: 10,
    levelUpEnabled: true,
  };
  try {
    run();
  } finally {
    dragonlancePrestigeClasses[id] = original;
  }
}

describe("Barbarian class rules", () => {
  it("matches the PHB attack, save, skill, and feature progressions", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Dwarf";

    for (let level = 1; level <= 20; level += 1) {
      character.classLevels = [{ classId: "barbarian", level }];
      expect(getBaseAttackBonus(character)).toBe(level);
      expect([
        getBaseSave(character, "fortitude"),
        getBaseSave(character, "reflex"),
        getBaseSave(character, "will"),
      ]).toEqual([
        2 + Math.floor(level / 2),
        Math.floor(level / 3),
        Math.floor(level / 3),
      ]);
    }

    for (const skill of [
      "Climb",
      "Craft",
      "Handle Animal",
      "Intimidate",
      "Jump",
      "Listen",
      "Ride",
      "Survival",
      "Swim",
    ]) {
      expect(isClassSkill(character, skill, "barbarian")).toBe(true);
    }
    expect(isClassSkill(character, "Spot", "barbarian")).toBe(false);
    expect(getSkillPointsPerLevel(character, "barbarian")).toBe(
      Math.max(1, 4 + abilityModifier(character.abilities.int)),
    );

    character.classLevels = [{ classId: "barbarian", level: 20 }];
    const features = getClassFeatureDisplay(character)
      .filter(({ source }) => source.startsWith("Barbarian "))
      .map(({ source, ability }) => [Number(source.slice(10)), ability]);
    expect(features).toEqual([
      [1, "Rage (1/day)"],
      [1, "Fast Movement"],
      [1, "Illiteracy"],
      [2, "Uncanny Dodge"],
      [3, "Trap Sense +1"],
      [4, "Rage (2/day)"],
      [5, "Improved Uncanny Dodge"],
      [6, "Trap Sense +2"],
      [7, "Damage Reduction 1/-"],
      [8, "Rage (3/day)"],
      [9, "Trap Sense +3"],
      [10, "Damage Reduction 2/-"],
      [11, "Greater Rage"],
      [12, "Rage (4/day)"],
      [12, "Trap Sense +4"],
      [13, "Damage Reduction 3/-"],
      [14, "Indomitable Will"],
      [15, "Trap Sense +5"],
      [16, "Damage Reduction 4/-"],
      [16, "Rage (5/day)"],
      [17, "Tireless Rage"],
      [18, "Trap Sense +6"],
      [19, "Damage Reduction 5/-"],
      [20, "Mighty Rage"],
      [20, "Rage (6/day)"],
    ]);

    expect(classFeatureDescriptions["Rage (1/day)"]).toContain("Once per encounter");
    expect(classFeatureDescriptions.Illiteracy).toContain("2 skill points");
    expect(classFeatureDescriptions["Fast Movement"]).toContain("medium load");
    expect(classFeatureDescriptions["Mighty Rage"]).toContain("+8 Constitution");
  });
});

describe("Fighter class rules", () => {
  it("matches the PHB Fighter progression for attacks, saves, skills, and bonus feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Dwarf";
    const fighterBonusFeatLevels = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

    for (let level = 1; level <= 20; level += 1) {
      character.classLevels = [{ classId: "fighter", level }];
      expect(getBaseAttackBonus(character)).toBe(level);
      expect([
        getBaseSave(character, "fortitude"),
        getBaseSave(character, "reflex"),
        getBaseSave(character, "will"),
      ]).toEqual([
        2 + Math.floor(level / 2),
        Math.floor(level / 3),
        Math.floor(level / 3),
      ]);
      expect(
        getFeatSlots(character)
          .filter((slot) => slot.fighterOnly)
          .map((slot) => Number(slot.id?.slice("fighter-".length))),
      ).toEqual(fighterBonusFeatLevels.filter((featLevel) => featLevel <= level));
    }

    for (const skill of [
      "Climb",
      "Craft",
      "Handle Animal",
      "Intimidate",
      "Jump",
      "Ride",
      "Swim",
    ]) {
      expect(isClassSkill(character, skill, "fighter")).toBe(true);
    }
    expect(isClassSkill(character, "Spot", "fighter")).toBe(false);
    expect(getSkillPointsPerLevel(character, "fighter")).toBe(
      Math.max(1, 2 + abilityModifier(character.abilities.int)),
    );

    character.classLevels = [{ classId: "fighter", level: 1 }];
    expect(getAvailableSkillCountForSource(character, "fighter")).toBe(
      4 * Math.max(1, 2 + abilityModifier(character.abilities.int)),
    );
  });

  it("requires BAB +1 and does not allow Martial Weapon Proficiency as a Fighter bonus feat", () => {
    const feat = featCatalog.find(
      (candidate) => candidate.id === "martial-weapon-proficiency",
    );
    if (!feat) throw new Error("Missing Martial Weapon Proficiency fixture.");

    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 1 }];
    expect(featQualifies(character, feat, { fighterOnly: false })).toBe(false);

    character.classLevels = [{ classId: "wizard", level: 3 }];
    expect(featQualifies(character, feat, { fighterOnly: true })).toBe(false);
    expect(featQualifies(character, feat, { fighterOnly: false })).toBe(true);
  });
});

describe("provided-book feat inventory", () => {
  it("represents the DMG race examples and DMG-only Blackguard spell", () => {
    expect(raceDefinitions["gold-dwarf"].sourceBook).toBe(
      "Dungeon Master's Guide (3.5)",
    );
    expect(raceDefinitions["half-human-elf"].sourceBook).toBe(
      "Dungeon Master's Guide (3.5)",
    );
    expect(raceDefinitions["gold-dwarf"]).toMatchObject({
      abilityModifiers: { con: 2, dex: -2 },
      racialAttackBonuses: { aberration: 1 },
    });
    expect(raceDefinitions["half-human-elf"]).toMatchObject({
      racialSkillBonuses: { Listen: 1, Search: 1, Spot: 1 },
      racialWeaponProficiencies: [
        "Longsword", "Rapier", "Shortbow", "Longbow",
      ],
    });
    expect(raceDefinitions["half-human-elf"].racialSkillBonuses).not
      .toHaveProperty("Diplomacy");
    expect(raceDefinitions["half-human-elf"].racialSkillBonuses).not
      .toHaveProperty("Gather Information");
    expect(srdSpells.filter(
      (spell) => spell.sourceBook === "Dungeon Master's Guide (3.5)",
    ).map((spell) => spell.name)).toEqual(["Corrupt Weapon"]);
  });

  it("represents the first MM I monster-PC batch with racial HD and ECL", () => {
    const mm1Races = Object.values(raceDefinitions).filter(
      (race) => race.sourceBook === "Monster Manual I (3.5)",
    );
    expect(mm1Races).toHaveLength(33);
    expect(mm1Races.map((race) => race.name)).toEqual(expect.arrayContaining([
      "Goblin", "Kobold", "Orc", "Aasimar", "Tiefling", "Duergar",
      "Hobgoblin", "Drow", "Svirfneblin", "Bugbear", "Gnoll",
      "Lizardfolk", "Centaur", "Githyanki", "Githzerai", "Ogre",
      "Troglodyte", "Minotaur", "Satyr", "Kuo-toa", "Pixie",
      "Gargoyle", "Troll", "Yuan-ti Pureblood", "Yuan-ti Halfblood",
      "Drider", "Hill Giant", "Janni", "Mind Flayer", "Ogre Mage",
      "Afflicted Lycanthrope", "Natural Lycanthrope", "Vampire",
    ]));
    expect(raceDefinitions["mm1-bugbear"]).toMatchObject({
      levelAdjustment: 1,
      racialHitDice: { count: 3, hitDie: 8, baseAttackBonus: "medium" },
    });
    expect(raceDefinitions["mm1-ogre"]).toMatchObject({
      levelAdjustment: 2,
      racialHitDice: { count: 4, hitDie: 8, fortitude: "good" },
    });
    expect(raceDefinitions["mm1-githzerai"].racialSpellLikeAbilities)
      .toContainEqual(expect.objectContaining({ name: "Shatter", usesPerDay: 3 }));
    expect(raceDefinitions["mm1-hill-giant"].racialHitDice).toMatchObject({
      count: 12, hitDie: 8, fortitude: "good",
    });
    expect(raceDefinitions["mm1-vampire"]).toMatchObject({
      levelAdjustment: 8,
      racialNaturalArmorBonus: 6,
    });
    expect(raceDefinitions["mm1-afflicted-lycanthrope"].traits)
      .toContainEqual(expect.stringContaining("Control Shape"));
    const bugbear = cloneCharacter(initialCharacter);
    bugbear.race = "Bugbear";
    expect(getRaceDefinitionForCharacter(bugbear)).toBe(raceDefinitions["mm1-bugbear"]);
    const centaur = cloneCharacter(initialCharacter);
    centaur.race = "Centaur";
    centaur.ruleset = "dragonlance-monster-classes";
    expect(getRaceDefinitionForCharacter(centaur)).toBe(raceDefinitions.centaur);
  });

  it("certifies the represented PHB player-option inventory", () => {
    const phbRaces = Object.values(raceDefinitions).filter(
      (race) => race.sourceBook === "Player's Handbook (3.5)",
    );
    const phbClasses = Object.values(classDefinitions).filter(
      (definition) => definition.sourceBook === "Player's Handbook (3.5)",
    );
    const phbFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Player's Handbook (3.5)",
    );
    const phbSpellRecords = srdSpells.filter((spell) => !spell.sourceBook);
    const phbSpellTitles = new Set(
      phbSpellRecords.map((spell) => spell.name.replace(/\s+/g, " ").trim()),
    );

    expect(phbRaces.map((race) => race.name).sort()).toEqual([
      "Dwarf", "Elf", "Gnome", "Half-elf", "Half-orc", "Halfling", "Human",
    ]);
    expect(phbRaces.every((race) => race.selectable !== false)).toBe(true);
    expect(phbClasses.map((definition) => definition.name).sort()).toEqual([
      "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin",
      "Ranger", "Rogue", "Sorcerer", "Wizard",
    ]);
    expect(phbFeats).toHaveLength(109);
    expect(phbSpellRecords).toHaveLength(715);
    expect(phbSpellTitles).toHaveLength(605);
  });

  it("certifies Dragonlance races, classes, feats, spells, and deity eligibility", () => {
    const dlRaces = Object.values(raceDefinitions).filter(
      (race) =>
        race.source === "dragonlance-user-pack" &&
        race.selectable !== false &&
        race.sourceBook === "Dragonlance Campaign Setting (3.5)",
    );
    expect(dlRaces.map((race) => race.name)).toEqual(expect.arrayContaining([
      "Kender", "Baaz Draconian", "Kapak Draconian", "Qualinesti Elf",
      "Silvanesti Elf", "Kagonesti Elf", "Dargonesti Elf", "Dimernesti Elf",
      "Krynn Half-Elf", "Hill Dwarf", "Mountain Dwarf", "Dark Dwarf",
      "Gully Dwarf", "Krynn Gnome", "Mad Gnome", "Centaur", "Ogre",
      "Half-Ogre", "Minotaur", "Irda",
    ]));
    expect(raceDefinitions.minotaur.levelAdjustment).toBeUndefined();
    expect(raceDefinitions.centaur.racialHitDice).toMatchObject({ count: 4, hitDie: 8 });
    expect(raceDefinitions.ogre.racialHitDice).toMatchObject({ count: 4, hitDie: 8 });
    expect(raceDefinitions["half-ogre"]).toMatchObject({ levelAdjustment: 1, size: "Medium" });
    const krynnGnome = cloneCharacter(initialCharacter);
    krynnGnome.ruleset = "dragonlance-user-pack";
    krynnGnome.race = "Krynn Gnome";
    expect(getAutomaticLanguages(krynnGnome)).toEqual(["Common", "Gnome"]);
    const centaurCharacter = cloneCharacter(initialCharacter);
    centaurCharacter.ruleset = "dragonlance-monster-classes";
    centaurCharacter.race = "Centaur";
    expect(getAutomaticLanguages(centaurCharacter)).toEqual(["Common", "Sylvan"]);
    expect(getTotalHitDice(centaurCharacter)).toBe(5);
    expect(getEffectiveCharacterLevel(centaurCharacter)).toBe(7);

    expect(Object.values(classDefinitions)
      .filter((definition) => definition.sourceBook === "Dragonlance Campaign Setting (3.5)")
      .map((definition) => definition.name)).toEqual(["Mystic", "Noble"]);
    expect(featCatalog.filter((feat) =>
      feat.sourceBook === "Dragonlance Campaign Setting (3.5)",
    )).toHaveLength(13);
    expect(dragonlanceSpells.filter((spell) =>
      spell.sourceBook?.startsWith("Dragonlance Campaign Setting"),
    )).toHaveLength(26);
    expect(Object.values(clericDomains).filter(
      (domain) => "source" in domain && domain.source === "dragonlance-user-pack",
    )).toHaveLength(10);
    expect(Object.values(dragonlancePrestigeClasses).filter((prestige) =>
      prestige.sourceBook === "Dragonlance Campaign Setting (3.5)" &&
      !["white-robed-wizard", "red-robed-wizard", "black-robed-wizard"].includes(prestige.id),
    )).toHaveLength(12);

    const dragonlanceDeities = deityDefinitions.filter(
      (deity) => deity.sourceBook === "Dragonlance Campaign Setting",
    );
    expect(dragonlanceDeities).toHaveLength(21);
    expect(dragonlanceDeities.find((deity) => deity.id === "branchala"))
      .toMatchObject({ clericAlignments: ["Chaotic Good", "Chaotic Neutral", "Neutral Good"] });
    expect(dragonlanceDeities.find((deity) => deity.id === "solinari")?.clericDomains)
      .toEqual([]);
    expect(dragonlanceDeities.find((deity) => deity.id === "paladine")?.clericAlignments)
      .toEqual([]);
  });

  it("catalogs the PHB II alternatives, feats, and spell records", () => {
    expect(Object.values(classDefinitions).filter(
      (definition) => definition.sourceBook === "Player's Handbook II",
    ).map((definition) => definition.name)).toEqual([
      "Beguiler", "Dragon Shaman", "Duskblade", "Knight",
    ]);
    expect(alternativeClassFeatures).toHaveLength(21);
    expect(new Set(alternativeClassFeatures.map((feature) => feature.name)).size).toBe(21);
    const phb2Spells = spells.filter((spell) =>
      spell.sourceBook === "Player's Handbook II",
    );
    expect(phb2Spells).toHaveLength(124);
    expect(featCatalog.filter(
      (feat) => feat.sourceBook === "Player's Handbook II (3.5)",
    )).toHaveLength(105);
    expect(Object.values(raceDefinitions).filter(
      (race) => race.sourceBook === "Player's Handbook II",
    )).toHaveLength(0);
    expect(phb2Spells.filter((spell) => spell.classes.includes("beguiler")))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Rouse", classLevels: expect.objectContaining({ beguiler: 1 }) }),
        expect.objectContaining({ name: "Whelming Blast", classLevels: expect.objectContaining({ beguiler: 2 }) }),
        expect.objectContaining({ name: "Overwhelm", classLevels: expect.objectContaining({ beguiler: 6 }) }),
      ]));
    expect(getClassSpells("beguiler")).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Charm Person", level: 1 }),
      expect.objectContaining({ name: "Mirror Image", level: 2 }),
      expect.objectContaining({ name: "Dispel Magic", level: 3 }),
      expect.objectContaining({ name: "Mind Blank", level: 8 }),
      expect.objectContaining({ name: "Time Stop", level: 9 }),
    ]));
    expect(spells.filter((spell) =>
      spell.sourceBook?.startsWith("Player's Handbook II") &&
      spell.classes.includes("duskblade"),
    ))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Blade of Blood", classLevels: expect.objectContaining({ duskblade: 1 }) }),
        expect.objectContaining({ name: "Sonic Shield", classLevels: expect.objectContaining({ duskblade: 5 }) }),
        expect.objectContaining({ name: "Swift Fly", classLevels: expect.objectContaining({ duskblade: 2 }) }),
      ]));
    expect(getClassSpells("duskblade")).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Acid Splash", level: 0 }),
      expect.objectContaining({ name: "Magic Weapon", level: 1 }),
      expect.objectContaining({ name: "Interposing Hand", level: 4 }),
      expect.objectContaining({ name: "Chain Lightning", level: 5 }),
    ]));
    const knight = cloneCharacter(initialCharacter);
    knight.classLevels = [{ classId: "knight", level: 15 }];
    expect(getFeatSlots(knight).filter((slot) => slot.id.startsWith("knight-"))
      .map((slot) => slot.id)).toEqual(["knight-5", "knight-10", "knight-15"]);
    expect(getAvailableFeatWeaponChoices(knight, "weapon-focus", "knight-5"))
      .toEqual(["Lance"]);
    const alternativeFighter = cloneCharacter(initialCharacter);
    alternativeFighter.classLevels = [{ classId: "fighter", level: 16 }];
    alternativeFighter.alternativeClassFeatures = {
      fighter: ["Elusive Attack", "Counterattack", "Overpowering Attack"],
    };
    expect(getFeatSlots(alternativeFighter).filter((slot) =>
      ["fighter-6", "fighter-12", "fighter-16"].includes(slot.id),
    )).toEqual([]);
    expect(getChosenFeats({
      ...knight,
      classLevels: [{ classId: "duskblade", level: 2 }],
    })).toContain("combat-casting");
    const dragonShaman = cloneCharacter(initialCharacter);
    dragonShaman.classLevels = [{ classId: "dragon-shaman", level: 1 }];
    dragonShaman.alignment = "Neutral Good";
    dragonShaman.dragonShamanTotem = "Gold";
    dragonShaman.dragonShamanAuras = ["Power", "Toughness", "Vigor"];
    expect(getLevelUpAlignmentWarnings(dragonShaman, "dragon-shaman")).toEqual([]);
    expect(getClassFeatureDisplay(dragonShaman).map(({ ability }) => ability))
      .toContain("Totem Dragon: Gold");
    expect(getClassFeatureDisplay(dragonShaman).map(({ ability }) => ability))
      .toContain("Draconic Auras: Power, Toughness, Vigor");
    expect(isClassSkill(dragonShaman, "Disguise", "dragon-shaman")).toBe(true);
    expect(isClassSkill(dragonShaman, "Appraise", "dragon-shaman")).toBe(false);
    const beguilerOriginal = cloneCharacter(initialCharacter);
    beguilerOriginal.abilities.int = 14;
    beguilerOriginal.classLevels = [{ classId: "beguiler", level: 2 }];
    const beguilerLevelThree = cloneCharacter(beguilerOriginal);
    beguilerLevelThree.classLevels = [{ classId: "beguiler", level: 3 }];
    expect(getLevelUpSpellWarnings(beguilerOriginal, beguilerLevelThree))
      .toContain("Choose exactly 1 Advanced Learning spell.");
    beguilerLevelThree.beguilerAdvancedLearning = ["Ventriloquism"];
    expect(getLevelUpSpellWarnings(beguilerOriginal, beguilerLevelThree)).toEqual([]);

    const barbarian = cloneCharacter(initialCharacter);
    barbarian.classLevels = [{ classId: "barbarian", level: 1 }];
    barbarian.alternativeClassFeatures = { barbarian: ["Berserker Strength"] };
    expect(getClassFeatureDisplay(barbarian)).toContainEqual(expect.objectContaining({
      ability: "Berserker Strength",
    }));
    expect(getClassFeatureDisplay(barbarian)).not.toContainEqual(expect.objectContaining({
      ability: "Rage",
    }));
  });

  it("includes the current Complete Divine class, domain, feat, and spell inventory", () => {
    const completeDivineClasses = Object.values(classDefinitions).filter(
      (definition) => definition.sourceBook === "Complete Divine (3.5)",
    );
    expect(completeDivineClasses.map(({ name }) => name)).toEqual([
      "Favored Soul", "Shugenja", "Spirit Shaman",
    ]);
    expect(Object.values(dragonlancePrestigeClasses).filter(
      (definition) => definition.sourceBook?.startsWith("Complete Divine (3.5)"),
    )).toHaveLength(24);
    const completeDivineSpells = spells.filter(
      (spell) => spell.sourceBook === "Complete Divine (3.5)",
    );
    expect(completeDivineSpells).toHaveLength(127);
    expect(completeDivineSpells.map((spell) => spell.name)).toEqual(
      expect.arrayContaining(["Otyugh Swarm", "Plague of Rats", "Scourge", "Unbinding"]),
    );
    for (const domainId of [
      "celerity", "cold", "competition", "creation", "domination", "dream",
      "force", "glory", "inquisition", "madness", "mind", "mysticism",
      "oracle", "pact", "purification", "summoner", "weather",
    ] as const) expect(clericDomains[domainId].spells).toHaveLength(9);
    expect(featCatalog.filter(
      (feat) => feat.sourceBook === "Complete Divine (3.5)",
    ).map((feat) => feat.id)).toEqual(expect.arrayContaining([
      "extra-wild-shape", "pious-defense", "bonus-domain", "zone-of-animation",
    ]));
  });

  const normalizeFeatName = (name: string) => name.replace(/[’']/g, "'");
  const completeAdventurerFeats = new Set(
    [
      "Appraise Magic Value",
      "Ascetic Hunter",
      "Ascetic Knight",
      "Ascetic Mage",
      "Ascetic Rogue",
      "Brachiation",
      "Brutal Throw",
      "Power Throw",
      "Combat Intuition",
      "Danger Sense",
      "Death Blow",
      "Deft Opportunist",
      "Deft Strike",
      "Devoted Inquisitor",
      "Devoted Performer",
      "Devoted Tracker",
      "Disguise Spell",
      "Dive for Cover",
      "Dual Strike",
      "Expert Tactician",
      "Extra Music",
      "Extraordinary Concentration",
      "Extraordinary Spell Aim",
      "Force of Personality",
      "Goad",
      "Green Ear",
      "Hear the Unseen",
      "Improved Diversion",
      "Improved Flight",
      "Improved Swimming",
      "Insightful Reflexes",
      "Jack of All Trades",
      "Leap Attack",
      "Lingering Song",
      "Mobile Spellcasting",
      "Natural Bond",
      "Obscure Lore",
      "Open Minded",
      "Oversized Two-Weapon Fighting",
      "Quick Reconnoiter",
      "Razing Strike",
      "Staggering Strike",
      "Subsonics",
      "Tactile Trapsmith",
      "Versatile Performer",
      "Chant of Fortitude",
      "Ironskin Chant",
      "Lyric Spell",
      "Blindsense",
      "Climb Like an Ape",
      "Cougar’s Vision",
      "Hawk’s Vision",
      "Savage Grapple",
      "Scent",
    ].map(normalizeFeatName),
  );
  const completeScoundrelFeats = new Set(
    [
      "Ascetic Stalker",
      "Cool Head",
      "Daredevil Athlete",
      "Daring Outlaw",
      "Daring Warrior",
      "Deadly Defense",
      "Expanded Ki Pool",
      "Enduring Ki",
      "Freerunner",
      "Improved Familiar",
      "Improved Skirmish",
      "Martial Stalker",
      "Master Spellthief",
      "Poison Expert",
      "Poison Master",
      "Psithief",
      "Savvy Rogue",
      "Sure Hand",
      "Sweet Talker",
      "Swift Ambusher",
      "Swift Hunter",
      "Concussion Attack",
      "Deafening Strike",
      "Disemboweling Strike",
      "Eldritch Erosion",
      "Head Shot",
      "Impeding Attack",
      "Merciful Strike",
      "Mind Drain",
      "Persistent Attacker",
      "Throat Punch",
      "Chant of the Long Road",
      "Chord of Distraction",
      "Epic of the Lost King",
      "Sound of Silence",
      "Warning Shout",
      "Advantageous Avoidance",
      "Better Lucky than Good",
      "Dumb Luck",
      "Fortuitous Strike",
      "Good Karma",
      "Healer's Luck",
      "Lucky Break",
      "Lucky Catch",
      "Lucky Fingers",
      "Lucky Start",
      "Magical Fortune",
      "Make Your Own Luck",
      "Miser's Fortune",
      "Psychic Luck",
      "Sly Fortune",
      "Survivor's Luck",
      "Tempting Fate",
      "Unbelievable Luck",
      "Victor's Luck",
      "Third Time’s the Charm",
    ].map(normalizeFeatName),
  );
  const completeChampionFeats = new Set(
    [
      "Battle Blessing",
      "Spontaneous Domains",
      "Swift Call",
      "Retrieve Spell",
      "Spiritual Counter",
      "Air Devotion",
      "Animal Devotion",
      "Chaos Devotion",
      "Death Devotion",
      "Destruction Devotion",
      "Earth Devotion",
      "Evil Devotion",
      "Fire Devotion",
      "Good Devotion",
      "Healing Devotion",
      "Knowledge Devotion",
      "Law Devotion",
      "Luck Devotion",
      "Magic Devotion",
      "Plant Devotion",
      "Protection Devotion",
      "Retrieve Spell",
      "Spiritual Counter",
      "Spontaneous Domains",
      "Strength Devotion",
      "Sun Devotion",
      "Travel Devotion",
      "Trickery Devotion",
      "War Devotion",
      "Water Devotion",
      "Imbued Healing",
      "Charnel Miasma",
      "Fragile Construct",
      "Holy Warrior",
      "Mitigate Suffering",
      "Protective Ward",
      "Touch of Healing",
      "Umbral Shroud",
      "Awesome Smite",
      "Bestial Charge",
      "Holy Potency",
      "Elemental Essence",
      "Great and Small",
      "Swift Wild Shape",
      "Venom’s Gift",
    ].map(normalizeFeatName),
  );
  const completeDivineTableFeats = new Set(
    [
      "Arcane Disciple",
      "Augment Healing",
      "Domain Focus",
      "Empower Turning",
      "Improved Smiting",
      "Practiced Spellcaster",
      "Quicken Turning",
      "Spell Focus (Chaos, Evil, Good, Law)",
      "Spontaneous Healer",
      "Spontaneous Summoner",
      "Spontaneous Wounder",
      "Disciple of the Sun",
      "Divine Metamagic",
      "Divine Spell Power",
      "Glorious Weapons",
      "Domain Spontaneity",
      "Elemental Smiting",
      "Elemental Healing",
      "Profane Boost",
      "Sacred Boost",
      "Sacred Healing",
      "True Believer",
      "Sanctify Relic",
      "Consecrate Spell",
      "Corrupt Spell",
      "Rapid Spell",
      "Reach Spell",
      "Transdimensional Spell",
      "Boar’s Ferocity",
      "Cheetah’s Speed",
      "Eagle’s Wings",
      "Elephant’s Hide",
    ].map(normalizeFeatName),
  );
  const completeArcaneTableFeats = new Set(
    [
      "Arcane Defense",
      "Arcane Mastery",
      "Arcane Preparation",
      "Battle Caster",
      "Communicator",
      "Double Wand Wielder",
      "Extra Edge",
      "Extra Invocation",
      "Extra Slot",
      "Extra Spell",
      "Extra Spell Secret",
      "Guardian Spirit",
      "Heighten Spell-Like Ability",
      "Innate Spell",
      "Insightful",
      "Mage Slayer",
      "Maximize Spell-Like Ability",
      "Necropolis Born",
      "Night Haunt",
      "Obtain Familiar",
      "Pierce Magical Concealment",
      "Pierce Magical Protection",
      "Practiced Spellcaster",
      "Ranged Spell Specialization",
      "Reckless Wand Wielder",
      "Soul of the North",
      "Spell Hand",
      "Touch Spell Specialization",
      "Wandstrike",
      "Draconic Breath",
      "Draconic Claw",
      "Draconic Flight",
      "Draconic Heritage",
      "Draconic Legacy",
      "Draconic Power",
      "Draconic Presence",
      "Draconic Resistance",
      "Draconic Skin",
      "Craft Contingent Spell",
      "Black Lore of Moil",
      "Born of the Three Thunders",
      "Chain Spell",
      "Cooperative Spell",
      "Delay Spell",
      "Energy Admixture",
      "Energy Substitution",
      "Explosive Spell",
      "Fortify Spell",
      "Lord of the Uttercold",
      "Nonlethal Substitution",
      "Persistent Spell",
      "Repeat Spell",
      "Sanctum Spell",
      "Sculpt Spell",
      "Split Ray",
      "Sudden Empower",
      "Sudden Extend",
      "Sudden Maximize",
      "Sudden Quicken",
      "Sudden Silent",
      "Sudden Still",
      "Sudden Widen",
      "Transdimensional Spell",
      "Twin Spell",
    ].map(normalizeFeatName),
  );
  const completeArcaneUnrepresentedFeats = new Set<string>();
  const completeMageFeats = new Set(
    [
      "Alacritous Cogitation",
      "Captivating Melody",
      "Cloudy Conjuration",
      "Dazzling Illusion",
      "Defending Spirit",
      "Delay Potion",
      "Elemental Adept",
      "Energy Abjuration",
      "Favored Magic Foe",
      "Fearsome Necromancy",
      "Hasty Spirit",
      "Insightful Divination",
      "Magic Device Attunement",
      "Master of Undeath",
      "Melodic Casting",
      "Metamagic School Focus",
      "Metamagic Spell Trigger",
      "Piercing Evocation",
      "Ranged Recall",
      "Rapid Metamagic",
      "Somatic Weaponry",
      "Toughening Transmutation",
      "Unsettling Enchantment",
      "Vengeful Spirit",
      "Retributive Spell",
      "Fey Heritage",
      "Fey Legacy",
      "Fey Power",
      "Fey Presence",
      "Fey Skin",
      "Fiendish Heritage",
      "Fiendish Legacy",
      "Fiendish Power",
      "Fiendish Presence",
      "Fiendish Resistance",
      "Acidic Splatter",
      "Aquatic Breath",
      "Blade of Force",
      "Borne Aloft",
      "Clap of Thunder",
      "Clutch of Earth",
      "Dimensional Jaunt",
      "Dimensional Reach",
      "Drowning Glance",
      "Face-Changer",
      "Fiery Burst",
      "Hurricane Breath",
      "Invisible Needle",
      "Magic Disruption",
      "Magic Sensitive",
      "Minor Shapeshift",
      "Mystic Backlash",
      "Shadow Veil",
      "Sickening Grasp",
      "Storm Bolt",
      "Summon Elemental",
      "Sunlight Eyes",
      "Touch of Distraction",
      "Wind-Guided Arrows",
      "Winter's Blast",
      "Battlecaster Defense",
      "Battlecaster Offense",
      "Energy Gestalt",
      "Metamagic Vigor",
      "Residual Magic",
    ].map(normalizeFeatName),
  );
  const playerHandbookIIFeats = new Set(
    [
      "Acrobatic Strike",
      "Arcane Flourish",
      "Arcane Accompaniment",
      "Arcane Thesis",
      "Arcane Toughness",
      "Arcane Consumption",
      "Armor Specialization",
      "Battle Dancer",
      "Bonded Familiar",
      "Bounding Assault",
      "Rapid Blitz",
      "Brutal Strike",
      "Combat Acrobat",
      "Combat Familiar",
      "Lurking Familiar",
      "Combat Tactician",
      "Cometary Collision",
      "Companion Spellbond",
      "Crossbow Sniper",
      "Cunning Evasion",
      "Dampen Spell",
      "Deadeye Shot",
      "Defensive Sweep",
      "Elven Spell Lore",
      "Fade into Violence",
      "Fiery Fist",
      "Fiery Ki Defense",
      "Ki Blast",
      "Flay",
      "Grenadier",
      "Hindering Opportunist",
      "Stalwart Defense",
      "Indomitable Soul",
      "Intimidating Strike",
      "Keen-Eared Scout",
      "Leap of the Heavens",
      "Lunging Strike",
      "Mad Foam Rager",
      "Master Manipulator",
      "Melee Evasion",
      "Melee Weapon Mastery",
      "Crushing Strike",
      "Driving Attack",
      "Slashing Flurry",
      "Weapon Supremacy",
      "Overwhelming Assault",
      "Penetrating Shot",
      "Ranged Weapon Mastery",
      "Robilar's Gambit",
      "Shield Specialization",
      "Active Shield Defense",
      "Agile Shield Fighter",
      "Shield Sling",
      "Shield Ward",
      "Short Haft",
      "Spectral Skirmisher",
      "Spell-Linked Familiar",
      "Steadfast Determination",
      "Telling Blow",
      "Trophy Collector",
      "Tumbling Feint",
      "Two-Weapon Pounce",
      "Two-Weapon Rend",
      "Vatic Gaze",
      "Versatile Unarmed Strike",
      "Vexing Flanker",
      "Adaptable Flanker",
      "Wanderer's Diplomacy",
      "Water Splitting Stone",
      "Ritual Blessing",
      "Ritual Blood Bonds",
      "Combat Focus",
      "Combat Stability",
      "Combat Defense",
      "Combat Vigor",
      "Combat Awareness",
      "Combat Strike",
      "Divine Armor",
      "Divine Fortune",
      "Divine Justice",
      "Divine Ward",
      "Profane Aura",
      "Sacred Healing",
      "Sacred Purification",
      "Sacred Radiance",
      "Celestial Sorcerer Heritage",
      "Celestial Sorcerer Aura",
      "Celestial Sorcerer Lance",
      "Celestial Sorcerer Wings",
      "Celestial Sorcerer Lore",
      "Infernal Sorcerer Heritage",
      "Infernal Sorcerer Eyes",
      "Infernal Sorcerer Howl",
      "Infernal Sorcerer Resistance",
      "Blistering Spell",
      "Earthbound Spell",
      "Flash Frost Spell",
      "Imbued Summoning",
      "Smiting Spell",
      "Blood-Spiked Charger",
      "Combat Cloak Expert",
      "Combat Panache",
      "Einhander",
      "Mad Alchemist",
      "Shadow Striker",
    ].map(normalizeFeatName),
  );
  const dungeonMastersGuideIIFeats = new Set(
    [
      "Apprentice",
      "Mentor",
      "Business Savvy",
      "Favored in Guild",
      "Guildmaster",
      "Truebond",
    ].map(normalizeFeatName),
  );
  const completeWarriorFeats = new Set(
    [
      "Arcane Strike",
      "Arterial Strike",
      "Axiomatic Strike",
      "Clever Wrestling",
      "Close-Quarters Fighting",
      "Dash",
      "Defensive Strike",
      "Defensive Throw",
      "Destructive Rage",
      "Earth’s Embrace",
      "Eagle Claw Attack",
      "Extend Rage",
      "Extra Rage",
      "Extra Smiting",
      "Extra Stunning",
      "Eyes in the Back of Your Head",
      "Faster Healing",
      "Favored Power Attack",
      "Fists of Iron",
      "Fleet of Foot",
      "Flick of the Wrist",
      "Flying Kick",
      "Freezing the Lifeblood",
      "Greater Resiliency",
      "Greater Two-Weapon Defense",
      "Hamstring",
      "Hold the Line",
      "Improved Buckler Defense",
      "Improved Combat Expertise",
      "Improved Familiar",
      "Improved Favored Enemy",
      "Improved Mounted Archery",
      "Improved Rapid Shot",
      "Improved Toughness",
      "Improved Two-Weapon Defense",
      "Improved Weapon Familiarity",
      "Instantaneous Rage",
      "Intimidating Rage",
      "Karmic Strike",
      "Kiai Shout",
      "Greater Kiai Shout",
      "Monkey Grip",
      "Pain Touch",
      "Phalanx Fighting",
      "Pin Shield",
      "Power Critical",
      "Prone Attack",
      "Ranged Disarm",
      "Ranged Pin",
      "Ranged Sunder",
      "Rapid Stunning",
      "Roundabout Kick",
      "Sharp-Shooting",
      "Shield Charge",
      "Shield Slam",
      "Swarmfighting",
      "Throw Anything",
      "Weakening Touch",
      "Zen Archery",
      "Dash",
      "Divine Cleansing",
      "Divine Resistance",
      "Divine Might",
      "Divine Shield",
      "Divine Vigor",
      "Sacred Vengeance",
      "Cavalry Charger",
      "Combat Brute",
      "Elusive Target",
      "Formation Expert",
      "Giantbane",
      "Raptor School",
      "Shock Trooper",
      "Sun School",
      "Anvil of Thunder",
      "Bear Fang",
      "Crescent Moon",
      "Hammer’s Edge",
      "High Sword Low Axe",
      "Lightning Mace",
      "Net and Trident",
      "Quick Staff",
      "Spinning Halberd",
      "Three Mountains",
    ].map(normalizeFeatName),
  );
  const monsterManualIVFeats = new Set(
    [
      "Ability Focus",
      "Awesome Blow",
      "Clinging Breath",
      "Craft Construct",
      "Flyby Attack",
      "Githyanki Battlecaster",
      "Githyanki Dragonrider",
      "Improved Natural Attack",
      "Improved Toughness",
      "Lingering Breath",
      "Multiattack",
      "Powerful Charge",
      "Quicken Spell-Like Ability",
    ].map(normalizeFeatName),
  );
  const monsterManualVFeats = new Set(
    [
      "Ability Focus",
      "Awesome Blow",
      "Empower Spell-Like Ability",
      "Flyby Attack",
      "Hover",
      "Improved Natural Attack",
      "Improved Toughness",
      "Multiattack",
      "Powerful Charge",
      "Quicken Spell-Like Ability",
      "Snatch",
      "Wingover",
    ].map(normalizeFeatName),
  );
  const monsterManualVSidebarFeats = new Set(
    [
      "Daunting Presence",
      "Battle Magic Tactics",
      "Mage Slayer",
      "Kuo-Toan Monasticism",
      "Mind-Shattering Strike",
      "Sense Quintessence",
      "Brutal Throw",
    ].map(normalizeFeatName),
  );

  it("matches the Complete Adventurer feat-table overlap", () => {
    const representedNames = featCatalog
      .filter((feat) => completeAdventurerFeats.has(normalizeFeatName(feat.name)))
      .map((feat) => feat.name)
      .sort();
    expect(completeAdventurerFeats.size).toBe(54);
    expect(representedNames).toEqual([
      "Appraise Magic Value",
      "Ascetic Hunter",
      "Ascetic Knight",
      "Ascetic Mage",
      "Ascetic Rogue",
      "Blindsense",
      "Brachiation",
      "Brutal Throw",
      "Chant of Fortitude",
      "Climb Like an Ape",
      "Combat Intuition",
      "Cougar's Vision",
      "Danger Sense",
      "Death Blow",
      "Deft Opportunist",
      "Deft Strike",
      "Devoted Inquisitor",
      "Devoted Performer",
      "Devoted Tracker",
      "Disguise Spell",
      "Dive for Cover",
      "Dual Strike",
      "Expert Tactician",
      "Extra Music",
      "Extraordinary Concentration",
      "Extraordinary Spell Aim",
      "Force of Personality",
      "Goad",
      "Green Ear",
      "Hawk's Vision",
      "Hear the Unseen",
      "Improved Diversion",
      "Improved Flight",
      "Improved Swimming",
      "Insightful Reflexes",
      "Ironskin Chant",
      "Jack of All Trades",
      "Leap Attack",
      "Lingering Song",
      "Lyric Spell",
      "Mobile Spellcasting",
      "Natural Bond",
      "Obscure Lore",
      "Open Minded",
      "Oversized Two-Weapon Fighting",
      "Power Throw",
      "Quick Reconnoiter",
      "Razing Strike",
      "Savage Grapple",
      "Scent",
      "Staggering Strike",
      "Subsonics",
      "Tactile Trapsmith",
      "Versatile Performer",
    ]);
  });

  it("preserves Brutal Throw's Complete Adventurer source and benefit", () => {
    const brutalThrow = featCatalog.find((feat) => feat.id === "brutal-throw");
    expect(brutalThrow).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description:
        "Str can replace Dex on thrown-weapon attack rolls; apply the substitution manually. Fighter bonus feat.",
      fighterBonus: true,
    });
    expect(brutalThrow?.prerequisites).toBeUndefined();
  });

  it("checks Brachiation's Climb and Jump prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "barbarian", level: 3 }];
    character.skills.Climb = 4;
    character.skills.Jump = 4;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("brachiation");
    character.skills.Jump = 3;
    expect(availableIds()).not.toContain("brachiation");

    const brachiation = featCatalog.find((feat) => feat.id === "brachiation");
    expect(brachiation).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { skills: { Climb: 4, Jump: 4 } },
      description: expect.stringContaining("medium or dense forests"),
    });
  });

  it("checks Hear the Unseen's Listen and Blind-Fight prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 3 }];
    character.skills.Listen = 5;
    character.featSelections = { "general-1": "blind-fight" };
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("hear-the-unseen");
    character.skills.Listen = 4;
    expect(availableIds()).not.toContain("hear-the-unseen");
    character.skills.Listen = 5;
    character.featSelections = {};
    expect(availableIds()).not.toContain("hear-the-unseen");

    const hearTheUnseen = featCatalog.find(
      (feat) => feat.id === "hear-the-unseen",
    );
    expect(hearTheUnseen).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { skills: { Listen: 5 }, feats: ["blind-fight"] },
      description: expect.stringContaining("DC 25 Listen check"),
    });
  });

  it("checks Appraise Magic Value's three skill prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "bard", level: 3 }];
    character.skills.Appraise = 5;
    character.skills["Knowledge (arcana)"] = 5;
    character.skills.Spellcraft = 5;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("appraise-magic-value");
    character.skills["Knowledge (arcana)"] = 4;
    expect(availableIds()).not.toContain("appraise-magic-value");

    const appraiseMagicValue = featCatalog.find(
      (feat) => feat.id === "appraise-magic-value",
    );
    expect(appraiseMagicValue).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: {
        skills: {
          Appraise: 5,
          "Knowledge (arcana)": 5,
          Spellcraft: 5,
        },
      },
      description: expect.stringContaining("8 hours of uninterrupted work"),
    });
    expect(appraiseMagicValue?.description).toContain(
      "10 + the item's caster level",
    );
  });

  it("checks Combat Intuition's BAB and Sense Motive prerequisites by slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 9 }];
    character.baseAttackBonusByLevel = { 3: 2, 6: 4, 9: 6 };
    character.skills["Sense Motive"] = 4;
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const ninthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-9",
    );
    const combatIntuition = featCatalog.find(
      (feat) => feat.id === "combat-intuition",
    );
    if (!sixthLevelSlot || !ninthLevelSlot || !combatIntuition)
      throw new Error("Missing Combat Intuition prerequisite fixtures.");

    expect(featQualifies(character, combatIntuition, sixthLevelSlot)).toBe(
      false,
    );
    expect(featQualifies(character, combatIntuition, ninthLevelSlot)).toBe(
      true,
    );
    character.skills["Sense Motive"] = 3;
    expect(featQualifies(character, combatIntuition, ninthLevelSlot)).toBe(
      false,
    );
    expect(combatIntuition).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      prerequisites: {
        skills: { "Sense Motive": 4 },
        baseAttackBonus: 5,
      },
      description: expect.stringContaining("+1 insight bonus"),
    });
  });

  it("requires Improved Initiative for Danger Sense", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.featSelections = { "general-1": "improved-initiative" };
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const dangerSense = featCatalog.find((feat) => feat.id === "danger-sense");
    if (!thirdLevelSlot || !dangerSense)
      throw new Error("Missing Danger Sense prerequisite fixtures.");

    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(
      dangerSense,
    );
    character.featSelections = {};
    expect(getAvailableFeats(character, thirdLevelSlot)).not.toContainEqual(
      dangerSense,
    );
    expect(dangerSense).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { feats: ["improved-initiative"] },
      description: expect.stringContaining("Once per day"),
    });
  });

  it("checks Death Blow's Improved Initiative and slot-level BAB prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.baseAttackBonusByLevel = { 3: 1, 6: 3 };
    character.featSelections = { "general-1": "improved-initiative" };
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const deathBlow = featCatalog.find((feat) => feat.id === "death-blow");
    if (!thirdLevelSlot || !sixthLevelSlot || !deathBlow)
      throw new Error("Missing Death Blow prerequisite fixtures.");

    expect(featQualifies(character, deathBlow, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, deathBlow, sixthLevelSlot)).toBe(true);
    character.featSelections = {};
    expect(featQualifies(character, deathBlow, sixthLevelSlot)).toBe(false);
    expect(deathBlow).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: {
        feats: ["improved-initiative"],
        baseAttackBonus: 2,
      },
      description: expect.stringContaining("standard action"),
    });
  });

  it("checks Quick Reconnoiter's skill prerequisites and source", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 5 }];
    character.skills.Listen = 5;
    character.skills.Spot = 5;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("quick-reconnoiter");
    character.skills.Listen = 4;
    expect(availableIds()).not.toContain("quick-reconnoiter");
    const quickReconnoiter = featCatalog.find(
      (feat) => feat.id === "quick-reconnoiter",
    );
    expect(quickReconnoiter?.sourceBook).toBe("Complete Adventurer (3.5)");
    expect(quickReconnoiter?.description).toContain("+2 on initiative checks");
  });

  it("preserves Insightful Reflexes' Complete Adventurer source and benefit", () => {
    const insightfulReflexes = featCatalog.find(
      (feat) => feat.id === "insightful-reflexes",
    );
    expect(insightfulReflexes).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining(
        "Intelligence modifier instead of Dexterity",
      ),
    });
    expect(insightfulReflexes?.prerequisites).toBeUndefined();
  });

  it("checks Deft Opportunist and Force of Personality prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 5 }];
    character.abilities.dex = 15;
    character.abilities.cha = 13;
    character.featSelections = { "general-1": "combat-reflexes" };
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("deft-opportunist");
    expect(availableIds()).toContain("force-of-personality");

    character.abilities.dex = 14;
    character.abilities.cha = 12;
    expect(availableIds()).not.toContain("deft-opportunist");
    expect(availableIds()).not.toContain("force-of-personality");

    const deftOpportunist = featCatalog.find(
      (feat) => feat.id === "deft-opportunist",
    );
    expect(deftOpportunist).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining("+4 bonus on attack rolls"),
    });
    const forceOfPersonality = featCatalog.find(
      (feat) => feat.id === "force-of-personality",
    );
    expect(forceOfPersonality).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining("Charisma modifier instead of Wisdom"),
    });
  });

  it("checks Dive for Cover's base Reflex save prerequisite by feat level", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 6 }];
    const feat = featCatalog.find((entry) => entry.id === "dive-for-cover");
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!feat || !thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing Dive for Cover prerequisite fixtures.");

    expect(featQualifies(character, feat, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, feat, sixthLevelSlot)).toBe(true);
    expect(getAvailableFeats(character, sixthLevelSlot)).toContainEqual(feat);
    expect(feat).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { baseSaves: { reflex: 4 } },
      description: expect.stringContaining("must use the second result"),
    });
  });

  it("checks Goad's Charisma and slot-level base attack prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.baseAttackBonusByLevel = { 1: 0, 3: 1 };
    character.abilities.cha = 13;
    const firstLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const goad = featCatalog.find((feat) => feat.id === "goad");
    if (!firstLevelSlot || !thirdLevelSlot || !goad)
      throw new Error("Missing Goad prerequisite fixtures.");

    expect(featQualifies(character, goad, firstLevelSlot)).toBe(false);
    expect(featQualifies(character, goad, thirdLevelSlot)).toBe(true);
    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(goad);
    character.abilities.cha = 12;
    expect(featQualifies(character, goad, thirdLevelSlot)).toBe(false);
    expect(goad).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      prerequisites: { abilities: { cha: 13 }, baseAttackBonus: 1 },
      description: expect.stringContaining("DC 10 + half your character level"),
    });
  });

  it("checks Improved Diversion's Bluff prerequisite and fighter eligibility", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 3 }];
    character.skills.Bluff = 4;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("improved-diversion");
    character.skills.Bluff = 3;
    expect(availableIds()).not.toContain("improved-diversion");

    const improvedDiversion = featCatalog.find(
      (feat) => feat.id === "improved-diversion",
    );
    expect(improvedDiversion).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      description: expect.stringContaining("move action"),
      prerequisites: { skills: { Bluff: 4 } },
    });
  });

  it("checks Improved Swimming's Swim prerequisite and source", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "barbarian", level: 3 }];
    character.skills.Swim = 5;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).not.toContain("improved-swimming");
    character.skills.Swim = 6;
    expect(availableIds()).toContain("improved-swimming");

    const improvedSwimming = featCatalog.find(
      (feat) => feat.id === "improved-swimming",
    );
    expect(improvedSwimming).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining("half your speed as a move action"),
      prerequisites: { skills: { Swim: 6 } },
    });
  });

  it("checks Improved Flight's fly-speed prerequisite and source", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).not.toContain("improved-flight");
    character.flySpeed = 30;
    expect(availableIds()).toContain("improved-flight");

    const improvedFlight = featCatalog.find(
      (feat) => feat.id === "improved-flight",
    );
    expect(improvedFlight).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining("one step"),
      prerequisites: { flySpeed: true },
    });
  });

  it("requires the Animal Companion feature for Natural Bond", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "druid", level: 3 }];
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const naturalBond = featCatalog.find((feat) => feat.id === "natural-bond");
    if (!thirdLevelSlot || !naturalBond)
      throw new Error("Missing Natural Bond prerequisite fixtures.");

    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(
      naturalBond,
    );
    character.classLevels = [{ classId: "fighter", level: 3 }];
    expect(getAvailableFeats(character, thirdLevelSlot)).not.toContainEqual(
      naturalBond,
    );
    expect(naturalBond).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { classFeatures: ["Animal Companion"] },
      description: expect.stringContaining("Add +3 to your effective druid level"),
    });
  });

  it("allows Obscure Lore with Bardic Knowledge or a Lore feature", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "bard", level: 3 }];
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const obscureLore = featCatalog.find((feat) => feat.id === "obscure-lore");
    if (!thirdLevelSlot || !obscureLore)
      throw new Error("Missing Obscure Lore prerequisite fixtures.");

    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(
      obscureLore,
    );
    character.classLevels = [{ classId: "fighter", level: 3 }];
    expect(getAvailableFeats(character, thirdLevelSlot)).not.toContainEqual(
      obscureLore,
    );
    character.classFeatures = ["Lore"];
    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(
      obscureLore,
    );
    expect(obscureLore).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { anyClassFeatures: ["Bardic Knowledge", "Lore"] },
      description: expect.stringContaining("+4 insight bonus"),
    });
  });

  it("preserves Tactile Trapsmith's Complete Adventurer benefits", () => {
    const tactileTrapsmith = featCatalog.find(
      (feat) => feat.id === "tactile-trapsmith",
    );
    expect(tactileTrapsmith).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining(
        "Dexterity bonus instead of Intelligence",
      ),
    });
    expect(tactileTrapsmith?.description).toContain(
      "darkness or blindness",
    );
    expect(tactileTrapsmith?.prerequisites).toBeUndefined();
  });

  it("allows Open Minded to grant skill points each time it is selected", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.featSelections = {
      "general-1": "open-minded",
      "general-3": "open-minded",
    };
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const openMinded = featCatalog.find((feat) => feat.id === "open-minded");
    if (!sixthLevelSlot || !openMinded)
      throw new Error("Missing Open Minded repeatability fixtures.");

    expect(openMinded).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description: expect.stringContaining("5 skill points per selection"),
    });
    expect(getAvailableFeats(character, sixthLevelSlot)).toContainEqual(
      openMinded,
    );
    expect(normalizeFeatSelections(character, character.featSelections)).toEqual(
      character.featSelections,
    );
  });

  it("checks Oversized Two-Weapon Fighting's prerequisites and fighter eligibility", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.abilities.str = 13;
    character.abilities.dex = 15;
    character.featSelections = { "general-1": "two-weapon-fighting" };
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("oversized-two-weapon-fighting");
    character.abilities.str = 12;
    expect(availableIds()).not.toContain("oversized-two-weapon-fighting");
    character.abilities.str = 13;
    character.featSelections = {};
    expect(availableIds()).not.toContain("oversized-two-weapon-fighting");

    const oversizedTwoWeaponFighting = featCatalog.find(
      (feat) => feat.id === "oversized-two-weapon-fighting",
    );
    expect(oversizedTwoWeaponFighting).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      description: expect.stringContaining("one-handed weapon in your off hand"),
      prerequisites: { abilities: { str: 13 }, feats: ["two-weapon-fighting"] },
    });
  });

  it("checks the next Complete Adventurer feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 18 }];
    character.abilities = { ...character.abilities, str: 13, dex: 17, int: 13 };
    character.skills = {
      ...character.skills,
      Concentration: 15,
      Jump: 8,
      Spellcraft: 15,
      "Perform (act)": 5,
    };
    character.featSelections = {
      "general-1": "brutal-throw",
      "general-3": "power-attack",
      "general-6": "two-weapon-fighting",
      "general-9": "improved-two-weapon-fighting",
      "general-12": "combat-reflexes",
      "general-15": "combat-expertise",
    };
    const eighteenthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-18",
    );
    if (!eighteenthLevelSlot)
      throw new Error("Missing eighteenth-level feat slot.");
    const qualifies = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return featQualifies(character, feat, eighteenthLevelSlot);
    };

    expect(
      [
        "dual-strike",
        "expert-tactician",
        "extraordinary-concentration",
        "extraordinary-spell-aim",
        "jack-of-all-trades",
        "leap-attack",
        "mobile-spellcasting",
        "power-throw",
        "versatile-performer",
      ].map(qualifies),
    ).toEqual(Array(9).fill(true));

    character.skills.Concentration = 14;
    expect(qualifies("extraordinary-concentration")).toBe(false);
    expect(qualifies("mobile-spellcasting")).toBe(true);
    character.skills.Concentration = 7;
    expect(qualifies("mobile-spellcasting")).toBe(false);
    character.skills.Concentration = 15;
    character.skills.Spellcraft = 14;
    expect(qualifies("extraordinary-spell-aim")).toBe(false);
    character.skills["Perform (act)"] = 4;
    expect(qualifies("versatile-performer")).toBe(false);
    character.skills["Perform (act)"] = 5;
    character.featSelections["general-1"] = "improved-initiative";
    expect(qualifies("power-throw")).toBe(false);
    expect(qualifies("leap-attack")).toBe(true);
    character.featSelections["general-9"] = "combat-expertise";
    expect(qualifies("dual-strike")).toBe(false);

    expect(featCatalog.find((feat) => feat.id === "dual-strike")).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      prerequisites: {
        feats: ["improved-two-weapon-fighting", "two-weapon-fighting"],
      },
    });
    expect(featCatalog.find((feat) => feat.id === "power-throw")).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      fighterBonus: true,
      prerequisites: {
        abilities: { str: 13 },
        feats: ["brutal-throw", "power-attack"],
      },
    });
    expect(featCatalog.find((feat) => feat.id === "mobile-spellcasting")).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { skills: { Concentration: 8 } },
      description: expect.stringContaining("DC 20 + spell level"),
    });
  });

  it("checks Complete Adventurer's class-feature feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "rogue", level: 4 },
      { classId: "ranger", level: 4 },
      { classId: "paladin", level: 4 },
      { classId: "bard", level: 5 },
      { classId: "wizard", level: 1 },
    ];
    character.abilities.int = 13;
    character.skills = {
      ...character.skills,
      Spot: 10,
      "Perform (act)": 10,
    };
    character.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "combat-expertise",
      "general-6": "track",
      "general-9": "extra-music",
    };
    const eighteenthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-18",
    );
    if (!eighteenthLevelSlot)
      throw new Error("Missing eighteenth-level feat slot.");
    const qualifies = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return featQualifies(character, feat, eighteenthLevelSlot);
    };
    const newClassFeatureFeats = [
      "ascetic-hunter",
      "ascetic-knight",
      "ascetic-mage",
      "ascetic-rogue",
      "deft-strike",
      "devoted-inquisitor",
      "devoted-performer",
      "devoted-tracker",
      "disguise-spell",
      "extra-music",
      "green-ear",
      "lingering-song",
      "razing-strike",
      "staggering-strike",
      "subsonics",
    ];
    expect(newClassFeatureFeats.map(qualifies)).toEqual(
      Array(newClassFeatureFeats.length).fill(true),
    );

    character.skills.Spot = 9;
    expect(qualifies("deft-strike")).toBe(false);
    character.skills.Spot = 10;
    character.skills["Perform (act)"] = 9;
    expect(qualifies("disguise-spell")).toBe(true);
    expect(qualifies("green-ear")).toBe(false);
    expect(qualifies("subsonics")).toBe(false);

    const originalClassLevels = character.classLevels;
    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "rogue" ? { ...entry, classId: "fighter" } : entry,
    );
    expect(qualifies("ascetic-rogue")).toBe(false);
    expect(qualifies("deft-strike")).toBe(false);
    expect(qualifies("devoted-inquisitor")).toBe(false);
    expect(qualifies("razing-strike")).toBe(false);
    expect(qualifies("staggering-strike")).toBe(false);

    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "ranger" ? { ...entry, classId: "fighter" } : entry,
    );
    expect(qualifies("ascetic-hunter")).toBe(false);
    expect(qualifies("devoted-tracker")).toBe(false);
    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "paladin" ? { ...entry, classId: "fighter" } : entry,
    );
    expect(qualifies("ascetic-knight")).toBe(false);
    expect(qualifies("devoted-performer")).toBe(false);
    expect(qualifies("devoted-inquisitor")).toBe(false);

    expect(featCatalog.find((feat) => feat.id === "razing-strike")).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      prerequisites: { casterLevel: 5 },
      description: expect.stringContaining("constructs"),
    });

    const preparedCaster = cloneCharacter(initialCharacter);
    preparedCaster.classLevels = [{ classId: "wizard", level: 4 }];
    preparedCaster.featSelections = {
      "general-1": "improved-unarmed-strike",
    };
    const thirdLevelSlot = getChronologicalFeatSlots(preparedCaster).find(
      (slot) => slot.id === "general-3",
    );
    const asceticMage = featCatalog.find((feat) => feat.id === "ascetic-mage");
    if (!thirdLevelSlot || !asceticMage)
      throw new Error("Missing Ascetic Mage prerequisite fixtures.");
    expect(featQualifies(preparedCaster, asceticMage, thirdLevelSlot)).toBe(
      false,
    );
  });

  it("allows Extra Music to be selected multiple times", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "bard", level: 3 }];
    character.featSelections = { "general-1": "extra-music" };
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const extraMusic = featCatalog.find((feat) => feat.id === "extra-music");
    if (!thirdLevelSlot || !extraMusic)
      throw new Error("Missing Extra Music repeatability fixtures.");

    expect(getAvailableFeats(character, thirdLevelSlot)).toContainEqual(
      extraMusic,
    );
    expect(extraMusic.description).toContain("four additional daily uses");
  });

  it("checks Complete Adventurer bardic-music and wild feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "bard", level: 4 },
      { classId: "druid", level: 5 },
      { classId: "rogue", level: 3 },
    ];
    character.abilities.cha = 14;
    character.skills = {
      ...character.skills,
      Concentration: 12,
      Listen: 4,
      Spot: 4,
      "Perform (act)": 12,
    };
    const twelfthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-12",
    );
    if (!twelfthLevelSlot)
      throw new Error("Missing twelfth-level feat slot.");
    const qualifies = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return featQualifies(character, feat, twelfthLevelSlot);
    };
    const feats = [
      "chant-of-fortitude",
      "ironskin-chant",
      "lyric-spell",
      "blindsense",
      "climb-like-an-ape",
      "cougars-vision",
      "hawks-vision",
      "savage-grapple",
      "scent",
    ];
    expect(feats.map(qualifies)).toEqual(Array(feats.length).fill(true));

    character.skills.Concentration = 8;
    expect(qualifies("chant-of-fortitude")).toBe(false);
    expect(qualifies("ironskin-chant")).toBe(false);
    character.skills.Concentration = 12;
    character.skills["Perform (act)"] = 11;
    expect(qualifies("ironskin-chant")).toBe(false);
    character.skills["Perform (act)"] = 12;
    character.skills.Listen = 3;
    expect(qualifies("blindsense")).toBe(false);
    character.skills.Listen = 4;
    character.skills.Spot = 3;
    expect(qualifies("cougars-vision")).toBe(true);
    expect(qualifies("hawks-vision")).toBe(false);
    character.skills.Spot = 4;

    const originalClassLevels = character.classLevels;
    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "druid" ? { ...entry, classId: "fighter" } : entry,
    );
    for (const id of [
      "blindsense",
      "climb-like-an-ape",
      "cougars-vision",
      "hawks-vision",
      "scent",
      "savage-grapple",
    ])
      expect(qualifies(id)).toBe(false);
    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "rogue" ? { ...entry, classId: "fighter" } : entry,
    );
    expect(qualifies("savage-grapple")).toBe(false);
    character.classLevels = originalClassLevels.map((entry) =>
      entry.classId === "bard" ? { ...entry, classId: "sorcerer" } : entry,
    );
    expect(qualifies("chant-of-fortitude")).toBe(false);
    expect(qualifies("ironskin-chant")).toBe(false);
    expect(qualifies("lyric-spell")).toBe(false);
  });

  it("requires actual second-level spontaneous arcane casting for Lyric Spell", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "bard", level: 1 },
      { classId: "sorcerer", level: 5 },
    ];
    character.abilities.cha = 12;
    character.skills["Perform (act)"] = 9;
    character.hitPointRolls = Array.from({ length: 6 }, (_, index) => ({
      characterLevel: index + 1,
      classId: index === 0 ? "bard" : "sorcerer",
      classLevel: index === 0 ? 1 : index,
      hitDie: index === 0 ? 6 : 4,
      roll: 1,
      hpIncrease: 1,
    }));
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-6",
    );
    const lyricSpell = featCatalog.find((feat) => feat.id === "lyric-spell");
    if (!thirdLevelSlot || !sixthLevelSlot || !lyricSpell)
      throw new Error("Missing Lyric Spell prerequisite fixtures.");

    expect(featQualifies(character, lyricSpell, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, lyricSpell, sixthLevelSlot)).toBe(true);

    const wizard = cloneCharacter(character);
    wizard.classLevels = [
      { classId: "bard", level: 1 },
      { classId: "wizard", level: 5 },
    ];
    wizard.hitPointRolls = (wizard.hitPointRolls ?? []).map((roll) =>
      roll.classId === "sorcerer"
        ? { ...roll, classId: "wizard", hitDie: 4 }
        : roll,
    );
    expect(featQualifies(wizard, lyricSpell, sixthLevelSlot)).toBe(false);
  });

  it("describes Complete Adventurer wild-feat limits accurately", () => {
    const hawksVision = featCatalog.find((feat) => feat.id === "hawks-vision");
    const savageGrapple = featCatalog.find(
      (feat) => feat.id === "savage-grapple",
    );
    if (!hawksVision || !savageGrapple)
      throw new Error("Missing Complete Adventurer wild-feat fixtures.");

    expect(hawksVision.description).toContain(
      "ranged attacks take only -1 per range increment (instead of -2)",
    );
    expect(hawksVision.description).toContain(
      "Spot takes -1 per 20 feet (instead of 10)",
    );
    expect(savageGrapple.description).toContain(
      "Creatures not subject to sneak attacks take no extra damage",
    );
  });

  it("preserves Complete Adventurer bardic and Scent details", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("extra-music")).toContain(
      "four additional daily uses",
    );
    expect(description("chant-of-fortitude")).toContain(
      "repeat to sustain",
    );
    expect(description("ironskin-chant")).toContain(
      "damage reduction 5/-",
    );
    expect(description("lyric-spell")).toContain(
      "cannot be used with Silent Spell",
    );
    expect(description("scent")).toContain(
      "Standard supernatural action",
    );
  });

  it("preserves Complete Adventurer performer benefit limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("devoted-performer")).toContain(
      "without granting extra daily uses beyond that total",
    );
    expect(description("devoted-tracker")).toContain(
      "not daily smite uses",
    );
    expect(description("disguise-spell")).toContain(
      "Visible emanations or other clues can reveal the source",
    );
    expect(description("green-ear")).toContain(
      "plants are immune to mind-affecting spells and abilities",
    );
    expect(description("lingering-song")).toContain(
      "only 5 rounds afterward",
    );
  });

  it("preserves Complete Adventurer combat and concentration limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("dual-strike")).toContain(
      "one roll using the worse modifier",
    );
    expect(description("dual-strike")).toContain(
      "precision damage once",
    );
    expect(description("dual-strike")).toContain(
      "critical extra damage only from primary",
    );
    expect(description("expert-tactician")).toContain(
      "you and all allies gain +2 circumstance",
    );
    expect(description("extraordinary-concentration")).toContain(
      "this never maintains multiple spells",
    );
    expect(description("extraordinary-spell-aim")).toContain(
      "excludes one creature",
    );
    expect(description("force-of-personality")).toContain(
      "Charisma modifier instead of Wisdom",
    );
  });

  it("preserves Complete Adventurer skill and movement limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("jack-of-all-trades")).toContain(
      "skills that do not allow skill checks",
    );
    expect(description("leap-attack")).toContain(
      "at least 10 feet horizontally",
    );
    expect(description("leap-attack")).toContain(
      "triple it with a two-handed weapon",
    );
    expect(description("mobile-spellcasting")).toContain(
      "Failure loses the spell",
    );
    expect(description("mobile-spellcasting")).toContain(
      "casting defensively raises the DC to 25 + spell level",
    );
    expect(description("natural-bond")).toContain(
      "without exceeding your character level",
    );
    expect(description("obscure-lore")).toContain(
      "+4 insight bonus",
    );
  });

  it("preserves Complete Adventurer tactical and skill-point limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("open-minded")).toContain(
      "5 skill points per selection",
    );
    expect(description("oversized-two-weapon-fighting")).toContain(
      "as if it were a light weapon",
    );
    expect(description("power-throw")).toContain(
      "until your next turn",
    );
    expect(description("quick-reconnoiter")).toContain(
      "one Spot check and one Listen check each round as free actions",
    );
    expect(description("razing-strike")).toContain(
      "Arcane spells apply these bonuses against constructs",
    );
    expect(description("razing-strike")).toContain(
      "divine spells apply them against undead",
    );
  });

  it("preserves Complete Adventurer final feat-table limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Adventurer feat: ${id}.`);
      return feat.description;
    };

    expect(description("staggering-strike")).toContain(
      "DC equal to damage dealt",
    );
    expect(description("staggering-strike")).toContain(
      "does not stack",
    );
    expect(description("subsonics")).toContain(
      "opponents do not notice",
    );
    expect(description("tactile-trapsmith")).toContain(
      "no penalties on these checks for darkness or blindness",
    );
    expect(description("versatile-performer")).toContain(
      "update with them, and are permanent",
    );
    expect(description("versatile-performer")).toContain(
      "+2 to the higher Perform modifier",
    );
  });

  it("tracks Deadly Defense from Complete Scoundrel", () => {
    const deadlyDefense = featCatalog.find(
      (feat) => feat.id === "deadly-defense",
    );
    expect(deadlyDefense).toMatchObject({
      sourceBook: "Complete Scoundrel (3.5)",
      fighterBonus: true,
      description: expect.stringContaining("+1d6 damage"),
    });
    expect(deadlyDefense?.prerequisites).toBeUndefined();
  });

  it("tracks Complete Scoundrel prerequisites and source attribution", () => {
    const scoundrelFeat = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return feat;
    };

    expect(scoundrelFeat("concussion-attack")).toMatchObject({
      sourceBook: "Complete Scoundrel (3.5)",
      prerequisites: {
        anyClassFeatures: [
          "Sneak Attack +3d6",
          "Sneak Attack +4d6",
          "Sneak Attack +5d6",
          "Sneak Attack +6d6",
          "Sneak Attack +7d6",
          "Sneak Attack +8d6",
          "Sneak Attack +9d6",
          "Sneak Attack +10d6",
        ],
      },
    });
    expect(scoundrelFeat("eldritch-erosion").prerequisites).toMatchObject({
      skills: { "Knowledge (arcana)": 1 },
    });
    expect(scoundrelFeat("throat-punch").prerequisites).toMatchObject({
      feats: ["improved-unarmed-strike"],
    });
    expect(scoundrelFeat("mind-drain").prerequisites).toMatchObject({
      powerPointReserve: true,
      anyClassFeatures: expect.arrayContaining(["Sneak Attack +2d6"]),
    });
    expect(scoundrelFeat("expanded-ki-pool").prerequisites).toEqual({
      kiPower: true,
    });
    expect(scoundrelFeat("enduring-ki").prerequisites).toEqual({
      kiPower: true,
    });
    expect(scoundrelFeat("daring-outlaw").prerequisites).toMatchObject({
      swashbucklerGrace: true,
      anyClassFeatures: expect.arrayContaining(["Sneak Attack +2d6"]),
    });
    expect(scoundrelFeat("daring-warrior").prerequisites).toEqual({
      swashbucklerGrace: true,
      feats: ["weapon-specialization"],
    });
    expect(scoundrelFeat("ascetic-stalker").prerequisites).toEqual({
      kiPower: true,
      kiStrikeMagic: true,
    });
    expect(scoundrelFeat("improved-skirmish").prerequisites).toEqual({
      minimumSkirmishDamageDice: 2,
      minimumSkirmishACBonus: 1,
    });
    expect(scoundrelFeat("swift-ambusher")).toMatchObject({
      prerequisites: {
        minimumSkirmishDamageDice: 1,
        minimumSkirmishACBonus: 1,
        anyClassFeatures: expect.arrayContaining(["Sneak Attack +1d6"]),
      },
    });
    expect(scoundrelFeat("swift-hunter").prerequisites).toEqual({
      minimumFavoredEnemies: 1,
      minimumSkirmishDamageDice: 1,
      minimumSkirmishACBonus: 1,
    });
    expect(scoundrelFeat("martial-stalker")).toMatchObject({
      fighterBonus: true,
      prerequisites: {
        allMartialWeaponProficiencies: true,
        kiPower: true,
      },
    });
    expect(scoundrelFeat("master-spellthief").prerequisites).toEqual({
      arcaneSpellLevel: 2,
      stealSpell: true,
    });
    expect(scoundrelFeat("psithief").prerequisites).toEqual({
      manifesterLevel: 1,
      stealSpell: true,
    });
    expect(scoundrelFeat("warning-shout").prerequisites).toMatchObject({
      classFeatures: ["Bardic Music", "Evasion"],
    });
    expect(scoundrelFeat("chord-of-distraction").prerequisites).toMatchObject({
      skills: { "Perform (act)": 9 },
    });
    expect(scoundrelFeat("better-lucky-than-good")).toMatchObject({
      categories: ["luck"],
      prerequisites: {
        minimumCharacterLevel: 6,
        minimumFeatsByCategory: { luck: 2 },
      },
    });
    expect(scoundrelFeat("magical-fortune")).toMatchObject({
      categories: ["luck"],
      prerequisites: {
        casterLevel: 3,
        minimumFeatsByCategory: { luck: 1 },
      },
    });
    expect(scoundrelFeat("savvy-rogue").prerequisites).toEqual({
      classLevels: { rogue: 10 },
    });
    expect(
      scoundrelFeat("improved-familiar-complete-scoundrel"),
    ).toMatchObject({
      sourceBook: "Complete Scoundrel (3.5)",
      prerequisites: {
        anyClassLevels: { sorcerer: 1, wizard: 1 },
        arcaneCasterLevel: 2,
      },
    });
    expect(scoundrelFeat("third-times-the-charm")).toMatchObject({
      categories: ["luck"],
      prerequisites: {
        minimumCharacterLevel: 3,
        minimumFeatsByCategory: { luck: 1 },
        domains: ["luck"],
      },
    });
  });

  it("tracks the represented Complete Scoundrel feat", () => {
    const representedNames = featCatalog
      .filter(
        (feat) =>
          feat.sourceBook === "Complete Scoundrel (3.5)" &&
          completeScoundrelFeats.has(normalizeFeatName(feat.name)),
      )
      .map((feat) => feat.name);
    expect(completeScoundrelFeats.size).toBe(56);
    expect(representedNames).toEqual([
        "Ascetic Stalker",
        "Deadly Defense",
        "Daredevil Athlete",
      "Daring Outlaw",
      "Daring Warrior",
      "Cool Head",
      "Freerunner",
      "Sure Hand",
      "Swift Ambusher",
      "Swift Hunter",
      "Sweet Talker",
      "Expanded Ki Pool",
      "Enduring Ki",
      "Improved Familiar",
      "Improved Skirmish",
      "Martial Stalker",
      "Master Spellthief",
      "Poison Expert",
      "Poison Master",
      "Psithief",
      "Savvy Rogue",
      "Concussion Attack",
      "Deafening Strike",
      "Disemboweling Strike",
      "Eldritch Erosion",
      "Head Shot",
      "Impeding Attack",
      "Merciful Strike",
      "Mind Drain",
      "Persistent Attacker",
      "Throat Punch",
      "Chant of the Long Road",
      "Chord of Distraction",
      "Epic of the Lost King",
      "Sound of Silence",
      "Warning Shout",
      "Advantageous Avoidance",
      "Better Lucky than Good",
      "Dumb Luck",
      "Fortuitous Strike",
      "Good Karma",
      "Healer's Luck",
      "Lucky Break",
      "Lucky Catch",
      "Lucky Fingers",
      "Lucky Start",
      "Magical Fortune",
      "Make Your Own Luck",
      "Miser's Fortune",
      "Psychic Luck",
      "Sly Fortune",
      "Survivor's Luck",
      "Tempting Fate",
      "Third Time's the Charm",
      "Unbelievable Luck",
      "Victor's Luck",
    ]);
  });

  it("checks manual skirmish prerequisites and Swift Ambusher ambush qualification", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 3 }];
    character.classFeatures = ["Sneak Attack +2d6"];
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    const improvedSkirmish = featCatalog.find(
      (candidate) => candidate.id === "improved-skirmish",
    );
    const swiftAmbusher = featCatalog.find(
      (candidate) => candidate.id === "swift-ambusher",
    );
    const concussionAttack = featCatalog.find(
      (candidate) => candidate.id === "concussion-attack",
    );
    const daringOutlaw = featCatalog.find(
      (candidate) => candidate.id === "daring-outlaw",
    );
    if (!slot || !improvedSkirmish || !swiftAmbusher || !concussionAttack || !daringOutlaw)
      throw new Error("Missing skirmish feat test fixtures.");

    character.skirmishDamageDice = 1;
    character.skirmishACBonus = 1;
    expect(featQualifies(character, improvedSkirmish, slot)).toBe(false);
    character.skirmishDamageDice = 2;
    expect(featQualifies(character, improvedSkirmish, slot)).toBe(true);

    character.skirmishDamageDice = 1;
    expect(featQualifies(character, swiftAmbusher, slot)).toBe(true);
    expect(featQualifies(character, concussionAttack, slot)).toBe(false);
    character.featSelections = { "general-1": "swift-ambusher" };
    expect(getChosenFeats(character)).toContain("swift-ambusher");
    expect(getClassFeatureDisplay(character).map(({ ability }) => ability)).toContain(
      "Sneak Attack +2d6",
    );
    expect(featQualifies(character, concussionAttack, slot)).toBe(true);
    character.hasSwashbucklerGrace = true;
    character.skirmishDamageDice = 2;
    expect(featQualifies(character, {
      ...daringOutlaw,
      prerequisites: {
        ...daringOutlaw.prerequisites,
        anyClassFeatures: ["Sneak Attack +3d6"],
      },
    }, slot)).toBe(false);
  });

  it("requires a recorded Favored Enemy and skirmish for Swift Hunter", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    const feat = featCatalog.find((candidate) => candidate.id === "swift-hunter");
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-1",
    );
    if (!feat || !slot) throw new Error("Missing Swift Hunter test fixture.");

    character.skirmishDamageDice = 1;
    character.skirmishACBonus = 1;
    expect(featQualifies(character, feat, slot)).toBe(false);
    character.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Undead",
      bonusTargetLevel: 1,
    }];
    expect(featQualifies(character, feat, slot)).toBe(true);
  });

  it("requires a manual power-point reserve and sneak attack for Mind Drain", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "rogue", level: 3 }];
    character.classFeatures = ["Sneak Attack +2d6"];
    const feat = featCatalog.find((candidate) => candidate.id === "mind-drain");
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!feat || !slot) throw new Error("Missing Mind Drain test fixture.");

    expect(featQualifies(character, feat, slot)).toBe(false);
    character.hasPowerPointReserve = true;
    expect(featQualifies(character, feat, slot)).toBe(true);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.classFeatures = [];
    expect(featQualifies(character, feat, slot)).toBe(false);
  });

  it("requires manual confirmation of the Ki Power class feature", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-1",
    );
    const feats = ["expanded-ki-pool", "enduring-ki"].map((id) =>
      featCatalog.find((candidate) => candidate.id === id),
    );
    if (!slot || feats.some((feat) => !feat))
      throw new Error("Missing ki-feat test fixtures.");

    for (const feat of feats) {
      if (!feat) continue;
      expect(featQualifies(character, feat, slot)).toBe(false);
    }
    character.hasKiPower = true;
    for (const feat of feats) {
      if (!feat) continue;
      expect(featQualifies(character, feat, slot)).toBe(true);
    }
  });

  it("checks Daring Outlaw and Daring Warrior's manual Grace prerequisites", () => {
    const outlaw = cloneCharacter(initialCharacter);
    outlaw.classLevels = [{ classId: "rogue", level: 3 }];
    const outlawFeat = featCatalog.find(
      (candidate) => candidate.id === "daring-outlaw",
    );
    const thirdLevelSlot = getChronologicalFeatSlots(outlaw).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!outlawFeat || !thirdLevelSlot)
      throw new Error("Missing Daring Outlaw test fixture.");
    expect(featQualifies(outlaw, outlawFeat, thirdLevelSlot)).toBe(false);
    outlaw.hasSwashbucklerGrace = true;
    expect(featQualifies(outlaw, outlawFeat, thirdLevelSlot)).toBe(true);

    const warrior = cloneCharacter(initialCharacter);
    warrior.classLevels = [{ classId: "fighter", level: 6 }];
    warrior.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    warrior.featWeaponSelections = {
      "general-1": "Longsword",
      "fighter-4": "Longsword",
    };
    const warriorFeat = featCatalog.find(
      (candidate) => candidate.id === "daring-warrior",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(warrior).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!warriorFeat || !sixthLevelSlot)
      throw new Error("Missing Daring Warrior test fixture.");
    expect(featQualifies(warrior, warriorFeat, sixthLevelSlot)).toBe(false);
    warrior.hasSwashbucklerGrace = true;
    expect(featQualifies(warrior, warriorFeat, sixthLevelSlot)).toBe(true);
  });

  it("enforces the remaining Complete Scoundrel manual prerequisites", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return feat;
    };

    const firstLevelCharacter = cloneCharacter(initialCharacter);
    const firstLevelSlot = getChronologicalFeatSlots(firstLevelCharacter).find(
      (candidate) => candidate.id === "general-1",
    );
    if (!firstLevelSlot)
      throw new Error("Missing first-level feat slot.");

    const asceticStalker = featFor("ascetic-stalker");
    firstLevelCharacter.hasKiPower = true;
    expect(featQualifies(firstLevelCharacter, asceticStalker, firstLevelSlot)).toBe(false);
    firstLevelCharacter.hasKiStrikeMagic = true;
    expect(featQualifies(firstLevelCharacter, asceticStalker, firstLevelSlot)).toBe(true);

    const martialStalker = featFor("martial-stalker");
    expect(featQualifies(firstLevelCharacter, martialStalker, firstLevelSlot)).toBe(false);
    firstLevelCharacter.hasAllMartialWeaponProficiencies = true;
    expect(featQualifies(firstLevelCharacter, martialStalker, firstLevelSlot)).toBe(true);

    const psithief = featFor("psithief");
    firstLevelCharacter.manifesterLevel = 1;
    expect(featQualifies(firstLevelCharacter, psithief, firstLevelSlot)).toBe(false);
    firstLevelCharacter.hasStealSpell = true;
    expect(featQualifies(firstLevelCharacter, psithief, firstLevelSlot)).toBe(true);

    const spellcaster = cloneCharacter(initialCharacter);
    spellcaster.classLevels = [{ classId: "wizard", level: 3 }];
    spellcaster.abilities.int = 12;
    const thirdLevelSlot = getChronologicalFeatSlots(spellcaster).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const masterSpellthief = featFor("master-spellthief");
    expect(featQualifies(spellcaster, masterSpellthief, thirdLevelSlot)).toBe(false);
    spellcaster.hasStealSpell = true;
    expect(featQualifies(spellcaster, masterSpellthief, thirdLevelSlot)).toBe(true);
  });

  it("checks Psychic Luck's manual manifester level and luck-feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.featSelections = { "general-1": "lucky-start" };
    character.manifesterLevel = 2;
    const feat = featCatalog.find(
      (candidate) => candidate.id === "psychic-luck",
    );
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!feat || !slot)
      throw new Error("Missing Psychic Luck test fixture.");

    expect(featQualifies(character, feat, slot)).toBe(false);
    character.manifesterLevel = 3;
    expect(featQualifies(character, feat, slot)).toBe(true);
    character.featSelections = {};
    expect(featQualifies(character, feat, slot)).toBe(false);
  });

  it("enforces Complete Scoundrel Improved Familiar prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const improvedFamiliar = featCatalog.find(
      (feat) => feat.id === "improved-familiar-complete-scoundrel",
    );
    if (!slot || !improvedFamiliar)
      throw new Error("Missing Complete Scoundrel Improved Familiar fixtures.");

    expect(featQualifies(character, improvedFamiliar, slot)).toBe(true);
    character.classLevels = [
      { classId: "wizard", level: 1 },
      { classId: "fighter", level: 2 },
    ];
    expect(featQualifies(character, improvedFamiliar, slot)).toBe(false);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    expect(featQualifies(character, improvedFamiliar, slot)).toBe(false);
  });

  it("enforces Complete Scoundrel poison prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "rogue", level: 8 },
      { classId: "rogue", prestigeClassId: "assassin", level: 1 },
    ];
    character.skills["Craft (poisonmaking)"] = 8;
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-9",
    );
    const poisonExpert = featCatalog.find(
      (feat) => feat.id === "poison-expert",
    );
    const poisonMaster = featCatalog.find(
      (feat) => feat.id === "poison-master",
    );
    if (!slot || !poisonExpert || !poisonMaster)
      throw new Error("Missing Complete Scoundrel poison feat fixtures.");

    expect(skills).toContain("Craft (poisonmaking)");
    expect(getSkillAbility("Craft (poisonmaking)")).toBe("int");
    expect(featQualifies(character, poisonExpert, slot)).toBe(true);
    expect(featQualifies(character, poisonMaster, slot)).toBe(false);

    character.featSelections = { "general-1": "poison-expert" };
    expect(featQualifies(character, poisonMaster, slot)).toBe(true);
    character.skills["Craft (poisonmaking)"] = 7;
    expect(featQualifies(character, poisonExpert, slot)).toBe(false);

    character.skills["Craft (poisonmaking)"] = 8;
    character.classLevels = [{ classId: "rogue", level: 9 }];
    expect(featQualifies(character, poisonExpert, slot)).toBe(false);
  });

  it("enforces Complete Scoundrel luck-feat count prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const betterLuckyThanGood = featCatalog.find(
      (feat) => feat.id === "better-lucky-than-good",
    );
    const advantageousAvoidance = featCatalog.find(
      (feat) => feat.id === "advantageous-avoidance",
    );
    if (!slot || !betterLuckyThanGood || !advantageousAvoidance)
      throw new Error("Missing Complete Scoundrel luck feat fixtures.");

    character.featSelections = { "general-1": "good-karma" };
    expect(featQualifies(character, betterLuckyThanGood, slot)).toBe(false);
    character.featSelections["general-3"] = "lucky-break";
    expect(featQualifies(character, betterLuckyThanGood, slot)).toBe(true);
    expect(featQualifies(character, advantageousAvoidance, slot)).toBe(true);
  });

  it("matches damage-type Weapon Focus choices for Complete Scoundrel ambush feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "fighter", level: 1 },
      { classId: "rogue", level: 11 },
    ];
    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": "Dagger" };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-12",
    );
    const disembowelingStrike = featCatalog.find(
      (feat) => feat.id === "disemboweling-strike",
    );
    const headShot = featCatalog.find((feat) => feat.id === "head-shot");
    if (!slot || !disembowelingStrike || !headShot)
      throw new Error("Missing damage-type ambush feat fixtures.");

    expect(featQualifies(character, disembowelingStrike, slot)).toBe(true);
    expect(featQualifies(character, headShot, slot)).toBe(false);
    character.featWeaponSelections["general-1"] = "Morningstar";
    expect(featQualifies(character, disembowelingStrike, slot)).toBe(false);
    expect(featQualifies(character, headShot, slot)).toBe(true);
    character.customItems = [
      {
        name: "Custom Bludgeon",
        category: "Weapons",
        price: 0,
        weight: "2 lb.",
        damageType: "bludgeoning",
      },
    ];
    character.featWeaponSelections["general-1"] = "Custom Bludgeon";
    expect(featQualifies(character, headShot, slot)).toBe(true);
  });

  it("requires access to the Luck domain for Third Time's the Charm", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "cleric", level: 6 }];
    character.clericDomains = ["luck"];
    character.featSelections = { "general-1": "good-karma" };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const thirdTime = featCatalog.find(
      (feat) => feat.id === "third-times-the-charm",
    );
    if (!slot || !thirdTime)
      throw new Error("Missing Third Time's the Charm fixtures.");

    expect(featQualifies(character, thirdTime, slot)).toBe(true);
    character.clericDomains = [];
    expect(featQualifies(character, thirdTime, slot)).toBe(false);
  });

  it("matches the represented Complete Champion feat table entries", () => {
    const representedNames = featCatalog
      .filter((feat) => completeChampionFeats.has(normalizeFeatName(feat.name)))
      .map((feat) => feat.name);
    expect(completeChampionFeats.size).toBe(42);
    expect(representedNames.sort()).toEqual([
      "Air Devotion",
      "Animal Devotion",
      "Awesome Smite",
      "Battle Blessing",
      "Bestial Charge",
      "Chaos Devotion",
      "Charnel Miasma",
      "Death Devotion",
      "Destruction Devotion",
      "Earth Devotion",
      "Elemental Essence",
      "Evil Devotion",
      "Fire Devotion",
      "Fragile Construct",
      "Good Devotion",
      "Great and Small",
      "Healing Devotion",
      "Holy Potency",
      "Holy Warrior",
      "Imbued Healing",
      "Knowledge Devotion",
      "Law Devotion",
      "Luck Devotion",
      "Magic Devotion",
      "Mitigate Suffering",
      "Plant Devotion",
      "Protection Devotion",
      "Protective Ward",
      "Retrieve Spell",
      "Spiritual Counter",
      "Spontaneous Domains",
      "Strength Devotion",
      "Sun Devotion",
      "Swift Call",
      "Swift Wild Shape",
      "Touch of Healing",
      "Travel Devotion",
      "Trickery Devotion",
      "Umbral Shroud",
      "Venom's Gift",
      "War Devotion",
      "Water Devotion",
    ]);
  });

  it("tracks Complete Champion domain feats and repeatable daily uses", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.featSelections = { "general-1": "air-devotion" };
    const slot = getChronologicalFeatSlots(character).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!slot) throw new Error("Missing domain feat slot.");

    for (const id of [
      "air-devotion",
      "animal-devotion",
      "death-devotion",
      "destruction-devotion",
      "earth-devotion",
      "evil-devotion",
      "fire-devotion",
      "good-devotion",
      "healing-devotion",
      "knowledge-devotion",
      "law-devotion",
      "luck-devotion",
      "magic-devotion",
      "plant-devotion",
      "protection-devotion",
      "strength-devotion",
      "sun-devotion",
      "travel-devotion",
      "trickery-devotion",
      "war-devotion",
      "water-devotion",
    ]) {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing domain feat: ${id}`);
      expect(feat.categories).toContain("domain");
    }

    for (const id of [
      "air-devotion",
      "animal-devotion",
      "death-devotion",
      "destruction-devotion",
      "earth-devotion",
      "evil-devotion",
      "fire-devotion",
      "good-devotion",
      "healing-devotion",
      "law-devotion",
      "luck-devotion",
      "magic-devotion",
      "plant-devotion",
      "protection-devotion",
      "strength-devotion",
      "sun-devotion",
      "travel-devotion",
      "trickery-devotion",
      "war-devotion",
      "water-devotion",
    ]) {
      character.featSelections = { "general-1": id };
      expect(
        getAvailableFeats(character, slot).map((feat) => feat.id),
      ).toContain(id);
    }

    character.featSelections = { "general-1": "chaos-devotion" };
    expect(
      getAvailableFeats(character, slot).map((feat) => feat.id),
    ).toContain("chaos-devotion");

    character.skills["Knowledge (arcana)"] = 4;
    const knowledgeDevotion = featCatalog.find(
      (feat) => feat.id === "knowledge-devotion",
    );
    if (!knowledgeDevotion)
      throw new Error("Missing Knowledge Devotion definition.");
    expect(featQualifies(character, knowledgeDevotion, slot)).toBe(false);
    character.skills["Knowledge (arcana)"] = 5;
    expect(featQualifies(character, knowledgeDevotion, slot)).toBe(true);
    character.featSelections = { "general-1": "knowledge-devotion" };
    expect(
      getAvailableFeats(character, slot).map((feat) => feat.id),
    ).not.toContain("knowledge-devotion");
  });

  it("preserves the first Complete Champion feat benefit checks", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("air-devotion")).toContain("50% miss chance");
    expect(description("air-devotion")).toContain(
      "one additional use for every three turn/rebuke uses",
    );
    expect(description("animal-devotion")).toContain(
      "Multiple powers can remain active",
    );
    expect(description("animal-devotion")).toContain(
      "only one can be activated per round",
    );
    expect(description("awesome-smite")).toContain(
      "choose one maneuver before the attack roll",
    );
    expect(description("awesome-smite")).toContain(
      "ignores miss chances if your weapon can strike the target",
    );
    expect(description("battle-blessing")).toContain(
      "Other casting times are unchanged",
    );
    expect(description("bestial-charge")).toContain(
      "move at least 10 feet before and after",
    );
  });

  it("preserves Complete Champion second-batch benefit limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("chaos-devotion")).toContain("d8 at level 10");
    expect(description("chaos-devotion")).toContain("d10 at 15");
    expect(description("charnel-miasma")).toContain("exude a grave scent");
    expect(description("death-devotion")).toContain(
      "one negative level per target per four character levels",
    );
    expect(description("destruction-devotion")).toContain(
      "one additional use for every turn/rebuke use",
    );
    expect(description("earth-devotion")).toContain(
      "spikes immediately attack creatures underneath",
    );
  });

  it("preserves Complete Champion third-batch benefit limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("elemental-essence")).toContain(
      "effects do not stack and cannot be active simultaneously",
    );
    expect(description("evil-devotion")).toContain(
      "overcome only by good-aligned weapons",
    );
    expect(description("fire-devotion")).toContain(
      "it can douse the flames with a move action",
    );
    expect(description("fire-devotion")).toContain(
      "for every two turn/rebuke uses",
    );
    expect(description("fragile-construct")).toContain(
      "+1 insight bonus on sunder attempts",
    );
    expect(description("good-devotion")).toContain(
      "overcome only by evil-aligned weapons",
    );
  });

  it("preserves Complete Champion wild, tactical, reserve, and healing limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("great-and-small")).toContain("In normal form");
    expect(description("great-and-small")).toContain(
      "cannot stack with size changes",
    );
    expect(description("healing-devotion")).toContain(
      "automatically when reduced to 0 or fewer hit points",
    );
    expect(description("holy-potency")).toContain(
      "Choose two tactical maneuvers",
    );
    expect(description("holy-warrior")).toContain(
      "+1 competence bonus to caster level when casting force spells",
    );
    expect(description("imbued-healing")).toContain(
      "opposed effects may coexist",
    );
    expect(description("imbued-healing")).toContain(
      "Choose one effect for all targets per casting",
    );
  });

  it("preserves Complete Champion knowledge, luck, and reserve limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("knowledge-devotion")).toContain(
      "one check per creature type per combat",
    );
    expect(description("law-devotion")).toContain(
      "At the start of each later action, you can reallocate the bonus",
    );
    expect(description("luck-devotion")).toContain(
      "physical and magical damage",
    );
    expect(description("magic-devotion")).toContain(
      "1d6 damage per two character levels",
    );
    expect(description("mitigate-suffering")).toContain(
      "the same subject can benefit repeatedly",
    );
    expect(description("mitigate-suffering")).toContain(
      "These points last 10 minutes",
    );
  });

  it("preserves Complete Champion protection and counter limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("plant-devotion")).toContain(
      "75% at level 15, and heavy fortification at level 20",
    );
    expect(description("protection-devotion")).toContain(
      "maximum of +7 at level 20",
    );
    expect(description("protective-ward")).toContain(
      "yourself or one ally within 30 feet",
    );
    expect(description("protective-ward")).toContain(
      "until the start of your next turn",
    );
    expect(description("retrieve-spell")).toContain(
      "from the class granting that turn/rebuke ability",
    );
    expect(description("spiritual-counter")).toContain(
      "2 + its level (minimum 1)",
    );
  });

  it("preserves Complete Champion action and devotion limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("spontaneous-domains")).toContain(
      "limited to one domain spell per level per day",
    );
    expect(description("strength-devotion")).toContain("no-AoO slam");
    expect(description("sun-devotion")).toContain(
      "affecting creatures within 10 feet as sunlight",
    );
    expect(description("swift-call")).toContain(
      "swift action instead of a full-round action",
    );
    expect(description("swift-wild-shape")).toContain(
      "swift action instead of a standard action",
    );
  });

  it("preserves Complete Champion final feat benefit and eligibility limits", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Complete Champion feat: ${id}.`);
      return feat.description;
    };

    expect(description("touch-of-healing")).toContain(
      "at or below half its maximum hit points",
    );
    expect(description("travel-devotion")).toContain(
      "cannot take a 5-foot step",
    );
    expect(description("trickery-devotion")).toContain(
      "HP 6 + character level",
    );
    expect(description("umbral-shroud")).toContain(
      "Blind-Fight works normally",
    );
    expect(description("venoms-gift")).toContain(
      "ordinary unarmed strikes do not qualify",
    );
    expect(description("war-devotion")).toContain(
      "stacks with Combat Expertise",
    );
    expect(description("water-devotion")).toContain(
      "pour out a full waterskin",
    );
  });

  it("requires wild shape and plant-form access for Venom's Gift", () => {
    const feat = featCatalog.find(
      (candidate) => candidate.id === "venoms-gift",
    );
    if (!feat) throw new Error("Missing Venom's Gift fixture.");
    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 9 }];
    druid.featSelections = {
      "general-1": "elemental-essence",
      "general-3": "scent",
    };
    const slot = { fighterOnly: false, characterLevel: 12 };
    druid.classLevels = [{ classId: "fighter", level: 9 }];
    druid.classFeatures = ["Wild Shape", "Wild Shape (plant)"];
    expect(featQualifies(druid, feat, slot)).toBe(false);
    druid.classLevels = [{ classId: "druid", level: 12 }];
    expect(featQualifies(druid, feat, slot)).toBe(true);
  });

  it("enforces prerequisites for the represented Complete Champion feats", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return feat;
    };
    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 6 }];
    paladin.abilities.str = 13;
    paladin.abilities.wis = 14;
    const slot = getChronologicalFeatSlots(paladin).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!slot) throw new Error("Missing Complete Champion feat slot.");

    const awesomeSmite = featFor("awesome-smite");
    paladin.featSelections = { "general-1": "power-attack" };
    expect(featQualifies(paladin, awesomeSmite, slot)).toBe(true);
    paladin.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(paladin, awesomeSmite, slot)).toBe(false);

    const battleBlessing = featFor("battle-blessing");
    paladin.classLevels = [{ classId: "paladin", level: 6 }];
    expect(featQualifies(paladin, battleBlessing, slot)).toBe(true);
    paladin.abilities.wis = 10;
    expect(featQualifies(paladin, battleBlessing, slot)).toBe(false);

    const swiftCall = featFor("swift-call");
    expect(featQualifies(paladin, swiftCall, slot)).toBe(true);
    paladin.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(paladin, swiftCall, slot)).toBe(false);

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 6 }];
    const druidSlot = getChronologicalFeatSlots(druid).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!druidSlot) throw new Error("Missing Bestial Charge feat slot.");
    const bestialCharge = featFor("bestial-charge");
    expect(featQualifies(druid, bestialCharge, druidSlot)).toBe(true);
    druid.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(druid, bestialCharge, druidSlot)).toBe(false);
  });

  it("enforces Complete Champion spell and divine-feat prerequisites", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return feat;
    };
    const spontaneousDomains = featFor("spontaneous-domains");
    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    cleric.abilities.wis = 13;
    cleric.deity = "pelor";
    cleric.clericDomains = ["good", "healing"];
    const clericSlot = getChronologicalFeatSlots(cleric).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!clericSlot)
      throw new Error("Missing Spontaneous Domains feat slot.");
    expect(featQualifies(cleric, spontaneousDomains, clericSlot)).toBe(true);
    cleric.clericDomains = ["good"];
    expect(featQualifies(cleric, spontaneousDomains, clericSlot)).toBe(false);
    cleric.clericDomains = ["good", "healing"];
    cleric.classLevels = [{ classId: "cleric", level: 4 }];
    const earlierClericSlot = getChronologicalFeatSlots(cleric).find(
      (candidate) => candidate.id === "general-3",
    );
    if (!earlierClericSlot)
      throw new Error("Missing earlier Spontaneous Domains feat slot.");
    expect(
      featQualifies(cleric, spontaneousDomains, earlierClericSlot),
    ).toBe(false);

    const divineFeatIds = [
      "divine-cleansing",
      "divine-might",
      "divine-resistance",
      "divine-shield",
      "divine-vigor",
      "sacred-vengeance",
    ];
    for (const id of divineFeatIds)
      expect(featFor(id).categories).toContain("divine");

    const retrieveSpell = featFor("retrieve-spell");
    const spiritualCounter = featFor("spiritual-counter");
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    cleric.featSelections = {
      "general-1": "divine-cleansing",
      "general-3": "divine-vigor",
    };
    expect(featQualifies(cleric, retrieveSpell, clericSlot)).toBe(true);
    expect(featQualifies(cleric, spiritualCounter, clericSlot)).toBe(true);
    cleric.featSelections = { "general-1": "divine-cleansing" };
    expect(featQualifies(cleric, retrieveSpell, clericSlot)).toBe(false);
    expect(featQualifies(cleric, spiritualCounter, clericSlot)).toBe(true);
    cleric.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(cleric, spiritualCounter, clericSlot)).toBe(false);

    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    cleric.deity = "pelor";
    cleric.alignment = "Neutral Good";
    cleric.clericDomains = ["good"];
    const imbuedHealing = featFor("imbued-healing");
    expect(imbuedHealing.categories).toContain("metamagic");
    expect(featQualifies(cleric, imbuedHealing, clericSlot)).toBe(false);
    cleric.hasConjurationHealingSpell = true;
    expect(featQualifies(cleric, imbuedHealing, clericSlot)).toBe(true);

    const charnelMiasma = featFor("charnel-miasma");
    cleric.deity = "wee-jas";
    cleric.alignment = "Lawful Neutral";
    cleric.clericDomains = ["death", "law"];
    expect(featQualifies(cleric, charnelMiasma, clericSlot)).toBe(true);
    cleric.deity = "pelor";
    cleric.alignment = "Neutral Good";
    cleric.clericDomains = ["good", "healing"];
    expect(featQualifies(cleric, charnelMiasma, clericSlot)).toBe(false);

    const fragileConstruct = featFor("fragile-construct");
    cleric.deity = "st-cuthbert";
    cleric.alignment = "Lawful Neutral";
    cleric.clericDomains = ["destruction", "law"];
    expect(featQualifies(cleric, fragileConstruct, clericSlot)).toBe(true);
  });

  it("enforces the remaining Complete Champion feat prerequisites", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      return feat;
    };
    const slotFor = (character: Character, id: string) => {
      const slot = getChronologicalFeatSlots(character).find(
        (candidate) => candidate.id === id,
      );
      if (!slot) throw new Error(`Missing feat slot: ${id}`);
      return slot;
    };

    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    cleric.abilities.wis = 14;
    cleric.deity = "heironeous";
    cleric.clericDomains = ["good", "law", "war"];
    const clericSixSlot = slotFor(cleric, "general-6");
    expect(featQualifies(cleric, featFor("holy-warrior"), clericSixSlot)).toBe(
      false,
    );
    cleric.classLevels = [{ classId: "cleric", level: 9 }];
    const clericNineSlot = slotFor(cleric, "general-9");
    expect(featQualifies(cleric, featFor("holy-warrior"), clericNineSlot)).toBe(
      true,
    );
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    const holyPotency = featFor("holy-potency");
    expect(featQualifies(cleric, holyPotency, clericSixSlot)).toBe(true);
    cleric.alignment = "True Neutral";
    cleric.deity = "gilean";
    cleric.clericUndeadTurningMode = undefined;
    expect(featQualifies(cleric, holyPotency, clericSixSlot)).toBe(false);
    cleric.clericUndeadTurningMode = "turn";
    expect(featQualifies(cleric, holyPotency, clericSixSlot)).toBe(true);

    cleric.deity = "st-cuthbert";
    cleric.clericDomains = ["destruction", "law", "protection"];
    expect(
      featQualifies(cleric, featFor("protective-ward"), clericSixSlot),
    ).toBe(true);

    for (const [id, level, slotId] of [
      ["mitigate-suffering", 3, "general-3"],
      ["touch-of-healing", 3, "general-3"],
      ["umbral-shroud", 6, "general-6"],
    ] as const) {
      cleric.classLevels = [{ classId: "cleric", level }];
      expect(featQualifies(cleric, featFor(id), slotFor(cleric, slotId))).toBe(
        true,
      );
    }

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 15 }];
    druid.abilities.dex = 13;
    druid.featSelections = {
      "general-1": "scent",
      "general-3": "climb-like-an-ape",
    };
    const druidSlot = slotFor(druid, "general-15");
    for (const id of [
      "blindsense",
      "climb-like-an-ape",
      "cougars-vision",
      "hawks-vision",
      "savage-grapple",
      "scent",
      "elemental-essence",
      "great-and-small",
      "venoms-gift",
    ])
      expect(featFor(id).categories).toContain("wild");
    for (const id of ["awesome-smite", "bestial-charge", "holy-potency"])
      expect(featFor(id).categories).toContain("tactical");
    expect(
      featQualifies(druid, featFor("elemental-essence"), druidSlot),
    ).toBe(true);
    expect(featQualifies(druid, featFor("venoms-gift"), druidSlot)).toBe(true);
    druid.featSelections = { "general-1": "scent" };
    expect(featQualifies(druid, featFor("venoms-gift"), druidSlot)).toBe(
      false,
    );

    druid.classLevels = [{ classId: "druid", level: 9 }];
    const largeShapeSlot = slotFor(druid, "general-9");
    expect(
      featQualifies(druid, featFor("great-and-small"), largeShapeSlot),
    ).toBe(true);

    druid.classLevels = [{ classId: "druid", level: 6 }];
    const swiftShape = featFor("swift-wild-shape");
    const swiftShapeSlot = slotFor(druid, "general-6");
    expect(featQualifies(druid, swiftShape, swiftShapeSlot)).toBe(false);
    druid.hasFastWildShape = true;
    expect(featQualifies(druid, swiftShape, swiftShapeSlot)).toBe(true);
    druid.abilities.dex = 12;
    expect(featQualifies(druid, swiftShape, swiftShapeSlot)).toBe(false);
  });

  it("enforces prerequisites for the first Complete Divine feats", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      expect(feat.sourceBook).toBe("Complete Divine (3.5)");
      return feat;
    };
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 6 }];
    wizard.skills["Knowledge (religion)"] = 4;
    wizard.skills.Spellcraft = 4;
    wizard.deity = "heironeous";
    wizard.alignment = "Lawful Good";
    const wizardSlot = getChronologicalFeatSlots(wizard).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!wizardSlot) throw new Error("Missing Arcane Disciple feat slot.");
    const arcaneDisciple = featFor("arcane-disciple");
    expect(featQualifies(wizard, arcaneDisciple, wizardSlot)).toBe(true);
    wizard.alignment = "Neutral Good";
    expect(featQualifies(wizard, arcaneDisciple, wizardSlot)).toBe(false);

    const healer = cloneCharacter(initialCharacter);
    healer.classLevels = [{ classId: "fighter", level: 6 }];
    healer.skills.Heal = 4;
    const healerSlot = getChronologicalFeatSlots(healer).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!healerSlot) throw new Error("Missing Augment Healing feat slot.");
    const augmentHealing = featFor("augment-healing");
    expect(featQualifies(healer, augmentHealing, healerSlot)).toBe(true);
    healer.skills.Heal = 3;
    expect(featQualifies(healer, augmentHealing, healerSlot)).toBe(false);

    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    cleric.deity = "pelor";
    cleric.clericDomains = ["good", "healing"];
    const clericSlot = getChronologicalFeatSlots(cleric).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!clericSlot) throw new Error("Missing Complete Divine feat slot.");
    expect(
      featQualifies(cleric, featFor("domain-focus"), clericSlot),
    ).toBe(true);
    cleric.clericDomains = [];
    expect(
      featQualifies(cleric, featFor("domain-focus"), clericSlot),
    ).toBe(false);
    cleric.clericDomains = ["good", "healing"];
    expect(
      featQualifies(cleric, featFor("empower-turning"), clericSlot),
    ).toBe(true);
    cleric.classLevels = [{ classId: "fighter", level: 6 }];
    expect(
      featQualifies(cleric, featFor("empower-turning"), clericSlot),
    ).toBe(false);

    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 1 }];
    paladin.abilities.cha = 13;
    const paladinSlot = getChronologicalFeatSlots(paladin).find(
      (candidate) => candidate.id === "general-1",
    );
    if (!paladinSlot) throw new Error("Missing Improved Smiting feat slot.");
    const improvedSmiting = featFor("improved-smiting");
    expect(featQualifies(paladin, improvedSmiting, paladinSlot)).toBe(true);
    paladin.abilities.cha = 12;
    expect(featQualifies(paladin, improvedSmiting, paladinSlot)).toBe(false);

    const turner = cloneCharacter(initialCharacter);
    turner.classLevels = [{ classId: "cleric", level: 1 }];
    const turningSlot = getChronologicalFeatSlots(turner).find(
      (candidate) => candidate.id === "general-1",
    );
    if (!turningSlot) throw new Error("Missing Quicken Turning feat slot.");
    expect(
      featQualifies(turner, featFor("quicken-turning"), turningSlot),
    ).toBe(true);
    turner.classLevels = [{ classId: "fighter", level: 1 }];
    expect(
      featQualifies(turner, featFor("quicken-turning"), turningSlot),
    ).toBe(false);

    const spellcaster = cloneCharacter(initialCharacter);
    spellcaster.classLevels = [{ classId: "wizard", level: 6 }];
    const spellFocusSlot = getChronologicalFeatSlots(spellcaster).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!spellFocusSlot) throw new Error("Missing Spell Focus feat slot.");
    const spellFocusAlignments = [
      ["spell-focus-chaos", "Chaotic Good", true],
      ["spell-focus-evil", "Chaotic Evil", true],
      ["spell-focus-good", "Neutral Good", true],
      ["spell-focus-law", "Lawful Neutral", true],
      ["spell-focus-chaos", "Lawful Good", false],
    ] as const;
    for (const [id, alignment, qualifies] of spellFocusAlignments) {
      spellcaster.alignment = alignment;
      expect(
        featQualifies(spellcaster, featFor(id), spellFocusSlot),
      ).toBe(qualifies);
    }

    const spontaneousCaster = cloneCharacter(initialCharacter);
    spontaneousCaster.classLevels = [{ classId: "cleric", level: 6 }];
    spontaneousCaster.skills["Knowledge (religion)"] = 4;
    spontaneousCaster.skills["Knowledge (nature)"] = 4;
    spontaneousCaster.abilities.wis = 13;
    const spontaneousSlot = getChronologicalFeatSlots(
      spontaneousCaster,
    ).find((candidate) => candidate.id === "general-6");
    if (!spontaneousSlot)
      throw new Error("Missing spontaneous-feat slot.");
    const spontaneousHealerFeat = featFor("spontaneous-healer");
    expect(
      featQualifies(spontaneousCaster, spontaneousHealerFeat, spontaneousSlot),
    ).toBe(false);
    spontaneousCaster.hasCureWoundsSpell = true;
    expect(
      featQualifies(spontaneousCaster, spontaneousHealerFeat, spontaneousSlot),
    ).toBe(true);
    spontaneousCaster.alignment = "Neutral Evil";
    expect(
      featQualifies(spontaneousCaster, spontaneousHealerFeat, spontaneousSlot),
    ).toBe(false);

    const summoner = featFor("spontaneous-summoner");
    spontaneousCaster.alignment = "Lawful Neutral";
    expect(
      featQualifies(spontaneousCaster, summoner, spontaneousSlot),
    ).toBe(false);
    spontaneousCaster.hasSummonNaturesAllySpell = true;
    spontaneousCaster.abilities.wis = 12;
    expect(
      featQualifies(spontaneousCaster, summoner, spontaneousSlot),
    ).toBe(false);
    spontaneousCaster.abilities.wis = 13;
    expect(
      featQualifies(spontaneousCaster, summoner, spontaneousSlot),
    ).toBe(true);
    spontaneousCaster.alignment = "Chaotic Good";
    expect(
      featQualifies(spontaneousCaster, summoner, spontaneousSlot),
    ).toBe(false);

    const wounder = featFor("spontaneous-wounder");
    spontaneousCaster.alignment = "Neutral Good";
    spontaneousCaster.hasInflictWoundsSpell = true;
    expect(
      featQualifies(spontaneousCaster, wounder, spontaneousSlot),
    ).toBe(false);
    spontaneousCaster.alignment = "Neutral Evil";
    expect(
      featQualifies(spontaneousCaster, wounder, spontaneousSlot),
    ).toBe(true);

    const divineCaster = cloneCharacter(initialCharacter);
    divineCaster.classLevels = [{ classId: "cleric", level: 6 }];
    divineCaster.alignment = "Neutral Good";
    divineCaster.abilities.wis = 11;
    divineCaster.deity = "pelor";
    divineCaster.clericDomains = ["good", "healing"];
    const divineSlot = getChronologicalFeatSlots(divineCaster).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!divineSlot) throw new Error("Missing Complete Divine feat slot.");
    const discipleOfTheSun = featFor("disciple-of-the-sun");
    expect(
      featQualifies(divineCaster, discipleOfTheSun, divineSlot),
    ).toBe(true);
    divineCaster.alignment = "True Neutral";
    expect(
      featQualifies(divineCaster, discipleOfTheSun, divineSlot),
    ).toBe(false);
    divineCaster.alignment = "Neutral Good";

    const divineMetamagic = featFor("divine-metamagic");
    expect(
      featQualifies(divineCaster, divineMetamagic, divineSlot),
    ).toBe(false);
    divineCaster.featSelections = { "general-1": "empower-spell" };
    expect(
      featQualifies(divineCaster, divineMetamagic, divineSlot),
    ).toBe(true);
    divineCaster.featSelections = {};

    const divineSpellPower = featFor("divine-spell-power");
    expect(
      featQualifies(divineCaster, divineSpellPower, divineSlot),
    ).toBe(true);
    const turningFighter = cloneCharacter(initialCharacter);
    turningFighter.classLevels = [{ classId: "fighter", level: 6 }];
    turningFighter.classFeatures = ["Turn Undead"];
    const fighterSlot = getChronologicalFeatSlots(turningFighter).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!fighterSlot) throw new Error("Missing fighter feat slot.");
    expect(
      featQualifies(turningFighter, divineSpellPower, fighterSlot),
    ).toBe(false);

    const domainSpontaneity = featFor("domain-spontaneity");
    divineCaster.clericDomains = [];
    expect(
      featQualifies(divineCaster, domainSpontaneity, divineSlot),
    ).toBe(false);
    divineCaster.clericDomains = ["good"];
    expect(
      featQualifies(divineCaster, domainSpontaneity, divineSlot),
    ).toBe(true);
    expect(
      featQualifies(
        divineCaster,
        featFor("glorious-weapons"),
        divineSlot,
      ),
    ).toBe(true);

    const divineRepeatableCaster = cloneCharacter(initialCharacter);
    divineRepeatableCaster.classLevels = [
      { classId: "cleric", level: 9 },
    ];
    divineRepeatableCaster.alignment = "Neutral Good";
    divineRepeatableCaster.abilities.wis = 11;
    divineRepeatableCaster.deity = "pelor";
    divineRepeatableCaster.clericDomains = ["good", "healing"];
    const divineRepeatableSixthSlot = getChronologicalFeatSlots(
      divineRepeatableCaster,
    ).find((candidate) => candidate.id === "general-6");
    if (!divineRepeatableSixthSlot)
      throw new Error("Missing sixth-level repeatable-feat slot.");
    const ninthLevelSlot = getChronologicalFeatSlots(
      divineRepeatableCaster,
    ).find(
      (candidate) => candidate.id === "general-9",
    );
    if (!ninthLevelSlot)
      throw new Error("Missing ninth-level repeatable-feat slot.");
    divineRepeatableCaster.featSelections = {
      "general-6": "domain-focus",
    };
    expect(
      getAvailableFeats(divineRepeatableCaster, ninthLevelSlot).map(
        (feat) => feat.id,
      ),
    ).toContain("domain-focus");
    divineRepeatableCaster.featSelections = {
      "general-1": "empower-spell",
      "general-6": "divine-metamagic",
    };
    expect(
      getAvailableFeats(divineRepeatableCaster, ninthLevelSlot).map(
        (feat) => feat.id,
      ),
    ).toContain("divine-metamagic");
    divineRepeatableCaster.featSelections = {
      "general-6": "domain-spontaneity",
    };
    expect(
      getAvailableFeats(divineRepeatableCaster, ninthLevelSlot).map(
        (feat) => feat.id,
      ),
    ).toContain("domain-spontaneity");

    const arcaneDiscipleWizard = cloneCharacter(initialCharacter);
    arcaneDiscipleWizard.classLevels = [{ classId: "wizard", level: 9 }];
    arcaneDiscipleWizard.deity = "heironeous";
    arcaneDiscipleWizard.alignment = "Lawful Good";
    arcaneDiscipleWizard.skills["Knowledge (religion)"] = 4;
    arcaneDiscipleWizard.skills.Spellcraft = 4;
    arcaneDiscipleWizard.featSelections = {
      "general-6": "arcane-disciple",
    };
    const wizardNinthLevelSlot = getChronologicalFeatSlots(
      arcaneDiscipleWizard,
    ).find(
      (candidate) => candidate.id === "general-9",
    );
    if (!wizardNinthLevelSlot)
      throw new Error("Missing wizard ninth-level repeatable-feat slot.");
    expect(
      getAvailableFeats(arcaneDiscipleWizard, wizardNinthLevelSlot).map(
        (feat) => feat.id,
      ),
    ).toContain("arcane-disciple");
  });

  it("enforces prerequisites for the remaining Complete Divine divine feats", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      expect(feat.sourceBook).toBe("Complete Divine (3.5)");
      return feat;
    };
    const slotFor = (character: Character, id: string) => {
      const slot = getChronologicalFeatSlots(character).find(
        (candidate) => candidate.id === id,
      );
      if (!slot) throw new Error(`Missing feat slot: ${id}`);
      return slot;
    };

    const elementalCharacter = cloneCharacter(initialCharacter);
    elementalCharacter.classLevels = [{ classId: "fighter", level: 1 }];
    const elementalSlot = slotFor(elementalCharacter, "general-1");
    const elementalSmiting = featFor("elemental-smiting");
    const elementalHealing = featFor("elemental-healing");
    expect(elementalSmiting.categories).toContain("divine");
    expect(elementalHealing.categories).toContain("divine");
    expect(
      featQualifies(elementalCharacter, elementalSmiting, elementalSlot),
    ).toBe(false);
    elementalCharacter.canTurnElementalSubtype = true;
    expect(
      featQualifies(elementalCharacter, elementalSmiting, elementalSlot),
    ).toBe(true);
    expect(
      featQualifies(elementalCharacter, elementalHealing, elementalSlot),
    ).toBe(false);
    elementalCharacter.canRebukeElementalSubtype = true;
    expect(
      featQualifies(elementalCharacter, elementalHealing, elementalSlot),
    ).toBe(true);
    elementalCharacter.canTurnElementalSubtype = false;
    expect(
      featQualifies(elementalCharacter, elementalSmiting, elementalSlot),
    ).toBe(false);

    const rebuker = cloneCharacter(initialCharacter);
    rebuker.ruleset = "dragonlance-user-pack";
    rebuker.classLevels = [
      {
        classId: "cleric",
        prestigeClassId: "knight-of-the-skull",
        level: 6,
      },
    ];
    const rebukerSlot = slotFor(rebuker, "general-6");
    expect(
      featQualifies(rebuker, featFor("profane-boost"), rebukerSlot),
    ).toBe(true);
    expect(
      featQualifies(rebuker, featFor("sacred-boost"), rebukerSlot),
    ).toBe(false);

    const turner = cloneCharacter(initialCharacter);
    turner.classLevels = [{ classId: "paladin", level: 6 }];
    turner.skills.Heal = 7;
    const turnerSlot = slotFor(turner, "general-6");
    const sacredHealing = featFor("sacred-healing");
    expect(
      featQualifies(turner, featFor("sacred-boost"), turnerSlot),
    ).toBe(true);
    expect(
      featQualifies(turner, sacredHealing, turnerSlot),
    ).toBe(false);
    turner.skills.Heal = 8;
    expect(
      featQualifies(turner, sacredHealing, turnerSlot),
    ).toBe(true);

    const believer = cloneCharacter(initialCharacter);
    believer.classLevels = [{ classId: "fighter", level: 1 }];
    believer.deity = "heironeous";
    believer.alignment = "Neutral Good";
    const believerSlot = slotFor(believer, "general-1");
    const trueBeliever = featFor("true-believer");
    expect(trueBeliever.description).toContain("+2 insight bonus");
    expect(
      featQualifies(believer, trueBeliever, believerSlot),
    ).toBe(true);
    believer.alignment = "True Neutral";
    expect(
      featQualifies(believer, trueBeliever, believerSlot),
    ).toBe(false);
    believer.alignment = "Neutral Good";
    believer.deity = undefined;
    expect(
      featQualifies(believer, trueBeliever, believerSlot),
    ).toBe(false);
  });

  it("enforces the remaining Complete Divine item creation, metamagic, and wild feats", () => {
    const featFor = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat definition: ${id}`);
      expect(feat.sourceBook).toBe("Complete Divine (3.5)");
      return feat;
    };
    const slotFor = (character: Character, id: string) => {
      const slot = getChronologicalFeatSlots(character).find(
        (candidate) => candidate.id === id,
      );
      if (!slot) throw new Error(`Missing feat slot: ${id}`);
      return slot;
    };

    const relic = featFor("sanctify-relic");
    expect(relic.categories).toContain("item-creation");
    const crafter = cloneCharacter(initialCharacter);
    crafter.classLevels = [{ classId: "sorcerer", level: 6 }];
    const crafterSlot = slotFor(crafter, "general-6");
    expect(featQualifies(crafter, relic, crafterSlot)).toBe(false);
    expect(
      getAvailableFeats(crafter, crafterSlot).map((feat) => feat.id),
    ).not.toContain("sanctify-relic");
    crafter.featSelections = { "general-1": "scribe-scroll" };
    expect(featQualifies(crafter, relic, crafterSlot)).toBe(true);
    expect(
      getAvailableFeats(crafter, crafterSlot).map((feat) => feat.id),
    ).toContain("sanctify-relic");
    const selfPrerequisite = cloneCharacter(initialCharacter);
    selfPrerequisite.classLevels = [{ classId: "fighter", level: 6 }];
    selfPrerequisite.featSelections = { "general-1": "sanctify-relic" };
    expect(
      featQualifies(
        selfPrerequisite,
        relic,
        slotFor(selfPrerequisite, "general-6"),
      ),
    ).toBe(false);

    const alignmentCharacter = cloneCharacter(initialCharacter);
    alignmentCharacter.classLevels = [{ classId: "fighter", level: 6 }];
    alignmentCharacter.alignment = "Neutral Good";
    const alignmentSlot = slotFor(alignmentCharacter, "general-6");
    const consecrateSpell = featFor("consecrate-spell");
    const corruptSpell = featFor("corrupt-spell");
    expect(consecrateSpell.categories).toContain("metamagic");
    expect(corruptSpell.categories).toContain("metamagic");
    expect(
      featQualifies(alignmentCharacter, consecrateSpell, alignmentSlot),
    ).toBe(true);
    expect(
      featQualifies(alignmentCharacter, corruptSpell, alignmentSlot),
    ).toBe(false);
    alignmentCharacter.alignment = "Lawful Evil";
    expect(
      featQualifies(alignmentCharacter, consecrateSpell, alignmentSlot),
    ).toBe(false);
    expect(
      featQualifies(alignmentCharacter, corruptSpell, alignmentSlot),
    ).toBe(true);

    const unalignedMetamagics = ["rapid-spell", "reach-spell"];
    for (const id of unalignedMetamagics) {
      const feat = featFor(id);
      expect(feat.categories).toContain("metamagic");
      expect(featQualifies(alignmentCharacter, feat, alignmentSlot)).toBe(true);
    }

    const wildFeatIds = [
      "boars-ferocity",
      "cheetahs-speed",
      "eagles-wings",
      "elephants-hide",
    ];
    const wildFeats = wildFeatIds.map(featFor);
    for (const feat of wildFeats) {
      expect(feat.categories).toContain("wild");
    }

    const nonShaper = cloneCharacter(initialCharacter);
    nonShaper.classLevels = [{ classId: "fighter", level: 6 }];
    const nonShaperSlot = slotFor(nonShaper, "general-6");
    for (const feat of wildFeats) {
      expect(featQualifies(nonShaper, feat, nonShaperSlot)).toBe(false);
    }

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [{ classId: "druid", level: 6 }];
    const druidSlot = slotFor(druid, "general-6");
    for (const feat of wildFeats.slice(0, 3)) {
      expect(featQualifies(druid, feat, druidSlot)).toBe(true);
    }
    expect(featQualifies(druid, wildFeats[3], druidSlot)).toBe(false);

    const largeFormDruid = cloneCharacter(initialCharacter);
    largeFormDruid.classLevels = [
      { classId: "druid", level: 8 },
      { classId: "fighter", level: 1 },
    ];
    expect(
      featQualifies(
        largeFormDruid,
        wildFeats[3],
        slotFor(largeFormDruid, "general-9"),
      ),
    ).toBe(true);
  });

  it("matches the Complete Divine table's represented feats", () => {
    const representedNames = new Set(
      featCatalog
        .map((feat) =>
          feat.name.match(/^Spell Focus \((Chaos|Evil|Good|Law)\)$/)
            ? "Spell Focus (Chaos, Evil, Good, Law)"
            : feat.name.replace(/\s+\([^)]*\)$/, ""),
        )
        .map(normalizeFeatName)
        .filter((name) => completeDivineTableFeats.has(name)),
    );
    expect(completeDivineTableFeats.size).toBe(32);
    expect([...representedNames].sort()).toEqual([
      "Arcane Disciple",
      "Augment Healing",
      "Boar's Ferocity",
      "Cheetah's Speed",
      "Consecrate Spell",
      "Corrupt Spell",
      "Disciple of the Sun",
      "Divine Metamagic",
      "Divine Spell Power",
      "Domain Focus",
      "Domain Spontaneity",
      "Eagle's Wings",
      "Elemental Healing",
      "Elemental Smiting",
      "Elephant's Hide",
      "Empower Turning",
      "Glorious Weapons",
      "Improved Smiting",
      "Practiced Spellcaster",
      "Profane Boost",
      "Quicken Turning",
      "Rapid Spell",
      "Reach Spell",
      "Sacred Boost",
      "Sacred Healing",
      "Sanctify Relic",
      "Spell Focus (Chaos, Evil, Good, Law)",
      "Spontaneous Healer",
      "Spontaneous Summoner",
      "Spontaneous Wounder",
      "Transdimensional Spell",
      "True Believer",
    ]);
  });

  it("matches the Complete Arcane table's catalog overlap", () => {
    const representedNames = new Set(
      featCatalog
        .map((feat) => feat.name.replace(/\s+\([^)]*\)$/, ""))
        .map(normalizeFeatName)
        .filter((name) => completeArcaneTableFeats.has(name)),
    );
    const unrepresentedNames = new Set(
      [...completeArcaneTableFeats].filter(
        (name) => !representedNames.has(name),
      ),
    );
    expect(completeArcaneTableFeats.size).toBe(64);
    expect(representedNames.size).toBe(64);
    expect(unrepresentedNames).toEqual(completeArcaneUnrepresentedFeats);
  });

  it("enforces Extra Edge's manually confirmed Warmage level prerequisite", () => {
    const extraEdge = featCatalog.find((feat) => feat.id === "extra-edge");
    if (!extraEdge) throw new Error("Missing Extra Edge feat fixture.");
    expect(extraEdge.sourceBook).toBe("Complete Arcane (3.5)");
    expect(extraEdge.prerequisites?.warmageLevelFour).toBe(true);

    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    const slot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!slot) throw new Error("Missing sixth-level general feat slot.");
    expect(featQualifies(character, extraEdge, slot)).toBe(false);
    expect(
      getAvailableFeats(character, slot).map((feat) => feat.id),
    ).not.toContain("extra-edge");

    character.hasWarmageLevelFour = true;
    expect(featQualifies(character, extraEdge, slot)).toBe(true);
    expect(
      getAvailableFeats(character, slot).map((feat) => feat.id),
    ).toContain("extra-edge");
  });

  it("tracks the represented Complete Mage feats", () => {
    const representedNames = featCatalog
      .filter((feat) => completeMageFeats.has(normalizeFeatName(feat.name)))
      .map((feat) => feat.name);
    expect(completeMageFeats.size).toBe(65);
    expect(representedNames.sort()).toEqual([
      "Acidic Splatter",
      "Alacritous Cogitation",
      "Aquatic Breath",
      "Battlecaster Defense",
      "Battlecaster Offense",
      "Blade of Force",
      "Borne Aloft",
      "Captivating Melody",
      "Clap of Thunder",
      "Cloudy Conjuration",
      "Clutch of Earth",
      "Dazzling Illusion",
      "Defending Spirit",
      "Delay Potion",
      "Dimensional Jaunt",
      "Dimensional Reach",
      "Drowning Glance",
      "Elemental Adept",
      "Energy Abjuration",
      "Energy Gestalt",
      "Face-Changer",
      "Favored Magic Foe",
      "Fearsome Necromancy",
      "Fey Heritage",
      "Fey Legacy",
      "Fey Power",
      "Fey Presence",
      "Fey Skin",
      "Fiendish Heritage",
      "Fiendish Legacy",
      "Fiendish Power",
      "Fiendish Presence",
      "Fiendish Resistance",
      "Fiery Burst",
      "Hasty Spirit",
      "Hurricane Breath",
      "Insightful Divination",
      "Invisible Needle",
      "Magic Device Attunement",
      "Magic Disruption",
      "Magic Sensitive",
      "Master of Undeath",
      "Melodic Casting",
      "Metamagic School Focus",
      "Metamagic Spell Trigger",
      "Metamagic Vigor",
      "Minor Shapeshift",
      "Mystic Backlash",
      "Piercing Evocation",
      "Ranged Recall",
      "Rapid Metamagic",
      "Residual Magic",
      "Retributive Spell",
      "Shadow Veil",
      "Sickening Grasp",
      "Somatic Weaponry",
      "Storm Bolt",
      "Summon Elemental",
      "Sunlight Eyes",
      "Touch of Distraction",
      "Toughening Transmutation",
      "Unsettling Enchantment",
      "Vengeful Spirit",
      "Wind-Guided Arrows",
      "Winter's Blast",
    ]);
  });

  it("enforces Complete Mage prepared and spontaneous casting prerequisites", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    const wizardSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-3",
    );
    if (!wizardSlot) throw new Error("Missing third-level Wizard feat slot.");
    const wizardFeats = getAvailableFeats(wizard, wizardSlot).map(
      (feat) => feat.id,
    );
    expect(wizardFeats).toContain("alacritous-cogitation");
    expect(wizardFeats).not.toContain("rapid-metamagic");

    const sorcerer = cloneCharacter(initialCharacter);
    sorcerer.classLevels = [{ classId: "sorcerer", level: 12 }];
    sorcerer.skills.Spellcraft = 11;
    const sorcererSlot = getFeatSlots(sorcerer).find(
      (slot) => slot.id === "general-12",
    );
    if (!sorcererSlot) throw new Error("Missing twelfth-level Sorcerer feat slot.");
    const availableIds = () =>
      getAvailableFeats(sorcerer, sorcererSlot).map((feat) => feat.id);
    expect(availableIds()).not.toContain("alacritous-cogitation");
    expect(availableIds()).not.toContain("rapid-metamagic");
    sorcerer.skills.Spellcraft = 12;
    expect(availableIds()).toContain("rapid-metamagic");
  });

  it("uses core Wizard specialization or Spell Focus for Complete Mage school feats", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    wizard.coreWizardSpecializationSchool = "Conjuration";
    const thirdLevelSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level Wizard feat slot.");
    const availableIds = () =>
      getAvailableFeats(wizard, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toContain("cloudy-conjuration");
    expect(availableIds()).not.toContain("dazzling-illusion");
    expect(availableIds()).toContain("metamagic-school-focus");
    expect(
      getAvailableFeatSpellSchoolChoices(
        wizard,
        thirdLevelSlot.id,
        "metamagic-school-focus",
      ),
    ).toEqual(["Conjuration"]);

    wizard.coreWizardSpecializationSchool = undefined;
    wizard.featSelections = { "general-1": "spell-focus" };
    wizard.featSpellSchoolSelections = { "general-1": "Evocation" };
    expect(availableIds()).toContain("piercing-evocation");
    expect(availableIds()).not.toContain("cloudy-conjuration");
    expect(
      getAvailableFeatSpellSchoolChoices(
        wizard,
        thirdLevelSlot.id,
        "metamagic-school-focus",
      ),
    ).toEqual(["Evocation"]);

    const repeatableWizard = cloneCharacter(initialCharacter);
    repeatableWizard.classLevels = [{ classId: "wizard", level: 6 }];
    repeatableWizard.coreWizardSpecializationSchool = "Conjuration";
    repeatableWizard.featSelections = {
      "general-1": "metamagic-school-focus",
      "general-3": "spell-focus",
    };
    repeatableWizard.featSpellSchoolSelections = {
      "general-1": "Conjuration",
      "general-3": "Evocation",
    };
    const sixthLevelSlot = getFeatSlots(repeatableWizard).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot)
      throw new Error("Missing sixth-level Wizard feat slot.");
    expect(
      getAvailableFeats(repeatableWizard, sixthLevelSlot).map((feat) => feat.id),
    ).toContain("metamagic-school-focus");
    expect(
      getAvailableFeatSpellSchoolChoices(
        repeatableWizard,
        sixthLevelSlot.id,
        "metamagic-school-focus",
      ),
    ).toEqual(["Evocation"]);
  });

  it("checks the Wu Jen class features required by Complete Mage spirit feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.abilities.int = 14;
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level feat slot.");
    const availableIds = () =>
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id);
    expect(availableIds()).not.toContain("elemental-adept");
    for (const feat of ["defending-spirit", "hasty-spirit", "vengeful-spirit"])
      expect(availableIds()).not.toContain(feat);

    character.classFeatures = ["Watchful Spirit"];
    expect(availableIds()).toContain("defending-spirit");
    expect(availableIds()).toContain("hasty-spirit");
    expect(availableIds()).toContain("vengeful-spirit");
    expect(availableIds()).toContain("guardian-spirit");
    expect(availableIds()).not.toContain("elemental-adept");
    expect(availableIds()).not.toContain("extra-spell-secret");

    character.classFeatures = ["Elemental Mastery"];
    expect(availableIds()).toContain("elemental-adept");
    expect(availableIds()).not.toContain("defending-spirit");
    expect(availableIds()).not.toContain("guardian-spirit");

    character.classFeatures = ["Spell Secret"];
    expect(availableIds()).toContain("extra-spell-secret");
    character.featSelections = { "general-1": "extra-spell-secret" };
    expect(availableIds()).toContain("extra-spell-secret");

    character.classFeatures = ["Lesser Invocations"];
    character.featSelections = { "general-1": "extra-invocation" };
    expect(availableIds()).toContain("extra-invocation");
  });

  it("checks the Complete Arcane Draconic feat prerequisites", () => {
    const firstLevelSorcerer = cloneCharacter(initialCharacter);
    firstLevelSorcerer.classLevels = [{ classId: "sorcerer", level: 1 }];
    const firstLevelSlot = getFeatSlots(firstLevelSorcerer).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelSlot)
      throw new Error("Missing first-level Sorcerer feat slot.");
    expect(
      getAvailableFeats(firstLevelSorcerer, firstLevelSlot).map((feat) => feat.id),
    ).toContain("draconic-heritage");
    expect(
      getAvailableFeats(firstLevelSorcerer, firstLevelSlot).map((feat) => feat.id),
    ).not.toContain("draconic-breath");

    const sorcerer = cloneCharacter(initialCharacter);
    sorcerer.classLevels = [{ classId: "sorcerer", level: 12 }];
    sorcerer.featSelections = {
      "general-1": "draconic-heritage",
      "general-3": "draconic-breath",
      "general-6": "draconic-claw",
    };
    const twelfthLevelSlot = getFeatSlots(sorcerer).find(
      (slot) => slot.id === "general-12",
    );
    if (!twelfthLevelSlot)
      throw new Error("Missing twelfth-level Sorcerer feat slot.");
    expect(
      getAvailableFeats(sorcerer, twelfthLevelSlot).map((feat) => feat.id),
    ).not.toContain("draconic-legacy");
    sorcerer.featSelections["general-9"] = "draconic-power";
    expect(
      getAvailableFeats(sorcerer, twelfthLevelSlot).map((feat) => feat.id),
    ).toContain("draconic-legacy");
  });

  it("enforces alternative prerequisites for Complete Mage feats", () => {
    const knowledgeUser = cloneCharacter(initialCharacter);
    knowledgeUser.classLevels = [{ classId: "wizard", level: 6 }];
    knowledgeUser.skills["Knowledge (arcana)"] = 6;
    const sixthLevelSlot = getFeatSlots(knowledgeUser).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot)
      throw new Error("Missing sixth-level Wizard feat slot.");
    const availableKnowledgeFeats = () =>
      getAvailableFeats(knowledgeUser, sixthLevelSlot).map((feat) => feat.id);
    expect(availableKnowledgeFeats()).toContain("favored-magic-foe");
    knowledgeUser.skills["Knowledge (arcana)"] = 5;
    expect(availableKnowledgeFeats()).not.toContain("favored-magic-foe");

    const ranger = cloneCharacter(initialCharacter);
    ranger.classLevels = [{ classId: "ranger", level: 1 }];
    const firstLevelSlot = getFeatSlots(ranger).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelSlot)
      throw new Error("Missing first-level Ranger feat slot.");
    expect(
      getAvailableFeats(ranger, firstLevelSlot).map((feat) => feat.id),
    ).toContain("favored-magic-foe");

    const tacticalCaster = cloneCharacter(initialCharacter);
    tacticalCaster.classLevels = [{ classId: "wizard", level: 3 }];
    tacticalCaster.skills.Spellcraft = 4;
    const thirdLevelSlot = getFeatSlots(tacticalCaster).find(
      (slot) => slot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level Wizard feat slot.");
    const availableTacticalFeats = () =>
      getAvailableFeats(tacticalCaster, thirdLevelSlot).map(
        (feat) => feat.id,
      );
    expect(availableTacticalFeats()).not.toContain("battlecaster-offense");
    tacticalCaster.featSelections = { "general-1": "combat-casting" };
    expect(availableTacticalFeats()).toContain("battlecaster-offense");
    tacticalCaster.featSelections = {};
    tacticalCaster.classFeatures = ["Warmage Edge"];
    expect(availableTacticalFeats()).toContain("battlecaster-offense");
  });

  it("enforces Master of Undeath's skill prerequisite and catalogs Retributive Spell", () => {
    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 6 }];
    const featSlot = getFeatSlots(cleric).find(
      (slot) => slot.id === "general-6",
    );
    if (!featSlot) throw new Error("Missing sixth-level general feat slot.");
    const availableIds = () =>
      getAvailableFeats(cleric, featSlot).map((feat) => feat.id);

    expect(availableIds()).not.toContain("master-of-undeath");
    cleric.skills["Knowledge (religion)"] = 5;
    expect(availableIds()).toContain("master-of-undeath");

    const retributiveSpell = featCatalog.find(
      (feat) => feat.id === "retributive-spell",
    );
    expect(retributiveSpell?.categories).toContain("metamagic");
    expect(retributiveSpell?.sourceBook).toBe("Complete Mage (3.5)");
  });

  it("enforces Complete Mage heritage alignment, feat, and level prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 9 }];
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const ninthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-9",
    );
    if (!sixthLevelSlot || !ninthLevelSlot)
      throw new Error("Missing heritage feat-test slots.");

    character.alignment = "Lawful Neutral";
    const lawfulChoices = getAvailableFeats(character, ninthLevelSlot).map(
      (feat) => feat.id,
    );
    expect(lawfulChoices).toContain("fiendish-heritage");
    expect(lawfulChoices).not.toContain("fey-heritage");

    character.alignment = "Neutral Good";
    character.featSelections = { "general-1": "fey-heritage" };
    const feyAtSix = getAvailableFeats(character, sixthLevelSlot).map(
      (feat) => feat.id,
    );
    expect(feyAtSix).toContain("fey-presence");
    expect(feyAtSix).not.toContain("fey-legacy");
    const feyAtNine = getAvailableFeats(character, ninthLevelSlot).map(
      (feat) => feat.id,
    );
    expect(feyAtNine).toContain("fey-legacy");
    expect(feyAtNine).not.toContain("fiendish-legacy");
    character.alignment = "Lawful Neutral";
    expect(
      getAvailableFeats(character, ninthLevelSlot).map((feat) => feat.id),
    ).not.toContain("fey-power");

    character.alignment = "True Neutral";
    character.featSelections = { "general-1": "fiendish-heritage" };
    expect(
      getAvailableFeats(character, ninthLevelSlot).map((feat) => feat.id),
    ).toContain("fiendish-legacy");
    character.alignment = "Neutral Good";
    expect(
      getAvailableFeats(character, ninthLevelSlot).map((feat) => feat.id),
    ).not.toContain("fiendish-resistance");
  });

  it("enforces Complete Mage Bardic Music and arcane spellcasting prerequisites", () => {
    const bard = cloneCharacter(initialCharacter);
    bard.classLevels = [{ classId: "bard", level: 3 }];
    const bardSlot = getFeatSlots(bard).find((slot) => slot.id === "general-3");
    if (!bardSlot) throw new Error("Missing third-level Bard feat slot.");
    const bardChoices = () =>
      getAvailableFeats(bard, bardSlot).map((feat) => feat.id);

    expect(bardChoices()).toContain("captivating-melody");
    expect(bardChoices()).not.toContain("melodic-casting");
    bard.skills.Perform = 4;
    bard.skills.Spellcraft = 4;
    expect(bardChoices()).toContain("melodic-casting");

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    const wizardSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-3",
    );
    if (!wizardSlot) throw new Error("Missing wizard third-level feat slot.");
    expect(
      getAvailableFeats(wizard, wizardSlot).map((feat) => feat.id),
    ).not.toContain("captivating-melody");
  });

  it("enforces Battlecaster Defense and Energy Gestalt prerequisites", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    wizard.featSelections = {
      "general-1": "combat-casting",
      "human-1": "spell-focus",
    };
    wizard.featSpellSchoolSelections = { "human-1": "Evocation" };
    const featSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-3",
    );
    if (!featSlot) throw new Error("Missing third-level Wizard feat slot.");
    const availableIds = () =>
      getAvailableFeats(wizard, featSlot).map((feat) => feat.id);

    expect(availableIds()).toContain("battlecaster-defense");
    expect(availableIds()).toContain("energy-gestalt");

    wizard.featSelections = { "human-1": "spell-focus" };
    expect(availableIds()).not.toContain("battlecaster-defense");
    wizard.featSelections["general-1"] = "combat-casting";
    wizard.featSpellSchoolSelections["human-1"] = "Illusion";
    expect(availableIds()).not.toContain("energy-gestalt");
  });

  it("requires Spellcraft, Point Blank Shot, and Weapon Focus (Ray) for Ranged Recall", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 6 }];
    wizard.featSelections = {
      "general-1": "point-blank-shot",
      "general-3": "weapon-focus",
    };
    wizard.featWeaponSelections = { "general-3": "Ray" };
    wizard.skills.Spellcraft = 4;
    const sixthLevelSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot)
      throw new Error("Missing sixth-level Wizard feat slot.");
    const availableIds = () =>
      getAvailableFeats(wizard, sixthLevelSlot).map((feat) => feat.id);

    expect(availableIds()).toContain("ranged-recall");
    wizard.featWeaponSelections["general-3"] = "Longbow";
    expect(availableIds()).not.toContain("ranged-recall");
    wizard.featWeaponSelections["general-3"] = "Ray";
    wizard.skills.Spellcraft = 3;
    expect(availableIds()).not.toContain("ranged-recall");
    wizard.skills.Spellcraft = 4;
    wizard.featSelections["general-1"] = "weapon-focus";
    expect(availableIds()).not.toContain("ranged-recall");
  });

  it("enforces the universal spell-level prerequisites for Complete Mage reserve feats", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    wizard.abilities.int = 12;
    const wizardSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-3",
    );
    if (!wizardSlot) throw new Error("Missing third-level Wizard feat slot.");
    const reserveFeats = [
      "acidic-splatter",
      "clutch-of-earth",
      "fiery-burst",
      "hurricane-breath",
      "shadow-veil",
      "sunlight-eyes",
      "winter-s-blast",
    ];
    expect(
      getAvailableFeats(wizard, wizardSlot).map((feat) => feat.id),
    ).toEqual(expect.arrayContaining(reserveFeats));

    wizard.classLevels = [{ classId: "wizard", level: 1 }];
    const firstLevelSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelSlot) throw new Error("Missing first-level Wizard feat slot.");
    expect(
      getAvailableFeats(wizard, firstLevelSlot).map((feat) => feat.id),
    ).not.toEqual(expect.arrayContaining(reserveFeats));

    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 3 }];
    cleric.abilities.wis = 12;
    const clericSlot = getFeatSlots(cleric).find(
      (slot) => slot.id === "general-3",
    );
    if (!clericSlot) throw new Error("Missing third-level Cleric feat slot.");
    expect(
      getAvailableFeats(cleric, clericSlot).map((feat) => feat.id),
    ).toEqual(expect.arrayContaining(reserveFeats));

    const thirdLevelWizard = cloneCharacter(initialCharacter);
    thirdLevelWizard.classLevels = [{ classId: "wizard", level: 6 }];
    thirdLevelWizard.abilities.int = 13;
    const sixthLevelSlot = getFeatSlots(thirdLevelWizard).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot)
      throw new Error("Missing sixth-level Wizard feat slot.");
    expect(
      getAvailableFeats(thirdLevelWizard, sixthLevelSlot).map((feat) => feat.id),
    ).toEqual(
      expect.arrayContaining([
        "aquatic-breath",
        "blade-of-force",
        "clap-of-thunder",
        "face-changer",
        "invisible-needle",
        "magic-disruption",
        "magic-sensitive",
        "sickening-grasp",
        "storm-bolt",
        "touch-of-distraction",
        "wind-guided-arrows",
      ]),
    );
  });

  it("enforces 4th- and 5th-level spell prerequisites for reserve feats", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 9 }];
    wizard.abilities.int = 14;
    const ninthLevelSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-9",
    );
    if (!ninthLevelSlot)
      throw new Error("Missing ninth-level Wizard feat slot.");
    const availableIds = () =>
      getAvailableFeats(wizard, ninthLevelSlot).map((feat) => feat.id);
    expect(availableIds()).toEqual(
      expect.arrayContaining([
        "dimensional-jaunt",
        "drowning-glance",
        "minor-shapeshift",
        "summon-elemental",
      ]),
    );
    expect(availableIds()).not.toContain("mystic-backlash");
    expect(availableIds()).not.toContain("borne-aloft");
    wizard.abilities.int = 15;
    expect(availableIds()).toContain("borne-aloft");
    expect(availableIds()).toContain("mystic-backlash");

    const lowLevelWizard = cloneCharacter(initialCharacter);
    lowLevelWizard.classLevels = [{ classId: "wizard", level: 7 }];
    lowLevelWizard.abilities.int = 14;
    const sixthLevelSlot = getFeatSlots(lowLevelWizard).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot)
      throw new Error("Missing sixth-level Wizard feat slot.");
    expect(
      getAvailableFeats(lowLevelWizard, sixthLevelSlot).map((feat) => feat.id),
    ).not.toContain("summon-elemental");
  });

  it("enforces Complete Mage skill-prerequisite feat ranks", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    const featSlot = getFeatSlots(character).find((slot) => slot.id === "general-3");
    if (!featSlot) throw new Error("Missing third-level general feat slot.");
    const featIds = [
      "delay-potion",
      "magic-device-attunement",
      "somatic-weaponry",
    ];
    const availableIds = () =>
      getAvailableFeats(character, featSlot).map((feat) => feat.id);

    expect(availableIds()).not.toEqual(expect.arrayContaining(featIds));
    character.skills["Knowledge (arcana)"] = 1;
    expect(availableIds()).toContain("delay-potion");
    character.skills["Use Magic Device"] = 1;
    expect(availableIds()).toContain("magic-device-attunement");
    character.skills.Concentration = 5;
    character.skills.Spellcraft = 5;
    expect(availableIds()).toEqual(expect.arrayContaining(featIds));

    for (const featId of featIds) {
      expect(featCatalog.find((feat) => feat.id === featId)?.sourceBook).toBe(
        "Complete Mage (3.5)",
      );
    }
  });

  it("enforces Complete Mage tactical metamagic prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 9 }];
    character.featSelections = {
      "general-1": "empower-spell",
      "general-3": "extend-spell",
    };
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const ninthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-9",
    );
    if (!sixthLevelSlot || !ninthLevelSlot)
      throw new Error("Missing general feat slots for the Complete Mage tests.");

    expect(
      getAvailableFeats(character, sixthLevelSlot).map((feat) => feat.id),
    ).toContain("metamagic-vigor");
    expect(
      getAvailableFeats(character, ninthLevelSlot).map((feat) => feat.id),
    ).not.toContain("residual-magic");
    character.skills.Spellcraft = 12;
    expect(
      getAvailableFeats(character, ninthLevelSlot).map((feat) => feat.id),
    ).toContain("residual-magic");
  });

  it("enforces Metamagic Spell Trigger's metamagic and alternative skill prerequisites", () => {
    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 12 }];
    wizard.featSelections = { "general-1": "empower-spell" };
    const wizardSlot = getFeatSlots(wizard).find(
      (slot) => slot.id === "general-12",
    );
    if (!wizardSlot) throw new Error("Missing level-twelve general feat slot.");
    const wizardChoices = () =>
      getAvailableFeats(wizard, wizardSlot).map((feat) => feat.id);

    expect(wizardChoices()).not.toContain("metamagic-spell-trigger");
    wizard.skills.Spellcraft = 15;
    expect(wizardChoices()).toContain("metamagic-spell-trigger");

    const bard = cloneCharacter(initialCharacter);
    bard.classLevels = [{ classId: "bard", level: 12 }];
    bard.featSelections = { "general-1": "empower-spell" };
    bard.skills["Use Magic Device"] = 15;
    const bardSlot = getFeatSlots(bard).find(
      (slot) => slot.id === "general-12",
    );
    if (!bardSlot) throw new Error("Missing level-twelve general feat slot.");
    expect(
      getAvailableFeats(bard, bardSlot).map((feat) => feat.id),
    ).toContain("metamagic-spell-trigger");
  });

  it("represents all Player's Handbook II feat entries", () => {
    const representedNames = featCatalog
      .filter((feat) =>
        feat.sourceBook === "Player's Handbook II (3.5)" &&
        playerHandbookIIFeats.has(normalizeFeatName(feat.name)),
      )
      .map((feat) => normalizeFeatName(feat.name))
      .sort();
    expect(playerHandbookIIFeats.size).toBe(105);
    expect(representedNames).toEqual([...playerHandbookIIFeats].sort());
  });

  it("records selected Player's Handbook II feat triggers and effects", () => {
    const description = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing PHB II feat fixture: ${id}.`);
      return feat.description;
    };

    expect(description("acrobatic-strike")).toContain(
      "Succeed at Tumble to avoid an opponent's attack of opportunity",
    );
    expect(description("acrobatic-strike")).toContain(
      "+6 on your next attack against it before your next turn",
    );
    expect(description("active-shield-defense")).toContain(
      "total defense allows them at -4",
    );
    expect(description("adaptable-flanker")).toContain(
      "As a swift action, designate a foe",
    );
    expect(description("adaptable-flanker")).toContain(
      "choose a threatened square for flanking and also count from your current square",
    );
    expect(description("agile-shield-fighter")).toContain(
      "Full attack: shield bash and armed strike at -2 each",
    );
    expect(description("arcane-accompaniment")).toContain(
      "prepared spell or slot",
    );
    expect(description("arcane-accompaniment")).toContain(
      "by rounds equal to its level",
    );
  });

  it("checks Vatic Gaze's arcane caster level and documents its limits", () => {
    const feat = featCatalog.find((candidate) => candidate.id === "vatic-gaze");
    if (!feat) throw new Error("Missing Vatic Gaze fixture.");

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 8 }];
    expect(featQualifies(wizard, feat, {
      fighterOnly: false,
      characterLevel: 8,
    })).toBe(false);

    wizard.classLevels[0].level = 9;
    expect(featQualifies(wizard, feat, {
      fighterOnly: false,
      characterLevel: 9,
    })).toBe(true);
    expect(feat.description).toContain("swift action");
    expect(feat.description).toContain("DC 5 + the target's caster level");
    expect(feat.description).toContain(
      "no insight into spell-like or supernatural abilities",
    );
  });

  it("allows Water Splitting Stone as a Monk bonus feat only with Stunning Fist and BAB +9", () => {
    const monk = cloneCharacter(initialCharacter);
    monk.classLevels = [
      { classId: "monk", level: 6 },
      { classId: "fighter", level: 5 },
    ];
    monk.abilities.dex = 10;
    monk.abilities.wis = 10;
    monk.featSelections = { "monk-1": "stunning-fist" };
    const monkSlot = getFeatSlots(monk).find(
      (slot) => slot.id === "monk-6",
    );
    if (!monkSlot) throw new Error("Missing Monk level-six bonus feat slot.");
    expect(getAvailableFeats(monk, monkSlot).map((feat) => feat.id))
      .toContain("water-splitting-stone");

    const withoutStunningFist = cloneCharacter(monk);
    withoutStunningFist.featSelections = {};
    expect(
      getAvailableFeats(withoutStunningFist, monkSlot).map((feat) => feat.id),
    ).not.toContain("water-splitting-stone");

    const belowBaseAttackBonus = cloneCharacter(monk);
    belowBaseAttackBonus.classLevels = [
      { classId: "monk", level: 6 },
      { classId: "fighter", level: 2 },
    ];
    const lowerLevelSlot = getFeatSlots(belowBaseAttackBonus).find(
      (slot) => slot.id === "monk-6",
    );
    if (!lowerLevelSlot)
      throw new Error("Missing low-BAB Monk bonus feat slot.");
    expect(
      getAvailableFeats(belowBaseAttackBonus, lowerLevelSlot).map((feat) => feat.id),
    ).not.toContain("water-splitting-stone");
  });

  it("documents PHB II two-weapon tactical feats and their bonus-feat options", () => {
    const feats = new Map(featCatalog.map((feat) => [feat.id, feat]));
    const tumblingFeint = feats.get("tumbling-feint");
    const twoWeaponPounce = feats.get("two-weapon-pounce");
    const twoWeaponRend = feats.get("two-weapon-rend");
    if (!tumblingFeint || !twoWeaponPounce || !twoWeaponRend)
      throw new Error("Missing PHB II two-weapon feat fixtures.");

    expect(tumblingFeint.description).toContain("At the start of your turn");
    expect(tumblingFeint.description).toContain("successfully Tumble");
    expect(tumblingFeint.description).toContain("on or before your next turn");
    expect(twoWeaponPounce.description).toContain("lose the charge's +2 attack bonus");
    expect(twoWeaponPounce.description).toContain("its -2 AC penalty still applies");
    expect(twoWeaponPounce.description).toContain("base attack bonus +6");
    expect(twoWeaponPounce.fighterBonus).toBe(true);
    expect(twoWeaponRend.description).toContain(
      "1d6 + 1-1/2 times your Strength bonus",
    );
    expect(twoWeaponRend.description).toContain(
      "same type as your off-hand weapon",
    );
    expect(twoWeaponRend.description).toContain("base attack bonus +11");

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 12 }];
    fighter.abilities.dex = 15;
    fighter.featSelections = { "general-1": "two-weapon-fighting" };
    const pounceSlot = getFeatSlots(fighter).find(
      (slot) => slot.id === "fighter-6",
    );
    const rendSlot = getFeatSlots(fighter).find(
      (slot) => slot.id === "fighter-12",
    );
    if (!pounceSlot || !rendSlot)
      throw new Error("Missing fighter bonus feat fixtures.");
    expect(getAvailableFeats(fighter, pounceSlot).map((feat) => feat.id))
      .toContain("two-weapon-pounce");
    expect(getAvailableFeats(fighter, rendSlot).map((feat) => feat.id))
      .toContain("two-weapon-rend");
  });

  it("does not require sneak attack or skirmish for Crossbow Sniper", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 3 }];
    fighter.featSelections = { "fighter-1": "weapon-focus" };
    fighter.featWeaponSelections = { "fighter-1": "Heavy Crossbow" };
    const slot = getFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const crossbowSniper = featCatalog.find(
      (feat) => feat.id === "crossbow-sniper",
    );
    if (!slot || !crossbowSniper)
      throw new Error("Missing Crossbow Sniper fixtures.");

    expect(featQualifies(fighter, crossbowSniper, slot)).toBe(true);
    fighter.featWeaponSelections["fighter-1"] = "Longbow";
    expect(featQualifies(fighter, crossbowSniper, slot)).toBe(false);
  });

  it("requires the ability to cast arcane spells for Arcane Thesis", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "fighter", level: 8 },
      { classId: "sorcerer", level: 1 },
    ];
    character.hitPointRolls = Array.from({ length: 9 }, (_, index) => ({
      characterLevel: index + 1,
      classId: index < 8 ? "fighter" as const : "sorcerer" as const,
      classLevel: index < 8 ? index + 1 : 1,
      hitDie: index < 8 ? 10 as const : 4 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    character.abilities.cha = 9;
    character.skills["Knowledge (arcana)"] = 9;
    const slot = getChronologicalFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-9",
    );
    const arcaneThesis = featCatalog.find((feat) => feat.id === "arcane-thesis");
    if (!slot || !arcaneThesis)
      throw new Error("Missing Arcane Thesis fixtures.");

    expect(featQualifies(character, arcaneThesis, slot)).toBe(false);
    character.abilities.cha = 10;
    expect(featQualifies(character, arcaneThesis, slot)).toBe(true);
  });

  it("requires Player's Handbook II weapon mastery feats to share a proficient weapon", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 9 }];
    fighter.hitPointRolls = Array.from({ length: 9 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    fighter.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    fighter.featWeaponSelections = {
      "general-1": "Longsword",
      "fighter-4": "Longsword",
    };
    const slot = getChronologicalFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-9",
    );
    const meleeWeaponMastery = featCatalog.find(
      (feat) => feat.id === "melee-weapon-mastery",
    );
    if (!slot || !meleeWeaponMastery)
      throw new Error("Missing Melee Weapon Mastery fixtures.");

    expect(featQualifies(fighter, meleeWeaponMastery, slot)).toBe(true);
    fighter.featWeaponSelections["fighter-4"] = "Warhammer";
    expect(featQualifies(fighter, meleeWeaponMastery, slot)).toBe(false);
  });

  it("requires Weapon Supremacy prerequisites to use the same proficient weapon", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 18 }];
    fighter.hitPointRolls = Array.from({ length: 18 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    fighter.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
      "fighter-8": "greater-weapon-focus",
      "fighter-12": "greater-weapon-specialization",
      "general-15": "melee-weapon-mastery",
    };
    fighter.featWeaponSelections = {
      "general-1": "Longsword",
      "fighter-4": "Longsword",
      "fighter-8": "Longsword",
      "fighter-12": "Longsword",
    };
    const slot = getChronologicalFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-18",
    );
    const weaponSupremacy = featCatalog.find(
      (feat) => feat.id === "weapon-supremacy",
    );
    if (!slot || !weaponSupremacy)
      throw new Error("Missing Weapon Supremacy fixtures.");

    expect(featQualifies(fighter, weaponSupremacy, slot)).toBe(true);
    fighter.featWeaponSelections["fighter-12"] = "Warhammer";
    expect(featQualifies(fighter, weaponSupremacy, slot)).toBe(false);
  });

  it("documents PHB II Weapon Supremacy and Versatile Unarmed Strike benefits", () => {
    const weaponSupremacy = featCatalog.find(
      (feat) => feat.id === "weapon-supremacy",
    );
    const versatileUnarmedStrike = featCatalog.find(
      (feat) => feat.id === "versatile-unarmed-strike",
    );
    if (!weaponSupremacy || !versatileUnarmedStrike)
      throw new Error("Missing PHB II feat fixtures.");

    for (const detail of [
      "+4 on checks to resist being disarmed",
      "while grappled without penalty or a grapple check",
      "+5 to one attack after your first strike",
      "treat the d20 result as 10",
      "gain +1 AC",
      "only once for one weapon type",
    ]) {
      expect(weaponSupremacy.description).toContain(detail);
    }
    expect(versatileUnarmedStrike.description).toContain(
      "until you use another swift action to change it",
    );
  });

  it("requires Weapon Focus with a reach weapon for Short Haft", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 3 }];
    fighter.hitPointRolls = Array.from({ length: 3 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    fighter.featSelections = { "fighter-1": "weapon-focus" };
    fighter.featWeaponSelections = { "fighter-1": "Warhammer" };
    const slot = getChronologicalFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const shortHaft = featCatalog.find((feat) => feat.id === "short-haft");
    if (!slot || !shortHaft)
      throw new Error("Missing Short Haft fixtures.");

    expect(featQualifies(fighter, shortHaft, slot)).toBe(false);
    fighter.featWeaponSelections["fighter-1"] = "Glaive";
    expect(featQualifies(fighter, shortHaft, slot)).toBe(true);
  });

  it("checks Player's Handbook II ceremony feat prerequisites", () => {
    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 3 }];
    cleric.skills["Knowledge (religion)"] = 4;
    cleric.alignment = "Neutral Good";
    const slot = getFeatSlots(cleric).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const ritualBlessing = featCatalog.find(
      (feat) => feat.id === "ritual-blessing",
    );
    const ritualBloodBonds = featCatalog.find(
      (feat) => feat.id === "ritual-blood-bonds",
    );
    if (!slot || !ritualBlessing || !ritualBloodBonds)
      throw new Error("Missing PHB II ceremony feat fixtures.");

    expect(featQualifies(cleric, ritualBlessing, slot)).toBe(true);
    cleric.alignment = "True Neutral";
    expect(featQualifies(cleric, ritualBlessing, slot)).toBe(false);
    cleric.alignment = "Neutral Good";
    cleric.skills["Knowledge (religion)"] = 3;
    expect(featQualifies(cleric, ritualBlessing, slot)).toBe(false);

    cleric.skills["Knowledge (religion)"] = 4;
    cleric.race = "Orc";
    expect(featQualifies(cleric, ritualBloodBonds, slot)).toBe(true);
    cleric.race = "Half-orc";
    expect(featQualifies(cleric, ritualBloodBonds, slot)).toBe(true);
    cleric.race = "Human";
    expect(featQualifies(cleric, ritualBloodBonds, slot)).toBe(false);
    cleric.race = "Orc";
    cleric.skills["Knowledge (religion)"] = 3;
    expect(featQualifies(cleric, ritualBloodBonds, slot)).toBe(false);
  });

  it("checks Player's Handbook II metamagic table prerequisites", () => {
    const unrestricted = cloneCharacter(initialCharacter);
    unrestricted.classLevels = [{ classId: "fighter", level: 1 }];
    const firstLevelSlot = getFeatSlots(unrestricted).find(
      (featSlot) => featSlot.id === "general-1",
    );
    if (!firstLevelSlot)
      throw new Error("Missing first-level PHB II metamagic fixture.");
    for (const featId of [
      "blistering-spell",
      "earthbound-spell",
      "flash-frost-spell",
    ]) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) throw new Error(`Missing PHB II metamagic feat: ${featId}.`);
      expect(featQualifies(unrestricted, feat, firstLevelSlot)).toBe(true);
    }

    const summoner = cloneCharacter(initialCharacter);
    summoner.classLevels = [{ classId: "wizard", level: 6 }];
    summoner.featSelections = {
      "general-1": "spell-focus",
      "general-3": "augment-summoning",
    };
    summoner.featSpellSchoolSelections = { "general-1": "Conjuration" };
    const sixthLevelSlot = getFeatSlots(summoner).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const imbuedSummoning = featCatalog.find(
      (feat) => feat.id === "imbued-summoning",
    );
    if (!sixthLevelSlot || !imbuedSummoning)
      throw new Error("Missing Imbued Summoning fixture.");

    expect(featQualifies(summoner, imbuedSummoning, sixthLevelSlot)).toBe(true);
    delete summoner.featSelections["general-3"];
    expect(featQualifies(summoner, imbuedSummoning, sixthLevelSlot)).toBe(false);
    summoner.featSelections["general-3"] = "augment-summoning";
    summoner.featSpellSchoolSelections["general-1"] = "Evocation";
    expect(featQualifies(summoner, imbuedSummoning, sixthLevelSlot)).toBe(false);

    const firstLevelWizard = cloneCharacter(initialCharacter);
    firstLevelWizard.classLevels = [{ classId: "wizard", level: 1 }];
    const wizardSlot = getFeatSlots(firstLevelWizard).find(
      (featSlot) => featSlot.id === "general-1",
    );
    const smitingSpell = featCatalog.find(
      (feat) => feat.id === "smiting-spell",
    );
    if (!wizardSlot || !smitingSpell)
      throw new Error("Missing Smiting Spell fixture.");
    expect(featQualifies(firstLevelWizard, smitingSpell, wizardSlot)).toBe(false);

    const thirdLevelWizard = cloneCharacter(firstLevelWizard);
    thirdLevelWizard.classLevels = [{ classId: "wizard", level: 3 }];
    const thirdLevelSlot = getFeatSlots(thirdLevelWizard).find(
      (featSlot) => featSlot.id === "general-3",
    );
    if (!thirdLevelSlot)
      throw new Error("Missing third-level Smiting Spell fixture.");
    expect(featQualifies(thirdLevelWizard, smitingSpell, thirdLevelSlot)).toBe(true);

    const thirdLevelFighter = cloneCharacter(initialCharacter);
    thirdLevelFighter.classLevels = [{ classId: "fighter", level: 3 }];
    const fighterSlot = getFeatSlots(thirdLevelFighter).find(
      (featSlot) => featSlot.id === "general-3",
    );
    if (!fighterSlot)
      throw new Error("Missing third-level Fighter feat fixture.");
    expect(featQualifies(thirdLevelFighter, smitingSpell, fighterSlot)).toBe(false);
  });

  it("checks Player's Handbook II sorcerer heritage feat chains", () => {
    const celestial = cloneCharacter(initialCharacter);
    celestial.classLevels = [{ classId: "sorcerer", level: 3 }];
    celestial.featSelections = {
      "general-1": "celestial-sorcerer-heritage",
      "general-3": "celestial-sorcerer-aura",
    };
    const celestialAbilitySlot = getFeatSlots(celestial).find(
      (slot) => slot.id === "general-3",
    );
    if (!celestialAbilitySlot)
      throw new Error("Missing celestial sorcerer heritage fixtures.");
    for (const featId of [
      "celestial-sorcerer-aura",
      "celestial-sorcerer-lance",
      "celestial-sorcerer-wings",
    ]) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) throw new Error(`Missing celestial heritage feat: ${featId}.`);
      expect(featQualifies(celestial, feat, celestialAbilitySlot)).toBe(true);
    }

    const celestialLore = featCatalog.find(
      (feat) => feat.id === "celestial-sorcerer-lore",
    );
    const celestialLoreCharacter = cloneCharacter(initialCharacter);
    celestialLoreCharacter.classLevels = [{ classId: "sorcerer", level: 9 }];
    celestialLoreCharacter.featSelections = {
      "general-1": "celestial-sorcerer-heritage",
      "general-3": "celestial-sorcerer-aura",
      "general-6": "celestial-sorcerer-lance",
    };
    const celestialLoreSlot = getFeatSlots(celestialLoreCharacter).find(
      (slot) => slot.id === "general-9",
    );
    if (!celestialLore || !celestialLoreSlot)
      throw new Error("Missing Celestial Sorcerer Lore fixture.");
    expect(
      featQualifies(celestialLoreCharacter, celestialLore, celestialLoreSlot),
    ).toBe(true);
    delete celestialLoreCharacter.featSelections["general-6"];
    expect(
      featQualifies(celestialLoreCharacter, celestialLore, celestialLoreSlot),
    ).toBe(false);

    const infernal = cloneCharacter(initialCharacter);
    infernal.classLevels = [{ classId: "sorcerer", level: 3 }];
    infernal.featSelections = {
      "general-1": "infernal-sorcerer-heritage",
    };
    const infernalAbilitySlot = getFeatSlots(infernal).find(
      (slot) => slot.id === "general-3",
    );
    if (!infernalAbilitySlot)
      throw new Error("Missing infernal sorcerer heritage fixture.");
    for (const featId of [
      "infernal-sorcerer-eyes",
      "infernal-sorcerer-howl",
      "infernal-sorcerer-resistance",
    ]) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) throw new Error(`Missing infernal heritage feat: ${featId}.`);
      expect(featQualifies(infernal, feat, infernalAbilitySlot)).toBe(true);
    }
    delete infernal.featSelections["general-1"];
    for (const featId of [
      "infernal-sorcerer-eyes",
      "infernal-sorcerer-howl",
      "infernal-sorcerer-resistance",
    ]) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) throw new Error(`Missing infernal heritage feat: ${featId}.`);
      expect(featQualifies(infernal, feat, infernalAbilitySlot)).toBe(false);
    }

    const nonSorcerer = cloneCharacter(initialCharacter);
    nonSorcerer.classLevels = [{ classId: "fighter", level: 1 }];
    const firstLevelSlot = getFeatSlots(nonSorcerer).find(
      (slot) => slot.id === "general-1",
    );
    if (!firstLevelSlot)
      throw new Error("Missing first-level heritage feat fixture.");
    for (const featId of [
      "celestial-sorcerer-heritage",
      "infernal-sorcerer-heritage",
    ]) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) throw new Error(`Missing sorcerer heritage feat: ${featId}.`);
      expect(featQualifies(nonSorcerer, feat, firstLevelSlot)).toBe(false);
    }
  });

  it("documents PHB II sorcerer heritage benefits", () => {
    const featDescriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    expect(featDescriptions.get("celestial-sorcerer-wings")).toContain(
      "twice your base land speed",
    );
    expect(featDescriptions.get("celestial-sorcerer-wings")).toContain(
      "1 round per slot level",
    );
    expect(featDescriptions.get("infernal-sorcerer-heritage")).toContain(
      "equal to the number of Infernal Sorcerer Heritage feats",
    );
    expect(featDescriptions.get("infernal-sorcerer-eyes")).toContain(
      "10 minutes per slot level",
    );
    expect(featDescriptions.get("infernal-sorcerer-howl")).toContain(
      "2d6 sonic damage per slot level",
    );
    expect(featDescriptions.get("infernal-sorcerer-howl")).toContain(
      "Fortitude save DC 10 + slot level",
    );
  });

  it("checks Player's Handbook II divine caster level and combat-form choices", () => {
    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 9 }];
    cleric.divineCasterLevel = 4;
    const clericSlot = getFeatSlots(cleric).find(
      (slot) => slot.id === "general-9",
    );
    if (!clericSlot) throw new Error("Missing ninth-level feat slot.");
    const clericFeats = () =>
      getAvailableFeats(cleric, clericSlot).map((feat) => feat.id);

    expect(clericFeats()).not.toContain("divine-armor");
    cleric.divineCasterLevel = 5;
    expect(clericFeats()).toContain("divine-armor");

    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 9 }];
    paladin.divineCasterLevel = 5;
    const paladinSlot = getFeatSlots(paladin).find(
      (slot) => slot.id === "general-9",
    );
    if (!paladinSlot) throw new Error("Missing paladin ninth-level feat slot.");
    expect(
      getAvailableFeats(paladin, paladinSlot).map((feat) => feat.id),
    ).toContain("divine-armor");

    const rebuker = cloneCharacter(initialCharacter);
    rebuker.classLevels = [
      { classId: "cleric", level: 4 },
      {
        classId: "cleric",
        prestigeClassId: "knight-of-the-skull",
        level: 5,
      },
    ];
    rebuker.divineCasterLevel = 9;
    const rebukerSlot = getFeatSlots(rebuker).find(
      (slot) => slot.id === "general-9",
    );
    if (!rebukerSlot) throw new Error("Missing rebuker ninth-level feat slot.");
    expect(
      getAvailableFeats(rebuker, rebukerSlot).map((feat) => feat.id),
    ).toContain("divine-armor");

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 15 }];
    fighter.abilities.wis = 13;
    fighter.abilities.dex = 13;
    fighter.featSelections = {
      "general-1": "dodge",
      "general-3": "combat-focus",
      "general-6": "combat-stability",
    };
    const fighterSlot = getFeatSlots(fighter).find(
      (slot) => slot.id === "general-15",
    );
    if (!fighterSlot) throw new Error("Missing fifteenth-level feat slot.");
    const fighterFeats = () =>
      getAvailableFeats(fighter, fighterSlot).map((feat) => feat.id);

    expect(fighterFeats()).not.toContain("combat-strike");
    fighter.featSelections["general-9"] = "combat-defense";
    expect(fighterFeats()).toContain("combat-strike");
  });

  it("documents PHB II divine feat areas and effects", () => {
    const featDescriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    expect(featDescriptions.get("profane-aura")).toContain("60-foot-radius");
    expect(featDescriptions.get("profane-aura")).toContain("total concealment");
    expect(featDescriptions.get("profane-aura")).toContain(
      "+2 deflection bonus to AC",
    );
    expect(featDescriptions.get("sacred-purification")).toContain(
      "1d8 plus your Charisma bonus",
    );
    expect(featDescriptions.get("sacred-radiance")).toContain(
      "spells of 3rd level or lower",
    );
    expect(featDescriptions.get("sacred-radiance")).toContain("For 10 minutes");
    expect(featDescriptions.get("sacred-radiance")).toContain(
      "fear, poison, disease, and death effects",
    );
  });

  it("checks Player's Handbook II combat-form feat prerequisites", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 15 }];
    fighter.abilities.dex = 13;
    fighter.abilities.wis = 13;
    fighter.featSelections = {
      "fighter-1": "dodge",
      "fighter-2": "blind-fight",
      "general-1": "combat-focus",
      "general-3": "combat-stability",
      "general-6": "combat-defense",
      "general-9": "combat-vigor",
      "general-12": "combat-awareness",
    };
    const slots = new Map(
      getFeatSlots(fighter).map((slot) => [slot.id, slot]),
    );
    const requiredSlots = [
      ["combat-focus", "general-1"],
      ["combat-stability", "general-3"],
      ["combat-defense", "general-6"],
      ["combat-vigor", "general-9"],
      ["combat-awareness", "general-12"],
      ["combat-strike", "general-15"],
    ] as const;
    for (const [featId, slotId] of requiredSlots) {
      const feat = featCatalog.find((entry) => entry.id === featId);
      const slot = slots.get(slotId);
      if (!feat || !slot)
        throw new Error(`Missing PHB II combat-form fixture: ${featId}.`);
      expect(featQualifies(fighter, feat, slot)).toBe(true);
    }

    const combatDefense = featCatalog.find(
      (feat) => feat.id === "combat-defense",
    );
    const combatAwareness = featCatalog.find(
      (feat) => feat.id === "combat-awareness",
    );
    const combatStrike = featCatalog.find(
      (feat) => feat.id === "combat-strike",
    );
    const defenseSlot = slots.get("general-6");
    const awarenessSlot = slots.get("general-12");
    const strikeSlot = slots.get("general-15");
    if (
      !combatDefense ||
      !combatAwareness ||
      !combatStrike ||
      !defenseSlot ||
      !awarenessSlot ||
      !strikeSlot
    )
      throw new Error("Missing PHB II combat-form prerequisite fixtures.");

    delete fighter.featSelections["fighter-1"];
    expect(featQualifies(fighter, combatDefense, defenseSlot)).toBe(false);
    fighter.featSelections["fighter-1"] = "dodge";
    delete fighter.featSelections["fighter-2"];
    expect(featQualifies(fighter, combatAwareness, awarenessSlot)).toBe(false);
    fighter.featSelections["fighter-2"] = "blind-fight";
    delete fighter.featSelections["general-6"];
    delete fighter.featSelections["general-9"];
    delete fighter.featSelections["general-12"];
    expect(featQualifies(fighter, combatStrike, strikeSlot)).toBe(false);
  });

  it("documents PHB II combat-form triggers, scaling, and duration", () => {
    const descriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    const sourceDetails = [
      ["combat-focus", "first successful attack in an encounter"],
      ["combat-focus", "once for that encounter"],
      ["combat-focus", "10 rounds plus 1 round per other combat-form feat"],
      ["combat-focus", "+4 with three or more combat-form feats"],
      ["combat-stability", "increases to +8 with three or more combat-form feats"],
      ["combat-defense", "+1 dodge bonus to AC against that target"],
      ["combat-vigor", "increased to 4 with three or more combat-form feats"],
      ["combat-awareness", "blindsight out to 5 feet"],
      ["combat-strike", "equal to the total number of combat-form feats"],
      ["combat-strike", "lose benefits from other combat-form feats"],
    ] as const;
    for (const [id, detail] of sourceDetails) {
      expect(descriptions.get(id)).toContain(detail);
    }
  });

  it("checks both weapon proficiencies and Weapon Focus choices for Blood-Spiked Charger", () => {
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 9 }];
    fighter.abilities.str = 13;
    fighter.featSelections = {
      "general-1": "power-attack",
      "fighter-2": "weapon-focus",
      "fighter-4": "weapon-focus",
    };
    fighter.featWeaponSelections = {
      "fighter-2": "Armor Spikes",
      "fighter-4": "Spiked Shield",
    };
    const slot = getFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-9",
    );
    const bloodSpikedCharger = featCatalog.find(
      (feat) => feat.id === "blood-spiked-charger",
    );
    if (!slot || !bloodSpikedCharger)
      throw new Error("Missing Blood-Spiked Charger fixtures.");

    expect(
      getAvailableFeatWeaponChoices(fighter, "weapon-focus", "fighter-2"),
    ).toContain("Armor Spikes");
    expect(
      getAvailableFeatWeaponChoices(fighter, "weapon-focus", "fighter-4"),
    ).toContain("Spiked Shield");
    expect(featQualifies(fighter, bloodSpikedCharger, slot)).toBe(true);

    fighter.featWeaponSelections["fighter-4"] = "Dagger";
    expect(featQualifies(fighter, bloodSpikedCharger, slot)).toBe(false);
    fighter.featWeaponSelections["fighter-4"] = "Spiked Shield";
    delete fighter.featSelections["fighter-4"];
    expect(featQualifies(fighter, bloodSpikedCharger, slot)).toBe(false);

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 9 }];
    wizard.abilities.str = 13;
    wizard.featSelections = {
      "general-1": "power-attack",
      "general-3": "weapon-focus",
      "general-6": "weapon-focus",
    };
    wizard.featWeaponSelections = {
      "general-3": "Armor Spikes",
      "general-6": "Spiked Shield",
    };
    const wizardSlot = getFeatSlots(wizard).find(
      (featSlot) => featSlot.id === "general-9",
    );
    if (!wizardSlot) throw new Error("Missing wizard ninth-level feat slot.");
    expect(featQualifies(wizard, bloodSpikedCharger, wizardSlot)).toBe(false);
  });

  it("requires the PHB II version of Sacred Healing for Sacred Purification", () => {
    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 9 }];
    paladin.featSelections["general-1"] = "sacred-healing";
    const ninthLevelSlot = getFeatSlots(paladin).find(
      (slot) => slot.id === "general-9",
    );
    if (!ninthLevelSlot) throw new Error("Missing ninth-level feat slot.");
    const availableFeats = () =>
      getAvailableFeats(paladin, ninthLevelSlot).map((feat) => feat.id);

    expect(availableFeats()).not.toContain("sacred-purification");
    paladin.featSelections["general-1"] = "sacred-healing-phb2";
    expect(availableFeats()).toContain("sacred-purification");
  });

  it("derives cleric turning mode from alignment and deity", () => {
    const cleric = cloneCharacter(initialCharacter);
    cleric.classLevels = [{ classId: "cleric", level: 9 }];
    cleric.divineCasterLevel = 9;
    const ninthLevelSlot = getFeatSlots(cleric).find(
      (slot) => slot.id === "general-9",
    );
    if (!ninthLevelSlot) throw new Error("Missing ninth-level feat slot.");
    const availableFeats = () =>
      getAvailableFeats(cleric, ninthLevelSlot).map((feat) => feat.id);

    cleric.alignment = "True Neutral";
    cleric.deity = "gilean";
    expect(getClericUndeadTurningMode(cleric)).toBeUndefined();
    expect(requiresManualClericUndeadTurningMode(cleric)).toBe(true);
    expect(availableFeats()).not.toContain("sacred-healing-phb2");
    expect(availableFeats()).not.toContain("profane-aura");

    cleric.clericUndeadTurningMode = "turn";
    expect(getClericUndeadTurningMode(cleric)).toBe("turn");
    expect(availableFeats()).toContain("sacred-healing-phb2");
    expect(availableFeats()).not.toContain("profane-aura");
    cleric.clericUndeadTurningMode = "rebuke";
    expect(availableFeats()).not.toContain("sacred-healing-phb2");
    expect(availableFeats()).toContain("profane-aura");

    cleric.clericUndeadTurningMode = undefined;
    cleric.alignment = "True Neutral";
    cleric.deity = "pelor";
    expect(getClericUndeadTurningMode(cleric)).toBe("turn");
    cleric.deity = "nerull";
    expect(getClericUndeadTurningMode(cleric)).toBe("rebuke");
    cleric.alignment = "Neutral Evil";
    cleric.deity = "gilean";
    expect(getClericUndeadTurningMode(cleric)).toBe("rebuke");

    cleric.alignment = "Lawful Evil";
    cleric.deity = "st-cuthbert";
    expect(getClericUndeadTurningMode(cleric)).toBe("turn");
    cleric.alignment = "Lawful Neutral";
    cleric.deity = "we-jas";
    expect(getClericUndeadTurningMode(cleric)).toBe("rebuke");
    cleric.alignment = "True Neutral";
    cleric.deity = "obad-hai";
    expect(getClericUndeadTurningMode(cleric)).toBe("turn");
    cleric.alignment = "Neutral Evil";
    expect(getClericUndeadTurningMode(cleric)).toBe("rebuke");
  });

  it("represents the Dungeon Master's Guide II feat headings", () => {
    const representedNames = featCatalog
      .filter((feat) =>
        feat.sourceBook === "Dungeon Master's Guide II (3.5)" &&
        dungeonMastersGuideIIFeats.has(normalizeFeatName(feat.name)),
      )
      .map((feat) => normalizeFeatName(feat.name))
      .sort();
    expect(dungeonMastersGuideIIFeats.size).toBe(6);
    expect(representedNames).toEqual([...dungeonMastersGuideIIFeats].sort());
  });

  it("enforces Dungeon Master's Guide II feat prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Dungeon Master's Guide II feat: ${id}.`);
      return feat;
    };
    const slot = (characterLevel: number) => ({
      fighterOnly: false,
      characterLevel,
    });

    const apprentice = featById("apprentice");
    expect(apprentice.firstLevelOnly).toBe(true);
    expect(featQualifies(initialCharacter, apprentice, slot(1))).toBe(true);
    expect(featQualifies(initialCharacter, apprentice, slot(2))).toBe(false);

    const mentorCharacter = cloneCharacter(initialCharacter);
    mentorCharacter.classLevels = [{ classId: "fighter", level: 8 }];
    mentorCharacter.featSelections = { "general-1": "apprentice" };
    const mentor = featById("mentor");
    expect(featQualifies(mentorCharacter, mentor, slot(6))).toBe(false);
    mentorCharacter.hasGraduatedFromApprenticeship = true;
    mentorCharacter.hasMentorSkillPrerequisites = true;
    expect(featQualifies(mentorCharacter, mentor, slot(6))).toBe(true);

    const businessCharacter = cloneCharacter(initialCharacter);
    businessCharacter.classLevels = [{ classId: "fighter", level: 3 }];
    const businessSavvy = featById("business-savvy");
    expect(featQualifies(businessCharacter, businessSavvy, slot(3))).toBe(false);
    businessCharacter.featSelections = { "general-1": "negotiator" };
    expect(featQualifies(businessCharacter, businessSavvy, slot(3))).toBe(true);

    const guildCharacter = cloneCharacter(initialCharacter);
    const favoredInGuild = featById("favored-in-guild");
    expect(featQualifies(guildCharacter, favoredInGuild, slot(1))).toBe(false);
    guildCharacter.isGuildMember = true;
    expect(featQualifies(guildCharacter, favoredInGuild, slot(1))).toBe(true);

    guildCharacter.classLevels = [{ classId: "fighter", level: 9 }];
    guildCharacter.featSelections = {
      "general-1": "favored-in-guild",
      "general-6": "leadership",
    };
    const guildmaster = featById("guildmaster");
    expect(featQualifies(guildCharacter, guildmaster, slot(9))).toBe(false);
    guildCharacter.hasGuildmasterPrerequisites = true;
    expect(featQualifies(guildCharacter, guildmaster, slot(9))).toBe(true);

    const truebondCharacter = cloneCharacter(initialCharacter);
    truebondCharacter.classLevels = [{ classId: "fighter", level: 6 }];
    const truebond = featById("truebond");
    expect(featQualifies(truebondCharacter, truebond, slot(6))).toBe(false);
    truebondCharacter.hasCompletedBondingRitual = true;
    expect(featQualifies(truebondCharacter, truebond, slot(6))).toBe(true);
  });

  it("attributes Monster Manual III's verified feat definitions without duplicating reprints", () => {
    const monsterManualIIIFeats = featCatalog.filter((feat) =>
      feat.sourceBook?.startsWith("Monster Manual III"),
    );
    expect(monsterManualIIIFeats.map((feat) => feat.id).sort()).toEqual([
      "adamantine-body",
      "extra-shifter-trait",
      "healing-factor",
      "improved-fortification",
      "mithral-body",
      "mithral-fluidity",
      "powerful-charge",
      "shifter-defense",
      "shifter-instincts",
    ]);
  });

  it("tracks Complete Warrior feats and distinguishes its epic-name overlap", () => {
    const representedFeats = featCatalog.filter((feat) =>
      completeWarriorFeats.has(normalizeFeatName(feat.name)) &&
      (feat.sourceBook === "Complete Warrior (3.5)" ||
        feat.id === "improved-favored-enemy"),
    );
    expect(completeWarriorFeats.size).toBe(83);
    expect(representedFeats).toHaveLength(84);
    expect(
      representedFeats
        .filter((feat) => feat.sourceBook === "Complete Warrior (3.5)")
        .map((feat) => feat.name)
        .sort(),
    ).toEqual([
      "Anvil of Thunder",
      "Arcane Strike",
      "Arterial Strike",
      "Axiomatic Strike",
      "Bear Fang",
      "Cavalry Charger",
      "Clever Wrestling",
      "Close-Quarters Fighting",
      "Combat Brute",
      "Crescent Moon",
      "Dash",
      "Defensive Strike",
      "Defensive Throw",
      "Destructive Rage",
      "Divine Cleansing",
      "Divine Might",
      "Divine Resistance",
      "Divine Shield",
      "Divine Vigor",
      "Eagle Claw Attack",
      "Earth’s Embrace",
      "Elusive Target",
      "Extend Rage",
      "Extra Rage",
      "Extra Smiting",
      "Extra Stunning",
      "Eyes in the Back of Your Head",
      "Faster Healing",
      "Favored Power Attack",
      "Fists of Iron",
      "Fleet of Foot",
      "Flick of the Wrist",
      "Flying Kick",
      "Formation Expert",
      "Freezing the Lifeblood",
      "Giantbane",
      "Greater Kiai Shout",
      "Greater Resiliency",
      "Greater Two-Weapon Defense",
      "Hammer’s Edge",
      "Hamstring",
      "High Sword Low Axe",
      "Hold the Line",
      "Improved Buckler Defense",
      "Improved Combat Expertise",
      "Improved Familiar",
      "Improved Favored Enemy",
      "Improved Mounted Archery",
      "Improved Rapid Shot",
      "Improved Toughness",
      "Improved Two-Weapon Defense",
      "Improved Weapon Familiarity",
      "Instantaneous Rage",
      "Intimidating Rage",
      "Karmic Strike",
      "Kiai Shout",
      "Lightning Mace",
      "Monkey Grip",
      "Net and Trident",
      "Pain Touch",
      "Phalanx Fighting",
      "Pin Shield",
      "Power Critical",
      "Prone Attack",
      "Quick Staff",
      "Ranged Disarm",
      "Ranged Pin",
      "Ranged Sunder",
      "Rapid Stunning",
      "Raptor School",
      "Roundabout Kick",
      "Sacred Vengeance",
      "Sharp-Shooting",
      "Shield Charge",
      "Shield Slam",
      "Shock Trooper",
      "Spinning Halberd",
      "Sun School",
      "Swarmfighting",
      "Three Mountains",
      "Throw Anything",
      "Weakening Touch",
      "Zen Archery",
    ]);
    const epicImprovedFavoredEnemy = representedFeats.find(
      (feat) => feat.id === "improved-favored-enemy",
    );
    if (!epicImprovedFavoredEnemy)
      throw new Error("Missing epic Improved Favored Enemy fixture.");
    expect(epicImprovedFavoredEnemy).toMatchObject({
      id: "improved-favored-enemy",
      sourceBook: "Dungeon Master's Guide (3.5)",
      prerequisites: { minimumCharacterLevel: 21 },
    });
    const completeWarriorImprovedFavoredEnemy = representedFeats.find(
      (feat) => feat.id === "improved-favored-enemy-complete-warrior",
    );
    if (!completeWarriorImprovedFavoredEnemy)
      throw new Error("Missing Complete Warrior Improved Favored Enemy fixture.");
    expect(completeWarriorImprovedFavoredEnemy).toMatchObject({
      name: "Improved Favored Enemy",
      sourceBook: "Complete Warrior (3.5)",
      prerequisites: { baseAttackBonus: 5, minimumFavoredEnemies: 1 },
    });
  });

  it("enforces Complete Warrior general feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 12 }];
    character.abilities = {
      ...character.abilities,
      dex: 17,
      int: 13,
      str: 13,
      wis: 13,
    };
    character.skills["Sleight of Hand"] = 5;
    character.featSelections = {
      "general-1": "run",
      "general-2": "quick-draw",
      "general-3": "shield-proficiency",
      "general-4": "combat-expertise",
      "general-5": "two-weapon-fighting",
      "general-6": "two-weapon-defense",
      "general-7": "combat-reflexes",
      "general-8": "manyshot",
      "general-9": "point-blank-shot",
      "general-10": "rapid-shot",
      "general-11": "precise-shot",
    };
    const slot = { fighterOnly: false, characterLevel: 12 };
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const representedIds = [
      "dash",
      "faster-healing",
      "fleet-of-foot",
      "flick-of-the-wrist",
      "improved-buckler-defense",
      "improved-combat-expertise",
      "improved-rapid-shot",
      "improved-toughness",
      "improved-two-weapon-defense",
      "hold-the-line",
      "monkey-grip",
      "ranged-disarm",
      "ranged-sunder",
      "sharp-shooting",
      "zen-archery",
    ];

    expect(
      representedIds.every((id) =>
        featQualifies(character, featById(id), slot),
      ),
    ).toBe(true);

    character.skills["Sleight of Hand"] = 4;
    expect(
      featQualifies(character, featById("flick-of-the-wrist"), slot),
    ).toBe(false);
    delete character.featSelections["general-10"];
    expect(
      featQualifies(character, featById("improved-rapid-shot"), slot),
    ).toBe(false);
    delete character.featSelections["general-7"];
    expect(
      featQualifies(character, featById("hold-the-line"), slot),
    ).toBe(false);
    character.abilities.str = 12;
    expect(
      featQualifies(character, featById("ranged-sunder"), slot),
    ).toBe(false);
    delete character.featSelections["general-11"];
    expect(
      featQualifies(character, featById("ranged-disarm"), slot),
    ).toBe(false);
    expect(
      featQualifies(character, featById("sharp-shooting"), slot),
    ).toBe(false);
    const lowFortitudeCharacter = cloneCharacter(initialCharacter);
    lowFortitudeCharacter.classLevels = [{ classId: "wizard", level: 1 }];
    const firstLevelSlot = { fighterOnly: false, characterLevel: 1 };
    expect(
      featQualifies(
        lowFortitudeCharacter,
        featById("faster-healing"),
        firstLevelSlot,
      ),
    ).toBe(false);
    expect(
      featQualifies(
        lowFortitudeCharacter,
        featById("improved-toughness"),
        firstLevelSlot,
      ),
    ).toBe(false);
  });

  it("enforces Complete Warrior tactical feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 18 }];
    character.abilities.wis = 13;
    character.abilities.dex = 13;
    character.abilities.str = 13;
    character.skills.Jump = 5;
    character.featSelections = {
      "general-1": "improved-sunder",
      "general-3": "power-attack",
      "general-6": "dodge",
      "general-9": "mobility",
      "general-12": "improved-bull-rush",
    };
    const slot = { fighterOnly: false, characterLevel: 18 };
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior tactical feat: ${id}.`);
      return feat;
    };
    const combatBrute = featById("combat-brute");
    const elusiveTarget = featById("elusive-target");
    const formationExpert = featById("formation-expert");
    const raptorSchool = featById("raptor-school");
    const shockTrooper = featById("shock-trooper");

    expect(featQualifies(character, combatBrute, slot)).toBe(true);
    expect(featQualifies(character, elusiveTarget, slot)).toBe(true);
    expect(featQualifies(character, formationExpert, slot)).toBe(true);
    expect(featQualifies(character, raptorSchool, slot)).toBe(true);
    expect(featQualifies(character, shockTrooper, slot)).toBe(true);
    expect(
      featQualifies(character, combatBrute, { ...slot, fighterOnly: true }),
    ).toBe(true);
    expect(
      featQualifies(character, elusiveTarget, { ...slot, fighterOnly: true }),
    ).toBe(false);
    expect(
      featQualifies(character, formationExpert, { ...slot, fighterOnly: true }),
    ).toBe(true);
    expect(
      featQualifies(character, raptorSchool, { ...slot, fighterOnly: true }),
    ).toBe(false);

    delete character.featSelections["general-3"];
    expect(featQualifies(character, combatBrute, slot)).toBe(false);
    expect(featQualifies(character, shockTrooper, slot)).toBe(false);
  });

  it("enforces Complete Warrior unarmed feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 18 }];
    character.abilities.str = 15;
    character.abilities.dex = 13;
    character.abilities.wis = 13;
    character.skills.Jump = 5;
    character.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "stunning-fist",
      "general-6": "power-attack",
    };
    const slot = { fighterOnly: false, characterLevel: 18 };
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior unarmed feat: ${id}.`);
      return feat;
    };

    expect(featQualifies(character, featById("fists-of-iron"), slot)).toBe(
      true,
    );
    expect(featQualifies(character, featById("flying-kick"), slot)).toBe(true);
    expect(
      featQualifies(character, featById("roundabout-kick"), slot),
    ).toBe(true);

    character.skills.Jump = 3;
    expect(featQualifies(character, featById("flying-kick"), slot)).toBe(
      false,
    );
    character.abilities.str = 14;
    expect(
      featQualifies(character, featById("roundabout-kick"), slot),
    ).toBe(false);
    delete character.featSelections["general-3"];
    expect(featQualifies(character, featById("fists-of-iron"), slot)).toBe(
      false,
    );
  });

  it("enforces Complete Warrior divine feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "cleric", level: 12 }];
    character.abilities.str = 13;
    character.featSelections = {
      "general-1": "power-attack",
      "general-3": "shield-proficiency",
      "general-6": "divine-cleansing",
    };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-12",
    );
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    if (!slot) throw new Error("Missing Complete Warrior divine feat slot.");

    expect(featQualifies(character, featById("dash"), slot)).toBe(true);
    expect(featQualifies(character, featById("divine-cleansing"), slot)).toBe(
      true,
    );
    expect(featQualifies(character, featById("divine-might"), slot)).toBe(
      true,
    );
    expect(featQualifies(character, featById("divine-shield"), slot)).toBe(
      true,
    );
    expect(featQualifies(character, featById("divine-vigor"), slot)).toBe(
      true,
    );
    expect(featQualifies(character, featById("sacred-vengeance"), slot)).toBe(
      true,
    );
    expect(
      featQualifies(
        character,
        featById("divine-resistance"),
        { ...slot, id: "general-12" },
      ),
    ).toBe(true);

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 12 }];
    fighter.featSelections = { "general-1": "shield-proficiency" };
    expect(
      featQualifies(fighter, featById("divine-cleansing"), slot),
    ).toBe(false);
    expect(featQualifies(fighter, featById("divine-shield"), slot)).toBe(
      false,
    );

    character.abilities.str = 12;
    expect(featQualifies(character, featById("divine-might"), slot)).toBe(
      false,
    );
  });

  it("enforces Complete Warrior rage and smite feat prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const barbarian = cloneCharacter(initialCharacter);
    barbarian.classLevels = [{ classId: "barbarian", level: 12 }];
    barbarian.abilities.wis = 13;
    const twelfthLevelSlot = { fighterOnly: false, characterLevel: 12 };

    expect(featQualifies(barbarian, featById("extra-rage"), twelfthLevelSlot)).toBe(
      true,
    );
    expect(
      featQualifies(barbarian, featById("destructive-rage"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(barbarian, featById("extend-rage"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(barbarian, featById("greater-resiliency"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(barbarian, featById("eyes-in-the-back-of-your-head"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(barbarian, featById("instantaneous-rage"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(barbarian, featById("intimidating-rage"), twelfthLevelSlot),
    ).toBe(true);

    barbarian.classLevels = [{ classId: "fighter", level: 12 }];
    expect(featQualifies(barbarian, featById("extra-rage"), twelfthLevelSlot)).toBe(
      false,
    );
    expect(
      featQualifies(barbarian, featById("greater-resiliency"), twelfthLevelSlot),
    ).toBe(false);

    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 12 }];
    expect(
      featQualifies(paladin, featById("extra-smiting"), twelfthLevelSlot),
    ).toBe(true);
    paladin.classLevels = [{ classId: "fighter", level: 12 }];
    expect(
      featQualifies(paladin, featById("extra-smiting"), twelfthLevelSlot),
    ).toBe(false);
  });

  it("enforces Complete Warrior stunning, shout, prone, and mounted prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 20 }];
    fighter.abilities = {
      ...fighter.abilities,
      cha: 13,
      dex: 15,
      wis: 15,
    };
    fighter.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "stunning-fist",
      "general-6": "lightning-reflexes",
      "general-9": "kiai-shout",
      "general-12": "combat-reflexes",
      "general-15": "point-blank-shot",
      "general-18": "precise-shot",
    };
    const twentiethLevelSlot = { fighterOnly: false, characterLevel: 20 };

    expect(
      featQualifies(fighter, featById("extra-stunning"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("prone-attack"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("kiai-shout"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("greater-kiai-shout"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("pain-touch"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("rapid-stunning"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("ranged-pin"), twentiethLevelSlot),
    ).toBe(true);

    const mountedFighter = cloneCharacter(initialCharacter);
    mountedFighter.classLevels = [{ classId: "fighter", level: 20 }];
    mountedFighter.abilities.dex = 19;
    mountedFighter.skills.Ride = 1;
    mountedFighter.featSelections = {
      "general-1": "two-weapon-fighting",
      "general-3": "two-weapon-defense",
      "general-6": "improved-two-weapon-fighting",
      "general-9": "mounted-combat",
      "general-12": "mounted-archery",
    };
    expect(
      featQualifies(
        mountedFighter,
        featById("greater-two-weapon-defense"),
        twentiethLevelSlot,
      ),
    ).toBe(true);
    expect(
      featQualifies(mountedFighter, featById("pin-shield"), twentiethLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(
        mountedFighter,
        featById("improved-mounted-archery"),
        twentiethLevelSlot,
      ),
    ).toBe(true);

    delete mountedFighter.featSelections["general-12"];
    expect(
      featQualifies(
        mountedFighter,
        featById("improved-mounted-archery"),
        twentiethLevelSlot,
      ),
    ).toBe(false);
    delete mountedFighter.featSelections["general-6"];
    expect(
      featQualifies(
        mountedFighter,
        featById("greater-two-weapon-defense"),
        twentiethLevelSlot,
      ),
    ).toBe(false);
  });

  it("enforces Complete Warrior shield and tactical feat prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const shieldFighter = cloneCharacter(initialCharacter);
    shieldFighter.classLevels = [{ classId: "fighter", level: 12 }];
    shieldFighter.featSelections = {
      "general-1": "shield-proficiency",
      "general-3": "improved-shield-bash",
      "general-6": "shield-charge",
    };
    const twelfthLevelSlot = { fighterOnly: false, characterLevel: 12 };

    expect(
      featQualifies(shieldFighter, featById("shield-charge"), twelfthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(shieldFighter, featById("shield-slam"), twelfthLevelSlot),
    ).toBe(true);
    delete shieldFighter.featSelections["general-3"];
    expect(
      featQualifies(shieldFighter, featById("shield-charge"), twelfthLevelSlot),
    ).toBe(false);
    expect(
      featQualifies(shieldFighter, featById("shield-slam"), twelfthLevelSlot),
    ).toBe(false);

    const mountedFighter = cloneCharacter(initialCharacter);
    mountedFighter.classLevels = [{ classId: "fighter", level: 12 }];
    mountedFighter.skills.Ride = 1;
    mountedFighter.featSelections = {
      "general-1": "mounted-combat",
      "general-3": "ride-by-attack",
      "general-6": "spirited-charge",
      "general-9": "trample",
    };
    expect(
      featQualifies(
        mountedFighter,
        featById("cavalry-charger"),
        twelfthLevelSlot,
      ),
    ).toBe(true);

    const monk = cloneCharacter(initialCharacter);
    monk.classLevels = [{ classId: "monk", level: 6 }];
    expect(
      featQualifies(monk, featById("sun-school"), {
        fighterOnly: false,
        characterLevel: 6,
      }),
    ).toBe(true);
    monk.classLevels = [{ classId: "fighter", level: 6 }];
    expect(
      featQualifies(monk, featById("sun-school"), {
        fighterOnly: false,
        characterLevel: 6,
      }),
    ).toBe(false);
  });

  it("enforces Complete Warrior arcane, unarmed, and skill-independent prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const slot = (characterLevel: number) => ({
      fighterOnly: false,
      characterLevel,
    });

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 8 }];
    wizard.abilities.int = 15;
    expect(featQualifies(wizard, featById("arcane-strike"), slot(8))).toBe(
      true,
    );
    wizard.classLevels = [{ classId: "fighter", level: 8 }];
    expect(featQualifies(wizard, featById("arcane-strike"), slot(8))).toBe(
      false,
    );

    const monk = cloneCharacter(initialCharacter);
    monk.classLevels = [{ classId: "monk", level: 10 }];
    monk.abilities.dex = 13;
    monk.abilities.wis = 13;
    monk.featSelections = { "monk-1": "stunning-fist" };
    expect(getChosenFeats(monk)).toContain("stunning-fist");
    expect(getClassFeatureDisplay(monk).map(({ ability }) => ability))
      .toContain("Ki Strike (lawful)");
    expect(featQualifies(monk, featById("axiomatic-strike"), slot(10))).toBe(
      true,
    );
    monk.classLevels = [{ classId: "monk", level: 9 }];
    expect(featQualifies(monk, featById("axiomatic-strike"), slot(9))).toBe(
      false,
    );

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 12 }];
    fighter.abilities = {
      ...fighter.abilities,
      dex: 13,
      int: 13,
      str: 13,
      wis: 17,
    };
    fighter.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "power-attack",
      "general-6": "improved-sunder",
      "general-9": "stunning-fist",
      "general-12": "dodge",
      "general-15": "combat-expertise",
    };
    expect(
      featQualifies(
        fighter,
        featById("close-quarters-fighting"),
        slot(12),
      ),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("eagle-claw-attack"), slot(12)),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("freezing-the-lifeblood"), slot(12)),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("karmic-strike"), slot(20)),
    ).toBe(true);
    expect(
      featQualifies(fighter, featById("phalanx-fighting"), slot(13)),
    ).toBe(true);
    const shieldWizard = cloneCharacter(initialCharacter);
    shieldWizard.classLevels = [{ classId: "wizard", level: 2 }];
    expect(
      featQualifies(shieldWizard, featById("phalanx-fighting"), slot(2)),
    ).toBe(false);

    const rogue = cloneCharacter(initialCharacter);
    rogue.classLevels = [{ classId: "rogue", level: 8 }];
    expect(featQualifies(rogue, featById("hamstring"), slot(8))).toBe(true);
    rogue.classLevels = [{ classId: "fighter", level: 8 }];
    expect(featQualifies(rogue, featById("hamstring"), slot(8))).toBe(false);
  });

  it("enforces Complete Warrior sneak attack, defensive, and grapple prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    const rogue = cloneCharacter(initialCharacter);
    rogue.classLevels = [{ classId: "rogue", level: 8 }];
    expect(
      featQualifies(rogue, featById("arterial-strike"), {
        fighterOnly: false,
        characterLevel: 8,
      }),
    ).toBe(true);

    const defensiveFighter = cloneCharacter(initialCharacter);
    defensiveFighter.classLevels = [{ classId: "fighter", level: 8 }];
    defensiveFighter.abilities = {
      ...defensiveFighter.abilities,
      dex: 13,
      int: 13,
    };
    defensiveFighter.featSelections = {
      "general-1": "dodge",
      "general-3": "combat-expertise",
    };
    expect(
      featQualifies(
        defensiveFighter,
        featById("defensive-strike"),
        { fighterOnly: false, characterLevel: 8 },
      ),
    ).toBe(true);

    const grappler = cloneCharacter(initialCharacter);
    grappler.classLevels = [{ classId: "fighter", level: 16 }];
    grappler.abilities = {
      ...grappler.abilities,
      dex: 13,
      int: 13,
      str: 15,
      wis: 17,
    };
    grappler.featSelections = {
      "general-1": "improved-unarmed-strike",
      "general-3": "dodge",
      "general-6": "combat-expertise",
      "general-9": "improved-trip",
      "general-12": "combat-reflexes",
      "general-15": "stunning-fist",
    };
    const sixteenthLevelSlot = { fighterOnly: false, characterLevel: 16 };
    expect(
      featQualifies(grappler, featById("defensive-throw"), sixteenthLevelSlot),
    ).toBe(true);
    expect(
      featQualifies(grappler, featById("weakening-touch"), sixteenthLevelSlot),
    ).toBe(true);

    grappler.featSelections["general-15"] = "improved-grapple";
    expect(
      featQualifies(grappler, featById("earths-embrace"), sixteenthLevelSlot),
    ).toBe(true);
    delete grappler.featSelections["general-15"];
    grappler.classFeatures = ["Improved Grab"];
    expect(
      featQualifies(grappler, featById("earths-embrace"), sixteenthLevelSlot),
    ).toBe(true);
    grappler.classFeatures = [];
    expect(
      featQualifies(grappler, featById("earths-embrace"), sixteenthLevelSlot),
    ).toBe(false);
  });

  it("enforces Complete Warrior Favored Power Attack prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 6 }];
    character.abilities.str = 13;
    character.rangerFavoredEnemies = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Undead",
        bonusTargetLevel: 1,
      },
    ];
    character.featSelections = { "general-1": "power-attack" };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const favoredPowerAttack = featCatalog.find(
      (feat) => feat.id === "favored-power-attack",
    );
    if (!slot || !favoredPowerAttack)
      throw new Error("Missing Favored Power Attack fixtures.");

    expect(featQualifies(character, favoredPowerAttack, slot)).toBe(true);
    character.rangerFavoredEnemies = [];
    expect(featQualifies(character, favoredPowerAttack, slot)).toBe(false);
    character.rangerFavoredEnemies = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Undead",
        bonusTargetLevel: 1,
      },
    ];
    delete character.featSelections["general-1"];
    expect(featQualifies(character, favoredPowerAttack, slot)).toBe(false);
  });

  it("enforces Complete Warrior Improved Favored Enemy prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 6 }];
    character.rangerFavoredEnemies = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Undead",
        bonusTargetLevel: 1,
      },
    ];
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const improvedFavoredEnemy = featCatalog.find(
      (feat) => feat.id === "improved-favored-enemy-complete-warrior",
    );
    if (!slot || !improvedFavoredEnemy)
      throw new Error("Missing Improved Favored Enemy fixtures.");

    expect(featQualifies(character, improvedFavoredEnemy, slot)).toBe(true);
    character.rangerFavoredEnemies = [];
    expect(featQualifies(character, improvedFavoredEnemy, slot)).toBe(false);
    character.rangerFavoredEnemies = [
      {
        classLevel: 1,
        kind: "creature",
        target: "Undead",
        bonusTargetLevel: 1,
      },
    ];
    character.classLevels = [{ classId: "ranger", level: 4 }];
    expect(featQualifies(character, improvedFavoredEnemy, slot)).toBe(false);
  });

  it("enforces Complete Warrior size-based feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.race = "Gnome";
    character.abilities.dex = 13;
    character.skills.Tumble = 5;
    character.featSelections = { "general-1": "improved-unarmed-strike" };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Complete Warrior feat: ${id}.`);
      return feat;
    };
    if (!slot) throw new Error("Missing level 6 general feat slot.");

    expect(featQualifies(character, featById("clever-wrestling"), slot)).toBe(true);
    expect(featQualifies(character, featById("swarmfighting"), slot)).toBe(true);
    expect(featQualifies(character, featById("giantbane"), slot)).toBe(true);
    character.race = "Human";
    expect(featQualifies(character, featById("clever-wrestling"), slot)).toBe(true);
    expect(featQualifies(character, featById("giantbane"), slot)).toBe(true);
    expect(featQualifies(character, featById("swarmfighting"), slot)).toBe(false);
    character.skills.Tumble = 4;
    expect(featQualifies(character, featById("giantbane"), slot)).toBe(false);
  });

  it("enforces distinct weapon-focus groups and net proficiency for Complete Warrior styles", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 12 }];
    character.abilities.str = 13;
    character.abilities.dex = 15;
    character.featSelections = {
      "fighter-1": "power-attack",
      "fighter-2": "improved-sunder",
      "fighter-4": "two-weapon-fighting",
      "fighter-6": "weapon-focus",
      "fighter-8": "weapon-focus",
    };
    character.featWeaponSelections = {
      "fighter-6": "Warhammer",
      "fighter-8": "Battleaxe",
    };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-12",
    );
    const anvilOfThunder = featCatalog.find(
      (feat) => feat.id === "anvil-of-thunder",
    );
    if (!slot || !anvilOfThunder)
      throw new Error("Missing Anvil of Thunder fixtures.");

    expect(featQualifies(character, anvilOfThunder, slot)).toBe(true);
    character.featWeaponSelections["fighter-8"] = "Dagger";
    expect(featQualifies(character, anvilOfThunder, slot)).toBe(false);
    character.featWeaponSelections["fighter-8"] = "Battleaxe";
    delete character.featSelections["fighter-8"];
    expect(featQualifies(character, anvilOfThunder, slot)).toBe(false);

    character.featSelections["fighter-8"] = "exotic-weapon-proficiency";
    character.featWeaponSelections["fighter-8"] = "Net";
    character.featSelections["fighter-10"] = "weapon-focus";
    character.featWeaponSelections["fighter-10"] = "Trident";
    character.featSelections["fighter-4"] = "two-weapon-fighting";
    character.abilities.dex = 15;
    const netAndTrident = featCatalog.find(
      (feat) => feat.id === "net-and-trident",
    );
    if (!netAndTrident)
      throw new Error("Missing Net and Trident fixture.");

    expect(featQualifies(character, netAndTrident, slot)).toBe(true);
    character.featWeaponSelections["fighter-8"] = "Dwarven Waraxe";
    expect(featQualifies(character, netAndTrident, slot)).toBe(false);
  });

  it("enforces remaining Complete Warrior general feat prerequisites", () => {
    const familiarUser = cloneCharacter(initialCharacter);
    familiarUser.classLevels = [
      { classId: "fighter", level: 3 },
      { classId: "wizard", level: 3 },
    ];
    const familiarSlot = getFeatSlots(familiarUser).find(
      (featSlot) => featSlot.id === "general-6",
    );
    const improvedFamiliar = featCatalog.find(
      (feat) => feat.id === "improved-familiar-complete-warrior",
    );
    if (!familiarSlot || !improvedFamiliar)
      throw new Error("Missing Improved Familiar fixtures.");
    expect(featQualifies(familiarUser, improvedFamiliar, familiarSlot)).toBe(true);
    familiarUser.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(familiarUser, improvedFamiliar, familiarSlot)).toBe(false);

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 1 }];
    const firstLevelSlot = getFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-1",
    );
    const improvedWeaponFamiliarity = featCatalog.find(
      (feat) => feat.id === "improved-weapon-familiarity",
    );
    if (!firstLevelSlot || !improvedWeaponFamiliarity)
      throw new Error("Missing Improved Weapon Familiarity fixtures.");
    expect(
      featQualifies(fighter, improvedWeaponFamiliarity, firstLevelSlot),
    ).toBe(true);

    fighter.classLevels = [{ classId: "fighter", level: 3 }];
    fighter.abilities.dex = 15;
    const thirdLevelSlot = getFeatSlots(fighter).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const throwAnything = featCatalog.find(
      (feat) => feat.id === "throw-anything",
    );
    if (!thirdLevelSlot || !throwAnything)
      throw new Error("Missing Throw Anything fixtures.");
    expect(featQualifies(fighter, throwAnything, thirdLevelSlot)).toBe(true);
    fighter.abilities.dex = 14;
    expect(featQualifies(fighter, throwAnything, thirdLevelSlot)).toBe(false);
  });

  it("limits Power Critical to focused weapons and allows same-weapon repeats", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 9 }];
    character.featSelections = {
      "fighter-1": "weapon-focus",
      "general-6": "power-critical",
    };
    character.featWeaponSelections = {
      "fighter-1": "Longsword",
      "general-6": "Longsword",
    };
    const slot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-9",
    );
    const powerCritical = featCatalog.find(
      (feat) => feat.id === "power-critical",
    );
    if (!slot || !powerCritical)
      throw new Error("Missing Power Critical fixtures.");

    expect(
      getAvailableFeatWeaponChoices(character, powerCritical.id, slot.id),
    ).toEqual(["Longsword"]);
    expect(getAvailableFeats(character, slot)).toContain(powerCritical);
  });

  it("matches Monster Manual IV's monster-feat coverage", () => {
    const representedNames = new Set(
      featCatalog
        .map((feat) => normalizeFeatName(feat.name))
        .filter((name) => monsterManualIVFeats.has(name)),
    );
    const unrepresentedNames = new Set(
      [...monsterManualIVFeats].filter(
        (name) => !representedNames.has(name),
      ),
    );
    expect(monsterManualIVFeats.size).toBe(13);
    expect([...representedNames].sort()).toEqual([
      "Ability Focus",
      "Awesome Blow",
      "Clinging Breath",
      "Craft Construct",
      "Flyby Attack",
      "Githyanki Battlecaster",
      "Githyanki Dragonrider",
      "Improved Natural Attack",
      "Improved Toughness",
      "Lingering Breath",
      "Multiattack",
      "Powerful Charge",
      "Quicken Spell-Like Ability",
    ]);
    expect(unrepresentedNames).toEqual(new Set());
  });

  it("matches Monster Manual V's monster-feat coverage", () => {
    const representedNames = new Set(
      featCatalog
        .map((feat) => normalizeFeatName(feat.name))
        .filter((name) => monsterManualVFeats.has(name)),
    );
    const unrepresentedNames = new Set(
      [...monsterManualVFeats].filter(
        (name) => !representedNames.has(name),
      ),
    );
    expect(monsterManualVFeats.size).toBe(12);
    expect([...representedNames].sort()).toEqual([
      "Ability Focus",
      "Awesome Blow",
      "Empower Spell-Like Ability",
      "Flyby Attack",
      "Hover",
      "Improved Natural Attack",
      "Improved Toughness",
      "Multiattack",
      "Powerful Charge",
      "Quicken Spell-Like Ability",
      "Snatch",
      "Wingover",
    ]);
    expect(unrepresentedNames).toEqual(new Set());
  });

  it("matches Monster Manual V's sidebar-feat coverage", () => {
    const representedNames = new Set(
      featCatalog
        .map((feat) => normalizeFeatName(feat.name))
        .filter((name) => monsterManualVSidebarFeats.has(name)),
    );
    const unrepresentedNames = new Set(
      [...monsterManualVSidebarFeats].filter(
        (name) => !representedNames.has(name),
      ),
    );
    expect(monsterManualVSidebarFeats.size).toBe(7);
    expect([...representedNames].sort()).toEqual([
      "Battle Magic Tactics",
      "Brutal Throw",
      "Daunting Presence",
      "Kuo-Toan Monasticism",
      "Mage Slayer",
      "Mind-Shattering Strike",
      "Sense Quintessence",
    ]);
    expect(unrepresentedNames).toEqual(new Set());
    expect(
      featCatalog
        .filter((feat) => feat.sourceBook === "Monster Manual V")
        .map((feat) => feat.id)
        .sort(),
    ).toEqual([
      "battle-magic-tactics",
      "daunting-presence",
      "kuo-toan-monasticism",
      "mind-shattering-strike",
      "sense-quintessence",
    ]);
  });

  it("enforces Monster Manual V sidebar-feat prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing Monster Manual V feat: ${id}.`);
      return feat;
    };
    const slot = (characterLevel: number) => ({
      fighterOnly: false,
      characterLevel,
    });

    const dauntingCharacter = cloneCharacter(initialCharacter);
    const dauntingPresence = featById("daunting-presence");
    expect(
      featQualifies(dauntingCharacter, dauntingPresence, slot(1)),
    ).toBe(false);
    dauntingCharacter.abilities = {
      ...dauntingCharacter.abilities,
      cha: 13,
    };
    expect(
      featQualifies(dauntingCharacter, dauntingPresence, slot(1)),
    ).toBe(true);

    const battleCaster = cloneCharacter(initialCharacter);
    battleCaster.classLevels = [{ classId: "wizard", level: 3 }];
    battleCaster.skills = { Spellcraft: 6 };
    expect(
      featQualifies(
        battleCaster,
        featById("battle-magic-tactics"),
        slot(3),
      ),
    ).toBe(true);

    const kuoToaMonk = cloneCharacter(initialCharacter);
    kuoToaMonk.classLevels = [{ classId: "monk", level: 1 }];
    kuoToaMonk.race = "Kuo-toa";
    expect(
      featQualifies(
        kuoToaMonk,
        featById("kuo-toan-monasticism"),
        slot(3),
      ),
    ).toBe(true);

    const mindShatterer = cloneCharacter(initialCharacter);
    mindShatterer.classLevels = [{ classId: "monk", level: 8 }];
    mindShatterer.race = "Kuo-toa";
    mindShatterer.featSelections = {
      "general-1": "kuo-toan-monasticism",
      "monk-1": "stunning-fist",
    };
    const mindShatteringSlot = { fighterOnly: false };
    const mindShatteringStrike = featById("mind-shattering-strike");
    expect(
      featQualifies(
        mindShatterer,
        mindShatteringStrike,
        mindShatteringSlot,
      ),
    ).toBe(true);

    const thoonAgent = cloneCharacter(initialCharacter);
    const senseQuintessence = featById("sense-quintessence");
    expect(
      featQualifies(thoonAgent, senseQuintessence, slot(1)),
    ).toBe(false);
    thoonAgent.hasDetectMagicAccess = true;
    thoonAgent.isThoonAffiliate = true;
    expect(
      featQualifies(thoonAgent, senseQuintessence, slot(1)),
    ).toBe(true);
  });

  it("uses unique feat IDs and keeps supplemental feats out of the provided-book inventory", () => {
    expect(new Set(featCatalog.map((feat) => feat.id)).size).toBe(
      featCatalog.length,
    );
    expect(featCatalog.find((feat) => feat.id === "brutal-throw")).toMatchObject({
      sourceBook: "Complete Adventurer (3.5)",
      description:
        "Str can replace Dex on thrown-weapon attack rolls; apply the substitution manually. Fighter bonus feat.",
      fighterBonus: true,
    });
    expect(featCatalog.find((feat) => feat.id === "sculpt-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Reshape an area spell as a 10-ft-radius, 30-ft-high cylinder, 40-ft cone, four 10-ft cubes, 20-ft-radius spread, or 120-ft line. Slot +1.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "black-lore-of-moil")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Necromancy spells deal +1d6 negative energy per two spell levels (minimum +1d6); saves still halve this bonus. A 25 gp runebone per bonus die limits the damage. Uses the normal slot.",
      prerequisites: { casterLevel: 7, spellFocusSchools: ["Necromancy"] },
    });
    expect(featCatalog.find((feat) => feat.id === "craft-contingent-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      categories: ["item-creation"],
      prerequisites: { casterLevel: 11 },
    });
    expect(featCatalog.find((feat) => feat.id === "chain-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "A single-target spell beyond touch arcs to one secondary per caster level (max 20, each within 30 ft.). Secondary damage is halved (Reflex half); nondamaging saves use DC -4. Slot +3.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "cooperative-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Adjacent casters casting the same spell gain +2 save DC and +1 CL checks vs. SR; each extra caster adds +1 to both. Normal slot.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "delay-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Delay an area, personal, or touch spell 1-5 rounds; decide targets and effects when cast, resolve on trigger. Slot +3.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "fortify-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Gain +2 on checks vs. spell resistance per slot level above actual level (minimum +1); spells without spell resistance are unaffected.",
    });
    expect(featCatalog.find((feat) => feat.id === "fortify-spell")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "explosive-spell")).toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        description:
          "In cones, cylinders, lines, or bursts, failed Reflex pushes creatures beyond the nearest edge, prone, and 1d6 damage per 10 ft. moved; obstacles may add 1d6. No AoO. Slot +2.",
    });
    expect(featCatalog.find((feat) => feat.id === "explosive-spell")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "persistent-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Fixed- or personal-range spells last 24 hours; instantaneous or discharged effects are ineligible. Slot +6.",
      prerequisites: { feats: ["extend-spell"] },
    });
    expect(featCatalog.find((feat) => feat.id === "repeat-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "At the start of your next turn, recast from its original location, affecting the same area or ranged target within 30 ft. Touch spells are ineligible. Slot +3.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "ranged-spell-specialization")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Ranged touch spells: +2 HP damage on first hit each round within 30 ft.; manual.",
      prerequisites: {
        casterLevel: 4,
        feats: ["weapon-focus"],
      },
    });
    expect(featCatalog.find((feat) => feat.id === "touch-spell-specialization")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Melee touch spells: +2 HP damage; multi-touch only on first hit. Manual.",
      prerequisites: {
        casterLevel: 4,
        feats: ["weapon-focus"],
      },
    });
    expect(featCatalog.find((feat) => feat.id === "sanctum-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Effective level +1 in your sanctum and -1 outside (including DCs); normal slot. Max diameter 20 ft./CL; 3-month residence and 7-day setup.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "split-ray")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Create one extra ray with a separate attack and normal effect; target the same or another creature. Rays are simultaneous; targets must be within 30 ft. of each other. Slot +2.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-extend")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Extend Spell to a spell without increasing its level or preparing it ahead of time.",
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-widen")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Widen Spell to an eligible area spell without increasing its level or preparing it ahead of time.",
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-extend")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "sudden-widen")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "sudden-empower")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Empower Spell to a spell without increasing its level or preparing it ahead of time.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-maximize")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Maximize Spell to a spell without increasing its level or preparing it ahead of time.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-quicken")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Quicken Spell to a spell without increasing its level or preparing it ahead of time; the spell is cast as a swift action.",
      prerequisites: {
        feats: [
          "quicken-spell",
          "sudden-empower",
          "sudden-extend",
          "sudden-maximize",
          "sudden-silent",
          "sudden-still",
        ],
      },
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-silent")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Silent Spell to a spell without increasing its level or preparing it ahead of time.",
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-still")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Once per day, apply Still Spell to a spell without increasing its level or preparing it ahead of time.",
    });
    expect(featCatalog.find((feat) => feat.id === "sudden-silent")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "sudden-still")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "transdimensional-spell")).toMatchObject({
      sourceBook: "Complete Divine (3.5)",
      description:
        "Affects incorporeal, Ethereal, Plane of Shadow, and extradimensional creatures. Direct targets must be perceived. Slot +1.",
    });
    expect(featCatalog.find((feat) => feat.id === "transdimensional-spell")?.prerequisites).toBeUndefined();
    expect(featCatalog.find((feat) => feat.id === "twin-spell")).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description:
        "Duplicate the spell simultaneously on the same target or area with identical choices; resolve each effect separately. Slot +4.",
      prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
    });
  });

  it("catalogs Complete Arcane energy feats with their energy choices and prerequisites", () => {
    for (const energy of ["acid", "cold", "electricity", "fire"] as const) {
      const energyName = `${energy[0].toUpperCase()}${energy.slice(1)}`;
      expect(featCatalog.find((feat) => feat.id === `energy-substitution-${energy}`))
        .toMatchObject({
          name: `Energy Substitution (${energyName})`,
          sourceBook: "Complete Arcane (3.5)",
          categories: ["metamagic"],
          prerequisites: {
            skills: { "Knowledge (arcana)": 5 },
            minimumFeatsByCategory: { metamagic: 1 },
          },
        });
      expect(featCatalog.find((feat) => feat.id === `energy-admixture-${energy}`))
        .toMatchObject({
          name: `Energy Admixture (${energyName})`,
          sourceBook: "Complete Arcane (3.5)",
          prerequisites: { feats: [`energy-substitution-${energy}`] },
        });
    }
    expect(featCatalog.find((feat) => feat.id === "nonlethal-substitution"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: {
          skills: { "Knowledge (arcana)": 5 },
          minimumFeatsByCategory: { metamagic: 1 },
        },
      });
    expect(featCatalog.find((feat) => feat.id === "born-of-the-three-thunders"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: {
          skills: { "Knowledge (nature)": 4 },
          feats: ["energy-substitution-electricity"],
        },
      });
    expect(featCatalog.find((feat) => feat.id === "lord-of-the-uttercold"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: {
          skills: { "Knowledge (the planes)": 9 },
          feats: ["energy-substitution-cold"],
        },
        description: expect.stringContaining("manual"),
      });
    const mageSlayer = featCatalog.find((feat) => feat.id === "mage-slayer");
    if (!mageSlayer) throw new Error("Missing Mage Slayer feat fixture.");
    expect(mageSlayer).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { baseAttackBonus: 3, skills: { Spellcraft: 2 } },
    });
    expect(mageSlayer.description).toContain("+1 on Will saves");
    expect(mageSlayer.description).toContain(
      "automatic Concentration failure",
    );
    expect(mageSlayer.description).toContain("caster levels by 4");
    const battleCaster = featCatalog.find((feat) => feat.id === "battle-caster");
    if (!battleCaster) throw new Error("Missing Battle Caster feat fixture.");
    expect(battleCaster).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { classLevels: { bard: 1 } },
    });
    expect(battleCaster.description).toContain(
      "Bard ignores medium armor's failure for Bard spells only",
    );
    expect(battleCaster.description).toContain(
      "shields and other class spells still fail",
    );
    expect(battleCaster.description).toContain("Verify other abilities manually");
    const pierceMagicalConcealment = featCatalog.find(
      (feat) => feat.id === "pierce-magical-concealment",
    );
    const pierceMagicalProtection = featCatalog.find(
      (feat) => feat.id === "pierce-magical-protection",
    );
    if (!pierceMagicalConcealment || !pierceMagicalProtection)
      throw new Error("Missing Pierce Magical feat fixtures.");
    expect(pierceMagicalConcealment).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: {
        abilities: { con: 13 },
        feats: ["blind-fight", "mage-slayer"],
      },
    });
    expect(pierceMagicalConcealment.description).toContain(
      "including mirror images",
    );
    expect(pierceMagicalConcealment.description).toContain(
      "nonmagical concealment remains",
    );
    expect(pierceMagicalConcealment.description).toContain("caster levels by 4");
    expect(pierceMagicalProtection).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { abilities: { con: 13 }, feats: ["mage-slayer"] },
    });
    expect(pierceMagicalProtection.description).toContain(
      "Standard-action melee attack",
    );
    expect(pierceMagicalProtection.description).toContain("damage dispels them");
    expect(pierceMagicalProtection.description).toContain("caster levels by 4");
    expect(featCatalog.find((feat) => feat.id === "obtain-familiar"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: {
          skills: { "Knowledge (arcana)": 4 },
          arcaneCasterLevel: 3,
        },
      });
    expect(featCatalog.find((feat) => feat.id === "practiced-spellcaster-wizard"))
      .toMatchObject({
        name: "Practiced Spellcaster (Wizard)",
        sourceBook: "Complete Divine (3.5)",
        prerequisites: {
          classLevels: { wizard: 1 },
          skills: { Spellcraft: 4 },
        },
      });
    expect(featCatalog.find((feat) => feat.id === "reckless-wand-wielder"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: {
          skills: { "Use Magic Device": 1 },
          feats: ["craft-wand"],
        },
      });
    expect(featCatalog.find((feat) => feat.id === "double-wand-wielder"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: { feats: ["craft-wand", "two-weapon-fighting"] },
      });
    expect(featCatalog.find((feat) => feat.id === "wandstrike"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: { skills: { "Use Magic Device": 4 } },
      });
    expect(featCatalog.find((feat) => feat.id === "innate-spell"))
      .toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
        prerequisites: { feats: ["quicken-spell", "silent-spell", "still-spell"] },
      });
    for (const id of [
      "communicator",
      "insightful",
      "soul-of-the-north",
      "spell-hand",
      "necropolis-born",
      "night-haunt",
    ]) {
      expect(featCatalog.find((feat) => feat.id === id)).toMatchObject({
        sourceBook: "Complete Arcane (3.5)",
      });
    }
    const practicedSpellcasterFeats = featCatalog.filter((feat) =>
      feat.id.startsWith("practiced-spellcaster-"),
    );
    expect(practicedSpellcasterFeats.map(({ id }) => id).sort()).toEqual([
      "practiced-spellcaster-bard",
      "practiced-spellcaster-beguiler",
      "practiced-spellcaster-cleric",
      "practiced-spellcaster-druid",
      "practiced-spellcaster-duskblade",
      "practiced-spellcaster-favored-soul",
      "practiced-spellcaster-mystic",
      "practiced-spellcaster-paladin",
      "practiced-spellcaster-ranger",
      "practiced-spellcaster-shugenja",
      "practiced-spellcaster-sorcerer",
      "practiced-spellcaster-spirit-shaman",
      "practiced-spellcaster-wizard",
    ]);
    for (const feat of practicedSpellcasterFeats) {
      const classId = feat.id.slice("practiced-spellcaster-".length);
      expect(feat).toMatchObject({
        sourceBook: "Complete Divine (3.5)",
        prerequisites: {
          classLevels: { [classId]: 1 },
          skills: { Spellcraft: 4 },
        },
      });
    }
  });

  it("includes the complete Player's Handbook feat table", () => {
    const phbFeats = featCatalog.filter(
      (feat) =>
        (feat.sourceBook ?? "Player's Handbook (3.5)") ===
        "Player's Handbook (3.5)",
    );
    expect(phbFeats).toHaveLength(109);
    expect(phbFeats.map((feat) => feat.id)).toContain("augment-summoning");
  });

  it("matches the PHB fighter bonus-feat markers", () => {
    const phbFighterBonusFeats = featCatalog.filter(
      (feat) =>
        feat.fighterBonus &&
        (feat.sourceBook ?? "Player's Handbook (3.5)") ===
          "Player's Handbook (3.5)",
    );
    expect(phbFighterBonusFeats.map((feat) => feat.id).sort()).toEqual([
      "blind-fight",
      "cleave",
      "combat-expertise",
      "combat-reflexes",
      "deflect-arrows",
      "dodge",
      "exotic-weapon-proficiency",
      "far-shot",
      "great-cleave",
      "greater-two-weapon-fighting",
      "greater-weapon-focus",
      "greater-weapon-specialization",
      "improved-bull-rush",
      "improved-critical",
      "improved-disarm",
      "improved-feint",
      "improved-grapple",
      "improved-initiative",
      "improved-overrun",
      "improved-precise-shot",
      "improved-shield-bash",
      "improved-sunder",
      "improved-trip",
      "improved-two-weapon-fighting",
      "improved-unarmed-strike",
      "manyshot",
      "mobility",
      "mounted-archery",
      "mounted-combat",
      "point-blank-shot",
      "power-attack",
      "precise-shot",
      "quick-draw",
      "rapid-reload",
      "rapid-shot",
      "ride-by-attack",
      "shot-on-the-run",
      "snatch-arrows",
      "spirited-charge",
      "spring-attack",
      "stunning-fist",
      "trample",
      "two-weapon-defense",
      "two-weapon-fighting",
      "weapon-finesse",
      "weapon-focus",
      "weapon-specialization",
      "whirlwind-attack",
    ]);
  });

  it("documents PHB feat effects and restrictions from their full descriptions", () => {
    const descriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    const sourceDetails = [
      ["armor-proficiency-light", "only to Balance, Climb, Escape Artist, Hide"],
      ["armor-proficiency-light", "double the normal penalty applies on Swim checks"],
      ["augment-summoning", "+4 enhancement bonus to Strength and Constitution"],
      ["augment-summoning", "for the duration of that spell"],
      ["brew-potion", "targets one or more creatures"],
      ["cleave", "your damage causes a creature to drop"],
      ["cleave", "reducing it below 0 hp or killing it"],
      ["cleave", "cannot take a 5-foot step"],
      ["skill-focus", "multiple times for different skills"],
      ["skill-focus", "do not stack for the same skill"],
      ["spell-focus", "its spells get +1 save DC"],
      ["spell-focus", "Repeat for other schools"],
      ["spell-focus", "same-school bonuses don't stack"],
      ["greater-spell-focus", "+1 more save DC for a Spell Focus school"],
      ["point-blank-shot", "with ranged weapons at ranges of up to 30 feet"],
      ["spell-penetration", "+2 on caster level checks to overcome spell resistance"],
      ["track", "follow them for 1 mile per check"],
      ["track", "without this feat, you can follow only trails with DC 10 or lower"],
      ["track", "retry after 1 hour outdoors or 10 minutes indoors"],
      ["alertness", "familiar grants its master this benefit"],
      ["blind-fight", "retain your Dexterity bonus to AC"],
      ["blind-fight", "three-quarters normal"],
      ["blind-fight", "no effect against a creature affected by blink"],
      ["craft-wand", "spell you know"],
      ["diehard", "automatically stabilize"],
      ["diehard", "immediately choose whether"],
      ["diehard", "reaching -10 hp kills you"],
      ["empower-spell", "saving throws, opposed rolls"],
      ["enlarge-spell", "close, medium, or long"],
      ["extend-spell", "concentration, instantaneous, and permanent"],
      ["maximize-spell", "saving throws, opposed rolls"],
      ["improved-bull-rush", "+4 on the opposed Strength check"],
      ["improved-grapple", "+4 on all grapple checks"],
      ["improved-overrun", "cannot choose to avoid you"],
      ["improved-overrun", "Table 5-1 lists no attack of opportunity"],
      ["improved-overrun", "overrun procedure says the defender gets one"],
      ["improved-sunder", "+4 on the attack roll"],
      ["improved-trip", "make a melee attack against an opponent you trip in melee"],
      ["improved-precise-shot", "choose your target instead of rolling randomly"],
      ["improved-unarmed-strike", "lethal or nonlethal damage"],
      ["improved-unarmed-strike", "attacks of opportunity against opponents who attack you unarmed"],
      ["heighten-spell", "uses a spell slot of the heightened level"],
      ["manyshot", "cumulative -2 penalty per arrow after the second"],
      ["power-attack", "Double the damage bonus"],
      ["quicken-spell", "spontaneously cast spells cannot be quickened"],
      ["rapid-reload", "reloading still provokes an attack of opportunity"],
      ["silent-spell", "bard spells cannot use this feat"],
      ["stunning-fist", "once per day per four character levels"],
      ["still-spell", "spells without somatic components are unaffected"],
      ["two-weapon-defense", "not natural weapons or unarmed strikes"],
      ["widen-spell", "burst, emanation, line, or spread"],
    ] as const;
    for (const [id, detail] of sourceDetails) {
      expect(descriptions.get(id)).toContain(detail);
    }
  });

  it("includes every epic feat from the Dungeon Master's Guide", () => {
    const epicFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Dungeon Master's Guide (3.5)",
    );
    expect(epicFeats.map((feat) => feat.id).sort()).toEqual([
      "familiar-spell",
      "great-smiting",
      "improved-elemental-wild-shape",
      "improved-favored-enemy",
      "improved-metamagic",
      "improved-sneak-attack",
      "improved-spell-capacity",
      "improved-stunning-fist",
      "lasting-inspiration",
      "overwhelming-critical",
      "planar-turning",
      "spell-knowledge",
      "terrifying-rage",
    ]);
    expect(
      epicFeats.every(
        (feat) => feat.prerequisites?.minimumCharacterLevel === 21,
      ),
    ).toBe(true);
  });

  it("documents source-specific Dungeon Master's Guide epic feat effects", () => {
    const descriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    expect(descriptions.get("improved-elemental-wild-shape")).toContain(
      "all its extraordinary and supernatural abilities",
    );
    expect(descriptions.get("improved-metamagic")).toContain(
      "no effect on a feat with a +1 or no adjustment",
    );
    expect(descriptions.get("improved-spell-capacity")).toContain(
      "ability-based bonus spells",
    );
    expect(descriptions.get("familiar-spell")).toContain(
      "at your caster level",
    );
    expect(descriptions.get("overwhelming-critical")).toContain(
      "creatures immune to critical hits are unaffected",
    );
    expect(descriptions.get("planar-turning")).toContain(
      "half their spell resistance, rounded down",
    );
  });

  it("attributes cataloged monster feats to their earliest supplied printing", () => {
    const monsterFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Monster Manual (3.5)",
    );
    expect(monsterFeats.map((feat) => feat.id).sort()).toEqual([
      "awesome-blow",
      "craft-construct",
      "empower-spell-like-ability",
      "improved-natural-armor",
      "improved-natural-attack",
    ]);

    const monsterManualIIFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Monster Manual II",
    );
    expect(monsterManualIIFeats.map((feat) => feat.id).sort()).toEqual([
      "ability-focus",
      "flyby-attack",
      "hover",
      "multiattack",
      "multiweapon-fighting",
      "quicken-spell-like-ability",
      "snatch",
      "wingover",
    ]);

    const monsterManualIVFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Monster Manual IV",
    );
    expect(monsterManualIVFeats.map((feat) => feat.id).sort()).toEqual([
      "githyanki-battlecaster",
      "githyanki-dragonrider",
    ]);
    const draconomiconFeats = featCatalog.filter(
      (feat) => feat.sourceBook === "Draconomicon (3.5)",
    );
    expect(draconomiconFeats.map((feat) => feat.id).sort()).toEqual([
      "clinging-breath",
      "lingering-breath",
    ]);
  });

  it("enforces Monster Manual monster-feat prerequisites", () => {
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing monster feat: ${id}.`);
      return feat;
    };
    const slot = (characterLevel: number) => ({
      fighterOnly: false,
      characterLevel,
    });

    const constructCrafter = cloneCharacter(initialCharacter);
    constructCrafter.classLevels = [{ classId: "wizard", level: 9 }];
    constructCrafter.featSelections = {
      "general-1": "craft-magic-arms-and-armor",
      "general-3": "craft-wondrous-item",
    };
    const craftConstruct = featById("craft-construct");
    expect(
      featQualifies(constructCrafter, craftConstruct, slot(6)),
    ).toBe(true);

    const githyankiCaster = cloneCharacter(initialCharacter);
    githyankiCaster.classLevels = [
      { classId: "fighter", level: 1 },
      { classId: "wizard", level: 4 },
    ];
    githyankiCaster.race = "Githyanki";
    githyankiCaster.abilities = {
      ...githyankiCaster.abilities,
      int: 14,
    };
    expect(
      featQualifies(
        githyankiCaster,
        featById("githyanki-battlecaster"),
        slot(5),
      ),
    ).toBe(true);

    const githyankiRider = cloneCharacter(initialCharacter);
    githyankiRider.classLevels = [{ classId: "fighter", level: 5 }];
    githyankiRider.race = "Githyanki";
    githyankiRider.skills = { Ride: 5 };
    expect(
      featQualifies(
        githyankiRider,
        featById("githyanki-dragonrider"),
        slot(3),
      ),
    ).toBe(true);

    const chargeFighter = cloneCharacter(initialCharacter);
    expect(
      featQualifies(
        chargeFighter,
        featById("powerful-charge"),
        slot(1),
      ),
    ).toBe(true);

    const breathWeaponUser = cloneCharacter(initialCharacter);
    breathWeaponUser.abilities = {
      ...breathWeaponUser.abilities,
      con: 13,
    };
    const clingingBreath = featById("clinging-breath");
    expect(
      featQualifies(breathWeaponUser, clingingBreath, slot(1)),
    ).toBe(false);
    breathWeaponUser.hasRechargeableBreathWeapon = true;
    expect(
      featQualifies(breathWeaponUser, clingingBreath, slot(1)),
    ).toBe(true);

    const lingeringBreathUser = cloneCharacter(initialCharacter);
    lingeringBreathUser.classLevels = [{ classId: "fighter", level: 3 }];
    lingeringBreathUser.abilities = {
      ...lingeringBreathUser.abilities,
      con: 15,
    };
    lingeringBreathUser.hasRechargeableBreathWeapon = true;
    const lingeringBreath = featById("lingering-breath");
    expect(
      featQualifies(lingeringBreathUser, lingeringBreath, slot(3)),
    ).toBe(false);
    lingeringBreathUser.featSelections = {
      "general-1": "clinging-breath",
    };
    expect(
      featQualifies(lingeringBreathUser, lingeringBreath, slot(3)),
    ).toBe(true);
  });

  it("attributes supplemental feats to Complete Arcane", () => {
    const completeArcaneFeats = featCatalog
      .filter((feat) => feat.sourceBook === "Complete Arcane (3.5)")
      .map((feat) => feat.id)
      .sort();
    expect(completeArcaneFeats).toEqual([
      "arcane-defense",
      "arcane-mastery",
      "arcane-preparation",
      "battle-caster",
      "black-lore-of-moil",
      "born-of-the-three-thunders",
      "chain-spell",
      "communicator",
      "cooperative-spell",
      "craft-contingent-spell",
      "delay-spell",
      "double-wand-wielder",
      "draconic-breath",
      "draconic-claw",
      "draconic-flight",
      "draconic-heritage",
      "draconic-legacy",
      "draconic-power",
      "draconic-presence",
      "draconic-resistance",
      "draconic-skin",
      "energy-admixture-acid",
      "energy-admixture-cold",
      "energy-admixture-electricity",
      "energy-admixture-fire",
      "energy-substitution-acid",
      "energy-substitution-cold",
      "energy-substitution-electricity",
      "energy-substitution-fire",
      "explosive-spell",
      "extra-edge",
      "extra-invocation",
      "extra-slot",
      "extra-spell",
      "extra-spell-secret",
      "fortify-spell",
      "guardian-spirit",
      "heighten-spell-like-ability",
      "innate-spell",
      "insightful",
      "lord-of-the-uttercold",
      "mage-slayer",
      "maximize-spell-like-ability",
      "necropolis-born",
      "night-haunt",
      "nonlethal-substitution",
      "obtain-familiar",
      "persistent-spell",
      "pierce-magical-concealment",
      "pierce-magical-protection",
      "ranged-spell-specialization",
      "reckless-wand-wielder",
      "repeat-spell",
      "sanctum-spell",
      "sculpt-spell",
      "soul-of-the-north",
      "spell-hand",
      "split-ray",
      "sudden-empower",
      "sudden-extend",
      "sudden-maximize",
      "sudden-quicken",
      "sudden-silent",
      "sudden-still",
      "sudden-widen",
      "touch-spell-specialization",
      "twin-spell",
      "wandstrike",
    ]);
  });

  it("attributes feats first printed in Complete Divine", () => {
    const completeDivineFeats = featCatalog
      .filter((feat) => feat.sourceBook === "Complete Divine (3.5)")
      .map((feat) => feat.id)
      .sort();
    expect(completeDivineFeats).toEqual([
      "arcane-disciple",
      "augment-healing",
      "boars-ferocity",
      "bonus-domain",
      "cheetahs-speed",
      "consecrate-spell",
      "corrupt-spell",
      "disciple-of-the-sun",
      "divine-metamagic",
      "divine-spell-power",
      "domain-focus",
      "domain-spontaneity",
      "eagles-wings",
      "elemental-healing",
      "elemental-smiting",
      "elephants-hide",
      "empower-turning",
      "epic-devotion",
      "extra-wild-shape",
      "glorious-weapons",
      "grizzlys-claws",
      "holy-strike",
      "improved-smiting",
      "lions-pounce",
      "magical-beast-wild-shape",
      "negative-energy-burst",
      "oaken-resilience",
      "pious-defense",
      "pious-soul",
      "pious-spellsurge",
      "positive-energy-aura",
      "practiced-spellcaster-bard",
      "practiced-spellcaster-beguiler",
      "practiced-spellcaster-cleric",
      "practiced-spellcaster-druid",
      "practiced-spellcaster-duskblade",
      "practiced-spellcaster-favored-soul",
      "practiced-spellcaster-mystic",
      "practiced-spellcaster-paladin",
      "practiced-spellcaster-ranger",
      "practiced-spellcaster-shugenja",
      "practiced-spellcaster-sorcerer",
      "practiced-spellcaster-spirit-shaman",
      "practiced-spellcaster-wizard",
      "profane-boost",
      "quicken-turning",
      "rapid-spell",
      "reach-spell",
      "sacred-boost",
      "sacred-healing",
      "sanctify-relic",
      "serpents-venom",
      "spectral-strike",
      "spell-focus-chaos",
      "spell-focus-evil",
      "spell-focus-good",
      "spell-focus-law",
      "spontaneous-healer",
      "spontaneous-summoner",
      "spontaneous-wounder",
      "swim-like-a-fish",
      "transdimensional-spell",
      "true-believer",
      "undead-mastery",
      "unholy-strike",
      "wolverines-rage",
      "zone-of-animation",
    ]);
  });

  it("checks Monster Manual minimum-size prerequisites against race metadata", () => {
    const snatch = featCatalog.find((feat) => feat.id === "snatch");
    if (!snatch) throw new Error("Missing Snatch feat fixture.");
    const character = cloneCharacter(initialCharacter);
    const slot = { fighterOnly: false, characterLevel: 1 };

    expect(snatch.prerequisites?.hugeOrLarger).toBe(true);
    expect(featQualifies(character, snatch, slot)).toBe(false);
  });

  it("documents the Monster Manual spell-like ability feat limits", () => {
    const empower = featCatalog.find(
      (feat) => feat.id === "empower-spell-like-ability",
    );
    const maximize = featCatalog.find(
      (feat) => feat.id === "maximize-spell-like-ability",
    );
    const quicken = featCatalog.find(
      (feat) => feat.id === "quicken-spell-like-ability",
    );
    if (!empower || !maximize || !quicken)
      throw new Error("Missing spell-like ability feat fixtures.");

    expect(maximize.sourceBook).toBe("Complete Arcane (3.5)");
    expect(empower.description).toContain("floor(caster level / 2) - 2");
    expect(empower.description).toContain("3/day or lower normal limit");
    expect(empower.description).toContain("nonvariable effects are unaffected");
    expect(empower.description).toContain("Saves/opposed checks");
    expect(maximize.description).toContain("floor(caster level / 2) - 2");
    expect(maximize.description).toContain("variable numeric effects");
    expect(maximize.description).toContain("Different SLA per selection");
    expect(quicken.description).toContain("floor(caster level / 2) - 4");
    expect(quicken.description).toContain("casting time ≤1 full round");
    expect(quicken.description).toContain("one per round");
    expect(quicken.description).toContain("swift action");
  });

  it("documents Monster Manual natural-weapon and flight feat details", () => {
    const descriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    expect(descriptions.get("ability-focus")).toContain("do not stack");
    expect(descriptions.get("hover")).toContain("Concentration check");
    expect(descriptions.get("hover")).toContain(
      "60-foot-radius hemispherical cloud",
    );
    expect(descriptions.get("hover")).toContain("snuff small open nonmagical flames");
    expect(descriptions.get("hover")).toContain("20% miss chance");
    expect(descriptions.get("hover")).toContain("50% miss chance");
    expect(descriptions.get("hover")).toContain("cannot be located by sight");
    expect(descriptions.get("improved-natural-attack")).toContain(
      "1d8, 2d6, 3d6, 4d6, 6d6, 8d6, 12d6",
    );
    expect(descriptions.get("improved-natural-attack")).toContain(
      "1d10, 2d8, 3d8, 4d8, 6d8, 8d8, 12d8",
    );
    expect(descriptions.get("multiattack")).toContain("from -5 to -2");
    expect(descriptions.get("multiweapon-fighting")).toContain(
      "one extra attack per extra weapon",
    );
    expect(descriptions.get("snatch")).toContain("at least three sizes smaller");
    expect(descriptions.get("wingover")).toContain("free action");
  });

  it("marks Monster Manual creature prerequisites that need manual verification", () => {
    const manuallyVerifiedFeats = [
      "ability-focus",
      "empower-spell-like-ability",
      "improved-natural-armor",
      "improved-natural-attack",
      "multiattack",
      "multiweapon-fighting",
      "quicken-spell-like-ability",
      "snatch",
    ];
    for (const id of manuallyVerifiedFeats) {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing Monster Manual feat: ${id}.`);
      expect(feat.description).toContain("manual");
    }
  });

  it("enforces Augment Summoning's school choice and Improved Metamagic's modeled prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    const augmentSummoning = featCatalog.find(
      (feat) => feat.id === "augment-summoning",
    );
    const laterLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!augmentSummoning || !laterLevelSlot)
      throw new Error("Missing Augment Summoning fixture.");

    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Conjuration" };
    expect(featQualifies(character, augmentSummoning, laterLevelSlot)).toBe(true);
    character.featSpellSchoolSelections["general-1"] = "Evocation";
    expect(featQualifies(character, augmentSummoning, laterLevelSlot)).toBe(false);

    const improvedMetamagic = featCatalog.find(
      (feat) => feat.id === "improved-metamagic",
    );
    if (!improvedMetamagic)
      throw new Error("Missing Improved Metamagic fixture.");
    character.classLevels = [{ classId: "wizard", level: 27 }];
    character.skills.Spellcraft = 30;
    character.featSelections = {
      "general-1": "empower-spell",
      "general-2": "extend-spell",
      "general-3": "enlarge-spell",
      "general-4": "silent-spell",
    };
    const epicSlot = { fighterOnly: false, characterLevel: 27 };
    expect(featQualifies(character, improvedMetamagic, epicSlot)).toBe(true);
    expect(
      featQualifies(character, improvedMetamagic, {
        ...epicSlot,
        characterLevel: 20,
      }),
    ).toBe(false);
    delete character.featSelections["general-4"];
    expect(featQualifies(character, improvedMetamagic, epicSlot)).toBe(false);
  });

  it("enforces Black Lore of Moil's necromancy focus and caster-level prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 9 }];
    const blackLore = featCatalog.find((feat) => feat.id === "black-lore-of-moil");
    const slot = getFeatSlots(character).find((featSlot) => featSlot.id === "general-9");
    if (!blackLore || !slot) throw new Error("Missing Black Lore of Moil fixture.");

    expect(featQualifies(character, blackLore, slot)).toBe(false);
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };
    expect(featQualifies(character, blackLore, slot)).toBe(false);
    character.featSpellSchoolSelections["general-1"] = "Necromancy";
    expect(featQualifies(character, blackLore, slot)).toBe(true);
    const lowerCasterLevelCharacter = cloneCharacter(character);
    lowerCasterLevelCharacter.classLevels = [{ classId: "wizard", level: 6 }];
    const lowerLevelSlot = getFeatSlots(lowerCasterLevelCharacter).find(
      (featSlot) => featSlot.id === "general-6",
    );
    if (!lowerLevelSlot) throw new Error("Missing lower-level Black Lore slot.");
    expect(featQualifies(lowerCasterLevelCharacter, blackLore, lowerLevelSlot)).toBe(false);
  });

  it("allows Arcane Defense once per Spell Focus school", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    const thirdLevelSlot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-3",
    );
    const sixthLevelSlot = getFeatSlots(character).find(
      (featSlot) => featSlot.id === "general-6",
    );
    if (!thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing Arcane Defense feat slots.");

    expect(
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id),
    ).not.toContain("arcane-defense");
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Abjuration" };
    expect(
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id),
    ).toContain("arcane-defense");

    character.featSelections["general-3"] = "arcane-defense";
    character.featSpellSchoolSelections["general-3"] = "Abjuration";
    character.featSelections["human-1"] = "spell-focus";
    character.featSpellSchoolSelections["human-1"] = "Evocation";
    expect(
      getAvailableFeats(character, sixthLevelSlot).map((feat) => feat.id),
    ).toContain("arcane-defense");
    expect(
      getAvailableFeatSpellSchoolChoices(
        character,
        "general-6",
        "arcane-defense",
      ),
    ).toEqual(["Evocation"]);

    character.featSelections["general-6"] = "arcane-defense";
    character.featSpellSchoolSelections["general-6"] = "Evocation";
    expect(getFeatSpellSchoolSelectionWarnings(character)).toEqual([]);
    expect(
      getAvailableFeatSpellSchoolChoices(character, undefined, "arcane-defense"),
    ).toEqual([]);

    character.featSpellSchoolSelections["general-6"] = "Abjuration";
    expect(getFeatSpellSchoolSelectionWarnings(character)).toContain(
      "Choose a valid school of magic for General feat (level 6).",
    );
    expect(
      normalizeFeatSpellSchoolSelections(
        character,
        character.featSpellSchoolSelections ?? {},
      ),
    ).not.toHaveProperty("general-6");
  });

  it("enforces Complete Arcane energy and spellcasting feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 9 }];
    character.skills["Knowledge (arcana)"] = 5;
    character.skills["Knowledge (nature)"] = 4;
    const slot = { fighterOnly: false, characterLevel: 9 };
    const getFeat = (id: string) => {
      const feat = featCatalog.find((candidate) => candidate.id === id);
      if (!feat) throw new Error(`Missing feat fixture: ${id}`);
      return feat;
    };

    expect(featQualifies(character, getFeat("energy-substitution-acid"), slot)).toBe(false);
    character.featSelections = { "general-1": "empower-spell" };
    expect(getChosenFeats(character)).toContain("empower-spell");
    expect(featQualifies(character, getFeat("energy-substitution-acid"), slot)).toBe(true);
    character.featSelections = {
      "general-1": "empower-spell",
      "general-3": "energy-substitution-acid",
    };
    expect(featQualifies(character, getFeat("energy-admixture-acid"), slot)).toBe(true);
    expect(featQualifies(character, getFeat("energy-admixture-cold"), slot)).toBe(false);
    character.featSelections = {
      "general-1": "empower-spell",
      "general-3": "energy-substitution-electricity",
    };
    expect(featQualifies(character, getFeat("born-of-the-three-thunders"), slot)).toBe(true);
    expect(featQualifies(character, getFeat("lord-of-the-uttercold"), slot)).toBe(false);
    character.skills["Knowledge (the planes)"] = 9;
    expect(featQualifies(character, getFeat("lord-of-the-uttercold"), slot)).toBe(false);
    character.featSelections = {
      "general-1": "empower-spell",
      "general-3": "energy-substitution-cold",
    };
    expect(featQualifies(character, getFeat("lord-of-the-uttercold"), slot)).toBe(true);

    character.classLevels = [{ classId: "cleric", level: 3 }];
    character.skills["Knowledge (arcana)"] = 4;
    expect(featQualifies(character, getFeat("obtain-familiar"), {
      fighterOnly: false,
      characterLevel: 3,
    })).toBe(false);
    character.classLevels = [{ classId: "wizard", level: 2 }];
    expect(featQualifies(character, getFeat("obtain-familiar"), {
      fighterOnly: false,
      characterLevel: 2,
    })).toBe(false);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    expect(featQualifies(character, getFeat("obtain-familiar"), {
      fighterOnly: false,
      characterLevel: 3,
    })).toBe(true);

    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.skills.Spellcraft = 2;
    character.abilities.con = 13;
    expect(featQualifies(character, getFeat("battle-caster"), {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(false);
    character.classLevels = [{ classId: "bard", level: 6 }];
    expect(featQualifies(character, getFeat("battle-caster"), {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    expect(featQualifies(character, getFeat("mage-slayer"), {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);
    character.featSelections = {
      "general-1": "mage-slayer",
      "general-2": "blind-fight",
    };
    expect(featQualifies(character, getFeat("pierce-magical-concealment"), {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);
    expect(featQualifies(character, getFeat("pierce-magical-protection"), {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);

    character.skills["Use Magic Device"] = 1;
    expect(featQualifies(character, getFeat("reckless-wand-wielder"), slot)).toBe(false);
    character.featSelections = { "general-1": "craft-wand" };
    expect(featQualifies(character, getFeat("reckless-wand-wielder"), slot)).toBe(true);
  });

  it("allows Innate Spell to be selected again for a different spell", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 12 }];
    character.featSelections = {
      "general-1": "quicken-spell",
      "general-3": "silent-spell",
      "general-6": "still-spell",
      "general-9": "innate-spell",
    };
    const twelfthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-12",
    );
    if (!twelfthLevelSlot) throw new Error("Missing 12th-level feat slot.");

    expect(
      getAvailableFeats(character, twelfthLevelSlot).map((feat) => feat.id),
    ).toContain("innate-spell");
  });

  it("allows Extra Slot and Extra Spell to be selected multiple times", () => {
    const extraSlot = featCatalog.find((feat) => feat.id === "extra-slot");
    const extraSpell = featCatalog.find((feat) => feat.id === "extra-spell");
    if (!extraSlot || !extraSpell) throw new Error("Missing Complete Arcane feats.");
    expect(extraSlot).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { casterLevel: 4 },
    });
    expect(extraSlot.description).toContain(
      "up to one level below your highest spell level",
    );
    expect(extraSpell).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { casterLevel: 3 },
    });
    expect(extraSpell.description).toContain(
      "Learn one spell up to one level below your highest spell level",
    );
    expect(extraSpell.description).toContain("track class and spell manually");

    const thirdLevelWizard = cloneCharacter(initialCharacter);
    thirdLevelWizard.classLevels = [{ classId: "wizard", level: 3 }];
    const thirdLevelSlot = { fighterOnly: false, characterLevel: 3 };
    expect(featQualifies(thirdLevelWizard, extraSlot, thirdLevelSlot)).toBe(false);
    expect(featQualifies(thirdLevelWizard, extraSpell, thirdLevelSlot)).toBe(true);

    const secondLevelWizard = cloneCharacter(initialCharacter);
    secondLevelWizard.classLevels = [{ classId: "wizard", level: 2 }];
    expect(
      featQualifies(secondLevelWizard, extraSpell, {
        fighterOnly: false,
        characterLevel: 2,
      }),
    ).toBe(false);

    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.featSelections = {
    "general-1": "extra-spell",
    "general-3": "extra-slot",
    };
    const sixthLevelSlot = getFeatSlots(character).find(
    (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot) throw new Error("Missing 6th-level feat slot.");

    const availableFeatIds = getAvailableFeats(character, sixthLevelSlot).map(
    (feat) => feat.id,
    );
    expect(availableFeatIds).toContain("extra-slot");
    expect(availableFeatIds).toContain("extra-spell");
  });

  it("limits Arcane Preparation to modeled spontaneous arcane casters", () => {
    const feat = featCatalog.find((candidate) => candidate.id === "arcane-preparation");
    if (!feat) throw new Error("Missing Arcane Preparation fixture.");
    expect(feat).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      prerequisites: { anyClassLevels: { bard: 1, sorcerer: 1 } },
    });
    expect(feat.description).toContain("Prepare known spells in daily slots");
    expect(feat.description).toContain("for metamagic without longer casting time");
    const slot = { fighterOnly: false, characterLevel: 1 };

    for (const classId of ["bard", "sorcerer"] as const) {
      const character = cloneCharacter(initialCharacter);
      character.classLevels = [{ classId, level: 1 }];
      expect(featQualifies(character, feat, slot)).toBe(true);
    }

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 1 }];
    expect(featQualifies(wizard, feat, slot)).toBe(false);
  });

  it("allows Arcane Mastery for modeled arcane spells or racial SLAs", () => {
    const feat = featCatalog.find((candidate) => candidate.id === "arcane-mastery");
    if (!feat) throw new Error("Missing Arcane Mastery fixture.");
    expect(feat).toMatchObject({
      sourceBook: "Complete Arcane (3.5)",
      description: expect.stringContaining("Take 10 on caster level checks"),
      prerequisites: { arcaneSpellcastingOrRacialSpellLikeAbility: true },
    });
    const slot = { fighterOnly: false, characterLevel: 1 };

    const wizard = cloneCharacter(initialCharacter);
    wizard.classLevels = [{ classId: "wizard", level: 1 }];
    expect(featQualifies(wizard, feat, slot)).toBe(true);

    wizard.abilities.int = 9;
    expect(featQualifies(wizard, feat, slot)).toBe(false);

    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    gnome.classLevels = [];
    expect(featQualifies(gnome, feat, slot)).toBe(true);

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 1 }];
    expect(featQualifies(fighter, feat, slot)).toBe(false);
  });

  it("requires the matching spell Weapon Focus and caster level for specialization feats", () => {
    const ranged = featCatalog.find(
      (candidate) => candidate.id === "ranged-spell-specialization",
    );
    const touch = featCatalog.find(
      (candidate) => candidate.id === "touch-spell-specialization",
    );
    if (!ranged || !touch) throw new Error("Missing spell specialization fixtures.");

    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": "Ray" };
    const slot = getFeatSlots(character).find(
      (candidate) => candidate.id === "general-6",
    );
    if (!slot) throw new Error("Missing 6th-level feat slot.");

    expect(featQualifies(character, ranged, slot)).toBe(true);
    expect(featQualifies(character, touch, slot)).toBe(false);

    character.featWeaponSelections["general-1"] = "Touch spell";
    expect(featQualifies(character, ranged, slot)).toBe(false);
    expect(featQualifies(character, touch, slot)).toBe(true);

    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "fighter", level: 3 },
    ];
    expect(featQualifies(character, touch, slot)).toBe(false);
  });

  it("checks Heighten Spell-Like Ability against modeled racial caster levels", () => {
    const feat = featCatalog.find(
      (candidate) => candidate.id === "heighten-spell-like-ability",
    );
    if (!feat) throw new Error("Missing Heighten Spell-Like Ability fixture.");

    const irda = cloneCharacter(initialCharacter);
    irda.ruleset = "dragonlance-monster-classes";
    irda.race = "Irda";
    irda.classLevels = [{ classId: "wizard", level: 5 }];
    expect(featQualifies(irda, feat, {
      fighterOnly: false,
      characterLevel: 5,
    })).toBe(false);

    irda.classLevels = [{ classId: "wizard", level: 6 }];
    expect(featQualifies(irda, feat, {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);

    irda.classLevels = [{ classId: "wizard", level: 9 }];
    irda.featSelections = { "general-6": "heighten-spell-like-ability" };
    const ninthLevelSlot = getFeatSlots(irda).find(
      (slot) => slot.id === "general-9",
    );
    if (!ninthLevelSlot) throw new Error("Missing 9th-level feat slot.");
    expect(
      getAvailableFeats(irda, ninthLevelSlot).map((candidate) => candidate.id),
    ).toContain("heighten-spell-like-ability");

    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    gnome.classLevels = [{ classId: "wizard", level: 20 }];
    expect(featQualifies(gnome, feat, {
      fighterOnly: false,
      characterLevel: 20,
    })).toBe(false);
  });

  it("checks Maximize Spell-Like Ability against modeled racial SLAs and permits repeat selections", () => {
    const feat = featCatalog.find(
      (candidate) => candidate.id === "maximize-spell-like-ability",
    );
    if (!feat) throw new Error("Missing Maximize Spell-Like Ability fixture.");

    const irda = cloneCharacter(initialCharacter);
    irda.ruleset = "dragonlance-monster-classes";
    irda.race = "Irda";
    irda.classLevels = [{ classId: "wizard", level: 5 }];
    expect(featQualifies(irda, feat, {
      fighterOnly: false,
      characterLevel: 5,
    })).toBe(false);

    irda.classLevels = [{ classId: "wizard", level: 6 }];
    expect(featQualifies(irda, feat, {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);

    irda.classLevels = [{ classId: "wizard", level: 9 }];
    irda.featSelections = { "general-6": "maximize-spell-like-ability" };
    const ninthLevelSlot = getFeatSlots(irda).find(
      (slot) => slot.id === "general-9",
    );
    if (!ninthLevelSlot) throw new Error("Missing 9th-level feat slot.");
    expect(
      getAvailableFeats(irda, ninthLevelSlot).map((candidate) => candidate.id),
    ).toContain("maximize-spell-like-ability");
  });

  it("checks Empower and Quicken Spell-Like Ability caster-level prerequisites", () => {
    const empower = featCatalog.find(
      (feat) => feat.id === "empower-spell-like-ability",
    );
    const quicken = featCatalog.find(
      (feat) => feat.id === "quicken-spell-like-ability",
    );
    if (!empower || !quicken)
      throw new Error("Missing Monster Manual SLA feat fixtures.");

    const irda = cloneCharacter(initialCharacter);
    irda.ruleset = "dragonlance-monster-classes";
    irda.race = "Irda";
    irda.classLevels = [{ classId: "wizard", level: 5 }];
    expect(featQualifies(irda, empower, {
      fighterOnly: false,
      characterLevel: 5,
    })).toBe(false);
    expect(featQualifies(irda, quicken, {
      fighterOnly: false,
      characterLevel: 9,
    })).toBe(false);

    irda.classLevels = [{ classId: "wizard", level: 6 }];
    expect(featQualifies(irda, empower, {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);

    irda.classLevels = [{ classId: "wizard", level: 10 }];
    expect(featQualifies(irda, quicken, {
      fighterOnly: false,
      characterLevel: 10,
    })).toBe(true);
  });

  it("applies Practiced Spellcaster to its chosen class, capped by total Hit Dice", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "cleric", level: 1 },
      { classId: "fighter", level: 2 },
    ];
    character.skills.Spellcraft = 4;
    const feat = featCatalog.find(
      (candidate) => candidate.id === "practiced-spellcaster-wizard",
    );
    if (!feat) throw new Error("Missing Practiced Spellcaster fixture.");
    expect(featQualifies(character, feat, {
      fighterOnly: false,
      characterLevel: 6,
    })).toBe(true);

    const dailySlotsBeforeFeat = getDailySpellSlots(character, "wizard", 3, 1);
    character.featSelections = { "general-1": feat.id };
    expect(getCasterLevel("wizard", 3, character)).toBe(6);
    expect(getDailySpellSlots(character, "wizard", 3, 1)).toBe(
      dailySlotsBeforeFeat,
    );
    expect(getCasterLevel("cleric", 1, character)).toBe(1);
    expect(getCasterLevel("fighter", 2, character)).toBe(0);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "cleric", level: 1 },
      { classId: "fighter", level: 3 },
    ];
    expect(getCasterLevel("wizard", 3, character)).toBe(7);

    const racialCaster = changeRace(
      { ...cloneCharacter(initialCharacter), ruleset: "dragonlance-monster-classes" },
      "Baaz Draconian",
    );
    racialCaster.classLevels = [{ classId: "wizard", level: 1 }];
    racialCaster.skills.Spellcraft = 4;
    expect(getTotalHitDice(racialCaster)).toBe(3);
    expect(getEffectiveCharacterLevel(racialCaster)).toBe(4);
    expect(featQualifies(racialCaster, feat, {
      fighterOnly: false,
      characterLevel: 3,
    })).toBe(true);
    racialCaster.featSelections = { "general-3": feat.id };
    expect(getCasterLevel("wizard", 1, racialCaster)).toBe(3);

    character.classLevels = [{ classId: "cleric", level: 1 }];
    expect(getCasterLevel("wizard", 1, character)).toBe(0);
  });

  it.each([
    "mage-slayer",
    "pierce-magical-concealment",
    "pierce-magical-protection",
  ])("reduces class and racial SLA caster levels for %s", (featId) => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Gnome";
    character.abilities.cha = 14;
    character.abilities.con = 13;
    character.skills.Spellcraft = 2;
    character.classLevels = [
      { classId: "wizard", level: 5 },
      { classId: "fighter", level: 3 },
    ];
    character.featSelections = featId === "mage-slayer"
      ? { "general-1": "mage-slayer" }
      : featId === "pierce-magical-concealment"
        ? {
            "general-1": "blind-fight",
            "general-3": "mage-slayer",
            "general-6": featId,
          }
        : {
            "general-1": "mage-slayer",
            "general-3": featId,
          };

    expect(getCasterLevel("wizard", 5, character))
      .toBe(featId === "mage-slayer" ? 1 : 0);
    expect(
      getRacialSpellLikeAbilities(character).map(({ casterLevel }) =>
        casterLevel,
      ),
    ).toEqual([0, 0, 0, 0]);
  });

  it("applies Mage Slayer after Practiced Spellcaster across classes", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "cleric", level: 1 },
      { classId: "fighter", level: 2 },
    ];
    character.skills.Spellcraft = 4;
    character.featSelections = {
      "general-1": "practiced-spellcaster-wizard",
      "general-3": "mage-slayer",
    };

    expect(getCasterLevel("wizard", 3, character)).toBe(2);
    expect(getCasterLevel("cleric", 1, character)).toBe(0);
  });

  it("allows Practiced Spellcaster once per chosen spellcasting class", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "cleric", level: 3 },
    ];
    character.skills.Spellcraft = 4;
    const wizardFeat = featCatalog.find(
      (feat) => feat.id === "practiced-spellcaster-wizard",
    );
    const clericFeat = featCatalog.find(
      (feat) => feat.id === "practiced-spellcaster-cleric",
    );
    if (!wizardFeat || !clericFeat)
      throw new Error("Missing Practiced Spellcaster class variants.");

    character.featSelections = { "general-1": wizardFeat.id };
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot) throw new Error("Missing 6th-level feat slot.");
    const availableFeatIds = getAvailableFeats(character, sixthLevelSlot).map(
      (feat) => feat.id,
    );
    expect(availableFeatIds).not.toContain(wizardFeat.id);
    expect(availableFeatIds).toContain(clericFeat.id);

    character.featSelections["general-3"] = clericFeat.id;
    expect(getCasterLevel("wizard", 3, character)).toBe(6);
    expect(getCasterLevel("cleric", 3, character)).toBe(6);
  });

  it("checks epic spellcasting, familiar, favored-enemy, and repeatability prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "bard", level: 21 }];
    character.abilities.cha = 20;
    const spellKnowledge = featCatalog.find(
      (feat) => feat.id === "spell-knowledge",
    );
    if (!spellKnowledge) throw new Error("Missing Spell Knowledge fixture.");
    expect(
      featQualifies(character, spellKnowledge, {
        fighterOnly: false,
        characterLevel: 21,
      }),
    ).toBe(true);

    const improvedSpellCapacity = featCatalog.find(
      (feat) => feat.id === "improved-spell-capacity",
    );
    if (!improvedSpellCapacity)
      throw new Error("Missing Improved Spell Capacity fixture.");
    const epicSlot = { fighterOnly: false, characterLevel: 21 };
    character.classLevels = [{ classId: "fighter", level: 21 }];
    expect(
      featQualifies(character, improvedSpellCapacity, epicSlot),
    ).toBe(false);
    character.classLevels = [{ classId: "cleric", level: 21 }];
    character.abilities.wis = 19;
    expect(
      featQualifies(character, improvedSpellCapacity, epicSlot),
    ).toBe(true);
    character.abilities.wis = 18;
    expect(
      featQualifies(character, improvedSpellCapacity, epicSlot),
    ).toBe(false);
    expect(featQualifies(character, spellKnowledge, epicSlot)).toBe(false);

    const familiarSpell = featCatalog.find(
      (feat) => feat.id === "familiar-spell",
    );
    if (!familiarSpell) throw new Error("Missing Familiar Spell fixture.");
    character.classLevels = [{ classId: "sorcerer", level: 21 }];
    character.abilities.cha = 24;
    expect(featQualifies(character, familiarSpell, epicSlot)).toBe(false);
    character.abilities.cha = 25;
    expect(featQualifies(character, familiarSpell, epicSlot)).toBe(true);
    character.classLevels = [{ classId: "wizard", level: 21 }];
    character.abilities.int = 25;
    expect(featQualifies(character, familiarSpell, epicSlot)).toBe(true);
    character.classLevels = [{ classId: "cleric", level: 21 }];
    expect(featQualifies(character, familiarSpell, epicSlot)).toBe(false);

    character.classLevels = [{ classId: "ranger", level: 21 }];
    const favoredEnemyLevels = [1, 5, 10, 15, 20] as const;
    character.rangerFavoredEnemies = favoredEnemyLevels.map((classLevel) => ({
      classLevel,
      kind: "creature",
      target: `enemy-${classLevel}`,
      bonusTargetLevel: classLevel,
    }));
    const improvedFavoredEnemy = featCatalog.find(
      (feat) => feat.id === "improved-favored-enemy",
    );
    if (!improvedFavoredEnemy)
      throw new Error("Missing Improved Favored Enemy fixture.");
    expect(featQualifies(character, improvedFavoredEnemy, epicSlot)).toBe(true);
    character.rangerFavoredEnemies.pop();
    expect(featQualifies(character, improvedFavoredEnemy, epicSlot)).toBe(false);

    character.classLevels = [{ classId: "paladin", level: 24 }];
    character.abilities.cha = 25;
    character.featSelections = { "general-21": "great-smiting" };
    const laterEpicSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-24",
    );
    const greatSmiting = featCatalog.find((feat) => feat.id === "great-smiting");
    if (!laterEpicSlot || !greatSmiting)
      throw new Error("Missing repeatable epic feat fixture.");
    expect(getAvailableFeats(character, laterEpicSlot)).toContainEqual(
      greatSmiting,
    );
  });

  it("enforces source-specific prerequisites for epic feats", () => {
    const epicSlot = { fighterOnly: false, characterLevel: 21 };
    const featById = (id: string) => {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing epic feat fixture: ${id}.`);
      return feat;
    };

    const fighter = cloneCharacter(initialCharacter);
    fighter.classLevels = [{ classId: "fighter", level: 21 }];
    fighter.abilities.cha = 25;
    fighter.abilities.wis = 25;
    fighter.abilities.str = 23;
    fighter.skills.Intimidate = 25;
    expect(featQualifies(fighter, featById("great-smiting"), epicSlot)).toBe(
      false,
    );
    expect(featQualifies(fighter, featById("planar-turning"), epicSlot)).toBe(
      false,
    );
    expect(
      featQualifies(
        fighter,
        featById("improved-elemental-wild-shape"),
        epicSlot,
      ),
    ).toBe(false);
    expect(
      featQualifies(fighter, featById("improved-sneak-attack"), epicSlot),
    ).toBe(false);
    expect(
      featQualifies(fighter, featById("terrifying-rage"), epicSlot),
    ).toBe(false);

    const paladin = cloneCharacter(initialCharacter);
    paladin.classLevels = [{ classId: "paladin", level: 21 }];
    paladin.abilities.cha = 25;
    expect(
      featQualifies(paladin, featById("great-smiting"), epicSlot),
    ).toBe(true);

    const destructionCleric = cloneCharacter(initialCharacter);
    destructionCleric.classLevels = [{ classId: "cleric", level: 21 }];
    destructionCleric.alignment = "Lawful Evil";
    destructionCleric.deity = "hextor";
    destructionCleric.clericDomains = ["destruction"];
    destructionCleric.abilities.cha = 25;
    destructionCleric.abilities.wis = 25;
    expect(
      featQualifies(
        destructionCleric,
        featById("great-smiting"),
        epicSlot,
      ),
    ).toBe(true);
    expect(
      featQualifies(
        destructionCleric,
        featById("planar-turning"),
        epicSlot,
      ),
    ).toBe(true);

    const druid = cloneCharacter(initialCharacter);
    druid.classLevels = [
      { classId: "druid", level: 16 },
      { classId: "fighter", level: 5 },
    ];
    druid.abilities.wis = 25;
    expect(
      getClassFeatureDisplay(druid).map(({ ability }) => ability),
    ).toContain("Wild Shape (elemental 1/day, up to Large)");
    expect(
      featQualifies(druid, featById("improved-elemental-wild-shape"), epicSlot),
    ).toBe(true);
    const nonElementalDruid = cloneCharacter(initialCharacter);
    nonElementalDruid.classLevels = [
      { classId: "druid", level: 1 },
      { classId: "fighter", level: 20 },
    ];
    nonElementalDruid.abilities.wis = 25;
    expect(
      featQualifies(
        nonElementalDruid,
        featById("improved-elemental-wild-shape"),
        epicSlot,
      ),
    ).toBe(false);

    const rogue = cloneCharacter(initialCharacter);
    rogue.classLevels = [
      { classId: "rogue", level: 16 },
      { classId: "fighter", level: 5 },
    ];
    expect(
      featQualifies(rogue, featById("improved-sneak-attack"), epicSlot),
    ).toBe(true);

    const lowRage = cloneCharacter(initialCharacter);
    lowRage.classLevels = [
      { classId: "barbarian", level: 12 },
      { classId: "fighter", level: 9 },
    ];
    lowRage.skills.Intimidate = 25;
    expect(
      featQualifies(lowRage, featById("terrifying-rage"), epicSlot),
    ).toBe(false);
    const highRage = cloneCharacter(initialCharacter);
    highRage.classLevels = [
      { classId: "barbarian", level: 16 },
      { classId: "fighter", level: 5 },
    ];
    highRage.skills.Intimidate = 25;
    expect(
      featQualifies(highRage, featById("terrifying-rage"), epicSlot),
    ).toBe(true);

    const bard = cloneCharacter(initialCharacter);
    bard.classLevels = [{ classId: "bard", level: 21 }];
    bard.skills["Perform (act)"] = 25;
    expect(
      featQualifies(bard, featById("lasting-inspiration"), epicSlot),
    ).toBe(true);
    const nonBardSinger = cloneCharacter(initialCharacter);
    nonBardSinger.classLevels = [{ classId: "fighter", level: 21 }];
    nonBardSinger.skills["Perform (act)"] = 25;
    expect(
      featQualifies(
        nonBardSinger,
        featById("lasting-inspiration"),
        epicSlot,
      ),
    ).toBe(false);
    bard.skills["Perform (act)"] = 24;
    expect(
      featQualifies(bard, featById("lasting-inspiration"), epicSlot),
    ).toBe(false);

    fighter.featSelections = {
      "general-1": "cleave",
      "general-3": "great-cleave",
      "fighter-4": "power-attack",
      "fighter-8": "weapon-focus",
      "fighter-12": "improved-critical",
    };
    fighter.featWeaponSelections = {
      "fighter-8": "Longsword",
      "fighter-12": "Longsword",
    };
    const overwhelmingCritical = featById("overwhelming-critical");
    expect(
      featQualifies(fighter, overwhelmingCritical, epicSlot),
    ).toBe(true);
    fighter.featWeaponSelections["fighter-12"] = "Longbow";
    expect(
      featQualifies(fighter, overwhelmingCritical, epicSlot),
    ).toBe(false);
  });
});

describe("Dragonlance feats", () => {
  it("includes the sourcebook's Chapter 3 feats with the correct source", () => {
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

  it("documents Dragonlance feat triggers and resolution details", () => {
    const descriptions = new Map(
      featCatalog.map((feat) => [feat.id, feat.description]),
    );
    expect(descriptions.get("cornered-rat")).toContain(
      "denied its Dexterity bonus to AC",
    );
    expect(descriptions.get("honor-bound")).toContain(
      "breaking a promise or oath",
    );
    expect(descriptions.get("hulking-brute")).toContain(
      "if advantageous to you",
    );
    expect(descriptions.get("hulking-brute")).toContain(
      "special attacks affect you",
    );
    expect(descriptions.get("reserves-of-strength")).toContain(
      "immediately after casting",
    );
    expect(descriptions.get("spectacular-death-throes")).toContain(
      "failed saves also knock creatures prone",
    );
    expect(descriptions.get("spectacular-death-throes")).toContain(
      "each creature within 20 feet to a +10 ranged attack",
    );
    expect(descriptions.get("spectacular-death-throes")).toContain(
      "Fortitude DC 10 + half your HD + Con modifier",
    );
    expect(descriptions.get("strafing-breath")).toContain(
      "a double move using Flyby Breath",
    );
    expect(descriptions.get("spear-of-doom")).toContain(
      "spear or spearlike weapon",
    );
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
    character.flySpeed = 30;
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
    character.flySpeed = 0;
    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(false);
    character.flySpeed = 30;
    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(true);
    expect(
      getAvailableFeats(character, sixthLevelSlot).map((feat) => feat.id),
    ).toContain("flyby-breath");
    expect(featQualifies(character, strafingBreath, ninthLevelSlot)).toBe(false);
    character.featSelections["general-6"] = "flyby-breath";
    expect(featQualifies(character, strafingBreath, ninthLevelSlot)).toBe(true);
    character.flySpeed = 0;
    expect(featQualifies(character, strafingBreath, ninthLevelSlot)).toBe(false);
    character.flySpeed = 30;

    character.race = "Human";
    character.featSelections = { "general-1": "flyby-attack" };
    expect(featQualifies(character, flybyBreath, sixthLevelSlot)).toBe(true);
    expect(flybyBreath.description).toContain("confirm active flight");
    expect(strafingBreath.description).toContain("resolve the area calculation manually");
  });

  it("requires a positive fly speed for Flyby Attack", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    const flybyAttack = featCatalog.find((feat) => feat.id === "flyby-attack");
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!flybyAttack || !sixthLevelSlot)
      throw new Error("Missing Flyby Attack prerequisite fixture.");

    expect(featQualifies(character, flybyAttack, sixthLevelSlot)).toBe(false);
    expect(getAvailableFeats(character, sixthLevelSlot)).not.toContainEqual(flybyAttack);
    character.flySpeed = 30;
    expect(featQualifies(character, flybyAttack, sixthLevelSlot)).toBe(true);
    expect(getAvailableFeats(character, sixthLevelSlot)).toContainEqual(flybyAttack);
    expect(getMovement(character).flySpeed).toBe(30);

    character.flySpeed = 0;
    expect(featQualifies(character, flybyAttack, sixthLevelSlot)).toBe(false);
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

    const laterSpellFocus = {
      ...character,
      featSelections: {
        "general-1": "greater-spell-focus",
        "general-3": "spell-focus",
      },
      featSpellSchoolSelections: {
        "general-1": "Illusion" as const,
        "general-3": "Illusion" as const,
      },
    };
    expect(
      getAvailableFeats(laterSpellFocus, firstLevelSlot, "general-1").map(
        (feat) => feat.id,
      ),
    ).not.toContain("greater-spell-focus");
    expect(
      normalizeFeatSelections(laterSpellFocus, laterSpellFocus.featSelections),
    ).toEqual({ "general-3": "spell-focus" });

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

  it("allows a feat prerequisite selected in another slot at the same character level", () => {
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
    ).toContain("greater-spell-penetration");
    expect(
      normalizeFeatSelections(character, character.featSelections),
    ).toEqual({
      "general-1": "greater-spell-penetration",
      "human-1": "spell-penetration",
    });
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

  it("checks greater weapon feat Fighter levels and prerequisites at the feat slot", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 12 }];
    character.hitPointRolls = Array.from({ length: 12 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 5,
      hpIncrease: 5,
    }));
    character.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
      "fighter-8": "greater-weapon-focus",
    };
    const greaterWeaponFocus = featCatalog.find(
      (feat) => feat.id === "greater-weapon-focus",
    );
    const greaterWeaponSpecialization = featCatalog.find(
      (feat) => feat.id === "greater-weapon-specialization",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    const eighthLevelFighterSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "fighter-8",
    );
    const twelfthLevelFighterSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "fighter-12",
    );
    if (
      !greaterWeaponFocus ||
      !greaterWeaponSpecialization ||
      !sixthLevelSlot ||
      !eighthLevelFighterSlot ||
      !twelfthLevelFighterSlot
    )
      throw new Error("Missing historical Greater Weapon feat fixtures.");

    expect(featQualifies(character, greaterWeaponFocus, sixthLevelSlot)).toBe(
      false,
    );
    expect(
      featQualifies(character, greaterWeaponFocus, eighthLevelFighterSlot),
    ).toBe(true);
    expect(
      featQualifies(
        character,
        greaterWeaponSpecialization,
        eighthLevelFighterSlot,
      ),
    ).toBe(false);
    expect(
      featQualifies(
        character,
        greaterWeaponSpecialization,
        twelfthLevelFighterSlot,
      ),
    ).toBe(true);
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

  it("uses caster level available at the feat slot", () => {
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
    const thirdLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    const sixthLevelSlot = getChronologicalFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!craftWand || !thirdLevelSlot || !sixthLevelSlot)
      throw new Error("Missing historical spell prerequisite fixtures.");

    expect(featQualifies(character, craftWand, thirdLevelSlot)).toBe(false);
    expect(featQualifies(character, craftWand, sixthLevelSlot)).toBe(true);
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
    expect(raceDefinitions.minotaur.traits?.[0])
      .toContain("secondary attack: –5, half Str mod");
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
    expect(raceDefinitions["kapak-draconian"].traits)
      .toContain("Low metabolism: needs one-tenth normal food and water");
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
    expect(getRaceDefinitionForCharacter(qualinesti)?.traits)
      .toContain("Search for secret/concealed doors within 5 ft.");

    const silvanesti = changeRace(dragonlanceCharacter, "Silvanesti Elf");
    expect(silvanesti.abilities).toMatchObject({ str: 10, dex: 12, con: 8, int: 12, cha: 8 });
    expect(getRacialSkillBonus(silvanesti, "Knowledge (arcana)")).toBe(1);
    expect(getRacialSkillBonus(silvanesti, "Spellcraft")).toBe(1);
    expect(getRaceDefinitionForCharacter(silvanesti)?.traits)
      .toContain("Search for secret/concealed doors within 5 ft.");

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
    expect(raceDefinitions["dargonesti-elf"].traits)
      .toContain("Porpoise form 3/day, aquatic environments only; indefinite; no HP restored");
    expect(raceDefinitions["dimernesti-elf"].traits)
      .toContain("Surface sensitivity: –1 attacks/saves/checks after >24h out of water; 1h underwater per 24h mitigates");
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

  it("applies Mage Slayer's Will bonus in addition to Iron Will", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.skills.Spellcraft = 2;
    character.featSelections = {
      "general-1": "iron-will",
      "general-3": "mage-slayer",
    };

    const result = getSavingThrow(character, "will");
    expect(result.total).toBe(getBaseSave(character, "will") + 3);
    expect(result.detail).toContain("feat +3");
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
      prestigeClassId: "white-robed-wizard",
      level: 3,
    });

    expect(getBaseAttackBonus(prestigeCharacter)).toBe(getBaseAttackBonus(baseCharacter));
    for (const save of ["fortitude", "reflex", "will"] as const) {
      expect(getBaseSave(prestigeCharacter, save)).toBe(getBaseSave(baseCharacter, save));
    }
    expect(getAvailableSkillCount(prestigeCharacter)).toBe(getAvailableSkillCount(baseCharacter));
    expect(isClassSkill(prestigeCharacter, "Spellcraft", "white-robed-wizard")).toBe(false);
    expect(isClassSkill(prestigeCharacter, "Spellcraft")).toBe(false);
  });

  it("sums mixed base and Knight of the Thorn progression", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "fighter", level: 2 },
      { classId: "wizard", level: 2 },
      {
        classId: "wizard",
        prestigeClassId: "knight-of-the-thorn",
        level: 2,
      },
    ];

    expect(getBaseAttackBonus(character)).toBe(4);
    expect(getBaseSave(character, "fortitude")).toBe(3);
    expect(getBaseSave(character, "reflex")).toBe(0);
    expect(getBaseSave(character, "will")).toBe(6);
    expect(getAvailableSkillCountForSource(character, "knight-of-the-thorn")).toBe(6);
    expect(isClassSkill(character, "Spellcraft", "knight-of-the-thorn")).toBe(true);
    expect(getSkillMaximum(character, "Spellcraft", "knight-of-the-thorn")).toBe(9);
  });

  it("sums mixed base and Righteous Zealot progression", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "fighter", level: 2 },
      { classId: "wizard", level: 2 },
      {
        classId: "wizard",
        prestigeClassId: "righteous-zealot",
        level: 3,
      },
    ];

    expect(getBaseAttackBonus(character)).toBe(5);
    expect(getBaseSave(character, "fortitude")).toBe(4);
    expect(getBaseSave(character, "reflex")).toBe(1);
    expect(getBaseSave(character, "will")).toBe(6);
    expect(getAvailableSkillCountForSource(character, "righteous-zealot")).toBe(15);
    expect(isClassSkill(character, "Perform", "righteous-zealot")).toBe(true);
    expect(getSkillMaximum(character, "Perform", "righteous-zealot")).toBe(10);
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

  it("checks Arcane Trickster's Mage Hand as a known arcane spell", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 7 }];
    character.abilities.int = 13;
    character.classLevels.push({ classId: "rogue", level: 3 });
    character.skills = { "Decipher Script": 7, "Disable Device": 7, "Escape Artist": 7, "Knowledge (arcana)": 4 };

    withCompletePrestigeProgression("arcane-trickster", () => {
      expect(
        getPrestigeClassEligibilityErrors(character, "arcane-trickster"),
      ).toContain("Ability to cast Mage Hand is required.");

      character.knownSpellsByClass = { wizard: ["Mage Hand"] };
      expect(
        getPrestigeClassEligibilityErrors(character, "arcane-trickster"),
      ).toEqual([]);
    });
  });

  it("counts Loremaster's metamagic and item creation feat categories", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 7 }];
    character.abilities.int = 13;
    character.featSelections = {
      "general-1": "scribe-scroll",
      "general-2": "craft-wand",
    };

    withCompletePrestigeProgression("loremaster", () => {
      expect(
        getPrestigeClassEligibilityErrors(character, "loremaster"),
      ).toContain("Choose 3 distinct feats from the required categories.");

      character.featSelections["general-3"] = "empower-spell";
      expect(
        getPrestigeClassEligibilityErrors(character, "loremaster"),
      ).not.toContain("Choose 3 distinct feats from the required categories.");
    });
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
      isPrestigeClass: true,
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
    expect(secondLevelFeatures.some(({ ability }) => ability === "Fast Movement")).toBe(false);
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

  it("offers Leadership only at character level 6 or later", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 5 }];
    const leadership = featCatalog.find((feat) => feat.id === "leadership");
    if (!leadership) throw new Error("Missing Leadership fixture.");

    expect(featQualifies(character, leadership, { fighterOnly: false })).toBe(false);
    expect(
      featQualifies(character, leadership, {
        fighterOnly: false,
        characterLevel: 5,
      }),
    ).toBe(false);
    expect(
      featQualifies(character, leadership, {
        fighterOnly: false,
        characterLevel: 6,
      }),
    ).toBe(true);

    character.classLevels = [{ classId: "fighter", level: 6 }];
    const sixthLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-6",
    );
    if (!sixthLevelSlot) throw new Error("Missing sixth-level feat slot.");
    expect(getAvailableFeats(character, sixthLevelSlot)).toContainEqual(leadership);
    expect(leadership.description).toContain("Consult the DM before selecting");
    expect(leadership.description).toContain("management remain manual");
  });

  it("offers Mounted Combat after one Ride rank, including as a fighter bonus feat", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    const mountedCombat = featCatalog.find((feat) => feat.id === "mounted-combat");
    if (!mountedCombat) throw new Error("Missing Mounted Combat fixture.");

    const availableIds = (fighterOnly: boolean) =>
      getAvailableFeats(character, { fighterOnly }).map((feat) => feat.id);

    expect(mountedCombat.description).toContain("as a reaction");
    expect(mountedCombat.description).toContain(
      "check result exceeds the opponent's attack roll",
    );
    expect(mountedCombat.prerequisites?.skills).toEqual({ Ride: 1 });
    expect(mountedCombat.fighterBonus).toBe(true);
    expect(featQualifies(character, mountedCombat, { fighterOnly: false })).toBe(false);
    expect(availableIds(false)).not.toContain("mounted-combat");
    expect(availableIds(true)).not.toContain("mounted-combat");

    character.skills.Ride = 1;
    expect(featQualifies(character, mountedCombat, { fighterOnly: false })).toBe(true);
    expect(availableIds(false)).toContain("mounted-combat");
    expect(availableIds(true)).toContain("mounted-combat");
  });

  it("requires Mounted Combat and one Ride rank for Mounted Archery", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    const mountedArchery = featCatalog.find((feat) => feat.id === "mounted-archery");
    if (!mountedArchery) throw new Error("Missing Mounted Archery fixture.");

    const availableIds = (fighterOnly: boolean) =>
      getAvailableFeats(character, { fighterOnly }).map((feat) => feat.id);

    expect(featQualifies(character, mountedArchery, { fighterOnly: false })).toBe(false);
    character.skills.Ride = 1;
    expect(featQualifies(character, mountedArchery, { fighterOnly: false })).toBe(false);
    expect(availableIds(true)).not.toContain("mounted-archery");

    character.featSelections = { "general-1": "mounted-combat" };
    expect(featQualifies(character, mountedArchery, { fighterOnly: false })).toBe(true);
    expect(availableIds(false)).toContain("mounted-archery");
    expect(availableIds(true)).toContain("mounted-archery");
  });

  it("enforces the Ride-By Attack and Spirited Charge prerequisite chain", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }];
    const rideByAttack = featCatalog.find((feat) => feat.id === "ride-by-attack");
    const spiritedCharge = featCatalog.find((feat) => feat.id === "spirited-charge");
    const slots = getFeatSlots(character);
    const thirdLevelGeneral = slots.find((slot) => slot.id === "general-3");
    const secondLevelFighter = slots.find((slot) => slot.id === "fighter-2");
    const fourthLevelFighter = slots.find((slot) => slot.id === "fighter-4");
    if (
      !rideByAttack ||
      !spiritedCharge ||
      !thirdLevelGeneral ||
      !secondLevelFighter ||
      !fourthLevelFighter
    )
      throw new Error("Missing mounted feat progression fixture.");

    const availableIds = (slot: NonNullable<typeof thirdLevelGeneral>) =>
      getAvailableFeats(character, slot, slot.id).map((feat) => feat.id);

    expect(rideByAttack.fighterBonus).toBe(true);
    expect(spiritedCharge.fighterBonus).toBe(true);
    expect(featQualifies(character, rideByAttack, thirdLevelGeneral)).toBe(false);
    expect(featQualifies(character, spiritedCharge, thirdLevelGeneral)).toBe(false);

    character.skills.Ride = 1;
    expect(featQualifies(character, rideByAttack, thirdLevelGeneral)).toBe(false);
    character.featSelections = { "general-1": "mounted-combat" };
    expect(featQualifies(character, rideByAttack, thirdLevelGeneral)).toBe(true);
    expect(availableIds(thirdLevelGeneral)).toContain("ride-by-attack");
    expect(featQualifies(character, spiritedCharge, thirdLevelGeneral)).toBe(false);

    character.featSelections["fighter-2"] = "ride-by-attack";
    expect(featQualifies(character, spiritedCharge, thirdLevelGeneral)).toBe(true);
    expect(availableIds(thirdLevelGeneral)).toContain("spirited-charge");
    expect(featQualifies(character, spiritedCharge, fourthLevelFighter)).toBe(true);
    expect(availableIds(fourthLevelFighter)).toContain("spirited-charge");
  });

  it("requires Mounted Combat and one Ride rank for Trample", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const trample = featCatalog.find((feat) => feat.id === "trample");
    const slots = getFeatSlots(character);
    const thirdLevelGeneral = slots.find((slot) => slot.id === "general-3");
    const secondLevelFighter = slots.find((slot) => slot.id === "fighter-2");
    if (!trample || !thirdLevelGeneral || !secondLevelFighter)
      throw new Error("Missing Trample progression fixture.");

    expect(trample.description).toContain(
      "against any opponent you knock down",
    );
    expect(trample.description).toContain(
      "standard +4 attack bonus against prone targets",
    );
    expect(trample.fighterBonus).toBe(true);
    expect(featQualifies(character, trample, thirdLevelGeneral)).toBe(false);
    character.skills.Ride = 1;
    expect(featQualifies(character, trample, thirdLevelGeneral)).toBe(false);

    character.featSelections = { "general-1": "mounted-combat" };
    expect(featQualifies(character, trample, thirdLevelGeneral)).toBe(true);
    expect(
      getAvailableFeats(character, thirdLevelGeneral, "general-3").map((feat) => feat.id),
    ).toContain("trample");
    expect(
      getAvailableFeats(character, secondLevelFighter, "fighter-2").map((feat) => feat.id),
    ).toContain("trample");
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
    const itemCreationFeatRequirements = [
      { id: "craft-contingent-spell", casterLevel: 11 },
      { id: "scribe-scroll", casterLevel: 1 },
      { id: "brew-potion", casterLevel: 3 },
      { id: "craft-magic-arms-and-armor", casterLevel: 5 },
      { id: "craft-rod", casterLevel: 9 },
      { id: "craft-staff", casterLevel: 12 },
      { id: "craft-wand", casterLevel: 5 },
      { id: "craft-wondrous-item", casterLevel: 3 },
      { id: "forge-ring", casterLevel: 12 },
    ] as const;
    const fighter = cloneCharacter(initialCharacter);
    const wizard = cloneCharacter(initialCharacter);

    for (const { id, casterLevel } of itemCreationFeatRequirements) {
      const feat = featCatalog.find((entry) => entry.id === id);
      if (!feat) throw new Error(`Missing item creation feat fixture: ${id}.`);
      expect(feat.categories).toContain("item-creation");
      expect(featQualifies(fighter, feat, { fighterOnly: false })).toBe(false);

      wizard.classLevels = casterLevel > 1
        ? [{ classId: "wizard", level: casterLevel - 1 }]
        : [];
      expect(featQualifies(wizard, feat, { fighterOnly: false })).toBe(false);
      wizard.classLevels = [{ classId: "wizard", level: casterLevel }];
      expect(featQualifies(wizard, feat, { fighterOnly: false })).toBe(true);
    }

    wizard.ruleset = "dragonlance-user-pack";
    wizard.classLevels = [
      { classId: "wizard", level: 2 },
      {
        classId: "wizard",
        prestigeClassId: "wizard-of-high-sorcery",
        level: 1,
      },
    ];
    const brewPotion = featCatalog.find((feat) => feat.id === "brew-potion");
    if (!brewPotion) throw new Error("Missing Brew Potion fixture.");
    expect(
      featQualifies(wizard, brewPotion, {
        fighterOnly: false,
        characterLevel: 3,
      }),
    ).toBe(true);
  });

  it("describes Scribe Scroll as allowing any spell known", () => {
    const scribeScroll = featCatalog.find((feat) => feat.id === "scribe-scroll");
    if (!scribeScroll) throw new Error("Missing Scribe Scroll fixture.");

    expect(scribeScroll.description).toContain("any spell you know");
    expect(scribeScroll.description).not.toContain("you can cast");
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
    character.abilities.dex = 8;
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
    expect(choicesAtLevel(6)).toContain("two-weapon-pounce");
    expect(choicesAtLevel(11)).toContain("two-weapon-rend");
    expect(choicesAtLevel(11)).not.toContain("improved-precise-shot");

    character.equipment.Armor = "Chainmail";
    expect(choicesAtLevel(6)).not.toContain("two-weapon-pounce");
    expect(choicesAtLevel(11)).not.toContain("two-weapon-rend");
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

  it("requires subtypes for Humanoid and Outsider favored enemies", () => {
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
    expect(classFeatureDescriptions["Turn or Rebuke Undead"]).toContain("Improved Turning");
    expect(classFeatureDescriptions["Turn or Rebuke Undead"]).toContain("Extra Turning adds 4 daily uses");
    expect(classFeatureDescriptions["Turn Undead"]).toContain("Improved Turning");
    expect(classFeatureDescriptions["Turn Undead"]).toContain("Extra Turning adds 4 daily uses");
    expect(prestigeClassFeatureDescriptions["Turn Undead"]).toContain("Improved Turning");
    expect(prestigeClassFeatureDescriptions["Turn Undead"]).toContain("Extra Turning adds 4 daily uses");
    expect(classFeatureDescriptions.Domains).toContain("one separate domain spell slot");
  });

  it("allows rebuke undead to satisfy turning feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "cleric", prestigeClassId: "knight-of-the-skull", level: 5 },
    ];
    character.hitPointRolls = [1, 2, 3].map((level) => ({
      characterLevel: level,
      classId: "cleric",
      prestigeClassId: "knight-of-the-skull",
      classLevel: level,
      hitDie: 8,
      roll: 8,
      hpIncrease: 8,
    }));
    const slot = getFeatSlots(character).find((candidate) => candidate.id === "general-3");
    const extraTurning = featCatalog.find((feat) => feat.id === "extra-turning");
    const improvedTurning = featCatalog.find((feat) => feat.id === "improved-turning");

    expect(slot).toBeDefined();
    expect(extraTurning).toBeDefined();
    expect(improvedTurning).toBeDefined();
    expect(featQualifies(character, extraTurning!, slot!)).toBe(true);
    expect(featQualifies(character, improvedTurning!, slot!)).toBe(true);
  });

  it("allows elemental turning or rebuking to satisfy PHB turning feat prerequisites", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    const extraTurning = featCatalog.find((feat) => feat.id === "extra-turning");
    const improvedTurning = featCatalog.find(
      (feat) => feat.id === "improved-turning",
    );
    if (!extraTurning || !improvedTurning)
      throw new Error("Missing turning feat fixtures.");
    const slot = { fighterOnly: false, characterLevel: 1 };

    character.canTurnElementalSubtype = true;
    expect(featQualifies(character, extraTurning, slot)).toBe(true);
    expect(featQualifies(character, improvedTurning, slot)).toBe(true);

    character.canTurnElementalSubtype = false;
    character.canRebukeElementalSubtype = true;
    expect(featQualifies(character, extraTurning, slot)).toBe(true);
    expect(featQualifies(character, improvedTurning, slot)).toBe(true);

    character.canRebukeElementalSubtype = false;
    expect(featQualifies(character, extraTurning, slot)).toBe(false);
    expect(featQualifies(character, improvedTurning, slot)).toBe(false);
  });

  it("documents the Run feat's armor, load, and defense benefits", () => {
    const run = featCatalog.find((feat) => feat.id === "run");
    expect(run).toBeDefined();
    if (!run) throw new Error("Missing Run feat fixture.");
    expect(run.description).toContain("no more than a medium load");
    expect(run.description).toContain("heavy armor or a heavy load");
    expect(run.description).toContain("Retain your Dexterity bonus to AC");
    expect(run.description).toContain("+4 on Jump checks after a running start");
  });

  it("documents Combat Expertise's action restriction and attack penalty", () => {
    const feat = featCatalog.find((entry) => entry.id === "combat-expertise");
    expect(feat?.description).toContain("attack or full attack action in melee");
    expect(feat?.description).toContain("no greater than your base attack bonus");
    expect(feat?.description).toContain("equal dodge bonus");
  });

  it("documents Combat Casting's spell-like ability coverage", () => {
    const feat = featCatalog.find((entry) => entry.id === "combat-casting");
    expect(feat?.description).toContain("spell-like ability");
    expect(feat?.description).toContain("defensive, grappled, or pinned");
  });

  it("documents Combat Reflexes' additional attacks and flat-footed permission", () => {
    const feat = featCatalog.find((entry) => entry.id === "combat-reflexes");
    expect(feat?.description).toContain(
      "additional attacks of opportunity per round equal to your Dexterity bonus",
    );
    expect(feat?.description).toContain("only one per opportunity");
    expect(feat?.description).toContain(
      "attacks of opportunity while flat-footed",
    );
    expect(feat?.description).toContain(
      "does not allow a rogue to use Opportunist more than once per round",
    );
  });

  it("documents Shot on the Run's action and movement restrictions", () => {
    const feat = featCatalog.find((entry) => entry.id === "shot-on-the-run");
    expect(feat?.description).toContain("attack action with a ranged weapon");
    expect(feat?.description).toContain("move before and after the attack");
    expect(feat?.description).toContain("total movement cannot exceed your speed");
    expect(feat?.description).toContain(
      "Normal movement and ranged attacks can provoke attacks of opportunity",
    );
    expect(feat?.description).not.toContain("wearing heavy armor");
  });

  it("documents Quick Draw and Ride-By Attack's full benefits", () => {
    const quickDraw = featCatalog.find((feat) => feat.id === "quick-draw");
    const rideByAttack = featCatalog.find((feat) => feat.id === "ride-by-attack");
    expect(quickDraw).toBeDefined();
    expect(rideByAttack).toBeDefined();
    if (!quickDraw || !rideByAttack)
      throw new Error("Missing Quick Draw or Ride-By Attack fixture.");

    expect(quickDraw.description).toContain("draw a hidden weapon as a move action");
    expect(quickDraw.description).toContain("full normal rate of attacks");
    expect(rideByAttack.description).toContain(
      "total movement for the round cannot exceed twice your mount's speed",
    );
    expect(rideByAttack.description).toContain("continue straight along the charge path");
    expect(rideByAttack.description).toContain(
      "Neither you nor your mount provokes an attack of opportunity",
    );
  });

  it("documents Dodge and Mobility's shared dodge-bonus restrictions", () => {
    const dodge = featCatalog.find((feat) => feat.id === "dodge");
    const mobility = featCatalog.find((feat) => feat.id === "mobility");
    if (!dodge || !mobility) throw new Error("Missing Dodge or Mobility fixture.");

    expect(dodge.description).toContain("choose a new opponent on any action");
    for (const description of [dodge.description, mobility.description]) {
      expect(description).toContain("lose your Dexterity bonus to AC");
      expect(description).toContain("stacks with other dodge bonuses");
    }
  });

  it("documents the extra attacks and penalties from the two-weapon feats", () => {
    const twoWeaponFighting = featCatalog.find((feat) => feat.id === "two-weapon-fighting");
    const improvedTwoWeaponFighting = featCatalog.find(
      (feat) => feat.id === "improved-two-weapon-fighting",
    );
    const greaterTwoWeaponFighting = featCatalog.find(
      (feat) => feat.id === "greater-two-weapon-fighting",
    );
    if (!twoWeaponFighting || !improvedTwoWeaponFighting || !greaterTwoWeaponFighting)
      throw new Error("Missing two-weapon feat fixtures.");

    expect(twoWeaponFighting.description).toContain("one extra attack per round");
    expect(twoWeaponFighting.description).toContain("primary hand by 2");
    expect(twoWeaponFighting.description).toContain("off hand by 6");
    expect(improvedTwoWeaponFighting.description).toContain("second off-hand attack at a -5 penalty");
    expect(greaterTwoWeaponFighting.description).toContain("third off-hand attack at a -10 penalty");
  });

  it("documents Improved Counterspell's same-school spell-level rule", () => {
    const feat = featCatalog.find((entry) => entry.id === "improved-counterspell");
    expect(feat?.description).toContain("same school");
    expect(feat?.description).toContain("one or more spell levels higher");
    expect(feat?.description).toContain("remains manual");
  });

  it("documents Natural Spell component limits and repeatable Toughness", () => {
    const naturalSpell = featCatalog.find((feat) => feat.id === "natural-spell");
    const toughness = featCatalog.find((feat) => feat.id === "toughness");
    if (!naturalSpell || !toughness)
      throw new Error("Missing Natural Spell or Toughness fixture.");

    expect(naturalSpell.description).toContain("components and focuses you possess");
    expect(toughness.description).toContain("+3 hit points");
    expect(toughness.description).toContain("You can take this feat multiple times");
    expect(toughness.description).toContain("effects stack");
  });

  it("documents Paladin resources and class features", () => {
    expect(classFeatureDescriptions["Lay on Hands"]).toContain("Paladin level × positive Charisma modifier");
    expect(classFeatureDescriptions["Divine Health"]).toContain("immune to all diseases");
    expect(classFeatureDescriptions["Special Mount"]).toContain("2 hours per Paladin level");
    expect(classFeatureDescriptions["Remove Disease (5/week)"]).toContain("five times per week");
  });

  it("documents Druid elemental forms, companion level stacking, and neutral alignment spellcasting", () => {
    expect(classFeatureDescriptions["Wild Shape (1/day)"]).toContain(
      "If you have Natural Spell",
    );
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

  it("counts class-granted feats as prerequisites only from their gain level", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 3 }];
    character.hitPointRolls = Array.from({ length: 3 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "ranger" as const,
      classLevel: index + 1,
      hitDie: 8 as const,
      roll: 4,
      hpIncrease: 4,
    }));
    const firstLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-1",
    );
    const thirdLevelSlot = getFeatSlots(character).find(
      (slot) => slot.id === "general-3",
    );
    if (!firstLevelSlot || !thirdLevelSlot)
      throw new Error("Missing Ranger feat prerequisite slots.");

    expect(
      getAvailableFeats(character, firstLevelSlot).map((feat) => feat.id),
    ).not.toContain("diehard");
    expect(
      normalizeFeatSelections(character, { "general-1": "diehard" }),
    ).toEqual({});

    expect(
      getAvailableFeats(character, thirdLevelSlot).map((feat) => feat.id),
    ).toContain("diehard");
    expect(
      normalizeFeatSelections(character, { "general-3": "diehard" }),
    ).toEqual({ "general-3": "diehard" });
  });

  it("documents Ranger Wild Empathy's range, timing, and magical-beast penalty", () => {
    expect(classFeatureDescriptions["Wild Empathy"]).toContain(
      "within 30 feet under normal visibility",
    );
    expect(classFeatureDescriptions["Wild Empathy"]).toContain(
      "normally takes 1 minute",
    );
    expect(classFeatureDescriptions["Wild Empathy"]).toContain(
      "Intelligence 1–2 at a –4 penalty",
    );
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
    ).map((spell) => ({
      ...spell,
      level: getSpellLevelForClass(spell, "wizard"),
    })));
    expect(getClassSpells("wizard")).toBe(getClassSpells("wizard"));
    expect(getClassSpells("cleric").some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
  });

  it("uses each class's spell level for Complete Divine spells", () => {
    expect(getClassSpells("wizard")).toContainEqual(
      expect.objectContaining({ name: "Bestow Curse, Greater", level: 8 }),
    );
    expect(getClassSpells("cleric")).toContainEqual(
      expect.objectContaining({ name: "Bestow Curse, Greater", level: 7 }),
    );
  });

  it("keeps multiclass spell slots tied to class level", () => {
    expect(baseSpellSlots("wizard", 1, 1)).toBe(1);
    expect(baseSpellSlots("wizard", 3, 2)).toBe(1);
    expect(baseSpellSlots("fighter", 5, 2)).toBe(0);
  });
});
