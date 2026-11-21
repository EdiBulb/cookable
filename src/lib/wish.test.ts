import { describe, expect, it } from 'vitest'
import { RECIPES } from '../data/recipes'
import type { FridgeItem, WishItem } from '../types'
import { findByName, similarRecipes, wishIngredients, wishNeeds, wishNote } from './wish'

const fridgeOf = (...names: string[]): FridgeItem[] =>
  names.map((name, i) => ({ id: String(i), name, category: 'veg', place: 'veg', level: 3, updatedAt: 0 }))

describe('해볼 요리', () => {
  it('이름으로 레시피를 찾는다 (띄어쓰기 무시)', () => {
    expect(findByName(RECIPES, '김치전')?.id).toBe('kimchi-pancake')
    expect(findByName(RECIPES, '김치 전')?.id).toBe('kimchi-pancake')
    expect(findByName(RECIPES, '지삼선')?.id).toBe('jisamseon')
    expect(findByName(RECIPES, '없는메뉴')).toBeUndefined()
  })

  it('없는 메뉴는 이름이 겹치거나 재료가 들어간 비슷한 레시피를 준다', () => {
    const names = similarRecipes(RECIPES, '호박전').map((r) => r.name)
    expect(names.length).toBeGreaterThan(0)
    expect(names.some((n) => n.endsWith('전') || n.includes('호박'))).toBe(true)
    expect(similarRecipes(RECIPES, '전')).toEqual([])
  })

  it('필요한 재료는 기본 양념을 빼고 표준 이름으로', () => {
    const item: WishItem = { id: 'a', name: '지삼선', recipeId: 'jisamseon', addedAt: 0 }
    const ing = wishIngredients(item, RECIPES)
    expect(ing).toContain('가지')
    expect(ing).not.toContain('설탕')
    expect(ing).not.toContain('식용유')
    const manual: WishItem = { id: 'b', name: '마파두부', ingredients: ['두부', '소금'], addedAt: 0 }
    expect(wishIngredients(manual, RECIPES)).toEqual(['두부'])
  })

  it('여러 메뉴의 재료를 한 줄로 합치고, 없는 재료가 먼저', () => {
    const items: WishItem[] = [
      { id: 'a', name: '김치전', recipeId: 'kimchi-pancake', addedAt: 0 },
      { id: 'b', name: '감자전', recipeId: 'potato-pancake', addedAt: 0 },
    ]
    const needs = wishNeeds(items, RECIPES, fridgeOf('김치'))
    const onion = needs.find((n) => n.name === '양파')
    expect(onion?.forMenus).toEqual(['김치전', '감자전'])
    expect(needs.find((n) => n.name === '김치')?.owned).toBe(true)
    expect(needs.at(-1)?.owned).toBe(true)
    expect(needs.filter((n) => n.name === '양파')).toHaveLength(1)
  })

  it('장바구니 메모', () => {
    expect(wishNote(['지삼선'])).toBe('지삼선에 필요해요')
    expect(wishNote(['지삼선', '배추전'])).toBe('지삼선·배추전에 필요해요')
    expect(wishNote(['a', 'b', 'c'])).toBe('a 외 2개에 필요해요')
  })
})
