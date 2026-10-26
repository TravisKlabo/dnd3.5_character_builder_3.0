import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { applyHitPointAction, getCurrentHitPoints, getHitPointStatus, getMaximumHitPoints } from "../src/hitPoints";
import { parseCharacter } from "../src/validation";
import { loadSavedCharacter, saveCharacter, savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

describe("in-play HP rules", () => {
  it("defaults older characters to maximum HP without mutating them", () => {
    expect(getCurrentHitPoints(initialCharacter)).toBe(initialCharacter.hitPoints);
    expect(initialCharacter.currentHitPoints).toBeUndefined();
  });

  it("absorbs damage with temporary HP, then permits negative current HP without changing maximum", () => {
    const original = { ...cloneCharacter(initialCharacter), temporaryHitPoints: 5 };
    const absorbed = applyHitPointAction(original, "damage", 3);
    expect(absorbed).toMatchObject({ hitPoints: 10, temporaryHitPoints: 2, currentHitPoints: 10 });
    expect(applyHitPointAction(absorbed, "damage", 15)).toMatchObject({ hitPoints: 10, currentHitPoints: -3, temporaryHitPoints: 0 });
    expect(original.temporaryHitPoints).toBe(5);
    expect(original.currentHitPoints).toBeUndefined();
  });

  it("tracks nonlethal separately and replaces rather than stacks temporary HP", () => {
    const character = { ...cloneCharacter(initialCharacter), temporaryHitPoints: 8 };
    const damaged = applyHitPointAction(character, "nonlethal", 12);
    expect(damaged).toMatchObject({ nonlethalDamage: 12, temporaryHitPoints: 8, hitPoints: 10 });
    expect(getCurrentHitPoints(damaged)).toBe(10);
    expect(applyHitPointAction(damaged, "temporary", 3).temporaryHitPoints).toBe(3);
    expect(applyHitPointAction(damaged, "temporary", 0).temporaryHitPoints).toBe(0);
    expect(applyHitPointAction(damaged, "recoverNonlethal", 20).nonlethalDamage).toBe(0);
  });

  it("magically heals lethal and nonlethal damage equally, including at maximum HP", () => {
    const character = { ...cloneCharacter(initialCharacter), currentHitPoints: 8, nonlethalDamage: 9, temporaryHitPoints: 2 };
    expect(applyHitPointAction(character, "heal", 5)).toMatchObject({
      currentHitPoints: 10, hitPoints: 10, nonlethalDamage: 4, temporaryHitPoints: 2,
    });
    expect(applyHitPointAction({ ...character, currentHitPoints: -9 }, "heal", 3).currentHitPoints).toBe(-6);
    expect(() => applyHitPointAction({ ...character, currentHitPoints: -10 }, "heal", 5)).toThrow("cannot revive");
  });

  it.each([
    [10, 0, "Conscious"], [0, 0, "Disabled"], [-1, 0, "Dying / unconscious unless stabilized or an ability applies"],
    [-9, 0, "Dying / unconscious unless stabilized or an ability applies"], [-10, 0, "Dead"],
    [5, 5, "Staggered (nonlethal)"], [5, 6, "Unconscious (nonlethal)"], [0, 1, "Unconscious (nonlethal)"],
  ])("classifies current HP %s and nonlethal %s", (currentHitPoints, nonlethalDamage, status) => {
    expect(getHitPointStatus({ ...initialCharacter, currentHitPoints, nonlethalDamage })).toBe(status);
  });

  it.each([-1, 0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid damage %s", (amount) => {
    expect(() => applyHitPointAction(initialCharacter, "damage", amount)).toThrow();
  });

  it("validates imports and round-trips current HP, temporary HP, and nonlethal damage", () => {
    const character = { ...cloneCharacter(initialCharacter), currentHitPoints: -2, temporaryHitPoints: 5, nonlethalDamage: 3 };
    saveCharacter(character);
    expect(loadSavedCharacter().character).toEqual(character);
    for (const currentHitPoints of [11, 0.5, Infinity, "3"]) {
      expect(() => parseCharacter({ ...character, currentHitPoints })).toThrow();
    }
    for (const field of ["temporaryHitPoints", "nonlethalDamage"]) {
      for (const value of [-1, 1.5, NaN]) expect(() => parseCharacter({ ...character, [field]: value })).toThrow();
    }
    expect(parseCharacter(initialCharacter)).toEqual(initialCharacter);
  });
});

describe("HP tracker workflow", () => {
  function setup() {
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(initialCharacter));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    return render(<App />);
  }

  it("applies damage, healing and temporary HP, persists through Save and reload, and leaves maximum HP intact", () => {
    const view = setup();
    const tracker = within(screen.getByRole("group", { name: "Hit point tracker" }));
    const amount = tracker.getByRole("spinbutton", { name: "HP amount" });
    fireEvent.change(amount, { target: { value: "5" } });
    fireEvent.click(tracker.getByRole("button", { name: "Set temp HP" }));
    fireEvent.change(amount, { target: { value: "8" } });
    fireEvent.click(tracker.getByRole("button", { name: "Damage" }));
    expect(tracker.getByText("HP 7 / 10")).toBeDefined();
    expect(tracker.getByText("Temp 0")).toBeDefined();
    fireEvent.change(amount, { target: { value: "9" } });
    fireEvent.click(tracker.getByRole("button", { name: "Nonlethal damage" }));
    expect(tracker.getByRole("status").textContent).toBe("Unconscious (nonlethal)");
    fireEvent.change(amount, { target: { value: "3" } });
    fireEvent.click(tracker.getByRole("button", { name: "Heal" }));
    expect(tracker.getByText("HP 10 / 10")).toBeDefined();
    expect(tracker.getByText("Nonlethal 6")).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null").currentHitPoints).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character).toMatchObject({ hitPoints: 10, currentHitPoints: 10, nonlethalDamage: 6 });
    view.unmount();
    render(<App />);
    expect(within(screen.getByRole("group", { name: "Hit point tracker" })).getByText("Nonlethal 6")).toBeDefined();
  });

  it("reports blank and fractional input without changing HP", () => {
    setup();
    const tracker = within(screen.getByRole("group", { name: "Hit point tracker" }));
    fireEvent.click(tracker.getByRole("button", { name: "Damage" }));
    expect(tracker.getByRole("alert")).toBeDefined();
    fireEvent.change(tracker.getByRole("spinbutton"), { target: { value: "1.5" } });
    fireEvent.click(tracker.getByRole("button", { name: "Heal" }));
    expect(tracker.getByRole("alert")).toBeDefined();
    expect(tracker.getByText("HP 10 / 10")).toBeDefined();
  });

  it("disables controls in setup and level-up drafts and restores existing HP on discard", () => {
    const character = { ...initialCharacter, currentHitPoints: 4, temporaryHitPoints: 3, nonlethalDamage: 2 };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    expect(screen.getByRole<HTMLFieldSetElement>("group", { name: /HP controls are available/ }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByText("HP 4 / 10")).toBeDefined();
    expect(screen.getByText("Temp 3")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reopen Setup" }));
    expect(screen.getByRole<HTMLFieldSetElement>("group", { name: /HP controls are available/ }).disabled).toBe(true);
  });

  it("surfaces storage failure instead of claiming saved HP", () => {
    setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toContain("Unable to save");
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("preserves damage when a level-up increases maximum HP", () => {
    const character = { ...cloneCharacter(initialCharacter), currentHitPoints: 4,
      classLevels: [{ classId: "barbarian", level: 1 }] as const };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: /class/i }), { target: { value: "barbarian" } });
    const climb = within(screen.getByRole("group", { name: "Climb skill" }));
    for (let index = 0; index < 5; index++) fireEvent.click(climb.getByRole("button", { name: "Add rank to Climb" }));
    const roll = screen.getByRole<HTMLButtonElement>("button", { name: "Roll Hit Points" });
    expect(roll.disabled, document.querySelector(".level-todo-list")?.textContent).toBe(false);
    fireEvent.click(roll);
    const confirm = screen.getByRole<HTMLButtonElement>("button", { name: "Confirm Level-Up" });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    expect(screen.getByText("HP 11 / 17")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character).toMatchObject({ hitPoints: 17, currentHitPoints: 11 });
  });

  it("preserves damage and avoids baking equipped Constitution into level-up HP", () => {
    const character = { ...cloneCharacter(initialCharacter), currentHitPoints: 4,
      classLevels: [{ classId: "barbarian", level: 1 }] as const,
      equipment: { ...initialCharacter.equipment, Neck: "Amulet of Health +4" } };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: /class/i }), { target: { value: "barbarian" } });
    const climb = within(screen.getByRole("group", { name: "Climb skill" }));
    for (let index = 0; index < 5; index++) fireEvent.click(climb.getByRole("button", { name: "Add rank to Climb" }));
    const roll = screen.getByRole<HTMLButtonElement>("button", { name: "Roll Hit Points" });
    expect(roll.disabled, document.querySelector(".level-todo-list")?.textContent).toBe(false);
    fireEvent.click(roll);
    fireEvent.click(screen.getByRole<HTMLButtonElement>("button", { name: "Confirm Level-Up" }));
    expect(screen.getByText("HP 15 / 21")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = loadSavedCharacter().character;
    expect(saved).toMatchObject({ hitPoints: 17, currentHitPoints: 11, abilities: { con: 10 } });
    expect(getCurrentHitPoints(saved)).toBe(15);
    expect(getMaximumHitPoints(saved)).toBe(21);
    expect(getMaximumHitPoints(saved) - getCurrentHitPoints(saved)).toBe(6);
  });
});
