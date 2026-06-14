/**
 * Bootstrap default SuperAdmin user for ER Tracker Dashboard.
 * Architecture: public.users + public.roles + public.user_roles + bcryptjs
 *
 * Usage: node scripts/setup-superadmin.mjs
 */
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const USERNAME = "superadmin";
const PASSWORD = "SuperAdmin@123";
const ROLE_NAME = "SuperAdmin";

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

function createRestClient(baseUrl, apiKey) {
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg = data?.message || data?.error || data?.hint || res.statusText;
      throw new Error(`${res.status} ${path}: ${msg}`);
    }
    return data;
  }

  return {
    selectOne: (table, filter) =>
      request(`${table}?${filter}&limit=1`, {
        headers: { Accept: "application/vnd.pgrst.object+json" },
      }),
    selectMany: (table, filter) => request(`${table}?${filter}`),
    insert: (table, body) =>
      request(table, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(body),
      }),
  };
}

async function main() {
  const env = loadEnv();
  const baseUrl = env.VITE_SUPABASE_URL;
  const apiKey = env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend/.env");
  }

  const db = createRestClient(baseUrl, apiKey);
  const result = {
    username: USERNAME,
    userCreated: false,
    userAlreadyExisted: false,
    userId: null,
    roleId: null,
    roleName: ROLE_NAME,
    roleAssignmentCreated: false,
    roleAssignmentAlreadyExisted: false,
    roleAssignmentError: null,
    verification: null,
    errors: [],
  };

  let existingUser = null;
  try {
    existingUser = await db.selectOne("users", `username=eq.${USERNAME}&select=id,username,is_active`);
  } catch {
    existingUser = null;
  }

  let userId = existingUser?.id ?? null;

  if (existingUser) {
    result.userAlreadyExisted = true;
    result.userId = userId;
    console.log(`User '${USERNAME}' already exists (id=${userId})`);
  } else {
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const inserted = await db.insert("users", {
      username: USERNAME,
      hashed_password: hashedPassword,
      is_active: true,
    });
    const newUser = Array.isArray(inserted) ? inserted[0] : inserted;
    userId = newUser.id;
    result.userCreated = true;
    result.userId = userId;
    console.log(`Created user '${USERNAME}' (id=${userId})`);
  }

  const roleRow = await db.selectOne("roles", `name=eq.${ROLE_NAME}&select=id,name`);
  if (!roleRow) {
    throw new Error(`Role '${ROLE_NAME}' not found in public.roles`);
  }

  result.roleId = roleRow.id;
  console.log(`Found role '${ROLE_NAME}' (id=${roleRow.id})`);

  const mappings = await db.selectMany(
    "user_roles",
    `user_id=eq.${userId}&role_id=eq.${roleRow.id}&select=user_id,role_id`
  );

  if (Array.isArray(mappings) && mappings.length > 0) {
    result.roleAssignmentAlreadyExisted = true;
    console.log(`Role mapping already exists: ${USERNAME} -> ${ROLE_NAME}`);
  } else {
    try {
      await db.insert("user_roles", { user_id: userId, role_id: roleRow.id });
      result.roleAssignmentCreated = true;
      console.log(`Assigned role: ${USERNAME} -> ${ROLE_NAME}`);
    } catch (err) {
      result.roleAssignmentError = err.message;
      throw err;
    }
  }

  const verifyUser = await db.selectOne("users", `username=eq.${USERNAME}&select=id,username`);
  const verifyMappings = await db.selectMany(
    "user_roles",
    `user_id=eq.${verifyUser.id}&select=role_id`
  );
  const roleIds = (verifyMappings ?? []).map((m) => m.role_id);
  let roleNames = [];

  if (roleIds.length > 0) {
    const roleFilter = roleIds.map((id) => `id.eq.${id}`).join(",");
    const rolesData = await db.selectMany("roles", `or=(${roleFilter})&select=name`);
    roleNames = (rolesData ?? []).map((r) => r.name);
  }

  result.verification = {
    id: verifyUser.id,
    username: verifyUser.username,
    role: roleNames[0] ?? null,
    roles: roleNames,
    expected: `${USERNAME} -> ${ROLE_NAME}`,
    passed: roleNames.includes(ROLE_NAME),
  };

  console.log("\n--- Verification ---");
  console.log(JSON.stringify(result.verification, null, 2));

  const outPath = join(ROOT, "scripts", "setup-superadmin-result.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nResult written to ${outPath}`);

  if (!result.verification.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err.message ?? err);
  process.exit(1);
});
