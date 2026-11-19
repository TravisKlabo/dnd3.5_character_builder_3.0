import { magicSchools, type MagicSchool } from "../domain";

export function CoreWizardSpecializationChoice({
  school,
  onChange,
}: {
  school: MagicSchool | undefined;
  onChange: (school: MagicSchool | undefined) => void;
}) {
  return (
    <label>
      Core Wizard specialty school (optional; chosen at Wizard 1)
      <select
        value={school ?? ""}
        onChange={(event) =>
          onChange(
            magicSchools.find((candidate) => candidate === event.currentTarget.value),
          )
        }
      >
        <option value="">Generalist</option>
        {magicSchools.map((candidate) => (
          <option key={candidate} value={candidate}>{candidate}</option>
        ))}
      </select>
    </label>
  );
}
