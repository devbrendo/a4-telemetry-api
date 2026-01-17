import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'a4',
  password: process.env.CLICKHOUSE_PASSWORD || 'a4pass',
  database: process.env.CLICKHOUSE_DB || 'a4_telemetry',
});
