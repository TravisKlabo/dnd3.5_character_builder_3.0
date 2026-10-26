import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { storeItems, findStoreItem } = await server.ssrLoadModule("/src/data/equipmentCatalog.ts");
  const keys = storeItems.flatMap((item) => [item.name, `Flaming +1 ${item.name}`]);
  const legacyLookup = (name) => [...storeItems]
    .sort((left, right) => right.name.length - left.name.length)
    .find((item) => item.name === name) ?? [...storeItems]
    .sort((left, right) => right.name.length - left.name.length)
    .find((item) => name.includes(item.name));
  for (const key of keys) assert.equal(findStoreItem(key), legacyLookup(key));
  const iterations = 20_000;
  const measure = (lookup) => {
    let matches = 0;
    const start = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      if (lookup(keys[index % keys.length])) matches += 1;
    }
    assert.equal(matches, iterations);
    return performance.now() - start;
  };
  measure(findStoreItem);
  const baseline = measure(legacyLookup);
  const optimized = measure(findStoreItem);
  const speedup = baseline / optimized;
  console.log(JSON.stringify({
    catalogItems: storeItems.length, iterations,
    baselineMs: Number(baseline.toFixed(2)),
    optimizedMs: Number(optimized.toFixed(2)),
    speedup: Number(speedup.toFixed(2)),
    equivalentResults: true,
  }, null, 2));
  if (speedup < 2) throw new Error("Catalog lookup did not meet the 2x improvement target.");
} finally {
  await server.close();
}
