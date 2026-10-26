import { afterEach, describe, expect, it, vi } from "vitest";
import { storeItems, findStoreItem, addCustomStoreItems, deleteCustomStoreItem,
  type StoreItem } from "../src/data/equipmentCatalog";
import { getInventoryEntryDetails, getSizedStorePrice, getSizedStoreWeight } from "../src/rules";

afterEach(() => {
  vi.restoreAllMocks();
  storeItems.filter((item) => item.custom).forEach((item) => deleteCustomStoreItem(item.name));
});

describe("indexed equipment catalog", () => {
  it("matches the old longest-name lookup for every catalog item and forged variant", () => {
    const sorted = [...storeItems].sort((left, right) => right.name.length - left.name.length);
    for (const item of storeItems) {
      for (const name of [item.name, `Flaming +1 ${item.name}`]) {
        const oldMatch = sorted.find((entry) => entry.name === name) ??
          sorted.find((entry) => name.includes(entry.name));
        expect(findStoreItem(name)).toBe(oldMatch);
      }
    }
    expect(findStoreItem("Not a real equipment item")).toBeUndefined();
  });

  it("keeps variant matching, prices, and carried weights unchanged", () => {
    const sword = findStoreItem("Longsword");
    if (!sword) throw new Error("Missing longsword fixture.");
    expect(getSizedStorePrice(sword, "Large")).toBe(30);
    expect(getSizedStoreWeight(sword, "Small")).toBe("2 lb.");
    const details = getInventoryEntryDetails("Masterwork Longsword (Medium)");
    expect(details.price).toBe(315);
    expect(details.description).toContain("+1 enhancement bonus on attack rolls");
    expect(details.numericWeight).toBe(4);
    expect(findStoreItem("Masterwork Longsword", "Armor")).toBeUndefined();
  });

  it("invalidates indexes after custom additions and deletions", () => {
    const item: StoreItem = { name: "Regression Test Blade", category: "Weapons",
      custom: true, price: 20, weight: "2 lb.", damage: "1d8" };
    expect(findStoreItem(item.name)).toBeUndefined();
    addCustomStoreItems([item]);
    expect(findStoreItem(item.name)).toBe(item);
    expect(getInventoryEntryDetails(`${item.name} (Medium)`).price).toBe(20);
    addCustomStoreItems([item]);
    expect(storeItems.filter((entry) => entry.name === item.name)).toHaveLength(1);
    deleteCustomStoreItem(item.name);
    expect(findStoreItem(item.name)).toBeUndefined();
  });

  it("does not mutate the live catalog when persistence fails", () => {
    const item: StoreItem = { name: "Unsaved Test Blade", category: "Weapons",
      custom: true, price: 20, weight: "2 lb." };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
    expect(() => addCustomStoreItems([item])).toThrow("Storage full");
    expect(findStoreItem(item.name)).toBeUndefined();
  });
});
