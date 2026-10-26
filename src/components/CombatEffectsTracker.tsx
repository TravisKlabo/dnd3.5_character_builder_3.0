import { useState, type FormEvent } from "react";
import { type Character } from "../domain";
import { advanceCombatRound, type CombatEffect, type CombatEffectModifier, type CombatEffectModifiers } from "../combatEffects";

const createZeroModifiers = (): CombatEffectModifiers => ({
  attack: 0,
  armorClass: 0,
  saves: 0,
  damage: 0,
  checks: 0,
});

const modifierLabels: Record<CombatEffectModifier, string> = {
  attack: "Attack rolls",
  armorClass: "AC (all variants)",
  saves: "Saving throws",
  damage: "Weapon damage",
  checks: "Ability, skill, and grapple checks",
};

const presets = {
  custom: { label: "Custom effect", name: "", modifiers: createZeroModifiers() },
  bless: { label: "Bless", name: "Bless", modifiers: { ...createZeroModifiers(), attack: 1 } },
  shaken: {
    label: "Shaken",
    name: "Shaken",
    modifiers: { ...createZeroModifiers(), attack: -2, saves: -2, checks: -2 },
  },
  sickened: {
    label: "Sickened",
    name: "Sickened",
    modifiers: { ...createZeroModifiers(), attack: -2, saves: -2, damage: -2, checks: -2 },
  },
};

type PresetId = keyof typeof presets;

function isPresetId(value: string): value is PresetId {
  return Object.hasOwn(presets, value);
}

export function CombatEffectsTracker({
  character,
  enabled,
  onChange,
}: {
  character: Character;
  enabled: boolean;
  onChange: (round: number, effects: CombatEffect[]) => void;
}) {
  const [presetId, setPresetId] = useState<PresetId>("custom");
  const [name, setName] = useState("");
  const [modifiers, setModifiers] = useState<CombatEffectModifiers>(createZeroModifiers);
  const [duration, setDuration] = useState("3");
  const [error, setError] = useState("");
  const round = character.combatRound ?? 1;
  const effects = character.combatEffects ?? [];

  const selectPreset = (value: PresetId) => {
    const preset = presets[value];
    setPresetId(value);
    setName(preset.name);
    setModifiers({ ...preset.modifiers });
    setError("");
  };

  const addEffect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rounds = Number(duration);
    if (!name.trim() || name.trim().length > 80) {
      setError("Enter an effect name between 1 and 80 characters.");
      return;
    }
    if (!duration.trim() || !Number.isSafeInteger(rounds) || rounds < 0 ||
        Object.values(modifiers).some((value) => !Number.isSafeInteger(value) || Math.abs(value) > 1000)) {
      setError("Duration and modifiers must be whole numbers within the supported range.");
      return;
    }
    if (effects.length >= 100) {
      setError("The active-effect limit of 100 has been reached.");
      return;
    }
    onChange(round, [
      ...effects,
      { name: name.trim(), remainingRounds: rounds === 0 ? null : rounds, modifiers: { ...modifiers } },
    ]);
    selectPreset("custom");
    setDuration("3");
    setError("");
  };

  const advanceRound = () => {
    const updated = advanceCombatRound(character);
    onChange(updated.combatRound ?? round + 1, updated.combatEffects ?? []);
  };

  return (
    <section className="combat-effects" aria-label="Conditions and active effects">
      <div className="combat-effects-heading">
        <h3>Conditions &amp; effects</h3>
        <span>Round <strong>{round}</strong></span>
        <button type="button" className="quiet-button" disabled={!enabled || round >= Number.MAX_SAFE_INTEGER}
          onClick={advanceRound}>Next round</button>
      </div>
      {effects.length > 0 ? (
        <ul className="combat-effects-list" aria-label="Active effects">
          {effects.map((effect, index) => {
            const details = (Object.keys(modifierLabels) as CombatEffectModifier[])
              .filter((modifier) => effect.modifiers[modifier] !== 0)
              .map((modifier) => `${modifierLabels[modifier]} ${effect.modifiers[modifier] > 0 ? "+" : ""}${effect.modifiers[modifier]}`);
            return <li key={`${effect.name}-${index}`}>
              <div>
                <strong>{effect.name}</strong>
                <span>{effect.remainingRounds === null ? "Until removed" : `${effect.remainingRounds} round${effect.remainingRounds === 1 ? "" : "s"}`}</span>
                {details.length > 0 && <small>{details.join(" · ")}</small>}
              </div>
              <button type="button" className="quiet-button" disabled={!enabled}
                aria-label={`Remove ${effect.name}`} onClick={() => onChange(round, effects.filter((_, itemIndex) => itemIndex !== index))}>
                Remove
              </button>
            </li>;
          })}
        </ul>
      ) : <p className="combat-effects-empty">No active conditions or effects.</p>}
      <form className="combat-effects-form" onSubmit={addEffect}>
        <fieldset disabled={!enabled}>
          <legend>Add an effect</legend>
          <label>Quick preset
            <select value={presetId} onChange={(event) => {
              if (isPresetId(event.target.value)) selectPreset(event.target.value);
            }}>
              {Object.entries(presets).map(([id, preset]) =>
                <option key={id} value={id}>{preset.label}</option>)}
            </select>
          </label>
          <label>Effect name
            <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="combat-effects-modifiers">
            {(Object.keys(modifierLabels) as CombatEffectModifier[]).map((modifier) =>
              <label key={modifier}>{modifierLabels[modifier]}
                <input type="number" step="1" min="-1000" max="1000" value={modifiers[modifier]}
                  onChange={(event) => setModifiers((current) => ({
                    ...current,
                    [modifier]: Number(event.target.value),
                  }))} />
              </label>)}
          </div>
          <label>Duration (rounds; 0 = until removed)
            <input type="number" step="1" min="0" value={duration}
              onChange={(event) => setDuration(event.target.value)} />
          </label>
          <button type="submit" className="quiet-button">Add effect</button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
      <p className="combat-effects-hint">
        Effects apply to the listed totals. Enter only modifiers that stack; stacking types and situational limits are adjudicated manually.
        Advancing a round reduces timed effects and removes those that expire.
      </p>
    </section>
  );
}
