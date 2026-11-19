import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type ClassId, type PrestigeClassId } from "../src/domain";
import { addCustomStoreItems, deleteCustomStoreItem, findStoreItem, type StoreItem } from "../src/data/equipmentCatalog";
import { getArmorNonproficiencyPenalties, getAvailableFeats, getEquippedWeaponStats,
  getAvailableFeatWeaponChoices, getFeatWeaponSelectionWarnings,
  getAvailableFeatSkillChoices, getFeatSkillSelectionWarnings,
  getAvailableFeatSpellSchoolChoices, getFeatSpellSchoolSelectionWarnings,
  getAvailableFeatSpellMasteryChoices, getFeatSpellMasteryChoiceCount,
  getFeatSpellMasterySelectionWarnings, normalizeFeatSpellMasterySelections,
  getItemProficiencyWarning, getSkillCheckModifier, getSkillCheckPenalties,
  isArmorShieldProficient, isWeaponProficient, normalizeFeatSelections,
  normalizeFeatWeaponSelections, normalizeFeatSkillSelections,
  normalizeFeatSpellSchoolSelections } from "../src/rules";
import {
  savedCharacterSetupDraftStorageKey,
  savedCharacterStorageKey,
} from "../src/storage";
import { loadSpellCatalog } from "../src/data/spellCatalog";
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

describe("weapon proficiency feats", () => {
  it.each(["druid", "monk", "wizard"] as const)(
    "offers Simple Weapon Proficiency to %s and grants all simple weapons",
    (classId) => {
      const character = hero(classId);
      expect(isWeaponProficient(character, item("Morningstar"))).toBe(false);
      expect(getAvailableFeats(character, { fighterOnly: false })
        .map((feat) => feat.id)).toContain("simple-weapon-proficiency");

      character.featSelections = normalizeFeatSelections(character, {
        "general-1": "simple-weapon-proficiency",
      });
      expect(isWeaponProficient(character, item("Morningstar"))).toBe(true);
      expect(isWeaponProficient(character, item("Light Crossbow"))).toBe(true);
    },
  );

  it("does not offer redundant Simple Weapon Proficiency to a class proficient with all simple weapons", () => {
    const character = hero("fighter");
    expect(isWeaponProficient(character, item("Morningstar"))).toBe(true);
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("simple-weapon-proficiency");
  });

  it("requires Shield Proficiency for Improved Shield Bash and allows it as a Fighter bonus feat", () => {
    const wizard = hero("wizard");
    expect(getAvailableFeats(wizard, { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("improved-shield-bash");
    wizard.classLevels = [{ classId: "wizard", level: 3 }];
    wizard.featSelections = { "general-1": "shield-proficiency" };
    expect(getAvailableFeats(wizard, {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-2",
    }, "general-2")
      .map((feat) => feat.id)).toContain("improved-shield-bash");

    const fighter = hero("fighter");
    expect(getAvailableFeats(fighter, { fighterOnly: true })
      .map((feat) => feat.id)).toContain("improved-shield-bash");
  });

  it("requires Point Blank Shot for Far Shot and allows it as a Fighter bonus feat", () => {
    const character = hero("fighter");
    const fighterSlot = {
      fighterOnly: true,
      characterLevel: 1,
      id: "fighter-1",
    };
    expect(getAvailableFeats(character, fighterSlot, "fighter-1")
      .map((feat) => feat.id)).not.toContain("far-shot");
    character.featSelections = { "general-1": "point-blank-shot" };
    expect(getAvailableFeats(character, fighterSlot, "fighter-1")
      .map((feat) => feat.id)).toContain("far-shot");
  });

  it("offers Improved Counterspell without prerequisites, but not as a Fighter bonus feat", () => {
    const character = hero("wizard");
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("improved-counterspell");
    expect(getAvailableFeats(character, { fighterOnly: true })
      .map((feat) => feat.id)).not.toContain("improved-counterspell");
  });

  it("offers Eschew Materials generally but not in a Fighter-only slot", () => {
    const character = hero("wizard");
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("eschew-materials");
    expect(getAvailableFeats(hero("fighter"), { fighterOnly: true })
      .map((feat) => feat.id)).not.toContain("eschew-materials");
  });

  it("requires Intelligence 13 and Combat Expertise for Improved Feint", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 2 }];
    const fighterSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).not.toContain("improved-feint");

    character.abilities.int = 13;
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).not.toContain("improved-feint");
    character.featSelections = { "general-1": "combat-expertise" };
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).toContain("improved-feint");
  });

  it("requires Intelligence 13 and Combat Expertise for Improved Disarm and Improved Trip", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.abilities.int = 12;
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const featIds = (slot: typeof fighterBonusSlot) =>
      getAvailableFeats(character, slot, slot.id).map((feat) => feat.id);

    expect(featIds(fighterBonusSlot)).not.toContain("combat-expertise");
    expect(featIds(fighterBonusSlot)).not.toContain("improved-disarm");
    expect(featIds(fighterBonusSlot)).not.toContain("improved-trip");

    character.abilities.int = 13;
    expect(featIds(fighterBonusSlot)).toContain("combat-expertise");
    expect(featIds(fighterBonusSlot)).not.toContain("improved-disarm");
    expect(featIds(fighterBonusSlot)).not.toContain("improved-trip");

    character.featSelections = { "general-1": "combat-expertise" };
    expect(featIds(fighterBonusSlot)).toContain("improved-disarm");
    expect(featIds(fighterBonusSlot)).toContain("improved-trip");
    expect(
      getAvailableFeats(character, generalSlot, generalSlot.id).map(
        (feat) => feat.id,
      ),
    ).toEqual(expect.arrayContaining(["improved-disarm", "improved-trip"]));
  });

  it("requires Whirlwind Attack's full prerequisite chain in general and Fighter slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 9 }];
    character.abilities.dex = 13;
    character.abilities.int = 13;
    character.baseAttackBonusByLevel = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
    };
    character.featSelections = {
      "general-1": "combat-expertise",
      "fighter-2": "dodge",
      "fighter-4": "mobility",
      "fighter-6": "spring-attack",
    };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 8,
      id: "fighter-8",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 9,
      id: "general-9",
    };
    const hasWhirlwindAttack = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "whirlwind-attack",
      );

    expect(hasWhirlwindAttack(fighterBonusSlot)).toBe(true);
    expect(hasWhirlwindAttack(generalSlot)).toBe(true);

    for (const missingFeat of [
      "combat-expertise",
      "dodge",
      "mobility",
      "spring-attack",
    ]) {
      const selections = { ...character.featSelections };
      delete selections[
        Object.keys(selections).find(
          (slotId) => selections[slotId] === missingFeat,
        ) ?? ""
      ];
      character.featSelections = selections;
      expect(hasWhirlwindAttack(fighterBonusSlot)).toBe(false);
    }

    character.featSelections = {
      "general-1": "combat-expertise",
      "fighter-2": "dodge",
      "fighter-4": "mobility",
      "fighter-6": "spring-attack",
    };
    character.abilities.dex = 12;
    expect(hasWhirlwindAttack(fighterBonusSlot)).toBe(false);
    character.abilities.dex = 13;
    character.abilities.int = 12;
    expect(hasWhirlwindAttack(fighterBonusSlot)).toBe(false);
    character.abilities.int = 13;
    character.baseAttackBonusByLevel[8] = 3;
    expect(hasWhirlwindAttack(fighterBonusSlot)).toBe(false);
  });

  it("allows Great Cleave only with its full prerequisite chain and BAB +4", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.abilities.str = 13;
    character.baseAttackBonusByLevel = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
    };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 4,
      id: "fighter-4",
    };
    const earlyGeneralSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const laterGeneralSlot = {
      fighterOnly: false,
      characterLevel: 6,
      id: "general-6",
    };
    const hasGreatCleave = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "great-cleave",
      );

    character.featSelections = { "general-1": "power-attack" };
    expect(hasGreatCleave(fighterBonusSlot)).toBe(false);
    character.featSelections["fighter-2"] = "cleave";
    expect(hasGreatCleave(earlyGeneralSlot)).toBe(false);
    expect(hasGreatCleave(fighterBonusSlot)).toBe(true);
    expect(hasGreatCleave(laterGeneralSlot)).toBe(true);

    delete character.featSelections["general-1"];
    expect(hasGreatCleave(fighterBonusSlot)).toBe(false);
    character.featSelections = {
      "general-1": "power-attack",
      "fighter-2": "cleave",
    };
    character.abilities.str = 12;
    expect(hasGreatCleave(fighterBonusSlot)).toBe(false);
  });

  it("requires Manyshot's full prerequisites for general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 7 }];
    character.abilities.dex = 17;
    character.baseAttackBonusByLevel = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
    };
    character.featSelections = {
      "general-1": "point-blank-shot",
      "fighter-2": "rapid-shot",
    };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 6,
      id: "fighter-6",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 6,
      id: "general-6",
    };
    const hasManyshot = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "manyshot",
      );

    expect(hasManyshot(fighterBonusSlot)).toBe(true);
    expect(hasManyshot(generalSlot)).toBe(true);

    delete character.featSelections["general-1"];
    expect(hasManyshot(fighterBonusSlot)).toBe(false);
    character.featSelections = {
      "general-1": "point-blank-shot",
    };
    expect(hasManyshot(fighterBonusSlot)).toBe(false);
    character.featSelections["fighter-2"] = "rapid-shot";

    character.abilities.dex = 16;
    expect(hasManyshot(fighterBonusSlot)).toBe(false);
    character.abilities.dex = 17;
    character.baseAttackBonusByLevel[6] = 5;
    expect(hasManyshot(fighterBonusSlot)).toBe(false);
  });

  it("requires Rapid Shot's prerequisites for general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const hasRapidShot = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "rapid-shot",
      );

    expect(hasRapidShot(fighterBonusSlot)).toBe(false);
    expect(hasRapidShot(generalSlot)).toBe(false);

    character.abilities.dex = 13;
    expect(hasRapidShot(fighterBonusSlot)).toBe(false);
    character.featSelections = { "general-1": "point-blank-shot" };
    expect(hasRapidShot(fighterBonusSlot)).toBe(true);
    expect(hasRapidShot(generalSlot)).toBe(true);
  });

  it("requires Point Blank Shot for Precise Shot in general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const hasPreciseShot = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "precise-shot",
      );

    expect(hasPreciseShot(fighterBonusSlot)).toBe(false);
    expect(hasPreciseShot(generalSlot)).toBe(false);

    character.featSelections = { "general-1": "point-blank-shot" };
    expect(hasPreciseShot(fighterBonusSlot)).toBe(true);
    expect(hasPreciseShot(generalSlot)).toBe(true);
  });

  it("requires Dexterity 13 and Dodge for Mobility in general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }];
    character.abilities.dex = 12;
    character.featSelections = { "general-1": "dodge" };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const hasMobility = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "mobility",
      );

    expect(hasMobility(fighterBonusSlot)).toBe(false);
    expect(hasMobility(generalSlot)).toBe(false);
    character.abilities.dex = 13;
    expect(hasMobility(fighterBonusSlot)).toBe(true);
    expect(hasMobility(generalSlot)).toBe(true);
    delete character.featSelections["general-1"];
    expect(hasMobility(fighterBonusSlot)).toBe(false);
    expect(hasMobility(generalSlot)).toBe(false);
  });

  it("requires Dexterity 13 for Dodge in general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 3 }];
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    };
    const hasDodge = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "dodge",
      );

    character.abilities.dex = 12;
    expect(hasDodge(fighterBonusSlot)).toBe(false);
    expect(hasDodge(generalSlot)).toBe(false);
    character.abilities.dex = 13;
    expect(hasDodge(fighterBonusSlot)).toBe(true);
    expect(hasDodge(generalSlot)).toBe(true);
  });

  it("requires Spring Attack's full prerequisites for general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 7 }];
    character.abilities.dex = 13;
    character.baseAttackBonusByLevel = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 4,
      7: 7,
    };
    character.featSelections = {
      "general-1": "dodge",
      "fighter-2": "mobility",
    };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 6,
      id: "fighter-6",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 6,
      id: "general-6",
    };
    const hasSpringAttack = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "spring-attack",
      );

    expect(hasSpringAttack(fighterBonusSlot)).toBe(true);
    expect(hasSpringAttack(generalSlot)).toBe(true);

    delete character.featSelections["general-1"];
    expect(hasSpringAttack(fighterBonusSlot)).toBe(false);
    character.featSelections["general-1"] = "dodge";
    delete character.featSelections["fighter-2"];
    expect(hasSpringAttack(fighterBonusSlot)).toBe(false);
    character.featSelections["fighter-2"] = "mobility";
    character.abilities.dex = 12;
    expect(hasSpringAttack(fighterBonusSlot)).toBe(false);
    character.abilities.dex = 13;
    character.baseAttackBonusByLevel[6] = 3;
    expect(hasSpringAttack(fighterBonusSlot)).toBe(false);
  });

  it("requires Shot on the Run's prerequisites for general and Fighter bonus slots", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 7 }];
    character.abilities.dex = 13;
    character.baseAttackBonusByLevel = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 4,
      7: 7,
    };
    character.featSelections = {
      "general-1": "dodge",
      "fighter-2": "mobility",
      "general-3": "point-blank-shot",
    };
    const fighterBonusSlot = {
      fighterOnly: true,
      characterLevel: 6,
      id: "fighter-6",
    };
    const generalSlot = {
      fighterOnly: false,
      characterLevel: 6,
      id: "general-6",
    };
    const hasShotOnTheRun = (slot: {
      fighterOnly: boolean;
      characterLevel: number;
      id: string;
    }) =>
      getAvailableFeats(character, slot, slot.id).some(
        (feat) => feat.id === "shot-on-the-run",
      );

    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(true);
    expect(hasShotOnTheRun(generalSlot)).toBe(true);

    delete character.featSelections["general-3"];
    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(false);
    expect(hasShotOnTheRun(generalSlot)).toBe(false);
    character.featSelections["general-3"] = "point-blank-shot";
    delete character.featSelections["general-1"];
    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(false);
    character.featSelections["general-1"] = "dodge";
    delete character.featSelections["fighter-2"];
    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(false);
    character.featSelections["fighter-2"] = "mobility";
    character.abilities.dex = 12;
    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(false);
    character.abilities.dex = 13;
    character.baseAttackBonusByLevel[6] = 3;
    expect(hasShotOnTheRun(fighterBonusSlot)).toBe(false);
  });

  it("requires the ability to turn or rebuke for Improved Turning", () => {
    expect(getAvailableFeats(hero("cleric"), { fighterOnly: false })
      .map((feat) => feat.id)).toContain("improved-turning");
    expect(getAvailableFeats(hero("fighter"), { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("improved-turning");

    const paladin = hero("paladin");
    paladin.classLevels = [{ classId: "paladin", level: 3 }];
    expect(getAvailableFeats(paladin, { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("improved-turning");
    paladin.classLevels = [{ classId: "paladin", level: 4 }];
    expect(getAvailableFeats(paladin, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("improved-turning");
  });

  it("allows Extra Turning repeatedly for a character who can turn or rebuke", () => {
    const cleric = hero("cleric");
    cleric.classLevels = [{ classId: "cleric", level: 3 }];
    expect(getAvailableFeats(cleric, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("extra-turning");
    expect(getAvailableFeats(cleric, { fighterOnly: true })
      .map((feat) => feat.id)).not.toContain("extra-turning");

    cleric.featSelections = { "general-1": "extra-turning" };
    expect(getAvailableFeats(cleric, {
      fighterOnly: false,
      characterLevel: 3,
      id: "general-3",
    }, "general-3")
      .map((feat) => feat.id)).toContain("extra-turning");
    expect(getAvailableFeats(hero("fighter"), { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("extra-turning");
  });

  it("requires Dexterity 15, Deflect Arrows, and Improved Unarmed Strike for Snatch Arrows", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 2 }];
    character.abilities.dex = 14;
    const fighterSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    const availableFeats = () =>
      getAvailableFeats(character, fighterSlot, "fighter-2")
        .map((feat) => feat.id);

    expect(availableFeats()).not.toContain("snatch-arrows");
    character.featSelections = {
      "general-1": "improved-unarmed-strike",
      "fighter-1": "deflect-arrows",
    };
    expect(availableFeats()).not.toContain("snatch-arrows");
    character.abilities.dex = 15;
    expect(availableFeats()).toContain("snatch-arrows");
  });

  it("requires Wisdom 13 and Wild Shape access for Natural Spell", () => {
    const character = hero("druid");
    character.classLevels = [{ classId: "druid", level: 4 }];
    character.abilities.wis = 13;
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("natural-spell");

    character.classLevels = [{ classId: "druid", level: 5 }];
    character.abilities.wis = 12;
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).not.toContain("natural-spell");

    character.abilities.wis = 13;
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("natural-spell");

    character.classLevels = [{ classId: "fighter", level: 5 }];
    character.classFeatures = ["Wild Shape"];
    expect(getAvailableFeats(character, { fighterOnly: false })
      .map((feat) => feat.id)).toContain("natural-spell");
  });

  it("requires Dexterity 15 and Two-Weapon Fighting for Two-Weapon Defense", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 2 }];
    const fighterSlot = {
      fighterOnly: true,
      characterLevel: 2,
      id: "fighter-2",
    };
    character.abilities.dex = 14;
    character.featSelections = { "general-1": "two-weapon-fighting" };
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).not.toContain("two-weapon-defense");

    character.abilities.dex = 15;
    character.featSelections = {};
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).not.toContain("two-weapon-defense");

    character.featSelections = { "general-1": "two-weapon-fighting" };
    expect(getAvailableFeats(character, fighterSlot, "fighter-2")
      .map((feat) => feat.id)).toContain("two-weapon-defense");
  });
});

describe("armor and shield proficiency", () => {
  it.each([
    ["fighter", true, true, true, true, true],
    ["paladin", true, true, true, true, false],
    ["cleric", true, true, true, true, false],
    ["barbarian", true, true, false, true, false],
    ["ranger", true, false, false, true, false],
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

  it("applies medium armor nonproficiency to Rangers", () => {
    const character = hero("ranger");
    expect(getArmorNonproficiencyPenalties(character)).toContainEqual(
      expect.objectContaining({
        source: "armor (nonprof.)",
        name: "Chainmail",
      }),
    );
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

    it("preserves a saved prestige reference without granting unearned proficiency", () => {
      const character = hero();
      character.prestigeClass = "arcane-archer";
      expect(isWeaponProficient(character, item("Longsword"))).toBe(false);
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
      expect(isWeaponProficient(kagonesti, item("Longsword"))).toBe(false);

      kagonesti.ruleset = "core-35-srd";
      expect(getItemProficiencyWarning(kagonesti, item("Short Sword"))).toContain("not proficient");
    });

    it("inherits standard elf weapon proficiencies for Qualinesti and Silvanesti", () => {
      for (const race of ["Qualinesti Elf", "Silvanesti Elf"]) {
        const character = hero();
        character.race = race;
        character.ruleset = "dragonlance-user-pack";
        for (const weapon of [
          "Longsword",
          "Rapier",
          "Longbow",
          "Composite Longbow",
          "Shortbow",
          "Composite Shortbow",
        ]) {
          expect(isWeaponProficient(character, item(weapon)), `${race}: ${weapon}`).toBe(true);
        }

        character.ruleset = "core-35-srd";
        expect(isWeaponProficient(character, item("Longsword"))).toBe(false);
      }
    });

    it("preserves dwarf weapon familiarity for Dragonlance dwarf variants", () => {
      for (const race of ["Hill Dwarf", "Mountain Dwarf", "Dark Dwarf"]) {
        const character = hero("fighter");
        character.race = race;
        character.ruleset = "dragonlance-user-pack";
        expect(isWeaponProficient(character, item("Dwarven Waraxe")), race).toBe(true);
        expect(isWeaponProficient(character, item("Dwarven Urgrosh")), race).toBe(true);
      }
    });

    it("applies Baaz and Kapak racial simple-weapon and armor proficiencies", () => {
      const baaz = hero();
      baaz.race = "Baaz Draconian";
      baaz.ruleset = "dragonlance-monster-classes";
      expect(isWeaponProficient(baaz, item("Spear"))).toBe(true);
      expect(isWeaponProficient(baaz, item("Longsword"))).toBe(true);
      expect(isArmorShieldProficient(baaz, item("Chain Shirt"))).toBe(true);
      expect(isArmorShieldProficient(baaz, item("Heavy Steel Shield"))).toBe(true);

      const kapak = hero();
      kapak.race = "Kapak Draconian";
      kapak.ruleset = "dragonlance-monster-classes";
      expect(isWeaponProficient(kapak, item("Spear"))).toBe(true);
      expect(isWeaponProficient(kapak, item("Short Sword"))).toBe(true);
      expect(isWeaponProficient(kapak, item("Shortbow"))).toBe(true);
      expect(isArmorShieldProficient(kapak, item("Chain Shirt"))).toBe(true);
      expect(isArmorShieldProficient(kapak, item("Heavy Steel Shield"))).toBe(false);
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
    const ranger = hero("ranger");
    expect(isWeaponProficient(ranger, item("Spear"))).toBe(true);
    expect(isWeaponProficient(ranger, item("Longbow"))).toBe(true);
    expect(isWeaponProficient(ranger, item("Spiked Chain"))).toBe(false);
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

  it("applies mithral's one-category reduction to armor proficiency", () => {
    const rogue = hero("rogue");
    expect(isArmorShieldProficient(rogue, item("Breastplate"))).toBe(false);
    expect(isArmorShieldProficient(rogue, item("Mithral Breastplate"))).toBe(true);

    const ranger = hero("ranger");
    expect(isArmorShieldProficient(ranger, item("Breastplate"))).toBe(false);
    expect(isArmorShieldProficient(ranger, item("Mithral Breastplate"))).toBe(true);
    expect(isArmorShieldProficient(ranger, item("Mithral Full Plate"))).toBe(false);

    const barbarian = hero("barbarian");
    expect(isArmorShieldProficient(barbarian, item("Full Plate"))).toBe(false);
    expect(isArmorShieldProficient(barbarian, item("Mithral Full Plate"))).toBe(true);
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
    character.classLevels = [{ classId: "rogue", level: 1 }];
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

  it("offers Rapid Reload only for a proficient crossbow type and permits distinct repeated selections", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 2 }];
    const choices = () => getAvailableFeatWeaponChoices(character, "rapid-reload");
    expect(choices()).toContain("Light Crossbow");
    expect(choices()).toContain("Heavy Crossbow");
    expect(choices()).not.toContain("Hand Crossbow");
    expect(choices()).not.toContain("Repeating Heavy Crossbow");
    expect(choices()).not.toContain("Longbow");

    character.featSelections = { "general-1": "exotic-weapon-proficiency" };
    character.featWeaponSelections = { "general-1": "Hand Crossbow" };
    expect(choices()).toContain("Hand Crossbow");

    character.featSelections["fighter-1"] = "rapid-reload";
    character.featWeaponSelections["fighter-1"] = "Light Crossbow";
    expect(getAvailableFeatWeaponChoices(character, "rapid-reload", "fighter-2"))
      .toEqual(["Hand Crossbow", "Heavy Crossbow"]);
  });

  it("allows Weapon Focus with Grapple, Ray, and Touch spell for spellcasters", () => {
    const fighter = hero("fighter");
    fighter.classLevels = [{ classId: "fighter", level: 1 }];
    const wizard = hero("wizard");
    wizard.classLevels = [
      { classId: "wizard", level: 1 },
      { classId: "fighter", level: 4 },
    ];

    expect(getAvailableFeatWeaponChoices(fighter, "weapon-focus")).toContain("Grapple");
    expect(getAvailableFeatWeaponChoices(fighter, "weapon-focus")).not.toContain("Ray");
    expect(getAvailableFeatWeaponChoices(wizard, "weapon-focus")).toContain("Grapple");
    expect(getAvailableFeatWeaponChoices(wizard, "weapon-focus")).toContain("Ray");
    expect(getAvailableFeatWeaponChoices(wizard, "weapon-focus")).toContain("Touch spell");
    expect(getAvailableFeatWeaponChoices(wizard, "weapon-specialization")).not.toContain("Ray");
  });

  it("limits spell specialization choices to the matching Weapon Focus", () => {
    const wizard = hero("wizard");
    wizard.classLevels = [{ classId: "wizard", level: 4 }];
    wizard.featSelections = { "general-1": "weapon-focus" };
    wizard.featWeaponSelections = { "general-1": "Ray" };

    expect(
      getAvailableFeatWeaponChoices(wizard, "ranged-spell-specialization"),
    ).toEqual(["Ray"]);
    expect(
      getAvailableFeatWeaponChoices(wizard, "touch-spell-specialization"),
    ).toEqual([]);

    wizard.featWeaponSelections["general-1"] = "Touch spell";
    expect(
      getAvailableFeatWeaponChoices(wizard, "ranged-spell-specialization"),
    ).toEqual([]);
    expect(
      getAvailableFeatWeaponChoices(wizard, "touch-spell-specialization"),
    ).toEqual(["Touch spell"]);
  });

  it("allows Grapple for matching weapon focus and specialization choices", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 12 }];
    character.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
      "fighter-8": "greater-weapon-focus",
    };
    character.featWeaponSelections = {
      "general-1": "Grapple",
      "fighter-4": "Grapple",
      "fighter-8": "Grapple",
    };

    expect(
      getAvailableFeatWeaponChoices(character, "weapon-specialization", "fighter-4"),
    ).toContain("Grapple");
    expect(
      getAvailableFeatWeaponChoices(character, "greater-weapon-focus", "fighter-8"),
    ).toContain("Grapple");
    expect(
      getAvailableFeatWeaponChoices(
        character,
        "greater-weapon-specialization",
        "fighter-12",
      ),
    ).toContain("Grapple");
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

  it("requires matching weapon feats and Fighter levels for Greater Weapon Focus and Specialization", () => {
    const character = hero("fighter");
    character.classLevels = [{ classId: "fighter", level: 7 }];
    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": "Longsword" };
    expect(
      getAvailableFeats(character, { fighterOnly: true })
        .map((feat) => feat.id),
    ).not.toContain("greater-weapon-focus");
    expect(
      getAvailableFeatWeaponChoices(
        character,
        "greater-weapon-focus",
        "fighter-8",
      ),
    ).toEqual([]);

    character.classLevels = [{ classId: "fighter", level: 8 }];
    expect(
      getAvailableFeats(character, { fighterOnly: true }, "fighter-8")
        .map((feat) => feat.id),
    ).toContain("greater-weapon-focus");
    expect(
      getAvailableFeatWeaponChoices(
        character,
        "greater-weapon-focus",
        "fighter-8",
      ),
    ).toEqual(["Longsword"]);

    character.classLevels = [{ classId: "fighter", level: 12 }];
    character.featSelections = {
      "general-1": "weapon-focus",
      "fighter-4": "weapon-specialization",
      "fighter-8": "greater-weapon-focus",
    };
    character.featWeaponSelections = {
      "general-1": "Longsword",
      "fighter-4": "Dagger",
      "fighter-8": "Longsword",
    };
    expect(
      getAvailableFeatWeaponChoices(
        character,
        "greater-weapon-specialization",
        "fighter-12",
      ),
    ).toEqual([]);

    character.featWeaponSelections["fighter-4"] = "Longsword";
    expect(
      getAvailableFeats(character, { fighterOnly: true }, "fighter-12")
        .map((feat) => feat.id),
    ).toContain("greater-weapon-specialization");
    expect(
      getAvailableFeatWeaponChoices(
        character,
        "greater-weapon-specialization",
        "fighter-12",
      ),
    ).toEqual(["Longsword"]);
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
    character.hitPointRolls = Array.from({ length: 4 }, (_, index) => ({
      characterLevel: index + 1,
      classId: "fighter" as const,
      classLevel: index + 1,
      hitDie: 10 as const,
      roll: 1,
      hpIncrease: 1,
    }));
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

  it("offers PHB item-creation feats at their caster-level requirements", () => {
    const featRequirements = [
      { id: "scribe-scroll", casterLevel: 1 },
      { id: "brew-potion", casterLevel: 3 },
      { id: "craft-magic-arms-and-armor", casterLevel: 5 },
      { id: "craft-rod", casterLevel: 9 },
      { id: "craft-staff", casterLevel: 12 },
      { id: "craft-wand", casterLevel: 5 },
      { id: "craft-wondrous-item", casterLevel: 3 },
      { id: "forge-ring", casterLevel: 12 },
    ] as const;
    const character = hero("cleric");
    const availableFeatIds = () =>
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id);

    for (const { id, casterLevel } of featRequirements) {
      character.classLevels = casterLevel > 1
        ? [{ classId: "cleric", level: casterLevel - 1 }]
        : [];
      expect(availableFeatIds()).not.toContain(id);
      character.classLevels = [{ classId: "cleric", level: casterLevel }];
      expect(availableFeatIds()).toContain(id);
    }
  });

  it("offers the PHB skill-bonus feats without prerequisites", () => {
    const availableFeatIds = getAvailableFeats(
      hero(),
      { fighterOnly: false },
    ).map((feat) => feat.id);

    expect(availableFeatIds).toEqual(
      expect.arrayContaining([
        "acrobatic",
        "agile",
        "animal-affinity",
        "athletic",
        "deft-hands",
        "diligent",
        "stealthy",
      ]),
    );
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
    expect(getFeatSpellSchoolSelectionWarnings(duplicateTargetCharacter)).toHaveLength(1);

    const chronologicalCharacter = hero();
    chronologicalCharacter.classLevels = [{ classId: "wizard", level: 3 }];
    chronologicalCharacter.featSelections = {
      "general-1": "spell-focus",
      "human-1": "spell-focus",
      "general-3": "spell-focus",
    };
    chronologicalCharacter.featSpellSchoolSelections = {
      "general-1": "Illusion",
      "human-1": "Abjuration",
      "general-3": "Abjuration",
    };
    expect(
      normalizeFeatSpellSchoolSelections(
        chronologicalCharacter,
        chronologicalCharacter.featSpellSchoolSelections,
      ),
    ).toEqual({
      "general-1": "Illusion",
      "human-1": "Abjuration",
    });
  });

  it("limits repeat Arcane Defense choices to distinct Spell Focus schools", () => {
    const character = hero();
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.featSelections = {
      "general-1": "spell-focus",
      "human-1": "spell-focus",
      "general-3": "arcane-defense",
      "general-6": "arcane-defense",
    };
    character.featSpellSchoolSelections = {
      "general-1": "Illusion",
      "human-1": "Abjuration",
      "general-3": "Illusion",
      "general-6": "Abjuration",
    };

    expect(
      getAvailableFeatSpellSchoolChoices(
        character,
        "general-6",
        "arcane-defense",
      ),
    ).toEqual(["Abjuration"]);
    expect(
      getAvailableFeats(
        character,
        { fighterOnly: false, characterLevel: 6 },
        "general-6",
      ).map((feat) => feat.id),
    ).toContain("arcane-defense");
    expect(getFeatSpellSchoolSelectionWarnings(character)).toEqual([]);
    expect(
      normalizeFeatSpellSchoolSelections(character, {
        ...character.featSpellSchoolSelections,
        "general-6": "Illusion",
      }),
    ).toEqual({
      "general-1": "Illusion",
      "human-1": "Abjuration",
      "general-3": "Illusion",
    });

    const noFocus = hero();
    expect(
      getAvailableFeats(
        noFocus,
        { fighterOnly: false, characterLevel: 1 },
      ).map((feat) => feat.id),
    ).not.toContain("arcane-defense");
  });

  it("limits Spell Mastery to known Wizard spells and preserves its feat-time choice count", async () => {
    await loadSpellCatalog();
    const character = hero();
    character.abilities.int = 16;
    character.knownSpellsByClass = {
      wizard: ["Magic Missile", "Shield", "Mage Armor", "Unavailable Spell"],
    };

    expect(
      getAvailableFeats(character, { fighterOnly: false }, "general-1")
        .map((feat) => feat.id),
    ).toContain("spell-mastery");
    expect(
      getAvailableFeats(hero("fighter"), { fighterOnly: false }, "general-1")
        .map((feat) => feat.id),
    ).not.toContain("spell-mastery");
    expect(getFeatSpellMasteryChoiceCount(character)).toBe(3);
    expect(getAvailableFeatSpellMasteryChoices(character, "general-1"))
      .toEqual(expect.arrayContaining(["Magic Missile", "Shield", "Mage Armor"]));
    expect(getAvailableFeatSpellMasteryChoices(character, "general-1"))
      .not.toContain("Unavailable Spell");

    character.featSelections = {
      "general-1": "spell-mastery",
      "human-1": "spell-mastery",
    };
    character.featSpellMasterySelectionCounts = {
      "general-1": 2,
      "human-1": 1,
    };
    character.featSpellMasterySelections = {
      "general-1": ["Magic Missile"],
      "human-1": ["Mage Armor"],
    };
    character.abilities.int = 20;

    expect(getFeatSpellMasteryChoiceCount(character, "general-1")).toBe(2);
    expect(getAvailableFeatSpellMasteryChoices(character, "human-1"))
      .not.toContain("Magic Missile");
    expect(getAvailableFeatSpellMasteryChoices(character, "human-1"))
      .toContain("Shield");
    expect(getFeatSpellMasterySelectionWarnings(character)).toHaveLength(1);
    expect(
      normalizeFeatSpellMasterySelections(
        character,
        character.featSpellMasterySelections,
      ),
    ).toEqual({
      "general-1": ["Magic Missile"],
      "human-1": ["Mage Armor"],
    });

    character.featSpellMasterySelections["general-1"] = [
      "Magic Missile",
      "Shield",
    ];
    expect(getFeatSpellMasterySelectionWarnings(character)).toEqual([]);
  });

  it("shows selected Spell Mastery spells on the character sheet", async () => {
    await loadSpellCatalog();
    const character = hero();
    character.abilities.int = 14;
    character.knownSpellsByClass = {
      wizard: ["Magic Missile", "Shield"],
    };
    character.featSelections = { "general-1": "spell-mastery" };
    character.featSpellMasterySelectionCounts = { "general-1": 2 };
    character.featSpellMasterySelections = {
      "general-1": ["Magic Missile", "Shield"],
    };
    window.localStorage.setItem(
      savedCharacterStorageKey,
      JSON.stringify(character),
    );

    render(<App />);

    expect(
      await screen.findAllByText(/Mastered spells: Magic Missile, Shield/),
    ).not.toHaveLength(0);
  });

  it("lets a setup draft choose distinct known Wizard spells for Spell Mastery", async () => {
    await loadSpellCatalog();
    const character = hero();
    character.abilities.int = 16;
    character.knownSpellsByClass = {
      wizard: ["Magic Missile", "Shield", "Mage Armor"],
    };
    character.featSelections = { "general-1": "spell-mastery" };
    character.featSpellMasterySelectionCounts = { "general-1": 3 };
    window.localStorage.setItem(
      savedCharacterStorageKey,
      JSON.stringify(character),
    );
    window.localStorage.setItem(savedCharacterSetupDraftStorageKey, "true");

    render(<App />);

    expect(await screen.findByText("Spell Mastery (0/3)")).toBeDefined();
    const featSlot = screen
      .getByRole("button", { name: /^General feat \(level 1\)/ })
      .closest("label");
    if (!featSlot) throw new Error("Missing Spell Mastery feat slot.");

    fireEvent.click(
      within(featSlot).getByRole("button", { name: "Choose spell 1..." }),
    );
    const firstChoices = within(featSlot).getByRole("listbox", {
      name: "Spell choices",
    });
    fireEvent.click(
      within(firstChoices).getByRole("option", { name: /^Magic Missile/ }),
    );
    expect(await screen.findByText("Spell Mastery (1/3)")).toBeDefined();

    fireEvent.click(
      within(featSlot).getByRole("button", { name: "Choose spell 2..." }),
    );
    const secondChoices = within(featSlot).getByRole("listbox", {
      name: "Spell choices",
    });
    expect(
      within(secondChoices).queryByRole("option", { name: /^Magic Missile/ }),
    ).toBeNull();
    fireEvent.click(
      within(secondChoices).getByRole("option", { name: /^Shield/ }),
    );
    expect(await screen.findByText("Spell Mastery (2/3)")).toBeDefined();
  });

  it("lets a character choose and display a school for Spell Focus", async () => {
    render(<App />);
    await screen.findAllByText("Choose a feat");
    const featSlot = document.querySelector<HTMLElement>(".feat-choices label");
    if (!featSlot) throw new Error("Missing first feat slot.");
    fireEvent.click(within(featSlot).getByRole("button", { name: "General feat (level 1)" }));
    fireEvent.click(within(featSlot).getByRole("option", { name: /^Spell Focus\s*(?:Source:|$)/ }));
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 1) spell school",
      }),
      { target: { value: "Illusion" } },
    );
    expect(screen.getByText("Spell Focus (Illusion)")).toBeDefined();
  });

  it("lets a character choose and display an Arcane Defense school", async () => {
    const character = hero();
    character.classLevels = [{ classId: "wizard", level: 3 }];
    character.featSelections = { "general-1": "spell-focus" };
    character.featSpellSchoolSelections = { "general-1": "Illusion" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Reopen Setup" }));
    await screen.findAllByText("Choose a feat");
    const featSlot = screen.getByRole("button", {
      name: "General feat (level 3)",
    }).closest("label");
    if (!featSlot) throw new Error("Missing 3rd-level feat slot.");
    fireEvent.click(
      within(featSlot).getByRole("button", { name: "General feat (level 3)" }),
    );
    fireEvent.click(
      within(featSlot).getByRole("option", { name: /^Arcane Defense/ }),
    );
    fireEvent.change(
      within(featSlot).getByRole("combobox", {
        name: "General feat (level 3) spell school",
      }),
      { target: { value: "Illusion" } },
    );
    expect(screen.getByText("Arcane Defense (Illusion)")).toBeDefined();
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
    ).toEqual(["Evocation", "Illusion"]);
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

  it.each(["greater-spell-focus", "arcane-defense"] as const)(
    "requires prior Spell Focus in the chosen school for %s",
    (featId) => {
      const character = hero();
      character.classLevels = [{ classId: "wizard", level: 6 }];
      character.featSelections = {
        "general-1": "spell-focus",
        "general-3": featId,
        "general-6": "spell-focus",
      };
      character.featSpellSchoolSelections = {
        "general-1": "Illusion",
        "general-3": "Evocation",
        "general-6": "Evocation",
      };

      expect(
        getAvailableFeatSpellSchoolChoices(character, "general-3", featId),
      ).toEqual(["Illusion"]);
      expect(
        getAvailableFeats(character, { fighterOnly: false, characterLevel: 3 }, "general-3")
          .map((feat) => feat.id),
      ).toContain(featId);
      expect(getFeatSpellSchoolSelectionWarnings(character)).toContain(
        "Choose a valid school of magic for General feat (level 3).",
      );
      expect(
        normalizeFeatSpellSchoolSelections(
          character,
          character.featSpellSchoolSelections,
        ),
      ).toEqual({
        "general-1": "Illusion",
        "general-6": "Evocation",
      });
    },
  );

  it("offers Empower and Maximize Spell without prerequisites", () => {
    const feats = getAvailableFeats(hero("fighter"), { fighterOnly: false })
      .map((feat) => feat.id);
    expect(feats).toContain("empower-spell");
    expect(feats).toContain("maximize-spell");
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
    const availableFeats = () =>
      getAvailableFeats(character, { fighterOnly: false }).map((feat) => feat.id);
    expect(availableFeats()).not.toContain("sculpt-spell");
    expect(availableFeats()).not.toContain("split-ray");
    expect(availableFeats()).not.toContain("delay-spell");
    expect(availableFeats()).not.toContain("chain-spell");
    expect(availableFeats()).not.toContain("cooperative-spell");
    expect(availableFeats()).not.toContain("sanctum-spell");
    expect(availableFeats()).not.toContain("persistent-spell");
    expect(availableFeats()).not.toContain("repeat-spell");
    expect(availableFeats()).not.toContain("twin-spell");
    expect(availableFeats()).toContain("fortify-spell");
    expect(availableFeats()).toContain("explosive-spell");
    expect(availableFeats()).toContain("transdimensional-spell");
    expect(availableFeats()).not.toContain("sudden-empower");
    expect(availableFeats()).not.toContain("sudden-maximize");
    expect(availableFeats()).not.toContain("sudden-quicken");
    expect(availableFeats()).toContain("sudden-extend");
    expect(availableFeats()).toContain("sudden-silent");
    expect(availableFeats()).toContain("sudden-still");
    expect(availableFeats()).toContain("sudden-widen");

    character.featSelections = { "general-1": "spell-focus" };
    expect(availableFeats()).not.toContain("sculpt-spell");
    expect(availableFeats()).not.toContain("split-ray");
    expect(availableFeats()).not.toContain("delay-spell");
    expect(availableFeats()).not.toContain("chain-spell");
    expect(availableFeats()).not.toContain("cooperative-spell");
    expect(availableFeats()).not.toContain("sanctum-spell");
    expect(availableFeats()).not.toContain("persistent-spell");
    expect(availableFeats()).not.toContain("sudden-empower");
    expect(availableFeats()).not.toContain("sudden-maximize");
    expect(availableFeats()).not.toContain("sudden-quicken");

    character.featSelections = { "general-1": "widen-spell" };
    expect(availableFeats()).toContain("sculpt-spell");
    expect(availableFeats()).toContain("split-ray");
    expect(availableFeats()).toContain("delay-spell");
    expect(availableFeats()).toContain("chain-spell");
    expect(availableFeats()).toContain("cooperative-spell");
    expect(availableFeats()).toContain("sanctum-spell");
    expect(availableFeats()).toContain("repeat-spell");
    expect(availableFeats()).toContain("twin-spell");

    character.featSelections = { "general-1": "extend-spell" };
    expect(availableFeats()).toContain("persistent-spell");
    expect(availableFeats()).toContain("sudden-empower");
    expect(availableFeats()).toContain("sudden-maximize");

    character.featSelections = {
      "general-1": "quicken-spell",
      "general-2": "sudden-empower",
      "general-3": "sudden-extend",
      "general-4": "sudden-maximize",
      "general-5": "sudden-silent",
      "general-6": "sudden-still",
    };
    expect(availableFeats()).toContain("sudden-quicken");
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
    fireEvent.click(within(generalSlot).getByRole("option", { name: /^Spell Focus\s*(?:Source:|$)/ }));
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
    character.classLevels[0].level = 4;
    character.abilities.str = 13;
    character.abilityScoreIncreasesByLevel = { 4: "str" };
    const availableChoices = () =>
      getAvailableFeatWeaponChoices(
        character,
        "exotic-weapon-proficiency",
        "general-1",
      );
    expect(availableChoices()).not.toContain("Bastard Sword");
    expect(availableChoices()).not.toContain("Dwarven Waraxe");
    expect(availableChoices()).toContain("Spiked Chain");

    character.featSelections = { "general-1": "exotic-weapon-proficiency" };
    character.featWeaponSelections = { "general-1": "Bastard Sword" };
    expect(isWeaponProficient(character, item("Bastard Sword"))).toBe(false);

    const strongCharacter = hero("fighter");
    const strongChoices = getAvailableFeatWeaponChoices(
      strongCharacter,
      "exotic-weapon-proficiency",
      "general-1",
    );
    expect(strongChoices).toContain("Bastard Sword");
    expect(strongChoices).toContain("Dwarven Waraxe");
    strongCharacter.featSelections = {
      "general-1": "exotic-weapon-proficiency",
    };
    strongCharacter.featWeaponSelections = { "general-1": "Bastard Sword" };
    expect(isWeaponProficient(strongCharacter, item("Bastard Sword"))).toBe(true);
  });

  it.each(["Bastard Sword", "Dwarven Waraxe"])(
    "treats a two-handed %s as a martial weapon",
    (weaponName) => {
      const weapon = item(weaponName);
      const character = hero("fighter");
      character.equipment = { "Main Weapon": `${weaponName} (Medium)` };
      character.mainWeaponGrip = "two-handed";

      expect(getItemProficiencyWarning(character, weapon)).toBeNull();
      expect(
        getEquippedWeaponStats(character, character.equipment["Main Weapon"]),
      ).toMatchObject({ twoHandedGrip: true, nonproficiencyPenalty: 0 });

      character.mainWeaponGrip = "one-handed";
      expect(getItemProficiencyWarning(character, weapon)).toContain(
        "not proficient with this weapon",
      );
      expect(
        getEquippedWeaponStats(character, character.equipment["Main Weapon"]),
      ).toMatchObject({ twoHandedGrip: false, nonproficiencyPenalty: -4 });
    },
  );

  it.each(["Bastard Sword", "Dwarven Waraxe"])(
    "allows Martial Weapon Proficiency in %s for two-handed use",
    (weaponName) => {
      const weapon = item(weaponName);
      const character = hero("wizard");
      character.classLevels = [{ classId: "wizard", level: 3 }];
      expect(
        getAvailableFeatWeaponChoices(
          character,
          "martial-weapon-proficiency",
          "general-3",
        ),
      ).toContain(weaponName);

      character.featSelections = { "general-3": "martial-weapon-proficiency" };
      character.featWeaponSelections = { "general-3": weaponName };
      expect(isWeaponProficient(character, weapon)).toBe(false);
      expect(isWeaponProficient(character, weapon, undefined, true)).toBe(true);
    },
  );

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
    character.classLevels = [{ classId: "rogue", level: 2 }];
    character.abilities.str = 10;
    character.equipment = { Shield: "Heavy Steel Shield" };
    character.featSelections = { "general-1": "weapon-finesse" };
    expect(getEquippedWeaponStats(character, "Rapier (Medium)")).toMatchObject({
      abilityAttackBonus: 4, finessePenalty: -2, nonproficiencyPenalty: -2, attack: 1,
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
