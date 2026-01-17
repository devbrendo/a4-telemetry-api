import 'dotenv/config';
import t from 'tap';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';

import { buildApp } from '../src/app';
import { db } from '../src/infra/db/drizzle';
import { clickhouse } from '../src/infra/db/clickhouse';
import { devices } from '../src/infra/db/schema';

t.test('tenant isolation: cannot read or write telemetry from another tenant', async (t) => {
  // Clean ClickHouse sensor_readings table
  await clickhouse.command({
    query: 'TRUNCATE TABLE IF EXISTS sensor_readings',
  });

  // Clean PostgreSQL devices table
  await db.delete(devices).where(sql`true`);

  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  const deviceA = randomUUID();
  const deviceB = randomUUID();

  await db.insert(devices).values([
    { id: deviceA, name: 'Device A', tenantId: tenantA },
    { id: deviceB, name: 'Device B', tenantId: tenantB },
  ]);

  const app = buildApp();
  await app.ready();

  t.teardown(async () => {
    await app.close();
  });

  // tenant A consegue ingerir no device A
  const postOk = await app.inject({
    method: 'POST',
    url: '/telemetry',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenantA,
    },
    payload: { deviceId: deviceA, value: 25.5 },
  });

  t.equal(postOk.statusCode, 201);

  // tenant B NÃO pode ingerir no device A
  const postForbidden = await app.inject({
    method: 'POST',
    url: '/telemetry',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenantB,
    },
    payload: { deviceId: deviceA, value: 30.0 },
  });

  t.equal(postForbidden.statusCode, 404);

  // tenant B NÃO pode ler telemetria do device A
  const getForbidden = await app.inject({
    method: 'GET',
    url: `/telemetry/${deviceA}`,
    headers: { 'x-tenant-id': tenantB },
  });

  t.equal(getForbidden.statusCode, 404);

  // tenant A pode ler telemetria do device A
  const getOk = await app.inject({
    method: 'GET',
    url: `/telemetry/${deviceA}`,
    headers: { 'x-tenant-id': tenantA },
  });

  t.equal(getOk.statusCode, 200);

  const body = getOk.json();
  t.match(body, { deviceId: deviceA });
  t.ok(Array.isArray(body.readings));
  t.ok(body.readings.length >= 1);
});
