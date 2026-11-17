import { describe, expect, it } from 'vitest'
import { searchCatalog } from './catalog'
import { normalize } from '../lib/recommend'

describe('searchCatalog (장바구니 자동완성)', () => {
  it('똑같은 이름이 맨 앞, 그다음 포함하는 재료', () => {
    const names = searchCatalog('토마토', 6, normalize).map((c) => c.name)
    expect(names[0]).toBe('토마토')
    expect(names).toContain('방울토마토')
  })

  it('별칭으로 찾아도 목록 이름이 나온다 (달걀 → 계란)', () => {
    expect(searchCatalog('달걀', 6, normalize)[0].name).toBe('계란')
  })

  it('띄어쓰기는 무시하고, 목록에 없으면 빈 결과', () => {
    expect(searchCatalog('다진마늘', 6, normalize).map((c) => c.name)).toContain('다진 마늘')
    expect(searchCatalog('휴지', 6, normalize)).toEqual([])
  })
})
