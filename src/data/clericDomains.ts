import { clericDomainSpellLists } from "./clericDomainSpellLists";
import type { ClericDomainId } from "./clericDomainIds";
export { isClericDomainId } from "./clericDomainIds";
export type { ClericDomainId } from "./clericDomainIds";

export const clericDomainSource = "https://www.d20srd.org/srd/spellLists/clericDomains.htm";

type DomainDefinition = {
  name: string;
  spells: readonly [string, string, string, string, string, string, string, string, string];
  manualPower?: string;
  mysticPower?: string;
  grantedPower?: string;
  classSkills?: readonly string[];
  spellNotes?: Partial<Record<number, string>>;
  source?: "dragonlance-user-pack";
  clericDeities?: readonly string[];
  mysticOnly?: boolean;
  mysticOnlyInDragonlance?: boolean;
};

export const clericDomains = {
  air: {
    name: "Air",
    manualPower: "Turn/destroy earth creatures and rebuke/command/bolster air creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: clericDomainSpellLists.air,
    spellNotes: { 9: "Air spell only." },
  },
  animal: {
    name: "Animal", classSkills: ["Knowledge (nature)"],
    manualPower: "Speak with animals once per day as a spell-like ability.",
    spells: clericDomainSpellLists.animal,
    spellNotes: { 4: "Animals only.", 8: "Animals only." },
  },
  chaos: {
    name: "Chaos", manualPower: "Cast spells with the chaos descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.chaos,
    spellNotes: { 9: "Chaos spell only." },
  },
  death: {
    name: "Death", manualPower: "Death touch once per day (supernatural death effect): melee touch against a living creature, then roll 1d6 per cleric level. If the total equals or exceeds its current HP, it dies without a save.",
    spells: clericDomainSpellLists.death,
  },
  destruction: {
    name: "Destruction", manualPower: "Smite once per day: declare before a single melee attack; +4 to that attack and +cleric level damage on a hit. Resolve manually, not as a permanent attack bonus.",
    spells: clericDomainSpellLists.destruction,
  },
  earth: {
    name: "Earth", manualPower: "Turn/destroy air creatures and rebuke/command/bolster earth creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: clericDomainSpellLists.earth,
    spellNotes: { 9: "Earth spell only." },
  },
  evil: {
    name: "Evil", manualPower: "Cast spells with the evil descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.evil,
    spellNotes: { 9: "Evil spell only." },
  },
  fire: {
    name: "Fire", manualPower: "Turn/destroy water creatures and rebuke/command/bolster fire creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: clericDomainSpellLists.fire,
    spellNotes: { 3: "Resist cold or fire only.", 9: "Fire spell only." },
  },
  good: {
    name: "Good", manualPower: "Cast spells with the good descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.good,
    spellNotes: { 9: "Good spell only." },
  },
  healing: {
    name: "Healing", manualPower: "Cast healing spells at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.healing,
  },
  knowledge: {
    name: "Knowledge", classSkills: ["Knowledge (*)"],
    manualPower: "Cast divination spells at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.knowledge,
  },
  law: {
    name: "Law", manualPower: "Cast spells with the law descriptor at +1 caster level. Apply this conditional bonus manually; the sheet shows base caster level.",
    spells: clericDomainSpellLists.law,
    spellNotes: { 9: "Law spell only." },
  },
  luck: {
    name: "Luck", manualPower: "Good fortune once per day: reroll a roll you just made before the DM announces success or failure. Keep the new result, even if worse.",
    spells: clericDomainSpellLists.luck,
  },
  magic: {
    name: "Magic", manualPower: "For spell-completion/trigger devices only, count as a wizard of half your cleric level (round down, minimum 1), stacking with actual wizard levels. This grants no wizard spell slots or spellbook. Resolve device eligibility manually.",
    spells: clericDomainSpellLists.magic,
  },
  alteration: {
    name: "Alteration",
    source: "dragonlance-user-pack",
    mysticOnly: true,
    mysticPower: "Cast transmutation spells on living targets at +1 caster level.",
    spells: clericDomainSpellLists.alteration,
  },
  community: {
    name: "Community",
    source: "dragonlance-user-pack",
    clericDeities: ["mishakal"],
    mysticPower: "Once per day, cast Calm Emotions as a spell-like ability; gain a +2 competence bonus on Diplomacy checks.",
    spells: clericDomainSpellLists.community,
  },
  forge: {
    name: "Forge",
    source: "dragonlance-user-pack",
    clericDeities: ["reorx"],
    mysticPower: "Gain a +2 insight bonus on Craft and Appraise checks related to stone or metal items.",
    spells: clericDomainSpellLists.forge,
  },
  insight: {
    name: "Insight",
    source: "dragonlance-user-pack",
    clericDeities: ["zivilyn"],
    mysticPower: "Gain uncanny dodge, retaining your Dexterity bonus to AC when flat-footed or attacked by an invisible attacker. If you already have uncanny dodge from another class, gain improved uncanny dodge.",
    spells: clericDomainSpellLists.insight,
  },
  liberation: {
    name: "Liberation",
    source: "dragonlance-user-pack",
    clericDeities: ["gilean"],
    mysticPower: "Gain a +2 morale bonus on saving throws against enchantment spells and effects.",
    spells: clericDomainSpellLists.liberation,
  },
  meditation: {
    name: "Meditation",
    source: "dragonlance-user-pack",
    clericDeities: ["majere", "zivilyn"],
    mysticPower: "Once per day, cast one spell as if modified by Empower Spell, without increasing its level or casting time; you need not know the feat.",
    spells: clericDomainSpellLists.meditation,
  },
  mentalism: {
    name: "Mentalism",
    source: "dragonlance-user-pack",
    mysticOnly: true,
    mysticPower: "Gain a +2 bonus on Bluff, Diplomacy, and Sense Motive checks, and on Will saves against enchantment spells and effects.",
    spells: clericDomainSpellLists.mentalism,
  },
  necromancy: {
    name: "Necromancy",
    source: "dragonlance-user-pack",
    mysticOnly: true,
    mysticPower: "Rebuke, command, or bolster undead as an evil cleric a number of times per day equal to 3 + your Charisma modifier; this is a supernatural ability.",
    spells: clericDomainSpellLists.necromancy,
  },
  passion: {
    name: "Passion",
    source: "dragonlance-user-pack",
    clericDeities: ["sirrion"],
    mysticPower: "For a total of 1 round per class level each day, act as if under the effects of Rage; this is a supernatural ability.",
    spells: clericDomainSpellLists.passion,
  },
  pestilence: {
    name: "Pestilence",
    source: "dragonlance-user-pack",
    clericDeities: ["morgion"],
    mysticPower: "Become immune to the effects of all diseases, though you can still carry infectious diseases.",
    spells: clericDomainSpellLists.pestilence,
    spellNotes: { 2: "1d3 fiendish dire rats only." },
  },
  plant: {
    name: "Plant", classSkills: ["Knowledge (nature)"],
    manualPower: "Rebuke/command plant creatures as an evil cleric rebukes/commands undead, 3 + CHA modifier times per day. Resolve turning manually.",
    spells: clericDomainSpellLists.plant,
  },
  protection: {
    name: "Protection", manualPower: "Protective ward once per day: standard action, touch grants a resistance bonus equal to cleric level on the target's next save within 1 hour. Apply manually; resistance bonuses do not stack.",
    spells: clericDomainSpellLists.protection,
  },
  strength: {
    name: "Strength", manualPower: "Feat of strength once per day: free action, enhancement bonus to Strength equal to cleric level for 1 round. Apply manually; enhancement bonuses do not stack.",
    spells: clericDomainSpellLists.strength,
  },
  sun: {
    name: "Sun", manualPower: "Once per day replace a regular undead turning with greater turning: undead that would be turned are destroyed instead. This uses a regular turning attempt; resolve manually.",
    mysticOnlyInDragonlance: true,
    mysticPower: "Turn or destroy undead as a good cleric a number of times per day equal to 3 + your Charisma modifier; this is a supernatural ability.",
    spells: clericDomainSpellLists.sun,
  },
  restoration: {
    name: "Restoration",
    source: "dragonlance-user-pack",
    mysticOnly: true,
    mysticPower: "Cast healing spells at +1 caster level.",
    spells: clericDomainSpellLists.restoration,
  },
  storm: {
    name: "Storm",
    source: "dragonlance-user-pack",
    clericDeities: ["zeboim"],
    mysticPower: "Gain electricity resistance 5.",
    spells: clericDomainSpellLists.storm,
  },
  travel: {
    name: "Travel", classSkills: ["Survival"],
    manualPower: "Against magical movement impediments, freedom of movement applies automatically as needed, up to cleric level rounds per day (not necessarily consecutive). Track the rounds and resolve the effect manually.",
    spells: clericDomainSpellLists.travel,
  },
  trickery: {
    name: "Trickery", classSkills: ["Bluff", "Disguise", "Hide"],
    spells: clericDomainSpellLists.trickery,
  },
  treachery: {
    name: "Treachery",
    source: "dragonlance-user-pack",
    clericDeities: ["hiddukel"],
    mysticPower: "Once per day, deal an additional 1d6 damage per two class levels (round up) with one melee attack against a flat-footed opponent. Declare before the attack; a miss wastes the use. Creatures immune to critical hits are also immune to this damage.",
    spells: clericDomainSpellLists.treachery,
  },
  war: {
    name: "War",
    grantedPower: "Gain Weapon Focus with the favored weapon and martial proficiency if needed.",
    spells: clericDomainSpellLists.war,
  },
  water: {
    name: "Water", manualPower: "Turn/destroy fire creatures and rebuke/command/bolster water creatures. Shared daily uses: 3 + CHA modifier. Resolve turning manually.",
    spells: clericDomainSpellLists.water,
    spellNotes: { 9: "Water spell only." },
  },
} as const satisfies Record<ClericDomainId, DomainDefinition>;

export type ClericDomainSpell = { domain: ClericDomainId; spell: string };
export function getClericDomain(id: ClericDomainId): DomainDefinition {
  return clericDomains[id];
}
