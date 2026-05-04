import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const index = line.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

const cwd = process.cwd();
const env = { ...process.env, ...loadEnv(path.join(cwd, ".env")) };

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: false,
});

await connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await connection.query(`USE \`${env.DB_NAME}\``);

const migrationsDir = path.join(cwd, "migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

for (const fileName of migrationFiles) {
  const sql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
  const statements = splitSqlStatements(sql);
  console.log(`Running ${fileName} (${statements.length} statements)`);
  for (const statement of statements) {
    await connection.query(statement);
  }
}

await connection.end();
console.log("Migrations completed");
