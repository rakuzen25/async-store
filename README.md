# Async Store

Async Store is a small wrap around Node's AsyncLocalStorage API that lets you define Async Vars. An Async Var is an object which holds a value that's bound to the current execution context. In other words, it enables dependency injection with minimal overhead.

## Examlpes

### Logger injection

Use a file logger in development, otherwise use a Kafka logger.

```ts
/* main.ts */

import { app } from './app';
import { logger } from './logger';

async function main() {
  await new AsycScope().run(async () => {
    await logger.init();

    try {
      await app.run();
    }
    catch (error) {
      logger.error(error);
      process.exitCode ??= 1;
    }
  });
}

void main();
```
```ts
/* app/index.ts */

import { createServer } from 'http';
import { logger } from './logger';

export const app = {
  async run() {
    const server = createServer(router);

    server.listen(process.env.PORT, process.env.HOST, () => {
      logger.info(`Server is listening on ${process.env.HOST}:${process.env.PORT}`);
    });

    return new Promise((resolve, reject) => {
      server.on('close', resolve);
      server.on('error', reject);
    });
  }
};

function router(req: http.IncomingMessage, res: http.ServerResponse) {
  const logger = LoggerVar.get();

  logger.info('Incoming request', req.socket.address());

  // handle request ...
}
```
```ts
/* logger/index.ts */

import { ILogger } from './logger';

const LoggerVar = new AsyncVar<ILogger>('Logger');

export const logger = {
  init() {
    let logger: ILogger;

    if (process.env.NODE_ENV === 'development') {
      const { FileLogger } = await import('./file_logger');
      logger = new FileLogger();
    }
    else {
      const { KafkaLogger } = await import('./kafka_logger');
      logger = new KafkaLogger();
    }

    LoggerVar.set(logger);
  },

  info(message: string) {
    LoggerVar.get().info(message);
  },

  warn(message: string) {
    LoggerVar.get().warn(message);
  },

  error(message: string) {
    LoggerVar.get().error(message);
  },
}
```

## License

MIT
