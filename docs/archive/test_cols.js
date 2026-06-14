const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://exlrzeqixfghvcnwgdzy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHJ6ZXFpeGZnaHZjbndnZHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDk2MjUsImV4cCI6MjA5NjUyNTYyNX0.o6ziJttXwB2LESZc1nweHgJorR-aQ5wZhmcKs75Royk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: users, error: usersErr } = await supabase.from("users").select("*");
  console.log("USERS:", users);
  
  const { data: roles, error: rolesErr } = await supabase.from("roles").select("*");
  console.log("ROLES:", roles);
  
  const { data: userRoles, error: urErr } = await supabase.from("user_roles").select("*");
  console.log("USER_ROLES:", userRoles);
}

main();
