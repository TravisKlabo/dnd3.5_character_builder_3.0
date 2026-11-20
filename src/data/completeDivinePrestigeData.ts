import type { PrestigeClassDefinition } from "../domain";

export const completeDivinePrestigeDefinitions: PrestigeClassDefinition[] = [
  {
    "id": "black-flame-zealot",
    "name": "Black Flame Zealot",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Hide": 8,
        "Knowledge (religion)": 8,
        "Move Silently": 8
      },
      "feats": [
        "Exotic Weapon Proficiency (kukri)",
        "Iron Will"
      ],
      "alignment": "Any nongood",
      "spellcasting": {
        "type": "divine",
        "level": 2
      },
      "sneakAttackDice": 1
    },
    "features": [
      "Death attack",
      "Zealous heart",
      "Poison use",
      "Sneak attack +1d6",
      "Fateful stride",
      "Sneak attack +2d6",
      "Sacred flame",
      "Sneak attack +3d6",
      "Unholy immolation"
    ],
    "hitDie": 6,
    "skillPoints": 4,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "good",
    "will": "good",
    "classSkills": [
      "Balance",
      "Climb",
      "Concentration",
      "Craft",
      "Escape Artist",
      "Hide",
      "Jump",
      "Knowledge (religion)",
      "Listen",
      "Move Silently",
      "Open Lock",
      "Profession",
      "Search",
      "Sleight of Hand",
      "Spellcraft",
      "Spot",
      "Swim",
      "Tumble",
      "Use Rope"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Worship the Order's deity; slay an enemy of the faith solely to join. Sacred flame is listed at level 7 in the class table but described as beginning at level 6.",
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [2, 4, 6, 8, 10],
      "chooseEachLevel": true
    }
  },
  {
    "id": "blighter",
    "name": "Blighter",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 4,
      "alignment": "Any nongood",
      "classes": ["druid"],
      "spellcasting": { "type": "divine", "level": 3 }
    },
    "features": [
      "Deforestation",
      "Blightfire",
      "Sustenance",
      "Undead wild shape 1/day",
      "Speak with dead animal",
      "Undead wild shape 2/day",
      "Contagious touch 1/day",
      "Undead wild shape (Large)",
      "Animate dead animal",
      "Undead wild shape 3/day",
      "Contagious touch 2/day",
      "Unbond",
      "Undead wild shape 4/day",
      "Contagious touch 3/day",
      "Undead wild shape (Huge)",
      "Plague",
      "Undead wild shape 5/day"
    ],
    "hitDie": 8,
    "skillPoints": 4,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Handle Animal",
      "Heal",
      "Knowledge (nature)",
      "Listen",
      "Profession (herbalist)",
      "Spellcraft",
      "Spot",
      "Survival",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Ex-druid formerly capable of casting 3rd-level druid spells.",
  },
  {
    "id": "church-inquisitor",
    "name": "Church Inquisitor",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (arcana)": 4,
        "Knowledge (religion)": 4,
        "Spellcraft": 4
      },
      "alignment": "Lawful good or lawful neutral",
      "baseSaves": { "will": 3 },
      "spells": ["Zone of Truth"]
    },
    "features": [
      "Detect evil",
      "Inquisition domain",
      "Immune to charms",
      "Pierce illusion",
      "Pierce disguise",
      "Immune to compulsions",
      "Force shapechange",
      "Immunity to possession",
      "Discern lies 3/day",
      "Learn the truth 3/day"
    ],
    "hitDie": 8,
    "skillPoints": 4,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Bluff",
      "Concentration",
      "Decipher Script",
      "Diplomacy",
      "Gather Information",
      "Intimidate",
      "Knowledge (arcana)",
      "Knowledge (local)",
      "Knowledge (the planes)",
      "Knowledge (religion)",
      "Search",
      "Sense Motive",
      "Spellcraft",
      "Spot"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Member of a lawful good church or religious order; must already have uncovered corruption within it.",
    "spellcastingProgression": {
      "type": "divine",
      "chooseEachLevel": true
    }
  },
  {
    "id": "consecrated-harrier",
    "name": "Consecrated Harrier",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Disguise": 5,
        "Gather Information": 5
      },
      "feats": [
        "Track"
      ],
      "alignment": "Any lawful"
    },
    "features": [
      "Blessing of scripture +2",
      "Detect chaos",
      "Sanctified sight",
      "Dispel magic",
      "Crushing despair",
      "Blessing of scripture +4",
      "False vision",
      "Implacable hunt",
      "Blessing of scripture +6",
      "Faultless hunt"
    ],
    "hitDie": 10,
    "skillPoints": 4,
    "baseAttackBonus": "good",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Bluff",
      "Climb",
      "Diplomacy",
      "Disguise",
      "Gather Information",
      "Intimidate",
      "Knowledge (local)",
      "Profession",
      "Ride",
      "Search",
      "Use Rope"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Accept and complete a church assignment to locate and destroy a specific enemy of the church.",
  },
  {
    "id": "contemplative",
    "name": "Contemplative",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (religion)": 13
      },
      "spellcasting": {
        "type": "divine",
        "level": 1
      }
    },
    "features": [
      "Bonus domain",
      "Divine health",
      "Slippery mind",
      "Divine wholeness",
      "Divine body",
      "Bonus domain",
      "Divine soul",
      "Eternal body",
      "Mystic union"
    ],
    "hitDie": 6,
    "skillPoints": 2,
    "baseAttackBonus": "poor",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Heal",
      "Intimidate",
      "Knowledge (religion)",
      "Profession",
      "Sense Motive",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Direct contact with one's patron deity, a direct servant, or an enlightened being embodying the highest principles of an alignment.",
    "spellcastingProgression": {
      "type": "divine",
      "chooseEachLevel": true
    }
  },
  {
    "id": "divine-crusader",
    "name": "Divine Crusader",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 7,
      "skills": {
        "Knowledge (religion)": 2
      },
      "alignment": "Must match chosen deity"
    },
    "features": [
      "Alignment aura",
      "Resistance to electricity 5",
      "Weapon Specialization",
      "Resistance to acid 5",
      "Darkvision",
      "Resistance to acid and electricity 10",
      "Perfect self"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Climb",
      "Concentration",
      "Craft",
      "Diplomacy",
      "Intimidate",
      "Jump",
      "Knowledge (religion)",
      "Ride",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Choose and devote oneself to a deity and one of its domains; losing alignment match removes class abilities and advancement.",
  },
  {
    "id": "divine-oracle",
    "name": "Divine Oracle",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (religion)": 8
      },
      "skillFocus": "Knowledge (religion)",
      "spellSchoolSpells": {
        "school": "Divination",
        "count": 2,
        "minimumLevel": 0
      }
    },
    "features": [
      "Oracle domain",
      "Scry bonus",
      "Prescient sense",
      "Trap sense +1",
      "Divination enhancement",
      "Uncanny dodge",
      "Trap sense +2",
      "Improved uncanny dodge",
      "Trap sense +3",
      "Immune to surprise"
    ],
    "hitDie": 6,
    "skillPoints": 2,
    "baseAttackBonus": "poor",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Heal",
      "Intimidate",
      "Knowledge (arcana)",
      "Knowledge (religion)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
    "spellcastingProgression": {
      "type": "either",
      "chooseEachLevel": true
    }
  },
  {
    "id": "entropomancer",
    "name": "Entropomancer",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Concentration": 5,
        "Knowledge (arcana)": 5
      },
      "feats": [
        "Great Fortitude",
        "Magical Aptitude"
      ],
      "alignment": "Any nongood",
      "spellcasting": {
        "type": "divine",
        "level": 4
      }
    },
    "features": [
      "Shard of entropy 2/day",
      "Entropic field 2/day",
      "Entropic field (reroll)",
      "Shard of entropy 5d6",
      "Entropic field (wounding)",
      "Shard of entropy 7d6",
      "Consuming shard",
      "Control sphere"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Heal",
      "Intimidate",
      "Knowledge (arcana)",
      "Knowledge (local)",
      "Knowledge (religion)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [2, 4, 6, 8, 10],
      "chooseEachLevel": true
    }
  },
  {
    "id": "evangelist",
    "name": "Evangelist",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Bluff": 8,
        "Gather Information": 5,
        "Knowledge (religion)": 5,
        "Perform (oratory)": 6,
        "Sense Motive": 5
      },
      "anyFeats": ["Negotiator", "Persuasive"],
      "alignment": "Same restrictions as a cleric of the chosen deity"
    },
    "features": [
      "Great orator: inspire dread or inspire hope",
      "Fast talk",
      "Great orator: inflame the righteous",
      "Skill mastery",
      "Great orator: convert the unfaithful"
    ],
    "hitDie": 6,
    "skillPoints": 6,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Bluff",
      "Craft",
      "Diplomacy",
      "Disguise",
      "Escape Artist",
      "Intimidate",
      "Knowledge (all)",
      "Listen",
      "Perform",
      "Profession",
      "Sense Motive",
      "Speak Language"
    ],
    "maximumLevel": 5,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined
  },
  {
    "id": "geomancer",
    "name": "Geomancer",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (arcana)": 6,
        "Knowledge (nature)": 6
      },
      "spellcasting": {
        "type": "arcane",
        "level": 2
      },
      "additionalSpellcasting": [
        { "type": "divine", "level": 2 }
      ]
    },
    "features": [
      "Drift 1",
      "Spell versatility 0",
      "Drift 1",
      "Ley lines +1",
      "Spell versatility 1",
      "Drift 2",
      "Spell versatility 2",
      "Drift 2",
      "Spell versatility 3",
      "Drift 3",
      "Spell versatility 4",
      "Drift 3",
      "Ley lines +2",
      "Spell versatility 5",
      "Drift 4",
      "Spell versatility 6",
      "Drift 4",
      "Spell versatility 7",
      "Drift 5",
      "Spell versatility 8",
      "Drift 5",
      "Ley lines +3",
      "Spell versatility 9"
    ],
    "hitDie": 6,
    "skillPoints": 4,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Climb",
      "Concentration",
      "Craft",
      "Diplomacy",
      "Handle Animal",
      "Heal",
      "Knowledge (arcana)",
      "Knowledge (geography)",
      "Knowledge (nature)",
      "Scry",
      "Spellcraft",
      "Survival",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
    "spellcastingProgression": {
      "type": "either",
      "chooseEachLevel": true
    }
  },
  {
    "id": "holy-liberator",
    "name": "Holy Liberator",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Diplomacy": 5,
        "Sense Motive": 5
      },
      "feats": [
        "Iron Will"
      ],
      "alignment": "Chaotic good"
    },
    "features": [
      "Aura of good",
      "Detect evil",
      "Smite evil 1/day",
      "Remove fatigue",
      "Aura of resolve",
      "Break enchantment 1/week",
      "Divine grace",
      "Smite evil 2/day",
      "Celestial companion",
      "Break enchantment 2/week",
      "Smite evil 3/day"
    ],
    "hitDie": 10,
    "skillPoints": 2,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "poor",
    "will": "poor",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Handle Animal",
      "Heal",
      "Intimidate",
      "Knowledge (religion)",
      "Profession",
      "Ride",
      "Sense Motive"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
  },
  {
    "id": "hospitaler",
    "name": "Hospitaler",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Handle Animal": 5,
        "Ride": 5
      },
      "feats": [
        "Mounted Combat",
        "Ride-By Attack"
      ],
      "alignment": "Any nonchaotic",
      "spellcasting": {
        "type": "divine",
        "level": 1
      }
    },
    "features": [
      "Bonus feat",
      "Lay on hands",
      "Remove disease 1/week",
      "Bonus feat",
      "Remove disease 2/week",
      "Bonus feat"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "poor",
    "will": "poor",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Handle Animal",
      "Heal",
      "Knowledge (religion)",
      "Profession",
      "Ride"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Spellcasting advances at Hospitaler levels 2, 3, 4, 6, 7, 8, and 10.",
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [2, 3, 4, 6, 7, 8, 10],
      "chooseEachLevel": true
    }
  },
  {
    "id": "pious-templar",
    "name": "Pious Templar",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Knowledge (religion)": 4
      },
      "feats": [
        "True Believer",
        "Weapon Focus (deity's favored weapon)"
      ]
    },
    "features": [
      "Mettle",
      "Smite 1/day",
      "Damage reduction 1/-",
      "Weapon Specialization",
      "Bonus feat",
      "Smite 2/day",
      "Damage reduction 2/-",
      "Bonus feat",
      "Smite 3/day"
    ],
    "hitDie": 10,
    "skillPoints": 2,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Climb",
      "Concentration",
      "Craft",
      "Heal",
      "Jump",
      "Knowledge (religion)",
      "Profession",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
  },
  {
    "id": "radiant-servant-of-pelor",
    "name": "Radiant Servant of Pelor",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Heal": 5,
        "Knowledge (religion)": 9
      },
      "feats": [
        "Extra Turning"
      ],
      "alignment": "Neutral good",
      "spellcasting": {
        "type": "divine",
        "level": 1
      },
      "baseSaves": { "will": 5 }
    },
    "features": [
      "Extra greater turning",
      "Radiance",
      "Turn undead",
      "Divine health",
      "Empower healing",
      "Aura of warding",
      "Bonus domain",
      "Maximize healing",
      "Positive energy burst",
      "Supreme healing"
    ],
    "hitDie": 6,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Heal",
      "Knowledge (arcana)",
      "Knowledge (religion)",
      "Profession",
      "Sense Motive",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Must have Pelor as patron deity.",
    "spellcastingProgression": {
      "type": "divine",
      "chooseEachLevel": true
    }
  },
  {
    "id": "rainbow-servant",
    "name": "Rainbow Servant",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (arcana)": 4
      },
      "alignment": "Any nonevil and nonchaotic",
      "spellcasting": {
        "type": "arcane",
        "level": 3
      }
    },
    "features": [
      "Detect evil",
      "Good domain",
      "Air domain",
      "Grow wings",
      "Detect chaos",
      "Law domain",
      "Cleric spell access",
      "Detect thoughts"
    ],
    "hitDie": 4,
    "skillPoints": 2,
    "baseAttackBonus": "poor",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Knowledge (arcana)",
      "Knowledge (the planes)",
      "Profession",
      "Sense Motive",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Must find the hidden jungle temples of the couatls. Arcane progression occurs at levels 2, 3, 5, 6, 8, and 9; cleric spell access begins at level 10.",
    "spellcastingProgression": {
      "type": "arcane",
      "advancingLevels": [2, 3, 5, 6, 8, 9],
      "chooseEachLevel": true
    }
  },
  {
    "id": "sacred-exorcist",
    "name": "Sacred Exorcist",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (the planes)": 10,
        "Knowledge (religion)": 7
      },
      "alignment": "Any good",
      "anySpells": ["Dismissal", "Dispel Evil"]
    },
    "features": [
      "Exorcism",
      "Turn undead",
      "Detect evil",
      "Resist possession",
      "Chosen foe +1",
      "Dispel evil 1/week",
      "Consecrated presence",
      "Chosen foe +2",
      "Dispel evil 2/week",
      "Holy aura 1/day",
      "Chosen foe +3",
      "Dispel evil 3/week"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Heal",
      "Intimidate",
      "Knowledge (arcana)",
      "Knowledge (the planes)",
      "Knowledge (religion)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Sanction of a church or order that judges the candidate exemplary in faith, will, and morality.",
    "spellcastingProgression": {
      "type": "either",
      "chooseEachLevel": true
    }
  },
  {
    "id": "sacred-fist",
    "name": "Sacred Fist",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 4,
      "skills": {
        "Knowledge (religion)": 8
      },
      "feats": [
        "Combat Casting",
        "Combat Reflexes",
        "Improved Unarmed Strike",
        "Stunning Fist"
      ],
      "spellcasting": {
        "type": "divine",
        "level": 1
      }
    },
    "features": [
      "Unarmed damage progression",
      "AC progression",
      "Speed progression",
      "Sacred flames 1/day",
      "Blindsense 10 ft.",
      "Sacred flames 2/day",
      "Inner armor"
    ],
    "hitDie": 8,
    "skillPoints": 4,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "good",
    "will": "poor",
    "classSkills": [
      "Balance",
      "Concentration",
      "Escape Artist",
      "Heal",
      "Jump",
      "Profession",
      "Spellcraft",
      "Tumble"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": undefined,
    "spellcastingProgression": {
      "type": "divine",
      "chooseEachLevel": true
    }
  },
  {
    "id": "seeker-of-the-misty-isle",
    "name": "Seeker of the Misty Isle",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Knowledge (religion)": 4,
        "Survival": 8
      },
      "spellcasting": {
        "type": "divine",
        "level": 2
      },
      "races": ["Elf", "Half-Elf"]
    },
    "features": [
      "Travel domain",
      "Swiftfooted",
      "Corellon's perception",
      "Surefooted",
      "Find the path 1/day",
      "Magic domain",
      "Arcane sight 3/day",
      "Discern location 1/week"
    ],
    "hitDie": 8,
    "skillPoints": 6,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "good",
    "will": "poor",
    "classSkills": [
      "Balance",
      "Climb",
      "Concentration",
      "Craft",
      "Diplomacy",
      "Hide",
      "Jump",
      "Knowledge (geography)",
      "Knowledge (religion)",
      "Listen",
      "Move Silently",
      "Ride",
      "Speak Language",
      "Spellcraft",
      "Spot",
      "Survival"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Inducted by another member. Existing divine spellcasting advances except at levels 5 and 10.",
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [1, 2, 3, 4, 6, 7, 8, 9],
      "chooseEachLevel": true
    }
  },
  {
    "id": "shining-blade-of-heironeous",
    "name": "Shining Blade of Heironeous",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 7,
      "skills": {
        "Knowledge (religion)": 7
      },
      "alignment": "Lawful good",
      "spellcasting": {
        "type": "divine",
        "level": 1
      },
      "baseSaves": { "will": 3 }
    },
    "features": [
      "Shock blade 2/day",
      "Shock blade 3/day",
      "Holy blade 4/day",
      "Holy blade 5/day",
      "Brilliant blade 6/day"
    ],
    "hitDie": 10,
    "skillPoints": 2,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Heal",
      "Knowledge (religion)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Must have Heironeous as patron deity.",
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [2, 4, 6, 8, 10],
      "chooseEachLevel": true
    }
  },
  {
    "id": "stormlord",
    "name": "Stormlord",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "feats": [
        "Endurance",
        "Great Fortitude",
        "Weapon Focus (any spear or javelin)"
      ],
      "spellcasting": {
        "type": "divine",
        "level": 3
      },
      "baseSaves": { "fortitude": 4 },
      "weaponFocusChoices": ["Spear", "Javelin", "Shortspear", "Longspear"]
    },
    "features": [
      "Enhanced javelins +1",
      "Resistance to electricity 5",
      "Shock weapon",
      "Storm walk",
      "Resistance to electricity 10",
      "Thundering weapon",
      "Storm ride",
      "Enhanced javelins +2",
      "Resistance to electricity 15",
      "Shocking burst weapon",
      "Immunity to electricity",
      "Enhanced javelins +3",
      "Elemental conflagration"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "good",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Disguise",
      "Gather Information",
      "Intimidate",
      "Knowledge (nature)",
      "Knowledge (religion)",
      "Survival",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Patron Talos; must have survived a natural or magical lightning bolt.",
    "spellcastingProgression": {
      "type": "divine",
      "chooseEachLevel": true
    }
  },
  {
    "id": "temple-raider-of-olidammara",
    "name": "Temple Raider of Olidammara",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Disable Device": 4,
        "Knowledge (religion)": 1,
        "Open Lock": 4,
        "Search": 8
      },
      "alignment": "Any chaotic"
    },
    "features": [
      "Trapfinding",
      "Trap sense +1",
      "Sneak attack +1d6",
      "Uncanny dodge",
      "Trap sense +2",
      "Sneak attack +2d6",
      "Improved uncanny dodge",
      "Trap sense +3",
      "Sneak attack +3d6",
      "Skill mastery",
      "Luck domain",
      "Trap sense +4"
    ],
    "hitDie": 6,
    "skillPoints": 4,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "good",
    "will": "good",
    "classSkills": [
      "Appraise",
      "Climb",
      "Craft",
      "Decipher Script",
      "Disable Device",
      "Hide",
      "Jump",
      "Knowledge (religion)",
      "Listen",
      "Move Silently",
      "Open Lock",
      "Search",
      "Spot",
      "Tumble",
      "Use Magic Device",
      "Use Rope"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Worship Olidammara; invited by at least three current temple raiders.",
  },
  {
    "id": "ur-priest",
    "name": "Ur-Priest",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Bluff": 6,
        "Knowledge (arcana)": 5,
        "Knowledge (the planes)": 5,
        "Knowledge (religion)": 8,
        "Spellcraft": 8
      },
      "feats": [
        "Iron Will",
        "Spell Focus (evil)"
      ],
      "alignment": "Any evil",
      "baseSaves": { "fortitude": 3, "will": 3 }
    },
    "features": [
      "Rebuke undead",
      "Divine spell resistance 15",
      "Siphon spell power",
      "Divine spell resistance 20",
      "Steal spell-like ability"
    ],
    "hitDie": 8,
    "skillPoints": 2,
    "baseAttackBonus": "medium",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Bluff",
      "Concentration",
      "Craft",
      "Knowledge (arcana)",
      "Knowledge (the planes)",
      "Knowledge (religion)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Any former divine spellcasting ability is permanently forsaken; must be trained by another ur-priest.",
  },
  {
    "id": "void-disciple",
    "name": "Void Disciple",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "skills": {
        "Spellcraft": 10
      },
      "feats": [
        "Heighten Spell",
        "Spell Penetration"
      ],
      "alignment": "Any neutral",
      "spellcasting": {
        "type": "either",
        "level": 3
      }
    },
    "features": [
      "Sense void 1/day (physical senses)",
      "Sense void 2/day",
      "Moment of clarity 2/day",
      "Sense void 3/day (magical senses)",
      "Altering the course",
      "Sense void 4/day",
      "Moment of clarity 3/day",
      "Sense void 5/day (empathic senses)",
      "Void release",
      "Sense void 6/day",
      "Void suppression",
      "Moment of clarity 4/day",
      "Sense void 7/day (mental senses)",
      "Void strike"
    ],
    "hitDie": 6,
    "skillPoints": 2,
    "baseAttackBonus": "poor",
    "fortitude": "poor",
    "reflex": "poor",
    "will": "good",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Heal",
      "Knowledge (all)",
      "Profession",
      "Spellcraft"
    ],
    "maximumLevel": 13,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Existing spellcasting advances at levels 2, 4, 5, 6, 8, 10, 11, and 12.",
    "spellcastingProgression": {
      "type": "either",
      "advancingLevels": [2, 4, 5, 6, 8, 10, 11, 12],
      "chooseEachLevel": true
    }
  },
  {
    "id": "warpriest",
    "name": "Warpriest",
    "source": "core-35-srd",
    "sourceBook": "Complete Divine (3.5)",
    "prerequisites": {
      "bab": 5,
      "skills": {
        "Diplomacy": 8,
        "Sense Motive": 5
      },
      "feats": [
        "Combat Casting"
      ]
    },
    "features": [
      "Bonus domain",
      "Rally",
      "Turn or rebuke undead",
      "Inflame +2",
      "Mass cure light wounds",
      "Inflame +4",
      "Fear aura",
      "Heroes' feast",
      "Inflame +6",
      "Haste",
      "Mass heal",
      "Implacable foe",
      "Inflame +8"
    ],
    "hitDie": 10,
    "skillPoints": 2,
    "baseAttackBonus": "good",
    "fortitude": "good",
    "reflex": "poor",
    "will": "poor",
    "classSkills": [
      "Concentration",
      "Craft",
      "Diplomacy",
      "Handle Animal",
      "Knowledge (history)",
      "Ride",
      "Sense Motive",
      "Spellcraft",
      "Swim"
    ],
    "maximumLevel": 10,
    "levelUpEnabled": true,
    "roleplayPrerequisite": "Domain spell access counts for the spell prerequisite.",
    "spellcastingProgression": {
      "type": "divine",
      "advancingLevels": [2, 4, 6, 8, 10],
      "chooseEachLevel": true
    }
  },
];
