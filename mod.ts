export * from "./types.ts";
export * from "./factory.ts";
export * from "./utils/SortedAddon.ts";
export * from "./utils/getAddons.ts";
export * from "./store/mod.ts";
export * from "./utils/LocalStorageAdapter.ts";
export * from "./utils/NoopStorageAdapter.ts";

import type { StoreModule, XModule, Store } from "./types.ts";
import type { StorageAdapter } from "./utils/LocalStorageAdapter.ts";
import { createContainer } from "./factory.ts";
import { createStore } from "./store/factory.ts";

export type CreateAppOpts = {
  id: string;
  modules: XModule[];
  storage?: StorageAdapter;
};

export function createApp({ id, modules, storage }: CreateAppOpts): Store {
  const storeModules: StoreModule[] = modules
    .map((p) => p.store)
    .filter((p) => !!p);

  const store = createStore({
    storage,
    storeId: id,
    modules: storeModules,
  });

  createContainer(store, modules);
  return store;
}
