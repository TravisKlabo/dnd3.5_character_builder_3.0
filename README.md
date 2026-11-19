# D&D 3.5 Character Builder 3.0

A separate, local-first evolution of the 2.0 builder. Character creation, progression,
Dragonlance options, spells, equipment, the store, the forge, custom items, and
JSON import/export retain their familiar appearance. Targeted, tested corrections
to inherited rules calculations are documented below.

## Sourcebook review progress

**PHB definition-pass certification (2026-11-18).** All seven PHB player
races, 11 base classes, 109 feats, 605 represented spell titles / 715 PHB
spell records, and Chapter 7 selectable equipment are represented and
source-checked. Generated Forge/wand/scroll/potion variants count when they can
be configured, persisted, and printed. Selection, class/race summaries, feats,
inventory, attacks/protection, and spell records are printable. Focused PHB
validation passed **1,450 tests**, plus the printable-sheet workflow and
equipment/barding follow-up tests, lint, types, production build, and
whitespace checks. The final run also stopped invalid Wizard bonus selections
from surviving normalization and separated the DMG-only *Corrupt Weapon*
record from PHB spell-count assertions. Situational rule execution and combat
adjudication remain manual; this certifies representation, not automation.

**Latest checkpoint: Complete Champion final feat group (2026-11-18).** Checked
Touch of Healing, Travel Devotion, Trickery Devotion, Umbral Shroud, Venom's
Gift, War Devotion, and Water Devotion against printed pp. 62–64. Fixed Venom's
Gift so plant-form access alone cannot qualify a character without ordinary
wild shape. The other detailed benefits and prerequisites matched.

**Previous checkpoint: Complete Champion action-economy feats
(2026-11-18).** Checked Spontaneous Domains, Strength Devotion, Sun Devotion,
Swift Call, and Swift Wild Shape against printed pp. 62–63. Corrected Swift
Call: it replaces a full-round action, not a standard action. Clarified that
Strength Devotion's slam does not provoke. The other action, spell-slot, aura,
damage, and prerequisite limits matched.

**Previous checkpoint: Complete Champion protection and counter feats
(2026-11-18).** Checked Plant Devotion, Protection Devotion, Protective Ward,
Retrieve Spell, and Spiritual Counter against printed pp. 61–62. Prerequisites
and benefits matched. Added checks for fortification/AC thresholds, Ward's
single-target duration, Retrieve Spell's class restriction, and Spiritual
Counter's ready-action/use cost. No rules change was needed.

**Previous checkpoint: Complete Champion knowledge and reserve feats
(2026-11-18).** Checked Knowledge Devotion, Law Devotion, Luck Devotion,
Magic Devotion, and Mitigate Suffering against printed pp. 60–61. Prerequisites
and benefits matched. Added regression checks for Knowledge Devotion's
per-type limit, Law's bonus reallocation, Luck's damage scope, Magic's ranged
scaling, and Mitigate Suffering's repeatable 10-minute temporary points. No
rules change was needed; active spells and effects remain manual.

**Previous checkpoint: Complete Champion wild, tactical, and healing feats
(2026-11-18).** Checked Great and Small, Healing Devotion, Holy Potency, Holy
Warrior, and Imbued Healing against printed pp. 59–60. Clarified Great and
Small's normal-form and nonstacking limits, plus Imbued Healing's coexistence
of different carrier effects even for opposed domains. The other prerequisites
and benefits matched; their effects remain manual.

**Previous checkpoint: Complete Champion elemental and alignment feats
(2026-11-18).** Checked Elemental Essence, Evil Devotion, Fire Devotion,
Fragile Construct, and Good Devotion against printed pp. 58–59. Prerequisites
and benefits matched, including Elemental Essence's one-active-energy limit,
aligned DR, Fire Devotion's ongoing save/dousing rules and use conversion, and
Fragile Construct's sunder bonus. No rules change was needed; effects remain
manual.

**Previous checkpoint: Complete Champion devotion and reserve effects
(2026-11-18).** Checked Chaos Devotion, Charnel Miasma, Death Devotion,
Destruction Devotion, and Earth Devotion against printed pp. 56–58. Fixed
Chaos Devotion's missing repeatability and level-10/15 die scaling; clarified
Charnel Miasma's passive scent and Earth Devotion's immediate spike attack.
The other prerequisites and benefits matched.

**Previous checkpoint: Complete Champion feat benefits (2026-11-18).** Checked
Air Devotion, Animal Devotion, Awesome Smite, Battle Blessing, and Bestial
Charge against printed pp. 54–56. Prerequisites and benefits matched, including
devotion-use conversions, tactical maneuver limits, paladin casting-time
changes, and wild-shape charge conditions. No rules change was needed; uses and
tactical effects remain manual.

**Previous checkpoint: Complete Adventurer final feat-table group
(2026-11-18).** Checked Staggering Strike, Subsonics, Tactile Trapsmith, and
Versatile Performer against printed p. 109. The first three matched. Clarified
that Versatile Performer's selected categories are permanent, continue
tracking the highest Perform ranks, and expand when Intelligence bonus rises;
combined performances add +2 to the higher modifier. Effects remain manual.

**Previous checkpoint: Complete Adventurer tactical and skill-point feats
(2026-11-18).** Checked Open Minded, Oversized Two-Weapon Fighting, Power
Throw, Quick Reconnoiter, and Razing Strike against printed pp. 108–109.
Prerequisites and benefits matched. No rules change was needed; repeatable
skill-point grants, attack adjustments, free-action scouting, and
spell-sacrifice combat effects remain manual.

**Previous checkpoint: Complete Adventurer skill and movement feats
(2026-11-18).** Checked Jack of All Trades, Leap Attack, Mobile Spellcasting,
Natural Bond, and Obscure Lore against printed pp. 107–108. Prerequisites and
benefits already matched. Added focused assertions for Jack's no-check-skill
limit, Leap Attack's 10-foot and two-handed conditions, Mobile Spellcasting's
spell-loss and defensive-casting DCs, Natural Bond's character-level cap, and
Obscure Lore's bonus. No rules change was needed; effects remain manual.

**Previous checkpoint: Complete Adventurer combat and concentration feats
(2026-11-18).** Checked Dual Strike, Expert Tactician, Extraordinary
Concentration, Extraordinary Spell Aim, and Force of Personality against
printed pp. 105–106. Prerequisites matched. Corrected Dual Strike's summary to
include its shared roll, weapon modifiers, two penalty cases, separate damage
resistance, and precision/critical limits. The other four benefits match and
remain manually resolved.

**Previous checkpoint: Complete Adventurer performance and devotion feats
(2026-11-18).** Checked Devoted Performer, Devoted Tracker, Disguise Spell,
Green Ear, and Lingering Song against printed pp. 104–108. Prerequisites
matched. Clarified Devoted Performer's no-extra-uses limit, Devoted Tracker's
combined mount/companion benefits and normal multiclass boundaries, Disguise
Spell's visible-source limitation, Green Ear's plant immunity baseline, and
Lingering Song's normal five-round comparison. Effects remain manually
resolved.

**Previous checkpoint: Complete Adventurer bardic music and Scent feats
(2026-11-18).** Checked Extra Music, Chant of Fortitude, Ironskin Chant, Lyric
Spell, and Scent against printed pp. 109–111. The first two bardic
feats and Extra Music matched; Lyric Spell now correctly requires the ability
to spontaneously cast 2nd-level arcane spells instead of a hard-coded class
level. Clarified repeated Chant use and Scent's standard supernatural-action
activation. The focused 301-test rules suite and lint passed. The production
build passed at **516,079 / 516,096 bytes** after a rounded 64-byte budget
adjustment for the new prerequisite rule.

**Previous checkpoint: Complete Adventurer wild feats (2026-11-18).** Checked
Blindsense, Climb Like an Ape, Cougar's Vision, Hawk's Vision, and Savage
Grapple against printed p. 111. Clarified Hawk's ranged-attack range penalties
versus Spot distance penalties and Savage Grapple's limitation for creatures
not subject to sneak attacks. The other checked benefit summaries match; wild
feat activation rules, uses, and effects remain manual. The focused rules test,
lint, build, and `git diff --check` passed.

**Previous checkpoint: PHB Improved Counterspell, Leadership, Natural Spell,
Track, and Toughness (2026-11-18).** Checked the five feats against the
supplied PHB (pp. 95, 97-98, 101). Clarified that Natural Spell uses material
components and focuses the character possesses, even when melded, and that
Toughness can be selected multiple times for stacking +3 HP gains. The other
prerequisites and benefits match. Counterspells, Leadership decisions and
tables, tracking checks/movement, and casting while transformed remain manual.
Eight focused rules, eligibility, and HP tests passed; lint, build, and
`git diff --check` passed at **516,032 / 516,032 bytes**.

**Previous checkpoint: PHB Craft Wondrous Item, Forge Ring, Scribe Scroll,
Eschew Materials, and Extra Turning (2026-11-18).** Checked the five feats
against the supplied PHB (pp. 92, 94, 99). Corrected Scribe Scroll's
description to allow any spell the creator knows, rather than implying it
must be currently castable. The other caster-level thresholds, item/spell
limits, Eschew Materials' 1 gp limit, and Extra Turning's repeatable +4 uses
per turning/rebuking ability match. Detailed item creation and use tracking
remain manual. Focused rules and eligibility tests passed.

**Previous checkpoint: PHB item-creation feats—Brew Potion, Craft Magic Arms
and Armor, Craft Rod, Craft Staff, and Craft Wand (2026-11-18).** Checked the
five entries against the supplied PHB (pp. 89, 92). The catalog's
caster-level thresholds and summarized spell/item categories match; potions
require a qualifying creature-targeting spell, and new staffs and wands have
50 charges. Item-specific prerequisites, masterwork bases, creation time,
costs, and charge management remain manual. No code change was needed; the
existing item-creation prerequisite test passed.

**Previous checkpoint: PHB Power Attack, Cleave, Great Cleave, Quick Draw,
and Run (2026-11-18).** Checked the five feats against the supplied PHB
(pp. 92, 94, 98-99). Corrected Power Attack to grant its normal damage bonus
to unarmed strikes even though they are light; the existing calculation
already handles double weapons and two-handed multipliers. Cleave's
once-per-round limit, Great Cleave's unlimited qualifying follow-ups, Quick
Draw's BAB +1 prerequisite and benefits, and Run's armor/load speed conditions
match the source. Natural-weapon attacks and combat-trigger execution remain
manual. Seven focused combat, prerequisite, and feat-description tests passed;
lint, build, and `git diff --check` passed at **516,032 / 516,032 bytes**.

**Previous checkpoint: PHB unarmed and arrow-defense feats (2026-11-18).**
Checked Deflect Arrows (p. 93), Improved Grapple (p. 95), Improved Unarmed
Strike (p. 96), Snatch Arrows (p. 100), and Stunning Fist (p. 101) against the
supplied PHB. Prerequisites, benefits, fighter/monk bonus-feat exceptions,
grapple bonus, and Stunning Fist's use/DC rules match. Corrected the Improved
Grapple test fixture so the selected feat has its prerequisites. Arrow
deflection/catching and Stunning Fist use tracking remain manual. Twelve
focused tests passed; lint, build, and `git diff --check` passed. The initial
JavaScript is **516,031 / 516,032 bytes**.

**Previous checkpoint: PHB defensive and survival feats (2026-11-18).**
Checked Blind-Fight (p. 89), Combat Casting and Combat Reflexes (p. 92), and
Diehard and Endurance (p. 93) against the supplied PHB. Corrected the Combat
Reflexes description to state the one-attack-per-opportunity limit and that it
does not grant a rogue additional uses of Opportunist. The catalog's other
benefits, prerequisites, and class-grant timing match. Concealment, visibility,
environmental Endurance checks, and Diehard decisions/damage remain manual.
Focused Combat Reflexes, Combat Casting, Ranger Endurance, and feat-description
tests passed; lint, build, and `git diff --check` passed.

**Previous checkpoint: PHB weapon proficiency and attack feats (2026-11-18).**
Checked Simple, Martial, and Exotic Weapon Proficiency, Point Blank Shot, and
Weapon Finesse against the supplied PHB (pp. 94, 97-98, 100, 102). The main
discrepancy was Martial Weapon Proficiency missing its BAB +1 prerequisite;
added it with a regression test. Weapon choices, class-granted proficiencies,
the exotic-weapon Strength 13 exceptions, Point Blank Shot's 30-foot limit,
and Weapon Finesse's eligible attacks and shield penalty otherwise match.
Natural attacks are not modeled as weapon-sheet selections and remain manual.
Thirty-four focused tests passed; the full proficiency suite has 115 passes and
one unrelated weapon-choice-normalization failure. Lint, build, and
`git diff --check` passed; the initial JavaScript is **516,031 / 516,032 bytes**.

**Previous checkpoint: PHB spell DC and spell-resistance feats (2026-11-18).**
Checked Spell Focus, Greater Spell Focus, Spell Penetration, Greater Spell
Penetration, and Augment Summoning against the supplied PHB (pp. 89, 94, 100).
The DC bonuses, distinct-school repeat choices, prerequisites, and +2 caster
level check bonuses match. Fixed duplicate-school warnings to follow
chronological feat selection. Augment Summoning's +4 enhancement bonuses to
summoned creatures' Strength and Constitution, and actual spell-resistance
comparisons, remain manual. Seven focused tests and lint passed; the build
passed at **516,031 / 516,032 bytes** after a 32-byte budget increase for the
warning correction.

**Previous checkpoint: PHB armor and shield proficiency (2026-11-18).**
Checked Armor Proficiency (Light, Medium, and Heavy), Shield Proficiency, and
Tower Shield Proficiency against the PHB (pp. 47, 89) and mithral category
rules against DMG 284. Corrected Ranger's automatic armor proficiency and
applied mithral's lighter category to proficiency. Fifteen focused tests,
lint, and the production build passed.

**Previous checkpoint: PHB skill-bonus feats.** Checked Investigator and
Magical Aptitude (p. 97), Negotiator (p. 98), Self-Sufficient (p. 100), and
Stealthy (p. 101) against the supplied PHB. Each grants +2 on checks with its
two listed skills, matching the catalog and skill calculations. Seventeen
focused skill, catalog, and availability tests passed; no code change was
needed.

**Previous checkpoint: PHB skill-bonus feats.** Checked Animal Affinity
(p. 89), Deft Hands and Diligent (p. 93), and Nimble Fingers and Persuasive
(p. 98) against the supplied PHB. Each grants +2 on checks with its two listed
skills, matching the catalog and skill calculations. Seventeen focused skill,
catalog, and availability tests passed; no code change was needed.

**Previous checkpoint: PHB skill-bonus feats.** Checked Acrobatic, Agile,
Alertness, and Athletic (p. 89), plus Deceitful (p. 93), against the supplied
PHB. Each grants +2 on checks with its two listed skills, matching the catalog
and skill calculations. Seventeen focused skill, catalog, and availability
tests passed; no code change was needed. Alertness from a familiar within
arm's reach is described, but familiar presence and proximity remain manual.

**Previous checkpoint: PHB save, initiative, and skill feats.** Checked Great
Fortitude (p. 94), Iron Will and Lightning Reflexes (p. 97), Improved
Initiative (p. 96), and Skill Focus (p. 100) against the supplied PHB. The
three save feats grant +2 to their respective saves; Improved Initiative
grants +4; Skill Focus grants +3 for one skill and can be selected again for a
different skill without stacking on the same skill. Catalog, calculations,
and selection behavior match. Thirteen focused rules, skill, and selection
tests passed; no code change was needed.

**Previous checkpoint: PHB remaining spell feats.** Checked Quicken, Silent,
Still, and Widen Spell plus Spell Mastery against the supplied PHB (pp. 98-102).
Their component rules, area-shape limits, slot adjustments, and Spell Mastery
eligibility and choice count match. *Complete Arcane* (p. 86) updates Quicken
from the PHB's free action to a swift action. Six focused metamagic and Spell
Mastery tests and the rules test file passed. The Widen prepared-copy test
passed its slot checks but then failed on a separate Persistent Spell note
expectation; four other failures in the broader run concerned proficiency and
Spell Focus behavior. Component removal, Widen's area changes, and actual
swift-action/casting-time resolution remain manual.

**Previous checkpoint: PHB metamagic feats.** Checked Empower, Enlarge, Extend,
Heighten, and Maximize Spell against the supplied PHB (pp. 93-97). Slot
adjustments, eligible ranges and durations, variable-effect limits, and
Heighten's effective spell level and save DC match the source. Thirteen
focused spell and PHB catalog tests passed. Numeric effects, Enlarge/Extend
application, and spontaneous-caster metamagic remain manual.

**Previous checkpoint: PHB weapon-focus feats.** Checked Weapon Focus, Weapon
Specialization, Greater Weapon Focus, Greater Weapon Specialization, and
Improved Critical against the supplied PHB (pp. 95, 102). Prerequisites,
weapon-choice matching, stacking bonuses, and Improved Critical's interaction
with Keen match the source. Thirteen focused combat, prerequisite, and
proficiency tests passed; critical confirmation and damage remain manual.

**Previous checkpoint: PHB melee movement and defense feats.** Checked Combat
Expertise (p. 92), Dodge (p. 93), Mobility (p. 98), Spring Attack (p. 100),
and Whirlwind Attack (p. 102) against the supplied PHB. Their prerequisites
and benefits match the source, including Spring Attack's 5-foot movement on
both sides of the attack. Ten focused combat and rules tests passed; movement
and multi-target resolution remain manual.

**Previous checkpoint: PHB two-weapon feats.** Checked Two-Weapon Fighting,
Two-Weapon Defense, Improved and Greater Two-Weapon Fighting, and Improved
Shield Bash against the supplied PHB (pp. 95-96, 102). The prerequisites,
off-hand attack penalties, shield-bonus behavior, and Ranger style exceptions
match the source. Corrected a combat regression fixture: Greater Two-Weapon
Fighting requires Dex 19 outside the Ranger style exception. Focused
two-weapon combat tests passed.

**Previous checkpoint: PHB mounted-combat feats.** Checked Mounted Archery and
Mounted Combat (p. 98), Ride-By Attack (p. 99), Spirited Charge (p. 100), and
Trample (p. 101) against the supplied PHB. Their prerequisites, fighter bonus
eligibility, and described benefits agree with the source. No code change was
needed; mounted checks, movement, attacks of opportunity, charge damage, and
overrun resolution remain manual.

**Previous checkpoint: PHB ranged-combat feats.** Audited Far Shot, Precise
Shot, Rapid Shot, Manyshot, Improved Precise Shot, and Shot on the Run against
the supplied PHB. Corrected Rapid Shot to grant only one extra attack when a
character makes a two-weapon full attack with ranged/thrown weapons. The focused
regression test and lint passed; the build passed at **515,984 / 516,000 bytes**
of initial JavaScript.

**Previous checkpoint: PHB combat-maneuver feat review.**
Checked Improved Bull Rush, Improved Disarm, Improved Feint, Improved Overrun,
Improved Sunder, and Improved Trip against the supplied PHB feat entries
(pp. 95-96) and combat procedures. Five entries agree with their detailed
benefits. Improved Overrun has a source conflict: Table 5-1 lists no attack of
opportunity, while its detailed entry omits that benefit and the overrun rules
say the defender gets an attack of opportunity. The feat description now flags
the conflict for DM adjudication rather than choosing a ruling. Maneuver
resolution remains manual. The rules suite passed **295 tests**, lint passed,
and the production build passed at **515,829 / 515,835 bytes** of initial
JavaScript.

**Previous checkpoint: PHB feat prerequisite loss.**
A selected feat no longer provides its benefits when its prerequisites are
lost. Unusable feats and feats depending on them are excluded from active
mechanics, while saved selections remain intact and receive a non-blocking
warning. Monk and Ranger bonus-feat exceptions remain in force. The rules
suite passed **295 tests**, the focused UI tests passed **3 tests**, lint
passed, and the production build passed at **515,829 / 515,835 bytes** of
initial JavaScript. This is a focused correction, not a completed PHB review.

**Previous checkpoint: PHB class-granted feat timing.**
The PHB (p. 87) allows a prerequisite gained at the same level as a feat, but
not before it is gained. Historical feat-prerequisite context now reconstructs
class levels at the feat's character level. Ranger Endurance gained at Ranger 3
can qualify Diehard at character level 3, but not an earlier feat slot. The
focused regression passed; the rules and class suites passed **350 tests**, lint
passed, and the production build passed at **515,283 / 515,835 bytes** of
initial JavaScript. This is a focused correction, not a completed PHB review.

**Previous checkpoint: PHB class feat grants (2026-11-18).**
Checked the Human, Fighter, Wizard, Monk, and Ranger feat-grant paths against
the PHB (pp. 14, 38, 41, 48–49, and 57). Their modeled levels, choices, and
prerequisite exceptions match the source; no code change was needed. This is a
focused audit, not a completed PHB review. Its prerequisite-loss follow-up is
recorded in the latest checkpoint above.

**Earlier checkpoint: PHB same-level feat prerequisites (2026-11-18).**
The PHB (p. 88) permits gaining a feat at the same character level as its
prerequisite. Feat selection now recognizes prerequisites in other feat slots
at that level, while retaining chronological checks across levels. The rules
suite passed **291 tests**, lint passed, and the production build passed at
**515,273 / 515,835 bytes** of initial JavaScript. This is a focused correction,
not a completed PHB review.

**Previous checkpoint: PHB catalog minimum-level-9 spell batch complete (2026-11-17).**
Reviewed **31 titles / 31 records**, Astral Projection through Wish, against
the supplied PHB. Corrected or clarified six summaries without changing
headers or access. The catalog review is complete for the represented PHB
spells; effect resolution is still manual. All **291 spell-suite tests**,
lint, types and build pass. Its historical next target, same-level feat
eligibility, is now completed in the checkpoint above.

**Previous checkpoint: PHB catalog minimum-level-8 spell batch complete (2026-11-17).**
Reviewed **46 titles / 49 class-level records**, Animal Shapes through
Whirlwind, against the supplied PHB pp. 198-301 and inherited parents. All
class levels and spell headers matched; expanded/corrected **8 summaries**,
including Binding, Clenched Fist, Cloak of Chaos, Clone, Earthquake, Greater
Shadow Evocation, Greater Spell Immunity, and Symbol of Death. Added
source/header/projection fixtures for all 46 titles; **338 tests pass across
two focused suites**. Lint, types and build pass. Spell effects remain manual.
The historical next target, minimum-level-9 spells, is now complete above.
This does not certify the full PHB.

**Previous checkpoint: PHB catalog minimum-level-7 spell batch complete (2026-11-17).**
Reviewed **49 titles / 55 class-level records**, Animate Plants through Word of
Chaos, against the supplied PHB and inherited parents. Corrected headers in
**5 records** and expanded/corrected all 55 summaries. Clarified HD-tiered word
effects, mass spell limits, teleportation, summoning, spell turning, costly
components and Resurrection's **10,000 gp** diamond cost. Added **100 focused
source/header/effect/projection/setting regressions**; **1,424 tests pass
across nine focused suites**, and 151 source-attribution cases pass separately.
Lint, types and build pass. Symbol of Stunning's inherited hp-limit ambiguity
is flagged for DM review; effects remain manual. This does not certify the full
PHB.

**Previous checkpoint: PHB catalog minimum-level-6 spell batch complete (2026-11-17).**
Reviewed **64 titles / 76 class-level records**, Acid Fog through Word of Recall,
against the supplied PHB and inherited parents. Corrected headers in **21
records** and expanded/corrected all 76 summaries. Restored missing hand,
summon, symbol and Undeath to Death fields; removed scraped web code from Veil.
Clarified damage/HD caps, Heal's actual condition list, transformation/travel
limits and component costs. **1,632 tests pass across ten focused suites**,
plus lint, types and build. Its historical next group, minimum-level-7 spells,
is now completed above. Symbol of Fear's unremoved inherited hp limit is
explicitly flagged for the DM; effects remain manual. This does not certify the
full PHB.

**Previous checkpoint: PHB catalog minimum-level-5 spell batch complete (2026-11-17).**
Reviewed **64 titles / 74 class-level records** against the supplied PHB and
inherited parents. Corrected headers in **39 records** and expanded/corrected
all 74 summaries. Key fixes include this edition's Baleful Polymorph timing,
Lesser Planar Binding's one-creature limit, Mind Fog's check/save penalties,
Shadow Evocation's disbelief limits and missing summon/symbol casting fields.
**1,502 tests pass across nine focused suites**, plus lint, types and build.
Its historical next group, minimum-level-6 spells, is now completed above.
Cloudkill's source ambiguity at 6 HD is explicitly flagged for the DM.
Spell effects remain manual; this does not certify the full PHB.

**Previous checkpoint: PHB catalog minimum-level-4 spell batch complete (2026-11-17).**
Reviewed **68 titles / 87 records** against the supplied PHB, including
inherited headers and effect descriptions: 64 ordinary-class titles and four
domain-only titles. Corrected headers in **42 records** and expanded/corrected
all 87 summaries, including Giant Vermin, Wall of Ice and scraped Tree Stride
text. Dismissal now labels its displayed DC as a base with its target-dependent
adjustment shown explicitly. **1,372 focused tests pass**, plus lint and build.
Its historical next group, minimum-level-5 spells, is now completed above.
This is a definition/summary pass, not automated combat or full PHB certification.

**Previous checkpoint: PHB minimum-level-3 spell batch complete (2026-11-17).**
Reviewed **79 spell titles / 101 class-level records** against the supplied
PHB, including inherited headers and effect descriptions. Corrected headers
in 45 records and expanded/corrected all 101 summaries. Poison's special
caster-level/Wisdom save DC now appears correctly on the spell sheet.
Its historical next group, minimum-level-4 spells, is now completed above.
This is a definition/summary pass, not automated spell combat or full PHB
certification. Validation and manual boundaries are recorded below.

**Previous checkpoint: PHB minimum-level-2 spell batch complete.**
Reviewed the remaining **88 spell titles / 110 class-level records** whose
lowest core-class spell level is 2 against PHB printed pp. 196-303.
Corrected headers and effect summaries across every variant, including missing
inherited casting details, Touch of Idiocy's penalties, Scare's frightened
condition, and Protection from Arrows' limited damage reduction.
Leomund's Trap was already checked; the entire minimum-level-2 group is now
reviewed at this definition/summary level, not automated for combat.
The exact next target and validation are recorded below.

**Previous checkpoint: 2026-11-17. PHB feat-definition/low-level spell batch complete.**
Reviewed all 109 represented PHB feat definitions (pp. 87-102) and the printed
headers for all 115 spells available at level 0 or 1 to any core class,
including all 131 class-level variants. Corrected shared feat mechanics,
missing spell details, and the Phantom Trap/Leomund's Trap duplicate.
This is not full PHB spell-effect or class-feature certification.
Validation limitations and the exact next target are recorded below.

**Previous checkpoint: 2026-11-16. PHB/DMG class batch complete.**
Reviewed all 11 PHB class chassis, represented feature milestones and bonus-feat
rules, plus all 13 represented DMG prestige-class prerequisite sets. Varag is
explicitly deferred: its non-HD racial advancement needs a separate model.
This batch does not enable incomplete DMG prestige progressions.

**Previous completed batch: MMII-MMV definition review.**
The crash recovery point was MMII; its saved findings were reconciled with
the supplied PDFs and current code. This batch checked feat/spell definitions
and class/progression definitions, corrected confirmed catalog discrepancies,
and recorded unsupported behavior. A checked definition pass below is **not**
a claim that all effects, races, templates, or class progressions are automated.
Earlier books still have inventories/partial fixes, not certified full reviews.

Review and fix one book at a time: feats, spells, base classes, and prestige
classes, including prerequisites, progression, selectable features, source
variants, and player eligibility. Preserve the audit's additional race,
alternate-class-feature, invocation, and skill-trick findings. Use the supplied
books as the rules authority and keep Dragonlance rules setting-specific.

For PHB/DMG certification, "complete" requires every sourcebook option of the
following kinds to be selectable where applicable, print on the character or
spell sheet, and be source-checked: feats, spells, base classes, prestige
classes, player races, and equipment/magic items. Situational effects may
remain manual only when the option is still represented and the manual
boundary is explicit. This is the definition-pass gate; it does not claim a
turn-by-turn combat engine or exhaustive automation of every effect.
Generated PHB/DMG items do not need duplicate fixed store entries when Forge or
wand/scroll/potion tooling can configure, save, and print the resulting item.

| Book | Review checkpoint and remaining gaps | Definition pass complete |
|---|---|---|
| Player's Handbook | Seven selectable races, 11 base classes, 109 feats, 605 spell titles / 715 PHB records, and Chapter 7 equipment/trade goods/barding variants are represented, source-checked, persistent, and printable. Generated Forge/wand/scroll/potion items are included when configurable and printable. Manual effect boundaries are explicit. | [x] |
| Dungeon Master's Guide v3.5 | All 16 represented prestige-class entry sets support level-up through full class lengths. Red Wizard circle magic and specialist defense remain partly manual. Remaining certification work: complete DMG epic-feat/rule option inventory and every selectable equipment/magic-item entry with printable inventory representation. | [ ] |
| Player's Handbook II | First-pass inventory; selected checks include five feats visually verified against printed pp. 71–75; full pass not certified. See [rules coverage](docs/rules-coverage.md#player-s-handbook-ii-feat-inventory-and-selected-checks). | [ ] |
| Complete Adventurer | First-pass inventory and selected checks; bardic-music and wild-feat benefit/prerequisite batches checked against pp. 109–111; full pass not certified. See [rules coverage](docs/rules-coverage.md). | [ ] |
| Complete Arcane | First-pass inventory and selected feat checks recorded; full pass not certified | [ ] |
| Complete Champion | First-pass inventory and selected feat checks recorded; full pass not certified | [ ] |
| Complete Divine | First-pass inventory and selected feat checks recorded; full pass not certified | [ ] |
| Complete Mage | First-pass inventory and selected feat checks recorded; full pass not certified | [ ] |
| Complete Scoundrel | First-pass inventory, feat checks, and skill-trick work recorded; full pass not certified | [ ] |
| Complete Warrior | First-pass inventory and selected feat checks recorded; full pass not certified | [ ] |
| Dragonlance Campaign Setting | Partial rules fixes and remaining TODOs documented below; full pass not certified | [ ] |
| Dungeon Master's Guide II | First-pass inventory recorded; full pass not certified | [ ] |
| Monster Manual I (Premium Edition) | Monster-feat chapter checked; creature coverage remains incomplete | [ ] |
| Monster Manual II | Nine sidebar feats checked: eight retained using 3.5 revisions, Multidexterity excluded; Beget Bogun added via verified 3.5 reprint. No new base/prestige class found. Race/template conversion open. | [x] |
| Monster Manual III | Eight missed racial feats added; 11 monster-feat definitions checked; Powerful Charge attribution and Quicken SLA timing fixed. No new spell/base/prestige class found. Race, shifting, and plating support open. | [x] |
| **Monster Manual IV** | 13 feats reviewed; summon spell and feat corrections implemented. Githyanki Battlecaster's Wizard bonus option is now implemented. **Varag racial progression remains deferred.** No new ordinary base/prestige class found. | [x] |
| Monster Manual V | 12 monster feats and seven sidebars checked; Earthbind added; Brutal Throw Fighter eligibility fixed. No new base/prestige/racial class found. Creature/template support open. | [x] |

**Definition-pass certified under the PHB/DMG criteria:** Player's Handbook
([x], 2026-11-18).

The Monster Manual II–V `[x]` entries above predate this stricter
selectable-option criteria and mean their scoped definition checks are
complete, not that every player-option surface in those books is represented
and printable. Do not add a book to the certification line until its feats,
spells, classes, prestige classes, player races, and items have been
represented and print-tested, with explicit manual boundaries.

### Resume here: open implementation work

- **Next rules-correctness target:** verify character creation and level-up
  against source-checked builds, starting with feat prerequisites at the level
  taken, then multiclass progression and spell slots/access. Check both legal
  selections and choices the builder should reject.
- **Explicitly deferred:** MMIV's Varag racial class (pp. 170-171).
  Its first five racial levels distribute only three racial Hit Dice and +2 LA;
  ordinary class advancement starts at racial level 6. It is not selectable,
  and must not be approximated as five ordinary class levels. Resolve this
  progression model before claiming complete MMIV class support.
- **Other explicitly open items:** complete DMG prestige progressions
  (including manual Red Wizard circle magic), and familiar options;
  Shifter/Warforged race creation, shifting, plating, and racial-feat
  effects; monster-PC/template conversions and summon/familiar/mount lists.
  New spell effects and creature management are manual. Githyanki Battlecaster's
  light-armor spell-failure exception is automated; conditional Dragonrider
  bonuses and breath-weapon effects remain manual. Wizard bonus eligibility
  for Githyanki Battlecaster is now implemented with normal prerequisites.
- **PHB source ambiguity:** Cloudkill (p. 210) assigns death saves to 4-6 HD
  creatures but also assigns recurring Constitution damage/half saves to
  6+ HD creatures. Its summary preserves and flags that overlap; the DM must
  resolve exactly 6 HD. No automated ruling was introduced.
- **PHB inheritance caveat:** Symbol of Fear (p. 290) functions as Symbol of
  Death but does not explicitly remove its 150-hp activation budget, unlike
  Symbol of Persuasion. Its summary preserves and flags that inheritance for
  DM adjudication rather than silently granting unlimited targets.
- **Remaining PHB work:** review manual feat/class mechanics;
  do not assume earlier first-pass inventories are finished reviews.
- **Source evidence:** per-book checkpoints in the
  [player-option audit](docs/player-option-audit.md#phb-catalog-minimum-level-9-spell-checkpoint-2026-11-17)
  and implementation boundaries in the
  [coverage matrix](docs/rules-coverage.md#provided-book-feat-inventory).
- **Validation:** recorded below; no print/PDF generation was run in this
  rules-only batch.

**PHB catalog minimum-level-7 spell checkpoint and validation (2026-11-17):**

- **49 titles / 55 records:** Animate Plants through Word of Chaos, no
  domain-only titles. Checked against supplied PHB printed pp. 201-298 and
  inherited parent entries/tables. Every represented class level/access,
  school/subschool/descriptor, component, casting time, range, duration, save
  and effect summary was reviewed; names, class access and levels are
  unchanged. Catalog remains **715 records / 605 titles**.
- Corrected headers in **5 records**, including Insanity, Invisibility, Mass,
  Phase Door and both seventh-level summon spells. Corrected all 55 summaries,
  with source-derived limits for HD-tiered word effects, mass spells,
  teleportation, summoning, Spell Turning, costly components and creature/
  object restrictions.
- **Resurrection (p. 272)** requires diamonds worth at least **10,000 gp**;
  the catalog's former 5,000-gp cost was incorrect. Symbol of Stunning
  inherits Symbol of Death's 150-hp activation budget without explicitly
  restating it; this ambiguity is flagged for DM adjudication rather than
  silently removing the cap.
- **Validation:** **100 new source/header/effect/projection/setting regressions**
  pass; **1,424 tests pass across nine focused suites**, plus **151 source-
  attribution cases** run separately. Lint, app/test types, production build
  and `git diff --check` pass. No full-suite or print/PDF run.
- **Manual boundaries:** no spell-effect automation or DC calculations were
  added. Saves, damage, conditions, buffs, concentration, transformations,
  symbols, wards, travel, divination, payment/cost spending and creatures
  remain manual. Summaries do not replace full source descriptions or certify
  the PHB. Changes saved, not committed.
- **Historical next target:** **46 catalog-minimum-level-8 titles / 49
  records**, Animal Shapes through Whirlwind, no domain-only titles; that batch
  is now completed above.

**PHB catalog minimum-level-6 spell checkpoint and validation (2026-11-17):**

- **64 titles / 76 records:** Acid Fog through Word of Recall, no domain-only
  titles. Read supplied PHB printed pp. 196-303 and inherited parent entries,
  including creature/HD, divination and planar-service tables. Every
  represented core class level/access matched; identities remain unchanged.
- Corrected headers in **21 records**. Restored Forceful Hand, both summon VI
  spells, both sixth-level symbols and Undeath to Death casting fields;
  Geas/Quest inherits Lesser Geas's duration. Restored subschools/descriptors
  and Eyebite's printed duration wording.
- Removed scraped advertising/tracking code from **Veil** and truncated
  Freezing Sphere/Wall of Iron text. Added Disintegrate's ranged touch/save
  damage and object limits, Chain Lightning's same-DC secondary saves,
  Heal/Harm caps and exceptions, Eyebite's HD/action/condition limits,
  Transformation's loss of spellcasting, and Undeath to Death's **9+ HD
  immunity** inherited from Circle of Death.
- Added planar ally/binding creature, payment and escape restrictions,
  Contingency's level/focus limits, image/ward behavior, costly components,
  and travel/load restrictions. Stone to Flesh's separate **fixed DC 15**
  survival save and Banishment's item-dependent bonuses are stated explicitly.
  Symbol of Fear's inherited hp-limit caveat is flagged above.
- **Validation:** **130 new source/header/effect/projection/setting
  regressions**, **1,632 passing tests across ten focused suites**. Updated
  only directly affected legacy assertions. Lint, app/test types, production
  build, size budget and `git diff --check` pass; initial JavaScript remains
  **492,299 / 515,835 bytes**. No full-suite or print/PDF run; the earlier
  full-suite timing limitation remains open.
- **Manual boundaries:** no new spell-effect automation or DC calculations.
  Damage, saves/modifiers, hp floors, conditions, buffs, concentration,
  transformations, traps/symbols, wards, travel, divination, payment/cost
  spending and creatures remain manual. Summaries do not replace full source
  descriptions or certify the PHB. Changes saved, not committed.

**PHB catalog minimum-level-5 spell checkpoint and validation (2026-11-17):**

- **64 titles / 74 records:** Atonement through Waves of Fatigue; no domain-only
  titles. Read printed pp. 201-301, inherited parent entries, the contact/
  permanency tables and premium polymorph rules (p. 320). Checked every class
  level, header and effect summary; no names, class access or levels changed.
- Corrected headers in **39 records**, including inherited casting fields on
  Overland Flight, Summon Monster V, Summon Nature's Ally V, Symbol of Pain
  and Symbol of Sleep. Restored subschools/descriptors and Raise Dead's Healing
  subschool, and corrected Waves of Fatigue's save field to **None**.
- **Baleful Polymorph (pp. 202-203, 320):** the supplied edition uses a
  **24-consecutive-hour delay** before its additional Will save; equipment
  drops and polymorph-subschool immunities/statistics apply. Not the older
  immediately resolved second-save wording.
- **Lesser Planar Binding (pp. 261-262):** exactly **one elemental or outsider
  of up to 6 HD**, not three creatures. Added trapping, bargaining, escape and
  service limits. Mind Fog affects Wisdom checks/Will saves, not ability scores.
  Shadow Evocation's purely nondamaging effects fail against disbelievers,
  rather than retaining a flat 20% chance.
- Restored truncated Private Sanctum, Telepathic Bond, Wall of Force and Waves
  of Fatigue summaries; corrected damage caps, bonuses, condition limits,
  costs, resurrection losses, creature counts and travel restrictions.
- **Validation:** **1,502 passing tests across nine focused suites**, including
  **130 new source/header/effect/projection/setting regressions**. Lint,
  app/test types, production build, size budget and `git diff --check` pass;
  **492,299 / 515,835 bytes** initial JavaScript. No full-suite or print/PDF run;
  the earlier full-suite timing limitation remains open.
- **Manual boundaries:** effects, attacks, buffs, concentration, possession,
  transformations, traps/symbols, resurrection, crafting, site wards,
  divination, travel tables, XP/material spending and creature management
  remain manual. Cloudkill's 6-HD overlap is flagged, not silently resolved.
  Summaries do not replace full source descriptions. Changes saved, not committed.

**PHB catalog minimum-level-4 spell checkpoint and validation (2026-11-17):**

- **68 titles / 87 records:** Air Walk through Zone of Silence; 83 ordinary
  class-level variant records and four domain-only records. Checked source
  headers, class levels and effect descriptions against printed pp. 196-303,
  resolving inherited fields. Corrected headers in **42 records** and
  expanded/corrected all 87 summaries; no names or class levels changed.
- Restored missing inherited fields for Cure/Inflict Critical Wounds, Mass
  Enlarge/Reduce Person, Locate Creature, Solid Fog and Summon Monster IV.
  Corrected subschools/descriptors, all Cure Critical Wounds healing variants,
  Ice Storm's duration and Holy Smite/Order's Wrath's V/S-only components.
- Repaired truncated Giant Vermin, Wall of Ice's durability (**3 hp per inch
  of thickness per 10-ft. section**), Tree Stride's embedded advertising code,
  and Shadow Conjuration's permitted schools, disbelief and resistance limits.
  Added missing caps, bonus types, costs, save/target limits and effect details.
- **Dismissal (p. 222):** ordinary and prepared-metamagic rows label the
  number **Base DC** and show **final DC = base DC + caster level - target HD**.
  Target-dependent adjustment remains manual, not a falsely final number.
  Poison's separate formula and ordinary spells' DCs are preserved.
- Chaos Hammer, Holy Smite, Order's Wrath and Unholy Blight remain
  **domain-only**, not ordinary Cleric spells; domain lookup and all ordinary
  class exclusions are tested. This corrects the former checkpoint's
  imprecise description of all 68 titles as "lowest core-class level 4."
- **Validation:** **1,372 tests pass across eight focused suites**, including
  **145 new source/header/effect/domain/DC-display regressions**. Lint,
  app/test types, production build, size budget and `git diff --check` pass;
  **492,299 / 515,835 bytes** initial JavaScript. No full-suite or print/PDF
  run; the earlier full-suite timing limitation remains open.
- **Manual boundaries:** spell effects, attacks, buffs, concentration,
  conditions, forms, terrain, creature management, transfers, resurrection,
  paid services and Dismissal's final DC remain manually resolved. Summaries
  do not replace the full source. Changes are saved, not committed.

**PHB minimum-level-3 spell checkpoint and validation (2026-11-17):**

- **79 titles / 101 records:** checked core class access/levels, schools,
  subschools/descriptors, components, casting times, ranges, durations, saves
  and effect descriptions against the supplied PHB, printed pp. 198-300.
  Corrected headers in **45 records**; all 101 variants now have consistent,
  expanded effect summaries instead of terse/truncated text.
- Restored missing inherited casting details for Cure Serious Wounds,
  Deep Slumber, Deeper Darkness, Inflict Serious Wounds, Invisibility Sphere,
  Greater Magic Fang and both summon III spells. Deep Slumber and summoning
  take **1 round**, not a standard action.
- Corrected Haste's extra full-attack weapon attack (not an extra action),
  Invisibility Purge's temporary negation (not dispelling), Vampiric Touch's
  capped temporary hp (not healing), magic-circle alignment barriers,
  Fireball/Lightning Bolt caps, and other bonus/target/save/component limits.
- **Poison (p. 262):** both class-level variants specify
  `10 + floor(caster level / 2) + Wisdom modifier` for their Fortitude saves.
  The shared DC calculation and ordinary/prepared-metamagic spell rows now
  use that formula, retaining applicable Spell Focus and setting modifiers.
  Heighten's slot level does not replace the explicit caster-level formula.
  Other spells and generic spell-level DC summaries keep their existing rules.
- **Validation:** **1,342 tests pass across eight focused suites**, including
  **168 new source/header/effect/DC/UI regressions**. Lint, app/test types,
  production build, size budget and `git diff --check` pass;
  **492,299 / 515,835 bytes** initial JavaScript.
  No full-suite or print/PDF run; the earlier full-suite timing limitation
  remains open. Changes are saved, not committed.
- **Manual boundaries:** spell attacks, buffs, concentration, damage,
  conditions, forms, terrain, traps, bindings, summoned creatures and mounts
  remain manually resolved. Summaries do not replace complete source
  descriptions; no spell titles or class-list levels were added or removed.

**PHB minimum-level-2 spell checkpoint and validation:**

- **88 titles / 110 records:** checked class levels, schools/subschools/
  descriptors, components, casting times, ranges, durations, saves and effect
  bodies against the supplied PHB. Corrected headers in **48 records** and
  replaced terse, truncated or misleading summaries in all 110 variants.
- Restored inherited fields for Cure Moderate Wounds, Daze Monster, Hold
  Animal, Inflict Moderate Wounds, Make Whole and both second-level summon
  spells. Preserved the one-round summon casting time and appropriate
  arcane/divine focus requirements. Fog Cloud's range uses the standard
  medium-range notation rather than the printed missing-slash typo.
- Corrected penalties versus ability damage, frightened versus panicked,
  Death Knell's caster-level-only benefit, ranged DR 10/magic with its damage
  cap, Scorching Ray's caster-level 7/11 thresholds, recurring damage,
  bonus types, target restrictions, material costs, saves and spell resistance.
  Class-level variants now share the same summary; Mystic inheritance and
  Dragonlance-only Bard healing restrictions remain intact.
- **Not automated:** spell attacks, buffs, concentration, damage, conditions,
  forms, terrain, traps and summoned creatures still require manual resolution.
  Summaries are player-facing guidance, not a replacement for the complete
  source descriptions. No spell titles were added or removed.
- **Validation:** 768 focused tests pass across five suites, including
  **162 new source/summary/class-list tests**. Lint, app/test types, production
  build, size budget and whitespace checks pass. No full-suite or print/PDF
  run in this batch; the prior full-suite timing limitation below remains
  outstanding. Changes are saved, not committed.

**PHB feat/low-level spell checkpoint and validation (2026-11-17):**

- **109 feats:** compared prerequisite sets, Fighter eligibility, categories,
  repeatability and benefit summaries with PHB pp. 87-102. Quicken uses a
  **swift action**, following Complete Arcane p. 86's explicit update;
  spontaneously cast spells cannot use ordinary Quicken. The spell-sheet
  guidance now states both restrictions, including cleric/druid conversions.
- **Shared mechanics:** Spell Focus/Greater Spell Focus and Gnome illusion
  DCs recognize schools with subschools and/or bracketed descriptors.
  Legal Toughness picks still stack; illegal saved Wizard-slot picks no longer
  grant HP and retain their existing repair warning.
- **115 spell titles / 131 class-level records:** checked class lists/levels,
  school/subschool/descriptors, components, casting time, range, duration and
  saves against printed PHB headers, resolving inherited fields. Filled
  Cure Minor Wounds, Inflict Minor Wounds, Charm Animal, Lesser Confusion
  and Hold Portal gaps; corrected Lesser Confusion's components and
  Undetectable Alignment's harmless-save qualifier. Preserved Feather Fall's
  immediate action, explicitly verified in Complete Arcane p. 86.
- Repaired 14 low-level effect summaries, including Magic Missile's missing
  damage/scaling, Ray of Enfeeblement's **penalty, not ability damage**, and
  Lullaby, Faerie Fire, Shield, Divine Favor and Produce Flame restrictions.
  Effect resolution remains manual; this does not certify every effect.
- **Duplicate resolved:** PHB pp. 247-248's Leomund's Trap is the spell called
  Phantom Trap in the SRD. Retained one selectable entry and both lookup names.
  Imports migrate spellbook, mastery, preparation and metamagic-copy records,
  preserving copy counts/alignment; conflicting acquisition/ownership records
  produce an explicit error instead of being discarded.
  The base catalog now has **715 class-level records / 605 distinct titles**.

**Validation:** the final four-suite source/class/HP/domain run passed
**361 tests**, including **169 PHB source/migration tests**. An earlier focused
five-suite spell-UI/proficiency run passed **637 tests**. Lint, app/test type checks,
production build, size budget and `git diff --check` pass:
**492,191 / 515,835 bytes** initial JavaScript. Full-suite attempts reached
**1,771 / 1,773 passing**, but suffered intermittent, very long timing stalls
in existing UI workflows (height entry, wizard spellbook acquisition and
deferred sheet loading). A focused retry passed the height/loading checks but
stalled in a different wizard import/export workflow. **A clean full-suite
run is still outstanding**; no timeout limits were relaxed or unrelated UI
behavior changed. No print/PDF generation ran. Changes are saved, not committed.

**PHB/DMG class checkpoint and validation (2026-11-16):**

- **PHB pp. 23-58:** checked HD, skill-point rates, BAB and all three base-save
  progressions for all 11 classes. Paladin now has poor Will; Divine Grace
  remains a separate Charisma bonus. Monk Fast Movement is displayed at
  level 3, following the feature text and numeric speed column rather than
  the table's premature level-2 label.
- **Bonus feats:** Wizard 5/10/15/20 now allow metamagic, item creation, Spell
  Mastery and explicitly sourced exceptions, retaining prerequisites.
  Verified Complete Mage's reserve rule (p. 37), tagged its 24 reserve feats,
  and restricted three specialist-only bonus exceptions to the correct
  specialist. Githyanki Battlecaster's MMIV exception is supported.
  Invalid saved Wizard choices are retained visibly with warnings, not counted
  as chosen feats, do not grant mechanical bonuses or prerequisites, and can
  be replaced during setup or level-up.
- **DMG pp. 176-196:** corrected all 13 represented entry-requirement sets,
  removed invented ability/class restrictions, and added shared checks and
  requirement tooltips. Legacy references grant no levels, feature listings
  or weapon proficiencies. Assassin's fictional entry condition and Dragon
  Disciple's creature/template/DM-approved variety checks remain manual.
  Incomplete progressions remain disabled; the three absent classes remain open.

```bash
npm test -- --maxWorkers=2
npm run lint
npm run build
```

**28 suites / 1,602 tests passed**, including 35 focused core-class/prestige
regressions. The initial unbounded full run exposed timing-sensitive lazy-screen
tests; cold-load/import assertions now wait for the expected state, and the
complete bounded run passed. Lint passed with no warnings. App/test type checks,
production build and size budget passed: **488,143 / 515,835 bytes** initial JavaScript.
Browser checks confirmed first-level prestige filtering, saved-Wizard warnings,
replacement clearing the warning, and restricted Wizard choices. No print/PDF
generation ran. Changes are saved in the worktree, not committed.

**MMII definition-pass checkpoint (2026-11-16):** Feats, Beget Bogun, and
absence of new base/prestige-class definitions checked; race/template conversion
remains open. `npm test -- tests/monsterManual.test.ts tests/spell-loading.test.ts`
passed (2 tests). Proceeding to MMIII's missed feat definitions; this targeted
run does not certify the other interrupted code changes.

**MMIII/MMIV checkpoint (2026-11-16):** MMIII's eight racial feats and
11 monster-feat definitions reviewed; MMIV's 13 feats and summon spell reviewed.
`npm test -- tests/monsterManual.test.ts tests/castingSummary.test.tsx tests/rules.test.ts -t 'Monster Manual|monster feat|shifter|warforged|Mithral|Fortification|racial-feat|Beget Bogun|Clockwork Mender|Githyanki|MMIV|spell failure|Battle Caster|light-armor'`
passed (31 tests). MMIII race/plating/shifting effects remain manual. MMIV's
Varag racial progression (pp. 170-171) is explicitly unsupported; Wizard
bonus-feat selection was still open at this checkpoint (resolved above).
Proceeding to MMV's Earthbind and
remaining feat comparisons.

**Final MMII-MMV batch validation (2026-11-16):**

```bash
npm test -- tests/monsterManual.test.ts tests/rules.test.ts tests/castingSummary.test.tsx tests/spell-loading.test.ts tests/spells.test.tsx
npm run lint
npm run build
```

All five selected suites passed: **614 tests**, including 16 focused
monster-book regressions. Lint passed with no warnings. Application and test
type checks and the production build passed; initial JavaScript was 484,458
bytes against the 515,835-byte limit. Spell loading remains deferred and
concurrent loads are deduplicated. This was not a full-suite or print/PDF run.
Changes remain saved in the worktree, not committed. Varag was subsequently
deferred by user decision; resume the PHB feat/spell audit above rather than
repeating the completed definition scans.

### Checkpoint rule

Update this section after each completed book **and before pausing or switching
books**. Record the book and checked sections/pages, fixes and tests, exact
validation commands/results, remaining manual or unsupported behavior, and the
next book or exact unfinished section. Mark a book complete only after every
in-scope category has been checked (explicitly recording categories with no
options), confirmed defects are fixed and validated, and remaining limitations
are documented. If work is blocked or deferred, leave it visibly incomplete.
Keep detailed source evidence in the
[player-option audit](docs/player-option-audit.md) and implementation boundaries
in the [coverage matrix](docs/rules-coverage.md); this README is the resume point.

## Printable sheet

- Rebuilds the authorized examples as a data-bound layout, not as background images.
- Hard print requirement: exactly two portrait Letter pages (8.5 × 11 inches),
  with no extra page, clipping, or overflow. A headless Chromium regression test
  generates PDFs for a simple Fighter and a dense, level-20 Dragonlance Mystic,
  then checks page count, Letter dimensions, and content bounds.
- The Handwritten toggle defaults on and changes generated character data to
  Marck Script. Fixed labels, layout, and the Skills area stay in their original
  style.
- Page two provides 28 inventory rows above a full-width 6×2 grid for the 12
  modeled worn-item slots.
- Feats, racial traits/class features, gear, and first-page details use about
  8 pt for legibility. The top Hit Points field shows maximum HP; Combat Notes
  keeps blank, outlined write-in fields for current HP, nonlethal damage, and
  temporary HP. The Movement column has blank write-in boxes for fly, climb,
  swim, and burrow speeds; feet are implied in the Speed field. The Attack
  table reports range and calculated reach per weapon in one column.

## Requirements and development

Use Node.js 24 LTS and npm.

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run check
npm run benchmark
```

`check` runs warning-free lint, regression tests, application and test type checks,
and a production build. The build fails if initial JavaScript exceeds 515,835
uncompressed bytes. Supplemental feat data loads on demand before the character
or print sheet mounts, while all currently supported books remain available.
Tests cover draft isolation, progression, combat calculations,
catalog matching and invalidation, persistence, malformed imports, lazy loading,
screen navigation, custom items, and printable-sheet integration and data binding.
Run `npm run test:print` for real-browser PDF regressions and mobile sheet
coverage. Printable PDFs include two Letter character-record pages and a
variable number of level-organized spell pages per casting class. Spell levels
stay together, rows are uniform, and each castable level includes write-in rows.
An asterisk in the Conc. column marks spells requiring concentration; Duration
omits that requirement. The attack table lists elemental weapon damage separately
from physical damage.
Character layout is checked at 320px, 390px, 560px, and 561px;
Equipment, Spells, Notes, Store, Forge, Wands & Scrolls, and Rules Library are
checked at 320px and 561px, including delayed Notes, Equipment, and Spells
loading. Install Chromium once with `npx playwright install chromium`.

The catalog benchmark compares the old per-lookup sorting algorithm with the new
index, checks equivalent results for every catalog entry and decorated variant,
and requires at least a 2x lookup improvement. Timings vary by machine.

## Optimizations

- Independent screen components, data catalogs, rules, persistence, and validation
  replace the original single-file application.
- Spell data is downloaded once, only when a caster, spell-bearing inventory, or
  the Wands & Scrolls screen requires it. Loading failures have a visible retry.
- Equipment, store, forge, crafting, and spell screens are loaded on demand.
- Secondary character-sheet panels and selection pickers are deferred from the
  initial JavaScript entry chunk.
- Equipment names use an exact-match index and a longest-name fallback sorted once
  per catalog revision, rather than sorting the catalog for every inventory row.
- Spell lists are indexed by class and name. Picker search results are memoized.
- Rolled ability scores are derived directly instead of triggering a second render
  through a state-synchronizing effect.
- The saved character is read once during initialization. Imports and saves are
  validated before use; storage failures are reported rather than shown as success.
- Custom catalog changes persist before mutating live data, invalidate lookup
  indexes, and notify the open store so additions/deletions appear immediately.

The original 2.0 build loaded approximately 611 KB of JavaScript at startup.
The optimized initial JavaScript is approximately 511 KB before compression
(about 16% less).
Full spellcasting sessions still load the spell catalog and their requested screens;
code splitting reduces initial work, not the size of the rules content itself.

## Saving and compatibility

Save uses this application's local browser/Electron storage. Export creates a JSON
file containing the character and custom item catalog; Import accepts well-formed
2.0 character exports. Export a character from 2.0 and import it into 3.0 to transfer
between application origins or desktop installations.

Level-up choices remain provisional until confirmation. Confirming a valid level-up
lets the app roll the new Hit Die or accepts a manual roll from 1 through the die's
maximum. HP gains by level are recorded, and Constitution and Toughness bonuses are
applied automatically. The first Hit Die uses its maximum value. Cancelling the draft
does not roll HP or alter the saved character. Save and Export are disabled during a
level-up draft so unvalidated choices cannot be persisted or transferred. Existing
characters keep their saved HP totals; past rolls that were not recorded cannot be
reconstructed.

Under the Dragonlance ruleset, the 12 prestige classes in *Dragonlance Campaign
Setting* are available during level-up after their implemented mechanical
prerequisites are met. The builder tracks Hit Dice, skills, attack/save
progression, class features, and spellcasting advancement. Wizard of High Sorcery
also records robe order, specialist school, and barred schools. Solamnic and
Nerakan sponsorship and tests are confirmed in the level-up flow; their
roleplaying requirements still need the player's judgment. Knight of the Crown's
timed Strength of Honor and Crown of Knighthood effects are tracked. Most other
prestige features, including companion/follower management and effects on other
characters, are presented for manual tracking rather than automatically applied.
Baaz and Kapak draconians are separate race options with two racial Hit Dice and
level adjustment; select the Dragonlance Monster Classes ruleset to show
level-adjusted races. Racial Hit Dice affect attack/save progression and skill
limits, but their hit points must be entered manually. Legacy generic Draconian
and Deep Dwarf entries remain available only to characters already using them.
Saving during initial setup stores a resumable draft; reopening it returns to setup,
where the usual validation still applies before the character can be finalized.

The application still has one active locally saved character. Use separate JSON
exports to keep multiple characters. There is no cloud synchronization.

### Rules PDF library

The Rules Library tab stores user-added PDFs in the device's local app/browser
profile. PDFs are not uploaded, included in character exports, or bundled with
the application. Each PDF can be tagged for all rulesets, Core SRD, or
Dragonlance; the library shows only sources applicable to the active character's
ruleset. Open a PDF in the viewer and use its Find command to look up text.
Scanned PDFs without a text layer may not support text search. Clearing local app
data also removes the saved PDFs.

Age, height, and body weight are free-form text fields in setup and on the finalized
sheet. Values such as `about 30`, `180 lb.`, or `82.5 kg` are saved exactly as entered,
without unit conversion or numeric stepping. Body weight is descriptive and does
not change inventory encumbrance calculations.

### Compact character sheet

Caster characters have a compact Spellcasting panel with a Manage spells shortcut,
class-specific base caster levels and save DCs, and the existing Concentration
skill modifier. DC chips appear only for levels with usable daily slots and a
sufficient casting ability score. Concentration tooltips share the Skills
breakdown. A session-only Combat Casting context applies its +4 bonus to
Concentration checks while casting defensively, grappled, or pinned; other
conditional effects remain manual.

Arcane spell failure appears for bard, sorcerer, and wizard casting, and on their
spell sheets. Armor and shield percentages add (capped at 100%); mithral armor uses
its reduced percentage. Bard spells ignore light armor, including armor treated
as light by mithral, but not shields. Proficiency does not remove failure.
Custom armor/shield failure fields are honored; missing values show Unknown with
the item identified in a tooltip, rather than assuming zero. Failure applies to
somatic spells only. Divine casters omit it. Conditional caster-level/DC bonuses
and unmodeled prestige advancement still require manual adjustment.

The combat summary includes an in-play HP tracker. `hitPoints` remains maximum
HP; optional `currentHitPoints` defaults to maximum for older saves. Damage
consumes temporary HP before current HP; nonlethal damage bypasses that pool.
Magical healing restores current HP up to maximum and removes an equal amount
of nonlethal damage, even when HP healing is capped. Nonlethal recovery can also
be applied independently. Setting temporary HP replaces (does not stack) the pool.
Enter damage after manually resolving DR, resistance, and other effects.

Controls are disabled during setup and level-up drafts. Committing a level-up
increases current and maximum HP equally, preserving existing damage. Finalizing
setup resets the tracker. Save/Export includes HP state; changes are not auto-saved.
Status reminders distinguish disabled, dying, dead, staggered, and nonlethal
unconsciousness. Stabilization, Diehard, ongoing damage, and other exceptions
remain manual; healing cannot automatically revive a dead character.

The combat summary also tracks active conditions/effects and a round counter.
Bless, shaken, and sickened presets provide common modifiers; custom effects can
apply modifiers to attack rolls, all AC variants, saves, weapon damage, and
skill checks, initiative, and grapple checks. Apply the listed check modifier
manually to other ability checks. Advancing a round decreases timed effects and
removes those that expire. Effects are saved with the character. Enter only
modifiers that stack; bonus-type stacking, situational limits, and exact effect
timing remain adjudicated manually. The preset for bless applies its attack bonus;
its save bonus against fear is situational and must be tracked separately.
Great Fortitude, Lightning Reflexes, and Iron Will are included in their
respective saving throw totals and breakdowns.

Equipped defensive items contribute their listed typed bonuses to AC and saving
throws. Duplicate bonuses of the same type use only the highest value; Bracers
of Armor and the Robe of the Archmagi likewise use the highest armor bonus.
These totals and AC components carry through to the printable sheet. Conditional
item requirements other than the Ring of Force Shield's tracked activation, and
non-defense effects such as the Stone of Good Luck's ability- and skill-check
bonuses, remain manual.

Feat, spell, class, and prestige-class entries display their broad catalog
source (Core SRD or Dragonlance user content pack). Feats and verified classes
also show book-level cross-checks: core classes and PHB feats to the *Player's
Handbook* (3.5), epic feats to the *Dungeon Master's Guide* (3.5), monster
feats to the *Monster Manual* (3.5), core prestige classes to the DMG, and
Dragonlance classes and feats to their respective sourcebooks. Supplemental
feats have separate book-level attribution: all 64 *Complete Arcane* table
feats are represented, with *Extra Edge*'s Warmage level 4 prerequisite
manually confirmed, and *Brutal Throw* is attributed to *Complete Adventurer*
(reprinted in *Monster Manual V*). Supplied
books are reviewed source-by-source, with checked scope and remaining gaps
tracked in the [rules coverage
matrix](docs/rules-coverage.md#provided-book-feat-inventory) for the inventory
and manual boundaries. Catalog inclusion does not mean every prerequisite or
feat effect is automated. When a feat appears in multiple books, its label uses
the earliest verified printing. *Practiced Spellcaster* and *Transdimensional
Spell* are therefore attributed to *Complete Divine*, not their reprint in
*Complete Arcane*. The *Master of the Way* entry remains broad-source-only
because its book source is unverified.
The earlier 716-record SRD spell inventory had a name-only PHB cross-check.
The 2026-11-17 review resolved its outstanding *Phantom Trap* title as
*Leomund's Trap* (PHB pp. 247-248) and merged that duplicate, retaining an alias
and saved-character migration. The base catalog now contains 715 class-level
records representing 605 distinct titles. Printed headers for all 115 spells
available at level 0 or 1 to any core class have separate, source-backed
regressions; the rest of the spell catalog is not thereby mechanics-certified.

On wide screens, Ability Scores, Attacks & Weapons, and Languages stack
independently beside Combat Summary and Saving Throws, avoiding gaps caused by
shared row heights. Narrow screens use a single column. Weapon slots use compact
rows, with unequipped slots reduced to a short status; calculated penalties and
save breakdowns remain visible.

Normal AC also shows touch and flat-footed AC. Touch excludes armor/shield
bonuses while retaining armor/load Dexterity limits; flat-footed removes positive
Dexterity unless Uncanny Dodge is recorded or granted by barbarian 2 / rogue 4.
Negative Dexterity still applies.

Equipped standard Rings of Protection +1 through +5 add deflection to normal,
touch, and flat-footed AC. Amulets of Natural Armor +1 through +5 add enhancement
to natural armor to normal and flat-footed AC, never touch. Cloaks of Resistance
+1 through +5 add resistance to Fortitude, Reflex, and Will. Only the highest
bonus of each type applies; two rings do not stack. AC and save tooltips identify
the contributing items and suppressed duplicate bonuses.

Items must occupy their matching slots (Rings 1/2, Neck, or Shoulders); inventory
ownership alone grants no bonus. Supported standard names work in existing
saves/imports, including size suffixes. Custom-item names/descriptions are not
interpreted as mechanical bonuses. No bonuses are written into underlying scores
or saved totals. Effects not recorded in the active-effects tracker, innate
natural armor, conditional dodge bonuses, unsupported ability-boosting items, and
other unmodeled effects still require manual adjustment.

Standard Belts of Giant Strength, Gloves of Dexterity, Periapts of Wisdom, and
Cloaks of Charisma (+2/+4/+6), plus Gauntlets of Ogre Power +2, grant enhancement
bonuses only in their matching Waist, Hands, Neck, or Shoulders slots. Same-ability
enhancement bonuses do not stack (for example, belt and gauntlets use the higher
Strength bonus). All supported variants are available in the store. Exact standard
names, optionally with size suffixes, identify supported items; arbitrary custom
names/descriptions are not parsed into bonuses.

Ability cards show the effective score with a base-plus-gear line and item tooltip.
Base/racial scores, creation inputs, level-up increases, and saved ability scores
are not overwritten. Effective scores drive attacks, damage, grapple, AC,
initiative, saves, skills, carrying capacity/load/movement, feat ability
prerequisite checks, casting DCs, minimum casting scores, and bonus daily slots
(including cleric domain eligibility). Unequipping recalculates these immediately;
existing prepared/expended spell choices are retained and over-preparation is
flagged on the spell sheet. Spell effects, item-duration/adjudication restrictions,
and special feat-use conditions remain manual. Amulets of Health +2/+4/+6 and
Headbands of Intellect +2/+4/+6 use the Neck and Head slots respectively.
Intelligence updates effective checks, spell DCs, minimum spell scores, bonus
daily/domain spell eligibility, and feat prerequisites; it never grants retroactive
skill points or bonus languages.

Constitution updates effective checks, saves, and HP maximum by the per-Hit-Die
modifier difference. Current HP shifts by the same amount to preserve damage.
Healing and damage while the item is equipped are stored relative to unequipped
maximum HP, so removing the item reverses its HP adjustment without changing base
scores, HP rolls, or underlying maximum. Constitution bonuses do not retroactively
alter per-level HP rolls.

A compact attack strip on both character and equipment sheets shows melee touch,
ranged touch, and grapple. Tooltips list BAB, ability, size, and equipment penalties.
Melee touch supports Weapon Finesse (including its shield penalty); grapple uses
its separate size scale and Improved Grapple's +4, not weapon enhancement or
two-weapon penalties. Tracked attack/check modifiers are included; other values
are baseline first attacks/checks, before range, cover, situational effects, or
penalties for successive attacks.

Weapon rows show BAB-based iterative attacks at BAB 6, 11, and 16, decreasing
by 5 each time (at most four). Off-hand rows show one attack, not a complete
two-weapon routine. These sequences do not add haste, flurry, or feat-granted
attacks, though tracked attack modifiers do apply. Each full range increment
imposes a cumulative -2 attack penalty; targets closer than the first increment
are unpenalized. Point Blank Shot adds +1 attack and damage with ranged weapons
when a target distance of 30 feet or less is entered. Thrown weapons are limited
to five increments and projectile weapons to ten. Target distance is
session-only. Bows, crossbows, slings, and darts check inventory for compatible ammunition; the sheets show missing ammo
and draw/reload action notes, but do not consume ammo or track loaded state.
The session-only Combat Expertise selector applies a chosen attack penalty to
melee attack totals and an equal dodge bonus to normal and touch AC, up to 5 or
the character's BAB, whichever is lower. It requires the feat and effective
Intelligence 13; the dodge bonus also applies to flat-footed AC when Uncanny
Dodge is retained. The change lasts until the character's next action, which
must be cleared manually because turn timing is not tracked.
The session-only Power Attack selector trades a chosen penalty, up to BAB, from
melee attacks for damage until the next turn. It requires the feat and effective
Strength 13; two-handed weapons double the damage bonus, while light weapons
receive no bonus except unarmed strikes and natural weapons. Unarmed strikes are
represented and receive the bonus; natural-weapon attacks aren't modeled in the
weapon rows and remain manual. Double-weapon use is handled according to its
one-handed/light or two-handed grip. Clear it manually because turn timing is
not tracked.
The session-only Dodge toggle adds +1 dodge AC against the current opponent
when the feat and effective Dexterity 13 prerequisite are met. The bonus is
lost whenever Dexterity to AC is denied; the flat-footed AC omits it unless
Uncanny Dodge applies. The app does not track opponent identity or other
Dexterity-denial conditions.
The combat summary reports one attack of opportunity per round normally, or
one plus the nonnegative Dexterity modifier with Combat Reflexes. It also notes
that Combat Reflexes permits these attacks while flat-footed. Only one attack
is allowed per opportunity, and the feat does not increase a rogue's
Opportunist uses. Spent attacks, triggers, and threatened movement are not
tracked.
The shared target DR context evaluates cold iron, silver, adamantine, and magic
qualifiers, including `and`/`or` combinations of those types. It uses weapon
material for melee/thrown weapons and selected ammunition for bows, crossbows,
and slings; a +1 enhancement on a projectile weapon makes its selected
ammunition count as magic for DR. Ammunition selection is session-only and does
not consume inventory. Alchemical-silver melee/thrown weapons and selected
silver ammunition apply the -1 damage penalty (minimum 1). Damage is not
automatically reduced by target DR; alignment, epic, and other qualifiers remain
manual. The standard catalog includes no adamantine equipment; custom weapons
can be tagged as adamantine for DR bypass, but their price and weight are entered
manually. Object hardness and adamantine armor's damage reduction are not
modeled. See the
SRD [damage reduction](https://www.d20srd.org/srd/specialAbilities.htm#damageReduction)
and [special materials](https://www.d20srd.org/srd/specialMaterials.htm) rules.
Custom thrown weapons use Strength for
damage; custom projectiles can select no Strength damage, the full Strength
modifier, or negative Strength modifiers only.
Standard ranged/thrown increments and melee weapon reach appear alongside weapon
details; custom size-specific range and explicit reach values take precedence.
Reach weapons distinguish normal-reach exclusions, spiked chain, and whip rules.
Weapon size is compared with the wielder's size: each category of mismatch applies
a -2 attack penalty and shifts the weapon's handedness one step. If that shift
falls outside light, one-handed, or two-handed, the weapon cannot be wielded.
See the SRD [weapon-size rules](https://www.d20srd.org/srd/equipment/weapons.htm#inappropriatelySizedWeapons).
One-handed weapons have a saved grip choice; a two-handed grip applies 1.5×
Strength damage and cannot be combined with an off-hand weapon or ordinary
shield. Bucklers are compatible, apply their -1 attack penalty when the shield
arm helps wield a melee weapon, and lose their AC bonus while an off-hand weapon
is used.
The SRD double weapons can be used with one end as a two-handed weapon or with
both ends as a one-handed weapon and a light off-hand weapon. The latter mode
uses two-weapon penalties and the appropriate Strength multipliers; weapons with
different ends allow the primary end to be selected.

A compact line on both sheets shows space, natural reach (tall/bipedal size
defaults), and carried weight against the light-load limit. The load classification
and tooltip use all three capacity thresholds. Unrecorded item weights are marked
as incomplete rather than implying an exact carried total.

### Skill training and untrained use

Skill rows distinguish class-skill status (the checkbox) from training (at least
one whole rank). Compact rows show a small **Trained** indicator only when trained.
Hover or keyboard-focus a skill name for ranks, training status, and whether
untrained use is allowed, limited, or prohibited. Usable zero-rank skills retain
their modifier; unavailable checks leave that location blank. Half ranks do not
add a fractional check bonus.

Knowledge skills allow only common-knowledge Intelligence checks at DC 10 or lower
without training. Handle Animal permits limited Charisma checks for domestic
animals (and a druid/ranger's companion). Sleight of Hand permits untrained
Dexterity checks, which cannot succeed above DC 10 except to hide an object on the
body. Appraise's untrained results, Open Lock's separate force-open option, and
the language and Trapfinding restrictions for Forgery and Disable Device are
explained in the skill-name tooltips. Speak Language leaves the modifier blank;
its tooltip explains that each full rank learns one language in the Languages
section and that no skill check is required.
At 5 ranks, Handle Animal, Knowledge (history), and Knowledge (religion) also
show their +2 synergy bonuses for Wild Empathy, Bardic Knowledge, and turning
checks in the Special Abilities list; those feature checks remain manual.

Status is derived from existing ranks and updates during setup and level-up;
discarding a draft restores the original training. No extra training flags are
saved. Displayed modifiers include ability, whole ranks, racial bonuses,
Skill Focus, skill synergies, equipped armor/shield check penalties, and tracked effects.
Skill Focus adds +3 to its selected skill; it can be selected multiple times for
different skills. A compact label such as **-5 armor,
-2 shield** appears only when a penalty applies; the skill and modifier tooltips
identify the actual items. Normal armor penalties apply to Balance, Climb, Escape
Artist, Hide, Jump, Move Silently, Sleight of Hand, Tumble, and Swim (doubled).
Armor and shield penalties stack. Masterwork/magic equipment reduces its penalty
by 1 (not below zero); mithral catalog values already include their reduction.
Unequipped inventory does not impose armor penalties.

This pass does not implement synergy, all feats,
or every task-specific/class-feature exception. "Usable" is not a guarantee that
all tasks are available (for example, trapfinding and Tumble movement restrictions
still need to be considered).

References: SRD [skills summary](https://www.d20srd.org/srd/skills/skillsSummary.htm),
[Knowledge](https://www.d20srd.org/srd/skills/knowledge.htm),
[Handle Animal](https://www.d20srd.org/srd/skills/handleAnimal.htm), and
[Sleight of Hand](https://www.d20srd.org/srd/skills/sleightOfHand.htm);
equipment penalties follow [Armor](https://www.d20srd.org/srd/equipment/armor.htm).

### Armor and shield nonproficiency

Proficiency is shared between store/equip warnings and the rules calculations.
Core class proficiencies combine across multiclass levels. Barbarians receive
light/medium armor, not heavy; paladins receive ordinary shields, not tower
shields. Fighters receive tower proficiency. Mithral armor is treated as one
category lighter for movement and other limitations, including proficiency.
Dragonlance class proficiency support remains limited to the existing catalog
assumptions (Noble light armor); those source-specific classes are not certified.

Armor Proficiency (Light/Medium/Heavy), Shield Proficiency, and Tower Shield
Proficiency are selectable general feats with their prerequisite chains.
Class-granted proficiencies satisfy prerequisites without spending feat slots
and are not offered as redundant choices. The PHB audit confirmed these feat
prerequisites and corrected Ranger's automatic armor proficiency to light armor;
the PHB grants Rangers shields except tower shields (PHB 47, 89). Mithral's
category reduction for other limitations is from DMG 284.

Equipped nonproficient armor/shields apply their adjusted armor check penalties
to every weapon attack and all Strength/Dexterity skill checks, including Ride,
Use Rope, and trained Open Lock. Initiative, a Dexterity ability check, also
includes these penalties and the +4 bonus from Improved Initiative when selected.
Armor and shield nonproficiency penalties stack with each other, but a skill
already affected by normal armor penalties does not take the same item's penalty
twice. Normal load-vs-armor comparisons and doubled
Swim penalties remain unchanged. Weapon Finesse's separate shield penalty still
applies in addition to shield nonproficiency.

Only actual negative penalties produce a compact **-5 armor (nonprof.)** or
**-2 shield (nonprof.)** label on affected attacks/checks. Tooltips identify the
items. Zero-penalty nonproficient equipment produces no penalty label. Damage,
AC, and saving throws are not reduced by nonproficiency. Selection changes and
level-up drafts recalculate immediately; discarding a draft restores the original.

Druid metal equipment prohibitions are separate from proficiency. Equip warnings
explain their spellcasting/class-ability consequences, including the 24-hour
duration, but enforcement remains manual. Tower shields apply their additional
-2 attack penalty even when proficient. In Equipment, the cover control uses a
standard action to replace the tower shield's AC bonus with total cover, disables
attacks until the start of the next turn, and notes that targeted spells can
still target the shield. The user clears this temporary state manually; changing
or removing the shield clears it automatically.

References: SRD [armor rules](https://www.d20srd.org/srd/equipment/armor.htm),
[proficiency feats](https://www.d20srd.org/srd/feats.htm#armorProficiencyLight),
[Barbarian](https://www.d20srd.org/srd/classes/barbarian.htm),
[Paladin](https://www.d20srd.org/srd/classes/paladin.htm), and
[Druid](https://www.d20srd.org/srd/classes/druid.htm).

### Weapon nonproficiency

Weapon proficiencies from the represented core classes combine across
multiclass levels. Class-specific lists are applied for bard, druid, monk,
rogue, and wizard; other standard class weapon categories use simple/martial
proficiency. Elves have their listed weapon proficiencies regardless of class.
Dwarven and gnome familiarity treats the named exotic weapon as martial, but
does not grant martial proficiency by itself. Attacks with a nonproficient
weapon take -4; damage is unchanged. The penalty appears in both attack
summaries and equip warnings. Custom weapons use their selected proficiency
category.

Weapon Focus grants +1 attack with one selected proficient weapon type. Weapon
Specialization grants +2 damage with one selected proficient weapon type and
requires Fighter 4 and Weapon Focus for that same type. Each feat can be selected
again for a different weapon type. Light/heavy, spiked/unspiked shield bashes are
treated as one weapon type, "Shield Bash."

Exotic Weapon Proficiency applies to one unfamiliar exotic weapon type at a time
and is repeatable for other types. It requires BAB +1 and may be selected as a
fighter bonus feat. Gaining proficiency enables Weapon Focus and Weapon
Specialization choices for that weapon. The War domain grants Weapon Focus with
the deity's favored weapon and proficiency when that weapon is martial, for
supported core mappings. This virtual Weapon Focus does not stack with the feat
and can qualify for Weapon Specialization. Other deity mappings require manual
resolution.
Core SRD prestige-class weapon proficiencies are modeled for Arcane Archer,
Assassin, Duelist, Dwarven Defender, and Shadowdancer. Other Core prestige
classes grant no additional weapon proficiencies. Dragonlance-specific weapon
lists remain unverified.

References: SRD [weapon proficiency](https://www.d20srd.org/srd/combat/combatModifiers.htm#weaponArmorAndShieldProficiency),
[Weapon Focus](https://www.d20srd.org/srd/feats.htm#weaponFocus),
[Weapon Specialization](https://www.d20srd.org/srd/feats.htm#weaponSpecialization),
[Exotic Weapon Proficiency](https://www.d20srd.org/srd/feats.htm#exoticWeaponProficiency),
[weapons](https://www.d20srd.org/srd/equipment/weapons.htm), [Bard](https://www.d20srd.org/srd/classes/bard.htm),
[Druid](https://www.d20srd.org/srd/classes/druid.htm), [Monk](https://www.d20srd.org/srd/classes/monk.htm),
[Rogue](https://www.d20srd.org/srd/classes/rogue.htm), [Wizard](https://www.d20srd.org/srd/classes/sorcererWizard.htm#wizard),
[Elf](https://www.d20srd.org/srd/races.htm#elves),
[Dwarf](https://www.d20srd.org/srd/races.htm#dwarves), and
[Gnome](https://www.d20srd.org/srd/races.htm#gnomes).

Simple Weapon Proficiency grants all simple weapons. Martial Weapon Proficiency
grants one martial weapon type, can be selected again for another type, and
requires BAB +1.

### Tower shields

The tower shield's -2 attack penalty applies to weapon and touch attacks, but
not grapple checks. Using the tower shield for total cover replaces its normal
shield AC bonus and prevents attacks until the start of the next turn. Targeted
spells can still target the shield. Because the builder does not track turn
order, clear the cover toggle manually at the start of the next turn. Tower
shields cannot be used for shield bashes.

Reference: SRD [tower shield](https://www.d20srd.org/srd/equipment/armor.htm#shieldTower).

### Shield bashes

Light and heavy shields can be selected as off-hand bash attacks. Light shield
bashes are light martial bludgeoning weapons; heavy shield bashes are one-handed
martial bludgeoning weapons. Their Medium damage is 1d3 and 1d4 respectively,
with size-appropriate dice for Small and Large shields. Normal two-weapon
penalties and off-hand Strength damage apply. The shield's AC bonus, including
its enhancement bonus, is lost until your next action after a bash. Since the
builder does not track actions, clear the bash toggle manually when the bonus
returns. Shield spikes are available as light/heavy wooden and steel shield
variants for an additional 10 gp and 5 lb. A spiked bash deals piercing damage
as if the shield were designed for a creature one size larger; the shield's
handedness, off-hand penalties, and AC loss remain unchanged. Bucklers and
tower shields cannot be used for shield bashes or equipped with spikes. The
Bashing property increases bash damage by two size categories and makes the
shield a +1 weapon for attack and damage while bashing. A shield's numeric AC
enhancement does not improve its bash attack or damage.

References: SRD [shield bash](https://www.d20srd.org/srd/equipment/armor.htm#shieldBashAttacks)
and [shield spikes](https://www.d20srd.org/srd/equipment/armor.htm#shieldSpikes).

### Animated shields

An Animated shield can be activated as a standard action. While active, it
floats within 2 feet, grants its shield AC bonus, and frees both hands; shield
check penalties, arcane spell failure, and nonproficiency still apply. An
animated shield cannot bash while floating. The Equipment sheet tracks
activation until manually cleared or the shield is changed or removed, and
allows two-handed grips and off-hand weapons while active.

Reference: SRD [animated shield](https://www.d20srd.org/srd/magicItems/magicArmor.htm#shieldSpecialAbilities).

### Blinding shields

A Blinding shield can flash twice per day when commanded. Creatures within 20
feet other than the wielder make a DC 14 Reflex save or are blinded for 1d4
rounds. The Equipment sheet tracks uses per equipped shield and provides a
manual daily reset; resolve affected creatures and saving throws separately.
The SRD does not specify the action type for the command.

Reference: SRD [shield special abilities](https://www.d20srd.org/srd/magicItems/magicArmor.htm#shieldSpecialAbilities).

### Arrow-catching shields

An Arrow Catching shield grants a +1 deflection bonus to AC against ranged
weapons; it does not stack with a higher deflection bonus. Its ranged-weapon AC
is shown in the character and print sheets. Projectile and thrown-weapon attacks
aimed at another creature within 5 feet of the wielder are redirected to the
wielder, except when the wielder has total cover. The builder does not track
party spacing or incoming attacks, so resolve redirection manually.

Reference: SRD [shield special abilities](https://www.d20srd.org/srd/magicItems/magicArmor.htm#shieldSpecialAbilities).

### Forge armor properties

Slick armor grants a +5 competence bonus on Escape Artist checks; its armor
check penalty still applies, and the bonus does not stack with the higher
competence bonus from a Vest of Escape. Escape Artist checks to escape a grapple
use this bonus. Fortification in the Forge is light fortification: it has a 25%
chance to negate the extra damage from a critical hit or sneak attack. Since the
builder does not resolve incoming damage, resolve that percentile roll manually.
Glamered armor appears as ordinary clothing or other garb on command while
retaining its properties and weight.

Reference: SRD [magic armor special abilities](https://www.d20srd.org/srd/magicItems/magicArmor.htm).

### Forge pricing

Forged weapons include the 300 gp masterwork cost unless the selected weapon is
already masterwork, and armor/shields include 150 gp unless already masterwork.
Cold iron weapon enhancements add 2,000 gp; Mithral weapons include masterwork
quality in their material cost. The combined enhancement and special-ability
equivalent bonus cannot exceed +10. Keen is offered only for piercing or slashing
weapons, and Bashing only for light or heavy shields.

References: SRD [magic weapons](https://www.d20srd.org/srd/magicItems/magicWeapons.htm),
[magic armor](https://www.d20srd.org/srd/magicItems/magicArmor.htm), and
[special materials](https://www.d20srd.org/srd/specialMaterials.htm).

### Carried load and movement

Load is derived from Strength, racial size, and carried item quantities using the
SRD [carrying capacity](https://www.d20srd.org/srd/carryingCapacity.htm) table,
including its high-Strength progression and rounding down after size adjustments.
All inventory is treated as carried. Equipped items also count, but are not
counted again when already represented in inventory (including the equivalent
unsuffixed/Medium item name). Body weight is not included. Unknown or variable
item weights produce a visible warning; load calculations use known weights only.

- Medium load: -3 check penalty, maximum +3 Dexterity to AC.
- Heavy load: -6 check penalty, maximum +1 Dexterity to AC.
- Use the worse of the combined armor/shield check penalty or load penalty, never
  their sum. Swim doubles the selected penalty. A compact **-3 load** label appears
  only when load supplies the applied penalty; item/load details remain in tooltips.
- Armor and load Dexterity caps are compared separately from check penalties.
  Negative Dexterity modifiers are never removed. A restriction appears beside
  AC only when it actually reduces the Dexterity contribution.
- Medium/heavy armor or load reduces racial speed from 30 to 20 ft., or 20 to
  15 ft.; the two reductions do not stack. Mithral uses its lighter movement
  category. Dwarves retain 20 ft. under armor and medium/heavy load, but not when
  overloaded. Speed reductions show their cause on both sheets.
- Above heavy capacity, up to twice that capacity, movement is only 5 ft. per
  round as a full-round action and positive Dexterity to AC is lost. Beyond twice
  capacity the character cannot carry that load. These states are explicitly
  labeled rather than silently treated as an ordinary heavy load.

The equipment summary shows actual load instead of a fixed Light label; its
tooltip gives capacity thresholds. Rules are derived, not stored, and update with
inventory, equipment, Strength, or race changes. Existing saves are not rewritten.
The current model has no carried/stowed-container or mount distinction: remove
items from carried inventory when left elsewhere. Currency is free-form text and
is not converted to coin weight. Class/magic/condition speed modifiers, running,
Jump's speed-based modifier, and task restrictions such as Tumble remain outside
this pass; displayed speed is racial speed adjusted for armor and carried load.

Use **Add Note** in the Character Notes section to open the note editor. Adding a
note appends its local entry date in `Oct 25, 2026` format and text without
replacing earlier notes. Entries display the date on the left and note text on the
right, separated by a vertical line; older notes without dates show as "Undated".
Older month/day/year dates use the same display format without rewriting saved notes.
The **Handwritten** switch in the section header toggles Marck Script versus the
standard font without changing note content or layout. Handwritten is the default
whenever the character sheet opens; the display preference is not saved.
Cancel or Escape discards the unsaved note. Use the main
Save button to persist character changes; notes are included in JSON exports.
Notes added during level-up remain provisional and are discarded with that draft.

## Class spell sheets

The **Spells** screen has one subtab per spellcasting class. A Wizard 3 / Cleric 1
has separate **Wizard · 3** and **Cleric · 1** sheets, not a combined fourth-level
casting progression. Noncasting classes do not get spell subtabs. Arrow keys,
Home, and End navigate the class tabs; leveling a caster opens that class's sheet.

Each sheet shows its own casting ability, base caster level, daily slots, and
save DC at each spell level:

- Wizards have separate **Spellbook** and **Daily Preparation** views, confirmed
  spell learning, and preparation counts.
- Clerics and druids prepare from their class lists. Divine 0-level spells are
  labeled orisons. Clerics also have a separate domain section with two domain
  choices, granted powers, and independent domain preparation/usage.
- Bards and sorcerers have spells-known limits and spontaneous daily slot tracking,
  rather than preparation controls.
- Paladins and rangers explain that casting starts at class level 4. Their sheets
  use Wisdom, half class level as base caster level, and their actual first-
  through fourth-level spell access.
- Spell Focus lets you select a different school each time you take the feat;
  its +1 save DC bonus applies to matching school-specific spell DCs. Greater
  Spell Focus requires Spell Focus for that school and adds a stacking +1.
- Spell Penetration adds +2 to the spell-resistance check modifier shown on
  each class sheet; the d20 roll and comparison against a spell's SR are manual.
- Greater Spell Penetration requires Spell Penetration and adds a further +2.
- Heighten Spell lets you choose a higher level for each prepared copy, using
  that level for its save DC and slot. Spontaneous casts, domain spells, and
  other spell-level-dependent effects remain manual.
- Empower Spell requires the ability to cast 3rd-level spells. Mark prepared
  copies to use a slot two levels higher; variable numeric effects must still be
  multiplied by 1.5 manually. Spontaneous casts and domain spells remain manual.
- Maximize Spell requires another metamagic feat. Mark prepared copies to use a
  slot three levels higher; maximize variable numeric effects manually. When
  combined with Empower, the slot cost is five levels higher and the result is
  the maximum plus half the normally rolled result, resolved manually.
- Extend Spell lets you mark prepared copies for a slot one level higher.
  Duration doubling remains manual; concentration, instantaneous, and permanent
  spells are unaffected. Spontaneous casts and domain spells remain manual.
- Enlarge Spell lets you mark prepared copies for a slot one level higher.
  Increase range manually only for distance-defined close-, medium-, and
  long-range spells; spontaneous casts and domain spells remain manual.
- Quicken Spell lets you mark prepared copies for a slot four levels higher.
  Casting-time eligibility, free-action casting, the one-per-round limit, and
  the no-attack-of-opportunity effect remain manual; spontaneous casts and
  domain spells remain manual.
- Silent Spell lets you mark prepared copies for a slot one level higher.
  Verify a verbal component is present and omit it manually; bard spells cannot
  use this feat, and spontaneous casts and domain spells remain manual.
- Still Spell lets you mark prepared copies for a slot one level higher.
  Verify a somatic component is present and omit it manually; bard spells with
  somatic components can benefit, but spontaneous casts remain manual.
- Widen Spell lets you mark prepared copies for a slot three levels higher.
  Verify that the spell has a burst, emanation, line, or spread area and double
  its numeric measurements manually; spontaneous casts remain manual.
- Sculpt Spell requires another metamagic feat and lets you mark prepared
  copies for a slot one level higher. Verify area eligibility and choose
  manually among its cylinder, cone, four cubes, spread, or line shapes. Its
  prerequisite and feat mechanics are verified against *Complete Arcane*,
  p. 83; area eligibility and shape selection remain manual.
- Split Ray requires another metamagic feat; its +2 slot adjustment, extra ray
  attack, target spacing, and spontaneous casting timing remain manual
  (*Complete Arcane*, p. 83).
- Delay Spell, Fortify Spell, and Transdimensional Spell are available from
  *Complete Arcane* (pp. 77, 80, 84); their slot adjustments and effects remain
  manual, including target/area eligibility and spell-resistance checks.
- Explosive Spell is available from *Complete Arcane*, p. 79. Its area/Reflex
  eligibility, forced movement, prone condition, and extra damage remain
  manual.
- Chain Spell and Cooperative Spell (p. 76), and Sanctum Spell (p. 82), require
  another metamagic feat. Their target choices, cooperation, DC/penetration
  bonuses, and sanctum conditions remain manual (*Complete Arcane*).
- Black Lore of Moil requires caster level 7 and Spell Focus (Necromancy).
  Runebone cost and bonus negative-energy damage remain manual
  (*Complete Arcane*, p. 76).
- Born of the Three Thunders requires Knowledge (nature) 4 and Energy
  Substitution (electricity). Damage splitting, saves, and the caster's daze
  remain manual (*Complete Arcane*, p. 76).
- Energy Substitution and Energy Admixture are separate acid, cold, electricity,
  and fire choices; Energy Admixture requires the matching Energy Substitution.
  Their damage and descriptor changes remain manual (*Complete Arcane*, pp. 78–79).
- Nonlethal Substitution requires Knowledge (arcana) 5 and another metamagic
  feat. Record its single chosen energy type manually; damage conversion and
  slot use remain manual (*Complete Arcane*, p. 81).
- Lord of the Uttercold requires Knowledge (the planes) 9 and Energy Substitution
  (cold); the cold-descriptor spellcasting requirement must be verified manually.
  Damage splitting remains manual (*Complete Arcane*, p. 80).
- Arcane Mastery checks for modeled arcane spellcasting or a racial spell-like
  ability; invocation and class-based SLA paths are not modeled, and taking 10
  on caster-level checks remains manual (*Complete Arcane*, p. 73). Remaining
  candidates include Extra Edge (Warmage), Extra Invocation (lesser invocations),
  and Extra Spell Secret (spell-secret class feature). Arcane Defense requires
  Spell Focus in its chosen school and supports separate school selections;
  its +3 save bonus remains manual (*Complete Arcane*, p. 73). Ranged Spell
  Specialization requires Weapon Focus (Ray), and Touch Spell Specialization
  requires Weapon Focus (Touch spell); both require caster level 4, and their
  +2 damage effects remain manual (*Complete Arcane*, p. 83). Craft Contingent
  Spell requires caster level 11; its base price is spell level × caster level
  × 100 gp, with 1/25 XP, half-price materials, and one day per 1,000 gp;
  contingent spell costs and effects remain manual (*Complete Arcane*, p. 78).
  The Draconic feat family and Guardian Spirit are not modeled; heritage
  choices and the Watchful Spirit class ability need support. Other feats and
  supplied sourcebooks still need review.
- Mage Slayer, Pierce Magical Concealment, and Pierce Magical Protection enforce
  their modeled prerequisites. Their Will/attack effects and caster-level
  penalties remain manual (*Complete Arcane*, pp. 81–82).
- Obtain Familiar checks Knowledge (arcana) 4 and arcane caster level 3;
  familiar acquisition, costs, and ongoing management remain manual
  (*Complete Arcane*, p. 81).
- Practiced Spellcaster is offered separately for each modeled spellcasting
  class. Its +4 caster-level bonus is capped by total Hit Dice; it does not
  grant spells per day or spells known (*Complete Arcane*, p. 82).
- Battle Caster extends the Bard's light-armor exception to medium armor for
  Bard spells only. Shields remain subject to spell failure; other class
  abilities that ignore armor spell failure are not modeled
  (*Complete Arcane*, p. 75).
- Reckless Wand Wielder checks Use Magic Device 1 rank and Craft Wand; its
  additional-charge and caster-level effects are applied manually
  (*Complete Arcane*, p. 82).
- Double Wand Wielder requires Craft Wand and Two-Weapon Fighting; activation
  timing and the secondary wand's effects are handled manually
  (*Complete Arcane*, p. 77).
- Wandstrike checks Use Magic Device 4 ranks; its melee touch attack and wand
  spell effects remain manual (*Complete Arcane*, p. 84).
- Innate Spell requires Quicken Spell, Silent Spell, and Still Spell; its
  chosen spell, permanently expended slot, and component/focus costs remain
  manual (*Complete Arcane*, p. 80).
- Extra Slot checks caster level 4 and Extra Spell checks caster level 3.
  Their repeated slot/spell selections and spell-level limits remain manual
  (*Complete Arcane*, pp. 79–80).
- Arcane Preparation checks for Bard or Sorcerer levels; prepared spells and
  metamagic choices remain manual. Other spontaneous arcane classes are not
  modeled (*Complete Arcane*, p. 73).
- Heighten Spell-Like Ability checks modeled racial SLAs for caster level 6;
  class-based SLAs are not modeled. Each selection applies to a different
  ability; its limits, uses, and save DCs remain manual (*Complete Arcane*, p. 80).
- Maximize Spell-Like Ability (*Complete Arcane*, p. 82) checks modeled racial
  SLAs for caster level 6; class-based SLAs are not modeled. Duplicated
  spell-level limits, uses, and distinct ability choices remain manual. Only
  variable numeric effects are maximized; saves and opposed checks are unaffected.
- Communicator, Insightful, Soul of the North, Spell Hand, Necropolis Born,
  and Night Haunt grant their listed 1/day spell-like abilities at caster
  level 1; tracking and use remain manual. For abilities with saves, use DC 10
  + spell level + Charisma modifier (*Complete Arcane*, pp. 76, 80–81, 83).
- Persistent, Repeat, and Twin Spell are available from *Complete Arcane*
  (pp. 81–82, 84); their eligibility, timing, slot adjustments, and separate
  effects remain manual.
- Sudden Empower, Extend, Maximize, Quicken, Silent, Still, and Widen each
  allow one daily use without increasing the spell slot. Sudden Quicken requires
  Quicken Spell and the other listed Sudden feats; use tracking, effect and
  eligibility checks, and spontaneous casting timing remain manual
  (*Complete Arcane*, p. 83).
- Mystic sheets remain available with an explicit unverified-content notice.

Preparation counts allow multiple copies of a spell and enforce capacity
separately at each spell level. The same spell can be prepared independently by
two classes. Prepared casters can expend slots only after completing daily
preparation; completion locks ordinary and cleric domain spell choices until the
next rest/prayer confirmation. Spontaneous casters do not use preparation gates.
Expended slot checkboxes belong only to their class and spell level. **Confirm
rest/prayer and recover spell slots** clears all expended slots, including
cleric domain usage, and unlocks one new preparation period without changing
known or prepared spells. These are explicit user confirmations; the app does not
track rest duration, prayer time, or preparation time. Changing subtabs or screens
does not erase tracking. Preparation and usage are provisional in creation/level-up
drafts and are included in main Save and JSON Export/Import.

Older class-tagged spell lists are respected, including explicitly empty lists.
For legacy flat lists without class identity, an explicit old spell-to-class
tag is used first; otherwise a spell is assigned once to the first applicable
caster in character class order (or the first caster if the catalog cannot match
it). This avoids copying every legacy spell onto every sheet. Ambiguous old
ownership cannot be reconstructed perfectly; review imported multiclass sheets.
Viewing does not rewrite a save, and existing over-limit selections are preserved
with a notice rather than silently removed.

### Cleric domains

The Cleric subtab offers all 22 core SRD domains plus supported Dragonlance
Chapter 3 domains with their nine domain spells at the domain-specific levels.
Choose two different domains; Chaos, Evil, Good, and Law require matching
cleric alignment. Domain-granted class skills (Animal,
Plant, Knowledge, Travel, Trickery) apply automatically to cleric rank costs and
class-skill indicators, not to unrelated classes. They do not grant ranks.
Powers are in compact expandable sections with **Applied automatically** and
**Manual resolution** labels. Turning, limited-use powers, and conditional
caster-level bonuses are documented but not automatically rolled or spent.

Each accessible spell level 1-9 has exactly one domain slot, separate from
ordinary cleric slots and other classes. There are no domain orisons, high-Wisdom
bonus domain slots, or domain slots from wizard levels. Cleric level and Wisdom
gate access. Each slot offers only the corresponding spell from either selected
domain; domain-only spells do not enter the ordinary cleric preparation list.
Selections retain their originating domain so restrictions such as Animal's
animal-only summons or Fire's fire-only Elemental Swarm are visible. Evil Death
domain spells are excluded when the cleric or selected deity is good. Domain
slots cannot be spontaneously converted to cure/inflict spells.

Preparation and expended checkboxes are independent. Changing a prepared spell or
domain does not refresh expended slots. The global daily-rest/prayer confirmation
clears all classes' expended slots and cleric domain usage without changing
preparations. Clerics may change domain preparation until completing daily
preparation; then domain choices and usage are locked until the next confirmation.
The app does not track rest duration or prayer time. Domain data follows
creation/level-up drafts and main Save/JSON Export/Import. Existing saves need no
migration; they can complete daily preparation to enable spell-slot use. Missing
choices or unavailable imported preparations produce warnings;
unavailable preparations remain visible for correction rather than disappearing.
Established domains are locked on a finalized sheet; **Change domains** explicitly
requires confirmation that this is a DM-approved lasting change, not daily
preparation.

Core 3.5 deity-domain associations are recorded for the 12 supported core
deities. Verified Dragonlance domain associations are applied for supported
deities; deity-linked domains are disabled for other Clerics, and Mystic-only
domains are not Cleric choices. Unmapped deity entries still require DM
confirmation. War's favored-weapon effects are automated only for supported
core mappings (Corellon Larethian and Heironeous: longsword; Hextor: flail;
Erythnul: morningstar); other deity mappings remain manual. This pass does not
certify the full deity catalog, enforce every ordinary cleric spell's alignment
descriptor, or enforce druid/other class restrictions on multiclass casting.

Sources: SRD [Cleric](https://www.d20srd.org/srd/classes/cleric.htm) and
[Cleric Domains](https://www.d20srd.org/srd/spellLists/clericDomains.htm);
core deity associations use the *Player's Handbook* (3.5), pp. 106–108, and
the [3.5 deity listings](https://dnd3-5.wikidot.com/deities1). Dragonlance
domain entries and associations use the *Dragonlance Campaign Setting*,
Chapter 3, pp. 102–104; the supported deity alignments, domains, and favored
weapons are cross-checked against the deity profiles on pp. 129–131. The five
domain spells defined in the setting are summarized from Chapter 3, pp. 108–113.

### Wizard spellbook

The wizard opens to **Spellbook**, a list of recorded spells with acquisition
sources and page usage. **Daily Preparation** shows only recorded, catalog-matched
spells at accessible spell levels; it does not silently supply missing cantrips.
Starting cantrips can be added during setup. Free starting spells are first-level
spells equal to 3 + positive Intelligence modifier; subsequent wizard levels add
two free spells total at levels the wizard can cast. These choices have a separate
free-spell selector and do not require copying checks, writing time, or materials.
New draft choices can be removed and revised without removing old level-up spells.
Copied/researched/reward spells never satisfy the free-spell allowance.

**Learn a spell** opens a modal instead of immediately adding a scroll:

- **Scroll / another spellbook:** confirm deciphering via read magic, the author's
  help, previously deciphered writing, or a Spellcraft or Decipher Script total
  against DC 20 + spell level. For arcane scrolls, knowing Magius applies +2
  competence to either check; enter the total before this bonus. This bonus does
  not apply when copying another spellbook. Read magic bypasses deciphering
  checks, not the later learning check.
- Confirm 8 hours of study and enter the actual learning Spellcraft total against
  DC 15 + spell level. No rolls or modifiers are applied automatically to this
  learning check.
- Resolve 24 hours of writing and 100 gp per page of materials with the DM.
  Spells use one page per level, with a minimum of one page for a cantrip.
  Another wizard's usual access fee (50 gp per spell level) is shown separately.
- **Research / DM reward:** explicitly confirm DM approval and adjudication of
  applicable checks, time, and costs. This records catalog spells, not custom spells.

Failed checks cannot add a spell. The dialog explains the next-day restriction on
failed deciphering and the additional-Spellcraft-rank restriction on failed
learning; failed attempts and retry eligibility remain manually tracked with the
DM, not persisted or automatically enforced. Cancel/Escape discards pending
results. Successful learning saves the source, recording date, and deciphering
and learning check totals alongside the character. Copying from a scroll consumes
the source scroll under the rules, but **gold, inventory, and elapsed campaign
time are not changed automatically**. Handle those separately; removing a learned
spell does not refund them.

The spellbook can record higher-level spells without granting preparation access.
Unknown imported names are preserved with a warning. Specialization, prohibited
schools, multiple physical spellbooks, lost-book recovery, and physical 100-page
book limits remain unfinished. Page usage is informational, not a single-book cap.
Source: SRD [arcane spells and spellbooks](https://www.d20srd.org/srd/magicOverview/arcaneSpells.htm).

## Desktop

```bash
npm start
npm run dist:windows
npm run dist:linux
```

Electron must have its installation script permitted by your npm policy. Windows
NSIS and Linux AppImage/Debian targets are retained; platform packaging must be
verified on the relevant build hosts.

## Rules and scope

See the [rules coverage matrix](docs/rules-coverage.md) for a feature-level
snapshot of implemented, partial/manual, and unverified areas.

This is not a certification of all D&D or Dragonlance mechanics. The first combat
correctness pass intentionally corrects inherited calculations:

- Magical weapon enhancement affects both attack and physical damage; masterwork
  attack enhancement does not stack with it.
- Improved Critical doubles the selected proficient weapon's threat range at
  BAB +8; it does not stack with Keen, which only affects piercing and slashing
  weapons.
- Weapon Finesse requires BAB +1 and applies to eligible, appropriately sized
  melee weapon attacks, not damage. Shield check penalties are included when
  choosing Finesse; natural attacks are not represented as weapon-sheet
  selections and remain manual.
- Two-handed melee weapons add 1.5 times a positive Strength modifier; off-hand
  attacks add half. Negative modifiers apply in full.
- Two-weapon penalties distinguish light/non-light off-hand weapons and the feat.
  One-handed non-light off-hand weapons are now permitted by the equipment picker.
- Character size affects attacks. Halflings and gnomes now have their missing
  Small-size metadata, also correcting their size-dependent AC and carrying limits.
- Ranged attacks use Dexterity. Slings/thrown weapons use Strength for damage;
  crossbows do not, and ordinary bows apply only a Strength penalty. Composite
  bows save a selectable Strength rating: below-rating attacks take a flat -2,
  positive Strength damage is capped at the rating, and negative Strength
  penalties remain. Each rating point adds 100 gp for a longbow or 75 gp for a
  shortbow; the inventory price reflects this, but currency remains manual.
- Custom ranged projectile weapons save a damage-ability rule: no Strength,
  full Strength modifier, or negative Strength modifier only. Custom thrown
  weapons retain Strength damage.
- Equipment screens share equipping logic and weapon classification, including
  material/masterwork variants, composite bows, and custom handedness.

Expected-result regression tests cover these cases and agreement between both
character sheets. References: SRD [combat statistics](https://www.d20srd.org/srd/combat/combatStatistics.htm),
[two-weapon fighting](https://www.d20srd.org/srd/combat/specialAttacks.htm#twoWeaponFighting),
[Weapon Finesse](https://www.d20srd.org/srd/feats.htm#weaponFinesse),
[weapons](https://www.d20srd.org/srd/equipment/weapons.htm), and
[magic weapons](https://www.d20srd.org/srd/magicItems/magicWeapons.htm).
Composite-bow ratings follow the SRD [composite longbow](https://www.d20srd.org/srd/equipment/weapons.htm#longbowComposite)
and [composite shortbow](https://www.d20srd.org/srd/equipment/weapons.htm#shortbowComposite) rules.

The class-sheet pass also corrects sorcerer spell access, bard daily/known-spell
progression, sorcerer spells-known counts, and paladin/ranger slot indexing. Daily
slots respect minimum casting ability and cannot gain higher spell levels solely
from ability bonuses. Wizard level-up requires two free spellbook additions
**total**, not two at every accessible spell level; scroll additions are separate.
References: SRD [sorcerers and wizards](https://www.d20srd.org/srd/classes/sorcererWizard.htm),
[bard](https://www.d20srd.org/srd/classes/bard.htm),
[cleric](https://www.d20srd.org/srd/classes/cleric.htm),
[paladin](https://www.d20srd.org/srd/classes/paladin.htm), and
[ranger](https://www.d20srd.org/srd/classes/ranger.htm).

The special-abilities list displays core class features by class level based on
the [SRD class tables](https://www.d20srd.org/srd/classes/). Monk Fast Movement
is listed at 2nd level; its first +10-foot speed increase begins at 3rd level.
Monk AC bonuses, Fast Movement, flurry attacks, and size- and level-based
unarmed damage use Monk class levels and their armor, shield, and load limits.
Monk AC applies to touch and flat-footed AC and is suppressed for HP-tracked
unconsciousness; other immobilizing conditions are not tracked. Unarmed strikes default to nonlethal damage; choosing lethal
damage, its attack penalty for non-monks, and other conditional class features
remain manual. Monk bonus-feat and alignment eligibility are modeled; optional
Dragonlance class progression is not verified.

Rogue sneak-attack progression appears as potential precision damage on weapon
attacks, separate from base damage. Concealment and ranged attacks beyond 30 ft.
suppress it; flanking, denied Dexterity, target immunity, other class sources of sneak attack,
and other conditions remain manual. Evasion descriptions show their armor and helplessness limits,
but save outcomes and damage are adjudicated manually. Uncanny Dodge retains
Dexterity while flat-footed and is suppressed for HP-tracked unconsciousness;
other immobilization is not tracked. Improved Uncanny Dodge's flanking defense
and rogue-level exception remain manual.

Core race data now records base size and speed, racial skill bonuses, and
race-appropriate bonus-language options. The Halfling's unconditional +1
racial bonus to all saves is calculated. Situational racial save bonuses are
applied when their context is selected in the Saving Throws panel. Dwarf and
Gnome target-specific attack and dodge AC bonuses, plus the Halfling thrown
weapon/slings attack bonus use the selected target types and weapon mode. Small
creatures receive their size-based Hide bonus, and Gnome illusion spells include
the +1 racial save DC adjustment. Gnome spell-like abilities show their names,
daily uses, caster level, Charisma requirement, and applicable save DC; tracking
when those daily uses are spent remains manual. The Elf's ability to make a
Search check when passing within 5 feet of a secret or concealed door is shown
as a reminder; rolling and adjudicating the check remain manual. The Dwarf
Stability control previews its +4 bonus only for a bull rush or trip check when
the character is confirmed firmly grounded; the check itself remains manual.
Elf and Half-Elf sleep immunity and low-light vision are described on the sheet,
but incoming sleep effects and lighting/vision ranges are not automatically
resolved. Optional Dragonlance race data is not verified. See the SRD
[Dwarf](https://www.d20srd.org/srd/races.htm#dwarves),
[Elf and Half-Elf](https://www.d20srd.org/srd/races.htm#elves),
[low-light vision](https://www.d20srd.org/srd/specialAbilities.htm#lowLightVision),
[Elf Search](https://www.d20srd.org/srd/skills/search.htm#special),
[Gnome](https://www.d20srd.org/srd/races.htm#gnomes), and
[Halfling](https://www.d20srd.org/srd/races.htm#halflings) rules.

Remaining gaps include complete racial-feature automation and full bonus stacking.
Handedness `Ranged` and placement in the ranged slot select Dexterity attacks.
Ammunition consumption, custom ammunition, non-material damage-reduction
qualifiers, and adamantine armor/object-hardness effects are not automated.
Spellcasting still
needs additional domain-power automation and broader deity mapping, wizard
specialization/prohibited schools, Bard and Sorcerer known-spell replacement,
prestige-class casting advancement, and feat/item caster-level/DC/slot
adjustments. Slot expenditure is manual rather than automatically linked to
casting a specific prepared spell.
Dragonlance High Sorcery Moon Magic can be entered manually on the spell page.
Selected phases and conjunctions adjust caster level and save DC only for the
character's Dragonlance High Sorcery wizard or sorcerer spells; other
Dragonlance mechanics remain unverified.
Dragonlance Mystics can choose one Core or Chapter 3 domain except Magic,
subject to the Chaos/Evil/Good/Law alignment restrictions but not deity
restrictions. Its spell is automatically known at each accessible spell level
and is included in the known spell count; it uses no separate domain slot.
Domain powers remain manual; the Chapter 3 Mystic power text is shown for the
Dragonlance domains that define a separate power.
During level-up at 4th Mystic level and every even level thereafter, one
individually selected known spell can be exchanged for another of the same
level, at least two levels below the highest spell level available. Automatic
domain spells cannot be exchanged.
Five Chapter 3 domain spells now have sourced details from the setting book.
Random Action is also available as a Dragonlance domain-only spell: the
setting's 3.5 Passion domain list includes it, while its mechanics are drawn
from the Player's Handbook (3.0), p. 242. It is not added to Core class spell
lists or treated as a conversion of the 3.5 SRD's
[Lesser Confusion](https://www.d20srd.org/srd/spells/confusionLesser.htm).
The Chapter 3 spell audit found that all 13 Dragonlance domain lists are
represented, including Pestilence's restricted 2nd-level Summon Monster II.
All 26 spells in the book's New Spells section are now cataloged with class
access and class-specific levels where needed. Mystics inherit the new cleric
spells, Hardening and Unbinding are available on their listed class and domain
lists, and Magius's Light of Truth is restricted to White Robe Wizards.
Source-verified racial corrections so far cover Kagonesti, Qualinesti, and
Silvanesti elves; Dargonesti and Dimernesti sea elves (*Dragonlance Campaign
Setting*, pp. 16–18 and 24–25); Irda; minotaurs (pp. 39 and 43); and
Dragonlance half-elf elvensight. Sea-elf alternate forms and surface
sensitivity remain descriptive traits rather than automated effects; the
broader race catalog remains under audit.
The character model now supports source-gated racial Hit Dice for BAB, saves,
skill budgets and ranks, feat thresholds, ability-score increases, Hit-Dice-based
Constitution adjustments, and ECL display. Hit points remain manually entered;
include racial Hit Dice in the total. Baaz and Kapak Draconians use this model;
their racial Hit Dice must be included in the entered HP total.

### Core rules task in progress: sourcebook correctness

- [ ] Continue the one-book-at-a-time review of feats, spells, base classes,
  and prestige classes across the supplied collection, starting from the
  [recovery checkpoint](#sourcebook-review-progress). Correct discrepancies
  and add focused regression tests; catalog completeness alone does not
  verify the rules. Update the checkpoint after each book and before pausing.

### Dragonlance source-audit TODO

- [x] Check prestige-class progressions and prerequisites; review selected
  feature descriptions against the setting.
- [x] Correct selected source-specific race data, including Baaz, Kapak, Dark
  Dwarf, and Gully Dwarf mechanics.
- [x] Correct the Mystic skill-point rate and enforce Noble's 1st-level entry
  restriction in level-up.
- [x] Mark Paladine and Takhisis as former deities with no cleric domains in
  the setting's post-War of Souls state.
- [x] Audit remaining represented Dragonlance base-class rules against the
  setting; apply the Bard Healing-subschool restriction and alignment-matched
  Druid patron requirement, and document the rules that remain manual.
  Dragonlance Bards cannot cast Conjuration (Healing) spells (p. 45). Druids
  must follow Habbakuk for good, Chislev for neutral, or Zeboim for evil
  alignment (p. 46); spellcasting is gated until the patron is correct.
  Paladins are normally unavailable unless the DM permits a rare champion
  (p. 52), and Wizards must take the Test of High Sorcery and join an order to
  advance beyond Wizard 4 unless they become renegades (p. 53); the app shows
  guidance rather than enforcing those DM/roleplay paths. The spellcasting
  summary reminds Dragonlance Clerics that a Medallion of Faith is required to
  cast spells above 3rd level, and forcibly removing one deals 2d4 divine damage
  with no save or spell resistance (p. 46). The spellcasting summary tracks
  whether a Medallion is marked present and warns when the Cleric has castable
  spell levels above 3rd without one; forced-removal damage remains manual.
- [x] Complete Noble class-feature display with the sourcebook's Favor, Inspire
  Confidence, Inspire Greatness, and Coordinate level progression (pp. 50–51).
- [x] Enforce Dragonlance Ranger patron rules: by 4th level choose Habbakuk,
  Chislev, or Zeboim to match moral alignment before casting divine spells
  (p. 52).
- [x] Track and display Ranger favored-enemy choices and bonuses at levels 1, 5,
  10, 15, and 20, including Dragonlance organizations; bonuses are not applied
  automatically (p. 52).
- [x] Cross-check the domain lists for currently supported Dragonlance deities.
- [x] Cross-check Chapter 3's 13 Dragonlance domain spell lists and the
  Pestilence Summon Monster II restriction (pp. 102–105).
- [x] Add all 26 Chapter 3 New Spells with class-specific levels and class-list
  access; preserve Mystic access to the book's additional cleric/mystic spells
  (pp. 48, 104–113).
- [x] Restrict Magius's Light of Truth to powerful Wizards of the White Robes,
  as specified in Chapter 3 (pp. 104, 108–109).
- [x] Add omitted deities from the setting, including Chislev, Shinare,
  Solinari, and Lunitari, then verify their player-facing details and domain
  data (pp. 119–130).
- [x] Verify Honor-bound's description against the source.
- [x] Add and verify all 13 *Dragonlance Campaign Setting* feats (pp. 85–88),
  including the Resist Dragonfear prerequisite for Dragon Rider. The builder
  enforces modeled race, base attack, base save, skill, and feat prerequisites.
  Hulking Brute is restricted to 1st-level feat slots. Confirm dragon
  encounters/damage manually. Flyby Breath and Strafing Breath enforce Flyby
  Attack, Flyby Breath, and Draconian Breath Weapon when applicable; fly speed
  and non-draconian breath weapon sources remain manual. Level-based feat slots
  only count prerequisite feats from the same or earlier character levels.
  Within a character level, only earlier displayed feat slots count toward
  prerequisites. Fighter, Ranger, and Monk bonus-feat slots are ordered by
  character level when level-up history is available; older saves without
  complete per-level history may not establish that chronology. Historical
  ability prerequisites account for recorded level-up increases; older history
  without those choices cannot reconstruct them. Skill prerequisites use recorded
  per-level rank snapshots when available; older saves without them may not
  establish historical ranks. Base-attack prerequisites use per-level BAB
  snapshots when available; older saves without them may not establish historical
  BAB. Class-level, base-save, caster-level, and arcane spell-level prerequisites
  use recorded per-level class advancement when available; older saves without
  that history may not establish those checks.
  The history respects multiclass order, prestige spellcasting advancement, and
  racial Hit Dice offsets; missing level records cannot reconstruct those details.
  Class-feature prerequisites use recorded per-level class advancement when
  available; older saves without that history cannot establish when a feature
  was gained.
- [x] Add the setting's listed living, regional, monster, and dead languages;
  correct the Qualinesti and Silvanesti automatic/bonus language lists.
- [x] Add a regional-language choice for Dragonlance humans and setting-specific
  bonus-language lists for reused Dwarf and Gnome entries.
- [x] Apply Magius's +2 competence bonus to Spellcraft and Decipher Script checks
  for arcane scrolls; grant secret Druidic automatically to Druids and keep it
  unavailable as a bonus-language choice for others.
- [x] Model each full Speak Language rank as a separate language choice, without
  conflating those choices with automatic, regional, or Intelligence bonus
  languages; keep Magius unavailable because it has no spoken form.
- [ ] Review remaining Chapter 1 race coverage before adding Dragonlance
  choices: Centaur, Ogre, and Half-Ogre have no source-backed selectable race
  records; verify the setting-specific human, gnome, and half-elf variations
  against their existing core race definitions and surface unsupported options
  clearly to players.
- [ ] Audit Chapter 3 moon-dependent High Sorcery, primal sorcery, and Holy
  Order rules against the source. Storing moon phases and conjunctions does not
  implement the tests or conditional casting effects; document any remaining
  manual outcomes in the player-facing UI.
- [ ] As the audit finds manual rules, restrictions, or unsupported behavior,
  add clear player-facing guidance in the relevant UI or documentation, and
  include regression tests for source-backed mechanical corrections.

See [the design notes](docs/3.0-design.md) for retained goals and unfinished work.
