import { type Character, type ClassId, type SpellAcquisition, type WizardSpellLearning, classDefinitions, abilityModifier } from "../domain";
import { useState } from "react";
import { hasSpellLevelAtClassLevel, baseSpellSlots, getDailySpellSlots, getCasterLevel, getChosenFeats, getSpellcastingAbility, getClassSpellSelections, getKnownSpellLimit, getWizardSpellbookSpells, formatSpellDuration, formatSpellSchool, getSpellSaveDC, getArcaneSpellFailure, getSkillCheckModifier, getSkillTotalTooltip, formatModifier } from "../rules";
import { getClassSpells, getSrdSpellSourceBook, srdSpellContentSource } from "../data/spellCatalog";
import { Stat } from "./shared";
import { SpellPicker } from "./pickers";
import { WizardSpellbook } from "./WizardSpellbook";
import { ClericDomains, type ClericCastingUpdate } from "./ClericDomains";
import { getClericDomainSlotCount } from "../clericDomains";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";
import { CombatCastingContextControl, ContentSourceLabel } from "./shared";
import type { CombatCastingContext } from "../rules";

type SpellSheetProps = {
  character: Character;
  combatCastingContext?: CombatCastingContext;
  onCombatCastingContextChange: (context: CombatCastingContext | undefined) => void;
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
  onPreparedSpellsChange: (
    spells: string[],
    classId?: ClassId,
    spellSlotLevels?: Record<string, number[]>,
    spellEmpoweredCopies?: Record<string, boolean[]>,
    spellMaximizedCopies?: Record<string, boolean[]>,
    spellExtendedCopies?: Record<string, boolean[]>,
  ) => void;
  onCharacterUpdate: (update: (current: Character) => Character) => void;
  onExpendedSpellSlotsChange: (classId: ClassId, slots: Record<string, number[]>) => void;
  onClericCastingChange: (update: ClericCastingUpdate) => void;
  editable: boolean;
};

type PreparedMetamagicMode = {
  extended: boolean;
  empowered: boolean;
  maximized: boolean;
  slotAdjustment: number;
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
      <button
        type="button"
        className="quiet-button"
        onClick={() => props.onCharacterUpdate((current) => ({
          ...current,
          expendedSpellSlotsByClass: {},
          clericDomainExpended: [],
          spellPreparationCompletedByClass: {},
        }))}
      >
        Confirm rest/prayer and recover spell slots
      </button>
      <div role="tabpanel" id={`spell-panel-${activeClass}`} aria-labelledby={`spell-tab-${activeClass}`}>
        <SpellSheet {...props} key={activeClass} spellcastingClassId={activeClass}
          levelUpOriginal={props.levelUpClassId === activeClass ? props.levelUpOriginal : undefined}
          editable={props.editable || props.levelUpClassId === activeClass} />
      </div>
    </section>
  );
}

export function SpellSheet({
  character, levelUpOriginal, spellcastingClassId, combatCastingContext, onCombatCastingContextChange,
  onKnownSpellsChange, onSpellAcquisitionChange, onPreparedSpellsChange,
  onCharacterUpdate, onExpendedSpellSlotsChange,
  onClericCastingChange, editable,
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
  const casterLevel = getCasterLevel(spellcastingClass.id, classLevel);
  const selectedFeats = getChosenFeats(character);
  const spellPenetrationBonus =
    (selectedFeats.includes("spell-penetration") ? 2 : 0) +
    (selectedFeats.includes("greater-spell-penetration") ? 2 : 0);
  const hasHeightenSpell = selectedFeats.includes("heighten-spell");
  const hasEmpowerSpell = selectedFeats.includes("empower-spell");
  const hasMaximizeSpell = selectedFeats.includes("maximize-spell");
  const hasExtendSpell = selectedFeats.includes("extend-spell");
  const availableLevels = Array.from({ length: 10 }, (_, index) => index).filter((level) =>
    hasSpellLevelAtClassLevel(spellcastingClass.id, classLevel, level),
  );
  const spellAbilityScore = getEffectiveAbilityScore(character, castingAbility);
  const activeClassKnownSpells = new Set(
    getClassSpellSelections(character, "knownSpells")[spellcastingClass.id] ?? [],
  );
  const preparedSpells = getClassSpellSelections(character, "preparedSpells")[spellcastingClass.id] ?? [];
  const expendedSlots = character.expendedSpellSlotsByClass?.[spellcastingClass.id] ?? {};
  const preparationComplete =
    character.spellPreparationCompletedByClass?.[spellcastingClass.id] === true;
  const requiresPreparation = learningMode !== "Spells Known";
  const preparationView = learningMode !== "Spellbook" || wizardView === "preparation";
  const classSpells = spellcastingClass.id === "wizard" ? getWizardSpellbookSpells() : getClassSpells(spellcastingClass.id);
  const metamagicModes: PreparedMetamagicMode[] = [];
  for (const extended of hasExtendSpell ? [false, true] : [false]) {
    for (const empowered of hasEmpowerSpell ? [false, true] : [false]) {
      for (const maximized of hasMaximizeSpell ? [false, true] : [false]) {
        const slotAdjustment = Number(extended) + (empowered ? 2 : 0) + (maximized ? 3 : 0);
        if (slotAdjustment) metamagicModes.push({ extended, empowered, maximized, slotAdjustment });
      }
    }
  }
  metamagicModes.sort((left, right) => left.slotAdjustment - right.slotAdjustment);
  const getMetamagicSlotCount = (
    slotLevel: number,
    effectiveSpellLevel: number,
    slotAdjustment: number,
  ) => {
    if (
      slotAdjustment === 0 ||
      slotLevel !== effectiveSpellLevel + slotAdjustment ||
      slotLevel > 9 ||
      !hasSpellLevelAtClassLevel(spellcastingClass.id, classLevel, slotLevel) ||
      spellAbilityScore < 10 + effectiveSpellLevel
    ) return 0;
    const modifier = abilityModifier(spellAbilityScore);
    const bonus = slotLevel > 0 && modifier >= slotLevel
      ? Math.floor((modifier - slotLevel) / 4) + 1
      : 0;
    return baseSpellSlots(spellcastingClass.id, classLevel, slotLevel) + bonus;
  };
  const getMetamagicSlotCapacity = (slotLevel: number) => Math.max(
    0,
    ...classSpells.flatMap((spell) => {
      if (
        (learningMode === "Spellbook" && !activeClassKnownSpells.has(spell.name)) ||
        !availableLevels.includes(spell.level)
      ) return [];
      const effectiveLevels = hasHeightenSpell
        ? availableLevels.filter((effectiveLevel) =>
          effectiveLevel >= spell.level,
        )
        : [spell.level];
      return effectiveLevels.flatMap((effectiveLevel) =>
        metamagicModes.map(({ slotAdjustment }) =>
          getMetamagicSlotCount(slotLevel, effectiveLevel, slotAdjustment),
        ),
      );
    }),
  );
  const getPreparedSlotCapacity = (slotLevel: number) => Math.max(
    getDailySpellSlots(character, spellcastingClass.id, classLevel, slotLevel),
    getMetamagicSlotCapacity(slotLevel),
  );
  const getPreparationChoices = (effectiveSpellLevel: number) => [
    {
      spellLevel: effectiveSpellLevel,
      extended: false,
      empowered: false,
      maximized: false,
      slotLevel: effectiveSpellLevel,
      capacity: getDailySpellSlots(character, spellcastingClass.id, classLevel, effectiveSpellLevel),
    },
    ...metamagicModes.map((mode) => ({
      ...mode,
      spellLevel: effectiveSpellLevel,
      slotLevel: effectiveSpellLevel + mode.slotAdjustment,
      capacity: getMetamagicSlotCount(
        effectiveSpellLevel + mode.slotAdjustment,
        effectiveSpellLevel,
        mode.slotAdjustment,
      ),
    })),
  ];
  const storedPreparedSlotLevels =
    character.preparedSpellSlotLevelsByClass?.[spellcastingClass.id] ?? {};
  const storedPreparedEmpoweredCopies =
    character.empowerByClass?.[spellcastingClass.id] ?? {};
  const storedPreparedMaximizedCopies =
    character.maximizeByClass?.[spellcastingClass.id] ?? {};
  const storedPreparedExtendedCopies =
    character.extendByClass?.[spellcastingClass.id] ?? {};
  const preparedSlotLevelsBySpell: Record<string, number[]> = {};
  const preparedEmpoweredCopiesBySpell: Record<string, boolean[]> = {};
  const preparedMaximizedCopiesBySpell: Record<string, boolean[]> = {};
  const preparedExtendedCopiesBySpell: Record<string, boolean[]> = {};
  const preparedCopyIndexes = new Map<string, number>();
  const spellLevelsByName = new Map(
    classSpells.map((spell) => [spell.name, spell.level] as const),
  );
  for (const spellName of preparedSpells) {
    const baseLevel = spellLevelsByName.get(spellName);
    if (baseLevel === undefined) continue;
    const copyIndex = preparedCopyIndexes.get(spellName) ?? 0;
    const storedLevel = storedPreparedSlotLevels[spellName]?.[copyIndex];
    const slotLevel =
      hasHeightenSpell &&
      typeof storedLevel === "number" &&
      Number.isInteger(storedLevel) &&
      storedLevel >= baseLevel &&
      availableLevels.includes(storedLevel)
        ? storedLevel
        : baseLevel;
    (preparedSlotLevelsBySpell[spellName] ??= []).push(slotLevel);
    (preparedEmpoweredCopiesBySpell[spellName] ??= []).push(
      storedPreparedEmpoweredCopies[spellName]?.[copyIndex] === true,
    );
    (preparedMaximizedCopiesBySpell[spellName] ??= []).push(
      storedPreparedMaximizedCopies[spellName]?.[copyIndex] === true,
    );
    (preparedExtendedCopiesBySpell[spellName] ??= []).push(
      storedPreparedExtendedCopies[spellName]?.[copyIndex] === true,
    );
    preparedCopyIndexes.set(spellName, copyIndex + 1);
  }
  const preparedSlotUse = Array.from({ length: 16 }, () => 0);
  Object.entries(preparedSlotLevelsBySpell).forEach(([spellName, levels]) =>
    levels.forEach((level, copyIndex) => {
      const empowered = hasEmpowerSpell &&
        preparedEmpoweredCopiesBySpell[spellName]?.[copyIndex] === true;
      const maximized = hasMaximizeSpell &&
        preparedMaximizedCopiesBySpell[spellName]?.[copyIndex] === true;
      const extended = hasExtendSpell &&
        preparedExtendedCopiesBySpell[spellName]?.[copyIndex] === true;
      const slotAdjustment = Number(extended) + (empowered ? 2 : 0) + (maximized ? 3 : 0);
      preparedSlotUse[level + slotAdjustment] += 1;
    }),
  );
  const preparationExceedsSlots = preparedSlotUse.some((usage, level) =>
    usage > 0 && (level > 9 || usage > getPreparedSlotCapacity(level)),
  ) || Object.values(preparedSlotLevelsBySpell).some((levels) =>
    levels.some((level) => spellAbilityScore < 10 + level),
  );
  const getPreparationSlotCapacity = (effectiveSpellLevel: number, slotAdjustment: number) =>
    slotAdjustment
      ? getMetamagicSlotCount(
        effectiveSpellLevel + slotAdjustment,
        effectiveSpellLevel,
        slotAdjustment,
      )
      : getDailySpellSlots(character, spellcastingClass.id, classLevel, effectiveSpellLevel);
  const canFitPreparedCopy = (
    effectiveSpellLevel: number,
    slotAdjustment: number,
    currentUsedSlotLevel: number,
  ) => {
    const usedSlotLevel = effectiveSpellLevel + slotAdjustment;
    return usedSlotLevel <= 9 &&
      preparedSlotUse[usedSlotLevel] - Number(currentUsedSlotLevel === usedSlotLevel) <
        getPreparationSlotCapacity(effectiveSpellLevel, slotAdjustment);
  };
  const originalClassKnownSpells = new Set(
    levelUpOriginal ? getClassSpellSelections(levelUpOriginal, "knownSpells")[spellcastingClass.id] ?? [] : [],
  );
  const castingModifier = abilityModifier(
    getEffectiveAbilityScore(character, castingAbility),
  );
  const arcaneFailure = getArcaneSpellFailure(character, spellcastingClassId);
  const concentration = getSkillCheckModifier(character, "Concentration", undefined, undefined, combatCastingContext);
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
          value={String(casterLevel)}
        />
        <Stat
          label="SR check modifier"
          value={casterLevel > 0
            ? formatModifier(casterLevel + spellPenetrationBonus)
            : "Unavailable"}
          title={`Roll 1d20 plus this modifier to overcome spell resistance${spellPenetrationBonus ? "; Spell Penetration feats add +2 each" : ""}. Compare manually against the spell's SR.`}
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
          title={getSkillTotalTooltip(character, "Concentration", undefined, undefined, combatCastingContext)} />
        {arcaneFailure && <Stat label="Arcane Spell Failure"
          value={arcaneFailure.percent === null ? "Unknown" : `${arcaneFailure.percent}%`} title={arcaneFailure.detail} />}
      </div>
      <CombatCastingContextControl
        character={character}
        context={combatCastingContext}
        onChange={onCombatCastingContextChange}
      />
      <div className="spell-class-summary">
        <p>{spellcastingClass.name} spells use {castingAbility.toUpperCase()} and only this class's levels.
          {learningMode === "Spellbook" ? " Record learned spells in Spellbook; choose today's copies and track slots in Daily Preparation." :
            learningMode === "Spells Known" ? " Choose spells known; daily slots are shared among this class's spells of the same level. No preparation is required." :
              " Prepare from this class's spell list. Each spell level has its own preparation limit."}</p>
        {spellcastingClass.id === "cleric" && <p>Daily slots below are ordinary cleric slots. Domain slots are prepared and tracked separately above the ordinary spell list.</p>}
        {spellcastingClass.id === "mystic" && <p className="spell-rules-notice">Mystic casting is inherited Dragonlance content and has not been source-verified.</p>}
        {(hasHeightenSpell || hasEmpowerSpell || hasMaximizeSpell || hasExtendSpell) && <p className="spell-rules-notice">
          {hasHeightenSpell && (learningMode === "Spells Known"
            ? "Heighten Spell for spontaneous casting remains manual, including higher-level slot use and casting time."
            : "Heighten Spell is tracked per copy in this class's prepared list.")}
          {hasHeightenSpell && (hasEmpowerSpell || hasMaximizeSpell || hasExtendSpell) ? " " : ""}
          {hasEmpowerSpell && hasMaximizeSpell && learningMode !== "Spells Known"
            ? "Empower and Maximize are tracked per prepared copy for slot use; maximize the variable effect and add half the normally rolled result manually."
            : hasEmpowerSpell && (learningMode === "Spells Known"
            ? "Empower Spell for spontaneous casting remains manual, including higher-level slot use, casting time, and its effect."
            : "Empower Spell is tracked per prepared copy for slot use; apply the 1.5x increase to variable numeric effects manually.")}
          {hasMaximizeSpell && !(hasEmpowerSpell && learningMode !== "Spells Known") && (learningMode === "Spells Known"
            ? "Maximize Spell for spontaneous casting remains manual, including higher-level slot use, casting time, and its effect."
            : "Maximize Spell is tracked per prepared copy for slot use; maximize variable numeric effects manually.")}
          {(hasEmpowerSpell || hasMaximizeSpell) && hasExtendSpell ? " " : ""}
          {hasExtendSpell && (learningMode === "Spells Known"
            ? "Extend Spell for spontaneous casting remains manual, including higher-level slot use, casting time, and duration."
            : "Extend Spell is tracked per prepared copy for slot use; double eligible durations manually. Concentration, instantaneous, and permanent spells are unaffected.")}
          {(hasHeightenSpell || hasEmpowerSpell || hasMaximizeSpell || hasExtendSpell) && " Spontaneous casting and cleric domain spells remain manual."}
          {hasHeightenSpell && " Non-DC spell-level effects remain manual."}
        </p>}
        {availableLevels.length === 0 && <p>{spellcastingClass.name} spellcasting begins at class level 4. No spell slots are available yet.</p>}
        {requiresPreparation && preparationView && (
          preparationComplete
            ? <p role="status">Daily preparation complete.</p>
            : <>
                <p>Confirm required rest or prayer before preparing.</p>
                <button
                  type="button"
                  className="quiet-button"
                  disabled={preparationExceedsSlots}
                  onClick={() => onCharacterUpdate((current) => ({
                    ...current,
                    spellPreparationCompletedByClass: {
                      ...current.spellPreparationCompletedByClass,
                      [spellcastingClass.id]: true,
                    },
                  }))}
                >
                  Complete {spellcastingClass.name} daily preparation
                </button>
              </>
        )}
      </div>
      {spellcastingClass.id === "cleric" && <ClericDomains
        character={character}
        editable={editable && !levelUpOriginal}
        preparationComplete={preparationComplete}
        onChange={onClericCastingChange}
      />}
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
        const dailySlotCount = getPreparedSlotCapacity(level);
        const preparationCount = preparedSlotUse[level];
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
                  disabled={requiresPreparation && !preparationComplete}
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
                  <th>SAVE / DC</th>
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
                  const preparedLevels = spellName
                    ? preparedSlotLevelsBySpell[spellName] ?? []
                    : [];
                  const preparedCount = preparedLevels.length;
                  const allowedPreparationLevels = availableLevels.filter(
                    (slotLevel) =>
                      slotLevel >= level &&
                      (hasHeightenSpell || slotLevel === level) &&
                      spellAbilityScore >= 10 + slotLevel,
                  );
                  const allowedSlotCapacities = new Map<number, number>();
                  allowedPreparationLevels.forEach((spellLevel) => {
                    getPreparationChoices(spellLevel).forEach(({ slotLevel, capacity }) => {
                      allowedSlotCapacities.set(
                        slotLevel,
                        Math.max(
                          allowedSlotCapacities.get(slotLevel) ?? 0,
                          capacity,
                        ),
                      );
                    });
                  });
                  const additionalPreparationCapacity = [...allowedSlotCapacities].reduce(
                    (total, [slotLevel, capacity]) =>
                      total + Math.max(0, capacity - preparedSlotUse[slotLevel]),
                    0,
                  );
                  const maxPreparedCount = preparedCount + additionalPreparationCapacity;
                  return (
                    <tr className={spellName ? undefined : "empty-spell-row"} key={slot}>
                      <td>
                        {learningMode !== "Spells Known" && spellName && (
                          <input
                            type="number" min={0} max={maxPreparedCount}
                            aria-label={`Prepare ${spellName}`}
                            value={preparedCount}
                            disabled={preparationComplete}
                            onChange={(event) => {
                              const count = Number(event.target.value);
                              if (!Number.isInteger(count) || count < 0 || count > maxPreparedCount) {
                                event.currentTarget.setCustomValidity("Preparation must fit available spell slots, including applicable metamagic slots.");
                                event.currentTarget.reportValidity();
                                return;
                              }
                              event.currentTarget.setCustomValidity("");
                              const nextPreparedSpells = [
                                ...preparedSpells.filter((name) => name !== spellName),
                                ...Array.from({ length: count }, () => spellName),
                              ];
                              const nextSlotUse = [...preparedSlotUse];
                              const nextEmpoweredCopies =
                                (preparedEmpoweredCopiesBySpell[spellName] ?? []).slice(0, count);
                              const nextMaximizedCopies =
                                (preparedMaximizedCopiesBySpell[spellName] ?? []).slice(0, count);
                              const nextExtendedCopies =
                                (preparedExtendedCopiesBySpell[spellName] ?? []).slice(0, count);
                              for (let copyIndex = count; copyIndex < preparedLevels.length; copyIndex += 1) {
                                const empowered = preparedEmpoweredCopiesBySpell[spellName]?.[copyIndex] === true;
                                const maximized = preparedMaximizedCopiesBySpell[spellName]?.[copyIndex] === true;
                                const extended = preparedExtendedCopiesBySpell[spellName]?.[copyIndex] === true;
                                nextSlotUse[
                                  preparedLevels[copyIndex] +
                                  Number(extended) +
                                  (empowered ? 2 : 0) +
                                  (maximized ? 3 : 0)
                                ] -= 1;
                              }
                              const nextPreparedLevels = preparedLevels.slice(0, count);
                              while (nextPreparedLevels.length < count) {
                                const choices = allowedPreparationLevels.flatMap(getPreparationChoices);
                                const nextChoice = choices.find(
                                  ({ slotLevel, capacity }) => nextSlotUse[slotLevel] < capacity,
                                );
                                if (!nextChoice) {
                                  event.currentTarget.setCustomValidity("No available spell slot can hold this preparation.");
                                  event.currentTarget.reportValidity();
                                  return;
                                }
                                nextPreparedLevels.push(nextChoice.spellLevel);
                                nextExtendedCopies.push(nextChoice.extended);
                                nextEmpoweredCopies.push(nextChoice.empowered);
                                nextMaximizedCopies.push(nextChoice.maximized);
                                nextSlotUse[nextChoice.slotLevel] += 1;
                              }
                              const nextSlotLevelsBySpell = Object.fromEntries(
                                Object.entries(storedPreparedSlotLevels)
                                  .filter(([name]) => name !== spellName && nextPreparedSpells.includes(name)),
                              );
                              const nextEmpoweredCopiesBySpell = Object.fromEntries(
                                Object.entries(storedPreparedEmpoweredCopies)
                                  .filter(([name]) => name !== spellName && nextPreparedSpells.includes(name)),
                              );
                              const nextMaximizedCopiesBySpell = Object.fromEntries(
                                Object.entries(storedPreparedMaximizedCopies)
                                  .filter(([name]) => name !== spellName && nextPreparedSpells.includes(name)),
                              );
                              const nextExtendedCopiesBySpell = Object.fromEntries(
                                Object.entries(storedPreparedExtendedCopies)
                                  .filter(([name]) => name !== spellName && nextPreparedSpells.includes(name)),
                              );
                              if (count > 0) {
                                nextSlotLevelsBySpell[spellName] = nextPreparedLevels;
                                nextEmpoweredCopiesBySpell[spellName] = nextEmpoweredCopies;
                                nextMaximizedCopiesBySpell[spellName] = nextMaximizedCopies;
                                nextExtendedCopiesBySpell[spellName] = nextExtendedCopies;
                              }
                              onPreparedSpellsChange(
                                nextPreparedSpells,
                                spellcastingClass.id,
                                nextSlotLevelsBySpell,
                                nextEmpoweredCopiesBySpell,
                                nextMaximizedCopiesBySpell,
                                nextExtendedCopiesBySpell,
                              );
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
                                      {(hasHeightenSpell || hasEmpowerSpell || hasMaximizeSpell || hasExtendSpell) && spellName && preparedLevels.map((preparedLevel, copyIndex) => {
                                        const empowered = hasEmpowerSpell &&
                                          preparedEmpoweredCopiesBySpell[spellName]?.[copyIndex] === true;
                                        const maximized = hasMaximizeSpell &&
                                          preparedMaximizedCopiesBySpell[spellName]?.[copyIndex] === true;
                                        const extended = hasExtendSpell &&
                                          preparedExtendedCopiesBySpell[spellName]?.[copyIndex] === true;
                                        const currentSlotAdjustment =
                                          Number(extended) + (empowered ? 2 : 0) + (maximized ? 3 : 0);
                                        const currentUsedSlotLevel = preparedLevel + currentSlotAdjustment;
                                        const canEmpower = empowered || canFitPreparedCopy(
                                          preparedLevel,
                                          Number(extended) + 2 + (maximized ? 3 : 0),
                                          currentUsedSlotLevel,
                                        );
                                        const canMaximize = maximized || canFitPreparedCopy(
                                          preparedLevel,
                                          Number(extended) + (empowered ? 2 : 0) + 3,
                                          currentUsedSlotLevel,
                                        );
                                        const canExtend = extended || canFitPreparedCopy(
                                          preparedLevel,
                                          1 + (empowered ? 2 : 0) + (maximized ? 3 : 0),
                                          currentUsedSlotLevel,
                                        );
                                        return (
                                          <div key={copyIndex} className="prepared-spell-metamagic">
                              {hasHeightenSpell && <label className="prepared-spell-heighten">
                                Copy {copyIndex + 1} slot level
                                <select
                                  aria-label={`Prepared ${spellName} copy ${copyIndex + 1} slot level`}
                                  value={preparedLevel}
                                  disabled={preparationComplete}
                                  onChange={(event) => {
                                    const nextLevel = Number(event.currentTarget.value);
                                    if (nextLevel === preparedLevel) return;
                                    const nextUsedSlotLevel = nextLevel + currentSlotAdjustment;
                                    if (
                                      !allowedPreparationLevels.includes(nextLevel) ||
                                      nextUsedSlotLevel > 9 ||
                                      preparedSlotUse[nextUsedSlotLevel] -
                                        Number(currentUsedSlotLevel === nextUsedSlotLevel) >=
                                          getPreparationSlotCapacity(nextLevel, currentSlotAdjustment)
                                    ) {
                                      event.currentTarget.setCustomValidity("Choose a level with an available slot and sufficient casting ability.");
                                      event.currentTarget.reportValidity();
                                      return;
                                    }
                                    event.currentTarget.setCustomValidity("");
                                    const nextPreparedLevels = [...preparedLevels];
                                    nextPreparedLevels[copyIndex] = nextLevel;
                                    onPreparedSpellsChange(preparedSpells, spellcastingClass.id, {
                                      ...storedPreparedSlotLevels,
                                      [spellName]: nextPreparedLevels,
                                    });
                                  }}
                                >
                                  {availableLevels
                                    .filter((slotLevel) => slotLevel >= level && (hasHeightenSpell || slotLevel === level))
                                    .map((slotLevel) => {
                                      const usedSlotLevel = slotLevel + currentSlotAdjustment;
                                      const currentCopyUsesSlot = usedSlotLevel === currentUsedSlotLevel;
                                      const capacity = getPreparationSlotCapacity(slotLevel, currentSlotAdjustment);
                                      const canCast = spellAbilityScore >= 10 + slotLevel;
                                      return (
                                        <option
                                          key={slotLevel}
                                          value={slotLevel}
                                          disabled={
                                            !canCast ||
                                            usedSlotLevel > 9 ||
                                            (!currentCopyUsesSlot && preparedSlotUse[usedSlotLevel] >= capacity)
                                          }
                                        >
                                          Level {slotLevel}
                                        </option>
                                      );
                                    })}
                                </select>
                              </label>}
                              {hasExtendSpell && <label className="prepared-spell-extend">
                                <input
                                  type="checkbox"
                                  aria-label={`Extend ${spellName} copy ${copyIndex + 1}`}
                                  checked={extended}
                                  disabled={preparationComplete || !canExtend}
                                  title={!canExtend ? "Extend requires an available slot one level higher." : undefined}
                                  onChange={(event) => {
                                    const nextExtended = event.currentTarget.checked;
                                    const nextAdjustment =
                                      Number(nextExtended) + (empowered ? 2 : 0) + (maximized ? 3 : 0);
                                    if (!canFitPreparedCopy(preparedLevel, nextAdjustment, currentUsedSlotLevel)) {
                                      event.currentTarget.setCustomValidity("No available slot can hold this Extended preparation.");
                                      event.currentTarget.reportValidity();
                                      return;
                                    }
                                    event.currentTarget.setCustomValidity("");
                                    const nextExtendedCopies = [
                                      ...(preparedExtendedCopiesBySpell[spellName] ?? []),
                                    ];
                                    nextExtendedCopies[copyIndex] = nextExtended;
                                    onPreparedSpellsChange(
                                      preparedSpells,
                                      spellcastingClass.id,
                                      storedPreparedSlotLevels,
                                      storedPreparedEmpoweredCopies,
                                      storedPreparedMaximizedCopies,
                                      {
                                        ...storedPreparedExtendedCopies,
                                        [spellName]: nextExtendedCopies,
                                      },
                                    );
                                  }}
                                />
                                Extend (+1 slot level)
                              </label>}
                              {hasEmpowerSpell && <label className="prepared-spell-empower">
                                <input
                                  type="checkbox"
                                  aria-label={`Empower ${spellName} copy ${copyIndex + 1}`}
                                  checked={empowered}
                                  disabled={preparationComplete || !canEmpower}
                                  title={!canEmpower ? "Empower requires an available slot two levels higher." : undefined}
                                  onChange={(event) => {
                                    const nextEmpowered = event.currentTarget.checked;
                                    const nextAdjustment =
                                      Number(extended) + (nextEmpowered ? 2 : 0) + (maximized ? 3 : 0);
                                    if (!canFitPreparedCopy(preparedLevel, nextAdjustment, currentUsedSlotLevel)) {
                                      event.currentTarget.setCustomValidity("No available slot can hold this Empowered preparation.");
                                      event.currentTarget.reportValidity();
                                      return;
                                    }
                                    event.currentTarget.setCustomValidity("");
                                    const nextEmpoweredCopies = [
                                      ...(preparedEmpoweredCopiesBySpell[spellName] ?? []),
                                    ];
                                    nextEmpoweredCopies[copyIndex] = nextEmpowered;
                                    onPreparedSpellsChange(
                                      preparedSpells,
                                      spellcastingClass.id,
                                      storedPreparedSlotLevels,
                                      {
                                        ...storedPreparedEmpoweredCopies,
                                        [spellName]: nextEmpoweredCopies,
                                      },
                                      storedPreparedMaximizedCopies,
                                      storedPreparedExtendedCopies,
                                    );
                                  }}
                                />
                                Empower (+2 slot levels)
                              </label>}
                              {hasMaximizeSpell && <label className="prepared-spell-maximize">
                                <input
                                  type="checkbox"
                                  aria-label={`Maximize ${spellName} copy ${copyIndex + 1}`}
                                  checked={maximized}
                                  disabled={preparationComplete || !canMaximize}
                                  title={!canMaximize ? "Maximize requires an available slot three levels higher." : undefined}
                                  onChange={(event) => {
                                    const nextMaximized = event.currentTarget.checked;
                                    const nextAdjustment =
                                      Number(extended) + (empowered ? 2 : 0) + (nextMaximized ? 3 : 0);
                                    if (!canFitPreparedCopy(preparedLevel, nextAdjustment, currentUsedSlotLevel)) {
                                      event.currentTarget.setCustomValidity("No available slot can hold this Maximized preparation.");
                                      event.currentTarget.reportValidity();
                                      return;
                                    }
                                    event.currentTarget.setCustomValidity("");
                                    const nextMaximizedCopies = [
                                      ...(preparedMaximizedCopiesBySpell[spellName] ?? []),
                                    ];
                                    nextMaximizedCopies[copyIndex] = nextMaximized;
                                    onPreparedSpellsChange(
                                      preparedSpells,
                                      spellcastingClass.id,
                                      storedPreparedSlotLevels,
                                      storedPreparedEmpoweredCopies,
                                      {
                                        ...storedPreparedMaximizedCopies,
                                        [spellName]: nextMaximizedCopies,
                                      },
                                      storedPreparedExtendedCopies,
                                    );
                                  }}
                                />
                                Maximize (+3 slot levels)
                              </label>}
                            </div>
                          );
                        })}
                      </td>
                      <td className="spell-description-cell">
                        {spell && (
                          <>
                            {spell.description || ""}
                            <small>
                              ({spellcastingClass.name})
                            </small>
                            <ContentSourceLabel
                              source={srdSpellContentSource}
                              book={getSrdSpellSourceBook(spell)}
                            />
                          </>
                        )}
                      </td>
                      <td />
                      <td>
                        {spell?.savingThrow || ""}
                        {spell?.savingThrow && (
                          (hasHeightenSpell || hasEmpowerSpell || hasMaximizeSpell || hasExtendSpell) && preparedLevels.length > 0
                            ? preparedLevels.map((preparedLevel, copyIndex) => {
                                const empowered = hasEmpowerSpell &&
                                  preparedEmpoweredCopiesBySpell[spellName ?? ""]?.[copyIndex] === true;
                                const maximized = hasMaximizeSpell &&
                                  preparedMaximizedCopiesBySpell[spellName ?? ""]?.[copyIndex] === true;
                                const extended = hasExtendSpell &&
                                  preparedExtendedCopiesBySpell[spellName ?? ""]?.[copyIndex] === true;
                                const usedSlotLevel =
                                  preparedLevel + Number(extended) + (empowered ? 2 : 0) + (maximized ? 3 : 0);
                                const metamagic = [
                                  extended ? "Extended" : "",
                                  empowered ? "Empowered" : "",
                                  maximized ? "Maximized" : "",
                                ].filter(Boolean);
                                const notes = [
                                  preparedLevel > level ? `Heightened to level ${preparedLevel}` : "",
                                  metamagic.length ? `${metamagic.join(" and ")} in level ${usedSlotLevel} slot` : "",
                                ].filter(Boolean);
                                return <small key={copyIndex} className="prepared-spell-dc">
                                  Copy {copyIndex + 1}: DC {getSpellSaveDC(character, spellcastingClassId, preparedLevel, spell.school)}
                                  {notes.length ? ` (${notes.join("; ")})` : ""}
                                </small>;
                              })
                            : <small>DC {getSpellSaveDC(character, spellcastingClassId, level, spell.school)}</small>
                        )}
                      </td>
                      <td>{spell?.range || ""}</td>
                      <td>{spell?.castingTime || ""}</td>
                      <td>{spell?.components || ""}</td>
                      <td>
                        {formatSpellDuration(spell?.duration || "")}
                        {hasExtendSpell && spellName && preparedLevels.map((_, copyIndex) =>
                          preparedExtendedCopiesBySpell[spellName]?.[copyIndex] === true
                            ? <small key={copyIndex} className="prepared-spell-dc">Copy {copyIndex + 1}: Extended</small>
                            : null)}
                      </td>
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
