import { parseCustomItems } from "./validation";

export const customStoreItemsStorageKey = "dnd35-character-builder.custom-store-items";
export let customItemsLoadFailed = false;

export function loadCustomStoreItems() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(customStoreItemsStorageKey);
    if (!stored) return [];
    return parseCustomItems(JSON.parse(stored));
  } catch (error: unknown) {
    customItemsLoadFailed = true;
    console.error(error);
    return [];
  }
}
