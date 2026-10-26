import { useState, useRef, useMemo, lazy, Suspense } from "react";
import { type Character, cloneCharacter, type LevelUpDraft, type ClassId, initialCharacter, classDefinitions, beginLevelUp, type AbilityName, rollHitDie, validateLevelUp, hitPointGain, type SpellAcquisition, type WizardSpellLearning, changeRace, raceDefinitions, abilityModifier } from "./domain";
import { loadSavedCharacter, saveCharacter as persistCharacter } from "./storage";
import { isCustomStoreItem, parseCharacter } from "./validation";
import { getLevelUpSkillWarnings, getNewLevelUpFeatSlots, getLevelUpSpellWarnings, isClassSkill, getSkillMaximum, getAvailableSkillCount, getSkillPointsPerLevel, getLevelUpSpentSkillPoints, getSpentSkillPoints, normalizeFeatSelections, getClassSpellSelections } from "./rules";
import { abilityNames, startingClassFeatures } from "./data/characterCatalog";
import { spells as srdSpells, useSpellCatalog } from "./data/spellCatalog";
import { storeItems, addCustomStoreItems } from "./data/equipmentCatalog";
import { CreationPanel } from "./components/CreationPanel";
import { CharacterSheet } from "./components/CharacterSheet";
import { ScreenBoundary } from "./components/ScreenBoundary";
import "./App.css";
import { formatNoteDate } from "./noteDates";
import { type HitPointAction, applyHitPointAction, getStoredCurrentHitPoints } from "./hitPoints";
import { type CombatEffect } from "./combatEffects";

const EquipmentSheet = lazy(() => import("./components/EquipmentSheet").then((module) => ({ default: module.EquipmentSheet })));
const EquipmentStore = lazy(() => import("./components/EquipmentStore").then((module) => ({ default: module.EquipmentStore })));
const ForgePanel = lazy(() => import("./components/ForgePanel").then((module) => ({ default: module.ForgePanel })));
const WandsScrollPanel = lazy(() => import("./components/WandsScrollPanel").then((module) => ({ default: module.WandsScrollPanel })));
const SpellSheets = lazy(() => import("./components/SpellSheet").then((module) => ({ default: module.SpellSheets })));

export function App() {
  const [activeSheet, setActiveSheet] = useState("character");
  const [savedState] = useState(loadSavedCharacter);
  const [operationError, setOperationError] = useState(savedState.error);
  const [character, setCharacter] = useState<Character>(() => savedState.character);
  const [creationState, setCreationDraft] = useState<Character>(() =>
    cloneCharacter(savedState.character),
  );
  const [creationOpen, setCreationOpen] = useState(!savedState.saved);
  const [creationLocked, setCreationLocked] = useState(savedState.saved);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [ruleset, setRuleset] = useState<
    "core-35-srd" | "dragonlance-user-pack" | "dragonlance-monster-classes"
  >("core-35-srd");
  const [abilityMethod, setAbilityMethod] = useState<
    "roll" | "pointBuy" | "manual"
  >("manual");
  const [rolledScores, setRolledScores] = useState<number[] | null>(null);
  const [rolledAssignments, setRolledAssignments] = useState<number[] | null>(
    null,
  );
  const creationDraft = useMemo(() => {
    if (abilityMethod !== "roll" || !rolledScores || !rolledAssignments) return creationState;
    const abilities = { ...creationState.abilities };
    const raceModifiers = raceDefinitions[creationState.race.toLowerCase().replaceAll(" ", "-")]?.abilityModifiers;
    abilityNames.forEach((ability, index) => {
      abilities[ability] = rolledScores[rolledAssignments[index]] + (raceModifiers?.[ability] ?? 0);
    });
    return { ...creationState, abilities };
  }, [creationState, abilityMethod, rolledScores, rolledAssignments]);
  const [levelUpDraft, setLevelUpDraft] = useState<LevelUpDraft | null>(null);
  const [lastLevelUpClassId, setLastLevelUpClassId] = useState<ClassId>(
    initialCharacter.classLevels.at(-1)?.classId ?? "fighter",
  );
  const levelUpMode = levelUpDraft !== null;

  const changeAbilityMethod = (method: "roll" | "pointBuy" | "manual") => {
    setAbilityMethod(method);
    if (method !== "roll") return;
    setRolledScores(null);
    setRolledAssignments(null);
    setCreationDraft((current) => ({
      ...current,
      abilities: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
    }));
  };

  const startLevelUp = (classId: ClassId) => {
    setLastLevelUpClassId(classId);
    if (classDefinitions[classId].spellcasting) setActiveSheet("spells");
    const freshDraft = beginLevelUp(cloneCharacter(character), classId);
    setLevelUpDraft({
      ...freshDraft,
      hitPointRoll: null,
      abilityIncrease: null,
      validationErrors: [],
    });
  };
  const updateLevelUpAbilityIncrease = (ability: AbilityName | null) => {
    if (!levelUpDraft) return;
    const abilities = { ...levelUpDraft.original.abilities };
    if (ability) abilities[ability] += 1;
    setLevelUpDraft({
      ...levelUpDraft,
      abilityIncrease: ability,
      proposed: { ...levelUpDraft.proposed, abilities },
      validationErrors: [],
    });
  };
  const rollDraftHitPoints = () => {
    if (!levelUpDraft || levelUpDraft.hitPointRoll !== null) return;
    const hitPointRoll = rollHitDie(
      classDefinitions[levelUpDraft.classId].hitDie,
    );
    setLevelUpDraft({ ...levelUpDraft, hitPointRoll, validationErrors: [] });
  };
  const confirmLevelUp = () => {
    if (!levelUpDraft) return;
    const validationErrors = [
      ...validateLevelUp(levelUpDraft),
      ...getLevelUpSkillWarnings(
        levelUpDraft.original,
        levelUpDraft.proposed,
      ),
      ...getNewLevelUpFeatSlots(
        levelUpDraft.original,
        levelUpDraft.proposed,
      )
        .filter((slot) => !levelUpDraft.proposed.featSelections?.[slot.id])
        .map((slot) => `Select ${slot.label} before confirming.`),
      ...getLevelUpSpellWarnings(
        levelUpDraft.original,
        levelUpDraft.proposed,
      ),
    ];
    if (validationErrors.length) {
      setLevelUpDraft({ ...levelUpDraft, validationErrors });
      return;
    }
    const proposed = {
      ...levelUpDraft.proposed,
      ...(character.currentHitPoints !== undefined ? {
        currentHitPoints: getStoredCurrentHitPoints(character) + hitPointGain(character, levelUpDraft.hitPointRoll!),
      } : {}),
      hitPoints:
        character.hitPoints +
        hitPointGain(character, levelUpDraft.hitPointRoll!),
    };
    setCharacter(proposed);
    setLevelUpDraft(null);
  };
  const updateCreationDraft = <Key extends keyof Character>(
    key: Key,
    value: Character[Key],
  ) => setCreationDraft((current) => {
    if (key === "prestigeClass") {
      const prestigeClass = value as Character["prestigeClass"];
      const classLevels = current.classLevels.filter(
        (level) => !("prestigeClassId" in level),
      );
      if (prestigeClass && prestigeClass !== "wizard-of-high-sorcery") {
        classLevels.push({
          classId: current.classLevels[0].classId,
          prestigeClassId: prestigeClass,
          level: 1,
        });
      }
      return { ...current, prestigeClass, classLevels };
    }
    return { ...current, [key]: value };
  });
  const updateCreationAbility = (ability: AbilityName, value: number) =>
    setCreationDraft((current) => ({
      ...current,
      abilities: { ...current.abilities, [ability]: value },
    }));
  const updateSkillRanks = (skill: string, change: number) => {
    const update = (current: Character) => {
      const classId = levelUpDraft?.classId ?? current.classLevels.at(-1)?.classId;
      const classSkill = isClassSkill(current, skill, classId);
      const currentRanks = Number(current.skills[skill] || 0);
      const minimumRanks = levelUpDraft
        ? Number(levelUpDraft.original.skills[skill] || 0)
        : 0;
      const maxRanks = creationOpen
        ? (classSkill ? 4 : 2)
        : getSkillMaximum(current, skill);
      const nextRanks = Math.max(
        minimumRanks,
        Math.min(maxRanks, currentRanks + change),
      );

      const pointCost = classSkill ? 1 : 2;
      const availableSkillPoints = levelUpDraft
        ? getAvailableSkillCount(levelUpDraft.original) +
          getSkillPointsPerLevel(levelUpDraft.original, levelUpDraft.classId)
        : getAvailableSkillCount(current);
      const currentSpent = levelUpDraft
        ? getLevelUpSpentSkillPoints(
            levelUpDraft.original,
            current,
            levelUpDraft.classId,
          )
        : getSpentSkillPoints(current);
      if (
        change > 0 &&
        currentSpent + pointCost > availableSkillPoints
      )
        return current;
      if (!classId) return current;
      const currentClassRanks =
        current.skillRanksByClass?.[classId]?.[skill] ?? 0;
      const nextClassRanks = Math.max(
        0,
        currentClassRanks + (nextRanks - currentRanks),
      );
      return {
        ...current,
        skills: { ...current.skills, [skill]: nextRanks },
        skillRanksByClass: {
          ...(current.skillRanksByClass ?? {}),
          [classId]: {
            ...(current.skillRanksByClass?.[classId] ?? {}),
            [skill]: nextClassRanks,
          },
        },
      };
    };
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update);
  };
  const updateFeatSelection = (slotId: string, featId: string) => {
    const update = (current: Character) => {
      const featSelections = normalizeFeatSelections(current, {
        ...(current.featSelections ?? {}),
        [slotId]: featId,
      });
      return {
        ...current,
        featSelections,
        feats: Object.values(featSelections).filter(Boolean),
      };
    };
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update);
  };
  const resetCreationChoices = (draft: Character): Character => ({
    ...draft,
    feats: [],
    featSelections: {},
    skills: {},
    skillRanksByClass: {},
  });
  const updateLanguages = (languages: string[]) => {
    const update = (current: Character) => ({
      ...current,
      languages: [...new Set(languages)],
    });
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update);
  };
  const updateKnownSpells = (
    knownSpells: string[],
    classId?: ClassId,
    acquisition: SpellAcquisition = levelUpDraft ? "level-up" : "starting",
  ) => {
    const update = (current: Character) => {
      const knownSpellsByClass = getClassSpellSelections(current, "knownSpells");
      const preparedSpellsByClass = getClassSpellSelections(current, "preparedSpells");
      const spellAcquisitionByClass = {
        ...(current.spellAcquisitionByClass ?? {}),
      };
      if (classId) {
        const removed = new Set((knownSpellsByClass[classId] ?? []).filter((name) => !knownSpells.includes(name)));
        if (classId === "wizard" && preparedSpellsByClass[classId]) {
          preparedSpellsByClass[classId] = preparedSpellsByClass[classId].filter((name) => !removed.has(name));
        }
        knownSpellsByClass[classId] = [...new Set(knownSpells)];
        const previous = spellAcquisitionByClass[classId] ?? {};
        spellAcquisitionByClass[classId] = Object.fromEntries(
          knownSpells.map((spell) => [
            spell,
            previous[spell] ?? acquisition,
          ]),
        );
      }
      return {
        ...current,
        knownSpells: [...new Set(Object.values(knownSpellsByClass).flat())],
        knownSpellsByClass,
        spellAcquisitionByClass,
        preparedSpellsByClass,
        preparedSpells: [...new Set(Object.values(preparedSpellsByClass).flat())],
      };
    };
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update);
  };
  const updateSpellAcquisition = (
    classId: ClassId,
    spell: string,
    acquisition: SpellAcquisition | null,
    record?: WizardSpellLearning,
  ) => {
    if (!spell) return;
    const update = (current: Character) => {
      const knownSpellsByClass = getClassSpellSelections(current, "knownSpells");
      const preparedSpellsByClass = getClassSpellSelections(current, "preparedSpells");
      const classSpells = [...(knownSpellsByClass[classId] ?? [])];
      const spellAcquisitionByClass = { ...(current.spellAcquisitionByClass ?? {}) };
      const wizardSpellLearning = { ...current.wizardSpellLearning };
      if (classId === "wizard") {
        if (record) wizardSpellLearning[spell] = record;
        else if (acquisition === null) delete wizardSpellLearning[spell];
      }
      const previousAcquisition = spellAcquisitionByClass[classId]?.[spell];
      const nextSpells = acquisition
        ? [...new Set([...classSpells, spell])]
        : previousAcquisition === "level-up" || previousAcquisition === "starting"
          ? classSpells
          : classSpells.filter((name) => name !== spell);
      knownSpellsByClass[classId] = nextSpells;
      if (!nextSpells.includes(spell) && classId === "wizard") {
        preparedSpellsByClass[classId] = (preparedSpellsByClass[classId] ?? []).filter((name) => name !== spell);
      }
      const nextAcquisitions = { ...(spellAcquisitionByClass[classId] ?? {}) };
      if (acquisition) nextAcquisitions[spell] = acquisition;
      else if (previousAcquisition !== "level-up" && previousAcquisition !== "starting")
        delete nextAcquisitions[spell];
      spellAcquisitionByClass[classId] = nextAcquisitions;
      return {
        ...current,
        knownSpells: [...new Set(Object.values(knownSpellsByClass).flat())],
        knownSpellsByClass,
        spellAcquisitionByClass,
        ...(classId === "wizard" && (record || current.wizardSpellLearning) ? { wizardSpellLearning } : {}),
        preparedSpellsByClass,
        preparedSpells: [...new Set(Object.values(preparedSpellsByClass).flat())],
      };
    };
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({ ...levelUpDraft, proposed: update(levelUpDraft.proposed) });
    else setCharacter(update);
  };
  const updatePreparedSpells = (preparedSpells: string[], classId?: ClassId) => {
    const update = (current: Character) => {
      const preparedSpellsByClass = getClassSpellSelections(current, "preparedSpells");
      if (classId) preparedSpellsByClass[classId] = preparedSpells;
      return {
        ...current,
        preparedSpells: [...new Set(Object.values(preparedSpellsByClass).flat())],
        preparedSpellsByClass,
      };
    };
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update);
  };
  const updateExpendedSpellSlots = (classId: ClassId, slots: Record<string, number[]>) => {
    const update = (current: Character): Character => ({
      ...current,
      expendedSpellSlotsByClass: { ...current.expendedSpellSlotsByClass, [classId]: slots },
      ...(classId === "cleric" && Object.keys(slots).length === 0 ? { clericDomainExpended: [] } : {}),
    });
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft) setLevelUpDraft((current) => current ? { ...current, proposed: update(current.proposed) } : current);
    else setCharacter(update);
  };
  const updateClericCasting = (changes: Pick<Character, "clericDomains" | "clericDomainPreparation" | "clericDomainExpended">) => {
    const update = (current: Character): Character => ({ ...current, ...changes });
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft) setLevelUpDraft((current) => current ? { ...current, proposed: update(current.proposed) } : current);
    else setCharacter(update);
  };
  const updateEquipment = (equipment: Record<string, string>) => {
    const update = (current: Character) => ({ ...current, equipment });
    if (creationOpen && !creationLocked)
      setCreationDraft(update(creationDraft));
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update(character));
  };
  const addCharacterNote = (text: string) => {
    const entry = `[${formatNoteDate(new Date())}]\n${text}`;
    const update = (current: Character): Character => ({
      ...current,
      notes: current.notes ? `${current.notes}\n\n${entry}` : entry,
    });
    if (creationOpen && !creationLocked) setCreationDraft(update);
    else if (levelUpDraft) {
      setLevelUpDraft((current) => current ? { ...current, proposed: update(current.proposed) } : current);
    } else setCharacter(update);
  };
  const updateHitPoints = (action: HitPointAction, amount: number) => {
    if (!creationLocked || levelUpDraft) {
      setOperationError("Finish setup or discard/commit the level-up draft before changing HP.");
      return;
    }
    try {
      const updated = applyHitPointAction(character, action, amount);
      setCharacter(updated);
      setOperationError(undefined);
    } catch (error: unknown) {
      setOperationError(`Unable to update HP. ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const updateCombatEffects = (round: number, effects: CombatEffect[]) => {
    if (!creationLocked || levelUpDraft) {
      setOperationError("Finish setup or discard/commit the level-up draft before changing combat effects.");
      return;
    }
    setCharacter((current) => ({ ...current, combatRound: round, combatEffects: effects }));
    setOperationError(undefined);
  };
  const updateInventory = (inventory: Record<string, number>) => {
    const update = (current: Character) => ({ ...current, inventory });
    if (creationOpen && !creationLocked)
      setCreationDraft(update(creationDraft));
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update(character));
  };
  const updateEquipmentAndInventory = (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => {
    const update = (current: Character) => ({ ...current, equipment, inventory });
    if (creationOpen && !creationLocked)
      setCreationDraft(update(creationDraft));
    else if (levelUpDraft)
      setLevelUpDraft({
        ...levelUpDraft,
        proposed: update(levelUpDraft.proposed),
      });
    else setCharacter(update(character));
  };
  const updateCreationRace = (race: string) =>
    setCreationDraft(resetCreationChoices(changeRace(creationDraft, race)));
  const updateCreationClass = (classId: ClassId) =>
    setCreationDraft(
      resetCreationChoices({
        ...creationDraft,
        classLevels: [{ classId, level: 1 }],
        alignment: "",
        deity: undefined,
        highSorceryOrder: undefined,
      }),
    );
  const createCharacter = () => {
    const classId = creationDraft.classLevels[0].classId;
    const nextCharacter = cloneCharacter(creationDraft);
    if (classId === "wizard") {
      const cantrips = srdSpells
        .filter((spell) => spell.level === 0 && spell.classes.includes("wizard"))
        .map((spell) => spell.name);
      nextCharacter.knownSpells = [...new Set([...nextCharacter.knownSpells, ...cantrips])];
      nextCharacter.knownSpellsByClass = {
        ...(nextCharacter.knownSpellsByClass ?? {}),
        wizard: [...new Set([...(nextCharacter.knownSpellsByClass?.wizard ?? []), ...cantrips])],
      };
    }
    setCharacter({
      ...nextCharacter,
      currentHitPoints: undefined,
      temporaryHitPoints: 0,
      nonlethalDamage: 0,
      abilities: creationDraft.abilities,
      classFeatures: startingClassFeatures[classId] ?? [],
      hitPoints: Math.max(
        1,
        classDefinitions[classId].hitDie +
          abilityModifier(creationDraft.abilities.con),
      ),
    });
    setLevelUpDraft(null);
    setCreationLocked(true);
    setCreationOpen(false);
  };
  const reopenCreation = () => {
    setCreationDraft(cloneCharacter(character));
    setCreationLocked(false);
    setCreationOpen(true);
    setLevelUpDraft(null);
  };
  const createNewCharacter = () => {
    setCharacter(cloneCharacter(initialCharacter));
    setCreationDraft(cloneCharacter(initialCharacter));
    setCreationLocked(false);
    setCreationOpen(true);
    setLevelUpDraft(null);
    setAbilityMethod("manual");
    setRolledScores(null);
    setRolledAssignments(null);
    setLastLevelUpClassId("fighter");
  };
  const discardCreation = () => {
    if (creationLocked) return;
    setCreationDraft(cloneCharacter(character));
    setCreationOpen(false);
    if (character.name === initialCharacter.name) setCreationOpen(true);
  };
  const calculatedCharacter = !creationLocked
    ? {
        ...creationDraft,
        abilities: creationDraft.abilities,
        hitPoints: Math.max(
          1,
          classDefinitions[creationDraft.classLevels[0].classId].hitDie +
            abilityModifier(creationDraft.abilities.con),
        ),
      }
    : character;
  const displayedCharacter = levelUpDraft?.proposed ?? calculatedCharacter;
  const hasSpellcasting = displayedCharacter.classLevels.some(
    (level) => classDefinitions[level.classId as ClassId]?.spellcasting,
  );
  const spellCatalog = useSpellCatalog(
    hasSpellcasting || activeSheet === "crafting" ||
    Object.keys(displayedCharacter.inventory ?? {}).some((name) => /^(?:Wand|Scroll) of /.test(name)),
  );
  const levelUpWarnings = levelUpDraft && spellCatalog.ready
    ? [
        ...(levelUpDraft.proposed.classLevels.reduce(
          (total, entry) => total + entry.level,
          0,
        ) % 4 === 0 && !levelUpDraft.abilityIncrease
          ? [
              "Choose an ability score to increase by +1 before rolling hit points.",
            ]
          : []),
        ...(levelUpDraft.hitPointRoll === null
          ? ["Roll hit points before confirming the level-up."]
          : []),
        ...getLevelUpSkillWarnings(
          levelUpDraft.original,
          levelUpDraft.proposed,
        ),
        ...getNewLevelUpFeatSlots(
          levelUpDraft.original,
          levelUpDraft.proposed,
        )
          .filter((slot) => !levelUpDraft.proposed.featSelections?.[slot.id])
          .map((slot) => `Select ${slot.label} before confirming.`),
        ...getLevelUpSpellWarnings(
          levelUpDraft.original,
          levelUpDraft.proposed,
        ),
      ]
    : [];
  const canRollAndConfirmLevelUp =
    levelUpDraft !== null &&
    levelUpWarnings.every(
      (warning) => warning !== "Roll hit points before confirming the level-up.",
    );
  const levelUpTotalLevel = levelUpDraft?.proposed.classLevels.reduce(
    (total, entry) => total + entry.level,
    0,
  );
  const gainsAbilityIncrease =
    levelUpTotalLevel !== undefined && levelUpTotalLevel % 4 === 0;
  const saveCharacter = () => {
    try {
      persistCharacter(displayedCharacter);
      setOperationError(undefined);
      window.alert("Character saved.");
    } catch (error: unknown) {
      setOperationError(`Unable to save the character. ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const exportCharacter = () => {
    const exportData = {
      ...displayedCharacter,
      customItems: storeItems.filter((item) => item.custom),
    };
    const file = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    const characterName = displayedCharacter.name.trim() || "character";
    const playerName = displayedCharacter.player.trim() || "player";
    link.download = `${characterName}-${playerName}.json`.replace(/[\\/:*?"<>|]/g, "-");
    link.click();
    URL.revokeObjectURL(url);
  };
  const importCharacter = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = parseCharacter(JSON.parse(await file.text()));
      const importedCustomItems = (imported.customItems ?? []).filter(isCustomStoreItem);
      const newCustomItems = importedCustomItems.filter(
        (item) =>
          !storeItems.some(
            (existing) =>
              existing.category === item.category &&
              existing.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
          ),
      );
      if (newCustomItems.length) addCustomStoreItems(newCustomItems);
      setCharacter(cloneCharacter(imported));
      setCreationDraft(cloneCharacter(imported));
      setCreationLocked(true);
      setCreationOpen(false);
      setLevelUpDraft(null);
      setOperationError(undefined);
      window.alert("Character imported.");
    } catch (error: unknown) {
      setOperationError(`Unable to import the character. ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const visibleSheet =
    !hasSpellcasting && activeSheet === "spells" ? "character" : activeSheet;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <p className="eyebrow">D&D 3.5 rules workspace</p>
          <h1>
            D&D 3.5 Character Builder <span>3.0</span>
          </h1>
        </div>
        <div className="header-actions">
          <button className="quiet-button" type="button" onClick={saveCharacter}>
            Save
          </button>
          <button className="quiet-button" type="button" onClick={exportCharacter}>
            Export
          </button>
          <button
            className="quiet-button"
            type="button"
            onClick={() => importInputRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importCharacter}
          />
          {creationLocked && (
            <>
              <button className="quiet-button" type="button" onClick={reopenCreation}>
                Reopen Setup
              </button>
              <button className="quiet-button" type="button" onClick={createNewCharacter}>
                Create New
              </button>
            </>
          )}
          {!creationLocked && (
            <button className="quiet-button" type="button" onClick={discardCreation}>
              Discard / Clear
            </button>
          )}
          {creationLocked && (
            <button
              className="level-button"
              type="button"
              onClick={() => startLevelUp(lastLevelUpClassId)}
            >
              Enter Level-Up Mode
            </button>
          )}
        </div>
      </header>
      {operationError && <section className="panel status-message" role="alert">{operationError}</section>}
      <ScreenBoundary>
      {!spellCatalog.ready ? (
        <section className="panel status-message" role={spellCatalog.status === "error" ? "alert" : "status"}>
          {spellCatalog.status === "error" ? (
            <>
              <p>Unable to load spell rules: {spellCatalog.error}</p>
              <button type="button" onClick={spellCatalog.retry}>Retry loading spell rules</button>
            </>
          ) : <p>Loading spell rules...</p>}
        </section>
      ) : (
      <Suspense fallback={<section className="panel status-message" role="status">Loading screen...</section>}>
      {levelUpMode && levelUpDraft && (
        <section className="level-banner">
          <div>
            <strong>Level-Up Draft</strong>
            <span>
              Choices are provisional until you confirm the new level.
            </span>
            <label className="draft-class">
              Class
              <select
                value={levelUpDraft.classId}
                onChange={(event) =>
                  startLevelUp(event.target.value as ClassId)
                }
              >
                {Object.values(classDefinitions).map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.name}
                  </option>
                ))}
              </select>
            </label>
            {gainsAbilityIncrease && (
              <label className="draft-class level-ability-choice">
                Ability score increase at level {levelUpTotalLevel}
                <span>
                  Choose one ability to increase by +1. This change is provisional
                  until you confirm the level-up.
                </span>
                <select
                  value={levelUpDraft.abilityIncrease ?? ""}
                  onChange={(event) =>
                    updateLevelUpAbilityIncrease(
                      (event.target.value || null) as AbilityName | null,
                    )
                  }
                >
                  <option value="">Choose an ability</option>
                  {abilityNames.map((ability) => (
                    <option key={ability} value={ability}>
                      {ability.toUpperCase()} ({levelUpDraft.proposed.abilities[ability]})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="level-roll-controls">
              <span>
                Hit die: d{classDefinitions[levelUpDraft.classId].hitDie}{" "}
                {levelUpDraft.hitPointRoll === null
                  ? "not rolled"
                  : `roll ${levelUpDraft.hitPointRoll}`}
              </span>
              <button
                className="quiet-button"
                type="button"
                onClick={rollDraftHitPoints}
                disabled={
                  levelUpDraft.hitPointRoll !== null ||
                  levelUpWarnings.some(
                    (warning) =>
                      warning !== "Roll hit points before confirming the level-up.",
                  )
                }
              >
                Roll Hit Points
              </button>
            </div>
            <div className="level-todo-list">
              {levelUpWarnings.map((warning) => (
                <small className="validation-error" key={warning}>
                  {warning}
                </small>
              ))}
              {levelUpDraft.validationErrors.map((error) => (
                <small className="validation-error" key={error}>
                  {error}
                </small>
              ))}
            </div>
          </div>
          <div className="level-actions">
            <button
              className="quiet-button"
              type="button"
              onClick={() => setLevelUpDraft(null)}
            >
              Discard Draft
            </button>
            <button
              className="level-button"
              type="button"
              onClick={confirmLevelUp}
              disabled={!levelUpDraft.hitPointRoll || !canRollAndConfirmLevelUp}
            >
              Confirm Level-Up
            </button>
          </div>
        </section>
      )}
      <nav className="sheet-tabs" aria-label="Character sheets">
        {[
          ["character", "Character"],
          ["equipment", "Equipment"],
          ["store", "Store"],
          ["forge", "Forge"],
          ["crafting", "Wands & Scrolls"],
          ...(hasSpellcasting ? [["spells", "Spells"]] : []),
        ].map(([id, label]) => (
          <button
            key={id}
            className={visibleSheet === id ? "active" : ""}
            type="button"
            onClick={() => setActiveSheet(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {visibleSheet === "character" && (
        <>
          {!creationLocked && (
            <CreationPanel
              draft={creationDraft}
              open={creationOpen}
              locked={creationLocked}
              method={abilityMethod}
              rolledScores={rolledScores}
              onRolledScoresChange={setRolledScores}
              rolledAssignments={rolledAssignments}
              onRolledAssignmentsChange={setRolledAssignments}
              onToggle={() => setCreationOpen(!creationOpen)}
              onMethodChange={changeAbilityMethod}
              onChange={updateCreationDraft}
              onClassChange={updateCreationClass}
              onRaceChange={updateCreationRace}
              ruleset={ruleset}
              onRulesetChange={(nextRuleset) => {
                if (
                  nextRuleset !== ruleset &&
                  !window.confirm(
                    "Changing the ruleset will reset all character creation choices, including abilities, class, race, deity, skills, feats, and spells. Continue?",
                  )
                ) {
                  return;
                }
                setRuleset(nextRuleset);
                setCreationDraft(cloneCharacter(initialCharacter));
                setAbilityMethod("manual");
                setRolledScores(null);
                setRolledAssignments(null);
              }}
              onAbilityChange={updateCreationAbility}
              onCreate={createCharacter}
            />
          )}
          <CharacterSheet
            onOpenSpells={() => setActiveSheet("spells")}
            onHitPointAction={updateHitPoints}
            onCombatEffectsChange={updateCombatEffects}
            onAddNote={addCharacterNote}
            character={displayedCharacter}
            levelUpOriginal={levelUpDraft?.original}
            levelUpClassId={levelUpDraft?.classId}
            creationMode={creationOpen && !creationLocked}
            onSkillRankChange={updateSkillRanks}
            onFeatChange={updateFeatSelection}
            onLanguagesChange={updateLanguages}
            allowFeatSelection={!creationLocked || levelUpMode}
            finalized={creationLocked && !levelUpMode}
            editable={!creationLocked && !levelUpMode}
            onCharacterNameChange={(name) => updateCreationDraft("name", name)}
            onPlayerNameChange={(player) => updateCreationDraft("player", player)}
            onCharacterAgeChange={(age) => setCharacter((current) => ({ ...current, age }))}
            onCharacterWeightChange={(weight) => setCharacter((current) => ({ ...current, weight }))}
            onCharacterHeightChange={(height) => setCharacter((current) => ({ ...current, height }))}
          />
        </>
      )}
      {visibleSheet === "equipment" && (
        <EquipmentSheet
          key={displayedCharacter.race}
          character={displayedCharacter}
          onEquipmentChange={updateEquipment}
          onEquipmentAndInventoryChange={updateEquipmentAndInventory}
        />
      )}
      {visibleSheet === "store" && (
        <EquipmentStore
          character={displayedCharacter}
          onEquipmentChange={updateEquipment}
          onInventoryChange={updateInventory}
          onEquipmentAndInventoryChange={updateEquipmentAndInventory}
        />
      )}
      {visibleSheet === "forge" && (
        <ForgePanel
          character={displayedCharacter}
          onInventoryChange={updateInventory}
        />
      )}
      {visibleSheet === "crafting" && (
        <WandsScrollPanel
          character={displayedCharacter}
          onInventoryChange={updateInventory}
        />
      )}
      {visibleSheet === "spells" && (
            <SpellSheets
              key={levelUpDraft?.classId ?? "finalized"}
              character={displayedCharacter}
              levelUpOriginal={levelUpDraft?.original}
              levelUpClassId={levelUpDraft?.classId}
              onKnownSpellsChange={updateKnownSpells}
              onSpellAcquisitionChange={updateSpellAcquisition}
              onPreparedSpellsChange={updatePreparedSpells}
              onExpendedSpellSlotsChange={updateExpendedSpellSlots}
              onClericCastingChange={updateClericCasting}
              editable={!creationLocked}
            />
      )}
      </Suspense>
      )}
      </ScreenBoundary>
    </main>
  );
}

export default App;
