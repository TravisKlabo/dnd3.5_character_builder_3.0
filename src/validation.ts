import { classDefinitions, deityDefinitions, dragonlancePrestigeClasses, dragonShamanAuras, dragonShamanTotems, isHorizonWalkerTerrainHistory, isRulesetId, magicSchools, raceDefinitions, type Character, type RulesetId } from "./domain";
import { storeCategories, type StoreItem } from "./data/itemTypes";
import { isIndependentSpellcastingClass, type SpellcastingClassId } from "./domain";
import { skillTrickCatalog } from "./data/skillTricks";
import { isClericDomainId } from "./data/clericDomainIds";
import { combatEffectModifierKeys } from "./combatEffects";
import { getHierophantAbilityOptions, loremasterSecrets } from "./domain";
import { dragonDiscipleBonusLevels, dragonDiscipleVarieties } from "./domain";
import { canRepeatHighArcana, highArcanaMinimumSlots, type HighArcanaChoice } from "./domain";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringList = (value: unknown) => Array.isArray(value) && value.every(isString);
const isSpellLevelList = (value: unknown) => Array.isArray(value) &&
  value.every((level) => isNumber(level) && Number.isInteger(level) && level >= 0 && level <= 9);
const isBooleanList = (value: unknown) => Array.isArray(value) &&
  value.every((entry) => typeof entry === "boolean");
const rangerFavoredEnemyLevels = new Set([1, 5, 10, 15, 20]);
const isRangerFavoredEnemyChoice = (value: unknown) =>
  isRecord(value) &&
  isNumber(value.classLevel) && Number.isSafeInteger(value.classLevel) &&
  rangerFavoredEnemyLevels.has(value.classLevel) &&
  (value.kind === "creature" || value.kind === "organization") &&
  isString(value.target) && value.target.length <= 120 &&
  (value.subtype === undefined || (isString(value.subtype) && value.subtype.length <= 80)) &&
  isNumber(value.bonusTargetLevel) && Number.isSafeInteger(value.bonusTargetLevel) &&
  rangerFavoredEnemyLevels.has(value.bonusTargetLevel) &&
  value.bonusTargetLevel <= value.classLevel &&
  (value.classLevel !== 1 || value.bonusTargetLevel === 1);
const isRangerFavoredEnemyList = (value: unknown) =>
  Array.isArray(value) && value.length <= rangerFavoredEnemyLevels.size &&
  value.every(isRangerFavoredEnemyChoice) &&
  new Set(value.map((choice) => isRecord(choice) ? choice.classLevel : undefined)).size === value.length;
const isShieldBlindingUsesByItem = (value: unknown) =>
  isRecord(value) &&
  Object.keys(value).length <= 100 &&
  Object.entries(value).every(([itemName, uses]) =>
    itemName.length > 0 &&
    isNumber(uses) &&
    Number.isSafeInteger(uses) &&
    uses >= 0 &&
    uses <= 2);
const isMap = (value: unknown, check: (entry: unknown) => boolean) =>
  isRecord(value) && Object.values(value).every(check);
const isSkillRankHistory = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    Object.keys(value).length <= 1000 &&
    Object.entries(value).every(([level, ranks]) => {
      const characterLevel = Number(level);
      return Number.isSafeInteger(characterLevel) &&
        characterLevel >= 1 &&
        String(characterLevel) === level &&
        isRecord(ranks) &&
        Object.keys(ranks).length <= 1000 &&
        Object.values(ranks).every((rank) => isNumber(rank) && rank >= 0);
    }));
const skillTrickGrantCategoryByFeat: Record<string, string> = {
  "cool-head": "mental",
  freerunner: "movement",
  "sure-hand": "manipulation",
  "sweet-talker": "interaction",
};
const isSkillTrickHistory = (value: unknown, featSelections: unknown) => {
  if (value === undefined) return true;
  if (!isRecord(value) || Object.keys(value).length > 1000) return false;
  const knownTricks = new Map(
    skillTrickCatalog.map((trick) => [trick.id, trick.category]),
  );
  const learnedTricks = new Set<string>();
  const grantedByFeatSlot = new Map<string, number>();
  return Object.entries(value).every(([level, selections]) => {
    const characterLevel = Number(level);
    if (
      !Number.isSafeInteger(characterLevel) ||
      characterLevel < 1 ||
      String(characterLevel) !== level ||
      !Array.isArray(selections) ||
      selections.length > 1000
    )
      return false;
    let regularTricksAtLevel = 0;
    return selections.every((selection) => {
      if (
        !isRecord(selection) ||
        !isString(selection.trickId) ||
        !knownTricks.has(selection.trickId) ||
        (selection.sourceId === undefined) ===
          (selection.featSlotId === undefined) ||
        learnedTricks.has(selection.trickId)
      )
        return false;
      if (selection.sourceId !== undefined) {
        if (
          !isString(selection.sourceId) ||
          (selection.sourceId !== "racial-hit-dice" &&
            !Object.hasOwn(classDefinitions, selection.sourceId) &&
            !Object.hasOwn(dragonlancePrestigeClasses, selection.sourceId)) ||
          ++regularTricksAtLevel > 1
        )
          return false;
      } else {
        const featSlotId = selection.featSlotId;
        if (
          !isString(featSlotId) ||
          featSlotId.length === 0 ||
          featSlotId.length > 120 ||
          !isRecord(featSelections)
        )
          return false;
        const featId = featSelections[featSlotId];
        if (
          !isString(featId) ||
          skillTrickGrantCategoryByFeat[featId] !==
            knownTricks.get(selection.trickId)
        )
          return false;
        const grantCount =
          (grantedByFeatSlot.get(featSlotId) ?? 0) + 1;
        if (grantCount > 2) return false;
        grantedByFeatSlot.set(featSlotId, grantCount);
      }
      learnedTricks.add(selection.trickId);
      return true;
    });
  });
};
const isBaseAttackBonusHistory = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    Object.keys(value).length <= 1000 &&
    Object.entries(value).every(([level, bonus]) => {
      const characterLevel = Number(level);
      return Number.isSafeInteger(characterLevel) &&
        characterLevel >= 1 &&
        String(characterLevel) === level &&
        isNumber(bonus) &&
        Number.isSafeInteger(bonus) &&
        bonus >= 0;
    }));
const isClassMap = (value: unknown, check: (entry: unknown) => boolean) =>
  isRecord(value) && Object.entries(value).every(([key, entry]) =>
    (Object.hasOwn(classDefinitions, key) || isIndependentSpellcastingClass(key)) && check(entry));
const categories = new Set<string>(storeCategories);
const magicSchoolSet = new Set<string>(magicSchools);
const isMagicSchool = (value: unknown) => isString(value) && magicSchoolSet.has(value);
const moonIds = new Set(["solinari", "lunitari", "nuitari"]);
const moonPhases = new Set([
  "new", "waxing-crescent", "first-quarter", "waxing-gibbous",
  "full", "waning-gibbous", "last-quarter", "waning-crescent",
]);
const moonConjunctions = new Set([
  "none", "solinari-lunitari", "solinari-nuitari", "lunitari-nuitari", "all",
]);

function isDragonlanceMoonState(value: unknown) {
  return isRecord(value) &&
    (value.phases === undefined ||
      (isRecord(value.phases) && Object.entries(value.phases).every(([moon, phase]) =>
        moonIds.has(moon) && isString(phase) && moonPhases.has(phase)))) &&
    (value.conjunction === undefined ||
      (isString(value.conjunction) && moonConjunctions.has(value.conjunction)));
}

function inferLegacyRuleset(value: Record<string, unknown>): RulesetId {
  const raceId = isString(value.race)
    ? value.race.toLowerCase().replaceAll(" ", "-")
    : "";
  const race = raceDefinitions[raceId];
  const deity = isString(value.deity)
    ? deityDefinitions.find((entry) => entry.id === value.deity)
    : undefined;
  const classLevels = Array.isArray(value.classLevels) ? value.classLevels.filter(isRecord) : [];
  const hasDragonlanceClass = classLevels.some((level) =>
    isString(level.classId) && Object.values(classDefinitions).some((definition) =>
      definition.id === level.classId && definition.source === "dragonlance-user-pack",
    ),
  );
  const hasDragonlancePrestigeClass = (
    isString(value.prestigeClass) &&
    Object.values(dragonlancePrestigeClasses).some((definition) =>
      definition.id === value.prestigeClass && definition.source === "dragonlance-user-pack",
    )
  ) || classLevels.some((level) =>
    isString(level.prestigeClassId) &&
    Object.values(dragonlancePrestigeClasses).some((definition) =>
      definition.id === level.prestigeClassId && definition.source === "dragonlance-user-pack",
    ),
  );
  const hasDragonlanceData =
    race?.source === "dragonlance-user-pack" ||
    deity?.source === "dragonlance-user-pack" ||
    hasDragonlanceClass ||
    hasDragonlancePrestigeClass ||
    ["white", "red", "black"].includes(String(value.highSorceryOrder)) ||
    value.mysticDomain !== undefined ||
    value.dragonlanceMoonState !== undefined;
  if (!hasDragonlanceData) return "core-35-srd";
  return race?.source === "dragonlance-user-pack" &&
    (race.levelAdjustment || race.id === "minotaur")
    ? "dragonlance-monster-classes"
    : "dragonlance-user-pack";
}

function isCombatEffect(value: unknown) {
  if (!isRecord(value) || !isString(value.name) || !value.name.trim() || value.name.length > 80 ||
      !(value.remainingRounds === null ||
        (isNumber(value.remainingRounds) && Number.isSafeInteger(value.remainingRounds) && value.remainingRounds > 0)) ||
      !isRecord(value.modifiers) || Object.keys(value.modifiers).length !== combatEffectModifierKeys.length) {
    return false;
  }
  const modifiers = value.modifiers;
  const validAbilityModifiers = value.abilityModifiers === undefined ||
    (isRecord(value.abilityModifiers) &&
      Object.entries(value.abilityModifiers).every(([ability, modifier]) =>
        ["str", "dex", "con", "int", "wis", "cha"].includes(ability) &&
        isNumber(modifier) && Number.isSafeInteger(modifier) && Math.abs(modifier) <= 1000));
  return validAbilityModifiers &&
    (value.expiresTemporaryHitPoints === undefined ||
      typeof value.expiresTemporaryHitPoints === "boolean") &&
    combatEffectModifierKeys.every((key) =>
    isNumber(modifiers[key]) && Number.isSafeInteger(modifiers[key]) && Math.abs(modifiers[key]) <= 1000);
}

export function isCustomStoreItem(value: unknown): value is StoreItem {
  if (!isRecord(value) || value.custom !== true || !isString(value.name) || !value.name.trim() ||
      !isString(value.category) || !categories.has(value.category) ||
      !isNumber(value.price) || value.price < 0 || !isString(value.weight)) return false;
  const stringFields = ["description", "damage", "damageSmall", "damageMedium", "damageLarge",
    "offHandDamage", "offHandDamageSmall", "offHandDamageMedium", "offHandDamageLarge",
    "offHandDamageType", "offHandCritical", "mainEndLabel", "offHandEndLabel",
    "damageType", "critical", "rangeIncrement", "rangeSmall", "rangeMedium", "rangeLarge",
    "reach", "specialProperties", "armorSpeed"];
  const numberFields = ["armorBonus", "maxDexterity", "armorCheckPenalty", "arcaneSpellFailure",
    "shieldBonus", "shieldCheckPenalty", "shieldSpellFailure"];
  const booleanFields = ["finesse", "ranged", "thrown", "towerShieldProficiency", "doubleWeapon"];
  const enums: Record<string, string[]> = {
    proficiency: ["Simple", "Martial", "Exotic"],
    handedness: ["Light", "One-handed", "Two-handed", "Ranged"],
    rangedDamageAbility: ["none", "strength", "strength-penalty-only"],
    material: ["cold-iron", "alchemical-silver", "adamantine"],
    armorCategory: ["Light", "Medium", "Heavy"],
    shieldType: ["Buckler", "Light", "Heavy", "Tower", "Custom"],
  };
  return stringFields.every((key) => value[key] === undefined || isString(value[key])) &&
    numberFields.every((key) => value[key] === undefined || isNumber(value[key])) &&
    booleanFields.every((key) => value[key] === undefined || typeof value[key] === "boolean") &&
    !(value.thrown === true && value.category !== "Weapons") &&
    !(value.ranged === true && value.category !== "Weapons") &&
    !(value.rangedDamageAbility !== undefined && value.category !== "Weapons") &&
    !(value.material !== undefined && !["Weapons", "Ammunition"].includes(String(value.category))) &&
    Object.entries(enums).every(([key, options]) =>
      value[key] === undefined || (isString(value[key]) && options.includes(value[key])));
}

export function parseCustomItems(value: unknown): StoreItem[] {
  if (!Array.isArray(value) || !value.every(isCustomStoreItem)) {
    throw new Error("The custom item catalog contains invalid item data.");
  }
  return value;
}

function isValidTheurgeCastingTargets(entry: Record<string, unknown>) {
  if (entry.prestigeClassId !== "mystic-theurge") return entry.divineSpellcastingClassId === undefined;
  return ["bard", "sorcerer", "wizard"].some((id) => entry.classId === id) &&
    ["cleric", "druid", "mystic", "paladin", "ranger"].some((id) => entry.divineSpellcastingClassId === id);
}

export function assertCharacter(value: unknown): asserts value is Character {
  if (!isRecord(value)) throw new Error("The character must be a JSON object.");
  if (!isRulesetId(value.ruleset)) throw new Error("The character ruleset is invalid.");
  if (!["name", "player", "race", "alignment"].every((key) => isString(value[key]))) {
    throw new Error("Character identity fields must be text.");
  }
  if (!isRecord(value.abilities) ||
      !["str", "dex", "con", "int", "wis", "cha"].every((key) =>
        isRecord(value.abilities) && isNumber(value.abilities[key]))) {
    throw new Error("All six ability scores must be finite numbers.");
  }
  if (!isSkillRankHistory(value.skillRanksByLevel)) {
    throw new Error("Skill rank history must contain nonnegative ranks keyed by whole character levels.");
  }
  if (!isSkillTrickHistory(value.skillTricksByLevel, value.featSelections)) {
    throw new Error("Skill trick history must contain known, nonrepeated tricks at no more than one per character level.");
  }
  if (!isBaseAttackBonusHistory(value.baseAttackBonusByLevel)) {
    throw new Error("Base attack bonus history must contain nonnegative whole bonuses keyed by whole character levels.");
  }
  if (value.abilityScoreIncreasesByLevel !== undefined &&
      (!isRecord(value.abilityScoreIncreasesByLevel) ||
        Object.entries(value.abilityScoreIncreasesByLevel).some(([level, ability]) => {
          const characterLevel = Number(level);
          return !Number.isSafeInteger(characterLevel) ||
            characterLevel < 4 ||
            characterLevel % 4 !== 0 ||
            String(characterLevel) !== level ||
            !["str", "dex", "con", "int", "wis", "cha"].includes(String(ability));
        }))) {
    throw new Error("Ability score increase history must use valid abilities at levels divisible by four.");
  }
  if (!Array.isArray(value.classLevels) || !value.classLevels.length ||
      !value.classLevels.every((entry: unknown) =>
        isRecord(entry) && isString(entry.classId) && Object.hasOwn(classDefinitions, entry.classId) &&
        isNumber(entry.level) && Number.isInteger(entry.level) && entry.level >= 1 &&
        (entry.prestigeClassId === undefined ||
          (isString(entry.prestigeClassId) && Object.hasOwn(dragonlancePrestigeClasses, entry.prestigeClassId))) &&
        isValidTheurgeCastingTargets(entry))) {
    throw new Error("Class levels must use supported classes and positive whole levels.");
  }
  const validHitPointRolls = value.hitPointRolls === undefined ||
    (Array.isArray(value.hitPointRolls) && value.hitPointRolls.length <= 1000 &&
      value.hitPointRolls.every((entry: unknown) =>
        isRecord(entry) && isString(entry.classId) && Object.hasOwn(classDefinitions, entry.classId) &&
          (entry.prestigeClassId === undefined ||
            (isString(entry.prestigeClassId) && Object.hasOwn(dragonlancePrestigeClasses, entry.prestigeClassId))) &&
          isValidTheurgeCastingTargets(entry) &&
          isNumber(entry.characterLevel) && Number.isSafeInteger(entry.characterLevel) && entry.characterLevel >= 1 &&
        isNumber(entry.classLevel) && Number.isSafeInteger(entry.classLevel) && entry.classLevel >= 1 &&
        isNumber(entry.hitDie) && [4, 6, 8, 10, 12].includes(entry.hitDie) &&
        isNumber(entry.roll) && Number.isSafeInteger(entry.roll) && entry.roll >= 1 && entry.roll <= entry.hitDie &&
        isNumber(entry.hpIncrease) && Number.isSafeInteger(entry.hpIncrease) && entry.hpIncrease >= 1));
  if (!validHitPointRolls) {
    throw new Error("Per-level hit point rolls must contain valid Hit Die results and HP increases.");
  }
  const horizonWalkerLevel = value.classLevels.filter((entry) => entry.prestigeClassId === "horizon-walker")
    .reduce((total, entry) => total + entry.level, 0);
  if (!isHorizonWalkerTerrainHistory(
    value.horizonWalkerTerrainMasteries === undefined ? [] : value.horizonWalkerTerrainMasteries,
    horizonWalkerLevel,
  ))
    throw new Error("Horizon Walker terrain history must contain one distinct legal choice per prestige level.");
  const classLevels = value.classLevels as Character["classLevels"];
  const prestigeLevel = (id: string) => classLevels.filter((entry) => "prestigeClassId" in entry && entry.prestigeClassId === id)
    .reduce((total, entry) => total + entry.level, 0);
  const loremasterLevel = prestigeLevel("loremaster");
  const hierophantLevel = prestigeLevel("hierophant");
  const archmageLevel = prestigeLevel("archmage");
  const arcana = value.highArcanaChoices === undefined ? [] : value.highArcanaChoices;
  if (archmageLevel > 5 || !Array.isArray(arcana) || arcana.length !== archmageLevel ||
    arcana.some((choice: unknown, index) => {
      if (choice === null) return false;
      if (!isRecord(choice) || !isString(choice.ability) || !Object.hasOwn(highArcanaMinimumSlots, choice.ability) ||
        !["wizard", "sorcerer"].some((id) => id === choice.classId) ||
        !classLevels.some((entry) => !("prestigeClassId" in entry) && entry.classId === choice.classId) ||
        !isNumber(choice.slot) || !Number.isInteger(choice.slot) || choice.slot > 9)
        return true;
      const ability = choice.ability as HighArcanaChoice["ability"];
      return choice.slot < highArcanaMinimumSlots[ability] || !canRepeatHighArcana(ability, arcana.slice(0, index)) ||
        (ability === "Spell-Like Ability"
          ? !isNumber(choice.reserve) || !Number.isInteger(choice.reserve) || choice.reserve < 0 || choice.reserve > 9 ||
            !isString(choice.spellNote) || !choice.spellNote.trim() || choice.spellNote.length > 200
          : choice.reserve !== undefined || choice.spellNote !== undefined);
    }))
    throw new Error("Archmage history must record a legal High Arcana choice or decline at each level.");
  const redWizardLevel = prestigeLevel("red-wizard");
  const redWizardSpecialist = isMagicSchool(value.redWizardSpecializationSchool)
    ? value.redWizardSpecializationSchool : undefined;
  const redWizardProhibited = Array.isArray(value.redWizardProhibitedSchools)
    ? value.redWizardProhibitedSchools.filter(isMagicSchool) : [];
  const existingWizardSpecialist = value.ruleset === "core-35-srd"
    ? isMagicSchool(value.coreWizardSpecializationSchool) ? value.coreWizardSpecializationSchool : undefined
    : isMagicSchool(value.wizardSpecializationSchool) ? value.wizardSpecializationSchool : undefined;
  const existingWizardBarred = Array.isArray(value.wizardBarredSchools)
    ? value.wizardBarredSchools.filter(isMagicSchool) : [];
  if (redWizardLevel > 10 ||
      (redWizardLevel > 0 &&
        (!redWizardSpecialist ||
          !Array.isArray(value.redWizardProhibitedSchools) ||
          value.redWizardProhibitedSchools.length === 0 ||
          !value.redWizardProhibitedSchools.every(isMagicSchool) ||
          new Set(value.redWizardProhibitedSchools).size !== value.redWizardProhibitedSchools.length ||
          redWizardProhibited.includes(redWizardSpecialist) ||
          redWizardProhibited.some((school) => existingWizardBarred.includes(school)) ||
          (existingWizardSpecialist !== undefined && existingWizardSpecialist !== redWizardSpecialist))) ||
      (redWizardLevel === 0 &&
        (value.redWizardSpecializationSchool !== undefined || value.redWizardProhibitedSchools !== undefined)))
    throw new Error("Red Wizard levels require a valid specialist school and distinct additional prohibited schools.");
  const discipleLevel = prestigeLevel("dragon-disciple");
  const discipleSlots = value.dragonDiscipleBonusSlots === undefined ? [] : value.dragonDiscipleBonusSlots;
  if (discipleLevel > 10 || (discipleLevel > 0
    ? !dragonDiscipleVarieties.some((variety) => variety === value.dragonDiscipleVariety)
    : value.dragonDiscipleVariety !== undefined) ||
    !Array.isArray(discipleSlots) ||
    discipleSlots.length !== dragonDiscipleBonusLevels.filter((milestone) => milestone <= discipleLevel).length ||
    discipleSlots.some((slot: unknown) => !isRecord(slot) || !isNumber(slot.level) ||
      !Number.isInteger(slot.level) || slot.level < 1 || slot.level > 9 ||
      !classLevels.some((entry) => "prestigeClassId" in entry
        ? isIndependentSpellcastingClass(entry.prestigeClassId) && entry.prestigeClassId === slot.classId
        : entry.classId === slot.classId && classDefinitions[entry.classId].spellcasting)))
    throw new Error("Dragon Disciple levels require a valid dragon variety and one recorded spell slot at each bonus milestone.");
  const secrets = value.loremasterSecrets === undefined ? [] : value.loremasterSecrets;
  const languages = value.loremasterLanguages === undefined ? [] : value.loremasterLanguages;
  const abilities = value.hierophantAbilities === undefined ? [] : value.hierophantAbilities;
  if (loremasterLevel > 10 || !Array.isArray(secrets) || secrets.length !== Math.ceil(loremasterLevel / 2) ||
      new Set(secrets).size !== secrets.length || secrets.some((secret) => !loremasterSecrets.includes(secret)))
    throw new Error("Loremaster secret history must contain one distinct secret per odd prestige level.");
  if (!Array.isArray(languages) || languages.length !== Math.floor(loremasterLevel / 4) ||
      new Set(languages).size !== languages.length ||
      languages.some((language) => !isString(language) || !language.trim() || language.length > 120 || language === "Druidic"))
    throw new Error("Loremaster language history must contain one distinct language at levels 4 and 8.");
  if (hierophantLevel > 5 || !Array.isArray(abilities) || abilities.length !== hierophantLevel ||
      abilities.some((ability, index) => !getHierophantAbilityOptions(
        { classLevels }, abilities.slice(0, index),
      ).includes(ability)))
    throw new Error("Hierophant ability history must contain one legal choice per prestige level.");
  if (!isNumber(value.hitPoints) ||
      (value.hasMedallionOfFaith !== undefined &&
        typeof value.hasMedallionOfFaith !== "boolean") ||
      !["feats", "knownSpells", "preparedSpells", "languages"].every((key) => isStringList(value[key])) ||
      !["speakLanguages", "classFeatures", "racialSpellLikeUses"].every((key) =>
        value[key] === undefined || isStringList(value[key])) ||
      (value.alternativeClassFeatures !== undefined &&
        !isMap(value.alternativeClassFeatures, isStringList)) ||
      (value.beguilerAdvancedLearning !== undefined &&
        !isStringList(value.beguilerAdvancedLearning)) ||
      !isMap(value.featSelections, isString) ||
      (value.featWeaponSelections !== undefined && !isMap(value.featWeaponSelections, isString)) ||
      (value.featSkillSelections !== undefined && !isMap(value.featSkillSelections, isString)) ||
      (value.featSpellSchoolSelections !== undefined && !isMap(value.featSpellSchoolSelections, isMagicSchool)) ||
      (value.featSpellMasterySelections !== undefined && !isMap(value.featSpellMasterySelections, isStringList)) ||
      (value.featSpellMasterySelectionCounts !== undefined &&
        !isMap(value.featSpellMasterySelectionCounts, (entry) =>
          typeof entry === "number" && Number.isSafeInteger(entry) && entry >= 0)) ||
      (value.wizardSpecializationSchool !== undefined && !isMagicSchool(value.wizardSpecializationSchool)) ||
      (value.coreWizardSpecializationSchool !== undefined &&
        !isMagicSchool(value.coreWizardSpecializationSchool)) ||
      (value.dragonShamanTotem !== undefined &&
        !dragonShamanTotems.includes(value.dragonShamanTotem as never)) ||
      (value.dragonShamanAuras !== undefined &&
        (!isStringList(value.dragonShamanAuras) ||
          value.dragonShamanAuras.length > dragonShamanAuras.length ||
          new Set(value.dragonShamanAuras).size !== value.dragonShamanAuras.length ||
          value.dragonShamanAuras.some((aura) => !dragonShamanAuras.includes(aura as never)))) ||
      (value.wizardBarredSchools !== undefined &&
        (!Array.isArray(value.wizardBarredSchools) ||
          value.wizardBarredSchools.length > 2 ||
          !value.wizardBarredSchools.every(isMagicSchool))) ||
      !isMap(value.skills, isNumber) ||
      !isMap(value.skillRanksByClass, (entry) => isMap(entry, isNumber)) ||
      !isMap(value.equipment, isString) ||
      !isMap(value.inventory, (entry) => isNumber(entry) && Number.isInteger(entry) && entry >= 0)) {
    throw new Error("Character statistics, selections, or inventory are invalid.");
  }
  const invalidCombatRound = value.combatRound !== undefined &&
    (!isNumber(value.combatRound) || !Number.isSafeInteger(value.combatRound) || value.combatRound < 1);
  const invalidCombatEffects = value.combatEffects !== undefined &&
    (!Array.isArray(value.combatEffects) || value.combatEffects.length > 100 ||
      !value.combatEffects.every(isCombatEffect));
  if (invalidCombatRound || invalidCombatEffects) {
    throw new Error("Combat round and active effect data are invalid.");
  }
  if (value.compositeBowStrengthRatings !== undefined &&
      !isMap(value.compositeBowStrengthRatings, (rating) =>
        isNumber(rating) && Number.isSafeInteger(rating) && rating >= 0)) {
    throw new Error("Composite bow Strength ratings must be nonnegative whole numbers.");
  }
  const optionalStrings = ["age", "height", "weight", "hairColor", "eyeColor", "skinColor",
    "damageReduction", "spellResistance", "notes", "deity", "regionalLanguage"];
  if ((value.currentHitPoints !== undefined &&
      (!isNumber(value.currentHitPoints) || !Number.isSafeInteger(value.currentHitPoints) ||
        value.currentHitPoints > value.hitPoints)) ||
      !["temporaryHitPoints", "nonlethalDamage"].every((key) =>
        value[key] === undefined || (isNumber(value[key]) && Number.isSafeInteger(value[key]) && value[key] >= 0))) {
    throw new Error("Current HP must be a whole number no greater than maximum HP; temporary HP and nonlethal damage must be nonnegative whole numbers.");
  }
  if (!optionalStrings.every((key) => value[key] === undefined || isString(value[key])) ||
      !["temporaryHitPoints", "nonlethalDamage"].every((key) => value[key] === undefined || isNumber(value[key])) ||
      (value.flySpeed !== undefined &&
        (!isNumber(value.flySpeed) || !Number.isSafeInteger(value.flySpeed) || value.flySpeed < 0)) ||
      (value.manifesterLevel !== undefined &&
        (!isNumber(value.manifesterLevel) ||
          !Number.isSafeInteger(value.manifesterLevel) ||
          value.manifesterLevel < 0)) ||
      (value.divineCasterLevel !== undefined &&
        (!isNumber(value.divineCasterLevel) ||
          !Number.isSafeInteger(value.divineCasterLevel) ||
          value.divineCasterLevel < 0)) ||
      (value.clericUndeadTurningMode !== undefined &&
        value.clericUndeadTurningMode !== "turn" &&
        value.clericUndeadTurningMode !== "rebuke") ||
      !["skirmishDamageDice", "skirmishACBonus"].every((key) =>
        value[key] === undefined ||
        (isNumber(value[key]) &&
          Number.isSafeInteger(value[key]) &&
          value[key] >= 0)) ||
      (value.hasPowerPointReserve !== undefined &&
        typeof value.hasPowerPointReserve !== "boolean") ||
      (value.hasKiPower !== undefined && typeof value.hasKiPower !== "boolean") ||
      (value.hasKiStrikeMagic !== undefined &&
        typeof value.hasKiStrikeMagic !== "boolean") ||
      (value.hasAllMartialWeaponProficiencies !== undefined &&
        typeof value.hasAllMartialWeaponProficiencies !== "boolean") ||
      (value.hasStealSpell !== undefined &&
        typeof value.hasStealSpell !== "boolean") ||
      (value.hasSwashbucklerGrace !== undefined &&
        typeof value.hasSwashbucklerGrace !== "boolean") ||
      (value.hasConjurationHealingSpell !== undefined &&
        typeof value.hasConjurationHealingSpell !== "boolean") ||
      (value.hasSpontaneousCureOrInflict !== undefined &&
        typeof value.hasSpontaneousCureOrInflict !== "boolean") ||
      (value.hasCureWoundsSpell !== undefined &&
        typeof value.hasCureWoundsSpell !== "boolean") ||
      (value.hasSummonNaturesAllySpell !== undefined &&
        typeof value.hasSummonNaturesAllySpell !== "boolean") ||
      (value.hasInflictWoundsSpell !== undefined &&
        typeof value.hasInflictWoundsSpell !== "boolean") ||
      (value.canTurnElementalSubtype !== undefined &&
        typeof value.canTurnElementalSubtype !== "boolean") ||
      (value.canRebukeElementalSubtype !== undefined &&
        typeof value.canRebukeElementalSubtype !== "boolean") ||
      (value.hasFastWildShape !== undefined &&
        typeof value.hasFastWildShape !== "boolean") ||
      (value.hasWarmageLevelFour !== undefined &&
        typeof value.hasWarmageLevelFour !== "boolean") ||
      (value.hasGraduatedFromApprenticeship !== undefined &&
        typeof value.hasGraduatedFromApprenticeship !== "boolean") ||
      (value.hasMentorSkillPrerequisites !== undefined &&
        typeof value.hasMentorSkillPrerequisites !== "boolean") ||
      (value.isGuildMember !== undefined &&
        typeof value.isGuildMember !== "boolean") ||
      (value.hasGuildmasterPrerequisites !== undefined &&
        typeof value.hasGuildmasterPrerequisites !== "boolean") ||
      (value.hasCompletedBondingRitual !== undefined &&
        typeof value.hasCompletedBondingRitual !== "boolean") ||
      (value.hasRechargeableBreathWeapon !== undefined &&
        typeof value.hasRechargeableBreathWeapon !== "boolean") ||
      (value.hasDetectMagicAccess !== undefined &&
        typeof value.hasDetectMagicAccess !== "boolean") ||
      (value.isThoonAffiliate !== undefined &&
        typeof value.isThoonAffiliate !== "boolean") ||
      (value.gender !== undefined && !["", "Male", "Female", "Other"].includes(String(value.gender))) ||
      (value.mainWeaponGrip !== undefined && !["one-handed", "two-handed"].includes(String(value.mainWeaponGrip))) ||
      (value.doubleWeaponMode !== undefined && typeof value.doubleWeaponMode !== "boolean") ||
      (value.doubleWeaponPrimaryEnd !== undefined && !["first", "second"].includes(String(value.doubleWeaponPrimaryEnd))) ||
      (value.towerShieldTotalCover !== undefined && typeof value.towerShieldTotalCover !== "boolean") ||
      (value.shieldBashMode !== undefined && typeof value.shieldBashMode !== "boolean") ||
      (value.animatedShieldMode !== undefined && typeof value.animatedShieldMode !== "boolean") ||
      (value.forceShieldActive !== undefined && typeof value.forceShieldActive !== "boolean") ||
      (value.shieldBlindingUsesByItem !== undefined &&
        !isShieldBlindingUsesByItem(value.shieldBlindingUsesByItem)) ||
      (value.highSorceryOrder !== undefined && !["white", "red", "black"].includes(String(value.highSorceryOrder))) ||
      (value.dragonlanceMoonState !== undefined && !isDragonlanceMoonState(value.dragonlanceMoonState)) ||
      (value.rangerFavoredEnemies !== undefined && !isRangerFavoredEnemyList(value.rangerFavoredEnemies)) ||
      (value.prestigeClass !== undefined &&
        (!isString(value.prestigeClass) || !Object.hasOwn(dragonlancePrestigeClasses, value.prestigeClass))) ||
      (value.honorBoundSuspended !== undefined && typeof value.honorBoundSuspended !== "boolean") ||
      (value.knightOfTheCrownState !== undefined &&
        (!isRecord(value.knightOfTheCrownState) ||
          (value.knightOfTheCrownState.strengthOfHonorUsesUsed !== undefined &&
            (!isNumber(value.knightOfTheCrownState.strengthOfHonorUsesUsed) ||
              !Number.isSafeInteger(value.knightOfTheCrownState.strengthOfHonorUsesUsed) ||
              value.knightOfTheCrownState.strengthOfHonorUsesUsed < 0 ||
              value.knightOfTheCrownState.strengthOfHonorUsesUsed > 4)) ||
          (value.knightOfTheCrownState.crownOfKnighthoodUsed !== undefined &&
            typeof value.knightOfTheCrownState.crownOfKnighthoodUsed !== "boolean"))) ||
      (value.knownSpellClasses !== undefined &&
        !isMap(value.knownSpellClasses, (entry) => isString(entry) &&
          (Object.hasOwn(classDefinitions, entry) || isIndependentSpellcastingClass(entry)))) ||
      !["knownSpellsByClass", "preparedSpellsByClass"].every((key) =>
        value[key] === undefined || isClassMap(value[key], isStringList)) ||
      (value.preparedSpellSlotLevelsByClass !== undefined &&
        !isClassMap(value.preparedSpellSlotLevelsByClass, (spells) =>
          isMap(spells, isSpellLevelList))) ||
      !["empowerByClass", "maximizeByClass", "extendByClass", "enlargeByClass", "quickenByClass", "silentByClass", "stillByClass", "widenByClass", "sculptByClass"].every((key) =>
        value[key] === undefined || isClassMap(value[key], (spells) =>
          isMap(spells, isBooleanList))) ||
      (value.spellPreparationCompletedByClass !== undefined &&
        !isClassMap(value.spellPreparationCompletedByClass, (entry) => typeof entry === "boolean")) ||
      (value.expendedSpellSlotsByClass !== undefined &&
        !isClassMap(value.expendedSpellSlotsByClass, (levels) =>
          isRecord(levels) && Object.entries(levels).every(([level, slots]) =>
            /^[0-9]$/.test(level) && Array.isArray(slots) &&
            slots.every((slot) => isNumber(slot) && Number.isInteger(slot) && slot >= 0)))) ||
      (value.wizardSpellLearning !== undefined &&
        !isMap(value.wizardSpellLearning, (entry) => isRecord(entry) &&
          ["scroll", "spellbook", "research", "reward"].includes(String(entry.source)) &&
          isString(entry.learnedAt) && Number.isFinite(Date.parse(entry.learnedAt)) &&
          (entry.decipherMethod === undefined || ["read-magic", "author", "previously-deciphered", "spellcraft", "decipher-script"].includes(String(entry.decipherMethod))) &&
          ["decipherTotal", "spellcraftTotal"].every((key) => entry[key] === undefined || isNumber(entry[key])))) ||
      (value.spellAcquisitionByClass !== undefined &&
        !isClassMap(value.spellAcquisitionByClass, (entry) =>
          isMap(entry, (acquisition) => isString(acquisition) &&
            ["starting", "level-up", "spellbook", "scroll", "research", "reward"].includes(acquisition))))) {
    throw new Error("Optional character details or spell progression data are invalid.");
  }
  if (value.customItems !== undefined) parseCustomItems(value.customItems);
  if ((value.clericDomains !== undefined &&
      (!Array.isArray(value.clericDomains) || value.clericDomains.length > 2 ||
        !value.clericDomains.every(isClericDomainId) ||
        new Set(value.clericDomains).size !== value.clericDomains.length)) ||
      (value.clericDomainPreparation !== undefined &&
        (!isRecord(value.clericDomainPreparation) || !Object.entries(value.clericDomainPreparation).every(([level, entry]) =>
          /^[1-9]$/.test(level) && isRecord(entry) && isClericDomainId(entry.domain) && isString(entry.spell)))) ||
      (value.clericDomainExpended !== undefined &&
        (!Array.isArray(value.clericDomainExpended) || !value.clericDomainExpended.every((level) =>
          isNumber(level) && Number.isInteger(level) && level >= 1 && level <= 9) ||
          new Set(value.clericDomainExpended).size !== value.clericDomainExpended.length)) ||
      (value.mysticDomain !== undefined && !isClericDomainId(value.mysticDomain))) {
    throw new Error("Cleric domains, domain preparation, or expended domain slots are invalid.");
  }
}

const canonicalTrapName = "Leomund’s Trap";
const canonicalizeTrapName = (name: string) => name === "Phantom Trap" ? canonicalTrapName : name;

function migrateTrapSpellRecord<T>(record: Record<string, T> | undefined) {
  if (!record || !Object.hasOwn(record, "Phantom Trap")) return record;
  const { ["Phantom Trap"]: legacy, ...result } = record;
  const previous = result[canonicalTrapName];
  const matches = Object.is(previous, legacy) ||
    (isRecord(previous) && isRecord(legacy) &&
      Object.keys(previous).length === Object.keys(legacy).length &&
      Object.keys(previous).every((key) => Object.is(previous[key], legacy[key])));
  if (
    Object.hasOwn(result, canonicalTrapName) &&
    !matches
  ) {
    throw new Error("Phantom Trap and Leomund’s Trap are the same spell, but their saved acquisition or class ownership records conflict. Reconcile those records before importing.");
  }
  result[canonicalTrapName] = legacy;
  return result;
}

function migrateTrapClassRecords<T>(
  records: Partial<Record<SpellcastingClassId, T>> | undefined,
  migrate: (value: T, classId: string) => T,
) {
  if (!records) return records;
  return Object.fromEntries(Object.entries(records).map(([classId, value]) => [classId, migrate(value, classId)]));
}

function migrateTrapSpellNames(character: Character): Character {
  const hasLegacyName = [
    character.knownSpells, character.preparedSpells,
    ...Object.values(character.knownSpellsByClass ?? {}),
    ...Object.values(character.preparedSpellsByClass ?? {}),
    ...Object.values(character.featSpellMasterySelections ?? {}),
  ].some((names) => names?.includes("Phantom Trap"));
  const hasLegacyKey = [
    character.knownSpellClasses, character.wizardSpellLearning,
    ...Object.values(character.spellAcquisitionByClass ?? {}),
    ...Object.values(character.preparedSpellSlotLevelsByClass ?? {}),
    ...[
      character.empowerByClass, character.maximizeByClass, character.extendByClass,
      character.enlargeByClass, character.quickenByClass, character.silentByClass,
      character.stillByClass, character.widenByClass, character.sculptByClass,
    ].flatMap((classes) => Object.values(classes ?? {})),
  ].some((record) => record && Object.hasOwn(record, "Phantom Trap"));
  if (!hasLegacyName && !hasLegacyKey) return character;
  const known = (names: string[]) => names.includes("Phantom Trap")
    ? [...new Set(names.map(canonicalizeTrapName))] : names;
  const prepared = (names: string[]) => names.map(canonicalizeTrapName);
  const originalPreparations: Record<string, string[] | undefined> = { ...character.preparedSpellsByClass };
  for (const name of character.preparedSpells.filter((spell) => ["Phantom Trap", canonicalTrapName].includes(spell))) {
    const owner = character.knownSpellClasses?.[name] ??
      Object.entries(character.knownSpellsByClass ?? {}).find(([, names]) => names?.includes(name))?.[0] ??
      character.classLevels.find((entry) =>
        (entry.classId === "wizard" || entry.classId === "sorcerer") &&
        !("prestigeClassId" in entry && entry.prestigeClassId),
      )?.classId;
    if (owner && !Object.hasOwn(character.preparedSpellsByClass ?? {}, owner))
      (originalPreparations[owner] ??= []).push(name);
  }
  const migrateCopies = <T,>(
    records: Partial<Record<SpellcastingClassId, Record<string, T[]>>> | undefined,
    fallback: T,
  ) => migrateTrapClassRecords(records, (copies, classId) => {
    const preparations = originalPreparations[classId] ?? [];
    if (!Object.hasOwn(copies, "Phantom Trap") && !preparations.includes("Phantom Trap"))
      return copies;
    const { ["Phantom Trap"]: legacy = [], [canonicalTrapName]: canonical = [], ...result } = copies;
    const originalNames = [canonicalTrapName, "Phantom Trap"];
    // Keep every copy's slot level and metamagic flags aligned, padding unmodified copies.
    result[canonicalTrapName] = [canonical, legacy].flatMap((values, index) =>
      Array.from({
        length: Math.max(values.length, preparations.filter((name) => name === originalNames[index]).length),
      }, (_, copy) => values[copy] ?? fallback),
    );
    return result;
  });
  return {
    ...character,
    knownSpells: known(character.knownSpells),
    preparedSpells: prepared(character.preparedSpells),
    knownSpellClasses: migrateTrapSpellRecord(character.knownSpellClasses),
    wizardSpellLearning: migrateTrapSpellRecord(character.wizardSpellLearning),
    knownSpellsByClass: migrateTrapClassRecords(character.knownSpellsByClass, known),
    preparedSpellsByClass: migrateTrapClassRecords(character.preparedSpellsByClass, prepared),
    spellAcquisitionByClass: migrateTrapClassRecords(character.spellAcquisitionByClass, (records) => migrateTrapSpellRecord(records) ?? records),
    featSpellMasterySelections: character.featSpellMasterySelections &&
      Object.fromEntries(Object.entries(character.featSpellMasterySelections).map(([slot, names]) => [slot, known(names)])),
    preparedSpellSlotLevelsByClass: migrateCopies(character.preparedSpellSlotLevelsByClass, 2),
    empowerByClass: migrateCopies(character.empowerByClass, false),
    maximizeByClass: migrateCopies(character.maximizeByClass, false),
    extendByClass: migrateCopies(character.extendByClass, false),
    enlargeByClass: migrateCopies(character.enlargeByClass, false),
    quickenByClass: migrateCopies(character.quickenByClass, false),
    silentByClass: migrateCopies(character.silentByClass, false),
    stillByClass: migrateCopies(character.stillByClass, false),
    widenByClass: migrateCopies(character.widenByClass, false),
    sculptByClass: migrateCopies(character.sculptByClass, false),
  };
}

export function parseCharacter(value: unknown): Character {
  const migrated = isRecord(value) && value.ruleset === undefined
    ? { ...value, ruleset: inferLegacyRuleset(value) }
    : value;
  assertCharacter(migrated);
  const character = migrateTrapSpellNames(migrated);
  return character.languages?.includes("Kender")
    ? {
        ...character,
        languages: character.languages.map((language) =>
          language === "Kender" ? "Kenderspeak" : language,
        ),
      }
    : character;
}
