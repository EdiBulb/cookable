import { useSyncExternalStore } from 'react'
import { DEMO_FRESH, IS_DEMO } from '../lib/demo'
import { bump, type BuyFreq } from '../lib/cartInput'

/** 자주 사는 재료 기록 (장바구니 직접 추가·장보기 끝낼 때 산 것) */
const KEY = IS_DEMO ? 'cookable:buyfreq:demo' : 'cookable:buyfreq:v1'
const listeners = new Set<() => void>()

function demoFreq(): BuyFreq {
  const now = Date.now()
  return {
    계란: { n: 9, at: now - 2 * 864e5 },
    우유: { n: 7, at: now - 3 * 864e5 },
    대파: { n: 6, at: now - 5 * 864e5 },
    두부: { n: 5, at: now - 864e5 },
    양파: { n: 4, at: now - 6 * 864e5 },
    라면: { n: 3, at: now - 9 * 864e5 },
    바나나: { n: 3, at: now - 4 * 864e5 },
    휴지: { n: 2, at: now - 12 * 864e5 },
  }
}

function read(): BuyFreq {
  try {
    const raw = localStorage.getItem(KEY)
    if (IS_DEMO && (DEMO_FRESH || !raw)) return demoFreq()
    const v = raw ? (JSON.parse(raw) as BuyFreq) : {}
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

let freq: BuyFreq = read()

export function recordBuys(names: string[]) {
  if (names.length === 0) return
  freq = bump(freq, names)
  try {
    localStorage.setItem(KEY, JSON.stringify(freq))
  } catch {
    // 저장이 막힌 환경이면 메모리에서만
  }
  listeners.forEach((l) => l())
}

export function useBuyFreq(): BuyFreq {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => freq,
    () => freq,
  )
}
