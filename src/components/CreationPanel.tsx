import { type Character, type ClassId, type AbilityName, raceDefinitions, classDefinitions, deityDefinitions, dragonlancePrestigeClasses, abilityModifier } from "../domain";
import { useState, useEffect } from "react";
import { isClassAlignmentAllowed, alignmentDistance, isPrestigeClassEligible, getClassAlignmentRestriction, isHighSorceryAlignmentAllowed, getSpentSkillPoints, getAvailableSkillCount, getFeatSlots, getAvailableLanguages, hasSpellLevelAtClassLevel, getDailySpellSlots, getClassSpellSelections, getKnownSpellLimit, getWizardFreeSpellAllowance, formatRaceDetails, formatClassDetails, formatPrestigeClassDetails, getRacialLanguages, getLanguageBonusSlots, formatModifier } from "../rules";
import { alignmentDescriptions, abilityNames, pointBuyCosts, abilities } from "../data/characterCatalog";
import { getClassSpells } from "../data/spellCatalog";
import { Panel } from "./shared";
import { LanguagePicker } from "./pickers";
import { handleScrollableMenuKeyDown } from "../menuNavigation";

export function CreationPanel({
  draft,
  open,
  locked,
  method,
  rolledScores,
  onRolledScoresChange,
  rolledAssignments,
  onRolledAssignmentsChange,
  onToggle,
  onMethodChange,
  onChange,
  onClassChange,
  onRaceChange,
  ruleset,
  onRulesetChange,
  onAbilityChange,
  onCreate,
}: {
  draft: Character;
  open: boolean;
  locked: boolean;
  method: "roll" | "pointBuy" | "manual";
  rolledScores: number[] | null;
  onRolledScoresChange: (scores: number[]) => void;
  rolledAssignments: number[] | null;
  onRolledAssignmentsChange: (assignments: number[]) => void;
  onToggle: () => void;
  onMethodChange: (method: "roll" | "pointBuy" | "manual") => void;
  onChange: <Key extends keyof Character>(
    key: Key,
    value: Character[Key],
  ) => void;
  onClassChange: (classId: ClassId) => void;
  onRaceChange: (race: string) => void;
  ruleset:
    "core-35-srd" | "dragonlance-user-pack" | "dragonlance-monster-classes";
  onRulesetChange: (
    ruleset:
      "core-35-srd" | "dragonlance-user-pack" | "dragonlance-monster-classes",
  ) => void;
  onAbilityChange: (ability: AbilityName, value: number) => void;
  onCreate: () => void;
}) {
  const [raceMenuOpen, setRaceMenuOpen] = useState(false);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [prestigeClassMenuOpen, setPrestigeClassMenuOpen] = useState(false);
  const [alignmentMenuOpen, setAlignmentMenuOpen] = useState(false);
  const [deityMenuOpen, setDeityMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState({
    race: "",
    class: "",
    prestige: "",
    alignment: "",
    deity: "",
  });
  const [menuTooltip, setMenuTooltip] = useState({
    field: "",
    description: "",
  });
  const toggleMenu = (menu: "race" | "class" | "prestige" | "alignment" | "deity") => {
    const nextOpen =
      menu === "race"
        ? !raceMenuOpen
        : menu === "class"
          ? !classMenuOpen
          : menu === "prestige"
            ? !prestigeClassMenuOpen
            : menu === "alignment"
              ? !alignmentMenuOpen
              : !deityMenuOpen;
    setRaceMenuOpen(menu === "race" && nextOpen);
    setClassMenuOpen(menu === "class" && nextOpen);
    setPrestigeClassMenuOpen(menu === "prestige" && nextOpen);
    setAlignmentMenuOpen(menu === "alignment" && nextOpen);
    setDeityMenuOpen(menu === "deity" && nextOpen);
    if (!nextOpen) setMenuTooltip({ field: "", description: "" });
    if (nextOpen) setMenuQuery((current) => ({ ...current, [menu]: "" }));
  };
  const matchesMenuQuery = (label: string, menu: keyof typeof menuQuery) =>
    label.toLowerCase().includes(menuQuery[menu].toLowerCase().trim());
  useEffect(() => {
    const closeMenus = () => {
      setRaceMenuOpen(false);
      setClassMenuOpen(false);
      setPrestigeClassMenuOpen(false);
      setAlignmentMenuOpen(false);
      setDeityMenuOpen(false);
      setMenuTooltip({ field: "", description: "" });
    };
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest(".race-field, .class-field")
      ) {
        closeMenus();
      }
    };
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, []);
  const classId = draft.classLevels[0].classId;
  const selectedRace =
    raceDefinitions[draft.race.toLowerCase().replaceAll(" ", "-")] ??
    raceDefinitions.human;
  const availableClasses = Object.values(classDefinitions).filter(
    (definition) =>
      (definition.source === "core-35-srd" || ruleset !== "core-35-srd") &&
      (!draft.alignment ||
        isClassAlignmentAllowed(definition.id, draft.alignment) ||
        definition.id === classId),
  );
  const availableAlignments = Object.keys(alignmentDescriptions).filter((alignment) =>
    isClassAlignmentAllowed(classId, alignment),
  );
  const availableDeities = deityDefinitions.filter(
    (deity) =>
      deity.source ===
        (ruleset === "core-35-srd"
          ? "core-35-srd"
          : "dragonlance-user-pack") &&
      (classId === "cleric"
        ? alignmentDistance(draft.alignment, deity.alignment) <= 1
        : classId === "paladin"
          ? deity.alignment === "Lawful Good"
          : true),
  );
          const dragonlanceRuleset = ruleset !== "core-35-srd";
  const availablePrestigeClasses = Object.values(dragonlancePrestigeClasses).filter(
    (definition) =>
      definition.source ===
        (ruleset === "core-35-srd"
          ? "core-35-srd"
          : "dragonlance-user-pack") &&
      !["white-robed-wizard", "red-robed-wizard", "black-robed-wizard"].includes(
        definition.id,
      ) &&
      isPrestigeClassEligible(definition, classId, draft.race),
  );
  const raceOptions = Object.values(raceDefinitions).filter(
    (race) =>
      (race.source === "core-35-srd" ||
        race.source === "dragonlance-user-pack") &&
      (ruleset === "dragonlance-monster-classes" || !race.levelAdjustment),
  );
  const pointBuyTotal = abilityNames.reduce(
    (total, ability) => total + (pointBuyCosts[draft.abilities[ability]] ?? 0),
    0,
  );
  const rollAbilities = () => {
    const scores = abilityNames.map(() => {
      const dice = [1, 2, 3, 4]
        .map(() => Math.floor(Math.random() * 6) + 1)
        .sort((a, b) => a - b);
      return dice[1] + dice[2] + dice[3];
    });
    onRolledScoresChange(scores);
    onRolledAssignmentsChange(abilityNames.map((_, index) => index));
    onAbilityChange(
      "str",
      scores[0] + (selectedRace.abilityModifiers.str ?? 0),
    );
    abilityNames
      .slice(1)
      .forEach((ability, index) =>
        onAbilityChange(
          ability,
          scores[index + 1] + (selectedRace.abilityModifiers[ability] ?? 0),
        ),
      );
  };
  const assignRolledScore = (ability: AbilityName, poolIndex: number) => {
    if (!rolledScores || !rolledAssignments) return;
    const abilityIndex = abilityNames.indexOf(ability);
    const currentPoolIndex = rolledAssignments[abilityIndex];
    const otherAbilityIndex = rolledAssignments.indexOf(poolIndex);
    const nextAssignments = [...rolledAssignments];
    nextAssignments[abilityIndex] = poolIndex;
    if (otherAbilityIndex !== -1 && otherAbilityIndex !== abilityIndex) {
      nextAssignments[otherAbilityIndex] = currentPoolIndex;
    }
    onRolledAssignmentsChange(nextAssignments);
    onAbilityChange(
      ability,
      rolledScores[poolIndex] + (selectedRace.abilityModifiers[ability] ?? 0),
    );
    if (otherAbilityIndex !== -1 && otherAbilityIndex !== abilityIndex) {
      const otherAbility = abilityNames[otherAbilityIndex];
      onAbilityChange(
        otherAbility,
        rolledScores[currentPoolIndex] +
          (selectedRace.abilityModifiers[otherAbility] ?? 0),
      );
    }
  };
  const creationErrors: string[] = [];
  if (!draft.name.trim()) creationErrors.push("Enter a character name.");
  if (!draft.player.trim()) creationErrors.push("Enter a player name.");
  if (!draft.alignment) creationErrors.push("Choose an alignment.");
  if (!isClassAlignmentAllowed(classId, draft.alignment))
    creationErrors.push(
      `${classDefinitions[classId].name} ${getClassAlignmentRestriction(classId)}.`,
    );
  const selectedDeity = deityDefinitions.find((deity) => deity.id === draft.deity);
  if ((classId === "cleric" || classId === "paladin") && !selectedDeity)
    creationErrors.push(`${classDefinitions[classId].name} characters must choose a deity.`);
  if (selectedDeity && classId === "cleric" && alignmentDistance(draft.alignment, selectedDeity.alignment) > 1)
    creationErrors.push(`Cleric alignment must be within one step of ${selectedDeity.name}.`);
  if (selectedDeity && classId === "paladin" && selectedDeity.alignment !== "Lawful Good")
    creationErrors.push("Paladins must choose a Lawful Good deity.");
    if (dragonlanceRuleset && draft.highSorceryOrder &&
      (classId === "wizard" || classId === "sorcerer") &&
      !isHighSorceryAlignmentAllowed(draft.highSorceryOrder, draft.alignment))
    creationErrors.push("That High Sorcery order is not legal for this alignment.");
  if (method === "pointBuy" && pointBuyTotal !== 25)
    creationErrors.push("Point buy must use exactly 25 points.");
  if (
    method === "roll" &&
    (!rolledScores ||
      rolledScores.length !== abilityNames.length ||
      !rolledAssignments ||
      rolledAssignments.length !== abilityNames.length ||
      new Set(rolledAssignments).size !== abilityNames.length)
  )
    creationErrors.push("Roll and assign all six ability scores.");
  if (
    method === "manual" &&
    abilityNames.some((ability) => {
      const score = draft.abilities[ability];
      return score < 3 || score > 18;
    })
  )
    creationErrors.push("Set every manual ability score between 3 and 18.");
  if (getSpentSkillPoints(draft) !== getAvailableSkillCount(draft))
    creationErrors.push("Spend all available starting skill points.");
  if (getFeatSlots(draft).some((slot) => !draft.featSelections?.[slot.id]))
    creationErrors.push("Select every required starting feat.");
  if (!(draft.languages ?? []).length)
    creationErrors.push("Select at least one starting language.");
  const availableLanguageSet = new Set(getAvailableLanguages(ruleset));
  const invalidLanguages = (draft.languages ?? []).filter(
    (language) => !availableLanguageSet.has(language),
  );
  if (invalidLanguages.length)
    creationErrors.push(
      `Remove languages unavailable in this ruleset: ${invalidLanguages.join(", ")}.`,
    );
  if (!Object.values(draft.inventory).some((quantity) => quantity > 0))
    creationErrors.push("Select at least one piece of starting equipment.");
  const spellcastingLevels = draft.classLevels.filter(
    (level) => classDefinitions[level.classId as ClassId]?.spellcasting,
  );
  for (const spellcastingLevel of spellcastingLevels) {
    const spellcastingClass = classDefinitions[spellcastingLevel.classId];
    if (spellcastingClass.id === "wizard") {
      const allowance = getWizardFreeSpellAllowance(draft);
      if (allowance.remaining > 0) creationErrors.push(`Choose ${allowance.remaining} more free first-level Wizard starting spells. Copied spells do not count toward this allowance.`);
      continue;
    }
    const learningMode =
      spellcastingClass.id === "bard" || spellcastingClass.id === "sorcerer"
          ? "Spells Known"
          : "Prepared Spells";
    const classSpells = getClassSpells(spellcastingClass.id);
    const selectedSpells = getClassSpellSelections(draft,
      learningMode === "Prepared Spells" ? "preparedSpells" : "knownSpells")[spellcastingClass.id] ?? [];
    const availableLevels = Array.from({ length: 10 }, (_, level) => level).filter(
      (level) => hasSpellLevelAtClassLevel(spellcastingClass.id, spellcastingLevel.level, level),
    );
    availableLevels.forEach((level) => {
      const required =
        learningMode === "Spells Known"
          ? getKnownSpellLimit(draft, spellcastingClass.id, spellcastingLevel.level, level)
          : getDailySpellSlots(draft, spellcastingClass.id, spellcastingLevel.level, level);
      const selected = selectedSpells.filter(
        (name) => classSpells.some((spell) => spell.level === level && spell.name === name),
      ).length;
      if (selected < required)
        creationErrors.push(
          `Select ${required} level ${level} ${spellcastingClass.name} ${learningMode.toLowerCase()} spell${required === 1 ? "" : "s"}.`,
        );
    });
  }
  return (
    <section className={`creation-area ${locked ? "creation-locked" : ""}`}>
      <div className="creation-heading">
        <div>
          <p className="eyebrow">Character setup</p>
          <h2>Create Character</h2>
          <span>
            {locked
              ? "Character creation is locked after confirmation."
              : "Choose your starting identity and ability generation method."}
          </span>
        </div>
        <div className="ruleset-control">
          {locked ? (
            <span className="ruleset-value">
              {ruleset === "core-35-srd"
                ? "Core 3.5 SRD"
                : ruleset === "dragonlance-monster-classes"
                  ? "Dragonlance (Monster Classes Allowed)"
                  : "Dragonlance"}
            </span>
          ) : (
            <select
              value={ruleset}
              onChange={(event) =>
                onRulesetChange(event.target.value as typeof ruleset)
              }
            >
              <option value="core-35-srd">Core 3.5 SRD</option>
              <option value="dragonlance-user-pack">Dragonlance</option>
              <option value="dragonlance-monster-classes">
                Dragonlance (Monster Classes Allowed)
              </option>
            </select>
          )}
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={onToggle}
          disabled={locked}
        >
          {locked ? "Locked" : open ? "Close Setup" : "Open Setup"}
        </button>
      </div>
      {open && !locked && (
        <Panel title="Starting Details" className="creation-panel">
          <div className="creation-grid">
            <label>
              Character name
              <input
                value={draft.name}
                onChange={(event) => onChange("name", event.target.value)}
              />
            </label>
            <label>
              Player
              <input
                value={draft.player}
                onChange={(event) => onChange("player", event.target.value)}
              />
            </label>
            <label>
              Gender
              <select value={draft.gender ?? ""} onChange={(event) => onChange("gender", event.target.value as Character["gender"])}>
                <option value="">Not specified</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label>Age<input value={draft.age ?? ""} onChange={(event) => onChange("age", event.target.value)} placeholder="30 years or about 30" /></label>
            <label>
              Height
              <input value={draft.height ?? ""} onChange={(event) => onChange("height", event.target.value)} placeholder="5 ft 7 in or 170 cm" />
            </label>
            <label>Weight<input value={draft.weight ?? ""} onChange={(event) => onChange("weight", event.target.value)} placeholder="180 lb. or 82 kg" /></label>
            <label>Hair color<input value={draft.hairColor ?? ""} onChange={(event) => onChange("hairColor", event.target.value)} /></label>
            <label>Eye color<input value={draft.eyeColor ?? ""} onChange={(event) => onChange("eyeColor", event.target.value)} /></label>
            <label>Skin color<input value={draft.skinColor ?? ""} onChange={(event) => onChange("skinColor", event.target.value)} /></label>
            <label className="race-field">
              Race
              <button
                className="race-trigger"
                type="button"
                aria-expanded={raceMenuOpen}
                onClick={() => toggleMenu("race")}
              >
                {draft.race}
                <span aria-hidden="true">▾</span>
              </button>
              {raceMenuOpen && (
                <div
                  className="race-menu"
                  role="listbox"
                  aria-label="Race choices"
                  onKeyDown={handleScrollableMenuKeyDown}
                >
                  <div className="menu-search">
                    <input
                      autoFocus
                      value={menuQuery.race}
                      onChange={(event) =>
                        setMenuQuery({ ...menuQuery, race: event.target.value })
                      }
                      placeholder="Search races"
                      aria-label="Search races"
                    />
                  </div>
                  {raceOptions
                    .filter((race) => matchesMenuQuery(race.name, "race"))
                    .map((race) => (
                      <button
                        className={`race-option ${draft.race === race.name ? "selected" : ""}`}
                        key={race.id}
                        type="button"
                        role="option"
                        aria-selected={draft.race === race.name}
                        title={`${formatRaceDetails(race)}${race.levelAdjustment ? `; Level adjustment +${race.levelAdjustment}` : ""}`}
                        onMouseEnter={() =>
                          setMenuTooltip({
                            field: "race",
                            description: `${formatRaceDetails(race)}${race.levelAdjustment ? `; Level adjustment +${race.levelAdjustment}` : ""}`,
                          })
                        }
                        onFocus={() =>
                          setMenuTooltip({
                            field: "race",
                            description: `${formatRaceDetails(race)}${race.levelAdjustment ? `; Level adjustment +${race.levelAdjustment}` : ""}`,
                          })
                        }
                        onMouseLeave={() =>
                          setMenuTooltip({ field: "", description: "" })
                        }
                        onBlur={() =>
                          setMenuTooltip({ field: "", description: "" })
                        }
                        onClick={() => {
                          onRaceChange(race.name);
                          setRaceMenuOpen(false);
                          setMenuTooltip({ field: "", description: "" });
                        }}
                      >
                        <span>{race.name}</span>
                      </button>
                    ))}
                </div>
              )}
              {menuTooltip.field === "race" && (
                <span className="creation-menu-tooltip" role="tooltip">
                  {menuTooltip.description}
                </span>
              )}
            </label>
            <label>
              Class
              <div className="class-field">
                <button
                  className="race-trigger"
                  type="button"
                  aria-expanded={classMenuOpen}
                  onClick={() => toggleMenu("class")}
                >
                  {classDefinitions[classId].name}
                  <span aria-hidden="true">▾</span>
                </button>
                {classMenuOpen && (
                  <div
                    className="race-menu"
                    role="listbox"
                    aria-label="Class choices"
                    onKeyDown={handleScrollableMenuKeyDown}
                  >
                    <div className="menu-search">
                      <input
                        autoFocus
                        value={menuQuery.class}
                        onChange={(event) =>
                          setMenuQuery({
                            ...menuQuery,
                            class: event.target.value,
                          })
                        }
                        placeholder="Search classes"
                        aria-label="Search classes"
                      />
                    </div>
                    {availableClasses
                      .filter((definition) =>
                        matchesMenuQuery(definition.name, "class"),
                      )
                      .map((definition) => (
                        <button
                          className={`race-option ${classId === definition.id ? "selected" : ""}`}
                          key={definition.id}
                          type="button"
                          role="option"
                          aria-selected={classId === definition.id}
                          title={formatClassDetails(definition)}
                          onMouseEnter={() =>
                            setMenuTooltip({
                              field: "class",
                              description: formatClassDetails(definition),
                            })
                          }
                          onFocus={() =>
                            setMenuTooltip({
                              field: "class",
                              description: formatClassDetails(definition),
                            })
                          }
                          onMouseLeave={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onBlur={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onClick={() => {
                            onClassChange(definition.id);
                            setClassMenuOpen(false);
                            setMenuTooltip({ field: "", description: "" });
                          }}
                        >
                          <span>{definition.name}</span>
                        </button>
                      ))}
                  </div>
                )}
                {menuTooltip.field === "class" && (
                  <span className="creation-menu-tooltip" role="tooltip">
                    {menuTooltip.description}
                  </span>
                )}
              </div>
            </label>
            <label className="prestige-creation-field">
              Prestige Class
              <div className="class-field menu-left">
                <button
                  className="race-trigger"
                  type="button"
                  aria-expanded={prestigeClassMenuOpen}
                  onClick={() => toggleMenu("prestige")}
                >
                  {draft.prestigeClass
                    ? dragonlancePrestigeClasses[draft.prestigeClass].name
                    : "None"}
                  <span aria-hidden="true">▾</span>
                </button>
                {prestigeClassMenuOpen && (
                  <div
                    className="race-menu"
                    role="listbox"
                    aria-label="Prestige class choices"
                    onKeyDown={handleScrollableMenuKeyDown}
                  >
                    <div className="menu-search">
                      <input
                        autoFocus
                        value={menuQuery.prestige}
                        onChange={(event) =>
                          setMenuQuery({
                            ...menuQuery,
                            prestige: event.target.value,
                          })
                        }
                        placeholder="Search prestige classes"
                        aria-label="Search prestige classes"
                      />
                    </div>
                    <button
                      className={`race-option ${!draft.prestigeClass ? "selected" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={!draft.prestigeClass}
                      title="Optional prestige class; no prestige-class prerequisites or features are applied."
                      onMouseEnter={() =>
                        setMenuTooltip({
                          field: "prestige",
                          description:
                            "Optional prestige class; no prestige-class prerequisites or features are applied.",
                        })
                      }
                      onFocus={() =>
                        setMenuTooltip({
                          field: "prestige",
                          description:
                            "Optional prestige class; no prestige-class prerequisites or features are applied.",
                        })
                      }
                      onMouseLeave={() =>
                        setMenuTooltip({ field: "", description: "" })
                      }
                      onBlur={() =>
                        setMenuTooltip({ field: "", description: "" })
                      }
                      onClick={() => {
                        onChange("prestigeClass", undefined);
                        onChange("highSorceryOrder", undefined);
                        setPrestigeClassMenuOpen(false);
                        setMenuTooltip({ field: "", description: "" });
                      }}
                    >
                      <span>None</span>
                    </button>
                    {availablePrestigeClasses
                      .filter((definition) =>
                        matchesMenuQuery(definition.name, "prestige"),
                      )
                      .map((definition) => (
                        <button
                          className={`race-option ${draft.prestigeClass === definition.id ? "selected" : ""}`}
                          key={definition.id}
                          type="button"
                          role="option"
                          aria-selected={draft.prestigeClass === definition.id}
                          title={formatPrestigeClassDetails(definition)}
                          onMouseEnter={() =>
                            setMenuTooltip({
                              field: "prestige",
                              description:
                                formatPrestigeClassDetails(definition),
                            })
                          }
                          onFocus={() =>
                            setMenuTooltip({
                              field: "prestige",
                              description:
                                formatPrestigeClassDetails(definition),
                            })
                          }
                          onMouseLeave={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onBlur={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onClick={() => {
                            onChange("prestigeClass", definition.id);
                            if (definition.id !== "wizard-of-high-sorcery")
                              onChange("highSorceryOrder", undefined);
                            setPrestigeClassMenuOpen(false);
                            setMenuTooltip({ field: "", description: "" });
                          }}
                        >
                          <span>{definition.name}</span>
                        </button>
                      ))}
                  </div>
                )}
                {menuTooltip.field === "prestige" && (
                  <span className="creation-menu-tooltip" role="tooltip">
                    {menuTooltip.description}
                  </span>
                )}
              </div>
            </label>
            <label className="alignment-creation-field">
              Alignment
              <div className="class-field menu-right">
                <button
                  className="race-trigger"
                  type="button"
                  aria-expanded={alignmentMenuOpen}
                  onClick={() => toggleMenu("alignment")}
                >
                  {draft.alignment || "No alignment selected"}
                  <span aria-hidden="true">▾</span>
                </button>
                {alignmentMenuOpen && (
                  <div
                    className="race-menu"
                    role="listbox"
                    aria-label="Alignment choices"
                    onKeyDown={handleScrollableMenuKeyDown}
                  >
                    <div className="menu-search">
                      <input
                        autoFocus
                        value={menuQuery.alignment}
                        onChange={(event) =>
                          setMenuQuery({
                            ...menuQuery,
                            alignment: event.target.value,
                          })
                        }
                        placeholder="Search alignments"
                        aria-label="Search alignments"
                      />
                    </div>
                    <button
                      className={`race-option ${!draft.alignment ? "selected" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={!draft.alignment}
                      onClick={() => {
                        onChange("alignment", "");
                        setAlignmentMenuOpen(false);
                        setMenuTooltip({ field: "", description: "" });
                      }}
                    >
                      <span>No alignment selected</span>
                    </button>
                    {availableAlignments
                      .filter((alignment) =>
                        matchesMenuQuery(alignment, "alignment"),
                      )
                      .map((alignment) => (
                        <button
                          className={`race-option ${draft.alignment === alignment ? "selected" : ""}`}
                          key={alignment}
                          type="button"
                          role="option"
                          aria-selected={draft.alignment === alignment}
                          title={alignmentDescriptions[alignment]}
                          onMouseEnter={() =>
                            setMenuTooltip({
                              field: "alignment",
                              description: alignmentDescriptions[alignment],
                            })
                          }
                          onFocus={() =>
                            setMenuTooltip({
                              field: "alignment",
                              description: alignmentDescriptions[alignment],
                            })
                          }
                          onMouseLeave={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onBlur={() =>
                            setMenuTooltip({ field: "", description: "" })
                          }
                          onClick={() => {
                            onChange("alignment", alignment);
                            setAlignmentMenuOpen(false);
                            setMenuTooltip({ field: "", description: "" });
                          }}
                        >
                          <span>{alignment}</span>
                        </button>
                      ))}
                  </div>
                )}
                {menuTooltip.field === "alignment" && (
                  <span className="creation-menu-tooltip" role="tooltip">
                    {menuTooltip.description}
                  </span>
                )}
              </div>
            </label>
            <label className="deity-creation-field">
              Deity
              <div className="class-field menu-right">
                <button
                  className="race-trigger"
                  type="button"
                  aria-expanded={deityMenuOpen}
                  onClick={() => toggleMenu("deity")}
                >
                  {selectedDeity?.name ?? "No deity selected"}
                  <span aria-hidden="true">▾</span>
                </button>
                {deityMenuOpen && (
                  <div className="race-menu" role="listbox" aria-label="Deity choices">
                    <div className="menu-search">
                      <input
                        autoFocus
                        value={menuQuery.deity}
                        onChange={(event) =>
                          setMenuQuery({ ...menuQuery, deity: event.target.value })
                        }
                        placeholder="Search deities"
                        aria-label="Search deities"
                      />
                    </div>
                    <button
                      className={`race-option ${!draft.deity ? "selected" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={!draft.deity}
                      onClick={() => {
                        onChange("deity", undefined);
                        setDeityMenuOpen(false);
                        setMenuTooltip({ field: "", description: "" });
                      }}
                    >
                      <span>No deity selected</span>
                    </button>
                    {availableDeities
                      .filter((deity) => matchesMenuQuery(deity.name, "deity"))
                      .map((deity) => (
                        <button
                          className={`race-option ${draft.deity === deity.id ? "selected" : ""}`}
                          key={deity.id}
                          type="button"
                          role="option"
                          aria-selected={draft.deity === deity.id}
                          onMouseEnter={() =>
                            setMenuTooltip({ field: "deity", description: deity.description })
                          }
                          onFocus={() =>
                            setMenuTooltip({ field: "deity", description: deity.description })
                          }
                          onMouseLeave={() => setMenuTooltip({ field: "", description: "" })}
                          onBlur={() => setMenuTooltip({ field: "", description: "" })}
                          onClick={() => {
                            onChange("deity", deity.id);
                            setDeityMenuOpen(false);
                            setMenuTooltip({ field: "", description: "" });
                          }}
                        >
                          <span>{deity.name} ({deity.alignment})</span>
                        </button>
                      ))}
                  </div>
                )}
                {menuTooltip.field === "deity" && (
                  <span className="creation-menu-tooltip" role="tooltip">
                    {menuTooltip.description}
                  </span>
                )}
              </div>
            </label>
            {dragonlanceRuleset &&
              (draft.prestigeClass === "wizard-of-high-sorcery" ||
                draft.prestigeClass === "white-robed-wizard" ||
                draft.prestigeClass === "red-robed-wizard" ||
                draft.prestigeClass === "black-robed-wizard") && (
              <label className="high-sorcery-creation-field">
                High Sorcery order
                <select
                  value={draft.highSorceryOrder ?? ""}
                  onChange={(event) =>
                    onChange(
                      "highSorceryOrder",
                      (event.target.value || undefined) as Character["highSorceryOrder"],
                    )
                  }
                >
                  <option value="">No order selected</option>
                  <option value="white">White Robes (good)</option>
                  <option value="red">Red Robes (neutral)</option>
                  <option value="black">Black Robes (evil)</option>
                </select>
              </label>
            )}
          </div>
          <div className="ability-methods">
            <button
              type="button"
              className={method === "roll" ? "selected" : ""}
              onClick={() => onMethodChange("roll")}
            >
              Roll 4d6
            </button>
            <button
              type="button"
              className={method === "pointBuy" ? "selected" : ""}
              onClick={() => onMethodChange("pointBuy")}
            >
              Point Buy
            </button>
            <button
              type="button"
              className={method === "manual" ? "selected" : ""}
              onClick={() => onMethodChange("manual")}
            >
              Manual
            </button>
            {method === "roll" && (
              <>
                <button
                  className="quiet-button"
                  type="button"
                  onClick={rollAbilities}
                >
                  Roll Abilities
                </button>
                {rolledScores && (
                  <span>
                    Rolled: {rolledScores.join(", ")}. Choose where each result
                    goes below.
                  </span>
                )}
              </>
            )}
            {method === "pointBuy" && (
              <span>Points used: {pointBuyTotal} / 25</span>
            )}
          </div>
          <div className="language-choices">
            <div>
              <h3>Languages</h3>
              <p className="language-summary">
                <strong>Automatic:</strong>{" "}
                {getRacialLanguages(draft).join(", ")}
              </p>
            </div>
            {Array.from(
              { length: getLanguageBonusSlots(draft) },
              (_, index) => {
                const automatic = getRacialLanguages(draft);
                const chosen = (draft.languages ?? []).filter(
                  (language) => !automatic.includes(language),
                );
                const current = chosen[index] ?? "";
                const taken = new Set([
                  ...automatic,
                  ...chosen.filter((_, choiceIndex) => choiceIndex !== index),
                ]);
                return (
                  <label key={`language-${index}`}>
                    Bonus language {index + 1}
                    <LanguagePicker
                      selected={current}
                      options={getAvailableLanguages(ruleset).filter(
                        (language) =>
                          !taken.has(language) || language === current,
                      )}
                      onChange={(language) => {
                        const next = [...chosen];
                        next[index] = language;
                        onChange("languages", [
                          ...new Set(next.filter(Boolean)),
                        ]);
                      }}
                    />
                  </label>
                );
              },
            )}
            {!getLanguageBonusSlots(draft) && (
              <p className="language-empty">
                No bonus language slots. Increase Intelligence to gain
                additional choices.
              </p>
            )}
          </div>
          <div className="creation-abilities">
            {abilities.map(([short, name]) => {
              const ability = short.toLowerCase() as AbilityName;
              const availableScores =
                method === "roll" && rolledScores && rolledAssignments
                  ? rolledAssignments.map((poolIndex) => ({
                      score: rolledScores[poolIndex],
                      index: poolIndex,
                    }))
                  : [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(
                      (score, index) => ({ score, index }),
                    );
              const selectedPoolIndex =
                method === "roll" && rolledAssignments
                  ? rolledAssignments[abilityNames.indexOf(ability)]
                  : undefined;
              const selectedValue =
                selectedPoolIndex !== undefined
                  ? String(selectedPoolIndex)
                  : String(draft.abilities[ability]);
              const finalScore =
                selectedPoolIndex !== undefined && rolledScores
                  ? rolledScores[selectedPoolIndex] +
                    (selectedRace.abilityModifiers[ability] ?? 0)
                  : draft.abilities[ability];
              return (
                <label key={ability}>
                  {name}
                  <select
                    value={selectedValue}
                    onChange={(event) =>
                      method === "roll"
                        ? assignRolledScore(ability, Number(event.target.value))
                        : onAbilityChange(ability, Number(event.target.value))
                    }
                  >
                    {availableScores.map((entry, index) => {
                      const score = entry.score;
                      const optionValue =
                        method === "roll" ? entry.index : score;
                      return (
                        <option
                          key={`${score}-${index}`}
                          value={optionValue}
                          disabled={
                            method === "pointBuy" &&
                            pointBuyTotal -
                              (pointBuyCosts[draft.abilities[ability]] ?? 0) +
                              (pointBuyCosts[score] ?? 0) >
                              25
                          }
                        >
                          {score} ({formatModifier(abilityModifier(score))})
                          {selectedRace.abilityModifiers[ability]
                            ? ` ${selectedRace.abilityModifiers[ability] > 0 ? "+" : ""}${selectedRace.abilityModifiers[ability]} ${selectedRace.name} = ${score + (selectedRace.abilityModifiers[ability] ?? 0)}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                  <small className="racial-adjustment">
                    {finalScore} ({formatModifier(abilityModifier(finalScore))})
                  </small>
                </label>
              );
            })}
          </div>
          <div className="creation-actions">
            {creationErrors.length > 0 && (
              <ul className="creation-validation-errors">
                {creationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            <span>
              Starting hit points:{" "}
              {Math.max(
                1,
                classDefinitions[classId].hitDie +
                  abilityModifier(draft.abilities.con),
              )}{" "}
              (d{classDefinitions[classId].hitDie} + Constitution modifier)
            </span>
            <button
              className="level-button"
              type="button"
              disabled={creationErrors.length > 0}
              onClick={onCreate}
            >
              Finalize Character
            </button>
          </div>
        </Panel>
      )}
    </section>
  );
}
