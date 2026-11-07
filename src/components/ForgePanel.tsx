import { type Character } from "../domain";
import { getRaceDefinitionForCharacter } from "../rules";
import {
  storeItems,
  forgeWeaponProperties,
  forgeArmorProperties,
  forgeShieldProperties,
  weaponDamageTypes,
  type StoreItem,
} from "../data/equipmentCatalog";
import { useState } from "react";

const maximumEffectiveBonus = 10;

function isAlreadyMasterwork(item: StoreItem | undefined) {
  return Boolean(item && /^(?:Masterwork|Mithral) /.test(item.name));
}

function getWeaponDamageType(item: StoreItem | undefined) {
  if (!item) return "";
  const baseName = item.name.replace(/^(?:Masterwork|Cold Iron|Silver|Mithral) /, "");
  return item.damageType ?? weaponDamageTypes[item.name] ?? weaponDamageTypes[baseName] ?? "";
}

function canApplyWeaponProperty(name: string, item: StoreItem | undefined) {
  return name !== "Keen" || /piercing|slashing/i.test(getWeaponDamageType(item));
}

function canApplyShieldProperty(name: string, item: StoreItem | undefined) {
  return name !== "Bashing" || Boolean(
    item && (
      item.shieldType === "Light" ||
      item.shieldType === "Heavy" ||
      /^(?:Light|Heavy) (?:Wooden|Steel) Shield(?: with Spikes)?$/.test(item.name)
    ),
  );
}

export function ForgePanel({
  character,
  onInventoryChange,
}: {
  character: Character;
  onInventoryChange: (inventory: Record<string, number>) => void;
}) {
  const weapons = storeItems.filter((item) =>
    item.category === "Weapons" && item.name !== "Unarmed Strike",
  );
  const [weaponName, setWeaponName] = useState(weapons[0]?.name ?? "");
  const [enhancement, setEnhancement] = useState(1);
  const [propertyName, setPropertyName] = useState("");
  const [propertyNames, setPropertyNames] = useState<string[]>([]);
  const armors = storeItems.filter((item) => item.category === "Armor");
  const [armorName, setArmorName] = useState(armors[0]?.name ?? "");
  const [armorEnhancement, setArmorEnhancement] = useState(1);
  const [armorPropertyName, setArmorPropertyName] = useState("");
  const [armorPropertyNames, setArmorPropertyNames] = useState<string[]>([]);
  const shields = storeItems.filter((item) => item.category === "Shields");
  const [shieldName, setShieldName] = useState(shields[0]?.name ?? "");
  const [shieldEnhancement, setShieldEnhancement] = useState(1);
  const [shieldPropertyName, setShieldPropertyName] = useState("");
  const [shieldPropertyNames, setShieldPropertyNames] = useState<string[]>([]);
  const selectedWeapon = weapons.find((item) => item.name === weaponName);
  const selectedProperties = forgeWeaponProperties.filter((entry) => propertyNames.includes(entry.name));
  const propertyBonus = selectedProperties.reduce((total, entry) => total + entry.bonus, 0);
  const enhancementCost = enhancement * enhancement * 2000;
  const weaponMasterworkCost = selectedWeapon && !isAlreadyMasterwork(selectedWeapon) ? 300 : 0;
  const coldIronEnhancementCost = selectedWeapon?.material === "cold-iron" ? 2000 : 0;
  const propertyCost = propertyBonus
    ? (enhancement + propertyBonus) * (enhancement + propertyBonus) * 2000 - enhancementCost
    : 0;
  const totalCost = (selectedWeapon?.price ?? 0) + weaponMasterworkCost +
    coldIronEnhancementCost + enhancementCost + propertyCost;
  const forgedName = `${selectedProperties.length ? `${selectedProperties.map((entry) => entry.name).join(" ")} ` : ""}+${enhancement} ${weaponName} (${getRaceDefinitionForCharacter(character)?.size ?? "Medium"})`;
  const forge = () => {
    if (!selectedWeapon) return;
    const inventory = { ...(character.inventory ?? {}) };
    inventory[forgedName] = (inventory[forgedName] ?? 0) + 1;
    onInventoryChange(inventory);
    setEnhancement(1);
    setPropertyName("");
    setPropertyNames([]);
  };
  const selectedArmor = armors.find((item) => item.name === armorName);
  const selectedArmorProperties = forgeArmorProperties.filter((entry) => armorPropertyNames.includes(entry.name));
  const armorPropertyBonus = selectedArmorProperties.reduce((total, entry) => total + entry.bonus, 0);
  const armorEnhancementCost = armorEnhancement * armorEnhancement * 1000;
  const armorMasterworkCost = selectedArmor && !isAlreadyMasterwork(selectedArmor) ? 150 : 0;
  const armorPropertyCost = (armorEnhancement + armorPropertyBonus) ** 2 * 1000 - armorEnhancementCost + selectedArmorProperties.reduce((total, entry) => total + (entry.flatCost ?? 0), 0);
  const forgedArmorName = `${selectedArmorProperties.length ? `${selectedArmorProperties.map((entry) => entry.name).join(" ")} ` : ""}+${armorEnhancement} ${armorName} (${getRaceDefinitionForCharacter(character)?.size ?? "Medium"})`;
  const forgeArmor = () => {
    if (!selectedArmor) return;
    const inventory = { ...(character.inventory ?? {}) };
    inventory[forgedArmorName] = (inventory[forgedArmorName] ?? 0) + 1;
    onInventoryChange(inventory);
    setArmorEnhancement(1);
    setArmorPropertyName("");
    setArmorPropertyNames([]);
  };
  const selectedShield = shields.find((item) => item.name === shieldName);
  const selectedShieldProperties = forgeShieldProperties.filter((entry) => shieldPropertyNames.includes(entry.name));
  const shieldPropertyBonus = selectedShieldProperties.reduce((total, entry) => total + entry.bonus, 0);
  const shieldEnhancementCost = shieldEnhancement * shieldEnhancement * 1000;
  const shieldMasterworkCost = selectedShield && !isAlreadyMasterwork(selectedShield) ? 150 : 0;
  const shieldPropertyCost = (shieldEnhancement + shieldPropertyBonus) ** 2 * 1000 - shieldEnhancementCost;
  const forgedShieldName = `${selectedShieldProperties.length ? `${selectedShieldProperties.map((entry) => entry.name).join(" ")} ` : ""}+${shieldEnhancement} ${shieldName} (${getRaceDefinitionForCharacter(character)?.size ?? "Medium"})`;
  const forgeShield = () => {
    if (!selectedShield) return;
    const inventory = { ...(character.inventory ?? {}) };
    inventory[forgedShieldName] = (inventory[forgedShieldName] ?? 0) + 1;
    onInventoryChange(inventory);
    setShieldEnhancement(1);
    setShieldPropertyName("");
    setShieldPropertyNames([]);
  };
  return (
    <section className="forge-panel panel">
      <div className="panel-title">
        <h2>Forge</h2>
        <span className="rule-status">Magical weapon creation</span>
      </div>
      <div className="forge-content">
        <p className="forge-intro">Create a magical weapon and add it to the character's inventory.</p>
        <div className="forge-grid">
          <label>
            Base weapon
            <select value={weaponName} onChange={(event) => {
              const nextName = event.target.value;
              const nextWeapon = weapons.find((item) => item.name === nextName);
              setWeaponName(nextName);
              setPropertyNames((current) => current.filter((name) => canApplyWeaponProperty(name, nextWeapon)));
              setPropertyName((current) => current && canApplyWeaponProperty(current, nextWeapon) ? current : "");
            }}>
              {weapons.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label>
            Enhancement bonus
            <select value={enhancement} onChange={(event) => setEnhancement(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].filter((bonus) => bonus + propertyBonus <= maximumEffectiveBonus).map((bonus) => {
                const change = (bonus * bonus - enhancement * enhancement) * 2000;
                const costLabel = change > 0
                  ? `adds ${change.toLocaleString()} gp`
                  : change < 0
                    ? `subtracts ${Math.abs(change).toLocaleString()} gp`
                    : "no cost change";
                return <option key={bonus} value={bonus}>+{bonus} - {costLabel}</option>;
              })}
            </select>
          </label>
          <label>
            Add special property
            <span className="forge-property-control">
              <select value={propertyName} onChange={(event) => setPropertyName(event.target.value)}>
                <option value="">None</option>
                {forgeWeaponProperties.filter((entry) =>
                  !propertyNames.includes(entry.name) &&
                  canApplyWeaponProperty(entry.name, selectedWeapon) &&
                  enhancement + propertyBonus + entry.bonus <= maximumEffectiveBonus
                ).map((entry) => {
                  const priorCost = (enhancement + propertyBonus) ** 2 * 2000;
                  const nextCost = (enhancement + propertyBonus + entry.bonus) ** 2 * 2000;
                  return <option key={entry.name} value={entry.name}>{entry.name} (+{entry.bonus}) - adds {(nextCost - priorCost).toLocaleString()} gp</option>;
                })}
              </select>
              <button
                className="forge-add-property-button"
                type="button"
                aria-label={propertyName ? `Add ${propertyName} property` : "Choose a property to add"}
                title={propertyName ? `Add ${propertyName} property` : "Choose a property first"}
                onClick={() => {
                  const property = forgeWeaponProperties.find((entry) => entry.name === propertyName);
                  if (property && canApplyWeaponProperty(property.name, selectedWeapon) &&
                    enhancement + propertyBonus + property.bonus <= maximumEffectiveBonus) {
                    setPropertyNames((current) => [...current, property.name]);
                    setPropertyName("");
                  }
                }}
                disabled={!propertyName || !canApplyWeaponProperty(propertyName, selectedWeapon)}
              >
                <span aria-hidden="true">+</span>
              </button>
            </span>
          </label>
        </div>
        <div className="forge-preview">
          <strong>{forgedName}</strong>
          <span>{selectedProperties.length ? selectedProperties.map((entry) => entry.description).join(" ") : "No special property selected."}</span>
          <span>Base weapon: {(selectedWeapon?.price ?? 0).toLocaleString()} gp</span>
          {weaponMasterworkCost > 0 && <span>Masterwork quality: +{weaponMasterworkCost.toLocaleString()} gp</span>}
          {coldIronEnhancementCost > 0 && <span>Cold iron magical enhancement: +{coldIronEnhancementCost.toLocaleString()} gp</span>}
          <span>Enhancement: +{enhancementCost.toLocaleString()} gp</span>
          {selectedProperties.map((entry, index) => {
            const priorBonus = selectedProperties.slice(0, index).reduce((total, item) => total + item.bonus, 0);
            const addedCost = (enhancement + priorBonus + entry.bonus) ** 2 * 2000 - (enhancement + priorBonus) ** 2 * 2000;
            return <span key={entry.name}>{entry.name}: +{addedCost.toLocaleString()} gp</span>;
          })}
          <strong>Total price: {totalCost.toLocaleString()} gp</strong>
        </div>
        <button className="level-button" type="button" onClick={forge} disabled={!selectedWeapon}>Forge Weapon</button>
        <div className="forge-divider" />
        <h3>Forge Armor</h3>
        <div className="forge-grid">
          <label>Base armor<select value={armorName} onChange={(event) => setArmorName(event.target.value)}>{armors.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label>Enhancement bonus<select value={armorEnhancement} onChange={(event) => setArmorEnhancement(Number(event.target.value))}>{[1, 2, 3, 4, 5].filter((bonus) => bonus + armorPropertyBonus <= maximumEffectiveBonus).map((bonus) => { const change = (bonus * bonus - armorEnhancement * armorEnhancement) * 1000; const label = change > 0 ? `adds ${change.toLocaleString()} gp` : change < 0 ? `subtracts ${Math.abs(change).toLocaleString()} gp` : "no cost change"; return <option key={bonus} value={bonus}>+{bonus} - {label}</option>; })}</select></label>
          <label>Add special property<span className="forge-property-control"><select value={armorPropertyName} onChange={(event) => setArmorPropertyName(event.target.value)}><option value="">None</option>{forgeArmorProperties.filter((entry) => !armorPropertyNames.includes(entry.name) && armorEnhancement + armorPropertyBonus + entry.bonus <= maximumEffectiveBonus).map((entry) => { const prior = (armorEnhancement + armorPropertyBonus) ** 2 * 1000; const next = (armorEnhancement + armorPropertyBonus + entry.bonus) ** 2 * 1000; const change = next - prior + (entry.flatCost ?? 0); return <option key={entry.name} value={entry.name}>{entry.name} {entry.bonus ? `(+${entry.bonus})` : ""} - adds {change.toLocaleString()} gp</option>; })}</select><button className="forge-add-property-button" type="button" onClick={() => { const property = forgeArmorProperties.find((entry) => entry.name === armorPropertyName); if (property && armorEnhancement + armorPropertyBonus + property.bonus <= maximumEffectiveBonus) { setArmorPropertyNames((current) => [...current, property.name]); setArmorPropertyName(""); } }} disabled={!armorPropertyName} aria-label="Add armor property">+</button></span></label>
        </div>
        <div className="forge-preview"><strong>{forgedArmorName}</strong><span>Base armor: {(selectedArmor?.price ?? 0).toLocaleString()} gp</span>{armorMasterworkCost > 0 && <span>Masterwork quality: +{armorMasterworkCost.toLocaleString()} gp</span>}<span>Enhancement: +{armorEnhancementCost.toLocaleString()} gp</span>{selectedArmorProperties.map((entry) => <span key={entry.name}>{entry.name}: +{(entry.flatCost ?? 0).toLocaleString()} gp{entry.bonus ? " plus equivalent bonus cost" : ""}</span>)}<strong>Total price: {((selectedArmor?.price ?? 0) + armorMasterworkCost + armorEnhancementCost + armorPropertyCost).toLocaleString()} gp</strong></div>
        <button className="level-button" type="button" onClick={forgeArmor} disabled={!selectedArmor}>Forge Armor</button>
        <div className="forge-divider" />
        <h3>Forge Shield</h3>
        <div className="forge-grid">
          <label>Base shield<select value={shieldName} onChange={(event) => {
            const nextName = event.target.value;
            const nextShield = shields.find((item) => item.name === nextName);
            setShieldName(nextName);
            setShieldPropertyNames((current) => current.filter((name) => canApplyShieldProperty(name, nextShield)));
            setShieldPropertyName((current) => current && canApplyShieldProperty(current, nextShield) ? current : "");
          }}>{shields.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label>Enhancement bonus<select value={shieldEnhancement} onChange={(event) => setShieldEnhancement(Number(event.target.value))}>{[1, 2, 3, 4, 5].filter((bonus) => bonus + shieldPropertyBonus <= maximumEffectiveBonus).map((bonus) => { const change = (bonus * bonus - shieldEnhancement * shieldEnhancement) * 1000; const label = change > 0 ? `adds ${change.toLocaleString()} gp` : change < 0 ? `subtracts ${Math.abs(change).toLocaleString()} gp` : "no cost change"; return <option key={bonus} value={bonus}>+{bonus} - {label}</option>; })}</select></label>
          <label>Add special property<span className="forge-property-control"><select value={shieldPropertyName} onChange={(event) => setShieldPropertyName(event.target.value)}><option value="">None</option>{forgeShieldProperties.filter((entry) => !shieldPropertyNames.includes(entry.name) && canApplyShieldProperty(entry.name, selectedShield) && shieldEnhancement + shieldPropertyBonus + entry.bonus <= maximumEffectiveBonus).map((entry) => { const prior = (shieldEnhancement + shieldPropertyBonus) ** 2 * 1000; const next = (shieldEnhancement + shieldPropertyBonus + entry.bonus) ** 2 * 1000; return <option key={entry.name} value={entry.name}>{entry.name} (+{entry.bonus}) - adds {(next - prior).toLocaleString()} gp</option>; })}</select><button className="forge-add-property-button" type="button" onClick={() => { const property = forgeShieldProperties.find((entry) => entry.name === shieldPropertyName); if (property && canApplyShieldProperty(property.name, selectedShield) && shieldEnhancement + shieldPropertyBonus + property.bonus <= maximumEffectiveBonus) { setShieldPropertyNames((current) => [...current, property.name]); setShieldPropertyName(""); } }} disabled={!shieldPropertyName || !canApplyShieldProperty(shieldPropertyName, selectedShield)} aria-label="Add shield property">+</button></span></label>
        </div>
        <div className="forge-preview"><strong>{forgedShieldName}</strong><span>Base shield: {(selectedShield?.price ?? 0).toLocaleString()} gp</span>{shieldMasterworkCost > 0 && <span>Masterwork quality: +{shieldMasterworkCost.toLocaleString()} gp</span>}<span>Enhancement: +{shieldEnhancementCost.toLocaleString()} gp</span>{selectedShieldProperties.map((entry) => <span key={entry.name}>{entry.name}: equivalent +{entry.bonus}</span>)}<strong>Total price: {((selectedShield?.price ?? 0) + shieldMasterworkCost + shieldEnhancementCost + shieldPropertyCost).toLocaleString()} gp</strong></div>
        <button className="level-button" type="button" onClick={forgeShield} disabled={!selectedShield}>Forge Shield</button>
      </div>
    </section>
  );
}
