import { type ClassId, type FeatDefinition, type AbilityName } from "../domain";

export const abilities = [
  ["STR", "Strength"],
  ["DEX", "Dexterity"],
  ["CON", "Constitution"],
  ["INT", "Intelligence"],
  ["WIS", "Wisdom"],
  ["CHA", "Charisma"],
];

export const trainedOnlySkills = new Set([
  "Decipher Script", "Disable Device", "Open Lock", "Profession", "Spellcraft",
  "Tumble", "Use Magic Device",
]);

export const limitedUntrainedSkills: Record<string, string> = {
  "Handle Animal": "Charisma checks to handle or push domestic animals only; no teaching, rearing, or training. Druids and rangers can also handle or push their animal companion.",
  "Sleight of Hand": "An untrained check is a Dexterity check and cannot succeed against a DC higher than 10, except when hiding an object on your body.",
};

export const untrainedSkillNotes: Record<string, string> = {
  Appraise: "For common items, an untrained failure gives no estimate; for rare items, an untrained success gives only a rough estimate (50% to 150% of the item's value).",
  "Open Lock": "An untrained character cannot pick a lock, though they might force it open.",
};

export const skillTaskNotes: Record<string, string> = {
  "Disable Device": "Disarming a magic trap requires the Trapfinding class feature.",
  Forgery: "Forging or detecting a document requires literacy in that document's language.",
};

export const skills = [
  "Appraise",
  "Balance",
  "Bluff",
  "Climb",
  "Concentration",
  "Craft",
  "Decipher Script",
  "Diplomacy",
  "Disable Device",
  "Disguise",
  "Escape Artist",
  "Forgery",
  "Gather Information",
  "Handle Animal",
  "Heal",
  "Hide",
  "Intimidate",
  "Jump",
  "Knowledge (arcana)",
  "Knowledge (architecture and engineering)",
  "Knowledge (dungeoneering)",
  "Knowledge (geography)",
  "Knowledge (history)",
  "Knowledge (local)",
  "Knowledge (nature)",
  "Knowledge (nobility and royalty)",
  "Knowledge (religion)",
  "Knowledge (the planes)",
  "Listen",
  "Move Silently",
  "Open Lock",
  "Perform (act)",
  "Perform (comedy)",
  "Perform (dance)",
  "Perform (keyboard instruments)",
  "Perform (mime)",
  "Perform (oratory)",
  "Perform (percussion instruments)",
  "Perform (sing)",
  "Perform (string instruments)",
  "Perform (wind instruments)",
  "Profession",
  "Ride",
  "Search",
  "Sense Motive",
  "Sleight of Hand",
  "Speak Language",
  "Spellcraft",
  "Spot",
  "Survival",
  "Swim",
  "Tumble",
  "Use Magic Device",
  "Use Rope",
];

export const languageCatalog = [
  "Abanasinian",
  "Abyssal",
  "Aquan",
  "Auran",
  "Celestial",
  "Camptalk",
  "Common",
  "Draconic",
  "Druidic",
  "Dargoi",
  "Dargonesti",
  "Dimernesti",
  "Dwarven",
  "Elven",
  "Ergot",
  "Ergothian",
  "Estwilde",
  "Giant",
  "Gnoll",
  "Gnome",
  "Goblin",
  "Gullytalk",
  "Halfling",
  "Hand Talk",
  "Hammertalk",
  "Icespeak",
  "Infernal",
  "Ignan",
  "Kharolian",
  "Khur",
  "Kolshet",
  "Kenderspeak",
  "Kalinese",
  "Kothian",
  "High Ogre",
  "Lemish",
  "Magius",
  "Nestari",
  "Nerakese",
  "Nordmaarian",
  "Ogre",
  "Orc",
  "Que-Nal",
  "Saifhum",
  "Slig",
  "Solamnic",
  "Sylvan",
  "Thanoi",
  "Terran",
  "Undercommon",
  "Wemitowuk",
];

export const dragonlanceLanguages = new Set([
  "Abanasinian",
  "Camptalk",
  "Dargoi",
  "Dargonesti",
  "Dimernesti",
  "Ergot",
  "Ergothian",
  "Estwilde",
  "Gullytalk",
  "Hand Talk",
  "Hammertalk",
  "High Ogre",
  "Icespeak",
  "Kalinese",
  "Kharolian",
  "Khur",
  "Kolshet",
  "Kenderspeak",
  "Kothian",
  "Lemish",
  "Magius",
  "Nerakese",
  "Nestari",
  "Nordmaarian",
  "Ogre",
  "Que-Nal",
  "Saifhum",
  "Slig",
  "Solamnic",
  "Thanoi",
  "Wemitowuk",
]);

export const dragonlanceRegionalLanguages = [
  "Abanasinian",
  "Ergot",
  "Estwilde",
  "Icespeak",
  "Kalinese",
  "Kharolian",
  "Khur",
  "Lemish",
  "Nerakese",
  "Nordmaarian",
  "Que-Nal",
  "Saifhum",
  "Solamnic",
  "Wemitowuk",
];

export const dragonlanceRacialBonusLanguages: Record<string, string[]> = {
  dwarf: ["Giant", "Gnome", "Hammertalk"],
  gnome: ["Dwarven", "Ergot", "Ogre", "Solamnic"],
};

export const racialBonusLanguages: Record<string, string[]> = {
  dwarf: ["Giant", "Gnome", "Goblin", "Orc", "Terran", "Undercommon"],
  elf: ["Draconic", "Gnoll", "Gnome", "Goblin", "Orc", "Sylvan"],
  gnome: ["Draconic", "Dwarven", "Elven", "Giant", "Goblin", "Orc"],
  halfling: ["Dwarven", "Elven", "Gnome", "Goblin", "Orc"],
  "half-orc": ["Draconic", "Giant", "Gnoll", "Goblin", "Abyssal"],
  kender: ["Dwarven", "Ergot", "Elven", "Goblin", "Solamnic"],
  "qualinesti-elf": ["Abanasinian", "Dwarven", "Ergot", "Goblin", "Ogre", "Sylvan"],
  "silvanesti-elf": ["Common", "Dwarven", "Ergot", "Kenderspeak", "Kharolian", "Khur", "Goblin", "Ogre", "Sylvan"],
  "kagonesti-elf": ["Common", "Ergot", "Gnoll", "Goblin", "Ogre", "Solamnic"],
  minotaur: ["Kalinese", "Nordmaarian", "Ogre", "Saifhum"],
  "hill-dwarf": ["Elven", "Goblin", "Ogre"],
  "mountain-dwarf": ["Giant", "Gnome", "Hammertalk"],
  "dark-dwarf": ["Giant", "Gnome", "Hammertalk"],
  irda: ["Dwarven", "Elven", "Kothian", "Sylvan"],
  "baaz-draconian": ["Goblin", "Nerakese", "Ogre"],
  "kapak-draconian": ["Goblin", "Nerakese", "Ogre"],
  "dargonesti-elf": ["Common", "Elven", "Ergot"],
  "dimernesti-elf": ["Aquan", "Common", "Ergot", "Kothian"],
  "gully-dwarf": [],
};

export const racialLanguages: Record<string, string[]> = {
  human: ["Common"],
  dwarf: ["Common", "Dwarven"],
  elf: ["Common", "Elven"],
  "half-elf": ["Common", "Elven"],
  halfling: ["Common", "Halfling"],
  gnome: ["Common", "Gnome"],
  "half-orc": ["Common", "Orc"],
  kender: ["Common", "Kenderspeak"],
  draconian: ["Common"],
  "baaz-draconian": ["Common"],
  "kapak-draconian": ["Common"],
  "qualinesti-elf": ["Common", "Elven"],
  "silvanesti-elf": ["Elven"],
  "kagonesti-elf": ["Elven", "Sylvan"],
  "dargonesti-elf": ["Aquan", "Dargonesti"],
  "dimernesti-elf": ["Elven", "Dimernesti"],
  "dark-dwarf": ["Common", "Dwarven"],
  "hill-dwarf": ["Common", "Dwarven"],
  "mountain-dwarf": ["Common", "Dwarven"],
  "deep-dwarf": ["Common", "Dwarven"],
  minotaur: ["Common", "Kothian"],
  irda: ["Common", "High Ogre"],
  "gully-dwarf": ["Gullytalk", "Common"],
};

export const skillDescriptions: Record<string, string> = {
  Appraise: "Estimate the value of common or rare objects.",
  Balance: "Keep your footing on narrow or unstable surfaces.",
  Bluff: "Convince others that something untrue is believable.",
  Climb: "Climb surfaces, ropes, and other handholds.",
  Concentration: "Maintain focus while distracted, injured, or casting.",
  Craft: "Create or repair items in a chosen craft.",
  "Decipher Script":
    "Understand unfamiliar writing, codes, and ancient scripts.",
  Diplomacy: "Influence attitudes and negotiate agreements.",
  "Disable Device": "Disarm traps and sabotage or repair devices.",
  Disguise: "Change your appearance to look like someone else.",
  "Escape Artist": "Slip restraints or squeeze through tight spaces.",
  Forgery: "Create or detect false documents and signatures.",
  "Gather Information":
    "Learn rumors and useful information through conversation.",
  "Handle Animal": "Train, control, and work with animals.",
  Heal: "Treat wounds, stabilize the dying, and diagnose conditions.",
  Hide: "Conceal yourself from sight.",
  Intimidate: "Influence others through threats or displays of force.",
  Jump: "Leap across gaps or over obstacles.",
  "Knowledge (arcana)":
    "Recall lore about magic, dragons, and magical traditions.",
  "Knowledge (architecture and engineering)":
    "Recall lore about buildings, structures, and engineering.",
  "Knowledge (dungeoneering)":
    "Recall lore about underground environments, aberrations, and caves.",
  "Knowledge (geography)":
    "Recall lore about lands, terrain, climates, and peoples.",
  "Knowledge (history)":
    "Recall important events, rulers, wars, and civilizations.",
  "Knowledge (local)": "Recall lore about a region, its people, and its laws.",
  "Knowledge (nature)":
    "Recall lore about animals, plants, fey, weather, and nature.",
  "Knowledge (nobility and royalty)":
    "Recall lore about noble families, heraldry, and etiquette.",
  "Knowledge (religion)":
    "Recall lore about deities, rites, undead, and religious traditions.",
  "Knowledge (the planes)":
    "Recall lore about the planes, outsiders, and planar portals.",
  Listen: "Notice sounds and details that are not immediately visible.",
  "Move Silently": "Move without making noise.",
  "Open Lock": "Open locks without the proper key.",
  "Perform (act)": "Perform dramatic acting and theatrical roles.",
  "Perform (comedy)": "Perform jokes, comic routines, and humorous stories.",
  "Perform (dance)": "Perform dances and choreographed movement.",
  "Perform (keyboard instruments)": "Play keyboard instruments.",
  "Perform (mime)": "Perform silent physical expression and pantomime.",
  "Perform (oratory)": "Deliver speeches, recitations, and persuasive oratory.",
  "Perform (percussion instruments)": "Play percussion instruments.",
  "Perform (sing)": "Perform vocal music and singing.",
  "Perform (string instruments)": "Play string instruments.",
  "Perform (wind instruments)": "Play wind instruments.",
  Profession: "Practice a trained occupation and earn a living from it.",
  Ride: "Ride and control a mount, including during combat.",
  Search: "Find hidden objects, secret doors, and clues.",
  "Sense Motive":
    "Detect deception and understand another creature's intentions.",
  "Sleight of Hand": "Palm objects, pick pockets, and perform legerdemain.",
  "Speak Language": "Each full rank grants one additional language; no skill check is required.",
  Spellcraft: "Identify spells and understand magical effects.",
  Spot: "Notice creatures, movement, and visual details.",
  Survival: "Track, find food, navigate, and endure the wilderness.",
  Swim: "Move through water and avoid drowning.",
  Tumble: "Roll, dive, and move safely through threatened spaces.",
  "Use Magic Device":
    "Activate magic items despite lacking the usual requirements.",
  "Use Rope": "Tie knots, secure ropes, and work with rope-based tools.",
};

const performSkills = [
  "Perform (act)",
  "Perform (comedy)",
  "Perform (dance)",
  "Perform (keyboard instruments)",
  "Perform (mime)",
  "Perform (oratory)",
  "Perform (percussion instruments)",
  "Perform (sing)",
  "Perform (string instruments)",
  "Perform (wind instruments)",
];

export const classSkills: Partial<Record<ClassId, string[]>> = {
  barbarian: [
    "Climb",
    "Craft",
    "Handle Animal",
    "Intimidate",
    "Jump",
    "Listen",
    "Ride",
    "Survival",
    "Swim",
  ],
  bard: [
    "Appraise",
    "Balance",
    "Bluff",
    "Climb",
    "Concentration",
    "Craft",
    "Decipher Script",
    "Diplomacy",
    "Disguise",
    "Escape Artist",
    "Gather Information",
    "Hide",
    "Jump",
    "Knowledge (arcana)",
    "Knowledge (architecture and engineering)",
    "Knowledge (dungeoneering)",
    "Knowledge (geography)",
    "Knowledge (history)",
    "Knowledge (local)",
    "Knowledge (nature)",
    "Knowledge (nobility and royalty)",
    "Knowledge (religion)",
    "Knowledge (the planes)",
    "Listen",
    "Move Silently",
    ...performSkills,
    "Profession",
    "Sense Motive",
    "Sleight of Hand",
    "Speak Language",
    "Spellcraft",
    "Swim",
    "Tumble",
    "Use Magic Device",
    "Use Rope",
  ],
  cleric: [
    "Concentration",
    "Craft",
    "Diplomacy",
    "Heal",
    "Knowledge (arcana)",
    "Knowledge (history)",
    "Knowledge (religion)",
    "Knowledge (the planes)",
    "Profession",
    "Spellcraft",
  ],
  druid: [
    "Concentration",
    "Craft",
    "Diplomacy",
    "Handle Animal",
    "Heal",
    "Knowledge (nature)",
    "Listen",
    "Profession",
    "Ride",
    "Spellcraft",
    "Spot",
    "Survival",
    "Swim",
  ],
  fighter: [
    "Climb",
    "Craft",
    "Handle Animal",
    "Intimidate",
    "Jump",
    "Ride",
    "Swim",
  ],
  monk: [
    "Balance",
    "Climb",
    "Concentration",
    "Craft",
    "Diplomacy",
    "Escape Artist",
    "Hide",
    "Jump",
    "Knowledge (arcana)",
    "Knowledge (religion)",
    "Listen",
    "Move Silently",
    ...performSkills,
    "Profession",
    "Sense Motive",
    "Spot",
    "Swim",
    "Tumble",
  ],
  paladin: [
    "Concentration",
    "Craft",
    "Diplomacy",
    "Handle Animal",
    "Heal",
    "Knowledge (nobility and royalty)",
    "Knowledge (religion)",
    "Profession",
    "Ride",
    "Sense Motive",
  ],
  ranger: [
    "Climb",
    "Concentration",
    "Craft",
    "Handle Animal",
    "Heal",
    "Hide",
    "Jump",
    "Knowledge (dungeoneering)",
    "Knowledge (geography)",
    "Knowledge (nature)",
    "Listen",
    "Move Silently",
    "Profession",
    "Ride",
    "Search",
    "Spot",
    "Survival",
    "Swim",
    "Use Rope",
  ],
  rogue: [
    "Appraise",
    "Balance",
    "Bluff",
    "Climb",
    "Craft",
    "Decipher Script",
    "Diplomacy",
    "Disable Device",
    "Disguise",
    "Escape Artist",
    "Forgery",
    "Gather Information",
    "Hide",
    "Intimidate",
    "Jump",
    "Knowledge (local)",
    "Listen",
    "Move Silently",
    "Open Lock",
    ...performSkills,
    "Search",
    "Sense Motive",
    "Sleight of Hand",
    "Spot",
    "Swim",
    "Tumble",
    "Use Magic Device",
    "Use Rope",
  ],
  sorcerer: [
    "Bluff",
    "Concentration",
    "Craft",
    "Knowledge (arcana)",
    "Profession",
    "Spellcraft",
  ],
  wizard: [
    "Concentration",
    "Craft",
    "Decipher Script",
    "Knowledge (arcana)",
    "Knowledge (architecture and engineering)",
    "Knowledge (dungeoneering)",
    "Knowledge (geography)",
    "Knowledge (history)",
    "Knowledge (local)",
    "Knowledge (nature)",
    "Knowledge (nobility and royalty)",
    "Knowledge (religion)",
    "Knowledge (the planes)",
    "Profession",
    "Spellcraft",
  ],
  mystic: [
    "Concentration",
    "Craft",
    "Diplomacy",
    "Heal",
    "Knowledge (arcana)",
    "Knowledge (nature)",
    "Knowledge (religion)",
    "Profession",
    "Spellcraft",
  ],
  noble: [
    "Appraise",
    "Bluff",
    "Diplomacy",
    "Disguise",
    "Forgery",
    "Gather Information",
    "Knowledge (history)",
    "Knowledge (local)",
    "Knowledge (nobility and royalty)",
    "Listen",
    "Perform (oratory)",
    "Profession",
    "Ride",
    "Sense Motive",
    "Speak Language",
  ],
};

const featCatalogSourceBook = "Player's Handbook (3.5)";
const dragonlanceFeatSourceBook = "Dragonlance Campaign Setting (3.5)";
type CatalogFeat = Omit<FeatDefinition, "source"> & {
  source?: FeatDefinition["source"];
};

export const featCatalog: FeatDefinition[] = ([
  {
    id: "cornered-rat",
    name: "Cornered Rat",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "After an enemy tries to Intimidate you, or after you make a Diplomacy check, gain +2 on attacks on your next action. If you attack that enemy or Diplomacy target, it must succeed on a DC 10 Sense Motive check or be flat-footed.",
    prerequisites: { races: ["Gully Dwarf"], baseAttackBonus: 1 },
  },
  {
    id: "draconian-breath-weapon",
    name: "Draconian Breath Weapon",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Once per day, use a supernatural breath weapon for 3d8 damage (Reflex half; DC 10 + half your HD + Con modifier): Baaz fire line 60 ft.; Kapak acid line 60 ft.; Bozak lightning line 60 ft.; Sivak cold cone 30 ft.; Aurak fire cone 30 ft.",
    prerequisites: {
      races: [
        "Draconian",
        "Baaz Draconian",
        "Kapak Draconian",
        "Bozak Draconian",
        "Sivak Draconian",
        "Aurak Draconian",
      ],
      baseSaves: { will: 4 },
    },
  },
  {
    id: "flyby-breath",
    name: "Flyby Breath",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "While flying, use your breath weapon as a free action if you do nothing but move that turn; this cannot be combined with a Run action and grants no extra breath weapon uses. Flyby Attack is enforced; verify fly speed and non-draconian breath weapons manually.",
    prerequisites: {
      feats: ["flyby-attack"],
      draconianBreathWeapon: true,
    },
  },
  {
    id: "armor-proficiency-light",
    name: "Armor Proficiency (Light)",
    description: "Wear light armor without applying its check penalty to attacks or normally unaffected Strength/Dexterity checks.",
  },
  {
    id: "armor-proficiency-medium",
    name: "Armor Proficiency (Medium)",
    description: "Wear medium armor without nonproficiency penalties.",
    prerequisites: { feats: ["armor-proficiency-light"] },
  },
  {
    id: "armor-proficiency-heavy",
    name: "Armor Proficiency (Heavy)",
    description: "Wear heavy armor without nonproficiency penalties.",
    prerequisites: { feats: ["armor-proficiency-light", "armor-proficiency-medium"] },
  },
  {
    id: "shield-proficiency",
    name: "Shield Proficiency",
    description: "Use shields other than tower shields without nonproficiency penalties.",
  },
  {
    id: "martial-weapon-proficiency",
    name: "Martial Weapon Proficiency",
    description: "Choose one martial weapon and use it without the nonproficiency penalty.",
    fighterBonus: true,
  },
  {
    id: "honor-bound",
    name: "Honor-bound",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain a +2 circumstance bonus on a saving throw when failure would break a promise, oath, or sworn duty. After willingly breaking an oath, the feat's benefit is suspended until atonement.",
  },
  {
    id: "hulking-brute",
    name: "Hulking Brute",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "For size-based opposed rolls and size-based monster special attacks, count as Large when advantageous. This feat can only be selected in a 1st-level feat slot.",
    prerequisites: { races: ["Half-ogre", "Minotaur"] },
    firstLevelOnly: true,
  },
  {
    id: "improved-draconian-breath-weapon",
    name: "Improved Draconian Breath Weapon",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Use your draconian breath weapon three times per day; it deals 6d8 damage (Reflex half; DC 10 + half your HD + Con modifier).",
    prerequisites: {
      races: [
        "Draconian",
        "Baaz Draconian",
        "Kapak Draconian",
        "Bozak Draconian",
        "Sivak Draconian",
        "Aurak Draconian",
      ],
      baseSaves: { will: 8 },
      feats: ["draconian-breath-weapon"],
    },
  },
  {
    id: "improved-resist-dragonfear",
    name: "Improved Resist Dragonfear",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain +8 on Will saves against dragons' frightful presence. The prerequisite of having taken damage from a dragon attack must be confirmed manually.",
    prerequisites: { baseAttackBonus: 6 },
  },
  {
    id: "reserves-of-strength",
    name: "Reserves of Strength",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When casting a spell, increase its caster level by 1, 2, or 3, including beyond level-based spell limits, then be stunned for that many rounds. If immune to stunning, take 1d6, 3d6, or 5d6 damage instead.",
    prerequisites: { casterLevel: 1, feats: ["iron-will"] },
  },
  {
    id: "resist-dragonfear",
    name: "Resist Dragonfear",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain +4 on Will saves against dragons' frightful presence. The prerequisite of having encountered a dragon must be confirmed manually.",
    prerequisites: { baseAttackBonus: 3 },
  },
  {
    id: "spear-of-doom",
    name: "Spear of Doom",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When readying a spear, longspear, trident, halberd, or dwarven urgrosh against a charge, gain +4 on the attack and deal double damage. Against a noncharging foe entering a threatened square, gain +4 on the attack only.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "spectacular-death-throes",
    name: "Spectacular Death Throes",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Enhances your death throes: Baaz statues explode next round (20-ft. area, +10 ranged attack, 1d10 + Con damage); Kapak bursts deal 4d6 acid (20-ft., Reflex half); Bozak bursts deal 6d6 (20-ft., Reflex half or prone); Sivak slayers risk one negative level per 2 HD (Fortitude negates); Aurak bursts deal 6d6 (20-ft.) and repeat each turn for 5 rounds at a random point 30 ft. away. Resolve manually.",
    prerequisites: {
      races: [
        "Draconian",
        "Baaz Draconian",
        "Kapak Draconian",
        "Bozak Draconian",
        "Sivak Draconian",
        "Aurak Draconian",
      ],
    },
  },
  {
    id: "strafing-breath",
    name: "Strafing Breath",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When flying and using your breath weapon, extend its ground area along a straight flight path by up to half your fly speed. Flyby Attack and Flyby Breath are enforced; verify fly speed and non-draconian breath weapons manually, and resolve the area calculation manually.",
    prerequisites: {
      feats: ["flyby-attack", "flyby-breath"],
      draconianBreathWeapon: true,
    },
  },
  {
    id: "tremendous-charge",
    name: "Tremendous Charge",
    source: "dragonlance-user-pack",
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Mounted with a heavy lance or similar weapon, use your mount's Strength modifier for damage on a charge (double damage as usual). After the attack, the weapon must succeed on a DC 8 Fortitude save or break.",
    prerequisites: {
      skills: { Ride: 1 },
      feats: ["mounted-combat"],
    },
    fighterBonus: true,
  },
  {
    id: "tower-shield-proficiency",
    name: "Tower Shield Proficiency",
    description: "Use tower shields without nonproficiency penalties. Other tower shield restrictions still apply.",
    prerequisites: { feats: ["shield-proficiency"] },
  },
  {
    id: "scribe-scroll",
    name: "Scribe Scroll",
    description: "Create magic scrolls containing spells you can cast.",
    prerequisites: { casterLevel: 1 },
  },
  {
    id: "craft-wand",
    name: "Craft Wand",
    description: "Create wands containing spells of 4th level or lower.",
    prerequisites: { casterLevel: 5 },
  },
  {
    id: "alertness",
    name: "Alertness",
    description: "+2 bonus on Listen and Spot checks.",
  },
  {
    id: "blind-fight",
    name: "Blind-Fight",
    description: "Reroll miss chances from concealment in melee.",
    fighterBonus: true,
  },
  {
    id: "combat-casting",
    name: "Combat Casting",
    description:
      "+4 bonus on Concentration checks for defensive casting or casting while grappled or pinned.",
  },
  {
    id: "combat-reflexes",
    name: "Combat Reflexes",
    description: "Make additional attacks of opportunity equal to your Dexterity bonus and while flat-footed.",
    fighterBonus: true,
  },
  {
    id: "combat-expertise",
    name: "Combat Expertise",
    description: "Trade attack bonus for dodge bonus to Armor Class.",
    prerequisites: { abilities: { int: 13 } },
    fighterBonus: true,
  },
  {
    id: "cleave",
    name: "Cleave",
    description: "Make one extra melee attack after dropping an opponent.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "deceitful",
    name: "Deceitful",
    description: "+2 bonus on Disguise and Forgery checks.",
  },
  {
    id: "dodge",
    name: "Dodge",
    description:
      "+1 dodge bonus to Armor Class against one designated opponent.",
    prerequisites: { abilities: { dex: 13 } },
    fighterBonus: true,
  },
  {
    id: "endurance",
    name: "Endurance",
    description:
      "+4 bonus on checks to resist exhausting environmental conditions.",
  },
  {
    id: "track",
    name: "Track",
    description: "Follow tracks via Survival.",
  },
  {
    id: "diehard",
    name: "Diehard",
    description: "Remain conscious and act while below 0 hit points.",
    prerequisites: { feats: ["endurance"] },
  },
  {
    id: "deflect-arrows",
    name: "Deflect Arrows",
    description: "Deflect one ranged weapon attack each round.",
    prerequisites: {
      abilities: { dex: 13 },
      feats: ["improved-unarmed-strike"],
    },
    fighterBonus: true,
  },
  {
    id: "great-cleave",
    name: "Great Cleave",
    description: "Make multiple Cleave attacks in one round.",
    prerequisites: {
      abilities: { str: 13 },
      baseAttackBonus: 4,
      feats: ["cleave", "power-attack"],
    },
    fighterBonus: true,
  },
  {
    id: "improved-two-weapon-fighting",
    name: "Improved Two-Weapon Fighting",
    description: "Gain a second off-hand attack when using two weapons.",
    prerequisites: {
      abilities: { dex: 17 },
      baseAttackBonus: 6,
      feats: ["two-weapon-fighting"],
    },
    fighterBonus: true,
  },
  {
    id: "great-fortitude",
    name: "Great Fortitude",
    description: "+2 bonus on Fortitude saves.",
  },
  {
    id: "greater-two-weapon-fighting",
    name: "Greater Two-Weapon Fighting",
    description: "Gain a third off-hand attack when using two weapons.",
    prerequisites: {
      abilities: { dex: 19 },
      baseAttackBonus: 11,
      feats: ["improved-two-weapon-fighting", "two-weapon-fighting"],
    },
    fighterBonus: true,
  },
  {
    id: "improved-bull-rush",
    name: "Improved Bull Rush",
    description: "Avoid attacks of opportunity when bull rushing.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-critical",
    name: "Improved Critical",
    description: "Double the threat range of one selected weapon; this does not stack with Keen.",
    prerequisites: { baseAttackBonus: 8 },
    fighterBonus: true,
  },
  {
    id: "improved-disarm",
    name: "Improved Disarm",
    description: "Avoid attacks of opportunity when attempting to disarm.",
    prerequisites: { abilities: { int: 13 }, feats: ["combat-expertise"] },
    fighterBonus: true,
  },
  {
    id: "improved-grapple",
    name: "Improved Grapple",
    description: "Avoid attacks of opportunity when grappling.",
    prerequisites: {
      abilities: { dex: 13 },
      feats: ["improved-unarmed-strike"],
    },
    fighterBonus: true,
  },
  {
    id: "improved-initiative",
    name: "Improved Initiative",
    description: "+4 bonus on initiative checks.",
    fighterBonus: true,
  },
  {
    id: "improved-overrun",
    name: "Improved Overrun",
    description: "Avoid attacks of opportunity when overrunning an opponent.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-precise-shot",
    name: "Improved Precise Shot",
    description: "Ignore less than total concealment and cover when making ranged attacks.",
    prerequisites: {
      abilities: { dex: 19 },
      baseAttackBonus: 11,
      feats: ["point-blank-shot", "precise-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "improved-sunder",
    name: "Improved Sunder",
    description: "Avoid attacks of opportunity when attempting to sunder.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-trip",
    name: "Improved Trip",
    description:
      "Avoid attacks of opportunity when tripping and gain a follow-up attack.",
    prerequisites: { abilities: { int: 13 }, feats: ["combat-expertise"] },
    fighterBonus: true,
  },
  {
    id: "improved-unarmed-strike",
    name: "Improved Unarmed Strike",
    description: "Attack unarmed without provoking attacks of opportunity.",
    fighterBonus: true,
  },
  {
    id: "investigator",
    name: "Investigator",
    description: "+2 bonus on Search and Gather Information checks.",
  },
  {
    id: "iron-will",
    name: "Iron Will",
    description: "+2 bonus on Will saves.",
  },
  {
    id: "lightning-reflexes",
    name: "Lightning Reflexes",
    description: "+2 bonus on Reflex saves.",
  },
  {
    id: "manyshot",
    name: "Manyshot",
    description: "Fire multiple arrows as a single attack against one target.",
    prerequisites: {
      abilities: { dex: 17 },
      baseAttackBonus: 6,
      feats: ["point-blank-shot", "rapid-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "magical-aptitude",
    name: "Magical Aptitude",
    description: "+2 bonus on Spellcraft and Use Magic Device checks.",
  },
  {
    id: "mobility",
    name: "Mobility",
    description:
      "+4 dodge bonus to Armor Class against attacks of opportunity caused by movement.",
    prerequisites: { abilities: { dex: 13 }, feats: ["dodge"] },
    fighterBonus: true,
  },
  {
    id: "negotiator",
    name: "Negotiator",
    description: "+2 bonus on Diplomacy and Sense Motive checks.",
  },
  {
    id: "nimble-fingers",
    name: "Nimble Fingers",
    description: "+2 bonus on Disable Device and Open Lock checks.",
  },
  {
    id: "point-blank-shot",
    name: "Point Blank Shot",
    description: "+1 attack and damage within 30 feet.",
    fighterBonus: true,
  },
  {
    id: "power-attack",
    name: "Power Attack",
    description: "Trade melee attack bonus for melee damage.",
    prerequisites: { abilities: { str: 13 } },
    fighterBonus: true,
  },
  {
    id: "precise-shot",
    name: "Precise Shot",
    description: "Ignore the normal -4 penalty for shooting into melee.",
    prerequisites: { feats: ["point-blank-shot"] },
    fighterBonus: true,
  },
  {
    id: "persuasive",
    name: "Persuasive",
    description: "+2 bonus on Bluff and Intimidate checks.",
  },
  {
    id: "quick-draw",
    name: "Quick Draw",
    description: "Draw a weapon as a free action.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "rapid-shot",
    name: "Rapid Shot",
    description: "Make one extra ranged attack during a full attack.",
    prerequisites: { abilities: { dex: 13 }, feats: ["point-blank-shot"] },
    fighterBonus: true,
  },
  {
    id: "run",
    name: "Run",
    description: "Move five times your normal speed when running.",
  },
  {
    id: "self-sufficient",
    name: "Self-Sufficient",
    description: "+2 bonus on Heal and Survival checks.",
  },
  {
    id: "skill-focus",
    name: "Skill Focus",
    description: "+3 bonus on one selected skill.",
  },
  {
    id: "spell-focus",
    name: "Spell Focus",
    description: "+1 save DC for one school.",
  },
  {
    id: "greater-spell-focus",
    name: "Greater Spell Focus",
    description: "+1 more save DC for a Spell Focus school.",
    prerequisites: { feats: ["spell-focus"] },
  },
  {
    id: "empower-spell",
    name: "Empower Spell",
    description: "Variable numeric effects +50%; slot +2.",
    prerequisites: { arcaneSpellLevel: 3 },
  },
  {
    id: "heighten-spell",
    name: "Heighten Spell",
    description: "Raises a prepared spell's effective level, save DC, and slot (maximum 9).",
  },
  {
    id: "maximize-spell",
    name: "Maximize Spell",
    description: "Maximizes variable numeric effects; slot +3.",
    prerequisites: {
      arcaneSpellLevel: 3,
      anyFeats: [
        "empower-spell",
        "heighten-spell",
        "extend-spell",
        "enlarge-spell",
        "quicken-spell",
        "silent-spell",
        "still-spell",
        "widen-spell",
        "sculpt-spell",
      ],
    },
  },
  {
    id: "extend-spell",
    name: "Extend Spell",
    description: "Doubles eligible durations; slot +1.",
  },
  {
    id: "enlarge-spell",
    name: "Enlarge Spell",
    description: "Doubles eligible ranges; slot +1.",
  },
  {
    id: "quicken-spell",
    name: "Quicken Spell",
    description: "Cast an eligible prepared spell as a free action; slot +4.",
  },
  {
    id: "silent-spell",
    name: "Silent Spell",
    description: "Cast a spell without verbal components; slot +1.",
  },
  {
    id: "still-spell",
    name: "Still Spell",
    description: "Cast a spell without somatic components; slot +1.",
  },
  {
    id: "widen-spell",
    name: "Widen Spell",
    description: "Double eligible areas; slot +3.",
  },
  {
    id: "sculpt-spell",
    name: "Sculpt Spell",
    description: "Reshape an area spell; slot +1.",
    prerequisites: {
      anyFeats: [
        "empower-spell",
        "heighten-spell",
        "maximize-spell",
        "extend-spell",
        "enlarge-spell",
        "quicken-spell",
        "silent-spell",
        "still-spell",
        "widen-spell",
      ],
    },
  },
  {
    id: "spell-penetration",
    name: "Spell Penetration",
    description: "+2 on checks vs. spell resistance.",
  },
  {
    id: "greater-spell-penetration",
    name: "Greater Spell Penetration",
    description: "+2 more on checks vs. spell resistance.",
    prerequisites: { feats: ["spell-penetration"] },
  },
  {
    id: "spring-attack",
    name: "Spring Attack",
    description:
      "Move before and after a melee attack without provoking from the target.",
    prerequisites: {
      abilities: { dex: 13 },
      baseAttackBonus: 4,
      feats: ["dodge", "mobility"],
    },
    fighterBonus: true,
  },
  {
    id: "stunning-fist",
    name: "Stunning Fist",
    description: "Stun a target with an unarmed strike.",
    prerequisites: {
      abilities: { dex: 13, wis: 13 },
      baseAttackBonus: 8,
      feats: ["improved-unarmed-strike"],
    },
    fighterBonus: true,
  },
  {
    id: "toughness",
    name: "Toughness",
    description: "Gain 3 additional hit points.",
  },
  {
    id: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description: "Reduce penalties when fighting with two weapons.",
    prerequisites: { abilities: { dex: 15 } },
    fighterBonus: true,
  },
  {
    id: "weapon-finesse",
    name: "Weapon Finesse",
    description:
      "Use Dexterity instead of Strength for attacks with a light weapon.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "exotic-weapon-proficiency",
    name: "Exotic Weapon Proficiency",
    description: "Gain proficiency with one selected exotic weapon type.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "weapon-specialization",
    name: "Weapon Specialization",
    description: "+2 damage with one selected weapon type.",
    prerequisites: { classLevels: { fighter: 4 }, feats: ["weapon-focus"] },
    fighterBonus: true,
  },
  {
    id: "weapon-focus",
    name: "Weapon Focus",
    description: "+1 attack with one selected weapon type.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "whirlwind-attack",
    name: "Whirlwind Attack",
    description: "Make one melee attack against every nearby opponent.",
    prerequisites: {
      abilities: { dex: 13, int: 13 },
      baseAttackBonus: 4,
      feats: ["dodge", "mobility", "spring-attack"],
    },
    fighterBonus: true,
  },
] satisfies CatalogFeat[]).map((feat: CatalogFeat) => ({
  ...feat,
  source: feat.source ?? "core-35-srd",
  sourceBook: feat.sourceBook ?? featCatalogSourceBook,
}));

export const abilityNames: AbilityName[] = ["str", "dex", "con", "int", "wis", "cha"];

export const abilityLabels: Record<AbilityName, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export const startingClassFeatures: Partial<Record<ClassId, string[]>> = {
  barbarian: ["Rage", "Fast Movement"],
  bard: [
    "Bardic Knowledge",
    "Bardic Music",
    "Countersong",
    "Fascinate",
    "Inspire Courage",
  ],
  cleric: ["Turn or Rebuke Undead", "Domains"],
  druid: ["Animal Companion", "Nature Sense", "Wild Empathy"],
  fighter: ["Bonus Feat"],
  monk: ["Bonus Feat", "Flurry of Blows", "Unarmed Strike"],
  paladin: ["Aura of Good", "Detect Evil", "Smite Evil"],
  ranger: ["Favored Enemy", "Track", "Wild Empathy"],
  rogue: ["Sneak Attack", "Trapfinding"],
  sorcerer: ["Spells", "Summon Familiar"],
  wizard: ["Scribe Scroll", "Spellbook", "Summon Familiar"],
  mystic: ["Domain", "Divine Spellcasting"],
  noble: ["Bonus Class Skill", "Favor +1"],
};

const inspireCourageDescription =
  "Grant allies a morale bonus on attack rolls and weapon damage rolls and on saves against fear and charm effects.";

export const classFeatureDescriptions: Record<string, string> = {
  "Bardic Knowledge":
    "Roll d20 + Bard level + Intelligence modifier to recall relevant lore; 5 ranks in Knowledge (history) add +2. The DM sets the DC, and you cannot take 10 or 20.",
  "Bardic Music":
    "Daily uses equal Bard level and are shared among music effects, except Suggestion and Mass Suggestion, which expend no use. Perform ranks required: 3 for Countersong, Fascinate, and Inspire Courage; 6 for Inspire Competence; 9 for Suggestion; 12 for Inspire Greatness; 15 for Song of Freedom; 18 for Inspire Heroics; 21 for Mass Suggestion. You must also meet each ability's Bard-level requirement. Starting an effect is a standard action unless its description says otherwise; some require concentration. While performing, you cannot cast spells or activate scrolls or wands. Deafness gives a 20% failure chance, but a failed attempt still uses a daily use. Track uses manually.",
  Countersong:
    "Each round, roll Perform while maintaining this effect (up to 10 rounds). A creature within 30 feet affected by a sonic or language-dependent magical effect can use your check result instead of its save if higher; an ongoing effect allows another save each round using your check result. It does not counter effects that allow no save or spells that merely have verbal components.",
  Fascinate:
    "With 3 Perform ranks, make a Perform check as the Will save DC for creatures within 90 feet that can see and hear you and are not threatened. Concentrate to maintain the effect for up to 1 round per Bard level; target one additional creature per three Bard levels beyond 1st.",
  "Inspire Courage": inspireCourageDescription,
  "Inspire Courage +1": inspireCourageDescription,
  "Inspire Courage +2": inspireCourageDescription,
  "Inspire Courage +3": inspireCourageDescription,
  "Inspire Courage +4": inspireCourageDescription,
  Domain:
    "Mystics choose one domain. Its granted power and domain spells are tracked manually.",
  "Combat Style":
    "Choose Rapid Shot or Two-Weapon Fighting as a bonus feat. Combat style benefits function only in light or no armor.",
  "Improved Combat Style":
    "Choose Manyshot or Improved Two-Weapon Fighting as a bonus feat, following your combat style. Combat style benefits function only in light or no armor.",
  "Combat Style Mastery":
    "Choose Improved Precise Shot or Greater Two-Weapon Fighting as a bonus feat, following your combat style. Combat style benefits function only in light or no armor.",
  "Strength of Honor (1/day)":
    "Once per day, gain a +4 morale bonus to Strength for 3 + Charisma-modifier rounds as a free action.",
  "Strength of Honor (2/day)":
    "Strength of Honor can be used twice per day.",
  "Strength of Honor (3/day)":
    "Strength of Honor can be used three times per day.",
  "Strength of Honor (4/day)":
    "Strength of Honor can be used four times per day.",
  "Knightly Courage":
    "Add a positive Charisma modifier as a morale bonus on saves against fear.",
  "Heroic Initiative +1":
    "Gain a +1 bonus on initiative checks.",
  "Heroic Initiative +2":
    "Gain a +2 bonus on initiative checks.",
  "Heroic Initiative +3":
    "Gain a +3 bonus on initiative checks.",
  "Fight to the Death":
    "Gain Diehard as a bonus feat, even without its prerequisite.",
  "Honorable Will":
    "Add a positive Charisma modifier as a morale bonus on saves against compulsion.",
  "Might of Honor":
    "Strength of Honor's morale bonus to Strength increases to +6.",
  "Armored Mobility":
    "Crown Knights treat heavy armor as medium and reduce its armor check penalty by 1; Lily Knights treat heavy armor as medium.",
  "Aura of Courage":
    "While conscious, become immune to fear; allies within 10 feet gain +4 on saves against fear.",
  "Crown of Knighthood":
    "Add Charisma as a morale bonus on saves and +4 on compulsion saves. Once per day, gain heroic valor's +4 attack, damage, and save bonuses plus 15 temporary HP for 10 minutes.",
  "Smite Evil (1/day)":
    "Once per day, add positive Charisma to one melee attack and deal extra damage equal to Knight of the Sword level; a failed alignment match still expends the use.",
  "Smite Evil (2/day)":
    "The Knight of the Sword can smite evil twice per day.",
  "Smite Evil (3/day)":
    "The Knight of the Sword can smite evil three times per day.",
  "Aura of Good":
    "The aura's strength equals Knight of the Sword or Rose levels plus cleric/mystic levels, and for a Rose Knight also Knight of the Sword levels.",
  "Turn Undead":
    "Turn undead using the effective cleric level specified by the prestige-class feature; apply daily uses and level stacking manually.",
  "Soul of Knighthood":
    "At 10th level, weapons count as holy for overcoming certain evil outsiders' damage reduction; once per day, gain holy aura for 10 rounds.",
  "Rallying Cry":
    "As a free action, up to three times per day, allies within 60 feet gain +1 morale on their next attack and +5 feet speed on their next action.",
  "Detect Evil":
    "Detect evil at will as the spell.",
  "Inspire Courage +2 (2/day)":
    "Twice per day, allies who hear the Knight speak gain +2 morale on attacks, weapon damage, and saves against fear and charm; the effect lasts while speaking and 5 rounds after.",
  "Inspire Courage +3 (3/day)":
    "As Inspire Courage +2, with a +3 bonus and three uses per day.",
  "Inspire Courage +4 (4/day)":
    "As Inspire Courage +2, with a +4 bonus and four uses per day.",
  "Leadership Bonus +1":
    "Gain +1 to Leadership score. Rose Knight bonuses are +1 at level 3 and +2 at level 7; Tactician bonuses are listed by level.",
  "Leadership Bonus +2":
    "Gain the listed +2 bonus to Leadership score.",
  "Leadership Bonus +3":
    "Gain the listed +3 bonus to Leadership score.",
  "Leadership Bonus +4":
    "Gain the listed +4 bonus to Leadership score.",
  "Leadership Bonus +5":
    "Gain the listed +5 bonus to Leadership score.",
  "Divine Grace":
    "Add positive Charisma modifier to all saving throws; this does not stack with a similar ability.",
  "Inspire Greatness":
    "Inspire one willing ally within 30 feet (and one more per three Knight of the Rose levels beyond 4th), granting two d10 bonus Hit Dice, +2 competence on attacks, and +1 competence on Fortitude saves.",
  "Wisdom of the Measure":
    "Twice per day, a DC 14 Knowledge (nobility and royalty) check can provide information equivalent to augury.",
  "Final Stand":
    "Once per day, nearby allies gain 2d10 temporary hit points for rounds equal to the number of affected creatures.",
  "Knighthood’s Flower":
    "Immune to compulsion effects (except harmless ones); once per day, gain foresight for 100 minutes, affecting only yourself.",
  "Sneak Attack +1d6":
    "Deal +1d6 precision damage when the target is denied Dexterity to AC or is flanked; apply normal sneak-attack restrictions.",
  "Sneak Attack +2d6":
    "The Knight of the Lily's sneak attack increases to +2d6; it stacks with sneak attack from other sources.",
  "Sneak Attack +3d6":
    "The Knight of the Lily's sneak attack increases to +3d6; it stacks with sneak attack from other sources.",
  "Sneak Attack +4d6":
    "The Knight of the Lily's sneak attack increases to +4d6; it stacks with sneak attack from other sources.",
  Demoralize:
    "Gain +2 profane on Intimidate checks to demoralize in combat; a success leaves the target shaken for 1 round per Knight of the Lily level.",
  "Unbreakable Will (+2)":
    "Become immune to fear and gain +2 morale on saves against mind-affecting magic.",
  "Unbreakable Will (+4)":
    "Become immune to fear and gain +4 morale on saves against mind-affecting magic.",
  "One Thought":
    "At 10th level, if a Knight of the Lily within 100 feet is not surprised or flat-footed, you are not either; you cannot be flanked unless all such knights are flanked.",
  "Detect Good":
    "Detect good at will as the spell.",
  "Smite Good (1/day)":
    "Once per day, add positive Charisma to one melee attack and deal extra damage equal to Knight of the Skull level.",
  "Smite Good (2/day)":
    "The Knight of the Skull can smite good twice per day.",
  "Smite Good (3/day)":
    "The Knight of the Skull can smite good three times per day.",
  "Aura of Evil":
    "The aura's strength equals Knight of the Skull levels plus cleric levels.",
  "Dark Blessing":
    "Add positive Charisma modifier to all saving throws.",
  "Discern Lies":
    "Use discern lies as a spell-like ability a number of times per day equal to Wisdom modifier.",
  "Rebuke Undead":
    "Rebuke undead as an evil cleric; use Knight of the Skull level -2, adding that amount to cleric levels if applicable.",
  "Favor of the Dark Queen":
    "At 10th level, a touched melee weapon is unholy for damage-reduction purposes and deals +1d6 unholy damage to good creatures.",
  Diviner:
    "Cast divination spells at +1 caster level; wizards and sorcerers also gain diviner specialist benefits without losing access to other schools.",
  "Read Omens":
    "Add augury as a 2nd-level arcane spell; a sorcerer's spell-known limit is not reduced.",
  "Armored Spellcasting (5%)":
    "Reduce arcane spell failure from armor by 5 percentage points.",
  "Armored Spellcasting (10%)":
    "Reduce arcane spell failure from armor by 10 percentage points.",
  "Armored Spellcasting (20%)":
    "Reduce arcane spell failure from armor by 20 percentage points.",
  "Aura of Terror":
    "Creatures within 10 feet must save (DC 10 + Knight of the Thorn level + Charisma modifier) or become shaken; a successful save grants immunity for one day.",
  "Weapon Touch":
    "Deliver a touch spell through a melee weapon attack; on a hit, deal weapon damage and spell effects, while a miss discharges the spell.",
  "Read Portents":
    "Add divination as a 4th-level arcane spell; a sorcerer's spell-known limit is not reduced.",
  "Cosmic Understanding":
    "Add commune as a 5th-level arcane spell; once per day, gain an insight bonus equal to wizard or sorcerer caster level on one roll or against one attack.",
  "Legion Knowledge":
    "Make a special check (character level + Intelligence modifier) for information; failure by 5 or more gives false information.",
  "Favored Enemy (1st)":
    "Choose a listed foe opposed to the Legion of Steel; gain +2 on specified social/sensory/survival checks and damage, and reduce saves against your special abilities by 1.",
  "Favored Enemy (2nd)":
    "Choose a second listed foe; increase the bonus against one selected favored enemy by +2.",
  Reputation:
    "Gain +4 circumstance on Bluff and Diplomacy with working-class or poor people.",
  Apprentice:
    "May gain an apprentice cohort using Leadership rules, but this feature does not grant followers.",
  "Enhanced Specialization":
    "Cast spells from your order's specialist school at +1 caster level and gain +1 on saves against its spells; choose one additional prohibited school under the order rules.",
  "Item of Power":
    "The order grants a permanent magic item worth 2,000-4,000 gp; its powers are discovered by the wizard.",
  "Moon Magic":
    "Moon phase and conjunction modify caster level and spell save DC. Apply the recorded order and moon state.",
  "Tower Resources":
    "Gain access to Tower of High Sorcery libraries and laboratories where available; some campaign-era benefits may be limited.",
  "Arcane Research +1":
    "Gain +1 competence on Spellcraft and Knowledge (arcana), and one additional eligible specialist-school spell in your spellbook.",
  "Arcane Research +2":
    "Gain +2 competence on Spellcraft and Knowledge (arcana), and one additional eligible specialist-school spell in your spellbook.",
  "Arcane Research +3":
    "Gain +3 competence on Spellcraft and Knowledge (arcana), and one additional eligible specialist-school spell in your spellbook.",
  "Arcane Research +4":
    "Gain +4 competence on Spellcraft and Knowledge (arcana), and one additional eligible specialist-school spell in your spellbook.",
  "Arcane Research +5":
    "Gain +5 competence on Spellcraft and Knowledge (arcana), and one additional eligible specialist-school spell in your spellbook.",
  "1st Order Secret":
    "Choose one available secret for your robe order; record its selection manually.",
  "2nd Order Secret":
    "Choose an order secret not previously selected; record its selection manually.",
  "3rd Order Secret":
    "Choose an order secret not previously selected; record its selection manually.",
  "4th Order Secret":
    "Choose an order secret not previously selected; record its selection manually.",
  "5th Order Secret":
    "Choose an order secret not previously selected; record its selection manually.",
  "Dragon Cohort":
    "Gain a previously ridden dragon cohort subject to Leadership, alignment, size, age, carrying-load, training, lair, and treasure requirements.",
  "Mounted Attack":
    "You may attack in the same round as your dragon cohort without a Ride check.",
  "Dragon Feat":
    "At levels 2, 5, and 9, grant your dragon cohort an eligible bonus feat after one week of training.",
  "Empathic Communication":
    "Communicate information and instructions nonverbally with your dragon cohort while you can see one another.",
  "Inspire Fear":
    "Add dragon-rider levels to cohort Hit Dice for frightful-presence DC and calculate its range as one age category larger.",
  "Directed Attacks":
    "As a full-round action, direct the dragon cohort to gain +4 on attack rolls.",
  "Defensive Tactics":
    "Neither rider nor cohort can be flanked while the rider is mounted.",
  "Defensive Teamwork":
    "At 10th level, rider and cohort gain +2 AC and +1 on Reflex saves.",
  "Extreme Focus":
    "Once per inquisitor level per day, add Concentration ranks to one Intelligence- or Wisdom-based skill check.",
  "Trap Sense +1":
    "Gain +1 on Reflex saves and AC against traps; this stacks with rogue trap sense.",
  "Trap Sense +2":
    "Gain +2 on Reflex saves and AC against traps; this stacks with rogue trap sense.",
  "Trap Sense +3":
    "Gain +3 on Reflex saves and AC against traps; this stacks with rogue trap sense.",
  "Erudite Synergy":
    "Choose a Knowledge skill with at least 5 ranks for an additional +2 on related checks; later selections may improve another skill or the same one.",
  "Uncanny Dodge":
    "Retain Dexterity bonus to AC when flat-footed or attacked by an invisible attacker, unless immobilized.",
  "Improved Uncanny Dodge":
    "Cannot be flanked except by a rogue at least four levels higher than your inquisitor level.",
  "Intuitive Logic":
    "Once per day, after an uninterrupted hour of concentration, gain an answer as a divination spell with an 80% base success chance.",
  "Direct Troops":
    "As a full-round action, grant allies within 30 feet +2 competence on attacks or skill checks for rounds equal to your Charisma bonus.",
  "Rally Troops":
    "Allies within 30 feet may immediately retry saves against fear or charm; failed fear saves are reduced in severity.",
  "Hard March":
    "Companions gain +4 morale on Constitution checks for forced marches and other extended exertion; animals are unaffected.",
  "Rout Enemies":
    "Allies within 30 feet gain +1 morale on attacks and damage for attacks of opportunity against fleeing enemies.",
  "Battle Standard":
    "While your standard is within 30 feet, allies within 30 feet per class level gain Inspire Courage and Rally Troops; losing it imposes a morale penalty.",
  "Strategic Retreat":
    "While retreating, allies within 30 feet gain a morale bonus to AC against attacks of opportunity equal to your Charisma bonus.",
  "The Forlorn Hope":
    "Allies within 30 feet fight while disabled or dying through -10 HP; stopping requires a Fortitude save or they die.",
  "Oration: Enthralling Discourse":
    "With 8 Diplomacy ranks, enthrall a crowd within 90 feet using a Diplomacy check; hearing, language, and concentration requirements apply.",
  "Oration: Compelling Argument":
    "With 9 Diplomacy ranks, use a suggestion-like effect on one creature already enthralled or confused.",
  "Oration: Condemning Tirade":
    "With 13 Diplomacy ranks, force a Will save or leave one creature shaken for 10 minutes per zealot level.",
  "Oration: Verbal Obfuscation":
    "With 16 Diplomacy ranks, force a Will save or confuse one creature for 1 minute per zealot level.",
  "Oration: Inflammatory Oratory":
    "With 18 Diplomacy ranks, inspire crushing despair, good hope, or rage in an enthralled crowd while maintaining the discourse.",
  "Righteous Indignation (1/day)":
    "Once per day, add Charisma modifier to one saving throw.",
  "Righteous Indignation (2/day)":
    "Add Charisma modifier to one saving throw twice per day.",
  "Righteous Indignation (3/day)":
    "Add Charisma modifier to one saving throw three times per day.",
  "Resist Enchantment +1":
    "Gain +1 on saves against enchantment spells and effects.",
  "Resist Enchantment +2":
    "Gain +2 on saves against enchantment spells and effects.",
  "Resist Enchantment +3":
    "Gain +3 on saves against enchantment spells and effects.",
  "Resist Enchantment +4":
    "Gain +4 on saves against enchantment spells and effects.",
  "Resist Enchantment +5":
    "Gain +5 on saves against enchantment spells and effects.",
  "Gather Followers":
    "Gain Leadership, attracting followers according to its rules.",
  "Gather Followers +1":
    "Gain +1 to Leadership score.",
  "Gather Followers +2":
    "Gain +2 to Leadership score.",
  "Gather Followers +3":
    "Gain +3 to Leadership score.",
  "Martyr’s Luck":
    "At 10th level, reroll a failed attack, save, skill, ability, or level check 1 + Charisma modifier times per day.",
  "Honor-bound":
    "Select the Breaking an oath context on a save to apply its +2 circumstance bonus when failure would violate a promise, oath, or sworn duty.",
};

export const pointBuyCosts: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 8,
  16: 10,
  17: 13,
  18: 16,
};

export const alignmentDescriptions: Record<string, string> = {
  "Lawful Good": "Upholds order and acts for the welfare of others.",
  "Neutral Good": "Helps others while balancing order and freedom.",
  "Chaotic Good": "Protects others through compassion and personal freedom.",
  "Lawful Neutral":
    "Values order, duty, and consistent principles above moral extremes.",
  "True Neutral":
    "Seeks balance or avoids strong commitments to law, chaos, good, or evil.",
  "Chaotic Neutral":
    "Follows personal freedom and instinct rather than imposed order.",
  "Lawful Evil":
    "Uses order, ambition, and rules to pursue selfish or harmful ends.",
  "Neutral Evil": "Pursues personal gain without loyalty to law or chaos.",
  "Chaotic Evil":
    "Acts through cruelty, destruction, and disregard for order or others.",
};
