-- ============================================================
-- QRtrol — Seed Data (development only)
-- ============================================================

-- 1. Create a demo organization
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Empresa Demo', 'empresa-demo')
on conflict (id) do nothing;

-- NOTE: Users must be created via Supabase Auth (Dashboard → Authentication → Users)
-- then their profile rows are auto-inserted by the handle_new_user trigger.
--
-- When creating users in the dashboard, set these user_metadata fields:
--   admin:    { "organization_id": "00000000-0000-0000-0000-000000000001", "role": "admin",    "full_name": "Admin Demo" }
--   employee: { "organization_id": "00000000-0000-0000-0000-000000000001", "role": "employee", "full_name": "Empleado Demo" }
