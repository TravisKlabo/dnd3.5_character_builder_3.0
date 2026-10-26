import { type Character, type ClassId, type SpellAcquisition, type WizardSpellLearning, classDefinitions, abilityModifier } from "../domain";
import { useState } from "react";
import { hasSpellLevelAtClassLevel, getDailySpellSlots, getCasterLevel, getSpellcastingAbility, getClassSpellSelections, getKnownSpellLimit, getWizardSpellbookSpells, formatSpellDuration, formatSpellSchool, getSpellSaveDC, getArcaneSpellFailure, getSkillCheckModifier, getSkillTotalTooltip, formatModifier } from "../rules";
import { getClassSpells } from "../data/spellCatalog";
import { Stat } from "./shared";
import { SpellPicker } from "./pickers";
import { WizardSpellbook } from "./WizardSpellbook";
import { ClericDomains, type ClericCastingUpdate } from "./ClericDomains";
import { getClericDomainSlotCount } from "../clericDomains";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";

type SpellSheetProps = {
  character: Character;
  levelUpOriginal?: Character;
  levelUpClassId?: ClassId;
  spellcastingClassId: ClassId;
  onKnownSpellsChange: (spells: string[], classId?: ClassId) => void;
  onSpellAcquisitionChange: (
    classId: ClassId,
    spell: string,
    acquisition: SpellAcquisition | null,
    record?: WizardSpellLearning,
  ) => void;
  onPreparedSpellsChange: (spells: string[], classId?: ClassId) => void;
  onExpendedSpellSlotsChange: (classId: ClassId, slots: Record<string, number[]>) => void;
  onClericCastingChange: (update: ClericCastingUpdate) => void;
  editable: boolean;
};

export function SpellSheets(props: Omit<SpellSheetProps, "spellcastingClassId">) {
  const [selectedClass, setSelectedClass] = useState<ClassId>();
  const casters = props.character.classLevels.filter(({ classId }) => classDefinitions[classId].spellcasting);
  const activeClass = casters.find(({ classId }) => classId === selectedClass)?.classId ??
    casters.find(({ classId }) => classId === props.levelUpClassId)?.classId ?? casters[0]?.classId;
  if (!activeClass) return <p>This character has no spellcasting classes.</p>;
  return (
    <section className="class-spell-sheets" aria-label="Class spell sheets">
      <div className="spell-class-tabs" role="tablist" aria-label="Spellcasting classes">
        {casters.map(({ classId, level }, index) => (
          <button key={classId} type="button" role="tab" id={`spell-tab-${classId}`}
            aria-controls={`spell-panel-${classId}`} aria-selected={activeClass === classId}
            tabIndex={activeClass === classId ? 0 : -1}
            onClick={() => setSelectedClass(classId)}
            onKeyDown={(event) => {
              const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              const next = event.key === "Home" ? 0 : event.key === "End" ? casters.length - 1 :
                offset ? (index + offset + casters.length) % casters.length : undefined;
              if (next === undefined) return;
              event.preventDefault();
              setSelectedClass(casters[next].classId);
              document.getElementById(`spell-tab-${casters[next].classId}`)?.focus();
            }}>
            {classDefinitions[classId].name} · {level}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`spell-panel-${activeClass}`} aria-labelledby={`spell-tab-${activeClass}`}>
        <SpellSheet {...props} key={activeClass} spellcastingClassId={activeClass}
          levelUpOriginal={props.levelUpClassId === activeClass ? props.levelUpOriginal : undefined}
          editable={props.editable || props.levelUpClassId === activeClass} />
      </div>
    </section>
  );
}

export function SpellSheet({
  character, levelUpOriginal, spellcastingClassId,
  onKnownSpellsChange, onSpellAcquisitionChange, onPreparedSpellsChange,
  onExpendedSpellSlotsChange, onClericCastingChange, editable,
}: SpellSheetProps) {
  const [openSpellLevel, setOpenSpellLevel] = useState<number | null>(null);
  const [wizardView, setWizardView] = useState<"spellbook" | "preparation">("spellbook");
  const spellcastingLevel = character.classLevels.find((level) => level.classId === spellcastingClassId);
  if (!spellcastingLevel || !classDefinitions[spellcastingClassId].spellcasting) {
    throw new Error(`No ${classDefinitions[spellcastingClassId].name} spellcasting progression exists for this character.`);
  }
  const spellcastingClass = classDefinitions[spellcastingClassId];
  const castingAbility = getSpellcastingAbility(spellcastingClass.id);
  const learningMode =
    spellcastingClass.id === "wizard"
      ? "Spellbook"
      : spellcastingClass.id === "bard" || spellcastingClass.id === "sorcerer"
        ? "Spells Known"
        : "Prepared Spells";
  const classLevel = spellcastingLevel.level;
  const availableLevels = Array.from({ length: 10 }, (_, index) => index).filter((level) =>
    hasSpellLevelAtClassLevel(spellcastingClass.id, classLevel, level),
  );
  const activeClassKnownSpells = new Set(
    getClassSpellSelections(character, "knownSpells")[spellcastingClass.id] ?? [],
  );
  const preparedSpells = getClassSpellSelections(character, "preparedSpells")[spellcastingClass.id] ?? [];
  const expendedSlots = character.expendedSpellSlotsByClass?.[spellcastingClass.id] ?? {};
  const classSpells = spellcastingClass.id === "wizard" ? getWizardSpellbookSpells() : getClassSpells(spellcastingClass.id);
  const originalClassKnownSpells = new Set(
    levelUpOriginal ? getClassSpellSelections(levelUpOriginal, "knownSpells")[spellcastingClass.id] ?? [] : [],
  );
  const castingModifier = abilityModifier(
    getEffectiveAbilityScore(character, castingAbility),
  );
  const arcaneFailure = getArcaneSpellFailure(character, spellcastingClassId);
  const concentration = getSkillCheckModifier(character, "Concentration");
  const levelLimit = (level: number) =>
    learningMode === "Spells Known"
      ? getKnownSpellLimit(character, spellcastingClass.id, classLevel, level)
      : getDailySpellSlots(character, spellcastingClass.id, classLevel, level);
  const setSpellSlot = (level: number, slot: number, spell: string) => {
    const levelSelections = classSpells
      .filter((entry) => entry.level === level)
      .map((entry) => entry.name)
      .filter((name) => activeClassKnownSpells.has(name));
    const nextLevelSelections = [...levelSelections];
    nextLevelSelections[slot] = spell;
    const nextClassSelections = [...activeClassKnownSpells].filter(
      (name) => !levelSelections.includes(name),
    );
    onKnownSpellsChange(
      [
        ...nextClassSelections,
        ...nextLevelSelections.filter(
          (name, index) => name && nextLevelSelections.indexOf(name) === index,
        ),
      ],
      spellcastingClass.id,
    );
  };

  return (
    <div className="spell-sheet">
      <div className="spell-sheet-header">
        <div>
          <label>
            Character Name
            <input value={character.name} readOnly />
          </label>
          <label>
            Spellcasting Class and Level
            <input
              value={`${spellcastingClass.name} ${spellcastingLevel?.level ?? 0}`}
              readOnly
            />
          </label>
        </div>
        <div>
          <label>
            Player
            <input value={character.player} readOnly />
          </label>
          <label>
            Spellcasting Ability
            <input
              value={`${castingAbility.toUpperCase()} ${getEffectiveAbilityScore(character, castingAbility)}`}
              title={`Base ${character.abilities[castingAbility]}\n${getAbilityEquipmentBonus(character, castingAbility).detail.join("\n")}`}
              readOnly
            />
          </label>
        </div>
        <div className="spell-sheet-brand">CHARACTER SPELL SHEET</div>
      </div>
      <div className="spell-sheet-stats">
        <Stat label="Spell Save DC" value={`10 + spell level + ${castingModifier}`} />
        <Stat
          label="Caster Level"
          value={String(getCasterLevel(spellcastingClass.id, classLevel))}
        />
        <Stat
          label="Spells per Day"
          value={
            availableLevels
              .map(
                (level) =>
                  `L${level}: ${
                    getDailySpellSlots(character, spellcastingClass.id, classLevel, level)
                  }${spellcastingClass.id === "cleric" && getClericDomainSlotCount(character, level) ? " + 1 domain" : ""}`,
              )
              .join(" · ") || "None"
          }
        />
        <Stat label="Selection" value={learningMode} />
        <Stat label="Concentration" value={concentration === null ? "Unavailable" : formatModifier(concentration)}
          title={getSkillTotalTooltip(character, "Concentration")} />
        {arcaneFailure && <Stat label="Arcane Spell Failure"
          value={arcaneFailure.percent === null ? "Unknown" : `${arcaneFailure.percent}%`} title={arcaneFailure.detail} />}
      </div>
      <div className="spell-class-summary">
        <p>{spellcastingClass.name} spells use {castingAbility.toUpperCase()} and only this class's levels.
          {learningMode === "Spellbook" ? " Record learned spells in Spellbook; choose today's copies and track slots in Daily Preparation." :
            learningMode === "Spells Known" ? " Choose spells known; daily slots are shared among this class's spells of the same level. No preparation is required." :
              " Prepare from this class's spell list. Each spell level has its own preparation limit."}</p>
        {spellcastingClass.id === "cleric" && <p>Daily slots below are ordinary cleric slots. Domain slots are prepared and tracked separately above the ordinary spell list.</p>}
        {spellcastingClass.id === "mystic" && <p className="spell-rules-notice">Mystic casting is inherited Dragonlance content and has not been source-verified.</p>}
        {availableLevels.length === 0 && <p>{spellcastingClass.name} spellcasting begins at class level 4. No spell slots are available yet.</p>}
        {(learningMode !== "Spellbook" || wizardView === "preparation") && <button type="button" className="quiet-button" onClick={() => onExpendedSpellSlotsChange(spellcastingClass.id, {})}>
          Reset {spellcastingClass.name} expended slots
        </button>}
      </div>
      {spellcastingClass.id === "cleric" && <ClericDomains character={character} editable={editable && !levelUpOriginal} onChange={onClericCastingChange} />}
      {learningMode === "Spellbook" && <div className="spell-class-tabs" role="tablist" aria-label="Wizard spell views">
        {(["spellbook", "preparation"] as const).map((view) => (
          <button key={view} type="button" role="tab" id={`wizard-${view}-tab`}
            aria-controls={`wizard-${view}-panel`} aria-selected={wizardView === view} tabIndex={wizardView === view ? 0 : -1}
            onClick={() => setWizardView(view)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "spellbook" : event.key === "End" ? "preparation" :
                view === "spellbook" ? "preparation" : "spellbook";
              setWizardView(next);
              document.getElementById(`wizard-${next}-tab`)?.focus();
            }}>{view === "spellbook" ? "Spellbook" : "Daily Preparation"}</button>
        ))}
      </div>}
      {learningMode === "Spellbook" && wizardView === "spellbook" ? (
        <div role="tabpanel" id="wizard-spellbook-panel" aria-labelledby="wizard-spellbook-tab">
          <WizardSpellbook character={character} original={levelUpOriginal} editable={editable}
            onKnownSpellsChange={onKnownSpellsChange} onAcquisitionChange={onSpellAcquisitionChange} />
        </div>
      ) : (
      <div role={learningMode === "Spellbook" ? "tabpanel" : undefined}
        id={learningMode === "Spellbook" ? "wizard-preparation-panel" : undefined}
        aria-labelledby={learningMode === "Spellbook" ? "wizard-preparation-tab" : undefined}>
      <div className="spell-sheet-title">SPELLS</div>
      {availableLevels.map((level) => {
        const levelSpells = classSpells.filter(
          (spell) => spell.level === level,
        );
        const limit = levelLimit(level);
        const dailySlotCount = getDailySpellSlots(character, spellcastingClass.id, classLevel, level);
        const preparationCount = preparedSpells.filter((name) => levelSpells.some((spell) => spell.name === name)).length;
        const selectedForLevel = levelSpells
          .filter(
            (spell) =>
              learningMode === "Prepared Spells"
                ? preparedSpells.includes(spell.name)
                : activeClassKnownSpells.has(spell.name),
          )
          .map((spell) => spell.name);
        const rowCount = learningMode === "Prepared Spells"
          ? levelSpells.length
          : learningMode === "Spells Known"
            ? Math.max(limit, selectedForLevel.length)
            : selectedForLevel.length;
          const hasOpenLevelUpChoices =
            openSpellLevel === level ||
            (Boolean(levelUpOriginal) &&
              (learningMode === "Spells Known"
              ? selectedForLevel.length < levelLimit(level) : false));
        return (
          <section
            className="spell-level-table"
            key={level}
            style={
              hasOpenLevelUpChoices || openSpellLevel === level
                ? { marginBottom: 340 }
                : undefined
            }
          >
            <div className="spell-level-heading">
              <strong>
                {level === 0 ? ["cleric", "druid", "mystic"].includes(spellcastingClass.id) ? "ORISONS" : "CANTRIPS" : `LEVEL ${level} SPELLS`}
              </strong>
              <span>Save DC {getSpellSaveDC(character, spellcastingClassId, level)}</span>
              <span>{dailySlotCount} daily slots</span>
              {learningMode !== "Spells Known" && <span>Prepared {preparationCount}/{dailySlotCount}</span>}
              {learningMode === "Spells Known" && <span>Known {selectedForLevel.length}/{limit}</span>}
              <span>EXPENDED SLOTS</span>
              {Array.from({ length: dailySlotCount }, (_, index) => (
                <input
                  className="slot-box"
                  type="checkbox"
                  key={index}
                  aria-label={`Expended level ${level} slot ${index + 1}`}
                  checked={(expendedSlots[level] ?? []).includes(index)}
                  onChange={(event) => onExpendedSpellSlotsChange(spellcastingClass.id, {
                    ...expendedSlots,
                    [level]: event.target.checked ? [...(expendedSlots[level] ?? []), index] :
                      (expendedSlots[level] ?? []).filter((slot) => slot !== index),
                  })}
                />
              ))}
            </div>
            {getEffectiveAbilityScore(character, castingAbility) < 10 + level && <p className="spell-rules-notice">
              {castingAbility.toUpperCase()} {10 + level} is required to cast spells of this level.
            </p>}
            {preparationCount > dailySlotCount && <p role="alert" className="spell-rules-notice">
              Too many {spellcastingClass.name} spells prepared at level {level}. Reduce preparation to {dailySlotCount}.
            </p>}
            {learningMode === "Spells Known" && selectedForLevel.length > limit && <p role="alert" className="spell-rules-notice">
              The saved {spellcastingClass.name} selection exceeds the level {level} known-spell limit of {limit}. Existing spells have been preserved.
            </p>}
            <table>
              <thead>
                <tr>
                  <th>{learningMode === "Spells Known" ? "KNOWN" : "PREPARED"}</th>
                  <th>SPELL NAME</th>
                  <th>DESCRIPTION</th>
                  <th>CONCENTRATION</th>
                  <th>SAVE</th>
                  <th>RANGE</th>
                  <th>CASTING TIME</th>
                  <th>COMPONENTS</th>
                  <th>DURATION</th>
                  <th>SCHOOL</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }, (_, slot) => {
                  const spellName =
                    learningMode === "Prepared Spells"
                        ? levelSpells[slot]?.name
                      : selectedForLevel[slot];
                  const spell = levelSpells.find(
                    (entry) => entry.name === spellName,
                  );
                  const spellAcquisition = spellName
                    ? character.spellAcquisitionByClass?.[spellcastingClass.id]?.[
                        spellName
                      ]
                    : undefined;
                  const isLevelUpLearned =
                    spellAcquisition === "level-up" ||
                    Boolean(
                      !spellAcquisition &&
                      levelUpOriginal &&
                        spellName &&
                        !originalClassKnownSpells.has(spellName),
                    );
                  const spellMarker = isLevelUpLearned
                    ? " (L)"
                    : spellAcquisition === "scroll"
                      ? " (S)"
                      : "";
                  const preparedCount = preparedSpells.filter((name) => name === spellName).length;
                  const preparedForLevel = preparedSpells.filter((name) => levelSpells.some((spell) => spell.name === name)).length;
                  return (
                    <tr className={spellName ? undefined : "empty-spell-row"} key={slot}>
                      <td>
                        {learningMode !== "Spells Known" && spellName && (
                          <input
                            type="number" min={0} max={preparedCount + Math.max(0, dailySlotCount - preparedForLevel)}
                            aria-label={`Prepare ${spellName}`}
                            value={preparedCount}
                            onChange={(event) => {
                              const count = Number(event.target.value);
                              if (!Number.isInteger(count) || count < 0 || count > preparedCount + Math.max(0, dailySlotCount - preparedForLevel)) {
                                event.currentTarget.setCustomValidity("Preparation must fit this spell level's available slots.");
                                event.currentTarget.reportValidity();
                                return;
                              }
                              event.currentTarget.setCustomValidity("");
                              onPreparedSpellsChange([
                                ...preparedSpells.filter((name) => name !== spellName),
                                ...Array.from({ length: count }, () => spellName),
                              ], spellcastingClass.id);
                            }}
                          />
                        )}
                      </td>
                      <td>
                        {learningMode === "Prepared Spells" || learningMode === "Spellbook" ? (
                          spellName ?? ""
                        ) : !editable || (levelUpOriginal && spellName && originalClassKnownSpells.has(spellName)) ? (
                          spellName ? (
                            <>
                              {spellName}
                              {spellMarker}
                            </>
                          ) : ""
                        ) : (
                          <>
                            <SpellPicker
                              spells={levelSpells.filter(
                                (entry) =>
                                  !selectedForLevel.includes(entry.name) ||
                                  selectedForLevel[slot] === entry.name,
                              )}
                              selected={spellName}
                              placeholder={
                                levelUpOriginal && !spellName
                                  ? "Choose a new spell"
                                  : !levelUpOriginal && slot < limit
                                    ? "Choose a spell"
                                    : ""
                              }
                              onChange={(name) => setSpellSlot(level, slot, name)}
                              onOpenChange={(open) =>
                                setOpenSpellLevel(open ? level : null)
                              }
                            />
                            {spellMarker && <small>{spellMarker}</small>}
                          </>
                        )}
                      </td>
                      <td className="spell-description-cell">
                        {spell && (
                          <>
                            {spell.description || ""}
                            <small>
                              ({spellcastingClass.name})
                            </small>
                          </>
                        )}
                      </td>
                      <td />
                      <td>{spell?.savingThrow || ""}</td>
                      <td>{spell?.range || ""}</td>
                      <td>{spell?.castingTime || ""}</td>
                      <td>{spell?.components || ""}</td>
                      <td>{formatSpellDuration(spell?.duration || "")}</td>
                      <td>{formatSpellSchool(spell?.school)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
      </div>
      )}
    </div>
  );
}
