import { useSyncExternalStore } from 'react'
import type { Recipe, RecipeOverride } from '../types'
import { RECIPES } from '../data/recipes'
import { applyOverride } from '../lib/custom'
import { IS_DEMO } from '../lib/demo'

/** 나만의 레시피 (이 기기에 저장, 체험 모드는 따로) */
const KEY = IS_DEMO ? 'cookable:custom:demo' : 'cookable:custom:v1'
const listeners = new Set<() => void>()

type Overrides = Record<string, RecipeOverride>

function read(): Overrides {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Overrides) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

let current: Overrides = read()
let recipes: Recipe[] = compute()

function compute(): Recipe[] {
  return RECIPES.map((r) => applyOverride(r, current[r.id]))
}

function emit(next: Overrides) {
  current = next
  recipes = compute()
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경이면 메모리에서만
  }
  listeners.forEach((l) => l())
}

export function saveOverride(ov: RecipeOverride): void {
  emit({ ...current, [ov.baseId]: ov })
}

export function removeOverride(baseId: string): void {
  const next = { ...current }
  delete next[baseId]
  emit(next)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** 나만의 레시피가 반영된 전체 레시피 목록 (추천·검색·상세에 이걸 쓴다) */
export function useRecipes(): Recipe[] {
  return useSyncExternalStore(subscribe, () => recipes, () => recipes)
}

export function useOverrides(): Overrides {
  return useSyncExternalStore(subscribe, () => current, () => current)
}
