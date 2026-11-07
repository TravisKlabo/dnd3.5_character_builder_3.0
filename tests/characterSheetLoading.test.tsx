import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { savedCharacterStorageKey } from "../src/storage";

beforeEach(() => {
  window.localStorage.clear();
});

it("loads the deferred character sheet and shows accessible placeholders for pickers", async () => {
  const character = cloneCharacter(initialCharacter);
  character.abilities.int = 14;
  character.classLevels = [{ classId: "wizard", level: 1 }];
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));

  render(<App />);
  const screenPlaceholder = await screen.findByText("Loading screen...");
  expect(screenPlaceholder.getAttribute("role")).toBe("status");
  await screen.findByRole("heading", { name: "Ability Scores" });
  await screen.findByRole("button", { name: "Reopen Setup" });
  fireEvent.click(screen.getByRole("button", { name: "Reopen Setup" }));

  const pickerPlaceholders = [
    ...screen.getAllByText("Loading language choices..."),
    ...screen.getAllByText("Loading feat choices..."),
  ];
  expect(pickerPlaceholders).toHaveLength(4);
  for (const placeholder of pickerPlaceholders) {
    const status = placeholder.closest('[role="status"]');
    expect(status?.getAttribute("aria-busy")).toBe("true");
    expect(status?.closest("label")).not.toBeNull();
  }
});
