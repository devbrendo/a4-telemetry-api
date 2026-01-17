export type IngestTelemetryInput = {
  tenantId: string;
  deviceId: string;
  value: number;
};

export type IngestTelemetryOutput = {
  ok: true;
};

export interface IDeviceRepository {
  findByIdAndTenant(deviceId: string, tenantId: string): Promise<{ id: string } | null>;
}

export interface ITelemetryRepository {
  insertReading(params: { deviceId: string; value: number; timestamp: Date }): Promise<void>;
}

export class IngestTelemetryUseCase {
  constructor(
    private readonly deviceRepo: IDeviceRepository,
    private readonly telemetryRepo: ITelemetryRepository
  ) {}

  async execute(input: IngestTelemetryInput): Promise<IngestTelemetryOutput> {
    const device = await this.deviceRepo.findByIdAndTenant(input.deviceId, input.tenantId);

    // 404 (e não 403) evita revelar se o device existe em outro tenant
    if (!device) {
      throw Object.assign(new Error('Device not found'), { statusCode: 404 });
    }

    await this.telemetryRepo.insertReading({
      deviceId: input.deviceId,
      value: input.value,
      timestamp: new Date(),
    });

    return { ok: true };
  }
}
