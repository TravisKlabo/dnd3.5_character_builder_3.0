import { customStoreItemsStorageKey, loadCustomStoreItems } from "../storage";
import { parseCustomItems } from "../validation";
import { useSyncExternalStore } from "react";
import { abilityEquipmentItems } from "../abilityEquipment";

import { type StoreCategory, type StoreItem } from "./itemTypes";
export type { StoreCategory, StoreItem } from "./itemTypes";

export const storeItems: StoreItem[] = [
  { name: "Longsword", category: "Weapons", price: 15, weight: "4 lb." },
  { name: "Rapier", category: "Weapons", price: 20, weight: "2 lb." },
  { name: "Dagger", category: "Weapons", price: 2, weight: "1 lb." },
  { name: "Greatsword", category: "Weapons", price: 50, weight: "8 lb." },
  { name: "Shortbow", category: "Weapons", price: 30, weight: "2 lb." },
  { name: "Longbow", category: "Weapons", price: 75, weight: "3 lb." },
  {
    name: "Chain Shirt",
    category: "Armor",
    price: 100,
    weight: "25 lb.",
  },
  {
    name: "Breastplate",
    category: "Armor",
    price: 200,
    weight: "30 lb.",
  },
  {
    name: "Heavy Steel Shield",
    category: "Shields",
    price: 20,
    weight: "15 lb.",
  },
  {
    name: "Tower Shield",
    category: "Shields",
    price: 30,
    weight: "45 lb.",
  },
  { name: "Arrows (20)", category: "Ammunition", price: 1, weight: "3 lb." },
  {
    name: "Crossbow Bolts (10)",
    category: "Ammunition",
    price: 1,
    weight: "1 lb.",
  },
  { name: "Backpack", category: "Adventuring Gear", price: 2, weight: "2 lb." },
  {
    name: "Rope (50 ft.)",
    category: "Adventuring Gear",
    price: 1,
    weight: "10 lb.",
  },
  { name: "Lantern", category: "Adventuring Gear", price: 7, weight: "2 lb." },
  { name: "Tent", category: "Adventuring Gear", price: 10, weight: "20 lb." },
  {
    name: "Thieves' Tools",
    category: "Tools & Kits",
    price: 30,
    weight: "1 lb.",
  },
  {
    name: "Healer's Kit",
    category: "Tools & Kits",
    price: 50,
    weight: "1 lb.",
  },
  { name: "Flint and Steel", category: "Tools & Kits", price: 1, weight: "—" },
  {
    name: "Rations (5 days)",
    category: "Consumables",
    price: 2.5,
    weight: "5 lb.",
  },
  { name: "Healing Potion", category: "Consumables", price: 50, weight: "—" },
  { name: "Antitoxin", category: "Consumables", price: 50, weight: "—" },
  {
    name: "Ring of Protection +1",
    category: "Rings",
    price: 2000,
    weight: "—",
  },
  {
    name: "Cloak of Resistance +1",
    category: "Rings & Magic Items",
    price: 1000,
    weight: "1 lb.",
  },
  {
    name: "Bag of Holding",
    category: "Rings & Magic Items",
    price: 2500,
    weight: "15 lb.",
  },
  {
    name: "Headband of Intellect +2",
    category: "Rings & Magic Items",
    price: 4000,
    weight: "1 lb.",
  },
  {
    name: "Light Horse",
    category: "Mounts & Vehicles",
    price: 75,
    weight: "—",
  },
  {
    name: "Riding Saddle",
    category: "Mounts & Vehicles",
    price: 10,
    weight: "25 lb.",
  },
];

storeItems.push(
  { name: "Club", category: "Weapons", price: 0, weight: "3 lb." },
  { name: "Quarterstaff", category: "Weapons", price: 0, weight: "4 lb.", doubleWeapon: true },
  { name: "Short Sword", category: "Weapons", price: 10, weight: "2 lb." },
  { name: "Battleaxe", category: "Weapons", price: 10, weight: "6 lb." },
  { name: "Warhammer", category: "Weapons", price: 12, weight: "5 lb." },
  { name: "Heavy Mace", category: "Weapons", price: 12, weight: "8 lb." },
  { name: "Dwarven Waraxe", category: "Weapons", price: 30, weight: "8 lb." },
  { name: "Dwarven Urgrosh", category: "Weapons", price: 50, weight: "12 lb.", doubleWeapon: true },
  { name: "Gnome Hooked Hammer", category: "Weapons", price: 20, weight: "6 lb.", doubleWeapon: true },
  { name: "Orc Double Axe", category: "Weapons", price: 60, weight: "15 lb.", doubleWeapon: true },
  { name: "Dire Flail", category: "Weapons", price: 90, weight: "10 lb.", doubleWeapon: true },
  { name: "Two-Bladed Sword", category: "Weapons", price: 100, weight: "10 lb.", doubleWeapon: true },
  { name: "Greataxe", category: "Weapons", price: 20, weight: "12 lb." },
  { name: "Glaive", category: "Weapons", price: 8, weight: "10 lb." },
  { name: "Halberd", category: "Weapons", price: 10, weight: "12 lb." },
  { name: "Guisarme", category: "Weapons", price: 9, weight: "12 lb." },
  { name: "Lance", category: "Weapons", price: 10, weight: "10 lb." },
  { name: "Spear", category: "Weapons", price: 2, weight: "6 lb." },
  { name: "Heavy Crossbow", category: "Weapons", price: 50, weight: "8 lb." },
  { name: "Light Crossbow", category: "Weapons", price: 35, weight: "4 lb." },
  { name: "Sling", category: "Weapons", price: 0, weight: "0 lb." },
  { name: "Net", category: "Weapons", price: 20, weight: "6 lb." },
  { name: "Light Mace", category: "Weapons", price: 5, weight: "4 lb." },
  { name: "Morningstar", category: "Weapons", price: 8, weight: "6 lb." },
  { name: "Flail", category: "Weapons", price: 8, weight: "5 lb." },
  { name: "Sickle", category: "Weapons", price: 6, weight: "2 lb." },
  { name: "Javelin", category: "Weapons", price: 1, weight: "2 lb." },
  { name: "Short Spear", category: "Weapons", price: 1, weight: "3 lb." },
  { name: "Handaxe", category: "Weapons", price: 6, weight: "3 lb." },
  { name: "Kukri", category: "Weapons", price: 8, weight: "2 lb." },
  { name: "Scimitar", category: "Weapons", price: 15, weight: "4 lb." },
  { name: "Trident", category: "Weapons", price: 15, weight: "4 lb." },
  { name: "Hand Crossbow", category: "Weapons", price: 100, weight: "2 lb." },
  { name: "Repeating Heavy Crossbow", category: "Weapons", price: 400, weight: "12 lb." },
  { name: "Repeating Light Crossbow", category: "Weapons", price: 250, weight: "6 lb." },
  { name: "Composite Shortbow", category: "Weapons", price: 75, weight: "2 lb." },
  { name: "Composite Longbow", category: "Weapons", price: 100, weight: "3 lb." },
  { name: "Mithral Chain Shirt", category: "Armor", price: 1100, weight: "12.5 lb." },
  { name: "Mithral Breastplate", category: "Armor", price: 4200, weight: "15 lb." },
  { name: "Mithral Full Plate", category: "Armor", price: 10500, weight: "25 lb." },
  { name: "Masterwork Longsword", category: "Weapons", price: 315, weight: "4 lb." },
  { name: "Masterwork Rapier", category: "Weapons", price: 320, weight: "2 lb." },
  { name: "Masterwork Dagger", category: "Weapons", price: 302, weight: "1 lb." },
  { name: "Masterwork Greatsword", category: "Weapons", price: 350, weight: "8 lb." },
  { name: "Masterwork Shortbow", category: "Weapons", price: 330, weight: "2 lb." },
  { name: "Masterwork Longbow", category: "Weapons", price: 375, weight: "3 lb." },
  { name: "Masterwork Chain Shirt", category: "Armor", price: 250, weight: "25 lb." },
  { name: "Masterwork Breastplate", category: "Armor", price: 350, weight: "30 lb." },
  { name: "Masterwork Full Plate", category: "Armor", price: 1650, weight: "50 lb." },
  { name: "Masterwork Heavy Steel Shield", category: "Shields", price: 170, weight: "15 lb." },
  { name: "Cold Iron Longsword", category: "Weapons", price: 315, weight: "4 lb.", material: "cold-iron" },
  { name: "Silver Dagger", category: "Weapons", price: 22, weight: "1 lb.", material: "alchemical-silver" },
  { name: "Mithral Longsword", category: "Weapons", price: 1015, weight: "4 lb." },
  { name: "Ring of Feather Falling", category: "Rings", price: 2200, weight: "—", description: "You always fall as though from 60 feet or less." },
  { name: "Ring of Acid Resistance", category: "Rings", price: 12000, weight: "—", description: "The wearer gains resistance 10 against acid." },
  { name: "Ring of Chameleon", category: "Rings", price: 12700, weight: "—", description: "The wearer gains a +10 competence bonus on Hide checks." },
  { name: "Ring of Swimming", category: "Rings", price: 2500, weight: "—", description: "+5 competence bonus on Swim checks." },
  { name: "Ring of Sustenance", category: "Rings", price: 2500, weight: "—", description: "Requires only 2 hours of sleep and sustains the wearer without food or water." },
  { name: "Ring of Climbing", category: "Rings", price: 2500, weight: "—", description: "+5 competence bonus on Climb checks." },
  { name: "Ring of Jumping", category: "Rings", price: 2500, weight: "—", description: "+5 competence bonus on Jump checks." },
  { name: "Ring of Mind Shielding", category: "Rings", price: 8000, weight: "—", description: "Protects against mind-reading and alignment detection." },
  { name: "Ring of Invisibility", category: "Rings", price: 20000, weight: "—", description: "Allows the wearer to become invisible on command." },
  { name: "Ring of Blinking", category: "Rings", price: 27000, weight: "—", description: "The wearer blinks in and out of the Material Plane." },
  { name: "Ring of Evasion", category: "Rings", price: 25000, weight: "—", description: "A successful Reflex save negates damage from an applicable attack." },
  { name: "Ring of Freedom of Movement", category: "Rings", price: 40000, weight: "—", description: "The wearer is continually affected by freedom of movement." },
  { name: "Ring of Spell Storing", category: "Rings", price: 50000, weight: "—", description: "Stores up to five levels of spells for later casting." },
  { name: "Ring of Regeneration", category: "Rings", price: 90000, weight: "—", description: "The wearer regains hit points over time and reattaches severed limbs." },
  { name: "Ring of Protection +4", category: "Rings", price: 32000, weight: "—", description: "+4 deflection bonus to AC." },
  { name: "Ring of Protection +5", category: "Rings", price: 50000, weight: "—", description: "+5 deflection bonus to AC." },
  { name: "Ring of Shooting Stars", category: "Rings", price: 50000, weight: "—", description: "Provides several fire-based spell-like effects." },
  { name: "Ring of X-Ray Vision", category: "Rings", price: 25000, weight: "—", description: "Allows the wearer to see through solid matter for a limited time." },
  { name: "Ring of Spell Turning", category: "Rings", price: 100000, weight: "—", description: "Turns spells and spell-like abilities back upon their casters." },
  { name: "Ring of Greater Energy Resistance", category: "Rings", price: 66000, weight: "—", description: "The wearer gains resistance 30 against one energy type." },
  { name: "Ring of Wizardry I", category: "Rings", price: 20000, weight: "—", description: "Doubles 1st-level arcane spells per day." },
  { name: "Ring of Wizardry II", category: "Rings", price: 40000, weight: "—", description: "Doubles 2nd-level arcane spells per day." },
  { name: "Ring of Wizardry III", category: "Rings", price: 70000, weight: "—", description: "Doubles 3rd-level arcane spells per day." },
  { name: "Ring of Wizardry IV", category: "Rings", price: 100000, weight: "—", description: "Doubles 4th-level arcane spells per day." },
  { name: "Ring of Djinni Summoning", category: "Rings", price: 125000, weight: "—", description: "Summons a djinni from the ring once per day." },
);

export const armorBonuses: Record<string, number> = {
  "Padded Armor": 1,
  "Leather Armor": 2,
  "Studded Leather": 3,
  "Hide Armor": 3,
  "Scale Mail": 4,
  Chainmail: 5,
  "Splint Mail": 6,
  "Half-Plate": 7,
  "Full Plate": 8,
  "Chain Shirt": 4,
  Breastplate: 5,
  "Mithral Chain Shirt": 4,
  "Mithral Breastplate": 5,
  "Mithral Full Plate": 8,
};

export const armorMaximumDexterity: Record<string, number> = {
  "Padded Armor": 8,
  "Leather Armor": 6,
  "Studded Leather": 5,
  "Hide Armor": 4,
  "Scale Mail": 3,
  Chainmail: 2,
  "Splint Mail": 0,
  "Half-Plate": 0,
  "Full Plate": 1,
  "Chain Shirt": 4,
  Breastplate: 3,
  "Mithral Chain Shirt": 6,
  "Mithral Breastplate": 5,
  "Mithral Full Plate": 3,
};

export const armorCheckPenalties: Record<string, number> = {
  "Padded Armor": 0,
  "Leather Armor": 0,
  "Studded Leather": -1,
  "Hide Armor": -3,
  "Scale Mail": -4,
  Chainmail: -5,
  "Splint Mail": -6,
  "Half-Plate": -7,
  "Full Plate": -6,
  "Chain Shirt": -2,
  Breastplate: -4,
  "Mithral Chain Shirt": 0,
  "Mithral Breastplate": -1,
  "Mithral Full Plate": -3,
};

export const armorClasses: Record<string, "Light" | "Medium" | "Heavy"> = {
  "Padded Armor": "Light",
  "Leather Armor": "Light",
  "Studded Leather": "Light",
  "Chain Shirt": "Light",
  "Mithral Chain Shirt": "Light",
  "Hide Armor": "Medium",
  "Scale Mail": "Medium",
  Chainmail: "Medium",
  Breastplate: "Medium",
  "Mithral Breastplate": "Medium",
  "Splint Mail": "Heavy",
  "Half-Plate": "Heavy",
  "Full Plate": "Heavy",
  "Mithral Full Plate": "Heavy",
};

export const shieldBonuses: Record<string, number> = {
  Buckler: 1,
  "Light Wooden Shield": 1,
  "Light Steel Shield": 1,
  "Heavy Wooden Shield": 2,
  "Heavy Steel Shield": 2,
  "Tower Shield": 4,
};

export const shieldCheckPenalties: Record<string, number> = {
  Buckler: -1,
  "Light Wooden Shield": -1,
  "Light Steel Shield": -1,
  "Heavy Wooden Shield": -2,
  "Heavy Steel Shield": -2,
  "Tower Shield": -10,
};

if (typeof window !== "undefined") {
  storeItems.push(...loadCustomStoreItems());
}

export const weaponDamageBySize: Record<string, { smaller: string; larger: string }> = {
  "1d2": { smaller: "1", larger: "1d3" },
  "1d3": { smaller: "1d2", larger: "1d4" },
  "1d4": { smaller: "1d3", larger: "1d6" },
  "1d6": { smaller: "1d4", larger: "1d8" },
  "1d8": { smaller: "1d6", larger: "2d6" },
  "1d10": { smaller: "1d8", larger: "2d8" },
  "1d12": { smaller: "1d10", larger: "3d6" },
  "2d4": { smaller: "1d4", larger: "2d6" },
  "2d6": { smaller: "1d8", larger: "3d6" },
};

export type WeaponProfile = {
  damage: string;
  crit: string;
  offHandDamage?: string;
  offHandCrit?: string;
  offHandDamageType?: string;
  mainEndLabel?: string;
  offHandEndLabel?: string;
};

export const weaponProfiles: Record<string, WeaponProfile> = {
  Club: { damage: "1d6", crit: "x2" },
  "Short Sword": { damage: "1d6", crit: "19–20/x2" },
  "Heavy Mace": { damage: "1d8", crit: "x2" },
  "Dwarven Waraxe": { damage: "1d10", crit: "x3" },
  Longsword: { damage: "1d8", crit: "19–20/x2" },
  Dagger: { damage: "1d4", crit: "19–20/x2" },
  Handaxe: { damage: "1d6", crit: "x3" },
  Greatsword: { damage: "2d6", crit: "19–20/x2" },
  Shortbow: { damage: "1d6", crit: "x3" },
  Longbow: { damage: "1d8", crit: "x3" },
  Rapier: { damage: "1d6", crit: "18–20/x2" },
  Javelin: { damage: "1d6", crit: "x2" },
  Trident: { damage: "1d8", crit: "x2" },
  Net: { damage: "—", crit: "—" },
  Whip: { damage: "1d3", crit: "x2" },
  Kukri: { damage: "1d4", crit: "18–20/x2" },
  Kama: { damage: "1d6", crit: "x2" },
  Sickle: { damage: "1d6", crit: "x2" },
  Scimitar: { damage: "1d6", crit: "18–20/x2" },
  Battleaxe: { damage: "1d8", crit: "x3" },
  Greataxe: { damage: "1d12", crit: "x3" },
  Warhammer: { damage: "1d8", crit: "x3" },
  Mace: { damage: "1d8", crit: "x2" },
  "Light Mace": { damage: "1d6", crit: "x2" },
  "Light Hammer": { damage: "1d4", crit: "x2" },
  Spear: { damage: "1d8", crit: "x3" },
  Glaive: { damage: "1d10", crit: "x3" },
  Halberd: { damage: "1d10", crit: "x3" },
  Guisarme: { damage: "2d4", crit: "x3" },
  "Spiked Chain": { damage: "2d4", crit: "x2" },
  Falchion: { damage: "2d4", crit: "18–20/x2" },
  Lance: { damage: "1d8", crit: "x3" },
  Morningstar: { damage: "1d8", crit: "x2" },
  Quarterstaff: { damage: "1d6", crit: "x2" },
  "Dwarven Urgrosh": {
    damage: "1d8", crit: "x3", offHandDamage: "1d6", offHandCrit: "x3",
    offHandDamageType: "piercing", mainEndLabel: "axe head", offHandEndLabel: "spear point",
  },
  "Gnome Hooked Hammer": {
    damage: "1d8", crit: "x3", offHandDamage: "1d6", offHandCrit: "x4",
    offHandDamageType: "piercing", mainEndLabel: "hammer head", offHandEndLabel: "hooked head",
  },
  "Orc Double Axe": { damage: "1d8", crit: "x3" },
  "Dire Flail": { damage: "1d8", crit: "x2" },
  "Two-Bladed Sword": { damage: "1d8", crit: "19–20/x2" },
  "Light Crossbow": { damage: "1d8", crit: "19–20/x2" },
  "Heavy Crossbow": { damage: "1d10", crit: "19–20/x2" },
  "Repeating Crossbow": { damage: "1d8", crit: "19–20/x2" },
  "Hand Crossbow": { damage: "1d4", crit: "19–20/x2" },
  "Repeating Heavy Crossbow": { damage: "1d10", crit: "19–20/x2" },
  "Repeating Light Crossbow": { damage: "1d8", crit: "19–20/x2" },
  "Composite Shortbow": { damage: "1d6", crit: "x3" },
  "Composite Longbow": { damage: "1d8", crit: "x3" },
  Sap: { damage: "1d6", crit: "x2" },
  Nunchaku: { damage: "1d6", crit: "x2" },
  Sai: { damage: "1d4", crit: "x2" },
  Siangham: { damage: "1d6", crit: "x2" },
  Dart: { damage: "1d4", crit: "x2" },
  Shuriken: { damage: "1d2", crit: "x2" },
  Sling: { damage: "1d4", crit: "x2" },
};

export const weaponDamageTypes: Record<string, string> = {
  Longsword: "slashing",
  Dagger: "piercing or slashing",
  Handaxe: "slashing",
  Greatsword: "slashing",
  Shortbow: "piercing",
  Longbow: "piercing",
  Rapier: "piercing",
  Javelin: "piercing",
  Trident: "piercing",
  Net: "—",
  Whip: "slashing",
  Kukri: "slashing",
  Kama: "slashing",
  Sickle: "slashing",
  Scimitar: "slashing",
  Battleaxe: "slashing",
  Greataxe: "slashing",
  Warhammer: "bludgeoning",
  Mace: "bludgeoning",
  "Light Mace": "bludgeoning",
  "Light Hammer": "bludgeoning",
  Spear: "piercing",
  Glaive: "slashing",
  Halberd: "slashing",
  Guisarme: "slashing",
  "Spiked Chain": "piercing",
  Falchion: "slashing",
  Lance: "piercing",
  Morningstar: "bludgeoning or piercing",
  Quarterstaff: "bludgeoning",
  "Dwarven Urgrosh": "slashing",
  "Gnome Hooked Hammer": "bludgeoning",
  "Orc Double Axe": "slashing",
  "Dire Flail": "bludgeoning",
  "Two-Bladed Sword": "slashing",
  "Light Crossbow": "piercing",
  "Heavy Crossbow": "piercing",
  "Repeating Crossbow": "piercing",
  "Hand Crossbow": "piercing",
  Sap: "bludgeoning",
  Nunchaku: "bludgeoning",
  Sai: "piercing",
  Siangham: "piercing",
  Dart: "piercing",
  Shuriken: "piercing",
  Sling: "bludgeoning",
};

export const armorSpellFailure: Record<string, number> = {
  "Padded Armor": 5, "Leather Armor": 10, "Studded Leather": 15,
  "Chain Shirt": 20, "Hide Armor": 20, "Scale Mail": 25, Chainmail: 30,
  Breastplate: 25, "Splint Mail": 40, "Half-Plate": 40, "Full Plate": 35,
  "Mithral Chain Shirt": 10, "Mithral Breastplate": 15, "Mithral Full Plate": 25,
};

export const shieldSpellFailure: Record<string, number> = {
  Buckler: 5, "Light Wooden Shield": 5, "Light Steel Shield": 5,
  "Heavy Wooden Shield": 15, "Heavy Steel Shield": 15, "Tower Shield": 50,
};

export const weaponRangeIncrements: Record<string, number> = {
  Club: 10, Dagger: 10, "Throwing Axe": 10, "Light Hammer": 20,
  Spear: 20, "Short Spear": 20, Shortspear: 20, Trident: 10,
  Dart: 20, Javelin: 30, Shuriken: 10, Net: 10, Bolas: 10,
  Sling: 50, Shortbow: 60, "Composite Shortbow": 70,
  Longbow: 100, "Composite Longbow": 110,
  "Light Crossbow": 80, "Heavy Crossbow": 120, "Hand Crossbow": 30,
  "Repeating Crossbow": 80, "Repeating Light Crossbow": 80, "Repeating Heavy Crossbow": 120,
};

export const reachWeaponNames = new Set([
  "Glaive", "Guisarme", "Lance", "Longspear", "Long Spear", "Ranseur", "Spiked Chain",
]);

export const rangedWeaponNames = new Set([
  "Shortbow",
  "Longbow",
  "Light Crossbow",
  "Heavy Crossbow",
  "Repeating Crossbow",
  "Hand Crossbow",
  "Sling",
  "Dart",
  "Javelin",
  "Shuriken",
]);

export const lightOffHandWeaponNames = new Set([
  "Short Sword",
  "Unarmed Strike",
  "Dagger",
  "Handaxe",
  "Kukri",
  "Kama",
  "Sickle",
  "Light Mace",
  "Light Hammer",
  "Sap",
  "Nunchaku",
  "Sai",
  "Siangham",
  "Shuriken",
  "Dart",
]);

export const twoHandedWeaponNames = new Set([
  "Quarterstaff",
  "Dwarven Urgrosh",
  "Gnome Hooked Hammer",
  "Orc Double Axe",
  "Dire Flail",
  "Two-Bladed Sword",
  "Spear",
  "Heavy Flail",
  "Greatsword",
  "Greataxe",
  "Glaive",
  "Halberd",
  "Guisarme",
  "Longspear",
  "Long Spear",
  "Ranseur",
  "Spiked Chain",
  "Falchion",
  "Lance",
  "Shortbow",
  "Longbow",
  "Composite Shortbow",
  "Composite Longbow",
  "Light Crossbow",
  "Heavy Crossbow",
  "Repeating Crossbow",
  "Repeating Light Crossbow",
  "Repeating Heavy Crossbow",
]);

export const simpleWeaponNames = new Set([
  "Club",
  "Dagger",
  "Light Mace",
  "Heavy Mace",
  "Mace",
  "Light Hammer",
  "Morningstar",
  "Quarterstaff",
  "Sickle",
  "Short Spear",
  "Shortspear",
  "Spear",
  "Light Crossbow",
  "Heavy Crossbow",
  "Sling",
  "Javelin",
  "Dart",
  "Unarmed Strike",
]);

export const martialWeaponNames = new Set([
  "Battleaxe",
  "Flail",
  "Heavy Flail",
  "Short Sword",
  "Longsword",
  "Rapier",
  "Greatsword",
  "Shortbow",
  "Composite Shortbow",
  "Longbow",
  "Composite Longbow",
  "Handaxe",
  "Trident",
  "Kukri",
  "Glaive",
  "Halberd",
  "Guisarme",
  "Falchion",
  "Lance",
  "Scimitar",
  "Warhammer",
]);

export const martialWeaponClasses = new Set(["barbarian", "fighter", "paladin", "ranger"]);

storeItems.push(
  ...[
    "Handaxe",
    "Javelin",
    "Trident",
    "Net",
    "Whip",
    "Kukri",
    "Kama",
    "Sickle",
    "Glaive",
    "Halberd",
    "Guisarme",
    "Spiked Chain",
    "Falchion",
    "Lance",
    "Morningstar",
    "Light Mace",
    "Light Hammer",
    "Shuriken",
    "Repeating Crossbow",
    "Hand Crossbow",
    "Sap",
    "Nunchaku",
    "Sai",
    "Siangham",
    "Dart",
  ].map((name) => ({
    name,
    category: "Weapons" as StoreCategory,
    price: 1,
    weight: "varies",
  })),
  ...[
    "Padded Armor",
    "Leather Armor",
    "Studded Leather",
    "Hide Armor",
    "Scale Mail",
    "Chainmail",
    "Splint Mail",
    "Half-Plate",
    "Full Plate",
    "Buckler",
    "Light Wooden Shield",
    "Heavy Wooden Shield",
    "Light Steel Shield",
    "Mithral Chain Shirt",
    "Mithral Breastplate",
    "Mithral Full Plate",
  ].map((name) => ({
    name,
    category: new Set([
      "Buckler",
      "Light Wooden Shield",
      "Heavy Wooden Shield",
      "Light Steel Shield",
      "Heavy Steel Shield",
      "Tower Shield",
    ]).has(name)
      ? ("Shields" as StoreCategory)
      : ("Armor" as StoreCategory),
    price: 100,
    weight: "varies",
  })),
  ...[
    "Bedroll",
    "Flint and Steel",
    "Waterskin",
    "Grappling Hook",
    "Crowbar",
    "Oil (1 pint)",
    "Torches (5)",
    "Holy Symbol",
    "Spell Component Pouch",
    "Traveler's Cloak",
    "Sunrod",
    "Tanglefoot Bag",
    "Thunderstone",
    "Smokestick",
    "Silk Rope",
    "Masterwork Tool",
    "Manacles",
    "Desert Outfit",
    "Cold-Weather Outfit",
    "Steel Coin Purse",
    "Gnomish Device",
    "Kender Hoopak",
  ].map((name) => ({
    name,
    category: "Adventuring Gear" as StoreCategory,
    price: 5,
    weight: "varies",
  })),
  { name: "Bagpipes", category: "Instruments", price: 30, weight: "6 lb.", description: "A wind instrument with a distinctive drone." },
  { name: "Drum", category: "Instruments", price: 5, weight: "3 lb.", description: "A percussion instrument played with a beater or the hands." },
  { name: "Dulcimer", category: "Instruments", price: 25, weight: "10 lb.", description: "A stringed instrument played by striking its strings." },
  { name: "Flute", category: "Instruments", price: 5, weight: "2 lb.", description: "A simple woodwind instrument." },
  { name: "Lute", category: "Instruments", price: 35, weight: "3 lb.", description: "A portable plucked string instrument." },
  { name: "Lyre", category: "Instruments", price: 30, weight: "3 lb.", description: "A small harp-like string instrument." },
  { name: "Mandolin", category: "Instruments", price: 15, weight: "3 lb.", description: "A small, short-necked string instrument." },
  { name: "Pan Pipes", category: "Instruments", price: 12, weight: "2 lb.", description: "A set of connected pipes played by blowing across their openings." },
  { name: "Shawm", category: "Instruments", price: 2, weight: "1 lb.", description: "A double-reed woodwind instrument." },
  { name: "Horn", category: "Instruments", price: 3, weight: "2 lb.", description: "A curved horn used as a signaling or musical instrument." },
  { name: "Drum of Panic", category: "Instruments", price: 30000, weight: "3 lb.", description: "Effect: playing the drum creates a panic effect in creatures that hear it." },
  { name: "Horn of Blasting", category: "Instruments", price: 20000, weight: "2 lb.", description: "Effect: a blast produces a powerful cone of sonic force that can damage and deafen creatures." },
  { name: "Horn of the Tritons", category: "Instruments", price: 15000, weight: "2 lb.", description: "Effects: can calm rough water, frighten aquatic creatures, and call or command creatures of the sea." },
  { name: "Lyre of Building", category: "Instruments", price: 13000, weight: "3 lb.", description: "Effect: playing the lyre aids construction, repairs structural damage, and protects structures from harm." },
  { name: "Pipes of Haunting", category: "Instruments", price: 6000, weight: "3 lb.", description: "Effect: playing the pipes creates a haunting tune that can frighten creatures that hear it." },
  { name: "Pipes of Pain", category: "Instruments", price: 12000, weight: "3 lb.", description: "Effect: playing the pipes causes intense pain and penalties to creatures that hear the music." },
  ...[
    "Scroll of Identify",
    "Scroll of Protection from Evil",
    "Wand of Cure Light Wounds",
    "Wand of Magic Missile",
    "Potion of Cure Light Wounds",
    "Potion of Shield of Faith +2",
  ].map((name) => ({
    name,
    category: "Potions, Scrolls & Wands" as StoreCategory,
    price: 25,
    weight: "—",
  })),
  { name: "Goggles of Night", category: "Head", price: 8000, weight: "—" },
  { name: "Goggles of Minute Seeing", category: "Head", price: 12500, weight: "—" },
  { name: "Goggles of the Dragon", category: "Head", price: 15000, weight: "—" },
  {
    name: "Headband of Intellect +2",
    category: "Head",
    price: 4000,
    weight: "1 lb.",
  },
  {
    name: "Amulet of Natural Armor +1",
    category: "Neck",
    price: 2000,
    weight: "—",
  },
  { name: "Amulet of Natural Armor +2", category: "Neck", price: 8000, weight: "—" },
  { name: "Amulet of Natural Armor +3", category: "Neck", price: 18000, weight: "—" },
  { name: "Amulet of Mighty Fists", category: "Neck", price: 6000, weight: "—" },
  { name: "Periapt of Proof against Poison", category: "Neck", price: 27000, weight: "—" },
  { name: "Periapt of Wound Closure", category: "Neck", price: 15000, weight: "—" },
  { name: "Pearl of Power (1st)", category: "Neck", price: 1000, weight: "—" },
  {
    name: "Cloak of Resistance +1",
    category: "Shoulders",
    price: 1000,
    weight: "1 lb.",
  },
  { name: "Cloak of Resistance +2", category: "Shoulders", price: 4000, weight: "1 lb." },
  { name: "Cloak of Resistance +3", category: "Shoulders", price: 9000, weight: "1 lb." },
  {
    name: "Cloak of Elvenkind",
    category: "Shoulders",
    price: 2500,
    weight: "1 lb.",
  },
  {
    name: "Cloak of Displacement (Minor)",
    category: "Shoulders",
    price: 24000,
    weight: "1 lb.",
  },
  { name: "Cloak of the Bat", category: "Shoulders", price: 26000, weight: "1 lb." },
  { name: "Cloak of Arachnida", category: "Shoulders", price: 14000, weight: "1 lb." },
  {
    name: "Cloak of Displacement (Major)",
    category: "Shoulders",
    price: 50000,
    weight: "1 lb.",
  },
  {
    name: "Cloak of the Manta",
    category: "Shoulders",
    price: 7200,
    weight: "1 lb.",
  },
  {
    name: "Cape of the Mountebank",
    category: "Shoulders",
    price: 10080,
    weight: "1 lb.",
  },
  {
    name: "Gloves of Dexterity +2",
    category: "Hands",
    price: 4000,
    weight: "—",
  },
  {
    name: "Belt of Giant Strength +2",
    category: "Waist",
    price: 4000,
    weight: "1 lb.",
  },
  {
    name: "Boots of Elvenkind",
    category: "Feet",
    price: 2500,
    weight: "1 lb.",
  },
  {
    name: "Ring of Protection +1",
    category: "Rings",
    price: 2000,
    weight: "—",
  },
  {
    name: "Bag of Holding",
    category: "Body & Wondrous Items",
    price: 2500,
    weight: "15 lb.",
  },
  {
    name: "Handy Haversack",
    category: "Body & Wondrous Items",
    price: 2000,
    weight: "5 lb.",
  },
  {
    name: "Dust of Disappearance",
    category: "Body & Wondrous Items",
    price: 3500,
    weight: "—",
  },
  {
    name: "Rope of Climbing",
    category: "Body & Wondrous Items",
    price: 3000,
    weight: "3 lb.",
  },
  {
    name: "Decanter of Endless Water",
    category: "Body & Wondrous Items",
    price: 9000,
    weight: "2 lb.",
  },
  {
    name: "Rowboat",
    category: "Mounts & Vehicles",
    price: 50,
    weight: "100 lb.",
  },
  {
    name: "Watercraft, Rowboat",
    category: "Mounts & Vehicles",
    price: 50,
    weight: "100 lb.",
  },
  ...[
    ["Arms", "Bracers of Armor +1", 1000, "1 lb."],
    ["Arms", "Bracers of Armor +2", 4000, "1 lb."],
    ["Arms", "Bracers of Armor +3", 9000, "1 lb."],
    ["Arms", "Bracers of Archery, Lesser", 5000, "1 lb."],
    ["Arms", "Bracers of Archery, Greater", 25000, "1 lb."],
    ["Hands", "Gloves of Swimming and Climbing", 6250, "—"],
    ["Hands", "Gloves of Dexterity +4", 16000, "—"],
    ["Hands", "Gauntlets of Ogre Power", 4000, "4 lb."],
    ["Hands", "Gloves of Arrow Snaring", 4000, "—"],
    ["Rings", "Ring of Swimming", 2500, "—"],
    ["Rings", "Ring of Invisibility", 20000, "—"],
    ["Rings", "Ring of Feather Falling", 2200, "—"],
    ["Waist", "Belt of Dwarvenkind", 14900, "1 lb."],
    ["Waist", "Belt of Giant Strength +4", 16000, "1 lb."],
    ["Feet", "Boots of Speed", 12000, "1 lb."],
    ["Feet", "Boots of Striding and Springing", 5500, "1 lb."],
    ["Feet", "Boots of Levitation", 7500, "1 lb."],
    ["Feet", "Winged Boots", 16000, "1 lb."],
    ["Body & Wondrous Items", "Portable Hole", 20000, "—"],
    ["Body & Wondrous Items", "Figurine of Wondrous Power, Silver Raven", 3800, "1 lb."],
    ["Body & Wondrous Items", "Figurine of Wondrous Power, Ebony Fly", 10000, "1 lb."],
    ["Body & Wondrous Items", "Figurine of Wondrous Power, Golden Lions", 16500, "1 lb."],
    ["Body & Wondrous Items", "Figurine of Wondrous Power, Onyx Dog", 6000, "1 lb."],
    ["Body & Wondrous Items", "Dust of Dryness", 850, "—"],
    ["Head", "Circlet of Persuasion", 4500, "—"],
    ["Head", "Helm of Telepathy", 27000, "3 lb."],
    ["Neck", "Periapt of Wisdom +2", 4000, "—"],
    ["Neck", "Periapt of Health", 7400, "—"],
    ["Ammunition", "Cold Iron Arrows (20)", 2, "3 lb."],
    ["Ammunition", "Masterwork Arrows (20)", 61, "3 lb."],
    ["Tools & Kits", "Climber's Kit", 80, "5 lb."],
    ["Tools & Kits", "Disguise Kit", 50, "8 lb."],
    ["Consumables", "Smokestick", 20, "0.5 lb."],
    ["Consumables", "Thunderstone", 30, "1 lb."],
    ["Potions, Scrolls & Wands", "Potion of Cure Moderate Wounds", 300, "—"],
    ["Potions, Scrolls & Wands", "Potion of Invisibility", 300, "—"],
    ["Potions, Scrolls & Wands", "Wand of Cure Moderate Wounds", 4500, "—"],
    ["Mounts & Vehicles", "Light Horse", 75, "—"],
    ["Mounts & Vehicles", "Warhorse", 400, "—"],
    ["Mounts & Vehicles", "Mule", 8, "—"],
  ].map(([category, name, price, weight]) => ({
    category: category as StoreCategory,
    name: name as string,
    price: price as number,
    weight: weight as string,
    ...(name === "Cold Iron Arrows (20)" ? { material: "cold-iron" as const } : {}),
  })),
);

export const srdArmorStats: Record<string, { price: number; weight: string }> = {
  "Padded Armor": { price: 5, weight: "10 lb." },
  "Leather Armor": { price: 10, weight: "15 lb." },
  "Studded Leather": { price: 25, weight: "20 lb." },
  "Hide Armor": { price: 15, weight: "25 lb." },
  "Scale Mail": { price: 50, weight: "30 lb." },
  Chainmail: { price: 150, weight: "40 lb." },
  "Splint Mail": { price: 200, weight: "45 lb." },
  "Half-Plate": { price: 600, weight: "50 lb." },
  "Full Plate": { price: 1500, weight: "50 lb." },
  Buckler: { price: 15, weight: "5 lb." },
  "Light Wooden Shield": { price: 3, weight: "5 lb." },
  "Heavy Wooden Shield": { price: 7, weight: "10 lb." },
  "Light Steel Shield": { price: 9, weight: "6 lb." },
  "Heavy Steel Shield": { price: 20, weight: "15 lb." },
  "Tower Shield": { price: 30, weight: "45 lb." },
};

storeItems.forEach((item) => {
  const stats = srdArmorStats[item.name];
  if (stats) {
    item.price = stats.price;
    item.weight = stats.weight;
  }
});

storeItems.push(
  { name: "Candle", category: "Adventuring Gear", price: 0.01, weight: "—" },
  { name: "Chain (10 ft.)", category: "Adventuring Gear", price: 30, weight: "2 lb." },
  { name: "Chalk (1 piece)", category: "Adventuring Gear", price: 0.01, weight: "—" },
  { name: "Crowbar", category: "Tools & Kits", price: 2, weight: "5 lb." },
  { name: "Grappling Hook", category: "Adventuring Gear", price: 1, weight: "4 lb." },
  { name: "Hooded Lantern", category: "Adventuring Gear", price: 7, weight: "2 lb." },
  { name: "Ink (1 oz.)", category: "Tools & Kits", price: 8, weight: "—" },
  { name: "Iron Pot", category: "Adventuring Gear", price: 0.5, weight: "2 lb." },
  { name: "Ladder (10 ft.)", category: "Adventuring Gear", price: 5, weight: "20 lb." },
  { name: "Lock", category: "Tools & Kits", price: 80, weight: "1 lb." },
  { name: "Manacles", category: "Tools & Kits", price: 15, weight: "2 lb." },
  { name: "Mirror, Steel", category: "Adventuring Gear", price: 10, weight: "0.5 lb." },
  { name: "Piton", category: "Adventuring Gear", price: 0.1, weight: "0.5 lb." },
  { name: "Pole (10 ft.)", category: "Adventuring Gear", price: 0.2, weight: "8 lb." },
  { name: "Sack", category: "Adventuring Gear", price: 0.1, weight: "0.5 lb." },
  { name: "Whetstone", category: "Tools & Kits", price: 0.02, weight: "1 lb." },
  { name: "Acid (flask)", category: "Consumables", price: 10, weight: "1 lb." },
  { name: "Alchemist's Fire", category: "Consumables", price: 20, weight: "1 lb." },
  { name: "Holy Water", category: "Consumables", price: 25, weight: "1 lb." },
  { name: "Tindertwig", category: "Consumables", price: 1, weight: "—" },
  { name: "Sunrod", category: "Consumables", price: 2, weight: "1 lb." },
  { name: "Tanglefoot Bag", category: "Consumables", price: 50, weight: "4 lb." },
  { name: "Oil (1-pint flask)", category: "Consumables", price: 0.1, weight: "1 lb." },
  { name: "Powdered Silver", category: "Consumables", price: 25, weight: "—" },
  { name: "Donkey", category: "Mounts & Vehicles", price: 8, weight: "—" },
  { name: "Camel", category: "Mounts & Vehicles", price: 50, weight: "—" },
  { name: "Dog", category: "Mounts & Vehicles", price: 25, weight: "—" },
  { name: "Mastiff", category: "Mounts & Vehicles", price: 150, weight: "—" },
  { name: "Elephant", category: "Mounts & Vehicles", price: 2000, weight: "—" },
  { name: "Pony", category: "Mounts & Vehicles", price: 30, weight: "—" },
  { name: "Warpony", category: "Mounts & Vehicles", price: 100, weight: "—" },
  { name: "Heavy Horse", category: "Mounts & Vehicles", price: 200, weight: "—" },
  { name: "Cart", category: "Mounts & Vehicles", price: 15, weight: "200 lb." },
  { name: "Wagon", category: "Mounts & Vehicles", price: 35, weight: "400 lb." },
  { name: "Sled", category: "Mounts & Vehicles", price: 20, weight: "300 lb." },
  { name: "Canoe", category: "Mounts & Vehicles", price: 50, weight: "—" },
  { name: "Raft", category: "Mounts & Vehicles", price: 10, weight: "—" },
  { name: "Keelboat", category: "Mounts & Vehicles", price: 3000, weight: "—" },
  { name: "Sailing Ship", category: "Mounts & Vehicles", price: 10000, weight: "—" },
  { name: "Warship", category: "Mounts & Vehicles", price: 25000, weight: "—" },
  { name: "Galley", category: "Mounts & Vehicles", price: 30000, weight: "—" },
  { name: "Potion of Cure Light Wounds", category: "Potions, Scrolls & Wands", price: 50, weight: "—" },
  { name: "Potion of Cure Serious Wounds", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Potion of Cure Critical Wounds", category: "Potions, Scrolls & Wands", price: 1050, weight: "—" },
  { name: "Potion of Bear's Endurance", category: "Potions, Scrolls & Wands", price: 300, weight: "—" },
  { name: "Potion of Bull's Strength", category: "Potions, Scrolls & Wands", price: 300, weight: "—" },
  { name: "Potion of Cat's Grace", category: "Potions, Scrolls & Wands", price: 300, weight: "—" },
  { name: "Potion of Invisibility", category: "Potions, Scrolls & Wands", price: 300, weight: "—" },
  { name: "Potion of Fly", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Potion of Barkskin", category: "Potions, Scrolls & Wands", price: 300, weight: "—" },
  { name: "Potion of Haste", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Potion of Remove Disease", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Potion of Neutralize Poison", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Scroll of Identify", category: "Potions, Scrolls & Wands", price: 25, weight: "—" },
  { name: "Scroll of Knock", category: "Potions, Scrolls & Wands", price: 150, weight: "—" },
  { name: "Scroll of Fireball", category: "Potions, Scrolls & Wands", price: 375, weight: "—" },
  { name: "Scroll of Teleport", category: "Potions, Scrolls & Wands", price: 1125, weight: "—" },
  { name: "Scroll of Dispel Magic", category: "Potions, Scrolls & Wands", price: 375, weight: "—" },
  { name: "Scroll of Invisibility", category: "Potions, Scrolls & Wands", price: 150, weight: "—" },
  { name: "Wand of Magic Missile", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Wand of Cure Light Wounds", category: "Potions, Scrolls & Wands", price: 750, weight: "—" },
  { name: "Wand of Fireball", category: "Potions, Scrolls & Wands", price: 11250, weight: "—" },
  { name: "Wand of Acid Arrow", category: "Potions, Scrolls & Wands", price: 4500, weight: "—" },
  { name: "Wand of Scorching Ray", category: "Potions, Scrolls & Wands", price: 4500, weight: "—" },
  { name: "Rod of Metamagic, Empower", category: "Rings & Magic Items", price: 32500, weight: "5 lb." },
  { name: "Rod of Metamagic, Extend", category: "Rings & Magic Items", price: 11000, weight: "5 lb." },
  { name: "Rod of Metamagic, Maximize", category: "Rings & Magic Items", price: 73000, weight: "5 lb." },
  { name: "Rod of Absorption", category: "Rings & Magic Items", price: 50000, weight: "5 lb." },
  { name: "Rod of Cancellation", category: "Rings & Magic Items", price: 11000, weight: "5 lb." },
  { name: "Rod of Metamagic, Lesser Empower", category: "Rings & Magic Items", price: 9000, weight: "5 lb." },
  { name: "Rod of Metamagic, Lesser Extend", category: "Rings & Magic Items", price: 3000, weight: "5 lb." },
  { name: "Rod of Metamagic, Lesser Maximize", category: "Rings & Magic Items", price: 14000, weight: "5 lb." },
  { name: "Rod of Lordly Might", category: "Rings & Magic Items", price: 70000, weight: "10 lb." },
  { name: "Rod of Splendor", category: "Rings & Magic Items", price: 25000, weight: "5 lb." },
  { name: "Rod of Thunder and Lightning", category: "Rings & Magic Items", price: 33000, weight: "5 lb." },
  { name: "Rod of Wonder", category: "Rings & Magic Items", price: 12000, weight: "5 lb." },
  { name: "Immovable Rod", category: "Rings & Magic Items", price: 5000, weight: "8 lb." },
  { name: "Staff of Charming", category: "Rings & Magic Items", price: 16500, weight: "4 lb." },
  { name: "Staff of Healing", category: "Rings & Magic Items", price: 15500, weight: "4 lb." },
  { name: "Staff of Fire", category: "Rings & Magic Items", price: 18950, weight: "5 lb." },
  { name: "Staff of Power", category: "Rings & Magic Items", price: 211000, weight: "5 lb." },
  { name: "Pearl of Power, 1st-level", category: "Body & Wondrous Items", price: 1000, weight: "—" },
  { name: "Pearl of Power, 2nd-level", category: "Body & Wondrous Items", price: 4000, weight: "—" },
  { name: "Pearl of Power, 3rd-level", category: "Body & Wondrous Items", price: 9000, weight: "—" },
  { name: "Pearl of Power, 4th-level", category: "Body & Wondrous Items", price: 16000, weight: "—" },
  { name: "Dimensional Anchor", category: "Body & Wondrous Items", price: 5000, weight: "—" },
  { name: "Buckler", category: "Shields", price: 15, weight: "5 lb." },
  { name: "Light Wooden Shield", category: "Shields", price: 3, weight: "5 lb." },
  { name: "Heavy Wooden Shield", category: "Shields", price: 7, weight: "10 lb." },
  { name: "Light Steel Shield", category: "Shields", price: 9, weight: "6 lb." },
  { name: "Light Wooden Shield with Spikes", category: "Shields", price: 13, weight: "10 lb.", shieldBonus: 1, shieldCheckPenalty: -1, shieldSpellFailure: 5, shieldType: "Light" },
  { name: "Heavy Wooden Shield with Spikes", category: "Shields", price: 17, weight: "15 lb.", shieldBonus: 2, shieldCheckPenalty: -2, shieldSpellFailure: 15, shieldType: "Heavy" },
  { name: "Light Steel Shield with Spikes", category: "Shields", price: 19, weight: "11 lb.", shieldBonus: 1, shieldCheckPenalty: -1, shieldSpellFailure: 5, shieldType: "Light" },
  { name: "Heavy Steel Shield with Spikes", category: "Shields", price: 30, weight: "20 lb.", shieldBonus: 2, shieldCheckPenalty: -2, shieldSpellFailure: 15, shieldType: "Heavy" },
  { name: "Ring of Counterspells", category: "Rings", price: 4000, weight: "—" },
  { name: "Ring of Force Shield", category: "Rings", price: 8500, weight: "—" },
  { name: "Ring of Ram", category: "Rings", price: 8600, weight: "—" },
  { name: "Ring of Major Energy Resistance", category: "Rings", price: 44000, weight: "—" },
  { name: "Ring of Minor Energy Resistance", category: "Rings", price: 12000, weight: "—" },
  { name: "Ring of Protection +2", category: "Rings", price: 8000, weight: "—" },
  { name: "Ring of Protection +3", category: "Rings", price: 18000, weight: "—" },
  { name: "Ring of Three Wishes", category: "Rings", price: 97950, weight: "—" },
  { name: "Broom of Flying", category: "Body & Wondrous Items", price: 17000, weight: "3 lb." },
  { name: "Carpet of Flying, 5 ft. by 5 ft.", category: "Body & Wondrous Items", price: 20000, weight: "8 lb." },
  { name: "Hat of Disguise", category: "Body & Wondrous Items", price: 1800, weight: "—" },
  { name: "Necklace of Fireballs I", category: "Neck", price: 1650, weight: "—" },
  { name: "Robe of Useful Items", category: "Body & Wondrous Items", price: 7000, weight: "1 lb." },
  { name: "Stone of Good Luck", category: "Body & Wondrous Items", price: 20000, weight: "—" },
  { name: "Sling Bullets (10)", category: "Ammunition", price: 0.1, weight: "5 lb." },
  { name: "Masterwork Bolts (10)", category: "Ammunition", price: 51, weight: "1 lb." },
  { name: "Silver Arrows (20)", category: "Ammunition", price: 22, weight: "3 lb.", material: "alchemical-silver" },
  { name: "Silver Bolts (10)", category: "Ammunition", price: 11, weight: "1 lb.", material: "alchemical-silver" },
  { name: "Cold Iron Bolts (10)", category: "Ammunition", price: 1, weight: "1 lb.", material: "cold-iron" },
  { name: "Darts (10)", category: "Ammunition", price: 0.5, weight: "5 lb." },
  { name: "Blowgun Needles (10)", category: "Ammunition", price: 1, weight: "—" },
  { name: "Masterwork Sling Bullets (10)", category: "Ammunition", price: 30.1, weight: "5 lb." },
  { name: "Silver Sling Bullets (10)", category: "Ammunition", price: 20.1, weight: "5 lb.", material: "alchemical-silver" },
  { name: "Lute", category: "Instruments", price: 35, weight: "3 lb." },
  { name: "Lyre", category: "Instruments", price: 30, weight: "3 lb." },
  { name: "Flute", category: "Instruments", price: 2, weight: "2 lb." },
  { name: "Horn", category: "Instruments", price: 3, weight: "2 lb." },
  { name: "Fiddle", category: "Instruments", price: 30, weight: "3 lb." },
  { name: "Pan Pipes", category: "Instruments", price: 12, weight: "2 lb." },
  { name: "Masterwork Instrument", category: "Instruments", price: 100, weight: "varies" },
  { name: "Artisan's Tools", category: "Tools & Kits", price: 5, weight: "5 lb." },
  { name: "Fishing Tackle", category: "Tools & Kits", price: 1, weight: "5 lb." },
  { name: "Magnifying Glass", category: "Tools & Kits", price: 100, weight: "—" },
  { name: "Manacles, Masterwork", category: "Tools & Kits", price: 50, weight: "2 lb." },
  { name: "Merchant's Scale", category: "Tools & Kits", price: 2, weight: "1 lb." },
  { name: "Mess Kit", category: "Tools & Kits", price: 0.2, weight: "1 lb." },
  { name: "Musical Instrument, Common", category: "Tools & Kits", price: 5, weight: "3 lb." },
  { name: "Spyglass", category: "Tools & Kits", price: 1000, weight: "1 lb." },
  { name: "Signal Whistle", category: "Tools & Kits", price: 0.8, weight: "—" },
  { name: "Masterwork Thieves' Tools", category: "Tools & Kits", price: 100, weight: "2 lb." },
  { name: "Caltrops", category: "Tools & Kits", price: 1, weight: "2 lb." },
  { name: "Block and Tackle", category: "Tools & Kits", price: 5, weight: "5 lb." },
  { name: "Portable Ram", category: "Tools & Kits", price: 10, weight: "20 lb." },
  { name: "Battering Ram", category: "Tools & Kits", price: 10, weight: "20 lb." },
  { name: "Blanket, Winter", category: "Adventuring Gear", price: 0.5, weight: "3 lb." },
  { name: "Bucket", category: "Adventuring Gear", price: 0.5, weight: "2 lb." },
  { name: "Cooking Pot", category: "Adventuring Gear", price: 2, weight: "4 lb." },
  { name: "Crowbar, Masterwork", category: "Tools & Kits", price: 302, weight: "5 lb." },
  { name: "Soap", category: "Adventuring Gear", price: 0.5, weight: "1 lb." },
  { name: "Bedroll", category: "Adventuring Gear", price: 0.1, weight: "5 lb." },
  { name: "Waterskin", category: "Adventuring Gear", price: 1, weight: "4 lb." },
  { name: "Scroll Case", category: "Adventuring Gear", price: 1, weight: "0.5 lb." },
  { name: "Map Case", category: "Adventuring Gear", price: 1, weight: "0.5 lb." },
  { name: "Tarp", category: "Adventuring Gear", price: 0.5, weight: "5 lb." },
  { name: "Traveler's Outfit", category: "Adventuring Gear", price: 1, weight: "—" },
  { name: "Winter Blanket", category: "Adventuring Gear", price: 0.5, weight: "3 lb." },
);

export const uniqueStoreItems = new Map<string, StoreItem>();

storeItems.push(...abilityEquipmentItems.map(({ name, category, weight, price, ability, bonus }) => ({
  name, category, weight, price, description: `+${bonus} enhancement bonus to ${ability.toUpperCase()}; same-type bonuses do not stack.`,
})));

storeItems.forEach((item) => {
  if (!uniqueStoreItems.has(item.name)) uniqueStoreItems.set(item.name, item);
});

storeItems.splice(0, storeItems.length, ...uniqueStoreItems.values());

export const forgeWeaponProperties = [
  { name: "Flaming", bonus: 1, description: "+1d6 fire damage." },
  { name: "Frost", bonus: 1, description: "+1d6 cold damage." },
  { name: "Shock", bonus: 1, description: "+1d6 electricity damage." },
  { name: "Keen", bonus: 1, description: "Doubles the weapon's threat range." },
];

export const forgeArmorProperties = [
  { name: "Fortification", bonus: 1, description: "50% chance to ignore extra damage from critical hits and sneak attacks." },
  { name: "Glamered", bonus: 0, flatCost: 4000, description: "Allows the armor to appear as normal clothing." },
  { name: "Slick", bonus: 0, flatCost: 3750, description: "Slick armor helps the wearer escape grapples." },
];

export const forgeShieldProperties = [
  { name: "Arrow Catching", bonus: 1, description: "+1 AC against ranged attacks." },
  { name: "Bashing", bonus: 1, description: "Deals damage as though two size categories larger." },
  { name: "Blinding", bonus: 1, description: "Can blind an opponent once per day." },
  { name: "Animated", bonus: 2, description: "Can defend the wielder without being held." },
];

let revision = 0;
let indexedRevision = -1;
let sortedItems: StoreItem[] = [];
const itemsByName = new Map<string, StoreItem>();
const listeners = new Set<() => void>();

function updateCatalog(items: StoreItem[]) {
  window.localStorage.setItem(
    customStoreItemsStorageKey,
    JSON.stringify(items.filter((item) => item.custom)),
  );
  storeItems.splice(0, storeItems.length, ...items);
  revision += 1;
  listeners.forEach((listener) => listener());
}

export function addCustomStoreItems(items: StoreItem[]) {
  parseCustomItems(items);
  const next = [...storeItems];
  for (const item of items) {
    if (!next.some((entry) => entry.category === item.category &&
        entry.name.trim().toLowerCase() === item.name.trim().toLowerCase())) {
      next.push(item);
    }
  }
  if (next.length !== storeItems.length) updateCatalog(next);
}

export function deleteCustomStoreItem(name: string) {
  updateCatalog(storeItems.filter((item) => !item.custom || item.name !== name));
}

export function findStoreItem(name: string, category?: StoreCategory) {
  if (indexedRevision !== revision) {
    sortedItems = [...storeItems].sort((left, right) => right.name.length - left.name.length);
    itemsByName.clear();
    for (const item of storeItems) {
      if (!itemsByName.has(item.name)) itemsByName.set(item.name, item);
    }
    indexedRevision = revision;
  }
  const exact = itemsByName.get(name);
  if (exact && (!category || exact.category === category)) return exact;
  return sortedItems.find((item) => (!category || item.category === category) && name.includes(item.name));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const getRevision = () => revision;

export function useCatalogRevision() {
  return useSyncExternalStore(subscribe, getRevision, getRevision);
}
