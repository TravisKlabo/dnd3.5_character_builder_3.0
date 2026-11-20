export const blighterSpellLevels: Record<string, number> = {
  "Detect Magic": 0, "Detect Poison": 0, "Flare": 0, "Ghost Sound": 0,
  "Inflict Minor Wounds": 0, "Read Magic": 0, "Touch of Fatigue": 0,
  "Bane": 1, "Burning Hands": 1, "Curse Water": 1, "Decomposition": 1,
  "Detect Undead": 1, "Doom": 1, "Endure Elements": 1,
  "Inflict Light Wounds": 1, "Invisibility to Animals": 1,
  "Ray of Enfeeblement": 1,
  "Chill Metal": 2, "Chill Touch": 2, "Darkness": 2, "Death Knell": 2,
  "Fire Trap": 2, "Flaming Sphere": 2, "Heat Metal": 2,
  "Inflict Moderate Wounds": 2, "Produce Flame": 2, "Resist Energy": 2,
  "Warp Wood": 2,
  "Contagion": 3, "Deeper Darkness": 3, "Desecrate": 3, "Diminish Plants": 3,
  "Dispel Magic": 3, "Inflict Serious Wounds": 3, "Poison": 3,
  "Protection from Energy": 3, "Stinking Cloud": 3, "Vampiric Touch": 3,
  "Animate Dead": 4, "Antiplant Shell": 4, "Blight": 4, "Death Ward": 4,
  "Flame Strike": 4, "Inflict Critical Wounds": 4, "Languor": 4,
  "Repel Vermin": 4, "Rusting Grasp": 4, "Transmute Mud to Rock": 4,
  "Transmute Rock to Mud": 4, "Unhallow": 4, "Wall of Fire": 4,
  "Antilife Shell": 5, "Contagious Touch": 5, "Create Undead": 5,
  "Harm": 5, "Forbiddance": 5, "Repel Wood": 5, "Waves of Fatigue": 5,
  "Acid Fog": 6, "Antipathy": 6, "Circle of Death": 6, "Finger of Death": 6,
  "Fire Seeds": 6, "Dispel Magic, Greater": 6,
  "Control Undead": 7, "Control Weather": 7, "Earthquake": 7, "Fire Storm": 7,
  "Miasma": 7, "Repel Metal or Stone": 7, "Repulsion": 7,
  "Horrid Wilting": 8, "Mind Blank": 8, "Shambler": 8, "Waves of Exhaustion": 8,
  "Foresight": 9, "Implosion": 9, "Incendiary Cloud": 9,
  "Storm of Vengeance": 9,
};

export const consecratedHarrierAddedSpellLevels: Record<string, number> = {
  "Animate Rope": 1, "Calm Emotions": 1, "Command": 1, "Disguise Self": 1,
  "Doom": 1, "Charm Person": 2, "Daylight": 2, "Detect Thoughts": 2,
  "Hold Person": 2, "Clairaudience/Clairvoyance": 3, "Death Ward": 3,
  "Discern Lies": 3, "See Invisibility": 3, "Dismissal": 4,
  "Dominate Person": 4, "Legend Lore": 4, "Mark of Justice": 4,
};

export const holyLiberatorAddedSpellLevels: Record<string, number> = {
  "Protection from Law": 1, "Heroism": 2, "Magic Circle against Law": 3,
  "Dispel Law": 4, "Freedom of Movement": 4,
};

export const templeRaiderSpellLevels: Record<string, number> = {
  "Detect Law": 1, "Detect Secret Doors": 1, "Disguise Self": 1,
  "Hide from Undead": 1, "Obscuring Mist": 1, "Protection from Law": 1,
  "Augury": 2, "Cat's Grace": 2, "Darkvision": 2, "Delay Poison": 2,
  "Invisibility": 2, "Restoration, Lesser": 2, "Undetectable Alignment": 2,
  "Locate Object": 3, "Magic Circle against Law": 3, "Nondetection": 3,
  "Obscure Object": 3, "Remove Curse": 3, "Resist Energy": 3,
  "See Invisibility": 3, "Air Walk": 4, "Confusion": 4, "Death Ward": 4,
  "Freedom of Movement": 4, "Neutralize Poison": 4, "Restoration": 4,
  "Spell Immunity": 4,
};

export const clericLuckDomainSpellNames = [
  "Entropic Shield", "Aid", "Protection from Energy", "Freedom of Movement",
];

type ShugenjaElement = "Air" | "Earth" | "Fire" | "Water" | "Void";
export type ShugenjaOrder =
  "All-Seeing Eye" |
  "Consuming Flame" |
  "Forbidding Wasteland" |
  "Gentle Rain" |
  "Impenetrable Crucible" |
  "Ineffable Mystery";
const elementSpellNames: Record<
  Exclude<ShugenjaElement, "Void">,
  Record<number, string[]>
> = {
  Air: {
    0: ["Daze", "Ghost Sound", "Guidance", "Know Direction", "Light"],
    1: ["Detect Snares and Pits", "Disguise Self", "Expeditious Retreat", "Feather Fall", "Silent Image", "Sleep"],
    2: ["Color Spray", "Detect Thoughts", "Levitate", "Minor Image", "Silence"],
    3: ["Clairaudience/Clairvoyance", "Gust of Wind", "Haste", "Invisibility", "Major Image", "Wind Wall"],
    4: ["Air Walk", "Detect Scrying", "Discern Lies", "Hallucinatory Terrain", "Illusory Wall"],
    5: ["Control Winds", "Dimension Door", "Invisibility, Greater", "Mirage Arcana", "Persistent Image"],
    6: ["Cloudkill", "Permanent Image", "Teleport", "Veil", "Wind Walk"],
    7: ["Invisibility, Mass", "Mislead", "Programmed Image", "Teleport Object"],
    8: ["Screen", "Teleport, Greater", "Whirlwind"],
    9: ["Etherealness", "Teleportation Circle"],
  },
  Earth: {
    0: ["Mage Hand", "Mending", "Resistance", "Virtue"],
    1: ["Magic Stone", "Magic Weapon", "Pass without Trace", "Sanctuary", "Shield of Faith"],
    2: ["Barkskin", "Bear's Endurance", "Bull's Strength", "Glitterdust", "Hold Person", "Make Whole"],
    3: ["Magic Weapon, Greater", "Meld into Stone", "Plant Growth", "Prayer", "Stone Shape"],
    4: ["Death Ward", "Dimensional Anchor", "Dismissal", "Spell Immunity", "Spike Stones"],
    5: ["Passwall", "Spell Resistance", "Wall of Iron", "Wall of Stone"],
    6: ["Antimagic Field", "Banishment", "Move Earth", "Stone Tell", "Stoneskin"],
    7: ["Disintegrate", "Flesh to Stone", "Spell Turning", "Statue"],
    8: ["Binding", "Earthquake", "Protection from Spells"],
    9: ["Antipathy", "Imprisonment"],
  },
  Fire: {
    0: ["Dancing Lights", "Disrupt Undead", "Flare"],
    1: ["Burning Hands", "Cause Fear", "Faerie Fire", "Hypnotism", "Shocking Grasp"],
    2: ["Cat's Grace", "Flame Blade", "Flaming Sphere", "Heat Metal", "Produce Flame"],
    3: ["Call Lightning", "Daylight", "Fire Wings", "Keen Edge", "Searing Light"],
    4: ["Fire Shield", "Flame Arrow", "Lightning Bolt", "Quench", "Wall of Fire"],
    5: ["Confusion", "Dragon Breath", "Energy Vortex", "Feeblemind", "Flame Strike"],
    6: ["Anger of the Noonday Sun", "Fire Seeds", "Fires of Purity", "Glyph of Warding, Greater"],
    7: ["Chain Lightning", "Fire Storm", "Sunbeam"],
    8: ["Incendiary Cloud", "Power Word Blind", "Sunburst"],
    9: ["Implosion", "Meteor Swarm"],
  },
  Water: {
    0: ["Create Water", "Cure Minor Wounds", "Detect Poison", "Purify Food and Drink"],
    1: ["Bless", "Cure Light Wounds", "Obscuring Mist", "Remove Fear", "Speak with Animals"],
    2: ["Cure Moderate Wounds", "Delay Poison", "Fog Cloud", "Locate Object", "Remove Paralysis", "Restoration, Lesser"],
    3: ["Cure Serious Wounds", "Remove Blindness/Deafness", "Remove Curse", "Remove Disease", "Water Breathing", "Water Walk"],
    4: ["Control Water", "Cure Critical Wounds", "Locate Creature", "Neutralize Poison", "Restoration"],
    5: ["Atonement", "Cure Light Wounds, Mass", "Righteous Might", "Scrying", "Wall of Ice"],
    6: ["Contingency", "Control Weather", "Heal", "Master of the Rolling River", "True Seeing"],
    7: ["Creeping Cold, Greater", "Restoration, Greater", "Resurrection", "Scrying, Greater"],
    8: ["Discern Location", "Heal, Mass", "Regenerate"],
    9: ["Storm of Vengeance", "True Resurrection"],
  },
};

const allElementSpellNames: Record<number, string[]> = {
  0: ["Detect Magic", "Read Magic"],
  1: ["Endure Elements"],
  2: ["Resist Energy"],
  3: ["Dispel Magic", "Glyph of Warding", "Protection from Energy", "Summon Nature's Ally III"],
  4: [],
  5: ["Commune with Nature", "Summon Nature's Ally V"],
  6: ["Dispel Magic, Greater", "Summon Nature's Ally VI"],
  7: ["Summon Nature's Ally VII"],
  8: ["Summon Nature's Ally VIII"],
  9: ["Elemental Swarm", "Summon Nature's Ally IX"],
};

const orderSpellNames: Record<ShugenjaOrder, string[]> = {
  "All-Seeing Eye": [
    "Guidance", "Detect Snares and Pits", "Detect Thoughts",
    "Clairaudience/Clairvoyance", "Divination", "Commune with Nature",
    "Find the Path", "Legend Lore", "Vision", "Foresight",
  ],
  "Consuming Flame": [
    "Flare", "Burning Hands", "Produce Flame", "Searing Light", "Fireball",
    "Flame Strike", "Fires of Purity", "Fire Storm",
    "Delayed Blast Fireball", "Meteor Swarm",
  ],
  "Forbidding Wasteland": [
    "Detect Magic", "Remove Fear", "Scent", "Restoration, Lesser",
    "Phantom Stag", "Dance of the Unicorn", "Control Weather",
    "Scrying, Greater", "Horrid Wilting", "Shambler",
  ],
  "Gentle Rain": [
    "Cure Minor Wounds", "Cure Light Wounds", "Augury",
    "Cure Serious Wounds", "Cure Critical Wounds", "Commune", "Heal",
    "Resurrection", "Heal, Mass", "Soul Bind",
  ],
  "Impenetrable Crucible": [
    "Resistance", "Magic Weapon", "Sound Burst", "Magic Weapon, Greater",
    "Dismissal", "Death Ward", "Banishment", "Repulsion", "Binding",
    "Imprisonment",
  ],
  "Ineffable Mystery": [
    "Resistance", "Entropic Shield", "Obscure Object", "Dispel Magic",
    "Spell Immunity", "Spell Resistance", "Antimagic Field", "Spell Turning",
    "Protection from Spells", "Mordenkainen's Disjunction",
  ],
};

const fixedElements: Partial<Record<ShugenjaOrder, ShugenjaElement>> = {
  "All-Seeing Eye": "Air",
  "Consuming Flame": "Fire",
  "Forbidding Wasteland": "Water",
  "Gentle Rain": "Water",
  "Impenetrable Crucible": "Earth",
};

export function getShugenjaAllowedElements(order?: ShugenjaOrder) {
  const fixed = order ? fixedElements[order] : undefined;
  return fixed ? [fixed] as const : ["Air", "Earth", "Fire", "Water", "Void"] as const;
}

export function getShugenjaOrderSpell(order: ShugenjaOrder | undefined, level: number) {
  return order ? orderSpellNames[order]?.[level] : undefined;
}

export function getShugenjaSpellLevels(
  element: ShugenjaElement | undefined,
  order?: ShugenjaOrder,
) {
  const prohibited = element === "Air" ? "Earth"
    : element === "Earth" ? "Air"
    : element === "Fire" ? "Water"
    : element === "Water" ? "Fire"
    : undefined;
  const levels: Record<string, number> = {};
  for (const [elementName, spellsByLevel] of Object.entries(elementSpellNames)) {
    if (elementName === prohibited) continue;
    for (const [level, names] of Object.entries(spellsByLevel)) {
      for (const name of names) levels[name] = Number(level);
    }
  }
  for (const [level, names] of Object.entries(allElementSpellNames)) {
    for (const name of names) levels[name] = Number(level);
  }
  if (order) {
    orderSpellNames[order].forEach((name, level) => { levels[name] = level; });
  }
  return levels;
}
