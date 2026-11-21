import { useSyncExternalStore } from 'react'
import type { WishItem } from '../types'
import { DEMO_FRESH, IS_DEMO } from '../lib/demo'

/** 해볼 요리 목록 (이 기기에 저장, 체험 모드는 따로) */
const KEY = IS_DEMO ? 'cookable:wish:demo' : 'cookable:wish:v1'
const listeners = new Set<() => void>()
const DAY = 864e5

function demoWishes(now = Date.now()): WishItem[] {
  return [
    { id: 'demo-w1', name: '지삼선', recipeId: 'jisamseon', addedAt: now - 2 * DAY },
    { id: 'demo-w2', name: '김치전', recipeId: 'kimchi-pancake', addedAt: now - DAY },
    { id: 'demo-w3', name: '유린기', ingredients: ['닭고기', '양상추', '감자전분', '간장', '식초'], addedAt: now - 3600e3 },
  ]
}

function read(): WishItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (IS_DEMO && (DEMO_FRESH || !raw)) return demoWishes()
    const parsed = raw ? (JSON.parse(raw) as WishItem[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let wishes: WishItem[] = read()

function emit(next: WishItem[]) {
  wishes = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경이면 메모리에서만
  }
  listeners.forEach((l) => l())
}

if (IS_DEMO && DEMO_FRESH) emit(wishes)

const uid = () => Math.random().toString(36).slice(2, 10)

/** 같은 메뉴(레시피 id 또는 이름)가 이미 있으면 넣지 않는다 */
export function addWish(item: Omit<WishItem, 'id' | 'addedAt'>): boolean {
  if (wishes.some((w) => (item.recipeId && w.recipeId === item.recipeId) || w.name === item.name)) return false
  emit([...wishes, { ...item, id: uid(), addedAt: Date.now() }])
  return true
}

export function updateWish(id: string, patch: Partial<Omit<WishItem, 'id'>>): void {
  emit(wishes.map((w) => (w.id === id ? { ...w, ...patch } : w)))
}

export function removeWish(id: string): void {
  emit(wishes.filter((w) => w.id !== id))
}

/** 요리를 끝내면 해볼 요리에서 뺀다 (나만의 레시피로 해먹어도 원래 메뉴가 빠지게) */
export function completeWish(recipe: { id: string; name: string; baseId?: string }): void {
  const next = wishes.filter(
    (w) => !(w.recipeId && (w.recipeId === recipe.id || w.recipeId === recipe.baseId)) && w.name !== recipe.name,
  )
  if (next.length !== wishes.length) emit(next)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useWishes(): WishItem[] {
  return useSyncExternalStore(subscribe, () => wishes, () => wishes)
}
