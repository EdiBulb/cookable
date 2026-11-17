import { describe, expect, it } from 'vitest'
import { findRecipe } from '../data/recipes'
import { applyOverride, isEmptyOverride, isUrl } from './custom'
import { recommend } from './recommend'
import { isLight } from './diet'
import type { FridgeItem, RecipeOverride } from '../types'

const base = findRecipe('tuna-kimchi-jjigae')!
const ov = (p: Partial<RecipeOverride>): RecipeOverride => ({ baseId: base.id, remove: [], add: [], updatedAt: 0, ...p })
const item = (name: string): FridgeItem => ({ id: name, name, category: 'veg', place: 'main', level: 3, updatedAt: 0 })

describe('나만의 레시피', () => {
  it('뺀 재료는 빠지고 추가한 재료는 붙고, 이름이 바뀐다', () => {
    const r = applyOverride(base, ov({ name: '나만의 김치찌개', remove: ['두부'], add: [{ name: '햄', amount: '1/3캔' }] }))
    expect(r.name).toBe('나만의 김치찌개')
    expect(r.ingredients.map((i) => i.name)).not.toContain('두부')
    expect(r.ingredients.map((i) => i.name)).toContain('햄')
    expect(r.custom).toBe(true)
    expect(r.baseName).toBe(base.name)
  })

  it('추천은 내 방식 기준: 두부를 뺐으면 두부 없이도 바로 가능', () => {
    const others = base.ingredients.filter((i) => i.name !== '두부').map((i) => item(i.name))
    expect(recommend([base], others).canCook).toHaveLength(0)
    const mine = applyOverride(base, ov({ remove: ['두부'] }))
    expect(recommend([mine], others).canCook).toHaveLength(1)
  })

  it('고친 게 없으면 저장할 필요 없음, 링크인지 판별', () => {
    expect(isEmptyOverride(ov({ name: base.name }), base)).toBe(true)
    expect(isEmptyOverride(ov({ note: '맛있음' }), base)).toBe(false)
    expect(isUrl('https://youtu.be/abc')).toBe(true)
    expect(isUrl('엄마 레시피')).toBe(false)
  })

  it('이름을 바꿔도 가벼운 메뉴 판단은 기본 레시피 기준', () => {
    const soup = findRecipe('egg-soup')!
    expect(isLight(applyOverride(soup, ov({ baseId: soup.id, name: '내 계란국' })))).toBe(isLight(soup))
  })
})
