import { clickhouse } from './clickhouse';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const migrationsPath = path.join(__dirname, 'clickhouse-migrations');
  const migrationFiles = fs.readdirSync(migrationsPath).sort();

  console.log('Running ClickHouse migrations...');

  for (const file of migrationFiles) {
    if (!file.endsWith('.sql')) continue;

    console.log(`Executing migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');

    try {
      await clickhouse.exec({ query: sql });
      console.log(`✓ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error);
      throw error;
    }
  }

  console.log('All ClickHouse migrations completed!');
  await clickhouse.close();
}

runMigrations().catch(console.error);
