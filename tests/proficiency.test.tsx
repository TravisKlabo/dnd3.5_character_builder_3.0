import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type ClassId } from "../src/domain";
import { addCustomStoreItems, deleteCustomStoreItem, findStoreItem } from "../src/data/equipmentCatalog";
import { getArmorNonproficiencyPenalties, getAvailableFeats, getEquippedWeaponStats,
  getItemProficiencyWarning, getSkillCheckModifier, getSkillCheckPenalties,
  isArmorShieldProficient, normalizeFeatSelections } from "../src/rules";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

function hero(classId: ClassId = "wizard") {
  const character = cloneCharacter(initialCharacter);
  character.classLevels = [{ classId, level: 1 }];
  character.abilities.str = 20;
  character.abilities.dex = 18;
  character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
  return character;
}

function item(name: string) {
  const result = findStoreItem(name);
  if (!result) throw new Error(`Missing catalog item: ${name}`);
  return result;
}

describe("armor and shield proficiency", () => {
  it.each([
    ["fighter", true, true, true, true, true],
    ["paladin", true, true, true, true, false],
    ["cleric", true, true, true, true, false],
    ["barbarian", true, true, false, true, false],
    ["ranger", true, true, false, true, false],
    ["druid", true, true, false, true, false],
    ["bard", true, false, false, true, false],
    ["rogue", true, false, false, false, false],
    ["wizard", false, false, false, false, false],
    ["sorcerer", false, false, false, false, false],
    ["monk", false, false, false, false, false],
  ] as const)("%s gets its actual class proficiencies", (classId, light, medium, heavy, shield, tower) => {
    const character = hero(classId);
    expect(isArmorShieldProficient(character, item("Chain Shirt"))).toBe(light);
    expect(isArmorShieldProficient(character, item("Chainmail"))).toBe(medium);
    expect(isArmorShieldProficient(character, item("Full Plate"))).toBe(heavy);
    expect(isArmorShieldProficient(character, item("Heavy Steel Shield"))).toBe(shield);
    expect(isArmorShieldProficient(character, item("Tower Shield"))).toBe(tower);
  });

  it("combines multiclass proficiencies and removes the corresponding penalties", () => {
    const character = hero();
    expect(getArmorNonproficiencyPenalties(character)).toHaveLength(2);
    character.classLevels.push({ classId: "fighter", level: 1 });
    expect(getArmorNonproficiencyPenalties(character)).toEqual([]);
    expect(getItemProficiencyWarning(character, item("Chainmail"))).toBeNull();
  });

  it("uses mithral's original armor category for proficiency, not its movement category", () => {
    const character = hero("rogue");
    expect(isArmorShieldProficient(character, item("Mithral Breastplate"))).toBe(false);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    expect(isArmorShieldProficient(character, item("Mithral Breastplate"))).toBe(true);
    expect(isArmorShieldProficient(character, item("Mithral Full Plate"))).toBe(false);
  });

  it("keeps druid metal restrictions separate from proficiency, including multiclass druids", () => {
    const character = hero("druid");
    expect(getArmorNonproficiencyPenalties(character)).toEqual([]);
    expect(getItemProficiencyWarning(character, item("Chainmail"))).toContain("Druid restriction");
    expect(getItemProficiencyWarning(character, item("Heavy Steel Shield"))).toContain("24 hours");
    expect(getItemProficiencyWarning(character, item("Hide Armor"))).toBeNull();
    character.classLevels.push({ classId: "fighter", level: 1 });
    expect(getItemProficiencyWarning(character, item("Chainmail"))).toContain("Druid restriction");
  });

  it("honors proficiency feat selections with their prerequisites and class-granted prerequisites", () => {
    const character = hero();
    const available = () => getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id);
    expect(available()).toContain("armor-proficiency-light");
    expect(available()).not.toContain("armor-proficiency-medium");
    expect(available()).not.toContain("tower-shield-proficiency");
    character.featSelections = { "general-1": "armor-proficiency-light", "human-1": "shield-proficiency" };
    expect(available()).toContain("armor-proficiency-medium");
    expect(available()).toContain("tower-shield-proficiency");
    expect(getArmorNonproficiencyPenalties(character)).toMatchObject([{ source: "armor (nonprof.)" }]);
    character.classLevels.push({ classId: "rogue", level: 1 });
    character.featSelections = {};
    expect(available()).toContain("armor-proficiency-medium");
    expect(available()).not.toContain("armor-proficiency-light");
    const normalized = normalizeFeatSelections(character, { "general-1": "armor-proficiency-medium" });
    expect(normalized).toEqual({ "general-1": "armor-proficiency-medium" });
    character.featSelections = normalized;
    expect(isArmorShieldProficient(character, item("Chainmail"))).toBe(true);
  });

  it("permits heavy and tower feats only after their prerequisites and not armor feats in fighter slots", () => {
    const character = hero("barbarian");
    const ids = getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id);
    expect(ids).toContain("armor-proficiency-heavy");
    expect(ids).toContain("tower-shield-proficiency");
    expect(getAvailableFeats(character, { fighterOnly: true }).some((feat) => feat.id === "armor-proficiency-heavy")).toBe(false);
    character.featSelections = { "general-1": "armor-proficiency-heavy", "human-1": "tower-shield-proficiency" };
    expect(isArmorShieldProficient(character, item("Full Plate"))).toBe(true);
    expect(isArmorShieldProficient(character, item("Tower Shield"))).toBe(true);
  });

  it("uses custom armor categories and tower-shield metadata in warnings and penalties", () => {
    addCustomStoreItems([
      { name: "Test leather robe", category: "Armor", custom: true, armorCategory: "Heavy", armorCheckPenalty: -4, price: 1, weight: "1 lb." },
      { name: "Test wall", category: "Shields", custom: true, shieldType: "Tower", shieldCheckPenalty: -8, price: 1, weight: "1 lb." },
    ]);
    try {
      const character = hero("ranger");
      character.equipment = { Armor: "Test leather robe", Shield: "Test wall" };
      expect(getArmorNonproficiencyPenalties(character).map((entry) => entry.penalty)).toEqual([-4, -8]);
      expect(getItemProficiencyWarning(character, item("Test wall"))).toContain("not proficient");
    } finally {
      deleteCustomStoreItem("Test leather robe");
      deleteCustomStoreItem("Test wall");
    }
  });
});

describe("nonproficiency checks and attacks", () => {
  it.each(["Ride", "Use Rope"])("extends the penalties to %s", (skill) => {
    const character = hero();
    expect(getSkillCheckModifier(character, skill)).toBe(-3);
    expect(getSkillCheckPenalties(character, skill).map((entry) => entry.source)).toEqual(["armor (nonprof.)", "shield (nonprof.)"]);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    expect(getSkillCheckModifier(character, skill)).toBe(4);
    expect(getSkillCheckPenalties(character, skill)).toEqual([]);
  });

  it("does not double-count normal ACP, including Swim and limited untrained Sleight of Hand", () => {
    const character = hero();
    expect(getSkillCheckModifier(character, "Hide")).toBe(-3);
    expect(getSkillCheckModifier(character, "Climb")).toBe(-2);
    expect(getSkillCheckModifier(character, "Swim")).toBe(-9);
    expect(getSkillCheckModifier(character, "Sleight of Hand")).toBe(-3);
    expect(getSkillCheckModifier(character, "Tumble")).toBeNull();
    expect(getSkillCheckPenalties(character, "Tumble")).toEqual([]);
  });

  it("preserves the worse-load rule for ordinary ACP but does not apply load penalties to exempt skills", () => {
    const character = hero();
    character.abilities.str = 10;
    character.equipment = { Armor: "Chain Shirt", Shield: "Buckler" };
    character.inventory = { "Chain Shirt": 3 };
    expect(getSkillCheckModifier(character, "Hide")).toBe(-2);
    expect(getSkillCheckModifier(character, "Ride")).toBe(1);
    expect(getSkillCheckPenalties(character, "Hide")).toMatchObject([{ source: "load", penalty: -6 }]);
  });

  it.each(["Listen", "Spot", "Knowledge (arcana)", "Concentration", "Bluff", "Spellcraft"])(
    "does not penalize %s for armor nonproficiency", (skill) => {
      const character = hero();
      character.skills[skill] = 1;
      expect(getSkillCheckPenalties(character, skill)).toEqual([]);
      expect(getSkillCheckModifier(character, skill)).toBe(1);
    },
  );

  it.each(["Longsword", "Longbow"])("reduces %s attack rolls, not damage, and names both causes", (weapon) => {
    const character = hero();
    const before = getEquippedWeaponStats(character, `${weapon} (Medium)`);
    expect(before).toMatchObject({ nonproficiencyPenalty: -7 });
    character.equipment = {};
    const after = getEquippedWeaponStats(character, `${weapon} (Medium)`);
    expect(after!.attack - before!.attack).toBe(7);
    expect(after!.damage).toBe(before!.damage);
  });

  it("keeps the separate Weapon Finesse shield penalty in addition to shield nonproficiency", () => {
    const character = hero("rogue");
    character.abilities.str = 10;
    character.equipment = { Shield: "Heavy Steel Shield" };
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getEquippedWeaponStats(character, "Rapier (Medium)")).toMatchObject({
      abilityAttackBonus: 4, finessePenalty: -2, nonproficiencyPenalty: -2, attack: 0,
    });
  });

  it("adds nonproficiency to both two-weapon attacks without changing two-weapon penalties", () => {
    const character = hero("rogue");
    character.equipment["Main Weapon"] = "Dagger (Medium)";
    character.equipment["Off Hand Weapon"] = "Dagger (Medium)";
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", -4, "Main Weapon")).toMatchObject({
      attack: -6, attackPenalty: -4, nonproficiencyPenalty: -7,
    });
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", -8, "Off Hand Weapon")).toMatchObject({
      attack: -10, attackPenalty: -8, nonproficiencyPenalty: -7,
    });
  });

  it("uses masterwork/magic reductions and stays silent when the actual penalty is zero", () => {
    const character = hero();
    character.equipment = { Armor: "+2 Chain Shirt", Shield: "Masterwork Buckler" };
    expect(getArmorNonproficiencyPenalties(character)).toMatchObject([{ penalty: -1 }]);
    character.equipment = { Armor: "Leather Armor", Shield: "Masterwork Buckler" };
    expect(getArmorNonproficiencyPenalties(character)).toEqual([]);
    expect(getSkillCheckPenalties(character, "Ride")).toEqual([]);
    expect(getEquippedWeaponStats(character, "Longbow (Medium)")?.nonproficiencyPenalty).toBe(0);
  });
});

it("shows compact nonproficiency causes, adjusts initiative, and agrees on both sheets", async () => {
  const character = hero();
  character.equipment["Main Weapon"] = "Dagger (Medium)";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  await screen.findByRole("group", { name: "Ride skill" });
  expect(container.querySelector('[aria-label="Ride skill"] .skill-penalty')?.textContent).toBe("-5 armor (nonprof.), -2 shield (nonprof.)");
  expect(container.querySelector(".combat-weapon-stat .attack-penalty")?.getAttribute("title")).toContain("Chainmail: -5");
  const attacks = container.querySelector(".combat-weapon-row");
  if (!(attacks instanceof HTMLElement)) throw new Error("Missing weapon summary");
  expect(within(attacks).getByText("Attack -2")).toBeDefined();
  const initiative = screen.getByText("Initiative", { selector: ".stat > small" }).parentElement!;
  expect(within(initiative).getByRole("strong").textContent).toBe("-3");
  expect(initiative.title).toContain("Heavy Steel Shield");
  fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
  await screen.findByText("EQUIPMENT SLOTS");
  expect(screen.getByText(/Attack: -2 .*armor\/shield nonproficiency/)).toBeDefined();
  expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
});

it("updates penalties provisionally on multiclass level-up and restores them on discard", () => {
  const character = hero("rogue");
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  vi.spyOn(window, "alert").mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
  const classSelect = screen.getByRole("combobox", { name: /class/i });
  fireEvent.change(classSelect, { target: { value: "fighter" } });
  expect(container.querySelector('[aria-label="Ride skill"] .skill-penalty')).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
  expect(container.querySelector('[aria-label="Ride skill"] .skill-penalty')).not.toBeNull();
});
