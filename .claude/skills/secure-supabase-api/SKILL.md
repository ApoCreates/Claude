---
name: secure-supabase-api
description: Security standard for any Supabase-backed endpoint, table, edge function or client data access. Use whenever creating or modifying a table, RLS policy, edge function, API route, auth flow, or any code that reads or writes Supabase — and during every review pass on such code.
---
# Secure Supabase API

When you create or change anything that touches Supabase:
1. **RLS on, policy first.** Every table has `enable row level security` and at
   least one policy before any client reads it. Anon role gets nothing by default.
2. **Keys.** `anon` key only in client code. `service_role` only in edge
   functions or server code, read from env, never committed.
3. **Input validation.** Edge functions validate the body (zod or equivalent)
   and reject unknown fields with 400.
4. **Audit.** State-changing edge functions write `{actor, action, entity, ts}`
   to the `audit_log` table.
5. **PII.** Columns tagged `-- pii` in the migration never appear in logs,
   error messages or client console output.
6. **Auth.** No anonymous route outside `/health`. Use `auth.uid()` in
   policies, never trust a user id from the request body.

Report which of the six you checked and any you could not satisfy.
