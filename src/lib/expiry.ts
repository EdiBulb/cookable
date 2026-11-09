import type { FridgeItem } from '../types'
import { shelfDaysFor } from '../data/catalog'

const DAY = 24 * 60 * 60 * 1000

/** 그날 0시 (기기 시간대 기준) */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 오늘부터 n일 뒤 0시 */
export function daysFromToday(n: number, now = Date.now()): number {
  const d = new Date(startOfDay(now))
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** 언제까지 먹으면 되는지 (0시 타임스탬프). null = 날짜를 세지 않는 재료 */
export function eatByOf(item: FridgeItem): number | null {
  if (item.useBy != null) return item.useBy
  const shelf = shelfDaysFor(item.name, item.place)
  if (shelf == null) return null
  const d = new Date(startOfDay(item.addedAt ?? item.updatedAt))
  d.setDate(d.getDate() + shelf)
  return d.getTime()
}

/** 남은 날 수. 0 = 오늘까지, 음수 = 지남, null = 세지 않음 */
export function daysLeft(item: FridgeItem, now = Date.now()): number | null {
  const end = eatByOf(item)
  if (end == null) return null
  return Math.round((end - startOfDay(now)) / DAY)
}

export type Urgency = 'over' | 'soon' | 'near' | 'ok'

/** 지남 / 0~2일 / 3일 / 넉넉 */
export function urgencyOf(days: number): Urgency {
  if (days < 0) return 'over'
  if (days <= 2) return 'soon'
  if (days <= 3) return 'near'
  return 'ok'
}

export function dayLabel(days: number): string {
  if (days < 0) return `${-days}일 지남`
  if (days === 0) return '오늘까지'
  return `D-${days}`
}

/** 빠른 버튼에 쓸 "보기 좋은" 일 수 */
const NICE = [1, 2, 3, 5, 7, 10, 14, 21, 30, 60, 90]
const nice = (d: number) => NICE.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a))

/**
 * "언제까지 먹을까요?" 빠른 버튼. 재료마다 보관 일수가 달라서
 * 기본값을 가운데 두고 짧게 / 길게를 만든다. 0 = 오늘까지.
 */
export function quickOptions(shelfDays: number): number[] {
  const opts = [0, nice(shelfDays * 0.4), shelfDays, nice(shelfDays * 1.5)]
  return [...new Set(opts)].sort((a, b) => a - b)
}

export function optionLabel(days: number): string {
  if (days === 0) return '오늘까지'
  if (days % 30 === 0) return days === 30 ? '한 달' : `${days / 30}달`
  if (days % 7 === 0) return days === 7 ? '일주일' : `${days / 7}주`
  return `${days}일`
}

export interface UrgentItem {
  name: string
  days: number
}

/** 남아 있는 재료 중 withinDays일 안에 먹어야 하는 것 (급한 순). 지난 것도 포함 */
export function urgentItems(fridge: FridgeItem[], now = Date.now(), withinDays = 3): UrgentItem[] {
  return fridge
    .filter((f) => f.level > 0)
    .map((f) => ({ name: f.name, days: daysLeft(f, now) }))
    .filter((x): x is UrgentItem => x.days !== null && x.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}
