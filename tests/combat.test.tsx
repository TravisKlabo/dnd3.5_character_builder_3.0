import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { armorClass, carryingCapacity, cloneCharacter, initialCharacter, raceDefinitions, sizeModifier } from "../src/domain";
import { equipInventoryItem, getEquippedWeaponStats, getTwoWeaponAttackPenalty, getArmorClassValues, getEquipmentArmorClass, getSpecialAttackBonuses, getCombatSpace, getWeaponRangeForSize, getWeaponReach, getWeaponSizeHandling, getWeaponCompatibilityWarning, getMainWeaponGripState, getDoubleWeaponModeState, getEffectiveWeaponKey, getShieldBashState, getInventoryEntryDetails } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { EquipmentStore } from "../src/components/EquipmentStore";
import { EquipmentSheet } from "../src/components/EquipmentSheet";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

function fighter(str = 16, dex = 18) {
  const character = cloneCharacter(initialCharacter);
  character.abilities.str = str;
  character.abilities.dex = dex;
  return character;
}

describe("SRD weapon attack and damage", () => {
  it("applies magical enhancement to attack and damage, not elemental dice to physical damage", () => {
    const stats = getEquippedWeaponStats(fighter(), "Flaming +2 Longsword (Medium)");
    expect(stats).toMatchObject({
      attack: 6, damage: "1d8+5", enhancement: 2, attackEnhancement: 2,
      enchantmentDamage: ["Flaming: 1d6 fire damage"],
    });
  });

  it("does not stack masterwork and magical enhancement attack bonuses", () => {
    expect(getEquippedWeaponStats(fighter(), "Masterwork Longsword (Medium)"))
      .toMatchObject({ attack: 5, damage: "1d8+3", attackEnhancement: 1 });
    expect(getEquippedWeaponStats(fighter(), "+2 Masterwork Longsword (Medium)"))
      .toMatchObject({ attack: 6, damage: "1d8+5", attackEnhancement: 2 });
  });

  it("applies Weapon Focus and Weapon Specialization only to their selected weapon type", () => {
    const character = fighter();
    character.classLevels = [{ classId: "fighter", level: 4 }];
    const longsword = getEquippedWeaponStats(character, "Longsword (Medium)")!;
    character.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    character.featWeaponSelections = {
      "general-1": "Longsword",
      "fighter-4": "Longsword",
    };
    expect(getEquippedWeaponStats(character, "Longsword (Medium)")).toMatchObject({
      attack: longsword.attack + 1,
      damage: "1d8+5",
      weaponFocusBonus: 1,
      weaponSpecializationBonus: 2,
    });
    expect(getEquippedWeaponStats(character, "Dagger (Medium)")).toMatchObject({
      weaponFocusBonus: 0,
      weaponSpecializationBonus: 0,
    });
  });

  it("applies weapon feats to light, heavy, spiked, and unspiked shield bashes as one type", () => {
    const character = fighter();
    character.equipment = { Shield: "Heavy Steel Shield" };
    character.shieldBashMode = true;
    character.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.featWeaponSelections = {
      "general-1": "Shield Bash",
      "fighter-4": "Shield Bash",
    };
    const bash = getEffectiveWeaponKey(character, "Off Hand Weapon");
    expect(bash).toContain("Shield Bash");
    expect(getEquippedWeaponStats(character, bash!, 0, "Off Hand Weapon"))
      .toMatchObject({ weaponFocusBonus: 1, weaponSpecializationBonus: 2 });
  });

  it.each(["Greatsword", "Greataxe", "Quarterstaff", "Spear"])(
    "adds one-and-a-half Strength bonus to a two-handed %s, rounding down", (weapon) => {
      expect(getEquippedWeaponStats(fighter(), `${weapon} (Medium)`)?.damageAbility).toBe(4);
    },
  );

  it("applies one-and-a-half Strength damage when a one-handed weapon uses a saved two-handed grip", () => {
    const character = fighter();
    character.equipment["Main Weapon"] = "Longsword (Medium)";
    delete character.mainWeaponGrip;
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"]))
      .toMatchObject({ damage: "1d8+3", damageAbility: 3, twoHandedGrip: false });
    character.mainWeaponGrip = "two-handed";
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"]))
      .toMatchObject({ damage: "1d8+4", damageAbility: 4, twoHandedGrip: true });
    character.abilities.str = 7;
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"]))
      .toMatchObject({ damage: "1d8-2", damageAbility: -2 });
  });

  it("rejects two-handed grips with ordinary shields but allows the buckler exception", () => {
    const character = fighter();
    character.equipment = { "Main Weapon": "Longsword (Medium)", Shield: "Heavy Steel Shield (Medium)" };
    character.mainWeaponGrip = "two-handed";
    expect(getMainWeaponGripState(character)).toMatchObject({ grip: "two-handed", canUseTwoHands: false });
    expect(getWeaponCompatibilityWarning(character, character.equipment["Main Weapon"], "Main Weapon"))
      .toContain("non-buckler shield");
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"])).toBeNull();

    character.equipment.Shield = "Buckler (Medium)";
    expect(getWeaponCompatibilityWarning(character, character.equipment["Main Weapon"], "Main Weapon")).toBeNull();
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"]))
      .toMatchObject({ twoHandedGrip: true, bucklerAttackPenalty: -1, damageAbility: 4 });
    expect(getArmorClassValues(character).normal).toBe(15);
  });

  it("applies buckler penalties and removes its AC bonus while using an off-hand weapon", () => {
    const character = fighter();
    character.equipment = {
      "Main Weapon": "Longsword (Medium)",
      "Off Hand Weapon": "Dagger (Medium)",
      Shield: "Buckler (Medium)",
    };
    const main = getEquippedWeaponStats(character, character.equipment["Main Weapon"],
      getTwoWeaponAttackPenalty(character, "Main Weapon"), "Main Weapon");
    const offHand = getEquippedWeaponStats(character, character.equipment["Off Hand Weapon"],
      getTwoWeaponAttackPenalty(character, "Off Hand Weapon"), "Off Hand Weapon");
    expect(main?.bucklerAttackPenalty).toBe(-1);
    expect(offHand?.bucklerAttackPenalty).toBe(-1);
    expect(getArmorClassValues(character)).toMatchObject({ normal: 14, detail: expect.arrayContaining([
      "Buckler AC bonus lost while wielding an off-hand weapon.",
    ]) });
  });

  it("uses both quarterstaff ends with light off-hand penalties and half Strength damage", () => {
    const character = fighter();
    const key = "Quarterstaff (Medium)";
    character.equipment["Main Weapon"] = key;
    expect(getEquippedWeaponStats(character, key)).toMatchObject({
      damage: "1d6+4",
      damageAbility: 4,
      twoHandedGrip: true,
    });

    character.doubleWeaponMode = true;
    expect(getDoubleWeaponModeState(character)).toMatchObject({ enabled: true, canUseBothEnds: true });
    expect(getWeaponSizeHandling(character, key, "Main Weapon")?.effectiveHandedness).toBe("one-handed");
    expect(getWeaponSizeHandling(character, key, "Off Hand Weapon")?.effectiveHandedness).toBe("light");
    expect(getEffectiveWeaponKey(character, "Off Hand Weapon")).toBe(key);
    const mainPenalty = getTwoWeaponAttackPenalty(character, "Main Weapon");
    const offHandPenalty = getTwoWeaponAttackPenalty(character, "Off Hand Weapon");
    expect([mainPenalty, offHandPenalty]).toEqual([-4, -8]);
    expect(getEquippedWeaponStats(character, key, mainPenalty, "Main Weapon"))
      .toMatchObject({ damage: "1d6+3", damageAbility: 3, attackPenalty: -4 });
    expect(getEquippedWeaponStats(character, key, offHandPenalty, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d6+1", damageAbility: 1, attackPenalty: -8 });

    character.featSelections = { "general-1": "two-weapon-fighting" };
    expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(-2);
    expect(getTwoWeaponAttackPenalty(character, "Off Hand Weapon")).toBe(-2);
  });

  it("uses the distinct ends and critical profiles of exotic double weapons", () => {
    const character = fighter();
    character.race = "Dwarf";
    const key = "Dwarven Urgrosh (Medium)";
    character.equipment["Main Weapon"] = key;
    character.doubleWeaponMode = true;
    expect(getEquippedWeaponStats(character, key, 0, "Main Weapon"))
      .toMatchObject({ name: "Dwarven Urgrosh (axe head)", damage: "1d8+3", damageType: "slashing", critical: "x3" });
    expect(getEquippedWeaponStats(character, key, 0, "Off Hand Weapon"))
      .toMatchObject({ name: "Dwarven Urgrosh (spear point)", damage: "1d6+1", damageType: "piercing", critical: "x3" });

    character.equipment["Main Weapon"] = "Gnome Hooked Hammer (Small)";
    character.race = "Gnome";
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"], 0, "Main Weapon"))
      .toMatchObject({ damage: "1d6+3", damageType: "bludgeoning", critical: "x3" });
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"], 0, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d4+1", damageType: "piercing", critical: "x4" });

    character.doubleWeaponPrimaryEnd = "second";
    expect(getEquippedWeaponStats(character, character.equipment["Main Weapon"], 0, "Main Weapon"))
      .toMatchObject({ damage: "1d4+3", damageType: "piercing", critical: "x4" });
  });

  it("allows double-weapon mode with a buckler but rejects an ordinary shield", () => {
    const character = fighter();
    const key = "Quarterstaff (Medium)";
    character.equipment = { "Main Weapon": key, Shield: "Buckler (Medium)" };
    character.doubleWeaponMode = true;
    expect(getEquippedWeaponStats(character, key, 0, "Main Weapon"))
      .toMatchObject({ bucklerAttackPenalty: -1 });
    expect(getEquippedWeaponStats(character, key, 0, "Off Hand Weapon"))
      .toMatchObject({ bucklerAttackPenalty: -1 });
    expect(getArmorClassValues(character).normal).toBe(14);

    character.equipment.Shield = "Heavy Steel Shield (Medium)";
    expect(getDoubleWeaponModeState(character)?.canUseBothEnds).toBe(false);
    expect(getWeaponCompatibilityWarning(character, key, "Main Weapon")).toContain("buckler");
    expect(getEquippedWeaponStats(character, key, 0, "Main Weapon")).toBeNull();
  });

  it("halves positive off-hand Strength bonuses but does not halve negative modifiers", () => {
    expect(getEquippedWeaponStats(fighter(), "Dagger (Medium)", 0, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d4+1" });
    expect(getEquippedWeaponStats(fighter(7), "Dagger (Medium)", 0, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d4-2" });
    expect(getEquippedWeaponStats(fighter(7), "Greatsword (Medium)"))
      .toMatchObject({ damage: "2d6-2" });
  });

  it.each(["Dagger", "Short Sword", "Rapier", "Whip", "Spiked Chain"])(
    "uses Weapon Finesse for %s attacks, not damage", (weapon) => {
      const character = fighter(12, 18);
      character.featSelections = { "general-1": "weapon-finesse" };
      const stats = getEquippedWeaponStats(character, `${weapon} (Medium)`);
      expect(stats?.abilityAttackBonus).toBe(4);
      expect(stats?.damageAbility).toBe(1);
    },
  );

  it("does not apply Finesse to an ordinary longsword or force a worse Dexterity attack", () => {
    const character = fighter(18, 12);
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getEquippedWeaponStats(character, "Dagger (Medium)")?.abilityAttackBonus).toBe(4);
    character.abilities.dex = 20;
    expect(getEquippedWeaponStats(character, "Longsword (Medium)")?.abilityAttackBonus).toBe(4);
  });

  it("requires Weapon Finesse and an appropriately sized weapon", () => {
    const character = fighter(12, 18);
    expect(getEquippedWeaponStats(character, "Dagger (Medium)")?.abilityAttackBonus).toBe(1);
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getEquippedWeaponStats(character, "Dagger (Small)")).toBeNull();
  });

  it("applies the shield check penalty when choosing Finesse and accounts for masterwork shields", () => {
    const character = fighter(10, 18);
    character.featSelections = { "general-1": "weapon-finesse" };
    character.equipment.Shield = "Heavy Steel Shield (Medium)";
    expect(getEquippedWeaponStats(character, "Rapier (Medium)"))
      .toMatchObject({ attack: 3, finessePenalty: -2, damageAbility: 0 });
    character.equipment.Shield = "Masterwork Heavy Steel Shield (Medium)";
    expect(getEquippedWeaponStats(character, "Rapier (Medium)"))
      .toMatchObject({ attack: 4, finessePenalty: -1 });
    character.equipment.Shield = "Tower Shield (Medium)";
    expect(getEquippedWeaponStats(character, "Rapier (Medium)"))
      .toMatchObject({ abilityAttackBonus: 0, finessePenalty: 0 });
  });

  it.each([
    ["Halfling", "Small", 1],
    ["Human", "Medium", 0],
    ["Gnome", "Small", 1],
    ["Minotaur", "Medium", 0],
  ] as const)("adds the %s size modifier to weapon attacks", (race, size, bonus) => {
    const character = fighter();
    character.race = race;
    expect(sizeModifier(character)).toBe(bonus);
    expect(getEquippedWeaponStats(character, `Longsword (${size})`)?.attack).toBe(4 + bonus);
  });

  it("applies weapon-size penalties and adjusts handedness or rejects unusable sizes", () => {
    const medium = fighter();
    const standardSword = getEquippedWeaponStats(medium, "Longsword (Medium)");
    expect(standardSword?.weaponSizePenalty).toBe(0);

    expect(getEquippedWeaponStats(medium, "Longsword (Large)")).toMatchObject({
      attack: (standardSword?.attack ?? 0) - 2,
      weaponSizePenalty: -2,
      effectiveHandedness: "two-handed",
      damageAbility: 4,
    });
    expect(getEquippedWeaponStats(medium, "Longsword (Small)")).toMatchObject({
      attack: (standardSword?.attack ?? 0) - 2,
      weaponSizePenalty: -2,
      effectiveHandedness: "light",
    });
    expect(getWeaponSizeHandling(medium, "Longsword (Large)")).toMatchObject({
      sizeDifference: 1,
      effectiveHandedness: "two-handed",
      wieldable: true,
    });
    expect(getWeaponSizeHandling(medium, "Dagger (Small)")).toMatchObject({
      effectiveHandedness: null,
      wieldable: false,
    });
    expect(getEquippedWeaponStats(medium, "Dagger (Small)")).toBeNull();
    expect(getEquippedWeaponStats(medium, "Greatsword (Large)")).toBeNull();

    const halfling = fighter();
    halfling.race = "Halfling";
    expect(getWeaponSizeHandling(halfling, "Dagger (Small)")).toMatchObject({
      sizeDifference: 0,
      effectiveHandedness: "light",
      wieldable: true,
    });
  });

  it("uses the adjusted size category for two-weapon penalties", () => {
    const character = fighter();
    character.equipment = {
      "Main Weapon": "Longsword (Medium)",
      "Off Hand Weapon": "Longsword (Small)",
    };
    expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(-4);
    expect(getTwoWeaponAttackPenalty(character, "Off Hand Weapon")).toBe(-8);
    expect(getEquippedWeaponStats(character, "Longsword (Small)", -8, "Off Hand Weapon"))
      .toMatchObject({ weaponSizePenalty: -2, effectiveHandedness: "light" });
  });

  it("shares Small size with AC and carrying capacity rather than treating halflings as Medium", () => {
    const character = fighter(10, 10);
    character.race = "Halfling";
    expect(armorClass(character)).toBe(11);
    expect(carryingCapacity(character).light).toBe(24);
  });

  it("uses negative attack modifiers for Large creatures when a module defines one", () => {
    raceDefinitions["test-large"] = { id: "test-large", name: "Test Large", source: "core-35-srd", size: "Large", abilityModifiers: {} };
    try {
      const character = fighter();
      character.race = "Test Large";
      expect(getEquippedWeaponStats(character, "Longsword (Large)")?.attack).toBe(3);
    } finally {
      delete raceDefinitions["test-large"];
    }
  });

  it("applies Dwarf and Gnome target-specific attack and dodge AC bonuses", () => {
    const dwarf = fighter();
    dwarf.race = "Dwarf";
    const dwarfAttack = getEquippedWeaponStats(dwarf, "Longsword (Medium)")?.attack ?? 0;
    expect(getEquippedWeaponStats(dwarf, "Longsword (Medium)", 0, "Main Weapon", ["orc"])?.attack)
      .toBe(dwarfAttack + 1);
    expect(getEquippedWeaponStats(dwarf, "Longsword (Medium)", 0, "Main Weapon", ["goblinoid"])?.attack)
      .toBe(dwarfAttack + 1);
    expect(getEquippedWeaponStats(dwarf, "Longsword (Medium)", 0, "Main Weapon", ["orc", "goblinoid"])?.attack)
      .toBe(dwarfAttack + 1);
    expect(getEquippedWeaponStats(dwarf, "Longsword (Medium)", 0, "Main Weapon", ["giant"])?.attack)
      .toBe(dwarfAttack);

    const dwarfAC = getArmorClassValues(dwarf);
    expect(getArmorClassValues(dwarf, ["giant"])).toMatchObject({
      normal: dwarfAC.normal + 4,
      touch: dwarfAC.touch + 4,
      flatFooted: dwarfAC.flatFooted,
      racialDodgeACBonus: 4,
    });
    const uncannyDodgeDwarf = cloneCharacter(dwarf);
    uncannyDodgeDwarf.classLevels = [{ classId: "rogue", level: 4 }];
    expect(getArmorClassValues(uncannyDodgeDwarf, ["giant"]).flatFooted)
      .toBe(getArmorClassValues(uncannyDodgeDwarf).flatFooted + 4);

    const gnome = fighter();
    gnome.race = "Gnome";
    const gnomeAttack = getEquippedWeaponStats(gnome, "Longsword (Small)")?.attack ?? 0;
    expect(getEquippedWeaponStats(gnome, "Longsword (Small)", 0, "Main Weapon", ["kobold"])?.attack)
      .toBe(gnomeAttack + 1);
    expect(getEquippedWeaponStats(gnome, "Longsword (Small)", 0, "Main Weapon", ["goblinoid"])?.attack)
      .toBe(gnomeAttack + 1);
    expect(getEquippedWeaponStats(gnome, "Longsword (Small)", 0, "Main Weapon", ["kobold", "goblinoid"])?.attack)
      .toBe(gnomeAttack + 1);
    expect(getArmorClassValues(gnome, ["giant"]).racialDodgeACBonus).toBe(4);
  });

  it("applies the Halfling thrown-weapon and sling attack bonus only in ranged use", () => {
    const halfling = fighter();
    halfling.race = "Halfling";
    expect(getEquippedWeaponStats(halfling, "Dagger (Medium)")?.racialAttackBonus).toBe(0);
    expect(getEquippedWeaponStats(halfling, "Dagger (Medium)", 0, "Ranged Weapon")?.racialAttackBonus).toBe(1);
    expect(getEquippedWeaponStats(halfling, "Sling (Medium)")?.racialAttackBonus).toBe(1);
    expect(getEquippedWeaponStats(halfling, "Longbow (Small)")?.racialAttackBonus).toBe(0);

    const customThrownName = "Custom Halfling Thrower";
    addCustomStoreItems([{
      name: customThrownName,
      category: "Weapons",
      custom: true,
      price: 1,
      weight: "1 lb.",
      thrown: true,
      handedness: "One-handed",
      damage: "1d4",
    }]);
    try {
      expect(getEquippedWeaponStats(halfling, `${customThrownName} (Medium)`, 0, "Ranged Weapon")?.racialAttackBonus)
        .toBe(1);
    } finally {
      deleteCustomStoreItem(customThrownName);
    }
  });

  it.each(["Longbow", "Composite Longbow", "Repeating Heavy Crossbow", "Masterwork Shortbow"])(
    "uses Dexterity, not Strength, to attack with %s", (weapon) => {
      expect(getEquippedWeaponStats(fighter(), `${weapon} (Medium)`)?.abilityAttackBonus).toBe(4);
    },
  );

  it("applies Strength to sling and thrown damage, not crossbow damage", () => {
    expect(getEquippedWeaponStats(fighter(), "Sling (Medium)")?.damageAbility).toBe(3);
    expect(getEquippedWeaponStats(fighter(), "Javelin (Medium)")?.damageAbility).toBe(3);
    expect(getEquippedWeaponStats(fighter(), "Dagger (Medium)", 0, "Ranged Weapon"))
      .toMatchObject({ abilityAttackBonus: 4, damageAbility: 3 });
    expect(getEquippedWeaponStats(fighter(7), "Light Crossbow (Medium)")?.damageAbility).toBe(0);
    expect(getEquippedWeaponStats(fighter(7), "Shortbow (Medium)")?.damageAbility).toBe(-2);
    expect(getEquippedWeaponStats(fighter(), "Composite Longbow (Medium)")?.damageAbility).toBe(0);
  });

  it("uses composite-bow ratings for flat attack penalties and capped Strength damage", () => {
    const longbowKey = "Composite Longbow (Medium)";
    const shortbowKey = "Composite Shortbow (Medium)";
    const strong = fighter(18);
    strong.compositeBowStrengthRatings = { [longbowKey]: 3, [shortbowKey]: 2 };
    expect(getEquippedWeaponStats(strong, longbowKey)).toMatchObject({
      compositeBowStrengthRating: 3,
      compositeBowStrengthPenalty: 0,
      damageAbility: 3,
    });
    expect(getEquippedWeaponStats(strong, shortbowKey)?.damageAbility).toBe(2);
    expect(getInventoryEntryDetails(longbowKey, 3).price).toBe(400);
    expect(getInventoryEntryDetails(shortbowKey, 2).price).toBe(225);

    const belowRating = fighter(12);
    belowRating.compositeBowStrengthRatings = { [longbowKey]: 4 };
    expect(getEquippedWeaponStats(belowRating, longbowKey)).toMatchObject({
      attack: 3,
      compositeBowStrengthPenalty: -2,
      damageAbility: 1,
    });

    const negativeStrength = fighter(7);
    negativeStrength.compositeBowStrengthRatings = { [longbowKey]: 4 };
    expect(getEquippedWeaponStats(negativeStrength, longbowKey)).toMatchObject({
      compositeBowStrengthPenalty: -2,
      damageAbility: -2,
    });
    expect(getEquippedWeaponStats(fighter(18), "Longbow (Medium)"))
      .toMatchObject({ compositeBowStrengthRating: undefined, damageAbility: 0 });
  });

  it("uses saved Strength damage metadata for custom projectiles and Strength for thrown weapons", () => {
    const names = [
      "Test Custom Strength Projectile",
      "Test Custom No-Strength Projectile",
      "Test Custom Penalty-Only Projectile",
      "Test Legacy Custom Projectile",
      "Test Custom Thrown Weapon",
    ] as const;
    addCustomStoreItems([
      {
        name: names[0], category: "Weapons", custom: true, price: 1, weight: "2 lb.",
        proficiency: "Simple", handedness: "Two-handed", ranged: true, rangedDamageAbility: "strength",
        damage: "1d8", damageSmall: "1d6", damageMedium: "1d8", damageLarge: "2d6",
        damageType: "piercing", rangeSmall: "40 ft.", rangeMedium: "80 ft.", rangeLarge: "160 ft.",
      },
      {
        name: names[1], category: "Weapons", custom: true, price: 1, weight: "1 lb.",
        proficiency: "Simple", handedness: "One-handed", ranged: true, rangedDamageAbility: "none",
        damage: "1d6", damageType: "piercing", rangeIncrement: "30 ft.",
      },
      {
        name: names[2], category: "Weapons", custom: true, price: 1, weight: "1 lb.",
        proficiency: "Simple", handedness: "One-handed", ranged: true,
        rangedDamageAbility: "strength-penalty-only", damage: "1d6", damageType: "piercing",
      },
      {
        name: names[3], category: "Weapons", custom: true, price: 1, weight: "1 lb.",
        proficiency: "Simple", handedness: "Ranged", damage: "1d6", damageType: "piercing",
      },
      {
        name: names[4], category: "Weapons", custom: true, price: 1, weight: "1 lb.",
        proficiency: "Simple", handedness: "One-handed", thrown: true, damage: "1d4",
        damageType: "piercing", rangeIncrement: "20 ft.",
      },
    ]);
    try {
      const strong = fighter(16);
      expect(getEquippedWeaponStats(strong, `${names[0]} (Medium)`, 0, "Ranged Weapon"))
        .toMatchObject({
          abilityAttackBonus: 4, damageAbility: 3, damage: "1d8+3",
          damageType: "piercing", rangeIncrement: "80 ft.",
        });
      expect(getEquippedWeaponStats(strong, `${names[0]} (Small)`, 0, "Ranged Weapon"))
        .toMatchObject({ damageAbility: 3, damage: "1d6+3", rangeIncrement: "40 ft." });
      expect(getEquippedWeaponStats(fighter(18), `${names[1]} (Medium)`, 0, "Ranged Weapon"))
        .toMatchObject({ abilityAttackBonus: 4, damageAbility: 0 });
      expect(getEquippedWeaponStats(fighter(7), `${names[2]} (Medium)`, 0, "Ranged Weapon"))
        .toMatchObject({ damageAbility: -2 });
      expect(getEquippedWeaponStats(fighter(18), `${names[3]} (Medium)`, 0, "Ranged Weapon"))
        .toMatchObject({ damageAbility: 0 });
      expect(getEquippedWeaponStats(strong, `${names[4]} (Medium)`, 0, "Ranged Weapon"))
        .toMatchObject({
          abilityAttackBonus: 4, damageAbility: 3, damage: "1d4+3", rangeIncrement: "20 ft.",
        });
    } finally {
      names.forEach(deleteCustomStoreItem);
    }
  });

  it("does not invent damage for a net", () => {
    expect(getEquippedWeaponStats(fighter(), "Net (Medium)")?.damage).toBe("—");
  });
});

describe("SRD two-weapon penalties", () => {
  it.each([
    ["Longsword", false, -6, -10],
    ["Dagger", false, -4, -8],
    ["Longsword", true, -4, -4],
    ["Dagger", true, -2, -2],
    ["Masterwork Short Sword", true, -2, -2],
    ["Flaming +1 Dagger", false, -4, -8],
  ] as const)("%s, feat %s gives %s/%s", (weapon, feat, main, off) => {
    const character = fighter();
    character.equipment = { "Main Weapon": "Longsword (Medium)", "Off Hand Weapon": `${weapon} (Medium)` };
    if (feat) character.featSelections = { "general-1": "two-weapon-fighting" };
    expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(main);
    expect(getTwoWeaponAttackPenalty(character, "Off Hand Weapon")).toBe(off);
  });

  it("does not apply two-weapon penalties without both weapons", () => {
    expect(getTwoWeaponAttackPenalty(fighter(), "Main Weapon")).toBe(0);
  });
});

describe("consistent equipment handling", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it.each(["Composite Longbow", "Masterwork Shortbow", "Repeating Heavy Crossbow", "Net"])(
    "puts %s in the ranged slot", (weapon) => {
      const update = vi.fn();
      equipInventoryItem(fighter(), `${weapon} (Medium)`, update);
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ "Ranged Weapon": `${weapon} (Medium)` }));
    },
  );

  it("allows a non-light off-hand weapon with the larger SRD penalties", () => {
    const character = fighter();
    character.equipment["Main Weapon"] = "Dagger (Medium)";
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const update = vi.fn();
    equipInventoryItem(character, "Longsword (Medium)", update);
    expect(update).toHaveBeenCalledWith({ "Main Weapon": "Dagger (Medium)", "Off Hand Weapon": "Longsword (Medium)" });
  });

  it("normalizes two-handed variants and removes an incompatible off-hand weapon", () => {
    const character = fighter();
    character.equipment = { "Main Weapon": "Longsword (Medium)", "Off Hand Weapon": "Dagger (Medium)" };
    const update = vi.fn();
    equipInventoryItem(character, "Masterwork Greatsword (Medium)", update);
    expect(update).toHaveBeenCalledWith({ "Main Weapon": "Masterwork Greatsword (Medium)" });
    character.equipment = { "Main Weapon": "Greatsword (Medium)" };
    equipInventoryItem(character, "Dagger (Medium)", update);
    expect(update).toHaveBeenLastCalledWith({ "Main Weapon": "Dagger (Medium)" });
  });

  it("rejects an ordinary shield with an equipped two-handed weapon but allows a buckler", () => {
    const character = fighter();
    character.equipment = { "Main Weapon": "Greatsword (Medium)" };
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const update = vi.fn();
    equipInventoryItem(character, "Heavy Steel Shield (Medium)", update);
    expect(alert).toHaveBeenCalledWith(
      "A two-handed weapon requires both hands. Equip a buckler or unequip the weapon first.",
    );
    expect(update).not.toHaveBeenCalled();

    equipInventoryItem(character, "Buckler (Medium)", update);
    expect(update).toHaveBeenCalledWith({
      "Main Weapon": "Greatsword (Medium)",
      Shield: "Buckler (Medium)",
    });
  });

  it("allows bows with bucklers but rejects ordinary shields", () => {
    const character = fighter();
    character.equipment.Shield = "Heavy Steel Shield (Medium)";
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const update = vi.fn();
    equipInventoryItem(character, "Composite Longbow (Medium)", update);
    expect(alert).toHaveBeenCalledWith(
      "This ranged weapon requires both hands. Equip a buckler or unequip the shield first.",
    );
    expect(update).not.toHaveBeenCalled();

    character.equipment.Shield = "Buckler (Medium)";
    equipInventoryItem(character, "Composite Longbow (Medium)", update);
    expect(update).toHaveBeenCalledWith({
      Shield: "Buckler (Medium)",
      "Ranged Weapon": "Composite Longbow (Medium)",
    });
  });

  it("reports attempts to equip one copy of a weapon in both hands", () => {
    const character = fighter();
    character.equipment = { "Main Weapon": "Longsword (Medium)" };
    character.inventory = { "Longsword (Medium)": 1 };
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const update = vi.fn();
    equipInventoryItem(character, "Longsword (Medium)", update);
    expect(alert).toHaveBeenCalledWith("You only own one of this weapon, so it cannot be equipped in both hands.");
    expect(update).not.toHaveBeenCalled();
  });

  it("honors custom Light classification for Finesse, off-hand damage and penalties", () => {
    const name = "Combat Test Light Blade";
    addCustomStoreItems([{ name, category: "Weapons", custom: true, proficiency: "Simple", price: 1, weight: "1 lb.", handedness: "Light", damage: "1d6" }]);
    try {
      const character = fighter();
      character.featSelections = { "general-1": "weapon-finesse" };
      character.equipment = { "Main Weapon": "Longsword (Medium)", "Off Hand Weapon": `${name} (Medium)` };
      expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(-4);
      expect(getEquippedWeaponStats(character, `${name} (Medium)`, -8, "Off Hand Weapon"))
        .toMatchObject({ abilityAttackBonus: 4, damage: "1d6+1", attack: -3 });
    } finally {
      deleteCustomStoreItem(name);
    }
  });

  it("uses the same ranged classification when equipping through the store UI", async () => {
    const character = fighter();
    character.inventory = { "Composite Longbow (Medium)": 1 };
    const update = vi.fn();
    const user = userEvent.setup();
    render(<EquipmentStore character={character} onEquipmentChange={update}
      onInventoryChange={vi.fn()} onEquipmentAndInventoryChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(update).toHaveBeenCalledWith({ "Ranged Weapon": "Composite Longbow (Medium)" });
  });

  it("edits a composite bow's saved Strength rating from its equipment summary", () => {
    const character = fighter();
    const weaponKey = "Composite Longbow (Medium)";
    character.equipment["Ranged Weapon"] = weaponKey;
    const onRatingChange = vi.fn();
    render(<EquipmentSheet
      character={character}
      onEquipmentChange={vi.fn()}
      rangedTargetDistanceFeet={undefined}
      onRangedTargetDistanceFeetChange={vi.fn()}
      targetDamageReduction=""
      onTargetDamageReductionChange={vi.fn()}
      onMainWeaponGripChange={vi.fn()}
      onDoubleWeaponModeChange={vi.fn()}
      onDoubleWeaponPrimaryEndChange={vi.fn()}
      onTowerShieldTotalCoverChange={vi.fn()}
      onShieldBashModeChange={vi.fn()}
      onCompositeBowStrengthRatingChange={onRatingChange}
      onEquipmentAndInventoryChange={vi.fn()}
    />);
    const ratingInput = screen.getByRole("spinbutton", {
      name: "Ranged Weapon composite bow Strength rating",
    });
    fireEvent.change(ratingInput, { target: { value: "3" } });
    expect(onRatingChange).toHaveBeenCalledWith(weaponKey, 3);
  });
});

it("shows the same corrected off-hand damage and attacks on both sheets", async () => {
  const character = fighter();
  character.equipment = { "Main Weapon": "+2 Longsword (Medium)", "Off Hand Weapon": "Dagger (Medium)" };
  character.featSelections = { "general-1": "two-weapon-fighting" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const user = userEvent.setup();
  const { container } = render(<App />);
  const combat = container.querySelector(".combat-weapon-row");
  if (!(combat instanceof HTMLElement)) throw new Error("Missing character weapon summary.");
  expect(within(combat).getByText("Damage 1d8+5")).toBeDefined();
  expect(within(combat).getByText("Damage 1d4+1")).toBeDefined();
  expect(within(combat).getByText("Attack +4")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Equipment" }));
  await screen.findByText("Weapon Attacks");
  expect(screen.getByText("Damage: 1d4+1 (piercing or slashing)")).toBeDefined();
  expect(screen.getByText("Attack: +4 (+1 base, +3 ability, +0 size, +2 enhancement, -2 two-weapon)")).toBeDefined();
});

it("saves the main-weapon grip and returns to one hand when an ordinary shield is equipped", async () => {
  const character = fighter();
  character.equipment = { "Main Weapon": "Longsword (Medium)" };
  character.mainWeaponGrip = "two-handed";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Equipment" }));
  const grip = await screen.findByRole("combobox", { name: "Main weapon grip" });
  if (!(grip instanceof HTMLSelectElement)) throw new Error("Missing main-weapon grip selector.");
  expect(grip.value).toBe("two-handed");
  await user.type(screen.getByRole("textbox", { name: "Shield equipment" }), "Heavy Steel Shield (Medium)");
  expect(grip.value).toBe("one-handed");
});

it("offers a saved double-weapon mode and displays the off-hand end", async () => {
  const character = fighter();
  character.equipment = { "Main Weapon": "Dwarven Urgrosh (Medium)" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Equipment" }));
  const mode = await screen.findByRole("checkbox", { name: "Use both ends of the double weapon" });
  if (!(mode instanceof HTMLInputElement)) throw new Error("Missing double-weapon mode control.");
  await user.click(mode);
  expect(mode.checked).toBe(true);
  expect(await screen.findByText("Damage: 1d6+1 (piercing)")).toBeDefined();
  expect(screen.getByRole("combobox", { name: "Double weapon primary end" })).toBeDefined();
});

it("explains when an equipped weapon is unusable because of its size", () => {
  const character = fighter();
  character.equipment = { "Main Weapon": "Greatsword (Large)" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);
  expect(screen.getByText("Cannot wield: incompatible weapon size")).toBeDefined();
});

it("applies selected target-specific racial bonuses to attack and AC", async () => {
  const character = fighter();
  character.race = "Dwarf";
  character.equipment = { "Main Weapon": "Longsword (Medium)" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const user = userEvent.setup();
  const { container } = render(<App />);
  const weaponRow = container.querySelector(".combat-weapon-row");
  if (!(weaponRow instanceof HTMLElement)) throw new Error("Missing character weapon summary.");
  expect(within(weaponRow).getByText("Attack +4")).toBeDefined();
  const armorClassValue = () => container.querySelector(".combat-panel .stat strong")?.textContent;
  expect(armorClassValue()).toBe("14");

  await user.click(screen.getByText("Apply target-specific racial bonuses"));
  await user.click(await screen.findByRole("checkbox", { name: "Orc or half-orc" }));
  expect(within(weaponRow).getByText("Attack +5")).toBeDefined();
  await user.click(screen.getByRole("checkbox", { name: "Giant (type)" }));
  expect(armorClassValue()).toBe("18");
});

it("stacks sheet columns independently and keeps empty weapon slots compact", () => {
  const character = fighter();
  character.equipment = { "Main Weapon": "Dagger (Medium)" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  expect(container.querySelector(".sheet-primary-column > .ability-panel")).not.toBeNull();
  expect(container.querySelector(".sheet-primary-column > .attacks-panel")).not.toBeNull();
  expect(container.querySelector(".sheet-primary-column > .languages-panel")).not.toBeNull();
  expect(container.querySelector(".sheet-secondary-column > .combat-panel")).not.toBeNull();
  expect(container.querySelector(".sheet-secondary-column > .saving-throws-panel")).not.toBeNull();
  expect(container.querySelectorAll(".unequipped-weapon")).toHaveLength(2);
  expect(container.querySelectorAll(".combat-weapon-stat strong")).toHaveLength(1);
  expect(screen.getByText("Damage 1d4+3")).toBeDefined();
  expect(container.querySelector(".ability-card .score-breakdown")).toBeNull();
  expect(container.querySelectorAll(".saving-throws-grid .stat-detail")).toHaveLength(3);
  expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
});

it("shows attack, damage, and critical values for all three equipped weapon slots", () => {
  const character = fighter();
  character.equipment = {
    "Main Weapon": "Longsword (Medium)",
    "Off Hand Weapon": "Dagger (Medium)",
    "Ranged Weapon": "Longbow (Medium)",
  };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  expect(container.querySelectorAll(".unequipped-weapon")).toHaveLength(0);
  const rows = container.querySelectorAll(".combat-weapon-stat");
  expect(rows).toHaveLength(3);
  for (const row of rows) {
    expect(row.textContent).toContain("Attack ");
    expect(row.textContent).toContain("Damage ");
    expect(row.textContent).toContain("Crit ");
  }
});

describe("touch, flat-footed, and grapple statistics", () => {
  it("removes enhanced armor and shields only from touch AC, retaining the armor Dexterity cap", () => {
    const character = fighter(16, 18);
    character.equipment = { Armor: "+2 Full Plate (Medium)", Shield: "+1 Heavy Steel Shield (Medium)" };
    expect(getArmorClassValues(character)).toMatchObject({ normal: 24, touch: 11, flatFooted: 23 });
    expect(getEquipmentArmorClass(character)).toBe(24);
  });

  describe("compact weapon and movement details", () => {
    it.each([
      [1, [4]], [5, [8]], [6, [9, 4]], [10, [13, 8]],
      [11, [14, 9, 4]], [15, [18, 13, 8]], [16, [19, 14, 9, 4]],
      [20, [23, 18, 13, 8]],
    ])("grants the correct BAB iteratives at fighter level %s", (level, attacks) => {
      const character = fighter();
      character.classLevels = [{ classId: "fighter", level }];
      expect(getEquippedWeaponStats(character, "Longsword (Medium)")?.attackSequence).toEqual(attacks);
    });

    it("uses multiclass BAB, not character level or total attack bonus, for iteratives", () => {
      const character = fighter();
      character.classLevels = [{ classId: "fighter", level: 4 }, { classId: "wizard", level: 4 }];
      expect(getEquippedWeaponStats(character, "+5 Longsword (Medium)")?.attackSequence).toEqual([14, 9]);
      expect(getEquippedWeaponStats(character, "Dagger (Medium)", -8, "Off Hand Weapon")?.attackSequence).toEqual([1]);
      character.classLevels = [{ classId: "wizard", level: 5 }];
      expect(getEquippedWeaponStats(character, "+5 Longsword (Medium)")?.attackSequence).toEqual([6]);
    });

    it.each([
      ["Longbow", "100 ft."], ["Composite Longbow", "110 ft."],
      ["Masterwork Shortbow", "60 ft."], ["Repeating Heavy Crossbow", "120 ft."],
      ["Dagger", "10 ft."], ["Spear", "20 ft."], ["Javelin", "30 ft."],
    ])("shows the standard range increment for %s", (weapon, increment) => {
      expect(getEquippedWeaponStats(fighter(), `${weapon} (Medium)`)?.rangeIncrement).toBe(increment);
    });

    it("applies range penalties at increment boundaries and enforces projectile maximum range", () => {
      const character = fighter();
      const rangedWeapon = (distance: number) =>
        getEquippedWeaponStats(character, "Longbow (Medium)", 0, "Ranged Weapon", [], distance)!;
      const baseline = getEquippedWeaponStats(character, "Longbow (Medium)", 0, "Ranged Weapon")!;
      expect(rangedWeapon(99)).toMatchObject({
        rangeAttackPenalty: 0,
        maximumRangeFeet: 1000,
        rangeOutOfRange: false,
      });
      expect(rangedWeapon(100).rangeAttackPenalty).toBe(-2);
      expect(rangedWeapon(101)).toMatchObject({
        rangeAttackPenalty: -2,
        attack: baseline.attack - 2,
        attackSequence: baseline.attackSequence.map((attack) => attack - 2),
      });
      expect(rangedWeapon(200).rangeAttackPenalty).toBe(-4);
      expect(rangedWeapon(201).rangeAttackPenalty).toBe(-4);
      expect(rangedWeapon(1000).rangeOutOfRange).toBe(false);
      expect(rangedWeapon(1001)).toMatchObject({
        rangeOutOfRange: true,
        attackSequence: [],
        rangeStatusMessage: "Out of range: 1001 ft. exceeds the 1000 ft. maximum.",
      });
    });

    it("limits thrown weapons to five increments and does not penalize melee use", () => {
      const character = fighter();
      expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Ranged Weapon", [], 25))
        .toMatchObject({ rangeAttackPenalty: -4, maximumRangeFeet: 50, rangeOutOfRange: false });
      expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Ranged Weapon", [], 51))
        .toMatchObject({ rangeOutOfRange: true, attackSequence: [] });
      expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Main Weapon", [], 100))
        .toMatchObject({ rangeAttackPenalty: 0, rangeOutOfRange: false });
    });

    it("checks packaged ammunition and reports crossbow and sling reload actions", () => {
      const character = fighter();
      expect(getEquippedWeaponStats(character, "Longbow (Medium)", 0, "Ranged Weapon"))
        .toMatchObject({
          ammunitionStatus: { status: "missing", message: "No compatible arrows in inventory." },
          reloadNote: "Drawing an arrow is a free action.",
        });
      character.inventory = { "Crossbow Bolts (10)": 1 };
      expect(getEquippedWeaponStats(character, "Longbow (Medium)", 0, "Ranged Weapon")?.ammunitionStatus)
        .toMatchObject({ status: "missing" });
      character.inventory["Masterwork Arrows (20)"] = 2;
      expect(getEquippedWeaponStats(character, "Longbow (Medium)", 0, "Ranged Weapon")?.ammunitionStatus)
        .toMatchObject({ status: "ready", message: expect.stringContaining("2 packages") });
      expect(getEquippedWeaponStats(character, "Light Crossbow (Medium)", 0, "Ranged Weapon"))
        .toMatchObject({
          ammunitionStatus: { status: "ready" },
          reloadNote: "Reload after each shot: move action; provokes an attack of opportunity.",
        });
      expect(getEquippedWeaponStats(character, "Heavy Crossbow (Medium)", 0, "Ranged Weapon")?.reloadNote)
        .toBe("Reload after each shot: full-round action; provokes an attack of opportunity.");
      expect(getEquippedWeaponStats(character, "Repeating Heavy Crossbow (Medium)", 0, "Ranged Weapon")?.reloadNote)
        .toBe("Magazine holds 5 bolts; loading a new case is a full-round action. Shots are not tracked.");
      character.inventory["Sling Bullets (10)"] = 1;
      expect(getEquippedWeaponStats(character, "Sling (Medium)", 0, "Ranged Weapon"))
        .toMatchObject({
          ammunitionStatus: { status: "ready" },
          reloadNote: "Load after each shot: move action; provokes an attack of opportunity.",
        });
      expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Ranged Weapon")?.ammunitionStatus)
        .toBeUndefined();
    });

    it("evaluates single-material DR against weapons and available ammunition", () => {
      const character = fighter();
      expect(getEquippedWeaponStats(
        character, "Cold Iron Longsword (Medium)", 0, "Main Weapon", [], undefined, "5/cold iron",
      )?.damageReductionStatus).toMatchObject({ status: "bypassed" });
      expect(getEquippedWeaponStats(
        character, "Longsword (Medium)", 0, "Main Weapon", [], undefined, "5/cold iron",
      )?.damageReductionStatus).toMatchObject({ status: "applies" });
      expect(getEquippedWeaponStats(
        character, "Longsword (Medium)", 0, "Main Weapon", [], undefined, "5/cold iron and magic",
      )?.damageReductionStatus).toMatchObject({ status: "manual" });

      character.inventory = { "Masterwork Arrows (20) (Medium)": 1 };
      expect(getEquippedWeaponStats(
        character, "Longbow (Medium)", 0, "Ranged Weapon", [], undefined, "5/silver",
      )?.damageReductionStatus).toMatchObject({ status: "applies" });
      character.inventory = { "Silver Arrows (20) (Medium)": 1 };
      expect(getEquippedWeaponStats(
        character, "Longbow (Medium)", 0, "Ranged Weapon", [], undefined, "5/silver",
      )?.damageReductionStatus).toMatchObject({
        status: "bypassed",
        message: expect.stringContaining("ammunition selection is manual"),
      });
    });

    it("applies the alchemical-silver damage penalty and custom weapon material metadata", () => {
      const silverDagger = getEquippedWeaponStats(fighter(), "Silver Dagger (Medium)", 0, "Main Weapon");
      expect(silverDagger).toMatchObject({
        damage: "1d4+2",
        materialDamageNote: "Alchemical silver: -1 damage (minimum 1).",
      });
      const name = "Combat Test Adamantine Blade";
      addCustomStoreItems([{
        name, category: "Weapons", custom: true, proficiency: "Simple", price: 1,
        weight: "1 lb.", handedness: "One-handed", damage: "1d8", material: "adamantine",
      }]);
      try {
        expect(getEquippedWeaponStats(
          fighter(), `${name} (Medium)`, 0, "Main Weapon", [], undefined, "5/adamantine",
        )?.damageReductionStatus).toMatchObject({ status: "bypassed" });
      } finally {
        deleteCustomStoreItem(name);
      }
    });

    it("distinguishes a thrown increment from a ranged-slot attack", () => {
      const halfling = fighter();
      halfling.race = "Halfling";
      expect(getEquippedWeaponStats(halfling, "Dagger (Small)")?.rangeLabel).toBe("Thrown increment");
      expect(getEquippedWeaponStats(halfling, "Dagger (Small)", 0, "Ranged Weapon"))
        .toMatchObject({ rangeLabel: "Range increment", reach: undefined });
      expect(getEquippedWeaponStats(fighter(), "Longsword (Medium)")?.rangeIncrement).toBeUndefined();
    });

    it("honors custom size ranges and explicit reach without inventing a custom range", () => {
      const item = { name: "Custom reach blade", category: "Weapons", price: 1, weight: "1 lb.",
        custom: true, rangeIncrement: "30 ft.", rangeSmall: "20 ft.", rangeLarge: "40 ft.", reach: "15 ft." } as const;
      expect(getWeaponRangeForSize(item, "Small")).toBe("20 ft.");
      expect(getWeaponRangeForSize(item, "Medium")).toBe("30 ft.");
      expect(getWeaponRangeForSize(item, "Large")).toBe("40 ft.");
      expect(getWeaponReach(fighter(), item)).toBe("15 ft.");
      expect(getWeaponRangeForSize({ ...item, rangeMedium: "35 ft." }, "Medium")).toBe("35 ft.");
      expect(getWeaponRangeForSize({ ...item, rangeIncrement: undefined, rangeSmall: undefined }, "Small")).toBeUndefined();
    });

    it("uses natural size, not weapon size, for reach and distinguishes special weapons", () => {
      const character = fighter();
      character.race = "Halfling";
      expect(getCombatSpace(character)).toEqual({ space: 5, reach: 5 });
      expect(getEquippedWeaponStats(character, "Glaive (Small)")?.reach).toBe("10 ft. (not within normal reach)");
      expect(getEquippedWeaponStats(character, "Spiked Chain (Small)")?.reach).toBe("10 ft. (also within normal reach)");
      expect(getEquippedWeaponStats(character, "Whip (Small)")?.reach).toBe("15 ft. (does not threaten)");
      expect(getEquippedWeaponStats(character, "Halberd (Small)")?.reach).toBe("5 ft.");
      raceDefinitions["test-large"] = { id: "test-large", name: "Test Large", source: "core-35-srd", size: "Large", abilityModifiers: {} };
      try {
        character.race = "Test Large";
        expect(getCombatSpace(character)).toEqual({ space: 10, reach: 10 });
        expect(getEquippedWeaponStats(character, "Glaive (Large)")?.reach).toBe("20 ft. (not within normal reach)");
      } finally {
        delete raceDefinitions["test-large"];
      }
    });

    it("shows matching full attacks, range and load details on both screens and flags unknown weights", async () => {
      const character = fighter();
      character.classLevels = [{ classId: "fighter", level: 6 }];
      character.equipment = { "Ranged Weapon": "Longbow (Medium)" };
      character.inventory = { "Unrecorded statue": 1 };
      window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
      const user = userEvent.setup();
      render(<App />);
      expect(screen.getByText("Attack +10 / +5")).toBeDefined();
      expect(screen.getByText("Range increment 100 ft.")).toBeDefined();
      const movement = screen.getByRole("group", { name: "Space, reach, and load" });
      expect(movement.textContent).toContain("Light load (known weights)");
      expect(movement.textContent).toContain("3 lb. / 76 lb. light limit");
      await user.click(screen.getByRole("button", { name: "Equipment" }));
      await screen.findByText("EQUIPMENT SLOTS");
      expect(screen.getByText("BAB full attack: +10 / +5")).toBeDefined();
      expect(screen.getByText("Range increment: 100 ft.")).toBeDefined();
      expect(screen.getByRole("group", { name: "Space, reach, and load" }).textContent).toBe(movement.textContent);
    });

    it("applies the selected target distance consistently on both sheets", async () => {
      const character = fighter();
      character.classLevels = [{ classId: "fighter", level: 6 }];
      character.equipment = { "Ranged Weapon": "Longbow (Medium)" };
      character.inventory = { "Silver Arrows (20) (Medium)": 1 };
      window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("spinbutton", { name: "Target distance (ft.)" }), "150");
      await user.type(screen.getByRole("textbox", { name: "Target damage reduction" }), "5/silver");
      expect(screen.getByText("Attack +8 / +3")).toBeDefined();
      expect(screen.getByText("Maximum range 1000 ft.")).toBeDefined();
      expect(screen.getByText("At 150 ft.: -2 range penalty.")).toBeDefined();
      expect(screen.getByText(/DR 5\/silver can be bypassed with Silver Arrows/)).toBeDefined();
      await user.click(screen.getByRole("button", { name: "Equipment" }));
      await screen.findByText("EQUIPMENT SLOTS");
      expect(screen.getByText("BAB full attack: +8 / +3")).toBeDefined();
      expect(screen.getByText("At 150 ft.: -2 range penalty.")).toBeDefined();
      expect(screen.getByText(/DR 5\/silver can be bypassed with Silver Arrows/)).toBeDefined();
    });

    it("shows missing ammunition and reload requirements on both sheets", async () => {
      const character = fighter();
      character.equipment = { "Ranged Weapon": "Light Crossbow (Medium)" };
      window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
      const user = userEvent.setup();
      render(<App />);
      expect(screen.getByText("No compatible bolts in inventory.")).toBeDefined();
      expect(screen.getByText("Reload after each shot: move action; provokes an attack of opportunity.")).toBeDefined();
      await user.click(screen.getByRole("button", { name: "Equipment" }));
      await screen.findByText("EQUIPMENT SLOTS");
      expect(screen.getByText("No compatible bolts in inventory.")).toBeDefined();
      expect(screen.getByText("Reload after each shot: move action; provokes an attack of opportunity.")).toBeDefined();
    });
  });

  it("retains negative Dexterity for flat-footed AC and excludes bracers from touch", () => {
    const character = fighter(16, 7);
    character.equipment = { Arms: "Bracers of Armor +3" };
    expect(getArmorClassValues(character)).toMatchObject({ normal: 11, touch: 8, flatFooted: 11 });
  });

  it("retains load Dexterity limits for touch and uses the separate grapple size scale", () => {
    const character = fighter(10, 18);
    character.inventory = { "Backpack": 40 };
    expect(getArmorClassValues(character).touch).toBe(11);
    character.inventory = {};
    character.race = "Halfling";
    expect(getArmorClassValues(character)).toMatchObject({ normal: 15, touch: 15, flatFooted: 11 });
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: 2, rangedTouch: 6, grapple: -3 });
  });

  it.each([{ classId: "barbarian", level: 2 }, { classId: "rogue", level: 4 }] as const)(
    "retains positive Dexterity while flat-footed with $classId Uncanny Dodge", (classLevel) => {
      const character = fighter();
      character.classLevels = [classLevel];
      expect(getArmorClassValues(character)).toMatchObject({ normal: 14, flatFooted: 14, retainsDexterity: true });
    },
  );

  it("uses Strength for grapple and applies Improved Grapple without weapon bonuses", () => {
    const character = fighter();
    character.equipment = { "Main Weapon": "+5 Longsword (Medium)", "Off Hand Weapon": "Dagger (Medium)" };
    character.featSelections = { "general-1": "improved-grapple" };
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: 4, rangedTouch: 5, grapple: 8 });
  });

  it("uses Weapon Finesse only for melee touch, including shield and nonproficiency penalties", () => {
    const character = fighter(10, 18);
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.equipment = { Shield: "Heavy Steel Shield (Medium)" };
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: 0, rangedTouch: 2, grapple: -2 });
    character.equipment.Shield = "Tower Shield (Medium)";
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: -12, rangedTouch: -8, grapple: -10 });
  });

  it("applies the tower-shield attack penalty without treating a grapple as an attack roll", () => {
    const character = fighter();
    const baseWeaponAttack = getEquippedWeaponStats(character, "Longsword (Medium)");
    const baseSpecialAttacks = getSpecialAttackBonuses(character);
    character.equipment.Shield = "Tower Shield (Medium)";
    expect(getEquippedWeaponStats(character, "Longsword (Medium)"))
      .toMatchObject({ towerShieldAttackPenalty: -2, attack: baseWeaponAttack!.attack - 2 });
    const towerSpecialAttacks = getSpecialAttackBonuses(character);
    expect(towerSpecialAttacks.meleeTouch).toBe(baseSpecialAttacks.meleeTouch - 2);
    expect(towerSpecialAttacks.rangedTouch).toBe(baseSpecialAttacks.rangedTouch - 2);
    expect(towerSpecialAttacks.grapple).toBe(baseSpecialAttacks.grapple);
  });

  it("uses a tower shield for total cover instead of its AC bonus and suppresses attacks", () => {
    const character = fighter();
    character.equipment = { Shield: "Tower Shield (Medium)", "Main Weapon": "Longsword (Medium)" };
    expect(getArmorClassValues(character).normal).toBe(18);
    character.towerShieldTotalCover = true;
    expect(getArmorClassValues(character)).toMatchObject({ normal: 14, towerShieldCoverActive: true });
    expect(getEquippedWeaponStats(character, "Longsword (Medium)")).toBeNull();
    expect(getSpecialAttackBonuses(character).towerShieldCoverActive).toBe(true);
  });

  it("calculates shield bashes as size-appropriate martial off-hand weapons", () => {
    const lightShieldCharacter = fighter();
    lightShieldCharacter.equipment = {
      "Main Weapon": "Longsword (Medium)",
      Shield: "Light Steel Shield (Medium)",
    };
    lightShieldCharacter.shieldBashMode = true;
    const lightBash = getEffectiveWeaponKey(lightShieldCharacter, "Off Hand Weapon");
    expect(lightBash).toBe("Light Shield Bash (Medium)");
    expect(getTwoWeaponAttackPenalty(lightShieldCharacter, "Main Weapon")).toBe(-4);
    expect(getTwoWeaponAttackPenalty(lightShieldCharacter, "Off Hand Weapon")).toBe(-8);
    expect(getEquippedWeaponStats(
      lightShieldCharacter,
      lightBash!,
      getTwoWeaponAttackPenalty(lightShieldCharacter, "Off Hand Weapon"),
      "Off Hand Weapon",
    )).toMatchObject({
      name: "Light Shield Bash",
      damage: "1d3+1",
      damageType: "bludgeoning",
      critical: "x2",
      enhancement: 0,
      damageAbility: 1,
      attackPenalty: -8,
    });
    expect(getArmorClassValues(lightShieldCharacter))
      .toMatchObject({ normal: 14, shieldBashACBonusLost: true });

    const heavyShieldCharacter = fighter();
    heavyShieldCharacter.equipment = {
      "Main Weapon": "Longsword (Medium)",
      Shield: "+2 Heavy Steel Shield (Medium)",
    };
    heavyShieldCharacter.shieldBashMode = true;
    const heavyBash = getEffectiveWeaponKey(heavyShieldCharacter, "Off Hand Weapon");
    expect(heavyBash).toBe("Heavy Shield Bash (Medium)");
    expect(getTwoWeaponAttackPenalty(heavyShieldCharacter, "Main Weapon")).toBe(-6);
    expect(getTwoWeaponAttackPenalty(heavyShieldCharacter, "Off Hand Weapon")).toBe(-10);
    expect(getEquippedWeaponStats(
      heavyShieldCharacter,
      heavyBash!,
      getTwoWeaponAttackPenalty(heavyShieldCharacter, "Off Hand Weapon"),
      "Off Hand Weapon",
    )).toMatchObject({
      damage: "1d4+1",
      damageType: "bludgeoning",
      critical: "x2",
      enhancement: 0,
      attackPenalty: -10,
    });
    expect(getArmorClassValues(heavyShieldCharacter))
      .toMatchObject({ normal: 14, shieldBashACBonusLost: true });
  });

  it("rejects buckler and tower shield bashes and scales small shield damage", () => {
    const character = fighter();
    character.race = "Halfling";
    character.equipment = { Shield: "Light Steel Shield (Small)" };
    character.shieldBashMode = true;
    const smallBash = getEffectiveWeaponKey(character, "Off Hand Weapon");
    expect(smallBash).toBe("Light Shield Bash (Small)");
    expect(getEquippedWeaponStats(character, smallBash!, 0, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d2+1", effectiveHandedness: "light" });

    character.equipment.Shield = "Buckler (Small)";
    expect(getShieldBashState(character)).toMatchObject({ canBash: false, enabled: false });
    expect(getEffectiveWeaponKey(character, "Off Hand Weapon")).toBeUndefined();
    character.equipment.Shield = "Tower Shield (Small)";
    expect(getShieldBashState(character)).toMatchObject({ canBash: false, enabled: false });
    expect(getEffectiveWeaponKey(character, "Off Hand Weapon")).toBeUndefined();
  });

  it("adds shield spikes as a size-increased piercing bash without changing shield handling", () => {
    const lightItem = getInventoryEntryDetails("Light Steel Shield with Spikes (Medium)");
    expect(lightItem).toMatchObject({ category: "Shields", price: 19, weight: "11 lb." });

    const lightCharacter = fighter();
    lightCharacter.equipment = {
      "Main Weapon": "Longsword (Medium)",
      Shield: "Light Steel Shield with Spikes (Medium)",
    };
    lightCharacter.shieldBashMode = true;
    const lightBash = getEffectiveWeaponKey(lightCharacter, "Off Hand Weapon");
    expect(lightBash).toBe("Spiked Light Shield Bash (Medium)");
    expect(getTwoWeaponAttackPenalty(lightCharacter, "Main Weapon")).toBe(-4);
    expect(getTwoWeaponAttackPenalty(lightCharacter, "Off Hand Weapon")).toBe(-8);
    expect(getEquippedWeaponStats(
      lightCharacter,
      lightBash!,
      getTwoWeaponAttackPenalty(lightCharacter, "Off Hand Weapon"),
      "Off Hand Weapon",
    )).toMatchObject({
      damage: "1d4+1",
      damageType: "piercing",
      critical: "x2",
      effectiveHandedness: "light",
      enhancement: 0,
    });
    expect(getArmorClassValues(lightCharacter))
      .toMatchObject({ normal: 14, shieldBashACBonusLost: true });

    const heavyCharacter = fighter();
    heavyCharacter.equipment = {
      "Main Weapon": "Longsword (Medium)",
      Shield: "+2 Heavy Steel Shield with Spikes (Medium)",
    };
    heavyCharacter.shieldBashMode = true;
    const heavyBash = getEffectiveWeaponKey(heavyCharacter, "Off Hand Weapon");
    expect(heavyBash).toBe("Spiked Heavy Shield Bash (Medium)");
    expect(getTwoWeaponAttackPenalty(heavyCharacter, "Main Weapon")).toBe(-6);
    expect(getTwoWeaponAttackPenalty(heavyCharacter, "Off Hand Weapon")).toBe(-10);
    expect(getEquippedWeaponStats(
      heavyCharacter,
      heavyBash!,
      getTwoWeaponAttackPenalty(heavyCharacter, "Off Hand Weapon"),
      "Off Hand Weapon",
    )).toMatchObject({
      damage: "1d6+1",
      damageType: "piercing",
      critical: "x2",
      effectiveHandedness: "one-handed",
      enhancement: 0,
    });
    expect(getArmorClassValues(heavyCharacter))
      .toMatchObject({ normal: 14, shieldBashACBonusLost: true });

    const smallCharacter = fighter();
    smallCharacter.race = "Halfling";
    smallCharacter.equipment = { Shield: "Light Steel Shield with Spikes (Small)" };
    smallCharacter.shieldBashMode = true;
    const smallBash = getEffectiveWeaponKey(smallCharacter, "Off Hand Weapon");
    expect(getEquippedWeaponStats(smallCharacter, smallBash!, 0, "Off Hand Weapon"))
      .toMatchObject({ damage: "1d3+1", damageType: "piercing" });
  });

  it("lets a character activate tower-shield cover from Equipment and reports its duration", async () => {
    const character = fighter();
    character.equipment = { Shield: "Tower Shield (Medium)", "Main Weapon": "Longsword (Medium)" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Equipment" }));
    const cover = await screen.findByRole("checkbox", { name: "Use tower shield for total cover" });
    await user.click(cover);
    expect(cover instanceof HTMLInputElement && cover.checked).toBe(true);
    expect(await screen.findByText(/Total cover lasts until the start of your next turn/)).toBeDefined();
    expect(screen.getByText("Unavailable while using tower shield for total cover")).toBeDefined();
    expect(screen.getByText("Total cover via tower shield; no attacks until the start of your next turn.")).toBeDefined();
    const shieldSlot = screen.getByRole("heading", { name: "Shield" }).parentElement;
    if (!(shieldSlot instanceof HTMLElement)) throw new Error("Missing shield equipment slot.");
    await user.click(within(shieldSlot).getByRole("button", { name: "Unequip" }));
    expect(screen.queryByRole("checkbox", { name: "Use tower shield for total cover" })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null").towerShieldTotalCover).toBe(false);
  });

  it("lets a character toggle shield bash in Equipment and clears it when the shield is removed", async () => {
    const character = fighter();
    character.equipment = {
      Shield: "Light Steel Shield (Medium)",
      "Main Weapon": "Longsword (Medium)",
    };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Equipment" }));
    const bash = await screen.findByRole("checkbox", { name: "Use shield bash" });
    await user.click(bash);
    expect(bash instanceof HTMLInputElement && bash.checked).toBe(true);
    expect(await screen.findByText(/shield's AC bonus is lost until your next action/)).toBeDefined();
    expect(screen.getByText("Shield AC bonus lost until your next action after a shield bash.")).toBeDefined();

    const shieldSlot = screen.getByRole("heading", { name: "Shield" }).parentElement;
    if (!(shieldSlot instanceof HTMLElement)) throw new Error("Missing shield equipment slot.");
    await user.click(within(shieldSlot).getByRole("button", { name: "Unequip" }));
    expect(screen.queryByRole("checkbox", { name: "Use shield bash" })).toBeNull();
  });

  it("shares defenses and special attacks across character and equipment screens without saving derived values", async () => {
    const character = fighter();
    character.equipment = { Armor: "Full Plate (Medium)" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("Touch 11")).toBeDefined();
    expect(screen.getByText("Flat-footed 18")).toBeDefined();
    const strip = screen.getByRole("group", { name: "Touch attacks and grapple" });
    expect(within(strip).getByText("Melee touch")).toBeDefined();
    expect(within(strip).getByText("Grapple")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    expect(screen.getByText("Touch 11")).toBeDefined();
    expect(screen.getByText("Flat-footed 18")).toBeDefined();
    expect(screen.getByRole("group", { name: "Touch attacks and grapple" }).textContent).toBe(strip.textContent);
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
  });
});
