import { classDefinitions, dragonlancePrestigeClasses, type Character } from "./domain";
import { storeCategories, type StoreItem } from "./data/itemTypes";
import { isClericDomainId } from "./data/clericDomains";
import { combatEffectModifierKeys } from "./combatEffects";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringList = (value: unknown) => Array.isArray(value) && value.every(isString);
const isMap = (value: unknown, check: (entry: unknown) => boolean) =>
  isRecord(value) && Object.values(value).every(check);
const isClassMap = (value: unknown, check: (entry: unknown) => boolean) =>
  isRecord(value) && Object.entries(value).every(([key, entry]) => Object.hasOwn(classDefinitions, key) && check(entry));
const categories = new Set<string>(storeCategories);

function isCombatEffect(value: unknown) {
  if (!isRecord(value) || !isString(value.name) || !value.name.trim() || value.name.length > 80 ||
      !(value.remainingRounds === null ||
        (isNumber(value.remainingRounds) && Number.isSafeInteger(value.remainingRounds) && value.remainingRounds > 0)) ||
      !isRecord(value.modifiers) || Object.keys(value.modifiers).length !== combatEffectModifierKeys.length) {
    return false;
  }
  const modifiers = value.modifiers;
  return combatEffectModifierKeys.every((key) =>
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
  const booleanFields = ["finesse", "thrown", "towerShieldProficiency", "doubleWeapon"];
  const enums: Record<string, string[]> = {
    proficiency: ["Simple", "Martial", "Exotic"],
    handedness: ["Light", "One-handed", "Two-handed", "Ranged"],
    armorCategory: ["Light", "Medium", "Heavy"],
    shieldType: ["Buckler", "Light", "Heavy", "Tower", "Custom"],
  };
  return stringFields.every((key) => value[key] === undefined || isString(value[key])) &&
    numberFields.every((key) => value[key] === undefined || isNumber(value[key])) &&
    booleanFields.every((key) => value[key] === undefined || typeof value[key] === "boolean") &&
    !(value.thrown === true && value.category !== "Weapons") &&
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
  if (!["name", "player", "race", "alignment"].every((key) => isString(value[key]))) {
    throw new Error("Character identity fields must be text.");
  }
  if (!isRecord(value.abilities) ||
      !["str", "dex", "con", "int", "wis", "cha"].every((key) =>
        isRecord(value.abilities) && isNumber(value.abilities[key]))) {
    throw new Error("All six ability scores must be finite numbers.");
  }
  if (!Array.isArray(value.classLevels) || !value.classLevels.length ||
      !value.classLevels.every((entry: unknown) =>
        isRecord(entry) && isString(entry.classId) && Object.hasOwn(classDefinitions, entry.classId) &&
        isNumber(entry.level) && Number.isInteger(entry.level) && entry.level >= 1 &&
        (entry.prestigeClassId === undefined ||
          (isString(entry.prestigeClassId) && Object.hasOwn(dragonlancePrestigeClasses, entry.prestigeClassId))))) {
    throw new Error("Class levels must use supported classes and positive whole levels.");
  }
  if (!isNumber(value.hitPoints) ||
      !["feats", "knownSpells", "preparedSpells", "languages"].every((key) => isStringList(value[key])) ||
      !isMap(value.featSelections, isString) ||
      (value.featWeaponSelections !== undefined && !isMap(value.featWeaponSelections, isString)) ||
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
  const optionalStrings = ["age", "height", "weight", "hairColor", "eyeColor", "skinColor",
    "damageReduction", "spellResistance", "notes", "deity"];
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
      (value.highSorceryOrder !== undefined && !["white", "red", "black"].includes(String(value.highSorceryOrder))) ||
      (value.prestigeClass !== undefined &&
        (!isString(value.prestigeClass) || !Object.hasOwn(dragonlancePrestigeClasses, value.prestigeClass))) ||
      (value.classFeatures !== undefined && !isStringList(value.classFeatures)) ||
      (value.knownSpellClasses !== undefined &&
        !isMap(value.knownSpellClasses, (entry) => isString(entry) && Object.hasOwn(classDefinitions, entry))) ||
      !["knownSpellsByClass", "preparedSpellsByClass"].every((key) =>
        value[key] === undefined || isClassMap(value[key], isStringList)) ||
      (value.expendedSpellSlotsByClass !== undefined &&
        !isClassMap(value.expendedSpellSlotsByClass, (levels) =>
          isRecord(levels) && Object.entries(levels).every(([level, slots]) =>
            /^[0-9]$/.test(level) && Array.isArray(slots) &&
            slots.every((slot) => isNumber(slot) && Number.isInteger(slot) && slot >= 0)))) ||
      (value.wizardSpellLearning !== undefined &&
        !isMap(value.wizardSpellLearning, (entry) => isRecord(entry) &&
          ["scroll", "spellbook", "research", "reward"].includes(String(entry.source)) &&
          isString(entry.learnedAt) && Number.isFinite(Date.parse(entry.learnedAt)) &&
          (entry.decipherMethod === undefined || ["read-magic", "author", "previously-deciphered", "spellcraft"].includes(String(entry.decipherMethod))) &&
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
          new Set(value.clericDomainExpended).size !== value.clericDomainExpended.length))) {
    throw new Error("Cleric domains, domain preparation, or expended domain slots are invalid.");
  }
}

export function parseCharacter(value: unknown): Character {
  assertCharacter(value);
  return value;
}
