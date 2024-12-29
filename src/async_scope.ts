import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<AsyncScope>();

export interface AsyncScope {
  [key: symbol]: unknown;
}

export class AsyncScope {
  static get() {
    const scope = storage.getStore();

    if (!scope) {
      throw new Error("Scope not found");
    }

    return scope;
  }

  constructor() {
    const parentScope = storage.getStore();

    if (parentScope) {
      Object.setPrototypeOf(this, parentScope);
    }
  }

  run<T>(callback: () => T) {
    return storage.run(this, callback);
  }
}
