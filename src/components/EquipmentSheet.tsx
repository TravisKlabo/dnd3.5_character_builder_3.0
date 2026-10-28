import { type Character } from "../domain";
import { Stat, ArmorClassStat, SpecialAttackStats, CombatMovementLine, RangedDistanceControl, TargetDamageReductionControl } from "./shared";
import { getCarriedWeight, getTwoWeaponAttackPenalty, getEquippedWeaponStats, getWeaponSizeHandling, getWeaponCompatibilityWarning, getMainWeaponGripState, getDoubleWeaponModeState, getTowerShieldState, getShieldBashState, getEffectiveWeaponKey, formatModifier, getInventoryEntryDetails, formatSpellSchool, adjustWandCharges, unequipInventoryItem, equipInventoryItem, removeInventoryItem } from "../rules";
import { getEncumbrance, getMovement } from "../rules";

export function EquipmentSheet({
  character,
  rangedTargetDistanceFeet,
  onRangedTargetDistanceFeetChange,
  targetDamageReduction,
  onTargetDamageReductionChange,
  onEquipmentChange,
  onMainWeaponGripChange,
  onDoubleWeaponModeChange,
  onDoubleWeaponPrimaryEndChange,
  onTowerShieldTotalCoverChange,
  onShieldBashModeChange,
  onCompositeBowStrengthRatingChange,
  onEquipmentAndInventoryChange,
}: {
  character: Character;
  rangedTargetDistanceFeet: number | undefined;
  onRangedTargetDistanceFeetChange: (distanceFeet: number | undefined) => void;
  targetDamageReduction: string;
  onTargetDamageReductionChange: (value: string) => void;
  onEquipmentChange: (equipment: Record<string, string>) => void;
  onMainWeaponGripChange: (grip: "one-handed" | "two-handed") => void;
  onDoubleWeaponModeChange: (enabled: boolean) => void;
  onDoubleWeaponPrimaryEndChange: (end: "first" | "second") => void;
  onTowerShieldTotalCoverChange: (enabled: boolean) => void;
  onShieldBashModeChange: (enabled: boolean) => void;
  onCompositeBowStrengthRatingChange: (weaponKey: string, rating: number) => void;
  onEquipmentAndInventoryChange: (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => void;
}) {
  const slots = [
    "Head",
    "Neck",
    "Shoulders",
    "Arms",
    "Hands",
    "Rings 1",
    "Rings 2",
    "Waist",
    "Feet",
    "Main Weapon",
    "Off Hand Weapon",
    "Ranged Weapon",
    "Armor",
    "Shield",
    "Miscellaneous",
  ];
  const equipment = character.equipment ?? {};
  const encumbrance = getEncumbrance(character);
  const movement = getMovement(character);
  const doubleWeaponModeState = getDoubleWeaponModeState(character);
  const towerShieldState = getTowerShieldState(character);
  const shieldBashState = getShieldBashState(character);
  const setSlot = (slot: string, value: string) =>
    onEquipmentChange({ ...equipment, [slot]: value });
  return (
    <div className="equipment-sheet">
      <div className="equipment-sheet-title">EQUIPMENT SLOTS</div>
      <div className="equipment-slot-grid">
        <div className="equipment-column">
          {slots.slice(0, 8).map((slot) => (
            <EquipmentSlot
              key={slot}
              label={slot}
              value={equipment[slot] ?? ""}
              onChange={(value) => setSlot(slot, value)}
            />
          ))}
        </div>
        <div className="equipment-figure" aria-hidden="true">
          EQUIP
        </div>
        <div className="equipment-column">
          {slots.slice(8).map((slot) => (
            <EquipmentSlot
              key={slot}
              label={slot}
              value={equipment[slot] ?? ""}
              onChange={(value) => setSlot(slot, value)}
            />
          ))}
        </div>
      </div>
      <div className="equipment-footer">
        <label>
          Runestones
          <input
            value={equipment.Runestones ?? ""}
            onChange={(event) => setSlot("Runestones", event.target.value)}
          />
        </label>
        <label>
          Currency
          <input
            value={equipment.Currency ?? ""}
            onChange={(event) => setSlot("Currency", event.target.value)}
          />
        </label>
      </div>
      <div className="equipment-summary">
        <Stat label="Load" value={encumbrance.load}
          title={`Light: up to ${encumbrance.capacity.light} lb.; medium: up to ${encumbrance.capacity.medium} lb.; heavy: up to ${encumbrance.capacity.heavy} lb.`} />
        <Stat label="Carried Weight" value={`${getCarriedWeight(character).toLocaleString()} lb.`} />
        <ArmorClassStat character={character} />
        <Stat label="Speed" value={`${movement.speed} ft.`} detail={movement.causes} />
      </div>
      {encumbrance.unknownWeights.length > 0 && <p className="combat-note" role="status">
        Load uses known weights only. Missing weight: {encumbrance.unknownWeights.join(", ")}.
      </p>}
      <div className="equipment-combat-summary">
        <h3>Weapon Attacks</h3>
        {towerShieldState.equipped && (
          <label className="weapon-grip-control">
            <input
              type="checkbox"
              aria-label="Use tower shield for total cover"
              checked={towerShieldState.coverActive}
              onChange={(event) => onTowerShieldTotalCoverChange(event.target.checked)}
            />
            Use tower shield for total cover (standard action)
          </label>
        )}
        {towerShieldState.coverActive && (
          <p className="combat-note" role="status">
            Total cover lasts until the start of your next turn. Attacks are unavailable; targeted spells can still target the shield. Clear this setting manually at the start of your turn.
          </p>
        )}
        {shieldBashState.hasBashableShield && (
          <label className="weapon-grip-control">
            <input
              type="checkbox"
              aria-label="Use shield bash"
              checked={shieldBashState.enabled}
              disabled={!shieldBashState.canBash}
              onChange={(event) => onShieldBashModeChange(event.target.checked)}
            />
            Use shield bash (off-hand attack)
          </label>
        )}
        {shieldBashState.enabled && (
          <p className="combat-note" role="status">
            The shield's AC bonus is lost until your next action, usually next round. Clear this setting manually when the bonus returns.
          </p>
        )}
        <SpecialAttackStats character={character} />
        <CombatMovementLine character={character} />
        <RangedDistanceControl
          distanceFeet={rangedTargetDistanceFeet}
          onChange={onRangedTargetDistanceFeetChange}
        />
        <TargetDamageReductionControl
          value={targetDamageReduction}
          onChange={onTargetDamageReductionChange}
        />
        {doubleWeaponModeState && <>
          <label className="weapon-grip-control">
            <input
              type="checkbox"
              aria-label="Use both ends of the double weapon"
              checked={doubleWeaponModeState.enabled}
              disabled={!doubleWeaponModeState.canUseBothEnds && !doubleWeaponModeState.enabled}
              onChange={(event) => onDoubleWeaponModeChange(event.target.checked)}
            />
            Use both ends (two-weapon penalties)
          </label>
          {doubleWeaponModeState.enabled && doubleWeaponModeState.hasDifferentEnds && (
            <label className="weapon-grip-control">
              Primary end
              <select
                aria-label="Double weapon primary end"
                value={doubleWeaponModeState.primaryEnd}
                onChange={(event) => onDoubleWeaponPrimaryEndChange(event.target.value as "first" | "second")}
              >
                <option value="first">{doubleWeaponModeState.firstEndLabel}</option>
                <option value="second">{doubleWeaponModeState.secondEndLabel}</option>
              </select>
            </label>
          )}
        </>}
        {(() => {
          const gripState = getMainWeaponGripState(character);
          return gripState ? (
            <label className="weapon-grip-control">
              Main weapon grip
              <select
                aria-label="Main weapon grip"
                value={gripState.grip}
                onChange={(event) => onMainWeaponGripChange(event.target.value as "one-handed" | "two-handed")}
              >
                <option value="one-handed">One-handed</option>
                <option value="two-handed" disabled={!gripState.canUseTwoHands}>Two-handed</option>
              </select>
            </label>
          ) : null;
        })()}
        {(["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const).map((slot) => {
          const twoWeaponPenalty = slot === "Main Weapon" || slot === "Off Hand Weapon"
            ? getTwoWeaponAttackPenalty(character, slot)
            : 0;
          const weaponKey = getEffectiveWeaponKey(character, slot);
          const sizeHandling = weaponKey ? getWeaponSizeHandling(character, weaponKey, slot) : null;
          const compatibilityWarning = weaponKey
            ? getWeaponCompatibilityWarning(character, weaponKey, slot)
            : null;
          const stats = weaponKey
            ? getEquippedWeaponStats(character, weaponKey, twoWeaponPenalty, slot, [], rangedTargetDistanceFeet, targetDamageReduction)
            : null;
          return (
            <div className="equipment-weapon-stat" key={slot}>
              <strong>{slot}</strong>
              {stats && weaponKey ? (
                <div className="equipment-weapon-details">
                  <strong>{stats.name}</strong>
                  {stats.compositeBowStrengthRating !== undefined && <>
                    <label className="weapon-grip-control">
                      {slot} composite bow Strength rating
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`${slot} composite bow Strength rating`}
                        value={stats.compositeBowStrengthRating}
                        onChange={(event) => {
                          const input = event.currentTarget;
                          const rating = input.valueAsNumber;
                          if (!input.validity.valid || !Number.isSafeInteger(rating) || rating < 0) {
                            input.setCustomValidity("Enter a nonnegative whole-number Strength rating.");
                            input.reportValidity();
                            return;
                          }
                          input.setCustomValidity("");
                          onCompositeBowStrengthRatingChange(weaponKey, rating);
                        }}
                      />
                    </label>
                    <small>Strength below the rating gives -2 attack; positive Strength damage is capped at the rating. Each point adds 100 gp for a longbow or 75 gp for a shortbow; adjust currency manually.</small>
                  </>}
                  {stats.attackSequence.length > 1 && <span title={stats.attackSequenceNote}>BAB full attack: {stats.attackSequence.map(formatModifier).join(" / ")}</span>}
                  {stats.rangeIncrement && <span>{stats.rangeLabel}: {stats.rangeIncrement}</span>}
                  {stats.reach && <span>Reach: {stats.reach}</span>}
                  <span title={[stats.weaponSizeDetail, stats.rangeStatusMessage].filter(Boolean).join("\n")}>Attack: {stats.rangeOutOfRange ? "OUT OF RANGE" : formatModifier(stats.attack)} ({formatModifier(stats.baseAttackBonus)} base, {formatModifier(stats.abilityAttackBonus)} ability, {formatModifier(stats.sizeAttackBonus)} size{stats.weaponSizePenalty !== 0 ? `, ${formatModifier(stats.weaponSizePenalty)} weapon size` : ""}{stats.rangeAttackPenalty !== 0 ? `, ${formatModifier(stats.rangeAttackPenalty)} range` : ""}, {formatModifier(stats.attackEnhancement)} enhancement{stats.weaponFocusBonus ? `, +${stats.weaponFocusBonus} Weapon Focus` : ""}{stats.attackPenalty !== 0 ? `, ${formatModifier(stats.attackPenalty)} two-weapon` : ""}{stats.finessePenalty !== 0 ? `, ${formatModifier(stats.finessePenalty)} finesse shield penalty` : ""}{stats.nonproficiencyPenalty !== 0 ? `, ${formatModifier(stats.nonproficiencyPenalty)} nonproficiency` : ""}{stats.towerShieldAttackPenalty !== 0 ? `, ${formatModifier(stats.towerShieldAttackPenalty)} tower shield` : ""}{stats.compositeBowStrengthPenalty !== 0 ? `, ${formatModifier(stats.compositeBowStrengthPenalty)} composite-bow rating` : ""})</span>
                  {stats.maximumRangeFeet !== undefined && <span>Maximum range: {stats.maximumRangeFeet} ft.</span>}
                  {stats.rangeStatusMessage && <span className={stats.rangeOutOfRange ? "combat-warning" : ""} role="status">{stats.rangeStatusMessage}</span>}
                  {stats.ammunitionStatus && <span className={stats.ammunitionStatus.status === "ready" ? "" : "combat-warning"} role={stats.ammunitionStatus.status === "missing" ? "alert" : "status"}>{stats.ammunitionStatus.message}</span>}
                  {stats.damageReductionStatus && <span className={stats.damageReductionStatus.status === "applies" || stats.damageReductionStatus.status === "manual" ? "combat-warning" : ""} role="status">{stats.damageReductionStatus.message}</span>}
                  {stats.reloadNote && <span>{stats.reloadNote}</span>}
                  {stats.nonproficiencyPenalty < 0 && <span className="attack-penalty"
                    title={stats.nonproficiencyPenalties.map((entry) => `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency`).join("\n")}>
                    {stats.nonproficiencyPenalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`).join(", ")}
                  </span>}
                  {stats.towerShieldAttackPenalty < 0 && <span className="attack-penalty">
                    Tower shield: {formatModifier(stats.towerShieldAttackPenalty)} attack
                  </span>}
                  {stats.compositeBowStrengthPenalty < 0 && <span className="attack-penalty">
                    Composite bow rating: {formatModifier(stats.compositeBowStrengthPenalty)} attack
                  </span>}
                  {twoWeaponPenalty !== 0 && <span>Two-weapon penalty: {formatModifier(twoWeaponPenalty)} attack</span>}
                  {stats.twoHandedGrip && <span>Two-handed grip</span>}
                  {stats.bucklerAttackPenalty !== 0 && <span>Buckler use: {formatModifier(stats.bucklerAttackPenalty)} attack</span>}
                  {stats.weaponSizePenalty < 0 && <span className="attack-penalty" title={stats.weaponSizeDetail}>
                    Weapon-size mismatch: {formatModifier(stats.weaponSizePenalty)} attack; treated as {stats.effectiveHandedness}.
                  </span>}
                  <span>Damage: {stats.damage} ({stats.damageType})</span>
                  {stats.materialDamageNote && <span className="combat-warning">{stats.materialDamageNote}</span>}
                  {stats.weaponSpecializationBonus > 0 && <span>Weapon Specialization: +2 damage</span>}
                  <span>Critical: {stats.critical}</span>
                  {stats.enchantmentDamage.map((damage) => <span key={damage}>{damage}</span>)}
                </div>
              ) : (
                <span title={compatibilityWarning ?? sizeHandling?.warning}>
                  {towerShieldState.coverActive && weaponKey
                    ? "Unavailable while using tower shield for total cover"
                    : compatibilityWarning ?? (sizeHandling && !sizeHandling.wieldable ? "Cannot wield: incompatible weapon size" : "Not equipped")}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <InventorySummary
        character={character}
        onEquipmentChange={onEquipmentChange}
        onEquipmentAndInventoryChange={onEquipmentAndInventoryChange}
      />
    </div>
  );
}

export function InventorySummary({
  character,
  onEquipmentChange,
  onEquipmentAndInventoryChange,
}: {
  character: Character;
  onEquipmentChange: (equipment: Record<string, string>) => void;
  onEquipmentAndInventoryChange: (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => void;
}) {
  const entries = Object.entries(character.inventory ?? {}).map(([key, quantity]) => {
    const details = getInventoryEntryDetails(key, character.compositeBowStrengthRatings?.[key] ?? 0);
    return { key, quantity, ...details, totalWeight: details.numericWeight * quantity };
  });
  const totalWeight = entries.reduce((total, entry) => total + entry.totalWeight, 0);
  return (
    <section className="equipment-inventory" aria-labelledby="equipment-summary-inventory-title">
      <div className="equipment-inventory-header">
        <h3 id="equipment-summary-inventory-title">Inventory</h3>
        <strong>{totalWeight.toLocaleString()} lb. total</strong>
      </div>
      {entries.length ? (
        <div className="equipment-inventory-list">
          {entries.map((entry) => (
            <div className="equipment-inventory-row" key={entry.key}>
              <div className="equipment-inventory-name">
                <span className="tooltip-anchor">
                  <strong tabIndex={0}>{entry.name} ({entry.size[0]})</strong>
                  <span className="inline-tooltip" role="tooltip">
                    <strong>{entry.name}</strong>
                    <br />
                    {entry.spell ? <>{entry.spell.description}<br />Spell level: {entry.spell.level}; school: {formatSpellSchool(entry.spell.school)}.</> : entry.description}
                    <br />
                    Category: {entry.category}; size: {entry.size}; weight: {entry.weight}.
                    {entry.price !== undefined && <><br />Store price: {entry.price.toLocaleString()} gp.</>}
                    {entry.name.startsWith("Wand of ") && entry.key.match(/\(CL \d+, (\d+) charges\)$/) && <><br />Remaining charges: {entry.key.match(/\(CL \d+, (\d+) charges\)$/)?.[1]} of 50.</>}
                  </span>
                </span>
                <small>{entry.description}</small>
              </div>
              {entry.name.startsWith("Wand of ") && entry.key.match(/\(CL \d+, (\d+) charges\)$/) ? (
                <span className="wand-charge-control">
                  <small>Charges</small>
                  <button
                    type="button"
                    aria-label="Use one wand charge"
                    disabled={Number(entry.key.match(/\(CL \d+, (\d+) charges\)$/)?.[1] ?? 0) <= 0}
                    onClick={() => adjustWandCharges(character, entry.key, -1, onEquipmentAndInventoryChange)}
                  >
                    −
                  </button>
                  <strong>{entry.key.match(/\(CL \d+, (\d+) charges\)$/)?.[1] ?? 0}</strong>
                  <button
                    type="button"
                    aria-label="Restore one wand charge"
                    disabled={Number(entry.key.match(/\(CL \d+, (\d+) charges\)$/)?.[1] ?? 0) >= 50}
                    onClick={() => adjustWandCharges(character, entry.key, 1, onEquipmentAndInventoryChange)}
                  >
                    +
                  </button>
                </span>
              ) : <span>Qty. {entry.quantity}</span>}
              <span>{entry.weight} each</span>
              <span>{entry.totalWeight ? `${entry.totalWeight} lb. total` : "Weight varies"}</span>
              <span className="equipment-inventory-actions">
                {Object.values(character.equipment ?? {}).includes(entry.key) ? (
                  <button type="button" className="is-equipped" onClick={() => unequipInventoryItem(character, entry.key, onEquipmentChange)}>Unequip</button>
                ) : (
                  <button type="button" onClick={() => equipInventoryItem(character, entry.key, onEquipmentChange)}>Equip</button>
                )}
                <button type="button" onClick={() => removeInventoryItem(character, entry.key, onEquipmentAndInventoryChange)}>Remove</button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="equipment-inventory-empty">No items purchased yet.</p>
      )}
    </section>
  );
}

export function EquipmentSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="equipment-slot">
      <h3>{label}</h3>
      <div className="equipment-slot-control">
        <input
          aria-label={`${label} equipment`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=""
        />
        {value && (
          <button type="button" onClick={() => onChange("")}>
            Unequip
          </button>
        )}
      </div>
    </section>
  );
}
