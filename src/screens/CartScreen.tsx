import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import type { CartItem } from '../types'
import { useKitchen } from '../store/KitchenContext'
import { CheckIcon, CloseIcon, PlusIcon } from '../components/icons'
import { searchCatalog } from '../data/catalog'
import { normalize } from '../lib/recommend'
import { catalogMatch, parseMulti, STARTER_BUYS, topFrequent } from '../lib/cartInput'
import { recordBuys, useBuyFreq } from '../store/buyFreq'

const SECTION_TITLE: Record<CartItem['source'], string> = {
  auto: '다 떨어져서 자동으로 담겼어요',
  recipe: '레시피에서 담았어요',
  wish: '해볼 요리에서 가져왔어요',
  manual: '직접 추가했어요',
}

export function CartScreen() {
  const { state, dispatch } = useKitchen()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const noticeTimer = useRef<number | undefined>(undefined)
  const freq = useBuyFreq()

  // 재료 목록에 있는 재료면 그 이름으로 담아야, 장보기 끝낼 때 냉장고 제자리(칸·종류)로 들어간다
  const suggestions = searchCatalog(draft, 6, normalize)
  const multi = parseMulti(draft)
  const picked = multi.filter((t) => !unchecked.has(t.name) && !state.cart.some((c) => !c.done && c.name === t.name))

  const showNotice = (text: string) => {
    setNotice(text)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1800)
  }
  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  /** 담은 뒤에도 키패드가 내려가지 않게 입력칸에 커서를 돌려 둔다 */
  const keepTyping = () => inputRef.current?.focus({ preventScroll: true })
  /** 버튼을 눌러도 입력칸이 포커스를 잃지 않게 (포커스가 버튼으로 가면 폰이 키패드를 닫는다) */
  const holdFocus = (e: { preventDefault: () => void }) => e.preventDefault()

  const addNames = (names: string[], how: 'catalog' | 'typed' | 'multi' | 'chip') => {
    const cartNames = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
    const fresh = names.filter((n) => !cartNames.has(n))
    for (const name of fresh) dispatch({ type: 'addToCart', name, source: 'manual' })
    recordBuys(fresh)
    track('cart_add', { source: 'manual', how, count: fresh.length })
    if (fresh.length === 0) showNotice(names.length === 1 ? `${names[0]}은(는) 이미 담겨 있어요` : '이미 다 담겨 있어요')
    else if (fresh.length === 1) showNotice(`✓ ${fresh[0]} 담았어요`)
    else showNotice(`✓ ${fresh.length}개 담았어요`)
  }

  const add = (name: string, fromList: boolean) => {
    addNames([name], fromList ? 'catalog' : 'typed')
    setDraft('')
    keepTyping()
  }

  const addPicked = () => {
    if (picked.length === 0) return
    addNames(
      picked.map((t) => t.name),
      'multi',
    )
    setDraft('')
    setUnchecked(new Set())
    keepTyping()
  }

  const addManual = (e: FormEvent) => {
    e.preventDefault()
    if (multi.length > 0) return addPicked()
    const name = draft.trim()
    if (!name) return
    // 엔터를 누르면: 목록에 똑같은 이름(또는 별칭)이 있으면 그걸로
    const exact = catalogMatch(name)
    add(exact ?? name, Boolean(exact))
  }

  const toggleToken = (name: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
  const hasHistory = Object.keys(freq).length > 0
  const quick = hasHistory ? topFrequent(freq, inCart, 8) : STARTER_BUYS.filter((n) => !inCart.has(n))
  const soon = state.fridge.filter((f) => f.level === 1 && !inCart.has(f.name))
  const bought = state.cart.filter((c) => c.done).length

  const finish = () => {
    track('shopping_finished', { count: bought })
    recordBuys(state.cart.filter((c) => c.done && c.source !== 'manual').map((c) => c.name))
    dispatch({ type: 'finishShopping' })
    navigate('/kitchen')
  }

  return (
    <main className="screen" style={{ paddingBottom: 190 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span className="eyebrow">Cookable</span>
          <h1 className="title">장바구니</h1>
          <p className="subtitle">이번 장보기 목록 · 산 건 체크해 주세요</p>
        </div>
        <Link to="/settings" className="icon-btn" aria-label="설정">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 4.3a1.7 1.7 0 0 1 3.4 0 1.7 1.7 0 0 0 2.6 1.1 1.7 1.7 0 0 1 2.3 2.3 1.7 1.7 0 0 0 1.1 2.6 1.7 1.7 0 0 1 0 3.4 1.7 1.7 0 0 0-1.1 2.6 1.7 1.7 0 0 1-2.3 2.3 1.7 1.7 0 0 0-2.6 1.1 1.7 1.7 0 0 1-3.4 0 1.7 1.7 0 0 0-2.6-1.1 1.7 1.7 0 0 1-2.3-2.3 1.7 1.7 0 0 0-1.1-2.6 1.7 1.7 0 0 1 0-3.4 1.7 1.7 0 0 0 1.1-2.6 1.7 1.7 0 0 1 2.3-2.3 1.7 1.7 0 0 0 2.6-1.1z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
      </header>

      <form onSubmit={addManual} className="search" style={{ paddingRight: 6 }}>
        <label htmlFor="cart-add" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          장바구니에 직접 추가
        </label>
        <input
          id="cart-add"
          ref={inputRef}
          placeholder="재료나 물건 (여러 개는 쉼표로: 양파, 두부)"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          enterKeyHint="enter"
        />
        <button
          type="submit"
          aria-label="추가"
          disabled={multi.length > 0 ? picked.length === 0 : !draft.trim()}
          onPointerDown={holdFocus}
          onMouseDown={holdFocus}
          style={{ width: 40, height: 40, flex: 'none', border: 0, borderRadius: 10, background: draft.trim() ? 'var(--brand)' : 'var(--line)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <PlusIcon />
        </button>
      </form>

      <p className="cart-notice" role="status" aria-live="polite" data-show={Boolean(notice)}>
        {notice}
      </p>

      {multi.length > 0 ? (
        <div className="suggest" aria-label="쉼표로 나눈 재료">
          {multi.map((t) => {
            const already = inCart.has(t.name)
            const on = !already && !unchecked.has(t.name)
            return (
              <button
                key={t.name}
                type="button"
                role="checkbox"
                aria-checked={on}
                className="suggest-row multi-row"
                disabled={already}
                onPointerDown={holdFocus}
                onMouseDown={holdFocus}
                onClick={() => toggleToken(t.name)}
              >
                <span className="multi-check" data-on={on} aria-hidden="true">
                  {on && <CheckIcon />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {t.name}
                  {t.inCatalog && t.name !== t.raw && <span className="multi-from"> ({t.raw})</span>}
                </span>
                <span className="row-sub" data-muted={!t.inCatalog || already}>
                  {already ? '이미 담겼어요' : t.inCatalog ? '재료 목록' : '직접 입력'}
                </span>
              </button>
            )
          })}
          <button type="button" className="multi-add" disabled={picked.length === 0} onPointerDown={holdFocus} onMouseDown={holdFocus} onClick={addPicked}>
            {picked.length === 0 ? '담을 재료를 골라 주세요' : `${picked.length}개 담기`}
          </button>
        </div>
      ) : draft.trim() ? (
        <div className="suggest" role="listbox" aria-label="재료 목록에서 고르기">
          {suggestions.map((c) => {
            const already = inCart.has(c.name)
            return (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={false}
                className="suggest-row"
                disabled={already}
                onPointerDown={holdFocus}
                onMouseDown={holdFocus}
                onClick={() => add(c.name, true)}
              >
                <span>{c.name}</span>
                <span className="row-sub">{already ? '이미 담았어요' : '담기'}</span>
              </button>
            )
          })}
          {!suggestions.some((c) => c.name === draft.trim() || c.name === normalize(draft)) && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              className="suggest-row"
              onPointerDown={holdFocus}
              onMouseDown={holdFocus}
              onClick={() => add(draft.trim(), false)}
            >
              <span>"{draft.trim()}" 그대로 추가</span>
              <span className="row-sub">목록에 없는 물건</span>
            </button>
          )}
        </div>
      ) : (
        quick.length > 0 && (
          <div className="quick-buys">
            <span className="quick-label">{hasHistory ? '자주 사는 것' : '자주 사는 장보기'}</span>
            <div className="quick-chips">
              {quick.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="quick-chip"
                  onPointerDown={holdFocus}
                  onMouseDown={holdFocus}
                  onClick={() => {
                    const typing = document.activeElement === inputRef.current
                    addNames([name], 'chip')
                    if (typing) keepTyping()
                  }}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {state.cart.length === 0 && (
        <div className="empty-state">
          <p>
            장바구니가 비어 있어요.
            <br />
            재료 남은 양을 0으로 바꾸면 여기에 자동으로 담겨요.
            <br />
            위 칸에 직접 적어서 추가할 수도 있어요.
          </p>
        </div>
      )}

      {(['auto', 'recipe', 'wish', 'manual'] as const).map((source) => {
        const items = state.cart.filter((c) => c.source === source)
        if (items.length === 0) return null
        return (
          <section key={source} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>{SECTION_TITLE[source]}</h2>
            <div className="card">
              {items.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eef2f0' }}>
                  <button
                    type="button"
                    className="row"
                    style={{ borderBottom: 0 }}
                    aria-pressed={c.done}
                    onClick={() => dispatch({ type: 'toggleCartDone', id: c.id })}
                  >
                    <span className="check-box" aria-hidden="true">
                      {c.done && <CheckIcon style={{ color: '#fff' }} />}
                    </span>
                    <span className="row-main">
                      <span>{c.name}</span>
                      {c.note && <span className="row-sub">{c.note}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    aria-label={`${c.name} 장바구니에서 빼기`}
                    onClick={() => dispatch({ type: 'removeFromCart', id: c.id })}
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {soon.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>곧 떨어져요 · 같이 살까요?</h2>
            <p className="subtitle" style={{ fontSize: 12, marginTop: 2 }}>
              남은 양이 '거의 없음'인 재료예요
            </p>
          </div>
          <div className="chips">
            {soon.map((f) => (
              <button
                key={f.id}
                type="button"
                className="pill"
                style={{ borderStyle: 'dashed', borderColor: '#9aa8a1', height: 44 }}
                onClick={() => {
                  dispatch({ type: 'addToCart', name: f.name, source: 'manual', note: '곧 떨어지는 재료' })
                  track('cart_add', { source: 'soon' })
                }}
              >
                + {f.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.cart.length > 0 && (
        <div className="bottom-bar bottom-bar--above-tabs">
          <button type="button" className="btn" onClick={finish} disabled={bought === 0}>
            {bought > 0 ? `장보기 끝! 산 재료 ${bought}개 냉장고에 넣기` : '산 재료를 체크해 주세요'}
          </button>
        </div>
      )}
    </main>
  )
}
