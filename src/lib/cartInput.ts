import { searchCatalog } from '../data/catalog'
import { normalize } from './recommend'

const squash = (s: string) => s.replace(/\s+/g, '')

/** 적은 이름이 재료 목록에 있으면 그 이름 (띄어쓰기·별칭 무시: "달걀" → "계란") */
export function catalogMatch(raw: string): string | undefined {
  const name = raw.trim()
  if (!name) return undefined
  return searchCatalog(name, 6, normalize).find((c) => squash(c.name) === squash(name) || c.name === normalize(name))?.name
}

export interface MultiToken {
  /** 사용자가 적은 그대로 */
  raw: string
  /** 담길 이름 (목록에 있으면 목록 이름, 없으면 적은 그대로) */
  name: string
  inCatalog: boolean
}

/** "양파, 대파, 두부" → 세 개. 쉼표가 없으면 빈 배열 (한 개는 평소 자동완성으로) */
export function parseMulti(draft: string): MultiToken[] {
  if (!/[,，、]/.test(draft)) return []
  const seen = new Set<string>()
  const out: MultiToken[] = []
  for (const part of draft.split(/[,，、]/)) {
    const raw = part.trim()
    if (!raw) continue
    const match = catalogMatch(raw)
    const name = match ?? raw
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ raw, name, inCatalog: Boolean(match) })
  }
  return out
}

/** 자주 산 기록: 이름 → 횟수와 마지막 시각 */
export type BuyFreq = Record<string, { n: number; at: number }>

export function bump(freq: BuyFreq, names: string[], now = Date.now()): BuyFreq {
  const next = { ...freq }
  for (const name of names) next[name] = { n: (next[name]?.n ?? 0) + 1, at: now }
  return next
}

/** 자주 산 순(같으면 최근 순), 이미 장바구니에 있는 건 빼고 */
export function topFrequent(freq: BuyFreq, exclude: Set<string>, limit = 8): string[] {
  return Object.entries(freq)
    .filter(([name]) => !exclude.has(name))
    .sort((a, b) => b[1].n - a[1].n || b[1].at - a[1].at)
    .slice(0, limit)
    .map(([name]) => name)
}

/** 기록이 없을 때 보여 줄 기본 장보기 재료 */
export const STARTER_BUYS = ['계란', '우유', '대파', '양파', '두부', '라면', '김', '식빵']
