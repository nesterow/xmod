# XMod: A Modular and Extensible State Manager

XMod is a lightweight, modular, and highly extensible state management library
for TypeScript and Deno, built on top of Preact Signals. It's designed to help
you build complex applications by composing independent, reusable modules.

## Core Concepts

- **Modules (`XModule`):** The fundamental building block in XMod. Each module
  encapsulates a piece of your application's state, logic, and UI. Modules can
  be independent or declare dependencies on other modules.
- **The Store:** A central hub that holds the application state, manages state
  persistence.
- **State and Mutations:** State is built from Preact Signals, making it
  reactive by default. State is modified by dispatching commands, which are
  handled by mutation functions within modules.
- **Persistence:** The store can persist its state to various storage backends
  using `StorageAdapter`. A `LocalStorageAdapter` is included.
- **Extensibility (Slots, Hooks, and Addons):** XMod is designed to be extended.
  Modules can expose and consume `slots` (for sharing UI elements or values),
  `hooks` (for sharing functions),

## Getting Started

Here's how to create a simple application with XMod.

### 1. Define your Modules

An `XModule` is a plain object that describes a piece of your application.

```typescript
import { createApp, createStore, XModule } from "./mod.ts";
import { signal } from "@preact/signals";

// A module for managing a counter
const counterModule: XModule = {
  name: "counter",
  store: {
    state: () => ({
      count: signal(0),
    }),
    mutate: (state, command) => {
      if (command.type === "INCREMENT") {
        state.count.value++;
      }
      if (command.type === "DECREMENT") {
        state.count.value--;
      }
    },
    persist: (state) => ({
      count: state.count.value,
    }),
  },
};

// A module that depends on the counter
const loggerModule: XModule = {
  name: "logger",
  dependencies: ["counter"],
};
```

### 2. Create the Application

Use the `createApp` function to wire up your modules and create the store.

```typescript
const store = createApp({
  id: "my-app",
  modules: [counterModule, loggerModule],
});
```

### 3. Use the Store

Dispatch commands to modify the state and access the state for rendering or
other logic.

```typescript
// Dispatch commands
store.dispatch({ type: "INCREMENT" }); // Logs: "Count is now: 1"
store.dispatch({ type: "INCREMENT" }); // Logs: "Count is now: 2"

// Access state
console.log(store.state.count.value); // 2
```

## Core Concepts

### Modules (`XModule`):**

The fundamental building block in @xmod. Each module encapsulates a piece of
your application's state, logic, and UI. Modules can be independent or declare
dependencies on other modules.

XModule is an object with following type signature:

```ts
export type Addon<T extends (...args: any) => any = any> = SortedAddon<T>;

export interface ModuleInitOptions {
  store: Store;
}

export interface Slots extends Record<string, any> {}
export type BeforeInitCallback = (opts: Slots) => void;
export type ModuleInitCallback = (opts: ModuleInitOptions) => void;
export type ModuleHooksCallback = (opts: {
  modules: XModule[];
  store: Store;
}) => Record<string, (...args: any[]) => any>;

export interface XModule<T extends Record<string, any> = Record<string, any>> {
  name: string;
  dependencies?: string[];
  store?: StoreModule;
  slots?: () => Partial<Slots>;
  hooks?: ModuleHooksCallback;
  beforeInit?: BeforeInitCallback;
  onInit?: ModuleInitCallback;
  afterInit?: ModuleInitCallback;
}
```

Only required argument is `name` which must be unique for the application scope.
The optional `dependencies` array is module names this module depends on.

### Store Factory

Accepts an object with following type signature:

```ts
type StoreModule = {
  state: (init: any) => { [key: string]: Signal<unknown> | unknown };
  persist: (state: State) => { [key: string]: unknown };
  mutate: (state: State, command: Command) => void;
  methods?: (state: State) => Record<string, (...args: any[]) => any>;
  // for injecting anything except signals
  inject?: (state: State) => Record<string, any>;
};
```

Usually a store factory lives in a separate file which does module augmetation
and provide types. See module example below.

### Slots Factory

Slots can have any type (callback, jsx, string, etc). A factory implementation
has to provide module augmetation which specifies type used by slot.

```ts
import { SortedAddon } from "@xmod/mod.ts";
import type { ClassResolverCallback } from "@/table/types.ts";

declare module "@xmod/types.ts" {
  interface Slots {
    // here we use SortedAddon, but the type sig can be anything
    // and defined by a consumer
    columnclasses: SortedAddon<ClassResolverCallback>;
  }
}

export const slots = () => ({
  columnclasses: new SortedAddon<ClassResolverCallback>(),
});
```

Slots are injected into the addons container and when needed they can be accesed
by using getAddon({ store }) method.

```tsx
import { getAddons } from "@xmod/mod.ts";

// example: consuming a slot
export const Cell = ({ store, column, row }: CellProps) => {
  const addons = getAddons({ store });
  // some code...
  const classes = addons.columnclasses.string({
    column,
    store,
  });
  
  return (
    <td className={"my-cell " + classes}>
      {/* some code.. */}
    </td>
  )
```

### Hooks

Hooks allow to extend the XModule interface itself when we want to add our own
methods . The hook handlers live in the addons container and initialized by a
`hooks` factory, the hook callbacks should be provided by an XModule
implementation.

Example hooks factory:

```ts
declare module "@xmod/types.ts" {
  interface XModule {
    beforeLoad?: BeforeLoadCallback;
  }
}

export const hooks: ModuleHooksCallback = ({ modules, store }) => {
  const beforeLoad = async (options: DataLoadOptions) => {
    let result = options;
    for (const plugin of modules) {
      result = (await plugin.beforeLoad?.({
        options: result,
        store,
      })) ?? result;
    }
    return result;
  };
  return {
    beforeLoad,
  };
};
```

Example providing a hook:

```ts
// ... a sorting module part ...
//
const beforeLoad: BeforeLoadCallback = ({ options, store }) => {
  const sorting = store.state.sorting.value;
  if (!options) return options;
  options.sort = sorting;
  return options;
};

export const SortingModule: XModule = {
  name: "sorting",
  beforeInit,
  beforeLoad,
  store,
};
```

Example consuming hooks of a type:

```ts
import { getAddons } from "@xmod/mod.ts";
import { useEffect } from "preact/hooks";

export function useMyFetch({ store, url, options }) {
  const { beforeLoad } = getAddons({ store });
  useEffect(() => {
    const requestOpts = beforeLoad(options); // modules will extend options
    // ... fetch with new requestOpts ...
  }, [url]);
}
```

### Before Init

`beforeInit` is called before store initialzation, and receives slots defined by
all modules - when we want to render a compenent in a slot, we use this
callback. Usually a slot uses a SortedAddon interface, but it may have any type
signature.

### On Init

`onInit` is called after state factory gathered all singnals ands other state
from the modules. The callback receives store as an argument onInit({ store })

### After Init

`onInit` is called after all `onInit` mutations executed i.e. all modules
initialized state.

END OF DOCS
