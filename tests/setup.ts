import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { loadClassFeatureProgression } from "../src/data/classFeatureProgression";
import { loadFeatCatalog } from "../src/data/featCatalogLoader";
import "../src/data/equipmentCatalog";

beforeAll(async () => {
  await Promise.all([loadClassFeatureProgression(), loadFeatCatalog()]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
