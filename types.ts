export * from "./store/types.ts";

import type { SortedAddon } from "./utils/SortedAddon.ts";
import type { Store, StoreModule } from "./store/types.ts";

export type Addon<T extends (...args: any) => any = any> = SortedAddon<T>;

export interface ModuleInitOptions {
  store: Store;
}

export interface Slots extends Record<string, any> {}
export type BeforeInitCallback = (opts: Slots) => void;
export type ModuleInitCallback = (opts: ModuleInitOptions) => void;

export type XModule<T extends Record<string, any> = Record<string, any>> = {
  name: string;
  dependencies?: string[];
  tableProps?: T;
  beforeInit?: BeforeInitCallback;
  onInit?: ModuleInitCallback;
  afterInit?: ModuleInitCallback;
  store?: StoreModule;
  slots?: () => Partial<Slots>;
  hooks?: Record<string, (...args: any[]) => any>;
};
