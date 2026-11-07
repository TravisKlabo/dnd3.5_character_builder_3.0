import { type SavingThrowCondition } from "../domain";

const conditionOptions: { value: SavingThrowCondition; label: string }[] = [
  { value: "fear", label: "Fear" },
  { value: "poison", label: "Poison" },
  { value: "disease", label: "Disease" },
  { value: "spell", label: "Spell or spell-like effect" },
  { value: "fey-spell-like", label: "Fey spell-like ability" },
  { value: "enchantment", label: "Enchantment" },
  { value: "compulsion", label: "Compulsion" },
  { value: "illusion", label: "Illusion" },
  { value: "sleep", label: "Magical sleep" },
  { value: "oath", label: "Failure would break an oath" },
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
      <summary>Apply situational bonuses</summary>
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
