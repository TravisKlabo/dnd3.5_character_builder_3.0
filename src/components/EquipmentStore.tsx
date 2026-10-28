import { type Character, raceDefinitions } from "../domain";
import { useState } from "react";
import { storeItems, type StoreItem, type StoreCategory, addCustomStoreItems, deleteCustomStoreItem, useCatalogRevision } from "../data/equipmentCatalog";
import { getInventoryEntryDetails, formatCustomItemName, unequipInventoryItem, equipInventoryItem as equipItem } from "../rules";
import { EquipmentItemPicker } from "./pickers";

export function EquipmentStore({
  character,
  onEquipmentChange,
  onInventoryChange,
  onEquipmentAndInventoryChange,
}: {
  character: Character;
  onEquipmentChange: (equipment: Record<string, string>) => void;
  onInventoryChange: (inventory: Record<string, number>) => void;
  onEquipmentAndInventoryChange: (
    equipment: Record<string, string>,
    inventory: Record<string, number>,
  ) => void;
}) {
  useCatalogRevision();
  const [catalogError, setCatalogError] = useState<string>();
  const [storeOpen, setStoreOpen] = useState(true);
  const [customItemOpen, setCustomItemOpen] = useState(false);
  const [customItemsOpen, setCustomItemsOpen] = useState(false);
  const customItems = storeItems.filter((item) => item.custom);
  const [customItemType, setCustomItemType] = useState<"Weapon" | "Armor" | "Shield" | "Miscellaneous">("Weapon");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("0");
  const [customItemWeight, setCustomItemWeight] = useState("0 lb.");
  const [customItemDescription, setCustomItemDescription] = useState("");
  const [customDamage, setCustomDamage] = useState("1d8");
  const [customDamageSmall, setCustomDamageSmall] = useState("");
  const [customDamageMedium, setCustomDamageMedium] = useState("");
  const [customDamageLarge, setCustomDamageLarge] = useState("");
  const [customDamageType, setCustomDamageType] = useState("slashing");
  const [customCritical, setCustomCritical] = useState("20/x2");
  const [customProficiency, setCustomProficiency] = useState<StoreItem["proficiency"]>("Simple");
  const [customHandedness, setCustomHandedness] = useState<StoreItem["handedness"]>("One-handed");
  const [customWeaponMode, setCustomWeaponMode] = useState<"Melee" | "Ranged" | "Thrown">("Melee");
  const [customFinesse, setCustomFinesse] = useState(false);
  const [customRange, setCustomRange] = useState("");
  const [customRangeSmall, setCustomRangeSmall] = useState("");
  const [customRangeMedium, setCustomRangeMedium] = useState("");
  const [customRangeLarge, setCustomRangeLarge] = useState("");
  const [customReach, setCustomReach] = useState("");
  const [customProperties, setCustomProperties] = useState("");
  const [customArmorBonus, setCustomArmorBonus] = useState("0");
  const [customArmorCategory, setCustomArmorCategory] = useState<StoreItem["armorCategory"]>("Light");
  const [customMaxDexterity, setCustomMaxDexterity] = useState("");
  const [customArmorCheckPenalty, setCustomArmorCheckPenalty] = useState("0");
  const [customSpellFailure, setCustomSpellFailure] = useState("0");
  const [customArmorSpeed, setCustomArmorSpeed] = useState("30 ft.");
  const [customShieldBonus, setCustomShieldBonus] = useState("0");
  const [customShieldType, setCustomShieldType] = useState<StoreItem["shieldType"]>("Custom");
  const [customShieldCheckPenalty, setCustomShieldCheckPenalty] = useState("0");
  const [customShieldSpellFailure, setCustomShieldSpellFailure] = useState("0");
  const [customTowerShield, setCustomTowerShield] = useState(false);
  const playerRaceId = character.race.toLowerCase().replaceAll(" ", "-");
  const playerSize = raceDefinitions[playerRaceId]?.size ?? "Medium";
  const [itemSize, setItemSize] = useState<string>(playerSize);
  const sizeOptions = ["Small", "Medium", "Large"];
  const inventory = character.inventory ?? {};
  const totalItems = Object.values(inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const inventoryEntries = Object.entries(inventory).map(([key, quantity]) => {
    const details = getInventoryEntryDetails(key);
    return { key, quantity, ...details, totalWeight: details.numericWeight * quantity };
  });
  const totalInventoryWeight = inventoryEntries.reduce((total, entry) => total + entry.totalWeight, 0);
  const selectItem = (item: StoreItem) => {
    void item;
  };
  const buy = (item: StoreItem, quantity = 1) => {
    const sizedName = `${item.name} (${itemSize})`;
    onInventoryChange({
      ...inventory,
      [sizedName]: (inventory[sizedName] ?? 0) + quantity,
    });
  };
  const removeInventoryItem = (key: string) => {
    const nextInventory = { ...inventory };
    if (nextInventory[key] <= 1) delete nextInventory[key];
    else nextInventory[key] -= 1;
    const removedItemName = getInventoryEntryDetails(key).name;
    const nextEquipment = Object.fromEntries(
      Object.entries(character.equipment ?? {}).filter(
        ([, value]) =>
          value !== key && getInventoryEntryDetails(value).name !== removedItemName,
      ),
    );
    onEquipmentAndInventoryChange(nextEquipment, nextInventory);
  };
  const equipInventoryItem = (key: string) => {
    equipItem(character, key, onEquipmentChange);
  };
  const categoryOrder: StoreCategory[] = [
    "Weapons",
    "Armor",
    "Shields",
    "Shoulders",
    "Arms",
    "Hands",
    "Rings",
    "Waist",
    "Feet",
    "Body & Wondrous Items",
    "Head",
    "Neck",
    "Ammunition",
    "Adventuring Gear",
    "Tools & Kits",
    "Consumables",
    "Potions, Scrolls & Wands",
    "Rings & Magic Items",
    "Mounts & Vehicles",
    "Instruments",
  ];
  const categories = categoryOrder.filter((itemCategory) =>
    storeItems.some((item) => item.category === itemCategory),
  );
  const saveCustomItem = () => {
    const name = formatCustomItemName(customItemName);
    if (!name) return;
    const category: StoreCategory =
      customItemType === "Weapon"
        ? "Weapons"
        : customItemType === "Armor"
          ? "Armor"
          : customItemType === "Shield"
            ? "Shields"
            : "Adventuring Gear";
    const duplicateCustomItem = storeItems.some(
      (item) =>
        item.category === category &&
        item.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicateCustomItem) {
      window.alert(`A custom ${customItemType.toLowerCase()} named "${name}" already exists.`);
      return;
    }
    const customItem: StoreItem = {
      name,
      category,
      price: Math.max(0, Number(customItemPrice) || 0),
      weight: customItemWeight.trim() || "0 lb.",
      description: customItemDescription.trim() || "Custom item.",
      custom: true,
      ...(customItemType === "Weapon"
        ? { damage: customDamage, damageSmall: customDamageSmall.trim() || undefined, damageMedium: customDamageMedium.trim() || undefined, damageLarge: customDamageLarge.trim() || undefined, damageType: customDamageType, critical: customCritical, proficiency: customProficiency, handedness: customHandedness, thrown: customWeaponMode === "Thrown", finesse: customFinesse, rangeIncrement: customRange.trim() || undefined, rangeSmall: customRangeSmall.trim() || undefined, rangeMedium: customRangeMedium.trim() || undefined, rangeLarge: customRangeLarge.trim() || undefined, reach: customReach.trim() || undefined, specialProperties: customProperties.trim() || undefined }
        : {}),
      ...(customItemType === "Armor"
        ? {
            armorBonus: Number(customArmorBonus) || 0,
            armorCategory: customArmorCategory,
            maxDexterity: customMaxDexterity === "" ? undefined : Number(customMaxDexterity),
            armorCheckPenalty: Number(customArmorCheckPenalty) || 0,
            arcaneSpellFailure: Number(customSpellFailure) || 0,
            armorSpeed: customArmorSpeed.trim() || "30 ft.",
          }
        : {}),
      ...(customItemType === "Shield"
        ? {
            shieldBonus: Number(customShieldBonus) || 0,
            shieldType: customShieldType,
            shieldCheckPenalty: Number(customShieldCheckPenalty) || 0,
            shieldSpellFailure: Number(customShieldSpellFailure) || 0,
            towerShieldProficiency: customTowerShield,
          }
        : {}),
    };
    try {
      addCustomStoreItems([customItem]);
      setCatalogError(undefined);
    } catch (error: unknown) {
      setCatalogError(`Unable to save the custom item. ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    setCustomItemName("");
    setCustomItemPrice("0");
    setCustomItemWeight("0 lb.");
    setCustomItemDescription("");
    setCustomDamage("1d8");
    setCustomDamageSmall("");
    setCustomDamageMedium("");
    setCustomDamageLarge("");
    setCustomDamageType("slashing");
    setCustomCritical("20/x2");
    setCustomProficiency("Simple");
    setCustomHandedness("One-handed");
    setCustomWeaponMode("Melee");
    setCustomFinesse(false);
    setCustomRange("");
    setCustomRangeSmall("");
    setCustomRangeMedium("");
    setCustomRangeLarge("");
    setCustomReach("");
    setCustomProperties("");
    setCustomArmorBonus("0");
    setCustomArmorCategory("Light");
    setCustomMaxDexterity("");
    setCustomArmorCheckPenalty("0");
    setCustomSpellFailure("0");
    setCustomArmorSpeed("30 ft.");
    setCustomShieldBonus("0");
    setCustomShieldType("Custom");
    setCustomShieldCheckPenalty("0");
    setCustomShieldSpellFailure("0");
    setCustomTowerShield(false);
    setCustomItemOpen(false);
  };
  const deleteCustomItem = (name: string) => {
    try {
      deleteCustomStoreItem(name);
      setCatalogError(undefined);
    } catch (error: unknown) {
      setCatalogError(`Unable to delete the custom item. ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  return (
    <section className="equipment-store">
      {catalogError && !customItemOpen && !customItemsOpen && <p role="alert">{catalogError}</p>}
      <div className="equipment-store-header">
        <div>
          <p className="eyebrow">Town market</p>
          <h2>General Store</h2>
          <p>Buy gear, arms, armor, and magic items for this character.</p>
        </div>
        <strong>
          {totalItems} item{totalItems === 1 ? "" : "s"} owned
        </strong>
        <button
          className="secondary-button store-toggle"
          type="button"
          onClick={() => setStoreOpen((current) => !current)}
          aria-expanded={storeOpen}
        >
          {storeOpen ? "Close Store" : "Open Store"}
        </button>
        <button className="secondary-button" type="button" onClick={() => setCustomItemOpen(true)}>
          Create Custom Item
        </button>
        <button className="secondary-button" type="button" onClick={() => setCustomItemsOpen(true)}>
          Custom Items List
        </button>
      </div>
      {customItemOpen && (
        <div className="item-modal-modal" role="dialog" aria-modal="true" aria-labelledby="custom-item-title">
          <div className="item-modal-dialog custom-item-dialog">
            <div className="item-modal-header">
              <div>
                <p className="eyebrow">Custom catalog</p>
                <h2 id="custom-item-title">Create Custom Item</h2>
              </div>
              <button className="secondary-button" type="button" onClick={() => setCustomItemOpen(false)}>Close</button>
            </div>
            <div className="custom-item-form">
              {catalogError && <p role="alert">{catalogError}</p>}
              <label>Item type<select value={customItemType} onChange={(event) => setCustomItemType(event.target.value as typeof customItemType)}><option>Weapon</option><option>Armor</option><option>Shield</option><option>Miscellaneous</option></select></label>
              <label>Name<input value={customItemName} onChange={(event) => setCustomItemName(event.target.value)} placeholder="Moonlit Blade" /></label>
              <label>Value (gp)<input type="number" min="0" value={customItemPrice} onChange={(event) => setCustomItemPrice(event.target.value)} /></label>
              <label>Weight<input value={customItemWeight} onChange={(event) => setCustomItemWeight(event.target.value)} placeholder="4 lb." /></label>
              {customItemType === "Weapon" && <>
                <label>Damage dice<input value={customDamage} onChange={(event) => setCustomDamage(event.target.value)} placeholder="1d8" /></label>
                <label>Small damage dice<input value={customDamageSmall} onChange={(event) => setCustomDamageSmall(event.target.value)} placeholder="1d6" /></label>
                <label>Medium damage dice<input value={customDamageMedium} onChange={(event) => setCustomDamageMedium(event.target.value)} placeholder="1d8" /></label>
                <label>Large damage dice<input value={customDamageLarge} onChange={(event) => setCustomDamageLarge(event.target.value)} placeholder="2d6" /></label>
                <label>Damage type<select value={customDamageType} onChange={(event) => setCustomDamageType(event.target.value)}><option>bludgeoning</option><option>piercing</option><option>slashing</option></select></label>
                <label>Critical range/multiplier<input value={customCritical} onChange={(event) => setCustomCritical(event.target.value)} placeholder="19-20/x2" /></label>
                <label>Proficiency<select value={customProficiency} onChange={(event) => setCustomProficiency(event.target.value as StoreItem["proficiency"])}><option>Simple</option><option>Martial</option><option>Exotic</option></select></label>
                <label>Handedness<select value={customHandedness} onChange={(event) => setCustomHandedness(event.target.value as StoreItem["handedness"])}><option>Light</option><option>One-handed</option><option>Two-handed</option><option>Ranged</option></select></label>
                <label>Weapon mode<select value={customWeaponMode} onChange={(event) => setCustomWeaponMode(event.target.value as typeof customWeaponMode)}><option>Melee</option><option>Ranged</option><option>Thrown</option></select></label>
                <label>Finesse<input type="checkbox" checked={customFinesse} onChange={(event) => setCustomFinesse(event.target.checked)} /></label>
                {(customWeaponMode === "Ranged" || customWeaponMode === "Thrown") && <label>Range increment<input value={customRange} onChange={(event) => setCustomRange(event.target.value)} placeholder="30 ft." /></label>}
                {(customWeaponMode === "Ranged" || customWeaponMode === "Thrown") && <>
                  <label>Small range<input value={customRangeSmall} onChange={(event) => setCustomRangeSmall(event.target.value)} placeholder="20 ft." /></label>
                  <label>Medium range<input value={customRangeMedium} onChange={(event) => setCustomRangeMedium(event.target.value)} placeholder="30 ft." /></label>
                  <label>Large range<input value={customRangeLarge} onChange={(event) => setCustomRangeLarge(event.target.value)} placeholder="40 ft." /></label>
                </>}
                <label>Reach<input value={customReach} onChange={(event) => setCustomReach(event.target.value)} placeholder="5 ft." /></label>
                <label>Special properties<input value={customProperties} onChange={(event) => setCustomProperties(event.target.value)} placeholder="Trip, reach, brace" /></label>
              </>}
              {customItemType === "Armor" && <>
                <label>Armor category<select value={customArmorCategory} onChange={(event) => setCustomArmorCategory(event.target.value as StoreItem["armorCategory"])}><option>Light</option><option>Medium</option><option>Heavy</option></select></label>
                <label>Armor bonus<input type="number" value={customArmorBonus} onChange={(event) => setCustomArmorBonus(event.target.value)} min="0" /></label>
                <label>Maximum Dexterity<input type="number" value={customMaxDexterity} onChange={(event) => setCustomMaxDexterity(event.target.value)} min="0" placeholder="No limit" /></label>
                <label>Armor check penalty<input type="number" value={customArmorCheckPenalty} onChange={(event) => setCustomArmorCheckPenalty(event.target.value)} min="0" /></label>
                <label>Arcane spell failure %<input type="number" value={customSpellFailure} onChange={(event) => setCustomSpellFailure(event.target.value)} min="0" max="100" /></label>
                <label>Speed<input value={customArmorSpeed} onChange={(event) => setCustomArmorSpeed(event.target.value)} placeholder="20 ft." /></label>
              </>}
              {customItemType === "Shield" && <>
                <label>Shield bonus<input type="number" value={customShieldBonus} onChange={(event) => setCustomShieldBonus(event.target.value)} min="0" /></label>
                <label>Shield type<select value={customShieldType} onChange={(event) => setCustomShieldType(event.target.value as StoreItem["shieldType"])}><option>Buckler</option><option>Light</option><option>Heavy</option><option>Tower</option><option>Custom</option></select></label>
                <label>Armor check penalty<input type="number" value={customShieldCheckPenalty} onChange={(event) => setCustomShieldCheckPenalty(event.target.value)} min="0" /></label>
                <label>Arcane spell failure %<input type="number" value={customShieldSpellFailure} onChange={(event) => setCustomShieldSpellFailure(event.target.value)} min="0" max="100" /></label>
                <label>Tower shield proficiency required<input type="checkbox" checked={customTowerShield} onChange={(event) => setCustomTowerShield(event.target.checked)} /></label>
              </>}
              <label className="custom-item-description">Description<textarea value={customItemDescription} onChange={(event) => setCustomItemDescription(event.target.value)} placeholder="Describe the item and its special properties." /></label>
            </div>
            <div className="item-modal-actions"><button className="primary-button" type="button" disabled={!customItemName.trim()} onClick={saveCustomItem}>Save to Store</button></div>
          </div>
        </div>
      )}
      {customItemsOpen && (
        <div className="item-modal-modal" role="dialog" aria-modal="true" aria-labelledby="custom-items-title">
          <div className="item-modal-dialog custom-item-dialog">
            <div className="item-modal-header">
              <div>
                <p className="eyebrow">Custom catalog</p>
                <h2 id="custom-items-title">Custom Items List</h2>
              </div>
              <button className="secondary-button" type="button" onClick={() => setCustomItemsOpen(false)}>Close</button>
            </div>
            <section className="custom-item-catalog custom-item-catalog-standalone">
              {catalogError && <p role="alert">{catalogError}</p>}
              {customItems.length ? customItems.map((item) => (
                <div className="custom-item-catalog-row" key={item.name}>
                  <span><strong>{item.name}</strong><small>{item.category}</small></span>
                  <button className="secondary-button" type="button" onClick={() => deleteCustomItem(item.name)}>Delete</button>
                </div>
              )) : <p className="equipment-inventory-empty">No custom items saved yet.</p>}
            </section>
          </div>
        </div>
      )}
      {storeOpen ? (
        <>
          <label className="store-size-row">
            <span>Item size</span>
            <select
              value={itemSize}
              onChange={(event) => setItemSize(event.target.value)}
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                  {size === playerSize ? ` (${character.race})` : ""}
                </option>
              ))}
            </select>
            <small>Defaults to the character's size: {playerSize}.</small>
          </label>
          <div className="equipment-store-grid">
        {categories.map((itemCategory) => {
          const itemSelect = (
            <EquipmentItemPicker
              items={storeItems.filter(
                (item) => item.category === itemCategory,
              )}
              size={itemSize}
              owned={inventory}
              onSelect={selectItem}
                onPurchase={buy}
                bulk={["Ammunition", "Tools & Kits", "Consumables", "Potions, Scrolls & Wands"].includes(itemCategory)}
                menuOnLeft={["Armor", "Shoulders", "Hands", "Waist", "Body & Wondrous Items", "Neck", "Adventuring Gear", "Consumables", "Rings & Magic Items", "Instruments"].includes(itemCategory)}
            />
          );
          return (
            <div
              className={`store-category${
                itemCategory === "Shields" ? " shields-store-category" : ""
              }`}
              key={itemCategory}
            >
              {itemCategory}
              {itemSelect}
            </div>
          );
        })}
          </div>
        </>
      ) : null}
      <section className="equipment-inventory" aria-labelledby="equipment-inventory-title">
        <div className="equipment-inventory-header">
          <h3 id="equipment-inventory-title">Inventory</h3>
          <strong>{totalInventoryWeight.toLocaleString()} lb. total</strong>
        </div>
        {inventoryEntries.length ? (
          <div className="equipment-inventory-list">
            {inventoryEntries.map((entry) => (
              <div className="equipment-inventory-row" key={entry.key}>
                <div className="equipment-inventory-name">
                  <strong>
                    {entry.name} ({entry.size[0]})
                  </strong>
                  <small>{entry.description}</small>
                </div>
                <span>Qty. {entry.quantity}</span>
                <span>{entry.weight} each</span>
                <span>{entry.totalWeight ? `${entry.totalWeight} lb. total` : "Weight varies"}</span>
                <span className="equipment-inventory-actions">
                  {Object.values(character.equipment ?? {}).includes(entry.key) ? (
                    <button className="is-equipped" type="button" title="Unequip this item" onClick={() => unequipInventoryItem(character, entry.key, onEquipmentChange)}>Unequip</button>
                  ) : (
                    <button type="button" title="Equip this item" onClick={() => equipInventoryItem(entry.key)}>Equip</button>
                  )}
                  <button type="button" onClick={() => removeInventoryItem(entry.key)}>Remove</button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="equipment-inventory-empty">No items purchased yet.</p>
        )}
      </section>
    </section>
  );
}
