import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useKitchen } from '../store/KitchenContext'
import { EMPTY_KITCHEN } from '../store/kitchen'
import { RECIPES } from '../data/recipes'
import { CATALOG } from '../data/catalog'
import { BottomSheet } from '../components/BottomSheet'
import { BackIcon, ChevronIcon } from '../components/icons'
import { getInstallState, promptInstall, subscribeInstall, type InstallState } from '../lib/install'
import { isIntroOff, setIntroOff } from '../components/Splash'
import { track } from '../lib/analytics'

const FEEDBACK_EMAIL = 'hello@abracadelulu.com'

export function SettingsScreen() {
  const { state, dispatch } = useKitchen()
  const navigate = useNavigate()
  const [install, setInstall] = useState<InstallState>(() => getInstallState())
  const [guide, setGuide] = useState<'ios' | 'manual' | null>(null)
  const [introOff, setIntro] = useState(() => isIntroOff())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => subscribeInstall(() => setInstall(getInstallState())), [])

  const cartCount = state.cart.filter((c) => !c.done).length

  const onInstall = async () => {
    track('install_click', { state: install })
    if (install === 'prompt') {
      const ok = await promptInstall()
      track('install_result', { accepted: ok })
      setInstall(getInstallState())
    } else if (install === 'ios' || install === 'manual') {
      setGuide(install)
    }
  }

  const toggleIntro = () => {
    const next = !introOff
    setIntroOff(next)
    setIntro(next)
    track('intro_toggle', { off: next })
  }

  const reset = () => {
    track('data_reset', { fridge_count: state.fridge.length })
    dispatch({ type: 'reset', state: EMPTY_KITCHEN })
    setConfirmReset(false)
    navigate('/')
  }

  return (
    <main className="screen screen--plain">
      <header className="header-row">
        <Link to="/cart" className="icon-btn icon-btn--ghost" aria-label="장바구니로 돌아가기">
          <BackIcon />
        </Link>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          설정
        </h1>
      </header>

      <section className="settings-hero">
        <p className="settings-hero-label">내 냉장고</p>
        <p className="settings-hero-value">
          재료 {state.fridge.length}개 · 장바구니 {cartCount}개
        </p>
        <p className="settings-hero-note">이 폰의 이 브라우저에만 저장돼요</p>
      </section>

      <section className="card settings-install">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18h2" />
        </svg>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>앱으로 설치하기</span>
          <span className="row-sub">
            {install === 'installed' ? '이미 설치해서 쓰고 있어요' : '홈 화면에서 바로 열리고, 데이터도 더 안전하게 남아요'}
          </span>
        </span>
        {install !== 'installed' && (
          <button type="button" className="btn btn--outline" onClick={onInstall}>
            설치
          </button>
        )}
      </section>

      <section className="card">
        <a
          className="row settings-row"
          href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Cookable 의견')}`}
          onClick={() => track('feedback_click')}
        >
          <span className="row-main">
            의견 보내기
            <span className="row-sub">{FEEDBACK_EMAIL}</span>
          </span>
          <ChevronIcon style={{ color: 'var(--muted)' }} />
        </a>
        <button type="button" className="row settings-row" role="switch" aria-checked={!introOff} onClick={toggleIntro}>
          <span className="row-main">
            시작할 때 문 열리는 인트로
            <span className="row-sub">{introOff ? '꺼짐' : '켜짐'}</span>
          </span>
          <span className="switch" data-on={!introOff} aria-hidden="true">
            <span />
          </span>
        </button>
        <div className="row settings-row" style={{ cursor: 'default' }}>
          <span className="row-main">
            앱 정보
            <span className="row-sub">
              레시피 {RECIPES.length}개 · 재료 목록 {CATALOG.length}개 ·{' '}
              <a href="https://abracadelulu.com" target="_blank" rel="noreferrer">
                Abracadelulu
              </a>
            </span>
          </span>
        </div>
        <button type="button" className="row settings-row" onClick={() => setConfirmReset(true)}>
          <span className="row-main" style={{ color: '#b42318' }}>
            냉장고 비우고 처음부터
          </span>
        </button>
      </section>

      {guide && (
        <BottomSheet label="앱 설치 방법" onClose={() => setGuide(null)}>
          <h2 style={{ fontSize: 20 }}>홈 화면에 추가하기</h2>
          {guide === 'ios' ? (
            <ol className="guide-steps">
              <li>
                화면 아래(아이패드는 위)의 <b>공유 버튼</b>을 눌러요. 네모에 위쪽 화살표가 있는 아이콘이에요.
              </li>
              <li>
                목록을 내려서 <b>홈 화면에 추가</b>를 눌러요.
              </li>
              <li>
                오른쪽 위 <b>추가</b>를 누르면 홈 화면에 Cookable 아이콘이 생겨요.
              </li>
            </ol>
          ) : (
            <ol className="guide-steps">
              <li>
                브라우저 오른쪽 위(또는 아래)의 <b>메뉴 ⋮</b>를 눌러요.
              </li>
              <li>
                <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러요.
              </li>
              <li>안 보이면 크롬이나 사파리로 이 페이지를 열어서 다시 해 보세요.</li>
            </ol>
          )}
          {guide === 'ios' && (
            <p className="subtitle" style={{ margin: 0 }}>
              아이폰은 홈 화면 앱과 사파리의 저장 공간이 따로일 수 있어요. 설치한 뒤에는 앱에서만 쓰는 걸 추천해요.
            </p>
          )}
          <button type="button" className="btn" onClick={() => setGuide(null)}>
            확인
          </button>
        </BottomSheet>
      )}

      {confirmReset && (
        <BottomSheet label="냉장고 비우기 확인" onClose={() => setConfirmReset(false)}>
          <h2 style={{ fontSize: 20 }}>냉장고를 비울까요?</h2>
          <p className="subtitle" style={{ margin: 0 }}>
            재료 {state.fridge.length}개와 장바구니 {state.cart.length}개가 모두 지워져요. 되돌릴 수 없어요.
          </p>
          <button type="button" className="btn" style={{ background: '#b42318' }} onClick={reset}>
            비우기
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'transparent', color: 'var(--muted)', height: 44, fontSize: 15 }}
            onClick={() => setConfirmReset(false)}
          >
            취소
          </button>
        </BottomSheet>
      )}
    </main>
  )
}
