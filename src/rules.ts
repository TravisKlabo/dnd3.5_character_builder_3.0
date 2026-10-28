import { languageCatalog, dragonlanceLanguages, racialBonusLanguages, racialLanguages, classSkills, skills, featCatalog, abilityLabels, trainedOnlySkills, limitedUntrainedSkills, startingClassFeatures } from "./data/characterCatalog";
import { type Character, abilityModifier, type ClassId, carryingCapacity, sizeModifier, raceDefinitions, type AbilityName, type SavingThrowCondition, type CombatTargetType, classDefinitions, type FeatDefinition, dragonlancePrestigeClasses, type PrestigeClassId } from "./domain";
import { classFeatureProgression } from "./data/classFeatureProgression";
import { spellProgressions, bardKnownProgression, sorcererKnownProgression } from "./data/spellProgression";
import { armorBonuses, findStoreItem, shieldBonuses, armorMaximumDexterity, weaponDamageBySize, type StoreItem, storeItems, armorClasses, armorCheckPenalties, weaponDamageTypes, shieldCheckPenalties, weaponProfiles, rangedWeaponNames, lightOffHandWeaponNames, simpleWeaponNames, martialWeaponNames, martialWeaponClasses, twoHandedWeaponNames, weaponRangeIncrements, reachWeaponNames, armorSpellFailure, shieldSpellFailure } from "./data/equipmentCatalog";
import { findSpellByName, getClassSpells } from "./data/spellCatalog";
import { getWarDomainWeapon, isClericDomainClassSkill } from "./clericDomains";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "./abilityEquipment";
import { getCombatEffectDetails, getCombatEffectModifier } from "./combatEffects";

const armorNames = Object.keys(armorBonuses).sort((left, right) => right.length - left.length);
const shieldNames = Object.keys(shieldBonuses).sort((left, right) => right.length - left.length);

export function getAvailableLanguages(
  ruleset: "core-35-srd" | "dragonlance-user-pack" | "dragonlance-monster-classes",
) {
  return languageCatalog.filter(
    (language) =>
      ruleset !== "core-35-srd" || !dragonlanceLanguages.has(language),
  );
}

export function getAvailableBonusLanguages(
  character: Character,
  ruleset: "core-35-srd" | "dragonlance-user-pack" | "dragonlance-monster-classes" = "dragonlance-user-pack",
) {
  const raceId = character.race.toLowerCase().replaceAll(" ", "-");
  const racialChoices = racialBonusLanguages[raceId];
  return getAvailableLanguages(ruleset).filter(
    (language) => !racialChoices || racialChoices.includes(language),
  );
}

export function getRacialLanguages(character: Character) {
  const raceId = character.race.toLowerCase().replaceAll(" ", "-");
  return racialLanguages[raceId] ?? ["Common"];
}

export function getLanguageBonusSlots(character: Character) {
  return Math.max(0, abilityModifier(character.abilities.int));
}

export function getCharacterLanguages(character: Character) {
  return [
    ...new Set([
      ...getRacialLanguages(character),
      ...(character.languages ?? []),
    ]),
  ];
}

export function baseSpellSlots(classId: ClassId, classLevel: number, spellLevel: number) {
  const index = classId === "paladin" || classId === "ranger" ? spellLevel - 1 : spellLevel;
  return spellProgressions[classId]?.[classLevel - 1]?.[index] ?? 0;
}

export function hasSpellLevelAtClassLevel(
  classId: ClassId,
  classLevel: number,
  spellLevel: number,
) {
  if (!Number.isInteger(spellLevel) || spellLevel < 0 || spellLevel > 9) return false;
  const index = classId === "paladin" || classId === "ranger" ? spellLevel - 1 : spellLevel;
  return spellProgressions[classId]?.[classLevel - 1]?.[index] !== undefined;
}

export const spellcastingAbilities: Partial<Record<ClassId, AbilityName>> = {
  bard: "cha", cleric: "wis", druid: "wis", mystic: "wis",
  paladin: "wis", ranger: "wis", sorcerer: "cha", wizard: "int",
};

export function getSpellcastingAbility(classId: ClassId): AbilityName {
  const ability = spellcastingAbilities[classId];
  if (!ability) throw new Error(`${classDefinitions[classId].name} does not have a spellcasting ability.`);
  return ability;
}

export function getCasterLevel(classId: ClassId, classLevel: number) {
  if (!classDefinitions[classId].spellcasting) return 0;
  return classId === "paladin" || classId === "ranger"
    ? classLevel < 4 ? 0 : Math.floor(classLevel / 2)
    : classLevel;
}

export function getSpellSaveDC(character: Character, classId: ClassId, spellLevel: number) {
  return 10 + spellLevel + abilityModifier(getEffectiveAbilityScore(character, getSpellcastingAbility(classId)));
}

export function getArcaneSpellFailure(character: Character, classId: ClassId) {
  if (!["bard", "sorcerer", "wizard"].includes(classId)) return undefined;
  const details: string[] = [];
  let total = 0;
  let unknown = false;
  for (const slot of ["Armor", "Shield"] as const) {
    const name = character.equipment[slot];
    if (!name) continue;
    const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
    const base = item?.custom ? undefined :
      (slot === "Armor" ? armorNames : shieldNames).find((entry) => name.includes(entry));
    if (slot === "Armor" && classId === "bard" && getWornArmor(character).movementCategory === "Light") {
      details.push(`${name}: 0% for bard spells (light armor exception)`);
      continue;
    }
    const failure = slot === "Armor"
      ? item?.arcaneSpellFailure ?? (base ? armorSpellFailure[base] : undefined)
      : item?.shieldSpellFailure ?? (base ? shieldSpellFailure[base] : undefined);
    if (failure === undefined || !Number.isFinite(failure) || failure < 0 || failure > 100) {
      unknown = true;
      details.push(`${name}: spell failure not recorded`);
    } else {
      total += failure;
      details.push(`${name}: ${failure}%`);
    }
  }
  return {
    percent: unknown ? null : Math.min(100, total),
    detail: [...details, "Applies to this class's arcane spells with somatic components; armor proficiency does not remove spell failure."].join("\n"),
  };
}

export function getDailySpellSlots(character: Character, classId: ClassId, classLevel: number, level: number) {
  if (!hasSpellLevelAtClassLevel(classId, classLevel, level)) return 0;
  const score = getEffectiveAbilityScore(character, getSpellcastingAbility(classId));
  if (score < 10 + level) return 0;
  const modifier = abilityModifier(score);
  const bonus = level > 0 && modifier >= level ? Math.floor((modifier - level) / 4) + 1 : 0;
  return baseSpellSlots(classId, classLevel, level) + bonus;
}

export function getKnownSpellLimit(character: Character, classId: ClassId, classLevel: number, level: number) {
  if (classId === "bard") {
    if (level > 0 && baseSpellSlots(classId, classLevel, level) === 0 &&
      getDailySpellSlots(character, classId, classLevel, level) === 0) return 0;
    return bardKnownProgression[classLevel - 1]?.[level] ?? 0;
  }
  return classId === "sorcerer" ? sorcererKnownProgression[classLevel - 1]?.[level] ?? 0 : 0;
}

export function getClassSpellSelections(character: Character, field: "knownSpells" | "preparedSpells") {
  const classField = field === "knownSpells" ? "knownSpellsByClass" : "preparedSpellsByClass";
  const result = { ...(character[classField] ?? {}) };
  const casters = character.classLevels.filter((entry) => classDefinitions[entry.classId].spellcasting);
  for (const name of character[field]) {
    if (Object.values(result).some((entries) => entries?.includes(name))) continue;
    const explicitOwner = character.knownSpellClasses?.[name] ??
      (field === "preparedSpells" ? casters.find(({ classId }) => character.knownSpellsByClass?.[classId]?.includes(name))?.classId : undefined);
    // Legacy flat lists have no class identity; assign once, never to every caster.
    const owner = explicitOwner ?? casters.find(({ classId }) =>
      getClassSpells(classId).some((spell) => spell.name === name))?.classId ?? casters[0]?.classId;
    if (owner && character[classField]?.[owner] === undefined) {
      result[owner] = [...(result[owner] ?? []), name];
    }
  }
  return result;
}

export function getWizardCopyRequirements(level: number) {
  if (!Number.isInteger(level) || level < 0 || level > 9) throw new Error("Wizard spell level must be 0 through 9.");
  const pages = Math.max(1, level);
  return { decipherDC: 20 + level, learningDC: 15 + level, studyHours: 8, pages,
    writingCostGp: pages * 100, writingHours: 24, usualAccessFeeGp: level * 50 };
}

export function getWizardSpellbookSpells() {
  const names = new Set<string>();
  return getClassSpells("wizard").filter((spell) => {
    const name = spell.name.toLowerCase();
    if (names.has(name)) return false;
    names.add(name);
    return true;
  });
}

export function getWizardFreeSpellAllowance(character: Character, original?: Character) {
  const classLevel = character.classLevels.find((entry) => entry.classId === "wizard")?.level ?? 0;
  const originalLevel = original?.classLevels.find((entry) => entry.classId === "wizard")?.level ?? 0;
  const starting = originalLevel === 0;
  const required = starting ? 3 + Math.max(0, abilityModifier(character.abilities.int)) : 2;
  const old = new Set(original ? getClassSpellSelections(original, "knownSpells").wizard ?? [] : []);
  const entries = getWizardSpellbookSpells();
  const selected = (getClassSpellSelections(character, "knownSpells").wizard ?? []).filter((name) =>
    !old.has(name) && !["scroll", "spellbook", "research", "reward"].includes(character.spellAcquisitionByClass?.wizard?.[name] ?? "") &&
    entries.some((spell) => spell.name === name && spell.level > 0 &&
      (!starting || spell.level === 1) && hasSpellLevelAtClassLevel("wizard", classLevel, spell.level) &&
      getEffectiveAbilityScore(character, "int") >= 10 + spell.level)).length;
  return { starting, required, selected, remaining: Math.max(0, required - selected) };
}

export function formatCustomItemName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[A-Za-z][^\s-]*/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1),
    );
}

export function getEquipmentDefenseBonuses(character: Character) {
  const definitions = {
    deflection: { slots: ["Rings 1", "Rings 2"], pattern: /^Ring of Protection \+([1-5])$/ },
    resistance: { slots: ["Shoulders"], pattern: /^Cloak of Resistance \+([1-5])$/ },
    naturalArmorEnhancement: { slots: ["Neck"], pattern: /^Amulet of Natural Armor \+([1-5])$/ },
  };
  const getBonus = (type: keyof typeof definitions) => {
    const { slots, pattern } = definitions[type];
    const sources = slots.flatMap((slot) => {
      const equipped = character.equipment[slot];
      if (!equipped || findStoreItem(equipped)?.custom) return [];
      const name = equipped.replace(/ \((Small|Medium|Large)\)$/, "");
      const match = name.match(pattern);
      return match ? [{ name, slot, bonus: Number(match[1]) }] : [];
    });
    const bonus = Math.max(0, ...sources.map((source) => source.bonus));
    let applied = false;
    const detail = sources.map((source) => {
      const active = !applied && source.bonus === bonus;
      if (active) applied = true;
      return `${source.name} (${source.slot}): ${formatModifier(source.bonus)} ${type === "naturalArmorEnhancement" ? "enhancement to natural armor" : type}${active ? "" : " (does not stack; highest bonus only)"}`;
    });
    return { bonus, detail };
  };
  return {
    deflection: getBonus("deflection"),
    resistance: getBonus("resistance"),
    naturalArmorEnhancement: getBonus("naturalArmorEnhancement"),
  };
}

const combatTargetLabels: Record<CombatTargetType, string> = {
  orc: "orcs/half-orcs",
  goblinoid: "goblinoids",
  kobold: "kobolds",
  giant: "giants",
};

export function getTowerShieldState(character: Character) {
  const shield = findStoreItem(character.equipment?.Shield ?? "", "Shields");
  const equipped = Boolean(shield && (
    shield.towerShieldProficiency ||
    shield.shieldType === "Tower" ||
    shield.name.includes("Tower Shield")
  ));
  return {
    equipped,
    coverActive: equipped && character.towerShieldTotalCover === true,
  };
}

export function getArmorClassValues(character: Character, targetTypes: CombatTargetType[] = []) {
  const equipment = character.equipment ?? {};
  const armorName = equipment.Armor ?? "";
  const shieldName = equipment.Shield ?? "";
  const bracersName = Object.values(equipment).find((value) => /Bracers of Armor/.test(value)) ?? "";
  const customArmor = findStoreItem(armorName, "Armor");
  const armorBaseName = customArmor?.custom ? undefined : armorNames.find((name) => armorName.includes(name));
  const shieldBaseName = shieldNames.find((name) => shieldName.includes(name));
  const bracersArmorBonus = !armorBaseName && bracersName
    ? Number(bracersName.match(/\+(\d+)/)?.[1] ?? 0)
    : 0;
  const armorDexterityBonus = armorBaseName
    ? armorMaximumDexterity[armorBaseName]
    : customArmor?.maxDexterity ?? Infinity;
  const maximumDexterityBonus = Math.min(armorDexterityBonus, getEncumbrance(character).maximumDexterity);
  const armorEnhancement = armorName.match(/\+(\d+)/)?.[1];
  const shieldEnhancement = shieldName.match(/\+(\d+)/)?.[1];
  const armorBonus = (armorBaseName ? armorBonuses[armorBaseName] : customArmor?.armorBonus ?? 0) +
      (armorEnhancement ? Number(armorEnhancement) : 0) +
      bracersArmorBonus;
  const totalShieldBonus = (shieldBaseName ? shieldBonuses[shieldBaseName] : 0) +
      (shieldEnhancement ? Number(shieldEnhancement) : 0);
  const bucklerBonusLost = isBucklerEquipped(character) &&
    (Boolean(equipment["Off Hand Weapon"]) || getDoubleWeaponModeState(character)?.enabled === true);
  const towerShieldState = getTowerShieldState(character);
  const shieldBashState = getShieldBashState(character);
  const shieldBonus = bucklerBonusLost || towerShieldState.coverActive || shieldBashState.enabled
    ? 0
    : totalShieldBonus;
  const dexterity = Math.min(abilityModifier(getEffectiveAbilityScore(character, "dex")), maximumDexterityBonus);
  const bonuses = getEquipmentDefenseBonuses(character);
  const deflection = bonuses.deflection.bonus;
  const naturalArmorEnhancement = bonuses.naturalArmorEnhancement.bonus;
  const activeArmorClass = getCombatEffectModifier(character, "armorClass");
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  const racialDodgeACBonus = Math.max(
    0,
    ...targetTypes.map((targetType) => race?.racialDodgeACBonuses?.[targetType] ?? 0),
  );
  const dodgeTarget = targetTypes.find(
    (targetType) => race?.racialDodgeACBonuses?.[targetType] === racialDodgeACBonus && racialDodgeACBonus > 0,
  );
  const base = 10 + sizeModifier(character);
  const retainsDexterity = character.classLevels.some(({ classId, level }) =>
    (classId === "barbarian" && level >= 2) || (classId === "rogue" && level >= 4)) ||
    (character.classFeatures ?? []).some((feature) => /\buncanny dodge\b/i.test(feature));
  return {
    normal: base + armorBonus + shieldBonus + dexterity + deflection + naturalArmorEnhancement + racialDodgeACBonus + activeArmorClass,
    touch: base + dexterity + deflection + racialDodgeACBonus + activeArmorClass,
    flatFooted: base + armorBonus + shieldBonus + (retainsDexterity ? dexterity + racialDodgeACBonus : Math.min(0, dexterity)) + deflection + naturalArmorEnhancement + activeArmorClass,
    retainsDexterity,
    racialDodgeACBonus,
    towerShieldCoverActive: towerShieldState.coverActive,
    shieldBashACBonusLost: shieldBashState.enabled,
    detail: [
      `Base 10; armor ${formatModifier(armorBonus)}; shield ${formatModifier(shieldBonus)}; DEX ${formatModifier(dexterity)}; size ${formatModifier(sizeModifier(character))}`,
      ...(bucklerBonusLost ? ["Buckler AC bonus lost while wielding an off-hand weapon."] : []),
      ...(towerShieldState.coverActive
        ? ["Tower shield used for total cover instead of its shield bonus; attacks are unavailable until the start of the next turn. Targeted spells can still target the shield."]
        : []),
      ...(shieldBashState.enabled
        ? ["Shield AC bonus lost after a shield bash until your next action; clear the bash setting manually."]
        : []),
      ...(dodgeTarget && race ? [`${race.name} dodge vs. ${combatTargetLabels[dodgeTarget]} ${formatModifier(racialDodgeACBonus)}`] : []),
      ...getAbilityEquipmentBonus(character, "dex").detail,
      ...bonuses.deflection.detail,
      ...bonuses.naturalArmorEnhancement.detail,
      ...getCombatEffectDetails(character, "armorClass"),
    ],
  };
}

export function getEquipmentArmorClass(character: Character) {
  return getArmorClassValues(character).normal;
}

export function getSpecialAttackBonuses(character: Character) {
  const base = getBaseAttackBonus(character);
  const strength = abilityModifier(getEffectiveAbilityScore(character, "str"));
  const dexterity = abilityModifier(getEffectiveAbilityScore(character, "dex"));
  const size = sizeModifier(character);
  const feats = getChosenFeats(character);
  const penalties = getArmorNonproficiencyPenalties(character);
  const nonproficiency = penalties.reduce((total, entry) => total + entry.penalty, 0);
  const towerShieldState = getTowerShieldState(character);
  const towerPenalty = towerShieldState.equipped ? -2 : 0;
  const meleeAbility = feats.includes("weapon-finesse")
    ? Math.max(strength, dexterity + finesseShieldPenalty(character)) : strength;
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ?? raceDefinitions.human;
  const grappleSizeModifiers = {
    Fine: -16, Diminutive: -12, Tiny: -8, Small: -4, Medium: 0,
    Large: 4, Huge: 8, Gargantuan: 12, Colossal: 16,
  };
  const grappleSize = grappleSizeModifiers[race.size ?? "Medium"];
  const grappleFeat = feats.includes("improved-grapple") ? 4 : 0;
  const attackPenalty = nonproficiency + towerPenalty;
  const attackModifier = getCombatEffectModifier(character, "attack");
  const checkModifier = getCombatEffectModifier(character, "checks");
  const penaltyDetail = [
    ...penalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}: ${entry.name}`),
    ...(towerPenalty ? ["-2 tower shield"] : []),
  ];
  return {
    meleeTouch: base + meleeAbility + size + attackPenalty + attackModifier,
    rangedTouch: base + dexterity + size + attackPenalty + attackModifier,
    grapple: base + strength + grappleSize + grappleFeat + nonproficiency + checkModifier,
    towerShieldCoverActive: towerShieldState.coverActive,
    meleeDetail: [`BAB ${formatModifier(base)}`, `${meleeAbility === strength ? "STR" : "DEX with Weapon Finesse (including shield penalty)"} ${formatModifier(meleeAbility)}`, `size ${formatModifier(size)}`, ...penaltyDetail, ...getCombatEffectDetails(character, "attack")].join("; "),
    rangedDetail: [`BAB ${formatModifier(base)}`, `DEX ${formatModifier(dexterity)}`, `size ${formatModifier(size)}`, ...penaltyDetail, ...getCombatEffectDetails(character, "attack")].join("; "),
    grappleDetail: [`BAB ${formatModifier(base)}`, `STR ${formatModifier(strength)}`, `grapple size ${formatModifier(grappleSize)}`, ...(grappleFeat ? ["Improved Grapple +4"] : []), ...penalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}: ${entry.name}`), ...getCombatEffectDetails(character, "checks")].join("; "),
  };
}

export function getSizedWeaponDamage(damage: string, size: string) {
  if (size === "Small") return weaponDamageBySize[damage]?.smaller ?? damage;
  if (size === "Large") return weaponDamageBySize[damage]?.larger ?? damage;
  return damage;
}

export function getWeaponDamageForSize(item: StoreItem, size: string) {
  return getWeaponEndDamageForSize(item, size, "main");
}

function getWeaponEndDamageForSize(item: StoreItem, size: string, end: "main" | "off-hand") {
  const profile = getWeaponProfile(item.name);
  const isOffHand = end === "off-hand";
  const sizeDamage = isOffHand
    ? (size === "Small" ? item.offHandDamageSmall : size === "Large" ? item.offHandDamageLarge : item.offHandDamageMedium) ??
      (size === "Small" ? item.damageSmall : size === "Large" ? item.damageLarge : item.damageMedium)
    : size === "Small" ? item.damageSmall : size === "Large" ? item.damageLarge : item.damageMedium;
  const baseDamage = isOffHand
    ? item.offHandDamage ?? profile.offHandDamage ?? item.damage ?? profile.damage
    : item.damage ?? profile.damage;
  return sizeDamage ?? getSizedWeaponDamage(baseDamage, size);
}

export function getWeaponRangeForSize(item: StoreItem, size: string) {
  const sizedRange = size === "Small"
    ? item.rangeSmall
    : size === "Large"
      ? item.rangeLarge
      : item.rangeMedium;
  const standardRange = item.custom ? undefined : weaponRangeIncrements[getBaseEquipmentName(item.name)];
  return sizedRange ?? item.rangeIncrement ?? (standardRange ? `${standardRange} ft.` : undefined);
}

function getRangedAttackDistanceDetails(
  item: StoreItem,
  rangeIncrement: string | undefined,
  isRanged: boolean,
  distanceFeet: number | undefined,
) {
  if (!isRanged) {
    return { attackPenalty: 0, maximumRangeFeet: undefined, outOfRange: false, message: undefined };
  }
  const incrementFeetMatch = rangeIncrement?.match(/^\s*(\d+(?:\.\d+)?)\s*(?:ft\.?|feet)\s*$/i);
  const incrementFeet = incrementFeetMatch ? Number(incrementFeetMatch[1]) : undefined;
  if (!incrementFeet || !Number.isFinite(incrementFeet) || incrementFeet <= 0) {
    return {
      attackPenalty: 0,
      maximumRangeFeet: undefined,
      outOfRange: false,
      message: distanceFeet === undefined
        ? undefined
        : "Set a numeric range increment for this weapon to calculate distance penalties.",
    };
  }
  const maximumRangeFeet = incrementFeet * (weaponTraits(item).thrown ? 5 : 10);
  if (distanceFeet === undefined) {
    return { attackPenalty: 0, maximumRangeFeet, outOfRange: false, message: undefined };
  }
  const fullIncrements = Math.floor(distanceFeet / incrementFeet);
  const attackPenalty = fullIncrements === 0 ? 0 : -2 * fullIncrements;
  const outOfRange = distanceFeet > maximumRangeFeet;
  return {
    attackPenalty,
    maximumRangeFeet,
    outOfRange,
    message: outOfRange
      ? `Out of range: ${distanceFeet} ft. exceeds the ${maximumRangeFeet} ft. maximum.`
      : attackPenalty < 0
        ? `At ${distanceFeet} ft.: ${formatModifier(attackPenalty)} range penalty.`
        : `At ${distanceFeet} ft.: no range penalty.`,
  };
}

type WeaponMaterial = NonNullable<StoreItem["material"]>;
type AmmunitionProfile = { label: string; pattern: RegExp };
type CompatibleAmmunition = { key: string; name: string; quantity: number; material?: WeaponMaterial };

function getMaterialFromName(name: string): WeaponMaterial | undefined {
  if (/\badamantine\b/i.test(name)) return "adamantine";
  if (/\bcold[\s-]+iron\b/i.test(name)) return "cold-iron";
  if (/\b(?:alchemical\s+)?silver\b/i.test(name)) return "alchemical-silver";
  return undefined;
}

function getWeaponMaterial(item: StoreItem, name: string) {
  return item.material ?? getMaterialFromName(name) ?? getMaterialFromName(item.name);
}

function getWeaponAmmunitionProfile(item: StoreItem, isRanged: boolean): AmmunitionProfile | undefined {
  if (!isRanged) return undefined;
  const { baseName } = weaponTraits(item);
  if (baseName.includes("Crossbow")) return { label: "bolts", pattern: /bolts?/i };
  if (["Shortbow", "Longbow", "Composite Shortbow", "Composite Longbow"].includes(baseName)) {
    return { label: "arrows", pattern: /arrows?/i };
  }
  if (baseName === "Sling") return { label: "sling bullets", pattern: /sling bullets?/i };
  if (baseName === "Dart") return { label: "darts", pattern: /darts?/i };
  return undefined;
}

function getCompatibleAmmunition(
  character: Character,
  ammunition: AmmunitionProfile | undefined,
): CompatibleAmmunition[] {
  if (!ammunition) return [];
  return Object.entries(character.inventory ?? {}).flatMap(([key, quantity]) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return [];
    const details = getInventoryEntryDetails(key);
    return details.category === "Ammunition" && ammunition.pattern.test(details.name)
      ? [{ key, name: details.name, quantity, material: details.material }]
      : [];
  });
}

function getWeaponAmmunitionReadiness(
  item: StoreItem,
  isRanged: boolean,
  ammunition: AmmunitionProfile | undefined,
  compatibleAmmunition: CompatibleAmmunition[],
) {
  if (!isRanged) return { ammunitionStatus: undefined, reloadNote: undefined };
  const traits = weaponTraits(item);
  const { baseName } = traits;
  let ammunitionStatus: { status: "ready" | "missing" | "manual"; message: string } | undefined;
  if (ammunition) {
    const packageCount = compatibleAmmunition.reduce((total, entry) => total + entry.quantity, 0);
    ammunitionStatus = packageCount > 0
      ? {
          status: "ready",
          message: `Compatible ${ammunition.label} in inventory: ${packageCount} package${packageCount === 1 ? "" : "s"}; not consumed automatically.`,
        }
      : { status: "missing", message: `No compatible ${ammunition.label} in inventory.` };
  } else if (item.custom) {
    ammunitionStatus = {
      status: "manual",
      message: "Custom ranged weapon: ammunition requirements are not configured; verify manually.",
    };
  } else if (!traits.thrown) {
    ammunitionStatus = {
      status: "manual",
      message: "Ammunition type is not configured for this ranged weapon; verify manually.",
    };
  }

  const reloadNote = baseName === "Light Crossbow" || baseName === "Hand Crossbow"
    ? "Reload after each shot: move action; provokes an attack of opportunity."
    : baseName === "Heavy Crossbow"
      ? "Reload after each shot: full-round action; provokes an attack of opportunity."
      : baseName.startsWith("Repeating")
        ? "Magazine holds 5 bolts; loading a new case is a full-round action. Shots are not tracked."
        : baseName === "Sling"
          ? "Load after each shot: move action; provokes an attack of opportunity."
          : ["Shortbow", "Longbow", "Composite Shortbow", "Composite Longbow"].includes(baseName)
            ? "Drawing an arrow is a free action."
            : undefined;
  return { ammunitionStatus, reloadNote };
}

function getTargetDamageReductionStatus(
  input: string | undefined,
  item: StoreItem,
  weaponName: string,
  isRanged: boolean,
  traits: ReturnType<typeof weaponTraits>,
  ammunition: AmmunitionProfile | undefined,
  compatibleAmmunition: CompatibleAmmunition[],
  selectedAmmunitionKey: string | undefined,
) {
  if (!input?.trim()) return undefined;
  const match = input.trim().match(/^(?:DR\s*)?(\d+)\s*\/\s*(.+)$/i);
  if (!match) {
    return {
      status: "manual" as const,
      message: `Target DR "${input.trim()}" is not in the supported "5/cold iron" format; evaluate it manually.`,
    };
  }
  const amount = Number(match[1]);
  const qualifier = match[2].trim().toLowerCase().replace(/[-\s]+/g, " ");
  if (!Number.isSafeInteger(amount)) {
    return { status: "manual" as const, message: `Target DR "${input.trim()}" has an invalid value; evaluate it manually.` };
  }
  if (amount === 0) {
    return { status: "none" as const, message: "Target DR is 0; no damage reduction applies." };
  }
  const targetMaterial: WeaponMaterial | undefined =
    qualifier === "cold iron" ? "cold-iron" :
      qualifier === "silver" || qualifier === "alchemical silver" ? "alchemical-silver" :
        qualifier === "adamantine" ? "adamantine" : undefined;
  if (!targetMaterial) {
    return {
      status: "manual" as const,
      message: `DR ${amount}/${match[2].trim()} is not a supported single material qualifier; evaluate it manually.`,
    };
  }

  if (isRanged && !traits.thrown) {
    if (!ammunition) {
      return {
        status: "manual" as const,
        message: `DR ${amount}/${qualifier}: this ranged weapon's ammunition material is not configured.`,
      };
    }
    if (compatibleAmmunition.length === 0) {
      return {
        status: "manual" as const,
        message: `DR ${amount}/${qualifier}: no compatible ammunition is in inventory, so bypass cannot be evaluated.`,
      };
    }
    const selectedAmmunition = compatibleAmmunition.find((entry) => entry.key === selectedAmmunitionKey);
    if (!selectedAmmunitionKey || !selectedAmmunition) {
      return {
        status: "manual" as const,
        message: `DR ${amount}/${qualifier}: select a compatible ammunition package to evaluate this attack.`,
      };
    }
    return selectedAmmunition.material === targetMaterial
      ? {
          status: "bypassed" as const,
          message: `DR ${amount}/${qualifier} is bypassed by selected ${selectedAmmunition.name}.`,
        }
      : {
          status: "applies" as const,
          message: `DR ${amount}/${qualifier} applies to selected ${selectedAmmunition.name}.`,
        };
  }

  if (getWeaponMaterial(item, weaponName) === targetMaterial) {
    return {
      status: "bypassed" as const,
      message: `DR ${amount}/${qualifier} is bypassed by this weapon's material.`,
    };
  }
  return {
    status: "applies" as const,
    message: `DR ${amount}/${qualifier} applies to this weapon.`,
  };
}

export function getCombatSpace(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ?? raceDefinitions.human;
  const dimensions = {
    Fine: [0.5, 0], Diminutive: [1, 0], Tiny: [2.5, 0],
    Small: [5, 5], Medium: [5, 5], Large: [10, 10],
    Huge: [15, 15], Gargantuan: [20, 20], Colossal: [30, 30],
  };
  const [space, reach] = dimensions[race.size ?? "Medium"];
  return { space, reach };
}

export function getWeaponReach(character: Character, item: StoreItem) {
  if (item.reach) return item.reach;
  if (item.custom && /\breach\b/i.test(item.specialProperties ?? "")) return "Not recorded";
  const { reach } = getCombatSpace(character);
  const name = getBaseEquipmentName(item.name);
  if (!item.custom && name === "Whip") return "15 ft. (does not threaten)";
  if (!item.custom && reachWeaponNames.has(name)) {
    const distance = reach * 2;
    return name === "Spiked Chain"
      ? `${distance} ft. (also within normal reach)`
      : `${distance} ft. (not within normal reach)`;
  }
  return `${reach} ft.`;
}

export function getStoreItemDescription(item: StoreItem, size = "Medium") {
  if (item.category === "Armor") {
    const name = armorNames.find((entry) => item.name.includes(entry));
    const armorBonus = name ? armorBonuses[name] : item.armorBonus ?? 0;
    const armorClass = name ? armorClasses[name] : `${item.armorCategory ?? "Custom"} armor`;
    const maximumDexterity = name ? armorMaximumDexterity[name] : item.maxDexterity ?? Infinity;
    const checkPenalty = name
      ? armorCheckPenalties[name] - (item.name.startsWith("Masterwork ") ? 1 : 0)
      : item.armorCheckPenalty ?? 0;
    const baseDescription = item.description ? `${item.description} ` : "";
    const masterworkBenefit = item.name.startsWith("Masterwork ")
      ? " Masterwork: armor check penalty reduced by 1."
      : "";
    return `${baseDescription}${armorClass} armor; armor bonus +${armorBonus}; max Dex ${maximumDexterity === Infinity ? "—" : `+${maximumDexterity}`}; armor check penalty ${checkPenalty}; arcane spell failure ${item.arcaneSpellFailure ?? 0}%; speed ${item.armorSpeed ?? "varies"}.${masterworkBenefit}`;
  }
  if (item.category === "Weapons") {
    const profile = getWeaponProfile(item.name);
    const baseWeaponName = item.name.replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "");
    const damageType = item.damageType ?? weaponDamageTypes[item.name] ?? weaponDamageTypes[baseWeaponName] ?? "varies";
    const damage = getWeaponDamageForSize(item, size);
    const criticalValue = item.critical ?? profile.crit;
    const critical = item.custom || criticalValue !== "20/x2" ? `; crit ${criticalValue}` : "";
    const masterworkBenefit = item.name.startsWith("Masterwork ")
      ? " Masterwork: +1 enhancement bonus on attack rolls; this does not add damage."
      : "";
    const rangedDamageAbility = item.rangedDamageAbility === "strength"
      ? "Strength modifier to projectile damage"
      : item.rangedDamageAbility === "strength-penalty-only"
        ? "negative Strength modifier to projectile damage"
        : item.ranged || item.handedness === "Ranged"
          ? "no Strength modifier to projectile damage"
          : "";
    const properties = [
      item.finesse ? "finesse" : "",
      getWeaponRangeForSize(item, size) ? `range ${getWeaponRangeForSize(item, size)}` : "",
      item.thrown ? "thrown" : item.ranged ? "projectile" : "",
      rangedDamageAbility,
      item.reach ? `reach ${item.reach}` : "",
      item.specialProperties ?? "",
    ].filter(Boolean).join(", ");
    return `${item.description ? `${item.description} ` : ""}${damageType}; ${damage} damage${critical}.${properties ? ` Properties: ${properties}.` : ""}${masterworkBenefit}`;
  }
  if (item.description) return item.description;
  if (item.category === "Shields") {
    const name = Object.keys(shieldBonuses).find((entry) => item.name.includes(entry));
    const shieldBonus = name ? shieldBonuses[name] : item.shieldBonus ?? 0;
    const checkPenalty = name
      ? shieldCheckPenalties[name] - (item.name.startsWith("Masterwork ") ? 1 : 0)
      : item.shieldCheckPenalty ?? 0;
    const masterworkBenefit = item.name.startsWith("Masterwork ")
      ? " Masterwork: shield check penalty reduced by 1."
      : "";
    const spikeDescription = item.name.endsWith("with Spikes")
      ? " Shield spikes: piercing bash damage as if the shield were designed for a creature one size category larger."
      : "";
    return `Shield bonus +${shieldBonus}; armor check penalty ${checkPenalty}; arcane spell failure ${item.shieldSpellFailure ?? 0}%; ${item.shieldType ?? "custom"} shield; uses the off hand.${spikeDescription}${masterworkBenefit}`;
  }
  if (item.category === "Ammunition") return "Ammunition used with a compatible ranged weapon.";
  if (item.category === "Instruments") return "A musical instrument used for performance, bardic music, or magical effects.";
  if (item.category === "Tools & Kits") {
    if (item.name === "Masterwork Thieves' Tools") {
      return "+2 circumstance bonus on Disable Device and Open Lock checks.";
    }
    if (item.name === "Masterwork Tool") {
      return "+2 circumstance bonus on checks made with the tool's associated skill.";
    }
    return "A tool or kit used for a specific task.";
  }
  if (item.category === "Consumables") return "A consumable item used once or over a short duration.";
  if (item.category === "Potions, Scrolls & Wands") return "A magical item that provides a spell or magical effect.";
  if (item.category === "Rings") return "A magical ring that occupies a ring slot.";
  if (["Head", "Neck", "Shoulders", "Hands", "Waist", "Feet"].includes(item.category))
    return `A magical item worn in the ${item.category.toLowerCase()} slot.`;
  return "An adventuring item useful during travel or exploration.";
}

export function getSizeStep(size: string) {
  return size === "Small" ? -1 : size === "Large" ? 1 : 0;
}

export function getSizedStorePrice(item: StoreItem, size: string) {
  const step = getSizeStep(size);
  return item.category === "Weapons" || item.category === "Armor" || item.category === "Shields"
    ? item.price * (step === 1 ? 2 : step === -1 ? 0.5 : 1)
    : item.price;
}

export function getSizedStoreWeight(item: StoreItem, size: string) {
  if (item.weight === "—" || item.weight === "varies") return item.weight;
  const numericWeight = Number.parseFloat(item.weight);
  if (Number.isNaN(numericWeight)) return item.weight;
  const multiplier =
    getSizeStep(size) === 1 ? 2 : getSizeStep(size) === -1 ? 0.5 : 1;
  return `${numericWeight * multiplier} lb.`;
}

export function getInventoryEntryDetails(key: string, compositeBowStrengthRating = 0) {
  const match = key.match(/^(.*) \((Small|Medium|Large)\)$/);
  const name = match?.[1] ?? key;
  const size = match?.[2] ?? "Medium";
  const item = findStoreItem(name);
  const baseName = item ? getBaseEquipmentName(item.name) : name;
  const compositeBowRatingCost = baseName === "Composite Longbow"
    ? 100 * compositeBowStrengthRating
    : baseName === "Composite Shortbow" ? 75 * compositeBowStrengthRating : 0;
  const spellName = name.match(/^(?:Wand|Scroll) of (.+?) \(CL /)?.[1];
  const spell = spellName
    ? findSpellByName(spellName)
    : undefined;
  const weight = item ? getSizedStoreWeight(item, size) : "—";
  const numericWeight = Number.parseFloat(weight);
  return {
    name,
    size,
    weight,
    price: item ? getSizedStorePrice(item, size) + compositeBowRatingCost : undefined,
    category: item?.category ?? "Crafted item",
    description: item ? getStoreItemDescription(item, size) : "Inventory item.",
    material: item?.material ?? (item && (item.category === "Weapons" || item.category === "Ammunition")
      ? getMaterialFromName(name)
      : undefined),
    spell,
    numericWeight: Number.isNaN(numericWeight) ? 0 : numericWeight,
    weightKnown: !!item && (weight === "—" || Number.isFinite(numericWeight)),
  };
}

function getCarriedEntries(character: Character) {
  const entries = new Map<string, number>();
  const normalize = (key: string) => key.replace(/ \(Medium\)$/, "");
  for (const [key, quantity] of Object.entries(character.inventory)) {
    entries.set(normalize(key), (entries.get(normalize(key)) ?? 0) + quantity);
  }
  const equipped = new Map<string, number>();
  for (const [slot, key] of Object.entries(character.equipment)) {
    if (!key || slot === "Currency" || slot === "Runestones") continue;
    equipped.set(normalize(key), (equipped.get(normalize(key)) ?? 0) + 1);
  }
  for (const [key, quantity] of equipped) {
    entries.set(key, Math.max(entries.get(key) ?? 0, quantity));
  }
  return [...entries].filter(([, quantity]) => quantity > 0);
}

export function getCarriedWeight(character: Character) {
  return getCarriedEntries(character).reduce((total, [key, quantity]) => {
    const details = getInventoryEntryDetails(key);
    return total + details.numericWeight * quantity;
  }, 0);
}

export function getEncumbrance(character: Character) {
  const capacity = carryingCapacity(character);
  const weight = getCarriedWeight(character);
  const load = weight > capacity.heavy ? "Overloaded" : weight > capacity.medium ? "Heavy" :
    weight > capacity.light ? "Medium" : "Light";
  const unknownWeights = getCarriedEntries(character).filter(([key]) =>
    !getInventoryEntryDetails(key).weightKnown)
    .map(([key]) => key);
  return {
    capacity, weight, load, unknownWeights,
    checkPenalty: load === "Light" ? 0 : load === "Medium" ? -3 : -6,
    maximumDexterity: load === "Light" ? Infinity : load === "Medium" ? 3 : load === "Heavy" ? 1 : 0,
  };
}

function getWornArmor(character: Character) {
  const name = character.equipment.Armor ?? "";
  const item = findStoreItem(name, "Armor");
  const baseName = item?.custom ? undefined : armorNames.find((base) => name.includes(base));
  const category = baseName ? armorClasses[baseName] : item?.armorCategory;
  const movementCategory = baseName?.startsWith("Mithral ")
    ? category === "Heavy" ? "Medium" : "Light" : category;
  return { name, movementCategory, maximumDexterity: baseName ? armorMaximumDexterity[baseName] : item?.maxDexterity ?? Infinity };
}

export function getMovement(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ?? raceDefinitions.human;
  const baseSpeed = race.speed ?? 30;
  const armor = getWornArmor(character);
  const encumbrance = getEncumbrance(character);
  const armorSlows = armor.movementCategory === "Medium" || armor.movementCategory === "Heavy";
  const loadSlows = encumbrance.load !== "Light";
  const causes: string[] = [];
  let speed = baseSpeed;
  if (encumbrance.load === "Overloaded") {
    speed = encumbrance.weight <= encumbrance.capacity.heavy * 2 ? 5 : 0;
    causes.push(speed === 5 ? "Overloaded: 5 ft. per round, full-round action" : "Beyond lifting limit: cannot carry this load");
  } else if (race.id !== "dwarf" && (armorSlows || loadSlows)) {
    speed = baseSpeed === 20 ? 15 : Math.floor(baseSpeed * 2 / 15) * 5;
    if (armorSlows) causes.push(`Armor: ${armor.name}`);
    if (loadSlows) causes.push(`${encumbrance.load} load: ${encumbrance.weight} lb.`);
  }
  return { baseSpeed, speed, causes };
}

export function getArmorClassRestrictions(character: Character) {
  const armor = getWornArmor(character);
  const load = getEncumbrance(character);
  const cap = Math.min(armor.maximumDexterity, load.maximumDexterity);
  if (abilityModifier(getEffectiveAbilityScore(character, "dex")) <= cap) return [];
  const causes = [];
  if (armor.maximumDexterity === cap) causes.push(`${armor.name}: max DEX ${formatModifier(cap)} to AC`);
  if (load.maximumDexterity === cap) causes.push(`${load.load} load: max DEX ${formatModifier(cap)} to AC`);
  return causes;
}

export function getWeaponSizeNote(size: string) {
  return size === "Small"
    ? "smaller damage die; 5-ft. reach"
    : size === "Large"
      ? "larger damage die; 10-ft. reach where applicable"
      : "standard damage die; 5-ft. reach";
}

export function getWeaponProfile(name: string) {
  const baseName = name
    .replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "")
    .replace(/^Repeating (Heavy|Light) Crossbow$/, "Repeating $1 Crossbow");
  return weaponProfiles[name] ?? weaponProfiles[baseName] ?? { damage: "varies", crit: "20/x2" };
}

export type WeaponSlot = "Main Weapon" | "Off Hand Weapon" | "Ranged Weapon";

const projectileWeaponNames = new Set([
  "Shortbow", "Longbow", "Composite Shortbow", "Composite Longbow",
  "Light Crossbow", "Heavy Crossbow", "Hand Crossbow",
  "Repeating Crossbow", "Repeating Light Crossbow", "Repeating Heavy Crossbow", "Sling",
]);

const thrownWeaponNames = new Set([
  "Bolas", "Club", "Dagger", "Dart", "Handaxe", "Javelin", "Light Hammer",
  "Net", "Shuriken", "Short Spear", "Shortspear", "Spear", "Throwing Axe", "Trident",
]);

const creatureSizes = ["Fine", "Diminutive", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan", "Colossal"] as const;
const weaponHandedness = ["light", "one-handed", "two-handed"] as const;

function weaponTraits(item: StoreItem) {
  const baseName = getBaseEquipmentName(item.name);
  const light = item.handedness ? item.handedness === "Light" : lightOffHandWeaponNames.has(baseName);
  const twoHanded = item.handedness ? item.handedness === "Two-handed" : twoHandedWeaponNames.has(baseName);
  const ranged = item.ranged === true || item.handedness === "Ranged" || projectileWeaponNames.has(baseName) ||
    rangedWeaponNames.has(baseName) || baseName === "Net";
  const thrown = item.thrown === true || thrownWeaponNames.has(baseName);
  const finesse = item.finesse ?? (light || ["Rapier", "Whip", "Spiked Chain"].includes(baseName));
  return { baseName, light, twoHanded, ranged, thrown, finesse, doubleWeapon: item.doubleWeapon === true };
}

function getWeaponItemForKey(character: Character, name: string) {
  const shieldBashState = getShieldBashState(character);
  if (shieldBashState.enabled && name === shieldBashState.weaponName) {
    const lightShield = shieldBashState.shieldType === "Light";
    const spiked = shieldBashState.spiked;
    return {
      name,
      category: "Weapons" as const,
      price: 0,
      weight: "—",
      custom: true,
      proficiency: "Martial" as const,
      handedness: lightShield ? "Light" as const : "One-handed" as const,
      finesse: false,
      damage: lightShield ? (spiked ? "1d4" : "1d3") : (spiked ? "1d6" : "1d4"),
      damageSmall: spiked ? undefined : lightShield ? "1d2" : "1d3",
      damageMedium: spiked ? undefined : lightShield ? "1d3" : "1d4",
      damageLarge: spiked ? undefined : lightShield ? "1d4" : "1d6",
      damageType: spiked ? "piercing" : "bludgeoning",
      critical: "x2",
    };
  }
  return findStoreItem(name);
}

export function getWeaponSizeHandling(character: Character, key: string, slot?: WeaponSlot) {
  const name = key.replace(/ \((Small|Medium|Large)\)$/, "");
  const item = getWeaponItemForKey(character, name);
  if (!item || item.category !== "Weapons") return null;
  const weaponSize = key.match(/ \((Small|Medium|Large)\)$/)?.[1] ?? "Medium";
  const characterSize = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")]?.size ?? "Medium";
  const sizeDifference = creatureSizes.indexOf(weaponSize as (typeof creatureSizes)[number]) -
    creatureSizes.indexOf(characterSize);
  const traits = weaponTraits(item);
  const doubleWeaponEnd = character.doubleWeaponMode === true && traits.doubleWeapon &&
    character.equipment?.["Main Weapon"] === key && (slot === "Main Weapon" || slot === "Off Hand Weapon");
  const baseHandedness = doubleWeaponEnd
    ? slot === "Off Hand Weapon" ? 0 : 1
    : traits.light ? 0 : traits.twoHanded ? 2 : 1;
  const adjustedHandedness = weaponHandedness[baseHandedness + sizeDifference];
  const attackPenalty = sizeDifference === 0 ? 0 : -2 * Math.abs(sizeDifference);
  const warning = sizeDifference === 0
    ? undefined
    : adjustedHandedness
      ? `${weaponSize} weapon for ${characterSize} wielder: ${formatModifier(attackPenalty)} attack; treated as ${adjustedHandedness}.`
      : `${weaponSize} weapon cannot be wielded by a ${characterSize} character because its grip falls outside light, one-handed, or two-handed.`;
  return {
    weaponSize,
    characterSize,
    sizeDifference,
    attackPenalty,
    effectiveHandedness: adjustedHandedness ?? null,
    wieldable: adjustedHandedness !== undefined,
    warning,
  };
}

export function getDoubleWeaponModeState(character: Character) {
  const key = character.equipment?.["Main Weapon"];
  if (!key) return null;
  const name = getInventoryEntryDetails(key).name;
  const item = findStoreItem(name);
  if (!item || item.category !== "Weapons" || !weaponTraits(item).doubleWeapon) return null;
  const profile = getWeaponProfile(item.name);
  const hasDifferentEnds = Boolean(
    item.offHandDamage || item.offHandDamageSmall || item.offHandDamageMedium || item.offHandDamageLarge ||
    item.offHandCritical || item.offHandDamageType || profile.offHandDamage || profile.offHandCrit ||
    profile.offHandDamageType,
  );
  return {
    enabled: character.doubleWeaponMode === true,
    canUseBothEnds: !character.equipment?.["Off Hand Weapon"] &&
      (!character.equipment?.Shield || isBucklerEquipped(character)),
    hasDifferentEnds,
    primaryEnd: character.doubleWeaponPrimaryEnd ?? "first",
    firstEndLabel: profile.mainEndLabel ?? item.mainEndLabel ?? "First end",
    secondEndLabel: profile.offHandEndLabel ?? item.offHandEndLabel ?? "Second end",
  };
}

export function getEffectiveWeaponKey(character: Character, slot: WeaponSlot) {
  if (slot !== "Off Hand Weapon" || character.equipment?.["Off Hand Weapon"]) {
    return character.equipment?.[slot];
  }
  const shieldBashState = getShieldBashState(character);
  if (shieldBashState.enabled && shieldBashState.weaponName) {
    return `${shieldBashState.weaponName} (${shieldBashState.weaponSize})`;
  }
  const doubleWeaponMode = getDoubleWeaponModeState(character);
  return doubleWeaponMode?.enabled ? character.equipment?.["Main Weapon"] : undefined;
}

export function isBucklerEquipped(character: Character) {
  const name = character.equipment?.Shield ?? "";
  const item = name ? findStoreItem(name, "Shields") : undefined;
  return Boolean(item && (item.shieldType === "Buckler" || item.name === "Buckler" || name.includes("Buckler")));
}

export function getShieldBashState(character: Character) {
  const shieldName = character.equipment?.Shield ?? "";
  const shield = shieldName ? findStoreItem(shieldName, "Shields") : undefined;
  let shieldType: "Light" | "Heavy" | undefined;
  if (shield?.shieldType === "Light" || shield?.shieldType === "Heavy") {
    shieldType = shield.shieldType;
  } else if (shield?.shieldType === undefined) {
    const baseName = getBaseEquipmentName(shield?.name ?? "").replace(/ with Spikes$/, "");
    if (/^Light (?:Wooden|Steel) Shield$/.test(baseName)) shieldType = "Light";
    if (/^Heavy (?:Wooden|Steel) Shield$/.test(baseName)) shieldType = "Heavy";
  }
  const spiked = Boolean(shield?.name.endsWith("with Spikes"));
  const weaponSize = shieldName ? getInventoryEntryDetails(shieldName).size : "Medium";
  const characterSize = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")]?.size ?? "Medium";
  const shieldSizeDifference = creatureSizes.indexOf(weaponSize as (typeof creatureSizes)[number]) -
    creatureSizes.indexOf(characterSize);
  const bashHandedness = weaponHandedness[
    (shieldType === "Light" ? 0 : 1) + shieldSizeDifference
  ];
  const mainWeaponKey = character.equipment?.["Main Weapon"] ?? "";
  const mainWeaponName = mainWeaponKey.replace(/ \((Small|Medium|Large)\)$/, "");
  const mainWeapon = mainWeaponName ? findStoreItem(mainWeaponName, "Weapons") : undefined;
  const mainWeaponSize = mainWeaponKey.match(/ \((Small|Medium|Large)\)$/)?.[1] ?? "Medium";
  const mainSizeDifference = creatureSizes.indexOf(mainWeaponSize as (typeof creatureSizes)[number]) -
    creatureSizes.indexOf(characterSize);
  const mainTraits = mainWeapon ? weaponTraits(mainWeapon) : undefined;
  const mainHandedness = mainTraits
    ? weaponHandedness[
      (mainTraits.light ? 0 : mainTraits.twoHanded ? 2 : 1) + mainSizeDifference
    ]
    : undefined;
  const mainUsesTwoHands = mainHandedness === "two-handed" ||
    (mainHandedness === "one-handed" && character.mainWeaponGrip === "two-handed");
  const canBash = Boolean(
    shieldType &&
      (bashHandedness === "light" || bashHandedness === "one-handed") &&
      !character.equipment?.["Off Hand Weapon"] &&
      !mainUsesTwoHands &&
      character.doubleWeaponMode !== true,
  );
  const weaponName = shieldType
    ? `${spiked ? "Spiked " : ""}${shieldType} Shield Bash`
    : undefined;
  return {
    canBash,
    hasBashableShield: Boolean(shieldType),
    enabled: canBash && character.shieldBashMode === true,
    spiked,
    shieldType,
    weaponName,
    weaponSize,
  };
}

export function getMainWeaponGripState(character: Character) {
  const key = character.equipment?.["Main Weapon"];
  if (!key) return null;
  const sizeHandling = getWeaponSizeHandling(character, key);
  if (sizeHandling?.effectiveHandedness !== "one-handed") return null;
  return {
    grip: character.mainWeaponGrip ?? "one-handed",
    canUseTwoHands: !character.equipment?.["Off Hand Weapon"] &&
      (!character.equipment?.Shield || isBucklerEquipped(character)),
  };
}

export function getWeaponCompatibilityWarning(
  character: Character,
  key: string,
  slot: WeaponSlot,
) {
  const name = key.replace(/ \((Small|Medium|Large)\)$/, "");
  const item = getWeaponItemForKey(character, name);
  const sizeHandling = getWeaponSizeHandling(character, key, slot);
  if (!item || item.category !== "Weapons" || !sizeHandling?.wieldable) return null;
  const traits = weaponTraits(item);
  const isDoubleWeaponMode = character.doubleWeaponMode === true && traits.doubleWeapon &&
    character.equipment?.["Main Weapon"] === key;
  const syntheticOffHand = slot === "Off Hand Weapon" && isDoubleWeaponMode &&
    !character.equipment?.["Off Hand Weapon"];
  const shieldBashState = getShieldBashState(character);
  const syntheticShieldBash = slot === "Off Hand Weapon" && shieldBashState.enabled &&
    shieldBashState.weaponName === name && !character.equipment?.["Off Hand Weapon"];
  if (!syntheticOffHand && !syntheticShieldBash && character.equipment?.[slot] !== key) return null;
  const hasShield = Boolean(character.equipment?.Shield);
  const buckler = isBucklerEquipped(character);
  const mainHandedness = getWeaponSizeHandling(
    character,
    character.equipment?.["Main Weapon"] ?? "",
    "Main Weapon",
  );
  const mainUsesTwoHands = mainHandedness?.effectiveHandedness === "two-handed" ||
    (mainHandedness?.effectiveHandedness === "one-handed" && character.mainWeaponGrip === "two-handed");

  if (syntheticShieldBash) {
    return mainUsesTwoHands
      ? "A shield bash is incompatible with a two-handed main-weapon grip."
      : null;
  }

  if (isDoubleWeaponMode) {
    if (character.equipment?.["Off Hand Weapon"]) {
      return "Double-weapon mode uses both ends; unequip the separate off-hand weapon.";
    }
    if (hasShield && !buckler) {
      return "Double-weapon mode uses both hands; equip a buckler or unequip the shield.";
    }
    return null;
  }

  if (slot === "Main Weapon") {
    const usesTwoHands = sizeHandling.effectiveHandedness === "two-handed" ||
      (sizeHandling.effectiveHandedness === "one-handed" && character.mainWeaponGrip === "two-handed");
    if (usesTwoHands && character.equipment?.["Off Hand Weapon"]) {
      return "A two-handed grip is incompatible with an off-hand weapon.";
    }
    if (usesTwoHands && hasShield && !buckler) {
      return "A non-buckler shield occupies your off hand; use a one-handed grip or unequip the shield.";
    }
  } else if (slot === "Off Hand Weapon") {
    if (mainUsesTwoHands) return "An off-hand weapon is incompatible with a two-handed main-weapon grip.";
    if (hasShield && !buckler) return "A non-buckler shield occupies your off hand.";
  } else if (
    slot === "Ranged Weapon" &&
    hasShield &&
    !buckler &&
    (weaponTraits(item).twoHanded || sizeHandling.effectiveHandedness === "two-handed")
  ) {
    return "A non-buckler shield occupies one hand required by this ranged weapon.";
  }
  return null;
}

function getEquipmentCheckPenalty(name: string, slot: "Armor" | "Shield") {
  const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
  const names = slot === "Armor" ? armorNames : shieldNames;
  const penalties = slot === "Armor" ? armorCheckPenalties : shieldCheckPenalties;
  const baseName = item?.custom ? undefined : names.find((base) => name.includes(base));
  const penalty = baseName ? penalties[baseName] :
    -Math.abs((slot === "Armor" ? item?.armorCheckPenalty : item?.shieldCheckPenalty) ?? 0);
  const masterwork = /Masterwork|\+\d+/.test(name) && !baseName?.startsWith("Mithral ");
  return Math.min(0, penalty + (masterwork ? 1 : 0));
}

function finesseShieldPenalty(character: Character) {
  const shield = character.equipment?.Shield;
  return shield ? getEquipmentCheckPenalty(shield, "Shield") : 0;
}

export function getArmorShieldProficiencies(character: Character, excludingSlot?: string) {
  const proficiencies = new Set(getChosenFeats(character, excludingSlot));
  for (const { classId } of character.classLevels) {
    if (["fighter", "paladin", "cleric"].includes(classId)) proficiencies.add("armor-proficiency-heavy");
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "ranger"].includes(classId)) {
      proficiencies.add("armor-proficiency-medium");
    }
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "ranger", "bard", "rogue", "noble"].includes(classId)) {
      proficiencies.add("armor-proficiency-light");
    }
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "ranger", "bard"].includes(classId)) {
      proficiencies.add("shield-proficiency");
    }
    if (classId === "fighter") proficiencies.add("tower-shield-proficiency");
  }
  return proficiencies;
}

export function isArmorShieldProficient(character: Character, item: StoreItem) {
  const proficiencies = getArmorShieldProficiencies(character);
  if (item.category === "Shields") {
    const tower = item.towerShieldProficiency || item.shieldType === "Tower" || item.name.includes("Tower Shield");
    return proficiencies.has(tower ? "tower-shield-proficiency" : "shield-proficiency");
  }
  if (item.category === "Armor") {
    const baseName = item.custom ? undefined : armorNames.find((name) => item.name.includes(name));
    const category = baseName ? armorClasses[baseName] : item.armorCategory;
    return category ? proficiencies.has(`armor-proficiency-${category.toLowerCase()}`) : false;
  }
  return false;
}

export function getArmorNonproficiencyPenalties(character: Character) {
  return (["Armor", "Shield"] as const).flatMap((slot) => {
    const name = character.equipment[slot];
    if (!name) return [];
    const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
    if (!item || isArmorShieldProficient(character, item)) return [];
    const penalty = getEquipmentCheckPenalty(name, slot);
    return penalty < 0 ? [{ source: `${slot.toLowerCase()} (nonprof.)`, name, penalty, multiplier: 1 }] : [];
  });
}

export function getEquippedWeaponStats(
  character: Character,
  key: string,
  attackPenalty = 0,
  slot: WeaponSlot = "Main Weapon",
  targetTypes: CombatTargetType[] = [],
  targetDistanceFeet?: number,
  targetDamageReduction?: string,
  selectedAmmunitionKey?: string,
) {
  const name = key.replace(/ \((Small|Medium|Large)\)$/, "");
  const size = key.match(/ \((Small|Medium|Large)\)$/)?.[1] ?? "Medium";
  const item = getWeaponItemForKey(character, name);
  const sizeHandling = getWeaponSizeHandling(character, key, slot);
  if (!item || item.category !== "Weapons" || !sizeHandling?.wieldable || !sizeHandling.effectiveHandedness) return null;
  if (getWeaponCompatibilityWarning(character, key, slot)) return null;
  const towerShieldState = getTowerShieldState(character);
  if (towerShieldState.coverActive) return null;
  const profile = getWeaponProfile(item.name);
  const traits = weaponTraits(item);
  const doubleWeaponMode = character.doubleWeaponMode === true && traits.doubleWeapon &&
    character.equipment?.["Main Weapon"] === key &&
    (slot === "Main Weapon" || (slot === "Off Hand Weapon" && !character.equipment?.["Off Hand Weapon"]));
  const usesAlternateEnd = doubleWeaponMode &&
    (slot === "Main Weapon"
      ? character.doubleWeaponPrimaryEnd === "second"
      : character.doubleWeaponPrimaryEnd !== "second");
  const endLabel = usesAlternateEnd
    ? profile.offHandEndLabel ?? item.offHandEndLabel
    : profile.mainEndLabel ?? item.mainEndLabel;
  const displayName = doubleWeaponMode && endLabel ? `${name} (${endLabel})` : name;
  const isRanged = slot === "Ranged Weapon" || traits.ranged;
  const twoHandedGrip = !doubleWeaponMode && (sizeHandling.effectiveHandedness === "two-handed" ||
    (slot === "Main Weapon" && sizeHandling.effectiveHandedness === "one-handed" &&
      character.mainWeaponGrip === "two-handed"));
  const strength = abilityModifier(getEffectiveAbilityScore(character, "str"));
  const dexterity = abilityModifier(getEffectiveAbilityScore(character, "dex"));
  const shieldPenalty = finesseShieldPenalty(character);
  const characterSize = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")]?.size ?? "Medium";
  const usesFinesse = !isRanged && traits.finesse &&
    size === characterSize && getChosenFeats(character).includes("weapon-finesse") &&
    dexterity + shieldPenalty > strength;
  const enhancement = Number(name.match(/\+(\d+)/)?.[1] ?? 0);
  const masterwork = item.name.startsWith("Masterwork ") ? 1 : 0;
  const attackEnhancement = Math.max(enhancement, masterwork);
  const baseAttackBonus = getBaseAttackBonus(character);
  const abilityAttackBonus = isRanged || usesFinesse ? dexterity : strength;
  const sizeAttackBonus = sizeModifier(character);
  const finessePenalty = usesFinesse ? shieldPenalty : 0;
  const towerShieldAttackPenalty = towerShieldState.equipped ? -2 : 0;
  const nonproficiencyPenalties = [
    ...getArmorNonproficiencyPenalties(character),
    ...(isWeaponProficient(character, item)
      ? []
      : [{ source: "weapon (nonprof.)", name: item.name, penalty: -4, multiplier: 1 }]),
  ];
  const nonproficiencyPenalty = nonproficiencyPenalties.reduce((total, entry) => total + entry.penalty, 0);
  const activeAttack = getCombatEffectModifier(character, "attack");
  const activeDamage = getCombatEffectModifier(character, "damage");
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  const targetAttackBonus = Math.max(
    0,
    ...targetTypes.map((targetType) => race?.racialAttackBonuses?.[targetType] ?? 0),
  );
  const matchingTarget = targetTypes.find(
    (targetType) => race?.racialAttackBonuses?.[targetType] === targetAttackBonus && targetAttackBonus > 0,
  );
  const thrownAttackBonus = race?.id === "halfling" && isRanged &&
    (traits.thrown || traits.baseName === "Sling") ? 1 : 0;
  const compositeBowStrengthRating = traits.baseName === "Composite Longbow" ||
    traits.baseName === "Composite Shortbow"
    ? character.compositeBowStrengthRatings?.[key] ?? 0
    : undefined;
  const compositeBowStrengthPenalty = compositeBowStrengthRating !== undefined &&
    strength < compositeBowStrengthRating ? -2 : 0;
  const racialAttackBonus = Math.max(targetAttackBonus, thrownAttackBonus);
  const weaponFeatType = getWeaponFeatTypeName(item.name);
  const weaponFocusBonus = getWarDomainWeapon(character) === weaponFeatType ||
    Object.entries(character.featSelections ?? {}).some(
      ([slotId, featId]) =>
        featId === "weapon-focus" &&
        character.featWeaponSelections?.[slotId] === weaponFeatType,
    ) ? 1 : 0;
  const weaponSpecializationBonus = Object.entries(character.featSelections ?? {}).some(
    ([slotId, featId]) =>
      featId === "weapon-specialization" &&
      character.featWeaponSelections?.[slotId] === weaponFeatType,
  ) ? 2 : 0;
  const racialAttackDetails = [
    ...(matchingTarget && targetAttackBonus && race
      ? [`${race.name} vs. ${combatTargetLabels[matchingTarget]} ${formatModifier(targetAttackBonus)} racial`]
      : []),
    ...(thrownAttackBonus && race ? [`${race.name} thrown/slings ${formatModifier(thrownAttackBonus)} racial`] : []),
  ];
  const attack = baseAttackBonus + abilityAttackBonus + sizeAttackBonus + sizeHandling.attackPenalty + attackEnhancement + attackPenalty + finessePenalty + nonproficiencyPenalty + towerShieldAttackPenalty + compositeBowStrengthPenalty + racialAttackBonus + weaponFocusBonus + activeAttack;
  const rangeIncrement = getWeaponRangeForSize(item, size);
  const rangeDetails = getRangedAttackDistanceDetails(item, rangeIncrement, isRanged, targetDistanceFeet);
  const ammunition = getWeaponAmmunitionProfile(item, isRanged);
  const compatibleAmmunition = getCompatibleAmmunition(character, ammunition);
  const ammunitionOptions = isRanged && !traits.thrown && ammunition
    ? compatibleAmmunition
    : undefined;
  const selectedAmmunition = ammunitionOptions?.find((entry) => entry.key === selectedAmmunitionKey);
  const rangedReadiness = getWeaponAmmunitionReadiness(item, isRanged, ammunition, compatibleAmmunition);
  const damageReductionStatus = getTargetDamageReductionStatus(
    targetDamageReduction,
    item,
    name,
    isRanged,
    traits,
    ammunition,
    compatibleAmmunition,
    selectedAmmunitionKey,
  );
  const bucklerAttackPenalty = isBucklerEquipped(character) && !isRanged &&
    (slot === "Off Hand Weapon" || (slot === "Main Weapon" &&
      (twoHandedGrip || Boolean(character.equipment?.["Off Hand Weapon"]) || doubleWeaponMode)))
    ? -1
    : 0;
  const finalAttack = attack + bucklerAttackPenalty + rangeDetails.attackPenalty;
  let damageAbility = strength;
  const customProjectile = item.custom === true && !traits.thrown &&
    (item.ranged === true || item.handedness === "Ranged");
  if (isRanged && (projectileWeaponNames.has(traits.baseName) || customProjectile)) {
    if (traits.baseName === "Sling") {
      damageAbility = strength;
    } else if (compositeBowStrengthRating !== undefined) {
      damageAbility = strength > 0 ? Math.min(strength, compositeBowStrengthRating) : strength;
    } else if (customProjectile) {
      damageAbility = item.rangedDamageAbility === "strength"
        ? strength
        : item.rangedDamageAbility === "strength-penalty-only"
          ? Math.min(0, strength)
          : 0;
    } else {
      damageAbility = traits.baseName.includes("bow") && !traits.baseName.includes("Crossbow")
        ? Math.min(0, strength)
        : 0;
    }
  } else if (strength > 0) {
    damageAbility = Math.floor(strength * (slot === "Off Hand Weapon" ? 0.5 : !isRanged && twoHandedGrip ? 1.5 : 1));
  }
  const weaponMaterial = getWeaponMaterial(item, name);
  const silverWeaponDamagePenalty = weaponMaterial === "alchemical-silver" && (!isRanged || traits.thrown);
  const silverAmmunitionDamagePenalty = selectedAmmunition?.material === "alchemical-silver";
  const silverDamagePenalty = silverWeaponDamagePenalty || silverAmmunitionDamagePenalty ? -1 : 0;
  const damageBonus = damageAbility + enhancement + activeDamage + weaponSpecializationBonus + silverDamagePenalty;
  const damageDice = getWeaponEndDamageForSize(item, size, usesAlternateEnd ? "off-hand" : "main");
  const elementalProperties = [
    ["Flaming", "fire"],
    ["Frost", "cold"],
    ["Shock", "electricity"],
  ].filter(([property]) => name.includes(`${property} `));
  return {
    name: displayName,
    attack: finalAttack,
    attackSequence: rangeDetails.outOfRange ? [] : Array.from(
      { length: slot === "Off Hand Weapon" ? 1 : Math.min(4, Math.max(1, Math.ceil(baseAttackBonus / 5))) },
      (_, index) => finalAttack - index * 5,
    ),
    attackSequenceNote: "BAB-based full attack only; not extra attacks from feats, haste, flurry, or special routines. Off-hand shows one attack. Ranged attacks require ammunition and sufficient reload/draw actions.",
    rangeIncrement,
    rangeLabel: isRanged ? "Range increment" : "Thrown increment",
    rangeAttackPenalty: rangeDetails.attackPenalty,
    maximumRangeFeet: rangeDetails.maximumRangeFeet,
    rangeOutOfRange: rangeDetails.outOfRange,
    rangeStatusMessage: rangeDetails.message,
    ...rangedReadiness,
    ammunitionOptions: ammunitionOptions?.map(({ key, name, quantity }) => ({ key, name, quantity })),
    selectedAmmunitionKey: selectedAmmunition?.key,
    damageReductionStatus,
    reach: isRanged ? undefined : getWeaponReach(character, item),
    damage: damageDice === "—" || damageDice === "varies" ? damageDice :
      `${damageDice}${damageBonus >= 0 ? `+${damageBonus}` : damageBonus}`,
    materialDamageNote: silverAmmunitionDamagePenalty
      ? "Alchemical silver ammunition: -1 damage (minimum 1)."
      : silverWeaponDamagePenalty ? "Alchemical silver: -1 damage (minimum 1)." : undefined,
    damageType: usesAlternateEnd
      ? item.offHandDamageType ?? profile.offHandDamageType ?? item.damageType ?? weaponDamageTypes[traits.baseName] ?? "varies"
      : item.damageType ?? weaponDamageTypes[traits.baseName] ?? "varies",
    critical: usesAlternateEnd
      ? item.offHandCritical ?? profile.offHandCrit ?? item.critical ?? profile.crit
      : item.critical ?? profile.crit,
    baseAttackBonus,
    abilityAttackBonus,
    enhancement,
    attackEnhancement,
    activeAttack,
    activeDamage,
    sizeAttackBonus,
    weaponSizePenalty: sizeHandling.attackPenalty,
    weaponSizeDetail: sizeHandling.warning,
    effectiveHandedness: sizeHandling.effectiveHandedness,
    twoHandedGrip,
    bucklerAttackPenalty,
    towerShieldAttackPenalty,
    racialAttackBonus,
    racialAttackDetails,
    weaponFocusBonus,
    weaponSpecializationBonus,
    damageAbility,
    attackPenalty,
    compositeBowStrengthRating,
    compositeBowStrengthPenalty,
    finessePenalty,
    nonproficiencyPenalty,
    nonproficiencyPenalties,
    enchantmentDamage: elementalProperties.map(([property, damageType]) => `${property}: 1d6 ${damageType} damage`),
  };
}

export function getTwoWeaponAttackPenalty(character: Character, slot: "Main Weapon" | "Off Hand Weapon") {
  const mainWeapon = character.equipment?.["Main Weapon"];
  const offHandWeapon = getEffectiveWeaponKey(character, "Off Hand Weapon");
  if (!mainWeapon || !offHandWeapon) return 0;
  const hasFeat = getChosenFeats(character).includes("two-weapon-fighting");
  const offHandName = getInventoryEntryDetails(offHandWeapon).name;
  const offHandItem = findStoreItem(offHandName);
  const offHandSize = getWeaponSizeHandling(character, offHandWeapon, "Off Hand Weapon");
  if (offHandSize && !offHandSize.wieldable) return 0;
  const light = offHandSize
    ? offHandSize.effectiveHandedness === "light"
    : offHandItem ? weaponTraits(offHandItem).light : lightOffHandWeaponNames.has(getBaseEquipmentName(offHandName));
  const basePenalty = slot === "Main Weapon" ? -6 : -10;
  const featReduction = hasFeat ? (slot === "Main Weapon" ? 2 : 6) : 0;
  return basePenalty + (light ? 2 : 0) + featReduction;
}

export function getBaseEquipmentName(name: string) {
  return name.replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "");
}

const elfWeaponNames = new Set([
  "Longsword", "Rapier", "Longbow", "Composite Longbow", "Shortbow", "Composite Shortbow",
]);
const bardWeaponNames = new Set([
  "Longsword", "Rapier", "Sap", "Short Sword", "Shortbow", "Composite Shortbow", "Whip",
]);
const druidWeaponNames = new Set([
  "Club", "Dagger", "Dart", "Quarterstaff", "Scimitar", "Sickle", "Short Spear", "Shortspear", "Sling", "Spear",
]);
const monkWeaponNames = new Set([
  "Club", "Dagger", "Handaxe", "Javelin", "Kama", "Nunchaku", "Quarterstaff", "Sai",
  "Shuriken", "Siangham", "Sling", "Light Crossbow", "Heavy Crossbow", "Unarmed Strike",
]);
const rogueWeaponNames = new Set([
  "Hand Crossbow", "Rapier", "Sap", "Shortbow", "Composite Shortbow", "Short Sword",
]);
const wizardWeaponNames = new Set(["Club", "Dagger", "Heavy Crossbow", "Light Crossbow", "Quarterstaff"]);
const broadWeaponPrestigeClasses = new Set<PrestigeClassId>([
  "arcane-archer", "duelist", "dwarven-defender",
]);
const specificPrestigeWeaponNames: Partial<Record<PrestigeClassId, ReadonlySet<string>>> = {
  assassin: new Set([
    "Dagger", "Dart", "Hand Crossbow", "Heavy Crossbow", "Light Crossbow",
    "Rapier", "Sap", "Shortbow", "Composite Shortbow", "Short Sword",
  ]),
  shadowdancer: new Set([
    "Club", "Dagger", "Dart", "Hand Crossbow", "Heavy Crossbow", "Light Crossbow",
    "Light Mace", "Heavy Mace", "Mace", "Morningstar", "Quarterstaff", "Rapier",
    "Sap", "Shortbow", "Composite Shortbow", "Short Sword",
  ]),
};

function getWeaponProficiencyCategory(character: Character, item: StoreItem) {
  if (item.category !== "Weapons") return undefined;
  const baseName = getBaseEquipmentName(item.name);
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  if (race?.id === "elf" && elfWeaponNames.has(baseName)) return "Martial";

  let proficiency = item.custom
    ? item.proficiency
    : simpleWeaponNames.has(baseName)
      ? "Simple"
      : martialWeaponNames.has(baseName)
        ? "Martial"
        : "Exotic";
  if (
    (race?.id === "dwarf" && ["Dwarven Waraxe", "Dwarven Urgrosh"].includes(baseName)) ||
    (race?.id === "gnome" && baseName === "Gnome Hooked Hammer")
  ) {
    proficiency = "Martial";
  }
  return proficiency;
}

function hasPrestigeClassWeaponProficiency(
  character: Character,
  proficiency: string | undefined,
  baseName: string,
) {
  const grantsProficiency = (prestigeClassId: PrestigeClassId) => {
    if (dragonlancePrestigeClasses[prestigeClassId]?.source !== "core-35-srd") return false;
    if (broadWeaponPrestigeClasses.has(prestigeClassId)) {
      return proficiency === "Simple" || proficiency === "Martial";
    }
    return specificPrestigeWeaponNames[prestigeClassId]?.has(baseName) ?? false;
  };
  return character.classLevels.some((level) =>
    "prestigeClassId" in level && grantsProficiency(level.prestigeClassId),
  ) || Boolean(character.prestigeClass && grantsProficiency(character.prestigeClass));
}

export function isWeaponProficient(
  character: Character,
  item: StoreItem,
  excludingFeatSlot?: string,
) {
  if (item.category !== "Weapons") return true;
  const weaponType = getWeaponFeatTypeName(item.name);
  const proficiency = getWeaponProficiencyCategory(character, item);
  if (proficiency === "Martial" && weaponType === getWarDomainWeapon(character)) return true;
  if (
    proficiency === "Exotic" &&
    Object.entries(character.featSelections ?? {}).some(
      ([slotId, featId]) =>
        slotId !== excludingFeatSlot &&
        featId === "exotic-weapon-proficiency" &&
        character.featWeaponSelections?.[slotId] === weaponType,
    )
  )
  return true;
  const baseName = getBaseEquipmentName(item.name);
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  if (race?.id === "elf" && elfWeaponNames.has(baseName)) return true;
  if (hasPrestigeClassWeaponProficiency(character, proficiency, baseName)) return true;

  return character.classLevels.some(({ classId }) => {
    if (martialWeaponClasses.has(classId)) return proficiency === "Simple" || proficiency === "Martial";
    if (classId === "bard") return proficiency === "Simple" || bardWeaponNames.has(baseName);
    if (classId === "cleric" || classId === "sorcerer" || classId === "mystic" || classId === "noble") {
      return proficiency === "Simple";
    }
    if (classId === "druid") return druidWeaponNames.has(baseName);
    if (classId === "monk") return monkWeaponNames.has(baseName);
    if (classId === "rogue") return proficiency === "Simple" || rogueWeaponNames.has(baseName);
    if (classId === "wizard") return wizardWeaponNames.has(baseName);
    return false;
  });
}

export function getItemProficiencyWarning(character: Character, item: StoreItem) {
  if (item.category === "Instruments" || item.category === "Adventuring Gear") return null;
  const classIds = character.classLevels.map((entry) => entry.classId);
  if (item.category === "Weapons") {
    return isWeaponProficient(character, item)
      ? null
      : `${item.name}: this character is not proficient with this weapon and will take the normal nonproficiency penalties.`;
  }
  if (item.category === "Armor" || item.category === "Shields") {
    const metal = /chain|scale|breastplate|plate|steel|mithral|metal|splint/i.test(item.name);
    const druidRestriction = classIds.includes("druid") && metal
      ? " Druid restriction: prohibited metal equipment prevents druid spellcasting and supernatural/spell-like class abilities while used and for 24 hours afterward; resolve this restriction manually."
      : "";
    const warning = isArmorShieldProficient(character, item)
      ? "" : `${item.name}: this character is not proficient with this ${item.category === "Armor" ? "armor" : "shield"}. Its check penalty applies to attacks and Strength/Dexterity checks.`;
    return `${warning}${druidRestriction}`.trim() || null;
  }
  return null;
}

export function formatRaceModifiers(modifiers: Partial<Record<AbilityName, number>>) {
  const entries = Object.entries(modifiers).filter(([, value]) => value);
  if (!entries.length) return "no ability modifiers";
  return entries
    .map(
      ([ability, value]) =>
        `${ability.toUpperCase()} ${Number(value) > 0 ? "+" : ""}${value}`,
    )
    .join(", ");
}

export function formatRaceDetails(race: (typeof raceDefinitions)[string]) {
  const abilities = race.specialAbilities ?? race.traits ?? [];
  return `${formatRaceModifiers(race.abilityModifiers)}; Size ${race.size ?? "Medium"}; Speed ${race.speed ?? 30} ft.; ${abilities.length ? abilities.join(", ") : "No special abilities recorded"}`;
}

export function isClassSkill(
  character: Character,
  skill: string,
  classId?: ClassId,
) {
  const classIds = classId
    ? [classId]
    : character.classLevels.map((entry) => entry.classId);
  return classIds.some((classId) => classSkills[classId]?.includes(skill) ||
    (classId === "cleric" && isClericDomainClassSkill(character, skill)));
}

export function getAvailableSkillCount(character: Character) {
  let available = 0;
  character.classLevels.forEach((entry, index) => {
    const classDefinition = classDefinitions[entry.classId];
    if (!classDefinition) return;
    const pointsPerLevel = Math.max(
      1,
      classDefinition.skillPoints +
        abilityModifier(character.abilities.int) +
        (character.race.toLowerCase() === "human" ? 1 : 0),
    );
    available += pointsPerLevel * (entry.level + (index === 0 ? 3 : 0));
  });
  return available;
}

export function getSkillPointsPerLevel(character: Character, classId: ClassId) {
  const classDefinition = classDefinitions[classId];
  return Math.max(
    1,
    classDefinition.skillPoints +
      abilityModifier(character.abilities.int) +
      (character.race.toLowerCase() === "human" ? 1 : 0),
  );
}

export function getLevelUpSpellWarnings(original: Character, proposed: Character) {
  const classId = proposed.classLevels.find((entry) => {
    const originalEntry = original.classLevels.find(
      (candidate) => candidate.classId === entry.classId,
    );
    return entry.level > (originalEntry?.level ?? 0);
  })?.classId;
  if (!classId || !classDefinitions[classId].spellcasting) return [];
  const originalLevel = Math.max(
    0,
    ...original.classLevels
      .filter((entry) => entry.classId === classId)
      .map((entry) => entry.level),
  );
  const proposedLevel = Math.max(
    0,
    ...proposed.classLevels
      .filter((entry) => entry.classId === classId)
      .map((entry) => entry.level),
  );
  if (proposedLevel <= originalLevel) return [];
  const classSpells = getClassSpells(classId);
  const selectedCount = (character: Character, level: number) =>
    (getClassSpellSelections(character, "knownSpells")[classId] ?? []).filter((spellName) =>
      classSpells.some(
        (spell) =>
          spell.name === spellName &&
          spell.level === level,
      ),
    ).length;
  const spellLevelName = (level: number) =>
    level === 0
      ? "0-level"
      : `${level}${level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th"}-level`;
  const warnings: string[] = [];
  if (classId === "bard" || classId === "sorcerer") {
    for (let level = 0; level <= 9; level += 1) {
      const base = getKnownSpellLimit(proposed, classId, proposedLevel, level);
      const originalBase = getKnownSpellLimit(original, classId, originalLevel, level);
      const required = Math.max(0, base - originalBase);
      const originalSelected = selectedCount(original, level);
      const proposedSelected = selectedCount(proposed, level);
      const missing = Math.max(
        0,
        required - Math.max(0, proposedSelected - originalSelected),
      );
      if (missing) warnings.push(`Learn ${missing} additional ${spellLevelName(level)} ${classDefinitions[classId].name} spell${missing === 1 ? "" : "s"}.`);
    }
  } else if (classId === "wizard") {
    const missing = getWizardFreeSpellAllowance(proposed, original).remaining;
    if (missing) warnings.push(`Add ${missing} Wizard spell${missing === 1 ? "" : "s"} to the spellbook (${originalLevel === 0 ? "1st-level starting spells" : "any accessible spell level"}).`);
  } else {
    return warnings;
  }
  return warnings;
}

export function getLevelUpClassId(original: Character, proposed: Character): ClassId {
  return (
    proposed.classLevels.find((entry) => {
      const originalEntry = original.classLevels.find(
        (candidate) => candidate.classId === entry.classId,
      );
      return entry.level > (originalEntry?.level ?? 0);
    })?.classId ?? "fighter"
  );
}

export function getNewLevelUpFeatSlots(original: Character, proposed: Character) {
  const originalSlots = new Set(getFeatSlots(original).map((slot) => slot.id));
  return getFeatSlots(proposed).filter((slot) => !originalSlots.has(slot.id));
}

export function getLevelUpSkillWarnings(original: Character, proposed: Character) {
  const classId = getLevelUpClassId(original, proposed);
  const newSkillPoints =
    getAvailableSkillCount(proposed) - getAvailableSkillCount(original);
  const newSkillRanks =
    getLevelUpSpentSkillPoints(original, proposed, classId) -
    getSpentSkillPoints(original);
  if (newSkillRanks < newSkillPoints)
    return [
      `Spend all new skill points (${newSkillPoints - newSkillRanks} remaining).`,
    ];
  return [];
}

export function getSpentSkillPoints(character: Character) {
  return Object.entries(character.skills).reduce((total, [skill, ranks]) => {
    let remainingRanks = Math.max(0, Number(ranks || 0));
    let spent = 0;
    const classIds = new Set(character.classLevels.map((entry) => entry.classId));
    for (const classId of classIds) {
      const attributedRanks = Math.min(
        remainingRanks,
        Math.max(0, Number(character.skillRanksByClass?.[classId]?.[skill] || 0)),
      );
      spent += attributedRanks * (isClassSkill(character, skill, classId) ? 1 : 2);
      remainingRanks -= attributedRanks;
    }
    // Older saves may contain ranks without a class-level attribution.
    spent += remainingRanks * (isClassSkill(character, skill) ? 1 : 2);
    return total + spent;
  }, 0);
}

export function getLevelUpSpentSkillPoints(
  original: Character,
  proposed: Character,
  classId: ClassId,
) {
  const addedCost = skills.reduce((total, skill) => {
    const addedRanks = Math.max(
      0,
      Number(proposed.skills[skill] || 0) - Number(original.skills[skill] || 0),
    );
    return total + addedRanks * (isClassSkill(proposed, skill, classId) ? 1 : 2);
  }, 0);
  return getSpentSkillPoints(original) + addedCost;
}

export function getSkillMaximum(character: Character, skill: string) {
  const characterLevel = character.classLevels.reduce(
    (total, entry) => total + entry.level,
    0,
  );
  return isClassSkill(character, skill)
    ? characterLevel + 3
    : (characterLevel + 3) / 2;
}

export function getBaseAttackBonus(character: Character) {
  return character.classLevels.reduce((total, entry) => {
    const progression = classDefinitions[entry.classId]?.baseAttackBonus;
    if (!progression) return total;
    return (
      total +
      (progression === "good"
        ? entry.level
        : progression === "medium"
          ? Math.floor(entry.level * 0.75)
          : Math.floor(entry.level * 0.5))
    );
  }, 0);
}

export function getBaseSave(
  character: Character,
  save: "fortitude" | "reflex" | "will",
) {
  return character.classLevels.reduce((total, entry) => {
    const progression = classDefinitions[entry.classId]?.[save];
    if (!progression) return total;
    return total + (progression === "good" ? 2 + Math.floor(entry.level / 2) : Math.floor(entry.level / 3));
  }, 0);
}

export function getSavingThrow(
  character: Character,
  save: "fortitude" | "reflex" | "will",
  conditions: SavingThrowCondition[] = [],
) {
  const ability = { fortitude: "con", reflex: "dex", will: "wis" } as const;
  const base = getBaseSave(character, save);
  const abilityBonus = abilityModifier(getEffectiveAbilityScore(character, ability[save]));
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  const racialBonus = race?.racialSavingThrowBonus ?? 0;
  const matchingCondition = conditions.find(
    (condition) => (race?.racialSituationalSaveBonuses?.[condition] ?? 0) > 0,
  );
  const situationalBonus = matchingCondition
    ? race?.racialSituationalSaveBonuses?.[matchingCondition] ?? 0
    : 0;
  const resistance = getEquipmentDefenseBonuses(character).resistance;
  const activeSaves = getCombatEffectModifier(character, "saves");
  const breakdown = `Base ${formatModifier(base)} · ${ability[save].toUpperCase()} ${formatModifier(abilityBonus)}${racialBonus ? ` · racial ${formatModifier(racialBonus)}` : ""}${matchingCondition ? ` · ${matchingCondition} ${matchingCondition === "fear" ? "morale" : "racial"} ${formatModifier(situationalBonus)}` : ""}`;
  return {
    total: base + abilityBonus + racialBonus + situationalBonus + resistance.bonus + activeSaves,
    detail: `${breakdown}${resistance.bonus ? ` · resistance ${formatModifier(resistance.bonus)}` : ""}${activeSaves ? ` · active effects ${formatModifier(activeSaves)}` : ""}`,
    title: [breakdown, conditions.length ? `Context: ${conditions.join(", ")}` : "Select context for situational racial bonuses.", ...getAbilityEquipmentBonus(character, ability[save]).detail, ...resistance.detail, ...getCombatEffectDetails(character, "saves"), "Active effects are applied as entered; check bonus types and situational limits."].join("\n"),
  };
}

const recordedClassFeatureNames = new Set([
  ...Object.values(startingClassFeatures).flat(),
  "Improved Unarmed Strike",
]);
const definedClassFeatureNames = new Set([
  ...Object.values(classFeatureProgression).flatMap((entries) =>
    (entries ?? []).flatMap((entry) => entry.features),
  ),
  ...recordedClassFeatureNames,
]);

export function getClassFeatureDisplay(character: Character) {
  const earnedFeatures = character.classLevels.flatMap((entry) => {
    if ("prestigeClassId" in entry && entry.prestigeClassId) return [];
    const definition = classDefinitions[entry.classId];
    return (classFeatureProgression[entry.classId] ?? [])
      .filter((progression) => progression.level <= entry.level)
      .flatMap((progression) =>
        progression.features.map((feature) => ({
          source: `${definition.name} ${progression.level}`,
          ability: feature,
        })),
      );
  });
  const recordedFeatures = [
    ...new Set(character.classFeatures ?? []),
  ]
    .filter((feature) => !definedClassFeatureNames.has(feature))
    .map((ability) => ({ source: "Recorded feature", ability }));
  return [...earnedFeatures, ...recordedFeatures];
}

export function getFeatSlots(character: Character) {
  const slots: { id: string; label: string; fighterOnly: boolean }[] = [];
  const level = character.classLevels.reduce(
    (total, entry) => total + entry.level,
    0,
  );
  for (let slotLevel = 1; slotLevel <= level; slotLevel += 1) {
    if (slotLevel === 1 || slotLevel % 3 === 0)
      slots.push({
        id: `general-${slotLevel}`,
        label: `General feat (level ${slotLevel})`,
        fighterOnly: false,
      });
  }
  if (character.race.toLowerCase() === "human")
    slots.push({
      id: "human-1",
      label: "Human bonus feat",
      fighterOnly: false,
    });
  character.classLevels
    .filter((entry) => entry.classId === "fighter")
    .forEach((entry) => {
      for (let classLevel = 1; classLevel <= entry.level; classLevel += 1) {
        if (classLevel === 1 || classLevel % 2 === 0)
          slots.push({
            id: `fighter-${classLevel}`,
            label: `Fighter bonus feat (fighter level ${classLevel})`,
            fighterOnly: true,
          });
      }
    });
  return slots;
}

export function getChosenFeats(character: Character, excludingSlot?: string) {
  const chosenFeats = Object.entries(character.featSelections ?? {})
    .filter(([slotId, featId]) => slotId !== excludingSlot && featId)
    .map(([, featId]) => featId);
  if (getWarDomainWeapon(character) && !chosenFeats.includes("weapon-focus"))
    chosenFeats.push("weapon-focus");
  return chosenFeats;
}

const repeatableWeaponFeats = new Set([
  "exotic-weapon-proficiency",
  "weapon-focus",
  "weapon-specialization",
]);
const weaponSelectionFeats = new Set(repeatableWeaponFeats);

function getWeaponFeatTypeName(name: string) {
  return /^(?:Spiked )?(?:Light|Heavy) Shield Bash$/.test(name)
    ? "Shield Bash"
    : getBaseEquipmentName(name);
}

export function getAvailableFeatWeaponChoices(
  character: Character,
  featId: string,
  excludingSlot?: string,
) {
  if (!weaponSelectionFeats.has(featId)) return [];
  if (
    featId === "weapon-specialization" &&
    character.classLevels
      .filter((entry) =>
        entry.classId === "fighter" &&
        !("prestigeClassId" in entry && entry.prestigeClassId),
      )
      .reduce((total, entry) => total + entry.level, 0) < 4
  )
    return [];
  const weaponItems = [...storeItems, ...(character.customItems ?? [])]
    .filter((item) => item.category === "Weapons");
  const weaponsByType = new Map<string, StoreItem>();
  weaponItems.forEach((item) => {
    const weaponType = getWeaponFeatTypeName(item.name);
    if (!weaponsByType.has(weaponType) || item.name === weaponType)
      weaponsByType.set(weaponType, item);
  });
  weaponsByType.set("Shield Bash", {
    name: "Shield Bash",
    category: "Weapons",
    custom: true,
    proficiency: "Martial",
    price: 0,
    weight: "—",
  });

  const selectedWeapons = new Set(
    Object.entries(character.featSelections ?? {})
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === featId)
      .map(([slotId]) => character.featWeaponSelections?.[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  if (featId === "weapon-focus") {
    const warWeapon = getWarDomainWeapon(character);
    if (warWeapon) selectedWeapons.add(warWeapon);
  }
  const focusedWeapons = new Set(
    Object.entries(character.featSelections ?? {})
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === "weapon-focus")
      .map(([slotId]) => character.featWeaponSelections?.[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  const warWeapon = getWarDomainWeapon(character);
  if (warWeapon) focusedWeapons.add(warWeapon);

  return [...weaponsByType.entries()]
    .filter(([weaponType, item]) =>
      (featId === "exotic-weapon-proficiency"
        ? getWeaponProficiencyCategory(character, item) === "Exotic" &&
          !isWeaponProficient(character, item, excludingSlot)
        : isWeaponProficient(character, item)) &&
      !selectedWeapons.has(weaponType) &&
      (featId !== "weapon-specialization" || focusedWeapons.has(weaponType)),
    )
    .map(([weaponType]) => weaponType)
    .sort((left, right) => left.localeCompare(right));
}

export function featQualifies(
  character: Character,
  feat: FeatDefinition,
  slot: { fighterOnly: boolean },
  excludingSlot?: string,
) {
  if (slot.fighterOnly && !feat.fighterBonus) return false;
  const prerequisites = feat.prerequisites;
  if (
    prerequisites?.baseAttackBonus &&
    getBaseAttackBonus(character) < prerequisites.baseAttackBonus
  )
    return false;
  const casterLevel = Math.max(
    0,
    ...character.classLevels
      .filter((entry) => !("prestigeClassId" in entry && entry.prestigeClassId))
      .map((entry) => getCasterLevel(entry.classId, entry.level)),
  );
  if (prerequisites?.casterLevel && casterLevel < prerequisites.casterLevel)
    return false;
  if (
    prerequisites?.classLevels &&
    Object.entries(prerequisites.classLevels).some(([classId, requiredLevel]) =>
      character.classLevels
        .filter((entry) =>
          entry.classId === classId &&
          !("prestigeClassId" in entry && entry.prestigeClassId),
        )
        .reduce((total, entry) => total + entry.level, 0) < requiredLevel,
    )
  )
    return false;
  if (
    prerequisites?.abilities &&
    Object.entries(prerequisites.abilities).some(
      ([ability, score]) => getEffectiveAbilityScore(character, ability as AbilityName) < score,
    )
  )
    return false;
  const chosenFeats = [...getArmorShieldProficiencies(character, excludingSlot)];
  return !(prerequisites?.feats ?? []).some(
    (requiredFeat) => !chosenFeats.includes(requiredFeat),
  );
}

export function getAvailableFeats(
  character: Character,
  slot: { fighterOnly: boolean },
  excludingSlot?: string,
) {
  const chosenFeats = [...getArmorShieldProficiencies(character, excludingSlot)];
  return featCatalog.filter(
    (feat) =>
      (!chosenFeats.includes(feat.id) || repeatableWeaponFeats.has(feat.id)) &&
      featQualifies(character, feat, slot, excludingSlot) &&
      (!weaponSelectionFeats.has(feat.id) ||
        getAvailableFeatWeaponChoices(character, feat.id, excludingSlot).length > 0),
  );
}

export function normalizeFeatSelections(
  character: Character,
  selections: Record<string, string>,
) {
  const normalized: Record<string, string> = {};
  getFeatSlots(character).forEach((slot) => {
    const featId = selections[slot.id];
    const feat = featCatalog.find((entry) => entry.id === featId);
    const chosenFeats = getChosenFeats(
      { ...character, featSelections: normalized },
      slot.id,
    );
    if (
      feat &&
      (!chosenFeats.includes(feat.id) || repeatableWeaponFeats.has(feat.id)) &&
      featQualifies(
        { ...character, featSelections: normalized },
        feat,
        slot,
        slot.id,
      ) &&
      (feat.id !== "weapon-specialization" ||
        getAvailableFeatWeaponChoices(
          { ...character, featSelections: normalized },
          feat.id,
          slot.id,
        ).length > 0)
    )
      normalized[slot.id] = feat.id;
  });
  return normalized;
}

export function normalizeFeatWeaponSelections(
  character: Character,
  selections: Record<string, string>,
) {
  const normalized: Record<string, string> = {};
  getFeatSlots(character).forEach((slot) => {
    const featId = character.featSelections?.[slot.id];
    const weapon = selections[slot.id];
    if (!featId || !weaponSelectionFeats.has(featId) || !weapon) return;
    const context = { ...character, featWeaponSelections: normalized };
    if (getAvailableFeatWeaponChoices(context, featId, slot.id).includes(weapon))
      normalized[slot.id] = weapon;
  });
  return normalized;
}

export function getFeatWeaponSelectionWarnings(
  character: Character,
  slots = getFeatSlots(character),
) {
  return slots.flatMap((slot) => {
    const featId = character.featSelections?.[slot.id];
    if (!featId || !weaponSelectionFeats.has(featId)) return [];
    const weapon = character.featWeaponSelections?.[slot.id];
    return weapon &&
      getAvailableFeatWeaponChoices(character, featId, slot.id).includes(weapon)
      ? []
      : [`Choose a valid weapon for ${slot.label}.`];
  });
}

export function canIncreaseSkillRank(
  character: Character,
  skill: string,
  levelUpOriginal?: Character,
  levelUpClassId?: ClassId,
  creationMode = false,
) {
  const currentRanks = Number(character.skills[skill] || 0);
  const activeLevelUpClassId = levelUpOriginal
    ? levelUpClassId ?? getLevelUpClassId(levelUpOriginal, character)
    : undefined;
  const pointCost = isClassSkill(character, skill, activeLevelUpClassId) ? 1 : 2;
  const rankIncrease = pointCost === 1 ? 1 : 0.5;
  const availableSkillPoints = levelUpOriginal
    ? getAvailableSkillCount(levelUpOriginal) +
      getSkillPointsPerLevel(levelUpOriginal, activeLevelUpClassId ?? "fighter")
    : getAvailableSkillCount(character);
  const spentSkillPoints = levelUpOriginal
    ? getLevelUpSpentSkillPoints(
        levelUpOriginal,
        character,
        activeLevelUpClassId ?? "fighter",
      )
    : getSpentSkillPoints(character);
  const maximumRanks = creationMode
    ? (isClassSkill(character, skill, activeLevelUpClassId) ? 4 : 2)
    : getSkillMaximum(character, skill);
  return (
    currentRanks + rankIncrease <= maximumRanks &&
    spentSkillPoints + 1 <=
      availableSkillPoints
  );
}

export function getAssignedSkillRanks(
  character: Character,
  skill: string,
  levelUpOriginal?: Character,
) {
  const ranks = Number(character.skills[skill] || 0);
  return levelUpOriginal
    ? Math.max(0, ranks - Number(levelUpOriginal.skills[skill] || 0))
    : ranks;
}

export function getSkillAbility(skill: string): AbilityName | null {
  const dexteritySkills = [
    "Balance",
    "Escape Artist",
    "Hide",
    "Move Silently",
    "Open Lock",
    "Ride",
    "Sleight of Hand",
    "Tumble",
    "Use Rope",
  ];
  const constitutionSkills = ["Concentration"];
  const intelligenceSkills = [
    "Appraise",
    "Craft",
    "Decipher Script",
    "Disable Device",
    "Forgery",
    "Search",
    "Spellcraft",
  ];
  const wisdomSkills = [
    "Heal",
    "Listen",
    "Profession",
    "Sense Motive",
    "Spot",
    "Survival",
  ];
  const charismaSkills = [
    "Bluff",
    "Diplomacy",
    "Disguise",
    "Gather Information",
    "Handle Animal",
    "Intimidate",
    "Perform (act)",
    "Perform (comedy)",
    "Perform (dance)",
    "Perform (keyboard instruments)",
    "Perform (mime)",
    "Perform (oratory)",
    "Perform (percussion instruments)",
    "Perform (sing)",
    "Perform (string instruments)",
    "Perform (wind instruments)",
    "Use Magic Device",
  ];
  const strengthSkills = ["Climb", "Jump", "Swim"];
  if (skill === "Speak Language") return null;
  if (dexteritySkills.includes(skill)) return "dex";
  if (constitutionSkills.includes(skill)) return "con";
  if (intelligenceSkills.includes(skill) || skill.startsWith("Knowledge ("))
    return "int";
  if (wisdomSkills.includes(skill)) return "wis";
  if (charismaSkills.includes(skill)) return "cha";
  if (strengthSkills.includes(skill)) return "str";
  return null;
}

export function getSkillUse(character: Character, skill: string) {
  const ranks = Number(character.skills[skill] || 0);
  const trained = ranks >= 1;
  if (skill === "Speak Language") {
    return { ranks, trained, untrainedUse: "special" as const, usable: false,
      label: "No skill check", description: "Speak Language has no skill checks. Use the Languages section for languages your character knows." };
  }
  const limitation = skill.startsWith("Knowledge (")
    ? "Intelligence checks for common knowledge only (DC 10 or lower)."
    : limitedUntrainedSkills[skill];
  const untrainedUse = limitation ? "limited" as const : trainedOnlySkills.has(skill) ? "none" as const : "allowed" as const;
  const usable = trained || untrainedUse !== "none";
  return {
    ranks, trained, untrainedUse, usable,
    label: trained ? "Trained - usable" : untrainedUse === "none" ? "Training required" :
      untrainedUse === "limited" ? "Untrained - limited use" : "Untrained - usable",
    description: trained
      ? "At least 1 rank invested. Skill-specific task restrictions still apply."
      : limitation ?? (usable ? "May attempt this skill without ranks." : "At least 1 rank is required to attempt this skill."),
  };
}

const armorPenaltySkills = new Set([
  "Balance", "Climb", "Escape Artist", "Hide", "Jump", "Move Silently",
  "Sleight of Hand", "Tumble", "Swim",
]);

export function getSkillCheckPenalties(character: Character, skill: string) {
  if (!getSkillUse(character, skill).usable) return [];
  if (!armorPenaltySkills.has(skill)) {
    const ability = getSkillAbility(skill);
    return ability === "str" || ability === "dex" ? getArmorNonproficiencyPenalties(character) : [];
  }
  const multiplier = skill === "Swim" ? 2 : 1;
  const equipment = (["Armor", "Shield"] as const).flatMap((slot) => {
    const name = character.equipment[slot];
    if (!name) return [];
    const penalty = getEquipmentCheckPenalty(name, slot) * multiplier;
    return penalty < 0 ? [{ source: slot.toLowerCase(), name, penalty, multiplier }] : [];
  });
  const encumbrance = getEncumbrance(character);
  const loadPenalty = encumbrance.checkPenalty * multiplier;
  const armorPenalty = equipment.reduce((total, entry) => total + entry.penalty, 0);
  return loadPenalty < armorPenalty
    ? [{ source: "load", name: `${encumbrance.load} load (${encumbrance.weight} lb.)`, penalty: loadPenalty, multiplier }]
    : equipment;
}

export function getSkillCheckModifier(character: Character, skill: string): number | null {
  const use = getSkillUse(character, skill);
  if (!use.usable) return null;
  const ability = getSkillAbility(skill);
  const abilityBonus = ability ? abilityModifier(getEffectiveAbilityScore(character, ability)) : 0;
  const penalty = getSkillCheckPenalties(character, skill).reduce((total, entry) => total + entry.penalty, 0);
  const activeChecks = getCombatEffectModifier(character, "checks");
  if (!use.trained && use.untrainedUse === "limited") return abilityBonus + penalty + activeChecks;
  return abilityBonus + Math.floor(use.ranks) + getRacialSkillBonus(character, skill) + penalty + activeChecks;
}

export function getRacialSkillBonus(character: Character, skill: string) {
  const race =
    raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
  return race?.racialSkillBonuses?.[skill] ?? 0;
}

export function getCharacterRace(character: Character) {
  return (
    raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")]?.name ??
    character.race
  );
}

export function getSkillTotalTooltip(character: Character, skill: string) {
  const ability = getSkillAbility(skill);
  const abilityBonus = ability
    ? abilityModifier(getEffectiveAbilityScore(character, ability))
    : 0;
  const racialBonus = getRacialSkillBonus(character, skill);
  const ranks = Number(character.skills[skill] || 0);
  const rankBreakdown = Object.entries(character.skillRanksByClass ?? {})
    .map(([classId, classSkills]) => ({
      classId,
      ranks: Number(classSkills[skill] || 0),
    }))
    .filter((entry) => entry.ranks > 0);
  const trackedRanks = rankBreakdown.reduce(
    (total, entry) => total + entry.ranks,
    0,
  );
  const lines = [
    getSkillUse(character, skill).label,
    getSkillUse(character, skill).description,
    ...getSkillCheckPenalties(character, skill).map((entry) =>
      `${entry.name}: ${entry.penalty} ${entry.source} check penalty${entry.multiplier === 2 ? " (doubled for Swim)" : ""}`),
    ...(ability
      ? [`${abilityLabels[ability]}: ${formatModifier(abilityBonus)}`, ...getAbilityEquipmentBonus(character, ability).detail]
      : []),
    ...getCombatEffectDetails(character, "checks"),
    racialBonus
      ? `${getCharacterRace(character)}: ${formatModifier(racialBonus)}`
      : "",
    ...(rankBreakdown.length
      ? rankBreakdown.map(
          (entry) =>
            `${classDefinitions[entry.classId as ClassId]?.name ?? entry.classId}: ${entry.ranks}`,
        )
      : []),
    ...(trackedRanks < ranks
      ? [`Unattributed ranks: ${ranks - trackedRanks}`]
      : []),
    ...(ranks % 1 !== 0 ? ["Half ranks do not increase the check modifier or satisfy the 1-rank training requirement."] : []),
  ];
  return lines.filter(Boolean).join("\n");
}

export function formatClassDetails(
  classDefinition: (typeof classDefinitions)[ClassId],
) {
  const attack =
    classDefinition.baseAttackBonus === "good"
      ? "good"
      : classDefinition.baseAttackBonus;
  const saves = [
    classDefinition.fortitude === "good" ? "Fortitude" : "",
    classDefinition.reflex === "good" ? "Reflex" : "",
    classDefinition.will === "good" ? "Will" : "",
  ].filter(Boolean);
  return `d${classDefinition.hitDie} Hit Die; ${attack} base attack; ${saves.length ? `${saves.join(", ")} good save${saves.length > 1 ? "s" : ""}` : "no good saves"}; ${classDefinition.skillPoints} skill points per level; ${classDefinition.spellcasting ? "spellcasting class" : "non-spellcasting class"}.`;
}

export function formatPrestigeClassDetails(
  prestigeClass: (typeof dragonlancePrestigeClasses)[PrestigeClassId],
) {
  const prerequisites = prestigeClass.prerequisites;
  const requirements = [
    prerequisites.bab ? `BAB +${prerequisites.bab}` : "",
    prerequisites.ability
      ? Object.entries(prerequisites.ability)
          .map(([ability, score]) => `${ability.toUpperCase()} ${score}`)
          .join(", ")
      : "",
    prerequisites.classes?.length
      ? prerequisites.classes
          .map((classId) => classDefinitions[classId].name)
          .join(" or ")
      : "",
    prerequisites.races?.length ? prerequisites.races.join(" or ") : "",
    prerequisites.feats?.length ? prerequisites.feats.join(", ") : "",
  ].filter(Boolean);
  return `${requirements.length ? `Prerequisites: ${requirements.join("; ")}. ` : ""}Features: ${prestigeClass.features.join(", ")}.`;
}

export function isPrestigeClassEligible(
  definition: (typeof dragonlancePrestigeClasses)[PrestigeClassId],
  classId: ClassId,
  race: string,
) {
  const prerequisites = definition.prerequisites;
  const raceId = race.toLowerCase().replaceAll(" ", "-");
  return (
    (!prerequisites.classes?.length || prerequisites.classes.includes(classId)) &&
    (!prerequisites.races?.length || prerequisites.races.includes(raceId))
  );
}

export function isNeutralAlignment(alignment: string) {
  return alignment === "True Neutral" || alignment.startsWith("Neutral ") || alignment.endsWith(" Neutral");
}

export function isClassAlignmentAllowed(classId: ClassId, alignment: string) {
  if (classId === "barbarian" || classId === "bard")
    return !alignment.startsWith("Lawful ");
  if (classId === "monk") return alignment.startsWith("Lawful ");
  if (classId === "paladin") return alignment === "Lawful Good";
  if (classId === "druid") return isNeutralAlignment(alignment);
  return true;
}

export function getClassAlignmentRestriction(classId: ClassId) {
  if (classId === "barbarian" || classId === "bard") return "must be non-lawful";
  if (classId === "monk") return "must be lawful";
  if (classId === "paladin") return "must be Lawful Good";
  if (classId === "druid") return "must be neutral on at least one alignment axis";
  return "";
}

export function getLevelUpAlignmentWarnings(character: Character, classId: ClassId) {
  if (isClassAlignmentAllowed(classId, character.alignment)) return [];
  return [
    `Cannot take a ${classDefinitions[classId].name} level with ${character.alignment}; this class ${getClassAlignmentRestriction(classId)}.`,
  ];
}

export function isHighSorceryAlignmentAllowed(order: Character["highSorceryOrder"], alignment: string) {
  if (order === "white") return alignment.endsWith(" Good") || alignment === "Good";
  if (order === "black") return alignment.endsWith(" Evil") || alignment === "Evil";
  return order === "red" ? isNeutralAlignment(alignment) : true;
}

export function alignmentDistance(first: string, second: string) {
  const axes = (alignment: string) => ({
    law: alignment.startsWith("Lawful ") ? -1 : alignment.startsWith("Chaotic ") ? 1 : 0,
    moral: alignment.endsWith(" Good") ? 1 : alignment.endsWith(" Evil") ? -1 : 0,
  });
  const left = axes(first);
  const right = axes(second);
  return Math.max(Math.abs(left.law - right.law), Math.abs(left.moral - right.moral));
}

export function heightToTotalInches(height: string | undefined) {
  const match = (height ?? "").match(/^(\d+)\s*ft\.?\s*(\d+)\s*in\.?$/i);
  if (match) return Number(match[1]) * 12 + Math.min(11, Number(match[2]));
  const legacyInches = Number(height);
  return Number.isFinite(legacyInches) ? Math.max(0, legacyInches) : 0;
}

export function formatModifier(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function adjustWandCharges(
  character: Character,
  key: string,
  change: number,
  onEquipmentAndInventoryChange: (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => void,
) {
  const match = key.match(/^(.*\(CL \d+, )(\d+)( charges\))$/);
  if (!match) return;
  const nextCharges = Math.max(0, Math.min(50, Number(match[2]) + change));
  if (nextCharges === Number(match[2])) return;
  const nextKey = `${match[1]}${nextCharges}${match[3]}`;
  const inventory = { ...(character.inventory ?? {}) };
  const quantity = inventory[key] ?? 0;
  delete inventory[key];
  inventory[nextKey] = (inventory[nextKey] ?? 0) + quantity;
  const equipment = Object.fromEntries(
    Object.entries(character.equipment ?? {}).map(([slot, value]) => [
      slot,
      value === key ? nextKey : value,
    ]),
  );
  onEquipmentAndInventoryChange(equipment, inventory);
}

export function removeInventoryItem(
  character: Character,
  key: string,
  onEquipmentAndInventoryChange: (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => void,
) {
  const inventory = { ...(character.inventory ?? {}) };
  if (inventory[key] <= 1) delete inventory[key];
  else inventory[key] -= 1;
  const itemName = getInventoryEntryDetails(key).name;
  const equipment = Object.fromEntries(
    Object.entries(character.equipment ?? {}).filter(
      ([, value]) => value !== key && getInventoryEntryDetails(value).name !== itemName,
    ),
  );
  onEquipmentAndInventoryChange(equipment, inventory);
}

export function equipInventoryItem(
  character: Character,
  key: string,
  onEquipmentChange: (equipment: Record<string, string>) => void,
) {
  const itemName = getInventoryEntryDetails(key).name;
  const item = findStoreItem(itemName);
  if (item) {
    const proficiencyWarning = getItemProficiencyWarning(character, item);
    if (proficiencyWarning) {
      window.alert(proficiencyWarning);
    }
  }
  let slot = "Miscellaneous";
  const nextEquipment = { ...(character.equipment ?? {}) };
  const mainItem = findStoreItem(getInventoryEntryDetails(nextEquipment["Main Weapon"] ?? "").name);
  const mainWeaponSize = nextEquipment["Main Weapon"]
    ? getWeaponSizeHandling(character, nextEquipment["Main Weapon"])
    : null;
  const mainIsTwoHanded = mainWeaponSize
    ? mainWeaponSize.effectiveHandedness === "two-handed"
    : mainItem ? weaponTraits(mainItem).twoHanded : false;
  if (item?.category === "Shields") {
    const buckler = item.shieldType === "Buckler" || item.name.includes("Buckler");
    const rangedKey = nextEquipment["Ranged Weapon"];
    const rangedItem = rangedKey
      ? findStoreItem(getInventoryEntryDetails(rangedKey).name)
      : undefined;
    const rangedSize = rangedKey ? getWeaponSizeHandling(character, rangedKey) : null;
    const rangedNeedsTwoHands = rangedItem?.category === "Weapons" &&
      (weaponTraits(rangedItem).twoHanded || rangedSize?.effectiveHandedness === "two-handed");
    if ((mainIsTwoHanded || rangedNeedsTwoHands) && !buckler) {
      window.alert("A two-handed weapon requires both hands. Equip a buckler or unequip the weapon first.");
      return;
    }
    slot = "Shield";
    if (!buckler) delete nextEquipment["Off Hand Weapon"];
  } else if (item?.category === "Armor") slot = "Armor";
  else if (item?.name.startsWith("Bracers of Armor")) slot = "Arms";
  else if (item?.name.startsWith("Ring of ")) slot = nextEquipment["Rings 1"] ? "Rings 2" : "Rings 1";
  else if (item?.name.startsWith("Headband of ")) slot = "Head";
  else if (item?.name.startsWith("Cloak of ")) slot = "Shoulders";
  else if (item?.category === "Neck") slot = "Neck";
  else if (item?.category === "Hands") slot = "Hands";
  else if (item?.category === "Waist") slot = "Waist";
  if (item?.category === "Weapons") {
    const traits = weaponTraits(item);
    const itemSize = getWeaponSizeHandling(character, key);
    if (traits.ranged) {
      if ((traits.twoHanded || itemSize?.effectiveHandedness === "two-handed") &&
          nextEquipment.Shield && !isBucklerEquipped({ ...character, equipment: nextEquipment })) {
        window.alert("This ranged weapon requires both hands. Equip a buckler or unequip the shield first.");
        return;
      }
      slot = "Ranged Weapon";
    } else if (itemSize?.effectiveHandedness === "two-handed") {
      if (nextEquipment.Shield && !isBucklerEquipped({ ...character, equipment: nextEquipment })) {
        window.alert("A two-handed weapon requires both hands. Equip a buckler or unequip the shield first.");
        return;
      }
      slot = "Main Weapon";
      delete nextEquipment["Off Hand Weapon"];
      delete nextEquipment["Ranged Weapon"];
    } else if (!character.equipment?.["Main Weapon"] || mainIsTwoHanded) slot = "Main Weapon";
    else if (character.equipment?.Shield && !isBucklerEquipped(character)) {
      window.alert("A shield occupies your off hand, so this weapon cannot be equipped in Off Hand Weapon. Unequip the shield first.");
      return;
    } else if (
      character.equipment?.["Main Weapon"] === key &&
      (character.inventory?.[key] ?? 0) < 2
    ) {
      window.alert("You only own one of this weapon, so it cannot be equipped in both hands.");
      return;
    } else {
      slot = window.confirm("Your Main Weapon slot is occupied. Equip this weapon in Off Hand Weapon?")
        ? "Off Hand Weapon"
        : "Main Weapon";
    }
  }
  nextEquipment[slot] = key;
  onEquipmentChange(nextEquipment);
}

export function unequipInventoryItem(
  character: Character,
  key: string,
  onEquipmentChange: (equipment: Record<string, string>) => void,
) {
  const nextEquipment = Object.fromEntries(
    Object.entries(character.equipment ?? {}).filter(([, value]) => value !== key),
  );
  onEquipmentChange(nextEquipment);
}

export function formatSpellSchool(school?: string) {
  const abbreviations: Record<string, string> = {
    Abjuration: "Abj",
    Conjuration: "Conj",
    Divination: "Div",
    Enchantment: "Ench",
    Evocation: "Evoc",
    Illusion: "Ill",
    Necromancy: "Necro",
    Transmutation: "Trans",
    Universal: "Univ",
  };
  return school ? abbreviations[school] ?? school : "";
}

export function formatSpellDuration(duration: string) {
  return duration
    .replace(/Concentration/gi, "Con")
    .replace(/Permanent/gi, "Perm")
    .replace(/Instantaneous/gi, "Inst")
    .replace(/rounds?/gi, "rds")
    .replace(/minutes?/gi, "min")
    .replace(/hours?/gi, "hr")
    .replace(/days?/gi, "day")
    .replace(/weeks?/gi, "wk")
    .replace(/months?/gi, "mo")
    .replace(/years?/gi, "yr");
}
