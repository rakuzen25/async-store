import { AsyncScope } from "./async_scope";

export class AsyncVar<T> {
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
      throw new Error(`Varialble "${this.name}" not found`);
    }

    const scope = AsyncScope.get(silent);

    return scope ? (scope[this.#symbol] as T) : undefined;
  }

  exists(silent = false) {
    const scope = AsyncScope.get(silent);

    return scope ? this.#symbol in scope : false;
  }
}
