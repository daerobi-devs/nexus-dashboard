import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool, Client } = pg;

function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore
  }
}

function parsePgHostAndDb(dbUrl = '') {
  try {
    const u = new URL(dbUrl);
    return {
      host: `${u.hostname}:${u.port || '5432'}`,
      database: u.pathname.replace(/^\//, '') || 'buatin_nexus_db',
    };
  } catch {
    return { host: 'localhost:5432', database: 'buatin_nexus_db' };
  }
}

loadEnvFile();
const initialPgMeta = parsePgHostAndDb(process.env.DATABASE_URL || '');

let pgPool = null;
let pgStatus = {
  connected: false,
  host: initialPgMeta.host,
  database: initialPgMeta.database,
  cloudbeaverUrl: process.env.CLOUDBEAVER_URL || '',
  lastSyncAt: '',
  tablesSynced: 0,
  totalRowsSynced: 0,
  error: null,
};

export function getPostgresStatus() {
  return pgStatus;
}

const ALL_TABLES = [
  'wallets',
  'transactions',
  'tasks',
  'task_subtasks',
  'maintenance_items',
  'maintenance_logs',
  'invoices',
  'google_workspace_cache',
  'ai_messages',
  'activity_logs',
  'crm_clients',
  'crm_deals',
  'academic_courses',
  'personal_habits',
  'personal_goals',
  'coolify_resources',
  'generated_documents',
  'focus_sessions',
  'cycling_logs',
  'joki_orders',
  'hosting_domains',
  'project_vault',
  'settings',
  'mentari_sync_cache',
  'unpam_billing_cache',
  'storage_assets',
];

function mapSqliteTypeToPg(sqliteType = 'TEXT') {
  const upper = String(sqliteType).toUpperCase();
  if (upper.includes('INT')) return 'BIGINT';
  if (upper.includes('REAL') || upper.includes('DOUBLE') || upper.includes('FLOAT')) {
    return 'DOUBLE PRECISION';
  }
  return 'TEXT';
}

async function ensurePgTablesMatchSqlite(client, sqliteDb) {
  for (const table of ALL_TABLES) {
    const columns = sqliteDb.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns || columns.length === 0) continue;

    const colDefs = columns.map((col) => {
      const pgType = mapSqliteTypeToPg(col.type);
      const pk = col.pk ? ' PRIMARY KEY' : '';
      return `"${col.name}" ${pgType}${pk}`;
    });

    await client.query(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs.join(', ')})`);

    // Ensure any newly added columns also exist
    for (const col of columns) {
      const pgType = mapSqliteTypeToPg(col.type);
      await client
        .query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col.name}" ${pgType}`)
        .catch(() => {});
    }
  }
}

export async function ensurePostgresDatabaseAndSync(sqliteDb, options = {}) {
  loadEnvFile();
  const dbUrl = process.env.DATABASE_URL;
  const adminUrl = process.env.PG_ADMIN_URL || (dbUrl ? dbUrl.replace(/\/[^/]+$/, '/postgres') : '');
  const meta = parsePgHostAndDb(dbUrl);
  pgStatus.host = meta.host;
  pgStatus.database = meta.database;
  pgStatus.cloudbeaverUrl = process.env.CLOUDBEAVER_URL || '';

  if (!dbUrl) {
    pgStatus.error = 'DATABASE_URL belum diset di environment (.env)';
    return pgStatus;
  }

  try {
    // 1. Best-effort check to ensure target database exists if admin credentials allow
    if (adminUrl) {
      try {
        const adminClient = new Client({
          connectionString: adminUrl,
          connectionTimeoutMillis: 4500,
        });
        await adminClient.connect();
        const checkRes = await adminClient.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [meta.database]
        );
        if (checkRes.rowCount === 0) {
          const safeDbName = meta.database.replace(/[^a-zA-Z0-9_]/g, '');
          if (safeDbName) {
            await adminClient.query(`CREATE DATABASE "${safeDbName}"`);
          }
        }
        await adminClient.end();
      } catch {
        // Proceed directly to DATABASE_URL even if admin DB is restricted
      }
    }

    // 2. Connect to target PostgreSQL database
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: dbUrl,
        max: 5,
        connectionTimeoutMillis: 6000,
      });
    }

    const client = await pgPool.connect();
    try {
      await ensurePgTablesMatchSqlite(client, sqliteDb);
    } finally {
      client.release();
    }

    // 3. Check if PostgreSQL already holds production data
    const clientCheck = await pgPool.connect();
    let pgWalletCount = 0;
    try {
      const r = await clientCheck.query('SELECT COUNT(*)::int AS cnt FROM wallets');
      pgWalletCount = r.rows[0]?.cnt || 0;
    } catch {
      pgWalletCount = 0;
    } finally {
      clientCheck.release();
    }

    if (pgWalletCount === 0) {
      // Initial migration: push starter SQLite data into empty PostgreSQL database
      await syncAllTablesToPostgres(sqliteDb);
    } else if (options.preferPullIfFresh) {
      // Fresh container boot: hydrate local cache from live PostgreSQL without overwriting DB
      await pullFromPostgresToSqlite(sqliteDb, { clearAllTablesFirst: true });
    } else {
      // Sync local changes to Postgres
      await syncAllTablesToPostgres(sqliteDb);
    }
    return pgStatus;
  } catch (err) {
    pgStatus.connected = false;
    pgStatus.error = err.message;
    return pgStatus;
  }
}

export async function pullFromPostgresToSqlite(sqliteDb, options = {}) {
  loadEnvFile();
  if (!pgPool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return pgStatus;
    pgPool = new Pool({
      connectionString: dbUrl,
      max: 5,
      connectionTimeoutMillis: 6000,
    });
  }

  const meta = parsePgHostAndDb(process.env.DATABASE_URL || '');
  const client = await pgPool.connect();
  let totalRows = 0;

  try {
    sqliteDb.exec('PRAGMA foreign_keys = OFF;');
    sqliteDb.exec('BEGIN');
    for (const table of ALL_TABLES) {
      const sqliteColsInfo = sqliteDb.prepare(`PRAGMA table_info(${table})`).all();
      const sqliteColSet = new Set(sqliteColsInfo.map((c) => c.name));
      const res = await client.query(`SELECT * FROM "${table}"`);
      if (options.clearAllTablesFirst || (res.rows && res.rows.length > 0)) {
        sqliteDb.prepare(`DELETE FROM ${table}`).run();
      }
      if (!res.rows || res.rows.length === 0) continue;

      const cols = Object.keys(res.rows[0]).filter((c) => sqliteColSet.has(c));
      if (cols.length === 0) continue;

      const colNames = cols.join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      const stmt = sqliteDb.prepare(
        `INSERT INTO ${table} (${colNames}) VALUES (${placeholders})`
      );
      for (const r of res.rows) {
        const vals = cols.map((c) => {
          const v = r[c];
          if (typeof v === 'bigint') return Number(v);
          if (
            typeof v === 'string' &&
            /^-?\d+$/.test(v) &&
            (c.includes('amount') ||
              c.includes('balance') ||
              c.includes('price') ||
              c.includes('paid') ||
              c.includes('value') ||
              c.includes('ltv') ||
              c.includes('cost') ||
              c.includes('fee'))
          ) {
            return Number(v);
          }
          return v;
        });
        stmt.run(...vals);
        totalRows++;
      }
    }
    sqliteDb.exec('COMMIT');
    pgStatus = {
      connected: true,
      host: meta.host,
      database: meta.database,
      cloudbeaverUrl: process.env.CLOUDBEAVER_URL || '',
      lastSyncAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tablesSynced: ALL_TABLES.length,
      totalRowsSynced: totalRows,
      error: null,
    };
  } catch (err) {
    try {
      sqliteDb.exec('ROLLBACK');
    } catch {
      // ignore
    }
    pgStatus.connected = false;
    pgStatus.error = err.message;
  } finally {
    try {
      sqliteDb.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // ignore
    }
    client.release();
  }
  return pgStatus;
}

export async function syncAllTablesToPostgres(sqliteDb) {
  loadEnvFile();
  if (!pgPool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return pgStatus;
    pgPool = new Pool({
      connectionString: dbUrl,
      max: 5,
      connectionTimeoutMillis: 6000,
    });
  }

  const meta = parsePgHostAndDb(process.env.DATABASE_URL || '');
  const client = await pgPool.connect();
  let totalRows = 0;

  try {
    await ensurePgTablesMatchSqlite(client, sqliteDb);
    await client.query('BEGIN');
    for (const table of ALL_TABLES) {
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      await client.query(`DELETE FROM "${table}"`);
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colNames = cols.map((c) => `"${c}"`).join(', ');

      for (const row of rows) {
        const vals = cols.map((c) => row[c]);
        const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        await client.query(
          `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`,
          vals
        );
        totalRows++;
      }
    }
    await client.query('COMMIT');

    pgStatus = {
      connected: true,
      host: meta.host,
      database: meta.database,
      cloudbeaverUrl: process.env.CLOUDBEAVER_URL || '',
      lastSyncAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tablesSynced: ALL_TABLES.length,
      totalRowsSynced: totalRows,
      error: null,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    pgStatus.connected = false;
    pgStatus.error = err.message;
  } finally {
    client.release();
  }
  return pgStatus;
}
