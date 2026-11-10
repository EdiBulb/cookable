import { describe, expect, it } from 'vitest'
import type { FridgeItem, Recipe } from '../types'
import { EMPTY_KITCHEN, kitchenReducer } from '../store/kitchen'
import { recommend } from './recommend'
import {
  dayLabel,
  daysFromToday,
  daysLeft,
  optionLabel,
  quickOptions,
  urgencyOf,
  urgentItems,
} from './expiry'

const NOW = new Date(2026, 10, 10, 9, 0).getTime() // 2026-11-10 오전 9시
const daysAgo = (n: number) => NOW - n * 864e5

const item = (name: string, addedDaysAgo: number, extra: Partial<FridgeItem> = {}): FridgeItem => ({
  id: name,
  name,
  category: 'veg',
  place: 'veg',
  level: 3,
  updatedAt: 0,
  addedAt: daysAgo(addedDaysAgo),
  ...extra,
})

describe('daysLeft', () => {
  it('넣은 날 + 재료별 보관 일수로 자동 계산한다', () => {
    expect(daysLeft(item('양상추', 0), NOW)).toBe(5)
    expect(daysLeft(item('양상추', 4), NOW)).toBe(1)
    expect(daysLeft(item('계란', 0, { category: 'protein', place: 'main' }), NOW)).toBe(21)
  })

  it('지나면 음수가 된다', () => {
    expect(daysLeft(item('숙주', 3), NOW)).toBe(-1)
  })

  it('오래가는 소스·건재료는 세지 않는다', () => {
    expect(daysLeft(item('간장', 100, { category: 'sauce', place: 'pantry' }), NOW)).toBeNull()
  })

  it('냉동실에 둔 재료는 두 달로 본다', () => {
    expect(daysLeft(item('새우', 0, { category: 'protein', place: 'freezer' }), NOW)).toBe(60)
  })

  it('직접 정한 날짜가 있으면 그걸 쓴다', () => {
    expect(daysLeft(item('양상추', 0, { useBy: daysFromToday(1, NOW) }), NOW)).toBe(1)
  })

  it('목록에 없는 재료는 칸으로 짐작한다', () => {
    expect(daysLeft(item('고수', 0), NOW)).toBe(7)
    expect(daysLeft(item('비밀 소스', 0, { place: 'pantry' }), NOW)).toBeNull()
  })
})

describe('quickOptions', () => {
  it('재료의 보관 일수에 맞춰 버튼을 만든다 (모두 같은 1·3·7일이 아님)', () => {
    expect(quickOptions(5)).toEqual([0, 2, 5, 7]) // 양상추
    expect(quickOptions(21)).toEqual([0, 7, 21, 30]) // 계란
    expect(quickOptions(60)).toEqual([0, 21, 60, 90]) // 냉동
  })

  it('버튼 이름은 사람이 읽기 쉽게', () => {
    expect([0, 2, 7, 14, 21, 30, 90].map(optionLabel)).toEqual([
      '오늘까지', '2일', '일주일', '2주', '3주', '한 달', '3달',
    ])
  })
})

describe('labels', () => {
  it('D-day 표시와 급한 정도', () => {
    expect(dayLabel(-2)).toBe('2일 지남')
    expect(dayLabel(0)).toBe('오늘까지')
    expect(dayLabel(3)).toBe('D-3')
    expect([-1, 0, 2, 3, 4].map(urgencyOf)).toEqual(['over', 'soon', 'soon', 'near', 'ok'])
  })
})

describe('urgentItems', () => {
  it('3일 안에 먹어야 하는 재료를 급한 순으로 (다 떨어진 재료는 빼고)', () => {
    const fridge = [
      item('양상추', 4), // D-1
      item('두부', 3, { category: 'protein', place: 'main' }), // D-2
      item('양파', 0), // D-30
      item('숙주', 0, { level: 0 }),
    ]
    expect(urgentItems(fridge, NOW)).toEqual([
      { name: '양상추', days: 1 },
      { name: '두부', days: 2 },
    ])
  })
})

describe('reducer', () => {
  it('넣을 때 날짜를 기록하고, 다시 사면 직접 정한 날짜를 지우고 새로 시작한다', () => {
    let s = kitchenReducer(EMPTY_KITCHEN, {
      type: 'addItems',
      items: [{ name: '양상추', category: 'veg', place: 'veg' }],
    })
    expect(s.fridge[0].addedAt).toBeTypeOf('number')
    s = kitchenReducer(s, { type: 'setUseBy', name: '양상추', useBy: 123 })
    expect(s.fridge[0].useBy).toBe(123)
    s = kitchenReducer(s, { type: 'setUseBy', name: '양상추', useBy: null })
    expect('useBy' in s.fridge[0]).toBe(false)
    s = kitchenReducer(s, { type: 'setUseBy', name: '양상추', useBy: 123 })
    s = kitchenReducer(s, {
      type: 'addItems',
      items: [{ name: '양상추', category: 'veg', place: 'veg' }],
    })
    expect(s.fridge[0].useBy).toBeUndefined()
  })
})

describe('recommend', () => {
  const r = (id: string, names: string[]): Recipe => ({
    id,
    name: id,
    type: '반찬',
    minutes: 10,
    difficulty: '쉬움',
    servings: 1,
    ingredients: names.map((name) => ({ name, amount: '' })),
    steps: [],
  })

  it('빨리 먹어야 하는 재료를 쓰는 요리를 먼저 추천한다', () => {
    const recipes = [r('양파볶음', ['양파', '당근']), r('샐러드', ['양상추'])]
    const fridge = [item('양파', 0), item('당근', 0), item('양상추', 4)]
    const { canCook } = recommend(recipes, fridge, NOW)
    expect(canCook.map((m) => m.recipe.id)).toEqual(['샐러드', '양파볶음'])
    expect(canCook[0].uses).toEqual([{ name: '양상추', days: 1 }])
  })

  it('이미 지난 재료로는 추천 순서를 올리지 않는다', () => {
    const recipes = [r('양파볶음', ['양파', '당근']), r('숙주볶음', ['숙주'])]
    const fridge = [item('양파', 0), item('당근', 0), item('숙주', 5)]
    const { canCook } = recommend(recipes, fridge, NOW)
    expect(canCook[0].recipe.id).toBe('양파볶음')
  })
})

describe('내 주방 편집 (여러 개 한 번에)', () => {
  const start = kitchenReducer(EMPTY_KITCHEN, {
    type: 'addItems',
    items: [
      { name: '양파', category: 'veg', place: 'veg' },
      { name: '두부', category: 'protein', place: 'main' },
      { name: '우유', category: 'drink', place: 'door' },
    ],
  })

  it('빼기: 냉장고에서만 지우고 장바구니에는 담지 않는다', () => {
    const s = kitchenReducer(start, { type: 'removeItems', names: ['양파', '두부'] })
    expect(s.fridge.map((f) => f.name)).toEqual(['우유'])
    expect(s.cart).toEqual([])
  })

  it('다 떨어졌어요: 잔량 0 + 장바구니에 자동으로 담는다', () => {
    const s = kitchenReducer(start, { type: 'emptyItems', names: ['양파', '우유'] })
    expect(s.fridge.filter((f) => f.level === 0).map((f) => f.name).sort()).toEqual(['양파', '우유'])
    expect(s.cart.map((c) => c.name).sort()).toEqual(['양파', '우유'])
  })
})
