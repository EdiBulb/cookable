import { describe, expect, it } from 'vitest'
import { decide, hasMeaningfulData, sameSnapshot, type Snapshot } from './sync'

const kitchen = (n: number) => JSON.stringify({ fridge: Array.from({ length: n }, (_, i) => ({ id: String(i) })), cart: [] })
const snap = (over: Partial<Snapshot> = {}): Snapshot => ({
  'cookable:kitchen:v1': kitchen(0),
  'cookable:custom:v1': '{}',
  'cookable:history:v1': '[]',
  'cookable:wish:v1': '[]',
  'cookable:diet:v1': null,
  ...over,
})

describe('백업 동기화 판단', () => {
  it('빈 냉장고·빈 기록은 지킬 데이터가 아니다', () => {
    expect(hasMeaningfulData(snap())).toBe(false)
    expect(hasMeaningfulData(snap({ 'cookable:kitchen:v1': kitchen(2) }))).toBe(true)
    expect(hasMeaningfulData(snap({ 'cookable:wish:v1': '[{"id":"a"}]' }))).toBe(true)
    expect(hasMeaningfulData({})).toBe(false)
  })

  it('서버에 없으면 올리고, 같으면 그대로', () => {
    expect(decide(snap(), null, { user: null, at: 0 }, 'u1')).toBe('push')
    const s = snap({ 'cookable:kitchen:v1': kitchen(3) })
    expect(decide(s, { keys: { ...s }, updatedAt: 1 }, { user: null, at: 0 }, 'u1')).toBe('same')
    expect(sameSnapshot(s, { ...s })).toBe(true)
  })

  it('새 기기(데이터 없음)에서 로그인하면 받아온다', () => {
    const remote = { keys: snap({ 'cookable:kitchen:v1': kitchen(5) }), updatedAt: 100 }
    expect(decide(snap(), remote, { user: null, at: 0 }, 'u1')).toBe('pull')
  })

  it('서버가 비어 있으면 이 기기 걸 올린다', () => {
    expect(decide(snap({ 'cookable:kitchen:v1': kitchen(2) }), { keys: snap(), updatedAt: 100 }, { user: null, at: 0 }, 'u1')).toBe('push')
  })

  it('같은 계정과 맞춘 적 있으면 더 최근 쪽', () => {
    const local = snap({ 'cookable:kitchen:v1': kitchen(2) })
    const remote = { keys: snap({ 'cookable:kitchen:v1': kitchen(4) }), updatedAt: 200 }
    expect(decide(local, remote, { user: 'u1', at: 100 }, 'u1')).toBe('pull')
    expect(decide(local, remote, { user: 'u1', at: 300 }, 'u1')).toBe('push')
  })

  it('처음 만난 두 데이터가 다 있으면 묻는다', () => {
    const local = snap({ 'cookable:kitchen:v1': kitchen(2) })
    const remote = { keys: snap({ 'cookable:kitchen:v1': kitchen(4) }), updatedAt: 200 }
    expect(decide(local, remote, { user: null, at: 0 }, 'u1')).toBe('ask')
    expect(decide(local, remote, { user: 'other', at: 999 }, 'u1')).toBe('ask')
  })
})
