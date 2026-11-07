import { useState } from "react";
import { classDefinitions, type Character, getTotalHitDice } from "../domain";
import { type HitPointAction, getCurrentHitPoints, getHitPointStatus, getMaximumHitPoints } from "../hitPoints";

export function HitPointTracker({ character, enabled, onAction }: {
  character: Character;
  enabled: boolean;
  onAction: (action: HitPointAction, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const hitPointRolls = character.hitPointRolls ?? [];
  const apply = (action: HitPointAction) => {
    const value = Number(amount);
    if (!amount.trim() || !Number.isSafeInteger(value) || value < 0 ||
      (value === 0 && action !== "temporary")) {
      setError("Enter a positive whole number (zero is allowed only for Set temp HP).");
      return;
    }
    setError("");
    onAction(action, value);
  };
  return <div className="hp-tracker" role="group" aria-label="Hit point tracker">
    <div className="hp-tracker-summary">
      <strong>HP {getCurrentHitPoints(character)} / {getMaximumHitPoints(character)}</strong>
      <span>Temp {character.temporaryHitPoints ?? 0}</span>
      <span>Nonlethal {character.nonlethalDamage ?? 0}</span>
      <span role="status">{getHitPointStatus(character)}</span>
    </div>
    <fieldset disabled={!enabled}>
      <legend className="hp-tracker-hint">{enabled ? "Apply damage after DR/resistance. Heal uses magical healing rules." : "HP controls are available after setup and outside level-up drafts."}</legend>
      <label>HP amount<input type="number" min="0" step="1" value={amount}
        onChange={(event) => { setAmount(event.target.value); setError(""); }}
        aria-invalid={Boolean(error)} aria-describedby={error ? "hp-amount-error" : undefined} /></label>
      <div className="hp-tracker-actions">
        <button type="button" onClick={() => apply("damage")}>Damage</button>
        <button type="button" onClick={() => apply("heal")}>Heal</button>
        <button type="button" onClick={() => apply("nonlethal")}>Nonlethal damage</button>
        <button type="button" onClick={() => apply("recoverNonlethal")}>Recover nonlethal</button>
        <button type="button" title="Replaces the temporary HP pool; does not stack sources." onClick={() => apply("temporary")}>Set temp HP</button>
      </div>
    </fieldset>
    {error && <p id="hp-amount-error" role="alert">{error}</p>}
    <p className="hp-tracker-hint">Use Save to keep changes. Track stabilization, ongoing effects, and ability exceptions manually. Temp HP replaces the pool, not stacks.</p>
    <details className="hp-roll-history">
      <summary>HP gains by level</summary>
      {hitPointRolls.length ? (
        <>
          {hitPointRolls.length < getTotalHitDice(character) && (
            <p className="hp-tracker-hint">
              Earlier or racial Hit Dice are not included; their old rolls cannot be recovered from the saved total.
            </p>
          )}
          <table aria-label="HP gained by level">
            <thead>
              <tr><th>Level</th><th>Class</th><th>Roll</th><th>HP increase</th></tr>
            </thead>
            <tbody>
              {hitPointRolls.map((entry) => (
                <tr key={`${entry.characterLevel}-${entry.classId}-${entry.classLevel}`}>
                  <td>{entry.characterLevel}</td>
                  <td>{classDefinitions[entry.classId].name} {entry.classLevel}</td>
                  <td>{entry.roll}/{entry.hitDie}</td>
                  <td>+{entry.hpIncrease}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="hp-tracker-hint">Per-level rolls will be recorded from the next Hit Die gained.</p>
      )}
    </details>
  </div>;
}
