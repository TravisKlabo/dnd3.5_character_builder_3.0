export const clericDomainSource = "https://www.d20srd.org/srd/spellLists/clericDomains.htm";

type DomainDefinition = {
  name: string;
  spells: readonly [string, string, string, string, string, string, string, string, string];
  manualPower?: string;
  classSkills?: readonly string[];
  spellNotes?: Partial<Record<number, string>>;
};

export const clericDomains = {
  air: {
    name: "Air",
    manualPower: "Turn/destroy earth creatures and rebuke/command/bolster air creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: ["Obscuring Mist", "Wind Wall", "Gaseous Form", "Air Walk", "Control Winds", "Chain Lightning", "Control Weather", "Whirlwind", "Elemental Swarm"],
    spellNotes: { 9: "Air spell only." },
  },
  animal: {
    name: "Animal", classSkills: ["Knowledge (nature)"],
    manualPower: "Speak with animals once per day as a spell-like ability.",
    spells: ["Calm Animals", "Hold Animal", "Dominate Animal", "Summon Nature's Ally IV", "Commune with Nature", "Antilife Shell", "Animal Shapes", "Summon Nature's Ally VIII", "Shapechange"],
    spellNotes: { 4: "Animals only.", 8: "Animals only." },
  },
  chaos: {
    name: "Chaos", manualPower: "Cast spells with the chaos descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Protection from Law", "Shatter", "Magic Circle against Law", "Chaos Hammer", "Dispel Law", "Animate Objects", "Word of Chaos", "Cloak of Chaos", "Summon Monster IX"],
    spellNotes: { 9: "Chaos spell only." },
  },
  death: {
    name: "Death", manualPower: "Death touch once per day (supernatural death effect): melee touch against a living creature, then roll 1d6 per cleric level. If the total equals or exceeds its current HP, it dies without a save.",
    spells: ["Cause Fear", "Death Knell", "Animate Dead", "Death Ward", "Slay Living", "Create Undead", "Destruction", "Create Greater Undead", "Wail of the Banshee"],
  },
  destruction: {
    name: "Destruction", manualPower: "Smite once per day: declare before a single melee attack; +4 to that attack and +cleric level damage on a hit. Resolve manually, not as a permanent attack bonus.",
    spells: ["Inflict Light Wounds", "Shatter", "Contagion", "Inflict Critical Wounds", "Inflict Light Wounds, Mass", "Harm", "Disintegrate", "Earthquake", "Implosion"],
  },
  earth: {
    name: "Earth", manualPower: "Turn/destroy air creatures and rebuke/command/bolster earth creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: ["Magic Stone", "Soften Earth and Stone", "Stone Shape", "Spike Stones", "Wall of Stone", "Stoneskin", "Earthquake", "Iron Body", "Elemental Swarm"],
    spellNotes: { 9: "Earth spell only." },
  },
  evil: {
    name: "Evil", manualPower: "Cast spells with the evil descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Protection from Good", "Desecrate", "Magic Circle against Good", "Unholy Blight", "Dispel Good", "Create Undead", "Blasphemy", "Unholy Aura", "Summon Monster IX"],
    spellNotes: { 9: "Evil spell only." },
  },
  fire: {
    name: "Fire", manualPower: "Turn/destroy water creatures and rebuke/command/bolster fire creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: ["Burning Hands", "Produce Flame", "Resist Energy", "Wall of Fire", "Fire Shield", "Fire Seeds", "Fire Storm", "Incendiary Cloud", "Elemental Swarm"],
    spellNotes: { 3: "Resist cold or fire only.", 9: "Fire spell only." },
  },
  good: {
    name: "Good", manualPower: "Cast spells with the good descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Protection from Evil", "Aid", "Magic Circle against Evil", "Holy Smite", "Dispel Evil", "Blade Barrier", "Holy Word", "Holy Aura", "Summon Monster IX"],
    spellNotes: { 9: "Good spell only." },
  },
  healing: {
    name: "Healing", manualPower: "Cast healing spells at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Cure Light Wounds", "Cure Moderate Wounds", "Cure Serious Wounds", "Cure Critical Wounds", "Cure Light Wounds, Mass", "Heal", "Regenerate", "Cure Critical Wounds, Mass", "Heal, Mass"],
  },
  knowledge: {
    name: "Knowledge", classSkills: ["Knowledge (*)"],
    manualPower: "Cast divination spells at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Detect Secret Doors", "Detect Thoughts", "Clairaudience/Clairvoyance", "Divination", "True Seeing", "Find the Path", "Legend Lore", "Discern Location", "Foresight"],
  },
  law: {
    name: "Law", manualPower: "Cast spells with the law descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: ["Protection from Chaos", "Calm Emotions", "Magic Circle against Chaos", "Order's Wrath", "Dispel Chaos", "Hold Monster", "Dictum", "Shield of Law", "Summon Monster IX"],
    spellNotes: { 9: "Law spell only." },
  },
  luck: {
    name: "Luck", manualPower: "Good fortune once per day: reroll a roll you just made before the DM announces success or failure. Keep the new result, even if worse.",
    spells: ["Entropic Shield", "Aid", "Protection from Energy", "Freedom of Movement", "Break Enchantment", "Mislead", "Spell Turning", "Moment of Prescience", "Miracle"],
  },
  magic: {
    name: "Magic", manualPower: "For spell-completion/trigger devices only, count as a wizard of half your cleric level (round down, minimum 1), stacking with actual wizard levels. This grants no wizard spell slots or spellbook. Resolve device eligibility manually.",
    spells: ["Magic Aura", "Identify", "Dispel Magic", "Imbue with Spell Ability", "Spell Resistance", "Antimagic Field", "Spell Turning", "Protection from Spells", "Mage's Disjunction"],
  },
  plant: {
    name: "Plant", classSkills: ["Knowledge (nature)"],
    manualPower: "Rebuke/command plant creatures as an evil cleric rebukes/commands undead, 3 + CHA modifier times per day. Resolve turning manually.",
    spells: ["Entangle", "Barkskin", "Plant Growth", "Command Plants", "Wall of Thorns", "Repel Wood", "Animate Plants", "Control Plants", "Shambler"],
  },
  protection: {
    name: "Protection", manualPower: "Protective ward once per day: standard action, touch grants a resistance bonus equal to cleric level on the target's next save within 1 hour. Apply manually; resistance bonuses do not stack.",
    spells: ["Sanctuary", "Shield Other", "Protection from Energy", "Spell Immunity", "Spell Resistance", "Antimagic Field", "Repulsion", "Mind Blank", "Prismatic Sphere"],
  },
  strength: {
    name: "Strength", manualPower: "Feat of strength once per day: free action, enhancement bonus to Strength equal to cleric level for 1 round. Apply manually; enhancement bonuses do not stack.",
    spells: ["Enlarge Person", "Bull's Strength", "Magic Vestment", "Spell Immunity", "Righteous Might", "Stoneskin", "Grasping Hand", "Clenched Fist", "Crushing Hand"],
  },
  sun: {
    name: "Sun", manualPower: "Once per day replace a regular undead turning with greater turning: undead that would be turned are destroyed instead. This uses a regular turning attempt; resolve manually.",
    spells: ["Endure Elements", "Heat Metal", "Searing Light", "Fire Shield", "Flame Strike", "Fire Seeds", "Sunbeam", "Sunburst", "Prismatic Sphere"],
  },
  travel: {
    name: "Travel", classSkills: ["Survival"],
    manualPower: "Against magical movement impediments, freedom of movement applies automatically as needed, up to cleric level rounds per day (not necessarily consecutive). Track the rounds and resolve the effect manually.",
    spells: ["Longstrider", "Locate Object", "Fly", "Dimension Door", "Teleport", "Find the Path", "Teleport, Greater", "Phase Door", "Astral Projection"],
  },
  trickery: {
    name: "Trickery", classSkills: ["Bluff", "Disguise", "Hide"],
    spells: ["Disguise Self", "Invisibility", "Nondetection", "Confusion", "False Vision", "Mislead", "Screen", "Polymorph Any Object", "Time Stop"],
  },
  war: {
    name: "War", manualPower: "Weapon Focus with your deity's favored weapon, plus Martial Weapon Proficiency with it if martial. Favored weapons are not source-verified in this catalog; confirm with the DM and apply these weapon-specific benefits manually.",
    spells: ["Magic Weapon", "Spiritual Weapon", "Magic Vestment", "Divine Power", "Flame Strike", "Blade Barrier", "Power Word Blind", "Power Word Stun", "Power Word Kill"],
  },
  water: {
    name: "Water", manualPower: "Turn/destroy fire creatures and rebuke/command/bolster water creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: ["Obscuring Mist", "Fog Cloud", "Water Breathing", "Control Water", "Ice Storm", "Cone of Cold", "Acid Fog", "Horrid Wilting", "Elemental Swarm"],
    spellNotes: { 9: "Water spell only." },
  },
} as const satisfies Record<string, DomainDefinition>;

export type ClericDomainId = keyof typeof clericDomains;
export type ClericDomainSpell = { domain: ClericDomainId; spell: string };
export function isClericDomainId(value: unknown): value is ClericDomainId {
  return typeof value === "string" && Object.hasOwn(clericDomains, value);
}
export function getClericDomain(id: ClericDomainId): DomainDefinition {
  return clericDomains[id];
}
