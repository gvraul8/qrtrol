/**
 * Mock Supabase client for local development without real credentials.
 * Automatically used when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are absent.
 */

import {
  MOCK_ADMIN,
  MOCK_ALL_USERS,
  MOCK_ENTRIES,
  MOCK_COMPANY,
  MOCK_ACTIVE_WORKERS,
} from '@/lib/mock-data'

// ─── Mock auth shapes ─────────────────────────────────────────────────────────

const MOCK_AUTH_USER = {
  id: MOCK_ADMIN.id,
  email: MOCK_ADMIN.email ?? 'admin@mock.local',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: MOCK_ADMIN.created_at,
  app_metadata: { provider: 'email' },
  user_metadata: {},
  identities: [],
}

const MOCK_SESSION = {
  user: MOCK_AUTH_USER,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer' as const,
}

// ─── Table data registry ──────────────────────────────────────────────────────

function getTableData(table: string): unknown[] {
  switch (table) {
    case 'users':             return MOCK_ALL_USERS
    case 'time_entries':      return MOCK_ENTRIES
    case 'attendance_records':return MOCK_ENTRIES
    case 'companies':         return [MOCK_COMPANY]
    case 'active_workers':    return MOCK_ACTIVE_WORKERS
    default:                  return []
  }
}

// ─── Chainable query builder ──────────────────────────────────────────────────

class MockQueryBuilder {
  private _data: unknown[]
  private _filters: Array<(row: Record<string, unknown>) => boolean> = []
  private _limitN: number | undefined

  constructor(table: string) {
    this._data = getTableData(table)
  }

  private _resolve(): unknown[] {
    let result = this._data.filter((row) =>
      this._filters.every((f) => f(row as Record<string, unknown>))
    )
    if (this._limitN !== undefined) result = result.slice(0, this._limitN)
    return result
  }

  select(_cols?: string) { return this }
  eq(col: string, val: unknown)  { this._filters.push((r) => r[col] === val); return this }
  neq(col: string, val: unknown) { this._filters.push((r) => r[col] !== val); return this }
  gt(col: string, val: unknown)  { this._filters.push((r) => (r[col] as number) > (val as number)); return this }
  gte(col: string, val: unknown) { this._filters.push((r) => (r[col] as number) >= (val as number)); return this }
  lt(col: string, val: unknown)  { this._filters.push((r) => (r[col] as number) < (val as number)); return this }
  lte(col: string, val: unknown) { this._filters.push((r) => (r[col] as number) <= (val as number)); return this }
  like(_col: string, _val: unknown)  { return this }
  ilike(_col: string, _val: unknown) { return this }
  in(_col: string, _vals: unknown[]) { return this }
  is(_col: string, _val: unknown)    { return this }
  order(_col: string, _opts?: unknown) { return this }
  limit(n: number) { this._limitN = n; return this }
  range(_from: number, _to: number) { return this }

  single() {
    const data = this._resolve()
    return Promise.resolve({ data: data[0] ?? null, error: null })
  }

  maybeSingle() {
    const data = this._resolve()
    return Promise.resolve({ data: data[0] ?? null, error: null })
  }

  insert(_values: unknown) {
    const res = { data: null as unknown, error: null }
    const chain = {
      select: (_cols?: string) => ({
        single:      () => Promise.resolve(res),
        maybeSingle: () => Promise.resolve(res),
        then: (ok: (v: typeof res) => unknown, fail?: (r: unknown) => unknown) =>
          Promise.resolve(res).then(ok, fail),
      }),
      single:      () => Promise.resolve(res),
      maybeSingle: () => Promise.resolve(res),
      then: (ok: (v: typeof res) => unknown, fail?: (r: unknown) => unknown) =>
        Promise.resolve(res).then(ok, fail),
    }
    return chain
  }

  upsert(_values: unknown) {
    const res = { data: null as unknown, error: null }
    const chain = {
      select: (_cols?: string) => ({
        single:      () => Promise.resolve(res),
        maybeSingle: () => Promise.resolve(res),
        then: (ok: (v: typeof res) => unknown, fail?: (r: unknown) => unknown) =>
          Promise.resolve(res).then(ok, fail),
      }),
      single:      () => Promise.resolve(res),
      maybeSingle: () => Promise.resolve(res),
      then: (ok: (v: typeof res) => unknown, fail?: (r: unknown) => unknown) =>
        Promise.resolve(res).then(ok, fail),
    }
    return chain
  }

  update(_values: unknown) {
    return {
      eq:    (_col: string, _val: unknown) => Promise.resolve({ data: null, error: null }),
      match: (_query: unknown)             => Promise.resolve({ data: null, error: null }),
    }
  }

  delete() {
    return {
      eq: (_col: string, _val: unknown) => Promise.resolve({ data: null, error: null }),
    }
  }

  then(
    onFulfilled: (value: { data: unknown[]; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) {
    return Promise.resolve({ data: this._resolve(), error: null }).then(onFulfilled, onRejected)
  }
}

// ─── Mock realtime channel ────────────────────────────────────────────────────

const mockChannel = {
  on:        (_event: string, _filter: unknown, _cb?: unknown) => mockChannel,
  subscribe: (_cb?: unknown) => mockChannel,
}

// ─── Mock auth module ─────────────────────────────────────────────────────────

type AuthListener = (event: string, session: typeof MOCK_SESSION | null) => void
let _authListeners: AuthListener[] = []

const mockAuth = {
  getSession: () =>
    Promise.resolve({ data: { session: MOCK_SESSION }, error: null }),

  getUser: () =>
    Promise.resolve({ data: { user: MOCK_AUTH_USER }, error: null }),

  signOut: () =>
    Promise.resolve({ error: null }),

  signInWithPassword: (_credentials: unknown) =>
    Promise.resolve({ data: { user: MOCK_AUTH_USER, session: MOCK_SESSION }, error: null }),

  onAuthStateChange: (cb: AuthListener) => {
    // Emit SIGNED_IN asynchronously so hooks can initialise before the callback fires
    setTimeout(() => cb('SIGNED_IN', MOCK_SESSION), 0)
    _authListeners.push(cb)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            _authListeners = _authListeners.filter((l) => l !== cb)
          },
        },
      },
    }
  },
}

// ─── Exported mock client ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockSupabaseClient: any = {
  auth: mockAuth,
  from: (table: string) => new MockQueryBuilder(table),
  channel: (_name: string) => mockChannel,
  removeChannel: (_channel: unknown) => Promise.resolve(),
}
