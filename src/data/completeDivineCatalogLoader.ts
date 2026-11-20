import { deityDefinitions, dragonlancePrestigeClasses } from "../domain";

let loaded = false;
let pending: Promise<void> | undefined;

export function loadCompleteDivineCatalog() {
  if (loaded) return Promise.resolve();
  if (pending) return pending;
  pending = Promise.all([
    import("./completeDivineDeities"),
    import("./completeDivinePrestigeData"),
  ]).then(([{ completeDivineDeities }, { completeDivinePrestigeDefinitions }]) => {
    const deityIds = new Set(deityDefinitions.map(({ id }) => id));
    for (const definition of completeDivineDeities) {
      if (!deityIds.has(definition.id)) deityDefinitions.push(definition);
    }
    for (const definition of completeDivinePrestigeDefinitions) {
      if (!dragonlancePrestigeClasses[definition.id]) {
        dragonlancePrestigeClasses[definition.id] = definition;
      }
    }
    loaded = true;
  }).finally(() => { pending = undefined; });
  return pending;
}
