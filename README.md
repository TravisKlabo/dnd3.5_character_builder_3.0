# D&D 3.5 Character Builder 3.0

A separate, local-first evolution of the 2.0 builder. Character creation, progression,
Dragonlance options, spells, equipment, the store, the forge, custom items, and
JSON import/export retain their familiar appearance. Targeted, tested corrections
to inherited rules calculations are documented below.

All application printing, PDF actions, preview dialogs, print URL modes, and
print-only styles have been removed. Browser/operating-system commands are outside
the application's control. Custom-item dialogs remain available.

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
and a production build. The build fails if initial JavaScript exceeds 430,000
uncompressed bytes. Tests cover draft isolation, progression, combat calculations,
catalog matching and invalidation, persistence, malformed imports, lazy loading,
screen navigation, custom items, and the absence of printing APIs/styles.

The catalog benchmark compares the old per-lookup sorting algorithm with the new
index, checks equivalent results for every catalog entry and decorated variant,
and requires at least a 2x lookup improvement. Timings vary by machine.

## Optimizations

- Independent screen components, data catalogs, rules, persistence, and validation
  replace the original single-file application.
- Spell data is downloaded once, only when a caster, spell-bearing inventory, or
  the Wands & Scrolls screen requires it. Loading failures have a visible retry.
- Equipment, store, forge, crafting, and spell screens are loaded on demand.
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
The optimized build is approximately 375 KB before compression (about 39% less).
Full spellcasting sessions still load the spell catalog and their requested screens;
code splitting reduces initial work, not the size of the rules content itself.

## Saving and compatibility

Save uses this application's local browser/Electron storage. Export creates a JSON
file containing the character and custom item catalog; Import accepts well-formed
2.0 character exports. Export a character from 2.0 and import it into 3.0 to transfer
between application origins or desktop installations.

The application still has one active locally saved character. Use separate JSON
exports to keep multiple characters. There is no cloud synchronization.

Age, height, and body weight are free-form text fields in setup and on the finalized
sheet. Values such as `about 30`, `180 lb.`, or `82.5 kg` are saved exactly as entered,
without unit conversion or numeric stepping. Body weight is descriptive and does
not change inventory encumbrance calculations.

### Compact character sheet

Caster characters have a compact Spellcasting panel with a Manage spells shortcut,
class-specific base caster levels and save DCs, and the existing Concentration
skill modifier. DC chips appear only for levels with usable daily slots and a
sufficient casting ability score. Concentration tooltips share the Skills
breakdown; Combat Casting and other conditional effects remain manual.

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
attacks, though tracked attack modifiers do apply. Ranged attacks remain subject
to ammunition and reload/draw actions.
Standard ranged/thrown increments and melee weapon reach appear alongside weapon
details; custom size-specific range and explicit reach values take precedence.
Reach weapons distinguish normal-reach exclusions, spiked chain, and whip rules.

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
animals (and a druid/ranger's companion). Sleight of Hand permits limited Dexterity
checks at DC 10 or lower, with the exception for hiding an object on the body.
These limitations are explained in the skill-name tooltips. Speak Language leaves
the modifier blank; its tooltip explains that it has no skill check and points to
the Languages section.

Status is derived from existing ranks and updates during setup and level-up;
discarding a draft restores the original training. No extra training flags are
saved. Displayed modifiers include ability, whole ranks, racial bonuses,
equipped armor/shield check penalties, and tracked effects. A compact label such as **-5 armor,
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
shields. Fighters receive tower proficiency. Mithral uses the original armor
category for proficiency, separate from its lighter movement category.
Dragonlance class proficiency support remains limited to the existing catalog
assumptions (Noble light armor); those source-specific classes are not certified.

Armor Proficiency (Light/Medium/Heavy), Shield Proficiency, and Tower Shield
Proficiency are selectable general feats with their prerequisite chains.
Class-granted proficiencies satisfy prerequisites without spending feat slots
and are not offered as redundant choices.

Equipped nonproficient armor/shields apply their adjusted armor check penalties
to every weapon attack and all Strength/Dexterity skill checks, including Ride,
Use Rope, and trained Open Lock. Initiative, a Dexterity ability check, also
includes these penalties. Armor and shield nonproficiency penalties stack with
each other, but a skill already affected by normal armor penalties does not
take the same item's penalty twice. Normal load-vs-armor comparisons and doubled
Swim penalties remain unchanged. Weapon Finesse's separate shield penalty still
applies in addition to shield nonproficiency.

Only actual negative penalties produce a compact **-5 armor (nonprof.)** or
**-2 shield (nonprof.)** label on affected attacks/checks. Tooltips identify the
items. Zero-penalty nonproficient equipment produces no penalty label. Damage,
AC, and saving throws are not reduced by nonproficiency. Selection changes and
level-up drafts recalculate immediately; discarding a draft restores the original.

Druid metal equipment prohibitions are separate from proficiency. Equip warnings
explain their spellcasting/class-ability consequences, including the 24-hour
duration, but enforcement remains manual. This pass does not add weapon
nonproficiency penalties, tower shields' separate universal attack penalty/cover
rules, or other equipment-specific restrictions.

References: SRD [armor rules](https://www.d20srd.org/srd/equipment/armor.htm),
[proficiency feats](https://www.d20srd.org/srd/feats.htm#armorProficiencyLight),
[Barbarian](https://www.d20srd.org/srd/classes/barbarian.htm),
[Paladin](https://www.d20srd.org/srd/classes/paladin.htm), and
[Druid](https://www.d20srd.org/srd/classes/druid.htm).

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
- Mystic sheets remain available with an explicit unverified-content notice.

Preparation counts allow multiple copies of a spell and enforce capacity
separately at each spell level. The same spell can be prepared independently by
two classes. Expended slot checkboxes belong only to their class and spell level;
**Reset [class] expended slots** clears only that class's usage, not preparation.
Changing subtabs or screens does not erase tracking. There is no automatic rest
reset. Preparation and usage are provisional in creation/level-up drafts and are
included in main Save and JSON Export/Import.

Older class-tagged spell lists are respected, including explicitly empty lists.
For legacy flat lists without class identity, an explicit old spell-to-class
tag is used first; otherwise a spell is assigned once to the first applicable
caster in character class order (or the first caster if the catalog cannot match
it). This avoids copying every legacy spell onto every sheet. Ambiguous old
ownership cannot be reconstructed perfectly; review imported multiclass sheets.
Viewing does not rewrite a save, and existing over-limit selections are preserved
with a notice rather than silently removed.

### Cleric domains

The Cleric subtab offers all 22 core SRD domains with their nine domain spells
at the domain-specific levels. Choose two different domains; Chaos, Evil, Good,
and Law require matching cleric alignment. Domain-granted class skills (Animal,
Plant, Knowledge, Travel, Trickery) apply automatically to cleric rank costs and
class-skill indicators, not to unrelated classes. They do not grant ranks.
Powers are in compact expandable sections with **Applied automatically** and
**Manual resolution** labels. Turning, limited-use powers, conditional caster-level
bonuses, and War's favored-weapon benefits are documented but not automatically
rolled, spent, or added to permanent statistics.

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
domain does not refresh expended slots. **Reset Cleric expended slots** clears
ordinary and domain usage, not preparation; other classes' reset buttons cannot
clear cleric usage. No automatic rest reset is implied. Domain data follows
creation/level-up drafts and main Save/JSON Export/Import. Existing saves need no
migration. Missing choices or unavailable imported preparations produce warnings;
unavailable preparations remain visible for correction rather than disappearing.
Established domains are locked on a finalized sheet; **Change domains** explicitly
requires confirmation that this is a DM-approved lasting change, not daily
preparation.

Named-deity domain associations and favored weapons are **not source-verified**,
including those currently labeled core in the inherited deity catalog. The UI
explicitly requires DM confirmation, rather than presenting a guessed filtered
list. Dragonlance-specific domains are not included. This pass does not certify
the deity catalog, enforce every ordinary cleric spell's alignment descriptor,
or enforce druid/other class restrictions on multiclass casting.

Sources: SRD [Cleric](https://www.d20srd.org/srd/classes/cleric.htm) and
[Cleric Domains](https://www.d20srd.org/srd/spellLists/clericDomains.htm).

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
  help, previously deciphered writing, or a Spellcraft total against DC 20 + spell
  level. Read magic bypasses deciphering checks, not the later learning check.
- Confirm one day of study and enter the actual learning Spellcraft total against
  DC 15 + spell level. No rolls or skill modifiers are applied automatically.
- Resolve 24 hours of writing and 100 gp per page of materials with the DM.
  Spells use one page per level, with a minimum of one page for a cantrip.
  Another wizard's usual access fee (50 gp per spell level) is shown separately.
- **Research / DM reward:** explicitly confirm DM approval and adjudication of
  applicable checks, time, and costs. This records catalog spells, not custom spells.

Failed checks cannot add a spell. The dialog explains the next-day restriction on
failed deciphering and the additional-Spellcraft-rank restriction on failed
learning; failed attempts and retry eligibility remain manually tracked with the
DM, not persisted or automatically enforced. Cancel/Escape discards pending
results. Successful learning saves the source, recording date, and entered check
totals alongside the character. Copying from a scroll consumes its source spell
under the rules, but **gold, inventory, and elapsed campaign time are not changed
automatically**. Handle those separately; removing a learned spell does not refund
them.

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

This is not a certification of all D&D or Dragonlance mechanics. The first combat
correctness pass intentionally corrects inherited calculations:

- Magical weapon enhancement affects both attack and physical damage; masterwork
  attack enhancement does not stack with it.
- Weapon Finesse applies to eligible, appropriately sized melee weapon attacks,
  not damage. Shield check penalties are included when choosing Finesse.
- Two-handed melee weapons add 1.5 times a positive Strength modifier; off-hand
  attacks add half. Negative modifiers apply in full.
- Two-weapon penalties distinguish light/non-light off-hand weapons and the feat.
  One-handed non-light off-hand weapons are now permitted by the equipment picker.
- Character size affects attacks. Halflings and gnomes now have their missing
  Small-size metadata, also correcting their size-dependent AC and carrying limits.
- Ranged attacks use Dexterity. Slings/thrown weapons use Strength for damage;
  crossbows do not, and ordinary bows apply only a Strength penalty.
- Equipment screens share equipping logic and weapon classification, including
  material/masterwork variants, composite bows, and custom handedness.

Expected-result regression tests cover these cases and agreement between both
character sheets. References: SRD [combat statistics](https://www.d20srd.org/srd/combat/combatStatistics.htm),
[two-weapon fighting](https://www.d20srd.org/srd/combat/specialAttacks.htm#twoWeaponFighting),
[Weapon Finesse](https://www.d20srd.org/srd/feats.htm#weaponFinesse),
[weapons](https://www.d20srd.org/srd/equipment/weapons.htm), and
[magic weapons](https://www.d20srd.org/srd/magicItems/magicWeapons.htm).

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

Remaining gaps include complete proficiency and racial
attack modifiers, weapon-size mismatch penalties and handling, selecting a
one-handed weapon's two-handed grip, double-weapon modes, and full bonus stacking.
Composite bows currently have an implicit +0 Strength rating; selectable ratings
and their attack penalties are not implemented. Custom ranged/thrown mode is not
persisted; handedness `Ranged` and placement in the ranged slot select Dexterity
attacks, but custom projectile damage needs further metadata. Iterative attacks,
range/ammunition modifiers, two-handed weapon/shield compatibility (including
bucklers), and special shield/material cases also need further
verification. Spellcasting still needs full domain-power automation and verified
deity associations, wizard specialization/
prohibited schools, spontaneous known-spell replacement, prestige-class casting
advancement, and feat/item caster-level/DC/slot adjustments. Slot expenditure is
manual rather than automatically linked to casting a specific prepared spell.
Dragonlance content remains unverified.

The application still rolls hit points **before** level-up confirmation.
See [the design notes](docs/3.0-design.md) for retained goals and unfinished work.
