import { describe, expect, it } from 'vitest'
import { summarize, whenLabel } from './history'

const NOW = new Date(2026, 10, 18, 12).getTime()
const DAY = 864e5

describe('해먹은 요리', () => {
  it('요리별로 묶고, 최근에 해먹은 순', () => {
    const s = summarize([
      { id: '1', recipeId: 'a', name: 'A', at: NOW - 5 * DAY },
      { id: '2', recipeId: 'b', name: 'B', at: NOW - 1 * DAY },
      { id: '3', recipeId: 'a', name: 'A', at: NOW - 3 * DAY },
    ])
    expect(s.map((x) => [x.recipeId, x.count])).toEqual([
      ['b', 1],
      ['a', 2],
    ])
  })

  it('날짜 표시', () => {
    expect(whenLabel(NOW - 2 * 3600e3, NOW)).toBe('오늘')
    expect(whenLabel(NOW - DAY, NOW)).toBe('어제')
    expect(whenLabel(NOW - 3 * DAY, NOW)).toBe('3일 전')
    expect(whenLabel(new Date(2026, 10, 2).getTime(), NOW)).toBe('11월 2일')
  })
})
