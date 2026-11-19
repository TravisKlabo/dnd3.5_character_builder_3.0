import type { SkillTrickCategory } from "../domain";

export interface SkillTrickPrerequisites {
  skills?: Record<string, number>;
  anySkillGroups?: Array<{ skills: string[]; ranks: number }>;
  anySkillPrefix?: string;
  anySkillRanks?: number;
  maximumSize?: "Fine" | "Diminutive" | "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan" | "Colossal";
  feats?: string[];
  weaponProficiencies?: string[];
}

export interface SkillTrickDefinition {
  id: string;
  name: string;
  category: SkillTrickCategory;
  prerequisites: SkillTrickPrerequisites;
}

export const skillTrickCatalog: SkillTrickDefinition[] = [
  { id: "assume-quirk", name: "Assume Quirk", category: "interaction", prerequisites: { skills: { Disguise: 5 } } },
  { id: "group-fake-out", name: "Group Fake-Out", category: "interaction", prerequisites: { skills: { Bluff: 8 } } },
  { id: "never-outnumbered", name: "Never Outnumbered", category: "interaction", prerequisites: { skills: { Intimidate: 8 } } },
  { id: "second-impression", name: "Second Impression", category: "interaction", prerequisites: { skills: { Bluff: 5, Disguise: 5 } } },
  { id: "social-recovery", name: "Social Recovery", category: "interaction", prerequisites: { skills: { Bluff: 8, Diplomacy: 5 } } },
  { id: "timely-misdirection", name: "Timely Misdirection", category: "interaction", prerequisites: { skills: { Bluff: 8 } } },
  { id: "clever-improviser", name: "Clever Improviser", category: "manipulation", prerequisites: { skills: { "Disable Device": 5, "Open Lock": 5 } } },
  { id: "conceal-spellcasting", name: "Conceal Spellcasting", category: "manipulation", prerequisites: { skills: { Concentration: 1, "Sleight of Hand": 5, Spellcraft: 1 } } },
  { id: "easy-escape", name: "Easy Escape", category: "manipulation", prerequisites: { maximumSize: "Medium", skills: { "Escape Artist": 8 } } },
  { id: "false-theurgy", name: "False Theurgy", category: "manipulation", prerequisites: { anySkillGroups: [{ skills: ["Bluff", "Sleight of Hand"], ranks: 8 }], skills: { Spellcraft: 8 } } },
  { id: "healing-hands", name: "Healing Hands", category: "manipulation", prerequisites: { skills: { Heal: 5 } } },
  { id: "hidden-blade", name: "Hidden Blade", category: "manipulation", prerequisites: { skills: { "Sleight of Hand": 5 }, feats: ["quick-draw"] } },
  { id: "mosquitos-bite", name: "Mosquito's Bite", category: "manipulation", prerequisites: { skills: { "Sleight of Hand": 12 } } },
  { id: "opening-tap", name: "Opening Tap", category: "manipulation", prerequisites: { skills: { "Open Lock": 12 } } },
  { id: "quick-escape", name: "Quick Escape", category: "manipulation", prerequisites: { skills: { "Escape Artist": 12 } } },
  { id: "shrouded-dance", name: "Shrouded Dance", category: "manipulation", prerequisites: { skills: { Hide: 8, "Perform (dance)": 5 } } },
  { id: "sudden-draw", name: "Sudden Draw", category: "manipulation", prerequisites: { skills: { "Sleight of Hand": 8 }, feats: ["quick-draw"] } },
  { id: "whip-climber", name: "Whip Climber", category: "manipulation", prerequisites: { skills: { "Use Rope": 5 }, weaponProficiencies: ["Whip"] } },
  { id: "clarity-of-vision", name: "Clarity of Vision", category: "mental", prerequisites: { skills: { Spot: 12 } } },
  { id: "collector-of-stories", name: "Collector of Stories", category: "mental", prerequisites: { anySkillPrefix: "Knowledge (", anySkillRanks: 5 } },
  { id: "listen-to-this", name: "Listen to This", category: "mental", prerequisites: { skills: { Listen: 5 } } },
  { id: "magical-appraisal", name: "Magical Appraisal", category: "mental", prerequisites: { skills: { Appraise: 5, "Knowledge (arcana)": 5, Spellcraft: 12 } } },
  { id: "point-it-out", name: "Point it Out", category: "mental", prerequisites: { skills: { Spot: 8 } } },
  { id: "spot-the-weak-point", name: "Spot the Weak Point", category: "mental", prerequisites: { skills: { Spot: 12 } } },
  { id: "swift-concentration", name: "Swift Concentration", category: "mental", prerequisites: { skills: { Concentration: 12 } } },
  { id: "acrobatic-backstab", name: "Acrobatic Backstab", category: "movement", prerequisites: { skills: { Tumble: 12 } } },
  { id: "back-on-your-feet", name: "Back on Your Feet", category: "movement", prerequisites: { skills: { Tumble: 12 } } },
  { id: "corner-perch", name: "Corner Perch", category: "movement", prerequisites: { skills: { Climb: 8 } } },
  { id: "dismount-attack", name: "Dismount Attack", category: "movement", prerequisites: { skills: { Ride: 5 } } },
  { id: "escape-attack", name: "Escape Attack", category: "movement", prerequisites: { skills: { "Escape Artist": 8 } } },
  { id: "extreme-leap", name: "Extreme Leap", category: "movement", prerequisites: { skills: { Jump: 5 } } },
  { id: "leaping-climber", name: "Leaping Climber", category: "movement", prerequisites: { skills: { Climb: 5, Jump: 5 } } },
  { id: "nimble-charge", name: "Nimble Charge", category: "movement", prerequisites: { skills: { Balance: 5 } } },
  { id: "nimble-stand", name: "Nimble Stand", category: "movement", prerequisites: { skills: { Tumble: 8 } } },
  { id: "quick-swimmer", name: "Quick Swimmer", category: "movement", prerequisites: { skills: { Swim: 5 } } },
  { id: "slipping-past", name: "Slipping Past", category: "movement", prerequisites: { skills: { "Escape Artist": 5, Tumble: 5 } } },
  { id: "speedy-ascent", name: "Speedy Ascent", category: "movement", prerequisites: { skills: { Climb: 5 } } },
  { id: "tumbling-crawl", name: "Tumbling Crawl", category: "movement", prerequisites: { skills: { Tumble: 5 } } },
  { id: "twisted-charge", name: "Twisted Charge", category: "movement", prerequisites: { skills: { Balance: 5, Tumble: 5 } } },
  { id: "up-the-hill", name: "Up the Hill", category: "movement", prerequisites: { skills: { Balance: 5, Jump: 5 } } },
  { id: "walk-the-walls", name: "Walk the Walls", category: "movement", prerequisites: { skills: { Climb: 12, Tumble: 5 } } },
  { id: "wall-jumper", name: "Wall Jumper", category: "movement", prerequisites: { skills: { Climb: 5, Jump: 5 } } },
];
