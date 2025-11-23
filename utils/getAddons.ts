import { ADDONS_CONTAINER_ACCESSOR } from "./private.ts";
import type { Store } from "../types.ts";
import type { Container } from "../factory.ts";

export function getAddons({ store }: { store: Store }): Container {
  // @ts-ignore: some privats
  return store[ADDONS_CONTAINER_ACCESSOR];
}
