import { describe, expect, it } from "vitest";
import {
  beginPrestigeLevelUp,
  cloneCharacter,
  initialCharacter,
} from "../src/domain";
import {
  getEffectiveSpellcastingClassLevel,
  getPrestigeClassEligibilityErrors,
  getPrestigeClassLevelUpSelectionErrors,
  getPrestigeSpellcastingClassOptions,
  isClassSkill,
} from "../src/rules";

function wizard(level: number) {
  const character = cloneCharacter(initialCharacter);
  character.ruleset = "dragonlance-user-pack";
  character.alignment = "Lawful Good";
  character.abilities.int = 14;
  character.classLevels = [{ classId: "wizard", level }];
  character.skills = { Spellcraft: 7 };
  character.feats = ["Spell Focus", "brew-potion", "scribe-scroll"];
  character.featSelections = { "spell-focus-slot": "spell-focus" };
  character.featSpellSchoolSelections = {
    "spell-focus-slot": "Abjuration",
  };
  return character;
}

describe("Dragonlance prestige-class rules", () => {
  it("applies spellcasting advancement to only the selected base class and correct levels", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 5 },
      {
        classId: "wizard",
        prestigeClassId: "wizard-of-high-sorcery",
        level: 2,
      },
      { classId: "cleric", level: 3 },
      { classId: "cleric", prestigeClassId: "knight-of-the-skull", level: 2 },
    ];

    expect(getEffectiveSpellcastingClassLevel(character, "wizard")).toBe(7);
    expect(getEffectiveSpellcastingClassLevel(character, "cleric")).toBe(4);
  });

  it("limits Wizard of High Sorcery advancement to wizard spellcasting", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [
      { classId: "wizard", level: 3 },
      { classId: "sorcerer", level: 5 },
    ];

    expect(
      getPrestigeSpellcastingClassOptions(character, "wizard-of-high-sorcery"),
    ).toEqual(["wizard"]);
  });

  it("requires Wizard of High Sorcery order-specific specialization and barred schools", () => {
    const character = wizard(7);
    character.highSorceryOrder = "white";
    character.wizardSpecializationSchool = "Abjuration";
    character.wizardBarredSchools = ["Illusion", "Enchantment"];
    expect(getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery")).toEqual([]);

    character.wizardSpecializationSchool = "Enchantment";
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Wizard specialization must be Abjuration or Divination for the white robes.");

    character.wizardSpecializationSchool = "Abjuration";
    character.wizardBarredSchools = ["Abjuration", "Illusion"];
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Both barred schools must be favored by the other robe orders.");

    character.wizardBarredSchools = ["Illusion", "Enchantment"];
    character.featSpellSchoolSelections = {
      "spell-focus-slot": "Enchantment",
    };
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain(
      "Spell Focus cannot be selected in Enchantment, a school favored by another robe order.",
    );
  });

  it("allows High Sorcery choices to be completed during level-up selection", () => {
    const character = wizard(7);

    expect(
      getPrestigeClassLevelUpSelectionErrors(
        character,
        "wizard-of-high-sorcery",
      ),
    ).toEqual([]);
    expect(
      getPrestigeClassEligibilityErrors(character, "wizard-of-high-sorcery"),
    ).toContain("Choose a robe order before taking Wizard of High Sorcery levels.");
  });

  it("requires all martial weapons for Knight of the Thorn, not one proficiency", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.alignment = "Lawful Evil";
    character.abilities.int = 14;
    character.classLevels = [
      { classId: "monk", level: 5 },
      { classId: "wizard", level: 3 },
    ];
    character.skills = {
      "Knowledge (arcana)": 4,
      "Knowledge (religion)": 4,
      Spellcraft: 8,
    };
    character.featSelections = {
      "heavy-armor": "armor-proficiency-heavy",
      "martial-weapon": "martial-weapon-proficiency",
      metamagic: "extend-spell",
    };

    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-thorn"),
    ).toContain("Martial Weapon Proficiency (all) is required.");
    expect(
      isClassSkill(character, "Knowledge (arcana)", "knight-of-the-thorn"),
    ).toBe(true);

    character.classLevels.push({ classId: "fighter", level: 1 });
    expect(
      getPrestigeClassEligibilityErrors(character, "knight-of-the-thorn"),
    ).toEqual([]);
  });

  it("retains prestige levels in the chosen casting-class association", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "wizard", level: 5 }];

    const draft = beginPrestigeLevelUp(
      character,
      "wizard-of-high-sorcery",
      "wizard",
    );

    expect(draft.proposed.classLevels).toContainEqual({
      classId: "wizard",
      prestigeClassId: "wizard-of-high-sorcery",
      level: 1,
    });
  });
});
