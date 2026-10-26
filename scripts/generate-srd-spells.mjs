import { writeFile } from "node:fs/promises";

const sources = {
  bard: "https://www.d20srd.org/srd/spellLists/bardSpells.htm",
  cleric: "https://www.d20srd.org/srd/spellLists/clericSpells.htm",
  druid: "https://www.d20srd.org/srd/spellLists/druidSpells.htm",
  paladin: "https://www.d20srd.org/srd/spellLists/paladinSpells.htm",
  ranger: "https://www.d20srd.org/srd/spellLists/rangerSpells.htm",
  sorcerer: "https://www.d20srd.org/srd/spellLists/sorcererWizardSpells.htm",
  wizard: "https://www.d20srd.org/srd/spellLists/sorcererWizardSpells.htm",
};

const decodeHtml = (value) => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const detail = async (href) => {
  const html = await (await fetch(new URL(href, "https://www.d20srd.org")).catch(() => ({ text: async () => "" }))).text();
  const field = (label) => {
    const match = html.match(new RegExp(`<th[^>]*>\\s*<a[^>]*>${label}[^<]*</a>:\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, "i"));
    return match ? decodeHtml(match[1]) : "";
  };
    const schoolBlock = html.match(/<h4[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
    const school = schoolBlock ? decodeHtml(schoolBlock[1]) : "";
  return { school, components: field("Components"), castingTime: field("Casting Time"), range: field("Range"), duration: field("Duration"), savingThrow: field("Saving Throw") };
};

const spells = new Map();
for (const [classId, url] of Object.entries(sources)) {
  const html = await (await fetch(url)).text();
  for (const match of html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[^>]*>|$)/gi)) {
    const levelMatch = match[1].match(/(\d+)(?:st|nd|rd|th)?-Level/i);
    if (!levelMatch) continue;
    const level = Number(levelMatch[1]);
    const section = match[2];
    for (const match of section.matchAll(/<a[^>]+href="[^"#]*\/spells\/[^"#]+"[^>]*>([^<]+)<\/a>([\s\S]*?)(?=<a[^>]+href="[^"#]*\/spells\/|$)/gi)) {
      const parsedName = match[1].replace(/\s+/g, " ").trim();
      const name = parsedName.toLowerCase() === "magic missiles"
        ? "Magic Missile"
        : parsedName;
      if (!name || /^M$|^F$|^X$/i.test(name)) continue;
      const description = decodeHtml(match[2]).replace(/^\s*[:.]?\s*/, "");
      const href = match[0].match(/href="([^"]+)"/i)?.[1] ?? "";
      const key = `${level}:${name.toLowerCase()}`;
      const entry = spells.get(key) ?? { name, level, classes: [], description, href };
      if (name[0] && name[0] === name[0].toUpperCase()) entry.name = name;
      if (!entry.classes.includes(classId)) entry.classes.push(classId);
      spells.set(key, entry);
    }
  }
}

for (const spell of spells.values()) {
  Object.assign(spell, await detail(spell.href));
  delete spell.href;
}

const output = [...spells.values()]
  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  .map((spell) => `  ${JSON.stringify(spell)},`)
  .join("\n");
await writeFile("src/srdSpells.ts", `export type SrdSpell = { name: string; level: number; classes: string[]; description: string; school: string; components: string; castingTime: string; range: string; duration: string; savingThrow: string };\n\nexport const srdSpells: SrdSpell[] = [\n${output}\n];\n`);
console.log(`Generated ${spells.size} Core SRD spell entries.`);