import type { AbilityName, Character } from "./domain";
import type { StoreItem } from "./data/itemTypes";

const families: { name: string; ability: AbilityName; slot: string; category: StoreItem["category"]; weight: string; bonuses: number[] }[] = [
  { name: "Belt of Giant Strength", ability: "str", slot: "Waist", category: "Waist", weight: "1 lb.", bonuses: [2, 4, 6] },
  { name: "Gauntlets of Ogre Power", ability: "str", slot: "Hands", category: "Hands", weight: "4 lb.", bonuses: [2] },
  { name: "Gloves of Dexterity", ability: "dex", slot: "Hands", category: "Hands", weight: "—", bonuses: [2, 4, 6] },
  { name: "Periapt of Wisdom", ability: "wis", slot: "Neck", category: "Neck", weight: "—", bonuses: [2, 4, 6] },
  { name: "Cloak of Charisma", ability: "cha", slot: "Shoulders", category: "Shoulders", weight: "2 lb.", bonuses: [2, 4, 6] },
  { name: "Amulet of Health", ability: "con", slot: "Neck", category: "Neck", weight: "—", bonuses: [2, 4, 6] },
  { name: "Headband of Intellect", ability: "int", slot: "Head", category: "Head", weight: "1 lb.", bonuses: [2, 4, 6] },
];

export const abilityEquipmentItems = families.flatMap((family) => family.bonuses.map((bonus) => ({
  name: `${family.name} +${bonus}`,
  category: family.category,
  weight: family.weight,
  price: bonus * bonus * 1000,
  ability: family.ability,
  slot: family.slot,
  bonus,
})));

export function getAbilityEquipmentBonus(character: Character, ability: AbilityName) {
  const sources = abilityEquipmentItems.filter((item) =>
    item.ability === ability &&
    (character.equipment[item.slot] ?? "").replace(/ \((Small|Medium|Large)\)$/, "") === item.name);
  const bonus = Math.max(0, ...sources.map((item) => item.bonus));
  let applied = false;
  const detail = sources.map((item) => {
    const active = !applied && item.bonus === bonus;
    if (active) applied = true;
    return `${item.name} (${item.slot}): +${item.bonus} enhancement${active ? "" : " (does not stack; highest bonus only)"}`;
  });
  return { bonus, detail };
}

export function getEffectiveAbilityScore(character: Character, ability: AbilityName) {
  return character.abilities[ability] + getAbilityEquipmentBonus(character, ability).bonus;
}

export function getConstitutionHitPointAdjustment(character: Character) {
  const baseModifier = Math.floor((character.abilities.con - 10) / 2);
  const effectiveModifier = Math.floor((getEffectiveAbilityScore(character, "con") - 10) / 2);
  const hitDice = character.classLevels.reduce((total, entry) => total + entry.level, 0);
  return (effectiveModifier - baseModifier) * hitDice;
}
