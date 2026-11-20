import { classDefinitions, type FeatDefinition } from "../domain";

const featCatalogSourceBook = "Player's Handbook (3.5)";
const core35SourceId = "core-35-srd";
const dragonlanceSourceId = "dragonlance-user-pack";
const dragonlanceFeatSourceBook = "Dragonlance Campaign Setting (3.5)";
const completeArcaneSourceBook = "Complete Arcane (3.5)";
const completeArcaneSource = { sourceBook: completeArcaneSourceBook };
const completeMageSourceBook = "Complete Mage (3.5)";
const completeMageSource = { sourceBook: completeMageSourceBook };
const completeDivineSourceBook = "Complete Divine (3.5)";
const completeDivineSource = { sourceBook: completeDivineSourceBook };
const completeAdventurerSourceBook = "Complete Adventurer (3.5)";
const completeAdventurerPerformSkills = [
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
const completeAdventurerAnyPerformRanks = (ranks: number): Record<string, number> =>
  Object.fromEntries(
    completeAdventurerPerformSkills.map((skill) => [skill, ranks]),
  );
const completeAdventurerSneakAttackFeatures = [
  "Sneak Attack",
  ...Array.from({ length: 10 }, (_, index) => `Sneak Attack +${index + 1}d6`),
];
const completeAdventurerSmiteEvilFeatures = [
  "Smite Evil",
  ...Array.from({ length: 5 }, (_, index) => `Smite Evil (${index + 1}/day)`),
];
const completeAdventurerFavoredEnemyFeatures = [
  "Favored Enemy",
  "Favored Enemy (1st)",
  "Favored Enemy (2nd)",
  "Favored Enemy (additional choice and +2 bonus)",
];
const completeAdventurerWildShapeFeatures = [
  "Wild Shape",
  "Wild Shape (1/day)",
  "Wild Shape (2/day)",
  "Wild Shape (3/day)",
  "Wild Shape (4/day)",
  "Wild Shape (5/day)",
  "Wild Shape (6/day, elemental 2/day)",
  "Wild Shape (Large)",
  "Wild Shape (Tiny)",
  "Wild Shape (plant)",
  "Wild Shape (Huge)",
  "Wild Shape (elemental 1/day, up to Large)",
  "Wild Shape (elemental 3/day, Huge elemental)",
];
const epicElementalWildShapeFeatures = [
  "Wild Shape (6/day, elemental 2/day)",
  "Wild Shape (elemental 1/day, up to Large)",
  "Wild Shape (elemental 3/day, Huge elemental)",
];
const completeDivineLargeWildShapeFeatures = [
  "Wild Shape (Large)",
  "Wild Shape (Huge)",
  "Wild Shape (elemental 1/day, up to Large)",
  "Wild Shape (elemental 3/day, Huge elemental)",
];
const completeScoundrelSourceBook = "Complete Scoundrel (3.5)";
const completeChampionSourceBook = "Complete Champion (3.5)";
const completeWarriorSourceBook = "Complete Warrior (3.5)";
const dungeonMastersGuideIISourceBook = "Dungeon Master's Guide II (3.5)";
const completeWarriorRageFeatures = [
  "Rage",
  "Frenzy",
  "Rage (1/day)",
  "Rage (2/day)",
  "Rage (3/day)",
  "Rage (4/day)",
  "Rage (5/day)",
  "Rage (6/day)",
  "Greater Rage",
  "Mighty Rage",
];
const completeWarriorSmiteFeatures = [
  "Smite",
  "Smite Evil",
  "Smite Good",
  ...Array.from({ length: 5 }, (_, index) => `Smite Evil (${index + 1}/day)`),
  ...Array.from({ length: 3 }, (_, index) => `Smite Good (${index + 1}/day)`),
];
const completeWarriorDamageReductionFeatures = [
  "Damage Reduction",
  ...Array.from({ length: 5 }, (_, index) => `Damage Reduction ${index + 1}/-`),
];
const completeScoundrelSneakAttackFeaturesAtLeast = (minimumDice: number) =>
  Array.from(
    { length: 11 - minimumDice },
    (_, index) => `Sneak Attack +${minimumDice + index}d6`,
  );
const completeArcaneCasterLevelPenalty =
  "Reduce all spell/SLA caster levels by 4.";
const suddenMetamagicPrefix = "Once per day, apply ";
const suddenMetamagicSuffix =
  " without increasing its level or preparing it ahead of time";
const monsterManualSourceBook = "Monster Manual (3.5)";
const mm2SourceBook = "Monster Manual II";
const monsterManualIIISourceBook = "Monster Manual III";
const monsterManualIVSourceBook = "Monster Manual IV";
const draconomiconSourceBook = "Draconomicon (3.5)";
const monsterManualVSourceBook = "Monster Manual V";
const dungeonMastersGuideSourceBook = "Dungeon Master's Guide (3.5)";
const playerHandbookIISourceBook = "Player's Handbook II (3.5)";
const turnOrRebukeUndeadFeatures = [
  "Turn Undead",
  "Rebuke Undead",
  "Turn or Rebuke Undead",
];
const turnOrRebukeCreatureFeatures = [
  ...turnOrRebukeUndeadFeatures,
  "Turn or Rebuke Elementals",
];
type CatalogFeat = Omit<FeatDefinition, "source"> & {
  source?: FeatDefinition["source"];
};

const substitutionEnergyTypes = ["acid", "cold", "electricity", "fire"] as const;
const completeArcaneEnergyFeats: CatalogFeat[] = substitutionEnergyTypes.flatMap(
  (energy) => {
    const energyName = `${energy[0].toUpperCase()}${energy.slice(1)}`;
    const substitutionId = `energy-substitution-${energy}`;
    return [
      {
        id: substitutionId,
        name: `Energy Substitution (${energyName})`,
        description:
          `Change a spell with an energy descriptor to ${energy} damage and the matching descriptor. Uses the spell's normal slot.`,
        categories: ["metamagic"],
        ...completeArcaneSource,
        prerequisites: {
          skills: { "Knowledge (arcana)": 5 },
          minimumFeatsByCategory: { metamagic: 1 },
        },
      },
      {
        id: `energy-admixture-${energy}`,
        name: `Energy Admixture (${energyName})`,
        description:
          `Add an equal amount of ${energy} damage to a spell with an energy descriptor; damage types count separately toward caps and both descriptors apply. Slot +4.`,
        categories: ["metamagic"],
        ...completeArcaneSource,
        prerequisites: { feats: [substitutionId] },
      },
    ];
  },
);
const completeDivinePracticedSpellcasterFeats: CatalogFeat[] = Object.values(
  classDefinitions,
)
  .filter(({ spellcasting }) => spellcasting)
  .map(({ id, name }) => ({
    id: `practiced-spellcaster-${id}`,
    name: `Practiced Spellcaster (${name})`,
    description:
      "Increase this class's caster level by 4, capped at your total Hit Dice; spells per day and known spells are unchanged. Choose a different spellcasting class each time.",
    ...completeDivineSource,
    prerequisites: { classLevels: { [id]: 1 }, skills: { Spellcraft: 4 } },
  }));
const completeArcaneInnateSpellLikeFeats: CatalogFeat[] = [
  ["communicator", "Communicator", "arcane mark, comprehend languages, and message"],
  ["insightful", "Insightful", "detect magic, detect secret doors, and read magic"],
  ["soul-of-the-north", "Soul of the North", "chill touch, ray of frost, and resistance"],
  ["spell-hand", "Spell Hand", "mage hand, open/close, and Tenser's floating disk"],
  ["necropolis-born", "Necropolis Born", "cause fear, ghost sound, and touch of fatigue"],
  ["night-haunt", "Night Haunt", "dancing lights, prestidigitation, and unseen servant"],
].map(([id, name, spellNames]) => ({
  id,
  name,
  description: `As a 1st-level caster, use ${spellNames} as spell-like abilities, each once per day.`,
  ...completeArcaneSource,
}));

export const featCatalog: FeatDefinition[] = ([
  {
    id: "cornered-rat",
    name: "Cornered Rat",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "On your next action after an enemy's Intimidate check against you or a round in which you made a Diplomacy check, gain +2 on attacks. If you attack that enemy or your Diplomacy check's target, it must succeed on a DC 10 Sense Motive check or be flat-footed and denied its Dexterity bonus to AC.",
    prerequisites: { races: ["Gully Dwarf"], baseAttackBonus: 1 },
  },
  {
    id: "draconian-breath-weapon",
    name: "Draconian Breath Weapon",
    source: dragonlanceSourceId,
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
    id: "flyby-attack",
    name: "Flyby Attack",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "When flying, take a move action (including a dive) and another standard action at any point during the move; you cannot take a second move action that round. Resolve movement and action timing manually.",
    prerequisites: { flySpeed: true },
  },
  {
    id: "ability-focus",
    name: "Ability Focus",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "Choose one special ability that allows a saving throw to increase its save DC by 2 (Monster Manual IV/V revision). Confirm the ability manually. Repeated selections apply to different abilities and do not stack.",
  },
  {
    id: "brutal-throw",
    name: "Brutal Throw",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Str can replace Dex on thrown-weapon attack rolls; apply the substitution manually. Fighter bonus feat.",
    fighterBonus: true,
  },
  {
    id: "brachiation",
    name: "Brachiation",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "In medium or dense forests, move at your base land speed while at least 20 feet above the ground, ignoring terrain-based movement effects. Apply the terrain and movement benefit manually.",
    prerequisites: { skills: { Climb: 4, Jump: 4 } },
  },
  {
    id: "appraise-magic-value",
    name: "Appraise Magic Value",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "If you know an item is magical, use Appraise to identify its properties with 8 hours of uninterrupted work and 25 gp in special materials. The check DC is 10 + the item's caster level; apply the check and costs manually.",
    prerequisites: {
      skills: {
        Appraise: 5,
        "Knowledge (arcana)": 5,
        Spellcraft: 5,
      },
    },
  },
  {
    id: "combat-intuition",
    name: "Combat Intuition",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a free action, assess one opponent's challenge category relative to your level or Hit Dice with a +4 Sense Motive bonus, narrowing the result to one category. Gain a +1 insight bonus on melee attacks against a creature you made a melee attack against during the previous round. Apply the checks and conditional bonus manually. Fighter bonus feat.",
    prerequisites: {
      skills: { "Sense Motive": 4 },
      baseAttackBonus: 5,
    },
    fighterBonus: true,
  },
  {
    id: "danger-sense",
    name: "Danger Sense",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Once per day, reroll an initiative check you just made and use the better result. Decide to reroll before the round starts; track daily use manually.",
    prerequisites: { feats: ["improved-initiative"] },
  },
  {
    id: "death-blow",
    name: "Death Blow",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Perform a coup de grace against a helpless defender as a standard action instead of a full-round action; it still provokes attacks of opportunity. Resolve the attack manually.",
    prerequisites: {
      feats: ["improved-initiative"],
      baseAttackBonus: 2,
    },
  },
  {
    id: "hear-the-unseen",
    name: "Hear the Unseen",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a move action that does not provoke attacks of opportunity, attempt a DC 25 Listen check to pinpoint all foes within 30 feet with line of effect. This does not remove concealment miss chances. You cannot use it while deafened or in silence; moving invisible or hidden foes may oppose the check with Move Silently and gain +15, and perfectly silent foes cannot be detected. Resolve checks manually.",
    prerequisites: { skills: { Listen: 5 }, feats: ["blind-fight"] },
  },
  {
    id: "quick-reconnoiter",
    name: "Quick Reconnoiter",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Make one Spot check and one Listen check each round as free actions, and gain +2 on initiative checks.",
    prerequisites: { skills: { Listen: 5, Spot: 5 } },
  },
  {
    id: "open-minded",
    name: "Open Minded",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Gain 5 skill points per selection. Spend them normally without exceeding maximum skill ranks; apply the additional points manually.",
  },
  {
    id: "oversized-two-weapon-fighting",
    name: "Oversized Two-Weapon Fighting",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When wielding a one-handed weapon in your off hand, take two-weapon fighting penalties as if it were a light weapon. Fighter bonus feat; apply the reduced penalties manually.",
    prerequisites: { abilities: { str: 13 }, feats: ["two-weapon-fighting"] },
    fighterBonus: true,
  },
  {
    id: "deft-opportunist",
    name: "Deft Opportunist",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Gain a +4 bonus on attack rolls when making attacks of opportunity.",
    prerequisites: {
      abilities: { dex: 15 },
      feats: ["combat-reflexes"],
    },
  },
  {
    id: "dive-for-cover",
    name: "Dive for Cover",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "After failing a Reflex save, you may immediately reroll it and must use the second result; you become prone immediately after. Resolve the reroll and prone condition manually.",
    prerequisites: { baseSaves: { reflex: 4 } },
  },
  {
    id: "force-of-personality",
    name: "Force of Personality",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Use your Charisma modifier instead of Wisdom on Will saves against mind-affecting spells and abilities; apply manually.",
    prerequisites: { abilities: { cha: 13 } },
  },
  {
    id: "goad",
    name: "Goad",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a move action, goad an opponent that threatens you, has line of sight to you, can hear you, and has Intelligence 3+; this is mind-affecting. If it still threatens you and has line of sight to you at the start of its next turn, it must make a Will save (DC 10 + half your character level + your Cha modifier). On a failure, it can make melee attacks only against you while you remain a legal target; it can still cast spells, make ranged attacks, move, or take other actions. Resolve the save and target restrictions manually. Fighter bonus feat.",
    prerequisites: { abilities: { cha: 13 }, baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "improved-diversion",
    name: "Improved Diversion",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Create a diversion to hide as a move action and gain +4 on Bluff checks for this purpose; apply the action and bonus manually. Fighter bonus feat.",
    prerequisites: { skills: { Bluff: 4 } },
    fighterBonus: true,
  },
  {
    id: "improved-flight",
    name: "Improved Flight",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Improve your maneuverability class by one step, up to perfect; track the resulting maneuverability manually.",
    prerequisites: { flySpeed: true },
  },
  {
    id: "improved-swimming",
    name: "Improved Swimming",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Swim at half your speed as a move action or at your speed as a full-round action; apply movement manually.",
    prerequisites: { skills: { Swim: 6 } },
  },
  {
    id: "natural-bond",
    name: "Natural Bond",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Add +3 to your effective druid level when determining your animal companion's bonus Hit Dice, extra tricks, special abilities, and other bonuses, without exceeding your character level. Track companion progression manually.",
    prerequisites: { classFeatures: ["Animal Companion"] },
  },
  {
    id: "obscure-lore",
    name: "Obscure Lore",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Gain a +4 insight bonus on checks using your Bardic Knowledge or lore class feature; apply the bonus manually.",
    prerequisites: { anyClassFeatures: ["Bardic Knowledge", "Lore"] },
  },
  {
    id: "tactile-trapsmith",
    name: "Tactile Trapsmith",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Use your Dexterity bonus instead of Intelligence on all Search and Disable Device checks, and take no penalties on these checks for darkness or blindness. Apply the modifiers manually.",
  },
  {
    id: "dual-strike",
    name: "Dual Strike",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Standard action: attack with both hands on one roll using the worse modifier; -4 for primary one-handed/light plus off-hand light, else -10. Each deals normal damage; DR applies separately, precision damage once, and critical extra damage only from primary. Fighter bonus feat.",
    prerequisites: {
      feats: ["improved-two-weapon-fighting", "two-weapon-fighting"],
    },
    fighterBonus: true,
  },
  {
    id: "expert-tactician",
    name: "Expert Tactician",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Hit with an attack of opportunity: you and all allies gain +2 circumstance to melee attacks and damage against that creature for 1 round. Apply manually.",
    prerequisites: {
      abilities: { dex: 13 },
      baseAttackBonus: 2,
      feats: ["combat-reflexes"],
    },
  },
  {
    id: "extraordinary-concentration",
    name: "Extraordinary Concentration",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "While maintaining a spell, Concentration DC 25 + spell level changes the action from standard to move, or swift if you beat it by 10. Failure ends it; this never maintains multiple spells. Resolve manually.",
    prerequisites: { skills: { Concentration: 15 } },
  },
  {
    id: "extraordinary-spell-aim",
    name: "Extraordinary Spell Aim",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "For an area spell, Spellcraft DC 25 + spell level excludes one creature. Casting becomes a full-round action unless it already takes longer. Resolve manually.",
    prerequisites: { skills: { Spellcraft: 15 } },
  },
  {
    id: "jack-of-all-trades",
    name: "Jack of All Trades",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Treat every skill as having 1/2 rank, allowing checks that normally require training; this does not enable checks for skills that do not allow skill checks. Apply this benefit manually.",
    prerequisites: { abilities: { int: 13 } },
  },
  {
    id: "leap-attack",
    name: "Leap Attack",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "On a charge, if your jump covers at least 10 feet horizontally and ends in a square from which you threaten the target, double your Power Attack bonus damage, or triple it with a two-handed weapon. Ignore rough terrain in squares jumped over; resolve the jump, charge, and damage manually.",
    prerequisites: { skills: { Jump: 8 }, feats: ["power-attack"] },
  },
  {
    id: "mobile-spellcasting",
    name: "Mobile Spellcasting",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When casting a spell, make a Concentration check (DC 20 + spell level) to cast it and move up to your speed as one standard action; the spell cannot take longer than a standard action. Failure loses the spell. Movement can provoke attacks of opportunity; casting defensively raises the DC to 25 + spell level. Resolve the check, spell loss, and movement manually.",
    prerequisites: { skills: { Concentration: 8 } },
  },
  {
    id: "power-throw",
    name: "Power Throw",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Before your attacks on your turn, subtract up to your base attack bonus from all thrown-weapon attack rolls and add the same amount to thrown-weapon damage until your next turn. Apply the adjustment manually. Fighter bonus feat.",
    prerequisites: {
      abilities: { str: 13 },
      feats: ["brutal-throw", "power-attack"],
    },
    fighterBonus: true,
  },
  {
    id: "versatile-performer",
    name: "Versatile Performer",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Choose Perform categories equal to Int bonus (minimum 1); they use your highest Perform ranks, update with them, and are permanent. Gain new categories if Int bonus rises. Multiple forms add +2 to the higher Perform modifier. Track manually.",
    prerequisites: { anySkills: completeAdventurerAnyPerformRanks(5) },
  },
  {
    id: "ascetic-hunter",
    name: "Ascetic Hunter",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When using an unarmed strike to deliver a stunning attack against a favored enemy, add half your favored enemy bonus to the stunning save DC. Monk and ranger levels stack for unarmed-strike damage. Apply the conditional benefits and multiclass rules manually.",
    prerequisites: {
      feats: ["improved-unarmed-strike"],
      anyClassFeatures: completeAdventurerFavoredEnemyFeatures,
    },
  },
  {
    id: "ascetic-knight",
    name: "Ascetic Knight",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Monk and paladin levels stack for unarmed-strike damage and smite evil damage. Apply the class stacking and multiclass rules manually.",
    prerequisites: {
      feats: ["improved-unarmed-strike"],
      anyClassFeatures: completeAdventurerSmiteEvilFeatures,
    },
  },
  {
    id: "ascetic-mage",
    name: "Ascetic Mage",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a swift action, sacrifice a spell to gain an unarmed attack and damage bonus equal to the spell's level for 1 round. Monk and sorcerer levels stack to determine the monk AC bonus. Apply the spell sacrifice, bonuses, class stacking, and multiclass rules manually.",
    prerequisites: {
      feats: ["improved-unarmed-strike"],
      anyClassLevels: { bard: 4, sorcerer: 4 },
    },
  },
  {
    id: "ascetic-rogue",
    name: "Ascetic Rogue",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When using an unarmed strike with sneak attack to deliver a stunning attack, add +2 to the stunning save DC. Monk and rogue levels stack for unarmed-strike damage. Apply the conditional benefits and multiclass rules manually.",
    prerequisites: {
      feats: ["improved-unarmed-strike"],
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "deft-strike",
    name: "Deft Strike",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a standard action, make a Spot check against a visible target's AC. On success, your next attack against it before your next turn ignores its armor and natural armor bonuses (including enhancement bonuses); other AC bonuses still apply. Ranged attacks must be within 30 feet. Resolve the check and attack manually.",
    prerequisites: {
      abilities: { int: 13 },
      feats: ["combat-expertise"],
      skills: { Spot: 10 },
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "devoted-inquisitor",
    name: "Devoted Inquisitor",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When one attack successfully applies both sneak attack and smite evil, the target must succeed on a Will save (DC 10 + half your character level + Cha modifier) or be dazed for 1 round. Apply the save and multiclass rules manually.",
    prerequisites: {
      anyClassFeatureGroups: [
        completeAdventurerSneakAttackFeatures,
        completeAdventurerSmiteEvilFeatures,
      ],
    },
  },
  {
    id: "devoted-performer",
    name: "Devoted Performer",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Bard and paladin levels stack for smite damage and daily bardic music uses, without granting extra daily uses beyond that total. You may multiclass freely; paladin alignment rules and normal XP penalties remain. Apply manually.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      anyClassFeatures: completeAdventurerSmiteEvilFeatures,
    },
  },
  {
    id: "devoted-tracker",
    name: "Devoted Tracker",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Paladin and ranger levels stack for smite damage and wild empathy, not daily smite uses. A special mount can also become your animal companion, gaining both sets of benefits. Free multiclassing still faces paladin alignment rules and normal XP penalties; apply manually.",
    prerequisites: {
      feats: ["track"],
      anyClassFeatures: completeAdventurerSmiteEvilFeatures,
      classFeatures: ["Wild Empathy"],
    },
  },
  {
    id: "disguise-spell",
    name: "Disguise Spell",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As part of casting, Perform opposes Spot to hide the components; Spellcraft cannot identify the spell, and casting still provokes. Visible emanations or other clues can reveal the source. Resolve checks and visibility manually.",
    prerequisites: {
      anySkills: completeAdventurerAnyPerformRanks(9),
      classFeatures: ["Bardic Music"],
    },
  },
  {
    id: "extra-music",
    name: "Extra Music",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Gain four additional daily uses of bardic music per selection. Multiple selections stack; track uses manually.",
    prerequisites: { classFeatures: ["Bardic Music"] },
  },
  {
    id: "green-ear",
    name: "Green Ear",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Alter a mind-affecting bardic music or similar Perform ability to affect plants only; plants gain +5 on Will saves. Normally plants are immune to mind-affecting spells and abilities. Apply manually.",
    prerequisites: {
      anySkills: completeAdventurerAnyPerformRanks(10),
      classFeatures: ["Bardic Music"],
    },
  },
  {
    id: "lingering-song",
    name: "Lingering Song",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Inspire courage, greatness, and heroics last 1 minute after an inspired ally stops hearing you; without this feat they last only 5 rounds afterward. Track the extended duration manually.",
    prerequisites: { classFeatures: ["Bardic Music"] },
  },
  {
    id: "razing-strike",
    name: "Razing Strike",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "As a swift action, sacrifice a spell of at least 1st level to gain insight bonuses on melee attacks for 1 round equal to its level, and damage equal to 1d6 per spell level plus sneak attack damage. Arcane spells apply these bonuses against constructs; divine spells apply them against undead. This does not grant critical hits or sneak attacks against those creatures. Apply the spell sacrifice and bonuses manually.",
    prerequisites: {
      casterLevel: 5,
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "staggering-strike",
    name: "Staggering Strike",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "When a melee sneak attack deals damage, the target is staggered for 1 round unless it succeeds on a Fortitude save (DC equal to damage dealt); a DC 15 Heal check or magical healing of at least 1 hp ends the effect. The effect does not stack and does not affect creatures immune to sneak attack. Resolve it manually.",
    prerequisites: {
      baseAttackBonus: 6,
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "subsonics",
    name: "Subsonics",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Perform so subtly that opponents do not notice, while allies retain the usual bardic music benefits. Affected opponents cannot determine the source unless they see you perform or otherwise discover it. Apply detection and source rules manually.",
    prerequisites: {
      anySkills: completeAdventurerAnyPerformRanks(10),
      classFeatures: ["Bardic Music"],
    },
  },
  {
    id: "chant-of-fortitude",
    name: "Chant of Fortitude",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Immediate: spend bardic music for allies (including you) to gain Diehard until your next turn ends; repeat to sustain. -10 hp kills; magical silence blocks it. Track uses.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: { Concentration: 9 },
      anySkills: completeAdventurerAnyPerformRanks(9),
    },
  },
  {
    id: "ironskin-chant",
    name: "Ironskin Chant",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Swift, no AoO: spend bardic music for damage reduction 5/- on you or a hearing ally within 30 feet until next turn begins. Magical silence blocks it; track use and effect.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: { Concentration: 12 },
      anySkills: completeAdventurerAnyPerformRanks(12),
    },
  },
  {
    id: "lyric-spell",
    name: "Lyric Spell",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Spend 1 + spell level bardic music uses to cast a known arcane spell spontaneously. Normal casting action; an instrument can be an additional arcane focus; this cannot be used with Silent Spell. Track uses.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      anySkills: completeAdventurerAnyPerformRanks(9),
      arcaneSpellLevel: 2,
      spontaneousArcane: true,
    },
  },
  {
    id: "blindsense",
    name: "Blindsense",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "Expend a daily use of wild shape to gain blindsense for 1 minute per Hit Die, pinpointing creatures within 30 feet if you have line of effect. You retain the benefit in any form; track use and duration manually.",
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
      skills: { Listen: 4 },
    },
  },
  {
    id: "climb-like-an-ape",
    name: "Climb Like an Ape",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "Expend a daily use of wild shape to gain a climb speed equal to your base land speed for 10 minutes per Hit Die, a +8 racial bonus on Climb checks, and the ability to take 10 on Climb checks even when rushed or threatened. Track use and duration manually.",
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "cougars-vision",
    name: "Cougar's Vision",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "Expend a daily use of wild shape to gain low-light vision for 1 hour per Hit Die and a +4 bonus on Spot checks. You retain these benefits in any form; track use and duration manually.",
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
      skills: { Spot: 2 },
    },
  },
  {
    id: "hawks-vision",
    name: "Hawk's Vision",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "Expend one daily wild-shape use for +8 on Spot checks for 1 hour per Hit Die; ranged attacks take only -1 per range increment (instead of -2), and Spot takes -1 per 20 feet (instead of 10). Benefits persist in any form; track duration manually.",
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
      skills: { Spot: 4 },
    },
  },
  {
    id: "savage-grapple",
    name: "Savage Grapple",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "In wild shape, add sneak attack damage when you succeed on a grapple check to damage a creature you already grapple. Creatures not subject to sneak attacks take no extra damage; resolve manually.",
    prerequisites: {
      anyClassFeatureGroups: [
        completeAdventurerWildShapeFeatures,
        completeAdventurerSneakAttackFeatures,
      ],
    },
  },
  {
    id: "scent",
    name: "Scent",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    categories: ["wild"],
    description:
      "Standard supernatural action: spend wild shape use for scent 1 hour/Hit Die; detect within 30 feet, track by scent with Track, and retain it in any form. Track use and duration.",
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "insightful-reflexes",
    name: "Insightful Reflexes",
    source: core35SourceId,
    sourceBook: completeAdventurerSourceBook,
    description:
      "Use your Intelligence modifier instead of Dexterity on Reflex saves; apply this substitution manually.",
  },
  {
    id: "ascetic-stalker",
    name: "Ascetic Stalker",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Monk and ninja levels stack for ki pool size, unarmed strike damage, and ki strike. You can multiclass freely between monk and ninja, but must remain lawful to advance as a monk and still face normal multiclass XP penalties. Ninja progression and all stacking benefits remain manual.",
    prerequisites: {
      kiPower: true,
      kiStrikeMagic: true,
    },
  },
  {
    id: "deadly-defense",
    name: "Deadly Defense",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "While fighting defensively, deal +1d6 damage with a light weapon or a weapon eligible for Weapon Finesse, if unarmored or in light armor and not using a shield. With Combat Expertise, the benefit also applies when taking an attack penalty of at least -2. Fighter bonus feat; track the conditional damage manually.",
    fighterBonus: true,
  },
  {
    id: "daredevil-athlete",
    name: "Daredevil Athlete",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Three times per day, use an immediate action to gain a +5 competence bonus on one Balance, Climb, Escape Artist, Jump, Ride, Swim, or Tumble check. Track uses and the check bonus manually.",
  },
  {
    id: "daring-outlaw",
    name: "Daring Outlaw",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Rogue and swashbuckler levels stack to determine the Grace bonus on Reflex saves, the swashbuckler dodge bonus to AC, and sneak attack damage; track the combined class progression manually.",
    prerequisites: {
      swashbucklerGrace: true,
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(2),
    },
  },
  {
    id: "daring-warrior",
    name: "Daring Warrior",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Fighter and swashbuckler levels stack to determine the Grace bonus on Reflex saves, the swashbuckler dodge bonus to AC, and qualification for feats requiring fighter levels; track the combined class progression manually.",
    prerequisites: {
      swashbucklerGrace: true,
      feats: ["weapon-specialization"],
    },
  },
  {
    id: "cool-head",
    name: "Cool Head",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Immediately learn up to two mental skill tricks at no cost and increase your skill trick limit by one. Choose the free tricks in the Skill Tricks panel; trick effects remain manual.",
    prerequisites: { minimumSkillTricksByCategory: { mental: 2 } },
  },
  {
    id: "freerunner",
    name: "Freerunner",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Immediately learn up to two movement skill tricks at no cost and increase your skill trick limit by one. Choose the free tricks in the Skill Tricks panel; trick effects remain manual.",
    prerequisites: { minimumSkillTricksByCategory: { movement: 2 } },
  },
  {
    id: "sure-hand",
    name: "Sure Hand",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Immediately learn up to two manipulation skill tricks at no cost and increase your skill trick limit by one. Choose the free tricks in the Skill Tricks panel; trick effects remain manual.",
    prerequisites: { minimumSkillTricksByCategory: { manipulation: 2 } },
  },
  {
    id: "swift-ambusher",
    name: "Swift Ambusher",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Scout and rogue levels stack for skirmish damage and AC. You can also qualify for ambush feats as if your sneak attack dice included both your sneak attack and skirmish dice, but you cannot sacrifice skirmish damage to use those feats. Track the class-stacking benefits and damage tradeoffs manually; ambush-feat prerequisites use the combined dice.",
    prerequisites: {
      minimumSkirmishDamageDice: 1,
      minimumSkirmishACBonus: 1,
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(1),
    },
  },
  {
    id: "swift-hunter",
    name: "Swift Hunter",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Scout and ranger levels stack for skirmish damage and AC, and for favored-enemy progression and bonuses. Your skirmish damage can affect favored enemies normally immune to extra damage from critical hits. Track the class-stacking benefits and this exception manually.",
    prerequisites: {
      minimumFavoredEnemies: 1,
      minimumSkirmishDamageDice: 1,
      minimumSkirmishACBonus: 1,
    },
  },
  {
    id: "sweet-talker",
    name: "Sweet Talker",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Immediately learn up to two interaction skill tricks at no cost and increase your skill trick limit by one. Choose the free tricks in the Skill Tricks panel; trick effects remain manual.",
    prerequisites: { minimumSkillTricksByCategory: { interaction: 2 } },
  },
  {
    id: "expanded-ki-pool",
    name: "Expanded Ki Pool",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Gain three additional daily uses of your ki power. Track the extra uses and expenditure manually.",
    prerequisites: { kiPower: true },
  },
  {
    id: "enduring-ki",
    name: "Enduring Ki",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "When activating a ki power, spend one additional daily use to extend its chosen effect by 1 round. You also gain one additional daily use; track uses and duration manually.",
    prerequisites: { kiPower: true },
  },
  {
    id: "improved-familiar-complete-scoundrel",
    name: "Improved Familiar",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Adds a Small monstrous centipede (arcane caster level 2); badger, Small monstrous scorpion, or Medium viper (level 3); Small monstrous spider (level 4); vargouille (level 6); or any mephit (level 7) as familiar options. The familiar may be up to one alignment step away on each axis; a familiar vargouille lacks its kiss ability. Verify the selected creature's requirements manually.",
    prerequisites: {
      anyClassLevels: { sorcerer: 1, wizard: 1 },
      arcaneCasterLevel: 2,
    },
  },
  {
    id: "improved-skirmish",
    name: "Improved Skirmish",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "When you move at least 20 feet during your turn, increase your skirmish damage by 2d6 and your skirmish AC bonus by 2. Track the movement and increased bonuses manually.",
    prerequisites: {
      minimumSkirmishDamageDice: 2,
      minimumSkirmishACBonus: 1,
    },
  },
  {
    id: "martial-stalker",
    name: "Martial Stalker",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Fighter and ninja levels stack for ki pool size, AC bonus, and qualifying for feats that require a minimum fighter level. Track ninja progression and all class-stacking benefits manually.",
    prerequisites: {
      allMartialWeaponProficiencies: true,
      kiPower: true,
    },
    fighterBonus: true,
  },
  {
    id: "master-spellthief",
    name: "Master Spellthief",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Spellthief and other arcane spellcaster levels stack to determine the maximum spell level you can steal and your caster level for all arcane spells. You avoid arcane spell failure for spells cast or stolen from other classes in light armor only. Track spellthief progression, caster levels, and armor effects manually.",
    prerequisites: {
      arcaneSpellLevel: 2,
      stealSpell: true,
    },
  },
  {
    id: "poison-expert",
    name: "Poison Expert",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Increase the save DC of poison you apply by 1; apply the bonus manually.",
    prerequisites: {
      prestigeClassLevels: { assassin: 1 },
      skills: { "Craft (poisonmaking)": 8 },
    },
  },
  {
    id: "poison-master",
    name: "Poison Master",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Increase poison damage by 1 point per damage die; apply the bonus manually.",
    prerequisites: {
      prestigeClassLevels: { assassin: 1 },
      skills: { "Craft (poisonmaking)": 8 },
      feats: ["poison-expert"],
    },
  },
  {
    id: "psithief",
    name: "Psithief",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Use Steal Spell to siphon power points instead: twice the maximum spell level you can steal minus 1, capped by the target's manifester level. The stolen points can only manifest a power you know and expire after 1 hour; Knowledge (psionics) and Psicraft become class skills. Resolve the stealing, points, and skill access manually.",
    prerequisites: {
      manifesterLevel: 1,
      stealSpell: true,
    },
  },
  {
    id: "savvy-rogue",
    name: "Savvy Rogue",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "Improve applicable rogue special abilities: Crippling Strike works against creatures immune to sneak attack damage; Defensive Roll is usable three times per day; Improved Evasion grants +2 on Reflex saves; Opportunist can be used for multiple attacks of opportunity subject to its limits; Skill Mastery lets you take 12; and Slippery Mind grants +2 on its extra save. Track effects manually.",
    prerequisites: { classLevels: { rogue: 10 } },
  },
  {
    id: "concussion-attack",
    name: "Concussion Attack",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 2d6 sneak attack damage to impose a -2 penalty on the target's Intelligence and Wisdom checks and related skill checks for 10 rounds. Reusing the feat replaces the prior effect; track it manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(3),
    },
  },
  {
    id: "deafening-strike",
    name: "Deafening Strike",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 3d6 sneak attack damage to deafen the target for 3 rounds; track the effect manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(4),
    },
  },
  {
    id: "disemboweling-strike",
    name: "Disemboweling Strike",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack with the weapon selected for Weapon Focus, deal an additional 1d4 Constitution damage. You cannot use this feat against the same target more than once per day; trade 4d6 sneak attack damage and track the effect manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(5),
      weaponFocusDamageTypes: ["slashing"],
    },
  },
  {
    id: "eldritch-erosion",
    name: "Eldritch Erosion",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 3d6 sneak attack damage to reduce the target's spell resistance and power resistance by 5; track the effect manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(4),
      skills: { "Knowledge (arcana)": 1 },
    },
  },
  {
    id: "head-shot",
    name: "Head Shot",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack with the weapon selected for Weapon Focus, confuse the target for 1 round (Will save DC 10 + your normal sneak attack dice). Trade 5d6 sneak attack damage and track the save and effect manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(6),
      weaponFocusDamageTypes: ["bludgeoning"],
    },
  },
  {
    id: "impeding-attack",
    name: "Impeding Attack",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 3d6 sneak attack damage to impose a -2 penalty on the target's Strength and Dexterity checks; track the effect manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(4),
    },
  },
  {
    id: "merciful-strike",
    name: "Merciful Strike",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 1d6 sneak attack damage to deal the attack's damage as nonlethal damage; track the damage manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(2),
    },
  },
  {
    id: "mind-drain",
    name: "Mind Drain",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 1d6 sneak attack damage to drain power points from the target equal to its manifester level (minimum 1). If it reaches 0 power points, it also loses psionic focus; this feat has no effect on a target with no power points and can affect a target only once per round. Resolve the target's power-point and focus state manually.",
    prerequisites: {
      powerPointReserve: true,
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(2),
    },
  },
  {
    id: "persistent-attacker",
    name: "Persistent Attacker",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 4d6 sneak attack damage to allow a sneak attack against that target in the following round even if it would not otherwise qualify; resolve the follow-up manually.",
    prerequisites: {
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(5),
    },
  },
  {
    id: "throat-punch",
    name: "Throat Punch",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    ambush: true,
    description:
      "On a successful sneak attack, trade 2d6 sneak attack damage to hinder the target's speech for 3 rounds, including a 50% chance of failure for verbal spells and command-word items; resolve speech-dependent effects manually.",
    prerequisites: {
      feats: ["improved-unarmed-strike"],
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(3),
    },
  },
  {
    id: "chant-of-the-long-road",
    name: "Chant of the Long Road",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "After 1 minute of performance, use Bardic Music to let allies within 60 feet avoid nonlethal damage from hustling for 1 hour; track the performance and duration manually.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: completeAdventurerAnyPerformRanks(6),
    },
  },
  {
    id: "chord-of-distraction",
    name: "Chord of Distraction",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "As an immediate action, expend three daily uses of Bardic Music and make a Perform check opposed by the target's Sense Motive check (modified as for a combat feint). If successful, a target within 30 feet that can hear or see you is flat-footed against one ally until attacked or the start of your next turn; resolve manually.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: completeAdventurerAnyPerformRanks(9),
    },
  },
  {
    id: "epic-of-the-lost-king",
    name: "Epic of the Lost King",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "As a move action, expend one daily use of Bardic Music to remove fatigue from up to three allies, including yourself, within 30 feet; expend three uses to remove exhaustion instead. Track uses and conditions manually.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: completeAdventurerAnyPerformRanks(6),
    },
  },
  {
    id: "sound-of-silence",
    name: "Sound of Silence",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "As a standard action, expend two daily uses of Bardic Music to deafen one target within 30 feet that can hear you for 3 rounds. A successful Will save against a DC equal to your Perform check result negates the effect; resolve manually.",
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: completeAdventurerAnyPerformRanks(9),
    },
  },
  {
    id: "warning-shout",
    name: "Warning Shout",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    description:
      "As an immediate action, expend two daily uses of Bardic Music to grant one ally other than yourself within 30 feet who can see or hear you a +5 morale bonus on their next Reflex save and evasion. The effect ends after that save or at the start of your next turn; track it manually.",
    prerequisites: {
      classFeatures: ["Bardic Music", "Evasion"],
      skills: completeAdventurerAnyPerformRanks(9),
    },
  },
  {
    id: "advantageous-avoidance",
    name: "Advantageous Avoidance",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend one luck reroll to force an opponent to reroll a critical threat confirmation, or three luck rerolls to force an opponent to reroll an attack roll. Track rerolls and results manually.",
    prerequisites: {
      minimumCharacterLevel: 3,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "better-lucky-than-good",
    name: "Better Lucky than Good",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Once per day, expend a luck reroll when you roll a natural 1 on an attack to treat it as a natural 20. Track uses and luck rerolls manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      minimumFeatsByCategory: { luck: 2 },
    },
  },
  {
    id: "dumb-luck",
    name: "Dumb Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "When you roll a natural 1 on a saving throw, expend a luck reroll as an immediate action to treat it as a natural 20. Usable once per day; track uses and rerolls manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      minimumFeatsByCategory: { luck: 2 },
    },
  },
  {
    id: "fortuitous-strike",
    name: "Fortuitous Strike",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend one luck reroll as a swift action to reroll weapon damage, or two luck rerolls as a swift action to reroll an attack roll. Track rerolls and results manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "good-karma",
    name: "Good Karma",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "As an immediate action, expend a luck reroll to redirect an attack against an adjacent ally to you, provided you are within the attack's reach or range. If it hits you, take 50% extra damage; track the effect manually.",
    prerequisites: { minimumCharacterLevel: 3 },
  },
  {
    id: "healers-luck",
    name: "Healer's Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "As a swift action on the turn you cast a conjuration (healing) spell, expend a luck reroll to reroll the hit points healed. Track the spell, reroll, and result manually.",
  },
  {
    id: "lucky-break",
    name: "Lucky Break",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as a swift action to reroll a Strength check to break an item or burst open a door; track the reroll manually.",
  },
  {
    id: "lucky-catch",
    name: "Lucky Catch",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as an immediate action to reroll a Balance, Climb, or Jump check; track the reroll manually.",
  },
  {
    id: "lucky-fingers",
    name: "Lucky Fingers",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as an immediate action to reroll a Disable Device, Open Lock, or Sleight of Hand check; track the reroll manually.",
  },
  {
    id: "lucky-start",
    name: "Lucky Start",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll to reroll an initiative check; using this feat requires no action. Track the reroll manually.",
  },
  {
    id: "magical-fortune",
    name: "Magical Fortune",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend one luck reroll as a swift action to reroll damage from a spell you just cast, or two luck rerolls as a swift action to reroll a caster level check. Track the spell, rerolls, and results manually.",
    prerequisites: {
      casterLevel: 3,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "make-your-own-luck",
    name: "Make Your Own Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as an immediate action to reroll a skill check in a skill in which you have at least 1 rank; track the reroll manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "misers-fortune",
    name: "Miser's Fortune",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "As long as you have a luck reroll remaining, items you possess gain a +5 luck bonus on saves. As an immediate action, expend a luck reroll to force an opponent within 30 feet to reroll a sunder attack or Strength check to damage an object; track the effects manually.",
  },
  {
    id: "psychic-luck",
    name: "Psychic Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend one luck reroll as a swift action to reroll damage from a psionic power you just manifested, or two luck rerolls as a swift action to reroll a manifester level check. You gain one luck reroll per day; track power use and rerolls manually.",
    prerequisites: {
      manifesterLevel: 3,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "sly-fortune",
    name: "Sly Fortune",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll to reroll a Hide, Move Silently, or Tumble check; track the reroll manually.",
  },
  {
    id: "survivors-luck",
    name: "Survivor's Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as an immediate action to reroll a saving throw you just failed; track the reroll manually.",
    prerequisites: {
      minimumCharacterLevel: 9,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "tempting-fate",
    name: "Tempting Fate",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll to reroll a stabilization check. Once per day, when at least 1 hit point remains and damage would kill you, expend a luck reroll as an immediate action to take only enough damage to reach -9 hit points and stabilize; resolve manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      minimumFeatsByCategory: { luck: 1 },
    },
  },
  {
    id: "third-times-the-charm",
    name: "Third Time's the Charm",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Immediately after using the Luck domain's granted power, expend a luck reroll to use that power one additional time, gaining a third chance on the roll. Gain one luck reroll per day; track uses manually.",
    prerequisites: {
      minimumCharacterLevel: 3,
      minimumFeatsByCategory: { luck: 1 },
      domains: ["luck"],
    },
  },
  {
    id: "unbelievable-luck",
    name: "Unbelievable Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "While at least one luck reroll remains, gain a +2 luck bonus on the save with your lowest base bonus (choose among ties). Gain two luck rerolls per day; track the bonus and rerolls manually.",
    prerequisites: { minimumFeatsByCategory: { luck: 1 } },
  },
  {
    id: "victors-luck",
    name: "Victor's Luck",
    source: core35SourceId,
    sourceBook: completeScoundrelSourceBook,
    categories: ["luck"],
    description:
      "Expend a luck reroll as a swift action to reroll a critical threat confirmation; track the reroll manually.",
  },
  {
    id: "empower-spell-like-ability",
    name: "Empower Spell-Like Ability",
    source: core35SourceId,
    sourceBook: monsterManualSourceBook,
    description:
      "Empower one SLA at caster level 6+ (duplicated spell level ≤ floor(caster level / 2) - 2); +50% variable numeric effects. Saves/opposed checks and nonvariable effects are unaffected. Use 3/day or lower normal limit; different SLA per selection. Track manually.",
    prerequisites: { racialSpellLikeAbilityCasterLevel: 6 },
  },
  {
    id: "maximize-spell-like-ability",
    name: "Maximize Spell-Like Ability",
    source: core35SourceId,
    sourceBook: completeArcaneSourceBook,
    description:
      "Maximize variable numeric effects of one SLA (caster level 6+; duplicated spell level ≤ floor(caster level / 2) - 2). Saves/opposed checks unaffected; use 3/day or lower normal limit. Different SLA per selection; track manually.",
    prerequisites: { racialSpellLikeAbilityCasterLevel: 6 },
  },
  {
    id: "hover",
    name: "Hover",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "Flying: hover as a move action; then fly at half speed in any direction despite maneuverability. At turn start, if hovering, stay in place for a full-round action (no wing attacks; other limbs, breath weapons, and spells usable). Large or larger creatures hovering within 20 feet of the ground over loose debris create a 60-foot-radius hemispherical cloud that can snuff small open nonmagical flames. Vision clear to 10 feet; 15–20 ft.: concealment (20% miss chance); 25+ ft.: total concealment (50% miss chance); cannot be located by sight. To cast in cloud: Concentration check (DC 10 + half HD); effects manual.",
    prerequisites: { flySpeed: true },
  },
  {
    id: "improved-elemental-wild-shape",
    name: "Improved Elemental Wild Shape",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Wild shape into any elemental, not only the four standard types, in any size you can assume as an animal; gain all its extraordinary and supernatural abilities. Elemental wild shape access is checked; form limits remain manual.",
    prerequisites: {
      minimumCharacterLevel: 21,
      abilities: { wis: 25 },
      anyClassFeatures: epicElementalWildShapeFeatures,
    },
  },
  {
    id: "improved-favored-enemy",
    name: "Improved Favored Enemy",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Gain an additional +1 bonus on Bluff, Listen, Sense Motive, Spot, and Survival checks and weapon damage rolls against all favored enemies.",
    prerequisites: {
      minimumCharacterLevel: 21,
      minimumFavoredEnemies: 5,
    },
  },
  {
    id: "improved-natural-armor",
    name: "Improved Natural Armor",
    source: core35SourceId,
    sourceBook: monsterManualSourceBook,
    description:
      "Increase natural armor by 1. Requires natural armor and Constitution 13; confirm the natural armor manually. Each repeated selection adds another point.",
    prerequisites: { abilities: { con: 13 } },
  },
  {
    id: "improved-natural-attack",
    name: "Improved Natural Attack",
    source: core35SourceId,
    sourceBook: monsterManualSourceBook,
    description:
      "Increase one natural weapon's damage by one step on this progression: 1d2, 1d3, 1d4, 1d6, 1d8, 2d6, 3d6, 4d6, 6d6, 8d6, 12d6; for a 1d10 attack, use 1d10, 2d8, 3d8, 4d8, 6d8, 8d8, 12d8. Requires a natural weapon and base attack bonus +4; confirm the natural weapon manually, and apply each repeated selection to a different natural attack.",
    prerequisites: { baseAttackBonus: 4 },
  },
  {
    id: "improved-metamagic",
    name: "Improved Metamagic",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Reduce the spell-slot adjustment of metamagic feats by 1, to a minimum adjustment of +1; this has no effect on a feat with a +1 or no adjustment. Requires four metamagic feats and Spellcraft 30 ranks.",
    prerequisites: {
      minimumCharacterLevel: 21,
      minimumFeatsByCategory: { metamagic: 4 },
      skills: { Spellcraft: 30 },
    },
  },
  {
    id: "improved-sneak-attack",
    name: "Improved Sneak Attack",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Increase sneak attack damage by 1d6. Requires modeled sneak attack +8d6; unmodeled class-stacking sources remain manual.",
    prerequisites: {
      minimumCharacterLevel: 21,
      anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(8),
    },
  },
  {
    id: "improved-spell-capacity",
    name: "Improved Spell Capacity",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Gain one daily spell slot for a class in which you can cast its normal maximum spell level; choose any level up to one higher than that class's highest normal spell level. Gain any ability-based bonus spells for that level; casting spells from a slot requires an ability score of 10 + its level. Track the slot's class, level, and bonus spells manually.",
    prerequisites: {
      minimumCharacterLevel: 21,
      maximumNormalSpellLevel: true,
    },
  },
  {
    id: "improved-stunning-fist",
    name: "Improved Stunning Fist",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Increase the save DC of your Stunning Fist attacks by 2.",
    prerequisites: {
      minimumCharacterLevel: 21,
      abilities: { dex: 19, wis: 19 },
      feats: ["improved-unarmed-strike", "stunning-fist"],
    },
  },
  {
    id: "lasting-inspiration",
    name: "Lasting Inspiration",
    source: core35SourceId,
    sourceBook: "Dungeon Master's Guide (3.5)",
    description:
      "Bardic music inspiration effects that persist after singing last ten times as long. Requires the Bardic Music class feature and 25 ranks in any one Perform skill.",
    prerequisites: {
      minimumCharacterLevel: 21,
      classFeatures: ["Bardic Music"],
      anySkills: completeAdventurerAnyPerformRanks(25),
    },
  },
  {
    id: "awesome-blow",
    name: "Awesome Blow",
    source: core35SourceId,
    sourceBook: monsterManualSourceBook,
    description:
      "As a standard action, take -4 on a melee attack to knock a smaller corporeal opponent 10 feet and prone on a failed Reflex save (DC equals damage dealt). The push is a straight line; an obstructed target and obstacle each take 1d6 damage. Resolve the maneuver manually.",
    prerequisites: {
      abilities: { str: 25 },
      feats: ["power-attack", "improved-bull-rush"],
      minimumSize: "Large",
    },
    fighterBonus: true,
  },
  {
    id: "craft-construct",
    name: "Craft Construct",
    source: core35SourceId,
    sourceBook: monsterManualSourceBook,
    categories: ["item-creation"],
    description:
      "Create constructs whose prerequisites you meet. Creation takes 1 day per 1,000 gp of market price, costs 1/25 the price in XP and half the price in raw materials; repair up to 20 damage per day for 50 gp per point. Track creation and repairs manually.",
    prerequisites: {
      feats: ["craft-magic-arms-and-armor", "craft-wondrous-item"],
    },
  },
  {
    id: "clinging-breath",
    name: "Clinging Breath",
    source: core35SourceId,
    sourceBook: draconomiconSourceBook,
    description:
      "A damaging instantaneous breath weapon can deal half its damage again in the following round to creatures and objects it damaged; no second save. Affected targets can use a full-round action to attempt the original Reflex save (with +2 for rolling) to end the effect. Increase the breath weapon's recharge wait by 1 round (Monster Manual IV revision). Track damage, recharge, and removal saves manually.",
    prerequisites: {
      abilities: { con: 13 },
      rechargeableBreathWeapon: true,
    },
  },
  {
    id: "githyanki-battlecaster",
    name: "Githyanki Battlecaster",
    source: core35SourceId,
    sourceBook: monsterManualIVSourceBook,
    description:
      "Ignore arcane spell failure from light armor; this is included in the spellcasting summary. Medium or heavy armor and shields impose their normal chances. May be selected as a Fighter or Wizard bonus feat.",
    wizardBonus: true,
    prerequisites: {
      races: ["Githyanki"],
      arcaneSpellLevel: 2,
      baseAttackBonus: 3,
    },
    fighterBonus: true,
  },
  {
    id: "githyanki-dragonrider",
    name: "Githyanki Dragonrider",
    source: core35SourceId,
    sourceBook: monsterManualIVSourceBook,
    description:
      "Gain +2 Diplomacy with red dragons and +2 Ride while riding one; while mounted on a red dragon, both you and the mount gain +1 Reflex saves and +1 insight AC. The Diplomacy bonus stacks with the githyanki racial bonus. Apply these conditional bonuses manually.",
    prerequisites: {
      races: ["Githyanki"],
      skills: { Ride: 5 },
    },
    fighterBonus: true,
  },
  {
    id: "lingering-breath",
    name: "Lingering Breath",
    source: core35SourceId,
    sourceBook: draconomiconSourceBook,
    description:
      "A breath weapon can leave a one-round cloud of the same shape and size. Creatures entering it take half the normal damage or effect duration; normal saving throws still apply. Repeated nondamaging effects do not stack (use the longer duration). A creature in the original area avoids additional cloud effects if it leaves by the end of its next turn. Increase the breath weapon's recharge wait by 2 rounds (Monster Manual IV revision). Track cloud effects manually.",
    prerequisites: {
      abilities: { con: 15 },
      rechargeableBreathWeapon: true,
      feats: ["clinging-breath"],
    },
  },
  {
    id: "extra-shifter-trait",
    name: "Extra Shifter Trait",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    categories: ["shifter"],
    description:
      "Choose a second shifter trait; while shifting, gain its benefits except its temporary ability-score bonus. Choose and track the trait manually. Each shifter feat adds 1 round to shifting; every two shifter feats add one daily use. The Shifter race and shifting state are not modeled.",
    prerequisites: {
      races: ["Shifter"],
      featCategoryChoices: [{ anyOf: ["shifter"], count: 2 }],
    },
  },
  {
    id: "healing-factor",
    name: "Healing Factor",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    categories: ["shifter"],
    description:
      "When shifting ends, heal hit points equal to your character level, unless you died before it ended. Apply healing manually. Each shifter feat adds 1 round to shifting; every two shifter feats add one daily use. The Shifter race and shifting state are not modeled.",
    prerequisites: { races: ["Shifter"], abilities: { con: 13 } },
  },
  {
    id: "shifter-defense",
    name: "Shifter Defense",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    categories: ["shifter"],
    description:
      "While shifting, gain damage reduction 2/silver; apply it manually. Each shifter feat adds 1 round to shifting; every two shifter feats add one daily use. The Shifter race and shifting state are not modeled.",
    prerequisites: {
      races: ["Shifter"],
      featCategoryChoices: [{ anyOf: ["shifter"], count: 2 }],
    },
  },
  {
    id: "shifter-instincts",
    name: "Shifter Instincts",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    categories: ["shifter"],
    description:
      "Gain +1 on Listen, Sense Motive, and Spot checks and +2 on initiative; apply these bonuses manually. Each shifter feat adds 1 round to shifting; every two shifter feats add one daily use. The Shifter race and shifting state are not modeled.",
    prerequisites: { races: ["Shifter"] },
  },
  {
    id: "adamantine-body",
    name: "Adamantine Body",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    firstLevelOnly: true,
    description:
      "At character creation, replace warforged plating's armor bonus with +8 and gain DR 2/adamantine. Base land speed becomes 20 ft.; treat the plating as heavy armor with maximum Dex +1, armor check penalty -5, and 35% arcane spell failure. Druid spells and supernatural/spell-like Druid features are unavailable; heavy-armor-restricted class features do not function. Warforged races, plating, and these effects are not modeled; resolve them manually.",
    prerequisites: { races: ["Warforged", "Warforged Charger", "Warforged Scout"] },
  },
  {
    id: "improved-fortification",
    name: "Improved Fortification",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    description:
      "Become immune to sneak attacks and extra damage from critical hits, but spells of the Healing subschool can no longer heal you. Warforged races and these effects are not modeled; resolve them manually.",
    prerequisites: {
      races: ["Warforged", "Warforged Charger", "Warforged Scout"],
      baseAttackBonus: 6,
    },
  },
  {
    id: "mithral-body",
    name: "Mithral Body",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    firstLevelOnly: true,
    description:
      "At character creation, replace warforged plating's armor bonus with +5 and treat it as light armor with maximum Dex +5, armor check penalty -2, and 15% arcane spell failure. Druid spells and supernatural/spell-like Druid features are unavailable; light-armor-restricted class features do not function. Warforged races, plating, and these effects are not modeled; resolve them manually.",
    prerequisites: { races: ["Warforged", "Warforged Charger", "Warforged Scout"] },
  },
  {
    id: "mithral-fluidity",
    name: "Mithral Fluidity",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    description:
      "Increase Mithral Body's maximum Dexterity bonus to AC by 1 and reduce its armor check penalty by 1 for Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Sleight of Hand, and Tumble (not Swim). Repeatable; penalties cannot improve beyond 0. Warforged races, plating, and these effects are not modeled; apply each selection manually.",
    prerequisites: {
      races: ["Warforged", "Warforged Charger", "Warforged Scout"],
      feats: ["mithral-body"],
    },
  },
  {
    id: "powerful-charge",
    name: "Powerful Charge",
    source: core35SourceId,
    sourceBook: monsterManualIIISourceBook,
    description:
      "On a successful charge melee attack, deal extra damage by size: Medium 1d8, Large 2d6, Huge 3d6, Gargantuan 4d6, or Colossal 6d6. It does not work while mounted and applies to only one attack after a charge. Resolve manually.",
    prerequisites: {
      baseAttackBonus: 1,
      minimumSize: "Medium",
    },
    fighterBonus: true,
  },
  {
    id: "daunting-presence",
    name: "Daunting Presence",
    source: core35SourceId,
    sourceBook: monsterManualVSourceBook,
    description:
      "As a standard action, awe one intelligent opponent within 30 feet and line of sight. On a failed Will save (DC 10 + half character level + Cha modifier), it is shaken for 10 minutes; this has no effect on a creature already shaken. Resolve the target and condition manually.",
    prerequisites: {
      abilities: { cha: 13 },
      baseAttackBonus: 1,
    },
    fighterBonus: true,
  },
  {
    id: "battle-magic-tactics",
    name: "Battle Magic Tactics",
    source: core35SourceId,
    sourceBook: monsterManualVSourceBook,
    description:
      "When you cast a spell that allows a saving throw, the target gains a token after resolution unless spell resistance avoids the spell. Each token gives a cumulative -1 on saves against spells cast by feat users; all tokens vanish at round end. Track tokens and eligible casters manually.",
    prerequisites: {
      skills: { Spellcraft: 6 },
      arcaneCasterLevel: 3,
    },
  },
  {
    id: "kuo-toan-monasticism",
    name: "Kuo-Toan Monasticism",
    source: core35SourceId,
    sourceBook: monsterManualVSourceBook,
    description:
      "As a swift action, apply the kuo-toa's sticky substance to your hands. During a flurry of blows, if your first attack hits, one extra attack automatically hits. Use Hit Dice rather than character level for your Stunning Fist save DC. Track the substance and attack effects manually.",
    prerequisites: {
      races: ["Kuo-toa"],
      classFeatures: ["Flurry of Blows"],
    },
  },
  {
    id: "mind-shattering-strike",
    name: "Mind-Shattering Strike",
    source: core35SourceId,
    sourceBook: monsterManualVSourceBook,
    description:
      "Before an unarmed strike, expend a daily Stunning Fist use. If the next unarmed attack hits, the target must succeed on a Will save (DC 10 + half your Hit Dice + Wis modifier) or attack the closest non-kuo-toa on its next turn. Gain one additional daily Stunning Fist use; track uses and effects manually.",
    prerequisites: {
      races: ["Kuo-toa"],
      feats: ["kuo-toan-monasticism", "stunning-fist"],
      classFeatures: ["Flurry of Blows"],
    },
  },
  {
    id: "sense-quintessence",
    name: "Sense Quintessence",
    source: core35SourceId,
    sourceBook: monsterManualVSourceBook,
    description:
      "When using detect magic, also detect quintessence in its area: after 1 round learn presence, after 2 rounds learn source count and strongest source's size and potency, and after 3 rounds learn each source's location and potency. Track detection manually.",
    prerequisites: {
      detectMagicAccess: true,
      thoonAffiliation: true,
    },
  },
  {
    id: "multiattack",
    name: "Multiattack",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "Reduce the secondary natural-weapon attack penalty from -5 to -2, including when making a single secondary attack as an attack action or attack of opportunity; apply half your Strength bonus to secondary-weapon damage. Confirm manually that you have at least three natural attacks.",
  },
  {
    id: "multiweapon-fighting",
    name: "Multiweapon Fighting",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "For a creature with three or more hands, gain one extra attack per extra weapon and reduce multiple-weapon penalties by 2 with the primary hand and by 6 with off hands. This replaces Two-Weapon Fighting for creatures with more than two arms. Requires Dexterity 13; confirm the number of hands manually.",
    prerequisites: { abilities: { dex: 13 } },
  },
  {
    id: "overwhelming-critical",
    name: "Overwhelming Critical",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "With one manually selected melee weapon, deal +1d6 damage on a critical hit (+2d6 for a ×3 multiplier, +3d6 for ×4); creatures immune to critical hits are unaffected. Each selection applies to a different weapon; its Weapon Focus and Improved Critical prerequisites must match a proficient weapon.",
    prerequisites: {
      minimumCharacterLevel: 21,
      abilities: { str: 23 },
      feats: ["cleave", "great-cleave", "improved-critical", "power-attack", "weapon-focus"],
      weaponFeatChoiceGroups: [
        { featIds: ["improved-critical", "weapon-focus"] },
      ],
    },
  },
  {
    id: "planar-turning",
    name: "Planar Turning",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Use turning or rebuking against outsiders as well as undead. Outsiders have effective turn resistance equal to half their spell resistance, rounded down; turning/rebuking outcomes depend on your turning ability and the outsider's alignment. Resolve the ability and results manually.",
    prerequisites: {
      minimumCharacterLevel: 21,
      abilities: { wis: 25, cha: 25 },
      anyClassFeatures: turnOrRebukeUndeadFeatures,
    },
  },
  {
    id: "quicken-spell-like-ability",
    name: "Quicken Spell-Like Ability",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "Quicken one SLA at caster level 10+ (duplicated spell level ≤ floor(caster level / 2) - 4; casting time ≤1 full round): swift action, no AoO (3.5 revision in Monster Manual III). Use 3/day or lower normal limit; one per round, different SLA per selection. Track manually.",
    prerequisites: { racialSpellLikeAbilityCasterLevel: 10 },
  },
  {
    id: "snatch",
    name: "Snatch",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "On a claw/bite hit, grapple as with improved grab. If target is at least three sizes smaller, squeeze each round for automatic bite/claw damage; a mouth-held target gets no Reflex save against your breath weapon. Drop as a free action or fling 1d6 × 10 feet as a standard action; it takes 1d6 damage per 10 feet or falling damage, whichever is greater, if you are flying. Requires Huge size or larger; natural-weapon details remain manual.",
    prerequisites: { hugeOrLarger: true },
  },
  {
    id: "spell-knowledge",
    name: "Spell Knowledge",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Learn two new arcane spells of any level you can cast; this grants no additional spell slots.",
    prerequisites: {
      minimumCharacterLevel: 21,
      maximumNormalArcaneSpellLevel: true,
    },
  },
  {
    id: "terrifying-rage",
    name: "Terrifying Rage",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "While raging, enemies that can see you make a Will save opposed by your Intimidate check or become panicked (fewer HD than your character level) or shaken (up to twice your character level in HD) for 4d6 rounds; higher-HD enemies are unaffected. Requires Intimidate 25 ranks and a modeled rage feature with at least 5 daily uses; extra uses and other unmodeled sources remain manual.",
    prerequisites: {
      minimumCharacterLevel: 21,
      skills: { Intimidate: 25 },
      anyClassFeatures: ["Rage (5/day)", "Rage (6/day)"],
    },
  },
  {
    id: "wingover",
    name: "Wingover",
    source: core35SourceId,
    sourceBook: mm2SourceBook,
    description:
      "Once per round while flying, use a free action to turn up to 180 degrees regardless of maneuverability. The turn uses 10 feet of flying movement, and you cannot gain altitude that round (but may dive).",
    prerequisites: { flySpeed: true },
  },
  {
    id: "familiar-spell",
    name: "Familiar Spell",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Choose a spell you know of 8th level or lower for your familiar to cast once per day as a spell-like ability at your caster level. Spells with material costs over 1 gp or any XP cost are ineligible. Each selection grants a new spell or one additional daily use of the same spell; confirm that you have a familiar manually.",
    prerequisites: {
      minimumCharacterLevel: 21,
      minimumArcaneSpellcastingAbilityScore: 25,
    },
  },
  {
    id: "great-smiting",
    name: "Great Smiting",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideSourceBook,
    description:
      "Requires Charisma 25 and a smite ability. On a successful smite, add twice the appropriate level to damage instead of the normal amount; repeated selections stack.",
    prerequisites: {
      minimumCharacterLevel: 21,
      abilities: { cha: 25 },
      smiteAbility: true,
    },
  },
  {
    id: "flyby-breath",
    name: "Flyby Breath",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "While flying, use your breath weapon as a free action if you do nothing but move that turn; this cannot be combined with a Run action and grants no extra breath weapon uses. Flyby Attack is enforced; confirm active flight and non-draconian breath weapons manually.",
    prerequisites: {
      flySpeed: true,
      feats: ["flyby-attack"],
      draconianBreathWeapon: true,
    },
  },
  {
    id: "armor-proficiency-light",
    name: "Armor Proficiency (Light)",
    description:
      "While wearing light armor with which you are proficient, its armor check penalty applies only to Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Sleight of Hand, and Tumble checks; double the normal penalty applies on Swim checks.",
  },
  {
    id: "armor-proficiency-medium",
    name: "Armor Proficiency (Medium)",
    description:
      "Gain the same armor check penalty benefit as Armor Proficiency (Light) while wearing medium armor.",
    prerequisites: { feats: ["armor-proficiency-light"] },
  },
  {
    id: "armor-proficiency-heavy",
    name: "Armor Proficiency (Heavy)",
    description:
      "Gain the same armor check penalty benefit as Armor Proficiency (Light) while wearing heavy armor.",
    prerequisites: { feats: ["armor-proficiency-light", "armor-proficiency-medium"] },
  },
  {
    id: "shield-proficiency",
    name: "Shield Proficiency",
    description: "Use shields other than tower shields without nonproficiency penalties.",
  },
  {
    id: "improved-shield-bash",
    name: "Improved Shield Bash",
    description: "Retain your shield's AC bonus while making a shield bash.",
    prerequisites: { feats: ["shield-proficiency"] },
    fighterBonus: true,
  },
  {
    id: "simple-weapon-proficiency",
    name: "Simple Weapon Proficiency",
    description: "Use all simple weapons without the nonproficiency penalty.",
  },
  {
    id: "martial-weapon-proficiency",
    name: "Martial Weapon Proficiency",
    description: "Choose one martial weapon and use it without the nonproficiency penalty.",
    prerequisites: { baseAttackBonus: 1 },
  },
  {
    id: "honor-bound",
    name: "Honor-bound",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain a +2 circumstance bonus on a saving throw when failure would break a promise, oath, or sworn duty. After willingly breaking a promise or oath, the feat's benefit is suspended until atonement.",
  },
  {
    id: "hulking-brute",
    name: "Hulking Brute",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "For opposed rolls with size-based modifiers, count as Large if advantageous to you; also count as Large when determining whether size-based monster special attacks affect you. This feat can only be selected in a 1st-level feat slot.",
    prerequisites: { races: ["Half-ogre", "Minotaur"] },
    firstLevelOnly: true,
  },
  {
    id: "improved-draconian-breath-weapon",
    name: "Improved Draconian Breath Weapon",
    source: dragonlanceSourceId,
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
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain +8 on Will saves against dragons' frightful presence. The prerequisite of having taken damage from a dragon attack must be confirmed manually.",
    prerequisites: { baseAttackBonus: 6 },
  },
  {
    id: "reserves-of-strength",
    name: "Reserves of Strength",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When casting a spell, increase its caster level by 1, 2, or 3, affecting level-based variables including range, area, spell penetration, and dispelling; this can exceed the spell's normal level-based limits. You are stunned for that many rounds immediately after casting. If you are not subject to stunning effects, take 1d6, 3d6, or 5d6 damage instead.",
    prerequisites: { casterLevel: 1, feats: ["iron-will"] },
  },
  {
    id: "resist-dragonfear",
    name: "Resist Dragonfear",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Gain +4 on Will saves against dragons' frightful presence. The prerequisite of having encountered a dragon must be confirmed manually.",
    prerequisites: { baseAttackBonus: 3 },
  },
  {
    id: "spear-of-doom",
    name: "Spear of Doom",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When readying a spear or spearlike weapon (including a longspear, trident, halberd, or dwarven urgrosh) against a charge, gain +4 on the attack and deal double damage. Against a noncharging foe entering a threatened square, gain +4 on the attack only.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "spectacular-death-throes",
    name: "Spectacular Death Throes",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "Enhances your death throes: Baaz statues explode on the next round, subjecting each creature within 20 feet to a +10 ranged attack for 1d10 + Con damage; Kapak bursts deal 4d6 acid in a 20-ft. burst (Reflex DC 10 + half your HD + Con modifier halves); Bozak bursts deal 6d6 in a 20-ft. burst (same Reflex save, half damage; failed saves also knock creatures prone); Sivak slayers gain one negative level per 2 of your levels or HD (Fortitude DC 10 + half your HD + Con modifier negates); Aurak bursts deal 6d6 in a 20-ft. burst and repeat each turn for 5 rounds, each time 30 ft. in a random direction from the previous burst. Resolve manually.",
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
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "When using your breath weapon while flying (with a single move using Flyby Attack or a double move using Flyby Breath), extend the ground area in a straight line by up to half your fly speed, measured from the normal effect's center. Flyby Attack and Flyby Breath are enforced; confirm active flight and non-draconian breath weapons manually, and resolve the area calculation manually.",
    prerequisites: {
      flySpeed: true,
      feats: ["flyby-attack", "flyby-breath"],
      draconianBreathWeapon: true,
    },
  },
  {
    id: "tremendous-charge",
    name: "Tremendous Charge",
    source: dragonlanceSourceId,
    sourceBook: dragonlanceFeatSourceBook,
    description:
      "On a mounted charge with a heavy lance or similar weapon, you may use your mount's Strength score for the damage bonus and deal double damage as usual. After rolling attack and damage, the lance must succeed on a DC 8 Fortitude save or shatter. This feat also works while mounted on a flying creature.",
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
    description: "Create a scroll of any spell you know.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 1 },
  },
  {
    id: "craft-wand",
    name: "Craft Wand",
    description:
      "Create a wand of a spell you know that is 4th level or lower.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 5 },
  },
  {
    id: "brew-potion",
    name: "Brew Potion",
    description:
      "Create a potion of a spell you know that is 3rd level or lower and targets one or more creatures.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 3 },
  },
  {
    id: "craft-magic-arms-and-armor",
    name: "Craft Magic Arms and Armor",
    description: "Create magic weapons, armor, and shields.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 5 },
  },
  {
    id: "craft-contingent-spell",
    name: "Craft Contingent Spell",
    description:
      "Make known spells contingent; track conditions and crafting manually.",
    categories: ["item-creation"],
    ...completeArcaneSource,
    prerequisites: { casterLevel: 11 },
  },
  {
    id: "craft-rod",
    name: "Craft Rod",
    description: "Create magic rods.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 9 },
  },
  {
    id: "craft-staff",
    name: "Craft Staff",
    description: "Create magic staffs.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 12 },
  },
  {
    id: "craft-wondrous-item",
    name: "Craft Wondrous Item",
    description: "Create a wide variety of magic items.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 3 },
  },
  {
    id: "forge-ring",
    name: "Forge Ring",
    description: "Create magic rings.",
    categories: ["item-creation"],
    prerequisites: { casterLevel: 12 },
  },
  {
    id: "acrobatic",
    name: "Acrobatic",
    description: "+2 bonus on Jump and Tumble checks.",
    skillBonuses: { Jump: 2, Tumble: 2 },
  },
  {
    id: "agile",
    name: "Agile",
    description: "+2 bonus on Balance and Escape Artist checks.",
    skillBonuses: { Balance: 2, "Escape Artist": 2 },
  },
  {
    id: "alertness",
    name: "Alertness",
    description:
      "+2 bonus on Listen and Spot checks. A familiar grants its master this benefit while within arm's reach.",
    skillBonuses: { Listen: 2, Spot: 2 },
  },
  {
    id: "animal-affinity",
    name: "Animal Affinity",
    description: "+2 bonus on Handle Animal and Ride checks.",
    skillBonuses: { "Handle Animal": 2, Ride: 2 },
  },
  {
    id: "augment-summoning",
    name: "Augment Summoning",
    sourceBook: "Player's Handbook (3.5)",
    description:
      "Each creature you conjure with any summon spell gains a +4 enhancement bonus to Strength and Constitution for the duration of that spell.",
    prerequisites: { spellFocusSchools: ["Conjuration"] },
  },
  {
    id: "athletic",
    name: "Athletic",
    description: "+2 bonus on Climb and Swim checks.",
    skillBonuses: { Climb: 2, Swim: 2 },
  },
  {
    id: "blind-fight",
    name: "Blind-Fight",
    description:
      "In melee, reroll a failed concealment miss chance once. Invisible attackers gain no melee attack advantages: you retain your Dexterity bonus to AC, and they get no usual +2 bonus for being invisible (their ranged-attack bonuses still apply). Darkness or poor visibility reduces your speed to three-quarters normal instead of one-half. This feat has no effect against a creature affected by blink.",
    fighterBonus: true,
  },
  {
    id: "combat-casting",
    name: "Combat Casting",
    description:
      "+4 bonus on Concentration checks to cast a spell or use a spell-like ability while on the defensive, grappled, or pinned.",
  },
  {
    id: "combat-reflexes",
    name: "Combat Reflexes",
    description:
      "You may make additional attacks of opportunity per round equal to your Dexterity bonus, but only one per opportunity. You may also make attacks of opportunity while flat-footed. This does not allow a rogue to use Opportunist more than once per round.",
    fighterBonus: true,
  },
  {
    id: "combat-expertise",
    name: "Combat Expertise",
    description:
      "When using the attack or full attack action in melee, trade an attack penalty of up to 5 (no greater than your base attack bonus) for an equal dodge bonus to Armor Class until your next action.",
    prerequisites: { abilities: { int: 13 } },
    fighterBonus: true,
  },
  {
    id: "cleave",
    name: "Cleave",
    description:
      "Once per round, if your damage causes a creature to drop (usually by reducing it below 0 hp or killing it), you may immediately make a melee attack against another creature within reach with the same weapon and attack bonus. You cannot take a 5-foot step before this attack.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "deceitful",
    name: "Deceitful",
    description: "+2 bonus on Disguise and Forgery checks.",
    skillBonuses: { Disguise: 2, Forgery: 2 },
  },
  {
    id: "deft-hands",
    name: "Deft Hands",
    description: "+2 bonus on Sleight of Hand and Use Rope checks.",
    skillBonuses: { "Sleight of Hand": 2, "Use Rope": 2 },
  },
  {
    id: "diligent",
    name: "Diligent",
    description: "+2 bonus on Appraise and Decipher Script checks.",
    skillBonuses: { Appraise: 2, "Decipher Script": 2 },
  },
  {
    id: "dodge",
    name: "Dodge",
    description:
      "During your action, designate one opponent and gain a +1 dodge bonus to AC against that opponent; you can choose a new opponent on any action. You lose this bonus whenever you lose your Dexterity bonus to AC, and it stacks with other dodge bonuses.",
    prerequisites: { abilities: { dex: 13 } },
    fighterBonus: true,
  },
  {
    id: "endurance",
    name: "Endurance",
    description:
      "Gain +4 on Swim checks to resist nonlethal damage; Constitution checks to continue running, avoid nonlethal damage from forced marches or starvation/thirst, and hold your breath; and Fortitude saves against nonlethal damage from hot or cold and damage from suffocation. You can sleep in light or medium armor without becoming fatigued; resolve these situations manually.",
  },
  {
    id: "eschew-materials",
    name: "Eschew Materials",
    description:
      "Cast spells without material components costing 1 gp or less; component costs remain manual.",
  },
  {
    id: "extra-turning",
    name: "Extra Turning",
    description:
      "Each of your turning or rebuking abilities gains 4 additional uses per day. This feat can be taken multiple times; its effects stack.",
    prerequisites: {
      anyClassFeatures: turnOrRebukeCreatureFeatures,
    },
  },
  {
    id: "track",
    name: "Track",
    description:
      "Use Survival to find tracks or follow them for 1 mile per check, and check again when the trail becomes difficult. Track trails with DCs above 10; without this feat, you can follow only trails with DC 10 or lower. Move at half speed, normal speed with a -5 check penalty, or up to double speed with -20. DC modifiers depend on surface and conditions; after a failed check, retry after 1 hour outdoors or 10 minutes indoors. Resolve tracking manually.",
  },
  {
    id: "diehard",
    name: "Diehard",
    description:
      "At -1 to -9 hp, automatically stabilize. When first reduced below 0 hp, immediately choose whether to act as disabled or fall unconscious. While acting as disabled, take either a move or standard action, not both, and take 1 damage after a standard or other strenuous action; reaching -10 hp kills you.",
    prerequisites: { feats: ["endurance"] },
  },
  {
    id: "deflect-arrows",
    name: "Deflect Arrows",
    description:
      "Once per round, with a free hand and while aware and not flat-footed, deflect a ranged weapon that would hit you; this takes no action. Massive projectiles and spell-generated ranged attacks cannot be deflected.",
    prerequisites: {
      abilities: { dex: 13 },
      feats: ["improved-unarmed-strike"],
    },
    fighterBonus: true,
  },
  {
    id: "snatch-arrows",
    name: "Snatch Arrows",
    description:
      "Catch a weapon deflected with Deflect Arrows. A thrown weapon may be thrown back at its attacker immediately or kept for later. Requires one free hand; resolve the catch and return attack manually.",
    prerequisites: {
      abilities: { dex: 15 },
      feats: ["deflect-arrows", "improved-unarmed-strike"],
    },
    fighterBonus: true,
  },
  {
    id: "great-cleave",
    name: "Great Cleave",
    description:
      "Gain Cleave's immediate follow-up melee attack when you drop a creature, with no limit on qualifying attacks per round. Each attack uses the same weapon and attack bonus against another creature within reach; you cannot take a 5-foot step before it. Resolve each trigger and attack manually.",
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
    description:
      "Gain a second off-hand attack at a -5 penalty, in addition to the standard extra attack.",
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
    id: "leadership",
    name: "Leadership",
    description:
      "Consult the DM before selecting this feat and work with them to determine your cohort and followers. Use your Leadership score (character level + Charisma modifier, adjusted by other factors) and the Leadership table; cohort and follower management remain manual.",
    prerequisites: { minimumCharacterLevel: 6 },
  },
  {
    id: "greater-two-weapon-fighting",
    name: "Greater Two-Weapon Fighting",
    description: "Gain a third off-hand attack at a -10 penalty.",
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
    description:
      "Do not provoke an attack of opportunity from the defender when bull rushing, and gain +4 on the opposed Strength check.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-counterspell",
    name: "Improved Counterspell",
    description:
      "When counterspelling, use a spell of the same school that is one or more spell levels higher than the target spell. Counterspell resolution remains manual.",
  },
  {
    id: "improved-critical",
    name: "Improved Critical",
    description:
      "Double the threat range of one selected weapon. Each selection applies to a different weapon; this does not stack with other threat-range-increasing effects such as Keen or keen edge.",
    prerequisites: { baseAttackBonus: 8 },
    fighterBonus: true,
  },
  {
    id: "improved-disarm",
    name: "Improved Disarm",
    description:
      "Disarm without provoking an attack of opportunity or allowing the opponent to disarm you, and gain +4 on the opposed disarm attack roll. Resolve disarm attempts manually.",
    prerequisites: { abilities: { int: 13 }, feats: ["combat-expertise"] },
    fighterBonus: true,
  },
  {
    id: "improved-feint",
    name: "Improved Feint",
    description:
      "Feint in combat as a move action instead of a standard action; resolve the Bluff check manually.",
    prerequisites: { abilities: { int: 13 }, feats: ["combat-expertise"] },
    fighterBonus: true,
  },
  {
    id: "improved-grapple",
    name: "Improved Grapple",
    description:
      "Do not provoke an attack of opportunity when making the touch attack to start a grapple, and gain +4 on all grapple checks.",
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
    id: "improved-turning",
    name: "Improved Turning",
    description:
      "Turn or rebuke creatures as if one level higher in the class that grants the ability.",
    prerequisites: {
      anyClassFeatures: turnOrRebukeCreatureFeatures,
    },
  },
  {
    id: "improved-overrun",
    name: "Improved Overrun",
    description:
      "An overrun target cannot choose to avoid you; gain +4 on the Strength check to knock the target down. Source conflict: Table 5-1 lists no attack of opportunity, but the detailed feat entry does not, and the overrun procedure says the defender gets one. Confirm this with the DM.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-precise-shot",
    name: "Improved Precise Shot",
    description:
      "Ranged attacks ignore AC bonuses from less than total cover and miss chances from less than total concealment; total cover and concealment still apply. When attacking into a grapple, choose your target instead of rolling randomly.",
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
    description:
      "Do not provoke an attack of opportunity when attacking an object held or carried by another character, and gain +4 on the attack roll.",
    prerequisites: { abilities: { str: 13 }, feats: ["power-attack"] },
    fighterBonus: true,
  },
  {
    id: "improved-trip",
    name: "Improved Trip",
    description:
      "When attempting to trip unarmed, you do not provoke an attack of opportunity. Gain +4 on trip checks and immediately make a melee attack against an opponent you trip in melee. Resolve trip attempts manually.",
    prerequisites: { abilities: { int: 13 }, feats: ["combat-expertise"] },
    fighterBonus: true,
  },
  {
    id: "improved-unarmed-strike",
    name: "Improved Unarmed Strike",
    description:
      "You count as armed while unarmed, so armed opponents do not get attacks of opportunity when you attack them unarmed. You can still make attacks of opportunity against opponents who attack you unarmed. Your unarmed strikes can deal lethal or nonlethal damage, at your choice.",
    fighterBonus: true,
  },
  {
    id: "investigator",
    name: "Investigator",
    description: "+2 bonus on Search and Gather Information checks.",
    skillBonuses: { Search: 2, "Gather Information": 2 },
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
    description:
      "As a standard action, fire two arrows at one target within 30 feet using one attack roll at -4; add an arrow for every 5 points of base attack bonus above +6 (maximum four arrows at +16), with a cumulative -2 penalty per arrow after the second. Apply damage reduction separately to each arrow, precision damage only once, and critical damage only to the first arrow.",
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
    skillBonuses: { Spellcraft: 2, "Use Magic Device": 2 },
  },
  {
    id: "mobility",
    name: "Mobility",
    description:
      "+4 dodge bonus to AC against attacks of opportunity caused by moving out of or within a threatened area. You lose this bonus whenever you lose your Dexterity bonus to AC, and it stacks with other dodge bonuses.",
    prerequisites: { abilities: { dex: 13 }, feats: ["dodge"] },
    fighterBonus: true,
  },
  {
    id: "mounted-archery",
    name: "Mounted Archery",
    description:
      "Halve ranged-attack penalties while mounted: -2 during a mount's double move and -4 during a run; apply manually.",
    prerequisites: { feats: ["mounted-combat"], skills: { Ride: 1 } },
    fighterBonus: true,
  },
  {
    id: "mounted-combat",
    name: "Mounted Combat",
    description:
      "Once per round when your mount is hit in combat, you may attempt a Ride check as a reaction to negate the hit; it succeeds if the check result exceeds the opponent's attack roll.",
    prerequisites: { skills: { Ride: 1 } },
    fighterBonus: true,
  },
  {
    id: "natural-spell",
    name: "Natural Spell",
    description:
      "Cast spells in wild shape, providing verbal and somatic components and using material components and focuses you possess, even if melded into your form. You still cannot speak or use magic items your form could not ordinarily use; resolve spellcasting in form manually.",
    prerequisites: {
      abilities: { wis: 13 },
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "negotiator",
    name: "Negotiator",
    description: "+2 bonus on Diplomacy and Sense Motive checks.",
    skillBonuses: { Diplomacy: 2, "Sense Motive": 2 },
  },
  {
    id: "apprentice",
    name: "Apprentice",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "At 1st level, choose a mentor type. Gain its two associated skills as class skills, two bonus skill points, and the mentor's additional benefits. Track the mentor, skill choices, tithe, favors, and apprenticeship obligations manually.",
    firstLevelOnly: true,
  },
  {
    id: "mentor",
    name: "Mentor",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "Take a lower-level NPC as an apprentice and gain the benefits of mentorship. Track the apprentice, mentor score, favors, and mentorship benefits manually.",
    prerequisites: {
      feats: ["apprentice"],
      graduatedFromApprenticeship: true,
      mentorSkillPrerequisites: true,
    },
  },
  {
    id: "business-savvy",
    name: "Business Savvy",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "Gain +2 on business profit checks and a +1 luck bonus on attack rolls, saving throws, and checks when resolving business-related events. Track business rules and these situational bonuses manually.",
    prerequisites: { feats: ["negotiator"] },
  },
  {
    id: "favored-in-guild",
    name: "Favored in Guild",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "Choose one skill associated with your guild; while you remain a member, gain +2 competence on checks with it and the guild's fringe benefit. Track guild membership, skill choice, and benefit manually.",
    prerequisites: { guildMembership: true },
  },
  {
    id: "guildmaster",
    name: "Guildmaster",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "Gain +2 competence on each guild-associated skill, waive guild dues, receive guildhouse benefits, and once per day exchange your Leadership cohort for an eligible guild cohort. Track guild-specific benefits and weekly duties manually.",
    prerequisites: {
      feats: ["favored-in-guild", "leadership"],
      guildmasterPrerequisites: true,
    },
  },
  {
    id: "truebond",
    name: "Truebond",
    source: core35SourceId,
    sourceBook: dungeonMastersGuideIISourceBook,
    description:
      "Gain the special ability from your last completed bonding ritual while the bonded item is in your possession, and use locate object at will (caster level equals character level) to locate it. Track the ritual ability and item manually.",
    prerequisites: {
      minimumCharacterLevel: 6,
      bondingRitual: true,
    },
  },
  {
    id: "nimble-fingers",
    name: "Nimble Fingers",
    description: "+2 bonus on Disable Device and Open Lock checks.",
    skillBonuses: { "Disable Device": 2, "Open Lock": 2 },
  },
  {
    id: "point-blank-shot",
    name: "Point Blank Shot",
    description:
      "+1 bonus on attack and damage rolls with ranged weapons at ranges of up to 30 feet.",
    fighterBonus: true,
  },
  {
    id: "far-shot",
    name: "Far Shot",
    description:
      "Increase projectile weapon range increments by 50% and thrown weapon range increments by 100%.",
    prerequisites: { feats: ["point-blank-shot"] },
    fighterBonus: true,
  },
  {
    id: "power-attack",
    name: "Power Attack",
    description:
      "Before making attacks for a round, subtract a chosen amount (no more than your base attack bonus) from all melee attack rolls and add it to melee damage until your next turn. Double the damage bonus when using a two-handed weapon or a one-handed weapon in two hands. A double weapon used with only one end in two hands counts as two-handed; when using both ends, it counts as one-handed and light. Light weapons receive no damage bonus, but unarmed strikes and natural weapons do.",
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
    skillBonuses: { Bluff: 2, Intimidate: 2 },
  },
  {
    id: "quick-draw",
    name: "Quick Draw",
    description:
      "Draw a weapon as a free action instead of a move action, draw a hidden weapon as a move action, and throw weapons at your full normal rate of attacks.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "rapid-reload",
    name: "Rapid Reload",
    description:
      "Choose a proficient hand, light, or heavy crossbow. Reload it as a free action (hand or light) or a move action (heavy); reloading still provokes an attack of opportunity. With a hand or light crossbow, you can fire as many times in a full attack as with a bow. Each selection applies to a different crossbow type.",
    fighterBonus: true,
  },
  {
    id: "rapid-shot",
    name: "Rapid Shot",
    description:
      "During a full attack with a ranged weapon, gain one extra attack at your highest base attack bonus; all attacks that round take a -2 penalty.",
    prerequisites: { abilities: { dex: 13 }, feats: ["point-blank-shot"] },
    fighterBonus: true,
  },
  {
    id: "ride-by-attack",
    name: "Ride-By Attack",
    description:
      "On a mounted charge, move and attack as a standard charge, then continue straight along the charge path; your total movement for the round cannot exceed twice your mount's speed. Neither you nor your mount provokes an attack of opportunity from the opponent you attack. Track movement manually.",
    prerequisites: { feats: ["mounted-combat"], skills: { Ride: 1 } },
    fighterBonus: true,
  },
  {
    id: "run",
    name: "Run",
    description:
      "Run at five times your speed in light, medium, or no armor while carrying no more than a medium load; heavy armor or a heavy load reduces this to four times your speed. Retain your Dexterity bonus to AC while running, and gain +4 on Jump checks after a running start.",
  },
  {
    id: "self-sufficient",
    name: "Self-Sufficient",
    description: "+2 bonus on Heal and Survival checks.",
    skillBonuses: { Heal: 2, Survival: 2 },
  },
  {
    id: "shot-on-the-run",
    name: "Shot on the Run",
    description:
      "When using the attack action with a ranged weapon, split your move action to move before and after the attack; total movement cannot exceed your speed. Normal movement and ranged attacks can provoke attacks of opportunity; track movement manually.",
    prerequisites: {
      abilities: { dex: 13 },
      baseAttackBonus: 4,
      feats: ["dodge", "mobility", "point-blank-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "skill-focus",
    name: "Skill Focus",
    description:
      "Choose one skill and gain +3 on checks involving it. You can take this feat multiple times for different skills; the bonuses do not stack for the same skill.",
  },
  {
    id: "stealthy",
    name: "Stealthy",
    description: "+2 bonus on Hide and Move Silently checks.",
    skillBonuses: { Hide: 2, "Move Silently": 2 },
  },
  {
    id: "spell-mastery",
    name: "Spell Mastery",
    description:
      "Choose known Wizard spells equal in number to your Intelligence modifier. You can prepare them without your spellbook; each selection of this feat masters a different set.",
    prerequisites: { classLevels: { wizard: 1 } },
  },
  {
    id: "spell-focus",
    name: "Spell Focus",
    description:
      "Choose a school; its spells get +1 save DC. Repeat for other schools; same-school bonuses don't stack.",
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
    description:
      "Increase all variable numeric effects by 50%; saving throws, opposed rolls, and spells without random variables are unaffected. Slot +2.",
    categories: ["metamagic"],
  },
  {
    id: "heighten-spell",
    name: "Heighten Spell",
    description:
      "Cast a spell as a higher effective level (up to 9th); its save DC and other spell-level-dependent effects use that level, and it uses a spell slot of the heightened level.",
    categories: ["metamagic"],
  },
  {
    id: "maximize-spell",
    name: "Maximize Spell",
    description:
      "Maximize all variable numeric effects; saving throws, opposed rolls, and spells without random variables are unaffected. Slot +3.",
    categories: ["metamagic"],
  },
  {
    id: "extend-spell",
    name: "Extend Spell",
    description:
      "Double a spell's duration; concentration, instantaneous, and permanent durations are unaffected. Slot +1.",
    categories: ["metamagic"],
  },
  {
    id: "enlarge-spell",
    name: "Enlarge Spell",
    description:
      "Double a spell's range if it is close, medium, or long; other ranges are unaffected. Slot +1.",
    categories: ["metamagic"],
  },
  {
    id: "quicken-spell",
    name: "Quicken Spell",
    description:
      "Cast an eligible prepared spell as a swift action without provoking an attack of opportunity; only one quickened spell per round, sharing your swift-action limit. Spells with casting times longer than 1 full-round action and spontaneously cast spells cannot be quickened; slot +4. Uses Complete Arcane's updated action type.",
    categories: ["metamagic"],
  },
  {
    id: "silent-spell",
    name: "Silent Spell",
    description:
      "Cast a spell without verbal components; spells without verbal components are unaffected, and bard spells cannot use this feat. Slot +1.",
    categories: ["metamagic"],
  },
  {
    id: "still-spell",
    name: "Still Spell",
    description:
      "Cast a spell without somatic components; spells without somatic components are unaffected. Slot +1.",
    categories: ["metamagic"],
  },
  {
    id: "widen-spell",
    name: "Widen Spell",
    description:
      "Double all numeric area measurements of a burst, emanation, line, or spread spell; other area shapes are unaffected. Slot +3.",
    categories: ["metamagic"],
  },
  {
    id: "arcane-defense",
    name: "Arcane Defense",
    description:
      "Choose a Spell Focus school; +3 on saves vs. its spells. Repeat for other schools; track manually.",
    ...completeArcaneSource,
    prerequisites: { anyFeats: ["spell-focus"] },
  },
  {
    id: "black-lore-of-moil",
    name: "Black Lore of Moil",
    description:
      "Necromancy spells deal +1d6 negative energy per two spell levels (minimum +1d6); saves still halve this bonus. A 25 gp runebone per bonus die limits the damage. Uses the normal slot.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { casterLevel: 7, spellFocusSchools: ["Necromancy"] },
  },
  {
    id: "chain-spell",
    name: "Chain Spell",
    description:
      "A single-target spell beyond touch arcs to one secondary per caster level (max 20, each within 30 ft.). Secondary damage is halved (Reflex half); nondamaging saves use DC -4. Slot +3.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "cooperative-spell",
    name: "Cooperative Spell",
    description:
      "Adjacent casters casting the same spell gain +2 save DC and +1 CL checks vs. SR; each extra caster adds +1 to both. Normal slot.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "delay-spell",
    name: "Delay Spell",
    description:
      "Delay an area, personal, or touch spell 1-5 rounds; decide targets and effects when cast, resolve on trigger. Slot +3.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "fortify-spell",
    name: "Fortify Spell",
    description:
      "Gain +2 on checks vs. spell resistance per slot level above actual level (minimum +1); spells without spell resistance are unaffected.",
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "explosive-spell",
    name: "Explosive Spell",
    description:
      "In cones, cylinders, lines, or bursts, failed Reflex pushes creatures beyond the nearest edge, prone, and 1d6 damage per 10 ft. moved; obstacles may add 1d6. No AoO. Slot +2.",
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "persistent-spell",
    name: "Persistent Spell",
    description:
      "Fixed- or personal-range spells last 24 hours; instantaneous or discharged effects are ineligible. Slot +6.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { feats: ["extend-spell"] },
  },
  {
    id: "repeat-spell",
    name: "Repeat Spell",
    description:
      "At the start of your next turn, recast from its original location, affecting the same area or ranged target within 30 ft. Touch spells are ineligible. Slot +3.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "sculpt-spell",
    name: "Sculpt Spell",
    description:
      "Reshape an area spell as a 10-ft-radius, 30-ft-high cylinder, 40-ft cone, four 10-ft cubes, 20-ft-radius spread, or 120-ft line. Slot +1.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "sanctum-spell",
    name: "Sanctum Spell",
    description:
      "Effective level +1 in your sanctum and -1 outside (including DCs); normal slot. Max diameter 20 ft./CL; 3-month residence and 7-day setup.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "split-ray",
    name: "Split Ray",
    description:
      "Create one extra ray with a separate attack and normal effect; target the same or another creature. Rays are simultaneous; targets must be within 30 ft. of each other. Slot +2.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "sudden-empower",
    name: "Sudden Empower",
    description:
      `${suddenMetamagicPrefix}Empower Spell to a spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "sudden-extend",
    name: "Sudden Extend",
    description:
      `${suddenMetamagicPrefix}Extend Spell to a spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "sudden-maximize",
    name: "Sudden Maximize",
    description:
      `${suddenMetamagicPrefix}Maximize Spell to a spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "sudden-quicken",
    name: "Sudden Quicken",
    description:
      `${suddenMetamagicPrefix}Quicken Spell to a spell${suddenMetamagicSuffix}; the spell is cast as a swift action.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: {
      feats: [
        "quicken-spell",
        "sudden-empower",
        "sudden-extend",
        "sudden-maximize",
        "sudden-silent",
        "sudden-still",
      ],
    },
  },
  {
    id: "sudden-silent",
    name: "Sudden Silent",
    description:
      `${suddenMetamagicPrefix}Silent Spell to a spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "sudden-still",
    name: "Sudden Still",
    description:
      `${suddenMetamagicPrefix}Still Spell to a spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "sudden-widen",
    name: "Sudden Widen",
    description:
      `${suddenMetamagicPrefix}Widen Spell to an eligible area spell${suddenMetamagicSuffix}.`,
    categories: ["metamagic"],
    ...completeArcaneSource,
  },
  {
    id: "transdimensional-spell",
    name: "Transdimensional Spell",
    description:
      "Affects incorporeal, Ethereal, Plane of Shadow, and extradimensional creatures. Direct targets must be perceived. Slot +1.",
    categories: ["metamagic"],
    ...completeDivineSource,
  },
  {
    id: "twin-spell",
    name: "Twin Spell",
    description:
      "Duplicate the spell simultaneously on the same target or area with identical choices; resolve each effect separately. Slot +4.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 1 } },
  },
  {
    id: "born-of-the-three-thunders",
    name: "Born of the Three Thunders",
    description:
      "Electricity/sonic HP-damage spells split evenly, gain both descriptors; targets save Fortitude (stunned), then Reflex (prone) at spell DC; you are dazed 1 round. Normal slot.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: {
      skills: { "Knowledge (nature)": 4 },
      feats: ["energy-substitution-electricity"],
    },
  },
  {
    id: "nonlethal-substitution",
    name: "Nonlethal Substitution",
    description:
      "Choose acid, cold, electricity, or fire; matching spells deal nonlethal damage, not object damage or ignition. Slot +1.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: {
      skills: { "Knowledge (arcana)": 5 },
      minimumFeatsByCategory: { metamagic: 1 },
    },
  },
  {
    id: "lord-of-the-uttercold",
    name: "Lord of the Uttercold",
    description:
      "Requires Knowledge (planes) 9, Energy Substitution (cold), and cold-descriptor spellcasting (manual). Split damage evenly; cold resistance/immunity affects only cold; negative energy may heal undead. Normal slot.",
    categories: ["metamagic"],
    ...completeArcaneSource,
    prerequisites: {
      skills: { "Knowledge (the planes)": 9 },
      feats: ["energy-substitution-cold"],
    },
  },
  {
    id: "ranged-spell-specialization",
    name: "Ranged Spell Specialization",
    description:
      "Ranged touch spells: +2 HP damage on first hit each round within 30 ft.; manual.",
    ...completeArcaneSource,
    prerequisites: {
      casterLevel: 4,
      feats: ["weapon-focus"],
    },
  },
  {
    id: "touch-spell-specialization",
    name: "Touch Spell Specialization",
    description:
      "Melee touch spells: +2 HP damage; multi-touch only on first hit. Manual.",
    ...completeArcaneSource,
    prerequisites: {
      casterLevel: 4,
      feats: ["weapon-focus"],
    },
  },
  {
    id: "arcane-mastery",
    name: "Arcane Mastery",
    description:
      "Take 10 on caster level checks, even under stress; resolve manually.",
    ...completeArcaneSource,
    prerequisites: { arcaneSpellcastingOrRacialSpellLikeAbility: true },
  },
  {
    id: "arcane-preparation",
    name: "Arcane Preparation",
    description:
      "Prepare known spells in daily slots for metamagic without longer casting time; track manually.",
    ...completeArcaneSource,
    prerequisites: { anyClassLevels: { bard: 1, sorcerer: 1 } },
  },
  {
    id: "battle-caster",
    name: "Battle Caster",
    description:
      "If an ability negates arcane spell failure, wear heavier armor. Bard ignores medium armor's failure for Bard spells only; shields and other class spells still fail. Verify other abilities manually.",
    ...completeArcaneSource,
    prerequisites: { classLevels: { bard: 1 } },
  },
  {
    id: "acidic-splatter",
    categories: ["reserve"],
    name: "Acidic Splatter",
    description:
      "While you have an acid spell of 2nd level or higher available, make a ranged touch attack with an acid orb: range 5 feet per level of your highest-level available acid spell and damage 1d6 per spell level. Gain +1 competence caster level on acid spells. Track the reserved spell and attack manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "aquatic-breath",
    categories: ["reserve"],
    name: "Aquatic Breath",
    description:
      "While you have a water spell of 3rd level or higher available, breathe normally in air and water without activation. Gain +1 competence caster level on water spells. Track the reserved spell manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "battlecaster-defense",
    name: "Battlecaster Defense",
    description:
      "Tactical feat: after defensively casting a touch spell and delivering it to a threatening enemy, gain +2 on touch attacks against that foe next turn; defensive casting in consecutive rounds grants +10 to the next defensive-casting Concentration check; after defensive casting, movement next turn avoids opportunity attacks from foes that threatened you then. Track maneuvers manually.",
    ...completeMageSource,
    prerequisites: {
      baseAttackBonus: 1,
      casterLevel: 1,
      feats: ["combat-casting"],
    },
  },
  {
    id: "battlecaster-offense",
    name: "Battlecaster Offense",
    description:
      "Tactical feat: after a spell deals damage to a foe, gain +1 on your first melee attack against that foe next round; after a melee attack, gain +1 to the save DC of your first spell against that foe next round. Track the tactical maneuvers manually.",
    ...completeMageSource,
    prerequisites: {
      baseAttackBonus: 1,
      skills: { Spellcraft: 4 },
      prerequisiteAlternatives: [
        { feats: ["combat-casting"] },
        { classFeatures: ["Warmage Edge"] },
      ],
    },
  },
  {
    id: "blade-of-force",
    categories: ["reserve"],
    name: "Blade of Force",
    description:
      "As a swift action, touch a melee weapon or one piece of ammunition. Its next attack before the end of your next turn deals +1 damage per level of your highest-level available force spell and ignores incorporeal miss chance; a miss wastes the benefit. Gain +1 competence caster level on force spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "borne-aloft",
    categories: ["reserve"],
    name: "Borne Aloft",
    description:
      "Once per round as a move action, fly up to 30 feet with perfect maneuverability while you have an air spell of 5th level or higher available. Begin and end on solid support; otherwise you fall. This does not work in heavy armor or with a heavy load. Gain +1 competence caster level on air spells. Track the reserved spell and movement manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 5 },
  },
  {
    id: "captivating-melody",
    name: "Captivating Melody",
    description:
      "Swift action before a spell: make a Perform check (DC 15 + spell level). On a success, spend one Bardic Music use to give the next enchantment or illusion spell you cast this round +2 save DC; failure still spends the use. Only spells from the class granting Bardic Music qualify; track manually.",
    ...completeMageSource,
    prerequisites: {
      classFeatures: ["Bardic Music"],
      arcaneCasterLevel: 1,
    },
  },
  {
    id: "clap-of-thunder",
    categories: ["reserve"],
    name: "Clap of Thunder",
    description:
      "While you have a sonic spell of 3rd level or higher available, make a melee touch attack as a standard action, dealing 1d6 sonic damage per level of your highest-level available sonic spell; the target must save or be deafened for 1 round. Gain +1 competence caster level on sonic spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "clutch-of-earth",
    categories: ["reserve"],
    name: "Clutch of Earth",
    description:
      "While you have an earth spell of 2nd level or higher available, use a standard action to reduce a landbound creature's land, burrow, and climb speeds by 5 feet per level of your highest-level available earth spell (minimum speed 5 feet) for 1 round. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "delay-potion",
    name: "Delay Potion",
    description:
      "Drink a potion and delay its effect for up to your Constitution modifier hours (minimum 1). Activate it as a swift action; an unactivated potion is wasted when time expires. Only one potion can be delayed at a time; track manually.",
    ...completeMageSource,
    prerequisites: { skills: { "Knowledge (arcana)": 1 } },
  },
  {
    id: "fiery-burst",
    categories: ["reserve"],
    name: "Fiery Burst",
    description:
      "While you have a fire spell of 2nd level or higher available, create a 5-foot-radius burst of fire at a range of 30 feet as a standard action, dealing 1d6 fire damage per level of your highest-level available fire spell (Reflex save halves). Gain +1 competence caster level on fire spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "fey-heritage",
    name: "Fey Heritage",
    description: "Gain a +3 bonus on Will saves against enchantment effects.",
    ...completeMageSource,
    prerequisites: { alignment: { nonLawful: true } },
  },
  {
    id: "fey-legacy",
    name: "Fey Legacy",
    description:
      "Gain confusion, dimension door, and summon nature's ally V as spell-like abilities, each usable once per day at caster level equal to character level. Track uses manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonLawful: true },
      minimumCharacterLevel: 9,
      feats: ["fey-heritage"],
    },
  },
  {
    id: "fey-power",
    name: "Fey Power",
    description:
      "Increase caster level and save DCs for enchantment spells and warlock invocations by 1; apply manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonLawful: true },
      feats: ["fey-heritage"],
    },
  },
  {
    id: "fey-presence",
    name: "Fey Presence",
    description:
      "Gain charm monster, deep slumber, and disguise self as spell-like abilities, each usable once per day at caster level equal to character level. Track uses manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonLawful: true },
      minimumCharacterLevel: 6,
      feats: ["fey-heritage"],
    },
  },
  {
    id: "fey-skin",
    name: "Fey Skin",
    description:
      "Gain damage reduction against non-cold-iron weapons equal to 1 plus the number of feats with Fey Heritage as a prerequisite, including Fey Skin. It stacks with reduction from type, subtype, race, or class, but not other sources; calculate manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonLawful: true },
      feats: ["fey-heritage"],
    },
  },
  {
    id: "fiendish-heritage",
    name: "Fiendish Heritage",
    description:
      "Gain +4 on Fortitude saves against poison and +1 on saves against spells or other effects produced by good creatures.",
    ...completeMageSource,
    prerequisites: { alignment: { nonGood: true } },
  },
  {
    id: "drowning-glance",
    categories: ["reserve"],
    name: "Drowning Glance",
    description:
      "As a standard action, target a living creature within 30 feet while you have a water spell of 4th level or higher available. It becomes exhausted for 1 round, or fatigued instead on a successful Fortitude save. Whether it saves or not, that creature is immune to this feat for 24 hours; creatures that breathe water or do not breathe are immune. Track the reserved spell and immunity manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 4 },
  },
  {
    id: "energy-gestalt",
    name: "Energy Gestalt",
    description:
      "Tactical feat: damage a target with energy spells in two consecutive rounds to use one of three combinations: acid then fire nauseates living targets (Fortitude save instead sickens); cold then sonic deals +50% sonic damage to objects and constructs; cold then electricity slows living targets (Fortitude save instead fatigues). Track spell sequence, saves, and durations manually.",
    ...completeMageSource,
    prerequisites: {
      casterLevel: 3,
      spellFocusSchools: ["Evocation"],
    },
  },
  {
    id: "face-changer",
    categories: ["reserve"],
    name: "Face-Changer",
    description:
      "As a full-round action while you have a glamer spell of 3rd level or higher available, alter your appearance as disguise self for 1 minute per level of your highest-level available glamer spell. Gain +1 competence caster level on glamer spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "favored-magic-foe",
    name: "Favored Magic Foe",
    description:
      "Choose a creature type tied to one of your favored enemies or to a Knowledge skill in which you have 6 ranks (humanoids and outsiders also require a subtype). Gain +1 on caster-level checks to overcome its spell resistance, and it takes -1 on saves against your spells and spell-like abilities. Track the type choice and bonuses manually; this feat can be taken multiple times for different types.",
    ...completeMageSource,
    prerequisites: {
      prerequisiteAlternatives: [
        {
          anySkills: {
            "Knowledge (arcana)": 6,
            "Knowledge (architecture and engineering)": 6,
            "Knowledge (dungeoneering)": 6,
            "Knowledge (geography)": 6,
            "Knowledge (history)": 6,
            "Knowledge (local)": 6,
            "Knowledge (nature)": 6,
            "Knowledge (nobility and royalty)": 6,
            "Knowledge (religion)": 6,
            "Knowledge (the planes)": 6,
          },
        },
        { classFeatures: ["Favored Enemy"] },
      ],
    },
  },
  {
    id: "fiendish-legacy",
    name: "Fiendish Legacy",
    description:
      "Gain teleport (self and up to 50 pounds of objects), summon monster V (fiendish creatures only), and unholy blight as spell-like abilities, each usable once per day at caster level equal to character level. Track uses manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonGood: true },
      minimumCharacterLevel: 9,
      feats: ["fiendish-heritage"],
    },
  },
  {
    id: "fiendish-power",
    name: "Fiendish Power",
    description:
      "Increase caster level and save DCs for evil spells and warlock invocations by 1; apply manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonGood: true },
      feats: ["fiendish-heritage"],
    },
  },
  {
    id: "fiendish-presence",
    name: "Fiendish Presence",
    description:
      "Gain cause fear, detect thoughts, and suggestion as spell-like abilities, each usable once per day at caster level equal to character level. Track uses manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonGood: true },
      minimumCharacterLevel: 6,
      feats: ["fiendish-heritage"],
    },
  },
  {
    id: "fiendish-resistance",
    name: "Fiendish Resistance",
    description:
      "Gain resistance to acid and fire, each equal to three times the number of feats with Fiendish Heritage as a prerequisite. It stacks with resistance from type, subtype, race, or class, but not spells or magic items; calculate manually.",
    ...completeMageSource,
    prerequisites: {
      alignment: { nonGood: true },
      feats: ["fiendish-heritage"],
    },
  },
  {
    id: "hurricane-breath",
    categories: ["reserve"],
    name: "Hurricane Breath",
    description:
      "While you have an air spell of 2nd level or higher available, use a standard action to attempt a bull rush against one creature within 30 feet, rolling 1d20 + the level of your highest-level available air spell opposed by its Strength check. On success, push it 5 feet. Gain +1 competence caster level on air spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "invisible-needle",
    categories: ["reserve"],
    name: "Invisible Needle",
    description:
      "As a standard action while you have a force spell of 3rd level or higher available, make a ranged attack with a force needle (not a ranged touch attack). It has a range of 5 feet per level of that spell, deals 1d4 damage per level of your highest-level available force spell, and can hit incorporeal creatures. Gain +1 competence caster level on force spells. Track the reserved spell and attack manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "magic-device-attunement",
    name: "Magic Device Attunement",
    description:
      "After successfully activating an item with Use Magic Device, attune to it as a free action. For 24 hours, activate it without further Use Magic Device checks; attuning another item ends the previous attunement. Track manually.",
    ...completeMageSource,
    prerequisites: { skills: { "Use Magic Device": 1 } },
  },
  {
    id: "magic-sensitive",
    categories: ["reserve"],
    name: "Magic Sensitive",
    description:
      "As a standard action while you have a divination spell of 3rd level or higher available, sense magical auras as detect magic, with a range of 5 feet per level of your highest-level available divination spell. Gain +1 competence caster level on divination spells. Track the reserved spell and detection manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "master-of-undeath",
    name: "Master of Undeath",
    description:
      "Create one undead creature outside your normal controlled-undead limit; you control it for a number of days equal to your caster level, after which it becomes hostile. Only one such creature can be controlled at a time; track manually.",
    ...completeMageSource,
    prerequisites: { skills: { "Knowledge (religion)": 5 } },
  },
  {
    id: "melodic-casting",
    name: "Melodic Casting",
    description:
      "Use Perform instead of Concentration whenever a check is required to cast a spell or use a spell-like ability. You can cast spells and activate command-word or spell-completion items while using Bardic Music; concentration-based music abilities still require a standard action. Track manually.",
    ...completeMageSource,
    prerequisites: {
      classFeatures: ["Bardic Music"],
      skills: { Perform: 4, Spellcraft: 4 },
    },
  },
  {
    id: "metamagic-spell-trigger",
    name: "Metamagic Spell Trigger",
    description:
      "Apply one known metamagic feat to a spell from a spell-trigger item you activate, spending one extra charge per level adjustment. The modified spell cannot exceed 9th level; if the item cannot supply enough charges, activation fails and the action is wasted. Track charges and effects manually.",
    ...completeMageSource,
    prerequisites: {
      anySkills: { "Use Magic Device": 15, Spellcraft: 15 },
      minimumFeatsByCategory: { metamagic: 1 },
    },
  },
  {
    id: "ranged-recall",
    name: "Ranged Recall",
    description:
      "When you miss with a spell or spell-like ability ranged attack against a target within 30 feet, spend a swift action to reroll the attack at -5. Usable three times per day; track uses manually.",
    ...completeMageSource,
    prerequisites: {
      skills: { Spellcraft: 4 },
      feats: ["point-blank-shot"],
      weaponFocusChoices: ["Ray"],
    },
  },
  {
    id: "retributive-spell",
    name: "Retributive Spell",
    description:
      "Metamagic: a creature-targeting spell has no immediate effect. If a melee attack deals you damage within 24 hours (or before you next prepare or ready spells), cast it at that attacker as an immediate action; it can affect only that attacker. Only one can be pending; a second cancels the first. Preparing or readying spells also ends it. Slot +1; track manually.",
    categories: ["metamagic"],
    ...completeMageSource,
  },
  {
    id: "metamagic-vigor",
    name: "Metamagic Vigor",
    description:
      "Tactical feat: casting spells with the same metamagic feat in consecutive rounds grants +1 caster level to the second; using different metamagic feats grants +1 save DC. Only one maneuver applies per round, and only actual metamagic feats count; track manually.",
    ...completeMageSource,
    prerequisites: { minimumFeatsByCategory: { metamagic: 2 } },
  },
  {
    id: "residual-magic",
    name: "Residual Magic",
    description:
      "Tactical feat: after casting from your daily allotment, a same-spell scroll or wand cast next round can use your caster level and save DC. After casting a spell with metamagic, apply one of its metamagic effects to the same spell next round without raising its level; that casting cannot pass the effect on. Item-granted metamagic does not qualify; track manually.",
    ...completeMageSource,
    prerequisites: {
      skills: { Spellcraft: 12 },
      minimumFeatsByCategory: { metamagic: 1 },
    },
  },
  {
    id: "dimensional-jaunt",
    categories: ["reserve"],
    name: "Dimensional Jaunt",
    description:
      "As a standard action while you have a teleportation spell of 4th level or higher available, teleport up to 5 feet per level of your highest-level available teleportation spell. Gain +1 competence caster level on teleportation spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 4 },
  },
  {
    id: "dimensional-reach",
    categories: ["reserve"],
    name: "Dimensional Reach",
    description:
      "As a standard action while you have a 3rd-level or higher summoning spell available, transport a visible, unattended item into your hand. Range is up to 5 feet per level and item weight up to 2 pounds per level of your highest-level available summoning spell. Gain +1 competence caster level on summoning spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "magic-disruption",
    categories: ["reserve"],
    name: "Magic Disruption",
    description:
      "As an immediate action while you have an abjuration spell of 3rd level or higher available, force a creature within 30 feet that is casting a spell to attempt a Concentration check (DC 15 + the level of your highest-level available abjuration spell). On failure, reduce that spell's save DC and caster level by 2 (minimum caster level 1). Gain +1 competence caster level on abjuration spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "minor-shapeshift",
    categories: ["reserve"],
    name: "Minor Shapeshift",
    description:
      "As a swift action while you have a polymorph spell of 4th level or higher available, choose +2 melee damage, +2 competence on Balance/Climb/Jump/Swim, a primary 1d6 claw attack (Medium), +5 feet to one movement mode, or temporary hit points equal to your HD. The benefit lasts a number of rounds equal to the highest-level available polymorph spell; a new choice replaces it. Gain +1 competence caster level on polymorph spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 4 },
  },
  {
    id: "mystic-backlash",
    categories: ["reserve"],
    name: "Mystic Backlash",
    description:
      "As a standard action while you have an abjuration spell of 5th level or higher available, make a melee touch attack that does not provoke attacks of opportunity. On a hit, each spell the target casts for a number of rounds equal to the highest-level available abjuration spell deals it damage equal to that spell's level; a successful Will save reduces the duration to 1 round. Gain +1 competence caster level on abjuration spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 5 },
  },
  {
    id: "sickening-grasp",
    categories: ["reserve"],
    name: "Sickening Grasp",
    description:
      "While you have a necromancy spell of 3rd level or higher available, a melee touch attack sickens a living target for rounds equal to the level of your highest-level available necromancy spell (Fortitude save reduces this to 1 round). Gain +1 competence caster level on necromancy spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "storm-bolt",
    categories: ["reserve"],
    name: "Storm Bolt",
    description:
      "While you have an electricity spell of 3rd level or higher available, create a line of electricity that deals 1d6 damage per level of your highest-level available electricity spell. Gain +1 competence caster level on electricity spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "touch-of-distraction",
    categories: ["reserve"],
    name: "Touch of Distraction",
    description:
      "As a standard action while you have an enchantment spell of 3rd level or higher available, impose a -2 penalty on one creature's next attack roll or Reflex save; the creature must be within 30 feet. If unused within a number of rounds equal to the highest-level available enchantment spell, the effect ends; uses do not stack. Gain +1 competence caster level on enchantment spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "wind-guided-arrows",
    categories: ["reserve"],
    name: "Wind-Guided Arrows",
    description:
      "As an immediate action while you have an air spell of 3rd level or higher available, adjust a thrown or projectile weapon in flight by +2 or -2 on its attack roll; you cannot change its target. The target must be within 10 feet per level of your highest-level available air spell. Gain +1 competence caster level on air spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "alacritous-cogitation",
    name: "Alacritous Cogitation",
    description:
      "Once per day, leave an arcane spell slot open during preparation to cast any arcane spell you know of the same or lower level from that slot as a full-round action. Track the open slot and daily use manually.",
    ...completeMageSource,
    prerequisites: { classLevels: { wizard: 1 } },
  },
  {
    id: "rapid-metamagic",
    name: "Rapid Metamagic",
    description:
      "When applying a metamagic feat to a spontaneously cast spell, cast it in its normal casting time instead of adding time. Track manually.",
    ...completeMageSource,
    prerequisites: {
      anyClassLevels: { bard: 1, mystic: 1, sorcerer: 1 },
      skills: { Spellcraft: 12 },
    },
  },
  {
    id: "cloudy-conjuration",
    name: "Cloudy Conjuration",
    description:
      "When you cast a conjuration spell, you may create a 5-foot-radius cloud of sickening smoke in your space, an adjacent space, or your target's space or an adjacent space. It lasts 1 round, obscures like fog cloud, and sickens living creatures inside; poison-immune creatures and creatures you summon are unaffected. Track the effect manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Conjuration"],
    },
  },
  {
    id: "dazzling-illusion",
    name: "Dazzling Illusion",
    description:
      "When you cast an illusion spell, you may dazzle all enemies within 30 feet for 1 round; blind creatures are immune. Track the effect manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Illusion"],
    },
  },
  {
    id: "energy-abjuration",
    name: "Energy Abjuration",
    description:
      "When you cast an abjuration spell, you may gain energy resistance equal to 5 × (1 + the spell's level). It lasts for the spell's duration or until it prevents the first acid, cold, electricity, fire, or sonic damage, then ends. Track the resistance manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Abjuration"],
    },
  },
  {
    id: "fearsome-necromancy",
    wizardBonus: "Necromancy",
    name: "Fearsome Necromancy",
    description:
      "Any foe required to save against a necromancy spell you cast is shaken for 1 round, regardless of the save result. This is a mind-affecting fear effect; track it manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Necromancy"],
    },
  },
  {
    id: "insightful-divination",
    name: "Insightful Divination",
    description:
      "When you cast a divination spell, gain an insight bonus equal to its level + 1 on initiative checks and on the first saving throw you make within 24 hours. After that save, both bonuses end; a later divination spell lets you keep the existing bonus or take the new one. Track manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Divination"],
    },
  },
  {
    id: "metamagic-school-focus",
    name: "Metamagic School Focus",
    description:
      "Choose a school for which you have Spell Focus or in which you specialize. Three times per day, reduce by 1 the metamagic level adjustment for a feat applied to a spell of that school. If you prepare spells, no more than three reduced-cost spells may be prepared at once. This feat can be taken multiple times for different schools; track uses and prepared spells manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: [
        "Abjuration",
        "Conjuration",
        "Divination",
        "Enchantment",
        "Evocation",
        "Illusion",
        "Necromancy",
        "Transmutation",
      ],
    },
  },
  {
    id: "piercing-evocation",
    name: "Piercing Evocation",
    description:
      "When an evocation spell deals energy damage, you may convert 10 points of its acid, cold, electricity, fire, or sonic damage to untyped damage that ignores resistance and immunity. If the spell deals multiple energy types, choose the conversion after rolling damage. Track manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Evocation"],
    },
  },
  {
    id: "toughening-transmutation",
    wizardBonus: "Transmutation",
    name: "Toughening Transmutation",
    description:
      "When you cast a transmutation spell, you may grant yourself or one target damage reduction 5/magic for 1 round; if it already has damage reduction, increase that reduction by 5 instead. Track the effect manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Transmutation"],
    },
  },
  {
    id: "unsettling-enchantment",
    wizardBonus: "Enchantment",
    name: "Unsettling Enchantment",
    description:
      "Any foe required to save against an enchantment spell you cast takes a -2 penalty on attack rolls and AC for 1 round, regardless of the save result. This is a mind-affecting effect; track it manually.",
    ...completeMageSource,
    prerequisites: {
      spellFocusOrWizardSpecializationSchools: ["Enchantment"],
    },
  },
  {
    id: "defending-spirit",
    name: "Defending Spirit",
    description:
      "When you use an initiative reroll from your Watchful Spirit class feature, gain a +2 dodge bonus to AC for the encounter. You also gain one additional initiative reroll from that feature. Track rerolls and the AC bonus manually.",
    ...completeMageSource,
    prerequisites: { classFeatures: ["Watchful Spirit"] },
  },
  {
    id: "elemental-adept",
    name: "Elemental Adept",
    description:
      "Choose one spell in your spellbook from the element selected for your Elemental Mastery class feature. You can spontaneously cast it by sacrificing a prepared spell of equal or higher level, and can change the chosen spell when you gain a level. Track the spell choice and effect manually.",
    ...completeMageSource,
    prerequisites: { classFeatures: ["Elemental Mastery"] },
  },
  {
    id: "hasty-spirit",
    name: "Hasty Spirit",
    description:
      "When you use an initiative reroll from your Watchful Spirit class feature, you can take one extra move action on one turn during the encounter. You also gain one additional initiative reroll from that feature. Track rerolls and the extra action manually.",
    ...completeMageSource,
    prerequisites: { classFeatures: ["Watchful Spirit"] },
  },
  {
    id: "vengeful-spirit",
    name: "Vengeful Spirit",
    description:
      "When you use an initiative reroll from your Watchful Spirit class feature, the first creature to damage you during the encounter immediately takes half the damage it dealt as untyped damage, unaffected by damage reduction, resistance, or immunity. You also gain one additional initiative reroll from that feature. Track rerolls and damage manually.",
    ...completeMageSource,
    prerequisites: { classFeatures: ["Watchful Spirit"] },
  },
  {
    id: "mage-slayer",
    name: "Mage Slayer",
    description:
      `+1 on Will saves. Threatened spellcasters cannot cast defensively (automatic Concentration failure; they know this). ${completeArcaneCasterLevelPenalty}`,
    ...completeArcaneSource,
    prerequisites: { baseAttackBonus: 3, skills: { Spellcraft: 2 } },
  },
  {
    id: "pierce-magical-concealment",
    name: "Pierce Magical Concealment",
    description:
      `Ignore magical miss chances, including mirror images; nonmagical concealment remains. ${completeArcaneCasterLevelPenalty}`,
    ...completeArcaneSource,
    prerequisites: {
      abilities: { con: 13 },
      feats: ["blind-fight", "mage-slayer"],
    },
  },
  {
    id: "pierce-magical-protection",
    name: "Pierce Magical Protection",
    description:
      `Standard-action melee attack ignores spell-granted AC bonuses, including trigger/completion items; damage dispels them. ${completeArcaneCasterLevelPenalty}`,
    ...completeArcaneSource,
    prerequisites: { abilities: { con: 13 }, feats: ["mage-slayer"] },
  },
  {
    id: "winter-s-blast",
    categories: ["reserve"],
    name: "Winter's Blast",
    description:
      "While you have a cold spell of 2nd level or higher available, create a 15-foot cone of cold dealing 1d4 cold damage per level of your highest-level available cold spell (Reflex save halves). Gain +1 competence caster level on cold spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "sunlight-eyes",
    categories: ["reserve"],
    name: "Sunlight Eyes",
    description:
      "As a swift action while you have a light spell of 2nd level or higher available, see normally through shadowy illumination, darkness, and magical shadow or darkness for 1 round, to a range of 10 feet per level of your highest-level available light spell. Gain +1 competence caster level on light spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "summon-elemental",
    categories: ["reserve"],
    name: "Summon Elemental",
    description:
      "While you have a summoning spell of 4th level or higher available, summon a Small elemental of your choice within 30 feet as if with summon monster. It lasts 1 round per level of your highest-level available summoning spell. Gain +1 competence caster level on summoning spells. Track the reserved spell and elemental manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 4 },
  },
  {
    id: "shadow-veil",
    name: "Shadow Veil",
    description:
      "As a standard action while you have a darkness spell of 2nd level or higher available, target one creature within 30 feet. On a failed Will save, it treats all other creatures and objects as having concealment and takes -5 on Spot checks for 1 round. Gain +1 competence caster level on darkness spells. Track the reserved spell and effect manually.",
    ...completeMageSource,
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "somatic-weaponry",
    name: "Somatic Weaponry",
    description:
      "Use a weapon or similarly sized item held in one or both hands to perform somatic components. This does not allow somatic components while grappling; track manually.",
    ...completeMageSource,
    prerequisites: {
      skills: { Concentration: 5, Spellcraft: 5 },
    },
  },
  {
    id: "obtain-familiar",
    name: "Obtain Familiar",
    description:
      "Gain a sorcerer/wizard familiar. Acquiring one takes 24 hours and costs 100 gp; arcane spellcasting levels stack for its abilities. Track it manually.",
    ...completeArcaneSource,
    prerequisites: {
      skills: { "Knowledge (arcana)": 4 },
      arcaneCasterLevel: 3,
    },
  },
  {
    id: "extra-slot",
    name: "Extra Slot",
    description:
      "Gain a fixed daily slot up to one level below your highest spell level; track class/level.",
    ...completeArcaneSource,
    prerequisites: { casterLevel: 4 },
  },
  {
    id: "extra-spell",
    name: "Extra Spell",
    description:
      "Learn one spell up to one level below your highest spell level; track class and spell manually.",
    ...completeArcaneSource,
    prerequisites: { casterLevel: 3 },
  },
  {
    id: "extra-spell-secret",
    name: "Extra Spell Secret",
    description:
      "Choose one known spell to be permanently enlarged, extended, stilled, or silenced without changing its level. The choice is permanent; this feat can be taken multiple times for additional modifications. Track the spell and modification manually.",
    ...completeArcaneSource,
    prerequisites: {
      classFeatures: ["Spell Secret"],
      spellLevel: 2,
    },
  },
  {
    id: "extra-edge",
    name: "Extra Edge",
    description:
      "Increase your Warmage Edge damage bonus by +1, plus an additional +1 per four Warmage levels. Record Warmage level 4 or higher manually; apply the resulting bonus to damaging spells manually.",
    ...completeArcaneSource,
    prerequisites: { warmageLevelFour: true },
  },
  {
    id: "extra-invocation",
    name: "Extra Invocation",
    description:
      "Learn one additional invocation from your available list, one grade below your highest grade. You can take this feat multiple times; later selections can add any invocation grade up to one below the highest grade you can use. Track invocation choices manually.",
    ...completeArcaneSource,
    prerequisites: { classFeatures: ["Lesser Invocations"] },
  },
  {
    id: "guardian-spirit",
    name: "Guardian Spirit",
    description:
      "Your Watchful Spirit lets you reroll initiative twice per day and any saving throw once per day. Use each reroll immediately after the initial check; track uses manually.",
    ...completeArcaneSource,
    prerequisites: { classFeatures: ["Watchful Spirit"] },
  },
  {
    id: "draconic-heritage",
    name: "Draconic Heritage",
    categories: ["draconic"],
    description:
      "Choose one dragon kind from the Complete Arcane Draconic Heritage table; the choice is permanent, and half-dragons must match their dragon parent. Gain its listed skill as a class skill and a bonus on saves against sleep, paralysis, and effects with its energy type equal to your number of draconic feats. Track the dragon, skill, energy type, and bonuses manually.",
    ...completeArcaneSource,
    prerequisites: { classLevels: { sorcerer: 1 } },
  },
  {
    id: "draconic-breath",
    name: "Draconic Breath",
    categories: ["draconic"],
    description:
      "As a standard action, expend an arcane spell to create a 30-foot cone (fire or cold) or 60-foot line (acid or electricity) of your heritage energy, dealing 2d6 damage per spell level (Reflex half; DC 10 + spell level + Cha modifier). Track the shape and damage manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-claw",
    name: "Draconic Claw",
    categories: ["draconic"],
    description:
      "Gain claws that deal damage by size (Small 1d4, Medium 1d6, Large 1d8). In a round when you cast a spell with a 1-standard-action casting time, make one swift-action claw attack against a foe you threaten. Track the natural attack manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-flight",
    name: "Draconic Flight",
    categories: ["draconic"],
    description:
      "After casting an arcane spell with a 1-standard-action casting time, gain a fly speed of 10 feet per spell level for the remainder of your turn. Track the movement manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-power",
    name: "Draconic Power",
    categories: ["draconic"],
    description:
      "Gain +1 caster level and +1 save DC for arcane spells with the energy descriptor matching your Draconic Heritage. Energy Substitution spells qualify when their resulting energy type matches. Apply the bonuses manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-presence",
    name: "Draconic Presence",
    categories: ["draconic"],
    description:
      "When you cast an arcane spell, opponents within 10 feet with fewer Hit Dice than you become shaken for a number of rounds equal to the spell level (Will negates; DC 10 + spell level + Cha modifier). A successful save grants 24-hour immunity; dragons, creatures with Intelligence 3 or lower, and already-shaken creatures are unaffected. Track the fear effect manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-resistance",
    name: "Draconic Resistance",
    categories: ["draconic"],
    description:
      "Gain resistance to the energy type of your Draconic Heritage equal to three times the number of draconic feats you have, including later feats. Calculate the resistance manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-skin",
    name: "Draconic Skin",
    categories: ["draconic"],
    description:
      "Increase your natural armor by 1; track the bonus manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["draconic-heritage"] },
  },
  {
    id: "draconic-legacy",
    name: "Draconic Legacy",
    categories: ["draconic"],
    description:
      "Add the spells associated with your Draconic Heritage to your spells known at the levels specified by Complete Arcane. Track the heritage-based spell choices manually.",
    ...completeArcaneSource,
    prerequisites: { minimumFeatsByCategory: { draconic: 4 } },
  },
  {
    id: "reckless-wand-wielder",
    name: "Reckless Wand Wielder",
    description:
      "When using a wand, spend one additional charge to use it at caster level +2 for level-dependent effects; spend no more than one extra charge per use.",
    ...completeArcaneSource,
    prerequisites: {
      skills: { "Use Magic Device": 1 },
      feats: ["craft-wand"],
    },
  },
  ...completeArcaneInnateSpellLikeFeats,
  {
    id: "heighten-spell-like-ability",
    name: "Heighten Spell-Like Ability",
    description:
      "Each selection heightens a different SLA by +2 spell levels (max 9th), up to 3/day or its lower normal limit. Meet CL/level limits; track choice, DC, and uses manually.",
    ...completeArcaneSource,
    prerequisites: { racialSpellLikeAbilityCasterLevel: 6 },
  },
  {
    id: "innate-spell",
    name: "Innate Spell",
    description:
      "Cast a known spell as an at-will SLA (once/round), expending a slot 8 levels higher. XP/focus costs apply; costly materials need a focus worth 50x cost. Losing the slot disables it; clerics can't convert to cure/inflict. Repeat for other spells; track manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["quicken-spell", "silent-spell", "still-spell"] },
  },
  {
    id: "double-wand-wielder",
    name: "Double Wand Wielder",
    description:
      "Full-round action: wield and activate a wand in each hand; each use of the secondary wand costs 2 charges. Resolve manually.",
    ...completeArcaneSource,
    prerequisites: { feats: ["craft-wand", "two-weapon-fighting"] },
  },
  {
    id: "wandstrike",
    name: "Wandstrike",
    description:
      "Melee touch attack (standard action) with a wand; spend 1 charge for 1d6 damage and wand activation (no extra damage). Rays/targeted spells affect it; area spells originate in its space. No effect-only spells; resolve manually.",
    ...completeArcaneSource,
    prerequisites: { skills: { "Use Magic Device": 4 } },
  },
  ...completeDivinePracticedSpellcasterFeats,
  {
    id: "extra-wild-shape",
    name: "Extra Wild Shape",
    description: "Gain two additional daily wild-shape uses; track them as part of the existing wild-shape pool.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "grizzlys-claws",
    name: "Grizzly's Claws",
    description: "Spend a wild-shape use to grow claws for 1 hour; each unarmed/natural strike deals claw damage and uses improved critical threat range as specified by the source.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "lions-pounce",
    name: "Lion's Pounce",
    description: "Spend a wild-shape use to gain a pounce for 1 minute, allowing a full attack at the end of a charge.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "oaken-resilience",
    name: "Oaken Resilience",
    description: "Spend a wild-shape use to gain plant traits and damage reduction 3/slashing for 1 hour.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeDivineLargeWildShapeFeatures },
  },
  {
    id: "serpents-venom",
    name: "Serpent's Venom",
    description: "Spend a wild-shape use to gain a poisonous bite for 1 minute; apply the poison save and ability damage from the source manually.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "swim-like-a-fish",
    name: "Swim Like a Fish",
    description: "Spend a wild-shape use to breathe underwater and gain a 40-foot swim speed plus +8 Swim for 1 hour.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "wolverines-rage",
    name: "Wolverine's Rage",
    description: "After taking damage, spend a wild-shape use as a free action to rage for 5 rounds: +2 Strength, +2 Constitution, -2 AC.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: { anyClassFeatures: completeAdventurerWildShapeFeatures },
  },
  {
    id: "pious-defense",
    name: "Pious Defense",
    description: "Faith feat. Spend 1 faith point to halve damage that would reduce you to 0 hit points or below. Begins with 4 faith points; campaign awards remain manual.",
    categories: ["faith"],
    ...completeDivineSource,
    prerequisites: { skills: { "Knowledge (religion)": 2 } },
  },
  {
    id: "pious-soul",
    name: "Pious Soul",
    description: "Faith feat. Spend a faith point to add 1d6 to an attack, save, or check after seeing the roll; multiple points may be spent. Begins with 4 faith points.",
    categories: ["faith"],
    ...completeDivineSource,
    prerequisites: { skills: { "Knowledge (religion)": 2 } },
  },
  {
    id: "pious-spellsurge",
    name: "Pious Spellsurge",
    description: "Faith feat. Spend 2 faith points to add 1d6 to a spell's save DC or caster level for that casting. Begins with 4 faith points.",
    categories: ["faith"],
    ...completeDivineSource,
    prerequisites: { skills: { "Knowledge (religion)": 4 } },
  },
  {
    id: "bonus-domain",
    name: "Bonus Domain",
    description: "Epic feat. Gain an additional domain and its granted power/spells. Repeat for different deity domains.",
    categories: ["domain", "epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { wis: 21 }, divineSpellLevel: 9 },
  },
  {
    id: "epic-devotion",
    name: "Epic Devotion",
    description: "Epic feat. Gain +4 on saves against spells of a chosen alignment component your deity cannot accept; track the one-time choice and repeat prohibition.",
    categories: ["epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { wis: 21 }, feats: ["iron-will"], alignmentMatchesDeity: true },
  },
  {
    id: "holy-strike",
    name: "Holy Strike",
    description: "Epic feat. Your weapons deal an additional +2d6 against evil and count as blessed/holy; does not stack with an already holy weapon.",
    categories: ["epic"],
    ...completeDivineSource,
    prerequisites: { smiteAbility: true, alignment: { component: "Good" } },
  },
  {
    id: "magical-beast-wild-shape",
    name: "Magical Beast Wild Shape",
    description: "Epic wild feat. Use wild shape to assume magical-beast forms and gain their supernatural abilities within normal size limits.",
    categories: ["wild", "epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { wis: 25 }, skills: { "Knowledge (nature)": 27 }, feats: ["beast-wild-shape"], anyClassFeatures: completeDivineLargeWildShapeFeatures },
  },
  {
    id: "negative-energy-burst",
    name: "Negative Energy Burst",
    description: "Epic divine feat. Spend a rebuke/command attempt to inflict negative levels with a 60-foot negative-energy burst.",
    categories: ["divine", "epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { cha: 25 }, anyClassFeatures: ["Rebuke Undead", "Turn or Rebuke Undead"], alignment: { component: "Evil" } },
  },
  {
    id: "positive-energy-aura",
    name: "Positive Energy Aura",
    description: "Epic feat. Automatically turn or destroy undead within 15 feet based on effective turning level.",
    categories: ["epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { cha: 25 }, anyClassFeatures: ["Turn Undead", "Turn or Rebuke Undead"] },
  },
  {
    id: "spectral-strike",
    name: "Spectral Strike",
    description: "Epic feat. Your attacks deal normal rather than 50% damage to incorporeal creatures.",
    categories: ["epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { wis: 19 }, anyClassFeatures: turnOrRebukeUndeadFeatures },
  },
  {
    id: "undead-mastery",
    name: "Undead Mastery",
    description: "Epic divine feat. Command up to ten times your level in HD of undead.",
    categories: ["divine", "epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { cha: 21 }, anyClassFeatures: ["Rebuke Undead", "Turn or Rebuke Undead"] },
  },
  {
    id: "unholy-strike",
    name: "Unholy Strike",
    description: "Epic feat. Your weapons deal +2d6 against good and count as unholy/blessed by evil; does not stack with an unholy weapon.",
    categories: ["epic"],
    ...completeDivineSource,
    prerequisites: { smiteAbility: true, alignment: { component: "Evil" } },
  },
  {
    id: "zone-of-animation",
    name: "Zone of Animation",
    description: "Epic divine feat. Spend a rebuke/command attempt to animate nearby corpses up to the normal command limit.",
    categories: ["divine", "epic"],
    ...completeDivineSource,
    prerequisites: { abilities: { cha: 25 }, feats: ["undead-mastery"], anyClassFeatures: ["Rebuke Undead", "Turn or Rebuke Undead"] },
  },
  {
    id: "arcane-disciple",
    name: "Arcane Disciple",
    description:
      "Choose a deity's cleric domain and an arcane class; add that domain's spells to the class list. Spell save DCs use Wisdom, Wisdom must be at least 10 + spell level, and you may prepare or cast no more than one selected domain spell per level per day. The domain, arcane class, spell learning, and daily limits are tracked manually. Additional selections must use different domains available from the same deity.",
    ...completeDivineSource,
    prerequisites: {
      skills: { "Knowledge (religion)": 4, Spellcraft: 4 },
      arcaneCasterLevel: 1,
      alignmentMatchesDeity: true,
    },
  },
  {
    id: "augment-healing",
    name: "Augment Healing",
    description:
      "Conjuration (healing) spells you cast heal 2 additional hit points per spell level; apply the bonus manually.",
    ...completeDivineSource,
    prerequisites: { skills: { Heal: 4 } },
  },
  {
    id: "domain-focus",
    name: "Domain Focus",
    description:
      "Choose an accessed domain. Gain +1 caster level for its spells, including caster-level checks to overcome spell resistance and level-based variables; this does not apply when casting the spell from a nondomain slot. Repeat selections for different domains; bonuses do not stack. Track the domain choice and effects manually.",
    ...completeDivineSource,
    prerequisites: { minimumDomains: 1 },
  },
  {
    id: "empower-turning",
    name: "Empower Turning",
    description:
      "Multiply the result of your turning damage roll by 1.5 after adding your cleric level and Charisma modifier; calculate the total manually.",
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "improved-smiting",
    name: "Improved Smiting",
    description:
      "Smite attacks count as aligned for overcoming damage reduction and deal +1d6 damage to foes of a specific alignment. Use the smite's associated alignment when present; otherwise choose a component of your alignment, and target foes of the opposite alignment. The choice cannot change, and losing that alignment component suppresses the benefit. Apply target alignment, choices, and damage manually.",
    ...completeDivineSource,
    prerequisites: {
      abilities: { cha: 13 },
      anyClassFeatures: completeWarriorSmiteFeatures,
    },
  },
  {
    id: "disciple-of-the-sun",
    name: "Disciple of the Sun",
    description:
      "When turning undead, spend two turn attempts instead of one to destroy the undead rather than turn them. Track turning attempts and results manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      alignment: { component: "Good" },
    },
  },
  {
    id: "divine-metamagic",
    name: "Divine Metamagic",
    description:
      "Choose a metamagic feat you already have; apply it to known divine spells by spending one turn/rebuke attempt plus one per spell-level increase, without increasing the slot. This follows the supplied errata. Repeat for different metamagic feats; track choices and uses manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      minimumFeatsByCategory: { metamagic: 1 },
    },
  },
  {
    id: "divine-spell-power",
    name: "Divine Spell Power",
    description:
      "Spend a turn/rebuke attempt as a free action and make a turning check with a +3 bonus; use the result as a modifier to caster level for the next divine spell cast that round. The effect expires at the start of your next turn; resolve the check and caster-level change manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      divineSpellLevel: 1,
    },
  },
  {
    id: "quicken-turning",
    name: "Quicken Turning",
    description:
      "Turn or rebuke undead as a free action, but still only once per round.",
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "glorious-weapons",
    name: "Glorious Weapons",
    description:
      "Spend a turn/rebuke attempt as a standard action to align the melee weapons, including natural weapons, of allies in a 60-foot burst: good with positive energy or evil with negative energy. The alignment lasts until the end of your next turn; resolve targets and damage reduction manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "domain-spontaneity",
    name: "Domain Spontaneity",
    description:
      "Choose a domain you access. Convert prepared divine spells into spells from that domain by expending a prepared spell of equal or higher level and one daily turn attempt. Repeat for different domains; track the domain choice and uses manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      minimumDomains: 1,
    },
  },
  {
    id: "elemental-smiting",
    name: "Elemental Smiting",
    description:
      "Once per round, spend a turn attempt as a free action when making a melee attack against a creature you could turn because of its elemental subtype. On a hit, add damage equal to your cleric level; on a miss, the attempt is lost. The subtype and combat effects remain manual.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: { turnsElementalSubtype: true },
  },
  {
    id: "elemental-healing",
    name: "Elemental Healing",
    description:
      "Spend a rebuke attempt as a standard action to heal creatures with an elemental subtype you could rebuke in a 60-foot burst for 1d8 damage per two cleric levels. Track the subtype, targets, and healing manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: { rebukesElementalSubtype: true },
  },
  {
    id: "profane-boost",
    name: "Profane Boost",
    description:
      "Spend a rebuke attempt as a standard action to place negative energy on creatures in a 60-foot burst. Inflict spells cast on them before the end of your next turn are maximized without changing the slot or casting time; track targets and spell effects manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: ["Rebuke Undead", "Turn or Rebuke Undead"],
    },
  },
  {
    id: "sacred-boost",
    name: "Sacred Boost",
    description:
      "Spend a turn attempt as a standard action to place positive energy on creatures in a 60-foot burst. Cure spells cast on them before the end of your next turn are maximized without changing the slot or casting time; track targets and spell effects manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: ["Turn Undead", "Turn or Rebuke Undead"],
    },
  },
  {
    id: "sacred-healing",
    name: "Sacred Healing",
    description:
      "Spend a turn attempt as a full-round action to grant fast healing 3 to living creatures in a 60-foot burst for 1 + your Charisma modifier rounds (minimum 1). Track targets and duration manually.",
    categories: ["divine"],
    ...completeDivineSource,
    prerequisites: {
      skills: { Heal: 8 },
      anyClassFeatures: ["Turn Undead", "Turn or Rebuke Undead"],
    },
  },
  {
    id: "true-believer",
    name: "True Believer",
    description:
      "Choose one deity whose alignment is within one step of yours. Once per day before a saving throw, you may gain a +2 insight bonus on it. You may also use a relic of that deity; track the daily use and relic access manually.",
    ...completeDivineSource,
    prerequisites: { alignmentWithinOneStepOfDeity: true },
  },
  {
    id: "sanctify-relic",
    name: "Sanctify Relic",
    description:
      "Create magic items with a divine connection to your chosen deity. The relic list, construction details, and deity-specific activation rules are described separately and must be applied manually.",
    categories: ["item-creation"],
    ...completeDivineSource,
    prerequisites: {
      featCategoryChoices: [{ anyOf: ["item-creation"], count: 1 }],
    },
  },
  {
    id: "consecrate-spell",
    name: "Consecrate Spell",
    description:
      "Metamagic (+1 spell level): add the good descriptor to a spell. If it deals damage, half (rounded down) is direct divine power and is not reduced by energy resistance or immunity. Apply the damage split and spell-slot adjustment manually.",
    categories: ["metamagic"],
    ...completeDivineSource,
    prerequisites: { alignment: { component: "Good" } },
  },
  {
    id: "corrupt-spell",
    name: "Corrupt Spell",
    description:
      "Metamagic (+1 spell level): add the evil descriptor to a spell. If it deals damage, half (rounded down) is direct divine power and is not reduced by energy resistance or immunity. Apply the damage split and spell-slot adjustment manually.",
    categories: ["metamagic"],
    ...completeDivineSource,
    prerequisites: { alignment: { component: "Evil" } },
  },
  {
    id: "rapid-spell",
    name: "Rapid Spell",
    description:
      "Metamagic (+1 spell level) for spells with casting times longer than 1 standard action: reduce 1-round spells to a standard action, spells measured in rounds to 1 full round, and spells measured in minutes or hours to 1 minute or 1 hour. It combines with Quicken Spell only for a spell originally taking 1 full round; spontaneous casting requires an original casting time longer than 1 full round. Apply timing and slot changes manually.",
    categories: ["metamagic"],
    ...completeDivineSource,
  },
  {
    id: "reach-spell",
    name: "Reach Spell",
    description:
      "Metamagic (+2 spell levels): cast a touch spell at a target up to 30 feet away; it becomes a ray and requires a ranged touch attack. Apply the range, attack, and spell-slot changes manually.",
    categories: ["metamagic"],
    ...completeDivineSource,
  },
  {
    id: "boars-ferocity",
    name: "Boar's Ferocity",
    description:
      "Spend a daily wild shape use as a free action, even outside your turn, when reduced to 0 or fewer hit points but not killed. For 1 minute, act as if not disabled or dying. Track hit points, use, and duration manually.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "cheetahs-speed",
    name: "Cheetah's Speed",
    description:
      "Spend a daily wild shape use to set your base land speed to 50 feet for 1 hour. Once during that hour, you can sprint 10 times your normal speed as part of a charge. Track speed, use, and duration manually.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "eagles-wings",
    name: "Eagle's Wings",
    description:
      "Spend a daily wild shape use to grow feathery wings and fly at 60 feet with average maneuverability for 1 hour. Track use and duration manually.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "elephants-hide",
    name: "Elephant's Hide",
    description:
      "Spend a daily wild shape use to gain a +7 natural armor bonus for 10 minutes. It does not stack with existing natural armor; track the bonus and duration manually.",
    categories: ["wild"],
    ...completeDivineSource,
    prerequisites: {
      anyClassFeatures: completeDivineLargeWildShapeFeatures,
    },
  },
  ...(
    [
      ["chaos", "Chaotic", "chaos"],
      ["evil", "Evil", "evil"],
      ["good", "Good", "good"],
      ["law", "Lawful", "lawful"],
    ] as const
  ).map(([id, component, descriptor]) => ({
    id: `spell-focus-${id}`,
    name: `Spell Focus (${id === "law" ? "Law" : id[0].toUpperCase() + id.slice(1)})`,
    description:
      `Add +1 to saving throw DCs for spells with the ${descriptor} descriptor. The descriptor must match your alignment; choose a different matching descriptor for each selection and track spell DCs manually.`,
    ...completeDivineSource,
    prerequisites: { alignment: { component } },
  })),
  {
    id: "spontaneous-healer",
    name: "Spontaneous Healer",
    description:
      "Spontaneously cast cure spells from your class list a number of times per day equal to your Wisdom modifier. Track spell selection and uses manually.",
    ...completeDivineSource,
    prerequisites: {
      skills: { "Knowledge (religion)": 4 },
      alignment: { nonEvil: true },
      cureWoundsSpell: true,
    },
  },
  {
    id: "spontaneous-summoner",
    name: "Spontaneous Summoner",
    description:
      "Spontaneously cast summon nature's ally spells from your class list a number of times per day equal to your Wisdom modifier. Track spell selection and uses manually.",
    ...completeDivineSource,
    prerequisites: {
      abilities: { wis: 13 },
      skills: { "Knowledge (nature)": 4 },
      alignment: { component: "Neutral" },
      summonNaturesAllySpell: true,
    },
  },
  {
    id: "spontaneous-wounder",
    name: "Spontaneous Wounder",
    description:
      "Spontaneously cast inflict spells from your class list a number of times per day equal to your Wisdom modifier. Track spell selection and uses manually.",
    ...completeDivineSource,
    prerequisites: {
      abilities: { wis: 13 },
      skills: { "Knowledge (religion)": 4 },
      alignment: { nonGood: true },
      inflictWoundsSpell: true,
    },
  },
  ...completeArcaneEnergyFeats,
  {
    id: "spell-penetration",
    name: "Spell Penetration",
    description: "+2 on caster level checks to overcome spell resistance.",
  },
  {
    id: "greater-spell-penetration",
    name: "Greater Spell Penetration",
    description: "+2 more on checks vs. spell resistance.",
    prerequisites: { feats: ["spell-penetration"] },
  },
  {
    id: "spirited-charge",
    name: "Spirited Charge",
    description:
      "On a mounted charge, deal double melee damage or triple with a lance; apply manually.",
    prerequisites: {
      feats: ["mounted-combat", "ride-by-attack"],
      skills: { Ride: 1 },
    },
    fighterBonus: true,
  },
  {
    id: "spring-attack",
    name: "Spring Attack",
    description:
      "Split your move around a melee attack action (at least 5 ft. before and after, no more than your speed); the target does not get an attack of opportunity from this movement, but other creatures may. Unavailable in heavy armor; resolve movement manually.",
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
    description:
      "Before an unarmed attack, declare a stunning attempt; a miss wastes it. If the attack damages the target, it must succeed on a Fortitude save (DC 10 + half your character level + Wis modifier) or be stunned for 1 round. Use this at most once per round and once per day per four character levels; monks instead get uses per day equal to monk level, plus one per four levels in other classes. Constructs, oozes, plants, undead, incorporeal creatures, and creatures immune to critical hits cannot be stunned.",
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
    description: "Gain +3 hit points. You can take this feat multiple times; its effects stack.",
  },
  {
    id: "trample",
    name: "Trample",
    description:
      "When you attempt to overrun while mounted, the target cannot avoid you. Your mount may make one hoof attack against any opponent you knock down, with the standard +4 attack bonus against prone targets. Resolve manually.",
    prerequisites: { feats: ["mounted-combat"], skills: { Ride: 1 } },
    fighterBonus: true,
  },
  {
    id: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description:
      "Gain one extra attack per round with an off-hand weapon. Reduce the attack penalty for your primary hand by 2 and for your off hand by 6.",
    prerequisites: { abilities: { dex: 15 } },
    fighterBonus: true,
  },
  {
    id: "two-weapon-defense",
    name: "Two-Weapon Defense",
    description:
      "While wielding a double weapon or two weapons (not natural weapons or unarmed strikes), gain a +1 shield bonus to AC; fighting defensively or taking total defense increases it to +2.",
    prerequisites: { abilities: { dex: 15 }, feats: ["two-weapon-fighting"] },
    fighterBonus: true,
  },
  {
    id: "weapon-finesse",
    name: "Weapon Finesse",
    description:
      "Use Dexterity instead of Strength on attacks with a light weapon, rapier, whip, or spiked chain sized for you. Natural weapons count as light; shield check penalties still apply.",
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
    id: "greater-weapon-focus",
    name: "Greater Weapon Focus",
    description: "+1 attack with one selected weapon type; stacks with Weapon Focus.",
    prerequisites: { classLevels: { fighter: 8 }, feats: ["weapon-focus"] },
    fighterBonus: true,
  },
  {
    id: "greater-weapon-specialization",
    name: "Greater Weapon Specialization",
    description: "+2 damage with one selected weapon type; stacks with Weapon Specialization.",
    prerequisites: {
      classLevels: { fighter: 12 },
      feats: [
        "greater-weapon-focus",
        "weapon-focus",
        "weapon-specialization",
      ],
    },
    fighterBonus: true,
  },
  {
    id: "whirlwind-attack",
    name: "Whirlwind Attack",
    description:
      "As a full attack, make one melee attack at full base attack bonus against each opponent within reach instead of your regular attacks; forfeit bonus or extra attacks from other effects. Resolve the attacks manually.",
    prerequisites: {
      abilities: { dex: 13, int: 13 },
      baseAttackBonus: 4,
      feats: ["combat-expertise", "dodge", "mobility", "spring-attack"],
    },
    fighterBonus: true,
  },
  {
    id: "awesome-smite",
    name: "Awesome Smite",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["tactical"],
    description:
      "Tactical feat: when making a smite attack with Power Attack (at least a -1 attack penalty), choose one maneuver before the attack roll. Demolishing Smite ignores damage reduction up to twice your Charisma bonus except DR/- and epic DR; Overwhelming Smite can trip a foe damaged by the attack (once per round); Seeking Smite ignores miss chances if your weapon can strike the target. Track all conditions and effects manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["power-attack"],
      anyClassFeatures: completeWarriorSmiteFeatures,
    },
  },
  {
    id: "battle-blessing",
    name: "Battle Blessing",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    description:
      "Cast most paladin spells with standard-action casting times as swift actions, and spells with full-round casting times as standard actions. Other casting times are unchanged; apply the benefit manually.",
    prerequisites: { paladinSpellLevel: 1 },
  },
  {
    id: "spontaneous-domains",
    name: "Spontaneous Domains",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    description:
      "When preparing spells, leave domain slots open and later cast any domain spell you could normally prepare for that level; you remain limited to one domain spell per level per day. Track open slots and daily domain spell use manually.",
    prerequisites: { spellLevel: 3, minimumClericDomains: 2 },
  },
  {
    id: "bestial-charge",
    name: "Bestial Charge",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["tactical"],
    description:
      "Tactical feat: in the round immediately after using wild shape, choose one maneuver when charging. Pouncing Charge allows a full attack after a charge (or +3 on the charge attack if the form already has pounce); Striking Charge adds 5 feet of reach for that attack in a serpentine form; Twisting Charge allows one turn in the charge if you move at least 10 feet before and after it, using a form with four or more legs. Swift Wild Shape allows the charge in the same round as the change; resolve tactical conditions manually.",
    prerequisites: {
      baseAttackBonus: 4,
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "swift-call",
    name: "Swift Call",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    description:
      "Call your special mount as a swift action instead of a full-round action; apply manually.",
    prerequisites: { classFeatures: ["Special Mount"] },
  },
  {
    id: "retrieve-spell",
    name: "Retrieve Spell",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["divine"],
    description:
      "As a standard action, expend turn/rebuke undead attempts equal to 1 + the spell's level to recover a spell you already cast that day from the class granting that turn/rebuke ability. Track uses and recovered spells manually.",
    prerequisites: {
      minimumFeatsByCategory: { divine: 2 },
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "spiritual-counter",
    name: "Spiritual Counter",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["divine"],
    description:
      "As a readied standard action, counter a spell as if casting that same spell by expending turn/rebuke attempts equal to 2 + its level (minimum 1); you must be able to cast the countering spell as if it were on your spell list. Track readied actions, uses, and counters manually.",
    prerequisites: {
      minimumFeatsByCategory: { divine: 1 },
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "air-devotion",
    name: "Air Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, gain a sacred (if your deity is good or neutral) or profane (if evil) AC bonus starting at +1 and increasing by +1 per four character levels (maximum +6 at 20th level). Thrown and projectile weapons also have a 50% miss chance against you. The effect lasts 1 minute. Each selection grants another daily use; you can also gain one additional use for every three turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "animal-devotion",
    name: "Animal Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, activate one animal power for 1 minute: Ape's Fury grants +2 sacred/profane Strength, increasing by +2 per six levels to +8 at level 18; Cheetah's Sprint grants +5 sacred/profane land speed, increasing by +5 per four levels to +30 at level 20; Hawk's Flight grants overland flight and +5 fly speed per five levels from level 5 (maximum +20); Serpent's Strike adds a bite that deals 1d3 Constitution damage (Fortitude DC 10 + half character level + Charisma modifier negates; poison-immune creatures are immune). Multiple powers can remain active, but only one can be activated per round. Each selection grants another daily use; you can also gain one additional use for every three daily turn/rebuke uses expended. Track powers and effects manually.",
  },
  {
    id: "chaos-devotion",
    name: "Chaos Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once/day as a swift action, roll 1d6 (d8 at level 10, d10 at 15): odd gives a sacred/profane attack bonus, even AC, until your next action; reroll before each action for 1 minute. Each selection adds a daily use, as does 3 turn/rebuke uses. Track manually.",
  },
  {
    id: "death-devotion",
    name: "Death Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, empower one melee weapon with negative energy for 1 minute. A successful hit forces a Fortitude save (DC 10 + half your character level + your Charisma modifier) or bestows a negative level; you can inflict at most one negative level per target per four character levels (minimum one, maximum five at level 20). Each selection grants another daily use; you can also gain one additional use for every three turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "destruction-devotion",
    name: "Destruction Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as an immediate action, weaken an opponent's defenses for 1 minute. Each damaging melee hit (not a melee touch attack) reduces either its armor or natural armor bonus by 1, stacking to +0; at character level 10 or higher, reduce it by 2 per hit. Once one bonus reaches +0, continue reducing the other. Each selection grants another daily use; you can also gain one additional use for every turn/rebuke use expended. Track uses and reductions manually.",
  },
  {
    id: "earth-devotion",
    name: "Earth Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once/day as an immediate action: for 1 minute, ignore difficult terrain and gain +5 Balance/Climb/Jump, or change connected earth/stone squares within 30 feet into difficult terrain (1 per 3 levels, 1-6). At level 10, spike changed squares as unsweepable caltrops attacking at BAB; spikes immediately attack creatures underneath. Each selection or turn/rebuke use adds a daily use. Track manually.",
  },
  {
    id: "evil-devotion",
    name: "Evil Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as an immediate action, grant yourself and allies within 30 feet damage reduction 1 + 1 per five character levels (maximum 5) overcome only by good-aligned weapons. Your and your allies' natural and weapon attacks count as evil-aligned for overcoming damage reduction. The effect lasts 1 minute. Each selection grants another daily use; you can also gain one additional use for every turn/rebuke use expended. Track uses and effects manually.",
  },
  {
    id: "fire-devotion",
    name: "Fire Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, surround yourself with harmless flames that illuminate the area like a torch. For 1 minute, each melee attack deals +1 fire damage plus +1 per three character levels (maximum +7 at level 18). A foe injured by the fire takes another 1d4 fire damage each round unless it succeeds on a Reflex save (DC 10 + half your character level + your Charisma modifier); it can douse the flames with a move action. Each selection grants another daily use; you can also gain one additional use for every two turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "good-devotion",
    name: "Good Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as an immediate action, grant yourself and allies within 30 feet damage reduction 1 + 1 per five character levels (maximum 5) overcome only by evil-aligned weapons. Your and your allies' natural and weapon attacks count as good-aligned for overcoming damage reduction. The effect lasts 1 minute. Each selection grants another daily use; you can also gain one additional use for every turn/rebuke use expended. Track uses and effects manually.",
  },
  {
    id: "healing-devotion",
    name: "Healing Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day, gain fast healing 1 plus 1 per five character levels (maximum 5) for 1 minute. Activate as an immediate action, or automatically when reduced to 0 or fewer hit points but not killed if a daily use remains. As a full-round action, transfer the ability to a willing recipient by touch; this uses one daily use. Each selection grants another daily use; you can also gain one additional use for every turn/rebuke use expended. Track uses and healing manually.",
  },
  {
    id: "knowledge-devotion",
    name: "Knowledge Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Upon selection, choose one Knowledge skill to become a class skill. When you face a creature type and have at least 1 rank in its associated Knowledge skill, make a check for an insight bonus on attack and damage rolls against that type for the combat: +1 for 15 or lower, +2 for 16 to 25, +3 for 26 to 30, +4 for 31 to 35, and +5 for 36 or higher. You can make one check per creature type per combat; track the chosen skill and bonuses manually.",
    prerequisites: {
      anySkillRanks: 5,
      anySkillPrefix: "Knowledge",
    },
  },
  {
    id: "law-devotion",
    name: "Law Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, gain a sacred (if your deity is good or neutral) or profane (if evil) +3 bonus to attack rolls or AC until your next action. At the start of each later action, you can reallocate the bonus. The effect lasts 1 minute; the bonus increases to +5 at level 10 and +7 at level 15. Each selection grants another daily use; you can also gain one additional use for every three turn/rebuke uses expended. Track uses and bonuses manually.",
  },
  {
    id: "luck-devotion",
    name: "Luck Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, gain the ability for 1 minute to raise any below-average damage roll you make to half its maximum result, rounded up. This applies to physical and magical damage. Each selection grants another daily use; you can also gain one additional use for every three turn/rebuke uses expended. Track uses and affected damage rolls manually.",
  },
  {
    id: "magic-devotion",
    name: "Magic Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a standard action, make a ranged touch attack against a target within 30 feet plus 5 feet per two character levels; on a hit, deal 1d6 damage per two character levels. Each selection grants another daily use; you can also gain one additional use for every two daily turn/rebuke uses expended. Track uses and attack effects manually.",
  },
  {
    id: "plant-devotion",
    name: "Plant Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as an immediate action, gain +2 natural armor and fortification for 1 minute: 25% at levels 1–9, 50% at level 10, 75% at level 15, and heavy fortification at level 20. Each selection grants another daily use; you can also gain one additional use for every two daily turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "protection-devotion",
    name: "Protection Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as an immediate action, create a 30-foot aura for 1 minute granting you and allies within range a +2 sacred (if your deity is good or neutral) or profane (if evil) AC bonus, increasing by 1 per four character levels to a maximum of +7 at level 20. Each selection grants another daily use; you can also gain one additional use for every three daily turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "strength-devotion",
    name: "Strength Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once/day, swift action for 1 minute: bypass hardness with melee attacks, gain a no-AoO slam (higher damage if you already have a natural weapon, +2 circumstance damage), and make all melee attacks adamantine for DR. Slam damage scales by size/level. Each selection or turn/rebuke use adds a daily use; track manually.",
  },
  {
    id: "sun-devotion",
    name: "Sun Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, make one melee weapon glow with true sunlight in a torch-radius, affecting creatures within 10 feet as sunlight for 1 minute. The weapon deals extra sacred (if your deity is good or neutral) or profane (if evil) damage to undead equal to your character level. Each selection grants another daily use; you can also gain one additional use for every daily turn/rebuke use expended. Track uses and effects manually.",
  },
  {
    id: "travel-devotion",
    name: "Travel Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a swift action, move up to your speed as a swift action each round for 1 minute, allowing a full-round action after moving or a move action plus two other actions. You cannot take a 5-foot step in a round when using this movement. Each selection grants another daily use; you can also gain one additional use for every two daily turn/rebuke uses expended. Track uses and movement manually.",
  },
  {
    id: "trickery-devotion",
    name: "Trickery Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Standard action: create a duplicate within 30 feet, HP 6 + character level, controlled as a free action; it ignores terrain and runs up to 1 minute/level daily. At 5/10/15 gain better illusion, feint, remote perception/checks, and combat/spell projection. Each selection adds a daily use; 3 turn/rebuke uses add one. Track manually.",
  },
  {
    id: "war-devotion",
    name: "War Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day while fighting defensively as a standard or full-round action, take a -3 penalty on attack rolls for a +3 dodge bonus to AC that round. At level 7 this becomes -2/+4, and at level 15 -1/+5; the AC bonus stacks with Combat Expertise and is extraordinary. Each selection grants another daily use; you can also gain one additional use for every three daily turn/rebuke uses expended. Track uses and effects manually.",
  },
  {
    id: "water-devotion",
    name: "Water Devotion",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["domain"],
    description:
      "Once per day as a standard action, pour out a full waterskin to summon a water elemental in that spot. It follows your commands for 1 minute; its size is Small at levels 1-5, Medium at 6-10, Large at 11-15, and Huge at 16-20. Each selection grants another daily use; you can also gain one additional use for every daily turn/rebuke use expended. Track uses and the summoned elemental manually.",
  },
  {
    id: "imbued-healing",
    name: "Imbued Healing",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["metamagic"],
    description:
      "A 1st+ conjuration (healing) spell grants one accessible-domain carrier effect for 1 minute/spell level (Healing: temporary HP last up to 1 hour). Effects: Air electricity resistance 5; Animal scent; Chaos +2 sacred/profane to a random ability; Death +4 saves vs. death effects; Destruction +2 sacred/profane melee damage; Earth acid resistance 5; Evil DR 3/good; Fire fire resistance 5; Good DR 3/evil; Healing 1 temporary HP/level or HD; Knowledge +2 insight on skill/ability checks; Law +4 sacred/profane vs. mind-affecting spells/SLAs; Luck damage rolls of 1 become 2 unless 1 is max; Magic +2 sacred/profane saves vs. spells/SLAs; Plant light fortification; Protection +2 sacred/profane AC while defensive; Strength +2 melee damage; Sun low-light vision and +2 sacred/profane Spot; Travel +5 land speed; Trickery +6 sacred/profane Bluff; War +1 weapon attacks, not natural; Water +6 sacred/profane Swim. Choose one effect for all targets per casting; opposed effects may coexist; damaging uses grant none. Manual.",
    prerequisites: {
      conjurationHealingSpell: true,
      minimumDomains: 1,
    },
  },
  {
    id: "charnel-miasma",
    name: "Charnel Miasma",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "With a 2nd+ Death spell available, exude a grave scent and as a standard action force one foe within 30 feet to save or be shaken 1 minute. A shaken foe that fails becomes panicked 1 minute or until out of line of sight for a full round; a save grants 24-hour immunity. Gain +1 competence CL on death spells. Track manually.",
    prerequisites: { domains: ["death"] },
  },
  {
    id: "fragile-construct",
    name: "Fragile Construct",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While a 3rd-level or higher Destruction domain spell is available to cast, touch an object or make a melee touch attack against a construct to reduce its hardness or damage reduction by the level of your highest-level available Destruction domain spell for a number of rounds equal to your caster level (minimum 0). You also gain a +1 insight bonus on sunder attempts. Track the reserve spell and effects manually.",
    prerequisites: { domains: ["destruction"] },
  },
  {
    id: "elemental-essence",
    name: "Elemental Essence",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["wild"],
    description:
      "Choose acid, cold, electricity, or fire when taking this feat. Spend one daily wild shape use to gain +1d6 damage of that type on each melee attack and resistance 5 to that energy for 1 minute. The choice cannot change; multiple selections grant different types, but effects do not stack and cannot be active simultaneously. Track the chosen energy and use manually.",
    prerequisites: {
      minimumFeatsByCategory: { wild: 1 },
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "great-and-small",
    name: "Great and Small",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["wild"],
    description:
      "In normal form, spend a wild shape use to grow or shrink one size category as enlarge/reduce person at character-level CL. It cannot stack with size changes or exceed one category from normal; resolve manually.",
    prerequisites: { classFeatures: ["Wild Shape (Large)"] },
  },
  {
    id: "holy-potency",
    name: "Holy Potency",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["tactical"],
    description:
      "Choose two tactical maneuvers: Balance of Life (after a cure spell, add its level to a melee attack or Strength check next round); Conduit of Life (after turning undead, add half the turning check to a cure/positive-energy spell's damage against undead, add Charisma to its save DC, and double damage on a natural-20 spell attack if the target fails its save); Conduit of Death (after rebuking undead, add half the turning check to an inflict/negative-energy spell's damage against a living target, add Charisma to its save DC, and increase its critical threat range by 1); or Touch of Death (after an inflict spell, add twice its level as damage on a melee hit against a living target next round). The first two require positive energy, the latter two negative energy. Track maneuver choices and conditions manually.",
    prerequisites: {
      baseAttackBonus: 4,
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      spontaneousCureOrInflict: true,
    },
  },
  {
    id: "holy-warrior",
    name: "Holy Warrior",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While a 4th-level or higher War domain spell is available to cast, gain a bonus on weapon damage rolls equal to the highest-level available War spell. You also gain +1 competence bonus to caster level when casting force spells. Track the reserve spell and effects manually.",
    prerequisites: { spellLevel: 4, domains: ["war"] },
  },
  {
    id: "mitigate-suffering",
    name: "Mitigate Suffering",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While a restoration spell or another conjuration (healing) spell that cures ability damage is available to cast, use a standard action to grant yourself or an ally temporary ability points equal to 2 + the level of the highest-level qualifying spell available in one damaged ability, up to its starting score. These points last 10 minutes before the damage returns unless otherwise healed; the same subject can benefit repeatedly. You also gain +1 competence bonus to caster level on conjuration (healing) spells. Track the reserve spell and effects manually.",
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "protective-ward",
    name: "Protective Ward",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While an abjuration spell is available to cast, use a standard action to grant yourself or one ally within 30 feet a sacred (good/neutral deity) or profane (evil deity) AC bonus equal to the highest-level available abjuration spell until the start of your next turn. You also gain +1 competence bonus to caster level on abjuration spells. Track the reserve spell and effects manually.",
    prerequisites: { domains: ["protection"] },
  },
  {
    id: "swift-wild-shape",
    name: "Swift Wild Shape",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["wild"],
    description:
      "Activate wild shape as a swift action instead of a standard action. Fast Wild Shape is a prerequisite from another source and is confirmed manually.",
    prerequisites: {
      abilities: { dex: 13 },
      fastWildShape: true,
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "touch-of-healing",
    name: "Touch of Healing",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While a 2nd-level or higher conjuration (healing) spell is available, use a standard action and touch a creature at or below half its maximum hit points to heal 3 points per level of the highest-level available healing spell, up to half its maximum hit points. It does not affect creatures that cannot be healed by cure spells. You also gain +1 competence bonus to caster level on conjuration (healing) spells. Track the reserve spell and healing manually.",
    prerequisites: { spellLevel: 2 },
  },
  {
    id: "umbral-shroud",
    name: "Umbral Shroud",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["reserve"],
    description:
      "While a 3rd-level or higher darkness spell is available, use a standard action to direct shadows at one foe within 30 feet. On a failed Will save, its attacks have a miss chance equal to 5% per level of the highest-level available darkness spell until the start of your next action. Creatures that do not rely on sight are unaffected; Blind-Fight works normally. You also gain darkvision 10 feet or increase existing darkvision by 10 feet. Track the reserve spell and effects manually.",
    prerequisites: { spellLevel: 3 },
  },
  {
    id: "venoms-gift",
    name: "Venom's Gift",
    source: core35SourceId,
    sourceBook: completeChampionSourceBook,
    categories: ["wild"],
    description:
      "Spend one daily wild shape use as a standard action to envenom true natural attacks for up to 1 round per caster level; ordinary unarmed strikes do not qualify. Poison: injury, Fortitude negates (DC 10 + 1/2 HD + Con modifier), 1d2 Strength damage initially and again secondarily. A natural attack granted by a transmutation or shapechange effect qualifies. Track use and poison manually.",
    prerequisites: {
      minimumFeatsByCategory: { wild: 2 },
      classFeatures: ["Wild Shape (plant)"],
      anyClassFeatures: completeAdventurerWildShapeFeatures,
    },
  },
  {
    id: "faster-healing",
    name: "Faster Healing",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Recover hit points and ability score damage faster as detailed by the feat's recovery table; apply the table manually.",
    prerequisites: { baseSaves: { fortitude: 5 } },
  },
  {
    id: "fleet-of-foot",
    name: "Fleet of Foot",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While running or charging, make one direction change of up to 90 degrees. Follow the feat's armor, load, and charge-path restrictions manually.",
    prerequisites: { abilities: { dex: 15 }, feats: ["run"] },
  },
  {
    id: "flick-of-the-wrist",
    name: "Flick of the Wrist",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Once per round and once per opponent per encounter, drawing a light weapon and attacking with it catches that opponent flat-footed for that attack; track uses manually.",
    prerequisites: {
      abilities: { dex: 17 },
      skills: { "Sleight of Hand": 5 },
      feats: ["quick-draw"],
    },
  },
  {
    id: "improved-buckler-defense",
    name: "Improved Buckler Defense",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Retain your buckler's shield bonus to AC when attacking with an off-hand weapon; apply the benefit manually.",
    prerequisites: { feats: ["shield-proficiency"] },
    fighterBonus: true,
  },
  {
    id: "improved-combat-expertise",
    name: "Improved Combat Expertise",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When using Combat Expertise, the attack penalty and AC bonus can exceed +5 but cannot exceed your base attack bonus; apply manually.",
    prerequisites: {
      abilities: { int: 13 },
      baseAttackBonus: 6,
      feats: ["combat-expertise"],
    },
    fighterBonus: true,
  },
  {
    id: "improved-toughness",
    name: "Improved Toughness",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain hit points equal to your current Hit Dice and 1 additional hit point for each Hit Die gained later; adjust your manually entered hit point total.",
    prerequisites: { baseSaves: { fortitude: 2 } },
    fighterBonus: true,
  },
  {
    id: "improved-two-weapon-defense",
    name: "Improved Two-Weapon Defense",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain a +2 shield bonus to AC while wielding two weapons other than natural weapons or unarmed strikes; apply the bonus manually.",
    prerequisites: {
      abilities: { dex: 17 },
      baseAttackBonus: 6,
      feats: ["two-weapon-defense", "two-weapon-fighting"],
    },
    fighterBonus: true,
  },
  {
    id: "hold-the-line",
    name: "Hold the Line",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Make an attack of opportunity immediately before a charging opponent's attack when it enters an area you threaten; resolve the trigger manually.",
    prerequisites: {
      baseAttackBonus: 2,
      feats: ["combat-reflexes"],
    },
  },
  {
    id: "improved-rapid-shot",
    name: "Improved Rapid Shot",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Ignore Rapid Shot's -2 penalty on ranged attack rolls; apply the benefit manually.",
    prerequisites: {
      feats: ["manyshot", "point-blank-shot", "rapid-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "monkey-grip",
    name: "Monkey Grip",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Wield a melee weapon one size category larger at a -2 attack penalty without changing the effort required; apply manually.",
    prerequisites: { baseAttackBonus: 1 },
  },
  {
    id: "zen-archery",
    name: "Zen Archery",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Use your Wisdom modifier instead of Dexterity on ranged attack rolls; apply the substitution manually.",
    prerequisites: {
      abilities: { wis: 13 },
      baseAttackBonus: 1,
    },
  },
  {
    id: "ranged-disarm",
    name: "Ranged Disarm",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Make a disarm attempt with one proficient ranged weapon against a target within 30 feet; track the weapon choice and opposed check manually.",
    prerequisites: {
      abilities: { dex: 15 },
      baseAttackBonus: 5,
      feats: ["point-blank-shot", "precise-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "ranged-sunder",
    name: "Ranged Sunder",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Sunder objects within 30 feet using ranged attacks. Slashing or bludgeoning ranged weapons deal full damage; piercing weapons deal half damage before hardness. Resolve manually.",
    prerequisites: {
      abilities: { str: 13 },
      baseAttackBonus: 5,
      feats: ["point-blank-shot", "precise-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "sharp-shooting",
    name: "Sharp-Shooting",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Reduce the AC bonus from cover for your ranged attacks to +2; this does not affect foes with no cover or total cover. Apply manually.",
    prerequisites: {
      baseAttackBonus: 3,
      feats: ["point-blank-shot", "precise-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "combat-brute",
    name: "Combat Brute",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Advancing Blows, Sundering Cleave, and Momentum Swing; track each maneuver's conditions and effects manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["improved-sunder", "power-attack"],
    },
    fighterBonus: true,
  },
  {
    id: "elusive-target",
    name: "Elusive Target",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Negate Power Attack, Diverting Defense, and Cause Overreach; track each maneuver's conditions and effects manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["dodge", "mobility"],
    },
  },
  {
    id: "shock-trooper",
    name: "Shock Trooper",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Directed Bull Rush, Domino Rush, and Heedless Charge; track each maneuver's conditions and effects manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["improved-bull-rush", "power-attack"],
    },
    fighterBonus: true,
  },
  {
    id: "clever-wrestling",
    name: "Clever Wrestling",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain a circumstance bonus on grapple checks to escape a grapple or pin against larger foes: +2 against Large, +4 Huge, +6 Gargantuan, or +8 Colossal. Apply manually.",
    prerequisites: {
      minimumSize: "Small",
      maximumSize: "Medium",
      feats: ["improved-unarmed-strike"],
    },
  },
  {
    id: "swarmfighting",
    name: "Swarmfighting",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Coordinate space and melee attacks with allies who also have this feat; the morale bonus depends on the number of allies and cannot exceed your Dexterity bonus. Apply manually.",
    prerequisites: {
      abilities: { dex: 13 },
      baseAttackBonus: 1,
      minimumSize: "Small",
      maximumSize: "Small",
    },
  },
  {
    id: "giantbane",
    name: "Giantbane",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Duck Underneath, Death from Below, and Climb Aboard against larger foes; resolve their conditions and effects manually.",
    prerequisites: {
      baseAttackBonus: 6,
      maximumSize: "Medium",
      skills: { Tumble: 5 },
    },
  },
  {
    id: "improved-favored-enemy-complete-warrior",
    name: "Improved Favored Enemy",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain a +3 bonus on damage rolls against your favored enemies; this stacks with your favored enemy damage bonus. Apply manually.",
    prerequisites: {
      baseAttackBonus: 5,
      minimumFavoredEnemies: 1,
    },
  },
  {
    id: "favored-power-attack",
    name: "Favored Power Attack",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Against a favored enemy, trade attack bonus for twice that amount in melee damage, or three times the amount when using a two-handed weapon. Follow Power Attack's normal restrictions and apply manually.",
    prerequisites: {
      baseAttackBonus: 4,
      minimumFavoredEnemies: 1,
      feats: ["power-attack"],
    },
  },
  {
    id: "dash",
    name: "Dash",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Increase your speed by 5 feet while wearing light or no armor and carrying a light load; apply manually.",
  },
  {
    id: "divine-cleansing",
    name: "Divine Cleansing",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a standard action, spend one turn or rebuke undead attempt to grant yourself and allies within 60 feet a +2 sacred bonus on Fortitude saves for a number of rounds equal to your Charisma modifier; track uses and apply manually.",
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "divine-might",
    name: "Divine Might",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a free action, spend one turn or rebuke undead attempt to add your Charisma bonus to weapon damage for 1 round; track uses and apply manually.",
    prerequisites: {
      abilities: { str: 13 },
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      feats: ["power-attack"],
    },
  },
  {
    id: "divine-resistance",
    name: "Divine Resistance",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a standard action, spend one turn or rebuke undead attempt to grant yourself and allies within 60 feet resistance 5 to cold, electricity, and fire for a number of rounds equal to your Charisma modifier. This does not stack with similar resistance; track uses and apply manually.",
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      feats: ["divine-cleansing"],
    },
  },
  {
    id: "divine-shield",
    name: "Divine Shield",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a standard action, spend one turn or rebuke undead attempt to add your Charisma modifier to your shield's AC bonus for a number of rounds equal to half your character level; track uses and apply manually.",
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
      feats: ["shield-proficiency"],
    },
  },
  {
    id: "divine-vigor",
    name: "Divine Vigor",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a standard action, spend one turn or rebuke undead attempt to increase your base speed by 10 feet and gain 2 temporary hit points per character level for a number of minutes equal to your Charisma modifier; track uses and apply manually.",
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "extra-rage",
    name: "Extra Rage",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain two additional uses of rage or frenzy per day; the effect stacks if you take this feat multiple times.",
    prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
  },
  {
    id: "extra-smiting",
    name: "Extra Smiting",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain two additional uses per day of a smite ability you have; the effect stacks if you take this feat multiple times. Track uses manually.",
    prerequisites: {
      baseAttackBonus: 4,
      anyClassFeatures: completeWarriorSmiteFeatures,
    },
  },
  {
    id: "extra-stunning",
    name: "Extra Stunning",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain three additional Stunning Fist attempts per day; the effect stacks if you take this feat multiple times. Track uses manually.",
    prerequisites: { baseAttackBonus: 2, feats: ["stunning-fist"] },
  },
  {
    id: "greater-kiai-shout",
    name: "Greater Kiai Shout",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When using Kiai Shout, opponents who hear it and have fewer Hit Dice or levels than you are panicked for 2d6 rounds unless they succeed on a Will save (DC 10 + half your character level + your Charisma modifier); apply manually.",
    prerequisites: {
      abilities: { cha: 13 },
      baseAttackBonus: 9,
      feats: ["kiai-shout"],
    },
  },
  {
    id: "greater-two-weapon-defense",
    name: "Greater Two-Weapon Defense",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While wielding two weapons other than natural weapons or unarmed strikes, gain a +3 shield bonus to AC, increased to +6 while fighting defensively or using total defense; apply manually.",
    prerequisites: {
      abilities: { dex: 19 },
      baseAttackBonus: 11,
      feats: [
        "improved-two-weapon-fighting",
        "two-weapon-defense",
        "two-weapon-fighting",
      ],
    },
    fighterBonus: true,
  },
  {
    id: "improved-mounted-archery",
    name: "Improved Mounted Archery",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When making ranged attacks from a mount, eliminate the penalty during a double move, reduce the penalty during a run from -4 to -2, and attack at any time during the mount's move; resolve manually.",
    prerequisites: {
      skills: { Ride: 1 },
      feats: ["mounted-archery", "mounted-combat"],
    },
    fighterBonus: true,
  },
  {
    id: "instantaneous-rage",
    name: "Instantaneous Rage",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Activate rage or frenzy as a free action in response to another creature's action, including when surprised or flat-footed, if you are aware of the event; resolve timing manually.",
    prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
  },
  {
    id: "intimidating-rage",
    name: "Intimidating Rage",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While raging, attempt to demoralize one foe within 30 feet as a free action; a successfully demoralized foe remains shaken for as long as you rage. You can use this against only one foe per encounter; resolve manually.",
    prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
  },
  {
    id: "kiai-shout",
    name: "Kiai Shout",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "As a standard action, shout to affect opponents within 30 feet who can hear you and have fewer Hit Dice or levels than you; they become shaken for 1d6 rounds unless they succeed on a Will save (DC 10 + half your character level + your Charisma modifier). You can use this three times per day; track uses and resolve manually.",
    prerequisites: { abilities: { cha: 13 }, baseAttackBonus: 1 },
  },
  {
    id: "fists-of-iron",
    name: "Fists of Iron",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Declare before an unarmed attack and expend one daily Stunning Fist use to deal an extra 1d6 damage on a hit; track uses and damage manually.",
    prerequisites: {
      baseAttackBonus: 2,
      feats: ["improved-unarmed-strike", "stunning-fist"],
    },
  },
  {
    id: "sacred-vengeance",
    name: "Sacred Vengeance",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    categories: ["divine"],
    description:
      "As a free action, spend one turn or rebuke undead attempt to add 2d6 damage to successful melee attacks against undead until the end of the current round; track uses and apply manually.",
    prerequisites: {
      anyClassFeatures: [
        "Turn or Rebuke Undead",
        "Turn Undead",
        "Rebuke Undead",
      ],
    },
  },
  {
    id: "prone-attack",
    name: "Prone Attack",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Attack from prone without an attack penalty; after a successful attack, you may stand as a free action, and opponents gain no bonus on melee attacks against you while you remain prone. Resolve manually.",
    prerequisites: {
      abilities: { dex: 15 },
      baseAttackBonus: 2,
      feats: ["lightning-reflexes"],
    },
    fighterBonus: true,
  },
  {
    id: "flying-kick",
    name: "Flying Kick",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When charging with an unarmed attack, deal an extra 1d12 damage; apply the benefit manually.",
    prerequisites: {
      abilities: { str: 13 },
      skills: { Jump: 4 },
      feats: ["improved-unarmed-strike", "power-attack"],
    },
  },
  {
    id: "formation-expert",
    name: "Formation Expert",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling three formation maneuvers, including when nearby allies do not have this feat; resolve their conditions and effects manually.",
    prerequisites: { baseAttackBonus: 6 },
    fighterBonus: true,
  },
  {
    id: "raptor-school",
    name: "Raptor School",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling three hunting-inspired maneuvers; resolve their conditions and effects manually.",
    prerequisites: {
      abilities: { wis: 13 },
      baseAttackBonus: 6,
      skills: { Jump: 5 },
    },
  },
  {
    id: "roundabout-kick",
    name: "Roundabout Kick",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "On a critical hit with an unarmed attack, make an immediate additional unarmed attack against the same target at the same attack bonus; resolve manually.",
    prerequisites: {
      abilities: { str: 15 },
      feats: ["improved-unarmed-strike", "power-attack"],
    },
  },
  {
    id: "destructive-rage",
    name: "Destructive Rage",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While raging or frenzied, gain +8 on Strength checks to break doors or inanimate, immobile objects; apply manually.",
    prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
  },
  {
    id: "extend-rage",
    name: "Extend Rage",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Each use of rage or frenzy lasts 5 rounds longer; the effect stacks if you take this feat multiple times. Track duration manually.",
    prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
  },
  {
    id: "eyes-in-the-back-of-your-head",
    name: "Eyes in the Back of Your Head",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Flanking attackers do not gain the usual +2 attack bonus against you while you retain your Dexterity bonus to AC; you can still be sneak attacked while flanked. Apply manually.",
    prerequisites: { abilities: { wis: 13 }, baseAttackBonus: 1 },
  },
  {
    id: "greater-resiliency",
    name: "Greater Resiliency",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Increase one form of damage reduction by 1. If that damage reduction normally increases with level, retain the additional +1 as it progresses. This feat cannot be taken more than once; apply manually.",
    prerequisites: {
      anyClassFeatures: completeWarriorDamageReductionFeatures,
    },
  },
  {
    id: "pain-touch",
    name: "Pain Touch",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "A creature that is successfully stunned by your Stunning Fist is nauseated for 1 round after the stun ends. Creatures immune to stunning and creatures more than one size category larger than you are unaffected; apply manually.",
    prerequisites: {
      abilities: { wis: 15 },
      baseAttackBonus: 2,
      feats: ["stunning-fist"],
    },
  },
  {
    id: "pin-shield",
    name: "Pin Shield",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "During a full attack against a foe using a shield and no more than one size category larger or smaller, give up all off-hand attacks to deny that foe its shield AC bonus until the end of your action; track and resolve manually.",
    prerequisites: { baseAttackBonus: 4, feats: ["two-weapon-fighting"] },
  },
  {
    id: "ranged-pin",
    name: "Ranged Pin",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Make a ranged grapple attempt by pinning a target's clothing or gear to a nearby surface with a successful ranged attack, then win an opposed grapple check. The target must be within 5 feet of a suitable surface; escape is a DC 15 Strength or Escape Artist check. Resolve manually.",
    prerequisites: {
      abilities: { dex: 15 },
      baseAttackBonus: 5,
      feats: ["point-blank-shot", "precise-shot"],
    },
    fighterBonus: true,
  },
  {
    id: "rapid-stunning",
    name: "Rapid Stunning",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Use one additional Stunning Fist attempt or other special attack that counts against its daily limit per round; the effect stacks if you take this feat multiple times. Track uses manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["combat-reflexes", "stunning-fist"],
    },
    fighterBonus: true,
  },
  {
    id: "shield-charge",
    name: "Shield Charge",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When you hit with a shield as part of a charge, you may make a trip attempt without provoking an attack of opportunity; if you lose, the defender cannot trip you in return. Resolve manually.",
    prerequisites: { baseAttackBonus: 3, feats: ["improved-shield-bash"] },
    fighterBonus: true,
  },
  {
    id: "shield-slam",
    name: "Shield Slam",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "As a full-round or charge action, make a shield attack; on a hit, the target must succeed on a Fortitude save (DC 10 + half your character level + your Strength modifier) or be dazed for 1 round. Apply target immunities and the effect manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["improved-shield-bash", "shield-charge"],
    },
    fighterBonus: true,
  },
  {
    id: "cavalry-charger",
    name: "Cavalry Charger",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Unhorse, Leaping Charge, and Fell Trample while mounted; resolve their charge, bull rush, Ride check, and overrun conditions manually.",
    prerequisites: {
      baseAttackBonus: 6,
      feats: ["mounted-combat", "spirited-charge", "trample"],
    },
    fighterBonus: true,
  },
  {
    id: "sun-school",
    name: "Sun School",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Tactical feat enabling Inexorable Progress of Dawn, Blinding Sun of Noon, and Flash of Sunset; track their attack, stun, and instantaneous-movement conditions manually.",
    prerequisites: {
      baseAttackBonus: 4,
      classFeatures: ["Flurry of Blows"],
    },
  },
  {
    id: "arcane-strike",
    name: "Arcane Strike",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "As a free action, sacrifice an unused spell of 1st level or higher to gain an attack bonus equal to its level and deal an additional 1d4 damage per spell level with a melee weapon, unarmed strike, or natural weapon for 1 round. The attack bonus cannot exceed your base attack bonus; apply manually.",
    prerequisites: { arcaneSpellLevel: 3, baseAttackBonus: 4 },
  },
  {
    id: "axiomatic-strike",
    name: "Axiomatic Strike",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Before an unarmed attack against a chaotic opponent, spend one Stunning Fist use to deal an extra 2d6 damage; the attack can affect creatures immune to stunning. Track uses and damage manually.",
    prerequisites: {
      classFeatures: ["Ki Strike (lawful)"],
      feats: ["stunning-fist"],
    },
  },
  {
    id: "close-quarters-fighting",
    name: "Close-Quarters Fighting",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Gain an attack of opportunity when an enemy attempts to grapple you, even if it would normally avoid provoking one. If your attack deals damage, the enemy fails to start the grapple unless it has Improved Grapple or improved grab; against such an enemy, add your damage to your opposed check to resist. This grants no extra attacks of opportunity and cannot be used when you are denied them; resolve manually.",
    prerequisites: { baseAttackBonus: 3 },
    fighterBonus: true,
  },
  {
    id: "eagle-claw-attack",
    name: "Eagle Claw Attack",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Add your Wisdom modifier to damage when making an unarmed strike against an object; apply manually.",
    prerequisites: {
      abilities: { wis: 13 },
      feats: ["improved-sunder", "improved-unarmed-strike"],
    },
  },
  {
    id: "freezing-the-lifeblood",
    name: "Freezing the Lifeblood",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Before an unarmed attack against a humanoid, declare an attempt that deals no damage. On a hit, the target must succeed on a Fortitude save (DC 10 + half your character level + your Wisdom modifier) or be paralyzed for 1d4+1 rounds. Each attempt expends one Stunning Fist use; creatures immune to stunning are unaffected. Resolve manually.",
    prerequisites: {
      abilities: { wis: 17 },
      baseAttackBonus: 10,
      feats: ["improved-unarmed-strike", "stunning-fist"],
    },
    fighterBonus: true,
  },
  {
    id: "hamstring",
    name: "Hamstring",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Once per round on a melee sneak attack, forgo 2d6 sneak attack damage to halve the target's base speed for 24 hours or until a DC 15 Heal check or magical healing. It does not affect creatures immune to sneak attacks or creatures with no legs or more than four legs; two successful uses are required against quadrupeds. Other movement modes are unaffected; resolve manually.",
    prerequisites: {
      baseAttackBonus: 4,
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "karmic-strike",
    name: "Karmic Strike",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "On your turn, accept a -4 AC penalty until your next turn to make an attack of opportunity against a creature in your threatened area that hits you with a melee or melee touch attack. This does not grant extra attacks of opportunity; resolve manually.",
    prerequisites: {
      abilities: { dex: 13 },
      feats: ["combat-expertise", "dodge"],
    },
  },
  {
    id: "phalanx-fighting",
    name: "Phalanx Fighting",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While using a heavy shield and light weapon, gain +1 AC. If adjacent to an ally using the same equipment and this feat, you both gain an additional +2 AC and +1 on Reflex saves; apply manually.",
    prerequisites: { baseAttackBonus: 1, feats: ["shield-proficiency"] },
    fighterBonus: true,
  },
  {
    id: "arterial-strike",
    name: "Arterial Strike",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "On a sneak attack, forgo 1d6 sneak attack damage to inflict a wound that deals 1 damage per round until a DC 15 Heal check or magical healing. Wounds stack, but only one can be inflicted per successful sneak attack; resolve manually.",
    prerequisites: {
      baseAttackBonus: 4,
      anyClassFeatures: completeAdventurerSneakAttackFeatures,
    },
  },
  {
    id: "defensive-strike",
    name: "Defensive Strike",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If an opponent attacks and misses you while you use total defense, make an attack against that opponent on your next turn with a +4 attack bonus; no bonus applies if it does not attack or hits. Resolve manually.",
    prerequisites: {
      abilities: { dex: 13, int: 13 },
      feats: ["combat-expertise", "dodge"],
    },
    fighterBonus: true,
  },
  {
    id: "defensive-throw",
    name: "Defensive Throw",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If the opponent designated by your Dodge feat attacks and misses you, make an immediate trip attempt against it; this uses one of your attacks of opportunity for the round. Resolve manually.",
    prerequisites: {
      abilities: { dex: 13 },
      feats: [
        "combat-reflexes",
        "dodge",
        "improved-trip",
        "improved-unarmed-strike",
      ],
    },
  },
  {
    id: "earths-embrace",
    name: "Earth’s Embrace",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "While grappling, deal an extra 1d12 damage each round you maintain a pin, but remain immobile and grant other opponents +4 on attacks against you. The extra damage does not affect creatures immune to critical hits; resolve manually.",
    prerequisites: {
      abilities: { str: 15 },
      feats: ["improved-unarmed-strike"],
      prerequisiteAlternatives: [
        { feats: ["improved-grapple"] },
        { classFeatures: ["Improved Grab"] },
      ],
    },
  },
  {
    id: "weakening-touch",
    name: "Weakening Touch",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Before an unarmed attack, declare an attempt that deals no damage; on a hit, apply a -6 penalty to the target’s Strength for 1 minute. Each attempt expends one Stunning Fist use; the penalty does not stack and creatures immune to stun effects are unaffected. Resolve manually.",
    prerequisites: {
      abilities: { wis: 17 },
      baseAttackBonus: 2,
      feats: ["improved-unarmed-strike", "stunning-fist"],
    },
    fighterBonus: true,
  },
  {
    id: "anvil-of-thunder",
    name: "Anvil of Thunder",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If you hit the same creature with both your axe and hammer in one round, it must succeed on a Fortitude save (DC 10 + half your character level + your Strength modifier) or be dazed for 1 round. Apply manually.",
    prerequisites: {
      abilities: { str: 13 },
      feats: ["improved-sunder", "power-attack", "two-weapon-fighting"],
      weaponFocusChoiceGroups: [
        ["Warhammer", "Light Hammer"],
        ["Battleaxe", "Handaxe", "Dwarven Waraxe"],
      ],
    },
  },
  {
    id: "bear-fang",
    name: "Bear Fang",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When you hit a creature with both your axe and dagger in one round, you may attempt to grapple it as a free action without provoking; on a success, drop the axe and immediately attack with the dagger. Apply manually.",
    prerequisites: {
      abilities: { str: 15 },
      feats: ["power-attack", "two-weapon-fighting"],
      weaponFocusChoiceGroups: [
        ["Dagger"],
        ["Battleaxe", "Handaxe", "Dwarven Waraxe"],
      ],
    },
  },
  {
    id: "crescent-moon",
    name: "Crescent Moon",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If you hit the same creature with both your sword and dagger in one round, you may make an immediate free disarm attempt. Apply manually.",
    prerequisites: {
      feats: [
        "improved-disarm",
        "improved-two-weapon-fighting",
        "two-weapon-fighting",
      ],
      weaponFocusChoiceGroups: [
        ["Dagger"],
        ["Bastard Sword", "Longsword", "Scimitar", "Short Sword"],
      ],
    },
  },
  {
    id: "hammers-edge",
    name: "Hammer’s Edge",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If you hit the same creature with both your sword and hammer in one round, it must succeed on a Fortitude save (DC 10 + half your character level + your Strength modifier) or fall prone. Apply manually.",
    prerequisites: {
      abilities: { str: 15 },
      feats: ["improved-bull-rush", "two-weapon-fighting"],
      weaponFocusChoiceGroups: [
        ["Bastard Sword", "Longsword", "Scimitar"],
        ["Warhammer", "Light Hammer"],
      ],
    },
  },
  {
    id: "high-sword-low-axe",
    name: "High Sword Low Axe",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If you hit the same creature with both your sword and axe in one round, you may make a free trip attempt; a successful trip allows the Improved Trip follow-up attack. Apply manually.",
    prerequisites: {
      feats: ["improved-trip", "two-weapon-fighting"],
      weaponFocusChoiceGroups: [
        ["Bastard Sword", "Longsword", "Scimitar", "Short Sword"],
        ["Battleaxe", "Handaxe", "Dwarven Waraxe"],
      ],
    },
  },
  {
    id: "lightning-mace",
    name: "Lightning Mace",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Whenever you threaten a critical hit while wielding a light mace in each hand, gain an additional attack at the same attack bonus. Apply manually.",
    prerequisites: {
      feats: ["combat-reflexes", "two-weapon-fighting"],
      weaponFocusChoices: ["Light Mace"],
    },
  },
  {
    id: "net-and-trident",
    name: "Net and Trident",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "As a full-round action, throw your net; if you hit and control the foe with the opposed Strength check, take a 5-foot step toward it and make a full attack with your trident. Apply manually.",
    prerequisites: {
      abilities: { dex: 15 },
      feats: ["two-weapon-fighting"],
      weaponFocusChoices: ["Trident"],
      weaponProficiencyChoices: ["Net"],
    },
  },
  {
    id: "quick-staff",
    name: "Quick Staff",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When using Combat Expertise while wielding a quarterstaff, gain a dodge bonus 2 points higher than the attack penalty you take. Apply manually.",
    prerequisites: {
      feats: ["combat-expertise", "dodge", "two-weapon-fighting"],
      weaponFocusChoices: ["Quarterstaff"],
    },
  },
  {
    id: "spinning-halberd",
    name: "Spinning Halberd",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "When making a full attack with a halberd, gain a +1 dodge bonus to AC and an additional bludgeoning attack at -5 that deals 1d6 + half your Strength modifier damage. Apply manually.",
    prerequisites: {
      feats: ["combat-reflexes", "two-weapon-fighting"],
      weaponFocusChoices: ["Halberd"],
    },
  },
  {
    id: "three-mountains",
    name: "Three Mountains",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "If you hit the same creature twice in one round with a heavy mace, morningstar, or greatclub, it must succeed on a Fortitude save (DC 10 + half your character level + your Strength modifier) or be nauseated for 1 round. Apply manually.",
    prerequisites: {
      abilities: { str: 13 },
      feats: ["cleave", "improved-bull-rush", "power-attack"],
      weaponFocusChoices: ["Heavy Mace", "Morningstar", "Greatclub"],
    },
  },
  {
    id: "improved-familiar-complete-warrior",
    name: "Improved Familiar",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Adds krenshar, worg, blink dog, hell hound, hippogriff, howler, and winter wolf to your familiar options, subject to familiar-specific arcane caster-level and base attack bonus thresholds. The familiar must be within one alignment step on each axis; verify the selected creature's requirements manually.",
    prerequisites: {
      anyClassLevels: { sorcerer: 1, wizard: 1 },
      arcaneCasterLevel: 3,
      baseAttackBonus: 3,
    },
  },
  {
    id: "improved-weapon-familiarity",
    name: "Improved Weapon Familiarity",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Treat every exotic weapon associated with your race as a martial weapon; resolve racial weapon associations and proficiency manually.",
    prerequisites: { baseAttackBonus: 1 },
    fighterBonus: true,
  },
  {
    id: "power-critical",
    name: "Power Critical",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Choose a weapon with Weapon Focus; gain +4 on rolls to confirm critical threats with it. You may take this feat repeatedly, including for the same weapon, and same-weapon bonuses stack; apply manually.",
    prerequisites: {
      baseAttackBonus: 4,
      feats: ["weapon-focus"],
    },
    fighterBonus: true,
  },
  {
    id: "throw-anything",
    name: "Throw Anything",
    source: core35SourceId,
    sourceBook: completeWarriorSourceBook,
    description:
      "Throw any melee weapon with which you are proficient as a ranged weapon with a 10-foot range increment; apply manually.",
    prerequisites: {
      abilities: { dex: 15 },
      baseAttackBonus: 2,
      anyWeaponProficiency: true,
    },
  },
  ...(
    [
      {
        id: "acrobatic-strike",
        name: "Acrobatic Strike",
        description:
          "Succeed at Tumble to avoid an opponent's attack of opportunity; +6 on your next attack against it before your next turn.",
        prerequisites: { skills: { Tumble: 12 } },
        fighterBonus: true,
      },
      {
        id: "arcane-flourish",
        name: "Arcane Flourish",
        description:
          "Expend an arcane spell to gain a competence bonus on your next Perform check; make the check within 1 minute.",
        prerequisites: {
          anySkills: completeAdventurerAnyPerformRanks(4),
          arcaneCasterLevel: 1,
        },
      },
      {
        id: "arcane-accompaniment",
        name: "Arcane Accompaniment",
        description:
          "Swiftly expend a prepared spell or slot to extend bardic music after performing by rounds equal to its level.",
        prerequisites: {
          anySkills: completeAdventurerAnyPerformRanks(4),
          arcaneCasterLevel: 1,
          classFeatures: ["Bardic Music"],
          feats: ["arcane-flourish"],
        },
      },
      {
        id: "arcane-thesis",
        name: "Arcane Thesis",
        description:
          "Choose one arcane spell; gain +2 caster level with it and reduce the slot increase for other metamagic feats by 1. Track the chosen spell and slot adjustments manually.",
        prerequisites: {
          skills: { "Knowledge (arcana)": 9 },
          arcaneSpellcasting: true,
        },
      },
      {
        id: "arcane-toughness",
        name: "Arcane Toughness",
        description:
          "When reduced to 0 or fewer hit points, expend an arcane spell slot to regain hit points. Track the spell slot and healing manually.",
        prerequisites: { feats: ["toughness"], arcaneCasterLevel: 3 },
      },
      {
        id: "arcane-consumption",
        name: "Arcane Consumption",
        description:
          "Once per day, gain +4 to one spell's save DC by taking a Constitution penalty and becoming fatigued. Track the penalties and duration manually.",
        prerequisites: {
          feats: ["arcane-toughness", "toughness"],
          arcaneCasterLevel: 6,
        },
      },
      {
        id: "armor-specialization",
        name: "Armor Specialization",
        description:
          "Choose an armor type you are proficient with; gain damage reduction 2/- while wearing that type. Track the chosen armor and damage reduction manually.",
        prerequisites: { anyArmorProficiency: true, baseAttackBonus: 12 },
        fighterBonus: true,
      },
      {
        id: "battle-dancer",
        name: "Battle Dancer",
        description:
          "Gain +2 on attacks while moving and using bardic music. Apply the bonus only when both conditions are met.",
        prerequisites: {
          baseAttackBonus: 2,
          classFeatures: ["Bardic Music"],
        },
        fighterBonus: true,
      },
      {
        id: "bonded-familiar",
        name: "Bonded Familiar",
        description:
          "When an attack would reduce you below 0 hit points, transfer part of its damage to your familiar. Track the damage-sharing effect manually.",
        prerequisites: { classFeatures: ["Familiar"] },
      },
      {
        id: "bounding-assault",
        name: "Bounding Assault",
        description:
          "Make two attacks as part of a Spring Attack, taking the listed attack penalties.",
        prerequisites: {
          abilities: { dex: 13 },
          feats: ["dodge", "mobility", "spring-attack"],
          baseAttackBonus: 12,
        },
      },
      {
        id: "rapid-blitz",
        name: "Rapid Blitz",
        description:
          "Make three attacks as part of a Spring Attack, taking the listed attack penalties.",
        prerequisites: {
          abilities: { dex: 13 },
          feats: ["bounding-assault", "dodge", "mobility", "spring-attack"],
          baseAttackBonus: 18,
        },
      },
      {
        id: "brutal-strike",
        name: "Brutal Strike",
        description:
          "A successful bludgeoning attack can daze its target; track the trigger and duration manually.",
        prerequisites: {
          abilities: { str: 13 },
          feats: ["power-attack"],
          baseAttackBonus: 6,
        },
        fighterBonus: true,
      },
      {
        id: "combat-acrobat",
        name: "Combat Acrobat",
        description:
          "Use Balance and Tumble to avoid attacks of opportunity and recover from difficult combat maneuvers.",
        prerequisites: { skills: { Balance: 9, Tumble: 9 } },
        fighterBonus: true,
      },
      {
        id: "combat-familiar",
        name: "Combat Familiar",
        description:
          "Your familiar can enter an opponent's space without provoking an attack of opportunity. Resolve its movement manually.",
        prerequisites: {
          arcaneCasterLevel: 1,
          classFeatures: ["Familiar"],
        },
      },
      {
        id: "lurking-familiar",
        name: "Lurking Familiar",
        description:
          "Your familiar can hide in your space and share that space's concealment. Resolve the familiar's Hide checks manually.",
        prerequisites: {
          arcaneCasterLevel: 6,
          feats: ["combat-familiar"],
        },
      },
      {
        id: "combat-tactician",
        name: "Combat Tactician",
        description:
          "Gain +2 damage against a foe you approach and attack. Track the movement condition manually.",
        prerequisites: {
          abilities: { dex: 13 },
          feats: ["dodge"],
          baseAttackBonus: 12,
        },
      },
      {
        id: "cometary-collision",
        name: "Cometary Collision",
        description:
          "Ready an action to charge an opponent that charges you, meeting its attack with your own. Resolve the opposed movement and attack manually.",
        prerequisites: {
          abilities: { str: 13 },
          feats: ["improved-bull-rush", "power-attack"],
          baseAttackBonus: 6,
        },
        fighterBonus: true,
      },
      {
        id: "companion-spellbond",
        name: "Companion Spellbond",
        description:
          "Share spells with your animal companion at a greater range than normal; track the companion and spell range manually.",
        prerequisites: { classFeatures: ["Animal Companion"] },
      },
      {
        id: "crossbow-sniper",
        name: "Crossbow Sniper",
        description:
          "Add half your Dexterity bonus to damage with the selected crossbow and extend sneak attack or skirmish range to 60 feet.",
        prerequisites: {
          anyWeaponProficiency: true,
          weaponFocusChoices: ["Hand Crossbow", "Heavy Crossbow", "Light Crossbow"],
          weaponProficiencyChoices: [
            "Hand Crossbow",
            "Heavy Crossbow",
            "Light Crossbow",
          ],
          weaponFeatChoiceGroups: [{ featIds: ["weapon-focus"] }],
          baseAttackBonus: 1,
        },
        fighterBonus: true,
      },
      {
        id: "cunning-evasion",
        name: "Cunning Evasion",
        description:
          "After using evasion, immediately hide and move a short distance. Resolve the movement and Hide check manually.",
        prerequisites: {
          skills: { Hide: 9 },
          classFeatures: ["Evasion"],
        },
      },
      {
        id: "dampen-spell",
        name: "Dampen Spell",
        description:
          "As an immediate action, expend a prepared spell or slot to reduce the save DC of an opponent's spell.",
        prerequisites: { feats: ["improved-counterspell"] },
      },
      {
        id: "deadeye-shot",
        name: "Deadeye Shot",
        description:
          "Ready a ranged attack for when an ally hits your target; that attack can deny the target its Dexterity bonus to AC.",
        prerequisites: {
          feats: ["point-blank-shot", "precise-shot"],
          baseAttackBonus: 4,
          prerequisiteAlternatives: [
            {
              anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(1),
            },
            { minimumSkirmishDamageDice: 1 },
          ],
        },
        fighterBonus: true,
      },
      {
        id: "defensive-sweep",
        name: "Defensive Sweep",
        description:
          "An adjacent opponent that does not move during its turn provokes an attack of opportunity from you.",
        prerequisites: { baseAttackBonus: 15 },
        fighterBonus: true,
      },
      {
        id: "elven-spell-lore",
        name: "Elven Spell Lore",
        description:
          "Gain a bonus on dispel checks and, for selected spells, change the spell's energy type. Track eligible spells and types manually.",
        prerequisites: {
          skills: { "Knowledge (arcana)": 12 },
          prerequisiteAlternatives: [
            { abilities: { int: 17 } },
            { races: ["Elf"] },
          ],
        },
      },
      {
        id: "fade-into-violence",
        name: "Fade into Violence",
        description:
          "Use Bluff to redirect an opponent's attack toward an ally. Resolve the check and target choice manually.",
        prerequisites: { skills: { Bluff: 6, Hide: 6 } },
      },
      {
        id: "fiery-fist",
        name: "Fiery Fist",
        description:
          "Expend a Stunning Fist use to wreath your unarmed attacks in fire, adding damage for the duration.",
        prerequisites: {
          abilities: { dex: 13, wis: 13 },
          feats: ["improved-unarmed-strike", "stunning-fist"],
          baseAttackBonus: 8,
        },
        fighterBonus: true,
      },
      {
        id: "fiery-ki-defense",
        name: "Fiery Ki Defense",
        description:
          "Expend a Stunning Fist use to surround yourself with fire that damages creatures striking you in melee.",
        prerequisites: {
          abilities: { dex: 13, wis: 13 },
          feats: ["fiery-fist", "improved-unarmed-strike", "stunning-fist"],
          baseAttackBonus: 8,
        },
        fighterBonus: true,
      },
      {
        id: "ki-blast",
        name: "Ki Blast",
        description:
          "Expend a Stunning Fist use to attack a foe at range with a blast of ki energy.",
        prerequisites: {
          abilities: { dex: 13, wis: 13 },
          feats: ["fiery-fist", "improved-unarmed-strike", "stunning-fist"],
          baseAttackBonus: 8,
        },
        fighterBonus: true,
      },
      {
        id: "flay",
        name: "Flay",
        description:
          "Use Power Attack to inflict especially painful wounds on an unarmored target.",
        prerequisites: {
          abilities: { str: 13 },
          feats: ["power-attack"],
        },
        fighterBonus: true,
      },
      {
        id: "grenadier",
        name: "Grenadier",
        description:
          "Gain +1 on attack and damage rolls with splash weapons.",
      },
      {
        id: "hindering-opportunist",
        name: "Hindering Opportunist",
        description:
          "Replace an attack of opportunity with an aid-another action to hinder an opponent.",
        prerequisites: { feats: ["combat-reflexes"], baseAttackBonus: 3 },
      },
      {
        id: "stalwart-defense",
        name: "Stalwart Defense",
        description:
          "An opponent that attacks an ally you threaten provokes an aid-another action from you.",
        prerequisites: {
          feats: ["combat-reflexes", "hindering-opportunist"],
          baseAttackBonus: 9,
        },
      },
      {
        id: "indomitable-soul",
        name: "Indomitable Soul",
        description:
          "Roll twice and use the better result on saves against fear and mind-affecting effects.",
        prerequisites: { feats: ["endurance", "iron-will"] },
      },
      {
        id: "intimidating-strike",
        name: "Intimidating Strike",
        description:
          "Combine a melee attack with an Intimidate check to shake your opponent.",
        prerequisites: { skills: { Intimidate: 4 } },
      },
      {
        id: "keen-eared-scout",
        name: "Keen-Eared Scout",
        description:
          "A successful Listen check reveals additional information about the source of a sound.",
        prerequisites: {
          skills: { Listen: 6 },
          prerequisiteAlternatives: [
            { feats: ["alertness"] },
            { feats: ["skill-focus"], featSkillChoices: ["Listen"] },
          ],
        },
      },
      {
        id: "leap-of-the-heavens",
        name: "Leap of the Heavens",
        description:
          "A standing jump no longer doubles its DC, and running jumps gain +5 on the check.",
        prerequisites: { skills: { Jump: 4 } },
      },
      {
        id: "lunging-strike",
        name: "Lunging Strike",
        description:
          "Extend your reach for one melee attack, taking the feat's attack penalty.",
        prerequisites: { baseAttackBonus: 6 },
        fighterBonus: true,
      },
      {
        id: "mad-foam-rager",
        name: "Mad Foam Rager",
        description:
          "Once during each rage or frenzy, delay the effect of one spell or attack against you.",
        prerequisites: { anyClassFeatures: completeWarriorRageFeatures },
      },
      {
        id: "master-manipulator",
        name: "Master Manipulator",
        description:
          "Use Diplomacy to employ the Captivating Speech and Social Agility abilities; resolve their effects manually.",
        prerequisites: {
          abilities: { cha: 13 },
          skills: { Diplomacy: 9 },
        },
      },
      {
        id: "melee-evasion",
        name: "Melee Evasion",
        description:
          "While fighting defensively, negate one melee attack with an opposed check.",
        prerequisites: {
          abilities: { dex: 13, int: 13 },
          feats: ["combat-expertise", "dodge"],
        },
        fighterBonus: true,
      },
      {
        id: "melee-weapon-mastery",
        name: "Melee Weapon Mastery",
        description:
          "Choose a weapon damage type; gain +2 on attacks and damage with qualifying weapons of that type. Track the weapon choices manually.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus", "weapon-specialization"],
          weaponFeatChoiceGroups: [
            {
              featIds: ["weapon-focus", "weapon-specialization"],
              damageTypes: ["bludgeoning", "piercing", "slashing"],
            },
          ],
          baseAttackBonus: 8,
          weaponFocusDamageTypes: ["bludgeoning", "piercing", "slashing"],
        },
      },
      {
        id: "crushing-strike",
        name: "Crushing Strike",
        description:
          "With the required bludgeoning weapon, each hit in a full attack grants +1 on later attacks against that opponent.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus", "weapon-specialization", "melee-weapon-mastery"],
          baseAttackBonus: 14,
          weaponFeatChoiceGroups: [
            {
              featIds: ["weapon-focus", "weapon-specialization"],
              damageTypes: ["bludgeoning"],
            },
          ],
          weaponFocusDamageTypes: ["bludgeoning"],
        },
      },
      {
        id: "driving-attack",
        name: "Driving Attack",
        description:
          "Use a piercing weapon attack to bull rush an opponent without provoking an attack of opportunity.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus", "weapon-specialization", "melee-weapon-mastery"],
          baseAttackBonus: 14,
          weaponFeatChoiceGroups: [
            {
              featIds: ["weapon-focus", "weapon-specialization"],
              damageTypes: ["piercing"],
            },
          ],
          weaponFocusDamageTypes: ["piercing"],
        },
      },
      {
        id: "slashing-flurry",
        name: "Slashing Flurry",
        description:
          "Make an additional attack with a qualifying slashing weapon during a full attack.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus", "weapon-specialization", "melee-weapon-mastery"],
          baseAttackBonus: 14,
          weaponFeatChoiceGroups: [
            {
              featIds: ["weapon-focus", "weapon-specialization"],
              damageTypes: ["slashing"],
            },
          ],
          weaponFocusDamageTypes: ["slashing"],
        },
      },
      {
        id: "weapon-supremacy",
        name: "Weapon Supremacy",
        description:
          "With one chosen weapon, gain +4 on checks to resist being disarmed; use it while grappled without penalty or a grapple check and still take standard or full attack actions; during a full attack, add +5 to one attack after your first strike; once per round after an attack roll, treat the d20 result as 10; and gain +1 AC. You can select this feat only once for one weapon type. Track effects manually.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: [
            "weapon-focus",
            "weapon-specialization",
            "greater-weapon-focus",
            "greater-weapon-specialization",
            "melee-weapon-mastery",
          ],
          weaponFeatChoiceGroups: [
            {
              featIds: [
                "weapon-focus",
                "weapon-specialization",
                "greater-weapon-focus",
                "greater-weapon-specialization",
              ],
            },
          ],
          classLevels: { fighter: 18 },
        },
      },
      {
        id: "overwhelming-assault",
        name: "Overwhelming Assault",
        description:
          "Gain bonuses against an adjacent opponent that does not attack you; track the positioning and attack conditions manually.",
        prerequisites: { baseAttackBonus: 15 },
      },
      {
        id: "penetrating-shot",
        name: "Penetrating Shot",
        description:
          "Make one ranged attack against every foe in a 60-foot line. Resolve the attack and damage against each target manually.",
        prerequisites: {
          abilities: { str: 15 },
          feats: ["point-blank-shot"],
          baseAttackBonus: 10,
        },
        fighterBonus: true,
      },
      {
        id: "ranged-weapon-mastery",
        name: "Ranged Weapon Mastery",
        description:
          "Choose a weapon; gain the Weapon Focus and Weapon Specialization benefits with other weapons of the same damage type. Track those choices manually.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus", "weapon-specialization"],
          weaponFeatChoiceGroups: [
            { featIds: ["weapon-focus", "weapon-specialization"] },
          ],
          baseAttackBonus: 8,
        },
      },
      {
        id: "robilars-gambit",
        name: "Robilar's Gambit",
        description:
          "Grant foes bonuses on attacks and damage against you; their attacks provoke attacks of opportunity.",
        prerequisites: {
          feats: ["combat-reflexes"],
          baseAttackBonus: 12,
        },
        fighterBonus: true,
      },
      {
        id: "shield-specialization",
        name: "Shield Specialization",
        description:
          "Choose one type of shield and gain +1 to its shield bonus to AC. Track the selected shield manually.",
        prerequisites: { shieldProficiency: true },
        fighterBonus: true,
      },
      {
        id: "active-shield-defense",
        name: "Active Shield Defense",
        description:
          "Fight defensively with a shield without the attack penalty on attacks of opportunity; total defense allows them at -4.",
        prerequisites: {
          shieldProficiency: true,
          feats: ["shield-specialization"],
        },
      },
      {
        id: "agile-shield-fighter",
        name: "Agile Shield Fighter",
        description:
          "Full attack: shield bash and armed strike at -2 each, replacing two-weapon penalties.",
        prerequisites: {
          shieldProficiency: true,
          feats: ["improved-shield-bash", "shield-specialization"],
        },
        fighterBonus: true,
      },
      {
        id: "shield-sling",
        name: "Shield Sling",
        description:
          "Throw your shield as a ranged weapon; track its range, damage, and return to hand manually.",
        prerequisites: {
          shieldProficiency: true,
          feats: ["improved-shield-bash", "shield-specialization"],
          baseAttackBonus: 9,
        },
        fighterBonus: true,
      },
      {
        id: "shield-ward",
        name: "Shield Ward",
        description:
          "Apply your shield bonus to AC against touch attacks and to defenses against bull rush, disarm, grapple, overrun, and trip.",
        prerequisites: {
          shieldProficiency: true,
          feats: ["shield-specialization"],
        },
        fighterBonus: true,
      },
      {
        id: "short-haft",
        name: "Short Haft",
        description:
          "Change your grip on a reach weapon to attack adjacent opponents, giving up its reach for that round.",
        prerequisites: {
          anyWeaponProficiency: true,
          feats: ["weapon-focus"],
          weaponFeatChoiceGroups: [{ featIds: ["weapon-focus"] }],
          weaponFocusReach: true,
          baseAttackBonus: 3,
        },
        fighterBonus: true,
      },
      {
        id: "spectral-skirmisher",
        name: "Spectral Skirmisher",
        description:
          "Gain combat benefits while invisible, including when you attack or are attacked. Track the conditions manually.",
        prerequisites: { baseAttackBonus: 6 },
        fighterBonus: true,
      },
      {
        id: "spell-linked-familiar",
        name: "Spell-Linked Familiar",
        description:
          "Grant your familiar limited spellcasting ability; track its spell selection and uses manually.",
        prerequisites: {
          arcaneCasterLevel: 9,
          classFeatures: ["Familiar"],
        },
      },
      {
        id: "steadfast-determination",
        name: "Steadfast Determination",
        description:
          "Use Constitution instead of Wisdom on Will saves and do not automatically fail Fortitude saves on a natural 1.",
        prerequisites: { feats: ["endurance"] },
      },
      {
        id: "telling-blow",
        name: "Telling Blow",
        description:
          "Add sneak attack or skirmish damage when you score a critical hit; track the extra damage manually.",
        prerequisites: {
          prerequisiteAlternatives: [
            {
              anyClassFeatures: completeScoundrelSneakAttackFeaturesAtLeast(1),
            },
            { minimumSkirmishDamageDice: 1 },
          ],
        },
      },
      {
        id: "trophy-collector",
        name: "Trophy Collector",
        description:
          "Create and wear trophies from defeated creatures to gain associated bonuses. Track the trophy, bonus, and duration manually.",
        prerequisites: { skills: { "Craft (taxidermy)": 6 } },
      },
      {
        id: "tumbling-feint",
        name: "Tumbling Feint",
        description:
          "At the start of your turn, designate an opponent. If you successfully Tumble to avoid provoking an attack of opportunity from that opponent, gain +5 on your next Bluff check to feint against them; use this benefit on or before your next turn. Resolve the timing and feint manually.",
        prerequisites: { skills: { Bluff: 4, Tumble: 4 } },
        fighterBonus: true,
      },
      {
        id: "two-weapon-pounce",
        name: "Two-Weapon Pounce",
        description:
          "When charging, attack with both weapons instead of making one attack. You lose the charge's +2 attack bonus, but its -2 AC penalty still applies. A ranger with the two-weapon combat style may select this at base attack bonus +6 while wearing light or no armor; resolve the attacks manually.",
        prerequisites: {
          abilities: { dex: 15 },
          feats: ["two-weapon-fighting"],
          baseAttackBonus: 6,
        },
        fighterBonus: true,
      },
      {
        id: "two-weapon-rend",
        name: "Two-Weapon Rend",
        description:
          "Once per round against an opponent, if both weapons hit it, deal extra damage equal to 1d6 + 1-1/2 times your Strength bonus; this damage is the same type as your off-hand weapon. A ranger with the two-weapon combat style may select this at base attack bonus +11 while wearing light or no armor; resolve the attacks and damage manually.",
        prerequisites: {
          abilities: { dex: 15 },
          feats: ["two-weapon-fighting"],
          baseAttackBonus: 11,
        },
        fighterBonus: true,
      },
      {
        id: "vatic-gaze",
        name: "Vatic Gaze",
        description:
          "Use detect magic at will. As a swift action, make a Sense Motive check (DC 5 + the target's caster level) to learn the highest-level spells it can cast; this grants no insight into spell-like or supernatural abilities. Resolve the check manually.",
        prerequisites: { arcaneCasterLevel: 9 },
      },
      {
        id: "versatile-unarmed-strike",
        name: "Versatile Unarmed Strike",
        description:
          "As a swift action, choose bludgeoning, piercing, or slashing damage for your unarmed strikes; the chosen type lasts until you use another swift action to change it.",
        prerequisites: { feats: ["improved-unarmed-strike"] },
        fighterBonus: true,
      },
      {
        id: "vexing-flanker",
        name: "Vexing Flanker",
        description: "Gain +4 on attack rolls while flanking.",
        prerequisites: { feats: ["combat-reflexes"] },
        fighterBonus: true,
      },
      {
        id: "adaptable-flanker",
        name: "Adaptable Flanker",
        description:
          "As a swift action, designate a foe; while adjacent, choose a threatened square for flanking and also count from your current square.",
        prerequisites: {
          feats: ["combat-reflexes", "vexing-flanker"],
          baseAttackBonus: 4,
        },
        fighterBonus: true,
      },
      {
        id: "wanderers-diplomacy",
        name: "Wanderer's Diplomacy",
        description:
          "Gain Canny Merchant, Intuitive Communication, and Social Agility. Resolve the skill checks and attitude changes manually.",
        prerequisites: {
          prerequisiteAlternatives: [
            { races: ["Halfling"] },
            {
              skills: { Bluff: 4, Diplomacy: 4, "Sense Motive": 4 },
            },
          ],
        },
      },
      {
        id: "water-splitting-stone",
        name: "Water Splitting Stone",
        description:
          "Gain +4 damage on unarmed strikes against a foe whose damage reduction applies to your attacks. A monk with Stunning Fist may select this as a monk bonus feat with base attack bonus +9, ignoring its other prerequisites; a fighter may select it as a fighter bonus feat. Resolve damage manually.",
        prerequisites: {
          abilities: { dex: 13, wis: 13 },
          feats: ["improved-unarmed-strike", "stunning-fist"],
          baseAttackBonus: 9,
        },
        fighterBonus: true,
      },
      {
        id: "ritual-blessing",
        name: "Ritual Blessing",
        description:
          "Learn ceremonies keyed to Knowledge (religion) ranks that grant protective and restorative benefits. Track the ceremony, materials, and duration manually.",
        prerequisites: {
          alignment: { component: "Good" },
          skills: { "Knowledge (religion)": 4 },
        },
      },
      {
        id: "ritual-blood-bonds",
        name: "Ritual Blood Bonds",
        description:
          "Learn ceremonies keyed to Knowledge (religion) ranks that create protective bonds among allies. Track participants, materials, and duration manually.",
        prerequisites: {
          races: ["Orc", "Half-Orc"],
          skills: { "Knowledge (religion)": 4 },
        },
      },
      {
        id: "combat-focus",
        name: "Combat Focus",
        description:
          "After your first successful attack in an encounter, gain combat focus once for that encounter. While focused, gain +2 on Will saves (+4 with three or more combat-form feats). Focus lasts 10 rounds plus 1 round per other combat-form feat you possess. Track activation and duration manually.",
        prerequisites: { abilities: { wis: 13 } },
        fighterBonus: true,
      },
      {
        id: "combat-stability",
        name: "Combat Stability",
        description:
          "While focused, gain +4 on checks and rolls to resist bull rush, disarm, grapple, overrun, and trip; this increases to +8 with three or more combat-form feats. Track the bonus manually.",
        prerequisites: {
          abilities: { wis: 13 },
          feats: ["combat-focus"],
          baseAttackBonus: 3,
        },
        fighterBonus: true,
      },
      {
        id: "combat-defense",
        name: "Combat Defense",
        description:
          "While focused, change the target of your Dodge feat as an immediate action; with three or more combat-form feats, gain +1 dodge bonus to AC against that target. Normally, designating or changing your Dodge target is a free action on your turn.",
        prerequisites: {
          abilities: { dex: 13, wis: 13 },
          feats: ["combat-focus", "dodge"],
          baseAttackBonus: 6,
        },
        fighterBonus: true,
      },
      {
        id: "combat-vigor",
        name: "Combat Vigor",
        description:
          "While focused, gain fast healing 2, increased to 4 with three or more combat-form feats. Track the healing manually.",
        prerequisites: {
          abilities: { wis: 13 },
          feats: ["combat-focus"],
          baseAttackBonus: 9,
        },
        fighterBonus: true,
      },
      {
        id: "combat-awareness",
        name: "Combat Awareness",
        description:
          "While focused, learn the current hit point totals of all adjacent creatures; with three or more combat-form feats, gain blindsight out to 5 feet. Track these effects manually.",
        prerequisites: {
          abilities: { wis: 13 },
          feats: ["blind-fight", "combat-focus"],
          baseAttackBonus: 12,
        },
        fighterBonus: true,
      },
      {
        id: "combat-strike",
        name: "Combat Strike",
        description:
          "As a swift action, end combat focus to gain attack and damage bonuses equal to the total number of combat-form feats you possess for the rest of the turn; immediately lose benefits from other combat-form feats that require maintained focus. Track the effect manually.",
        prerequisites: {
          abilities: { wis: 13 },
          feats: ["combat-focus"],
          featChoices: [{
            anyOf: [
              "combat-stability",
              "combat-defense",
              "combat-vigor",
              "combat-awareness",
            ],
            count: 2,
          }],
          baseAttackBonus: 15,
        },
        fighterBonus: true,
      },
      {
        id: "divine-armor",
        name: "Divine Armor",
        description:
          "Expend a turn or rebuke undead attempt to gain damage reduction 5/- until the start of your next turn.",
        categories: ["divine"],
        prerequisites: {
          divineCasterLevel: 5,
          anyClassFeatures: turnOrRebukeUndeadFeatures,
        },
      },
      {
        id: "divine-fortune",
        name: "Divine Fortune",
        description:
          "Expend a turn or rebuke undead attempt for +4 on your next saving throw.",
        categories: ["divine"],
        prerequisites: {
          divineCasterLevel: 5,
          anyClassFeatures: turnOrRebukeUndeadFeatures,
        },
      },
      {
        id: "divine-justice",
        name: "Divine Justice",
        description:
          "Mark an opponent with a turn or rebuke attempt and reflect its damage back on your next melee hit.",
        categories: ["divine"],
        prerequisites: { anyClassFeatures: turnOrRebukeUndeadFeatures },
      },
      {
        id: "divine-ward",
        name: "Divine Ward",
        description:
          "Create a divine link with a willing ally, allowing touch spells to reach that ally at short range by spending a turn or rebuke attempt.",
        categories: ["divine"],
        prerequisites: { anyClassFeatures: turnOrRebukeUndeadFeatures },
      },
      {
        id: "profane-aura",
        name: "Profane Aura",
        description:
          "As a standard action, expend a rebuke undead attempt to create a mobile 60-foot-radius mist. Creatures within 5 feet of each other have concealment; creatures farther apart have total concealment. Mindless undead in the mist gain a +2 deflection bonus to AC. Track the mist and its effects manually.",
        categories: ["divine"],
        prerequisites: {
          divineCasterLevel: 9,
          classFeatures: ["Rebuke Undead"],
        },
      },
      {
        id: "sacred-healing-phb2",
        name: "Sacred Healing",
        description:
          "Expend a turn undead attempt for a bonus on Heal checks and healing from your conjuration (healing) spells for the turn.",
        categories: ["divine"],
        prerequisites: { classFeatures: ["Turn Undead"] },
      },
      {
        id: "sacred-purification",
        name: "Sacred Purification",
        description:
          "Expend a turn undead attempt to heal living creatures within 60 feet and damage undead in the same area. Each creature heals or takes damage equal to 1d8 plus your Charisma bonus, if any; resolve the effect manually.",
        categories: ["divine"],
        prerequisites: {
          feats: ["sacred-healing-phb2"],
          classFeatures: ["Turn Undead"],
        },
      },
      {
        id: "sacred-radiance",
        name: "Sacred Radiance",
        description:
          "As a standard action, expend a turn undead attempt to create mobile bright light in a 60-foot radius and shadowy illumination for another 60 feet; it negates magical darkness from spells of 3rd level or lower. For 10 minutes, non-evil creatures within 60 feet gain a +2 morale bonus on saves against fear, poison, disease, and death effects; evil creatures take a -2 penalty on saves against fear. Track the light and bonuses manually.",
        categories: ["divine"],
        prerequisites: {
          divineCasterLevel: 9,
          classFeatures: ["Turn Undead"],
        },
      },
      {
        id: "celestial-sorcerer-heritage",
        name: "Celestial Sorcerer Heritage",
        description:
          "Gain celestial heritage benefits, including a bonus spell and bonuses against electricity and petrification.",
        prerequisites: { classLevels: { sorcerer: 1 } },
      },
      {
        id: "celestial-sorcerer-aura",
        name: "Celestial Sorcerer Aura",
        description:
          "Expend a spell slot to create an aura that penalizes hostile creatures.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["celestial-sorcerer-heritage"],
        },
      },
      {
        id: "celestial-sorcerer-lance",
        name: "Celestial Sorcerer Lance",
        description:
          "Expend a spell slot to fire an energy bolt that harms evil creatures.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["celestial-sorcerer-heritage"],
        },
      },
      {
        id: "celestial-sorcerer-wings",
        name: "Celestial Sorcerer Wings",
        description:
          "As a standard action, expend a spell slot to gain a supernatural fly speed equal to twice your base land speed with good maneuverability for 1 round per slot level. Track the flight duration manually.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["celestial-sorcerer-heritage"],
        },
      },
      {
        id: "celestial-sorcerer-lore",
        name: "Celestial Sorcerer Lore",
        description:
          "Add three protective and travel spells to your spells known.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["celestial-sorcerer-heritage"],
          featChoices: [{
            anyOf: [
              "celestial-sorcerer-aura",
              "celestial-sorcerer-lance",
              "celestial-sorcerer-wings",
            ],
            count: 2,
          }],
        },
      },
      {
        id: "infernal-sorcerer-heritage",
        name: "Infernal Sorcerer Heritage",
        description:
          "Gain a bonus on saves against fire and poison equal to the number of Infernal Sorcerer Heritage feats you possess. When you cast a conjuration (summoning) spell to summon an evil outsider, gain +2 caster level for that spell; track this bonus manually.",
        prerequisites: { classLevels: { sorcerer: 1 } },
      },
      {
        id: "infernal-sorcerer-eyes",
        name: "Infernal Sorcerer Eyes",
        description:
          "As a swift action, expend a spell slot to see perfectly in darkness of any kind within line of sight and ignore concealment from darkness spells and effects for 10 minutes per slot level. Track the duration manually.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["infernal-sorcerer-heritage"],
        },
      },
      {
        id: "infernal-sorcerer-howl",
        name: "Infernal Sorcerer Howl",
        description:
          "Expend a spell slot to emit a 30-foot cone of sonic energy. Opponents in the cone take 2d6 sonic damage per slot level (Fortitude save DC 10 + slot level + your Charisma modifier for half damage); resolve the effect manually.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["infernal-sorcerer-heritage"],
        },
      },
      {
        id: "infernal-sorcerer-resistance",
        name: "Infernal Sorcerer Resistance",
        description:
          "Gain resistance to acid and cold based on your infernal heritage feats.",
        prerequisites: {
          classLevels: { sorcerer: 1 },
          feats: ["infernal-sorcerer-heritage"],
        },
      },
      {
        id: "blistering-spell",
        name: "Blistering Spell",
        description:
          "A fire spell deals +2 damage per spell level and penalizes creatures that fail their save; spell slot +1.",
        categories: ["metamagic"],
      },
      {
        id: "earthbound-spell",
        name: "Earthbound Spell",
        description:
          "Place an eligible spell in an adjacent square to trigger when a creature enters it; spell slot +2.",
        categories: ["metamagic"],
      },
      {
        id: "flash-frost-spell",
        name: "Flash Frost Spell",
        description:
          "An area cold spell deals +2 damage per spell level and leaves slippery ice; spell slot +1.",
        categories: ["metamagic"],
      },
      {
        id: "imbued-summoning",
        name: "Imbued Summoning",
        description:
          "When summoning a creature, also cast an eligible touch spell on it; spell slot +1.",
        categories: ["metamagic"],
        prerequisites: {
          feats: ["augment-summoning"],
          spellFocusSchools: ["Conjuration"],
        },
      },
      {
        id: "smiting-spell",
        name: "Smiting Spell",
        description:
          "Place an eligible touch spell into a weapon so it discharges on a successful hit; spell slot +1.",
        categories: ["metamagic"],
        prerequisites: { baseAttackBonus: 1, casterLevel: 1 },
      },
      {
        id: "blood-spiked-charger",
        name: "Blood-Spiked Charger",
        description:
          "Use spiked armor and shield spikes to perform three special charge maneuvers. Track the selected equipment and maneuvers manually.",
        categories: ["tactical"],
        prerequisites: {
          abilities: { str: 13 },
          feats: ["power-attack"],
          weaponFocusChoiceGroups: [["Armor Spikes"], ["Spiked Shield"]],
          weaponProficiencyChoiceGroups: [["Armor Spikes"], ["Spiked Shield"]],
          baseAttackBonus: 6,
        },
      },
      {
        id: "combat-cloak-expert",
        name: "Combat Cloak Expert",
        description:
          "Use a cloak to perform three defensive and offensive combat maneuvers. Track cloak placement and maneuver effects manually.",
        categories: ["tactical"],
        prerequisites: {
          abilities: { dex: 15, int: 13 },
          feats: ["combat-expertise", "dodge"],
          baseAttackBonus: 6,
        },
      },
      {
        id: "combat-panache",
        name: "Combat Panache",
        description:
          "Use Bluff, Intimidate, and Perform to employ three charismatic combat maneuvers. Track the checks and effects manually.",
        categories: ["tactical"],
        prerequisites: {
          skills: { Bluff: 8, Intimidate: 8 },
          anySkills: completeAdventurerAnyPerformRanks(8),
        },
      },
      {
        id: "einhander",
        name: "Einhander",
        description:
          "Use a one-handed weapon in three tactical maneuvers; track the weapon and maneuver conditions manually.",
        categories: ["tactical"],
        prerequisites: { skills: { Tumble: 6 }, baseAttackBonus: 6 },
      },
      {
        id: "mad-alchemist",
        name: "Mad Alchemist",
        description:
          "Use thrown alchemical items in three tactical maneuvers. Track the item, attack, and effects manually.",
        categories: ["tactical"],
        prerequisites: {
          feats: ["grenadier"],
          skills: { "Craft (alchemy)": 6 },
        },
      },
      {
        id: "shadow-striker",
        name: "Shadow Striker",
        description:
          "Use Hide and Move Silently to perform three tactical maneuvers; track the checks and combat effects manually.",
        categories: ["tactical"],
        prerequisites: { skills: { Hide: 12, "Move Silently": 12 } },
      },
    ] as CatalogFeat[]
  ).map((feat) => ({
    ...feat,
    sourceBook: playerHandbookIISourceBook,
  })),
] as CatalogFeat[]).map((feat: CatalogFeat) => ({
  ...feat,
  source: feat.source ?? "core-35-srd",
  sourceBook: feat.sourceBook ?? featCatalogSourceBook,
}));
