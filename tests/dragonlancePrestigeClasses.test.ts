import { describe, expect, it } from "vitest";
import {
  beginPrestigeLevelUp,
  cloneCharacter,
  initialCharacter,
} from "../src/domain";
import {
  getCasterLevel,
  getDailySpellSlots,
  getEffectiveSpellcastingClassLevel,
  getKnownSpellLimit,
  getClassFeatureDisplay,
  getPrestigeClassEligibilityErrors,
  getPrestigeClassLevelUpSelectionErrors,
  getPrestigeSpellcastingClassOptions,
  isClassSkill,
} from "../src/rules";

function wizard(level: number) {
  const character = cloneCharacter(initialCharacter);
  character.ruleset = "dragonlance-user-pack";
  character.alignment = "Lawful Good";
  character.abilities.int = 14;
  character.classLevels = [{ classId: "wizard", level }];
  character.skills = { Spellcraft: 7 };
  character.feats = ["Spell Focus", "brew-potion", "scribe-scroll"];
  character.featSelections = { "spell-focus-slot": "spell-focus" };
  character.featSpellSchoolSelections = {
    "spell-focus-slot": "Abjuration",
  };
  return character;
}

describe("Dragonlance prestige-class rules", () => {
  it("applies spellcasting advancement to only the selected base class and correct levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 5 },
      {
        classId: "wizard",
        prestigeClassId: "wizard-of-high-sorcery",
        level: 2,
      },
      { classId: "cleric", level: 3 },
      { classId: "cleric", prestigeClassId: "knight-of-the-skull", level: 2 },
    ];

    expect(getEffectiveSpellcastingClassLevel(character, "wizard")).toBe(7);
    expect(getEffectiveSpellcastingClassLevel(character, "cleric")).toBe(4);
  });

  it("matches the sourcebook spellcasting advancement for all five progressing prestige classes", () => {
    const progressions = [
      { classId: "cleric", prestigeClassId: "knight-of-the-sword", expectedLevel: 5 },
      { classId: "cleric", prestigeClassId: "knight-of-the-rose", expectedLevel: 5 },
      { classId: "cleric", prestigeClassId: "knight-of-the-skull", expectedLevel: 4 },
      { classId: "wizard", prestigeClassId: "knight-of-the-thorn", expectedLevel: 5 },
      { classId: "wizard", prestigeClassId: "wizard-of-high-sorcery", expectedLevel: 5 },
    ] as const;

    for (const progression of progressions) {
      const character = cloneCharacter(initialCharacter);
      character.classLevels = [
        { classId: progression.classId, level: 4 },
        {
          classId: progression.classId,
          prestigeClassId: progression.prestigeClassId,
          level: 1,
        },
      ];

      expect(
        getEffectiveSpellcastingClassLevel(character, progression.classId),
      ).toBe(progression.expectedLevel);
      expect(
        getCasterLevel(progression.classId, 4, character),
      ).toBe(progression.expectedLevel);
    }
  });

  it("applies prestige spellcasting advancement to slots and spells known", () => {
    const cleric = cloneCharacter(initialCharacter);
    cleric.abilities.wis = 16;
    cleric.classLevels = [
      { classId: "cleric", level: 4 },
      { classId: "cleric", prestigeClassId: "knight-of-the-sword", level: 1 },
    ];
    expect(getDailySpellSlots(cleric, "cleric", 4, 3)).toBeGreaterThan(0);

    const wizard = cloneCharacter(initialCharacter);
    wizard.abilities.int = 16;
    wizard.classLevels = [
      { classId: "wizard", level: 4 },
      { classId: "wizard", prestigeClassId: "knight-of-the-thorn", level: 1 },
    ];
    expect(getDailySpellSlots(wizard, "wizard", 4, 3)).toBeGreaterThan(0);

    const sorcerer = cloneCharacter(initialCharacter);
    sorcerer.abilities.cha = 16;
    sorcerer.classLevels = [
      { classId: "sorcerer", level: 5 },
      { classId: "sorcerer", prestigeClassId: "knight-of-the-thorn", level: 1 },
    ];
    expect(getKnownSpellLimit(sorcerer, "sorcerer", 5, 3)).toBeGreaterThan(0);
  });

  it("displays Knight of the Crown features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "fighter", prestigeClassId: "knight-of-the-crown", level },
      ];
      return getClassFeatureDisplay(character);
    };

    expect(featuresAtLevel(1).map(({ ability }) => ability)).toEqual([
      "Strength of Honor (1/day)",
      "Knightly Courage",
    ]);
    expect(featuresAtLevel(4).map(({ ability }) => ability)).toEqual([
      "Strength of Honor (1/day)",
      "Knightly Courage",
      "Heroic Initiative +1",
      "Fight to the Death",
      "Honorable Will",
      "Strength of Honor (2/day)",
    ]);
    expect(featuresAtLevel(7).map(({ ability }) => ability)).toEqual([
      "Strength of Honor (1/day)",
      "Knightly Courage",
      "Heroic Initiative +1",
      "Fight to the Death",
      "Honorable Will",
      "Strength of Honor (2/day)",
      "Heroic Initiative +2",
      "Might of Honor",
      "Armored Mobility",
      "Strength of Honor (3/day)",
    ]);
    const tenthLevelFeatures = featuresAtLevel(10);
    expect(tenthLevelFeatures.map(({ ability }) => ability)).toEqual([
      "Strength of Honor (1/day)",
      "Knightly Courage",
      "Heroic Initiative +1",
      "Fight to the Death",
      "Honorable Will",
      "Strength of Honor (2/day)",
      "Heroic Initiative +2",
      "Might of Honor",
      "Armored Mobility",
      "Strength of Honor (3/day)",
      "Heroic Initiative +3",
      "Aura of Courage",
      "Crown of Knighthood",
      "Strength of Honor (4/day)",
    ]);
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "Crown of Knighthood"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Steel Legionnaire features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "fighter", prestigeClassId: "steel-legionnaire", level },
      ];
      return getClassFeatureDisplay(character);
    };

    expect(featuresAtLevel(1).map(({ ability }) => ability)).toEqual([
      "Legion Knowledge",
      "Favored Enemy (1st)",
    ]);
    expect(featuresAtLevel(2).map(({ ability }) => ability)).toEqual([
      "Legion Knowledge",
      "Favored Enemy (1st)",
      "Reputation",
    ]);
    const thirdLevelFeatures = featuresAtLevel(3);
    expect(thirdLevelFeatures.map(({ ability }) => ability)).toEqual([
      "Legion Knowledge",
      "Favored Enemy (1st)",
      "Reputation",
      "Apprentice",
      "Favored Enemy (2nd)",
    ]);
    expect(
      thirdLevelFeatures.find(({ ability }) => ability === "Legion Knowledge"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Dragon Rider features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "fighter", prestigeClassId: "dragon-rider", level },
      ];
      return getClassFeatureDisplay(character).map(({ ability }) => ability);
    };

    expect(featuresAtLevel(1)).toEqual(["Dragon Cohort", "Mounted Attack"]);
    expect(featuresAtLevel(2)).toEqual([
      "Dragon Cohort",
      "Mounted Attack",
      "Dragon Feat",
    ]);
    expect(featuresAtLevel(3)).toEqual([
      "Dragon Cohort",
      "Mounted Attack",
      "Dragon Feat",
      "Empathic Communication",
    ]);
    expect(featuresAtLevel(4)).toHaveLength(4);
    expect(featuresAtLevel(5)).toHaveLength(5);
    expect(featuresAtLevel(6)).toHaveLength(6);
    expect(featuresAtLevel(6)).toContain("Inspire Fear");
    expect(featuresAtLevel(7)).toHaveLength(7);
    expect(featuresAtLevel(7)).toContain("Directed Attacks");
    expect(featuresAtLevel(8)).toHaveLength(8);
    expect(featuresAtLevel(8)).toContain("Defensive Tactics");
    expect(featuresAtLevel(9)).toHaveLength(9);
    const tenthLevelFeatures = featuresAtLevel(10);
    expect(tenthLevelFeatures).toEqual([
      "Dragon Cohort",
      "Mounted Attack",
      "Dragon Feat",
      "Empathic Communication",
      "Dragon Feat",
      "Inspire Fear",
      "Directed Attacks",
      "Defensive Tactics",
      "Dragon Feat",
      "Defensive Teamwork",
    ]);
    expect(
      tenthLevelFeatures.filter((ability) => ability === "Dragon Feat"),
    ).toHaveLength(3);
    expect(
      getClassFeatureDisplay(character).find(
        ({ ability }) => ability === "Dragon Cohort",
      ),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Inquisitor features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "rogue", prestigeClassId: "inquisitor", level },
      ];
      return getClassFeatureDisplay(character);
    };

    const tenthLevelFeatures = featuresAtLevel(10);
    const featuresByLevel = Array.from({ length: 10 }, (_, index) =>
      tenthLevelFeatures
        .filter(({ source }) => source === `Inquisitor ${index + 1}`)
        .map(({ ability }) => ability),
    );
    expect(featuresByLevel).toEqual([
      ["Extreme Focus", "Trap Sense +1"],
      ["Erudite Synergy"],
      ["Uncanny Dodge"],
      ["Trap Sense +2"],
      ["Erudite Synergy"],
      ["Improved Uncanny Dodge"],
      ["Trap Sense +3"],
      ["Erudite Synergy"],
      [],
      ["Intuitive Logic"],
    ]);
    expect(
      featuresAtLevel(9).map(({ ability }) => ability),
    ).not.toContain("Intuitive Logic");
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "Extreme Focus"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Legendary Tactician features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      {
        classId: "fighter",
        prestigeClassId: "legendary-tactician",
        level: 10,
      },
    ];
    const tenthLevelFeatures = getClassFeatureDisplay(character);
    const featuresByLevel = Array.from({ length: 10 }, (_, index) =>
      tenthLevelFeatures
        .filter(({ source }) => source === `Legendary Tactician ${index + 1}`)
        .map(({ ability }) => ability),
    );

    expect(featuresByLevel).toEqual([
      ["Leadership Bonus +1"],
      ["Inspire Courage +2 (2/day)"],
      ["Direct Troops", "Leadership Bonus +2"],
      ["Rally Troops"],
      ["Hard March", "Leadership Bonus +3", "Inspire Courage +3 (3/day)"],
      ["Rout Enemies"],
      ["Battle Standard", "Leadership Bonus +4"],
      ["Strategic Retreat", "Inspire Courage +4 (4/day)"],
      ["Leadership Bonus +5"],
      ["The Forlorn Hope"],
    ]);
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "Rally Troops"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Righteous Zealot features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      {
        classId: "bard",
        prestigeClassId: "righteous-zealot",
        level: 10,
      },
    ];
    const tenthLevelFeatures = getClassFeatureDisplay(character);
    const featuresByLevel = Array.from({ length: 10 }, (_, index) =>
      tenthLevelFeatures
        .filter(({ source }) => source === `Righteous Zealot ${index + 1}`)
        .map(({ ability }) => ability),
    );

    expect(featuresByLevel).toEqual([
      ["Oration: Enthralling Discourse", "Righteous Indignation (1/day)"],
      ["Oration: Compelling Argument", "Resist Enchantment +1"],
      ["Gather Followers"],
      ["Righteous Indignation (2/day)", "Resist Enchantment +2"],
      ["Oration: Condemning Tirade", "Gather Followers +1"],
      ["Resist Enchantment +3"],
      ["Righteous Indignation (3/day)", "Gather Followers +2"],
      ["Oration: Verbal Obfuscation", "Resist Enchantment +4"],
      ["Gather Followers +3"],
      [
        "Oration: Inflammatory Oratory",
        "Resist Enchantment +5",
        "Martyr’s Luck",
      ],
    ]);
    expect(
      tenthLevelFeatures.find(
        ({ ability }) => ability === "Martyr’s Luck",
      ),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Knight of the Thorn features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "wizard", prestigeClassId: "knight-of-the-thorn", level },
      ];
      return getClassFeatureDisplay(character).map(({ ability }) => ability);
    };

    expect(featuresAtLevel(1)).toEqual(["Diviner", "Read Omens"]);
    expect(featuresAtLevel(5)).toEqual([
      "Diviner",
      "Read Omens",
      "Armored Spellcasting (5%)",
      "Aura of Terror",
      "Weapon Touch",
      "Armored Spellcasting (10%)",
    ]);
    expect(featuresAtLevel(10)).toEqual([
      "Diviner",
      "Read Omens",
      "Armored Spellcasting (5%)",
      "Aura of Terror",
      "Weapon Touch",
      "Armored Spellcasting (10%)",
      "Read Portents",
      "Armored Spellcasting (20%)",
      "Cosmic Understanding",
    ]);
  });

  it("displays Knight of the Skull features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "cleric", prestigeClassId: "knight-of-the-skull", level },
      ];
      return getClassFeatureDisplay(character).map(({ ability }) => ability);
    };

    expect(featuresAtLevel(1)).toEqual([
      "Detect Good",
      "Smite Good (1/day)",
      "Aura of Evil",
    ]);
    expect(featuresAtLevel(5)).toEqual([
      "Detect Good",
      "Smite Good (1/day)",
      "Aura of Evil",
      "Dark Blessing",
      "Discern Lies",
      "Rebuke Undead",
      "Smite Good (2/day)",
    ]);
    expect(featuresAtLevel(10)).toEqual([
      "Detect Good",
      "Smite Good (1/day)",
      "Aura of Evil",
      "Dark Blessing",
      "Discern Lies",
      "Rebuke Undead",
      "Smite Good (2/day)",
      "Favor of the Dark Queen",
      "Smite Good (3/day)",
    ]);
  });

  it("displays Knight of the Rose features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "cleric", prestigeClassId: "knight-of-the-rose", level },
      ];
      return getClassFeatureDisplay(character);
    };

    expect(featuresAtLevel(1).map(({ ability }) => ability)).toEqual([
      "Rallying Cry",
      "Detect Evil",
      "Aura of Good",
    ]);
    const tenthLevelFeatures = featuresAtLevel(10);
    expect(tenthLevelFeatures.map(({ ability }) => ability)).toEqual([
      "Rallying Cry",
      "Detect Evil",
      "Aura of Good",
      "Inspire Courage +2 (2/day)",
      "Leadership Bonus +1",
      "Divine Grace",
      "Inspire Greatness",
      "Turn Undead",
      "Inspire Courage +3 (3/day)",
      "Wisdom of the Measure",
      "Leadership Bonus +2",
      "Inspire Courage +4 (4/day)",
      "Final Stand",
      "Knighthood’s Flower",
    ]);
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "Inspire Greatness"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Knight of the Sword features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "cleric", prestigeClassId: "knight-of-the-sword", level },
      ];
      return getClassFeatureDisplay(character);
    };

    expect(featuresAtLevel(1).map(({ ability }) => ability)).toEqual([
      "Smite Evil (1/day)",
      "Aura of Good",
    ]);
    expect(featuresAtLevel(2).map(({ ability }) => ability)).toEqual([
      "Smite Evil (1/day)",
      "Aura of Good",
      "Turn Undead",
    ]);
    expect(featuresAtLevel(3).map(({ ability }) => ability)).toEqual([
      "Smite Evil (1/day)",
      "Aura of Good",
      "Turn Undead",
      "Aura of Courage",
    ]);
    expect(featuresAtLevel(5).map(({ ability }) => ability)).toContain(
      "Smite Evil (2/day)",
    );
    const tenthLevelFeatures = featuresAtLevel(10);
    expect(tenthLevelFeatures.map(({ ability }) => ability)).toEqual([
      "Smite Evil (1/day)",
      "Aura of Good",
      "Turn Undead",
      "Aura of Courage",
      "Smite Evil (2/day)",
      "Soul of Knighthood",
      "Smite Evil (3/day)",
    ]);
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "Soul of Knighthood"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("displays Knight of the Lily features at their sourcebook levels", () => {
    const character = cloneCharacter(initialCharacter);
    const featuresAtLevel = (level: number) => {
      character.classLevels = [
        { classId: "fighter", prestigeClassId: "knight-of-the-lily", level },
      ];
      return getClassFeatureDisplay(character);
    };

    expect(featuresAtLevel(1).map(({ ability }) => ability)).toEqual([
      "Sneak Attack +1d6",
    ]);
    expect(featuresAtLevel(3).map(({ ability }) => ability)).toEqual([
      "Sneak Attack +1d6",
      "Demoralize",
      "Fight to the Death",
    ]);
    expect(featuresAtLevel(4).map(({ ability }) => ability)).toEqual([
      "Sneak Attack +1d6",
      "Demoralize",
      "Fight to the Death",
      "Sneak Attack +2d6",
      "Unbreakable Will (+2)",
    ]);
    expect(featuresAtLevel(6).map(({ ability }) => ability)).toContain(
      "Armored Mobility",
    );
    expect(featuresAtLevel(7).map(({ ability }) => ability)).toContain(
      "Sneak Attack +3d6",
    );
    expect(featuresAtLevel(8).map(({ ability }) => ability)).toContain(
      "Unbreakable Will (+4)",
    );

    const tenthLevelFeatures = featuresAtLevel(10);
    expect(tenthLevelFeatures.map(({ ability }) => ability)).toEqual([
      "Sneak Attack +1d6",
      "Demoralize",
      "Fight to the Death",
      "Sneak Attack +2d6",
      "Unbreakable Will (+2)",
      "Armored Mobility",
      "Sneak Attack +3d6",
      "Unbreakable Will (+4)",
      "One Thought",
      "Sneak Attack +4d6",
    ]);
    expect(
      tenthLevelFeatures.find(({ ability }) => ability === "One Thought"),
    ).toMatchObject({ isPrestigeClass: true });
  });

  it("limits Wizard of High Sorcery advancement to wizard spellcasting", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "sorcerer", level: 5 },
    ];

    expect(
      getPrestigeSpellcastingClassOptions(character, "wizard-of-high-sorcery"),
    ).toEqual(["wizard"]);
  });

  it("requires Wizard of High Sorcery order-specific specialization and barred schools", () => {
    const character = wizard(7);
    character.highSorceryOrder = "white";
    character.wizardSpecializationSchool = "Abjuration";
    character.wizardBarredSchools = ["Illusion", "Enchantment"];
    expect(getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery")).toEqual([]);

    character.wizardSpecializationSchool = "Enchantment";
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Wizard specialization must be Abjuration or Divination for the white robes.");

    character.wizardSpecializationSchool = "Abjuration";
    character.wizardBarredSchools = ["Abjuration", "Illusion"];
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Both barred schools must be favored by the other robe orders.");

    character.wizardBarredSchools = ["Illusion", "Enchantment"];
    character.featSpellSchoolSelections = {
      "spell-focus-slot": "Enchantment",
    };
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain(
      "Spell Focus cannot be selected in Enchantment, a school favored by another robe order.",
    );
  });

  it("allows High Sorcery choices to be completed during level-up selection", () => {
    const character = wizard(7);

    expect(
      getPrestigeClassLevelUpSelectionErrors(
        character,
        "wizard-of-high-sorcery",
      ),
    ).toEqual([]);
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Choose a robe order before taking Wizard of High Sorcery levels.");
  });

  it("requires all martial weapons for Knight of the Thorn, not one proficiency", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.alignment = "Lawful Evil";
    character.abilities.int = 14;
    character.classLevels = [
      { classId: "monk", level: 5 },
      { classId: "wizard", level: 3 },
    ];
    character.skills = {
      "Knowledge (arcana)": 4,
      "Knowledge (religion)": 4,
      Spellcraft: 8,
    };
    character.featSelections = {
      "heavy-armor": "armor-proficiency-heavy",
      "martial-weapon": "martial-weapon-proficiency",
      metamagic: "extend-spell",
    };

    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-thorn"),
    ).toContain("Martial Weapon Proficiency (all) is required.");
    expect(
      isClassSkill(character, "Knowledge (arcana)", "knight-of-the-thorn"),
    ).toBe(true);

    character.classLevels.push({ classId: "fighter", level: 1 });
    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-thorn"),
    ).toEqual([]);
  });

  it("retains prestige levels in the chosen casting-class association", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "wizard", level: 5 }];

    const draft = beginPrestigeLevelUp(
      character,
      "wizard-of-high-sorcery",
      "wizard",
    );

    expect(draft.proposed.classLevels).toContainEqual({
      classId: "wizard",
      prestigeClassId: "wizard-of-high-sorcery",
      level: 1,
    });
  });
});
