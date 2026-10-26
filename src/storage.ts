import { cloneCharacter, initialCharacter, type Character } from "./domain";
import { parseCharacter, parseCustomItems } from "./validation";

export const customStoreItemsStorageKey = "dnd35-character-builder.custom-store-items";

export const savedCharacterStorageKey = "dnd35-character-builder-character";

export function loadSavedCharacter(): { character: Character; saved: boolean; error?: string } {
  const empty = () => ({ character: cloneCharacter(initialCharacter), saved: false });
  if (typeof window === "undefined") return empty();
  try {
    const stored = window.localStorage.getItem(savedCharacterStorageKey);
    if (!stored) return empty();
    const character = parseCharacter(JSON.parse(stored));
    return {
      character: {
        ...character,
        classLevels: character.classLevels.filter(
          (level) =>
            !("prestigeClassId" in level && level.prestigeClassId === "wizard-of-high-sorcery"),
        ),
      },
      saved: true,
    };
  } catch (error: unknown) {
    const message = `Unable to load the saved character. ${error instanceof Error ? error.message : String(error)}`;
    console.error(message);
    return { ...empty(), error: message };
  }
}

export function loadCustomStoreItems() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(customStoreItemsStorageKey);
    if (!stored) return [];
    return parseCustomItems(JSON.parse(stored));
  } catch (error: unknown) {
    console.error("Unable to load custom store items. The stored catalog has not been changed.", error);
    return [];
  }
}

export function saveCharacter(character: Character) {
  parseCharacter(character);
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}
