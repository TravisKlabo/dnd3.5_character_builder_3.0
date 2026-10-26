import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type Character } from "../src/domain";
import { getArcaneSpellFailure, getSpellSaveDC } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { CastingSummary } from "../src/components/CastingSummary";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

function caster(): Character {
  const character = cloneCharacter(initialCharacter);
  character.classLevels = [{ classId: "wizard", level: 3 }, { classId: "cleric", level: 1 }];
  character.abilities.int = 16;
  character.abilities.wis = 14;
  character.abilities.con = 14;
  character.skills.Concentration = 4;
  return character;
}

describe("casting summary", () => {
  it("omits the panel for noncasters", () => {
    const { container } = render(<CastingSummary character={initialCharacter} onOpenSpells={vi.fn()} />);
    expect(container.childElementCount).toBe(0);
  });

  it("separates multiclass caster levels, abilities and spell DCs", () => {
    render(<CastingSummary character={caster()} onOpenSpells={vi.fn()} />);
    const wizard = within(screen.getByRole("group", { name: "Wizard casting summary" }));
    const cleric = within(screen.getByRole("group", { name: "Cleric casting summary" }));
    expect(wizard.getByText("3", { selector: "strong" })).toBeDefined();
    expect(wizard.getByText("INT 16")).toBeDefined();
    expect(wizard.getByText("DC 15")).toBeDefined();
    expect(cleric.getByText("WIS 14")).toBeDefined();
    expect(cleric.getByText("DC 13")).toBeDefined();
    expect(cleric.queryByText(/Arcane failure/)).toBeNull();
    expect(screen.getByText("+6")).toBeDefined();
    expect(getSpellSaveDC(caster(), "wizard", 2)).toBe(15);
    expect(getSpellSaveDC(caster(), "cleric", 1)).toBe(13);
  });

  it("does not advertise spell levels blocked by ability or lack of bonus slots", () => {
    const character = caster();
    character.classLevels = [{ classId: "paladin", level: 3 }];
    const view = render(<CastingSummary character={character} onOpenSpells={vi.fn()} />);
    expect(screen.getByText(/No castable spell levels/)).toBeDefined();
    character.classLevels = [{ classId: "paladin", level: 4 }];
    character.abilities.wis = 10;
    view.rerender(<CastingSummary character={character} onOpenSpells={vi.fn()} />);
    expect(screen.getByText(/No castable spell levels/)).toBeDefined();
    character.abilities.wis = 12;
    view.rerender(<CastingSummary character={character} onOpenSpells={vi.fn()} />);
    expect(screen.getByText("DC 12")).toBeDefined();
    expect(screen.queryByText(/No castable/)).toBeNull();
  });

  it.each([
    ["Chain Shirt (Medium)", "Heavy Steel Shield (Medium)", 35],
    ["+2 Masterwork Full Plate (Medium)", "Tower Shield (Medium)", 85],
    ["Mithral Breastplate (Medium)", "", 15],
    ["Mithral Full Plate (Medium)", "", 25],
    ["", "", 0],
  ])("adds spell failure from %s and %s", (armor, shield, percent) => {
    const character = caster();
    character.equipment = { Armor: armor, Shield: shield };
    expect(getArcaneSpellFailure(character, "wizard")?.percent).toBe(percent);
    expect(getArcaneSpellFailure(character, "cleric")).toBeUndefined();
  });

  it("applies the bard light-armor exception only to bard spells, never to shields", () => {
    const character = caster();
    character.equipment = { Armor: "Mithral Breastplate (Medium)", Shield: "Buckler (Medium)" };
    expect(getArcaneSpellFailure(character, "bard")?.percent).toBe(5);
    expect(getArcaneSpellFailure(character, "wizard")?.percent).toBe(20);
    character.equipment.Armor = "Breastplate (Medium)";
    expect(getArcaneSpellFailure(character, "bard")?.percent).toBe(30);
    expect(getArcaneSpellFailure(character, "sorcerer")?.percent).toBe(30);
  });

  it("honors custom values, caps at 100%, and explicitly identifies missing failure data", () => {
    const armorName = "Casting test armor";
    const shieldName = "Casting test shield";
    addCustomStoreItems([
      { name: armorName, category: "Armor", custom: true, price: 1, weight: "1 lb.", arcaneSpellFailure: 80 },
      { name: shieldName, category: "Shields", custom: true, price: 1, weight: "1 lb.", shieldSpellFailure: 40 },
    ]);
    try {
      const character = caster();
      character.equipment = { Armor: armorName, Shield: shieldName };
      expect(getArcaneSpellFailure(character, "wizard")?.percent).toBe(100);
      character.equipment.Armor = "Unrecorded armor";
      expect(getArcaneSpellFailure(character, "wizard")).toMatchObject({ percent: null });
      expect(getArcaneSpellFailure(character, "wizard")?.detail).toContain("Unrecorded armor: spell failure not recorded");
      render(<CastingSummary character={character} onOpenSpells={vi.fn()} />);
      expect(screen.getByText("Unknown")).toBeDefined();
    } finally {
      deleteCustomStoreItem(armorName);
      deleteCustomStoreItem(shieldName);
    }
  });

  it("opens existing spell controls and keeps the spell sheet's DCs and failure consistent", async () => {
    const character = caster();
    character.equipment = { Armor: "Mithral Breastplate (Medium)" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    expect(await screen.findByText("DC 15")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Manage spells" }));
    await screen.findByRole("tabpanel", { name: /Wizard/ });
    expect(screen.getByText("15%")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
    expect(screen.getByText("Save DC 15")).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
  });
});
