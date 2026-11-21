import type { FridgeItem, Recipe, WishItem } from '../types'
import { STAPLES, normalize, ownedSet } from './recommend'

/** 띄어쓰기를 무시하고 비교 ("김치 전" = "김치전") */
const squash = (s: string) => s.replace(/\s+/g, '')

/** 적은 이름과 똑같은 레시피 (나만의 레시피보다 기본 레시피 먼저) */
export function findByName(recipes: Recipe[], name: string): Recipe | undefined {
  const q = squash(name)
  if (!q) return undefined
  const hits = recipes.filter((r) => squash(r.name) === q)
  return hits.find((r) => !r.custom) ?? hits[0]
}

/** 두 이름이 함께 가진 가장 긴 글자 조각의 길이 */
function commonRun(a: string, b: string): number {
  let best = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0
      while (a[i + k] && a[i + k] === b[j + k]) k++
      if (k > best) best = k
    }
  }
  return best
}

/**
 * 앱에 없는 메뉴일 때 보여 줄 비슷한 레시피.
 * 이름이 두 글자 이상 겹치거나(배추전 → 감자전·김치전), 메뉴 이름 안에 재료가 들어 있으면(배추전 → 배추가 들어간 요리) 후보.
 */
export function similarRecipes(recipes: Recipe[], name: string, limit = 3): Recipe[] {
  const q = squash(name)
  if (q.length < 2) return []
  return recipes
    .filter((r) => !r.custom)
    .map((r) => {
      const byName = commonRun(q, squash(r.name))
      const byIngredient = r.ingredients.some((i) => i.name.length >= 2 && q.includes(squash(i.name))) ? 2 : 0
      return { r, score: Math.max(byName >= 2 ? byName * 2 : 0, byIngredient) }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.r.name.length - b.r.name.length)
    .slice(0, limit)
    .map((x) => x.r)
}

/** 해볼 요리 하나에 필요한 재료 (기본 양념 제외, 표준 이름) */
export function wishIngredients(item: WishItem, recipes: Recipe[]): string[] {
  const recipe = item.recipeId ? recipes.find((r) => r.id === item.recipeId) : undefined
  const names = recipe ? recipe.ingredients.map((i) => i.name) : item.ingredients ?? []
  return [...new Set(names.map(normalize))].filter((n) => !STAPLES.has(n))
}

export interface WishNeed {
  name: string
  /** 이 재료가 필요한 메뉴들 (목록 순서대로) */
  forMenus: string[]
  owned: boolean
}

/** 해볼 요리 전체에 필요한 재료를 한 줄씩 합친다. 없는 재료가 먼저, 그 안에서는 처음 나온 순 */
export function wishNeeds(items: WishItem[], recipes: Recipe[], fridge: FridgeItem[]): WishNeed[] {
  const owned = ownedSet(fridge)
  const map = new Map<string, WishNeed>()
  for (const item of items) {
    for (const name of wishIngredients(item, recipes)) {
      const need = map.get(name)
      if (need) {
        if (!need.forMenus.includes(item.name)) need.forMenus.push(item.name)
      } else map.set(name, { name, forMenus: [item.name], owned: owned.has(name) })
    }
  }
  const all = [...map.values()]
  return [...all.filter((n) => !n.owned), ...all.filter((n) => n.owned)]
}

/** 장바구니 메모: "지삼선·배추전에 필요해요" (메뉴가 많으면 "지삼선 외 2개") */
export function wishNote(menus: string[]): string {
  const label = menus.length <= 2 ? menus.join('·') : `${menus[0]} 외 ${menus.length - 1}개`
  return `${label}에 필요해요`
}
