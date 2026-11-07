import { describe, expect, it } from "vitest";
import {
  formatSpellCastingTime,
  formatSpellDuration,
  spellRequiresConcentration,
} from "../src/spellFormatting";

describe("formatSpellDuration", () => {
  it.each([
    ["Concentration, up to 1 min./level (D)", "up to 1 min./level (D)"],
    ["Concentration + 2 rounds", "+ 2 rds"],
    ["Concentration (maximum 10 rounds) (D)", "maximum 10 rds (D)"],
    ["Concentration", ""],
  ])("formats %s as %s", (duration, expected) => {
    expect(formatSpellDuration(duration)).toBe(expected);
  });
});

describe("spellRequiresConcentration", () => {
  it.each([
    ["Concentration", true],
    ["Concentration, up to 1 minute/level", true],
    ["Concentration + 2 rounds", true],
    ["1 minute/level", false],
  ])("returns %s for %s", (duration, expected) => {
    expect(spellRequiresConcentration(duration)).toBe(expected);
  });
});

describe("formatSpellCastingTime", () => {
  it.each([
    ["1 standard action", "Std. action"],
    ["1 full-round action", "Full-round"],
    ["1 immediate action", "Immed. action"],
    ["1 round; see text", "1 rd; see text"],
    ["3 full rounds", "3 full rds"],
    ["10 minutes; see text", "10 min; see text"],
    ["1 minute or longer; see text", "1 min+; see text"],
    ["At least 10 minutes; see text", "10+ min; see text"],
    ["1 minute/lb. created", "1 min/lb. created"],
    ["See text", "See text"],
  ])("formats %s as %s", (castingTime, expected) => {
    expect(formatSpellCastingTime(castingTime)).toBe(expected);
  });
});
