import type { FridgeItem, Recipe } from '../types'

/** 거의 모든 집에 있다고 보고 매칭에서 빼는 기본 양념 */
export const STAPLES = new Set(['소금', '후추', '식용유', '설탕', '물'])

/** 사용자가 직접 입력한 이름을 표준 이름으로 바꾸는 별칭 표 */
const ALIASES: Record<string, string> = {
  '소고기 국거리': '소고기',
  쇠고기: '소고기',
  '다진 마늘': '마늘',
  '다진마늘': '마늘',
  미역: '건미역',
  달걀: '계란',
  파: '대파',
  밥: '쌀',
}

export function normalize(name: string): string {
  const trimmed = name.trim()
  return ALIASES[trimmed] ?? trimmed
}

/** 남은 양이 0보다 큰 재료만 "있음"으로 본다 */
export function ownedSet(fridge: FridgeItem[]): Set<string> {
  return new Set(fridge.filter((i) => i.level > 0).map((i) => normalize(i.name)))
}

export interface Match {
  recipe: Recipe
  /** 기본 양념을 뺀, 실제로 필요한 재료 */
  needed: string[]
  missing: string[]
}

export function matchRecipe(recipe: Recipe, owned: Set<string>): Match {
  const needed = recipe.ingredients.map((i) => normalize(i.name)).filter((n) => !STAPLES.has(n))
  const missing = needed.filter((n) => !owned.has(n))
  return { recipe, needed, missing }
}

export interface Recommendation {
  canCook: Match[]
  oneMore: Match[]
}

/**
 * 냉장고 재료로 만들 수 있는 요리 / 하나만 더 사면 되는 요리를 고른다.
 * 정렬: 내가 가진 재료를 많이 쓰는 요리일수록 앞에 (냉장고 비우기에 유리).
 */
export function recommend(recipes: Recipe[], fridge: FridgeItem[]): Recommendation {
  const owned = ownedSet(fridge)
  const matches = recipes.map((r) => matchRecipe(r, owned))
  const byUsage = (a: Match, b: Match) =>
    b.needed.length - b.missing.length - (a.needed.length - a.missing.length)

  return {
    canCook: matches.filter((m) => m.missing.length === 0).sort(byUsage),
    oneMore: matches.filter((m) => m.missing.length === 1).sort(byUsage),
  }
}
