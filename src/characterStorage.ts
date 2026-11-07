import { cloneCharacter, initialCharacter, type Character } from "./domain";
import { parseCharacter } from "./validation";

export const savedCharacterStorageKey = "dnd35-character-builder-character";
export const savedCharacterSetupDraftStorageKey = "dnd35-character-builder-setup-draft";

// Keep the version, character, and setup state in one localStorage write.
const storageVersion = 1;

export function loadSavedCharacter(): {
  character: Character;
  saved: boolean;
  setupDraft: boolean;
  error?: string;
} {
  const empty = () => ({
    character: cloneCharacter(initialCharacter),
    saved: false,
    setupDraft: false,
  });
  if (typeof window === "undefined") return empty();
  try {
    const stored = window.localStorage.getItem(savedCharacterStorageKey);
    if (!stored) return empty();
    const data: unknown = JSON.parse(stored);
    const versioned = Array.isArray(data) && data[0] === storageVersion;
    if (versioned && typeof data[2] !== "boolean") {
      throw new Error("Invalid.");
    }
    const character = parseCharacter(versioned ? data[1] : data);
    return {
      character,
      saved: true,
      setupDraft: versioned
        ? data[2] === true
        : window.localStorage.getItem(savedCharacterSetupDraftStorageKey) === "true",
    };
  } catch (error: unknown) {
    const message = String(error);
    console.error(message);
    return { ...empty(), error: message };
  }
}

export function saveCharacter(character: Character, setupDraft = false) {
  const normalizedCharacter = parseCharacter(character);
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify([storageVersion, normalizedCharacter, setupDraft]));
}
