import Fastify from 'fastify';
import { registerRoutes } from './infra/http/routes'

export function buildApp() {
  const app = Fastify({ logger: true });
  registerRoutes(app);
  return app;
}
