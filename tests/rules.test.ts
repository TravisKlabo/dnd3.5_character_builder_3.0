import { beforeAll, describe, expect, it } from "vitest";
import { abilityModifier, armorClass, beginLevelUp, changeRace, cloneCharacter, raceDefinitions,
  hitPointGain, initialCharacter, levelUpHitPointGain, nextClassLevel, validateLevelUp } from "../src/domain";
import { baseSpellSlots, featQualifies, getBaseAttackBonus, getBaseSave,
  getEquipmentArmorClass, getEquippedWeaponStats, getLevelUpAlignmentWarnings,
  getAvailableBonusLanguages, getClassFeatureDisplay, getClassFeatureSkillSynergy,
  getLanguageBonusSlots,
  getAvailableFeats, getFeatSlots, getLevelUpSkillWarnings, getRacialSkillBonus,
  getDwarfStabilityBonus, getRacialSkillContextOptions, getRacialSpellLikeAbilities, getSkillCheckModifier, getSkillTotalTooltip,
  formatRaceDetails, getImprovedInitiativeBonus, getInitiativeModifier,
  getNewLevelUpFeatSlots, getSavingThrow, getSkillMaximum, getSpentSkillPoints,
  normalizeFeatSelections,
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

  it("validates level-up choices without rolling hit points", () => {
    const draft = beginLevelUp(cloneCharacter(initialCharacter), "fighter");
    expect(validateLevelUp(draft)).toEqual([]);
    draft.proposed.classLevels[0].level = 5;
    expect(validateLevelUp(draft)).toContain("A level-up must add exactly one class level.");
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

  it("applies Dwarf Stability only to grounded bull rush and trip checks", () => {
    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    expect(getDwarfStabilityBonus(dwarf, "bull-rush", true)).toBe(4);
    expect(getDwarfStabilityBonus(dwarf, "trip", true)).toBe(4);
    expect(getDwarfStabilityBonus(dwarf, "bull-rush", false)).toBe(0);
    expect(getDwarfStabilityBonus(dwarf, "trip", false)).toBe(0);
    expect(getDwarfStabilityBonus(dwarf, undefined, true)).toBe(0);
    expect(getDwarfStabilityBonus(cloneCharacter(initialCharacter), "trip", true)).toBe(0);
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
