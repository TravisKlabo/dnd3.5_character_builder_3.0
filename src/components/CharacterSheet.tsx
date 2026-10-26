import { type Character, type ClassId, dragonlancePrestigeClasses, classDefinitions, raceDefinitions, deityDefinitions, type AbilityName, abilityModifier } from "../domain";
import { getLevelUpClassId, formatModifier, getBaseAttackBonus, getTwoWeaponAttackPenalty, getEquippedWeaponStats, getCharacterLanguages, getRacialLanguages, getLanguageBonusSlots, getLevelUpSpentSkillPoints, getSpentSkillPoints, getAvailableSkillCount, isClassSkill, getRacialSkillBonus, getCharacterRace, getSkillAbility, getAssignedSkillRanks, canIncreaseSkillRank, getSkillTotalTooltip, getSkillUse, getSkillCheckModifier, getSkillCheckPenalties, getNewLevelUpFeatSlots, getFeatSlots, getAvailableFeats } from "../rules";
import { getMovement, getEncumbrance, getArmorNonproficiencyPenalties } from "../rules";
import { startingClassFeatures, abilities, languageCatalog, skills, skillDescriptions, abilityLabels, featCatalog, classFeatureDescriptions } from "../data/characterCatalog";
import { Panel, Stat, ArmorClassStat, SpecialAttackStats, CombatMovementLine, SavingThrowStat } from "./shared";
import { LanguagePicker, FeatPicker } from "./pickers";
import { CharacterNotes } from "./CharacterNotes";
import { HitPointTracker } from "./HitPointTracker";
import { type HitPointAction, getCurrentHitPoints, getMaximumHitPoints } from "../hitPoints";
import { CastingSummary } from "./CastingSummary";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";
import { CombatEffectsTracker } from "./CombatEffectsTracker";
import { getCombatEffectDetails, getCombatEffectModifier, type CombatEffect } from "../combatEffects";

export function CharacterSheet({
  character,
  levelUpOriginal,
  levelUpClassId,
  creationMode,
  onSkillRankChange,
  onFeatChange,
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
  onOpenSpells,
}: {
  character: Character;
  levelUpOriginal?: Character;
  levelUpClassId?: ClassId;
  creationMode: boolean;
  onSkillRankChange: (skill: string, change: number) => void;
  onFeatChange: (slotId: string, featId: string) => void;
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
  onOpenSpells: () => void;
}) {
  const classId = character.classLevels.at(-1)?.classId ?? "fighter";
  const skillDisplayClassId = levelUpOriginal
    ? levelUpClassId ?? getLevelUpClassId(levelUpOriginal, character)
    : undefined;
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
  const characterRace =
    raceDefinitions[character.race.toLowerCase().replaceAll(" ", "-")] ??
    raceDefinitions.human;
  const classFeatureDisplay = [
    ...(startingClassFeatures[classId] ?? []),
    ...(character.classFeatures ?? []),
  ].filter((feature, index, features) => features.indexOf(feature) === index);
  const specialAbilities = [
    ...(characterRace.traits ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
    })),
    ...(characterRace.specialAbilities ?? []).map((ability) => ({
      source: characterRace.name,
      ability,
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
    ...classFeatureDisplay.map((ability) => ({
      source: classDefinitions[classId].name,
      ability,
    })),
    ...(character.prestigeClass
      ? (
          dragonlancePrestigeClasses[character.prestigeClass]?.features ?? []
        ).map((ability) => ({
          source: dragonlancePrestigeClasses[character.prestigeClass!].name,
          ability,
        }))
      : []),
  ];
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
          </label>
          {character.prestigeClass && (
            <label className="finalized-prestige-field">
              Prestige Class:
              <span className="sheet-value">
                {dragonlancePrestigeClasses[character.prestigeClass]?.name ?? "Prestige Class"}
              </span>
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
        <div className="combat-weapon-row">
          {(["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const).map((slot) => {
            const attackPenalty =
              slot === "Main Weapon" || slot === "Off Hand Weapon"
                ? getTwoWeaponAttackPenalty(character, slot)
                : 0;
            const stats = character.equipment?.[slot]
              ? getEquippedWeaponStats(character, character.equipment[slot], attackPenalty, slot)
              : null;
            return (
              <div className={`combat-weapon-stat${stats ? "" : " unequipped-weapon"}`} key={slot}>
                <small>{slot.replace(" Weapon", "")}</small>
                {stats ? <>
                <strong title={[stats.attackSequenceNote, ...getCombatEffectDetails(character, "attack")].join("\n")}>
                  Attack {stats.attackSequence.map(formatModifier).join(" / ")}
                </strong>
                <span title={getCombatEffectDetails(character, "damage").join("\n") || undefined}>Damage {stats.damage}</span>
                <span>Crit {stats.critical}</span>
                {(stats.rangeIncrement || stats.reach) && <span className="weapon-distance">
                  {[stats.reach && `Reach ${stats.reach}`, stats.rangeIncrement && `${stats.rangeLabel} ${stats.rangeIncrement}`].filter(Boolean).join(" · ")}
                </span>}
                {stats.nonproficiencyPenalty < 0 && <span className="attack-penalty"
                  title={stats.nonproficiencyPenalties.map((entry) => `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency`).join("\n")}>
                  {stats.nonproficiencyPenalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`).join(", ")}
                </span>}
                </> : <span>Not equipped</span>}
              </div>
            );
          })}
        </div>
        <SpecialAttackStats character={character} />
        <CombatMovementLine character={character} />
      </Panel>
      <CastingSummary character={character} onOpenSpells={onOpenSpells} />
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
                      options={languageCatalog.filter(
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
        <div className="stat-grid">
          <ArmorClassStat character={character} />
          <Stat
            label="Initiative"
            value={formatModifier(abilityModifier(getEffectiveAbilityScore(character, "dex")) +
              getCombatEffectModifier(character, "checks") +
              getArmorNonproficiencyPenalties(character).reduce((total, entry) => total + entry.penalty, 0))}
            detail={[
              ...getArmorNonproficiencyPenalties(character).map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`),
              ...getCombatEffectDetails(character, "checks"),
            ]}
            title={[
              ...getArmorNonproficiencyPenalties(character).map((entry) =>
                `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency penalty to Dexterity checks`),
              ...getCombatEffectDetails(character, "checks"),
            ].join("\n") || undefined}
          />
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
        <div className="stat-grid saving-throws-grid">
          <SavingThrowStat character={character} save="fortitude" label="Fortitude" />
          <SavingThrowStat character={character} save="reflex" label="Reflex" />
          <SavingThrowStat character={character} save="will" label="Will" />
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
            ? " - 1 point remains, but cross-class ranks cost 2"
            : ""
        })`}
        className="skills-panel"
      >
        <p className="skill-use-legend">Checkbox = class skill. Trained = 1+ rank. Blank modifier = no check.
          Hover or focus a skill for ranks and restrictions.</p>
        <div className="list-grid">
          {skills.map((skill) => {
            const use = getSkillUse(character, skill);
            const modifier = getSkillCheckModifier(character, skill);
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
                      : "Cross-class skill: 2 points per rank; maximum ranks equal half of character level + 3."}
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
                        : "Cross-class - 2 pts"}
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
                    Modifiers include ability, whole ranks, racial bonuses, and applicable armor/shield, load, or nonproficiency check penalties.
                  </span>
                </span>
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
                  aria-label={`Remove rank from ${skill}`}
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
                  aria-label={`Add rank to ${skill}`}
                >
                  +
                </button>
              </span>}
              <strong title={getSkillTotalTooltip(character, skill)}>
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
              {Object.values(character.featSelections ?? {})
                .filter(Boolean)
                .map((featId) => {
                  const feat = featCatalog.find((entry) => entry.id === featId);
                  return feat ? (
                    <div className="chosen-feat" key={feat.id}>
                      <span className="chosen-feat-name tooltip-anchor">
                        {feat.name}
                        <span className="inline-tooltip" role="tooltip">
                          {feat.description}
                        </span>
                      </span>
                      <span className="chosen-feat-description">
                        {" "}
                        - {feat.description}
                      </span>
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
                  return (
                    <label key={slot.id}>
                      {slot.label}
                      <FeatPicker
                        selected={selected}
                        options={options}
                        selectedFeat={selectedFeat}
                        onChange={(featId) => onFeatChange(slot.id, featId)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="abilities-column">
            <h3>Special Abilities</h3>
            <div className="special-abilities-list">
              {specialAbilities.map(({ source, ability }, index) => (
                <div
                  className="special-ability"
                  key={`${source}-${ability}-${index}`}
                >
                  <strong>{ability}</strong>
                  {classFeatureDescriptions[ability] && (
                    <span> - {classFeatureDescriptions[ability]}</span>
                  )}
                  <span>({source})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <CharacterNotes notes={character.notes} onAddNote={onAddNote} />
    </div>
  );
}
