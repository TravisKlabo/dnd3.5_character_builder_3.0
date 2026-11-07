import {
  type Character,
  type RangerFavoredEnemyChoice,
  type RangerFavoredEnemyLevel,
} from "../domain";
import {
  getBaseClassLevel,
  getRangerFavoredEnemyBonus,
  getRangerFavoredEnemyChoiceLevels,
  getRangerFavoredEnemyLabel,
  rangerFavoredEnemyCreatureTypes,
} from "../rules";

export function RangerFavoredEnemies({
  character,
  editableLevels,
  onChange,
}: {
  character: Character;
  editableLevels: RangerFavoredEnemyLevel[];
  onChange: (choices: RangerFavoredEnemyChoice[]) => void;
}) {
  const rangerLevel = getBaseClassLevel(character, "ranger");
  const levels = getRangerFavoredEnemyChoiceLevels(rangerLevel);
  if (!levels.length) return null;

  const allChoices = character.rangerFavoredEnemies ?? [];
  const choices = allChoices.filter((choice) =>
    levels.includes(choice.classLevel),
  );
  const choicesByLevel = new Map(
    choices.map((choice) => [choice.classLevel, choice] as const),
  );
  const updateChoice = (
    classLevel: RangerFavoredEnemyLevel,
    update: Partial<RangerFavoredEnemyChoice>,
  ) => {
    const current = choicesByLevel.get(classLevel) ?? {
      classLevel,
      kind: "creature" as const,
      target: "",
      bonusTargetLevel: classLevel,
    };
    const next = { ...current, ...update };
    onChange([
      ...allChoices.filter((choice) => choice.classLevel !== classLevel),
      next,
    ].sort((left, right) => left.classLevel - right.classLevel));
  };
  const availableBonusTargets = levels
    .map((classLevel) => choicesByLevel.get(classLevel))
    .filter((choice): choice is RangerFavoredEnemyChoice =>
      Boolean(choice?.target.trim()),
    );

  return (
    <section className="ranger-favored-enemies">
      <h3>Favored Enemies</h3>
      <p>
        Each new enemy starts with a +2 bonus. At levels 5, 10, 15, and 20,
        also assign that level's +2 increase to one listed enemy. Bonuses
        are recorded for reference and are not automatically applied.
      </p>
      {levels.map((classLevel) => {
        const choice = choicesByLevel.get(classLevel) ?? {
          classLevel,
          kind: "creature" as const,
          target: "",
          bonusTargetLevel: classLevel,
        };
        const editable = editableLevels.includes(classLevel);
        const targetRequiresSubtype = choice.kind === "creature" &&
          (choice.target === "Humanoid" || choice.target === "Outsider");
        const bonusTargets = availableBonusTargets.some(
          (target) => target.classLevel === classLevel,
        )
          ? availableBonusTargets
          : [...availableBonusTargets, ...(choice.target.trim() ? [choice] : [])];
        const bonusTargetIsAvailable = bonusTargets.some(
          (target) => target.classLevel === choice.bonusTargetLevel,
        );

        return (
          <div className="ranger-favored-enemy-choice" key={classLevel}>
            <strong>Ranger level {classLevel}</strong>
            <label>
              Enemy type
              <select
                aria-label={`Ranger level ${classLevel} enemy type`}
                value={choice.kind}
                disabled={!editable}
                onChange={(event) => {
                  const kind = event.currentTarget.value === "organization"
                    ? "organization"
                    : "creature";
                  updateChoice(classLevel, {
                    kind,
                    target: "",
                    subtype: undefined,
                  });
                }}
              >
                <option value="creature">Creature type</option>
                <option
                  value="organization"
                  disabled={character.ruleset === "core-35-srd"}
                >
                  Organization (Dragonlance)
                </option>
              </select>
            </label>
            {choice.kind === "organization" ? (
              <label>
                Organization
                <input
                  aria-label={`Ranger level ${classLevel} organization`}
                  value={choice.target}
                  maxLength={120}
                  placeholder="Enter organization name"
                  disabled={!editable}
                  onChange={(event) =>
                    updateChoice(classLevel, { target: event.currentTarget.value })
                  }
                />
              </label>
            ) : (
              <label>
                Creature type
                <select
                  aria-label={`Ranger level ${classLevel} creature type`}
                  value={choice.target}
                  disabled={!editable}
                  onChange={(event) =>
                    updateChoice(classLevel, {
                      target: event.currentTarget.value,
                      subtype: undefined,
                    })
                  }
                >
                  <option value="">Choose a creature type</option>
                  {rangerFavoredEnemyCreatureTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            )}
            {targetRequiresSubtype && (
              <label>
                {choice.target} subtype
                <input
                  aria-label={`Ranger level ${classLevel} associated subtype`}
                  value={choice.subtype ?? ""}
                  maxLength={80}
                  placeholder={choice.target === "Humanoid" ? "e.g. elf" : "e.g. lawful"}
                  disabled={!editable}
                  onChange={(event) =>
                    updateChoice(classLevel, {
                      subtype: event.currentTarget.value,
                    })
                  }
                />
              </label>
            )}
            {classLevel > 1 && (
              <label>
                Increase bonus against
                <select
                  aria-label={`Ranger level ${classLevel} bonus increase target`}
                  value={bonusTargetIsAvailable ? choice.bonusTargetLevel : ""}
                  disabled={!editable}
                  onChange={(event) => {
                    const targetLevel = levels.find(
                      (level) => String(level) === event.currentTarget.value,
                    );
                    if (targetLevel !== undefined)
                      updateChoice(classLevel, { bonusTargetLevel: targetLevel });
                  }}
                >
                  <option value="">Choose a favored enemy</option>
                  {bonusTargets.map((target) => (
                    <option key={target.classLevel} value={target.classLevel}>
                      Ranger level {target.classLevel}: {getRangerFavoredEnemyLabel(target)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {choice.target.trim() && (
              <span className="ranger-favored-enemy-bonus">
                Recorded bonus: +{getRangerFavoredEnemyBonus(choices, classLevel)}
              </span>
            )}
          </div>
        );
      })}
    </section>
  );
}
