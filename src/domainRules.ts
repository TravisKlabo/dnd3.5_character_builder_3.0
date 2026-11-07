import { deityDefinitions, type Character, type DeityDefinition, type RulesetId } from "./domain";
import { clericDomainIds, isDragonlanceDomainId, type ClericDomainId } from "./data/clericDomainIds";
import { clericDomainRuleMetadata } from "./data/clericDomainRuleMetadata";
import { clericDomainSpellLists } from "./data/clericDomainSpellLists";
import { getEffectiveAbilityScore } from "./abilityEquipment";

const domainAlignments: Partial<Record<ClericDomainId, string>> = {
  chaos: "Chaotic", evil: "Evil", good: "Good", law: "Lawful",
};

export function isDeityAvailableForRuleset(deity: DeityDefinition | undefined, ruleset: RulesetId) {
  if (!deity) return true;
  return deity.source === (ruleset === "core-35-srd" ? "core-35-srd" : "dragonlance-user-pack");
}

export function clericDomainAllowed(character: Character, id: ClericDomainId) {
  const alignment = domainAlignments[id];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  const definition = clericDomainRuleMetadata[id];
  if (definition.source === "dragonlance-user-pack" && character.ruleset === "core-35-srd") return false;
  if (definition.mysticOnly || (definition.mysticOnlyInDragonlance && character.ruleset !== "core-35-srd")) return false;
  if (definition.source === "dragonlance-user-pack" &&
    !definition.clericDeities?.includes(character.deity ?? "")) return false;
  return (!alignment || character.alignment.includes(alignment)) &&
    isDeityAvailableForRuleset(deity, character.ruleset) &&
    (!deity?.clericDomains || deity.clericDomains.includes(id)) &&
    (!deity?.clericAlignments || deity.clericAlignments.includes(character.alignment));
}

export function getActiveClericDomains(character: Character) {
  if (!character.classLevels.some((entry) => !("prestigeClassId" in entry) && entry.classId === "cleric")) return [];
  return (character.clericDomains ?? []).filter((id) => clericDomainAllowed(character, id));
}

export function isMysticDomainAllowed(character: Character, id: ClericDomainId) {
  if (id === "magic") return false;
  if (character.ruleset === "core-35-srd" && isDragonlanceDomainId(id)) return false;
  const alignment = domainAlignments[id];
  return !alignment || character.alignment.includes(alignment);
}

export function getMysticDomainOptions(character: Character) {
  return clericDomainIds
    .filter((id) => isMysticDomainAllowed(character, id))
    .map((id) => ({ id, name: clericDomainRuleMetadata[id].name }));
}

export function getActiveMysticDomain(character: Character) {
  if (
    character.ruleset === "core-35-srd" ||
    !character.classLevels.some((entry) => !("prestigeClassId" in entry) && entry.classId === "mystic") ||
    !character.mysticDomain ||
    !isMysticDomainAllowed(character, character.mysticDomain)
  ) return undefined;
  return character.mysticDomain;
}

export function getMysticDomainSpell(character: Character, level: number) {
  const domain = getActiveMysticDomain(character);
  if (!domain || !Number.isInteger(level) || level < 1 || level > 9) return undefined;
  return clericDomainSpellLists[domain][level - 1];
}

export function getMysticDomainSpellNote(character: Character, level: number) {
  const domain = getActiveMysticDomain(character);
  if (!domain || !Number.isInteger(level) || level < 1 || level > 9) return undefined;
  return clericDomainRuleMetadata[domain].spellNotes?.[level];
}

export function getMysticDomainWarnings(character: Character) {
  if (
    character.ruleset === "core-35-srd" ||
    !character.classLevels.some((entry) => !("prestigeClassId" in entry) && entry.classId === "mystic")
  ) return [];
  if (!character.mysticDomain) return ["Choose one Mystic domain; its bonus spells are inactive until selected."];
  if (!isMysticDomainAllowed(character, character.mysticDomain)) {
    return [`${clericDomainRuleMetadata[character.mysticDomain].name} is not a legal Mystic domain for this alignment.`];
  }
  return [];
}

export function getWarDomainWeapon(character: Character) {
  if (!getActiveClericDomains(character).includes("war")) return undefined;
  return deityDefinitions.find((deity) => deity.id === character.deity)
    ?.warDomainFavoredWeapon;
}

export function isClericDomainClassSkill(character: Character, skill: string) {
  return getActiveClericDomains(character).some((id) => {
    const skills = clericDomainRuleMetadata[id].classSkills ?? [];
    return skills.includes(skill) || (skills.includes("Knowledge (*)") && skill.startsWith("Knowledge ("));
  });
}

export function getClericDomainSlotCount(character: Character, level: number) {
  const clericLevel = character.classLevels.find((entry) =>
    !("prestigeClassId" in entry) && entry.classId === "cleric",
  )?.level ?? 0;
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  if (!isDeityAvailableForRuleset(deity, character.ruleset) || deity?.clericDomains?.length === 0) return 0;
  return Number(Number.isInteger(level) && level >= 1 && level <= 9 &&
    clericLevel >= level * 2 - 1 && getEffectiveAbilityScore(character, "wis") >= 10 + level);
}

const evilSpells = new Set(["Death Knell", "Animate Dead", "Create Undead", "Create Greater Undead"]);
export function getClericDomainSpellOptions(character: Character, level: number) {
  if (!getClericDomainSlotCount(character, level)) return [];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  return getActiveClericDomains(character).flatMap((domain) => {
    const definition = clericDomainRuleMetadata[domain];
    const spell = clericDomainSpellLists[domain][level - 1];
    if (evilSpells.has(spell) && [character.alignment, deity?.alignment ?? ""].some((alignment) => alignment.includes("Good"))) return [];
    return [{ domain, spell, note: definition.spellNotes?.[level] }];
  });
}

export function getClericDomainWarnings(character: Character) {
  if (!character.classLevels.some((entry) => !("prestigeClassId" in entry) && entry.classId === "cleric")) return [];
  const domains = character.clericDomains ?? [];
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  const deityAvailable = isDeityAvailableForRuleset(deity, character.ruleset);
  const warnings: string[] = [];
  if (deity && !deityAvailable) {
    const rulesetName = character.ruleset === "core-35-srd" ? "Core 3.5 SRD" : "Dragonlance";
    warnings.push(`${deity.name} is not part of the ${rulesetName} ruleset; its cleric domain benefits are inactive.`);
  }
  if (deityAvailable && deity?.clericAlignments &&
    !deity.clericAlignments.includes(character.alignment)) {
    warnings.push(`${deity.name} does not permit Clerics of ${character.alignment} alignment; its cleric domain benefits are inactive.`);
  }
  if (deityAvailable && deity?.clericDomains?.length === 0) {
    warnings.push(`${deity.name} grants no cleric domains in this source; cleric domain features are unavailable.`);
  } else if (domains.length !== 2) {
    warnings.push("Choose two different cleric domains. Existing characters are preserved until you make these choices.");
  }
  for (const id of domains) {
    const definition = clericDomainRuleMetadata[id];
    const alignment = domainAlignments[id];
    if (definition.source === "dragonlance-user-pack" && character.ruleset === "core-35-srd") {
      warnings.push(`${definition.name} is a Dragonlance domain; its cleric benefits are inactive in the Core 3.5 SRD ruleset.`);
    } else if (definition.mysticOnly ||
      (definition.mysticOnlyInDragonlance && character.ruleset !== "core-35-srd")) {
      warnings.push(`${definition.name} is available only to Mystics in Dragonlance; its cleric benefits are inactive.`);
    } else if (definition.source === "dragonlance-user-pack" &&
      !definition.clericDeities?.includes(character.deity ?? "")) {
      warnings.push(`${definition.name} is not granted to this cleric by the selected deity. Its benefits are inactive.`);
    } else if (alignment && !character.alignment.includes(alignment)) {
      warnings.push(`${definition.name} domain requires a matching cleric alignment. Its benefits are inactive.`);
    } else if (deityAvailable && deity?.clericDomains && !deity.clericDomains.includes(id)) {
      warnings.push(`${definition.name} domain is not granted by ${deity.name}. Its benefits are inactive.`);
    }
  }
  if (
    getActiveClericDomains(character).includes("war") &&
    !getWarDomainWeapon(character)
  ) {
    warnings.push("War favored weapon unmapped; resolve proficiency and Weapon Focus manually.");
  }
  for (const [level, selection] of Object.entries(character.clericDomainPreparation ?? {})) {
    if (!getClericDomainSpellOptions(character, Number(level)).some((option) =>
      option.domain === selection.domain && option.spell === selection.spell)) {
      warnings.push(`Saved level ${level} domain spell is no longer available; choose a legal spell or clear the saved selection.`);
    }
  }
  const spentLevels = new Set(character.clericDomainExpended ?? []);
  for (let level = 1; level <= 9; level += 1) {
    if (spentLevels.has(level) && !getClericDomainSlotCount(character, level)) {
      warnings.push(`Saved expended level ${level} domain slot is no longer available; clear the spent marker.`);
    }
  }
  return warnings;
}
