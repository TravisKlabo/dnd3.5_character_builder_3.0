import { type Character, classDefinitions } from "../domain";
import { formatModifier, getArcaneSpellFailure, getCasterLevel, getDailySpellSlots,
  getSkillCheckModifier, getSkillTotalTooltip, getSpellcastingAbility, getSpellSaveDC,
  type CombatCastingContext } from "../rules";
import { CombatCastingContextControl, Panel } from "./shared";
import { getAbilityEquipmentBonus, getEffectiveAbilityScore } from "../abilityEquipment";

export function CastingSummary({ character, onOpenSpells, combatCastingContext, onCombatCastingContextChange }: {
  character: Character;
  onOpenSpells: () => void;
  combatCastingContext?: CombatCastingContext;
  onCombatCastingContextChange: (context: CombatCastingContext | undefined) => void;
}) {
  const casters = character.classLevels.filter(({ classId }) => classDefinitions[classId].spellcasting);
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
      return <div className="casting-class-summary" key={classId} role="group" aria-label={`${classDefinitions[classId].name} casting summary`}>
        <div className="casting-class-heading">
          <strong>{classDefinitions[classId].name}</strong>
          <span title="Base caster level from this class's existing progression; conditional bonuses and unmodeled prestige advancement are manual.">Caster level <strong>{getCasterLevel(classId, level)}</strong></span>
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
      </div>;
    })}
    <p className="casting-summary-note">Base DCs and caster levels; school-specific DCs are shown per spell. Other conditional effects are manual.</p>
  </Panel>;
}
