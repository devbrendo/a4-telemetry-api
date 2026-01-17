import 'dotenv/config';
import { db } from './drizzle';
import { devices } from './schema';
import { randomUUID } from 'crypto';

async function main() {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  const deviceA1 = randomUUID();
  const deviceB1 = randomUUID();

  await db.insert(devices).values([
    { id: deviceA1, name: 'Device A1', tenantId: tenantA },
    { id: deviceB1, name: 'Device B1', tenantId: tenantB },
  ]);

  console.log('Seed OK');
  console.log({ tenantA, deviceA1, tenantB, deviceB1 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
