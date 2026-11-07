import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type Character } from "../src/domain";
import { getArcaneSpellFailure, getSpellSaveDC } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { CastingSummary } from "../src/components/CastingSummary";
import { savedCharacterStorageKey } from "../src/storage";
import { readStoredCharacter } from "./storageTestHelpers";
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
    const { container } = render(<CastingSummary character={initialCharacter} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
    expect(container.childElementCount).toBe(0);
  });

  it("shows Dragonlance Clerics the Medallion of Faith reminder", () => {
    const character = caster();
    const view = render(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
    expect(screen.queryByText(/Medallion of Faith/)).toBeNull();

    character.ruleset = "dragonlance-user-pack";
    view.rerender(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
    const cleric = within(screen.getByRole("group", { name: "Cleric casting summary" }));
    expect(cleric.getByRole("checkbox", { name: "Medallion of Faith present" })).toBeDefined();
    expect(cleric.getByText(/2d4 divine damage with no save or spell resistance/)).toBeDefined();
    expect(cleric.getByText(/tracks possession only; forced-removal damage remains manual/)).toBeDefined();
    expect(cleric.getByRole("checkbox", { name: "Medallion of Faith present" })).toBeDefined();
  });

  it("warns when a Dragonlance Cleric lacks a Medallion for spell levels above 3rd", () => {
    const character = caster();
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "cleric", level: 7 }];
    const onMedallionOfFaithChange = vi.fn();
    const view = render(
      <CastingSummary
        character={character}
        onOpenSpells={vi.fn()}
        onCombatCastingContextChange={vi.fn()}
        onMedallionOfFaithChange={onMedallionOfFaithChange}
      />,
    );
    const cleric = within(screen.getByRole("group", { name: "Cleric casting summary" }));
    expect(cleric.getByRole("alert").textContent).toContain("spell levels 4");

    fireEvent.click(cleric.getByRole("checkbox", { name: "Medallion of Faith present" }));
    expect(onMedallionOfFaithChange).toHaveBeenCalledWith(true);
    character.hasMedallionOfFaith = true;
    view.rerender(
      <CastingSummary
        character={character}
        onOpenSpells={vi.fn()}
        onCombatCastingContextChange={vi.fn()}
        onMedallionOfFaithChange={onMedallionOfFaithChange}
      />,
    );
    expect(cleric.queryByRole("alert")).toBeNull();
    expect((cleric.getByRole("checkbox", { name: "Medallion of Faith present" }) as HTMLInputElement).checked).toBe(true);
  });

  it("separates multiclass caster levels, abilities and spell DCs", () => {
    render(<CastingSummary character={caster()} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
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

  it("adds the Gnome racial DC bonus only to illusion spells", () => {
    const gnome = caster();
    gnome.race = "Gnome";
    expect(getSpellSaveDC(gnome, "wizard", 1)).toBe(14);
    expect(getSpellSaveDC(gnome, "wizard", 1, "Illusion (Figment)")).toBe(15);
    expect(getSpellSaveDC(gnome, "wizard", 1, "Evocation")).toBe(14);
  });

  it("applies Spell Focus only to spells of its selected school", () => {
    const character = caster();
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Figment)")).toBe(15);
    expect(getSpellSaveDC(character, "wizard", 1, "Evocation")).toBe(14);
    expect(getSpellSaveDC(character, "wizard", 1)).toBe(14);

    character.featSelections["human-1"] = "spell-focus";
    character.featSpellSchoolSelections["human-1"] = "Illusion";
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Figment)")).toBe(15);
    character.featSelections["human-1"] = "greater-spell-focus";
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Figment)")).toBe(16);
    character.featSpellSchoolSelections["human-1"] = "Evocation";
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Figment)")).toBe(15);
    expect(getSpellSaveDC(character, "wizard", 1, "Evocation")).toBe(14);

    character.featSelections = { "general-1": "greater-spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };
    expect(getSpellSaveDC(character, "wizard", 1, "Illusion (Figment)")).toBe(14);
  });

  it("does not advertise spell levels blocked by ability or lack of bonus slots", () => {
    const character = caster();
    character.classLevels = [{ classId: "paladin", level: 3 }];
    const view = render(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
    expect(screen.getByText(/No castable spell levels/)).toBeDefined();
    character.classLevels = [{ classId: "paladin", level: 4 }];
    character.abilities.wis = 10;
    view.rerender(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
    expect(screen.getByText(/No castable spell levels/)).toBeDefined();
    character.abilities.wis = 12;
    view.rerender(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
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
      render(<CastingSummary character={character} onOpenSpells={vi.fn()} onCombatCastingContextChange={vi.fn()} onMedallionOfFaithChange={vi.fn()} />);
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
    expect(readStoredCharacter()).toEqual(character);
  });

  it("shares the session-only Combat Casting context across the skill, summary, and spell sheet", async () => {
    const character = caster();
    character.featSelections = { "general-1": "combat-casting" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const { container } = render(<App />);

    const controls = await screen.findAllByRole("combobox", { name: "Combat Casting context" });
    expect(controls).toHaveLength(2);
    fireEvent.change(controls[0], { target: { value: "pinned" } });
    expect(within(screen.getByRole("group", { name: "Concentration skill" }))
      .getByRole("strong").textContent).toBe("+10");
    expect(container.querySelector(".casting-concentration strong")?.textContent).toBe("+10");
    expect(controls.map((control) => (control as HTMLSelectElement).value)).toEqual(["pinned", "pinned"]);

    fireEvent.click(screen.getByRole("button", { name: "Manage spells" }));
    await screen.findByRole("tabpanel", { name: /Wizard/ });
    const spellContext = screen.getByRole("combobox", { name: "Combat Casting context" });
    expect((spellContext as HTMLSelectElement).value).toBe("pinned");
    const concentrationLabel = screen.getByText("Concentration", { selector: ".stat small" });
    expect(concentrationLabel.parentElement?.textContent).toContain("+10");
  });
});
