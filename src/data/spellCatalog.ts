import { useEffect, useSyncExternalStore } from "react";
import type { ClassId } from "../domain";
import type { SrdSpell } from "../srdSpells";

export const spells: SrdSpell[] = [];
const spellsByClass = new Map<ClassId, SrdSpell[]>();
const spellsByName = new Map<string, SrdSpell>();
type CatalogState = { status: "idle" | "loading" | "ready" | "error"; error?: string };
let state: CatalogState = { status: "idle" };
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();

function publish(next: CatalogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function loadSpellCatalog(): Promise<void> {
  if (state.status === "ready") return Promise.resolve();
  if (pending) return pending;
  publish({ status: "loading" });
  pending = import("../srdSpells").then(({ srdSpells }) => {
    spells.push(...srdSpells);
    for (const spell of spells) {
      if (!spellsByName.has(spell.name)) spellsByName.set(spell.name, spell);
    }
    publish({ status: "ready" });
  }).catch((error: unknown) => {
    publish({ status: "error", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }).finally(() => { pending = undefined; });
  return pending;
}

export function getClassSpells(classId: ClassId): SrdSpell[] {
  if (state.status !== "ready") throw new Error("The spell catalog has not loaded.");
  let entries = spellsByClass.get(classId);
  if (!entries) {
    entries = spells.filter((spell) => spell.classes.includes(classId));
    spellsByClass.set(classId, entries);
  }
  return entries;
}

export function findSpellByName(name: string) {
  return spellsByName.get(name);
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
