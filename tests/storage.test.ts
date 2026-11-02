import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { loadSavedCharacter, loadCustomStoreItems, saveCharacter,
  customItemsLoadFailed, savedCharacterSetupDraftStorageKey, savedCharacterStorageKey, customStoreItemsStorageKey } from "../src/storage";
import { parseCharacter, parseCustomItems } from "../src/validation";

describe("character persistence", () => {
  it("round-trips a saved character without losing selections", () => {
    const character = cloneCharacter(initialCharacter);
    character.name = "Test Hero";
    character.skills.Climb = 4;
    character.inventory["Masterwork Longsword (Medium)"] = 1;
    character.compositeBowStrengthRatings = { "Composite Longbow (Medium)": 3 };
    character.knownSpellsByClass = { wizard: ["Magic Missile"] };
    character.spellAcquisitionByClass = { wizard: { "Magic Missile": "spellbook" } };
    saveCharacter(character);
    expect(loadSavedCharacter()).toEqual({ character, saved: true, setupDraft: false });
  });

  it("round-trips whether a saved character is still in setup", () => {
    saveCharacter(initialCharacter, true);
    expect(loadSavedCharacter()).toEqual({
      character: initialCharacter,
      saved: true,
      setupDraft: true,
    });

    saveCharacter(initialCharacter);
    expect(loadSavedCharacter().setupDraft).toBe(false);
  });

  it("starts with independent creation data when there is no save", () => {
    const first = loadSavedCharacter();
    first.character.abilities.str = 20;
    expect(loadSavedCharacter().character.abilities.str).toBe(10);
    expect(first.saved).toBe(false);
    expect(first.setupDraft).toBe(false);
  });

  it.each([
    null,
    [],
    { ...initialCharacter, abilities: { str: 10 } },
    { ...initialCharacter, abilities: { ...initialCharacter.abilities, dex: "18" } },
    { ...initialCharacter, classLevels: [{ classId: "missing", level: 1 }] },
    { ...initialCharacter, classLevels: [] },
    { ...initialCharacter, classLevels: [{ classId: "fighter", level: 0 }] },
    { ...initialCharacter, skills: { Climb: "4" } },
    { ...initialCharacter, featWeaponSelections: { "general-1": 3 } },
    { ...initialCharacter, featSkillSelections: { "general-1": 3 } },
    { ...initialCharacter, featSpellSchoolSelections: { "general-1": "Time" } },
    { ...initialCharacter, inventory: { Longsword: -2 } },
    { ...initialCharacter, compositeBowStrengthRatings: { "Composite Longbow (Medium)": -1 } },
    { ...initialCharacter, compositeBowStrengthRatings: { "Composite Longbow (Medium)": 1.5 } },
    { ...initialCharacter, compositeBowStrengthRatings: { "Composite Longbow (Medium)": "3" } },
    { ...initialCharacter, mainWeaponGrip: "two-handed with sword" },
    { ...initialCharacter, doubleWeaponMode: "active" },
    { ...initialCharacter, doubleWeaponPrimaryEnd: "third" },
    { ...initialCharacter, towerShieldTotalCover: "active" },
    { ...initialCharacter, shieldBashMode: "active" },
    { ...initialCharacter, knownSpellsByClass: { wizard: "Magic Missile" } },
    { ...initialCharacter, spellAcquisitionByClass: { wizard: { spell: "made-up" } } },
    { ...initialCharacter, customItems: [{ custom: true, name: "Broken" }] },
  ])("rejects malformed character data %#", (value) => {
    expect(() => parseCharacter(value)).toThrow();
  });

  it("accepts legacy characters without saved grip data", () => {
    const legacyCharacter = { ...initialCharacter };
    delete legacyCharacter.mainWeaponGrip;
    delete legacyCharacter.featWeaponSelections;
    delete legacyCharacter.featSkillSelections;
    delete legacyCharacter.featSpellSchoolSelections;
    expect(parseCharacter(legacyCharacter).mainWeaponGrip).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featWeaponSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSkillSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSpellSchoolSelections).toBeUndefined();
  });

  it("loads older saves missing optional fields added later without changing stored data", () => {
    const legacyCharacter = cloneCharacter(initialCharacter);
    delete legacyCharacter.temporaryHitPoints;
    delete legacyCharacter.knownSpellsByClass;
    delete legacyCharacter.spellAcquisitionByClass;
    delete legacyCharacter.preparedSpellsByClass;
    delete legacyCharacter.expendedSpellSlotsByClass;
    delete legacyCharacter.combatRound;
    delete legacyCharacter.combatEffects;
    delete legacyCharacter.mainWeaponGrip;
    delete legacyCharacter.doubleWeaponMode;
    delete legacyCharacter.towerShieldTotalCover;
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(legacyCharacter));
    window.localStorage.setItem(savedCharacterSetupDraftStorageKey, "true");

    expect(loadSavedCharacter()).toEqual({
      character: legacyCharacter,
      saved: true,
      setupDraft: true,
    });
    expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe(JSON.stringify(legacyCharacter));

    saveCharacter(legacyCharacter, false);
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual([
      1,
      legacyCharacter,
      false,
    ]);
    expect(loadSavedCharacter()).toEqual({
      character: legacyCharacter,
      saved: true,
      setupDraft: false,
    });
  });

  it("reports damaged saved data without overwriting it or locking setup", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(savedCharacterStorageKey, "{broken");
    const result = loadSavedCharacter();
    expect(result.saved).toBe(false);
    expect(result.setupDraft).toBe(false);
    expect(result.error).toBeTruthy();
    expect(log).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe("{broken");
  });

  it("reports unsupported storage versions without modifying the saved record", () => {
    const record = JSON.stringify([2, initialCharacter, false]);
    window.localStorage.setItem(savedCharacterStorageKey, record);
    const result = loadSavedCharacter();
    expect(result.saved).toBe(false);
    expect(result.error).toBeTruthy();
    expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe(record);
  });

  it("keeps the previous complete record when a write fails", () => {
    const existing = cloneCharacter(initialCharacter);
    existing.name = "Existing save";
    saveCharacter(existing);
    const previousRecord = window.localStorage.getItem(savedCharacterStorageKey);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    const replacement = cloneCharacter(initialCharacter);
    replacement.name = "Uncommitted save";
    expect(() => saveCharacter(replacement, true)).toThrow("Storage full");
    expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe(previousRecord);
    expect(loadSavedCharacter()).toEqual({ character: existing, saved: true, setupDraft: false });
  });

  it("validates custom catalogs and reports corruption", () => {
    const item = { name: "Test Blade", category: "Weapons", price: 10, weight: "1 lb.", custom: true };
    expect(parseCustomItems([item])).toEqual([item]);
    const projectile = {
      ...item,
      ranged: true,
      rangedDamageAbility: "strength",
      material: "adamantine",
    };
    expect(parseCustomItems([projectile])).toEqual([projectile]);
    expect(() => parseCustomItems([{ ...item, price: "free" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, handedness: "Invalid" }])).toThrow();
    expect(() => parseCustomItems([{ ...projectile, rangedDamageAbility: "invalid" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, material: "mithral" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, material: "adamantine", category: "Armor" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, ranged: "true" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, ranged: true, category: "Armor" }])).toThrow();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(customStoreItemsStorageKey, JSON.stringify([item]));
    expect(loadCustomStoreItems()).toEqual([item]);
    expect(customItemsLoadFailed).toBe(false);
    window.localStorage.setItem(customStoreItemsStorageKey, "{}");
    expect(loadCustomStoreItems()).toEqual([]);
    expect(customItemsLoadFailed).toBe(true);
    expect(log).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(customStoreItemsStorageKey)).toBe("{}");
  });
});
