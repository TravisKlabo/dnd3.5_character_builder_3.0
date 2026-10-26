import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { carryingCapacity, cloneCharacter, initialCharacter } from "../src/domain";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { getArmorClassRestrictions, getCarriedWeight, getEncumbrance, getEquipmentArmorClass,
  getMovement, getSkillCheckModifier, getSkillCheckPenalties } from "../src/rules";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

function hero(weight = 0) {
  const character = cloneCharacter(initialCharacter);
  character.abilities.str = 10;
  character.abilities.dex = 18;
  character.inventory = { "Load test ballast": weight };
  return character;
}

function withBallast(run: () => void) {
  addCustomStoreItems([{ name: "Load test ballast", category: "Adventuring Gear",
    price: 0, weight: "1 lb.", custom: true }]);
  try { run(); } finally { deleteCustomStoreItem("Load test ballast"); }
}

describe("SRD carrying capacity", () => {
  it.each([
    [1, 3, 6, 10], [2, 6, 13, 20], [10, 33, 66, 100], [14, 58, 116, 175],
    [19, 116, 233, 350], [24, 233, 466, 700], [29, 466, 933, 1400],
    [30, 532, 1064, 1600], [39, 1864, 3732, 5600], [40, 2128, 4256, 6400],
  ])("uses exact table capacities for Strength %s", (strength, light, medium, heavy) => {
    const character = hero();
    character.abilities.str = strength;
    expect(carryingCapacity(character)).toEqual({ light, medium, heavy });
  });

  it.each(["Halfling", "Gnome", "Kender"])("scales bipedal Small %s capacity and rounds down", (race) => {
    const character = hero();
    character.race = race;
    expect(carryingCapacity(character)).toEqual({ light: 24, medium: 49, heavy: 75 });
  });

  it.each([
    [0, "Light"], [33, "Light"], [33.5, "Medium"], [66, "Medium"],
    [66.5, "Heavy"], [100, "Heavy"], [100.5, "Overloaded"],
  ])("classifies %s lb. at the exact threshold as %s", (weight, load) => withBallast(() => {
    expect(getEncumbrance(hero(weight)).load).toBe(load);
  }));

  it("counts equipped gear once, counts missing equipped copies, and respects size and quantity", () => {
    const character = hero();
    character.inventory = { "Chainmail (Medium)": 1, "Dagger (Small)": 2 };
    character.equipment = { Armor: "Chainmail", "Main Weapon": "Dagger (Small)", "Off Hand Weapon": "Dagger (Small)" };
    expect(getCarriedWeight(character)).toBe(41);
    character.inventory = {};
    expect(getCarriedWeight(character)).toBe(41);
  });

  it("reports unknown weights rather than claiming an exact load", () => {
    const character = hero();
    character.inventory = { "Unrecorded statue": 1, "Ring of Sustenance": 1 };
    expect(getEncumbrance(character).unknownWeights).toEqual(["Unrecorded statue"]);
  });
});

describe("load, armor, AC, and movement", () => {
  it.each([
    [33, 0, 14, 30], [34, -3, 13, 20], [67, -6, 11, 20],
    [101, -6, 10, 5], [200, -6, 10, 5], [201, -6, 10, 0],
  ])("applies %s lb. to skills, AC, and speed", (weight, penalty, ac, speed) => withBallast(() => {
    const character = hero(weight);
    expect(getSkillCheckModifier(character, "Hide")).toBe(4 + penalty);
    expect(getSkillCheckModifier(character, "Swim")).toBe(penalty * 2);
    expect(getEquipmentArmorClass(character)).toBe(ac);
    expect(getMovement(character).speed).toBe(speed);
    expect(getSkillCheckModifier(character, "Listen")).toBe(0);
    expect(getSkillCheckModifier(character, "Tumble")).toBeNull();
  }));

  it("uses the worse check penalty instead of stacking load with armor and shield", () => withBallast(() => {
    const character = hero(35);
    character.equipment = { Armor: "Chain Shirt", Shield: "Buckler" };
    // 65 lb.: medium load -3 ties armor -2 + shield -1.
    expect(getEncumbrance(character).load).toBe("Medium");
    expect(getSkillCheckPenalties(character, "Hide").map((entry) => entry.source)).toEqual(["armor", "shield"]);
    expect(getSkillCheckModifier(character, "Hide")).toBe(1);
    character.inventory["Load test ballast"] = 40;
    expect(getEncumbrance(character).load).toBe("Heavy");
    expect(getSkillCheckPenalties(character, "Hide")).toMatchObject([{ source: "load", penalty: -6 }]);
    expect(getSkillCheckModifier(character, "Hide")).toBe(-2);
    character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
    character.inventory["Load test ballast"] = 20;
    expect(getSkillCheckModifier(character, "Hide")).toBe(-3);
    expect(getSkillCheckModifier(character, "Swim")).toBe(-14);
  }));

  it("chooses the worst AC cap independently of the worst check penalty and keeps negative DEX", () => withBallast(() => {
    const character = hero(35);
    character.equipment.Armor = "Chain Shirt";
    expect(getEquipmentArmorClass(character)).toBe(17);
    expect(getArmorClassRestrictions(character)).toEqual(["Medium load: max DEX +3 to AC"]);
    character.equipment.Armor = "Full Plate";
    expect(getEquipmentArmorClass(character)).toBe(19);
    character.abilities.dex = 8;
    expect(getEquipmentArmorClass(character)).toBe(17);
    expect(getArmorClassRestrictions(character)).toEqual([]);
  }));

  it("does not reduce speed or add notices with light armor and a light load", () => {
    const character = hero();
    character.equipment.Armor = "Leather Armor";
    expect(getMovement(character)).toEqual({ baseSpeed: 30, speed: 30, causes: [] });
    expect(getArmorClassRestrictions(character)).toEqual([]);
    expect(getSkillCheckPenalties(character, "Hide")).toEqual([]);
  });

  it("uses mithral's lighter movement category without applying a second speed reduction", () => {
    const character = hero();
    character.equipment.Armor = "Mithral Breastplate";
    expect(getMovement(character).speed).toBe(30);
    character.equipment.Armor = "Mithral Full Plate";
    expect(getMovement(character).speed).toBe(20);
  });

  it("reduces Small base speed to 15 ft. but preserves dwarven speed under heavy armor/load", () => withBallast(() => {
    const character = hero(20);
    character.race = "Halfling";
    character.equipment.Armor = "Full Plate (Small)";
    expect(getMovement(character).speed).toBe(15);
    character.race = "Dwarf";
    character.equipment.Armor = "Full Plate";
    expect(getMovement(character)).toEqual({ baseSpeed: 20, speed: 20, causes: [] });
    expect(getSkillCheckModifier(character, "Hide")).toBe(-2);
    expect(getEquipmentArmorClass(character)).toBe(19);
    character.inventory["Load test ballast"] = 51;
    expect(getMovement(character).speed).toBe(5);
  }));

  it("updates immediately after removing carried weight", () => withBallast(() => {
    const character = hero(67);
    expect(getMovement(character).speed).toBe(20);
    character.inventory = {};
    expect(getEncumbrance(character).load).toBe("Light");
    expect(getMovement(character).speed).toBe(30);
    expect(getSkillCheckModifier(character, "Hide")).toBe(4);
    expect(getEquipmentArmorClass(character)).toBe(14);
  }));
});

it("uses the same load, AC, and speed on both sheets and preserves saved data", async () => {
  addCustomStoreItems([{ name: "Load test ballast", category: "Adventuring Gear", price: 0, weight: "1 lb.", custom: true }]);
  try {
    const character = hero(67);
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const { container } = render(<App />);
    const statValue = (label: string) => {
      const stat = screen.getByText(label, { selector: ".stat > small" }).parentElement;
      if (!stat) throw new Error(`Missing ${label} stat`);
      return within(stat).getByRole("strong").textContent;
    };
    expect(statValue("Armor Class")).toBe("11");
    expect(statValue("Speed")).toBe("20 ft.");
    expect(container.querySelector('[aria-label="Hide skill"] .skill-penalty')?.textContent).toBe("-6 load");
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    expect(statValue("Load")).toBe("Heavy");
    expect(statValue("Armor Class")).toBe("11");
    expect(statValue("Speed")).toBe("20 ft.");
    expect(screen.getByText("Carried Weight", { selector: ".stat > small" }).parentElement?.textContent).toContain("67 lb.");
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
  } finally {
    deleteCustomStoreItem("Load test ballast");
  }
});

it("shows an explicit missing-weight warning on the character sheet", () => {
  const character = hero();
  character.inventory = { "Unknown treasure": 1 };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);
  expect(screen.getByText(/Missing weight: Unknown treasure/).getAttribute("role")).toBe("status");
});
