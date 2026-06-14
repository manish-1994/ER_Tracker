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

  // 1. Check if user_presence table exists
  console.log("Checking if user_presence exists...");
  const resPres = await fetch(`${baseUrl}/rest/v1/user_presence?select=*&limit=1`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
  });
  console.log("user_presence existence check status:", resPres.status);
  if (resPres.ok) {
    const data = await resPres.json();
    console.log("user_presence exists, data sample:", data);
  } else {
    console.log("user_presence does not exist or error:", await resPres.text());
  }

  // 2. Test inserting a permission
  console.log("\nTesting inserting a dummy permission...");
  const resInsert = await fetch(`${baseUrl}/rest/v1/permissions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: 999,
      name: "test_permission_dummy",
      description: "Dummy permission for testing write access"
    })
  });
  console.log("Insert permission status:", resInsert.status);
  console.log("Insert response:", await resInsert.text());

  // Clean up if inserted successfully
  if (resInsert.status === 201 || resInsert.status === 200) {
    console.log("Cleaning up dummy permission...");
    const resDel = await fetch(`${baseUrl}/rest/v1/permissions?id=eq.999`, {
      method: "DELETE",
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    });
    console.log("Delete status:", resDel.status);
  }
}

main().catch(console.error);
