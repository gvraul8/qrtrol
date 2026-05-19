import type { UserProfile } from '@/types/auth.types'
import type { TimeEntry } from '@/types/time-entry.types'

// ─── Company ────────────────────────────────────────────────────────────────

export const MOCK_COMPANY = {
  id: 'company-001',
  name: 'Acme Corp S.L.',
  logo_url: null as string | null,
  address: 'Calle Mayor 12, 28013 Madrid',
  qr_duration_seconds: 20,
  created_at: '2025-01-10T09:00:00.000Z',
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_ADMIN: UserProfile = {
  id: 'user-admin',
  company_id: 'company-001',
  role: 'admin',
  full_name: 'Carlos García',
  email: 'carlos@acmecorp.es',
  avatar_url: null,
  created_at: '2025-01-10T09:00:00.000Z',
}

export const MOCK_EMPLOYEES: UserProfile[] = [
  {
    id: 'user-001',
    company_id: 'company-001',
    role: 'employee',
    full_name: 'María López',
    email: 'maria@acmecorp.es',
    avatar_url: null,
    created_at: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'user-002',
    company_id: 'company-001',
    role: 'employee',
    full_name: 'Juan Martínez',
    email: 'juan@acmecorp.es',
    avatar_url: null,
    created_at: '2025-01-16T09:00:00.000Z',
  },
  {
    id: 'user-003',
    company_id: 'company-001',
    role: 'employee',
    full_name: 'Ana Rodríguez',
    email: 'ana@acmecorp.es',
    avatar_url: null,
    created_at: '2025-01-20T09:00:00.000Z',
  },
  {
    id: 'user-004',
    company_id: 'company-001',
    role: 'employee',
    full_name: 'Pedro Sánchez',
    email: 'pedro@acmecorp.es',
    avatar_url: null,
    created_at: '2025-02-01T09:00:00.000Z',
  },
]

export const MOCK_ALL_USERS: UserProfile[] = [MOCK_ADMIN, ...MOCK_EMPLOYEES]

// ─── Time entries (last 2 weeks) ─────────────────────────────────────────────

function ts(daysAgo: number, h: number, m = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const MOCK_ENTRIES: (TimeEntry & { users: { full_name: string; email: string; avatar_url: string | null } })[] = [
  // Today
  { id: 'e-t1', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(0, 8, 55), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-t2', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(0, 9,  2), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-t3', user_id: 'user-003', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(0, 9, 10), users: { full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null } },
  { id: 'e-t4', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(0, 14, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  // Yesterday
  { id: 'e-y1', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(1, 8, 58), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-y2', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(1, 9,  5), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-y3', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(1, 9, 15), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  { id: 'e-y4', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(1, 18, 5), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-y5', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(1, 18,15), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-y6', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(1, 17,50), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  // 2 days ago
  { id: 'e-2d1', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(2, 9, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-2d2', user_id: 'user-003', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(2, 9, 3), users: { full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null } },
  { id: 'e-2d3', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(2, 9, 7), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-2d4', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(2,18, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-2d5', user_id: 'user-003', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(2,17,45), users: { full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null } },
  { id: 'e-2d6', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(2,18,10), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  // 3 days ago
  { id: 'e-3d1', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(3, 8,50), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  { id: 'e-3d2', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(3, 9, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-3d3', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(3,17,55), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  { id: 'e-3d4', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(3,18, 5), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  // 4 days ago
  { id: 'e-4d1', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(4, 9, 2), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-4d2', user_id: 'user-003', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(4, 9, 8), users: { full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null } },
  { id: 'e-4d3', user_id: 'user-002', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(4,18, 0), users: { full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null } },
  { id: 'e-4d4', user_id: 'user-003', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(4,17,40), users: { full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null } },
  // 5 days ago
  { id: 'e-5d1', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(5, 8,55), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-5d2', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(5, 9, 0), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  { id: 'e-5d3', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(5,18, 5), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-5d4', user_id: 'user-004', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(5,18, 0), users: { full_name: 'Pedro Sánchez', email: 'pedro@acmecorp.es', avatar_url: null } },
  // 6 days ago — María hace dos turnos (mañana + tarde)
  { id: 'e-6d1', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(6, 8, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-6d2', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(6,13, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-6d3', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'entry', created_at: ts(6,15, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
  { id: 'e-6d4', user_id: 'user-001', company_id: 'company-001', qr_session_id: null, type: 'exit',  created_at: ts(6,18, 0), users: { full_name: 'María López',   email: 'maria@acmecorp.es', avatar_url: null } },
]

// ─── Active workers (currently clocked in) ───────────────────────────────────

export const MOCK_ACTIVE_WORKERS = [
  { id: 'user-002', company_id: 'company-001', full_name: 'Juan Martínez',  email: 'juan@acmecorp.es',  avatar_url: null, checked_in_at: ts(0, 9, 2) },
  { id: 'user-003', company_id: 'company-001', full_name: 'Ana Rodríguez',  email: 'ana@acmecorp.es',   avatar_url: null, checked_in_at: ts(0, 9,10) },
]

// ─── Weekly chart data (Mon–Sun) ─────────────────────────────────────────────

export const MOCK_WEEKLY_HOURS = [
  { day: 'Lun', hours: 32 },
  { day: 'Mar', hours: 36 },
  { day: 'Mié', hours: 28 },
  { day: 'Jue', hours: 38 },
  { day: 'Vie', hours: 24 },
  { day: 'Sáb', hours: 0 },
  { day: 'Dom', hours: 0 },
]

// ─── Employee-level mock (for María López as current employee) ───────────────

export const MOCK_CURRENT_EMPLOYEE: UserProfile = MOCK_ADMIN

export const MOCK_MY_ENTRIES = MOCK_ENTRIES
  .filter((e) => e.user_id === 'user-001')
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
