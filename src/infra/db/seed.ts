import 'dotenv/config';
import { db } from './drizzle';
import { clickhouse } from './clickhouse';
import { devices } from './schema';
import { randomUUID } from 'crypto';

async function main() {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  const deviceA1 = randomUUID();
  const deviceB1 = randomUUID();

  // Seed PostgreSQL devices
  console.log('Seeding PostgreSQL devices...');
  await db.insert(devices).values([
    { id: deviceA1, name: 'Device A1', tenantId: tenantA },
    { id: deviceB1, name: 'Device B1', tenantId: tenantB },
  ]);

  // Seed ClickHouse telemetry data
  console.log('Seeding ClickHouse telemetry data...');
  const now = Date.now();
  const telemetryData = [];

  // Generate sample telemetry for Device A1
  for (let i = 0; i < 15; i++) {
    telemetryData.push({
      id: randomUUID(),
      device_id: deviceA1,
      value: (20 + Math.random() * 10).toFixed(2), // Temperature between 20-30
      timestamp: Math.floor((now - i * 60000) / 1000), // Unix timestamp in seconds
    });
  }

  // Generate sample telemetry for Device B1
  for (let i = 0; i < 15; i++) {
    telemetryData.push({
      id: randomUUID(),
      device_id: deviceB1,
      value: (18 + Math.random() * 8).toFixed(2), // Temperature between 18-26
      timestamp: Math.floor((now - i * 60000) / 1000), // Unix timestamp in seconds
    });
  }

  await clickhouse.insert({
    table: 'sensor_readings',
    values: telemetryData,
    format: 'JSONEachRow',
  });

  console.log('Seed completed successfully!');
  console.log({ tenantA, deviceA1, tenantB, deviceB1 });
  console.log(`Inserted ${telemetryData.length} telemetry readings`);

  await clickhouse.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
