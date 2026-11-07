import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type ClassId, type PrestigeClassId } from "../src/domain";
import { addCustomStoreItems, deleteCustomStoreItem, findStoreItem, type StoreItem } from "../src/data/equipmentCatalog";
import { getArmorNonproficiencyPenalties, getAvailableFeats, getEquippedWeaponStats,
  getAvailableFeatWeaponChoices, getFeatWeaponSelectionWarnings,
  getAvailableFeatSkillChoices, getFeatSkillSelectionWarnings,
  getAvailableFeatSpellSchoolChoices, getFeatSpellSchoolSelectionWarnings,
  getItemProficiencyWarning, getSkillCheckModifier, getSkillCheckPenalties,
  isArmorShieldProficient, isWeaponProficient, normalizeFeatSelections,
  normalizeFeatWeaponSelections, normalizeFeatSkillSelections,
  normalizeFeatSpellSchoolSelections } from "../src/rules";
import { savedCharacterStorageKey } from "../src/storage";
import { readStoredCharacter } from "./storageTestHelpers";
import App from "../src/App";

function hero(classId: ClassId = "wizard") {
  const character = cloneCharacter(initialCharacter);
  character.classLevels = [{ classId, level: 1 }];
  character.abilities.str = 20;
  character.abilities.dex = 18;
  character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
  return character;
}

function prestigeHero(prestigeClassId: PrestigeClassId) {
  const character = hero();
  character.classLevels.push({ classId: "wizard", prestigeClassId, level: 1 });
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

  describe("prestige-class weapon proficiency", () => {
    it.each(["arcane-archer", "duelist", "dwarven-defender"] as const)(
      "%s grants simple and martial weapon proficiency, but not exotic proficiency",
      (prestigeClassId) => {
        const character = prestigeHero(prestigeClassId);
        expect(isWeaponProficient(character, item("Longsword"))).toBe(true);
        expect(isWeaponProficient(character, item("Spear"))).toBe(true);
        expect(isWeaponProficient(character, item("Spiked Chain"))).toBe(false);
      },
    );

    it("grants the assassin's listed weapon proficiencies without implying all simple or martial weapons", () => {
      const character = prestigeHero("assassin");
      for (const weapon of [
        "Dagger", "Dart", "Hand Crossbow", "Heavy Crossbow", "Light Crossbow",
        "Rapier", "Sap", "Shortbow", "Composite Shortbow", "Short Sword",
      ]) {
        expect(isWeaponProficient(character, item(weapon)), weapon).toBe(true);
      }
      expect(isWeaponProficient(character, item("Longbow"))).toBe(false);
      expect(isWeaponProficient(character, item("Spear"))).toBe(false);
      expect(isWeaponProficient(character, item("Repeating Heavy Crossbow"))).toBe(false);
    });

    it("grants the shadowdancer's listed weapons and leaves other weapons unproficient", () => {
      const character = prestigeHero("shadowdancer");
      for (const weapon of [
        "Club", "Dagger", "Dart", "Hand Crossbow", "Heavy Crossbow", "Light Crossbow",
        "Light Mace", "Heavy Mace", "Morningstar", "Quarterstaff", "Rapier", "Sap",
        "Shortbow", "Composite Shortbow", "Short Sword",
      ]) {
        expect(isWeaponProficient(character, item(weapon)), weapon).toBe(true);
      }
      expect(isWeaponProficient(character, item("Longbow"))).toBe(false);
      expect(isWeaponProficient(character, item("Spear"))).toBe(false);
    });

    it("does not grant weapon proficiency from other core or unverified Dragonlance prestige classes", () => {
      expect(isWeaponProficient(prestigeHero("eldritch-knight"), item("Longsword"))).toBe(false);
      expect(isWeaponProficient(prestigeHero("knight-of-the-crown"), item("Longsword"))).toBe(false);
    });

    it("supports saved prestige-class selections without a prestige class-level entry", () => {
      const character = hero();
      character.prestigeClass = "arcane-archer";
      expect(isWeaponProficient(character, item("Longsword"))).toBe(true);
    });

    it("removes the nonproficiency warning and attack penalty for a granted martial weapon", () => {
      const character = prestigeHero("arcane-archer");
      character.equipment = {};
      expect(getItemProficiencyWarning(character, item("Longsword"))).toBeNull();
      expect(getEquippedWeaponStats(character, "Longsword (Medium)"))
        .toMatchObject({ nonproficiencyPenalty: 0 });
    });
  });

  describe("racial weapon familiarity", () => {
    it("grants Kagonesti their source-listed weapon proficiencies only in Dragonlance", () => {
      const kagonesti = hero();
      kagonesti.race = "Kagonesti Elf";
      kagonesti.ruleset = "dragonlance-user-pack";
      for (const weapon of [
        "Short Sword",
        "Longspear",
        "Shortbow",
        "Composite Shortbow",
        "Longbow",
        "Composite Longbow",
      ]) {
        expect(getItemProficiencyWarning(kagonesti, item(weapon))).toBeNull();
      }

      kagonesti.ruleset = "core-35-srd";
      expect(getItemProficiencyWarning(kagonesti, item("Short Sword"))).toContain("not proficient");
    });

    it("grants sea elves their source-listed trident, longspear, and net proficiencies", () => {
      const dargonesti = hero();
      dargonesti.race = "Dargonesti Elf";
      dargonesti.ruleset = "dragonlance-monster-classes";
      for (const weapon of ["Trident", "Longspear", "Net"]) {
        expect(getItemProficiencyWarning(dargonesti, item(weapon))).toBeNull();
      }
      expect(getItemProficiencyWarning(dargonesti, item("Longsword"))).toContain("not proficient");

      dargonesti.ruleset = "core-35-srd";
      expect(getItemProficiencyWarning(dargonesti, item("Trident"))).toContain("not proficient");
    });

    it("grants only the appropriate core racial weapon proficiencies", () => {
      const dwarf = hero();
      dwarf.race = "Dwarf";
      expect(getItemProficiencyWarning(dwarf, item("Dwarven Waraxe"))).toContain("not proficient");
      expect(getItemProficiencyWarning(dwarf, item("Warhammer"))).toContain("not proficient");
      const urgrosh: StoreItem = {
        name: "Dwarven Urgrosh",
        category: "Weapons",
        price: 50,
        weight: "12 lb.",
        custom: true,
        proficiency: "Exotic",
      };
      expect(getItemProficiencyWarning(dwarf, urgrosh)).toContain("not proficient");
      dwarf.classLevels = [{ classId: "fighter", level: 1 }];
      expect(getItemProficiencyWarning(dwarf, item("Dwarven Waraxe"))).toBeNull();
      expect(getItemProficiencyWarning(dwarf, urgrosh)).toBeNull();

      const gnome = hero();
      gnome.race = "Gnome";
      expect(getItemProficiencyWarning(gnome, item("Gnome Hooked Hammer"))).toContain("not proficient");
      gnome.classLevels = [{ classId: "fighter", level: 1 }];
      expect(getItemProficiencyWarning(gnome, item("Gnome Hooked Hammer"))).toBeNull();

      const elf = hero();
      elf.race = "Elf";
      expect(getItemProficiencyWarning(elf, item("Longsword"))).toBeNull();
      expect(getItemProficiencyWarning(elf, item("Composite Longbow"))).toBeNull();
      elf.race = "Half-elf";
      expect(getItemProficiencyWarning(elf, item("Composite Longbow"))).toContain("not proficient");
    });
  });

  it("uses each core class's weapon list and applies the -4 attack-only penalty", () => {
    const wizard = hero("wizard");
    wizard.equipment = {};
    expect(isWeaponProficient(wizard, item("Dagger"))).toBe(true);
    expect(isWeaponProficient(wizard, item("Heavy Crossbow"))).toBe(true);
    expect(isWeaponProficient(wizard, item("Morningstar"))).toBe(false);
    expect(getItemProficiencyWarning(wizard, item("Longbow"))).toContain("not proficient");
    const wizardLongbow = getEquippedWeaponStats(wizard, "Longbow (Medium)");
    expect(wizardLongbow).toMatchObject({ nonproficiencyPenalty: -4 });

    const druid = hero("druid");
    expect(isWeaponProficient(druid, item("Scimitar"))).toBe(true);
    expect(isWeaponProficient(druid, item("Longbow"))).toBe(false);
    const monk = hero("monk");
    expect(isWeaponProficient(monk, item("Kama"))).toBe(true);
    expect(isWeaponProficient(monk, item("Longsword"))).toBe(false);
    const bard = hero("bard");
    expect(isWeaponProficient(bard, item("Whip"))).toBe(true);
    expect(isWeaponProficient(bard, item("Shortbow"))).toBe(true);
    expect(isWeaponProficient(bard, item("Battleaxe"))).toBe(false);
    expect(isWeaponProficient(bard, item("Composite Shortbow"))).toBe(false);
    const fighter = hero("fighter");
    expect(isWeaponProficient(fighter, item("Composite Longbow"))).toBe(true);
    expect(isWeaponProficient(fighter, item("Spiked Chain"))).toBe(false);
    const rogue = hero("rogue");
    expect(isWeaponProficient(rogue, item("Hand Crossbow"))).toBe(true);
    expect(isWeaponProficient(rogue, item("Net"))).toBe(false);

    wizard.classLevels.push({ classId: "fighter", level: 1 });
    expect(getItemProficiencyWarning(wizard, item("Longbow"))).toBeNull();
    expect(getEquippedWeaponStats(wizard, "Longbow (Medium)")?.nonproficiencyPenalty).toBe(0);
    expect(wizardLongbow?.damage).toBe(getEquippedWeaponStats(wizard, "Longbow (Medium)")?.damage);
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
    expect(getItemProficiencyWarning(character, item("Buckler"))).toContain("nonwooden shields");
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

  it("grants Exotic Weapon Proficiency only for the chosen exotic weapon and enables matching weapon feats", () => {
    const character = hero("fighter");
    const featId = "exotic-weapon-proficiency";
    const choices = getAvailableFeatWeaponChoices(character, featId, "general-1");
    expect(getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id))
      .toContain(featId);
    expect(choices).toContain("Spiked Chain");
    expect(choices).not.toContain("Longsword");
    expect(choices).not.toContain("Shield Bash");

    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.equipment = {};
    character.featSelections = { "general-1": featId };
    character.featWeaponSelections = { "general-1": "Spiked Chain" };
    expect(getAvailableFeatWeaponChoices(character, "weapon-focus", "human-1"))
      .toContain("Spiked Chain");

    character.featSelections = {
      "general-1": featId,
      "human-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    character.featWeaponSelections = {
      "general-1": "Spiked Chain",
      "human-1": "Spiked Chain",
      "fighter-4": "Spiked Chain",
    };
    expect(isWeaponProficient(character, item("Spiked Chain"))).toBe(true);
    expect(isWeaponProficient(character, item("Orc Double Axe"))).toBe(false);
    expect(getAvailableFeatWeaponChoices(character, "weapon-specialization", "fighter-4"))
      .toContain("Spiked Chain");
    expect(getAvailableFeatWeaponChoices(character, featId, "fighter-2"))
      .not.toContain("Spiked Chain");
    expect(getEquippedWeaponStats(character, "Spiked Chain (Medium)")).toMatchObject({
      weaponFocusBonus: 1,
      weaponSpecializationBonus: 2,
      nonproficiencyPenalties: [],
    });
    expect(getEquippedWeaponStats(character, "Orc Double Axe (Medium)"))
      .toMatchObject({ nonproficiencyPenalty: -4 });
  });

  it("offers repeatable weapon feats only for new proficient weapon types and enforces Fighter 4", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }, { classId: "rogue", level: 10 }];
    expect(getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id))
      .toContain("weapon-focus");
    expect(getAvailableFeats(character, { fighterOnly: true }).map((feat) => feat.id))
      .not.toContain("weapon-specialization");

    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": "Longsword" };
    expect(getAvailableFeatWeaponChoices(character, "weapon-focus", "fighter-2"))
      .not.toContain("Longsword");
    expect(getAvailableFeats(character, { fighterOnly: true }, "fighter-2")
      .map((feat) => feat.id)).toContain("weapon-focus");
    expect(getAvailableFeatWeaponChoices(character, "weapon-specialization", "fighter-2"))
      .toEqual([]);

    character.classLevels = [{ classId: "fighter", level: 4 }];
    expect(getAvailableFeats(character, { fighterOnly: true }, "fighter-4")
      .map((feat) => feat.id)).toContain("weapon-specialization");
    expect(getAvailableFeatWeaponChoices(character, "weapon-specialization", "fighter-4"))
      .toEqual(["Longsword"]);
  });

  it("offers Improved Critical at BAB +8 for one proficient weapon type", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 7 }];
    expect(getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id))
      .not.toContain("improved-critical");

    character.classLevels = [{ classId: "fighter", level: 8 }];
    expect(getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id))
      .toContain("improved-critical");
    expect(getAvailableFeatWeaponChoices(character, "improved-critical", "fighter-8"))
      .toContain("Longsword");

    character.featSelections = { "fighter-8": "improved-critical" };
    character.featWeaponSelections = { "fighter-8": "Longsword" };
    expect(getAvailableFeatWeaponChoices(character, "improved-critical", "human-1"))
      .not.toContain("Longsword");
  });

  it("normalizes weapon choices and rejects missing or duplicate weapon types", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 4 }];
    character.featSelections = {
      "general-1": "weapon-focus",
      "human-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
    };
    const selections = {
      "general-1": "Longsword",
      "human-1": "Longsword",
      "fighter-4": "Longsword",
    };
    character.featWeaponSelections = normalizeFeatWeaponSelections(character, selections);
    expect(character.featWeaponSelections).toEqual({
      "general-1": "Longsword",
      "fighter-4": "Longsword",
    });
    expect(getFeatWeaponSelectionWarnings(character)).toEqual([
      "Choose a valid weapon for Human bonus feat.",
    ]);

    character.featWeaponSelections = normalizeFeatWeaponSelections(character, {
      "general-1": "Longsword",
      "human-1": "Dagger",
      "fighter-4": "Dagger",
    });
    expect(character.featWeaponSelections).toEqual({
      "general-1": "Longsword",
      "human-1": "Dagger",
      "fighter-4": "Dagger",
    });
    expect(getFeatWeaponSelectionWarnings(character)).toEqual([]);
  });

  it("lets a character choose and display a weapon for Weapon Focus", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const featSlot = document.querySelector<HTMLElement>(".feat-choices label");
    if (!featSlot) throw new Error("Missing first feat slot.");
    fireEvent.click(within(featSlot).getByRole("button", { name: "General feat (level 1)" }));
    const weaponFocusOption = within(featSlot).getByRole("option", { name: /^Weapon Focus/ });
    expect(weaponFocusOption.textContent).toContain("Source: D&D 3.5 Core SRD");
    expect(weaponFocusOption.textContent).toContain("Book: Player's Handbook (3.5)");
    fireEvent.click(weaponFocusOption);
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 1) weapon",
      }),
      { target: { value: "Longsword" } },
    );
    const chosenFeat = screen.getByText("Weapon Focus (Longsword)");
    expect(chosenFeat.closest(".chosen-feat")?.textContent)
      .toContain("Source: D&D 3.5 Core SRD");
    expect(chosenFeat.closest(".chosen-feat")?.textContent)
      .toContain("Book: Player's Handbook (3.5)");
  });

  it("allows repeat Skill Focus choices only for different skills", () => {
    const character = hero();
    character.featSelections = { "general-1": "skill-focus" };
    character.featSkillSelections = { "general-1": "Listen" };

    expect(getAvailableFeatSkillChoices(character, "human-1")).not.toContain("Listen");
    expect(getAvailableFeatSkillChoices(character, "human-1")).toContain("Diplomacy");
    expect(
      getAvailableFeats(character, { fighterOnly: false }, "human-1")
        .map((feat) => feat.id),
    ).toContain("skill-focus");
    expect(
      normalizeFeatSelections(character, {
        ...character.featSelections,
        "human-1": "skill-focus",
      }),
    ).toEqual({ "general-1": "skill-focus", "human-1": "skill-focus" });

    const duplicateTargetCharacter = {
      ...character,
      featSelections: {
        ...character.featSelections,
        "human-1": "skill-focus",
      },
      featSkillSelections: {
        ...character.featSkillSelections,
        "human-1": "Listen",
      },
    };
    expect(
      normalizeFeatSkillSelections(
        duplicateTargetCharacter,
        duplicateTargetCharacter.featSkillSelections ?? {},
      ),
    ).toEqual({ "general-1": "Listen" });
    expect(getFeatSkillSelectionWarnings(duplicateTargetCharacter)).toHaveLength(2);
  });

  it("allows repeat Spell Focus choices only for different schools", () => {
    const character = hero();
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };

    expect(getAvailableFeatSpellSchoolChoices(character, "human-1")).not.toContain("Illusion");
    expect(getAvailableFeatSpellSchoolChoices(character, "human-1")).toContain("Abjuration");
    expect(
      getAvailableFeats(character, { fighterOnly: false }, "human-1")
        .map((feat) => feat.id),
    ).toContain("spell-focus");
    expect(
      normalizeFeatSelections(character, {
        ...character.featSelections,
        "human-1": "spell-focus",
      }),
    ).toEqual({ "general-1": "spell-focus", "human-1": "spell-focus" });

    const duplicateTargetCharacter = {
      ...character,
      featSelections: {
        ...character.featSelections,
        "human-1": "spell-focus",
      },
      featSpellSchoolSelections: {
        ...character.featSpellSchoolSelections,
        "human-1": "Illusion" as const,
      },
    };
    expect(
      normalizeFeatSpellSchoolSelections(
        duplicateTargetCharacter,
        duplicateTargetCharacter.featSpellSchoolSelections ?? {},
      ),
    ).toEqual({ "general-1": "Illusion" });
    expect(getFeatSpellSchoolSelectionWarnings(duplicateTargetCharacter)).toHaveLength(2);
  });

  it("lets a character choose and display a school for Spell Focus", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const featSlot = document.querySelector<HTMLElement>(".feat-choices label");
    if (!featSlot) throw new Error("Missing first feat slot.");
    fireEvent.click(within(featSlot).getByRole("button", { name: "General feat (level 1)" }));
    fireEvent.click(within(featSlot).getByRole("option", { name: /^Spell Focus/ }));
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 1) spell school",
      }),
      { target: { value: "Illusion" } },
    );
    expect(screen.getByText("Spell Focus (Illusion)")).toBeDefined();
  });

  it("limits Greater Spell Focus to schools already selected for Spell Focus", () => {
    const character = hero();
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.featSelections = {
      "general-1": "spell-focus",
      "general-3": "greater-spell-focus",
      "general-6": "greater-spell-focus",
      "human-1": "spell-focus",
    };
    character.featSpellSchoolSelections = {
      "general-1": "Illusion",
      "general-3": "Evocation",
      "general-6": "Illusion",
      "human-1": "Evocation",
    };

    expect(
      getAvailableFeatSpellSchoolChoices(character, "general-3", "greater-spell-focus"),
    ).toEqual(["Evocation"]);
    expect(
      getAvailableFeatSpellSchoolChoices(character, "general-6", "greater-spell-focus"),
    ).toEqual(["Illusion"]);
    expect(
      getAvailableFeatSpellSchoolChoices(character, "general-9", "greater-spell-focus"),
    ).toEqual([]);
    expect(
      getAvailableFeats(character, { fighterOnly: false, characterLevel: 3 }, "general-3")
        .map((feat) => feat.id),
    ).toContain("greater-spell-focus");
    expect(normalizeFeatSelections(character, character.featSelections)).toEqual({
      "general-1": "spell-focus",
      "general-3": "greater-spell-focus",
      "general-6": "greater-spell-focus",
      "human-1": "spell-focus",
    });
    expect(
      normalizeFeatSpellSchoolSelections(
        character,
        character.featSpellSchoolSelections,
      ),
    ).toEqual({
      "general-1": "Illusion",
      "human-1": "Evocation",
      "general-3": "Evocation",
      "general-6": "Illusion",
    });
    expect(getFeatSpellSchoolSelectionWarnings(character)).toEqual([]);
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }, "general-1")
        .map((feat) => feat.id),
    ).not.toContain("greater-spell-focus");
  });

  it("requires 3rd-level arcane spells for Empower and Maximize Spell", () => {
    const wizard = hero("wizard");
    wizard.classLevels[0].level = 5;
    wizard.abilities.int = 13;
    const wizardFeats = () =>
      getAvailableFeats(wizard, { fighterOnly: false }).map((feat) => feat.id);

    expect(wizardFeats()).toContain("empower-spell");
    expect(wizardFeats()).not.toContain("maximize-spell");
    wizard.featSelections = { "general-1": "extend-spell" };
    expect(wizardFeats()).toContain("maximize-spell");

    const cleric = hero("cleric");
    cleric.classLevels[0].level = 5;
    cleric.abilities.wis = 13;
    cleric.featSelections = { "general-1": "extend-spell" };
    const clericFeats = getAvailableFeats(cleric, { fighterOnly: false })
      .map((feat) => feat.id);
    expect(clericFeats).not.toContain("empower-spell");
    expect(clericFeats).not.toContain("maximize-spell");
  });

  it("offers Heighten Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("heighten-spell");
  });

  it("offers Extend Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("extend-spell");
  });

  it("offers Enlarge Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("enlarge-spell");
  });

  it("offers Quicken Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("quicken-spell");
  });

  it("offers Silent Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("silent-spell");
  });

  it("offers Still Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("still-spell");
  });

  it("offers Widen Spell without prerequisites", () => {
    expect(
      getAvailableFeats(hero(), { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("widen-spell");
  });

  it("requires another metamagic feat before Sculpt Spell", () => {
    const character = hero();
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("sculpt-spell");

    character.featSelections = { "general-1": "spell-focus" };
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("sculpt-spell");

    character.featSelections = { "general-1": "widen-spell" };
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("sculpt-spell");
  });

  it("requires another metamagic feat before Maximize Spell", () => {
    const character = hero();
    character.classLevels[0].level = 5;
    character.abilities.int = 13;
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("maximize-spell");

    character.featSelections = { "general-1": "heighten-spell" };
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("maximize-spell");
  });

  it("requires access to 3rd-level arcane spells for Empower Spell", () => {
    const character = hero();
    character.abilities.int = 13;
    character.abilities.cha = 13;
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("empower-spell");

    character.classLevels = [{ classId: "wizard", level: 4 }];
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("empower-spell");
    character.classLevels = [{ classId: "wizard", level: 5 }];
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("empower-spell");

    character.classLevels = [{ classId: "sorcerer", level: 5 }];
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).not.toContain("empower-spell");
    character.classLevels = [{ classId: "sorcerer", level: 6 }];
    expect(
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id),
    ).toContain("empower-spell");
  });

  it("requires Spell Penetration before Greater Spell Penetration is available", () => {
    const character = hero();
    expect(
      getAvailableFeats(character, { fighterOnly: false }, "general-1")
        .map((feat) => feat.id),
    ).not.toContain("greater-spell-penetration");

    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.featSelections = { "general-1": "spell-penetration" };
    const greaterSpellPenetration = getAvailableFeats(
      character,
      { fighterOnly: false },
      "general-3",
    ).find((feat) => feat.id === "greater-spell-penetration");
    expect(greaterSpellPenetration?.source).toBe("core-35-srd");
    expect(greaterSpellPenetration?.sourceBook).toBe("Player's Handbook (3.5)");
  });

  it("lets a character choose Greater Spell Focus for a school already selected", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const generalSlot = screen.getByRole("button", {
      name: "General feat (level 1)",
    }).closest("label");
    const humanSlot = screen.getByRole("button", {
      name: "Human bonus feat",
    }).closest("label");
    if (!generalSlot || !humanSlot) throw new Error("Missing level-one feat slots.");

    fireEvent.click(within(generalSlot).getByRole("button", { name: "General feat (level 1)" }));
    fireEvent.click(within(generalSlot).getByRole("option", { name: /^Spell Focus/ }));
    fireEvent.change(
      within(generalSlot).getByRole("combobox", {
        name: "General feat (level 1) spell school",
      }),
      { target: { value: "Illusion" } },
    );
    fireEvent.click(within(humanSlot).getByRole("button", { name: "Human bonus feat" }));
    fireEvent.click(within(humanSlot).getByRole("option", { name: /^Greater Spell Focus/ }));
    fireEvent.change(
      within(humanSlot).getByRole("combobox", {
        name: "Human bonus feat spell school",
      }),
      { target: { value: "Illusion" } },
    );
    expect(screen.getByText("Spell Focus (Illusion)")).toBeDefined();
    expect(screen.getByText("Greater Spell Focus (Illusion)")).toBeDefined();
  });

  it("lets a character choose and display a skill for Skill Focus", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const featSlot = document.querySelector<HTMLElement>(".feat-choices label");
    if (!featSlot) throw new Error("Missing first feat slot.");
    fireEvent.click(within(featSlot).getByRole("button", { name: "General feat (level 1)" }));
    fireEvent.click(within(featSlot).getByRole("option", { name: /^Skill Focus/ }));
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 1) skill",
      }),
      { target: { value: "Listen" } },
    );
    expect(screen.getByText("Skill Focus (Listen)")).toBeDefined();
    expect(
      screen.getByRole("group", { name: "Listen skill" })
        .querySelector(":scope > strong")?.textContent,
    ).toBe("+3");
  });

  it("lets a character choose a specific exotic weapon for Exotic Weapon Proficiency", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const featSlot = document.querySelector<HTMLElement>(".feat-choices label");
    if (!featSlot) throw new Error("Missing first feat slot.");
    fireEvent.click(within(featSlot).getByRole("button", { name: "General feat (level 1)" }));
    fireEvent.click(
      within(featSlot).getByRole("option", { name: /^Exotic Weapon Proficiency/ }),
    );
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 1) weapon",
      }),
      { target: { value: "Spiked Chain" } },
    );
    expect(screen.getByText("Exotic Weapon Proficiency (Spiked Chain)")).toBeDefined();
  });

  it("requires Strength 13 for Exotic Weapon Proficiency with a bastard sword or dwarven waraxe", () => {
    const character = hero("fighter");
    character.abilities.str = 12;
    const bastardSword: StoreItem = {
      name: "Bastard Sword",
      category: "Weapons",
      custom: true,
      proficiency: "Exotic",
      price: 35,
      weight: "6 lb.",
    };
    character.customItems = [bastardSword];
    const availableChoices = () =>
      getAvailableFeatWeaponChoices(character, "exotic-weapon-proficiency");
    expect(availableChoices()).not.toContain("Bastard Sword");
    expect(availableChoices()).not.toContain("Dwarven Waraxe");

    character.abilities.str = 13;
    expect(availableChoices()).toContain("Bastard Sword");
    expect(availableChoices()).toContain("Dwarven Waraxe");
    character.featSelections = { "general-1": "exotic-weapon-proficiency" };
    character.featWeaponSelections = { "general-1": "Bastard Sword" };
    expect(isWeaponProficient(character, bastardSword)).toBe(true);
    character.abilities.str = 12;
    expect(isWeaponProficient(character, bastardSword)).toBe(false);
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
    expect(before).toMatchObject({ nonproficiencyPenalty: -11 });
    expect(before?.nonproficiencyPenalties.map((entry) => entry.source))
      .toEqual(["armor (nonprof.)", "shield (nonprof.)", "weapon (nonprof.)"]);
    character.equipment = {};
    const after = getEquippedWeaponStats(character, `${weapon} (Medium)`);
    expect(after!.nonproficiencyPenalty).toBe(-4);
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
    character.equipment.Shield = "Buckler";
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", -4, "Main Weapon")).toMatchObject({
      attack: -6, attackPenalty: -4, nonproficiencyPenalty: -6, bucklerAttackPenalty: -1,
    });
    expect(getEquippedWeaponStats(character, "Dagger (Medium)", -8, "Off Hand Weapon")).toMatchObject({
      attack: -10, attackPenalty: -8, nonproficiencyPenalty: -6, bucklerAttackPenalty: -1,
    });
  });

  it("uses masterwork/magic reductions and stays silent when the actual penalty is zero", () => {
    const character = hero();
    character.equipment = { Armor: "+2 Chain Shirt", Shield: "Masterwork Buckler" };
    expect(getArmorNonproficiencyPenalties(character)).toMatchObject([{ penalty: -1 }]);
    character.equipment = { Armor: "Leather Armor", Shield: "Masterwork Buckler" };
    expect(getArmorNonproficiencyPenalties(character)).toEqual([]);
    expect(getSkillCheckPenalties(character, "Ride")).toEqual([]);
    expect(getEquippedWeaponStats(character, "Dagger (Medium)")?.nonproficiencyPenalty).toBe(0);
  });
});

it("shows compact nonproficiency causes, adjusts initiative, and agrees on both sheets", async () => {
  const character = hero();
  character.equipment["Main Weapon"] = "Dagger (Medium)";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  await screen.findByRole("group", { name: "Ride skill" });
  expect(container.querySelector('[aria-label="Ride skill"] .skill-penalty')?.textContent).toBe("-5 armor (nonprof.), -2 shield (nonprof.)");
  await waitFor(() => {
    expect(container.querySelector(".combat-weapon-stat .attack-penalty")?.getAttribute("title"))
      .toContain("Chainmail: -5");
  });
  const attacks = container.querySelector(".combat-weapon-row");
  if (!(attacks instanceof HTMLElement)) throw new Error("Missing weapon summary");
  expect(within(attacks).getByText("Attack -2")).toBeDefined();
  const initiative = screen.getByText("Initiative", { selector: ".stat > small" }).parentElement!;
  expect(within(initiative).getByRole("strong").textContent).toBe("-3");
  expect(initiative.title).toContain("Heavy Steel Shield");
  fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
  await screen.findByText("EQUIPMENT SLOTS");
  expect(screen.getByText(/Attack: -2 .*nonproficiency/)).toBeDefined();
  expect(readStoredCharacter()).toEqual(character);
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

it("shows the weapon nonproficiency attack penalty in both attack summaries", async () => {
  const character = hero("wizard");
  character.equipment = { "Ranged Weapon": "Longbow (Medium)" };
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  const { container } = render(<App />);
  expect(container.querySelector(".combat-weapon-stat .attack-penalty")?.textContent).toBe("-4 weapon (nonprof.)");
  fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
  expect(await screen.findByText(/-4 nonproficiency/)).toBeDefined();
});
