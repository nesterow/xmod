import type { Signal } from "@preact/signals";

export type StoreModule = {
  state: (init: any) => { [key: string]: Signal<unknown> | unknown };
  persist: (state: State) => { [key: string]: unknown };
  mutate: (state: State, command: Command) => void;
  methods?: (state: State) => Record<string, (...args: any[]) => any>;
  // for injecting anything except signals
  inject?: (state: State) => Record<string, any>;
};

export interface Command<T = any, P = any, Doc = any> {
  type: T;
  payload: P;
  history?: boolean;
  comment?: Doc;
}

export interface State {
  [key: string]: Signal<unknown> | unknown;
}

export interface Store {
  state: State;
  dispatch: <T, R = any>(command: T) => R[];
  undo: () => void;
  redo: () => void;
}

export type InferPersist<T extends Record<string, any>> = Record<
  keyof T,
  Partial<Record<keyof T[keyof T], any>>
>;

export interface HistoryEntry {
  stateSnapshot: Record<string, any>;
  command: Command<unknown, unknown>;
  timestamp: number;
}
