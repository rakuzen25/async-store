import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AsyncVar } from './async_var';

describe('AsyncVar', () => {
  it('Throws if scope is undefined', () => {
    const FooVar = new AsyncVar('Foo');

    assert.throws(() => {
      FooVar.get();
    }, /not found/);
  });
});
