import { deityDefinitions, type Character } from "./domain";
import { clericDomains, getClericDomain, type ClericDomainId } from "./data/clericDomains";
import { getEffectiveAbilityScore } from "./abilityEquipment";

const domainAlignments: Partial<Record<ClericDomainId, string>> = {
  chaos: "Chaotic", evil: "Evil", good: "Good", law: "Lawful",
};

export function clericDomainAllowed(character: Character, id: ClericDomainId) {
  const alignment = domainAlignments[id];
  return !alignment || character.alignment.includes(alignment);
}

export function getActiveClericDomains(character: Character) {
  if (!character.classLevels.some((entry) => entry.classId === "cleric")) return [];
  return (character.clericDomains ?? []).filter((id) => clericDomainAllowed(character, id));
}

export function isClericDomainClassSkill(character: Character, skill: string) {
  return getActiveClericDomains(character).some((id) => {
    const skills = getClericDomain(id).classSkills ?? [];
    return skills.includes(skill) || (skills.includes("Knowledge (*)") && skill.startsWith("Knowledge ("));
  });
}

export function getClericDomainSlotCount(character: Character, level: number) {
  const clericLevel = character.classLevels.find((entry) => entry.classId === "cleric")?.level ?? 0;
  return Number(Number.isInteger(level) && level >= 1 && level <= 9 &&
    clericLevel >= level * 2 - 1 && getEffectiveAbilityScore(character, "wis") >= 10 + level);
}

const evilSpells = new Set(["Death Knell", "Animate Dead", "Create Undead", "Create Greater Undead"]);
export function getClericDomainSpellOptions(character: Character, level: number) {
  if (!getClericDomainSlotCount(character, level)) return [];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  return getActiveClericDomains(character).flatMap((domain) => {
    const definition = getClericDomain(domain);
    const spell = definition.spells[level - 1];
    if (evilSpells.has(spell) && [character.alignment, deity?.alignment ?? ""].some((alignment) => alignment.includes("Good"))) return [];
    return [{ domain, spell, note: definition.spellNotes?.[level] }];
  });
}

export function getClericDomainWarnings(character: Character) {
  if (!character.classLevels.some((entry) => entry.classId === "cleric")) return [];
  const domains = character.clericDomains ?? [];
  const warnings: string[] = [];
  if (domains.length !== 2) warnings.push("Choose two different cleric domains. Existing characters are preserved until you make these choices.");
  for (const id of domains) {
    if (!clericDomainAllowed(character, id)) warnings.push(`${clericDomains[id].name} domain requires a matching cleric alignment. Its benefits are inactive.`);
  }
  for (const [level, selection] of Object.entries(character.clericDomainPreparation ?? {})) {
    if (!getClericDomainSpellOptions(character, Number(level)).some((option) =>
      option.domain === selection.domain && option.spell === selection.spell)) {
      warnings.push(`Saved level ${level} domain preparation (${selection.spell}) is unavailable. It is preserved but cannot be used; clear or replace it.`);
    }
  }
  return warnings;
}
