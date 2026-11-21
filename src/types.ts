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

export type CartSource = 'auto' | 'recipe' | 'wish' | 'manual'

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
  /** 나만의 레시피로 고친 경우: 원래 이름 (가벼운 메뉴 등 기본 레시피 기준 판단용) */
  baseName?: string
  /** 나만의 레시피면 true (기본 레시피와 따로 있는 별도 레시피) */
  custom?: boolean
  /** 나만의 레시피의 원래 레시피 id (사진도 이걸로) */
  baseId?: string
}

/** 해먹은 요리 기록 한 건 */
export interface CookLog {
  id: string
  recipeId: string
  name: string
  at: number
}

/** 나만의 레시피: 기본 레시피와 다른 부분만 저장 → 기본 레시피를 고쳐도 같이 반영됨 */
export interface RecipeOverride {
  baseId: string
  /** 비우면 기본 이름 */
  name?: string
  /** 뺀 재료 (기본 레시피의 재료 이름) */
  remove: string[]
  /** 추가한 재료 */
  add: { name: string; amount: string }[]
  /** 참고한 영상 링크나 메모 */
  note?: string
  updatedAt: number
}

/** 해볼 요리: 앞으로 해먹고 싶은 메뉴 (장보기 계획용) */
export interface WishItem {
  id: string
  /** 사용자가 적은 이름 (레시피가 있으면 레시피 이름) */
  name: string
  /** 앱에 있는 레시피면 그 id */
  recipeId?: string
  /** 레시피가 없는 메뉴: 사용자가 직접 적은 재료 */
  ingredients?: string[]
  addedAt: number
  /** 나중에 "이번 주 식단"으로 키울 때 쓸 자리 (요일, 0=일) */
  day?: number
}
