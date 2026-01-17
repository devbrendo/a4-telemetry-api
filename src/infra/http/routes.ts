import type { FastifyInstance } from 'fastify';
import { authMiddleware } from './middleware/auth';
import { TelemetryController } from './controllers/telemetry.controller';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  const controller = new TelemetryController();

  app.post('/telemetry', { preHandler: authMiddleware }, controller.postTelemetry.bind(controller));
  app.get(
    '/telemetry/:deviceId',
    { preHandler: authMiddleware },
    controller.getTelemetry.bind(controller)
  );
}
