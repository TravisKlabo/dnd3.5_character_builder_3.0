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
    character.hasPowerPointReserve = true;
    character.hasKiPower = true;
    character.hasKiStrikeMagic = true;
    character.hasAllMartialWeaponProficiencies = true;
    character.hasStealSpell = true;
    character.hasSwashbucklerGrace = true;
    character.hasConjurationHealingSpell = true;
    character.hasSpontaneousCureOrInflict = true;
    character.hasCureWoundsSpell = true;
    character.hasSummonNaturesAllySpell = true;
    character.hasInflictWoundsSpell = true;
    character.canTurnElementalSubtype = true;
    character.canRebukeElementalSubtype = true;
    character.hasFastWildShape = true;
    character.hasWarmageLevelFour = true;
    character.hasGraduatedFromApprenticeship = true;
    character.hasMentorSkillPrerequisites = true;
    character.isGuildMember = true;
    character.hasGuildmasterPrerequisites = true;
    character.hasCompletedBondingRitual = true;
    character.hasRechargeableBreathWeapon = true;
    character.hasDetectMagicAccess = true;
    character.isThoonAffiliate = true;
    character.divineCasterLevel = 5;
    character.clericUndeadTurningMode = "rebuke";
    character.manifesterLevel = 3;
    character.skirmishDamageDice = 2;
    character.skirmishACBonus = 1;
    character.race = "Gnome";
    character.shieldBlindingUsesByItem = {
      "Blinding +1 Heavy Steel Shield (Medium)": 1,
    };
    character.racialSpellLikeUses = ["gnome:Speak with Animals"];
    character.equipment["Rings 1"] = "Ring of Force Shield";
    character.forceShieldActive = true;
    saveCharacter(character);
    expect(loadSavedCharacter()).toEqual({ character, saved: true, setupDraft: false });
  });

  it("validates saved racial spell-like ability uses", () => {
    const character = cloneCharacter(initialCharacter);
    expect(parseCharacter({
      ...character,
      racialSpellLikeUses: ["gnome:Speak with Animals"],
    }).racialSpellLikeUses).toEqual(["gnome:Speak with Animals"]);
    expect(() => parseCharacter({
      ...character,
      racialSpellLikeUses: [1],
    })).toThrow();
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

  it("round-trips paid and feat-granted skill tricks", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.featSelections = { "general-6": "cool-head" };
    character.skillTricksByLevel = {
      1: [{ trickId: "listen-to-this", sourceId: "fighter" }],
      2: [{ trickId: "point-it-out", sourceId: "fighter" }],
      6: [
        { trickId: "clarity-of-vision", featSlotId: "general-6" },
        { trickId: "swift-concentration", featSlotId: "general-6" },
      ],
    };
    saveCharacter(character);

    expect(loadSavedCharacter().character.skillTricksByLevel).toEqual(
      character.skillTricksByLevel,
    );
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
    { ...initialCharacter, skillTricksByLevel: { 0: [{ trickId: "listen-to-this", sourceId: "fighter" }] } },
    { ...initialCharacter, skillTricksByLevel: { 1: [{ trickId: "missing-trick", sourceId: "fighter" }] } },
    { ...initialCharacter, skillTricksByLevel: { 1: [
      { trickId: "listen-to-this", sourceId: "fighter" },
      { trickId: "point-it-out", sourceId: "fighter" },
    ] } },
    { ...initialCharacter, skillTricksByLevel: { 1: [
      { trickId: "listen-to-this", sourceId: "fighter" },
      { trickId: "listen-to-this", featSlotId: "general-1" },
    ] } },
    { ...initialCharacter, skillTricksByLevel: { 1: [
      { trickId: "listen-to-this", featSlotId: "general-1" },
      { trickId: "point-it-out", featSlotId: "general-1" },
      { trickId: "clarity-of-vision", featSlotId: "general-1" },
    ] } },
    { ...initialCharacter, skillTricksByLevel: { 1: [
      { trickId: "listen-to-this", featSlotId: "general-1" },
    ] } },
    { ...initialCharacter, featSelections: { "general-1": "cool-head" }, skillTricksByLevel: { 1: [
      { trickId: "hidden-blade", featSlotId: "general-1" },
    ] } },
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
    { ...initialCharacter, featSpellMasterySelections: { "general-1": "Magic Missile" } },
    { ...initialCharacter, featSpellMasterySelectionCounts: { "general-1": -1 } },
    { ...initialCharacter, featSpellMasterySelectionCounts: { "general-1": 1.5 } },
    { ...initialCharacter, hasPowerPointReserve: "yes" },
    { ...initialCharacter, hasKiPower: "yes" },
    { ...initialCharacter, hasKiStrikeMagic: "yes" },
    { ...initialCharacter, hasAllMartialWeaponProficiencies: "yes" },
    { ...initialCharacter, hasStealSpell: "yes" },
    { ...initialCharacter, hasSwashbucklerGrace: "yes" },
    { ...initialCharacter, hasConjurationHealingSpell: "yes" },
    { ...initialCharacter, hasSpontaneousCureOrInflict: "yes" },
    { ...initialCharacter, hasCureWoundsSpell: "yes" },
    { ...initialCharacter, hasSummonNaturesAllySpell: "yes" },
    { ...initialCharacter, hasInflictWoundsSpell: "yes" },
    { ...initialCharacter, canTurnElementalSubtype: "yes" },
    { ...initialCharacter, canRebukeElementalSubtype: "yes" },
    { ...initialCharacter, hasFastWildShape: "yes" },
    { ...initialCharacter, hasWarmageLevelFour: "yes" },
    { ...initialCharacter, hasGraduatedFromApprenticeship: "yes" },
    { ...initialCharacter, hasMentorSkillPrerequisites: "yes" },
    { ...initialCharacter, isGuildMember: "yes" },
    { ...initialCharacter, hasGuildmasterPrerequisites: "yes" },
    { ...initialCharacter, hasCompletedBondingRitual: "yes" },
    { ...initialCharacter, hasRechargeableBreathWeapon: "yes" },
    { ...initialCharacter, hasDetectMagicAccess: "yes" },
    { ...initialCharacter, isThoonAffiliate: "yes" },
    { ...initialCharacter, divineCasterLevel: -1 },
    { ...initialCharacter, divineCasterLevel: 1.5 },
    { ...initialCharacter, divineCasterLevel: "5" },
    { ...initialCharacter, clericUndeadTurningMode: "both" },
    { ...initialCharacter, manifesterLevel: -1 },
    { ...initialCharacter, manifesterLevel: 1.5 },
    { ...initialCharacter, manifesterLevel: "3" },
    { ...initialCharacter, skirmishDamageDice: -1 },
    { ...initialCharacter, skirmishDamageDice: 1.5 },
    { ...initialCharacter, skirmishACBonus: "1" },
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
    delete legacyCharacter.featSpellMasterySelections;
    delete legacyCharacter.featSpellMasterySelectionCounts;
    delete legacyCharacter.speakLanguages;
    delete legacyCharacter.hasMedallionOfFaith;
    expect(parseCharacter(legacyCharacter).mainWeaponGrip).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featWeaponSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSkillSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSpellSchoolSelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSpellMasterySelections).toBeUndefined();
    expect(parseCharacter(legacyCharacter).featSpellMasterySelectionCounts).toBeUndefined();
    expect(parseCharacter(legacyCharacter).speakLanguages).toBeUndefined();
    expect(parseCharacter(legacyCharacter).hasMedallionOfFaith).toBeUndefined();
  });

  it("round-trips Speak Language choices", () => {
    const character = { ...initialCharacter, speakLanguages: ["Elven"] };
    expect(parseCharacter(character).speakLanguages).toEqual(["Elven"]);
  });

  it("round-trips Spell Mastery choices and their saved selection count", () => {
    const character = {
      ...initialCharacter,
      featSelections: { "general-1": "spell-mastery" },
      featSpellMasterySelections: { "general-1": ["Magic Missile", "Shield"] },
      featSpellMasterySelectionCounts: { "general-1": 2 },
    };
    expect(parseCharacter(character).featSpellMasterySelections)
      .toEqual(character.featSpellMasterySelections);
    expect(parseCharacter(character).featSpellMasterySelectionCounts)
      .toEqual(character.featSpellMasterySelectionCounts);
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
