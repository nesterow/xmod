import type { Slots, XModule } from "./types.ts";
import type { Store } from "./store/mod.ts";
import { ADDONS_CONTAINER_ACCESSOR } from "./utils/private.ts";

export interface Container extends Slots {}

export const createContainer = (
  store: Store,
  modules: XModule[],
): Container => {
  const sorted = [...modules].sort((a, b) => {
    if (a.dependencies?.includes(b.name)) {
      return 1;
    }
    if (b.dependencies?.includes(a.name)) {
      return -1;
    }
    return 0;
  });

  const slots = modules.reduce(
    (acc, val) => ({ ...acc, ...(val.slots?.() ?? {}) }),
    {},
  ) as Slots;

  modules.forEach((mod) => mod.beforeInit?.(slots));

  setTimeout(async () => {
    for (const plugin of sorted) {
      plugin.onInit?.({
        store,
      });
    }
    await new Promise((r) => setTimeout(r, 1));
    for (const plugin of sorted) {
      plugin.afterInit?.({
        store,
      });
    }
  }, 0);

  const hooks = modules.reduce(
    (acc, val) => ({ ...acc, ...(val.hooks?.(sorted) ?? {}) }),
    {},
  ) as Record<string, any>;

  const container = {
    ...hooks,
    ...slots,
  };

  // @ts-ignore: some privats
  store[ADDONS_CONTAINER_ACCESSOR] = container;

  return container;
};
