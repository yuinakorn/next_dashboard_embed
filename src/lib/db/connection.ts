import mysql from "mysql2/promise";

declare global {
  var portalDbPool: mysql.Pool | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool() {
  if (!globalThis.portalDbPool) {
    globalThis.portalDbPool = mysql.createPool({
      host: requireEnv("DB_HOST"),
      port: Number(process.env.DB_PORT || 3306),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      timezone: "Z",
    });
  }

  return globalThis.portalDbPool;
}
