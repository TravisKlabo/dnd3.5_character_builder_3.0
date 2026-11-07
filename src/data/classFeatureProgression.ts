import { useEffect, useSyncExternalStore } from "react";
import type { ClassId, PrestigeClassId } from "../domain";
import type { ClassFeatureLevel } from "./classFeatureProgressionData";

type CatalogStatus = {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
};

export const prestigeClassFeatureProgression: Partial<
  Record<PrestigeClassId, ClassFeatureLevel[]>
> = {};
export const classFeatureProgression: Partial<
  Record<ClassId, ClassFeatureLevel[]>
> = {};

let state: CatalogStatus = { status: "idle" };
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();

function publish(next: CatalogStatus) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function isClassFeatureProgressionLoaded() {
  return state.status === "ready";
}

export function loadClassFeatureProgression(): Promise<void> {
  if (state.status === "ready") return Promise.resolve();
  if (pending) return pending;
  publish({ status: "loading" });
  pending = import("./classFeatureProgressionData")
    .then((catalog) => {
      Object.assign(classFeatureProgression, catalog.classFeatureProgression);
      Object.assign(
        prestigeClassFeatureProgression,
        catalog.prestigeClassFeatureProgression,
      );
      publish({ status: "ready" });
    })
    .catch((error: unknown) => {
      publish({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

export function useClassFeatureProgression() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const retry = () => {
    void loadClassFeatureProgression().catch((error: unknown) =>
      console.error("Unable to load class progression rules.", error),
    );
  };
  useEffect(() => {
    if (snapshot.status === "idle") retry();
  }, [snapshot.status]);
  return { ...snapshot, retry };
}
