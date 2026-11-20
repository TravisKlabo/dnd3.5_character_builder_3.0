import type { Character } from "./domain";
import type { ClericDomainId } from "./data/clericDomains";

export function getPrestigeClericDomains(character: Pick<
  Character,
  "classLevels" | "divineCrusaderDomain" | "clericUndeadTurningMode" | "alignment"
  | "contemplativeDomains"
  | "radiantServantDomain"
>) {
  const prestigeLevels = new Map<string, number>();
  for (const entry of character.classLevels) {
    if ("prestigeClassId" in entry)
      prestigeLevels.set(
        entry.prestigeClassId,
        Math.max(prestigeLevels.get(entry.prestigeClassId) ?? 0, entry.level),
      );
  }
  const prestigeLevel = (id: string) => prestigeLevels.get(id) ?? 0;
  const domains: ClericDomainId[] = [];
  if (prestigeLevel("church-inquisitor") >= 1) domains.push("inquisition");
  if (prestigeLevel("contemplative") >= 1 &&
      character.contemplativeDomains?.[0])
    domains.push(character.contemplativeDomains[0]);
  if (prestigeLevel("contemplative") >= 6 &&
      character.contemplativeDomains?.[1])
    domains.push(character.contemplativeDomains[1]);
  if (prestigeLevel("divine-oracle") >= 1) domains.push("oracle");
  if (character.divineCrusaderDomain && prestigeLevel("divine-crusader") >= 1)
    domains.push(character.divineCrusaderDomain);
  if (prestigeLevel("radiant-servant-of-pelor") >= 5 &&
      character.radiantServantDomain)
    domains.push(character.radiantServantDomain);
  if (prestigeLevel("seeker-of-the-misty-isle") >= 1) domains.push("travel");
  if (prestigeLevel("seeker-of-the-misty-isle") >= 7) domains.push("magic");
  if (prestigeLevel("rainbow-servant") >= 1) domains.push("good");
  if (prestigeLevel("rainbow-servant") >= 4) domains.push("air");
  if (prestigeLevel("rainbow-servant") >= 7) domains.push("law");
  if (prestigeLevel("warpriest") >= 1) {
    domains.push(
      character.clericUndeadTurningMode === "rebuke" ||
        (!character.clericUndeadTurningMode && character.alignment.endsWith(" Evil"))
        ? "domination"
        : "glory",
    );
  }
  return [...new Set(domains)];
}
