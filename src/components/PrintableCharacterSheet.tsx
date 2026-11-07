import { useState } from "react";
import { type Character, type ClassId, abilityModifier, classDefinitions, deityDefinitions, dragonlancePrestigeClasses, raceDefinitions, getEffectiveCharacterLevel, getTotalHitDice } from "../domain";
import { abilities, featCatalog, skills } from "../data/characterCatalog";
import {
  formatModifier,
  getArcaneSpellFailure,
  getArmorClassValues,
  getBaseAttackBonus,
  getBaseSave,
  baseSpellSlots,
  getCarriedWeight,
  getCharacterLanguages,
  getCasterLevel,
  getClassSpellSelections,
  getClassFeatureDisplay,
  getDailySpellSlots,
  getEffectiveSpellcastingClassLevel,
  getEffectiveWeaponKey,
  getEncumbrance,
  getCharacterEquipmentCheckPenalty,
  getEquippedWeaponStats,
  getInventoryEntryDetails,
  getInitiativeModifier,
  getRacialHitDiceForCharacter,
  getKnownSpellLimit,
  hasSpellLevelAtClassLevel,
  isClassSkill,
  getMovement,
  getRacialSpellLikeAbilities,
  getRaceDefinitionForCharacter,
  getSavingThrow,
  getSkillAbility,
  getSkillCheckModifier,
  getSkillUse,
  getSpecialAttackBonuses,
  getSpellSaveDC,
  getSpellcastingAbility,
  getWornArmor,
} from "../rules";
import { findSpellByName, useSpellCatalog } from "../data/spellCatalog";
import type { SrdSpell } from "../srdSpells";
import {
  formatSpellCastingTime,
  formatSpellDuration,
  formatSpellSchool,
  spellRequiresConcentration,
} from "../spellFormatting";
import { getEffectiveAbilityScore } from "../abilityEquipment";
import { getMaximumHitPoints } from "../hitPoints";
import "./PrintableCharacterSheet.css";

type Props = {
  character: Character;
};

const saveAbilities = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
} as const;

const weaponSlots = ["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const;

const wornMagicSlots = [
  ["Head", "Head"],
  ["Eyes", "Eyes"],
  ["Neck", "Neck"],
  ["Shoulders", "Shoulders"],
  ["Ring #1", "Rings 1"],
  ["Ring #2", "Rings 2"],
  ["Hands", "Hands"],
  ["Arms / Wrists", "Arms"],
  ["Body", "Body"],
  ["Torso", "Torso"],
  ["Waist", "Waist"],
  ["Feet", "Feet"],
] as const;

const spellLevelLabels = ["0", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"] as const;
const minimumSpellWriteInRows = 2;
const spellPageContentHeight = 900;
const spellLevelHeadingHeight = 18;
const spellTableHeadingHeight = 12;
const spellTableRowHeight = 27;
const spellLevelGap = 4;
const compactSpellLevelHeight = spellPageContentHeight - 24;

function PrintField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="print-field">
      <span className="print-field-label">{label}</span>
      <span className="print-field-value">{value === undefined || value === "" ? "\u00a0" : value}</span>
    </div>
  );
}

type PrintableSpell = {
  name: string;
  details?: SrdSpell;
  known: boolean;
  prepared: boolean;
};

type PrintableSpellPage = {
  classId: ClassId;
  classLevel: number;
  pageNumber: number;
  totalPages: number;
  levels: readonly number[];
  spells: PrintableSpell[];
};

function getSpellRowCount(spellCount: number) {
  return Math.max(minimumSpellWriteInRows, spellCount + minimumSpellWriteInRows);
}

function getSpellLevelLayout(spellCount: number) {
  const rowCount = getSpellRowCount(spellCount);
  const naturalHeight = spellLevelHeadingHeight + spellTableHeadingHeight +
    rowCount * spellTableRowHeight + spellLevelGap;
  const compact = naturalHeight > spellPageContentHeight;
  const height = compact ? compactSpellLevelHeight : naturalHeight;
  const rowHeight = compact
    ? (height - spellLevelGap - spellLevelHeadingHeight - spellTableHeadingHeight) / rowCount
    : spellTableRowHeight;
  const tableFontSize = Math.min(8.064, Math.max(0.5, (rowHeight - 3) / 1.15));

  return { compact, height, rowHeight, tableFontSize };
}

function getSpellLevelHeight(spellCount: number) {
  return getSpellLevelLayout(spellCount).height;
}

function paginateSpellLevels(levels: number[], spellsByLevel: Map<number, PrintableSpell[]>) {
  if (!levels.length) return [];

  const heights = levels.map((level) =>
    getSpellLevelHeight(spellsByLevel.get(level)?.length ?? 0),
  );
  let minimumPageCount = 1;
  let pageHeight = 0;
  for (const height of heights) {
    if (pageHeight > 0 && pageHeight + height > spellPageContentHeight) {
      minimumPageCount += 1;
      pageHeight = 0;
    }
    pageHeight += height;
  }

  const targetPageHeight = heights.reduce((total, height) => total + height, 0) /
    minimumPageCount;
  const memo = new Map<string, { groups: number[][]; cost: number } | null>();
  const findBalancedGroups = (
    start: number,
    pagesRemaining: number,
  ): { groups: number[][]; cost: number } | null => {
    const key = `${start}-${pagesRemaining}`;
    if (memo.has(key)) return memo.get(key) ?? null;

    if (pagesRemaining === 1) {
      const height = heights.slice(start).reduce((total, value) => total + value, 0);
      const group = levels.slice(start);
      const result = height <= spellPageContentHeight || group.length === 1
        ? { groups: [group], cost: (height - targetPageHeight) ** 2 }
        : null;
      memo.set(key, result);
      return result;
    }

    let best: { groups: number[][]; cost: number } | null = null;
    let height = 0;
    const lastEnd = levels.length - pagesRemaining + 1;
    for (let end = start + 1; end <= lastEnd; end += 1) {
      height += heights[end - 1];
      if (height > spellPageContentHeight && end > start + 1) break;

      const remaining = findBalancedGroups(end, pagesRemaining - 1);
      if (!remaining) continue;

      const cost = (height - targetPageHeight) ** 2 + remaining.cost;
      if (!best || cost < best.cost) {
        best = {
          groups: [levels.slice(start, end), ...remaining.groups],
          cost,
        };
      }
    }

    memo.set(key, best);
    return best;
  };

  return findBalancedGroups(0, minimumPageCount)?.groups ?? [levels];
}

function SpellLevelTable({
  character,
  classId,
  classLevel,
  spellLevel,
  spells,
}: {
  character: Character;
  classId: ClassId;
  classLevel: number;
  spellLevel: number;
  spells: PrintableSpell[];
}) {
  const canCastLevel = hasSpellLevelAtClassLevel(
    classId,
    getEffectiveSpellcastingClassLevel(character, classId),
    spellLevel,
  );
  const slots = canCastLevel
    ? getDailySpellSlots(character, classId, classLevel, spellLevel)
    : 0;
  const spellSaveDc = canCastLevel ? getSpellSaveDC(character, classId, spellLevel) : undefined;
  const rowCount = getSpellRowCount(spells.length);
  const layout = getSpellLevelLayout(spells.length);

  return (
    <section
      className={`spell-level-section${layout.compact ? " spell-level-section-compact" : ""}`}
      aria-label={`${spellLevelLabels[spellLevel]} spells`}
    >
      <header className="print-spell-level-heading">
        <h3>{spellLevel === 0 ? "Cantrips" : `Level ${spellLevel} spells`}</h3>
        <div className="spell-level-slot-count">
          <span>Slots {slots}</span>
          <span className="spell-level-slot-boxes" aria-label={`${slots} daily slots`}>
            {Array.from({ length: slots }, (_, index) => (
              <span className="spell-slot-box" key={index} />
            ))}
          </span>
        </div>
        <span className="spell-level-dc">Save DC {spellSaveDc ?? "—"}</span>
      </header>
      <table
        className="print-spell-level-table"
        style={layout.compact ? { fontSize: `${layout.tableFontSize}px` } : undefined}
      >
        <colgroup>
          {[4, 18, 27.7, 4, 9, 7, 8, 8, 11, 3.3].map((width, index) => (
            <col key={index} style={{ width: `${width}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>Qty.</th>
            <th>Spell name</th>
            <th>Description</th>
            <th className="print-spell-concentration">Conc.</th>
            <th>Save / SR</th>
            <th>Range</th>
            <th>Casting</th>
            <th>Components</th>
            <th>Duration</th>
            <th>Sch.</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, index) => {
            const spell = spells[index];
            const details = spell?.details;
            return (
              <tr
                key={spell?.name ?? `blank-${spellLevel}-${index}`}
                style={layout.compact ? { height: `${layout.rowHeight}px` } : undefined}
              >
                <td className="spell-quantity-cell" />
                <td><span className="print-spell-cell-content">{spell?.name}</span></td>
                <td><span className="print-spell-cell-content">{details?.description}</span></td>
                <td className="print-spell-concentration">{details && spellRequiresConcentration(details.duration) ? "*" : ""}</td>
                <td><span className="print-spell-cell-content">{details?.savingThrow}</span></td>
                <td><span className="print-spell-cell-content">{details?.range}</span></td>
                <td><span className="print-spell-cell-content">{details ? formatSpellCastingTime(details.castingTime) : ""}</span></td>
                <td><span className="print-spell-cell-content">{details?.components}</span></td>
                <td><span className="print-spell-cell-content">{details ? formatSpellDuration(details.duration) : ""}</span></td>
                <td><span className="print-spell-cell-content">{details ? formatSpellSchool(details.school) : ""}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function SpellReferencePage({
  character,
  page,
  totalPages,
}: {
  character: Character;
  page: PrintableSpellPage;
  totalPages: number;
}) {
  const ability = getSpellcastingAbility(page.classId);
  const abilityScore = getEffectiveAbilityScore(character, ability);
  const concentrationBonus = getSkillCheckModifier(character, "Concentration");
  const deityName = character.deity
    ? deityDefinitions.find((deity) => deity.id === character.deity)?.name ?? character.deity
    : "—";
  const domainName = character.mysticDomain
    ? character.mysticDomain.split(/[-\s]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
    : character.clericDomains?.join(", ") || "—";
  const knownCount = page.spells.filter((spell) => spell.known).length;
  const preparedCount = page.spells.filter((spell) => spell.prepared).length;
  const firstLevel = page.levels[0] ?? 0;
  const lastLevel = page.levels[page.levels.length - 1] ?? 0;
  const spellSaveDcs = page.levels.map((spellLevel) => {
    const dc = hasSpellLevelAtClassLevel(
      page.classId,
      getEffectiveSpellcastingClassLevel(character, page.classId),
      spellLevel,
    )
      ? getSpellSaveDC(character, page.classId, spellLevel)
      : "—";
    return `${spellLevel}: ${dc}`;
  }).join(" · ");
  const gridTemplateRows = page.levels.map((spellLevel) => {
    const spellCount = page.spells.filter((spell) =>
      (spell.details?.level ?? 0) === spellLevel,
    ).length;
    return `${getSpellLevelHeight(spellCount) - spellLevelGap}px`;
  }).join(" ");

  return (
    <section
      className="reference-sheet-page spell-form-page"
      aria-label={`Spell record, ${classDefinitions[page.classId].name}, levels ${firstLevel} to ${lastLevel}`}
    >
      <header className="spell-form-header">
        <div className="spell-form-title">
          <span>D&D 3.5 · SPELL RECORD</span>
          <h2>{classDefinitions[page.classId].name} · {page.classLevel}</h2>
        </div>
        <div className="spell-form-identity">
          <div><span>Character name</span><strong>{character.name || "—"}</strong></div>
          <div><span>Player</span><strong>{character.player || "—"}</strong></div>
          <div><span>Spellcasting ability</span><strong>{ability.toUpperCase()} {abilityScore} ({formatModifier(abilityModifier(abilityScore))})</strong></div>
          <div><span>Deity</span><strong>{deityName}</strong></div>
          <div><span>Domain</span><strong>{domainName}</strong></div>
        </div>
        <div className="spell-form-calculations">
          <div><span>Spell save DC</span><strong>{spellSaveDcs}</strong></div>
          <div><span>Caster level</span><strong>{getCasterLevel(page.classId, page.classLevel, character)}</strong></div>
          <div><span>Concentration</span><strong>{concentrationBonus === null ? "—" : formatModifier(concentrationBonus)}</strong></div>
          <div><span>Known / prepared</span><strong>{knownCount} / {preparedCount}</strong></div>
        </div>
      </header>
      <div className="spell-form-levels" style={{ gridTemplateRows }}>
        {page.levels.map((spellLevel) => (
          <SpellLevelTable
            key={spellLevel}
            character={character}
            classId={page.classId}
            classLevel={page.classLevel}
            spellLevel={spellLevel}
            spells={page.spells.filter((spell) =>
              spell.details?.level === spellLevel || (spellLevel === 0 && !spell.details),
            )}
          />
        ))}
      </div>
      <footer className="spell-form-footer">
        <span>Spell levels {firstLevel}–{lastLevel}</span>
        <span>{classDefinitions[page.classId].name} · SPELL RECORD · PAGE {page.pageNumber + 1} OF {totalPages}</span>
      </footer>
    </section>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="print-section-title"><span>{children}</span></h2>;
}

export function PrintableCharacterSheet({ character }: Props) {
  const [handwritten, setHandwritten] = useState(true);
  const race = getRaceDefinitionForCharacter(character) ?? raceDefinitions.human;
  const racialHitDice = getRacialHitDiceForCharacter(character);
  const classSummary = [
    ...(racialHitDice ? [`${racialHitDice.count}d${racialHitDice.hitDie} racial HD`] : []),
    ...character.classLevels.map((level) => {
    if ("prestigeClassId" in level) {
      return `${dragonlancePrestigeClasses[level.prestigeClassId]?.name ?? level.prestigeClassId} ${level.level}`;
    }
    return `${classDefinitions[level.classId]?.name ?? level.classId} ${level.level}`;
    }),
  ].join(" / ");
  const totalHitDice = getTotalHitDice(character);
  const effectiveCharacterLevel = getEffectiveCharacterLevel(character);
  const deityName = character.deity
    ? deityDefinitions.find((deity) => deity.id === character.deity)?.name ?? character.deity
    : "";
  const armorClass = getArmorClassValues(character);
  const armorComponents = armorClass.components;
  const wornArmor = character.equipment.Armor ? getWornArmor(character) : undefined;
  const saves = (["fortitude", "reflex", "will"] as const).map((save) => {
    const result = getSavingThrow(character, save);
    const ability = saveAbilities[save];
    const base = getBaseSave(character, save);
    const abilityBonus = abilityModifier(getEffectiveAbilityScore(character, ability));
    return {
      name: save === "fortitude" ? "Fort" : save === "reflex" ? "Ref" : "Will",
      total: result.total,
      base,
      ability: abilityBonus,
      misc: result.total - base - abilityBonus,
    };
  });
  const weaponAttacks = weaponSlots.flatMap((slot) => {
    const key = getEffectiveWeaponKey(character, slot);
    if (!key) return [];
    const stats = getEquippedWeaponStats(character, key, 0, slot);
    return stats ? [{ slot, stats }] : [];
  });
  const spellcasterLevels = new Map<keyof typeof classDefinitions, number>();
  for (const level of character.classLevels) {
    if (!("prestigeClassId" in level) && classDefinitions[level.classId]?.spellcasting) {
      spellcasterLevels.set(level.classId, (spellcasterLevels.get(level.classId) ?? 0) + level.level);
    }
  }
  const spellcasters = [...spellcasterLevels.entries()];
  const spellCatalog = useSpellCatalog(spellcasters.length > 0);
  const knownSpellSelections = spellCatalog.ready
    ? getClassSpellSelections(character, "knownSpells")
    : {};
  const preparedSpellSelections = spellCatalog.ready
    ? getClassSpellSelections(character, "preparedSpells")
    : {};
  const spellPages: PrintableSpellPage[] = spellCatalog.ready
    ? spellcasters.flatMap(([classId, classLevel]) => {
        const knownNames = knownSpellSelections[classId] ?? [];
        const preparedNames = [
          ...new Set([
            ...(preparedSpellSelections[classId] ?? []),
            ...Object.keys(character.preparedSpellSlotLevelsByClass?.[classId] ?? {}),
          ]),
        ];
        const knownNameSet = new Set(knownNames);
        const preparedNameSet = new Set(preparedNames);
        const spells = [...new Set([...knownNames, ...preparedNames])]
          .map((name): PrintableSpell => ({
            name,
            details: findSpellByName(name),
            known: knownNameSet.has(name),
            prepared: preparedNameSet.has(name),
          }))
          .sort((left, right) =>
            (left.details?.level ?? -1) - (right.details?.level ?? -1) ||
            left.name.localeCompare(right.name),
          );
        const spellsByLevel = new Map<number, PrintableSpell[]>();
        for (const spell of spells) {
          const level = spell.details?.level ?? 0;
          spellsByLevel.set(level, [...(spellsByLevel.get(level) ?? []), spell]);
        }
        const levels = Array.from({ length: 10 }, (_, level) => level).filter((level) =>
          hasSpellLevelAtClassLevel(
            classId,
            getEffectiveSpellcastingClassLevel(character, classId),
            level,
          ) || spellsByLevel.has(level),
        );
        const levelPages = paginateSpellLevels(levels, spellsByLevel);
        return levelPages.map((pageLevels, pageNumber) => ({
          classId,
          classLevel,
          pageNumber,
          totalPages: levelPages.length,
          levels: pageLevels,
          spells: pageLevels.flatMap((level) => spellsByLevel.get(level) ?? []),
        }));
      })
    : [];
  const primarySpellcaster = [...spellcasters].sort((left, right) => right[1] - left[1])[0];
  const primarySpellcasterClassId = primarySpellcaster?.[0];
  const primarySpellcasterLevel = primarySpellcaster?.[1] ?? 0;
  const primarySpellcastingAbility = primarySpellcasterClassId
    ? getSpellcastingAbility(primarySpellcasterClassId)
    : undefined;
  const primarySpellSaveModifier = primarySpellcastingAbility
    ? formatModifier(abilityModifier(getEffectiveAbilityScore(character, primarySpellcastingAbility)))
    : "";
  const primaryArcaneSpellFailure = primarySpellcasterClassId
    ? getArcaneSpellFailure(character, primarySpellcasterClassId)
    : undefined;
  const inventory = Object.entries(character.inventory ?? {})
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right));
  const ammunition = inventory.filter(([key]) =>
    getInventoryEntryDetails(key).category === "Ammunition",
  );
  const additionalProtectiveItems = Object.entries(character.equipment)
    .filter(([slot, value]) => value && !["Armor", "Shield", "Main Weapon", "Off Hand Weapon", "Ranged Weapon", "Currency", "Runestones"].includes(slot))
    .filter(([, value]) => {
      const category = getInventoryEntryDetails(value).category;
      return category === "Armor" || category === "Shields";
    })
    .slice(0, 3);
  const protectionRowCount = Math.max(4, 2 + additionalProtectiveItems.length);
  const protectionRowsHeightInches = 1.75;
  const protectionRowHeight = `${protectionRowsHeightInches / protectionRowCount}in`;
  const encumbrance = getEncumbrance(character);
  const specialAttackBonuses = getSpecialAttackBonuses(character);
  const racialAbilities = [
    ...(race.traits ?? []),
    ...(race.specialAbilities ?? []),
    ...getRacialSpellLikeAbilities(character).map((ability) =>
      `${ability.name} (${ability.usesPerDay}/day; caster level ${ability.casterLevel}${ability.savingThrow ? `; ${ability.savingThrow} DC ${ability.saveDC}` : ""})`,
    ),
  ];
  const classFeatures = getClassFeatureDisplay(character);
  const feats = Object.entries(character.featSelections ?? [])
    .filter(([, featId]) => Boolean(featId))
    .map(([slotId, featId]) => {
      const feat = featCatalog.find((entry) => entry.id === featId);
      if (!feat) return featId;
      const choices = [
        character.featWeaponSelections?.[slotId],
        character.featSkillSelections?.[slotId],
        character.featSpellSchoolSelections?.[slotId],
      ].filter(Boolean);
      return `${feat.name}${choices.length ? ` (${choices.join(", ")})` : ""}`;
    });

  return (
    <div className={`print-sheet-view${handwritten ? " print-handwritten" : ""}`}>
      <div className="print-sheet-actions">
        <p>
          Two-page character record · Letter portrait
          {spellcasters.length ? " · Variable spell pages per casting class" : ""}
        </p>
        <button type="button" className="note-style-toggle" role="switch" aria-checked={handwritten}
          onClick={() => setHandwritten((current) => !current)}>
          <span className="note-style-track" aria-hidden="true"><span /></span>
          Handwritten
        </button>
        <button
          className="quiet-button"
          type="button"
          disabled={!spellCatalog.ready}
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
        {spellcasters.length > 0 && !spellCatalog.ready && spellCatalog.status !== "error" && (
          <p role="status">Loading spell details before printing…</p>
        )}
        {spellCatalog.status === "error" && (
          <p role="alert">
            Unable to load spell details. {spellCatalog.error}
            <button type="button" onClick={spellCatalog.retry}>Retry</button>
          </p>
        )}
      </div>
      <div className="print-sheet-pages">
        <section className="reference-sheet-page reference-page-one" aria-label="Character record sheet, page 1">
          <header className="reference-page-one-header">
            <div className="reference-identity">
              <div className="reference-identity-row">
                <PrintField label="Character Name" value={character.name} />
                <PrintField label="Player" value={character.player} />
              </div>
              <div className="reference-identity-row">
                <PrintField label="Class and Level" value={classSummary} />
                <PrintField label="Race" value={character.race} />
                <PrintField label="Alignment" value={character.alignment} />
                <PrintField label="Deity" value={deityName} />
              </div>
              <div className="reference-identity-row reference-identity-details">
                <PrintField label="Size" value={race.size ?? "Medium"} />
                <PrintField label="Age" value={character.age} />
                <PrintField label="Gender" value={character.gender} />
                <PrintField label="Height" value={character.height} />
                <PrintField label="Weight" value={character.weight} />
                <PrintField label="Eyes" value={character.eyeColor} />
                <PrintField label="Hair" value={character.hairColor} />
                <PrintField label="Skin" value={character.skinColor} />
              </div>
            </div>
            <div className="reference-brand">
              <div className="reference-logo">DUNGEONS<br />&amp; DRAGONS</div>
              <div className="reference-sheet-name">CHARACTER RECORD SHEET</div>
            </div>
          </header>

          <div className="reference-page-one-body">
            <div className="reference-page-one-main">
              <div className="reference-combat-summary">
                <table className="reference-ability-table">
                  <thead>
                    <tr><th>Ability</th><th>Score</th><th>Modifier</th><th>Temp.</th><th>Temp. Mod.</th></tr>
                  </thead>
                  <tbody>
                    {abilities.map(([short, name]) => {
                      const ability = short.toLowerCase() as keyof Character["abilities"];
                      const score = getEffectiveAbilityScore(character, ability);
                      return (
                        <tr key={ability}>
                          <th><b>{short}</b><small>{name}</small></th>
                          <td>{score}</td>
                          <td>{abilityModifier(score)}</td>
                          <td />
                          <td />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="reference-defense-grid">
                  <div className="reference-vitals">
                    <div className="reference-vitals-primary">
                      <PrintField label="Hit Points" value={getMaximumHitPoints(character)} />
                      <PrintField label="Armor Class" value={armorClass.normal} />
                      <PrintField label="Touch AC" value={armorClass.touch} />
                      <PrintField label="Flat-Footed AC" value={armorClass.flatFooted} />
                      <PrintField label="Initiative" value={formatModifier(getInitiativeModifier(character))} />
                      <PrintField label="Speed" value={getMovement(character).speed} />
                      <PrintField label="Damage Reduction" value={character.damageReduction || ""} />
                      <PrintField label="Spell Resistance" value={character.spellResistance || ""} />
                    </div>
                    <div className="reference-vitals-movement">
                      <PrintField label="Fly" />
                      <PrintField label="Climb" />
                      <PrintField label="Swim" value={getMovement(character).swimSpeed ?? ""} />
                      <PrintField label="Burrow" />
                    </div>
                  </div>
                  <div className="reference-ac-breakdown">
                    <SectionTitle>Armor Class</SectionTitle>
                    <div className="reference-ac-components">
                      {[
                        ["Base", armorComponents.base],
                        ["Armor", armorComponents.armor],
                        ["Shield", armorComponents.shield],
                        ["DEX", armorComponents.dexterity],
                        ["Size", armorComponents.size],
                        ["Natural", armorComponents.naturalArmor],
                        ["Deflection", armorComponents.deflection],
                        ["Insight", armorComponents.insight],
                        ["Monk", armorComponents.monk],
                        ["Misc.", armorComponents.misc],
                        ...(armorClass.arrowCatchingShield
                          ? [["Ranged AC", armorClass.rangedWeapon] as [string, number]]
                          : []),
                      ].map(([label, value]) => (
                        <PrintField key={label} label={String(label)} value={Number(value)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="reference-save-attack-grid">
                <section className="reference-saves">
                  <SectionTitle>Saving Throws</SectionTitle>
                  <table>
                    <thead><tr><th>Save</th><th>Total</th><th>Base</th><th>Ability</th><th>Misc.</th></tr></thead>
                    <tbody>{saves.map((save) => (
                      <tr key={save.name}>
                        <th>{save.name}</th>
                        <td>{save.total}</td>
                        <td>{save.base}</td>
                        <td>{save.ability}</td>
                        <td>{save.misc}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </section>
                <section className="reference-bab-grapple">
                  <SectionTitle>Combat Stats</SectionTitle>
                  <PrintField label="Base Attack Bonus" value={formatModifier(getBaseAttackBonus(character))} />
                  <PrintField label="Grapple" value={formatModifier(specialAttackBonuses.grapple)} />
                  <PrintField
                    label={effectiveCharacterLevel > totalHitDice ? "ECL" : "Level"}
                    value={effectiveCharacterLevel}
                  />
                </section>
                <section className="reference-conditions">
                  <SectionTitle>Combat Notes</SectionTitle>
                  <PrintField label="Wounds / Current HP" />
                  <PrintField label="Nonlethal Damage" />
                  <PrintField label="Temporary HP" />
                </section>
              </div>

              <section className="reference-attacks">
                <SectionTitle>Attack</SectionTitle>
                <table className="reference-attack-table">
                  <thead><tr><th>Weapon / Slot</th><th>Attack Bonus</th><th>Damage</th><th>Critical</th><th>Range / Reach</th></tr></thead>
                  <tbody>
                    {weaponSlots.map((slot) => {
                      const attack = weaponAttacks.find((candidate) => candidate.slot === slot);
                      if (!attack) {
                        return (
                          <tr key={slot}>
                            <th><span className="reference-attack-slot">{slot.replace(" Weapon", "")}</span></th><td /><td /><td /><td />
                          </tr>
                        );
                      }
                      const { stats } = attack;
                      const reachParts = stats.reach?.match(/^(\d+(?:\.\d+)?\s*ft\.?)(.*)$/i);
                      return (
                        <tr key={slot}>
                          <th>
                            <span className="reference-attack-slot">{slot.replace(" Weapon", "")}</span>
                            <span className="reference-attack-item">{stats.name}</span>
                          </th>
                          <td className="reference-attack-bonus">{stats.attackSequence.map(formatModifier).join(" / ")}</td>
                          <td>
                            <span className="reference-attack-damage-value">{stats.damage}</span>
                            <span className="reference-attack-damage-type">{stats.damageType}</span>
                            {stats.enchantmentDamage.length > 0 && (
                              <span className="reference-attack-enchantment-damage">
                                {stats.enchantmentDamage.join(" · ")}
                              </span>
                            )}
                          </td>
                          <td>{stats.critical}</td>
                          <td>
                            {stats.rangeIncrement && (
                              <span className="reference-attack-distance">
                                <span className="reference-attack-distance-label">Range</span>
                                <span className="reference-attack-distance-value">{stats.rangeIncrement}</span>
                              </span>
                            )}
                            {stats.reach && (
                              <span className="reference-attack-distance">
                                <span className="reference-attack-distance-label">Reach</span>
                                <span className="reference-attack-distance-value">
                                  {reachParts ? (
                                    <>
                                      <span>{reachParts[1]}</span>
                                      {reachParts[2].trim() && <small className="reference-attack-distance-note">{reachParts[2].trim()}</small>}
                                    </>
                                  ) : stats.reach}
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PrintField label="Ammunition" value={ammunition.map(([key, quantity]) => `${getInventoryEntryDetails(key).name} x${quantity}`).join(", ")} />
              </section>

              <section className="reference-protection">
                <SectionTitle>Armor / Protective Items</SectionTitle>
                <table>
                  <thead><tr><th>Item</th><th>Type</th><th>AC Bonus</th><th>Max DEX</th><th>Check / Spell Failure</th></tr></thead>
                  <tbody>
                    {(["Armor", "Shield"] as const).map((slot) => (
                      <tr key={slot} style={{ height: protectionRowHeight }}>
                        <th>{character.equipment[slot]
                          ? <span className="reference-protection-item">{getInventoryEntryDetails(character.equipment[slot]).name}</span>
                          : slot}</th>
                        <td>{slot}</td>
                        <td className="reference-protection-value">{slot === "Armor" ? armorComponents.armor : armorComponents.shield}</td>
                        <td className="reference-protection-value">{slot === "Armor" && wornArmor && Number.isFinite(wornArmor.maximumDexterity)
                          ? wornArmor.maximumDexterity
                          : ""}</td>
                        <td className="reference-protection-value">{character.equipment[slot]
                          ? getCharacterEquipmentCheckPenalty(character, character.equipment[slot], slot)
                          : ""}</td>
                      </tr>
                    ))}
                    {additionalProtectiveItems.map(([slot, value]) => (
                      <tr key={slot} style={{ height: protectionRowHeight }}>
                        <th><span className="reference-protection-item">{getInventoryEntryDetails(value).name}</span></th><td>{slot}</td><td /><td /><td />
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 2 - additionalProtectiveItems.length) }, (_, index) => (
                      <tr key={`protective-blank-${index}`} style={{ height: protectionRowHeight }}><th /><td /><td /><td /><td /></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            <section className="reference-skills">
              <SectionTitle>Skills</SectionTitle>
              <table className="reference-skill-table">
                <thead><tr><th>Skill Name</th><th>Key</th><th>Total</th><th>Ability</th><th>Ranks</th><th>Misc.</th></tr></thead>
                <tbody>
                  {skills.map((skill) => {
                    const use = getSkillUse(character, skill);
                    const ability = getSkillAbility(skill);
                    const abilityBonus = ability
                      ? abilityModifier(getEffectiveAbilityScore(character, ability))
                      : 0;
                    const modifier = getSkillCheckModifier(character, skill);
                    const ranks = Math.floor(use.ranks);
                    return (
                      <tr key={skill}>
                        <th>
                          <span className={`reference-checkbox${isClassSkill(character, skill) ? " checked" : ""}`} aria-hidden="true" />
                          {skill}
                          {use.untrainedUse === "none" && (
                            <sup className="reference-trained-only-marker" title="Cannot be used untrained">*</sup>
                          )}
                        </th>
                        <td>{ability?.toUpperCase() ?? "—"}</td>
                        <td>{modifier === null ? "—" : modifier}</td>
                        <td>{abilityBonus}</td>
                        <td>{use.ranks || ""}</td>
                        <td>{modifier === null ? "" : modifier - abilityBonus - ranks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
          <footer className="reference-page-footer">
            <span className="reference-page-footer-page">CHARACTER RECORD SHEET · PAGE 1 OF 2</span>
            <span className="reference-page-footer-legend">* = trained only</span>
          </footer>
        </section>

        <section className="reference-sheet-page reference-page-two" aria-label="Character record sheet, page 2">
          <div className="reference-page-two-grid">
            <aside className="reference-xp-sidebar">
              <div className="reference-xp">
                <SectionTitle>Experience Points</SectionTitle>
                <PrintField label="Current" />
                <PrintField label="Next Level" />
              </div>
              <div className="reference-carrying">
                <SectionTitle>Carrying Capacity</SectionTitle>
                <PrintField label="Light Load" value={`${encumbrance.capacity.light} lb.`} />
                <PrintField label="Medium Load" value={`${encumbrance.capacity.medium} lb.`} />
                <PrintField label="Heavy Load" value={`${encumbrance.capacity.heavy} lb.`} />
                <PrintField label="Current Load" value={`${getCarriedWeight(character)} lb. (${encumbrance.load})`} />
              </div>
            </aside>

            <section className="reference-possessions">
              <SectionTitle>Gear</SectionTitle>
              <h3>Possessions on Person</h3>
              <div className="reference-inventory-list">
                {inventory.map(([key, quantity]) => {
                  const details = getInventoryEntryDetails(key);
                  return (
                    <div className="reference-inventory-row" key={key}>
                      <span>{details.name}</span><span>x{quantity}</span><small>{details.weight}</small>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 28 - inventory.length) }, (_, index) => (
                  <div className="reference-inventory-row reference-inventory-blank" key={`blank-${index}`}><span /><span /><small /></div>
                ))}
              </div>
              <PrintField label="Total Weight Carried" value={`${getCarriedWeight(character)} lb.`} />
            </section>

            <section className="reference-spells">
              <SectionTitle>Spells</SectionTitle>
              <div className="reference-spell-summary">
                <div className="reference-spell-save-mod">
                  <span>Spell Save</span>
                  <span className="print-field-value">{primarySpellSaveModifier || "\u00a0"}</span>
                  <small>DC Mod</small>
                </div>
                <div className="reference-spell-failure">
                  <strong>Arcane Spell Failure</strong>
                  <span className="print-field-value">
                    {primaryArcaneSpellFailure?.percent === null
                      ? "?"
                      : primaryArcaneSpellFailure?.percent ?? "\u00a0"}
                  </span>
                  <span>%</span>
                </div>
                <div className="reference-spell-conditional">
                  <span>Conditional Modifiers</span>
                </div>
              </div>
              <div className="reference-spell-level-grid">
                {[0, 5].map((firstLevel) => (
                  <table className="reference-spell-tracker" key={firstLevel}>
                    <thead>
                      <tr>
                        <th>Spells Known</th>
                        <th>Spell Save DC</th>
                        <th>Level</th>
                        <th>Spells / Day</th>
                        <th>Bonus Spells</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }, (_, index) => {
                        const spellLevel = firstLevel + index;
                        const effectivePrimaryCasterLevel = primarySpellcasterClassId
                          ? getEffectiveSpellcastingClassLevel(character, primarySpellcasterClassId)
                          : undefined;
                        const hasSpellLevel = primarySpellcasterClassId !== undefined &&
                          effectivePrimaryCasterLevel !== undefined &&
                          hasSpellLevelAtClassLevel(primarySpellcasterClassId, effectivePrimaryCasterLevel, spellLevel);
                        const slotsPerDay = primarySpellcasterClassId && hasSpellLevel
                          ? getDailySpellSlots(character, primarySpellcasterClassId, primarySpellcasterLevel, spellLevel)
                          : undefined;
                        const knownSpellLimit = primarySpellcasterClassId && hasSpellLevel &&
                          (primarySpellcasterClassId === "bard" || primarySpellcasterClassId === "sorcerer")
                          ? getKnownSpellLimit(character, primarySpellcasterClassId, primarySpellcasterLevel, spellLevel)
                          : undefined;
                        const bonusSpells = primarySpellcasterClassId && hasSpellLevel && slotsPerDay !== undefined
                          ? Math.max(
                            0,
                            slotsPerDay - baseSpellSlots(primarySpellcasterClassId, effectivePrimaryCasterLevel, spellLevel),
                          )
                          : undefined;
                        return (
                          <tr key={spellLevel}>
                            <td><span className="reference-spell-tracker-box">{knownSpellLimit ?? "\u00a0"}</span></td>
                            <td>
                              <span className="reference-spell-tracker-box">
                                {hasSpellLevel && primarySpellcasterClassId
                                  ? getSpellSaveDC(character, primarySpellcasterClassId, spellLevel, undefined, false)
                                  : ""}
                              </span>
                            </td>
                            <th scope="row">{spellLevelLabels[spellLevel]}</th>
                            <td>
                              <span className="reference-spell-tracker-box">{slotsPerDay ?? ""}</span>
                            </td>
                            <td>
                              <span className="reference-spell-tracker-box">{bonusSpells ?? ""}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ))}
              </div>
            </section>

            <section className="reference-worn-items">
              <SectionTitle>Magic Items Worn</SectionTitle>
              <div className="reference-worn-item-grid">
                {wornMagicSlots.map(([label, slot]) => {
                  const value = character.equipment[slot] || "";
                  return (
                    <div className={`reference-worn-item${value.trim() ? " has-item" : ""}`} key={slot}>
                      <span className="print-field-label">{label}</span>
                      <span className="print-field-value">{value || "\u00a0"}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="reference-features">
              <SectionTitle>Racial Traits / Class Features</SectionTitle>
              <div className="reference-feature-columns">
                <div>
                  <h3 className="reference-race-name">{race.name}</h3>
                  {racialAbilities.map((ability, index) => <p key={`race-${index}`}>{ability}</p>)}
                  {Array.from({ length: Math.max(0, 10 - racialAbilities.length) }, (_, index) => (
                    <p className="reference-feature-blank" key={`race-blank-${index}`} />
                  ))}
                </div>
                <div>
                  <h3>Class Features</h3>
                  {classFeatures.map(({ source, ability }, index) => (
                    <p key={`class-${source}-${index}`}><b>{source}:</b> {ability}</p>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - classFeatures.length) }, (_, index) => (
                    <p className="reference-feature-blank" key={`class-blank-${index}`} />
                  ))}
                </div>
              </div>
            </section>

            <section className="reference-feats">
              <SectionTitle>Feats</SectionTitle>
              <div className="reference-feat-list">
                {feats.map((feat, index) => <p key={`${feat}-${index}`}>{feat}</p>)}
                {Array.from({ length: Math.max(0, 14 - feats.length) }, (_, index) => (
                  <p className="reference-feat-blank" key={`feat-blank-${index}`} />
                ))}
              </div>
            </section>
            <div className="reference-feats-details">
              <section className="reference-languages">
                <SectionTitle>Languages</SectionTitle>
                <div className="reference-language-list">
                  {getCharacterLanguages(character).map((language) => <span key={language}>{language}</span>)}
                  {Array.from({ length: Math.max(0, 10 - getCharacterLanguages(character).length) }, (_, index) => (
                    <span className="reference-language-blank" key={`language-blank-${index}`} />
                  ))}
                </div>
              </section>
              <section className="reference-money">
                <SectionTitle>Money</SectionTitle>
                <PrintField label="Currency" value={character.equipment.Currency || ""} />
                <PrintField label="Runestones" value={character.equipment.Runestones || ""} />
              </section>
            </div>
          </div>
          <footer className="reference-page-footer">
            <span className="reference-page-footer-page">CHARACTER RECORD SHEET · PAGE 2 OF 2</span>
            <span className="reference-page-footer-legend">* = trained only</span>
          </footer>
        </section>
        {spellPages.map((page) => (
          <SpellReferencePage
            key={`${page.classId}-${page.pageNumber}`}
            character={character}
            page={page}
            totalPages={page.totalPages}
          />
        ))}
      </div>
    </div>
  );
}
