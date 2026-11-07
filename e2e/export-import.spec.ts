import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("downloads and reimports character JSON", async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.goto("/");
  const characterHeading = await page.locator("main h2").first().innerText();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("The character export download has no file path.");
  const exportJson = await readFile(downloadPath, "utf8");
  expect(JSON.parse(exportJson)).toMatchObject({
    name: expect.any(String),
    customItems: expect.any(Array),
  });

  let importMessage = "";
  page.once("dialog", async (dialog) => {
    importMessage = dialog.message();
    await dialog.accept();
  });
  await page.getByLabel("Import character JSON").setInputFiles({
    name: download.suggestedFilename(),
    mimeType: "application/json",
    buffer: Buffer.from(exportJson),
  });

  await expect.poll(() => importMessage).toBe("Character imported.");
  await expect(page.locator("main h2").first()).toHaveText(characterHeading);
});
