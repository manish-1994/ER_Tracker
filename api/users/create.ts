/**
 * Vercel Serverless Function: POST /api/users/create
 *
 * Accepts JSON payload:
 *   { username: string, password: string, role_ids?: number[] }
 *
 * Performs:
 *   1. Validate username (non‑empty, unique).
 *   2. Hash password using Argon2.
 *   3. Insert into Supabase `public.users` table.
 *   4. Insert any role assignments into `public.user_roles`.
 *   5. Returns the created user record (without the hashed password).
 *
 * Errors are returned as JSON with a `detail` field so the frontend can
 * safely call `response.json()` after checking `response.ok`.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'argon2';

// Supabase credentials – set as environment variables in Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ detail: 'Method Not Allowed' });
    return;
  }

  const { username, password, role_ids = [] } = req.body as {
    username?: string;
    password?: string;
    role_ids?: number[];
  };

  // Validate payload
  if (!username || typeof username !== 'string') {
    res.status(400).json({ detail: 'Invalid or missing username' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ detail: 'Invalid or missing password' });
    return;
  }

  // Username uniqueness check
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  if (existErr && existErr.code !== 'PGRST116') {
    // Unexpected database error
    res.status(500).json({ detail: existErr.message });
    return;
  }
  if (existing) {
    res.status(400).json({ detail: 'Username already exists' });
    return;
  }

  // Hash password using Argon2
  let hashedPassword: string;
  try {
    hashedPassword = await hash(password);
  } catch (e) {
    res.status(500).json({ detail: 'Password hashing failed' });
    return;
  }

  // Insert user record
  const { data: user, error: insertErr } = await supabase
    .from('users')
    .insert({ username, hashed_password: hashedPassword, is_active: true })
    .single();
  if (insertErr) {
    res.status(500).json({ detail: insertErr.message });
    return;
  }

  // Assign roles if any
  for (const roleId of role_ids) {
    const { error: roleErr } = await supabase
      .from('user_roles')
      .insert({ user_id: (user as any).id, role_id: roleId });
    if (roleErr) {
      res.status(500).json({ detail: roleErr.message });
      return;
    }
  }

  // Strip hashed password before returning
  const { hashed_password, ...publicUser } = user as any;
  res.status(201).json(publicUser);
}
