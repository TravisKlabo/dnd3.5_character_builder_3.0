import { lazy, Suspense, useState } from "react";
import { type Character, type ClassId, type PrestigeClassId, type SavingThrowCondition, type RacialSkillCondition, dragonlancePrestigeClasses, classDefinitions, raceDefinitions, deityDefinitions, type AbilityName, abilityModifier, type MagicSchool, type SkillRankSourceId, getEffectiveCharacterLevel, getTotalHitDice } from "../domain";
import { getLevelUpSkillSourceId, getBaseClassLevel, getBaseClassLevels, getRangerFavoredEnemyChoiceLevels, getPrestigeClassLevel, getKnightOfCrownHeroicInitiativeBonus, getChosenFeats, formatModifier, getBaseAttackBonus, getCharacterLanguages, getAutomaticLanguages, getLanguageBonusSlots, getAvailableBonusLanguages, getAvailableSpeakLanguages, getSpeakLanguageRankCount, getSpeakLanguageWarnings, getHumanRegionalLanguages, getLevelUpSpentSkillPoints, getSpentSkillPoints, getAvailableSkillCount, isClassSkill, getRacialSkillBonus, getRacialSkillContextOptions, getSkillSynergyContextOptions, getClassFeatureSkillSynergy, getCharacterRace, getRaceDefinitionForCharacter, getRacialHitDiceForCharacter, getSkillAbility, getAssignedSkillRanks, canIncreaseSkillRank, getSkillTotalTooltip, getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getNewLevelUpFeatSlots, getChronologicalFeatSlots, getAvailableFeats, getAvailableFeatWeaponChoices, getAvailableFeatSkillChoices, getAvailableFeatSpellSchoolChoices, getRacialSpellLikeAbilities, getImprovedInitiativeBonus, getInitiativeModifier } from "../rules";
import { type CombatAttackMode, type CombatCastingContext, type SkillSynergyContext } from "../rules";
import { getMovement, getEncumbrance, getArmorNonproficiencyPenalties, getClassFeatureDisplay } from "../rules";
import { abilities, skills, skillDescriptions, abilityLabels, featCatalog } from "../data/characterCatalog";
import { classFeatureDescriptions } from "../data/classFeatureDescriptions";
import { prestigeClassFeatureDescriptions } from "../data/prestigeClassFeatureDescriptions";
import { Panel, Stat, ArmorClassStat, SavingThrowStat, DodgeTargetControl, AttacksOfOpportunityStat, CombatCastingContextControl, ContentSourceLabel } from "./shared";
import { RangerFavoredEnemies } from "./RangerFavoredEnemies";
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
  onFeatChange,
  onFeatWeaponChange,
  onFeatSkillChange,
  onFeatSpellSchoolChange,
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
  onFeatChange: (slotId: string, featId: string) => void;
  onFeatWeaponChange: (slotId: string, weaponName: string) => void;
  onFeatSkillChange: (slotId: string, skill: string) => void;
  onFeatSpellSchoolChange: (slotId: string, school: MagicSchool | undefined) => void;
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
    update: Partial<Pick<Character, "knightOfTheCrownState" | "honorBoundSuspended" | "temporaryHitPoints" | "rangerFavoredEnemies">>,
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
  const skillDisplaySourceId: SkillRankSourceId | undefined = levelUpOriginal
    ? activeLevelUpClassId
    : creationMode
      ? creationSkillSourceId === "racial-hit-dice" && !racialHitDice
        ? defaultSkillSourceId
        : creationSkillSourceId ?? defaultSkillSourceId
      : undefined;
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
    ...(
      character.prestigeClass &&
        character.prestigeClass !== "wizard-of-high-sorcery" &&
        !character.classLevels.some((level) => "prestigeClassId" in level)
        ? [`${dragonlancePrestigeClasses[character.prestigeClass]?.name ?? "Prestige Class"} 1`]
        : []
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
  const specialAbilities = [
    ...(characterRace.traits ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
    })),
    ...(characterRace.specialAbilities ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
    })),
    ...getRacialSpellLikeAbilities(character).map((ability) => ({
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
    ...(character.prestigeClass
      ? (
          dragonlancePrestigeClasses[character.prestigeClass]?.features ?? []
        ).map((ability) => ({
          source: dragonlancePrestigeClasses[character.prestigeClass!].name,
          ability,
        }))
      : []),
  ];
  const initiativeFeatBonus = getImprovedInitiativeBonus(character);
  const knightInitiativeBonus = getKnightOfCrownHeroicInitiativeBonus(character);
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
              Prestige Class:
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
              ...getArmorNonproficiencyPenalties(character).map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`),
              ...getCombatEffectDetails(character, "checks"),
            ]}
            title={[
              ...(initiativeFeatBonus ? [`${formatModifier(initiativeFeatBonus)} Improved Initiative`] : []),
              ...(knightInitiativeBonus ? [`${formatModifier(knightInitiativeBonus)} Heroic Initiative`] : []),
              ...getArmorNonproficiencyPenalties(character).map((entry) =>
                `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency penalty to Dexterity checks`),
              ...getCombatEffectDetails(character, "checks"),
            ].join("\n") || undefined}
          />
          <AttacksOfOpportunityStat character={character} />
          <Stat label="Speed" value={`${movement.speed} ft.`} detail={[...(movement.bonuses ?? []), ...movement.causes]} />
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
        title={`Skills (${levelUpOriginal
          ? getLevelUpSpentSkillPoints(
              levelUpOriginal,
              character,
              activeLevelUpClassId ?? "fighter",
            )
          : getSpentSkillPoints(character)}/${getAvailableSkillCount(character)}${
          levelUpOriginal &&
          getAvailableSkillCount(character) -
            getLevelUpSpentSkillPoints(
              levelUpOriginal,
              character,
              activeLevelUpClassId ?? "fighter",
            ) ===
            1
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
      <Panel title="Feats & Special Abilities" className="feats-panel">
        <div className="feats-abilities-grid">
          <div className="feats-column">
            <h3>Feats</h3>
            <div className="chosen-feats">
              {Object.entries(character.featSelections ?? {})
                .filter(([, featId]) => Boolean(featId))
                .map(([slotId, featId]) => {
                  const feat = featCatalog.find((entry) => entry.id === featId);
                  const weapon = character.featWeaponSelections?.[slotId];
                  const skill = character.featSkillSelections?.[slotId];
                  const spellSchool = character.featSpellSchoolSelections?.[slotId];
                  const requiresWeapon = featId === "exotic-weapon-proficiency" ||
                    featId === "improved-critical" ||
                    featId === "weapon-focus" ||
                    featId === "weapon-specialization";
                  const requiresSkill = featId === "skill-focus";
                  const schoolFeatId = featId === "spell-focus" ||
                    featId === "greater-spell-focus" ? featId : undefined;
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
                    ? getNewLevelUpFeatSlots(levelUpOriginal, character)
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
                    selected === "weapon-specialization"
                      ? getAvailableFeatWeaponChoices(character, selected, slot.id)
                      : [];
                  const skillChoices =
                    selected === "skill-focus"
                      ? getAvailableFeatSkillChoices(character, slot.id)
                      : [];
                  const selectedSkill = character.featSkillSelections?.[slot.id];
                  const schoolFeatId = selected === "spell-focus" ||
                    selected === "greater-spell-focus" ? selected : undefined;
                  const spellSchoolChoices = schoolFeatId
                    ? getAvailableFeatSpellSchoolChoices(character, slot.id, schoolFeatId)
                    : [];
                  const selectedSpellSchool = character.featSpellSchoolSelections?.[slot.id];
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
                      selected === "weapon-specialization" ? (
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
                      </label>
                    );
                  })}
                </div>
            )}
          </div>
          <div className="abilities-column">
            <h3>Special Abilities</h3>
            <div className="special-abilities-list">
              {specialAbilities.map(({ source, ability }, index) => {
                const skillSynergy = getClassFeatureSkillSynergy(
                  character,
                  ability,
                );
                const featureDescription =
                  classFeatureDescriptions[ability] ??
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
