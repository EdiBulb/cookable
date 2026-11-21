import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { IS_DEMO } from './demo'
import { track } from './analytics'

/**
 * 구글 로그인 + 자동 백업.
 * 앱은 지금처럼 localStorage로 동작하고(오프라인 OK), 로그인하면 그 내용을 통째로 서버 한 줄에 올린다.
 * 다른 기기에서 로그인하면 서버 내용을 받아온다. 충돌은 "마지막에 저장한 쪽"이 기본, 처음 만날 때만 사용자에게 묻는다.
 */

/** 백업하는 localStorage 키 (체험 모드 키는 제외) */
export const SYNC_KEYS = [
  'cookable:kitchen:v1',
  'cookable:custom:v1',
  'cookable:history:v1',
  'cookable:wish:v1',
  'cookable:diet:v1',
  'cookable:buyfreq:v1',
] as const

const MARK_USER = 'cookable:sync:user' // 이 기기가 마지막으로 맞춘 계정
const MARK_AT = 'cookable:sync:at' // 이 기기가 마지막으로 서버와 맞춘 시각(ms)

export type Snapshot = Record<string, string | null>

export interface BackupData {
  v: 1
  keys: Snapshot
}

export function takeSnapshot(storage: Pick<Storage, 'getItem'> = localStorage): Snapshot {
  const snap: Snapshot = {}
  for (const k of SYNC_KEYS) snap[k] = storage.getItem(k)
  return snap
}

export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return SYNC_KEYS.every((k) => (a[k] ?? null) === (b[k] ?? null))
}

/** 지킬 만한 데이터가 있는지: 냉장고·장바구니 재료, 나만의 레시피, 기록, 해볼 요리 중 하나라도 */
export function hasMeaningfulData(snap: Snapshot): boolean {
  const parse = (k: string): unknown => {
    try {
      return snap[k] ? JSON.parse(snap[k] as string) : null
    } catch {
      return null
    }
  }
  const kitchen = parse('cookable:kitchen:v1') as { fridge?: unknown[]; cart?: unknown[] } | null
  if (kitchen && ((kitchen.fridge?.length ?? 0) > 0 || (kitchen.cart?.length ?? 0) > 0)) return true
  const custom = parse('cookable:custom:v1')
  if (custom && typeof custom === 'object' && Object.keys(custom).length > 0) return true
  for (const k of ['cookable:history:v1', 'cookable:wish:v1']) {
    const list = parse(k)
    if (Array.isArray(list) && list.length > 0) return true
  }
  return false
}

export type SyncDecision = 'push' | 'pull' | 'same' | 'ask'

/**
 * 로그인 직후 서버 데이터와 이 기기 데이터 중 무엇을 쓸지.
 * - 서버에 없음 → 올림 / 같음 → 그대로
 * - 이 기기에 지킬 데이터가 없음 → 받아옴
 * - 이 기기가 이 계정과 맞춘 적 있음 → 더 최근 쪽 (서버가 그 뒤에 바뀌었으면 받아오고, 아니면 올림)
 * - 처음 만난 두 데이터가 다 있음 → 사용자에게 묻기
 */
export function decide(local: Snapshot, remote: { keys: Snapshot; updatedAt: number } | null, mark: { user: string | null; at: number }, userId: string): SyncDecision {
  if (!remote) return 'push'
  if (sameSnapshot(local, remote.keys)) return 'same'
  if (!hasMeaningfulData(local)) return 'pull'
  if (!hasMeaningfulData(remote.keys)) return 'push'
  if (mark.user === userId) return remote.updatedAt > mark.at ? 'pull' : 'push'
  return 'ask'
}

// ---------- 상태 ----------

export type SyncStatus = 'off' | 'signed-out' | 'loading' | 'synced' | 'saving' | 'conflict' | 'error'

export interface SyncState {
  status: SyncStatus
  email?: string
  name?: string
  lastSavedAt?: number
  /** 충돌일 때 서버 쪽 정보 */
  remoteAt?: number
  error?: string
}

let state: SyncState = { status: IS_DEMO ? 'off' : 'loading' }
const listeners = new Set<() => void>()
const set = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useSync(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

/** 로그인 라이브러리(약 200KB)는 첫 화면을 그린 뒤에 따로 불러온다 */
const client = () => import('./supabase')

let session: Session | null = null
let lastPushed: Snapshot | null = null
let remoteCache: { keys: Snapshot; updatedAt: number } | null = null
let pushing = false

function readMark() {
  return { user: localStorage.getItem(MARK_USER), at: Number(localStorage.getItem(MARK_AT) ?? 0) }
}
function writeMark(userId: string, at: number) {
  localStorage.setItem(MARK_USER, userId)
  localStorage.setItem(MARK_AT, String(at))
}

async function fetchRemote(userId: string) {
  const { supabase, BACKUP_TABLE } = await client()
  const { data, error } = await supabase.from(BACKUP_TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  const d = data.data as BackupData
  return { keys: d?.keys ?? {}, updatedAt: Date.parse(data.updated_at as string) }
}

export async function pushNow(): Promise<void> {
  if (!session || pushing) return
  const snap = takeSnapshot()
  pushing = true
  set({ status: 'saving' })
  const at = Date.now()
  const { supabase, BACKUP_TABLE } = await client()
  const { error } = await supabase
    .from(BACKUP_TABLE)
    .upsert({ user_id: session.user.id, data: { v: 1, keys: snap } satisfies BackupData, updated_at: new Date(at).toISOString() })
  pushing = false
  if (error) {
    set({ status: 'error', error: error.message })
    return
  }
  lastPushed = snap
  writeMark(session.user.id, at)
  set({ status: 'synced', lastSavedAt: at, error: undefined })
}

/** 서버 내용을 이 기기에 덮어쓰고 새로고침 (각 저장소가 시작할 때 읽으므로) */
function applyRemote(remote: { keys: Snapshot; updatedAt: number }, userId: string) {
  for (const k of SYNC_KEYS) {
    const v = remote.keys[k]
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  }
  writeMark(userId, remote.updatedAt)
  location.reload()
}

async function reconcile() {
  if (!session) return
  set({ status: 'loading', email: session.user.email ?? undefined, name: session.user.user_metadata?.full_name as string | undefined })
  try {
    const remote = await fetchRemote(session.user.id)
    remoteCache = remote
    const decision = decide(takeSnapshot(), remote, readMark(), session.user.id)
    track('sync_reconcile', { decision })
    if (decision === 'pull' && remote) return applyRemote(remote, session.user.id)
    if (decision === 'push') return pushNow()
    if (decision === 'same') {
      lastPushed = takeSnapshot()
      writeMark(session.user.id, remote?.updatedAt ?? Date.now())
      return set({ status: 'synced', lastSavedAt: remote?.updatedAt })
    }
    set({ status: 'conflict', remoteAt: remote?.updatedAt })
  } catch (e) {
    set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
  }
}

/** 충돌 해결: 서버에 저장된 걸 쓸지, 이 기기 걸로 덮어쓸지 */
export async function resolveConflict(use: 'remote' | 'local') {
  if (!session) return
  track('sync_conflict', { use })
  if (use === 'remote' && remoteCache) return applyRemote(remoteCache, session.user.id)
  await pushNow()
}

export async function signInWithGoogle() {
  track('login_click', { provider: 'google' })
  const redirectTo = `${location.origin}${location.pathname}`
  const { supabase } = await client()
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error) set({ status: 'error', error: error.message })
}

export async function signOut() {
  track('logout')
  const { supabase } = await client()
  await supabase.auth.signOut()
  localStorage.removeItem(MARK_USER)
  localStorage.removeItem(MARK_AT)
  session = null
  lastPushed = null
  set({ status: 'signed-out', email: undefined, name: undefined, lastSavedAt: undefined })
}

let started = false

/** 앱 시작 때 한 번: 로그인 상태 확인, 바뀐 내용 자동 업로드 */
export function startSync() {
  if (started || IS_DEMO) return
  started = true
  void client().then(({ supabase }) => listen(supabase))

  // 5초마다 바뀐 게 있으면 올리기 + 화면을 떠날 때도
  const tick = () => {
    if (!session || state.status === 'conflict' || state.status === 'loading') return
    const snap = takeSnapshot()
    if (!lastPushed || !sameSnapshot(snap, lastPushed)) void pushNow()
  }
  window.setInterval(tick, 5000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') tick()
  })
}

function listen(supabase: Awaited<ReturnType<typeof client>>['supabase']) {
  supabase.auth.onAuthStateChange((event, s) => {
    const prev = session?.user.id
    session = s
    if (!s) {
      if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') set({ status: 'signed-out' })
      return
    }
    if (event === 'SIGNED_IN') track('login_success', { provider: s.user.app_metadata?.provider })
    if (prev !== s.user.id) {
      // 로그인 직후 주소창의 ?code= 정리 (HashRouter 경로는 유지)
      if (location.search.includes('code=')) history.replaceState(null, '', `${location.pathname}${location.hash}`)
      // onAuthStateChange 안에서 바로 supabase를 부르면 막힐 수 있어 한 박자 뒤에
      setTimeout(() => void reconcile(), 0)
    }
  })
}
