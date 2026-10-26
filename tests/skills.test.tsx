import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { skills, trainedOnlySkills } from "../src/data/characterCatalog";
import { getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getSkillTotalTooltip, getSkillAbility, isClassSkill } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";

describe("skill training and untrained use", () => {
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
    expect(getSkillUse(character, "Sleight of Hand").description).toContain("except hiding an object");
    expect(getSkillCheckModifier(character, "Sleight of Hand")).toBe(2);
    character.skills["Sleight of Hand"] = 1;
    expect(getSkillUse(character, "Sleight of Hand").label).toBe("Trained - usable");
  });

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
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
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
  expect(skillRow("Sleight of Hand").getAllByRole("tooltip").some((tooltip) => tooltip.textContent?.includes("except hiding an object"))).toBe(true);
  expect(screen.getByRole("group", { name: "Speak Language skill" }).querySelector(":scope > strong")?.textContent).toBe("");
  expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(character);
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
