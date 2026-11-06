import type { CatalogItem, Category, Place } from '../types'

export const PLACE_LABEL: Record<Place, string> = {
  freezer: '냉동실',
  fruit: '과일칸',
  main: '일반 재료칸',
  door: '음료칸',
  veg: '채소칸',
  pantry: '찬장',
}

/** 냉장고 화면에 위에서부터 보여줄 순서 (찬장은 따로) */
export const FRIDGE_PLACES: Place[] = ['freezer', 'fruit', 'main', 'door', 'veg']

export const CATEGORY_LABEL: Record<Category, string> = {
  protein: '육류·해산물',
  veg: '채소',
  fruit: '과일',
  sauce: '양념·소스',
  grain: '곡물·건재료',
  drink: '유제품·음료',
  frozen: '냉동',
}

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

const c = (category: Category, place: Place, names: string[]): CatalogItem[] =>
  names.map((name) => ({ name, category, place }))

export const CATALOG: CatalogItem[] = [
  ...c('veg', 'veg', ['양파', '대파', '마늘', '감자', '당근', '애호박', '양배추', '버섯', '청양고추', '무', '오이', '콩나물']),
  ...c('veg', 'main', ['김치']),
  ...c('protein', 'main', ['소고기', '돼지고기', '닭고기', '계란', '두부', '햄', '베이컨']),
  ...c('protein', 'freezer', ['새우', '오징어']),
  ...c('protein', 'pantry', ['참치캔']),
  ...c('fruit', 'fruit', ['사과', '바나나', '레몬', '키위', '귤', '딸기']),
  ...c('sauce', 'pantry', ['간장', '국간장', '고추장', '된장', '고춧가루', '참기름', '식용유', '소금', '설탕', '굴소스', '식초', '케첩', '마요네즈', '후추']),
  ...c('grain', 'pantry', ['쌀', '라면', '파스타면', '건미역', '김', '밀가루', '부침가루', '식빵']),
  ...c('drink', 'door', ['우유', '오렌지 주스']),
  ...c('drink', 'main', ['버터', '치즈', '요거트']),
  ...c('frozen', 'freezer', ['냉동 만두', '냉동 밥']),
]

/** 처음 쓰는 사람을 위한 "자취 필수템" 묶음 */
export const STARTER_PACK = ['소금', '설탕', '간장', '식용유', '참기름', '고추장', '마늘', '계란', '쌀', '라면']

export function findCatalog(name: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.name === name)
}
