import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { PrintableCharacterSheet } from "../src/components/PrintableCharacterSheet";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { addCustomStoreItems, deleteCustomStoreItem, findStoreItem, type StoreItem } from "../src/data/equipmentCatalog";
import { loadSpellCatalog } from "../src/data/spellCatalog";
import { customStoreItemsStorageKey, loadSavedCharacter, savedCharacterSetupDraftStorageKey, savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";
import { readStoredCharacter } from "./storageTestHelpers";

function savedHero() {
  const character = cloneCharacter(initialCharacter);
  character.name = "Regression Hero";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
  return character;
}

describe("application workflows", () => {
  it("shows catalog sources for selected class and prestige class", () => {
    const character = savedHero();
    character.prestigeClass = "arcane-trickster";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);

    expect(document.querySelector(".finalized-class-field")?.textContent)
      .toContain("Source: D&D 3.5 Core SRD");
    expect(document.querySelector(".finalized-class-field")?.textContent)
      .toContain("Book: Player's Handbook (3.5)");
    expect(document.querySelector(".finalized-prestige-field")?.textContent)
      .toContain("Source: D&D 3.5 Core SRD");
    expect(document.querySelector(".finalized-prestige-field")?.textContent)
      .toContain("Book: Dungeon Master's Guide (3.5)");
  });

  it.each([false, true])("preserves free-form age and weight in setup/finalized mode (saved: %s)", async (saved) => {
    if (saved) savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    await screen.findByRole("textbox", { name: saved ? "Age:" : "Age" });
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Age:" : "Age" }), { target: { value: "about 30" } });
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Weight:" : "Weight" }), { target: { value: "82.5 kg" } });
    expect(screen.queryByRole("button", { name: /(?:Increase|Decrease) (?:age|weight)/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const character = readStoredCharacter();
    expect(character.age).toBe("about 30");
    expect(character.weight).toBe("82.5 kg");
    view.unmount();
    render(<App />);
    const savedFieldLabel = saved ? "Age:" : "Age";
    const savedWeightLabel = saved ? "Weight:" : "Weight";
    await screen.findByRole("textbox", { name: savedFieldLabel });
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: savedFieldLabel }).value).toBe("about 30");
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: savedWeightLabel }).value).toBe("82.5 kg");
    fireEvent.change(screen.getByRole("textbox", { name: savedFieldLabel }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("textbox", { name: savedWeightLabel }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const cleared = readStoredCharacter();
    expect(cleared.age).toBe("");
    expect(cleared.weight).toBe("");
  });

  it.each(["5 ft 7 in", "170 cm"])("accepts and saves height as one text field: %s", async (height) => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    const field = await screen.findByRole("textbox", { name: "Height" });
    fireEvent.change(field, { target: { value: height } });
    expect(screen.queryByRole("textbox", { name: "Height in feet" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = readStoredCharacter();
    expect(saved.height).toBe(height);
    expect(screen.getByText(height, { exact: true })).toBeDefined();
  });

  it("edits finalized height without converting the entered units", () => {
    savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Height:" }), { target: { value: "180 cm" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(readStoredCharacter().height).toBe("180 cm");
    expect(screen.queryByRole("button", { name: "Increase height" })).toBeNull();
  });

  it("offers a printable preview for new characters without opening print automatically", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Create Character" })).toBeDefined();
    expect(screen.queryByPlaceholderText("Background, goals, allies, and other details.")).toBeNull();
    expect(screen.getByRole("heading", { name: "Character Notes" })).toBeDefined();
    const sheetTabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    expect(sheetTabs.getByRole("button", { name: "Print" })).toBeDefined();
    const tabButtons = sheetTabs.getAllByRole("button");
    expect(tabButtons[tabButtons.length - 1].textContent).toBe("Print");
    expect(screen.queryByRole("button", { name: "Print / Save as PDF" })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export" })).toBeDefined();
    expect(screen.getByLabelText("Import character JSON")).toBeDefined();
  });

  it("opens the data-bound, two-page printable character sheet", async () => {
    const user = userEvent.setup();
    const character = savedHero();
    character.name = "Print Regression";
    character.classLevels = [
      { classId: "wizard", level: 1 },
      { classId: "cleric", level: 2 },
    ];
    character.abilities = { ...character.abilities, dex: 8, int: 18, wis: 14 };
    character.knownSpells = ["Magic Missile"];
    character.knownSpellsByClass = { wizard: ["Magic Missile"] };
    character.preparedSpells = ["Shield"];
    character.preparedSpellsByClass = { wizard: ["Shield"] };
    character.equipment = {
      "Main Weapon": "Longsword (Medium)",
      "Ranged Weapon": "Longbow (Medium)",
      Armor: "Studded Leather (Medium)",
      Shield: "Buckler (Medium)",
      Currency: "12 gp",
      Miscellaneous: "Crossbow Bolts",
      Head: "Circlet of Insight",
      "Rings 1": "Ring of Protection +1",
    };
    character.inventory = { "Rope (50 ft.)": 1 };
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    render(<App />);

    const sheetNavigation = await screen.findByRole("navigation", { name: "Character sheets" });
    await user.click(within(sheetNavigation).getByRole("button", { name: "Print" }));

    expect(await screen.findByRole("region", { name: "Character record sheet, page 1" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Character record sheet, page 2" })).toBeDefined();
    const savingThrows = screen.getByRole("region", { name: "Character record sheet, page 1" })
      .querySelector(".reference-saves");
    expect(savingThrows?.textContent).toContain("Fort");
    expect(savingThrows?.textContent).toContain("Ref");
    expect(savingThrows?.textContent).toContain("Will");
    expect(savingThrows?.querySelector("table")?.textContent).not.toContain("+");
    const pageOne = screen.getByRole("region", { name: "Character record sheet, page 1" });
    expect(pageOne.querySelector(".reference-vitals")?.textContent).toContain("Touch AC");
    expect(pageOne.querySelector(".reference-vitals")?.textContent).toContain("Flat-Footed AC");
    expect(pageOne.querySelector(".reference-ac-breakdown")?.textContent).not.toContain("Touch");
    expect(pageOne.querySelector(".reference-ac-breakdown")?.textContent).not.toContain("Flat-Footed");
    const abilityTable = pageOne.querySelector(".reference-ability-table");
    const dexterityRow = [...(abilityTable?.querySelectorAll("tbody tr") ?? [])]
      .find((row) => row.querySelector("th b")?.textContent === "DEX");
    expect(dexterityRow?.querySelector("td:nth-child(3)")?.textContent).toBe("-1");
    const abilityModifiers = [...(abilityTable?.querySelectorAll("tbody td:nth-child(3)") ?? [])];
    expect(abilityModifiers.some((cell) => cell.textContent?.includes("+"))).toBe(false);
    const acComponents = pageOne.querySelector(".reference-ac-components");
    expect(acComponents?.textContent).not.toContain("+");
    const dexterityAc = [...(acComponents?.querySelectorAll(".print-field") ?? [])]
      .find((field) => field.querySelector(".print-field-label")?.textContent === "DEX");
    expect(dexterityAc?.querySelector(".print-field-value")?.textContent).toBe("-1");
    const movementModes = [...pageOne.querySelectorAll(".reference-vitals-movement .print-field-label")]
      .map((label) => label.textContent);
    expect(movementModes).toEqual(["Fly", "Climb", "Swim", "Burrow"]);
    const speed = [...pageOne.querySelectorAll(".reference-vitals-primary .print-field")]
      .find((field) => field.querySelector(".print-field-label")?.textContent === "Speed");
    expect(speed?.querySelector(".print-field-value")?.textContent).toMatch(/^\d+$/);
    const combatStats = pageOne.querySelector(".reference-bab-grapple");
    expect(combatStats?.querySelectorAll(".print-field")).toHaveLength(3);
    expect(combatStats?.textContent).toContain("Base Attack Bonus");
    expect(combatStats?.textContent).toContain("Grapple");
    expect(combatStats?.textContent).toContain("Level");
    const combatNotes = pageOne.querySelector(".reference-conditions");
    const combatNoteValues = [...(combatNotes?.querySelectorAll(".print-field-value") ?? [])];
    expect(combatNoteValues).toHaveLength(3);
    expect(combatNoteValues.every((value) => !value.textContent?.trim())).toBe(true);
    expect(combatNotes?.textContent).toContain("Wounds / Current HP");
    expect(combatNotes?.textContent).toContain("Nonlethal Damage");
    expect(combatNotes?.textContent).toContain("Temporary HP");
    expect(screen.getByText("Print Regression")).toBeDefined();
    expect(screen.getByText("Longsword", { exact: false })).toBeDefined();
    expect(pageOne.querySelector(".reference-attack-table thead th:last-child")?.textContent)
      .toBe("Range / Reach");
    const attackRows = [...pageOne.querySelectorAll(".reference-attack-table tbody tr")];
    expect(attackRows.map((row) => row.querySelector(".reference-attack-slot")?.textContent))
      .toEqual(["Main", "Off Hand", "Ranged"]);
    const longswordAttack = attackRows
      .find((row) => row.querySelector("th")?.textContent?.includes("Longsword"));
    expect(longswordAttack?.querySelector(".reference-attack-item")?.textContent)
      .toBe("Longsword");
    expect(longswordAttack?.querySelector(".reference-attack-damage-value")?.textContent)
      .toBeTruthy();
    expect(longswordAttack?.querySelector(".reference-attack-damage-type")?.textContent)
      .toBeTruthy();
    expect(longswordAttack?.lastElementChild?.querySelector(".reference-attack-distance-label")?.textContent)
      .toBe("Reach");
    expect(longswordAttack?.lastElementChild?.querySelector(".reference-attack-distance-value")?.textContent)
      .toBe("5 ft.");
    const longbowAttack = attackRows
      .find((row) => row.querySelector("th")?.textContent?.includes("Longbow"));
    expect(longbowAttack?.lastElementChild?.querySelector(".reference-attack-distance-label")?.textContent)
      .toBe("Range");
    expect(longbowAttack?.lastElementChild?.querySelector(".reference-attack-distance-value")?.textContent)
      .toBeTruthy();
    const protectionRows = [...pageOne.querySelectorAll<HTMLTableRowElement>(".reference-protection tbody tr")];
    expect(protectionRows).toHaveLength(4);
    expect(protectionRows[0].querySelector(".reference-protection-item")?.textContent)
      .toBe("Studded Leather");
    expect(protectionRows[1].querySelector(".reference-protection-item")?.textContent)
      .toBe("Buckler");
    expect(protectionRows[0].cells[3].textContent).toBe("5");
    expect(protectionRows[0].cells[4].textContent).toBe("-1");
    expect(protectionRows[1].cells[4].textContent).toBe("-1");
    expect(screen.getByText("12 gp")).toBeDefined();
    expect(screen.getAllByText("Spell Save DC", { exact: true })).toHaveLength(2);
    expect(screen.getByText("Arcane Spell Failure")).toBeDefined();
    expect(screen.getByText("Conditional Modifiers")).toBeDefined();
    expect(screen.queryByText("Spell List 2")).toBeNull();
    expect(document.querySelectorAll(".reference-spell-tracker tbody tr")).toHaveLength(10);
    expect([...document.querySelectorAll(".reference-spell-tracker tbody tr td:first-child .reference-spell-tracker-box")]
      .every((box) => !box.textContent?.trim())).toBe(true);
    expect(document.querySelector(".reference-spell-save-mod .print-field-value")?.textContent)
      .toBe("+2");
    const spellTrackerText = document.querySelector(".reference-spell-tracker")?.textContent ?? "";
    expect(spellTrackerText).not.toContain("Magic Missile");
    expect(spellTrackerText).not.toContain("Shield");
    expect(document.querySelectorAll(".reference-worn-item-grid .reference-worn-item")).toHaveLength(12);
    expect(document.querySelector(".reference-worn-item.has-item")?.textContent)
      .toContain("Circlet of Insight");
    expect(document.querySelectorAll(".reference-inventory-list .reference-inventory-row")).toHaveLength(28);
    const sidebar = document.querySelector(".reference-xp-sidebar");
    const feats = document.querySelector(".reference-feats");
    const featsDetails = document.querySelector(".reference-feats-details");
    expect(sidebar?.querySelector(".reference-languages")).toBeNull();
    expect(sidebar?.querySelector(".reference-money")).toBeNull();
    expect(feats?.nextElementSibling).toBe(featsDetails);
    expect(featsDetails?.querySelector(".reference-languages")).not.toBeNull();
    expect(featsDetails?.querySelector(".reference-money")).not.toBeNull();
    expect([...(featsDetails?.querySelectorAll(":scope > section") ?? [])].map((section) => section.className))
      .toEqual(["reference-languages", "reference-money"]);
    expect(screen.getByText("Ring of Protection +1")).toBeDefined();
    const featureColumns = document.querySelectorAll(".reference-feature-columns > div");
    expect(featureColumns).toHaveLength(2);
    featureColumns.forEach((column) => expect(column.querySelectorAll("p").length).toBeGreaterThanOrEqual(10));
    expect(document.querySelectorAll(".reference-feat-list > p")).toHaveLength(14);
    expect(document.querySelectorAll(".reference-language-list > span")).toHaveLength(10);
    const handwrittenSwitch = screen.getByRole("switch", { name: "Handwritten" });
    expect(handwrittenSwitch.getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector(".print-sheet-view")?.classList.contains("print-handwritten")).toBe(true);
    expect(screen.getByText("Print Regression").closest(".print-field-value")).not.toBeNull();
    expect(screen.getByText("Character Name").closest(".print-field-value")).toBeNull();
    await user.click(handwrittenSwitch);
    expect(handwrittenSwitch.getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector(".print-sheet-view")?.classList.contains("print-handwritten")).toBe(false);
    expect(within(screen.getByRole("region", { name: "Character record sheet, page 1" }))
      .queryByText("Crossbow Bolts", { exact: true })).toBeNull();
    expect(screen.queryAllByText(/^____ \/ \d+$/)).toHaveLength(0);
    expect(within(screen.getByRole("region", { name: "Character record sheet, page 1" }))
      .getByText("Hit Points").closest(".print-field")?.querySelector(".print-field-value")?.textContent)
      .toMatch(/^\d+$/);
    expect(document.querySelectorAll(".reference-sheet-page")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Print / Save as PDF" })).toBeDefined();
  });

  it("shows known-spell limits for spontaneous casters on the printable sheet", () => {
    const character = savedHero();
    character.classLevels = [{ classId: "sorcerer", level: 1 }];
    render(<PrintableCharacterSheet character={character} />);

    const knownSpellValues = [...document.querySelectorAll(".reference-spell-tracker tbody tr td:first-child .reference-spell-tracker-box")]
      .map((box) => box.textContent?.trim());
    expect(knownSpellValues.slice(0, 2)).toEqual(["4", "2"]);
    expect(knownSpellValues.slice(2).every((value) => !value)).toBe(true);
  });

  it("shows positive skill modifiers without plus signs and keeps negative signs", () => {
    const character = cloneCharacter(initialCharacter);
    character.abilities = { ...character.abilities, dex: 8, int: 12 };
    render(<PrintableCharacterSheet character={character} />);

    const skillTable = document.querySelector(".reference-skill-table");
    const skillRows = [...(skillTable?.querySelectorAll<HTMLTableRowElement>("tbody tr") ?? [])];
    const appraiseRow = skillRows
      .find((row) => row.querySelector("th")?.textContent?.trim() === "Appraise");
    const balanceRow = skillRows
      .find((row) => row.querySelector("th")?.textContent?.trim() === "Balance");
    expect(appraiseRow?.cells[2].textContent).toBe("1");
    expect(appraiseRow?.cells[3].textContent).toBe("1");
    expect(appraiseRow?.cells[5].textContent).toBe("0");
    expect(balanceRow?.cells[2].textContent).toBe("-1");
    expect(skillTable?.textContent).not.toContain("+");
  });

  it("marks skills that cannot be used untrained without marking limited-use skills", () => {
    render(<PrintableCharacterSheet character={cloneCharacter(initialCharacter)} />);

    const skillRows = [...document.querySelectorAll<HTMLTableRowElement>(".reference-skill-table tbody tr")];
    const decipherScript = skillRows.find((row) => row.querySelector("th")?.textContent?.trim() === "Decipher Script*");
    const handleAnimal = skillRows.find((row) => row.querySelector("th")?.textContent?.trim() === "Handle Animal");
    expect(decipherScript?.querySelector(".reference-trained-only-marker")?.getAttribute("title"))
      .toBe("Cannot be used untrained");
    expect(handleAnimal?.querySelector(".reference-trained-only-marker")).toBeNull();
    expect(document.querySelector(".reference-page-one .reference-page-footer")?.textContent)
      .toContain("* = trained only");
  });

  it("reopens a saved setup draft in editable creation mode", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    const view = render(<App />);
    await screen.findAllByRole("textbox", { name: "Character name" });
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

  it("round-trips unfinished setup state through character export and import", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    const view = render(<App />);
    const nameInputs = await screen.findAllByRole<HTMLInputElement>("textbox", { name: "Character name" });
    await user.clear(nameInputs[0]);
    await user.type(nameInputs[0], "Portable Setup Draft");

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:portable-setup-draft";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No setup draft JSON was exported.");
    const exportedJson = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(JSON.parse(exportedJson).__dnd35CharacterBuilder).toEqual({
      version: 1,
      setupDraft: true,
    });
    view.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);

    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "portable-setup-draft.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    const importedNameInputs = await screen.findAllByRole<HTMLInputElement>("textbox", { name: "Character name" });
    expect(importedNameInputs[0].value).toBe("Portable Setup Draft");
    expect(screen.getByRole("button", { name: "Finalize Character" })).toBeDefined();
    expect(alert).toHaveBeenLastCalledWith("Character imported.");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"))
      .toMatchObject([1, { name: "Portable Setup Draft" }, true]);
    importedView.unmount();
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
    expect(readStoredCharacter()).toEqual(original);
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
    expect(readStoredCharacter()).toEqual(original);
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
          { name: new RegExp(`^${feat}`) },
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    random.mockRestore();

    expect(screen.getByText("24 / 24", { exact: true })).toBeDefined();
    expect(screen.getByText("Attack +3", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (20/20)", { exact: true })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenCalledWith("Character saved.");
    const saved = readStoredCharacter();
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
      readStoredCharacter(),
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
          { name: new RegExp(`^${feat}`) },
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
      .toBe(false);
    const thirdLevelRoll = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    thirdLevelRoll.mockRestore();
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    fourthLevelRoll.mockRestore();

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
    const saved = readStoredCharacter();
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
          { name: new RegExp(`^${feat}`) },
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    thirdLevelRoll.mockRestore();
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    fourthLevelRoll.mockRestore();

    expect(screen.getByText("44 / 44", { exact: true })).toBeDefined();
    const strength = screen.getByText("STR").parentElement;
    if (!strength) throw new Error("Missing Strength score summary.");
    expect(within(strength).getByText("14", { exact: true })).toBeDefined();
    expect(within(strength).getByText("+2", { exact: true })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");

    const saved = readStoredCharacter();
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    random.mockRestore();

    expect(screen.getByText("20 / 20", { exact: true })).toBeDefined();
    expect(screen.getByText("Attack +2", { exact: true })).toBeDefined();
    expect(screen.getByText("Skills (26/26)", { exact: true })).toBeDefined();
    const reflex = screen.getByText("Reflex", { selector: ".stat > small" }).parentElement;
    if (!reflex) throw new Error("Missing Reflex save summary.");
    expect(within(reflex).getByRole("strong").textContent).toBe("+2");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");

    const saved = readStoredCharacter();
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
          { name: new RegExp(`^${feat}`) },
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    fighterRoll.mockRestore();
    await user.click(screen.getByRole("button", { name: "Save" }));
    const afterFighterLevel = readStoredCharacter();
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
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    wizardRoll.mockRestore();

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
    const saved = readStoredCharacter();
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

  it("selects and saves a Ranger combat-style feat on level-up", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    original.classLevels = [{ classId: "ranger", level: 1 }];
    original.hitPoints = 8;
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    await screen.findByRole("navigation", { name: "Character sheets" });

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "ranger");
    const tabs = within(
      await screen.findByRole("navigation", { name: "Character sheets" }),
    );
    await user.click(tabs.getByRole("button", { name: "Character" }));
    for (const skill of [
      "Climb",
      "Handle Animal",
      "Hide",
      "Listen",
      "Ride",
      "Spot",
      "Survival",
    ]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    await user.click(
      screen.getByRole("button", {
        name: "Ranger combat style feat (ranger level 2)",
      }),
    );
    await user.click(
      within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
        "option",
        { name: /^Rapid Shot/ },
      ),
    );
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    random.mockRestore();
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = readStoredCharacter();
    expect(saved).toMatchObject({
      classLevels: [{ classId: "ranger", level: 2 }],
      featSelections: { "ranger-style-2": "rapid-shot" },
    });
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
  });

  it("warns when Ranger combat-style benefits are disabled by medium armor", async () => {
    const original = savedHero();
    original.classLevels = [{ classId: "ranger", level: 11 }];
    original.featSelections = {
      "ranger-style-2": "rapid-shot",
      "ranger-style-6": "manyshot",
      "ranger-style-11": "improved-precise-shot",
    };
    original.equipment.Armor = "Chainmail";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    render(<App />);

    expect(
      await screen.findByText(
        /Ranger style is inactive in medium or heavy armor/,
      ),
    ).toBeDefined();
  });

  it("applies Manyshot on both character and equipment sheets", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    original.classLevels = [{ classId: "ranger", level: 11 }];
    original.featSelections = {
      "ranger-style-2": "rapid-shot",
      "ranger-style-6": "manyshot",
      "ranger-style-11": "improved-precise-shot",
    };
    original.equipment["Ranged Weapon"] = "Longbow (Medium)";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    render(<App />);

    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Attack action" }),
      "manyshot",
    );
    await user.type(screen.getByRole("spinbutton", { name: "Target distance (ft.)" }), "30");
    expect(await screen.findByText("3 arrows use one Manyshot attack roll")).toBeDefined();
    expect(await screen.findByText(/Weapon damage expression: .* per arrow\. Apply damage reduction and other resistances separately against each arrow; add precision-based damage once\. On a critical, only the first arrow deals critical damage\./)).toBeDefined();

    const tabs = within(
      screen.getByRole("navigation", { name: "Character sheets" }),
    );
    await user.click(tabs.getByRole("button", { name: "Equipment" }));
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Attack action" }).value)
      .toBe("manyshot");
    expect(screen.getByText("3 arrows use one Manyshot attack roll")).toBeDefined();
    expect(screen.getByText(/Weapon damage expression: .* per arrow\. Apply damage reduction and other resistances separately against each arrow; add precision-based damage once\. On a critical, only the first arrow deals critical damage\./)).toBeDefined();
  });

  it("shares target cover and concealment context across character and equipment sheets", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    original.featSelections = { "general-1": "improved-precise-shot" };
    original.equipment["Ranged Weapon"] = "Longbow (Medium)";
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    render(<App />);

    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Target cover" }),
      "less-than-total",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Target concealment" }),
      "less-than-total",
    );
    expect(await screen.findByText(/ignores this cover AC bonus on ranged attacks/)).toBeDefined();
    expect(await screen.findByText(/ignores this concealment miss chance on ranged attacks/)).toBeDefined();

    const tabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(tabs.getByRole("button", { name: "Equipment" }));
    expect(await screen.findByText(/ignores this cover AC bonus on ranged attacks/)).toBeDefined();
    expect(await screen.findByText(/ignores this concealment miss chance on ranged attacks/)).toBeDefined();
  });

  it("selects Monk bonus feats without their usual prerequisites", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    original.alignment = "Lawful Good";
    original.classLevels = [{ classId: "monk", level: 1 }];
    original.hitPoints = 8;
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(original));
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    await screen.findByRole("navigation", { name: "Character sheets" });

    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Class" }), "monk");
    for (const skill of ["Balance", "Climb", "Listen", "Spot", "Tumble"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: new RegExp(`^${feat}`) },
        ),
      );
    };
    await chooseFeat("Monk bonus feat (monk level 1)", "Stunning Fist");
    await chooseFeat("Monk bonus feat (monk level 2)", "Deflect Arrows");
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
    await user.click(screen.getByRole("button", { name: "Confirm Level-Up" }));
    random.mockRestore();
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = readStoredCharacter();
    expect(saved).toMatchObject({
      classLevels: [{ classId: "monk", level: 2 }],
      featSelections: {
        "monk-1": "stunning-fist",
        "monk-2": "deflect-arrows",
      },
    });
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
  });

  it("creates, resumes, finalizes, exports, and imports a wizard with spellbook choices", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);

    await user.click(screen.getByRole("button", { name: "Class" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Class choices" })).getByRole(
        "option",
        { name: /^Wizard/ },
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
          { name: new RegExp(`^${feat}`) },
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
    const saved = readStoredCharacter();
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
        { name: /^Cleric/ },
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
        { name: "Lawful Neutral" },
      ),
    );
    expect(screen.getByText("Cleric alignment must be within one step of Pelor.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Finalize Character" }).hasAttribute("disabled"))
      .toBe(true);
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "True Neutral" },
      ),
    );
    expect(screen.getByText("Cleric alignment must be within one step of Pelor.")).toBeDefined();
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
          { name: new RegExp(`^${feat}`) },
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

    const saved = readStoredCharacter();
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
        { name: /^Sorcerer/ },
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
          { name: new RegExp(`^${feat}`) },
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

    const saved = readStoredCharacter();
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

  it("allows a Lawful Good paladin to follow an ideal or choose a non-Lawful-Good deity", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "Class" });
    await user.click(screen.getByRole("button", { name: "Alignment" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Alignment choices" })).getByRole(
        "option",
        { name: "Lawful Good" },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Class" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Class choices" })).getByRole(
        "option",
        { name: /^Paladin/ },
      ),
    );

    expect((await screen.findByRole("button", { name: "Class" })).textContent).toContain("Paladin");
    expect(screen.queryByText("Paladin characters must choose a deity.")).toBeNull();
    expect(screen.queryByText("Paladins must choose a Lawful Good deity.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Deity" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Deity choices" })).getByRole(
        "option",
        { name: /^Pelor \(Neutral Good\)/ },
      ),
    );
    expect(screen.getByRole("button", { name: "Deity" }).textContent).toContain("Pelor");
    expect(screen.queryByText("Paladins must choose a Lawful Good deity.")).toBeNull();
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

  it("rejects invalid custom-item imports without partially changing character or catalog data", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const original = savedHero();
    const originalCharacterStorage = window.localStorage.getItem(savedCharacterStorageKey);
    const existingItem: StoreItem = {
      custom: true,
      name: "Existing Catalog Item",
      category: "Weapons",
      price: 12,
      weight: "2 lb.",
    };
    const candidate: StoreItem = {
      custom: true,
      name: "Rejected Import Item",
      category: "Weapons",
      price: 10,
      weight: "2 lb.",
    };
    addCustomStoreItems([existingItem]);
    const originalCatalogStorage = window.localStorage.getItem(customStoreItemsStorageKey);
    const invalidCharacter = {
      ...cloneCharacter(initialCharacter),
      customItems: [candidate, { ...candidate, name: "Invalid Imported Item", price: -1 }],
    };
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const json = JSON.stringify(invalidCharacter);
    const file = new File([json], "invalid-custom-items.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });

    try {
      fireEvent.change(input, { target: { files: [file] } });
      expect((await screen.findByRole("alert")).textContent).toContain("Unable to import");
      expect(alert).not.toHaveBeenCalled();
      expect(screen.getByRole("heading", { name: "Regression Hero (Player)" })).toBeDefined();
      expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe(originalCharacterStorage);
      expect(window.localStorage.getItem(customStoreItemsStorageKey)).toBe(originalCatalogStorage);
      expect(readStoredCharacter()).toEqual(original);
      expect(findStoreItem(candidate.name)).toBeUndefined();
      expect(findStoreItem(existingItem.name)).toEqual(existingItem);
    } finally {
      deleteCustomStoreItem(candidate.name);
      deleteCustomStoreItem(existingItem.name);
    }
  });

  it("rejects imported custom items that conflict with an existing catalog entry", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const original = savedHero();
    const originalCharacterStorage = window.localStorage.getItem(savedCharacterStorageKey);
    const existingItem: StoreItem = {
      custom: true,
      name: "Conflicting Imported Item",
      category: "Weapons",
      price: 20,
      weight: "2 lb.",
      damage: "1d10",
      proficiency: "Martial",
    };
    const conflictingItem: StoreItem = { ...existingItem, damage: "1d8" };
    addCustomStoreItems([existingItem]);
    const originalCatalogStorage = window.localStorage.getItem(customStoreItemsStorageKey);
    const incomingCharacter = {
      ...cloneCharacter(initialCharacter),
      name: "Conflicting Incoming Hero",
      customItems: [conflictingItem],
    };
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const json = JSON.stringify(incomingCharacter);
    const file = new File([json], "conflicting-custom-item.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });

    try {
      fireEvent.change(input, { target: { files: [file] } });
      expect((await screen.findByRole("alert")).textContent).toContain("conflicts with an existing");
      expect(alert).not.toHaveBeenCalled();
      expect(screen.getByRole("heading", { name: "Regression Hero (Player)" })).toBeDefined();
      expect(window.localStorage.getItem(savedCharacterStorageKey)).toBe(originalCharacterStorage);
      expect(window.localStorage.getItem(customStoreItemsStorageKey)).toBe(originalCatalogStorage);
      expect(readStoredCharacter()).toEqual(original);
      expect(findStoreItem(existingItem.name)).toEqual(existingItem);
    } finally {
      deleteCustomStoreItem(existingItem.name);
    }
  });

  it("accepts matching custom catalog data after JSON serialization", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const item: StoreItem = {
      custom: true,
      name: "Matching Imported Item",
      category: "Weapons",
      price: 20,
      weight: "2 lb.",
      damage: "1d8",
      damageSmall: undefined,
      proficiency: "Martial",
    };
    addCustomStoreItems([item]);
    const character = {
      ...cloneCharacter(initialCharacter),
      name: "Matching Item Hero",
      customItems: [item],
    };
    const json = JSON.stringify(character);
    const file = new File([json], "matching-custom-item.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");

    try {
      fireEvent.change(input, { target: { files: [file] } });
      expect(await screen.findByRole("heading", { name: "Matching Item Hero (Player)" })).toBeDefined();
      expect(findStoreItem(item.name)).toMatchObject(item);
      expect(alert).toHaveBeenLastCalledWith("Character imported.");
    } finally {
      deleteCustomStoreItem(item.name);
    }
  });

  it("round-trips character-embedded custom items when the catalog entry is missing", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    const item: StoreItem = {
      custom: true,
      name: "Embedded Portable Blade",
      category: "Weapons",
      price: 15,
      weight: "3 lb.",
      damage: "1d8",
      damageType: "slashing",
      proficiency: "Martial",
    };
    const character = savedHero();
    character.name = "Portable Item Hero";
    character.notes = "Keep the family blade safe.";
    character.equipment["Main Weapon"] = `${item.name} (Medium)`;
    character.customItems = [item];
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    expect(findStoreItem(item.name)).toBeUndefined();

    let importedView: ReturnType<typeof render> | undefined;
    try {
      const { unmount } = render(<App />);
      let exportedBlob: Blob | undefined;
      class TestURL extends URL {
        static createObjectURL(blob: Blob) {
          exportedBlob = blob;
          return "blob:portable-custom-item";
        }
        static revokeObjectURL = vi.fn();
      }
      vi.stubGlobal("URL", TestURL);
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await user.click(screen.getByRole("button", { name: "Export" }));
      if (!exportedBlob) throw new Error("No character JSON was exported.");
      const exportedJson = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Expected text export."));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(exportedBlob!);
      });
      expect(parseCharacter(JSON.parse(exportedJson)).customItems).toContainEqual(item);

      unmount();
      window.localStorage.removeItem(savedCharacterStorageKey);
      window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
      importedView = render(<App />);
      const input = importedView.container.querySelector<HTMLInputElement>('input[type="file"]');
      if (!input) throw new Error("Missing import input.");
      const file = new File([exportedJson], "portable-custom-item.json", {
        type: "application/json",
      });
      Object.defineProperty(file, "text", { value: async () => exportedJson });
      fireEvent.change(input, { target: { files: [file] } });
      expect(await screen.findByRole("heading", { name: "Portable Item Hero (Player)" })).toBeDefined();
      expect(findStoreItem(item.name)).toEqual(item);
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(alert).toHaveBeenLastCalledWith("Character saved.");
      expect(readStoredCharacter()).toMatchObject({
        notes: character.notes,
        equipment: character.equipment,
        customItems: [item],
      });
    } finally {
      importedView?.unmount();
      deleteCustomStoreItem(item.name);
    }
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
    const saved = readStoredCharacter();
    expect(saved.abilities).toEqual({ str: 3, dex: 15, con: 14, int: 9, wis: 6, cha: 16 });
    expect(saved.hitPoints).toBe(12);
  });

  it("preserves rolled assignments and reapplies racial modifiers when changing races", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Roll 4d6" }));
    const dice = [
      6, 5, 4, 1,
      6, 5, 5, 1,
      6, 5, 3, 1,
      6, 4, 3, 1,
      5, 4, 3, 1,
      4, 3, 3, 1,
    ];
    let dieIndex = 0;
    vi.spyOn(Math, "random").mockImplementation(
      () => (dice[dieIndex++] - 1 + 0.1) / 6,
    );
    fireEvent.click(screen.getByRole("button", { name: "Roll Abilities" }));
    const rolledPool = screen.getByText(
      "Rolled: 15, 16, 14, 13, 12, 10. Choose where each result goes below.",
    );
    expect(rolledPool).toBeDefined();

    fireEvent.change(screen.getByRole("combobox", { name: /^Strength/ }), {
      target: { value: "5" },
    });
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: /^Strength/ }).value,
    ).toBe("5");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: /^Charisma/ }).value,
    ).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Race" }));
    fireEvent.click(
      within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
        "option",
        { name: "Dwarf" },
      ),
    );
    expect(
      screen.getByText(
        "Rolled: 15, 16, 14, 13, 12, 10. Choose where each result goes below.",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: /^Strength/ }).value,
    ).toBe("5");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: /^Charisma/ }).value,
    ).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    expect(readStoredCharacter().abilities).toEqual({ str: 10, dex: 16, con: 16, int: 13, wis: 12, cha: 13 });
  });

  it("preserves point-buy costs and base scores when changing races", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
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
    const chooseRace = (race: string) => {
      fireEvent.click(screen.getByRole("button", { name: "Race" }));
      fireEvent.click(
        within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
          "option",
          { name: race },
        ),
      );
    };
    chooseRace("Dwarf");
    expect(screen.getByText("Points used: 25 / 25", { exact: true })).toBeDefined();
    const strength = screen.getByRole("combobox", { name: /^Strength/ });
    expect(within(strength).getByRole("option", { name: /^16/ }).hasAttribute("disabled"))
      .toBe(true);
    const constitution = screen.getByRole("combobox", { name: /^Constitution/ }).parentElement;
    if (!constitution) throw new Error("Missing Constitution creation control.");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: /^Constitution/ }).value)
      .toBe("13");
    expect(within(constitution).getByText("15 (+2)", { exact: true })).toBeDefined();
    const charisma = screen.getByRole("combobox", { name: /^Charisma/ }).parentElement;
    if (!charisma) throw new Error("Missing Charisma creation control.");
    expect(within(charisma).getByText("6 (-2)", { exact: true })).toBeDefined();

    chooseRace("Human");
    expect(screen.getByText("Points used: 25 / 25", { exact: true })).toBeDefined();
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: /^Constitution/ }).value)
      .toBe("13");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: /^Charisma/ }).value)
      .toBe("8");
    const humanConstitution = screen.getByRole("combobox", {
      name: /^Constitution/,
    }).parentElement;
    const humanCharisma = screen.getByRole("combobox", {
      name: /^Charisma/,
    }).parentElement;
    if (!humanConstitution || !humanCharisma)
      throw new Error("Missing racial ability score summaries.");
    expect(within(humanConstitution).getByText("13 (+1)", {
      exact: true,
      selector: ".racial-adjustment",
    })).toBeDefined();
    expect(within(humanCharisma).getByText("8 (-1)", {
      exact: true,
      selector: ".racial-adjustment",
    })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    expect(readStoredCharacter()).toMatchObject({
      race: "Human",
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    });
  });

  it("starts a fresh point-buy allocation when switching back from rolled scores", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Race" }));
    fireEvent.click(
      within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
        "option",
        { name: "Dwarf" },
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Point Buy" }));

    const initialScores = {
      Charisma: 8,
      Strength: 15,
      Dexterity: 14,
      Constitution: 13,
      Intelligence: 12,
    };
    Object.entries(initialScores).forEach(([ability, score]) => {
      fireEvent.change(screen.getByRole("combobox", { name: new RegExp(`^${ability}`) }), {
        target: { value: String(score) },
      });
    });
    expect(screen.getByText("Points used: 25 / 25", { exact: true })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Roll 4d6" }));
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    fireEvent.click(screen.getByRole("button", { name: "Roll Abilities" }));
    expect(
      screen.getByText("Rolled: 18, 18, 18, 18, 18, 18. Choose where each result goes below."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Point Buy" }));
    expect(screen.getByText("Points used: 12 / 25", { exact: true })).toBeDefined();
    for (const ability of ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]) {
      expect(
        screen.getByRole<HTMLSelectElement>("combobox", {
          name: new RegExp(`^${ability}`),
        }).value,
      ).toBe("10");
    }
    const constitution = screen.getByRole("combobox", {
      name: /^Constitution/,
    }).parentElement;
    const charisma = screen.getByRole("combobox", {
      name: /^Charisma/,
    }).parentElement;
    if (!constitution || !charisma)
      throw new Error("Missing racial ability score summaries.");
    expect(within(constitution).getByText("12 (+1)", {
      exact: true,
      selector: ".racial-adjustment",
    })).toBeDefined();
    expect(within(charisma).getByText("8 (-1)", {
      exact: true,
      selector: ".racial-adjustment",
    })).toBeDefined();
  });

  it("starts a usable point-buy allocation when switching from manual scores", () => {
    render(<App />);
    for (const ability of ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]) {
      fireEvent.change(
        screen.getByRole("combobox", { name: new RegExp(`^${ability}`) }),
        { target: { value: "18" } },
      );
    }

    fireEvent.click(screen.getByRole("button", { name: "Point Buy" }));
    expect(screen.getByText("Points used: 12 / 25", { exact: true })).toBeDefined();

    const pointBuyScores = {
      Charisma: 8,
      Strength: 15,
      Dexterity: 14,
      Constitution: 13,
      Intelligence: 12,
    };
    Object.entries(pointBuyScores).forEach(([ability, score]) => {
      fireEvent.change(
        screen.getByRole("combobox", { name: new RegExp(`^${ability}`) }),
        { target: { value: String(score) } },
      );
    });
    expect(screen.getByText("Points used: 25 / 25", { exact: true })).toBeDefined();
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
    expect(readStoredCharacter()).toEqual(character);
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

  it("round-trips created dwarf ability scores through export and import", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    await user.clear(screen.getAllByRole("textbox", { name: "Character name" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Character name" })[0], "Dwarf Cycle");
    await user.clear(screen.getAllByRole("textbox", { name: "Player" })[0]);
    await user.type(screen.getAllByRole("textbox", { name: "Player" })[0], "Cycle Player");

    await user.click(screen.getByRole("button", { name: "Race" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Race choices" })).getByRole(
        "option",
        { name: "Dwarf" },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Roll 4d6" }));
    const dice = [
      6, 5, 4, 1,
      6, 5, 5, 1,
      6, 5, 3, 1,
      6, 4, 3, 1,
      5, 4, 3, 1,
      4, 3, 3, 1,
    ];
    let dieIndex = 0;
    const random = vi.spyOn(Math, "random").mockImplementation(
      () => (dice[dieIndex++] - 1 + 0.1) / 6,
    );
    await user.click(screen.getByRole("button", { name: "Roll Abilities" }));
    random.mockRestore();
    expect(
      screen.getByText(
        "Rolled: 15, 16, 14, 13, 12, 10. Choose where each result goes below.",
      ),
    ).toBeDefined();

    for (const skill of ["Climb", "Craft", "Handle Animal"]) {
      const row = within(screen.getByRole("group", { name: `${skill} skill` }));
      for (let rank = 0; rank < 4; rank += 1)
        await user.click(row.getByRole("button", { name: `Add rank to ${skill}` }));
    }

    const chooseFeat = async (slot: string, feat: string) => {
      await user.click(screen.getByRole("button", { name: slot }));
      await user.click(
        within(screen.getByRole("listbox", { name: "Feat choices" })).getByRole(
          "option",
          { name: new RegExp(`^${feat}`) },
        ),
      );
    };
    await chooseFeat("General feat (level 1)", "Toughness");
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
    await screen.findByRole("heading", { name: "Dwarf Cycle (Cycle Player)" });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    expect(
      readStoredCharacter(),
    ).toMatchObject({
      race: "Dwarf",
      abilities: { str: 15, dex: 16, con: 16, int: 13, wis: 12, cha: 8 },
    });

    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:dwarf-cycle";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    if (!exportedBlob) throw new Error("No dwarf character JSON was exported.");
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
      race: "Dwarf",
      abilities: { str: 15, dex: 16, con: 16, int: 13, wis: 12, cha: 8 },
    });

    view.unmount();
    window.localStorage.removeItem(savedCharacterStorageKey);
    window.localStorage.removeItem(savedCharacterSetupDraftStorageKey);
    const importedView = render(<App />);
    const input = importedView.container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    if (!input) throw new Error("Missing import input.");
    const file = new File([exportedJson], "dwarf-cycle.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => exportedJson });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("heading", { name: "Dwarf Cycle (Cycle Player)" });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(alert).toHaveBeenLastCalledWith("Character saved.");
    expect(
      readStoredCharacter(),
    ).toMatchObject({
      race: "Dwarf",
      abilities: { str: 15, dex: 16, con: 16, int: 13, wis: 12, cha: 8 },
    });
    importedView.unmount();
  });
});
