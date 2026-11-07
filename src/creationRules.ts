import { classDefinitions, dragonlancePrestigeClasses, raceDefinitions, type AbilityName, type Character, type ClassId, type PrestigeClassId } from "./domain";
import { isNeutralAlignment } from "./rules";

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
  ].filter(Boolean);
  return `${requirements.length ? `Prerequisites: ${requirements.join("; ")}. ` : ""}${prestigeClass.roleplayPrerequisite ? `Special: ${prestigeClass.roleplayPrerequisite} ` : ""}Features: ${prestigeClass.features.join(", ")}.`;
}

export function isPrestigeClassEligible(
  definition: (typeof dragonlancePrestigeClasses)[PrestigeClassId],
  classId: ClassId,
  race: string,
) {
  if (definition.levelUpEnabled) return false;
  const prerequisites = definition.prerequisites;
  const raceId = race.toLowerCase().replaceAll(" ", "-");
  return (
    (!prerequisites.classes?.length || prerequisites.classes.includes(classId)) &&
    (!prerequisites.races?.length || prerequisites.races.includes(raceId))
  );
}

export function isHighSorceryAlignmentAllowed(order: Character["highSorceryOrder"], alignment: string) {
  if (order === "white") return alignment.endsWith(" Good") || alignment === "Good";
  if (order === "black") return alignment.endsWith(" Evil") || alignment === "Evil";
  return order === "red" ? isNeutralAlignment(alignment) : true;
}
