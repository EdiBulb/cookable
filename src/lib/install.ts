/**
 * 앱 설치(PWA) 도우미.
 * - 안드로이드·데스크톱 크롬: 브라우저가 주는 설치 창(beforeinstallprompt)을 저장해 뒀다가 버튼을 누르면 띄운다.
 * - 아이폰·아이패드: 설치 창을 띄울 수 없어서 "공유 → 홈 화면에 추가" 안내를 보여준다.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export function initInstall(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // 처음부터 설치를 권하지 않는다. 설정에서만.
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* 설치가 안 될 뿐 앱은 그대로 동작 */
      })
    })
  }
}

export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export type InstallState = 'installed' | 'prompt' | 'ios' | 'manual'

export function getInstallState(): InstallState {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) return 'installed'
  if (deferred) return 'prompt'
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  return ios ? 'ios' : 'manual'
}

/** 설치 창 띄우기. 설치했으면 true */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const e = deferred
  deferred = null
  await e.prompt()
  const { outcome } = await e.userChoice
  notify()
  return outcome === 'accepted'
}
