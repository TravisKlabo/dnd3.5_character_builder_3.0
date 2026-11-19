import { lazy, Suspense, useState } from "react";
import { type Character, type ClassId, type PrestigeClassId, type SavingThrowCondition, type RacialSkillCondition, dragonlancePrestigeClasses, classDefinitions, raceDefinitions, deityDefinitions, type AbilityName, abilityModifier, type MagicSchool, type SkillRankSourceId, getEffectiveCharacterLevel, getTotalHitDice } from "../domain";
import "../data/equipmentCatalog";
import { getLevelUpSkillSourceId, getBaseClassLevel, getBaseClassLevels, getRangerFavoredEnemyChoiceLevels, getPrestigeClassLevel, getKnightOfCrownHeroicInitiativeBonus, getChosenFeats, formatModifier, getBaseAttackBonus, getCharacterLanguages, getAutomaticLanguages, getLanguageBonusSlots, getAvailableBonusLanguages, getAvailableSpeakLanguages, getSpeakLanguageRankCount, getSpeakLanguageWarnings, getHumanRegionalLanguages, getLevelUpSpentSkillPoints, getSkillPointsPerLevel, getSpentSkillPoints, getAvailableSkillCount, getAvailableSkillTricks, getAvailableSkillTrickGrants, getSkillTrickGrantFeatSlots, getSkillTrickLimit, getSkillTrickSelections, isClassSkill, getRacialSkillBonus, getRacialSkillContextOptions, getSkillSynergyContextOptions, getClassFeatureSkillSynergy, getCharacterRace, getRaceDefinitionForCharacter, getRacialHitDiceForCharacter, getSkillAbility, getAssignedSkillRanks, canIncreaseSkillRank, getSkillTotalTooltip, getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getNewLevelUpFeatSlots, getFeatSlots, getChronologicalFeatSlots, getAvailableFeats, getAvailableFeatWeaponChoices, getAvailableFeatSkillChoices, getAvailableFeatSpellSchoolChoices, getAvailableFeatSpellMasteryChoices, getFeatSpellMasteryChoiceCount, getWizardSpellbookSpells, getRacialSpellLikeAbilities, getImprovedInitiativeBonus, getInitiativeModifier, requiresManualClericUndeadTurningMode } from "../rules";
import { type CombatAttackMode, type CombatCastingContext, type SkillSynergyContext } from "../rules";
import { getEncumbrance, getArmorNonproficiencyPenalties, getClassFeatureDisplay } from "../rules";
import { getWizardBonusFeatWarnings } from "../rules";
import { getMovement } from "../movementRules";
import { abilities, skills, skillDescriptions, abilityLabels, featCatalog } from "../data/characterCatalog";
import { skillTrickCatalog } from "../data/skillTricks";
import { classFeatureDescriptions } from "../data/classFeatureDescriptions";
import { prestigeClassFeatureDescriptions } from "../data/prestigeClassFeatureDescriptions";
import { getDuelistImprovedReactionBonus } from "../rules";
import { Panel, Stat, ArmorClassStat, SavingThrowStat, DodgeTargetControl, AttacksOfOpportunityStat, CombatCastingContextControl, ContentSourceLabel } from "./shared";
import { RangerFavoredEnemies } from "./RangerFavoredEnemies";
import { SpellPicker } from "./pickers";
import { type HitPointAction, getCurrentHitPoints, getMaximumHitPoints } from "../hitPoints";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";
import { getCombatEffectDetails, type CombatEffect } from "../combatEffects";
import { useCombatTargetContext } from "../combatTargetDefenseContext";
const SavingThrowContextSelector = lazy(() =>
  import("./SavingThrowContextSelector").then((module) => ({
    default: module.SavingThrowContextSelector,
  })),
);

const CombatAttackPanel = lazy(() =>
  import("./CombatAttackPanel").then((module) => ({
    default: module.CombatAttackPanel,
  })),
);

const CastingSummary = lazy(() =>
  import("./CastingSummary").then((module) => ({
    default: module.CastingSummary,
  })),
);

const HitPointTracker = lazy(() =>
  import("./HitPointTracker").then((module) => ({
    default: module.HitPointTracker,
  })),
);

const CombatEffectsTracker = lazy(() =>
  import("./CombatEffectsTracker").then((module) => ({
    default: module.CombatEffectsTracker,
  })),
);

const CharacterNotes = lazy(() =>
  import("./CharacterNotes").then((module) => ({
    default: module.CharacterNotes,
  })),
);

const LanguagePicker = lazy(() =>
  import("./pickers").then((module) => ({
    default: module.LanguagePicker,
  })),
);

const FeatPicker = lazy(() =>
  import("./pickers").then((module) => ({
    default: module.FeatPicker,
  })),
);

function LoadingPlaceholder({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <p className={`component-loading ${className}`} role="status" aria-busy="true">
      {children}
    </p>
  );
}

function PickerLoading({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div
      className={`class-field ${className} picker-loading`}
      role="status"
      aria-busy="true"
    >
      <button className="race-trigger" type="button" disabled>
        {label}
      </button>
    </div>
  );
}

export function CharacterSheet({
  character,
  levelUpOriginal,
  levelUpClassId,
  creationMode,
  onSkillRankChange,
  onSkillTrickLearn,
  onSkillTrickRemove,
  onFeatChange,
  onFeatWeaponChange,
  onFeatSkillChange,
  onFeatSpellSchoolChange,
  onFeatSpellMasteryChange,
  onLanguagesChange,
  onSpeakLanguagesChange,
  onRegionalLanguageChange,
  allowFeatSelection,
  finalized,
  editable,
  onCharacterNameChange,
  onPlayerNameChange,
  onCharacterAgeChange,
  onCharacterHeightChange,
  onCharacterWeightChange,
  onAddNote,
  onHitPointAction,
  onCombatEffectsChange,
  onCharacterFeatureChange,
  rangedTargetDistanceFeet,
  onRangedTargetDistanceFeetChange,
  combatAttackMode,
  onCombatAttackModeChange,
  combatExpertiseAmount,
  onCombatExpertiseAmountChange,
  powerAttackAmount,
  onPowerAttackAmountChange,
  dodgeTargetSelected,
  onDodgeTargetSelectedChange,
  combatCastingContext,
  onCombatCastingContextChange,
  onMedallionOfFaithChange,
  selectedRangedAmmunitionKey,
  onRangedAmmunitionChange,
  onOpenSpells,
}: {
  character: Character;
  levelUpOriginal?: Character;
  levelUpClassId?: ClassId | PrestigeClassId;
  creationMode: boolean;
  onSkillRankChange: (
    skill: string,
    change: number,
    sourceId?: SkillRankSourceId,
  ) => void;
  onSkillTrickLearn: (
    trickId: string,
    sourceId?: SkillRankSourceId,
    featSlotId?: string,
  ) => void;
  onSkillTrickRemove: (trickId: string) => void;
  onFeatChange: (slotId: string, featId: string) => void;
  onFeatWeaponChange: (slotId: string, weaponName: string) => void;
  onFeatSkillChange: (slotId: string, skill: string) => void;
  onFeatSpellSchoolChange: (slotId: string, school: MagicSchool | undefined) => void;
  onFeatSpellMasteryChange: (slotId: string, selections: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onSpeakLanguagesChange: (languages: string[]) => void;
  onRegionalLanguageChange: (language: string | undefined) => void;
  allowFeatSelection: boolean;
  finalized: boolean;
  editable: boolean;
  onCharacterNameChange: (name: string) => void;
  onPlayerNameChange: (player: string) => void;
  onCharacterAgeChange: (age: string) => void;
  onCharacterHeightChange: (height: string) => void;
  onCharacterWeightChange: (weight: string) => void;
  onAddNote: (text: string) => void;
  onHitPointAction: (action: HitPointAction, amount: number) => void;
  onCombatEffectsChange: (round: number, effects: CombatEffect[]) => void;
  onCharacterFeatureChange: (
    update: Partial<Pick<Character, "knightOfTheCrownState" | "honorBoundSuspended" | "temporaryHitPoints" | "rangerFavoredEnemies" | "racialSpellLikeUses" | "flySpeed" | "hasPowerPointReserve" | "hasKiPower" | "hasKiStrikeMagic" | "hasAllMartialWeaponProficiencies" | "hasStealSpell" | "hasSwashbucklerGrace" | "hasConjurationHealingSpell" | "hasSpontaneousCureOrInflict" | "hasCureWoundsSpell" | "hasSummonNaturesAllySpell" | "hasInflictWoundsSpell" | "canTurnElementalSubtype" | "canRebukeElementalSubtype" | "hasFastWildShape" | "hasWarmageLevelFour" | "hasGraduatedFromApprenticeship" | "hasMentorSkillPrerequisites" | "isGuildMember" | "hasGuildmasterPrerequisites" | "hasCompletedBondingRitual" | "hasRechargeableBreathWeapon" | "hasDetectMagicAccess" | "isThoonAffiliate" | "divineCasterLevel" | "clericUndeadTurningMode" | "manifesterLevel" | "skirmishDamageDice" | "skirmishACBonus">>,
  ) => void;
  rangedTargetDistanceFeet: number | undefined;
  onRangedTargetDistanceFeetChange: (distanceFeet: number | undefined) => void;
  combatAttackMode: CombatAttackMode;
  onCombatAttackModeChange: (mode: CombatAttackMode) => void;
  combatExpertiseAmount: number;
  onCombatExpertiseAmountChange: (amount: number) => void;
  powerAttackAmount: number;
  onPowerAttackAmountChange: (amount: number) => void;
  dodgeTargetSelected: boolean;
  onDodgeTargetSelectedChange: (selected: boolean) => void;
  combatCastingContext?: CombatCastingContext;
  onCombatCastingContextChange: (context: CombatCastingContext | undefined) => void;
  onMedallionOfFaithChange: (present: boolean) => void;
  selectedRangedAmmunitionKey?: string;
  onRangedAmmunitionChange: (key: string | undefined) => void;
  onOpenSpells: () => void;
}) {
  const { value: targetContext } = useCombatTargetContext();
  const [savingThrowConditions, setSavingThrowConditions] = useState<SavingThrowCondition[]>([]);
  const [skillCheckContexts, setSkillCheckContexts] = useState<
    Partial<Record<string, RacialSkillCondition>>
  >({});
  const [skillSynergyCheckContexts, setSkillSynergyCheckContexts] = useState<
    Partial<Record<string, SkillSynergyContext>>
  >({});
  const [creationSkillSourceId, setCreationSkillSourceId] = useState<
    SkillRankSourceId | undefined
  >();
  const lastClassLevel = character.classLevels.at(-1);
  const defaultSkillSourceId: SkillRankSourceId = lastClassLevel &&
      "prestigeClassId" in lastClassLevel
    ? lastClassLevel.prestigeClassId
    : lastClassLevel?.classId ?? "fighter";
  const racialHitDice = getRacialHitDiceForCharacter(character);
  const activeLevelUpClassId = levelUpOriginal
    ? levelUpClassId ?? getLevelUpSkillSourceId(levelUpOriginal, character)
    : undefined;
  const availableSkillPoints = levelUpOriginal
    ? getAvailableSkillCount(levelUpOriginal) +
      getSkillPointsPerLevel(
        levelUpOriginal,
        activeLevelUpClassId ?? "fighter",
      )
    : getAvailableSkillCount(character);
  const spentSkillPoints = levelUpOriginal
    ? getLevelUpSpentSkillPoints(
        levelUpOriginal,
        character,
        activeLevelUpClassId ?? "fighter",
      )
    : getSpentSkillPoints(character);
  const skillDisplaySourceId: SkillRankSourceId | undefined = levelUpOriginal
    ? activeLevelUpClassId
    : creationMode
      ? creationSkillSourceId === "racial-hit-dice" && !racialHitDice
        ? defaultSkillSourceId
        : creationSkillSourceId ?? defaultSkillSourceId
      : undefined;
  const currentCharacterLevel = getTotalHitDice(character);
  const wizardBonusFeatWarnings = getWizardBonusFeatWarnings(character);
  const chosenFeatIds = new Set(getChosenFeats(character));
  const featPrerequisiteWarnings = getFeatSlots(character).flatMap((slot) => {
    const featId = character.featSelections?.[slot.id];
    const feat = featCatalog.find((entry) => entry.id === featId);
    if (
      !feat ||
      chosenFeatIds.has(feat.id) ||
      wizardBonusFeatWarnings.some((warning) =>
        warning.startsWith(`${slot.label}:`),
      ) ||
      (slot.metamagicOnly && !feat.categories?.includes("metamagic")) ||
      (slot.redWizardOnly &&
        !feat.categories?.some((category) =>
          category === "metamagic" || category === "item-creation",
        ) &&
        feat.id !== "spell-mastery")
    )
      return [];
    return [`${slot.label}: ${feat.name} is recorded but unusable because its prerequisites are unmet.`];
  });
  const learnedSkillTricks = getSkillTrickSelections(character);
  const availableSkillTricks = getAvailableSkillTricks(character);
  const skillTrickGrantFeatSlots = getSkillTrickGrantFeatSlots(character);
  const skillTrickSourceId = activeLevelUpClassId ?? skillDisplaySourceId;
  const skillTrickPointsRemaining = availableSkillPoints - spentSkillPoints;
  const skillRankSourceIds = [...new Set(character.classLevels.map((level) =>
    "prestigeClassId" in level ? level.prestigeClassId : level.classId,
  ))];
  const classSummary = [
    ...(racialHitDice ? [`${racialHitDice.count}d${racialHitDice.hitDie} racial HD`] : []),
    ...character.classLevels.map(
      (level) => "prestigeClassId" in level
        ? `${dragonlancePrestigeClasses[level.prestigeClassId]?.name ?? level.prestigeClassId} ${level.level}`
        : `${classDefinitions[level.classId]?.name ?? level.classId} ${level.level}`,
    ),
  ].join(" / ");
  const totalHitDice = getTotalHitDice(character);
  const effectiveCharacterLevel = getEffectiveCharacterLevel(character);
  const levelStatus = effectiveCharacterLevel > totalHitDice
    ? `ECL ${effectiveCharacterLevel} (${totalHitDice} HD)`
    : `Level: ${totalHitDice}`;
  const classSources = [...new Map(
    character.classLevels.map((level) => {
      const definition = "prestigeClassId" in level
        ? dragonlancePrestigeClasses[level.prestigeClassId]
        : classDefinitions[level.classId];
      return [
        `${definition.source}:${definition.sourceBook ?? ""}`,
        { source: definition.source, book: definition.sourceBook },
      ] as const;
    }),
  ).values()];
  const movement = getMovement(character);
  const characterRace = getRaceDefinitionForCharacter(character) ?? raceDefinitions.human;
  const racialSpellLikeAbilities = getRacialSpellLikeAbilities(character);
  const specialAbilities = [
    ...(characterRace.traits ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
    })),
    ...(characterRace.specialAbilities ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
    })),
    ...racialSpellLikeAbilities.map((ability) => ({
      source: characterRace.name,
      ability: `${ability.name} (${ability.usesPerDay}/day; caster level ${ability.casterLevel}${ability.savingThrow ? `; ${ability.savingThrow} DC ${ability.saveDC}${ability.racialSaveDcBonus ? ` (+${ability.racialSaveDcBonus} racial ${ability.school} bonus)` : ""}` : ""}${ability.notes ? `; ${ability.notes}` : ""})`,
    })),
    ...character.classLevels
      .map((level) => {
        const definition = classDefinitions[level.classId];
        if (!definition) return [];
        return [
          {
            source: `${definition.name} ${level.level}`,
            ability: `${definition.baseAttackBonus} base attack progression`,
          },
          {
            source: `${definition.name} ${level.level}`,
            ability: `${definition.skillPoints} skill points per level`,
          },
          ...(definition.spellcasting
            ? [
                {
                  source: `${definition.name} ${level.level}`,
                  ability: "Spellcasting",
                },
              ]
            : []),
        ];
      })
      .flat(),
    ...getClassFeatureDisplay(character),
  ];
  const initiativeFeatBonus = getImprovedInitiativeBonus(character);
  const knightInitiativeBonus = getKnightOfCrownHeroicInitiativeBonus(character);
  const duelistInitiativeBonus = getDuelistImprovedReactionBonus(character);
  const knightOfTheCrownLevel = getPrestigeClassLevel(character, "knight-of-the-crown");
  const crownState = character.knightOfTheCrownState ?? {};
  const strengthOfHonorUses = crownState.strengthOfHonorUsesUsed ?? 0;
  const strengthOfHonorUsesPerDay = knightOfTheCrownLevel
    ? 1 + Math.floor((knightOfTheCrownLevel - 1) / 3)
    : 0;
  const strengthOfHonorBonus = knightOfTheCrownLevel >= 6 ? 6 : 4;
  const strengthOfHonorDuration = 3 +
    abilityModifier(getEffectiveAbilityScore(character, "cha"));
  const strengthOfHonorActive = (character.combatEffects ?? []).some(
    (effect) => effect.name === "Strength of Honor" &&
      (effect.remainingRounds === null || effect.remainingRounds > 0),
  );
  return (
    <div className="sheet-grid">
      <Panel title={`${character.name || "Unnamed Character"}${character.player ? ` (${character.player})` : ""}`} headerLabel="Character Info" className={`identity-panel${finalized ? " finalized" : ""}`} showStatus statusText={levelStatus}>
        <div className="identity-grid">
          {!finalized && <label>
            Character name
            <input value={character.name} readOnly={!editable} onChange={(event) => onCharacterNameChange(event.target.value)} />
          </label>}
          {!finalized && <label>
            Player
            <input value={character.player} readOnly={!editable} onChange={(event) => onPlayerNameChange(event.target.value)} />
          </label>}
          <label>Gender:<span className="sheet-value">{character.gender || "Not specified"}</span></label>
          <label>Hair Color:<span className="sheet-value">{character.hairColor || "Not specified"}</span></label>
          <label>Eye Color:<span className="sheet-value">{character.eyeColor || "Not specified"}</span></label>
          <label>Skin Color:<span className="sheet-value">{character.skinColor || "Not specified"}</span></label>
          <label className="finalized-race-field">
            Race:
            {finalized ? <span className="sheet-value">{character.race}</span> : <input value={character.race} readOnly />}
          </label>
          <label className="finalized-alignment-field">
            Alignment:
            {finalized ? <span className="sheet-value">{character.alignment}</span> : <input value={character.alignment} readOnly />}
          </label>
          <label className="finalized-deity-field">
            Deity:
            {finalized ? (
              <span className="sheet-value">
                {character.deity
                  ? deityDefinitions.find((deity) => deity.id === character.deity)?.name ?? character.deity
                  : "Not specified"}
              </span>
            ) : (
              <input
                value={character.deity ? deityDefinitions.find((deity) => deity.id === character.deity)?.name ?? character.deity : "Not specified"}
                readOnly
              />
            )}
          </label>
            <label>Age:{finalized ? <input value={character.age ?? ""} onChange={(event) => onCharacterAgeChange(event.target.value)} placeholder="30 years or about 30" /> : <span className="sheet-value">{character.age || "Not specified"}</span>}</label>
            <label>Height:{finalized ? <input value={character.height ?? ""} onChange={(event) => onCharacterHeightChange(event.target.value)} placeholder="5 ft 7 in or 170 cm" /> : <span className="sheet-value">{character.height || "Not specified"}</span>}</label>
            <label>Weight:{finalized ? <input value={character.weight ?? ""} onChange={(event) => onCharacterWeightChange(event.target.value)} placeholder="180 lb. or 82 kg" /> : <span className="sheet-value">{character.weight || "Not specified"}</span>}</label>

          <label className="finalized-class-field">
            Class:
            {finalized ? (
              <span className="sheet-value">{classSummary}</span>
            ) : (
              <input value={classSummary} readOnly />
            )}
            {classSources.map(({ source, book }) => (
              <ContentSourceLabel key={`${source}:${book ?? ""}`} source={source} book={book} />
            ))}
          </label>
          {character.prestigeClass && (
            <label className="finalized-prestige-field">
              Prestige Class (reference only):
              <span className="sheet-value">
                {dragonlancePrestigeClasses[character.prestigeClass]?.name ?? "Prestige Class"}
              </span>
              {dragonlancePrestigeClasses[character.prestigeClass] && (
                <ContentSourceLabel
                  source={dragonlancePrestigeClasses[character.prestigeClass].source}
                  book={dragonlancePrestigeClasses[character.prestigeClass].sourceBook}
                />
              )}
            </label>
          )}
          {(character.highSorceryOrder ||
            character.prestigeClass === "wizard-of-high-sorcery" ||
            character.prestigeClass === "white-robed-wizard" ||
            character.prestigeClass === "red-robed-wizard" ||
            character.prestigeClass === "black-robed-wizard") && (
            <label className="finalized-high-sorcery-field">
              High Sorcery:
              <span className="sheet-value">
                {character.highSorceryOrder
                  ? `${character.highSorceryOrder[0].toUpperCase()}${character.highSorceryOrder.slice(1)} Robes`
                  : "Unselected order"}
              </span>
            </label>
          )}
        </div>
      </Panel>
      <div className="top-combat-layout">
      <div className="sheet-primary-column">
      <Panel title="Ability Scores" className="ability-panel">
        <div className="ability-grid">
          {abilities.map(([short, name]) => {
            const ability = short.toLowerCase() as AbilityName;
            const baseScore = character.abilities[ability];
            const score = getEffectiveAbilityScore(character, ability);
            const equipmentBonus = getAbilityEquipmentBonus(character, ability);
            const racialAdjustment =
              characterRace.abilityModifiers[ability] ?? 0;
            const modifier = abilityModifier(score);
            return (
              <div className="ability-card" key={short}
                title={`Base ${baseScore}${equipmentBonus.detail.length ? `\n${equipmentBonus.detail.join("\n")}\nEffective ${score}` : ""}`}>
                <span>{short}</span>
                <small>{name}</small>
                <strong>{score}</strong>
                {equipmentBonus.bonus > 0 && <small className="ability-effective">Base {baseScore} + {equipmentBonus.bonus} gear</small>}
                <em>
                  {modifier >= 0 ? "+" : ""}
                  {modifier}
                </em>
                {racialAdjustment !== 0 && (
                  <em className="score-breakdown">
                    {`${characterRace.name} (${racialAdjustment > 0 ? "+" : ""}${racialAdjustment})`}
                  </em>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
      <Suspense fallback={<Panel title="Attacks & Weapons" className="attacks-panel">
        <LoadingPlaceholder>Loading attack details...</LoadingPlaceholder>
      </Panel>}>
        <CombatAttackPanel
          character={character}
          rangedTargetDistanceFeet={rangedTargetDistanceFeet}
          onRangedTargetDistanceFeetChange={onRangedTargetDistanceFeetChange}
          combatAttackMode={combatAttackMode}
          onCombatAttackModeChange={onCombatAttackModeChange}
          combatExpertiseAmount={combatExpertiseAmount}
          onCombatExpertiseAmountChange={onCombatExpertiseAmountChange}
          powerAttackAmount={powerAttackAmount}
          onPowerAttackAmountChange={onPowerAttackAmountChange}
          selectedRangedAmmunitionKey={selectedRangedAmmunitionKey}
          onRangedAmmunitionChange={onRangedAmmunitionChange}
        />
      </Suspense>
      {getBaseClassLevels(character).some(({ classId }) => classDefinitions[classId].spellcasting) && (
        <Suspense fallback={<Panel title="Spellcasting" className="casting-summary">
          <LoadingPlaceholder className="casting-summary-loading">
            Loading spellcasting summary...
          </LoadingPlaceholder>
        </Panel>}>
          <CastingSummary
            character={character}
            onOpenSpells={onOpenSpells}
            combatCastingContext={combatCastingContext}
            onCombatCastingContextChange={onCombatCastingContextChange}
            onMedallionOfFaithChange={onMedallionOfFaithChange}
          />
        </Suspense>
      )}
      <Panel title="Languages" className="languages-panel">
        <div className="languages-display">
          {finalized ? (
            <span className="sheet-value">{getCharacterLanguages(character).join(", ")}</span>
          ) : (
            getCharacterLanguages(character).map((language) => (
              <span className="language-chip" key={language}>{language}</span>
            ))
          )}
        </div>
        {allowFeatSelection && (
          <div className="language-panel-choices">
            <p>
              <strong>Automatic:</strong>{" "}
              {getAutomaticLanguages(character).join(", ")}
            </p>
            {getHumanRegionalLanguages(character).length > 0 && (
              <label>
                Regional language
                <Suspense fallback={<PickerLoading
                  className="language-picker"
                  label="Loading regional language choices..."
                />}>
                  <LanguagePicker
                    selected={character.regionalLanguage ?? ""}
                    options={getHumanRegionalLanguages(character)}
                    onChange={(language) =>
                      onRegionalLanguageChange(language || undefined)
                    }
                  />
                </Suspense>
              </label>
            )}
            {Array.from(
              { length: getLanguageBonusSlots(character) },
              (_, index) => {
                const automatic = getAutomaticLanguages(character);
                const chosen = (character.languages ?? []).filter(
                  (language) => !automatic.includes(language),
                );
                const current = chosen[index] ?? "";
                const taken = new Set([
                  ...automatic,
                  ...chosen.filter((_, choiceIndex) => choiceIndex !== index),
                ]);
                return (
                  <label key={`sheet-language-${index}`}>
                    Bonus language {index + 1}
                    <Suspense fallback={<PickerLoading
                      className="language-picker"
                      label="Loading language choices..."
                    />}>
                      <LanguagePicker
                        selected={current}
                        options={getAvailableBonusLanguages(character).filter(
                          (language) =>
                            (!taken.has(language) || language === current) &&
                            !(character.speakLanguages ?? []).includes(language),
                        )}
                        onChange={(language) => {
                          const next = [...chosen];
                          next[index] = language;
                          onLanguagesChange(next.filter(Boolean));
                        }}
                      />
                    </Suspense>
                  </label>
                );
              },
            )}
            {getSpeakLanguageRankCount(character) > 0 && (
              <>
                <p>
                  Each full Speak Language rank learns one language. The skill
                  does not require a check.
                </p>
                {Array.from(
                  { length: getSpeakLanguageRankCount(character) },
                  (_, index) => {
                    const current = character.speakLanguages?.[index] ?? "";
                    return (
                      <label key={`speak-language-${index}`}>
                        Speak Language rank {index + 1}
                        <Suspense fallback={<PickerLoading
                          className="language-picker"
                          label="Loading language choices..."
                        />}>
                          <LanguagePicker
                            selected={current}
                            options={getAvailableSpeakLanguages(character, index)}
                            onChange={(language) => {
                              const next = [...(character.speakLanguages ?? [])];
                              next[index] = language;
                              onSpeakLanguagesChange(next.filter(Boolean));
                            }}
                          />
                        </Suspense>
                      </label>
                    );
                  },
                )}
              </>
            )}
          </div>
        )}
        {getSpeakLanguageWarnings(character).map((warning) => (
          <p className="language-empty" key={warning}>{warning}</p>
        ))}
      </Panel>
      </div>
      <div className="sheet-secondary-column">
      <Panel title="Combat Summary" className="combat-panel">
        <DodgeTargetControl
          character={character}
          selectedOpponent={dodgeTargetSelected}
          onChange={onDodgeTargetSelectedChange}
        />
        <div className="stat-grid">
          <ArmorClassStat
            character={character}
            targetTypes={targetContext.targetTypes}
            combatExpertiseAmount={combatExpertiseAmount}
            dodgeTargetSelected={dodgeTargetSelected}
          />
          <Stat
            label="Initiative"
            value={formatModifier(getInitiativeModifier(character))}
            detail={[
              ...(initiativeFeatBonus ? [`${formatModifier(initiativeFeatBonus)} Improved Initiative`] : []),
              ...(knightInitiativeBonus ? [`${formatModifier(knightInitiativeBonus)} Heroic Initiative`] : []),
              ...(duelistInitiativeBonus ? [`${formatModifier(duelistInitiativeBonus)} Improved Reaction`] : []),
              ...getArmorNonproficiencyPenalties(character).map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`),
              ...getCombatEffectDetails(character, "checks"),
            ]}
            title={[
              ...(initiativeFeatBonus ? [`${formatModifier(initiativeFeatBonus)} Improved Initiative`] : []),
              ...(knightInitiativeBonus ? [`${formatModifier(knightInitiativeBonus)} Heroic Initiative`] : []),
              ...(duelistInitiativeBonus ? [`${formatModifier(duelistInitiativeBonus)} Improved Reaction`] : []),
              ...getArmorNonproficiencyPenalties(character).map((entry) =>
                `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency penalty to Dexterity checks`),
              ...getCombatEffectDetails(character, "checks"),
            ].join("\n") || undefined}
          />
          <AttacksOfOpportunityStat character={character} />
          <Stat label="Speed" value={`${movement.speed} ft.`} detail={[...(movement.bonuses ?? []), ...movement.causes]} />
          {finalized ? (
            <label className="stat manual-fly-speed">
              <small>Fly Speed</small>
              <input
                type="number"
                min="0"
                step="5"
                aria-label="Fly Speed (ft.)"
                value={character.flySpeed ?? ""}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  onCharacterFeatureChange({
                    flySpeed: value === "" ? undefined : Number(value),
                  });
                }}
              />
              <small>Enter only if the character has a fly speed; gliding does not count. Maneuverability and active flight remain manual.</small>
            </label>
          ) : movement.flySpeed !== undefined ? (
            <Stat label="Fly" value={`${movement.flySpeed} ft.`} />
          ) : null}
          {movement.swimSpeed !== undefined && (
            <Stat label="Swim" value={`${movement.swimSpeed} ft.`} />
          )}
          <Stat label="Hit Points" value={`${getCurrentHitPoints(character)} / ${getMaximumHitPoints(character)}`} />
          <Stat label="Temporary HP" value={String(character.temporaryHitPoints ?? 0)} />
          <Stat label="Nonlethal Damage" value={String(character.nonlethalDamage ?? 0)} />
          <Stat label="Damage Reduction" value={character.damageReduction || "—"} />
          <Stat label="Spell Resistance" value={character.spellResistance || "—"} />
          <Stat label="Base Attack" value={formatModifier(getBaseAttackBonus(character))} />
        </div>
        <Suspense fallback={<LoadingPlaceholder className="hp-tracker-loading">
          Loading hit point controls...
        </LoadingPlaceholder>}>
          <HitPointTracker character={character} enabled={finalized} onAction={onHitPointAction} />
        </Suspense>
        <Suspense fallback={<LoadingPlaceholder className="combat-effects-loading">
          Loading active effects...
        </LoadingPlaceholder>}>
          <CombatEffectsTracker character={character} enabled={finalized} onChange={onCombatEffectsChange} />
        </Suspense>
        {knightOfTheCrownLevel > 0 && (
          <section className="prestige-feature-tracker" aria-label="Knight of the Crown abilities">
            <h3>Knight of the Crown abilities</h3>
            <p>
              Strength of Honor: {Math.max(0, strengthOfHonorUsesPerDay - strengthOfHonorUses)} of {strengthOfHonorUsesPerDay} uses remaining.
              {strengthOfHonorActive ? " Active; its duration advances with combat rounds." : ""}
            </p>
            <button
              type="button"
              disabled={!finalized || strengthOfHonorUses >= strengthOfHonorUsesPerDay ||
                strengthOfHonorActive || strengthOfHonorDuration < 1}
              onClick={() => {
                const round = character.combatRound ?? 1;
                onCombatEffectsChange(round, [
                  ...(character.combatEffects ?? []),
                  {
                    name: "Strength of Honor",
                    remainingRounds: strengthOfHonorDuration,
                    modifiers: { attack: 0, armorClass: 0, saves: 0, damage: 0, checks: 0 },
                    abilityModifiers: { str: strengthOfHonorBonus },
                  },
                ]);
                onCharacterFeatureChange({
                  knightOfTheCrownState: {
                    ...crownState,
                    strengthOfHonorUsesUsed: strengthOfHonorUses + 1,
                  },
                });
              }}
            >
              Activate Strength of Honor (+{strengthOfHonorBonus} STR)
            </button>
            {strengthOfHonorDuration < 1 && (
              <p role="status">Strength of Honor has no positive duration at the current Charisma modifier.</p>
            )}
            {knightOfTheCrownLevel >= 10 && (
              <>
                <p>
                  Crown of Knighthood: {crownState.crownOfKnighthoodUsed ? "used today" : "available today"}.
                </p>
                <button
                  type="button"
                  disabled={!finalized || Boolean(crownState.crownOfKnighthoodUsed)}
                  onClick={() => {
                    const round = character.combatRound ?? 1;
                    const currentTemporaryHitPoints = character.temporaryHitPoints ?? 0;
                    onCombatEffectsChange(round, [
                      ...(character.combatEffects ?? []),
                      {
                        name: "Crown of Knighthood (Heroic Valor)",
                        remainingRounds: 100,
                        modifiers: { attack: 4, armorClass: 0, saves: 4, damage: 4, checks: 0 },
                        expiresTemporaryHitPoints: currentTemporaryHitPoints < 15,
                      },
                    ]);
                    onCharacterFeatureChange({
                      temporaryHitPoints: Math.max(currentTemporaryHitPoints, 15),
                      knightOfTheCrownState: {
                        ...crownState,
                        crownOfKnighthoodUsed: true,
                      },
                    });
                  }}
                >
                  Activate Crown of Knighthood (10 minutes)
                </button>
              </>
            )}
            <button
              type="button"
              className="quiet-button"
              disabled={!finalized || (strengthOfHonorUses === 0 && !crownState.crownOfKnighthoodUsed)}
              onClick={() => onCharacterFeatureChange({
                knightOfTheCrownState: {
                  strengthOfHonorUsesUsed: 0,
                  crownOfKnighthoodUsed: false,
                },
              })}
            >
              Reset daily uses
            </button>
          </section>
        )}
        {getEncumbrance(character).unknownWeights.length > 0 && <p className="combat-note" role="status">
          Load uses known weights only. Missing weight: {getEncumbrance(character).unknownWeights.join(", ")}.
        </p>}
      </Panel>
      <Panel title="Saving Throws" className="saving-throws-panel">
        {getChosenFeats(character).includes("honor-bound") && (
          <label className="honor-bound-toggle">
            <input
              type="checkbox"
              checked={Boolean(character.honorBoundSuspended)}
              disabled={!finalized}
              onChange={(event) =>
                onCharacterFeatureChange({ honorBoundSuspended: event.currentTarget.checked })
              }
            />
            Honor-bound benefits suspended after breaking an oath
          </label>
        )}
        <Suspense fallback={<LoadingPlaceholder>
          Loading situational racial bonuses...
        </LoadingPlaceholder>}>
          <SavingThrowContextSelector
            conditions={savingThrowConditions}
            onChange={(condition) =>
              setSavingThrowConditions((current) =>
                current.includes(condition)
                  ? current.filter((entry) => entry !== condition)
                  : [...current, condition],
              )
            }
          />
        </Suspense>
        <div className="stat-grid saving-throws-grid">
          <SavingThrowStat character={character} save="fortitude" label="Fortitude" conditions={savingThrowConditions} />
          <SavingThrowStat character={character} save="reflex" label="Reflex" conditions={savingThrowConditions} />
          <SavingThrowStat character={character} save="will" label="Will" conditions={savingThrowConditions} />
        </div>
      </Panel>
      </div>
      </div>
      <Panel
        title={`Skills (${spentSkillPoints}/${availableSkillPoints}${
          levelUpOriginal && availableSkillPoints - spentSkillPoints === 1
            ? " - 1 point remains (0.5 cross-class rank)"
            : ""
        })`}
        className="skills-panel"
      >
        <p className="skill-use-legend">Checkbox = class skill. Trained = 1+ rank. Blank modifier = no check.
          Select a context to apply a situational racial bonus or conditional skill synergy.
          Hover or focus a skill for ranks and restrictions.</p>
        {creationMode && racialHitDice && (
          <label className="skill-rank-source">
            <span>Assign skill ranks from</span>
            <select
              aria-label="Skill rank source"
              value={skillDisplaySourceId}
              onChange={(event) => {
                const sourceId = event.currentTarget.value;
                if (sourceId === "racial-hit-dice") {
                  setCreationSkillSourceId(sourceId);
                  return;
                }
                const selectedSourceId = skillRankSourceIds.find(
                  (candidate) => candidate === sourceId,
                );
                if (selectedSourceId) setCreationSkillSourceId(selectedSourceId);
              }}
            >
              <option value="racial-hit-dice">
                Racial Hit Dice ({racialHitDice.count}d{racialHitDice.hitDie})
              </option>
              {skillRankSourceIds.map((sourceId) => {
                const sourceLevel = character.classLevels.find((level) =>
                  "prestigeClassId" in level
                    ? level.prestigeClassId === sourceId
                    : level.classId === sourceId,
                );
                const label = sourceLevel && "prestigeClassId" in sourceLevel
                  ? dragonlancePrestigeClasses[sourceLevel.prestigeClassId]?.name ?? sourceId
                  : sourceLevel
                    ? classDefinitions[sourceLevel.classId]?.name ?? sourceId
                    : sourceId;
                return (
                  <option key={sourceId} value={sourceId}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        )}
        <div className="list-grid">
          {skills.map((skill) => {
            const use = getSkillUse(character, skill);
            const skillContexts = getRacialSkillContextOptions(character, skill);
            const synergyContexts = getSkillSynergyContextOptions(character, skill);
            const selectedSkillContext = skillContexts.find(
              ({ condition }) => condition === skillCheckContexts[skill],
            )?.condition;
            const selectedSynergyContext = synergyContexts.find(
              ({ context }) => context === skillSynergyCheckContexts[skill],
            )?.context;
            const selectedCombatCastingContext = skill === "Concentration"
              ? combatCastingContext
              : undefined;
            const modifier = getSkillCheckModifier(
              character,
              skill,
              selectedSkillContext,
              selectedSynergyContext,
              selectedCombatCastingContext,
            );
            const penalties = getSkillCheckPenalties(character, skill);
            return (
            <div className="list-row" key={skill} role="group" aria-label={`${skill} skill`}
              data-rank-editing={!finalized || allowFeatSelection} data-racial-visible={!finalized}>
              <span className="skill-name">
                <span className="tooltip-anchor">
                  <input
                    type="checkbox"
                    checked={isClassSkill(character, skill, skillDisplaySourceId)}
                    readOnly
                    aria-label={`${skill} class skill`}
                  />
                  <span className="inline-tooltip" role="tooltip">
                    {isClassSkill(character, skill, skillDisplaySourceId)
                      ? "Class skill: 1 point per rank; maximum ranks equal Hit Dice + 3."
                      : "Cross-class skill: 1 point buys 0.5 rank; maximum ranks equal half of (Hit Dice + 3)."}
                  </span>
                </span>
                <span className="tooltip-anchor" tabIndex={0}>
                  {skill}
                  {use.trained && <span className="skill-use-status">Trained</span>}
                  {penalties.length > 0 && <span className="skill-penalty">
                    {penalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`).join(", ")}
                  </span>}
                  {!finalized && (
                    <span
                      className={`skill-cost-indicator ${
                        isClassSkill(character, skill, skillDisplaySourceId)
                          ? "class-skill"
                          : "cross-class-skill"
                      }`}
                    >
                      {isClassSkill(character, skill, skillDisplaySourceId)
                        ? "Class skill - 1 pt"
                        : "Cross-class - 1 pt / 0.5 rank"}
                    </span>
                  )}
                  <span className="inline-tooltip" role="tooltip">
                    {skillDescriptions[skill]}<br />
                    {use.ranks} rank{use.ranks === 1 ? "" : "s"} · {use.label}<br />
                    {use.description}<br />
                    {use.untrainedUse === "special" ? "Languages, not checks." :
                      use.untrainedUse === "allowed" ? "Untrained use allowed." :
                      use.untrainedUse === "limited" ? "Limited untrained use." : "Trained only."}<br />
                    {penalties.map((entry) => <span key={entry.source}>
                      {entry.name}: {formatModifier(entry.penalty)}{entry.multiplier === 2 ? " (doubled for Swim)" : ""}.<br />
                    </span>)}
                    Modifiers include ability, whole ranks, racial bonuses, Skill Focus, skill synergies, and applicable armor/shield, load, or nonproficiency check penalties.
                  </span>
                </span>
                {skillContexts.length > 0 && (
                  <label className="skill-check-context">
                    <span>Racial bonus context</span>
                    <select
                      aria-label={`${skill} racial bonus context`}
                      value={selectedSkillContext ?? ""}
                      onChange={(event) => {
                        const condition = skillContexts.find(
                          (option) => option.condition === event.currentTarget.value,
                        )?.condition;
                        setSkillCheckContexts((current) => {
                          const next = { ...current };
                          if (condition) next[skill] = condition;
                          else delete next[skill];
                          return next;
                        });
                      }}
                    >
                      <option value="">No situational bonus</option>
                      {skillContexts.map(({ condition, label, bonus }) => (
                        <option key={condition} value={condition}>
                          {label} ({formatModifier(bonus)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {synergyContexts.length > 0 && (
                  <label className="skill-check-context">
                    <span>Synergy context</span>
                    <select
                      aria-label={`${skill} synergy context`}
                      value={selectedSynergyContext ?? ""}
                      onChange={(event) => {
                        const context = synergyContexts.find(
                          (option) => option.context === event.currentTarget.value,
                        )?.context;
                        setSkillSynergyCheckContexts((current) => {
                          const next = { ...current };
                          if (context) next[skill] = context;
                          else delete next[skill];
                          return next;
                        });
                      }}
                    >
                      <option value="">No conditional synergy</option>
                      {synergyContexts.map(({ context, label, bonus }) => (
                        <option key={context} value={context}>
                          {label} ({formatModifier(bonus)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {skill === "Concentration" && (
                  <CombatCastingContextControl
                    character={character}
                    context={selectedCombatCastingContext}
                    onChange={onCombatCastingContextChange}
                  />
                )}
              </span>
              {!finalized && <span className="skill-racial">
                {getRacialSkillBonus(character, skill)
                  ? `${getCharacterRace(character)} (${formatModifier(getRacialSkillBonus(character, skill))})`
                  : ""}
              </span>}
              <span className="skill-ability">
                {getSkillAbility(skill)
                  ? `${abilityLabels[getSkillAbility(skill)!]} (${formatModifier(abilityModifier(getEffectiveAbilityScore(character, getSkillAbility(skill)!)))})`
                  : "—"}
              </span>
              {(!finalized || allowFeatSelection) && <span className="skill-ranks">
                <button
                  type="button"
                  onClick={() =>
                    onSkillRankChange(skill, -1, skillDisplaySourceId)
                  }
                  disabled={
                    levelUpOriginal
                      ? Number(character.skills[skill] || 0) <=
                        Number(levelUpOriginal.skills[skill] || 0)
                      : getAssignedSkillRanks(
                          character,
                          skill,
                          undefined,
                          creationMode ? skillDisplaySourceId : undefined,
                        ) <= 0
                  }
                  aria-label={`${isClassSkill(character, skill, skillDisplaySourceId) ? "Remove rank from" : "Remove half rank from"} ${skill}`}
                >
                  −
                </button>
                <span>
                  {getAssignedSkillRanks(
                    character,
                    skill,
                    levelUpOriginal,
                    creationMode ? skillDisplaySourceId : undefined,
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onSkillRankChange(skill, 1)}
                  disabled={
                    !canIncreaseSkillRank(
                      character,
                      skill,
                      levelUpOriginal,
                      levelUpClassId,
                      creationMode,
                      creationMode ? skillDisplaySourceId : undefined,
                    )
                  }
                  aria-label={`${isClassSkill(character, skill, skillDisplaySourceId) ? "Add rank to" : "Add half rank to"} ${skill}`}
                >
                  +
                </button>
              </span>}
              <strong title={getSkillTotalTooltip(
                character,
                skill,
                selectedSkillContext,
                selectedSynergyContext,
                selectedCombatCastingContext,
              )}>
                {modifier === null ? null : formatModifier(modifier)}
              </strong>
            </div>
          ); })}
        </div>
      </Panel>
      <Panel
        title={`Skill Tricks (${learnedSkillTricks.length}/${getSkillTrickLimit(character)})`}
        className="skill-tricks-panel"
      >
        <p className="skill-trick-notes">
        Ordinary learning costs 2 skill points and is limited to one trick
        per character level. Feat-granted tricks are free. Your total limit is
        half your character level, rounded up, plus any feat bonuses. Trick
        uses and effects are resolved manually.
      </p>
        {(creationMode || levelUpOriginal) && (
          <label className="skill-trick-picker">
            <span>Learn a skill trick ({skillTrickPointsRemaining} skill points remaining)</span>
            <select
              aria-label="Learn a skill trick"
              value=""
              disabled={
                skillTrickPointsRemaining < 2 ||
                !skillTrickSourceId ||
                availableSkillTricks.length === 0
              }
              onChange={(event) => {
                if (event.currentTarget.value && skillTrickSourceId)
                  onSkillTrickLearn(
                    event.currentTarget.value,
                    skillTrickSourceId,
                  );
              }}
            >
              <option value="">
                {availableSkillTricks.length
                  ? "Choose an eligible skill trick"
                  : "No eligible tricks at this level"}
              </option>
              {availableSkillTricks.map((trick) => (
                <option key={trick.id} value={trick.id}>
                  {trick.name} ({trick.category})
                </option>
              ))}
            </select>
          </label>
        )}
        {skillTrickGrantFeatSlots
          .filter((slot) => slot.characterLevel === currentCharacterLevel)
          .map((slot) => {
            const featName =
              featCatalog.find((feat) => feat.id === slot.featId)?.name ??
              slot.featId;
            const availableGrants = getAvailableSkillTrickGrants(
              character,
              slot.slotId,
            );
            const grantCount = learnedSkillTricks.filter(
              (selection) => selection.featSlotId === slot.slotId,
            ).length;
            return (
              <label className="skill-trick-picker" key={slot.slotId}>
                <span>
                  {featName}: choose a free {slot.category} trick (
                  {grantCount}/2)
                </span>
                <select
                  aria-label={`${featName} free skill trick`}
                  value=""
                  disabled={availableGrants.length === 0}
                  onChange={(event) => {
                    if (event.currentTarget.value)
                      onSkillTrickLearn(
                        event.currentTarget.value,
                        undefined,
                        slot.slotId,
                      );
                  }}
                >
                  <option value="">
                    {availableGrants.length
                      ? "Choose an eligible skill trick"
                      : "No eligible tricks or trick slots available"}
                  </option>
                  {availableGrants.map((trick) => (
                    <option key={trick.id} value={trick.id}>
                      {trick.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        {learnedSkillTricks.length ? (
          <ul className="skill-trick-list">
            {learnedSkillTricks.map((selection) => {
              const trick = skillTrickCatalog.find(
                (entry) => entry.id === selection.trickId,
              );
              if (!trick) return null;
              const grantingFeat = selection.featSlotId
                ? skillTrickGrantFeatSlots.find(
                    (slot) => slot.slotId === selection.featSlotId,
                  )
                : undefined;
              const grantingFeatName = grantingFeat
                ? featCatalog.find((feat) => feat.id === grantingFeat.featId)
                    ?.name
                : undefined;
              return (
                <li key={`${selection.characterLevel}-${selection.trickId}`}>
                  <span>
                    {trick.name} ({trick.category};{" "}
                    {grantingFeatName
                      ? `granted by ${grantingFeatName}`
                      : `learned at level ${selection.characterLevel}`})
                  </span>
                  {(creationMode || levelUpOriginal) &&
                    selection.characterLevel === currentCharacterLevel && (
                      <button
                        type="button"
                        aria-label={`Remove ${trick.name} skill trick`}
                        onClick={() => onSkillTrickRemove(trick.id)}
                      >
                        Remove
                      </button>
                    )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">No skill tricks learned.</p>
        )}
      </Panel>
      <Panel title="Feats & Special Abilities" className="feats-panel">
        <details className="feat-prerequisite-details">
          <summary>Additional prerequisites and manual tracking</summary>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasPowerPointReserve ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasPowerPointReserve: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has a power point reserve (source and total tracked manually)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasKiPower ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasKiPower: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has the Ki Power class feature (source and uses tracked manually)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasKiStrikeMagic ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasKiStrikeMagic: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has Ki Strike (magic) (source confirmed manually)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasAllMartialWeaponProficiencies ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasAllMartialWeaponProficiencies: event.currentTarget.checked,
              })
            }
          />
          <span>
            Proficient with all martial weapons (confirmed manually)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasStealSpell ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasStealSpell: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has the Steal Spell class feature (source confirmed manually)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasSwashbucklerGrace ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasSwashbucklerGrace: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has Swashbuckler Grace +1 (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasConjurationHealingSpell ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasConjurationHealingSpell: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can cast a conjuration (healing) spell (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasSpontaneousCureOrInflict ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasSpontaneousCureOrInflict: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can spontaneously cast cure or inflict spells (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasCureWoundsSpell ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasCureWoundsSpell: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can cast any cure wounds spell (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasSummonNaturesAllySpell ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasSummonNaturesAllySpell: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can cast any summon nature's ally spell (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasInflictWoundsSpell ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasInflictWoundsSpell: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can cast any inflict wounds spell (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.canTurnElementalSubtype ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                canTurnElementalSubtype: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can turn creatures with an elemental subtype (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.canRebukeElementalSubtype ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                canRebukeElementalSubtype: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can rebuke creatures with an elemental subtype (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasFastWildShape ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasFastWildShape: event.currentTarget.checked,
              })
            }
          />
          <span>Has Fast Wild Shape (manually confirmed)</span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasWarmageLevelFour ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasWarmageLevelFour: event.currentTarget.checked,
              })
            }
          />
          <span>Warmage level 4 or higher (manually confirmed)</span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasRechargeableBreathWeapon ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasRechargeableBreathWeapon: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has a breath weapon with recharge time expressed in rounds
            (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasDetectMagicAccess ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasDetectMagicAccess: event.currentTarget.checked,
              })
            }
          />
          <span>
            Can use detect magic as a spell or spell-like ability (manually
            confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.isThoonAffiliate ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                isThoonAffiliate: event.currentTarget.checked,
              })
            }
          />
          <span>Is affiliated with Thoon (manually confirmed)</span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasGraduatedFromApprenticeship ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasGraduatedFromApprenticeship: event.currentTarget.checked,
              })
            }
          />
          <span>Graduated from an apprenticeship (manually confirmed)</span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasMentorSkillPrerequisites ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasMentorSkillPrerequisites: event.currentTarget.checked,
              })
            }
          />
          <span>
            Has 8 ranks in at least two skills associated with the mentor
            category (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.isGuildMember ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                isGuildMember: event.currentTarget.checked,
              })
            }
          />
          <span>Is a member of a guild (manually confirmed)</span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasGuildmasterPrerequisites ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasGuildmasterPrerequisites: event.currentTarget.checked,
              })
            }
          />
          <span>
            Meets the other Guildmaster prerequisites: an associated feat,
            eligible followers and cohorts, and a guild-associated class skill
            at maximum rank (manually confirmed)
          </span>
        </label>
        <label className="manual-prerequisite-control">
          <input
            type="checkbox"
            checked={character.hasCompletedBondingRitual ?? false}
            onChange={(event) =>
              onCharacterFeatureChange({
                hasCompletedBondingRitual: event.currentTarget.checked,
              })
            }
          />
          <span>Completed a bonding ritual (manually confirmed)</span>
        </label>
        {requiresManualClericUndeadTurningMode(character) && (
          <label className="manual-manifester-level">
            <span>Cleric undead turning mode (choose once)</span>
            <select
              aria-label="Cleric undead turning mode"
              value={character.clericUndeadTurningMode ?? ""}
              disabled={character.clericUndeadTurningMode !== undefined}
              onChange={(event) => {
                const value = event.currentTarget.value;
                onCharacterFeatureChange({
                  clericUndeadTurningMode:
                    value === "turn" || value === "rebuke" ? value : undefined,
                });
              }}
            >
              <option value="">Choose one</option>
              <option value="turn">Turn undead</option>
              <option value="rebuke">Rebuke undead</option>
            </select>
          </label>
        )}
        <label className="manual-manifester-level">
          <span>Divine Caster Level (manual)</span>
          <input
            type="number"
            min="0"
            step="1"
            aria-label="Divine Caster Level (manual)"
            value={character.divineCasterLevel ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onCharacterFeatureChange({
                divineCasterLevel: value === "" ? undefined : Number(value),
              });
            }}
          />
        </label>
        <label className="manual-manifester-level">
          <span>Manifester Level (manual)</span>
          <input
            type="number"
            min="0"
            step="1"
            aria-label="Manifester Level (manual)"
            value={character.manifesterLevel ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onCharacterFeatureChange({
                manifesterLevel: value === "" ? undefined : Number(value),
              });
            }}
          />
        </label>
        <label className="manual-manifester-level">
          <span>Skirmish extra damage (d6, manual)</span>
          <input
            type="number"
            min="0"
            step="1"
            aria-label="Skirmish extra damage dice (manual)"
            value={character.skirmishDamageDice ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onCharacterFeatureChange({
                skirmishDamageDice: value === "" ? undefined : Number(value),
              });
            }}
          />
        </label>
        <label className="manual-manifester-level">
          <span>Skirmish AC bonus (manual)</span>
          <input
            type="number"
            min="0"
            step="1"
            aria-label="Skirmish AC bonus (manual)"
            value={character.skirmishACBonus ?? ""}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onCharacterFeatureChange({
                skirmishACBonus: value === "" ? undefined : Number(value),
              });
            }}
          />
        </label>
        </details>
        <div className="feats-abilities-grid">
          <div className="feats-column">
            <h3>Feats</h3>
            {wizardBonusFeatWarnings.map((warning) => (
              <p className="spell-rules-notice" role="alert" key={warning}>{warning}</p>
            ))}
            {featPrerequisiteWarnings.map((warning) => (
              <p className="spell-rules-notice" role="status" key={warning}>{warning}</p>
            ))}
            <div className="chosen-feats">
              {Object.entries(character.featSelections ?? {})
                .filter(([, featId]) => Boolean(featId))
                .map(([slotId, featId]) => {
                  const feat = featCatalog.find((entry) => entry.id === featId);
                  const weapon = character.featWeaponSelections?.[slotId];
                  const skill = character.featSkillSelections?.[slotId];
                  const spellSchool = character.featSpellSchoolSelections?.[slotId];
                  const spellMasterySelections =
                    character.featSpellMasterySelections?.[slotId] ?? [];
                  const spellMasteryCount = featId === "spell-mastery"
                    ? getFeatSpellMasteryChoiceCount(character, slotId)
                    : 0;
                  const spellMasteryChoices = featId === "spell-mastery"
                    ? getAvailableFeatSpellMasteryChoices(character, slotId)
                    : [];
                  const validSpellMasterySelections =
                    spellMasterySelections.length === spellMasteryCount &&
                    new Set(spellMasterySelections).size ===
                      spellMasterySelections.length &&
                    spellMasterySelections.every((spell) =>
                      spellMasteryChoices.includes(spell),
                    );
                  const requiresWeapon = featId === "exotic-weapon-proficiency" ||
                    featId === "improved-critical" ||
                    featId === "weapon-focus" ||
                    featId === "weapon-specialization" ||
                    featId === "ranged-spell-specialization" ||
                    featId === "touch-spell-specialization";
                  const requiresSkill = featId === "skill-focus";
                  const schoolFeatId = featId === "spell-focus" ||
                    featId === "greater-spell-focus" ||
                    featId === "arcane-defense" ||
                    featId === "metamagic-school-focus" ? featId : undefined;
                  const requiresSpellSchool = schoolFeatId !== undefined;
                  const weaponChoices = requiresWeapon
                    ? getAvailableFeatWeaponChoices(character, featId, slotId)
                    : [];
                  const skillChoices = requiresSkill
                    ? getAvailableFeatSkillChoices(character, slotId)
                    : [];
                  const spellSchoolChoices = schoolFeatId
                    ? getAvailableFeatSpellSchoolChoices(character, slotId, schoolFeatId)
                    : [];
                  const validWeapon = weapon && weaponChoices.includes(weapon)
                    ? weapon
                    : undefined;
                  const validSkill = skill && skillChoices.includes(skill)
                    ? skill
                    : undefined;
                  const validSpellSchool = spellSchool && spellSchoolChoices.includes(spellSchool)
                    ? spellSchool
                    : undefined;
                  const showLegacyWeaponChoice =
                    requiresWeapon &&
                    !validWeapon &&
                    (!allowFeatSelection || Boolean(levelUpOriginal));
                  const showLegacySkillChoice =
                    requiresSkill &&
                    !validSkill &&
                    (!allowFeatSelection || Boolean(levelUpOriginal));
                  const showLegacySpellSchoolChoice =
                    requiresSpellSchool &&
                    !validSpellSchool &&
                    (!allowFeatSelection ||
                      levelUpOriginal?.featSelections?.[slotId] === featId);
                  const featName = feat && requiresWeapon
                    ? `${feat.name} (${validWeapon || "choose weapon"})`
                    : feat && requiresSkill
                      ? `${feat.name} (${validSkill || "choose skill"})`
                      : feat && requiresSpellSchool
                        ? `${feat.name} (${validSpellSchool || "choose school"})`
                        : feat?.name;
                  const featDescription = feat && requiresWeapon
                    ? `${feat.description} ${validWeapon ? `Selected weapon: ${validWeapon}.` : "Weapon choice required."}`
                    : feat && requiresSkill
                      ? `${feat.description} ${validSkill ? `Selected skill: ${validSkill}.` : "Skill choice required."}`
                      : feat && requiresSpellSchool
                        ? `${feat.description} ${validSpellSchool ? `Selected school: ${validSpellSchool}.` : "School choice required."}`
                        : feat && featId === "spell-mastery"
                          ? validSpellMasterySelections
                            ? spellMasteryCount
                              ? `${feat.description} Mastered spells: ${spellMasterySelections.join(", ")}.`
                              : `${feat.description} No spell choices are required by the selected Intelligence modifier.`
                            : `${feat.description} Choose ${spellMasteryCount} distinct known Wizard spell${spellMasteryCount === 1 ? "" : "s"}.`
                        : feat?.description;
                  return feat ? (
                    <div className="chosen-feat" key={slotId}>
                      <span className="chosen-feat-name tooltip-anchor">
                        {featName}
                        <span className="inline-tooltip" role="tooltip">
                          {featDescription}
                        </span>
                      </span>
                      <span className="chosen-feat-description">
                        {" "}
                        - {featDescription}
                        <ContentSourceLabel source={feat.source} book={feat.sourceBook} />
                      </span>
                      {showLegacyWeaponChoice && (
                        <label className="feat-weapon-choice">
                          <span>Choose weapon type for {feat.name}</span>
                          <select
                            aria-label={`${slotId} weapon`}
                            value=""
                            disabled={weaponChoices.length === 0}
                            onChange={(event) =>
                              onFeatWeaponChange(slotId, event.target.value)
                            }
                          >
                            <option value="">
                              {weaponChoices.length
                                ? "Choose a weapon..."
                                : "No eligible weapon choices"}
                            </option>
                            {weaponChoices.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {showLegacySkillChoice && (
                        <label className="feat-weapon-choice">
                          <span>Choose skill for {feat.name}</span>
                          <select
                            aria-label={`${slotId} skill`}
                            value=""
                            disabled={skillChoices.length === 0}
                            onChange={(event) =>
                              onFeatSkillChange(slotId, event.target.value)
                            }
                          >
                            <option value="">
                              {skillChoices.length
                                ? "Choose a skill..."
                                : "No eligible skill choices"}
                            </option>
                            {skillChoices.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {showLegacySpellSchoolChoice && (
                        <label className="feat-weapon-choice">
                          <span>Choose school for {feat.name}</span>
                          <select
                            aria-label={`${slotId} spell school`}
                            value=""
                            disabled={spellSchoolChoices.length === 0}
                            onChange={(event) => {
                              const school = spellSchoolChoices.find(
                                (choice) => choice === event.currentTarget.value,
                              );
                              onFeatSpellSchoolChange(slotId, school);
                            }}
                          >
                            <option value="">
                              {spellSchoolChoices.length
                                ? "Choose a school..."
                                : "No eligible school choices"}
                            </option>
                            {spellSchoolChoices.map((school) => (
                              <option key={school} value={school}>
                                {school}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  ) : null;
                })}
              {!Object.values(character.featSelections ?? {}).some(Boolean) && (
                <div className="empty-state">No feats selected.</div>
              )}
            </div>
            {allowFeatSelection && (
                <div className="feat-choices level-up-feat-choices">
                  {(levelUpOriginal
                    ? getChronologicalFeatSlots(character).filter((slot) => {
                        const newSlot = getNewLevelUpFeatSlots(levelUpOriginal, character)
                          .some((entry) => entry.id === slot.id);
                        const selected = character.featSelections?.[slot.id];
                        const invalidWizardChoice = slot.wizardOnly && selected &&
                          !getAvailableFeats(character, slot, slot.id)
                            .some((feat) => feat.id === selected);
                        return newSlot || invalidWizardChoice;
                      })
                    : getChronologicalFeatSlots(character)
                  ).map((slot) => {
                    const options = getAvailableFeats(character, slot, slot.id);
                    const selected = character.featSelections?.[slot.id] ?? "";
                    const selectedFeat = featCatalog.find(
                      (feat) => feat.id === selected,
                    );
                  const weaponChoices =
                    selected === "exotic-weapon-proficiency" ||
                    selected === "improved-critical" ||
                    selected === "weapon-focus" ||
                    selected === "weapon-specialization" ||
                    selected === "ranged-spell-specialization" ||
                    selected === "touch-spell-specialization"
                      ? getAvailableFeatWeaponChoices(character, selected, slot.id)
                      : [];
                  const skillChoices =
                    selected === "skill-focus"
                      ? getAvailableFeatSkillChoices(character, slot.id)
                      : [];
                  const selectedSkill = character.featSkillSelections?.[slot.id];
                  const schoolFeatId = selected === "spell-focus" ||
                    selected === "greater-spell-focus" ||
                    selected === "arcane-defense" ||
                    selected === "metamagic-school-focus" ? selected : undefined;
                  const spellSchoolChoices = schoolFeatId
                    ? getAvailableFeatSpellSchoolChoices(character, slot.id, schoolFeatId)
                    : [];
                  const selectedSpellSchool = character.featSpellSchoolSelections?.[slot.id];
                  const spellMasterySelections =
                    character.featSpellMasterySelections?.[slot.id] ?? [];
                  const spellMasteryCount = selected === "spell-mastery"
                    ? getFeatSpellMasteryChoiceCount(character, slot.id)
                    : 0;
                  const spellMasteryChoices = selected === "spell-mastery"
                    ? getAvailableFeatSpellMasteryChoices(character, slot.id)
                    : [];
                  const spellMasterySpells = selected === "spell-mastery"
                    && spellMasteryChoices.length > 0
                    ? getWizardSpellbookSpells(character)
                    : [];
                    return (
                      <label key={slot.id}>
                        {slot.label}
                        <Suspense fallback={<PickerLoading
                          className="feat-picker"
                          label="Loading feat choices..."
                        />}>
                          <FeatPicker
                            selected={selected}
                            options={options}
                            selectedFeat={selectedFeat}
                            onChange={(featId) => onFeatChange(slot.id, featId)}
                          />
                        </Suspense>
                      {weaponChoices.length > 0 ||
                      selected === "exotic-weapon-proficiency" ||
                      selected === "improved-critical" ||
                      selected === "weapon-focus" ||
                      selected === "weapon-specialization" ||
                      selected === "ranged-spell-specialization" ||
                      selected === "touch-spell-specialization" ? (
                        <div className="feat-weapon-choice">
                          <span>Weapon type</span>
                          <select
                            aria-label={`${slot.label} weapon`}
                            value={character.featWeaponSelections?.[slot.id] ?? ""}
                            disabled={weaponChoices.length === 0}
                            onChange={(event) =>
                              onFeatWeaponChange(slot.id, event.target.value)
                            }
                          >
                            <option value="">
                              {weaponChoices.length
                                ? "Choose a weapon..."
                                : "No eligible weapon choices"}
                            </option>
                            {weaponChoices.map((weapon) => (
                              <option key={weapon} value={weapon}>
                                {weapon}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {selected === "skill-focus" ? (
                        <div className="feat-weapon-choice">
                          <span>Skill</span>
                          <select
                            aria-label={`${slot.label} skill`}
                            value={
                              selectedSkill && skillChoices.includes(selectedSkill)
                                ? selectedSkill
                                : ""
                            }
                            disabled={skillChoices.length === 0}
                            onChange={(event) =>
                              onFeatSkillChange(slot.id, event.target.value)
                            }
                          >
                            <option value="">
                              {skillChoices.length
                                ? "Choose a skill..."
                                : "No eligible skill choices"}
                            </option>
                            {skillChoices.map((skill) => (
                              <option key={skill} value={skill}>
                                {skill}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {schoolFeatId ? (
                        <div className="feat-weapon-choice">
                          <span>School of magic</span>
                          <select
                            aria-label={`${slot.label} spell school`}
                            value={
                              selectedSpellSchool && spellSchoolChoices.includes(selectedSpellSchool)
                                ? selectedSpellSchool
                                : ""
                            }
                            disabled={spellSchoolChoices.length === 0}
                            onChange={(event) => {
                              const school = spellSchoolChoices.find(
                                (choice) => choice === event.currentTarget.value,
                              );
                              onFeatSpellSchoolChange(slot.id, school);
                            }}
                          >
                            <option value="">
                              {spellSchoolChoices.length
                                ? "Choose a school..."
                                : "No eligible school choices"}
                            </option>
                            {spellSchoolChoices.map((school) => (
                              <option key={school} value={school}>
                                {school}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {selected === "spell-mastery" ? (
                        <div className="feat-weapon-choice spell-mastery-choices">
                          <span>
                            Spell Mastery ({spellMasterySelections.length}/{spellMasteryCount})
                          </span>
                          {spellMasteryCount > 0 &&
                            spellMasteryChoices.length === 0 && (
                              <span>No eligible known Wizard spells are available.</span>
                            )}
                          {Array.from(
                            { length: spellMasteryCount },
                            (_, choiceIndex) => {
                              const excluded = new Set(
                                spellMasterySelections.filter(
                                  (_, index) => index !== choiceIndex,
                                ),
                              );
                              const availableSpells = spellMasterySpells.filter(
                                (spell) =>
                                  spellMasteryChoices.includes(spell.name) &&
                                  !excluded.has(spell.name),
                              );
                              return (
                                <div key={`${slot.id}-spell-mastery-${choiceIndex}`}>
                                  <span>Spell {choiceIndex + 1}</span>
                                  <SpellPicker
                                    spells={availableSpells}
                                    selected={spellMasterySelections[choiceIndex]}
                                    disabled={
                                      availableSpells.length === 0 ||
                                      choiceIndex > spellMasterySelections.length
                                    }
                                    placeholder={`Choose spell ${choiceIndex + 1}...`}
                                    onChange={(spell) => {
                                      const nextSelections = [
                                        ...spellMasterySelections,
                                      ];
                                      nextSelections[choiceIndex] = spell;
                                      onFeatSpellMasteryChange(
                                        slot.id,
                                        nextSelections.filter(Boolean),
                                      );
                                    }}
                                  />
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : null}
                      </label>
                    );
                  })}
                </div>
            )}
          </div>
          <div className="abilities-column">
            <h3>Special Abilities</h3>
            <div className="special-abilities-list">
              {specialAbilities.map((specialAbility, index) => {
                const { source, ability } = specialAbility;
                const skillSynergy = getClassFeatureSkillSynergy(
                  character,
                  ability,
                );
                const isPrestigeClass =
                  "isPrestigeClass" in specialAbility &&
                  specialAbility.isPrestigeClass;
                const featureDescription = isPrestigeClass
                  ? prestigeClassFeatureDescriptions[ability] ??
                    classFeatureDescriptions[ability]
                  : classFeatureDescriptions[ability] ??
                    prestigeClassFeatureDescriptions[ability];
                return (
                  <div
                    className="special-ability"
                    key={`${source}-${ability}-${index}`}
                  >
                    <strong>{ability}</strong>
                    {featureDescription && (
                      <span> - {featureDescription}</span>
                    )}
                    {skillSynergy && (
                      <span>
                        {formatModifier(skillSynergy.bonus)} synergy from {skillSynergy.sourceSkill} to {skillSynergy.checkLabel}
                      </span>
                    )}
                    <span>({source})</span>
                  </div>
                );
              })}
            </div>
            {racialSpellLikeAbilities.length > 0 && (
              <div
                className="special-abilities-list"
                role="group"
                aria-label="Racial spell-like ability uses"
              >
                {racialSpellLikeAbilities.map((ability) => {
                  const key = `${characterRace.id}:${ability.name}`;
                  const uses = character.racialSpellLikeUses?.filter((usedKey) => usedKey === key).length ?? 0;
                  return (
                    <div className="special-ability" key={key}>
                      <span>{ability.name}: {uses}/{ability.usesPerDay} used</span>
                      <button
                        type="button"
                        disabled={!finalized || uses >= ability.usesPerDay}
                        onClick={() => onCharacterFeatureChange({
                          racialSpellLikeUses: [...(character.racialSpellLikeUses ?? []), key],
                        })}
                      >
                        Use {ability.name}
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="quiet-button"
                  disabled={!finalized ||
                    !character.racialSpellLikeUses?.length}
                  onClick={() => onCharacterFeatureChange({
                    racialSpellLikeUses: [],
                  })}
                >
                  Reset racial daily uses
                </button>
              </div>
            )}
            {!creationMode && getBaseClassLevel(character, "ranger") > 0 && (
              <RangerFavoredEnemies
                character={character}
                editableLevels={finalized && !levelUpOriginal
                  ? getRangerFavoredEnemyChoiceLevels(
                      getBaseClassLevel(character, "ranger"),
                    )
                  : []}
                onChange={(choices) =>
                  onCharacterFeatureChange({ rangerFavoredEnemies: choices })
                }
              />
            )}
          </div>
        </div>
      </Panel>
      <Suspense fallback={<Panel title="Character Notes" className="notes-panel">
        <LoadingPlaceholder className="notes-loading">
          Loading character notes...
        </LoadingPlaceholder>
      </Panel>}>
        <CharacterNotes notes={character.notes} onAddNote={onAddNote} />
      </Suspense>
    </div>
  );
}
