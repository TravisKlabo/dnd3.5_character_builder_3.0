import { magicSchools, type LevelUpDraft } from "./domain";
import { getClassSpells, normalizeSpellName } from "./data/spellCatalog";
import { getClassSpellSelections, getPrestigeClassLevel, getPrestigeSpellcastingClassOptions } from "./rules";
import { getSpellSchoolName } from "./spellFormatting";

export function getRedWizardNewSpellWarnings(draft: LevelUpDraft, spellCatalogReady: boolean) {
  if (!spellCatalogReady || getPrestigeClassLevel(draft.proposed, "red-wizard") === 0) return [];
  const priorKnown = getClassSpellSelections(draft.original, "knownSpells");
  const nextKnown = getClassSpellSelections(draft.proposed, "knownSpells");
  const prohibited = new Set([
    ...(draft.proposed.wizardBarredSchools ?? []),
    ...(draft.proposed.redWizardProhibitedSchools ?? []),
  ]);
  const warnings: string[] = [];
  for (const classId of getPrestigeSpellcastingClassOptions(draft.proposed, "red-wizard")) {
    const newNames = (nextKnown[classId] ?? []).filter((name) => !(priorKnown[classId] ?? []).includes(name));
    const spells = getClassSpells(classId, draft.proposed.ruleset, draft.proposed);
    for (const name of newNames) {
      const spell = spells.find((entry) => normalizeSpellName(entry.name) === normalizeSpellName(name));
      const school = spell && magicSchools.find((entry) => entry === getSpellSchoolName(spell.school));
      if (school && prohibited.has(school))
        warnings.push(`A Red Wizard cannot learn a new ${school} spell.`);
    }
  }
  return warnings;
}
