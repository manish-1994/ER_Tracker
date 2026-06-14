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

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const fetchTable = async (table) => {
    const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*`, { headers });
    if (!res.ok) {
      console.error(`Error fetching ${table}:`, res.statusText);
      return [];
    }
    return res.json();
  };

  const permissions = await fetchTable("permissions");
  console.log("=== PERMISSIONS ===");
  console.log(permissions);

  const roles = await fetchTable("roles");
  console.log("=== ROLES ===");
  console.log(roles);

  const rolePermissions = await fetchTable("role_permissions");
  console.log("=== ROLE PERMISSIONS ===");
  console.log(rolePermissions);
}

main().catch(console.error);
