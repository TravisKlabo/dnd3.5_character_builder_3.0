# Player-Option Collection Audit

**Status:** In progress; collection census and initial catalog duplicate scan complete; sourcebook option and mechanics audits underway.
**Census date:** 2026-11-14

**Latest rules batch: PHB Improved Counterspell, Leadership, Natural Spell,
Track, and Toughness (2026-11-18).** Checked the five feats against the
supplied PHB (pp. 95, 97-98, 101). Clarified that Natural Spell uses material
components and focuses the character possesses, even when melded, and that
Toughness can be selected multiple times for stacking +3 HP gains. The other
prerequisites and benefits match. Counterspells, Leadership decisions and
tables, tracking checks/movement, and casting while transformed remain manual.
Eight focused rules, eligibility, and HP tests passed; lint, build, and
`git diff --check` passed at **516,032 / 516,032 bytes**.

**Previous rules batch: PHB Craft Wondrous Item, Forge Ring, Scribe Scroll,
Eschew Materials, and Extra Turning (2026-11-18).** Checked the five feats
against the supplied PHB (pp. 92, 94, 99). Corrected Scribe Scroll's
description to allow any spell the creator knows, rather than implying it
must be currently castable. The other caster-level thresholds, item/spell
limits, Eschew Materials' 1 gp limit, and Extra Turning's repeatable +4 uses
per turning/rebuking ability match. Detailed item creation and use tracking
remain manual. Focused rules and eligibility tests passed.

**Previous rules batch: PHB item-creation feats—Brew Potion, Craft Magic Arms
and Armor, Craft Rod, Craft Staff, and Craft Wand (2026-11-18).** Checked the
five entries against the supplied PHB (pp. 89, 92). The catalog's
caster-level thresholds and summarized spell/item categories match; potions
require a qualifying creature-targeting spell, and new staffs and wands have
50 charges. Item-specific prerequisites, masterwork bases, creation time,
XP/material costs, and charge management remain manual. No code change was
needed; the existing item-creation prerequisite test passed.

**Previous rules batch: PHB Power Attack, Cleave, Great Cleave, Quick Draw,
and Run (2026-11-18).** Checked the five feats against the supplied PHB
(pp. 92, 94, 98-99). Corrected Power Attack's damage calculation so unarmed
strikes receive the normal bonus despite being light; two-handed and
double-weapon damage handling already matches. Prerequisites, fighter bonus
eligibility, Cleave's once-per-round limit, Great Cleave's unlimited
qualifying follow-ups, Quick Draw's benefits, and Run's armor/load movement
conditions match. Natural-weapon attacks and execution of combat triggers
remain manual. Focused combat, prerequisite, and feat-description tests passed
(7 tests); lint, build, and `git diff --check` passed at **516,032 / 516,032
bytes**.

**Previous rules batch: PHB unarmed and arrow-defense feats (2026-11-18).**
Checked Deflect Arrows (p. 93), Improved Grapple (p. 95), Improved Unarmed
Strike (p. 96), Snatch Arrows (p. 100), and Stunning Fist (p. 101) against the
supplied PHB. Prerequisites, benefits, fighter/monk bonus-feat exceptions,
grapple bonus, and Stunning Fist's use/DC rules match. Corrected the Improved
Grapple test fixture so the selected feat has its prerequisites. Arrow
deflection/catching and Stunning Fist use tracking remain manual. Twelve
focused tests passed; lint, build, and `git diff --check` passed. The initial
JavaScript is **516,031 / 516,032 bytes**.

**Previous rules batch: PHB defensive and survival feats (2026-11-18).**
Checked Blind-Fight (p. 89), Combat Casting and Combat Reflexes (p. 92), and
Diehard and Endurance (p. 93) against the supplied PHB. Corrected the Combat
Reflexes description to state the one-attack-per-opportunity limit and that it
does not grant a rogue additional uses of Opportunist. The catalog's other
benefits, prerequisites, and class-grant timing match. Concealment, visibility,
environmental Endurance checks, and Diehard decisions/damage remain manual.
Focused Combat Reflexes, Combat Casting, Ranger Endurance, and feat-description
tests passed; lint, build, and `git diff --check` passed.

**Previous rules batch: PHB weapon proficiency and attack feats (2026-11-18).**
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

**Previous rules batch: PHB spell DC and spell-resistance feats (2026-11-18).**
Checked Spell Focus, Greater Spell Focus, Spell Penetration, Greater Spell
Penetration, and Augment Summoning against the supplied PHB (pp. 89, 94, 100).
The DC bonuses, distinct-school repeat choices, prerequisites, and +2 caster
level check bonuses match. Fixed duplicate-school warnings to follow
chronological feat selection. Augment Summoning's +4 enhancement bonuses to
summoned creatures' Strength and Constitution, and actual spell-resistance
comparisons, remain manual. Seven focused tests and lint passed; the build
passed at **516,031 / 516,032 bytes** after a 32-byte budget increase for the
warning correction.

**Previous rules batch: PHB armor and shield proficiency (2026-11-18).**
Checked Armor Proficiency (Light, Medium, and Heavy), Shield Proficiency, and
Tower Shield Proficiency against the PHB (pp. 47, 89) and mithral category
rules against DMG 284. Corrected Ranger's automatic armor proficiency and
applied mithral's lighter category to proficiency. Fifteen focused tests,
lint, and the production build passed.

**Previous rules batch: PHB skill-bonus feats.** Checked Investigator and
Magical Aptitude (p. 97), Negotiator (p. 98), Self-Sufficient (p. 100), and
Stealthy (p. 101) against the supplied PHB. Each grants +2 on checks with its
two listed skills, matching the catalog and skill calculations. Seventeen
focused skill, catalog, and availability tests passed; no code change was
needed.

**Previous rules batch: PHB skill-bonus feats.** Checked Animal Affinity
(p. 89), Deft Hands and Diligent (p. 93), and Nimble Fingers and Persuasive
(p. 98) against the supplied PHB. Each grants +2 on checks with its two listed
skills, matching the catalog and skill calculations. Seventeen focused skill,
catalog, and availability tests passed; no code change was needed.

**Previous rules batch: PHB skill-bonus feats.** Checked Acrobatic, Agile,
Alertness, and Athletic (p. 89), plus Deceitful (p. 93), against the supplied
PHB. Each grants +2 on checks with its two listed skills, matching the catalog
and skill calculations. Seventeen focused skill, catalog, and availability
tests passed; no code change was needed. Alertness from a familiar within
arm's reach is described, but familiar presence and proximity remain manual.

**Previous rules batch: PHB save, initiative, and skill feats.** Checked Great
Fortitude (p. 94), Iron Will and Lightning Reflexes (p. 97), Improved
Initiative (p. 96), and Skill Focus (p. 100) against the supplied PHB. The
three save feats grant +2 to their respective saves; Improved Initiative
grants +4; Skill Focus grants +3 for one skill and can be selected again for a
different skill without stacking on the same skill. Catalog, calculations,
and selection behavior match. Thirteen focused rules, skill, and selection
tests passed; no code change was needed.

**Previous rules batch: PHB remaining spell feats.** Checked Quicken, Silent,
Still, and Widen Spell plus Spell Mastery against the supplied PHB (pp. 98-102).
Their component rules, area-shape limits, slot adjustments, and Spell Mastery
eligibility and choice count match. *Complete Arcane* (p. 86) updates Quicken
from the PHB's free action to a swift action. Six focused metamagic and Spell
Mastery tests and the rules test file passed. The Widen prepared-copy test
passed its slot checks but then failed on a separate Persistent Spell note
expectation; four other failures in the broader run concerned proficiency and
Spell Focus behavior. Component removal, Widen's area changes, and actual
swift-action/casting-time resolution remain manual.

**Previous rules batch: PHB metamagic feats.** Checked Empower, Enlarge, Extend,
Heighten, and Maximize Spell against the supplied PHB (pp. 93-97). Slot
adjustments, eligible ranges and durations, variable-effect limits, and
Heighten's effective spell level and save DC match the source. Thirteen
focused spell and PHB catalog tests passed. Numeric effects, Enlarge/Extend
application, and spontaneous-caster metamagic remain manual.

**Previous rules batch: PHB weapon-focus feats.** Checked Weapon Focus, Weapon
Specialization, Greater Weapon Focus, Greater Weapon Specialization, and
Improved Critical against the supplied PHB (pp. 95, 102). Prerequisites,
weapon-choice matching, stacking bonuses, and Improved Critical's interaction
with Keen match the source. Thirteen focused combat, prerequisite, and
proficiency tests passed; critical confirmation and damage remain manual.

**Previous rules batch: PHB melee movement and defense feats.** Checked Combat
Expertise (p. 92), Dodge (p. 93), Mobility (p. 98), Spring Attack (p. 100),
and Whirlwind Attack (p. 102) against the supplied PHB. Their prerequisites
and benefits match the source, including Spring Attack's 5-foot movement on
both sides of the attack. Ten focused combat and rules tests passed; movement
and multi-target resolution remain manual.

**Previous rules batch: PHB two-weapon feats.** Checked Two-Weapon Fighting,
Two-Weapon Defense, Improved and Greater Two-Weapon Fighting, and Improved
Shield Bash against the supplied PHB (pp. 95-96, 102). The prerequisites,
off-hand attack penalties, shield-bonus behavior, and Ranger style exceptions
match the source. Corrected a combat regression fixture: Greater Two-Weapon
Fighting requires Dex 19 outside the Ranger style exception. Focused
two-weapon combat tests passed.

**Previous rules batch: PHB mounted-combat feats.** Checked Mounted Archery and
Mounted Combat (p. 98), Ride-By Attack (p. 99), Spirited Charge (p. 100), and
Trample (p. 101) against the supplied PHB. Their prerequisites, fighter bonus
eligibility, and described benefits agree with the source. No code change was
needed; mounted checks, movement, attacks of opportunity, charge damage, and
overrun resolution remain manual.

**Previous rules batch: PHB ranged-combat feats.** Audited Far Shot, Precise
Shot, Rapid Shot, Manyshot, Improved Precise Shot, and Shot on the Run against
the supplied PHB. Rapid Shot was granting one extra attack for each ranged
weapon slot during a two-weapon full attack; it now adds the single extra
attack once across the main/off-hand pair. Shot on the Run movement timing
remains a manual combat procedure. The focused regression test and lint passed;
the build passed at **515,984 / 516,000 bytes** of initial JavaScript.

**Previous rules batch: PHB combat-maneuver feats.** Checked Improved Bull Rush,
Improved Disarm, Improved Feint, Improved Overrun, Improved Sunder, and
Improved Trip against the supplied PHB feat entries (pp. 95-96) and combat
procedures. Five entries agree with their detailed benefits. Improved Overrun
has a source conflict: Table 5-1 lists no attack of opportunity, while its
detailed entry omits that benefit and the overrun rules say the defender gets
an attack of opportunity. The feat description now flags the conflict for DM
adjudication rather than choosing a ruling. Maneuver resolution remains
manual. The rules suite passed **295 tests**, lint passed, and the production
build passed at **515,829 / 515,835 bytes** of initial JavaScript.

**Previous rules batch: PHB feat prerequisite loss.** A selected feat no longer
provides its benefits when its prerequisites are lost. Unusable feats and
feats depending on them are excluded from active mechanics, while saved
selections remain intact and receive a non-blocking warning. Monk and Ranger
bonus-feat exceptions remain in force. The rules suite passed **295 tests**,
the focused UI tests passed **3 tests**, lint passed, and the production build
passed at **515,829 / 515,835 bytes** of initial JavaScript. This is a focused
correction, not a full PHB feat audit.

**Previous rules batch: PHB class-granted feat timing (p. 87).** Prerequisites
may be gained at the same character level as a feat, but not later than the
feat's level. Historical prerequisite context now reconstructs class levels at
the feat's character level. The regression verifies that Ranger Endurance,
gained at Ranger 3, permits Diehard at character level 3 but not in an earlier
slot. The rules and class suites passed **350 tests**, lint passed, and the
production build passed at **515,283 / 515,835 bytes** of initial JavaScript.
This is not a full PHB feat audit.

**Previous rules batch (2026-11-18): PHB class feat grants.** Checked Human
(p. 14), Fighter (p. 38), Monk (p. 41), Ranger (pp. 48–49), and Wizard
(p. 57) against the supplied PHB. The modeled Human 1st-level feat, Fighter
1st/even-level feats, Monk 1st/2nd/6th-level choices and prerequisite
exceptions, Ranger 2nd/6th/11th-level style progression, and Wizard Scribe
Scroll/5th/10th/15th/20th-level grants match the source. No code change was
needed. This is a focused audit, not a full PHB review. Its prerequisite-loss
follow-up is recorded above.

**Previous rules batch (2026-11-18): PHB feat acquisition, p. 88.** The text
allows gaining a feat at the same character level as its prerequisite. Updated
feat prerequisite evaluation so a feat in another slot at that level can
qualify, including normalization when the prerequisite slot is evaluated
later. Later-level feats still cannot qualify earlier slots. The rules suite
passed **291 tests**, lint passed, and initial JavaScript was **515,273 /
515,835 bytes**. This is not a full PHB feat audit.

**Historical recovery checkpoint (2026-11-16):** The last recalled active book
at that time was Monster Manual II. The newer PHB checkpoint above supersedes
it. Use the [README progress tracker](../README.md#sourcebook-review-progress)
as the authoritative resume point. The first-pass inventories below, including
those for later books, do not certify completed full-book rules reviews.

**Latest batch (2026-11-17):** PHB catalog minimum-level-9 spells, **31 titles /
31 records**, checked and corrected; see the
[ninth-level checkpoint](#phb-catalog-minimum-level-9-spell-checkpoint-2026-11-17).

**Previous batch (2026-11-17):** PHB catalog minimum-level-8 spells, **46 titles /
49 records**, checked and corrected; see the
[eighth-level checkpoint](#phb-catalog-minimum-level-8-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-9 spells, is now completed below.

**Previous batch (2026-11-17):** PHB catalog minimum-level-7 spells, **49 titles /
55 records**, checked and corrected; see the
[seventh-level checkpoint](#phb-catalog-minimum-level-7-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-8 spells, is now completed below.

**Previous batch (2026-11-17):** PHB catalog minimum-level-6 spells, **64 titles /
76 records**, checked and corrected; see the
[sixth-level checkpoint](#phb-catalog-minimum-level-6-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-7 spells, is now completed below.

**Previous batch (2026-11-17):** PHB catalog minimum-level-5 spells, **64 titles /
74 records**, checked and corrected; see the
[fifth-level checkpoint](#phb-catalog-minimum-level-5-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-6 spells, is now completed below.

**Previous batch (2026-11-17):** PHB catalog minimum-level-4 spells, **68 titles /
87 records**, checked and corrected, including four domain-only titles; see the
[fourth-level checkpoint](#phb-catalog-minimum-level-4-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-5 spells, is now completed below.

**Previous batch (2026-11-17):** PHB minimum-level-3 spells, **79 titles / 101
class-level records**, checked and corrected; see the
[third-level checkpoint](#phb-minimum-level-3-spell-checkpoint-2026-11-17).
Its historical next target, minimum-level-4 spells, is now completed below.

**Previous spell batch:** remaining PHB minimum-level-2 spells, **88 titles / 110
class-level records**, checked and corrected; see the
[spell checkpoint](#phb-minimum-level-2-spell-checkpoint).
Its historical next target, minimum-level-3 spells, is now completed below.

**Earlier class batch (2026-11-16):** PHB class chassis/represented milestones and all
13 represented DMG prestige prerequisite sets reviewed and corrected; see the
[class checkpoint](#phbdmg-class-review-checkpoint-2026-11-16). Full unit
validation passed (1,602 tests), plus lint, type checks and production build.
The preceding MMII-MMV definition reviews remain recorded below. Varag is
explicitly deferred by user decision; Wizard bonus-feat selection is now fixed.
The README identifies the next exact audit target.

## Scope and rules

Review the 17 PDFs in the user's D&D rulebook collection for options that can
be selected for a player character: feats, spells, base and prestige classes,
class variants or alternate class features, and races or subraces. Record
monster-derived options only when the book provides a player-character path or
the option can be built with the applicable 3.5 rules. Track source page,
prerequisites, level adjustment or racial Hit Dice, setting restrictions, and
any DM-dependent eligibility.

The PHB/DMG certification gate is stricter than a name-only inventory: every
selectable feat, spell, base class, prestige class, player race, and
equipment/magic item must be represented in the app and in printable output,
with explicit manual-effect boundaries. A selected option may remain manual
without blocking certification if its choice and printable representation
remain complete.
Generated items satisfy this gate without a duplicate fixed store entry when
Forge or wand/scroll/potion tooling can configure, persist, and print them.

### PHB certification checkpoint: equipment

Chapter 7's weapon and armor tables now have selectable entries with exact
core metadata. The pass added missing simple, martial, and exotic weapons;
corrected Splint Mail's armor-check penalty to -7; added Banded Mail, armor
spikes, locked gauntlet, shield spikes, and the remaining ordinary goods,
tools, clothing, food, mounts, and transport entries. Fixed PHB goods/services
with variable prices or services remain economic transactions rather than
inventory objects. Selected equipment remains persisted and is rendered by the
printable inventory and attack/protection sections. Focused catalog and print
tests cover the additions. Medium- and large-creature barding are generated
from every base armor with the PHB cost/weight multipliers.

The PHB definition-pass certification gate is now met: seven selectable core
races, eleven base classes, 109 feats, 605 spell titles / 715 PHB spell
records, and Chapter 7 fixed or generated equipment options are represented.
Persisted race/class choices, feats, spells, and inventory render on the
printable sheets. Generated magic items require configuration, persistence,
and printable output rather than duplicate fixed store records. Services and
coin-denomination rows remain represented as campaign transactions/currency,
not character inventory objects. The certification covers source definition
and representation; situational combat adjudication remains manual.

### DMG certification checkpoint: fixed magic items

All 36 entries in Table 7-19 (rods) and all 21 entries in Table 7-25 (staffs)
are represented as selectable fixed items. The source table corrected three
existing prices: Rod of Metamagic, Maximize is 54,000 gp, Staff of Fire is
17,750 gp, and Staff of Healing is 27,750 gp. Potions and oils, scrolls, and
wands remain covered by the configurable generated-item tooling rather than
duplicate fixed entries.
All 46 Table 7-18 ring entries are now represented. Air, Earth, Fire, and Water
elemental-command rings are distinct selections; energy-resistance rings stay
as one configurable table entry per minor/major/greater tier rather than
duplicating a record for each energy type.
All 12 specific armors, eight specific shields, and 34 specific weapons from
Tables 7-7, 7-8, and 7-16 are represented as fixed selectable items. Arbitrary
enhancement/property combinations remain Forge-generated, avoiding duplicate
store records.

Tables 7-27 through 7-29's 300 wondrous-item entries are covered by the
existing exact slot rosters, slotless roster, generated ability-score item
families, inherent-bonus books, or aliases for renamed DMG/SRD items. The fixed
gaps added in this pass were Quiver of Ehlonna, Hand of Glory, Talisman of the
Sphere, Bracelet of Friends, Carpet of Flying (6 by 9), and Wings of Flying.
Exact table-name aliases now point to the represented Efficient Quiver and
Manual of Golems entries without duplicating records.

Generated DMG items now satisfy the persistence/print gate: Forge output and
configured scrolls, wands, and potions remain in character inventory and
render on the printable sheet. Potion generation is limited to spell level 3
or lower, matching Brew Potion; the spell must target one or more creatures
and otherwise be potion-valid, which remains an explicit manual check. Spell
item parsing recognizes Potion as well as Wand and Scroll names so generated
entries retain their spell metadata.

Forge now contains every special ability named by the DMG armor, shield,
melee-weapon, and ranged-weapon tables, including flat-cost properties and
weapon compatibility restrictions. The app enforces the effective +10
equivalent-bonus ceiling and prints the forged selection; property effects
themselves remain resolved from their source text during play.

All 29 entries in Table 7-31's specific cursed-item table are selectable with
their DMG prices (or an explicit no-market-price marker), curse descriptions,
and printable inventory details. The named minor and major artifacts are also
selectable campaign items with explicit no-market-price and manual-effect
boundaries. Artifacts are not treated as ordinary purchasable rewards.

The DMG prestige/epic gate is complete for representation and print: all 16
DMG prestige classes are level-up enabled with source attribution, and all 13
DMG epic feats are represented with level-21 and feat-specific prerequisites.
A printable-sheet regression now verifies prestige class level and epic feat
names, including Archmage history validation.

The DMG spell/race gate now treats *Corrupt Weapon* as the only DMG-only
spell definition; it is Blackguard-only and supported through normal
preparation and print. The two direct race examples—Gold Dwarf and Half-Human
Elf—are selectable with DMG attribution. The 33 “Monsters as Races” entries
remain cross-referenced to Monster Manual racial definitions, not duplicated
as DMG races; their PC suitability also remains DM-dependent.

The DMG definition-pass gate is complete under the strict PHB/DMG criteria:
all selectable feats, spells, classes, direct races, and fixed/generated items
are represented and printable, with campaign-specific adjudication explicitly
manual where automation is not part of character creation.

The supplied books are authoritative for this audit. Dragonlance options remain
specific to a Dragonlance character. This is an inventory and gap analysis, not
a claim that the collection is already implemented or that every option is
automatically available in every campaign.

## Collection census

The folder contains 17 distinct PDF files; SHA-256 comparison found no
byte-identical duplicate files. PDF bookmarks were used to identify likely
option sections. The section list below is an initial navigation aid, not a
completed page-by-page inventory. Dungeon Master's Guide II has no PDF
bookmarks; its contents were mapped manually for the first-pass inventory.

| Book | PDF pages | Candidate option areas indicated by contents/bookmarks |
|---|---:|---|
| Player's Handbook | 322 | Core classes, races, feats, spells |
| Dungeon Master's Guide v3.5 | 324 | Races, prestige classes, epic feats, familiar and mount options, epic-character rules |
| Player's Handbook II | 224 | Four new base classes, expanded-class options, feats, spells; no dedicated race chapter listed in the contents |
| Complete Adventurer | 207 | Classes, prestige classes, expanded skills, animal tricks, feats, spells |
| Complete Arcane | 207 | Classes, prestige classes, feats, spells, invocations, and arcane creature/template options to screen |
| Complete Champion | 162 | Alternate class features, feats, prestige classes, spells |
| Complete Divine | 208 | Classes, prestige classes, feats, domains, spells, deities, relics/staffs, religion rules |
| Complete Mage | 159 | Alternate class features, feats, prestige classes, spells, invocations |
| Complete Scoundrel | 162 | Prestige classes, feats, skill tricks, spells |
| Complete Warrior | 175 | Classes and variants, prestige classes, feats, domains, spells, equipment, campaign rules |
| Dragonlance Campaign Setting | 290 | Setting races, classes, prestige classes, feats, spells |
| Dungeon Master's Guide II | 286 | Character options, campaign systems, organizations, magic items, and item templates |
| Monster Manual I (Premium Edition) | 322 | Chapter 6 monster skill and feats; player-character creatures using DMG rules |
| Monster Manual II | 240 | Introductory Creature Feats sidebar and potential player-character creatures |
| Monster Manual III | 233 | Monster statblock feat selections and potential player-character creatures |
| Monster Manual IV | 223 | ECL table, "For Player Characters" index, monster feats, and templates |
| Monster Manual V | 224 | ECL table, player-character index, templates, feats, and Earthbind spell |

## First sourcebook baseline: Player's Handbook

The current implementation provides a useful starting inventory, but catalog
presence and name matching do not prove complete rules accuracy.

| Option type | Existing baseline | Remaining audit |
|---|---|---|
| Base classes | All 11 PHB class chassis and represented feature milestones reviewed; Paladin Will, Monk movement-feature timing and Wizard bonus slots corrected. | Manual class-feature resolution, full selectable-feature systems and remaining feat/spell mechanics are not certified complete. |
| Standard races | The PHB races Human, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, and Halfling are present in [domain.ts](../src/domain.ts). | Verify racial traits, languages, proficiencies, and creation behavior against the PHB; separately classify non-PHB subraces and monster races. |
| Feats | All 109 PHB definitions reviewed against pp. 87-102, including prerequisites, benefit summaries, repeatability, Fighter flags and categories. Shared Quicken, Spell Focus and Toughness fixes are recorded below. | Manual/situational feat effects and complete class-feature interaction coverage remain open; definition review is not full combat automation. |
| Spells | Historical name-only inventory: 716 records. Phantom Trap now resolved as Leomund's Trap and merged: 715 records / 605 distinct titles. All 115 level-0/1-accessible titles have source-checked headers across 131 variants; catalog minimum-level-2 through minimum-level-9 groups are checked, including all variants and fourth-level domain-only spells. | Manual effect resolution remains open. |

The bounded completed reviews below supersede the earlier name-only baseline.
Reuse their source evidence and focus on the explicitly remaining rules gaps.

### PHB catalog minimum-level-8 spell checkpoint (2026-11-17)

**Completed scope:** all **46 catalog-minimum-level-8 titles / 49 class-level
records**, Animal Shapes through Whirlwind, against the supplied PHB printed
pp. 198-301 and inherited parent entries/tables. Checked every represented
class access/level, school/subschool/descriptor, component, casting time, range,
duration, saving throw and effect summary. No domain-only titles occur;
represented core-class levels match. Catalog remains **715 records / 605
titles**.

**Header corrections:** none; all source-derived headers and class projections
matched the PHB.

**Effect corrections:** expanded/corrected **8 summaries**. Binding now records
assistant caster-level bonuses and the observable release-trigger save-DC
increase; Clenched Fist includes its attack bonus and limits; Clone includes
the minimum living-flesh sample and resurrection consequences; Cloak of Chaos
and Symbol of Death include their exact costly components/focus. Earthquake
records the fixed terrain save/DC and damage details. Greater Shadow Evocation
preserves the inherited disbelief chance for nondamaging effects, and Greater
Spell Immunity records its one-active-spell limit. No names or class levels
changed.

**Validation:** all **338 tests pass across the new eighth-level fixture suite
and spell regression suite**. The fixture records printed source pages and
checks the complete title/record set, all listed class levels, headers, and
class projections.
Lint, TypeScript checks, production build and `git diff --check` pass; initial
JavaScript remains **492,299 / 515,835 bytes**. No full-suite or print/PDF run.

**Manual boundary:** no spell-effect automation or DC calculations were added.
Saves, damage, conditions, buffs, concentration, transformations, symbols,
wards, travel, divination, payment/cost spending and creatures remain manual.
Summaries do not replace full source descriptions or certify the PHB.

**Historical next target (completed):** **31 catalog-minimum-level-9 titles / 31 records**, Astral
Projection through Wish. Verify all class variants and inherited parent rules.

### PHB catalog minimum-level-9 spell checkpoint (2026-11-17)

Checked the **31 titles / 31 records**, Astral Projection through Wish, against
the supplied PHB and inherited parent spells (printed pp. 201–303).
Lower-minimum-level spells with 9th-level records were reviewed in prior
batches. No access or header changes. The six summary changes and validation
are recorded in the [rules coverage matrix](rules-coverage.md#phb-catalog-minimum-level-9-spell-checkpoint).
Effects, costs and DM decisions remain manual. Next: test creation and level-up
against source-checked builds, starting with historical feat eligibility.

### PHB catalog minimum-level-7 spell checkpoint (2026-11-17)

**Completed scope:** all **49 catalog-minimum-level-7 titles / 55 class-level
records**, Animate Plants through Word of Chaos, against supplied PHB printed
pp. 201-298 and inherited parent entries/tables. Checked every represented
class access/level, school/subschool/descriptor, component, casting time, range,
duration, save and effect summary. No domain-only titles occur; names, class
access and levels are unchanged. Catalog remains **715 records / 605 titles**.

**Header corrections:** **5 records** changed. Corrected Insanity's subschool,
Invisibility, Mass's save, Phase Door's duration and both seventh-level summon
spells' Summoning metadata. Corrected all 55 summaries, preserving inherited
class variants and Mystic/Dragonlance spell access.

**Effect corrections and source limits:** expanded the summaries to capture
the HD-tiered word-spell effects and banishment distinctions, mass-spell
target/area/damage limits, summoning lists and movement restrictions, force/
teleport/travel interactions, costly components, and duration/save exceptions.
Restored limits for Simulacrum, Spell Turning, Teleport Object, Greater
Teleport, symbols, and other PHB effects. **Resurrection (p. 272)** requires
diamonds worth at least **10,000 gp**, not the former catalog value of 5,000 gp.
Symbol of Stunning inherits Symbol of Death's 150-hp activation budget without
explicitly restating it; this uncertainty remains flagged for DM adjudication.

**Validation:** **100 new source/header/effect/projection/setting regressions**
pass; **1,424 tests pass across nine focused suites**, plus **151 source-
attribution cases** run separately. Lint, app/test types, production build and
`git diff --check` pass. No full-suite or print/PDF run.

**Manual boundary:** no spell-effect automation or DC calculations were added.
Saves, damage, conditions, buffs, concentration, transformations, symbols,
wards, travel, divination, payment/cost spending and creatures remain manual.
Summaries do not replace full source descriptions or certify the PHB.

**Historical next target:** **46 catalog-minimum-level-8 titles / 49 records**,
Animal Shapes through Whirlwind, no domain-only titles; that batch is now
completed above.

### PHB catalog minimum-level-6 spell checkpoint (2026-11-17)

**Completed scope:** all **64 catalog-minimum-level-6 titles / 76 class-level
records**, Acid Fog through Word of Recall, against the supplied PHB printed
pp. 196-303 and inherited parent entries. Read effect bodies, HD/effect,
scrying and planar-service tables. Checked every class level/access,
school/subschool/descriptor, component, casting time, range, duration, save
and summary. No domain-only titles occur in this group; represented core
class access/levels all matched. Catalog remains **715 records / 605 titles**.

**Header corrections:** **21 records** changed. Restored Acid Fog, Blade
Barrier, Chain Lightning, Eyebite, Fire Seeds, Freezing Sphere, Heroes' Feast,
Move Earth, Sympathetic Vibration, Transport via Plants, Veil and Wall of
Iron subschools/descriptors. Planar Ally/Binding retain their inherited
conditional descriptors. Eyebite's duration wording follows the printed
header; Geas/Quest inherits Lesser Geas's duration, with its task-completion
and open-ended limits explained in the summary.

| Spell | Restored inherited fields |
|---|---|
| Forceful Hand | Standard action, Medium range, 1 round/level (D), no save; Force descriptor |
| Summon Monster VI / Summon Nature's Ally VI | Components, 1-round casting, Close range, 1 round/level (D), no save; Summoning subschool and conditional descriptors |
| Symbol of Fear / Symbol of Persuasion | V/S/M, 10-minute casting, 0 ft.; see text range, see-text duration; respective Fear/Charm and Mind-Affecting metadata |
| Undeath to Death | Standard action, Medium range, instantaneous duration; retains its explicit Will override |

**Effect corrections and source limits:** expanded/corrected all **76**
summaries consistently across variants.

- **Veil (p. 298):** removed embedded advertising, tracking scripts and scraped
  website footer; restored sensory disguise, target separation, +10 Disguise,
  death reversion and distinct subject/observer save/resistance behavior.
- **Freezing Sphere / Wall of Iron (pp. 258, 299):** removed truncated scraper
  fragments; restored damage, ice/escape, held-charge, geometry/durability,
  falling-wall, save and material-cost limits.
- **Disintegrate (p. 222):** ranged touch, 2d6/level maximum 40d6, 5d6 on
  Fortitude success, first target only, 0-hp destruction, equipment retained,
  10-ft.-cube object/force-object limit and excluded magical fields.
- **Chain Lightning (p. 208):** maximum 20d6 and 20 secondary targets within
  30 ft. of the primary; half primary damage rounded down, same save DC for
  every target and no repeat hits.
- **Heal / Harm (p. 239):** 150-point caps, explicit removable condition list
  rather than all mental conditions, no drained levels/ability restoration,
  undead reversal and Harm's hp floor. No damage/healing automation added.
- **Eyebite (p. 228):** cumulative HD bands, move-action targeting after the
  first round, condition durations/retriggering, non-sleep coma and the
  Remove Curse exception to sickness removal.
- **Undeath to Death (p. 297, parent p. 209):** inherits Circle of Death's
  **9+ HD immunity**, HD-order selection and maximum 20d4 HD budget, but uses
  Will rather than Fortitude; consumes 500 gp diamond powder.
- **Planar Ally / Binding (pp. 261-262):** only elementals/outsiders up to
  12 total HD. Ally permits one or two of the same kind with joint payment;
  Binding permits one or up to three of the same kind with independent saves,
  escape and negotiations. Included payment/service timing, 250 XP ally cost,
  circle/escape/natural-1 binding hazards and conditional descriptors.
- **Contingency / Transformation (pp. 213, 294):** companion level cap and
  carried 1,500 gp focus, one-contingency limit; typed bonuses, character-level
  BAB cap and loss of casting/activation/completion item use during
  Transformation, consuming a Bull's Strength potion.
- **Stone to Flesh (p. 284):** separate fixed **DC 15 Fortitude** survival
  save, not the ordinary spell DC; object conversion has its own save/size
  rules. Banishment's +2 DC/+1 resistance-check per opposed item stays manual.
- Completed ability-mass bonuses and spell/skill exclusions, images' costs/
  concentration/triggers/line of effect, glyph/ward conditions, spell storage,
  material/XP costs, physical travel/loading and gaseous-movement limits.

**Explicit source-inheritance caveat:** Symbol of Fear (p. 290) says it
functions as Symbol of Death but never explicitly removes the parent's
150-hp activation budget. Symbol of Persuasion explicitly removes that limit.
The Fear summary preserves/flags the inherited limit for DM adjudication,
rather than silently declaring unlimited targets. No runtime target-budget
ruling was added. Both retain surface visibility, covering, trigger/password/
attunement and reentry behavior; costs and rogue DC 31 are included.

**Evidence/tests:** printed-page fixtures in
[phbSpellCases.ts](../tests/phbSpellCases.ts), independently resolved from
source headers and parents.
[phbSixthLevel.test.ts](../tests/phbSixthLevel.test.ts) adds **130 regressions**:
64 header/projection cases, 64 effect cases, exact scope/catalog invariants
and Mystic/Dragonlance Bard inheritance. Nonempty variants prevent vacuous
passes; every summary must agree across class-level records. Updated only
directly affected legacy summary/metadata assertions.

**Validation:** **1,632 tests pass across ten focused suites**: all six PHB
audits, spell UI/catalog, domains, casting summaries and shared rules. Lint,
app/test types, production build, size budget and whitespace pass; initial
JavaScript **492,299 / 515,835 bytes**. No full-suite or print/PDF run; prior
full-suite timing limitations remain open. No dependencies, timeouts,
identities/class levels or runtime DC calculations changed.

**Boundaries:** spell effects, attacks, damage, saves/modifiers, hp floors,
conditions, buffs, concentration, transformations, traps/symbols, wards,
travel/divination tables, payment/material/XP spending and creatures remain
manual. Summaries are not substitutes for full source descriptions or full
PHB certification.

**Historical next target (completed above):** **49 minimum-level-7 titles / 55
records**, starting **Animate Plants**, through Word of Chaos. No domain-only
titles occur in that group.

### PHB catalog minimum-level-5 spell checkpoint (2026-11-17)

**Completed scope:** all **64 catalog-minimum-level-5 titles / 74 class-level
records**, Atonement through Waves of Fatigue, against supplied PHB printed
pp. 201-301, inherited parent entries and premium polymorph rules, p. 320.
Read effect bodies and relevant contact, creation, permanency and travel
tables. Checked core class access/levels, schools/subschools/descriptors,
components, casting times, ranges, durations and saves. No domain-only titles
occur in this group; all represented core class levels/access matched.

**Header corrections:** **39 records** changed. Restored subschools and
energy/alignment descriptors, including Baleful Polymorph, Greater Command/
Heroism, Dream, Mind Fog, Mislead, Nightmare, Slay Living and the walls.
Raise Dead has the Healing subschool. Prying Eyes' duration places its
dismissible marker as printed; Waves of Fatigue has **None**, not "No", for
its save. Restored missing inherited fields for:

| Spell | Printed page | Inherited source |
|---|---:|---|
| Overland Flight | 259 | Fly, p. 232; standard-action casting; retains personal range and omitted save |
| Summon Monster V | 286 | Summon Monster I, pp. 285-286; 1-round casting |
| Summon Nature's Ally V | 289 | Summon Nature's Ally I, p. 288; 1-round casting |
| Symbol of Pain | 290 | Symbol of Death, pp. 289-290; 10-minute casting and Fortitude save |
| Symbol of Sleep | 291 | Symbol of Death, pp. 289-290; retains own Will save |

Other inherited entries (Call Lightning Storm, Greater Command, Dispel
Good/Law, Greater Dispel Magic/Heroism, Major Creation, Mirage Arcana,
Persistent Image and Mass Suggestion) were resolved against their parents;
their casting fields already matched aside from metadata noted above.
All 74 summaries were expanded/corrected consistently across variants.

**Edition-sensitive rules and confirmed corrections:**

- **Baleful Polymorph (pp. 202-203, 320):** the supplied edition replaces
  statistics under the polymorph subschool, initially retaining hp/effective
  HD, alignment/personality and language understanding. All equipment drops,
  rather than melding. After **24 consecutive hours**, a failed Will save
  changes HD/hp and removes memories/language understanding until the spell
  ends. Fatal forms grant +4 Fortitude; incorporeal/gaseous/ooze/plant immunity,
  shapechanger reversion, death/unconsciousness termination and class-feature
  loss are included. Did not substitute older immediate-Will-save wording.
- **Lesser Planar Binding (pp. 261-262):** exactly **one elemental or outsider
  up to 6 HD**, not up to three arbitrary extraplanar creatures. Included
  inward-facing circle, daily escape attempts, service negotiation, natural-1
  escape, service duration and alignment/elemental descriptors.
- **Awaken (p. 202):** distinguish caster's Will save (DC 10 + specified HD)
  from the target's save; include animal +2 HD, type/stat changes, language
  and companion/familiar/mount exclusion. Remains manual.
- **Mind Fog (p. 253):** -10 competence to Wisdom checks and Will saves, not
  Wisdom scores; successful save immunity, 2d6-round aftermath, wind and sight.
- **Shadow Evocation (p. 277):** one-fifth damage to disbelievers, but purely
  nondamaging spells have **no effect**, not a generic 20% chance; preserve
  ordinary saves at the shadow spell's DC, resistance and automatic object
  disbelief.
- **Righteous Might (p. 273):** +4 size Strength, +2 size Constitution,
  +2 enhancement natural armor and DR 3/6/9 according to caster level and
  channeled energy, not unspecific combat bonuses.
- **Raise Dead (pp. 268-269):** 5,000 gp diamonds, free/willing soul,
  one-day/level limit, permanent level/Constitution loss, HD-based returned hp,
  spell/slot loss, body and death-effect/type limits.
- **Wall of Force (pp. 298-299):** repaired truncated summary with geometry,
  damage/Dispel Magic immunity, destruction exceptions, ethereal blocking,
  teleport bypass and gaze passage. Wall of Stone/Thorns now specify material,
  durability, movement/damage and escape limits.
- Repaired truncated Private Sanctum, Telepathic Bond and Waves of Fatigue;
  added major damage caps, bonus types, material/focus/XP costs, divination
  risks, possession/return hazards, symbol triggers/durations, resurrection,
  creation, summoning and travel limits throughout.

**Unresolved source ambiguity, not silently ruled:** Cloudkill (p. 210)
assigns death saves to **4-6 HD**, then Constitution damage/half saves to
**6+ HD**. The clauses overlap at exactly 6 HD. The summary explicitly
preserves both and requests DM adjudication; no automated boundary was added.
Poison immunity, recurring damage timing, moving/sinking fog and no spell
resistance are unambiguous and retained.

**Evidence/tests:** source-derived printed-page fixtures in
[phbSpellCases.ts](../tests/phbSpellCases.ts).
[phbFifthLevel.test.ts](../tests/phbFifthLevel.test.ts) adds **130 regressions**:
64 header/projection cases, 64 effect-boundary cases, exact scope/catalog
invariants and Mystic/Dragonlance Bard inheritance. Nonempty variant assertions
prevent vacuous passes; all variant summaries must agree. Directly affected
legacy summary assertions now use source-backed substrings, and Lesser
Planar Binding's old incorrect three-creature expectation was replaced.

**Validation:** **1,502 tests pass across nine focused suites**: all five PHB
audits, spell UI/catalog, domains, casting summaries and shared rules. Lint,
app/test types, production build, size budget and whitespace pass; initial
JavaScript **492,299 / 515,835 bytes**. No full-suite or print/PDF run; prior
full-suite timing limitations remain open. No dependencies, timeouts, spell
identities/class levels or runtime DC calculations changed.

**Boundaries:** spell effects, attacks, buffs, concentration, possession,
transformations, traps/symbols, resurrection, crafting, site wards, travel/
divination tables, XP/material spending and creature management remain manual.
Summaries do not replace full source descriptions or certify the PHB.
Base catalog remains **715 records / 605 titles**.

**Historical resume (completed above):** **64 minimum-level-6 titles / 76 records**, starting
**Acid Fog**, then Analyze Dweomer, Animate Objects, Antilife Shell,
Antimagic Field and Banishment. No domain-only titles occur in that next
group. Check every variant and inherited parent before higher groups and
remaining feat/class mechanics.

### PHB catalog minimum-level-4 spell checkpoint (2026-11-17)

**Completed scope:** all **68 catalog-minimum-level-4 titles / 87 records**,
Air Walk through Zone of Silence, against the supplied PHB's printed
pp. 196-303 and inherited parent descriptions. Checked class lists/levels,
schools/subschools/descriptors, components, casting times, ranges, durations,
saves and effect bodies. No names or ordinary class levels changed.

**Scope correction:** this group has **64 ordinary-class titles / 83 variant
records** plus four domain-only records: Chaos Hammer (Chaos 4, p. 208),
Holy Smite (Good 4, p. 241), Order's Wrath (Law 4, p. 258), and Unholy Blight
(Evil 4, p. 297). The previous resume's "lowest core-class level" wording was
imprecise. These remain excluded from ordinary class lists, with domain lookup
and apostrophe normalization tested; no accidental Cleric/Mystic grants.

**Header corrections:** **42 records** changed. Restored subschools and
alignment/energy descriptors, including Polymorph's source subschool. Every
Cure Critical Wounds variant now has Healing metadata; Holy Smite and Order's
Wrath use V/S without a divine focus. Ice Storm lasts 1 round. Resolved missing
inherited fields rather than treating abbreviated entries as complete:

| Spell | Printed page | Inherited source |
|---|---:|---|
| Cure Critical Wounds | 215 | Cure Light Wounds, p. 215 |
| Enlarge Person, Mass | 227 | Enlarge Person, p. 226; 1-round casting |
| Inflict Critical Wounds | 244 | Inflict Light Wounds, p. 244 |
| Locate Creature | 249 | Locate Object, p. 249; retains own components/duration |
| Reduce Person, Mass | 269 | Reduce Person, p. 269; 1-round casting |
| Solid Fog | 281 | Fog Cloud, p. 232; retains own components/duration |
| Summon Monster IV | 286 | Summon Monster I, p. 285; 1-round casting |

Other inherited entries, including Greater Invisibility, Restoration, Hold
Monster and Summon Nature's Ally IV, were read in full; their existing headers
already matched, aside from source metadata refinements noted above.
Personal spells retain source-omitted saving throws.

**Summary corrections/enrichment across all 87 records:**

- Giant Vermin (p. 235): repaired truncation; three centipedes/two spiders/one
  scorpion; caster-level size bands through Colossal; simple commands.
- Wall of Ice (p. 299): **3 hp per inch of thickness per 10-ft. square**, not
  15 hp + level; break DC 15 + caster level, adjacent-creature disruption saves,
  and plane-only cold damage after a breach.
- Tree Stride (p. 296): removed embedded advertising/tracking script text;
  full-round travel, same-kind living trees, range table, exit and destruction
  restrictions now match across Ranger/Druid records.
- Shadow Conjuration (p. 276): only Sorcerer/Wizard summoning/creation spells
  up to 3rd level; separate disbelief/ordinary saves, mandatory resistance,
  one-fifth creature hp and disbelievers' reduced AC bonuses.
- Divine Power (p. 224): character-level BAB capped +20, enhancement Strength
  and temporary hp, not healing. Enervation (p. 226): negative levels expire,
  not permanent drain; undead receive temporary hp.
- Lesser Globe (p. 236): includes cantrips; excludes already-active spells;
  targeted versus area dispelling. Spell Immunity (p. 282): unbeatable
  resistance, not immunity to effects ignoring resistance.
- Dimension Door's post-cast action lock, Flame Strike's divine half,
  Fire Shield's conditional energy protection, Freedom of Movement's grapple
  and underwater limits, Holy Sword's superseding weapon powers, and the four
  alignment spells' damage/condition/saving-throw distinctions.
- Paid calling, resurrection losses, spell-transfer limits, material/focus
  costs, damage caps, bonus types, saves/resistance and target limits throughout.

**Dismissal DC display (p. 222):** source requires ordinary DC plus caster
level minus target HD. Added optional adjustment metadata to both class
variants. Ordinary and prepared-metamagic rows now say **Base DC** and show
the final formula, rather than representing that base as the final result.
Target HD and the final adjustment remain manual; no target state or combat
automation was added. Other spell DCs, Poison's separate formula, generic
per-level summaries and print layouts are unchanged.

**Evidence/tests:** [phbSpellCases.ts](../tests/phbSpellCases.ts) stores all
68 source-derived header/class-level fixtures with printed page numbers.
[phbFourthLevel.test.tsx](../tests/phbFourthLevel.test.tsx) adds **145
regressions**: 68 headers/projections, 68 effect boundaries, exact scope,
four domain-only lookup/exclusion cases, setting inheritance, and three
Dismissal metadata/UI cases. Older summary assertions were updated only where
directly affected, using source-backed substrings rather than terse snapshots.

**Validation:** **1,372 passing tests across eight focused suites**: all four
PHB audits, spell UI/catalog, domains, casting summaries and shared rules.
Lint, app/test types, production build, size budget and whitespace pass;
initial JavaScript **492,299 / 515,835 bytes**. No full-suite or print/PDF run;
the previous full-suite timing limitation remains open. No dependencies or
timeouts changed.

**Boundaries:** spell effects, attacks, buffs, concentration, conditions,
form/terrain changes, resurrection, transfers, paid services, creature
management and Dismissal's final target-dependent DC remain manual. Summaries
do not replace full source descriptions or certify the PHB. Base catalog
remains **715 records / 605 titles**.

**Historical resume (completed above):** **64 minimum-level-5 titles / 74
records**, starting **Atonement**. The current exact resume is saved in the
fifth-level checkpoint above.

### PHB minimum-level-3 spell checkpoint (2026-11-17)

**Completed scope:** all **79 minimum-core-class-level-3 spell titles**,
Animate Dead through Water Walk, across **101 class-level records**.
Read the supplied PHB's spell descriptions, printed pp. 198-300, and their
inherited parents. Checked every core class list/level and all school,
subschool/descriptor, component, casting-time, range, duration and save fields.
All represented core class lists and levels matched the source.

**Header corrections:** 45 records changed. Restored subschools/descriptors
throughout, including the four magic circles' alignment descriptors, Contagion's
Evil descriptor, and the Healing subschool on every Cure Serious Wounds and
Neutralize Poison variant. Resolved missing inherited fields for:

| Spell | Printed page | Inherited source |
|---|---:|---|
| Cure Serious Wounds | 216 | Cure Light Wounds, p. 215 |
| Deep Slumber | 217 | Sleep, p. 280; retains Close range and 10-HD total |
| Deeper Darkness | 217 | Darkness, p. 216; retains longer duration |
| Inflict Serious Wounds | 244 | Inflict Light Wounds, p. 244 |
| Invisibility Sphere | 245 | Invisibility, p. 245; retains its own V/S/M components |
| Magic Fang, Greater | 250 | Magic Fang, p. 250; retains Close range and hour/level duration |
| Summon Monster III | 286 | Summon Monster I, p. 285 |
| Summon Nature's Ally III | 288 | Summon Nature's Ally I, p. 288 |

Charm Monster, Major Image and the magic-circle variants also inherit parent
headers; their existing casting fields matched. Personal spells retain
source-omitted saving throws. PDF wrapping was resolved against source
descriptions, not filled from current catalog data.

**Effect-summary review:** all 101 records now use consistent paraphrases of
the source benefits and important limits, with no change to class access.
Representative substantive corrections:

- Haste (p. 239) grants one extra held-weapon attack only on a full attack,
  not an extra action; movement is a +30-ft. enhancement capped at twice
  normal speed. Slow (p. 280) permits one standard or move action, not both
  or full-round actions, and halves speed.
- Invisibility Purge (p. 245) negates invisibility only inside its sphere,
  not by dispelling it. Invisibility Sphere's later arrivals are not affected;
  the central recipient attacking ends the whole spell.
- Vampiric Touch (p. 298) grants temporary hp, not healing, capped by damage
  dealt and target hp +10; unused temporary hp expire after an hour.
- Magic circles (pp. 249-250) bar nongood/nonlawful/nonevil/nonchaotic
  summoned creatures as appropriate, not just the named hostile alignment.
  Mental-control/new-possession protection is alignment-independent; inverted
  binding and diagram restrictions remain manual.
- Fireball/Lightning Bolt (pp. 231/248) cap at 10d6; Call Lightning (p. 207)
  has ten-bolt maximum, standard-action subsequent bolts and storm damage.
- Prayer (p. 264) uses luck bonuses on its specified rolls, not all checks;
  Good Hope/Crushing Despair (pp. 237/215) affect weapon damage, not all damage.
  Greater Magic Fang (p. 250) can give every natural weapon +1 instead of
  one weapon its scaling bonus.
- Preserved diseases' later save DCs, spell-resistance distinctions, material/
  focus costs, target/HD restrictions, spell-removal limits and summoning
  counts/environment/ability restrictions. Tiny Hut is shelter/concealment,
  not a weapon or spell barrier; Water Breathing divides its total duration.

**Automated correction: Poison's save DC (p. 262).** Added optional catalog
metadata for its explicit half-caster-level/Wisdom formula on both Druid 3
and Cleric 4 records. The shared DC helper uses that class's effective caster
level, rounded down, and effective Wisdom; existing applicable Spell Focus and
setting bonuses remain additive. Spell-sheet ordinary rows and prepared
metamagic-copy rows both pass the metadata. Heighten does not substitute its
slot level into a formula independent of spell level. Other spell DCs and
generic per-level summaries are unchanged; no print layout changes.

**Evidence/tests:** source-derived fixtures in
[phbSpellCases.ts](../tests/phbSpellCases.ts) retain page numbers and independently
extracted expected headers/class levels.
[phbThirdLevel.test.tsx](../tests/phbThirdLevel.test.tsx) has **168 regressions**:
79 header/projection cases, 79 effect-boundary cases, exact scope and
Mystic/Dragonlance Bard inheritance checks, plus eight Poison calculation/UI
cases. Directly affected older assertions now accept expanded source-correct
summaries rather than requiring abbreviated sentences.

**Validation:** **1,342 passing tests across eight focused suites**, covering
all three PHB audits, spell UI/catalog, domains, casting summaries, shared rules
and proficiency. Lint, app/test types, production build, size budget and
whitespace pass; initial JavaScript **492,299 / 515,835 bytes**. No full-suite
or print/PDF run; earlier intermittent full-suite timing failures remain an
outstanding validation limitation. No dependencies or timeout limits changed.

**Boundaries:** spell attacks, buffs, damage, conditions, concentration, forms,
terrain, traps, bindings, summoned creatures and mounts remain manual. These
summaries guide the player but do not replace full source descriptions or
certify full PHB mechanics. No names or records were added/removed: base
catalog remains **715 records / 605 titles**.

**Historical resume (completed above):** **68 catalog-minimum-level-4 titles /
87 records**, starting **Air Walk**, including four domain-only records.
The current exact resume is saved in the fourth-level checkpoint above.

### PHB minimum-level-2 spell checkpoint

**Completed scope:** all **88 previously unchecked minimum-level-2 titles**,
from Acid Arrow through Zone of Truth, across **110 class-level records**.
The 89-title group includes Leomund's Trap, already checked in the earlier
batch. Reviewed the supplied PHB's spell descriptions, printed pp. 196-303,
and inherited parent spells, including Cure Light Wounds (p. 215), Daze
(p. 217), Inflict Light Wounds (p. 244), Mending (p. 253), Silent Image
(p. 279), Summon Monster I (p. 285), and Summon Nature's Ally I (p. 288).
All core class lists and levels matched the source.

**Header corrections:** 48 class-level records changed. Restored subschools
and descriptors, Touch of Idiocy's `None` save, and inherited components,
casting time, range, duration and/or saves for Cure Moderate Wounds, Daze
Monster, Hold Animal, Inflict Moderate Wounds, Make Whole and both summon II
spells. Minor Image's inherited headers already matched. Personal spells
retain omitted saves. Preserved the supplied printing's Alter Self
`Transmutation (Polymorph)` school. Fog Cloud's printed medium range omits a
slash; normalized it to the standard `100 ft. + 10 ft./level` notation.

**Effect summaries:** replaced all 110 variants' terse or truncated summaries
with consistent paraphrases of the reviewed effects and important limits.
Representative substantive corrections:

- Touch of Idiocy (p. 294): a single 1d6 penalty to each mental score,
  minimum 1, not ability damage; no save.
- Scare (p. 274): frightened, not panicked; only creatures below 6 HD,
  with shaken for 1 round on a successful Will save.
- Death Knell (p. 217): +1 effective caster level, not a character level,
  new spell access or extra spells; requires a living target at -1 hp or fewer.
- Protection from Arrows (p. 266): DR 10/magic against ranged weapons,
  discharged after 10 damage per caster level, maximum 100.
- Scorching Ray (p. 274): additional rays at caster levels 7 and 11,
  each a separate ranged touch attack for 4d6 fire.
- Acid Arrow (p. 253): initial damage plus up to six additional rounds;
  Heat/Chill Metal (pp. 239/209): seven-round damage schedules.
- Corrected bonus types/caps, target types/HD, repeat saves, partial-save
  effects, material/focus costs and spell-resistance distinctions throughout.
  Summon Swarm remains uncontrolled; Spiritual Weapon uses BAB plus Wisdom,
  not weapon feats; Web entangles even on a successful initial save.

**Regressions:** independent PHB header fixtures, including printed page
references and all class levels, are in
[phbSpellCases.ts](../tests/phbSpellCases.ts).
[phbSecondLevel.test.ts](../tests/phbSecondLevel.test.ts) has **162 tests**:
88 header/projection cases, 72 effect-boundary cases, an exact scope/count
check, and Mystic/Dragonlance Bard inheritance/filter checks. Existing
description assertions now accept the expanded source-correct guidance
instead of requiring old abbreviated sentences.

**Validation:** five focused suites pass **768 tests**, covering both PHB
audits, spell UI/catalog, domains and casting summaries. Lint, application and
test types, production build, size budget and whitespace checks pass. No
full-suite rerun or print/PDF work; the previous full-suite timing failures
remain an explicit outstanding validation limitation.

**Boundaries:** definitions and player-facing summaries are checked, not
automatic spell resolution. Spell attacks, buffs, damage, concentration,
conditions, form choices, terrain, traps and summoned creatures remain manual;
the complete source descriptions still govern edge cases. No titles were
added or removed; the catalog remains 715 records / 605 titles. This does
not certify the whole PHB or enable incomplete prestige progressions.

**Historical resume (completed by the checkpoint above):** the **79 titles whose lowest core-class spell level is 3**,
starting with **Animate Dead**, then Arcane Sight, Bestow Curse, Blink,
Call Lightning and Charm Monster. Check every class-level variant and
inherited field, then continue higher groups and remaining feat/class mechanics.

### PHB feat/low-level spell checkpoint (2026-11-17)

**Completed definition scope:** all 109 represented PHB feats, printed
pp. 87-102. Compared prerequisites, benefits, repeatability, Fighter bonus
eligibility and metamagic/item-creation categories. The existing prerequisite
sets largely matched the source; regressions lock the exact Fighter/category
sets, all eight crafting thresholds, key feat chains and school-scoped choices.
This pass does not claim that every situational feat effect is automated.

**Confirmed shared fixes:**

- Quicken's original PHB free-action wording is explicitly updated to a swift
  action by **Complete Arcane p. 86**. Updated the feat and spell-sheet notice,
  including the shared swift-action limit. PHB p. 98 prohibits ordinary Quicken
  on spontaneously cast spells, including cleric/druid conversions; removed
  misleading notices presenting spontaneous Quicken as a manual option.
  Casting-time eligibility and action use remain manual.
- School parsing now strips both subschools and descriptors before applying
  Spell Focus/Greater Spell Focus or Gnome illusion DC bonuses. For example,
  `Evocation [Fire]` must not lose its Evocation focus bonus. The same shared
  parser is used for prestige school-repertoire requirements.
- Toughness HP now uses the same active feat selection filter as other effects.
  Legal repeated picks still give +3 each; an invalid saved Wizard bonus pick
  grants no HP and retains the existing repair warning.

**Completed spell-header scope:** every represented spell available at level
0 or 1 to at least one core class: **115 distinct titles, 120 low-level
records, 131 records including higher class-level variants**. For every title,
checked class access/levels, school/subschool/descriptors, components, casting
time, range, duration and saving throw against its printed PHB description.
Source page numbers and independently extracted expected headers are in
[phbSpellCases.ts](../tests/phbSpellCases.ts); inherited fields are resolved,
not silently left blank. This is a header review with selected effect fixes,
not an exhaustive body/effect automation review.

- Restored missing fields inherited by Cure Minor Wounds (p. 216), Inflict
  Minor Wounds (p. 244), Charm Animal (pp. 208-209), and Lesser Confusion
  (p. 212). Lesser Confusion uses V/S, not a divine focus.
- Hold Portal has verbal-only components (p. 241); Undetectable Alignment's
  save includes the harmless/object qualifier (p. 297).
- Restored omitted subschools and descriptors across all affected class-level
  variants. Dragonlance-only class-list restrictions remain setting-specific.
- Feather Fall retains its immediate casting time: Complete Arcane p. 86
  explicitly updates the PHB's free-action text, just as it updates Quicken.
- Repaired 14 effect summaries: Acid Splash, Ray of Frost, Touch of Fatigue,
  Lullaby, Faerie Fire, Magic Missile, Shield, Ray of Enfeeblement, Shocking
  Grasp, True Strike, Divine Favor, Flare, Longstrider and Produce Flame.
  Important boundaries include Magic Missile's 1d4+1 per missile and
  five-missile cap (p. 251), Ray of Enfeeblement's Strength **penalty** and
  minimum Strength 1 (p. 269), Lullaby's sleep-only save penalty (p. 249),
  Shield's shield bonus/Magic Missile negation (p. 278), Divine Favor's
  +1 to +3 luck bonus excluding spell damage (p. 224), and Produce Flame's
  +5 cap/one-minute duration cost per attack (p. 265). Resolution is manual.

**Resolved source/duplicate:** PHB **pp. 247-248**, Leomund's Trap, is the SRD's
Phantom Trap. The catalog already contained both titles, so removed the
duplicate rather than adding another record. Retained Leomund's Trap with
Phantom Trap as an alias; added the 50-gp component and nearby-casting failure
boundary to its summary. The base catalog now contains **715 class-level
records / 605 distinct titles**. Import/load migration preserves legacy flat
and class-specific spell lists, ownership, acquisition, Wizard learning,
Spell Mastery, prepared-copy counts, Heighten slots and all nine tracked
metamagic-copy arrays. Alias copies merge with flags aligned and unmodified
copies padded; conflicting acquisition/ownership records raise an explicit
error instead of silently choosing one. Unrelated imports remain unchanged.

**Validation:** final four-suite source/class/HP/domain run: **361 passing**;
earlier five-suite spell-UI/proficiency run: **637 passing**.
[phbAudit.test.ts](../tests/phbAudit.test.ts): **169 passing**, including all
115 source-header cases, class-level variants, feat/DC/HP checks and alias
migration. Lint, app/test types, production build and whitespace pass; initial
JavaScript **492,191 / 515,835 bytes**. Full-suite attempts produced **1,771
passing / 2 timing failures out of 1,773**, with very long stalls in existing
UI tests. Retrying affected workflows passed height/deferred-loading checks
but stalled in a different wizard import/export test. A clean single-run full
suite remains outstanding; no test timeouts were increased. No print/PDF work.

**Historical resume (completed by the checkpoint above):** the **88 titles whose minimum core-class spell
level is 2**, alphabetically beginning with **Acid Arrow**, including all
class-level variants and relevant effects. There are 89 titles in that group;
Leomund's Trap is already source-checked above. Then continue higher-level
groups and manual feat/class mechanics. The entire PHB is not certified.

### PHB/DMG class-review checkpoint (2026-11-16)

**Scope:** the user chose this larger class batch instead of implementing
MMIV's Varag racial progression. Varag remains visibly deferred, not modeled
as five ordinary class Hit Dice. The following is not full-book certification.

**PHB evidence:** class descriptions/tables, printed pp. 23-58. Checked all
11 classes' HD, skill-point rates, BAB categories and three save progressions;
regressions exercise every level 1-20. Reviewed the represented milestone
tables and Fighter, Wizard, Monk and Ranger bonus-feat slot rules.

- Paladin Table 3-12 (p. 43) has poor Reflex **and Will**. Corrected the
  erroneous good Will progression; Divine Grace remains separate and tested
  before/after Paladin 2 and for loss of lawful-good status.
- Monk's feature text (p. 41) starts Fast Movement at level 3; Table 3-10's
  numeric speed column (p. 40) agrees, despite its level-2 special-column
  label. Moved the displayed feature to Monk 3; actual movement already used
  the correct threshold.
- Wizard bonus slots (p. 57) now enforce metamagic/item creation/Spell Mastery
  eligibility while retaining normal prerequisites. Scribe Scroll stays
  automatically granted at Wizard 1; general slots stay unrestricted.
  Fighter-only restrictions and Monk/Ranger prerequisite exceptions remain.
- Supplementary checks required by this fix: Complete Mage p. 37 permits
  reserve feats in Wizard bonus slots; tagged all 24 of its represented
  reserve feats. Its Fearsome Necromancy (p. 43), Toughening Transmutation
  and Unsettling Enchantment (p. 48) are Wizard bonus choices only for their
  respective specialists, not merely characters with matching Spell Focus.
  MMIV p. 202 permits Githyanki Battlecaster as a Fighter or Wizard bonus feat.
  Reserved-spell use and feat effects remain manual as previously documented.
- Saved illegal Wizard-category choices remain visible with explicit warnings,
  but shared selection filtering excludes their mechanical bonuses, casting
  modifiers, proficiencies, skill-trick grants and prerequisite contributions.
  They can be repaired in setup or level-up. Normalization uses the same slot
  restrictions.

**DMG evidence and corrected represented entry requirements:**

| Class | Printed page | Requirements now represented |
|---|---:|---|
| Arcane Archer | 176 | Elf/half-elf (including represented elf subraces), BAB +6, Point Blank Shot, Precise Shot, bow-specific Weapon Focus, arcane level-1 spells |
| Arcane Trickster | 177 | Nonlawful; Decipher Script, Disable Device and Escape Artist 7; Knowledge (arcana) 4; Mage Hand and arcane level-3 spells; sneak attack +2d6 |
| Assassin | 180 | Evil; Disguise 4, Hide and Move Silently 8; fictional special entry condition retained for DM confirmation |
| Dragon Disciple | 183 | Knowledge (arcana) 8, Draconic (including learned Speak Language selections), spontaneous arcane casting; nondragon/not-half-dragon and DM-approved variety remain explicit manual checks |
| Duelist | 185 | BAB +6; Perform 3, Tumble 5; Dodge, Mobility, Weapon Finesse; no invented Combat Expertise requirement |
| Dwarven Defender | 186 | Dwarf, lawful, BAB +7, Dodge, Endurance, Toughness |
| Eldritch Knight | 187-188 | All martial weapon proficiencies, not a single weapon feat; arcane level-3 spells |
| Hierophant | 188 | Knowledge (religion) 15, one metamagic feat, divine level-7 spells |
| Horizon Walker | 189 | Knowledge (geography) 8 and Endurance; no invented BAB/base-class restriction |
| Loremaster | 191 | Two distinct Knowledge skills at 10 ranks; three distinct metamagic/item-creation feats; Knowledge-specific Skill Focus; seven castable divinations, including one level 3+ |
| Mystic Theurge | 192 | Knowledge (arcana/religion) 6 each; arcane **and** divine level-2 spells |
| Shadowdancer | 194 | Hide 10, Move Silently 8, Perform (dance) 5; Combat Reflexes, Dodge, Mobility |
| Thaumaturgist | 196 | Spell Focus (Conjuration), actual ability to cast Lesser Planar Ally |

Removed invented minimum abilities and preferred-base-class restrictions.
The shared prerequisite-only evaluator works independently of progression
availability; the level-up evaluator still rejects all 13 incomplete DMG
progressions. Specific spell checks require usable slots and class access;
Wizard/spontaneous spell checks also require recorded known spells, whereas
divine full-list casters need not mark every available spell as known.
Loremaster counts distinct normalized spell names and includes divination
subschools. Added Lesser Planar Ally's canonical catalog-name alias.

Creation no longer treats a class/race-only match as satisfying entry.
Stored legacy prestige references remain visible, but do not append an unearned
class level, display unearned special abilities, or grant weapon proficiency.
At this checkpoint Archmage, Blackguard, and Red Wizard were still missing.
Complete DMG progressions, familiar options, and PHB feat/spell/manual-feature
gaps remained open. Dragonlance prestige progression regressions passed.

**Follow-up (2026-11-17):** Archmage entry is now source-checked against DMG
pp. 178-179 and validated by the core class and Dragonlance prestige suites
(57 tests), lint, types, and build. Archmage remains reference-only: spellcasting
advancement and High Arcana's slot sacrifices are not implemented. Blackguard
and Red Wizard were added in the subsequent DMG entry pass. The Blackguard
and Assassin 1st–4th-level spell lists were initially reference-only. See the
[coverage notes](rules-coverage.md) for current DM confirmations and casting limits.

**Validation:** `npm test -- --maxWorkers=2` passed all **28 suites / 1,602
tests**, including 35 new class/prestige regressions. Initial unbounded tests
exposed timeouts/cold lazy-screen assertions; asynchronous screen/import waits
were corrected and the
complete bounded run passed. `npm run lint`, `npm run build`, and
`git diff --check` passed. Initial JavaScript: 488,143 bytes, below 515,835.
Local browser verification covered prestige filtering and invalid Wizard
selection/replacement/allowed choices. No print/PDF generation was run.

**Historical resume, superseded by the 2026-11-17 checkpoint above:** PHB
feat definitions, then spell mechanics. Do not repeat this bounded class batch
or claim the entire PHB, DMG, or Complete Mage is complete.

## Dungeon Master's Guide (3.5): first-pass character-option inventory

Chapter 6 contains race and monster-PC guidance, 16 prestige classes, a
familiar feat and familiar lists, special cohorts, unusual paladin mounts,
animal-companion guidance, and epic-character progressions (printed pp.
170–210). No new base class or standalone spell catalog was identified in this
chapter.

### Races and monsters as characters

The race-creation guidance (pp. 170–172) includes a Gold Dwarf subrace example
and a modified Half-Human Elf example. These two race examples are now
selectable and attributed to the DMG; they print through the normal race
summary path. The "Monsters as Races" table (p. 172)
classifies 33 Monster Manual creatures by suitability for PCs and gives level
adjustments:

- **Easy:** Goblin (+0), Kobold (+0), Orc (+0), Aasimar (+1), Bugbear (+1),
  Duergar (+1), Gnoll (+1), Hobgoblin (+1), Lizardfolk (+1), Tiefling (+1),
  Centaur (+2), Githyanki (+2), Githzerai (+2), Drow (+2), Ogre (+2),
  Minotaur (+2), Troglodyte (+2), and Svirfneblin (+3).
- **Difficult:** Afflicted Lycanthrope (+2), Satyr (+2), Pureblood Yuan-ti
  (+2), Kuo-toa (+3), Natural Lycanthrope (+3), Pixie (+4), Gargoyle (+5),
  and Troll (+5).
- **Very difficult:** Drider (+4), Hill Giant (+4), Janni (+5), Halfblood
  Yuan-ti (+5), Mind Flayer (+7), Ogre Mage (+7), and Vampire (+8).

The chapter also provides monster-PC rules for racial Hit Dice, level
adjustment, ECL, ability scores, skills, feats, and starting level. The current
[domain.ts](../src/domain.ts) model supports racial Hit Dice and level
adjustment and derives ECL. The 33 monster-PC entries require their Monster
Manual racial definitions and are therefore tracked as a cross-book roster,
not counted as DMG-only race definitions. A similarly named race from another
setting must not be treated as the DMG version.

### Prestige classes and feats

The DMG lists Arcane Archer, Arcane Trickster, Archmage, Assassin, Blackguard,
Dragon Disciple, Duelist, Dwarven Defender, Eldritch Knight, Hierophant,
Horizon Walker, Loremaster, Mystic Theurge, Red Wizard, Shadowdancer, and
Thaumaturgist (pp. 176–196). All 16 now have DMG-attributed definitions and
level-up-enabled progressions in [domain.ts](../src/domain.ts). The Dragonlance
Red-Robed Wizard remains separate from the DMG Red Wizard.

The DMG's 13 epic feats are already inventoried and regression-tested in
[rules-coverage.md](./rules-coverage.md) (pp. 209–210). Chapter 6 also
defines the non-epic Improved Familiar feat (p. 200): it requires the ability
to acquire a familiar, compatible alignment, and a sufficient caster level.
Its alignment-based options are the shocker lizard and stirge (5th level),
formian worker, imp, pseudodragon, and quasit (7th level). Its alternate
type/subtype list adds a celestial hawk, fiendish Tiny viper, Small air,
earth, fire, and water elementals, shocker lizard, homunculus, and ice mephit.
The familiar's type and granted abilities have specific exceptions in the
source.

The source also gives alternate familiar tables for Tiny-or-smaller masters
(bat, ferret, hedgehog, mouse, screech owl, toad, and thrush) and Huge-or-
bigger masters (dire rat, leopard, monitor lizard, Medium owl, Small raven,
Medium viper, and wolverine), with familiar statistics and master benefits
(pp. 202–203). The feat catalog contains the *Complete Scoundrel* and
*Complete Warrior* expansion entries, but no DMG base Improved Familiar feat
or DMG familiar-option data. The class feature descriptions leave familiar
selection and statistics manual.

### Cohorts, mounts, and animal companions

The DMG's Special Cohorts table (pp. 199–200) gives 17 DM-approved examples
with level equivalents: blink dog, lammasu, werebear, avoral, bralani,
pegasus, unicorn, griffon, dragonne, satyr, hell hound, displacer beast, imp,
young green dragon, erinyes, quasit, and ettin. It applies the monster-PC ECL
rules and notes that existing familiars, special mounts, or animal companions
penalize a character's Leadership score. These are cohort options, not
standalone PC race definitions.

The unusual paladin-mount tables (pp. 204–205) add mounts by rider size and
minimum paladin level, then scale their Hit Dice, natural armor, Strength, and
Intelligence with the paladin. Medium-rider examples include dire wolves,
hippogriffs, Large monstrous spiders and sharks, unicorns, dire boars and
wolverines, giant eagles and owls, pegasi, rhinoceroses, sea cats, dire lions,
and griffons, as well as the listed ordinary, celestial, and fiendish horse
variants. Small-rider examples include Medium monstrous spiders, porpoises,
riding dogs (including fiendish), Medium sharks, warponies (including
celestial), dire bats, dire badgers, dire weasels, and monitor lizards. The
current special-mount feature leaves mount selection and advancement manual.

The animal-companion section (pp. 205–206) adds adjudication guidance about
habitat, loyalty, intelligence, and trained commands, but no new companion
list. The existing animal-companion feature likewise leaves selection,
advancement, and statistics manual.

### Epic characters

The DMG provides epic advancement guidance and class-specific progressions
for the PHB classes beyond 20th level (pp. 206–210), including the advancement
of class features, bonus feats, familiars, and special mounts. Epic feats are
covered as noted above; the epic class progressions and epic companion
advancement remain outside the verified implementation.

## Player's Handbook II: initial source inventory

The contents page (PDF p. 4) identifies four new base classes in Chapter 1:
Beguiler (p. 6), Dragon Shaman (p. 11), Duskblade (p. 19), and Knight (p. 24).
None appears in the current `ClassId` type or `classDefinitions` in
[domain.ts](../src/domain.ts), so all four are confirmed class-catalog gaps.
The source progressions and features for all four classes are inventoried
below. The Beguiler and Duskblade spell-list/access checks are recorded in the
Chapter 4 audit; no production class definitions have been added.

#### Beguiler (printed pp. 6–8)

The class is open to any race and alignment. It has a d6 Hit Die, 3/4 base
attack progression, good Will save, and 6 + Intelligence modifier skill points
per level. It is an Intelligence-based spontaneous arcane caster with a
20-level progression through 9th-level spells; on gaining access to a spell
level, it automatically knows every spell of that level on its class list.
Beguilers are proficient with simple weapons, hand crossbow, rapier, shortbow,
and short sword, plus light armor but no shields.

| Level | Feature | Source-verified behavior |
|---:|---|---|
| 1 | Armored Mage, Trapfinding | Avoids arcane spell failure in light armor for Beguiler spells only; can find traps with a Search DC above 20 and disarm magic traps. |
| 2 | Cloaked Casting, Surprise Casting | Cloaked Casting grants +1 spell save DC against a foe denied its Dexterity bonus to AC. A successful combat feint lets the Beguiler's next melee attack or spell against that foe deny its Dexterity bonus to AC before the Beguiler's next turn; the Beguiler must remain in melee, and the foe is not flat-footed. |
| 3, 7, 11, 15, 19 | Advanced Learning | At each listed level, permanently add one Sorcerer/Wizard enchantment or illusion spell no higher than the highest spell level the Beguiler knows. |
| 5, 10 | Bonus feats | Gain Silent Spell at 5th level and Still Spell at 10th level. |
| 6 | Improved Surprise Casting | Feint as a move action, or as a swift action with Improved Feint. |
| 8, 14, 20 | Cloaked Casting improvements | At 8th, gain +2 on caster-level checks to overcome spell resistance; at 14th, the save DC bonus becomes +2; at 20th, automatically overcome spell resistance. |

The class table is the source for its 20-level base attack, saves, and daily
spell progression. These source rules identify a catalog gap only; no
production class definition has been added.

#### Dragon Shaman (printed pp. 11–14, 18)

The class is open to any race, but a character with no non-neutral alignment
tendency cannot qualify. The chosen totem dragon must be within one alignment
step; changing to an incompatible alignment removes the class-granted abilities
until the character changes to a compatible totem by the book's ex-dragon
shaman procedure. The class has a d10 Hit Die, full base attack progression,
good Fortitude and Will saves, and 2 + Intelligence modifier skill points per
level. It has no spellcasting, is proficient with simple weapons, light and
medium armor, and shields except tower shields, and has Draconic as a bonus
language.

The 1st-level totem choice is a substantial rules choice: it determines three
additional class skills, breath-weapon energy and shape, and Draconic
Adaptation.

| Totem | Allowed alignments | Added class skills | Breath weapon | Draconic Adaptation |
|---|---|---|---|---|
| Black | NE, CE, CN | Hide, Move Silently, Swim | Acid line | Water breathing |
| Blue | NE, LE, LN | Bluff, Hide, Spellcraft | Electricity line | Ventriloquism at will |
| Brass | NG, CG, CN | Bluff, Gather Information, Survival | Fire line | Endure elements at will |
| Bronze | NG, LG, LN | Disguise, Survival, Swim | Electricity line | Water breathing |
| Copper | NG, CG, CN | Bluff, Hide, Jump | Acid line | Spider climb at will |
| Gold | NG, LG, LN | Disguise, Heal, Swim | Fire cone | Water breathing |
| Green | NE, LE, LN | Bluff, Hide, Move Silently | Acid cone | Water breathing |
| Red | NE, CE, CN | Appraise, Bluff, Jump | Fire cone | +5 competence bonus on Appraise and Search |
| Silver | NG, LG, LN | Bluff, Disguise, Jump | Cold cone | Feather fall at will |
| White | NE, CE, CN | Hide, Move Silently, Swim | Cold cone | Ignore movement penalties and Balance checks on ice |

| Level | Feature | Source-verified behavior |
|---:|---|---|
| 1, 5, 10, 15, 20 | Draconic Aura | Choose from Energy Shield, Power, Presence, Resistance, Senses, Toughness, and Vigor. Know three auras at 1st level and learn one more at each odd level through 9th; project one at a time as a swift action to affect yourself and allies within 30 feet. Its bonus scales from +1 to +5 at the listed levels. |
| 2, 8, 16 | Skill Focus | Gain Skill Focus in a totem-granted class skill; if all three are already covered, choose another Dragon Shaman class skill. |
| 3, 13 | Draconic Adaptation | Gain the totem-specific adaptation at 3rd level; at 13th, its effect can be shared with allies within 30 feet. |
| 4, then every 2 levels | Breath Weapon, Draconic Resolve | The totem-specific breath weapon starts at 2d6, increases by 1d6 every two levels, uses a Reflex save for half, and recharges after 1d4 rounds. Draconic Resolve grants immunity to paralysis, sleep, and dragons' frightful presence. |
| 6, 11 | Touch of Vitality | Spend a daily pool equal to 2 × class level × Charisma modifier to heal living creatures; from 11th level, points can also remove specified conditions or ability damage. |
| 7, 12, 17 | Natural Armor | Gain +1, +2, then +3 natural armor. |
| 9 | Energy Immunity | Become immune to the energy type of the totem's breath weapon. |
| 14 | Commune with Dragon Spirit | Use a commune-like ability to ask one question per three class levels; the ability has a seven-day reuse interval. |
| 19 | Draconic Wings | Gain a 60-foot fly speed with good maneuverability, reduced to 40 feet while carrying a medium load. |

The table on printed p. 12 supplies the complete base attack, save, aura, and
breath-damage progression; totem and aura choices make this more than a
single fixed feature track. No production class definition has been added.

#### Duskblade (printed pp. 19–21)

Duskblades may be any race or alignment. The class has a d8 Hit Die, full base
attack progression, good Fortitude and Will saves, and 2 + Intelligence
modifier skill points per level. It is an Intelligence-based spontaneous
arcane caster that learns a limited number of spells, progressing through
5th-level spells. It learns one spell at each class level and can replace a
known spell at 5th level and every later odd-numbered level; the replacement
must be the same spell level and at least two levels below the highest-level
spell it can cast. Duskblades are proficient with all martial weapons, all
armor, and all shields except tower shields. Class skills are Climb,
Concentration, Craft, Decipher Script, Jump, all Knowledge skills, Ride,
Sense Motive, Spellcraft, and Swim.

| Level | Feature | Source-verified behavior |
|---:|---|---|
| 1 | Arcane Attunement, Armored Mage (light) | Use *dancing lights*, *detect magic*, *flare*, *ghost sound*, and *read magic* a combined number of times per day equal to 3 + Intelligence modifier. Avoid arcane spell failure in light armor and light shields for Duskblade spells only. |
| 2 | Combat Casting | Gain Combat Casting as a bonus feat. |
| 3, 13 | Arcane Channeling | At 3rd, cast a touch spell as a standard action and deliver it through a melee attack without provoking an attack of opportunity. At 13th, channel it through each successful melee attack in a full attack. |
| 4, 7 | Armored Mage improvements | At 4th, avoid arcane spell failure in medium armor; at 7th, also avoid it with a heavy shield. Neither benefit applies to other spellcasting classes. |
| 5, 10, 15, 20 | Quick Cast | Cast one spell with a casting time of 1 standard action or less as a swift action, respectively 1, 2, 3, or 4 times per day. |
| 6, 11, 16, 18 | Spell Power | After injuring an opponent with a melee attack, gain +2 on caster-level checks to overcome spell resistance for the rest of the encounter; the bonus increases to +3, +4, and +5 at the listed levels. |

The class's limited spell list and spell-level access remain part of the Chapter
4 spell audit. No production class definition has been added.

#### Knight (printed pp. 24–28, 30)

No race restriction is given for knights, though the book describes some races
as more or less likely to follow the class. Knights must be lawful; a
nonlawful knight loses Knight's Challenge and any features that spend its uses
until returning to a lawful alignment. The class has a d12 Hit Die, full base
attack progression, good Fortitude and Will saves, and 2 + Intelligence
modifier skill points per level. It has no spellcasting and is proficient
with all simple and martial weapons, all armor, and all shields except tower
shields. Class skills are Climb, Handle Animal, Intimidate, Jump, Knowledge
(nobility and royalty), Ride, and Swim.

| Level | Feature | Source-verified behavior |
|---:|---|---|
| 1 | Knight's Challenge, Fighting Challenge +1, Knight's Code | Uses per day equal half class level + Charisma modifier (minimum 1). Fighting Challenge is a swift action against one eligible foe (Intelligence 5+, language, and CR at least class level – 2); it grants +1 morale on Will saves and on attacks and damage against that foe for 5 + Charisma modifier rounds. The code normally makes you forgo your own +2 flanking attack bonus (keeping it is a violation), forbids attacking flat-footed foes, and forbids lethal damage to helpless foes; violations cost a challenge use or impose –2 on attacks and saves for the day. |
| 2, 11, 20 | Shield Block | During your action, designate one opponent and gain +1 shield bonus to AC against it; the bonus rises to +2 at 11th and +3 at 20th. Mounted Combat is also gained at 2nd level. |
| 3 | Bulwark of Defense | An opponent starting its turn in your threatened area treats the squares you threaten as difficult terrain. |
| 4, 9 | Armor Mastery | Ignore the speed reduction from medium armor at 4th level and heavy armor at 9th. |
| 4 | Test of Mettle | Spend a challenge use to provoke qualifying enemies within 100 feet (CR at least class level – 2, Intelligence 5+, language, and line of sight/effect) to make a Will save (DC 10 + 1/2 class level + Charisma modifier); failures prioritize attacking you for 5 + Charisma modifier rounds. A target can be affected only once per day. |
| 5, 10, 15 | Bonus Feat | Choose from Animal Affinity, Diehard, Endurance, Great Fortitude, Iron Will, Quick Draw, Ride-By Attack, Spirited Charge, Trample, or Weapon Focus (lance), meeting prerequisites. |
| 5 | Vigilant Defender | Opponents attempting to Tumble through your threatened area take a DC increase equal to your class level. |
| 6, 14 | Shield Ally | At 6th, use an immediate action to absorb half the damage from physical attacks against an adjacent ally. At 14th, once per round you can absorb all damage from one such attack and continue to absorb half from other attacks. |
| 7, 13, 19 | Fighting Challenge improvement | The attack, damage, and Will-save morale bonuses increase to +2, +3, and +4. |
| 8 | Call to Battle | Spend a challenge use as a swift action to grant an ally another save against a fear effect, with a bonus equal to your Charisma modifier. |
| 12 | Daunting Challenge | Spend a challenge use to make weaker enemies within 100 feet (CR below class level – 2, Intelligence 5+, able to hear you, and able to speak or understand a language) save or become shaken; each target can be affected once per day. |
| 16 | Bond of Loyalty | Spend a challenge use as a free action to attempt another save against a mind-affecting effect; usable once per round, even while controlled. |
| 17 | Impetuous Endurance | No longer automatically fail a saving throw on a natural 1. |
| 20 | Loyal Beyond Death | Spend challenge uses to continue acting for another round after an effect reduces you to 0 or fewer hit points, provided it has not destroyed your body. |

The printed table supplies the complete 20-level attack, save, and feature
progression. Knight's Challenge and its dependent features, alignment/code
restrictions, and bonus-feat choices are material implementation requirements;
no production class definition has been added.

Chapter 2, "Expanded Classes" (pp. 31–70), covers Barbarian, Bard, Cleric,
Druid, Favored Soul, Fighter, Hexblade, Marshal, Monk, Paladin, Ranger, Rogue,
Scout, Sorcerer, Swashbuckler, Warlock, Warmage, and Wizard. These sections
explicitly offer alternative class features that replace normal class
features, as well as sample character themes, backgrounds, and starting
packages (p. 31; PDF p. 32). The alternative features are in-scope selectable
options, not merely character-building guidance. The per-class feature names,
replacement levels, and core benefits are inventoried in the table below and
were visually checked against all 21 printed feature entries across the 18
class sections.

An initial spot-check confirms these selectable alternatives are not present in
the current TypeScript catalog:

| Class | Alternative feature | Replaces / notes | PHB II page |
|---|---|---|---:|
| Barbarian | Berserker Strength | Replaces rage and its later improvements; automatically activates below 5 × barbarian level hit points. Grants +4 Strength, +2 saves, DR 2/—, and –2 AC; improves at 11th and 20th level. | 33 |
| Bard | Bardic Knack | 1st-level replacement for bardic knowledge; use half bard level (rounded up) instead of skill ranks for skill checks. It does not allow taking 10, and trained-only skills still require an actual rank. | 35 |
| Cleric | Spontaneous Domain Casting | Replaces spontaneous cure/inflict conversion with spontaneous casting of domain spells. | 37 |
| Druid | Spontaneous Rejuvenation | 1st-level replacement for spontaneous *summon nature's ally* conversion; sacrifice a prepared spell as a standard action to grant yourself and allies within 30 feet fast healing equal to the spell's level for 3 rounds. It does not stack with itself. | 39 |
| Druid | Shapeshift | Replaces wild shape with at-will supernatural forms activated as a swift action, with level-based improvements and no daily-use or duration limit. The druid retains normal Hit Dice, hit points, base attack bonus, saves, and skills; form restrictions include no speech, spellcasting, or item activation. | 40 |
| Favored Soul | Deity's Favor | 3rd-level replacement for the deity's weapon focus and weapon specialization features (proficiency remains); whenever you cast a favored soul spell, choose an affected creature, including yourself, to gain temporary hit points equal to 3 × the spell's level. They last 1 minute per spell level; at 12th level you can choose any number of affected allies. | 43 |
| Fighter | Elusive Attack | 6th-level; replaces the 6th-level fighter bonus feat; one attack as a full-round action grants +2 dodge AC until the next turn (+4 at 11th, +6 at 16th). | 44 |
| Fighter | Counterattack | 12th-level; replaces the 12th-level fighter bonus feat; one melee attack as a full-round action enables an immediate melee counterattack before the next turn. | 45 |
| Fighter | Overpowering Attack | 16th-level; replaces the 16th-level fighter bonus feat; one full-round attack deals double damage, as do any other attacks before the next turn. | 45 |
| Hexblade | Dark Companion | 4th-level; replaces the familiar; creates a 5-foot illusory companion (24 hours and 100 gp to create) that gives adjacent enemies -2 AC and saves. | 47 |
| Marshal | Adrenaline Boost | 4th-level replacement for grant move action; once per day, use a standard action to grant allies within 30 feet (not yourself) temporary hit points equal to your marshal level, doubled for an ally at or below half its normal hit points. Affected allies need Intelligence 3+ and must understand your language; the temporary hit points last 1 minute per marshal level. | 49 |
| Monk | Decisive Strike | 1st-level replacement for flurry of blows; as a full-round action, make one unarmed or monk-weapon attack at highest base attack bonus with a –2 penalty, dealing double damage on a hit (as do other attacks before your next turn). The penalty lessens at 5th and disappears at 9th; at 11th you can make two attacks, each against a different creature. A stunning attack's save DC increases by 2. | 51 |
| Paladin | Charging Smite | 5th-level replacement for the special mount; when you use smite evil on a charge, add 2 points of damage per paladin level to the evil creature hit. A missed charge does not expend the smite. | 53 |
| Ranger | Distracting Attack | 4th-level replacement for the animal companion; a weapon hit makes the target count as flanked by you for allies' attacks until an ally attacks it or your next turn begins. It has no effect on creatures that cannot be flanked. | 55 |
| Rogue | Disruptive Attack | Beginning at 4th level, when you hit a flat-footed or flanked target, you may sacrifice sneak attack damage to impose a –5 AC penalty for 1 round. Multiple hits on one target do not stack; this works even against creatures immune to sneak attack damage. | 57 |
| Scout | Dungeon Specialist | 3rd-level; replaces fast movement at 3rd and 11th and evasion at 5th. Grants a climb speed (half land speed, rounded down to a 5-foot increment; equal to land speed at 11th) and permits light-weapon attacks while climbing. At 5th, gains +2 AC while on the ground beside a wall and denies flank attack bonuses; the benefits are lost in medium/heavy armor or load. | 59 |
| Sorcerer | Metamagic Specialist | 1st-level replacement for the familiar; apply known metamagic feats without increasing casting time, a number of times per day equal to 3 + Intelligence modifier (minimum 1). | 61 |
| Swashbuckler | Shield of Blades | 5th-level replacement for the dodge bonus and its improvements at 10th, 15th, and 20th; gain a +2 shield bonus to AC when attacking with at least two light weapons, increasing by +1 every 5 levels. Lost in medium/heavy armor or load. | 63 |
| Warlock | Fiendish Flamewreath | 8th-level replacement for fiendish resilience and its improvements at 13th and 18th; once per day, a free action surrounds you with flames for up to 2 minutes, dealing 1d6 fire damage to creatures striking you with their body or a handheld weapon (not exceptional-reach weapons). Damage rises to 2d6 at 13th and 5d6 at 18th. | 65 |
| Warmage | Eclectic Learning | At 3rd, 6th, 11th, or 16th level, replaces Advanced Learning at that level; adds a sorcerer/wizard spell of any school to the warmage list at one level higher. | 67 |
| Wizard | Immediate Magic | 1st-level; replaces the familiar; requires specialization and grants a school-specific spell-like ability activated as an immediate action, usable Int modifier/day (minimum 1). | 68 |

An OCR sweep across Chapter 2 identified 21 candidate alternative features,
including Elusive Attack, which the initial spot-check missed. Targeted visual
checks confirm all 21 feature headings and the replacement mechanics summarized
below, across all 18 class sections.

Visual checks of printed pp. 33, 35, and 39–40 confirm the Barbarian, Bard, and
Druid feature details above. Printed p. 37 confirms Spontaneous Domain Casting
is a 1st-level option for spontaneously casting selected domain spells.
Additional visual checks of printed pp. 43, 49, 53, and 55 confirm the Favored
Soul, Marshal, Paladin, and Ranger feature details above. Checks of printed p.
45 confirm the fighter alternatives' replacement levels and
core benefits: Elusive Attack replaces the 6th-level bonus feat and grants a
scaling dodge bonus after a single attack; Counterattack replaces the
12th-level bonus feat and enables an immediate melee counterattack; and
Overpowering Attack replaces the 16th-level bonus feat and doubles damage on
the chosen attack and subsequent attacks before the next turn. Printed p. 47
confirms Dark Companion's 4th-level creation cost and its -2 penalty to
adjacent enemies' AC and saves. Additional visual checks of printed pp. 51, 57,
59, 61, 63, and 65–68 confirm the Monk, Rogue, Scout, Sorcerer, Swashbuckler,
Warlock, Warmage, and Wizard entries. This completes the targeted visual pass
over the PHB II alternative class features.

Chapter 3's 105 feats are already cataloged and inventoried in
[rules-coverage.md](./rules-coverage.md); that inventory should not be
duplicated. A selected visual mechanics pass of printed pp. 71–75 checked
*Acrobatic Strike*, *Active Shield Defense*, *Adaptable Flanker*, *Agile Shield
Fighter*, and *Arcane Accompaniment*; the catalog summaries were clarified and
the effects remain manual. Chapter 4 contains new spells (pp. 95–128), but the
current spell loader imports the SRD and Dragonlance catalogs only. The initial
PHB II spell inventory has 122 name candidates; the Chapter 4 class-list checks
and the cross-check against the full Beguiler and Duskblade lists are complete,
with three source discrepancies recorded below. A normalized-name comparison
against the current spell catalog also found no matches; this does not verify
mechanics or source attribution. The contents list no dedicated race or
subrace chapter. It does include Race Rebuilding
(p. 198), a rebuild-quest procedure for changing an existing character's
race, not a new playable race or subrace. It addresses racial traits, feat
eligibility, racial substitution levels, level adjustment, and racial Hit
Dice; the latter specifically calls for DM approval.

#### Chapter 4 spells: inventory and cross-check

The Chapter 4 class lists (printed pp. 96–101; PDF pp. 97–102) have been
re-extracted and reconciled against the spell descriptions (printed
pp. 101–128). The cleaned list extraction identifies 122 distinct spell-title
candidates across the Assassin, Bard, Beguiler, Blackguard, Cleric, Druid,
Duskblade, Paladin, Ranger, and Sorcerer/Wizard lists. Of these, 117 match
description-title OCR exactly. Visual checks corrected four OCR misreads:
*Blade of Bload* to *Blade of Blood* (p. 103), *Wheim, Mass* to *Whelm, Mass*
(p. 128), *Chain Dispei* to *Chain Dispel* (p. 105), and *Summon Galem* to
*Summon Golem* (p. 126). The remaining title conflict is *Dance of Blades* in
the class list versus *Dancing Blade* in its description. Thus all 122 list
candidates are accounted for in the description section, with the title
conflict preserved rather than silently normalized. The earlier 119-title
count came from mixed, noisy OCR and is superseded; it was not a reliable
unique-spell count. The two dual-school entries (*Doom Scarabs* and *Slashing
Dispel*) are each one spell and do not add distinct titles.

The 122 candidate titles have no normalized-name matches among the 716 SRD
and 27 Dragonlance spell records currently in the project, using the existing
`normalizeSpellName` rules. This is a name-only comparison, not a confirmation
of mechanics or a final implementation gap list; near-duplicates and
source-specific aliases still need review.

Source-page cross-checks of the Assassin, Bard, Beguiler, Blackguard, Druid,
Duskblade, Paladin, and Ranger lists found their class levels in the spell
descriptions.
Two discrepancies remain unresolved within Chapter 4's class-list and
spell-description data: the Cleric list (p. 98) places
*Renewed Vigor* at 5th level, but its description (p. 123) lists Cleric 4; and
the Bard and Sorcerer/Wizard list (p. 101) calls the 5th-level spell *Dance
of Blades*, while its description (p. 109) is titled *Dancing Blade* (both
give Bard 5 and Sorcerer/Wizard 5). Treat these as source discrepancies, not
separate spells or a basis for silently changing catalog levels. The
Sorcerer/Wizard list has now been cross-checked at levels 1–9, with no
additional level discrepancies. Its 4th-level list prints *Doom Scarabs*
under both Conjuration and Necromancy and *Slashing Dispel* under Abjuration
and Evocation; their descriptions confirm each is one dual-school spell, not
separate entries. A spell repeated in multiple class lists is shared class
access, not a separate spell; preserve the class-specific levels when
resolving such entries.

The full Beguiler and Duskblade class spell lists (printed pp. 11 and 24) have
now been cross-checked against the Chapter 4 class lists. Their asterisk-marked
PHB II additions match the corresponding class levels, except for one
unresolved title conflict: the Beguiler list calls its 2nd-level spell
*Whelming Burst* (p. 11), while the Chapter 4 list and spell description call
it *Whelming Blast* (pp. 97 and 128). Treat these as one spell, not separate
entries. The printed pages themselves disagree, so preserve both source
titles and do not silently normalize them.

## Complete Adventurer: first-pass option inventory

The printed contents page (PDF p. 4) maps the class, skill/feat, and spell
chapters. The following is a source inventory, not a mechanics or eligibility
audit.

### Classes

The three new base classes are Ninja (p. 5), Scout (p. 10), and Spellthief
(p. 13). None appears in the current `ClassId` type or `classDefinitions` in
[domain.ts](../src/domain.ts), so all three are class-catalog gaps.

The book presents 26 prestige classes; “Picking a Prestige Class” is an
introductory section, not a class:

| Prestige class | Printed page |
|---|---:|
| Animal Lord | 22 |
| Beastmaster | 26 |
| Bloodhound | 28 |
| Daggerspell Mage | 31 |
| Daggerspell Shaper | 36 |
| Dread Pirate | 39 |
| Dungeon Delver | 42 |
| Exemplar | 44 |
| Fochlucan Lyrist | 47 |
| Ghost-Faced Killer | 51 |
| Highland Stalker | 54 |
| Maester | 56 |
| Master of Many Forms | 58 |
| Nightsong Enforcer | 60 |
| Nightsong Infiltrator | 62 |
| Ollam | 66 |
| Shadowbane Inquisitor | 68 |
| Shadowbane Stalker | 70 |
| Shadowmind | 74 |
| Spymaster | 76 |
| Streetfighter | 79 |
| Tempest | 81 |
| Thief-Acrobat | 83 |
| Vigilante | 85 |
| Virtuoso | 89 |
| Wild Plains Outrider | 92 |

None of these appears in the current `PrestigeClassId` union in
[domain.ts](../src/domain.ts); all 26 are catalog gaps. Prerequisites,
progressions, features, and overlap with other sourcebooks remain to be
audited.

### Skills and feats

Chapter 3 (pp. 95–114) expands 18 skill descriptions and covers animal trick
capacity. The p. 101 sidebar's Extra Tricks feat is for animals or magical
beasts with Intelligence 1 or 2 that know at least one trick; it adds capacity
for three tricks and can be selected multiple times. This is not a skill trick.
The app's 42-option skill-trick catalog is covered under Complete Scoundrel in
[rules-coverage.md](./rules-coverage.md); Complete Adventurer adds no skill
tricks.

The contents list 54 feat titles: 45 general feats, three Bardic Music feats,
and six Wild feats. All 54 have matching Complete Adventurer-attributed entries
in [featCatalogData.ts](../src/data/featCatalogData.ts); this inventory is not
a full mechanics audit. Selected prerequisite and benefit checks are recorded
in [rules-coverage.md](./rules-coverage.md), including a visual check of five
Wild feat benefits on printed p. 111 and a p. 110 check of the three Bardic
Music feats. Printed pp. 104–108 now also verify five performance and devotion
feats, including explicit daily-use, visibility, plant-immunity, and duration
limits. A pp. 105–106 check added five combat/concentration feats and corrected
Dual Strike's shared-roll and critical/precision limits. Printed pp. 107–108
verify Jack of All Trades, Leap Attack, Mobile Spellcasting, Natural Bond, and
Obscure Lore; their prerequisites and benefits already matched. Printed
pp. 108–109 verify Open Minded, Oversized Two-Weapon Fighting, Power Throw,
Quick Reconnoiter, and Razing Strike with no catalog changes. The final four
entries—Staggering Strike, Subsonics, Tactile Trapsmith, and Versatile
Performer—were checked on printed p. 109; only Versatile Performer's summary
needed clarification. *Lyric Spell*'s
prerequisite is now evaluated by actual second-level spontaneous arcane
casting. *Extra Music* on p. 109 was also
confirmed to grant four additional uses per repeatable selection. The Trick
Capacity sidebar adds Extra Tricks as a 55th candidate, but it has no catalog
entry. Because it applies to animal and magical-beast creatures rather than
ordinary player characters, whether it belongs in the current feat catalog
remains unresolved.

- **General:** Appraise Magic Value, Ascetic Hunter, Ascetic Knight, Ascetic
  Mage, Ascetic Rogue, Brachiation, Brutal Throw, Combat Intuition, Danger
  Sense, Death Blow, Deft Opportunist, Deft Strike, Devoted Inquisitor,
  Devoted Performer, Devoted Tracker, Disguise Spell, Dive for Cover, Dual
  Strike, Expert Tactician, Extra Music, Extraordinary Concentration,
  Extraordinary Spell Aim, Force of Personality, Goad, Green Ear, Hear the
  Unseen, Improved Diversion, Improved Flight, Improved Swimming, Insightful
  Reflexes, Jack of All Trades, Leap Attack, Lingering Song, Mobile
  Spellcasting, Natural Bond, Obscure Lore, Open Minded, Oversized
  Two-Weapon Fighting, Power Throw, Quick Reconnoiter, Razing Strike,
  Staggering Strike, Subsonics, Tactile Trapsmith, and Versatile Performer.
- **Bardic Music:** Chant of Fortitude, Ironskin Chant, and Lyric Spell.
- **Wild:** Blindsense, Climb Like an Ape, Cougar’s Vision, Hawk’s Vision,
  Savage Grapple, and Scent.
- **Sidebar:** Extra Tricks.

### Spells

Chapter 5 (pp. 137–158) has class-level lists for Assassin, Bard, Cleric,
Druid, Paladin, Ranger, and Sorcerer/Wizard, followed by 70 spell-description
headings. The names below were checked against the PDF text. None has a
normalized-name match among the current 743 spell records using the existing
`normalizeSpellName` rules. This is a name-only comparison; class levels,
mechanics, and near-duplicate/source attribution checks remain.

Absorb Weapon; Accelerated Movement; Allegro; Arrow Mind; Arrow Storm;
Balancing Lorecall; Blade Storm; Bladeweave; Bloodhound; Branch to Branch;
Cacophonic Shield; Cloak of the Sea; Critical Strike; Daggerspell Stance;
Dirge of Discord; Dissonant Chord; Distort Speech; Distract Assailant;
Divine Insight; Easy Climb; Easy Trail; Embrace the Wild; Entangling Staff;
Exacting Shot; Expeditious Retreat, Swift; Fly, Swift; Focusing Chant;
Foebane; Forestfold; Golem Strike; Grave Strike; Guided Shot; Harmonic
Chorus; Haste, Swift; Hawkeye; Healing Lorecall; Healthful Rest; Herald’s
Call; Hindsight; Hymn of Praise; Improvisation; Infernal Threnody; Insidious
Rhythm; Insightful Feint; Inspirational Boost; Instant Locksmith; Instant
Search; Invisibility, Swift; Iron Silence; Joyful Noise; Listening Coin;
Listening Lorecall; Master’s Touch; Mindless Rage; Nature’s Favor;
Nightstalker’s Transformation; Protégé; Shadow Form; Sniper’s Eye; Sniper’s
Shot; Sonic Weapon; Spectral Weapon; Speechlink; Tactical Precision; Train
Animal; Vine Strike; Wail of Doom; War Cry; Wracking Touch; and Wraithstrike.

The PDF text check corrected three OCR errors in the outline labels: *Grave
Strike*, *Guided Shot*, and *Infernal Threnody*. The contents do not list a
dedicated new race or subrace chapter; verify any race-specific options
encountered in the class and feat audits rather than treating the starting
packages as new races.

## Complete Arcane: first-pass option inventory

The printed contents page (PDF p. 4) identifies Chapters 1–4 and the arcane
monster chapter as option-bearing sections. This inventory maps candidates;
it does not verify their mechanics or player-character eligibility.

### Classes

The three new base classes are Warlock (p. 5), Warmage (p. 10), and Wu Jen
(p. 14). None appears in the current `ClassId` type or `classDefinitions` in
[domain.ts](../src/domain.ts), so all three are class-catalog gaps.

The contents list 19 prestige classes:

| Prestige class | Printed page |
|---|---:|
| Acolyte of the Skin | 19 |
| Alienist | 21 |
| Argent Savant | 24 |
| Blood Magus | 26 |
| Effigy Master | 30 |
| Elemental Savant | 32 |
| Enlightened Fist | 34 |
| Fatespinner | 37 |
| Geometer | 39 |
| Green Star Adept | 41 |
| Initiate of the Sevenfold Veil | 44 |
| Mage of the Arcane Order | 48 |
| Master Transmogrifist | 51 |
| Mindbender | 54 |
| Seeker of the Song | 56 |
| Sublime Chord | 60 |
| Suel Arcanamach | 63 |
| Wayfarer Guide | 65 |
| Wild Mage | 68 |

None appears in the current `PrestigeClassId` union in
[domain.ts](../src/domain.ts). Their prerequisites, progressions, features,
and overlap with other sourcebooks remain to be audited.

### Feats, spells, and invocations

Chapter 3 presents Arcane Feats (pp. 71–84); its PDF outline contains 64 feat
title candidates. The current feat data has a corresponding entry or generated
family for each candidate. Energy Substitution and Energy Admixture are
represented by energy-specific selections, and six spell-like feats are
generated from a shared definition. Practiced Spellcaster and Transdimensional
Spell are represented with Complete Divine attribution despite also appearing
in this book. This is name-level coverage, not a mechanics or full source
attribution audit. The appendix separately lists Epic Feats (p. 190), which
are not included in the 64-title count.

Chapter 4 (pp. 85–137) includes new spell lists for Assassin, Bard, Cleric,
Druid, Ranger, and Sorcerer/Wizard, plus Warmage and Wu Jen spell lists. The
spell-description outline contains 148 titles (pp. 96–130). Comparing the
outline with the printed spell text resolved 14 OCR errors: Aiming at the
Target, Anticipate Teleportation, Bands of Steel, Body Outside Body, Corpse
Candle, Discern Shapechanger, Earthbolt, Freezing Fog, Hail of Stone,
Resonating Bolt, Ring of Blades, Servant Horde, Vitriolic Sphere, and Whirling
Blade. `Anticipate Teleportation, Greater` is split across lines in the PDF
text but is not an OCR error. The corrected names have zero normalized-name
matches among the current 743 spell records. Class-level access and spell
mechanics remain unaudited.

The Warlock invocation table is on p. 130, with 50 invocation descriptions on
pp. 132–137. The current class model has no Warlock `ClassId` or invocation
choice catalog. The feat catalog does include Extra Invocation and two feats
that mention warlock invocations, but their choice/effect tracking is manual;
the invocation options themselves are not selectable.

### Arcane creature options

Chapter 6 (p. 151) includes the Effigy Creature, four Elemental Grue forms,
four Elemental Monolith forms, the Pseudonatural Creature, and Spellstitched.
Screen these templates and creatures for a player-character path before
treating them as selectable character options. The contents list no dedicated
new race or subrace chapter.

## Complete Champion: first-pass option inventory

The printed contents (PDF p. 4) place divine character options in Chapter 2
(pp. 45–112), new spells in Chapter 3 (pp. 113–130), and divine items in
Chapter 4 (beginning on p. 131). This is a source inventory; mechanics,
eligibility, and full source attribution still need review.

### Alternate class features

The book adds no base classes. Chapter 2 presents 24 alternate class features
across ten existing classes:

- **Barbarian:** Spiritual Totem, Totem Manifestation, View the Spirit World.
- **Bard:** Healing Hymn, Hymn of Fortification.
- **Cleric:** Pool of Healing.
- **Fighter:** Aligned Strike, Armor of God, Resolute.
- **Monk:** Holy Strike, Prayerful Meditation.
- **Paladin:** Holy Warrior, Underdark Knight.
- **Ranger:** Champion of the Wild, Spiritual Connection, Spiritual Guide.
- **Rogue:** Antiquarian, Death’s Ruin, Friend’s Evasion, Holy Stalker.
- **Sorcerer:** Divine Companion, Domain Access.
- **Wizard:** Domain Granted Power, Spontaneous Divination.

### Feats and organizations

The contents list 42 feat descriptions across domain, divine, reserve,
tactical, and wild categories. All 42 names have corresponding name-property
entries in [featCatalogData.ts](../src/data/featCatalogData.ts) after
normalizing the apostrophe in Venom’s Gift. This is a name-level inventory,
while selected source checks are recorded in
[rules-coverage.md](./rules-coverage.md). Printed pp. 54–56 verify Air
Devotion, Animal Devotion, Awesome Smite, Battle Blessing, and Bestial Charge
without catalog corrections. Other mechanics still require review.
Printed pp. 56–58 add source checks for Chaos Devotion, Charnel Miasma, Death
Devotion, Destruction Devotion, and Earth Devotion; this batch corrected Chaos
Devotion repeatability/die scaling and clarified grave-scent and spike-attack
details.
Printed pp. 58–59 verify Elemental Essence, Evil Devotion, Fire Devotion,
Fragile Construct, and Good Devotion; their represented prerequisites and
benefits matched without catalog corrections.
Printed pp. 59–60 verify Great and Small, Healing Devotion, Holy Potency, Holy
Warrior, and Imbued Healing. Great and Small and Imbued Healing received
summary clarifications for size-change and carrier-effect limits.
Printed pp. 60–61 verify Knowledge Devotion, Law Devotion, Luck Devotion,
Magic Devotion, and Mitigate Suffering without catalog corrections.
Printed pp. 61–62 verify Plant Devotion, Protection Devotion, Protective Ward,
Retrieve Spell, and Spiritual Counter without catalog corrections.
Printed pp. 62–63 verify Spontaneous Domains, Strength Devotion, Sun Devotion,
Swift Call, and Swift Wild Shape; Swift Call's normal action was corrected
from standard to full-round, and Strength Devotion now states that its slam
does not provoke.
Printed pp. 62–64 verify Touch of Healing through Water Devotion. Venom's Gift
now enforces ordinary wild shape in addition to plant-form access and two
other wild feats.

Air Devotion; Animal Devotion; Awesome Smite; Battle Blessing; Bestial Charge;
Chaos Devotion; Charnel Miasma; Death Devotion; Destruction Devotion; Earth
Devotion; Elemental Essence; Evil Devotion; Fire Devotion; Fragile Construct;
Good Devotion; Great and Small; Healing Devotion; Holy Potency; Holy Warrior;
Imbued Healing; Knowledge Devotion; Law Devotion; Luck Devotion; Magic
Devotion; Mitigate Suffering; Plant Devotion; Protection Devotion; Protective
Ward; Retrieve Spell; Spiritual Counter; Spontaneous Domains; Strength
Devotion; Sun Devotion; Swift Call; Swift Wild Shape; Touch of Healing; Travel
Devotion; Trickery Devotion; Umbral Shroud; Venom’s Gift; War Devotion; and
Water Devotion.

Holy Warrior appears both as a Paladin alternate class feature and a feat;
keep these as separate option types during catalog reconciliation.

Four PC organizations are described: Disciples of Legend, Guardians of the
Green, the Paragnostic Assembly, and Pelor’s Shadow Guard. Chapter 1 also
details churches and domain affiliations for the 22 standard domains; treat
these as deity/affiliation coverage, not as 22 new domain definitions.

### Prestige classes

The contents list 11 prestige classes. None appears in the current
`PrestigeClassId` union in [domain.ts](../src/domain.ts).

| Prestige class | Printed page |
|---|---:|
| Fist of the Forest | 80 |
| Forest Reeve | 82 |
| Holt Warden | 84 |
| Mythic Exemplar | 86 |
| Ordained Champion | 90 |
| Paragnostic Apostle | 94 |
| Paragnostic Initiate | 97 |
| Sanctified One | 99 |
| Shadowspy | 105 |
| Shadowstriker | 108 |
| Squire of Legend | 110 |

### Spells

Chapter 3 has 52 spell-description headings (pp. 116–130). A normalized
name-only comparison against the current 743 spell records found one exact
title match, Divine Retribution. The Complete Champion spell is cleric 5 and
retaliates against creatures that harm the caster; the Dragonlance Campaign
Setting record is cleric 9 and absorbs and reflects attacks of a chosen energy
type. These are distinct spells despite sharing a name, so preserve the source
distinction rather than treating the title match as a duplicate. The other 51
titles have no exact-name match; class levels, mechanics, and near-duplicate
names remain to be audited.

Aligned Aura; Benediction; Bewildering Mischance; Bewildering Substitution;
Bewildering Visions; Bleed; Body Ward; Bolster Aura; Conduit of Life; Confound;
Dampen Magic; Darts of Life; Deific Bastion; Divine Presence; Divine
Retribution; Door of Decay; Execration; Footsteps of the Divine; Forest Child;
Forest Eyes; Forest Voice; Healing Circle; Iconic Manifestation; Impede;
Interfaith Blessing; Light of Courage; Light of Faith; Light of Purity; Light
of Wisdom; Lore of the Gods; Mark of Sin; Master Cavalier; Metal Fang; Moral
Façade; Phantom Charge; Profane Item; Ravenous Darkness; Rejuvenating Light;
Sacred Item; Seed of Life; Soul Ward; Spiritual Advisor; Spiritual Guardian;
Subdue Aura; Substitute Domain; Summon Holy Symbol; Surge of Fortune; Touch of
Restoration; Turn Anathema; War-Mount; Weight of Sin; and Wooden Blight.

The divine-item options beginning on p. 131 and the detailed mechanics of
affiliations, alternate class features, feats, and prestige classes remain for
follow-up.

## Complete Divine: first-pass option inventory

The printed contents (PDF p. 4) place three new base classes in Chapter 1
(pp. 6–18), prestige classes in Chapter 2 (pp. 19–76), feats and epic divine
options in Chapter 3 (pp. 77–90), relics in Chapter 4 (beginning on p. 91),
and domains and spells in Chapter 7 (pp. 135–190). This is an inventory and
catalog comparison, not a mechanics or eligibility audit.

### Classes

The three new base classes are Favored Soul (p. 6), Shugenja (p. 10), and
Spirit Shaman (p. 14). None appears in the current `ClassId` type in
[domain.ts](../src/domain.ts).

### Prestige classes

The main book presents 24 prestige classes; none appears in the current
`PrestigeClassId` union in [domain.ts](../src/domain.ts).

| Prestige class | Printed page |
|---|---:|
| Black Flame Zealot | 21 |
| Blighter | 23 |
| Church Inquisitor | 26 |
| Consecrated Harrier | 28 |
| Contemplative | 30 |
| Divine Crusader | 33 |
| Divine Oracle | 34 |
| Entropomancer | 36 |
| Evangelist | 39 |
| Geomancer | 41 |
| Holy Liberator | 45 |
| Hospitaler | 48 |
| Pious Templar | 50 |
| Radiant Servant of Pelor | 52 |
| Rainbow Servant | 54 |
| Sacred Exorcist | 56 |
| Sacred Fist | 59 |
| Seeker of the Misty Isle | 61 |
| Shining Blade of Heironeous | 63 |
| Stormlord | 65 |
| Temple Raider of Olidammara | 67 |
| Ur-Priest | 70 |
| Void Disciple | 72 |
| Warpriest | 74 |

The PDF also includes a Complete Divine Web Enhancement with four more
prestige-class candidates: Dweomerkeeper, Master of Shrouds, Moon Guardian,
and Nightcloak. These bring the source inventory to 28 prestige-class
candidates; their mechanics and any overlap with other books remain to be
checked.

### Feats and epic options

Chapter 3 lists 40 standard feat titles and three optional Faith Feats; the
epic section lists 10 more. The outline’s “Sancitify Relic” is an OCR error;
the printed title is Sanctify Relic. The current feat data already generates
Practiced Spellcaster per spellcasting class with Complete Divine attribution,
and includes Transdimensional Spell with that attribution even though it also
appears in Complete Arcane. A follow-up search across `src/`, including
generated catalog data, found no definitions for these ten non-epic titles,
confirming them as catalog gaps. The optional Faith Feats use the book's Faith
Point system (Table 3-2, p. 86), so their availability and resource tracking
need an explicit campaign decision:

Extra Wild Shape; Grizzly’s Claws; Lion’s Pounce; Oaken Resilience; Serpent’s
Venom; Swim Like a Fish; Wolverine’s Rage; Pious Defense; Pious Soul; and
Pious Spellsurge.

The 40 standard titles are Arcane Disciple; Augment Healing; Boar’s Ferocity;
Cheetah’s Speed; Consecrate Spell; Corrupt Spell; Disciple of the Sun; Divine
Metamagic; Divine Spell Power; Domain Focus; Domain Spontaneity; Eagle’s Wings;
Elemental Healing; Elemental Smiting; Elephant’s Hide; Empower Turning; Extra
Wild Shape; Fast Wild Shape; Glorious Weapons; Grizzly’s Claws; Improved
Smiting; Lion’s Pounce; Oaken Resilience; Practiced Spellcaster; Profane Boost;
Quicken Turning; Rapid Spell; Reach Spell; Sacred Boost; Sacred Healing;
Sanctify Relic; Serpent’s Venom; Spell Focus; Spontaneous Healer; Spontaneous
Summoner; Spontaneous Wounder; Swim Like a Fish; Transdimensional Spell; True
Believer; and Wolverine’s Rage. The optional Faith Feats are Pious Defense,
Pious Soul, and Pious Spellsurge.

A search of the feat-name definitions found no entry for any of the 10 epic
feats, confirming them as catalog gaps: Bonus Domain; Epic Devotion; Holy
Strike; Magical Beast Wild Shape; Negative Energy Burst; Positive Energy
Aura; Spectral Strike; Undead Mastery; Unholy Strike; and Zone of Animation.
Epic eligibility and support remain to be audited.

### Domains and spells

The outline lists 20 new domains. Its “Myticism” and “Prestilence” labels are
OCR errors; the printed names are Mysticism and Pestilence. Seventeen names
are absent from the current `ClericDomainId` union in
[clericDomainIds.ts](../src/data/clericDomainIds.ts). Community, Liberation,
and Pestilence exist there only as Dragonlance-sourced domains, not as
Complete-Divine-sourced definitions. Check source-specific granted powers and
spell lists before reusing those IDs.

Celerity; Cold; Community; Competition; Creation; Domination; Dream; Force;
Glory; Inquisition; Liberation; Madness; Mind; Mysticism; Oracle; Pact;
Pestilence; Purification; Summoner; and Weather.

Chapter 7 provides new spell lists for Bard, Blackguard, Cleric, Druid,
Paladin, Ranger, Shugenja, and Sorcerer/Wizard, plus 128 spell-description
titles. All 128 outline titles were confirmed against the printed spell text.
A normalized-name scan against the then-current 743 spell records found four
exact title overlaps: Otyugh Swarm, Plague of Rats, Scourge, and Unbinding.
The later MMII definition review also added Beget Bogun as one shared record
using this book's verified 3.5 reprint (pp. 152-153), not a duplicate spell.
The printed descriptions and errata confirm these source-specific results:

- **Otyugh Swarm:** Complete Divine has components V, S and requires at least
  6,000 pounds of refuse where the spell is cast. The Dragonlance version adds
  a material component of ruby dust worth 1,000 gp. Preserve the source
  difference.
- **Plague of Rats:** Complete Divine errata (pp. 174–175) changes its effect
  to one rat swarm per two caster levels, to a maximum of six at 12th level;
  the adjacent swarms are stationary and do not pursue fleeing creatures.
  Dragonlance instead creates twelve stationary swarms. Do not merge these
  effects.
- **Scourge:** The two entries have the same listed components, targets, saves,
  disease effect, and focus. No mechanical difference was found in the
  compared text; retain source attribution if represented as one option.
- **Unbinding:** Complete Divine lists V, S, M, DF and describes a burst of
  force; Dragonlance lists V, S, M/DF and describes a burst of energy. Their
  barrier examples and limits also differ (including wall of stone versus
  wall of fire), so keep the source versions distinct pending any later
  implementation decision.

Anger of the Noonday Sun; Awaken, Mass; Bane Bow; Beast Claws; Beget Bogun;
Bestow Curse, Greater; Binding Winds; Blast of Force; Blessed Aim; Blessing of
Bahamut; Blink, Improved; Body of the Sun; Bolt of Glory; Bolts of
Bedevilment; Bottle of Smoke; Brain Spider; Brambles; Briar Web; Brilliant
Aura; Camouflage; Camouflage, Mass; Castigate; Chain of Eyes; Cloudburst;
Cloudwalkers; Cometfall; Contagious Touch; Creeping Cold; Creeping Cold,
Greater; Crown of Glory; Crumble; Curse of Ill Fortune; Curse of Lycanthropy;
Dance of the Unicorn; Death Pact; Decomposition; Deific Vengeance; Detect
Favored Enemy; Divine Agility; Divine Sacrifice; Doomtide; Dragon Breath;
Dream Sight; Energy Vortex; Enveloping Cocoon; Fire Wings; Fires of Purity;
Flame of Faith; Forestfold; Golden Barding; Hawkeye; Implacable Pursuer;
Infestation of Maggots; Languor; Last Breath; Maddening Scream; Maelstrom;
Mark of the Hunter; Miasma; Monstrous Thrall; Murderous Mist; Nature’s Avatar;
Nature’s Favor; Naturewatch; Nimbus of Light; Obedient Avalanche; Omen of
Peril; Otyugh Swarm; Pavilion of Grandeur; Phantasmal Decoy; Phantasmal
Disorientation; Phantom Bear; Phantom Stag; Phantom Wolf; Plague of Rats;
Poison Thorns; Poison Vines; Probe Thoughts; Quill Blast; Recitation;
Rejuvenation Cocoon; Renewal Pact; Resurgence; Resurgence, Mass; Revenance;
Righteous Wrath of the Faithful; Sacred Haven; Sandblast; Scent; Scourge;
Shadow Landscape; Slime Wave; Spell Resistance, Mass; Spikes; Spiritual
Chariot; Stalwart Pact; Standing Wave; Storm of Elemental Fury; Storm Tower;
Stormrage; Subvert Planar Essence; Telepathic Bond, Lesser; Tidal Surge;
Tortoise Shell; Touch of Madness; Traveler’s Mount; True Creation; True
Domination; Unbinding; Unyielding Roots; Vigor; Vigor, Greater; Vigor, Lesser;
Vigor, Mass Lesser; Vigorous Circle; Visage of the Deity; Visage of the Deity,
Greater; Visage of the Deity, Lesser; Waterspout; Wave of Grief; Weapon of the
Deity; Weather Eye; Whirlwind, Greater; Winged Mount; Wood Wose; Wrack; Zeal;
and Zealot Pact.

### Divine reference and item material

Chapter 4 (pp. 91–106) adds 45 deity-bound relics and 22 staffs. A divine
spellcaster who worships a relic's deity can sacrifice the specified spell
slot to use it; a character with True Believer who meets its Hit-Dice
requirement can use it without sacrificing a slot.

**Relics (45):** Spear of Retribution; Raptor Arrow; Millennial Chainmail;
Gauntlet of the Talon; Belt of the Champion; Gem of the Glitterdepth; Helm of
the Purple Plume; Tome of Ancient Lore; Pipes of Amorous Revelry; Boots of the
Unending Journey; Rapier of Desperate Measures; Shield of the Severed Hand;
Map of Unseen Lands; Morningstar of the Many; Enveloping Pit; Gauntlets of the
Blood-Lord; Rod of the Recluse; Tome of the Stilled Tongue; Chain of
Obeisance; Hooked Hammer of the Hearthfire; Rapier of Unerring Direction;
Armor of the Fallen Leaves; Cornucopia of the Needful; Sword of Mighty Thews;
Ruby Blade; Sword of Virtue Beyond Reproach; Axe of Ancestral Virtue;
Executioner's Hood; Skewer-of-Gnomes; Dawnstar; Platinum Helm; Tabard of the
Disembodied; Tabard of the Great Crusade; Chromatic Rod; Shard of the Sun;
Dragonscale Cloak; Dagger of Denial; Staff of the Unyielding Oak; Censer of
the Last Breath; Cudgel That Never Forgets; Shield of the Resolute; Ehlonna's
Seed Pouch; Scrolls of Uncertain Provenance; Rod of Reversal; and Robe of
Ebonsilk.

**Staffs (22):** Oaken Battle; Fauna; Pain; The Beatific, Lesser; The
Diabolical, Lesser; The Saintly, Lesser; The Wanton, Lesser; True Belief;
Vaporous Menace; Winds; Building; Planar Defense; Homeland; The Gaol; Hunting
Spirits; The Beatific, Greater; The Diabolical, Greater; The Saintly,
Greater; The Wanton, Greater; Soul-Ward; The Jetstream; and Storms.

Table 4-1 calls the Olidammara relic **Pipes of Amorous Revelry**, while its
description heading calls it **Pipes of Frenzied Revelry**; treat this as one
item-name inconsistency, not two relics. An exact normalized-name scan of
[equipmentCatalog.ts](../src/data/equipmentCatalog.ts), including staff-name
variants, found no Complete Divine relic or staff entries. These copyrighted
items remain inventory findings, not catalog additions, under the
SRD/open-license-only equipment rule.

Chapter 5 lists 23 core deities, 24 other Greyhawk deities, and 29 monster
deities. The current [deityDefinitions](../src/domain.ts) contains 12 core
deities. The other 11 core entries missing there are Boccob; Ehlonna;
Fharlanghn; Garl Glittergold; Gruumsh; Kurtulmak; Lolth; Olidammara; Tiamat;
Vecna; and Yondalla. The other Greyhawk entries absent from the current deity
definitions are Beltar; Bralm; Celestian; Cyndor; Delleb; Geshtai; Incabulos;
Istus; Iuz; Joramy; Lirr; Llerg; Mouqol; Osprem; Pholtus; Procan; Pyremius;
Rao; Telchur; Tharizdun; Trithereon; Wastri; Xan Yae; and Zuoken. The absent
monster deities are Annam; Blibdoolpoolp; Callarduran Smoothhands; Deep
Sashelas; Diirinka; Eadro; Great Mother; Grolantor; Hiatea; Hruggek; Iallanis;
Ilsensine; Kaelthiere; Laduguer; Laogzed; Maglubiyet; Memnor; Merrshaulk;
Panzuriel; Sekolah; Semuanya; Shekinester; Skoraeus Stonebones; Sixin;
Skerrit; Stronmaus; Surtr; Thrym; and Vaprak. This leaves 64 deity-definition
gaps across the three tables.

The 12 existing core deity records also need the Complete Divine domain
additions marked in Table 5-1. Of the 20 new domains, 17 IDs are absent and
Community, Liberation, and Pestilence currently have only Dragonlance-sourced
definitions. Keep those affiliations source-aware and do not apply
core/Greyhawk deity options automatically to Dragonlance characters. Chapter
6's afterlife and organized-religion material is campaign-facing context
rather than a general character-creation option.

## Complete Mage: first-pass option inventory

The printed contents (PDF p. 4) identify character options in Chapters 2–4.
Chapter 2 contains 13 alternative class features and 65 feat descriptions;
Chapter 3 presents 11 prestige classes; Chapter 4 contains class spell lists,
116 spell descriptions, and 22 new warlock invocations. This is a name-level
inventory, not a mechanics or eligibility audit.

### Alternative class features

Complete Mage adds no base class. These 13 alternative class features are
listed in Chapter 2 (pp. 31–35); none of their names matched the current
TypeScript source in the targeted scan:

| Alternative class feature | Printed page |
|---|---:|
| Arcane Hunter | 32 |
| Arcane Stunt | 32 |
| Armored Mage | 32 |
| Curse Breaker | 33 |
| Divine Counterspell | 33 |
| Divine Magician | 33 |
| Elemental Companion | 33 |
| Focused Specialist | 34 |
| Soulwarp Strike | 34 |
| Spell Reflection | 35 |
| Spell Sense | 35 |
| Spellbreaker Song | 35 |
| Stalwart Sorcerer | 35 |

### Prestige classes

None of the 11 prestige classes appears in the current source under its name
or normalized ID. Enlightened Fist also appears in Complete Arcane, so any
future class entry must preserve both source attributions.

| Prestige class | Printed page |
|---|---:|
| Abjurant Champion | 50 |
| Eldritch Disciple | 53 |
| Eldritch Theurge | 57 |
| Enlightened Spirit | 60 |
| Holy Scourge | 64 |
| Lyric Thaumaturge | 67 |
| Master Specialist | 70 |
| Nightmare Spinner | 74 |
| Ultimate Magus | 77 |
| Unseen Seer | 81 |
| Wild Soul | 84 |

### Feats

The printed contents list 65 feats (pp. 37–48), including heritage, reserve,
and tactical feats. All 65 have name-matching entries attributed to Complete
Mage in [featCatalogData.ts](../src/data/featCatalogData.ts); this does not
verify their mechanics or prerequisites. The PDF outline's “Battlecaster
Defence” and “Battlecaster Offence” are OCR spelling variants; the printed
contents give Battlecaster Defense and Battlecaster Offense.

Acidic Splatter; Alacritous Cogitation; Aquatic Breath; Battlecaster Defense;
Battlecaster Offense; Blade of Force; Borne Aloft; Captivating Melody; Clap
of Thunder; Cloudy Conjuration; Clutch of Earth; Dazzling Illusion; Defending
Spirit; Delay Potion; Dimensional Jaunt; Dimensional Reach; Drowning Glance;
Elemental Adept; Energy Abjuration; Energy Gestalt; Face-Changer; Favored
Magic Foe; Fearsome Necromancy; Fey Heritage; Fey Legacy; Fey Power; Fey
Presence; Fey Skin; Fiendish Heritage; Fiendish Legacy; Fiendish Power;
Fiendish Presence; Fiendish Resistance; Fiery Burst; Hasty Spirit; Hurricane
Breath; Insightful Divination; Invisible Needle; Magic Device Attunement;
Magic Disruption; Magic Sensitive; Master of Undeath; Melodic Casting;
Metamagic School Focus; Metamagic Spell Trigger; Metamagic Vigor; Minor
Shapeshift; Mystic Backlash; Piercing Evocation; Ranged Recall; Rapid
Metamagic; Residual Magic; Retributive Spell; Shadow Veil; Sickening Grasp;
Somatic Weaponry; Storm Bolt; Summon Elemental; Sunlight Eyes; Touch of
Distraction; Toughening Transmutation; Unsettling Enchantment; Vengeful
Spirit; Wind-Guided Arrows; and Winter's Blast.

### Spells and invocations

Chapter 4 provides new lists for Assassin, Bard, Cleric, Druid, Hexblade,
Paladin, Ranger, Sorcerer/Wizard, and Wu Jen (pp. 89–94). The 116 spell
description headings (pp. 96–121) were checked against the PDF text. The
current 743 spell records have no normalized-name matches. The extracted
headings “DAW N BURST” and “PAL L OF TWILIGHT” are spacing/OCR artifacts,
normalized here as Dawn Burst and Pall of Twilight.

Adamantine Wings; Allied Footsteps; Animate Weapon; Arcane Fusion; Arcane
Fusion, Greater; Arcane Turmoil; Aspect of the Icy Hunter; Attentive Alarm;
Battlecry; Blackrot; Bloodletting; Boiling Blood; Bothersome Babble;
Cacophonous Alarm; Caterwaul; Catsfeet; Caustic Smoke; Caustic Mire;
Channeled Lifetheft; Channeled Sound Blast; Choking Cobwebs; Climbing Tree;
Coat of Arms; Combined Talent; Dawn Burst; Deadly Lahar; Deadly Sunstroke;
Deafening Blast; Death's Call; Deathsight; Deceptive Facade; Dimension
Jumper; Dimension Jumper, Greater; Discordant Malediction; Doublespeak;
Dreaded Form of the Eye Tyrant; Endless Slumber; Elemental Eye; Energy
Absorption; Escalating Enfeeblement; False Lie; Familiar Refuge; Fever
Dream; Flaying Tendrils; Finger of Agony; Form of the Threefold Beast;
Genius Loci; Ghost Lantern; Great Worm of the Earth; Guided Path; Heart of
Air; Heart of Earth; Heart of Fire; Heart of Water; Hood of the Cobra; Horrid
Sickness; Immediate Assistance; Incendiary Slime; Incendiary Surge;
Interminable Echo; Jet of Steam; Karmic Aura; Karmic Backlash; Karmic
Retribution; Lash of Force; Lightning Leap; Lingering Chorus; Lingering
Flames; Luminous Swarm; Magic Savant; Mask of the Ideal; Melf's Slumber
Arrows; Mordenkainen's Trusted Bloodhound; Mysterious Redirection; Near
Horizon; Necrotic Curse; Nightmare Terrain; Otiluke's Impressing Field;
Otto's Imperative Ambulation; Painful Echoes; Pall of Twilight; Prickling
Torment; Phantasmal Strangler; Prismatic Aura; Prismatic Bow; Prismatic
Deluge; Rain of Spines; Rary's Arcane Conversion; Reaving Aura; Rebirth of
Iron; Repelling Shield; Resinous Tar; Resonating Agony; Resounding Thunder;
Retributive Enervation; Retributive Image; Rusted Blade; Seed of Undeath;
Seed of Undeath, Greater; Shape of the Hellspawned Stalker; Smoky
Confinement; Spellcaster's Bane; Steal Summoning; Storm of Fire and Ice;
Storm of Needles; Summon Component; Summon Weapon; Tactical Teleportation;
Tenacious Dispelling; Torrent of Tears; Touch of the Graveborn; Touch of
Vecna; Touch of Years; Towering Thunderhead; Toxic Tongue; and Transcend
Mortality.

The 22 new warlock invocations are grouped as seven least, seven lesser, five
greater, and three dark invocations. The app has no Warlock class or
selectable invocation catalog; its existing Extra Invocation feat only records
the additional choice manually. Caustic Mire and Steal Summoning each occur
both as a spell and an invocation and must remain distinct by option type.

### Items, locations, and race options

Chapter 5 covers rings, rods, staffs, wondrous items, alchemical items, and
optional material components (pp. 125–135); individual item entries and
component rules remain to be compared with the current catalogs. Chapter 6
lists 13 magical locations: Bigby's Tomb, Boccob's Reading Room, Boneyard,
Cloudseat, Crypt of Wee Jas, Dragonsblood Pool, Eternal Vortex, Metamagic
Storm, Rainbow Falls, Shieldstone Cavern, Soulheart Pool, Vale of Smoke and
Fog, and Worldmeet Glade. These are adventure/DM material rather than
character-creation options. The contents list no dedicated new race or
subrace section.

## Complete Scoundrel: first-pass option inventory

The printed contents (PDF p. 4) identify 13 prestige classes, feats and skill
tricks in Chapter 3, 28 new spell descriptions in Chapter 4, equipment options
in Chapter 5, and campaign organizations and sites in Chapter 6. This is a
name-level inventory; detailed prerequisites, mechanics, and eligibility remain
for follow-up.

### Prestige classes

None of the 13 prestige classes appears in the current `PrestigeClassId`
definition in [domain.ts](../src/domain.ts).

| Prestige class | Printed page |
|---|---:|
| Avenging Executioner | 24 |
| Battle Trickster | 28 |
| Cloaked Dancer | 31 |
| Combat Trapsmith | 34 |
| Fortune's Friend | 38 |
| Gray Guard | 40 |
| Magical Trickster | 45 |
| Malconvoker | 48 |
| Master of Masks | 52 |
| Mountebank | 57 |
| Psibond Agent | 60 |
| Spellwarp Sniper | 64 |
| Uncanny Trickster | 67 |

Chapter 1 provides character-building advice rather than a new base class or
alternative class feature. The contents list no dedicated race or subrace
section.

### Feats and skill tricks

The printed contents list 56 feat titles (pp. 73–82). All 56 have matching
Complete Scoundrel-attributed entries in
[featCatalogData.ts](../src/data/featCatalogData.ts); this is not a mechanics
audit. The PDF outline's “Consussion Attack” is an OCR typo; the printed
contents give Concussion Attack. Improved Familiar expands the existing feat
with additional alternatives; it is not a second feat entry. See the duplicate
scan below for its source-specific companion choices.

Advantageous Avoidance; Ascetic Stalker; Better Lucky than Good; Chant of the
Long Road; Chord of Distraction; Concussion Attack; Cool Head; Daredevil
Athlete; Daring Outlaw; Daring Warrior; Deadly Defense; Deafening Strike;
Disemboweling Strike; Dumb Luck; Eldritch Erosion; Expanded Ki Pool; Enduring
Ki; Epic of the Lost King; Fortuitous Strike; Freerunner; Good Karma; Head
Shot; Healer's Luck; Impeding Attack; Improved Familiar; Improved Skirmish;
Lucky Break; Lucky Catch; Lucky Fingers; Lucky Start; Magical Fortune; Make
Your Own Luck; Martial Stalker; Master Spellthief; Merciful Strike; Mind
Drain; Miser's Fortune; Persistent Attacker; Poison Expert; Poison Master;
Psithief; Psychic Luck; Savvy Rogue; Sly Fortune; Sound of Silence; Sure
Hand; Survivor's Luck; Sweet Talker; Swift Ambusher; Swift Hunter; Tempting
Fate; Third Time's the Charm; Throat Punch; Unbelievable Luck; Victor's Luck;
and Warning Shout.

The book describes 42 skill tricks (pp. 84–90); all 42 match the current
catalog in [skillTricks.ts](../src/data/skillTricks.ts). The outline's “Up the
Hill Movement” is a title error: the printed contents and description use Up
the Hill.

Acrobatic Backstab; Assume Quirk; Back on Your Feet; Clarity of Vision;
Clever Improviser; Collector of Stories; Conceal Spellcasting; Corner Perch;
Dismount Attack; Easy Escape; Escape Attack; Extreme Leap; False Theurgy;
Group Fake-Out; Healing Hands; Hidden Blade; Leaping Climber; Listen to This;
Magical Appraisal; Mosquito's Bite; Never Outnumbered; Nimble Charge; Nimble
Stand; Opening Tap; Point It Out; Quick Escape; Quick Swimmer; Second
Impression; Shrouded Dance; Social Recovery; Slipping Past; Speedy Ascent;
Spot the Weak Point; Sudden Draw; Swift Concentration; Timely Misdirection;
Tumbling Crawl; Twisted Charge; Up the Hill; Walk the Walls; Wall Jumper;
and Whip Climber.

### Spells

Chapter 4 provides new lists for Assassin, Bard, Cleric, Druid, Hexblade,
Ranger, and Sorcerer/Wizard (pp. 91–106). All 28 spell-description titles
below were confirmed in the PDF text. None has a normalized-name match among
the current 743 spell records.

Animate Instrument; Aquatic Escape; Armor Lock; Assassin's Darkness; Blockade;
Catapult; Create Fetch; Disobedience; Enlarge Weapon; Evacuation Rune; Fatal
Flame; Grasping Wall; Harmonic Void; Healer's Vision; Lucky Streak; Mage
Burr; Manifestation of the Deity; Mimicry; Opportune Dodge; Scry Location;
Siphon; Smoke Stairs; Spell Theft; Spore Field; Spymaster's Coin; Wall of
Vermin; Wand Modulation; and Winged Watcher.

### Equipment and campaign material

Chapter 5 (pp. 107–120) adds hidden-space construction guidance and nine
surprise-weapon entries: bow blade, knife and sword crossbow bayonets, hand
crossbow blade, boot blade, elbow blade, knee blade, sleeve blade, and
instrument blade. It also lists 11 alchemical items, eight poisons, nine magic
items, and eight living items:

- **Alchemical items:** Clearwater tablet; Daystrider capsule; Ferrous aqua;
  Forger's paper; Endurance elixir; Liquid light; Nerv; Powdered silver; Rust
  cube; Trail bar; and Toxic tooth.
- **Poisons:** Blasphemix; Elemental rime; Goodbye kiss; Gorgon's hair; Salvo;
  Siren's breath; Slow death; and Zealot's blade.
- **Magic items:** Aspect mirror; Bands of fortune; Bladeshimmer; Lucky charm;
  Panic button; Rod of ropes; Shrunken shrieker; Trinket of trickery; and
  Wheel of fortune.
- **Living items:** Green air bramble; Gut mites; Jabberweed; Planar mote;
  Planar mote, greater; Rust monster wand; Torch bug paste; and Torch bug
  tube.

An exact-name scan of the current equipment catalog found only Powdered Silver.
The existing entry costs 25 gp, while Complete Scoundrel's alchemical-item
table lists it at 20 gp; compare the source-specific use and price before
treating these as interchangeable. Catalog additions remain limited to
SRD/open-license sources, so these book-only entries are inventory findings,
not implementation requests.

Chapter 6 names three organizations—the Free League, the Blind Tower, and the
Seven Ravens Clan—and nine legendary sites: Bussengeist Haunt, Champion's
Crown, Court of Thieves, the Frog God's Fane, Heward's Hall, the Highest
Spire, Iron Wyrm Vault, Olidammara's Shell, and Otyugh Hole. These are
campaign/DM material rather than general character-creation options.

## Complete Warrior: first-pass option inventory

The printed contents (PDF p. 4) identify three base classes, two spell-less
class variants, 36 prestige classes, 83 standard feats, epic feats, domains,
spells, guardian familiars, skills, equipment, and campaign rules. This is a
name-level inventory; detailed prerequisites, mechanics, and eligibility
remain for follow-up.

### Classes and prestige classes

The three base classes are **Hexblade**, **Samurai**, and **Swashbuckler**.
None matches a current `ClassId` in [domain.ts](../src/domain.ts). The
spell-less Paladin and Ranger variants (p. 13) are campaign options, not
default replacements for the existing classes. Hexblade also appears in the
PHB II class-option inventory; keep its source-specific options attributed to
their respective books.

Chapter 2 lists 36 prestige classes; none matches a current
`PrestigeClassId` in [domain.ts](../src/domain.ts):

Bear Warrior; Bladesinger; Cavalier; Dark Hunter; Darkwood Stalker; Dervish;
Drunken Master; Exotic Weapon Master; Eye of Gruumsh; Frenzied Berserker;
Gnome Giant-Slayer; Halfling Outrider; Hulking Hurler; Hunter of the Dead;
Invisible Blade; Justiciar; Kensai; Knight of the Chalice; Knight Protector;
Master Thrower; Master of the Unseen Hand; Mindspy; Nature's Warrior; Occult
Slayer; Order of the Bow Initiate; Purple Dragon Knight; Rage Mage; Ravager;
Reaping Mauler; Ronin; Spellsword; Stonelord; Tattooed Monk; Thayan Knight;
War Chanter; and Warshaper.

### Feats

The standard-feat sections contain 83 titles: 59 general, 6 divine, 8
tactical, and 10 weapon-style feats. All 83 have Complete Warrior source
attribution in [featCatalogData.ts](../src/data/featCatalogData.ts); the two
curly-apostrophe titles below are present under their printed spellings.
This confirms catalog presence, not full mechanics coverage.

Anvil of Thunder; Arcane Strike; Arterial Strike; Axiomatic Strike; Bear Fang;
Cavalry Charger; Clever Wrestling; Close-Quarters Fighting; Combat Brute;
Cornered Rat; Crescent Moon; Dash; Defensive Strike; Defensive Throw;
Destructive Rage; Divine Cleansing; Divine Might; Divine Resistance; Divine
Shield; Divine Vigor; Eagle Claw Attack; Earth’s Embrace; Elusive Target;
Extend Rage; Extra Rage; Extra Smiting; Extra Stunning; Eyes in the Back of
Your Head; Favored Power Attack; Fleet of Foot; Fists of Iron; Flick of the
Wrist; Flying Kick; Formation Expert; Freezing the Lifeblood; Giantbane;
Greater Kiai Shout; Greater Resiliency; Greater Two-Weapon Defense; Hamstring;
Hammer’s Edge; High Sword Low Axe; Hold the Line; Improved Buckler Defense;
Improved Combat Expertise; Improved Familiar; Improved Favored Enemy;
Improved Mounted Archery; Improved Rapid Shot; Improved Toughness; Improved
Two-Weapon Defense; Improved Weapon Familiarity; Instantaneous Rage;
Intimidating Rage; Karmic Strike; Kiai Shout; Lightning Mace; Monkey Grip;
Net and Trident; Pain Touch; Phalanx Fighting; Pin Shield; Power Critical;
Prone Attack; Quick Staff; Ranged Disarm; Ranged Pin; Ranged Sunder; Rapid
Stunning; Raptor School; Roundabout Kick; Sacred Vengeance; Sharp-Shooting;
Shield Charge; Shield Slam; Shock Trooper; Spinning Halberd; Sun School;
Swarmfighting; Three Mountains; Throw Anything; Weakening Touch; and Zen
Archery.

The epic-level warrior section adds 12 feats absent from the current feat
catalog: Armor Skin; Combat Archery; Combat Insight; Damage Reduction; Epic
Combat Expertise; Epic Prowess; Epic Sunder; Epic Toughness; Epic Weapon
Focus; Legendary Rider; Perfect Two-Weapon Fighting; and Wield Oversized
Weapon.

### Domains, spells, and familiars

Five new domains—Courage, Fate, Nobility, Planning, and Tyranny—are absent
from the current domain IDs. Chapter 3 also contains eight new spell
descriptions: Augment Familiar; Cloak of Bravery; Cloak of Bravery, Greater;
Cursed Blade; Hound of Doom; Lion's Roar; Phantom Threat; and Valiant Fury.
None has a normalized-name match among the current 743 spell records. The
spell lists and domain lists should be reviewed alongside the classes and
domains they serve.

The three guardian familiar options—Spark Guardian, Gauntlet Guardian, and
Blade Guardian—do not match current familiar or feat options. Their
eligibility and familiar-specific mechanics remain to be audited.

### Equipment and other player-facing rules

Chapter 4 adds four armor special abilities (Anti-Impact, Axeblock,
Hammerblock, Spearblock), one specific armor (Armor of the Unending Hunt),
seven weapon special abilities (Blood Seeking, Deflecting, Disarming, Exit
Wound, Explosive, Knockback, Last Resort), three specific weapons (Burrowing
Arrow, Lance of the Last Rider, Oglien's Final Answer), eight wondrous items
(Bracers of Dawn, Gauntlet of the Dwarven Forge, Gauntlet of Lassitude,
Gauntlet of Utterdeath, Sacred Scabbard, Standard of Courage, Standard of
Heroism, Standard of No Retreat), and three special materials (Pandemonic
Silver, Susalian Chainweave, Thinaun).

Table 4-6 adds 19 exotic-weapon entries: Buckler-axe, dwarven; Lightblade,
elven; Tortoise blade, gnome; Maul; Pick, dire; Scourge; Thinblade, elven;
Warmace; Greatspear; Hammer, double; Lajatang; Mancatcher; Poleaxe, heavy;
Blowgun, greater; Darts (10); Bolas, barbed; Boomerang; Greatbow; and
Greatbow, composite. The chapter also gives weapon-familiarity guidance,
primitive-weapon variants, and improvised-weapon rules.

An exact-name scan of the current equipment catalog found no matching
Complete Warrior entries; its only substring hit was the distinct SRD item
Maul of the Titans. Catalog additions remain limited to SRD/open-license
sources, so these book-only entries are inventory findings, not implementation
requests.

Chapter 3 adds the Perform (weapon drill) use and sections for Knowledge and
Sleight of Hand. The book also supplies a warrior pantheon of nine deities:
Altua, Syreth, Valkar, Halmyr, Lyris, Konkresh, Typhos, Sulerain, and
Nadirech. These names and the five new domains are absent from the current
deity/domain inventory. The remaining warfare, mercenary, sporting-combat,
organization, and campaign material is DM-facing rather than general
character-creation content.

## Dragonlance Campaign Setting: first-pass option inventory

This setting-specific inventory covers Chapters 1–4 (printed pp. 8–135);
apply these options only to Dragonlance characters.

### Races

Chapter 1 (pp. 8–43) covers civilized humans and nomads; mountain, hill, dark,
and gully dwarves; Kagonesti, Qualinesti, Silvanesti, half-elf, Dargonesti, and
Dimernesti elves; gnomes; kender; centaurs; Baaz and Kapak draconians; Irda,
ogres, and half-ogres; and minotaurs.

The current race data has 16 Dragonlance-sourced records. The source-specific
Kender, Baaz/Kapak, five elf, four dwarf, Irda, and minotaur options are
represented. The generic Draconian and Deep Dwarf entries are explicitly
placeholders, not complete sourcebook options. Centaur, Ogre, and Half-Ogre
have no source-backed selectable race records. Civilized-human/nomad, gnome,
and half-elf differences should be checked against the existing core race
definitions rather than assumed to be new races.

### Classes, prestige classes, and feats

Chapter 2 (pp. 44–87) introduces the Mystic and Noble, both present as
Dragonlance classes in [domain.ts](../src/domain.ts). It also describes 12
named prestige classes: Knight of the Crown, Knight of the Sword, Knight of
the Rose, Knight of the Lily, Knight of the Skull, Knight of the Thorn, Steel
Legionnaire, Wizard of High Sorcery, Dragon Rider, Inquisitor, Legendary
Tactician, and Righteous Zealot. All are represented in the source-backed
prestige-class data. The code separates Wizard of High Sorcery's three robe
paths into additional records; do not count those as three more sourcebook
prestige classes. The legacy Knight of Neraka placeholder is not a substitute
for the three distinct Knights of Neraka classes.

The chapter's 13 feats are Cornered Rat; Draconian Breath Weapon; Flyby
Breath; Honor-bound; Hulking Brute; Improved Draconian Breath Weapon;
Improved Resist Dragonfear; Reserves of Strength; Resist Dragonfear; Spear of
Doom; Spectacular Death Throes; Strafing Breath; and Tremendous Charge. All
13 match Dragonlance-attributed entries in
[featCatalogData.ts](../src/data/featCatalogData.ts).

### Magic, domains, and deities

Chapter 3 (pp. 88–115) details High Sorcery, primal/wild sorcery, the three
moons, divine magic, and the Holy Orders of the Stars. The application stores
moon phase and conjunction state, but that is not by itself a complete
implementation of these spellcasting rules. Audit the source-specific
prerequisites, tests, and caster-level effects separately.

The book presents 13 Dragonlance domains—Alteration, Community, Forge,
Insight, Liberation, Meditation, Mentalism, Necromancy, Passion, Pestilence,
Restoration, Storm, and Treachery. All have Dragonlance domain IDs and
definitions in [clericDomainIds.ts](../src/data/clericDomainIds.ts) and
[clericDomains.ts](../src/data/clericDomains.ts); deity eligibility and
spell-list details remain candidates for a focused rules pass.

The New Spells section (pp. 104–112) contributes 26 spell descriptions, all
present in [dragonlanceSpells.ts](../src/data/dragonlanceSpells.ts). The file
has 27 entries because *Random Action* is a Player's Handbook (3.0) spell
referenced by the setting's domain material, not one of those 26 new
descriptions. Preserve that source distinction.

Chapter 4 (pp. 116–135) names 21 Krynn deities, and all 21 have
Dragonlance-sourced definitions in [domain.ts](../src/domain.ts). Verify their
cleric alignments, domains, favored weapons, and War of Souls-era status
against the deity entries before treating name coverage as a completed
eligibility audit.

Chapter 3 also describes Dragonmetal (p. 113), an Ansalon-specific material.
Record it as a sourcebook finding only; the equipment catalog remains limited
to SRD/open-license sources. Geography, organizations, and campaign-history
material in later chapters should remain setting context, not automatic
character options.

## Dungeon Master's Guide II: first-pass option inventory

The PDF has no bookmarks, so this pass used the printed contents (pp. 3–4) and
the player-facing sections in Chapters 5–7. Chapters 1–5 are mainly advice,
adventures, setting material, and NPC tools: contacts, hirelings, and unique
NPC abilities are not new PC classes or races. Chapter 6's prestige-class
design chapter provides construction advice, not a set of ready-made classes.

### Character and campaign options

The book has six feat entries: Apprentice and Mentor (p. 176), Business Savvy
(p. 184), Favored in Guild (p. 227), Guildmaster (p. 228), and Truebond
(p. 232). All six are in the feat catalog; their modeled prerequisites and
manual effects are summarized in [rules-coverage.md](./rules-coverage.md).

Chapter 6 also presents apprenticeship and mentorship, business ownership,
12 teamwork benefits (Door Procedures; Field Medic Training; Friendly Fire
Evasion; Gaze Aversion; Infiltration; Invisibility Sweep; Joint Bull Rush;
Joint Grapple Escape; Ranged Precision; Spell Barrage; Spellcaster Guardian;
Superior Flank), and 11 companion-spirit types (Chain, Corrosion, Flame,
Frost, Lens, Lightning, Rampart, Shadow, Shroud, Thunder, and Tower). Its PC
organization rules include the Order of Ancient Mysteries, the Shining
Crusade, the Red Knives Thieves' Gang, and ten guild categories. These are
player-facing campaign systems, not standalone feat or class definitions.
No matching named data for these systems was found in the current catalogs;
cataloging the six feats does not implement their associated benefits.

### Magic items and locations

Chapter 7 adds signature-trait and bonded-item rules, 17 magical locations
(Altar of the Dreamwalker; Dragonheart Tomb; Ember of Dragonfire; Everflame;
Footsteps of Corellon; Garden of Nature's Rage; Heart of Flame; Heart of Ice;
Heart of Stone; Heart of Wind; Last Stand of the Ironsworn; Necropolis of
Dread; Pool of Frozen Souls; Spellward of Arcane Might; Shrine of the
Weaponmaster; Terrible Cyst; Watchpost of Vigilance), armor and weapon
synergy rules, and seven weapon/armor templates: Feycraft, Fireshaped,
Githcraft, Gloryborn, Hellforged, Pitspawned, and Soulforged.

The equipment chapter includes two armor abilities (Energy Immunity and
Slippery Mind) and 16 weapon abilities (Acidic Burst; Air Elemental Power;
Brutal Surge; Caustic Surge; Corrosive; Defensive Surge; Earth Elemental
Power; Fire Elemental Power; Flaming Surge; Holy Surge; Icy Surge; Illusion
Bane; Lightning Surge; Sudden Stunning; Unholy Surge; Water Elemental Power).
It also names two specific weapons (Dagger of Lifekeeping, Ghost Gauntlet),
two rings (Ring of Greater Counterspells, Ring of Mental Fortitude), six rods
(Conduit Rod, Magic Siphon, Rod of Avoidance, Rod of Grievous Wounds, Rod of
Sure Striking, Soul Anchor), and 18 wondrous items (Bracelets of Spell
Sharing; Casting Glove; Daazzix's Vest; Domain Draught; Elixir of Reckoning;
Lenses of Pain; Lenses of True Form; Mantle of Second Chances; Quill of Rapid
Scrivening; Riding Boots; Robe of the Inferno; Rogue's Vest; Scarab of
Stabilization; Scarf of Spellcatching; Slippers of Battledancing; Vest of
Legends; Vestment of Verminshape; Vestments of Divinity).

These are inventory findings, not equipment-catalog additions: the book's
copyright page states that it contains no Open Game Content, and this
repository limits equipment catalog sources to SRD/open-license material.
Artifacts and the Saltmarsh example town remain campaign/DM material.

## Monster Manual I (Premium Edition): first-pass character-option inventory

Chapter 6, "Monster Skills and Feats" (printed pp. 303–304), defines Control
Shape and 13 monster feats. The DMG's "Monsters as Races" guidance is the
player-character path for eligible creatures; its 33 candidate entries are
already inventoried above. The Monster Manual supplies their creature
statistics, but that DMG list is not a census of every monster that might be
playable.

### Control Shape

Control Shape (Wis) is a skill for afflicted lycanthropes who know of their
condition; natural lycanthropes have full control and do not need it. The
source gives DCs for involuntary changes and voluntary shifts between
humanoid, hybrid, and animal forms. Involuntary change at moonrise is DC 25.
Voluntary return to humanoid form is DC 25 at the full moon and DC 20
otherwise; assuming hybrid form is DC 15; becoming an animal is DC 15 at the
full moon and DC 20 otherwise. A full moon lasts three days each month.
Injured afflicted lycanthropes also check
for involuntary change as damage reduces their hit points by each quarter.
No Control Shape skill or lycanthrope change-state tracking was found in the
current character catalog; this remains a rules and character-sheet gap.

### Monster feats

The chapter lists Ability Focus, Awesome Blow, Craft Construct, Empower
Spell-Like Ability, Flyby Attack, Hover, Improved Natural Armor, Improved
Natural Attack, Multiattack, Multiweapon Fighting, Quicken Spell-Like Ability,
Snatch, and Wingover. All 13 are already cataloged, with the full name list
and source count locked by a test as described in
[rules-coverage.md](./rules-coverage.md). Eight are attributed to the earlier
*Monster Manual II* printing; the five attributed to this 3.5 volume are
Awesome Blow, Craft Construct, Empower Spell-Like Ability, Improved Natural
Armor, and Improved Natural Attack. A source-to-catalog review of all 13
entries confirmed their names, prerequisites, repeatability where specified,
and primary effects against the chapter. Existing tests lock source attribution
and selected rules details, but do not automate every creature-specific
eligibility requirement or narrative effect. Special-attack choice, natural
armor or weapon ownership, three or more natural attacks, extra hands, and SLA
selection still require manual confirmation where the character record cannot
establish them.

### Player-character creatures

The DMG's candidate table supplies a source-backed starting set of 33 monster
PCs. All 33 now have MM I source-attributed selectable profiles in
[domain.ts](../src/domain.ts), with explicit ability adjustments, racial Hit
Dice, saves, skill points/class skills, natural armor/proficiencies where
modeled, and level adjustment. These profiles print through the normal race
identity path and participate in the racial-HD/ECL calculations.

The roster is Goblin, Kobold, Orc, Aasimar, Bugbear, Duergar, Gnoll,
Hobgoblin, Lizardfolk, Tiefling, Centaur, Githyanki, Githzerai, Drow, Ogre,
Minotaur, Troglodyte, Svirfneblin, Afflicted Lycanthrope, Natural Lycanthrope,
Satyr, Yuan-ti Pureblood, Kuo-toa, Pixie, Gargoyle, Troll, Drider, Hill Giant,
Janni, Yuan-ti Halfblood, Mind Flayer, Ogre Mage, and Vampire. Pixies exchange
their racial Hit Die for the first class level. Lycanthrope animal-form HD and
vampire base-creature/template interactions remain manual because they depend
on choices not yet represented as structured character state; their LA
increments and printed source boundaries are explicit.

Control Shape is now represented as a Wisdom skill with its afflicted
lycanthrope purpose and DC boundary in the printable skill catalog. Natural
lycanthropes are explicitly exempt. This completes MM I's selectable player
option definition pass: no new base/prestige class or standalone spell
catalog was identified, and the 13 Chapter 6 monster feats were already
source-checked. Creature powers that require live adjudication remain manual
rather than being silently omitted.

## Monster Manual II: first-pass character-option inventory

### Rules-review checkpoint (2026-11-16)

Locally OCR-screened all 240 PDF pages, including the appended enhancements,
for feat definitions, spell headers, and class definitions. Checked the
Creature Feats sidebar (printed p. 8) and the Bogun entry (pp. 34-35).
No new base or prestige class definition was identified. Classed creature
examples and monster advancement do not define new classes.

The eight retained feats use 3.5 mechanics, not the sidebar's original 3.0
rules: Flyby Attack uses a standard action rather than a partial action;
Hover, Multiweapon Fighting, Quicken Spell-Like Ability, Snatch, and Wingover
have revised rules in later supplied 3.5 volumes. Multidexterity remains
excluded rather than reintroduced as a separate feat.

Found the previously omitted **Beget Bogun** spell (p. 35). Cross-checked its
3.5 reprint in Complete Divine (pp. 152-153), including the standard-action
casting time, druid 1 access, 25 XP cost, and separate week-long construction
requirements. Added one shared catalog entry with both source citations,
rather than a second selectable copy for the reprint. Construction and
creature control remain explicitly manual. Focused regression coverage:
`tests/monsterManual.test.ts`. Validation is recorded in the README checkpoint.
The monster-PC and template conversion gaps below remain open; this pass
does not certify playable races or convert 3.0 ECL values into 3.5 race data.

The book has no feat chapter, but its introduction contains a "Creature Feats"
sidebar with nine definitions. Eight are cataloged and attributed to the
September 2002 first printing: Ability Focus, Flyby Attack, Hover, Multiattack,
Multiweapon Fighting, Quicken Spell-Like Ability, Snatch, and Wingover. The
ninth, Multidexterity, is a 3.0 feat superseded by Multiweapon Fighting in
3.5, so it is not a missing 3.5 option. This matches the inventory and
regression-test coverage in [rules-coverage.md](./rules-coverage.md); the
sidebar does not cover every feat selection in the monster statblocks.

The appendix's "Monsters Ranked by Challenge Ratings" (p. 223) is a CR index,
not an ECL index. Two sections do give explicit character-level guidance:
Scorpionfolk characters (p. 221) have ECL equal to class level +16, making the
sample 1st-level ranger ECL 17; the Death Knight template (pp. 207–208) gives
PCs ECL equal to character level +5, making its 7th-level fighter/3rd-level
blackguard example ECL 15.

The template appendix also includes Captured One, Chimeric Creature, Half-Golem,
Monster of Legend, Spellstitched, Tauric, Titanic, and Warbeast. They provide
challenge-rating adjustments but no general LA/ECL guidance; Death Knight is
the exception. The Half-Golem template explicitly changes a character's type
to construct, but gives no level adjustment.

The local PDF appends two official web enhancements after the printed book.
"Six New Monstrous Characters" presents Terrzani (abeil soldier ranger),
Haiatunc (avolakia cleric), Alkeone (bladeling fighter/cleric), Mascinawi
(braxat ranger), Phalac (glimmerskin fighter), and Frashrei (loxo wizard).
These are classed encounter examples without LA/ECL values, not evidence that
the six creature types are selectable races. "More Half-Golems!" adds
stained-glass, brass, and dragonflesh half-golem variants and sample
half-golem characters, also without LA/ECL values.

**DMG-based eligibility screen:** Comparing the MMII alphabetical index and
monster-by-type list (p. 3) with the 33 named entries in the DMG's "Monsters
as Races" table (p. 172) found no additional MMII-specific species with a
direct match. The DMG's Aasimar and Tiefling entries do not cover MMII's
Chaond and Zenythri, and its Hill Giant entry does not determine the level
adjustment of MMII's different giant types.

The MMII Planetouched entry (pp. 169–171) gives explicit character rules for
Chaonds and Zenythri. Each has 1 racial Hit Die, and its ECL is class level + 1;
that extra level is the racial Hit Die, not a +1 level adjustment. A Chaond's
favored class is its first class taken, while a Zenythri's is monk.
Scorpionfolk have 12 racial Hit Dice and ECL equal to class level + 16,
implying +4 level adjustment under the DMG's ECL formula; the +16 is not
itself the level adjustment.

An entry-level visual screen also found explicit PC ECL rules for these MMII
creatures. Racial Hit Dice come from each entry's stat block; the implied level
adjustment is the ECL offset minus racial Hit Dice.

| MMII entry | Racial Hit Dice | ECL | Implied level adjustment |
|---|---:|---|---:|
| Abeil vassal / soldier / queen (p. 23) | 1 / 6 / 14 | Class level +3 / +11 / +21 | +2 / +5 / +7 |
| Avolakia (pp. 28-29) | 10 | Class level +15 | +5 |
| Bladeling (p. 31) | 1 | Class level +1 | +0 |
| Braxat (p. 38) | 10 | Class level +16 | +6 |
| Desmodu (p. 64) | 12 | Class level +14 | +2 |
| Ixitxachitl, average / vampiric (pp. 129-130) | 1 / 2 | Class level +2 / +5 | +1 / +3 |
| Loxo (p. 145) | 5 | Class level +7 | +2 |
| Thri-kreen, nonpsionic (p. 196) | 2 | Class level +3 | +1 |
| Thri-kreen, psionic (p. 196) | 2 | Class level +5 | +3 |
| Yak folk (p. 201) | 5 | Class level +7 | +2 |

The entries name sorcerer as the favored class for avolakias and yak folk;
cleric for ixitxachitls; fighter for bladelings; ranger for braxats, loxos,
and thri-kreen; and druid for abeil vassals and queens, with ranger favored
for abeil soldiers. These source-specific ECL rules control rather than
assumptions based on related creatures or advancement by character class
alone.

MMII's CR appendix (p. 223) does not provide ECL or level adjustments.
Template challenge-rating adjustments and the classed web-enhancement
examples likewise do not establish PC eligibility. The current race catalog
has no MMII profiles, including Abeils, Avolakias, Bladelings, Braxats,
Desmodus, Ixitxachitls, Loxos, Thri-kreen, Yak folk, Scorpionfolk, Chaond,
Zenythri, or the six web-enhancement species.

A further visual spot-check of pp. 175, 178, 180, 183, 186, 188, 191, and
194 covered the Raggamoffyn, Reason Stealer, Rogue Eidolon, Runic Guardian,
Spawn of Kyuss, Spell Weaver and Spellgaunt, Stone Spike and Swamplight Lynx,
and Teratomorph entries. The inspected pages provided statblocks and/or
advancement data but no explicit PC ECL or level-adjustment rules, so they add
no entries to the table; ordinary advancement is not evidence of PC
eligibility.

This remains a bounded screen of likely player-character entries, not a
creature-by-creature OCR audit; no broader eligibility should be inferred
without source-specific race rules or a DM-assigned level adjustment.

## Monster Manual III: first-pass character-option inventory

### Rules-review checkpoint (2026-11-16)

Corrected the earlier false-negative scan: the supplied contents explicitly
lists **Monster Feats** (pp. 206-207). Its 11 definitions are Ability Focus,
Awesome Blow, Craft Construct, Empower Spell-Like Ability, Flyby Attack,
Improved Natural Armor, Improved Natural Attack, Improved Toughness,
Multiattack, Powerful Charge, and Quicken Spell-Like Ability. Compared their
prerequisites and effects with the shared catalog. Powerful Charge is now
attributed to this earlier verified printing rather than MMIV. Quicken
Spell-Like Ability now describes a **swift** action, as explicitly revised
here, rather than the earlier free action. Earlier source labels identify
provenance, not an instruction to apply obsolete mechanics.

The Shifter sidebar (p. 150) defines Extra Shifter Trait, Healing Factor,
Shifter Defense, and Shifter Instincts. The Warforged sidebar (p. 192) defines
Adamantine Body, Improved Fortification, Mithral Body, and Mithral Fluidity.
Added all eight with racial prerequisites; both Body feats are 1st-level-only,
Improved Fortification requires BAB +6, and Mithral Fluidity requires Mithral
Body and is repeatable. Shifter feats have their own category so Extra Shifter
Trait and Shifter Defense each require two **other** shifter feats. The
sidebars refer to Eberron Campaign Setting, which is not supplied; MMIII is
the verified source label, not a claim that it is the historical first printing.
Shifter/Warforged race creation, shifting, plating, and feat effects remain
unsupported/manual and are explicitly identified in the feat descriptions.

A full-text header/definition screen found no new standalone spell, base
class, or prestige-class definition. Living-spell creatures are not spells
that a character can learn; creature examples using existing classes are not
new class definitions. This does not complete the race/template implementation
backlog below. Regression coverage is in `tests/monsterManual.test.ts` and
the existing monster-feat tests; validation is recorded in the README.

The Monsters by ECL appendix (pp. 224–225) gives HD, LA, and ECL for 47
creature entries. None has a matching profile in the current race catalog.
Four are explicitly restricted to cohort use; an asterisk means the creature
has no racial Hit Dice and the listed ECL assumes one class level.

| Creature | HD | LA | ECL |
|---|---:|---:|---:|
| Armand | 5 | +3 | 8 |
| Astral stalker | 12 | +6 | 18 |
| Bearhound | 10 | +4 | 14 (cohort only) |
| Changeling | 1 | +0 | 1* |
| Canoloth (yugoloth) | 6 | +5 | 11 |
| Demon, arrow | 10 | +8 | 18 |
| Dracotaur | 3 | +5 | 8 |
| Flind (gnoll) | 2 | +2 | 4 |
| Forestkith (goblin) | 1 | +1 | 2* |
| Giant, sand | 15 | +4 | 19 |
| Glaistig | 6 | +4 | 10 |
| Goatfolk | 3 | +1 | 4 |
| Grimweird | 12 | +3 | 15 |
| Gulgar | 10 | +5 | 15 |
| Harssaf | 6 | +4 | 10 |
| Kenku | 1 | +0 | 1* |
| Lhosk | 8 | +3 | 11 |
| Lizardfolk, blackscale | 4 | +3 | 7 |
| Lizardfolk, poison dusk | 1 | +1 | 2* |
| Lumi | 2 | +2 | 4 |
| Mezzoloth (yugoloth) | 10 | +5 | 15 |
| Mummy, salt | 12 | +6 | 18 |
| Nycaloth (yugoloth) | 14 | +5 | 19 |
| Nycter | 3 | +2 | 5 |
| Ogre, skullcrusher | 8 | +3 | 11 |
| Petal | 1 | +2 | 3 (cohort only) |
| Phoelarch | 7 | +5 | 12 |
| Quaraphon | 9 | +5 | 14 |
| Rakshasa, ak'chazar | 17 | +5 | 22 |
| Rakshasa, naztharune | 11 | +5 | 16 |
| Redcap | 4 | +4 | 8 |
| Rejkar | 5 | +6 | 11 |
| Seryulin | 10 | +4 | 14 (cohort only) |
| Shifter | 1 | +0 | 1* |
| Splinterwaif | 2 | +4 | 6 |
| Thorn | 6 | +2 | 8 (cohort only) |
| Troll, cave | 9 | +6 | 15 |
| Troll, crystalline | 10 | +5 | 15 |
| Troll, forest | 5 | +5 | 10 |
| Troll, mountain | 15 | +5 | 20 |
| Troll, war | 12 | +6 | 18 |
| Ultroloth (yugoloth) | 18 | +5 | 23 |
| Warforged | 1 | +0 | 1* |
| Warforged charger | 4 | +4 | 8 |
| Warforged scout | 1 | +0 | 1* |
| Witchknife | 9 | +3 | 12 |
| Wood woad | 8 | +3 | 11 |

The same appendix lists template level adjustments: Living Spell (varies),
Spellwarped (+0, +1, or +2), Voidmind (+1), and Woodling (+2). These are
template options rather than standalone races, and their application
requirements still need separate review. The table is a source-specific
eligibility reference, not a blanket grant that every listed creature is
available to player characters. Its values also override any tempting
transfer from a related DMG race: the MMIII Forestkith goblin is +1 (versus
the DMG goblin's +0), the Flind is +2 (versus the DMG gnoll's +1), and the
Blackscale Lizardfolk is +3 (versus the DMG lizardfolk's +1). Use the MMIII
rows for these distinct profiles rather than inheriting the base-race
adjustments.

## Monster Manual IV: first-pass character-option inventory

### Rules-review checkpoint (2026-11-16)

Checked the 13 Monster Feats definitions (pp. 202-203), the Clockwork Mender
spell (p. 30), and the Varag character progression (pp. 170-171), with a
full-text definition/header screen for additional spells and classes.
Added **Summon Clockwork Mender Swarm** at cleric/sorcerer/wizard 4; its
unchanged casting metadata comes from Summon Monster I, while its lawful
descriptor, swarm effect, and broken-gear arcane focus come from this entry.
Swarm attack, repair, and sacrifice actions remain manual.

Corrected Ability Focus to the revised saving-throw special-ability wording;
Clinging Breath now states its extra one-round recharge wait; Lingering Breath
states normal saves and the original targets' escape window. Githyanki
Dragonrider grants the mount, not just the rider, the +1 insight AC bonus.
Githyanki Battlecaster now removes light-armor spell failure in the shared
casting calculation, including mithral-treated light armor, but does not remove
shield or medium/heavy-armor failure. Wizard bonus-feat eligibility was still
open at this checkpoint; the later PHB/DMG class batch above implemented it.
The two MMIV-attributed feats are the Githyanki feats; Powerful Charge is a
verified MMIII reprint, not a new MMIV definition.

**Open class/progression gap:** the book does provide a **Varag racial
class**, not an ordinary base or prestige class. It requires DM permission and
selection at creation. Its first five racial levels distribute three racial
Hit Dice, +2 LA, and racial abilities; standard class advancement begins at
racial level 6. The current model does not support this interleaved racial
progression, and a flat five-level base class would incorrectly grant five
Hit Dice and ordinary class benefits. Do not offer such a substitute. Keep
Varag creation/progression visibly unsupported until that model is implemented
and tested. No new ordinary base or prestige class was identified.

Focused regression coverage is in `tests/monsterManual.test.ts` and the
existing casting-summary/monster-feat tests. This is a completed definition
review with an explicitly open racial-class implementation item, not full
MMIV character-option support.

The front-matter "For Player Characters" index (p. 3) is a direct inventory of
player-facing creature uses:

- **Creatable creatures:** Bloodfire Ooze (ritual), Bloodhulk (*animate
  dead*), Clockroach, Clockwork Mender, Clockwork Pony, Clockwork Stallion,
  Defacer (*create undead*), Fang Golem, Necrosis Carnex (*animate dead*), and
  Plague Walker (ritual). The five construct entries require Craft Construct.
- **Mounts and companions:** Clockwork Pony, Clockwork Stallion, Lodestone
  Marauder, Sailsnake, Bluespawn Stormlizard, Greenspawn Leaper, and Redspawn
  Firebelcher.
- **Summonable creatures:** Clockwork Mender (II), Dwarf Ancestor (V), Howler
  Wasp (II), Inferno Spider (VI), Justice Archon (VII), Windrazor (III),
  Windscythe (VI), Wrackspawn (IV), Corruptor of Fate (VI), and Voor (IV).
  The index specifies the required *summon monster* spell level; individual
  entries may also describe calling or companion uses.
- **Other player-facing options:** the Skiurid Nugget power component and the
  Dragonsplit, Greathammer, and Maquahuitl weapons.

The p. 204 ECL table gives HD, LA, and ECL for 49 sample statblocks. Group
labels from the printed table are expanded below so each build can be
cross-referenced independently.

| Creature/build | HD | LA | ECL |
|---|---:|---:|---:|
| Drow priestess | 8 | +2 | 10 |
| Drow arcane guard | 7 | +2 | 9 |
| Drow dark sniper | 6 | +2 | 8 |
| Drow Lolth's Sting | 4 | +2 | 6 |
| Giant, craa'ghoran | 15 | +4 | 19 |
| Githyanki soldier | 3 | +2 | 5 |
| Githyanki captain | 9 | +2 | 11 |
| Githyanki gish | 7 | +2 | 9 |
| Gnoll fiendish cleric of Yeenoghu | 5 | +3 | 8 |
| Gnoll half-fiend warlock | 6 | +5 | 11 |
| Gnoll slave-taker | 4 | +1 | 5 |
| Joystealer | 6 | +4 | 10 |
| Justice archon | 6 | +5 | 11 |
| Justice archon champion | 10 | +5 | 15 |
| Dark Talon lizardfolk champion | 5 | +1 | 6 |
| Dark Talon lizardfolk king | 12 | +1 | 13 |
| Dark Talon lizardfolk shaman | 7 | +1 | 8 |
| Dark Talon lizardfolk soldier | 2 | +1 | 3 |
| Dark Talon lizardfolk wasp rider | 2 | +1 | 3 |
| Lolth-touched drow ranger | 5 | +3 | 8 |
| Lunar ravager | 14 | +6 | 20 |
| Greathorn minotaur | 11 | +6 | 17 |
| Nagatha | 8 | +2 | 10 |
| Ogre scout | 8 | +2 | 10 |
| Ogre tempest | 10 | +2 | 12 |
| Orc battle priest | 1 | — | 1 |
| Orc berserker | 4 | — | 4 |
| Orc plague speaker | 5 | +5 | 10 |
| Orc war howler | 4 | — | 4 |
| Half-orc infiltrator | 3 | — | 3 |
| Spawn of Tiamat blackspawn exterminator | 14 | +3 | 17 |
| Spawn of Tiamat blackspawn raider | 8 | +3 | 11 |
| Spawn of Tiamat greenspawn sneak | 2 | +4 | 6 |
| Spawn of Tiamat greenspawn sneak raid leader | 7 | +4 | 11 |
| Spawn of Tiamat redspawn arcaniss | 8 | +4 | 12 |
| Spawn of Tiamat whitespawn hordeling | 2 | +1 | 3 |
| Spawn of Tiamat whitespawn hunter | 6 | +2 | 8 |
| Varag | 3 | +2 | 5 |
| Verdant prince | 16 | +4 | 20 |
| Windblade windrazor | 2 | +2 | 4 |
| Windblade windscythe | 8 | +3 | 11 |
| Wizened elder | 4 | +3 | 7 |
| Yuan-ti ignan | 11 | +8 | 19 |
| Yuan-ti abomination cult leader | 13 | +7 | 20 |
| Yuan-ti halfblood deceiver | 9 | +5 | 14 |
| Yuan-ti pureblood slayer | 12 | +2 | 14 |
| Yugoloth, corruptor of fate | 7 | +4 | 11 |
| Zern | 8 | +7 | 15 |
| Zern blade thrall | 5 | +4 | 9 |

These are sample builds, not a blanket grant that every listed statblock is an
available race; the table's em-dash LA values are preserved rather than
normalized to +0. The current [domain.ts](../src/domain.ts) race catalog has no
MMIV creature profiles, including Githyanki; the latter is also a prerequisite
for the two already-cataloged Githyanki feats.

The two templates are also relevant to a character-option screen. The
Lolth-touched acquired template can apply to nongood, nonlawful corporeal
living creatures and adds +1 level adjustment (pp. 93–94); the ECL table
includes a Lolth-touched drow ranger. The acquired web mummy template can
apply to corporeal giants, humanoids, and monstrous humanoids, but its level
adjustment is a dash (pp. 165–167), so it is not a playable character option
as written. Neither template is represented in the current catalog.

All 13 feats in the MMIV monster-feat section (pp. 202-203) are represented
and source-audited in [rules-coverage.md](./rules-coverage.md). Githyanki
Battlecaster and Githyanki Dragonrider are MMIV-attributed; Powerful Charge
is attributed to MMIII. The Clockwork Mender entry's *Summon Clockwork
Mender Swarm* (p. 30) is now cataloged. The Varag racial-class gap is
documented in the checkpoint above.

Spot-checks of the player-use sections confirm that the index omits important
requirements. A Bloodfire Ooze ritual (p. 19) requires blood from at least 100
good- or neutral-aligned humanoids, the ichor of one demon with at least 10 HD,
a runed cauldron worth at least 3,000 gp, an *unhallow* area, 24 hours, and
500 XP. Bloodhulk creation (p. 22) uses *animate dead*, a Medium, Large, or
Huge corpse according to the variant, and blood from three recently slain
creatures of the same size. A Clockwork Mender (p. 30) is also an improved
familiar for a lawful arcane caster of 5th level or higher with Improved
Familiar, or can be summoned with *summon monster II*; the swarm spell is a
separate option. A Howler Wasp requires a cleric with the Chaos domain, while
an Inferno Spider requires a wizard, sorcerer, or Fire-domain cleric and 5
ranks in Knowledge (the planes), despite their respective index entries
showing only spell levels II and VI. A Sailsnake is an alternative animal
companion for a druid of 4th level or higher; its familiar option separately
requires Improved Familiar and arcane caster level 5.

The remaining creation costs and recipes, mount-training details, weapon
mechanics, template application, and ECL statblocks still need a full
rules-level pass before implementation.

## Monster Manual V: first-pass character-option inventory

### Rules-review checkpoint (2026-11-16)

Checked the 12 Monster Feats definitions (pp. 204-205), all seven feat
sidebars (pp. 80, 84-85, 97, 110, 134), Earthbind (p. 26), and the contents
and full-text definition/header screen for spells and classes. The feat
definitions are represented once each, retaining earlier verified sources
for reprints. Fixed **Brutal Throw** so it is actually offered in Fighter
bonus-feat slots; previously only its description said it was a bonus feat.
The optional Strength substitution remains explicitly manual.

Added **Earthbind** at druid/sorcerer/wizard 2 with Fortitude negates, spell
resistance, medium range, and dismissible minute/level duration. Its summary
distinguishes fly-speed suppression and Feather Fall descent from unaffected
jumping, Levitate, and Air Walk, and records suppression of newly granted
flight. Target saves, descent, and temporary suppression are manual; the
spell does not permanently overwrite a character's fly speed.

No new ordinary base class, prestige class, or racial-class progression was
identified. Classed monster examples are not new class definitions. Creature,
template, familiar, mount, and summoning-list additions below remain a
separate implementation backlog; this pass does not make those creatures
selectable. Regression coverage is in `tests/monsterManual.test.ts` and the
existing monster-feat tests; validation is recorded in the README checkpoint.

The front-matter "For Player Characters" index (p. 3) groups the book's
player-facing creature uses:

- **Creatable creatures:** Blackwing and Bonespur (*create undead*), Force
  Golem, Magmacore Golem, Sanguineous Drinker (*create undead*), Scouring
  Slinger, Scouring Stanchion, Serpentir (*create undead*), Shardsoul Slayer,
  and Spectral Rider (*create greater undead*).
- **Mounts and companions:** Blackwing, Deadborn Vulture, Gem Scarab
  (Improved Familiar), Steelwing, and Tirbana Eyewing (Improved Familiar).
- **Race:** Jaebrin, with a dedicated "Jaebrins as Characters" section (p. 93)
  and level adjustment +1. The ECL table also lists a 1-HD Jaebrin at ECL 2.
- **Summonable creatures:** Arcadian Avenger (IV), Adaru (IX), Carnage Demon
  (IV), Gadacro (IV), Solamith (VII in the index; VIII in its creature
  entry), Gulthir (VI), and Fetid Fungus (II). The index distinguishes
  *summon monster* from *summon nature's ally* access.
- **Equipment:** Kuo-Toan Harpoon, Razorfeather Ammunition, Siege Chitin
  Armor, and Howling Helm. These are recorded for inventory only; the
  equipment catalog remains limited to SRD/open-license sources.

The p. 4 ECL table gives HD, LA, and ECL for 24 sample statblocks:

| Creature/build | HD | LA | ECL |
|---|---:|---:|---:|
| Arcadian avenger | 8 | +2 | 10 |
| Banshrae | 15 | +4 | 19 |
| Elemental magus, Ken-kuni | 8 | +5 | 13 |
| Elemental magus, Ken-li | 12 | +5 | 17 |
| Elemental magus, Ken-sun | 17 | +5 | 22 |
| Ethereal defiler | 22 | +4 | 26 |
| Greenspawn zealot | 6 | +2 | 8 |
| Hobgoblin duskblade | 3 | +1 | 4 |
| Hobgoblin spellscourge | 5 | +2 | 7 |
| Hobgoblin warcaster | 4 | +3 | 7 |
| Hobgoblin warsoul | 10 | +4 | 14 |
| Jaebrin | 1 | +1 | 2 |
| Kuo-toa crazed | 4 | +3 | 7 |
| Kuo-toa exalted whip | 10 | +4 | 14 |
| Kuo-toa harpooner | 4 | +3 | 7 |
| Kuo-toa monitor | 6 | +3 | 9 |
| Nozgûg | 7 | +1 | 8 |
| Shaedling | 4 | +3 | 7 |
| Singh the Immense | 13 | +2 | 15 |
| Troll, bladerager | 6 | +5 | 11 |
| Ushemoi Arkamoi | 4 | +4 | 8 |
| Ushemoi Hadrimoi | 9 | +4 | 13 |
| Ushemoi Lashemoi | 2 | +2 | 4 |
| Ushemoi Turlemoi | 12 | +4 | 16 |

These are sample builds, not a blanket grant that every statblock is a
selectable race. The Hobgoblin Spellscourge and Warcaster entries give level
adjustments +2 and +3, respectively. No Jaebrin or MMV-specific creature
profile was found in the current race catalog.

The template index lists the God-Blooded family and its Gruumsh-, Imix-,
Kord-, Orcus-, Vecna-, and Yeenoghu-Blooded variants; Phantom; Thoon Thrall;
Xorvintaal Dragon; and Xorvintaal Exarch. The general God-Blooded template is
an acquired template with +1 level adjustment, with deity-specific base
creature restrictions; the ECL table includes Nozgûg, a Gruumsh-blooded orc.
The acquired Xorvintaal Exarch template has +2 LA, and a sidebar explicitly
describes PCs receiving it from a Xorvintaal dragon. Phantom and Thoon Thrall
both list LA —; the Thoon Thrall entry specifically says it is unsuitable for
PCs because of its vulnerability to domination and overdrive healing. The
Xorvintaal Dragon template is limited to young adult or older true dragons and
provides no LA. These template rules and deity-specific effects are not
represented in the current catalog.

The spell index contains one new spell, *Earthbind* (p. 26; druid 2,
sorcerer/wizard 2). It is now cataloged, with manual resolution boundaries
recorded in [rules-coverage.md](./rules-coverage.md). The
book's 12 monster feats and seven additional feat sidebars are already
represented there, with source attributions and manual limitations. The
contents list no new base class; creature class-level writeups are not treated
as class definitions.

Spot-checks of the player-use sections confirm additional requirements and
one source discrepancy. Blackwings (p. 13) require a giant-eagle corpse buried
within *unhallow* for six months before a caster of 18th level or higher uses
*create undead*; their mount training takes four weeks, requires a DC 25
Handle Animal check, and uses an exotic saddle. Bonespurs (p. 157) require
*create undead*, a caster level of at least 8, and skeletal remains equivalent
to six Medium creatures. Force Golems and Magmacore Golems have separate
Craft Construct recipes with minimum caster levels 12 and 9; Scouring Slingers
and Stanchions instead require secret druidic rituals with creature-specific
components. For summoning, an Arcadian Avenger requires a non-evil, lawful
spellcaster; a Fetid Fungus can be summoned by a neutral or evil druid with
*summon nature's ally II* or by a cleric of Zuggtmoy with *summon monster II*.
The MMV index lists the Solamith at VII (p. 3), but its player-use section
requires *summon monster VIII* (p. 29); preserve this conflict for resolution
rather than silently choosing one value. The index's summon footnotes
therefore do not capture all class, alignment, deity, and caster-level
restrictions.

## Initial existing-catalog duplicate scan

This is a code-level name and identifier scan; same-name candidates still need
verification against their printed sources before merging or removing them.

- Feats have no repeated IDs. Three normalized names occur more than once:
  - **Improved Familiar:** Complete Scoundrel (p. 78) and Complete Warrior
    (p. 100) explicitly present additional alternatives for the DMG feat, not
    separate selectable feats. The DMG base feat and its options are missing
    from the current catalog. Preserve the source-attributed lists under one
    Improved Familiar selection: Complete Scoundrel adds the centipede,
    badger, scorpion, viper, spider, vargouille, and mephit options; Complete
    Warrior adds the krenshar, worg, blink dog, hell hound, hippogriff, howler,
    and winter wolf, with per-creature caster-level and base-attack-bonus
    thresholds. Keep the alignment and creature-specific requirements when
    combining the lists.
  - **Improved Favored Enemy:** These are distinct source-specific feats, not
    duplicates. The Dungeon Master's Guide epic version (p. 210) requires five
    favored enemies and adds +1 to the listed skill checks and damage rolls
    against them; it can be selected multiple times, with stacking effects.
    Complete Warrior (p. 101) requires the favored enemy ability and base
    attack bonus +5, and adds +3 damage against favored enemies, stacking with
    the existing favored-enemy damage bonus. Keep their separate IDs and make
    their source labels unambiguous.
  - **Sacred Healing:** These are distinct source-specific feats, not
    duplicates. Complete Divine (p. 84) requires Heal 8 ranks and the ability
    to turn undead; spending a turn attempt as a full-round action grants
    living creatures within 60 feet fast healing 3 for 1 + Charisma modifier
    rounds. Player's Handbook II (p. 89) requires the ability to turn undead;
    spending a turn attempt as a swift action grants a +5 Heal bonus and +2
    healing per die from conjuration (healing) spells until the end of the
    turn. Keep their separate IDs and prerequisites; the existing Sacred
    Purification prerequisite test correctly requires the PHB II version.
- Spells have 105 normalized names represented by multiple records, but no
  such records share class access in the current catalog. These appear to be
  class-specific spell-level records, not duplicate choices for one class.
  Preserve that distinction and check for same-class conflicts when adding
  sourcebook spells.
- Current class and race definitions have no repeated IDs or normalized names.
- This scan does not yet detect every semantic duplicate, replacement, erratum,
  or near-duplicate across the full book collection.

## Duplicate-resolution rules

1. Compare canonical option identity, mechanics, prerequisites, and source
   notes, not just spelling or IDs.
2. Merge identical reprints into one selectable option with complete source
   attribution.
3. Keep genuinely different same-name versions separate, with clear source or
   version labels and their own eligibility rules.
4. Model class-specific spell levels without presenting the same spell twice
   to a single class.
5. Record whether a feat or other option is repeatable so legal repeated
   selections are not mistaken for catalog duplicates.
6. Do not remove or merge an ambiguous entry until its supplied sourcebook has
   been checked.

## Audit workflow

1. **Extract options:** Review the candidate sections in each book and record
   every in-scope option with source/page and player-character eligibility.
2. **Cross-reference:** Match each option to the current catalog, including
   name aliases, source attribution, and existing tests.
3. **Resolve duplicates:** Classify matches as identical reprints, distinct
   same-name versions, class-level spell records, semantic overlaps, or true
   duplicates; record the disposition and source evidence.
4. **Assess gaps:** Mark each option as cataloged, prerequisite-checked,
   effects modeled, manually tracked, setting-gated, unsupported, or excluded.
5. **Prioritize implementation:** Build a dependency-aware backlog after the
   inventory and duplicate decisions are complete.
6. **Review and fix one book at a time:** Verify all in-scope feats, spells,
   base classes, and prestige classes against the supplied source, explicitly
   noting categories without options. Correct confirmed defects, add focused
   regression coverage, and document manual or unsupported behavior.
7. **Persist the checkpoint:** Update the README progress tracker after each
   book and before pausing or switching books. Include checked sections/pages,
   fixes, validation commands/results, remaining gaps, and the exact next
   action. Do not mark an inventory or partially checked book as a completed
   full review.

The existing [rules coverage matrix](./rules-coverage.md) is the implementation
baseline; it documents partial coverage and known manual limitations, not full
collection completeness.

## PHB armor and shield proficiency audit

Checked the Armor Proficiency (Light, Medium, and Heavy), Shield Proficiency,
and Tower Shield Proficiency feats against PHB 89. The prerequisites and the
rules for shield nonproficiency match the catalog: medium requires light,
heavy requires light and medium, and tower shield proficiency requires Shield
Proficiency.

The PHB Ranger class feature grants light armor and shields except tower
shields (PHB 47), not medium armor. Removed Ranger's automatic medium-armor
proficiency and added a regression test for the resulting Chainmail
nonproficiency penalty.

DMG 284 says mithral armor counts one category lighter for movement and other
limitations. Armor proficiency follows that adjusted category: Mithral
Breastplate counts as light, and Mithral Full Plate counts as medium. The
proficiency checks now share this category adjustment with movement rules.

## PHB spell DC and spell-resistance feat audit

Checked Spell Focus and Spell Penetration (PHB 100), Greater Spell Focus and
Greater Spell Penetration (PHB 94), and Augment Summoning (PHB 89).

- Spell Focus adds +1 to save DCs for spells from its chosen school and can be
  selected again for a different school. Greater Spell Focus requires Spell
  Focus in the selected school, adds a stacking +1, and also requires a new
  school on repeated selections.
- Spell Penetration adds +2 to caster-level checks to overcome spell
  resistance. Greater Spell Penetration requires Spell Penetration and adds a
  stacking +2.
- Augment Summoning requires Spell Focus (Conjuration) and grants creatures
  conjured by any summon spell a +4 enhancement bonus to Strength and
  Constitution for the spell's duration.

Corrected duplicate-school warnings so they respect chronological feat
selection: the first valid school choice is retained and a later duplicate is
the invalid selection. The spell DC and per-class spell-resistance modifiers
match the source; applying Augment Summoning's bonuses to summoned creatures
and comparing caster-level checks to target spell resistance remain manual.
Seven focused spell-feat tests passed. Lint passed, and the production build
passed at 516,031 bytes after the initial JavaScript budget was raised by 32
bytes to 516,032.

## PHB weapon proficiency and attack-feat audit

Checked Simple Weapon Proficiency (PHB 100), Martial Weapon Proficiency (PHB
97), Exotic Weapon Proficiency (PHB 94), Point Blank Shot (PHB 98), and Weapon
Finesse (PHB 102).

- Simple Weapon Proficiency grants proficiency with all simple weapons.
  Automatic class-granted proficiencies and the class exceptions are reflected
  in weapon proficiency checks.
- Martial Weapon Proficiency requires BAB +1, grants one selected martial
  weapon type, and can be selected again for another type. Added the missing
  BAB prerequisite to the catalog.
- Exotic Weapon Proficiency requires BAB +1 and grants one selected exotic
  weapon type per selection. Bastard sword and dwarven waraxe additionally
  require Strength 13; class and racial familiarity rules remain represented
  by the proficiency calculations.
- Point Blank Shot grants +1 on ranged attack and damage rolls through 30 feet,
  inclusive.
- Weapon Finesse requires BAB +1 and substitutes Dexterity for Strength on
  eligible size-appropriate melee attacks, not damage. Natural weapons count
  as light, and shield check penalties still apply.

Natural attacks are not modeled as weapon-sheet selections, so their Weapon
Finesse interaction remains manual. Thirty-four focused tests passed, including
the prerequisite and attack-calculation regressions. The full proficiency
suite passed 115 tests and retains one unrelated failure in weapon-choice
normalization. Lint, build, and `git diff --check` passed.

## PHB defensive and survival feat audit

Checked Blind-Fight (PHB 89), Combat Casting and Combat Reflexes (PHB 92), and
Diehard and Endurance (PHB 93).

- Blind-Fight permits one reroll of a failed concealment miss chance in melee,
  removes the melee advantages of invisible attackers, and reduces the speed
  penalty for darkness or poor visibility to three-quarters normal speed
  instead of half speed. It does not work against a creature affected by
  *blink*.
- Combat Casting grants +4 on Concentration checks to cast a spell or use a
  spell-like ability while casting defensively, grappled, or pinned.
- Combat Reflexes grants additional attacks of opportunity equal to a
  nonnegative Dexterity bonus, and permits attacks while flat-footed. It
  remains one attack per opportunity and does not increase a rogue's
  Opportunist uses; clarified both limits in the feat description. Fighter and
  2nd-level monk bonus-feat grants are represented.
- Diehard requires Endurance, automatically stabilizes the character at -1 to
  -9 hp, and requires an immediate choice to act as disabled or fall
  unconscious. Acting as disabled allows one move or standard action, not both;
  strenuous actions cause 1 damage, and -10 hp is fatal.
- Endurance grants the listed +4 check/save bonuses and permits sleeping in
  light or medium armor without fatigue. Ranger gains it automatically at
  Ranger 3.

Blind-Fight's concealment/visibility resolution, Endurance's environmental
checks and armor-sleep condition, and Diehard's in-combat choice and damage
tracking remain manual. Focused Combat Reflexes, Combat Casting, Ranger
Endurance, and feat-description tests passed; lint and the production build
passed.

## PHB unarmed and arrow-defense feat audit

Checked Deflect Arrows (PHB 93), Improved Grapple (PHB 95), Improved Unarmed
Strike (PHB 96), Snatch Arrows (PHB 100), and Stunning Fist (PHB 101).

- Deflect Arrows requires Dexterity 13 and Improved Unarmed Strike. It works
  once per round with a free hand when aware and not flat-footed; massive
  projectiles and spell-generated ranged attacks cannot be deflected. A monk
  may select it as a 2nd-level bonus feat without meeting prerequisites.
- Improved Grapple requires Dexterity 13 and Improved Unarmed Strike. It
  prevents an attack of opportunity when making the touch attack to start a
  grapple and grants +4 on all grapple checks. A 1st-level monk may select it
  as a bonus feat without meeting prerequisites; the grapple bonus is
  calculated.
- Improved Unarmed Strike makes the character armed while unarmed, preserves
  attacks of opportunity against unarmed attackers, and allows lethal or
  nonlethal unarmed damage at the player's choice.
- Snatch Arrows requires Dexterity 15, Deflect Arrows, and Improved Unarmed
  Strike. It catches a weapon deflected by Deflect Arrows; a caught thrown
  weapon can be immediately returned to its attacker or kept. A free hand is
  required.
- Stunning Fist requires Dexterity 13, Wisdom 13, Improved Unarmed Strike,
  and BAB +8. It must be declared before the attack; a miss wastes the attempt.
  A damaged target makes a Fortitude save at DC 10 + half character level +
  Wisdom modifier or is stunned for 1 round. It is limited to once per round
  and once per day per four character levels; monks may select it as a
  1st-level bonus feat without prerequisites and use monk-level-based daily
  attempts.

The Monk bonus-feat slots honor their listed prerequisite exceptions, and the
feat definitions match the source. Deflect Arrows/Snatch Arrows resolution,
Stunning Fist attempts/saves, and unarmed attacks of opportunity remain manual.
Corrected a test fixture that selected Improved Grapple without Improved
Unarmed Strike. Twelve focused tests passed; lint, build, and `git diff
--check` passed.
