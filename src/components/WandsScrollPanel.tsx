import { type Character, classDefinitions, type ClassId } from "../domain";
import { getChosenFeats, formatSpellSchool } from "../rules";
import { useState } from "react";
import { spells as srdSpells } from "../data/spellCatalog";
import { SpellPicker } from "./pickers";

export function WandsScrollPanel({
  character,
  onInventoryChange,
}: {
  character: Character;
  onInventoryChange: (inventory: Record<string, number>) => void;
}) {
  const chosenFeats = getChosenFeats(character);
  const hasScribeScroll = chosenFeats.includes("scribe-scroll");
  const hasCraftWand = chosenFeats.includes("craft-wand");
  const [purchaseInstead, setPurchaseInstead] = useState(false);
  const spellcastingLevels = character.classLevels.filter((level) =>
    classDefinitions[level.classId]?.spellcasting,
  );
  const minimumCasterLevel = (spell: (typeof srdSpells)[number], classId: ClassId) => {
    if (spell.level === 0) return 1;
    return ["paladin", "ranger"].includes(classId)
      ? spell.level * 2 + 2
      : spell.level * 2 - 1;
  };
  const craftableSpells = srdSpells.filter((spell) =>
    spellcastingLevels.some((classLevel) =>
      spell.classes.includes(classLevel.classId) &&
      classLevel.level >= minimumCasterLevel(spell, classLevel.classId),
    ),
  );
  const availableScrollSpells = purchaseInstead ? srdSpells : craftableSpells;
  const wandSpells = (purchaseInstead ? srdSpells : craftableSpells).filter((spell) => spell.level <= 4);
  const [scrollSpellName, setScrollSpellName] = useState(availableScrollSpells[0]?.name ?? "");
  const [scrollCasterLevel, setScrollCasterLevel] = useState(1);
  const [wandSpellName, setWandSpellName] = useState(wandSpells[0]?.name ?? "");
  const [wandCasterLevel, setWandCasterLevel] = useState(1);
  const scrollSpell = availableScrollSpells.find((spell) => spell.name === scrollSpellName) ?? availableScrollSpells[0];
  const wandSpell = wandSpells.find((spell) => spell.name === wandSpellName) ?? wandSpells[0];
  const scrollMinimumCasterLevel = scrollSpell
    ? purchaseInstead
      ? (scrollSpell.level === 0 ? 1 : scrollSpell.level * 2 - 1)
      : Math.min(...spellcastingLevels.filter((classLevel) => scrollSpell.classes.includes(classLevel.classId)).map((classLevel) => minimumCasterLevel(scrollSpell, classLevel.classId)))
    : 1;
  const wandMinimumCasterLevel = wandSpell
    ? purchaseInstead
      ? (wandSpell.level === 0 ? 1 : wandSpell.level * 2 - 1)
      : Math.min(...spellcastingLevels.filter((classLevel) => wandSpell.classes.includes(classLevel.classId)).map((classLevel) => minimumCasterLevel(wandSpell, classLevel.classId)))
    : 1;
  const scrollLevel = scrollSpell?.level || 0.5;
  const wandLevel = wandSpell?.level || 0.5;
  const scrollPrice = 25 * scrollLevel * scrollCasterLevel;
  const wandPrice = 750 * wandLevel * wandCasterLevel;
  const scrollCreationCost = scrollPrice / 2;
  const wandCreationCost = wandPrice / 2;
  const scrollXpCost = scrollPrice / 25;
  const wandXpCost = wandPrice / 25;
  const scrollCraftingDays = Math.max(1, Math.ceil(scrollPrice / 1000));
  const wandCraftingDays = Math.max(1, Math.ceil(wandPrice / 1000));
  const addCraftedItem = (name: string) => {
    const inventory = { ...(character.inventory ?? {}) };
    inventory[name] = (inventory[name] ?? 0) + 1;
    onInventoryChange(inventory);
  };
  const forgeScroll = () => {
    if (!scrollSpell) return;
    if ((!hasScribeScroll && !purchaseInstead) || !scrollSpell || scrollCasterLevel < scrollMinimumCasterLevel) return;
    addCraftedItem(`Scroll of ${scrollSpell.name} (CL ${scrollCasterLevel})`);
    const nextSpell = availableScrollSpells[0];
    setScrollSpellName(nextSpell?.name ?? "");
    setScrollCasterLevel(nextSpell ? (purchaseInstead ? (nextSpell.level === 0 ? 1 : nextSpell.level * 2 - 1) : scrollMinimumCasterLevel) : 1);
  };
  const forgeWand = () => {
    if (!wandSpell) return;
    if ((!hasCraftWand && !purchaseInstead) || !wandSpell || wandCasterLevel < wandMinimumCasterLevel) return;
    addCraftedItem(`Wand of ${wandSpell.name} (CL ${wandCasterLevel}, 50 charges)`);
    const nextSpell = wandSpells[0];
    setWandSpellName(nextSpell?.name ?? "");
    setWandCasterLevel(nextSpell ? (purchaseInstead ? (nextSpell.level === 0 ? 1 : nextSpell.level * 2 - 1) : wandMinimumCasterLevel) : 1);
  };
  return (
    <section className="forge-panel panel">
      <div className="panel-title">
        <h2>Wands &amp; Scrolls</h2>
        <span className="rule-status">Spell completion items</span>
      </div>
      <div className="forge-content">
        <p className="forge-intro">Create a scroll or wand from a spell and add it to the character&apos;s inventory.</p>
        <label className="forge-purchase-toggle">
          <input type="checkbox" checked={purchaseInstead} onChange={(event) => setPurchaseInstead(event.target.checked)} />
          Purchase instead of craft
        </label>
        {!purchaseInstead && !hasScribeScroll && !hasCraftWand && <p className="validation-error">Select Scribe Scroll or Craft Wand before creating magical items.</p>}
        <h3>Make a Scroll</h3>
        <div className="forge-grid">
          <label>Spell<SpellPicker spells={availableScrollSpells} selected={scrollSpell?.name} onChange={setScrollSpellName} placeholder="Choose a scroll spell" disabled={(!hasScribeScroll && !purchaseInstead) || !availableScrollSpells.length} /></label>
          <label>Caster level<select value={scrollCasterLevel} onChange={(event) => setScrollCasterLevel(Number(event.target.value))} disabled={!scrollSpell || (!hasScribeScroll && !purchaseInstead)}>{Array.from({ length: Math.max(0, 20 - scrollMinimumCasterLevel + 1) }, (_, index) => index + scrollMinimumCasterLevel).map((level) => <option key={level} value={level}>CL {level}</option>)}</select></label>
        </div>
        <div className="forge-preview">
          <strong>Scroll of {scrollSpell?.name} (CL {scrollCasterLevel})</strong>
          <span>{scrollSpell?.description || "No spell description available."}</span>
          <span>Spell level: {scrollSpell?.level ?? 0}; school: {formatSpellSchool(scrollSpell?.school)}</span>
          <span>{purchaseInstead ? "Purchase cost" : "Market price"}: {scrollPrice.toLocaleString()} gp{purchaseInstead ? "" : `; creation cost: ${scrollCreationCost.toLocaleString()} gp`}</span>
          {!purchaseInstead && <span>XP cost: {scrollXpCost.toLocaleString()}; crafting time: {scrollCraftingDays} day{scrollCraftingDays === 1 ? "" : "s"}</span>}
        </div>
        <button className="level-button" type="button" onClick={forgeScroll} disabled={(!hasScribeScroll && !purchaseInstead) || !scrollSpell || scrollCasterLevel < scrollMinimumCasterLevel}>{purchaseInstead ? "Purchase Scroll" : "Make Scroll"}</button>
        <div className="forge-divider" />
        <h3>Make a Wand</h3>
        <div className="forge-grid">
          <label>Spell<SpellPicker spells={wandSpells} selected={wandSpell?.name} onChange={setWandSpellName} placeholder="Choose a wand spell" disabled={(!hasCraftWand && !purchaseInstead) || !wandSpells.length} /></label>
          <label>Caster level<select value={wandCasterLevel} onChange={(event) => setWandCasterLevel(Number(event.target.value))} disabled={!wandSpell || (!hasCraftWand && !purchaseInstead)}>{Array.from({ length: Math.max(0, 20 - wandMinimumCasterLevel + 1) }, (_, index) => index + wandMinimumCasterLevel).map((level) => <option key={level} value={level}>CL {level}</option>)}</select></label>
        </div>
        <div className="forge-preview">
          <strong>Wand of {wandSpell?.name} (CL {wandCasterLevel}, 50 charges)</strong>
          <span>{wandSpell?.description || "No spell description available."}</span>
          <span>Spell level: {wandSpell?.level ?? 0}; school: {formatSpellSchool(wandSpell?.school)}</span>
          <span>{purchaseInstead ? "Purchase cost" : "Market price"}: {wandPrice.toLocaleString()} gp{purchaseInstead ? "" : `; creation cost: ${wandCreationCost.toLocaleString()} gp`}</span>
          {!purchaseInstead && <span>XP cost: {wandXpCost.toLocaleString()}; crafting time: {wandCraftingDays} day{wandCraftingDays === 1 ? "" : "s"}</span>}
        </div>
        <button className="level-button" type="button" onClick={forgeWand} disabled={(!hasCraftWand && !purchaseInstead) || !wandSpell || wandCasterLevel < wandMinimumCasterLevel}>{purchaseInstead ? "Purchase Wand" : "Make Wand"}</button>
      </div>
    </section>
  );
}
