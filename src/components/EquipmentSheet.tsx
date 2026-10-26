import { type Character } from "../domain";
import { Stat, ArmorClassStat, SpecialAttackStats, CombatMovementLine } from "./shared";
import { getCarriedWeight, getTwoWeaponAttackPenalty, getEquippedWeaponStats, formatModifier, getInventoryEntryDetails, formatSpellSchool, adjustWandCharges, unequipInventoryItem, equipInventoryItem, removeInventoryItem } from "../rules";
import { getEncumbrance, getMovement } from "../rules";

export function EquipmentSheet({
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
        <SpecialAttackStats character={character} />
        <CombatMovementLine character={character} />
        {(["Main Weapon", "Off Hand Weapon", "Ranged Weapon"] as const).map((slot) => {
          const twoWeaponPenalty = slot === "Main Weapon" || slot === "Off Hand Weapon"
            ? getTwoWeaponAttackPenalty(character, slot)
            : 0;
          const stats = equipment[slot]
            ? getEquippedWeaponStats(character, equipment[slot], twoWeaponPenalty, slot)
            : null;
          return (
            <div className="equipment-weapon-stat" key={slot}>
              <strong>{slot}</strong>
              {stats ? (
                <div className="equipment-weapon-details">
                  <strong>{stats.name}</strong>
                  {stats.attackSequence.length > 1 && <span title={stats.attackSequenceNote}>BAB full attack: {stats.attackSequence.map(formatModifier).join(" / ")}</span>}
                  {stats.rangeIncrement && <span>{stats.rangeLabel}: {stats.rangeIncrement}</span>}
                  {stats.reach && <span>Reach: {stats.reach}</span>}
                  <span>Attack: {formatModifier(stats.attack)} ({formatModifier(stats.baseAttackBonus)} base, {formatModifier(stats.abilityAttackBonus)} ability, {formatModifier(stats.sizeAttackBonus)} size, {formatModifier(stats.attackEnhancement)} enhancement{stats.attackPenalty !== 0 ? `, ${formatModifier(stats.attackPenalty)} two-weapon` : ""}{stats.finessePenalty !== 0 ? `, ${formatModifier(stats.finessePenalty)} finesse shield penalty` : ""}{stats.nonproficiencyPenalty !== 0 ? `, ${formatModifier(stats.nonproficiencyPenalty)} armor/shield nonproficiency` : ""})</span>
                  {stats.nonproficiencyPenalty < 0 && <span className="attack-penalty"
                    title={stats.nonproficiencyPenalties.map((entry) => `${entry.name}: ${formatModifier(entry.penalty)} nonproficiency`).join("\n")}>
                    {stats.nonproficiencyPenalties.map((entry) => `${formatModifier(entry.penalty)} ${entry.source}`).join(", ")}
                  </span>}
                  {twoWeaponPenalty !== 0 && <span>Two-weapon penalty: {formatModifier(twoWeaponPenalty)} attack</span>}
                  <span>Damage: {stats.damage} ({stats.damageType})</span>
                  <span>Critical: {stats.critical}</span>
                  {stats.enchantmentDamage.map((damage) => <span key={damage}>{damage}</span>)}
                </div>
              ) : (
                <span>Not equipped</span>
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
    const details = getInventoryEntryDetails(key);
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
