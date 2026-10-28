import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { deleteCustomStoreItem, findStoreItem } from "../src/data/equipmentCatalog";
import { loadSpellCatalog } from "../src/data/spellCatalog";
import { loadSavedCharacter, savedCharacterSetupDraftStorageKey, savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";

function savedHero() {
  const character = cloneCharacter(initialCharacter);
  character.name = "Regression Hero";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
  return character;
}

describe("application workflows", () => {
  it.each([false, true])("preserves free-form age and weight in setup/finalized mode (saved: %s)", (saved) => {
    if (saved) savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Age:" : "Age" }), { target: { value: "about 30" } });
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Weight:" : "Weight" }), { target: { value: "82.5 kg" } });
    expect(screen.queryByRole("button", { name: /(?:Increase|Decrease) (?:age|weight)/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const character = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(character.age).toBe("about 30");
    expect(character.weight).toBe("82.5 kg");
    view.unmount();
    render(<App />);
    const savedFieldLabel = saved ? "Age:" : "Age";
    const savedWeightLabel = saved ? "Weight:" : "Weight";
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: savedFieldLabel }).value).toBe("about 30");
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: savedWeightLabel }).value).toBe("82.5 kg");
    fireEvent.change(screen.getByRole("textbox", { name: savedFieldLabel }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("textbox", { name: savedWeightLabel }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const cleared = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(cleared.age).toBe("");
    expect(cleared.weight).toBe("");
  });

  it.each(["5 ft 7 in", "170 cm"])("accepts and saves height as one text field: %s", (height) => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    const field = screen.getByRole("textbox", { name: "Height" });
    fireEvent.change(field, { target: { value: height } });
    expect(screen.queryByRole("textbox", { name: "Height in feet" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(saved.height).toBe(height);
    expect(screen.getByText(height, { exact: true })).toBeDefined();
  });

  it("edits finalized height without converting the entered units", () => {
    savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Height:" }), { target: { value: "180 cm" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).height).toBe("180 cm");
    expect(screen.queryByRole("button", { name: "Increase height" })).toBeNull();
  });

  it("opens setup for new characters and has no print or PDF controls", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    expect(screen.queryByPlaceholderText("Background, goals, allies, and other details.")).toBeNull();
    expect(screen.getByRole("heading", { name: "Character Notes" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /print|pdf/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export" })).toBeDefined();
    expect(screen.getByLabelText("Import character JSON")).toBeDefined();
  });

  it("reopens a saved setup draft in editable creation mode", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    const view = render(<App />);
    fireEvent.change(screen.getAllByRole("textbox", { name: "Character name" })[0], {
      target: { value: "Saved Setup Draft" },
    });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenCalledWith("Character saved.");

    view.unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    expect(screen.getAllByRole<HTMLInputElement>("textbox", { name: "Character name" })[0].value)
      .toBe("Saved Setup Draft");
    expect(screen.getByRole("button", { name: "Finalize Character" }).hasAttribute("disabled"))
      .toBe(true);
  });

  it("preserves existing characters, lazy screens, and level-up cancellation", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    render(<App />);
    const tabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(tabs.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(tabs.getByRole("button", { name: "Forge" }));
    await screen.findByRole("heading", { name: "Forge" });
    await user.click(tabs.getByRole("button", { name: "Wands & Scrolls" }));
    await screen.findByRole("heading", { name: /Wands.*Scrolls/ });
    await user.click(tabs.getByRole("button", { name: "Character" }));
    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    expect(screen.getByText("Level-Up Draft")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.queryByText("Level-Up Draft")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(original);
  });

  it("keeps an unconfirmed level-up out of save and export", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));

    const save = screen.getByRole("button", { name: "Save" });
    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(save.hasAttribute("disabled")).toBe(true);
    expect(exportButton.hasAttribute("disabled")).toBe(true);
    await user.click(save);
    await user.click(exportButton);
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(original);
  });

  it("creates, advances, saves, exports, and reimports a core fighter", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);

    await user.clear(screen.getAllByRole("textbox", { name: "Character name" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Character name" })[0], "Audit Fighter");
    await user.clear(screen.getAllByRole("textbox", { name: "Player" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Player" })[0], "Audit Player");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Strength/ }), "13");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Constitution/ }), "14");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Intelligence/ }), "12");

    for (const skill of ["Climb", "Craft", "Handle Animal", "Intimidate"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 4; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    await chooseFeat("General feat (level 1)", "Toughness");
    await chooseFeat("Human bonus feat", "Improved Initiative");
    await chooseFeat("Fighter bonus feat (fighter level 1)", "Power Attack");

    const tabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(screen.getAllByRole("button", { name: "Choose an item..." })[0]);
    await user.click(
      within(screen.getByRole("listbox", { name: "Equipment choices" })).getByRole(
        "option",
        { name: /^Longsword —/ },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Purchase Longsword" }));
    await user.click(screen.getByRole("button", { name: "Equip" }));
    await user.click(tabs.getByRole("button", { name: "Character" }));

    const finalize = screen.getByRole("button", { name: "Finalize Character" });
    expect(finalize.hasAttribute("disabled")).toBe(false);
    await user.click(finalize);
    expect(screen.getByRole("heading", { name: "Audit Fighter (Audit Player)" })).toBeDefined();
    expect(screen.getByText("12 / 12", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (16/16)", { exact: true })).toBeDefined();
    expect(screen.getByText("Attack +2", { exact: true })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    for (const skill of ["Climb", "Craft", "Handle Animal", "Intimidate"]) {
      await user.click(
        within(screen.getByRole("group", { name: `${skill} skill` })).getByRole(
          "button",
          { name: `Add rank to ${skill}` },
        ),
      );
    }
    await chooseFeat("Fighter bonus feat (fighter level 2)", "Cleave");
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    random.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));

    expect(screen.getByText("24 / 24", { exact: true })).toBeDefined();
    expect(screen.getByText("Attack +3", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (20/20)", { exact: true })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenCalledWith("Character saved.");
    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      name: "Audit Fighter",
      player: "Audit Player",
      race: "Human",
      abilities: { str: 13, con: 14, int: 12 },
      classLevels: [{ classId: "fighter", level: 2 }],
      hitPoints: 24,
      featSelections: {
        "general-1": "toughness",
        "human-1": "improved-initiative",
        "fighter-1": "power-attack",
        "fighter-2": "cleave",
      },
      inventory: { "Longsword (Medium)": 1 },
      equipment: { "Main Weapon": "Longsword (Medium)" },
      skills: { Climb: 5, Craft: 5, "Handle Animal": 5, Intimidate: 5 },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:audit-fighter";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No character JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });

    view.unmount();
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "audit-fighter.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("heading", { name: "Audit Fighter (Audit Player)" });
    expect(
      parseCharacter(
        JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
      ),
    ).toMatchObject({
      classLevels: [{ classId: "fighter", level: 2 }],
      hitPoints: 24,
      skills: { Climb: 5, Craft: 5, "Handle Animal": 5, Intimidate: 5 },
    });
    importedView.unmount();
  });

  it("awards the level-three feat and level-four ability increase through level-up", async () => {
    const original = savedHero();
    original.name = "Milestone Fighter";
    original.player = "Milestone Player";
    original.abilities = { ...original.abilities, str: 13, con: 13, int: 12 };
    original.classLevels = [{ classId: "fighter", level: 2 }];
    original.hitPoints = 22;
    original.skills = {
      Climb: 5,
      Craft: 5,
      "Handle Animal": 5,
      Intimidate: 5,
    };
    original.skillRanksByClass = {
      fighter: {
        Climb: 5,
        Craft: 5,
        "Handle Animal": 5,
        Intimidate: 5,
      },
    };
    original.feats = ["Toughness", "Improved Initiative", "Power Attack", "Cleave"];
    original.featSelections = {
      "general-1": "toughness",
      "human-1": "improved-initiative",
      "fighter-1": "power-attack",
      "fighter-2": "cleave",
    };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));

    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    const addFighterSkillRanks = async () => {
      for (const skill of ["Climb", "Craft", "Handle Animal", "Intimidate"]) {
        const row = within(screen.getByRole("group", { name: `${skill} skill` }));
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
      }
    };

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "fighter");
    await addFighterSkillRanks();
    await chooseFeat("General feat (level 3)", "Endurance");
    expect(screen.getByRole("button", { name: "Confirm Level-Up" }).hasAttribute("disabled"))
      .toBe(true);
    const thirdLevelRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    thirdLevelRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    expect(screen.getByText("33 / 33", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (24/24)", { exact: true })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "fighter");
    const abilityIncrease = screen.getByRole("combobox", {
      name: /Ability score increase at level 4/,
    });
    expect(screen.getByRole("button", { name: "Confirm Level-Up" }).hasAttribute("disabled"))
      .toBe(true);
    await user.selectOptions(abilityIncrease, "con");
    await addFighterSkillRanks();
    await chooseFeat("Fighter bonus feat (fighter level 4)", "Blind-Fight");
    const fourthLevelRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    fourthLevelRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));

    expect(screen.getByText("48 / 48", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (28/28)", { exact: true })).toBeDefined();
    const constitution = screen.getByText("CON").parentElement;
    if (!constitution) throw new Error("Missing Constitution score summary.");
    expect(within(constitution).getByText("14", { exact: true })).toBeDefined();
    expect(within(constitution).getByText("+2", { exact: true })).toBeDefined();
    const fortitude = screen.getByText("Fortitude", { selector: ".stat > small" }).parentElement;
    if (!fortitude) throw new Error("Missing Fortitude save summary.");
    expect(within(fortitude).getByRole("strong").textContent).toBe("+6");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      name: "Milestone Fighter",
      player: "Milestone Player",
      classLevels: [{ classId: "fighter", level: 4 }],
      abilities: { str: 13, con: 14, int: 12 },
      hitPoints: 48,
      feats: ["toughness", "endurance", "improved-initiative", "power-attack", "cleave", "blind-fight"],
      featSelections: {
        "general-1": "toughness",
        "human-1": "improved-initiative",
        "fighter-1": "power-attack",
        "fighter-2": "cleave",
        "general-3": "endurance",
        "fighter-4": "blind-fight",
      },
      skills: {
        Climb: 7,
        Craft: 7,
        "Handle Animal": 7,
        Intimidate: 7,
      },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:milestone-fighter";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No milestone character JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(parseCharacter(JSON.parse(exportedJson))).toMatchObject({
      classLevels: [{ classId: "fighter", level: 4 }],
      abilities: { con: 14 },
      featSelections: {
        "general-3": "endurance",
        "fighter-4": "blind-fight",
      },
      hitPoints: 48,
    });

    view.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "milestone-fighter.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("heading", {
      name: "Milestone Fighter (Milestone Player)",
    })).toBeDefined();
    expect(screen.getByText("48 / 48", { exact: true })).toBeDefined();
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    importedView.unmount();
  });

  it("awards total-level milestones without granting fighter-only feats to a multiclass character", async () => {
    const original = savedHero();
    original.name = "Multiclass Milestone Hero";
    original.player = "Milestone Player";
    original.alignment = "Lawful Good";
    original.abilities = { ...original.abilities, str: 13, con: 13, int: 12 };
    original.classLevels = [
      { classId: "fighter", level: 1 },
      { classId: "paladin", level: 1 },
    ];
    original.hitPoints = 22;
    original.skills = {
      Climb: 4,
      Craft: 4,
      "Handle Animal": 4,
      Intimidate: 4,
      Diplomacy: 1,
      Heal: 1,
      "Knowledge (nobility and royalty)": 1,
      "Sense Motive": 1,
    };
    original.skillRanksByClass = {
      fighter: {
        Climb: 4,
        Craft: 4,
        "Handle Animal": 4,
        Intimidate: 4,
      },
      paladin: {
        Diplomacy: 1,
        Heal: 1,
        "Knowledge (nobility and royalty)": 1,
        "Sense Motive": 1,
      },
    };
    original.feats = ["Toughness", "Improved Initiative", "Power Attack"];
    original.featSelections = {
      "general-1": "toughness",
      "human-1": "improved-initiative",
      "fighter-1": "power-attack",
    };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    expect(loadSavedCharacter()).toMatchObject({
      saved: true,
      setupDraft: false,
      character: { classLevels: original.classLevels },
    });

    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    const addPaladinSkillRanks = async () => {
      for (const skill of [
        "Diplomacy",
        "Heal",
        "Knowledge (nobility and royalty)",
        "Sense Motive",
      ]) {
        const row = within(screen.getByRole("group", { name: `${skill} skill` }));
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
      }
    };

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "paladin");
    await user.click(
      within(await screen.findByRole("navigation", { name: "Character sheets" })).getByRole(
        "button",
        { name: "Character" },
      ),
    );
    expect(screen.getByRole("button", { name: "General feat (level 3)" })).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Fighter bonus feat (fighter level 2)" }),
    ).toBeNull();
    await addPaladinSkillRanks();
    await chooseFeat("General feat (level 3)", "Endurance");
    const thirdLevelRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    thirdLevelRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    expect(screen.getByText("33 / 33", { exact: true })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "paladin");
    await user.click(
      within(await screen.findByRole("navigation", { name: "Character sheets" })).getByRole(
        "button",
        { name: "Character" },
      ),
    );
    expect(
      screen.getByRole("combobox", { name: /Ability score increase at level 4/ }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "General feat (level 4)" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Fighter bonus feat (fighter level 2)" }),
    ).toBeNull();
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Ability score increase at level 4/ }),
      "str",
    );
    await addPaladinSkillRanks();
    const fourthLevelRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    fourthLevelRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));

    expect(screen.getByText("44 / 44", { exact: true })).toBeDefined();
    const strength = screen.getByText("STR").parentElement;
    if (!strength) throw new Error("Missing Strength score summary.");
    expect(within(strength).getByText("14", { exact: true })).toBeDefined();
    expect(within(strength).getByText("+2", { exact: true })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");

    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      classLevels: [
        { classId: "fighter", level: 1 },
        { classId: "paladin", level: 3 },
      ],
      abilities: { str: 14, con: 13, int: 12 },
      hitPoints: 44,
      featSelections: {
        "general-1": "toughness",
        "human-1": "improved-initiative",
        "fighter-1": "power-attack",
        "general-3": "endurance",
      },
      skills: {
        Climb: 4,
        Craft: 4,
        "Handle Animal": 4,
        Intimidate: 4,
        Diplomacy: 3,
        Heal: 3,
        "Knowledge (nobility and royalty)": 3,
        "Sense Motive": 3,
      },
      skillRanksByClass: {
        fighter: {
          Climb: 4,
          Craft: 4,
          "Handle Animal": 4,
          Intimidate: 4,
        },
        paladin: {
          Diplomacy: 3,
          Heal: 3,
          "Knowledge (nobility and royalty)": 3,
          "Sense Motive": 3,
        },
      },
    });
  });

  it("adds a Rogue level to a Fighter and preserves multiclass skills and HP", async () => {
    const original = savedHero();
    original.name = "Multiclass Hero";
    original.abilities = { ...original.abilities, str: 13, con: 14, int: 12 };
    original.hitPoints = 12;
    original.skills = {
      Climb: 4,
      Craft: 4,
      "Handle Animal": 4,
      Intimidate: 4,
    };
    original.skillRanksByClass = {
      fighter: {
        Climb: 4,
        Craft: 4,
        "Handle Animal": 4,
        Intimidate: 4,
      },
    };
    original.feats = ["Toughness", "Improved Initiative", "Power Attack"];
    original.featSelections = {
      "general-1": "toughness",
      "human-1": "improved-initiative",
      "fighter-1": "power-attack",
    };
    original.inventory = { "Longsword (Medium)": 1 };
    original.equipment = { "Main Weapon": "Longsword (Medium)" };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));

    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "rogue");
    expect(screen.getByText("Skills (16/26)", { exact: true })).toBeDefined();
    expect(screen.getByRole("button", { name: "Confirm Level-Up" }).hasAttribute("disabled"))
      .toBe(true);

    for (const skill of ["Disable Device", "Open Lock"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 5; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }
    expect(screen.getByText("Skills (26/26)", { exact: true })).toBeDefined();
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    random.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));

    expect(screen.getByText("20 / 20", { exact: true })).toBeDefined();
    expect(screen.getByText("Attack +2", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (26/26)", { exact: true })).toBeDefined();
    const reflex = screen.getByText("Reflex", { selector: ".stat > small" }).parentElement;
    if (!reflex) throw new Error("Missing Reflex save summary.");
    expect(within(reflex).getByRole("strong").textContent).toBe("+2");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");

    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      classLevels: [
        { classId: "fighter", level: 1 },
        { classId: "rogue", level: 1 },
      ],
      hitPoints: 20,
      skills: {
        Climb: 4,
        Craft: 4,
        "Handle Animal": 4,
        Intimidate: 4,
        "Disable Device": 5,
        "Open Lock": 5,
      },
      skillRanksByClass: {
        fighter: {
          Climb: 4,
          Craft: 4,
          "Handle Animal": 4,
          Intimidate: 4,
        },
        rogue: { "Disable Device": 5, "Open Lock": 5 },
      },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:multiclass-hero";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No multiclass JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(parseCharacter(JSON.parse(exportedJson))).toMatchObject({
      classLevels: [
        { classId: "fighter", level: 1 },
        { classId: "rogue", level: 1 },
      ],
      skillRanksByClass: {
        rogue: { "Disable Device": 5, "Open Lock": 5 },
      },
    });

    view.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "multiclass-hero.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("heading", { name: "Multiclass Hero (Player)" })).toBeDefined();
    expect(screen.getByText("20 / 20", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (26/26)", { exact: true })).toBeDefined();
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    importedView.unmount();
  });

  it("advances Wizard spells only when the Wizard class level increases", async () => {
    const original = savedHero();
    original.name = "Multiclass Wizard";
    original.player = "Spellcasting Player";
    original.abilities = { ...original.abilities, int: 11, con: 12 };
    original.classLevels = [{ classId: "wizard", level: 1 }];
    original.hitPoints = 5;
    original.skills = {
      Concentration: 4,
      "Knowledge (arcana)": 4,
      Spellcraft: 4,
    };
    original.skillRanksByClass = {
      wizard: {
        Concentration: 4,
        "Knowledge (arcana)": 4,
        Spellcraft: 4,
      },
    };
    original.feats = ["Toughness", "Improved Initiative"];
    original.featSelections = {
      "general-1": "toughness",
      "human-1": "improved-initiative",
    };
    const startingWizardSpells = ["Mage Armor", "Magic Missile", "Shield"];
    original.knownSpells = [...startingWizardSpells];
    original.knownSpellsByClass = { wizard: [...startingWizardSpells] };
    original.spellAcquisitionByClass = {
      wizard: Object.fromEntries(startingWizardSpells.map((spell) => [spell, "starting"])),
    };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));

    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "fighter");
    for (const skill of ["Climb", "Jump", "Ride"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }
    await chooseFeat("Fighter bonus feat (fighter level 1)", "Blind-Fight");
    const fighterRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    fighterRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    const afterFighterLevel = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(afterFighterLevel).toMatchObject({
      classLevels: [
        { classId: "wizard", level: 1 },
        { classId: "fighter", level: 1 },
      ],
      knownSpellsByClass: { wizard: startingWizardSpells },
    });

    const tabs = within(await screen.findByRole("navigation", { name: "Character sheets" }));
    await user.click(tabs.getByRole("button", { name: "Spells" }));
    await screen.findByLabelText("Spellcasting Class and Level");
    expect(screen.getByLabelText<HTMLInputElement>("Spellcasting Class and Level").value)
      .toBe("Wizard 1");
    const firstCasterLevel = screen.getByText("Caster Level", {
      selector: ".stat > small",
    }).parentElement;
    if (!firstCasterLevel) throw new Error("Missing Wizard caster-level summary.");
    expect(within(firstCasterLevel).getByRole("strong").textContent).toBe("1");
    for (const spell of startingWizardSpells)
      expect(screen.getByText(spell, { exact: true })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "wizard");
    const freeSpellChoices = screen.getByLabelText<HTMLSelectElement>("Free wizard spell");
    const newSpells = [...freeSpellChoices.options]
      .map((option) => option.value)
      .filter(Boolean)
      .slice(0, 2);
    expect(newSpells).toHaveLength(2);
    for (const spell of newSpells) {
      await user.selectOptions(
        screen.getByLabelText("Free wizard spell"),
        spell,
      );
      await user.click(screen.getByRole("button", { name: "Add free spell" }));
    }
    expect(screen.getByText(/Free level-up spells: 2\/2/)).toBeDefined();

    const characterTabs = within(await screen.findByRole("navigation", {
      name: "Character sheets",
    }));
    await user.click(characterTabs.getByRole("button", { name: "Character" }));
    for (const skill of ["Concentration", "Knowledge (arcana)", "Spellcraft"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }
    await chooseFeat("General feat (level 3)", "Endurance");
    const wizardRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Roll Hit Points" }));
    wizardRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));

    await user.click(
      within(await screen.findByRole("navigation", { name: "Character sheets" })).getByRole(
        "button",
        { name: "Spells" },
      ),
    );
    expect(screen.getByLabelText<HTMLInputElement>("Spellcasting Class and Level").value)
      .toBe("Wizard 2");
    const secondCasterLevel = screen.getByText("Caster Level", {
      selector: ".stat > small",
    }).parentElement;
    if (!secondCasterLevel) throw new Error("Missing Wizard caster-level summary.");
    expect(within(secondCasterLevel).getByRole("strong").textContent).toBe("2");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      classLevels: [
        { classId: "wizard", level: 2 },
        { classId: "fighter", level: 1 },
      ],
      hitPoints: 21,
      knownSpellsByClass: {
        wizard: expect.arrayContaining([...startingWizardSpells, ...newSpells]),
      },
      spellAcquisitionByClass: {
        wizard: Object.fromEntries(newSpells.map((spell) => [spell, "level-up"])),
      },
      featSelections: {
        "fighter-1": "blind-fight",
        "general-3": "endurance",
      },
    });
  });

  it("creates, resumes, finalizes, exports, and imports a wizard with spellbook choices", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);

    await user.click(screen.getByRole("button", { name: "Class" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Class choices" })).getByRole(
        "option",
        { name: "Wizard" },
      ),
    );
    const tabs = within(await screen.findByRole("navigation", { name: "Character sheets" }));
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Neutral Good" },
      ),
    );
    await user.clear(screen.getAllByRole("textbox", { name: "Character name" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Character name" })[0], "Audit Wizard");
    await user.clear(screen.getAllByRole("textbox", { name: "Player" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Player" })[0], "Audit Player");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Intelligence/ }), "11");

    for (const skill of ["Concentration", "Knowledge (arcana)", "Spellcraft"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 4; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    await chooseFeat("General feat (level 1)", "Toughness");
    await chooseFeat("Human bonus feat", "Improved Initiative");

    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(screen.getAllByRole("button", { name: "Choose an item..." })[0]);
    await user.click(
      within(screen.getByRole("listbox", { name: "Equipment choices" })).getByRole(
        "option",
        { name: /^Dagger —/ },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Purchase Dagger" }));

    await user.click(tabs.getByRole("button", { name: "Spells" }));
    await user.click(await screen.findByRole("button", { name: "Add starting cantrips" }));
    const freeSpell = screen.getByLabelText("Free wizard spell");
    for (const spell of ["Mage Armor", "Magic Missile", "Shield"]) {
      await user.selectOptions(freeSpell, spell);
      await user.click(screen.getByRole("button", { name: "Add free spell" }));
    }
    expect(screen.getByText(/Free starting spells: 3\/3/)).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    view.unmount();

    const resumedView = render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    expect(screen.getAllByRole<HTMLInputElement>("textbox", { name: "Character name" })[0].value)
      .toBe("Audit Wizard");
    const resumedTabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(resumedTabs.getByRole("button", { name: "Spells" }));
    expect(await screen.findByText("Detect Magic", { exact: true })).toBeDefined();
    expect(screen.getByText("Mage Armor", { exact: true })).toBeDefined();
    expect(screen.getByText(/Free starting spells: 3\/3/)).toBeDefined();
    await user.click(resumedTabs.getByRole("button", { name: "Character" }));

    const finalize = screen.getByRole("button", { name: "Finalize Character" });
    expect(finalize.hasAttribute("disabled")).toBe(false);
    await user.click(finalize);
    expect(screen.getByRole("heading", { name: "Audit Wizard (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));
    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      race: "Human",
      classLevels: [{ classId: "wizard", level: 1 }],
      knownSpellsByClass: {
        wizard: expect.arrayContaining(["Detect Magic", "Mage Armor", "Magic Missile", "Shield"]),
      },
      spellAcquisitionByClass: {
        wizard: {
          "Mage Armor": "starting",
          "Magic Missile": "starting",
          Shield: "starting",
        },
      },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:audit-wizard";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No wizard JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(parseCharacter(JSON.parse(exportedJson)).knownSpellsByClass?.wizard)
      .toEqual(saved.knownSpellsByClass?.wizard);

    resumedView.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "audit-wizard.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("heading", { name: "Audit Wizard (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Spells" }));
    expect(await screen.findByText("Detect Magic", { exact: true })).toBeDefined();
    expect(screen.getByText("Mage Armor", { exact: true })).toBeDefined();
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    importedView.unmount();
  });

  it("creates, resumes, finalizes, exports, and imports a cleric with deity and domain choices", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);

    await user.click(screen.getByRole("button", { name: "Class" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Class choices" })).getByRole(
        "option",
        { name: "Cleric" },
      ),
    );
    const tabs = within(await screen.findByRole("navigation", { name: "Character sheets" }));
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Neutral Good" },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Deity" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Deity choices" })).getByRole(
        "option",
        { name: /^Pelor/ },
      ),
    );

    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Lawful Evil" },
      ),
    );
    expect(screen.getByText("Cleric alignment must be within one step of Pelor.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Finalize Character" }).hasAttribute("disabled"))
      .toBe(true);
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Neutral Good" },
      ),
    );
    expect(screen.queryByText("Cleric alignment must be within one step of Pelor.")).toBeNull();

    await user.clear(screen.getAllByRole("textbox", { name: "Character name" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Character name" })[0], "Audit Cleric");
    await user.clear(screen.getAllByRole("textbox", { name: "Player" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Player" })[0], "Audit Player");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Wisdom/ }), "11");

    for (const skill of ["Concentration", "Heal", "Knowledge (religion)"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 4; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    await chooseFeat("General feat (level 1)", "Toughness");
    await chooseFeat("Human bonus feat", "Improved Initiative");

    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(screen.getAllByRole("button", { name: "Choose an item..." })[0]);
    await user.click(
      within(screen.getByRole("listbox", { name: "Equipment choices" })).getByRole(
        "option",
        { name: /^Dagger —/ },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Purchase Dagger" }));

    await user.click(tabs.getByRole("button", { name: "Spells" }));
    await screen.findByRole("heading", { name: "Cleric Domains" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Domain 1" }), "good");
    await user.selectOptions(screen.getByRole("combobox", { name: "Domain 2" }), "healing");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Level 1 domain spell" }),
      "healing:Cure Light Wounds",
    );
    for (const spell of ["Detect Magic", "Guidance", "Light", "Bless"])
      fireEvent.change(screen.getByRole("spinbutton", { name: `Prepare ${spell}` }), {
        target: { value: "1" },
      });

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    view.unmount();

    const resumedView = render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    const resumedTabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(resumedTabs.getByRole("button", { name: "Spells" }));
    expect((await screen.findByRole<HTMLSelectElement>("combobox", { name: "Domain 1" })).value)
      .toBe("good");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Domain 2" }).value)
      .toBe("healing");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Level 1 domain spell" }).value)
      .toBe("healing:Cure Light Wounds");
    await user.click(resumedTabs.getByRole("button", { name: "Character" }));
    const finalize = screen.getByRole("button", { name: "Finalize Character" });
    expect(finalize.hasAttribute("disabled")).toBe(false);
    await user.click(finalize);
    expect(screen.getByRole("heading", { name: "Audit Cleric (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      race: "Human",
      alignment: "Neutral Good",
      deity: "pelor",
      classLevels: [{ classId: "cleric", level: 1 }],
      clericDomains: ["good", "healing"],
      clericDomainPreparation: {
        "1": { domain: "healing", spell: "Cure Light Wounds" },
      },
      preparedSpellsByClass: {
        cleric: expect.arrayContaining(["Detect Magic", "Guidance", "Light", "Bless"]),
      },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:audit-cleric";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No cleric JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(parseCharacter(JSON.parse(exportedJson))).toMatchObject({
      deity: "pelor",
      clericDomains: ["good", "healing"],
      clericDomainPreparation: {
        "1": { domain: "healing", spell: "Cure Light Wounds" },
      },
    });

    resumedView.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "audit-cleric.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("heading", { name: "Audit Cleric (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Spells" }));
    expect((await screen.findByRole<HTMLSelectElement>("combobox", { name: "Domain 1" })).value)
      .toBe("good");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Domain 2" }).value)
      .toBe("healing");
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    importedView.unmount();
  });

  it("creates, resumes, finalizes, exports, and imports a Charisma-based sorcerer", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    await loadSpellCatalog();
    const view = render(<App />);

    await user.click(screen.getByRole("button", { name: "Class" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Class choices" })).getByRole(
        "option",
        { name: "Sorcerer" },
      ),
    );
    const tabs = within(await screen.findByRole("navigation", { name: "Character sheets" }));
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Neutral Good" },
      ),
    );
    await user.clear(screen.getAllByRole("textbox", { name: "Character name" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Character name" })[0], "Audit Sorcerer");
    await user.clear(screen.getAllByRole("textbox", { name: "Player" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Player" })[0], "Audit Player");
    await user.selectOptions(screen.getByRole("combobox", { name: /^Charisma/ }), "11");

    for (const skill of ["Concentration", "Knowledge (arcana)", "Spellcraft"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 4; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: feat },
        ),
      );
    };
    await chooseFeat("General feat (level 1)", "Toughness");
    await chooseFeat("Human bonus feat", "Improved Initiative");

    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(screen.getAllByRole("button", { name: "Choose an item..." })[0]);
    await user.click(
      within(screen.getByRole("listbox", { name: "Equipment choices" })).getByRole(
        "option",
        { name: /^Dagger —/ },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Purchase Dagger" }));

    await user.click(tabs.getByRole("button", { name: "Spells" }));
    expect((await screen.findByRole<HTMLInputElement>("textbox", { name: "Spellcasting Ability" })).value)
      .toBe("CHA 11");
    const chooseSpell = async (heading: string, spell: string) => {
      const section = screen.getByText(heading, { exact: true }).closest("section");
      if (!(section instanceof HTMLElement)) throw new Error(`Missing ${heading} spell section.`);
      await user.click(within(section).getAllByRole("button", { name: "Choose a spell" })[0]);
      await user.click(
        within(screen.getByRole("listbox", { name: "Spell choices" })).getByRole(
          "option",
          { name: new RegExp(`^${spell} \\(Level`) },
        ),
      );
    };
    for (const spell of ["Acid Splash", "Detect Magic", "Mage Hand", "Read Magic"])
      await chooseSpell("CANTRIPS", spell);
    for (const spell of ["Mage Armor", "Magic Missile"])
      await chooseSpell("LEVEL 1 SPELLS", spell);
    expect(screen.getByText("Known 4/4", { exact: true })).toBeDefined();
    expect(screen.getByText("Known 2/2", { exact: true })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    view.unmount();

    const resumedView = render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    const resumedTabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(resumedTabs.getByRole("button", { name: "Spells" }));
    expect((await screen.findByRole<HTMLInputElement>("textbox", { name: "Spellcasting Ability" })).value)
      .toBe("CHA 11");
    expect(screen.getByText("Acid Splash (Level 0)", { exact: true })).toBeDefined();
    expect(screen.getByText("Magic Missile (Level 1)", { exact: true })).toBeDefined();
    expect(screen.getByText("Known 4/4", { exact: true })).toBeDefined();
    expect(screen.getByText("Known 2/2", { exact: true })).toBeDefined();
    await user.click(resumedTabs.getByRole("button", { name: "Character" }));
    const finalize = screen.getByRole("button", { name: "Finalize Character" });
    expect(finalize.hasAttribute("disabled")).toBe(false);
    await user.click(finalize);
    expect(screen.getByRole("heading", { name: "Audit Sorcerer (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    );
    expect(saved).toMatchObject({
      race: "Human",
      alignment: "Neutral Good",
      abilities: { cha: 11 },
      classLevels: [{ classId: "sorcerer", level: 1 }],
      knownSpellsByClass: {
        sorcerer: expect.arrayContaining([
          "Acid Splash",
          "Detect Magic",
          "Mage Hand",
          "Read Magic",
          "Mage Armor",
          "Magic Missile",
        ]),
      },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:audit-sorcerer";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No sorcerer JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(parseCharacter(JSON.parse(exportedJson)).knownSpellsByClass?.sorcerer)
      .toEqual(saved.knownSpellsByClass?.sorcerer);

    resumedView.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "audit-sorcerer.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole("heading", { name: "Audit Sorcerer (Audit Player)" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Spells" }));
    expect((await screen.findByRole<HTMLInputElement>("textbox", { name: "Spellcasting Ability" })).value)
      .toBe("CHA 11");
    expect(screen.getByText("Acid Splash", { exact: true })).toBeDefined();
    expect(screen.getByText("Magic Missile", { exact: true })).toBeDefined();
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    importedView.unmount();
  });

  it("blocks a class level-up that conflicts with the character's alignment", async () => {
    const user = userEvent.setup();
    const character = savedHero();
    character.alignment = "Chaotic Good";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByLabelText("Class"), "paladin");
    expect(await screen.findByText(
      "Cannot take a Paladin level with Chaotic Good; this class must be Lawful Good.",
    )).toBeDefined();
  });

  it("shows spell sheets for a saved multiclass caster", async () => {
    const character = savedHero();
    character.classLevels = [{ classId: "wizard", level: 2 }, { classId: "cleric", level: 1 }];
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Spells" }));
    const wizardTab = await screen.findByRole("tab", { name: "Wizard · 2" });
    expect(wizardTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Cleric · 1" })).toBeDefined();
    expect(document.querySelectorAll(".spell-sheet")).toHaveLength(1);
    await user.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("spell-tab-cleric");
    expect(screen.getAllByRole("alert").every((alert) => alert.textContent?.startsWith("Choose two different cleric domains."))).toBe(true);
  });

  it("keeps custom-item dialogs usable after removing preview styles", async () => {
    const user = userEvent.setup();
    savedHero();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Store" }));
    await user.click(await screen.findByRole("button", { name: "Create Custom Item" }));
    const dialog = screen.getByRole("dialog", { name: "Create Custom Item" });
    expect(dialog.className).toBe("item-modal-modal");
    await user.type(within(dialog).getByLabelText("Name", { exact: true }), "UI Test Blade");
    await user.click(within(dialog).getByRole("button", { name: "Save to Store" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Custom Items List" }));
    const list = screen.getByRole("dialog", { name: "Custom Items List" });
    expect(within(list).getByText("Ui Test Blade", { exact: true })).toBeDefined();
    await user.click(within(list).getByRole("button", { name: /delete/i }));
    expect(within(list).queryByText("Ui Test Blade", { exact: true })).toBeNull();
  });

  it("saves the selected projectile Strength damage rule with a custom ranged weapon", async () => {
    const name = "Custom Test Projectile";
    const user = userEvent.setup();
    savedHero();
    render(<App />);
    try {
      await user.click(screen.getByRole("button", { name: "Store" }));
      await user.click(await screen.findByRole("button", { name: "Create Custom Item" }));
      const dialog = screen.getByRole("dialog", { name: "Create Custom Item" });
      await user.type(within(dialog).getByLabelText("Name", { exact: true }), name);
      await user.selectOptions(within(dialog).getByLabelText("Weapon mode"), "Ranged");
      await user.selectOptions(within(dialog).getByLabelText("Ranged Strength damage"), "strength");
      await user.selectOptions(within(dialog).getByLabelText("Weapon material"), "adamantine");
      await user.click(within(dialog).getByRole("button", { name: "Save to Store" }));
      expect(findStoreItem(name)).toMatchObject({
        ranged: true,
        thrown: false,
        rangedDamageAbility: "strength",
        material: "adamantine",
      });
    } finally {
      deleteCustomStoreItem(name);
    }
  });

  it("surfaces storage errors instead of displaying success", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    savedHero();
    render(<App />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Disk full"); });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toContain("Disk full");
    expect(alert).not.toHaveBeenCalled();
  });

  it("rejects an invalid import without replacing the current character", async () => {
    savedHero();
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File(["null"], "invalid.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => "null" });
    fireEvent.change(input, { target: { files: [file] } });
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to import");
    expect(screen.getByRole("heading", { name: "Regression Hero (Player)" })).toBeDefined();
  });

  it("keeps rolled assignments and derived character scores synchronized without an effect", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Race" }));
    fireEvent.click(
      within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
        "option",
        { name: "Dwarf" },
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Roll 4d6" }));
    let rolls = 0;
    vi.spyOn(Math, "random").mockImplementation(() => (5 - Math.floor(rolls++ / 4) + 0.1) / 6);
    fireEvent.click(screen.getByRole("button", { name: "Roll Abilities" }));
    fireEvent.change(screen.getByRole("combobox", { name: /^Strength/ }), { target: { value: "5" } });
    vi.spyOn(window, "alert").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(saved.abilities).toEqual({ str: 3, dex: 15, con: 14, int: 9, wis: 6, cha: 16 });
    expect(saved.hitPoints).toBe(12);
  });

  it("enforces point-buy costs on base scores and applies racial modifiers to final scores", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Race" }));
    fireEvent.click(
      within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
        "option",
        { name: "Dwarf" },
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Point Buy" }));

    fireEvent.change(screen.getByRole("combobox", { name: /^Charisma/ }), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Strength/ }), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Dexterity/ }), {
      target: { value: "14" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Constitution/ }), {
      target: { value: "13" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /^Intelligence/ }), {
      target: { value: "12" },
    });

    expect(screen.getByText("Points used: 25 / 25", { exact: true })).toBeDefined();
    const strength = screen.getByRole("combobox", { name: /^Strength/ });
    expect(within(strength).getByRole("option", { name: /^16/ }).hasAttribute("disabled"))
      .toBe(true);
    const constitution = screen.getByRole("combobox", { name: /^Constitution/ }).parentElement;
    if (!constitution) throw new Error("Missing Constitution creation control.");
    expect(within(constitution).getByText("15 (+2)", { exact: true })).toBeDefined();
    const charisma = screen.getByRole("combobox", { name: /^Charisma/ }).parentElement;
    if (!charisma) throw new Error("Missing Charisma creation control.");
    expect(within(charisma).getByText("6 (-2)", { exact: true })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    expect(parseCharacter(
      JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"),
    )).toMatchObject({
      race: "Dwarf",
      abilities: { str: 15, dex: 14, con: 15, int: 12, wis: 10, cha: 6 },
    });
  });

  it("imports and saves a 2.0 character with portable custom items", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const character = savedHero();
    const { container } = render(<App />);
    character.name = "Imported Hero";
    character.customItems = [{ custom: true, name: "Imported Blade", category: "Weapons", price: 10, weight: "2 lb." }];
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const json = JSON.stringify(character);
    const file = new File([json], "character.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("heading", { name: "Imported Hero (Player)" });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"))).toEqual(character);
  });

  it("exports portable JSON without using any PDF or preview path", async () => {
    savedHero();
    render(<App />);
    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:test-character";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(click).toHaveBeenCalledOnce();
    if (!exportedBlob) throw new Error("No character JSON was exported.");
    expect(exportedBlob.type).toBe("application/json");
    const blob = exportedBlob;
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    const character = parseCharacter(JSON.parse(contents));
    expect(character.name).toBe("Regression Hero");
    expect(character.customItems).toBeDefined();
    expect(TestURL.revokeObjectURL).toHaveBeenCalledWith("blob:test-character");
  });
});
