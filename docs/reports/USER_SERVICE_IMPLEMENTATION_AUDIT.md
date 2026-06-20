# USER SERVICE IMPLEMENTATION AUDIT

## File examined
`frontend/src/services/userService.ts`

## Full implementation of `createUser`
```typescript
export const createUser = async (username: string, password: string, roleIds: number[] = []) => {
  console.log("CREATE USER START");
  console.log("USERNAME:", username);
  console.log("ROLE IDS:", roleIds);
  try {
    // NOTE: Supabase Auth admin APIs cannot be called from the browser (requires service role key).
    // For the frontend‑only architecture we only create a record in the `users` table.
    console.log("AUTH CREATE START"); // placeholder for potential auth creation step
    console.log("USERS TABLE INSERT START");
    const { data: userResult, error: userError } = await supabase.from('users').insert({
      username,
      is_active: true,
    }).single();
    console.log("USER INSERT RESULT:", userResult);
    console.log("USER INSERT ERROR:", userError);
    if (userError) throw userError;

    console.log("ROLE ASSIGNMENT START");
    for (const roleId of roleIds) {
      const { data: roleResult, error: roleError } = await supabase.from('user_roles').insert({ user_id: userResult.id, role_id: roleId });
      console.log("ROLE ASSIGN RESULT:", roleResult);
      console.log("ROLE ASSIGN ERROR:", roleError);
      if (roleError) throw roleError;
    }

    // No Supabase Auth user creation in frontend mode – indicate that.
    console.warn("Application user created. Login account not yet provisioned (frontend‑only mode).");
    return userResult as any;
  } catch (error) {
    console.error("CREATE USER EXCEPTION:", error);
    throw error;
  }
};
```

## Supabase insert payload
The only `insert` call that writes to the **public.users** table is:
```typescript
await supabase.from('users').insert({
  username,
  is_active: true,
}).single();
```
*Target table*: `users` (public schema).
*Columns written*: `username` (string) and `is_active` (boolean, set to `true`).
*Missing column*: `hashed_password` – the table definition expects a non‑null value, causing the insert to fail.

## Role assignment flow
If `roleIds` are provided, the function iterates over each ID and performs:
```typescript
await supabase.from('user_roles').insert({ user_id: userResult.id, role_id: roleId });
```
*Target table*: `user_roles`.
*Columns written*: `user_id` (the newly created user's `id`) and `role_id` (the supplied role identifier).

## Is this still using the legacy custom‑auth schema?
Yes. The implementation writes directly to the **public.users** table and expects the table to contain a `hashed_password` column (as indicated by the migration issue). It does **not** call any Supabase Auth admin endpoint to create an auth user, and thus relies on the legacy custom‑auth database schema.

---
*Generated on $(date)*