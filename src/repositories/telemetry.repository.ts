import type { ClickHouseClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';

export type SensorReading = {
  deviceId: string;
  value: number;
  timestamp: Date;
};

export class TelemetryRepository {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  async insertReading(params: { deviceId: string; value: number; timestamp: Date }): Promise<void> {
    await this.clickhouse.insert({
      table: 'sensor_readings',
      values: [
        {
          id: randomUUID(),
          device_id: params.deviceId,
          value: params.value.toFixed(2),
          timestamp: Math.floor(params.timestamp.getTime() / 1000), // Unix timestamp in seconds
        },
      ],
      format: 'JSONEachRow',
    });
  }

  async getLastReadings(deviceId: string, limit = 10): Promise<SensorReading[]> {
    const query = `
      SELECT
        device_id as deviceId,
        value,
        timestamp
      FROM sensor_readings
      WHERE device_id = {deviceId:UUID}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
    `;

    const resultSet = await this.clickhouse.query({
      query,
      query_params: {
        deviceId,
        limit,
      },
      format: 'JSONEachRow',
    });

    const rows = await resultSet.json<Array<{
      deviceId: string;
      value: string;
      timestamp: number;
    }>>();

    return rows.map((r) => ({
      deviceId: r.deviceId,
      value: Number(r.value),
      timestamp: new Date(r.timestamp * 1000), // Convert Unix timestamp to Date
    }));
  }
}
