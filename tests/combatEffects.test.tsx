import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { advanceCombatRound, getCombatEffectDetails, getCombatEffectModifier, type CombatEffect } from "../src/combatEffects";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { getArmorClassValues, getEquippedWeaponStats, getSavingThrow, getSkillCheckModifier } from "../src/rules";
import { loadSavedCharacter, savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";
import App from "../src/App";

const shaken: CombatEffect = {
  name: "Shaken",
  remainingRounds: 2,
  modifiers: { attack: -2, armorClass: 0, saves: -2, damage: 0, checks: -2 },
};

describe("active combat effects", () => {
  it("applies selected modifiers to attack, AC, saves, weapon damage, checks, and grapple", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment["Main Weapon"] = "Longsword (Medium)";
    character.combatEffects = [{
      name: "Sickened",
      remainingRounds: null,
      modifiers: { attack: -2, armorClass: -1, saves: -2, damage: -2, checks: -2 },
    }];

    expect(getEquippedWeaponStats(character, "Longsword (Medium)")).toMatchObject({ attack: -1, damage: "1d8-2" });
    expect(getArmorClassValues(character)).toMatchObject({ normal: 9, touch: 9, flatFooted: 9 });
    expect(getSavingThrow(character, "fortitude").total).toBe(0);
    expect(getSavingThrow(character, "fortitude").title).toContain("Sickened: -2");
    expect(getSkillCheckModifier(character, "Climb")).toBe(-2);
    expect(getCombatEffectModifier(character, "checks")).toBe(-2);
    expect(getCombatEffectDetails(character, "armorClass")).toEqual(["Sickened: -1"]);
  });

  it("decrements timed effects and expires them while preserving effects without a duration", () => {
    const character = {
      ...initialCharacter,
      combatRound: 4,
      combatEffects: [
        shaken,
        { ...shaken, name: "Bless", remainingRounds: null, modifiers: { ...shaken.modifiers, attack: 1, saves: 0, checks: 0 } },
      ],
    };
    const nextRound = advanceCombatRound(character);
    expect(nextRound.combatRound).toBe(5);
    expect(nextRound.combatEffects.map((effect) => effect.remainingRounds)).toEqual([1, null]);
    const expired = advanceCombatRound(nextRound);
    expect(expired.combatRound).toBe(6);
    expect(expired.combatEffects.map((effect) => effect.name)).toEqual(["Bless"]);
    expect(character.combatRound).toBe(4);
    expect(character.combatEffects).toHaveLength(2);
  });

  it("rejects malformed effect data when importing", () => {
    expect(() => parseCharacter({ ...initialCharacter, combatRound: 0 })).toThrow("Combat round");
    expect(() => parseCharacter({ ...initialCharacter, combatEffects: [{ ...shaken, remainingRounds: 0 }] })).toThrow("Combat round");
    expect(() => parseCharacter({
      ...initialCharacter,
      combatEffects: [{ ...shaken, modifiers: { attack: 0 } }],
    })).toThrow("Combat round");
  });
});

describe("combat effect tracker", () => {
  it("previews Dwarf Stability only for grounded bull rush or trip checks", async () => {
    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(dwarf));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    await screen.findByRole("group", { name: "Dwarf Stability" });

    const stability = screen.getByRole("group", { name: "Dwarf Stability" });
    const check = within(stability).getByRole("combobox", { name: "Check to resist" });
    const grounded = within(stability).getByRole("checkbox", { name: "Standing firmly on the ground" });
    const result = within(stability).getByRole("status");

    fireEvent.change(check, { target: { value: "bull-rush" } });
    expect(result.textContent).toBe("Stability modifier: +0");
    fireEvent.click(grounded);
    expect(result.textContent).toBe("Stability modifier: +4");
    fireEvent.change(check, { target: { value: "trip" } });
    expect(result.textContent).toBe("Stability modifier: +4");
    fireEvent.click(grounded);
    expect(result.textContent).toBe("Stability modifier: +0");
  });

  it("adds presets, applies their modifiers, advances rounds, and persists expiration", async () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment["Main Weapon"] = "Longsword (Medium)";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    await screen.findByRole("region", { name: "Conditions and active effects" });
    const tracker = screen.getByRole("region", { name: "Conditions and active effects" });
    fireEvent.change(within(tracker).getByRole("combobox", { name: "Quick preset" }), {
      target: { value: "shaken" },
    });
    fireEvent.change(within(tracker).getByRole("spinbutton", { name: "Duration (rounds; 0 = until removed)" }), {
      target: { value: "2" },
    });
    fireEvent.click(within(tracker).getByRole("button", { name: "Add effect" }));

    const activeEffects = within(tracker).getByRole("list", { name: "Active effects" });
    expect(within(activeEffects).getByText("Shaken")).toBeDefined();
    expect(await screen.findByText("Attack -1", { exact: true })).toBeDefined();
    const fortitude = screen.getByText("Fortitude", { selector: ".stat > small" }).parentElement!;
    expect(within(fortitude).getByRole("strong").textContent).toBe("+0");
    const climb = within(screen.getByRole("group", { name: "Climb skill" }));
    expect(climb.getByRole("strong").textContent).toBe("-2");
    expect(within(tracker).getByText("2 rounds")).toBeDefined();

    fireEvent.click(within(tracker).getByRole("button", { name: "Next round" }));
    expect(within(tracker).getByText("1 round")).toBeDefined();
    fireEvent.click(within(tracker).getByRole("button", { name: "Next round" }));
    expect(within(tracker).getByText("No active conditions or effects.")).toBeDefined();
    expect(screen.getByText("Attack +1", { exact: true })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character).toMatchObject({ combatRound: 3, combatEffects: [] });
  });

  it("keeps effect editing disabled during setup and level-up drafts", async () => {
    const setup = render(<App />);
    await screen.findByRole("region", { name: "Conditions and active effects" });
    const tracker = screen.getByRole("region", { name: "Conditions and active effects" });
    expect(within(tracker).getByRole<HTMLFieldSetElement>("group", { name: "Add an effect" }).disabled).toBe(true);
    setup.unmount();
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(initialCharacter));
    render(<App />);
    await screen.findByRole("region", { name: "Conditions and active effects" });
    const finalizedTracker = screen.getByRole("region", { name: "Conditions and active effects" });
    expect(within(finalizedTracker).getByRole<HTMLFieldSetElement>("group", { name: "Add an effect" }).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    expect(within(finalizedTracker).getByRole<HTMLFieldSetElement>("group", { name: "Add an effect" }).disabled).toBe(true);
  });
});
