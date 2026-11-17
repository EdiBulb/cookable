import { useSyncExternalStore } from 'react'
import type { CookLog, Recipe } from '../types'
import { DEMO_FRESH, IS_DEMO } from '../lib/demo'

/** 해먹은 요리 기록 ("요리 끝!"을 저장할 때마다 한 줄) */
const KEY = IS_DEMO ? 'cookable:history:demo' : 'cookable:history:v1'
const listeners = new Set<() => void>()
const DAY = 864e5

function demoLogs(now = Date.now()): CookLog[] {
  const rows: [string, string, number][] = [
    ['my-tuna-kimchi-jjigae', '나만의 참치김치찌개', 1],
    ['egg-soup', '계란국', 2],
    ['my-egg-fried-rice', '마요 계란볶음밥', 4],
    ['jeyuk-bowl', '제육덮밥', 5],
    ['my-tuna-kimchi-jjigae', '나만의 참치김치찌개', 8],
    ['doenjang-jjigae', '된장찌개', 10],
    ['egg-soup', '계란국', 13],
  ]
  return rows.map(([recipeId, name, ago], i) => ({ id: `demo-${i}`, recipeId, name, at: now - ago * DAY - 3600e3 * 5 }))
}

function read(): CookLog[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (IS_DEMO && (DEMO_FRESH || !raw)) return demoLogs()
    const parsed = raw ? (JSON.parse(raw) as CookLog[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let logs: CookLog[] = read()

function emit(next: CookLog[]) {
  logs = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 메모리에서만
  }
  listeners.forEach((l) => l())
}

if (IS_DEMO && DEMO_FRESH) emit(logs)

export function recordCook(recipe: Pick<Recipe, 'id' | 'name'>, at = Date.now()): void {
  emit([{ id: `${at}-${recipe.id}`, recipeId: recipe.id, name: recipe.name, at }, ...logs].slice(0, 500))
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useHistory(): CookLog[] {
  return useSyncExternalStore(subscribe, () => logs, () => logs)
}

export interface CookedSummary {
  recipeId: string
  name: string
  count: number
  lastAt: number
}

/** 요리별로 묶기: 최근에 해먹은 순 */
export function summarize(list: CookLog[]): CookedSummary[] {
  const map = new Map<string, CookedSummary>()
  for (const l of list) {
    const s = map.get(l.recipeId)
    if (s) {
      s.count++
      if (l.at > s.lastAt) s.lastAt = l.at
    } else map.set(l.recipeId, { recipeId: l.recipeId, name: l.name, count: 1, lastAt: l.at })
  }
  return [...map.values()].sort((a, b) => b.lastAt - a.lastAt)
}

/** "오늘", "어제", "3일 전", "11월 2일" */
export function whenLabel(at: number, now = Date.now()): string {
  const d0 = new Date(now)
  d0.setHours(0, 0, 0, 0)
  const d1 = new Date(at)
  d1.setHours(0, 0, 0, 0)
  const days = Math.round((d0.getTime() - d1.getTime()) / DAY)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return `${d1.getMonth() + 1}월 ${d1.getDate()}일`
}
