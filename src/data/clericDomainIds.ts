export const coreClericDomainIds = [
  "air", "animal", "chaos", "death", "destruction", "earth", "evil", "fire",
  "good", "healing", "knowledge", "law", "luck", "magic", "plant", "protection",
  "strength", "sun", "travel", "trickery", "war", "water",
] as const;

export const dragonlanceDomainIds = [
  "alteration", "community", "forge", "insight", "liberation", "meditation",
  "mentalism", "necromancy", "passion", "pestilence", "restoration", "storm", "treachery",
] as const;

export const completeDivineDomainIds = [
  "celerity", "cold", "competition", "creation", "domination", "dream",
  "force", "glory", "inquisition", "madness", "mind", "mysticism",
  "oracle", "pact", "purification", "summoner", "weather",
] as const;

export const clericDomainIds = [
  "air", "animal", "chaos", "death", "destruction", "earth", "evil", "fire",
  "good", "healing", "knowledge", "law", "luck", "magic", "alteration",
  "community", "forge", "insight", "liberation", "meditation", "mentalism",
  "necromancy", "passion", "pestilence", "plant", "protection", "strength",
  "sun", "restoration", "storm", "travel", "trickery", "treachery", "war", "water",
  "celerity", "cold", "competition", "creation", "domination", "dream",
  "force", "glory", "inquisition", "madness", "mind", "mysticism",
  "oracle", "pact", "purification", "summoner", "weather",
] as const;

export type ClericDomainId =
  | typeof coreClericDomainIds[number]
  | typeof dragonlanceDomainIds[number]
  | typeof completeDivineDomainIds[number];

export function isClericDomainId(value: unknown): value is ClericDomainId {
  return typeof value === "string" &&
    ((coreClericDomainIds as readonly string[]).includes(value) ||
      (dragonlanceDomainIds as readonly string[]).includes(value) ||
      (completeDivineDomainIds as readonly string[]).includes(value));
}

export function isCompleteDivineDomainId(value: ClericDomainId) {
  return (completeDivineDomainIds as readonly string[]).includes(value);
}

export function isDragonlanceDomainId(value: ClericDomainId) {
  return (dragonlanceDomainIds as readonly string[]).includes(value) &&
    !["community", "liberation", "pestilence"].includes(value);
}
