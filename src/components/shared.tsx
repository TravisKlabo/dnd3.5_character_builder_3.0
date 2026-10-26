import { type Character } from "../domain";
import { formatModifier, getArmorClassValues, getArmorClassRestrictions, getSpecialAttackBonuses, getCombatSpace, getEncumbrance, getSavingThrow } from "../rules";

export function Panel({
  title,
  headerLabel,
  children,
  className = "",
  showStatus = false,
  statusText = "Calculated",
  headerActions,
}: {
  title: string;
  headerLabel?: string;
  children: React.ReactNode;
  className?: string;
  showStatus?: boolean;
  statusText?: string;
  headerActions?: React.ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <h2>{title}</h2>
        {headerLabel && <span className="panel-header-label">{headerLabel}</span>}
        {showStatus && <span className="rule-status">{statusText}</span>}
        {headerActions}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, detail, title }: { label: string; value: string; detail?: string[]; title?: string }) {
  return (
    <div className="stat" title={title}>
      <small>{label}</small>
      <strong>{value}</strong>
      {detail?.map((line) => <span className="stat-detail" key={line}>{line}</span>)}
    </div>
  );
}

export function ArmorClassStat({ character }: { character: Character }) {
  const defenses = getArmorClassValues(character);
  return <Stat label="Armor Class" value={String(defenses.normal)}
    detail={[`Touch ${defenses.touch}`, `Flat-footed ${defenses.flatFooted}`, ...getArmorClassRestrictions(character)]}
    title={`${defenses.detail.join("\n")}\nTouch ignores armor, shield, and natural armor bonuses, retains deflection and armor/load Dexterity limits. Flat-footed ${defenses.retainsDexterity ? "retains Dexterity with Uncanny Dodge" : "loses positive Dexterity, but retains penalties"}. Apply other unmodeled effects manually.`} />;
}

export function SavingThrowStat({ character, save, label }: {
  character: Character;
  save: "fortitude" | "reflex" | "will";
  label: string;
}) {
  const result = getSavingThrow(character, save);
  return <Stat label={label} value={formatModifier(result.total)} detail={[result.detail]} title={result.title} />;
}

export function SpecialAttackStats({ character }: { character: Character }) {
  const attacks = getSpecialAttackBonuses(character);
  return <div className="special-attack-summary" role="group" aria-label="Touch attacks and grapple">
    <Stat label="Melee touch" value={formatModifier(attacks.meleeTouch)} title={attacks.meleeDetail} />
    <Stat label="Ranged touch" value={formatModifier(attacks.rangedTouch)} title={attacks.rangedDetail} />
    <Stat label="Grapple" value={formatModifier(attacks.grapple)} title={attacks.grappleDetail} />
  </div>;
}

export function CombatMovementLine({ character }: { character: Character }) {
  const { space, reach } = getCombatSpace(character);
  const load = getEncumbrance(character);
  return <div className="combat-movement-line" role="group" aria-label="Space, reach, and load">
    <span>Space <strong>{space} ft.</strong></span>
    <span title="Natural reach for a tall/bipedal creature; equipped reach weapons are listed separately.">Reach <strong>{reach} ft.</strong></span>
    <span title={`Light up to ${load.capacity.light} lb.; medium up to ${load.capacity.medium} lb.; heavy up to ${load.capacity.heavy} lb.${load.unknownWeights.length ? ` Missing weights: ${load.unknownWeights.join(", ")}.` : ""}`}>
      <strong>{load.load} load{load.unknownWeights.length ? " (known weights)" : ""}</strong>
      {" · "}{load.weight.toLocaleString()} lb. / {load.capacity.light} lb. light limit
    </span>
  </div>;
}
