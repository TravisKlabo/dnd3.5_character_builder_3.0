import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { abilityEquipmentItems, getAbilityEquipmentBonus, getConstitutionHitPointAdjustment, getEffectiveAbilityScore } from "../src/abilityEquipment";
import { armorClass, carryingCapacity, cloneCharacter, initialCharacter, type Character } from "../src/domain";
import { findStoreItem } from "../src/data/equipmentCatalog";
import { getClericDomainSlotCount } from "../src/clericDomains";
import { equipInventoryItem, featQualifies, getArmorClassRestrictions, getArmorClassValues, getAvailableSkillCount,
  getDailySpellSlots, getEncumbrance, getEquippedWeaponStats, getLanguageBonusSlots, getMovement, getSavingThrow,
  getSkillCheckModifier, getSkillTotalTooltip, getSpecialAttackBonuses, getSpellSaveDC, getWizardFreeSpellAllowance } from "../src/rules";
import { featCatalog } from "../src/data/characterCatalog";
import { loadSavedCharacter, savedCharacterStorageKey } from "../src/storage";
import { applyHitPointAction, getCurrentHitPoints, getMaximumHitPoints, getStoredCurrentHitPoints } from "../src/hitPoints";
import App from "../src/App";

describe("ability-enhancement equipment", () => {
  it("applies the halfling's unconditional racial bonus to all saves", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Halfling";

    expect(getSavingThrow(character, "fortitude").total).toBe(3);
    expect(getSavingThrow(character, "reflex").total).toBe(1);
    const will = getSavingThrow(character, "will");
    expect(will.total).toBe(1);
    expect(will.detail).toContain("racial +1");
    expect(will.title).toContain("Select context for situational racial bonuses.");
    expect(getSavingThrow(character, "will", ["fear"]).total).toBe(3);
    expect(getSavingThrow(character, "will", ["poison"]).total).toBe(1);
  });

  it("applies conditional racial save bonuses only for matching contexts", () => {
    const dwarf = cloneCharacter(initialCharacter);
    dwarf.race = "Dwarf";
    expect(getSavingThrow(dwarf, "fortitude").total).toBe(2);
    expect(getSavingThrow(dwarf, "fortitude", ["poison"]).total).toBe(4);
    const dwarfSpellSave = getSavingThrow(dwarf, "will", ["spell", "enchantment"]);
    expect(dwarfSpellSave.total).toBe(2);
    expect(dwarfSpellSave.detail).toContain("spell racial +2");

    const elf = cloneCharacter(initialCharacter);
    elf.race = "Elf";
    expect(getSavingThrow(elf, "will", ["enchantment"]).total).toBe(2);

    const gnome = cloneCharacter(initialCharacter);
    gnome.race = "Gnome";
    expect(getSavingThrow(gnome, "will", ["illusion"]).total).toBe(2);
  });

  it.each(abilityEquipmentItems)("supports $name in its matching slot without mutating base scores", (item) => {
    const character = cloneCharacter(initialCharacter);
    const base = { ...character.abilities };
    character.equipment[item.slot] = `${item.name} (Medium)`;
    expect(getEffectiveAbilityScore(character, item.ability)).toBe(10 + item.bonus);
    expect(getAbilityEquipmentBonus(character, item.ability).detail.join("\n")).toContain(item.name);
    expect(character.abilities).toEqual(base);
    expect(findStoreItem(item.name)).toMatchObject({ name: item.name });
    expect(findStoreItem(item.name)?.custom).not.toBe(true);
    const update = vi.fn();
    equipInventoryItem(initialCharacter, item.name, update);
    expect(update).toHaveBeenCalledWith({ [item.slot]: item.name });
  });

  it("uses the highest enhancement for an ability rather than stacking belt and gauntlets", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Waist: "Belt of Giant Strength +4", Hands: "Gauntlets of Ogre Power +2" };
    expect(getEffectiveAbilityScore(character, "str")).toBe(14);
    expect(getAbilityEquipmentBonus(character, "str").detail.join("\n")).toContain("does not stack");
    character.equipment.Waist = "";
    expect(getEffectiveAbilityScore(character, "str")).toBe(12);
    character.equipment.Hands = "";
    expect(getEffectiveAbilityScore(character, "str")).toBe(10);
  });

  it("ignores ownership, incorrect slots, unsupported bonuses and arbitrary custom names", () => {
    const character = cloneCharacter(initialCharacter);
    character.inventory = { "Belt of Giant Strength +6": 1, "Gloves of Dexterity +6": 1 };
    character.equipment = { Head: "Belt of Giant Strength +6", Waist: "Belt of Giant Strength +60",
      Hands: "Custom Gloves of Dexterity +6", Neck: "Periapt of Wisdom +3", Shoulders: "Cloak of Charisma +2 replica" };
    for (const ability of ["str", "dex", "wis", "cha"] as const) expect(getEffectiveAbilityScore(character, ability)).toBe(10);
  });

  it("applies Strength to melee/thrown damage, grapple, load thresholds, movement, and feat qualification", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Waist: "Belt of Giant Strength +4" };
    expect(getEquippedWeaponStats(character, "Longsword (Medium)")).toMatchObject({ attack: 3, damage: "1d8+2" });
    expect(getEquippedWeaponStats(character, "Greatsword (Medium)")).toMatchObject({ damage: "2d6+3" });
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Off Hand Weapon")).toMatchObject({ damage: "1d4+1" });
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", 0, "Ranged Weapon")).toMatchObject({ attack: 1, damage: "1d4+2" });
    expect(getSpecialAttackBonuses(character)).toMatchObject({ meleeTouch: 3, rangedTouch: 1, grapple: 3 });
    expect(getSkillCheckModifier(character, "Climb")).toBe(2);
    expect(getSkillTotalTooltip(character, "Climb")).toContain("Belt of Giant Strength +4");
    expect(carryingCapacity(character)).toEqual({ light: 58, medium: 116, heavy: 175 });
    character.inventory = { Backpack: 20 };
    expect(getEncumbrance(character).load).toBe("Light");
    expect(getMovement(character).speed).toBe(30);
    const powerAttack = featCatalog.find((feat) => feat.id === "power-attack")!;
    expect(featQualifies(character, powerAttack, { fighterOnly: false })).toBe(true);
    character.equipment.Waist = "";
    expect(getEncumbrance(character).load).toBe("Medium");
    expect(getMovement(character).speed).toBe(20);
    expect(featQualifies(character, powerAttack, { fighterOnly: false })).toBe(false);
  });

  it("uses Dexterity for AC variants, Reflex, skills, ranged/touch attacks, and Finesse with caps intact", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Hands: "Gloves of Dexterity +6" };
    expect(armorClass(character)).toBe(13);
    expect(getArmorClassValues(character)).toMatchObject({ normal: 13, touch: 13, flatFooted: 10 });
    expect(getSavingThrow(character, "reflex").total).toBe(3);
    expect(getSavingThrow(character, "reflex").title).toContain("Gloves of Dexterity +6");
    expect(getSkillCheckModifier(character, "Hide")).toBe(3);
    expect(getEquippedWeaponStats(character, "Longbow (Medium)")?.attack).toBe(4);
    expect(getSpecialAttackBonuses(character).rangedTouch).toBe(4);
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getEquippedWeaponStats(character, "Rapier (Medium)")?.attack).toBe(4);
    expect(getSpecialAttackBonuses(character).meleeTouch).toBe(4);
    character.equipment.Armor = "Full Plate (Medium)";
    expect(getArmorClassValues(character)).toMatchObject({ normal: 19, touch: 11, flatFooted: 18 });
    expect(getArmorClassRestrictions(character).join("\n")).toContain("max DEX +1");
  });

  it.each(["cleric", "druid", "paladin", "ranger", "mystic"] as const)(
    "uses enhanced Wisdom for %s casting ability thresholds, DCs, and daily slots", (classId) => {
      const character = cloneCharacter(initialCharacter);
      character.classLevels = [{ classId, level: 4 }];
      character.equipment.Neck = "Periapt of Wisdom +2";
      expect(getSpellSaveDC(character, classId, 1)).toBe(12);
      expect(getDailySpellSlots(character, classId, 4, 1)).toBeGreaterThan(0);
      expect(getSkillCheckModifier(character, "Listen")).toBe(1);
      expect(getSavingThrow(character, "will").title).toContain("Periapt of Wisdom +2");
      if (classId === "cleric") expect(getClericDomainSlotCount(character, 1)).toBe(1);
      character.equipment.Neck = "";
      expect(getDailySpellSlots(character, classId, 4, 1)).toBe(0);
      if (classId === "cleric") expect(getClericDomainSlotCount(character, 1)).toBe(0);
    },
  );

  it.each(["sorcerer", "bard"] as const)("uses Charisma enhancement for %s casting and Charisma skills", (classId) => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId, level: 2 }];
    character.equipment.Shoulders = "Cloak of Charisma +4";
    expect(getSpellSaveDC(character, classId, 1)).toBe(13);
    expect(getDailySpellSlots(character, classId, 2, 1)).toBeGreaterThan(0);
    expect(getSkillCheckModifier(character, "Bluff")).toBe(2);
    character.equipment.Shoulders = "";
    expect(getDailySpellSlots(character, classId, 2, 1)).toBe(0);
  });

  it("does not automate Constitution, Intelligence, HP, skill points, or racial/base score mutations", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Waist: "Belt of Giant Strength +6" };
    expect(getEffectiveAbilityScore(character, "int")).toBe(10);
    expect(getEffectiveAbilityScore(character, "con")).toBe(10);
    expect(getAvailableSkillCount(character)).toBe(getAvailableSkillCount(initialCharacter));
    expect(character.hitPoints).toBe(10);
    expect(character.abilities).toEqual(initialCharacter.abilities);
  });

  it.each([
    [10, 12, 1], [11, 13, 1], [12, 14, 1], [13, 15, 1], [14, 16, 1],
  ])("applies CON equipment per Hit Die using modifier boundaries (%s to %s)", (base, effective, modifierBonus) => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.con = base;
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.equipment.Neck = "Amulet of Health +2";
    expect(getEffectiveAbilityScore(character, "con")).toBe(effective);
    const adjustment = getConstitutionHitPointAdjustment(character);
    expect(adjustment).toBe(modifierBonus * 3);
    expect(getMaximumHitPoints(character)).toBe(character.hitPoints + adjustment);
    expect(getCurrentHitPoints(character)).toBe(getMaximumHitPoints(character));
    expect(character.abilities.con).toBe(base);
  });

  it("preserves damage and recovery across Constitution gear changes and healing caps", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 2 }];
    character.equipment.Neck = "Amulet of Health +4";
    expect(getMaximumHitPoints(character)).toBe(14);
    expect(getCurrentHitPoints(character)).toBe(14);
    const damaged = applyHitPointAction(character, "damage", 5);
    expect(getCurrentHitPoints(damaged)).toBe(9);
    expect(getStoredCurrentHitPoints(damaged)).toBe(5);
    const unequipped = { ...damaged, equipment: { ...damaged.equipment, Neck: "" } };
    expect(getMaximumHitPoints(unequipped)).toBe(10);
    expect(getCurrentHitPoints(unequipped)).toBe(5);
    const reequipped = { ...unequipped, equipment: { ...unequipped.equipment, Neck: "Amulet of Health +4" } };
    expect(getCurrentHitPoints(reequipped)).toBe(9);
    const healed = applyHitPointAction(reequipped, "heal", 20);
    expect(getCurrentHitPoints(healed)).toBe(14);
    expect(getStoredCurrentHitPoints(healed)).toBe(10);
    expect(getCurrentHitPoints({ ...healed, equipment: { ...healed.equipment, Neck: "" } })).toBe(10);
  });
});

describe("situational racial saving throws", () => {
  it("applies a selected context through the character sheet controls", async () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Halfling";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);

    await screen.findByText("Will", { selector: ".stat > small" });
    const willSave = () =>
      within(screen.getByText("Will", { selector: ".stat > small" }).parentElement!)
        .getByRole("strong").textContent;
    expect(willSave()).toBe("+1");
    await screen.findByText("Apply situational racial bonuses");
    fireEvent.click(screen.getByText("Apply situational racial bonuses"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Fear" }));
    expect(willSave()).toBe("+3");
  });
});

describe("effective score display and persistence", () => {
  it("updates effective cards and initiative, reverts equipment, and saves only base scores", async () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Hands: "Gloves of Dexterity +4", Waist: "Belt of Giant Strength +2" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    expect(screen.getByText("Base 10 + 4 gear")).toBeDefined();
    const initiative = screen.getByText("Initiative", { selector: ".stat > small" }).parentElement!;
    expect(within(initiative).getByRole("strong").textContent).toBe("+2");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character).toEqual(character);
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Hands equipment" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    expect(screen.queryByText("Base 10 + 4 gear")).toBeNull();
    expect(within(screen.getByText("Initiative", { selector: ".stat > small" }).parentElement!).getByRole("strong").textContent).toBe("+0");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    view.unmount();
    render(<App />);
    expect(screen.queryByText("Base 10 + 4 gear")).toBeNull();
    expect(loadSavedCharacter().character.abilities).toEqual(character.abilities);
  });

  it("shows effective casting on both screens and retains over-prepared spells when an item is removed", async () => {
    const character: Character = { ...cloneCharacter(initialCharacter),
      classLevels: [{ classId: "cleric", level: 1 }], equipment: { Neck: "Periapt of Wisdom +2" },
      preparedSpellsByClass: { cleric: ["Bless"] }, preparedSpells: ["Bless"] };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    expect(await screen.findByText("WIS 12")).toBeDefined();
    expect(screen.getByText("DC 12")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Manage spells" }));
    await screen.findByRole("tabpanel");
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Spellcasting Ability" }).value).toBe("WIS 12");
    expect(screen.getByText("Save DC 12")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Neck equipment" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Spells" }));
    await screen.findByRole("tabpanel");
    expect(screen.getByText(/Too many Cleric spells prepared at level 1/)).toBeDefined();
    expect(screen.getByText(/WIS 11 is required/)).toBeDefined();
    expect(screen.getByText("Bless", { exact: true })).toBeDefined();
  });

  it("updates effective INT casting and bonus slots without adding skill points or rewriting base scores", async () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.abilities.int = 10;
    character.skills.Climb = 6;
    character.equipment.Head = "Headband of Intellect +4";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    expect(await screen.findByText("INT 14")).toBeDefined();
    expect(screen.getByText("DC 14")).toBeDefined();
    expect(screen.getByText("L2")).toBeDefined();
    expect(screen.getByText("Base 10 + 4 gear")).toBeDefined();
    expect(screen.getByText("Climb")).toBeDefined();
    const unboosted = { ...character, equipment: { ...character.equipment, Head: "" } };
    expect(getAvailableSkillCount(character)).toBe(getAvailableSkillCount(unboosted));
    expect(getLanguageBonusSlots(character)).toBe(getLanguageBonusSlots(unboosted));
    expect(getWizardFreeSpellAllowance(character).required).toBe(getWizardFreeSpellAllowance(unboosted).required);
    expect(character.abilities.int).toBe(10);
    fireEvent.click(screen.getByRole("button", { name: "Manage spells" }));
    expect((await screen.findByRole<HTMLInputElement>("textbox", { name: "Spellcasting Ability" })).value).toBe("INT 14");
    expect(screen.getByText("10 + spell level + 2")).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
  });

  it("updates Constitution-derived HP, saves, and Concentration on the live character sheet", async () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.hitPoints = 21;
    character.currentHitPoints = 13;
    character.abilities.con = 10;
    character.equipment.Neck = "Amulet of Health +4";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    expect(await screen.findByText("HP 19 / 27")).toBeDefined();
    const fortitude = screen.getByText("Fortitude", { selector: ".stat > small" }).parentElement!;
    expect(within(fortitude).getByRole("strong").textContent).toBe("+5");
    expect(fortitude.title).toContain("Amulet of Health +4");
    const concentration = within(screen.getByRole("group", { name: "Concentration skill" }));
    expect(concentration.getByRole("strong").textContent).toBe("+2");
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Neck equipment" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    expect(screen.getByText("HP 13 / 21")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character).toEqual({ ...character, equipment: { ...character.equipment, Neck: "" } });
  });

  it("discards provisional equipment bonuses without modifying finalized base scores or gear", async () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment.Hands = "Gloves of Dexterity +2";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Hands equipment" }), { target: { value: "Gloves of Dexterity +6" } });
    expect(screen.getByText("Touch 13")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByText("Touch 11")).toBeDefined();
    expect(loadSavedCharacter().character).toEqual(character);
  });
});
