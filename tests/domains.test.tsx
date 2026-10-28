import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cloneCharacter, deityDefinitions, initialCharacter, type Character } from "../src/domain";
import { findStoreItem } from "../src/data/equipmentCatalog";
import { clericDomains, getClericDomain, type ClericDomainId } from "../src/data/clericDomains";
import { clericDomainAllowed, getActiveClericDomains, getClericDomainSlotCount,
  getClericDomainSpellOptions, getClericDomainWarnings, getWarDomainWeapon } from "../src/clericDomains";
import { getDailySpellSlots, getEquippedWeaponStats, isClassSkill, getSpentSkillPoints, getChosenFeats,
  getAvailableFeatWeaponChoices, getAvailableFeats, isWeaponProficient } from "../src/rules";
import { loadSpellCatalog } from "../src/data/spellCatalog";
import { parseCharacter } from "../src/validation";
import { savedCharacterStorageKey } from "../src/storage";
import { ClericDomains } from "../src/components/ClericDomains";
import App from "../src/App";

beforeAll(loadSpellCatalog);
beforeEach(() => vi.spyOn(window, "alert").mockImplementation(() => {}));

function cleric(level = 3): Character {
  const character = cloneCharacter(initialCharacter);
  character.name = "Domain test";
  character.classLevels = [{ classId: "cleric", level }];
  character.abilities.wis = 16;
  character.clericDomains = ["healing", "travel"];
  return character;
}
function save(character: Character) {
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}
function stored() {
  return parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
}
async function openCleric() {
  fireEvent.click(await screen.findByRole("button", { name: "Spells" }));
  fireEvent.click(await screen.findByRole("tab", { name: /Cleric ·/ }));
  return screen.findByRole("heading", { name: "Cleric Domains" });
}

describe("SRD cleric domain catalog", () => {
  it("contains all 22 core SRD domains and nine spells in each, with explicit power handling", () => {
    expect(Object.keys(clericDomains)).toHaveLength(22);
    for (const id of Object.keys(clericDomains) as ClericDomainId[]) {
      const definition = getClericDomain(id);
      expect(definition.spells).toHaveLength(9);
      expect(definition.spells.every((spell) => !!spell.trim())).toBe(true);
      expect(!!definition.manualPower || !!definition.grantedPower || !!definition.classSkills).toBe(true);
    }
  });

  it.each([
    ["air", "Obscuring Mist", "Elemental Swarm"], ["animal", "Calm Animals", "Shapechange"],
    ["chaos", "Protection from Law", "Summon Monster IX"], ["death", "Cause Fear", "Wail of the Banshee"],
    ["destruction", "Inflict Light Wounds", "Implosion"], ["earth", "Magic Stone", "Elemental Swarm"],
    ["evil", "Protection from Good", "Summon Monster IX"], ["fire", "Burning Hands", "Elemental Swarm"],
    ["good", "Protection from Evil", "Summon Monster IX"], ["healing", "Cure Light Wounds", "Heal, Mass"],
    ["knowledge", "Detect Secret Doors", "Foresight"], ["law", "Protection from Chaos", "Summon Monster IX"],
    ["luck", "Entropic Shield", "Miracle"], ["magic", "Magic Aura", "Mage's Disjunction"],
    ["plant", "Entangle", "Shambler"], ["protection", "Sanctuary", "Prismatic Sphere"],
    ["strength", "Enlarge Person", "Crushing Hand"], ["sun", "Endure Elements", "Prismatic Sphere"],
    ["travel", "Longstrider", "Astral Projection"], ["trickery", "Disguise Self", "Time Stop"],
    ["war", "Magic Weapon", "Power Word Kill"], ["water", "Obscuring Mist", "Elemental Swarm"],
  ] as const)("%s has the SRD first- and ninth-level entries", (id, first, ninth) => {
    expect(getClericDomain(id).spells[0]).toBe(first);
    expect(getClericDomain(id).spells[8]).toBe(ninth);
  });

  it.each([
    ["bahamut", ["air", "good", "luck", "protection", "strength"]],
    ["corellon", ["chaos", "good", "protection", "war"]],
    ["moradin", ["earth", "good", "law", "protection"]],
    ["pelor", ["good", "healing", "strength", "sun"]],
    ["heironeous", ["good", "law", "war"]],
    ["kord", ["chaos", "good", "luck", "strength"]],
    ["st-cuthbert", ["destruction", "law", "protection", "strength"]],
    ["we-jas", ["death", "law", "magic"]],
    ["obad-hai", ["air", "animal", "earth", "fire", "plant", "water"]],
    ["hextor", ["destruction", "evil", "law", "war"]],
    ["nerull", ["death", "evil", "trickery"]],
    ["erythnul", ["chaos", "evil", "trickery", "war"]],
  ] as const)("records verified core domain associations for %s", (id, domains) => {
    expect(deityDefinitions.find((deity) => deity.id === id)?.clericDomains).toEqual(domains);
  });

  it("uses domain-specific levels, not a spell's ordinary class level, and keeps special restrictions", () => {
    const character = cleric(20);
    character.abilities.wis = 20;
    character.clericDomains = ["animal", "fire"];
    expect(getClericDomainSpellOptions(character, 4)).toMatchObject([
      { spell: "Summon Nature's Ally IV", note: "Animals only." }, { spell: "Wall of Fire" },
    ]);
    expect(getClericDomainSpellOptions(character, 3)[1].note).toBe("Resist cold or fire only.");
    expect(getClericDomainSpellOptions(character, 9)[1]).toMatchObject({ spell: "Elemental Swarm", note: "Fire spell only." });
    character.clericDomains = ["strength", "healing"];
    expect(getClericDomainSpellOptions(character, 7)[1].spell).toBe("Regenerate");
  });
});

describe("domain access and powers", () => {
  it.each([
    [1, 0, 0], [1, 1, 1], [1, 2, 0], [3, 2, 1], [4, 3, 0], [5, 3, 1],
    [17, 9, 1], [20, 10, 0], [20, -1, 0], [20, 1.5, 0],
  ])("cleric %s at spell level %s has %s domain slot", (classLevel, spellLevel, expected) => {
    const character = cleric(classLevel);
    character.abilities.wis = 20;
    expect(getClericDomainSlotCount(character, spellLevel)).toBe(expected);
  });

  it("does not grant high-Wisdom bonus domain slots or use wizard levels", () => {
    const character = cleric(1);
    character.classLevels.push({ classId: "wizard", level: 20 });
    character.abilities.wis = 30;
    expect(getClericDomainSlotCount(character, 1)).toBe(1);
    expect(getClericDomainSlotCount(character, 2)).toBe(0);
    expect(getDailySpellSlots(character, "cleric", 1, 1)).toBe(4);
    character.abilities.wis = 10;
    expect(getClericDomainSlotCount(character, 1)).toBe(0);
    expect(getClericDomainSpellOptions(character, 1)).toEqual([]);
  });

  it.each([
    ["chaos", "Chaotic Neutral", "Lawful Good"], ["good", "Neutral Good", "True Neutral"],
    ["evil", "Lawful Evil", "Chaotic Neutral"], ["law", "Lawful Neutral", "Neutral Good"],
  ] as const)("requires matching alignment for %s", (id, allowed, blocked) => {
    const character = cleric();
    character.alignment = allowed;
    expect(clericDomainAllowed(character, id)).toBe(true);
    character.alignment = blocked;
    expect(clericDomainAllowed(character, id)).toBe(false);
    character.clericDomains = [id, "travel"];
    expect(getActiveClericDomains(character)).not.toContain(id);
    expect(getClericDomainWarnings(character).join(" ")).toContain("requires a matching");
  });

  it("filters evil Death spells for good clerics or good deities, without forbidding the Death domain itself", () => {
    const character = cleric(15);
    character.clericDomains = ["death", "travel"];
    expect(clericDomainAllowed(character, "death")).toBe(true);
    expect(getClericDomainSpellOptions(character, 2).map((entry) => entry.domain)).toEqual(["travel"]);
    character.alignment = "True Neutral";
    expect(getClericDomainSpellOptions(character, 2).map((entry) => entry.domain)).toEqual(["death", "travel"]);
    character.deity = "mishakal";
    expect(getClericDomainSpellOptions(character, 2).map((entry) => entry.domain)).toEqual(["travel"]);
  });

  it.each([
    ["animal", "Knowledge (nature)"], ["plant", "Knowledge (nature)"],
    ["knowledge", "Knowledge (architecture and engineering)"], ["travel", "Survival"],
    ["trickery", "Bluff"], ["trickery", "Disguise"], ["trickery", "Hide"],
  ] as const)("applies %s's %s class-skill benefit only to cleric ranks", (id, skill) => {
    const character = cleric();
    character.classLevels.push({ classId: "fighter", level: 1 });
    character.clericDomains = [id];
    expect(isClassSkill(character, skill, "cleric")).toBe(true);
    expect(isClassSkill(character, skill, "fighter")).toBe(false);
    character.skills[skill] = 1;
    expect(getSpentSkillPoints(character)).toBe(1);
    character.classLevels = [{ classId: "fighter", level: 1 }];
    expect(isClassSkill(character, skill)).toBe(false);
  });

  it.each([
    ["corellon", "Longsword", "good"],
    ["heironeous", "Longsword", "good"],
    ["hextor", "Flail", "law"],
    ["erythnul", "Morningstar", "evil"],
  ] as const)("automates War's favored weapon for %s", (deity, weapon, secondDomain) => {
    const character = cleric();
    character.deity = deity;
    character.clericDomains = ["war", secondDomain];
    const item = findStoreItem(weapon);
    if (!item) throw new Error(`Missing catalog weapon: ${weapon}`);
    expect(getWarDomainWeapon(character)).toBe(weapon);
    expect(isWeaponProficient(character, item)).toBe(true);
    expect(getChosenFeats(character)).toContain("weapon-focus");
    const withWar = getEquippedWeaponStats(character, `${weapon} (Medium)`);
    if (!withWar) throw new Error(`Missing equipped weapon stats: ${weapon}`);
    expect(withWar).toMatchObject({ weaponFocusBonus: 1, nonproficiencyPenalties: [] });
    expect(getClericDomainWarnings(character)).not.toContain(
      "War favored weapon unmapped; resolve proficiency and Weapon Focus manually.",
    );

    character.classLevels.push({ classId: "fighter", level: 4 });
    const withFighter = getEquippedWeaponStats(character, `${weapon} (Medium)`);
    if (!withFighter) throw new Error(`Missing equipped weapon stats: ${weapon}`);
    expect(getAvailableFeatWeaponChoices(character, "weapon-specialization", "fighter-4"))
      .toContain(weapon);
    expect(getAvailableFeats(character, { fighterOnly: true }, "fighter-4")
      .map((feat) => feat.id)).toContain("weapon-specialization");

    character.featSelections = { "general-1": "weapon-focus" };
    character.featWeaponSelections = { "general-1": weapon };
    expect(getEquippedWeaponStats(character, `${weapon} (Medium)`))
      .toMatchObject({ weaponFocusBonus: 1, attack: withFighter.attack });
    expect(getAvailableFeatWeaponChoices(character, "weapon-focus", "general-1"))
      .not.toContain(weapon);
  });

  it("keeps unsupported War deity mappings manual and does not grant their benefits", () => {
    const character = cleric();
    character.deity = "mishakal";
    character.clericDomains = ["war", "travel"];
    expect(getWarDomainWeapon(character)).toBeUndefined();
    expect(getChosenFeats(character)).not.toContain("weapon-focus");
    const longsword = findStoreItem("Longsword");
    if (!longsword) throw new Error("Missing catalog weapon: Longsword");
    expect(isWeaponProficient(character, longsword)).toBe(false);
    expect(getEquippedWeaponStats(character, "Longsword (Medium)"))
      .toMatchObject({ weaponFocusBonus: 0, nonproficiencyPenalty: -4 });
    expect(getClericDomainWarnings(character).join(" ")).toContain(
      "War favored weapon unmapped",
    );
  });
});

describe("domain persistence and import validation", () => {
  it("round-trips selections, preparation provenance, and usage without touching wizard casting", () => {
    const character = cleric();
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Longstrider" } };
    character.clericDomainExpended = [1];
    character.preparedSpellsByClass = { wizard: ["Magic Missile"], cleric: ["Bless"] };
    expect(parseCharacter(JSON.parse(JSON.stringify(character)))).toEqual(character);
    expect(parseCharacter(cloneCharacter(initialCharacter)).clericDomains).toBeUndefined();
  });

  it.each([
    { clericDomains: ["travel", "travel"] }, { clericDomains: ["travel", "healing", "war"] },
    { clericDomains: ["not-a-domain"] }, { clericDomainPreparation: { 0: { domain: "travel", spell: "Longstrider" } } },
    { clericDomainPreparation: { 1: { domain: "travel", spell: 3 } } },
    { clericDomainPreparation: { 1: { domain: "bogus", spell: "Longstrider" } } },
    { clericDomainExpended: [0] }, { clericDomainExpended: [10] }, { clericDomainExpended: [1, 1] },
    { clericDomainExpended: [1.5] }, { clericDomainExpended: ["1"] },
  ])("rejects malformed domain data %j", (fields) => {
    expect(() => parseCharacter({ ...cleric(), ...fields })).toThrow(/Cleric domains/);
  });

  it("preserves semantically unavailable imported preparations and reports them, including insufficient Wisdom", () => {
    const character = cleric();
    character.clericDomainPreparation = { 1: { domain: "war", spell: "Magic Weapon" } };
    expect(parseCharacter(character)).toBe(character);
    expect(getClericDomainWarnings(character).join(" ")).toContain("preserved but cannot be used");
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Longstrider" } };
    character.abilities.wis = 10;
    expect(getClericDomainWarnings(character).join(" ")).toContain("unavailable");
  });
});

describe("cleric domain UI and lifecycle", () => {
  it("offers two distinct, alignment-appropriate choices with explicit unverified deity associations", () => {
    const character = cleric();
    character.clericDomains = ["healing"];
    character.deity = "mishakal";
    const onChange = vi.fn();
    render(<ClericDomains character={character} editable={false} onChange={onChange} />);
    const second = screen.getByRole("combobox", { name: "Domain 2" });
    expect(within(second).getByRole<HTMLOptionElement>("option", { name: "Healing" }).disabled).toBe(true);
    expect(within(second).getByRole<HTMLOptionElement>("option", { name: "Evil" }).disabled).toBe(true);
    expect(screen.getByText(/Mishakal \(Dragonlance\)/).textContent).toContain("aren't verified");
    fireEvent.change(second, { target: { value: "travel" } });
    expect(onChange).toHaveBeenCalledWith({ clericDomains: ["healing", "travel"] });
  });

  it("restricts mapped core deities to their domains and warns on invalid saved choices", () => {
    const character = cleric();
    character.deity = "pelor";
    character.clericDomains = ["war", "sun"];
    expect(clericDomainAllowed(character, "sun")).toBe(true);
    expect(clericDomainAllowed(character, "war")).toBe(false);
    expect(getActiveClericDomains(character)).toEqual(["sun"]);
    expect(getClericDomainWarnings(character).join(" ")).toContain(
      "War domain is not granted by Pelor",
    );
    render(<ClericDomains character={character} editable onChange={vi.fn()} />);
    expect(within(screen.getByRole("combobox", { name: "Domain 1" }))
      .getByRole<HTMLOptionElement>("option", { name: "War" }).disabled).toBe(true);
    expect(screen.getByText(/Only listed domains are available for this core deity/)).toBeDefined();
  });

  it("keeps unmapped Dragonlance deity domain choices manual", () => {
    const character = cleric();
    character.deity = "mishakal";
    character.clericDomains = ["healing", "travel"];
    expect(clericDomainAllowed(character, "travel")).toBe(true);
    render(<ClericDomains character={character} editable onChange={vi.fn()} />);
    expect(within(screen.getByRole("combobox", { name: "Domain 2" }))
      .getByRole<HTMLOptionElement>("option", { name: "Travel" }).disabled).toBe(false);
    expect(screen.getByText(/Domain associations aren't verified for this deity/)).toBeDefined();
  });

  it("never creates sparse domain arrays when the second picker is used first", () => {
    const character = cleric();
    character.clericDomains = [];
    const onChange = vi.fn();
    render(<ClericDomains character={character} editable onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 2" }), { target: { value: "travel" } });
    expect(onChange).toHaveBeenCalledWith({ clericDomains: ["travel"] });
  });

  it("labels automatic class skills separately from manually resolved powers and shows spell restrictions", () => {
    const character = cleric(20);
    character.abilities.wis = 20;
    character.clericDomains = ["animal", "fire"];
    character.clericDomainPreparation = { 4: { domain: "animal", spell: "Summon Nature's Ally IV" } };
    render(<ClericDomains character={character} editable={false} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Animal granted power"));
    expect(screen.getByText("Applied automatically:")).toBeDefined();
    expect(screen.getByText(/Speak with animals once per day/)).toBeDefined();
    expect(screen.getByText("Animals only.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Spell rules" }).getAttribute("href")).toContain("#animalDomain");
  });

  it("shows the supported War favored weapon as an automatic benefit", () => {
    const character = cleric();
    character.deity = "heironeous";
    character.clericDomains = ["war", "travel"];
    render(<ClericDomains character={character} editable={false} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("War granted power"));
    expect(screen.getByText(/Favored weapon: Longsword/)).toBeDefined();
    expect(screen.getByText(/Only listed domains are available for this core deity/)).toBeDefined();
  });

  it("requires explicit confirmation before changing established domains, and does not reset usage or remove preparation", () => {
    const character = cleric();
    character.clericDomainExpended = [1];
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Longstrider" } };
    const onChange = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ClericDomains character={character} editable={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Change domains" }));
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Domain 1" }).disabled).toBe(true);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Change domains" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 2" }), { target: { value: "plant" } });
    expect(onChange).toHaveBeenCalledWith({ clericDomains: ["healing", "plant"] });
    expect(onChange.mock.calls[0][0].clericDomainExpended).toBeUndefined();
    expect(onChange.mock.calls[0][0].clericDomainPreparation).toBeUndefined();
  });

  it("allows clearing an invalid saved spell, or replacing it with a valid same-domain spell", () => {
    const character = cleric();
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Teleport" } };
    const onChange = vi.fn();
    render(<ClericDomains character={character} editable={false} onChange={onChange} />);
    const select = screen.getByRole("combobox", { name: "Level 1 domain spell" });
    expect(within(select).getByRole("option", { name: /Teleport \(unavailable/ })).toBeDefined();
    fireEvent.change(select, { target: { value: "travel:Longstrider" } });
    expect(onChange).toHaveBeenLastCalledWith({ clericDomainPreparation: { 1: { domain: "travel", spell: "Longstrider" } } });
    fireEvent.change(select, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith({ clericDomainPreparation: {} });
  });

  it("separates domain preparation and usage from ordinary cleric and wizard slots, saves, and reloads", async () => {
    const character = cleric();
    character.classLevels.push({ classId: "wizard", level: 1 });
    character.preparedSpellsByClass = { wizard: ["Magic Missile"], cleric: ["Bless"] };
    save(character);
    const view = render(<App />);
    await openCleric();
    expect(screen.queryByRole("combobox", { name: "Level 0 domain spell" })).toBeNull();
    const domainSlot = screen.getByRole("combobox", { name: "Level 1 domain spell" });
    expect(within(domainSlot).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Not prepared", "Cure Light Wounds (Healing)", "Longstrider (Travel)",
    ]);
    fireEvent.change(domainSlot, { target: { value: "travel:Longstrider" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 1 domain slot" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 1 slot 1" }));
    expect(screen.queryByRole("spinbutton", { name: "Prepare Longstrider" })).toBeNull();
    expect(stored().clericDomainPreparation).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().clericDomainPreparation).toEqual({ 1: { domain: "travel", spell: "Longstrider" } });
    expect(stored().clericDomainExpended).toEqual([1]);
    expect(stored().expendedSpellSlotsByClass?.cleric?.[1]).toEqual([0]);
    expect(stored().preparedSpellsByClass).toEqual(character.preparedSpellsByClass);
    fireEvent.click(screen.getByRole("tab", { name: "Wizard · 1" }));
    expect(screen.queryByRole("heading", { name: "Cleric Domains" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset Wizard expended slots" }));
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 3" }));
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reset Cleric expended slots" }));
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(false);
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Level 1 domain spell" }).value).toBe("travel:Longstrider");
    view.unmount();
    render(<App />);
    await openCleric();
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(true);
  });

  it("updates domain class skills on the character sheet without adding ranks", async () => {
    const character = cleric();
    character.clericDomains = [];
    save(character);
    render(<App />);
    await openCleric();
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 1" }), { target: { value: "trickery" } });
    fireEvent.click(screen.getByRole("button", { name: "Character" }));
    const bluff = await screen.findByRole("group", { name: "Bluff skill" });
    expect(within(bluff).getByRole<HTMLInputElement>("checkbox").checked).toBe(true);
    expect(within(bluff).queryByText("Trained")).toBeNull();
    expect(stored().clericDomains).toEqual([]);
  });

  it("saves domain choices, preparation, and usage entered during character setup", async () => {
    const character = cleric(1);
    character.clericDomains = [];
    save(character);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Reopen Setup" }));
    await openCleric();
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 1" }), { target: { value: "travel" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 2" }), { target: { value: "healing" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Level 1 domain spell" }), { target: { value: "travel:Longstrider" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 1 domain slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().clericDomains).toEqual(["travel", "healing"]);
    expect(stored().clericDomainPreparation).toEqual({ 1: { domain: "travel", spell: "Longstrider" } });
    expect(stored().clericDomainExpended).toEqual([1]);
  });

  it("rolls back provisional domain selection, preparation, and usage when a level-up draft is discarded", async () => {
    const character = cleric(1);
    character.clericDomains = [];
    save(character);
    render(<App />);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    await openCleric();
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 1" }), { target: { value: "travel" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Domain 2" }), { target: { value: "healing" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Level 1 domain spell" }), { target: { value: "travel:Longstrider" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 1 domain slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    await openCleric();
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Domain 1" }).value).toBe("");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Level 1 domain spell" }).value).toBe("");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(false);
    expect(stored()).toEqual(character);
  });
});
