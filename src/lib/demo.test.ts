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
