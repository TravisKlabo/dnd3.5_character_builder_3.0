import { type Character, raceDefinitions } from "./domain";
import {
  getBaseClassLevel,
  getEncumbrance,
  getMonkAbilityState,
  getPrestigeClassLevel,
  getRaceDefinitionForCharacter,
  getWornArmor,
} from "./rules";

export function getMovement(character: Character) {
  const race = getRaceDefinitionForCharacter(character) ?? raceDefinitions.human;
  const baseSpeed = race.speed ?? 30;
  const baseSwimSpeed = race.swimSpeed;
  const armor = getWornArmor(character);
  const encumbrance = getEncumbrance(character);
  const monkState = getMonkAbilityState(character, encumbrance);
  const monkSpeedBonus = monkState.active ? Math.floor(monkState.level / 3) * 10 : 0;
  const armoredMobility = getPrestigeClassLevel(character, "knight-of-the-crown") >= 7;
  const armorMovementCategory = armoredMobility && armor.movementCategory === "Heavy"
    ? "Medium"
    : armor.movementCategory;
  const armorSlows = armorMovementCategory === "Medium" || armorMovementCategory === "Heavy";
  const loadSlows = encumbrance.load !== "Light";
  const causes: string[] = [];
  let speed = baseSpeed + monkSpeedBonus;
  let swimSpeed = baseSwimSpeed;
  const bonuses = monkSpeedBonus > 0 ? [`Monk Fast Movement +${monkSpeedBonus} ft.`] : [];
  if (
    getBaseClassLevel(character, "barbarian") &&
    (!armor.name || armorMovementCategory && armorMovementCategory !== "Heavy") &&
    encumbrance.load !== "Heavy" &&
    encumbrance.load !== "Overloaded" &&
    !encumbrance.unknownWeights.length
  ) {
    speed += 10;
    bonuses.push("Barbarian Fast Movement +10 ft.");
  }
  const slowedSpeed = (movementSpeed: number) =>
    Math.ceil(movementSpeed * 2 / 15) * 5;
  if (encumbrance.load === "Overloaded") {
    speed = encumbrance.weight <= encumbrance.capacity.heavy * 2 ? 5 : 0;
    if (swimSpeed !== undefined) swimSpeed = speed;
    causes.push(speed === 5 ? "Overloaded: 5 ft. per round, full-round action" : "Beyond lifting limit: cannot carry this load");
  } else if (race.id !== "dwarf" && (armorSlows || loadSlows)) {
    speed = slowedSpeed(speed);
    if (swimSpeed !== undefined) swimSpeed = slowedSpeed(swimSpeed);
    if (armorSlows) causes.push(`Armor: ${armor.name}${armoredMobility && armor.movementCategory === "Heavy" ? " (treated as medium)" : ""}`);
    if (loadSlows) causes.push(`${encumbrance.load} load: ${encumbrance.weight} lb.`);
  }
  const movement: {
    baseSpeed: number;
    speed: number;
    causes: string[];
    bonuses?: string[];
    baseSwimSpeed?: number;
    swimSpeed?: number;
  } = { baseSpeed, speed, causes };
  if (bonuses.length) movement.bonuses = bonuses;
  if (baseSwimSpeed !== undefined && swimSpeed !== undefined) {
    movement.baseSwimSpeed = baseSwimSpeed;
    movement.swimSpeed = swimSpeed;
  }
  return movement;
}
