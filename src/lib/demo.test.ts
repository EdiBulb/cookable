import { describe, expect, it } from 'vitest'
import { demoKitchen } from './demo'
import { urgentItems } from './expiry'

describe('체험 모드 가짜 데이터', () => {
  it('샘플 재료가 모두 재료 목록에 있어서 빠지는 게 없다', () => {
    expect(demoKitchen().fridge.length).toBe(32)
  })

  it('먼저 먹을 재료·지난 재료·다 떨어진 재료가 골고루 보인다', () => {
    const k = demoKitchen()
    const urgent = urgentItems(k.fridge)
    expect(urgent.some((u) => u.days < 0)).toBe(true)
    expect(urgent.some((u) => u.days >= 0)).toBe(true)
    expect(k.fridge.some((f) => f.level === 0)).toBe(true)
  })
})

describe('냉장고 비우기', () => {
  it('양념·건재료·냉동실은 남기고 금방 상하는 재료만 비운다', async () => {
    const { isLongLasting } = await import('../components/EmptyFridge')
    const kept = demoKitchen().fridge.filter(isLongLasting).map((f) => f.name)
    expect(kept).toEqual(expect.arrayContaining(['간장', '고추장', '쌀', '냉동 만두']))
    expect(kept).not.toContain('양상추')
    expect(kept).not.toContain('두부')
    expect(kept).not.toContain('식빵')
  })
})
