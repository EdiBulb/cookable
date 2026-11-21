import { Link } from 'react-router-dom'
import { resolveConflict, signInWithGoogle, signOut, useSync } from '../lib/sync'

function ago(at?: number): string {
  if (!at) return ''
  const s = Math.round((Date.now() - at) / 1000)
  if (s < 60) return '방금'
  if (s < 3600) return `${Math.floor(s / 60)}분 전`
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`
  return `${Math.floor(s / 86400)}일 전`
}

const GoogleMark = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
)

/** 설정 화면 맨 위: 로그인하면 냉장고·레시피 기록이 자동으로 백업된다 */
export function AccountCard() {
  const sync = useSync()
  if (sync.status === 'off') return null

  if (sync.status === 'signed-out' || (sync.status === 'error' && !sync.email)) {
    return (
      <section className="card account-card">
        <strong style={{ fontSize: 16 }}>폰을 바꿔도 냉장고가 그대로</strong>
        <p className="subtitle" style={{ margin: 0, fontSize: 14 }}>
          지금은 이 브라우저에만 저장돼요. 로그인하면 냉장고·장바구니·나만의 레시피·해먹은 요리가 자동으로 백업돼요.
        </p>
        <button type="button" className="btn btn--google" onClick={() => void signInWithGoogle()}>
          <GoogleMark />
          구글로 로그인
        </button>
        {sync.status === 'error' && <p className="account-error">로그인에 실패했어요. 잠시 뒤 다시 해 주세요.</p>}
        <Link to="/privacy" className="account-privacy">
          개인정보처리방침
        </Link>
      </section>
    )
  }

  if (sync.status === 'conflict') {
    return (
      <section className="card account-card">
        <strong style={{ fontSize: 16 }}>어느 데이터를 쓸까요?</strong>
        <p className="subtitle" style={{ margin: 0, fontSize: 14 }}>
          이 계정에 저장된 데이터({ago(sync.remoteAt)} 저장)와 이 기기의 데이터가 달라요. 고르지 않은 쪽은 사라져요.
        </p>
        <button type="button" className="btn" onClick={() => void resolveConflict('remote')}>
          저장된 데이터 불러오기
        </button>
        <button type="button" className="btn btn--outline" onClick={() => void resolveConflict('local')}>
          이 기기 데이터로 덮어쓰기
        </button>
      </section>
    )
  }

  const label =
    sync.status === 'loading'
      ? '불러오는 중…'
      : sync.status === 'saving'
        ? '저장하는 중…'
        : sync.status === 'error'
          ? '백업에 실패했어요 · 연결되면 다시 시도해요'
          : `자동 백업 중 · ${ago(sync.lastSavedAt)} 저장`

  return (
    <section className="card account-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <GoogleMark />
        <span className="row-main" style={{ flex: 1, minWidth: 0 }}>
          {sync.name ?? sync.email}
          <span className="row-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sync.name ? sync.email : ''}
          </span>
        </span>
      </div>
      <p className="account-status" data-error={sync.status === 'error'}>
        {label}
      </p>
      <button type="button" className="account-logout" onClick={() => void signOut()}>
        로그아웃 (이 기기 데이터는 남아요)
      </button>
    </section>
  )
}
