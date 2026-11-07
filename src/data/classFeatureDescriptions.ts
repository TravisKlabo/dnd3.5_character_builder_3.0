const inspireCourageDescription =
  "With 3 Perform ranks, allies who hear you gain a morale bonus on attacks, weapon damage, and saves against fear and charm: +1, increasing to +2 at Bard 8, +3 at 14, and +4 at 20. The effect lasts while they hear you and 5 rounds afterward.";
const rogueSneakAttackDescription =
  "Conditional precision damage when the target is denied its Dexterity bonus to AC or flanked. Ranged sneak attacks require a target within 30 ft.; this damage is not multiplied on a critical hit. Target immunity and other restrictions must be checked. Saps and unarmed strikes can deal nonlethal sneak-attack damage.";
const nobleFavorDescription =
  "Call in a favor from a contact with a d20 check plus the listed bonus against a DM-set DC. Attempts per week equal half your Noble levels, rounded down (minimum one); you cannot take 10 or 20 or retry the same favor.";
const nobleCoordinateDescription =
  "When aiding another and giving directions, add the listed cooperation bonus to the normal +2 aid-another bonus. This cannot assist in combat.";
const nobleConfidenceDescription =
  "After a full round of listening and observation, inspire allies (not yourself) for 5 rounds. They gain +2 morale on saves and +1 morale on attack and weapon damage rolls; the number affected is half your Noble levels, rounded up.";
const nobleGreatnessDescription =
  "Once per day, after a full round of listening and observation, inspire up to the listed number of allies (not yourself) for 5 rounds. Each gains +2d6 temporary hit points, +2 competence on attacks, and +2 morale on saves.";
const druidWildShapeDescription =
  "Assume a known animal form for up to 1 hour per Druid level as a standard action that provokes no attacks of opportunity; the form's Hit Dice cannot exceed your Druid level. Each use heals 1 hit point per Hit Die, and gear melds and becomes nonfunctional. At Druid level 16, elemental forms may be Small, Medium, or Large; at level 20, Huge elementals are also available. Elemental uses are a separate daily pool. Eligible size, plant, and elemental forms and daily uses are shown in this feature; resolve form statistics and abilities manually.";
const paladinSmiteDescription =
  "Against an evil target, add your positive Charisma modifier to one melee attack and your Paladin level to damage. A non-evil target wastes the use. The listed daily uses are shown here; resolve the attack and use tracking manually.";
const paladinWeeklyRemoveDiseaseDescription = (uses: string) =>
  `Use remove disease as a spell-like ability ${uses} per week. Track weekly uses manually.`;
const bardicKnowledgeDescription =
  "Roll d20 + Bard level + Intelligence modifier to recall relevant lore; 5 ranks in Knowledge (history) add +2. The DM sets the DC, and you cannot take 10 or 20.";
const bardicMusicDescription =
  "Daily uses equal Bard level and are shared among music effects, except Suggestion and Mass Suggestion, which expend no use. Perform ranks required: 3 for Countersong, Fascinate, and Inspire Courage; 6 for Inspire Competence; 9 for Suggestion; 12 for Inspire Greatness; 15 for Song of Freedom; 18 for Inspire Heroics; 21 for Mass Suggestion. You must also meet each ability's Bard-level requirement. Starting an effect is a standard action unless its description says otherwise; some require concentration. While performing, you cannot cast spells or activate scrolls or wands. Deafness gives a 20% failure chance, but a failed attempt still uses a daily use. Track uses manually.";
const countersongDescription =
  "Each round, roll Perform while maintaining this effect (up to 10 rounds). A creature within 30 feet affected by a sonic or language-dependent magical effect can use your check result instead of its save if higher; an ongoing effect allows another save each round using your check result. It does not counter effects that allow no save or spells that merely have verbal components.";
const fascinateDescription =
  "With 3 Perform ranks, make a Perform check as the Will save DC for creatures within 90 feet that can see and hear you and are not threatened. Concentrate to maintain the effect for up to 1 round per Bard level; target one additional creature per three Bard levels beyond 1st.";

export const classFeatureDescriptions: Record<string, string> = {
  "Sneak Attack +1d6":
    rogueSneakAttackDescription,
  "Sneak Attack +2d6":
    rogueSneakAttackDescription,
  "Sneak Attack +3d6":
    rogueSneakAttackDescription,
  "Sneak Attack +4d6":
    rogueSneakAttackDescription,
  "Sneak Attack +5d6":
    rogueSneakAttackDescription,
  "Sneak Attack +6d6":
    rogueSneakAttackDescription,
  "Sneak Attack +7d6":
    rogueSneakAttackDescription,
  "Sneak Attack +8d6":
    rogueSneakAttackDescription,
  "Sneak Attack +9d6":
    rogueSneakAttackDescription,
  "Sneak Attack +10d6":
    rogueSneakAttackDescription,
  Evasion:
    "On a successful Reflex save against an attack that normally deals half damage, take no damage. Requires light or no armor and does not work while helpless; resolve the damage result manually.",
  "Improved Evasion":
    "On a failed Reflex save against an attack that normally deals half damage, take half damage; on a successful save, take none. Requires light or no armor and does not work while helpless; resolve the damage result manually.",
  "Uncanny Dodge":
    "Retain your Dexterity bonus to AC while flat-footed or attacked by an invisible foe, but not while immobilized or helpless. If another class already grants Uncanny Dodge, the classes' levels may grant Improved Uncanny Dodge instead.",
  "Improved Uncanny Dodge":
    "You cannot be flanked. A rogue with at least four more rogue levels can still flank you; levels in classes that grant Uncanny Dodge stack for this threshold. Flanking state is adjudicated manually.",
  "Bardic Knowledge":
    bardicKnowledgeDescription,
  "Turn or Rebuke Undead":
    "Good clerics and neutral clerics of good deities turn or destroy undead; evil clerics and neutral clerics of evil deities rebuke or command them. Neutral clerics of neutral deities choose permanently. Wee Jas's lawful neutral clerics rebuke; St. Cuthbert's clerics and non-evil clerics of Obad-Hai turn. Attempts per day equal 3 + Charisma modifier; 5 ranks in Knowledge (religion) add +2 on checks. Resolve attempts and effects manually.",
  Domains:
    "Choose two domains allowed by your deity, or representing your beliefs if you have no deity, subject to alignment restrictions. Gain both granted powers and one separate domain spell slot for each spell level you can cast; prepare a spell from either domain in each slot.",
  "Smite Evil": paladinSmiteDescription,
  "Smite Evil (4/day)": paladinSmiteDescription,
  "Smite Evil (5/day)": paladinSmiteDescription,
  "Lay on Hands":
    "At Paladin 2, with Charisma 12 or higher, heal a daily pool equal to Paladin level × positive Charisma modifier by touch. You may instead spend the pool to damage undead after a successful touch attack. Track the pool manually.",
  "Divine Health":
    "At Paladin 3, become immune to all diseases, including magical and supernatural diseases. Disease saves are marked immune while this feature is active.",
  "Special Mount":
    "At Paladin 5, call the same special mount once per day as a full-round action; it remains for 2 hours per Paladin level and can be dismissed as a free action. Mount advancement, gear, death, and recovery are managed manually.",
  "Remove Disease (1/week)":
    "Use remove disease as a spell-like ability once per week at Paladin 6, gaining one additional weekly use per three Paladin levels after 6th. Track weekly uses manually.",
  "Remove Disease (2/week)":
    paladinWeeklyRemoveDiseaseDescription("twice"),
  "Remove Disease (3/week)":
    paladinWeeklyRemoveDiseaseDescription("three times"),
  "Remove Disease (4/week)":
    paladinWeeklyRemoveDiseaseDescription("four times"),
  "Remove Disease (5/week)":
    paladinWeeklyRemoveDiseaseDescription("five times"),
  "Bardic Music":
    bardicMusicDescription,
  "Animal Companion":
    "Druids use their full Druid level; Rangers use half their Ranger level as effective Druid level. Levels in multiple classes that grant an animal companion stack. Alternative companions apply their list's level adjustment and cannot be chosen if it reduces effective level below 1. Companion selection, advancement, and statistics are managed manually.",
  "Nature Sense":
    "Gain a +2 bonus on Knowledge (nature) and Survival checks.",
  "Trackless Step":
    "Leave no trail in natural surroundings and cannot be tracked unless you choose to leave a trail.",
  "Resist Nature's Lure":
    "+4 bonus on saving throws against the spell-like abilities of fey.",
  "Venom Immunity":
    "Immune to all poisons.",
  "A Thousand Faces":
    "At will in natural form, change your appearance as disguise self; this is not an illusion and does not change your possessions.",
  "Timeless Body":
    "No longer take ability-score penalties from aging and cannot be magically aged; existing penalties remain, bonuses accrue, and you still die of old age.",
  "Scribe Scroll":
    "Gain Scribe Scroll as a bonus feat at Wizard 1.",
  Spellbook:
    "At Wizard 1, record all available 0-level wizard spells and three 1st-level spells, plus one more 1st-level spell per point of Intelligence bonus. Add two free wizard spells at each new wizard level from spell levels you can cast. Spell preparation requires the spellbook, except read magic can be prepared from memory; physical book capacity is tracked manually.",
  "Summon Familiar":
    "A Wizard or Sorcerer can obtain one familiar after 24 hours and 100 gp in materials. Wizard and Sorcerer levels stack for familiar abilities; the familiar's special bonuses to its master apply only within 1 mile. Track its type, statistics, and death or replacement manually.",
  "Wizard Bonus Feat":
    "Gain an additional feat at Wizard levels 5, 10, 15, and 20; normal feat prerequisites still apply.",
  "Wild Shape (1/day)": druidWildShapeDescription,
  "Wild Shape (2/day)": druidWildShapeDescription,
  "Wild Shape (3/day)": druidWildShapeDescription,
  "Wild Shape (Large)": druidWildShapeDescription,
  "Wild Shape (4/day)": druidWildShapeDescription,
  "Wild Shape (Tiny)": druidWildShapeDescription,
  "Wild Shape (plant)": druidWildShapeDescription,
  "Wild Shape (5/day)": druidWildShapeDescription,
  "Wild Shape (Huge)": druidWildShapeDescription,
  "Wild Shape (elemental 1/day)": druidWildShapeDescription,
  "Wild Shape (elemental 1/day, up to Large)": druidWildShapeDescription,
  "Wild Shape (6/day, elemental 2/day)": druidWildShapeDescription,
  "Wild Shape (elemental 3/day, Huge elemental)": druidWildShapeDescription,
  Track:
    "Rangers gain the Track feat as a bonus feat at 1st level. Use Survival to follow tracks; check DCs and speed penalties depend on surface and conditions.",
  Endurance:
    "Rangers gain the Endurance feat as a bonus feat at 3rd level.",
  "Wild Empathy":
    "Roll 1d20 + the class level that granted this feature + Charisma to improve an animal's attitude. It can affect magical beasts with Intelligence 1–2 at a –4 penalty; resolve the attitude change manually.",
  "Woodland Stride":
    "Move through natural undergrowth at normal speed without damage or impairment; magically manipulated undergrowth still affects you.",
  "Swift Tracker":
    "Track at normal speed without the usual penalty, or at double speed with a –10 penalty on Survival checks.",
  Camouflage:
    "Use Hide in natural terrain even without cover or concealment; resolve terrain and visibility manually.",
  "Hide in Plain Sight":
    "Use Hide in natural terrain while being observed; resolve terrain and visibility manually.",
  Countersong:
    countersongDescription,
  Fascinate:
    fascinateDescription,
  "Inspire Competence":
    "With 6 Perform ranks, help one ally within 30 feet who can see and hear you. They gain +2 competence on checks with one skill while they hear you; maintain concentration for up to 2 minutes. You cannot target yourself.",
  Suggestion:
    "At Bard 6 with 9 Perform ranks, suggest an action to a creature you have already fascinated. The Will save DC is 10 + half your Bard level + your Charisma modifier. This use does not expend a daily Bardic Music use.",
  "Inspire Greatness":
    "At Bard 9 with 12 Perform ranks, inspire yourself or a willing ally within 30 feet. The target gains 2 bonus d10 Hit Dice, temporary hit points, +2 competence on attacks, and +1 competence on Fortitude saves. Each three Bard levels beyond 9th adds one target; the effect lasts while they hear you and 5 rounds afterward.",
  "Song of Freedom":
    "At Bard 12 with 15 Perform ranks, create an effect equivalent to break enchantment on one target within 30 feet (caster level equals Bard level). This takes 1 minute of uninterrupted concentration and cannot target yourself.",
  "Inspire Heroics":
    "At Bard 15 with 18 Perform ranks, inspire yourself or a willing ally within 30 feet who hears you sing for a full round. They gain +4 morale on saves and +4 dodge to AC for as long as they hear you and 5 rounds afterward; each three Bard levels beyond 15th adds one target.",
  "Mass Suggestion":
    "At Bard 18 with 21 Perform ranks, use Suggestion simultaneously on any number of creatures you have already fascinated. Like Suggestion, this does not expend a daily Bardic Music use.",
  "Inspire Courage": inspireCourageDescription,
  "Inspire Courage +1": inspireCourageDescription,
  "Inspire Courage +2": inspireCourageDescription,
  "Inspire Courage +3": inspireCourageDescription,
  "Inspire Courage +4": inspireCourageDescription,
  "Bonus Class Skill":
    "At 1st Noble level, designate any one cross-class skill as a class skill.",
  "Favor +1": nobleFavorDescription,
  "Favor +2": nobleFavorDescription,
  "Favor +3": nobleFavorDescription,
  "Favor +4": nobleFavorDescription,
  "Favor +5": nobleFavorDescription,
  "Coordinate +1": nobleCoordinateDescription,
  "Coordinate +2": nobleCoordinateDescription,
  "Coordinate +3": nobleCoordinateDescription,
  "Coordinate +4": nobleCoordinateDescription,
  "Coordinate +5": nobleCoordinateDescription,
  "Inspire Confidence (1/day)": nobleConfidenceDescription,
  "Inspire Confidence (2/day)": nobleConfidenceDescription,
  "Inspire Confidence (3/day)": nobleConfidenceDescription,
  "Inspire Confidence (4/day)": nobleConfidenceDescription,
  "Inspire Confidence (5/day)": nobleConfidenceDescription,
  "Inspire Greatness (1 ally)": nobleGreatnessDescription,
  "Inspire Greatness (2 allies)": nobleGreatnessDescription,
  "Inspire Greatness (3 allies)": nobleGreatnessDescription,
  "Inspire Greatness (4 allies)": nobleGreatnessDescription,
  "Favored Enemy":
    "Choose a creature type (or an organization in Dragonlance) at Ranger levels 1, 5, 10, 15, and 20; at each later choice, assign its +2 increase to one favored enemy. Humanoids and outsiders require a PHB-listed subtype. Bonuses affect Bluff, Listen, Sense Motive, Spot, Survival, and weapon damage, but are recorded only—not applied automatically. Overlapping categories do not stack.",
  Domain:
    "Mystics choose one domain. Its granted power and domain spells are tracked manually.",
  "Combat Style":
    "At Ranger 2, choose archery (treated as having Rapid Shot) or two-weapon combat (treated as having Two-Weapon Fighting), even without the normal prerequisites. Style benefits function only in light or no armor.",
  "Improved Combat Style":
    "At Ranger 6, follow the chosen style: archery grants Manyshot or two-weapon combat grants Improved Two-Weapon Fighting, even without the normal prerequisites. Style benefits function only in light or no armor.",
  "Combat Style Mastery":
    "At Ranger 11, follow the chosen style: archery grants Improved Precise Shot or two-weapon combat grants Greater Two-Weapon Fighting, even without the normal prerequisites. Style benefits function only in light or no armor.",
};
