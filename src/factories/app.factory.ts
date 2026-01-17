import { db } from '../infra/db/drizzle';
import { clickhouse } from '../infra/db/clickhouse';

import { DeviceRepository } from '../repositories/device.repository';
import { TelemetryRepository } from '../repositories/telemetry.repository';

import { IngestTelemetryUseCase } from '../domain/usecases/ingest-telemetry.usecase';
import { GetLastTelemetryUseCase } from '../domain/usecases/get-last-telemetry.usecase';

export class AppFactory {
  private static instance: AppFactory | null = null;

  private readonly deviceRepository: DeviceRepository;
  private readonly telemetryRepository: TelemetryRepository;

  private readonly ingestTelemetryUseCase: IngestTelemetryUseCase;
  private readonly getLastTelemetryUseCaseInstance: GetLastTelemetryUseCase;

  private constructor() {
    this.deviceRepository = new DeviceRepository(db);
    this.telemetryRepository = new TelemetryRepository(clickhouse);

    this.ingestTelemetryUseCase = new IngestTelemetryUseCase(
      this.deviceRepository,
      this.telemetryRepository
    );

    this.getLastTelemetryUseCaseInstance = new GetLastTelemetryUseCase(
      this.deviceRepository,
      this.telemetryRepository
    );
  }

  static getInstance(): AppFactory {
    if (!this.instance) this.instance = new AppFactory();
    return this.instance;
  }

  getIngestTelemetryUseCase(): IngestTelemetryUseCase {
    return this.ingestTelemetryUseCase;
  }

  getLastTelemetryUseCase(): GetLastTelemetryUseCase {
    return this.getLastTelemetryUseCaseInstance;
  }
}
