import { canRepeatHighArcana, classDefinitions, deityDefinitions, dragonDiscipleBonusLevels, dragonDiscipleVarieties, dragonlancePrestigeClasses, getHorizonWalkerTerrainOptions, highArcanaMinimumSlots, magicSchools, type Character, type HighArcana, type HighArcanaChoice, type LevelUpDraft } from "../domain";
import { earnedDragonDiscipleBonusSlots, getBaseClassLevel, getDragonDiscipleSlotOptions, getHighArcanaSlotOptions, getNewLevelUpFeatSlots, getPrestigeClassLevel, getPrestigeFeatureChoice, getPrestigeSpellcastingClassOptions, getSpellcastingClassDefinition, prestigeClassAdvancesSpellcastingAtLevel } from "../rules";
import { getClericDomain } from "../data/clericDomains";
import { clericDomainIds } from "../data/clericDomainIds";
import { clericDomainAllowed } from "../clericDomains";
import { getRedWizardNewSpellWarnings } from "../redWizardRules";
import { CoreWizardSpecializationChoice } from "./CoreWizardSpecializationChoice";

type Props = {
  draft: LevelUpDraft;
  onChange: (draft: LevelUpDraft) => void;
  onWarningsChange?: (warnings: string[]) => void;
  spellCatalogReady?: boolean;
};

export default function PrestigeChoices(props: Props) {
  const { draft, onChange, onWarningsChange, spellCatalogReady } = props;
  const id = draft.prestigeClassId;
  useEffect(() => {
    onWarningsChange?.([
      ...getPrestigeChoiceWarnings(draft),
      ...getRedWizardNewSpellWarnings(draft, spellCatalogReady ?? false),
    ]);
  }, [draft, id, onWarningsChange, spellCatalogReady]);
  if (!id) return draft.classId === "wizard" &&
    getBaseClassLevel(draft.original, "wizard") === 0 ? <CoreWizardSpecializationChoice
    school={draft.proposed.coreWizardSpecializationSchool}
    onChange={(school) => onChange({
      ...draft, proposed: { ...draft.proposed, coreWizardSpecializationSchool: school },
    })}
  /> : null;
  const entry = draft.proposed.classLevels.find((level) => "prestigeClassId" in level && level.prestigeClassId === id);
  const progression = dragonlancePrestigeClasses[id].spellcastingProgression;
  const special = dragonlancePrestigeClasses[id].roleplayPrerequisite;
  const targets = progression && prestigeClassAdvancesSpellcastingAtLevel(id, entry?.level ?? 0)
    ? getPrestigeSpellcastingClassOptions(draft.original, id) : [];
  const divine = id === "mystic-theurge" ? getPrestigeSpellcastingClassOptions(draft.original, id, true) : [];
  const updateTarget = (value: string, isDivine: boolean) => {
    const classId = (isDivine ? divine : targets).find((target) => target === value);
    if (!classId) return;
    onChange({
      ...draft, classId: isDivine ? draft.classId : classId,
      proposed: {
        ...draft.proposed,
        ...(id === "archmage" ? { highArcanaChoices: draft.original.highArcanaChoices } : {}),
        classLevels: draft.proposed.classLevels.map((level) =>
          "prestigeClassId" in level && level.prestigeClassId === id
            ? isDivine ? { ...level, divineSpellcastingClassId: classId } : { ...level, classId }
            : level),
      },
    });
  };
  const firstPrestigeLevel = !getPrestigeClassLevel(draft.original, id);
  const divineCrusaderDomainOptions =
    id === "divine-crusader" && firstPrestigeLevel
      ? deityDefinitions.find((deity) => deity.id === draft.proposed.deity)?.clericDomains ?? []
      : [];
  const piousTemplarListOptions =
    id === "pious-templar" && firstPrestigeLevel
      ? getPiousTemplarSpellListOptions(draft.proposed)
      : [];
  const contemplativeDomainIndex =
    id === "contemplative" &&
    (entry?.level === 1 || entry?.level === 6)
      ? entry.level === 1 ? 0 : 1
      : undefined;
  const contemplativeDomainOptions =
    contemplativeDomainIndex !== undefined
      ? clericDomainIds.filter((domain) =>
          clericDomainAllowed(draft.proposed, domain),
        )
      : [];
  const radiantServantDomainOptions =
    id === "radiant-servant-of-pelor" && entry?.level === 5
      ? [
          ...(deityDefinitions.find((deity) => deity.id === draft.proposed.deity)
            ?.clericDomains ?? []),
          "glory" as const,
          "purification" as const,
        ].filter((domain, index, domains) => domains.indexOf(domain) === index)
      : [];
  return <>
    {id === "red-wizard" && !getPrestigeClassLevel(draft.original, id) && <RedWizardChoices draft={draft} onChange={onChange} />}
    <PrestigeFeatureChoices {...props} />
    {divineCrusaderDomainOptions.length > 0 && <label className="draft-class">
      Divine Crusader domain
      <select value={draft.proposed.divineCrusaderDomain ?? ""}
        onChange={(event) => onChange({
          ...draft,
          proposed: {
            ...draft.proposed,
            divineCrusaderDomain: (
              event.currentTarget.value || undefined
            ) as Character["divineCrusaderDomain"],
          },
        })}>
        <option value="" disabled>Choose a deity domain</option>
        {divineCrusaderDomainOptions.map((domain) =>
          <option key={domain} value={domain}>{getClericDomain(domain).name}</option>,
        )}
      </select>
    </label>}
    {piousTemplarListOptions.length > 0 && <label className="draft-class">
      Pious Templar spell list
      <select value={draft.proposed.piousTemplarSpellList ?? ""}
        onChange={(event) => onChange({
          ...draft,
          proposed: {
            ...draft.proposed,
            piousTemplarSpellList: (
              event.currentTarget.value || undefined
            ) as Character["piousTemplarSpellList"],
          },
        })}>
        <option value="" disabled>Choose a spell list</option>
        {piousTemplarListOptions.map((classId) =>
          <option key={classId} value={classId}>
            {getSpellcastingClassDefinition(classId).name}
          </option>,
        )}
      </select>
    </label>}
    {contemplativeDomainIndex !== undefined && <label className="draft-class">
      Contemplative bonus domain
      <select
        value={draft.proposed.contemplativeDomains?.[contemplativeDomainIndex] ?? ""}
        onChange={(event) => {
          const domains = [...(draft.proposed.contemplativeDomains ?? [])];
          const value = event.currentTarget.value;
          domains[contemplativeDomainIndex] =
            value as NonNullable<Character["contemplativeDomains"]>[number];
          onChange({
            ...draft,
            proposed: { ...draft.proposed, contemplativeDomains: domains },
          });
        }}
      >
        <option value="" disabled>Choose a bonus domain</option>
        {contemplativeDomainOptions.map((domain) =>
          <option
            key={domain}
            value={domain}
            disabled={draft.proposed.contemplativeDomains?.some(
              (selected, index) =>
                index !== contemplativeDomainIndex && selected === domain,
            )}
          >{getClericDomain(domain).name}</option>,
        )}
      </select>
    </label>}
    {radiantServantDomainOptions.length > 0 && <label className="draft-class">
      Radiant Servant bonus domain
      <select
        value={draft.proposed.radiantServantDomain ?? ""}
        onChange={(event) => onChange({
          ...draft,
          proposed: {
            ...draft.proposed,
            radiantServantDomain: (
              event.currentTarget.value || undefined
            ) as Character["radiantServantDomain"],
          },
        })}
      >
        <option value="" disabled>Choose a bonus domain</option>
        {radiantServantDomainOptions.map((domain) =>
          <option key={domain} value={domain}>
            {getClericDomain(domain).name}
          </option>,
        )}
      </select>
    </label>}
    {targets.length > 1 && <label className="draft-class">
      {id === "mystic-theurge" ? "Advance arcane spellcasting in" : "Advance spellcasting in"}
      <select value={draft.classId} onChange={(event) => updateTarget(event.currentTarget.value, false)}>
        {targets.map((target) => <option key={target} value={target}>{classDefinitions[target].name}</option>)}
      </select>
    </label>}
    {id === "mystic-theurge" && <label className="draft-class">
      Advance divine spellcasting in
      <select value={entry && "prestigeClassId" in entry ? entry.divineSpellcastingClassId ?? "" : ""}
        onChange={(event) => updateTarget(event.currentTarget.value, true)}>
        <option value="" disabled>Choose a divine class</option>
        {divine.map((target) => <option key={target} value={target}>{classDefinitions[target].name}</option>)}
      </select>
    </label>}
    {special && !getPrestigeClassLevel(draft.original, id) && <label className="draft-class level-prestige-prerequisite">
      <input type="checkbox" checked={Boolean(draft.specialPrerequisiteConfirmed)}
        onChange={(event) => onChange({ ...draft, specialPrerequisiteConfirmed: event.currentTarget.checked })} />
      Confirm: {special}
    </label>}
  </>;
}

function getPrestigeChoiceWarnings(draft: LevelUpDraft) {
  if (draft.prestigeClassId === "contemplative") {
    const level = getPrestigeClassLevel(draft.proposed, "contemplative");
    const required = level >= 6 ? 2 : level >= 1 ? 1 : 0;
    const domains = draft.proposed.contemplativeDomains ?? [];
    if (
      domains.length < required ||
      new Set(domains).size !== domains.length ||
      domains.some((domain) => !clericDomainAllowed(draft.proposed, domain))
    )
      return ["Choose a distinct permitted Contemplative bonus domain at levels 1 and 6."];
  }
  if (
    draft.prestigeClassId === "radiant-servant-of-pelor" &&
    getPrestigeClassLevel(draft.proposed, "radiant-servant-of-pelor") >= 5 &&
    (!draft.proposed.radiantServantDomain ||
      ![
        ...(deityDefinitions.find(({ id }) => id === draft.proposed.deity)?.clericDomains ?? []),
        "glory", "purification",
      ].includes(draft.proposed.radiantServantDomain))
  ) return ["Choose the Radiant Servant's fifth-level bonus domain."];
  if (draft.prestigeClassId === "divine-crusader" &&
      !getPrestigeClassLevel(draft.original, "divine-crusader")) {
    const options = deityDefinitions.find(
      (deity) => deity.id === draft.proposed.deity,
    )?.clericDomains ?? [];
    if (!draft.proposed.divineCrusaderDomain ||
        !options.includes(draft.proposed.divineCrusaderDomain))
      return ["Choose one domain granted by the Divine Crusader's deity."];
  }
  if (draft.prestigeClassId === "pious-templar" &&
      !getPrestigeClassLevel(draft.original, "pious-templar")) {
    const options = getPiousTemplarSpellListOptions(draft.proposed);
    if (!draft.proposed.piousTemplarSpellList ||
        !options.some((option) => option === draft.proposed.piousTemplarSpellList))
      return ["Choose the Pious Templar's permanent spell list."];
  }
  if (draft.prestigeClassId === "archmage") {
    const level = getPrestigeClassLevel(draft.proposed, "archmage");
    const choices = draft.proposed.highArcanaChoices ?? [];
    const prior = draft.original.highArcanaChoices ?? [];
    const choice = choices.at(-1);
    if (!getPrestigeSpellcastingClassOptions(draft.original, "archmage").includes(draft.classId))
      return ["Choose a qualifying arcane class to advance."];
    if (choices.length !== level || prior.length !== level - 1 ||
        prior.some((previous, index) => JSON.stringify(previous) !== JSON.stringify(choices[index])) ||
        (choice !== null && (!choice || choice.classId !== draft.classId ||
          !canRepeatHighArcana(choice.ability, prior) ||
          !getHighArcanaSlotOptions(draft, choice).includes(choice.slot) ||
          (choice.ability === "Spell-Like Ability"
            ? !choice.spellNote?.trim() || !getHighArcanaSlotOptions(draft, choice, true).includes(choice.reserve ?? -1)
            : choice.reserve !== undefined || choice.spellNote !== undefined))))
      return ["Choose legal High Arcana slot costs or decline High Arcana for this level."];
    return [];
  }

  if (draft.prestigeClassId === "dragon-disciple") {
    const level = getPrestigeClassLevel(draft.proposed, "dragon-disciple");
    const { dragonDiscipleVariety: variety, dragonDiscipleBonusSlots: slots = [] } = draft.proposed;
    const prior = draft.original.dragonDiscipleBonusSlots ?? [];
    const pending = slots[prior.length];
    return [
      ...(!variety || !dragonDiscipleVarieties.includes(variety) ||
        (level > 1 && variety !== draft.original.dragonDiscipleVariety) ? ["Choose an approved dragon variety."] : []),
      ...(slots.length !== earnedDragonDiscipleBonusSlots(level) ||
        prior.some((slot, index) => slot.classId !== slots[index]?.classId || slot.level !== slots[index]?.level) ||
        (slots.length > prior.length && !getDragonDiscipleSlotOptions(draft).some(
          (slot) => slot.classId === pending?.classId && slot.level === pending.level,
        )) ? ["Choose an available Dragon Disciple bonus spell slot."] : []),
    ];
  }
  if (draft.prestigeClassId === "red-wizard") return getRedWizardChoiceWarnings(draft);
  const choice = getPrestigeFeatureChoice(draft);
  if (!choice) return [];
  const selected: readonly string[] = draft.proposed[choice.field] ?? [];
  const options: readonly string[] = choice.options;
  return selected.length === choice.prior.length + 1 &&
    choice.prior.every((value, index) => selected[index] === value) &&
    options.includes(selected[choice.prior.length])
    ? [] : [`Choose a legal ${choice.label} before confirming.`];
}

function getPiousTemplarSpellListOptions(character: Character) {
  const deityAlignment = deityDefinitions.find(
    (deity) => deity.id === character.deity,
  )?.alignment ?? "";
  if (character.alignment.includes("Good") ||
      (!character.alignment.includes("Evil") && deityAlignment.includes("Good")))
    return ["paladin"] as const;
  if (character.alignment.includes("Evil") ||
      (!character.alignment.includes("Good") && deityAlignment.includes("Evil")))
    return ["blackguard"] as const;
  return ["paladin", "blackguard"] as const;
}

function getRedWizardChoiceWarnings(draft: LevelUpDraft) {
  const level = getPrestigeClassLevel(draft.proposed, "red-wizard");
  const originalLevel = getPrestigeClassLevel(draft.original, "red-wizard");
  const specialist = draft.proposed.redWizardSpecializationSchool;
  const prohibited = draft.proposed.redWizardProhibitedSchools ?? [];
  const originalProhibited = draft.original.redWizardProhibitedSchools ?? [];
  const targets = getPrestigeSpellcastingClassOptions(draft.original, "red-wizard");
  if (!targets.includes(draft.classId)) return ["Choose a qualifying arcane class to advance."];
  if (level === 1 && originalLevel === 0 &&
      (!specialist || !magicSchools.includes(specialist) ||
        (getWizardSpecialistSchool(draft.original) !== undefined &&
          specialist !== getWizardSpecialistSchool(draft.original)) ||
        prohibited.length === 0 || new Set(prohibited).size !== prohibited.length ||
        prohibited.some((school) => !magicSchools.includes(school) || school === specialist ||
          draft.original.wizardBarredSchools?.includes(school))))
    return ["Choose a specialist school and at least one additional prohibited school."];
  if (originalLevel > 0 &&
      (specialist !== draft.original.redWizardSpecializationSchool ||
        prohibited.length !== originalProhibited.length ||
        originalProhibited.some((school, index) => prohibited[index] !== school)))
    return ["Red Wizard specialization and prohibited schools cannot be changed after level 1."];
  if (level === 5 && !getNewLevelUpFeatSlots(draft.original, draft.proposed)
    .some((slot) => slot.id === "red-wizard-5" && draft.proposed.featSelections?.[slot.id]))
    return ["Choose a Red Wizard bonus feat at level 5."];
  return [];
}

function RedWizardChoices({ draft, onChange }: Props) {
  const wizardSpecialist = getWizardSpecialistSchool(draft.original);
  const specialist = draft.proposed.redWizardSpecializationSchool;
  const barred = draft.proposed.redWizardProhibitedSchools ?? [];
  const specialistOptions = wizardSpecialist ? [wizardSpecialist] : magicSchools;
  return <>
    <label className="draft-class">Red Wizard specialist school
      <select value={specialist ?? ""} onChange={(event) => {
        const school = specialistOptions.find((entry) => entry === event.currentTarget.value);
        onChange({ ...draft, proposed: { ...draft.proposed,
          redWizardSpecializationSchool: school,
          redWizardProhibitedSchools: barred.filter((entry) => entry !== school),
        } });
      }}>
        <option value="">Choose a specialist school</option>
        {specialistOptions.map((school) => <option key={school}>{school}</option>)}
      </select>
    </label>
    <label className="draft-class">Additional prohibited school(s)
      <select multiple size={5} value={barred} onChange={(event) => {
        const selected = [...event.currentTarget.selectedOptions].map((option) => option.value)
          .filter((school): school is typeof magicSchools[number] => magicSchools.some((entry) => entry === school));
        onChange({ ...draft, proposed: { ...draft.proposed, redWizardProhibitedSchools: selected } });
      }}>
        {magicSchools.filter((school) =>
          school !== specialist && !draft.original.wizardBarredSchools?.includes(school))
          .map((school) => <option key={school}>{school}</option>)}
      </select>
    </label>
  </>;
}

function getWizardSpecialistSchool(character: LevelUpDraft["original"]) {
  return character.redWizardSpecializationSchool ??
    (character.ruleset === "core-35-srd"
      ? character.coreWizardSpecializationSchool
      : character.wizardSpecializationSchool);
}

function PrestigeFeatureChoices({ draft, onChange }: Props) {
  if (draft.prestigeClassId === "archmage") return <ArchmageChoices draft={draft} onChange={onChange} />;
  if (draft.prestigeClassId === "horizon-walker") {
    const prior = draft.original.horizonWalkerTerrainMasteries ?? [];
    const options = getHorizonWalkerTerrainOptions(prior.length + 1).filter((terrain) => !prior.includes(terrain));
    return <label className="draft-class">
      Terrain mastery
      <select value={draft.proposed.horizonWalkerTerrainMasteries?.[prior.length] ?? ""} onChange={(event) => {
        const terrain = options.find((option) => option === event.currentTarget.value);
        onChange({ ...draft, proposed: { ...draft.proposed, horizonWalkerTerrainMasteries: terrain ? [...prior, terrain] : prior } });
      }}>
        <option value="">Choose a new terrain</option>
        {options.map((terrain) => <option key={terrain}>{terrain}</option>)}
      </select>
    </label>;
  }
  if (draft.prestigeClassId === "dragon-disciple")
    return <DragonDiscipleChoices draft={draft} onChange={onChange} />;
  const choice = getPrestigeFeatureChoice(draft);
  if (!choice) return null;
  return <label className="draft-class">
    {choice.label}
    <select value={draft.proposed[choice.field]?.[choice.prior.length] ?? ""} onChange={(event) => {
      const value = event.currentTarget.value;
      const selected: readonly string[] = choice.options;
      const choices = selected.includes(value) ? [...choice.prior, value] : [...choice.prior];
      onChange({ ...draft, proposed: { ...draft.proposed, [choice.field]: choices } });
    }}>
      <option value="">Choose one</option>
      {choice.options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </label>;
}

function ArchmageChoices({ draft, onChange }: Props) {
  const prior = draft.original.highArcanaChoices ?? [];
  const candidate = draft.proposed.highArcanaChoices?.[prior.length];
  const choice = candidate?.classId === draft.classId ? candidate : undefined;
  const options = (Object.keys(highArcanaMinimumSlots) as HighArcana[]).filter((ability) =>
    canRepeatHighArcana(ability, prior) &&
    getHighArcanaSlotOptions(draft, { ability, classId: draft.classId, slot: -1 }).length);
  const update = (selected?: HighArcanaChoice | null) => onChange({
    ...draft, proposed: { ...draft.proposed, highArcanaChoices: selected === undefined ? prior : [...prior, selected] },
  });
  return <>
    <label className="draft-class">High Arcana
      <select value={choice?.ability ?? (candidate === null ? "decline" : "")} onChange={(event) => {
        const value = event.currentTarget.value;
        const ability = options.find((option) => option === value);
        update(ability ? { ability, classId: draft.classId, slot: -1 } : value === "decline" ? null : undefined);
      }}>
        <option value="">Choose High Arcana</option>
        <option value="decline">Decline High Arcana</option>
        {options.map((ability) => <option key={ability}>{ability}</option>)}
      </select>
    </label>
    {choice && <label className="draft-class">Permanent High Arcana slot cost
      <select value={choice.slot} onChange={(event) => update({ ...choice, slot: Number(event.currentTarget.value), reserve: undefined })}>
        <option value={-1}>Choose a slot</option>
        {getHighArcanaSlotOptions(draft, choice).map((level) => <option key={level} value={level}>Level {level}</option>)}
      </select>
    </label>}
    {choice?.ability === "Spell-Like Ability" && choice.slot >= 0 && <>
      <label className="draft-class">Additional reserved spell-like ability slot
        <select value={choice.reserve ?? -1} onChange={(event) => update({ ...choice, reserve: Number(event.currentTarget.value) })}>
          <option value={-1}>Choose a slot</option>
          {getHighArcanaSlotOptions(draft, choice, true).map((level) => <option key={level} value={level}>Level {level}</option>)}
        </select>
      </label>
      <label className="draft-class">DM-verified spell-like ability details
        <input maxLength={200} value={choice.spellNote ?? ""} onChange={(event) => update({ ...choice, spellNote: event.currentTarget.value })} />
      </label>
      <p>Record the eligible spell, any metamagic, daily uses, and XP cost. The builder reserves the slots; verify and track the ability with your DM.</p>
    </>}
  </>;
}

function DragonDiscipleChoices({ draft, onChange }: Props) {
  const level = getPrestigeClassLevel(draft.proposed, "dragon-disciple");
  const prior = draft.original.dragonDiscipleBonusSlots ?? [];
  const options = getDragonDiscipleSlotOptions(draft);
  const selected = draft.proposed.dragonDiscipleBonusSlots?.[prior.length];
  const key = (slot: typeof selected) => slot ? `${slot.classId}:${slot.level}` : "";
  return <>
    {level === 1 && <label className="draft-class">
      Dragon variety
      <select value={draft.proposed.dragonDiscipleVariety ?? ""} onChange={(event) => {
        const value = event.currentTarget.value;
        onChange({ ...draft, proposed: { ...draft.proposed,
          dragonDiscipleVariety: dragonDiscipleVarieties.find((variety) => variety === value),
        } });
      }}>
        <option value="">Choose a variety</option>
        {dragonDiscipleVarieties.map((variety) => <option key={variety}>{variety}</option>)}
      </select>
    </label>}
    {dragonDiscipleBonusLevels.some((milestone) => milestone === level) && <label className="draft-class">
      Dragon Disciple bonus spell slot
      <select value={key(selected)} onChange={(event) => {
        const value = event.currentTarget.value;
        const slot = options.find((option) => key(option) === value);
        onChange({ ...draft, proposed: { ...draft.proposed, dragonDiscipleBonusSlots: slot ? [...prior, slot] : prior } });
      }}>
        <option value="">Choose a class and spell level</option>
        {options.map((slot) => <option key={key(slot)} value={key(slot)}>
          {getSpellcastingClassDefinition(slot.classId).name} level {slot.level}
        </option>)}
      </select>
    </label>}
  </>;
}
import { useEffect } from "react";
