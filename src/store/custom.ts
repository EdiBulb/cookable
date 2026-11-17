import { useSyncExternalStore } from 'react'
import type { Recipe, RecipeOverride } from '../types'
import { RECIPES, findRecipe } from '../data/recipes'
import { applyOverride } from '../lib/custom'
import { DEMO_FRESH, IS_DEMO } from '../lib/demo'

/**
 * 나만의 레시피 (이 기기에 저장, 체험 모드는 따로).
 * 기본 레시피는 그대로 두고, "나만의 ○○"를 별도 레시피로 하나 더 만든다.
 * 저장은 기본 레시피와 다른 부분만 → 기본 레시피를 고쳐도 같이 반영.
 */
const KEY = IS_DEMO ? 'cookable:custom:demo' : 'cookable:custom:v1'
const listeners = new Set<() => void>()

type Overrides = Record<string, RecipeOverride>

/** 나만의 레시피의 id: 원래 레시피 id 앞에 my- */
export const customId = (baseId: string) => `my-${baseId}`

const DEMO_OVERRIDES: Overrides = {
  'tuna-kimchi-jjigae': {
    baseId: 'tuna-kimchi-jjigae',
    name: '나만의 참치김치찌개',
    remove: ['두부'],
    add: [
      { name: '햄', amount: '1/3캔' },
      { name: '라면', amount: '면만 1개' },
    ],
    note: 'https://www.youtube.com/results?search_query=참치김치찌개',
    updatedAt: Date.now() - 3 * 864e5,
  },
  'egg-fried-rice': {
    baseId: 'egg-fried-rice',
    name: '마요 계란볶음밥',
    remove: [],
    add: [{ name: '마요네즈', amount: '1큰술' }],
    note: '마지막에 마요네즈 한 바퀴, 불 끄고 섞기',
    updatedAt: Date.now() - 6 * 864e5,
  },
}

function read(): Overrides {
  try {
    const raw = localStorage.getItem(KEY)
    if (IS_DEMO && (DEMO_FRESH || !raw)) return DEMO_OVERRIDES
    const parsed = raw ? (JSON.parse(raw) as Overrides) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

let current: Overrides = read()
let recipes: Recipe[] = compute()

function compute(): Recipe[] {
  const customs = Object.values(current)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .flatMap((ov) => {
      const base = findRecipe(ov.baseId)
      if (!base) return []
      return [{ ...applyOverride(base, ov), id: customId(base.id), baseId: base.id }]
    })
  return [...customs, ...RECIPES]
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

if (IS_DEMO && DEMO_FRESH) emit(current)

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

/** 기본 레시피 + 나만의 레시피 전체 (추천·검색·상세에 이걸 쓴다) */
export function useRecipes(): Recipe[] {
  return useSyncExternalStore(subscribe, () => recipes, () => recipes)
}

export function useOverrides(): Overrides {
  return useSyncExternalStore(subscribe, () => current, () => current)
}
