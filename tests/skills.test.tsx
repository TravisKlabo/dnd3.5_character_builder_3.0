import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter, type ClassId } from "../src/domain";
import { classSkills, skills, trainedOnlySkills } from "../src/data/characterCatalog";
import { getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getSkillTotalTooltip, getSkillAbility, getSkillSynergyBonus, getSkillSynergyContextOptions, isClassSkill, type SkillSynergyContext } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";
import { readStoredCharacter } from "./storageTestHelpers";

const performSkills = [
  "Perform (act)",
  "Perform (comedy)",
  "Perform (dance)",
  "Perform (keyboard instruments)",
  "Perform (mime)",
  "Perform (oratory)",
  "Perform (percussion instruments)",
  "Perform (sing)",
  "Perform (string instruments)",
  "Perform (wind instruments)",
];

const coreSkillSynergyCases: {
  sourceSkill: string;
  targetSkill: string;
  context?: SkillSynergyContext;
}[] = [
  { sourceSkill: "Bluff", targetSkill: "Diplomacy" },
  { sourceSkill: "Bluff", targetSkill: "Disguise", context: "disguise-in-character" },
  { sourceSkill: "Bluff", targetSkill: "Intimidate" },
  { sourceSkill: "Bluff", targetSkill: "Sleight of Hand" },
  { sourceSkill: "Craft", targetSkill: "Appraise", context: "appraise-related-craft" },
  { sourceSkill: "Decipher Script", targetSkill: "Use Magic Device", context: "scroll-use" },
  { sourceSkill: "Escape Artist", targetSkill: "Use Rope", context: "rope-bindings" },
  { sourceSkill: "Handle Animal", targetSkill: "Ride" },
  { sourceSkill: "Jump", targetSkill: "Tumble" },
  { sourceSkill: "Knowledge (arcana)", targetSkill: "Spellcraft" },
  { sourceSkill: "Knowledge (architecture and engineering)", targetSkill: "Search", context: "secret-doors" },
  { sourceSkill: "Knowledge (dungeoneering)", targetSkill: "Survival", context: "survival-underground" },
  { sourceSkill: "Knowledge (geography)", targetSkill: "Survival", context: "survival-navigation" },
  { sourceSkill: "Knowledge (local)", targetSkill: "Gather Information" },
  { sourceSkill: "Knowledge (nature)", targetSkill: "Survival", context: "survival-natural" },
  { sourceSkill: "Knowledge (nobility and royalty)", targetSkill: "Diplomacy" },
  { sourceSkill: "Knowledge (the planes)", targetSkill: "Survival", context: "survival-other-planes" },
  { sourceSkill: "Search", targetSkill: "Survival", context: "survival-tracking" },
  { sourceSkill: "Sense Motive", targetSkill: "Diplomacy" },
  { sourceSkill: "Spellcraft", targetSkill: "Use Magic Device", context: "scroll-use" },
  { sourceSkill: "Survival", targetSkill: "Knowledge (nature)" },
  { sourceSkill: "Tumble", targetSkill: "Balance" },
  { sourceSkill: "Tumble", targetSkill: "Jump" },
  { sourceSkill: "Use Magic Device", targetSkill: "Spellcraft", context: "scroll-deciphering" },
  { sourceSkill: "Use Rope", targetSkill: "Climb", context: "climbing-ropes" },
  { sourceSkill: "Use Rope", targetSkill: "Escape Artist", context: "escape-ropes" },
];

const coreClassSkillExpectations: readonly [ClassId, readonly string[]][] = [
  ["barbarian", ["Climb", "Craft", "Handle Animal", "Intimidate", "Jump", "Listen", "Ride", "Survival", "Swim"]],
  ["bard", [
    "Appraise", "Balance", "Bluff", "Climb", "Concentration", "Craft",
    "Decipher Script", "Diplomacy", "Disguise", "Escape Artist",
    "Gather Information", "Hide", "Jump", "Knowledge (arcana)",
    "Knowledge (architecture and engineering)", "Knowledge (dungeoneering)",
    "Knowledge (geography)", "Knowledge (history)", "Knowledge (local)",
    "Knowledge (nature)", "Knowledge (nobility and royalty)",
    "Knowledge (religion)", "Knowledge (the planes)", "Listen",
    "Move Silently", ...performSkills, "Profession", "Sense Motive",
    "Sleight of Hand", "Speak Language", "Spellcraft", "Swim", "Tumble",
    "Use Magic Device", "Use Rope",
  ]],
  ["cleric", [
    "Concentration", "Craft", "Diplomacy", "Heal", "Knowledge (arcana)",
    "Knowledge (history)", "Knowledge (religion)", "Knowledge (the planes)",
    "Profession", "Spellcraft",
  ]],
  ["druid", [
    "Concentration", "Craft", "Diplomacy", "Handle Animal", "Heal",
    "Knowledge (nature)", "Listen", "Profession", "Ride", "Spellcraft",
    "Spot", "Survival", "Swim",
  ]],
  ["fighter", ["Climb", "Craft", "Handle Animal", "Intimidate", "Jump", "Ride", "Swim"]],
  ["monk", [
    "Balance", "Climb", "Concentration", "Craft", "Diplomacy", "Escape Artist",
    "Hide", "Jump", "Knowledge (arcana)", "Knowledge (religion)", "Listen",
    "Move Silently", ...performSkills, "Profession", "Sense Motive", "Spot",
    "Swim", "Tumble",
  ]],
  ["paladin", [
    "Concentration", "Craft", "Diplomacy", "Handle Animal", "Heal",
    "Knowledge (nobility and royalty)", "Knowledge (religion)", "Profession",
    "Ride", "Sense Motive",
  ]],
  ["ranger", [
    "Climb", "Concentration", "Craft", "Handle Animal", "Heal", "Hide",
    "Jump", "Knowledge (dungeoneering)", "Knowledge (geography)",
    "Knowledge (nature)", "Listen", "Move Silently", "Profession", "Ride",
    "Search", "Spot", "Survival", "Swim", "Use Rope",
  ]],
  ["rogue", [
    "Appraise", "Balance", "Bluff", "Climb", "Craft", "Decipher Script",
    "Diplomacy", "Disable Device", "Disguise", "Escape Artist", "Forgery",
    "Gather Information", "Hide", "Intimidate", "Jump", "Knowledge (local)",
    "Listen", "Move Silently", "Open Lock", ...performSkills, "Search",
    "Sense Motive", "Sleight of Hand", "Spot", "Swim", "Tumble",
    "Use Magic Device", "Use Rope",
  ]],
  ["sorcerer", [
    "Bluff", "Concentration", "Craft", "Knowledge (arcana)", "Profession",
    "Spellcraft",
  ]],
  ["wizard", [
    "Concentration", "Craft", "Decipher Script", "Knowledge (arcana)",
    "Knowledge (architecture and engineering)", "Knowledge (dungeoneering)",
    "Knowledge (geography)", "Knowledge (history)", "Knowledge (local)",
    "Knowledge (nature)", "Knowledge (nobility and royalty)",
    "Knowledge (religion)", "Knowledge (the planes)", "Profession",
    "Spellcraft",
  ]],
];

describe("skill training and untrained use", () => {
  it("applies each Skill Focus bonus to its selected skill without stacking duplicates", () => {
    const character = cloneCharacter(initialCharacter);
    character.skills.Listen = 2;
    character.featSelections = {
      "general-1": "skill-focus",
      "human-1": "skill-focus",
    };
    character.featSkillSelections = {
      "general-1": "Listen",
      "human-1": "Knowledge (arcana)",
    };
    expect(getSkillCheckModifier(character, "Listen")).toBe(5);
    expect(getSkillCheckModifier(character, "Knowledge (arcana)")).toBe(3);
    expect(getSkillCheckModifier(character, "Spot")).toBe(0);
    expect(getSkillTotalTooltip(character, "Listen")).toContain("Skill Focus: +3");

    character.featSkillSelections["human-1"] = "Listen";
    expect(getSkillCheckModifier(character, "Listen")).toBe(5);
  });

  it.each(coreClassSkillExpectations)(
    "matches the SRD class-skill list for %s",
    (classId, expected) => {
      expect([...(classSkills[classId] ?? [])].sort()).toEqual(
        [...expected].sort(),
      );
    },
  );

  it.each(["Listen", "Spot", "Climb", "Craft", "Perform (sing)", "Search", "Bluff"])(
    "allows %s at zero ranks without making it trained", (skill) => {
      expect(getSkillUse(initialCharacter, skill)).toMatchObject({ trained: false, usable: true, untrainedUse: "allowed" });
      expect(getSkillCheckModifier(initialCharacter, skill)).toBe(0);
    },
  );

  it.each([...trainedOnlySkills])("requires a whole rank in %s before showing a usable modifier", (skill) => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.int = 18;
    expect(getSkillUse(character, skill)).toMatchObject({ trained: false, usable: false, untrainedUse: "none" });
    expect(getSkillCheckModifier(character, skill)).toBeNull();
    character.skills[skill] = 0.5;
    expect(getSkillUse(character, skill).usable).toBe(false);
    character.skills[skill] = 1;
    expect(getSkillUse(character, skill)).toMatchObject({ trained: true, usable: true, untrainedUse: "none" });
    expect(getSkillCheckModifier(character, skill)).not.toBeNull();
  });

  it("matches the core SRD trained-only skill list", () => {
    expect([...trainedOnlySkills].sort()).toEqual([
      "Decipher Script",
      "Disable Device",
      "Open Lock",
      "Profession",
      "Spellcraft",
      "Tumble",
      "Use Magic Device",
    ]);
  });

  it.each(skills.filter((skill) => skill.startsWith("Knowledge (")))(
    "limits untrained %s to common knowledge DC 10 or lower", (skill) => {
      const character = cloneCharacter(initialCharacter);
      character.abilities.int = 16;
      expect(getSkillUse(character, skill)).toMatchObject({ untrainedUse: "limited", trained: false, usable: true });
      expect(getSkillUse(character, skill).description).toContain("DC 10 or lower");
      expect(getSkillCheckModifier(character, skill)).toBe(3);
      character.skills[skill] = 1;
      expect(getSkillUse(character, skill).trained).toBe(true);
      expect(getSkillCheckModifier(character, skill)).toBe(4);
    },
  );

  it("explains the Handle Animal and Sleight of Hand exceptions", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.cha = 16;
    character.abilities.dex = 14;
    expect(getSkillUse(character, "Handle Animal").description).toContain("domestic animals");
    expect(getSkillUse(character, "Handle Animal").description).toContain("animal companion");
    expect(getSkillCheckModifier(character, "Handle Animal")).toBe(3);
    expect(getSkillUse(character, "Sleight of Hand").description).toContain("except when hiding an object");
    expect(getSkillCheckModifier(character, "Sleight of Hand")).toBe(2);
    character.skills["Sleight of Hand"] = 1;
    expect(getSkillUse(character, "Sleight of Hand").label).toBe("Trained - usable");
  });

  it.each([
    ["Appraise", "allowed", "rough estimate"],
    ["Forgery", "allowed", "literacy in that document's language"],
    ["Open Lock", "none", "force it open"],
    ["Disable Device", "none", "Trapfinding class feature"],
  ] as const)(
    "describes the SRD task restriction for %s",
    (skill, untrainedUse, note) => {
      const character = cloneCharacter(initialCharacter);
      expect(getSkillUse(character, skill)).toMatchObject({ untrainedUse });
      expect(getSkillUse(character, skill).description).toContain(note);
    },
  );

  it("does not equate class skills with training or cross-class skills with unusability", () => {
    expect(isClassSkill(initialCharacter, "Climb")).toBe(true);
    expect(getSkillUse(initialCharacter, "Climb").trained).toBe(false);
    expect(isClassSkill(initialCharacter, "Listen")).toBe(false);
    expect(getSkillUse(initialCharacter, "Listen").usable).toBe(true);
  });

  it("does not invent a Speak Language check", () => {
    const character = cloneCharacter(initialCharacter);
    character.skills["Speak Language"] = 2;
    expect(getSkillUse(character, "Speak Language")).toMatchObject({ trained: true, untrainedUse: "special", label: "No skill check" });
    expect(getSkillCheckModifier(character, "Speak Language")).toBeNull();
  });

  it.each(coreSkillSynergyCases)(
    "applies the 5-rank synergy from $sourceSkill to $targetSkill",
    ({ sourceSkill, targetSkill, context }) => {
      const character = cloneCharacter(initialCharacter);
      character.skills[sourceSkill] = 4.5;
      expect(getSkillSynergyBonus(character, targetSkill, context)).toBe(0);
      character.skills[sourceSkill] = 5;
      expect(getSkillSynergyBonus(character, targetSkill, context)).toBe(2);
      if (context)
        expect(getSkillSynergyBonus(character, targetSkill)).toBe(0);
    },
  );

  it("applies at most one +2 synergy bonus when several skills qualify", () => {
    const character = cloneCharacter(initialCharacter);
    character.skills.Diplomacy = 1;
    character.skills.Bluff = 5;
    character.skills["Sense Motive"] = 5;
    character.skills["Knowledge (nobility and royalty)"] = 5;

    expect(getSkillSynergyBonus(character, "Diplomacy")).toBe(2);
    expect(getSkillCheckModifier(character, "Diplomacy")).toBe(3);
  });

  it("offers only conditional synergy contexts whose source skill has five ranks", () => {
    const character = cloneCharacter(initialCharacter);
    character.skills.Search = 1;
    character.skills["Knowledge (architecture and engineering)"] = 4.5;
    expect(getSkillSynergyContextOptions(character, "Search")).toEqual([]);
    character.skills["Knowledge (architecture and engineering)"] = 5;
    expect(getSkillSynergyContextOptions(character, "Search")).toEqual([
      {
        context: "secret-doors",
        label: "Searching for secret doors or compartments",
        bonus: 2,
      },
    ]);
    expect(getSkillCheckModifier(character, "Search")).toBe(1);
    expect(
      getSkillCheckModifier(character, "Search", undefined, "secret-doors"),
    ).toBe(3);
  });

  it("shows a selected skill synergy context in the skill modifier and tooltip", async () => {
    const character = cloneCharacter(initialCharacter);
    character.skills.Search = 1;
    character.skills["Knowledge (architecture and engineering)"] = 5;
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);

    const searchSkill = await screen.findByRole("group", { name: "Search skill" });
    const modifier = () => skillRow("Search").getByRole("strong").textContent;
    expect(modifier()).toBe("+1");
    fireEvent.change(
      within(searchSkill).getByRole("combobox", { name: "Search synergy context" }),
      { target: { value: "secret-doors" } },
    );
    expect(modifier()).toBe("+3");
    expect(skillRow("Search").getByRole("strong").getAttribute("title"))
      .toContain("Skill synergy +2: Knowledge (architecture and engineering)");
  });

  it("applies an unconditional synergy to a limited untrained check", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities.dex = 14;
    character.skills.Bluff = 5;
    expect(getSkillCheckModifier(character, "Sleight of Hand")).toBe(4);
  });

  it("uses correct key abilities and whole ranks with racial bonuses", () => {
    expect(getSkillAbility("Disable Device")).toBe("int");
    expect(getSkillAbility("Forgery")).toBe("int");
    expect(getSkillAbility("Disguise")).toBe("cha");
    const character = cloneCharacter(initialCharacter);
    character.race = "Halfling";
    character.abilities.dex = 16;
    character.skills["Move Silently"] = 1.5;
    expect(getSkillCheckModifier(character, "Move Silently")).toBe(6);
    character.skills["Move Silently"] = 0.5;
    expect(getSkillUse(character, "Move Silently").trained).toBe(false);
    expect(getSkillCheckModifier(character, "Move Silently")).toBe(5);
  });
});

function skillRow(name: string) {
  return within(screen.getByRole("group", { name: `${name} skill` }));
}

describe("armor and shield skill penalties", () => {
  it.each(["Balance", "Climb", "Escape Artist", "Hide", "Jump", "Move Silently", "Sleight of Hand", "Tumble", "Swim"])(
    "applies equipped armor and shield penalties to %s", (skill) => {
      const character = cloneCharacter(initialCharacter);
      character.skills[skill] = 2;
      character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
      expect(getSkillCheckModifier(character, skill)).toBe(2 - (skill === "Swim" ? 14 : 7));
      expect(getSkillCheckPenalties(character, skill)).toEqual([
        { source: "armor", name: "Chainmail", penalty: skill === "Swim" ? -10 : -5, multiplier: skill === "Swim" ? 2 : 1 },
        { source: "shield", name: "Heavy Steel Shield", penalty: skill === "Swim" ? -4 : -2, multiplier: skill === "Swim" ? 2 : 1 },
      ]);
    },
  );

  it.each(["Listen", "Spot", "Knowledge (arcana)", "Spellcraft", "Ride", "Use Rope"])(
    "does not apply the normal armor check penalty to %s", (skill) => {
      const character = cloneCharacter(initialCharacter);
      character.skills[skill] = 1;
      character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
      expect(getSkillCheckPenalties(character, skill)).toEqual([]);
      expect(getSkillCheckModifier(character, skill)).toBe(1);
    },
  );

  it("applies penalties to limited untrained Sleight of Hand but leaves blocked checks empty", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment.Armor = "Chainmail";
    expect(getSkillCheckModifier(character, "Sleight of Hand")).toBe(-5);
    expect(getSkillCheckModifier(character, "Tumble")).toBeNull();
    expect(getSkillCheckPenalties(character, "Tumble")).toEqual([]);
  });

  it.each([
    ["Masterwork Chain Shirt", -1], ["+2 Chain Shirt", -1],
    ["+2 Masterwork Chain Shirt", -1], ["Mithral Chain Shirt", 0],
    ["Mithral Breastplate", -1], ["+2 Mithral Breastplate", -1], ["Leather Armor", 0],
  ])("uses material/masterwork penalties without stacking quality reductions for %s", (armor, penalty) => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Armor: armor, Shield: "Masterwork Buckler" };
    expect(getSkillCheckModifier(character, "Hide")).toBe(penalty);
    expect(getSkillCheckPenalties(character, "Hide")).toHaveLength(penalty ? 1 : 0);
  });

  it("uses custom item penalties rather than matching a standard armor name inside them", () => {
    addCustomStoreItems([
      { name: "Test Chainmail", category: "Armor", price: 1, weight: "1 lb.", custom: true, armorCheckPenalty: 3 },
      { name: "Test Shield", category: "Shields", price: 1, weight: "1 lb.", custom: true, shieldCheckPenalty: -2 },
    ]);
    try {
      const character = cloneCharacter(initialCharacter);
      character.equipment = { Armor: "Test Chainmail", Shield: "Test Shield" };
      expect(getSkillCheckModifier(character, "Hide")).toBe(-5);
    } finally {
      deleteCustomStoreItem("Test Chainmail");
      deleteCustomStoreItem("Test Shield");
    }
  });

  it("applies only load penalties to carried armor until it is equipped", () => {
    const character = cloneCharacter(initialCharacter);
    character.inventory.Chainmail = 1;
    expect(getSkillCheckPenalties(character, "Hide")).toMatchObject([{ source: "load", penalty: -3 }]);
    character.equipment.Armor = "Chainmail";
    expect(getSkillCheckModifier(character, "Hide")).toBe(-5);
    delete character.equipment.Armor;
    expect(getSkillCheckModifier(character, "Hide")).toBe(-3);
    character.inventory = {};
    expect(getSkillCheckModifier(character, "Hide")).toBe(0);
  });

  it("shows compact causes only where penalties apply and explains the sources in tooltips", () => {
    const character = cloneCharacter(initialCharacter);
    character.equipment = { Armor: "Chainmail", Shield: "Heavy Steel Shield" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    expect(skillRow("Hide").getByText("-5 armor, -2 shield")).toBeDefined();
    expect(skillRow("Swim").getByText("-10 armor, -4 shield")).toBeDefined();
    expect(getSkillTotalTooltip(character, "Swim")).toContain("Chainmail: -10 armor check penalty (doubled for Swim)");
    expect(screen.getByRole("group", { name: "Hide skill" }).querySelector(":scope > strong")?.textContent).toBe("-7");
    expect(screen.getByRole("group", { name: "Listen skill" }).querySelector(".skill-penalty")).toBeNull();
    expect(screen.getByRole("group", { name: "Tumble skill" }).querySelector(".skill-penalty")).toBeNull();
    expect(readStoredCharacter()).toEqual(character);
  });
});

it("shows training, untrained permissions and blocked totals on a finalized sheet without changing saves", () => {
  const character = cloneCharacter(initialCharacter);
  character.abilities.dex = 16;
  character.skills["Spellcraft"] = 1;
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);
  expect(skillRow("Climb").queryByText("Trained")).toBeNull();
  expect(skillRow("Climb").getAllByRole("tooltip").some((tooltip) => tooltip.textContent?.includes("Untrained - usable"))).toBe(true);
  expect(skillRow("Climb").getByRole<HTMLInputElement>("checkbox").checked).toBe(true);
  expect(skillRow("Open Lock").queryByText("Training required")).toBeNull();
  expect(skillRow("Open Lock").getAllByRole("tooltip").some((tooltip) => tooltip.textContent?.includes("Training required"))).toBe(true);
  expect(screen.getByRole("group", { name: "Open Lock skill" }).querySelector(":scope > strong")?.textContent).toBe("");
  expect(skillRow("Open Lock").queryByText("+3")).toBeNull();
  expect(skillRow("Spellcraft").getByText("Trained")).toBeDefined();
  const knowledgeTooltip = skillRow("Knowledge (arcana)").getAllByRole("tooltip").find((tooltip) => tooltip.textContent?.includes("Untrained - limited use"));
  expect(knowledgeTooltip?.textContent).toContain("common knowledge only");
  expect(knowledgeTooltip?.parentElement?.tabIndex).toBe(0);
  expect(skillRow("Sleight of Hand").getAllByRole("tooltip").some((tooltip) => tooltip.textContent?.includes("except when hiding an object"))).toBe(true);
  expect(screen.getByRole("group", { name: "Speak Language skill" }).querySelector(":scope > strong")?.textContent).toBe("");
  expect(readStoredCharacter()).toEqual(character);
});

it("shows a qualifying class-feature synergy in the Special Abilities list", async () => {
  const character = cloneCharacter(initialCharacter);
  character.classLevels = [{ classId: "bard", level: 1 }];
  character.skills["Knowledge (history)"] = 5;
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);

  const feature = await screen.findByText("Bardic Knowledge", { selector: "strong" });
  expect(feature.parentElement?.textContent).toContain(
    "+2 synergy from Knowledge (history) to Bardic Knowledge checks",
  );
});

it("shows Gnome racial spell-like abilities and the applicable save DC", async () => {
  const character = cloneCharacter(initialCharacter);
  character.race = "Gnome";
  character.abilities.cha = 14;
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);

  expect((await screen.findByText(/Speak with Animals/)).textContent)
    .toContain("Burrowing mammals only; duration 1 minute.");
  expect((await screen.findByText(/Ghost Sound/)).textContent)
    .toContain("Will disbelief DC 13 (+1 racial illusion bonus)");
  expect(screen.queryByText("Spell-like abilities (1/day)")).toBeNull();
});

it("updates training immediately when assigning or removing a rank during setup", () => {
  render(<App />);
  const row = skillRow("Climb");
  expect(row.queryByText("Trained")).toBeNull();
  fireEvent.click(row.getByRole("button", { name: "Add rank to Climb" }));
  expect(row.getByText("Trained")).toBeDefined();
  expect(row.getAllByRole("tooltip").some((tooltip) => tooltip.textContent?.includes("1 rank · Trained - usable"))).toBe(true);
  fireEvent.click(row.getByRole("button", { name: "Remove rank from Climb" }));
  expect(row.queryByText("Trained")).toBeNull();
});

it("spends one skill point for a half-rank in a cross-class skill", () => {
  render(<App />);
  const row = skillRow("Spellcraft");
  fireEvent.click(row.getByRole("button", { name: "Add half rank to Spellcraft" }));
  expect(row.getByText("0.5")).toBeDefined();
  expect(row.queryByText("Trained")).toBeNull();
  expect(screen.getByText(/Skills \(1\/12\)/)).toBeDefined();
});

it("rolls provisional training back when a level-up draft is discarded", () => {
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(initialCharacter));
  render(<App />);
  vi.spyOn(window, "alert").mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
  fireEvent.click(skillRow("Climb").getByRole("button", { name: "Add rank to Climb" }));
  expect(skillRow("Climb").getByText("Trained")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
  expect(skillRow("Climb").queryByText("Trained")).toBeNull();
});
