import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { loadSavedCharacter, loadCustomStoreItems, saveCharacter,
  customItemsLoadFailed, savedCharacterSetupDraftStorageKey, savedCharacterStorageKey, customStoreItemsStorageKey } from "../src/storage";
import { parseCharacter, parseCustomItems } from "../src/validation";

describe("character persistence", () => {
  it("round-trips a saved character without losing selections", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.name = "Test Hero";
    character.hasMedallionOfFaith = true;
    character.skills.Climb = 4;
    character.inventory["Masterwork Longsword (Medium)"] = 1;
    character.compositeBowStrengthRatings = { "Composite Longbow (Medium)": 3 };
    character.knownSpellsByClass = { wizard: ["Magic Missile"] };
    character.spellAcquisitionByClass = { wizard: { "Magic Missile": "spellbook" } };
    character.hitPointRolls = [{
      characterLevel: 1,
      classId: "fighter",
      classLevel: 1,
      hitDie: 10,
      roll: 10,
      hpIncrease: 10,
    }];
    character.dragonlanceMoonState = {
      phases: { solinari: "full", lunitari: "first-quarter", nuitari: "new" },
      conjunction: "solinari-nuitari",
    };
    character.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Humanoid",
      subtype: "Elf",
      bonusTargetLevel: 1,
    }];
    character.shieldBlindingUsesByItem = {
      "Blinding +1 Heavy Steel Shield (Medium)": 1,
    };
    character.equipment["Rings 1"] = "Ring of Force Shield";
    character.forceShieldActive = true;
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

  it("round-trips ability score increases by character level", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.abilities.str = 11;
    character.abilityScoreIncreasesByLevel = { 4: "str" };
    saveCharacter(character);

    expect(loadSavedCharacter().character.abilityScoreIncreasesByLevel).toEqual({
      4: "str",
    });
  });

  it("round-trips skill rank history by character level", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    character.skillRanksByLevel = {
      1: { Ride: 1 },
      2: { Ride: 2 },
    };
    saveCharacter(character);

    expect(loadSavedCharacter().character.skillRanksByLevel).toEqual({
      1: { Ride: 1 },
      2: { Ride: 2 },
    });
  });

  it("round-trips base attack bonus history by character level", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    character.baseAttackBonusByLevel = { 1: 1, 2: 2 };
    saveCharacter(character);

    expect(loadSavedCharacter().character.baseAttackBonusByLevel).toEqual({
      1: 1,
      2: 2,
    });
  });

  it("validates saved Knight of the Crown feature and combat-effect state", () => {
    const character = cloneCharacter(initialCharacter);
    character.knightOfTheCrownState = {
      strengthOfHonorUsesUsed: 1,
      crownOfKnighthoodUsed: true,
    };
    character.honorBoundSuspended = true;
    character.temporaryHitPoints = 15;
    character.combatEffects = [{
      name: "Crown of Knighthood (Heroic Valor)",
      remainingRounds: 100,
      modifiers: { attack: 4, armorClass: 0, saves: 4, damage: 4, checks: 0 },
      expiresTemporaryHitPoints: true,
    }];
    expect(parseCharacter(character)).toMatchObject({
      knightOfTheCrownState: { strengthOfHonorUsesUsed: 1, crownOfKnighthoodUsed: true },
      honorBoundSuspended: true,
      temporaryHitPoints: 15,
    });
    expect(() => parseCharacter({
      ...character,
      knightOfTheCrownState: { strengthOfHonorUsesUsed: 5 },
    })).toThrow();
    expect(() => parseCharacter({ ...character, honorBoundSuspended: "yes" })).toThrow();
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
    { ...initialCharacter, abilityScoreIncreasesByLevel: { 3: "str" } },
    { ...initialCharacter, abilityScoreIncreasesByLevel: { 4: "luck" } },
    { ...initialCharacter, skillRanksByLevel: { 0: { Ride: 1 } } },
    { ...initialCharacter, skillRanksByLevel: { 1: { Ride: -0.5 } } },
    { ...initialCharacter, skillRanksByLevel: { 1: "not-a-rank-map" } },
    { ...initialCharacter, baseAttackBonusByLevel: { 0: 0 } },
    { ...initialCharacter, baseAttackBonusByLevel: { 1: -1 } },
    { ...initialCharacter, baseAttackBonusByLevel: { 1: 1.5 } },
    { ...initialCharacter, baseAttackBonusByLevel: { 1: "1" } },
    { ...initialCharacter, classLevels: [{ classId: "missing", level: 1 }] },
    { ...initialCharacter, classLevels: [] },
    { ...initialCharacter, classLevels: [{ classId: "fighter", level: 0 }] },
    { ...initialCharacter, hitPointRolls: [{ characterLevel: 1, classId: "fighter", classLevel: 1, hitDie: 10, roll: 11, hpIncrease: 10 }] },
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
    { ...initialCharacter, forceShieldActive: "active" },
    { ...initialCharacter, shieldBlindingUsesByItem: { "Blinding Shield": -1 } },
    { ...initialCharacter, shieldBlindingUsesByItem: { "Blinding Shield": 2.5 } },
    { ...initialCharacter, shieldBlindingUsesByItem: { "Blinding Shield": 3 } },
    { ...initialCharacter, ruleset: "unsupported" },
    { ...initialCharacter, knownSpellsByClass: { wizard: "Magic Missile" } },
    { ...initialCharacter, dragonlanceMoonState: { phases: { solinari: "full-moon" } } },
    { ...initialCharacter, dragonlanceMoonState: { conjunction: "solinari-all" } },
    { ...initialCharacter, spellAcquisitionByClass: { wizard: { spell: "made-up" } } },
    { ...initialCharacter, customItems: [{ custom: true, name: "Broken" }] },
    { ...initialCharacter, rangerFavoredEnemies: [{ classLevel: 1, kind: "creature", target: "Dragon", bonusTargetLevel: 5 }] },
    { ...initialCharacter, rangerFavoredEnemies: [
      { classLevel: 1, kind: "creature", target: "Dragon", bonusTargetLevel: 1 },
      { classLevel: 1, kind: "creature", target: "Undead", bonusTargetLevel: 1 },
    ] },
    { ...initialCharacter, speakLanguages: "Elven" },
    { ...initialCharacter, hasMedallionOfFaith: "yes" },
  ])("rejects malformed character data %#", (value) => {
    expect(() => parseCharacter(value)).toThrow();
  });

  it("accepts legacy characters without saved grip data", () => {
    const legacyCharacter = { ...initialCharacter };
    delete legacyCharacter.mainWeaponGrip;
    delete legacyCharacter.featWeaponSelections;
    delete legacyCharacter.featSkillSelections;
    delete legacyCharacter.featSpellSchoolSelections;
    delete legacyCharacter.speakLanguages;
    delete legacyCharacter.hasMedallionOfFaith;
    expect(parseCharacter(legacyCharacter).mainWeaponGrip).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featWeaponSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSkillSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSpellSchoolSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).speakLanguages).toBeUndefined();
    expect(parseCharacter(legacyCharacter).hasMedallionOfFaith).toBeUndefined();
  });

  it("round-trips Speak Language choices", () => {
    const character = { ...initialCharacter, speakLanguages: ["Elven"] };
    expect(parseCharacter(character).speakLanguages).toEqual(["Elven"]);
  });

  it("migrates legacy characters to the ruleset indicated by their source-tagged content", () => {
    const parseLegacy = (fields: Record<string, unknown> = {}) => {
      const character: Record<string, unknown> = { ...initialCharacter, ...fields };
      delete character.ruleset;
      return parseCharacter(character).ruleset;
    };

    expect(parseLegacy()).toBe("core-35-srd");
    expect(parseLegacy({ race: "Kender" })).toBe("dragonlance-user-pack");
    expect(parseLegacy({ race: "Minotaur" })).toBe("dragonlance-monster-classes");
    expect(parseLegacy({ deity: "mishakal" })).toBe("dragonlance-user-pack");
    expect(parseLegacy({ dragonlanceMoonState: { conjunction: "all" } })).toBe("dragonlance-user-pack");
  });

  it("normalizes the legacy Kender language name when loading a character", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Kender";
    character.ruleset = "dragonlance-user-pack";
    character.languages = ["Common", "Kender"];

    expect(parseCharacter(character).languages).toEqual(["Common", "Kenderspeak"]);
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
