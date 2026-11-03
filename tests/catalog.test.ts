import { afterEach, describe, expect, it, vi } from "vitest";
import { storeItems, findStoreItem, addCustomStoreItems, deleteCustomStoreItem,
  type StoreItem } from "../src/data/equipmentCatalog";
import { getInventoryEntryDetails, getSizedStorePrice, getSizedStoreWeight } from "../src/rules";

afterEach(() => {
  vi.restoreAllMocks();
  storeItems.filter((item) => item.custom).forEach((item) => deleteCustomStoreItem(item.name));
});

describe("indexed equipment catalog", () => {
  it("matches the old longest-name lookup for every catalog item and forged variant", () => {
    const sorted = [...storeItems].sort((left, right) => right.name.length - left.name.length);
    for (const item of storeItems) {
      for (const name of [item.name, `Flaming +1 ${item.name}`]) {
        const oldMatch = sorted.find((entry) => entry.name === name) ??
          sorted.find((entry) => name.includes(entry.name));
        expect(findStoreItem(name)).toBe(oldMatch);
      }
    }
    expect(findStoreItem("Not a real equipment item")).toBeUndefined();
  });

  it("keeps variant matching, prices, and carried weights unchanged", () => {
    const sword = findStoreItem("Longsword");
    if (!sword) throw new Error("Missing longsword fixture.");
    expect(getSizedStorePrice(sword, "Large")).toBe(30);
    expect(getSizedStoreWeight(sword, "Small")).toBe("2 lb.");
    const details = getInventoryEntryDetails("Masterwork Longsword (Medium)");
    expect(details.price).toBe(315);
    expect(details.description).toContain("+1 enhancement bonus on attack rolls");
    expect(details.numericWeight).toBe(4);
    expect(findStoreItem("Masterwork Longsword", "Armor")).toBeUndefined();
  });

  it("includes SRD torso-slot items with their prices and effects", () => {
    expect(findStoreItem("Vest of Escape")).toMatchObject({
      category: "Torso",
      price: 5200,
      weight: "—",
      description: expect.stringContaining("+4 competence bonus on Open Lock"),
    });
    expect(findStoreItem("Vestment, Druid's")).toMatchObject({
      category: "Torso",
      price: 10000,
      weight: "—",
      description: expect.stringContaining("one additional daily use of wild shape"),
    });
  });

  it("includes all SRD robe items in the Body slot with verified prices and weights", () => {
    const bodyItems = storeItems.filter((item) => item.category === "Body" && !item.custom);
    expect(bodyItems.map((item) => item.name).sort()).toEqual([
      "Robe of Blending",
      "Robe of Bones",
      "Robe of Eyes",
      "Robe of Scintillating Colors",
      "Robe of Stars",
      "Robe of the Archmagi",
      "Robe of Useful Items",
    ].sort());
    expect(bodyItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Robe of the Archmagi", price: 75000, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Blending", price: 30000, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Bones", price: 2400, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Eyes", price: 120000, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Scintillating Colors", price: 27000, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Stars", price: 58000, weight: "1 lb." }),
      expect.objectContaining({ name: "Robe of Useful Items", price: 7000, weight: "1 lb." }),
    ]));
  });

  it("includes SRD eye-slot items with verified prices", () => {
    const expectedItems = [
      ["Eyes of Charming", 56000],
      ["Eyes of Doom", 25000],
      ["Eyes of the Eagle", 2500],
      ["Eyes of Petrification", 98000],
      ["Goggles of Minute Seeing", 1250],
      ["Goggles of Night", 12000],
    ] as const;
    for (const [name, price] of expectedItems) {
      expect(storeItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, category: "Eyes", price, weight: "—" }),
      ]));
    }
  });

  it("includes SRD neck-slot items and keeps slotless wondrous items out of Neck", () => {
    const expectedItems = [
      ["Amulet of Health +2", 4000],
      ["Amulet of Health +4", 16000],
      ["Amulet of Health +6", 36000],
      ["Amulet of Mighty Fists", 6000],
      ["Amulet of Mighty Fists +2", 24000],
      ["Amulet of Mighty Fists +3", 54000],
      ["Amulet of Mighty Fists +4", 96000],
      ["Amulet of Mighty Fists +5", 150000],
      ["Amulet of Natural Armor +1", 2000],
      ["Amulet of Natural Armor +2", 8000],
      ["Amulet of Natural Armor +3", 18000],
      ["Amulet of Natural Armor +4", 32000],
      ["Amulet of Natural Armor +5", 50000],
      ["Amulet of the Planes", 120000],
      ["Amulet of Proof against Detection and Location", 35000],
      ["Brooch of Shielding", 1500],
      ["Medallion of Thoughts", 12000],
      ["Necklace of Adaptation", 9000],
      ["Periapt of Health", 7400],
      ["Periapt of Proof against Poison", 27000],
      ["Periapt of Wisdom +2", 4000],
      ["Periapt of Wisdom +4", 16000],
      ["Periapt of Wisdom +6", 36000],
      ["Periapt of Wound Closure", 15000],
      ["Scarab of Protection", 38000],
      ["Scarab, Golembane", 2500],
      ["Strand of Prayer Beads (Lesser)", 9600],
      ["Strand of Prayer Beads (Standard)", 45800],
      ["Strand of Prayer Beads (Greater)", 95800],
    ] as const;
    const neckItems = storeItems.filter((item) => item.category === "Neck" && !item.custom);
    expect(neckItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price] of expectedItems) {
      expect(neckItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price }),
      ]));
    }
    expect(findStoreItem("Pearl of Power (1st)")?.category).toBe("Body & Wondrous Items");
    expect(findStoreItem("Hand of the Mage")?.category).toBe("Body & Wondrous Items");
    for (const romanNumeral of ["I", "II", "III", "IV", "V", "VI", "VII"]) {
      expect(findStoreItem(`Necklace of Fireballs ${romanNumeral}`)?.category)
        .toBe("Body & Wondrous Items");
    }
  });

  it("includes the complete SRD slotless wondrous roster with verified prices and weights", () => {
    const pearlItems: [string, number, string][] = [
      ["Pearl of Power, 1st-level", 1000, "—"],
      ["Pearl of Power, 2nd-level", 4000, "—"],
      ["Pearl of Power, 3rd-level", 9000, "—"],
      ["Pearl of Power, 4th-level", 16000, "—"],
      ["Pearl of Power, 5th-level", 25000, "—"],
      ["Pearl of Power, 6th-level", 36000, "—"],
      ["Pearl of Power, 7th-level", 49000, "—"],
      ["Pearl of Power, 8th-level", 64000, "—"],
      ["Pearl of Power, 9th-level", 81000, "—"],
      ["Pearl of Power, 2 Spells", 70000, "—"],
    ];
    const figurineItems: [string, number, string][] = [
      ["Figurine of Wondrous Power, Silver Raven", 3800, "—"],
      ["Figurine of Wondrous Power, Serpentine Owl", 9100, "—"],
      ["Figurine of Wondrous Power, Bronze Griffon", 10000, "—"],
      ["Figurine of Wondrous Power, Ebony Fly", 10000, "—"],
      ["Figurine of Wondrous Power, Onyx Dog", 15500, "—"],
      ["Figurine of Wondrous Power, Golden Lions", 16500, "—"],
      ["Figurine of Wondrous Power, Marble Elephant", 17000, "—"],
      ["Figurine of Wondrous Power, Ivory Goats", 21000, "—"],
      ["Figurine of Wondrous Power, Obsidian Steed", 28500, "—"],
    ];
    const inheritedBonusBooks: [string, number, string][] = ([
      ["Manual of Bodily Health", 27500],
      ["Manual of Gainful Exercise", 27500],
      ["Manual of Quickness of Action", 27500],
      ["Tome of Clear Thought", 27500],
      ["Tome of Leadership and Influence", 27500],
      ["Tome of Understanding", 27500],
    ] as const).flatMap(([name, basePrice]) =>
      [1, 2, 3, 4, 5].map((bonus) => [
        `${name} +${bonus}`,
        basePrice * bonus,
        "5 lb.",
      ] as [string, number, string]),
    );
    const expectedItems: [string, number, string][] = [
      ["Bag of Holding", 2500, "15 lb."],
      ["Bag of Holding, Type II", 5000, "25 lb."],
      ["Bag of Holding, Type III", 7400, "35 lb."],
      ["Bag of Holding, Type IV", 10000, "60 lb."],
      ["Bag of Tricks, Gray", 900, "—"],
      ["Bag of Tricks, Rust", 3000, "—"],
      ["Bag of Tricks, Tan", 6300, "—"],
      ["Bead of Force", 3000, "—"],
      ["Blessed Book", 12500, "1 lb."],
      ["Bottle of Air", 7250, "2 lb."],
      ["Bowl of Commanding Water Elementals", 100000, "3 lb."],
      ["Brazier of Commanding Fire Elementals", 100000, "5 lb."],
      ["Broom of Flying", 17000, "3 lb."],
      ["Carpet of Flying, 5 ft. by 5 ft.", 20000, "8 lb."],
      ["Carpet of Flying, 5 ft. by 10 ft.", 35000, "10 lb."],
      ["Carpet of Flying, 10 ft. by 10 ft.", 60000, "15 lb."],
      ["Censer of Controlling Air Elementals", 100000, "1 lb."],
      ["Chaos Diamond", 160000, "1 lb."],
      ["Chime of Interruption", 16800, "1 lb."],
      ["Chime of Opening", 3000, "1 lb."],
      ["Crystal Ball", 42000, "7 lb."],
      ["Crystal Ball (See Invisibility)", 50000, "7 lb."],
      ["Crystal Ball (Detect Thoughts)", 51000, "7 lb."],
      ["Crystal Ball (Telepathy)", 70000, "7 lb."],
      ["Crystal Ball (True Seeing)", 80000, "7 lb."],
      ["Cube of Force", 62000, "—"],
      ["Cube of Frost Resistance", 27000, "—"],
      ["Cubic Gate", 164000, "—"],
      ["Darkskull", 60000, "5 lb."],
      ["Decanter of Endless Water", 9000, "2 lb."],
      ["Deck of Illusions", 8100, "0.5 lb."],
      ["Dimensional Shackles", 28000, "5 lb."],
      ["Efreeti Bottle", 145000, "1 lb."],
      ["Eversmoking Bottle", 5400, "1 lb."],
      ["Gem of Brightness", 13000, "—"],
      ["Gem of Seeing", 75000, "—"],
      ["Hand of the Mage", 900, "2 lb."],
      ["Handy Haversack", 2000, "5 lb."],
      ["Instant Fortress", 55000, "—"],
      ["Iron Bands of Binding", 26000, "1 lb."],
      ["Iron Flask", 170000, "1 lb."],
      ["Lantern of Revealing", 30000, "2 lb."],
      ["Mirror of Life Trapping", 200000, "50 lb."],
      ["Mirror of Mental Prowess", 175000, "40 lb."],
      ["Mirror of Opposition", 92000, "45 lb."],
      ["Orb of Storms", 48000, "6 lb."],
      ["Pearl of the Sirines", 15300, "—"],
      ["Portable Hole", 20000, "—"],
      ["Ring Gates", 40000, "2 lb."],
      ["Rope of Climbing", 3000, "3 lb."],
      ["Rope of Entanglement", 21000, "5 lb."],
      ["Stone of Alarm", 2700, "2 lb."],
      ["Stone of Controlling Earth Elementals", 100000, "5 lb."],
      ["Stone of Good Luck", 20000, "—"],
      ["Sustaining Spoon", 5400, "—"],
      ["Well of Many Worlds", 82000, "—"],
      ["Wind Fan", 5500, "—"],
      ...pearlItems,
      ...figurineItems,
      ...inheritedBonusBooks,
      ["Manual of Golems, Flesh", 8000, "5 lb."],
      ["Manual of Golems, Clay", 12000, "5 lb."],
      ["Manual of Golems, Stone", 22000, "5 lb."],
      ["Manual of Golems, Iron", 35000, "5 lb."],
      ["Manual of Golems, Greater Stone", 44000, "5 lb."],
      ["Ioun Stone, Clear Spindle", 4000, "—"],
      ["Ioun Stone, Dusty Rose Prism", 5000, "—"],
      ["Ioun Stone, Deep Red Sphere", 8000, "—"],
      ["Ioun Stone, Incandescent Blue Sphere", 8000, "—"],
      ["Ioun Stone, Pale Blue Rhomboid", 8000, "—"],
      ["Ioun Stone, Pink Rhomboid", 8000, "—"],
      ["Ioun Stone, Pink and Green Sphere", 8000, "—"],
      ["Ioun Stone, Scarlet and Blue Sphere", 8000, "—"],
      ["Ioun Stone, Dark Blue Rhomboid", 10000, "—"],
      ["Ioun Stone, Vibrant Purple Prism", 36000, "—"],
      ["Ioun Stone, Iridescent Spindle", 18000, "—"],
      ["Ioun Stone, Pale Lavender Ellipsoid", 20000, "—"],
      ["Ioun Stone, Pearly White Spindle", 20000, "—"],
      ["Ioun Stone, Pale Green Prism", 30000, "—"],
      ["Ioun Stone, Orange Prism", 30000, "—"],
      ["Ioun Stone, Lavender and Green Ellipsoid", 40000, "—"],
      ["Necklace of Fireballs I", 1650, "—"],
      ["Necklace of Fireballs II", 2700, "—"],
      ["Necklace of Fireballs III", 4350, "—"],
      ["Necklace of Fireballs IV", 5400, "—"],
      ["Necklace of Fireballs V", 5850, "—"],
      ["Necklace of Fireballs VI", 8100, "—"],
      ["Necklace of Fireballs VII", 8700, "—"],
    ];
    const actualItems = storeItems
      .filter((item) => item.category === "Body & Wondrous Items" && !item.custom)
      .map(({ name, price, weight }) => `${name}|${price}|${weight}`)
      .sort();
    expect(actualItems).toEqual(
      expectedItems.map(([name, price, weight]) => `${name}|${price}|${weight}`).sort(),
    );
    expect(new Set(actualItems).size).toBe(expectedItems.length);
    expect(findStoreItem("Pearl of Power (1st)")?.name).toBe("Pearl of Power, 1st-level");
    expect(findStoreItem("Dimensional Anchor")).toBeUndefined();
  });

  it("places other slotless SRD wondrous items in the matching store categories", () => {
    const expectedItems = [
      ["Candle of Invocation", "Consumables", 8400, "0.5 lb."],
      ["Candle of Truth", "Consumables", 2500, "0.5 lb."],
      ["Dust of Appearance", "Consumables", 1800, "—"],
      ["Dust of Disappearance", "Consumables", 3500, "—"],
      ["Dust of Dryness", "Consumables", 850, "—"],
      ["Dust of Illusion", "Consumables", 1200, "—"],
      ["Dust of Tracelessness", "Consumables", 250, "—"],
      ["Elemental Gem", "Consumables", 2250, "—"],
      ["Elixir of Fire Breath", "Consumables", 1100, "—"],
      ["Elixir of Hiding", "Consumables", 250, "—"],
      ["Elixir of Love", "Consumables", 150, "—"],
      ["Elixir of Sneaking", "Consumables", 250, "—"],
      ["Elixir of Swimming", "Consumables", 250, "—"],
      ["Elixir of Truth", "Consumables", 500, "—"],
      ["Elixir of Vision", "Consumables", 250, "—"],
      ["Feather Token, Anchor", "Consumables", 50, "—"],
      ["Feather Token, Fan", "Consumables", 200, "—"],
      ["Feather Token, Bird", "Consumables", 300, "—"],
      ["Feather Token, Tree", "Consumables", 400, "—"],
      ["Feather Token, Swan Boat", "Consumables", 450, "—"],
      ["Feather Token, Whip", "Consumables", 500, "—"],
      ["Incense of Meditation", "Consumables", 4900, "1 lb."],
      ["Marvelous Pigments", "Consumables", 4000, "—"],
      ["Restorative Ointment", "Consumables", 4000, "0.5 lb."],
      ["Salve of Slipperiness", "Consumables", 1000, "—"],
      ["Shroud of Disintegration", "Consumables", 6600, "10 lb."],
      ["Silversheen", "Consumables", 250, "—"],
      ["Sovereign Glue", "Consumables", 2400, "—"],
      ["Stone Salve", "Consumables", 4000, "—"],
      ["Unguent of Timelessness", "Consumables", 150, "—"],
      ["Universal Solvent", "Consumables", 50, "—"],
      ["Apparatus of the Crab", "Mounts & Vehicles", 90000, "500 lb."],
      ["Boat, Folding", "Mounts & Vehicles", 7200, "4 lb."],
      ["Stone Horse, Courser", "Mounts & Vehicles", 10000, "6000 lb."],
      ["Stone Horse, Destrier", "Mounts & Vehicles", 14800, "6000 lb."],
      ["Mattock of the Titans", "Weapons", 23348, "120 lb."],
      ["Maul of the Titans", "Weapons", 25305, "160 lb."],
      ["Scabbard of Keen Edges", "Weapons", 16000, "1 lb."],
      ["Efficient Quiver", "Adventuring Gear", 1800, "2 lb."],
      ["Lens of Detection", "Tools & Kits", 3500, "1 lb."],
      ["Drums of Panic", "Instruments", 30000, "10 lb."],
      ["Harp of Charming", "Instruments", 7500, "5 lb."],
      ["Horn of Blasting", "Instruments", 20000, "1 lb."],
      ["Horn of Blasting, Greater", "Instruments", 70000, "1 lb."],
      ["Horn of Fog", "Instruments", 2000, "1 lb."],
      ["Horn of Goodness/Evil", "Instruments", 6500, "1 lb."],
      ["Horn of the Tritons", "Instruments", 15100, "2 lb."],
      ["Horn of Valhalla", "Instruments", 50000, "2 lb."],
      ["Lyre of Building", "Instruments", 13000, "5 lb."],
      ["Pipes of Haunting", "Instruments", 6000, "3 lb."],
      ["Pipes of Pain", "Instruments", 12000, "3 lb."],
      ["Pipes of the Sewers", "Instruments", 1150, "3 lb."],
      ["Pipes of Sounding", "Instruments", 1800, "3 lb."],
    ] as const;
    for (const [name, category, price, weight] of expectedItems) {
      expect(findStoreItem(name)).toMatchObject({ category, price, weight });
      expect(storeItems.filter((item) => item.name === name)).toHaveLength(1);
    }
    expect(findStoreItem("Drum of Panic")?.name).toBe("Drums of Panic");
  });

  it("includes the SRD shoulder-slot roster with verified prices and weights", () => {
    const expectedItems = [
      ["Cape of the Mountebank", 10080, "1 lb."],
      ["Cloak of Arachnida", 14000, "1 lb."],
      ["Cloak of the Bat", 26000, "1 lb."],
      ["Cloak of Charisma +2", 4000, "2 lb."],
      ["Cloak of Charisma +4", 16000, "2 lb."],
      ["Cloak of Charisma +6", 36000, "2 lb."],
      ["Cloak of Displacement (Minor)", 24000, "1 lb."],
      ["Cloak of Displacement (Major)", 50000, "1 lb."],
      ["Cloak of Elvenkind", 2500, "1 lb."],
      ["Cloak of Etherealness", 55000, "1 lb."],
      ["Cloak of the Manta Ray", 7200, "1 lb."],
      ["Cloak of Resistance +1", 1000, "1 lb."],
      ["Cloak of Resistance +2", 4000, "1 lb."],
      ["Cloak of Resistance +3", 9000, "1 lb."],
      ["Cloak of Resistance +4", 16000, "1 lb."],
      ["Cloak of Resistance +5", 25000, "1 lb."],
      ["Mantle of Faith", 76000, "—"],
      ["Mantle of Spell Resistance", 90000, "—"],
    ] as const;
    const shoulderItems = storeItems.filter((item) => item.category === "Shoulders" && !item.custom);
    expect(shoulderItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price, weight] of expectedItems) {
      expect(shoulderItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight }),
      ]));
    }
    expect(storeItems.filter((item) => item.name === "Cloak of Resistance +1")).toHaveLength(1);
    expect(findStoreItem("Cloak of the Manta")?.name).toBe("Cloak of the Manta Ray");
  });

  it("includes all SRD arms-slot items with verified prices and weights", () => {
    const expectedItems = [
      ["Bracers of Armor +1", 1000],
      ["Bracers of Armor +2", 4000],
      ["Bracers of Armor +3", 9000],
      ["Bracers of Armor +4", 16000],
      ["Bracers of Armor +5", 25000],
      ["Bracers of Armor +6", 36000],
      ["Bracers of Armor +7", 49000],
      ["Bracers of Armor +8", 64000],
      ["Bracers of Archery, Lesser", 5000],
      ["Bracers of Archery, Greater", 25000],
    ] as const;
    const armItems = storeItems.filter((item) => item.category === "Arms" && !item.custom);
    expect(armItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price] of expectedItems) {
      expect(armItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight: "1 lb." }),
      ]));
    }
  });

  it("includes the complete SRD hands-slot roster without duplicate ability items", () => {
    const expectedItems = [
      ["Gauntlets of Ogre Power", 4000, "4 lb."],
      ["Gauntlet of Rust", 11500, "2 lb."],
      ["Gloves of Arrow Snaring", 4000, "—"],
      ["Gloves of Dexterity +2", 4000, "—"],
      ["Gloves of Dexterity +4", 16000, "—"],
      ["Gloves of Dexterity +6", 36000, "—"],
      ["Glove of Storing", 10000, "—"],
      ["Gloves of Swimming and Climbing", 6250, "—"],
    ] as const;
    const handItems = storeItems.filter((item) => item.category === "Hands" && !item.custom);
    expect(handItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price, weight] of expectedItems) {
      expect(handItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight }),
      ]));
    }
    expect(findStoreItem("Gauntlets of Ogre Power +2")?.name).toBe("Gauntlets of Ogre Power");
  });

  it("includes SRD waist items and unique generated Strength variants", () => {
    const expectedItems = [
      ["Belt of Dwarvenkind", 14900, "1 lb."],
      ["Belt of Giant Strength +2", 4000, "1 lb."],
      ["Belt of Giant Strength +4", 16000, "1 lb."],
      ["Belt of Giant Strength +6", 36000, "1 lb."],
      ["Belt, Monk's", 13000, "1 lb."],
    ] as const;
    const waistItems = storeItems.filter((item) => item.category === "Waist" && !item.custom);
    expect(waistItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price, weight] of expectedItems) {
      expect(waistItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight }),
      ]));
    }
  });

  it("includes SRD footwear and keeps horse shoes in the mount category", () => {
    const expectedItems = [
      ["Boots of Elvenkind", 2500, "1 lb."],
      ["Boots of Levitation", 7500, "1 lb."],
      ["Boots of Speed", 12000, "1 lb."],
      ["Boots of Striding and Springing", 5500, "1 lb."],
      ["Boots of Teleportation", 49000, "3 lb."],
      ["Boots of the Winterlands", 2500, "1 lb."],
      ["Boots, Winged", 16000, "1 lb."],
      ["Slippers of Spider Climbing", 4800, "0.5 lb."],
    ] as const;
    const feetItems = storeItems.filter((item) => item.category === "Feet" && !item.custom);
    expect(feetItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price, weight] of expectedItems) {
      expect(feetItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight }),
      ]));
    }
    expect(getInventoryEntryDetails("Slippers of Spider Climbing").numericWeight).toBe(0.5);
    expect(findStoreItem("Winged Boots")?.name).toBe("Boots, Winged");
    expect(findStoreItem("Horseshoes of Speed")).toMatchObject({
      category: "Mounts & Vehicles",
      price: 3000,
      weight: "12 lb.",
    });
    expect(findStoreItem("Horseshoes of a Zephyr")).toMatchObject({
      category: "Mounts & Vehicles",
      price: 6000,
      weight: "4 lb.",
    });
  });

  it("includes the complete SRD ring roster with verified prices and unique protection variants", () => {
    const expectedItems = [
      ["Ring of Animal Friendship", 10800],
      ["Ring of Blinking", 27000],
      ["Ring of Chameleon Power", 12700],
      ["Ring of Climbing", 2500],
      ["Ring of Climbing, Improved", 10000],
      ["Ring of Counterspells", 4000],
      ["Ring of Djinni Calling", 125000],
      ["Ring of Elemental Command", 200000],
      ["Ring of Energy Resistance (Minor)", 12000],
      ["Ring of Energy Resistance (Major)", 28000],
      ["Ring of Energy Resistance (Greater)", 44000],
      ["Ring of Evasion", 25000],
      ["Ring of Feather Falling", 2200],
      ["Ring of Force Shield", 8500],
      ["Ring of Freedom of Movement", 40000],
      ["Ring of Friend Shield", 50000],
      ["Ring of Invisibility", 20000],
      ["Ring of Jumping", 2500],
      ["Ring of Jumping, Improved", 10000],
      ["Ring of Meld into Stone", 27000],
      ["Ring of Mind Shielding", 8000],
      ["Ring of Protection +1", 2000],
      ["Ring of Protection +2", 8000],
      ["Ring of Protection +3", 18000],
      ["Ring of Protection +4", 32000],
      ["Ring of Protection +5", 50000],
      ["Ring of Ram", 8600],
      ["Ring of Regeneration", 90000],
      ["Ring of Shooting Stars", 50000],
      ["Ring of Spell Storing, Minor", 18000],
      ["Ring of Spell Storing", 50000],
      ["Ring of Spell Storing, Major", 200000],
      ["Ring of Spell Turning", 98280],
      ["Ring of Sustenance", 2500],
      ["Ring of Swimming", 2500],
      ["Ring of Swimming, Improved", 10000],
      ["Ring of Telekinesis", 75000],
      ["Ring of Three Wishes", 97950],
      ["Ring of Water Walking", 15000],
      ["Ring of Wizardry I", 20000],
      ["Ring of Wizardry II", 40000],
      ["Ring of Wizardry III", 70000],
      ["Ring of Wizardry IV", 100000],
      ["Ring of X-Ray Vision", 25000],
    ] as const;
    const ringItems = storeItems.filter((item) => item.category === "Rings" && !item.custom);
    expect(ringItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price] of expectedItems) {
      expect(ringItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight: "—" }),
      ]));
    }
    expect(storeItems.filter((item) => item.name === "Ring of Protection +1")).toHaveLength(1);
    for (const [legacyName, canonicalName] of [
      ["Ring of Acid Resistance", "Ring of Energy Resistance (Minor)"],
      ["Ring of Chameleon", "Ring of Chameleon Power"],
      ["Ring of Djinni Summoning", "Ring of Djinni Calling"],
      ["Ring of Greater Energy Resistance", "Ring of Energy Resistance (Greater)"],
      ["Ring of Major Energy Resistance", "Ring of Energy Resistance (Major)"],
      ["Ring of Minor Energy Resistance", "Ring of Energy Resistance (Minor)"],
    ]) {
      expect(findStoreItem(legacyName)?.name).toBe(canonicalName);
    }
  });

  it("includes all SRD head-slot items with verified prices and weights", () => {
    const expectedItems = [
      ["Circlet of Blasting, Minor", 6480, "—"],
      ["Circlet of Blasting, Major", 23760, "—"],
      ["Circlet of Persuasion", 4500, "—"],
      ["Hat of Disguise", 1800, "—"],
      ["Headband of Intellect +2", 4000, "1 lb."],
      ["Headband of Intellect +4", 16000, "1 lb."],
      ["Headband of Intellect +6", 36000, "1 lb."],
      ["Helm of Brilliance", 125000, "3 lb."],
      ["Helm of Comprehend Languages and Read Magic", 5200, "3 lb."],
      ["Helm of Telepathy", 27000, "3 lb."],
      ["Helm of Teleportation", 73500, "3 lb."],
      ["Helm of Underwater Action", 24000, "3 lb."],
      ["Mask of the Skull", 22000, "3 lb."],
      ["Phylactery of Faithfulness", 1000, "—"],
      ["Phylactery of Undead Turning", 11000, "—"],
    ] as const;
    const headItems = storeItems.filter((item) => item.category === "Head" && !item.custom);
    expect(headItems.map((item) => item.name).sort())
      .toEqual(expectedItems.map(([name]) => name).sort());
    for (const [name, price, weight] of expectedItems) {
      expect(headItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ name, price, weight }),
      ]));
    }
    expect(storeItems.filter((item) => item.name === "Headband of Intellect +2")).toHaveLength(1);
  });

  it("invalidates indexes after custom additions and deletions", () => {
    const item: StoreItem = { name: "Regression Test Blade", category: "Weapons",
      custom: true, price: 20, weight: "2 lb.", damage: "1d8" };
    expect(findStoreItem(item.name)).toBeUndefined();
    addCustomStoreItems([item]);
    expect(findStoreItem(item.name)).toBe(item);
    expect(getInventoryEntryDetails(`${item.name} (Medium)`).price).toBe(20);
    addCustomStoreItems([item]);
    expect(storeItems.filter((entry) => entry.name === item.name)).toHaveLength(1);
    deleteCustomStoreItem(item.name);
    expect(findStoreItem(item.name)).toBeUndefined();
  });

  it("does not mutate the live catalog when persistence fails", () => {
    const item: StoreItem = { name: "Unsaved Test Blade", category: "Weapons",
      custom: true, price: 20, weight: "2 lb." };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
    expect(() => addCustomStoreItems([item])).toThrow("Storage full");
    expect(findStoreItem(item.name)).toBeUndefined();
  });
});
