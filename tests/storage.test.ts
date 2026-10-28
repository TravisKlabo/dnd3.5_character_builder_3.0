import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { loadSavedCharacter, loadCustomStoreItems, saveCharacter,
  savedCharacterStorageKey, customStoreItemsStorageKey } from "../src/storage";
import { parseCharacter, parseCustomItems } from "../src/validation";

describe("character persistence", () => {
  it("round-trips an existing 2.0 character without losing selections", () => {
    const character = cloneCharacter(initialCharacter);
    character.name = "Test Hero";
    character.skills.Climb = 4;
    character.inventory["Masterwork Longsword (Medium)"] = 1;
    character.knownSpellsByClass = { wizard: ["Magic Missile"] };
    character.spellAcquisitionByClass = { wizard: { "Magic Missile": "spellbook" } };
    saveCharacter(character);
    expect(loadSavedCharacter()).toEqual({ character, saved: true });
  });

  it("starts with independent creation data when there is no save", () => {
    const first = loadSavedCharacter();
    first.character.abilities.str = 20;
    expect(loadSavedCharacter().character.abilities.str).toBe(10);
    expect(first.saved).toBe(false);
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
    { ...initialCharacter, inventory: { Longsword: -2 } },
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
    expect(parseCharacter(legacyCharacter).mainWeaponGrip).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featWeaponSelections).toBeUndefined();
  });

  it("reports damaged saved data without overwriting it or locking setup", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(savedCharacterStorageKey, "{broken");
    const result = loadSavedCharacter();
    expect(result.saved).toBe(false);
    expect(result.error).toContain("Unable to load");
    expect(log).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe("{broken");
  });

  it("does not report a successful save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    expect(() => saveCharacter(initialCharacter)).toThrow("Storage full");
  });

  it("validates custom catalogs and reports corruption", () => {
    const item = { name: "Test Blade", category: "Weapons", price: 10, weight: "1 lb.", custom: true };
    expect(parseCustomItems([item])).toEqual([item]);
    expect(() => parseCustomItems([{ ...item, price: "free" }])).toThrow();
    expect(() => parseCustomItems([{ ...item, handedness: "Invalid" }])).toThrow();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(customStoreItemsStorageKey, "{}");
    expect(loadCustomStoreItems()).toEqual([]);
    expect(log).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(customStoreItemsStorageKey)).toBe("{}");
  });
});
