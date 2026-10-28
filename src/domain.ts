import type { StoreItem } from './data/itemTypes'
import { getEffectiveAbilityScore } from './abilityEquipment'
import type { CombatEffect } from './combatEffects'
import type { ClericDomainId } from './data/clericDomains'

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityScores = Record<AbilityName, number>

export type ClassId = 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'wizard' | 'mystic' | 'noble'
export type PrestigeClassId = 'knight-of-the-crown' | 'knight-of-the-sword' | 'knight-of-the-rose' | 'knight-of-neraka' | 'renegade-hunter' | 'wizard-of-high-sorcery' | 'white-robed-wizard' | 'red-robed-wizard' | 'black-robed-wizard' | 'master-of-the-way' | 'arcane-archer' | 'arcane-trickster' | 'assassin' | 'dragon-disciple' | 'duelist' | 'dwarven-defender' | 'eldritch-knight' | 'hierophant' | 'horizon-walker' | 'loremaster' | 'mystic-theurge' | 'shadowdancer' | 'thaumaturgist'
export type FeatId = string
export type SpellAcquisition = 'starting' | 'level-up' | 'spellbook' | 'scroll' | 'research' | 'reward'
export interface WizardSpellLearning {
  source: 'scroll' | 'spellbook' | 'research' | 'reward'
  learnedAt: string
  decipherMethod?: 'read-magic' | 'author' | 'previously-deciphered' | 'spellcraft'
  decipherTotal?: number
  spellcraftTotal?: number
}

export type ContentSourceId = 'core-35-srd' | 'dragonlance-user-pack'

export interface ContentSource {
  id: ContentSourceId
  name: string
  enabled: boolean
  attribution: string
}

export const contentSources: Record<ContentSourceId, ContentSource> = {
  'core-35-srd': { id: 'core-35-srd', name: 'D&D 3.5 Core SRD', enabled: true, attribution: 'Open game rules content' },
  'dragonlance-user-pack': { id: 'dragonlance-user-pack', name: 'Dragonlance user content pack', enabled: false, attribution: 'Enable only with authorized source data' },
}

export interface ClassDefinition {
  id: ClassId
  name: string
  source: ContentSourceId
  hitDie: 4 | 6 | 8 | 10 | 12
  skillPoints: number
  baseAttackBonus: 'good' | 'medium' | 'poor'
  fortitude: 'good' | 'poor'
  reflex: 'good' | 'poor'
  will: 'good' | 'poor'
  spellcasting: boolean
}

export interface DeityDefinition {
  id: string
  name: string
  alignment: string
  description: string
  source: ContentSourceId
  clericDomains?: readonly ClericDomainId[]
  warDomainFavoredWeapon?: string
}

export const deityDefinitions: DeityDefinition[] = [
  { id: 'bahamut', name: 'Bahamut', alignment: 'Lawful Good', description: 'Dragon deity of justice, protection, and good dragons.', source: 'core-35-srd', clericDomains: ['air', 'good', 'luck', 'protection', 'strength'] },
  { id: 'corellon', name: 'Corellon Larethian', alignment: 'Chaotic Good', description: 'Elven deity of art, magic, and freedom.', source: 'core-35-srd', clericDomains: ['chaos', 'good', 'protection', 'war'], warDomainFavoredWeapon: 'Longsword' },
  { id: 'moradin', name: 'Moradin', alignment: 'Lawful Good', description: 'Dwarven deity of creation, craft, and protection.', source: 'core-35-srd', clericDomains: ['earth', 'good', 'law', 'protection'] },
  { id: 'pelor', name: 'Pelor', alignment: 'Neutral Good', description: 'Deity of the sun, healing, and goodness.', source: 'core-35-srd', clericDomains: ['good', 'healing', 'strength', 'sun'] },
  { id: 'heironeous', name: 'Heironeous', alignment: 'Lawful Good', description: 'Deity of chivalry, honor, and valor.', source: 'core-35-srd', clericDomains: ['good', 'law', 'war'], warDomainFavoredWeapon: 'Longsword' },
  { id: 'kord', name: 'Kord', alignment: 'Chaotic Neutral', description: 'Deity of strength, athleticism, and storms.', source: 'core-35-srd', clericDomains: ['chaos', 'good', 'luck', 'strength'] },
  { id: 'st-cuthbert', name: 'St. Cuthbert', alignment: 'Lawful Neutral', description: 'Deity of common sense, wisdom, and retribution.', source: 'core-35-srd', clericDomains: ['destruction', 'law', 'protection', 'strength'] },
  { id: 'we-jas', name: 'Wee Jas', alignment: 'Lawful Neutral', description: 'Deity of magic, death, and law.', source: 'core-35-srd', clericDomains: ['death', 'law', 'magic'] },
  { id: 'obad-hai', name: 'Obad-Hai', alignment: 'True Neutral', description: 'Deity of nature, wilderness, and balance.', source: 'core-35-srd', clericDomains: ['air', 'animal', 'earth', 'fire', 'plant', 'water'] },
  { id: 'hextor', name: 'Hextor', alignment: 'Lawful Evil', description: 'Deity of tyranny, war, and discord.', source: 'core-35-srd', clericDomains: ['destruction', 'evil', 'law', 'war'], warDomainFavoredWeapon: 'Flail' },
  { id: 'nerull', name: 'Nerull', alignment: 'Neutral Evil', description: 'Deity of death, darkness, and murder.', source: 'core-35-srd', clericDomains: ['death', 'evil', 'trickery'] },
  { id: 'erythnul', name: 'Erythnul', alignment: 'Chaotic Evil', description: 'Deity of envy, slaughter, and panic.', source: 'core-35-srd', clericDomains: ['chaos', 'evil', 'trickery', 'war'], warDomainFavoredWeapon: 'Morningstar' },
  { id: 'paladine', name: 'Paladine', alignment: 'Lawful Good', description: 'God of good dragons, guardianship, and justice.', source: 'dragonlance-user-pack' },
  { id: 'mishakal', name: 'Mishakal', alignment: 'Neutral Good', description: 'Goddess of healing, compassion, and restoration.', source: 'dragonlance-user-pack' },
  { id: 'kiri-jolith', name: 'Kiri-Jolith', alignment: 'Lawful Good', description: 'God of honor, courage, and righteous battle.', source: 'dragonlance-user-pack' },
  { id: 'majere', name: 'Majere', alignment: 'Lawful Neutral', description: 'God of discipline, meditation, and insight.', source: 'dragonlance-user-pack' },
  { id: 'gilean', name: 'Gilean', alignment: 'True Neutral', description: 'God of knowledge, balance, and free will.', source: 'dragonlance-user-pack' },
  { id: 'reorx', name: 'Reorx', alignment: 'True Neutral', description: 'God of forging, invention, and dwarven craft.', source: 'dragonlance-user-pack' },
  { id: 'habbakuk', name: 'Habbakuk', alignment: 'Chaotic Good', description: 'God of animals, the sea, and freedom.', source: 'dragonlance-user-pack' },
  { id: 'branchala', name: 'Branchala', alignment: 'Chaotic Good', description: 'God of music, inspiration, and joy.', source: 'dragonlance-user-pack' },
  { id: 'takhisis', name: 'Takhisis', alignment: 'Lawful Evil', description: 'Goddess of darkness, tyranny, and evil dragons.', source: 'dragonlance-user-pack' },
  { id: 'sargonnas', name: 'Sargonnas', alignment: 'Chaotic Evil', description: 'God of vengeance, fire, and destruction.', source: 'dragonlance-user-pack' },
  { id: 'chemosh', name: 'Chemosh', alignment: 'Neutral Evil', description: 'God of undeath, false hope, and corruption.', source: 'dragonlance-user-pack' },
  { id: 'morgion', name: 'Morgion', alignment: 'Neutral Evil', description: 'God of disease, decay, and secrets.', source: 'dragonlance-user-pack' },
  { id: 'nuitari', name: 'Nuitari', alignment: 'Lawful Evil', description: 'God of forbidden magic, darkness, and ambition.', source: 'dragonlance-user-pack' },
  { id: 'zeboim', name: 'Zeboim', alignment: 'Chaotic Evil', description: 'Goddess of storms, the sea, and destruction.', source: 'dragonlance-user-pack' },
]

export interface RaceDefinition {
  id: string
  name: string
  source: ContentSourceId
  abilityModifiers: Partial<Record<AbilityName, number>>
  racialSkillBonuses?: Partial<Record<string, number>>
  racialSavingThrowBonus?: number
  racialSituationalSaveBonuses?: Partial<Record<SavingThrowCondition, number>>
  racialAttackBonuses?: Partial<Record<CombatTargetType, number>>
  racialDodgeACBonuses?: Partial<Record<CombatTargetType, number>>
  levelAdjustment?: number
  size?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal'
  speed?: number
  traits?: string[]
  specialAbilities?: string[]
}

export type SavingThrowCondition = 'fear' | 'poison' | 'spell' | 'enchantment' | 'illusion'
export type CombatTargetType = 'orc' | 'goblinoid' | 'kobold' | 'giant'

export interface PrestigeClassDefinition {
  id: PrestigeClassId
  name: string
  source: ContentSourceId
  prerequisites: { bab?: number; ability?: Partial<Record<AbilityName, number>>; feats?: string[]; classes?: ClassId[]; races?: string[] }
  features: string[]
}

export interface ClassLevel {
  classId: ClassId
  level: number
}

export interface PrestigeClassLevel {
  classId: ClassId
  prestigeClassId: PrestigeClassId
  level: number
}

export interface FeatDefinition {
  id: FeatId
  name: string
  source: ContentSourceId
  description: string
  prerequisites?: {
    abilities?: Partial<Record<AbilityName, number>>
    baseAttackBonus?: number
    casterLevel?: number
    classLevels?: Partial<Record<ClassId, number>>
    feats?: FeatId[]
  }
  fighterBonus?: boolean
}

export interface Character {
  name: string
  player: string
  gender?: 'Male' | 'Female' | 'Other' | ''
  age?: string
  height?: string
  weight?: string
  hairColor?: string
  eyeColor?: string
  skinColor?: string
  temporaryHitPoints?: number
  currentHitPoints?: number
  nonlethalDamage?: number
  combatRound?: number
  combatEffects?: CombatEffect[]
  damageReduction?: string
  spellResistance?: string
  notes?: string
  race: string
  alignment: string
  abilities: AbilityScores
  classLevels: (ClassLevel | PrestigeClassLevel)[]
  hitPoints: number
  feats: string[]
  featSelections: Record<string, FeatId | ''>
  featWeaponSelections?: Record<string, string>
  skills: Record<string, number>
  skillRanksByClass: Record<string, Record<string, number>>
  knownSpells: string[]
  knownSpellClasses?: Record<string, ClassId>
  knownSpellsByClass?: Partial<Record<ClassId, string[]>>
  spellAcquisitionByClass?: Partial<Record<ClassId, Record<string, SpellAcquisition>>>
  wizardSpellLearning?: Record<string, WizardSpellLearning>
  preparedSpells: string[]
  preparedSpellsByClass?: Partial<Record<ClassId, string[]>>
  clericDomains?: import('./data/clericDomains').ClericDomainId[]
  clericDomainPreparation?: Record<string, import('./data/clericDomains').ClericDomainSpell>
  clericDomainExpended?: number[]
  expendedSpellSlotsByClass?: Partial<Record<ClassId, Record<string, number[]>>>
  equipment: Record<string, string>
  mainWeaponGrip?: 'one-handed' | 'two-handed'
  doubleWeaponMode?: boolean
  doubleWeaponPrimaryEnd?: 'first' | 'second'
  towerShieldTotalCover?: boolean
  shieldBashMode?: boolean
  inventory: Record<string, number>
  languages: string[]
  prestigeClass?: PrestigeClassId
  classFeatures?: string[]
  customItems?: StoreItem[]
  deity?: string
  highSorceryOrder?: 'white' | 'red' | 'black'
}

export interface LevelUpDraft {
  original: Character
  proposed: Character
  classId: ClassId
  hitPointRoll: number | null
  abilityIncrease: AbilityName | null
  validationErrors: string[]
}

export const classDefinitions: Record<ClassId, ClassDefinition> = {
  barbarian: { id: 'barbarian', name: 'Barbarian', source: 'core-35-srd', hitDie: 12, skillPoints: 4, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'poor', spellcasting: false },
  bard: { id: 'bard', name: 'Bard', source: 'core-35-srd', hitDie: 6, skillPoints: 6, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'good', spellcasting: true },
  fighter: { id: 'fighter', name: 'Fighter', source: 'core-35-srd', hitDie: 10, skillPoints: 2, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'poor', spellcasting: false },
  druid: { id: 'druid', name: 'Druid', source: 'core-35-srd', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  monk: { id: 'monk', name: 'Monk', source: 'core-35-srd', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'good', will: 'good', spellcasting: false },
  paladin: { id: 'paladin', name: 'Paladin', source: 'core-35-srd', hitDie: 10, skillPoints: 2, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  ranger: { id: 'ranger', name: 'Ranger', source: 'core-35-srd', hitDie: 8, skillPoints: 6, baseAttackBonus: 'good', fortitude: 'good', reflex: 'good', will: 'poor', spellcasting: true },
  rogue: { id: 'rogue', name: 'Rogue', source: 'core-35-srd', hitDie: 6, skillPoints: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'poor', spellcasting: false },
  sorcerer: { id: 'sorcerer', name: 'Sorcerer', source: 'core-35-srd', hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  wizard: { id: 'wizard', name: 'Wizard', source: 'core-35-srd', hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  cleric: { id: 'cleric', name: 'Cleric', source: 'core-35-srd', hitDie: 8, skillPoints: 2, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  mystic: { id: 'mystic', name: 'Mystic', source: 'dragonlance-user-pack', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  noble: { id: 'noble', name: 'Noble', source: 'dragonlance-user-pack', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'good', spellcasting: false },
}

export const raceDefinitions: Record<string, RaceDefinition> = {
  human: { id: 'human', name: 'Human', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: {}, specialAbilities: ['Bonus feat', 'Extra skill points'] },
  dwarf: { id: 'dwarf', name: 'Dwarf', source: 'core-35-srd', size: 'Medium', speed: 20, abilityModifiers: { con: 2, cha: -2 }, racialSituationalSaveBonuses: { poison: 2, spell: 2 }, racialAttackBonuses: { orc: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, specialAbilities: ['Darkvision 60 ft.', 'Stonecunning', 'Stability', 'Waraxe/urgrosh familiarity', '+2 saves vs. poison/spells', '+1 attack vs. orcs/goblinoids; +4 dodge AC vs. giants', 'Stone/metal Appraise/Craft +2'] },
  elf: { id: 'elf', name: 'Elf', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: -2 }, racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision', 'Sleep immunity', 'Enchantment saves +2', 'Elf weapon proficiencies'] },
  halfling: { id: 'halfling', name: 'Halfling', source: 'core-35-srd', size: 'Small', speed: 20, abilityModifiers: { dex: 2, str: -2 }, racialSkillBonuses: { Climb: 2, Jump: 2, Listen: 2, 'Move Silently': 2 }, racialSavingThrowBonus: 1, racialSituationalSaveBonuses: { fear: 2 }, specialAbilities: ['All saves +1; fear +2', 'Thrown/slings attacks +1'] },
  gnome: { id: 'gnome', name: 'Gnome', source: 'core-35-srd', size: 'Small', speed: 20, abilityModifiers: { con: 2, str: -2 }, racialSkillBonuses: { Listen: 2 }, racialSituationalSaveBonuses: { illusion: 2 }, racialAttackBonuses: { kobold: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, specialAbilities: ['Low-light vision', 'Illusion saves +2; DC +1', 'Hooked hammer familiarity', '+1 attack vs. kobolds/goblinoids; +4 dodge AC vs. giants', 'Craft (alchemy) +2', 'Spell-like abilities (1/day)'] },
  'half-orc': { id: 'half-orc', name: 'Half-orc', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: { str: 2, int: -2, cha: -2 }, specialAbilities: ['Darkvision 60 ft.', 'Orc blood'] },
  'half-elf': { id: 'half-elf', name: 'Half-elf', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: {}, racialSkillBonuses: { Listen: 1, Search: 1, Spot: 1, Diplomacy: 2, 'Gather Information': 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision', 'Sleep immunity', 'Enchantment saves +2', 'Elven blood'] },
  kender: { id: 'kender', name: 'Kender', source: 'dragonlance-user-pack', size: 'Small', speed: 20, abilityModifiers: { str: -2, dex: 2, cha: 2 }, traits: ['Fearless', 'Kender Pockets', 'Taunt', 'Curiosity'] },
  draconian: { id: 'draconian', name: 'Draconian', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { str: 2, con: 2, cha: -2 }, traits: ['Darkvision', 'Draconic Heritage', 'Death Throes'] },
  'qualinesti-elf': { id: 'qualinesti-elf', name: 'Qualinesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { str: -2, dex: 2, con: -2, int: 2 }, traits: ['Keen Senses', 'Low-Light Vision', 'Elven Resistance'] },
  'silvanesti-elf': { id: 'silvanesti-elf', name: 'Silvanesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { str: -2, dex: 2, con: -2, int: 2 }, traits: ['Keen Senses', 'Low-Light Vision', 'Elven Resistance'] },
  'kagonesti-elf': { id: 'kagonesti-elf', name: 'Kagonesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: {}, traits: ['Wild Elf heritage', 'Keen Senses', 'Low-Light Vision'] },
  'dargonesti-elf': { id: 'dargonesti-elf', name: 'Dargonesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: {}, traits: ['Aquatic Elf heritage', 'Low-Light Vision', 'Water adaptation'] },
  'dimernesti-elf': { id: 'dimernesti-elf', name: 'Dimernesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: {}, traits: ['Aquatic Elf heritage', 'Low-Light Vision', 'Water adaptation'] },
  'hill-dwarf': { id: 'hill-dwarf', name: 'Hill Dwarf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { con: 2, cha: -2 }, traits: ['Darkvision', 'Dwarven resilience', 'Stonecunning'] },
  'mountain-dwarf': { id: 'mountain-dwarf', name: 'Mountain Dwarf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { con: 2, cha: -2 }, traits: ['Darkvision', 'Dwarven resilience', 'Stonecunning'] },
  'deep-dwarf': { id: 'deep-dwarf', name: 'Deep Dwarf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { con: 2, cha: -2 }, traits: ['Deep Darkvision', 'Dwarven resilience', 'Stonecunning'] },
  minotaur: { id: 'minotaur', name: 'Minotaur', source: 'dragonlance-user-pack', levelAdjustment: 2, size: 'Medium', abilityModifiers: { str: 4, con: 2, int: -2, cha: -2 }, traits: ['Darkvision', 'Natural Armor', 'Powerful Build'] },
  irda: { id: 'irda', name: 'Irda', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { int: 2, wis: 2, cha: 2 }, traits: ['Ancient Heritage', 'Change Shape', 'Low-Light Vision'] },
  'gully-dwarf': { id: 'gully-dwarf', name: 'Gully Dwarf', source: 'dragonlance-user-pack', size: 'Small', speed: 20, abilityModifiers: { str: -4, dex: 2, con: 2, int: -2, cha: -4 }, traits: ['Darkvision', 'Gully dwarf cunning', 'Small stature'] },
}

export const dragonlancePrestigeClasses: Record<PrestigeClassId, PrestigeClassDefinition> = {
  'arcane-archer': { id: 'arcane-archer', name: 'Arcane Archer', source: 'core-35-srd', prerequisites: { bab: 6, ability: { dex: 13 }, feats: ['Point Blank Shot', 'Precise Shot'], classes: ['fighter', 'ranger'] }, features: ['Enhance arrows', 'Imbue arrow', 'Seeker arrow', 'Phase arrow', 'Hail of arrows'] },
  'arcane-trickster': { id: 'arcane-trickster', name: 'Arcane Trickster', source: 'core-35-srd', prerequisites: { ability: { int: 13 }, feats: ['Mage Hand'], classes: ['rogue', 'sorcerer', 'wizard'] }, features: ['Ranged legerdemain', 'Sneak attack', 'Impromptu sneak attack'] },
  assassin: { id: 'assassin', name: 'Assassin', source: 'core-35-srd', prerequisites: { ability: { dex: 13 }, classes: ['rogue'] }, features: ['Poison use', 'Sneak attack', 'Death attack', 'Hide in plain sight'] },
  'dragon-disciple': { id: 'dragon-disciple', name: 'Dragon Disciple', source: 'core-35-srd', prerequisites: { ability: { cha: 13 }, classes: ['sorcerer'] }, features: ['Draconic abilities', 'Natural armor', 'Breath weapon', 'Wings'] },
  duelist: { id: 'duelist', name: 'Duelist', source: 'core-35-srd', prerequisites: { bab: 6, ability: { dex: 13 }, feats: ['Combat Expertise', 'Weapon Finesse'], classes: ['fighter', 'rogue'] }, features: ['Canny defense', 'Improved reaction', 'Grace', 'Precise strike'] },
  'dwarven-defender': { id: 'dwarven-defender', name: 'Dwarven Defender', source: 'core-35-srd', prerequisites: { bab: 7, ability: { con: 13 }, feats: ['Dodge'], races: ['dwarf'] }, features: ['Defensive stance', 'Uncanny dodge', 'Damage reduction'] },
  'eldritch-knight': { id: 'eldritch-knight', name: 'Eldritch Knight', source: 'core-35-srd', prerequisites: { bab: 3, feats: ['Martial Weapon Proficiency'], classes: ['fighter', 'sorcerer', 'wizard'] }, features: ['Bonus feat', 'Spellcasting advancement'] },
  hierophant: { id: 'hierophant', name: 'Hierophant', source: 'core-35-srd', prerequisites: { ability: { wis: 15 }, classes: ['cleric', 'druid'] }, features: ['Special ability', 'Spell-like ability'] },
  'horizon-walker': { id: 'horizon-walker', name: 'Horizon Walker', source: 'core-35-srd', prerequisites: { bab: 6, feats: ['Endurance'], classes: ['barbarian', 'fighter', 'ranger'] }, features: ['Terrain mastery', 'Planar terrain mastery'] },
  loremaster: { id: 'loremaster', name: 'Loremaster', source: 'core-35-srd', prerequisites: { ability: { int: 13 }, feats: ['Any metamagic feat', 'Any item creation feat'], classes: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Secret', 'Lore', 'Greater lore'] },
  'mystic-theurge': { id: 'mystic-theurge', name: 'Mystic Theurge', source: 'core-35-srd', prerequisites: { classes: ['cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Dual spellcasting advancement'] },
  shadowdancer: { id: 'shadowdancer', name: 'Shadowdancer', source: 'core-35-srd', prerequisites: { ability: { dex: 13 }, feats: ['Combat Reflexes', 'Dodge', 'Mobility'], classes: ['bard', 'monk', 'rogue'] }, features: ['Hide in plain sight', 'Darkvision', 'Shadow companion'] },
  thaumaturgist: { id: 'thaumaturgist', name: 'Thaumaturgist', source: 'core-35-srd', prerequisites: { ability: { wis: 13 }, feats: ['Spell Focus'], classes: ['cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Improved ally', 'Planar cohort', 'Planar durance'] },
  'knight-of-the-crown': { id: 'knight-of-the-crown', name: 'Knight of the Crown', source: 'dragonlance-user-pack', prerequisites: { bab: 4, feats: ['Mounted Combat'], classes: ['fighter', 'paladin', 'ranger'] }, features: ['Crown oath', 'Knightly challenge', 'Mounted combat training'] },
  'knight-of-the-sword': { id: 'knight-of-the-sword', name: 'Knight of the Sword', source: 'dragonlance-user-pack', prerequisites: { bab: 5, feats: ['Weapon Focus'], classes: ['fighter', 'paladin'] }, features: ['Sword oath', 'Fearless courage', 'Smite evil improvement'] },
  'knight-of-the-rose': { id: 'knight-of-the-rose', name: 'Knight of the Rose', source: 'dragonlance-user-pack', prerequisites: { bab: 6, feats: ['Leadership'], classes: ['fighter', 'paladin'] }, features: ['Rose oath', 'Inspire courage', 'Command authority'] },
  'knight-of-neraka': { id: 'knight-of-neraka', name: 'Knight of Neraka', source: 'dragonlance-user-pack', prerequisites: { bab: 5, feats: ['Knight of Takhisis'], classes: ['fighter', 'paladin', 'ranger'] }, features: ['Dark allegiance', 'Aura of command', 'Terror tactics'] },
  'renegade-hunter': { id: 'renegade-hunter', name: 'Renegade Hunter', source: 'dragonlance-user-pack', prerequisites: { feats: ['Spell Focus'] }, features: ['Magic detection', 'Counterspell training', 'Hunter of renegades'] },
  'wizard-of-high-sorcery': { id: 'wizard-of-high-sorcery', name: 'High Sorcery', source: 'dragonlance-user-pack', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['Order oath', 'Lunar spell power'] },
  'white-robed-wizard': { id: 'white-robed-wizard', name: 'White-Robed Wizard', source: 'dragonlance-user-pack', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['White robe oath', 'Protective magic', 'Lunar spell power'] },
  'red-robed-wizard': { id: 'red-robed-wizard', name: 'Red-Robed Wizard', source: 'dragonlance-user-pack', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['Red robe oath', 'Neutral magic', 'Lunar spell power'] },
  'black-robed-wizard': { id: 'black-robed-wizard', name: 'Black-Robed Wizard', source: 'dragonlance-user-pack', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['Black robe oath', 'Aggressive magic', 'Lunar spell power'] },
  'master-of-the-way': { id: 'master-of-the-way', name: 'Master of the Way', source: 'dragonlance-user-pack', prerequisites: { ability: { wis: 13 }, feats: ['Improved Unarmed Strike'], classes: ['monk'] }, features: ['Monastic discipline', 'Ki strike', 'Way mastery'] },
}

export const initialCharacter: Character = {
  name: 'Unnamed Hero', player: 'Player', gender: '', age: '', height: '5 ft. 7 in.', weight: '', hairColor: '', eyeColor: '', skinColor: '', temporaryHitPoints: 0, nonlethalDamage: 0, damageReduction: '', spellResistance: '', notes: '', race: 'Human', alignment: 'Neutral Good',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  classLevels: [{ classId: 'fighter', level: 1 }], hitPoints: 10, feats: [], featSelections: {}, featWeaponSelections: {}, skills: {}, skillRanksByClass: {}, knownSpells: [], knownSpellClasses: {}, knownSpellsByClass: {}, spellAcquisitionByClass: {}, preparedSpells: [], preparedSpellsByClass: {}, equipment: {}, mainWeaponGrip: 'one-handed', doubleWeaponMode: false, doubleWeaponPrimaryEnd: 'first', towerShieldTotalCover: false, shieldBashMode: false, inventory: {}, languages: ['Common'], prestigeClass: undefined, deity: undefined, highSorceryOrder: undefined,
}

export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

export function sizeModifier(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const sizeModifiers = {
    Fine: 8,
    Diminutive: 4,
    Tiny: 2,
    Small: 1,
    Medium: 0,
    Large: -1,
    Huge: -2,
    Gargantuan: -4,
    Colossal: -8,
  } as const
  return sizeModifiers[race?.size ?? 'Medium']
}

export function armorClass(
  character: Character,
  armorBonus = 0,
  maximumDexterityBonus = Infinity,
  shieldBonus = 0,
) {
  const dexterityBonus = Math.min(
    abilityModifier(getEffectiveAbilityScore(character, 'dex')),
    maximumDexterityBonus,
  )
  return 10 + armorBonus + shieldBonus + dexterityBonus + sizeModifier(character)
}

export function carryingCapacity(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const size = race?.size ?? 'Medium'
  const heavyCapacity = [
    0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 130, 150, 175,
    200, 230, 260, 300, 350, 400, 460, 520, 600, 700, 800, 920, 1040, 1200, 1400,
  ]
  const strength = Math.max(0, Math.floor(getEffectiveAbilityScore(character, 'str')))
  const decades = Math.max(0, Math.floor((strength - 20) / 10))
  const tableStrength = strength - decades * 10
  const heavyBase = heavyCapacity[tableStrength]
  const sizeMultiplier = {
    Fine: 0.125, Diminutive: 0.25, Tiny: 0.5, Small: 0.75,
    Medium: 1, Large: 2, Huge: 4, Gargantuan: 8, Colossal: 16,
  } as const
  const multiplier = sizeMultiplier[size] * 4 ** decades
  const light = Math.floor(Math.floor(heavyBase / 3) * multiplier)
  const medium = Math.floor(Math.floor(heavyBase * 2 / 3) * multiplier)
  const heavy = Math.floor(heavyBase * multiplier)
  return { light, medium, heavy }
}

export function cloneCharacter(character: Character): Character {
  return structuredClone(character)
}

export function changeRace(character: Character, race: string): Character {
  const nextCharacter = cloneCharacter(character)
  const oldModifiers = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]?.abilityModifiers ?? {}
  const newModifiers = raceDefinitions[race.toLowerCase().replaceAll(' ', '-')]?.abilityModifiers ?? {}
  for (const ability of Object.keys(nextCharacter.abilities) as AbilityName[]) {
    nextCharacter.abilities[ability] -= oldModifiers[ability] ?? 0
    nextCharacter.abilities[ability] += newModifiers[ability] ?? 0
  }
  nextCharacter.race = race
  return nextCharacter
}

export function nextClassLevel(character: Character, classId: ClassId) {
  return Math.max(0, ...character.classLevels.filter((entry) => entry.classId === classId).map((entry) => entry.level)) + 1
}

export function rollHitDie(hitDie: number) {
  return Math.floor(Math.random() * hitDie) + 1
}

export function hitPointGain(character: Character, hitPointRoll: number) {
  return Math.max(1, hitPointRoll + abilityModifier(character.abilities.con))
}

export function levelUpHitPointGain(original: Character, proposed: Character, hitPointRoll: number) {
  const previousHitDice = original.classLevels.reduce((total, entry) => total + entry.level, 0)
  const constitutionModifierIncrease =
    abilityModifier(proposed.abilities.con) - abilityModifier(original.abilities.con)
  return hitPointGain(proposed, hitPointRoll) + previousHitDice * constitutionModifierIncrease
}

export function beginLevelUp(character: Character, classId: ClassId): LevelUpDraft {
  const proposed = cloneCharacter(character)
  const existingClass = proposed.classLevels.find((entry) => entry.classId === classId)
  if (existingClass) existingClass.level = nextClassLevel(character, classId)
  else proposed.classLevels = [...proposed.classLevels, { classId, level: 1 }]
  return { original: cloneCharacter(character), proposed, classId, hitPointRoll: null, abilityIncrease: null, validationErrors: [] }
}

export function validateLevelUp(draft: LevelUpDraft): string[] {
  const errors: string[] = []
  const originalTotalLevel = draft.original.classLevels.reduce((total, entry) => total + entry.level, 0)
  const proposedTotalLevel = draft.proposed.classLevels.reduce((total, entry) => total + entry.level, 0)
  if (proposedTotalLevel !== originalTotalLevel + 1) errors.push('A level-up must add exactly one class level.')
  if (draft.proposed.classLevels.some((entry) => entry.level < 1)) errors.push('Class levels must be at least 1.')
  if (proposedTotalLevel % 4 === 0 && !draft.abilityIncrease)
    errors.push('Choose an ability score to increase before confirming the level-up.')
  if (draft.hitPointRoll === null) errors.push('Roll hit points before confirming the level-up.')
  return errors
}
