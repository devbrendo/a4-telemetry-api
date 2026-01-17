import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  tenantId: text('tenant_id').notNull(),
});

export const sensorReadings = pgTable('sensor_readings', {
  id: uuid('id').primaryKey(),
  deviceId: uuid('device_id').notNull(),
  value: integer('value').notNull(), // temperatura (se quiser decimal depois, a gente troca)
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
});
