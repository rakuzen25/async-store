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

### Request payload injection

```ts
/* router/index.ts */

import { authRouter } from './auth_router';
import { accountRouter } from './account_router';
import { publicRouter } from './publicRouter_router';

const children = [
  authRouter,
  accountRouter,
  publicRouter,
];

async function router(req: http.IncomingMessage, res: http.ServerResponse) {
  await new AsyncScope().run(async () => {
    route.init(req, res);

    for (const child of children) {
      if (res.statusCode) {
        return;
      }

      await child();
    }

    if (!res.statusCode) {
      res.statusCode = 404;
      res.end();
    }
  });
}
```
```ts
/* router/auth_router.ts */

export function authRouter() {
  switch (route.key) {
    case 'POST /auth/sign-in': return signIn();
    case 'POST /auth/sign-up': return signUp();
    case 'POST /auth/sign-out': return signOut();
  }
}
```
```ts
/* router/account_router.ts */

export function accountRouter() {
  auth.init();

  if (!auth.account) {
    return;
  }

  switch (route.key) {
    case 'GET /account/profile': return getProfile();
    case 'PUT /account/profile': return updateProfile();
    case 'GET /account/settings': return getSettings();
    case 'PUT /account/settings': return updateSettings();
  }
}
```
```ts
/* router/public_router.ts */

function publicRouter() {
  switch (route.key) {
    case 'GET /ping': return ping();
    case 'GET /timestamp': return getTimestamp();
    case 'GET /info': return getInfo();
  }
}
```
```ts
/* route.ts */

import { AsyncVar } from 'async_store';
import * as http from 'http';

const RouteVar = new AsyncVar<{
  req: http.IncomingMessage,
  res: http.ServerResponse,
  key: string,
}>();

export const route = {
  get req() {
    return RouteVar.get().req;
  },

  get res() {
    return RouteVar.get().res;
  },

  get key() {
    return RouteVar.get().key;
  },

  init(req: http.IncomingMessage, res: http.ServerResponse) {
    const key = `${req.method} ${req.url.pathname}`;

    RouteVar.set({ req, res, key });
  }
};
```
```ts
/* account.ts */

import { AsyncVar } from 'async_store';
import { parse as parseCookie } from 'cookie';

const AuthVar = new AsyncVar<{ account: any }>('Auth');

const auth = {
  get account() {
    return AuthVar.exists() ? AuthVar.get().account : null;
  },

  init() {
    const cookie = route.req.headers['cookie'];
    if (!cookieHeader) return null;

    const cookies = parseCookie(cookieHeader);
    const jwt = cookies['jwt'];
    if (!jwt) return null;

    const payload = jwt.split('.')[1];
    if (!payload) return null;

    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    const account = JSON.parse(decodedPayload);

    Auth.set({ account });
  },
}
```

## License

MIT
