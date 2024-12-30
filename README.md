# Async Store

Async Store is a small wrap around Node's [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) API that lets you define Async Vars. An Async Var is an object which holds a value that's bound to the current execution context. In other words, it enables dependency injection with minimal overhead.

You can get started by installing `async_store` via NPM:

```sh
npm i async_store@dabomb/async_store
```

## Usage Examlpes

### Logging

Use a file logger in development, otherwise use a Kafka logger.

```ts
/* main.ts */

import { AsyncScope } from 'async_store';
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
  run() {
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
  logger.info('Incoming request', req.socket.address());

  // handle request ...
}
```
```ts
/* logger/index.ts */

import { AsyncVar } from 'async_store';
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

### Routing

Extract account data from current request.

```ts
/* app.ts */

import express from 'express';
import { AsyncScope } from 'async_store';
import { authRouter } from './routers/auth_router';
import { accountRouter } from './routers/account_router';
import { publicRouter } from './routers/public_router';

export const app = express();

app.use((req, res, next) => {
  new AsyncScope().run(next);
});

appRouter.use('/auth', authRouter);
appRouter.use('/account', accountRouter);
appRouter.use('/public', publicRouter);
```
```ts
/* routers/account_router.ts */

import { Router } from 'express';
import { auth } from '../auth';

export const accountRouter = Router();

accountRouter.use((req, res, next) => {
  auth.init(req);

  if (!auth.account) {
    res.status(401);
    return;
  }

  next();
})

accountRouter.get('/', (req, res) => {
  res.json(auth.account);
});

// more routes ...
```
```ts
/* auth.ts */

import { AsyncVar } from 'async_store';
import { parse as parseCookie } from 'cookie';
import * as http from 'http';
import { Account } from './accout';

const AuthVar = new AsyncVar<{ account: Account }>('Auth');

const auth = {
  get account() {
    return AuthVar.exists() ? AuthVar.get().account : null;
  },

  init(req: http.IncomingMessage) {
    const cookieHeader = req.headers['cookie'];
    if (!cookieHeader) return null;

    const cookies = parseCookie(cookieHeader);
    const jwt = cookies['jwt'];
    if (!jwt) return null;

    const payload = jwt.split('.')[1];
    if (!payload) return null;

    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    const account = Account.parse(JSON.parse(decodedPayload));

    Auth.set({ account });
  },
}
```

## License

MIT
