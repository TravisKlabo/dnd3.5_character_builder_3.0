import { classDefinitions, deityDefinitions, dragonlancePrestigeClasses, isRulesetId, magicSchools, raceDefinitions, type Character, type RulesetId } from "./domain";
import { storeCategories, type StoreItem } from "./data/itemTypes";
import { isClericDomainId } from "./data/clericDomainIds";
import { combatEffectModifierKeys } from "./combatEffects";

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
  isRecord(value) && Object.entries(value).every(([key, entry]) => Object.hasOwn(classDefinitions, key) && check(entry));
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
  return race?.source === "dragonlance-user-pack" && race.levelAdjustment
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
          (isString(entry.prestigeClassId) && Object.hasOwn(dragonlancePrestigeClasses, entry.prestigeClassId))))) {
    throw new Error("Class levels must use supported classes and positive whole levels.");
  }
  const validHitPointRolls = value.hitPointRolls === undefined ||
    (Array.isArray(value.hitPointRolls) && value.hitPointRolls.length <= 1000 &&
      value.hitPointRolls.every((entry: unknown) =>
        isRecord(entry) && isString(entry.classId) && Object.hasOwn(classDefinitions, entry.classId) &&
          (entry.prestigeClassId === undefined ||
            (isString(entry.prestigeClassId) && Object.hasOwn(dragonlancePrestigeClasses, entry.prestigeClassId))) &&
          isNumber(entry.characterLevel) && Number.isSafeInteger(entry.characterLevel) && entry.characterLevel >= 1 &&
        isNumber(entry.classLevel) && Number.isSafeInteger(entry.classLevel) && entry.classLevel >= 1 &&
        isNumber(entry.hitDie) && [4, 6, 8, 10, 12].includes(entry.hitDie) &&
        isNumber(entry.roll) && Number.isSafeInteger(entry.roll) && entry.roll >= 1 && entry.roll <= entry.hitDie &&
        isNumber(entry.hpIncrease) && Number.isSafeInteger(entry.hpIncrease) && entry.hpIncrease >= 1));
  if (!validHitPointRolls) {
    throw new Error("Per-level hit point rolls must contain valid Hit Die results and HP increases.");
  }
  if (!isNumber(value.hitPoints) ||
      (value.hasMedallionOfFaith !== undefined &&
        typeof value.hasMedallionOfFaith !== "boolean") ||
      !["feats", "knownSpells", "preparedSpells", "languages"].every((key) => isStringList(value[key])) ||
      (value.speakLanguages !== undefined && !isStringList(value.speakLanguages)) ||
      !isMap(value.featSelections, isString) ||
      (value.featWeaponSelections !== undefined && !isMap(value.featWeaponSelections, isString)) ||
      (value.featSkillSelections !== undefined && !isMap(value.featSkillSelections, isString)) ||
      (value.featSpellSchoolSelections !== undefined && !isMap(value.featSpellSchoolSelections, isMagicSchool)) ||
      (value.wizardSpecializationSchool !== undefined && !isMagicSchool(value.wizardSpecializationSchool)) ||
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
      (value.classFeatures !== undefined && !isStringList(value.classFeatures)) ||
      (value.knownSpellClasses !== undefined &&
        !isMap(value.knownSpellClasses, (entry) => isString(entry) && Object.hasOwn(classDefinitions, entry))) ||
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

export function parseCharacter(value: unknown): Character {
  const migrated = isRecord(value) && value.ruleset === undefined
    ? { ...value, ruleset: inferLegacyRuleset(value) }
    : value;
  assertCharacter(migrated);
  return migrated.languages?.includes("Kender")
    ? {
        ...migrated,
        languages: migrated.languages.map((language) =>
          language === "Kender" ? "Kenderspeak" : language,
        ),
      }
    : migrated;
}
