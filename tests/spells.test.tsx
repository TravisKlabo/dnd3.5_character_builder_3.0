import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { cloneCharacter, initialCharacter, type Character, type ClassId } from "../src/domain";
import { defaultSrdSpellSourceBook, findSpellByName, getClassSpells, getSrdSpellContentSource, getSrdSpellSourceBook, loadSpellCatalog } from "../src/data/spellCatalog";
import { srdSpells } from "../src/srdSpells";
import { WandsScrollPanel } from "../src/components/WandsScrollPanel";
import { baseSpellSlots, getCasterLevel, getClassSpellSelections, getDailySpellSlots,
  getHighSorceryMoonModifier, getKnownSpellLimit, getLevelUpSpellWarnings,
  getKnownSpellReplacementLevelLimit, getMysticSpellReplacementLevelLimit, getSpellSaveDC,
  getSpellcastingAbility, hasSpellLevelAtClassLevel,
  getWizardFreeSpellAllowance, getWizardSpellbookSpells } from "../src/rules";
import { getWizardCopyRequirements } from "../src/wizardSpellbookRules";
import { savedCharacterSetupDraftStorageKey, savedCharacterStorageKey } from "../src/storage";
import { parseCharacter } from "../src/validation";
import { SpellSheets } from "../src/components/SpellSheet";
import { readStoredCharacter } from "./storageTestHelpers";

beforeAll(loadSpellCatalog);
describe("spell catalog source attribution", () => {
  it("attributes Phantom Trap to its PHB Leomund's Trap title", () => {
    expect(defaultSrdSpellSourceBook).toBe("Player's Handbook (3.5)");
    const phantomTrap = findSpellByName("Phantom Trap");
    const magicMissile = srdSpells.find((spell) => spell.name === "Magic Missile");
    if (!phantomTrap || !magicMissile) throw new Error("Expected core spell entries are missing.");
    expect(getSrdSpellSourceBook(phantomTrap)).toBe("Player's Handbook (3.5)");
    expect(findSpellByName("Leomund’s Trap")).toBe(phantomTrap);
    expect(srdSpells.filter((spell) => ["Phantom Trap", "Leomund’s Trap"].includes(spell.name)))
      .toEqual([phantomTrap]);
    expect(getSrdSpellSourceBook(magicMissile)).toBe("Player's Handbook (3.5)");
    expect(
      srdSpells
        .filter((spell) => spell.sourceBook === null)
        .map((spell) => spell.name),
    ).toEqual([]);
  });

  it("preserves PHB Iron Body effects and source", () => {
    const ironBody = findSpellByName("Iron Body");
    if (!ironBody) throw new Error("Missing Iron Body spell.");
    expect(ironBody).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Transforms you into living iron: DR 15/adamantine; immunity to blindness, critical hits, ability damage, deafness, disease, drowning, electricity, poison, stunning, and effects targeting physiology or respiration; half acid and fire damage; +6 Str, -6 Dex (minimum 1), half speed, 50% arcane spell failure, and -8 armor check penalty; vulnerable to iron golem special attacks. Your unarmed strikes deal club damage and count as armed; you cannot drink or play wind instruments, and your weight increases tenfold.",
      school: "Transmutation",
      components: "V, S, M/DF",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "1 min./level (D)",
      savingThrow: "",
    });
    expect(getSrdSpellSourceBook(ironBody)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Astral Projection and Crushing Hand details", () => {
    const astralProjection = findSpellByName("Astral Projection");
    const crushingHand = findSpellByName("Crushing Hand");
    if (!astralProjection || !crushingHand) throw new Error("Missing PHB level-nine spell.");
    expect(astralProjection).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      description: expect.stringContaining("Each traveler requires a jacinth worth at least 1,000 gp and a silver bar worth 5 gp"),
      school: "Necromancy",
      components: "V, S, M",
      castingTime: "30 minutes",
      range: "Touch",
    });
    expect(crushingHand).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Creates a Large force hand that can grapple one opponent with a grapple modifier of caster level + the relevant spellcasting ability modifier +16, dealing 2d6+12 damage on each successful grapple check; it can also interpose itself or bull rush (+18). Directing it to a new target is a move action. Requires an egg shell and snakeskin glove; spell resistance applies.",
      school: "Evocation [Force]",
      components: "V, S, M, F/DF",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect([astralProjection, crushingHand].every((spell) =>
      getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Delayed Blast Fireball, Grasping Hand, and summon metadata", () => {
    const delayedBlastFireball = findSpellByName("Delayed Blast Fireball");
    const graspingHand = findSpellByName("Grasping Hand");
    const summonMonster = findSpellByName("Summon Monster VII");
    const summonNature = findSpellByName("Summon Nature’s Ally VII");
    const spells = [delayedBlastFireball, graspingHand, summonMonster, summonNature];
    if (spells.some((spell) => !spell)) throw new Error("Missing PHB 7th-level spell.");
    expect(delayedBlastFireball).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Evocation [Fire]",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "5 rounds or less; see text",
      savingThrow: "Reflex half",
    });
    expect(graspingHand).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Evocation [Force]",
      components: "V, S, F/DF",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(summonMonster).toMatchObject({
      level: 7,
      classes: ["cleric", "sorcerer", "wizard"],
      components: "V, S, F/DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(summonNature).toMatchObject({
      level: 7,
      classes: ["druid"],
      components: "V, S, DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(spells.every((spell) => spell && getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Energy Drain, Etherealness, Foresight, Freedom, and Gate", () => {
    const energyDrain = findSpellByName("Energy Drain");
    const etherealness = findSpellByName("Etherealness");
    const foresight = findSpellByName("Foresight");
    const freedom = findSpellByName("Freedom");
    const gate = findSpellByName("Gate");
    const spells = [energyDrain, etherealness, foresight, freedom, gate];
    if (spells.some((spell) => !spell)) throw new Error("Missing PHB level-nine spell.");

    expect(energyDrain).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "A ray that strikes a creature inflicts 2d4 negative levels with no initial save; 24 hours later, it makes a Fortitude save for each negative level or permanently loses one character level (successful saves also remove the negative level). Undead struck gain 2d4 × 5 temporary hp for 1 hour; spell resistance applies.",
      school: "Necromancy",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Instantaneous",
      savingThrow: "Fortitude partial; see text for enervation",
    });
    expect(etherealness).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Makes you and one willing, linked-hand creature per three caster levels (with their equipment) ethereal for 1 min./level; subjects may separate once ethereal. When the spell ends, all affected creatures return to material existence. Spell resistance applies.",
      school: "Transmutation",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Touch; see text",
      duration: "1 min./level (D)",
      savingThrow: "None",
    });
    expect(foresight).toMatchObject({
      level: 9,
      classes: ["druid", "sorcerer", "wizard"],
      description: "Gives you or another creature instantaneous warnings of impending danger. When you are the subject, you are never surprised or flat-footed and gain +2 insight AC and Reflex saves (lost when you would lose a Dex bonus); when another is the subject, you must relay the warning and it gains no such bonus. Requires a hummingbird feather; spell resistance does not apply to you and applies only if harmless when cast on another.",
      school: "Divination",
    });
    expect(freedom).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Frees one creature from movement-restricting spells and effects, including binding, entangle, grappling, imprisonment, maze, paralysis, petrification, pinning, sleep, slow, stunning, temporal stasis, and web. To free someone from imprisonment or maze, you must know its name and background and cast at the place it was imprisoned or banished. Spell resistance applies.",
      school: "Abjuration",
      components: "V, S",
      castingTime: "1 standard action",
      duration: "Instantaneous",
    });
    expect(gate).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Creates an interplanar portal that permits travel in either direction and can call an extraplanar creature. The portal opens at a precise point, cannot connect locations on the same plane, and remains open only while you concentrate (up to 1 round/level) for travel. Called creatures may be controlled only within the stated HD limits; services beyond an immediate task require a fair reward. Calling creatures costs 1,000 XP; the spell gains the called creature's alignment or elemental descriptor. Spell resistance does not apply.",
      school: "Conjuration (Creation or Calling)",
      components: "V, S, XP; see text",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
    });
    expect(spells.every((spell) => spell && getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Cure Critical Wounds, Mass and Elemental Swarm variants", () => {
    const massCureVariants = srdSpells.filter((spell) => spell.name === "Cure Critical Wounds, Mass");
    expect(massCureVariants.map(({ level, classes }) => ({ level, classes }))).toEqual([
      { level: 8, classes: ["cleric"] },
      { level: 9, classes: ["druid"] },
    ]);
    const elementalSwarm = findSpellByName("Elemental Swarm");
    if (!elementalSwarm) throw new Error("Missing Elemental Swarm spell.");
    expect(elementalSwarm).toMatchObject({
      level: 9,
      classes: ["druid"],
      description: "Opens a portal and summons 2d4 Large elementals, then 1d4 Huge elementals ten minutes later, then one greater elemental ten minutes after that; they have maximum hit points per HD and serve without concentration. You can dismiss them singly or together. A druid chooses the elemental plane; a cleric uses a matching domain. The spell gains the summoned element's descriptor; spell resistance does not apply.",
      school: "Conjuration (Summoning) [see text]",
      components: "V, S",
      castingTime: "10 minutes",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "10 min./level (D)",
      savingThrow: "None",
    });
    expect(massCureVariants.every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
    expect(getSrdSpellSourceBook(elementalSwarm)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Meteor Swarm, Miracle, and Power Word Kill", () => {
    const meteorSwarm = findSpellByName("Meteor Swarm");
    const miracle = findSpellByName("Miracle");
    const powerWordKill = findSpellByName("Power Word Kill");
    if (!meteorSwarm || !miracle || !powerWordKill) throw new Error("Missing PHB level-nine spell.");
    expect(meteorSwarm).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: expect.stringContaining("Apply saves and fire resistance separately to each explosion"),
      school: "Evocation [Fire]",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "Instantaneous",
      savingThrow: "None or Reflex half; see text",
    });
    expect(miracle).toMatchObject({
      level: 9,
      classes: ["cleric"],
      description: expect.stringContaining("pay any duplicated spell's XP cost and supply material components costing more than 100 gp"),
      school: "Evocation",
      components: "V, S, XP; see text",
      castingTime: "1 standard action",
    });
    expect(powerWordKill).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Instantly kills one living creature with 100 hp or less, whether or not it hears the word; creatures with 101 hp or more are unaffected. There is no saving throw; spell resistance applies.",
      school: "Enchantment (Compulsion) [Death, Mind-Affecting]",
      components: "V",
      savingThrow: "None",
    });
    expect([meteorSwarm, miracle, powerWordKill].every((spell) =>
      getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Shapechange, Soul Bind, Storm of Vengeance, and summon variants", () => {
    const shapechange = findSpellByName("Shapechange");
    const soulBind = findSpellByName("Soul Bind");
    const stormOfVengeance = findSpellByName("Storm of Vengeance");
    const summonMonster = findSpellByName("Summon Monster IX");
    const summonNature = findSpellByName("Summon Nature’s Ally IX");
    const spells = [shapechange, soulBind, stormOfVengeance, summonMonster, summonNature];
    if (spells.some((spell) => !spell)) throw new Error("Missing PHB level-nine spell.");
    expect(shapechange).toMatchObject({
      level: 9,
      classes: ["druid", "sorcerer", "wizard"],
      description: "Lets you assume the form of any familiar, nonunique creature of any type, Fine through Colossal, with no more HD than your caster level (maximum 25). You can assume incorporeal or gaseous forms, gain the form's extraordinary and supernatural abilities and type, and lose your own supernatural abilities. You can change form once per round as a free action, not during another action.",
      school: "Transmutation (Polymorph)",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "10 min./level (D)",
      savingThrow: "",
    });
    expect(soulBind).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Traps the soul of a creature dead no more than 1 round per caster level in a black sapphire; clone, resurrection magic, wish, or miracle cannot return it. Destroying the gem or dispelling the spell frees the soul, but it remains dead. The gem must be worth at least 1,000 gp per HD or it shatters; spell resistance does not apply.",
      school: "Necromancy",
      components: "V, S, F",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Permanent",
      savingThrow: "Will negates",
    });
    expect(stormOfVengeance).toMatchObject({
      level: 9,
      classes: ["cleric", "druid"],
      description: expect.stringContaining("six lightning bolts with no more than one per target"),
      school: "Conjuration (Summoning)",
      castingTime: "1 round",
      duration: "Concentration (maximum 10 rounds) (D)",
    });
    expect(stormOfVengeance?.description).toContain("the storm's save DC + the level of the spell being cast");
    expect(summonMonster).toMatchObject({
      level: 9,
      classes: ["cleric", "sorcerer", "wizard"],
      school: "Conjuration (Summoning) [see text]",
      components: "V, S, F/DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(summonNature).toMatchObject({
      level: 9,
      classes: ["druid"],
      school: "Conjuration (Summoning) [see text]",
      components: "V, S, DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(spells.every((spell) => spell && getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Banishment class levels and alignment-word effects", () => {
    const banishments = srdSpells.filter((spell) => spell.name === "Banishment");
    expect(banishments.map(({ level, classes, school }) => ({
      level, classes, school,
    }))).toEqual([
      { level: 6, classes: ["cleric"], school: "Abjuration" },
      { level: 7, classes: ["sorcerer", "wizard"], school: "Abjuration" },
    ]);
    expect(getClassSpells("cleric").find((spell) => spell.name === "Banishment")?.level).toBe(6);
    expect(getClassSpells("sorcerer").find((spell) => spell.name === "Banishment")?.level).toBe(7);
    const dictum = findSpellByName("Dictum");
    const holyWord = findSpellByName("Holy Word");
    if (!dictum || !holyWord) throw new Error("Missing alignment-word spell.");
    expect(dictum).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Evocation [Lawful, Sonic]",
    });
    expect(holyWord).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Evocation [Good, Sonic]",
    });
    expect([...banishments, dictum, holyWord].every((spell) =>
      getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Animate Plants, Blasphemy, Changestaff, and control spell rules", () => {
    const animatePlants = findSpellByName("Animate Plants");
    const blasphemy = findSpellByName("Blasphemy");
    const changestaff = findSpellByName("Changestaff");
    const controlUndead = findSpellByName("Control Undead");
    const controlWeather = findSpellByName("Control Weather");
    const spells = [animatePlants, blasphemy, changestaff, controlUndead, controlWeather];
    if (spells.some((spell) => !spell)) throw new Error("Missing PHB 7th-level spell.");
    expect(animatePlants).toMatchObject({
      level: 7,
      classes: ["druid"],
      school: "Transmutation",
      components: "V",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level or 1 hour/level; see text",
      savingThrow: "None",
    });
    expect(blasphemy).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Evocation [Evil, Sonic]",
    });
    expect(changestaff).toMatchObject({
      level: 7,
      classes: ["druid"],
      components: "V, S, F",
      castingTime: "1 round",
      duration: "1 hour/level (D)",
    });
    expect(controlUndead).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Necromancy",
      components: "V, S, M",
      duration: "1 min./level",
      savingThrow: "Will negates",
    });
    expect(controlWeather).toMatchObject({
      level: 7,
      classes: ["cleric", "druid", "sorcerer", "wizard"],
      school: "Transmutation",
      range: "2 miles",
      duration: "4d12 hours; see text",
    });
    expect(spells.every((spell) => spell && getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves the remaining audited PHB 7th-level spell rules", () => {
    const creepingDoom = findSpellByName("Creeping Doom");
    const etherealJaunt = findSpellByName("Ethereal Jaunt");
    const sequester = findSpellByName("Sequester");
    const transmuteMetalToWood = findSpellByName("Transmute Metal to Wood");
    const spells = [creepingDoom, etherealJaunt, sequester, transmuteMetalToWood];
    if (spells.some((spell) => !spell)) throw new Error("Missing PHB 7th-level spell.");
    expect(creepingDoom).toMatchObject({
      level: 7,
      classes: ["druid"],
      school: "Conjuration (Summoning)",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)/100 ft.; see text",
      duration: "1 min./level",
      savingThrow: "None",
    });
    expect(etherealJaunt).toMatchObject({
      level: 7,
      classes: ["cleric", "sorcerer", "wizard"],
      school: "Transmutation",
      range: "Personal",
      duration: "1 round/level (D)",
    });
    expect(sequester).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Abjuration",
      components: "V, S, M",
      range: "Touch",
      duration: "One day/level (D)",
      savingThrow: "None or Will negates (object)",
    });
    expect(transmuteMetalToWood).toMatchObject({
      level: 7,
      classes: ["druid"],
      school: "Transmutation",
      components: "V, S, DF",
      range: "Long (400 ft. + 40 ft./level)",
      savingThrow: "None",
    });
    expect(spells.every((spell) => spell && getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB alignment-aura protections, descriptors, and source", () => {
    const shieldOfLaw = findSpellByName("Shield of Law");
    const unholyAura = findSpellByName("Unholy Aura");
    if (!shieldOfLaw || !unholyAura) throw new Error("Missing alignment-aura spell.");
    expect(shieldOfLaw).toMatchObject({
      level: 8,
      classes: ["cleric"],
      description: "Wards one creature/level with +4 deflection AC, +4 resistance saves, and SR 25 against chaotic spells and spells cast by chaotic creatures; it blocks possession and mental influence. Chaotic creatures that hit a warded subject in melee are slowed (Will negates). Requires a 500 gp reliquary; spell resistance applies (harmless).",
      school: "Abjuration [Lawful]",
      components: "V, S, F",
    });
    expect(unholyAura).toMatchObject({
      level: 8,
      classes: ["cleric"],
      description: "Wards one creature/level with +4 deflection AC, +4 resistance saves, and SR 25 against good spells and spells cast by good creatures; it blocks possession and mental influence. Good creatures that hit a warded subject in melee take 1d6 temporary Strength damage (Fortitude negates). Requires a 500 gp reliquary; spell resistance applies (harmless).",
      school: "Abjuration [Evil]",
      components: "V, S, F",
    });
    expect(getSrdSpellSourceBook(shieldOfLaw)).toBe("Player's Handbook (3.5)");
    expect(getSrdSpellSourceBook(unholyAura)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Irresistible Dance effects, descriptors, and class levels", () => {
    const description = expect.stringContaining("Living touched target must dance in place for 1d4+1 rounds and cannot take other actions");
    const danceSpells = srdSpells.filter((spell) => spell.name === "Irresistible Dance");
    const danceVariants = danceSpells.map(({ level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow }) => ({
        level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow,
      }));
    expect(danceVariants).toEqual([
      {
        level: 6,
        classes: ["bard"],
        description,
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1d4+1 rounds",
        savingThrow: "None",
      },
      {
        level: 8,
        classes: ["sorcerer", "wizard"],
        description,
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1d4+1 rounds",
        savingThrow: "None",
      },
    ]);
    expect(danceSpells.every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
    expect(getClassSpells("bard").find((spell) => spell.name === "Irresistible Dance")?.level).toBe(6);
    expect(getClassSpells("sorcerer").find((spell) => spell.name === "Irresistible Dance")?.level).toBe(8);
    expect(getClassSpells("wizard").find((spell) => spell.name === "Irresistible Dance")?.level).toBe(8);
  });

  it("preserves PHB Maze's teleportation subschool and escape rules", () => {
    const maze = findSpellByName("Maze");
    if (!maze) throw new Error("Missing Maze spell.");
    expect(maze).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Banishes one creature into an extradimensional labyrinth of force. Each turn it can spend a full-round action to escape with a DC 20 Intelligence check; otherwise the maze ends after 10 minutes. It reappears at its former location or the nearest open space; teleportation within a plane cannot escape it, but plane shift can. Minotaurs are unaffected. Spell resistance applies.",
      school: "Conjuration (Teleportation)",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "See text",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(maze)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Mind Blank's protections and source", () => {
    const mindBlank = findSpellByName("Mind Blank");
    if (!mindBlank) throw new Error("Missing Mind Blank spell.");
    expect(mindBlank).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Protects one creature from devices and spells that detect, influence, or read emotions or thoughts, all mind-affecting effects, and divination-based information gathering. It foils limited wish, miracle, and wish used to affect the subject's mind or gain information about it. Area scrying still functions but does not detect the subject; targeted scrying fails. Spell resistance applies (harmless).",
      school: "Abjuration",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "24 hours",
      savingThrow: "Will negates (harmless)",
    });
    expect(getSrdSpellSourceBook(mindBlank)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Moment of Prescience's single-use bonus", () => {
    const spell = findSpellByName("Moment of Prescience");
    if (!spell) throw new Error("Missing Moment of Prescience spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Grants one use of an insight bonus equal to caster level (max +25) on one attack, opposed ability or skill check, or save, or as AC against one attack (even if flat-footed). Use is a no-action choice before the roll; the spell ends after use, and only one can be active on you.",
      school: "Divination",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "1 hour/level or until discharged",
      savingThrow: "",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Polar Ray's cold descriptor and damage cap", () => {
    const spell = findSpellByName("Polar Ray");
    if (!spell) throw new Error("Missing Polar Ray spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "A ray requires a ranged touch attack and deals 1d6 cold damage per caster level (maximum 25d6); spell resistance applies.",
      school: "Evocation [Cold]",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Instantaneous",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Polymorph Any Object's subschool and transformation limits", () => {
    const spell = findSpellByName("Polymorph Any Object");
    if (!spell) throw new Error("Missing Polymorph Any Object spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Changes one creature or nonmagical object (up to 100 cu. ft./level) into another form. Duration is based on additive similarity factors: same kingdom +5; same class, size, related forms, and same or lower Intelligence +2 each, ranging from 20 minutes to permanent. Unlike polymorph, it grants the new form's Intelligence and appropriate Wisdom or Charisma. It cannot affect magic items or create intrinsically valuable materials; spell resistance applies to objects.",
      school: "Transmutation (Polymorph)",
      components: "V, S, M/DF",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "See text",
      savingThrow: "Fortitude negates (object); see text",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Power Word Stun's descriptor and hit-point durations", () => {
    const spell = findSpellByName("Power Word Stun");
    if (!spell) throw new Error("Missing Power Word Stun spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Stuns one creature with 150 hp or less: 4d4 rounds at 50 hp or less, 2d4 rounds at 51–100 hp, or 1d4 rounds at 101–150 hp. Creatures with 151 or more hp are unaffected; there is no save, but spell resistance applies.",
      school: "Enchantment (Compulsion) [Mind-Affecting]",
      components: "V",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "See text",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Protection from Spells' bonus, gem requirements, and duration", () => {
    const spell = findSpellByName("Protection from Spells");
    if (!spell) throw new Error("Missing Protection from Spells spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Grants a +8 resistance bonus on saves against spells and spell-like abilities, not supernatural or extraordinary abilities. Affects up to one creature per four caster levels; each needs a 1,000 gp diamond focus and loses the protection if it loses the gem. Requires a 500 gp diamond component; spell resistance applies (harmless).",
      school: "Abjuration",
      components: "V, S, M, F",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "10 min./level",
      savingThrow: "Will negates (harmless)",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Repel Metal or Stone's earth descriptor and line effect", () => {
    const spell = findSpellByName("Repel Metal or Stone");
    if (!spell) throw new Error("Missing Repel Metal or Stone spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["druid"],
      description: "Sends a wave of repulsion down a 60-ft. line, pushing most metal and stone objects and creatures away at 40 ft./round; fixed objects over 3 in. in diameter and loose objects over 500 lb. are unaffected. Metal armor drags its wearer, and metal magic items are repelled. Antimagic blocks the effect.",
      school: "Abjuration [Earth]",
      components: "V, S",
      castingTime: "1 standard action",
      range: "60 ft.",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves both PHB Reverse Gravity class levels and effects", () => {
    const variants = srdSpells
      .filter((spell) => spell.name === "Reverse Gravity")
      .map(({ level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
        level, classes, school, components, castingTime, range, duration, savingThrow,
      }));
    expect(variants).toEqual([
      {
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Transmutation",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D)",
        savingThrow: "None; see text",
      },
      {
        level: 8,
        classes: ["druid"],
        school: "Transmutation",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D)",
        savingThrow: "None; see text",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Reverse Gravity")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Screen's glamer protections and source", () => {
    const spell = findSpellByName("Screen");
    if (!spell) throw new Error("Missing Screen spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Sets a 30-ft. cube/level area to appear and sound as you specify, hiding or altering what observers perceive. Scrying automatically detects the chosen image; direct observers may disbelieve if suspicious. Conditions are set at casting and cannot change; spell resistance does not apply.",
      school: "Illusion (Glamer)",
      components: "V, S",
      castingTime: "10 minutes",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "24 hours",
      savingThrow: "None or Will disbelief (if interacted with); see text",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves both PHB Greater Shout class levels and effects", () => {
    const description = expect.stringContaining("A 60-ft. cone deals 10d6 sonic damage, stuns 1 round and deafens 4d6 rounds");
    const variants = srdSpells
      .filter((spell) => spell.name === "Shout, Greater")
      .map(({ level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow }) => ({
        level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow,
      }));
    expect(variants).toEqual([
      {
        level: 6,
        classes: ["bard"],
        description,
        school: "Evocation [Sonic]",
        components: "V, S, F",
        castingTime: "1 standard action",
        range: "60 ft.",
        duration: "Instantaneous",
        savingThrow: "Fortitude partial or Reflex negates (object); see text",
      },
      {
        level: 8,
        classes: ["sorcerer", "wizard"],
        description,
        school: "Evocation [Sonic]",
        components: "V, S, F",
        castingTime: "1 standard action",
        range: "60 ft.",
        duration: "Instantaneous",
        savingThrow: "Fortitude partial or Reflex negates (object); see text",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Shout, Greater")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("completes PHB Summon Monster VIII metadata and summon options", () => {
    const spell = findSpellByName("Summon Monster VIII");
    if (!spell) throw new Error("Missing Summon Monster VIII spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Summons one creature from the 8th-level list, 1d3 of the same kind from the 7th-level list, or 1d4+1 of the same kind from a lower list; no two are more than 30 ft. apart. Creatures serve for 1 round/level; spell resistance does not apply.",
      school: "Conjuration (Summoning)",
      components: "V, S, F/DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Sunburst's light descriptor and undead effects", () => {
    const spell = findSpellByName("Sunburst");
    if (!spell) throw new Error("Missing Sunburst spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["druid", "sorcerer", "wizard"],
      description: "An 80-ft.-radius burst blinds creatures and deals 6d6 damage; sunlight-vulnerable creatures take double damage. A Reflex save negates blindness and halves damage. Undead take 1d6/level (max 25d6), and undead harmed by bright light are destroyed if they fail the save; fungi, mold, oozes, and slimes take the same damage. Dispels darkness spells below 9th level; spell resistance applies.",
      school: "Evocation [Light]",
      components: "V, S, M/DF",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "Instantaneous",
      savingThrow: "Reflex partial; see text",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Temporal Stasis effects and material cost", () => {
    const spell = findSpellByName("Temporal Stasis");
    if (!spell) throw new Error("Missing Temporal Stasis spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "On a successful melee touch attack, places a creature in suspended animation: time and bodily functions effectively cease, it does not age or take harm, and the state lasts until removed by magic such as dispel magic or freedom. Requires gem dust worth 5,000 gp; spell resistance applies.",
      school: "Transmutation",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "Permanent",
      savingThrow: "Fortitude negates",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Trap the Soul's two trapping methods", () => {
    const spell = findSpellByName("Trap the Soul");
    if (!spell) throw new Error("Missing Trap the Soul spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Traps a creature's life force and body in a gem until it is broken, allowing the body to reform; a powerful freed extraplanar creature may be required to serve. The spell-completion version allows spell resistance and a Will save, but speaking the creature's name ignores spell resistance and raises the save DC by 2; a successful save or spell resistance shatters the gem. The trigger-object version automatically traps the named creature when it accepts an object inscribed with its name and the trigger word.",
      school: "Conjuration (Summoning)",
      components: "V, S, M, (F); see text",
      castingTime: "1 standard action or see text",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Permanent; see text",
      savingThrow: "See text",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Scintillating Pattern's HD-based effects", () => {
    const spell = findSpellByName("Scintillating Pattern");
    if (!spell) throw new Error("Missing Scintillating Pattern spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Fills a 20-ft.-radius spread with shifting colors that affect up to caster level HD (max 20), lowest HD first: 6 HD or less become unconscious for 1d4 rounds, then stunned for 1d4, then confused for 1d4; 7–12 HD are stunned for 1d4 then confused for 1d4; 13+ HD are confused for 1d4. Sightless creatures are unaffected; spell resistance applies.",
      school: "Illusion (Pattern) [Mind-Affecting]",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Concentration + 2 rounds",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves both PHB Sympathy class levels and compulsion effects", () => {
    const description = "Makes an object or location (up to 10-ft. cube/level) irresistibly attractive to a specifically named intelligent creature kind or alignment. A successful save releases a creature temporarily, but it must save again after 1d6 times 10 minutes; failure makes it return. Counters and dispels antipathy; requires crushed pearls worth 1,500 gp and honey. Spell resistance applies.";
    const variants = srdSpells
      .filter((spell) => spell.name === "Sympathy")
      .map(({ level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow }) => ({
        level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow,
      }));
    expect(variants).toEqual([
      {
        level: 8,
        classes: ["sorcerer", "wizard"],
        description,
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "2 hours/level (D)",
        savingThrow: "Will negates; see text",
      },
      {
        level: 9,
        classes: ["druid"],
        description,
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "2 hours/level (D)",
        savingThrow: "Will negates; see text",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Sympathy")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("completes PHB Summon Nature's Ally VIII summon details", () => {
    const spell = findSpellByName("Summon Nature's Ally VIII");
    if (!spell) throw new Error("Missing Summon Nature's Ally VIII spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["druid"],
      description: "Summons one 8th-level creature, 1d3 7th-level creatures of the same kind, or 1d4+1 lower-level creatures of the same kind; no two are more than 30 ft. apart. Spell resistance does not apply; the spell gains the descriptor matching the summoned creature's alignment or element.",
      school: "Conjuration (Summoning)",
      components: "V, S, DF",
      castingTime: "1 round",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Whirlwind's air descriptor and creature effects", () => {
    const spell = findSpellByName("Whirlwind");
    if (!spell) throw new Error("Missing Whirlwind spell.");
    expect(spell).toMatchObject({
      level: 8,
      classes: ["druid"],
      description: "Creates a 10-ft.-wide base, 30-ft.-wide and 30-ft.-tall cyclone that moves 60 ft./round through air, over land, or water; you can direct it as a standard action. Large or smaller creatures contacting it take 3d6 damage on a failed Reflex save; a Medium or smaller creature that fails must save again or be lifted, taking 1d8 each round without further saves. Spell resistance applies.",
      school: "Evocation [Air]",
      components: "V, S, DF",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "1 round/level (D)",
      savingThrow: "Reflex negates; see text",
    });
    expect(getSrdSpellSourceBook(spell)).toBe("Player's Handbook (3.5)");
  });

  it("preserves both PHB Word of Recall class levels and sanctuary transport", () => {
    const description = expect.stringContaining("very familiar sanctuary chosen when preparing");
    const variants = srdSpells
      .filter((spell) => spell.name === "Word of Recall")
      .map(({ level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow }) => ({
        level, classes, description: spellDescription, school, components, castingTime, range, duration, savingThrow,
      }));
    expect(variants).toEqual([
      {
        level: 6,
        classes: ["cleric"],
        description,
        school: "Conjuration (Teleportation)",
        components: "V",
        castingTime: "1 standard action",
        range: "Unlimited",
        duration: "Instantaneous",
        savingThrow: "None or Will negates (harmless, object)",
      },
      {
        level: 8,
        classes: ["druid"],
        description,
        school: "Conjuration (Teleportation)",
        components: "V",
        castingTime: "1 standard action",
        range: "Unlimited",
        duration: "Instantaneous",
        savingThrow: "None or Will negates (harmless, object)",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Word of Recall")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("limits PHB wizard-only spells to wizards", () => {
    for (const name of ["Mnemonic Enhancer", "Mage’s Lucubration"]) {
      const spell = srdSpells.find((candidate) => candidate.name === name);
      if (!spell) throw new Error(`Missing ${name} spell.`);
      expect(spell.classes).toEqual(["wizard"]);
      expect(spell.description).toMatch(/Wizard[ -]only/i);
    }
  });

  it("includes Leomund’s Trap on the PHB Sorcerer/Wizard list", () => {
    expect(findSpellByName("Leomund’s Trap")).toMatchObject({
      name: "Leomund’s Trap",
      level: 2,
      classes: ["sorcerer", "wizard"],
      school: "Illusion (Glamer)",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "Permanent (D)",
      savingThrow: "None",
    });
  });

  it("preserves the PHB Bless Water descriptor and casting details", () => {
    expect(findSpellByName("Bless Water")).toMatchObject({
      level: 1,
      classes: ["cleric", "paladin"],
      description: "Makes holy water.",
      school: "Transmutation [Good]",
      components: "V, S, M",
      castingTime: "1 minute",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates (object)",
    });
  });

  it("preserves the PHB Curse Water descriptor and casting details", () => {
    expect(findSpellByName("Curse Water")).toMatchObject({
      level: 1,
      classes: ["cleric"],
      description: "Makes unholy water.",
      school: "Necromancy [Evil]",
      components: "V, S, M",
      castingTime: "1 minute",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates (object)",
    });
  });

  it("preserves PHB Identify access and item-identification details", () => {
    expect(findSpellByName("Identify")).toMatchObject({
      level: 1,
      classes: ["bard", "sorcerer", "wizard"],
      description: "Determines all magic properties of one magic item, including activation and remaining charges.",
      school: "Divination",
      components: "V, S, M/DF",
      castingTime: "1 hour",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves PHB Augury access and its immediate-future reading", () => {
    expect(findSpellByName("Augury")).toMatchObject({
      level: 2,
      classes: ["cleric"],
      description: expect.stringContaining("both or neither within about 30 minutes"),
      school: "Divination",
      components: "V, S, M, F",
      castingTime: "1 minute",
      range: "Personal",
      duration: "Instantaneous",
    });
  });

  it("preserves both PHB Animate Dead class levels and its evil descriptor", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Animate Dead")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 3,
        classes: ["cleric"],
        description: expect.stringContaining("as skeletons or zombies obeying spoken commands"),
        school: "Necromancy [Evil]",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        level: 4,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("as skeletons or zombies obeying spoken commands"),
        school: "Necromancy [Evil]",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "None",
      },
    ]);
  });

  it("preserves PHB Shield Other effects and class access", () => {
    expect(findSpellByName("Shield Other")).toMatchObject({
      level: 2,
      classes: ["cleric", "paladin"],
      description: expect.stringContaining("+1 deflection AC and +1 resistance on saves"),
      school: "Abjuration",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 hour/level (D)",
      savingThrow: "Will negates (harmless)",
    });
  });

  it("preserves PHB Illusory Script subschool and class access", () => {
    expect(findSpellByName("Illusory Script")).toMatchObject({
      level: 3,
      classes: ["bard", "sorcerer", "wizard"],
      description: expect.stringContaining("Only designated readers understand writing"),
      school: "Illusion (Phantasm) [Mind-Affecting]",
      components: "V, S, M",
      castingTime: "1 minute or longer; see text",
      range: "Touch",
      duration: "One day/level (D)",
      savingThrow: "Will negates; see text",
    });
  });

  it("preserves the PHB Sepia Snake Sigil force descriptor and effect", () => {
    expect(findSpellByName("Sepia Snake Sigil")).toMatchObject({
      level: 3,
      classes: ["bard", "sorcerer", "wizard"],
      description: expect.stringContaining("Reflex negates, otherwise suspended animation"),
      school: "Conjuration (Creation) [Force]",
      components: "V, S, M",
      castingTime: "10 minutes",
      range: "Touch",
      duration: "Permanent or until discharged; until released or 1d4 days + one day/level; see text",
      savingThrow: "Reflex negates",
    });
  });

  it("preserves PHB Divination timing and Cleric access", () => {
    expect(findSpellByName("Divination")).toMatchObject({
      level: 4,
      classes: ["cleric"],
      description: expect.stringContaining("Accuracy is 70% +1% per caster level (maximum 90%)"),
      school: "Divination",
      components: "V, S, M",
      castingTime: "10 minutes",
      range: "Personal",
      duration: "Instantaneous",
    });
  });

  it("completes Restoration metadata inherited from Lesser Restoration", () => {
    expect(findSpellByName("Restoration")).toMatchObject({
      level: 4,
      classes: ["cleric", "paladin"],
      description: expect.stringContaining("Restore one drained experience level only within one day per caster level"),
      school: "Conjuration (Healing)",
      components: "V, S, M",
      castingTime: "3 rounds",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates (harmless)",
    });
  });

  it("preserves PHB Legend Lore class levels without mixing in Knowledge domain access", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Legend Lore")
        .map(({ level, classes, description, school, components, castingTime, range, duration }) => ({
          level, classes, description, school, components, castingTime, range, duration,
        })),
    ).toEqual([
      {
        level: 4,
        classes: ["bard"],
        description: expect.stringContaining("Gain DM-provided legends only about a legendary person"),
        school: "Divination",
        components: "V, S, M, F",
        castingTime: "See text",
        range: "Personal",
        duration: "See text",
      },
      {
        level: 6,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("Gain DM-provided legends only about a legendary person"),
        school: "Divination",
        components: "V, S, M, F",
        castingTime: "See text",
        range: "Personal",
        duration: "See text",
      },
    ]);
  });

  it("preserves both PHB Stoneskin class levels and its damage-reduction limit", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Stoneskin")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 4,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("preventing 10 damage per caster level (maximum 150)"),
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "10 min./level or until discharged",
        savingThrow: "Will negates (harmless)",
      },
      {
        level: 5,
        classes: ["druid"],
        description: expect.stringContaining("preventing 10 damage per caster level (maximum 150)"),
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "10 min./level or until discharged",
        savingThrow: "Will negates (harmless)",
      },
    ]);
  });

  it("preserves PHB Awaken's XP cost and casting details", () => {
    expect(findSpellByName("Awaken")).toMatchObject({
      level: 5,
      classes: ["druid"],
      description: expect.stringContaining("Costs 250 XP"),
      school: "Transmutation",
      components: "V, S, DF, XP",
      castingTime: "24 hours",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates",
    });
  });

  it("preserves Atonement's PHB class access and component details", () => {
    expect(findSpellByName("Atonement")).toMatchObject({
      level: 5,
      classes: ["cleric", "druid"],
      description: expect.stringContaining("A truly repentant living creature"),
      school: "Abjuration",
      components: "V, S, M, F, DF, XP",
      castingTime: "1 hour",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves Commune's PHB XP cost and question limit", () => {
    expect(findSpellByName("Commune")).toMatchObject({
      level: 5,
      classes: ["cleric"],
      description: expect.stringContaining("one yes/no question per caster level"),
      school: "Divination",
      components: "V, S, M, DF, XP",
      castingTime: "10 minutes",
      range: "Personal",
      duration: "1 round/level",
    });
  });

  it("preserves False Vision's PHB glamer school and class access", () => {
    expect(findSpellByName("False Vision")).toMatchObject({
      level: 5,
      classes: ["bard", "sorcerer", "wizard"],
      description: expect.stringContaining("Scrying into a 40-ft.-radius emanation"),
      school: "Illusion (Glamer)",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "1 hour/level (D)",
      savingThrow: "None",
    });
  });

  it("preserves Hallow and Unhallow PHB alignment descriptors and access", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Hallow" || spell.name === "Unhallow")
        .map(({ name, level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Hallow",
        level: 5,
        classes: ["cleric", "druid"],
        description: expect.stringContaining("Consecrate a 40-ft.-radius site with Magic Circle against Evil"),
        school: "Evocation [Good]",
        components: "V, S, M, DF",
        castingTime: "24 hours",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "See text",
      },
      {
        name: "Unhallow",
        level: 5,
        classes: ["cleric", "druid"],
        description: expect.stringContaining("Desecrate a 40-ft.-radius site with Magic Circle against Good"),
        school: "Evocation [Evil]",
        components: "V, S, M",
        castingTime: "24 hours",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "See text",
      },
    ]);
  });

  it("preserves Magic Jar's PHB focus, level, and possession effect", () => {
    expect(findSpellByName("Magic Jar")).toMatchObject({
      level: 5,
      classes: ["sorcerer", "wizard"],
      description: expect.stringContaining("A full-round possession attempt allows Will and spell resistance"),
      school: "Necromancy",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 hour/level or until you return to your body",
      savingThrow: "Will negates; see text",
    });
  });

  it("preserves all PHB True Seeing levels and class access", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "True Seeing")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 5,
        classes: ["cleric"],
        description: expect.stringContaining("For 120 ft., see through darkness, invisibility, Blur/Displacement, illusions and transformations"),
        school: "Divination",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 min./level",
        savingThrow: "Will negates (harmless)",
      },
      {
        level: 6,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("For 120 ft., see through darkness, invisibility, Blur/Displacement, illusions and transformations"),
        school: "Divination",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 min./level",
        savingThrow: "Will negates (harmless)",
      },
      {
        level: 7,
        classes: ["druid"],
        description: expect.stringContaining("For 120 ft., see through darkness, invisibility, Blur/Displacement, illusions and transformations"),
        school: "Divination",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 min./level",
        savingThrow: "Will negates (harmless)",
      },
    ]);
  });

  it("preserves Analyze Dweomer's PHB focus, level, and spell details", () => {
    expect(findSpellByName("Analyze Dweomer")).toMatchObject({
      level: 6,
      classes: ["bard", "sorcerer", "wizard"],
      description: expect.stringContaining("Examine one visible object or creature each round as a free action"),
      school: "Divination",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None or Will negates; see text",
    });
  });

  it("preserves Circle of Death's PHB death descriptor and limits", () => {
    expect(findSpellByName("Circle of Death")).toMatchObject({
      level: 6,
      classes: ["sorcerer", "wizard"],
      description: expect.stringContaining("creatures of 9+ HD are immune"),
      school: "Necromancy [Death]",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "Instantaneous",
      savingThrow: "Fortitude negates",
    });
  });

  it("preserves Contingency's PHB focus, casting time, and trigger effect", () => {
    expect(findSpellByName("Contingency")).toMatchObject({
      level: 6,
      classes: ["sorcerer", "wizard"],
      description: expect.stringContaining("Simultaneously casts a companion spell affecting your person"),
      school: "Evocation",
      components: "V, S, M, F",
      castingTime: "At least 10 minutes; see text",
      range: "Personal",
      duration: "One day/level (D) or until discharged",
    });
  });

  it("preserves Forbiddance's PHB area defense and damage details", () => {
    expect(findSpellByName("Forbiddance")).toMatchObject({
      level: 6,
      classes: ["cleric"],
      description: expect.stringContaining("one alignment axis take 6d6 damage, both axes 12d6"),
      school: "Abjuration",
      components: "V, S, M, DF",
      castingTime: "6 rounds",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "Permanent",
      savingThrow: "See text",
    });
  });

  it("completes the PHB Planar Ally family with inherited fields and XP costs", () => {
    expect(
      srdSpells
        .filter((spell) => ["Planar Ally, Lesser", "Planar Ally", "Planar Ally, Greater"].includes(spell.name))
        .map(({ name, level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Planar Ally, Lesser",
        level: 4,
        classes: ["cleric"],
        description: expect.stringContaining("Costs 100 XP plus negotiated payment"),
        school: "Conjuration (Calling) [see text]",
        components: "V, S, DF, XP",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Planar Ally",
        level: 6,
        classes: ["cleric"],
        description: expect.stringContaining("Costs 250 XP"),
        school: "Conjuration (Calling) [see text]",
        components: "V, S, DF, XP",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Planar Ally, Greater",
        level: 8,
        classes: ["cleric"],
        description: "Calls one elemental or outsider up to 18 HD, or up to three of the same kind totaling 18 HD, no two more than 30 ft. apart; they agree to help and request payment together (500 XP).",
        school: "Conjuration (Calling)",
        components: "V, S, DF, XP",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
    ]);
  });

  it("preserves Destruction's PHB death descriptor and saving-throw effect", () => {
    expect(findSpellByName("Destruction")).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Necromancy [Death]",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Instantaneous",
      savingThrow: "Fortitude partial",
    });
  });

  it("preserves Forcecage's PHB force descriptor and options", () => {
    expect(findSpellByName("Forcecage")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Evocation [Force]",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "2 hours/level (D)",
      savingThrow: "None",
    });
  });

  it("preserves Instant Summons' PHB school and sapphire component detail", () => {
    expect(findSpellByName("Instant Summons")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Conjuration (Summoning)",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "See text",
      duration: "Permanent until discharged",
      savingThrow: "None",
    });
  });

  it("preserves Limited Wish's PHB effect limits and XP cost", () => {
    expect(findSpellByName("Limited Wish")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Universal",
      components: "V, S, XP",
      castingTime: "1 standard action",
      range: "See text",
      duration: "See text",
      savingThrow: "None; see text",
    });
  });

  it("preserves Mage's Magnificent Mansion's PHB subschool and capacity", () => {
    expect(findSpellByName("Mage’s Magnificent Mansion")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Conjuration (Creation)",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "2 hours/level (D)",
      savingThrow: "None",
    });
  });

  it("preserves Mage's Sword's PHB force descriptor and attack effect", () => {
    expect(findSpellByName("Mage’s Sword")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Evocation [Force]",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 round/level (D)",
      savingThrow: "None",
    });
  });

  it("preserves Phase Door's PHB subschool and passage effect", () => {
    expect(findSpellByName("Phase Door")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Conjuration (Creation)",
      components: "V",
      castingTime: "1 standard action",
      range: "0 ft.",
      duration: "One usage/two levels",
      savingThrow: "None",
    });
  });

  it("preserves Plane Shift's PHB subschool and class-specific levels", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Plane Shift")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 5,
        classes: ["cleric"],
        description: expect.stringContaining("Transport one touched creature or up to eight willing creatures joining hands"),
        school: "Conjuration (Teleportation)",
        components: "V, S, F",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "Will negates",
      },
      {
        level: 7,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("Transport one touched creature or up to eight willing creatures joining hands"),
        school: "Conjuration (Teleportation)",
        components: "V, S, F",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "Will negates",
      },
    ]);
  });

  it("preserves Power Word Blind's PHB descriptors and hit-point duration rule", () => {
    expect(findSpellByName("Power Word Blind")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Enchantment (Compulsion) [Mind-Affecting]",
      components: "V",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "See text",
      savingThrow: "None",
    });
  });

  it("preserves Prismatic Spray's PHB beam and blindness effects", () => {
    expect(findSpellByName("Prismatic Spray")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Evocation",
      components: "V, S",
      castingTime: "1 standard action",
      range: "60 ft.",
      duration: "Instantaneous",
      savingThrow: "See text",
    });
  });

  it("preserves Refuge's PHB school and class-specific levels", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Refuge")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 7,
        classes: ["cleric"],
        school: "Conjuration (Teleportation)",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Permanent until discharged",
        savingThrow: "None",
      },
      {
        level: 9,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Teleportation)",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Permanent until discharged",
        savingThrow: "None",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Refuge")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves Regenerate's PHB subschool, casting time, effects, and levels", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Regenerate")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 7,
        classes: ["cleric"],
        school: "Conjuration (Healing)",
        components: "V, S, DF",
        castingTime: "3 rounds",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "Fortitude negates (harmless)",
      },
      {
        level: 9,
        classes: ["druid"],
        school: "Conjuration (Healing)",
        components: "V, S, DF",
        castingTime: "3 rounds",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "Fortitude negates (harmless)",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Regenerate")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves Greater Restoration's PHB subschool and XP cost", () => {
    expect(findSpellByName("Restoration, Greater")).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Conjuration (Healing)",
      components: "V, S, XP",
      castingTime: "10 minutes",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates (harmless)",
    });
  });

  it("preserves Resurrection's PHB inherited components and casting details", () => {
    expect(findSpellByName("Resurrection")).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Conjuration (Healing)",
      components: "V, S, M, DF",
      castingTime: "10 minutes",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "None; see text",
    });
  });

  it("preserves Simulacrum's PHB subschool and creation costs", () => {
    expect(findSpellByName("Simulacrum")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Illusion (Shadow)",
      components: "V, S, M, XP",
      castingTime: "12 hours",
      range: "0 ft.",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves Spell Turning's PHB target restriction and turning capacity", () => {
    expect(findSpellByName("Spell Turning")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Abjuration",
      components: "V, S, M/DF",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "Until expended or 10 min./level",
      savingThrow: "",
    });
  });

  it("preserves Statue's PHB hardness and transformation details", () => {
    expect(findSpellByName("Statue")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Transmutation",
      components: "V, S, M",
      castingTime: "1 round",
      range: "Touch",
      duration: "1 hour/level (D)",
      savingThrow: "Will negates (harmless)",
    });
  });

  it("preserves Sunbeam's PHB light descriptor and beam effects", () => {
    expect(findSpellByName("Sunbeam")).toMatchObject({
      level: 7,
      classes: ["druid"],
      school: "Evocation [Light]",
      components: "V, S, DF",
      castingTime: "1 standard action",
      range: "60 ft.",
      duration: "1 round/level or until all beams are exhausted",
      savingThrow: "Reflex negates and Reflex half; see text",
    });
  });

  it("preserves Symbol spells' PHB schools, inherited fields, and effects", () => {
    expect(
      srdSpells
        .filter((spell) => ["Symbol of Stunning", "Symbol of Weakness", "Symbol of Death", "Symbol of Insanity"].includes(spell.name))
        .map(({ name, level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Symbol of Stunning",
        level: 7,
        classes: ["cleric", "sorcerer", "wizard"],
        description: expect.stringContaining("150-hp activation budget"),
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "0 ft.; see text",
        duration: "See text",
        savingThrow: "Will negates",
      },
      {
        name: "Symbol of Weakness",
        level: 7,
        classes: ["cleric", "sorcerer", "wizard"],
        description: expect.stringContaining("no hp limit"),
        school: "Necromancy",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "0 ft.; see text",
        duration: "See text",
        savingThrow: "Fortitude negates",
      },
      {
        name: "Symbol of Death",
        level: 8,
        classes: ["cleric", "sorcerer", "wizard"],
        description: "When triggered, kills creatures within 60 ft. whose combined current hp do not exceed 150. Its material component is mercury and phosphorus, plus powdered diamond and opal worth at least 5,000 gp.",
        school: "Necromancy [Death]",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "0 ft.; see text",
        duration: "See text",
        savingThrow: "Fortitude negates",
      },
      {
        name: "Symbol of Insanity",
        level: 8,
        classes: ["cleric", "sorcerer", "wizard"],
        description: "When triggered, makes creatures within 60 ft. permanently insane (as the insanity spell), with no hit point limit; remains active for 10 min./level. Requires mercury, phosphorus, and powdered diamond and opal worth 5,000 gp; spell resistance applies.",
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "0 ft.; see text",
        duration: "See text",
        savingThrow: "Will negates",
      },
    ]);
    const symbolOfInsanity = findSpellByName("Symbol of Insanity");
    if (!symbolOfInsanity) throw new Error("Missing Symbol of Insanity spell.");
    expect(getSrdSpellSourceBook(symbolOfInsanity)).toBe("Player's Handbook (3.5)");
  });

  it("preserves Vision's PHB effect, XP cost, and inherited casting fields", () => {
    expect(findSpellByName("Vision")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Divination",
      components: "V, S, M, XP",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "See text",
      savingThrow: "",
    });
  });

  it("preserves Waves of Exhaustion's PHB area effect and save", () => {
    expect(findSpellByName("Waves of Exhaustion")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Necromancy",
      components: "V, S",
      castingTime: "1 standard action",
      range: "60 ft.",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves Wind Walk's PHB air descriptor and class-specific levels", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Wind Walk")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 6,
        classes: ["cleric"],
        description: expect.stringContaining("600 ft./round (60 mph, poor)"),
        school: "Transmutation [Air]",
        components: "V, S, DF",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 hour/level (D); see text",
        savingThrow: "None and Will negates (harmless)",
      },
      {
        level: 7,
        classes: ["druid"],
        description: expect.stringContaining("600 ft./round (60 mph, poor)"),
        school: "Transmutation [Air]",
        components: "V, S, DF",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 hour/level (D); see text",
        savingThrow: "None and Will negates (harmless)",
      },
    ]);
  });

  it("preserves Word of Chaos's PHB descriptors and HD-based effects", () => {
    expect(findSpellByName("Word of Chaos")).toMatchObject({
      level: 7,
      classes: ["cleric"],
      school: "Evocation [Chaotic, Sonic]",
      components: "V",
      castingTime: "1 standard action",
      range: "40 ft.",
      duration: "Instantaneous",
      savingThrow: "None or Will negates; see text",
    });
  });

  it("preserves Animal Shapes' PHB polymorph details", () => {
    expect(findSpellByName("Animal Shapes")).toMatchObject({
      level: 8,
      classes: ["druid"],
      description: "Transforms up to one willing creature/level within 30 ft. of each other into animals; each form is limited to the lower of the subject’s HD or caster level (max 20 HD) and uses alternate form, not the polymorph subschool.",
      school: "Transmutation (Polymorph)",
      components: "V, S, DF",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 hour/level (D)",
      savingThrow: "None; see text",
    });
  });

  it("preserves Antimagic Field's PHB class levels and suppressive effects", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Antimagic Field")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 6,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("suppresses, not dispels"),
        school: "Abjuration",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "10 ft.",
        duration: "10 min./level (D)",
        savingThrow: "None",
      },
      {
        level: 8,
        classes: ["cleric"],
        description: expect.stringContaining("suppresses, not dispels"),
        school: "Abjuration",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "10 ft.",
        duration: "10 min./level (D)",
        savingThrow: "None",
      },
    ]);
  });

  it("preserves Antipathy's PHB descriptors, class levels, and save effect", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Antipathy")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 8,
        classes: ["sorcerer", "wizard"],
        description: "Repels a specifically named kind of intelligent creature or alignment from one object or location (up to a 10-ft. cube/level); a successful Will save permits approach but causes discomfort and -4 Dex. The creature kind must be specific (a subtype is insufficient). Counters and dispels Sympathy; requires alum soaked in vinegar. Spell resistance applies.",
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M/DF",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "2 hours/level (D)",
        savingThrow: "Will partial",
      },
      {
        level: 9,
        classes: ["druid"],
        description: "Repels a specifically named kind of intelligent creature or alignment from one object or location (up to a 10-ft. cube/level); a successful Will save permits approach but causes discomfort and -4 Dex. The creature kind must be specific (a subtype is insufficient). Counters and dispels Sympathy; requires alum soaked in vinegar. Spell resistance applies.",
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M/DF",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "2 hours/level (D)",
        savingThrow: "Will partial",
      },
    ]);
    expect(srdSpells.filter((spell) => spell.name === "Antipathy")
      .every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves Binding's PHB descriptors and variable save and duration rules", () => {
    expect(findSpellByName("Binding")).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Restrains one living creature by a chosen binding method; the initial Will save is allowed only if its HD are at least half your caster level. Up to six assistants can raise your caster level: suggestion adds 1 per assistant, while a target-appropriate dominate animal, dominate person, or dominate monster adds one-third of that assistant's level. A DM-approved, observable release trigger raises the save DC by 2; every version is dismissible.",
      school: "Enchantment (Compulsion) [Mind-Affecting]",
      components: "V, S, M",
      castingTime: "One minute",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "See text (D)",
      savingThrow: "Will negates; see text",
    });
  });

  it("preserves Clenched Fist's PHB force effects and inherited spell fields", () => {
    expect(findSpellByName("Clenched Fist")).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "A Large force hand can interpose, bull rush at +15, or move up to 60 ft. and attack once per round with an attack bonus of caster level + your relevant spellcasting ability modifier +10, dealing 1d8+11 damage; a hit forces a Fortitude save or stuns for 1 round. It detects or attacks invisible and concealed creatures no better than you do.",
      school: "Evocation [Force]",
      components: "V, S, F/DF",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 round/level (D)",
      savingThrow: "Fortitude negates; see text",
    });
  });

  it("preserves Cloak of Chaos's PHB descriptor and protective effects", () => {
    expect(findSpellByName("Cloak of Chaos")).toMatchObject({
      level: 8,
      classes: ["cleric"],
      description: "Wards one creature/level in a 20-ft.-radius burst with +4 deflection AC, +4 resistance saves, SR 25 against lawful spells and lawful casters, and protection from possession and mental influence; lawful melee attackers become confused for 1 round (Will negates). Its reliquary focus costs at least 500 gp.",
      school: "Abjuration [Chaotic]",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "20 ft.",
      duration: "1 round/level (D)",
      savingThrow: "See text",
    });
  });

  it("preserves Clone's PHB creation and soul-transfer details", () => {
    expect(findSpellByName("Clone")).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Requires at least 1 cubic inch of flesh taken from the living original (not hair, nails, or scales); a duplicate grows in a laboratory for 2d4 months. If the original is dead, its free, willing soul transfers when the clone is complete; cloning fails if it died of natural causes. Treat the clone as raised from the dead, with the corresponding level or Constitution loss. It has no equipment; the lab costs 1,000 gp and the focus 500 gp.",
      school: "Necromancy",
      components: "V, S, M, F",
      castingTime: "10 minutes",
      range: "0 ft.",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves Control Plants' PHB target limits and command restrictions", () => {
    expect(findSpellByName("Control Plants")).toMatchObject({
      level: 8,
      classes: ["druid"],
      description: "Controls up to 2 HD/level of plant creatures, no two more than 30 ft. apart; they understand your spoken commands regardless of language, ignore suicidal or self-destructive orders, and revert when the spell ends.",
      school: "Transmutation",
      components: "V, S, DF",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "1 min./level",
      savingThrow: "Will negates",
    });
  });

  it("preserves Create Undead's PHB requirements and inherited fields for its greater variant", () => {
    expect(
      srdSpells
        .filter((spell) => ["Create Undead", "Create Greater Undead"].includes(spell.name))
        .map(({ name, level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Create Undead",
        level: 6,
        classes: ["cleric", "sorcerer", "wizard"],
        description: expect.stringContaining("Not automatically controlled"),
        school: "Necromancy [Evil]",
        components: "V, S, M",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Create Greater Undead",
        level: 8,
        classes: ["cleric", "sorcerer", "wizard"],
        description: "At night, turns one corpse into a shadow (CL 15 or lower), wraith (16–17), spectre (18–19), or devourer (20+); weaker forms may be chosen but are not automatically controlled. Inherits Create Undead’s 1-hour casting and material components, including black onyx worth 50 gp/HD.",
        school: "Necromancy [Evil]",
        components: "V, S, M",
        castingTime: "1 hour",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
    ]);
  });

  it("preserves PHB metadata and healing caps across mass cure spells", () => {
    const massCureSpells = srdSpells.filter(
      (spell) => spell.name.startsWith("Cure ") && spell.name.endsWith("Wounds, Mass"),
    );
    expect(
      massCureSpells.map(({ name, level, classes, school, description }) => ({
        name, level, classes, school, description,
      })),
    ).toEqual([
      {
        name: "Cure Light Wounds, Mass",
        level: 5,
        classes: ["bard", "cleric"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("1d8 hp + caster level (maximum +25)"),
      },
      {
        name: "Cure Light Wounds, Mass",
        level: 6,
        classes: ["druid"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("1d8 hp + caster level (maximum +25)"),
      },
      {
        name: "Cure Moderate Wounds, Mass",
        level: 6,
        classes: ["bard", "cleric"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("2d8 +1 per caster level (maximum +30)"),
      },
      {
        name: "Cure Moderate Wounds, Mass",
        level: 7,
        classes: ["druid"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("2d8 +1 per caster level (maximum +30)"),
      },
      {
        name: "Cure Serious Wounds, Mass",
        level: 7,
        classes: ["cleric"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("maximum +35"),
      },
      {
        name: "Cure Critical Wounds, Mass",
        level: 8,
        classes: ["cleric"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("max +40"),
      },
      {
        name: "Cure Serious Wounds, Mass",
        level: 8,
        classes: ["druid"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("maximum +35"),
      },
      {
        name: "Cure Critical Wounds, Mass",
        level: 9,
        classes: ["druid"],
        school: "Conjuration (Healing)",
        description: expect.stringContaining("max +40"),
      },
    ]);
    for (const spell of massCureSpells) {
      expect(spell).toMatchObject({
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "Will half (harmless) or Will half; see text",
      });
    }
  });

  it("preserves PHB metadata and damage caps across mass inflict spells", () => {
    const massInflictSpells = srdSpells.filter(
      (spell) => spell.name.startsWith("Inflict ") && spell.name.endsWith("Wounds, Mass"),
    );
    expect(
      massInflictSpells.map(({ name, level, classes, description, school }) => ({
        name, level, classes, description, school,
      })),
    ).toEqual([
      {
        name: "Inflict Light Wounds, Mass",
        level: 5,
        classes: ["cleric"],
        description: expect.stringContaining("1d8 damage + caster level (maximum +25)"),
        school: "Necromancy",
      },
      {
        name: "Inflict Moderate Wounds, Mass",
        level: 6,
        classes: ["cleric"],
        description: expect.stringContaining("2d8 +1 per caster level (maximum +30)"),
        school: "Necromancy",
      },
      {
        name: "Inflict Serious Wounds, Mass",
        level: 7,
        classes: ["cleric"],
        description: expect.stringContaining("maximum +35"),
        school: "Necromancy",
      },
      {
        name: "Inflict Critical Wounds, Mass",
        level: 8,
        classes: ["cleric"],
        description: expect.stringContaining("max +40"),
        school: "Necromancy",
      },
    ]);
    for (const spell of massInflictSpells) {
      expect(spell).toMatchObject({
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "Will half",
      });
    }
  });

  it("preserves Repulsion's PHB class levels and clean summary", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Repulsion")
        .map(({ level, classes, description, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, description, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 6,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("prevents creatures failing Will from moving toward you"),
        school: "Abjuration",
        components: "V, S, F/DF",
        castingTime: "1 standard action",
        range: "Up to 10 ft./level",
        duration: "1 round/level (D)",
        savingThrow: "Will negates",
      },
      {
        level: 7,
        classes: ["cleric"],
        description: expect.stringContaining("prevents creatures failing Will from moving toward you"),
        school: "Abjuration",
        components: "V, S, F/DF",
        castingTime: "1 standard action",
        range: "Up to 10 ft./level",
        duration: "1 round/level (D)",
        savingThrow: "Will negates",
      },
    ]);
  });

  it("preserves PHB descriptors and clean summaries for component-marked spells", () => {
    expect(
      srdSpells
        .filter((spell) => ["Arcane Lock", "Consecrate", "Continual Flame", "Desecrate", "Fire Trap"].includes(spell.name))
        .map(({ name, level, classes, description, school }) => ({ name, level, classes, description, school })),
    ).toEqual([
      {
        name: "Arcane Lock",
        level: 2,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("break DC increases by 10"),
        school: "Abjuration",
      },
      {
        name: "Consecrate",
        level: 2,
        classes: ["cleric"],
        description: expect.stringContaining("undead take -1 on attacks, damage and saves"),
        school: "Evocation [Good]",
      },
      {
        name: "Continual Flame",
        level: 2,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("permanent torch-bright magical flame that gives no heat"),
        school: "Evocation [Light]",
      },
      {
        name: "Desecrate",
        level: 2,
        classes: ["cleric"],
        description: expect.stringContaining("undead gain +1 profane to attacks, damage and saves"),
        school: "Evocation [Evil]",
      },
      {
        name: "Fire Trap",
        level: 2,
        classes: ["druid"],
        description: expect.stringContaining("1d4 fire damage +1 per caster level (maximum +20)"),
        school: "Abjuration [Fire]",
      },
      {
        name: "Continual Flame",
        level: 3,
        classes: ["cleric"],
        description: expect.stringContaining("permanent torch-bright magical flame that gives no heat"),
        school: "Evocation [Light]",
      },
      {
        name: "Fire Trap",
        level: 4,
        classes: ["sorcerer", "wizard"],
        description: expect.stringContaining("1d4 fire damage +1 per caster level (maximum +20)"),
        school: "Abjuration [Fire]",
      },
    ]);
  });

  it("uses PHB schools and inherited details for image illusion spells", () => {
    const figmentSpells = {
      "Silent Image": { level: 1, classes: ["bard", "sorcerer", "wizard"], components: "V, S, F", duration: "Concentration" },
      "Minor Image": { level: 2, classes: ["bard", "sorcerer", "wizard"], components: "V, S, F", duration: "Concentration +2 rounds" },
      "Major Image": { level: 3, classes: ["bard", "sorcerer", "wizard"], components: "V, S, F", duration: "Concentration + 3 rounds" },
      "Persistent Image": { level: 5, classes: ["bard", "sorcerer", "wizard"], components: "V, S, M", duration: "1 min./level (D)" },
      "Permanent Image": { level: 6, classes: ["bard", "sorcerer", "wizard"], components: "V, S, M", duration: "Permanent (D)" },
      "Programmed Image": { level: 6, classes: ["bard", "sorcerer", "wizard"], components: "V, S, M", duration: "Permanent until triggered, then 1 round/level" },
    };
    for (const [name, details] of Object.entries(figmentSpells)) {
      const spell = findSpellByName(name);
      expect(spell).toMatchObject({
        name,
        ...details,
        school: "Illusion (Figment)",
        castingTime: "1 standard action",
        range: "Long (400 ft. + 40 ft./level)",
        savingThrow: "Will disbelief (if interacted with)",
      });
      expect(spell?.description).not.toBe("As");
    }

    expect(
      srdSpells
        .filter((spell) => spell.name === "Project Image")
        .map(({ level, classes, school }) => ({ level, classes, school })),
    ).toEqual([
      { level: 6, classes: ["bard"], school: "Illusion (Shadow)" },
      { level: 7, classes: ["sorcerer", "wizard"], school: "Illusion (Shadow)" },
    ]);
  });

  it("completes Hold Monster from its PHB Hold Person mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Hold Monster")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        level: 4,
        classes: ["bard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D); see text",
        savingThrow: "Will negates; see text",
        description: expect.stringContaining("paralyze one living creature of any type on a failed Will save"),
      },
      {
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D); see text",
        savingThrow: "Will negates; see text",
        description: expect.stringContaining("paralyze one living creature of any type on a failed Will save"),
      },
    ]);
  });

  it("completes the PHB mass Hold spells from Hold Person mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Hold Person, Mass", "Hold Monster, Mass"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Hold Person, Mass",
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, F/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D); see text",
        savingThrow: "Will negates; see text",
      },
      {
        name: "Hold Monster, Mass",
        level: 9,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S, F/DF",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 round/level (D); see text",
        savingThrow: "Will negates; see text",
      },
    ]);
  });

  it("completes the PHB Suggestion entries and their mass variant", () => {
    expect(
      srdSpells
        .filter((spell) => ["Suggestion", "Suggestion, Mass"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Suggestion",
        level: 2,
        classes: ["bard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 hour/level or until completed",
        savingThrow: "Will negates",
        description: expect.stringContaining("reasonable-sounding activity in one or two sentences"),
      },
      {
        name: "Suggestion",
        level: 3,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 hour/level or until completed",
        savingThrow: "Will negates",
        description: expect.stringContaining("reasonable-sounding activity in one or two sentences"),
      },
      {
        name: "Suggestion, Mass",
        level: 5,
        classes: ["bard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V, M",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 hour/level or until completed",
        savingThrow: "Will negates",
        description: expect.stringContaining("Give the same reasonable one-or-two-sentence Suggestion"),
      },
      {
        name: "Suggestion, Mass",
        level: 6,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V, M",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 hour/level or until completed",
        savingThrow: "Will negates",
        description: expect.stringContaining("Give the same reasonable one-or-two-sentence Suggestion"),
      },
    ]);
  });

  it("completes the PHB Scrying and Greater Scrying entries", () => {
    expect(
      srdSpells
        .filter((spell) => ["Scrying", "Scrying, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Scrying",
        level: 3,
        classes: ["bard"],
        school: "Divination (Scrying)",
        components: "V, S, M/DF, F",
        castingTime: "1 hour",
        range: "See text",
        duration: "1 min./level",
        savingThrow: "Will negates",
        description: expect.stringContaining("See/hear a creature and about 10 ft. around it at any distance"),
      },
      {
        name: "Scrying",
        level: 4,
        classes: ["druid", "sorcerer", "wizard"],
        school: "Divination (Scrying)",
        components: "V, S, M/DF, F",
        castingTime: "1 hour",
        range: "See text",
        duration: "1 min./level",
        savingThrow: "Will negates",
        description: expect.stringContaining("See/hear a creature and about 10 ft. around it at any distance"),
      },
      {
        name: "Scrying",
        level: 5,
        classes: ["cleric"],
        school: "Divination (Scrying)",
        components: "V, S, M/DF, F",
        castingTime: "1 hour",
        range: "See text",
        duration: "1 min./level",
        savingThrow: "Will negates",
        description: expect.stringContaining("See/hear a creature and about 10 ft. around it at any distance"),
      },
      {
        name: "Scrying, Greater",
        level: 6,
        classes: ["bard"],
        school: "Divination (Scrying)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "1 hour/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("Read Magic and Tongues work reliably through the sensor"),
      },
      {
        name: "Scrying, Greater",
        level: 7,
        classes: ["cleric", "druid", "sorcerer", "wizard"],
        school: "Divination (Scrying)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "1 hour/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("Read Magic and Tongues work reliably through the sensor"),
      },
    ]);
  });

  it("completes Greater Spell Immunity from the PHB Spell Immunity mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Spell Immunity", "Spell Immunity, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Spell Immunity",
        level: 4,
        classes: ["cleric"],
        school: "Abjuration",
        components: "V, S, DF",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "10 min./level",
        savingThrow: "Will negates (harmless)",
        description: expect.stringContaining("one named spell of 4th level or lower per four caster levels"),
      },
      {
        name: "Spell Immunity, Greater",
        level: 8,
        classes: ["cleric"],
        school: "Abjuration",
        components: "V, S, DF",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "10 min./level",
        savingThrow: "Will negates (harmless)",
        description: "Protects the subject against one named spell of 8th level or lower per four caster levels. A creature can have only one Spell Immunity or Greater Spell Immunity active at a time.",
      },
    ]);
  });

  it("completes Greater Invisibility from the PHB Invisibility entry", () => {
    expect(
      srdSpells
        .filter((spell) => ["Invisibility", "Invisibility, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Invisibility",
        level: 2,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Glamer)",
        components: "V, S, M/DF",
        castingTime: "1 standard action",
        range: "Personal or touch",
        duration: "1 min./level (D)",
        savingThrow: "Will negates (harmless) or Will negates (harmless, object)",
        description: expect.stringContaining("Attacking a creature ends the spell"),
      },
      {
        name: "Invisibility, Greater",
        level: 4,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Glamer)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Personal or touch",
        duration: "1 round/level (D)",
        savingThrow: "Will negates (harmless)",
        description: expect.stringContaining("attacking does not end it"),
      },
    ]);
  });

  it("completes Mass Invisibility from the PHB Invisibility mechanics", () => {
    expect(findSpellByName("Invisibility, Mass")).toMatchObject({
      name: "Invisibility, Mass",
      level: 7,
      classes: ["sorcerer", "wizard"],
      school: "Illusion (Glamer)",
      components: "V, S, M",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "1 min./level (D)",
      savingThrow: "Will negates (harmless) or Will negates (harmless, object)",
    });
  });

  it("completes Charm Monster and its mass variant from the PHB Charm Person mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Charm Person", "Charm Monster", "Charm Monster, Mass"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Charm Person",
        level: 1,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Enchantment (Charm) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 hour/level",
        savingThrow: "Will negates",
        description: "Makes one person your friend.",
      },
      {
        name: "Charm Monster",
        level: 3,
        classes: ["bard"],
        school: "Enchantment (Charm) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("make one living creature of any type or size friendly"),
      },
      {
        name: "Charm Monster",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Charm) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("make one living creature of any type or size friendly"),
      },
      {
        name: "Charm Monster, Mass",
        level: 6,
        classes: ["bard"],
        school: "Enchantment (Charm) [Mind-Affecting]",
        components: "V",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("twice your caster level in HD, or at least one regardless of HD"),
      },
      {
        name: "Charm Monster, Mass",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Charm) [Mind-Affecting]",
        components: "V",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("twice your caster level in HD, or at least one regardless of HD"),
      },
    ]);
  });

  it("completes Call Lightning Storm from the PHB Call Lightning mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Call Lightning", "Call Lightning Storm"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Call Lightning",
        level: 3,
        classes: ["druid"],
        school: "Evocation [Electricity]",
        components: "V, S",
        castingTime: "1 round",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "1 min./level",
        savingThrow: "Reflex half",
        description: expect.stringContaining("3d6 electricity damage, Reflex half"),
      },
      {
        name: "Call Lightning Storm",
        level: 5,
        classes: ["druid"],
        school: "Evocation [Electricity]",
        components: "V, S",
        castingTime: "1 round",
        range: "Long (400 ft. + 40 ft./level)",
        duration: "1 min./level",
        savingThrow: "Reflex half",
        description: expect.stringContaining("maximum 15 bolts"),
      },
    ]);
  });

  it("completes Globe of Invulnerability from the PHB lesser Globe mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name.includes("Globe of Invulnerability"))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Globe of Invulnerability, Lesser",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "10 ft.",
        duration: "1 round/level (D)",
        savingThrow: "None",
      },
      {
        name: "Globe of Invulnerability",
        level: 6,
        classes: ["sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "10 ft.",
        duration: "1 round/level (D)",
        savingThrow: "None",
      },
    ]);
    expect(findSpellByName("Globe of Invulnerability")?.description)
      .toContain("excludes spell and spell-like effects of 4th level or lower");
  });

  it("completes the PHB Geas spell family", () => {
    expect(
      srdSpells
        .filter((spell) => ["Geas, Lesser", "Geas/Quest"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Geas, Lesser",
        level: 3,
        classes: ["bard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V",
        castingTime: "1 round",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level or until discharged (D)",
        savingThrow: "Will negates",
        description: expect.stringContaining("Compel one living creature of 7 HD or fewer"),
      },
      {
        name: "Geas, Lesser",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V",
        castingTime: "1 round",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level or until discharged (D)",
        savingThrow: "Will negates",
        description: expect.stringContaining("Compel one living creature of 7 HD or fewer"),
      },
      {
        name: "Geas/Quest",
        level: 6,
        classes: ["bard", "cleric", "sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Language-Dependent, Mind-Affecting]",
        components: "V",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level or until discharged (D)",
        savingThrow: "None",
        description: expect.stringContaining("Each disobedient day deals 3d6 damage"),
      },
    ]);
  });

  it("completes Greater Glyph of Warding from the PHB glyph mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Glyph of Warding", "Glyph of Warding, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Glyph of Warding",
        level: 3,
        classes: ["cleric"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "Touch",
        duration: "Permanent until discharged (D)",
        savingThrow: "See text",
      },
      {
        name: "Glyph of Warding, Greater",
        level: 6,
        classes: ["cleric"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "Touch",
        duration: "Permanent until discharged (D)",
        savingThrow: "See text",
      },
    ]);
    expect(findSpellByName("Glyph of Warding, Greater")?.description)
      .toContain("maximum 10d8");
  });

  it("completes Greater Dispel Magic from the PHB Dispel Magic mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Dispel Magic", "Dispel Magic, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Dispel Magic",
        level: 3,
        classes: ["bard", "cleric", "paladin", "sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Dispel Magic",
        level: 4,
        classes: ["druid"],
        school: "Abjuration",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Dispel Magic, Greater",
        level: 5,
        classes: ["bard"],
        school: "Abjuration",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
      {
        name: "Dispel Magic, Greater",
        level: 6,
        classes: ["cleric", "druid", "sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "None",
      },
    ]);
  });

  it("completes the PHB Planar Binding spell family", () => {
    expect(
      srdSpells
        .filter((spell) => ["Planar Binding, Lesser", "Planar Binding", "Planar Binding, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Planar Binding, Lesser",
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Calling) [see text]",
        components: "V, S",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels); see text",
        duration: "Instantaneous",
        savingThrow: "Will negates",
        description: expect.stringContaining("Call exactly one elemental or outsider of up to 6 HD"),
      },
      {
        name: "Planar Binding",
        level: 6,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Calling) [see text]",
        components: "V, S",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels); see text",
        duration: "Instantaneous",
        savingThrow: "Will negates",
        description: expect.stringContaining("one elemental or outsider up to 12 HD, or up to three of the same kind totaling 12 HD"),
      },
      {
        name: "Planar Binding, Greater",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Calling)",
        components: "V, S",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels); see text",
        duration: "Instantaneous",
        savingThrow: "Will negates",
        description: "Calls one extraplanar creature up to 18 HD or up to three of one kind totaling 18 HD, no two more than 30 ft. apart; each saves, escapes, and must be persuaded individually.",
      },
    ]);
  });

  it("completes Prismatic Sphere from the PHB Prismatic Wall mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Prismatic Wall", "Prismatic Sphere"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Prismatic Wall",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "10 min./level (D)",
        savingThrow: "See text",
        description: "Creates an opaque, immobile seven-color wall that blocks attacks; creatures under 8 HD within 20 ft. that look at it are blinded for 2d4 rounds. Its dimensions scale with caster level, and its layers must be defeated in order. Antimagic cannot penetrate it; a rod of cancellation or Mordenkainen's disjunction destroys it. Spell resistance applies.",
      },
      {
        name: "Prismatic Sphere",
        level: 9,
        classes: ["sorcerer", "wizard"],
        school: "Abjuration",
        components: "V",
        castingTime: "1 standard action",
        range: "10 ft.",
        duration: "10 min./level (D)",
        savingThrow: "See text",
        description: "Creates an immobile, opaque globe of shimmering multicolored light around you, using Prismatic Wall's seven protective layers. You can pass through it unharmed, but it blocks attacks and spells projected through it; other creatures that attack or pass through suffer each color's effect in order. Creatures under 8 HD are blinded for 2d4 × 10 minutes. Spell resistance applies.",
      },
    ]);
    const prismaticWall = findSpellByName("Prismatic Wall");
    const prismaticSphere = findSpellByName("Prismatic Sphere");
    if (!prismaticWall || !prismaticSphere) throw new Error("Missing prismatic spell.");
    expect(getSrdSpellSourceBook(prismaticWall)).toBe("Player's Handbook (3.5)");
    expect(getSrdSpellSourceBook(prismaticSphere)).toBe("Player's Handbook (3.5)");
  });

  it("completes Greater Shadow Conjuration from the PHB Shadow Conjuration mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Shadow Conjuration", "Shadow Conjuration, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Shadow Conjuration",
        level: 4,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Shadow)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "See text",
        savingThrow: "Will disbelief (if interacted with); varies; see text",
      },
      {
        name: "Shadow Conjuration, Greater",
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Illusion (Shadow)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "See text",
        savingThrow: "Will disbelief (if interacted with); varies; see text",
      },
    ]);
  });

  it("completes Greater Shadow Evocation from the PHB Shadow Evocation mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Shadow Evocation", "Shadow Evocation, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Shadow Evocation",
        level: 5,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Shadow)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "See text",
        savingThrow: "Will disbelief (if interacted with)",
        description: expect.stringContaining("Mimic a Sorcerer/Wizard evocation of 4th level or lower"),
      },
      {
        name: "Shadow Evocation, Greater",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Illusion (Shadow)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "See text",
        duration: "See text",
        savingThrow: "Will disbelief (if interacted with)",
        description: "Functions as shadow evocation but mimics sorcerer/wizard evocation spells of 7th level or lower. If recognized, nondamaging effects have a 20% chance to work and damaging effects deal 60% damage.",
      },
    ]);
  });

  it("completes Shades from the PHB Shadow Conjuration mechanics", () => {
    expect(findSpellByName("Shades")).toMatchObject({
      name: "Shades",
      level: 9,
      classes: ["sorcerer", "wizard"],
      school: "Illusion (Shadow)",
      components: "V, S",
      castingTime: "1 standard action",
      range: "See text",
      duration: "See text",
      savingThrow: "Will disbelief (if interacted with); varies; see text",
      description: "Functions as Shadow Conjuration but can mimic sorcerer/wizard conjuration spells of 8th level or lower. Nonbelievers take 80% damage from damaging effects; nondamaging effects have an 80% chance to work. A creature that believes the illusion is affected at full strength; spell resistance and the simulated spell's save apply.",
    });
    const shades = findSpellByName("Shades");
    if (!shades) throw new Error("Missing Shades.");
    expect(getSrdSpellSourceBook(shades)).toBe("Player's Handbook (3.5)");
  });

  it("preserves Shambler's PHB creation and guard-duration rules", () => {
    const shambler = findSpellByName("Shambler");
    if (!shambler) throw new Error("Missing Shambler.");
    expect(shambler).toMatchObject({
      level: 9,
      classes: ["druid"],
      description: "Creates 1d4+2 willing shambling mounds with 11 HD each to aid in combat, perform a mission, or serve as bodyguards for seven days. If created only to guard a specific site, they remain seven months but cannot move beyond the spell's range. They have fire resistance only in rainy, marshy, or damp terrain; spell resistance does not apply.",
      school: "Conjuration (Creation)",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "Seven days or seven months (D); see text",
      savingThrow: "None",
    });
    expect(getSrdSpellSourceBook(shambler)).toBe("Player's Handbook (3.5)");
  });

  it("completes Mirage Arcana from the PHB Hallucinatory Terrain mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Hallucinatory Terrain", "Mirage Arcana"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Hallucinatory Terrain",
        level: 4,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Glamer)",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "Long (400 ft. + 40 ft./level)",
        duration: "2 hours/level (D)",
        savingThrow: "Will disbelief (if interacted with)",
      },
      {
        name: "Mirage Arcana",
        level: 5,
        classes: ["bard", "sorcerer", "wizard"],
        school: "Illusion (Glamer)",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Long (400 ft. + 40 ft./level)",
        duration: "Concentration + 1 hour/level (D)",
        savingThrow: "Will disbelief (if interacted with)",
      },
    ]);
    expect(findSpellByName("Mirage Arcana")?.description)
      .toContain("including changing or adding structures");
  });

  it("preserves PHB Nondetection access and removes the component marker from its summary", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Nondetection")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        level: 3,
        classes: ["sorcerer", "wizard"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 hour/level",
        savingThrow: "Will negates (harmless, object)",
        description: expect.stringContaining("Divination against a warded creature/object requires a caster-level check"),
      },
      {
        level: 4,
        classes: ["ranger"],
        school: "Abjuration",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "1 hour/level",
        savingThrow: "Will negates (harmless, object)",
        description: expect.stringContaining("Divination against a warded creature/object requires a caster-level check"),
      },
    ]);
  });

  it("preserves PHB Magic Mouth access and its triggered message details", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Magic Mouth")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        level: 1,
        classes: ["bard"],
        school: "Illusion (Glamer)",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Permanent until discharged",
        savingThrow: "Will negates (object)",
        description: "Speaks a message of up to 25 words when a specified event occurs.",
      },
      {
        level: 2,
        classes: ["sorcerer", "wizard"],
        school: "Illusion (Glamer)",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Permanent until discharged",
        savingThrow: "Will negates (object)",
        description: "Speaks a message of up to 25 words when a specified event occurs.",
      },
    ]);
  });

  it("completes Dominate Monster from the PHB Dominate Person mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Dominate Person", "Dominate Monster"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Dominate Person",
        level: 4,
        classes: ["bard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 round",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("Control one humanoid telepathically"),
      },
      {
        name: "Dominate Person",
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 round",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: expect.stringContaining("Control one humanoid telepathically"),
      },
      {
        name: "Dominate Monster",
        level: 9,
        classes: ["sorcerer", "wizard"],
        school: "Enchantment (Compulsion) [Mind-Affecting]",
        components: "V, S",
        castingTime: "1 round",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "One day/level",
        savingThrow: "Will negates",
        description: "As Dominate Person, but it can control any creature regardless of type through a telepathic link. You can command the subject within its abilities, and changing its instructions is a move action; spell resistance applies.",
      },
    ]);
    const dominateMonster = findSpellByName("Dominate Monster");
    if (!dominateMonster) throw new Error("Missing Dominate Monster.");
    expect(getSrdSpellSourceBook(dominateMonster)).toBe("Player's Handbook (3.5)");
  });

  it("completes Demand from the PHB Sending mechanics", () => {
    expect(findSpellByName("Demand")).toMatchObject({
      name: "Demand",
      level: 8,
      classes: ["sorcerer", "wizard"],
      school: "Enchantment (Compulsion) [Mind-Affecting]",
      components: "V, S, M",
      castingTime: "10 minutes",
      range: "See text",
      duration: "1 round; see text",
      savingThrow: "Will partial",
      description: "Sends a message of up to 25 words with a suggestion, understood even by a creature with Int 1; it may reply immediately. The suggestion fails if impossible or meaningless, and a Will save negates only the suggestion.",
    });
  });

  it("preserves Dimensional Lock's PHB area and extradimensional travel restrictions", () => {
    expect(findSpellByName("Dimensional Lock")).toMatchObject({
      level: 8,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Creates a 20-ft.-radius emanation that blocks extradimensional travel into or out of the area, including teleportation and planar travel; it does not affect creatures already in astral or ethereal form or end summoning spells.",
      school: "Abjuration",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "One day/level",
      savingThrow: "None",
    });
  });

  it("preserves Discern Location's PHB target prerequisites and protections", () => {
    expect(findSpellByName("Discern Location")).toMatchObject({
      level: 8,
      classes: ["cleric", "sorcerer", "wizard"],
      description: "Reveals a target’s location from place through plane, bypassing normal location protections; only mind blank or a deity’s direct intervention stops it. You must have seen the creature or have an item that belonged to it, or have touched the object.",
      school: "Divination",
      components: "V, S, DF",
      castingTime: "10 minutes",
      range: "Unlimited",
      duration: "Instantaneous",
      savingThrow: "None",
    });
  });

  it("preserves Earthquake's PHB descriptor and terrain-dependent effects", () => {
    expect(findSpellByName("Earthquake")).toMatchObject({
      level: 8,
      classes: ["cleric", "druid"],
      description: "An 80-ft.-radius tremor prevents ground-bound creatures from moving or attacking for 1 round; casters on the ground need a Concentration check (DC 20 + spell level). Terrain-specific hazards include cave-ins and cliff landslides (8d6 bludgeoning, Reflex DC 15 half, then pinned), fissures, collapsing structures, and quicksand.",
      school: "Evocation [Earth]",
      components: "V, S, DF",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "1 round",
      savingThrow: "See text",
    });
  });

  it("preserves Finger of Death's PHB class levels, descriptor, and save damage", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Finger of Death")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Necromancy [Death]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "Fortitude partial",
      },
      {
        level: 8,
        classes: ["druid"],
        school: "Necromancy [Death]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "Instantaneous",
        savingThrow: "Fortitude partial",
      },
    ]);
  });

  it("preserves Fire Storm's PHB class levels, damage cap, and plant exception", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Fire Storm")
        .map(({ level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        level: 7,
        classes: ["druid"],
        school: "Evocation [Fire]",
        components: "V, S",
        castingTime: "1 round",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "Reflex half",
      },
      {
        level: 8,
        classes: ["cleric"],
        school: "Evocation [Fire]",
        components: "V, S",
        castingTime: "1 round",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "Reflex half",
      },
    ]);
  });

  it("preserves Holy Aura's PHB descriptor and protective effects", () => {
    expect(findSpellByName("Holy Aura")).toMatchObject({
      level: 8,
      classes: ["cleric"],
      description: "Wards one creature/level in a 20-ft.-radius burst with +4 deflection AC, +4 resistance saves, SR 25 against evil spells and spells cast by evil creatures, and protection from possession and mental influence; evil melee attackers who strike are blinded unless they succeed on a Fortitude save.",
      school: "Abjuration [Good]",
      components: "V, S, F",
      castingTime: "1 standard action",
      range: "20 ft.",
      duration: "1 round/level (D)",
      savingThrow: "See text",
    });
  });

  it("preserves Horrid Wilting's PHB target spacing and creature-specific damage", () => {
    expect(findSpellByName("Horrid Wilting")).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Evaporates moisture from living creatures within 60 ft. of one another for 1d6 damage/level (max 20d6); water elementals and plant creatures instead take 1d8/level (max 20d8).",
      school: "Necromancy",
      components: "V, S, M/DF",
      castingTime: "1 standard action",
      range: "Long (400 ft. + 40 ft./level)",
      duration: "Instantaneous",
      savingThrow: "Fortitude half",
    });
  });

  it("preserves Incendiary Cloud's PHB school, effects, and movement", () => {
    expect(findSpellByName("Incendiary Cloud")).toMatchObject({
      level: 8,
      classes: ["sorcerer", "wizard"],
      description: "Creates a 20-ft.-radius, 20-ft.-high smoke cloud that obscures sight and deals 4d6 fire damage each round (Reflex half). It moves 10 ft./round away from you, or up to 60 ft. if you concentrate; wind disperses it.",
      school: "Conjuration (Creation) [Fire]",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Medium (100 ft. + 10 ft./level)",
      duration: "1 round/level",
      savingThrow: "Reflex half; see text",
    });
  });

  it("completes Weird from the PHB Phantasmal Killer mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Phantasmal Killer", "Weird"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Phantasmal Killer",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Illusion (Phantasm) [Fear, Mind-Affecting]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "Will disbelief (if interacted with), then Fortitude partial; see text",
      },
      {
        name: "Weird",
        level: 9,
        classes: ["sorcerer", "wizard"],
        school: "Illusion (Phantasm) [Fear, Mind-Affecting]",
        components: "V, S",
        castingTime: "1 standard action",
        range: "Medium (100 ft. + 10 ft./level)",
        duration: "Instantaneous",
        savingThrow: "Will disbelief (if interacted with), then Fortitude partial; see text",
      },
    ]);
    const weird = findSpellByName("Weird");
    if (!weird) throw new Error("Missing Weird.");
    expect(weird.description)
      .toBe("As Phantasmal Killer, but it affects any number of creatures no more than 30 ft. apart; only subjects see their attackers. A subject that succeeds on its Fortitude save still takes 3d6 damage, is stunned for 1 round, and takes 1d4 temporary Strength damage.");
    expect(getSrdSpellSourceBook(weird)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Time Stop, Wail of the Banshee, and Wish effects", () => {
    const timeStop = findSpellByName("Time Stop");
    const wail = findSpellByName("Wail of the Banshee");
    const wish = findSpellByName("Wish");
    if (!timeStop || !wail || !wish) throw new Error("Missing PHB level-nine spell.");
    expect(timeStop).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "You gain 1d4+1 rounds of apparent time while other creatures seem frozen. They are invulnerable to your attacks and spells and cannot be targeted, but environmental effects can still harm you. You cannot affect items held by creatures in normal time or enter an antimagic field; you are undetectable while the spell lasts.",
      school: "Transmutation",
      components: "V",
      castingTime: "1 standard action",
      range: "Personal",
      duration: "1d4+1 rounds (apparent time); see text",
    });
    expect(wail).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Your scream can kill one living creature per caster level that hears it within a 40-ft.-radius spread; the creatures nearest the origin are affected first. Spell resistance applies.",
      school: "Necromancy [Death, Sonic]",
      components: "V",
      range: "Close (25 ft. + 5 ft./2 levels)",
      savingThrow: "Fortitude negates",
    });
    expect(wish).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Can duplicate nonprohibited wizard/sorcerer spells of 8th level or lower or other spells of 6th level or lower; it can also duplicate prohibited-school wizard/sorcerer spells through 7th level or other spells through 5th. Other options include undoing certain spell effects, creating a nonmagical item worth up to 25,000 gp, creating or improving a magic item, granting inherent ability bonuses up to +5, removing injuries or afflictions, reviving the dead, planar transport, or rerolling a roll from the last round. More powerful requests are risky and may be perverted or partly fulfilled. The minimum cost is 5,000 XP; magic-item creation costs twice the normal crafting XP plus 5,000 XP, and duplicated spells with XP costs require the greater of 5,000 XP or their normal cost. A duplicated spell uses a 9th-level save DC; material components over 10,000 gp must be supplied.",
      school: "Universal",
      components: "V, XP",
      castingTime: "1 standard action",
    });
    expect([timeStop, wail, wish].every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("preserves PHB Teleportation Circle and True Resurrection details", () => {
    const circle = findSpellByName("Teleportation Circle");
    const trueResurrection = findSpellByName("True Resurrection");
    if (!circle || !trueResurrection) throw new Error("Missing PHB level-nine spell.");
    expect(circle).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Creates a subtle 5-ft.-radius circle that teleports creatures standing on it to a fixed, familiar destination on the same plane, as Greater Teleport. The destination cannot be changed and cannot be inside a solid object; the circle is difficult to detect and disable (Search and Disable Device DC 34). It can be made permanent; if a permanent circle is disabled, it reactivates after 10 minutes. Requires 1,000 gp of amber dust; spell resistance applies.",
      school: "Conjuration (Teleportation)",
      components: "V, M",
      castingTime: "10 minutes",
      range: "0 ft.",
      duration: "10 min./level (D)",
      savingThrow: "None",
    });
    expect(trueResurrection).toMatchObject({
      level: 9,
      classes: ["cleric"],
      description: "As Raise Dead, but it can restore a creature dead for up to 10 years per caster level, even if its body was destroyed, when the deceased is unambiguously identified. The subject returns at full hp, vigor, and health with no level, Constitution, or prepared-spell loss; it can restore creatures killed by death effects, creatures that were turned undead and then destroyed, elementals, and outsiders. It cannot restore constructs, undead, or creatures that died of old age. Requires holy water and diamonds worth at least 25,000 gp; spell resistance applies (harmless).",
      school: "Conjuration (Healing)",
      components: "V, S, M, DF",
      castingTime: "10 minutes",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "None; see text",
    });
    expect(getSrdSpellSourceBook(circle)).toBe("Player's Handbook (3.5)");
    expect(getSrdSpellSourceBook(trueResurrection)).toBe("Player's Handbook (3.5)");
  });

  it("completes Teleport Object and Greater Teleport from PHB Teleport mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Teleport", "Teleport Object", "Teleport, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Teleport",
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Teleportation)",
        components: "V",
        castingTime: "1 standard action",
        range: "Personal and touch",
        duration: "Instantaneous",
        savingThrow: "None and Will negates (object)",
      },
      {
        name: "Teleport Object",
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Teleportation)",
        components: "V",
        castingTime: "1 standard action",
        range: "Touch",
        duration: "Instantaneous",
        savingThrow: "Will negates (object)",
      },
      {
        name: "Teleport, Greater",
        level: 7,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Teleportation)",
        components: "V",
        castingTime: "1 standard action",
        range: "Personal and touch",
        duration: "Instantaneous",
        savingThrow: "None and Will negates (object)",
      },
    ]);
  });

  it("completes Greater Prying Eyes from the PHB Prying Eyes mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Prying Eyes", "Prying Eyes, Greater"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Prying Eyes",
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Divination",
        components: "V, S, M",
        castingTime: "1 minute",
        range: "One mile",
        duration: "1 hour/level (D); see text",
        savingThrow: "None",
      },
      {
        name: "Prying Eyes, Greater",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Divination",
        components: "V, S, M",
        castingTime: "1 minute",
        range: "One mile",
        duration: "1 hour/level; see text (D)",
        savingThrow: "None",
      },
    ]);
    expect(findSpellByName("Prying Eyes, Greater")?.description)
      .toBe("Creates 1d4+1 eyes per level; they see as with true seeing to 120 ft., navigate dark areas at normal speed, and have a maximum +25 Spot modifier.");
    const greaterEyes = findSpellByName("Prying Eyes, Greater");
    if (!greaterEyes) throw new Error("Missing Prying Eyes, Greater spell.");
    expect(getSrdSpellSourceBook(greaterEyes)).toBe("Player's Handbook (3.5)");
  });

  it("completes Telekinetic Sphere from the PHB Resilient Sphere mechanics", () => {
    expect(
      srdSpells
        .filter((spell) => ["Resilient Sphere", "Telekinetic Sphere"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow,
        })),
    ).toEqual([
      {
        name: "Resilient Sphere",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Evocation [Force]",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 min./level (D)",
        savingThrow: "Reflex negates",
      },
      {
        name: "Telekinetic Sphere",
        level: 8,
        classes: ["sorcerer", "wizard"],
        school: "Evocation [Force]",
        components: "V, S, M",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 min./level (D)",
        savingThrow: "Reflex negates (object)",
      },
    ]);
    expect(findSpellByName("Telekinetic Sphere")?.description)
      .toBe("Creates a 1-ft.-diameter/level force sphere around creatures or objects, functioning as Resilient Sphere; contents weigh 1/16 normal weight. You can lift and move up to 5,000 lb. within it by concentration, moving the sphere up to 30 ft./round; it falls only 60 ft./round without harming its contents. Spell resistance applies to objects.");
    const telekineticSphere = findSpellByName("Telekinetic Sphere");
    if (!telekineticSphere) throw new Error("Missing Telekinetic Sphere spell.");
    expect(getSrdSpellSourceBook(telekineticSphere)).toBe("Player's Handbook (3.5)");
  });

  it("completes Heal Mount and uses the PHB healing subschool", () => {
    expect(findSpellByName("Heal Mount")).toMatchObject({
      name: "Heal Mount",
      level: 3,
      classes: ["paladin"],
      school: "Conjuration (Healing)",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates (harmless)",
      description: expect.stringContaining("only from your paladin special mount"),
    });
    expect(
      srdSpells
        .filter((spell) => spell.name === "Heal")
        .map(({ level, classes, school }) => ({ level, classes, school })),
    ).toEqual([
      { level: 6, classes: ["cleric"], school: "Conjuration (Healing)" },
      { level: 7, classes: ["druid"], school: "Conjuration (Healing)" },
    ]);
  });

  it("completes Major Creation from the PHB Minor Creation entry", () => {
    expect(
      srdSpells
        .filter((spell) => ["Minor Creation", "Major Creation"].includes(spell.name))
        .map(({ name, level, classes, school, components, castingTime, range, duration, savingThrow, description }) => ({
          name, level, classes, school, components, castingTime, range, duration, savingThrow, description,
        })),
    ).toEqual([
      {
        name: "Minor Creation",
        level: 4,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Creation)",
        components: "V, S, M",
        castingTime: "1 minute",
        range: "0 ft.",
        duration: "1 hour/level (D)",
        savingThrow: "None",
        description: expect.stringContaining("nonmagical object of nonliving plant matter up to 1 cu. ft. per caster level"),
      },
      {
        name: "Major Creation",
        level: 5,
        classes: ["sorcerer", "wizard"],
        school: "Conjuration (Creation)",
        components: "V, S, M",
        castingTime: "10 minutes",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "See text",
        savingThrow: "None",
        description: expect.stringContaining("Duration by material: plants 2 hours/level"),
      },
    ]);
  });

  it("completes Mass Heal from the PHB Heal mechanics", () => {
    expect(findSpellByName("Heal, Mass")).toMatchObject({
      name: "Heal, Mass",
      level: 9,
      classes: ["cleric"],
      school: "Conjuration (Healing)",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Instantaneous",
      savingThrow: "Will negates (harmless)",
      description: expect.stringContaining("10 hp per caster level (maximum 250 hp per creature)"),
    });
    const massHeal = findSpellByName("Heal, Mass");
    if (!massHeal) throw new Error("Missing Heal, Mass.");
    expect(massHeal.description).toContain("Against undead, it acts as Harm instead");
    expect(getSrdSpellSourceBook(massHeal)).toBe("Player's Handbook (3.5)");
  });

  it("preserves PHB Implosion and Imprisonment effects", () => {
    const implosion = findSpellByName("Implosion");
    const imprisonment = findSpellByName("Imprisonment");
    if (!implosion || !imprisonment) throw new Error("Missing PHB level-nine spell.");
    expect(implosion).toMatchObject({
      level: 9,
      classes: ["cleric"],
      description: "Creates destructive resonance that kills one corporeal creature each round you concentrate. A creature can be targeted only once per casting; gaseous and incorporeal creatures are unaffected. The instantaneous effect cannot be dispelled; spell resistance applies.",
      school: "Evocation",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Concentration (up to 4 rounds)",
      savingThrow: "Fortitude negates",
    });
    expect(imprisonment).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: expect.stringContaining("the target's name and some facts about its life, it takes -4 on its save"),
      school: "Abjuration",
      components: "V, S",
      castingTime: "1 standard action",
      range: "Touch",
      duration: "Instantaneous",
      savingThrow: "Will negates; see text",
    });
    expect([implosion, imprisonment].every((spell) => getSrdSpellSourceBook(spell) === "Player's Handbook (3.5)")).toBe(true);
  });

  it("uses the PHB name and effects for Mordenkainen's Disjunction", () => {
    const disjunction = findSpellByName("Mordenkainen's Disjunction");
    if (!disjunction) throw new Error("Missing Mordenkainen's Disjunction.");
    expect(disjunction).toMatchObject({
      level: 9,
      classes: ["sorcerer", "wizard"],
      description: "Disjoins magical effects and permanent magic items in a 40-ft.-radius burst, excluding effects and items you carry or touch. Effects end as with dispel magic; each permanent item that fails its Will save becomes nonmagical. It has a 1%/caster level chance to destroy an antimagic field or artifact; destroying an artifact risks permanently losing spellcasting (DC 25 Will save) and attracting powerful attention. Spell resistance does not apply.",
      school: "Abjuration",
      components: "V",
      castingTime: "1 standard action",
      range: "Close (25 ft. + 5 ft./2 levels)",
      duration: "Instantaneous",
      savingThrow: "Will negates (object)",
    });
    expect(getSrdSpellSourceBook(disjunction)).toBe("Player's Handbook (3.5)");
  });

  it("uses the PHB names and cleric-only access for alignment detection spells", () => {
    for (const name of ["Detect Chaos", "Detect Evil", "Detect Good", "Detect Law"]) {
      const spell = findSpellByName(name);
      expect(spell).toMatchObject({
        name,
        level: 1,
        classes: ["cleric"],
        school: "Divination",
        components: "V, S, DF",
        castingTime: "1 standard action",
        range: "60 ft.",
        duration: "Concentration, up to 10 min./level (D)",
        savingThrow: "None",
      });
      expect(spell?.description).not.toBe("/");
    }
    expect(srdSpells.some((spell) => ["Evil", "Good", "Law"].includes(spell.name))).toBe(false);
  });

  it("excludes malformed lowercase duplicates and preserves PHB mass-spell access", () => {
    expect(srdSpells.filter((spell) => /^[a-z]/.test(spell.name)).map((spell) => spell.name)).toEqual([]);

    const massSpellClasses: Record<string, string[]> = {
      "Bear’s Endurance, Mass": ["cleric", "druid", "sorcerer", "wizard"],
      "Bull’s Strength, Mass": ["cleric", "druid", "sorcerer", "wizard"],
      "Cat’s Grace, Mass": ["bard", "druid", "sorcerer", "wizard"],
      "Eagle’s Splendor, Mass": ["bard", "cleric", "sorcerer", "wizard"],
      "Fox’s Cunning, Mass": ["bard", "sorcerer", "wizard"],
      "Owl’s Wisdom, Mass": ["cleric", "druid", "sorcerer", "wizard"],
    };
    for (const [name, classes] of Object.entries(massSpellClasses)) {
      const spell = findSpellByName(name);
      expect(spell).toMatchObject({
        name,
        level: 6,
        classes,
        school: "Transmutation",
        castingTime: "1 standard action",
        range: "Close (25 ft. + 5 ft./2 levels)",
        duration: "1 min./level",
        savingThrow: "Will negates (harmless)",
      });
      expect(spell?.description).toContain("one creature per caster level");
      expect(spell?.components).toBeTruthy();
    }
  });

  it("limits Paladin dispel spells to Chaos and Evil", () => {
    expect(
      srdSpells
        .filter((spell) =>
          ["Dispel Chaos", "Dispel Evil", "Dispel Good", "Dispel Law"].includes(spell.name) &&
          spell.classes.includes("paladin"),
        )
        .map((spell) => spell.name)
        .sort(),
    ).toEqual(["Dispel Chaos", "Dispel Evil"]);
  });

  it("keeps alignment domain spells off the Cleric class list", () => {
    for (const name of ["Chaos Hammer", "Holy Smite", "Order’s Wrath", "Unholy Blight"]) {
      expect(findSpellByName(name)?.classes).toEqual([]);
      expect(getClassSpells("cleric").some((spell) => spell.name === name)).toBe(false);
    }
  });

  it("keeps Cure Serious Wounds at its PHB class-specific levels", () => {
    expect(
      srdSpells
        .filter((spell) => spell.name === "Cure Serious Wounds")
        .map(({ level, classes }) => ({ level, classes })),
    ).toEqual([
      { level: 3, classes: ["bard", "cleric"] },
      { level: 4, classes: ["druid", "paladin", "ranger"] },
    ]);
  });

  it("keeps Cure Critical Wounds on the PHB Bard and Cleric lists", () => {
    const cureCritical = srdSpells.find(
      (spell) => spell.name === "Cure Critical Wounds" && spell.level === 4,
    );
    if (!cureCritical) throw new Error("Missing level 4 Cure Critical Wounds.");
    expect(cureCritical.classes).toEqual(["bard", "cleric"]);
  });

  it("resolves domain-name variants to complete SRD spell records", () => {
    const aliases = {
      "Greater Arcane Sight": "Arcane Sight, Greater",
      "Greater Command": "Command, Greater",
      "Greater Heroism": "Heroism, Greater",
      "Greater Restoration": "Restoration, Greater",
      "Lesser Restoration": "Restoration, Lesser",
      "Otto's Irresistible Dance": "Irresistible Dance",
      "Rary's Telepathic Bond": "Telepathic Bond",
      "Tasha's Hideous Laughter": "Hideous Laughter",
    };
    for (const [domainName, catalogName] of Object.entries(aliases)) {
      const spell = findSpellByName(domainName);
      expect(spell?.name).toBe(catalogName);
      expect([
        spell?.description, spell?.school, spell?.components,
        spell?.castingTime, spell?.range, spell?.duration, spell?.savingThrow,
      ].every(Boolean)).toBe(true);
    }
  });

  it("adds sourced Dragonlance domain spell details without making them Core class choices", () => {
    const names = ["Hardening", "Otyugh Swarm", "Plague of Rats", "Scourge", "Unbinding"];
    for (const name of names) {
      const spell = findSpellByName(name);
      if (!spell) throw new Error(`Expected Dragonlance domain spell ${name} to be cataloged.`);
      expect(spell).toMatchObject({
        source: "dragonlance-user-pack",
        sourceBook: "Dragonlance Campaign Setting",
      });
      expect(getSrdSpellContentSource(spell)).toBe("dragonlance-user-pack");
      expect(getSrdSpellSourceBook(spell)).toBe("Dragonlance Campaign Setting");
      expect([
        spell.description, spell.school, spell.components,
        spell.castingTime, spell.range, spell.duration, spell.savingThrow,
      ].every(Boolean)).toBe(true);
    }

    for (const name of ["Otyugh Swarm", "Plague of Rats", "Scourge"])
      expect(findSpellByName(name)?.classes).toEqual([]);
    expect(findSpellByName("Hardening")).toMatchObject({
      level: 7,
      classes: ["sorcerer", "wizard"],
      classLevels: { sorcerer: 6, wizard: 6 },
    });
    expect(findSpellByName("Unbinding")?.classes).toEqual(["sorcerer", "wizard"]);
    for (const classId of ["cleric", "mystic", "sorcerer", "wizard"] as const)
      expect(getClassSpells(classId).some((spell) => names.includes(spell.name))).toBe(false);
  });

  it("adds all Chapter 3 New Spells with source-backed class access and levels", () => {
    const newSpellClasses: Record<string, string[]> = {
      "Bestow Greater Curse": ["bard", "cleric", "sorcerer", "wizard"],
      "Billim's Bifrost Bridge": ["sorcerer", "wizard"],
      "Crackling Sphere": ["sorcerer", "wizard"],
      "Dalamar's Lightning Lance": ["sorcerer", "wizard"],
      "Deep Freeze": ["sorcerer", "wizard"],
      Disjoin: ["cleric", "sorcerer", "wizard"],
      "Divine Retribution": ["cleric"],
      Drown: ["druid", "sorcerer", "wizard"],
      "Earthen Shield": ["cleric", "sorcerer", "wizard"],
      "Electrical Storm": ["sorcerer", "wizard"],
      "Elemental Dart": ["sorcerer", "wizard"],
      "Fistandantilus's Portal": ["sorcerer", "wizard"],
      "Magius's Light of Truth": ["wizard"],
      "Palin's Pyre": ["sorcerer", "wizard"],
      "Share Animal's Mind": ["cleric", "druid"],
      "Shocking Spark": ["sorcerer", "wizard"],
      "Spark Shield": ["cleric", "sorcerer", "wizard"],
      "Spirit Walk": ["cleric", "sorcerer", "wizard"],
      "Stone Shards": ["sorcerer", "wizard"],
      "Storm Wall": ["sorcerer", "wizard"],
      Talons: ["cleric", "druid"],
    };
    for (const [name, classes] of Object.entries(newSpellClasses)) {
      const spell = findSpellByName(name);
      if (!spell) throw new Error(`Expected Chapter 3 spell ${name} to be cataloged.`);
      expect(spell.source).toBe("dragonlance-user-pack");
      expect(spell.classes).toEqual(classes);
      expect([
        spell.description, spell.school, spell.components,
        spell.castingTime, spell.range, spell.duration, spell.savingThrow,
      ].every(Boolean)).toBe(true);
    }

    const newSpellNames = Object.keys(newSpellClasses);
    expect(getClassSpells("wizard").some((spell) => newSpellNames.includes(spell.name))).toBe(false);
    expect(getClassSpells("bard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(6);
    expect(getClassSpells("bard", "dragonlance-user-pack")
      .filter((spell) => spell.school === "Conjuration (Healing)")).toEqual([]);
    expect(getClassSpells("bard")
      .some((spell) => spell.name === "Cure Light Wounds")).toBe(true);
    expect(getClassSpells("cleric", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(7);
    expect(getClassSpells("sorcerer", "dragonlance-user-pack")
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(8);
    expect(getClassSpells("druid", "dragonlance-user-pack")
      .find((spell) => spell.name === "Drown")?.level).toBe(5);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Drown")?.level).toBe(6);
    expect(getClassSpells("cleric", "dragonlance-user-pack")
      .find((spell) => spell.name === "Spirit Walk")?.level).toBe(6);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Spirit Walk")?.level).toBe(7);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .find((spell) => spell.name === "Hardening")?.level).toBe(6);

    const mystic = cloneCharacter(initialCharacter);
    mystic.ruleset = "dragonlance-user-pack";
    mystic.classLevels = [{ classId: "mystic", level: 1 }];
    expect(getClassSpells("mystic", mystic.ruleset, mystic)
      .find((spell) => spell.name === "Bestow Greater Curse")?.level).toBe(7);

    const whiteWizard = cloneCharacter(initialCharacter);
    whiteWizard.ruleset = "dragonlance-user-pack";
    whiteWizard.highSorceryOrder = "white";
    expect(getClassSpells("wizard", whiteWizard.ruleset, whiteWizard)
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(true);
    expect(getClassSpells("wizard", "dragonlance-user-pack")
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(false);
    expect(getClassSpells("sorcerer", whiteWizard.ruleset, whiteWizard)
      .some((spell) => spell.name === "Magius's Light of Truth")).toBe(false);
  });

  it("keeps Dragonlance domain spell details out of Core scroll purchase choices", () => {
    const character = cloneCharacter(initialCharacter);
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByText("No spells match.")).toBeDefined();
  });

  it("offers Dragonlance domain spell details in Dragonlance scroll purchase choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByRole("option", { name: /Hardening \(Level 7\)/ })).toBeDefined();
  });

  it("uses a character's class-specific spell level for Dragonlance scroll choices", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "wizard", level: 12 }];
    render(<WandsScrollPanel character={character} onInventoryChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Purchase instead of craft"));
    const scrollPicker = document.querySelector<HTMLButtonElement>(".spell-picker > button");
    if (!scrollPicker) throw new Error("Missing scroll spell picker.");
    fireEvent.click(scrollPicker);
    fireEvent.change(screen.getByLabelText("Search spells"), { target: { value: "Hardening" } });
    expect(screen.getByRole("option", { name: /Hardening \(Level 6\)/ })).toBeDefined();
  });
});

beforeEach(() => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
});

function caster(): Character {
  const character = cloneCharacter(initialCharacter);
  character.name = "Multiclass Mage";
  character.classLevels = [{ classId: "wizard", level: 3 }, { classId: "cleric", level: 1 }];
  character.abilities.int = 16;
  character.abilities.wis = 14;
  character.abilities.cha = 18;
  character.knownSpellsByClass = { wizard: ["Magic Missile", "Detect Magic", "Invisibility"] };
  character.knownSpells = ["Magic Missile", "Detect Magic", "Invisibility"];
  return character;
}

function highSorceryCaster(order: NonNullable<Character["highSorceryOrder"]> = "red") {
  const character = caster();
  character.ruleset = "dragonlance-user-pack";
  character.highSorceryOrder = order;
  return character;
}

function save(character: Character) {
  window.localStorage.setItem(savedCharacterStorageKey, JSON.stringify(character));
}

function saveEditable(character: Character) {
  save(character);
  window.localStorage.setItem(savedCharacterSetupDraftStorageKey, "true");
}

function stored() {
  return readStoredCharacter();
}

async function openSpells(preparation = true) {
  fireEvent.click(await screen.findByRole("button", { name: "Spells" }));
  const panel = await screen.findByRole("tabpanel", { name: /Wizard ·|Cleric ·/ });
  if (preparation && screen.queryByRole("tab", { name: "Daily Preparation" })) {
    fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
  }
  return panel;
}

function openBook() {
  fireEvent.click(screen.getByRole("tab", { name: "Spellbook" }));
}

function fillCopiedSpell(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
  fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: name } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "One day of study completed" }));
  fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "30" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
}
function spellLevel(panel: HTMLElement, name: string) {
  const section = within(panel).getByText(name, { exact: true }).closest("section");
  if (!(section instanceof HTMLElement)) throw new Error(`Missing spell section ${name}.`);
  return within(section);
}

describe("class-specific spell rules", () => {
  it("offers one spellbook entry per saved spell name even when the source catalog repeats names", () => {
    const entries = getWizardSpellbookSpells();
    expect(new Set(entries.map((entry) => entry.name.toLowerCase())).size).toBe(entries.length);
  });
  it.each([
    [0, 20, 15, 1, 100], [1, 21, 16, 1, 100], [2, 22, 17, 2, 200], [9, 29, 24, 9, 900],
  ])("calculates copying requirements at spell level %s", (level, decipherDC, learningDC, pages, writingCostGp) => {
    expect(getWizardCopyRequirements(level)).toMatchObject({ decipherDC, learningDC, studyDays: 1, pages, writingCostGp, writingHours: 24 });
  });

  it("allows prescribed starting spells below the casting ability threshold but gates later free spells", () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Magic Missile", "Shield", "Web"] };
    character.spellAcquisitionByClass = { wizard: { Shield: "scroll" } };
    expect(getWizardFreeSpellAllowance(character)).toEqual({ starting: true, required: 6, selected: 1, remaining: 5 });
    character.abilities.int = 10;
    expect(getWizardFreeSpellAllowance(character).selected).toBe(1);

    const original = cloneCharacter(character);
    original.knownSpellsByClass = { wizard: ["Magic Missile"] };
    original.knownSpells = ["Magic Missile"];
    original.spellAcquisitionByClass = {};
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;
    proposed.knownSpellsByClass = { wizard: ["Magic Missile", "Mage Armor"] };
    proposed.knownSpells = ["Magic Missile", "Mage Armor"];
    expect(getWizardFreeSpellAllowance(proposed, original))
      .toEqual({ starting: false, required: 2, selected: 0, remaining: 2 });
  });
  it.each([
    ["wizard", 3, 2, true], ["wizard", 3, 3, false],
    ["sorcerer", 3, 2, false], ["sorcerer", 4, 2, true],
    ["bard", 1, 1, false], ["bard", 2, 1, true],
    ["bard", 3, 2, false], ["bard", 4, 2, true],
    ["paladin", 3, 1, false], ["paladin", 4, 0, false],
    ["paladin", 4, 1, true], ["paladin", 7, 2, false],
    ["ranger", 8, 2, true], ["ranger", 10, 3, false],
    ["ranger", 11, 3, true], ["ranger", 14, 4, true],
    ["fighter", 20, 0, false], ["wizard", 0, 0, false], ["wizard", 20, 10, false],
  ] as const)("%s %s spell level %s access is %s", (classId, level, spellLevel, expected) => {
    expect(hasSpellLevelAtClassLevel(classId, level, spellLevel)).toBe(expected);
  });

  describe("wizard spellbook learning", () => {
    it("separates the recorded spellbook from preparation and preserves selections when switching views", async () => {
      save(caster());
      render(<App />);
      await openSpells(false);
      expect(screen.getByRole("tab", { name: "Spellbook" }).getAttribute("aria-selected")).toBe("true");
      expect(screen.getByText(/A core Wizard may choose a specialty school at Wizard 1/)).toBeDefined();
      expect(screen.getByText(/Preparing a spell from a borrowed spellbook requires/)).toBeDefined();
      expect(screen.queryByRole("spinbutton")).toBeNull();
      expect(screen.queryByRole("checkbox", { name: /Expended/ })).toBeNull();
      expect(screen.getByText("Magic Missile", { exact: true })).toBeDefined();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }), { target: { value: "2" } });
      expect(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }).closest("tr")?.textContent)
        .toContain("Source: D&D 3.5 Core SRD");
      expect(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }).closest("tr")?.textContent)
        .toContain("Book: Player's Handbook (3.5)");
      openBook();
      expect(screen.queryByRole("spinbutton")).toBeNull();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Magic Missile" }).value).toBe("2");
    });

    it("allows prescribed starting spells below the Intelligence threshold for casting", async () => {
      const character = caster();
      character.classLevels = [{ classId: "wizard", level: 1 }];
      character.abilities.int = 10;
      character.knownSpellsByClass = { wizard: [] };
      character.knownSpells = [];
      saveEditable(character);
      render(<App />);
      await openSpells(false);

      const freeSpell = screen.getByRole("combobox", { name: "Free wizard spell" });
      expect(within(freeSpell).getByRole("option", { name: "Magic Missile (Level 1)" })).toBeDefined();
      fireEvent.change(freeSpell, { target: { value: "Magic Missile" } });
      fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
      expect(screen.getByText(/Requires wizard spell-level access and INT 11/)).toBeDefined();
    });

    it("prepares Read Magic from memory without adding it to the spellbook", async () => {
      const character = caster();
      character.classLevels = [{ classId: "wizard", level: 1 }];
      character.knownSpellsByClass = { wizard: [] };
      character.knownSpells = [];
      character.preparedSpellsByClass = { wizard: [] };
      character.preparedSpells = [];
      saveEditable(character);
      render(<App />);
      await openSpells(false);

      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      const readMagic = screen.getByRole("spinbutton", { name: "Prepare Read Magic" });
      fireEvent.change(readMagic, { target: { value: "1" } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().preparedSpellsByClass?.wizard).toEqual(["Read Magic"]);
      expect(stored().knownSpellsByClass?.wizard ?? []).not.toContain("Read Magic");

      openBook();
      expect(screen.queryByRole("row", { name: /Read Magic/ })).toBeNull();
    });

    it("hides spellbook mutation controls when the Wizard sheet is read-only", () => {
      const character = caster();
      character.spellAcquisitionByClass = { wizard: { "Magic Missile": "scroll" } };
      render(<SpellSheets character={character} editable={false}
        onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
        onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
        onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
        onCombatCastingContextChange={vi.fn()} />);

      expect(screen.queryByRole("button", { name: "Learn a spell" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Remove Magic Missile from spellbook" })).toBeNull();
    });

    it("requires the exact decipher and learning DCs, study, and writing confirmations before copying", async () => {
      saveEditable(caster());
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      expect(screen.getByText(/Copying requirements for Web/).textContent ?? "")
        .toContain("learning Spellcraft DC 17 after one day of study");
      expect(screen.queryByRole("option", { name: "Decipher Script check" })).toBeNull();
      expect(screen.getByText(/Writing takes 24 hours, uses 2 pages, and costs 200 gp/)).toBeDefined();
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: "spellcraft" } });
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "21" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "One day of study completed" }));
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "16" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      expect(screen.getAllByRole("alert").map((entry) => entry.textContent).join(" ")).toContain("Learning failed");
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "22" } });
      expect(screen.queryByText(/Deciphering failed/)).toBeNull();
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toContain("Web");
      expect(stored().wizardSpellLearning?.Web).toMatchObject({
        source: "scroll", decipherMethod: "spellcraft", decipherTotal: 22, spellcraftTotal: 17,
      });
      expect(stored().inventory).toEqual({});
    });

    it.each([
      ["spellcraft", "Deciphering Spellcraft total before Magius bonus"],
      ["decipher-script", "Deciphering Decipher Script total before Magius bonus"],
    ] as const)("applies Magius to arcane scroll %s checks", async (method, label) => {
      const character = caster();
      character.ruleset = "dragonlance-user-pack";
      character.languages = ["Common", "Magius"];
      saveEditable(character);
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      expect(screen.getByRole("option", { name: "Decipher Script check" })).toBeDefined();
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: method } });
      expect(screen.getByText(/Magius grants a \+2 competence bonus/)).toBeDefined();
      fireEvent.change(screen.getByLabelText(label), { target: { value: "20" } });
      expect(screen.queryByText(/Deciphering failed/)).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "One day of study completed" }));
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().wizardSpellLearning?.Web).toMatchObject({
        source: "scroll",
        decipherMethod: method,
        decipherTotal: 22,
        spellcraftTotal: 17,
      });
    });

    it("does not apply Magius's scroll-reading bonus when copying another spellbook", async () => {
      const character = caster();
      character.ruleset = "dragonlance-user-pack";
      character.languages = ["Common", "Magius"];
      saveEditable(character);
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: "spellbook" } });
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      fireEvent.change(screen.getByLabelText("Deciphering method"), { target: { value: "spellcraft" } });
      expect(screen.queryByText(/Magius grants a \+2 competence bonus/)).toBeNull();
      expect(screen.queryByRole("option", { name: "Decipher Script check" })).toBeNull();
      fireEvent.change(screen.getByLabelText("Deciphering Spellcraft total"), { target: { value: "20" } });
      expect(screen.getByRole("alert").textContent).toContain("Deciphering failed");
    });

    it("read magic bypasses deciphering rolls but not the learning check; cancelled attempts change nothing", async () => {
      const character = caster();
      saveEditable(character);
      const savedBeforeAttempt = stored();
      render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Shield" } });
      expect(screen.queryByLabelText("Deciphering Spellcraft total")).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "One day of study completed" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "15" } });
      expect(screen.getByRole("alert").textContent).toContain("another rank in Spellcraft");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass).toEqual(savedBeforeAttempt.knownSpellsByClass);
      expect(stored().spellAcquisitionByClass).toEqual(savedBeforeAttempt.spellAcquisitionByClass);
      expect(stored().wizardSpellLearning).toEqual(savedBeforeAttempt.wizardSpellLearning);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      expect(screen.getByLabelText<HTMLSelectElement>("Wizard spell").value).toBe("");
      fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it.each(["spellbook", "research", "reward"] as const)("records %s acquisition without converting it into a free level-up spell", async (source) => {
      const character = caster();
      saveEditable(character);
      const view = render(<App />);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: source } });
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      if (source === "spellbook") {
        expect(screen.getByText(/typical access fee is 100 gp/)).toBeDefined();
        fireEvent.click(screen.getByRole("checkbox", { name: "Writing successfully deciphered using the method above" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "One day of study completed" }));
        fireEvent.change(screen.getByLabelText("Learning Spellcraft total"), { target: { value: "17" } });
        fireEvent.click(screen.getByRole("checkbox", { name: "Writing time and material cost resolved with the DM" }));
      } else {
        expect(screen.queryByLabelText("Learning Spellcraft total")).toBeNull();
        fireEvent.click(screen.getByRole("checkbox", { name: /DM approved this spell/ }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().spellAcquisitionByClass?.wizard?.Web).toBe(source);
      expect(stored().wizardSpellLearning?.Web?.source).toBe(source);
      expect(Number.isFinite(Date.parse(stored().wizardSpellLearning?.Web?.learnedAt ?? ""))).toBe(true);
      view.unmount();
      render(<App />);
      await openSpells(false);
      expect(screen.getByText("Web", { exact: true })).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Learn a spell" }));
      expect(within(screen.getByLabelText("Wizard spell")).queryByRole("option", { name: "Web (Level 2)" })).toBeNull();
    });

    it("resets pending check results when the spell or source changes", async () => {
      saveEditable(caster());
      render(<App />);
      await openSpells(false);
      fillCopiedSpell("Shield");
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(false);
      fireEvent.change(screen.getByLabelText("Wizard spell"), { target: { value: "Web" } });
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
      expect(screen.getByLabelText<HTMLInputElement>("Learning Spellcraft total").value).toBe("");
      fireEvent.change(screen.getByLabelText("Spell source"), { target: { value: "reward" } });
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Record learned spell" }).disabled).toBe(true);
    });

    it("preserves higher-level and unrecognized imported entries, but does not offer them for preparation", async () => {
      const character = caster();
      character.knownSpellsByClass = { wizard: ["Magic Missile", "Wish", "Imported Mystery"] };
      character.knownSpells = ["Magic Missile", "Wish", "Imported Mystery"];
      save(character);
      render(<App />);
      await openSpells(false);
      expect(screen.getByRole("alert").textContent).toContain("Imported Mystery");
      expect(screen.getByText("Wish", { exact: true })).toBeDefined();
      expect(screen.getByText(/not currently available to prepare/)).toBeDefined();
      fireEvent.click(screen.getByRole("tab", { name: "Daily Preparation" }));
      expect(screen.queryByRole("spinbutton", { name: "Prepare Wish" })).toBeNull();
      expect(screen.queryByRole("spinbutton", { name: "Prepare Acid Splash" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toEqual(character.knownSpellsByClass.wizard);
    });

    it("keeps learning during level-up provisional and does not count copying toward free additions", async () => {
      const character = caster();
      save(character);
      render(<App />);
      await screen.findByRole("button", { name: "Spells" });
      fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "wizard" } });
      await screen.findByRole("button", { name: "Learn a spell" });
      fillCopiedSpell("Web");
      fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
      expect(screen.getByText(/Free level-up spells: 0\/2/)).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
      expect(screen.queryByText("Web", { exact: true })).toBeNull();
      expect(stored()).toEqual(character);
    });

    it("adds starting cantrips and free spells without copying costs and allows revising draft choices", async () => {
      render(<App />);
      await screen.findByRole("button", { name: "Class" });
      fireEvent.click(screen.getByRole("button", { name: "Class" }));
      const wizardOption = screen.getByRole("option", { name: /^Wizard/ });
      expect(wizardOption.textContent).toContain("Source: D&D 3.5 Core SRD");
      expect(wizardOption.textContent).toContain("Book: Player's Handbook (3.5)");
      fireEvent.click(wizardOption);
      await openSpells(false);
      fireEvent.click(screen.getByRole("button", { name: "Add starting cantrips" }));
      expect(screen.getByText("Detect Magic", { exact: true })).toBeDefined();
      const freeSpell = screen.getByLabelText("Free wizard spell");
      expect(within(freeSpell).getByRole("option", { name: "Magic Missile (Level 1)" })).toBeDefined();
      fireEvent.change(freeSpell, { target: { value: "Magic Missile" } });
      fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
      expect(screen.queryByLabelText("Learning Spellcraft total")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(stored().knownSpellsByClass?.wizard).toContain("Detect Magic");
      expect(stored().knownSpellsByClass?.wizard).toContain("Magic Missile");
      expect(stored().wizardSpellLearning).toBeUndefined();
    });

    it.each([
      { Shield: { source: "unknown", learnedAt: "2026-10-25T00:00:00Z" } },
      { Shield: { source: "scroll", learnedAt: "not a date" } },
      { Shield: { source: "scroll", learnedAt: "2026-10-25T00:00:00Z", spellcraftTotal: "17" } },
    ])("rejects malformed imported learning records", (wizardSpellLearning) => {
      expect(() => parseCharacter({ ...caster(), wizardSpellLearning })).toThrow(/spell progression/);
    });
  });

  it("indexes paladin/ranger slots from first level, not cantrips, and uses Wisdom", () => {
    const character = caster();
    expect(getSpellcastingAbility("paladin")).toBe("wis");
    expect(baseSpellSlots("paladin", 8, 1)).toBe(1);
    expect(baseSpellSlots("paladin", 8, 2)).toBe(0);
    expect(getDailySpellSlots(character, "paladin", 4, 1)).toBe(1);
    expect(getDailySpellSlots(character, "paladin", 4, 2)).toBe(0);
    expect(getDailySpellSlots(character, "ranger", 8, 2)).toBe(1);
    expect(getCasterLevel("paladin", 3)).toBe(0);
    expect(getCasterLevel("paladin", 4)).toBe(2);
    expect(getCasterLevel("paladin", 5)).toBe(2);
    expect(getCasterLevel("ranger", 4)).toBe(2);
    expect(getCasterLevel("ranger", 8)).toBe(4);
    expect(getCasterLevel("wizard", 3)).toBe(3);
  });

  it("matches the PHB Paladin and Ranger spell-slot progression at every level", () => {
    const expectedSlotsByLevel = [
      [], [], [], [0], [0], [1], [1], [1, 0], [1, 0], [1, 1],
      [1, 1, 0], [1, 1, 1], [1, 1, 1], [2, 1, 1, 0],
      [2, 1, 1, 1], [2, 2, 1, 1], [2, 2, 2, 1], [3, 2, 2, 1],
      [3, 3, 3, 2], [3, 3, 3, 3],
    ];
    for (const classId of ["paladin", "ranger"] as const) {
      expectedSlotsByLevel.forEach((slots, index) => {
        const classLevel = index + 1;
        for (let spellLevel = 1; spellLevel <= 4; spellLevel++) {
          expect(baseSpellSlots(classId, classLevel, spellLevel)).toBe(
            slots[spellLevel - 1] ?? 0,
          );
          expect(hasSpellLevelAtClassLevel(classId, classLevel, spellLevel)).toBe(
            spellLevel <= slots.length,
          );
        }
      });
    }
  });

  it("applies Dragonlance High Sorcery phase and conjunction modifiers to caster level and DC", () => {
    const character = highSorceryCaster();
    character.dragonlanceMoonState = {
      phases: { lunitari: "waxing-gibbous" },
      conjunction: "none",
    };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    expect(getCasterLevel("wizard", 3, character)).toBe(4);
    expect(getSpellSaveDC(character, "wizard", 2)).toBe(16);
    expect(getSpellSaveDC(character, "wizard", 2, undefined, false)).toBe(15);

    character.dragonlanceMoonState.phases!.lunitari = "new";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(-1);
    expect(getCasterLevel("wizard", 3, character)).toBe(2);
    expect(getSpellSaveDC(character, "wizard", 2)).toBe(14);

    character.dragonlanceMoonState.conjunction = "lunitari-nuitari";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(0);
    character.dragonlanceMoonState.conjunction = "all";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    character.dragonlanceMoonState.phases!.lunitari = "full";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(3);

    character.highSorceryOrder = "white";
    character.dragonlanceMoonState = { phases: { solinari: "full" } };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);
    character.highSorceryOrder = "black";
    character.dragonlanceMoonState = { phases: { nuitari: "full" } };
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(1);

    character.ruleset = "core-35-srd";
    expect(getHighSorceryMoonModifier(character, "wizard")).toBe(0);
    character.ruleset = "dragonlance-user-pack";
    expect(getHighSorceryMoonModifier(character, "cleric")).toBe(0);
  });

  it("does not grant bonus slots above class access or below the required casting ability", () => {
    const character = caster();
    character.abilities.int = 30;
    expect(getDailySpellSlots(character, "wizard", 3, 3)).toBe(0);
    character.abilities.int = 11;
    expect(getDailySpellSlots(character, "wizard", 3, 2)).toBe(0);
    expect(getDailySpellSlots(character, "wizard", 3, 0)).toBe(4);
    expect(baseSpellSlots("wizard", 0, 1)).toBe(0);
  });

  it("uses SRD bard and sorcerer known-spell limits without ability bonus spells known", () => {
    const character = caster();
    expect(baseSpellSlots("sorcerer", 1, 0)).toBe(5);
    expect(baseSpellSlots("sorcerer", 1, 1)).toBe(3);
    expect(baseSpellSlots("sorcerer", 4, 2)).toBe(3);
    expect(getDailySpellSlots(character, "sorcerer", 1, 1)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 2, 1)).toBe(2);
    expect(getKnownSpellLimit(character, "sorcerer", 4, 2)).toBe(1);
    expect(getKnownSpellLimit(character, "sorcerer", 20, 0)).toBe(9);
    character.abilities.cha = 19;
    expect(getKnownSpellLimit(character, "sorcerer", 20, 9)).toBe(3);
    expect(getKnownSpellLimit(character, "bard", 1, 1)).toBe(0);
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(2);
    character.abilities.cha = 12;
    expect(getKnownSpellLimit(character, "bard", 4, 2)).toBe(2);
    expect(getDailySpellSlots(character, "bard", 4, 2)).toBe(0);
    expect(baseSpellSlots("bard", 14, 0)).toBe(4);
    character.abilities.cha = 16;
    expect(getKnownSpellLimit(character, "bard", 20, 6)).toBe(4);

    character.abilities.cha = 9;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(0);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(0);
    character.abilities.cha = 10;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(0);
    character.abilities.cha = 11;
    expect(getKnownSpellLimit(character, "sorcerer", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "sorcerer", 1, 1)).toBe(2);

    character.abilities.cha = 11;
    expect(getKnownSpellLimit(character, "bard", 2, 1)).toBe(2);
    expect(getDailySpellSlots(character, "bard", 2, 1)).toBe(0);
  });

  it("limits Bard and Sorcerer known-spell replacements to their class-level schedules", () => {
    const replacementLimit = (
      classId: "bard" | "sorcerer",
      originalLevel: number,
      proposedLevel: number,
    ) => {
      const original = cloneCharacter(caster());
      original.classLevels = [{ classId, level: originalLevel }];
      const proposed = cloneCharacter(original);
      proposed.classLevels[0].level = proposedLevel;
      return getKnownSpellReplacementLevelLimit(original, proposed, classId);
    };

    expect(replacementLimit("bard", 4, 5)).toBe(0);
    expect(replacementLimit("bard", 5, 6)).toBeUndefined();
    expect(replacementLimit("bard", 7, 8)).toBe(1);
    expect(replacementLimit("sorcerer", 3, 4)).toBe(0);
    expect(replacementLimit("sorcerer", 4, 5)).toBeUndefined();
    expect(replacementLimit("sorcerer", 5, 6)).toBe(1);
  });

  it("validates Sorcerer spell replacements by level and class-level milestone", () => {
    const sorcererSpells = getClassSpells("sorcerer");
    const cantrips = sorcererSpells.filter((spell) => spell.level === 0);
    const firstLevelSpells = sorcererSpells.filter((spell) => spell.level === 1);
    const secondLevelSpell = sorcererSpells.find((spell) => spell.level === 2);
    if (
      cantrips.length < 3 ||
      firstLevelSpells.length < 2 ||
      !secondLevelSpell
    ) {
      throw new Error("Expected Sorcerer spell choices are missing from the catalog.");
    }

    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "sorcerer", level: 3 }];
    original.abilities.cha = 18;
    original.knownSpellsByClass = { sorcerer: [cantrips[0].name] };
    original.knownSpells = [cantrips[0].name];
    const validReplacement = cloneCharacter(original);
    validReplacement.classLevels[0].level = 4;
    const validKnownSpells = [
      cantrips[1].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    validReplacement.knownSpellsByClass = { sorcerer: validKnownSpells };
    validReplacement.knownSpells = validKnownSpells;
    expect(getLevelUpSpellWarnings(original, validReplacement)).toEqual([]);

    const highLevelOriginal = cloneCharacter(original);
    highLevelOriginal.knownSpellsByClass = {
      sorcerer: [firstLevelSpells[0].name],
    };
    highLevelOriginal.knownSpells = [firstLevelSpells[0].name];
    const invalidReplacement = cloneCharacter(highLevelOriginal);
    invalidReplacement.classLevels[0].level = 4;
    const invalidKnownSpells = [
      firstLevelSpells[1].name,
      cantrips[0].name,
      secondLevelSpell.name,
    ];
    invalidReplacement.knownSpellsByClass = {
      sorcerer: invalidKnownSpells,
    };
    invalidReplacement.knownSpells = invalidKnownSpells;
    expect(getLevelUpSpellWarnings(highLevelOriginal, invalidReplacement)).toContain(
      "The exchanged spell must be at least two levels below the highest spell level available.",
    );

    const wrongLevelOriginal = cloneCharacter(validReplacement);
    const wrongLevel = cloneCharacter(wrongLevelOriginal);
    wrongLevel.classLevels[0].level = 5;
    const wrongLevelKnownSpells = [
      cantrips[0].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    wrongLevel.knownSpellsByClass = { sorcerer: wrongLevelKnownSpells };
    wrongLevel.knownSpells = wrongLevelKnownSpells;
    expect(getLevelUpSpellWarnings(wrongLevelOriginal, wrongLevel)).toContain(
      "A Sorcerer may replace spells only at qualifying class levels.",
    );
  });

  it("uses the Dragonlance Mystic spells-per-day and spells-known tables", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.abilities.wis = 11;
    expect(baseSpellSlots("mystic", 1, 0)).toBe(5);
    expect(baseSpellSlots("mystic", 1, 1)).toBe(3);
    expect(baseSpellSlots("mystic", 2, 0)).toBe(6);
    expect(baseSpellSlots("mystic", 4, 2)).toBe(3);
    expect(baseSpellSlots("mystic", 20, 9)).toBe(6);
    expect(hasSpellLevelAtClassLevel("mystic", 1, 0)).toBe(true);
    expect(hasSpellLevelAtClassLevel("mystic", 1, 2)).toBe(false);
    expect(getDailySpellSlots(character, "mystic", 1, 1)).toBe(3);
    expect(getDailySpellSlots(character, "mystic", 1, 0)).toBe(5);
    character.abilities.wis = 18;
    expect(getDailySpellSlots(character, "mystic", 1, 1)).toBe(4);
    expect(getDailySpellSlots(character, "mystic", 1, 0)).toBe(5);
    character.classLevels = [{ classId: "mystic", level: 1 }];
    expect(getKnownSpellLimit(character, "mystic", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(2);
    expect(getKnownSpellLimit(character, "mystic", 4, 2)).toBe(1);
    expect(getKnownSpellLimit(character, "mystic", 20, 9)).toBe(3);
    character.mysticDomain = "animal";
    expect(getKnownSpellLimit(character, "mystic", 1, 0)).toBe(4);
    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(3);
    expect(getKnownSpellLimit(character, "mystic", 4, 2)).toBe(2);
    expect(getKnownSpellLimit(character, "mystic", 20, 9)).toBe(4);
    expect(getClassSpells("mystic").map((spell) => spell.name)).toContain("Cure Light Wounds");
    expect(getClassSpells("mystic").map((spell) => spell.name)).not.toContain("Magic Missile");
  });

  it("warns when Mystic level-up gains new spells known", () => {
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 1 }];
    original.mysticDomain = "animal";
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;

    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Learn 1 additional 0-level Mystic spell.",
    ]);
  });

  it("allows one same-level Mystic replacement and counts a newly accessible domain spell automatically", () => {
    const mysticSpells = getClassSpells("mystic");
    const cantrips = mysticSpells.filter((spell) => spell.level === 0);
    const secondLevelSpell = mysticSpells.find((spell) => spell.level === 2);
    if (cantrips.length < 3 || !secondLevelSpell) {
      throw new Error("Expected Mystic spell choices are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 3 }];
    original.mysticDomain = "animal";
    original.knownSpellsByClass = { mystic: [cantrips[0].name] };
    original.knownSpells = [cantrips[0].name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const proposedKnownSpells = [
      cantrips[1].name,
      cantrips[2].name,
      secondLevelSpell.name,
    ];
    proposed.knownSpellsByClass = {
      mystic: proposedKnownSpells,
    };
    proposed.knownSpells = proposedKnownSpells;

    expect(getMysticSpellReplacementLevelLimit(original, proposed)).toBe(0);
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([]);
  });

  it("limits Mystic replacements to eligible levels and qualifying Mystic levels", () => {
    const firstLevelSpells = getClassSpells("mystic").filter((spell) => spell.level === 1);
    const cantrip = getClassSpells("mystic").find((spell) => spell.level === 0);
    const alternateCantrip = getClassSpells("mystic").find(
      (spell) => spell.level === 0 && spell.name !== cantrip?.name,
    );
    const secondLevelSpell = getClassSpells("mystic").find((spell) => spell.level === 2);
    if (firstLevelSpells.length < 2 || !cantrip || !alternateCantrip || !secondLevelSpell) {
      throw new Error("Expected Mystic spell choices are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 3 }];
    original.mysticDomain = "animal";
    original.knownSpellsByClass = { mystic: [firstLevelSpells[0].name] };
    original.knownSpells = [firstLevelSpells[0].name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const proposedKnownSpells = [
      firstLevelSpells[1].name,
      cantrip.name,
      secondLevelSpell.name,
    ];
    proposed.knownSpellsByClass = {
      mystic: proposedKnownSpells,
    };
    proposed.knownSpells = proposedKnownSpells;

    expect(getLevelUpSpellWarnings(original, proposed)).toContain(
      "The exchanged spell must be at least two levels below the highest spell level available.",
    );
    const fifthLevel = cloneCharacter(proposed);
    fifthLevel.classLevels[0].level = 5;
    const fifthLevelKnownSpells = (proposed.knownSpellsByClass?.mystic ?? [])
      .map((name) => name === cantrip.name ? alternateCantrip.name : name);
    fifthLevel.knownSpellsByClass = { mystic: fifthLevelKnownSpells };
    fifthLevel.knownSpells = fifthLevelKnownSpells;
    expect(getMysticSpellReplacementLevelLimit(proposed, fifthLevel)).toBeUndefined();
    expect(getLevelUpSpellWarnings(proposed, fifthLevel)).toContain(
      "A Mystic may replace spells only at qualifying class levels.",
    );
  });

  it("requires a Mystic domain when gaining a Mystic level", () => {
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 1 }];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 2;

    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Choose one Mystic domain; its bonus spells are inactive until selected.",
    ]);
  });

  it("shows a Mystic domain spell as automatically known without persisting it as a learned spell", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "animal";
    const onKnownSpellsChange = vi.fn();
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={onKnownSpellsChange} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByRole("row", { name: /Calm Animals \(Domain\)/ })).toBeDefined();
    expect(screen.getByText("Known 1/3")).toBeDefined();
    expect(onKnownSpellsChange).not.toHaveBeenCalled();
  });

  it("shows Dragonlance domain powers manually and displays verified spell details", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 14 }];
    character.mysticDomain = "forge";
    character.abilities.wis = 20;
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByText(/Forge domain power \(manual\): Gain a \+2 insight bonus/)).toBeDefined();
    const hardeningRow = screen.getByRole("row", { name: /Hardening \(Domain\)/ });
    expect(within(hardeningRow).getByText(/increases a touched item's hardness/i)).toBeDefined();
    expect(within(hardeningRow).getByText(/Book: Dragonlance Campaign Setting/)).toBeDefined();
    expect(screen.queryByText(/Domain spell Hardening .*resolved manually/)).toBeNull();
  });

  it("shows Random Action as a Dragonlance-only spell with its legacy source", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "dragonlance-user-pack";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "passion";
    render(<SpellSheets character={character} editable={false}
      onKnownSpellsChange={vi.fn()} onPreparedSpellsChange={vi.fn()}
      onSpellAcquisitionChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);

    const randomActionRow = screen.getByRole("row", { name: /Random Action \(Domain\)/ });
    expect(within(randomActionRow).getByText(/compels one living creature/i)).toBeDefined();
    expect(within(randomActionRow).getByText(
      /Book: Player's Handbook \(3\.0\), p\. 242; Dragonlance Campaign Setting, p\. 103/,
    )).toBeDefined();
    expect(screen.queryByText(/Domain spell Random Action .*resolved manually/)).toBeNull();
  });

  it("lets a Mystic replace one eligible known spell without exposing the automatic domain spell", async () => {
    const user = userEvent.setup();
    const original = cloneCharacter(initialCharacter);
    original.ruleset = "dragonlance-user-pack";
    original.classLevels = [{ classId: "mystic", level: 5 }];
    original.mysticDomain = "healing";
    const levelOneSpells = getClassSpells("mystic").filter((spell) => spell.level === 1);
    const domainSpellIndex = levelOneSpells.findIndex(
      (spell) => spell.name === "Cure Light Wounds",
    );
    const originalSpell = levelOneSpells[domainSpellIndex + 1];
    const replacementSpell = levelOneSpells.find(
      (spell) => spell.name !== originalSpell?.name && spell.name !== "Cure Light Wounds",
    );
    if (domainSpellIndex < 0 || !originalSpell || !replacementSpell) {
      throw new Error("Expected healing-domain spell choices are missing from the catalog.");
    }
    original.knownSpellsByClass = { mystic: [originalSpell.name] };
    original.knownSpells = [originalSpell.name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 6;
    const onKnownSpellsChange = vi.fn();

    render(<SpellSheets character={proposed} levelUpOriginal={original}
      levelUpClassId="mystic" editable onKnownSpellsChange={onKnownSpellsChange}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()} onExpendedSpellSlotsChange={vi.fn()}
      onClericCastingChange={vi.fn()} onCombatCastingContextChange={vi.fn()} />);

    const domainRow = screen.getByRole("row", { name: /Cure Light Wounds \(Domain\)/ });
    expect(domainRow).toBeDefined();
    expect(within(domainRow).queryByRole("button")).toBeNull();
    await user.click(screen.getByRole("button", {
      name: `${originalSpell.name} (Level 1)`,
    }));
    await user.click(screen.getByRole("option", {
      name: new RegExp(`${replacementSpell.name} \\(Level 1\\)`),
    }));
    expect(onKnownSpellsChange).toHaveBeenLastCalledWith([replacementSpell.name], "mystic");
  });

  it("does not apply Mystic domain spells or known-spell bonuses to Core characters", () => {
    const character = cloneCharacter(initialCharacter);
    character.ruleset = "core-35-srd";
    character.classLevels = [{ classId: "mystic", level: 1 }];
    character.mysticDomain = "animal";

    expect(getKnownSpellLimit(character, "mystic", 1, 1)).toBe(2);
    expect(getLevelUpSpellWarnings(character, {
      ...character,
      classLevels: [{ classId: "mystic", level: 2 }],
    })).toEqual(["Learn 1 additional 0-level Mystic spell."]);
  });

  it("requires two wizard level-up additions in total, not two at every spell level", () => {
    const original = caster();
    original.classLevels[0].level = 2;
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 3;
    proposed.knownSpellsByClass = { wizard: [...(original.knownSpellsByClass?.wizard ?? []), "Shield", "Web"] };
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([]);
    proposed.spellAcquisitionByClass = { wizard: { Web: "scroll" } };
    expect(getLevelUpSpellWarnings(original, proposed)).toEqual([
      "Add 1 Wizard spell to the spellbook (any accessible spell level).",
    ]);
  });

  it("assigns ambiguous legacy spells once and respects explicit empty class lists", () => {
    const character = caster();
    delete character.knownSpellsByClass;
    delete character.preparedSpellsByClass;
    character.knownSpells = ["Detect Magic", "Magic Missile", "Cure Light Wounds"];
    character.preparedSpells = ["Detect Magic"];
    character.knownSpellClasses = { "Detect Magic": "cleric" };
    expect(getClassSpellSelections(character, "knownSpells")).toEqual({
      wizard: ["Magic Missile"], cleric: ["Detect Magic", "Cure Light Wounds"],
    });
    expect(getClassSpellSelections(character, "preparedSpells")).toEqual({ cleric: ["Detect Magic"] });
    character.knownSpellsByClass = { wizard: [], cleric: ["Detect Magic", "Cure Light Wounds"] };
    expect(getClassSpellSelections(character, "knownSpells").wizard).toEqual([]);
    expect(character.knownSpells).toHaveLength(3);
  });

  it.each([
    { wizard: { "1": [-1] } }, { wizard: { "1": [1.5] } },
    { wizard: { "10": [0] } }, { notAClass: { "1": [0] } },
  ])("rejects malformed imported slot usage %j", (value) => {
    expect(() => parseCharacter({ ...caster(), expendedSpellSlotsByClass: value })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: "completed" },
    { notAClass: true },
  ])("rejects malformed daily preparation state %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      spellPreparationCompletedByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1.5] } },
    { wizard: { Daze: [10] } },
    { notAClass: { Daze: [1] } },
  ])("rejects malformed prepared spell slot levels %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      preparedSpellSlotLevelsByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Empower metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      empowerByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Maximize metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      maximizeByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Extend metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      extendByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Enlarge metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      enlargeByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Quicken metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      quickenByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Silent metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      silentByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Still metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      stillByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Widen metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      widenByClass: value,
    })).toThrow(/spell progression/);
  });

  it.each([
    { wizard: { Daze: [1] } },
    { wizard: { Daze: ["true"] } },
    { notAClass: { Daze: [true] } },
  ])("rejects malformed prepared Sculpt metadata %j", (value) => {
    expect(() => parseCharacter({
      ...caster(),
      sculptByClass: value,
    })).toThrow(/spell progression/);
  });
});

describe("caster class subtabs", () => {
  it("shows a Gnome's increased DC for individual illusion spells", async () => {
    const character = caster();
    character.race = "Gnome";
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    save(character);
    render(<App />);
    const panel = await openSpells();
    const spellRow = within(panel).getByRole("row", { name: /Ghost Sound/ });
    expect(within(spellRow).getByText("Will disbelief (if interacted with)")).toBeDefined();
    expect(within(spellRow).getByText("DC 14")).toBeDefined();
  });

  it("applies Spell Focus and Greater Spell Focus only to spells from the selected school", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound", "Daze"] };
    character.knownSpells = ["Ghost Sound", "Daze"];
    character.featSelections = {
      "general-1": "spell-focus",
      "human-1": "greater-spell-focus",
    };
    character.featSpellSchoolSelections = {
      "general-1": "Illusion",
      "human-1": "Illusion",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const illusionRow = within(panel).getByRole("row", { name: /Ghost Sound/ });
    const enchantmentRow = within(panel).getByRole("row", { name: /Daze/ });
    expect(within(illusionRow).getByText("DC 15")).toBeDefined();
    expect(within(enchantmentRow).getByText("DC 13")).toBeDefined();
  });

  it("tracks Heighten Spell per prepared copy, including the heightened DC and slot", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "heighten-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "2" },
    });

    fireEvent.change(within(spellRow).getByRole("combobox", {
      name: "Prepared Ghost Sound copy 1 slot level",
    }), { target: { value: "2" } });

    expect(within(spellRow).getByText("Copy 1: DC 15 (Heightened to level 2)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 2: DC 13")).toBeDefined();
    expect(cantrips.getByText(/Prepared 1\//)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellSlotLevelsByClass?.wizard).toEqual({ "Ghost Sound": [2, 0] });
  });

  it("tracks Empower per prepared copy, adds its slot cost to Heighten, and preserves the DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 7 }, { classId: "cleric", level: 1 }];
    character.abilities.int = 13;
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "heighten-spell",
      "general-2": "empower-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "2" },
    });
    fireEvent.change(within(spellRow).getByRole("combobox", {
      name: "Prepared Ghost Sound copy 1 slot level",
    }), { target: { value: "2" } });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Heightened to level 2; Empowered in level 4 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\/1/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellSlotLevelsByClass?.wizard).toEqual({ "Ghost Sound": [2, 0] });
    expect(stored().empowerByClass?.wizard).toEqual({ "Ghost Sound": [true, false] });
  });

  it("uses a higher slot for an Empowered copy without raising its save DC", async () => {
    const character = caster();
    character.featSelections = { "general-1": "empower-spell" };
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Empowered in level 2 slot)")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
  });

  it("tracks Extend per prepared copy and leaves duration doubling manual", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "extend-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Extend Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Extended in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Extended")).toBeDefined();
    expect(screen.getByText(/double eligible durations manually/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().extendByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Maximize per prepared copy without changing its save DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 5 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "heighten-spell",
      "general-2": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Maximized in level 3 slot)")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 3 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().maximizeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("stacks Maximize and Empower slot costs on one prepared copy", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "empower-spell",
      "general-2": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Empowered and Maximized in level 5 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 5 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().empowerByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().maximizeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("adds all four metamagic slot adjustments cumulatively", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 13 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "extend-spell",
      "general-2": "empower-spell",
      "general-3": "maximize-spell",
      "general-4": "enlarge-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Extend Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Enlarge Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Extended and Empowered and Maximized and Enlarged in level 7 slot)",
    )).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Enlarged")).toBeDefined();
    expect(screen.getByText(/manually increase only distance-defined/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 7 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().enlargeByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Quicken per prepared copy at four slot levels higher", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = { "general-1": "quicken-spell" };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened in level 4 slot)",
    )).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Quickened")).toBeDefined();
    expect(screen.getByText(/casting-time eligibility, swift-action casting, the once-per-round and shared swift-action limits/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Silent's slot cost per copy and leaves component changes manual", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 9 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "silent-spell",
      "general-2": "quicken-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Silence Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Silenced in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Silenced")).toBeDefined();
    expect(screen.getByText(/Verify a verbal component is present and omit it manually; bard spells cannot use this feat/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Silenced in level 5 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 5 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().silentByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Still per prepared copy and stacks its slot cost", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 11 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "still-spell",
      "general-2": "silent-spell",
      "general-3": "quicken-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Still Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Stilled in level 1 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Stilled")).toBeDefined();
    expect(screen.getByText(/Verify a somatic component is present and omit it manually; bard spells with somatic components can benefit/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Silence Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText("Copy 1: DC 13 (Silenced and Stilled in level 2 slot)")).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Silenced and Stilled in level 6 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 6 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().stillByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().silentByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("tracks Widen and Sculpt slot costs per prepared copy", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 17 }, { classId: "cleric", level: 1 }];
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "widen-spell",
      "general-2": "quicken-spell",
      "general-3": "sculpt-spell",
      "general-4": "split-ray",
      "general-5": "sudden-extend",
      "general-6": "sudden-widen",
      "general-7": "sudden-empower",
      "general-8": "sudden-maximize",
      "general-9": "sudden-silent",
      "general-10": "sudden-still",
      "general-11": "sudden-quicken",
      "general-12": "delay-spell",
      "general-13": "fortify-spell",
      "general-14": "transdimensional-spell",
      "general-15": "persistent-spell",
      "general-16": "repeat-spell",
      "general-17": "twin-spell",
      "general-18": "chain-spell",
      "general-19": "cooperative-spell",
      "general-20": "sanctum-spell",
      "general-21": "explosive-spell",
      "general-22": "black-lore-of-moil",
      "general-23": "energy-substitution-electricity",
      "general-24": "energy-admixture-acid",
      "general-25": "nonlethal-substitution",
      "general-26": "born-of-the-three-thunders",
      "general-27": "lord-of-the-uttercold",
      "general-28": "extend-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const cantrips = spellLevel(panel, "CANTRIPS");
    const spellRow = cantrips.getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Widen Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Sculpt Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText("Copy 1: DC 13 (Widened and Sculpted in level 4 slot)")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Widened")).toBeDefined();
    expect(within(spellRow).getByText("Copy 1: Sculpted")).toBeDefined();
    expect(screen.getByText(/Verify a burst, emanation, line, or spread area and double its numeric measurements manually/)).toBeDefined();
    expect(screen.getByText(/choose one of the feat's area shapes manually/i)).toBeDefined();
    expect(screen.getByText(/Split Ray remains manual: use a slot two levels higher/)).toBeDefined();
    expect(screen.getByText(/Sudden metamagic effects remain manual: each selected feat can be used once per day/)).toBeDefined();
    expect(screen.getByText(/except Sudden Quicken is cast as a swift action/)).toBeDefined();
    expect(screen.getByText(/Delay Spell remains manual: use an area, personal, or touch spell/)).toBeDefined();
    expect(screen.getByText(/Fortify Spell remains manual: use a slot at least one level higher/)).toBeDefined();
    expect(screen.getByText(/Transdimensional Spell remains manual: slot \+1 for incorporeal, Ethereal, Plane of Shadow, or extradimensional creatures; perceive direct targets; bursts, cones, emanations, and spreads affect unseen creatures/)).toBeDefined();
    expect(screen.getByText(/Persistent Spell remains manual: only fixed- or personal-range spells/)).toBeDefined();
    expect(screen.getByText(/Repeat Spell remains manual: use a slot three levels higher/)).toBeDefined();
    expect(screen.getByText(/Twin Spell remains manual: use a slot four levels higher/)).toBeDefined();
    expect(screen.getByText(/Chain Spell remains manual: choose a single-target spell/)).toBeDefined();
    expect(screen.getByText(/Cooperative Spell remains manual: adjacent casters/)).toBeDefined();
    expect(screen.getByText(/Sanctum Spell remains manual: track whether you are in your designated sanctum/)).toBeDefined();
    expect(screen.getByText(/Explosive Spell remains manual: only area spells with Reflex saves qualify/)).toBeDefined();
    expect(screen.getByText(/Black Lore of Moil remains manual: choose a necromancy spell/)).toBeDefined();
    expect(screen.getByText(/Energy Substitution remains manual: apply the selected energy type/)).toBeDefined();
    expect(screen.getByText(/Energy Admixture remains manual: add equal damage of the selected type/)).toBeDefined();
    expect(screen.getByText(/Nonlethal Substitution remains manual: record one chosen energy type/)).toBeDefined();
    expect(screen.getByText(/Born of the Three Thunders remains manual: for hit-point-damaging electricity or sonic spells/)).toBeDefined();
    expect(screen.getByText(/Lord of the Uttercold remains manual: verify you can cast a cold-descriptor spell/)).toBeDefined();
    expect(spellLevel(panel, "LEVEL 4 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    expect(within(spellRow).getByText(
      "Copy 1: DC 13 (Quickened and Widened and Sculpted in level 8 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 8 SPELLS").getByText(/Prepared 1\//)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().widenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().sculptByClass?.wizard).toEqual({ "Ghost Sound": [true] });
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("adds Quicken's four levels to other prepared metamagic without raising DC", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 17 }, { classId: "cleric", level: 1 }];
    character.abilities.int = 18;
    character.knownSpellsByClass = { wizard: ["Ghost Sound"] };
    character.knownSpells = ["Ghost Sound"];
    character.featSelections = {
      "general-1": "quicken-spell",
      "general-2": "empower-spell",
      "general-3": "maximize-spell",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const spellRow = spellLevel(panel, "CANTRIPS").getByRole("row", { name: /Ghost Sound/ });
    fireEvent.change(within(spellRow).getByRole("spinbutton", { name: "Prepare Ghost Sound" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Quicken Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Empower Ghost Sound copy 1",
    }));
    fireEvent.click(within(spellRow).getByRole("checkbox", {
      name: "Maximize Ghost Sound copy 1",
    }));

    expect(within(spellRow).getByText(
      "Copy 1: DC 14 (Empowered and Maximized and Quickened in level 9 slot)",
    )).toBeDefined();
    expect(spellLevel(panel, "LEVEL 9 SPELLS").getByText(/Prepared 1\//)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().quickenByClass?.wizard).toEqual({ "Ghost Sound": [true] });
  });

  it("shows the Spell Penetration check modifier for each spellcasting class", async () => {
    const character = caster();
    character.featSelections = { "general-1": "spell-penetration" };
    save(character);
    render(<App />);
    let panel = await openSpells();
    let modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+5");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("Spell Penetration feats add +2 each");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("Compare manually");

    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+3");
  });

  it("stacks Greater Spell Penetration on each class's spell resistance check", async () => {
    const character = caster();
    character.featSelections = {
      "general-1": "spell-penetration",
      "general-3": "greater-spell-penetration",
    };
    save(character);
    render(<App />);
    let panel = await openSpells();
    let modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+7");
    expect(modifierLabel.parentElement?.getAttribute("title")).toContain("feats add +2 each");

    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+5");
  });

  it("uses Practiced Spellcaster's class caster level for spell resistance checks", async () => {
    const character = caster();
    character.skills.Spellcraft = 4;
    character.featSelections = {
      "general-1": "spell-penetration",
      "general-3": "practiced-spellcaster-wizard",
    };
    save(character);
    render(<App />);
    let panel = await openSpells();
    let modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+6");

    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+3");
  });

  it("applies Mage Slayer's caster-level penalty to spell resistance checks", async () => {
    const character = caster();
    character.classLevels = [{ classId: "wizard", level: 8 }];
    character.skills.Spellcraft = 4;
    character.featSelections = {
      "general-1": "mage-slayer",
      "general-3": "spell-penetration",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();
    const modifierLabel = within(panel).getByText("SR check modifier", { selector: "small" });
    expect(modifierLabel.parentElement?.textContent).toContain("+6");
  });

  it("shows Wizard 3 and Cleric 1 with separate abilities, levels, slots, DCs and lists", async () => {
    save(caster());
    render(<App />);
    let panel = await openSpells();
    expect(within(screen.getByRole("tablist", { name: "Spellcasting classes" })).getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Wizard · 3" }).getAttribute("aria-selected")).toBe("true");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Ability").value).toBe("INT 16");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Class and Level").value).toBe("Wizard 3");
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 15")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("2 daily slots")).toBeDefined();
    expect(within(panel).queryByText("LEVEL 3 SPELLS")).toBeNull();
    expect(within(panel).getByText("Magic Missile", { exact: true })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    panel = screen.getByRole("tabpanel");
    expect(within(panel).getByLabelText<HTMLInputElement>("Spellcasting Ability").value).toBe("WIS 14");
    expect(within(panel).queryByText("LEVEL 2 SPELLS")).toBeNull();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText("Save DC 13")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 1 SPELLS").getByText("2 daily slots")).toBeDefined();
    expect(within(panel).queryByText("Magic Missile", { exact: true })).toBeNull();
    expect(within(panel).getByText("Cure Light Wounds", { exact: true })).toBeDefined();
    expect(within(panel).getByRole("heading", { name: "Cleric Domains" })).toBeDefined();
    expect(within(panel).getByText(/Spontaneous casting: good clerics/)).toBeDefined();
    expect(within(panel).getByText(/Domain slots cannot be converted; track the replacement manually/)).toBeDefined();
  });

  it("lets a Dragonlance High Sorcery character set moons and applies the current effect", async () => {
    const character = highSorceryCaster();
    character.dragonlanceMoonState = {
      phases: { lunitari: "new" },
      conjunction: "none",
    };
    save(character);
    render(<App />);
    const panel = await openSpells();

    expect(screen.getByLabelText<HTMLSelectElement>("Lunitari phase").value).toBe("new");
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 14")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Lunitari phase"), { target: { value: "waxing-gibbous" } });
    expect(screen.getByText("Current Lunitari order effect: +1 caster level and +1 spell save DC.")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 16")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Moon conjunction"), { target: { value: "all" } });
    expect(screen.getByText("Current Lunitari order effect: +3 caster level and +3 spell save DC.")).toBeDefined();
    expect(spellLevel(panel, "LEVEL 2 SPELLS").getByText("Save DC 18")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().dragonlanceMoonState).toEqual({
      phases: { lunitari: "waxing-gibbous" },
      conjunction: "all",
    });
  });

  it("locks daily preparation, persists usage, and resets it after a rest", async () => {
    save(caster());
    const view = render(<App />);
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Wizard daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("0");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(false);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass).toEqual({ wizard: ["Detect Magic", "Detect Magic"], cleric: ["Detect Magic"] });
    expect(stored().expendedSpellSlotsByClass).toEqual({ wizard: { "0": [0] }, cleric: { "0": [1] } });
    expect(stored().spellPreparationCompletedByClass).toEqual({ wizard: true, cleric: true });
    view.unmount();
    render(<App />);
    await openSpells();
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("2");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm rest/prayer and recover spell slots" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().expendedSpellSlotsByClass).toEqual({});
    expect(stored().preparedSpellsByClass?.wizard).toEqual(["Detect Magic", "Detect Magic"]);
    expect(stored().spellPreparationCompletedByClass).toEqual({});
  });

  it("requires daily preparation before slot use and locks choices until rest or prayer", async () => {
    const character = caster();
    character.preparedSpellsByClass = { wizard: ["Detect Magic"] };
    save(character);
    render(<App />);
    await openSpells();

    const preparedCopies = screen.getByRole<HTMLInputElement>("spinbutton", {
      name: "Prepare Detect Magic",
    });
    const expendedSlot = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Expended level 0 slot 1",
    });
    expect(expendedSlot.disabled).toBe(true);
    fireEvent.change(preparedCopies, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Wizard daily preparation" }));
    expect(preparedCopies.disabled).toBe(true);
    expect(expendedSlot.disabled).toBe(false);
    fireEvent.click(expendedSlot);
    expect(expendedSlot.checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Confirm rest/prayer and recover spell slots" }));
    expect(preparedCopies.disabled).toBe(false);
    expect(expendedSlot.disabled).toBe(true);
    expect(expendedSlot.checked).toBe(false);
    expect(preparedCopies.value).toBe("2");
  });

  it("recovers all spellcasting classes after rest without changing known or prepared spells", async () => {
    const character = caster();
    character.classLevels.push({ classId: "bard", level: 1 }, { classId: "sorcerer", level: 1 });
    character.knownSpellsByClass = {
      wizard: ["Magic Missile", "Detect Magic", "Invisibility"],
      bard: ["Cure Light Wounds"],
      sorcerer: ["Magic Missile"],
    };
    character.preparedSpellsByClass = {
      wizard: ["Magic Missile", "Detect Magic"],
      cleric: ["Bless"],
    };
    character.expendedSpellSlotsByClass = {
      wizard: { "0": [0], "1": [0] },
      cleric: { "0": [0] },
      bard: { "0": [0] },
      sorcerer: { "0": [0] },
    };
    character.spellPreparationCompletedByClass = {
      wizard: true,
      cleric: true,
    };
    character.clericDomainExpended = [1];
    save(character);
    render(<App />);
    await openSpells();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm rest/prayer and recover spell slots",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(stored().expendedSpellSlotsByClass).toEqual({});
    expect(stored().clericDomainExpended).toEqual([]);
    expect(stored().spellPreparationCompletedByClass).toEqual({});
    expect(stored().knownSpellsByClass).toEqual(character.knownSpellsByClass);
    expect(stored().preparedSpellsByClass).toEqual(character.preparedSpellsByClass);
  });

  it("enforces preparation capacity by spell level, not across the whole sheet", async () => {
    save(caster());
    render(<App />);
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Magic Missile" }), { target: { value: "3" } });
    const field = screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Invisibility" });
    expect(field.max).toBe("2");
    fireEvent.change(field, { target: { value: "3" } });
    expect(field.validationMessage).toContain("Preparation must fit");
    fireEvent.change(field, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass?.wizard).toEqual([
      "Magic Missile", "Magic Missile", "Magic Missile", "Invisibility", "Invisibility",
    ]);
  });

  it("supports arrow, Home and End navigation with a single active keyboard tab stop", async () => {
    save(caster());
    render(<App />);
    await openSpells();
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Wizard · 3" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tab", { name: "Cleric · 1" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Wizard · 3" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole("tab", { name: "Wizard · 3" }).tabIndex).toBe(-1);
  });

  it("automatically selects the class being leveled up and discards provisional usage and preparation", async () => {
    const character = caster();
    save(character);
    render(<App />);
    await screen.findByRole("button", { name: "Spells" });
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "cleric" } });
    await screen.findByRole("tab", { name: "Cleric · 2" });
    expect(screen.getByRole("tab", { name: "Cleric · 2" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByRole("tab", { name: "Cleric · 1" })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Detect Magic" }).value).toBe("0");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(false);
    expect(stored()).toEqual(character);
  });

  it("preserves another class's legacy spells when adding a wizard spell from a scroll", async () => {
    const character = caster();
    delete character.knownSpellsByClass;
    character.knownSpells = ["Magic Missile", "Cure Light Wounds"];
    character.knownSpellClasses = { "Magic Missile": "wizard", "Cure Light Wounds": "cleric" };
    saveEditable(character);
    render(<App />);
    await openSpells(false);
    fillCopiedSpell("Shield");
    fireEvent.click(screen.getByRole("button", { name: "Record learned spell" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().knownSpellsByClass).toEqual({ wizard: ["Magic Missile", "Shield"], cleric: ["Cure Light Wounds"] });
    expect(stored().spellAcquisitionByClass?.wizard?.Shield).toBe("scroll");
  });

  it("lets a wizard distribute two free level-up spells across spell levels without relearning old spells", async () => {
    const character = caster();
    character.classLevels[0].level = 2;
    character.knownSpellsByClass = { wizard: ["Magic Missile", "Detect Magic"], cleric: ["Cure Light Wounds"] };
    character.knownSpells = ["Magic Missile", "Detect Magic", "Cure Light Wounds"];
    save(character);
    render(<App />);
    await screen.findByRole("button", { name: "Spells" });
    fireEvent.click(screen.getByRole("button", { name: "Enter Level-Up Mode" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Class" }), { target: { value: "wizard" } });
    const panel = await screen.findByRole("tabpanel", { name: "Wizard · 3" });
    expect(within(panel).queryByRole("button", { name: "Magic Missile (Level 1)" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Shield" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Web" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    expect(screen.getByText(/Free level-up spells: 2\/2/)).toBeDefined();
    expect(screen.queryByLabelText("Free wizard spell")).toBeNull();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    expect(screen.queryByRole("button", { name: "Remove Magic Missile from spellbook" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Web from spellbook" }));
    expect(screen.getByText(/Free level-up spells: 1\/2/)).toBeDefined();
    fireEvent.change(screen.getByLabelText("Free wizard spell"), { target: { value: "Web" } });
    fireEvent.click(screen.getByRole("button", { name: "Add free spell" }));
    expect(screen.getByText(/Free level-up spells: 2\/2/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(stored()).toEqual(character);
  });

  it("removes prepared copies when a scroll-learned spell is removed without touching the cleric", async () => {
    const character = caster();
    character.knownSpellsByClass = { wizard: ["Detect Magic", "Magic Missile"], cleric: ["Detect Magic"] };
    character.preparedSpellsByClass = { wizard: ["Detect Magic"], cleric: ["Detect Magic"] };
    character.spellAcquisitionByClass = { wizard: { "Detect Magic": "scroll" } };
    character.wizardSpellLearning = { "Detect Magic": { source: "scroll", learnedAt: "2026-10-25T12:00:00Z", spellcraftTotal: 15 } };
    saveEditable(character);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await openSpells(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove Detect Magic from spellbook" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass).toEqual({ wizard: [], cleric: ["Detect Magic"] });
    expect(stored().knownSpellsByClass).toEqual({ wizard: ["Magic Missile"], cleric: ["Detect Magic"] });
    expect(stored().wizardSpellLearning).toEqual({});
  });

  it("saves preparation and slot usage entered in a creation draft", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Class" }));
    fireEvent.click(screen.getByRole("option", { name: /^Cleric/ }));
    await openSpells();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Prepare Detect Magic" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete Cleric daily preparation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Expended level 0 slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stored().preparedSpellsByClass?.cleric).toEqual(["Detect Magic"]);
    expect(stored().expendedSpellSlotsByClass?.cleric).toEqual({ "0": [0] });
  });

  it("exports and imports the complete independent spell state", async () => {
    const character = caster();
    character.expendedSpellSlotsByClass = { wizard: { "2": [1] }, cleric: { "0": [0] } };
    character.spellPreparationCompletedByClass = { wizard: true, cleric: true };
    character.preparedSpellsByClass = { wizard: ["Invisibility", "Invisibility"], cleric: ["Detect Magic"] };
    character.clericDomains = ["healing", "travel"];
    character.clericDomainPreparation = { 1: { domain: "travel", spell: "Longstrider" } };
    character.clericDomainExpended = [1];
    character.wizardSpellLearning = { Invisibility: { source: "scroll", learnedAt: "2026-10-25T12:00:00Z",
      decipherMethod: "read-magic", spellcraftTotal: 17 } };
    save(character);
    const { container } = render(<App />);
    let blob: Blob | undefined;
    class TestURL extends URL {
      static createObjectURL(value: Blob) { blob = value; return "blob:spell-export"; }
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", TestURL);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    if (!blob) throw new Error("Missing spell-state export.");
    const exportBlob = blob;
    const json = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Expected text export."));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportBlob);
    });
    const exported = parseCharacter(JSON.parse(json));
    expect(exported.expendedSpellSlotsByClass).toEqual(character.expendedSpellSlotsByClass);
    expect(exported.spellPreparationCompletedByClass).toEqual(character.spellPreparationCompletedByClass);
    expect(exported.preparedSpellsByClass).toEqual(character.preparedSpellsByClass);
    expect(exported.wizardSpellLearning).toEqual(character.wizardSpellLearning);
    expect(exported.clericDomains).toEqual(character.clericDomains);
    expect(exported.clericDomainPreparation).toEqual(character.clericDomainPreparation);
    expect(exported.clericDomainExpended).toEqual([1]);
    const file = new File([json], "spell-character.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => json });
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("Missing character import.");
    fireEvent.change(input, { target: { files: [file] } });
    await openSpells();
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 2 slot 2" }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>("spinbutton", { name: "Prepare Invisibility" }).value).toBe("2");
    fireEvent.click(screen.getByRole("tab", { name: "Cleric · 1" }));
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 0 slot 1" }).checked).toBe(true);
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Level 1 domain spell" }).value).toBe("travel:Longstrider");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Expended level 1 domain slot" }).checked).toBe(true);
  });

  it("shows one subtab for a single caster and none for the character's noncasting classes", () => {
    const character = caster();
    character.classLevels = [{ classId: "fighter", level: 2 }, { classId: "wizard", level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(within(screen.getByRole("tablist", { name: "Spellcasting classes" })).getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Wizard · 3" })).toBeDefined();
    expect(screen.queryByRole("tab", { name: /Fighter/ })).toBeNull();
  });

  it.each(["paladin", "ranger"] as const)("explains when %s spellcasting begins rather than showing wizard slots", (classId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText(/spellcasting begins at class level 4/)).toBeDefined();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText("CANTRIPS")).toBeNull();
    if (classId === "paladin") {
      expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
    } else {
      expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
      expect(screen.getByText(/no domain spells or granted powers/)).toBeDefined();
    }
  });

  it("explains Druid spontaneous summon conversion and lack of domains", () => {
    const character = caster();
    character.classLevels = [{ classId: "druid", level: 3 }];
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText(/replace a prepared spell with summon nature's ally/)).toBeDefined();
    expect(screen.getByText(/cannot spontaneously replace prepared spells with cure spells/)).toBeDefined();
    expect(screen.getByText(/no cleric domain spells or granted powers/)).toBeDefined();
  });

  it.each(["bard", "sorcerer", "mystic"] as const)("gives %s a known-spell sheet without preparation controls", (classId: ClassId) => {
    const character = caster();
    character.classLevels = [{ classId, level: 3 }];
    if (classId === "mystic") character.ruleset = "dragonlance-user-pack";
    render(<SpellSheets character={character} editable={false} onKnownSpellsChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getByText("Spells Known", { exact: true })).toBeDefined();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByText("LEVEL 2 SPELLS")).toBeNull();
  });

  it("allows a Sorcerer to replace one eligible known spell at 4th level", async () => {
    const user = userEvent.setup();
    const sorcererSpells = getClassSpells("sorcerer");
    const originalSpell = sorcererSpells.find((spell) => spell.name === "Acid Splash");
    const replacementSpell = sorcererSpells.find((spell) => spell.name === "Dancing Lights");
    if (!originalSpell || !replacementSpell) {
      throw new Error("Expected Sorcerer cantrips are missing from the catalog.");
    }
    const original = cloneCharacter(initialCharacter);
    original.classLevels = [{ classId: "sorcerer", level: 3 }];
    original.abilities.cha = 18;
    original.knownSpellsByClass = { sorcerer: [originalSpell.name] };
    original.knownSpells = [originalSpell.name];
    const proposed = cloneCharacter(original);
    proposed.classLevels[0].level = 4;
    const onKnownSpellsChange = vi.fn();

    render(<SpellSheets character={proposed} levelUpOriginal={original}
      levelUpClassId="sorcerer" editable onKnownSpellsChange={onKnownSpellsChange}
      onPreparedSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onCharacterUpdate={vi.fn()} onExpendedSpellSlotsChange={vi.fn()}
      onClericCastingChange={vi.fn()} onCombatCastingContextChange={vi.fn()} />);

    expect(screen.getByText(/Applying a metamagic feat while casting spontaneously takes a full-round action/)).toBeDefined();
    await user.click(screen.getByRole("button", {
      name: `${originalSpell.name} (Level 0)`,
    }));
    await user.click(screen.getByRole("option", {
      name: new RegExp(`${replacementSpell.name} \\(Level 0\\)`),
    }));
    expect(onKnownSpellsChange).toHaveBeenLastCalledWith(
      [replacementSpell.name],
      "sorcerer",
    );
  });

  it.each(["bard", "sorcerer"] as const)("does not present spontaneous Quicken as a manual option for %s", (classId) => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId, level: 10 }];
    character.abilities.cha = 18;
    character.featSelections = { "general-1": "quicken-spell" };
    render(<SpellSheets character={character} editable
      onKnownSpellsChange={vi.fn()} onSpellAcquisitionChange={vi.fn()}
      onPreparedSpellsChange={vi.fn()} onCharacterUpdate={vi.fn()}
      onExpendedSpellSlotsChange={vi.fn()} onClericCastingChange={vi.fn()}
      onCombatCastingContextChange={vi.fn()} />);
    expect(screen.getAllByText(/Quicken Spell cannot be applied to spontaneously cast spells/).length)
      .toBeGreaterThan(0);
    expect(screen.queryByText(/Quicken Spell for spontaneous casting remains manual/)).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /^Quicken / })).toBeNull();
  });
});
