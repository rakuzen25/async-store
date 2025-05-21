import { AsyncScope } from "./async_scope";

export class AsyncVar<T> {
  static NotFoundError = class extends Error {
    constructor(name: string) {
      super(`Variable "${name}" not found`);
      this.name = "AsyncVarNotFoundError";
    }
  };

  static set<T>(name: string, value: T) {
    const scope = AsyncScope.get();
    scope[Symbol.for(name)] = value;
  }

  static get<T>(name: string, silent: boolean): T | undefined;
  static get<T>(name: string, silent?: false): T;
  static get<T>(name: string, silent = false): T | undefined {
    const scope = AsyncScope.get(silent);
    if (!scope) {
      return;
    }

    const symbol = Symbol.for(name);
    if (!(symbol in scope)) {
      if (!silent) {
        throw new AsyncVar.NotFoundError(name);
      }
      return;
    }

    return scope[symbol] as T;
  }

  static unset(name: string) {
    const scope = AsyncScope.get();
    if (scope) {
      delete scope[Symbol.for(name)];
    }
  }

  readonly #symbol: symbol;

  constructor(readonly name: string) {
    this.#symbol = Symbol(name);
  }

  set(value: T) {
    const scope = AsyncScope.get();
    scope[this.#symbol] = value;
  }

  get(silent: boolean): T | undefined;
  get(silent?: false): T;
  get(silent = false) {
    if (!this.exists(silent)) {
      if (!silent) {
        throw new AsyncVar.NotFoundError(this.name);
      }
      return;
    }

    const scope = AsyncScope.get(silent);
    return scope ? scope[this.#symbol] : undefined;
  }

  unset() {
    const scope = AsyncScope.get();
    if (scope) {
      delete scope[this.#symbol];
    }
  }

  exists(silent = false) {
    const scope = AsyncScope.get(silent);
    return scope ? this.#symbol in scope : false;
  }
}
