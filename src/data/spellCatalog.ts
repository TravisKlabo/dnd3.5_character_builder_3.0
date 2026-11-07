import { useEffect, useSyncExternalStore } from "react";
import type { Character, ClassId, ContentSourceId, RulesetId } from "../domain";
import type { SrdSpell } from "../srdSpells";

export const srdSpellContentSource: ContentSourceId = "core-35-srd";
export const defaultSrdSpellSourceBook = "Player's Handbook (3.5)";

const spellNameAliases: Record<string, string> = {
  "greater arcane sight": "arcane sight, greater",
  "greater command": "command, greater",
  "greater heroism": "heroism, greater",
  "greater restoration": "restoration, greater",
  "lesser restoration": "restoration, lesser",
  "otto's irresistible dance": "irresistible dance",
  "rary's telepathic bond": "telepathic bond",
  "tasha's hideous laughter": "hideous laughter",
};

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
  ]).then(([{ srdSpells }, { dragonlanceSpells }]) => {
    spells.push(...srdSpells, ...dragonlanceSpells);
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

export function getSpellLevelForClass(spell: SrdSpell, classId: string): number {
  const classLevel = Object.entries(spell.classLevels ?? {})
    .find(([listedClassId]) => listedClassId === classId)?.[1];
  const mysticClericLevel = classId === "mystic" ? spell.classLevels?.cleric : undefined;
  return classLevel ?? mysticClericLevel ?? spell.level;
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
  classId: ClassId,
  ruleset: RulesetId = "core-35-srd",
  character?: Pick<Character, "highSorceryOrder">,
): SrdSpell[] {
  if (state.status !== "ready") throw new Error("The spell catalog has not loaded.");
  const whiteWizardAccess = classId === "wizard" && character?.highSorceryOrder === "white";
  const cacheKey = `${classId}:${ruleset}:${whiteWizardAccess ? "white" : "standard"}`;
  let entries = spellsByClass.get(cacheKey);
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
