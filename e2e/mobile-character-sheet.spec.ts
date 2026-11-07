import { expect, test } from "@playwright/test";

test("keeps ranged ammunition controls inside narrow and breakpoint viewports", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    character.name = "Mobile QA Fighter";
    character.equipment = { "Ranged Weapon": "Light Crossbow (Medium)" };
    character.inventory = { "Crossbow Bolts (10)": 2 };
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  await page.reload();

  await expect(
    page.getByRole("combobox", { name: "Ammunition to fire" }),
  ).toBeVisible();
  for (const width of [320, 390, 560, 561]) {
    await page.setViewportSize({ width, height: 844 });
    const bounds = await page.evaluate(() => {
      const control = document.querySelector(".ranged-ammunition-control");
      const select = control?.querySelector("select");
      const panel = document.querySelector(".attacks-panel");
      if (!control || !select || !panel) {
        throw new Error("The ranged ammunition control did not render.");
      }
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        panelRight: panel.getBoundingClientRect().right,
        controlRight: control.getBoundingClientRect().right,
        selectRight: select.getBoundingClientRect().right,
      };
    });

    expect(bounds.viewportWidth).toBe(width);
    expect(bounds.pageWidth, `The page overflows at ${width}px`).toBeLessThanOrEqual(width);
    expect(bounds.controlRight).toBeLessThanOrEqual(bounds.panelRight + 1);
    expect(bounds.selectRight).toBeLessThanOrEqual(bounds.controlRight + 1);
  }
});

test("keeps skill checkboxes clear of the right-hand divider at narrow widths", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    character.name = "Skills Divider QA";
    character.classLevels = [{ classId: "fighter", level: 1 }];
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  await page.reload();

  const skillNames = page.locator(".skills-panel .skill-name");
  await expect(skillNames.first()).toBeVisible();
  for (const width of [320, 390, 900]) {
    await page.setViewportSize({ width, height: 844 });
    const dividerGaps = await skillNames.evaluateAll((elements) =>
      elements.map((element) => {
        const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]');
        const dividers = element.querySelectorAll<HTMLElement>(":scope > .tooltip-anchor");
        if (!checkbox || dividers.length < 2) {
          throw new Error("The skill checkbox or divider did not render.");
        }
        return dividers[1].getBoundingClientRect().left -
          checkbox.getBoundingClientRect().right;
      }),
    );
    expect(Math.min(...dividerGaps)).toBeGreaterThanOrEqual(7);
  }
});

test("keeps equipment and spell sheets within narrow and tablet viewports", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    const spells = [
      "Create Water",
      "Cure Light Wounds",
      "Lesser Restoration",
      "Prayer",
      "Death Ward",
      "Heal",
      "Greater Restoration",
      "Summon Monster VII",
      "Greater Planar Ally",
      "Miracle",
    ];
    character.name = "Mobile QA Mystic";
    character.ruleset = "dragonlance-user-pack";
    character.abilities = { str: 10, dex: 12, con: 14, int: 16, wis: 20, cha: 14 };
    character.classLevels = [{ classId: "mystic", level: 20 }];
    character.hitPoints = 140;
    character.mysticDomain = "healing";
    character.knownSpells = spells;
    character.knownSpellsByClass = { mystic: spells };
    character.preparedSpells = spells;
    character.equipment = {
      Head: "Headband of Inspired Wisdom +6",
      Eyes: "Eyes of the Eagle",
      Neck: "Amulet of Natural Armor +5",
      Shoulders: "Cloak of Resistance +5",
      "Rings 1": "Ring of Protection +5",
      "Rings 2": "Ring of Freedom of Movement",
      Hands: "Gloves of Dexterity +2",
      Arms: "Bracers of Armor +8",
      Body: "Robe of the Archmagi",
      Torso: "Vest of Resistance +5",
      Waist: "Belt of Physical Might +4",
      Feet: "Boots of Speed",
    };
    character.inventory = Object.fromEntries(
      Array.from(
        { length: 28 },
        (_, index) => [`Mobile QA Item ${String(index + 1).padStart(2, "0")}`, 1],
      ),
    );
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  let delayedEquipmentRequests = 0;
  let delayedSpellRequests = 0;
  await page.route("**/src/components/EquipmentSheet.tsx*", async (route) => {
    delayedEquipmentRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.route("**/src/components/SpellSheet.tsx*", async (route) => {
    delayedSpellRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  for (const width of [320, 561]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();

    await page.getByRole("button", { name: "Equipment", exact: true }).click();
    await expect(page.getByText("Loading screen...", { exact: true })).toBeVisible();
    const equipmentLoadingBounds = await page.evaluate(() => {
      const status = document.querySelector(".status-message[role='status']");
      if (!status) throw new Error("The equipment loading status did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        statusRight: status.getBoundingClientRect().right,
      };
    });
    expect(equipmentLoadingBounds.pageWidth, `The equipment loading page overflows at ${width}px`)
      .toBeLessThanOrEqual(equipmentLoadingBounds.viewportWidth);
    expect(equipmentLoadingBounds.statusRight).toBeLessThanOrEqual(width + 1);
    await expect(page.locator(".equipment-sheet")).toBeVisible();
    const equipmentBounds = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      inventoryRows: document.querySelectorAll(".equipment-inventory-row").length,
    }));
    expect(equipmentBounds.pageWidth, `Equipment overflows at ${width}px`)
      .toBeLessThanOrEqual(equipmentBounds.viewportWidth);
    expect(equipmentBounds.inventoryRows).toBeGreaterThanOrEqual(20);

    await page.getByRole("button", { name: "Spells", exact: true }).click();
    await expect(page.getByText("Loading screen...", { exact: true })).toBeVisible();
    const spellLoadingBounds = await page.evaluate(() => {
      const status = document.querySelector(".status-message[role='status']");
      if (!status) throw new Error("The spell sheet loading status did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        statusRight: status.getBoundingClientRect().right,
      };
    });
    expect(spellLoadingBounds.pageWidth, `The spell loading page overflows at ${width}px`)
      .toBeLessThanOrEqual(spellLoadingBounds.viewportWidth);
    expect(spellLoadingBounds.statusRight).toBeLessThanOrEqual(width + 1);
    await expect(page.locator(".spell-level-table").first()).toBeVisible();
    const spellBounds = await page.evaluate(() => {
      const sheet = document.querySelector(".spell-sheet");
      if (!sheet) throw new Error("The spell sheet did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        sheetClientWidth: sheet.clientWidth,
        sheetScrollWidth: sheet.scrollWidth,
        sheetOverflowX: getComputedStyle(sheet).overflowX,
      };
    });
    expect(spellBounds.pageWidth, `Spells overflows at ${width}px`)
      .toBeLessThanOrEqual(spellBounds.viewportWidth);
    expect(spellBounds.sheetOverflowX).toBe("auto");
    expect(spellBounds.sheetScrollWidth).toBeGreaterThan(spellBounds.sheetClientWidth);
  }
  expect(delayedEquipmentRequests).toBeGreaterThanOrEqual(2);
  expect(delayedSpellRequests).toBeGreaterThanOrEqual(2);
});

test("keeps the lazy-loaded notes panel inside narrow viewports while loading", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    character.name = "Mobile QA Notes";
    character.notes = "A detailed character note for mobile layout testing. ".repeat(16);
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  let delayedRequests = 0;
  await page.route("**/src/components/CharacterNotes.tsx*", async (route) => {
    delayedRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });

  for (const width of [320, 561]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByText("Loading character notes...", { exact: true }))
      .toBeVisible();
    const loadingBounds = await page.evaluate(() => {
      const panel = document.querySelector(".notes-panel");
      const status = panel?.querySelector(".component-loading");
      if (!panel || !status) {
        throw new Error("The character notes loading placeholder did not render.");
      }
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        panelRight: panel.getBoundingClientRect().right,
        statusRight: status.getBoundingClientRect().right,
      };
    });
    expect(loadingBounds.pageWidth, `The loading page overflows at ${width}px`)
      .toBeLessThanOrEqual(loadingBounds.viewportWidth);
    expect(loadingBounds.panelRight).toBeLessThanOrEqual(width + 1);
    expect(loadingBounds.statusRight).toBeLessThanOrEqual(loadingBounds.panelRight + 1);

    await expect(page.locator(".character-notes-content")).toBeVisible();
    const loadedBounds = await page.evaluate(() => {
      const panel = document.querySelector(".notes-panel");
      const content = panel?.querySelector(".character-notes-content");
      if (!panel || !content) {
        throw new Error("The loaded character notes panel did not render.");
      }
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        panelRight: panel.getBoundingClientRect().right,
        contentRight: content.getBoundingClientRect().right,
      };
    });
    expect(loadedBounds.pageWidth, `The loaded page overflows at ${width}px`)
      .toBeLessThanOrEqual(loadedBounds.viewportWidth);
    expect(loadedBounds.panelRight).toBeLessThanOrEqual(width + 1);
    expect(loadedBounds.contentRight).toBeLessThanOrEqual(loadedBounds.panelRight + 1);
  }

  expect(delayedRequests).toBeGreaterThanOrEqual(2);
});

test("keeps store, forge, crafting, and rules library inside mobile viewports", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    character.name = "Mobile QA Wizard";
    character.abilities.int = 16;
    character.classLevels = [{ classId: "wizard", level: 5 }];
    character.hitPoints = 35;
    character.knownSpells = ["Mage Armor", "Magic Missile", "Fireball"];
    character.knownSpellsByClass = {
      wizard: ["Mage Armor", "Magic Missile", "Fireball"],
    };
    character.inventory = Object.fromEntries(
      Array.from(
        { length: 28 },
        (_, index) => [`Mobile QA Item ${String(index + 1).padStart(2, "0")}`, 1],
      ),
    );
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });

  for (const width of [320, 561]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();

    await page.getByRole("button", { name: "Store", exact: true }).click();
    await expect(page.getByRole("heading", { name: "General Store" })).toBeVisible();
    await expect(page.locator(".equipment-store-grid")).toBeVisible();
    const storeBounds = await page.evaluate(() => {
      const store = document.querySelector(".equipment-store");
      if (!store) throw new Error("The equipment store did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        right: store.getBoundingClientRect().right,
        overflowingElements: [...store.querySelectorAll("*")]
          .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .map((element) => `${element.tagName.toLowerCase()}.${String(element.className)}: ${Math.round(element.getBoundingClientRect().right)}px`)
          .slice(0, 10),
      };
    });
    expect(storeBounds.pageWidth, `The open store overflows at ${width}px: ${storeBounds.overflowingElements.join("; ")}`)
      .toBeLessThanOrEqual(storeBounds.viewportWidth);
    expect(storeBounds.right).toBeLessThanOrEqual(width + 1);

    await page.getByRole("button", { name: "Forge", exact: true }).click();
    await expect(page.locator(".forge-panel").first()).toBeVisible();
    const forgeBounds = await page.evaluate(() => {
      const panel = document.querySelector(".forge-panel");
      if (!panel) throw new Error("The forge panel did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        right: panel.getBoundingClientRect().right,
      };
    });
    expect(forgeBounds.pageWidth, `The forge overflows at ${width}px`)
      .toBeLessThanOrEqual(forgeBounds.viewportWidth);
    expect(forgeBounds.right).toBeLessThanOrEqual(width + 1);

    await page.getByRole("button", { name: "Wands & Scrolls", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Wands & Scrolls" })).toBeVisible();
    const craftingBounds = await page.evaluate(() => {
      const panel = document.querySelector(".forge-panel");
      if (!panel) throw new Error("The crafting panel did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        right: panel.getBoundingClientRect().right,
      };
    });
    expect(craftingBounds.pageWidth, `The crafting screen overflows at ${width}px`)
      .toBeLessThanOrEqual(craftingBounds.viewportWidth);
    expect(craftingBounds.right).toBeLessThanOrEqual(width + 1);

    await page.getByRole("button", { name: "Rules Library", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Rules PDF Library" })).toBeVisible();
    const rulesBounds = await page.evaluate(() => {
      const panel = document.querySelector(".pdf-library");
      if (!panel) throw new Error("The rules library did not render.");
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        right: panel.getBoundingClientRect().right,
      };
    });
    expect(rulesBounds.pageWidth, `The rules library overflows at ${width}px`)
      .toBeLessThanOrEqual(rulesBounds.viewportWidth);
    expect(rulesBounds.right).toBeLessThanOrEqual(width + 1);
  }
});
