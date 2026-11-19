import { type ClassId, type AbilityName } from "../domain";

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
  "Control Shape",
  "Craft",
  "Craft (poisonmaking)",
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
  "krynn-gnome": ["Dwarven", "Ergot", "Ogre", "Solamnic"],
  "mad-gnome": ["Dwarven", "Ergot", "Ogre", "Solamnic"],
  centaur: ["Abanasinian", "Elven", "Goblin", "Ogre"],
  ogre: ["Goblin", "Kothian", "High Ogre"],
  "half-ogre": ["Goblin", "Kothian", "High Ogre"],
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
  "krynn-half-elf": ["Common", "Elven"],
  "krynn-gnome": ["Common", "Gnome"],
  "mad-gnome": ["Common", "Gnome"],
  centaur: ["Common", "Sylvan"],
  ogre: ["Common", "Ogre"],
  "half-ogre": ["Common", "Ogre"],
  "gully-dwarf": ["Gullytalk", "Common"],
};

export const skillDescriptions: Record<string, string> = {
  Appraise: "Estimate the value of common or rare objects.",
  Balance: "Keep your footing on narrow or unstable surfaces.",
  Bluff: "Convince others that something untrue is believable.",
  Climb: "Climb surfaces, ropes, and other handholds.",
  Concentration: "Maintain focus while distracted, injured, or casting.",
  "Control Shape": "For afflicted lycanthropes, resist involuntary changes and assume or leave animal or hybrid form; natural lycanthropes do not use this skill.",
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
  beguiler: [
    "Appraise", "Balance", "Bluff", "Climb", "Concentration", "Decipher Script",
    "Diplomacy", "Disable Device", "Disguise", "Escape Artist", "Forgery",
    "Gather Information", "Hide", "Jump", "Knowledge (arcana)", "Knowledge (local)",
    "Listen", "Move Silently", "Open Lock", "Profession", "Search", "Sense Motive",
    "Sleight of Hand", "Speak Language", "Spellcraft", "Spot", "Swim", "Tumble",
    "Use Magic Device",
  ],
  "dragon-shaman": [
    "Climb", "Craft", "Intimidate", "Knowledge (nature)", "Search",
  ],
  duskblade: [
    "Climb", "Concentration", "Craft", "Decipher Script", "Jump", "Knowledge (*)",
    "Ride", "Sense Motive", "Spellcraft", "Swim",
  ],
  knight: [
    "Climb", "Handle Animal", "Intimidate", "Jump", "Knowledge (nobility and royalty)",
    "Ride", "Swim",
  ],
};

export { featCatalog } from "./featCatalogRegistry";

export const abilityNames: AbilityName[] = ["str", "dex", "con", "int", "wis", "cha"];

export const abilityLabels: Record<AbilityName, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export interface AlternativeClassFeature {
  name: string;
  className: string;
  level: number;
  replaces: string;
  description: string;
}

export const alternativeClassFeatures: AlternativeClassFeature[] = [
  { name: "Berserker Strength", className: "Barbarian", level: 1, replaces: "Rage", description: "When below 5 × Barbarian level hp, gain +4 Strength, +2 saves, DR 2/—, and -2 AC; improves at levels 11 and 20." },
  { name: "Bardic Knack", className: "Bard", level: 1, replaces: "Bardic Knowledge", description: "Use half Bard level instead of ranks for untrained skill checks; trained-only skills still require a rank and you cannot take 10." },
  { name: "Spontaneous Domain Casting", className: "Cleric", level: 1, replaces: "Spontaneous Cure/Inflict Casting", description: "Spontaneously cast a selected domain spell by sacrificing a prepared spell of the same level." },
  { name: "Spontaneous Rejuvenation", className: "Druid", level: 1, replaces: "Spontaneous Summon Nature's Ally", description: "Sacrifice a prepared spell to grant yourself and allies within 30 feet fast healing equal to its level for 3 rounds." },
  { name: "Shapeshift", className: "Druid", level: 5, replaces: "Wild Shape", description: "Use level-based supernatural combat forms at will as a swift action while retaining HD, hp, BAB, saves, and skills; resolve form limits manually." },
  { name: "Deity's Favor", className: "Favored Soul", level: 3, replaces: "Deity-specific weapon specialization", description: "When casting a divine spell, an affected creature gains temporary hp equal to 3 × the spell level for 1 minute per spell level." },
  { name: "Elusive Attack", className: "Fighter", level: 6, replaces: "Fighter Bonus Feat", description: "Full-round single attack grants scaling +2 dodge AC until your next turn, improving every five Fighter levels." },
  { name: "Counterattack", className: "Fighter", level: 12, replaces: "Fighter Bonus Feat", description: "Full-round single melee attack allows one immediate melee counterattack before your next turn." },
  { name: "Overpowering Attack", className: "Fighter", level: 16, replaces: "Fighter Bonus Feat", description: "A full-round attack deals double damage, as do your other attacks before your next turn." },
  { name: "Dark Companion", className: "Hexblade", level: 4, replaces: "Familiar", description: "A 5-foot illusory companion causes adjacent enemies to take -2 to AC and saves; requires 24 hours and 100 gp to create." },
  { name: "Adrenaline Boost", className: "Marshal", level: 4, replaces: "Grant Move Action", description: "Once per day as a standard action, grant nearby allies temporary hp equal to class level, doubled for badly injured allies." },
  { name: "Decisive Strike", className: "Monk", level: 1, replaces: "Flurry of Blows", description: "Full-round single attack at -2 deals double damage; penalty lessens and additional attacks become available at higher Monk levels." },
  { name: "Charging Smite", className: "Paladin", level: 5, replaces: "Special Mount", description: "When smiting evil on a charge, add 2 damage per Paladin level; a miss does not expend the smite." },
  { name: "Distracting Attack", className: "Ranger", level: 4, replaces: "Animal Companion", description: "A weapon hit makes the target count as flanked by allies until an ally attacks it or your next turn begins." },
  { name: "Disruptive Attack", className: "Rogue", level: 4, replaces: "Sneak Attack +2d6", description: "Sacrifice sneak-attack dice on a flat-footed or flanked target to impose -5 AC for 1 round, even against sneak-attack-immune creatures." },
  { name: "Dungeon Specialist", className: "Scout", level: 3, replaces: "Movement and Evasion Features", description: "Gain a climb speed and wall-adjacent AC/flank defense, trading away fast movement/evasion features." },
  { name: "Metamagic Specialist", className: "Sorcerer", level: 1, replaces: "Summon Familiar", description: "Apply metamagic without increasing casting time 3 + Intelligence modifier times per day." },
  { name: "Shield of Blades", className: "Swashbuckler", level: 5, replaces: "Dodge progression", description: "Gain +2 shield AC while attacking with at least two light weapons, increasing every five levels; lost in medium/heavy load or armor." },
  { name: "Fiendish Flamewreath", className: "Warlock", level: 8, replaces: "Fiendish Resilience", description: "Once per day surround yourself with flame for up to 2 minutes; creatures striking with body or handheld weapons take scaling fire damage." },
  { name: "Eclectic Learning", className: "Warmage", level: 3, replaces: "Advanced Learning", description: "Add a Sorcerer/Wizard spell of any school to the class list at one level higher than normal." },
  { name: "Immediate Magic", className: "Wizard", level: 1, replaces: "Summon Familiar", description: "Specialist-only school spell-like ability used as an immediate action, a number of times per day equal to Intelligence modifier." },
];

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
  beguiler: ["Armored Mage", "Trapfinding"],
  "dragon-shaman": ["Draconic Aura", "Totem Dragon"],
  duskblade: ["Arcane Attunement", "Armored Mage (Light)"],
  knight: ["Knight's Challenge", "Knight's Code", "Fighting Challenge +1"],
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
    "Paladins and Knights of the Crown are immune to fear while conscious; their allies within 10 feet gain +4 morale on saves against fear. Knights of the Sword and their allies within 10 feet instead gain +4 morale on saves against fear, without immunity.",
  "Crown of Knighthood":
    "At 10th level, add your Charisma modifier as a morale bonus on all saves. Saves against compulsion also gain an additional +4 bonus, replacing the separate Honorable Will ability. Once per day, gain heroic valor's +4 morale bonuses on attacks, weapon damage, and saves, plus 15 temporary hit points for 10 minutes.",
  "Smite Evil (1/day)":
    "Once per day, add positive Charisma to one melee attack and deal extra damage equal to Knight of the Sword level; a failed alignment match still expends the use.",
  "Smite Evil (2/day)":
    "The Knight of the Sword can smite evil twice per day.",
  "Smite Evil (3/day)":
    "The Knight of the Sword can smite evil three times per day.",
  "Aura of Good":
    "The aura's strength equals Knight of the Sword or Rose levels plus cleric/mystic levels, and for a Rose Knight also Knight of the Sword levels.",
  "Turn Undead":
    "Paladins turn undead as clerics three levels lower. Knights of the Sword turn as clerics one level lower; if also a cleric, add Knight of the Sword levels - 1 to cleric levels and gain no additional daily attempts. For a Knight of the Rose, effective cleric level equals cleric levels + Knight of the Sword levels + Knight of the Rose level - 3. Attempts per day equal 3 + Charisma modifier; 5 ranks in Knowledge (religion) add +2 on turning checks. Track uses and resolve effects manually.",
  "Soul of Knighthood":
    "At 10th level, your weapons count as holy for overcoming certain evil outsiders' damage reduction. Once per day, you gain a self-only holy aura for 10 rounds.",
  "Rallying Cry":
    "As a free action, up to three times per day, allies within 60 feet who can hear you gain +1 morale on their next attack and +5 feet speed on their next action.",
  "Detect Evil":
    "Detect evil at will as the spell.",
  "Inspire Courage +2 (2/day)":
    "Twice per day, allies (including you) who hear you speak gain a +2 morale bonus on attacks, weapon damage, and saves against fear and charm while they hear you and for 5 rounds afterward. You can fight while speaking, but cannot cast spells or activate spell-completion or command-word items. This is a mind-affecting ability; the Rose Knight and Legendary Tactician improve its bonus and daily uses at later levels.",
  "Inspire Courage +3 (3/day)":
    "As Inspire Courage +2, with a +3 bonus and three uses per day.",
  "Inspire Courage +4 (4/day)":
    "As Inspire Courage +2, with a +4 bonus and four uses per day.",
  "Leadership Bonus +1":
    "Increase your Leadership score by the listed bonus; it stacks with other Leadership modifiers. Rose Knights gain +1 at level 3 and +2 at level 7; Legendary Tacticians gain +1/+2/+3/+4/+5 at levels 1/3/5/7/9.",
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
    "At Knight of the Rose level 4, inspire yourself or one willing target within 30 feet; each three Rose levels beyond 4th adds one target. Each target gains two d10 bonus Hit Dice with their Constitution modifier applied, +2 competence on attacks, and +1 competence on Fortitude saves while hearing you speak and for 5 rounds after. Each use expends an Inspire Courage use.",
  "Wisdom of the Measure":
    "Twice per day, a successful DC 14 Knowledge (nobility and royalty) check provides augury-equivalent guidance from a cleric of your level, expressed as a historical anecdote, proverb, or law of the Measure.",
  "Final Stand":
    "Once per day, nearby allies gain 2d10 temporary hit points for rounds equal to the number of affected creatures.",
  "Knighthood’s Flower":
    "Immune to compulsion effects (except harmless ones). Once per day, gain self-only foresight for 100 minutes; you cannot be surprised or caught flat-footed and gain +2 insight bonuses to AC and Reflex saves.",
  "Sneak Attack +1d6":
    "Deal +1d6 sneak-attack damage when the target is denied Dexterity to AC or is flanked. Extra damage is not multiplied on a critical hit; ranged sneak attacks require the target to be within 30 feet. This stacks with sneak attack from other sources and retains the normal target and visibility restrictions.",
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
    "At Knight of the Lily level 10, you are not surprised or flat-footed if any other Knight of the Lily within 100 feet (of any level) is not. You are not considered flanked unless every other Knight of the Lily within 100 feet is also flanked; these benefits apply only to the 10th-level Knight.",
  "Detect Good":
    "Detect good at will as the spell.",
  "Smite Good (1/day)":
    "Once per day, make one normal melee attack against a good creature, adding positive Charisma to the attack roll and dealing extra damage equal to Knight of the Skull level. Smite attempts against non-good creatures are wasted.",
  "Smite Good (2/day)":
    "The Knight of the Skull can smite good twice per day.",
  "Smite Good (3/day)":
    "The Knight of the Skull can smite good three times per day.",
  "Aura of Evil":
    "For effects such as detect evil, the aura's strength equals Knight of the Skull levels plus cleric levels.",
  "Dark Blessing":
    "Add positive Charisma modifier to all saving throws.",
  "Discern Lies":
    "Use discern lies as a spell-like ability a number of times per day equal to Wisdom modifier.",
  "Rebuke Undead":
    "Rebuke undead as an evil cleric with an effective cleric level equal to Knight of the Skull level -2; add that amount to cleric levels if applicable.",
  "Favor of the Dark Queen":
    "At 10th level (called Favor of Darkness in the class text), a melee weapon the Knight wields counts as unholy to bypass damage reduction of certain good outsiders and deals +1d6 unholy damage to good creatures it hits. Both effects end when the Knight stops touching the weapon.",
  Diviner:
    "Cast all divination spells at +1 caster level. Wizards and sorcerers also gain one extra divination spell per spell level per day (or spell known at each level) and +2 on Spellcraft checks to learn divination spells, without losing access to other schools; existing wizard specialization is retained.",
  "Read Omens":
    "Automatically add augury as a 2nd-level arcane spell to the spellbook or spells known; for sorcerers, it does not count against the spells-known limit.",
  "Armored Spellcasting (5%)":
    "Reduce arcane spell failure from armor by 5 percentage points.",
  "Armored Spellcasting (10%)":
    "Reduce arcane spell failure from armor by 10 percentage points.",
  "Armored Spellcasting (20%)":
    "Reduce arcane spell failure from armor by 20 percentage points.",
  "Aura of Terror":
    "Creatures within 10 feet must succeed at a Will save (DC 10 + Knight of the Thorn level + Charisma modifier) or become shaken; a successful save grants immunity for one day.",
  "Weapon Touch":
    "Deliver a touch spell with a normal melee attack, not a melee touch attack. A hit deals weapon damage and the spell's effect; a miss discharges the spell unless it allows multiple touches. Casting and attacking in the same round is a full-round action and allows only a 5-foot step between them.",
  "Read Portents":
    "Automatically add divination as a 4th-level arcane spell to the spellbook or spells known; for sorcerers, it does not count against the spells-known limit.",
  "Cosmic Understanding":
    "Automatically add commune as a 5th-level arcane spell to the spellbook or spells known; for sorcerers, it does not count against the spells-known limit. Once per day, gain an insight bonus equal to wizard or sorcerer caster level on one attack roll, opposed ability or skill check, saving throw, or AC against one attack, even if flat-footed.",
  "Legion Knowledge":
    "Make a Legion Knowledge check with a bonus equal to character level + Intelligence modifier for relevant local, historical, distant, or recent-event information. You cannot take 10 or 20; the DM sets the DC using the class table. Failing by 5 or more produces false second- or third-hand information.",
  "Favored Enemy (1st)":
    "Choose one foe opposing the Legion of Steel: chromatic dragons, draconians, dragonspawn, goblins, Knights of Solamnia, Knights of Neraka, or minotaurs. Gain +2 on Bluff, Listen, Sense Motive, Spot, Survival, and weapon damage against it; it takes -1 on saves against spells, spell-like, supernatural, or extraordinary abilities you use. If a Ranger favored-enemy category includes this specific foe, the bonuses stack.",
  "Favored Enemy (2nd)":
    "At 3rd level, select a second listed foe and increase the bonus against one selected favored enemy by +2; you may increase the bonus against the new foe.",
  Reputation:
    "At 2nd level, gain a +4 circumstance bonus on Bluff and Diplomacy checks when dealing with working-class or poor individuals.",
  Apprentice:
    "At 3rd level, you may take an apprentice cohort using Leadership rules; this feature does not grant followers.",
  "Enhanced Specialization":
    "At level 1, cast spells from your specialist school at +1 caster level and gain +1 on saves against its spells and spell-like abilities that duplicate them (not supernatural abilities). Choose one additional prohibited school from those favored by the other two orders; you can never learn its spells.",
  "Item of Power":
    "After passing the Test of High Sorcery, your order gives you a permanent magic item worth 2,000-4,000 gp without revealing its powers; discovering them is part of refining your focus.",
  "Moon Magic":
    "Use your order's moon. High Sanction grants +1 caster level and spell save DC; Low Sanction gives -1 to each, and quarter phases are normal. A two-moon conjunction adds +1 to both for the aligned orders and stacks with phase. All three aligned grant +2 to all orders; a triple conjunction gives +1 at Low Sanction or +3 at High Sanction.",
  "Tower Resources":
    "Gain full admission to the Tower of High Sorcery in Wayreth. After passing the Test and pledging allegiance to the deities of magic, use its libraries to halve spell-copying time and reduce spell research costs to 750 gp per week; its laboratories provide common components for item creation. These benefits are limited while the Towers are inaccessible unless mentors or conclaves provide access.",
  "Arcane Research +1":
    "Gain a +1 competence bonus on Spellcraft and Knowledge (arcana), plus one spell from your order's schools that you can cast, in addition to your normal level-up spell.",
  "Arcane Research +2":
    "Gain a +2 competence bonus on Spellcraft and Knowledge (arcana), plus one spell from your order's schools that you can cast, in addition to your normal level-up spell.",
  "Arcane Research +3":
    "Gain a +3 competence bonus on Spellcraft and Knowledge (arcana), plus one spell from your order's schools that you can cast, in addition to your normal level-up spell.",
  "Arcane Research +4":
    "Gain a +4 competence bonus on Spellcraft and Knowledge (arcana), plus one spell from your order's schools that you can cast, in addition to your normal level-up spell.",
  "Arcane Research +5":
    "Gain a +5 competence bonus on Spellcraft and Knowledge (arcana), plus one spell from your order's schools that you can cast, in addition to your normal level-up spell.",
  "1st Order Secret":
    "Choose one available secret for your robe order; record its selection manually.",
  "2nd Order Secret":
    "Choose an unselected secret from your robe order's list; record the selection manually.",
  "3rd Order Secret":
    "Choose an unselected secret from your robe order's list; record the selection manually.",
  "4th Order Secret":
    "Choose an unselected secret from your robe order's list; record the selection manually.",
  "5th Order Secret":
    "Choose an unselected secret from your robe order's list; record the selection manually.",
  "Dragon Cohort":
    "At level 1, use Leadership to attract one previously ridden dragon as your cohort. Subtract 3 from its ECL, but its adjusted ECL cannot exceed your total level and it must fit your Leadership score. It cannot oppose your alignment, must be old and large enough to carry you aloft, and needs at least seven days of training, a suitable lair, and a hoard (typically 1,000 gp per dragon Hit Die). You can have only one cohort at a time; Dragon Rider features function only while riding your preferred mount.",
  "Mounted Attack":
    "While riding your preferred dragon cohort, you can attack in the same round as it without a Ride check.",
  "Dragon Feat":
    "At levels 2, 5, and 9, grant your dragon cohort a bonus feat from Cleave, Flyby Attack, Hover, Improved Initiative, Improved Sunder, Power Attack, Quicken Spell-Like Ability, Snatch, Strafing Breath, Weapon Focus, or Wingover. It does not count against the dragon's normal feat capacity, but prerequisites apply; each feat requires one week of training.",
  "Empathic Communication":
    "Starting at level 3, nonverbally convey information and instructions to your preferred mount while you are both within sight.",
  "Inspire Fear":
    "Starting at level 6, add your Dragon Rider levels to your cohort's Hit Dice when determining its frightful-presence DC; calculate its range as if it were one age category older.",
  "Directed Attacks":
    "Starting at level 7, direct your dragon cohort as a full-round action that does not provoke an attack of opportunity; it gains a +4 circumstance bonus on its attack rolls.",
  "Defensive Tactics":
    "At level 8, neither you nor your dragon cohort can be flanked while you are in the saddle.",
  "Defensive Teamwork":
    "At level 10, while riding your preferred mount, you and the dragon each gain a +2 circumstance bonus to AC and a +1 circumstance bonus on Reflex saves.",
  "Extreme Focus":
    "Once per day per inquisitor level, add your Concentration ranks to any one Intelligence- or Wisdom-based skill check.",
  "Trap Sense +1":
    "Gain +1 on Reflex saves to avoid traps and AC against trap attacks; this stacks with rogue trap sense.",
  "Trap Sense +2":
    "Gain +2 on Reflex saves to avoid traps and AC against trap attacks; this stacks with rogue trap sense.",
  "Trap Sense +3":
    "Gain +3 on Reflex saves to avoid traps and AC against trap attacks; this stacks with rogue trap sense.",
  "Erudite Synergy":
    "At levels 2, 5, and 8, choose a Knowledge skill with at least 5 ranks for +2 on related checks; this stacks with the normal 5-rank synergy bonus. Later selections may add +2 to another eligible skill or the same one.",
  "Uncanny Dodge":
    "At level 3, retain your Dexterity bonus to AC when flat-footed or attacked by an invisible attacker, unless immobilized. If you already have uncanny dodge, gain improved uncanny dodge instead.",
  "Improved Uncanny Dodge":
    "At level 6, you cannot be flanked except by a rogue at least four levels higher than your inquisitor level.",
  "Intuitive Logic":
    "At level 10, once per day, duplicate a divination spell's effect to gain insight about one question (80% base success chance) after concentrating uninterrupted for at least an hour. If interrupted, the attempt fails unless you succeed on a Concentration check.",
  "Direct Troops":
    "As a full-round action, grant allies within 30 feet +2 competence on attacks or skill checks for rounds equal to your Charisma bonus.",
  "Rally Troops":
    "At level 4, allies within 30 feet who succumbed to fear or charm may immediately attempt a second save. If they fail, panicked becomes frightened, frightened becomes shaken, and shaken remains unchanged.",
  "Hard March":
    "At level 5, creatures traveling with you gain a +4 morale bonus on Constitution checks for forced marches and other extended exertion; animals are unaffected.",
  "Rout Enemies":
    "Allies within 30 feet gain +1 morale on attacks and damage for attacks of opportunity against fleeing enemies.",
  "Battle Standard":
    "At level 7, while your heraldic standard is within 30 feet of you, allies within 30 feet per class level gain Inspire Courage and Rally Troops. If it falls or is captured, aware allies lose these benefits and take a -1 morale penalty on attacks and damage until it is recovered.",
  "Strategic Retreat":
    "At level 8, when you call for a strategic retreat, allies within 30 feet gain a morale bonus to AC against attacks of opportunity equal to your Charisma bonus.",
  "The Forlorn Hope":
    "Allies within 30 feet fight while disabled or dying through -10 HP; stopping requires a Fortitude save or they die.",
  "Oration: Enthralling Discourse":
    "Oration is usable once per day per zealot level; if you are deaf, you have a 20% chance to fail, and the use is still expended. With 8 Diplomacy ranks, spend one use to enthrall a crowd within 90 feet that can see, hear, and understand you. Each target can resist with a Will save against your Diplomacy check result. The crowd listens while you speak and concentrate, up to 2 rounds per zealot level; otherwise, this follows the enthrall spell.",
  "Oration: Compelling Argument":
    "With 9 Diplomacy ranks, use suggestion on one creature already enthralled or confused (Will DC 10 + zealot level + Charisma modifier). The suggestion does not expend an Oration use; the enthralling or confusion does.",
  "Oration: Condemning Tirade":
    "With 13 Diplomacy ranks, spend an Oration use to force one creature's Will save (DC 10 + zealot level + Charisma modifier); on failure, it is shaken for 10 minutes per zealot level.",
  "Oration: Verbal Obfuscation":
    "With 16 Diplomacy ranks, spend an Oration use to force a Will save (DC 12 + zealot level + Charisma modifier) or confuse one creature for 1 minute per zealot level.",
  "Oration: Inflammatory Oratory":
    "With 18 Diplomacy ranks, after enthralling a crowd, inspire crushing despair, good hope, or rage in it. Each target can resist with a Will save against your Diplomacy check result; the effect lasts while you maintain the discourse.",
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
    "At level 3, gain the Leadership feat and attract followers according to its rules.",
  "Gather Followers +1":
    "At level 5, gain +1 to your Leadership score.",
  "Gather Followers +2":
    "At level 7, gain +2 to your Leadership score.",
  "Gather Followers +3":
    "At level 9, gain +3 to your Leadership score.",
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
