import { AsyncScope } from "./async_scope";

export class AsyncVar<T> {
  static NotFoundError = class extends Error {
    constructor(name: string) {
      super(`Variable "${name}" not found`);
      this.name = "AsyncVarNotFoundError";
    }
  };

  readonly #symbol: symbol;

  constructor(
    readonly name: string,
    global?: boolean,
  ) {
    this.#symbol = global ? Symbol.for(name) : Symbol(name);
  }

  set(value: T) {
    const scope = AsyncScope.get();

    scope[this.#symbol] = value;
  }

  get(silent: boolean): T | undefined;
  get(silent?: false): T;
  get(silent = false) {
    if (!silent && !this.exists(false)) {
      throw new AsyncVar.NotFoundError(this.name);
    }

    const scope = AsyncScope.get(silent);

    return scope ? (scope[this.#symbol] as T) : undefined;
  }

  exists(silent = false) {
    const scope = AsyncScope.get(silent);

    return scope ? this.#symbol in scope : false;
  }
}
