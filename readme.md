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
  onInit: ({ store }) => {
    // Log changes to the counter
    effect(() => {
      console.log("Count is now:", store.state.count.value);
    });
  },
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
