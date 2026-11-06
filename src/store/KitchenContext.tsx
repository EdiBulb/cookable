import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { EMPTY_KITCHEN, kitchenReducer, type KitchenAction, type KitchenState } from './kitchen'

const STORAGE_KEY = 'cookable:kitchen:v1'

function load(): KitchenState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_KITCHEN
    const parsed = JSON.parse(raw) as KitchenState
    if (!Array.isArray(parsed.fridge) || !Array.isArray(parsed.cart)) return EMPTY_KITCHEN
    return parsed
  } catch {
    return EMPTY_KITCHEN
  }
}

interface KitchenContextValue {
  state: KitchenState
  dispatch: Dispatch<KitchenAction>
}

const KitchenContext = createContext<KitchenContextValue | null>(null)

export function KitchenProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kitchenReducer, undefined, load)

  // 상태가 바뀔 때마다 폰(브라우저)에 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 공간이 없거나 막힌 환경이면 메모리에서만 동작
    }
  }, [state])

  return <KitchenContext.Provider value={{ state, dispatch }}>{children}</KitchenContext.Provider>
}

export function useKitchen(): KitchenContextValue {
  const ctx = useContext(KitchenContext)
  if (!ctx) throw new Error('useKitchen은 KitchenProvider 안에서만 쓸 수 있어요')
  return ctx
}
