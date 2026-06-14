import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const envPath = join(ROOT, ".env");
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const baseUrl = env.VITE_SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY;

  const list = [
    'exec_sql', 'run_sql', 'execute_sql', 'query', 'sql', 'execute', 'run', 'exec',
    'query_sql', 'raw_sql', 'db_query', 'database_query', 'run_command'
  ];

  for (const name of list) {
    const url = `${baseUrl}/rest/v1/rpc/${name}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1 as val;', sql: 'SELECT 1 as val;', sql_query: 'SELECT 1 as val;' })
      });
      if (res.status !== 404) {
        const text = await res.text();
        console.log(`RPC ${name}: status = ${res.status}, body = ${text}`);
      }
    } catch (err) {
      console.log(`RPC ${name} error:`, err.message);
    }
  }
}

main().catch(console.error);
