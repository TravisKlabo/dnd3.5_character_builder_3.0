import { type CombatTargetType } from "../domain";

const targetOptions: { value: CombatTargetType; label: string }[] = [
  { value: "orc", label: "Orc or half-orc" },
  { value: "goblinoid", label: "Goblinoid" },
  { value: "kobold", label: "Kobold" },
  { value: "giant", label: "Giant (type)" },
];

export function CombatTargetContextSelector({
  targetTypes,
  onChange,
}: {
  targetTypes: CombatTargetType[];
  onChange: (targetType: CombatTargetType) => void;
}) {
  return (
    <details className="combat-target-context">
      <summary>Apply target-specific racial bonuses</summary>
      <div role="group" aria-label="Target creature types">
        {targetOptions.map(({ value, label }) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={targetTypes.includes(value)}
              onChange={() => onChange(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </details>
  );
}
