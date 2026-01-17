import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';

import { sensorReadings } from '../infra/db/schema';

export type SensorReading = {
  deviceId: string;
  value: number;
  timestamp: Date;
};

export class TelemetryRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async insertReading(params: { deviceId: string; value: number; timestamp: Date }): Promise<void> {
    await this.db.insert(sensorReadings).values({
      id: randomUUID(),
      deviceId: params.deviceId,
      // numeric no Postgres: melhor salvar como string pra não dar surpresa
      value: params.value.toFixed(2),
      timestamp: params.timestamp,
    });
  }

  async getLastReadings(deviceId: string, limit = 10): Promise<SensorReading[]> {
    const rows = await this.db
      .select({
        deviceId: sensorReadings.deviceId,
        value: sensorReadings.value,
        timestamp: sensorReadings.timestamp,
      })
      .from(sensorReadings)
      .where(eq(sensorReadings.deviceId, deviceId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(limit);

    return rows.map((r) => ({
      deviceId: r.deviceId,
      value: Number(r.value), // numeric do PG costuma vir string
      timestamp: r.timestamp,
    }));
  }
}
