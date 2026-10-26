import { useEffect, useRef, useState } from "react";
import type { Character, ClassId, SpellAcquisition, WizardSpellLearning } from "../domain";
import { getClassSpellSelections, getWizardCopyRequirements, getWizardFreeSpellAllowance, getWizardSpellbookSpells, hasSpellLevelAtClassLevel } from "../rules";
import { getEffectiveAbilityScore } from "../abilityEquipment";

type AcquisitionChange = (classId: ClassId, spell: string, source: SpellAcquisition | null, record?: WizardSpellLearning) => void;
const sourceLabels: Record<SpellAcquisition, string> = {
  starting: "Starting spell", "level-up": "Free level-up spell", scroll: "Copied from scroll",
  spellbook: "Copied from spellbook", research: "Research", reward: "DM reward",
};

export function WizardSpellbook({ character, original, editable, onKnownSpellsChange, onAcquisitionChange }: {
  character: Character;
  original?: Character;
  editable: boolean;
  onKnownSpellsChange: (spells: string[], classId?: ClassId) => void;
  onAcquisitionChange: AcquisitionChange;
}) {
  const [learning, setLearning] = useState(false);
  const [freeSpell, setFreeSpell] = useState("");
  const addButton = useRef<HTMLButtonElement>(null);
  const spells = getWizardSpellbookSpells();
  const known = getClassSpellSelections(character, "knownSpells").wizard ?? [];
  const knownNames = new Set(known.map((name) => name.toLowerCase()));
  const allowance = getWizardFreeSpellAllowance(character, original);
  const classLevel = character.classLevels.find((entry) => entry.classId === "wizard")?.level ?? 0;
  const freeChoices = spells.filter((spell) => !knownNames.has(spell.name.toLowerCase()) && spell.level > 0 &&
    (!allowance.starting || spell.level === 1) && hasSpellLevelAtClassLevel("wizard", classLevel, spell.level) &&
    getEffectiveAbilityScore(character, "int") >= 10 + spell.level);
  const selectedFreeSpell = freeChoices.find((spell) => spell.name === freeSpell);
  const unknown = known.filter((name) => !spells.some((spell) => spell.name === name));
  const cantrips = spells.filter((spell) => spell.level === 0).map((spell) => spell.name);
  const missingCantrips = cantrips.filter((name) => !knownNames.has(name.toLowerCase()));
  const originalKnown = original ? getClassSpellSelections(original, "knownSpells").wizard ?? [] : [];
  const pageCount = known.reduce((total, name) => {
    const spell = spells.find((entry) => entry.name === name);
    return total + (spell ? Math.max(1, spell.level) : 0);
  }, 0);
  return (
    <div className="wizard-spellbook">
      <div className="spell-class-summary">
        <p>Your spellbook records learned spells; Daily Preparation chooses today's copies.
          Recorded spells: {known.length}. Known page usage: {pageCount}.
          Physical books and their 100-page capacities are not tracked yet.</p>
        <p className="spell-rules-notice">Specialist schools and prohibited schools are not implemented.
          Review school restrictions with your DM before adding spells.</p>
        {editable && (
          <form className="spellbook-free-spells" onSubmit={(event) => {
            event.preventDefault();
            if (!selectedFreeSpell || allowance.remaining === 0) return;
            onAcquisitionChange("wizard", selectedFreeSpell.name, allowance.starting ? "starting" : "level-up");
            setFreeSpell("");
          }}>
            <p>Free {allowance.starting ? "starting" : "level-up"} spells: {allowance.selected}/{allowance.required}.
              {allowance.starting ? " Choose first-level spells." : " Choose two total across spell levels you can cast."}
              {" "}No copying check, writing time, or writing cost applies.</p>
            {allowance.selected > allowance.required && <p role="alert">The free-spell allowance is exceeded. Existing entries are preserved; review their acquisition sources.</p>}
            {allowance.remaining > 0 && <div className="spellbook-actions">
              <label>Free wizard spell
                <select value={selectedFreeSpell?.name ?? ""} onChange={(event) => setFreeSpell(event.target.value)}>
                  <option value="">Choose a free spell</option>
                  {freeChoices.map((spell) => <option key={spell.name} value={spell.name}>{spell.name} (Level {spell.level})</option>)}
                </select>
              </label>
              <button type="submit" className="quiet-button" disabled={!selectedFreeSpell}>Add free spell</button>
            </div>}
            {allowance.starting && missingCantrips.length > 0 && <button type="button" className="quiet-button"
              onClick={() => onKnownSpellsChange([...known, ...missingCantrips], "wizard")}>
              Add starting cantrips
            </button>}
          </form>
        )}
        <button ref={addButton} type="button" className="level-button" onClick={() => setLearning(true)}>
          Learn a spell
        </button>
        <p>Copy a scroll or another spellbook, or record DM-approved research or a reward.
          Learning does not spend gold or remove inventory automatically. Save persists changes.</p>
      </div>
      {unknown.length > 0 && <div className="spell-rules-notice" role="alert">
        Unrecognized imported spellbook entries: {unknown.join(", ")}. Preserved unchanged; verify names with your DM.
      </div>}
      {Array.from({ length: 10 }, (_, level) => {
        const entries = spells.filter((spell) => spell.level === level && known.includes(spell.name));
        if (!entries.length) return null;
        return <section key={level} className="spellbook-level" aria-label={`Spellbook level ${level}`}>
          <h3>{level === 0 ? "Cantrips" : `Level ${level} spells`}</h3>
          <ul className="spellbook-list">
            {entries.map((spell) => {
              const source = character.spellAcquisitionByClass?.wizard?.[spell.name];
              const record = character.wizardSpellLearning?.[spell.name];
              const notCastable = !hasSpellLevelAtClassLevel("wizard", classLevel, level) || getEffectiveAbilityScore(character, "int") < 10 + level;
              return <li key={spell.name}>
                <div><strong>{spell.name}</strong><span>{spell.school} · {Math.max(1, level)} page{level > 1 ? "s" : ""}</span>
                  <small>{source ? sourceLabels[source] : "Source not recorded"}{record ? ` · Recorded ${new Date(record.learnedAt).toLocaleDateString("en-US")}` : ""}</small>
                  {record?.spellcraftTotal !== undefined && <small>Learning Spellcraft {record.spellcraftTotal} (DC {15 + level})</small>}
                  {notCastable && <small className="spell-rules-notice">Recorded, but not currently available to prepare. Requires wizard spell-level access and INT {10 + level}.</small>}
                </div>
                {(source && !["starting", "level-up"].includes(source) ||
                  editable && !originalKnown.includes(spell.name)) && <button type="button" className="quiet-button"
                  aria-label={`Remove ${spell.name} from spellbook`} onClick={() => {
                    if (window.confirm(`Remove ${spell.name} from the spellbook and remove its prepared copies?`)) {
                      if (source && !["starting", "level-up"].includes(source)) onAcquisitionChange("wizard", spell.name, null);
                      else onKnownSpellsChange(known.filter((name) => name !== spell.name), "wizard");
                    }
                  }}>Remove</button>}
              </li>;
            })}
          </ul>
        </section>;
      })}
      {!known.length && <p>No spells recorded yet. Add starting spells or use Learn a spell.</p>}
      {learning && <LearnWizardSpell character={character} onLearn={onAcquisitionChange} onClose={() => {
        setLearning(false);
        addButton.current?.focus();
      }} />}
    </div>
  );
}

function LearnWizardSpell({ character, onLearn, onClose }: {
  character: Character; onLearn: AcquisitionChange; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [source, setSource] = useState<WizardSpellLearning["source"]>("scroll");
  const [decipherMethod, setDecipherMethod] = useState<NonNullable<WizardSpellLearning["decipherMethod"]>>("read-magic");
  const [decipherTotal, setDecipherTotal] = useState("");
  const [decipherConfirmed, setDecipherConfirmed] = useState(false);
  const [learningTotal, setLearningTotal] = useState("");
  const [studied, setStudied] = useState(false);
  const [written, setWritten] = useState(false);
  const [approved, setApproved] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const known = getClassSpellSelections(character, "knownSpells").wizard ?? [];
  const knownNames = new Set(known.map((name) => name.toLowerCase()));
  const choices = getWizardSpellbookSpells().filter((spell) => !knownNames.has(spell.name.toLowerCase()));
  const spell = choices.find((entry) => entry.name === name);
  const copying = source === "scroll" || source === "spellbook";
  const requirements = spell ? getWizardCopyRequirements(spell.level) : undefined;
  const decipherNumber = decipherTotal.trim() ? Number(decipherTotal) : undefined;
  const learningNumber = learningTotal.trim() ? Number(learningTotal) : undefined;
  const deciphered = decipherMethod !== "spellcraft" || (decipherNumber !== undefined &&
    Number.isInteger(decipherNumber) && requirements !== undefined && decipherNumber >= requirements.decipherDC);
  const understood = learningNumber !== undefined && Number.isInteger(learningNumber) &&
    requirements !== undefined && learningNumber >= requirements.learningDC;
  const canLearn = Boolean(spell && (copying ? deciphered && decipherConfirmed && studied && understood && written : approved));
  const close = () => { dialog.current?.close(); onClose(); };
  return <dialog ref={dialog} className="character-note-dialog spell-learning-dialog" aria-labelledby="spell-learning-title"
    onCancel={(event) => { event.preventDefault(); close(); }}>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!canLearn || !spell) return;
      onLearn("wizard", spell.name, source, {
        source, learnedAt: new Date().toISOString(),
        ...(copying ? { decipherMethod, ...(decipherMethod === "spellcraft" ? { decipherTotal: decipherNumber } : {}),
          spellcraftTotal: learningNumber } : {}),
      });
      close();
    }}>
      <h2 id="spell-learning-title">Learn a Wizard Spell</h2>
      <label>Spell source<select autoFocus value={source} onChange={(event) => {
        setSource(event.target.value as WizardSpellLearning["source"]);
        setDecipherTotal(""); setDecipherConfirmed(false); setLearningTotal(""); setStudied(false); setWritten(false); setApproved(false);
      }}>
        <option value="scroll">Copy a scroll</option><option value="spellbook">Copy another spellbook</option>
        <option value="research">Independent research</option><option value="reward">DM reward</option>
      </select></label>
      <label>Wizard spell<select value={spell?.name ?? ""} onChange={(event) => {
        setName(event.target.value); setDecipherTotal(""); setDecipherConfirmed(false); setLearningTotal("");
        setStudied(false); setWritten(false); setApproved(false);
      }}>
        <option value="">Choose a spell</option>
        {choices.map((entry) => <option key={entry.name} value={entry.name}>{entry.name} (Level {entry.level})</option>)}
      </select></label>
      {spell && requirements && (copying ? <>
        <p>Copying requirements for {spell.name}: decipher DC {requirements.decipherDC};
          learning Spellcraft DC {requirements.learningDC} after one day of study.
          Writing takes {requirements.writingHours} hours, uses {requirements.pages} page{requirements.pages > 1 ? "s" : ""},
          and costs {requirements.writingCostGp} gp in materials.</p>
        {source === "spellbook" && <p>A typical access fee is {requirements.usualAccessFeeGp} gp, separate from writing materials; confirm the actual fee with your DM.</p>}
        <label>Deciphering method<select value={decipherMethod} onChange={(event) => {
          setDecipherMethod(event.target.value as NonNullable<WizardSpellLearning["decipherMethod"]>); setDecipherConfirmed(false);
        }}>
          <option value="read-magic">Read magic used</option><option value="author">Author helped decipher the writing</option>
          <option value="previously-deciphered">This writing was already deciphered</option><option value="spellcraft">Spellcraft check</option>
        </select></label>
        {decipherMethod === "spellcraft" && <label>Deciphering Spellcraft total
          <input type="number" step="1" value={decipherTotal} onChange={(event) => setDecipherTotal(event.target.value)} />
        </label>}
        {!deciphered && decipherTotal !== "" && <p role="alert">Deciphering failed. This writing cannot be deciphered again until the next day. No spell will be added.</p>}
        <label className="spell-learning-confirm"><input type="checkbox" checked={decipherConfirmed} onChange={(event) => setDecipherConfirmed(event.target.checked)} />
          Writing successfully deciphered using the method above</label>
        <label className="spell-learning-confirm"><input type="checkbox" checked={studied} onChange={(event) => setStudied(event.target.checked)} />
          One day of study completed</label>
        <label>Learning Spellcraft total<input type="number" step="1" value={learningTotal} onChange={(event) => setLearningTotal(event.target.value)} /></label>
        {!understood && learningTotal !== "" && <p role="alert">Learning failed. Gain another rank in Spellcraft before trying to learn this spell again.
          The scroll is not consumed and no spell will be added. Retry eligibility is tracked by you and your DM.</p>}
        <label className="spell-learning-confirm"><input type="checkbox" checked={written} onChange={(event) => setWritten(event.target.checked)} />
          Writing time and material cost resolved with the DM</label>
        <p>{source === "scroll" ? "Successfully copying the spell removes it from the source scroll." : "The source spellbook is unharmed."}
          {" "}Gold and inventory are not changed automatically.</p>
      </> : <>
        <p>Research time, costs, checks, and rewards are adjudicated by the DM. This records an existing catalog spell, not a new custom spell.</p>
        <label className="spell-learning-confirm"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
          DM approved this spell and resolved any required checks, time, and costs</label>
      </>)}
      <p>No rolls are made automatically. Confirm actual results, including applicable modifiers.
        Specialization is not enforced. Cancel discards this entry; failed attempts are not saved.</p>
      <div className="character-note-actions">
        <button type="button" className="quiet-button" onClick={close}>Cancel</button>
        <button type="submit" className="level-button" disabled={!canLearn}>Record learned spell</button>
      </div>
    </form>
  </dialog>;
}
