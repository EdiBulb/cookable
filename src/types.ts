/** 0 = 없음, 1 = 거의 없음 … 5 = 넉넉 */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

export type Place = 'freezer' | 'fruit' | 'main' | 'door' | 'veg' | 'pantry'

export type Category =
  | 'protein'
  | 'veg'
  | 'fruit'
  | 'sauce'
  | 'grain'
  | 'drink'
  | 'frozen'

/** 앱이 미리 알고 있는 재료 (식재료 넣기 화면의 목록) */
export interface CatalogItem {
  name: string
  category: Category
  place: Place
}

/** 내 주방에 들어 있는 재료 */
export interface FridgeItem {
  id: string
  name: string
  category: Category
  place: Place
  level: Level
  updatedAt: number
  /** 냉장고에 넣은(산) 날 — 유통기한 자동 계산의 기준 */
  addedAt?: number
  /** 사용자가 직접 정한 "언제까지 먹을까" (그날 0시 타임스탬프). 없으면 자동 계산 */
  useBy?: number
}

export type CartSource = 'auto' | 'recipe' | 'manual'

export interface CartItem {
  id: string
  name: string
  source: CartSource
  /** 레시피에서 담았다면 어떤 요리 때문인지 */
  note?: string
  done: boolean
}

export type RecipeType = '국·찌개' | '밥·덮밥' | '면' | '볶음·구이' | '반찬' | '분식·간식' | '양식'

export interface Recipe {
  id: string
  name: string
  type: RecipeType
  minutes: number
  difficulty: '쉬움' | '보통'
  servings: number
  /** 표준 재료 이름 + 분량 */
  ingredients: { name: string; amount: string }[]
  steps: string[]
}
