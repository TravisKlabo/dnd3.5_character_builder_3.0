import {
  magicSchools,
  type Character,
  type MagicSchool,
} from "../domain";
import {
  getHighSorceryBarredSchoolOptions,
  getHighSorceryOrderSchools,
} from "../rules";

type HighSorceryChoiceChanges = Partial<
  Pick<
    Character,
    "highSorceryOrder" | "wizardSpecializationSchool" | "wizardBarredSchools"
  >
>;

export function HighSorceryChoices({
  order,
  specializationSchool,
  barredSchools,
  onChange,
}: {
  order: Character["highSorceryOrder"];
  specializationSchool: Character["wizardSpecializationSchool"];
  barredSchools: Character["wizardBarredSchools"];
  onChange: (changes: HighSorceryChoiceChanges) => void;
}) {
  const barredSchoolOptions = order
    ? getHighSorceryBarredSchoolOptions(order)
    : [];
  const specializationOptions = order
    ? getHighSorceryOrderSchools(order)
    : [];
  const selectedBarredSchools = barredSchools ?? [];
  const parseOrder = (value: string): Character["highSorceryOrder"] =>
    value === "white" || value === "red" || value === "black"
      ? value
      : undefined;
  const parseSchool = (value: string): MagicSchool | undefined =>
    magicSchools.find((school) => school === value);
  const updateBarredSchool = (index: number, school: MagicSchool | "") => {
    const updated = [...selectedBarredSchools];
    if (school) updated[index] = school;
    else updated.splice(index, 1);
    onChange({
      wizardBarredSchools: updated.length ? updated : undefined,
    });
  };

  return (
    <>
      <label className="high-sorcery-creation-field">
        High Sorcery order
        <select
          value={order ?? ""}
          onChange={(event) =>
            onChange({
              highSorceryOrder: parseOrder(event.target.value),
              wizardSpecializationSchool: undefined,
              wizardBarredSchools: undefined,
            })
          }
        >
          <option value="">Choose an order</option>
          <option value="white">White Robes (good)</option>
          <option value="red">Red Robes (neutral)</option>
          <option value="black">Black Robes (evil)</option>
        </select>
      </label>
      {order && (
        <>
          <label className="high-sorcery-creation-field">
            Specialist school
            <select
              value={specializationSchool ?? ""}
              onChange={(event) => onChange({
                wizardSpecializationSchool: parseSchool(event.target.value),
              })}
            >
              <option value="">Choose a specialist school</option>
              {specializationOptions.map((school) => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
          </label>
          {[0, 1].map((index) => (
            <label className="high-sorcery-creation-field" key={index}>
              {index === 0 ? "First" : "Second"} barred school
              <select
                value={selectedBarredSchools[index] ?? ""}
                disabled={index === 1 && !selectedBarredSchools[0]}
                onChange={(event) =>
                  updateBarredSchool(
                    index,
                    parseSchool(event.target.value) ?? "",
                  )
                }
              >
                <option value="">Choose a barred school</option>
                {barredSchoolOptions
                  .filter((school) =>
                    school === selectedBarredSchools[index] ||
                    !selectedBarredSchools.some(
                      (selectedSchool, selectedIndex) =>
                        selectedIndex !== index && selectedSchool === school,
                    ),
                  )
                  .map((school) => (
                    <option key={school} value={school}>{school}</option>
                  ))}
              </select>
            </label>
          ))}
        </>
      )}
    </>
  );
}
