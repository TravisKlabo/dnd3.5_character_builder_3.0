import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import App from "../src/App";
import { customStoreItemsStorageKey, loadCustomStoreItems } from "../src/storage";

it("shows a warning for a damaged custom catalog without replacing it", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  window.localStorage.setItem(customStoreItemsStorageKey, "{broken");

  expect(loadCustomStoreItems()).toEqual([]);
  render(<App />);

  expect((await screen.findByRole("alert")).textContent).toContain("Custom items failed to load");
  expect(window.localStorage.getItem(customStoreItemsStorageKey)).toBe("{broken");
  expect(log).toHaveBeenCalledOnce();
});
