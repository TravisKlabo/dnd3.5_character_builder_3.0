import { type Character, type CombatTargetType, type SavingThrowCondition } from "../domain";
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

export function RangedDistanceControl({ distanceFeet, onChange }: {
  distanceFeet: number | undefined;
  onChange: (distanceFeet: number | undefined) => void;
}) {
  return (
    <label className="ranged-distance-control">
      Target distance (ft.)
      <input
        type="number"
        min="0"
        step="1"
        aria-label="Target distance (ft.)"
        value={distanceFeet ?? ""}
        onChange={(event) => {
          const input = event.currentTarget;
          if (input.value === "") {
            input.setCustomValidity("");
            onChange(undefined);
            return;
          }
          const distance = input.valueAsNumber;
          if (!input.validity.valid || !Number.isSafeInteger(distance) || distance < 0) {
            input.setCustomValidity("Enter a nonnegative whole-number distance in feet.");
            input.reportValidity();
            return;
          }
          input.setCustomValidity("");
          onChange(distance);
        }}
      />
    </label>
  );
}

export function TargetDamageReductionControl({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="target-damage-reduction-control">
      <label>
        Target damage reduction
        <input
          type="text"
          aria-label="Target damage reduction"
          placeholder="5/cold iron"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <small>Single material qualifiers only: cold iron, silver, or adamantine. Other DR remains manual; this context is not saved.</small>
    </div>
  );
}

export function RangedAmmunitionControl({ options, selectedKey, onChange }: {
  options: { key: string; name: string; quantity: number }[];
  selectedKey?: string;
  onChange: (key: string | undefined) => void;
}) {
  const value = options.some((option) => option.key === selectedKey) ? selectedKey : "";
  return (
    <label className="ranged-ammunition-control">
      Ammunition to fire
      <select
        aria-label="Ammunition to fire"
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">{options.length ? "Select ammunition..." : "No compatible ammunition"}</option>
        {options.map((option) => (
          <option value={option.key} key={option.key}>
            {option.name} — {option.quantity} package{option.quantity === 1 ? "" : "s"}
          </option>
        ))}
      </select>
      <small>Session-only selection; ammunition is not consumed automatically.</small>
    </label>
  );
}

export function ArmorClassStat({ character, targetTypes = [] }: {
  character: Character;
  targetTypes?: CombatTargetType[];
}) {
  const defenses = getArmorClassValues(character, targetTypes);
  return <Stat label="Armor Class" value={String(defenses.normal)}
    detail={[
      `Touch ${defenses.touch}`,
      `Flat-footed ${defenses.flatFooted}`,
      ...(defenses.towerShieldCoverActive ? ["Total cover via tower shield; no attacks until the start of your next turn."] : []),
      ...(defenses.shieldBashACBonusLost ? ["Shield AC bonus lost until your next action after a shield bash."] : []),
      ...getArmorClassRestrictions(character),
    ]}
    title={`${defenses.detail.join("\n")}\nTouch ignores armor, shield, and natural armor bonuses, retains deflection and armor/load Dexterity limits. Flat-footed ${defenses.retainsDexterity ? "retains Dexterity with Uncanny Dodge" : "loses positive Dexterity, but retains penalties"}. Apply other unmodeled effects manually.`} />;
}

export function SavingThrowStat({ character, save, label, conditions = [] }: {
  character: Character;
  save: "fortitude" | "reflex" | "will";
  label: string;
  conditions?: SavingThrowCondition[];
}) {
  const result = getSavingThrow(character, save, conditions);
  return <Stat label={label} value={formatModifier(result.total)} detail={[result.detail]} title={result.title} />;
}

export function SpecialAttackStats({ character }: { character: Character }) {
  const attacks = getSpecialAttackBonuses(character);
  const unavailable = attacks.towerShieldCoverActive ? "Unavailable" : undefined;
  return <div className="special-attack-summary" role="group" aria-label="Touch attacks and grapple">
    <Stat label="Melee touch" value={unavailable ?? formatModifier(attacks.meleeTouch)} title={attacks.meleeDetail} />
    <Stat label="Ranged touch" value={unavailable ?? formatModifier(attacks.rangedTouch)} title={attacks.rangedDetail} />
    <Stat label="Grapple" value={unavailable ?? formatModifier(attacks.grapple)} title={attacks.grappleDetail} />
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
