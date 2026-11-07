import { describe, expect, it } from 'vitest'
import type { FridgeItem, Level } from '../types'
import { RECIPES } from '../data/recipes'
import { normalize, recommend } from './recommend'

const item = (name: string, level: Level = 3): FridgeItem => ({
  id: name,
  name,
  category: 'veg',
  place: 'main',
  level,
  updatedAt: 0,
})

describe('normalize', () => {
  it('별칭을 표준 이름으로 바꾼다', () => {
    expect(normalize('소고기 국거리')).toBe('소고기')
    expect(normalize(' 다진 마늘 ')).toBe('마늘')
    expect(normalize('양파')).toBe('양파')
  })

  it('목록에 따로 있는 가공 재료도 레시피에서는 같은 재료로 본다', () => {
    expect(normalize('다진 마늘')).toBe('마늘')
    expect(normalize('삼겹살')).toBe('돼지고기')
    expect(normalize('진간장')).toBe('간장')
  })
})

describe('recommend', () => {
  const fridge = [
    item('건미역'),
    item('소고기 국거리'),
    item('국간장'),
    item('참기름'),
    item('다진 마늘'),
    item('두부'),
    item('애호박'),
    item('양파'),
    item('대파'),
  ]

  it('재료가 다 있으면 지금 만들 수 있는 요리에 넣는다', () => {
    const { canCook } = recommend(RECIPES, fridge)
    expect(canCook.map((m) => m.recipe.name)).toContain('소고기 미역국')
  })

  it('재료가 하나만 없으면 그 재료와 함께 알려준다', () => {
    const { oneMore } = recommend(RECIPES, fridge)
    const jjigae = oneMore.find((m) => m.recipe.name === '된장찌개')
    expect(jjigae?.missing).toEqual(['된장'])
  })

  it('기본 양념(소금·식용유·설탕)은 없어도 문제 삼지 않는다', () => {
    const { canCook } = recommend(RECIPES, fridge)
    // 두부 간장조림에는 설탕이 들어가지만, 냉장고에 설탕이 없어도 추천돼야 한다
    const { canCook: withSoy } = recommend(RECIPES, [...fridge, item('간장')])
    expect(withSoy.map((m) => m.recipe.name)).toContain('두부 간장조림')
    expect(canCook.map((m) => m.recipe.name)).not.toContain('두부 간장조림')
  })

  it('남은 양이 0인 재료는 없는 것으로 본다', () => {
    const empty = fridge.map((f) => (f.name === '건미역' ? { ...f, level: 0 as Level } : f))
    const { canCook, oneMore } = recommend(RECIPES, empty)
    expect(canCook.map((m) => m.recipe.name)).not.toContain('소고기 미역국')
    expect(oneMore.find((m) => m.recipe.name === '소고기 미역국')?.missing).toEqual(['건미역'])
  })
})
