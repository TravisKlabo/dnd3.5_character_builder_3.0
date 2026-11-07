import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { loadClassFeatureProgression } from "../src/data/classFeatureProgression";
import "../src/data/equipmentCatalog";

beforeAll(async () => {
  await loadClassFeatureProgression();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
