import { useEffect, useSyncExternalStore } from "react";
import { dragonlancePrestigeClasses, isIndependentSpellcastingClass, type Character, type ContentSourceId, type RulesetId, type SpellcastingClassId } from "../domain";
import type { SrdSpell } from "../srdSpells";
import { getClericDomain } from "./clericDomains";
import { getPrestigeClericDomains } from "../prestigeDomainRules";

export const srdSpellContentSource: ContentSourceId = "core-35-srd";
export const defaultSrdSpellSourceBook = "Player's Handbook (3.5)";

const spellNameAliases: Record<string, string> = {
  "greater arcane sight": "arcane sight, greater",
  "greater command": "command, greater",
  "greater heroism": "heroism, greater",
  "greater restoration": "restoration, greater",
  "lesser restoration": "restoration, lesser",
  "lesser planar ally": "planar ally, lesser",
  "phantom trap": "leomund's trap",
  "otto's irresistible dance": "irresistible dance",
  "rary's telepathic bond": "telepathic bond",
  "tasha's hideous laughter": "hideous laughter",
  "dance of blades": "dancing blade",
  "invisibility to undead": "hide from undead",
  "whelming burst": "whelming blast",
};

const beguilerSpellLevels: Record<string, number> = {
  "Dancing Lights": 0, "Daze": 0, "Detect Magic": 0, "Ghost Sound": 0,
  "Message": 0, "Open/Close": 0, "Read Magic": 0,
  "Charm Person": 1, "Color Spray": 1, "Comprehend Languages": 1,
  "Detect Secret Doors": 1, "Disguise Self": 1, "Expeditious Retreat": 1,
  "Hypnotism": 1, "Mage Armor": 1, "Obscuring Mist": 1, "Silent Image": 1,
  "Sleep": 1, "Undetectable Alignment": 1,
  "Blur": 2, "Daze Monster": 2, "Detect Thoughts": 2, "Fog Cloud": 2,
  "Glitterdust": 2, "Hypnotic Pattern": 2, "Invisibility": 2, "Knock": 2,
  "Minor Image": 2, "Mirror Image": 2, "Misdirection": 2,
  "See Invisibility": 2, "Silence": 2, "Spider Climb": 2, "Touch of Idiocy": 2,
  "Arcane Sight": 3, "Clairaudience/Clairvoyance": 3, "Deep Slumber": 3,
  "Dispel Magic": 3, "Displacement": 3, "Glibness": 3, "Haste": 3,
  "Hold Person": 3, "Invisibility Sphere": 3, "Major Image": 3,
  "Nondetection": 3, "Slow": 3, "Suggestion": 3, "Zone of Silence": 3,
  "Charm Monster": 4, "Confusion": 4, "Crushing Despair": 4,
  "Freedom of Movement": 4, "Invisibility, Greater": 4, "Locate Creature": 4,
  "Rainbow Pattern": 4, "Solid Fog": 4,
  "Break Enchantment": 5, "Dominate Person": 5, "Feeblemind": 5,
  "Hold Monster": 5, "Mind Fog": 5, "Telepathic Bond": 5, "Seeming": 5,
  "Sending": 5,
  "Dispel Magic, Greater": 6, "Suggestion, Mass": 6, "Mislead": 6,
  "Repulsion": 6, "Shadow Walk": 6, "True Seeing": 6, "Veil": 6,
  "Ethereal Jaunt": 7, "Arcane Sight, Greater": 7, "Hold Person, Mass": 7,
  "Invisibility, Mass": 7, "Phase Door": 7, "Power Word Blind": 7,
  "Project Image": 7, "Spell Turning": 7,
  "Demand": 8, "Discern Location": 8, "Mind Blank": 8,
  "Moment of Prescience": 8, "Power Word Stun": 8, "Scintillating Pattern": 8,
  "Screen": 8,
  "Dominate Monster": 9, "Etherealness": 9, "Foresight": 9,
  "Hold Monster, Mass": 9, "Power Word Kill": 9, "Time Stop": 9,
};

const duskbladeSpellLevels: Record<string, number> = {
  "Acid Splash": 0, "Disrupt Undead": 0, "Ray of Frost": 0, "Touch of Fatigue": 0,
  "Burning Hands": 1, "Cause Fear": 1, "Chill Touch": 1, "Color Spray": 1,
  "Jump": 1, "Magic Weapon": 1, "Obscuring Mist": 1, "Ray of Enfeeblement": 1,
  "Resist Energy": 1, "Shocking Grasp": 1, "Expeditious Retreat": 1,
  "True Strike": 1,
  "Bear's Endurance": 2, "Bull's Strength": 2, "Cat's Grace": 2,
  "Darkvision": 2, "Ghoul Touch": 2, "Melf's Acid Arrow": 2,
  "Scorching Ray": 2, "See Invisibility": 2, "Spider Climb": 2,
  "Touch of Idiocy": 2, "Swift Fly": 2, "Swift Invisibility": 2,
  "Magic Weapon, Greater": 3, "Keen Edge": 3, "Protection from Energy": 3,
  "Ray of Exhaustion": 3, "Vampiric Touch": 3,
  "Interposing Hand": 4, "Dimension Door": 4, "Dispel Magic": 4,
  "Enervation": 4, "Fire Shield": 4, "Phantasmal Killer": 4, "Shout": 4,
  "Clenched Fist": 5, "Chain Lightning": 5, "Disintegrate": 5,
  "Hold Monster": 5, "Polar Ray": 5, "Waves of Fatigue": 5,
  "Swift Expeditious Retreat": 1,
};

type CompleteDivineSpellLists = typeof import("./completeDivineSpellLists");
let completeDivineSpellLists: CompleteDivineSpellLists | undefined;

export function getSrdSpellSourceBook(spell: Pick<SrdSpell, "sourceBook">) {
  return spell.sourceBook === null ? undefined : spell.sourceBook ?? defaultSrdSpellSourceBook;
}

export function getSrdSpellContentSource(spell: Pick<SrdSpell, "source">): ContentSourceId {
  return spell.source ?? srdSpellContentSource;
}

export const spells: SrdSpell[] = [];
const spellsByClass = new Map<string, SrdSpell[]>();
const spellsByName = new Map<string, SrdSpell>();
const spellsByNormalizedName = new Map<string, SrdSpell>();
type CatalogState = { status: "idle" | "loading" | "ready" | "error"; error?: string };
let state: CatalogState = { status: "idle" };
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();

export function normalizeSpellName(name: string) {
  const normalized = name.normalize("NFKC").replace(/[‘’]/g, "'").toLowerCase();
  return spellNameAliases[normalized] ?? normalized;
}

function publish(next: CatalogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function loadSpellCatalog(): Promise<void> {
  if (state.status === "ready") return Promise.resolve();
  if (pending) return pending;
  publish({ status: "loading" });
  pending = Promise.all([
    import("../srdSpells"),
    import("./dragonlanceSpells"),
    import("./monsterManualSpells"),
    import("./phb2Spells"),
    import("./completeDivineSpells"),
    import("./completeDivineSpellLists"),
  ]).then(([{ srdSpells }, { dragonlanceSpells }, { monsterManualSpells }, { phb2Spells }, { completeDivineSpells }, spellLists]) => {
    completeDivineSpellLists = spellLists;
    spells.push(...srdSpells, ...dragonlanceSpells, ...monsterManualSpells, ...phb2Spells, ...completeDivineSpells);
    for (const spell of spells) {
      if (!spellsByName.has(spell.name)) spellsByName.set(spell.name, spell);
      const normalizedName = normalizeSpellName(spell.name);
      if (!spellsByNormalizedName.has(normalizedName))
        spellsByNormalizedName.set(normalizedName, spell);
    }
    publish({ status: "ready" });
  }).catch((error: unknown) => {
    publish({ status: "error", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }).finally(() => { pending = undefined; });
  return pending;
}

export function isSpellCatalogLoaded() {
  return state.status === "ready";
}

export function getSpellLevelForClass(spell: SrdSpell, classId: string): number {
  const classLevel = Object.entries(spell.classLevels ?? {})
    .find(([listedClassId]) => listedClassId === classId)?.[1];
  const mysticClericLevel = classId === "mystic" ? spell.classLevels?.cleric : undefined;
  return classLevel ?? mysticClericLevel ?? spell.level;
}

export function getShugenjaOrderSpell(
  order: Character["shugenjaOrder"],
  level: number,
) {
  return completeDivineSpellLists?.getShugenjaOrderSpell(order, level);
}

export function isSpellClassAccessAllowed(
  spell: Pick<SrdSpell, "requiredHighSorceryOrder">,
  classId: string,
  character?: Pick<Character, "highSorceryOrder">,
): boolean {
  if (!spell.requiredHighSorceryOrder) return true;
  return classId === "wizard" && character?.highSorceryOrder === spell.requiredHighSorceryOrder;
}

export function getClassSpells(
  classId: SpellcastingClassId,
  ruleset: RulesetId = "core-35-srd",
  character?: Pick<
    Character,
    "classLevels" | "highSorceryOrder" | "divineCrusaderDomain" | "piousTemplarSpellList" |
    "shugenjaElement" | "shugenjaOrder" | "clericUndeadTurningMode" | "alignment" |
    "contemplativeDomains" | "radiantServantDomain"
  >,
): SrdSpell[] {
  if (state.status !== "ready") throw new Error("The spell catalog has not loaded.");
  const whiteWizardAccess = classId === "wizard" && character?.highSorceryOrder === "white";
  const classLevel = character?.classLevels.find((entry) =>
    "prestigeClassId" in entry && entry.prestigeClassId === classId,
  )?.level ?? 0;
  const cacheKey = [
    classId, ruleset, whiteWizardAccess ? "white" : "standard", classLevel,
    character?.divineCrusaderDomain ?? "",
    character?.piousTemplarSpellList ?? "",
    character?.shugenjaElement ?? "",
    character?.shugenjaOrder ?? "",
    character ? getPrestigeClericDomains(character).join(",") : "",
    character?.classLevels
      .filter((entry) => "prestigeClassId" in entry)
      .map((entry) => `${entry.prestigeClassId}:${entry.level}`)
      .join(",") ?? "",
  ].join(":");
  let entries = spellsByClass.get(cacheKey);
  if (!entries && classId === "favored-soul") {
    entries = getClassSpells("cleric", ruleset, character);
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && classId === "spirit-shaman") {
    entries = getClassSpells("druid", ruleset, character);
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && classId === "ur-priest") {
    entries = getClassSpells("cleric", ruleset, character);
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && classId === "divine-crusader" &&
      character?.divineCrusaderDomain) {
    const domainSpells = getClericDomain(character.divineCrusaderDomain).spells;
    entries = [...new Map(spells.flatMap((spell) => {
      const level = domainSpells.findIndex((name) =>
        normalizeSpellName(name) === normalizeSpellName(spell.name));
      return level < 0 ? [] : [
        [normalizeSpellName(spell.name), { ...spell, level: level + 1 }] as const,
      ];
    })).values()];
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && classId === "pious-templar" &&
      character?.piousTemplarSpellList) {
    entries = getClassSpells(character.piousTemplarSpellList, ruleset, character);
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && (
    classId === "consecrated-harrier" ||
    classId === "holy-liberator"
  )) {
    const baseEntries = getClassSpells(
      classId === "consecrated-harrier" ? "ranger" : "paladin",
      ruleset,
      character,
    );
    const added = classId === "consecrated-harrier"
      ? completeDivineSpellLists?.consecratedHarrierAddedSpellLevels
      : completeDivineSpellLists?.holyLiberatorAddedSpellLevels;
    const levels = new Map(
      Object.entries(added ?? {}).map(([name, level]) => [normalizeSpellName(name), level]),
    );
    const additions = spells.flatMap((spell) => {
      const level = levels.get(normalizeSpellName(spell.name));
      return level === undefined ? [] : [{ ...spell, level }];
    });
    entries = [...new Map([
      ...baseEntries.filter((spell) =>
        classId !== "holy-liberator" || !/\[Law\]/i.test(spell.school),
      ),
      ...additions,
    ].map((spell) =>
      [normalizeSpellName(spell.name), spell] as const,
    )).values()];
    spellsByClass.set(cacheKey, entries);
  }
  const fixedClassSpellLevels =
    classId === "beguiler" ? beguilerSpellLevels :
    classId === "duskblade" ? duskbladeSpellLevels :
    classId === "blighter" ? completeDivineSpellLists?.blighterSpellLevels :
    classId === "shugenja" ?
      completeDivineSpellLists?.getShugenjaSpellLevels(
        character?.shugenjaElement,
        character?.shugenjaOrder,
      ) :
    classId === "temple-raider-of-olidammara" ?
      completeDivineSpellLists?.templeRaiderSpellLevels :
    undefined;
  if (!entries && fixedClassSpellLevels) {
    const levelsByNormalizedName = new Map(
      Object.entries(fixedClassSpellLevels).map(([name, level]) =>
        [normalizeSpellName(name), level] as const,
      ),
    );
    entries = spells.filter((spell) =>
      levelsByNormalizedName.has(normalizeSpellName(spell.name)),
    ).map((spell) => ({
      ...spell,
      level: levelsByNormalizedName.get(normalizeSpellName(spell.name)) ?? spell.level,
    }));
    entries.push(...spells.filter((spell) =>
      spell.classes.includes(classId),
    ).map((spell) => ({ ...spell })));
    entries = [...new Map(entries.map((spell) =>
      [normalizeSpellName(spell.name), spell] as const,
    )).values()];
    if (classId === "temple-raider-of-olidammara" && classLevel >= 10) {
      const existing = new Set(entries.map((spell) => normalizeSpellName(spell.name)));
      const luckSpells = completeDivineSpellLists?.clericLuckDomainSpellNames.slice(0, 4) ?? [];
      entries.push(...spells.flatMap((spell) =>
        luckSpells.includes(spell.name) && !existing.has(normalizeSpellName(spell.name))
          ? [{ ...spell, level: luckSpells.indexOf(spell.name) + 1 }]
          : []),
      );
    }
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries && isIndependentSpellcastingClass(classId)) {
    entries = Object.entries(dragonlancePrestigeClasses[classId].referenceSpellList?.levels ?? {})
      .flatMap(([level, names]) => names.flatMap((name) => {
        const spell = findSpellByName(name === "Protection from Elements" ? "Protection from Energy" : name);
        if (!spell) return [];
        return [{
          ...spell,
          level: Number(level),
          ...(name === "Protection from Elements" ? {
            description: `${spell.description} The DMG lists “Protection from Elements”; confirm this 3.5 equivalent with the DM.`,
          } : /^Summon Monster /.test(name) ? {
            description: `${spell.description} This Blackguard spell can summon only evil creatures.`,
          } : {}),
        }];
      }));
    const listedNames = new Set(entries.map((spell) => normalizeSpellName(spell.name)));
    for (const spell of spells) {
      const name = normalizeSpellName(spell.name);
      if (!spell.classes.includes(classId) || listedNames.has(name)) continue;
      if (getSrdSpellContentSource(spell) !== srdSpellContentSource && ruleset === "core-35-srd") continue;
      entries.push({ ...spell, level: getSpellLevelForClass(spell, classId) });
      listedNames.add(name);
    }
    spellsByClass.set(cacheKey, entries);
  }
  if (!entries) {
    entries = spells.filter((spell) =>
      spell.classes.includes(classId) ||
      (classId === "mystic" && spell.classes.includes("cleric")),
    ).filter((spell) =>
      getSrdSpellContentSource(spell) === srdSpellContentSource || ruleset !== "core-35-srd",
    ).filter((spell) =>
      isSpellClassAccessAllowed(spell, classId, whiteWizardAccess ? { highSorceryOrder: "white" } : undefined),
    ).filter((spell) =>
      !(classId === "bard" && ruleset !== "core-35-srd" &&
        spell.school === "Conjuration (Healing)"),
    ).map((spell) => {
      const level = getSpellLevelForClass(spell, classId);
      return level === spell.level ? spell : { ...spell, level };
    });
    spellsByClass.set(cacheKey, entries);
  }
  if (character) {
    const additional = getPrestigeClericDomains(character).flatMap((domain) =>
      getClericDomain(domain).spells.flatMap((name, index) => {
        const spell = findSpellByName(name);
        return spell ? [{ ...spell, level: index + 1 }] : [];
      }),
    );
    const rainbowEntry = character.classLevels.find((entry) =>
      "prestigeClassId" in entry && entry.prestigeClassId === "rainbow-servant",
    );
    if (
      rainbowEntry?.level === 10 &&
      "prestigeClassId" in rainbowEntry &&
      rainbowEntry.classId === classId
    ) {
      additional.push(...getClassSpells("cleric", ruleset, character).map((spell) => ({
        ...spell,
      })));
    }
    entries = [...new Map(
      [...entries, ...additional].map((spell) =>
        [normalizeSpellName(spell.name), spell] as const,
      ),
    ).values()];
    spellsByClass.set(cacheKey, entries);
  }
  return entries;
}

export function findSpellByName(name: string) {
  return spellsByName.get(name) ?? spellsByNormalizedName.get(normalizeSpellName(name));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const getSnapshot = () => state;

export function useSpellCatalog(required: boolean) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const retry = () => {
    void loadSpellCatalog().catch((error: unknown) => console.error("Unable to load spell rules.", error));
  };
  useEffect(() => {
    if (required) retry();
  }, [required]);
  return { ...snapshot, ready: !required || snapshot.status === "ready", retry };
}
