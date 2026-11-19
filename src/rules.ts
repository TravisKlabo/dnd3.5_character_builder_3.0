import { languageCatalog, dragonlanceLanguages, dragonlanceRegionalLanguages, dragonlanceRacialBonusLanguages, racialBonusLanguages, racialLanguages, classSkills, skills, featCatalog, abilityLabels, trainedOnlySkills, limitedUntrainedSkills, untrainedSkillNotes, skillTaskNotes, startingClassFeatures, alternativeClassFeatures } from "./data/characterCatalog";
import { type Character, abilityModifier, type ClassId, carryingCapacity, sizeModifier, raceDefinitions, getApplicableRaceDefinition, type AbilityName, type SavingThrowCondition, type RacialSkillCondition, type CombatTargetType, classDefinitions, deityDefinitions, type DeityDefinition, type FeatDefinition, dragonlancePrestigeClasses, type PrestigeClassId, magicSchools, type MagicSchool, type RulesetId, getTotalHitDice, type SkillRankSourceId, type RangerFavoredEnemyChoice, type RangerFavoredEnemyLevel, type FeatCategory, type SkillTrickCategory, type SkillTrickSelection } from "./domain";
import { skillTrickCatalog, type SkillTrickDefinition } from "./data/skillTricks";
import { isIndependentSpellcastingClass, type SpellcastingClassId } from "./domain";
import { getHierophantAbilityOptions, loremasterSecrets, type LevelUpDraft, type LoremasterSecret } from "./domain";
import { dragonDiscipleBonusLevels, dragonDiscipleVarieties, getDragonDiscipleAbilityBoost } from "./domain";
import { canRepeatHighArcana, highArcanaMinimumSlots, type HighArcanaChoice } from "./domain";
import {
  classFeatureProgression,
  isClassFeatureProgressionLoaded,
  prestigeClassFeatureProgression,
} from "./data/classFeatureProgression";
import { spellProgressions, assassinKnownProgression, bardKnownProgression, sorcererKnownProgression, mysticKnownProgression } from "./data/spellProgression";
import { armorBonuses, shieldBonuses, armorMaximumDexterity, weaponDamageBySize, armorClasses, armorCheckPenalties, weaponDamageTypes, shieldCheckPenalties, weaponProfiles, rangedWeaponNames, lightOffHandWeaponNames, simpleWeaponNames, martialWeaponNames, martialWeaponClasses, twoHandedWeaponNames, weaponRangeIncrements, reachWeaponNames, armorSpellFailure, shieldSpellFailure } from "./data/equipmentRuleData";
import { findStoreItem, getStoreItems } from "./data/equipmentItemRegistry";
import type { StoreItem } from "./data/itemTypes";
import { findSpellByName, getClassSpells, isSpellCatalogLoaded, normalizeSpellName } from "./data/spellCatalog";
import {
  getActiveClericDomains,
  getActiveMysticDomain,
  getMysticDomainSpell,
  getMysticDomainWarnings,
  getWarDomainWeapon,
  isClericDomainClassSkill,
} from "./domainRules";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "./abilityEquipment";
import { getCombatEffectAbilityDetails, getCombatEffectDetails, getCombatEffectModifier } from "./combatEffects";
import { getCurrentHitPoints, getHitPointStatus } from "./hitPoints";
import { getSpellSchoolName } from "./spellFormatting";
import type { SrdSpell } from "./srdSpells";

const core35ContentId = "core-35-srd";
const dragonlanceContentId = "dragonlance-user-pack";
const creatureSizeCategories = [
  "Fine",
  "Diminutive",
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
  "Colossal",
] as const;
const armorNames = Object.keys(armorBonuses).sort((left, right) => right.length - left.length);
const shieldNames = Object.keys(shieldBonuses).sort((left, right) => right.length - left.length);

export function getBaseClassLevels(character: Character) {
  return character.classLevels.filter((entry) => !("prestigeClassId" in entry));
}

export function getBaseClassLevel(character: Character, classId: ClassId) {
  return getBaseClassLevels(character)
    .filter((entry) => entry.classId === classId)
    .reduce((total, entry) => total + entry.level, 0);
}

export function getPrestigeClassLevel(character: Character, prestigeClassId: PrestigeClassId) {
  return Math.max(
    0,
    ...character.classLevels
      .filter((entry) => "prestigeClassId" in entry && entry.prestigeClassId === prestigeClassId)
      .map((entry) => entry.level),
  );
}

export function getSpellcastingClassDefinition(classId: SpellcastingClassId) {
  return isIndependentSpellcastingClass(classId)
    ? { id: classId, name: dragonlancePrestigeClasses[classId].name, spellcasting: true }
    : classDefinitions[classId];
}

export function getSpellcastingClassLevels(character: Character) {
  return character.classLevels.flatMap((entry): { classId: SpellcastingClassId; level: number }[] => {
    if ("prestigeClassId" in entry) {
      return isIndependentSpellcastingClass(entry.prestigeClassId) && entry.level > 0
        ? [{ classId: entry.prestigeClassId, level: entry.level }] : [];
    }
    return classDefinitions[entry.classId].spellcasting ? [entry] : [];
  });
}

export function getRaceDefinitionForCharacter(
  character: Character,
  ruleset: RulesetId = character.ruleset,
) {
  const race = getApplicableRaceDefinition(character.race, ruleset);
  if (!race) return undefined;
  if (["hill-dwarf", "mountain-dwarf", "dark-dwarf"].includes(race.id)) {
    const dwarf = raceDefinitions.dwarf;
    return {
      ...dwarf,
      ...race,
      abilityModifiers: { ...dwarf.abilityModifiers, ...race.abilityModifiers },
      specialAbilities: race.specialAbilities ?? dwarf.specialAbilities,
    };
  }
  if (race.id === "half-elf" && ruleset !== core35ContentId) {
    return {
      ...race,
      racialImmunities: ["sleep"],
      traits: ["Elvensight (low-light vision and darkvision 30 ft.)"],
    };
  }
  return race;
}

export function getRacialHitDiceForCharacter(character: Character) {
  return getRaceDefinitionForCharacter(character)?.racialHitDice;
}

export function getAlternativeClassFeatureOptions(character: Character, classId: ClassId) {
  const definition = classDefinitions[classId];
  const level = getBaseClassLevel(character, classId);
  return alternativeClassFeatures.filter(
    (feature) => feature.className === definition.name && feature.level <= level,
  );
}

export function getAvailableAlternativeClassFeatures(character: Character) {
  return getBaseClassLevels(character).flatMap((entry) =>
    getAlternativeClassFeatureOptions(character, entry.classId).map((feature) => ({
      ...feature,
      classId: entry.classId,
    })),
  );
}

export function getAvailableLanguages(
  ruleset: RulesetId,
) {
  return languageCatalog.filter(
    (language) =>
      ruleset !== core35ContentId || !dragonlanceLanguages.has(language),
  );
}

export function getHumanRegionalLanguages(
  character: Character,
  ruleset: RulesetId = character.ruleset,
) {
  if (
    ruleset === core35ContentId ||
    getRaceDefinitionForCharacter(character, ruleset)?.id !== "human"
  ) {
    return [];
  }
  const availableLanguages = new Set(getAvailableLanguages(ruleset));
  return dragonlanceRegionalLanguages.filter((language) =>
    availableLanguages.has(language),
  );
}

export function getAvailableBonusLanguages(
  character: Character,
  ruleset: RulesetId = character.ruleset,
) {
  const hasRace = getRaceDefinitionForCharacter(character, ruleset);
  const raceId = hasRace?.id ?? character.race.toLowerCase().replaceAll(" ", "-");
  const racialChoices = hasRace
    ? (ruleset !== core35ContentId
      ? dragonlanceRacialBonusLanguages[raceId] ?? racialBonusLanguages[raceId]
      : racialBonusLanguages[raceId])
    : undefined;
  const isDruid = getBaseClassLevel(character, "druid") > 0;
  const isWizard = getBaseClassLevel(character, "wizard") > 0;
  return getAvailableLanguages(ruleset).filter(
    (language) =>
      language !== "Druidic" &&
      (!racialChoices || racialChoices.includes(language) ||
        (isDruid && language === "Sylvan") ||
        (isWizard && language === "Draconic")),
  );
}

export function getRacialLanguages(
  character: Character,
  ruleset: RulesetId = character.ruleset,
) {
  const race = getRaceDefinitionForCharacter(character, ruleset);
  const automaticLanguages = race
    ? racialLanguages[race.id] ?? ["Common"]
    : ["Common"];
  const regionalLanguage = character.regionalLanguage;
  return regionalLanguage &&
    getHumanRegionalLanguages(character, ruleset).includes(regionalLanguage)
    ? [...automaticLanguages, regionalLanguage]
    : automaticLanguages;
}

export function getAutomaticLanguages(
  character: Character,
  ruleset: RulesetId = character.ruleset,
) {
  const languages = getRacialLanguages(character, ruleset);
  const isDruid = character.classLevels.some(
    (level) => !("prestigeClassId" in level) && level.classId === "druid",
  );
  return isDruid ? [...new Set([...languages, "Druidic"])] : languages;
}

function normalizeCharacterLanguage(language: string) {
  if (language === "Kender") return "Kenderspeak";
  if (language === "Minotaur") return "Kothian";
  return language;
}

export function getLanguageBonusSlots(character: Character) {
  return Math.max(0, abilityModifier(character.abilities.int));
}

export function getSpeakLanguageRankCount(character: Character) {
  const ranks = Number(character.skills["Speak Language"] ?? 0);
  return Number.isFinite(ranks) ? Math.max(0, Math.floor(ranks)) : 0;
}

export function getAvailableSpeakLanguages(
  character: Character,
  excludingSpeakLanguageIndex?: number,
) {
  const alreadyKnown = new Set([
    ...getAutomaticLanguages(character),
    ...(character.languages ?? []),
    ...getEarnedLoremasterLanguages(character),
    ...(character.speakLanguages ?? [])
      .slice(0, getSpeakLanguageRankCount(character))
      .filter((_, index) => index !== excludingSpeakLanguageIndex),
  ].map(normalizeCharacterLanguage));
  return getAvailableLanguages(character.ruleset).filter(
    (language) =>
      language !== "Druidic" &&
      language !== "Magius" &&
      !alreadyKnown.has(normalizeCharacterLanguage(language)),
  );
}

export function getSpeakLanguageWarnings(character: Character) {
  const choices = character.speakLanguages ?? [];
  const rankCount = getSpeakLanguageRankCount(character);
  const warnings: string[] = [];
  if (choices.length < rankCount)
    warnings.push(
      `Choose a language for each Speak Language rank (${rankCount - choices.length} unassigned).`,
    );
  if (choices.length > rankCount)
    warnings.push(
      "Remove extra Speak Language choices; only one language is learned per full rank.",
    );

  const availableLanguages = new Set(
    getAvailableLanguages(character.ruleset).map(normalizeCharacterLanguage),
  );
  const alreadyKnown = new Set([
    ...getAutomaticLanguages(character),
    ...(character.languages ?? []),
    ...getEarnedLoremasterLanguages(character),
  ].map(normalizeCharacterLanguage));
  const selectedLanguages = new Set<string>();
  for (const language of choices) {
    const normalized = normalizeCharacterLanguage(language);
    if (language === "Druidic") {
      warnings.push("Druidic is secret and cannot be selected with Speak Language.");
    } else if (language === "Magius") {
      warnings.push("Magius has no spoken form and cannot be selected with Speak Language.");
    } else if (!availableLanguages.has(normalized)) {
      warnings.push(`${language} is unavailable in the active ruleset.`);
    } else if (alreadyKnown.has(normalized)) {
      warnings.push(`${language} is already known; choose another Speak Language.`);
    } else if (selectedLanguages.has(normalized)) {
      warnings.push(`${language} is selected more than once for Speak Language.`);
    }
    selectedLanguages.add(normalized);
  }
  return [...new Set(warnings)];
}

export function getCharacterLanguages(character: Character) {
  const automaticLanguages = getAutomaticLanguages(character);
  const availableLanguages = new Set(
    getAvailableLanguages(character.ruleset).map(normalizeCharacterLanguage),
  );
  const characterLanguages = (character.languages ?? [])
    .map(normalizeCharacterLanguage)
    .filter((language) =>
      (language !== "Druidic" || automaticLanguages.includes(language)) &&
      availableLanguages.has(language),
    );
  const speakLanguages = (character.speakLanguages ?? [])
    .slice(0, getSpeakLanguageRankCount(character))
    .map(normalizeCharacterLanguage)
    .filter((language) =>
      language !== "Druidic" &&
      language !== "Magius" &&
      availableLanguages.has(language) &&
      !automaticLanguages.includes(language) &&
      !characterLanguages.includes(language),
    );
  return [
    ...new Set([
      ...automaticLanguages,
      ...characterLanguages,
      ...getEarnedLoremasterLanguages(character).map(normalizeCharacterLanguage),
      ...speakLanguages,
    ]),
  ];
}

function getEarnedLoremasterLanguages(character: Character) {
  return (character.loremasterLanguages ?? []).slice(0, Math.floor(getPrestigeClassLevel(character, "loremaster") / 4));
}

export function baseSpellSlots(classId: SpellcastingClassId, classLevel: number, spellLevel: number) {
  const index = classId === "paladin" || classId === "ranger" || isIndependentSpellcastingClass(classId) ? spellLevel - 1 : spellLevel;
  return spellProgressions[classId]?.[classLevel - 1]?.[index] ?? 0;
}

export function hasSpellLevelAtClassLevel(
  classId: SpellcastingClassId,
  classLevel: number,
  spellLevel: number,
) {
  if (!Number.isInteger(spellLevel) || spellLevel < 0 || spellLevel > 9) return false;
  const index = classId === "paladin" || classId === "ranger" || isIndependentSpellcastingClass(classId) ? spellLevel - 1 : spellLevel;
  return spellProgressions[classId]?.[classLevel - 1]?.[index] !== undefined;
}

export const spellcastingAbilities: Partial<Record<SpellcastingClassId, AbilityName>> = {
  assassin: "int", blackguard: "wis",
  bard: "cha", cleric: "wis", druid: "wis", mystic: "wis",
  paladin: "wis", ranger: "wis", sorcerer: "cha", wizard: "int",
  beguiler: "int", duskblade: "int",
};

const highSorceryOrderSchools = {
  white: ["Abjuration", "Divination"],
  red: ["Illusion", "Transmutation"],
  black: ["Enchantment", "Necromancy"],
} as const satisfies Record<NonNullable<Character["highSorceryOrder"]>, readonly MagicSchool[]>;

const arcaneSpellcastingClasses = new Set<ClassId>(["bard", "sorcerer", "wizard", "beguiler", "duskblade"]);
const divineSpellcastingClasses = new Set<ClassId>(["cleric", "druid", "mystic", "paladin", "ranger"]);
const validAlignments = new Set([
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
]);

export function getHighSorceryOrderSchools(
  order: NonNullable<Character["highSorceryOrder"]>,
) {
  return highSorceryOrderSchools[order];
}

export function getHighSorceryBarredSchoolOptions(
  order: NonNullable<Character["highSorceryOrder"]>,
) {
  const orderSchools = new Set<MagicSchool>(highSorceryOrderSchools[order]);
  return magicSchools.filter((school) =>
    !orderSchools.has(school) &&
    school !== "Conjuration" &&
    school !== "Evocation",
  );
}

export function getPrestigeClassLevelUpSelectionErrors(
  character: Character,
  prestigeClassId: PrestigeClassId,
) {
  const errors = getPrestigeClassEligibilityErrors(character, prestigeClassId);
  if (prestigeClassId !== "wizard-of-high-sorcery") return errors;
  return errors.filter((error) =>
    !error.startsWith("Choose a robe order") &&
    !error.startsWith("Choose a specialist school") &&
    !error.startsWith("Wizard specialization") &&
    !error.startsWith("Choose two distinct barred schools") &&
    !error.startsWith("Both barred schools"),
  );
}

export function getEarnedLoremasterSecrets(character: Character) {
  return (character.loremasterSecrets ?? []).slice(0, Math.ceil(getPrestigeClassLevel(character, "loremaster") / 2));
}

export function hasLoremasterSecret(character: Character, secret: LoremasterSecret) {
  return getEarnedLoremasterSecrets(character).includes(secret);
}

function getEarnedHierophantAbilities(character: Character) {
  return (character.hierophantAbilities ?? []).slice(0, getPrestigeClassLevel(character, "hierophant"));
}

export function getPrestigeFeatureChoice(draft: LevelUpDraft) {
  const { original, proposed, prestigeClassId } = draft;
  if (prestigeClassId === "hierophant") {
    const field = "hierophantAbilities";
    const prior = getEarnedHierophantAbilities(original);
    return { field, prior, label: "Hierophant special ability", options: getHierophantAbilityOptions(original, prior) } as const;
  }
  if (prestigeClassId !== "loremaster") return undefined;
  const level = getPrestigeClassLevel(proposed, "loremaster");
  if (level % 2 === 1) {
    const field = "loremasterSecrets";
    const prior = getEarnedLoremasterSecrets(original);
    const limit = level + abilityModifier(proposed.abilities.int);
    return { field, prior, label: "Loremaster secret", options: loremasterSecrets.filter((secret, index) =>
      index < limit && !prior.includes(secret)) } as const;
  }
  if (level === 4 || level === 8) {
    const field = "loremasterLanguages";
    const prior = original.loremasterLanguages ?? [];
    const known = getCharacterLanguages(original);
    return { field, prior, label: "Loremaster bonus language", options: getAvailableLanguages(original.ruleset).filter((language) =>
      language !== "Druidic" && !known.includes(normalizeCharacterLanguage(language))) } as const;
  }
  return undefined;
}

export function getPrestigeFeatureChoiceWarnings(draft: LevelUpDraft) {
  if (draft.prestigeClassId === "archmage") {
    const level = getPrestigeClassLevel(draft.proposed, "archmage");
    const choices = draft.proposed.highArcanaChoices ?? [];
    const prior = draft.original.highArcanaChoices ?? [];
    const choice = choices.at(-1);
    if (!getPrestigeSpellcastingClassOptions(draft.original, "archmage").includes(draft.classId))
      return ["Choose a qualifying arcane class to advance."];
    if (choices.length !== level || prior.length !== level - 1 ||
        prior.some((previous, index) => JSON.stringify(previous) !== JSON.stringify(choices[index])) ||
        (choice !== null && (!choice || choice.classId !== draft.classId ||
          !canRepeatHighArcana(choice.ability, prior) ||
          !getHighArcanaSlotOptions(draft, choice).includes(choice.slot) ||
          (choice.ability === "Spell-Like Ability"
            ? !choice.spellNote?.trim() || !getHighArcanaSlotOptions(draft, choice, true).includes(choice.reserve ?? -1)
            : choice.reserve !== undefined || choice.spellNote !== undefined))))
      return ["Choose legal High Arcana slot costs or decline High Arcana for this level."];
    return [];
  }
  if (draft.prestigeClassId === "dragon-disciple") {
    const level = getPrestigeClassLevel(draft.proposed, "dragon-disciple");
    const { dragonDiscipleVariety: variety, dragonDiscipleBonusSlots: slots = [] } = draft.proposed;
    const prior = draft.original.dragonDiscipleBonusSlots ?? [];
    const pending = slots[prior.length];
    return [
      ...(!variety || !dragonDiscipleVarieties.includes(variety) ||
        (level > 1 && variety !== draft.original.dragonDiscipleVariety) ? ["Choose an approved dragon variety."] : []),
      ...(slots.length !== earnedDragonDiscipleBonusSlots(level) ||
        prior.some((slot, index) => slot.classId !== slots[index]?.classId || slot.level !== slots[index]?.level) ||
        (slots.length > prior.length && !getDragonDiscipleSlotOptions(draft).some(
          (slot) => slot.classId === pending?.classId && slot.level === pending.level,
        )) ? ["Choose an available Dragon Disciple bonus spell slot."] : []),
    ];
  }
  const choice = getPrestigeFeatureChoice(draft);
  if (!choice) return [];
  const selected: readonly string[] = draft.proposed[choice.field] ?? [];
  const options: readonly string[] = choice.options;
  return selected.length === choice.prior.length + 1 &&
    choice.prior.every((value, index) => selected[index] === value) &&
    options.includes(selected[choice.prior.length])
    ? [] : [`Choose a legal ${choice.label} before confirming.`];
}

export function getRedWizardSpellPower(character: Character, classId: SpellcastingClassId) {
  const level = getPrestigeClassLevel(character, "red-wizard");
  return classSpellcastingType(classId as ClassId) === "arcane" ? Math.floor(level / 2) : 0;
}

export function getRedWizardProhibitedSchools(character: Character) {
  return [...new Set([...(character.wizardBarredSchools ?? []), ...(character.redWizardProhibitedSchools ?? [])])];
}

function getEarnedHighArcana(character: Character) {
  return (character.highArcanaChoices ?? []).slice(0, getPrestigeClassLevel(character, "archmage"));
}

export function getHighArcanaSlotOptions(draft: LevelUpDraft, choice: HighArcanaChoice, reserve = false) {
  const character = { ...draft.proposed, highArcanaChoices: draft.original.highArcanaChoices };
  const level = getEffectiveSpellcastingClassLevel(character, choice.classId);
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((slot) =>
    (reserve || slot >= highArcanaMinimumSlots[choice.ability]) &&
    getDailySpellSlots(character, choice.classId, level, slot) > (reserve && slot === choice.slot ? 1 : 0));
}

export function getPrestigeSpellSlotAdjustment(character: Character, classId: SpellcastingClassId, level: number) {
  return getDragonDiscipleBonusSlots(character, classId, level) -
    getEarnedHighArcana(character).reduce((total, choice) =>
      choice?.classId === classId ? total + Number(choice.slot === level) + Number(choice.reserve === level) : total, 0);
}

export function earnedDragonDiscipleBonusSlots(level: number) {
  return dragonDiscipleBonusLevels.filter((milestone) => milestone <= level).length;
}

export function getDragonDiscipleSlotOptions(draft: LevelUpDraft) {
  return getSpellcastingClassLevels(draft.original).flatMap(({ classId }) => {
    const classLevel = getEffectiveSpellcastingClassLevel(draft.original, classId);
    return Array.from({ length: 9 }, (_, index) => index + 1)
      .filter((level) => getDailySpellSlots(draft.original, classId, classLevel, level) > 0)
      .map((level) => ({ classId, level }));
  });
}

export function getDragonDiscipleBonusSlots(character: Character, classId: SpellcastingClassId, level: number) {
  return (character.dragonDiscipleBonusSlots ?? [])
    .slice(0, earnedDragonDiscipleBonusSlots(getPrestigeClassLevel(character, "dragon-disciple")))
    .filter((slot) => slot.classId === classId && slot.level === level).length;
}

function classSpellcastingType(classId: ClassId) {
  if (arcaneSpellcastingClasses.has(classId)) return "arcane";
  if (divineSpellcastingClasses.has(classId)) return "divine";
  return undefined;
}

function matchesPrestigeSpellcastingType(classId: ClassId, type: "arcane" | "divine" | "either") {
  const classType = classSpellcastingType(classId);
  return classType !== undefined && (type === "either" || classType === type);
}

export function getPrestigeSpellcastingClassOptions(
  character: Character,
  prestigeClassId: PrestigeClassId,
  divineTarget = false,
) {
  const progression = dragonlancePrestigeClasses[prestigeClassId].spellcastingProgression;
  if (!progression || (divineTarget && prestigeClassId !== "mystic-theurge")) return [];
  const entryRoll = progression.chooseEachLevel
    ? character.hitPointRolls?.find((roll) => roll.prestigeClassId === prestigeClassId && roll.classLevel === 1)
    : undefined;
  const firstClassLevelByClass = new Map<ClassId, number>();
  for (const roll of character.hitPointRolls ?? []) {
    if (roll.prestigeClassId || roll.classLevel !== 1) continue;
    firstClassLevelByClass.set(roll.classId, roll.characterLevel);
  }
  const allowedClasses = dragonlancePrestigeClasses[prestigeClassId].prerequisites.classes;
  const beforeArchmage = prestigeClassId === "archmage" && entryRoll
    ? getCharacterAtCharacterLevel(character, entryRoll.characterLevel - 1) : character;
  const archmageEntry = prestigeClassId === "archmage" &&
      (!entryRoll || getTotalHitDice(beforeArchmage) !== entryRoll.characterLevel - 1)
    ? { ...character, classLevels: character.classLevels.filter((entry) =>
        !("prestigeClassId" in entry) || entry.prestigeClassId !== "archmage") }
    : beforeArchmage;
  return [...new Set(
    getBaseClassLevels(character)
      .filter((entry) =>
        matchesPrestigeSpellcastingType(entry.classId, divineTarget ? "divine" : progression.type) &&
        (!entryRoll || (firstClassLevelByClass.get(entry.classId) ?? 0) < entryRoll.characterLevel) &&
        (prestigeClassId !== "archmage" || getDailySpellSlots(
          archmageEntry, entry.classId, getEffectiveSpellcastingClassLevel(archmageEntry, entry.classId), 7,
        ) > 0) &&
        (!allowedClasses?.length || allowedClasses.includes(entry.classId)),
      )
      .map((entry) => entry.classId),
  )];
}

export function getEffectiveSpellcastingClassLevel(character: Character, classId: SpellcastingClassId) {
  if (isIndependentSpellcastingClass(classId)) return getPrestigeClassLevel(character, classId);
  const baseLevel = getBaseClassLevel(character, classId);
  const advancement = character.classLevels.reduce((total, entry) => {
    if (!("prestigeClassId" in entry)) return total;
    const progression = dragonlancePrestigeClasses[entry.prestigeClassId].spellcastingProgression;
    if (!progression) return total;
    const divineTarget = entry.prestigeClassId === "mystic-theurge" && classSpellcastingType(classId) === "divine";
    if (!matchesPrestigeSpellcastingType(classId, divineTarget ? "divine" : progression.type)) return total;
    const firstAdvancingLevel = progression.startsAtLevel ?? 1;
    if (!progression.chooseEachLevel)
      return total + (entry.classId === classId ? Math.max(0, entry.level - firstAdvancingLevel + 1) : 0);
    const recordedTargets = new Map(
      (character.hitPointRolls ?? [])
        .filter((roll) => roll.prestigeClassId === entry.prestigeClassId)
        .map((roll) => [roll.classLevel, divineTarget ? roll.divineSpellcastingClassId : roll.classId]),
    );
    for (let level = firstAdvancingLevel; level <= entry.level; level += 1) {
      if ((recordedTargets.get(level) ?? (divineTarget ? entry.divineSpellcastingClassId : entry.classId)) === classId) total += 1;
    }
    return total;
  }, 0);
  return baseLevel + advancement;
}

export function getSpellcastingAbility(classId: SpellcastingClassId): AbilityName {
  const ability = spellcastingAbilities[classId];
  if (!ability) throw new Error(`${getSpellcastingClassDefinition(classId).name} does not have a spellcasting ability.`);
  return ability;
}

export function getHighSorceryMoonModifier(character: Character, classId: SpellcastingClassId) {
  if (
    character.ruleset !== dragonlanceContentId ||
    !character.highSorceryOrder ||
    (classId !== "wizard" && classId !== "sorcerer")
  ) return 0;

  const moonByOrder = {
    white: "solinari",
    red: "lunitari",
    black: "nuitari",
  } as const;
  const moon = moonByOrder[character.highSorceryOrder];
  const phase = character.dragonlanceMoonState?.phases?.[moon];
  const conjunction = character.dragonlanceMoonState?.conjunction;
  let modifier = 0;

  if (phase === "waxing-gibbous" || phase === "full" || phase === "waning-gibbous") {
    modifier += 1;
  } else if (
    phase === "waning-crescent" ||
    phase === "new" ||
    phase === "waxing-crescent"
  ) {
    modifier -= 1;
  }

  if (conjunction === "all") {
    modifier += 2;
  } else if (conjunction && conjunction !== "none" && conjunction.split("-").includes(moon)) {
    modifier += 1;
  }
  return modifier;
}

function getFeatCasterLevelPenalty(character: Character) {
  return 4 * getChosenFeats(character).filter((featId) =>
    featId === "mage-slayer" ||
    featId.startsWith("pierce-magical-")
  ).length;
}

export function getCasterLevel(classId: SpellcastingClassId, classLevel: number, character?: Character) {
  if (!getSpellcastingClassDefinition(classId).spellcasting) return 0;
  const baseClassLevel = character
    ? isIndependentSpellcastingClass(classId) ? getPrestigeClassLevel(character, classId) : getBaseClassLevel(character, classId)
    : classLevel;
  const effectiveClassLevel = character
    ? getEffectiveSpellcastingClassLevel(character, classId)
    : classLevel;
  const prestigeAdvancement = effectiveClassLevel - baseClassLevel;
  const baseCasterLevel = classId === "paladin" || classId === "ranger"
    ? baseClassLevel < 4 ? 0 : Math.floor(baseClassLevel / 2)
    : baseClassLevel;
  const normalCasterLevel = baseCasterLevel + prestigeAdvancement;
  const casterLevel = character && normalCasterLevel > 0
    ? normalCasterLevel + getPrestigeClassLevel(character, "hierophant")
    : normalCasterLevel;
  if (!character) return casterLevel;
  const practicedCasterLevel = baseClassLevel > 0 &&
    getChosenFeats(character).includes(
      `practiced-spellcaster-${classId}`,
    )
    ? casterLevel + Math.max(0, Math.min(4, getTotalHitDice(character) - casterLevel))
    : casterLevel;
  if (practicedCasterLevel <= 0) return practicedCasterLevel;
  return Math.max(
    0,
    practicedCasterLevel + getEarnedHierophantAbilities(character).filter((ability) => ability === "Spell Power").length +
      Number(getEarnedHighArcana(character).some((choice) => choice?.ability === "Spell Power")) +
      (classSpellcastingType(classId as ClassId) === "arcane"
        ? Math.floor(getPrestigeClassLevel(character, "red-wizard") / 2)
        : 0) +
      getHighSorceryMoonModifier(character, classId) -
      getFeatCasterLevelPenalty(character),
  );
}

export function getSpellSaveDC(
  character: Character,
  classId: SpellcastingClassId,
  spellLevel: number,
  spellSchool?: string,
  includeHighSorceryLunarModifier = true,
  saveDCFormula?: SrdSpell["saveDCFormula"],
) {
  const schoolName = spellSchool && getSpellSchoolName(spellSchool).toLowerCase();
  const racialBonus =
    character.race.toLowerCase() === "gnome" &&
    schoolName === "illusion"
      ? 1
      : 0;
  const selectedForSchool = (featId: string) =>
    Boolean(schoolName && getActiveFeatEntries(character).some(
      ([slotId, selectedFeatId]) =>
        selectedFeatId === featId &&
        character.featSpellSchoolSelections?.[slotId]?.toLowerCase() === schoolName,
    ));
  const hasSpellFocus = selectedForSchool("spell-focus");
  const spellFocusBonus = hasSpellFocus
    ? selectedForSchool("greater-spell-focus") ? 2 : 1
    : 0;
  const redWizardSpecialist = character.redWizardSpecializationSchool ??
    (character.ruleset === "core-35-srd"
      ? character.coreWizardSpecializationSchool
      : character.wizardSpecializationSchool);
  const redWizardTattooFocusBonus = getPrestigeClassLevel(character, "red-wizard") > 0 &&
    schoolName === redWizardSpecialist?.toLowerCase() ? 1 : 0;
  const dcLevel = saveDCFormula === "half-caster-level-wisdom"
    ? Math.floor(getCasterLevel(classId, 0, character) / 2)
    : spellLevel;
  const dcAbility = saveDCFormula === "half-caster-level-wisdom"
    ? "wis"
    : getSpellcastingAbility(classId);
  return 10 + dcLevel +
    abilityModifier(getEffectiveAbilityScore(character, dcAbility)) +
    racialBonus + spellFocusBonus + redWizardTattooFocusBonus +
    (includeHighSorceryLunarModifier ? getHighSorceryMoonModifier(character, classId) : 0);
}

export function getRacialSpellLikeAbilities(character: Character) {
  const race =
    getRaceDefinitionForCharacter(character) ??
    raceDefinitions.human;
  const charisma = getEffectiveAbilityScore(character, "cha");
  const intelligence = getEffectiveAbilityScore(character, "int");
  const characterLevel = getTotalHitDice(character);
  const casterLevelPenalty = getFeatCasterLevelPenalty(character);

  return (race.racialSpellLikeAbilities ?? [])
    .filter((ability) =>
      (ability.minimumCharisma === undefined ||
        charisma >= ability.minimumCharisma) &&
      (ability.minimumIntelligence === undefined ||
        intelligence >= ability.minimumIntelligence)
    )
    .map((ability) => {
      const racialSaveDcBonus = ability.school
        ? race.racialSpellSchoolDcBonuses?.[ability.school.toLowerCase()] ?? 0
        : 0;
      const casterLevel = ability.casterLevel === "character"
        ? characterLevel
        : ability.casterLevel;
      return {
        ...ability,
        casterLevel: Math.max(0, casterLevel - casterLevelPenalty),
        saveDC: ability.savingThrow
          ? 10 + (ability.spellLevel ?? 0) + abilityModifier(charisma) +
            racialSaveDcBonus
          : undefined,
        racialSaveDcBonus,
      };
    });
}

export function getArcaneSpellFailure(character: Character, classId: SpellcastingClassId) {
  if (!["assassin", "bard", "sorcerer", "wizard", "beguiler", "duskblade"].includes(classId)) return undefined;
  const details: string[] = [];
  let total = 0;
  let unknown = false;
  const hasBattleCaster = getChosenFeats(character).includes(
    "battle-caster",
  );
  const hasGithyankiBattlecaster = getChosenFeats(character).includes(
    "githyanki-battlecaster",
  );
  for (const slot of ["Armor", "Shield"] as const) {
    const name = character.equipment[slot];
    if (!name) continue;
    const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
    const base = item?.custom ? undefined :
      (slot === "Armor" ? armorNames : shieldNames).find((entry) => name.includes(entry));
    const armorCategory = slot === "Armor"
      ? getWornArmor(character).movementCategory
      : undefined;
    if (slot === "Armor" && armorCategory === "Light" && hasGithyankiBattlecaster) {
      details.push(`${name}: 0% (Githyanki Battlecaster)`);
      continue;
    }
    if (
      slot === "Armor" &&
      classId === "bard" &&
      (armorCategory === "Light" ||
        (hasBattleCaster && armorCategory === "Medium"))
    ) {
      details.push(
        `${name}: 0% for bard spells (${armorCategory === "Light" ? "light armor exception" : "Battle Caster"})`,
      );
      continue;
    }
    if (
      slot === "Armor" &&
      ((classId === "beguiler" && armorCategory === "Light") ||
        (classId === "duskblade" &&
          (armorCategory === "Light" ||
            (getBaseClassLevel(character, "duskblade") >= 4 && armorCategory === "Medium"))))
    ) {
      details.push(`${name}: 0% for ${classId === "beguiler" ? "Beguiler" : "Duskblade"} spells (Armored Mage)`);
      continue;
    }
    if (
      slot === "Shield" &&
      classId === "duskblade" &&
      ((item?.shieldType === "Light" || base?.startsWith("Light ")) ||
        (getBaseClassLevel(character, "duskblade") >= 7 &&
          (item?.shieldType === "Heavy" || base?.startsWith("Heavy "))))
    ) {
      details.push(`${name}: 0% for Duskblade spells (Armored Mage)`);
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

export function getDailySpellSlots(character: Character, classId: SpellcastingClassId, classLevel: number, level: number) {
  if (classId === "ranger" && getDragonlanceRangerWarnings(character, classLevel).length > 0)
    return 0;
  if (classId === "druid" &&
      (!isNeutralAlignment(character.alignment) ||
       getDragonlanceDruidWarnings(character).length > 0))
    return 0;
  const effectiveClassLevel = Math.max(
    classLevel,
    getEffectiveSpellcastingClassLevel(character, classId),
  );
  if (!hasSpellLevelAtClassLevel(classId, effectiveClassLevel, level)) return 0;
  const score = getEffectiveAbilityScore(character, getSpellcastingAbility(classId));
  if (score < 10 + level) return 0;
  const modifier = abilityModifier(score);
  const bonus = level > 0 && modifier >= level ? Math.floor((modifier - level) / 4) + 1 : 0;
  return Math.max(0, baseSpellSlots(classId, effectiveClassLevel, level) + bonus +
    getPrestigeSpellSlotAdjustment(character, classId, level));
}

export function getKnownSpellLimit(character: Character, classId: SpellcastingClassId, classLevel: number, level: number) {
  const effectiveClassLevel = Math.max(
    classLevel,
    getEffectiveSpellcastingClassLevel(character, classId),
  );
  if (classId === "assassin") {
    return getDailySpellSlots(character, classId, effectiveClassLevel, level) > 0
      ? assassinKnownProgression[effectiveClassLevel - 1]?.[level - 1] ?? 0 : 0;
  }
  if (classId === "beguiler") {
    const baseLimit = getClassSpells(classId, character.ruleset, character)
      .filter((spell) => spell.level === level)
      .length;
    const advancedLimit = getClassSpells("sorcerer", character.ruleset, character)
      .filter((spell) =>
        spell.level === level &&
        character.beguilerAdvancedLearning?.includes(spell.name),
      ).length;
    return baseLimit + advancedLimit;
  }
  if (classId === "duskblade") {
    return getClassSpells(classId, character.ruleset, character)
      .filter((spell) => spell.level === level)
      .length;
  }
  if (classId === "mystic") {
    const baseLimit = mysticKnownProgression[effectiveClassLevel - 1]?.[level] ?? 0;
    return baseLimit + Number(level > 0 && baseLimit > 0 && Boolean(getActiveMysticDomain(character)));
  }
  if (classId === "bard" || classId === "sorcerer") {
    if (getEffectiveAbilityScore(character, getSpellcastingAbility(classId)) < 10 + level)
      return 0;
    const progression = classId === "bard"
      ? bardKnownProgression
      : sorcererKnownProgression;
    return progression[effectiveClassLevel - 1]?.[level] ?? 0;
  }
  return 0;
}

export function getKnownSpellReplacementLevelLimit(
  original: Character,
  proposed: Character,
  classId: SpellcastingClassId,
) {
  if (classId === "mystic" &&
    (original.ruleset !== dragonlanceContentId ||
      proposed.ruleset !== dragonlanceContentId))
    return undefined;
  const classLevel = isIndependentSpellcastingClass(classId)
    ? (character: Character) => getPrestigeClassLevel(character, classId)
    : (character: Character) => getBaseClassLevel(character, classId);
  const originalLevel = classLevel(original);
  const proposedLevel = classLevel(proposed);
  const eligibleLevel = classId === "bard"
    ? proposedLevel >= 5 && (proposedLevel - 5) % 3 === 0
    : (classId === "assassin" || classId === "sorcerer" || classId === "mystic" || classId === "duskblade") &&
      proposedLevel >= (classId === "assassin" ? 6 : 4) && proposedLevel % 2 === 0;
  if (proposedLevel !== originalLevel + 1 || !eligibleLevel) return undefined;
  const effectiveClassLevel = getEffectiveSpellcastingClassLevel(proposed, classId);
  const abilityScore = getEffectiveAbilityScore(
    proposed,
    getSpellcastingAbility(classId),
  );
  for (let level = 9; level >= 0; level -= 1) {
    if (classId === "assassin" && getDailySpellSlots(proposed, classId, effectiveClassLevel, level) <= 0) continue;
    if ((classId === "mystic" || abilityScore >= 10 + level) &&
      hasSpellLevelAtClassLevel(classId, effectiveClassLevel, level))
      return level - 2;
  }
  return undefined;
}

export function getMysticSpellReplacementLevelLimit(original: Character, proposed: Character) {
  return getKnownSpellReplacementLevelLimit(original, proposed, "mystic");
}

export function getClassSpellSelections(character: Character, field: "knownSpells" | "preparedSpells") {
  const classField = field === "knownSpells" ? "knownSpellsByClass" : "preparedSpellsByClass";
  const result = { ...(character[classField] ?? {}) };
  const casters = getBaseClassLevels(character).filter((entry) => classDefinitions[entry.classId].spellcasting);
  for (const name of character[field]) {
    if (Object.values(result).some((entries) => entries?.includes(name))) continue;
    const explicitOwner = character.knownSpellClasses?.[name] ??
      (field === "preparedSpells" ? casters.find(({ classId }) => character.knownSpellsByClass?.[classId]?.includes(name))?.classId : undefined);
    // Legacy flat lists have no class identity; assign once, never to every caster.
    const owner = explicitOwner ?? casters.find(({ classId }) =>
      getClassSpells(classId, character.ruleset, character).some((spell) => spell.name === name))?.classId ?? casters[0]?.classId;
    if (owner && character[classField]?.[owner] === undefined) {
      result[owner] = [...(result[owner] ?? []), name];
    }
  }
  return result;
}

export function getWizardSpellbookSpells(character?: Character) {
  const names = new Set<string>();
  return getClassSpells("wizard", character?.ruleset ?? core35ContentId, character).filter((spell) => {
    const name = spell.name.toLowerCase();
    if (names.has(name)) return false;
    names.add(name);
    return true;
  });
}

export function getWizardFreeSpellAllowance(character: Character, original?: Character) {
  const classLevel = getBaseClassLevel(character, "wizard");
  const originalLevel = original ? getBaseClassLevel(original, "wizard") : 0;
  const starting = originalLevel === 0;
  const required = starting ? 3 + Math.max(0, abilityModifier(character.abilities.int)) : 2;
  const old = new Set(original ? getClassSpellSelections(original, "knownSpells").wizard ?? [] : []);
  const entries = getWizardSpellbookSpells(character);
  const selected = (getClassSpellSelections(character, "knownSpells").wizard ?? []).filter((name) =>
    !old.has(name) && !["scroll", "spellbook", "research", "reward"].includes(character.spellAcquisitionByClass?.wizard?.[name] ?? "") &&
    entries.some((spell) => spell.name === name && spell.level > 0 &&
      (!starting || spell.level === 1) && hasSpellLevelAtClassLevel("wizard", classLevel, spell.level) &&
      (starting || getEffectiveAbilityScore(character, "int") >= 10 + spell.level))).length;
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

export function getForceShieldState(character: Character) {
    const equipped = ["Rings 1", "Rings 2"].some((slot) => {
      const item = character.equipment?.[slot];
      if (!item || findStoreItem(item)?.custom) return false;
      return item.replace(/ \((Small|Medium|Large)\)$/, "") === "Ring of Force Shield";
    });
    return {
      equipped,
      active: equipped && character.forceShieldActive === true,
    };
}

export function getEquipmentDefenseBonuses(character: Character) {
  const definitions = {
    deflection: [
      { slots: ["Rings 1", "Rings 2"], pattern: /^Ring of Protection \+([1-5])$/, bonus: (match: RegExpMatchArray) => Number(match[1]) },
    ],
    resistance: [
      { slots: ["Shoulders"], pattern: /^Cloak of Resistance \+([1-5])$/, bonus: (match: RegExpMatchArray) => Number(match[1]) },
      { slots: ["Body"], pattern: /^Robe of the Archmagi$/, bonus: () => 4 },
    ],
    naturalArmorEnhancement: [
      { slots: ["Neck"], pattern: /^Amulet of Natural Armor \+([1-5])$/, bonus: (match: RegExpMatchArray) => Number(match[1]) },
    ],
    luck: [
      { slots: ["Miscellaneous"], pattern: /^Stone of Good Luck$/, bonus: () => 1 },
      { slots: ["Body"], pattern: /^Robe of Stars$/, bonus: () => 1 },
    ],
    insight: [
      { slots: ["Miscellaneous"], pattern: /^Ioun Stone, Dusty Rose Prism$/, bonus: () => 1 },
    ],
    forceShield: [
      { slots: ["Rings 1", "Rings 2"], pattern: /^Ring of Force Shield$/, bonus: () => 2 },
    ],
  };
  const getBonus = (type: keyof typeof definitions) => {
    if (type === "forceShield" && !getForceShieldState(character).active) {
      return { bonus: 0, detail: [] as string[] };
    }
    const sources = definitions[type].flatMap(({ slots, pattern, bonus }) =>
      slots.flatMap((slot) => {
        const equipped = character.equipment[slot];
        if (!equipped || findStoreItem(equipped)?.custom) return [];
        const name = equipped.replace(/ \((Small|Medium|Large)\)$/, "");
        const match = name.match(pattern);
        return match ? [{ name, slot, bonus: bonus(match) }] : [];
      }),
    );
    const bonus = Math.max(0, ...sources.map((source) => source.bonus));
    let applied = false;
    const labels = {
      deflection: "deflection",
      resistance: "resistance",
      naturalArmorEnhancement: "enhancement to natural armor",
      luck: "luck",
      insight: "insight to AC",
      forceShield: "shield bonus to AC",
    };
    const detail = sources.map((source) => {
      const active = !applied && source.bonus === bonus;
      if (active) applied = true;
      return `${source.name} (${source.slot}): ${formatModifier(source.bonus)} ${labels[type]}${active ? "" : " (does not stack; highest bonus only)"}`;
    });
    return { bonus, detail };
  };
  return {
    deflection: getBonus("deflection"),
    resistance: getBonus("resistance"),
    naturalArmorEnhancement: getBonus("naturalArmorEnhancement"),
    luck: getBonus("luck"),
    insight: getBonus("insight"),
    forceShield: getBonus("forceShield"),
  };
}

const combatTargetLabels: Record<CombatTargetType, string> = {
  orc: "orcs/half-orcs",
  goblinoid: "goblinoids",
  kobold: "kobolds",
  giant: "giants",
  aberration: "aberrations",
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

export function getAnimatedShieldState(character: Character) {
  const shieldName = character.equipment?.Shield ?? "";
  const shield = shieldName ? findStoreItem(shieldName, "Shields") : undefined;
  const equipped = Boolean(
    shield &&
      (/\bAnimated\b/i.test(shieldName) || /\bAnimated\b/i.test(shield.specialProperties ?? "")),
  );
  return {
    equipped,
    active: equipped && character.animatedShieldMode === true,
  };
}

export function getBlindingShieldState(character: Character) {
  const shieldName = character.equipment?.Shield ?? "";
  const shield = shieldName ? findStoreItem(shieldName, "Shields") : undefined;
  const equipped = Boolean(
    shield &&
      (/\bBlinding\b/i.test(shieldName) || /\bBlinding\b/i.test(shield.specialProperties ?? "")),
  );
  const usesUsed = equipped
    ? character.shieldBlindingUsesByItem?.[shieldName] ?? 0
    : 0;
  return {
    equipped,
    usesUsed,
    usesRemaining: Math.max(0, 2 - usesUsed),
    canUse: equipped && usesUsed < 2,
  };
}

export function getArrowCatchingShieldState(character: Character) {
  const shieldName = character.equipment?.Shield ?? "";
  const shield = shieldName ? findStoreItem(shieldName, "Shields") : undefined;
  return {
    equipped: Boolean(
      shield &&
        (/\bArrow Catching\b/i.test(shieldName) ||
          /\bArrow Catching\b/i.test(shield.specialProperties ?? "")),
    ),
  };
}

export function getArmorClassValues(
  character: Character,
  targetTypes: CombatTargetType[] = [],
  selectedCombatExpertiseAmount = 0,
  dodgeTargetSelected = false,
) {
  const equipment = character.equipment ?? {};
  const armorName = equipment.Armor ?? "";
  const shieldName = equipment.Shield ?? "";
  const bracersName = (equipment.Arms ?? "").replace(/ \((Small|Medium|Large)\)$/, "");
  const bracersItem = findStoreItem(bracersName, "Arms");
  const archmagiRobeName = equipment.Body ?? "";
  const customArmor = findStoreItem(armorName, "Armor");
  const armorBaseName = customArmor?.custom ? undefined : armorNames.find((name) => armorName.includes(name));
  const shieldBaseName = shieldNames.find((name) => shieldName.includes(name));
  const bracersArmorBonus = bracersItem && !bracersItem.custom
    ? Number(bracersItem.name.match(/^Bracers of Armor \+([1-8])$/)?.[1] ?? 0)
    : 0;
  const robeArmorBonus = archmagiRobeName === "Robe of the Archmagi" &&
      !findStoreItem(archmagiRobeName)?.custom
    ? 5
    : 0;
  const armorDexterityBonus = armorBaseName
    ? armorMaximumDexterity[armorBaseName]
    : customArmor?.maxDexterity ?? Infinity;
  const maximumDexterityBonus = Math.min(armorDexterityBonus, getEncumbrance(character).maximumDexterity);
  const armorEnhancement = armorName.match(/\+(\d+)/)?.[1];
  const shieldEnhancement = shieldName.match(/\+(\d+)/)?.[1];
  const wornArmorBonus = (armorBaseName ? armorBonuses[armorBaseName] : customArmor?.armorBonus ?? 0) +
    (armorEnhancement ? Number(armorEnhancement) : 0);
  const armorBonus = Math.max(wornArmorBonus, bracersArmorBonus, robeArmorBonus);
  const totalShieldBonus = (shieldBaseName ? shieldBonuses[shieldBaseName] : 0) +
      (shieldEnhancement ? Number(shieldEnhancement) : 0);
  const bucklerBonusLost = isBucklerEquipped(character) &&
    (Boolean(equipment["Off Hand Weapon"]) || getDoubleWeaponModeState(character)?.enabled === true);
  const towerShieldState = getTowerShieldState(character);
  const shieldBashState = getShieldBashState(character);
  const shieldBashACBonusLost = shieldBashState.enabled && !shieldBashState.retainsShieldACBonus;
  const hasTwoWeaponDefense = getChosenFeats(character).includes("two-weapon-defense");
  const mainWeaponKey = equipment["Main Weapon"];
  const offHandWeaponKey = hasTwoWeaponDefense
    ? getEffectiveWeaponKey(character, "Off Hand Weapon")
    : undefined;
  const canWieldForTwoWeaponDefense = (
    key: string | undefined,
    slot: "Main Weapon" | "Off Hand Weapon",
  ) => {
    if (!key) return false;
    const item = getWeaponItemForKey(character, getInventoryEntryDetails(key).name);
    return Boolean(
      item &&
        item.category === "Weapons" &&
        weaponTraits(item).baseName !== "Unarmed Strike" &&
        getWeaponSizeHandling(character, key, slot)?.wieldable &&
        !getWeaponCompatibilityWarning(character, key, slot),
    );
  };
  const twoWeaponDefenseBonus = hasTwoWeaponDefense &&
    canWieldForTwoWeaponDefense(mainWeaponKey, "Main Weapon") &&
    canWieldForTwoWeaponDefense(offHandWeaponKey, "Off Hand Weapon")
    ? 1
    : 0;
  const arrowCatchingShield = getArrowCatchingShieldState(character);
  const physicalShieldBonus = bucklerBonusLost || towerShieldState.coverActive || shieldBashACBonusLost
    ? 0
    : totalShieldBonus;
  const bonuses = getEquipmentDefenseBonuses(character);
  const forceShieldState = getForceShieldState(character);
  const shieldBonus = Math.max(
    physicalShieldBonus,
    bonuses.forceShield.bonus,
    twoWeaponDefenseBonus,
  );
  const dexterity = Math.min(abilityModifier(getEffectiveAbilityScore(character, "dex")), maximumDexterityBonus);
  const deflection = bonuses.deflection.bonus;
  const rangedWeaponDeflection = arrowCatchingShield.equipped && !towerShieldState.coverActive
    ? Math.max(deflection, 1)
    : deflection;
  const arrowCatchingDeflectionBonus = rangedWeaponDeflection - deflection;
  const naturalArmorEnhancement = bonuses.naturalArmorEnhancement.bonus;
  const insight = bonuses.insight.bonus;
  const activeArmorClass = getCombatEffectModifier(character, "armorClass");
  const hitPointStatus = getHitPointStatus(character);
  const helplessFromHitPoints = hitPointStatus === "Dead" ||
    hitPointStatus === "Dying / unconscious unless stabilized or an ability applies" ||
    hitPointStatus === "Unconscious (nonlethal)";
  const monkState = getMonkAbilityState(character);
  const monkACActive = monkState.active && !helplessFromHitPoints;
  const monkWisdomBonus = monkACActive
    ? Math.max(0, abilityModifier(getEffectiveAbilityScore(character, "wis")))
    : 0;
  const monkLevelACBonus = monkACActive ? Math.floor(monkState.level / 5) : 0;
  const monkACBonus = monkWisdomBonus + monkLevelACBonus;
  const race = getRaceDefinitionForCharacter(character);
  const discipleLevel = getPrestigeClassLevel(character, "dragon-disciple");
  const discipleNaturalArmor = discipleLevel > 0 ? Math.ceil(discipleLevel / 3) : 0;
  const racialNaturalArmor = race?.racialNaturalArmorBonus ?? 0;
  const naturalArmor = naturalArmorEnhancement + racialNaturalArmor + discipleNaturalArmor;
  const racialDodgeACBonus = Math.max(
    0,
    ...targetTypes.map((targetType) => race?.racialDodgeACBonuses?.[targetType] ?? 0),
  );
  const dodgeTarget = targetTypes.find(
    (targetType) => race?.racialDodgeACBonuses?.[targetType] === racialDodgeACBonus && racialDodgeACBonus > 0,
  );
  const base = 10 + sizeModifier(character);
  const hasUncannyDodge = getBaseClassLevels(character).some(({ classId, level }) =>
    (classId === "barbarian" && level >= 2) || (classId === "rogue" && level >= 4)) ||
    getPrestigeClassLevel(character, "assassin") >= 2 ||
    getPrestigeClassLevel(character, "dwarven-defender") >= 2 ||
    getPrestigeClassLevel(character, "shadowdancer") >= 2 ||
    (character.classFeatures ?? []).some((feature) => /\buncanny dodge\b/i.test(feature));
  const retainsDexterity = hasUncannyDodge && !helplessFromHitPoints;
  const combatExpertiseBonus = getCombatExpertiseAmount(character, selectedCombatExpertiseAmount);
  const dodgeFeatBonus = getDodgeFeatBonus(character, dodgeTargetSelected);
  const defenderLevel = getPrestigeClassLevel(character, "dwarven-defender");
  const defenderDodgeBonus = helplessFromHitPoints ? 0 : Math.ceil(defenderLevel / 3);
  const loremasterDodgeBonus = helplessFromHitPoints ? 0 : Number(hasLoremasterSecret(character, "Dodge Trick"));
  const dodgeBonus = racialDodgeACBonus + combatExpertiseBonus + dodgeFeatBonus + defenderDodgeBonus + loremasterDodgeBonus;
  const size = sizeModifier(character);
  const normal = base + armorBonus + shieldBonus + dexterity + deflection + naturalArmor + insight + dodgeBonus + monkACBonus + activeArmorClass;
  const touch = base + dexterity + deflection + insight + dodgeBonus + monkACBonus + activeArmorClass;
  const flatFooted = base + armorBonus + shieldBonus + (retainsDexterity ? dexterity + dodgeBonus : Math.min(0, dexterity)) + deflection + naturalArmor + insight + monkACBonus + activeArmorClass;
  return {
    normal,
    touch,
    flatFooted,
    rangedWeapon: normal + arrowCatchingDeflectionBonus,
    rangedWeaponTouch: touch + arrowCatchingDeflectionBonus,
    rangedWeaponFlatFooted: flatFooted + arrowCatchingDeflectionBonus,
    arrowCatchingShield: arrowCatchingShield.equipped,
    arrowCatchingActive: arrowCatchingShield.equipped && !towerShieldState.coverActive,
    components: {
      base: 10,
      armor: armorBonus,
      shield: shieldBonus,
      dexterity,
      size,
      naturalArmor,
      deflection,
      insight,
      rangedWeaponDeflection,
      arrowCatching: arrowCatchingDeflectionBonus,
      monk: monkACBonus,
      misc: dodgeBonus + activeArmorClass,
    },
    retainsDexterity,
    racialDodgeACBonus,
    combatExpertiseBonus,
    dodgeFeatBonus,
    towerShieldCoverActive: towerShieldState.coverActive,
    shieldBashACBonusLost,
    twoWeaponDefenseBonus,
    detail: [
      `Base 10; armor ${formatModifier(armorBonus)}; shield ${formatModifier(shieldBonus)}; DEX ${formatModifier(dexterity)}; size ${formatModifier(sizeModifier(character))}`,
      ...(bucklerBonusLost ? ["Buckler AC bonus lost while wielding an off-hand weapon."] : []),
      ...(twoWeaponDefenseBonus
        ? [
          "Two-Weapon Defense grants a +1 shield bonus while wielding two weapons; it does not stack with other shield bonuses.",
          "The bonus increases to +2 while fighting defensively or using total defense; those action modes are tracked manually.",
        ]
        : []),
      ...(towerShieldState.coverActive
        ? ["Tower shield used for total cover instead of its shield bonus; attacks are unavailable until the start of the next turn. Targeted spells can still target the shield."]
        : []),
      ...(shieldBashState.enabled
        ? [shieldBashACBonusLost
          ? "Shield AC bonus lost after a shield bash until your next action; clear the bash setting manually."
          : "Improved Shield Bash retains the shield AC bonus while bashing."]
        : []),
      ...(forceShieldState.equipped && !forceShieldState.active
        ? ["Ring of Force Shield is inactive; its shield bonus does not apply."]
        : []),
      ...(bracersArmorBonus
        ? [`Bracers of Armor provide ${formatModifier(bracersArmorBonus)} armor; use the highest armor bonus only.`]
        : []),
      ...(robeArmorBonus
        ? [`Robe of the Archmagi provides ${formatModifier(robeArmorBonus)} armor; use the highest armor bonus only.`]
        : []),
      ...(dodgeTarget && race ? [`${race.name} dodge vs. ${combatTargetLabels[dodgeTarget]} ${formatModifier(racialDodgeACBonus)}`] : []),
      ...(racialNaturalArmor ? [`${race?.name} natural armor ${formatModifier(racialNaturalArmor)}`] : []),
      ...(discipleNaturalArmor ? [`Dragon Disciple natural armor ${formatModifier(discipleNaturalArmor)}`] : []),
      ...(combatExpertiseBonus ? [`Combat Expertise ${formatModifier(combatExpertiseBonus)} dodge bonus`] : []),
      ...(dodgeFeatBonus ? ["Dodge +1 vs. selected opponent"] : []),
      ...(defenderDodgeBonus ? [`Dwarven Defender ${formatModifier(defenderDodgeBonus)} dodge AC`] : []),
      ...(loremasterDodgeBonus ? ["Loremaster Dodge Trick +1 dodge AC"] : []),
      ...(monkState.level > 0
        ? !monkState.active
          ? [`Monk AC bonuses are inactive: ${monkState.reason}.`]
          : helplessFromHitPoints
            ? ["Monk AC bonuses are inactive while HP-tracked as unconscious."]
            : [
              `Monk AC ${formatModifier(monkACBonus)} (${formatModifier(monkWisdomBonus)} Wisdom; ${formatModifier(monkLevelACBonus)} class bonus) applies to touch and flat-footed AC.`,
              "Monk AC bonuses are also lost while immobilized; other immobilizing conditions are tracked manually.",
            ]
        : []),
      ...(hasUncannyDodge && helplessFromHitPoints
        ? ["Uncanny Dodge does not retain Dexterity while unconscious; other immobilizing conditions are tracked manually."]
        : []),
      ...getAbilityEquipmentBonus(character, "dex").detail,
      ...bonuses.deflection.detail,
      ...bonuses.forceShield.detail.map((line) =>
        Math.max(physicalShieldBonus, twoWeaponDefenseBonus) >= bonuses.forceShield.bonus
        ? `${line} (does not stack with the higher shield bonus)`
        : line),
      ...(arrowCatchingShield.equipped
        ? [towerShieldState.coverActive
          ? "Arrow Catching does not function while you have total cover."
          : `Arrow Catching grants AC ${normal + arrowCatchingDeflectionBonus} vs. ranged weapons; use the highest deflection bonus only. Projectile/thrown attacks aimed at another creature within 5 ft. redirect to you unless you have total cover; resolve redirection manually.`]
        : []),
      ...bonuses.naturalArmorEnhancement.detail,
      ...bonuses.insight.detail,
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
  const race = getRaceDefinitionForCharacter(character) ?? raceDefinitions.human;
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

export function getUnarmedStrikeDamage(monkLevel: number, size: string) {
  if (monkLevel <= 0) {
    return size === "Small" ? "1d2" : size === "Large" ? "1d4" : "1d3";
  }
  const band = monkLevel >= 20 ? 5 : Math.floor(monkLevel / 4);
  const damageBySize = {
    Small: ["1d4", "1d6", "1d8", "1d10", "2d6", "2d8"],
    Medium: ["1d6", "1d8", "1d10", "2d6", "2d8", "2d10"],
    Large: ["1d8", "2d6", "2d8", "3d6", "3d8", "4d8"],
  };
  return damageBySize[size as keyof typeof damageBySize]?.[band] ?? damageBySize.Medium[band];
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

function getEffectiveWeaponRangeForSize(
  character: Character,
  item: StoreItem,
  size: string,
  isRanged: boolean,
) {
  const range = getWeaponRangeForSize(item, size);
  if (!range || !isRanged || !getChosenFeats(character).includes("far-shot")) return range;
  const rangeMatch = range.match(/^\s*(\d+(?:\.\d+)?)\s*(?:ft\.?|feet)\s*$/i);
  if (!rangeMatch) return range;
  const multiplier = weaponTraits(item).thrown ? 2 : 1.5;
  const adjustedRange = Number(rangeMatch[1]) * multiplier;
  return `${Number.isInteger(adjustedRange) ? adjustedRange : adjustedRange.toFixed(1)} ft.`;
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
type CompatibleAmmunition = {
  key: string;
  name: string;
  quantity: number;
  material?: WeaponMaterial;
  enhancement: number;
};
type DamageReductionRequirement = WeaponMaterial | "magic";

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
      ? [{
          key,
          name: details.name,
          quantity,
          material: details.material,
          enhancement: Number(details.name.match(/\+(\d+)/)?.[1] ?? 0),
        }]
      : [];
  });
}

function getWeaponAmmunitionReadiness(
  character: Character,
  item: StoreItem,
  isRanged: boolean,
  ammunition: AmmunitionProfile | undefined,
  compatibleAmmunition: CompatibleAmmunition[],
) {
  if (!isRanged) return { ammunitionStatus: undefined, reloadNote: undefined };
  const traits = weaponTraits(item);
  const { baseName } = traits;
  const rapidReloadSelected = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "rapid-reload" &&
      character.featWeaponSelections?.[slotId] === baseName,
  );
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
    ? rapidReloadSelected
      ? "Reload after each shot: free action; provokes an attack of opportunity. Full attacks may be made as with a bow."
      : "Reload after each shot: move action; provokes an attack of opportunity."
    : baseName === "Heavy Crossbow"
      ? `Reload after each shot: ${rapidReloadSelected ? "move" : "full-round"} action; provokes an attack of opportunity.`
      : baseName.startsWith("Repeating")
        ? "Magazine holds 5 bolts; loading a new case is a full-round action. Shots are not tracked."
        : baseName === "Sling"
          ? "Load after each shot: move action; provokes an attack of opportunity."
          : ["Shortbow", "Longbow", "Composite Shortbow", "Composite Longbow"].includes(baseName)
            ? "Drawing an arrow is a free action."
            : undefined;
  return { ammunitionStatus, reloadNote };
}

function getDamageReductionRequirement(term: string): DamageReductionRequirement | undefined {
  if (term === "cold iron") return "cold-iron";
  if (term === "silver" || term === "alchemical silver") return "alchemical-silver";
  if (term === "adamantine") return "adamantine";
  if (term === "magic") return "magic";
  return undefined;
}

function parseDamageReductionQualifier(qualifier: string): DamageReductionRequirement[][] | undefined {
  const groups: DamageReductionRequirement[][] = [];
  for (const orGroup of qualifier.split(/\s+or\s+/)) {
    const requirements: DamageReductionRequirement[] = [];
    for (const rawTerm of orGroup.split(/\s+and\s+/)) {
      const requirement = getDamageReductionRequirement(rawTerm.trim());
      if (!requirement) return undefined;
      requirements.push(requirement);
    }
    if (requirements.length === 0) return undefined;
    groups.push(requirements);
  }
  return groups.length > 0 ? groups : undefined;
}

function getTargetDamageReductionStatus(
  input: string | undefined,
  item: StoreItem,
  weaponName: string,
  isRanged: boolean,
  traits: ReturnType<typeof weaponTraits>,
  ammunition: AmmunitionProfile | undefined,
  compatibleAmmunition: CompatibleAmmunition[],
  selectedAmmunition: CompatibleAmmunition | undefined,
  enhancement: number,
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
  const requirements = parseDamageReductionQualifier(qualifier);
  if (!requirements) {
    return {
      status: "manual" as const,
      message: `DR ${amount}/${match[2].trim()} uses an unsupported qualifier; evaluate it manually.`,
    };
  }

  const usesAmmunition = isRanged && !traits.thrown;
  if (usesAmmunition) {
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
    if (!selectedAmmunition || !compatibleAmmunition.some((entry) => entry.key === selectedAmmunition.key)) {
      return {
        status: "manual" as const,
        message: `DR ${amount}/${qualifier}: select a compatible ammunition package to evaluate this attack.`,
      };
    }
  }

  const attackMaterial = usesAmmunition ? selectedAmmunition?.material : getWeaponMaterial(item, weaponName);
  const bypassesDamageReduction = requirements.some((group) => group.every((requirement) => {
    if (requirement === "magic") {
      return enhancement >= 1 ||
        (usesAmmunition && (selectedAmmunition?.enhancement ?? 0) >= 1);
    }
    return attackMaterial === requirement;
  }));
  if (bypassesDamageReduction) {
    const bypassSource = usesAmmunition && selectedAmmunition
      ? `this weapon and selected ${selectedAmmunition.name}`
      : "this weapon";
    return {
      status: "bypassed" as const,
      message: `DR ${amount}/${qualifier} is bypassed by ${bypassSource}.`,
    };
  }
  return {
    status: "applies" as const,
    message: `DR ${amount}/${qualifier} applies to this attack.`,
  };
}

export function getCombatSpace(character: Character) {
  const race = getRaceDefinitionForCharacter(character) ?? raceDefinitions.human;
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

function getWeaponCriticalProfile(
  critical: string,
  weaponName: string,
  damageType: string,
  improvedCritical = false,
) {
  const keenApplies =
    /(?:^|\s)keen(?:\s|$)/i.test(weaponName) &&
    /(piercing|slashing)/i.test(damageType);
  if (!improvedCritical && !keenApplies)
    return critical;

  const match = critical.match(/^(?:(\d+)(?:([–-])(\d+))?\/)?(x\d+)$/i);
  if (!match) return critical;
  const lowerBound = Number(match[1] ?? 20);
  const upperBound = Number(match[3] ?? 20);
  if (lowerBound < 2 || upperBound > 20 || lowerBound > upperBound)
    return critical;

  const doubledRangeWidth = upperBound - lowerBound + 1;
  const widenedLowerBound = Math.max(2, lowerBound - doubledRangeWidth);
  return `${widenedLowerBound}${match[2] ?? "–"}${upperBound}/${match[4]}`;
}

function getElementalWeaponDamage(weaponName: string) {
  return [
    ["Flaming", "fire"],
    ["Frost", "cold"],
    ["Shock", "electricity"],
  ]
    .filter(([property]) => weaponName.includes(`${property} `))
    .map(([property, damageType]) => `${property}: 1d6 ${damageType} damage`);
}

export function getStoreItemDescription(
  item: StoreItem,
  size = "Medium",
  weaponName = item.name,
) {
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
    const armorPropertyDetails = [
      /\bFortification \+/i.test(weaponName)
        ? "Light Fortification: 25% chance to negate extra damage from a critical hit or sneak attack; resolve the percentile roll manually."
        : "",
      /\bGlamered \+/i.test(weaponName)
        ? "Glamered: on command, appears to be ordinary clothing or other garb without changing the armor's properties or weight."
        : "",
      /\bSlick \+/i.test(weaponName)
        ? "Slick: +5 competence bonus on Escape Artist checks; this armor's check penalty still applies."
        : "",
    ].filter(Boolean);
    return `${baseDescription}${armorClass} armor; armor bonus +${armorBonus}; max Dex ${maximumDexterity === Infinity ? "—" : `+${maximumDexterity}`}; armor check penalty ${checkPenalty}; arcane spell failure ${item.arcaneSpellFailure ?? 0}%; speed ${item.armorSpeed ?? "varies"}.${masterworkBenefit}${armorPropertyDetails.length ? ` ${armorPropertyDetails.join(" ")}` : ""}`;
  }
  if (item.category === "Weapons") {
    const profile = getWeaponProfile(item.name);
    const baseWeaponName = item.name.replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "");
    const damageType = item.damageType ?? weaponDamageTypes[item.name] ?? weaponDamageTypes[baseWeaponName] ?? "varies";
    const damage = getWeaponDamageForSize(item, size);
    const criticalValue = getWeaponCriticalProfile(
      item.critical ?? profile.crit,
      weaponName,
      damageType,
    );
    const critical = item.custom || criticalValue !== "20/x2" ? `; crit ${criticalValue}` : "";
    const enchantmentDamage = getElementalWeaponDamage(weaponName);
    const enchantmentDescription = enchantmentDamage.length
      ? ` Elemental damage: ${enchantmentDamage.join("; ")}.`
      : "";
    const masterworkBenefit = /^(?:Masterwork|Mithral) /.test(item.name)
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
    return `${item.description ? `${item.description} ` : ""}${damageType}; ${damage} damage${critical}.${properties ? ` Properties: ${properties}.` : ""}${masterworkBenefit}${enchantmentDescription}`;
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
  const spellItemMatch = name.match(/^(Wand|Scroll|Potion) of (.+?) \(CL /);
  const spellName = spellItemMatch?.[2];
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
    category: item?.category ?? (spellItemMatch ? "Potions, Scrolls & Wands" : "Crafted item"),
    description: item ? getStoreItemDescription(item, size, name) : "Inventory item.",
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

export function getWornArmor(character: Character) {
  const name = character.equipment.Armor ?? "";
  const item = findStoreItem(name, "Armor");
  const baseName = item?.custom ? undefined : armorNames.find((base) => name.includes(base));
  const category = baseName ? armorClasses[baseName] : item?.armorCategory;
  const movementCategory = getArmorCategoryForLimitations(baseName, category);
  return { name, movementCategory, maximumDexterity: baseName ? armorMaximumDexterity[baseName] : item?.maxDexterity ?? Infinity };
}

function getArmorCategoryForLimitations(
  baseName: string | undefined,
  category: "Light" | "Medium" | "Heavy" | undefined,
) {
  return baseName?.startsWith("Mithral")
    ? category === "Heavy" ? "Medium" : "Light"
    : category;
}

export function getRangerCombatStyleStatus(character: Character) {
  const rangerLevel = getBaseClassLevels(character)
    .filter((entry) => entry.classId === "ranger")
    .reduce((total, entry) => total + entry.level, 0);
  const style = character.featSelections?.["ranger-style-2"];
  const hasStyle =
    rangerLevel >= 2 &&
    (style === "rapid-shot" || style === "two-weapon-fighting");
  if (!hasStyle) return { hasStyle: false, active: false, warning: undefined };

  const armor = getWornArmor(character);
  if (!armor.name || armor.movementCategory === "Light")
    return { hasStyle: true, active: true, warning: undefined };
  if (armor.movementCategory === "Medium" || armor.movementCategory === "Heavy")
    return {
      hasStyle: true,
      active: false,
      warning:
        "Ranger style is inactive in medium or heavy armor; separately selected feats still apply.",
    };
  return {
    hasStyle: true,
    active: false,
    warning:
      "Ranger style is inactive because the equipped armor category is unknown.",
  };
}

export function hasActiveCombatFeat(character: Character, featId: string) {
  return getActiveFeatEntries(character).some(
    ([slotId, selectedFeat]) =>
      selectedFeat === featId &&
      (!slotId.startsWith("ranger-style-") ||
        getRangerCombatStyleStatus(character).active),
  );
}

export function getMonkAbilityState(
  character: Character,
  encumbrance = getEncumbrance(character),
) {
  const level = getBaseClassLevel(character, "monk");
  const armor = (character.equipment?.Armor ?? "").trim();
  const shield = (character.equipment?.Shield ?? "").trim();
  const reason = armor
    ? "wearing armor"
    : shield
      ? "using a shield"
      : encumbrance.load !== "Light"
        ? `carrying a ${encumbrance.load.toLowerCase()} load`
        : encumbrance.unknownWeights.length
          ? "carried weight includes items with unknown weight"
          : undefined;
  return { level, active: level > 0 && !reason, reason: reason ?? "" };
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
export type CombatAttackMode = "single" | "full-attack" | "flurry" | "manyshot";
export type CombatTargetDefenseContext = {
  cover: "none" | "less-than-total" | "total";
  concealment: "none" | "less-than-total" | "total";
  targetEngagedWithFriendly?: boolean;
  targetAtLeast10FeetFromNearestFriendly?: boolean;
};

const projectileWeaponNames = new Set([
  "Shortbow", "Longbow", "Composite Shortbow", "Composite Longbow",
  "Light Crossbow", "Heavy Crossbow", "Hand Crossbow",
  "Repeating Crossbow", "Repeating Light Crossbow", "Repeating Heavy Crossbow", "Sling",
]);

const monkSpecialWeaponNames = new Set([
  "Kama", "Nunchaku", "Quarterstaff", "Sai", "Shuriken", "Siangham",
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
    const baseDamage = lightShield ? (spiked ? "1d4" : "1d3") : (spiked ? "1d6" : "1d4");
    const damageForSize = (size: string) => {
      let damage = getSizedWeaponDamage(baseDamage, size);
      if (shieldBashState.bashing) {
        damage = weaponDamageBySize[damage]?.larger ?? damage;
        damage = weaponDamageBySize[damage]?.larger ?? damage;
      }
      return damage;
    };
    return {
      name,
      category: "Weapons" as const,
      price: 0,
      weight: "—",
      custom: true,
      proficiency: "Martial" as const,
      handedness: lightShield ? "Light" as const : "One-handed" as const,
      finesse: false,
      damage: baseDamage,
      damageSmall: damageForSize("Small"),
      damageMedium: damageForSize("Medium"),
      damageLarge: damageForSize("Large"),
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
  const characterSize = getRaceDefinitionForCharacter(character)?.size ?? "Medium";
  if (getBaseEquipmentName(item.name) === "Unarmed Strike") {
    return {
      weaponSize: characterSize,
      characterSize,
      sizeDifference: 0,
      attackPenalty: 0,
      effectiveHandedness: "light" as const,
      wieldable: true,
      warning: undefined,
    };
  }
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
  const animatedShieldState = getAnimatedShieldState(character);
  return {
    enabled: character.doubleWeaponMode === true,
    canUseBothEnds: !character.equipment?.["Off Hand Weapon"] &&
      (!character.equipment?.Shield || isBucklerEquipped(character) || animatedShieldState.active),
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

function isRangedWeaponInSlot(character: Character, slot: WeaponSlot) {
  const key = getEffectiveWeaponKey(character, slot);
  if (!key) return false;
  const name = key.replace(/ \((Small|Medium|Large)\)$/, "");
  const item = getWeaponItemForKey(character, name);
  return Boolean(item && item.category === "Weapons" && weaponTraits(item).ranged);
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
  const retainsShieldACBonus = getChosenFeats(character)
    .includes("improved-shield-bash");
  const animatedShieldState = getAnimatedShieldState(character);
  const bashing = Boolean(shieldType && (
    /\bBashing\b/i.test(shieldName) || /\bBashing\b/i.test(shield?.specialProperties ?? "")
  ));
  const weaponSize = shieldName ? getInventoryEntryDetails(shieldName).size : "Medium";
  const characterSize = getRaceDefinitionForCharacter(character)?.size ?? "Medium";
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
      character.doubleWeaponMode !== true &&
      !animatedShieldState.active,
  );
  const weaponName = shieldType
    ? `${spiked ? "Spiked " : ""}${shieldType} Shield Bash`
    : undefined;
  return {
    canBash,
    hasBashableShield: Boolean(shieldType),
    enabled: canBash && character.shieldBashMode === true,
    retainsShieldACBonus,
    spiked,
    bashing,
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
  const animatedShieldState = getAnimatedShieldState(character);
  return {
    grip: character.mainWeaponGrip ?? "one-handed",
    canUseTwoHands: !character.equipment?.["Off Hand Weapon"] &&
      (!character.equipment?.Shield || isBucklerEquipped(character) || animatedShieldState.active),
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
  const animatedShield = getAnimatedShieldState(character).active;
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
    if (hasShield && !buckler && !animatedShield) {
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
    if (usesTwoHands && hasShield && !buckler && !animatedShield) {
      return "A non-buckler shield occupies your off hand; use a one-handed grip or unequip the shield.";
    }
  } else if (slot === "Off Hand Weapon") {
    if (mainUsesTwoHands) return "An off-hand weapon is incompatible with a two-handed main-weapon grip.";
    if (hasShield && !buckler && !animatedShield) return "A non-buckler shield occupies your off hand.";
  } else if (
    slot === "Ranged Weapon" &&
    hasShield &&
    !buckler &&
    !animatedShield &&
    (weaponTraits(item).twoHanded || sizeHandling.effectiveHandedness === "two-handed")
  ) {
    return "A non-buckler shield occupies one hand required by this ranged weapon.";
  }
  return null;
}

export function getEquipmentCheckPenalty(name: string, slot: "Armor" | "Shield") {
  const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
  const names = slot === "Armor" ? armorNames : shieldNames;
  const penalties = slot === "Armor" ? armorCheckPenalties : shieldCheckPenalties;
  const baseName = item?.custom ? undefined : names.find((base) => name.includes(base));
  const penalty = baseName ? penalties[baseName] :
    -Math.abs((slot === "Armor" ? item?.armorCheckPenalty : item?.shieldCheckPenalty) ?? 0);
  const masterwork = /Masterwork|\+\d+/.test(name) && !baseName?.startsWith("Mithral ");
  return Math.min(0, penalty + (masterwork ? 1 : 0));
}

export function getCharacterEquipmentCheckPenalty(
  character: Character,
  name: string,
  slot: "Armor" | "Shield",
) {
  const penalty = getEquipmentCheckPenalty(name, slot);
  if (slot !== "Armor" || getPrestigeClassLevel(character, "knight-of-the-crown") < 7)
    return penalty;
  const item = findStoreItem(name, "Armor");
  const baseName = item?.custom ? undefined : armorNames.find((base) => name.includes(base));
  const category = baseName ? armorClasses[baseName] : item?.armorCategory;
  return category === "Heavy" ? Math.min(0, penalty + 1) : penalty;
}

function finesseShieldPenalty(character: Character) {
  const shield = character.equipment?.Shield;
  return shield ? getCharacterEquipmentCheckPenalty(character, shield, "Shield") : 0;
}

export function getArmorShieldProficiencies(
  character: Character,
  excludingSlot?: string,
  prerequisiteFeatIds?: readonly string[],
) {
  const proficiencies = new Set(
    prerequisiteFeatIds ?? getChosenFeats(character, excludingSlot),
  );
  const race = getRaceDefinitionForCharacter(character);
  for (const proficiency of race?.racialArmorProficiencies ?? [])
    proficiencies.add(`armor-proficiency-${proficiency}`);
  if (race?.racialShieldProficiency) proficiencies.add("shield-proficiency");
  for (const { classId } of getBaseClassLevels(character)) {
    if (["fighter", "paladin", "cleric", "duskblade", "knight"].includes(classId)) proficiencies.add("armor-proficiency-heavy");
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "dragon-shaman", "duskblade", "knight"].includes(classId)) {
      proficiencies.add("armor-proficiency-medium");
    }
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "ranger", "bard", "rogue", "noble", "beguiler", "dragon-shaman", "duskblade", "knight"].includes(classId)) {
      proficiencies.add("armor-proficiency-light");
    }
    if (["fighter", "paladin", "cleric", "barbarian", "druid", "ranger", "bard", "dragon-shaman", "duskblade", "knight"].includes(classId)) {
      proficiencies.add("shield-proficiency");
    }
    if (classId === "fighter") proficiencies.add("tower-shield-proficiency");
  }
  for (const entry of character.classLevels) {
    if (!("prestigeClassId" in entry)) continue;
    const definition = dragonlancePrestigeClasses[entry.prestigeClassId];
    for (const proficiency of definition.armorProficiencies ?? [])
      proficiencies.add(`armor-proficiency-${proficiency}`);
    if (definition.shieldProficiency) proficiencies.add("shield-proficiency");
    if (definition.towerShieldProficiency) proficiencies.add("tower-shield-proficiency");
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
    const proficiencyCategory = getArmorCategoryForLimitations(baseName, category);
    return !!proficiencyCategory &&
      proficiencies.has(`armor-proficiency-${proficiencyCategory.toLowerCase()}`);
  }
  return false;
}

export function getArmorNonproficiencyPenalties(character: Character) {
  return (["Armor", "Shield"] as const).flatMap((slot) => {
    const name = character.equipment[slot];
    if (!name) return [];
    const item = findStoreItem(name, slot === "Armor" ? "Armor" : "Shields");
    if (!item || isArmorShieldProficient(character, item)) return [];
    const penalty = getCharacterEquipmentCheckPenalty(character, name, slot);
    return penalty < 0 ? [{ source: `${slot.toLowerCase()} (nonprof.)`, name, penalty, multiplier: 1 }] : [];
  });
}

export function getImprovedInitiativeBonus(character: Character) {
  return getChosenFeats(character).includes("improved-initiative") ? 4 : 0;
}

export function getCombatExpertiseLimit(character: Character) {
  if (
    !getChosenFeats(character).includes("combat-expertise") ||
    getEffectiveAbilityScore(character, "int") < 13
  ) return 0;
  return Math.min(5, getBaseAttackBonus(character));
}

export function getCombatExpertiseAmount(character: Character, selectedAmount = 0) {
  const limit = getCombatExpertiseLimit(character);
  return Number.isInteger(selectedAmount) && selectedAmount > 0 && selectedAmount <= limit
    ? selectedAmount
    : 0;
}

export function getPowerAttackLimit(character: Character) {
  if (
    !getChosenFeats(character).includes("power-attack") ||
    getEffectiveAbilityScore(character, "str") < 13
  ) return 0;
  return getBaseAttackBonus(character);
}

export function getPowerAttackAmount(character: Character, selectedAmount = 0) {
  const limit = getPowerAttackLimit(character);
  return Number.isInteger(selectedAmount) && selectedAmount > 0 && selectedAmount <= limit
    ? selectedAmount
    : 0;
}

export function getDodgeFeatBonus(character: Character, againstSelectedOpponent = false) {
  return againstSelectedOpponent &&
    getChosenFeats(character).includes("dodge") &&
    getEffectiveAbilityScore(character, "dex") >= 13
    ? 1
    : 0;
}

export function getAttackOfOpportunityCapacity(character: Character) {
  const hasCombatReflexes = getChosenFeats(character).includes("combat-reflexes");
  const dexterityBonus = abilityModifier(getEffectiveAbilityScore(character, "dex"));
  const additionalAttacks = hasCombatReflexes ? Math.max(0, dexterityBonus) : 0;
  return {
    maximumPerRound: 1 + additionalAttacks,
    additionalAttacks,
    hasCombatReflexes,
    canAttackWhileFlatFooted: hasCombatReflexes,
    dexterityBonus,
  };
}

export function getInitiativeModifier(character: Character) {
  return abilityModifier(getEffectiveAbilityScore(character, "dex")) +
    getImprovedInitiativeBonus(character) +
    getKnightOfCrownHeroicInitiativeBonus(character) +
    getDuelistImprovedReactionBonus(character) +
    getCombatEffectModifier(character, "checks") +
    getArmorNonproficiencyPenalties(character)
      .reduce((total, entry) => total + entry.penalty, 0);
}

export function getDuelistImprovedReactionBonus(character: Character) {
  const level = getPrestigeClassLevel(character, "duelist");
  return level >= 8 ? 4 : level >= 2 ? 2 : 0;
}

export function getKnightOfCrownHeroicInitiativeBonus(character: Character) {
  const level = getPrestigeClassLevel(character, "knight-of-the-crown");
  return level >= 8 ? 3 : level >= 5 ? 2 : level >= 2 ? 1 : 0;
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
  selectedCombatExpertiseAmount = 0,
  selectedPowerAttackAmount = 0,
  attackMode: CombatAttackMode = "full-attack",
  targetDefense?: CombatTargetDefenseContext,
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
  const mainHandIsRanged = slot === "Off Hand Weapon" &&
    isRangedWeaponInSlot(character, "Main Weapon");
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
  const rogueSneakAttackDice = Math.ceil(getBaseClassLevel(character, "rogue") / 2);
  const sneakAttackOutOfRange = isRanged &&
    targetDistanceFeet !== undefined &&
    targetDistanceFeet > 30;
  const sneakAttackObscured = targetDefense?.concealment !== undefined &&
    targetDefense.concealment !== "none";
  const sneakAttackBlockedByCover = targetDefense?.cover === "total";
  const sneakAttackWarning = rogueSneakAttackDice === 0
    ? undefined
    : sneakAttackOutOfRange
      ? "Ranged sneak attack requires 30 ft. or less."
      : sneakAttackObscured
        ? "Concealment prevents sneak attack."
        : sneakAttackBlockedByCover
          ? "Total cover blocks sneak attack."
          : undefined;
  const sneakAttackDamage = rogueSneakAttackDice > 0 && !sneakAttackWarning
    ? `${rogueSneakAttackDice}d6`
    : undefined;
  const isUnarmedStrike = traits.baseName === "Unarmed Strike";
  const twoHandedGrip = !doubleWeaponMode && (sizeHandling.effectiveHandedness === "two-handed" ||
    (slot === "Main Weapon" && sizeHandling.effectiveHandedness === "one-handed" &&
      character.mainWeaponGrip === "two-handed"));
  const strength = abilityModifier(getEffectiveAbilityScore(character, "str"));
  const dexterity = abilityModifier(getEffectiveAbilityScore(character, "dex"));
  const shieldPenalty = finesseShieldPenalty(character);
  const characterSize = getRaceDefinitionForCharacter(character)?.size ?? "Medium";
  const usesFinesse = !isRanged && traits.finesse &&
    size === characterSize && getChosenFeats(character).includes("weapon-finesse") &&
    dexterity + shieldPenalty > strength;
  const shieldBashState = getShieldBashState(character);
  const enhancement = shieldBashState.enabled &&
    name === shieldBashState.weaponName &&
    shieldBashState.bashing
    ? 1
    : Number(name.match(/\+(\d+)/)?.[1] ?? 0);
  const masterwork = item.name.startsWith("Masterwork ") ? 1 : 0;
  const attackEnhancement = Math.max(enhancement, masterwork);
  const baseAttackBonus = getBaseAttackBonus(character);
  const combatExpertisePenalty = isRanged
    ? 0
    : -getCombatExpertiseAmount(character, selectedCombatExpertiseAmount);
  const powerAttackAmount = isRanged ? 0 : getPowerAttackAmount(character, selectedPowerAttackAmount);
  const powerAttackPenalty = powerAttackAmount > 0 ? -powerAttackAmount : 0;
  const abilityAttackBonus = isRanged || usesFinesse ? dexterity : strength;
  const sizeAttackBonus = sizeModifier(character);
  const finessePenalty = usesFinesse ? shieldPenalty : 0;
  const towerShieldAttackPenalty = towerShieldState.equipped ? -2 : 0;
  const nonproficiencyPenalties = [
    ...getArmorNonproficiencyPenalties(character),
    ...(isWeaponProficient(character, item, undefined, twoHandedGrip)
      ? []
      : [{ source: "weapon (nonprof.)", name: item.name, penalty: -4, multiplier: 1 }]),
  ];
  const nonproficiencyPenalty = nonproficiencyPenalties.reduce((total, entry) => total + entry.penalty, 0);
  const activeAttack = getCombatEffectModifier(character, "attack");
  const activeDamage = getCombatEffectModifier(character, "damage");
  const race = getRaceDefinitionForCharacter(character);
  const targetAttackBonus = Math.max(
    0,
    ...targetTypes.map((targetType) => race?.racialAttackBonuses?.[targetType] ?? 0),
  );
  const pointBlankShotBonus =
    isRanged &&
    targetDistanceFeet !== undefined &&
    targetDistanceFeet >= 0 &&
    targetDistanceFeet <= 30 &&
    getChosenFeats(character).includes("point-blank-shot")
      ? 1
      : 0;
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
    getActiveFeatEntries(character).some(
      ([slotId, featId]) =>
        featId === "weapon-focus" &&
        character.featWeaponSelections?.[slotId] === weaponFeatType,
    ) ? 1 : 0;
  const weaponSpecializationBonus = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "weapon-specialization" &&
      character.featWeaponSelections?.[slotId] === weaponFeatType,
  ) ? 2 : 0;
  const greaterWeaponFocusBonus = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "greater-weapon-focus" &&
      character.featWeaponSelections?.[slotId] === weaponFeatType,
  ) ? 1 : 0;
  const greaterWeaponSpecializationBonus = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "greater-weapon-specialization" &&
      character.featWeaponSelections?.[slotId] === weaponFeatType,
  ) ? 2 : 0;
  const improvedCritical = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "improved-critical" &&
      character.featWeaponSelections?.[slotId] === weaponFeatType,
  );
  const racialAttackDetails = [
    ...(matchingTarget && targetAttackBonus && race
      ? [`${race.name} vs. ${combatTargetLabels[matchingTarget]} ${formatModifier(targetAttackBonus)} racial`]
      : []),
    ...(thrownAttackBonus && race ? [`${race.name} thrown/slings ${formatModifier(thrownAttackBonus)} racial`] : []),
  ];
  const loremasterAttackBonus = Number(hasLoremasterSecret(character, "Weapon Trick"));
  const attackBeforeFinalPenalties = baseAttackBonus + abilityAttackBonus + sizeAttackBonus + sizeHandling.attackPenalty + attackEnhancement + attackPenalty + finessePenalty + nonproficiencyPenalty + towerShieldAttackPenalty + compositeBowStrengthPenalty + racialAttackBonus + pointBlankShotBonus + weaponFocusBonus + greaterWeaponFocusBonus + combatExpertisePenalty + powerAttackPenalty + activeAttack + loremasterAttackBonus;
  const rangeIncrement = getEffectiveWeaponRangeForSize(character, item, size, isRanged);
  const rangeDetails = getRangedAttackDistanceDetails(item, rangeIncrement, isRanged, targetDistanceFeet);
  const ammunition = getWeaponAmmunitionProfile(item, isRanged);
  const compatibleAmmunition = getCompatibleAmmunition(character, ammunition);
  const ammunitionOptions = isRanged && !traits.thrown && ammunition
    ? compatibleAmmunition
    : undefined;
  const selectedAmmunition = ammunitionOptions?.find((entry) => entry.key === selectedAmmunitionKey);
  const rangedReadiness = getWeaponAmmunitionReadiness(character, item, isRanged, ammunition, compatibleAmmunition);
  const damageReductionStatus = getTargetDamageReductionStatus(
    targetDamageReduction,
    item,
    name,
    isRanged,
    traits,
    ammunition,
    compatibleAmmunition,
    selectedAmmunition,
    enhancement,
  );
  const bucklerAttackPenalty = isBucklerEquipped(character) && !isRanged &&
    (slot === "Off Hand Weapon" || (slot === "Main Weapon" &&
      (twoHandedGrip || Boolean(character.equipment?.["Off Hand Weapon"]) || doubleWeaponMode)))
    ? -1
    : 0;
  const shootingIntoMeleePenalty =
    isRanged &&
    targetDefense?.targetEngagedWithFriendly === true &&
    targetDefense.targetAtLeast10FeetFromNearestFriendly !== true &&
    !hasActiveCombatFeat(character, "precise-shot")
      ? -4
      : 0;
  const finalAttack =
    attackBeforeFinalPenalties + bucklerAttackPenalty +
    rangeDetails.attackPenalty + shootingIntoMeleePenalty;
  const monkState = getMonkAbilityState(character);
  const hasRapidReload = getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "rapid-reload" &&
      character.featWeaponSelections?.[slotId] === traits.baseName,
  );
  const isReloadLimitedCrossbow = [
    "Hand Crossbow",
    "Light Crossbow",
    "Heavy Crossbow",
  ].includes(traits.baseName);
  const canMakeMultipleCrossbowAttacks =
    hasRapidReload &&
    (traits.baseName === "Hand Crossbow" || traits.baseName === "Light Crossbow");
  const attackSequenceLength = attackMode === "flurry"
    ? Math.min(4, Math.max(1, Math.ceil(baseAttackBonus / 5)))
    : slot === "Off Hand Weapon"
    ? 1
    : Math.min(4, Math.max(1, Math.ceil(baseAttackBonus / 5)));
  let attackSequence = rangeDetails.outOfRange
    ? []
    : Array.from(
      { length: attackMode === "single" ? 1 : attackSequenceLength },
      (_, index) => finalAttack - index * 5,
    );
  let rapidShotPenalty = 0;
  let flurryPenalty = 0;
  let manyshotArrowCount: number | undefined;
  let attackActionWarning: string | undefined;

  if (attackMode === "full-attack" && slot === "Off Hand Weapon") {
    const hasImprovedTwoWeaponFighting =
      hasActiveCombatFeat(character, "improved-two-weapon-fighting");
    const hasGreaterTwoWeaponFighting =
      hasImprovedTwoWeaponFighting &&
      hasActiveCombatFeat(character, "greater-two-weapon-fighting");
    const offHandAttackCount =
      1 + Number(hasImprovedTwoWeaponFighting) + Number(hasGreaterTwoWeaponFighting);
    attackSequence = rangeDetails.outOfRange
      ? []
      : Array.from(
        { length: offHandAttackCount },
        (_, index) => finalAttack - index * 5,
      );
  }

  if (
    attackMode === "full-attack" &&
    isReloadLimitedCrossbow &&
    !canMakeMultipleCrossbowAttacks
  ) {
    attackSequence = attackSequence.slice(0, 1);
  }

  if (attackMode === "full-attack" && isRanged &&
    hasActiveCombatFeat(character, "rapid-shot") &&
    (!isReloadLimitedCrossbow || canMakeMultipleCrossbowAttacks)) {
    rapidShotPenalty = -2;
    attackSequence = attackSequence.map((bonus) => bonus + rapidShotPenalty);
    if (attackSequence.length > 0 && !mainHandIsRanged) {
      attackSequence.splice(1, 0, attackSequence[0]);
    }
  }

  if (attackMode === "flurry") {
    if (monkState.level < 1) {
      attackActionWarning = "Flurry of blows requires at least one Monk level.";
    } else if (!monkState.active) {
      attackActionWarning = `Flurry of blows is unavailable: ${monkState.reason}.`;
    } else if (
      traits.baseName !== "Unarmed Strike" &&
      !monkSpecialWeaponNames.has(traits.baseName)
    ) {
      attackActionWarning = "Flurry of blows requires unarmed strikes or a special Monk weapon.";
    } else if (!rangeDetails.outOfRange) {
      flurryPenalty = monkState.level < 5 ? -2 : monkState.level < 9 ? -1 : 0;
      attackSequence = attackSequence.map((bonus) => bonus + flurryPenalty);
      const extraAttacks = monkState.level >= 11 ? 2 : 1;
      attackSequence.unshift(...Array(extraAttacks).fill(attackSequence[0]));
    }
    if (attackActionWarning) attackSequence = [];
  }

  if (attackMode === "manyshot") {
    const hasActiveManyshot = hasActiveCombatFeat(character, "manyshot");
    const isBow = traits.baseName.endsWith("bow") &&
      !traits.baseName.endsWith("Crossbow");
    if (!hasActiveManyshot) {
      attackActionWarning = "Manyshot feat must be active.";
    } else if (!isRanged || !isBow) {
      attackActionWarning = "Bow required.";
    } else if (baseAttackBonus < 6) {
      attackActionWarning = "BAB needs +6.";
    } else if (targetDistanceFeet === undefined || targetDistanceFeet > 30) {
      attackActionWarning = "Target must be within 30 ft.";
    } else if (!rangeDetails.outOfRange) {
      manyshotArrowCount = Math.min(
        4,
        1 + Math.floor((baseAttackBonus - 1) / 5),
      );
      attackSequence = [finalAttack - 2 * manyshotArrowCount];
    }
    if (attackActionWarning) {
      attackSequence = [];
    }
  }
  if (targetDefense?.cover === "total") {
    attackSequence = [];
    manyshotArrowCount = undefined;
  }
  const attack = attackSequence[0] ?? finalAttack;
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
    damageAbility = Math.floor(strength * (
      slot === "Off Hand Weapon" && attackMode !== "flurry"
        ? 0.5
        : !isRanged && twoHandedGrip ? 1.5 : 1
    ));
  }
  const weaponMaterial = getWeaponMaterial(item, name);
  const silverWeaponDamagePenalty = weaponMaterial === "alchemical-silver" && (!isRanged || traits.thrown);
  const silverAmmunitionDamagePenalty = selectedAmmunition?.material === "alchemical-silver";
  const silverDamagePenalty = silverWeaponDamagePenalty || silverAmmunitionDamagePenalty ? -1 : 0;
  const powerAttackDamageBonus = powerAttackAmount === 0 ||
    (sizeHandling.effectiveHandedness === "light" &&
      !isUnarmedStrike)
    ? 0
    : twoHandedGrip
      ? powerAttackAmount * 2
      : powerAttackAmount;
  const damageBonus = damageAbility + enhancement + activeDamage + weaponSpecializationBonus + greaterWeaponSpecializationBonus + pointBlankShotBonus + powerAttackDamageBonus + silverDamagePenalty;
  const damageDice = isUnarmedStrike
    ? getUnarmedStrikeDamage(monkState.level, getRaceDefinitionForCharacter(character)?.size ?? "Medium")
    : getWeaponEndDamageForSize(item, size, usesAlternateEnd ? "off-hand" : "main");
  const enchantmentDamage = getElementalWeaponDamage(name);
  const damage = damageDice === "—" || damageDice === "varies" ? damageDice :
    `${damageDice}${damageBonus >= 0 ? `+${damageBonus}` : damageBonus}`;
  const damageType = usesAlternateEnd
    ? item.offHandDamageType ?? profile.offHandDamageType ?? item.damageType ?? weaponDamageTypes[traits.baseName] ?? "varies"
    : item.damageType ?? weaponDamageTypes[traits.baseName] ?? "varies";
  const critical = getWeaponCriticalProfile(
    usesAlternateEnd
      ? item.offHandCritical ?? profile.offHandCrit ?? item.critical ?? profile.crit
      : item.critical ?? profile.crit,
    name,
    damageType,
    improvedCritical,
  );
  const manyshotDamage = manyshotArrowCount ? {
    arrowCount: manyshotArrowCount,
    damagePerArrow: damage,
    damageReductionPerArrow: damageReductionStatus,
    precisionDamageApplications: 1,
    criticalDamageOnlyOnFirstArrow: true,
  } : undefined;
  return {
    name: displayName,
    attack,
    combatExpertisePenalty,
    powerAttackPenalty,
    powerAttackDamageBonus,
    attackSequence,
    attackActionWarning,
    rapidShotPenalty,
    flurryPenalty,
    shootingIntoMeleePenalty,
    manyshotArrowCount,
    manyshotDamage,
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
    damage,
    materialDamageNote: silverAmmunitionDamagePenalty
      ? "Alchemical silver ammunition: -1 damage (minimum 1)."
      : silverWeaponDamagePenalty ? "Alchemical silver: -1 damage (minimum 1)." : undefined,
    damageType,
    critical,
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
    pointBlankShotBonus,
    weaponFocusBonus,
    weaponSpecializationBonus,
    greaterWeaponFocusBonus,
    loremasterAttackBonus,
    greaterWeaponSpecializationBonus,
    damageAbility,
    attackPenalty,
    compositeBowStrengthRating,
    compositeBowStrengthPenalty,
    finessePenalty,
    nonproficiencyPenalty,
    nonproficiencyPenalties,
    enchantmentDamage,
    ...(rogueSneakAttackDice > 0
      ? {
        sneakAttackDamage,
        sneakAttackWarning,
        sneakAttackNote: "Conditional precision: target denied DEX to AC or flanked; ranged attacks only within 30 ft.; not multiplied on a critical hit. Check critical immunity and vital-spot access.",
      }
      : {}),
  };
}

export function getTwoWeaponAttackPenalty(character: Character, slot: "Main Weapon" | "Off Hand Weapon") {
  const mainWeapon = character.equipment?.["Main Weapon"];
  const offHandWeapon = getEffectiveWeaponKey(character, "Off Hand Weapon");
  if (!mainWeapon || !offHandWeapon) return 0;
  const hasFeat = hasActiveCombatFeat(character, "two-weapon-fighting");
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
const elfWeaponRaceIds = new Set(["elf", "qualinesti-elf", "silvanesti-elf"]);
const bardWeaponNames = new Set([
  "Longsword", "Rapier", "Sap", "Short Sword", "Shortbow", "Whip",
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

const twoHandedMartialWeaponNames = new Set(["Bastard Sword", "Dwarven Waraxe"]);
const strength13ExoticWeaponNames = new Set([
  "Bastard Sword",
  "Dwarven Waraxe",
]);

function meetsExoticWeaponStrengthPrerequisite(
  character: Character,
  weaponType: string,
  characterLevel?: number,
) {
  return (
    !strength13ExoticWeaponNames.has(weaponType) ||
    getAbilityScoreAtCharacterLevel(character, "str", characterLevel) >= 13
  );
}

function getWeaponProficiencyCategory(character: Character, item: StoreItem) {
  if (item.category !== "Weapons") return undefined;
  const baseName = getBaseEquipmentName(item.name);
  const race = getRaceDefinitionForCharacter(character);
  if (elfWeaponRaceIds.has(race?.id ?? "") && elfWeaponNames.has(baseName)) return "Martial";

  let proficiency = item.custom
    ? item.proficiency
    : simpleWeaponNames.has(baseName)
      ? "Simple"
      : martialWeaponNames.has(baseName)
        ? "Martial"
        : "Exotic";
  if (
    (["dwarf", "hill-dwarf", "mountain-dwarf", "dark-dwarf"].includes(race?.id ?? "") &&
      ["Dwarven Waraxe", "Dwarven Urgrosh"].includes(baseName)) ||
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
    if (dragonlancePrestigeClasses[prestigeClassId]?.source !== core35ContentId) return false;
    if (broadWeaponPrestigeClasses.has(prestigeClassId)) {
      return proficiency === "Simple" || proficiency === "Martial";
    }
    return specificPrestigeWeaponNames[prestigeClassId]?.has(baseName) ?? false;
  };
  return character.classLevels.some((level) =>
    "prestigeClassId" in level && grantsProficiency(level.prestigeClassId),
  );
}

export function isWeaponProficient(
  character: Character,
  item: StoreItem,
  excludingFeatSlot?: string,
  twoHandedGrip = false,
) {
  if (item.category !== "Weapons") return true;
  const weaponType = getWeaponFeatTypeName(item.name);
  const activeFeatEntries = getActiveFeatEntries(character);
  const proficiency = getWeaponProficiencyCategory(character, item);
  const martialProficiencyApplies =
    proficiency === "Martial" ||
    (proficiency === "Exotic" &&
      twoHandedGrip &&
      twoHandedMartialWeaponNames.has(weaponType));
  if (
    proficiency === "Exotic" &&
    activeFeatEntries.some(([slotId, featId]) => {
      if (
        slotId === excludingFeatSlot ||
        featId !== "exotic-weapon-proficiency" ||
        character.featWeaponSelections?.[slotId] !== weaponType
      )
        return false;
      const featSlot = getFeatSlots(character).find(
        (candidate) => candidate.id === slotId,
      );
      return meetsExoticWeaponStrengthPrerequisite(
        character,
        weaponType,
        featSlot?.characterLevel,
      );
    })
  )
    return true;
  if (martialProficiencyApplies && weaponType === getWarDomainWeapon(character))
    return true;
  if (
    proficiency === "Simple" &&
    activeFeatEntries.some(
      ([slotId, featId]) =>
        slotId !== excludingFeatSlot && featId === "simple-weapon-proficiency",
    )
  ) return true;
  if (
    martialProficiencyApplies &&
    activeFeatEntries.some(
      ([slotId, featId]) =>
        slotId !== excludingFeatSlot &&
        featId === "martial-weapon-proficiency" &&
        character.featWeaponSelections?.[slotId] === weaponType,
    )
  ) return true;
  const baseName = getBaseEquipmentName(item.name);
  const race = getRaceDefinitionForCharacter(character);
  if (race?.racialSimpleWeaponProficiency && proficiency === "Simple") return true;
  if (elfWeaponRaceIds.has(race?.id ?? "") && elfWeaponNames.has(baseName)) return true;
  if (race?.racialWeaponProficiencies?.includes(baseName)) return true;
  const effectiveProficiency = martialProficiencyApplies
    ? "Martial"
    : proficiency;
  if (hasPrestigeClassWeaponProficiency(character, effectiveProficiency, baseName)) return true;
  const prestigeWeaponProficiency = character.classLevels.some((entry) => {
    if (!("prestigeClassId" in entry)) return false;
    const granted = dragonlancePrestigeClasses[entry.prestigeClassId].weaponProficiency;
    return granted === "all" ||
      (granted === "martial" && (proficiency === "Simple" || martialProficiencyApplies)) ||
      (granted === "simple" && proficiency === "Simple");
  });
  if (prestigeWeaponProficiency) return true;

  return getBaseClassLevels(character).some(({ classId }) => {
    if (martialWeaponClasses.has(classId)) return proficiency === "Simple" || martialProficiencyApplies;
    if (classId === "bard") return proficiency === "Simple" || bardWeaponNames.has(baseName);
    if (classId === "beguiler") return proficiency === "Simple" || [
      "Hand Crossbow", "Rapier", "Shortbow", "Short Sword",
    ].includes(baseName);
    if (classId === "dragon-shaman") return proficiency === "Simple";
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
  const classIds = getBaseClassLevels(character).map((entry) => entry.classId);
  if (item.category === "Weapons") {
    const mainWeaponKey = character.equipment?.["Main Weapon"];
    const usesTwoHandedMartialGrip = Boolean(
      mainWeaponKey &&
        character.mainWeaponGrip === "two-handed" &&
        getInventoryEntryDetails(mainWeaponKey).name === item.name,
    );
    return isWeaponProficient(character, item, undefined, usesTwoHandedMartialGrip)
      ? null
      : `${item.name}: this character is not proficient with this weapon and will take the normal nonproficiency penalties.`;
  }
  if (item.category === "Armor" || item.category === "Shields") {
    const metal = /chain|scale|breastplate|plate|steel|mithral|metal|splint/i.test(item.name);
    const prohibitedDruidShield = item.category === "Shields" &&
      !/wooden/i.test(item.name);
    const prohibitedDruidArmor = item.category === "Armor" && metal;
    const druidRestriction = classIds.includes("druid") &&
        (prohibitedDruidArmor || prohibitedDruidShield)
      ? " Druid restriction: prohibited metal armor or nonwooden shields prevent druid spellcasting and supernatural/spell-like class abilities while used and for 24 hours afterward; resolve this restriction manually."
      : "";
    const warning = isArmorShieldProficient(character, item)
      ? "" : `${item.name}: this character is not proficient with this ${item.category === "Armor" ? "armor" : "shield"}. Its check penalty applies to attacks and Strength/Dexterity checks.`;
    return `${warning}${druidRestriction}`.trim() || null;
  }
  return null;
}

export function isClassSkill(
  character: Character,
  skill: string,
  classId?: SkillRankSourceId,
) {
  const racialHitDice = getRacialHitDiceForCharacter(character);
  const racialHitDiceClassSkills = [
    ...(racialHitDice?.classSkills ?? []),
    ...(character.gender?.toLowerCase() === "male" && racialHitDice?.genderedClassSkills?.male
      ? [racialHitDice.genderedClassSkills.male]
      : []),
    ...(character.gender?.toLowerCase() === "female" && racialHitDice?.genderedClassSkills?.female
      ? [racialHitDice.genderedClassSkills.female]
      : []),
  ];
  const skillListIncludes = (classSkills: readonly string[], skillName: string) =>
    classSkills.some((classSkill) => {
      if (classSkill === skillName) return true;
      const wildcardPosition = classSkill.indexOf("(*)");
      if (wildcardPosition < 0) return false;
      const prefix = classSkill.slice(0, wildcardPosition).trimEnd();
      return skillName.startsWith(`${prefix} (`);
    });
  if (classId === "racial-hit-dice")
    return skillListIncludes(racialHitDiceClassSkills, skill);
  if (classId && Object.hasOwn(dragonlancePrestigeClasses, classId)) {
    const definition = dragonlancePrestigeClasses[classId as PrestigeClassId];
    return definition.classSkills
      ? skillListIncludes(definition.classSkills, skill)
      : false;
  }
  const classIds = classId
    ? [classId as ClassId]
    : getBaseClassLevels(character).map((entry) => entry.classId);
  const prestigeSkillMatch = !classId && character.classLevels.some((entry) =>
    "prestigeClassId" in entry &&
    skillListIncludes(
      dragonlancePrestigeClasses[entry.prestigeClassId].classSkills ?? [],
      skill,
    ),
  );
  const dragonShamanTotemSkills: Record<string, string[]> = {
    Black: ["Hide", "Move Silently", "Swim"],
    Blue: ["Bluff", "Hide", "Spellcraft"],
    Brass: ["Bluff", "Gather Information", "Survival"],
    Bronze: ["Disguise", "Survival", "Swim"],
    Copper: ["Bluff", "Hide", "Jump"],
    Gold: ["Disguise", "Heal", "Swim"],
    Green: ["Bluff", "Hide", "Move Silently"],
    Red: ["Appraise", "Bluff", "Jump"],
    Silver: ["Bluff", "Disguise", "Jump"],
    White: ["Hide", "Move Silently", "Swim"],
  };
  return classIds.some((currentClassId) => skillListIncludes(classSkills[currentClassId] ?? [], skill) ||
    (currentClassId === "dragon-shaman" &&
      character.dragonShamanTotem &&
      skillListIncludes(dragonShamanTotemSkills[character.dragonShamanTotem] ?? [], skill)) ||
    (currentClassId === "cleric" && isClericDomainClassSkill(character, skill))) ||
    prestigeSkillMatch ||
    (!classId && skillListIncludes(racialHitDiceClassSkills, skill));
}

export function getAvailableSkillCount(character: Character) {
  const sources = new Set(character.classLevels.map((entry) =>
    "prestigeClassId" in entry ? entry.prestigeClassId : entry.classId));
  return getAvailableSkillCountForSource(character, "racial-hit-dice") +
    [...sources].reduce((total, source) => total + getAvailableSkillCountForSource(character, source), 0);
}

export function getAvailableSkillCountForSource(
  character: Character,
  sourceId: SkillRankSourceId,
) {
  const discipleLevel = getPrestigeClassLevel(character, "dragon-disciple");
  const boostLevel = character.hitPointRolls?.find((roll) =>
    roll.prestigeClassId === "dragon-disciple" && roll.classLevel === 8)?.characterLevel;
  const intModifier = abilityModifier(character.abilities.int);
  const humanBonus = Number(character.race.toLowerCase() === "human");
  const points = (base: number, levels: number, afterBoost = 0) => {
    const before = Math.max(1, base + intModifier + humanBonus - Number(discipleLevel >= 8));
    const after = Math.max(1, base + intModifier + humanBonus);
    return before * (levels - afterBoost) + after * afterBoost;
  };
  if (sourceId === "racial-hit-dice") {
    const racialHitDice = getRacialHitDiceForCharacter(character);
    if (!racialHitDice) return 0;
    return points(racialHitDice.skillPoints, racialHitDice.count + 3);
  }
  const firstBaseClass = getBaseClassLevels(character)[0];
  const hasRacialHitDice = Boolean(getRacialHitDiceForCharacter(character)?.count);
  return character.classLevels.reduce((total, entry, index) => {
    const prestige = "prestigeClassId" in entry ? entry.prestigeClassId : undefined;
    if ((prestige ?? entry.classId) !== sourceId) return total;
    const base = (prestige ? dragonlancePrestigeClasses[prestige] : classDefinitions[entry.classId]).skillPoints;
    if (base === undefined) return total;
    const afterBoost = prestige === "dragon-disciple" ? Math.max(0, entry.level - 7) :
      boostLevel === undefined ? 0 : (character.hitPointRolls ?? []).filter((roll) =>
        roll.classLevel <= entry.level && roll.characterLevel > boostLevel &&
        (roll.prestigeClassId ?? roll.classId) === sourceId).length;
    const firstLevelBonus = entry === firstBaseClass && index === 0 && !hasRacialHitDice ? 3 : 0;
    return total + points(base, entry.level + firstLevelBonus, Math.min(afterBoost, entry.level));
  }, 0);
}

export function getSkillPointsPerLevel(character: Character, classId: ClassId | PrestigeClassId) {
  const skillPoints = Object.hasOwn(dragonlancePrestigeClasses, classId)
    ? dragonlancePrestigeClasses[classId as PrestigeClassId].skillPoints
    : classDefinitions[classId as ClassId].skillPoints;
  if (skillPoints === undefined) return 0;
  return Math.max(
    1,
    skillPoints +
      abilityModifier(character.abilities.int) +
      (character.race.toLowerCase() === "human" ? 1 : 0),
  );
}

export function getLevelUpSpellWarnings(original: Character, proposed: Character): string[] {
  const theurge = proposed.classLevels.find((entry) =>
    "prestigeClassId" in entry && entry.prestigeClassId === "mystic-theurge" &&
    entry.level > getPrestigeClassLevel(original, "mystic-theurge"),
  );
  const warnings = getLevelUpSpellWarningsForClass(original, proposed);
  if (theurge && "prestigeClassId" in theurge && theurge.divineSpellcastingClassId)
    warnings.push(...getLevelUpSpellWarningsForClass(original, proposed, theurge.divineSpellcastingClassId));
  return warnings;
}

function getLevelUpSpellWarningsForClass(original: Character, proposed: Character, target?: ClassId) {
  const advancedBaseClass = proposed.classLevels.find((entry) => {
    if ("prestigeClassId" in entry) return false;
    const originalEntry = original.classLevels.find(
      (candidate) => !("prestigeClassId" in candidate) && candidate.classId === entry.classId,
    );
    return entry.level > (originalEntry?.level ?? 0);
  });
  const advancedPrestigeClass = proposed.classLevels.find((entry) => {
    if (!("prestigeClassId" in entry)) return false;
    const originalEntry = original.classLevels.find(
      (candidate) =>
        "prestigeClassId" in candidate &&
        candidate.prestigeClassId === entry.prestigeClassId,
    );
    return entry.level > (originalEntry?.level ?? 0) &&
      (isIndependentSpellcastingClass(entry.prestigeClassId) ||
        Boolean(dragonlancePrestigeClasses[entry.prestigeClassId].spellcastingProgression));
  });
  const classId = target ?? advancedBaseClass?.classId ??
    (advancedPrestigeClass && "prestigeClassId" in advancedPrestigeClass
      ? isIndependentSpellcastingClass(advancedPrestigeClass.prestigeClassId)
        ? advancedPrestigeClass.prestigeClassId : advancedPrestigeClass.classId
      : undefined);
  if (!classId) return [];
  if (advancedBaseClass?.classId === "ranger") {
    const rangerWarnings = [
      ...getDragonlanceRangerWarnings(proposed, advancedBaseClass.level),
      ...getRangerFavoredEnemyWarnings(proposed),
    ];
    if (rangerWarnings.length) return rangerWarnings;
  }
  if (advancedBaseClass?.classId === "druid") {
    const druidWarnings = getDragonlanceDruidWarnings(proposed);
    if (druidWarnings.length) return druidWarnings;
  }
  if (!getSpellcastingClassDefinition(classId).spellcasting) return [];
  if (classId === "mystic") {
    const domainWarnings = getMysticDomainWarnings(proposed);
    if (domainWarnings.length) return domainWarnings;
  }
  const originalLevel = getEffectiveSpellcastingClassLevel(original, classId);
  const proposedLevel = getEffectiveSpellcastingClassLevel(proposed, classId);
  if (proposedLevel <= originalLevel) return [];
  const classSpells = getClassSpells(classId, proposed.ruleset, proposed);
  const isMysticDomainSpellSelection = (character: Character, name: string) => {
    if (classId !== "mystic") return false;
    const spell = classSpells.find(
      (entry) => normalizeSpellName(entry.name) === normalizeSpellName(name),
    );
    const domainSpell = spell && getMysticDomainSpell(character, spell.level);
    return Boolean(
      domainSpell && normalizeSpellName(name) === normalizeSpellName(domainSpell),
    );
  };
  const selectedCount = (character: Character, level: number) => {
    const knownSpellCount = (getClassSpellSelections(character, "knownSpells")[classId] ?? []).filter((spellName) => {
      return !isMysticDomainSpellSelection(character, spellName) &&
        classSpells.some(
        (spell) =>
          normalizeSpellName(spell.name) === normalizeSpellName(spellName) &&
          spell.level === level,
        );
    }).length;
    if (classId !== "mystic") return knownSpellCount;
    const characterLevel = getEffectiveSpellcastingClassLevel(character, "mystic");
    const baseMysticLimit = mysticKnownProgression[characterLevel - 1]?.[level] ?? 0;
    const includesDomainSpell = level > 0 &&
      Boolean(getMysticDomainSpell(character, level)) &&
      getKnownSpellLimit(character, "mystic", characterLevel, level) > baseMysticLimit;
    return knownSpellCount + Number(includesDomainSpell);
  };
  const knownSpellReplacementWarnings: string[] = [];
  if (classId === "assassin" || classId === "bard" || classId === "sorcerer" || classId === "mystic" || classId === "duskblade") {
    const originalNames = getClassSpellSelections(original, "knownSpells")[classId] ?? [];
    const proposedNames = getClassSpellSelections(proposed, "knownSpells")[classId] ?? [];
    const proposedNameKeys = new Set(proposedNames.map(normalizeSpellName));
    const originalNameKeys = new Set(originalNames.map(normalizeSpellName));
    const removed = originalNames.filter((name) =>
      !(classId === "mystic" && isMysticDomainSpellSelection(original, name)) &&
      !proposedNameKeys.has(normalizeSpellName(name)),
    );
    if (removed.length > 0) {
      const replacementLevelLimit = getKnownSpellReplacementLevelLimit(
        original,
        proposed,
        classId,
      );
      const className = getSpellcastingClassDefinition(classId).name;
      const replacementSchedule =
        `A ${className} may replace spells only at qualifying class levels.`;
      if (replacementLevelLimit === undefined) {
        knownSpellReplacementWarnings.push(replacementSchedule);
      } else if (removed.length > 1) {
        knownSpellReplacementWarnings.push(
          "Only one known spell may be replaced at each qualifying level.",
        );
      } else {
        const oldSpell = classSpells.find(
          (spell) => normalizeSpellName(spell.name) === normalizeSpellName(removed[0]),
        );
        const added = proposedNames.filter((name) =>
          !originalNameKeys.has(normalizeSpellName(name)) &&
          !(classId === "mystic" && isMysticDomainSpellSelection(proposed, name)),
        );
        const hasSameLevelReplacement = oldSpell && oldSpell.level <= replacementLevelLimit &&
          added.some((name) => classSpells.some(
            (spell) =>
              normalizeSpellName(spell.name) === normalizeSpellName(name) &&
              spell.level === oldSpell.level,
          ));
        if (!oldSpell || oldSpell.level > replacementLevelLimit) {
          knownSpellReplacementWarnings.push(
            "The exchanged spell must be at least two levels below the highest spell level available.",
          );
        } else if (!hasSameLevelReplacement) {
          knownSpellReplacementWarnings.push(
            "The replacement must be the same spell level.",
          );
        }
      }
    }
  }
  const spellLevelName = (level: number) =>
    level === 0
      ? "0-level"
      : `${level}${level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th"}-level`;
  const warnings: string[] = [...knownSpellReplacementWarnings];
  if (classId === "duskblade") {
    const proposedNames = getClassSpellSelections(proposed, "knownSpells").duskblade ?? [];
    const required =
      proposedLevel > 0
        ? 3 + proposedLevel + Math.max(0, abilityModifier(proposed.abilities.int))
        : 0;
    if (proposedNames.length !== required)
      warnings.push(`Choose exactly ${required} Duskblade spells known.`);
    const allowed = new Set(getClassSpells("duskblade", proposed.ruleset, proposed).map((spell) => spell.name));
    if (proposedNames.some((name) => !allowed.has(name)))
      warnings.push("Every Duskblade spell known must come from the Duskblade spell list.");
  } else if (classId === "beguiler") {
    const required = [3, 7, 11, 15, 19].filter((level) => proposedLevel >= level).length;
    const selections = proposed.beguilerAdvancedLearning ?? [];
    if (selections.length !== required)
      warnings.push(`Choose exactly ${required} Advanced Learning spell${required === 1 ? "" : "s"}.`);
    const existingBeguilerSpells = new Set(
      getClassSpells("beguiler", proposed.ruleset, proposed).map((spell) => spell.name),
    );
    const allowed = new Set(
      getClassSpells("sorcerer", proposed.ruleset, proposed)
        .filter((spell) =>
          /^(?:Enchantment|Illusion)/.test(spell.school) &&
          !existingBeguilerSpells.has(spell.name) &&
          getDailySpellSlots(proposed, "beguiler", proposedLevel, spell.level) > 0,
        )
        .map((spell) => spell.name),
    );
    if (selections.some((name) => !allowed.has(name)))
      warnings.push("Each Advanced Learning spell must be an available enchantment or illusion of a spell level the Beguiler can cast.");
    if (new Set(selections).size !== selections.length)
      warnings.push("Advanced Learning spells must be distinct.");
  } else if (classId === "assassin" || classId === "bard" || classId === "sorcerer" || classId === "mystic") {
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
      if (missing) warnings.push(`Learn ${missing} additional ${spellLevelName(level)} ${getSpellcastingClassDefinition(classId).name} spell${missing === 1 ? "" : "s"}.`);
    }
  } else if (classId === "wizard" && advancedPrestigeClass) {
    return warnings;
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
      if ("prestigeClassId" in entry) return false;
      const originalEntry = original.classLevels.find(
        (candidate) => !("prestigeClassId" in candidate) && candidate.classId === entry.classId,
      );
      return entry.level > (originalEntry?.level ?? 0);
    })?.classId ?? "fighter"
  );
}

export function getLevelUpSkillSourceId(
  original: Character,
  proposed: Character,
): ClassId | PrestigeClassId {
  const newLevel = proposed.classLevels.find((entry) => {
    if ("prestigeClassId" in entry) {
      const originalEntry = original.classLevels.find(
        (candidate) =>
          "prestigeClassId" in candidate &&
          candidate.prestigeClassId === entry.prestigeClassId,
      );
      return entry.level > (originalEntry?.level ?? 0);
    }
    const originalEntry = original.classLevels.find(
      (candidate) => !("prestigeClassId" in candidate) && candidate.classId === entry.classId,
    );
    return entry.level > (originalEntry?.level ?? 0);
  });
  if (!newLevel) return "fighter";
  return "prestigeClassId" in newLevel ? newLevel.prestigeClassId : newLevel.classId;
}

export function getPrestigeClassEligibilityErrors(
  character: Character,
  prestigeClassId: PrestigeClassId,
  confirmSpecialPrerequisite = true,
) {
  const definition = dragonlancePrestigeClasses[prestigeClassId];
  const currentLevel = getPrestigeClassLevel(character, prestigeClassId);
  if (
    !definition.levelUpEnabled ||
    !definition.hitDie ||
    definition.skillPoints === undefined ||
    !definition.baseAttackBonus ||
    !definition.fortitude ||
    !definition.reflex ||
    !definition.will ||
    !definition.classSkills?.length ||
    !definition.maximumLevel
  )
    return [`${definition.name} does not have a complete level-up progression yet.`];
  const errors = getPrestigeClassPrerequisiteErrors(
    character, prestigeClassId, confirmSpecialPrerequisite,
  );
  if (definition.maximumLevel && currentLevel >= definition.maximumLevel)
    errors.push(`${definition.name} is already at its maximum level (${definition.maximumLevel}).`);
  return errors;
}

export function getPrestigeClassPrerequisiteErrors(
  character: Character,
  prestigeClassId: PrestigeClassId,
  confirmSpecialPrerequisite = true,
) {
  // A legacy reference is not an earned prestige level or a source of entry qualifications.
  character = { ...character, prestigeClass: undefined };
  const definition = dragonlancePrestigeClasses[prestigeClassId];
  const prerequisites = definition.prerequisites;
  const errors: string[] = [];
  const currentLevel = getPrestigeClassLevel(character, prestigeClassId);
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    definition.source === dragonlanceContentId &&
    character.ruleset !== dragonlanceContentId
  )
    errors.push("Switch to the Dragonlance ruleset to add this prestige class.");
  if (currentLevel === 0) {
    if (prerequisites.alignment) {
      const alignment = character.alignment.toLowerCase();
      const alignmentMatches = prerequisites.alignment === "Any non-evil"
        ? !alignment.endsWith("evil")
        : prerequisites.alignment === "Any nongood"
          ? !alignment.endsWith("good")
          : prerequisites.alignment === "Any nonchaotic"
          ? !alignment.startsWith("chaotic")
          : prerequisites.alignment === "Any nonlawful"
            ? !alignment.startsWith("lawful")
            : prerequisites.alignment === "Any lawful"
              ? alignment.startsWith("lawful")
              : prerequisites.alignment === "Any evil"
                ? alignment.endsWith("evil")
                : alignment === prerequisites.alignment.toLowerCase();
      if (!alignment || !alignmentMatches)
        errors.push(`Alignment must be ${prerequisites.alignment}.`);
    }
    if (prerequisites.bab && getBaseAttackBonus(character) < prerequisites.bab)
      errors.push(`Base attack bonus must be +${prerequisites.bab}.`);
    for (const [save, minimum] of Object.entries(prerequisites.baseSaves ?? {})) {
      if (getBaseSave(character, save as "fortitude" | "reflex" | "will") < minimum)
        errors.push(`Base ${save} save must be +${minimum}.`);
    }
    for (const [skill, minimum] of Object.entries(prerequisites.skills ?? {})) {
      if ((character.skills[skill] ?? 0) < minimum)
        errors.push(`${skill} must have ${minimum} ranks.`);
    }
    if (prerequisites.anySkillRanks) {
      const prefix = prerequisites.anySkillPrefix?.toLowerCase();
      const requiredRanks = prerequisites.anySkillRanks;
      const matchingSkills = Object.entries(character.skills)
        .filter(([skill, ranks]) =>
          (!prefix || skill.toLowerCase().startsWith(prefix)) &&
          ranks >= requiredRanks,
        );
      const minimumSkills = prerequisites.minimumMatchingSkills ?? 1;
      if (matchingSkills.length < minimumSkills)
        errors.push(
          minimumSkills > 1
            ? `At least ${minimumSkills} distinct ${prerequisites.anySkillPrefix?.replace(/ \($/, "") ?? ""} skills must each have ${requiredRanks} ranks.`
          : prerequisites.anySkillPrefix
            ? `At least one ${prerequisites.anySkillPrefix} skill must have ${prerequisites.anySkillRanks} ranks.`
            : `At least one skill must have ${prerequisites.anySkillRanks} ranks.`,
        );
    }
    const baseClassLevels = getBaseClassLevels(character);
    for (const language of prerequisites.languages ?? []) {
      if (!getCharacterLanguages(character).some((entry) => normalize(entry) === normalize(language)))
        errors.push(`${language} language is required.`);
    }
    if (prerequisites.allMartialWeaponProficiencies) {
      const martialWeapons = getStoreItems().filter((item) =>
        item.category === "Weapons" && martialWeaponNames.has(getBaseEquipmentName(item.name)),
      );
      if (
        !character.hasAllMartialWeaponProficiencies &&
        !baseClassLevels.some(({ classId }) => martialWeaponClasses.has(classId)) &&
        (!martialWeapons.length || martialWeapons.some((item) => !isWeaponProficient(character, item)))
      ) errors.push("Proficiency with all martial weapons is required.");
    }
    if (prerequisites.sneakAttackDice) {
      const diceBySource = new Map<string, number>();
      for (const { source, ability } of getClassFeatureDisplay(character)) {
        const match = ability.match(/^Sneak Attack \+(\d+)d6$/i);
        if (!match) continue;
        const classSource = source.replace(/ \d+$/, "");
        diceBySource.set(classSource, Math.max(diceBySource.get(classSource) ?? 0, Number(match[1])));
      }
      if ([...diceBySource.values()].reduce((sum, dice) => sum + dice, 0) < prerequisites.sneakAttackDice)
        errors.push(`Sneak attack +${prerequisites.sneakAttackDice}d6 is required.`);
    }
    if (
      prerequisites.spontaneousArcaneSpellcasting &&
      !baseClassLevels.some(({ classId, level }) =>
        (classId === "bard" || classId === "sorcerer") &&
        getDailySpellSlots(character, classId, level, 0) > 0,
      )
    ) errors.push("Ability to cast arcane spells without preparation is required.");
    if (
      prerequisites.classes?.length &&
      !baseClassLevels.some((entry) => prerequisites.classes!.includes(entry.classId))
    )
      errors.push(`At least one of these base classes is required: ${prerequisites.classes.map((classId) => classDefinitions[classId].name).join(", ")}.`);
    for (const [requiredPrestigeClass, minimum] of Object.entries(prerequisites.prestigeClasses ?? {})) {
      if (getPrestigeClassLevel(character, requiredPrestigeClass as PrestigeClassId) < minimum)
        errors.push(`${dragonlancePrestigeClasses[requiredPrestigeClass as PrestigeClassId].name} level ${minimum} is required.`);
    }
    for (const [ability, minimum] of Object.entries(prerequisites.ability ?? {})) {
      if (getEffectiveAbilityScore(character, ability as AbilityName) < minimum)
        errors.push(`${ability.toUpperCase()} must be at least ${minimum}.`);
    }
    const chosenFeatIds = getChosenFeats(character);
    const inactiveFeatNames = new Set(
      Object.values(character.featSelections ?? {})
        .filter((id) => id && !chosenFeatIds.includes(id))
        .flatMap((id) => [
          normalize(id),
          normalize(featCatalog.find((feat) => feat.id === id)?.name ?? id),
        ]),
    );
    const featEntries = [
      ...chosenFeatIds,
      ...character.feats.filter((entry) => !inactiveFeatNames.has(normalize(entry))),
    ];
    const selectedFeatDefinitions = new Map(
      featEntries.flatMap((featEntry) => {
        const normalizedFeat = normalize(featEntry);
        const definition = featCatalog.find((feat) =>
          normalize(feat.id) === normalizedFeat ||
          normalize(feat.name) === normalizedFeat,
        );
        return definition ? [[definition.id, definition] as const] : [];
      }),
    );
    const featNames = new Set(
      featEntries.flatMap((featId) => [
        normalize(featId),
        normalize(featCatalog.find((feat) => feat.id === featId)?.name ?? ""),
      ]),
    );
    const hasPrerequisiteFeat = (name: string) => {
      const normalized = normalize(name);
      if (normalized === "armorproficiencyheavy")
        return getArmorShieldProficiencies(character).has("armor-proficiency-heavy");
      if (normalized === "shieldproficiency")
        return getArmorShieldProficiencies(character).has("shield-proficiency");
      if (normalized === "martialweaponproficiencyall")
        return baseClassLevels.some((entry) => martialWeaponClasses.has(entry.classId)) ||
          featNames.has(normalized);
      if (normalized === "martialweaponproficiency")
        return baseClassLevels.some((entry) => martialWeaponClasses.has(entry.classId)) ||
          featNames.has(normalized);
      return featNames.has(normalized);
    };
    const armorProficiencies = getArmorShieldProficiencies(character);
    for (const feat of prerequisites.feats ?? []) {
      if (
        feat === "Armor Proficiency (Heavy)" &&
        !armorProficiencies.has("armor-proficiency-heavy")
      )
        errors.push("Heavy armor proficiency is required.");
      else if (
        feat === "Shield Proficiency" &&
        !armorProficiencies.has("shield-proficiency")
      )
        errors.push("Shield proficiency is required.");
      else if (
        feat === "Martial Weapon Proficiency" &&
        !hasPrerequisiteFeat(feat)
      )
        errors.push("Proficiency with at least one martial weapon is required.");
      else if (
        feat !== "Armor Proficiency (Heavy)" &&
        feat !== "Shield Proficiency" &&
        feat !== "Martial Weapon Proficiency" &&
        !hasPrerequisiteFeat(feat)
      )
        errors.push(`${feat} is required.`);
    }
    if (
      prerequisites.anyFeats?.length &&
      !prerequisites.anyFeats.some(hasPrerequisiteFeat)
    )
      errors.push(`At least one of these feats is required: ${prerequisites.anyFeats.join(", ")}.`);
    for (const choice of prerequisites.featChoices ?? []) {
      const matchingChoices = new Set(
        [...featNames].filter((feat) =>
          choice.anyOf.some((candidate) => normalize(candidate) === feat),
        ),
      );
      if (matchingChoices.size < choice.count)
        errors.push(`Choose ${choice.count} distinct feats from the required group.`);
    }
    for (const choice of prerequisites.featCategoryChoices ?? []) {
      const matchingChoices = [...selectedFeatDefinitions.values()].filter((feat) =>
        feat.categories?.some((category) => choice.anyOf.includes(category)),
      );
      if (matchingChoices.length < choice.count)
        errors.push(`Choose ${choice.count} distinct feats from the required categories.`);
    }
    if (
      prerequisites.weaponFocusChoices?.length &&
      !getActiveFeatEntries(character).some(([slotId, featId]) =>
        featId === "weapon-focus" &&
        prerequisites.weaponFocusChoices?.includes(character.featWeaponSelections?.[slotId] ?? ""),
      ) &&
      !prerequisites.weaponFocusChoices.some((weapon) =>
        getWarDomainWeapon(character) === weapon,
      )
    ) errors.push(`Weapon Focus in ${prerequisites.weaponFocusChoices.join(" or ")} is required.`);
    if (prerequisites.skillFocusPrefix) {
      const prefix = prerequisites.skillFocusPrefix.toLowerCase();
      if (!getActiveFeatEntries(character).some(([slotId, featId]) =>
        featId === "skill-focus" &&
        character.featSkillSelections?.[slotId]?.toLowerCase().startsWith(prefix),
      )) errors.push(`Skill Focus in a ${prerequisites.skillFocusPrefix.replace(/ \($/, "")} skill is required.`);
    }
    const requiredSkillFocus = prerequisites.skillFocus;
    if (requiredSkillFocus && !getActiveFeatEntries(character).some(([slotId, featId]) =>
      featId === "skill-focus" &&
      character.featSkillSelections?.[slotId]?.toLowerCase() === requiredSkillFocus.toLowerCase(),
    )) errors.push(`Skill Focus (${requiredSkillFocus}) is required.`);
    if (prerequisites.spellFocusSchools?.length || prerequisites.minimumSpellFocusSchools) {
      const focusedSchools = new Set(getActiveFeatEntries(character).flatMap(([slotId, featId]) => {
        const school = character.featSpellSchoolSelections?.[slotId];
        return featId === "spell-focus" && school && magicSchools.includes(school) ? [school] : [];
      }));
      for (const school of prerequisites.spellFocusSchools ?? []) {
        if (!focusedSchools.has(school)) errors.push(`Spell Focus (${school}) is required.`);
      }
      if (prerequisites.minimumSpellFocusSchools && focusedSchools.size < prerequisites.minimumSpellFocusSchools)
        errors.push(`Spell Focus in ${prerequisites.minimumSpellFocusSchools} distinct schools is required.`);
    }
    if (
      prerequisites.races?.length &&
      !prerequisites.races.some((race) =>
        normalize(race) === normalize(character.race) ||
        normalize(race) === normalize(character.race.toLowerCase().replaceAll(" ", "-")),
      )
    )
      errors.push(`Race must be one of: ${prerequisites.races.join(", ")}.`);
    if (prerequisites.classFeatures?.length) {
      const availableFeatures = getClassFeaturePrerequisiteNames(character);
      for (const feature of prerequisites.classFeatures) {
        if (!availableFeatures.has(feature.toLowerCase()))
          errors.push(`${feature} class feature is required.`);
      }
    }
    for (const spellcasting of [
      ...(prerequisites.spellcasting ? [prerequisites.spellcasting] : []),
      ...(prerequisites.additionalSpellcasting ?? []),
    ]) {
      const arcaneClasses = new Set<ClassId>(["bard", "sorcerer", "wizard"]);
      const divineClasses = new Set<ClassId>(["cleric", "druid", "mystic", "paladin", "ranger"]);
      const eligibleClasses = spellcasting.type === "arcane"
        ? arcaneClasses
        : divineClasses;
      const canCastRequiredSpell = baseClassLevels.some((entry) =>
        eligibleClasses.has(entry.classId) &&
        getDailySpellSlots(
          character,
          entry.classId,
          entry.level,
          spellcasting.level,
        ) > 0,
      );
      if (!canCastRequiredSpell)
        errors.push(`Ability to cast ${spellcasting.type} spells of level ${spellcasting.level} is required.`);
    }
    const knownSpells = getClassSpellSelections(character, "knownSpells");
    const castableSpells = prerequisites.spells?.length || prerequisites.spellSchoolSpells
      ? baseClassLevels.flatMap(({ classId, level }) => {
          if (!classDefinitions[classId].spellcasting) return [];
          const usesKnownSpells = ["bard", "sorcerer", "wizard", "mystic"].includes(classId);
          const knownNames = new Set((knownSpells[classId] ?? []).map(normalizeSpellName));
          return getClassSpells(classId, character.ruleset, character).filter((spell) =>
            (!prerequisites.classes?.length || prerequisites.classes.includes(classId)) &&
            (!usesKnownSpells || knownNames.has(normalizeSpellName(spell.name))) &&
            getDailySpellSlots(character, classId, level, spell.level) > 0,
          );
        })
      : [];
    for (const spellName of prerequisites.spells ?? []) {
      const normalizedSpell = normalizeSpellName(spellName);
      const canCastSpell = castableSpells.some((spell) =>
        normalizeSpellName(spell.name) === normalizedSpell,
      );
      if (!canCastSpell)
        errors.push(`Ability to cast ${spellName} is required.`);
    }
    if (prerequisites.arcaneSpellRepertoire) {
      const { castableLevel, schoolCount, minimumSchoolSpellLevel } = prerequisites.arcaneSpellRepertoire;
      const repertoire = baseClassLevels.flatMap(({ classId, level }) => {
        if (classId !== "bard" && classId !== "sorcerer" && classId !== "wizard") return [];
        if (!isSpellCatalogLoaded()) return [];
        const knownNames = new Set((knownSpells[classId] ?? []).map(normalizeSpellName));
        return getClassSpells(classId, character.ruleset, character).flatMap((spell) => {
          if (!knownNames.has(normalizeSpellName(spell.name))) return [];
          const school = magicSchools.find((name) => name === getSpellSchoolName(spell.school));
          if (classId === "wizard" && school && getRedWizardProhibitedSchools(character).includes(school)) return [];
          return [{ school, level: spell.level, castable: getDailySpellSlots(character, classId, level, spell.level) > 0 }];
        });
      });
      if (!repertoire.some((spell) => spell.level === castableLevel && spell.castable))
        errors.push(`Ability to cast a known level ${castableLevel} arcane spell is required.`);
      const schools = new Set(repertoire.flatMap(({ school, level }) =>
        school && level >= minimumSchoolSpellLevel ? [school] : [],
      ));
      if (schools.size < schoolCount)
        errors.push(`Know arcane spells of level ${minimumSchoolSpellLevel} or higher from at least ${schoolCount} schools.`);
    }
    if (prerequisites.spellSchoolSpells) {
      const { school, count, minimumLevel } = prerequisites.spellSchoolSpells;
      const matchingSpells = castableSpells.filter((spell) => getSpellSchoolName(spell.school) === school);
      if (
        new Set(matchingSpells.map((spell) => normalizeSpellName(spell.name))).size < count ||
        !matchingSpells.some((spell) => spell.level >= minimumLevel)
      ) errors.push(`Ability to cast ${count} different ${school} spells, including one of level ${minimumLevel} or higher, is required.`);
    }
    if (definition.id === "wizard-of-high-sorcery") {
      const order = character.highSorceryOrder;
      if (!order) {
        errors.push("Choose a robe order before taking Wizard of High Sorcery levels.");
      } else {
        const alignment = character.alignment.toLowerCase();
        const orderAlignmentMatches = order === "white"
          ? alignment.endsWith("good")
          : order === "red"
            ? alignment.endsWith("neutral")
            : alignment.endsWith("evil");
        if (!orderAlignmentMatches)
          errors.push(`Alignment does not qualify for the ${order} robes.`);
        const orderSchools: readonly MagicSchool[] =
          getHighSorceryOrderSchools(order);
        const specialistSchool = character.wizardSpecializationSchool;
        if (!specialistSchool)
          errors.push("Choose a specialist school for the selected robe order.");
        else if (!orderSchools.includes(specialistSchool))
          errors.push(`Wizard specialization must be ${orderSchools.join(" or ")} for the ${order} robes.`);
        const barredSchools = getRedWizardProhibitedSchools(character);
        const barredSchoolOptions = getHighSorceryBarredSchoolOptions(order);
        if (barredSchools.length !== 2 || new Set(barredSchools).size !== 2)
          errors.push("Choose two distinct barred schools from the other robe orders.");
        else if (barredSchools.some((school) => !barredSchoolOptions.includes(school)))
          errors.push("Both barred schools must be favored by the other robe orders.");
        const disallowedSpellFocusSchools = new Set(barredSchoolOptions);
        for (const [slotId, featId] of getActiveFeatEntries(character)) {
          if (featId !== "spell-focus") continue;
          const school = character.featSpellSchoolSelections?.[slotId];
          if (!school)
            errors.push("Choose a school for each Spell Focus feat.");
          else if (disallowedSpellFocusSchools.has(school))
            errors.push(`Spell Focus cannot be selected in ${school}, a school favored by another robe order.`);
        }
      }
    }
    if (definition.roleplayPrerequisite && !confirmSpecialPrerequisite)
      errors.push(`Confirm this special prerequisite: ${definition.roleplayPrerequisite}`);
  }
  return errors;
}

export function getNewLevelUpFeatSlots(original: Character, proposed: Character) {
  const originalSlots = new Set(getFeatSlots(original).map((slot) => slot.id));
  return getChronologicalFeatSlots(proposed).filter(
    (slot) =>
      !originalSlots.has(slot.id) ||
      (slot.rangerStyleLevel !== undefined &&
        !original.featSelections?.[slot.id]) ||
      (slot.monkBonusLevel !== undefined &&
        !original.featSelections?.[slot.id]),
  );
}

export function getLevelUpSkillWarnings(
  original: Character,
  proposed: Character,
  sourceId = getLevelUpSkillSourceId(original, proposed),
) {
  const newSkillPoints = getSkillPointsPerLevel(proposed, sourceId);
  const newSkillRanks =
    getLevelUpSpentSkillPoints(original, proposed, sourceId) -
    getSpentSkillPoints(original);
  const warnings: string[] = [];
  if (newSkillRanks < newSkillPoints)
    warnings.push(
      `Spend all new skill points (${newSkillPoints - newSkillRanks} remaining).`,
    );
  const characterLevel = getTotalHitDice(proposed);
  for (const selection of getSkillTrickSelections(proposed, characterLevel)) {
    const trick = skillTrickCatalog.find(
      (candidate) => candidate.id === selection.trickId,
    );
    if (
      trick &&
      !skillTrickPrerequisitesMet(proposed, trick, characterLevel)
    )
      warnings.push(
        `Meet the prerequisites for ${trick.name} before confirming the level-up.`,
      );
  }
  if (
    getSpeakLanguageRankCount(original) !== getSpeakLanguageRankCount(proposed) ||
    JSON.stringify(original.speakLanguages ?? []) !==
      JSON.stringify(proposed.speakLanguages ?? [])
  )
    warnings.push(...getSpeakLanguageWarnings(proposed));
  return warnings;
}

const skillTrickLimitFeatIds = new Set([
  "cool-head",
  "freerunner",
  "sure-hand",
  "sweet-talker",
]);
const skillTrickGrantFeatCategories: Record<string, SkillTrickCategory> = {
  "cool-head": "mental",
  freerunner: "movement",
  "sure-hand": "manipulation",
  "sweet-talker": "interaction",
};
const skillTrickById = new Map(
  skillTrickCatalog.map((trick) => [trick.id, trick]),
);

export function getSkillTrickSelections(
  character: Character,
  throughLevel = Number.POSITIVE_INFINITY,
): Array<SkillTrickSelection & { characterLevel: number }> {
  return Object.entries(character.skillTricksByLevel ?? {})
    .flatMap(([level, selections]) =>
      Number(level) <= throughLevel
        ? selections?.map((selection) => ({
            ...selection,
            characterLevel: Number(level),
          })) ?? []
        : [],
    )
    .sort((left, right) => left.characterLevel - right.characterLevel);
}

export function getSkillTrickSelectionsAtLevel(
  character: Character,
  characterLevel: number,
) {
  return character.skillTricksByLevel?.[characterLevel] ?? [];
}

export function getSkillTrickGrantFeatSlots(character: Character) {
  const activeSelections = new Map(getActiveFeatEntries(character));
  return getFeatSlots(character).flatMap((slot) => {
    const featId = activeSelections.get(slot.id);
    const category = featId
      ? skillTrickGrantFeatCategories[featId]
      : undefined;
    return featId && category
      ? [{
          slotId: slot.id,
          featId,
          category,
          characterLevel: slot.characterLevel ?? getTotalHitDice(character),
        }]
      : [];
  });
}

export function getAvailableSkillTrickGrants(
  character: Character,
  featSlotId: string,
) {
  const grantSlot = getSkillTrickGrantFeatSlots(character).find(
    (slot) => slot.slotId === featSlotId,
  );
  if (!grantSlot) return [];
  const learned = getSkillTrickSelections(character, grantSlot.characterLevel);
  if (
    learned.filter((selection) => selection.featSlotId === featSlotId).length >=
      2 ||
    learned.length >=
      getSkillTrickLimit(character, grantSlot.characterLevel)
  )
    return [];
  const knownTricks = new Set(learned.map((selection) => selection.trickId));
  return skillTrickCatalog.filter(
    (trick) =>
      trick.category === grantSlot.category &&
      !knownTricks.has(trick.id) &&
      skillTrickPrerequisitesMet(
        character,
        trick,
        grantSlot.characterLevel,
      ),
  );
}

export function getSkillTrickCountsByCategory(
  character: Character,
  throughLevel = getTotalHitDice(character),
): Record<SkillTrickCategory, number> {
  const counts: Record<SkillTrickCategory, number> = {
    interaction: 0,
    manipulation: 0,
    mental: 0,
    movement: 0,
  };
  for (const selection of getSkillTrickSelections(character, throughLevel)) {
    const trick = skillTrickById.get(selection.trickId);
    if (trick) counts[trick.category] += 1;
  }
  return counts;
}

export function getSkillTrickLimit(
  character: Character,
  characterLevel = getTotalHitDice(character),
) {
  const slots = new Map(
    getFeatSlots(character).map((slot) => [slot.id, slot]),
  );
  const limitBonus = new Set(
    getActiveFeatEntries(character)
      .filter(([slotId, featId]) =>
        skillTrickLimitFeatIds.has(featId) &&
        (slots.get(slotId)?.characterLevel ?? Number.POSITIVE_INFINITY) <=
          characterLevel,
      )
      .map(([, featId]) => featId),
  ).size;
  return Math.ceil(characterLevel / 2) + limitBonus;
}

function skillTrickPrerequisitesMet(
  character: Character,
  trick: SkillTrickDefinition,
  characterLevel: number,
) {
  const prerequisiteCharacter = getCharacterAtCharacterLevel(
    character,
    characterLevel,
  );
  const prerequisites = trick.prerequisites;
  if (
    prerequisites.skills &&
    Object.entries(prerequisites.skills).some(
      ([skill, ranks]) =>
        getSkillRanksAtCharacterLevel(character, skill, characterLevel) <
        ranks,
    )
  )
    return false;
  if (
    prerequisites.anySkillGroups?.some(
      ({ skills: alternatives, ranks }) =>
        !alternatives.some(
          (skill) =>
            getSkillRanksAtCharacterLevel(
              character,
              skill,
              characterLevel,
            ) >= ranks,
        ),
    )
  )
    return false;
  if (
    prerequisites.anySkillPrefix &&
    Math.max(
      0,
      ...Object.entries(prerequisiteCharacter.skills)
        .filter(([skill]) =>
          skill.toLowerCase().startsWith(
            prerequisites.anySkillPrefix!.toLowerCase(),
          ),
        )
        .map(([, ranks]) => ranks),
    ) < (prerequisites.anySkillRanks ?? 0)
  )
    return false;
  if (prerequisites.maximumSize) {
    const size = getRaceDefinitionForCharacter(prerequisiteCharacter)?.size ??
      "Medium";
    if (
      creatureSizeCategories.indexOf(size) >
      creatureSizeCategories.indexOf(prerequisites.maximumSize)
    )
      return false;
  }
  const chosenFeats = new Set([
    ...getChosenFeats(prerequisiteCharacter),
    ...prerequisiteCharacter.feats,
  ]);
  if (prerequisites.feats?.some((feat) => !chosenFeats.has(feat)))
    return false;
  if (
    prerequisites.weaponProficiencies?.some((weaponName) => {
      const weapon = getStoreItems().find(
        (item) =>
          item.category === "Weapons" &&
          getBaseEquipmentName(item.name).toLowerCase() ===
            weaponName.toLowerCase(),
      );
      return !weapon || !isWeaponProficient(prerequisiteCharacter, weapon);
    })
  )
    return false;
  return true;
}

export function getAvailableSkillTricks(character: Character) {
  const characterLevel = getTotalHitDice(character);
  const learned = getSkillTrickSelections(character);
  if (
    learned.length >= getSkillTrickLimit(character, characterLevel) ||
    learned.some(
      (selection) =>
        selection.characterLevel === characterLevel &&
        !selection.featSlotId,
    )
  )
    return [];
  const knownTricks = new Set(learned.map((selection) => selection.trickId));
  return skillTrickCatalog.filter(
    (trick) =>
      !knownTricks.has(trick.id) &&
      skillTrickPrerequisitesMet(character, trick, characterLevel),
  );
}

export function getSpentSkillPoints(character: Character) {
  const skillRankPoints = Object.entries(character.skills).reduce((total, [skill, ranks]) => {
    let remainingRanks = Math.max(0, Number(ranks || 0));
    let spent = 0;
    const classIds = new Set<SkillRankSourceId>(character.classLevels.map((entry) =>
      "prestigeClassId" in entry ? entry.prestigeClassId : entry.classId,
    ));
    if (getRacialHitDiceForCharacter(character))
      classIds.add("racial-hit-dice");
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
  return skillRankPoints +
    getSkillTrickSelections(character).filter((selection) => !selection.featSlotId)
      .length * 2;
}

export function getSpentSkillPointsForSource(
  character: Character,
  sourceId: SkillRankSourceId,
) {
  const skillRankPoints = Object.entries(character.skillRanksByClass?.[sourceId] ?? {}).reduce(
    (total, [skill, ranks]) =>
      total + Math.max(0, Number(ranks || 0)) * (isClassSkill(character, skill, sourceId) ? 1 : 2),
    0,
  );
  const skillTrickPoints = getSkillTrickSelections(character)
    .filter(
      (selection) =>
        !selection.featSlotId && selection.sourceId === sourceId,
    )
    .length * 2;
  return skillRankPoints + skillTrickPoints;
}

export function getLevelUpSpentSkillPoints(
  original: Character,
  proposed: Character,
  classId: ClassId | PrestigeClassId,
) {
  const addedCost = skills.reduce((total, skill) => {
    const addedRanks = Math.max(
      0,
      Number(proposed.skills[skill] || 0) - Number(original.skills[skill] || 0),
    );
    return total + addedRanks * (isClassSkill(proposed, skill, classId) ? 1 : 2);
  }, 0);
  const currentLevel = getTotalHitDice(proposed);
  const addedSkillTrickCost = getSkillTrickSelections(proposed, currentLevel)
    .filter(
      (selection) =>
        selection.characterLevel === currentLevel &&
        !selection.featSlotId &&
        selection.sourceId === classId,
    )
    .length * 2;
  return getSpentSkillPoints(original) + addedCost + addedSkillTrickCost;
}

export function getSkillMaximum(
  character: Character,
  skill: string,
  sourceId?: SkillRankSourceId,
) {
  const characterLevel = getTotalHitDice(character);
  return isClassSkill(character, skill, sourceId)
    ? characterLevel + 3
    : (characterLevel + 3) / 2;
}

export function getBaseAttackBonus(character: Character) {
  const classBonus = character.classLevels.reduce((total, entry) => {
    const progression = "prestigeClassId" in entry
      ? dragonlancePrestigeClasses[entry.prestigeClassId].baseAttackBonus
      : classDefinitions[entry.classId]?.baseAttackBonus;
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
  const racialHitDice = getRacialHitDiceForCharacter(character);
  if (!racialHitDice) return classBonus;
  const racialProgression = racialHitDice.baseAttackBonus;
  return classBonus + (racialProgression === "good"
    ? racialHitDice.count
    : racialProgression === "medium"
      ? Math.floor(racialHitDice.count * 0.75)
      : Math.floor(racialHitDice.count * 0.5));
}

export function getBaseSave(
  character: Character,
  save: "fortitude" | "reflex" | "will",
) {
  const classBonus = character.classLevels.reduce((total, entry) => {
    const progression = "prestigeClassId" in entry
      ? dragonlancePrestigeClasses[entry.prestigeClassId][save]
      : classDefinitions[entry.classId]?.[save];
    if (!progression) return total;
    return total + (progression === "good" ? 2 + Math.floor(entry.level / 2) : Math.floor(entry.level / 3));
  }, 0);
  const racialProgression = getRacialHitDiceForCharacter(character)?.[save];
  if (!racialProgression) return classBonus;
  const racialHitDice = getRacialHitDiceForCharacter(character)!;
  return classBonus + (racialProgression === "good"
    ? 2 + Math.floor(racialHitDice.count / 2)
    : Math.floor(racialHitDice.count / 3));
}

export function getSavingThrow(
  character: Character,
  save: "fortitude" | "reflex" | "will",
  conditions: SavingThrowCondition[] = [],
) {
  const ability = { fortitude: "con", reflex: "dex", will: "wis" } as const;
  const base = getBaseSave(character, save);
  const abilityBonus = abilityModifier(getEffectiveAbilityScore(character, ability[save]));
  const race = getRaceDefinitionForCharacter(character);
  const racialBonus = race?.racialSavingThrowBonus ?? 0;
  const fortitudeConditionBonus = (condition: SavingThrowCondition) => {
    if (save !== "fortitude") return 0;
    if (condition === "poison" || condition === "disease")
      return race?.racialFortitudeSituationalSaveBonuses?.[condition] ?? 0;
    return 0;
  };
  const matchingCondition = conditions.find((condition) =>
    (race?.racialSituationalSaveBonuses?.[condition] ?? 0) !== 0 ||
    fortitudeConditionBonus(condition) !== 0,
  );
  const situationalBonus = matchingCondition
    ? (race?.racialSituationalSaveBonuses?.[matchingCondition] ?? 0) +
      fortitudeConditionBonus(matchingCondition)
    : 0;
  const savingThrowFeat = {
    fortitude: "great-fortitude",
    reflex: "lightning-reflexes",
    will: "iron-will",
  }[save];
  const chosenFeats = getChosenFeats(character);
  const featBonus = (chosenFeats.includes(savingThrowFeat) ? 2 : 0) +
    (save === "will" && chosenFeats.includes("mage-slayer") ? 1 : 0);
  const loremasterSaveBonus = hasLoremasterSecret(character, {
    fortitude: "The Lore of True Stamina", reflex: "Secret Knowledge of Avoidance", will: "Secrets of Inner Strength",
  }[save] as LoremasterSecret) ? 2 : 0;
  const defenseBonuses = getEquipmentDefenseBonuses(character);
  const resistance = defenseBonuses.resistance;
  const luck = defenseBonuses.luck;
  const activeSaves = getCombatEffectModifier(character, "saves");
  const duelistGrace = save === "reflex" && getPrestigeClassLevel(character, "duelist") >= 4 &&
    !character.equipment?.Armor && !character.equipment?.Shield &&
    !getForceShieldState(character).active ? 2 : 0;
  const knightLevel = getPrestigeClassLevel(character, "knight-of-the-crown");
  const paladinLevel = getBaseClassLevel(character, "paladin");
  const lawfulGood = character.alignment === "Lawful Good";
  const druidLevel = isNeutralAlignment(character.alignment)
    ? getBaseClassLevel(character, "druid")
    : 0;
  const charismaMoraleBonus = Math.max(
    0,
    abilityModifier(getEffectiveAbilityScore(character, "cha")),
  );
  const divineGraceBonus = lawfulGood &&
    (paladinLevel >= 2 || getPrestigeClassLevel(character, "knight-of-the-rose") >= 3)
    ? charismaMoraleBonus
    : 0;
  const darkBlessing = getPrestigeClassLevel(character, "blackguard") >= 2 ? charismaMoraleBonus : 0;
  const assassinPoisonSave = conditions.includes("poison")
    ? Math.floor(getPrestigeClassLevel(character, "assassin") / 2) : 0;
  const paladinImmune = lawfulGood && paladinLevel >= 3;
  const fearImmune = conditions.includes("fear") && getCurrentHitPoints(character) >= 0 &&
    (knightLevel >= 9 || paladinImmune);
  const divineHealthImmune = conditions.includes("disease") && paladinImmune;
  const druidNatureLureBonus =
    conditions.includes("fey-spell-like") && druidLevel >= 4 ? 4 : 0;
  const druidPoisonImmune = conditions.includes("poison") && druidLevel >= 9;
  const knightSaveDetails: string[] = [];
  let knightSaveBonus = 0;
  if (knightLevel >= 10 && charismaMoraleBonus > 0) {
    knightSaveBonus += charismaMoraleBonus;
    knightSaveDetails.push(`Crown of Knighthood morale +${charismaMoraleBonus}`);
  } else if (conditions.includes("fear") && knightLevel >= 1 && !fearImmune &&
      charismaMoraleBonus > 0) {
    knightSaveBonus += charismaMoraleBonus;
    knightSaveDetails.push(`Knightly Courage morale +${charismaMoraleBonus}`);
  }
  if (conditions.includes("compulsion") && knightLevel >= 4 &&
      knightLevel < 10 && charismaMoraleBonus > 0) {
    knightSaveBonus += charismaMoraleBonus;
    knightSaveDetails.push(`Honorable Will morale +${charismaMoraleBonus}`);
  }
  if (conditions.includes("compulsion") && knightLevel >= 10) {
    knightSaveBonus += 4;
    knightSaveDetails.push("Crown of Knighthood compulsion +4");
  }
  const honorBoundActive = conditions.includes("oath") &&
    !character.honorBoundSuspended &&
    chosenFeats.includes("honor-bound");
  if (honorBoundActive) {
    knightSaveBonus += 2;
    knightSaveDetails.push("Honor-bound circumstance +2");
  }
  const immunity = conditions.find((condition) =>
    race?.racialImmunities?.includes(condition),
  ) ?? (fearImmune ? "fear" : divineHealthImmune ? "disease" :
    druidPoisonImmune ? "poison" : undefined);
  const breakdown = [
    `Base ${formatModifier(base)}`,
    `${ability[save].toUpperCase()} ${formatModifier(abilityBonus)}`,
    racialBonus ? `racial ${formatModifier(racialBonus)}` : "",
    matchingCondition
      ? `${matchingCondition} ${matchingCondition === "fear" ? "morale" : "racial"} ${formatModifier(situationalBonus)}`
      : "",
    featBonus ? `feat ${formatModifier(featBonus)}` : "",
    loremasterSaveBonus ? "Loremaster secret +2" : "",
    divineGraceBonus ? `Divine Grace ${formatModifier(divineGraceBonus)}` : "",
    darkBlessing ? `Dark Blessing ${formatModifier(darkBlessing)}` : "",
    assassinPoisonSave ? `Assassin poison save ${formatModifier(assassinPoisonSave)}` : "",
    duelistGrace ? "Duelist Grace competence +2" : "",
    druidNatureLureBonus ? `Resist Nature's Lure ${formatModifier(druidNatureLureBonus)}` : "",
    ...knightSaveDetails,
  ].filter(Boolean).join(" · ");
  return {
    total: base + abilityBonus + racialBonus + situationalBonus + featBonus + loremasterSaveBonus +
      divineGraceBonus + darkBlessing + assassinPoisonSave + duelistGrace + druidNatureLureBonus + knightSaveBonus +
      resistance.bonus + luck.bonus + activeSaves,
    immune: immunity !== undefined,
    detail: `${immunity ? `Immune to ${immunity}; no save required. ` : ""}${breakdown}${resistance.bonus ? ` · resistance ${formatModifier(resistance.bonus)}` : ""}${luck.bonus ? ` · luck ${formatModifier(luck.bonus)}` : ""}${activeSaves ? ` · active effects ${formatModifier(activeSaves)}` : ""}`,
    title: [immunity ? `Immune to ${immunity}; no save required.` : "", breakdown, conditions.length ? `Context: ${conditions.join(", ")}` : "Select context for situational bonuses.", ...getAbilityEquipmentBonus(character, ability[save]).detail, ...resistance.detail, ...luck.detail, ...getCombatEffectDetails(character, "saves"), ...knightSaveDetails, "Active effects are applied as entered; check bonus types and situational limits."].filter(Boolean).join("\n"),
  };
}

const recordedClassFeatureNames = new Set([
  ...Object.values(startingClassFeatures).flat(),
  "Improved Unarmed Strike",
]);
let definedClassFeatureNames: Set<string> | undefined;

export function getClassFeatureDisplay(
  character: Character,
): { source: string; ability: string; isPrestigeClass?: boolean }[] {
  if (!isClassFeatureProgressionLoaded()) {
    throw new Error(
      "Class progression data must be loaded before displaying class features.",
    );
  }
  const knownFeatureNames = definedClassFeatureNames ??= new Set([
    ...Object.values(classFeatureProgression).flatMap((entries) =>
      (entries ?? []).flatMap((entry) => entry.features),
    ),
    ...Object.values(prestigeClassFeatureProgression).flatMap((entries) =>
      (entries ?? []).flatMap((entry) => entry.features),
    ),
    ...recordedClassFeatureNames,
  ]);
  const earnedFeatures = character.classLevels.flatMap((entry) => {
    const isPrestigeClass = "prestigeClassId" in entry;
    const definition = isPrestigeClass
      ? dragonlancePrestigeClasses[entry.prestigeClassId]
      : classDefinitions[entry.classId];
    if (isPrestigeClass && entry.prestigeClassId === "horizon-walker") {
      return (character.horizonWalkerTerrainMasteries ?? []).slice(0, entry.level)
        .map((terrain, index) => ({
          source: `Horizon Walker ${index + 1}`,
          ability: `Terrain Mastery: ${terrain}`,
          isPrestigeClass: true,
        }));
    }
    const progressions = isPrestigeClass
      ? prestigeClassFeatureProgression[entry.prestigeClassId] ?? []
      : classFeatureProgression[entry.classId] ?? [];
    const selectedAlternatives = isPrestigeClass
      ? []
      : alternativeClassFeatures.filter((feature) =>
          feature.className === definition.name &&
          (character.alternativeClassFeatures?.[entry.classId] ?? []).includes(feature.name),
        );
    const replacedFeatures = new Set(selectedAlternatives.map((feature) => feature.replaces));
    const isReplacedFeature = (feature: string) => {
      if (replacedFeatures.has(feature)) return true;
      if (replacedFeatures.has("Wild Shape") && feature.startsWith("Wild Shape")) return true;
      if (replacedFeatures.has("Rage") &&
        (feature.startsWith("Rage") || feature.startsWith("Greater Rage")))
        return true;
      return false;
    };
    const choices = !isPrestigeClass ? [] : entry.prestigeClassId === "archmage"
      ? getEarnedHighArcana(character).flatMap((choice, index) => choice ? [{
          source: `Archmage ${index + 1} · ${classDefinitions[choice.classId].name} slot ${choice.slot}${choice.reserve === undefined ? "" : ` + slot ${choice.reserve}: ${choice.spellNote}`}`,
          ability: choice.ability === "Spell Power" ? "Archmage Spell Power" : choice.ability, isPrestigeClass: true,
        }] : [])
      : entry.prestigeClassId === "hierophant"
      ? getEarnedHierophantAbilities(character).map((ability, index) => ({
          source: `Hierophant ${index + 1}`, ability, isPrestigeClass: true,
        }))
      : entry.prestigeClassId === "loremaster"
        ? [
            ...getEarnedLoremasterSecrets(character).map((ability, index) => ({
              source: `Loremaster ${index * 2 + 1}`, ability, isPrestigeClass: true,
            })),
            ...getEarnedLoremasterLanguages(character).map((language, index) => ({
              source: `Loremaster ${(index + 1) * 4}`, ability: `Bonus language: ${language}`, isPrestigeClass: true,
            })),
          ] : [];
    return [
      ...choices,
      ...selectedAlternatives.map((feature) => ({
        source: `${definition.name} ${feature.level} (alternative)`,
        ability: feature.name,
      })),
      ...progressions
      .filter((progression) => progression.level <= entry.level)
      .flatMap((progression) =>
        progression.features.filter((feature) => !isReplacedFeature(feature)).map((feature) => ({
          source: `${definition.name} ${progression.level}${
            isPrestigeClass && entry.prestigeClassId === "dragon-disciple" && character.dragonDiscipleVariety
              ? ` (${character.dragonDiscipleVariety})` : ""
          }`,
          ability: feature === "Totem Dragon" && character.dragonShamanTotem
            ? `Totem Dragon: ${character.dragonShamanTotem}`
            : feature === "Draconic Aura" && character.dragonShamanAuras?.length
              ? `Draconic Auras: ${character.dragonShamanAuras.join(", ")}`
              : feature,
          ...(isPrestigeClass ? { isPrestigeClass: true } : {}),
        })),
      ),
    ];
  });
  const recordedFeatures = [
    ...new Set(character.classFeatures ?? []),
  ]
    .filter((feature) => !knownFeatureNames.has(feature))
    .map((ability) => ({ source: "Recorded feature", ability }));
  return [...earnedFeatures, ...recordedFeatures];
}

function getClassFeaturePrerequisiteNames(character: Character) {
  const features = new Set(
    getClassFeatureDisplay(character).map(({ ability }) =>
      ability.toLowerCase(),
    ),
  );
  const turningMode = getClericUndeadTurningMode(character);
  if (turningMode)
    features.add(turningMode === "turn" ? "turn undead" : "rebuke undead");
  if (character.canTurnElementalSubtype || character.canRebukeElementalSubtype)
    features.add("turn or rebuke elementals");
  return features;
}

function getCharacterAtCharacterLevel(
  character: Character,
  characterLevel?: number,
) {
  if (
    characterLevel === undefined ||
    characterLevel >= getTotalHitDice(character)
  )
    return character;

  const classLevels = new Map<string, Character["classLevels"][number]>();
  for (const roll of character.hitPointRolls ?? []) {
    if (roll.characterLevel > characterLevel) continue;
    const key = roll.prestigeClassId
      ? `prestige:${roll.prestigeClassId}`
      : `class:${roll.classId}`;
    const currentLevel = classLevels.get(key);
    if (currentLevel && currentLevel.level >= roll.classLevel) continue;
    classLevels.set(
      key,
      roll.prestigeClassId
        ? {
            classId: roll.classId,
            prestigeClassId: roll.prestigeClassId,
            divineSpellcastingClassId: roll.divineSpellcastingClassId,
            level: roll.classLevel,
          }
        : { classId: roll.classId, level: roll.classLevel },
    );
  }
  const abilities = { ...character.abilities };
  for (const [level, ability] of Object.entries(
    character.abilityScoreIncreasesByLevel ?? {},
  )) {
    if (Number(level) > characterLevel && ability)
      abilities[ability] -= 1;
  }
  for (const ability of Object.keys(abilities) as AbilityName[])
    abilities[ability] -= getLaterDragonDiscipleBoost(character, ability, characterLevel);
  return {
    ...character,
    classLevels: [...classLevels.values()],
    abilities,
    classFeatures: undefined,
  };
}

const classFeatureSynergySources: Record<
  string,
  { sourceSkill: string; checkLabel: string }
> = {
  "Bardic Knowledge": {
    sourceSkill: "Knowledge (history)",
    checkLabel: "Bardic Knowledge checks",
  },
  "Wild Empathy": {
    sourceSkill: "Handle Animal",
    checkLabel: "Wild Empathy checks",
  },
  "Turn or Rebuke Undead": {
    sourceSkill: "Knowledge (religion)",
    checkLabel: "turning or rebuking checks against undead",
  },
  "Turn Undead": {
    sourceSkill: "Knowledge (religion)",
    checkLabel: "turning checks against undead",
  },
};

export function getClassFeatureSkillSynergy(
  character: Character,
  feature: string,
) {
  const synergy = classFeatureSynergySources[feature];
  if (
    !synergy ||
    !getClassFeatureDisplay(character).some((entry) => entry.ability === feature) ||
    getSkillUse(character, synergy.sourceSkill).ranks < 5
  ) {
    return null;
  }
  return { ...synergy, bonus: 2 };
}

type RangerCombatStyleLevel = 2 | 6 | 11;
type MonkBonusFeatLevel = 1 | 2 | 6;

type FeatEligibilitySlot = {
  id?: string;
  fighterOnly: boolean;
  wizardOnly?: boolean;
  metamagicOnly?: boolean;
  redWizardOnly?: boolean;
  characterLevel?: number;
  rangerStyleLevel?: RangerCombatStyleLevel;
  monkBonusLevel?: MonkBonusFeatLevel;
  knightOnly?: boolean;
};

type FeatSlot = FeatEligibilitySlot & {
  id: string;
  label: string;
};

const rangerCombatStyleFeats: Record<RangerCombatStyleLevel, readonly string[]> = {
  2: ["rapid-shot", "two-weapon-fighting"],
  6: ["manyshot", "improved-two-weapon-fighting", "two-weapon-pounce"],
  11: [
    "improved-precise-shot",
    "greater-two-weapon-fighting",
    "two-weapon-rend",
  ],
};

const monkBonusFeats: Record<MonkBonusFeatLevel, readonly string[]> = {
  1: ["improved-grapple", "stunning-fist"],
  2: ["combat-reflexes", "deflect-arrows"],
  6: ["improved-disarm", "improved-trip", "water-splitting-stone"],
};

const rangerCombatStylePaths: Record<string, "archery" | "two-weapon"> = {
  "rapid-shot": "archery",
  manyshot: "archery",
  "improved-precise-shot": "archery",
  "two-weapon-fighting": "two-weapon",
  "improved-two-weapon-fighting": "two-weapon",
  "greater-two-weapon-fighting": "two-weapon",
  "two-weapon-pounce": "two-weapon",
  "two-weapon-rend": "two-weapon",
};

function getClassFeatCharacterLevel(
  character: Character,
  classId: ClassId,
  classLevel: number,
) {
  const hitPointRoll = character.hitPointRolls?.find(
    (entry) =>
      entry.classId === classId &&
      !("prestigeClassId" in entry) &&
      entry.classLevel === classLevel,
  );
  if (hitPointRoll) return hitPointRoll.characterLevel;

  const racialHitDice = getRacialHitDiceForCharacter(character)?.count ?? 0;
  const firstBaseClass = getBaseClassLevels(character)[0];
  if (classLevel === 1 && firstBaseClass?.classId === classId)
    return racialHitDice + 1;

  const pendingClassLevels =
    getTotalHitDice(character) - racialHitDice - 2;
  if (
    pendingClassLevels >= 0 &&
    (character.hitPointRolls?.length ?? 0) === pendingClassLevels &&
    classLevel === getBaseClassLevel(character, classId)
  )
    return getTotalHitDice(character);
  return undefined;
}

export function getFeatSlots(character: Character) {
  const slots: FeatSlot[] = [];
  const level = getTotalHitDice(character);
  for (let slotLevel = 1; slotLevel <= level; slotLevel += 1) {
    if (slotLevel === 1 || slotLevel % 3 === 0)
      slots.push({
        id: `general-${slotLevel}`,
        label: `General feat (level ${slotLevel})`,
        fighterOnly: false,
        characterLevel: slotLevel,
      });
  }
  if (character.race.toLowerCase() === "human")
    slots.push({
      id: "human-1",
      label: "Human bonus feat",
      fighterOnly: false,
      characterLevel: 1,
    });
  if (getPrestigeClassLevel(character, "eldritch-knight") > 0) {
    const entryRoll = character.hitPointRolls?.find((roll) =>
      roll.prestigeClassId === "eldritch-knight" && roll.classLevel === 1,
    );
    slots.push({
      id: "eldritch-knight-1",
      label: "Eldritch Knight bonus feat",
      fighterOnly: true,
      characterLevel: entryRoll?.characterLevel ??
        (getPrestigeClassLevel(character, "eldritch-knight") === 1 ? level : undefined),
    });
  }
  if (getPrestigeClassLevel(character, "red-wizard") >= 5) {
    const roll = character.hitPointRolls?.find((entry) =>
      entry.prestigeClassId === "red-wizard" && entry.classLevel === 5);
    slots.push({
      id: "red-wizard-5", label: "Red Wizard bonus feat",
      fighterOnly: false, redWizardOnly: true,
      characterLevel: roll?.characterLevel ??
        (getPrestigeClassLevel(character, "red-wizard") === 5 ? level : undefined),
    });
  }
  for (const [prestigeClassId, choices, requiredChoice, label, step] of [
    ["hierophant", getEarnedHierophantAbilities(character), "Metamagic Feat", "Hierophant metamagic feat", 1],
    ["loremaster", getEarnedLoremasterSecrets(character), "Applicable Knowledge", "Loremaster bonus feat", 2],
  ] as const) {
    choices.forEach((choice, index) => {
      if (choice !== requiredChoice) return;
      const classLevel = index * step + 1;
      const roll = character.hitPointRolls?.find((entry) =>
        entry.prestigeClassId === prestigeClassId && entry.classLevel === classLevel);
      slots.push({
        id: `${prestigeClassId}-${classLevel}`, label, fighterOnly: false,
        metamagicOnly: prestigeClassId === "hierophant",
        characterLevel: roll?.characterLevel ??
          (getPrestigeClassLevel(character, prestigeClassId) === classLevel ? level : undefined),
      });
    });
  }
  getBaseClassLevels(character)
    .filter((entry) => entry.classId === "fighter")
    .forEach((entry) => {
      for (let classLevel = 1; classLevel <= entry.level; classLevel += 1) {
        const alternative = character.alternativeClassFeatures?.fighter ?? [];
        if ((classLevel === 6 && alternative.includes("Elusive Attack")) ||
          (classLevel === 12 && alternative.includes("Counterattack")) ||
          (classLevel === 16 && alternative.includes("Overpowering Attack")))
          continue;
        if (classLevel === 1 || classLevel % 2 === 0)
          slots.push({
            id: `fighter-${classLevel}`,
            label: `Fighter bonus feat (fighter level ${classLevel})`,
            fighterOnly: true,
            characterLevel: getClassFeatCharacterLevel(
              character,
              "fighter",
              classLevel,
            ),
          });
      }
    });
  getBaseClassLevels(character)
    .filter((entry) => entry.classId === "knight")
    .forEach((entry) => {
      for (const classLevel of [5, 10, 15]) {
        if (entry.level >= classLevel)
          slots.push({
            id: `knight-${classLevel}`,
            label: `Knight bonus feat (Knight level ${classLevel})`,
            fighterOnly: false,
            knightOnly: true,
            characterLevel: getClassFeatCharacterLevel(character, "knight", classLevel),
          });
      }
    });
  getBaseClassLevels(character)
    .filter((entry) => entry.classId === "wizard")
    .forEach((entry) => {
      for (const classLevel of [5, 10, 15, 20]) {
        if (entry.level >= classLevel)
          slots.push({
            id: `wizard-${classLevel}`,
            label: `Wizard bonus feat (wizard level ${classLevel})`,
            fighterOnly: false,
            wizardOnly: true,
            characterLevel: getClassFeatCharacterLevel(
              character,
              "wizard",
              classLevel,
            ),
          });
      }
    });
  const rangerLevel = getBaseClassLevels(character)
    .filter((entry) => entry.classId === "ranger")
    .reduce((total, entry) => total + entry.level, 0);
  ([2, 6, 11] as const).forEach((classLevel) => {
    if (rangerLevel >= classLevel)
      slots.push({
        id: `ranger-style-${classLevel}`,
        label: `Ranger combat style feat (ranger level ${classLevel})`,
        fighterOnly: false,
        characterLevel: getClassFeatCharacterLevel(
          character,
          "ranger",
          classLevel,
        ),
        rangerStyleLevel: classLevel,
      });
  });
  const monkLevel = getBaseClassLevels(character)
    .filter((entry) => entry.classId === "monk")
    .reduce((total, entry) => total + entry.level, 0);
  ([1, 2, 6] as const).forEach((classLevel) => {
    if (monkLevel >= classLevel)
      slots.push({
        id: `monk-${classLevel}`,
        label: `Monk bonus feat (monk level ${classLevel})`,
        fighterOnly: false,
        characterLevel: getClassFeatCharacterLevel(
          character,
          "monk",
          classLevel,
        ),
        monkBonusLevel: classLevel,
      });
  });
  return slots;
}

export function getChronologicalFeatSlots(character: Character) {
  return getFeatSlots(character).sort((left, right) => {
    if (left.characterLevel === undefined && right.characterLevel === undefined)
      return 0;
    if (left.characterLevel === undefined) return 1;
    if (right.characterLevel === undefined) return -1;
    return left.characterLevel - right.characterLevel;
  });
}

function getStoredActiveFeatEntries(character: Character) {
  let restrictedSlots: ReturnType<typeof getFeatSlots> | undefined;
  return Object.entries(character.featSelections ?? {})
    .filter(([slotId, featId]) => {
      if (!featId) return false;
      if (!/^(wizard|hierophant|loremaster|red-wizard)-\d+$/.test(slotId)) return true;
      restrictedSlots ??= getFeatSlots(character);
      const slot = restrictedSlots.find((entry) => entry.id === slotId);
      if (!slot) return false;
      const feat = featCatalog.find((entry) => entry.id === featId);
      return feat && (!slot.wizardOnly || isWizardBonusFeat(character, feat, slot.characterLevel)) &&
        (!slot.metamagicOnly || feat.categories?.includes("metamagic")) &&
        (!slot.redWizardOnly || feat.categories?.some((category) =>
          category === "metamagic" || category === "item-creation") || feat.id === "spell-mastery");
    });
}

const activeFeatEntriesBeingEvaluated = new WeakMap<
  Character,
  Array<[string, string]>
>();

function getActiveFeatEntries(character: Character) {
  const entriesBeingEvaluated = activeFeatEntriesBeingEvaluated.get(character);
  if (entriesBeingEvaluated) return entriesBeingEvaluated;
  const slots = new Map(getFeatSlots(character).map((slot) => [slot.id, slot]));
  let entries = getStoredActiveFeatEntries(character);
  while (true) {
    const featContext = {
      ...character,
      featSelections: Object.fromEntries(entries),
    };
    activeFeatEntriesBeingEvaluated.set(featContext, entries);
    const usableEntries: Array<[string, string]> = entries.filter(
      ([slotId, featId]) => {
      const feat = featCatalog.find((entry) => entry.id === featId);
      const slot = slots.get(slotId);
      if (
        !feat ||
        !slot ||
        slot.rangerStyleLevel !== undefined ||
        (slot.monkBonusLevel !== undefined &&
          feat.id !== "water-splitting-stone")
      )
        return true;
      return featQualifies(
        featContext,
        feat,
        { ...slot, characterLevel: undefined },
        slotId,
        getChosenFeats(featContext, slotId, entries),
        true,
      );
      },
    );
    if (usableEntries.length === entries.length) return usableEntries;
    entries = usableEntries;
  }
}

export function getChosenFeats(
  character: Character,
  excludingSlot?: string,
  entries?: Array<[string, string]>,
) {
  const chosenFeats = (entries ?? getActiveFeatEntries(character))
    .filter(([slotId]) => slotId !== excludingSlot)
    .map(([, featId]) => featId);
  if (
    getBaseClassLevel(character, "monk") > 0 &&
    !chosenFeats.includes("improved-unarmed-strike")
  )
    chosenFeats.push("improved-unarmed-strike");
  if (
    getBaseClassLevel(character, "wizard") > 0 &&
    !chosenFeats.includes("scribe-scroll")
  )
    chosenFeats.push("scribe-scroll");
  if (getBaseClassLevel(character, "duskblade") >= 2 &&
    !chosenFeats.includes("combat-casting"))
    chosenFeats.push("combat-casting");
  if (getBaseClassLevel(character, "beguiler") >= 5 &&
    !chosenFeats.includes("silent-spell"))
    chosenFeats.push("silent-spell");
  if (getBaseClassLevel(character, "beguiler") >= 10 &&
    !chosenFeats.includes("still-spell"))
    chosenFeats.push("still-spell");
  const rangerLevel = getBaseClassLevel(character, "ranger");
  if (rangerLevel >= 1 && !chosenFeats.includes("track"))
    chosenFeats.push("track");
  if (rangerLevel >= 3 && !chosenFeats.includes("endurance"))
    chosenFeats.push("endurance");
  if (
    getPrestigeClassLevel(character, "knight-of-the-crown") >= 3 &&
    !chosenFeats.includes("diehard")
  )
    chosenFeats.push("diehard");
  if (
    getPrestigeClassLevel(character, "thaumaturgist") >= 2 &&
    !chosenFeats.includes("augment-summoning")
  )
    chosenFeats.push("augment-summoning");
  if (getWarDomainWeapon(character) && !chosenFeats.includes("weapon-focus"))
    chosenFeats.push("weapon-focus");
  return chosenFeats;
}

function isWizardBonusFeat(
  character: Character,
  feat: FeatDefinition,
  characterLevel?: number,
) {
  if (
    feat.id === "spell-mastery" ||
    feat.categories?.some((category) =>
      category === "metamagic" || category === "item-creation" || category === "reserve",
    ) ||
    feat.wizardBonus === true
  ) return true;
  return Boolean(
    feat.wizardBonus &&
    getCharacterAtCharacterLevel(character, characterLevel)
      .coreWizardSpecializationSchool === feat.wizardBonus,
  );
}

export function getWizardBonusFeatWarnings(character: Character) {
  return getFeatSlots(character).flatMap((slot) => {
    if (!slot.wizardOnly) return [];
    const featId = character.featSelections?.[slot.id];
    if (!featId) return [];
    const feat = featCatalog.find((entry) => entry.id === featId);
    return feat && isWizardBonusFeat(character, feat, slot.characterLevel)
      ? []
      : [`${slot.label}: ${feat?.name ?? featId} is not a permitted Wizard bonus feat. Reselect this saved choice; it is not counted as a chosen feat.`];
  });
}

const repeatableWeaponFeats = new Set([
  "exotic-weapon-proficiency",
  "greater-weapon-focus",
  "greater-weapon-specialization",
  "improved-critical",
  "martial-weapon-proficiency",
  "power-critical",
  "rapid-reload",
  "weapon-focus",
  "weapon-specialization",
]);
const repeatableFeats = new Set([
  ...repeatableWeaponFeats,
  "ability-focus",
  "arcane-disciple",
  "arcane-defense",
  "divine-metamagic",
  "domain-focus",
  "domain-spontaneity",
  "empower-spell-like-ability",
  "familiar-spell",
  "great-smiting",
  "improved-favored-enemy",
  "improved-metamagic",
  "improved-natural-armor",
  "improved-natural-attack",
  "improved-sneak-attack",
  "improved-spell-capacity",
  "improved-stunning-fist",
  "air-devotion",
  "animal-devotion",
  "chaos-devotion",
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
  "maximize-spell-like-ability",
  "mithral-fluidity",
  "extra-invocation",
  "extra-slot",
  "extra-spell",
  "extra-spell-secret",
  "extra-music",
  "heighten-spell-like-ability",
  "innate-spell",
  "open-minded",
  "overwhelming-critical",
  "quicken-spell-like-ability",
  "spell-knowledge",
  "terrifying-rage",
  "extra-turning",
  "spell-mastery",
  "toughness",
  "skill-focus",
  "spell-focus",
  "greater-spell-focus",
  "metamagic-school-focus",
]);
const weaponSelectionFeats = new Set([
  ...repeatableWeaponFeats,
  "ranged-spell-specialization",
  "touch-spell-specialization",
]);
const featPrerequisiteOnlyWeapons: StoreItem[] = [
  {
    name: "Armor Spikes",
    category: "Weapons",
    price: 0,
    weight: "—",
    custom: true,
    proficiency: "Martial",
  },
  {
    name: "Spiked Shield",
    category: "Weapons",
    price: 0,
    weight: "—",
    custom: true,
    proficiency: "Martial",
  },
];
const spellSpecializationWeaponChoices: Record<string, string> = {
  "ranged-spell-specialization": "Ray",
  "touch-spell-specialization": "Touch spell",
};
const weaponFeatFighterLevelRequirements: Record<string, number> = {
  "weapon-specialization": 4,
  "greater-weapon-focus": 8,
  "greater-weapon-specialization": 12,
};
function getWeaponFeatTypeName(name: string) {
  return /^(?:Spiked )?(?:Light|Heavy) Shield Bash$/.test(name)
    ? "Shield Bash"
    : getBaseEquipmentName(name);
}

function getWeaponFeatChoiceItems(character: Character) {
  return [
    ...getStoreItems(),
    ...(character.customItems ?? []),
    ...featPrerequisiteOnlyWeapons,
  ].filter((item) => item.category === "Weapons");
}

function getWeaponDamageTypeForFeatChoice(
  character: Character,
  weaponType: string,
) {
  const knownDamageType = weaponDamageTypes[weaponType];
  if (knownDamageType) return knownDamageType;
  const item = [
    ...(character.customItems ?? []),
    ...getStoreItems(),
  ].find(
    (candidate) =>
      candidate.category === "Weapons" &&
      getWeaponFeatTypeName(candidate.name) === weaponType,
  );
  return [item?.damageType, item?.offHandDamageType]
    .filter((damageType): damageType is string => Boolean(damageType))
    .join(" or ");
}

function getFeatPrerequisiteContext(
  character: Character,
  slot: FeatEligibilitySlot,
  excludingSlot?: string,
) {
  const characterLevel = slot.characterLevel;
  const prerequisiteCharacter = getCharacterAtCharacterLevel(
    character,
    characterLevel,
  );
  const entries = getActiveFeatEntries(character);
  const slotLevels = new Map(getFeatSlots(character).map((candidateSlot) => [
    candidateSlot.id,
    candidateSlot.characterLevel,
  ]));
  const prerequisiteEntries = entries.filter(([slotId]) => {
    const selectedLevel = slotLevels.get(slotId);
    return characterLevel === undefined ||
      selectedLevel === undefined ||
      selectedLevel < characterLevel ||
      (selectedLevel === characterLevel &&
        slotId !== (excludingSlot ?? slot.id));
  });
  const context = {
    ...prerequisiteCharacter,
    featSelections: Object.fromEntries(prerequisiteEntries),
  };
  activeFeatEntriesBeingEvaluated.set(context, prerequisiteEntries);
  return context;
}

export function getAvailableFeatWeaponChoices(
  character: Character,
  featId: string,
  excludingSlot?: string,
) {
  if (!weaponSelectionFeats.has(featId)) return [];
  const requiredFighterLevel =
    weaponFeatFighterLevelRequirements[featId] ?? 0;
  const fighterLevel = character.classLevels
    .filter((entry) =>
      entry.classId === "fighter" &&
      !("prestigeClassId" in entry && entry.prestigeClassId),
    )
    .reduce((total, entry) => total + entry.level, 0);
  if (fighterLevel < requiredFighterLevel)
    return [];
  const prerequisiteSlot = excludingSlot
    ? getFeatSlots(character).find((slot) => slot.id === excludingSlot)
    : undefined;
  if (prerequisiteSlot?.knightOnly && featId === "weapon-focus") return ["Lance"];
  const prerequisiteCharacter = prerequisiteSlot
    ? getFeatPrerequisiteContext(
        character,
        prerequisiteSlot,
        excludingSlot,
      )
    : character;
  const prerequisiteFeatSelections =
    prerequisiteCharacter.featSelections ?? {};
  const prerequisiteWeaponSelections: Record<string, string> = {};
  Object.keys(prerequisiteFeatSelections).forEach((slotId) => {
    const weapon = character.featWeaponSelections?.[slotId];
    if (weapon) prerequisiteWeaponSelections[slotId] = weapon;
  });
  const featChoiceContext = {
    ...prerequisiteCharacter,
    featWeaponSelections: prerequisiteWeaponSelections,
  };
  activeFeatEntriesBeingEvaluated.set(
    featChoiceContext,
    Object.entries(prerequisiteFeatSelections),
  );
  const weaponItems = getWeaponFeatChoiceItems(character).filter((item) =>
    featId !== "rapid-reload" ||
    ["Hand Crossbow", "Light Crossbow", "Heavy Crossbow"]
      .includes(getWeaponFeatTypeName(item.name)),
  );
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
    Object.entries(prerequisiteFeatSelections)
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === featId)
      .map(([slotId]) => prerequisiteWeaponSelections[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  if (featId === "weapon-focus") {
    const warWeapon = getWarDomainWeapon(prerequisiteCharacter);
    if (warWeapon) selectedWeapons.add(warWeapon);
  }
  const focusedWeapons = new Set(
    Object.entries(prerequisiteFeatSelections)
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === "weapon-focus")
      .map(([slotId]) => prerequisiteWeaponSelections[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  const specializedWeapons = new Set(
    Object.entries(prerequisiteFeatSelections)
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === "weapon-specialization")
      .map(([slotId]) => prerequisiteWeaponSelections[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  const greaterFocusedWeapons = new Set(
    Object.entries(prerequisiteFeatSelections)
      .filter(([slotId, selectedFeatId]) => slotId !== excludingSlot && selectedFeatId === "greater-weapon-focus")
      .map(([slotId]) => prerequisiteWeaponSelections[slotId])
      .filter((weapon): weapon is string => Boolean(weapon)),
  );
  const warWeapon = getWarDomainWeapon(prerequisiteCharacter);
  if (warWeapon) focusedWeapons.add(warWeapon);

  const weaponChoices = [...weaponsByType.entries()]
    .filter(([weaponType, item]) =>
      !spellSpecializationWeaponChoices[featId] &&
      (featId !== "rapid-reload" ||
        ["Hand Crossbow", "Light Crossbow", "Heavy Crossbow"].includes(weaponType)) &&
      (featId !== "martial-weapon-proficiency" || weaponType !== "Shield Bash") &&
      (featId === "exotic-weapon-proficiency"
        ? getWeaponProficiencyCategory(character, item) === "Exotic" &&
          !isWeaponProficient(featChoiceContext, item, excludingSlot) &&
          meetsExoticWeaponStrengthPrerequisite(
            character,
            weaponType,
            prerequisiteSlot?.characterLevel,
          )
        : featId === "martial-weapon-proficiency"
          ? (getWeaponProficiencyCategory(character, item) === "Martial" ||
              twoHandedMartialWeaponNames.has(weaponType)) &&
            !isWeaponProficient(
              featChoiceContext,
              item,
              excludingSlot,
              twoHandedMartialWeaponNames.has(weaponType),
            )
            : isWeaponProficient(
              featChoiceContext,
              item,
              excludingSlot,
              twoHandedMartialWeaponNames.has(weaponType),
            )) &&
      (!selectedWeapons.has(weaponType) || featId === "power-critical") &&
      (featId !== "power-critical" || focusedWeapons.has(weaponType)) &&
      (featId !== "weapon-specialization" || focusedWeapons.has(weaponType)) &&
      (featId !== "greater-weapon-focus" || focusedWeapons.has(weaponType)) &&
      (featId !== "greater-weapon-specialization" ||
        (focusedWeapons.has(weaponType) &&
          specializedWeapons.has(weaponType) &&
          greaterFocusedWeapons.has(weaponType))),
    )
    .map(([weaponType]) => weaponType);
  const specialChoices: string[] = [];
  const grappleChoiceIsEligible =
    featId === "weapon-focus" ||
    (["weapon-specialization", "greater-weapon-focus"].includes(featId) &&
      focusedWeapons.has("Grapple")) ||
    (featId === "greater-weapon-specialization" &&
      focusedWeapons.has("Grapple") &&
      specializedWeapons.has("Grapple") &&
      greaterFocusedWeapons.has("Grapple"));
  if (grappleChoiceIsEligible && !selectedWeapons.has("Grapple"))
    specialChoices.push("Grapple");
  if (
    featId === "weapon-focus" &&
    character.classLevels.some((entry) => spellProgressions[entry.classId]) &&
    !selectedWeapons.has("Ray")
  )
    specialChoices.push("Ray");
  if (
    featId === "weapon-focus" &&
    character.classLevels.some((entry) => spellProgressions[entry.classId]) &&
    !selectedWeapons.has("Touch spell")
  )
    specialChoices.push("Touch spell");
  const specializedSpellChoice = spellSpecializationWeaponChoices[featId];
  if (specializedSpellChoice && focusedWeapons.has(specializedSpellChoice))
    specialChoices.push(specializedSpellChoice);
  return [...new Set([...weaponChoices, ...specialChoices])].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function featQualifies(
  character: Character,
  feat: FeatDefinition,
  slot: FeatEligibilitySlot,
  excludingSlot?: string,
  prerequisiteFeatIds?: readonly string[],
  currentlyUsing = false,
) {
  if (
    feat.prerequisites?.flySpeed &&
    (typeof character.flySpeed !== "number" ||
      !Number.isSafeInteger(character.flySpeed) ||
      character.flySpeed <= 0)
  )
    return false;
  if (feat.firstLevelOnly && slot.characterLevel !== 1 && !currentlyUsing)
    return false;
  if (
    feat.prerequisites?.minimumCharacterLevel &&
    (slot.characterLevel ?? getTotalHitDice(character)) <
      feat.prerequisites.minimumCharacterLevel
  )
    return false;
  if (feat.prerequisites?.domains?.length) {
    const activeDomains = getActiveClericDomains(character);
    const activeMysticDomain = getActiveMysticDomain(character);
    if (activeMysticDomain) activeDomains.push(activeMysticDomain);
    if (
      feat.prerequisites.domains.some((domain) => !activeDomains.includes(domain))
    )
      return false;
  }
  if (slot.monkBonusLevel !== undefined) {
    if (!monkBonusFeats[slot.monkBonusLevel].includes(feat.id))
      return false;
    if (feat.id !== "water-splitting-stone") return true;
    return (
      (prerequisiteFeatIds ?? getChosenFeats(character, excludingSlot))
        .includes("stunning-fist") &&
      getBaseAttackBonusAtCharacterLevel(character, slot.characterLevel) >= 9
    );
  }
  if (slot.rangerStyleLevel !== undefined) {
    if (!rangerCombatStyleFeats[slot.rangerStyleLevel].includes(feat.id))
      return false;
    if (
      (feat.id === "two-weapon-pounce" || feat.id === "two-weapon-rend") &&
      !getRangerCombatStyleStatus(character).active
    )
      return false;
    if (slot.rangerStyleLevel > 2) {
      const previousLevel = slot.rangerStyleLevel === 6 ? 2 : 6;
      const previousFeat =
        character.featSelections?.[`ranger-style-${previousLevel}`];
      if (
        !previousFeat ||
        rangerCombatStylePaths[previousFeat] !== rangerCombatStylePaths[feat.id]
      )
        return false;
    }
    return true;
  }
  if (
    !currentlyUsing &&
    ((slot.fighterOnly && !feat.fighterBonus) ||
      (slot.knightOnly && ![
        "animal-affinity", "diehard", "endurance", "great-fortitude",
        "iron-will", "quick-draw", "ride-by-attack", "spirited-charge",
        "trample", "weapon-focus",
      ].includes(feat.id)) ||
      (slot.metamagicOnly && !feat.categories?.includes("metamagic")) ||
      (slot.redWizardOnly &&
        !feat.categories?.some((category) =>
          category === "metamagic" || category === "item-creation",
        ) &&
        feat.id !== "spell-mastery") ||
      (slot.wizardOnly &&
        !isWizardBonusFeat(character, feat, slot.characterLevel)))
  )
    return false;
  const prerequisites = feat.prerequisites;
  if (prerequisites?.powerPointReserve && !character.hasPowerPointReserve)
    return false;
  if (prerequisites?.kiPower && !character.hasKiPower)
    return false;
  if (prerequisites?.kiStrikeMagic && !character.hasKiStrikeMagic)
    return false;
  if (
    prerequisites?.allMartialWeaponProficiencies &&
    !character.hasAllMartialWeaponProficiencies
  )
    return false;
  if (prerequisites?.stealSpell && !character.hasStealSpell)
    return false;
  if (prerequisites?.swashbucklerGrace && !character.hasSwashbucklerGrace)
    return false;
  if (
    prerequisites?.conjurationHealingSpell &&
    !character.hasConjurationHealingSpell
  )
    return false;
  if (
    prerequisites?.spontaneousCureOrInflict &&
    !getClericUndeadTurningMode(character) &&
    !character.hasSpontaneousCureOrInflict
  )
    return false;
  if (
    prerequisites?.cureWoundsSpell &&
    !character.hasCureWoundsSpell
  )
    return false;
  if (
    prerequisites?.summonNaturesAllySpell &&
    !character.hasSummonNaturesAllySpell
  )
    return false;
  if (
    prerequisites?.inflictWoundsSpell &&
    !character.hasInflictWoundsSpell
  )
    return false;
  if (
    prerequisites?.turnsElementalSubtype &&
    !character.canTurnElementalSubtype
  )
    return false;
  if (
    prerequisites?.rebukesElementalSubtype &&
    !character.canRebukeElementalSubtype
  )
    return false;
  if (prerequisites?.fastWildShape && !character.hasFastWildShape)
    return false;
  if (prerequisites?.warmageLevelFour && !character.hasWarmageLevelFour)
    return false;
  if (
    prerequisites?.graduatedFromApprenticeship &&
    !character.hasGraduatedFromApprenticeship
  )
    return false;
  if (
    prerequisites?.mentorSkillPrerequisites &&
    !character.hasMentorSkillPrerequisites
  )
    return false;
  if (prerequisites?.guildMembership && !character.isGuildMember)
    return false;
  if (
    prerequisites?.guildmasterPrerequisites &&
    !character.hasGuildmasterPrerequisites
  )
    return false;
  if (prerequisites?.bondingRitual && !character.hasCompletedBondingRitual)
    return false;
  if (
    prerequisites?.rechargeableBreathWeapon &&
    !character.hasRechargeableBreathWeapon
  )
    return false;
  if (
    prerequisites?.detectMagicAccess &&
    !character.hasDetectMagicAccess
  )
    return false;
  if (prerequisites?.thoonAffiliation && !character.isThoonAffiliate)
    return false;
  if (prerequisites?.alignmentMatchesDeity) {
    const deity = deityDefinitions.find(
      (candidate) => candidate.id === character.deity,
    );
    if (!deity || character.alignment !== deity.alignment) return false;
  }
  if (prerequisites?.alignmentWithinOneStepOfDeity) {
    const deity = deityDefinitions.find(
      (candidate) => candidate.id === character.deity,
    );
    if (
      !deity ||
      !validAlignments.has(character.alignment) ||
      alignmentDistance(character.alignment, deity.alignment) > 1
    )
      return false;
  }
  if (
    prerequisites?.manifesterLevel !== undefined &&
    (character.manifesterLevel ?? 0) < prerequisites.manifesterLevel
  )
    return false;
  let prerequisiteCharacter: Character | undefined;
  const getPrerequisiteCharacter = () =>
    prerequisiteCharacter ??= getCharacterAtCharacterLevel(
      character,
      slot.characterLevel,
    );
  if (
    prerequisites?.minimumClericDomains !== undefined &&
    new Set(getActiveClericDomains(getPrerequisiteCharacter())).size <
      prerequisites.minimumClericDomains
  )
    return false;
  if (prerequisites?.minimumDomains !== undefined) {
    const activeDomains = new Set(
      getActiveClericDomains(getPrerequisiteCharacter()),
    );
    const activeMysticDomain = getActiveMysticDomain(
      getPrerequisiteCharacter(),
    );
    if (activeMysticDomain) activeDomains.add(activeMysticDomain);
    if (activeDomains.size < prerequisites.minimumDomains) return false;
  }
  if (prerequisites?.minimumSize || prerequisites?.maximumSize) {
    const size = getRaceDefinitionForCharacter(getPrerequisiteCharacter())?.size ??
      "Medium";
    const sizeIndex = creatureSizeCategories.indexOf(size);
    if (
      prerequisites.minimumSize &&
      sizeIndex < creatureSizeCategories.indexOf(prerequisites.minimumSize)
    )
      return false;
    if (
      prerequisites.maximumSize &&
      sizeIndex > creatureSizeCategories.indexOf(prerequisites.maximumSize)
    )
      return false;
  }
  if (prerequisites?.alignment) {
    const alignment = getPrerequisiteCharacter().alignment;
    if (!validAlignments.has(alignment)) return false;
    if (
      prerequisites.alignment.nonLawful &&
      alignment.startsWith("Lawful ")
    )
      return false;
    if (
      prerequisites.alignment.nonGood &&
      alignment.endsWith(" Good")
    )
      return false;
    if (
      prerequisites.alignment.nonEvil &&
      alignment.endsWith(" Evil")
    )
      return false;
    if (
      prerequisites.alignment.component &&
      !alignment.split(" ").includes(prerequisites.alignment.component)
    )
      return false;
  }
  if (
    prerequisites?.hugeOrLarger &&
    sizeModifier(getPrerequisiteCharacter()) > -2
  )
    return false;
  if (
    prerequisites?.minimumFavoredEnemies &&
    (getPrerequisiteCharacter().rangerFavoredEnemies ?? []).filter(
      (choice) =>
        choice.classLevel <= getBaseClassLevel(getPrerequisiteCharacter(), "ranger"),
    ).length < prerequisites.minimumFavoredEnemies
  )
    return false;
  if (
    prerequisites?.minimumSkirmishDamageDice !== undefined &&
    (getPrerequisiteCharacter().skirmishDamageDice ?? 0) <
      prerequisites.minimumSkirmishDamageDice
  )
    return false;
  if (
    prerequisites?.minimumSkirmishACBonus !== undefined &&
    (getPrerequisiteCharacter().skirmishACBonus ?? 0) <
      prerequisites.minimumSkirmishACBonus
  )
    return false;
  const getBaseClassLevelsAtSlot = () =>
    getPrerequisiteCharacter().classLevels.filter(
      (entry) => !("prestigeClassId" in entry && entry.prestigeClassId),
    );
  if (
    prerequisites?.baseAttackBonus &&
    getBaseAttackBonusAtCharacterLevel(character, slot.characterLevel) <
      prerequisites.baseAttackBonus
  )
    return false;
  const casterLevel = prerequisites?.casterLevel
    ? Math.max(
        0,
        ...getBaseClassLevelsAtSlot().map((entry) =>
          getCasterLevel(
            entry.classId,
            entry.level,
            getPrerequisiteCharacter(),
          ),
        ),
      )
    : 0;
  if (prerequisites?.casterLevel && casterLevel < prerequisites.casterLevel)
    return false;
  const requiredRacialSlaCasterLevel =
    prerequisites?.racialSpellLikeAbilityCasterLevel;
  if (
    requiredRacialSlaCasterLevel &&
    !getRacialSpellLikeAbilities(getPrerequisiteCharacter()).some(
      (ability) => ability.casterLevel >= requiredRacialSlaCasterLevel,
    )
  )
    return false;
  const requiresArcaneSpellcasting =
    prerequisites?.arcaneSpellcasting ||
    prerequisites?.arcaneSpellcastingOrRacialSpellLikeAbility;
  const hasArcaneSpellcasting =
    requiresArcaneSpellcasting &&
    getBaseClassLevelsAtSlot().some(
      (entry) =>
        arcaneSpellcastingClasses.has(entry.classId) &&
        getDailySpellSlots(getPrerequisiteCharacter(), entry.classId, entry.level, 0) > 0,
    );
  if (prerequisites?.arcaneSpellcasting && !hasArcaneSpellcasting)
    return false;
  if (
    prerequisites?.arcaneSpellcastingOrRacialSpellLikeAbility &&
    !hasArcaneSpellcasting &&
    getRacialSpellLikeAbilities(getPrerequisiteCharacter()).length === 0
  )
    return false;
  const arcaneCasterLevel = prerequisites?.arcaneCasterLevel
    ? Math.max(
        0,
        ...getBaseClassLevelsAtSlot()
          .filter((entry) => arcaneSpellcastingClasses.has(entry.classId))
          .map((entry) =>
            getCasterLevel(
              entry.classId,
              entry.level,
              getPrerequisiteCharacter(),
            ),
          ),
      )
    : 0;
  if (
    prerequisites?.arcaneCasterLevel &&
    arcaneCasterLevel < prerequisites.arcaneCasterLevel
  )
    return false;
  if (
    prerequisites?.divineCasterLevel &&
    (getPrerequisiteCharacter().divineCasterLevel ?? 0) <
      prerequisites.divineCasterLevel
  )
    return false;
  const requiredArcaneSpellLevel = prerequisites?.arcaneSpellLevel;
  if (requiredArcaneSpellLevel && !getBaseClassLevelsAtSlot().some((entry) =>
    arcaneSpellcastingClasses.has(entry.classId) &&
    (!prerequisites?.spontaneousArcane || entry.classId !== "wizard") &&
    getDailySpellSlots(
      getPrerequisiteCharacter(),
      entry.classId,
      entry.level,
      requiredArcaneSpellLevel,
    ) > 0,
  ))
    return false;
  const requiredDivineSpellLevel = prerequisites?.divineSpellLevel;
  if (
    requiredDivineSpellLevel &&
    !getBaseClassLevelsAtSlot().some(
      (entry) =>
        divineSpellcastingClasses.has(entry.classId) &&
        getDailySpellSlots(
          getPrerequisiteCharacter(),
          entry.classId,
          entry.level,
          requiredDivineSpellLevel,
        ) > 0,
    )
  )
    return false;
  const requiredSpellLevel = prerequisites?.spellLevel;
  if (
    requiredSpellLevel &&
    !getBaseClassLevelsAtSlot().some(
      (entry) =>
        getDailySpellSlots(
          getPrerequisiteCharacter(),
          entry.classId,
          entry.level,
          requiredSpellLevel,
        ) > 0,
    )
  )
    return false;
  const requiredPaladinSpellLevel = prerequisites?.paladinSpellLevel;
  if (
    requiredPaladinSpellLevel &&
    !getBaseClassLevelsAtSlot().some(
      (entry) =>
        entry.classId === "paladin" &&
        getDailySpellSlots(
          getPrerequisiteCharacter(),
          entry.classId,
          entry.level,
          requiredPaladinSpellLevel,
        ) > 0,
    )
  )
    return false;
  const minimumArcaneSpellcastingAbilityScore =
    prerequisites?.minimumArcaneSpellcastingAbilityScore;
  if (
    minimumArcaneSpellcastingAbilityScore &&
    !getBaseClassLevelsAtSlot().some((entry) =>
      arcaneSpellcastingClasses.has(entry.classId) &&
      getEffectiveAbilityScore(
        getPrerequisiteCharacter(),
        getSpellcastingAbility(entry.classId),
      ) >= minimumArcaneSpellcastingAbilityScore,
    )
  )
    return false;
  const canCastMaximumNormalSpellLevel = (
    entry: Character["classLevels"][number],
    arcaneOnly = false,
  ) => {
    if (arcaneOnly && !arcaneSpellcastingClasses.has(entry.classId))
      return false;
    const progression = spellProgressions[entry.classId];
    const maximumSpellLevel = (progression?.[19]?.length ?? 0) - 1;
    const effectiveClassLevel = Math.min(
      getEffectiveSpellcastingClassLevel(
        getPrerequisiteCharacter(),
        entry.classId,
      ),
      20,
    );
    return (
      maximumSpellLevel >= 0 &&
      baseSpellSlots(
        entry.classId,
        effectiveClassLevel,
        maximumSpellLevel,
      ) > 0 &&
      getEffectiveAbilityScore(
        getPrerequisiteCharacter(),
        getSpellcastingAbility(entry.classId),
      ) >= 10 + maximumSpellLevel
    );
  };
  if (
    prerequisites?.maximumNormalSpellLevel &&
    !getBaseClassLevelsAtSlot().some((entry) =>
      canCastMaximumNormalSpellLevel(entry),
    )
  )
    return false;
  if (
    prerequisites?.maximumNormalArcaneSpellLevel &&
    !getBaseClassLevelsAtSlot().some((entry) =>
      canCastMaximumNormalSpellLevel(entry, true),
    )
  )
    return false;
  const getClassLevelAtSlot = (classId: string) =>
    getBaseClassLevel(getPrerequisiteCharacter(), classId as ClassId);
  if (
    prerequisites?.classLevels &&
    Object.entries(prerequisites.classLevels).some(
      ([classId, requiredLevel]) =>
        getClassLevelAtSlot(classId) < requiredLevel,
    )
  )
    return false;
  if (
    prerequisites?.prestigeClassLevels &&
    Object.entries(prerequisites.prestigeClassLevels).some(
      ([prestigeClassId, requiredLevel]) =>
        getPrestigeClassLevel(
          getPrerequisiteCharacter(),
          prestigeClassId as PrestigeClassId,
        ) < requiredLevel,
    )
  )
    return false;
  if (
    prerequisites?.anyClassLevels &&
    !Object.entries(prerequisites.anyClassLevels).some(
      ([classId, requiredLevel]) =>
        getClassLevelAtSlot(classId) >= requiredLevel,
    )
  )
    return false;
  if (
    prerequisites?.abilities &&
    Object.entries(prerequisites.abilities).some(
      ([ability, score]) =>
        getAbilityScoreAtCharacterLevel(
          character,
          ability as AbilityName,
          slot.characterLevel,
        ) < score,
    )
  )
    return false;
  const normalizeRace = (race: string) => race.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    prerequisites?.races?.length &&
    !prerequisites.races.some(
      (race) => normalizeRace(race) === normalizeRace(character.race),
    )
  )
    return false;
  if (
    prerequisites?.baseSaves &&
    Object.entries(prerequisites.baseSaves).some(
      ([save, bonus]) =>
        getBaseSave(
          getPrerequisiteCharacter(),
          save as "fortitude" | "reflex" | "will",
        ) < bonus,
    )
  )
    return false;
  if (
    prerequisites?.skills &&
    Object.entries(prerequisites.skills).some(
      ([skill, ranks]) =>
        getSkillRanksAtCharacterLevel(
          character,
          skill,
          slot.characterLevel,
        ) < ranks,
    )
  )
    return false;
  if (
    prerequisites?.anySkills &&
    !Object.entries(prerequisites.anySkills).some(
      ([skill, ranks]) =>
        getSkillRanksAtCharacterLevel(
          character,
          skill,
          slot.characterLevel,
        ) >= ranks,
    )
  )
    return false;
  if (prerequisites?.anySkillRanks !== undefined) {
    const skillPrefix = prerequisites.anySkillPrefix?.toLowerCase();
    const eligibleSkills = Object.keys(getPrerequisiteCharacter().skills)
      .filter(
        (skill) =>
          !skillPrefix || skill.toLowerCase().startsWith(skillPrefix),
      );
    if (
      Math.max(
        0,
        ...eligibleSkills.map((skill) =>
          getSkillRanksAtCharacterLevel(
            character,
            skill,
            slot.characterLevel,
          ),
        ),
      ) < prerequisites.anySkillRanks
    )
      return false;
  }
  if (
    prerequisites?.classFeatures?.length ||
    prerequisites?.anyClassFeatures?.length ||
    prerequisites?.anyClassFeatureGroups?.length ||
    prerequisites?.smiteAbility
  ) {
    const prerequisiteCharacter = getPrerequisiteCharacter();
    const availableClassFeatures =
      getClassFeaturePrerequisiteNames(prerequisiteCharacter);
    if (prerequisites.classFeatures?.some(
        (requiredFeature) =>
          !availableClassFeatures.has(requiredFeature.toLowerCase()),
      ))
      return false;
    const hasAnyRequiredClassFeature =
      prerequisites.anyClassFeatures?.some((requiredFeature) =>
        availableClassFeatures.has(requiredFeature.toLowerCase()),
      ) ?? false;
    const sneakAttackPrerequisiteDice = (prerequisites.anyClassFeatures ?? [])
      .map((requiredFeature) => {
        const match = requiredFeature.match(/^Sneak Attack \+(\d+)d6$/i);
        return match ? Number(match[1]) : undefined;
      })
      .filter((dice): dice is number => dice !== undefined);
    const minimumSneakAttackDice = Math.min(
      ...sneakAttackPrerequisiteDice,
    );
    const currentSneakAttackDice = Math.max(
      0,
      ...[...availableClassFeatures].map((feature) => {
        const match = feature.match(/^Sneak Attack \+(\d+)d6$/i);
        return match ? Number(match[1]) : 0;
      }),
    );
    const qualifiesForAmbushThroughSwiftAmbusher =
      feat.ambush &&
      minimumSneakAttackDice > 0 &&
      (prerequisiteFeatIds ??
        getChosenFeats(getPrerequisiteCharacter(), excludingSlot))
        .includes("swift-ambusher") &&
      currentSneakAttackDice +
        (getPrerequisiteCharacter().skirmishDamageDice ?? 0) >=
        minimumSneakAttackDice;
    if (
      prerequisites.anyClassFeatures?.length &&
      !hasAnyRequiredClassFeature &&
      !qualifiesForAmbushThroughSwiftAmbusher
    )
      return false;
    if (
      prerequisites.anyClassFeatureGroups?.some(
        (group) =>
          !group.some((requiredFeature) =>
            availableClassFeatures.has(requiredFeature.toLowerCase()),
          ),
      )
    )
      return false;
    if (
      prerequisites.smiteAbility &&
      ![...availableClassFeatures].some(
        (feature) => feature === "smite" || feature.startsWith("smite "),
      ) &&
      !getActiveClericDomains(prerequisiteCharacter).includes("destruction")
    )
      return false;
  }
  const featPrerequisiteContext = getFeatPrerequisiteContext(
    character,
    slot,
    excludingSlot,
  );
  const armorShieldProficiencies = getArmorShieldProficiencies(
    featPrerequisiteContext,
    excludingSlot,
    prerequisiteFeatIds,
  );
  if (
    prerequisites?.anyArmorProficiency &&
    !["light", "medium", "heavy"].some((armor) =>
      armorShieldProficiencies.has(`armor-proficiency-${armor}`),
    )
  )
    return false;
  if (
    prerequisites?.shieldProficiency &&
    !armorShieldProficiencies.has("shield-proficiency")
  )
    return false;
  if (
    prerequisites?.anyWeaponProficiency &&
    !getStoreItems().some(
      (item) =>
        item.category === "Weapons" &&
        isWeaponProficient(
          featPrerequisiteContext,
          item,
          excludingSlot,
        ),
    )
  )
    return false;
  const chosenFeats = [
    ...getArmorShieldProficiencies(
      featPrerequisiteContext,
      excludingSlot,
      prerequisiteFeatIds,
    ),
    ...(prerequisiteFeatIds ??
      getChosenFeats(featPrerequisiteContext, excludingSlot)),
  ];
  if (
    prerequisites?.featChoices?.some(
      ({ anyOf, count }) =>
        new Set(chosenFeats.filter((featId) => anyOf.includes(featId))).size <
        count,
    )
  )
    return false;
  const selectedSpellFocusSchools = new Set<MagicSchool>();
  for (const [slotId, selectedFeatId] of Object.entries(
    featPrerequisiteContext.featSelections ?? {},
  )) {
    const school =
      featPrerequisiteContext.featSpellSchoolSelections?.[slotId];
    if (selectedFeatId === "spell-focus" && school)
      selectedSpellFocusSchools.add(school);
  }
  if (
    prerequisites?.prerequisiteAlternatives?.length &&
    !prerequisites.prerequisiteAlternatives.some((alternative) => {
      const hasAlternativeRequirement =
        Boolean(alternative.feats?.length) ||
        Boolean(alternative.classFeatures?.length) ||
        Boolean(alternative.anyClassFeatures?.length) ||
        Boolean(alternative.abilities && Object.keys(alternative.abilities).length) ||
        Boolean(alternative.races?.length) ||
        Boolean(alternative.skills && Object.keys(alternative.skills).length) ||
        Boolean(alternative.anySkills && Object.keys(alternative.anySkills).length) ||
        alternative.minimumSkirmishDamageDice !== undefined ||
        Boolean(alternative.featSkillChoices?.length);
      if (!hasAlternativeRequirement) return false;
      if (
        alternative.feats?.some((requiredFeat) =>
          !chosenFeats.includes(requiredFeat),
        )
      )
        return false;
      if (
        alternative.classFeatures?.some((requiredFeature) =>
          !getClassFeaturePrerequisiteNames(getPrerequisiteCharacter()).has(
            requiredFeature.toLowerCase(),
          ),
        )
      )
        return false;
      if (
        alternative.anyClassFeatures?.length &&
        !alternative.anyClassFeatures.some((requiredFeature) =>
          getClassFeaturePrerequisiteNames(getPrerequisiteCharacter()).has(
            requiredFeature.toLowerCase(),
          ),
        )
      )
        return false;
      if (
        alternative.abilities &&
        Object.entries(alternative.abilities).some(
          ([ability, score]) =>
            getEffectiveAbilityScore(character, ability as AbilityName) < score,
        )
      )
        return false;
      if (
        alternative.races?.length &&
        !alternative.races.some((race) =>
          normalizeRace(race) === normalizeRace(character.race),
        )
      )
        return false;
      if (
        alternative.skills &&
        Object.entries(alternative.skills).some(
          ([skill, ranks]) =>
            getSkillRanksAtCharacterLevel(
              character,
              skill,
              slot.characterLevel,
            ) < ranks,
        )
      )
        return false;
      if (
        alternative.anySkills &&
        !Object.entries(alternative.anySkills).some(
          ([skill, ranks]) =>
            getSkillRanksAtCharacterLevel(
              character,
              skill,
              slot.characterLevel,
            ) >= ranks,
        )
      )
        return false;
      if (
        alternative.minimumSkirmishDamageDice !== undefined &&
        (getPrerequisiteCharacter().skirmishDamageDice ?? 0) <
          alternative.minimumSkirmishDamageDice
      )
        return false;
      if (
        alternative.featSkillChoices?.length &&
        !Object.entries(featPrerequisiteContext.featSelections ?? {}).some(
          ([slotId, selectedFeatId]) =>
            selectedFeatId === "skill-focus" &&
            alternative.featSkillChoices?.includes(
              featPrerequisiteContext.featSkillSelections?.[slotId] ?? "",
            ),
        )
      )
        return false;
      return true;
    })
  )
    return false;
  const spellSpecializationWeaponChoice =
    spellSpecializationWeaponChoices[feat.id];
  if (
    spellSpecializationWeaponChoice &&
    !getAvailableFeatWeaponChoices(
      character,
      feat.id,
      excludingSlot ?? slot.id,
    ).includes(spellSpecializationWeaponChoice)
  )
    return false;
  if (
    prerequisites?.spellFocusSchools?.length &&
    !prerequisites.spellFocusSchools.some((school) =>
      selectedSpellFocusSchools.has(school),
    )
  )
    return false;
  const wizardSpecializationSchool =
    getBaseClassLevel(getPrerequisiteCharacter(), "wizard") > 0
      ? getPrerequisiteCharacter().coreWizardSpecializationSchool
      : undefined;
  if (
    prerequisites?.spellFocusOrWizardSpecializationSchools?.length &&
    !prerequisites.spellFocusOrWizardSpecializationSchools.some(
      (school) =>
        selectedSpellFocusSchools.has(school) ||
        wizardSpecializationSchool === school,
    )
  )
    return false;
  const weaponFocusChoiceGroups = [
    ...(prerequisites?.weaponFocusChoices?.length
      ? [prerequisites.weaponFocusChoices]
      : []),
    ...(prerequisites?.weaponFocusChoiceGroups ?? []),
  ];
  if (weaponFocusChoiceGroups.length) {
    const selectedWeaponFocusChoices = Object.entries(
      featPrerequisiteContext.featSelections ?? {},
    ).flatMap(([slotId, selectedFeatId]) => {
      const weapon = featPrerequisiteContext.featWeaponSelections?.[slotId];
      return selectedFeatId === "weapon-focus" && weapon
        ? [{ slotId, weapon }]
        : [];
    });
    const hasDistinctChoices = (
      groupIndex: number,
      usedSlotIds: Set<string>,
    ): boolean => {
      if (groupIndex === weaponFocusChoiceGroups.length) return true;
      return selectedWeaponFocusChoices.some(({ slotId, weapon }) => {
        if (
          usedSlotIds.has(slotId) ||
          !weaponFocusChoiceGroups[groupIndex].includes(weapon)
        )
          return false;
        usedSlotIds.add(slotId);
        const satisfied = hasDistinctChoices(groupIndex + 1, usedSlotIds);
        usedSlotIds.delete(slotId);
        return satisfied;
      });
    };
    if (!hasDistinctChoices(0, new Set())) return false;
  }
  const selectedWeaponFeatChoices = Object.entries(
    featPrerequisiteContext.featSelections ?? {},
  ).flatMap(([slotId, featId]) => {
    const weapon = featPrerequisiteContext.featWeaponSelections?.[slotId];
    return featId && weapon ? [{ featId, weapon }] : [];
  });
  const weaponFeatChoiceItems = getWeaponFeatChoiceItems(
    featPrerequisiteContext,
  );
  if (
    prerequisites?.weaponFocusReach &&
    !selectedWeaponFeatChoices.some(({ featId, weapon }) => {
      if (featId !== "weapon-focus") return false;
      const item = weaponFeatChoiceItems.find(
        (candidate) => getWeaponFeatTypeName(candidate.name) === weapon,
      );
      return Boolean(
        item &&
        (reachWeaponNames.has(weapon) ||
          item.reach ||
          /\breach\b/i.test(item.specialProperties ?? "")),
      );
    })
  )
    return false;
  if (
    prerequisites?.weaponFeatChoiceGroups?.some((group) => {
      const candidateWeapons = new Set(
        selectedWeaponFeatChoices
          .filter((choice) => group.featIds.includes(choice.featId))
          .map((choice) => choice.weapon),
      );
      return ![...candidateWeapons].some((weapon) => {
        if (
          !group.featIds.every((featId) =>
            selectedWeaponFeatChoices.some(
              (choice) => choice.featId === featId && choice.weapon === weapon,
            ),
          )
        )
          return false;
        const item = weaponFeatChoiceItems.find(
          (candidate) => getWeaponFeatTypeName(candidate.name) === weapon,
        );
        if (
          !item ||
          !isWeaponProficient(
            featPrerequisiteContext,
            item,
            excludingSlot,
          )
        )
          return false;
        if (!group.damageTypes?.length) return true;
        const damageType = getWeaponDamageTypeForFeatChoice(
          featPrerequisiteContext,
          weapon,
        ).toLowerCase();
        return group.damageTypes.some((requiredType) =>
          damageType.includes(requiredType),
        );
      });
    })
  )
    return false;
  if (
    prerequisites?.weaponProficiencyChoices?.length &&
    !prerequisites.weaponProficiencyChoices.some((weaponName) => {
      const item = findStoreItem(weaponName, "Weapons");
      return item && isWeaponProficient(
        featPrerequisiteContext,
        item,
        excludingSlot,
      );
    })
  )
    return false;
  const weaponProficiencyItems =
    getWeaponFeatChoiceItems(featPrerequisiteContext);
  if (
    prerequisites?.weaponProficiencyChoiceGroups?.some(
      (group) =>
        !group.some((weaponName) => {
          const item = weaponProficiencyItems.find(
            (candidate) =>
              getWeaponFeatTypeName(candidate.name) === weaponName,
          );
          return Boolean(
            item &&
            isWeaponProficient(
              featPrerequisiteContext,
              item,
              excludingSlot,
            ),
          );
        }),
    )
  )
    return false;
  const weaponFocusDamageTypes = prerequisites?.weaponFocusDamageTypes;
  if (
    weaponFocusDamageTypes?.length &&
    !Object.entries(featPrerequisiteContext.featSelections ?? {}).some(
      ([slotId, selectedFeatId]) => {
        if (selectedFeatId !== "weapon-focus") return false;
        const weaponType =
          featPrerequisiteContext.featWeaponSelections?.[slotId];
        if (!weaponType) return false;
        const damageType = getWeaponDamageTypeForFeatChoice(
          featPrerequisiteContext,
          weaponType,
        ).toLowerCase();
        return weaponFocusDamageTypes.some((requiredType) =>
          damageType.includes(requiredType),
        );
      },
    )
  )
    return false;
  if (
    prerequisites?.minimumFeatsByCategory &&
    Object.entries(prerequisites.minimumFeatsByCategory).some(
      ([category, minimum]) =>
        [...new Set(chosenFeats)].filter((chosenFeat) =>
          featCatalog.find((candidate) => candidate.id === chosenFeat)
            ?.categories?.includes(category as FeatCategory),
        ).length < minimum,
    )
  )
    return false;
  if (
    prerequisites?.featCategoryChoices?.some((choice) =>
      new Set(
        chosenFeats.filter((chosenFeat) =>
          chosenFeat !== feat.id &&
          featCatalog.find((candidate) => candidate.id === chosenFeat)
            ?.categories?.some((category) => choice.anyOf.includes(category)),
        ),
      ).size < choice.count,
    )
  )
    return false;
  if (
    prerequisites?.minimumSkillTricksByCategory &&
    Object.entries(prerequisites.minimumSkillTricksByCategory).some(
      ([category, minimum]) =>
        getSkillTrickCountsByCategory(character, slot.characterLevel)[
          category as SkillTrickCategory
        ] < minimum,
    )
  )
    return false;
  const raceId = getRaceDefinitionForCharacter(character)?.id;
  if (
    prerequisites?.draconianBreathWeapon &&
    (raceId === "draconian" || raceId?.endsWith("-draconian")) &&
    !chosenFeats.includes("draconian-breath-weapon")
  )
    return false;
  if (
    prerequisites?.anyFeats?.length &&
    !prerequisites.anyFeats.some((requiredFeat) => chosenFeats.includes(requiredFeat))
  )
    return false;
  return !(prerequisites?.feats ?? []).some(
    (requiredFeat) => !chosenFeats.includes(requiredFeat),
  );
}

function getLaterDragonDiscipleBoost(character: Character, ability: AbilityName, characterLevel: number) {
  return (character.hitPointRolls ?? []).reduce((total, roll) =>
    roll.prestigeClassId === "dragon-disciple" && roll.characterLevel > characterLevel
      ? total + (getDragonDiscipleAbilityBoost(roll.classLevel)[ability] ?? 0) : total, 0);
}

function getAbilityScoreAtCharacterLevel(
  character: Character,
  ability: AbilityName,
  characterLevel?: number,
) {
  const score = getEffectiveAbilityScore(character, ability);
  if (characterLevel === undefined) return score;
  const laterIncreases = Object.entries(
    character.abilityScoreIncreasesByLevel ?? {},
  ).filter(
    ([level, increase]) =>
      Number(level) > characterLevel && increase === ability,
  ).length;
  return score - laterIncreases - getLaterDragonDiscipleBoost(character, ability, characterLevel);
}

function getSkillRanksAtCharacterLevel(
  character: Character,
  skill: string,
  characterLevel?: number,
) {
  const currentRanks = Number(character.skills[skill] ?? 0);
  if (
    characterLevel === undefined ||
    characterLevel >= getTotalHitDice(character)
  )
    return currentRanks;

  const previousSnapshot = Object.entries(character.skillRanksByLevel ?? {})
    .map(([level, ranks]) => [Number(level), ranks] as const)
    .filter(([level]) => level <= characterLevel)
    .sort(([left], [right]) => right - left)[0]?.[1];
  return previousSnapshot
    ? Number(previousSnapshot[skill] ?? 0)
    : currentRanks;
}

function getBaseAttackBonusAtCharacterLevel(
  character: Character,
  characterLevel?: number,
) {
  const currentBonus = getBaseAttackBonus(character);
  if (
    characterLevel === undefined ||
    characterLevel >= getTotalHitDice(character)
  )
    return currentBonus;

  const previousSnapshot = Object.entries(character.baseAttackBonusByLevel ?? {})
    .map(([level, bonus]) => [Number(level), bonus] as const)
    .filter(([level]) => level <= characterLevel)
    .sort(([left], [right]) => right - left)[0]?.[1];
  return previousSnapshot ?? currentBonus;
}

export function getAvailableFeats(
  character: Character,
  slot: FeatEligibilitySlot,
  excludingSlot?: string,
) {
  const chosenFeats = [
    ...getArmorShieldProficiencies(character, excludingSlot),
    ...getChosenFeats(character, excludingSlot),
  ];
  return featCatalog.filter(
    (feat) =>
      (feat.source !== dragonlanceContentId ||
        character.ruleset !== core35ContentId) &&
      (!chosenFeats.includes(feat.id) ||
        repeatableFeats.has(feat.id) ||
        slot.rangerStyleLevel !== undefined) &&
      featQualifies(character, feat, slot, excludingSlot) &&
      (!weaponSelectionFeats.has(feat.id) ||
        getAvailableFeatWeaponChoices(character, feat.id, excludingSlot).length > 0) &&
      (feat.id !== "skill-focus" ||
        getAvailableFeatSkillChoices(character, excludingSlot).length > 0) &&
      (feat.id !== "spell-focus" ||
        getAvailableFeatSpellSchoolChoices(character, excludingSlot, "spell-focus").length > 0) &&
      (feat.id !== "greater-spell-focus" ||
        getAvailableFeatSpellSchoolChoices(character, excludingSlot, "greater-spell-focus").length > 0) &&
      (feat.id !== "arcane-defense" ||
        getAvailableFeatSpellSchoolChoices(character, excludingSlot, "arcane-defense").length > 0) &&
      (feat.id !== "simple-weapon-proficiency" ||
        hasUnproficientSimpleWeaponAtFeatSlot(character, slot, excludingSlot)),
  );
}

function hasUnproficientSimpleWeaponAtFeatSlot(
  character: Character,
  slot: FeatEligibilitySlot,
  excludingSlot?: string,
) {
  const historicalCharacter = getCharacterAtCharacterLevel(character, slot.characterLevel);
  const prerequisiteCharacter = getFeatPrerequisiteContext(character, slot, excludingSlot);
  const proficiencyCharacter = {
    ...historicalCharacter,
    featSelections: prerequisiteCharacter.featSelections,
  };
  return getStoreItems()
    .filter((item) =>
      item.category === "Weapons" &&
      getWeaponProficiencyCategory(proficiencyCharacter, item) === "Simple",
    )
    .some((item) => !isWeaponProficient(proficiencyCharacter, item, excludingSlot));
}

export function normalizeFeatSelections(
  character: Character,
  selections: Record<string, string>,
) {
  const chronologicalSelections: Record<string, string> = {};
  const slots = getChronologicalFeatSlots(character);
  let addedSelection = true;
  while (addedSelection) {
    addedSelection = false;
    slots.forEach((slot) => {
      if (chronologicalSelections[slot.id]) return;
      const featId = selections[slot.id];
      const feat = featCatalog.find((entry) => entry.id === featId);
      const featSelectionContext = {
        ...character,
        featSelections: chronologicalSelections,
      };
      const chosenFeats = getChosenFeats(featSelectionContext, slot.id);
      if (
        feat &&
        (!chosenFeats.includes(feat.id) ||
          repeatableFeats.has(feat.id) ||
          slot.rangerStyleLevel !== undefined) &&
        featQualifies(featSelectionContext, feat, slot, slot.id) &&
        (!weaponSelectionFeats.has(feat.id) ||
          getAvailableFeatWeaponChoices(
            featSelectionContext,
            feat.id,
            slot.id,
          ).length > 0) &&
        (feat.id !== "skill-focus" ||
          getAvailableFeatSkillChoices(featSelectionContext, slot.id).length > 0) &&
        (feat.id !== "spell-focus" ||
          getAvailableFeatSpellSchoolChoices(
            featSelectionContext,
            slot.id,
            "spell-focus",
          ).length > 0) &&
        (feat.id !== "greater-spell-focus" ||
          getAvailableFeatSpellSchoolChoices(
            featSelectionContext,
            slot.id,
            "greater-spell-focus",
          ).length > 0) &&
        (feat.id !== "arcane-defense" ||
          getAvailableFeatSpellSchoolChoices(
            featSelectionContext,
            slot.id,
            "arcane-defense",
          ).length > 0) &&
        (feat.id !== "simple-weapon-proficiency" ||
          hasUnproficientSimpleWeaponAtFeatSlot(featSelectionContext, slot, slot.id))
      ) {
        chronologicalSelections[slot.id] = feat.id;
        addedSelection = true;
      }
    });
  }
  const normalized: Record<string, string> = {};
  getFeatSlots(character).forEach((slot) => {
    const featId = chronologicalSelections[slot.id];
    if (featId) normalized[slot.id] = featId;
  });
  const usableSlotIds = Object.fromEntries(getActiveFeatEntries(character));
  const structurallyStoredSlotIds = Object.fromEntries(
    getStoredActiveFeatEntries(character),
  );
  const previousSelections = character.featSelections;
  if (previousSelections)
    for (const slotId in previousSelections)
      if (
        selections[slotId] === previousSelections[slotId] &&
        structurallyStoredSlotIds[slotId] &&
        !usableSlotIds[slotId]
      )
        normalized[slotId] = selections[slotId];
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

export function getAvailableFeatSkillChoices(
  character: Character,
  excludingSlot?: string,
) {
  const selectedSkills = new Set(
    getActiveFeatEntries(character)
      .filter(
        ([slotId, featId]) =>
          slotId !== excludingSlot && featId === "skill-focus",
      )
      .map(([slotId]) => character.featSkillSelections?.[slotId])
      .filter((skill): skill is string => Boolean(skill)),
  );
  return skills.filter((skill) => !selectedSkills.has(skill));
}

export function normalizeFeatSkillSelections(
  character: Character,
  selections: Record<string, string>,
) {
  const normalized: Record<string, string> = {};
  getFeatSlots(character).forEach((slot) => {
    if (character.featSelections?.[slot.id] !== "skill-focus") return;
    const skill = selections[slot.id];
    if (!skill) return;
    const context = { ...character, featSkillSelections: normalized };
    if (getAvailableFeatSkillChoices(context, slot.id).includes(skill))
      normalized[slot.id] = skill;
  });
  return normalized;
}

export function getFeatSkillSelectionWarnings(
  character: Character,
  slots = getFeatSlots(character),
) {
  return slots.flatMap((slot) => {
    if (character.featSelections?.[slot.id] !== "skill-focus") return [];
    const skill = character.featSkillSelections?.[slot.id];
    return skill && getAvailableFeatSkillChoices(character, slot.id).includes(skill)
      ? []
      : [`Choose a valid skill for ${slot.label}.`];
  });
}

export function getAvailableFeatSpellSchoolChoices(
  character: Character,
  excludingSlot?: string,
  featId:
    | "spell-focus"
    | "greater-spell-focus"
    | "arcane-defense"
    | "metamagic-school-focus" = "spell-focus",
): MagicSchool[] {
  const choiceSlot = excludingSlot &&
    getFeatSlots(character).find((slot) => slot.id === excludingSlot);
  const prerequisiteContext = choiceSlot
    ? getFeatPrerequisiteContext(character, choiceSlot, excludingSlot)
    : character;
  const characterAtChoice = choiceSlot
    ? getCharacterAtCharacterLevel(character, choiceSlot.characterLevel)
    : character;
  const wizardSpecializationSchool =
    getBaseClassLevel(characterAtChoice, "wizard") > 0
      ? characterAtChoice.coreWizardSpecializationSchool
      : undefined;
  const selectedSchools = new Set<MagicSchool>();
  const focusedSchools = new Set<MagicSchool>();
  for (const [slotId, selectedFeatId] of getActiveFeatEntries(prerequisiteContext)) {
    if (slotId === excludingSlot) continue;
    const school = character.featSpellSchoolSelections?.[slotId];
    if (!school) continue;
    if (selectedFeatId === featId) selectedSchools.add(school);
    if (selectedFeatId === "spell-focus") focusedSchools.add(school);
  }
  return magicSchools.filter((school) =>
    !selectedSchools.has(school) &&
    (featId === "spell-focus" ||
      focusedSchools.has(school) ||
      (featId === "metamagic-school-focus" &&
        wizardSpecializationSchool === school)),
  );
}

export function normalizeFeatSpellSchoolSelections(
  character: Character,
  selections: Record<string, MagicSchool>,
) {
  const normalized: Record<string, MagicSchool> = {};
  const slots = getChronologicalFeatSlots(character);
  for (const featId of [
    "spell-focus",
    "greater-spell-focus",
    "arcane-defense",
    "metamagic-school-focus",
  ] as const)
    slots.forEach((slot) => {
      if (character.featSelections?.[slot.id] !== featId) return;
      const school = selections[slot.id];
      const context = { ...character, featSpellSchoolSelections: normalized };
      if (
        school &&
        getAvailableFeatSpellSchoolChoices(context, slot.id, featId).includes(school)
      )
        normalized[slot.id] = school;
    });
  return normalized;
}

export function getFeatSpellSchoolSelectionWarnings(
  character: Character,
  slots = getFeatSlots(character),
) {
  const normalizedSelections = normalizeFeatSpellSchoolSelections(
    character,
    character.featSpellSchoolSelections ?? {},
  );
  return slots.flatMap((slot) => {
    const featId = character.featSelections?.[slot.id];
    if (
      featId !== "spell-focus" &&
      featId !== "greater-spell-focus" &&
      featId !== "arcane-defense" &&
      featId !== "metamagic-school-focus"
    )
      return [];
    const school = character.featSpellSchoolSelections?.[slot.id];
    return school &&
      normalizedSelections[slot.id] === school
      ? []
      : [`Choose a valid school of magic for ${slot.label}.`];
  });
}

export function getFeatSpellMasteryChoiceCount(
  character: Character,
  slotId?: string,
) {
  const savedCount = slotId
    ? character.featSpellMasterySelectionCounts?.[slotId]
    : undefined;
  return savedCount ?? Math.max(
    0,
    abilityModifier(getEffectiveAbilityScore(character, "int")),
  );
}

export function getAvailableFeatSpellMasteryChoices(
  character: Character,
  excludingSlot?: string,
) {
  if (!isSpellCatalogLoaded()) return [];
  const slots = getFeatSlots(character);
  const targetIndex = excludingSlot
    ? slots.findIndex((slot) => slot.id === excludingSlot)
    : -1;
  const consideredSlots = targetIndex >= 0
    ? slots.slice(0, targetIndex)
    : slots;
  const alreadyMastered = new Set(
    consideredSlots
      .filter((slot) => character.featSelections?.[slot.id] === "spell-mastery")
      .flatMap((slot) => character.featSpellMasterySelections?.[slot.id] ?? []),
  );
  const knownWizardSpells = new Set(
    getClassSpellSelections(character, "knownSpells").wizard ?? [],
  );
  return getWizardSpellbookSpells(character)
    .map((spell) => spell.name)
    .filter((spell) =>
      knownWizardSpells.has(spell) && !alreadyMastered.has(spell),
    );
}

export function normalizeFeatSpellMasterySelections(
  character: Character,
  selections: Record<string, string[]>,
) {
  const normalized: Record<string, string[]> = {};
  getFeatSlots(character).forEach((slot) => {
    if (character.featSelections?.[slot.id] !== "spell-mastery") return;
    const available = new Set(
      getAvailableFeatSpellMasteryChoices(
        { ...character, featSpellMasterySelections: normalized },
        slot.id,
      ),
    );
    const selected: string[] = [];
    (selections[slot.id] ?? []).forEach((spell) => {
      if (
        selected.length < getFeatSpellMasteryChoiceCount(character, slot.id) &&
        available.has(spell) &&
        !selected.includes(spell)
      )
        selected.push(spell);
    });
    if (selected.length > 0) normalized[slot.id] = selected;
  });
  return normalized;
}

export function getFeatSpellMasterySelectionWarnings(
  character: Character,
  slots = getFeatSlots(character),
) {
  return slots.flatMap((slot) => {
    if (character.featSelections?.[slot.id] !== "spell-mastery") return [];
    const selected = character.featSpellMasterySelections?.[slot.id] ?? [];
    const requiredCount = getFeatSpellMasteryChoiceCount(character, slot.id);
    const available = new Set(
      getAvailableFeatSpellMasteryChoices(character, slot.id),
    );
    return selected.length === requiredCount &&
      new Set(selected).size === selected.length &&
      selected.every((spell) => available.has(spell))
      ? []
      : [
          `Choose ${requiredCount} distinct known Wizard spell${requiredCount === 1 ? "" : "s"} for ${slot.label}.`,
        ];
  });
}

export function canIncreaseSkillRank(
  character: Character,
  skill: string,
  levelUpOriginal?: Character,
  levelUpClassId?: ClassId | PrestigeClassId,
  creationMode = false,
  creationSkillSourceId?: SkillRankSourceId,
) {
  const currentRanks = Number(character.skills[skill] || 0);
  const lastClassLevel = character.classLevels.at(-1);
  const defaultSkillSourceId = lastClassLevel && "prestigeClassId" in lastClassLevel
    ? lastClassLevel.prestigeClassId
    : lastClassLevel?.classId;
  const activeLevelUpClassId = levelUpOriginal
    ? levelUpClassId ?? getLevelUpSkillSourceId(levelUpOriginal, character)
    : undefined;
  const activeSkillSourceId = levelUpOriginal
    ? activeLevelUpClassId
    : creationMode
      ? creationSkillSourceId ??
        (getRacialHitDiceForCharacter(character) ? defaultSkillSourceId : undefined)
      : undefined;
  const classSkill = isClassSkill(character, skill, activeSkillSourceId);
  const pointCost = classSkill ? 1 : 2;
  const rankIncrease = pointCost === 1 ? 1 : 0.5;
  const availableSkillPoints = levelUpOriginal
    ? getAvailableSkillCount(levelUpOriginal) +
      getSkillPointsPerLevel(levelUpOriginal, activeLevelUpClassId ?? "fighter")
    : creationMode && activeSkillSourceId
      ? getAvailableSkillCountForSource(character, activeSkillSourceId)
      : getAvailableSkillCount(character);
  const spentSkillPoints = levelUpOriginal
    ? getLevelUpSpentSkillPoints(
        levelUpOriginal,
        character,
        activeLevelUpClassId ?? "fighter",
      )
    : creationMode && activeSkillSourceId
      ? getSpentSkillPointsForSource(character, activeSkillSourceId)
      : getSpentSkillPoints(character);
  const maximumRanks = creationMode && !getRacialHitDiceForCharacter(character)
    ? (classSkill ? 4 : 2)
    : getSkillMaximum(character, skill);
  const sourceMaximumRanks = activeSkillSourceId === "racial-hit-dice"
    ? getSkillMaximum(character, skill, activeSkillSourceId)
    : Infinity;
  const sourceRanks = activeSkillSourceId
    ? getAssignedSkillRanks(character, skill, undefined, activeSkillSourceId)
    : currentRanks;
  return (
    currentRanks + rankIncrease <= maximumRanks &&
    sourceRanks + rankIncrease <= sourceMaximumRanks &&
    spentSkillPoints + 1 <= availableSkillPoints
  );
}

export function getAssignedSkillRanks(
  character: Character,
  skill: string,
  levelUpOriginal?: Character,
  sourceId?: SkillRankSourceId,
) {
  const ranks = Number(character.skills[skill] || 0);
  if (levelUpOriginal)
    return Math.max(0, ranks - Number(levelUpOriginal.skills[skill] || 0));
  return sourceId
    ? Math.max(0, Number(character.skillRanksByClass?.[sourceId]?.[skill] || 0))
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
    "Control Shape",
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
  if (
    intelligenceSkills.includes(skill) ||
    skill.startsWith("Craft (") ||
    skill.startsWith("Knowledge (")
  )
    return "int";
  if (wisdomSkills.includes(skill)) return "wis";
  if (charismaSkills.includes(skill)) return "cha";
  if (strengthSkills.includes(skill)) return "str";
  return null;
}

export function getSkillUse(character: Character, skill: string) {
  const ranks = Number(character.skills[skill] || 0);
  const trained = ranks >= 1;
  const raceId = getRaceDefinitionForCharacter(character)?.id;
  const racialUntrainedSkill =
    (raceId === "kender" && ["Open Lock", "Sleight of Hand"].includes(skill)) ||
    (raceId === "mad-gnome" && ["Open Lock", "Disable Device"].includes(skill));
  if (skill === "Speak Language") {
    return { ranks, trained, untrainedUse: "special" as const, usable: false,
      label: "No skill check", description: "Each full rank learns one language. Choose it in the Languages section; no check is required." };
  }
  const limitation = skill.startsWith("Knowledge (")
    ? "Intelligence checks for common knowledge only (DC 10 or lower)."
    : limitedUntrainedSkills[skill];
  const untrainedUse = racialUntrainedSkill
    ? "allowed" as const
    : limitation ? "limited" as const : trainedOnlySkills.has(skill) ? "none" as const : "allowed" as const;
  const usable = trained || untrainedUse !== "none";
  const baseDescription = trained
    ? "At least 1 rank invested. Skill-specific task restrictions still apply."
    : racialUntrainedSkill
      ? "This race may use the skill even with 0 ranks."
      : limitation ?? (usable ? "May attempt this skill without ranks." : "At least 1 rank is required to attempt this skill.");
  const descriptionNotes = [
    !trained && !racialUntrainedSkill ? untrainedSkillNotes[skill] : undefined,
    skillTaskNotes[skill],
  ].filter(Boolean);
  return {
    ranks, trained, untrainedUse, usable,
    label: trained ? "Trained - usable" : untrainedUse === "none" ? "Training required" :
      untrainedUse === "limited" ? "Untrained - limited use" : "Untrained - usable",
    description: [baseDescription, ...descriptionNotes].join(" "),
  };
}

const armorPenaltySkills = new Set([
  "Balance", "Climb", "Escape Artist", "Hide", "Jump", "Move Silently",
  "Sleight of Hand", "Tumble", "Swim",
]);

export type SkillSynergyContext =
  | "appraise-related-craft"
  | "disguise-in-character"
  | "scroll-use"
  | "rope-bindings"
  | "secret-doors"
  | "survival-underground"
  | "survival-navigation"
  | "survival-natural"
  | "survival-other-planes"
  | "survival-tracking"
  | "scroll-deciphering"
  | "climbing-ropes"
  | "escape-ropes";

type SkillSynergyRule = {
  sourceSkill: string;
  targetSkill: string;
  context?: SkillSynergyContext;
};

const skillSynergyRules: readonly SkillSynergyRule[] = [
  { sourceSkill: "Bluff", targetSkill: "Diplomacy" },
  { sourceSkill: "Bluff", targetSkill: "Disguise", context: "disguise-in-character" },
  { sourceSkill: "Bluff", targetSkill: "Intimidate" },
  { sourceSkill: "Bluff", targetSkill: "Sleight of Hand" },
  { sourceSkill: "Craft", targetSkill: "Appraise", context: "appraise-related-craft" },
  { sourceSkill: "Decipher Script", targetSkill: "Use Magic Device", context: "scroll-use" },
  { sourceSkill: "Escape Artist", targetSkill: "Use Rope", context: "rope-bindings" },
  { sourceSkill: "Handle Animal", targetSkill: "Ride" },
  { sourceSkill: "Jump", targetSkill: "Tumble" },
  { sourceSkill: "Knowledge (arcana)", targetSkill: "Spellcraft" },
  { sourceSkill: "Knowledge (architecture and engineering)", targetSkill: "Search", context: "secret-doors" },
  { sourceSkill: "Knowledge (dungeoneering)", targetSkill: "Survival", context: "survival-underground" },
  { sourceSkill: "Knowledge (geography)", targetSkill: "Survival", context: "survival-navigation" },
  { sourceSkill: "Knowledge (local)", targetSkill: "Gather Information" },
  { sourceSkill: "Knowledge (nature)", targetSkill: "Survival", context: "survival-natural" },
  { sourceSkill: "Knowledge (nobility and royalty)", targetSkill: "Diplomacy" },
  { sourceSkill: "Knowledge (the planes)", targetSkill: "Survival", context: "survival-other-planes" },
  { sourceSkill: "Search", targetSkill: "Survival", context: "survival-tracking" },
  { sourceSkill: "Sense Motive", targetSkill: "Diplomacy" },
  { sourceSkill: "Spellcraft", targetSkill: "Use Magic Device", context: "scroll-use" },
  { sourceSkill: "Survival", targetSkill: "Knowledge (nature)" },
  { sourceSkill: "Tumble", targetSkill: "Balance" },
  { sourceSkill: "Tumble", targetSkill: "Jump" },
  { sourceSkill: "Use Magic Device", targetSkill: "Spellcraft", context: "scroll-deciphering" },
  { sourceSkill: "Use Rope", targetSkill: "Climb", context: "climbing-ropes" },
  { sourceSkill: "Use Rope", targetSkill: "Escape Artist", context: "escape-ropes" },
];

const skillSynergyContextLabels: Record<SkillSynergyContext, string> = {
  "appraise-related-craft": "Appraising an item related to Craft",
  "disguise-in-character": "Acting in character",
  "scroll-use": "Using a scroll",
  "rope-bindings": "Using rope for bindings",
  "secret-doors": "Searching for secret doors or compartments",
  "survival-underground": "Survival underground",
  "survival-navigation": "Avoiding getting lost or hazards",
  "survival-natural": "Survival in an aboveground natural environment",
  "survival-other-planes": "Survival on another plane",
  "survival-tracking": "Following tracks",
  "scroll-deciphering": "Deciphering a scroll",
  "climbing-ropes": "Climbing ropes",
  "escape-ropes": "Escaping from ropes",
};

const skillSynergyContexts = Object.keys(
  skillSynergyContextLabels,
) as SkillSynergyContext[];

function getApplicableSkillSynergies(
  character: Character,
  skill: string,
  context?: SkillSynergyContext,
) {
  return skillSynergyRules.filter(
    (rule) =>
      rule.targetSkill === skill &&
      getSkillUse(character, rule.sourceSkill).ranks >= 5 &&
      (!rule.context || rule.context === context),
  );
}

export function getSkillSynergyBonus(
  character: Character,
  skill: string,
  context?: SkillSynergyContext,
) {
  return getApplicableSkillSynergies(character, skill, context).length > 0
    ? 2
    : 0;
}

export function getSkillSynergyContextOptions(
  character: Character,
  skill: string,
) {
  return skillSynergyContexts.flatMap((context) =>
    skillSynergyRules.some(
      (rule) =>
        rule.targetSkill === skill &&
        rule.context === context &&
        getSkillUse(character, rule.sourceSkill).ranks >= 5,
    )
      ? [{ context, label: skillSynergyContextLabels[context], bonus: 2 }]
      : [],
  );
}

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
    const penalty = getCharacterEquipmentCheckPenalty(character, name, slot) * multiplier;
    return penalty < 0 ? [{ source: slot.toLowerCase(), name, penalty, multiplier }] : [];
  });
  const encumbrance = getEncumbrance(character);
  const loadPenalty = encumbrance.checkPenalty * multiplier;
  const armorPenalty = equipment.reduce((total, entry) => total + entry.penalty, 0);
  return loadPenalty < armorPenalty
    ? [{ source: "load", name: `${encumbrance.load} load (${encumbrance.weight} lb.)`, penalty: loadPenalty, multiplier }]
    : equipment;
}

function getSmallSizeHideBonus(character: Character, skill: string) {
  return skill === "Hide" && sizeModifier(character) === 1 ? 4 : 0;
}

export const combatCastingContextOptions = [
  { value: "defensive-casting", label: "Casting defensively" },
  { value: "grappled", label: "Grappled" },
  { value: "pinned", label: "Pinned" },
] as const;
export type CombatCastingContext = (typeof combatCastingContextOptions)[number]["value"];

export function getCombatCastingBonus(
  character: Character,
  context?: CombatCastingContext,
) {
  return context && getChosenFeats(character).includes("combat-casting") ? 4 : 0;
}

function getEquipmentSkillBonus(character: Character, skill: string) {
  const bonuses: { source: string; bonus: number }[] = [];
  const armorName = character.equipment?.Armor ?? "";
  const torsoName = character.equipment?.Torso ?? "";
  if (skill === "Escape Artist") {
    if (/\bSlick\b/i.test(armorName)) {
      bonuses.push({ source: "Slick armor", bonus: 5 });
    }
    if (/\bVest of Escape\b/i.test(torsoName)) {
      bonuses.push({ source: "Vest of Escape", bonus: 6 });
    }
  }
  if (skill === "Open Lock" && /\bVest of Escape\b/i.test(torsoName)) {
    bonuses.push({ source: "Vest of Escape", bonus: 4 });
  }
  const bonus = Math.max(0, ...bonuses.map((entry) => entry.bonus));
  const sources = bonuses
    .filter((entry) => entry.bonus === bonus)
    .map((entry) => entry.source);
  return {
    bonus,
    details: bonus
      ? [`${sources.join(", ")}: ${formatModifier(bonus)} competence bonus; same-type bonuses do not stack.`]
      : [],
  };
}

function getDruidNatureSenseBonus(character: Character, skill: string) {
  return isNeutralAlignment(character.alignment) &&
    getBaseClassLevel(character, "druid") > 0 &&
    (skill === "Knowledge (nature)" || skill === "Survival")
    ? 2
    : 0;
}

export function getSkillCheckModifier(
  character: Character,
  skill: string,
  condition?: RacialSkillCondition,
  synergyContext?: SkillSynergyContext,
  combatCastingContext?: CombatCastingContext,
): number | null {
  const use = getSkillUse(character, skill);
  if (!use.usable) return null;
  const ability = getSkillAbility(skill);
  const abilityBonus = ability ? abilityModifier(getEffectiveAbilityScore(character, ability)) : 0;
  const penalty = getSkillCheckPenalties(character, skill).reduce((total, entry) => total + entry.penalty, 0);
  const activeChecks = getCombatEffectModifier(character, "checks");
  const synergyBonus = getSkillSynergyBonus(character, skill, synergyContext);
  const sizeBonus = getSmallSizeHideBonus(character, skill);
  const skillFocusBonus = getSkillFocusBonus(character, skill);
  const featSkillBonus = getFeatSkillBonuses(character, skill).reduce(
    (total, entry) => total + entry.bonus,
    0,
  );
  const natureSenseBonus = getDruidNatureSenseBonus(character, skill);
  const equipmentBonus = getEquipmentSkillBonus(character, skill).bonus;
  const combatCastingBonus = skill === "Concentration"
    ? getCombatCastingBonus(character, combatCastingContext)
    : 0;
  if (!use.trained && use.untrainedUse === "limited")
    return abilityBonus + penalty + activeChecks + synergyBonus + skillFocusBonus + featSkillBonus + equipmentBonus + combatCastingBonus + natureSenseBonus;
  return abilityBonus + Math.floor(use.ranks) + getRacialSkillBonus(character, skill, condition) + sizeBonus + synergyBonus + penalty + activeChecks + skillFocusBonus + featSkillBonus + equipmentBonus + combatCastingBonus + natureSenseBonus;
}

export function getSkillFocusBonus(character: Character, skill: string) {
  return getActiveFeatEntries(character).some(
    ([slotId, featId]) =>
      featId === "skill-focus" &&
      character.featSkillSelections?.[slotId] === skill,
  )
    ? 3
    : 0;
}

function getFeatSkillBonuses(character: Character, skill: string) {
  const selectedFeatIds = new Set(getChosenFeats(character));
  return featCatalog.flatMap((feat) => {
    const bonus = feat.skillBonuses?.[skill];
    return selectedFeatIds.has(feat.id) && bonus !== undefined
      ? [{ name: feat.name, bonus }]
      : [];
  });
}

export type RacialSkillContextOption = {
  condition: RacialSkillCondition;
  label: string;
  bonus: number;
};

const racialSkillConditions: RacialSkillCondition[] = [
  "unusual-stonework",
  "stone-or-metal",
  "alchemy",
  "taunt",
  "pitiable",
];

const racialSkillConditionLabels: Record<RacialSkillCondition, string> = {
  "unusual-stonework": "Unusual stonework (including within 10 ft.)",
  "stone-or-metal": "Stone or metal items",
  alchemy: "Alchemy",
  taunt: "Taunting with Bluff",
  pitiable: "Appealing to an enemy not to harm you",
};

export function getRacialSkillContextOptions(character: Character, skill: string): RacialSkillContextOption[] {
  const race =
    getRaceDefinitionForCharacter(character);
  const bonuses = race?.racialSituationalSkillBonuses?.[skill];
  return racialSkillConditions.flatMap((condition) => {
    const bonus = bonuses?.[condition] ?? 0;
    return bonus
      ? [{ condition, label: racialSkillConditionLabels[condition], bonus }]
      : [];
  });
}

export function getRacialSkillBonus(
  character: Character,
  skill: string,
  condition?: RacialSkillCondition,
) {
  const race =
    getRaceDefinitionForCharacter(character);
  return (
    (race?.racialSkillBonuses?.[skill] ?? 0) +
    (condition
      ? race?.racialSituationalSkillBonuses?.[skill]?.[condition] ?? 0
      : 0)
  );
}

export function getCharacterRace(character: Character) {
  return (
    getRaceDefinitionForCharacter(character)?.name ??
    character.race
  );
}

export type DwarfStabilityCheck = "bull-rush" | "trip";

export function getDwarfStabilityBonus(
  character: Character,
  check: DwarfStabilityCheck | undefined,
  firmlyGrounded: boolean,
) {
  const dwarfId = getRaceDefinitionForCharacter(character)?.id;
  if (
    !["dwarf", "hill-dwarf", "mountain-dwarf", "dark-dwarf"].includes(dwarfId ?? "") ||
    !check ||
    !firmlyGrounded
  ) {
    return 0;
  }
  return 4;
}

export function getSkillTotalTooltip(
  character: Character,
  skill: string,
  condition?: RacialSkillCondition,
  synergyContext?: SkillSynergyContext,
  combatCastingContext?: CombatCastingContext,
) {
  const ability = getSkillAbility(skill);
  const abilityBonus = ability
    ? abilityModifier(getEffectiveAbilityScore(character, ability))
    : 0;
  const racialBonus = getRacialSkillBonus(character, skill, condition);
  const sizeBonus = getSmallSizeHideBonus(character, skill);
  const skillFocusBonus = getSkillFocusBonus(character, skill);
  const featSkillBonuses = getFeatSkillBonuses(character, skill);
  const natureSenseBonus = getDruidNatureSenseBonus(character, skill);
  const combatCastingBonus = skill === "Concentration"
    ? getCombatCastingBonus(character, combatCastingContext)
    : 0;
  const combatCastingLabel = combatCastingContextOptions.find(
    (option) => option.value === combatCastingContext,
  )?.label;
  const racialContext = getRacialSkillContextOptions(character, skill).find(
    (option) => option.condition === condition,
  );
  const synergySources = getApplicableSkillSynergies(
    character,
    skill,
    synergyContext,
  );
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
      ? [
          `${abilityLabels[ability]}: ${formatModifier(abilityBonus)}`,
          ...getAbilityEquipmentBonus(character, ability).detail,
          ...getCombatEffectAbilityDetails(character, ability),
        ]
      : []),
    ...getCombatEffectDetails(character, "checks"),
    ...getEquipmentSkillBonus(character, skill).details,
    ...featSkillBonuses.map(
      ({ name, bonus }) => `${name}: ${formatModifier(bonus)}`,
    ),
    racialBonus
      ? `${getCharacterRace(character)}${racialContext ? ` (${racialContext.label})` : ""}: ${formatModifier(racialBonus)}`
      : "",
    natureSenseBonus ? `Nature Sense: ${formatModifier(natureSenseBonus)}` : "",
    skillFocusBonus ? `Skill Focus: ${formatModifier(skillFocusBonus)}` : "",
    combatCastingBonus && combatCastingLabel
      ? `Combat Casting (${combatCastingLabel}): ${formatModifier(combatCastingBonus)}`
      : "",
    sizeBonus ? `Small size (Hide): ${formatModifier(sizeBonus)}` : "",
    synergySources.length
      ? `Skill synergy ${formatModifier(2)}: ${[...new Set(synergySources.map((entry) => entry.sourceSkill))].join(", ")}`
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

export function isNeutralAlignment(alignment: string) {
  return alignment === "True Neutral" || alignment.startsWith("Neutral ") || alignment.endsWith(" Neutral");
}

export function alignmentDistance(first: string, second: string) {
  const axes = (alignment: string) => ({
    law: alignment.startsWith("Lawful ") ? -1 : alignment.startsWith("Chaotic ") ? 1 : 0,
    moral: alignment.endsWith(" Good") ? 1 : alignment.endsWith(" Evil") ? -1 : 0,
  });
  const left = axes(first);
  const right = axes(second);
  return Math.abs(left.law - right.law) + Math.abs(left.moral - right.moral);
}

export function isClericAlignmentAllowed(alignment: string, deityAlignment: string) {
  return alignmentDistance(alignment, deityAlignment) <= 1 &&
    (alignment !== "True Neutral" || deityAlignment === "True Neutral");
}

export function isClericAlignmentAllowedForDeity(alignment: string, deity: DeityDefinition) {
  return deity.clericAlignments
    ? deity.clericAlignments.includes(alignment)
    : isClericAlignmentAllowed(alignment, deity.alignment);
}

function inferClericUndeadTurningMode(
  character: Character,
): Character["clericUndeadTurningMode"] {
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  if (deity?.id === "st-cuthbert") return "turn";
  if (deity?.id === "we-jas" && character.alignment === "Lawful Neutral")
    return "rebuke";
  if (deity?.id === "obad-hai" && !character.alignment.endsWith(" Evil"))
    return "turn";
  if (character.alignment.endsWith(" Good")) return "turn";
  if (character.alignment.endsWith(" Evil")) return "rebuke";
  if (deity?.alignment.endsWith(" Good")) return "turn";
  if (deity?.alignment.endsWith(" Evil")) return "rebuke";
  return undefined;
}

export function getClericUndeadTurningMode(
  character: Character,
): Character["clericUndeadTurningMode"] {
  if (getBaseClassLevel(character, "cleric") === 0) return undefined;
  return inferClericUndeadTurningMode(character) ??
    character.clericUndeadTurningMode;
}

export function requiresManualClericUndeadTurningMode(character: Character) {
  return getBaseClassLevel(character, "cleric") > 0 &&
    inferClericUndeadTurningMode(character) === undefined;
}

const dragonlanceRangerPatronIds = {
  good: "habbakuk",
  neutral: "chislev",
  evil: "zeboim",
} as const;

export const rangerFavoredEnemyLevels = [1, 5, 10, 15, 20] as const;

export const rangerFavoredEnemyCreatureTypes = [
  "Aberration",
  "Animal",
  "Construct",
  "Dragon",
  "Elemental",
  "Fey",
  "Giant",
  "Humanoid",
  "Magical Beast",
  "Monstrous Humanoid",
  "Ooze",
  "Outsider",
  "Plant",
  "Undead",
  "Vermin",
] as const;

export function getRangerFavoredEnemyChoiceLevels(rangerLevel: number) {
  return rangerFavoredEnemyLevels.filter((level) => rangerLevel >= level);
}

export function getRangerFavoredEnemyLabel(choice: RangerFavoredEnemyChoice) {
  if (choice.kind === "organization") return choice.target.trim();
  const subtype = choice.subtype?.trim();
  return subtype ? `${choice.target} (${subtype})` : choice.target;
}

export function getRangerFavoredEnemyBonus(
  choices: RangerFavoredEnemyChoice[],
  classLevel: RangerFavoredEnemyLevel,
) {
  const target = choices.find(
    (choice) => choice.classLevel === classLevel && choice.target.trim(),
  );
  if (!target) return 0;
  const laterIncreases = choices.filter(
    (choice) => choice.classLevel > 1 && choice.bonusTargetLevel === classLevel,
  ).length;
  return 2 + laterIncreases * 2;
}

export function getRangerFavoredEnemyWarnings(character: Character) {
  const rangerLevel = getBaseClassLevel(character, "ranger");
  if (!rangerLevel) return [];
  const choices = character.rangerFavoredEnemies ?? [];
  const byLevel = new Map(
    choices.map((choice) => [choice.classLevel, choice] as const),
  );
  const warnings: string[] = [];
  const seenTargets = new Set<string>();

  for (const classLevel of getRangerFavoredEnemyChoiceLevels(rangerLevel)) {
    const choice = byLevel.get(classLevel);
    if (!choice || !choice.target.trim()) {
      warnings.push(`Choose a favored enemy at level ${classLevel}.`);
      continue;
    }
    if (choice.kind === "organization" && character.ruleset === core35ContentId) {
      warnings.push("Organizations require Dragonlance rules.");
    }
    if (choice.kind === "creature") {
      const requiresSubtype =
        choice.target === "Humanoid" || choice.target === "Outsider";
      if (
        !rangerFavoredEnemyCreatureTypes.some((type) => type === choice.target) ||
        (requiresSubtype && !choice.subtype?.trim())
      ) {
        warnings.push(requiresSubtype
          ? `Choose a subtype at level ${classLevel}.`
          : `Choose a valid enemy type at level ${classLevel}.`);
      }
    }
    const targetKey = `${choice.kind}:${choice.target.trim().toLowerCase()}:${choice.subtype?.trim().toLowerCase() ?? ""}`;
    if (seenTargets.has(targetKey)) {
      warnings.push(`Choose a different favored enemy at level ${classLevel}.`);
    } else {
      seenTargets.add(targetKey);
    }
    if (classLevel > 1) {
      const bonusTarget = byLevel.get(choice.bonusTargetLevel);
      if (!bonusTarget?.target.trim()) {
        warnings.push(`Choose the favored enemy receiving the level ${classLevel} +2.`);
      }
    }
  }
  return warnings;
}

export function getDragonlanceRangerPatron(alignment: string) {
  const moralAxis = alignment.endsWith(" Good")
    ? "good"
    : alignment.endsWith(" Evil")
      ? "evil"
      : alignment === "True Neutral" || alignment.endsWith(" Neutral")
        ? "neutral"
        : undefined;
  if (!moralAxis) return undefined;
  return deityDefinitions.find(
    (deity) => deity.id === dragonlanceRangerPatronIds[moralAxis],
  );
}

export function getDragonlanceRangerWarnings(character: Character, rangerLevel: number) {
  if (character.ruleset === core35ContentId) return [];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  const expectedPatron = getDragonlanceRangerPatron(character.alignment);
  if (deity && deity.id !== expectedPatron?.id) {
    return [
      `A Dragonlance Ranger with ${character.alignment} alignment must follow ${expectedPatron?.name ?? "a nature deity"}.`,
    ];
  }
  if (rangerLevel >= 4 && !deity) {
    return [
      "A Dragonlance Ranger must choose a nature deity by Ranger level 4 to cast divine spells (Habbakuk for good, Chislev for neutral, or Zeboim for evil alignment).",
    ];
  }
  return [];
}

export function getDragonlanceDruidWarnings(character: Character) {
  if (character.ruleset === core35ContentId) return [];
  const expectedPatron = getDragonlanceRangerPatron(character.alignment);
  if (!expectedPatron) {
    return [
      "A Dragonlance Druid must choose Habbakuk, Chislev, or Zeboim as a patron deity.",
    ];
  }
  if (character.deity !== expectedPatron.id) {
    return [
      `A Dragonlance Druid with ${character.alignment} alignment must follow ${expectedPatron.name}.`,
    ];
  }
  return [];
}

export function isClassAlignmentAllowed(classId: ClassId, alignment: string) {
  if (classId === "barbarian" || classId === "bard")
    return !alignment.startsWith("Lawful ");
  if (classId === "monk") return alignment.startsWith("Lawful ");
  if (classId === "paladin") return alignment === "Lawful Good";
  if (classId === "knight") return alignment.startsWith("Lawful ");
  if (classId === "dragon-shaman") return alignment !== "True Neutral";
  if (classId === "druid") return isNeutralAlignment(alignment);
  return true;
}

export function getClassAlignmentRestriction(classId: ClassId) {
  if (classId === "barbarian" || classId === "bard") return "must be non-lawful";
  if (classId === "monk") return "must be lawful";
  if (classId === "paladin") return "must be Lawful Good";
  if (classId === "knight") return "must be lawful";
  if (classId === "dragon-shaman") return "must have a non-neutral alignment tendency";
  if (classId === "druid") return "must be neutral on at least one alignment axis";
  return "";
}

export function isDragonShamanTotemAlignmentAllowed(totem: string, alignment: string) {
  const allowed: Record<string, string[]> = {
    Black: ["Neutral Evil", "Chaotic Evil", "Chaotic Neutral"],
    Blue: ["Neutral Evil", "Lawful Evil", "Lawful Neutral"],
    Brass: ["Neutral Good", "Chaotic Good", "Chaotic Neutral"],
    Bronze: ["Neutral Good", "Lawful Good", "Lawful Neutral"],
    Copper: ["Neutral Good", "Chaotic Good", "Chaotic Neutral"],
    Gold: ["Neutral Good", "Lawful Good", "Lawful Neutral"],
    Green: ["Neutral Evil", "Lawful Evil", "Lawful Neutral"],
    Red: ["Neutral Evil", "Chaotic Evil", "Chaotic Neutral"],
    Silver: ["Neutral Good", "Lawful Good", "Lawful Neutral"],
    White: ["Neutral Evil", "Chaotic Evil", "Chaotic Neutral"],
  };
  return Boolean(allowed[totem]?.includes(alignment));
}

export function getRequiredDragonShamanAuraCount(level: number) {
  return Math.min(7, 3 + [3, 5, 7, 9].filter((milestone) => level >= milestone).length);
}

export function getLevelUpAlignmentWarnings(character: Character, classId: ClassId) {
  if (!isClassAlignmentAllowed(classId, character.alignment))
    return [
      `Cannot take a ${classDefinitions[classId].name} level with ${character.alignment}; this class ${getClassAlignmentRestriction(classId)}.`,
    ];
  if (classId === "dragon-shaman") {
    if (!character.dragonShamanTotem)
      return ["Choose a Dragon Shaman totem dragon before taking a level."];
    if (!isDragonShamanTotemAlignmentAllowed(character.dragonShamanTotem, character.alignment))
      return [`The ${character.dragonShamanTotem} totem is not within one alignment step of ${character.alignment}.`];
    const requiredAuras = getRequiredDragonShamanAuraCount(
      getBaseClassLevel(character, "dragon-shaman"),
    );
    if ((character.dragonShamanAuras?.length ?? 0) !== requiredAuras)
      return [`Choose exactly ${requiredAuras} Dragon Shaman aura${requiredAuras === 1 ? "" : "s"}.`];
  }
  if (classId !== "cleric") return [];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  if (!deity) return ["Choose a deity before taking a Cleric level."];
  if (deity.clericDomains?.length === 0) {
    return [`${deity.name} grants no divine spells or cleric domains; a Cleric level is unavailable.`];
  }

  if (isClericAlignmentAllowedForDeity(character.alignment, deity)) return [];
  if (deity.clericAlignments) {
    return [
      `Cannot take a Cleric level with ${character.alignment}; ${deity.name} permits ${deity.clericAlignments.join(", ")}.`,
    ];
  }
  return [
    `Cannot take a Cleric level with ${character.alignment}; it must be within one step of ${deity.name}.`,
  ];
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
  const currentEquipment = character.equipment ?? {};
  if (
    Object.values(currentEquipment).includes(key) &&
    !(item?.category === "Weapons" && currentEquipment["Main Weapon"] === key)
  ) return;
  let slot = "Miscellaneous";
  const nextEquipment = { ...currentEquipment };
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
  else if (item?.category === "Rings" || item?.name.startsWith("Ring of ")) {
    if (!nextEquipment["Rings 1"]) slot = "Rings 1";
    else if (!nextEquipment["Rings 2"]) slot = "Rings 2";
    else {
      window.alert("Both ring slots are occupied. Unequip a ring before equipping another.");
      return;
    }
  } else if (item?.name.startsWith("Headband of ")) slot = "Head";
  else if (item?.name.startsWith("Cloak of ")) slot = "Shoulders";
  else if (item?.category === "Head") slot = "Head";
  else if (item?.category === "Eyes") slot = "Eyes";
  else if (item?.category === "Neck") slot = "Neck";
  else if (item?.category === "Shoulders") slot = "Shoulders";
  else if (item?.category === "Arms") slot = "Arms";
  else if (item?.category === "Hands") slot = "Hands";
  else if (item?.category === "Body") slot = "Body";
  else if (item?.category === "Torso") slot = "Torso";
  else if (item?.category === "Waist") slot = "Waist";
  else if (item?.category === "Feet") slot = "Feet";
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
  if (
    item?.category !== "Weapons" &&
    nextEquipment[slot] &&
    nextEquipment[slot] !== key &&
    !window.confirm(`${slot} is occupied by ${nextEquipment[slot]}. Replace it with ${itemName}?`)
  ) return;
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
