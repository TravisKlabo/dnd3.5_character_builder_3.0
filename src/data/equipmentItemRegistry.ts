import type { StoreCategory, StoreItem } from "./itemTypes";

let items: StoreItem[] = [];
let aliases: ReadonlyMap<string, string> = new Map();
let revision = 0;
let indexedRevision = -1;
let sortedItems: StoreItem[] = [];
const itemsByName = new Map<string, StoreItem>();

export function registerEquipmentCatalog(
  catalogItems: StoreItem[],
  catalogAliases: ReadonlyMap<string, string>,
) {
  items = catalogItems;
  aliases = catalogAliases;
  revision += 1;
}

export function getStoreItems() {
  return items;
}

export function findStoreItem(name: string, category?: StoreCategory) {
  if (indexedRevision !== revision) {
    sortedItems = [...items].sort((left, right) => right.name.length - left.name.length);
    itemsByName.clear();
    for (const item of items) {
      if (!itemsByName.has(item.name)) itemsByName.set(item.name, item);
    }
    indexedRevision = revision;
  }
  const exact = itemsByName.get(name) ?? itemsByName.get(aliases.get(name) ?? "");
  if (exact && (!category || exact.category === category)) return exact;
  return sortedItems.find((item) => (!category || item.category === category) && name.includes(item.name));
}
