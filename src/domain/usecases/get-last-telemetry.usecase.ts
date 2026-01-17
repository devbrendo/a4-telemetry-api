export type GetLastTelemetryInput = {
  tenantId: string;
  deviceId: string;
};

export type GetLastTelemetryOutput = {
  deviceId: string;
  readings: Array<{ value: number; timestamp: Date }>;
};

export interface IDeviceRepository {
  findByIdAndTenant(deviceId: string, tenantId: string): Promise<{ id: string } | null>;
}

export interface ITelemetryRepository {
  getLastReadings(
    deviceId: string,
    limit?: number
  ): Promise<Array<{ deviceId: string; value: number; timestamp: Date }>>;
}

export class GetLastTelemetryUseCase {
  constructor(
    private readonly deviceRepo: IDeviceRepository,
    private readonly telemetryRepo: ITelemetryRepository
  ) {}

  async execute(input: GetLastTelemetryInput): Promise<GetLastTelemetryOutput> {
    const device = await this.deviceRepo.findByIdAndTenant(input.deviceId, input.tenantId);

    if (!device) {
      throw Object.assign(new Error('Device not found'), { statusCode: 404 });
    }

    const readings = await this.telemetryRepo.getLastReadings(input.deviceId, 10);

    return {
      deviceId: input.deviceId,
      readings: readings.map((r) => ({
        value: r.value,
        timestamp: r.timestamp,
      })),
    };
  }
}
