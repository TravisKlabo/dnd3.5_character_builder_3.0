# Rules Coverage Matrix

**Reviewed:** 2026-11-17 (bounded checkpoints below)

**Baseline:** Core D&D 3.5 rules represented by the project’s documented SRD scope.

This is a qualitative implementation snapshot, not a certification of the ruleset.
“Implemented (bounded)” means the listed behavior exists and selected cases have
regression coverage; it does not mean every rule in that category is complete.
Passing tests demonstrate their specific scenarios, not comprehensive SRD
coverage.

## PHB catalog minimum-level-9 spell checkpoint

Reviewed **31 titles / 31 records**, Astral Projection through Wish, against
the supplied PHB, including inherited headers and domain access. No spell
headers or access changed. Updated six summaries: Astral Projection's
per-traveler cost, Mass Heal's healing rate and undead effect, Imprisonment's
save penalty condition, Meteor Swarm's per-sphere fire resistance, Miracle's
duplication costs, and Storm of Vengeance's targeting and Concentration DC.

Spell effects remain manual. This completes the represented spell catalog
review, not PHB rules implementation. **Validation:** 291 spell-suite tests,
lint, types and production build pass. Full-suite and print/PDF checks were
not run. **Next:** verify character creation and level-up, starting with feat
eligibility at the level taken.

## PHB catalog minimum-level-8 spell checkpoint

The 2026-11-17 batch checked all **46 catalog-minimum-level-8 titles / 49
class-level records**, Animal Shapes through Whirlwind, against supplied PHB
printed pp. 198-301 and inherited parents/tables. No domain-only titles occur;
all represented class access/levels and source headers match. Expanded or
corrected **8 summaries** without changing spell identities or class access.

Binding now includes assistant caster-level bonuses and release-trigger
limits; Clenched Fist's attack modifier and Clone's source-sample/soul
requirements are clarified. Added exact focus/component costs for Cloak of
Chaos and Symbol of Death, Earthquake's terrain DC/damage rules, Greater Shadow
Evocation's inherited disbelief chance, and Greater Spell Immunity's
one-active-spell limit.

**Manual boundary:** no spell-effect automation or DC calculations. Saves,
damage, conditions, buffs, concentration, transformations, symbols, wards,
travel, divination, payment/cost spending and creatures remain manual.
Summaries do not replace full source descriptions or certify the PHB.

**Validation:** **338 tests pass across two focused spell suites**. Lint,
TypeScript checks, production build and whitespace pass. No full-suite or
print/PDF run.
**Historical next target (completed above):** **31 catalog-minimum-level-9 titles / 31 records**,
Astral Projection through Wish. See the [audit checkpoint](player-option-audit.md#phb-catalog-minimum-level-8-spell-checkpoint-2026-11-17).

## PHB catalog minimum-level-7 spell checkpoint

The 2026-11-17 batch checked all **49 catalog-minimum-level-7 titles / 55
class-level records**, Animate Plants through Word of Chaos, against supplied
PHB printed pp. 201-298 and inherited parents/tables. No domain-only titles
occur; every represented class list/level matched. Corrected headers in **5
records** and expanded/corrected all 55 summaries without changing identities
or class access.

Restored Insanity's subschool, Invisibility, Mass's saving throw, Phase Door's
duration, and both seventh-level summon spells' Summoning metadata. Corrected
the Resurrection diamond cost to **10,000 gp**. Summaries now preserve
HD-tiered word effects and banishment, mass-spell targets/damage, summoning,
teleport/travel interactions, costly components, and limits across
Simulacrum, Spell Turning, Teleport Object and other spells.

**Manual boundary:** no spell-effect automation or DC calculations. Saves,
damage, conditions, buffs, concentration, transformations, symbols, wards,
travel, divination, payment/material/XP spending and creatures remain manual.
Symbol of Stunning appears to inherit Symbol of Death's 150-hp activation
budget without explicitly restating it; the summary leaves the ambiguity for
DM adjudication. This is not full PHB certification.

**Validation:** **100 new source/header/effect/projection/setting regressions**
pass; **1,424 tests pass across nine focused suites**, plus **151 source-
attribution cases** run separately. Lint, app/test types, production build and
whitespace pass. No full-suite or print/PDF run. The prior full-suite timing
limitation remains open.
**Historical next target:** **46 minimum-level-8 titles / 49 records**, starting
**Animal Shapes**, through Whirlwind; that batch is now completed above.

## PHB catalog minimum-level-6 spell checkpoint

The 2026-11-17 batch checked all **64 catalog-minimum-level-6 titles / 76
class-level records**, Acid Fog through Word of Recall, against supplied
PHB printed pp. 196-303 and inherited parents/tables. No domain-only titles
occur in this group; every represented class list/level matched. Corrected
headers in **21 records** and expanded/corrected all 76 summaries without
changing identities or class access.

Restored Forceful Hand, both summon VI spells, both sixth-level symbols and
Undeath to Death casting fields. Geas/Quest inherits Lesser Geas's duration;
subschools/descriptors and Eyebite's printed duration wording are restored.
Mystic inheritance and Dragonlance-only Bard healing exclusions are preserved.

Removed embedded advertising/tracking code from Veil and truncated Freezing
Sphere/Wall of Iron text. Summaries now specify Disintegrate's ranged touch,
damage/save/object limits; Chain Lightning's same-DC secondary saves; Heal's
actual condition list and drained-level exclusions; Heal/Harm caps and
undead reversal; Eyebite's HD/action limits; Transformation's spellcasting
loss; and Undeath to Death's inherited **9+ HD immunity**. Added planar
creature/service/payment/escape, ward/image, travel/load and costly-component
limits. Stone to Flesh's separate **fixed DC 15** survival check and
Banishment's item-based bonuses are explicitly described, not automated.

**Manual boundary:** no new spell-effect automation or DC calculations.
Damage, hp floors, saves/modifiers, conditions, buffs, concentration, forms,
symbols, wards, crafting, travel/divination, payment/material/XP spending and
creatures remain manual. Symbol of Fear does not explicitly remove Symbol
of Death's 150-hp budget, unlike Persuasion; its summary flags this inheritance
for the DM instead of inventing unlimited targets. The earlier Cloudkill
6-HD overlap remains flagged. This is not full PHB certification.

**Validation:** **130 new regressions**, **1,632 passing tests across ten
focused suites**; lint, app/test types, production build, size budget and
whitespace pass (**492,299 / 515,835** initial-JS bytes). No full-suite or
print/PDF run; the prior full-suite timing limitation remains open.
**Historical next target (completed above):** **49 minimum-level-7 titles / 55
records**, starting **Animate Plants**, through Word of Chaos; no domain-only
titles. See the
[audit](player-option-audit.md#phb-catalog-minimum-level-7-spell-checkpoint-2026-11-17).

## PHB catalog minimum-level-5 spell checkpoint

The 2026-11-17 batch checked all **64 catalog-minimum-level-5 titles / 74
class-level records**, Atonement through Waves of Fatigue, against supplied
PHB printed pp. 201-301, inherited parents and premium polymorph rules
(p. 320). No domain-only titles occur in this group; every class list/level
matched. Corrected headers in **39 records** and expanded/corrected all 74
summaries without changing catalog identities or class access.

Restored inherited fields for Overland Flight, both summon V spells and both
fifth-level symbols, including 1-round summon and 10-minute symbol casting.
Restored subschools/descriptors, Raise Dead's Healing metadata, and Waves of
Fatigue's **None** saving throw. Mystic inheritance and setting-specific Bard
healing exclusions are preserved.

Confirmed definition fixes include the supplied edition's Baleful Polymorph:
equipment drops; polymorph-subschool rules/immunities apply; its additional
Will save occurs only after **24 consecutive hours**, not immediately.
Lesser Planar Binding calls exactly **one elemental or outsider up to 6 HD**;
Mind Fog penalizes Wisdom checks/Will saves, not Wisdom scores; nondamaging
Shadow Evocation effects fail entirely against disbelievers. Repaired
truncated summaries, damage caps, bonuses, costly components, trap/condition
limits, resurrection losses and travel/creature restrictions throughout.

**Manual boundary:** no new spell-effect automation or DC calculations.
Possession, transformations, attacks, buffs, concentration, symbols, site
wards, crafting, resurrection, travel/divination tables, XP/material spending
and creatures remain manually resolved. Cloudkill's supplied text overlaps
at **6 HD** (4-6 death save versus 6+ damage save); summary and README flag
this for DM adjudication rather than inventing a ruling. Summaries do not
replace full source descriptions or certify the PHB.

**Validation:** **130 new regressions**, **1,502 passing tests across nine
focused suites**; lint, app/test types, production build, size budget and
whitespace pass (**492,299 / 515,835** initial-JS bytes). No full-suite or
print/PDF run; the prior full-suite timing limitation remains open.
**Historical next target (completed above):** **64 minimum-level-6 titles / 76 records**, starting
**Acid Fog**, no domain-only titles. See the
[audit](player-option-audit.md#phb-catalog-minimum-level-5-spell-checkpoint-2026-11-17).

## PHB catalog minimum-level-4 spell checkpoint

The 2026-11-17 batch checked **68 titles / 87 records**, Air Walk through
Zone of Silence, against the supplied PHB, printed pp. 196-303, and inherited
parents. This catalog-minimum-level group includes **64 ordinary-class titles
and four domain-only titles** (83 ordinary variant records plus four domain-only
records), not 68 lowest-core-class-level titles. Corrected headers in **42
records** and expanded/corrected every summary without changing names or levels.

Restored inherited fields for Cure/Inflict Critical Wounds, Mass Enlarge/Reduce
Person, Locate Creature, Solid Fog and Summon Monster IV. Preserved all Healing
variants, Mystic inheritance and Dragonlance-only Bard filtering. Domain-only
Chaos Hammer, Holy Smite, Order's Wrath and Unholy Blight retain domain access
and remain excluded from ordinary class lists. Restored source subschools,
descriptors, durations and V/S-only components where appropriate.

Confirmed corrections include Giant Vermin's complete counts/size progression,
Wall of Ice's **3 hp per inch of thickness per 10-ft. square**, Tree Stride's
scraped advertising text and travel restrictions, Shadow Conjuration's
summoning/creation-only scope and disbelief rules, and damage/bonus/save/
component/target limits throughout.

**Bounded display correction:** Dismissal's optional target-adjustment metadata
labels the number **Base DC** and displays
`final DC = base DC + caster level - target HD`, for both ordinary and prepared
metamagic rows. The target adjustment remains manual; the ordinary DC helper,
Poison's formula, generic level summaries and print layouts are unchanged.

**Manual boundary:** spell effects, attacks, buffs, concentration, damage,
conditions, form/terrain changes, resurrection, transfers, paid services and
creature management remain manual. Summaries are not substitutes for complete
source descriptions or full PHB certification.

**Validation:** **145 new regressions**, **1,372 passing tests across eight
focused suites**; lint, app/test types, production build, size budget and
whitespace pass (**492,299 / 515,835** initial-JS bytes). No full-suite or
print/PDF run; the prior full-suite timing limitation remains open.
**Historical next target (completed above):** **64 minimum-level-5 titles /
74 records**, starting **Atonement**, with no domain-only titles. See the
[audit](player-option-audit.md#phb-catalog-minimum-level-4-spell-checkpoint-2026-11-17).

## PHB minimum-level-3 spell checkpoint

The 2026-11-17 batch checked all **79 minimum-level-3 titles / 101 class-level
records** against the supplied PHB, printed pp. 198-300, including inherited
headers and effect descriptions. Corrected headers in **45 records** and
expanded/corrected all 101 summaries consistently across variants.

Restored missing inherited details for Cure Serious Wounds, Deep Slumber,
Deeper Darkness, Inflict Serious Wounds, Invisibility Sphere, Greater Magic
Fang and both summon III spells. Restored alignment/energy/subschool metadata
and Healing subschools across every variant. Core class access/levels matched;
Mystic inheritance and Dragonlance-only Bard healing filters are preserved.

Confirmed summary corrections include Haste's extra full-attack weapon attack,
not an extra action; Invisibility Purge's local negation, not dispelling;
Vampiric Touch's capped temporary hp, not healing; magic-circle alignment
barriers; Fireball/Lightning Bolt's 10d6 caps; Call Lightning's bolt limits;
Prayer/Good Hope/Crushing Despair bonus and roll restrictions; and target,
duration, saving-throw, spell-resistance and component limitations.

**Automated (bounded):** Poison now carries explicit save-DC formula metadata.
The shared DC helper uses `10 + floor(effective caster level / 2) + Wisdom`
with applicable DC bonuses, rather than ordinary spell-level DCs. Both ordinary
and prepared-metamagic spell-sheet rows pass that metadata. Heighten does not
alter the formula's caster-level term. Other spells retain ordinary DC rules.
Generic per-level summaries are unchanged; no print layout changes.

**Manual boundary:** spell attacks, buffs, damage, conditions, concentration,
forms, terrain, traps, bindings, summoned creatures and mounts are not
automated by this audit. Full source descriptions govern remaining edge cases;
the PHB is not certified.

**Validation:** **168 new regressions**, **1,342 passing tests** across eight
focused suites; lint, app/test types, production build, size budget and whitespace
pass (**492,299 / 515,835** initial-JS bytes). No full-suite or print/PDF run;
the earlier full-suite timing limitation remains open.
**Historical next target (completed above):** **68 catalog minimum-level-4
titles / 87 records**, starting **Air Walk**, including four domain-only titles.
See the [audit](player-option-audit.md#phb-minimum-level-3-spell-checkpoint-2026-11-17).

## PHB minimum-level-2 spell checkpoint

Checked the remaining **88 minimum-level-2 titles / 110 class-level records**
against the supplied PHB, printed pp. 196-303, including inherited headers
and effect bodies. Leomund's Trap was already checked, completing that
89-title group's definition/summary pass. Corrected headers in 48 records
and expanded/corrected summaries consistently across all 110 variants.

Restored missing inherited casting details for seven titles, including both
second-level summon spells. Repaired Touch of Idiocy's penalty-not-damage
wording, Scare's frightened condition, Death Knell's caster-level-only benefit,
Protection from Arrows' DR 10/magic and absorption cap, and Scorching Ray's
caster-level 7/11 ray thresholds. Other summary corrections cover target
restrictions, bonus types, damage schedules/caps, saves, spell resistance
and costly components. Mystic inheritance and Dragonlance-only Bard healing
filters remain covered. No titles were added or removed.

**Manual boundary:** spell attacks, buffs, damage, conditions, concentration,
forms, terrain, traps and summoned creatures remain manually resolved;
summaries do not replace full source descriptions. The PHB is not certified.

**Validation:** 162 new source/header/summary/projection regressions; **768
passing tests** across five focused suites. Lint, app/test types, production
build, size budget and whitespace pass. No full-suite rerun or print/PDF work;
the prior full-suite timing limitation below remains open.
**Historical next target (completed above):** 79 minimum-level-3 titles, starting **Animate Dead**.
See the [audit](player-option-audit.md#phb-minimum-level-2-spell-checkpoint).

## PHB feat and low-level spell checkpoint

The 2026-11-17 batch reviewed all **109 PHB feat definitions** (printed
pp. 87-102): prerequisites, benefit summaries, repeatability, Fighter flags
and categories. Ordinary Quicken uses Complete Arcane p. 86's **swift action**
update, sharing the swift-action limit; it cannot modify spontaneously cast
spells, including cleric/druid conversions. Player-facing notices now make
that prohibition explicit instead of offering a manual spontaneous option.
Eligibility, action use and most conditional metamagic effects remain manual.

School-based save DCs recognize both subschools and bracketed descriptors:
Spell Focus/Greater Spell Focus still apply to `Evocation [Fire]`, and the
Gnome illusion bonus remains separate. Prestige spell-school counts use the
same parser. Toughness HP stacks only active picks; illegal saved Wizard bonus
choices no longer add HP and retain the standard repair warning.

**Spell headers checked:** all **115 titles** available at level 0 or 1 to any
core class, across **131 class-level records**. Source-derived regressions
verify lists/levels, school/subschool/descriptors, components, casting time,
range, duration and saves, including inherited fields. Fourteen confirmed
effect-summary errors were repaired, including missing Magic Missile damage,
Ray of Enfeeblement's penalty-vs-damage distinction, Lullaby's sleep-only save
penalty and Shield's bonus type. Effects remain manually resolved; header
review is not complete spell-body or effect automation certification.
Feather Fall's immediate action is verified by Complete Arcane p. 86.

Phantom Trap is Leomund's Trap (PHB pp. 247-248), not an unverified source.
Merged the duplicate and retained both lookup names. Saved spell lists,
ownership/acquisition/learning/mastery and prepared-copy/Heighten/metamagic
records migrate without losing copies or flag alignment. Conflicting metadata
produces an explicit import error. The base catalog now has **715 class-level
records / 605 distinct titles**.

**Validation:** the final focused run passes 361 tests, including 169 PHB
source/mechanics/migration cases; an earlier spell-UI/proficiency run passed
637 tests. Lint, app/test types, production build and
size budget pass (492,191 / 515,835 initial-JS bytes). Full-suite attempts
reached 1,771/1,773 passing but hit long, intermittent stalls in existing UI
tests; a clean full-suite run is still outstanding. Print/PDF generation
remains deferred. The historical next target was the **88 remaining minimum-level-2
spell titles**, now completed by the checkpoint above; Leomund's Trap was already checked.
See the [audit](player-option-audit.md#phb-featlow-level-spell-checkpoint-2026-11-17)
and [README](../README.md#sourcebook-review-progress).

## PHB class and represented DMG prerequisite checkpoint

The 2026-11-16 class batch checked all 11 PHB class chassis and represented
milestone tables against printed pp. 23-58. Paladin's base Will save is poor;
Divine Grace adds its separate bonus from Paladin 2. Monk's displayed Fast
Movement starts at 3, matching the feature text/numeric movement column.
Wizard bonus slots enforce metamagic, item creation, Spell Mastery and verified
supplemental exceptions, without waiving prerequisites. Complete Mage's 24
reserve feats are categorized, and its three specialist-only Wizard bonus
exceptions require the matching specialty. Invalid saved Wizard-category
choices remain visible with warnings and can be replaced; shared selection
filtering excludes their mechanical effects and prerequisite contributions.

All 13 represented DMG prestige entry-requirement sets (pp. 176-196) now have
source-correct metadata, shared prerequisite checks and complete requirement
tooltips, including scoped feat choices, distinct Knowledge skills,
sneak-attack dice, language, all-martial proficiency, spontaneous casting,
both Mystic Theurge traditions, and Loremaster's distinct divination repertoire.
Specific spell checks require castable access, not merely an unchecked spell
name. Assassin's fictional special condition and Dragon Disciple's creature
type/templates/DM-approved variety remain manual confirmations.

**Archmage (DMG pp. 178–179):** The catalog and eligibility checks now cover
both 15-rank skills, Spellcraft-specific Skill Focus, Spell Focus in two distinct
schools, a castable 7th-level arcane spell, and known arcane spells of 5th level
or higher from five distinct schools. All five levels advance a qualifying
arcane casting class. High Arcana checks minimum slot levels and repeatability,
then deducts the chosen slots permanently. Spell Power increases caster level
without changing spell progression. The spell-like ability option deducts
both its cost and its additional reserved slot; the DM verifies the recorded
spell, metamagic, daily uses, and XP cost. Other situational effects remain manual.

**Blackguard and Red Wizard (DMG pp. 181–183, 193–194):** The entry catalog
now covers all 16 DMG prestige classes. Blackguard's outsider contact and Red
Wizard's Thayan origin and Tattoo Focus remain DM confirmations. The Assassin
and Blackguard use their own spell progressions (see below). Blackguard summoning is limited to evil
creatures; the printed *Protection from Elements* name is flagged for DM
review rather than silently substituted.

**Validation:** 130 core class, Dragonlance prestige and app tests passed,
along with lint, TypeScript checks, and the production build.

**Playable DMG advancement (pp. 176–177, 185–187):** Arcane Archer, Duelist,
and Dwarven Defender can take prestige levels 1–10. Hit Dice, skill points and
class skills, BAB, base saves, proficiencies, and feature milestones follow the
DMG tables. Arcane Archer does not advance its qualifying spellcasting class.
Duelist's Improved Reaction and unarmored Grace, and Defender's dodge AC and
flat-footed Uncanny Dodge, affect the sheet. Arrow powers, Canny Defense,
other situational Duelist abilities, Defensive Stance, traps, flanking and
damage reduction still require manual resolution.

**Caster prestige advancement (DMG pp. 177–178, 187–188):** Arcane Trickster
advances a pre-entry spellcasting class at every level; Eldritch Knight advances
a pre-entry arcane class from level 2 onward. The first Eldritch Knight level
instead grants one fighter-list bonus feat with ordinary prerequisites. The
builder records each level's casting target so a later choice does not move
earlier advancement. Saves lacking level history use their stored casting
class for unrecorded levels. Arcane Trickster's situational abilities and sneak
attack resolution remain manual.

**Thaumaturgist (DMG pp. 196–197):** All five levels are playable. Each level
advances an existing pre-entry spellcasting class, and level 2 grants Augment
Summoning without spending a feat slot. Summon statistics, duration adjustments,
planar payments, contingency triggers, and cohorts remain manual.

**Shadowdancer (DMG pp. 195–196):** Levels 1–10 apply the class chassis,
specific weapon and light-armor proficiencies, and feature milestones. Level 2
Uncanny Dodge applies to flat-footed AC. Stealth conditions, evasive abilities,
shadow jump usage, shadow companion management, and flanking remain manual.

**Horizon Walker (DMG pp. 189–190):** Levels 1–10 apply the class chassis and
require one new terrain mastery per level. Planar terrain becomes available at
prestige level 6 without replacing ordinary terrain options. The sheet lists
earned choices, and import validates their order and uniqueness. Terrain
benefits and creature-specific insight bonuses are resolved manually.

**Mystic Theurge (DMG pp. 192–193):** Prestige levels 1–10 advance one
pre-entry arcane class and one pre-entry divine class each. Level history keeps
both selections without transferring earlier advancement to a new target.
Neither track grants other base-class features.

**Assassin and Blackguard (DMG pp. 180–183):** Levels 1–10 have independent
casting tracks: Intelligence-based spontaneous arcane casting for Assassin,
and Wisdom-based prepared divine casting for Blackguard. A zero in the
daily-slot table means bonus slots only, not a base slot or a spell level
that has not yet been reached. Learning, preparation, and spent slots are
tracked separately from other classes. DM entry conditions, situational
combat features, companions, fallen-paladin benefits and level trades,
and evil-only summon selection remain manual.

**Loremaster (DMG pp. 191–192):** Levels 1–10 advance one pre-entry
spellcasting class each. Odd levels require a distinct secret gated by
Loremaster level plus Intelligence modifier; levels 4 and 8 require a new
language. The sheet applies the HP, save, attack, and dodge bonuses and
provides a feat choice for Applicable Knowledge. Instant Mastery ranks,
Newfound Arcana bonus slots, and lore effects are tracked manually.

**Hierophant (DMG pp. 188–189):** Levels 1–5 increase caster level, not
slots, spells known, or spell-level access. Each level requires an ability;
the builder checks class restrictions and repeatability, applies cumulative
Spell Power, and restricts metamagic feat choices. Spell-like ability slot
allocation and other situational abilities remain manual.

**Dragon Disciple (DMG pp. 183–185):** Levels 1–10 apply the class chassis,
permanent ability boosts, and cumulative natural armor increases. Entry
requires an ancestry choice and DM confirmation. Seven bonus slots are
assigned permanently to currently castable spell levels without increasing
caster level or spells known. Claw and bite routines, breath use, flight,
blindsense, and the capstone's creature type, senses, and immunities remain
manual. The capstone's ability and natural armor boosts are already applied.

**Red Wizard (DMG pp. 193–195):** Levels 1–10 advance one arcane class,
require a specialist school and additional prohibited school(s), and apply the
level-based Spell Power bonus to caster level. The level-5 feat is restricted
to item creation, metamagic, or Spell Mastery. Tattoo Focus adds +1 save DC in
the chosen school. Newly learned arcane spells from additional prohibited
schools are rejected, while previously known spells remain. Thayan origin and
Tattoo Focus require DM confirmation. Specialist Defense and spell-resistance
checks from Tattoo Focus are manual; circle magic, participant spell
expenditure, and its temporary benefits are not tracked.

The level-up UI records specialization, prohibited schools, arcane advancement,
and the Forgotten Realms confirmation. Regression coverage verifies imported
level-five feat restrictions and prohibited-school spell warnings. The focused
app/core/rules/spell/storage suites passed **823 tests**; lint and the
production build passed with **515,360 / 515,835 bytes** of initial JavaScript.

**Not implemented:** exhaustive PHB class-feature,
feat-benefit and spell-mechanics automation. Legacy prestige references are
preserved but grant no levels, features or weapon proficiency. Varag remains
explicitly deferred. These are bounded checks, not full-book certification.
Detailed evidence and exact resume point are in the
[audit checkpoint](player-option-audit.md#phbdmg-class-review-checkpoint-2026-11-16)
and [README](../README.md#sourcebook-review-progress).

## Provided-book feat inventory

The catalog inventory covers 109 feats from the *Player's Handbook* (3.5),
including its three armor-proficiency entries; all 13 epic feats from the
*Dungeon Master's Guide* (3.5); all 13 entries in the *Monster Manual* (3.5)
monster-feat chapter; and all 13 feats from the *Dragonlance Campaign
Setting* (3.5). The source sections are PHB Table 5-1 and feat descriptions
(pp. 87–102), DMG epic feats (pp. 209–210), MM Chapter 6 (pp. 303–304), and
Dragonlance Chapter 3 (pp. 85–88). The catalog test locks the sourcebook counts
and complete DMG and Dragonlance feat-name lists, plus all 13 MM entries.
Eight MM entries are attributed to the earlier
*Monster Manual II* printing; the remaining five are attributed to the 3.5
*Monster Manual*.

The 105 feat entries in *Player's Handbook II* Tables 3-1 through 3-7 (69
general, two ceremony, six combat-form, eight divine, nine heritage, five
metamagic, and six tactical feats) are cataloged with source attribution, and
the exact-name inventory is regression-tested. Prerequisites that depend on
manual divine caster-level entry or weapon-specific choices unavailable in the
builder remain marked for manual handling. *Blood-Spiked Charger* checks both
required weapon proficiencies and its distinct Weapon Focus choices. Weapon
mastery prerequisites check that the required Weapon Focus and Weapon
Specialization selections share a proficient weapon; *Weapon Supremacy* also
checks that all four required weapon-feat selections use that same proficient
weapon. *Short Haft* requires Weapon Focus with a reach weapon. The selected
armor type for *Armor Specialization* and the damage type selected for *Melee
Weapon Mastery* are not represented in the builder, so prerequisites depending
on those exact choices remain manual. *Arcane Thesis* requires actual arcane
spellcasting rather than caster level alone. Manually selected mastery weapon
types and weapon-specific effects remain manual. *Blood-Spiked Charger's*
tactical maneuvers and other situational combat effects remain manual.
*Vatic Gaze* requires arcane caster level 9; its Sense Motive check is manual.
*Water Splitting Stone* checks the Monk bonus-feat exception (Stunning Fist and
base attack bonus +9); resolving its damage remains manual.
PHB II sorcerer-heritage activations and scaling effects are described but
remain manually tracked.
The selected visual check of printed pp. 71–75 confirms the prerequisites and
benefits for *Acrobatic Strike*, *Active Shield Defense*, *Adaptable Flanker*,
*Agile Shield Fighter*, and *Arcane Accompaniment*. Their catalog descriptions
now specify the Tumble trigger and timing, attacks-of-opportunity conditions,
Adaptable Flanker's swift-action target and flanking positions, Agile Shield
Fighter's full-attack penalties, and Arcane Accompaniment's spell-level
duration. These situational effects remain manual.
*Two-Weapon Pounce* and *Two-Weapon Rend* are available through the matching
Ranger two-weapon combat-style slots at levels 6 and 11 while the style is
active in light or no armor; attack and damage resolution remains manual.
*Tumbling Feint*'s timing and bonus are described but resolved manually.
Combat-form feat focus activation, duration, and associated effects remain
manually tracked.
The area effects, durations, and situational effects of *Profane Aura*,
*Sacred Purification*, and *Sacred Radiance* are described for manual
resolution.
Ceremony details are summarized for players to resolve manually.
Turn/rebuke prerequisites distinguish either capability from turn-only and
rebuke-only requirements. The Cleric feature is recorded generically, so the
builder derives the mode from alignment and deity where the PHB specifies one.
Neutral Clerics of neutral deities choose a mode manually; the PHB exceptions
for St. Cuthbert, Wee Jas, and Obad-Hai are applied.

The *Monster Manual II* table of contents has no feat chapter, but its
introduction has a "Creature Feats" sidebar with nine feat definitions. Eight
are cataloged—*Ability Focus*, *Flyby Attack*, *Hover*, *Multiattack*,
*Multiweapon Fighting*, *Quicken Spell-Like Ability*, *Snatch*, and
*Wingover*—and are now attributed to the book's September 2002 first printing.
The remaining *Multidexterity* is a 3.0 feat superseded by *Multiweapon
Fighting* in 3.5, so it is not treated as a missing 3.5 catalog entry. This
check covers the sidebar, not every feat selection in the monster statblocks.

The 2026-11-16 MMII definition screen also found *Beget Bogun* (p. 35),
previously omitted from the spell catalog. One shared entry now covers that
printing and its verified Complete Divine 3.5 reprint (pp. 152-153): druid 1,
standard-action casting, 25 XP, and the separately described week-long
construction requirements. Crafting and creature control remain manual.
No new base or prestige class definition was identified. MMII's 3.0 creature
and template conversions remain open rather than inferred from old ECL values.

The 65 entries in *Complete Mage*'s Table 2-1 (24 general, one metamagic, 10
heritage, 25 reserve, and five tactical feats) were checked against the
catalog. *Acidic Splatter* (p. 37), *Alacritous Cogitation* (p. 37),
*Aquatic Breath* (p. 40), *Battlecaster Defense* (p. 40), *Battlecaster
Offense* (p. 40), *Blade of Force* (p. 41), *Borne Aloft* (p. 41),
*Captivating Melody* (p. 41), *Clap of Thunder* (p. 41), *Cloudy Conjuration*
(p. 40), *Clutch of Earth* (p. 41), *Dazzling Illusion* (p. 41), *Defending
Spirit* (p. 41), *Delay Potion* (p. 41), *Dimensional Jaunt* (p. 41),
*Dimensional Reach* (p. 41), *Drowning Glance* (p. 42), *Elemental Adept*
(p. 42), *Energy Abjuration* (p. 42), *Energy Gestalt* (p. 43),
*Face-Changer* (p. 43), *Favored Magic Foe* (p. 42), *Fearsome Necromancy*
(p. 42), *Fiery Burst* (p. 44), the five Fey and five Fiendish heritage feats
(p. 44), *Hasty Spirit* (p. 44), *Hurricane Breath* (p. 45),
*Insightful Divination* (p. 44),
*Invisible Needle* (p. 45), *Magic Device Attunement* (p. 44), *Magic
Disruption* (p. 44), *Magic Sensitive* (p. 45), *Master of Undeath* (p. 45),
*Melodic Casting* (p. 45), *Metamagic School Focus* (p. 45), *Metamagic Spell
Trigger* (p. 45), *Metamagic Vigor* (p. 45), *Minor Shapeshift* (p. 46),
*Mystic Backlash* (p. 46), *Piercing Evocation* (p. 46), *Ranged Recall*
(p. 47), *Rapid Metamagic* (p. 47), *Residual Magic* (p. 47), *Retributive
Spell* (p. 48), *Shadow Veil* (p. 48), *Sickening Grasp* (p. 48), *Somatic
Weaponry* (p. 47), *Storm Bolt* (p. 48), *Sunlight Eyes* (p. 49), *Summon
Elemental* (p. 48), *Touch of Distraction* (p. 49), *Toughening Transmutation*
(p. 48), *Unsettling Enchantment* (p. 48), *Vengeful Spirit* (p. 48),
*Wind-Guided Arrows* (p. 49), and *Winter's Blast* (p. 49) are cataloged with
their supported prerequisites. The Watchful Spirit and Elemental Mastery
prerequisites are checked against recorded class features, but Wu Jen is not a
modeled base class, so feature acquisition is not automated. Tracking reserve spell
availability and effects, defensive-casting maneuvers, bardic effects, energy
spell sequences, heritage spell-like abilities and defenses, delayed potions,
item attunement, temporary undead control, spell-trigger charges, ranged
rerolls, retributive spells, occupied hands, casting-time adjustments,
creature-type selections, Wizard specialty-school effects, Wu Jen feat effects,
and tactical feat maneuvers remain manual. Elemental Adept's selected spell and
the Wu Jen class progression also remain manual.

The 56 entries in *Complete Scoundrel*'s Table 3-1 (21 general, 10 ambush,
five bardic music, and 20 luck feats) were checked against the catalog.
*Deadly Defense*, *Daredevil Athlete*, *Improved Familiar*, *Poison Expert*,
*Poison Master*, *Savvy Rogue*, *Cool Head*, *Freerunner*, *Sure Hand*,
*Sweet Talker*, *Mind Drain*, *Expanded Ki Pool*, *Enduring Ki*,
*Psychic Luck*, *Daring Outlaw*, *Daring Warrior*, *Improved Skirmish*,
*Swift Ambusher*, *Swift Hunter*, *Ascetic Stalker*, *Martial Stalker*,
*Master Spellthief*, *Psithief*, nine ambush feats, five bardic music feats, and
19 luck feats are represented and attributed to *Complete Scoundrel* (56/56).
The 42 listed skill tricks can be learned with their rank and special
prerequisites, level limits, and skill-point costs; the four category feats
grant up to two free tricks and increase the limit. Trick effects remain
manual, as do the other conditional combat, skill, bardic-music, poison, and
luck-reroll effects.
Improved Familiar adds the book's alternate familiar list; alignment and
creature-specific requirements remain manual.
Mind Drain requires manually confirming the character has a power-point
reserve; the feat's target power-point loss and psionic-focus effects remain
manual.
*Expanded Ki Pool* and *Enduring Ki* require manually confirming the Ninja's
Ki Power class feature; daily-use adjustments and duration remain manual.
*Psychic Luck* requires manually recording manifester level 3 and a luck feat;
psionic power use and rerolls remain manual.
*Daring Outlaw* and *Daring Warrior* require manually confirming Swashbuckler
Grace +1; their class-stacking benefits remain manual.
Poison feats require 8 ranks in Craft (poisonmaking) and Assassin level 1 as
the modeled Poison Use source; other Poison Use sources are not modeled.
*Improved Skirmish*, *Swift Ambusher*, and *Swift Hunter* require unmodeled
scout skirmish progression, so their skirmish dice and AC prerequisites are
recorded manually. *Swift Ambusher* combines recorded skirmish and sneak attack
dice when checking ambush-feat prerequisites; its class-stacking benefit and
damage tradeoffs remain manual. *Swift Hunter* also requires a recorded Favored
Enemy, while its ranger/scout class stacking and favored-enemy benefits remain
manual.
*Ascetic Stalker* and *Martial Stalker* require manually confirming their Ki
features; *Martial Stalker* also requires all martial weapon proficiencies.
Ninja progression and both feats' class-stacking benefits remain manual.
*Psithief* and *Master Spellthief* require manually confirming the Steal Spell
feature; *Psithief* also requires manifester level 1, and *Master Spellthief*
requires the ability to cast 2nd-level arcane spells. Their spellthief and
psionic effects and class-stacking benefits remain manual.

Tables 3-1 through 3-4 in *Complete Warrior* contain 83 entries (59 general,
six divine, eight tactical, and 10 weapon-style feats). *Anvil of Thunder*,
*Arcane Strike*, *Arterial Strike*, *Axiomatic Strike*, *Bear Fang*,
*Cavalry Charger*, *Clever Wrestling*, *Close-Quarters Fighting*,
*Combat Brute*, *Crescent Moon*, *Dash*, *Defensive Strike*,
*Defensive Throw*, *Destructive Rage*, *Divine Cleansing*, *Divine Might*,
*Divine Resistance*, *Divine Shield*, *Divine Vigor*, *Eagle Claw Attack*,
*Earth’s Embrace*, *Elusive Target*, *Extend Rage*, *Extra Rage*, *Extra
Smiting*, *Extra Stunning*, *Eyes in the Back of Your Head*, *Faster Healing*,
*Favored Power Attack*, *Fists of Iron*, *Fleet of Foot*, *Flick of the Wrist*,
*Flying Kick*, *Formation Expert*, *Freezing the Lifeblood*, *Giantbane*,
*Greater Kiai
Shout*, *Greater Resiliency*, *Greater Two-Weapon Defense*, *Hammer’s Edge*,
*Hamstring*, *High Sword Low Axe*, *Hold
the Line*, *Improved Buckler Defense*, *Improved Combat Expertise*, *Improved
Familiar*, *Improved Favored Enemy*, *Improved Mounted Archery*, *Improved
Rapid Shot*, *Improved Toughness*, *Improved Two-Weapon Defense*, *Improved
Weapon Familiarity*, *Instantaneous Rage*, *Intimidating Rage*, *Karmic
Strike*, *Kiai Shout*, *Lightning Mace*, *Monkey Grip*, *Net and Trident*, *Pain Touch*,
*Phalanx Fighting*, *Pin
Shield*, *Power Critical*, *Prone Attack*, *Quick Staff*, *Ranged Disarm*,
*Ranged Pin*, *Ranged Sunder*, *Rapid
Stunning*, *Raptor School*, *Roundabout Kick*, *Sacred Vengeance*,
*Sharp-Shooting*, *Shield Charge*, *Shield Slam*, *Shock Trooper*, *Spinning
Halberd*, *Sun School*, *Swarmfighting*, *Three Mountains*, *Throw Anything*,
*Weakening Touch*, and *Zen Archery* are represented and attributed
to *Complete Warrior*. Supported feat prerequisites are enforced, including
turning or rebuking, rage or smite features, mounted combat, damage reduction,
size, skill ranks, weapon-specific proficiency, two-weapon feats, and multiple
distinct Weapon Focus choices. Their resource use and effects—including damage
trades, tactical and weapon-style maneuvers, unarmed combat, recovery, movement,
saves, hit-point effects, and familiar-specific alignment and level checks
remain manual. The non-epic *Improved Favored Enemy* is attributed to
*Complete Warrior* and requires a modeled favored enemy and base attack bonus
of +5; its epic namesake remains a separate *Dungeon Master's Guide* entry.
All 83 table feats are represented and attributed to *Complete Warrior*.

The 54 entries in *Complete Adventurer*'s Table 3–2 (45 general, three bardic
music, and six wild feats) were checked against the catalog. *Appraise Magic
Value*, *Ascetic Hunter*, *Ascetic Knight*, *Ascetic Mage*, *Ascetic Rogue*,
*Blindsense*, *Brachiation*, *Brutal Throw*, *Chant of Fortitude*, *Climb Like
an Ape*, *Combat Intuition*, *Cougar's Vision*, *Danger Sense*, *Death Blow*,
*Deft Opportunist*, *Deft Strike*, *Devoted Inquisitor*, *Devoted Performer*,
*Devoted Tracker*, *Disguise Spell*, *Dive for Cover*, *Dual Strike*, *Expert
Tactician*, *Extra Music*, *Extraordinary Concentration*, *Extraordinary Spell
Aim*, *Force of Personality*, *Goad*, *Green Ear*, *Hawk's Vision*, *Hear the
Unseen*, *Improved Diversion*, *Improved Flight*, *Improved Swimming*,
*Insightful Reflexes*, *Ironskin Chant*, *Jack of All Trades*, *Leap Attack*,
*Lingering Song*, *Lyric Spell*, *Mobile Spellcasting*, *Natural Bond*,
*Obscure Lore*, *Open Minded*, *Oversized Two-Weapon Fighting*, *Power Throw*,
*Quick Reconnoiter*, *Razing Strike*, *Savage Grapple*, *Scent*, *Staggering
Strike*, *Subsonics*, *Tactile Trapsmith*, and *Versatile Performer* are
represented; all 54 table feats are now covered.
*Monster Manual V* also reprints *Brutal Throw* on p. 134. Focused regression
tests lock *Brutal Throw*'s earlier *Complete Adventurer* attribution, absence
of prerequisites, and Strength-for-Dexterity attack benefit; *Combat
Intuition*'s Sense Motive and BAB prerequisites, fighter-bonus eligibility,
opponent assessment, and conditional melee bonus; *Danger Sense*'s Improved
Initiative prerequisite and daily initiative reroll; *Death Blow*'s Improved
Initiative and BAB prerequisites and standard-action coup de grace; *Deft
Opportunist*'s Dexterity and *Combat Reflexes* prerequisites and +4 attack
bonus on attacks of opportunity; *Dive for Cover*'s base Reflex save +4
prerequisite and reroll/prone effect; *Force of Personality*'s Charisma
prerequisite and Will save modifier substitution; *Goad*'s Charisma and base
attack prerequisites, fighter-bonus eligibility, and conditional move-action
effect; *Improved Diversion*'s Bluff prerequisite, fighter-bonus eligibility,
and move-action diversion benefit;
*Improved Flight*'s fly-speed prerequisite and maneuverability improvement;
*Improved Swimming*'s Swim prerequisite and increased movement; *Insightful
Reflexes*' Intelligence-for-Dexterity Reflex save substitution; *Natural
Bond*'s Animal Companion prerequisite and +3 effective druid level with its
character-level cap; *Obscure Lore*'s Bardic Knowledge or Lore prerequisite and
+4 insight bonus; *Open Minded*'s repeatability and five skill points per
selection; *Oversized Two-Weapon Fighting*'s Strength and Two-Weapon Fighting
prerequisites, fighter-bonus eligibility, and reduced off-hand penalties; and
*Quick Reconnoiter*'s Listen and Spot prerequisites and +2 initiative benefit;
*Dual Strike*'s Two-Weapon Fighting prerequisites and fighter-bonus eligibility;
*Expert Tactician*'s Dexterity, Combat Reflexes, and BAB prerequisites;
*Extraordinary Concentration* and *Extraordinary Spell Aim*'s 15-rank skill
prerequisites; *Jack of All Trades*' Intelligence prerequisite; *Leap Attack*'s
Jump and Power Attack prerequisites; *Mobile Spellcasting*'s Concentration
prerequisite; *Power Throw*'s Strength and feat prerequisites and fighter-bonus
eligibility; and *Versatile Performer*'s Perform-rank prerequisite are tested.
Their conditional combat, skill, spellcasting, and performance effects remain
manual in the app. *Ascetic Hunter*, *Ascetic Knight*, *Ascetic Mage*, *Ascetic
Rogue*, *Deft Strike*, the three *Devoted* feats, *Disguise Spell*, *Extra
Music*, *Green Ear*, *Lingering Song*, *Razing Strike*, *Staggering Strike*,
and *Subsonics* have their supported class-feature, class-level, skill, feat,
and caster-level prerequisites tested; *Extra Music* is repeatable. The
*Razing Strike* table row lists the ability to cast 3rd-level arcane or divine
spells, while its feat description says caster level 5th; the catalog follows
the feat description's caster-level prerequisite.
Printed pp. 104–108 confirm *Devoted Performer*, *Devoted Tracker*,
*Disguise Spell*, *Green Ear*, and *Lingering Song*. Devoted Performer's
stacked bard/paladin total grants no separate increase in smite or bardic
music uses; Devoted Tracker's mount/companion and multiclass limits are
described. Disguise Spell opposes Perform to Spot but does not hide visible
emanations or other source clues; Green Ear overcomes normal plant immunity to
mind-affecting effects while giving plants +5 on Will saves; Lingering Song
extends the three inspiration abilities from five rounds to 1 minute after an
ally stops hearing. These effects remain manual.
*Chant of Fortitude*, *Ironskin Chant*, and *Lyric Spell*'s bardic music,
Perform, Concentration, and spontaneous arcane spell prerequisites are tested.
The p. 110 visual check confirmed their benefits and the shared requirement to
produce music. *Lyric Spell* now gates on actual ability to spontaneously cast
2nd-level arcane spells rather than bard/sorcerer level 4 alone; prepared
spellcasting does not qualify. *Chant of Fortitude* explicitly notes repeated
use, and *Extra Music* was confirmed to add four daily uses per repeatable
selection (printed p. 109).
The six wild feats' wild shape, skill, and sneak attack prerequisites are
tested. A visual check of printed p. 111 verified the benefits for
*Blindsense*, *Climb Like an Ape*, *Cougar's Vision*, *Hawk's Vision*, and
*Savage Grapple*. Clarified that *Hawk's Vision* changes ranged-attack
range-increment penalties separately from Spot distance penalties, and that
*Savage Grapple* excludes all creatures not subject to sneak attacks. The
shared supernatural activation rule (including its attack-of-opportunity and
attack classification) and actual use, duration, and effect resolution remain
manual. The p. 111 check also confirmed *Scent*'s 1-hour-per-Hit-Die duration,
30-foot detection, Track interaction, and persistence across forms; its
standard-action supernatural activation is now stated.
*Tactile Trapsmith*'s lack of prerequisites, Dexterity substitution, and
darkness/blindness exception; *Brachiation*'s Climb/Jump prerequisites and
forest/height restrictions; *Hear the Unseen*'s Listen and *Blind-Fight*
prerequisites and hearing-based pinpointing conditions; and *Appraise Magic
Value*'s three skill prerequisites, 8-hour check, material cost, and caster-
level-based DC are also tested. These effects remain manual in the app.
Printed pp. 105–106 verify *Dual Strike*, *Expert Tactician*, *Extraordinary
Concentration*, *Extraordinary Spell Aim*, and *Force of Personality*.
*Dual Strike* uses one roll with the worse attack modifier, -4 or -10 by the
weapon combination, applies damage resistance separately, applies precision
damage once, and gives critical extra damage only to the primary weapon.
The remaining prerequisites and trigger/action/DC limits match the catalog;
their resolution remains manual.
Printed pp. 107–108 verify *Jack of All Trades*, *Leap Attack*, *Mobile
Spellcasting*, *Natural Bond*, and *Obscure Lore*. Jack of All Trades grants
the effective half-rank while still excluding skills that permit no skill
check. Leap Attack requires at least 10 feet of horizontal jumping, a
threatening end square, and normal jump/charge rules. Mobile Spellcasting uses
DC 20 + spell level, loses the spell on failure, and raises defensive-casting
DC to 25 + spell level. Natural Bond's +3 effective druid level is capped by
character level, and Obscure Lore grants +4 insight only to bardic knowledge
or lore checks. These effects remain manual.
Printed pp. 108–109 verify *Open Minded*, *Oversized Two-Weapon Fighting*,
*Power Throw*, *Quick Reconnoiter*, and *Razing Strike*. Open Minded grants 5
skill points per repeatable selection within normal rank caps; Oversized
Two-Weapon Fighting applies light-off-hand penalties to a one-handed off-hand
weapon; Power Throw applies its equal attack/damage trade until the next turn;
Quick Reconnoiter permits one active Spot and one active Listen check as free
actions per round and +2 initiative; Razing Strike uses a sacrificed spell
against constructs or undead according to its arcane/divine source. All five
matched without implementation changes and remain manually resolved.
Printed p. 109 verifies the final *Staggering Strike*, *Subsonics*, *Tactile
Trapsmith*, and *Versatile Performer* entries. Staggering Strike's damage-based
save, early removal, nonstacking, and immune-creature limit match; Subsonics
conceals the performance/source without suppressing allied benefits; Tactile
Trapsmith substitutes Dexterity and ignores darkness/blindness penalties.
Versatile Performer's permanent category choices, highest-rank updates, new
categories after Intelligence-bonus growth, and +2 on the higher combined
Perform modifier are now explicit. These effects remain manual.

The 42 entries in *Complete Champion*'s Table 2–1 (three general, two divine,
22 domain, one metamagic, seven reserve, three tactical, and four wild feats)
are all cataloged: *Air Devotion*, *Animal Devotion*, *Awesome Smite*,
*Battle Blessing*, *Bestial Charge*, *Charnel Miasma*, *Chaos Devotion*,
*Death Devotion*, *Destruction Devotion*, *Earth Devotion*, *Elemental
Essence*, *Evil Devotion*, *Fire Devotion*, *Fragile Construct*, *Good
Devotion*, *Great and Small*, *Healing Devotion*, *Holy Potency*, *Holy
Warrior*, *Imbued Healing*, *Knowledge Devotion*, *Law Devotion*, *Luck
Devotion*, *Magic Devotion*, *Mitigate Suffering*, *Plant Devotion*,
*Protection Devotion*, *Protective Ward*, *Retrieve Spell*, *Spiritual
Counter*, *Spontaneous Domains*, *Strength Devotion*, *Sun Devotion*, *Swift
Call*, *Swift Wild Shape*, *Touch of Healing*, *Travel Devotion*, *Trickery
Devotion*, *Umbral Shroud*, *Venom's Gift*, *War Devotion*, and *Water
Devotion* (42/42).
All 22 domain feats are cataloged with repeatability represented where the
source allows it; their effects remain manual. Knowledge Devotion enforces its
5-rank Knowledge prerequisite and
leaves the selected class skill and combat bonuses manual. Air, Animal, Death,
Destruction, Earth, Evil, Fire, Good, Healing, Law, and Luck Devotion can be
selected repeatedly for additional daily uses. Magic, Plant, and Protection
Devotion are also repeatable; their turn/rebuke conversions and effects remain
manual. Strength, Sun, and Travel Devotion are also repeatable; their
turn/rebuke conversions and effects remain manual. Trickery, War, and Water
Devotion are also repeatable; their turn/rebuke conversions and effects remain
manual. Imbued Healing enforces domain access and uses a manual confirmation for
conjuration (healing) spellcasting; its carrier effects remain manual. Charnel
Miasma, Fragile Construct, Holy Warrior, and Protective Ward enforce their
domain prerequisites. Spell-level prerequisites for the other reserve feats
are enforced, while reserve-spell availability and active effects remain
manual. Holy Potency enforces base attack bonus and turn/rebuke prerequisites,
with spontaneous cure/inflict casting manually confirmed; its maneuver choices
and conditions remain manual. Wild-feat prerequisites use the catalog's wild
category and modeled wild-shape features; Fast Wild Shape is manually confirmed
for Swift Wild Shape. Their selections, uses, and effects remain manual.
Printed pp. 54–56 verify *Air Devotion*, *Animal Devotion*, *Awesome Smite*,
*Battle Blessing*, and *Bestial Charge*. Air Devotion's scaling, projectile
miss chance, and turn-use conversions match. Animal Devotion's four powers,
simultaneous active powers, and one activation per round match. Awesome
Smite's declared maneuver, DR/trip/miss-chance effects, and once-per-round
Overwhelming Smite limit match. Battle Blessing changes only standard- and
full-round paladin casting times. Bestial Charge retains its timing and
maneuver-specific form/movement conditions. All effects remain manual.
Printed pp. 56–58 verify *Chaos Devotion*, *Charnel Miasma*, *Death Devotion*,
*Destruction Devotion*, and *Earth Devotion*. Chaos Devotion is now repeatable
and its d6 progresses to d8 at level 10 and d10 at level 15. Charnel Miasma's
grave scent is explicit. Death Devotion's per-target negative-level cap and
Destruction Devotion's one-use-per-turn/rebuke exchange match. Earth
Devotion's newly grown spikes immediately attack creatures beneath them.
Effects and uses remain manual.
Printed pp. 58–59 verify *Elemental Essence*, *Evil Devotion*, *Fire
Devotion*, *Fragile Construct*, and *Good Devotion*. Elemental Essence uses a
permanent energy choice, +1d6 and resistance 5, permits different repeat
selections, but cannot stack or activate multiple energy types. Evil and Good
Devotion grant DR 1 + 1 per five character levels (maximum 5) and align
natural/weapon attacks appropriately. Fire Devotion's burn continues at 1d4
per round after its Reflex save, can be doused as a move action, and converts
two turn/rebuke uses into an additional daily use. Fragile Construct cannot
reduce hardness or DR below 0 and adds +1 insight on sunder attempts. These
effects remain manual.
Printed pp. 59–60 verify *Great and Small*, *Healing Devotion*, *Holy Potency*,
*Holy Warrior*, and *Imbued Healing*. Great and Small now states activation in
normal form, character-level caster level, and the one-category/nonstacking
limits. Healing Devotion matches including automatic activation at 0 or fewer
HP when not killed and transfer by touch. Holy Potency grants two of four
positive-/negative-energy maneuvers; Holy Warrior's damage and force-spell CL
benefits match. Imbued Healing uses 1st+ healing spells, permits distinct
carrier effects—including opposed-domain effects—to coexist, but chooses only
one per casting for all targets. Their effects remain manual.
Printed pp. 60–61 verify *Knowledge Devotion*, *Law Devotion*, *Luck
Devotion*, *Magic Devotion*, and *Mitigate Suffering*. Knowledge Devotion
permits one associated Knowledge check per creature type per combat; Law
Devotion reallocates attack/AC bonus at later action starts; Luck Devotion
covers physical and magical damage; Magic Devotion scales range and 1d6 damage
per two character levels. Mitigate Suffering grants 2 + spell level temporary
ability points to one damaged ability, capped at its starting score, for 10
minutes, and can be used repeatedly on the same subject. These effects remain
manual.
Printed pp. 61–62 verify *Plant Devotion*, *Protection Devotion*,
*Protective Ward*, *Retrieve Spell*, and *Spiritual Counter*. Plant Devotion's
25%/50%/75%/heavy thresholds and Protection Devotion's +2 through +7 aura
match. Protective Ward lasts until the next turn begins for one recipient.
Retrieve Spell can recover only a spell from the class granting turn/rebuke
access, and Spiritual Counter is readied, costs 2 + spell level uses (minimum
1), and requires casting the spell as if on the list. Effects remain manual.
Printed pp. 62–63 verify *Spontaneous Domains*, *Strength Devotion*, *Sun
Devotion*, *Swift Call*, and *Swift Wild Shape*. Spontaneous Domains leaves
domain slots open but permits one domain spell per spell level per day.
Strength Devotion's slam does not provoke attacks of opportunity; its adamantine
and hardness effects match. Sun Devotion's true sunlight reaches creatures
within 10 feet. Swift Call was corrected to replace the normal full-round
mount-calling action. Swift Wild Shape remains a swift rather than standard
action. Effects remain manual.
Printed pp. 62–64 verify *Touch of Healing*, *Travel Devotion*, *Trickery
Devotion*, *Umbral Shroud*, *Venom's Gift*, *War Devotion*, and *Water
Devotion*. Venom's Gift now checks both ordinary wild-shape access and plant
form, in addition to two other wild feats. The healing threshold, swift
movement/5-foot-step restriction, simulacrum growth and HP, darkness miss
chance, poison, defensive trade, and summoned-elemental scaling match. These
effects remain manual.

Table 3–1 in *Complete Divine* has 32 entries: 11 general, 11 divine, one item
creation, five metamagic, and four wild feats. Its *Spell Focus* row lists four
alignment variants. *Practiced Spellcaster* is modeled as eight class-specific
choices; regression coverage verifies different classes can each receive it
without repeating the same class variant, and checks all eight choices for
their source and class/Spellcraft prerequisites. *Practiced Spellcaster* and
*Transdimensional Spell* also appear in *Complete Arcane*.
The supplied *Complete Divine* PDF says its first printing was May 2004;
*Complete Arcane* says November 2004, so both use their earlier *Complete
Divine* attribution. *Arcane Disciple*, *Augment Healing*, *Domain Focus*,
*Disciple of the Sun*, *Divine Metamagic*, *Divine Spell Power*, *Domain
Spontaneity*, *Elemental Healing*, *Elemental Smiting*, *Empower Turning*,
*Glorious Weapons*, *Improved Smiting*, *Practiced Spellcaster*, *Profane
Boost*, *Quicken Turning*, *Sacred Boost*, *Sacred Healing*, the four
*Spell Focus* choices, *Spontaneous Healer*, *Spontaneous Summoner*,
*Spontaneous Wounder*, *Transdimensional Spell*, and *True Believer* are
represented, as are *Boar's Ferocity*, *Cheetah's Speed*, *Consecrate Spell*,
*Corrupt Spell*, *Eagle's Wings*, *Elephant's Hide*, *Rapid Spell*,
*Reach Spell*, and *Sanctify Relic* (32/32).
Arcane
Disciple enforces its skill, arcane
spellcasting, and deity-alignment prerequisites, while its domain and spell
management remain manual. Augment Healing enforces Heal ranks, but the healing
bonus is applied manually. Domain Focus enforces active-domain access; the
chosen domain and caster-level adjustments remain manual. Empower Turning
enforces turn/rebuke access, but its turning calculation remains manual.
Improved Smiting enforces Charisma and a modeled smite feature; alignment
choices and combat effects remain manual.
*Quicken Turning* enforces turn/rebuke access. The four *Spell Focus* choices
count as one table entry and enforce the matching alignment component. The
three spontaneous feats enforce their skill, alignment, ability-score, and
manually confirmed spellcasting prerequisites; their spell conversion and
daily-use tracking remain manual.
*Disciple of the Sun* enforces good alignment and turn/rebuke access.
*Divine Metamagic* requires turn/rebuke access and an existing metamagic feat,
following the supplied errata; its chosen feat and turning expenditures remain
manual. *Divine Spell Power* enforces turn/rebuke access and first-level divine
spellcasting, but its turning check and caster-level adjustment remain manual.
*Glorious Weapons* enforces turn/rebuke access; energy choice and combat effects
remain manual. *Domain Spontaneity* enforces turn/rebuke access and domain
access; the chosen domain and spell/turning-use tracking remain manual.
*Elemental Smiting* and *Elemental Healing* require manually confirmed ability
to turn or rebuke creatures with an elemental subtype, respectively; target
subtypes and combat effects remain manual. *Profane Boost* enforces rebuke
undead access, *Sacred Boost* and *Sacred Healing* enforce turn-undead access,
and Sacred Healing also enforces Heal ranks; their effects remain manual.
*Consecrate Spell* and *Corrupt Spell* enforce good and evil alignment,
respectively; their descriptor, damage, and spell-slot effects remain manual.
*Rapid Spell* and *Reach Spell* are categorized as metamagic feats; casting
time, range, attack, and spell-slot adjustments remain manual. The four wild
feats enforce wild-shape access, and *Elephant's Hide* additionally checks for
access to Large or larger forms; their uses, durations, and effects remain
manual. *Sanctify Relic* enforces another item-creation feat. Table 3-1 also
lists caster level 7, which the detailed feat entry omits, so the catalog
follows the detailed entry; relic construction and deity-specific activation
remain manual.
*True Believer* enforces a selected deity and alignment within one step. Its
detailed feat description grants +2 (although Table 3–1 lists +3); the saving
throw use and relic access remain manual.
The *Transdimensional Spell* catalog and spell-sheet guidance limit unseen
targets to bursts, cones, emanations, and spreads; the slot adjustment and
spell-specific eligibility remain manual.

The six feat headings in *Dungeon Master's Guide II* are represented:
*Apprentice* and *Mentor* (p. 176), *Business Savvy* (p. 184), *Favored in
Guild* (p. 227), *Guildmaster* (p. 228), and *Truebond* (p. 232). *Apprentice*
is restricted to a 1st-level feat slot; *Mentor* requires *Apprentice* and
manually confirmed graduation and mentor-skill ranks; *Business Savvy* checks
for *Negotiator*; *Favored in Guild* requires manually confirmed guild
membership; *Guildmaster* checks for *Favored in Guild* and *Leadership*, with
its other guild-specific requirements manually confirmed; and *Truebond*
checks character level 6 and a manually confirmed bonding ritual. Mentor
choices and effects, business checks, guild-specific benefits, and bonded-item
effects remain manual.

The *Monster Manual III* definition review (2026-11-16) corrects an earlier
false-negative scan. Its Monster Feats section (pp. 206-207) defines 11
already-shared feats; *Powerful Charge* is attributed to this earlier verified
printing, and *Quicken Spell-Like Ability* uses the section's explicit swift-
action revision. The Shifter (p. 150) and Warforged (p. 192) sidebars add eight
cataloged feats: *Extra Shifter Trait*, *Healing Factor*, *Shifter Defense*,
*Shifter Instincts*, *Adamantine Body*, *Improved Fortification*, *Mithral Body*,
and *Mithral Fluidity*. Racial, Constitution, BAB, first-level-only, other-
shifter-feat-count, and Mithral Body prerequisites are checked as applicable;
Mithral Fluidity is repeatable. Race profiles, shifting, plating, and effects
remain unsupported/manual, explicitly noted in descriptions. No new standalone
spell, base class, or prestige-class definition was identified.

All 13 feats in the *Monster Manual IV* monster-feat section (pp. 202–203) are
represented. *Ability Focus*, *Flyby Attack*, *Multiattack*, and *Quicken
Spell-Like Ability* remain attributed to the earlier *Monster Manual II*
printing; *Improved Natural Attack* and *Improved Toughness* retain their
earlier *Monster Manual* and *Complete Warrior* sources. *Awesome Blow* and
*Craft Construct* are attributed to the 3.5 *Monster Manual*; *Clinging
Breath* and *Lingering Breath* to *Draconomicon*; *Githyanki Battlecaster*
and *Githyanki Dragonrider* to *Monster Manual IV*; and *Powerful Charge* to
*Monster Manual III*. MMIV's revised Ability Focus wording covers a special
ability that allows a save. Clinging Breath includes +1 recharge round;
Lingering Breath includes normal saves and the original targets' escape window.
Githyanki Dragonrider's +1 insight AC applies to both rider and mount.
The breath-weapon recharge prerequisite is manually confirmed; breath-weapon
effects, Githyanki racial options, and conditional combat bonuses remain manual.
Githyanki Battlecaster removes light-armor spell failure in the shared casting
calculation, but not shield or medium/heavy-armor failure. Its explicitly
permitted Wizard bonus-feat option is implemented with normal prerequisites.

The *Monster Manual IV* Clockwork Mender entry also presents *Summon
Clockwork Mender Swarm* (p. 30; cleric 4, sorcerer/wizard 4; lawful descriptor;
broken metal gear focus). It is now cataloged, with the remaining casting
metadata inherited from Summon Monster I. Swarm actions remain manual.
This is separate from the Clockwork Mender's improved-familiar and
*summon monster II* options. The Varag racial class (pp. 170-171) remains
unsupported: its first five levels distribute three racial Hit Dice and +2 LA,
then interleave ordinary class advancement. It must not be represented as five
ordinary base-class levels.

All 12 feats in the *Monster Manual V* monster-feat section (pp. 204–205) are
represented, including *Improved Toughness* through its *Complete Warrior*
definition, *Awesome Blow* through the 3.5 *Monster Manual*, and *Powerful
Charge* through *Monster Manual III*.
Seven additional feat sidebars (pp. 80, 84–85, 97, 110, and 134) present
*Daunting Presence*, *Battle Magic Tactics*, *Mage Slayer*, *Kuo-Toan
Monasticism*, *Mind-Shattering Strike*, *Sense Quintessence*, and *Brutal
Throw*. All seven are represented. *Mage Slayer* is attributed to the earlier
*Complete Arcane*, and *Brutal Throw* to the earlier *Complete Adventurer*;
the other five are attributed to *Monster Manual V*. Brutal Throw is now
actually eligible for Fighter bonus-feat slots; its optional ability
substitution remains manual. Battle Magic Tactics
spell tokens, Kuo-toan martial benefits, Mind-Shattering Strike uses and
effects, and Sense Quintessence detection remain manual. Sense Quintessence
requires manually confirmed access to *detect magic* as a spell or spell-like
ability and Thoon affiliation.
*Earthbind* from *Monster Manual V* (p. 26; druid 2, sorcerer/wizard 2)
is now cataloged. Its summary records Fortitude negates, spell resistance,
suppression of existing and newly granted fly speeds, Feather Fall descent,
and unaffected movement without a fly speed (including Levitate and Air Walk).
Resolve target saves and temporary flight suppression manually. No new base,
prestige, or racial-class progression was identified in MMV.

This is catalog completeness, not full rules automation. Epic feats are gated
at character level 21. Improved Metamagic checks its modeled skill and
metamagic-feat-count prerequisites, and Improved Spell Capacity checks access
to a class's normal maximum spell level. Selecting its class and slot level,
applying its ability-based bonus spells, and resolving spell use remain manual.
Familiar Spell checks the relevant arcane spellcasting ability score, but
familiar ownership remains manual. Great Smiting checks for a modeled smite
class feature or the Destruction domain; Improved Elemental Wild Shape checks
for modeled wild shape access; Improved Sneak Attack checks modeled sneak
attack +8d6; Planar Turning checks for turn/rebuke undead; and Terrifying Rage
checks for a modeled Rage (5/day) or Rage (6/day) feature. Overwhelming
Critical checks that its Weapon Focus and Improved Critical choices match a
proficient weapon, but its own weapon choice remains manual. Caster-level
prerequisites include recorded prestige-class spellcasting advancement.
Lasting Inspiration checks Bardic Music and 25 ranks in any one Perform skill.
Other epic prerequisites, non-modeled class-feature sources, and many MM
prerequisites require manual confirmation. MM size
prerequisites are checked against known race metadata; size-changing effects
remain manual. The MM chapter
describes feats typically used by monsters, so inclusion does not establish
that a particular character is eligible to select one. Feat effects that
depend on summoned creatures, spell-like abilities, natural attacks, or
untracked class features are not applied automatically. Brutal Throw's
Strength-for-Dexterity substitution on thrown-weapon attack rolls remains
manual.
Empower, Maximize, and Quicken Spell-Like Ability check modeled racial-SLA
caster levels; class-based SLAs, selection, and effect/use tracking remain
manual. Sculpt Spell, Split
Ray, Black Lore of Moil, Chain Spell, Cooperative Spell, Delay Spell, Explosive
Spell, Fortify Spell, Persistent Spell, Repeat Spell, Sanctum Spell, Twin Spell,
the Sudden metamagic feats, Born of the
Three Thunders, four Energy Substitution choices, four Energy Admixture choices,
Arcane Defense, Arcane Preparation, Battle Caster, Communicator, Double Wand Wielder, Extra Slot,
Extra Spell, Craft Contingent Spell, Arcane Mastery, Ranged Spell Specialization,
Touch Spell Specialization, Innate Spell, Insightful, Necropolis Born, Night Haunt,
Heighten Spell-Like Ability, Nonlethal Substitution,
Maximize Spell-Like Ability, Lord of the Uttercold, Mage Slayer, Obtain
Familiar, Pierce Magical Concealment, Pierce Magical Protection, Reckless
Wand Wielder, Soul of the North, Spell Hand, and Wandstrike remain supplemental
Complete Arcane feats and are not counted among
the
supplied books. Their modeled prerequisites and mechanics have been checked against the
cited Complete Arcane pages; spell adjustments remain manual, as do Arcane
Preparation's prepared spells/metamagic choices, Extra Slot's chosen class/level,
Extra Spell's chosen class/spell, Nonlethal Substitution's
chosen energy type, Heighten Spell-Like Ability's selected effect/DC/uses
(different ability per selection), and Lord of the Uttercold's cold-descriptor
spellcasting prerequisite. Mage Slayer's +1 Will bonus and the -4 caster-level
penalty from Mage Slayer and both Pierce feats apply automatically to class
casting and racial spell-like abilities. The defensive-casting restriction and
Pierce feats' attack/dispelling effects remain manual. Familiar management for
Obtain Familiar is also manual. Practiced Spellcaster changes
only the selected class's caster level; regression coverage confirms its capped
bonus affects that class's SR-check modifier, not daily spell slots or other
classes. Spells known remain unchanged. Battle Caster covers Bard's
modeled armor feature: tests in `tests/castingSummary.test.tsx` verify medium
armor is exempt only for Bard spells, not shields or other class spells. Other
class-based armor casting abilities are not modeled.
Arcane Mastery checks modeled arcane spellcasting or racial SLAs; invocation and
class-based SLA prerequisites and its take-10 effect remain manual
(*Complete Arcane*, p. 73).
Arcane Defense regression coverage verifies repeat selections require distinct
schools with matching Spell Focus selections; its +3 save bonus remains manual
(*Complete Arcane*, p. 73).
Ranged and Touch Spell Specialization require the matching Weapon Focus choice
and caster level 4; +2 HP damage and attack/target limits remain manual
(*Complete Arcane*, p. 83).
Maximize Spell-Like Ability is a supplemental *Complete Arcane* feat (p. 82).
Its racial-SLA caster-level prerequisite is modeled; spell-level and use
limits, distinct ability choices, and effect resolution remain manual.
Craft Contingent Spell checks caster level 11; creation price, time, XP,
materials, and contingent spell effects remain manual (*Complete Arcane*, p. 78).
The *Complete Arcane* feat table lists 64 distinct feats, all now represented.
Energy Substitution, Energy Admixture, and Practiced Spellcaster have
additional choice-specific records. Draconic Heritage enforces Sorcerer 1, its
seven dependent feats require Draconic Heritage, and Draconic Legacy requires
four distinct Draconic feats. Dragon-kind choices and feat effects remain
manual. Extra Edge enforces a manually confirmed Warmage level 4 prerequisite;
its level-scaled Warmage Edge damage bonus remains manual because Warmage
progression is not modeled. Extra Invocation validates the recorded Lesser
Invocations feature, but invocation choices and Warlock progression remain
manual. Extra Spell Secret and Guardian Spirit validate recorded Spell Secret
and Watchful Spirit class features, respectively; Wu Jen class progression and
those feat effects remain manual.
Dragonlance feats enforce modeled race, base-attack, base-save, skill, feat, and
first-level-slot requirements. Prior events for Dragonfear feats, situational
oath/Diplomacy triggers, non-draconian breath-weapon access, strafing-breath
area calculations, and death-throes resolution remain manual.
Weapon Focus also offers Grapple, and Ray to spellcasters; Weapon Specialization
and its greater versions allow a matching Grapple choice. These choices are
recorded, but their bonuses to grapple checks, grapple damage, and ray attack
rolls remain manual.

Barbarian Fast Movement is applied to land speed when armor and load qualify;
Rage effects and other non-automatic Barbarian features are explained on the
character sheet and tracked manually.
Mounted Combat is selectable with its Ride 1-rank prerequisite; its once-per-round
Ride check to negate a hit on a mount remains manual. Mounted Archery is selectable
with Ride 1 and Mounted Combat prerequisites; its reduced mounted ranged-attack
penalties remain manual. Ride-By Attack movement and target-specific attacks of
opportunity, and Spirited Charge damage multipliers, also remain manual.
Trample is selectable with Ride 1 and Mounted Combat; its overrun and hoof-attack
resolution remain manual.
Track enables following trails with Survival checks above DC 10; check cadence,
movement speeds and penalties, terrain/condition DCs, and retry timing remain
manual (Player's Handbook, p. 102).
Flyby Attack is selectable when a positive fly speed is recorded; entering the
speed, confirming active flight, and resolving the move/action timing remain
manual ([SRD Flyby Attack](https://www.d20srd.org/srd/monsterFeats.htm#flybyAttack)).
Leadership is selectable at character level 6; its score, cohort, follower count,
and ongoing cohort/follower management remain manual
([SRD Leadership](https://www.d20srd.org/srd/feats.htm#leadership)).
Improved Turning is selectable by characters with a turn/rebuke feature,
including modeled elemental-subtype abilities, and raises their effective level
for those checks by 1; attempts and effects remain manual (Player's Handbook,
pp. 91, 96).
Extra Turning is selectable by characters with a turn/rebuke feature, including
modeled elemental-subtype abilities, adds four daily uses to each such ability
per selection, and stacks when selected multiple times; use tracking remains
manual (Player's Handbook, pp. 91, 94).
The PHB feats that grant +2 bonuses to two skills apply those bonuses to skill
checks. Alertness gained through a familiar within arm's reach is described in
the feat text, but familiar proximity is not tracked automatically.
Snatch Arrows is selectable with Dexterity 15, Deflect Arrows, and Improved
Unarmed Strike; catching and returning a deflected weapon remain manual
(Player's Handbook, pp. 91, 100).
Natural Spell is selectable with Wisdom 13 and modeled Wild Shape access, and
its Wild Shape guidance describes the permitted spell components and manual limits
(Player's Handbook, pp. 91, 98).
Improved Counterspell is selectable without prerequisites; it permits using a
same-school spell one or more levels higher when counterspelling, which remains
manual (Player's Handbook, pp. 91, 95).
Spell Mastery is selectable by Wizards of level 1 or higher; distinct known
Wizard spells are selected equal to the Intelligence modifier at selection time
and saved per feat slot. The mastered spells may be prepared without the
spellbook, but spell preparation and casting remain manual
(Player's Handbook, pp. 91, 100).
Rapid Reload is selectable for a proficient hand, light, or heavy crossbow, can
be selected separately for distinct types, applies the appropriate reload action,
and enables bow-like full attacks with hand and light crossbows. Repeating
crossbows remain outside this feat's choices, and their magazine tracking remains
manual (Player's Handbook, pp. 91, 99).

| Area | Status | Implemented and verified | Known gaps / boundaries | Evidence |
|---|---|---|---|---|
| Character creation and lifecycle | Implemented (bounded) | Setup drafts, creation validation, finalization, level-up drafts, save/export/import; representative Fighter and spellcaster creation flows | Not every class, race, choice combination, or legality edge case has an end-to-end regression | [app.test.tsx](../tests/app.test.tsx), [3.0 design](3.0-design.md) |
| Ability scores | Implemented (bounded) | Manual, point-buy, and rolled assignment; 25-point budget; racial modifiers; method/race changes; persistence | The methods are tested through representative cases, not every possible allocation and race combination | [app.test.tsx](../tests/app.test.tsx), [rules.test.ts](../tests/rules.test.ts) |
| Core races | Partial / manual | SRD-checked ability modifiers, size/speed and carrying capacity; racial skill/save bonuses; Dwarf Stability preview (+4 only for grounded bull rush/trip checks); Dwarf/Gnome weapon familiarity and target-specific attack/AC bonuses; Halfling thrown-weapon/sling attacks; Small-size Hide; Gnome illusion spell DC and spell-like ability details; persisted daily-use tracking for modeled racial spell-like abilities; Human skill points/bonus feat; Elf secret-door Search trigger reminder; Elf/Half-Elf sleep immunity and low-light vision details | Situational save/attack/AC and dwarf/gnome skill contexts are selected manually; Search and ability checks are still rolled/adjudicated manually; sleep immunity and lighting/vision ranges are not automatically resolved; spell-like ability effects still require manual adjudication; optional Dragonlance races remain incomplete or unverified | [SRD Dwarf Stability](https://www.d20srd.org/srd/races.htm#dwarves), [SRD Elf and Half-Elf](https://www.d20srd.org/srd/races.htm#elves), [SRD low-light vision](https://www.d20srd.org/srd/specialAbilities.htm#lowLightVision), [SRD Elf Search rule](https://www.d20srd.org/srd/skills/search.htm#special), [SRD Gnome](https://www.d20srd.org/srd/races.htm#gnomes), [README rules and scope](../README.md#rules-and-scope), [abilityEquipment.test.tsx](../tests/abilityEquipment.test.tsx), [combat.test.tsx](../tests/combat.test.tsx), [encumbrance.test.tsx](../tests/encumbrance.test.tsx), [rules.test.ts](../tests/rules.test.ts), [castingSummary.test.tsx](../tests/castingSummary.test.tsx), [spells.test.tsx](../tests/spells.test.tsx), [skills.test.tsx](../tests/skills.test.tsx) |
| Classes, levels, and multiclassing | Partial / manual | Selected BAB/save/HP calculations; total-level feat and ability milestones; class-level bonus feats and caster progression; core class-feature names by class level; audited class-skill lists for all 11 core classes; Dragonlance prestige-class BAB/save progressions, skill-point rates, and class-skill lists checked against the *Dragonlance Campaign Setting* for all 12 level-up-enabled classes; feature unlocks and displayed reminders checked against the *Dragonlance Campaign Setting* for all 12 level-up-enabled Dragonlance prestige classes; selectable Ranger archery/two-weapon style feats at Ranger levels 2, 6, and 11; single-attack/full-attack/Manyshot action selection; Rapid Shot's extra attack and -2 full-attack penalty; Improved/Greater Two-Weapon Fighting off-hand iteratives; Manyshot arrow count and attack penalty, per-arrow weapon damage expression and DR status, plus once-only precision and first-arrow-only critical guidance; Improved Precise Shot's ranged-attack handling for less-than-total cover and concealment; selectable Monk bonus feats at Monk levels 1, 2, and 6; Paladins must be Lawful Good but may follow an ideal or choose a deity of any alignment | Ranger combat-style benefits are disabled in medium/heavy armor; separately selected feats remain effective. Manyshot requires an active feat, bow, BAB +6, and target within 30 ft. Target cover and concealment are session-only context; total cover blocks attacks and total concealment's 50% miss chance remains. Damage rolls and post-resistance totals, enemy AC adjustment, and concealment rolls remain manual. Prestige-class feature effects, setting-specific deity rules, and broader multiclass edge cases remain incomplete | [SRD Ranger combat style](https://www.d20srd.org/srd/classes/ranger.htm#combatStyle), [SRD Improved Combat Style](https://www.d20srd.org/srd/classes/ranger.htm#improvedCombatStyle), [SRD Combat Style Mastery](https://www.d20srd.org/srd/classes/ranger.htm#combatStyleMastery), [SRD Rapid Shot](https://www.d20srd.org/srd/feats.htm#rapidShot), [SRD Manyshot](https://www.d20srd.org/srd/feats.htm#manyshot), [SRD Improved Two-Weapon Fighting](https://www.d20srd.org/srd/feats.htm#improvedTwoWeaponFighting), [SRD Greater Two-Weapon Fighting](https://www.d20srd.org/srd/feats.htm#greaterTwoWeaponFighting), [SRD Improved Precise Shot](https://www.d20srd.org/srd/feats.htm#improvedPreciseShot), [SRD Paladin](https://www.d20srd.org/srd/classes/paladin.htm), [SRD Cleric](https://www.d20srd.org/srd/classes/cleric.htm), [app.test.tsx](../tests/app.test.tsx), [combat.test.tsx](../tests/combat.test.tsx), [skills.test.tsx](../tests/skills.test.tsx), [rules.test.ts](../tests/rules.test.ts), [domain.ts](../src/domain.ts), [classFeatureProgression.ts](../src/data/classFeatureProgression.ts), [dragonlancePrestigeClasses.test.ts](../tests/dragonlancePrestigeClasses.test.ts) |
| Skills | Partial / manual | Skill modifiers, the core trained-only set, untrained-use exceptions and task notes for Appraise, Handle Animal, Knowledge, Open Lock, Sleight of Hand, Forgery, and Disable Device, class attribution, skill-point costs, cross-class half-ranks and caps, selected racial/domain bonuses, SRD skill synergies at 5 ranks for skill checks and supported class features, with explicit contexts for task-limited bonuses, common armor/load penalties, audited class-skill lists for all 11 core classes, level-up skill budgets that do not recalculate prior levels after an Intelligence increase, and Combat Casting's +4 Concentration bonus for selected defensive-casting, grappled, or pinned contexts | Feature bonuses are surfaced but most checks remain manual; other class-feature synergies and task exceptions are not fully automated; the app does not resolve skill checks | [SRD skill synergies](https://www.d20srd.org/srd/skills/usingSkills.htm#skillSynergy), [SRD skill descriptions](https://www.d20srd.org/srd/skills/skillDescriptions.htm), [SRD Handle Animal](https://www.d20srd.org/srd/skills/handleAnimal.htm), [README skill training](../README.md#skill-training-and-untrained-use), [skills.test.tsx](../tests/skills.test.tsx), [rules.test.ts](../tests/rules.test.ts) |
| Feats and proficiencies | Partial / manual | SRD-audited prerequisites for feats in the supported catalog, including ability scores, base attack bonus, caster level, spell-level access, class levels, prerequisite feats, and weapon-specific proficiency/Strength requirements; class bonus-feat eligibility; Ranger combat-style and Monk bonus-feat choices with their prerequisite exceptions; duplicate Monk bonus-feat selections are rejected; supported weapon/armor proficiencies and selected weapon-specific feats; Point Blank Shot adds +1 attack and damage with ranged weapons when target distance is at most 30 ft.; Combat Expertise trades a selected melee attack penalty for an equal dodge AC bonus, bounded by BAB and +5; Power Attack trades a selected melee attack penalty for weapon-dependent melee damage, up to BAB, with two-handed damage doubled and no light-weapon bonus; Dodge adds +1 dodge AC against a manually selected opponent and loses that bonus when Dexterity to AC is denied; Combat Reflexes reports the attacks-of-opportunity limit (one plus nonnegative Dexterity modifier) and allows them while flat-footed; Combat Casting adds +4 to Concentration only for a selected defensive-casting, grappled, or pinned context; Spell Focus adds +1 to save DCs for spells from a distinct selected school; Greater Spell Focus requires Spell Focus in its selected school and adds a stacking +1; both feats can be selected repeatedly for different schools; Spell Penetration adds +2 to caster-level checks against spell resistance; Greater Spell Penetration requires Spell Penetration and adds a stacking +2; Heighten Spell has no prerequisites and raises a prepared spell's effective level, save DC, and required slot up to level 9; Empower Spell has no prerequisites per PHB Table 5-1 (pp. 90–91) and tracks the +2 slot cost per prepared copy, with its variable numeric effects remaining manual; repeatable Skill Focus applies +3 to each distinct selected skill; Improved Initiative adds +4 to initiative checks; Great Fortitude, Lightning Reflexes, and Iron Will each add +2 to the matching save | The catalog is not exhaustive. Target distance, Combat Expertise, Power Attack, Dodge, and Combat Casting contexts are session-only; turn timing and clearing combat effects at the next action/turn remain manual. Combat Reflexes reports capacity only; AoO triggers, threatened areas, and spent attacks are not tracked. Opponent identity, non-flat-footed Dexterity-denial conditions, unarmed/natural-weapon attacks, and other conditional feat effects remain incomplete or manual | [SRD feats](https://www.d20srd.org/srd/feats.htm), [SRD Point Blank Shot](https://www.d20srd.org/srd/feats.htm#pointBlankShot), [SRD Combat Expertise](https://www.d20srd.org/srd/feats.htm#combatExpertise), [SRD Power Attack](https://www.d20srd.org/srd/feats.htm#powerAttack), [SRD Dodge](https://www.d20srd.org/srd/feats.htm#dodge), [SRD Combat Reflexes](https://www.d20srd.org/srd/feats.htm#combatReflexes), [SRD Combat Casting](https://www.d20srd.org/srd/feats.htm#combatCasting), [SRD Spell Focus](https://www.d20srd.org/srd/feats.htm#spellFocus), [SRD Greater Spell Focus](https://www.d20srd.org/srd/feats.htm#greaterSpellFocus), [SRD Spell Penetration](https://www.d20srd.org/srd/feats.htm#spellPenetration), [SRD Greater Spell Penetration](https://www.d20srd.org/srd/feats.htm#greaterSpellPenetration), [SRD Heighten Spell](https://www.d20srd.org/srd/feats.htm#heightenSpell), [SRD Empower Spell](https://www.d20srd.org/srd/feats.htm#empowerSpell), [SRD Improved Initiative](https://www.d20srd.org/srd/feats.htm#improvedInitiative), [SRD Skill Focus](https://www.d20srd.org/srd/feats.htm#skillFocus), [README weapon nonproficiency](../README.md#weapon-nonproficiency), [rules.test.ts](../tests/rules.test.ts), [combat.test.tsx](../tests/combat.test.tsx), [abilityEquipment.test.tsx](../tests/abilityEquipment.test.tsx), [proficiency.test.tsx](../tests/proficiency.test.tsx), [skills.test.tsx](../tests/skills.test.tsx) |
| Spellcasting | Partial / manual | Class-specific spell access, slots, caster levels and base DCs; Dragonlance prestige spell-slot and caster-level advancement for Knight of the Sword, Knight of the Rose, Knight of the Skull, Knight of the Thorn, and Wizard of High Sorcery; spontaneous spells-known progression follows prestige advancement; school-specific spell DCs include valid Spell Focus and Greater Spell Focus bonuses; Spell Penetration feats each add +2 to each class's spell-resistance check modifier; Heighten Spell tracks an effective slot level per prepared copy and uses it for slot accounting and save DC; Empower Spell tracks its +2 slot cost per prepared copy without changing the spell's save DC; known/prepared spell tracking; wizard spellbook learning; per-class expended-slot tracking; manual rest/prayer confirmation; once-per-preparation locking for prepared casters; core cleric domains with separate domain-slot usage; Concentration checks with a shared Combat Casting context | Empowered variable numeric effects must be multiplied by 1.5 manually; heightened or Empowered spontaneous casts and cleric domain preparations are not tracked; non-DC spell-level effects, spell-resistance rolls and target SR comparisons, rest duration, prayer time, preparation time, and recent-casting limits are not tracked; domain powers, specialization, spell replacement, prestige-class feature interactions, and several feat/item adjustments remain manual or unfinished | [SRD arcane preparation](https://www.d20srd.org/srd/magicOverview/arcaneSpells.htm#preparingWizardSpells), [SRD divine preparation](https://www.d20srd.org/srd/magicOverview/divineSpells.htm#preparingDivineSpells), [SRD Empower Spell](https://www.d20srd.org/srd/feats.htm#empowerSpell), [README class spell sheets](../README.md#class-spell-sheets), [spells.test.tsx](../tests/spells.test.tsx), [domains.test.tsx](../tests/domains.test.tsx), [castingSummary.test.tsx](../tests/castingSummary.test.tsx), [dragonlancePrestigeClasses.test.ts](../tests/dragonlancePrestigeClasses.test.ts), [rules.ts](../src/rules.ts) |
| Combat, defenses, and conditions | Partial / manual | Selected melee/ranged attack and damage calculations, AC variants, saves, weapon modes, nonproficiency penalties, target damage-reduction qualifiers, and tracked effects | This is not a turn-by-turn combat engine. Damage is entered after resolving several defenses; action economy, timing, stacking, and many special cases require manual adjudication | [README rules and scope](../README.md#rules-and-scope), [combat.test.tsx](../tests/combat.test.tsx), [defenseItems.test.tsx](../tests/defenseItems.test.tsx), [combatEffects.test.tsx](../tests/combatEffects.test.tsx) |
| Hit points and damage tracking | Partial / manual | Maximum/current/temporary HP, lethal and nonlethal damage, healing, level-up HP gains, and status reminders | Stabilization, Diehard, ongoing damage, death exceptions, and healing dead characters are not fully automated | [README compact character sheet](../README.md#compact-character-sheet), [hitPoints.test.tsx](../tests/hitPoints.test.tsx) |
| Equipment, encumbrance, and item effects | Partial / manual | Equipment catalogs and slots, selected proficiency/equipment rules, weight/load and movement calculations, and supported ability/defense bonuses | Currency is manual; ammunition is not consumed or loaded automatically; missing weights and unsupported item effects require review | [README](../README.md#rules-and-scope), [encumbrance.test.tsx](../tests/encumbrance.test.tsx), [abilityEquipment.test.tsx](../tests/abilityEquipment.test.tsx), [catalog.test.ts](../tests/catalog.test.ts) |
| Persistence and compatibility | Implemented (bounded) | Local saves, resumable setup drafts, schema validation, and JSON import/export, with representative lifecycle round trips | One active local character; no cloud sync. Validation cannot prove that imported content follows every game rule | [README saving and compatibility](../README.md#saving-and-compatibility), [storage.test.ts](../tests/storage.test.ts), [app.test.tsx](../tests/app.test.tsx) |
| Dragonlance and other supplemental rules | Unverified / incomplete | Some optional content and class/data entries are present | Not source-verified as a complete rules implementation; do not treat availability in the UI as rules certification | [README rules and scope](../README.md#rules-and-scope), [3.0 design](3.0-design.md) |

The PHB skill-bonus feats are selectable and their Table 5-1 bonuses are included
in skill totals and breakdowns, including the printable sheet: Acrobatic (+2
Jump and Tumble), Agile (+2 Balance and Escape Artist), Animal Affinity (+2
Handle Animal and Ride), Athletic (+2 Climb and Swim), Deft Hands (+2 Sleight
of Hand and Use Rope), Diligent (+2 Appraise and Decipher Script), and Stealthy
(+2 Hide and Move Silently) (*Player's Handbook* (3.5), Table 5-1, p. 90).

Greater Weapon Focus grants +1 on attacks with its selected weapon (Fighter 8th,
Weapon Focus, and proficiency with that weapon). Greater Weapon Specialization
grants +2 damage with its selected weapon (Fighter 12th, Greater Weapon Focus,
Weapon Focus, Weapon Specialization, and proficiency with that weapon); these
bonuses stack with their lower-tier counterparts (*Player's Handbook* (3.5),
Table 5-1, p. 90).

The item-creation feat catalog includes Brew Potion and Craft Wondrous Item
(caster level 3), Craft Magic Arms and Armor and Craft Wand (caster level 5),
Craft Rod (caster level 9), and Craft Staff and Forge Ring (caster level 12).
Other item-specific prerequisites and crafting costs remain manual (*Player's
Handbook* (3.5), Table 5-1, p. 90).

Simple Weapon Proficiency grants proficiency with all simple weapons and is
offered only when the character is not already proficient with every simple
weapon. Improved Shield Bash requires Shield Proficiency and retains the
shield's AC bonus while bashing (*Player's Handbook* (3.5), Table 5-1, p. 90).

Bastard swords and dwarven waraxes are exotic when wielded one-handed, but
Medium characters can wield either two-handed as a martial weapon; dwarves
also treat a dwarven waraxe as martial when wielded one-handed. The equipment
catalog includes the bastard sword's PHB cost, weight, damage, and critical
profile. Exotic Weapon Proficiency has no Strength prerequisite
(*Player's Handbook* (3.5), Table 7-5, p. 117; weapon descriptions, pp. 121-122).

Far Shot requires Point Blank Shot. It increases projectile-weapon range
increments by 50% and thrown-weapon increments by 100%; the adjusted increments
also affect range penalties and maximum range (*Player's Handbook* (3.5),
Table 5-1, p. 91; Far Shot, p. 94).

Eschew Materials has no prerequisite and waives material components costing
1 gp or less. Improved Feint requires Intelligence 13 and Combat Expertise,
is a Fighter bonus feat, and allows feinting as a move action; component
handling and feint resolution remain manual (*Player's Handbook* (3.5),
Table 5-1, p. 91; feat descriptions, pp. 94-95).
Combat Expertise requires Intelligence 13 and, when using the melee attack or
full attack action, trades an attack penalty limited by base attack bonus and
+5 for an equal dodge bonus to AC until the next action. Improved Disarm and
Improved Trip also require Intelligence 13 and
Combat Expertise, and are Fighter bonus feats. Their disarm/trip checks and
follow-up attacks remain manual; a Monk may select either as a 6th-level bonus
feat without meeting its prerequisites (*Player's Handbook* (3.5), pp. 40,
92, 95-96).
Dodge requires Dexterity 13 and is a Fighter bonus feat. During an action, the
character designates an opponent and gets +1 dodge AC against that opponent;
the target can be changed on any action, and the bonus is lost while the
character is denied Dexterity to AC. The app applies the bonus through a
session-only current-opponent toggle rather than tracking opponent identities
or turn changes (*Player's Handbook* (3.5), Table 5-1, p. 91; feat
description, p. 92).
Whirlwind Attack requires Dexterity 13, Intelligence 13, base attack bonus +4,
Combat Expertise, Dodge, Mobility, and Spring Attack; it is also a Fighter
bonus feat. It replaces regular full-attack attacks with one attack at full BAB
against each opponent within reach and forfeits extra attacks; attack
resolution remains manual (*Player's Handbook* (3.5), Table 5-1, pp. 90-91;
feat description, p. 102).
Great Cleave requires Strength 13, Cleave, Power Attack, and base attack bonus
+4, and is a Fighter bonus feat. It follows Cleave with no per-round limit to
the number of qualifying follow-up attacks; resolve drops and attacks manually
(*Player's Handbook* (3.5), Table 5-1, pp. 90-91; feat description, p. 94).
Rapid Shot requires Dexterity 13 and Point Blank Shot, and is a Fighter bonus
feat. It adds one ranged attack at highest BAB during a full attack and applies
a -2 penalty to each attack that round; it does not apply to Manyshot's
standard-action attack. Ranger archery style grants it at level 2 despite
unmet prerequisites while the Ranger wears light or no armor
(*Player's Handbook* (3.5), p. 48, Table 5-1, pp. 90-91; feat description,
p. 99).
Precise Shot requires Point Blank Shot and is a Fighter bonus feat. It removes
the standard -4 penalty for ranged attacks against an opponent engaged in
melee. The combat panel applies the penalty when its session-only target
context marks the target engaged with a friendly character, unless Precise
Shot is active or the target (or aimed-at portion) is at least 10 ft. from the
nearest friendly character. The relationship and distance are entered
manually; the penalty applies to ranged attacks, including the shared
Manyshot roll (*Player's Handbook* (3.5), Table 5-1, p. 91; feat description,
p. 99; shooting into melee, p. 140).
Shot on the Run requires Dexterity 13, Dodge, Mobility, Point Blank Shot, and
base attack bonus +4, and is a Fighter bonus feat. With the attack action and a
ranged weapon, it allows moving before and after the attack, up to the
character's speed. That movement does not provoke from the attacked defender,
but may provoke from others, and the feat cannot be used in heavy armor;
movement sequencing remains manual (*Player's Handbook* (3.5), Table 5-1,
pp. 90-91; feat description, p. 100).
Mobility requires Dexterity 13 and Dodge, and is a Fighter bonus feat. It adds
a +4 dodge bonus to AC against attacks of opportunity caused by moving out of
or within a threatened area. The combat panel does not model movement-triggered
attacks of opportunity, so apply this bonus manually (*Player's Handbook*
(3.5), Table 5-1, p. 91; feat description, p. 98).
Spring Attack requires Dexterity 13, Dodge, Mobility, and base attack bonus +4,
and is a Fighter bonus feat. It allows a melee attack action between two parts
of a move, each at least 5 feet, with total movement no greater than speed.
Movement does not provoke from the attacked defender but may provoke from
others; the feat cannot be used in heavy armor. Movement and opportunity
attacks remain manual (*Player's Handbook* (3.5), Table 5-1, pp. 90-91; feat
description, p. 100).
Manyshot requires Dexterity 17, Point Blank Shot, Rapid Shot, and base attack
bonus +6, and is a Fighter bonus feat. Ranger archery style grants it at level
6 without its usual prerequisites. The combat panel tracks its 30-foot limit,
BAB-based arrow count, single attack roll, and cumulative attack penalty; apply
damage per arrow, precision damage once, and critical damage only to the first
arrow. At 30 feet, Point Blank Shot's +1 attack bonus applies once to the shared
roll and its +1 damage bonus is included for each arrow
(*Player's Handbook* (3.5), pp. 48, 90-91, 97-98).

Two-Weapon Defense requires Dexterity 15 and Two-Weapon Fighting. Its +1 shield
bonus is applied while wielding two weapons and does not stack with other
shield bonuses. Fighting defensively or using total defense raises it to +2;
those action modes remain manual (*Player's Handbook* (3.5), Table 5-1, p. 91;
feat description, p. 102).

Catalog source labels identify the broad source group (Core SRD or Dragonlance
user content pack). Feats and verified classes additionally show book-level
cross-checks: core classes and PHB feats to the *Player's Handbook* (3.5), epic
feats to the *Dungeon Master's Guide* (3.5), MM monster feats to the *Monster
Manual* (3.5), core prestige classes to the DMG, and Dragonlance classes and
feats to their respective sourcebooks.
*Master of the Way* remains broad-source-only because its book source is
unverified. The earlier 716-record SRD inventory had a name-only PHB
cross-check. Its unresolved *Phantom Trap* is now verified as *Leomund's Trap*
(PHB pp. 247-248), and the duplicate has been merged with saved-name migration.
The current 715 class-level records represent 605 distinct titles. The
115-title low-level header review above has separate source-backed cases;
remaining spell effects and higher-level headers are not thereby certified.
| Printable/player-sheet generation | Implemented (bounded) | A data-bound, two-page Letter-portrait sheet follows the authorized character-record-sheet examples and prints identity, abilities, defenses, attacks, skills, gear, spells, traits, feats, languages, and carrying capacity; the Handwritten toggle defaults on and styles generated data except the Skills area, without changing fixed labels or layout | Hard requirement: the generated PDF is exactly two portrait Letter pages (8.5 × 11 inches each), with no extra page, clipping, or overflow. Longer character data must fit those fixed pages; empty or unsupported fields remain blank. Final PDF page-count and dense-content fit validation remains; experience points are not tracked. Printed calculations follow the existing bounded rules coverage | [PrintableCharacterSheet.tsx](../src/components/PrintableCharacterSheet.tsx), [app.test.tsx](../tests/app.test.tsx), [3.0 design](3.0-design.md) |

## Dragonlance race audit

The existing Dragonlance race profiles were checked against *Dragonlance
Campaign Setting* (3.5), Chapter 1, “Races of Krynn” (pp. 11–43): Kender;
Qualinesti, Silvanesti, Kagonesti, Dargonesti, and Dimernesti elves; Hill,
Mountain, Dark, and Gully Dwarves; Baaz and Kapak Draconians; Irda; Minotaurs;
and the Dragonlance Half-Elf Elvensight variant. Focused regressions cover
source-backed ability adjustments, languages, skill/save bonuses, racial Hit
Dice, level adjustments, and proficiencies where modeled.

The audit corrected inherited Qualinesti/Silvanesti weapon proficiencies and
secret-door reminders, dwarf-variant weapon familiarity, and Baaz/Kapak racial
weapon and armor proficiencies (plus Baaz shield proficiency). The sourcebook
has additional race options not represented in the selectable catalog, such as
centaurs and half-ogres. Generic Draconian and Deep Dwarf remain unselectable
placeholders; transformations, natural attacks, death throes, and limited-use
spell-like abilities remain manual.

Evidence: [race definitions](../src/domain.ts), [race rules](../src/rules.ts),
[rules tests](../tests/rules.test.ts), and
[proficiency tests](../tests/proficiency.test.tsx).

## Core class alignment restrictions

| Restriction | Enforcement | Source and regression coverage |
|---|---|---|
| Barbarian and Bard characters must be nonlawful; Druids must be neutral on at least one alignment axis; Monks must be lawful; Paladins must be Lawful Good. | Creation and level-up validation use the class alignment rules in `src/rules.ts`. | [Barbarian](https://www.d20srd.org/srd/classes/barbarian.htm), [Bard](https://www.d20srd.org/srd/classes/bard.htm), [Druid](https://www.d20srd.org/srd/classes/druid.htm), [Monk](https://www.d20srd.org/srd/classes/monk.htm), [Paladin](https://www.d20srd.org/srd/classes/paladin.htm); `tests/rules.test.ts`. |
| A Cleric's alignment may be one step from the deity on either axis, but not both; a True Neutral Cleric must worship a True Neutral deity. | `alignmentDistance` measures both axes, and `isClericAlignmentAllowed` applies the one-step and True Neutral rules at creation and level-up. A Cleric level requires a selected deity. | [Cleric](https://www.d20srd.org/srd/classes/cleric.htm); creation-flow coverage in `tests/app.test.tsx` and rule/level-up coverage in `tests/rules.test.ts`. |

Paladin class-feature loss after an alignment change is not modeled. Alignment and deity are not generally editable after character finalization, so this remains a manual rules boundary; changing deity may also require reviewing domain choices. Setting-specific deity rules and broader multiclass edge cases remain outside this coverage.

## What this says about completeness

The project has broad, regression-tested support for common character creation,
advancement, and derived-stat workflows. It is **not** close to implementing all
D&D 3.5 rules: several areas are intentionally manual, and no exhaustive
source-by-source audit has established a complete denominator. A percentage
would therefore be misleading.

Maximize Spell is tracked per prepared copy for its +3 slot cost; it does not
raise the spell's actual level or save DC. Combined Empower and Maximize uses a
slot five levels higher; maximizing effects and adding half the normal roll
remain manual. PHB Table 5-1 (pp. 90–91) lists no prerequisites for Empower
Spell or Maximize Spell.
Extend Spell is tracked per prepared copy for its +1 slot cost. The app does not
double duration text or automatically exclude concentration, instantaneous, or
permanent spells ([SRD Extend Spell](https://www.d20srd.org/srd/feats.htm#extendSpell)).
Enlarge Spell is tracked per prepared copy for its +1 slot cost; its qualifying
range increases remain manual because range values are stored as prose
([SRD Enlarge Spell](https://www.d20srd.org/srd/feats.htm#enlargeSpell)).
Quicken Spell is tracked per prepared copy for its +4 slot cost. Casting-time
eligibility, free-action casting, the one-per-round limit, and its no-attack-of-
opportunity effect remain manual ([SRD Quicken Spell](https://www.d20srd.org/srd/feats.htm#quickenSpell)).
Silent Spell is tracked per prepared copy for its +1 slot cost. Component
eligibility and removing the verbal component remain manual because component
lists are free-form; bard spells cannot use this feat
([SRD Silent Spell](https://www.d20srd.org/srd/feats.htm#silentSpell)).
Still Spell is tracked per prepared copy for its +1 slot cost. Component
eligibility and removing the somatic component remain manual because component
lists are free-form; bard spells with somatic components can benefit
([SRD Still Spell](https://www.d20srd.org/srd/feats.htm#stillSpell)).
Widen Spell is tracked per prepared copy for its +3 slot cost. Only burst,
emanation, line, and spread areas qualify; area eligibility and doubling
numeric measurements remain manual because spell areas are not structured
([SRD Widen Spell](https://www.d20srd.org/srd/feats.htm#widenSpell)).
Sculpt Spell requires another metamagic feat and is tracked per prepared copy
for its +1 slot cost. Verify that the spell has an area and choose one of the
feat's area shapes manually; the catalog does not structure spell areas
(*Complete Arcane*, p. 83).

## Recommended audit order

1. Audit the cataloged feats against the four provided books for prerequisites,
   benefits, repeatability, and player-character eligibility; fix discrepancies
   and add focused regression tests. Catalog completeness is not rules
   verification.
2. Verify remaining class restrictions against the SRD; record the source,
   implementation location, status, and a focused regression test for each
   correction.
3. Continue with spellcasting and combat edge cases, then assess optional
   Dragonlance content separately.
4. Finish print-fit validation: confirm the generated PDF is exactly two portrait
   Letter pages, with no clipping or spillover, including dense character data.
