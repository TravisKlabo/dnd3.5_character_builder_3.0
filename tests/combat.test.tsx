import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { armorClass, carryingCapacity, cloneCharacter, initialCharacter, raceDefinitions, sizeModifier } from "../src/domain";
import { equipInventoryItem, getEquippedWeaponStats, getTwoWeaponAttackPenalty, getArmorClassValues, getEquipmentArmorClass, getSpecialAttackBonuses, getCombatSpace, getWeaponRangeForSize, getWeaponReach } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { EquipmentStore } from "../src/components/EquipmentStore";
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

  it.each(["Greatsword", "Greataxe", "Quarterstaff", "Spear"])(
    "adds one-and-a-half Strength bonus to a two-handed %s, rounding down", (weapon) => {
      expect(getEquippedWeaponStats(fighter(), `${weapon} (Medium)`)?.damageAbility).toBe(4);
    },
  );

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
    expect(getEquippedWeaponStats(character, "Dagger (Small)")?.abilityAttackBonus).toBe(1);
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
    addCustomStoreItems([{ name, category: "Weapons", custom: true, price: 1, weight: "1 lb.", handedness: "Light", damage: "1d6" }]);
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
      expect(getEquippedWeaponStats(character, "+5 Longsword (Medium)")?.attackSequence).toEqual([10]);
    });

    it.each([
      ["Longbow", "100 ft."], ["Composite Longbow", "110 ft."],
      ["Masterwork Shortbow", "60 ft."], ["Repeating Heavy Crossbow", "120 ft."],
      ["Dagger", "10 ft."], ["Spear", "20 ft."], ["Javelin", "30 ft."],
    ])("shows the standard range increment for %s", (weapon, increment) => {
      expect(getEquippedWeaponStats(fighter(), `${weapon} (Medium)`)?.rangeIncrement).toBe(increment);
    });

    it("distinguishes a thrown increment from a ranged-slot attack", () => {
      expect(getEquippedWeaponStats(fighter(), "Dagger (Small)")?.rangeLabel).toBe("Thrown increment");
      expect(getEquippedWeaponStats(fighter(), "Dagger (Small)", 0, "Ranged Weapon"))
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
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: -12, rangedTouch: -8, grapple: -12 });
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
