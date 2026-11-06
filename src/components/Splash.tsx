import { useEffect, useState } from 'react'

const SEEN_KEY = 'cookable:splash-seen'

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

/**
 * 냉장고 문이 열리는 인트로.
 * 처음 실행할 때만 2초 버전(문구 포함), 그 뒤로는 0.9초 버전.
 */
export function Splash() {
  const [first] = useState(() => !hasSeen())
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // 저장이 안 되면 매번 짧은 버전으로 충분
    }
    const timer = window.setTimeout(() => setVisible(false), first ? 2200 : 950)
    return () => window.clearTimeout(timer)
  }, [first])

  if (!visible) return null

  return (
    <div className={first ? 'splash splash--first' : 'splash splash--quick'} aria-hidden="true">
      <div className="splash-inner">
        <div className="door door--l">
          <span>Cook</span>
        </div>
        <div className="door door--r">
          <span>able</span>
        </div>
      </div>
      {first && <p className="splash-tag">냉장고 재료로 오늘 뭐 해 먹지?</p>}
    </div>
  )
}
