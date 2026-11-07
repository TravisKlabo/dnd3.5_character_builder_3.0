import type { StoreItem } from './data/itemTypes'
import { getEffectiveAbilityScore } from './abilityEquipment'
import type { CombatEffect } from './combatEffects'
import type { ClericDomainId } from './data/clericDomains'

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityScores = Record<AbilityName, number>

export type ClassId = 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'wizard' | 'mystic' | 'noble'
export type SkillRankSourceId = ClassId | PrestigeClassId | 'racial-hit-dice'
export const magicSchools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'] as const
export type MagicSchool = (typeof magicSchools)[number]
export type PrestigeClassId = 'knight-of-the-crown' | 'knight-of-the-sword' | 'knight-of-the-rose' | 'knight-of-the-lily' | 'knight-of-the-skull' | 'knight-of-the-thorn' | 'knight-of-neraka' | 'steel-legionnaire' | 'wizard-of-high-sorcery' | 'white-robed-wizard' | 'red-robed-wizard' | 'black-robed-wizard' | 'dragon-rider' | 'inquisitor' | 'legendary-tactician' | 'righteous-zealot' | 'renegade-hunter' | 'master-of-the-way' | 'arcane-archer' | 'arcane-trickster' | 'assassin' | 'dragon-disciple' | 'duelist' | 'dwarven-defender' | 'eldritch-knight' | 'hierophant' | 'horizon-walker' | 'loremaster' | 'mystic-theurge' | 'shadowdancer' | 'thaumaturgist'
export type FeatId = string
export type SpellAcquisition = 'starting' | 'level-up' | 'spellbook' | 'scroll' | 'research' | 'reward'
export interface WizardSpellLearning {
  source: 'scroll' | 'spellbook' | 'research' | 'reward'
  learnedAt: string
  decipherMethod?: 'read-magic' | 'author' | 'previously-deciphered' | 'spellcraft' | 'decipher-script'
  decipherTotal?: number
  spellcraftTotal?: number
}

export interface HitPointRollRecord {
  characterLevel: number
  classId: ClassId
  prestigeClassId?: PrestigeClassId
  classLevel: number
  hitDie: number
  roll: number
  hpIncrease: number
}

export type ContentSourceId = 'core-35-srd' | 'dragonlance-user-pack'
export const rulesetIds = ['core-35-srd', 'dragonlance-user-pack', 'dragonlance-monster-classes'] as const
export type RulesetId = (typeof rulesetIds)[number]

export type DragonlanceMoonId = 'solinari' | 'lunitari' | 'nuitari'
export type DragonlanceMoonPhase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent'
export type DragonlanceMoonConjunction =
  | 'none'
  | 'solinari-lunitari'
  | 'solinari-nuitari'
  | 'lunitari-nuitari'
  | 'all'

export interface DragonlanceMoonState {
  phases?: Partial<Record<DragonlanceMoonId, DragonlanceMoonPhase>>
  conjunction?: DragonlanceMoonConjunction
}

export function isRulesetId(value: unknown): value is RulesetId {
  return rulesetIds.some((ruleset) => ruleset === value)
}

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
  sourceBook?: string
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
  sourceBook?: string
  clericAlignments?: readonly string[]
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
  { id: 'paladine', name: 'Paladine', alignment: 'Lawful Good', description: 'Former god of good dragons, guardianship, and justice; relinquished godhood to become mortal at the end of the War of Souls.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: [] },
  { id: 'mishakal', name: 'Mishakal', alignment: 'Neutral Good', description: 'Goddess of healing, compassion, and restoration.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['community', 'good', 'healing', 'protection'] },
  { id: 'solinari', name: 'Solinari', alignment: 'Lawful Good', description: 'Patron of the White Robe Wizards; grants no cleric domains or divine spells.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: [] },
  { id: 'kiri-jolith', name: 'Kiri-Jolith', alignment: 'Lawful Good', description: 'God of honor, courage, and righteous battle.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['good', 'strength', 'war'], warDomainFavoredWeapon: 'Longsword' },
  { id: 'majere', name: 'Majere', alignment: 'Lawful Good', description: 'God of discipline, meditation, and insight.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['good', 'law', 'meditation'] },
  { id: 'gilean', name: 'Gilean', alignment: 'True Neutral', description: 'God of knowledge, balance, and free will.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['knowledge', 'liberation', 'protection'] },
  { id: 'lunitari', name: 'Lunitari', alignment: 'True Neutral', description: 'Patron of the Red Robe Wizards; grants no cleric domains or divine spells.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: [] },
  { id: 'zivilyn', name: 'Zivilyn', alignment: 'True Neutral', description: 'God of wisdom, foresight, and prophecy; favored weapon: quarterstaff.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['insight', 'knowledge', 'meditation'] },
  { id: 'reorx', name: 'Reorx', alignment: 'True Neutral', description: 'God of forging, invention, and dwarven craft.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['earth', 'fire', 'forge'] },
  { id: 'habbakuk', name: 'Habbakuk', alignment: 'Neutral Good', description: 'God of animals, the sea, and freedom.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['animal', 'good', 'water'] },
  { id: 'chislev', name: 'Chislev', alignment: 'True Neutral', description: 'Goddess of nature, wilderness, and beasts; favored weapon: shortspear.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericAlignments: ['Chaotic Neutral', 'Lawful Neutral', 'True Neutral', 'Neutral Evil', 'Neutral Good'], clericDomains: ['air', 'animal', 'earth', 'plant'] },
  { id: 'shinare', name: 'Shinare', alignment: 'Lawful Neutral', description: 'Goddess of wealth, commerce, and travel; favored weapon: light mace.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericAlignments: ['Lawful Neutral', 'True Neutral'], clericDomains: ['law', 'luck', 'travel'] },
  { id: 'branchala', name: 'Branchala', alignment: 'Chaotic Good', description: 'God of music, inspiration, and joy.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['chaos', 'good', 'luck', 'trickery'] },
  { id: 'sirrion', name: 'Sirrion', alignment: 'Chaotic Neutral', description: 'God of creativity, passion, and fire; favored weapon: heavy flail.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['chaos', 'fire', 'passion'] },
  { id: 'takhisis', name: 'Takhisis', alignment: 'Lawful Evil', description: 'Former goddess of darkness, tyranny, and evil dragons; killed at the end of the War of Souls.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: [] },
  { id: 'sargonnas', name: 'Sargonnas', alignment: 'Lawful Evil', description: 'God of vengeance, fire, and destruction.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['evil', 'fire', 'law', 'war'], warDomainFavoredWeapon: 'Greataxe' },
  { id: 'chemosh', name: 'Chemosh', alignment: 'Neutral Evil', description: 'God of undeath, false hope, and corruption.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['death', 'evil', 'trickery'] },
  { id: 'hiddukel', name: 'Hiddukel', alignment: 'Chaotic Evil', description: 'God of ill-gotten wealth, deals, thieves, and lies; favored weapon: dagger.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['evil', 'treachery', 'trickery'] },
  { id: 'morgion', name: 'Morgion', alignment: 'Neutral Evil', description: 'God of disease, decay, and secrets.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['destruction', 'evil', 'pestilence'] },
  { id: 'nuitari', name: 'Nuitari', alignment: 'Lawful Evil', description: 'God of forbidden magic, darkness, and ambition.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: [] },
  { id: 'zeboim', name: 'Zeboim', alignment: 'Chaotic Evil', description: 'Goddess of storms, the sea, and destruction.', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting', clericDomains: ['chaos', 'evil', 'storm', 'water'] },
]

export interface RaceDefinition {
  id: string
  name: string
  source: ContentSourceId
  selectable?: boolean
  abilityModifiers: Partial<Record<AbilityName, number>>
  racialHitDice?: {
    count: number
    hitDie: number
    baseAttackBonus: 'good' | 'medium' | 'poor'
    fortitude: 'good' | 'poor'
    reflex: 'good' | 'poor'
    will: 'good' | 'poor'
    skillPoints: number
    classSkills: string[]
    genderedClassSkills?: Partial<Record<'male' | 'female', string>>
  }
  racialSkillBonuses?: Partial<Record<string, number>>
  racialSituationalSkillBonuses?: Partial<Record<string, Partial<Record<RacialSkillCondition, number>>>>
  racialSavingThrowBonus?: number
  racialSituationalSaveBonuses?: Partial<Record<SavingThrowCondition, number>>
  racialFortitudeSituationalSaveBonuses?: Partial<Record<'poison' | 'disease', number>>
  racialImmunities?: SavingThrowCondition[]
  racialAttackBonuses?: Partial<Record<CombatTargetType, number>>
  racialDodgeACBonuses?: Partial<Record<CombatTargetType, number>>
  racialNaturalArmorBonus?: number
  racialWeaponProficiencies?: string[]
  levelAdjustment?: number
  size?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal'
  speed?: number
  swimSpeed?: number
  traits?: string[]
  specialAbilities?: string[]
  racialSpellLikeAbilities?: {
    name: string
    usesPerDay: number
    casterLevel: number | 'character'
    spellLevel?: number
    school?: string
    savingThrow?: string
    minimumCharisma?: number
    minimumIntelligence?: number
    notes?: string
  }[]
  racialSpellSchoolDcBonuses?: Record<string, number>
}

export type SavingThrowCondition = 'fear' | 'poison' | 'disease' | 'spell' | 'fey-spell-like' | 'enchantment' | 'compulsion' | 'illusion' | 'sleep' | 'oath'
export type RacialSkillCondition = 'unusual-stonework' | 'stone-or-metal' | 'alchemy' | 'taunt' | 'pitiable'
export type CombatTargetType = 'orc' | 'goblinoid' | 'kobold' | 'giant'

export interface PrestigeClassDefinition {
  id: PrestigeClassId
  name: string
  source: ContentSourceId
  sourceBook?: string
  prerequisites: {
    bab?: number
    ability?: Partial<Record<AbilityName, number>>
    baseSaves?: Partial<Record<'fortitude' | 'reflex' | 'will', number>>
    skills?: Record<string, number>
    anySkillRanks?: number
    anySkillPrefix?: string
    alignment?: string
    feats?: string[]
    anyFeats?: string[]
    featChoices?: { anyOf: string[]; count: number }[]
    classes?: ClassId[]
    prestigeClasses?: Partial<Record<PrestigeClassId, number>>
    classFeatures?: string[]
    spellcasting?: { type: 'arcane' | 'divine'; level: number }
    races?: string[]
  }
  features: string[]
  hitDie?: ClassDefinition['hitDie']
  skillPoints?: number
  baseAttackBonus?: ClassDefinition['baseAttackBonus']
  fortitude?: ClassDefinition['fortitude']
  reflex?: ClassDefinition['reflex']
  will?: ClassDefinition['will']
  classSkills?: string[]
  weaponProficiency?: 'simple' | 'martial' | 'all'
  armorProficiencies?: Array<'light' | 'medium' | 'heavy'>
  shieldProficiency?: boolean
  towerShieldProficiency?: boolean
  spellcastingProgression?: { type: 'arcane' | 'divine'; startsAtLevel?: number }
  maximumLevel?: number
  levelUpEnabled?: boolean
  roleplayPrerequisite?: string
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
  sourceBook?: string
  description: string
  prerequisites?: {
    abilities?: Partial<Record<AbilityName, number>>
    baseAttackBonus?: number
    baseSaves?: Partial<Record<'fortitude' | 'reflex' | 'will', number>>
    casterLevel?: number
    classLevels?: Partial<Record<ClassId, number>>
    classFeatures?: string[]
    arcaneSpellLevel?: number
    feats?: FeatId[]
    anyFeats?: FeatId[]
    draconianBreathWeapon?: boolean
    races?: string[]
    skills?: Record<string, number>
  }
  fighterBonus?: boolean
  firstLevelOnly?: boolean
}

export type RangerFavoredEnemyLevel = 1 | 5 | 10 | 15 | 20

export interface RangerFavoredEnemyChoice {
  classLevel: RangerFavoredEnemyLevel
  kind: 'creature' | 'organization'
  target: string
  subtype?: string
  bonusTargetLevel: RangerFavoredEnemyLevel
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
  ruleset: RulesetId
  alignment: string
  abilities: AbilityScores
  abilityScoreIncreasesByLevel?: Partial<Record<number, AbilityName>>
  classLevels: (ClassLevel | PrestigeClassLevel)[]
  hitPoints: number
  hitPointRolls?: HitPointRollRecord[]
  baseAttackBonusByLevel?: Partial<Record<number, number>>
  feats: string[]
  featSelections: Record<string, FeatId | ''>
  featWeaponSelections?: Record<string, string>
  featSkillSelections?: Record<string, string>
  featSpellSchoolSelections?: Record<string, MagicSchool>
  skills: Record<string, number>
  skillRanksByClass: Record<string, Record<string, number>>
  skillRanksByLevel?: Partial<Record<number, Record<string, number>>>
  knownSpells: string[]
  knownSpellClasses?: Record<string, ClassId>
  knownSpellsByClass?: Partial<Record<ClassId, string[]>>
  spellAcquisitionByClass?: Partial<Record<ClassId, Record<string, SpellAcquisition>>>
  wizardSpellLearning?: Record<string, WizardSpellLearning>
  preparedSpells: string[]
  preparedSpellsByClass?: Partial<Record<ClassId, string[]>>
  preparedSpellSlotLevelsByClass?: Partial<Record<ClassId, Record<string, number[]>>>
  empowerByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  maximizeByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  extendByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  enlargeByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  quickenByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  silentByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  stillByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  widenByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  sculptByClass?: Partial<Record<ClassId, Record<string, boolean[]>>>
  spellPreparationCompletedByClass?: Partial<Record<ClassId, boolean>>
  clericDomains?: import('./data/clericDomains').ClericDomainId[]
  clericDomainPreparation?: Record<string, import('./data/clericDomains').ClericDomainSpell>
  clericDomainExpended?: number[]
  mysticDomain?: ClericDomainId
  expendedSpellSlotsByClass?: Partial<Record<ClassId, Record<string, number[]>>>
  equipment: Record<string, string>
  mainWeaponGrip?: 'one-handed' | 'two-handed'
  doubleWeaponMode?: boolean
  doubleWeaponPrimaryEnd?: 'first' | 'second'
  towerShieldTotalCover?: boolean
  shieldBashMode?: boolean
  animatedShieldMode?: boolean
  forceShieldActive?: boolean
  shieldBlindingUsesByItem?: Record<string, number>
  compositeBowStrengthRatings?: Record<string, number>
  inventory: Record<string, number>
  languages: string[]
  speakLanguages?: string[]
  regionalLanguage?: string
  hasMedallionOfFaith?: boolean
  prestigeClass?: PrestigeClassId
  honorBoundSuspended?: boolean
  knightOfTheCrownState?: {
    strengthOfHonorUsesUsed?: number
    crownOfKnighthoodUsed?: boolean
  }
  classFeatures?: string[]
  customItems?: StoreItem[]
  deity?: string
  highSorceryOrder?: 'white' | 'red' | 'black'
  wizardSpecializationSchool?: MagicSchool
  wizardBarredSchools?: MagicSchool[]
  dragonlanceMoonState?: DragonlanceMoonState
  rangerFavoredEnemies?: RangerFavoredEnemyChoice[]
}

export interface LevelUpDraft {
  original: Character
  proposed: Character
  classId: ClassId
  prestigeClassId?: PrestigeClassId
  specialPrerequisiteConfirmed?: boolean
  abilityIncrease: AbilityName | null
  validationErrors: string[]
}

export const classDefinitions: Record<ClassId, ClassDefinition> = {
  barbarian: { id: 'barbarian', name: 'Barbarian', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 12, skillPoints: 4, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'poor', spellcasting: false },
  bard: { id: 'bard', name: 'Bard', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 6, skillPoints: 6, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'good', spellcasting: true },
  fighter: { id: 'fighter', name: 'Fighter', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 10, skillPoints: 2, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'poor', spellcasting: false },
  druid: { id: 'druid', name: 'Druid', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  monk: { id: 'monk', name: 'Monk', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'good', will: 'good', spellcasting: false },
  paladin: { id: 'paladin', name: 'Paladin', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 10, skillPoints: 2, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  ranger: { id: 'ranger', name: 'Ranger', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 6, baseAttackBonus: 'good', fortitude: 'good', reflex: 'good', will: 'poor', spellcasting: true },
  rogue: { id: 'rogue', name: 'Rogue', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 6, skillPoints: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'poor', spellcasting: false },
  sorcerer: { id: 'sorcerer', name: 'Sorcerer', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  wizard: { id: 'wizard', name: 'Wizard', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  cleric: { id: 'cleric', name: 'Cleric', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 2, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  mystic: { id: 'mystic', name: 'Mystic', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', hitDie: 8, skillPoints: 2, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  noble: { id: 'noble', name: 'Noble', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'good', spellcasting: false },
}

export const raceDefinitions: Record<string, RaceDefinition> = {
  human: { id: 'human', name: 'Human', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: {}, specialAbilities: ['Bonus feat', 'Extra skill points'] },
  dwarf: { id: 'dwarf', name: 'Dwarf', source: 'core-35-srd', size: 'Medium', speed: 20, abilityModifiers: { con: 2, cha: -2 }, racialSituationalSkillBonuses: { Search: { 'unusual-stonework': 2 }, Appraise: { 'stone-or-metal': 2 }, Craft: { 'stone-or-metal': 2 } }, racialSituationalSaveBonuses: { poison: 2, spell: 2 }, racialAttackBonuses: { orc: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, specialAbilities: ['Darkvision 60 ft.', 'Stonecunning', 'Stability (+4 to resist bull rush or trip while firmly grounded)', 'Waraxe/urgrosh familiarity', '+2 saves vs. poison/spells', '+1 attack vs. orcs/goblinoids; +4 dodge AC vs. giants', 'Stone/metal Appraise/Craft +2'] },
  elf: { id: 'elf', name: 'Elf', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: -2 }, racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision (see twice as far as humans in starlight, moonlight, torchlight, and similar poor illumination; retain color and detail)', 'Immune to magical sleep effects', 'Enchantment saves +2', 'Search check for secret/concealed doors when passing within 5 ft.', 'Elf weapon proficiencies'] },
  halfling: { id: 'halfling', name: 'Halfling', source: 'core-35-srd', size: 'Small', speed: 20, abilityModifiers: { dex: 2, str: -2 }, racialSkillBonuses: { Climb: 2, Jump: 2, Listen: 2, 'Move Silently': 2 }, racialSavingThrowBonus: 1, racialSituationalSaveBonuses: { fear: 2 }, specialAbilities: ['All saves +1; fear +2', 'Thrown/slings attacks +1'] },
  gnome: { id: 'gnome', name: 'Gnome', source: 'core-35-srd', size: 'Small', speed: 20, abilityModifiers: { con: 2, str: -2 }, racialSkillBonuses: { Listen: 2 }, racialSituationalSkillBonuses: { Craft: { alchemy: 2 } }, racialSituationalSaveBonuses: { illusion: 2 }, racialAttackBonuses: { kobold: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, racialSpellLikeAbilities: [
    { name: 'Speak with Animals', usesPerDay: 1, casterLevel: 1, notes: 'Burrowing mammals only; duration 1 minute.' },
    { name: 'Dancing Lights', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'evocation', minimumCharisma: 10 },
    { name: 'Ghost Sound', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'illusion', savingThrow: 'Will disbelief', minimumCharisma: 10 },
    { name: 'Prestidigitation', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'universal', minimumCharisma: 10 },
  ], racialSpellSchoolDcBonuses: { illusion: 1 }, specialAbilities: ['Low-light vision', 'Illusion saves +2; DC +1', 'Hooked hammer familiarity', '+1 attack vs. kobolds/goblinoids; +4 dodge AC vs. giants', 'Craft (alchemy) +2'] },
  'half-orc': { id: 'half-orc', name: 'Half-orc', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: { str: 2, int: -2, cha: -2 }, specialAbilities: ['Darkvision 60 ft.', 'Orc blood'] },
  'half-elf': { id: 'half-elf', name: 'Half-elf', source: 'core-35-srd', size: 'Medium', speed: 30, abilityModifiers: {}, racialSkillBonuses: { Listen: 1, Search: 1, Spot: 1, Diplomacy: 2, 'Gather Information': 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision (see twice as far as humans in starlight, moonlight, torchlight, and similar poor illumination; retain color and detail)', 'Immune to sleep spells and similar magical effects', 'Enchantment saves +2', 'Elven blood'] },
  kender: {
    id: 'kender',
    name: 'Kender',
    source: 'dragonlance-user-pack',
    size: 'Small',
    speed: 20,
    abilityModifiers: { str: -2, dex: 2, wis: -2 },
    racialSkillBonuses: {
      Concentration: -4,
      'Open Lock': 2,
      'Sleight of Hand': 2,
      Spot: 2,
    },
    racialSituationalSkillBonuses: { Bluff: { taunt: 4 } },
    racialSavingThrowBonus: 1,
    racialImmunities: ['fear'],
    traits: ['Fearlessness (immune to fear)', 'Taunt (+4 Bluff when taunting)', 'Favored class: Rogue'],
  },
  draconian: { id: 'draconian', name: 'Draconian', source: 'dragonlance-user-pack', selectable: false, size: 'Medium', abilityModifiers: { str: 2, con: 2, cha: -2 }, traits: ['Legacy generic placeholder; use Baaz or Kapak for sourcebook-specific draconian statistics.'] },
  'baaz-draconian': {
    id: 'baaz-draconian',
    name: 'Baaz Draconian',
    source: 'dragonlance-user-pack',
    levelAdjustment: 1,
    size: 'Medium',
    speed: 30,
    abilityModifiers: { con: 2, int: -2, wis: -2 },
    racialHitDice: {
      count: 2,
      hitDie: 12,
      baseAttackBonus: 'good',
      fortitude: 'good',
      reflex: 'good',
      will: 'good',
      skillPoints: 6,
      classSkills: ['Disguise', 'Intimidate', 'Listen', 'Spot'],
      genderedClassSkills: { male: 'Bluff', female: 'Diplomacy' },
    },
    racialImmunities: ['sleep'],
    racialNaturalArmorBonus: 2,
    racialWeaponProficiencies: ['Longsword'],
    traits: [
      'Dragon type: darkvision 60 ft., low-light vision, immune to sleep and paralysis',
      'Natural attacks: two claws (1d4) and bite (1d4)',
      'Death throes petrify the body; a slashing or piercing deathblow may trap its weapon (Reflex DC 12 + Constitution modifier)',
      'Immune to disease; Run bonus feat; glide without falling damage, up to 4 feet horizontally per foot descended',
      'Inspired by Dragons: +1 morale on attacks and saves under a dragon commander; low metabolism; spell resistance 8 + class level',
      'Bonus proficiencies: simple weapons, longsword, light armor, and shields',
      'Automatic language Common; bonus languages Goblin, Nerakese, and Ogre; favored class Fighter',
      'First racial Hit Die has maximum hit points; racial Hit Dice grant one feat based on total Hit Dice',
    ],
  },
  'kapak-draconian': {
    id: 'kapak-draconian',
    name: 'Kapak Draconian',
    source: 'dragonlance-user-pack',
    levelAdjustment: 2,
    size: 'Medium',
    speed: 30,
    abilityModifiers: { dex: 2, con: 2, int: -2, wis: -2 },
    racialHitDice: {
      count: 2,
      hitDie: 12,
      baseAttackBonus: 'good',
      fortitude: 'good',
      reflex: 'good',
      will: 'good',
      skillPoints: 6,
      classSkills: ['Hide', 'Listen', 'Move Silently', 'Search', 'Spot'],
    },
    racialImmunities: ['sleep'],
    racialNaturalArmorBonus: 2,
    racialWeaponProficiencies: ['Short Sword', 'Shortbow'],
    traits: [
      'Dragon type: darkvision 60 ft., low-light vision, immune to sleep and paralysis',
      'Natural attack: bite (1d4)',
      'Death throes create a 5-ft.-radius pool of acid that deals 1d6 acid damage per round and evaporates in 1d6 rounds',
      'Immune to disease; Run bonus feat; glide without falling damage, up to 4 feet horizontally per foot descended',
      'Inspired by Dragons: +1 morale on attacks and saves under a dragon commander; low metabolism; spell resistance 11 + class level',
      'Female healing saliva heals 2d6 once per creature every 4 hours; male poison saliva (Fortitude DC 11 + Constitution modifier) deals 1d6 Dexterity damage initially and secondarily',
      'Bonus proficiencies: simple weapons, short sword, shortbow, and light armor; sneak attack +1d6',
      'Automatic language Common; bonus languages Goblin, Nerakese, and Ogre; favored class Rogue',
      'First racial Hit Die has maximum hit points; racial Hit Dice grant one feat based on total Hit Dice',
    ],
  },
  'qualinesti-elf': { id: 'qualinesti-elf', name: 'Qualinesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { dex: 2, con: -2 }, racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2, Diplomacy: 1, 'Sense Motive': 1 }, racialSituationalSaveBonuses: { enchantment: 2 }, racialImmunities: ['sleep'], traits: ['Elvensight (low-light vision and darkvision 30 ft.)', 'Immune to magical sleep', 'Elven weapon proficiencies'] },
  'silvanesti-elf': { id: 'silvanesti-elf', name: 'Silvanesti Elf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { dex: 2, con: -2, int: 2, cha: -2 }, racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2, 'Knowledge (arcana)': 1, Spellcraft: 1 }, racialSituationalSaveBonuses: { enchantment: 2 }, racialImmunities: ['sleep'], traits: ['Elvensight (low-light vision and darkvision 30 ft.)', 'Immune to magical sleep', 'Elven weapon proficiencies'] },
  'kagonesti-elf': {
    id: 'kagonesti-elf',
    name: 'Kagonesti Elf',
    source: 'dragonlance-user-pack',
    size: 'Medium',
    speed: 30,
    abilityModifiers: { dex: 2, int: -2, cha: -2 },
    racialSkillBonuses: {
      Listen: 2,
      Search: 2,
      Spot: 2,
      'Knowledge (nature)': 1,
      Survival: 1,
    },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialImmunities: ['sleep'],
    racialWeaponProficiencies: [
      'Short Sword',
      'Longspear',
      'Shortbow',
      'Composite Shortbow',
      'Longbow',
      'Composite Longbow',
    ],
    traits: [
      'Elvensight (low-light vision and darkvision 30 ft.)',
      'Immune to magical sleep; +2 racial saves vs. enchantment',
      'Search for secret or concealed doors when passing within 5 ft.',
      'Free Martial Weapon Proficiency (short sword, longspear, shortbow, composite shortbow, longbow, composite longbow)',
      'Favored class: Ranger',
    ],
  },
  'dargonesti-elf': {
    id: 'dargonesti-elf',
    name: 'Dargonesti Elf',
    source: 'dragonlance-user-pack',
    levelAdjustment: 1,
    size: 'Medium',
    speed: 30,
    swimSpeed: 30,
    abilityModifiers: { str: 2, dex: 2, cha: -2 },
    racialSkillBonuses: { Swim: 8, Listen: 2, Search: 2, Spot: 2 },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialImmunities: ['sleep'],
    racialWeaponProficiencies: ['Trident', 'Longspear', 'Net'],
    racialSpellLikeAbilities: [
      { name: 'Blur', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'illusion', minimumIntelligence: 10 },
      { name: 'Dancing Lights', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'evocation', minimumIntelligence: 10 },
      { name: 'Darkness', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'evocation', minimumIntelligence: 10 },
      { name: 'Obscuring Mist', usesPerDay: 1, casterLevel: 'character', spellLevel: 1, school: 'conjuration', minimumIntelligence: 10 },
    ],
    traits: [
      'Swim speed 30 ft.; can swim at speed without checks and gain +8 on other Swim checks',
      'Breathe water',
      'Immune to magical sleep; +2 racial saves vs. enchantment',
      'Elvensight (low-light vision and darkvision 60 ft.)',
      'Free Martial Weapon Proficiency (trident, longspear) and Exotic Weapon Proficiency (net)',
      'Listen, Search, and Spot +2; Seasense +2 to notice water conditions and intuit depth',
      'Alternate form: porpoise 3/day',
      'Surface sensitivity: –2 to attacks, saves, and checks after 24 hours out of water',
      'Favored class: Fighter',
    ],
  },
  'dimernesti-elf': {
    id: 'dimernesti-elf',
    name: 'Dimernesti Elf',
    source: 'dragonlance-user-pack',
    levelAdjustment: 1,
    size: 'Medium',
    speed: 30,
    swimSpeed: 30,
    abilityModifiers: { dex: 2, int: 2, wis: -2, cha: -2 },
    racialSkillBonuses: { Swim: 8, Listen: 2, Search: 2, Spot: 2 },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialImmunities: ['sleep'],
    racialWeaponProficiencies: ['Trident', 'Longspear', 'Net'],
    traits: [
      'Swim speed 30 ft.; can swim at speed without checks and gain +8 on other Swim checks',
      'Breathe water',
      'Immune to magical sleep; +2 racial saves vs. enchantment',
      'Elvensight (low-light vision and darkvision 30 ft.)',
      'Free Martial Weapon Proficiency (trident, longspear) and Exotic Weapon Proficiency (net)',
      'Listen, Search, and Spot +2; Seasense +2 to notice water conditions and intuit depth',
      'Alternate form: sea otter 3/day',
      'Surface sensitivity: –1 to attacks, saves, and checks after 24 hours out of water',
      'Favored class: Barbarian',
    ],
  },
  'hill-dwarf': { id: 'hill-dwarf', name: 'Hill Dwarf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { con: 2, cha: -2 } },
  'mountain-dwarf': { id: 'mountain-dwarf', name: 'Mountain Dwarf', source: 'dragonlance-user-pack', size: 'Medium', abilityModifiers: { con: 2, cha: -2 } },
  'dark-dwarf': {
    id: 'dark-dwarf',
    name: 'Dark Dwarf',
    source: 'dragonlance-user-pack',
    size: 'Medium',
    abilityModifiers: { con: 2, cha: -4 },
    racialSkillBonuses: { Hide: 2, Listen: 2, 'Move Silently': 2 },
    specialAbilities: [
      'Darkvision 120 ft.',
      'Stonecunning',
      'Stability (+4 to resist bull rush or trip while firmly grounded)',
      'Waraxe/urgrosh familiarity',
      '+2 saves vs. poison/spells',
      '+1 attack vs. orcs/goblinoids; +4 dodge AC vs. giants',
      'Stone/metal Appraise/Craft +2',
      'Light sensitivity: –2 circumstance on attacks, saves, and checks in bright sunlight or a daylight spell',
      'Favored class: Rogue',
    ],
  },
  'deep-dwarf': { id: 'deep-dwarf', name: 'Deep Dwarf', source: 'dragonlance-user-pack', selectable: false, size: 'Medium', abilityModifiers: { con: 2, cha: -2 }, traits: ['Legacy generic placeholder; use Dark Dwarf for the sourcebook-specific dwarf variant.'] },
  minotaur: { id: 'minotaur', name: 'Minotaur', source: 'dragonlance-user-pack', levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { str: 4, dex: -2, int: -2, cha: -2 }, racialSkillBonuses: { Intimidate: 2, Swim: 2, 'Use Rope': 2 }, racialNaturalArmorBonus: 2, traits: ['Gore (1d6; 2d6 on a charge)', 'Scent may be selected as a feat', 'Favored class: Fighter'] },
  irda: { id: 'irda', name: 'Irda', source: 'dragonlance-user-pack', levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { con: -2, int: 2, cha: 2 }, racialSpellLikeAbilities: [
    { name: 'Dancing Lights', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'evocation' },
    { name: 'Detect Magic', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'divination' },
    { name: 'Flare', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'evocation', savingThrow: 'Fortitude negates' },
    { name: 'Ghost Sound', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'illusion', savingThrow: 'Will disbelief' },
    { name: 'Light', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'evocation' },
    { name: 'Mage Hand', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'transmutation' },
  ], traits: ['Humanoid (shapeshifter)', 'Change shape 3/day (Small to Large humanoid; +10 Disguise)', 'Low-light vision', 'Favored class: Wizard'] },
  'gully-dwarf': {
    id: 'gully-dwarf',
    name: 'Gully Dwarf',
    source: 'dragonlance-user-pack',
    size: 'Small',
    speed: 20,
    abilityModifiers: { dex: 2, con: 2, int: -4, cha: -4 },
    racialSkillBonuses: { Hide: 2, 'Move Silently': 2, Survival: 2 },
    racialSituationalSkillBonuses: { Diplomacy: { pitiable: 4 } },
    racialSituationalSaveBonuses: { fear: -4 },
    racialFortitudeSituationalSaveBonuses: { poison: 2, disease: 2 },
    specialAbilities: [
      'Survival instinct: may use Survival in cities to forage for food and necessities',
      'Hardy: +2 racial bonus on Fortitude saves against poison and disease',
      'Pitiable: +4 racial bonus on Diplomacy to convince an enemy not to harm you',
      'Cowardly: –4 on level checks to resist Intimidate and –4 on saves against fear',
      'Automatic languages: Gullytalk and Common; no bonus languages',
      'Favored class: Rogue',
      'An ability score reduced to 2 or less by race is instead 3 when randomly generating abilities',
    ],
  },
}

export const dragonlancePrestigeClasses: Record<PrestigeClassId, PrestigeClassDefinition> = {
  'arcane-archer': { id: 'arcane-archer', name: 'Arcane Archer', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { bab: 6, ability: { dex: 13 }, feats: ['Point Blank Shot', 'Precise Shot'], classes: ['fighter', 'ranger'] }, features: ['Enhance arrows', 'Imbue arrow', 'Seeker arrow', 'Phase arrow', 'Hail of arrows'] },
  'arcane-trickster': { id: 'arcane-trickster', name: 'Arcane Trickster', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { int: 13 }, feats: ['Mage Hand'], classes: ['rogue', 'sorcerer', 'wizard'] }, features: ['Ranged legerdemain', 'Sneak attack', 'Impromptu sneak attack'] },
  assassin: { id: 'assassin', name: 'Assassin', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { dex: 13 }, classes: ['rogue'] }, features: ['Poison use', 'Sneak attack', 'Death attack', 'Hide in plain sight'] },
  'dragon-disciple': { id: 'dragon-disciple', name: 'Dragon Disciple', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { cha: 13 }, classes: ['sorcerer'] }, features: ['Draconic abilities', 'Natural armor', 'Breath weapon', 'Wings'] },
  duelist: { id: 'duelist', name: 'Duelist', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { bab: 6, ability: { dex: 13 }, feats: ['Combat Expertise', 'Weapon Finesse'], classes: ['fighter', 'rogue'] }, features: ['Canny defense', 'Improved reaction', 'Grace', 'Precise strike'] },
  'dwarven-defender': { id: 'dwarven-defender', name: 'Dwarven Defender', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { bab: 7, ability: { con: 13 }, feats: ['Dodge'], races: ['dwarf'] }, features: ['Defensive stance', 'Uncanny dodge', 'Damage reduction'] },
  'eldritch-knight': { id: 'eldritch-knight', name: 'Eldritch Knight', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { bab: 3, feats: ['Martial Weapon Proficiency'], classes: ['fighter', 'sorcerer', 'wizard'] }, features: ['Bonus feat', 'Spellcasting advancement'] },
  hierophant: { id: 'hierophant', name: 'Hierophant', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { wis: 15 }, classes: ['cleric', 'druid'] }, features: ['Special ability', 'Spell-like ability'] },
  'horizon-walker': { id: 'horizon-walker', name: 'Horizon Walker', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { bab: 6, feats: ['Endurance'], classes: ['barbarian', 'fighter', 'ranger'] }, features: ['Terrain mastery', 'Planar terrain mastery'] },
  loremaster: { id: 'loremaster', name: 'Loremaster', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { int: 13 }, feats: ['Any metamagic feat', 'Any item creation feat'], classes: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Secret', 'Lore', 'Greater lore'] },
  'mystic-theurge': { id: 'mystic-theurge', name: 'Mystic Theurge', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { classes: ['cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Dual spellcasting advancement'] },
  shadowdancer: { id: 'shadowdancer', name: 'Shadowdancer', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { dex: 13 }, feats: ['Combat Reflexes', 'Dodge', 'Mobility'], classes: ['bard', 'monk', 'rogue'] }, features: ['Hide in plain sight', 'Darkvision', 'Shadow companion'] },
  thaumaturgist: { id: 'thaumaturgist', name: 'Thaumaturgist', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)", prerequisites: { ability: { wis: 13 }, feats: ['Spell Focus'], classes: ['cleric', 'druid', 'sorcerer', 'wizard'] }, features: ['Improved ally', 'Planar cohort', 'Planar durance'] },
  'knight-of-the-crown': {
    id: 'knight-of-the-crown',
    name: 'Knight of the Crown',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 3,
      baseSaves: { fortitude: 4 },
      skills: { Diplomacy: 2, 'Knowledge (religion)': 2, Ride: 2 },
      alignment: 'Lawful Good',
      feats: [
        'Armor Proficiency (Heavy)',
        'Honor-bound',
        'Martial Weapon Proficiency',
        'Shield Proficiency',
      ],
    },
    features: [
      'Strength of Honor',
      'Knightly Courage',
      'Heroic Initiative',
      'Fight to the Death',
      'Honorable Will',
      'Might of Honor',
      'Armored Mobility',
      'Aura of Courage',
      'Crown of Knighthood',
    ],
    hitDie: 10,
    skillPoints: 2,
    baseAttackBonus: 'good',
    fortitude: 'good',
    reflex: 'poor',
    will: 'poor',
    classSkills: [
      'Craft',
      'Diplomacy',
      'Intimidate',
      'Knowledge (nobility and royalty)',
      'Knowledge (religion)',
      'Profession',
      'Ride',
    ],
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite:
      'Admission as a squire through a Knightly Council with sponsorship from a knight in good standing.',
  },
  'knight-of-the-sword': {
    id: 'knight-of-the-sword',
    name: 'Knight of the Sword',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 6,
      baseSaves: { will: 4 },
      skills: { 'Knowledge (nobility and royalty)': 2, 'Knowledge (religion)': 4, Ride: 4 },
      alignment: 'Lawful Good',
      feats: ['Diehard', 'Endurance', 'Honor-bound'],
      prestigeClasses: { 'knight-of-the-crown': 1 },
      classFeatures: ['Knightly Courage'],
      spellcasting: { type: 'divine', level: 1 },
    },
    features: ['Smite Evil', 'Aura of Good', 'Turn Undead', 'Aura of Courage', 'Soul of Knighthood'],
    hitDie: 8,
    skillPoints: 2,
    baseAttackBonus: 'medium',
    fortitude: 'good',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Knowledge (nobility and royalty)', 'Knowledge (religion)', 'Profession', 'Ride'],
    spellcastingProgression: { type: 'divine' },
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Complete the 500-mile, 30-day journey; three wisdom tests; one generosity test; one compassion test; restore something lost; defeat a worthy evil opponent no more than two CR below your level; perform a deed of heroic valor; and be accepted by a lawful Knightly Council.',
  },
  'knight-of-the-rose': {
    id: 'knight-of-the-rose',
    name: 'Knight of the Rose',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 8,
      baseSaves: { will: 7 },
      skills: { Diplomacy: 8, 'Knowledge (nobility and royalty)': 8, Ride: 8 },
      alignment: 'Lawful Good',
      feats: ['Endurance', 'Honor-bound', 'Leadership', 'Mounted Combat'],
      prestigeClasses: { 'knight-of-the-crown': 1, 'knight-of-the-sword': 3 },
      classFeatures: ['Knightly Courage', 'Aura of Courage'],
      spellcasting: { type: 'divine', level: 2 },
    },
    features: ['Rallying Cry', 'Detect Evil', 'Aura of Good', 'Inspire Courage', 'Leadership Bonus', 'Divine Grace', 'Inspire Greatness', 'Turn Undead', 'Wisdom of the Measure', 'Final Stand', 'Knighthood’s Flower'],
    hitDie: 10,
    skillPoints: 2,
    baseAttackBonus: 'good',
    fortitude: 'good',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Craft', 'Diplomacy', 'Intimidate', 'Knowledge (nobility and royalty)', 'Knowledge (religion)', 'Profession', 'Ride'],
    spellcastingProgression: { type: 'divine' },
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'As a Knight of the Sword, complete the 500-mile, 30-day journey; one wisdom test; three generosity tests; three compassion tests; restore something lost; defeat a worthy evil opponent with CR at least your level; and be accepted by the entire Knightly Council.',
  },
  'knight-of-the-lily': {
    id: 'knight-of-the-lily',
    name: 'Knight of the Lily',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 5,
      skills: { 'Knowledge (religion)': 2, Intimidate: 4 },
      alignment: 'Lawful Evil',
      feats: ['Honor-bound'],
    },
    features: ['Sneak Attack', 'Demoralize', 'Fight to the Death', 'Unbreakable Will', 'Armored Mobility', 'One Thought'],
    hitDie: 10,
    skillPoints: 2,
    baseAttackBonus: 'good',
    fortitude: 'good',
    reflex: 'poor',
    will: 'poor',
    classSkills: ['Climb', 'Craft', 'Diplomacy', 'Intimidate', 'Jump', 'Knowledge (religion)', 'Profession', 'Ride'],
    weaponProficiency: 'martial',
    armorProficiencies: ['light', 'medium', 'heavy'],
    shieldProficiency: true,
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Become a squire sponsored by a Knight of the Lily of at least 3rd level, advance at least one level while a squire, and pass the Test of Takhisis.',
  },
  'knight-of-the-skull': {
    id: 'knight-of-the-skull',
    name: 'Knight of the Skull',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 3,
      skills: { 'Knowledge (religion)': 4 },
      alignment: 'Lawful Evil',
      feats: ['Alertness'],
      spellcasting: { type: 'divine', level: 3 },
    },
    features: ['Detect Good', 'Smite Good', 'Aura of Evil', 'Dark Blessing', 'Discern Lies', 'Rebuke Undead', 'Favor of the Dark Queen'],
    hitDie: 8,
    skillPoints: 2,
    baseAttackBonus: 'medium',
    fortitude: 'good',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Knowledge (religion)', 'Profession', 'Ride'],
    spellcastingProgression: { type: 'divine', startsAtLevel: 2 },
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Become a squire of the Lily sponsored by a Knight of the Skull of at least 3rd level, advance at least one level while a squire, and pass the Test of Takhisis.',
  },
  'knight-of-the-thorn': {
    id: 'knight-of-the-thorn',
    name: 'Knight of the Thorn',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 3,
      baseSaves: { fortitude: 4, will: 3 },
      skills: { 'Knowledge (arcana)': 4, 'Knowledge (religion)': 4, Spellcraft: 8 },
      alignment: 'Lawful Evil',
      feats: ['Armor Proficiency (Heavy)', 'Martial Weapon Proficiency (all)'],
      featChoices: [{
        anyOf: [
          'empower-spell', 'enlarge-spell', 'extend-spell', 'heighten-spell',
          'maximize-spell', 'quicken-spell', 'silent-spell', 'still-spell',
          'widen-spell',
        ],
        count: 1,
      }],
      spellcasting: { type: 'arcane', level: 2 },
    },
    features: ['Diviner', 'Read Omens', 'Armored Spellcasting', 'Aura of Terror', 'Weapon Touch', 'Read Portents', 'Cosmic Understanding'],
    hitDie: 6,
    skillPoints: 2,
    baseAttackBonus: 'medium',
    fortitude: 'poor',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Knowledge (*)', 'Profession', 'Ride', 'Spellcraft'],
    spellcastingProgression: { type: 'arcane' },
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Become a squire of the Lily sponsored by a Knight of the Thorn of at least 3rd level, advance at least one level while a squire, and pass the Test of Takhisis.',
  },
  'knight-of-neraka': { id: 'knight-of-neraka', name: 'Legacy Knight of Neraka (unverified)', source: 'dragonlance-user-pack', sourceBook: 'Legacy placeholder; not a prestige class in Dragonlance Campaign Setting', prerequisites: {}, features: ['Legacy placeholder; use Knight of the Lily, Knight of the Skull, or Knight of the Thorn instead.'] },
  'steel-legionnaire': {
    id: 'steel-legionnaire',
    name: 'Steel Legionnaire',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 4,
      baseSaves: { fortitude: 2, reflex: 2, will: 2 },
      skills: { Bluff: 3, Diplomacy: 4 },
      anySkillRanks: 9,
      alignment: 'Any non-evil',
    },
    features: ['Legion Knowledge', 'Favored Enemy', 'Reputation', 'Apprentice'],
    hitDie: 8,
    skillPoints: 4,
    baseAttackBonus: 'good',
    fortitude: 'good',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Bluff', 'Climb', 'Craft', 'Diplomacy', 'Disguise', 'Gather Information', 'Hide', 'Jump', 'Knowledge (*)', 'Profession', 'Sense Motive', 'Speak Language', 'Swim'],
    maximumLevel: 3,
    levelUpEnabled: true,
  },
  'dragon-rider': {
    id: 'dragon-rider',
    name: 'Dragon Rider',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 10,
      skills: { 'Handle Animal': 8, Ride: 8 },
      feats: ['Leadership', 'Mounted Combat', 'Resist Dragonfear'],
    },
    features: ['Dragon Cohort', 'Mounted Attack', 'Dragon Feat', 'Empathic Communication', 'Inspire Fear', 'Directed Attacks', 'Defensive Tactics', 'Defensive Teamwork'],
    hitDie: 8,
    skillPoints: 4,
    baseAttackBonus: 'medium',
    fortitude: 'good',
    reflex: 'good',
    will: 'poor',
    classSkills: ['Balance', 'Concentration', 'Craft (*)', 'Diplomacy', 'Handle Animal', 'Heal', 'Jump', 'Profession (*)', 'Ride'],
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Must have ridden a dragon.',
  },
  inquisitor: {
    id: 'inquisitor',
    name: 'Inquisitor',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 3,
      skills: { 'Gather Information': 8, 'Sense Motive': 5 },
      anySkillRanks: 6,
      anySkillPrefix: 'Knowledge',
      feats: ['Alertness'],
      alignment: 'Any nonchaotic',
    },
    features: ['Extreme Focus', 'Trap Sense', 'Erudite Synergy', 'Uncanny Dodge', 'Improved Uncanny Dodge', 'Intuitive Logic'],
    hitDie: 6,
    skillPoints: 6,
    baseAttackBonus: 'medium',
    fortitude: 'poor',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Appraise', 'Bluff', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disguise', 'Gather Information', 'Hide', 'Intimidate', 'Knowledge (*)', 'Listen', 'Move Silently', 'Open Lock', 'Profession', 'Search', 'Sense Motive', 'Speak Language', 'Spot'],
    maximumLevel: 10,
    levelUpEnabled: true,
  },
  'legendary-tactician': {
    id: 'legendary-tactician',
    name: 'Legendary Tactician',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      bab: 5,
      skills: { Diplomacy: 4 },
      feats: ['Leadership'],
    },
    features: ['Leadership Bonus', 'Inspire Courage', 'Direct Troops', 'Rally Troops', 'Hard March', 'Rout Enemies', 'Battle Standard', 'Strategic Retreat', 'The Forlorn Hope'],
    hitDie: 8,
    skillPoints: 4,
    baseAttackBonus: 'good',
    fortitude: 'good',
    reflex: 'poor',
    will: 'poor',
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Knowledge (history)', 'Profession', 'Ride', 'Sense Motive'],
    weaponProficiency: 'martial',
    armorProficiencies: ['light', 'medium', 'heavy'],
    shieldProficiency: true,
    towerShieldProficiency: true,
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Participated in at least three major skirmishes (each involving at least ten enemy combatants), including one defeat, and commands a loyal group of soldiers (up to five).',
  },
  'righteous-zealot': {
    id: 'righteous-zealot',
    name: 'Righteous Zealot',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      skills: { Bluff: 3, Concentration: 8, Diplomacy: 8, Perform: 3, 'Sense Motive': 4 },
    },
    features: ['Oration: Enthralling Discourse', 'Oration: Compelling Argument', 'Oration: Condemning Tirade', 'Oration: Verbal Obfuscation', 'Oration: Inflammatory Oratory', 'Righteous Indignation', 'Resist Enchantment', 'Gather Followers', 'Martyr’s Luck'],
    hitDie: 6,
    skillPoints: 4,
    baseAttackBonus: 'poor',
    fortitude: 'poor',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Bluff', 'Concentration', 'Diplomacy', 'Gather Information', 'Intimidate', 'Knowledge (religion)', 'Perform', 'Profession', 'Sense Motive', 'Speak Language'],
    maximumLevel: 10,
    levelUpEnabled: true,
  },
  'renegade-hunter': { id: 'renegade-hunter', name: 'Renegade Hunter', source: 'dragonlance-user-pack', sourceBook: 'Towers of High Sorcery (3.5)', prerequisites: { feats: ['Spell Focus'] }, features: ['Magic detection', 'Counterspell training', 'Hunter of renegades'] },
  'wizard-of-high-sorcery': {
    id: 'wizard-of-high-sorcery',
    name: 'Wizard of High Sorcery',
    source: 'dragonlance-user-pack',
    sourceBook: 'Dragonlance Campaign Setting (3.5)',
    prerequisites: {
      baseSaves: { will: 4 },
      skills: { Spellcraft: 7 },
      feats: ['Spell Focus'],
      featChoices: [{
        anyOf: [
          'brew-potion', 'craft-magic-arms-and-armor', 'craft-rod', 'craft-staff',
          'craft-wand', 'craft-wondrous-item', 'forge-ring', 'scribe-scroll',
          'empower-spell', 'enlarge-spell', 'extend-spell', 'heighten-spell',
          'maximize-spell', 'quicken-spell', 'silent-spell', 'still-spell',
          'widen-spell',
        ],
        count: 2,
      }],
      spellcasting: { type: 'arcane', level: 2 },
      classes: ['wizard'],
    },
    features: ['Enhanced Specialization', 'Item of Power', 'Moon Magic', 'Tower Resources', 'Arcane Research', 'Order Secret'],
    hitDie: 4,
    skillPoints: 2,
    baseAttackBonus: 'poor',
    fortitude: 'poor',
    reflex: 'poor',
    will: 'good',
    classSkills: ['Concentration', 'Craft', 'Intimidate', 'Knowledge (*)', 'Profession', 'Speak Language', 'Spellcraft'],
    spellcastingProgression: { type: 'arcane' },
    maximumLevel: 10,
    levelUpEnabled: true,
    roleplayPrerequisite: 'Pass the Test of High Sorcery, declare a robe order, specialize in one of its schools, and choose both barred schools from the other orders’ favored schools.',
  },
  'white-robed-wizard': { id: 'white-robed-wizard', name: 'White-Robed Wizard', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['White robe oath', 'Protective magic', 'Lunar spell power'] },
  'red-robed-wizard': { id: 'red-robed-wizard', name: 'Red-Robed Wizard', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['Red robe oath', 'Neutral magic', 'Lunar spell power'] },
  'black-robed-wizard': { id: 'black-robed-wizard', name: 'Black-Robed Wizard', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', prerequisites: { ability: { int: 13 }, feats: ['Mages of High Sorcery'], classes: ['wizard', 'sorcerer'] }, features: ['Black robe oath', 'Aggressive magic', 'Lunar spell power'] },
  'master-of-the-way': { id: 'master-of-the-way', name: 'Master of the Way', source: 'dragonlance-user-pack', prerequisites: { ability: { wis: 13 }, feats: ['Improved Unarmed Strike'], classes: ['monk'] }, features: ['Monastic discipline', 'Ki strike', 'Way mastery'] },
}

export const initialCharacter: Character = {
  name: 'Unnamed Hero', player: 'Player', gender: '', age: '', height: '5 ft. 7 in.', weight: '', hairColor: '', eyeColor: '', skinColor: '', temporaryHitPoints: 0, nonlethalDamage: 0, damageReduction: '', spellResistance: '', notes: '', race: 'Human', ruleset: 'core-35-srd', alignment: 'Neutral Good',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  classLevels: [{ classId: 'fighter', level: 1 }], hitPoints: 10, feats: [], featSelections: {}, featWeaponSelections: {}, featSkillSelections: {}, featSpellSchoolSelections: {}, skills: {}, skillRanksByClass: {}, knownSpells: [], preparedSpells: [], equipment: {}, mainWeaponGrip: 'one-handed', doubleWeaponMode: false, doubleWeaponPrimaryEnd: 'first', towerShieldTotalCover: false, shieldBashMode: false, animatedShieldMode: false, forceShieldActive: false, shieldBlindingUsesByItem: {}, inventory: {}, languages: ['Common'], prestigeClass: undefined, deity: undefined, highSorceryOrder: undefined,
}

export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2)
}

export function getRacialHitDiceDefinition(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const applicableRace = character.ruleset === 'core-35-srd' && race?.source !== 'core-35-srd'
    ? undefined
    : race
  return applicableRace?.racialHitDice
}

export function getTotalHitDice(character: Character) {
  const classHitDice = character.classLevels.reduce((total, entry) => total + entry.level, 0)
  return classHitDice + (getRacialHitDiceDefinition(character)?.count ?? 0)
}

export function getEffectiveCharacterLevel(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const applicableRace = character.ruleset === 'core-35-srd' && race?.source !== 'core-35-srd'
    ? undefined
    : race
  return getTotalHitDice(character) + (applicableRace?.levelAdjustment ?? 0)
}

export function sizeModifier(character: Character) {
  const race = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const applicableRace = character.ruleset === 'core-35-srd' && race?.source !== 'core-35-srd'
    ? undefined
    : race
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
  return sizeModifiers[applicableRace?.size ?? 'Medium']
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
  const applicableRace = character.ruleset === 'core-35-srd' && race?.source !== 'core-35-srd'
    ? undefined
    : race
  const size = applicableRace?.size ?? 'Medium'
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
  const oldRace = raceDefinitions[character.race.toLowerCase().replaceAll(' ', '-')]
  const newRace = raceDefinitions[race.toLowerCase().replaceAll(' ', '-')]
  const oldModifiers = character.ruleset === 'core-35-srd' && oldRace?.source !== 'core-35-srd'
    ? {}
    : oldRace?.abilityModifiers ?? {}
  const newModifiers = character.ruleset === 'core-35-srd' && newRace?.source !== 'core-35-srd'
    ? {}
    : newRace?.abilityModifiers ?? {}
  for (const ability of Object.keys(nextCharacter.abilities) as AbilityName[]) {
    nextCharacter.abilities[ability] -= oldModifiers[ability] ?? 0
    nextCharacter.abilities[ability] += newModifiers[ability] ?? 0
  }
  nextCharacter.race = race
  if (newRace?.id !== 'human') nextCharacter.regionalLanguage = undefined
  return nextCharacter
}

export function nextClassLevel(character: Character, classId: ClassId) {
  return Math.max(0, ...character.classLevels.filter((entry) =>
    !('prestigeClassId' in entry) && entry.classId === classId,
  ).map((entry) => entry.level)) + 1
}

export function rollHitDie(hitDie: number) {
  return Math.floor(Math.random() * hitDie) + 1
}

export function isValidHitDieRoll(roll: number, hitDie: number) {
  return Number.isSafeInteger(roll) && roll >= 1 && roll <= hitDie
}

export function hitPointGain(character: Character, hitPointRoll: number) {
  return Math.max(1, hitPointRoll + abilityModifier(character.abilities.con))
}

function snapshotSkillRanksAtCurrentLevel(character: Character) {
  const characterLevel = getTotalHitDice(character)
  if (character.skillRanksByLevel?.[characterLevel]) return character
  return {
    ...character,
    skillRanksByLevel: {
      ...(character.skillRanksByLevel ?? {}),
      [characterLevel]: { ...character.skills },
    },
  }
}

export function levelUpHitPointGain(original: Character, proposed: Character, hitPointRoll: number) {
  const previousHitDice = getTotalHitDice(original)
  const constitutionModifierIncrease =
    abilityModifier(proposed.abilities.con) - abilityModifier(original.abilities.con)
  return hitPointGain(proposed, hitPointRoll) + previousHitDice * constitutionModifierIncrease
}

export function beginLevelUp(character: Character, classId: ClassId): LevelUpDraft {
  const proposed = snapshotSkillRanksAtCurrentLevel(cloneCharacter(character))
  const existingClass = proposed.classLevels.find((entry) =>
    !('prestigeClassId' in entry) && entry.classId === classId,
  )
  if (classId === 'noble' && !existingClass && getTotalHitDice(character) > 0)
    throw new Error('The Noble class can only be taken at 1st character level.')
  if (existingClass) existingClass.level = nextClassLevel(character, classId)
  else proposed.classLevels = [...proposed.classLevels, { classId, level: 1 }]
  return { original: cloneCharacter(character), proposed, classId, abilityIncrease: null, validationErrors: [] }
}

export function beginPrestigeLevelUp(
  character: Character,
  prestigeClassId: PrestigeClassId,
  spellcastingClassId?: ClassId,
): LevelUpDraft {
  const definition = dragonlancePrestigeClasses[prestigeClassId]
  const currentPrestigeEntry = character.classLevels.find(
    (entry) => 'prestigeClassId' in entry && entry.prestigeClassId === prestigeClassId,
  )
  const classId = currentPrestigeEntry?.classId ?? spellcastingClassId ?? character.classLevels.find(
    (entry) => !('prestigeClassId' in entry),
  )?.classId
  if (!classId) throw new Error('A prestige class level requires an existing base class.')
  const currentLevel = Math.max(
    0,
    ...character.classLevels
      .filter((entry) => 'prestigeClassId' in entry && entry.prestigeClassId === prestigeClassId)
      .map((entry) => entry.level),
  )
  if (definition.maximumLevel && currentLevel >= definition.maximumLevel)
    throw new Error(`${definition.name} cannot exceed level ${definition.maximumLevel}.`)
  const proposed = snapshotSkillRanksAtCurrentLevel(cloneCharacter(character))
  const existingPrestigeClass = proposed.classLevels.find(
    (entry) => 'prestigeClassId' in entry && entry.prestigeClassId === prestigeClassId,
  )
  if (existingPrestigeClass) existingPrestigeClass.level = currentLevel + 1
  else proposed.classLevels = [
    ...proposed.classLevels,
    { classId, prestigeClassId, level: 1 },
  ]
  return {
    original: cloneCharacter(character),
    proposed,
    classId,
    prestigeClassId,
    specialPrerequisiteConfirmed: currentLevel > 0,
    abilityIncrease: null,
    validationErrors: [],
  }
}

export function validateLevelUp(draft: LevelUpDraft): string[] {
  const errors: string[] = []
  const originalTotalLevel = getTotalHitDice(draft.original)
  const proposedTotalLevel = getTotalHitDice(draft.proposed)
  if (proposedTotalLevel !== originalTotalLevel + 1) errors.push('A level-up must add exactly one class level.')
  if (draft.proposed.classLevels.some((entry) => entry.level < 1)) errors.push('Class levels must be at least 1.')
  const alreadyNoble = draft.original.classLevels.some((entry) =>
    !('prestigeClassId' in entry) && entry.classId === 'noble',
  )
  const gainsNoble = draft.proposed.classLevels.some((entry) =>
    !('prestigeClassId' in entry) && entry.classId === 'noble',
  )
  if (!alreadyNoble && gainsNoble && originalTotalLevel > 0)
    errors.push('The Noble class can only be taken at 1st character level.')
  const existingPrestigeLevel = draft.prestigeClassId
    ? draft.original.classLevels.some((entry) =>
        'prestigeClassId' in entry && entry.prestigeClassId === draft.prestigeClassId,
      )
    : false
  if (draft.prestigeClassId && !existingPrestigeLevel && !draft.specialPrerequisiteConfirmed)
    errors.push('Confirm the prestige class special prerequisite before confirming the level-up.')
  if (
    draft.prestigeClassId &&
    dragonlancePrestigeClasses[draft.prestigeClassId].maximumLevel &&
    Math.max(
      0,
      ...draft.proposed.classLevels
        .filter((entry) => 'prestigeClassId' in entry && entry.prestigeClassId === draft.prestigeClassId)
        .map((entry) => entry.level),
    ) > dragonlancePrestigeClasses[draft.prestigeClassId].maximumLevel!
  ) errors.push(`${dragonlancePrestigeClasses[draft.prestigeClassId].name} cannot exceed level ${dragonlancePrestigeClasses[draft.prestigeClassId].maximumLevel}.`)
  if (proposedTotalLevel % 4 === 0 && !draft.abilityIncrease)
    errors.push('Choose an ability score to increase before confirming the level-up.')
  return errors
}
