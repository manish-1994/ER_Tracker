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
    Prefer: "return=representation"
  };

  console.log("Seeding view_user_presence permission...");

  // 1. Insert permission
  const permRes = await fetch(`${baseUrl}/rest/v1/permissions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: 9,
      name: "view_user_presence",
      description: "Ability to view the user presence dashboard"
    })
  });

  console.log("Permission insert status:", permRes.status);
  const permText = await permRes.text();
  console.log("Permission insert result:", permText);

  // 2. Insert role associations
  console.log("Seeding role_permissions mappings...");
  const mappings = [
    { role_id: 1, permission_id: 9 }, // SuperAdmin
    { role_id: 2, permission_id: 9 }  // Admin
  ];

  const mapRes = await fetch(`${baseUrl}/rest/v1/role_permissions`, {
    method: "POST",
    headers,
    body: JSON.stringify(mappings)
  });

  console.log("Role permissions insert status:", mapRes.status);
  const mapText = await mapRes.text();
  console.log("Role permissions insert result:", mapText);
}

main().catch(console.error);
