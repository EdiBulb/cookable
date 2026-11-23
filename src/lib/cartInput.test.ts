import { describe, expect, it } from 'vitest'
import { bump, catalogMatch, keepUnknownBought, parseMulti, topFrequent } from './cartInput'

describe('장바구니 직접 추가', () => {
  it('목록 이름으로 맞춘다 (띄어쓰기·별칭)', () => {
    expect(catalogMatch('양파')).toBe('양파')
    expect(catalogMatch('달걀')).toBe('계란')
    expect(catalogMatch('휴지')).toBeUndefined()
  })

  it('쉼표가 없으면 여러 개 모드가 아니다', () => {
    expect(parseMulti('양파')).toEqual([])
  })

  it('쉼표로 나누고, 목록에 없는 건 적은 그대로, 중복은 하나로', () => {
    const t = parseMulti('양파, 달걀 ,휴지,, 양파')
    expect(t.map((x) => x.name)).toEqual(['양파', '계란', '휴지'])
    expect(t.find((x) => x.name === '계란')?.raw).toBe('달걀')
    expect(t.find((x) => x.name === '휴지')?.inCatalog).toBe(false)
    expect(parseMulti('대파，두부').map((x) => x.name)).toEqual(['대파', '두부'])
  })

  it('자주 산 순, 같으면 최근 순, 장바구니에 있는 건 빼고', () => {
    let f = bump({}, ['계란', '우유'], 100)
    f = bump(f, ['계란'], 200)
    f = bump(f, ['두부'], 300)
    expect(topFrequent(f, new Set())).toEqual(['계란', '두부', '우유'])
    expect(topFrequent(f, new Set(['계란']), 1)).toEqual(['두부'])
  })
})

describe('장보기 끝낼 때 목록에 없는 재료', () => {
  it('레시피에 쓰이는 이름만 냉장고로, 생활용품은 빠진다', () => {
    const used = new Set(['트러플오일', '두부'])
    const keep = keepUnknownBought(['트러플오일', '휴지', '두부'], used, (n) => n === '두부')
    expect(keep.map((k) => k.name)).toEqual(['트러플오일'])
    expect(keep[0]).toMatchObject({ category: 'sauce', place: 'pantry' })
  })

  it('참치액은 이제 재료 목록에 있다', () => {
    expect(catalogMatch('참치액')).toBe('참치액')
    expect(catalogMatch('참치액젓')).toBe('참치액')
  })
})
