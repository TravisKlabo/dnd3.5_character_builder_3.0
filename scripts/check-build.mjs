import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const html = await readFile("dist/index.html", "utf8");
const initialScripts = [...html.matchAll(/(?:src|href)="\.\/([^"]+\.js)"/g)].map((match) => match[1]);
if (!initialScripts.length) throw new Error("The build has no JavaScript entry point.");
const initialBytes = (await Promise.all(initialScripts.map(async (file) =>
  (await stat(path.join("dist", file))).size))).reduce((total, bytes) => total + bytes, 0);
const budget = 453_000;
if (initialBytes > budget) {
  throw new Error(`Initial JavaScript is ${initialBytes} bytes; the budget is ${budget} bytes.`);
}
console.log(`Initial JavaScript: ${initialBytes.toLocaleString()} bytes (budget ${budget.toLocaleString()}).`);
