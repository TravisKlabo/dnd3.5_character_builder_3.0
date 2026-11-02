import { type Character, type CombatTargetType } from "../domain";
import {
  type CombatTargetDefenseContext,
  hasActiveCombatFeat,
} from "../rules";
import { useCombatTargetContext } from "../combatTargetDefenseContext";

const targetOptions: { value: CombatTargetType; label: string }[] = [
  { value: "orc", label: "Orc or half-orc" },
  { value: "goblinoid", label: "Goblinoid" },
  { value: "kobold", label: "Kobold" },
  { value: "giant", label: "Giant (type)" },
];

function TargetDefenseFields({
  character,
}: {
  character: Character;
}) {
  const { value: targetContext, onChange } = useCombatTargetContext();
  const { defense } = targetContext;
  const hasImprovedPreciseShot = hasActiveCombatFeat(character, "improved-precise-shot");
  return (
    <div className="combat-target-defense-control">
      <label>
        Target cover
        <select
          aria-label="Target cover"
          value={defense.cover}
          onChange={(event) => onChange({ ...targetContext, defense: { ...defense, cover: event.currentTarget.value as CombatTargetDefenseContext["cover"] } })}
        >
          <option value="none">None</option>
          <option value="less-than-total">Less than total</option>
          <option value="total">Total cover</option>
        </select>
      </label>
      <label>
        Target concealment
        <select
          aria-label="Target concealment"
          value={defense.concealment}
          onChange={(event) => onChange({ ...targetContext, defense: { ...defense, concealment: event.currentTarget.value as CombatTargetDefenseContext["concealment"] } })}
        >
          <option value="none">None</option>
          <option value="less-than-total">Less than total</option>
          <option value="total">Total concealment</option>
        </select>
      </label>
      {defense.cover === "total" && <small className="combat-warning" role="status">Target has total cover; attacks cannot reach it.</small>}
      {defense.cover === "less-than-total" && <small role="status">{hasImprovedPreciseShot
        ? "Improved Precise Shot ignores this cover AC bonus on ranged attacks."
        : "Target has less-than-total cover; its cover AC bonus applies."}</small>}
      {defense.concealment === "total" && <small role="status">Target has total concealment; the 50% miss chance applies.</small>}
      {defense.concealment === "less-than-total" && <small role="status">{hasImprovedPreciseShot
        ? "Improved Precise Shot ignores this concealment miss chance on ranged attacks."
        : "Target has less-than-total concealment; its miss chance applies."}</small>}
      <small>Session-only context; concealment rolls and nonstandard cover bonuses remain manual.</small>
    </div>
  );
}

export function CombatTargetDefenseControl({
  character,
}: {
  character: Character;
}) {
  return <TargetDefenseFields character={character} />;
}

export function CombatTargetContextSelector({
  character,
}: {
  character: Character;
}) {
  const { value: targetContext, onChange } = useCombatTargetContext();
  return (
    <>
      <details className="combat-target-context">
        <summary>Apply target-specific racial bonuses</summary>
        <div role="group" aria-label="Target creature types">
          {targetOptions.map(({ value, label }) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={targetContext.targetTypes.includes(value)}
                onChange={() => onChange({
                  ...targetContext,
                  targetTypes: targetContext.targetTypes.includes(value)
                    ? targetContext.targetTypes.filter((entry) => entry !== value)
                    : [...targetContext.targetTypes, value],
                })}
              />
              {label}
            </label>
          ))}
        </div>
      </details>
      <TargetDefenseFields character={character} />
    </>
  );
}
