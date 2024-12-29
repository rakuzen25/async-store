import { AsyncLocalStorage } from "node:async_hooks";

const asyncLocalStorage = new AsyncLocalStorage<AsyncScope>();

export interface AsyncScope {
  [key: symbol]: unknown;
}

export class AsyncScope {
  static get() {
    const scope = asyncLocalStorage.getStore();

    if (!scope) {
      throw new Error("Scope not found");
    }

    return scope;
  }

  constructor() {
    const parentScope = asyncLocalStorage.getStore();

    if (parentScope) {
      Object.setPrototypeOf(this, parentScope);
    }
  }

  run<T>(callback: () => T) {
    return asyncLocalStorage.run(this, callback);
  }
}
