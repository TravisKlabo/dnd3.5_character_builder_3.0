import { classDefinitions, dragonlancePrestigeClasses, raceDefinitions, type AbilityName, type Character, type ClassId, type PrestigeClassId } from "./domain";
import { getPrestigeClassPrerequisiteErrors, isNeutralAlignment } from "./rules";

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
  const movement = [
    `Speed ${race.speed ?? 30} ft.`,
    ...(race.swimSpeed === undefined ? [] : [`Swim ${race.swimSpeed} ft.`]),
  ].join("; ");
  const levelAdjustment = race.levelAdjustment
    ? `; Level adjustment +${race.levelAdjustment}`
    : "";
  const racialHitDice = race.racialHitDice
    ? `; ${race.racialHitDice.count}d${race.racialHitDice.hitDie} racial Hit Dice (include these in manually entered total HP)`
    : "";
  return `${formatRaceModifiers(race.abilityModifiers)}; Size ${race.size ?? "Medium"}; ${movement}${racialHitDice}${levelAdjustment}; ${abilities.length ? abilities.join(", ") : "No special abilities recorded"}`;
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
    prerequisites.baseSaves
      ? Object.entries(prerequisites.baseSaves)
          .map(([save, bonus]) => `Base ${save} +${bonus}`)
          .join(", ")
      : "",
    prerequisites.skills
      ? Object.entries(prerequisites.skills)
          .map(([skill, ranks]) => `${skill} ${ranks} ranks`)
          .join(", ")
      : "",
    prerequisites.alignment ?? "",
    prerequisites.classes?.length
      ? prerequisites.classes
          .map((classId) => classDefinitions[classId].name)
          .join(" or ")
      : "",
    prerequisites.races?.length ? prerequisites.races.join(" or ") : "",
    prerequisites.feats?.length ? prerequisites.feats.join(", ") : "",
    prerequisites.anyFeats?.length ? `One of: ${prerequisites.anyFeats.join(", ")}` : "",
    ...(prerequisites.featChoices ?? []).map(({ anyOf, count }) =>
      `${count} distinct feats from ${anyOf.join(" or ")}`),
    ...(prerequisites.featCategoryChoices ?? []).map(({ anyOf, count }) =>
      `${count} distinct ${anyOf.join(" or ")} feats`),
    prerequisites.anySkillRanks
      ? `${prerequisites.minimumMatchingSkills ?? 1} ${prerequisites.anySkillPrefix?.replace(/ \($/, "") ?? ""} skill(s) with ${prerequisites.anySkillRanks} ranks each` : "",
    prerequisites.weaponFocusChoices?.length
      ? `Weapon Focus (${prerequisites.weaponFocusChoices.join(" or ")})` : "",
    prerequisites.skillFocusPrefix ? `Skill Focus (${prerequisites.skillFocusPrefix.replace(/ \($/, "")} skill)` : "",
    prerequisites.skillFocus ? `Skill Focus (${prerequisites.skillFocus})` : "",
    ...(prerequisites.spellFocusSchools ?? []).map((school) => `Spell Focus (${school})`),
    prerequisites.minimumSpellFocusSchools ? `Spell Focus in ${prerequisites.minimumSpellFocusSchools} distinct schools` : "",
    prerequisites.allMartialWeaponProficiencies ? "Proficient with all martial weapons" : "",
    prerequisites.languages?.length ? `Languages: ${prerequisites.languages.join(", ")}` : "",
    prerequisites.sneakAttackDice ? `Sneak attack +${prerequisites.sneakAttackDice}d6` : "",
    prerequisites.spontaneousArcaneSpellcasting ? "Arcane spellcasting without preparation" : "",
    ...(prerequisites.classFeatures ?? []),
    ...Object.entries(prerequisites.prestigeClasses ?? {}).map(([id, level]) =>
      `${dragonlancePrestigeClasses[id as PrestigeClassId].name} ${level}`),
    ...[
      ...(prerequisites.spellcasting ? [prerequisites.spellcasting] : []),
      ...(prerequisites.additionalSpellcasting ?? []),
    ].map(({ type, level }) => `${type} spells of level ${level} or higher`),
    prerequisites.spells?.length ? `Able to cast ${prerequisites.spells.join(", ")}` : "",
    prerequisites.spellSchoolSpells
      ? `${prerequisites.spellSchoolSpells.count} different ${prerequisites.spellSchoolSpells.school} spells, including one of level ${prerequisites.spellSchoolSpells.minimumLevel} or higher` : "",
    prerequisites.arcaneSpellRepertoire
      ? `Cast a level ${prerequisites.arcaneSpellRepertoire.castableLevel} arcane spell and know level ${prerequisites.arcaneSpellRepertoire.minimumSchoolSpellLevel}+ arcane spells from ${prerequisites.arcaneSpellRepertoire.schoolCount} distinct schools` : "",
  ].filter(Boolean);
  const spellList = prestigeClass.referenceSpellList;
  const spellListDetails = spellList
    ? ` ${prestigeClass.levelUpEnabled ? "Class spells (independent casting)" : "Reference spells"}: ${Object.entries(spellList.levels).map(([level, spells]) => `Level ${level}: ${spells.join(", ")}`).join("; ")}.${spellList.note ? ` ${spellList.note}` : ""}`
    : "";
  return `${requirements.length ? `Prerequisites: ${requirements.join("; ")}. ` : ""}${prestigeClass.roleplayPrerequisite ? `Special: ${prestigeClass.roleplayPrerequisite} ` : ""}Features: ${prestigeClass.features.join(", ")}.${!prestigeClass.levelUpEnabled ? " Reference only: complete level-up progression is not implemented." : ""}${spellListDetails}`;
}

export function isPrestigeClassEligible(
  definition: (typeof dragonlancePrestigeClasses)[PrestigeClassId],
  character: Character,
) {
  if (definition.levelUpEnabled) return false;
  return getPrestigeClassPrerequisiteErrors(character, definition.id, false).length === 0;
}

export function isHighSorceryAlignmentAllowed(order: Character["highSorceryOrder"], alignment: string) {
  if (order === "white") return alignment.endsWith(" Good") || alignment === "Good";
  if (order === "black") return alignment.endsWith(" Evil") || alignment === "Evil";
  return order === "red" ? isNeutralAlignment(alignment) : true;
}
