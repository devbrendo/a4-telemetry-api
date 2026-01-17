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
          // DateTime64(3): "YYYY-MM-DD HH:MM:SS.mmm"
          timestamp: params.timestamp.toISOString().replace('T', ' ').replace('Z', ''),
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
      query_params: { deviceId, limit },
      format: 'JSONEachRow',
    });

    // Passe o tipo da ROW. A lib já retorna um array de rows.
    const rows = await resultSet.json<{
      deviceId: string;
      value: string;
      timestamp: string;
    }>();

    return rows.map((r) => ({
      deviceId: r.deviceId,
      value: Number(r.value),
      // Converte "YYYY-MM-DD HH:MM:SS.mmm" -> ISO UTC consistente
      timestamp: new Date(r.timestamp.replace(' ', 'T') + 'Z'),
    }));
  }
}
