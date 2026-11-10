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
  /** 내 주방 편집: 여러 재료를 한 번에 빼기 (장바구니에 담지 않음) */
  | { type: 'removeItems'; names: string[] }
  /** 내 주방 편집: 여러 재료를 한 번에 "다 떨어짐" → 장바구니로 */
  | { type: 'emptyItems'; names: string[] }
  | { type: 'updateItem'; name: string; changes: Partial<Pick<FridgeItem, 'place' | 'category'>> }
  /** 언제까지 먹을지 직접 정하기 (0시 타임스탬프). null = 자동 계산으로 되돌리기 */
  | { type: 'setUseBy'; name: string; useBy: number | null }
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
          // 다시 샀으면 날짜도 새로 시작
          const { useBy: _old, ...rest } = fridge[existing]
          void _old
          fridge[existing] = { ...rest, level: 5, updatedAt: now, addedAt: now }
        } else {
          fridge.push({ id: uid(), name: it.name, category: it.category, place: it.place, level: 5, updatedAt: now, addedAt: now })
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

    case 'updateItem':
      return {
        ...state,
        fridge: state.fridge.map((f) =>
          f.name === action.name ? { ...f, ...action.changes, updatedAt: Date.now() } : f,
        ),
      }

    case 'setUseBy':
      return {
        ...state,
        fridge: state.fridge.map((f) => {
          if (f.name !== action.name) return f
          if (action.useBy === null) {
            const { useBy: _old, ...rest } = f
            void _old
            return rest
          }
          return { ...f, useBy: action.useBy }
        }),
      }

    case 'removeItems': {
      const names = new Set(action.names)
      return { ...state, fridge: state.fridge.filter((f) => !names.has(f.name)) }
    }

    case 'emptyItems':
      return action.names.reduce(
        (s, name) => kitchenReducer(s, { type: 'setLevel', name, level: 0 }),
        state,
      )

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
      // 산 재료(체크한 것)는 냉장고에 '넉넉'으로 채우고 장바구니에서 뺀다.
      // 냉장고에도 재료 목록에도 없는 것(휴지 같은 생활용품)은 장바구니에서만 지운다.
      const bought = state.cart.filter((c) => c.done)
      const items: CatalogItem[] = bought
        .map((c) => state.fridge.find((f) => f.name === c.name) ?? findCatalog(c.name))
        .filter((x): x is CatalogItem => x !== undefined)
      const next = kitchenReducer(state, { type: 'addItems', items })
      return { ...next, cart: state.cart.filter((c) => !c.done) }
    }

    case 'reset':
      return action.state
  }
}

export const EMPTY_KITCHEN: KitchenState = { fridge: [], cart: [] }
