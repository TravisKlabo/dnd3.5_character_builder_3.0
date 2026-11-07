import { lazy, Suspense } from "react";
import { type Character } from "../domain";
import {
  formatModifier,
  getEquippedWeaponStats,
  getEffectiveWeaponKey,
  getRangerCombatStyleStatus,
  getTowerShieldState,
  getTwoWeaponAttackPenalty,
  getWeaponCompatibilityWarning,
  getWeaponSizeHandling,
  type CombatAttackMode,
} from "../rules";
import {
  CombatAttackModeControl,
  CombatExpertiseControl,
  CombatMovementLine,
  Panel,
  PowerAttackControl,
  RangedAmmunitionControl,
  RangedDistanceControl,
  SpecialAttackStats,
  TargetDamageReductionControl,
} from "./shared";
import { getCombatEffectDetails } from "../combatEffects";
import { useCombatTargetContext } from "../combatTargetDefenseContext";

const CombatTargetContextSelector = lazy(() =>
  import("./CombatTargetContextSelector").then((module) => ({
    default: module.CombatTargetContextSelector,
  })),
);

export function CombatAttackPanel({
  character,
  rangedTargetDistanceFeet,
  onRangedTargetDistanceFeetChange,
  combatAttackMode,
  onCombatAttackModeChange,
  combatExpertiseAmount,
  onCombatExpertiseAmountChange,
  powerAttackAmount,
  onPowerAttackAmountChange,
  selectedRangedAmmunitionKey,
  onRangedAmmunitionChange,
}: {
  character: Character;
  rangedTargetDistanceFeet: number | undefined;
  onRangedTargetDistanceFeetChange: (distanceFeet: number | undefined) => void;
  combatAttackMode: CombatAttackMode;
  onCombatAttackModeChange: (mode: CombatAttackMode) => void;
  combatExpertiseAmount: number;
  onCombatExpertiseAmountChange: (amount: number) => void;
  powerAttackAmount: number;
  onPowerAttackAmountChange: (amount: number) => void;
  selectedRangedAmmunitionKey?: string;
  onRangedAmmunitionChange: (key: string | undefined) => void;
}) {
  const { value: targetContext, onChange: onTargetContextChange } = useCombatTargetContext();
  const rangerCombatStyle = getRangerCombatStyleStatus(character);

  return (
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
          character={character}
        />
      </Suspense>
      <RangedDistanceControl
        distanceFeet={rangedTargetDistanceFeet}
        onChange={onRangedTargetDistanceFeetChange}
      />
      <CombatAttackModeControl
        mode={combatAttackMode}
        onChange={onCombatAttackModeChange}
      />
      <TargetDamageReductionControl
        value={targetContext.damageReduction}
        onChange={(damageReduction) => onTargetContextChange({ ...targetContext, damageReduction })}
      />
      {rangerCombatStyle.warning && (
        <p className="combat-note" role="status">
          {rangerCombatStyle.warning}
        </p>
      )}
      <div className="combat-weapon-row">
        {(["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const).map((slot) => {
          const attackPenalty =
            combatAttackMode === "full-attack" &&
              (slot === "Main Weapon" || slot === "Off Hand Weapon")
              ? getTwoWeaponAttackPenalty(character, slot)
              : 0;
          const equippedWeapon = getEffectiveWeaponKey(character, slot);
          const sizeHandling = equippedWeapon ? getWeaponSizeHandling(character, equippedWeapon, slot) : null;
          const towerShieldCoverActive = getTowerShieldState(character).coverActive;
          const compatibilityWarning = equippedWeapon
            ? getWeaponCompatibilityWarning(character, equippedWeapon, slot)
            : null;
          const stats = equippedWeapon
            ? getEquippedWeaponStats(character, equippedWeapon, attackPenalty, slot, targetContext.targetTypes, rangedTargetDistanceFeet, targetContext.damageReduction, selectedRangedAmmunitionKey, combatExpertiseAmount, powerAttackAmount, combatAttackMode, targetContext.defense)
            : null;
          return (
            <div className={`combat-weapon-stat${equippedWeapon ? "" : " unequipped-weapon"}`} key={slot}>
              <small>{slot.replace(" Weapon", "")}</small>
              {stats ? <>
                <strong title={[stats.rangeStatusMessage, stats.damageReductionStatus?.message, stats.weaponSizeDetail, ...(stats.combatExpertisePenalty ? [`Combat Expertise ${formatModifier(stats.combatExpertisePenalty)} attack`] : []), ...(stats.powerAttackPenalty ? [`Power Attack ${formatModifier(stats.powerAttackPenalty)} attack`] : []), ...(stats.pointBlankShotBonus ? ["Point Blank Shot +1 attack and damage"] : []), ...(stats.weaponFocusBonus ? ["Weapon Focus +1"] : []), ...(stats.compositeBowStrengthRating !== undefined ? [`Composite bow Strength rating ${formatModifier(stats.compositeBowStrengthRating)}; positive Strength damage is capped at the rating`] : []), ...stats.racialAttackDetails, ...getCombatEffectDetails(character, "attack")].filter(Boolean).join("\n")}>
                  {stats.rangeOutOfRange ? "Out of range" : stats.attackActionWarning || targetContext.defense.cover === "total"
                    ? "Action unavailable"
                    : `Attack ${stats.attackSequence.map(formatModifier).join(" / ")}`}
                </strong>
                {stats.maximumRangeFeet !== undefined && <span>Maximum range {stats.maximumRangeFeet} ft.</span>}
                {stats.rangeStatusMessage && <span className={stats.rangeOutOfRange ? "combat-warning" : ""} role="status">{stats.rangeStatusMessage}</span>}
                {stats.attackActionWarning && <span className="combat-warning" role="status">{stats.attackActionWarning}</span>}
                {stats.manyshotArrowCount && <span>{stats.manyshotArrowCount} arrows use one Manyshot attack roll</span>}
                {stats.manyshotDamage && <span className="combat-note" role="status">
                  Weapon damage expression: {stats.manyshotDamage.damagePerArrow} per arrow. Apply damage reduction and other resistances separately against each arrow; add precision-based damage once. On a critical, only the first arrow deals critical damage.
                </span>}
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
                {stats.rapidShotPenalty < 0 && <span className="attack-penalty">
                  {formatModifier(stats.rapidShotPenalty)} Rapid Shot
                </span>}
                <span title={getCombatEffectDetails(character, "damage").join("\n") || undefined}>Damage {stats.damage}</span>
                {stats.sneakAttackDamage && (
                  <span className="combat-note" title={stats.sneakAttackNote}>
                    Potential Sneak Attack +{stats.sneakAttackDamage} (conditional; not included in Damage)
                  </span>
                )}
                {stats.sneakAttackWarning && (
                  <span className="combat-warning" role="status">{stats.sneakAttackWarning}</span>
                )}
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
  );
}
