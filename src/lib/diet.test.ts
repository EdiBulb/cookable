import { describe, expect, it } from 'vitest'
import { RECIPES, findRecipe } from '../data/recipes'
import { CATALOG } from '../data/catalog'
import { LIGHT_RECIPES, TAGGED_NAMES, tagsOf } from '../data/tags'
import { normalize } from './recommend'
import { blockedBy, dietSummary, EMPTY_DIET, isLight, isMild, type DietProfile } from './diet'

const recipe = (id: string) => {
  const r = findRecipe(id)
  if (!r) throw new Error(`no recipe ${id}`)
  return r
}
const diet = (p: Partial<DietProfile>): DietProfile => ({ ...EMPTY_DIET, ...p })

describe('blockedBy', () => {
  it('아무 설정이 없으면 모든 레시피가 통과', () => {
    expect(RECIPES.every((r) => blockedBy(r, EMPTY_DIET).length === 0)).toBe(true)
  })

  it('땅콩 알러지 → 땅콩버터 토스트 제외', () => {
    expect(blockedBy(recipe('pb-banana-toast'), diet({ allergies: ['peanut'] }))).toEqual(['땅콩버터(땅콩)'])
  })

  it('숨은 성분도 거른다: 간장 → 밀·대두, 굴소스 → 조개·굴', () => {
    expect(blockedBy(recipe('bokchoy'), diet({ allergies: ['mollusc'] }))[0]).toMatch('굴소스')
    expect(blockedBy(recipe('soy-bibim-guksu'), diet({ allergies: ['soy'] }))).toContain('간장(대두)')
  })

  it('페스코는 고기만, 락토오보는 해산물까지, 비건은 계란·유제품까지 뺀다', () => {
    const shrimp = recipe('shrimp-aglio')
    const jeyuk = recipe('jeyuk-bowl')
    expect(blockedBy(jeyuk, diet({ style: 'pesco' }))).toEqual(['고기'])
    expect(blockedBy(shrimp, diet({ style: 'pesco' }))).toEqual([])
    expect(blockedBy(shrimp, diet({ style: 'lacto-ovo' }))).toEqual(['해산물'])
    expect(blockedBy(recipe('scrambled-eggs'), diet({ style: 'lacto-ovo' }))).toEqual([])
    expect(blockedBy(recipe('scrambled-eggs'), diet({ style: 'vegan' })).length).toBeGreaterThan(0)
    // 멸치 육수팩 같은 숨은 동물성 재료
    expect(blockedBy(recipe('kalguksu'), diet({ style: 'lacto-ovo' }))).toEqual(['해산물'])
  })

  it('싫어하는 재료는 별칭까지 맞춰 뺀다', () => {
    expect(blockedBy(recipe('cucumber-salad'), diet({ dislikes: ['오이'] }))).toEqual(['오이'])
    expect(blockedBy(recipe('kimchi-fried-rice'), diet({ dislikes: ['계란'] }))).toEqual(['계란'])
  })

  it('비건이면 고기·해산물·계란·유제품이 든 요리는 하나도 통과하지 않는다', () => {
    const vegan = diet({ style: 'vegan' })
    for (const r of RECIPES.filter((r) => blockedBy(r, vegan).length === 0)) {
      for (const i of r.ingredients) {
        expect(tagsOf(i.name).some((t) => ['meat', 'seafood', 'egg', 'dairy', 'honey'].includes(t))).toBe(false)
      }
    }
  })
})

describe('그때그때 필터', () => {
  it('안 매운 메뉴: 고춧가루·고추장·김치가 든 요리는 빠진다', () => {
    expect(isMild(recipe('jeyuk-bowl'))).toBe(false)
    expect(isMild(recipe('kimchi-fried-rice'))).toBe(false)
    expect(isMild(recipe('egg-soup'))).toBe(true)
  })

  it('가벼운 메뉴 목록의 이름은 모두 실제 레시피다', () => {
    const names = new Set(RECIPES.map((r) => r.name))
    expect([...LIGHT_RECIPES].filter((n) => !names.has(n))).toEqual([])
    expect(RECIPES.filter(isLight).length).toBe(LIGHT_RECIPES.size)
  })
})

describe('태그 데이터', () => {
  it('태그를 단 이름은 모두 재료 목록이나 별칭에 있다 (오타 방지)', () => {
    const known = new Set(CATALOG.map((c) => c.name))
    const typos = TAGGED_NAMES.filter((n) => !known.has(n) && !known.has(normalize(n)))
    expect(typos.filter((n) => !['소고기 국거리', '쇠고기', '달걀', '멸치'].includes(n))).toEqual([])
  })

  it('한 줄 요약', () => {
    expect(dietSummary(diet({ style: 'pesco', allergies: ['peanut'], dislikes: ['오이'] }))).toBe(
      '페스코 · 땅콩 제외 · 오이 빼고',
    )
  })
})
