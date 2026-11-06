import { describe, expect, it } from 'vitest'
import { EMPTY_KITCHEN, kitchenReducer } from './kitchen'

const withOnion = kitchenReducer(EMPTY_KITCHEN, {
  type: 'addItems',
  items: [{ name: '양파', category: 'veg', place: 'veg' }],
})

describe('kitchenReducer', () => {
  it('새로 넣은 재료는 넉넉(5)으로 시작한다', () => {
    expect(withOnion.fridge[0]).toMatchObject({ name: '양파', level: 5 })
  })

  it('남은 양이 0이 되면 장바구니에 자동으로 담는다 (중복 없이)', () => {
    let s = kitchenReducer(withOnion, { type: 'setLevel', name: '양파', level: 0 })
    s = kitchenReducer(s, { type: 'setLevel', name: '양파', level: 0 })
    expect(s.cart).toHaveLength(1)
    expect(s.cart[0]).toMatchObject({ name: '양파', source: 'auto', done: false })
  })

  it('장보기를 끝내면 산 재료가 냉장고에 다시 채워진다', () => {
    let s = kitchenReducer(withOnion, { type: 'setLevel', name: '양파', level: 0 })
    s = kitchenReducer(s, { type: 'toggleCartDone', id: s.cart[0].id })
    s = kitchenReducer(s, { type: 'finishShopping' })
    expect(s.cart).toHaveLength(0)
    expect(s.fridge.find((f) => f.name === '양파')?.level).toBe(5)
  })
})
