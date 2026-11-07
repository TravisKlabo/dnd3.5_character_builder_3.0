import { expect, test } from "@playwright/test";

test("records manual HP rolls and rejects out-of-range values", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    character.name = "HP Roll QA";
    character.abilities = { ...character.abilities, str: 13, con: 14 };
    character.classLevels = [{ classId: "fighter", level: 1 }];
    character.hitPoints = 12;
    character.featSelections = {
      "general-1": "toughness",
      "fighter-1": "power-attack",
    };
    character.feats = ["toughness", "power-attack"];
    character.hitPointRolls = [{
      characterLevel: 1,
      classId: "fighter",
      classLevel: 1,
      hitDie: 10,
      roll: 10,
      hpIncrease: 15,
    }];
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  await page.reload();

  await expect(page.getByText("15 / 15", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enter Level-Up Mode" }).click();
  await page.getByRole("button", { name: "Add rank to Climb" }).click();
  await page.getByRole("button", { name: "Add rank to Craft" }).click();
  await page.getByRole("button", { name: "Add rank to Handle Animal" }).click();
  await page.getByRole("button", { name: "Fighter bonus feat (fighter level 2)" }).click();
  await page.getByRole("listbox", { name: "Feat choices" })
    .getByRole("option", { name: /^Blind-Fight/ }).click();

  await page.getByLabel("HP roll method").selectOption("manual");
  const roll = page.getByRole("spinbutton", { name: "Hit die result" });
  await roll.fill("11");
  await expect(roll).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Confirm Level-Up" })).toBeDisabled();
  await roll.fill("6");
  await expect(page.getByText("Calculated HP increase: +8")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm Level-Up" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirm Level-Up" }).click();

  await expect(page.getByText("23 / 23", { exact: true })).toBeVisible();
  await page.getByText("HP gains by level").click();
  const history = page.getByRole("table", { name: "HP gained by level" });
  await expect(history).toContainText("6/10");
  await expect(history).toContainText("+8");
});
