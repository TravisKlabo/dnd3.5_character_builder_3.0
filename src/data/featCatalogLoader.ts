import { featCatalog } from "./featCatalogRegistry";

let pendingLoad: Promise<void> | undefined;

export function loadFeatCatalog(): Promise<void> {
  if (featCatalog.length) return Promise.resolve();
  pendingLoad ??= import("./featCatalogData").then(({ featCatalog: entries }) => {
    featCatalog.push(...entries);
  });
  return pendingLoad;
}
