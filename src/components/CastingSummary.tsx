import { type Character, classDefinitions } from "../domain";
import { formatModifier, getArcaneSpellFailure, getCasterLevel, getDailySpellSlots,
  getBaseClassLevels, getSkillCheckModifier, getSkillTotalTooltip, getSpellcastingAbility, getSpellSaveDC,
  type CombatCastingContext } from "../rules";
import { CombatCastingContextControl, Panel } from "./shared";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";

export function CastingSummary({
  character,
  onOpenSpells,
  combatCastingContext,
  onCombatCastingContextChange,
  onMedallionOfFaithChange,
}: {
  character: Character;
  onOpenSpells: () => void;
  combatCastingContext?: CombatCastingContext;
  onCombatCastingContextChange: (context: CombatCastingContext | undefined) => void;
  onMedallionOfFaithChange: (present: boolean) => void;
}) {
  const casters = getBaseClassLevels(character).filter(({ classId }) => classDefinitions[classId].spellcasting);
  if (!casters.length) return null;
  const concentration = getSkillCheckModifier(character, "Concentration", undefined, undefined, combatCastingContext);
  return <Panel title="Spellcasting" className="casting-summary"
    headerActions={<button type="button" className="quiet-button" onClick={onOpenSpells}>Manage spells</button>}>
    <div className="casting-concentration" title={`${getSkillTotalTooltip(character, "Concentration", undefined, undefined, combatCastingContext)}\nConcentration is a skill check, not a caster-level check. Select a Combat Casting context to apply its +4 bonus; other conditional bonuses remain manual.`}>
      <span>Concentration <strong>{concentration === null ? "Unavailable" : formatModifier(concentration)}</strong></span>
      <small>CON + ranks + applicable modifiers</small>
    </div>
    <CombatCastingContextControl
      character={character}
      context={combatCastingContext}
      onChange={onCombatCastingContextChange}
    />
    {casters.map(({ classId, level }) => {
      const failure = getArcaneSpellFailure(character, classId);
      const levels = Array.from({ length: 10 }, (_, spellLevel) => spellLevel)
        .filter((spellLevel) => getDailySpellSlots(character, classId, level, spellLevel) > 0);
      const isDragonlanceCleric =
        character.ruleset !== "core-35-srd" && classId === "cleric";
      const medallionRequiredLevels = levels.filter((spellLevel) => spellLevel > 3);
      return <div className="casting-class-summary" key={classId} role="group" aria-label={`${classDefinitions[classId].name} casting summary`}>
        <div className="casting-class-heading">
          <strong>{classDefinitions[classId].name}</strong>
          <span title="Caster level from this class's progression, including selected Dragonlance High Sorcery lunar modifiers.">Caster level <strong>{getCasterLevel(classId, level, character)}</strong></span>
          <span title={getAbilityEquipmentBonus(character, getSpellcastingAbility(classId)).detail.join("\n")}>
            {getSpellcastingAbility(classId).toUpperCase()} {getEffectiveAbilityScore(character, getSpellcastingAbility(classId))}
          </span>
          {failure && <span title={failure.detail}>Arcane failure <strong>{failure.percent === null ? "Unknown" : `${failure.percent}%`}</strong></span>}
        </div>
        <div className="casting-dcs" aria-label="Base spell save DCs">
          {levels.length ? levels.map((spellLevel) => <span key={spellLevel}
            title="10 + spell level + casting ability modifier; school-specific DCs are shown in the spell list.">
            L{spellLevel} <strong>DC {getSpellSaveDC(character, classId, spellLevel)}</strong>
          </span>) : <span>No castable spell levels with current class level and ability score.</span>}
        </div>
          {isDragonlanceCleric && (
            <>
              <label className="casting-medallion-control">
                <input
                  type="checkbox"
                  checked={character.hasMedallionOfFaith ?? false}
                  onChange={(event) =>
                    onMedallionOfFaithChange(event.currentTarget.checked)
                  }
                />
                Medallion of Faith present
              </label>
              {medallionRequiredLevels.length > 0 && !character.hasMedallionOfFaith && (
                <p className="casting-rule-alert" role="alert">
                  Cleric spell levels {medallionRequiredLevels.join(", ")} cannot
                  be cast under Dragonlance rules until a Medallion of Faith is
                  marked present.
                </p>
              )}
              <p className="casting-rule-note" role="note">
                Dragonlance Clerics need a Medallion of Faith to cast spells above
                3rd level. If it is forcibly removed, the Cleric takes 2d4 divine
                damage with no save or spell resistance. The app tracks possession
                only; forced-removal damage remains manual (Dragonlance Campaign
                Setting, p. 46).
              </p>
            </>
          )}
        </div>;
    })}
    <p className="casting-summary-note">Current DCs and caster levels include selected Dragonlance High Sorcery lunar modifiers; other conditional effects remain manual.</p>
  </Panel>;
}
