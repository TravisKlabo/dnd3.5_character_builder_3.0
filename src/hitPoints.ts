import { type Character } from "./domain";
import { getConstitutionHitPointAdjustment } from "./abilityEquipment";

export type HitPointAction = "damage" | "heal" | "nonlethal" | "recoverNonlethal" | "temporary";

export function getCurrentHitPoints(character: Character) {
  return getStoredCurrentHitPoints(character) + getConstitutionHitPointAdjustment(character);
}

export function getStoredCurrentHitPoints(character: Character) {
  return character.currentHitPoints ?? character.hitPoints;
}

export function getMaximumHitPoints(character: Character) {
  return character.hitPoints + getConstitutionHitPointAdjustment(character);
}

function storeEffectiveCurrentHitPoints(character: Character, effective: number) {
  return effective - getConstitutionHitPointAdjustment(character);
}

export function applyHitPointAction(character: Character, action: HitPointAction, amount: number): Character {
  if (!Number.isSafeInteger(amount) || amount < 0 || (amount === 0 && action !== "temporary")) {
    throw new Error("Enter a positive whole number (or zero to clear temporary HP).");
  }
  const current = getCurrentHitPoints(character);
  const temporary = character.temporaryHitPoints ?? 0;
  const nonlethal = character.nonlethalDamage ?? 0;
  let changes: Partial<Character>;
  switch (action) {
    case "damage": {
      const absorbed = Math.min(temporary, amount);
      changes = { temporaryHitPoints: temporary - absorbed, currentHitPoints: storeEffectiveCurrentHitPoints(character, current - (amount - absorbed)) };
      break;
    }
    case "heal":
      if (current <= -10) throw new Error("Healing cannot revive a dead character. Resolve revival with the DM before changing HP.");
      changes = { currentHitPoints: storeEffectiveCurrentHitPoints(character, Math.min(getMaximumHitPoints(character), current + amount)), nonlethalDamage: Math.max(0, nonlethal - amount) };
      break;
    case "nonlethal":
      changes = { nonlethalDamage: nonlethal + amount };
      break;
    case "recoverNonlethal":
      changes = { nonlethalDamage: Math.max(0, nonlethal - amount) };
      break;
    case "temporary":
      changes = { temporaryHitPoints: amount };
      break;
  }
  if (Object.values(changes).some((value) => !Number.isSafeInteger(value))) {
    throw new Error("The resulting HP value is outside the supported whole-number range.");
  }
  return { ...character, ...changes };
}

export function getHitPointStatus(character: Character) {
  const current = getCurrentHitPoints(character);
  const nonlethal = character.nonlethalDamage ?? 0;
  if (current <= -10) return "Dead";
  if (current < 0) return "Dying / unconscious unless stabilized or an ability applies";
  if (nonlethal > current) return "Unconscious (nonlethal)";
  if (current === 0) return "Disabled";
  if (nonlethal > 0 && nonlethal === current) return "Staggered (nonlethal)";
  return "Conscious";
}
