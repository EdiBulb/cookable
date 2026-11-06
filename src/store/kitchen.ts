import type { CartItem, CatalogItem, FridgeItem, Level } from '../types'
import { findCatalog } from '../data/catalog'

export interface KitchenState {
  fridge: FridgeItem[]
  cart: CartItem[]
}

export type KitchenAction =
  | { type: 'addItems'; items: CatalogItem[] }
  | { type: 'setLevel'; name: string; level: Level }
  | { type: 'removeItem'; name: string }
  | { type: 'addToCart'; name: string; source: CartItem['source']; note?: string }
  | { type: 'toggleCartDone'; id: string }
  | { type: 'removeFromCart'; id: string }
  | { type: 'finishShopping' }
  | { type: 'reset'; state: KitchenState }

const uid = () => Math.random().toString(36).slice(2, 10)

function upsertCart(cart: CartItem[], name: string, source: CartItem['source'], note?: string): CartItem[] {
  if (cart.some((c) => c.name === name && !c.done)) return cart
  return [...cart, { id: uid(), name, source, note, done: false }]
}

export function kitchenReducer(state: KitchenState, action: KitchenAction): KitchenState {
  switch (action.type) {
    case 'addItems': {
      const now = Date.now()
      const fridge = [...state.fridge]
      for (const it of action.items) {
        const existing = fridge.findIndex((f) => f.name === it.name)
        if (existing >= 0) {
          fridge[existing] = { ...fridge[existing], level: 5, updatedAt: now }
        } else {
          fridge.push({ id: uid(), ...it, level: 5, updatedAt: now })
        }
      }
      return { ...state, fridge }
    }

    case 'setLevel': {
      const fridge = state.fridge.map((f) =>
        f.name === action.name ? { ...f, level: action.level, updatedAt: Date.now() } : f,
      )
      // 핵심 규칙: 다 떨어지면(0) 장바구니에 자동으로 담는다
      const cart = action.level === 0 ? upsertCart(state.cart, action.name, 'auto') : state.cart
      return { fridge, cart }
    }

    case 'removeItem':
      return { ...state, fridge: state.fridge.filter((f) => f.name !== action.name) }

    case 'addToCart':
      return { ...state, cart: upsertCart(state.cart, action.name, action.source, action.note) }

    case 'toggleCartDone':
      return {
        ...state,
        cart: state.cart.map((c) => (c.id === action.id ? { ...c, done: !c.done } : c)),
      }

    case 'removeFromCart':
      return { ...state, cart: state.cart.filter((c) => c.id !== action.id) }

    case 'finishShopping': {
      // 산 재료(체크한 것)는 냉장고에 '넉넉'으로 채우고 장바구니에서 뺀다
      const bought = state.cart.filter((c) => c.done)
      const items: CatalogItem[] = bought.map(
        (c) =>
          state.fridge.find((f) => f.name === c.name) ??
          findCatalog(c.name) ?? { name: c.name, category: 'veg', place: 'main' },
      )
      const next = kitchenReducer(state, { type: 'addItems', items })
      return { ...next, cart: state.cart.filter((c) => !c.done) }
    }

    case 'reset':
      return action.state
  }
}

export const EMPTY_KITCHEN: KitchenState = { fridge: [], cart: [] }
