// app/lib/db.js
/*
import { Pool } from "pg";

/**
 * Prefer DATABASE_URL if you have it (Neon, Supabase, Render, etc.)
 * Otherwise fall back to individual PG* vars.

const configFromEnv = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl:
        // Many managed Postgres providers require SSL in prod.
        process.env.PGSSLMODE === "disable"
          ? false
          : { rejectUnauthorized: false },
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "appdb",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    ssl:
      process.env.PGSSLMODE === "disable"
        ? false
        : (process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false),
  };
};

/**
 * Reasonable Pool tuning for Next.js:
 * - keepAlive to lower cold handshake costs
 * - small max to avoid exhausting serverless limits
 
const baseConfig = {
  max: Number(process.env.PG_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE || 30_000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT || 10_000),
  keepAlive: true,
};

const poolConfig = { ...baseConfig, ...configFromEnv() };

/**
 * Next.js dev hot-reload can create multiple Pools.
 * Stash a singleton on globalThis.
 
const globalForPg = globalThis;
const pool =
  globalForPg.__PG_POOL__ || (globalForPg.__PG_POOL__ = new Pool(poolConfig));

export { pool };

/**
 * Small helpers
 
export const query = (text, params) => pool.query(text, params);

/**
 * Run a function inside a transaction:
 *   await withTransaction(async (client) => {
 *     await client.query("INSERT ...");
 *     const { rows } = await client.query("SELECT ...");
 *     return rows;
 *   });
export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch { /* ignore 
    throw err;
  } finally {
    client.release();
  }
};

// optional: graceful shutdown when Node process exits (not needed on Vercel)
process.on("SIGINT", async () => {
  try { await pool.end(); } finally { process.exit(0); }
});*/