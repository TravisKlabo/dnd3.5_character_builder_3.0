import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

type PrintProfile = "fighter" | "mystic";

async function openPrintableSheet(page: Page, profile: PrintProfile) {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async (selectedProfile) => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);

    if (selectedProfile === "fighter") {
      character.name = "Print QA Fighter";
      character.player = "Print QA";
      character.classLevels = [{ classId: "fighter", level: 1 }];
      character.hitPoints = 10;
      character.equipment = {
        Shield: "Arrow Catching +1 Heavy Steel Shield (Medium)",
      };
    } else {
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
      character.name = "Print QA Mystic";
      character.player = "Print QA";
      character.ruleset = "dragonlance-user-pack";
      character.abilities = {
        str: 10,
        dex: 12,
        con: 14,
        int: 16,
        wis: 20,
        cha: 14,
      };
      character.classLevels = [{ classId: "mystic", level: 20 }];
      character.hitPoints = 140;
      character.mysticDomain = "healing";
      character.knownSpells = spells;
      character.knownSpellsByClass = { mystic: spells };
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
          (_, index) => [`Print QA Item ${String(index + 1).padStart(2, "0")}`, 1],
        ),
      );
      character.languages = [
        "Common",
        "Dwarven",
        "Elven",
        "Goblin",
        "Kender",
        "Draconic",
        "Sylvan",
        "Abyssal",
      ];
    }

    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  }, profile);

  await page.reload();
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect(page.locator(".reference-page-one")).toContainText(
    profile === "fighter" ? "Print QA Fighter" : "Print QA Mystic",
  );
  if (profile === "fighter") {
    await expect(page.locator(".reference-ac-components")).toContainText("Ranged AC");
  }
  const expectedSpellPages = await page.locator(".spell-form-page").count();
  const expectedPages = profile === "fighter" ? 2 : 2 + expectedSpellPages;
  await expect(page.locator(".reference-sheet-page")).toHaveCount(expectedPages);
  if (profile === "mystic") {
    const spellPages = page.locator(".spell-form-page");
    expect(expectedSpellPages).toBeGreaterThan(0);
    const spellTableFontSize = await page
      .locator(".print-spell-level-table")
      .first()
      .evaluate((table) => Number.parseFloat(getComputedStyle(table).fontSize));
    expect(spellTableFontSize).toBeCloseTo(8.06, 1);
    const levelSections = await spellPages.locator(".spell-level-section")
      .evaluateAll((sections) => sections.map((section) => section.getAttribute("aria-label")));
    expect(levelSections).toEqual([
      "0 spells",
      "1st spells",
      "2nd spells",
      "3rd spells",
      "4th spells",
      "5th spells",
      "6th spells",
      "7th spells",
      "8th spells",
      "9th spells",
    ]);
    const spellRowHeights = await page
      .locator(".print-spell-level-table tbody tr")
      .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
    expect(Math.max(...spellRowHeights) - Math.min(...spellRowHeights))
      .toBeLessThanOrEqual(1);
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-sheet-actions")).toBeHidden();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return expectedSpellPages;
}

for (const profile of ["fighter", "mystic"] as const) {
  test(`prints the ${profile} sheet as unclipped Letter pages`, async ({
    page,
  }) => {
    const expectedSpellPages = await openPrintableSheet(page, profile);

    const overflow = await page
      .locator(".reference-sheet-page")
      .evaluateAll((pages) =>
        pages.flatMap((sheet, pageIndex) => {
          const pageBox = sheet.getBoundingClientRect();
          return [...sheet.querySelectorAll("*")].flatMap((element) => {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const clippedX = ["hidden", "clip"].includes(style.overflowX);
            const clippedY = ["hidden", "clip"].includes(style.overflowY);
            const outsidePage =
              box.top < pageBox.top - 1 ||
              box.bottom > pageBox.bottom + 1 ||
              box.left < pageBox.left - 1 ||
              box.right > pageBox.right + 1;
            const clippedContent =
              !element.classList.contains("print-spell-cell-content") &&
              ((clippedX && element.scrollWidth > element.clientWidth + 1) ||
                (clippedY && element.scrollHeight > element.clientHeight + 1));

            return outsidePage || clippedContent
              ? [
                  `page ${pageIndex + 1}: ${element.tagName.toLowerCase()}.${element.getAttribute("class") ?? ""}`,
                ]
              : [];
          });
        }),
      );
    expect(overflow).toEqual([]);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });
    const document = await PDFDocument.load(pdf);
    const pages = document.getPages();
    expect(pages).toHaveLength(profile === "fighter" ? 2 : 2 + expectedSpellPages);
    for (const pdfPage of pages) {
      const { width, height } = pdfPage.getSize();
      expect(width).toBeCloseTo(612, 0);
      expect(height).toBeCloseTo(792, 0);
    }
  });
}

test("fits an oversized spell level on one Letter page", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(async () => {
    const app = (await import(
      new URL("/src/domain.ts", location.origin).href
    )) as typeof import("../src/domain.ts");
    const character = app.cloneCharacter(app.initialCharacter);
    const spells = Array.from({ length: 60 }, (_, index) =>
      `Oversized Spell ${index + 1}`,
    );
    character.name = "Spell Pagination QA";
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.knownSpells = spells;
    character.knownSpellsByClass = { wizard: spells };
    localStorage.setItem(
      "dnd35-character-builder-character",
      JSON.stringify([1, character, false]),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Print", exact: true }).click();

  const oversizedPage = page
    .locator(".spell-form-page")
    .filter({ hasText: "Oversized Spell 60" });
  await expect(oversizedPage).toHaveCount(1);
  await expect(oversizedPage.locator("tbody tr")).toHaveCount(62);
  await page.emulateMedia({ media: "print" });
  const measurements = await oversizedPage.evaluate((sheet) => {
    const section = sheet.querySelector(".spell-level-section");
    const table = section?.querySelector(".print-spell-level-table");
    const row = table?.querySelector("tbody tr");
    const content = table?.querySelector(".print-spell-cell-content");
    if (!section || !table || !row || !content) {
      throw new Error("Missing oversized spell-level content.");
    }
    return {
      pageBottom: sheet.getBoundingClientRect().bottom,
      sectionBottom: section.getBoundingClientRect().bottom,
      tableBottom: table.getBoundingClientRect().bottom,
      rowHeight: row.getBoundingClientRect().height,
      lineClamp: getComputedStyle(content).getPropertyValue("-webkit-line-clamp"),
    };
  });

  expect(measurements.sectionBottom).toBeLessThanOrEqual(measurements.pageBottom + 1);
  expect(measurements.tableBottom).toBeLessThanOrEqual(measurements.sectionBottom + 1);
  expect(measurements.rowHeight).toBeGreaterThan(10);
  expect(measurements.rowHeight).toBeLessThan(20);
  expect(measurements.lineClamp).toBe("1");
  await expect(oversizedPage).toContainText("Oversized Spell 60");

  const spellPageCount = await page.locator(".spell-form-page").count();
  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
  });
  const pdfDocument = await PDFDocument.load(pdf);
  const pages = pdfDocument.getPages();
  expect(pages).toHaveLength(2 + spellPageCount);
  for (const pdfPage of pages) {
    const { width, height } = pdfPage.getSize();
    expect(width).toBeCloseTo(612, 0);
    expect(height).toBeCloseTo(792, 0);
  }
});
