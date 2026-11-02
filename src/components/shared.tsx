import { contentSources, type Character, type CombatTargetType, type ContentSourceId, type SavingThrowCondition } from "../domain";
import { formatModifier, getArmorClassValues, getArmorClassRestrictions, getSpecialAttackBonuses, getCombatSpace, getEncumbrance, getSavingThrow, getCombatExpertiseAmount, getCombatExpertiseLimit, getPowerAttackAmount, getPowerAttackLimit, getDodgeFeatBonus, getAttackOfOpportunityCapacity } from "../rules";
import { combatCastingContextOptions, getCombatCastingBonus, type CombatCastingContext } from "../rules";

export function CombatCastingContextControl({ character, context, onChange }: {
  character: Character;
  context?: CombatCastingContext;
  onChange: (context: CombatCastingContext | undefined) => void;
}) {
  if (!getCombatCastingBonus(character, "defensive-casting")) return null;
  return (
    <label className="skill-check-context">
      <span>Combat Casting context</span>
      <select
        aria-label="Combat Casting context"
        value={context ?? ""}
        onChange={(event) => {
          const selected = combatCastingContextOptions.find(
            (option) => option.value === event.currentTarget.value,
          )?.value;
          onChange(selected);
        }}
      >
        <option value="">No active context</option>
        {combatCastingContextOptions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <small>Session-only; applies +4 to Concentration checks while casting defensively, grappled, or pinned.</small>
    </label>
  );
}

export function ContentSourceLabel({ source, book }: { source: ContentSourceId; book?: string }) {
  return (
    <small className="content-source-label">
      Source: {contentSources[source].name}{book ? `; Book: ${book}` : ""}
    </small>
  );
}

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
      <small>Supports cold iron, silver, adamantine, magic, and their and/or combinations. Alignment, epic, and other qualifiers remain manual; this context is not saved.</small>
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

export function CombatExpertiseControl({ character, amount, onChange }: {
  character: Character;
  amount: number;
  onChange: (amount: number) => void;
}) {
  const limit = getCombatExpertiseLimit(character);
  if (limit === 0) return null;
  const selectedAmount = getCombatExpertiseAmount(character, amount);
  return (
    <div className="combat-expertise-control">
      <label className="weapon-grip-control">
        Combat Expertise attack penalty
        <select
          aria-label="Combat Expertise attack penalty"
          value={String(selectedAmount)}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        >
          <option value="0">Off</option>
          {Array.from({ length: limit }, (_, index) => index + 1).map((value) => (
            <option value={value} key={value}>
              -{value} attack / +{value} dodge AC
            </option>
          ))}
        </select>
      </label>
      <small>Session-only. Applies to melee attack/full attack actions until your next action; clear it manually then.</small>
    </div>
  );
}

export function PowerAttackControl({ character, amount, onChange }: {
  character: Character;
  amount: number;
  onChange: (amount: number) => void;
}) {
  const limit = getPowerAttackLimit(character);
  if (limit === 0) return null;
  const selectedAmount = getPowerAttackAmount(character, amount);
  return (
    <div className="power-attack-control">
      <label className="weapon-grip-control">
        Power Attack penalty
        <select
          aria-label="Power Attack penalty"
          value={String(selectedAmount)}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        >
          <option value="0">Off</option>
          {Array.from({ length: limit }, (_, index) => index + 1).map((value) => (
            <option value={value} key={value}>
              -{value} melee attack
            </option>
          ))}
        </select>
      </label>
      <small>Session-only until your next turn; clear it manually then. Two-handed weapons double the damage bonus; light weapons get none. Unarmed and natural-weapon attacks aren't represented in weapon rows.</small>
    </div>
  );
}

export function DodgeTargetControl({ character, selectedOpponent, onChange }: {
  character: Character;
  selectedOpponent: boolean;
  onChange: (selected: boolean) => void;
}) {
  if (getDodgeFeatBonus(character, true) === 0) return null;
  return (
    <div className="dodge-target-control">
      <label className="weapon-grip-control">
        <input
          type="checkbox"
          aria-label="Apply Dodge against current opponent"
          checked={selectedOpponent}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        Apply Dodge +1 AC against current opponent
      </label>
      <small>Session-only. Select the opponent chosen for Dodge; its bonus is lost when you are denied your Dexterity bonus, including while flat-footed unless Uncanny Dodge applies.</small>
    </div>
  );
}

export function ArmorClassStat({
  character,
  targetTypes = [],
  combatExpertiseAmount = 0,
  dodgeTargetSelected = false,
}: {
  character: Character;
  targetTypes?: CombatTargetType[];
  combatExpertiseAmount?: number;
  dodgeTargetSelected?: boolean;
}) {
  const defenses = getArmorClassValues(
    character,
    targetTypes,
    combatExpertiseAmount,
    dodgeTargetSelected,
  );
  return <Stat label="Armor Class" value={String(defenses.normal)}
    detail={[
      `Touch ${defenses.touch}`,
      `Flat-footed ${defenses.flatFooted}`,
      ...(defenses.dodgeFeatBonus ? ["+1 Dodge AC against selected opponent"] : []),
      ...(defenses.towerShieldCoverActive ? ["Total cover via tower shield; no attacks until the start of your next turn."] : []),
      ...(defenses.shieldBashACBonusLost ? ["Shield AC bonus lost until your next action after a shield bash."] : []),
      ...getArmorClassRestrictions(character),
    ]}
    title={`${defenses.detail.join("\n")}\nTouch ignores armor, shield, and natural armor bonuses, retains deflection and armor/load Dexterity limits. Flat-footed ${defenses.retainsDexterity ? "retains Dexterity with Uncanny Dodge" : "loses positive Dexterity, but retains penalties"}. Apply other unmodeled effects manually.`} />;
}

export function AttacksOfOpportunityStat({ character }: { character: Character }) {
  const capacity = getAttackOfOpportunityCapacity(character);
  return <Stat
    label="Attacks of Opportunity"
    value={String(capacity.maximumPerRound)}
    detail={[
      "Maximum per round; track spent attacks and movement triggers manually.",
      capacity.hasCombatReflexes
        ? `Combat Reflexes: ${capacity.additionalAttacks} additional from DEX ${formatModifier(capacity.dexterityBonus)}; can attack while flat-footed.`
        : "One per round; cannot attack while flat-footed.",
    ]}
  />;
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
