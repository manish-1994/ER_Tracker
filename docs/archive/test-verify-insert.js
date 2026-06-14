import { supabase } from "./frontend/src/services/supabaseClient.js";

// Helper to check if a user exists
async function checkUser(username) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, hashed_password, is_active')
    .eq('username', username)
    .single();
  if (error) {
    console.error('SELECT ERROR:', error);
    return null;
  }
  console.log('USER FOUND:', data);
  return data;
}

// Execute check for testuser1
checkUser('test').then(() => process.exit());
