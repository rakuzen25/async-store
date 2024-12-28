import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AsyncVar } from './async_var';
import { AsyncScope } from './async_scope';

describe('AsyncVar', () => {
  it('Throws if scope is undefined', () => {
    const FooVar = new AsyncVar('Foo');

    assert.throws(() => {
      FooVar.get();
    }, /scope.+not found/i);
  });

  it('Throws if var is undefined', async () => {
    const FooVar = new AsyncVar('Foo');

    await new AsyncScope().run(async () => {
      assert.throws(() => {
        FooVar.get();
      }, /var.+foo.+not found/i);
    });
  });

  it('Checks if var exists', async () => {
    const FooVar = new AsyncVar('Foo');

    await new AsyncScope().run(async () => {
      assert.equal(FooVar.exists(), false);

      FooVar.set(1);

      assert.equal(FooVar.exists(), true);
    });
  });

  it('Gets var value', async () => {
    const FooVar = new AsyncVar('Foo');

    await new AsyncScope().run(async () => {
      FooVar.set(1);

      assert.equal(FooVar.get(), 1);

      FooVar.set(true);

      assert.equal(FooVar.get(), true);
    });
  });

  it('Gets var value of nested scope', async () => {
    const FooVar = new AsyncVar('Foo');

    await new AsyncScope().run(async () => {
      FooVar.set(1);

      assert.equal(FooVar.get(), 1);

      await new AsyncScope().run(async () => {
        assert.equal(FooVar.get(), 1);

        FooVar.set(2);

        assert.equal(FooVar.get(), 2);
      });

      assert.equal(FooVar.get(), 1);
    });
  });

  it('Gets var value of parallel scope', async () => {
    const FooVar = new AsyncVar('Foo');

    await new AsyncScope().run(async () => {
      FooVar.set(1);

      assert.equal(FooVar.get(), 1);

      const scope1 = new AsyncScope().run(async () => {
        FooVar.set(2);

        // Run scope2
        await Promise.resolve();

        assert.equal(FooVar.get(), 2);
      });

      const scope2 = new AsyncScope().run(async () => {
        FooVar.set(3);

        // Continue scope1
        await Promise.resolve();

        assert.equal(FooVar.get(), 3);
      });

      await Promise.all([scope1, scope2]);

      assert.equal(FooVar.get(), 1);
    });
  });
});
