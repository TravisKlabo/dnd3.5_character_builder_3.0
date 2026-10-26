import { useState } from "react";
import { deityDefinitions, type Character } from "../domain";
import { clericDomains, clericDomainSource, getClericDomain, isClericDomainId } from "../data/clericDomains";
import { clericDomainAllowed, getActiveClericDomains, getClericDomainSlotCount,
  getClericDomainSpellOptions, getClericDomainWarnings } from "../clericDomains";

export type ClericCastingUpdate = Pick<Character, "clericDomains" | "clericDomainPreparation" | "clericDomainExpended">;

export function ClericDomains({ character, editable, onChange }: {
  character: Character;
  editable: boolean;
  onChange: (update: ClericCastingUpdate) => void;
}) {
  const [changingDomains, setChangingDomains] = useState(false);
  const selected = character.clericDomains ?? [];
  const canChoose = editable || selected.length < 2 || changingDomains;
  const deity = deityDefinitions.find((entry) => entry.id === character.deity);
  const warnings = getClericDomainWarnings(character);
  const active = getActiveClericDomains(character);
  const levels = Array.from({ length: 9 }, (_, index) => index + 1).filter((level) =>
    getClericDomainSlotCount(character, level) || character.clericDomainPreparation?.[level] ||
    character.clericDomainExpended?.includes(level));
  return (
    <section className="cleric-domains" aria-labelledby="cleric-domains-title">
      <h3 id="cleric-domains-title">Cleric Domains</h3>
      <p>Choose two domains. Each accessible spell level from 1st has one separate domain slot,
        prepared from either domain. No domain slot for orisons or bonus domain slots for high Wisdom.</p>
      <p className="spell-rules-notice">
        {deity ? `${deity.name}${deity.source !== "core-35-srd" ? " (Dragonlance)" : ""}: ` : character.deity ? `${character.deity}: ` : "No deity selected: "}
        {character.deity
          ? "Deity/domain associations and favored weapons are not source-verified. Confirm these two domains with your DM; this list is not a verified deity-specific list."
          : "SRD clerics without a deity may choose domains representing their beliefs, subject to alignment and DM approval."}
        {" "}Dragonlance-specific domains are not included.
      </p>
      {warnings.map((warning) => <p className="spell-rules-notice" role="alert" key={warning}>{warning}</p>)}
      <div className="cleric-domain-choices">
        {[0, 1].map((index) => (
          <label key={index}>Domain {index + 1}
            <select value={selected[index] ?? ""} disabled={!canChoose}
              onChange={(event) => {
                const value = event.target.value;
                const next = [...selected];
                if (isClericDomainId(value)) next[index] = value;
                else next.splice(index, 1);
                onChange({ clericDomains: next.filter(isClericDomainId) });
              }}>
              <option value="">Choose a domain</option>
              {Object.entries(clericDomains).map(([id, definition]) =>
                <option key={id} value={id} disabled={
                  selected.some((choice, position) => position !== index && choice === id) ||
                  (isClericDomainId(id) && !clericDomainAllowed(character, id))
                }>{definition.name}</option>)}
            </select>
          </label>
        ))}
        {!editable && !canChoose && <button type="button" className="quiet-button" onClick={() => {
          if (window.confirm("Domains are lasting class choices, not daily preparation. Change them only with DM approval. Existing domain preparations will be preserved with warnings if invalid; expended slots will not reset. Continue?")) setChangingDomains(true);
        }}>Change domains</button>}
        {changingDomains && selected.length === 2 && <button type="button" className="quiet-button" onClick={() => setChangingDomains(false)}>Done changing domains</button>}
      </div>
      <div className="cleric-domain-powers">
        {active.map((id) => {
          const definition = getClericDomain(id);
          return <details key={id}>
            <summary>{definition.name} granted power</summary>
            {definition.classSkills && <p><strong>Applied automatically:</strong> Cleric class skills:
              {" "}{definition.classSkills.map((skill) => skill === "Knowledge (*)" ? "all Knowledge skills" : skill).join(", ")}.</p>}
            {definition.manualPower && <p><strong>Manual resolution:</strong> {definition.manualPower}</p>}
            <a href={`${clericDomainSource}#${id}Domain`} target="_blank" rel="noreferrer">SRD {definition.name} domain rules</a>
          </details>;
        })}
      </div>
      <h4>Domain Preparation</h4>
      <p>Separate from ordinary cleric preparation. Domain-only spells cannot use ordinary slots.
        Domain slots cannot be converted spontaneously to cure/inflict spells. Power uses and conditional bonuses are resolved manually.</p>
      <div className="cleric-domain-slots">
        {levels.map((level) => {
          const options = getClericDomainSpellOptions(character, level);
          const preparation = character.clericDomainPreparation?.[level];
          const valid = options.some((option) => option.domain === preparation?.domain && option.spell === preparation.spell);
          const currentOption = options.find((option) => option.domain === preparation?.domain && option.spell === preparation.spell);
          const available = getClericDomainSlotCount(character, level) > 0;
          return <div className="cleric-domain-slot" role="group" aria-label={`Level ${level} domain slot`} key={level}>
            <label>Level {level} domain spell
              <select value={preparation ? `${preparation.domain}:${preparation.spell}` : ""} onChange={(event) => {
                const next = { ...character.clericDomainPreparation };
                const selection = options.find((option) => `${option.domain}:${option.spell}` === event.target.value);
                if (selection) next[level] = { domain: selection.domain, spell: selection.spell };
                else delete next[level];
                onChange({ clericDomainPreparation: next });
              }}>
                <option value="">Not prepared</option>
                {preparation && !valid && <option value={`${preparation.domain}:${preparation.spell}`} disabled>{preparation.spell} (unavailable saved selection)</option>}
                {options.map((option) => <option key={option.domain} value={`${option.domain}:${option.spell}`}>
                  {option.spell} ({clericDomains[option.domain].name})
                </option>)}
              </select>
            </label>
            <label className="domain-slot-expended">
              <input type="checkbox" checked={character.clericDomainExpended?.includes(level) ?? false}
                disabled={!available && !character.clericDomainExpended?.includes(level)}
                onChange={(event) => onChange({
                  clericDomainExpended: event.target.checked ? [...(character.clericDomainExpended ?? []), level] :
                    (character.clericDomainExpended ?? []).filter((entry) => entry !== level),
                })} aria-label={`Expended level ${level} domain slot`} />
              Expended
            </label>
            {currentOption?.note && <small>{currentOption.note}</small>}
            {preparation && valid && <a href={`${clericDomainSource}#${preparation.domain}Domain`} target="_blank" rel="noreferrer">
              Spell rules
            </a>}
            {!available && <small>Cleric level or Wisdom does not permit this slot.</small>}
          </div>;
        })}
      </div>
    </section>
  );
}
