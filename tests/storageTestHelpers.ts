import { savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";

export function readStoredCharacter() {
  const record = JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null");
  return parseCharacter(
    Array.isArray(record) && record[0] === 1 ? record[1] : record,
  );
}
