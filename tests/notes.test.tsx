import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { parseCharacter } from "../src/validation";
import { savedCharacterStorageKey } from "../src/storage";
import { displayNoteDate, formatNoteDate } from "../src/noteDates";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

function loadHero() {
  const character = cloneCharacter(initialCharacter);
  character.notes = "An earlier adventure.";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}

async function enterNote(text: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Add Note" }));
  const dialog = screen.getByRole("dialog", { name: "Add Character Note" });
  await user.type(within(dialog).getByRole("textbox", { name: "Note" }), text);
  await user.click(within(dialog).getByRole("button", { name: "Add Note" }));
}

it("appends dated notes without replacing existing notes and persists through reload", async () => {
  loadHero();
  const date = formatNoteDate(new Date());
  const { unmount } = render(<App />);
  await enterNote("Found the lost map.");
  await enterNote("Met a helpful wizard.");
  const expected = `An earlier adventure.\n\n[${date}]\nFound the lost map.\n\n[${date}]\nMet a helpful wizard.`;
  expect([...document.querySelectorAll(".character-note-date")].map((entry) => entry.textContent))
    .toEqual(["Undated", date, date]);
  expect([...document.querySelectorAll(".character-note-text")].map((entry) => entry.textContent))
    .toEqual(["An earlier adventure.", "Found the lost map.", "Met a helpful wizard."]);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).notes).toBe(expected);
  unmount();
  render(<App />);
  expect([...document.querySelectorAll(".character-note-text")].map((entry) => entry.textContent))
    .toEqual(["An earlier adventure.", "Found the lost map.", "Met a helpful wizard."]);
});

it("disables blank submissions and clears canceled text", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Add Note" }));
  const dialog = screen.getByRole("dialog");
  const submit = within(dialog).getByRole<HTMLButtonElement>("button", { name: "Add Note" });
  expect(submit.disabled).toBe(true);
  await user.type(within(dialog).getByRole("textbox"), "   ");
  expect(submit.disabled).toBe(true);
  await user.type(within(dialog).getByRole("textbox"), "Canceled note");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(document.querySelector(".character-notes")?.textContent).toBe("No notes recorded.");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add Note" }));
  await user.click(screen.getByRole("button", { name: "Add Note" }));
  expect(within(screen.getByRole("dialog")).getByRole<HTMLTextAreaElement>("textbox").value).toBe("");
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("adds creation notes to the creation draft", async () => {
  render(<App />);
  await enterNote("A new beginning.");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).notes)
    .toContain("A new beginning.");
});

it("discards notes added during level-up when the draft is discarded", async () => {
  loadHero();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
  await enterNote("Provisional note");
  expect(document.querySelector(".character-notes")?.textContent).toContain("Provisional note");
  fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
  expect(document.querySelector(".character-note-text")?.textContent).toBe("An earlier adventure.");
});

it("preserves multiline note bodies and undated legacy notes in separate columns", () => {
  const character = cloneCharacter(initialCharacter);
  character.notes = "Legacy background.\nStill part of the background.\n\n[10/25/2026]\nFirst line\nSecond line\n\nAnother paragraph.";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  render(<App />);
  const entries = document.querySelectorAll(".character-note-entry");
  expect(entries).toHaveLength(2);
  expect(entries[0].querySelector(".character-note-date")?.textContent).toBe("Undated");
  expect(entries[0].querySelector(".character-note-text")?.textContent).toBe("Legacy background.\nStill part of the background.");
  expect(entries[1].querySelector(".character-note-date")?.textContent).toBe("Oct 25, 2026");
  expect(entries[1].querySelector(".character-note-text")?.textContent).toBe("First line\nSecond line\n\nAnother paragraph.");
});

it("uses a short month, day, and year while preserving unrecognized date labels", () => {
  expect(formatNoteDate(new Date(2026, 9, 25))).toBe("Oct 25, 2026");
  expect(displayNoteDate("10/25/2026")).toBe("Oct 25, 2026");
  expect(displayNoteDate("1/5/2026")).toBe("Jan 5, 2026");
  expect(displayNoteDate("2/30/2026")).toBe("2/30/2026");
  expect(displayNoteDate("25/10/2026")).toBe("25/10/2026");
  expect(displayNoteDate("Campaign day 3")).toBe("Campaign day 3");
});

it("toggles handwritten styling from the notes header without changing note content", async () => {
  loadHero();
  const user = userEvent.setup();
  render(<App />);
  const toggle = screen.getByRole("switch", { name: "Handwritten" });
  const panel = document.querySelector(".notes-panel");
  expect(toggle.closest(".panel-title")).not.toBeNull();
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  expect(panel?.classList.contains("notes-handwritten")).toBe(true);
  await user.click(toggle);
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  expect(panel?.classList.contains("notes-handwritten")).toBe(false);
  expect(document.querySelector(".character-note-text")?.textContent).toBe("An earlier adventure.");
  await user.keyboard(" ");
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  expect(panel?.classList.contains("notes-handwritten")).toBe(true);
});
