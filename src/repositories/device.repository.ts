import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { devices } from '../infra/db/schema';

export type Device = {
  id: string;
  name: string;
  tenantId: string;
};

export class DeviceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findByIdAndTenant(deviceId: string, tenantId: string): Promise<Device | null> {
    const rows = await this.db
      .select()
      .from(devices)
      .where(and(eq(devices.id, deviceId), eq(devices.tenantId, tenantId)))
      .limit(1);

    const d = rows[0];
    if (!d) return null;

    return {
      id: d.id,
      name: d.name,
      tenantId: d.tenantId,
    };
  }
}
