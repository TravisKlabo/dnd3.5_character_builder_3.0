import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { equipInventoryItem, getArmorClassValues, getEquipmentArmorClass, getEquipmentDefenseBonuses, getForceShieldState, getSavingThrow } from "../src/rules";
import { addCustomStoreItems, deleteCustomStoreItem } from "../src/data/equipmentCatalog";
import { loadSavedCharacter, savedCharacterStorageKey } from "../src/storage";
import App from "../src/App";
import { PrintableCharacterSheet } from "../src/components/PrintableCharacterSheet";

function hero() {
  const character = cloneCharacter(initialCharacter);
  character.abilities.dex = 16;
  character.abilities.con = 14;
  character.abilities.wis = 12;
  return character;
}

describe("equipped defensive magic items", () => {
  it.each([1, 2, 3, 4, 5])("adds a +%s ring to all AC variants", (bonus) => {
    const character = hero();
    character.equipment = { "Rings 1": `Ring of Protection +${bonus}` };
    expect(getArmorClassValues(character)).toMatchObject({
      normal: 13 + bonus, touch: 13 + bonus, flatFooted: 10 + bonus,
    });
  });

  it("takes only the highest ring bonus, explains suppressed copies, and recalculates on removal", () => {
    const character = hero();
    character.equipment = { "Rings 1": "Ring of Protection +2", "Rings 2": "Ring of Protection +3 (Medium)" };
    expect(getEquipmentDefenseBonuses(character).deflection.bonus).toBe(3);
    expect(getArmorClassValues(character).normal).toBe(16);
    expect(getArmorClassValues(character).detail.join("\n")).toContain("does not stack");
    character.equipment["Rings 2"] = "Ring of Protection +2";
    expect(getEquipmentDefenseBonuses(character).deflection.bonus).toBe(2);
    expect(getEquipmentDefenseBonuses(character).deflection.detail.filter((line) => !line.includes("does not stack"))).toHaveLength(1);
    character.equipment["Rings 1"] = "";
    expect(getArmorClassValues(character).normal).toBe(15);
    character.equipment["Rings 2"] = "";
    expect(getArmorClassValues(character).normal).toBe(13);
  });

  it("adds Arrow Catching's ranged-weapon deflection AC without stacking deflection bonuses", () => {
    const character = hero();
    character.equipment = { Shield: "Arrow Catching +1 Heavy Steel Shield (Medium)" };
    const defenses = getArmorClassValues(character);
    expect(defenses.arrowCatchingActive).toBe(true);
    expect(defenses.rangedWeapon).toBe(defenses.normal + 1);
    expect(defenses.rangedWeaponTouch).toBe(defenses.touch + 1);
    expect(defenses.rangedWeaponFlatFooted).toBe(defenses.flatFooted + 1);

    character.equipment["Rings 1"] = "Ring of Protection +2";
    const withRing = getArmorClassValues(character);
    expect(withRing.rangedWeapon).toBe(withRing.normal);
    expect(withRing.rangedWeaponTouch).toBe(withRing.touch);
    expect(withRing.arrowCatchingShield).toBe(true);
  });

  it("uses the highest shield bonus from a physical shield or Ring of Force Shield", () => {
    const character = hero();
    character.equipment = { "Rings 1": "Ring of Force Shield" };
    expect(getForceShieldState(character)).toEqual({ equipped: true, active: false });
    expect(getArmorClassValues(character)).toMatchObject({
      normal: 13, touch: 13, flatFooted: 10, components: { shield: 0 },
    });

    character.forceShieldActive = true;
    expect(getArmorClassValues(character)).toMatchObject({
      normal: 15, touch: 13, flatFooted: 12, components: { shield: 2 },
    });
    character.equipment.Shield = "+1 Heavy Steel Shield (Medium)";
    const defenses = getArmorClassValues(character);
    expect(defenses.components.shield).toBe(3);
    expect(defenses.normal).toBe(16);
    expect(defenses.detail.join("\n")).toContain("does not stack with the higher shield bonus");
  });

  it("adds the Dusty Rose Prism insight bonus to every AC variant", () => {
    const character = hero();
    character.equipment.Miscellaneous = "Ioun Stone, Dusty Rose Prism";
    expect(getArmorClassValues(character)).toMatchObject({
      normal: 14, touch: 14, flatFooted: 11, components: { insight: 1 },
    });
  });

  it.each([1, 2, 3, 4, 5])("adds +%s natural armor enhancement but excludes it and enhanced armor/shields from touch", (bonus) => {
    const character = hero();
    character.equipment = { Armor: "+2 Full Plate (Medium)", Shield: "+1 Heavy Steel Shield (Medium)",
      "Rings 1": "Ring of Protection +2", Neck: `Amulet of Natural Armor +${bonus}` };
    expect(getArmorClassValues(character)).toMatchObject({
      normal: 26 + bonus, touch: 13, flatFooted: 25 + bonus,
    });
    expect(getEquipmentArmorClass(character)).toBe(26 + bonus);
  });

  it("retains a Dexterity penalty in all AC variants while applying item bonuses", () => {
    const character = hero();
    character.abilities.dex = 6;
    character.equipment = { "Rings 1": "Ring of Protection +2", Neck: "Amulet of Natural Armor +3" };
    expect(getArmorClassValues(character)).toMatchObject({ normal: 13, touch: 10, flatFooted: 13 });
  });

  it("uses the highest armor bonus from worn armor, bracers, or the Robe of the Archmagi", () => {
    const character = hero();
    const baseArmorClass = getArmorClassValues(character).normal;

    character.equipment = { Head: "Bracers of Armor +8" };
    expect(getArmorClassValues(character).normal).toBe(baseArmorClass);

    character.equipment = { Arms: "Bracers of Armor +8" };
    expect(getArmorClassValues(character).normal).toBe(baseArmorClass + 8);

    character.equipment = { Arms: "Bracers of Armor +8", Armor: "Chain Shirt" };
    expect(getArmorClassValues(character).normal).toBe(baseArmorClass + 8);

    character.equipment = { Arms: "Bracers of Armor +8", Armor: "+2 Full Plate (Medium)" };
    const withHigherArmor = getArmorClassValues(character).normal;
    character.equipment = { Armor: "+2 Full Plate (Medium)" };
    const withoutBracers = getArmorClassValues(character).normal;
    expect(withHigherArmor).toBe(withoutBracers);

    character.equipment = { Armor: "Chain Shirt", Body: "Robe of the Archmagi" };
    expect(getArmorClassValues(character).components.armor).toBe(5);
  });

  it("stacks luck saving-throw bonuses with the highest resistance bonus", () => {
    const character = hero();
    character.equipment = {
      Shoulders: "Cloak of Resistance +2",
      Body: "Robe of Stars",
      Miscellaneous: "Stone of Good Luck",
    };
    expect(getSavingThrow(character, "fortitude").total).toBe(7);
    expect(getSavingThrow(character, "reflex").total).toBe(6);
    expect(getSavingThrow(character, "will").total).toBe(4);
    expect(getEquipmentDefenseBonuses(character).luck.bonus).toBe(1);
    expect(getSavingThrow(character, "will").title).toContain("+1 luck");
  });

  it("applies the Robe of the Archmagi resistance bonus and stacks luck bonuses", () => {
    const character = hero();
    character.equipment = {
      Shoulders: "Cloak of Resistance +2",
      Body: "Robe of the Archmagi",
      Miscellaneous: "Stone of Good Luck",
    };
    expect(getEquipmentDefenseBonuses(character).resistance.bonus).toBe(4);
    expect(getSavingThrow(character, "fortitude").total).toBe(9);
    expect(getSavingThrow(character, "will").total).toBe(6);
  });

  it.each([1, 2, 3, 4, 5])("adds +%s resistance to each save without changing base or abilities", (bonus) => {
    const character = hero();
    character.equipment.Shoulders = `Cloak of Resistance +${bonus}`;
    expect(getSavingThrow(character, "fortitude").total).toBe(4 + bonus);
    expect(getSavingThrow(character, "reflex").total).toBe(3 + bonus);
    expect(getSavingThrow(character, "will").total).toBe(1 + bonus);
    expect(getSavingThrow(character, "will").title).toContain(`Cloak of Resistance +${bonus}`);
    expect(character.abilities).toEqual(hero().abilities);
  });

  it("ignores inventory-only, wrongly slotted, deceptive and custom item names", () => {
    const character = hero();
    character.inventory = { "Ring of Protection +5": 1, "Cloak of Resistance +5": 1, "Amulet of Natural Armor +5": 1 };
    character.equipment = {
      Miscellaneous: "Ring of Protection +5", Head: "Cloak of Resistance +5",
      "Rings 1": "Broken Ring of Protection +3", "Rings 2": "Ring of Protection +30",
      Shoulders: "Cloak of Resistance +2 replica", Neck: "Amulet of Natural Armor +3 replica",
    };
    expect(getArmorClassValues(character)).toMatchObject({ normal: 13, touch: 13, flatFooted: 10 });
    expect(getSavingThrow(character, "will").total).toBe(1);
    const name = "Cloak of Resistance +4 replica";
    addCustomStoreItems([{ name, category: "Shoulders", price: 1, weight: "1 lb.", custom: true }]);
    try {
      character.equipment.Shoulders = name;
      expect(getEquipmentDefenseBonuses(character).resistance.bonus).toBe(0);
    } finally {
      deleteCustomStoreItem(name);
    }
  });

  it.each([
    ["Ring of Protection +1", "Rings 1"],
    ["Cloak of Resistance +1", "Shoulders"],
    ["Amulet of Natural Armor +1", "Neck"],
  ])("equips %s through the inventory workflow into %s", (name, slot) => {
    const update = vi.fn();
    equipInventoryItem(hero(), name, update);
    expect(update).toHaveBeenCalledWith({ [slot]: name });
  });

  it("equips items into all twelve worn-item slots without replacing other slots", () => {
    const torsoItem = {
      name: "Test Torso Item",
      category: "Torso" as const,
      price: 1,
      weight: "—",
      custom: true,
    };
    addCustomStoreItems([torsoItem]);
    try {
      const character = hero();
      character.equipment = {};
      const expected = [
        ["Headband of Intellect +2", "Head"],
        ["Goggles of Night", "Eyes"],
        ["Amulet of Natural Armor +1", "Neck"],
        ["Cloak of Resistance +1", "Shoulders"],
        ["Bracers of Armor +1", "Arms"],
        ["Gloves of Dexterity +2", "Hands"],
        ["Ring of Protection +1", "Rings 1"],
        ["Ring of Feather Falling", "Rings 2"],
        ["Robe of Useful Items", "Body"],
        ["Test Torso Item", "Torso"],
        ["Belt of Giant Strength +2", "Waist"],
        ["Boots of Elvenkind", "Feet"],
      ] as const;

      for (const [name] of expected) {
        equipInventoryItem(character, name, (equipment) => {
          character.equipment = equipment;
        });
      }

      expect(character.equipment).toEqual(Object.fromEntries(expected.map(([name, slot]) => [slot, name])));
    } finally {
      deleteCustomStoreItem(torsoItem.name);
    }
  });

  it.each(["Pearl of Power (1st)", "Necklace of Fireballs I"])(
    "keeps slotless wondrous item %s out of worn slots",
    (name) => {
      const character = hero();
      character.equipment = {};
      const update = vi.fn();

      equipInventoryItem(character, name, update);

      expect(update).toHaveBeenCalledWith({ Miscellaneous: name });
    },
  );

  it("does not silently replace an occupied miscellaneous slot", () => {
    const character = hero();
    character.equipment = { Miscellaneous: "Pearl of Power (1st)" };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const update = vi.fn();

    equipInventoryItem(character, "Bag of Holding", update);

    expect(confirm).toHaveBeenCalledWith(
      "Miscellaneous is occupied by Pearl of Power (1st). Replace it with Bag of Holding?",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("does not replace either ring when both ring slots are occupied", () => {
    const character = hero();
    character.equipment = {
      "Rings 1": "Ring of Protection +1",
      "Rings 2": "Ring of Feather Falling",
    };
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const update = vi.fn();

    equipInventoryItem(character, "Ring of Acid Resistance", update);

    expect(alert).toHaveBeenCalledWith(
      "Both ring slots are occupied. Unequip a ring before equipping another.",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates both AC surfaces and save breakdowns, persists equipment without derived totals, and removes bonuses on unequip", async () => {
    const character = hero();
    character.equipment = { "Rings 1": "Ring of Protection +2", "Rings 2": "Ring of Protection +1",
      Shoulders: "Cloak of Resistance +3", Neck: "Amulet of Natural Armor +1" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    const armorClassLabel = await screen.findByText("Armor Class", { selector: ".stat > small" });
    const defenses = armorClassLabel.parentElement!;
    expect(within(defenses).getByRole("strong").textContent).toBe("16");
    expect(defenses.title).toContain("Ring of Protection +2");
    expect(defenses.title).toContain("does not stack");
    expect(screen.getByText("Touch 15")).toBeDefined();
    expect(screen.getByText("Flat-footed 13")).toBeDefined();
    const will = screen.getByText("Will", { selector: ".stat > small" }).parentElement!;
    expect(within(will).getByRole("strong").textContent).toBe("+4");
    expect(will.title).toContain("Cloak of Resistance +3");
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    expect(screen.getByRole("textbox", { name: "Eyes equipment" })).toBeDefined();
    expect(screen.getByRole("textbox", { name: "Body equipment" })).toBeDefined();
    expect(screen.getByRole("textbox", { name: "Torso equipment" })).toBeDefined();
    expect(screen.getByText("Touch 15")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Neck equipment" }), { target: { value: "" } });
    expect(screen.getByText("Flat-footed 12")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Shoulders equipment" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    const updatedWill = screen.getByText("Will", { selector: ".stat > small" }).parentElement!;
    expect(within(updatedWill).getByRole("strong").textContent).toBe("+1");
    expect(updatedWill.title).not.toContain("Cloak of Resistance");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = loadSavedCharacter().character;
    expect(saved).toEqual({ ...character, equipment: { ...character.equipment, Neck: "", Shoulders: "" } });
    view.unmount();
    render(<App />);
    expect(screen.getByText("Flat-footed 12")).toBeDefined();
  });

  it("toggles the Ring of Force Shield, saves its activation, and clears it when unequipped", async () => {
    const character = hero();
    character.equipment = { "Rings 1": "Ring of Force Shield" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);

    const armorClassLabel = await screen.findByText("Armor Class", { selector: ".stat > small" });
    const defenses = armorClassLabel.parentElement!;
    expect(within(defenses).getByRole("strong").textContent).toBe("13");
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    const activate = await screen.findByRole<HTMLInputElement>("checkbox", { name: "Activate Ring of Force Shield" });
    expect(activate.checked).toBe(false);
    fireEvent.click(activate);
    expect(activate.checked).toBe(true);
    const updatedArmorClass = screen.getByText("Armor Class", { selector: ".stat > small" }).parentElement!;
    expect(within(updatedArmorClass).getByRole("strong").textContent).toBe("15");
    expect(screen.getByText("Touch 13")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character.forceShieldActive).toBe(true);

    fireEvent.change(screen.getByRole("textbox", { name: "Rings 1 equipment" }), { target: { value: "" } });
    expect(screen.queryByRole("checkbox", { name: "Activate Ring of Force Shield" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(loadSavedCharacter().character.forceShieldActive).toBe(false);
  });

  it("previews item changes in level-up drafts without altering the original character", async () => {
    const character = hero();
    character.equipment = { "Rings 1": "Ring of Protection +2", Shoulders: "Cloak of Resistance +1" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await screen.findByRole("button", { name: "Equipment" });
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Rings 1 equipment" }), { target: { value: "" } });
    expect(screen.getByText("Touch 13")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByText("Touch 15")).toBeDefined();
    expect(loadSavedCharacter().character).toEqual(character);
  });

  it("prints defensive item bonuses in AC and saving-throw totals", () => {
    const character = hero();
    character.equipment = {
      Armor: "Chain Shirt",
      Arms: "Bracers of Armor +8",
      Shield: "Heavy Steel Shield",
      "Rings 1": "Ring of Force Shield",
      "Rings 2": "Ring of Protection +2",
      Neck: "Amulet of Natural Armor +1",
      Miscellaneous: "Ioun Stone, Dusty Rose Prism",
      Shoulders: "Cloak of Resistance +2",
    };
    character.forceShieldActive = true;
    render(<PrintableCharacterSheet character={character} />);
    const pageOne = screen.getByRole("region", { name: "Character record sheet, page 1" });
    const acFields = [...(pageOne.querySelectorAll(".reference-ac-components .print-field") ?? [])];
    const acValue = (label: string) => acFields.find((field) =>
      field.querySelector(".print-field-label")?.textContent === label,
    )?.querySelector(".print-field-value")?.textContent;
    expect(acValue("Armor")).toBe("8");
    expect(acValue("Shield")).toBe("2");
    expect(acValue("Insight")).toBe("1");
    expect(pageOne.querySelector(".reference-vitals")?.textContent).toContain("27");
    const saveRows = [...(pageOne.querySelectorAll(".reference-saves tbody tr") ?? [])];
    expect(saveRows.map((row) => row.textContent)).toEqual([
      "Fort6222",
      "Ref5032",
      "Will3012",
    ]);
  });
});
