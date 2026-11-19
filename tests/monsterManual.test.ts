import { beforeAll, describe, expect, it } from "vitest";
import { cloneCharacter, initialCharacter, rulesetIds } from "../src/domain";
import { featCatalog } from "../src/data/characterCatalog";
import { featQualifies, getArcaneSpellFailure, getAvailableFeats, getFeatSlots } from "../src/rules";
import {
  findSpellByName,
  getClassSpells,
  getSrdSpellSourceBook,
  loadSpellCatalog,
  spells,
} from "../src/data/spellCatalog";

beforeAll(loadSpellCatalog);

describe("Monster Manual sourcebook corrections", () => {
  const featFor = (id: string) => {
    const feat = featCatalog.find((candidate) => candidate.id === id);
    if (!feat) throw new Error(`Missing monster feat: ${id}`);
    return feat;
  };

  it("adds Beget Bogun once, using its verified 3.5 reprint and construction limits", () => {
    const spell = findSpellByName("Beget Bogun");
    expect(spell).toMatchObject({
      level: 1,
      classes: ["druid"],
      school: "Conjuration (Creation)",
      components: "V, S, M, XP",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "None",
    });
    expect(spell?.description).toContain("25 XP");
    expect(spell?.description).toContain("7th-level creator");
    expect(spell?.description).toContain("Craft Wondrous Item");
    expect(spell?.description).toContain("Control Plants, Wood Shape");
    expect(spell?.description).toContain("week of solitary work");
    expect(spell?.description).toContain("manually");
    expect(spell && getSrdSpellSourceBook(spell)).toBe(
      "Monster Manual II, p. 35; Complete Divine (3.5), pp. 152-153",
    );
    expect(spells.filter((candidate) => candidate.name === "Beget Bogun")).toHaveLength(1);
    expect(getClassSpells("druid").find((candidate) => candidate.name === "Beget Bogun")?.level).toBe(1);
    expect(getClassSpells("wizard").some((candidate) => candidate.name === "Beget Bogun")).toBe(false);
  });

  it("checks shifter race, Constitution, and two other shifter feats rather than arbitrary feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    character.race = "Shifter";
    character.abilities.con = 12;
    const slot = { characterLevel: 6, fighterOnly: false };
    expect(featQualifies(character, featFor("healing-factor"), slot)).toBe(false);
    character.abilities.con = 13;
    expect(featQualifies(character, featFor("healing-factor"), slot)).toBe(true);
    expect(featQualifies(character, featFor("shifter-instincts"), slot)).toBe(true);

    character.featSelections = {
      "general-1": "shifter-instincts",
      "general-3": "toughness",
    };
    for (const id of ["extra-shifter-trait", "shifter-defense"]) {
      expect(featQualifies(character, featFor(id), slot)).toBe(false);
    }
    character.featSelections["general-3"] = "healing-factor";
    for (const id of ["extra-shifter-trait", "shifter-defense"]) {
      expect(featQualifies(character, featFor(id), slot)).toBe(true);
      character.featSelections["general-6"] = id;
      character.featSelections["general-3"] = "toughness";
      expect(featQualifies(character, featFor(id), slot, "general-6")).toBe(false);
      delete character.featSelections["general-6"];
      character.featSelections["general-3"] = "healing-factor";
    }
    character.race = "Human";
    for (const id of ["extra-shifter-trait", "healing-factor", "shifter-defense", "shifter-instincts"]) {
      expect(featQualifies(character, featFor(id), slot)).toBe(false);
    }
  });

  it.each(["adamantine-body", "mithral-body"])("limits %s to warforged at first level", (id) => {
    const character = cloneCharacter(initialCharacter);
    const feat = featFor(id);
    const firstLevel = { characterLevel: 1, fighterOnly: false };
    expect(featQualifies(character, feat, firstLevel)).toBe(false);
    for (const race of ["Warforged", "Warforged Scout", "Warforged Charger"]) {
      character.race = race;
      expect(featQualifies(character, feat, firstLevel)).toBe(true);
      expect(featQualifies(character, feat, { characterLevel: 3, fighterOnly: false })).toBe(false);
    }
    expect(feat.description).toContain("Druid");
    expect(feat.description).toContain("not modeled");
  });

  it("checks Improved Fortification's BAB +6 threshold and loss of Healing-subschool access", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Warforged";
    character.classLevels = [{ classId: "fighter", level: 5 }];
    const feat = featFor("improved-fortification");
    expect(featQualifies(character, feat, { characterLevel: 5, fighterOnly: false })).toBe(false);
    character.classLevels = [{ classId: "fighter", level: 6 }];
    expect(featQualifies(character, feat, { characterLevel: 6, fighterOnly: false })).toBe(true);
    character.race = "Human";
    expect(featQualifies(character, feat, { characterLevel: 6, fighterOnly: false })).toBe(false);
    expect(feat.description).toContain("Healing subschool can no longer heal");
  });

  it("requires Mithral Body for repeatable Mithral Fluidity and does not repeat other racial feats", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Warforged";
    character.classLevels = [{ classId: "fighter", level: 6 }];
    const slot = getFeatSlots(character).find((candidate) => candidate.id === "general-6");
    if (!slot) throw new Error("Missing level-six feat slot.");
    const fluidity = featFor("mithral-fluidity");
    expect(getAvailableFeats(character, slot)).not.toContain(fluidity);
    character.featSelections = {
      "general-1": "mithral-body",
      "general-3": "mithral-fluidity",
    };
    expect(getAvailableFeats(character, slot)).toContain(fluidity);
    expect(fluidity.description).toContain("(not Swim)");
    expect(fluidity.description).toContain("beyond 0");

    character.race = "Shifter";
    character.featSelections = { "general-1": "shifter-instincts" };
    expect(getAvailableFeats(character, slot)).not.toContain(featFor("shifter-instincts"));
  });

  it("keeps all newly cataloged racial-feat effects explicitly manual until their races are modeled", () => {
    for (const id of [
      "extra-shifter-trait", "healing-factor", "shifter-defense", "shifter-instincts",
      "adamantine-body", "improved-fortification", "mithral-body", "mithral-fluidity",
    ]) {
      expect(featFor(id).description).toContain("manual");
      expect(featFor(id).description).toContain("not modeled");
    }
  });

  it("adds Summon Clockwork Mender Swarm at level four with inherited summoning metadata", () => {
    const spell = findSpellByName("Summon Clockwork Mender Swarm");
    expect(spell).toMatchObject({
      level: 4,
      classes: ["cleric", "sorcerer", "wizard"],
      school: "Conjuration (Summoning) [Lawful]",
      components: "V, S, F/DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
      sourceBook: "Monster Manual IV, p. 30",
    });
    expect(spell?.description).toContain("one clockwork mender swarm");
    expect(spell?.description).toContain("broken metal gear");
    expect(spell?.description).toContain("swarm repair");
    expect(spell?.description).toContain("swarm sacrifice");
    for (const classId of ["cleric", "sorcerer", "wizard", "mystic"] as const) {
      expect(getClassSpells(classId).find((candidate) => candidate.name === spell?.name)?.level).toBe(4);
    }
    expect(getClassSpells("druid").some((candidate) => candidate.name === spell?.name)).toBe(false);
  });

  it.each(["wizard", "sorcerer", "bard"] as const)(
    "applies Githyanki Battlecaster to light armor for %s but not shields or heavier armor",
    (classId) => {
      const character = cloneCharacter(initialCharacter);
      character.race = "Githyanki";
      character.classLevels = [{ classId, level: 6 }];
      character.abilities.int = 14;
      character.abilities.cha = 14;
      character.featSelections = { "general-6": "githyanki-battlecaster" };
      character.equipment = { Armor: "Chain Shirt (Medium)", Shield: "Buckler (Medium)" };
      expect(getArcaneSpellFailure(character, classId)?.percent).toBe(5);
      expect(getArcaneSpellFailure(character, classId)?.detail).toContain("Githyanki Battlecaster");
      character.equipment.Armor = "Mithral Breastplate (Medium)";
      expect(getArcaneSpellFailure(character, classId)?.percent).toBe(5);
      character.equipment.Armor = "Breastplate (Medium)";
      expect(getArcaneSpellFailure(character, classId)?.percent).toBe(30);
      character.equipment.Armor = "Full Plate (Medium)";
      expect(getArcaneSpellFailure(character, classId)?.percent).toBe(40);
      expect(getArcaneSpellFailure(character, "cleric")).toBeUndefined();
    },
  );

  it("preserves ordinary wizard spell failure after removing Githyanki Battlecaster", () => {
    const character = cloneCharacter(initialCharacter);
    character.race = "Githyanki";
    character.classLevels = [{ classId: "wizard", level: 6 }];
    character.abilities.int = 14;
    character.equipment = { Armor: "Chain Shirt (Medium)" };
    character.featSelections = { "general-6": "githyanki-battlecaster" };
    expect(getArcaneSpellFailure(character, "wizard")?.percent).toBe(0);
    character.featSelections = {};
    expect(getArcaneSpellFailure(character, "wizard")?.percent).toBe(20);
    character.featSelections = { "general-6": "githyanki-battlecaster" };
    character.equipment.Armor = "Unrecorded armor";
    expect(getArcaneSpellFailure(character, "wizard")?.percent).toBeNull();
  });

  it("preserves MMIV's revised feat limits and the dragon mount's AC bonus", () => {
    expect(featFor("ability-focus").description).toContain("special ability that allows a saving throw");
    expect(featFor("clinging-breath").description).toContain("recharge wait by 1 round");
    expect(featFor("githyanki-dragonrider").description).toContain(
      "both you and the mount gain +1 Reflex saves and +1 insight AC",
    );
    expect(featFor("lingering-breath").description).toContain("normal saving throws still apply");
    expect(featFor("lingering-breath").description).toContain("end of its next turn");
    expect(featFor("lingering-breath").description).toContain("recharge wait by 2 rounds");
  });

  it("adds Earthbind's actual flight suppression rather than restricting all airborne movement", () => {
    const spell = findSpellByName("Earthbind");
    expect(spell).toMatchObject({
      level: 2,
      classes: ["druid", "sorcerer", "wizard"],
      school: "Transmutation",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 minute/level (D)",
      savingThrow: "Fortitude negates",
      sourceBook: "Monster Manual V, p. 26",
    });
    expect(spell?.description).toContain("fly speed becomes 0 ft.");
    expect(spell?.description).toContain("Feather Fall");
    expect(spell?.description).toContain("New effects granting a fly speed are suppressed");
    expect(spell?.description).toContain("Levitate, and Air Walk, is unaffected");
    expect(spell?.description).toContain("Spell resistance applies");
    expect(spell?.description).toContain("manually");
  });

  it("offers each supplemental spell only once on its proper class lists in every supported ruleset", () => {
    const expectedClasses = new Map([
      ["Beget Bogun", ["druid"]],
      ["Summon Clockwork Mender Swarm", ["cleric", "sorcerer", "wizard", "mystic"]],
      ["Earthbind", ["druid", "sorcerer", "wizard"]],
    ]);
    for (const [name, classes] of expectedClasses) {
      expect(spells.filter((spell) => spell.name === name)).toHaveLength(1);
      for (const ruleset of rulesetIds) {
        for (const classId of ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard", "mystic"] as const) {
          expect(
            getClassSpells(classId, ruleset).filter((spell) => spell.name === name),
          ).toHaveLength(classes.includes(classId) ? 1 : 0);
        }
      }
    }
  });

  it("actually offers Brutal Throw in fighter bonus-feat slots, not just its descriptive text", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    const slot = getFeatSlots(character).find((candidate) => candidate.id === "fighter-1");
    if (!slot) throw new Error("Missing first-level Fighter bonus-feat slot.");
    const feat = featFor("brutal-throw");
    expect(getAvailableFeats(character, slot)).toContain(feat);
    expect(feat.sourceBook).toBe("Complete Adventurer (3.5)");
    expect(feat.description).toContain("manually");
  });
});
