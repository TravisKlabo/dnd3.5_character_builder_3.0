import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { loadClassFeatureProgression } from "../src/data/classFeatureProgression";
import { loadFeatCatalog } from "../src/data/featCatalogLoader";
import { loadCompleteDivineCatalog } from "../src/data/completeDivineCatalogLoader";
import "../src/data/equipmentCatalog";

beforeAll(async () => {
  await Promise.all([
    loadClassFeatureProgression(),
    loadFeatCatalog(),
    loadCompleteDivineCatalog(),
  ]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
