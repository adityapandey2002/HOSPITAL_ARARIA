/**
 * Vercel Node function entry point.
 *
 * Vercel hands the function a Node `IncomingMessage`/`ServerResponse`, which is
 * exactly what the Express instance Nest exposes can consume — so no
 * `serverless-http` shim is needed. The Nest container is built once per warm
 * instance and reused; cold starts pay the bootstrap cost, later requests do
 * not.
 *
 * Deployment contract: docs/DEPLOYMENT.md.
 */
import type { IncomingMessage, ServerResponse } from 'http';

import type { NestExpressApplication } from '@nestjs/platform-express';

import { createApp } from '../src/bootstrap';

/** The callable Express application Nest wraps. */
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Promise<NodeHandler> | undefined;

function getHandler(): Promise<NodeHandler> {
  if (!handler) {
    handler = createApp({ init: true })
      .then((app: NestExpressApplication) => app.getHttpAdapter().getInstance() as NodeHandler)
      .catch((error: unknown) => {
        // Never cache a rejected bootstrap: the next request should retry
        // instead of failing for the lifetime of the instance.
        handler = undefined;
        throw error;
      });
  }
  return handler;
}

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const app = await getHandler();
  app(req, res);
}
