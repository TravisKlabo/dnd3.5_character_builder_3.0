import { type SavingThrowCondition } from "../domain";

const conditionOptions: { value: SavingThrowCondition; label: string }[] = [
  { value: "fear", label: "Fear" },
  { value: "poison", label: "Poison" },
  { value: "spell", label: "Spell or spell-like effect" },
  { value: "enchantment", label: "Enchantment" },
  { value: "illusion", label: "Illusion" },
];

export function SavingThrowContextSelector({
  conditions,
  onChange,
}: {
  conditions: SavingThrowCondition[];
  onChange: (condition: SavingThrowCondition) => void;
}) {
  return (
    <details className="saving-throw-context">
      <summary>Apply situational racial bonuses</summary>
      <div role="group" aria-label="Saving throw conditions">
        {conditionOptions.map(({ value, label }) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={conditions.includes(value)}
              onChange={() => onChange(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </details>
  );
}
