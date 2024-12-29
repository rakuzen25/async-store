import { AsyncScope } from "./async_scope";

export class AsyncVar<T> {
  private readonly symbol = Symbol(this.name);

  constructor(readonly name: string) {}

  set(value: T) {
    const scope = AsyncScope.get();

    scope[this.symbol] = value;
  }

  get() {
    if (!this.exists()) {
      throw new Error(`Varialble "${this.name}" not found`);
    }

    const scope = AsyncScope.get();

    return scope[this.symbol] as T;
  }

  exists() {
    const scope = AsyncScope.get();

    return this.symbol in scope;
  }
}
