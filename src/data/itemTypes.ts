export const storeCategories = [
  "Weapons", "Armor", "Shields", "Ammunition", "Adventuring Gear", "Tools & Kits",
  "Consumables", "Potions, Scrolls & Wands", "Rings & Magic Items", "Head", "Neck",
  "Shoulders", "Arms", "Hands", "Rings", "Waist", "Feet", "Body & Wondrous Items",
  "Mounts & Vehicles", "Instruments",
] as const;

export type StoreCategory = (typeof storeCategories)[number];

export type StoreItem = {
  name: string;
  category: StoreCategory;
  price: number;
  weight: string;
  description?: string;
  custom?: boolean;
  ranged?: boolean;
  thrown?: boolean;
  rangedDamageAbility?: "none" | "strength" | "strength-penalty-only";
  material?: "cold-iron" | "alchemical-silver" | "adamantine";
  damage?: string;
  damageSmall?: string;
  damageMedium?: string;
  damageLarge?: string;
  offHandDamage?: string;
  offHandDamageSmall?: string;
  offHandDamageMedium?: string;
  offHandDamageLarge?: string;
  offHandDamageType?: string;
  offHandCritical?: string;
  mainEndLabel?: string;
  offHandEndLabel?: string;
  doubleWeapon?: boolean;
  damageType?: string;
  critical?: string;
  proficiency?: "Simple" | "Martial" | "Exotic";
  handedness?: "Light" | "One-handed" | "Two-handed" | "Ranged";
  finesse?: boolean;
  rangeIncrement?: string;
  rangeSmall?: string;
  rangeMedium?: string;
  rangeLarge?: string;
  reach?: string;
  specialProperties?: string;
  armorBonus?: number;
  maxDexterity?: number;
  armorCheckPenalty?: number;
  arcaneSpellFailure?: number;
  armorSpeed?: string;
  armorCategory?: "Light" | "Medium" | "Heavy";
  shieldBonus?: number;
  shieldType?: "Buckler" | "Light" | "Heavy" | "Tower" | "Custom";
  shieldCheckPenalty?: number;
  shieldSpellFailure?: number;
  towerShieldProficiency?: boolean;
};
