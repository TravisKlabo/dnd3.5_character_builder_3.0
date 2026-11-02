import { lazy, Suspense, useState } from "react";
import { type Character, type ClassId, type SavingThrowCondition, type RacialSkillCondition, type CombatTargetType, dragonlancePrestigeClasses, classDefinitions, raceDefinitions, deityDefinitions, type AbilityName, abilityModifier, type MagicSchool } from "../domain";
import { getLevelUpClassId, formatModifier, getBaseAttackBonus, getTwoWeaponAttackPenalty, getEquippedWeaponStats, getWeaponCompatibilityWarning, getEffectiveWeaponKey, getTowerShieldState, getCharacterLanguages, getRacialLanguages, getLanguageBonusSlots, getAvailableBonusLanguages, getLevelUpSpentSkillPoints, getSpentSkillPoints, getAvailableSkillCount, isClassSkill, getRacialSkillBonus, getRacialSkillContextOptions, getSkillSynergyContextOptions, getClassFeatureSkillSynergy, getCharacterRace, getSkillAbility, getAssignedSkillRanks, canIncreaseSkillRank, getSkillTotalTooltip, getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getNewLevelUpFeatSlots, getFeatSlots, getAvailableFeats, getAvailableFeatWeaponChoices, getAvailableFeatSkillChoices, getAvailableFeatSpellSchoolChoices, getRangerCombatStyleStatus, getRacialSpellLikeAbilities, getImprovedInitiativeBonus, getInitiativeModifier } from "../rules";
import { type CombatCastingContext, type SkillSynergyContext } from "../rules";
import { getMovement, getEncumbrance, getArmorNonproficiencyPenalties, getClassFeatureDisplay, getWeaponSizeHandling } from "../rules";
import { abilities, skills, skillDescriptions, abilityLabels, featCatalog, classFeatureDescriptions } from "../data/characterCatalog";
import { Panel, Stat, ArmorClassStat, SpecialAttackStats, CombatMovementLine, SavingThrowStat, RangedDistanceControl, TargetDamageReductionControl, RangedAmmunitionControl, CombatExpertiseControl, PowerAttackControl, DodgeTargetControl, AttacksOfOpportunityStat, CombatCastingContextControl, ContentSourceLabel } from "./shared";
import { LanguagePicker, FeatPicker } from "./pickers";
import { CharacterNotes } from "./CharacterNotes";
import { HitPointTracker } from "./HitPointTracker";
import { type HitPointAction, getCurrentHitPoints, getMaximumHitPoints } from "../hitPoints";
import { CastingSummary } from "./CastingSummary";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";
import { CombatEffectsTracker } from "./CombatEffectsTracker";
import { getCombatEffectDetails, type CombatEffect } from "../combatEffects";

const SavingThrowContextSelector = lazy(() =>
  import("./SavingThrowContextSelector").then((module) => ({
    default: module.SavingThrowContextSelector,
  })),
);

const CombatTargetContextSelector = lazy(() =>
  import("./CombatTargetContextSelector").then((module) => ({
    default: module.CombatTargetContextSelector,
  })),
);

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
  rangedTargetDistanceFeet,
  onRangedTargetDistanceFeetChange,
  combatExpertiseAmount,
  onCombatExpertiseAmountChange,
  powerAttackAmount,
  onPowerAttackAmountChange,
  dodgeTargetSelected,
  onDodgeTargetSelectedChange,
  combatCastingContext,
  onCombatCastingContextChange,
  targetDamageReduction,
  onTargetDamageReductionChange,
  selectedRangedAmmunitionKey,
  onRangedAmmunitionChange,
  onOpenSpells,
}: {
  character: Character;
  levelUpOriginal?: Character;
  levelUpClassId?: ClassId;
  creationMode: boolean;
  onSkillRankChange: (skill: string, change: number) => void;
  onFeatChange: (slotId: string, featId: string) => void;
  onFeatWeaponChange: (slotId: string, weaponName: string) => void;
  onFeatSkillChange: (slotId: string, skill: string) => void;
  onFeatSpellSchoolChange: (slotId: string, school: MagicSchool | undefined) => void;
  onLanguagesChange: (languages: string[]) => void;
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
  rangedTargetDistanceFeet: number | undefined;
  onRangedTargetDistanceFeetChange: (distanceFeet: number | undefined) => void;
  combatExpertiseAmount: number;
  onCombatExpertiseAmountChange: (amount: number) => void;
  powerAttackAmount: number;
  onPowerAttackAmountChange: (amount: number) => void;
  dodgeTargetSelected: boolean;
  onDodgeTargetSelectedChange: (selected: boolean) => void;
  combatCastingContext?: CombatCastingContext;
  onCombatCastingContextChange: (context: CombatCastingContext | undefined) => void;
  targetDamageReduction: string;
  onTargetDamageReductionChange: (value: string) => void;
  selectedRangedAmmunitionKey?: string;
  onRangedAmmunitionChange: (key: string | undefined) => void;
  onOpenSpells: () => void;
}) {
  const [savingThrowConditions, setSavingThrowConditions] = useState<SavingThrowCondition[]>([]);
  const [combatTargetTypes, setCombatTargetTypes] = useState<CombatTargetType[]>([]);
  const [skillCheckContexts, setSkillCheckContexts] = useState<
    Partial<Record<string, RacialSkillCondition>>
  >({});
  const [skillSynergyCheckContexts, setSkillSynergyCheckContexts] = useState<
    Partial<Record<string, SkillSynergyContext>>
  >({});
  const skillDisplayClassId = levelUpOriginal
    ? levelUpClassId ?? getLevelUpClassId(levelUpOriginal, character)
    : undefined;
  const rangerCombatStyle = getRangerCombatStyleStatus(character);
  const classSummary = character.classLevels
    .filter(
      (level) =>
        !("prestigeClassId" in level && level.prestigeClassId === "wizard-of-high-sorcery"),
    )
    .map(
      (level) => "prestigeClassId" in level
        ? `${dragonlancePrestigeClasses[level.prestigeClassId]?.name ?? level.prestigeClassId} ${level.level}`
        : `${classDefinitions[level.classId]?.name ?? level.classId} ${level.level}`,
    )
    .concat(
      character.prestigeClass &&
        character.prestigeClass !== "wizard-of-high-sorcery" &&
        !character.classLevels.some((level) => "prestigeClassId" in level)
        ? `${dragonlancePrestigeClasses[character.prestigeClass]?.name ?? "Prestige Class"} 1`
        : [],
    )
    .join(" / ");
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
  const characterRace =
    raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ??
    raceDefinitions.human;
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
  return (
    <div className="sheet-grid">
      <Panel title={`${character.name || "Unnamed Character"}${character.player ? ` (${character.player})` : ""}`} headerLabel="Character Info" className={`identity-panel${finalized ? " finalized" : ""}`} showStatus statusText={`Level: ${character.classLevels.filter((entry) => !("prestigeClassId" in entry && entry.prestigeClassId === "wizard-of-high-sorcery")).reduce((total, entry) => total + entry.level, 0)}`}>
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
            const characterRace =
              raceDefinitions[
                character.race.toLowerCase().replaceAll(" ", "-")
              ] ?? raceDefinitions.human;
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
      <Panel title="Attacks & Weapons" className="attacks-panel">
        <CombatExpertiseControl
          character={character}
          amount={combatExpertiseAmount}
          onChange={onCombatExpertiseAmountChange}
        />
        <PowerAttackControl
          character={character}
          amount={powerAttackAmount}
          onChange={onPowerAttackAmountChange}
        />
        <Suspense fallback={<p>Loading target-specific racial bonuses...</p>}>
          <CombatTargetContextSelector
            targetTypes={combatTargetTypes}
            onChange={(targetType) =>
              setCombatTargetTypes((current) =>
                current.includes(targetType)
                  ? current.filter((entry) => entry !== targetType)
                  : [...current, targetType],
              )
            }
          />
        </Suspense>
        <RangedDistanceControl
          distanceFeet={rangedTargetDistanceFeet}
          onChange={onRangedTargetDistanceFeetChange}
        />
        <TargetDamageReductionControl
          value={targetDamageReduction}
          onChange={onTargetDamageReductionChange}
        />
        {rangerCombatStyle.warning && (
          <p className="combat-note" role="status">
            {rangerCombatStyle.warning}
          </p>
        )}
        <div className="combat-weapon-row">
          {(["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const).map((slot) => {
            const attackPenalty =
              slot === "Main Weapon" || slot === "Off Hand Weapon"
                ? getTwoWeaponAttackPenalty(character, slot)
                : 0;
            const equippedWeapon = getEffectiveWeaponKey(character, slot);
            const sizeHandling = equippedWeapon ? getWeaponSizeHandling(character, equippedWeapon, slot) : null;
            const towerShieldCoverActive = getTowerShieldState(character).coverActive;
            const compatibilityWarning = equippedWeapon
              ? getWeaponCompatibilityWarning(character, equippedWeapon, slot)
              : null;
            const stats = equippedWeapon
              ? getEquippedWeaponStats(character, equippedWeapon, attackPenalty, slot, combatTargetTypes, rangedTargetDistanceFeet, targetDamageReduction, selectedRangedAmmunitionKey, combatExpertiseAmount, powerAttackAmount)
              : null;
            return (
              <div className={`combat-weapon-stat${equippedWeapon ? "" : " unequipped-weapon"}`} key={slot}>
                <small>{slot.replace(" Weapon", "")}</small>
                {stats ? <>
                <strong title={[stats.attackSequenceNote, stats.rangeStatusMessage, stats.damageReductionStatus?.message, stats.weaponSizeDetail, ...(stats.combatExpertisePenalty ? [`Combat Expertise ${formatModifier(stats.combatExpertisePenalty)} attack`] : []), ...(stats.powerAttackPenalty ? [`Power Attack ${formatModifier(stats.powerAttackPenalty)} attack`] : []), ...(stats.pointBlankShotBonus ? ["Point Blank Shot +1 attack and damage"] : []), ...(stats.weaponFocusBonus ? ["Weapon Focus +1"] : []), ...(stats.compositeBowStrengthRating !== undefined ? [`Composite bow Strength rating ${formatModifier(stats.compositeBowStrengthRating)}; positive Strength damage is capped at the rating`] : []), ...stats.racialAttackDetails, ...getCombatEffectDetails(character, "attack")].filter(Boolean).join("\n")}>
                  {stats.rangeOutOfRange ? "Out of range" : `Attack ${stats.attackSequence.map(formatModifier).join(" / ")}`}
                </strong>
                {stats.maximumRangeFeet !== undefined && <span>Maximum range {stats.maximumRangeFeet} ft.</span>}
                {stats.rangeStatusMessage && <span className={stats.rangeOutOfRange ? "combat-warning" : ""} role="status">{stats.rangeStatusMessage}</span>}
                {stats.ammunitionStatus && <span className={stats.ammunitionStatus.status === "ready" ? "" : "combat-warning"} role={stats.ammunitionStatus.status === "missing" ? "alert" : "status"}>{stats.ammunitionStatus.message}</span>}
                {stats.ammunitionOptions !== undefined && <RangedAmmunitionControl
                  options={stats.ammunitionOptions}
                  selectedKey={stats.selectedAmmunitionKey}
                  onChange={onRangedAmmunitionChange}
                />}
                {stats.damageReductionStatus && <span className={stats.damageReductionStatus.status === "applies" || stats.damageReductionStatus.status === "manual" ? "combat-warning" : ""} role="status">{stats.damageReductionStatus.message}</span>}
                {stats.reloadNote && <span>{stats.reloadNote}</span>}
                {stats.compositeBowStrengthRating !== undefined &&
                  <span>Composite bow rating {formatModifier(stats.compositeBowStrengthRating)}</span>}
                {stats.compositeBowStrengthPenalty < 0 && <span className="attack-penalty">
                  {formatModifier(stats.compositeBowStrengthPenalty)} composite-bow rating
                </span>}
                {stats.weaponFocusBonus > 0 && <span>+1 Weapon Focus</span>}
                {stats.pointBlankShotBonus > 0 && <span>+1 Point Blank Shot attack and damage</span>}
                {stats.combatExpertisePenalty < 0 && <span className="attack-penalty">
                  {formatModifier(stats.combatExpertisePenalty)} Combat Expertise attack
                </span>}
                {stats.powerAttackPenalty < 0 && <span className="attack-penalty">
                  {formatModifier(stats.powerAttackPenalty)} Power Attack
                </span>}
                <span title={getCombatEffectDetails(character, "damage").join("\n") || undefined}>Damage {stats.damage}</span>
                {stats.powerAttackDamageBonus > 0 && <span>
                  +{stats.powerAttackDamageBonus} Power Attack damage
                </span>}
                {stats.materialDamageNote && <span className="combat-warning">{stats.materialDamageNote}</span>}
                {stats.weaponSpecializationBonus > 0 && <span>+2 Weapon Specialization damage</span>}
                <span>Crit {stats.critical}</span>
                {(stats.rangeIncrement || stats.reach) && <span className="weapon-distance">
                  {[stats.reach && `Reach ${stats.reach}`, stats.rangeIncrement && `${stats.rangeLabel} ${stats.rangeIncrement}`].filter(Boolean).join(" · ")}
                </span>}
                {stats.nonproficiencyPenalty < 0 && <span className="attack-penalty"
                  title={stats.nonproficiencyPenalties.map((entry) => `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency`).join("\n")}>
                  {stats.nonproficiencyPenalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`).join(", ")}
                </span>}
                {stats.towerShieldAttackPenalty < 0 && <span className="attack-penalty">
                  {formatModifier(stats.towerShieldAttackPenalty)} tower shield
                </span>}
                {stats.weaponSizePenalty < 0 && <span className="attack-penalty" title={stats.weaponSizeDetail}>
                  {formatModifier(stats.weaponSizePenalty)} weapon size
                </span>}
                {stats.twoHandedGrip && <span>Two-handed grip</span>}
                {stats.bucklerAttackPenalty !== 0 && <span className="attack-penalty">
                  {formatModifier(stats.bucklerAttackPenalty)} buckler
                </span>}
                </> : <span title={compatibilityWarning ?? sizeHandling?.warning}>
                  {towerShieldCoverActive && equippedWeapon
                    ? "Unavailable while using tower shield for total cover"
                    : compatibilityWarning ?? (sizeHandling && !sizeHandling.wieldable ? "Cannot wield: incompatible weapon size" : "Not equipped")}
                </span>}
              </div>
            );
          })}
        </div>
        <SpecialAttackStats character={character} />
        <CombatMovementLine character={character} />
      </Panel>
      <CastingSummary
        character={character}
        onOpenSpells={onOpenSpells}
        combatCastingContext={combatCastingContext}
        onCombatCastingContextChange={onCombatCastingContextChange}
      />
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
              {getRacialLanguages(character).join(", ")}
            </p>
            {Array.from(
              { length: getLanguageBonusSlots(character) },
              (_, index) => {
                const automatic = getRacialLanguages(character);
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
                    <LanguagePicker
                      selected={current}
                      options={getAvailableBonusLanguages(character).filter(
                        (language) =>
                          !taken.has(language) || language === current,
                      )}
                      onChange={(language) => {
                        const next = [...chosen];
                        next[index] = language;
                        onLanguagesChange(next.filter(Boolean));
                      }}
                    />
                  </label>
                );
              },
            )}
          </div>
        )}
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
            targetTypes={combatTargetTypes}
            combatExpertiseAmount={combatExpertiseAmount}
            dodgeTargetSelected={dodgeTargetSelected}
          />
          <Stat
            label="Initiative"
            value={formatModifier(getInitiativeModifier(character))}
            detail={[
              ...(initiativeFeatBonus ? [`${formatModifier(initiativeFeatBonus)} Improved Initiative`] : []),
              ...getArmorNonproficiencyPenalties(character).map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`),
              ...getCombatEffectDetails(character, "checks"),
            ]}
            title={[
              ...(initiativeFeatBonus ? [`${formatModifier(initiativeFeatBonus)} Improved Initiative`] : []),
              ...getArmorNonproficiencyPenalties(character).map((entry) =>
                `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency penalty to Dexterity checks`),
              ...getCombatEffectDetails(character, "checks"),
            ].join("\n") || undefined}
          />
          <AttacksOfOpportunityStat character={character} />
          <Stat
            label="Speed"
            value={`${getMovement(character).speed} ft.`}
            detail={getMovement(character).causes}
          />
          <Stat label="Hit Points" value={`${getCurrentHitPoints(character)} / ${getMaximumHitPoints(character)}`} />
          <Stat label="Temporary HP" value={String(character.temporaryHitPoints ?? 0)} />
          <Stat label="Nonlethal Damage" value={String(character.nonlethalDamage ?? 0)} />
          <Stat label="Damage Reduction" value={character.damageReduction || "—"} />
          <Stat label="Spell Resistance" value={character.spellResistance || "—"} />
          <Stat label="Base Attack" value={formatModifier(getBaseAttackBonus(character))} />
        </div>
        <HitPointTracker character={character} enabled={finalized} onAction={onHitPointAction} />
        <CombatEffectsTracker character={character} enabled={finalized} onChange={onCombatEffectsChange} />
        {getEncumbrance(character).unknownWeights.length > 0 && <p className="combat-note" role="status">
          Load uses known weights only. Missing weight: {getEncumbrance(character).unknownWeights.join(", ")}.
        </p>}
      </Panel>
      <Panel title="Saving Throws" className="saving-throws-panel">
        <Suspense fallback={<p>Loading situational racial bonuses...</p>}>
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
              getLevelUpClassId(levelUpOriginal, character),
            )
          : getSpentSkillPoints(character)}/${getAvailableSkillCount(character)}${
          levelUpOriginal &&
          getAvailableSkillCount(character) -
            getLevelUpSpentSkillPoints(
              levelUpOriginal,
              character,
              getLevelUpClassId(levelUpOriginal, character),
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
                    checked={isClassSkill(character, skill, skillDisplayClassId)}
                    readOnly
                    aria-label={`${skill} class skill`}
                  />
                  <span className="inline-tooltip" role="tooltip">
                    {isClassSkill(character, skill, skillDisplayClassId)
                      ? "Class skill: 1 point per rank; maximum ranks equal character level + 3."
                      : "Cross-class skill: 1 point buys 0.5 rank; maximum ranks equal half of (character level + 3)."}
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
                        isClassSkill(character, skill, skillDisplayClassId)
                          ? "class-skill"
                          : "cross-class-skill"
                      }`}
                    >
                      {isClassSkill(character, skill, skillDisplayClassId)
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
                  onClick={() => onSkillRankChange(skill, -1)}
                  disabled={
                    levelUpOriginal
                      ? Number(character.skills[skill] || 0) <=
                        Number(levelUpOriginal.skills[skill] || 0)
                      : !character.skills[skill]
                  }
                  aria-label={`${isClassSkill(character, skill, skillDisplayClassId) ? "Remove rank from" : "Remove half rank from"} ${skill}`}
                >
                  −
                </button>
                <span>
                  {getAssignedSkillRanks(character, skill, levelUpOriginal)}
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
                    )
                  }
                  aria-label={`${isClassSkill(character, skill, skillDisplayClassId) ? "Add rank to" : "Add half rank to"} ${skill}`}
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
                  : getFeatSlots(character)
                ).map((slot) => {
                  const options = getAvailableFeats(character, slot, slot.id);
                  const selected = character.featSelections?.[slot.id] ?? "";
                  const selectedFeat = featCatalog.find(
                    (feat) => feat.id === selected,
                  );
                  const weaponChoices =
                    selected === "exotic-weapon-proficiency" ||
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
                      <FeatPicker
                        selected={selected}
                        options={options}
                        selectedFeat={selectedFeat}
                        onChange={(featId) => onFeatChange(slot.id, featId)}
                      />
                      {weaponChoices.length > 0 ||
                      selected === "exotic-weapon-proficiency" ||
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
                return (
                  <div
                    className="special-ability"
                    key={`${source}-${ability}-${index}`}
                  >
                    <strong>{ability}</strong>
                    {classFeatureDescriptions[ability] && (
                      <span> - {classFeatureDescriptions[ability]}</span>
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
          </div>
        </div>
      </Panel>
      <CharacterNotes notes={character.notes} onAddNote={onAddNote} />
    </div>
  );
}
