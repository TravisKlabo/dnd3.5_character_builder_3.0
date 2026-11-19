import type { StoreItem } from './data/itemTypes'
import { getEffectiveAbilityScore } from './abilityEquipment'
import type { CombatEffect } from './combatEffects'
import type { ClericDomainId } from './data/clericDomains'

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityScores = Record<AbilityName, number>

export type ClassId = 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'wizard' | 'mystic' | 'noble'
export type IndependentSpellcastingClassId = 'assassin' | 'blackguard'
export type SpellcastingClassId = ClassId | IndependentSpellcastingClassId
export const dragonDiscipleBonusLevels = [1, 2, 4, 5, 6, 8, 9] as const
export const dragonDiscipleVarieties = ['Black', 'Blue', 'Green', 'Red', 'White', 'Brass', 'Bronze', 'Copper', 'Gold', 'Silver'] as const
export type DragonDiscipleVariety = typeof dragonDiscipleVarieties[number]
export type DragonDiscipleSlot = { classId: SpellcastingClassId; level: number }
export const highArcanaMinimumSlots = {
  'Arcane Fire': 9, 'Arcane Reach': 7, 'Mastery of Counterspelling': 7,
  'Mastery of Elements': 8, 'Mastery of Shaping': 6, 'Spell Power': 5, 'Spell-Like Ability': 5,
} as const
export type HighArcana = keyof typeof highArcanaMinimumSlots
export type HighArcanaChoice = { ability: HighArcana; classId: ClassId; slot: number; reserve?: number; spellNote?: string }
export function canRepeatHighArcana(ability: HighArcana, prior: readonly (HighArcanaChoice | null)[]) {
  return ability === 'Spell-Like Ability' ||
    prior.filter((choice) => choice?.ability === ability).length < (ability === 'Arcane Reach' ? 2 : 1)
}
export function getDragonDiscipleAbilityBoost(level: number): Partial<AbilityScores> {
  if (level === 2 || level === 4) return { str: 2 }
  if (level === 6) return { con: 2 }
  if (level === 8) return { int: 2 }
  if (level === 10) return { str: 4, cha: 2 }
  return {}
}

export function isIndependentSpellcastingClass(id: unknown): id is IndependentSpellcastingClassId {
  return id === 'assassin' || id === 'blackguard'
}
export type SkillRankSourceId = ClassId | PrestigeClassId | 'racial-hit-dice'
export type SkillTrickCategory = 'interaction' | 'manipulation' | 'mental' | 'movement'
export interface SkillTrickSelection {
  trickId: string
  sourceId?: SkillRankSourceId
  featSlotId?: string
}
export const magicSchools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'] as const
export const horizonWalkerTerrains = ['Aquatic', 'Desert', 'Forest', 'Hills', 'Marsh', 'Mountains', 'Plains', 'Underground'] as const
export const horizonWalkerPlanarTerrains = ['Aligned', 'Cavernous', 'Cold', 'Fiery', 'Shifting', 'Weightless'] as const
export type HorizonWalkerTerrain = typeof horizonWalkerTerrains[number] | typeof horizonWalkerPlanarTerrains[number]

export function getHorizonWalkerTerrainOptions(level: number): readonly HorizonWalkerTerrain[] {
  return level >= 6 ? [...horizonWalkerTerrains, ...horizonWalkerPlanarTerrains] : horizonWalkerTerrains
}

export function isHorizonWalkerTerrainHistory(value: unknown, level: number): value is HorizonWalkerTerrain[] {
  return level <= 10 && Array.isArray(value) && value.length === level &&
    new Set(value).size === value.length &&
    value.every((terrain: unknown, index) => getHorizonWalkerTerrainOptions(index + 1).some((option) => option === terrain))
}
export type MagicSchool = (typeof magicSchools)[number]
export const loremasterSecrets = [
  'Instant Mastery', 'Secret Health', 'Secrets of Inner Strength', 'The Lore of True Stamina',
  'Secret Knowledge of Avoidance', 'Weapon Trick', 'Dodge Trick', 'Applicable Knowledge',
  'Newfound Arcana', 'More Newfound Arcana',
] as const
export const hierophantAbilities = [
  'Blast Infidel', 'Divine Reach', 'Faith Healing', 'Gift of the Divine', 'Mastery of Energy',
  'Metamagic Feat', 'Power of Nature', 'Spell Power', 'Spell-Like Ability',
] as const
export type LoremasterSecret = typeof loremasterSecrets[number]
export type HierophantAbility = typeof hierophantAbilities[number]

export function getHierophantAbilityOptions(character: Pick<Character, 'classLevels'>, prior: readonly HierophantAbility[]) {
  const hasClass = (classId: ClassId) => character.classLevels.some((entry) =>
    !('prestigeClassId' in entry) && entry.classId === classId)
  return hierophantAbilities.filter((ability) => {
    if ((ability === 'Gift of the Divine' || ability === 'Mastery of Energy') && !hasClass('cleric')) return false
    if (ability === 'Power of Nature' && !hasClass('druid')) return false
    if (ability === 'Spell Power' || ability === 'Metamagic Feat' || ability === 'Spell-Like Ability') return true
    return prior.filter((selected) => selected === ability).length < (ability === 'Divine Reach' ? 2 : 1)
  })
}
export type PrestigeClassId = 'knight-of-the-crown' | 'knight-of-the-sword' | 'knight-of-the-rose' | 'knight-of-the-lily' | 'knight-of-the-skull' | 'knight-of-the-thorn' | 'knight-of-neraka' | 'steel-legionnaire' | 'wizard-of-high-sorcery' | 'white-robed-wizard' | 'red-robed-wizard' | 'black-robed-wizard' | 'dragon-rider' | 'inquisitor' | 'legendary-tactician' | 'righteous-zealot' | 'renegade-hunter' | 'master-of-the-way' | 'arcane-archer' | 'arcane-trickster' | 'archmage' | 'assassin' | 'blackguard' | 'dragon-disciple' | 'duelist' | 'dwarven-defender' | 'eldritch-knight' | 'hierophant' | 'horizon-walker' | 'loremaster' | 'mystic-theurge' | 'red-wizard' | 'shadowdancer' | 'thaumaturgist'
export type FeatId = string
export type FeatCategory = 'metamagic' | 'item-creation' | 'draconic' | 'luck' | 'domain' | 'divine' | 'reserve' | 'tactical' | 'wild' | 'shifter'
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
  divineSpellcastingClassId?: ClassId
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
  sourceBook?: string
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
  racialSimpleWeaponProficiency?: boolean
  racialArmorProficiencies?: ('light' | 'medium' | 'heavy')[]
  racialShieldProficiency?: boolean
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
export type CombatTargetType = 'orc' | 'goblinoid' | 'kobold' | 'giant' | 'aberration'

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
    minimumMatchingSkills?: number
    alignment?: string
    feats?: string[]
    anyFeats?: string[]
    featChoices?: { anyOf: string[]; count: number }[]
    featCategoryChoices?: { anyOf: FeatCategory[]; count: number }[]
    weaponFocusChoices?: string[]
    skillFocus?: string
    skillFocusPrefix?: string
    spellFocusSchools?: MagicSchool[]
    minimumSpellFocusSchools?: number
    allMartialWeaponProficiencies?: boolean
    languages?: string[]
    sneakAttackDice?: number
    spontaneousArcaneSpellcasting?: boolean
    classes?: ClassId[]
    prestigeClasses?: Partial<Record<PrestigeClassId, number>>
    classFeatures?: string[]
    spellcasting?: { type: 'arcane' | 'divine'; level: number }
    additionalSpellcasting?: { type: 'arcane' | 'divine'; level: number }[]
    spellSchoolSpells?: { school: MagicSchool; count: number; minimumLevel: number }
    arcaneSpellRepertoire?: { castableLevel: number; schoolCount: number; minimumSchoolSpellLevel: number }
    spells?: string[]
    races?: string[]
  }
  features: string[]
  referenceSpellList?: {
    levels: Readonly<Record<number, readonly string[]>>
    note?: string
  }
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
  spellcastingProgression?: { type: 'arcane' | 'divine' | 'either'; startsAtLevel?: number; chooseEachLevel?: boolean }
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
  divineSpellcastingClassId?: ClassId
  level: number
}

export interface FeatDefinition {
  id: FeatId
  name: string
  source: ContentSourceId
  sourceBook?: string
  description: string
  categories?: FeatCategory[]
  ambush?: boolean
  skillBonuses?: Partial<Record<string, number>>
  prerequisites?: {
    abilities?: Partial<Record<AbilityName, number>>
    baseAttackBonus?: number
    baseSaves?: Partial<Record<'fortitude' | 'reflex' | 'will', number>>
    minimumCharacterLevel?: number
    minimumFavoredEnemies?: number
    minimumSkirmishDamageDice?: number
    minimumSkirmishACBonus?: number
    hugeOrLarger?: boolean
    minimumSize?: NonNullable<RaceDefinition['size']>
    maximumSize?: NonNullable<RaceDefinition['size']>
    anyWeaponProficiency?: boolean
    anyArmorProficiency?: boolean
    shieldProficiency?: boolean
    casterLevel?: number
    arcaneCasterLevel?: number
    arcaneSpellcasting?: boolean
    spontaneousArcane?: boolean
    divineCasterLevel?: number
    manifesterLevel?: number
    racialSpellLikeAbilityCasterLevel?: number
    arcaneSpellcastingOrRacialSpellLikeAbility?: boolean
    powerPointReserve?: boolean
    kiPower?: boolean
    kiStrikeMagic?: boolean
    allMartialWeaponProficiencies?: boolean
    stealSpell?: boolean
    swashbucklerGrace?: boolean
    classLevels?: Partial<Record<ClassId, number>>
    anyClassLevels?: Partial<Record<ClassId, number>>
    prestigeClassLevels?: Partial<Record<PrestigeClassId, number>>
    classFeatures?: string[]
    anyClassFeatures?: string[]
    anyClassFeatureGroups?: string[][]
    smiteAbility?: boolean
    alignment?: {
      component?: 'Lawful' | 'Chaotic' | 'Good' | 'Evil' | 'Neutral'
      nonLawful?: boolean
      nonGood?: boolean
      nonEvil?: boolean
    }
    alignmentMatchesDeity?: boolean
    alignmentWithinOneStepOfDeity?: boolean
    arcaneSpellLevel?: number
    divineSpellLevel?: number
    paladinSpellLevel?: number
    spellLevel?: number
    conjurationHealingSpell?: boolean
    spontaneousCureOrInflict?: boolean
    cureWoundsSpell?: boolean
    summonNaturesAllySpell?: boolean
    inflictWoundsSpell?: boolean
    turnsElementalSubtype?: boolean
    rebukesElementalSubtype?: boolean
    fastWildShape?: boolean
    warmageLevelFour?: boolean
    graduatedFromApprenticeship?: boolean
    mentorSkillPrerequisites?: boolean
    guildMembership?: boolean
    guildmasterPrerequisites?: boolean
    bondingRitual?: boolean
    rechargeableBreathWeapon?: boolean
    detectMagicAccess?: boolean
    thoonAffiliation?: boolean
    minimumArcaneSpellcastingAbilityScore?: number
    maximumNormalSpellLevel?: boolean
    maximumNormalArcaneSpellLevel?: boolean
    flySpeed?: boolean
    feats?: FeatId[]
    anyFeats?: FeatId[]
    featCategoryChoices?: { anyOf: FeatCategory[]; count: number }[]
    draconianBreathWeapon?: boolean
    races?: string[]
    skills?: Record<string, number>
    anySkills?: Record<string, number>
    anySkillRanks?: number
    anySkillPrefix?: string
    prerequisiteAlternatives?: Array<{
      feats?: FeatId[]
      classFeatures?: string[]
      anyClassFeatures?: string[]
      abilities?: Partial<Record<AbilityName, number>>
      races?: string[]
      skills?: Record<string, number>
      anySkills?: Record<string, number>
      minimumSkirmishDamageDice?: number
      featSkillChoices?: string[]
    }>
    featChoices?: { anyOf: FeatId[]; count: number }[]
    domains?: ClericDomainId[]
    minimumDomains?: number
    minimumClericDomains?: number
    spellFocusOrWizardSpecializationSchools?: MagicSchool[]
    minimumFeatsByCategory?: Partial<Record<FeatCategory, number>>
    minimumSkillTricksByCategory?: Partial<Record<SkillTrickCategory, number>>
    spellFocusSchools?: MagicSchool[]
    weaponFocusChoices?: string[]
    weaponFocusChoiceGroups?: string[][]
    weaponProficiencyChoices?: string[]
    weaponProficiencyChoiceGroups?: string[][]
    weaponFeatChoiceGroups?: Array<{
      featIds: FeatId[]
      damageTypes?: Array<'bludgeoning' | 'piercing' | 'slashing'>
    }>
    weaponFocusReach?: boolean
    weaponFocusDamageTypes?: Array<'bludgeoning' | 'piercing' | 'slashing'>
  }
  fighterBonus?: boolean
  wizardBonus?: true | MagicSchool
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
  flySpeed?: number
  hitPoints: number
  hitPointRolls?: HitPointRollRecord[]
  baseAttackBonusByLevel?: Partial<Record<number, number>>
  feats: string[]
  featSelections: Record<string, FeatId | ''>
  featWeaponSelections?: Record<string, string>
  featSkillSelections?: Record<string, string>
  featSpellSchoolSelections?: Record<string, MagicSchool>
  featSpellMasterySelections?: Record<string, string[]>
  featSpellMasterySelectionCounts?: Record<string, number>
  skills: Record<string, number>
  skillRanksByClass: Record<string, Record<string, number>>
  skillRanksByLevel?: Partial<Record<number, Record<string, number>>>
  skillTricksByLevel?: Partial<Record<number, SkillTrickSelection[]>>
  knownSpells: string[]
  knownSpellClasses?: Record<string, SpellcastingClassId>
  knownSpellsByClass?: Partial<Record<SpellcastingClassId, string[]>>
  spellAcquisitionByClass?: Partial<Record<SpellcastingClassId, Record<string, SpellAcquisition>>>
  wizardSpellLearning?: Record<string, WizardSpellLearning>
  preparedSpells: string[]
  preparedSpellsByClass?: Partial<Record<SpellcastingClassId, string[]>>
  preparedSpellSlotLevelsByClass?: Partial<Record<SpellcastingClassId, Record<string, number[]>>>
  empowerByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  maximizeByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  extendByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  enlargeByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  quickenByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  silentByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  stillByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  widenByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  sculptByClass?: Partial<Record<SpellcastingClassId, Record<string, boolean[]>>>
  spellPreparationCompletedByClass?: Partial<Record<SpellcastingClassId, boolean>>
  clericDomains?: import('./data/clericDomains').ClericDomainId[]
  clericDomainPreparation?: Record<string, import('./data/clericDomains').ClericDomainSpell>
  clericDomainExpended?: number[]
  mysticDomain?: ClericDomainId
  expendedSpellSlotsByClass?: Partial<Record<SpellcastingClassId, Record<string, number[]>>>
  racialSpellLikeUses?: string[]
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
  hasPowerPointReserve?: boolean
  hasKiPower?: boolean
  hasKiStrikeMagic?: boolean
  hasAllMartialWeaponProficiencies?: boolean
  hasStealSpell?: boolean
  hasSwashbucklerGrace?: boolean
  hasConjurationHealingSpell?: boolean
  hasSpontaneousCureOrInflict?: boolean
  hasCureWoundsSpell?: boolean
  hasSummonNaturesAllySpell?: boolean
  hasInflictWoundsSpell?: boolean
  canTurnElementalSubtype?: boolean
  canRebukeElementalSubtype?: boolean
  hasFastWildShape?: boolean
  hasWarmageLevelFour?: boolean
  hasGraduatedFromApprenticeship?: boolean
  hasMentorSkillPrerequisites?: boolean
  isGuildMember?: boolean
  hasGuildmasterPrerequisites?: boolean
  hasCompletedBondingRitual?: boolean
  hasRechargeableBreathWeapon?: boolean
  hasDetectMagicAccess?: boolean
  isThoonAffiliate?: boolean
  divineCasterLevel?: number
  clericUndeadTurningMode?: "turn" | "rebuke"
  manifesterLevel?: number
  skirmishDamageDice?: number
  skirmishACBonus?: number
  prestigeClass?: PrestigeClassId
  honorBoundSuspended?: boolean
  knightOfTheCrownState?: {
    strengthOfHonorUsesUsed?: number
    crownOfKnighthoodUsed?: boolean
  }
  classFeatures?: string[]
  customItems?: StoreItem[]
  deity?: string
  coreWizardSpecializationSchool?: MagicSchool
  highSorceryOrder?: 'white' | 'red' | 'black'
  wizardSpecializationSchool?: MagicSchool
  wizardBarredSchools?: MagicSchool[]
  dragonlanceMoonState?: DragonlanceMoonState
  rangerFavoredEnemies?: RangerFavoredEnemyChoice[]
  horizonWalkerTerrainMasteries?: HorizonWalkerTerrain[]
  loremasterSecrets?: LoremasterSecret[]
  loremasterLanguages?: string[]
  hierophantAbilities?: HierophantAbility[]
  dragonDiscipleVariety?: DragonDiscipleVariety
  dragonDiscipleBonusSlots?: DragonDiscipleSlot[]
  highArcanaChoices?: (HighArcanaChoice | null)[]
  redWizardSpecializationSchool?: MagicSchool
  redWizardProhibitedSchools?: MagicSchool[]
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
  paladin: { id: 'paladin', name: 'Paladin', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 10, skillPoints: 2, baseAttackBonus: 'good', fortitude: 'good', reflex: 'poor', will: 'poor', spellcasting: true },
  ranger: { id: 'ranger', name: 'Ranger', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 6, baseAttackBonus: 'good', fortitude: 'good', reflex: 'good', will: 'poor', spellcasting: true },
  rogue: { id: 'rogue', name: 'Rogue', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 6, skillPoints: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'poor', spellcasting: false },
  sorcerer: { id: 'sorcerer', name: 'Sorcerer', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  wizard: { id: 'wizard', name: 'Wizard', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'poor', will: 'good', spellcasting: true },
  cleric: { id: 'cleric', name: 'Cleric', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", hitDie: 8, skillPoints: 2, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  mystic: { id: 'mystic', name: 'Mystic', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', hitDie: 8, skillPoints: 2, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'good', spellcasting: true },
  noble: { id: 'noble', name: 'Noble', source: 'dragonlance-user-pack', sourceBook: 'Dragonlance Campaign Setting (3.5)', hitDie: 8, skillPoints: 4, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'good', spellcasting: false },
}

export const raceDefinitions: Record<string, RaceDefinition> = {
  human: { id: 'human', name: 'Human', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Medium', speed: 30, abilityModifiers: {}, specialAbilities: ['Bonus feat', 'Extra skill points'] },
  dwarf: { id: 'dwarf', name: 'Dwarf', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Medium', speed: 20, abilityModifiers: { con: 2, cha: -2 }, racialSituationalSkillBonuses: { Search: { 'unusual-stonework': 2 }, Appraise: { 'stone-or-metal': 2 }, Craft: { 'stone-or-metal': 2 } }, racialSituationalSaveBonuses: { poison: 2, spell: 2 }, racialAttackBonuses: { orc: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, specialAbilities: ['Darkvision 60 ft.', 'Stonecunning', 'Stability (+4 to resist bull rush or trip while firmly grounded)', 'Waraxe/urgrosh familiarity', '+2 saves vs. poison/spells', '+1 attack vs. orcs/goblinoids; +4 dodge AC vs. giants', 'Stone/metal Appraise/Craft +2'] },
  elf: { id: 'elf', name: 'Elf', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: -2 }, racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision (see twice as far as humans in starlight, moonlight, torchlight, and similar poor illumination; retain color and detail)', 'Immune to magical sleep effects', 'Enchantment saves +2', 'Search check for secret/concealed doors when passing within 5 ft.', 'Elf weapon proficiencies'] },
  halfling: { id: 'halfling', name: 'Halfling', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Small', speed: 20, abilityModifiers: { dex: 2, str: -2 }, racialSkillBonuses: { Climb: 2, Jump: 2, Listen: 2, 'Move Silently': 2 }, racialSavingThrowBonus: 1, racialSituationalSaveBonuses: { fear: 2 }, specialAbilities: ['All saves +1; fear +2', 'Thrown/slings attacks +1'] },
  gnome: { id: 'gnome', name: 'Gnome', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Small', speed: 20, abilityModifiers: { con: 2, str: -2 }, racialSkillBonuses: { Listen: 2 }, racialSituationalSkillBonuses: { Craft: { alchemy: 2 } }, racialSituationalSaveBonuses: { illusion: 2 }, racialAttackBonuses: { kobold: 1, goblinoid: 1 }, racialDodgeACBonuses: { giant: 4 }, racialSpellLikeAbilities: [
    { name: 'Speak with Animals', usesPerDay: 1, casterLevel: 1, notes: 'Burrowing mammals only; duration 1 minute.' },
    { name: 'Dancing Lights', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'evocation', minimumCharisma: 10 },
    { name: 'Ghost Sound', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'illusion', savingThrow: 'Will disbelief', minimumCharisma: 10 },
    { name: 'Prestidigitation', usesPerDay: 1, casterLevel: 1, spellLevel: 0, school: 'universal', minimumCharisma: 10 },
  ], racialSpellSchoolDcBonuses: { illusion: 1 }, specialAbilities: ['Low-light vision', 'Illusion saves +2; DC +1', 'Hooked hammer familiarity', '+1 attack vs. kobolds/goblinoids; +4 dodge AC vs. giants', 'Craft (alchemy) +2'] },
  'half-orc': { id: 'half-orc', name: 'Half-orc', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Medium', speed: 30, abilityModifiers: { str: 2, int: -2, cha: -2 }, specialAbilities: ['Darkvision 60 ft.', 'Orc blood'] },
  'half-elf': { id: 'half-elf', name: 'Half-elf', source: 'core-35-srd', sourceBook: "Player's Handbook (3.5)", size: 'Medium', speed: 30, abilityModifiers: {}, racialSkillBonuses: { Listen: 1, Search: 1, Spot: 1, Diplomacy: 2, 'Gather Information': 2 }, racialSituationalSaveBonuses: { enchantment: 2 }, specialAbilities: ['Low-light vision (see twice as far as humans in starlight, moonlight, torchlight, and similar poor illumination; retain color and detail)', 'Immune to sleep spells and similar magical effects', 'Enchantment saves +2', 'Elven blood'] },
  'gold-dwarf': {
    id: 'gold-dwarf', name: 'Gold Dwarf', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)",
    size: 'Medium', speed: 20, abilityModifiers: { con: 2, dex: -2 },
    racialSituationalSkillBonuses: { Search: { 'unusual-stonework': 2 }, Appraise: { 'stone-or-metal': 2 }, Craft: { 'stone-or-metal': 2 } },
    racialSituationalSaveBonuses: { poison: 2, spell: 2 },
    racialAttackBonuses: { aberration: 1 },
    racialDodgeACBonuses: { giant: 4 },
    specialAbilities: ['Darkvision 60 ft.', 'Stonecunning', 'Stability (+4 to resist bull rush or trip while firmly grounded)', 'Dwarven waraxe/urgrosh familiarity', '+2 saves vs. poison/spells', '+1 attack vs. aberrations; +4 dodge AC vs. giants', 'Gold Dwarf example uses the PHB dwarf chassis'],
  },
  'half-human-elf': {
    id: 'half-human-elf', name: 'Half-Human Elf', source: 'core-35-srd', sourceBook: "Dungeon Master's Guide (3.5)",
    size: 'Medium', speed: 30, abilityModifiers: {},
    racialSkillBonuses: { Listen: 1, Search: 1, Spot: 1 },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialWeaponProficiencies: ['Longsword', 'Rapier', 'Shortbow', 'Longbow'],
    specialAbilities: ['Low-light vision', 'Immune to sleep spells and similar magical effects', 'Enchantment saves +2', 'Elven blood', 'No Diplomacy or Gather Information racial bonus', 'Elf weapon proficiency: longsword, rapier, longbow, shortbow', 'Favored class: Wizard'],
  },
  'mm1-goblin': {
    id: 'mm1-goblin', name: 'Goblin', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Small', speed: 30, abilityModifiers: { str: -2, dex: 2, cha: -2 },
    racialSkillBonuses: { 'Move Silently': 4, Ride: 4 },
    traits: ['Darkvision 60 ft.', 'Favored class: Rogue', 'Automatic languages: Common and Goblin'],
  },
  'mm1-kobold': {
    id: 'mm1-kobold', name: 'Kobold', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Small', speed: 30, abilityModifiers: { str: -4, dex: 2, con: -2 },
    racialSkillBonuses: { Craft: 2, Profession: 2, Search: 2 }, racialNaturalArmorBonus: 1,
    traits: ['Darkvision 60 ft.', 'Light sensitivity: dazzled in bright sunlight or daylight', 'Craft (trapmaking), Profession (miner), and Search +2', 'Favored class: Sorcerer'],
  },
  'mm1-orc': {
    id: 'mm1-orc', name: 'Orc', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 30, abilityModifiers: { str: 4, int: -2, wis: -2, cha: -2 },
    racialWeaponProficiencies: ['Orc Double Axe'],
    traits: ['Darkvision 60 ft.', 'Light sensitivity: dazzled in bright sunlight or daylight', 'Orc double axes are martial weapons', 'Favored class: Barbarian'],
  },
  'mm1-aasimar': {
    id: 'mm1-aasimar', name: 'Aasimar', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 30, abilityModifiers: { wis: 2, cha: 2 }, levelAdjustment: 1,
    racialSkillBonuses: { Listen: 2, Spot: 2 },
    racialSpellLikeAbilities: [{ name: 'Daylight', usesPerDay: 1, casterLevel: 'character', spellLevel: 3, school: 'evocation' }],
    traits: ['Darkvision 60 ft.', 'Acid, cold, and electricity resistance 5', 'Favored class: Paladin'],
  },
  'mm1-tiefling': {
    id: 'mm1-tiefling', name: 'Tiefling', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 30, abilityModifiers: { dex: 2, int: 2, cha: -2 }, levelAdjustment: 1,
    racialSkillBonuses: { Bluff: 2, Hide: 2 },
    racialSpellLikeAbilities: [{ name: 'Darkness', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'evocation' }],
    traits: ['Darkvision 60 ft.', 'Cold, electricity, and fire resistance 5', 'Favored class: Rogue'],
  },
  'mm1-duergar': {
    id: 'mm1-duergar', name: 'Duergar', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 20, abilityModifiers: { con: 2, cha: -4 }, levelAdjustment: 1,
    racialSpellLikeAbilities: [
      { name: 'Enlarge Person (self only)', usesPerDay: 1, casterLevel: 'character', spellLevel: 1, school: 'transmutation' },
      { name: 'Invisibility (self only)', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'illusion' },
    ],
    traits: ['Darkvision 120 ft.', 'Immune to paralysis, phantasms, and poison', '+2 saves vs. spells and spell-like abilities', 'Light sensitivity: dazzled in bright sunlight or daylight', 'Favored class: Fighter'],
  },
  'mm1-hobgoblin': {
    id: 'mm1-hobgoblin', name: 'Hobgoblin', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: 2 }, levelAdjustment: 1,
    racialSkillBonuses: { 'Move Silently': 4 },
    traits: ['Darkvision 60 ft.', 'Favored class: Fighter'],
  },
  'mm1-drow': {
    id: 'mm1-drow', name: 'Drow', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: -2, int: 2, cha: 2 }, levelAdjustment: 2,
    racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2 }, racialSituationalSaveBonuses: { enchantment: 2 },
    racialSpellLikeAbilities: [
      { name: 'Dancing Lights', usesPerDay: 1, casterLevel: 'character', spellLevel: 0, school: 'evocation' },
      { name: 'Darkness', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'evocation' },
      { name: 'Faerie Fire', usesPerDay: 1, casterLevel: 'character', spellLevel: 1, school: 'evocation' },
    ],
    traits: ['Darkvision 120 ft.', 'Spell resistance 11 + class levels', '+2 Will saves against spells and spell-like abilities', 'Light blindness; dazzled in bright sunlight or daylight', 'Immune to magical sleep', 'Favored class: Wizard (male) or Cleric (female)'],
  },
  'mm1-svirfneblin': {
    id: 'mm1-svirfneblin', name: 'Svirfneblin', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    size: 'Small', speed: 20, abilityModifiers: { str: -2, dex: 2, wis: 2, cha: -4 }, levelAdjustment: 3,
    racialSkillBonuses: { Hide: 2, Listen: 2 }, racialSavingThrowBonus: 2,
    racialSpellLikeAbilities: [{ name: 'Blindness/Deafness', usesPerDay: 1, casterLevel: 'character', spellLevel: 2, school: 'necromancy' }],
    traits: ['Darkvision 120 ft.', 'Spell resistance 11 + class levels', '+2 racial bonus on all saving throws', '+2 dodge bonus to AC against all creatures (apply manually)', 'Stonecunning', 'Favored class: Rogue'],
  },
  'mm1-bugbear': {
    id: 'mm1-bugbear', name: 'Bugbear', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 1, size: 'Medium', speed: 30, abilityModifiers: { str: 4, dex: 2, con: 2, cha: -2 },
    racialHitDice: { count: 3, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'poor', skillPoints: 2, classSkills: ['Climb', 'Hide', 'Listen', 'Move Silently', 'Search', 'Spot'] },
    racialSkillBonuses: { 'Move Silently': 4 }, racialNaturalArmorBonus: 3,
    traits: ['Darkvision 60 ft.', 'Scent', 'Two racial Hit Dice feats are selected normally at creation (Alertness and Weapon Focus are not mandatory for a character)', 'Favored class: Rogue'],
  },
  'mm1-gnoll': {
    id: 'mm1-gnoll', name: 'Gnoll', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 1, size: 'Medium', speed: 30, abilityModifiers: { str: 4, con: 2, int: -2, cha: -2 },
    racialHitDice: { count: 2, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Listen', 'Spot'] },
    racialNaturalArmorBonus: 1,
    traits: ['Darkvision 60 ft.', 'One racial Hit Die feat is selected normally at creation', 'Favored class: Ranger'],
  },
  'mm1-lizardfolk': {
    id: 'mm1-lizardfolk', name: 'Lizardfolk', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 1, size: 'Medium', speed: 30, abilityModifiers: { str: 2, con: 2, int: -2 },
    racialHitDice: { count: 2, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'good', will: 'poor', skillPoints: 2, classSkills: ['Balance', 'Jump', 'Swim'] },
    racialSkillBonuses: { Balance: 4, Jump: 4, Swim: 4 }, racialNaturalArmorBonus: 5, racialSimpleWeaponProficiency: true, racialShieldProficiency: true,
    traits: ['Natural attacks: two claws (1d4) and bite (1d4)', 'Hold breath for 4 × Constitution rounds', 'One racial Hit Die feat is selected normally at creation', 'Favored class: Druid'],
  },
  'mm1-centaur': {
    id: 'mm1-centaur', name: 'Centaur', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Large', speed: 50, abilityModifiers: { str: 8, dex: 4, con: 4, int: -2, wis: 2 },
    racialHitDice: { count: 4, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Listen', 'Move Silently', 'Spot', 'Survival'] },
    racialNaturalArmorBonus: 3,
    traits: ['Darkvision 60 ft.', 'Space/reach 10 ft./5 ft.', 'Two racial Hit Dice feats are selected normally at creation', 'Two hoof natural attacks: 1d6 each; natural-attacks adjudication remains manual', 'Favored class: Ranger'],
  },
  'mm1-githyanki': {
    id: 'mm1-githyanki', name: 'Githyanki', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { dex: 2, con: 2, wis: -2 },
    racialSpellLikeAbilities: [
      { name: 'Daze', usesPerDay: 3, casterLevel: 'character', spellLevel: 0, school: 'enchantment' },
      { name: 'Feather Fall', usesPerDay: 3, casterLevel: 'character', spellLevel: 1, school: 'transmutation' },
      { name: 'Mage Hand', usesPerDay: 3, casterLevel: 'character', spellLevel: 0, school: 'transmutation' },
      { name: 'Plane Shift (self only, 16th level)', usesPerDay: 1, casterLevel: 16, spellLevel: 7, school: 'conjuration' },
    ],
    traits: ['Darkvision 60 ft.', 'Spell resistance 5 + class levels', 'Favored class: Fighter', 'Plane shift requires githyanki level 11 under the MM entry'],
  },
  'mm1-githzerai': {
    id: 'mm1-githzerai', name: 'Githzerai', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { dex: 6, int: -2, wis: 2 },
    racialSpellLikeAbilities: [
      { name: 'Daze', usesPerDay: 3, casterLevel: 'character', spellLevel: 0, school: 'enchantment' },
      { name: 'Feather Fall', usesPerDay: 3, casterLevel: 'character', spellLevel: 1, school: 'transmutation' },
      { name: 'Shatter', usesPerDay: 3, casterLevel: 'character', spellLevel: 2, school: 'evocation' },
      { name: 'Plane Shift (self only, 16th level)', usesPerDay: 1, casterLevel: 16, spellLevel: 7, school: 'conjuration' },
    ],
    traits: ['Darkvision 60 ft.', 'Inertial armor: +4 armor bonus to AC while conscious', 'Spell resistance 5 + class levels', 'Plane shift requires githzerai level 11 under the MM entry', 'Favored class: Monk'],
  },
  'mm1-ogre': {
    id: 'mm1-ogre', name: 'Ogre', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Large', speed: 40, abilityModifiers: { str: 10, dex: -2, con: 4, int: -4, cha: -4 },
    racialHitDice: { count: 4, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Climb', 'Listen', 'Spot'] },
    racialNaturalArmorBonus: 5, racialSimpleWeaponProficiency: true, racialArmorProficiencies: ['light', 'medium'], racialShieldProficiency: true,
    traits: ['Darkvision 60 ft.', 'Space/reach 10 ft./10 ft.', 'Two racial Hit Dice feats are selected normally at creation', 'Martial weapon proficiency is also racial', 'Favored class: Barbarian'],
  },
  'mm1-troglodyte': {
    id: 'mm1-troglodyte', name: 'Troglodyte', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { dex: -2, con: 4, int: -2 },
    racialHitDice: { count: 2, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Hide', 'Listen'] },
    racialSkillBonuses: { Hide: 4 }, racialNaturalArmorBonus: 6,
    traits: ['Darkvision 90 ft.', 'Natural attacks: two claws (1d4) and bite (1d4)', 'Stench: living creatures except troglodytes within 30 ft. save or are sickened; resolve manually', 'Multiattack is a bonus feat; one racial Hit Die feat is also selected normally', 'Favored class: Cleric'],
  },
  'mm1-minotaur': {
    id: 'mm1-minotaur', name: 'Minotaur', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Large', speed: 30, abilityModifiers: { str: 8, con: 4, int: -4, cha: -2 },
    racialHitDice: { count: 6, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Intimidate', 'Jump', 'Listen', 'Search', 'Spot'] },
    racialSkillBonuses: { Listen: 4, Search: 4, Spot: 4 }, racialNaturalArmorBonus: 5,
    racialSimpleWeaponProficiency: true, racialWeaponProficiencies: ['Greataxe'],
    traits: ['Darkvision 60 ft.', 'Gore 1d8; powerful charge and natural cunning are resolved manually', 'Scent; never lost and immune to maze', 'Three racial Hit Dice feats are selected normally at creation', 'Favored class: Barbarian'],
  },
  'mm1-satyr': {
    id: 'mm1-satyr', name: 'Satyr', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Medium', speed: 40, abilityModifiers: { dex: 2, con: 2, int: 2, wis: 2, cha: 2 },
    racialHitDice: { count: 5, hitDie: 6, baseAttackBonus: 'poor', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 6, classSkills: ['Bluff', 'Hide', 'Knowledge (nature)', 'Listen', 'Move Silently', 'Perform', 'Spot'] },
    racialSkillBonuses: { Hide: 4, Listen: 4, 'Move Silently': 4, Perform: 4, Spot: 4 }, racialNaturalArmorBonus: 4,
    traits: ['Low-light vision', 'Head butt 1d6; pipes and fear effect remain manual', 'Alertness is a bonus feat; two additional racial Hit Dice feats are selected normally', 'Damage reduction 5/cold iron', 'Favored class: Bard'],
  },
  'mm1-kuo-toa': {
    id: 'mm1-kuo-toa', name: 'Kuo-toa', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 3, size: 'Medium', speed: 20, swimSpeed: 50, abilityModifiers: { str: 2, con: 2, int: 2, wis: 4, cha: -2 },
    racialHitDice: { count: 2, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Craft', 'Escape Artist', 'Knowledge (any one)', 'Listen', 'Move Silently', 'Search', 'Spot', 'Swim'] },
    racialSkillBonuses: { 'Escape Artist': 8, Search: 4, Spot: 4, Swim: 8 }, racialNaturalArmorBonus: 6,
    traits: ['Amphibious; electricity resistance 10; immune to poison and paralysis', 'Keen sight, light blindness, adhesive, and slippery effects are manual', 'One racial Hit Die feat plus Alertness as a bonus feat', 'Favored class: Rogue'],
  },
  'mm1-pixie': {
    id: 'mm1-pixie', name: 'Pixie', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 4, size: 'Small', speed: 20, abilityModifiers: { str: -4, dex: 8, int: 6, wis: 4, cha: 6 },
    racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2 }, racialNaturalArmorBonus: 1,
    racialSpellLikeAbilities: [
      { name: 'Lesser Confusion', usesPerDay: 1, casterLevel: 8, spellLevel: 1, school: 'enchantment' },
      { name: 'Dispel Magic', usesPerDay: 1, casterLevel: 8, spellLevel: 3, school: 'abjuration' },
      { name: 'Permanent Image', usesPerDay: 1, casterLevel: 8, spellLevel: 6, school: 'illusion' },
    ],
    traits: ['Fly speed 60 ft. (good); low-light vision', 'The 1 fey HD is exchanged for the first class level; no separate racial HD are added', 'Dodge is a bonus feat', 'Constant greater invisibility, DR 10/cold iron, spell resistance 15 + class levels, and special arrows remain manual', 'Level adjustment becomes +6 if Otto\'s irresistible dance is selected', 'Favored class: Sorcerer'],
  },
  'mm1-gargoyle': {
    id: 'mm1-gargoyle', name: 'Gargoyle', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 5, size: 'Medium', speed: 40, abilityModifiers: { str: 4, dex: 4, con: 8, int: -4, cha: -4 },
    racialHitDice: { count: 4, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Hide', 'Listen', 'Spot'] },
    racialSkillBonuses: { Hide: 2, Listen: 2, Spot: 2 }, racialNaturalArmorBonus: 4,
    traits: ['Darkvision 60 ft.; fly speed 60 ft. (average)', '+8 additional Hide bonus while concealed against stone (apply manually)', 'Damage reduction 10/magic and freeze remain manual', 'Two racial Hit Dice feats are selected normally at creation', 'Natural attacks: two claws and bite are resolved manually', 'Favored class: Fighter'],
  },
  'mm1-troll': {
    id: 'mm1-troll', name: 'Troll', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 5, size: 'Large', speed: 30, abilityModifiers: { str: 12, dex: 4, con: 12, int: -4, wis: -2, cha: -4 },
    racialHitDice: { count: 6, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Listen', 'Spot'] },
    racialNaturalArmorBonus: 5,
    traits: ['Darkvision 60 ft.; low-light vision; scent', 'Space/reach 10 ft./10 ft.', 'Regeneration 5; claws 1d6, bite 1d6, and rend remain manual', 'Three racial Hit Dice feats are selected normally at creation', 'Favored class: Fighter'],
  },
  'mm1-yuan-ti-pureblood': {
    id: 'mm1-yuan-ti-pureblood', name: 'Yuan-ti Pureblood', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { dex: 2, int: 2, cha: 2 },
    racialHitDice: { count: 4, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Concentration', 'Disguise', 'Hide', 'Knowledge (any)', 'Listen', 'Spot'] },
    racialNaturalArmorBonus: 1,
    traits: ['Darkvision 60 ft.; alternate form, detect poison, and spell resistance 14 + class levels', '+5 racial Disguise bonus when impersonating a human (apply manually)', 'Alertness and Blind-Fight are bonus feats; two additional racial Hit Dice feats are selected normally', 'Spell-like abilities: animal trance, cause fear, charm person, darkness, entangle', 'Favored class: Ranger'],
  },
  'mm1-yuan-ti-halfblood': {
    id: 'mm1-yuan-ti-halfblood', name: 'Yuan-ti Halfblood', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 5, size: 'Medium', speed: 30, abilityModifiers: { str: 4, dex: 2, con: 2, int: 8, wis: 8, cha: 6 },
    racialHitDice: { count: 7, hitDie: 8, baseAttackBonus: 'good', fortitude: 'poor', reflex: 'good', will: 'good', skillPoints: 2, classSkills: ['Concentration', 'Craft', 'Hide', 'Knowledge (any)', 'Listen', 'Spot'] },
    racialNaturalArmorBonus: 4,
    traits: ['Darkvision 60 ft.; alternate form, chameleon power, detect poison, scent, and spell resistance 16', 'Poison bite, produce acid, and spell-like abilities are manual', 'Alertness and Blind-Fight are bonus feats; three racial Hit Dice feats are selected normally', 'Favored class: Ranger'],
  },
  'mm1-drider': {
    id: 'mm1-drider', name: 'Drider', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 4, size: 'Large', speed: 30, abilityModifiers: { str: 4, dex: 4, con: 6, int: 4, wis: 6, cha: 6 },
    racialHitDice: { count: 6, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'poor', will: 'good', skillPoints: 2, classSkills: ['Climb', 'Concentration', 'Hide', 'Listen', 'Move Silently', 'Spot'] },
    racialSkillBonuses: { Climb: 8, Hide: 4, 'Move Silently': 4 }, racialNaturalArmorBonus: 6,
    traits: ['Climb speed 15 ft.; darkvision 60 ft.; space/reach 10 ft./5 ft.', 'Spell resistance 17, poison bite, spell-like abilities, and innate 6th-level casting remain manual', 'Three racial Hit Dice feats are selected normally at creation', 'Favored class: Cleric, Sorcerer, or Wizard depending on the chosen drider casting tradition'],
  },
  'mm1-hill-giant': {
    id: 'mm1-hill-giant', name: 'Hill Giant', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 4, size: 'Large', speed: 40, abilityModifiers: { str: 14, dex: -2, con: 8, int: -4, cha: -4 },
    racialHitDice: { count: 12, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Climb', 'Jump', 'Listen', 'Spot'] },
    racialNaturalArmorBonus: 9, racialSimpleWeaponProficiency: true, racialArmorProficiencies: ['light', 'medium'], racialShieldProficiency: true,
    traits: ['Low-light vision; space/reach 10 ft./10 ft.', 'Rock throwing and rock catching remain manual', 'Five racial Hit Dice feats are selected normally at creation', 'Martial weapons are also racial proficiencies', 'Favored class: Barbarian'],
  },
  'mm1-janni': {
    id: 'mm1-janni', name: 'Janni', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 5, size: 'Medium', speed: 30, abilityModifiers: { str: 6, dex: 4, con: 2, int: 4, wis: 4, cha: 2 },
    racialHitDice: { count: 6, hitDie: 8, baseAttackBonus: 'good', fortitude: 'good', reflex: 'good', will: 'good', skillPoints: 8, classSkills: ['Appraise', 'Concentration', 'Craft', 'Escape Artist', 'Listen', 'Move Silently', 'Ride', 'Sense Motive', 'Spot'] },
    racialNaturalArmorBonus: 1,
    traits: ['Fly speed 20 ft. (perfect); darkvision 60 ft.; telepathy 100 ft.', 'Change size, spell-like abilities, plane shift, elemental endurance, and fire resistance 10 remain manual', 'Improved Initiative is a bonus feat; three racial Hit Dice feats are selected normally', 'Favored class: Rogue'],
  },
  'mm1-mind-flayer': {
    id: 'mm1-mind-flayer', name: 'Mind Flayer', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 7, size: 'Medium', speed: 30, abilityModifiers: { str: 2, dex: 4, con: 2, int: 8, wis: 6, cha: 6 },
    racialHitDice: { count: 8, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'poor', reflex: 'poor', will: 'good', skillPoints: 2, classSkills: ['Bluff', 'Concentration', 'Disguise', 'Hide', 'Intimidate', 'Knowledge (any)', 'Listen', 'Move Silently', 'Sense Motive', 'Spot'] },
    racialNaturalArmorBonus: 3,
    traits: ['Four tentacles, improved grab, and extract brain remain manual', 'Mind blast, psionics, spell resistance 25, and telepathy 100 ft. remain manual', 'Four racial Hit Dice feats are selected normally at creation', 'Favored class: Wizard or Sorcerer'],
  },
  'mm1-ogre-mage': {
    id: 'mm1-ogre-mage', name: 'Ogre Mage', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 7, size: 'Large', speed: 40, abilityModifiers: { str: 10, con: 6, int: 4, wis: 4, cha: 6 },
    racialHitDice: { count: 5, hitDie: 8, baseAttackBonus: 'medium', fortitude: 'good', reflex: 'poor', will: 'poor', skillPoints: 2, classSkills: ['Concentration', 'Listen', 'Spellcraft', 'Spot'] },
    racialNaturalArmorBonus: 5,
    traits: ['Fly speed 40 ft. (good); darkvision 60 ft.; low-light vision', 'Regeneration 5 (fire and acid deal normal damage), spell resistance 19, change shape, and spell-like abilities remain manual', 'Two racial Hit Dice feats are selected normally at creation', 'Favored class: Sorcerer'],
  },
  'mm1-afflicted-lycanthrope': {
    id: 'mm1-afflicted-lycanthrope', name: 'Afflicted Lycanthrope', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 2, abilityModifiers: { wis: 2 },
    traits: ['Template applied to the chosen base race; base race statistics remain the foundation', 'Animal-form Hit Dice, physical ability modifiers, class skills, size, speed, natural attacks, and feat count must be added for the selected animal', 'Low-light vision and scent in every form', '+2 natural armor; alternate form and lycanthropic empathy; DR 5/silver in animal or hybrid form', 'Iron Will is a bonus feat; Control Shape checks govern involuntary and voluntary changes'],
  },
  'mm1-natural-lycanthrope': {
    id: 'mm1-natural-lycanthrope', name: 'Natural Lycanthrope', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 3, abilityModifiers: { wis: 2 },
    traits: ['Template applied to the chosen base race; base race statistics remain the foundation', 'Animal-form Hit Dice, physical ability modifiers, class skills, size, speed, natural attacks, and feat count must be added for the selected animal', 'Low-light vision and scent in every form', '+2 natural armor; alternate form and lycanthropic empathy; DR 10/silver in animal or hybrid form', 'Iron Will is a bonus feat; natural lycanthropes do not need Control Shape checks'],
  },
  'mm1-vampire': {
    id: 'mm1-vampire', name: 'Vampire', source: 'core-35-srd', sourceBook: 'Monster Manual I (3.5)',
    levelAdjustment: 8, abilityModifiers: { str: 6, dex: 4, int: 2, wis: 2, cha: 4 },
    racialNaturalArmorBonus: 6,
    traits: ['Acquired template applied to a humanoid or monstrous humanoid; base statistics, racial Hit Dice, and class levels remain the foundation', 'Change Hit Die shape to d12 and Constitution to no score; this template-specific HP/HD conversion is manual', 'Blood drain, dominate, energy drain, gaseous/alternate form, fast healing 5, DR 10/silver and magic, and vampire weaknesses remain manual', 'Alertness, Combat Reflexes, Dodge, Improved Initiative, and Lightning Reflexes are bonus feats when prerequisites are met', 'Level adjustment equals the base creature LA +8; this entry displays the template increment only'],
  },
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
    racialSimpleWeaponProficiency: true,
    racialArmorProficiencies: ['light'],
    racialShieldProficiency: true,
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
    racialSimpleWeaponProficiency: true,
    racialArmorProficiencies: ['light'],
    traits: [
      'Dragon type: darkvision 60 ft., low-light vision, immune to sleep and paralysis',
      'Natural attack: bite (1d4)',
      'Death throes create a 5-ft.-radius pool of acid that deals 1d6 acid damage per round and evaporates in 1d6 rounds',
      'Immune to disease; Run bonus feat; glide without falling damage, up to 4 feet horizontally per foot descended',
      'Inspired by Dragons: +1 morale on attacks and saves under a dragon commander; low metabolism; spell resistance 11 + class level',
      'Female healing saliva heals 2d6 once per creature every 4 hours; male poison saliva (Fortitude DC 11 + Constitution modifier) deals 1d6 Dexterity damage initially and secondarily',
      'Low metabolism: needs one-tenth normal food and water',
      'Bonus proficiencies: simple weapons, short sword, shortbow, and light armor; sneak attack +1d6',
      'Automatic language Common; bonus languages Goblin, Nerakese, and Ogre; favored class Rogue',
      'First racial Hit Die has maximum hit points; racial Hit Dice grant one feat based on total Hit Dice',
    ],
  },
  'qualinesti-elf': {
    id: 'qualinesti-elf',
    name: 'Qualinesti Elf',
    source: 'dragonlance-user-pack',
    size: 'Medium',
    abilityModifiers: { dex: 2, con: -2 },
    racialSkillBonuses: { Listen: 2, Search: 2, Spot: 2, Diplomacy: 1, 'Sense Motive': 1 },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialImmunities: ['sleep'],
    traits: [
      'Elvensight (low-light vision and darkvision 30 ft.)',
      'Immune to magical sleep',
      'Elven weapon proficiencies',
      'Search for secret/concealed doors within 5 ft.',
    ],
  },
  'silvanesti-elf': {
    id: 'silvanesti-elf',
    name: 'Silvanesti Elf',
    source: 'dragonlance-user-pack',
    size: 'Medium',
    abilityModifiers: { dex: 2, con: -2, int: 2, cha: -2 },
    racialSkillBonuses: {
      Listen: 2,
      Search: 2,
      Spot: 2,
      'Knowledge (arcana)': 1,
      Spellcraft: 1,
    },
    racialSituationalSaveBonuses: { enchantment: 2 },
    racialImmunities: ['sleep'],
    traits: [
      'Elvensight (low-light vision and darkvision 30 ft.)',
      'Immune to magical sleep',
      'Elven weapon proficiencies',
      'Search for secret/concealed doors within 5 ft.',
    ],
  },
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
      'Porpoise form 3/day, aquatic environments only; indefinite; no HP restored',
      'Surface sensitivity: –2 attacks/saves/checks after >24h out of water; 1h underwater per 24h mitigates',
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
      'Medium sea otter form 3/day; indefinite; no HP restored',
      'Surface sensitivity: –1 attacks/saves/checks after >24h out of water; 1h underwater per 24h mitigates',
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
  minotaur: { id: 'minotaur', name: 'Minotaur', source: 'dragonlance-user-pack', levelAdjustment: 2, size: 'Medium', speed: 30, abilityModifiers: { str: 4, dex: -2, int: -2, cha: -2 }, racialSkillBonuses: { Intimidate: 2, Swim: 2, 'Use Rope': 2 }, racialNaturalArmorBonus: 2, traits: ['Gore: 1d6 + Str mod; charge 2d6 + 1.5× Str mod; secondary attack: –5, half Str mod', 'Scent may be selected as a feat', 'Favored class: Fighter'] },
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

const dmg35Source = { source: "core-35-srd", sourceBook: "Dungeon Master's Guide (3.5)" } as const;

export const dragonlancePrestigeClasses: Record<PrestigeClassId, PrestigeClassDefinition> = {
  'arcane-archer': {
    id: 'arcane-archer', name: 'Arcane Archer', ...dmg35Source,
    prerequisites: { bab: 6, races: ['elf', 'half-elf', 'qualinesti', 'silvanesti', 'kagonesti'], feats: ['Point Blank Shot', 'Precise Shot'], weaponFocusChoices: ['Longbow', 'Shortbow'], spellcasting: { type: 'arcane', level: 1 } },
    features: ['Enhance arrow', 'Imbue arrow', 'Seeker arrow', 'Phase arrow', 'Hail of arrows', 'Arrow of death'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 8, skillPoints: 4, baseAttackBonus: 'good',
    fortitude: 'good', reflex: 'good', will: 'poor',
    classSkills: ['Craft', 'Hide', 'Listen', 'Move Silently', 'Ride', 'Spot', 'Survival', 'Use Rope'],
    weaponProficiency: 'martial', armorProficiencies: ['light', 'medium'], shieldProficiency: true,
  },
  archmage: {
    id: 'archmage', name: 'Archmage', ...dmg35Source,
    prerequisites: { skills: { 'Knowledge (arcana)': 15, Spellcraft: 15 }, skillFocus: 'Spellcraft', minimumSpellFocusSchools: 2, arcaneSpellRepertoire: { castableLevel: 7, schoolCount: 5, minimumSchoolSpellLevel: 5 } },
    features: ['Arcane spellcasting advancement', 'High Arcana'],
    levelUpEnabled: true, maximumLevel: 5, hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'poor', will: 'good',
    classSkills: ['Concentration', 'Craft (alchemy)', 'Knowledge (*)', 'Profession', 'Search', 'Spellcraft'],
    spellcastingProgression: { type: 'arcane', chooseEachLevel: true },
  },
  'arcane-trickster': {
    id: 'arcane-trickster', name: 'Arcane Trickster', ...dmg35Source,
    prerequisites: { alignment: 'Any nonlawful', skills: { 'Decipher Script': 7, 'Disable Device': 7, 'Escape Artist': 7, 'Knowledge (arcana)': 4 }, sneakAttackDice: 2, spellcasting: { type: 'arcane', level: 3 }, spells: ['Mage Hand'] },
    features: ['Ranged legerdemain', 'Sneak attack', 'Impromptu sneak attack'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 4, skillPoints: 4, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'good', will: 'good',
    classSkills: ['Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (*)', 'Listen', 'Move Silently', 'Open Lock', 'Profession', 'Sense Motive', 'Search', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Swim', 'Tumble', 'Use Rope'],
    spellcastingProgression: { type: 'either', chooseEachLevel: true },
  },
  assassin: {
    id: 'assassin', name: 'Assassin', ...dmg35Source,
    prerequisites: { alignment: 'Any evil', skills: { Disguise: 4, Hide: 8, 'Move Silently': 8 } },
    roleplayPrerequisite: 'The source requires a killing solely to join the assassins; adjudicate this fictional entry condition with the DM.',
    features: ['Arcane spellcasting', 'Poison use', 'Sneak attack', 'Death attack', 'Save bonus against poison', 'Uncanny dodge', 'Improved uncanny dodge', 'Hide in plain sight'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 6, skillPoints: 4, baseAttackBonus: 'medium',
    fortitude: 'poor', reflex: 'good', will: 'poor', armorProficiencies: ['light'],
    classSkills: ['Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'],
    referenceSpellList: { levels: {
      1: ['Disguise Self', 'Detect Poison', 'Feather Fall', 'Ghost Sound', 'Jump', 'Obscuring Mist', 'Sleep', 'True Strike'],
      2: ['Alter Self', "Cat's Grace", 'Darkness', "Fox's Cunning", 'Illusory Script', 'Invisibility', 'Pass without Trace', 'Spider Climb', 'Undetectable Alignment'],
      3: ['Deep Slumber', 'Deeper Darkness', 'False Life', 'Magic Circle against Good', 'Misdirection', 'Nondetection'],
      4: ['Clairaudience/Clairvoyance', 'Dimension Door', 'Freedom of Movement', 'Glibness', 'Invisibility, Greater', 'Locate Creature', 'Modify Memory', 'Poison'],
    } },
  },
  blackguard: {
    id: 'blackguard', name: 'Blackguard', ...dmg35Source,
    prerequisites: { alignment: 'Any evil', bab: 6, skills: { Hide: 5, 'Knowledge (religion)': 2 }, feats: ['Cleave', 'Improved Sunder', 'Power Attack'] },
    roleplayPrerequisite: 'Confirm peaceful contact with a summoned evil outsider. Either the character or someone else may have summoned it.',
    features: ['Divine spellcasting', 'Aura of evil', 'Detect good', 'Poison use', 'Dark blessing', 'Smite good', 'Aura of despair', 'Command undead', 'Sneak attack', 'Fiendish servant', 'Fallen paladin benefits'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 10, skillPoints: 2, baseAttackBonus: 'good',
    fortitude: 'good', reflex: 'poor', will: 'poor',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Knowledge (religion)', 'Profession', 'Ride'],
    weaponProficiency: 'martial', armorProficiencies: ['light', 'medium', 'heavy'], shieldProficiency: true,
    referenceSpellList: {
      levels: {
        1: ['Cause Fear', 'Corrupt Weapon', 'Cure Light Wounds', 'Doom', 'Inflict Light Wounds', 'Magic Weapon', 'Summon Monster I'],
        2: ["Bull's Strength", 'Cure Moderate Wounds', 'Darkness', 'Death Knell', "Eagle's Splendor", 'Inflict Moderate Wounds', 'Shatter', 'Summon Monster II'],
        3: ['Contagion', 'Cure Serious Wounds', 'Deeper Darkness', 'Inflict Serious Wounds', 'Protection from Elements', 'Summon Monster III'],
        4: ['Cure Critical Wounds', 'Freedom of Movement', 'Inflict Critical Wounds', 'Poison', 'Summon Monster IV'],
      },
      note: 'Summon Monster can summon only evil creatures. Protection from Elements is the printed name; confirm the intended spell with the DM.',
    },
  },
  'dragon-disciple': {
    id: 'dragon-disciple', name: 'Dragon Disciple', ...dmg35Source,
    prerequisites: { skills: { 'Knowledge (arcana)': 8 }, languages: ['Draconic'], spontaneousArcaneSpellcasting: true },
    roleplayPrerequisite: 'Confirm that the character is neither a dragon nor a half-dragon and that the ancestry has DM approval.',
    features: ['Natural Armor Increase', 'Dragon Disciple Bonus Spells', 'Claws and Bite', 'Dragon Disciple Breath Weapon', 'Blindsense', 'Dragon Disciple Wings', 'Dragon Apotheosis'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 12, skillPoints: 2, baseAttackBonus: 'medium',
    fortitude: 'good', reflex: 'poor', will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Gather Information', 'Knowledge (*)', 'Listen', 'Profession', 'Search', 'Speak Language', 'Spellcraft', 'Spot'],
  },
  duelist: {
    id: 'duelist', name: 'Duelist', ...dmg35Source,
    prerequisites: { bab: 6, skills: { Tumble: 5 }, anySkillRanks: 3, anySkillPrefix: 'Perform', feats: ['Dodge', 'Mobility', 'Weapon Finesse'] },
    features: ['Canny defense', 'Improved reaction', 'Grace', 'Precise strike', 'Deflect Arrows'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 10, skillPoints: 4, baseAttackBonus: 'good',
    fortitude: 'poor', reflex: 'good', will: 'poor',
    classSkills: ['Balance', 'Bluff', 'Escape Artist', 'Jump', 'Listen', 'Perform (*)', 'Sense Motive', 'Spot', 'Tumble'],
    weaponProficiency: 'martial',
  },
  'dwarven-defender': {
    id: 'dwarven-defender', name: 'Dwarven Defender', ...dmg35Source,
    prerequisites: { bab: 7, alignment: 'Any lawful', feats: ['Dodge', 'Endurance', 'Toughness'], races: ['dwarf', 'hill-dwarf', 'mountain-dwarf', 'dark-dwarf', 'gully-dwarf'] },
    features: ['AC bonus', 'Defensive stance', 'Uncanny dodge', 'Trap sense', 'Damage reduction', 'Mobile defense'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 12, skillPoints: 2, baseAttackBonus: 'good',
    fortitude: 'good', reflex: 'poor', will: 'good', classSkills: ['Craft', 'Listen', 'Sense Motive', 'Spot'],
    weaponProficiency: 'martial', armorProficiencies: ['light', 'medium', 'heavy'], shieldProficiency: true,
  },
  'eldritch-knight': {
    id: 'eldritch-knight', name: 'Eldritch Knight', ...dmg35Source,
    prerequisites: { allMartialWeaponProficiencies: true, spellcasting: { type: 'arcane', level: 3 } },
    features: ['Fighter bonus feat', 'Arcane spellcasting advancement'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 6, skillPoints: 2, baseAttackBonus: 'good',
    fortitude: 'good', reflex: 'poor', will: 'poor',
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Jump', 'Knowledge (arcana)', 'Knowledge (nobility and royalty)', 'Ride', 'Sense Motive', 'Spellcraft', 'Swim'],
    spellcastingProgression: { type: 'arcane', startsAtLevel: 2, chooseEachLevel: true },
  },
  hierophant: {
    id: 'hierophant', name: 'Hierophant', ...dmg35Source,
    prerequisites: { skills: { 'Knowledge (religion)': 15 }, featCategoryChoices: [{ anyOf: ['metamagic'], count: 1 }], spellcasting: { type: 'divine', level: 7 } },
    features: ['Hierophant special ability', 'Hierophant caster-level advancement'],
    levelUpEnabled: true, maximumLevel: 5, hitDie: 8, skillPoints: 2, baseAttackBonus: 'poor',
    fortitude: 'good', reflex: 'poor', will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Spellcraft'],
  },
  'horizon-walker': {
    id: 'horizon-walker', name: 'Horizon Walker', ...dmg35Source,
    prerequisites: { skills: { 'Knowledge (geography)': 8 }, feats: ['Endurance'] },
    features: ['Terrain Mastery', 'Planar Terrain Mastery'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 8, skillPoints: 4, baseAttackBonus: 'good',
    fortitude: 'good', reflex: 'poor', will: 'poor',
    classSkills: ['Balance', 'Climb', 'Diplomacy', 'Handle Animal', 'Hide', 'Knowledge (geography)', 'Listen', 'Move Silently', 'Profession', 'Ride', 'Speak Language', 'Spot', 'Survival'],
  },
  loremaster: {
    id: 'loremaster', name: 'Loremaster', ...dmg35Source,
    prerequisites: { anySkillRanks: 10, anySkillPrefix: 'Knowledge (', minimumMatchingSkills: 2, skillFocusPrefix: 'Knowledge (', featCategoryChoices: [{ anyOf: ['metamagic', 'item-creation'], count: 3 }], spellSchoolSpells: { school: 'Divination', count: 7, minimumLevel: 3 } },
    features: ['Loremaster secret', 'Loremaster lore', 'Loremaster bonus language', 'Greater Lore', 'True Lore'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 4, skillPoints: 4, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'poor', will: 'good',
    classSkills: ['Appraise', 'Concentration', 'Craft (alchemy)', 'Decipher Script', 'Gather Information', 'Handle Animal', 'Heal', 'Knowledge (*)', 'Perform (*)', 'Profession', 'Speak Language', 'Spellcraft', 'Use Magic Device'],
    spellcastingProgression: { type: 'either', chooseEachLevel: true },
  },
  'mystic-theurge': {
    id: 'mystic-theurge', name: 'Mystic Theurge', ...dmg35Source,
    prerequisites: { skills: { 'Knowledge (arcana)': 6, 'Knowledge (religion)': 6 }, spellcasting: { type: 'arcane', level: 2 }, additionalSpellcasting: [{ type: 'divine', level: 2 }] },
    features: ['Dual spellcasting advancement'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'poor', will: 'good',
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Sense Motive', 'Spellcraft'],
    spellcastingProgression: { type: 'arcane', chooseEachLevel: true },
  },
  'red-wizard': {
    id: 'red-wizard', name: 'Red Wizard', ...dmg35Source,
    prerequisites: {
      alignment: 'Any nongood', races: ['Human'], skills: { Spellcraft: 8 },
      featCategoryChoices: [{ anyOf: ['metamagic', 'item-creation'], count: 3 }],
      spellcasting: { type: 'arcane', level: 3 },
    },
    roleplayPrerequisite: 'Confirm Thayan origin and Tattoo Focus (Forgotten Realms option).',
    features: ['Arcane spellcasting advancement', 'Enhanced specialization', 'Specialist defense', 'Spell power', 'Circle leader', 'Great circle leader'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'poor', will: 'good',
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Intimidate', 'Knowledge (*)', 'Profession', 'Spellcraft'],
    spellcastingProgression: { type: 'arcane', chooseEachLevel: true },
  },
  shadowdancer: {
    id: 'shadowdancer', name: 'Shadowdancer', ...dmg35Source,
    prerequisites: { skills: { Hide: 10, 'Move Silently': 8, 'Perform (dance)': 5 }, feats: ['Combat Reflexes', 'Dodge', 'Mobility'] },
    features: ['Hide in Plain Sight', 'Evasion', 'Darkvision', 'Uncanny Dodge', 'Shadow Illusion', 'Summon Shadow', 'Shadow Jump', 'Defensive Roll', 'Improved Uncanny Dodge', 'Slippery Mind', 'Improved Evasion'],
    levelUpEnabled: true, maximumLevel: 10, hitDie: 8, skillPoints: 6, baseAttackBonus: 'medium',
    fortitude: 'poor', reflex: 'good', will: 'poor', armorProficiencies: ['light'],
    classSkills: ['Balance', 'Bluff', 'Decipher Script', 'Diplomacy', 'Disguise', 'Escape Artist', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Perform (*)', 'Profession', 'Search', 'Sleight of Hand', 'Spot', 'Tumble', 'Use Rope'],
  },
  thaumaturgist: {
    id: 'thaumaturgist', name: 'Thaumaturgist', ...dmg35Source,
    prerequisites: { spellFocusSchools: ['Conjuration'], spells: ['Lesser Planar Ally'] },
    features: ['Improved Ally', 'Augment Summoning', 'Extended Summoning', 'Contingent Conjuration', 'Planar Cohort'],
    levelUpEnabled: true, maximumLevel: 5, hitDie: 4, skillPoints: 2, baseAttackBonus: 'poor',
    fortitude: 'poor', reflex: 'poor', will: 'good',
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Sense Motive', 'Speak Language', 'Spellcraft'],
    spellcastingProgression: { type: 'either', chooseEachLevel: true },
  },
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
    baseAttackBonus: 'medium',
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
  classLevels: [{ classId: 'fighter', level: 1 }], hitPoints: 10, feats: [], featSelections: {}, featWeaponSelections: {}, featSkillSelections: {}, featSpellSchoolSelections: {}, featSpellMasterySelections: {}, featSpellMasterySelectionCounts: {}, skills: {}, skillRanksByClass: {}, knownSpells: [], preparedSpells: [], equipment: {}, mainWeaponGrip: 'one-handed', doubleWeaponMode: false, doubleWeaponPrimaryEnd: 'first', towerShieldTotalCover: false, shieldBashMode: false, animatedShieldMode: false, forceShieldActive: false, shieldBlindingUsesByItem: {}, inventory: {}, languages: ['Common'], prestigeClass: undefined, deity: undefined, highSorceryOrder: undefined,
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
  divineSpellcastingClassId?: ClassId,
): LevelUpDraft {
  const definition = dragonlancePrestigeClasses[prestigeClassId]
  const currentPrestigeEntry = character.classLevels.find(
    (entry) => 'prestigeClassId' in entry && entry.prestigeClassId === prestigeClassId,
  )
  const classId = (definition.spellcastingProgression?.chooseEachLevel ? spellcastingClassId : undefined) ??
    currentPrestigeEntry?.classId ?? spellcastingClassId ?? character.classLevels.find(
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
  if (existingPrestigeClass) {
    existingPrestigeClass.level = currentLevel + 1
    existingPrestigeClass.classId = classId
  }
  else proposed.classLevels = [
    ...proposed.classLevels,
    { classId, prestigeClassId, level: 1 },
  ]
  if (prestigeClassId === 'mystic-theurge') {
    const entry = proposed.classLevels.find((level): level is PrestigeClassLevel =>
      'prestigeClassId' in level && level.prestigeClassId === prestigeClassId,
    )
    if (entry) entry.divineSpellcastingClassId = divineSpellcastingClassId
  }
  if (prestigeClassId === 'dragon-disciple') {
    const boost = getDragonDiscipleAbilityBoost(currentLevel + 1)
    for (const ability of Object.keys(proposed.abilities) as AbilityName[])
      proposed.abilities[ability] += boost[ability] ?? 0
  }
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
  if (draft.prestigeClassId === 'horizon-walker') {
    const level = draft.proposed.classLevels.find((entry) =>
      'prestigeClassId' in entry && entry.prestigeClassId === 'horizon-walker',
    )?.level ?? 0
    const terrains = draft.proposed.horizonWalkerTerrainMasteries
    const originalTerrains = draft.original.horizonWalkerTerrainMasteries ?? []
    if (!terrains || !isHorizonWalkerTerrainHistory(terrains, level) ||
        terrains.length !== originalTerrains.length + 1 ||
        !originalTerrains.every((terrain, index) => terrains[index] === terrain))
      errors.push('Choose one new terrain mastery. Planar choices unlock at Horizon Walker level 6.')
  }
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
  if (draft.prestigeClassId && dragonlancePrestigeClasses[draft.prestigeClassId].roleplayPrerequisite &&
      !existingPrestigeLevel && !draft.specialPrerequisiteConfirmed)
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
