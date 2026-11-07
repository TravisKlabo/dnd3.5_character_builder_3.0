import type { ClericDomainId } from "./clericDomainIds";

type ClericDomainRuleMetadata = {
  name: string;
  classSkills?: readonly string[];
  spellNotes?: Partial<Record<number, string>>;
  source?: "dragonlance-user-pack";
  clericDeities?: readonly string[];
  mysticOnly?: boolean;
  mysticOnlyInDragonlance?: boolean;
};

export const clericDomainRuleMetadata: Record<ClericDomainId, ClericDomainRuleMetadata> = {
  air: { name: "Air", spellNotes: { 9: "Air spell only." } },
  animal: { name: "Animal", classSkills: ["Knowledge (nature)"], spellNotes: { 4: "Animals only.", 8: "Animals only." } },
  chaos: { name: "Chaos", spellNotes: { 9: "Chaos spell only." } },
  death: { name: "Death" },
  destruction: { name: "Destruction" },
  earth: { name: "Earth", spellNotes: { 9: "Earth spell only." } },
  evil: { name: "Evil", spellNotes: { 9: "Evil spell only." } },
  fire: { name: "Fire", spellNotes: { 3: "Resist cold or fire only.", 9: "Fire spell only." } },
  good: { name: "Good", spellNotes: { 9: "Good spell only." } },
  healing: { name: "Healing" },
  knowledge: { name: "Knowledge", classSkills: ["Knowledge (*)"] },
  law: { name: "Law", spellNotes: { 9: "Law spell only." } },
  luck: { name: "Luck" },
  magic: { name: "Magic" },
  alteration: { name: "Alteration", source: "dragonlance-user-pack", mysticOnly: true },
  community: { name: "Community", source: "dragonlance-user-pack", clericDeities: ["mishakal"] },
  forge: { name: "Forge", source: "dragonlance-user-pack", clericDeities: ["reorx"] },
  insight: { name: "Insight", source: "dragonlance-user-pack", clericDeities: ["zivilyn"] },
  liberation: { name: "Liberation", source: "dragonlance-user-pack", clericDeities: ["gilean"] },
  meditation: { name: "Meditation", source: "dragonlance-user-pack", clericDeities: ["majere", "zivilyn"] },
  mentalism: { name: "Mentalism", source: "dragonlance-user-pack", mysticOnly: true },
  necromancy: { name: "Necromancy", source: "dragonlance-user-pack", mysticOnly: true },
  passion: { name: "Passion", source: "dragonlance-user-pack", clericDeities: ["sirrion"] },
  pestilence: {
    name: "Pestilence",
    source: "dragonlance-user-pack",
    clericDeities: ["morgion"],
    spellNotes: { 2: "1d3 fiendish dire rats only." },
  },
  plant: { name: "Plant", classSkills: ["Knowledge (nature)"] },
  protection: { name: "Protection" },
  strength: { name: "Strength" },
  sun: { name: "Sun", mysticOnlyInDragonlance: true },
  restoration: { name: "Restoration", source: "dragonlance-user-pack", mysticOnly: true },
  storm: { name: "Storm", source: "dragonlance-user-pack", clericDeities: ["zeboim"] },
  travel: { name: "Travel", classSkills: ["Survival"] },
  trickery: { name: "Trickery", classSkills: ["Bluff", "Disguise", "Hide"] },
  treachery: { name: "Treachery", source: "dragonlance-user-pack", clericDeities: ["hiddukel"] },
  war: { name: "War" },
  water: { name: "Water", spellNotes: { 9: "Water spell only." } },
};
