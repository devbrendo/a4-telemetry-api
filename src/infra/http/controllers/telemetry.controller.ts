import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppFactory } from '../../../factories/app.factory';

type PostTelemetryBody = {
  deviceId: string;
  value: number;
};

type GetTelemetryParams = {
  deviceId: string;
};

export class TelemetryController {
  private readonly factory = AppFactory.getInstance();

  async postTelemetry(request: FastifyRequest<{ Body: PostTelemetryBody }>, reply: FastifyReply) {
    const { deviceId, value } = request.body ?? ({} as PostTelemetryBody);

    if (!deviceId || typeof deviceId !== 'string') {
      return reply.status(400).send({ message: 'deviceId is required' });
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return reply.status(400).send({ message: 'value must be a number' });
    }

    const useCase = this.factory.getIngestTelemetryUseCase();

    try {
      await useCase.execute({
        tenantId: request.user.tenantId,
        deviceId,
        value,
      });

      return reply.status(201).send({ ok: true });
    } catch (err: any) {
      const statusCode = err?.statusCode ?? 500;
      return reply.status(statusCode).send({ message: err?.message ?? 'Internal error' });
    }
  }

  async getTelemetry(request: FastifyRequest<{ Params: GetTelemetryParams }>, reply: FastifyReply) {
    const deviceId = request.params?.deviceId;

    if (!deviceId || typeof deviceId !== 'string') {
      return reply.status(400).send({ message: 'deviceId is required' });
    }

    const useCase = this.factory.getLastTelemetryUseCase();

    try {
      const result = await useCase.execute({
        tenantId: request.user.tenantId,
        deviceId,
      });

      return reply.status(200).send(result);
    } catch (err: any) {
      const statusCode = err?.statusCode ?? 500;
      return reply.status(statusCode).send({ message: err?.message ?? 'Internal error' });
    }
  }
}
