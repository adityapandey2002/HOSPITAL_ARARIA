/**
 * Vercel Node function entry point.
 *
 * This file is deliberately plain CommonJS and loads the **compiled** Nest app
 * from `dist/`, not the TypeScript sources: Vercel transpiles `.ts` functions
 * without `emitDecoratorMetadata`, which would break Nest's dependency
 * injection. `nest build` (run by vercel.json's buildCommand) emits the metadata
 * into `dist/` first.
 *
 * Vercel hands the function a Node `IncomingMessage`/`ServerResponse`, which is
 * exactly what the Express instance Nest exposes can consume — no
 * `serverless-http` shim is needed. The container is built once per warm
 * instance and reused; cold starts pay the bootstrap cost, later requests do
 * not.
 *
 * Deployment contract: docs/DEPLOYMENT.md.
 */
'use strict';

const { createApp } = require('../dist/bootstrap');

/** @type {Promise<(req: import('http').IncomingMessage, res: import('http').ServerResponse) => void> | undefined} */
let handler;

function getHandler() {
  if (!handler) {
    handler = createApp({ init: true })
      .then((app) => app.getHttpAdapter().getInstance())
      .catch((error) => {
        // Never cache a rejected bootstrap: the next request should retry
        // instead of failing for the lifetime of the instance.
        handler = undefined;
        throw error;
      });
  }
  return handler;
}

module.exports = async function vercelHandler(req, res) {
  const app = await getHandler();
  app(req, res);
};
