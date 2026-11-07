import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter, type Character, type ClassId } from "../src/domain";
import { defaultSrdSpellSourceBook, findSpellByName, getClassSpells, getSrdSpellContentSource, getSrdSpellSourceBook, loadSpellCatalog } from "../src/data/spellCatalog";
import { srdSpells } from "../src/srdSpells";
import { WandsScrollPanel } from "../src/components/WandsScrollPanel";
import { baseSpellSlots, getCasterLevel, getClassSpellSelections, getDailySpellSlots,
  getHighSorceryMoonModifier, getKnownSpellLimit, getLevelUpSpellWarnings,
  getKnownSpellReplacementLevelLimit, getMysticSpellReplacementLevelLimit, getSpellSaveDC,
  getSpellcastingAbility, hasSpellLevelAtClassLevel,
  getWizardFreeSpellAllowance, getWizardSpellbookSpells } from "../src/rules";
import { getWizardCopyRequirements } from "../src/wizardSpellbookRules";
import { savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";
import { SpellSheets } from "../src/components/SpellSheet";
import { readStoredCharacter } from "./storageTestHelpers";

beforeAll(loadSpellCatalog);
describe("spell catalog source attribution", () => {
  it("uses the PHB for cross-checked catalog spells and leaves Phantom Trap at SRD level", () => {
    expect(defaultSrdSpellSourceBook).toBe("Player's Handbook (3.5)");
    const phantomTrap = srdSpells.find((spell) => spell.name === "Phantom Trap");
    const magicMissile = srdSpells.find((spell) => spell.name === "Magic Missile");
    if (!phantomTrap || !magicMissile) throw new Error("Expected core spell entries are missing.");
    expect(getSrdSpellSourceBook(phantomTrap)).toBeUndefined();
    expect(getSrdSpellSourceBook(magicMissile)).toBe("Player's Handbook (3.5)");
  });

  it("resolves domain-name variants to complete SRD spell records", () => {
    const aliases = {
      "Greater Arcane Sight": "Arcane Sight, Greater",
      "Greater Command": "Command, Greater",
      "Greater Heroism": "Heroism, Greater",
      "Greater Restoration": "Restoration, Greater",
      "Lesser Restoration": "Restoration, Lesser",
      "Otto's Irresistible Dance": "Irresistible Dance",
      "Rary's Telepathic Bond": "Telepathic Bond",
      "Tasha's Hideous Laughter": "Hideous Laughter",
    };
    for (const [domainName, catalogName] of Object.entries(aliases)) {
      const spell = findSpellByName(domainName);
      expect(spell?.name).toBe(catalogName);
      expect([
        spell?.description, spell?.school, spell?.components,
        spell?.castingTime, spell?.range, spell?.duration, spell?.savingThrow,
      ].every(Boolean)).toBe(true);
    }
  });

  it("adds sourced Dragonlance domain spell details without making them Core class choices", () => {
    const names = ["Hardening", "Otyugh Swarm", "Plague of Rats", "Scourge", "Unbinding"];
    for (const name of names) {
      const spell = findSpellByName(name);
      if (!spell) throw new Error(`Expected Dragonlance domain spell ${name} to be cataloged.`);
      expect(spell).toMatchObject({
        source: "dragonlance-user-pack",
        sourceBook: "Dragonlance Campaign Setting",
      });
      expect(getSrdSpellContentSource(spell)).toBe("dragonlance-user-pack");
      expect(getSrdSpellSourceBook(spell)).toBe("Dragonlance Campaign Setting");
      expect([
        spell.description, spell.school, spell.components,
        spell.castingTime, spell.range, spell.duration, spell.savingThrow,
      ].every(Boolean)).toBe(true);
    }

    for (const name of ["Otyugh Swarm", "Plague of Rats", "Scourge"])
      expect(findSpellByName(name)?.classes).toEqual([]);
    expect(findSpellByName("Hardening")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      classLevels: { sorcerer: 6, wizard: 6 },
    });
    expect(findSpellByName("Unbinding")?.classes).toEqual(["sorcerer", "wizard"]);
    for (const classId of ["cleric", "mystic", "sorcerer", "wizard"] as const)
      expect(getClassSpells(classId).some((spell) => names.includes(spell.name))).toBe(false);
  });

  it("adds all Chapter 3 New Spells with source-backed class access and levels", () => {
    const newSpellClasses: Record<string, string[]> = {
      "Bestow Greater Curse": ["bard", "cleric", "sorcerer", "wizard"],
      "Billim's Bifrost Bridge": ["sorcerer", "wizard"],
      "Crackling Sphere": ["sorcerer", "wizard"],
      "Dalamar's Lightning Lance": ["sorcerer", "wizard"],
      "Deep Freeze": ["sorcerer", "wizard"],
      Disjoin: ["cleric", "sorcerer", "wizard"],
      "Divine Retribution": ["cleric"],
      Drown: ["druid", "sorcerer", "wizard"],
      "Earthen Shield": ["cleric", "sorcerer", "wizard"],
      "Electrical Storm": ["sorcerer", "wizard"],
      "Elemental Dart": ["sorcerer", "wizard"],
      "Fistandantilus's Portal": ["sorcerer", "wizard"],
      "Magius's Light of Truth": ["wizard"],
      "Palin's Pyre": ["sorcerer", "wizard"],
      "Share Animal's Mind": ["cleric", "druid"],
      "Shocking Spark": ["sorcerer", "wizard"],
      "Spark Shield": ["cleric", "sorcerer", "wizard"],
      "Spirit Walk": ["cleric", "sorcerer", "wizard"],
      "Stone Shards": ["sorcerer", "wizard"],
      "Storm Wall": ["sorcerer", "wizard"],
      Talons: ["cleric", "druid"],
    };
    for (const [name, classes] of Object.entries(newSpellClasses)) {
      const spell = findSpellByName(name);
      if (!spell) throw new Error(`Expected Chapter 3 spell ${name} to be cataloged.`);
      expect(spell.source).toBe("dragonlance-user-pack");
      expect(spell.classes).toEqual(classes);
      expect([
        spell.description, spell.school, spell.components,
        spell.castingTime, spell.range, spell.duration, spell.savingThrow,
      ].every(Boolean)).toBe(true);
    }

    const newSpellNames = Object.keys(newSpellClasses);
    expect(getClassSpells("wizard").some((spell) => newSpellNames.includes(spell.name))).toBe(false);
    expect(getClassSpells("bard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(6);
    expect(getClassSpells("bard", "dragonlance-user-pack")
      .filter((spell) => spell.school === "Conjuration (Healing)")).toEqual([]);
    expect(getClassSpells("bard")
      .some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
    expect(getClassSpells("cleric", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(7);
    expect(getClassSpells("sorcerer", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(8);
    expect(getClassSpells("druid", "dragonlance-user-pack")
      .find((spell) => spell.name === "Drown")?.level).toBe(5);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Drown")?.level).toBe(6);
    expect(getClassSpells("cleric", "dragonlance-user-pack")
      .find((spell) => spell.name === "Spirit Walk")?.level).toBe(6);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Spirit Walk")?.level).toBe(7);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Hardening")?.level).toBe(6);

    const mystic = cloneCharacter(initialCharacter);
    mystic.ruleset = "dragonlance-user-pack";
    mystic.classLevels = [{ classId: "mystic", level: 1 }];
    expect(getClassSpells("mystic", mystic.ruleset, mystic)
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(7);

    const whiteWizard = cloneCharacter(initialCharacter);
    whiteWizard.ruleset = "dragonlance-user-pack";
    whiteWizard.highSorceryOrder = "white";
    expect(getClassSpells("wizard", whiteWizard.ruleset, whiteWizard)
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(true);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(false);
    expect(getClassSpells("sorcerer", whiteWizard.ruleset, whiteWizard)
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(false);
  });

  it("keeps Dragonlance domain spell details out of Core scroll purchase choices", () => {
    const character = cloneCharacter(initialCharacter);
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByText("No spells match.")).toBeDefined();
  });

  it("offers Dragonlance domain spell details in Dragonlance scroll purchase choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByRole("option", { name: /Hardening \(Level 7\)/ })).toBeDefined();
  });

  it("uses a character's class-specific spell level for Dragonlance scroll choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "wizard", level: 12 }];
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByRole("option", { name: /Hardening \(Level 6\)/ })).toBeDefined();
  });
});

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

function highSorceryCaster(order: NonNullable<Character["highSorceryOrder"]> = "red") {
  const character = caster();
  character.ruleset = "dragonlance-user-pack";
  character.highSorceryOrder = order;
  return character;
}

function save(character: Character) {
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}

function stored() {
  return readStoredCharacter();
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
      expect(screen.getByText(/Core school specialization is optional and chosen at Wizard 1/)).toBeDefined();
      expect(screen.queryByRole("spinbutton")).toBeNull();
      expect(screen.queryByRole("checkbox", { name: /Expended/ })).toBeNull();
      expect(screen.getByText("Magic Missile", { exact: true })).toBeDefined();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }), { target: { value: "2" } });
      expect(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }).closest("tr")?.textContent)
        .toContain("Source: D&D 3.5 Core SRD");
      expect(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }).closest("tr")?.textContent)
        .toContain("Book: Player's Handbook (3.5)");
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

    it.each([
      ["spellcraft", "Deciphering Spellcraft total before Magius bonus"],
      ["decipher-script", "Deciphering Decipher Script total before Magius bonus"],
    ] as const)("applies Magius to arcane scroll %s checks", async (method, label) => {
      const character = caster();
      character.ruleset = "dragonlance-user-pack";
      character.languages = ["Common", "Magius"];
      save(character);
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: method } });
      expect(screen.getByText(/Magius grants a \+2 competence bonus/)).toBeDefined();
      fireEvent.change(screen.getByLabelText(label), { target: { value: "20" } });
      expect(screen.queryByText(/Deciphering failed/)).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "8 hours of study completed" }));
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().wizardSpellLearning?.Web).toMatchObject({
        source: "scroll",
        decipherMethod: method,
        decipherTotal: 22,
        spellcraftTotal: 17,
      });
    });

    it("does not apply Magius's scroll-reading bonus when copying another spellbook", async () => {
      const character = caster();
      character.ruleset = "dragonlance-user-pack";
      character.languages = ["Common", "Magius"];
      save(character);
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: "spellbook" } });
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: "spellcraft" } });
      expect(screen.queryByText(/Magius grants a \+2 competence bonus/)).toBeNull();
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "20" } });
      expect(screen.getByRole("alert").textContent).toContain("Deciphering failed");
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
      await screen.findByRole("button", { name: "Class" });
      fireEvent.click(screen.getByRole("button", { name: "Class" }));
      const wizardOption = screen.getByRole("option", { name: /^Wizard/ });
      expect(wizardOption.textContent).toContain("Source: D&D 3.5 Core SRD");
      expect(wizardOption.textContent).toContain("Book: Player's Handbook (3.5)");
      fireEvent.click(wizardOption);
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

  it("applies Dragonlance High Sorcery phase and conjunction modifiers to caster level and DC", () => {
    const character = highSorceryCaster();
    character.dragonlanceMoonState = {
      phases: { lunitari: "waxing-gibbous" },
      conjunction: "none",
    };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    expect(getCasterLevel("wizard", 3, character)).toBe(4);
    expect(getSpellSaveDC(character, "wizard", 2)).toBe(16);
    expect(getSpellSaveDC(character, "wizard", 2, undefined, false)).toBe(15);

    character.dragonlanceMoonState.phases!.lunitari = "new";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(-1);
    expect(getCasterLevel("wizard", 3, character)).toBe(2);
    expect(getSpellSaveDC(character, "wizard", 2)).toBe(14);

    character.dragonlanceMoonState.conjunction = "lunitari-nuitari";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(0);
    character.dragonlanceMoonState.conjunction = "all";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    character.dragonlanceMoonState.phases!.lunitari = "full";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(3);

    character.highSorceryOrder = "white";
    character.dragonlanceMoonState = { phases: { solinari: "full" } };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    character.highSorceryOrder = "black";
    character.dragonlanceMoonState = { phases: { nuitari: "full" } };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);

    character.ruleset = "core-35-srd";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(0);
    character.ruleset = "dragonlance-user-pack";
    expect(getHighSorceryMoonModifier(character, "cleric")).toBe(0);
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
    expect(baseSpellSlots("sorcerer", 1, 0)).toBe(5);
    expect(baseSpellSlots("sorcerer", 1, 1)).toBe(3);
    expect(baseSpellSlots("sorcerer", 4, 2)).toBe(3);
    expect(getDailySpellSlots(character, "sorcerer", 1, 1)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 2, 1)).toBe(2);
    expect(getKnownSpellLimit(character, "sorcerer", 4, 2)).toBe(1);
    expect(getKnownSpellLimit(character, "sorcerer", 20, 0)).toBe(9);
    character.abilities.cha = 19;
    expect(getKnownSpellLimit(character, "sorcerer", 20, 9)).toBe(3);
    expect(getKnownSpellLimit(character, "bard", 1, 1)).toBe(0);
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(2);
    character.abilities.cha = 12;
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(2);
    expect(getDailySpellSlots(character, "bard", 4, 2)).toBe(0);
    expect(baseSpellSlots("bard", 14, 0)).toBe(4);
    character.abilities.cha = 16;
    expect(getKnownSpellLimit(character, "bard", 20, 6)).toBe(4);

    character.abilities.cha = 9;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(0);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(0);
    character.abilities.cha = 10;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(0);
    character.abilities.cha = 11;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(2);

    character.abilities.cha = 11;
    expect(getKnownSpellLimit(character, "bard", 2, 1)).toBe(2);
    expect(getDailySpellSlots(character, "bard", 2, 1)).toBe(0);
  });

  it("limits Bard and Sorcerer known-spell replacements to their class-level schedules", () => {
    const replacementLimit = (
      classId: "bard" | "sorcerer",
      originalLevel: number,
      proposedLevel: number,
    ) => {
      const original = cloneCharacter(caster());
      original.classLevels = [{ classId, level: originalLevel }];
      const proposed = cloneCharacter(original);
      proposed.classLevels[0].level = proposedLevel;
      return getKnownSpellReplacementLevelLimit(original, proposed, classId);
    };

    expect(replacementLimit("bard", 4, 5)).toBe(0);
    expect(replacementLimit("bard", 5, 6)).toBeUndefined();
    expect(replacementLimit("bard", 7, 8)).toBe(1);
    expect(replacementLimit("sorcerer", 3, 4)).toBe(0);
    expect(replacementLimit("sorcerer", 4, 5)).toBeUndefined();
    expect(replacementLimit("sorcerer", 5, 6)).toBe(1);
  });

  it("validates Sorcerer spell replacements by level and class-level milestone", () => {
    const sorcererSpells = getClassSpells("sorcerer");
    const cantrips = sorcererSpells.filter((spell) => spell.level === 0);
    const firstLevelSpells = sorcererSpells.filter((spell) => spell.level === 1);
    const secondLevelSpell = sorcererSpells.find((spell) => spell.level === 2);
    if (
      cantrips.length < 3 ||
      firstLevelSpells.length < 2 ||
      !secondLevelSpell
    ) {
      throw new Error("Expected Sorcerer spell choices are missing from the catalog.");
    }

    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "sorcerer", level: 3 }];
    original.abilities.cha = 18;
    original.knownSpellsByClass = { sorcerer: [cantrips[0].name] };
    original.knownSpells = [cantrips[0].name];
    const validReplacement = cloneCharacter(original);
    validReplacement.classLevels[0].level = 4;
    const validKnownSpells = [
      cantrips[1].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    validReplacement.knownSpellsByClass = { sorcerer: validKnownSpells };
    validReplacement.knownSpells = validKnownSpells;
    expect(getLevelUpSpellWarnings(original, validReplacement)).toEqual([]);

    const highLevelOriginal = cloneCharacter(original);
    highLevelOriginal.knownSpellsByClass = {
      sorcerer: [firstLevelSpells[0].name],
    };
    highLevelOriginal.knownSpells = [firstLevelSpells[0].name];
    const invalidReplacement = cloneCharacter(highLevelOriginal);
    invalidReplacement.classLevels[0].level = 4;
    const invalidKnownSpells = [
      firstLevelSpells[1].name,
      cantrips[0].name,
      secondLevelSpell.name,
    ];
    invalidReplacement.knownSpellsByClass = {
      sorcerer: invalidKnownSpells,
    };
    invalidReplacement.knownSpells = invalidKnownSpells;
    expect(getLevelUpSpellWarnings(highLevelOriginal, invalidReplacement)).toContain(
      "The exchanged spell must be at least two levels below the highest spell level available.",
    );

    const wrongLevelOriginal = cloneCharacter(validReplacement);
    const wrongLevel = cloneCharacter(wrongLevelOriginal);
    wrongLevel.classLevels[0].level = 5;
    const wrongLevelKnownSpells = [
      cantrips[0].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    wrongLevel.knownSpellsByClass = { sorcerer: wrongLevelKnownSpells };
    wrongLevel.knownSpells = wrongLevelKnownSpells;
    expect(getLevelUpSpellWarnings(wrongLevelOriginal, wrongLevel)).toContain(
      "A Sorcerer may replace spells only at qualifying class levels.",
    );
  });

  it("uses the Dragonlance Mystic spells-per-day and spells-known tables", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.abilities.wis = 11;
    expect(baseSpellSlots("mystic", 1, 0)).toBe(5);
    expect(baseSpellSlots("mystic", 1, 1)).toBe(3);
    expect(baseSpellSlots("mystic", 2, 0)).toBe(6);
    expect(baseSpellSlots("mystic", 4, 2)).toBe(3);
    expect(baseSpellSlots("mystic", 20, 9)).toBe(6);
    expect(hasSpellLevelAtClassLevel("mystic", 1, 0)).toBe(true);
    expect(hasSpellLevelAtClassLevel("mystic", 1, 2)).toBe(false);
    expect(getDailySpellSlots(character, "mystic", 1, 1)).toBe(3);
    expect(getDailySpellSlots(character, "mystic", 1, 0)).toBe(5);
    character.abilities.wis = 18;
    expect(getDailySpellSlots(character, "mystic", 1, 1)).toBe(4);
    expect(getDailySpellSlots(character, "mystic", 1, 0)).toBe(5);
    character.classLevels = [{ classId: "mystic", level: 1 }];
    expect(getKnownSpellLimit(character, "mystic", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(2);
    expect(getKnownSpellLimit(character, "mystic", 4, 2)).toBe(1);
    expect(getKnownSpellLimit(character, "mystic", 20, 9)).toBe(3);
    character.mysticDomain = "animal";
    expect(getKnownSpellLimit(character, "mystic", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(3);
    expect(getKnownSpellLimit(character, "mystic", 4, 2)).toBe(2);
    expect(getKnownSpellLimit(character, "mystic", 20, 9)).toBe(4);
    expect(getClassSpells("mystic").map((spell) => spell.name)).toContain("Cure Light Wounds");
    expect(getClassSpells("mystic").map((spell) => spell.name)).not.toContain("Magic Missile");
  });

  it("warns when Mystic level-up gains new spells known", () => {
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 1 }];
    original.mysticDomain = "animal";
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;

    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Learn 1 additional 0-level Mystic spell.",
    ]);
  });

  it("allows one same-level Mystic replacement and counts a newly accessible domain spell automatically", () => {
    const mysticSpells = getClassSpells("mystic");
    const cantrips = mysticSpells.filter((spell) => spell.level === 0);
    const secondLevelSpell = mysticSpells.find((spell) => spell.level === 2);
    if (cantrips.length < 3 || !secondLevelSpell) {
      throw new Error("Expected Mystic spell choices are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 3 }];
    original.mysticDomain = "animal";
    original.knownSpellsByClass = { mystic: [cantrips[0].name] };
    original.knownSpells = [cantrips[0].name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const proposedKnownSpells = [
      cantrips[1].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    proposed.knownSpellsByClass = {
      mystic: proposedKnownSpells,
    };
    proposed.knownSpells = proposedKnownSpells;

    expect(getMysticSpellReplacementLevelLimit(original, proposed)).toBe(0);
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([]);
  });

  it("limits Mystic replacements to eligible levels and qualifying Mystic levels", () => {
    const firstLevelSpells = getClassSpells("mystic").filter((spell) => spell.level === 1);
    const cantrip = getClassSpells("mystic").find((spell) => spell.level === 0);
    const alternateCantrip = getClassSpells("mystic").find(
      (spell) => spell.level === 0 && spell.name !== cantrip?.name,
    );
    const secondLevelSpell = getClassSpells("mystic").find((spell) => spell.level === 2);
    if (firstLevelSpells.length < 2 || !cantrip || !alternateCantrip || !secondLevelSpell) {
      throw new Error("Expected Mystic spell choices are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 3 }];
    original.mysticDomain = "animal";
    original.knownSpellsByClass = { mystic: [firstLevelSpells[0].name] };
    original.knownSpells = [firstLevelSpells[0].name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const proposedKnownSpells = [
      firstLevelSpells[1].name,
      cantrip.name,
      secondLevelSpell.name,
    ];
    proposed.knownSpellsByClass = {
      mystic: proposedKnownSpells,
    };
    proposed.knownSpells = proposedKnownSpells;

    expect(getLevelUpSpellWarnings(original, proposed)).toContain(
      "The exchanged spell must be at least two levels below the highest spell level available.",
    );
    const fifthLevel = cloneCharacter(proposed);
    fifthLevel.classLevels[0].level = 5;
    const fifthLevelKnownSpells = (proposed.knownSpellsByClass?.mystic ?? [])
      .map((name) => name === cantrip.name ? alternateCantrip.name : name);
    fifthLevel.knownSpellsByClass = { mystic: fifthLevelKnownSpells };
    fifthLevel.knownSpells = fifthLevelKnownSpells;
    expect(getMysticSpellReplacementLevelLimit(proposed, fifthLevel)).toBeUndefined();
    expect(getLevelUpSpellWarnings(proposed, fifthLevel)).toContain(
      "A Mystic may replace spells only at qualifying class levels.",
    );
  });

  it("requires a Mystic domain when gaining a Mystic level", () => {
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 1 }];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;

    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Choose one Mystic domain; its bonus spells are inactive until selected.",
    ]);
  });

  it("shows a Mystic domain spell as automatically known without persisting it as a learned spell", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "animal";
    const onKnownSpellsChange = vi.fn();
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={onKnownSpellsChange} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByRole("row", { name: /Calm Animals \(Domain\)/ })).toBeDefined();
    expect(screen.getByText("Known 1/3")).toBeDefined();
    expect(onKnownSpellsChange).not.toHaveBeenCalled();
  });

  it("shows Dragonlance domain powers manually and displays verified spell details", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 14 }];
    character.mysticDomain = "forge";
    character.abilities.wis = 20;
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByText(/Forge domain power \(manual\): Gain a \+2 insight bonus/)).toBeDefined();
    const hardeningRow = screen.getByRole("row", { name: /Hardening \(Domain\)/ });
    expect(within(hardeningRow).getByText(/increases a touched item's hardness/i)).toBeDefined();
    expect(within(hardeningRow).getByText(/Book: Dragonlance Campaign Setting/)).toBeDefined();
    expect(screen.queryByText(/Domain spell Hardening .*resolved manually/)).toBeNull();
  });

  it("shows Random Action as a Dragonlance-only spell with its legacy source", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "passion";
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    const randomActionRow = screen.getByRole("row", { name: /Random Action \(Domain\)/ });
    expect(within(randomActionRow).getByText(/compels one living creature/i)).toBeDefined();
    expect(within(randomActionRow).getByText(
      /Book: Player's Handbook \(3\.0\), p\. 242; Dragonlance Campaign Setting, p\. 103/,
    )).toBeDefined();
    expect(screen.queryByText(/Domain spell Random Action .*resolved manually/)).toBeNull();
  });

  it("lets a Mystic replace one eligible known spell without exposing the automatic domain spell", async () => {
    const user = userEvent.setup();
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 5 }];
    original.mysticDomain = "healing";
    const levelOneSpells = getClassSpells("mystic").filter((spell) => spell.level === 1);
    const domainSpellIndex = levelOneSpells.findIndex(
      (spell) => spell.name === "Cure Light Wounds",
    );
    const originalSpell = levelOneSpells[domainSpellIndex + 1];
    const replacementSpell = levelOneSpells.find(
      (spell) => spell.name !== originalSpell?.name && spell.name !== "Cure Light Wounds",
    );
    if (domainSpellIndex < 0 || !originalSpell || !replacementSpell) {
      throw new Error("Expected healing-domain spell choices are missing from the catalog.");
    }
    original.knownSpellsByClass = { mystic: [originalSpell.name] };
    original.knownSpells = [originalSpell.name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 6;
    const onKnownSpellsChange = vi.fn();

    render(<SpellSheets character={proposed} levelUpOriginal={original}
      levelUpClassId="mystic" editable onKnownSpellsChange={onKnownSpellsChange}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()} onExpendedSpellSlotsChange={vi.fn()}
      onClericCastingChange={vi.fn()} onCombatCastingContextChange={vi.fn()} />);

    const domainRow = screen.getByRole("row", { name: /Cure Light Wounds \(Domain\)/ });
    expect(domainRow).toBeDefined();
    expect(within(domainRow).queryByRole("button")).toBeNull();
    await user.click(screen.getByRole("button", {
      name: `${originalSpell.name} (Level 1)`,
    }));
    await user.click(screen.getByRole("option", {
      name: new RegExp(`${replacementSpell.name} \\(Level 1\\)`),
    }));
    expect(onKnownSpellsChange).toHaveBeenLastCalledWith([replacementSpell.name], "mystic");
  });

  it("does not apply Mystic domain spells or known-spell bonuses to Core characters", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "core-35-srd";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "animal";

    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(2);
    expect(getLevelUpSpellWarnings(character, {
      ...character,
      classLevels: [{ classId: "mystic", level: 2 }],
    })).toEqual(["Learn 1 additional 0-level Mystic spell."]);
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

  it.each([
    { wizard: "completed" },
    { notAClass: true },
  ])("rejects malformed daily preparation state %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      spellPreparationCompletedByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1.5] } },
    { wizard: { Daze: [10] } },
    { notAClass: { Daze: [1] } },
  ])("rejects malformed prepared spell slot levels %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      preparedSpellSlotLevelsByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Empower metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      empowerByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Maximize metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      maximizeByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Extend metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      extendByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Enlarge metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      enlargeByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Quicken metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      quickenByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Silent metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      silentByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Still metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      stillByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Widen metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      widenByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Sculpt metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      sculptByClass: value,
    })).toThrow(/spell progression/);
  });
});

describe("caster class subtabs", () => {
  it("shows a Gnome's increased DC for individual illusion spells", async () => {
    const character = caster();
    character.race = "Gnome";
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    save(character);
    render(<App />);
    const panel = await openSpells();
    const spellRow = within(panel).getByRole("row", { name: /Ghost Sound/ });
    expect(within(spellRow).getByText("Will disbelief (if interacted with)")).toBeDefined();
    expect(within(spellRow).getByText("DC 14")).toBeDefined();
  });

  it("applies Spell Focus and Greater Spell Focus only to spells from the selected school", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound", "Daze"] };
    character.knownSpells = ["Ghost Sound", "Daze"];
    character.featSelections = {
      "general-1": "spell-focus",
      "human-1": "greater-spell-focus",
    };
    character.featSpellSchoolSelections = {
      "general-1": "Illusion",
      "human-1": "Illusion",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const illusionRow = within(panel).getByRole("row", { name: /Ghost Sound/ });
    const enchantmentRow = within(panel).getByRole("row", { name: /Daze/ });
    expect(within(illusionRow).getByText("DC 15")).toBeDefined();
    expect(within(enchantmentRow).getByText("DC 13")).toBeDefined();
  });

  it("tracks Heighten Spell per prepared copy, including the heightened DC and slot", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "heighten-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "2" },
    });

    fireEvent.change(within(spellRow).getByRole("combobox", {
      name: "Prepared Ghost Sound copy 1 slot level",
    }), { target: { value: "2" } });

    expect(within(spellRow).getByText("Copy 1: DC 15 (Heightened to level 2)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 2: DC 13")).toBeDefined();
    expect(cantrips.getByText(/Prepared 1\//)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellSlotLevelsByClass?.wizard).toEqual({ "Ghost Sound": [2, 0] });
  });

  it("tracks Empower per prepared copy, adds its slot cost to Heighten, and preserves the DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 7 }, { classId: "cleric", level: 1 }];
    character.abilities.int = 13;
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "heighten-spell",
      "general-2": "empower-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "2" },
    });
    fireEvent.change(within(spellRow).getByRole("combobox", {
      name: "Prepared Ghost Sound copy 1 slot level",
    }), { target: { value: "2" } });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Heightened to level 2; Empowered in level 4 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\/1/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellSlotLevelsByClass?.wizard).toEqual({ "Ghost Sound": [2, 0] });
    expect(stored().empowerByClass?.wizard).toEqual({ "Ghost Sound": [true, false] });
  });

  it("uses a higher slot for an Empowered copy without raising its save DC", async () => {
    const character = caster();
    character.featSelections = { "general-1": "empower-spell" };
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Empowered in level 2 slot)")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
  });

  it("tracks Extend per prepared copy and leaves duration doubling manual", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "extend-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Extend Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Extended in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Extended")).toBeDefined();
    expect(screen.getByText(/double eligible durations manually/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().extendByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Maximize per prepared copy without changing its save DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 5 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "heighten-spell",
      "general-2": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Maximized in level 3 slot)")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 3 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().maximizeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("stacks Maximize and Empower slot costs on one prepared copy", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "empower-spell",
      "general-2": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Empowered and Maximized in level 5 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 5 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().empowerByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().maximizeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("adds all four metamagic slot adjustments cumulatively", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 13 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "extend-spell",
      "general-2": "empower-spell",
      "general-3": "maximize-spell",
      "general-4": "enlarge-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Extend Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Enlarge Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Extended and Empowered and Maximized and Enlarged in level 7 slot)",
    )).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Enlarged")).toBeDefined();
    expect(screen.getByText(/manually increase only distance-defined/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 7 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().enlargeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Quicken per prepared copy at four slot levels higher", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "quicken-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened in level 4 slot)",
    )).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Quickened")).toBeDefined();
    expect(screen.getByText(/casting-time eligibility, free-action casting, the once-per-round limit/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Silent's slot cost per copy and leaves component changes manual", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "silent-spell",
      "general-2": "quicken-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Silence Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Silenced in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Silenced")).toBeDefined();
    expect(screen.getByText(/Verify a verbal component is present and omit it manually; bard spells cannot use this feat/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Silenced in level 5 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 5 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().silentByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Still per prepared copy and stacks its slot cost", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 11 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "still-spell",
      "general-2": "silent-spell",
      "general-3": "quicken-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Still Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Stilled in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Stilled")).toBeDefined();
    expect(screen.getByText(/Verify a somatic component is present and omit it manually; bard spells with somatic components can benefit/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Silence Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText("Copy 1: DC 13 (Silenced and Stilled in level 2 slot)")).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Silenced and Stilled in level 6 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 6 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().stillByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().silentByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Widen and Sculpt slot costs per prepared copy", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 17 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "widen-spell",
      "general-2": "quicken-spell",
      "general-3": "sculpt-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Widen Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Sculpt Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Widened and Sculpted in level 4 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Widened")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Sculpted")).toBeDefined();
    expect(screen.getByText(/Verify a burst, emanation, line, or spread area and double its numeric measurements manually/)).toBeDefined();
    expect(screen.getByText(/choose one of the feat's area shapes manually/i)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Widened and Sculpted in level 8 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 8 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().widenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().sculptByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("adds Quicken's four levels to other prepared metamagic without raising DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 17 }, { classId: "cleric", level: 1 }];
    character.abilities.int = 18;
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "quicken-spell",
      "general-2": "empower-spell",
      "general-3": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const spellRow = spellLevel(panel, "CANTRIPS").getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 14 (Empowered and Maximized and Quickened in level 9 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 9 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("shows the Spell Penetration check modifier for each spellcasting class", async () => {
    const character = caster();
    character.featSelections = { "general-1": "spell-penetration" };
    save(character);
    render(<App />);
    let panel = await openSpells();
    let modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+5");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("Spell Penetration feats add +2 each");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("Compare manually");

    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+3");
  });

  it("stacks Greater Spell Penetration on each class's spell resistance check", async () => {
    const character = caster();
    character.featSelections = {
      "general-1": "spell-penetration",
      "general-3": "greater-spell-penetration",
    };
    save(character);
    render(<App />);
    let panel = await openSpells();
    let modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+7");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("feats add +2 each");

    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+5");
  });

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
    expect(within(panel).getByText(/Spontaneous casting: good clerics/)).toBeDefined();
    expect(within(panel).getByText(/Domain slots cannot be converted; track the replacement manually/)).toBeDefined();
  });

  it("lets a Dragonlance High Sorcery character set moons and applies the current effect", async () => {
    const character = highSorceryCaster();
    character.dragonlanceMoonState = {
      phases: { lunitari: "new" },
      conjunction: "none",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();

    expect(screen.getByLabelText<HTMLSelectElement>("Lunitari phase").value).toBe("new");
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 14")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Lunitari phase"), { target: { value: "waxing-gibbous" } });
    expect(screen.getByText("Current Lunitari order effect: +1 caster level and +1 spell save DC.")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 16")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Moon conjunction"), { target: { value: "all" } });
    expect(screen.getByText("Current Lunitari order effect: +3 caster level and +3 spell save DC.")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 18")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().dragonlanceMoonState).toEqual({
      phases: { lunitari: "waxing-gibbous" },
      conjunction: "all",
    });
  });

  it("locks daily preparation, persists usage, and resets it after a rest", async () => {
    save(caster());
    const view = render(<App />);
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Wizard daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("0");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(false);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass).toEqual({ wizard: ["Detect Magic", "Detect Magic"], cleric: ["Detect Magic"] });
    expect(stored().expendedSpellSlotsByClass).toEqual({ wizard: { "0": [0] }, cleric: { "0": [1] } });
    expect(stored().spellPreparationCompletedByClass).toEqual({ wizard: true, cleric: true });
    view.unmount();
    render(<App />);
    await openSpells();
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("2");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm rest/prayer and recover spell slots" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().expendedSpellSlotsByClass).toEqual({});
    expect(stored().preparedSpellsByClass?.wizard).toEqual(["Detect Magic", "Detect Magic"]);
    expect(stored().spellPreparationCompletedByClass).toEqual({});
  });

  it("requires daily preparation before slot use and locks choices until rest or prayer", async () => {
    const character = caster();
    character.preparedSpellsByClass = { wizard: ["Detect Magic"] };
    save(character);
    render(<App />);
    await openSpells();

    const preparedCopies = screen.getByRole<HTMLInputElement>("spinbutton", {
      name: "Prepare Detect Magic",
    });
    const expendedSlot = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Expended level 0 slot 1",
    });
    expect(expendedSlot.disabled).toBe(true);
    fireEvent.change(preparedCopies, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Wizard daily preparation" }));
    expect(preparedCopies.disabled).toBe(true);
    expect(expendedSlot.disabled).toBe(false);
    fireEvent.click(expendedSlot);
    expect(expendedSlot.checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Confirm rest/prayer and recover spell slots" }));
    expect(preparedCopies.disabled).toBe(false);
    expect(expendedSlot.disabled).toBe(true);
    expect(expendedSlot.checked).toBe(false);
    expect(preparedCopies.value).toBe("2");
  });

  it("recovers all spellcasting classes after rest without changing known or prepared spells", async () => {
    const character = caster();
    character.classLevels.push({ classId: "bard", level: 1 }, { classId: "sorcerer", level: 1 });
    character.knownSpellsByClass = {
      wizard: ["Magic Missile", "Detect Magic", "Invisibility"],
      bard: ["Cure Light Wounds"],
      sorcerer: ["Magic Missile"],
    };
    character.preparedSpellsByClass = {
      wizard: ["Magic Missile", "Detect Magic"],
      cleric: ["Bless"],
    };
    character.expendedSpellSlotsByClass = {
      wizard: { "0": [0], "1": [0] },
      cleric: { "0": [0] },
      bard: { "0": [0] },
      sorcerer: { "0": [0] },
    };
    character.spellPreparationCompletedByClass = {
      wizard: true,
      cleric: true,
    };
    character.clericDomainExpended = [1];
    save(character);
    render(<App />);
    await openSpells();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm rest/prayer and recover spell slots",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(stored().expendedSpellSlotsByClass).toEqual({});
    expect(stored().clericDomainExpended).toEqual([]);
    expect(stored().spellPreparationCompletedByClass).toEqual({});
    expect(stored().knownSpellsByClass).toEqual(character.knownSpellsByClass);
    expect(stored().preparedSpellsByClass).toEqual(character.preparedSpellsByClass);
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
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
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
    fireEvent.click(screen.getByRole("option", { name: /^Cleric/ }));
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass?.cleric).toEqual(["Detect Magic"]);
    expect(stored().expendedSpellSlotsByClass?.cleric).toEqual({ "0": [0] });
  });

  it("exports and imports the complete independent spell state", async () => {
    const character = caster();
    character.expendedSpellSlotsByClass = { wizard: { "2": [1] }, cleric: { "0": [0] } };
    character.spellPreparationCompletedByClass = { wizard: true, cleric: true };
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
    expect(exported.spellPreparationCompletedByClass).toEqual(character.spellPreparationCompletedByClass);
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
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(within(screen.getByRole("tablist", { name: "Spellcasting classes" })).getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Wizard · 3" })).toBeDefined();
    expect(screen.queryByRole("tab", { name: /Fighter/ })).toBeNull();
  });

  it.each(["paladin", "ranger"] as const)("explains when %s spellcasting begins rather than showing wizard slots", (classId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText(/spellcasting begins at class level 4/)).toBeDefined();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("CANTRIPS")).toBeNull();
    if (classId === "paladin") {
      expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
    } else {
      expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
      expect(screen.getByText(/no domain spells or granted powers/)).toBeDefined();
    }
  });

  it("explains Druid spontaneous summon conversion and lack of domains", () => {
    const character = caster();
    character.classLevels = [{ classId: "druid", level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText(/replace a prepared spell with summon nature's ally/)).toBeDefined();
    expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
    expect(screen.getByText(/no cleric domain spells or granted powers/)).toBeDefined();
  });

  it.each(["bard", "sorcerer", "mystic"] as const)("gives %s a known-spell sheet without preparation controls", (classId: ClassId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    if (classId === "mystic") character.ruleset = "dragonlance-user-pack";
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText("Spells Known", { exact: true })).toBeDefined();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByText("LEVEL 2 SPELLS")).toBeNull();
  });

  it("allows a Sorcerer to replace one eligible known spell at 4th level", async () => {
    const user = userEvent.setup();
    const sorcererSpells = getClassSpells("sorcerer");
    const originalSpell = sorcererSpells.find((spell) => spell.name === "Acid Splash");
    const replacementSpell = sorcererSpells.find((spell) => spell.name === "Dancing Lights");
    if (!originalSpell || !replacementSpell) {
      throw new Error("Expected Sorcerer cantrips are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "sorcerer", level: 3 }];
    original.abilities.cha = 18;
    original.knownSpellsByClass = { sorcerer: [originalSpell.name] };
    original.knownSpells = [originalSpell.name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const onKnownSpellsChange = vi.fn();

    render(<SpellSheets character={proposed} levelUpOriginal={original}
      levelUpClassId="sorcerer" editable onKnownSpellsChange={onKnownSpellsChange}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()} onExpendedSpellSlotsChange={vi.fn()}
      onClericCastingChange={vi.fn()} onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByText(/Applying a metamagic feat while casting spontaneously takes a full-round action/)).toBeDefined();
    await user.click(screen.getByRole("button", {
      name: `${originalSpell.name} (Level 0)`,
    }));
    await user.click(screen.getByRole("option", {
      name: new RegExp(`${replacementSpell.name} \\(Level 0\\)`),
    }));
    expect(onKnownSpellsChange).toHaveBeenLastCalledWith(
      [replacementSpell.name],
      "sorcerer",
    );
  });
});
