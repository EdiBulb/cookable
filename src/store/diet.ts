import { useSyncExternalStore } from 'react'
import { EMPTY_DIET, type DietProfile } from '../lib/diet'

/** 내 식단 설정. 냉장고와 따로 이 기기에만 저장한다 (건강 정보라 서버·분석으로 보내지 않음) */
const KEY = 'cookable:diet:v1'
const listeners = new Set<() => void>()

function read(): DietProfile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DIET
    const p = JSON.parse(raw) as Partial<DietProfile>
    return {
      style: p.style ?? 'all',
      allergies: Array.isArray(p.allergies) ? p.allergies : [],
      dislikes: Array.isArray(p.dislikes) ? p.dislikes : [],
    }
  } catch {
    return EMPTY_DIET
  }
}

let current = read()

export function getDiet(): DietProfile {
  return current
}

export function setDiet(next: DietProfile): void {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막힌 환경이면 메모리에서만
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useDiet(): DietProfile {
  return useSyncExternalStore(subscribe, getDiet, getDiet)
}
