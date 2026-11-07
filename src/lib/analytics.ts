import type { PostHog } from 'posthog-js'

/**
 * PostHog 행동 분석.
 * - Abracadelulu 앱들이 한 PostHog 프로젝트를 같이 쓰고, 모든 이벤트에 app: 'cookable'을 붙여 구분한다.
 * - 키(phc_...)는 브라우저에 공개되는 쓰기 전용 키라 코드에 있어도 괜찮다.
 * - 냉장고에 넣은 재료 이름 같은 개인 기록은 보내지 않는다. 검색어와 레시피 이름은 보낸다.
 * - 개발자 본인 기기 제외: 주소 끝에 ?me=1 을 붙여 한 번 열면 이 브라우저는 계속 제외 (?me=0 이면 다시 포함).
 */
const POSTHOG_KEY: string = import.meta.env.VITE_POSTHOG_KEY || 'phc_wJsc42gGxSkirpZbgFVrW3faxaHiNnzEHcqZyADzzdv5'
const POSTHOG_HOST: string = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const OPT_KEY = 'cookable:optout'

function optedOut(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('me')
    if (q === '1') localStorage.setItem(OPT_KEY, '1')
    if (q === '0') localStorage.removeItem(OPT_KEY)
    return localStorage.getItem(OPT_KEY) === '1'
  } catch {
    return false
  }
}

let ph: PostHog | null = null
let out = true
const queue: [string, Record<string, unknown> | undefined][] = []

export function initAnalytics(): void {
  // 테스트·로컬 개발 중에는 기록하지 않음
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') return
  out = optedOut()
  if (out) return
  // 첫 화면을 빨리 띄우려고, PostHog는 페이지가 뜬 뒤에 따로 불러옴
  const load = () =>
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: false, // 클릭 하나하나 대신 의미 있는 행동만 기록
          capture_pageview: false, // 화면 이동은 screen_view로 직접 기록 (해시 라우팅)
          capture_pageleave: true,
          disable_session_recording: true,
          persistence: 'localStorage',
        })
        posthog.register({ app: 'cookable' })
        ph = posthog
        for (const [e, p] of queue.splice(0)) ph.capture(e, p)
      })
      .catch(() => {
        /* 분석 실패가 앱을 막으면 안 됨 */
      })
  if (document.readyState === 'complete') setTimeout(load, 1500)
  else addEventListener('load', () => setTimeout(load, 1500), { once: true })
}

/** 행동 기록. 분석이 꺼져 있거나 차단돼 있어도 아무 일도 일어나지 않는다 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (out) return
  try {
    if (ph) ph.capture(event, props)
    else if (queue.length < 50) queue.push([event, props])
  } catch {
    /* 무시 */
  }
}
