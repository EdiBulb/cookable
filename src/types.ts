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

export interface Recipe {
  id: string
  name: string
  minutes: number
  difficulty: '쉬움' | '보통'
  servings: number
  /** 표준 재료 이름 + 분량 */
  ingredients: { name: string; amount: string }[]
  steps: string[]
}
