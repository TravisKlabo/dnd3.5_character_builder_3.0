import { languageCatalog, dragonlanceLanguages, racialLanguages, classSkills, skills, featCatalog, abilityLabels, trainedOnlySkills, limitedUntrainedSkills } from "./data/characterCatalog";
import { type Character, abilityModifier, type ClassId, carryingCapacity, sizeModifier, raceDefinitions, type AbilityName, classDefinitions, type FeatDefinition, dragonlancePrestigeClasses, type PrestigeClassId } from "./domain";
import { spellProgressions, bardKnownProgression, sorcererKnownProgression } from "./data/spellProgression";
import { armorBonuses, findStoreItem, shieldBonuses, armorMaximumDexterity, weaponDamageBySize, type StoreItem, armorClasses, armorCheckPenalties, weaponDamageTypes, shieldCheckPenalties, weaponProfiles, rangedWeaponNames, lightOffHandWeaponNames, simpleWeaponNames, martialWeaponNames, martialWeaponClasses, twoHandedWeaponNames, weaponRangeIncrements, reachWeaponNames, armorSpellFailure, shieldSpellFailure } from "./data/equipmentCatalog";
import { findSpellByName, getClassSpells } from "./data/spellCatalog";
import { isClericDomainClassSkill } from "./clericDomains";
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

export function getRacialLanguages(character: Character) {
  const raceId = character.race.toLowerCase().replaceAll(" ", "-");
  return racialLanguages[raceId] ?? ["Common"];
}

export function getLanguageBonusSlots(character: Character) {
  return (
    Math.max(0, abilityModifier(character.abilities.int)) +
    (character.race === "Human" ? 1 : 0)
  );
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
  return { decipherDC: 20 + level, learningDC: 15 + level, pages,
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

export function getArmorClassValues(character: Character) {
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
  const shieldBonus = (shieldBaseName ? shieldBonuses[shieldBaseName] : 0) +
      (shieldEnhancement ? Number(shieldEnhancement) : 0);
  const dexterity = Math.min(abilityModifier(getEffectiveAbilityScore(character, "dex")), maximumDexterityBonus);
  const bonuses = getEquipmentDefenseBonuses(character);
  const deflection = bonuses.deflection.bonus;
  const naturalArmorEnhancement = bonuses.naturalArmorEnhancement.bonus;
  const activeArmorClass = getCombatEffectModifier(character, "armorClass");
  const base = 10 + sizeModifier(character);
  const retainsDexterity = character.classLevels.some(({ classId, level }) =>
    (classId === "barbarian" && level >= 2) || (classId === "rogue" && level >= 4)) ||
    (character.classFeatures ?? []).some((feature) => /\buncanny dodge\b/i.test(feature));
  return {
    normal: base + armorBonus + shieldBonus + dexterity + deflection + naturalArmorEnhancement + activeArmorClass,
    touch: base + dexterity + deflection + activeArmorClass,
    flatFooted: base + armorBonus + shieldBonus + (retainsDexterity ? dexterity : Math.min(0, dexterity)) + deflection + naturalArmorEnhancement + activeArmorClass,
    retainsDexterity,
    detail: [
      `Base 10; armor ${formatModifier(armorBonus)}; shield ${formatModifier(shieldBonus)}; DEX ${formatModifier(dexterity)}; size ${formatModifier(sizeModifier(character))}`,
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
  const shield = findStoreItem(character.equipment.Shield ?? "", "Shields");
  const towerPenalty = shield && (shield.towerShieldProficiency || shield.shieldType === "Tower" ||
    shield.name.includes("Tower Shield")) ? -2 : 0;
  const meleeAbility = feats.includes("weapon-finesse")
    ? Math.max(strength, dexterity + finesseShieldPenalty(character)) : strength;
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ?? raceDefinitions.human;
  const grappleSizeModifiers = {
    Fine: -16, Diminutive: -12, Tiny: -8, Small: -4, Medium: 0,
    Large: 4, Huge: 8, Gargantuan: 12, Colossal: 16,
  };
  const grappleSize = grappleSizeModifiers[race.size ?? "Medium"];
  const grappleFeat = feats.includes("improved-grapple") ? 4 : 0;
  const penalty = nonproficiency + towerPenalty;
  const attackModifier = getCombatEffectModifier(character, "attack");
  const checkModifier = getCombatEffectModifier(character, "checks");
  const penaltyDetail = [
    ...penalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}: ${entry.name}`),
    ...(towerPenalty ? ["-2 tower shield"] : []),
  ];
  return {
    meleeTouch: base + meleeAbility + size + penalty + attackModifier,
    rangedTouch: base + dexterity + size + penalty + attackModifier,
    grapple: base + strength + grappleSize + grappleFeat + penalty + checkModifier,
    meleeDetail: [`BAB ${formatModifier(base)}`, `${meleeAbility === strength ? "STR" : "DEX with Weapon Finesse (including shield penalty)"} ${formatModifier(meleeAbility)}`, `size ${formatModifier(size)}`, ...penaltyDetail, ...getCombatEffectDetails(character, "attack")].join("; "),
    rangedDetail: [`BAB ${formatModifier(base)}`, `DEX ${formatModifier(dexterity)}`, `size ${formatModifier(size)}`, ...penaltyDetail, ...getCombatEffectDetails(character, "attack")].join("; "),
    grappleDetail: [`BAB ${formatModifier(base)}`, `STR ${formatModifier(strength)}`, `grapple size ${formatModifier(grappleSize)}`, ...(grappleFeat ? ["Improved Grapple +4"] : []), ...penaltyDetail, ...getCombatEffectDetails(character, "checks")].join("; "),
  };
}

export function getSizedWeaponDamage(damage: string, size: string) {
  if (size === "Small") return weaponDamageBySize[damage]?.smaller ?? damage;
  if (size === "Large") return weaponDamageBySize[damage]?.larger ?? damage;
  return damage;
}

export function getWeaponDamageForSize(item: StoreItem, size: string) {
  const customDamage = size === "Small" ? item.damageSmall : size === "Large" ? item.damageLarge : item.damageMedium;
  return customDamage ?? getSizedWeaponDamage(item.damage ?? getWeaponProfile(item.name).damage, size);
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
    const properties = [
      item.finesse ? "finesse" : "",
      getWeaponRangeForSize(item, size) ? `range ${getWeaponRangeForSize(item, size)}` : "",
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
    return `Shield bonus +${shieldBonus}; armor check penalty ${checkPenalty}; arcane spell failure ${item.shieldSpellFailure ?? 0}%; ${item.shieldType ?? "custom"} shield; uses the off hand.${masterworkBenefit}`;
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

export function getInventoryEntryDetails(key: string) {
  const match = key.match(/^(.*) \((Small|Medium|Large)\)$/);
  const name = match?.[1] ?? key;
  const size = match?.[2] ?? "Medium";
  const item = findStoreItem(name);
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
    price: item ? getSizedStorePrice(item, size) : undefined,
    category: item?.category ?? "Crafted item",
    description: item ? getStoreItemDescription(item, size) : "Inventory item.",
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

function weaponTraits(item: StoreItem) {
  const baseName = getBaseEquipmentName(item.name);
  const light = item.handedness ? item.handedness === "Light" : lightOffHandWeaponNames.has(baseName);
  const twoHanded = item.handedness ? item.handedness === "Two-handed" : twoHandedWeaponNames.has(baseName);
  const ranged = item.handedness === "Ranged" || projectileWeaponNames.has(baseName) ||
    rangedWeaponNames.has(baseName) || baseName === "Net";
  const finesse = light || ["Rapier", "Whip", "Spiked Chain"].includes(baseName) || item.finesse === true;
  return { baseName, light, twoHanded, ranged, finesse };
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
) {
  const name = key.replace(/ \((Small|Medium|Large)\)$/, "");
  const size = key.match(/ \((Small|Medium|Large)\)$/)?.[1] ?? "Medium";
  const item = findStoreItem(name);
  if (!item || item.category !== "Weapons") return null;
  const profile = getWeaponProfile(item.name);
  const traits = weaponTraits(item);
  const isRanged = slot === "Ranged Weapon" || traits.ranged;
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
  const nonproficiencyPenalties = getArmorNonproficiencyPenalties(character);
  const nonproficiencyPenalty = nonproficiencyPenalties.reduce((total, entry) => total + entry.penalty, 0);
  const activeAttack = getCombatEffectModifier(character, "attack");
  const activeDamage = getCombatEffectModifier(character, "damage");
  const attack = baseAttackBonus + abilityAttackBonus + sizeAttackBonus + attackEnhancement + attackPenalty + finessePenalty + nonproficiencyPenalty + activeAttack;
  let damageAbility = strength;
  if (isRanged && projectileWeaponNames.has(traits.baseName)) {
    damageAbility = traits.baseName === "Sling" ? strength :
      traits.baseName.includes("bow") && !traits.baseName.includes("Crossbow") ? Math.min(0, strength) : 0;
  } else if (strength > 0) {
    damageAbility = Math.floor(strength * (slot === "Off Hand Weapon" ? 0.5 : !isRanged && traits.twoHanded ? 1.5 : 1));
  }
  const damageBonus = damageAbility + enhancement + activeDamage;
  const damageDice = getWeaponDamageForSize(item, size);
  const elementalProperties = [
    ["Flaming", "fire"],
    ["Frost", "cold"],
    ["Shock", "electricity"],
  ].filter(([property]) => name.includes(`${property} `));
  return {
    name,
    attack,
    attackSequence: Array.from(
      { length: slot === "Off Hand Weapon" ? 1 : Math.min(4, Math.max(1, Math.ceil(baseAttackBonus / 5))) },
      (_, index) => attack - index * 5,
    ),
    attackSequenceNote: "BAB-based full attack only; not extra attacks from feats, haste, flurry, or special routines. Off-hand shows one attack. Ranged attacks require ammunition and sufficient reload/draw actions.",
    rangeIncrement: getWeaponRangeForSize(item, size),
    rangeLabel: isRanged ? "Range increment" : "Thrown increment",
    reach: isRanged ? undefined : getWeaponReach(character, item),
    damage: damageDice === "—" || damageDice === "varies" ? damageDice :
      `${damageDice}${damageBonus >= 0 ? `+${damageBonus}` : damageBonus}`,
    damageType: item.damageType ?? weaponDamageTypes[traits.baseName] ?? "varies",
    critical: item.critical ?? profile.crit,
    baseAttackBonus,
    abilityAttackBonus,
    enhancement,
    attackEnhancement,
    activeAttack,
    activeDamage,
    sizeAttackBonus,
    damageAbility,
    attackPenalty,
    finessePenalty,
    nonproficiencyPenalty,
    nonproficiencyPenalties,
    enchantmentDamage: elementalProperties.map(([property, damageType]) => `${property}: 1d6 ${damageType} damage`),
  };
}

export function getTwoWeaponAttackPenalty(character: Character, slot: "Main Weapon" | "Off Hand Weapon") {
  const mainWeapon = character.equipment?.["Main Weapon"];
  const offHandWeapon = character.equipment?.["Off Hand Weapon"];
  if (!mainWeapon || !offHandWeapon) return 0;
  const hasFeat = getChosenFeats(character).includes("two-weapon-fighting");
  const offHandName = getInventoryEntryDetails(offHandWeapon).name;
  const offHandItem = findStoreItem(offHandName);
  const light = offHandItem ? weaponTraits(offHandItem).light : lightOffHandWeaponNames.has(getBaseEquipmentName(offHandName));
  const basePenalty = slot === "Main Weapon" ? -6 : -10;
  const featReduction = hasFeat ? (slot === "Main Weapon" ? 2 : 6) : 0;
  return basePenalty + (light ? 2 : 0) + featReduction;
}

export function getBaseEquipmentName(name: string) {
  return name.replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "");
}

export function getItemProficiencyWarning(character: Character, item: StoreItem) {
  if (item.category === "Instruments" || item.category === "Adventuring Gear") return null;
  const classIds = character.classLevels.map((entry) => entry.classId);
  if (item.category === "Weapons") {
    if (item.custom && item.proficiency === "Simple") return null;
    const baseName = getBaseEquipmentName(item.name);
    const simple = simpleWeaponNames.has(baseName);
    const martial = item.custom
      ? item.proficiency === "Martial"
      : martialWeaponNames.has(baseName);
    const race = raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")];
    const racialWeapons = race?.id === "dwarf"
      ? ["Dwarven Waraxe", "Warhammer"]
      : race?.id === "elf" || race?.id?.includes("elf")
        ? ["Longsword", "Rapier", "Longbow", "Shortbow"]
        : race?.id === "gnome"
          ? ["Gnome Hooked Hammer"]
          : [];
    const proficient = classIds.some((classId) =>
      simple || (martial && martialWeaponClasses.has(classId)) ||
      (classId === "bard" && ["Longsword", "Rapier", "Shortbow", "Whip"].includes(baseName)) ||
      (classId === "rogue" && ["Rapier", "Hand Crossbow", "Shortbow", "Short Sword", "Sap"].includes(baseName)) ||
      (classId === "monk" && ["Kama", "Nunchaku", "Sai", "Shuriken", "Siangham"].includes(baseName)) ||
      racialWeapons.includes(baseName),
    );
    return proficient ? null : `${item.name}: this character is not proficient with this weapon and will take the normal nonproficiency penalties.`;
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
  return `${formatRaceModifiers(race.abilityModifiers)}; Size ${race.size ?? "not specified"}; ${abilities.length ? abilities.join(", ") : "No special abilities recorded"}`;
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
    return (
      total + Number(ranks || 0) * (isClassSkill(character, skill) ? 1 : 2)
    );
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
    : Math.floor((characterLevel + 3) / 2);
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

export function getSavingThrow(character: Character, save: "fortitude" | "reflex" | "will") {
  const ability = { fortitude: "con", reflex: "dex", will: "wis" } as const;
  const base = getBaseSave(character, save);
  const abilityBonus = abilityModifier(getEffectiveAbilityScore(character, ability[save]));
  const resistance = getEquipmentDefenseBonuses(character).resistance;
  const activeSaves = getCombatEffectModifier(character, "saves");
  const breakdown = `Base ${formatModifier(base)} · ${ability[save].toUpperCase()} ${formatModifier(abilityBonus)}`;
  return {
    total: base + abilityBonus + resistance.bonus + activeSaves,
    detail: `${breakdown}${resistance.bonus ? ` · resistance ${formatModifier(resistance.bonus)}` : ""}${activeSaves ? ` · active effects ${formatModifier(activeSaves)}` : ""}`,
    title: [breakdown, ...getAbilityEquipmentBonus(character, ability[save]).detail, ...resistance.detail, ...getCombatEffectDetails(character, "saves"), "Active effects are applied as entered; check bonus types and situational limits."].join("\n"),
  };
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
  return Object.entries(character.featSelections ?? {})
    .filter(([slotId, featId]) => slotId !== excludingSlot && featId)
    .map(([, featId]) => featId);
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
      !chosenFeats.includes(feat.id) &&
      featQualifies(character, feat, slot, excludingSlot),
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
    if (
      feat &&
      featQualifies(
        { ...character, featSelections: normalized },
        feat,
        slot,
        slot.id,
      )
    )
      normalized[slot.id] = feat.id;
  });
  return normalized;
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
    currentRanks < maximumRanks &&
    spentSkillPoints + pointCost <=
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
  const mainIsTwoHanded = mainItem ? weaponTraits(mainItem).twoHanded : false;
  if (item?.category === "Shields") {
    slot = "Shield";
    delete nextEquipment["Off Hand Weapon"];
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
    if (traits.ranged) slot = "Ranged Weapon";
    else if (traits.twoHanded) {
      slot = "Main Weapon";
      delete nextEquipment["Off Hand Weapon"];
      delete nextEquipment["Ranged Weapon"];
    } else if (!character.equipment?.["Main Weapon"] || mainIsTwoHanded) slot = "Main Weapon";
    else if (character.equipment?.Shield) {
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
