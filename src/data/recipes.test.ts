import { describe, expect, it } from 'vitest'
import { CATALOG } from './catalog'
import { RECIPES } from './recipes'
import { STAPLES, normalize } from '../lib/recommend'

// 레시피 데이터 품질 검사: 레시피가 늘어나도 추천이 깨지지 않게
describe('레시피 데이터', () => {
  const known = new Set([...CATALOG.map((c) => normalize(c.name)), ...STAPLES])

  it('모든 재료 이름이 재료 목록(또는 별칭·기본 양념)에 있다', () => {
    const unknown = RECIPES.flatMap((r) =>
      r.ingredients.filter((i) => !known.has(normalize(i.name))).map((i) => `${r.name}: ${i.name}`),
    )
    expect(unknown).toEqual([])
  })

  it('아이디와 이름이 겹치지 않는다', () => {
    const ids = RECIPES.map((r) => r.id)
    const names = RECIPES.map((r) => r.name)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  it('모든 레시피에 재료와 조리 단계가 있다', () => {
    for (const r of RECIPES) {
      expect(r.ingredients.length, r.name).toBeGreaterThan(0)
      expect(r.steps.length, r.name).toBeGreaterThan(0)
    }
  })
})
