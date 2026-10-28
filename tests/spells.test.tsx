import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter, type Character, type ClassId } from "../src/domain";
import { loadSpellCatalog } from "../src/data/spellCatalog";
import { baseSpellSlots, getCasterLevel, getClassSpellSelections, getDailySpellSlots,
  getKnownSpellLimit, getLevelUpSpellWarnings, getSpellcastingAbility, hasSpellLevelAtClassLevel,
  getWizardCopyRequirements, getWizardFreeSpellAllowance, getWizardSpellbookSpells } from "../src/rules";
import { savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";
import { SpellSheets } from "../src/components/SpellSheet";

beforeAll(loadSpellCatalog);
beforeEach(() => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
});

function caster(): Character {
  const character = cloneCharacter(initialCharacter);
  character.name = "Multiclass Mage";
  character.classLevels = [{ classId: "wizard", level: 3 }, { classId: "cleric", level: 1 }];
  character.abilities.int = 16;
  character.abilities.wis = 14;
  character.abilities.cha = 18;
  character.knownSpellsByClass = { wizard: ["Magic Missile", "Detect Magic", "Invisibility"] };
  character.knownSpells = ["Magic Missile", "Detect Magic", "Invisibility"];
  return character;
}

function save(character: Character) {
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}

function stored() {
  return parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
}

async function openSpells(preparation = true) {
  fireEvent.click(await screen.findByRole("button", { name: "Spells" }));
  const panel = await screen.findByRole("tabpanel", { name: /Wizard ·|Cleric ·/ });
  if (preparation && screen.queryByRole("tab", { name: "Daily Preparation" })) {
    fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
  }
  return panel;
}

function openBook() {
  fireEvent.click(screen.getByRole("tab", { name: "Spellbook" }));
}

function fillCopiedSpell(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
  fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: name } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "8 hours of study completed" }));
  fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "30" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
}
function spellLevel(panel: HTMLElement, name: string) {
  const section = within(panel).getByText(name, { exact: true }).closest("section");
  if (!(section instanceof HTMLElement)) throw new Error(`Missing spell section ${name}.`);
  return within(section);
}

describe("class-specific spell rules", () => {
  it("offers one spellbook entry per saved spell name even when the source catalog repeats names", () => {
    const entries = getWizardSpellbookSpells();
    expect(new Set(entries.map((entry) => entry.name.toLowerCase())).size).toBe(entries.length);
  });
  it.each([
    [0, 20, 15, 1, 100], [1, 21, 16, 1, 100], [2, 22, 17, 2, 200], [9, 29, 24, 9, 900],
  ])("calculates copying requirements at spell level %s", (level, decipherDC, learningDC, pages, writingCostGp) => {
    expect(getWizardCopyRequirements(level)).toMatchObject({ decipherDC, learningDC, studyHours: 8, pages, writingCostGp, writingHours: 24 });
  });

  it("does not count copies or spells the wizard cannot cast toward free starting spells", () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Magic Missile", "Shield", "Web"] };
    character.spellAcquisitionByClass = { wizard: { Shield: "scroll" } };
    expect(getWizardFreeSpellAllowance(character)).toEqual({ starting: true, required: 6, selected: 1, remaining: 5 });
    character.abilities.int = 10;
    expect(getWizardFreeSpellAllowance(character).selected).toBe(0);
  });
  it.each([
    ["wizard", 3, 2, true], ["wizard", 3, 3, false],
    ["sorcerer", 3, 2, false], ["sorcerer", 4, 2, true],
    ["bard", 1, 1, false], ["bard", 2, 1, true],
    ["bard", 3, 2, false], ["bard", 4, 2, true],
    ["paladin", 3, 1, false], ["paladin", 4, 0, false],
    ["paladin", 4, 1, true], ["paladin", 7, 2, false],
    ["ranger", 8, 2, true], ["ranger", 10, 3, false],
    ["ranger", 11, 3, true], ["ranger", 14, 4, true],
    ["fighter", 20, 0, false], ["wizard", 0, 0, false], ["wizard", 20, 10, false],
  ] as const)("%s %s spell level %s access is %s", (classId, level, spellLevel, expected) => {
    expect(hasSpellLevelAtClassLevel(classId, level, spellLevel)).toBe(expected);
  });

  describe("wizard spellbook learning", () => {
    it("separates the recorded spellbook from preparation and preserves selections when switching views", async () => {
      save(caster());
      render(<App />);
      await openSpells(false);
      expect(screen.getByRole("tab", { name: "Spellbook" }).getAttribute("aria-selected")).toBe("true");
      expect(screen.queryByRole("spinbutton")).toBeNull();
      expect(screen.queryByRole("checkbox", { name: /Expended/ })).toBeNull();
      expect(screen.getByText("Magic Missile", { exact: true })).toBeDefined();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }), { target: { value: "2" } });
      openBook();
      expect(screen.queryByRole("spinbutton")).toBeNull();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Magic Missile" }).value).toBe("2");
    });

    it("requires the exact decipher and learning DCs, study, and writing confirmations before copying", async () => {
      save(caster());
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      expect(screen.getByText(/Copying requirements for Web/).textContent ?? "")
        .toContain("learning Spellcraft DC 17 after 8 hours of study");
      expect(screen.getByText(/Writing takes 24 hours, uses 2 pages, and costs 200 gp/)).toBeDefined();
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: "spellcraft" } });
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "21" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "8 hours of study completed" }));
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "16" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      expect(screen.getAllByRole("alert").map((entry) => entry.textContent).join(" ")).toContain("Learning failed");
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "22" } });
      expect(screen.queryByText(/Deciphering failed/)).toBeNull();
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toContain("Web");
      expect(stored().wizardSpellLearning?.Web).toMatchObject({
        source: "scroll", decipherMethod: "spellcraft", decipherTotal: 22, spellcraftTotal: 17,
      });
      expect(stored().inventory).toEqual({});
    });

    it("read magic bypasses deciphering rolls but not the learning check; cancelled attempts change nothing", async () => {
      const character = caster();
      save(character);
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Shield" } });
      expect(screen.queryByLabelText("Deciphering Spellcraft total")).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "8 hours of study completed" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "15" } });
      expect(screen.getByRole("alert").textContent).toContain("another rank in Spellcraft");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored()).toEqual(character);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      expect(screen.getByLabelText<HTMLSelectElement>("Wizard spell").value).toBe("");
      fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it.each(["spellbook", "research", "reward"] as const)("records %s acquisition without converting it into a free level-up spell", async (source) => {
      const character = caster();
      save(character);
      const view = render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: source } });
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      if (source === "spellbook") {
        expect(screen.getByText(/typical access fee is 100 gp/)).toBeDefined();
        fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "8 hours of study completed" }));
        fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
        fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      } else {
        expect(screen.queryByLabelText("Learning Spellcraft total")).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: /DM approved this spell/ }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().spellAcquisitionByClass?.wizard?.Web).toBe(source);
      expect(stored().wizardSpellLearning?.Web?.source).toBe(source);
      expect(Number.isFinite(Date.parse(stored().wizardSpellLearning?.Web?.learnedAt ?? ""))).toBe(true);
      view.unmount();
      render(<App />);
      await openSpells(false);
      expect(screen.getByText("Web", { exact: true })).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      expect(within(screen.getByLabelText("Wizard spell")).queryByRole("option", { name: "Web (Level 2)" })).toBeNull();
    });

    it("resets pending check results when the spell or source changes", async () => {
      save(caster());
      render(<App />);
      await openSpells(false);
      fillCopiedSpell("Shield");
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(false);
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      expect(screen.getByLabelText<HTMLInputElement>("Learning Spellcraft total").value).toBe("");
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: "reward" } });
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
    });

    it("preserves higher-level and unrecognized imported entries, but does not offer them for preparation", async () => {
      const character = caster();
      character.knownSpellsByClass = { wizard: ["Magic Missile", "Wish", "Imported Mystery"] };
      character.knownSpells = ["Magic Missile", "Wish", "Imported Mystery"];
      save(character);
      render(<App />);
      await openSpells(false);
      expect(screen.getByRole("alert").textContent).toContain("Imported Mystery");
      expect(screen.getByText("Wish", { exact: true })).toBeDefined();
      expect(screen.getByText(/not currently available to prepare/)).toBeDefined();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      expect(screen.queryByRole("spinbutton", { name: "Prepare Wish" })).toBeNull();
      expect(screen.queryByRole("spinbutton", { name: "Prepare Acid Splash" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toEqual(character.knownSpellsByClass.wizard);
    });

    it("keeps learning during level-up provisional and does not count copying toward free additions", async () => {
      const character = caster();
      save(character);
      render(<App />);
      await screen.findByRole("button", { name: "Spells" });
      fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "wizard" } });
      await screen.findByRole("button", { name: "Learn a spell" });
      fillCopiedSpell("Web");
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      expect(screen.getByText(/Free level-up spells: 0\/2/)).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
      expect(screen.queryByText("Web", { exact: true })).toBeNull();
      expect(stored()).toEqual(character);
    });

    it("adds starting cantrips and free spells without copying costs and allows revising draft choices", async () => {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "Class" }));
      fireEvent.click(screen.getByRole("option", { name: "Wizard" }));
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Add starting cantrips" }));
      expect(screen.getByText("Detect Magic", { exact: true })).toBeDefined();
      expect(within(screen.getByLabelText("Free wizard spell")).getAllByRole("option")).toHaveLength(1);
      expect(screen.queryByLabelText("Learning Spellcraft total")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toContain("Detect Magic");
      expect(stored().wizardSpellLearning).toBeUndefined();
    });

    it.each([
      { Shield: { source: "unknown", learnedAt: "2026-10-25T00:00:00Z" } },
      { Shield: { source: "scroll", learnedAt: "not a date" } },
      { Shield: { source: "scroll", learnedAt: "2026-10-25T00:00:00Z", spellcraftTotal: "17" } },
    ])("rejects malformed imported learning records", (wizardSpellLearning) => {
      expect(() => parseCharacter({ ...caster(), wizardSpellLearning })).toThrow(/spell progression/);
    });
  });

  it("indexes paladin/ranger slots from first level, not cantrips, and uses Wisdom", () => {
    const character = caster();
    expect(getSpellcastingAbility("paladin")).toBe("wis");
    expect(baseSpellSlots("paladin", 8, 1)).toBe(1);
    expect(baseSpellSlots("paladin", 8, 2)).toBe(0);
    expect(getDailySpellSlots(character, "paladin", 4, 1)).toBe(1);
    expect(getDailySpellSlots(character, "paladin", 4, 2)).toBe(0);
    expect(getDailySpellSlots(character, "ranger", 8, 2)).toBe(1);
    expect(getCasterLevel("paladin", 3)).toBe(0);
    expect(getCasterLevel("paladin", 4)).toBe(2);
    expect(getCasterLevel("paladin", 5)).toBe(2);
    expect(getCasterLevel("ranger", 4)).toBe(2);
    expect(getCasterLevel("ranger", 8)).toBe(4);
    expect(getCasterLevel("wizard", 3)).toBe(3);
  });

  it("does not grant bonus slots above class access or below the required casting ability", () => {
    const character = caster();
    character.abilities.int = 30;
    expect(getDailySpellSlots(character, "wizard", 3, 3)).toBe(0);
    character.abilities.int = 11;
    expect(getDailySpellSlots(character, "wizard", 3, 2)).toBe(0);
    expect(getDailySpellSlots(character, "wizard", 3, 0)).toBe(4);
    expect(baseSpellSlots("wizard", 0, 1)).toBe(0);
  });

  it("uses SRD bard and sorcerer known-spell limits without ability bonus spells known", () => {
    const character = caster();
    expect(getKnownSpellLimit(character, "sorcerer", 2, 1)).toBe(2);
    expect(getKnownSpellLimit(character, "sorcerer", 4, 2)).toBe(1);
    expect(getKnownSpellLimit(character, "sorcerer", 20, 0)).toBe(9);
    expect(getKnownSpellLimit(character, "sorcerer", 20, 9)).toBe(3);
    expect(getKnownSpellLimit(character, "bard", 1, 1)).toBe(0);
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(2);
    character.abilities.cha = 12;
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(0);
    expect(baseSpellSlots("bard", 14, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "bard", 20, 6)).toBe(4);
  });

  it("requires two wizard level-up additions in total, not two at every spell level", () => {
    const original = caster();
    original.classLevels[0].level = 2;
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 3;
    proposed.knownSpellsByClass = { wizard: [...(original.knownSpellsByClass?.wizard ?? []), "Shield", "Web"] };
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([]);
    proposed.spellAcquisitionByClass = { wizard: { Web: "scroll" } };
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Add 1 Wizard spell to the spellbook (any accessible spell level).",
    ]);
  });

  it("assigns ambiguous legacy spells once and respects explicit empty class lists", () => {
    const character = caster();
    delete character.knownSpellsByClass;
    delete character.preparedSpellsByClass;
    character.knownSpells = ["Detect Magic", "Magic Missile", "Cure Light Wounds"];
    character.preparedSpells = ["Detect Magic"];
    character.knownSpellClasses = { "Detect Magic": "cleric" };
    expect(getClassSpellSelections(character, "knownSpells")).toEqual({
      wizard: ["Magic Missile"], cleric: ["Detect Magic", "Cure Light Wounds"],
    });
    expect(getClassSpellSelections(character, "preparedSpells")).toEqual({ cleric: ["Detect Magic"] });
    character.knownSpellsByClass = { wizard: [], cleric: ["Detect Magic", "Cure Light Wounds"] };
    expect(getClassSpellSelections(character, "knownSpells").wizard).toEqual([]);
    expect(character.knownSpells).toHaveLength(3);
  });

  it.each([
    { wizard: { "1": [-1] } }, { wizard: { "1": [1.5] } },
    { wizard: { "10": [0] } }, { notAClass: { "1": [0] } },
  ])("rejects malformed imported slot usage %j", (value) => {
    expect(() => parseCharacter({ ...caster(), expendedSpellSlotsByClass: value })).toThrow(/spell progression/);
  });
});

describe("caster class subtabs", () => {
  it("shows Wizard 3 and Cleric 1 with separate abilities, levels, slots, DCs and lists", async () => {
    save(caster());
    render(<App />);
    let panel = await openSpells();
    expect(within(screen.getByRole("tablist", { name: "Spellcasting classes" })).getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Wizard · 3" }).getAttribute("aria-selected")).toBe("true");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Ability").value).toBe("INT 16");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Class and Level").value).toBe("Wizard 3");
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 15")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("2 daily slots")).toBeDefined();
    expect(within(panel).queryByText("LEVEL 3 SPELLS")).toBeNull();
    expect(within(panel).getByText("Magic Missile", { exact: true })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Ability").value).toBe("WIS 14");
    expect(within(panel).queryByText("LEVEL 2 SPELLS")).toBeNull();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText("Save DC 13")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText("2 daily slots")).toBeDefined();
    expect(within(panel).queryByText("Magic Missile", { exact: true })).toBeNull();
    expect(within(panel).getByText("Cure Light Wounds", { exact: true })).toBeDefined();
    expect(within(panel).getByRole("heading", { name: "Cleric Domains" })).toBeDefined();
  });

  it("keeps preparation copies and usage independent, persists them, and resets only one class", async () => {
    save(caster());
    const view = render(<App />);
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("0");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(false);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass).toEqual({ wizard: ["Detect Magic", "Detect Magic"], cleric: ["Detect Magic"] });
    expect(stored().expendedSpellSlotsByClass).toEqual({ wizard: { "0": [0] }, cleric: { "0": [1] } });
    view.unmount();
    render(<App />);
    await openSpells();
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("2");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset Cleric expended slots" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().expendedSpellSlotsByClass).toEqual({ wizard: { "0": [0] }, cleric: {} });
    expect(stored().preparedSpellsByClass?.wizard).toEqual(["Detect Magic", "Detect Magic"]);
  });

  it("enforces preparation capacity by spell level, not across the whole sheet", async () => {
    save(caster());
    render(<App />);
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }), { target: { value: "3" } });
    const field = screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Invisibility" });
    expect(field.max).toBe("2");
    fireEvent.change(field, { target: { value: "3" } });
    expect(field.validationMessage).toContain("Preparation must fit");
    fireEvent.change(field, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass?.wizard).toEqual([
      "Magic Missile", "Magic Missile", "Magic Missile", "Invisibility", "Invisibility",
    ]);
  });

  it("supports arrow, Home and End navigation with a single active keyboard tab stop", async () => {
    save(caster());
    render(<App />);
    await openSpells();
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Wizard · 3" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tab", { name: "Cleric · 1" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Wizard · 3" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tab", { name: "Wizard · 3" }).tabIndex).toBe(-1);
  });

  it("automatically selects the class being leveled up and discards provisional usage and preparation", async () => {
    const character = caster();
    save(character);
    render(<App />);
    await screen.findByRole("button", { name: "Spells" });
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "cleric" } });
    await screen.findByRole("tab", { name: "Cleric · 2" });
    expect(screen.getByRole("tab", { name: "Cleric · 2" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByRole("tab", { name: "Cleric · 1" })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("0");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(false);
    expect(stored()).toEqual(character);
  });

  it("preserves another class's legacy spells when adding a wizard spell from a scroll", async () => {
    const character = caster();
    delete character.knownSpellsByClass;
    character.knownSpells = ["Magic Missile", "Cure Light Wounds"];
    character.knownSpellClasses = { "Magic Missile": "wizard", "Cure Light Wounds": "cleric" };
    save(character);
    render(<App />);
    await openSpells(false);
    fillCopiedSpell("Shield");
    fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().knownSpellsByClass).toEqual({ wizard: ["Magic Missile", "Shield"], cleric: ["Cure Light Wounds"] });
    expect(stored().spellAcquisitionByClass?.wizard?.Shield).toBe("scroll");
  });

  it("lets a wizard distribute two free level-up spells across spell levels without relearning old spells", async () => {
    const character = caster();
    character.classLevels[0].level = 2;
    character.knownSpellsByClass = { wizard: ["Magic Missile", "Detect Magic"], cleric: ["Cure Light Wounds"] };
    character.knownSpells = ["Magic Missile", "Detect Magic", "Cure Light Wounds"];
    save(character);
    render(<App />);
    await screen.findByRole("button", { name: "Spells" });
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "wizard" } });
    const panel = await screen.findByRole("tabpanel", { name: "Wizard · 3" });
    expect(within(panel).queryByRole("button", { name: "Magic Missile (Level 1)" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Shield" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Web" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    expect(screen.getByText(/Free level-up spells: 2\/2/)).toBeDefined();
    expect(screen.queryByLabelText("Free wizard spell")).toBeNull();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    expect(screen.queryByRole("button", { name: "Remove Magic Missile from spellbook" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Web from spellbook" }));
    expect(screen.getByText(/Free level-up spells: 1\/2/)).toBeDefined();
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Web" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    expect(screen.getByText(/Free level-up spells: 2\/2/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(stored()).toEqual(character);
  });

  it("removes prepared copies when a scroll-learned spell is removed without touching the cleric", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Detect Magic", "Magic Missile"], cleric: ["Detect Magic"] };
    character.preparedSpellsByClass = { wizard: ["Detect Magic"], cleric: ["Detect Magic"] };
    character.spellAcquisitionByClass = { wizard: { "Detect Magic": "scroll" } };
    character.wizardSpellLearning = { "Detect Magic": { source: "scroll", learnedAt: "2026-10-25T12:00:00Z", spellcraftTotal: 15 } };
    save(character);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await openSpells(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove Detect Magic from spellbook" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass).toEqual({ wizard: [], cleric: ["Detect Magic"] });
    expect(stored().knownSpellsByClass).toEqual({ wizard: ["Magic Missile"], cleric: ["Detect Magic"] });
    expect(stored().wizardSpellLearning).toEqual({});
  });

  it("saves preparation and slot usage entered in a creation draft", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Class" }));
    fireEvent.click(screen.getByRole("option", { name: "Cleric" }));
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass?.cleric).toEqual(["Detect Magic"]);
    expect(stored().expendedSpellSlotsByClass?.cleric).toEqual({ "0": [0] });
  });

  it("exports and imports the complete independent spell state", async () => {
    const character = caster();
    character.expendedSpellSlotsByClass = { wizard: { "2": [1] }, cleric: { "0": [0] } };
    character.preparedSpellsByClass = { wizard: ["Invisibility", "Invisibility"], cleric: ["Detect Magic"] };
    character.clericDomains = ["healing", "travel"];
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Longstrider" } };
    character.clericDomainExpended = [1];
    character.wizardSpellLearning = { Invisibility: { source: "scroll", learnedAt: "2026-10-25T12:00:00Z",
      decipherMethod: "read-magic", spellcraftTotal: 17 } };
    save(character);
    const { container } = render(<App />);
    let blob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(value: Blob) { blob = value; return "blob:spell-export"; }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    if (!blob) throw new Error("Missing spell-state export.");
    const exportBlob = blob;
    const json = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportBlob);
    });
    const exported = parseCharacter(JSON.parse(json));
    expect(exported.expendedSpellSlotsByClass).toEqual(character.expendedSpellSlotsByClass);
    expect(exported.preparedSpellsByClass).toEqual(character.preparedSpellsByClass);
    expect(exported.wizardSpellLearning).toEqual(character.wizardSpellLearning);
    expect(exported.clericDomains).toEqual(character.clericDomains);
    expect(exported.clericDomainPreparation).toEqual(character.clericDomainPreparation);
    expect(exported.clericDomainExpended).toEqual([1]);
    const file = new File([json], "spell-character.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("Missing character import.");
    fireEvent.change(input, { target: { files: [file] } });
    await openSpells();
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 2 slot 2" }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Invisibility" }).value).toBe("2");
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(true);
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Level 1 domain spell" }).value).toBe("travel:Longstrider");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(true);
  });

  it("shows one subtab for a single caster and none for the character's noncasting classes", () => {
    const character = caster();
    character.classLevels = [{ classId: "fighter", level: 2 }, { classId: "wizard", level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()} onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()} />);
    expect(within(screen.getByRole("tablist", { name: "Spellcasting classes" })).getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Wizard · 3" })).toBeDefined();
    expect(screen.queryByRole("tab", { name: /Fighter/ })).toBeNull();
  });

  it.each(["paladin", "ranger"] as const)("explains when %s spellcasting begins rather than showing wizard slots", (classId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()} onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()} />);
    expect(screen.getByText(/spellcasting begins at class level 4/)).toBeDefined();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("CANTRIPS")).toBeNull();
  });

  it.each(["bard", "sorcerer"] as const)("gives %s a known-spell sheet without preparation controls", (classId: ClassId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()} onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()} />);
    expect(screen.getByText("Spells Known", { exact: true })).toBeDefined();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByText("LEVEL 2 SPELLS")).toBeNull();
  });
});
