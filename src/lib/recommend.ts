import type { FridgeItem, Recipe } from '../types'

/** 거의 모든 집에 있다고 보고 매칭에서 빼는 기본 양념 · 고명 */
export const STAPLES = new Set(['소금', '후추', '식용유', '설탕', '물', '참깨', '통깨'])

/** 사용자가 직접 입력한 이름을 표준 이름으로 바꾸는 별칭 표 */
/**
 * 같은 재료로 쳐도 되는 이름들. 재료 목록에는 따로 있어도(예: 마늘 / 다진 마늘)
 * 레시피 매칭에서는 하나로 본다. 레시피가 "마늘"을 원하면 다진 마늘이 있어도 OK.
 */
const ALIASES: Record<string, string> = {
  '소고기 국거리': '소고기',
  쇠고기: '소고기',
  '다진 소고기': '소고기',
  '불고기용 소고기': '소고기',
  차돌박이: '소고기',
  대패삼겹살: '돼지고기',
  닭날개: '닭고기',
  '다진 돼지고기': '돼지고기',
  삼겹살: '돼지고기',
  목살: '돼지고기',
  닭가슴살: '닭고기',
  닭다리살: '닭고기',
  '냉동 닭가슴살': '닭고기',
  '다진 마늘': '마늘',
  다진마늘: '마늘',
  '다진 생강': '생강',
  미역: '건미역',
  달걀: '계란',
  파: '대파',
  '냉동 대파': '대파',
  밥: '쌀',
  '냉동 밥': '쌀',
  진간장: '간장',
  '모짜렐라 치즈': '치즈',
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

/**
 * 요리 이름이나 재료 이름으로 레시피 검색.
 * 결과마다 내 냉장고 기준으로 부족한 재료를 같이 돌려준다 (부족한 게 적은 순).
 */
export function searchRecipes(recipes: Recipe[], fridge: FridgeItem[], query: string): Match[] {
  const q = query.trim()
  if (!q) return []
  const nq = normalize(q)
  const owned = ownedSet(fridge)
  return recipes
    .filter(
      (r) =>
        r.name.includes(q) ||
        r.ingredients.some((i) => i.name.includes(q) || normalize(i.name) === nq),
    )
    .map((r) => matchRecipe(r, owned))
    .sort((a, b) => a.missing.length - b.missing.length)
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
