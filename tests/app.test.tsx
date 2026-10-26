import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";

function savedHero() {
  const character = cloneCharacter(initialCharacter);
  character.name = "Regression Hero";
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
  return character;
}

describe("application workflows", () => {
  it.each([false, true])("preserves free-form age and weight in setup/finalized mode (saved: %s)", (saved) => {
    if (saved) savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const view = render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Age:" : "Age" }), { target: { value: "about 30" } });
    fireEvent.change(screen.getByRole("textbox", { name: saved ? "Weight:" : "Weight" }), { target: { value: "82.5 kg" } });
    expect(screen.queryByRole("button", { name: /(?:Increase|Decrease) (?:age|weight)/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const character = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(character.age).toBe("about 30");
    expect(character.weight).toBe("82.5 kg");
    view.unmount();
    render(<App />);
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Age:" }).value).toBe("about 30");
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Weight:" }).value).toBe("82.5 kg");
    fireEvent.change(screen.getByRole("textbox", { name: "Age:" }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Weight:" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const cleared = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(cleared.age).toBe("");
    expect(cleared.weight).toBe("");
  });

  it.each(["5 ft 7 in", "170 cm"])("accepts and saves height as one text field: %s", (height) => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    const field = screen.getByRole("textbox", { name: "Height" });
    fireEvent.change(field, { target: { value: height } });
    expect(screen.queryByRole("textbox", { name: "Height in feet" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(saved.height).toBe(height);
    expect(screen.getByText(height, { exact: true })).toBeDefined();
  });

  it("edits finalized height without converting the entered units", () => {
    savedHero();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Height:" }), { target: { value: "180 cm" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).height).toBe("180 cm");
    expect(screen.queryByRole("button", { name: "Increase height" })).toBeNull();
  });

  it("opens setup for new characters and has no print or PDF controls", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Create Character" })).toBeDefined();
    expect(screen.queryByPlaceholderText("Background, goals, allies, and other details.")).toBeNull();
    expect(screen.getByRole("heading", { name: "Character Notes" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /print|pdf/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Import" })).toBeDefined();
  });

  it("preserves existing characters, lazy screens, and level-up cancellation", async () => {
    const user = userEvent.setup();
    const original = savedHero();
    render(<App />);
    const tabs = within(screen.getByRole("navigation", { name: "Character sheets" }));
    await user.click(tabs.getByRole("button", { name: "Equipment" }));
    await screen.findByText("EQUIPMENT SLOTS");
    await user.click(tabs.getByRole("button", { name: "Store" }));
    await screen.findByRole("heading", { name: "General Store" });
    await user.click(tabs.getByRole("button", { name: "Forge" }));
    await screen.findByRole("heading", { name: "Forge" });
    await user.click(tabs.getByRole("button", { name: "Wands & Scrolls" }));
    await screen.findByRole("heading", { name: /Wands.*Scrolls/ });
    await user.click(tabs.getByRole("button", { name: "Character" }));
    await user.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    expect(screen.getByText("Level-Up Draft")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.queryByText("Level-Up Draft")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null")).toEqual(original);
  });

  it("shows spell sheets for a saved multiclass caster", async () => {
    const character = savedHero();
    character.classLevels = [{ classId: "wizard", level: 2 }, { classId: "cleric", level: 1 }];
    window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Spells" }));
    const wizardTab = await screen.findByRole("tab", { name: "Wizard · 2" });
    expect(wizardTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Cleric · 1" })).toBeDefined();
    expect(document.querySelectorAll(".spell-sheet")).toHaveLength(1);
    await user.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("spell-tab-cleric");
    expect(screen.getAllByRole("alert").every((alert) => alert.textContent?.startsWith("Choose two different cleric domains."))).toBe(true);
  });

  it("keeps custom-item dialogs usable after removing preview styles", async () => {
    const user = userEvent.setup();
    savedHero();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Store" }));
    await user.click(await screen.findByRole("button", { name: "Create Custom Item" }));
    const dialog = screen.getByRole("dialog", { name: "Create Custom Item" });
    expect(dialog.className).toBe("item-modal-modal");
    await user.type(within(dialog).getByLabelText("Name", { exact: true }), "UI Test Blade");
    await user.click(within(dialog).getByRole("button", { name: "Save to Store" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Custom Items List" }));
    const list = screen.getByRole("dialog", { name: "Custom Items List" });
    expect(within(list).getByText("Ui Test Blade", { exact: true })).toBeDefined();
    await user.click(within(list).getByRole("button", { name: /delete/i }));
    expect(within(list).queryByText("Ui Test Blade", { exact: true })).toBeNull();
  });

  it("surfaces storage errors instead of displaying success", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    savedHero();
    render(<App />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Disk full"); });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toContain("Disk full");
    expect(alert).not.toHaveBeenCalled();
  });

  it("rejects an invalid import without replacing the current character", async () => {
    savedHero();
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const file = new File(["null"], "invalid.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => "null" });
    fireEvent.change(input, { target: { files: [file] } });
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to import");
    expect(screen.getByRole("heading", { name: "Regression Hero (Player)" })).toBeDefined();
  });

  it("keeps rolled assignments and derived character scores synchronized without an effect", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Roll 4d6" }));
    let rolls = 0;
    vi.spyOn(Math, "random").mockImplementation(() => (5 - Math.floor(rolls++ / 4) + 0.1) / 6);
    fireEvent.click(screen.getByRole("button", { name: "Roll Abilities" }));
    fireEvent.change(screen.getByRole("combobox", { name: /^Strength/ }), { target: { value: "5" } });
    vi.spyOn(window, "alert").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"));
    expect(saved.abilities).toEqual({ str: 3, dex: 15, con: 12, int: 9, wis: 6, cha: 18 });
    expect(saved.hitPoints).toBe(11);
  });

  it("imports and saves a 2.0 character with portable custom items", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    const character = savedHero();
    const { container } = render(<App />);
    character.name = "Imported Hero";
    character.customItems = [{ custom: true, name: "Imported Blade", category: "Weapons", price: 10, weight: "2 lb." }];
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing import input.");
    const json = JSON.stringify(character);
    const file = new File([json], "character.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("heading", { name: "Imported Hero (Player)" });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(parseCharacter(JSON.parse(window.localStorage.getItem(savedCharacterStorageKey) ?? "null"))).toEqual(character);
  });

  it("exports portable JSON without using any PDF or preview path", async () => {
    savedHero();
    render(<App />);
    let exportedBlob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(blob: Blob) {
        exportedBlob = blob;
        return "blob:test-character";
      }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(click).toHaveBeenCalledOnce();
    if (!exportedBlob) throw new Error("No character JSON was exported.");
    expect(exportedBlob.type).toBe("application/json");
    const blob = exportedBlob;
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    const character = parseCharacter(JSON.parse(contents));
    expect(character.name).toBe("Regression Hero");
    expect(character.customItems).toBeDefined();
    expect(TestURL.revokeObjectURL).toHaveBeenCalledWith("blob:test-character");
  });
});
