import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import type { CartItem } from '../types'
import { useKitchen } from '../store/KitchenContext'
import { CheckIcon, CloseIcon, PlusIcon } from '../components/icons'

const SECTION_TITLE: Record<CartItem['source'], string> = {
  auto: '다 떨어져서 자동으로 담겼어요',
  recipe: '레시피에서 담았어요',
  manual: '직접 추가했어요',
}

export function CartScreen() {
  const { state, dispatch } = useKitchen()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')

  const addManual = (e: FormEvent) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    dispatch({ type: 'addToCart', name, source: 'manual' })
    track('cart_add', { source: 'manual' })
    setDraft('')
  }

  const inCart = new Set(state.cart.map((c) => c.name))
  const soon = state.fridge.filter((f) => f.level === 1 && !inCart.has(f.name))
  const bought = state.cart.filter((c) => c.done).length

  const finish = () => {
    track('shopping_finished', { count: bought })
    dispatch({ type: 'finishShopping' })
    navigate('/kitchen')
  }

  return (
    <main className="screen" style={{ paddingBottom: 190 }}>
      <header>
        <span className="eyebrow">Cookable</span>
        <h1 className="title">장바구니</h1>
        <p className="subtitle">이번 장보기 목록 · 산 건 체크해 주세요</p>
      </header>

      <form onSubmit={addManual} className="search" style={{ paddingRight: 6 }}>
        <label htmlFor="cart-add" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          장바구니에 직접 추가
        </label>
        <input
          id="cart-add"
          placeholder="직접 추가 (예: 휴지, 두유)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          enterKeyHint="done"
        />
        <button
          type="submit"
          aria-label="추가"
          disabled={!draft.trim()}
          style={{ width: 40, height: 40, flex: 'none', border: 0, borderRadius: 10, background: draft.trim() ? 'var(--brand)' : 'var(--line)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <PlusIcon />
        </button>
      </form>

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

      {(['auto', 'recipe', 'manual'] as const).map((source) => {
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
