import type { CartItem, FridgeItem, Level } from '../types'
import { findCatalog } from '../data/catalog'
import type { KitchenState } from '../store/kitchen'

/**
 * 체험 모드: 주소에 ?demo=1 을 붙여 열면 가짜 냉장고·가짜 사진으로 화면을 확인할 수 있다.
 * - 진짜 데이터와 다른 저장 칸을 써서 내 냉장고는 그대로
 * - 이 탭(세션)에서만 유지, ?demo=0 이나 배너의 "나가기"로 끝
 * - 분석(PostHog)은 기록하지 않음
 */
const SESSION_KEY = 'cookable:demo'

function detect(): { on: boolean; fresh: boolean } {
  try {
    const q = new URLSearchParams(location.search).get('demo')
    if (q === '0') sessionStorage.removeItem(SESSION_KEY)
    if (q === '1') {
      sessionStorage.setItem(SESSION_KEY, '1')
      return { on: true, fresh: true }
    }
    return { on: sessionStorage.getItem(SESSION_KEY) === '1', fresh: false }
  } catch {
    return { on: false, fresh: false }
  }
}

const state = detect()
export const IS_DEMO = state.on
/** ?demo=1 로 새로 들어왔으면 가짜 데이터를 처음 상태로 다시 채운다 */
export const DEMO_FRESH = state.fresh

export function exitDemo(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // 무시
  }
  location.href = `${location.pathname}#/`
}

const DAY = 24 * 60 * 60 * 1000

/** [이름, 남은 양, 며칠 전에 넣었는지] — D-day, 잔량, 장바구니가 골고루 보이게 */
const SAMPLE: [string, Level, number][] = [
  ['양상추', 3, 4], // D-1
  ['두부', 4, 3], // D-2
  ['숙주', 2, 3], // 지남
  ['우유', 2, 9], // 지남
  ['돼지고기', 5, 1], // D-2
  ['시금치', 3, 1], // D-3
  ['계란', 4, 5],
  ['양파', 5, 2],
  ['대파', 3, 4],
  ['마늘', 4, 6],
  ['감자', 4, 3],
  ['당근', 2, 8],
  ['애호박', 1, 2],
  ['김치', 5, 10],
  ['베이컨', 3, 2],
  ['햄', 2, 5],
  ['치즈', 3, 6],
  ['식빵', 2, 3],
  ['사과', 4, 2],
  ['바나나', 3, 2],
  ['냉동 만두', 4, 20],
  ['새우', 3, 15],
  ['쌀', 5, 30],
  ['간장', 4, 40],
  ['고추장', 3, 40],
  ['고춧가루', 4, 40],
  ['참기름', 3, 40],
  ['국간장', 2, 40],
  ['굴소스', 3, 40],
  ['마요네즈', 1, 40],
  ['식용유', 0, 40], // 다 떨어짐 → 장바구니
  ['설탕', 4, 40],
]

export function demoKitchen(now = Date.now()): KitchenState {
  const fridge: FridgeItem[] = []
  for (const [name, level, ago] of SAMPLE) {
    const c = findCatalog(name)
    if (!c) continue
    fridge.push({
      id: `demo-${name}`,
      name: c.name,
      category: c.category,
      place: c.place,
      level,
      updatedAt: now,
      addedAt: now - ago * DAY,
    })
  }
  const cart: CartItem[] = [
    { id: 'demo-cart-1', name: '식용유', source: 'auto', done: false },
    { id: 'demo-cart-2', name: '휴지', source: 'manual', done: false },
  ]
  return { fridge, cart }
}
