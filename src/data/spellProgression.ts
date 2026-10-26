import { type ClassId } from "../domain";


export const fullCasterProgression = `3 1|4 2|4 2 1|4 3 2|4 3 2 1|4 3 3 2|4 4 3 2 1|4 4 3 3 2|4 4 4 3 2 1|4 4 4 3 3 2|4 4 4 4 3 2 1|4 4 4 4 3 3 2|4 4 4 4 4 3 2 1|4 4 4 4 4 3 3 2|4 4 4 4 4 4 3 2 1|4 4 4 4 4 4 3 3 2|4 4 4 4 4 4 4 3 2 1|4 4 4 4 4 4 4 3 3 2|4 4 4 4 4 4 4 4 3 3|4 4 4 4 4 4 4 4 4 4`.split("|").map((row) => row.split(" ").map(Number));

export const sorcererProgression = `5 3|6 4|6 5|6 6 3|6 6 4|6 6 5 3|6 6 6 4|6 6 6 5 3|6 6 6 6 4|6 6 6 6 5 3|6 6 6 6 6 4|6 6 6 6 6 5 3|6 6 6 6 6 6 4|6 6 6 6 6 6 5 3|6 6 6 6 6 6 6 4|6 6 6 6 6 6 6 5 3|6 6 6 6 6 6 6 6 4|6 6 6 6 6 6 6 6 5 3|6 6 6 6 6 6 6 6 6 4|6 6 6 6 6 6 6 6 6 6`.split("|").map((row) => row.split(" ").map(Number));

export const bardProgression = `2|3 0|3 1|3 2 0|3 3 1|3 3 2|3 3 2 0|3 3 3 1|3 3 3 2|3 3 3 2 0|3 3 3 3 1|3 3 3 3 2|3 3 3 3 2 0|4 3 3 3 3 1|4 4 3 3 3 2|4 4 4 3 3 2 0|4 4 4 4 3 3 1|4 4 4 4 4 3 2|4 4 4 4 4 4 3|4 4 4 4 4 4 4`.split("|").map((row) => row.split(" ").map(Number));

export const partialCasterProgression = `| | |0|0|1|1|1 0|1 0|1 1|1 1 0|1 1 1|1 1 1|2 1 1 0|2 1 1 1|2 2 1 1|2 2 2 1|3 2 2 1|3 3 3 2|3 3 3 3`.split("|").map((row) => row.trim() ? row.trim().split(" ").map(Number) : []);

export const bardKnownProgression = `4|5 2|6 3|6 3 2|6 4 3|6 4 3|6 4 4 2|6 4 4 3|6 4 4 3|6 4 4 4 2|6 4 4 4 3|6 4 4 4 3|6 4 4 4 4 2|6 4 4 4 4 3|6 4 4 4 4 3|6 5 4 4 4 4 2|6 5 5 4 4 4 3|6 5 5 5 4 4 3|6 5 5 5 5 4 4|6 5 5 5 5 5 4`.split("|").map((row) => row.split(" ").map(Number));

export const sorcererKnownProgression = `4 2|5 2|5 3|6 3 1|6 4 2|7 4 2 1|7 5 3 2|8 5 3 2 1|8 5 4 3 2|9 5 4 3 2 1|9 5 5 4 3 2|9 5 5 4 3 2 1|9 5 5 4 4 3 2|9 5 5 4 4 3 2 1|9 5 5 4 4 4 3 2|9 5 5 4 4 4 3 2 1|9 5 5 4 4 4 3 3 2|9 5 5 4 4 4 3 3 2 1|9 5 5 4 4 4 3 3 3 2|9 5 5 4 4 4 3 3 3 3`.split("|").map((row) => row.split(" ").map(Number));

export const spellProgressions: Partial<Record<ClassId, number[][]>> = {
  bard: bardProgression,
  cleric: fullCasterProgression,
  druid: fullCasterProgression,
  mystic: fullCasterProgression,
  paladin: partialCasterProgression,
  ranger: partialCasterProgression,
  sorcerer: sorcererProgression,
  wizard: fullCasterProgression,
};
