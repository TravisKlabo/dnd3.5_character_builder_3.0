import type { Character } from "./domain";

export const combatEffectModifierKeys = ["attack", "armorClass", "saves", "damage", "checks"] as const;
export type CombatEffectModifier = typeof combatEffectModifierKeys[number];
export type CombatEffectModifiers = Record<CombatEffectModifier, number>;

export interface CombatEffect {
  name: string;
  remainingRounds: number | null;
  modifiers: CombatEffectModifiers;
}

export function getCombatEffectModifier(character: Character, modifier: CombatEffectModifier) {
  return (character.combatEffects ?? []).reduce((total, effect) =>
    total + (effect.remainingRounds === null || effect.remainingRounds > 0
      ? effect.modifiers[modifier]
      : 0), 0);
}

export function getCombatEffectDetails(character: Character, modifier: CombatEffectModifier) {
  return (character.combatEffects ?? [])
    .filter((effect) => (effect.remainingRounds === null || effect.remainingRounds > 0) &&
      effect.modifiers[modifier] !== 0)
    .map((effect) => `${effect.name}: ${effect.modifiers[modifier] > 0 ? "+" : ""}${effect.modifiers[modifier]}`);
}

export function advanceCombatRound(character: Character) {
  const combatEffects = (character.combatEffects ?? []).flatMap((effect) => {
    if (effect.remainingRounds === null) return [effect];
    return effect.remainingRounds > 1
      ? [{ ...effect, remainingRounds: effect.remainingRounds - 1 }]
      : [];
  });
  return {
    ...character,
    combatRound: (character.combatRound ?? 1) + 1,
    combatEffects,
  };
}
