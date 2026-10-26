import { beforeAll, describe, expect, it } from "vitest";
import { abilityModifier, armorClass, beginLevelUp, changeRace, cloneCharacter,
  hitPointGain, initialCharacter, nextClassLevel, validateLevelUp } from "../src/domain";
import { baseSpellSlots, featQualifies, getBaseAttackBonus, getBaseSave,
  getEquipmentArmorClass, getEquippedWeaponStats, getSkillMaximum,
  getTwoWeaponAttackPenalty } from "../src/rules";
import { featCatalog } from "../src/data/characterCatalog";
import { getClassSpells, loadSpellCatalog, spells } from "../src/data/spellCatalog";

beforeAll(loadSpellCatalog);

describe("character rules preserved from 2.0", () => {
  it("uses D&D ability modifiers and a minimum one hit point gain", () => {
    expect([7, 8, 9, 10, 11, 12, 18].map(abilityModifier)).toEqual([-2, -1, -1, 0, 0, 1, 4]);
    const character = cloneCharacter(initialCharacter);
    character.abilities.con = 3;
    expect(hitPointGain(character, 1)).toBe(1);
  });

  it("keeps all level-up changes separate from the finalized character", () => {
    const original = cloneCharacter(initialCharacter);
    original.inventory = { "Longsword (Medium)": 1 };
    const snapshot = cloneCharacter(original);
    const draft = beginLevelUp(original, "wizard");
    draft.proposed.skills.Spellcraft = 2;
    draft.proposed.inventory["Longsword (Medium)"] = 5;
    draft.proposed.knownSpells.push("Magic Missile");
    draft.proposed.abilities.int = 18;
    expect(original).toEqual(snapshot);
    expect(draft.original).toEqual(snapshot);
    expect(draft.proposed.classLevels).toEqual([
      { classId: "fighter", level: 1 }, { classId: "wizard", level: 1 },
    ]);
    expect(nextClassLevel(draft.proposed, "wizard")).toBe(2);
  });

  it("requires a hit point roll before confirmation, preserving current behavior", () => {
    const draft = beginLevelUp(cloneCharacter(initialCharacter), "fighter");
    expect(validateLevelUp(draft)).toContain("Roll hit points before confirming the level-up.");
    draft.hitPointRoll = 6;
    expect(validateLevelUp(draft)).toEqual([]);
    draft.proposed.classLevels[0].level = 5;
    expect(validateLevelUp(draft)).toContain("A level-up must add exactly one class level.");
  });

  it("requires an ability increase at level four", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels[0].level = 3;
    const draft = beginLevelUp(character, "fighter");
    draft.hitPointRoll = 5;
    expect(validateLevelUp(draft)).toContain("Choose an ability score to increase before confirming the level-up.");
    draft.abilityIncrease = "str";
    expect(validateLevelUp(draft)).toEqual([]);
  });

  it("reverses old race modifiers before applying the next race", () => {
    const dwarf = changeRace(initialCharacter, "Dwarf");
    expect(dwarf.abilities.con).toBe(12);
    expect(changeRace(dwarf, "Human").abilities).toEqual(initialCharacter.abilities);
  });

  it("sums multiclass attack and save progressions", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 4 }, { classId: "wizard", level: 2 }];
    expect(getBaseAttackBonus(character)).toBe(5);
    expect(getBaseSave(character, "fortitude")).toBe(4);
    expect(getBaseSave(character, "will")).toBe(4);
  });

  it("preserves armor dexterity limits, size, and masterwork attack benefits", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.dex = 18;
    character.abilities.str = 14;
    character.equipment = { Armor: "Full Plate (Medium)", Shield: "Heavy Steel Shield (Medium)" };
    expect(getEquipmentArmorClass(character)).toBe(21);
    expect(armorClass(changeRace(character, "Halfling"))).toBeGreaterThan(armorClass(character));
    const stats = getEquippedWeaponStats(character, "Masterwork Longsword (Medium)");
    expect(stats?.attack).toBe(4);
    expect(stats?.damage).toBe("1d8+2");
  });

  it("preserves cross-class rank limits and feat prerequisites", () => {
    expect(getSkillMaximum(initialCharacter, "Climb")).toBe(4);
    expect(getSkillMaximum(initialCharacter, "Spellcraft")).toBe(2);
    const powerAttack = featCatalog.find((feat) => feat.id === "power-attack");
    expect(powerAttack).toBeDefined();
    if (!powerAttack) throw new Error("Missing Power Attack fixture.");
    expect(featQualifies(initialCharacter, powerAttack, { fighterOnly: false })).toBe(false);
    const character = cloneCharacter(initialCharacter);
    character.abilities.str = 13;
    expect(featQualifies(character, powerAttack, { fighterOnly: false })).toBe(true);
    character.equipment = { "Main Weapon": "Longsword (Medium)", "Off Hand Weapon": "Dagger (Medium)" };
    expect(getTwoWeaponAttackPenalty(character, "Main Weapon")).toBe(-4);
    expect(getTwoWeaponAttackPenalty(character, "Off Hand Weapon")).toBe(-8);
  });
});

describe("spell catalog", () => {
  it("loads once and indexes class lists without changing their content", async () => {
    const count = spells.length;
    await Promise.all([loadSpellCatalog(), loadSpellCatalog()]);
    expect(spells.length).toBe(count);
    expect(count).toBeGreaterThan(700);
    expect(getClassSpells("wizard")).toEqual(spells.filter((spell) => spell.classes.includes("wizard")));
    expect(getClassSpells("wizard")).toBe(getClassSpells("wizard"));
    expect(getClassSpells("cleric").some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
  });

  it("keeps multiclass spell slots tied to class level", () => {
    expect(baseSpellSlots("wizard", 1, 1)).toBe(1);
    expect(baseSpellSlots("wizard", 3, 2)).toBe(1);
    expect(baseSpellSlots("fighter", 5, 2)).toBe(0);
  });
});
