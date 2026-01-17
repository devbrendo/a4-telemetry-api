import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

// PostgreSQL stores metadata (devices and tenant relationships)
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  tenantId: text('tenant_id').notNull(),
});

// Note: sensor_readings table is now in ClickHouse for time-series optimization