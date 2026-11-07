import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CatalogItem, Category, Place } from '../types'
import { CATALOG, CATEGORIES, CATEGORY_LABEL, PLACE_LABEL, STARTER_PACK, findCatalog } from '../data/catalog'
import { useKitchen } from '../store/KitchenContext'
import { track } from '../lib/analytics'
import { BackIcon, CheckIcon, PlusIcon, SearchIcon } from '../components/icons'

const PLACES = Object.keys(PLACE_LABEL) as Place[]

export function AddIngredientsScreen() {
  const { state, dispatch } = useKitchen()
  const navigate = useNavigate()
  const [cat, setCat] = useState<Category | 'all'>('veg')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, CatalogItem>>({})
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState<{ name: string; place: Place; category: Category }>({
    name: '',
    place: 'pantry',
    category: 'sauce',
  })

  const owned = new Set(state.fridge.filter((f) => f.level > 0).map((f) => f.name))
  const q = query.trim()
  const items = q
    ? CATALOG.filter((c) => c.name.includes(q))
    : cat === 'all'
      ? CATALOG
      : CATALOG.filter((c) => c.category === cat)

  const toggle = (item: CatalogItem) =>
    setSelected((prev) => {
      const next = { ...prev }
      if (next[item.name]) delete next[item.name]
      else next[item.name] = item
      return next
    })

  const starterDone = STARTER_PACK.every((n) => selected[n] || owned.has(n))
  const addStarter = () =>
    setSelected((prev) => {
      const next = { ...prev }
      for (const name of STARTER_PACK) {
        const item = findCatalog(name)
        if (item && !owned.has(name)) next[name] = item
      }
      return next
    })

  const addCustom = () => {
    const name = custom.name.trim()
    if (!name) return
    setSelected((prev) => ({ ...prev, [name]: { name, place: custom.place, category: custom.category } }))
    setCustom((c) => ({ ...c, name: '' }))
    setCustomOpen(false)
  }

  const count = Object.keys(selected).length
  const submit = () => {
    if (count === 0) return
    const items = Object.values(selected)
    track('ingredients_added', {
      count: items.length,
      custom: items.filter((i) => !CATALOG.some((c) => c.name === i.name)).length,
      starter_pack: STARTER_PACK.every((n) => !!selected[n]),
      fridge_before: state.fridge.length,
    })
    dispatch({ type: 'addItems', items })
    // 재료를 넣으면 바로 만들 수 있는 요리를 보여준다
    navigate('/')
  }

  return (
    <main className="screen screen--plain">
      <header className="header-row">
        <Link to="/kitchen" className="icon-btn icon-btn--ghost" aria-label="내 주방으로 돌아가기">
          <BackIcon />
        </Link>
        <div>
          <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
            식재료 넣기
          </h1>
          <p className="subtitle" style={{ marginTop: 2 }}>
            지금 있는 재료를 눌러서 냉장고에 담아요
          </p>
        </div>
      </header>

      <label className="search">
        <SearchIcon style={{ color: 'var(--muted)', flex: 'none' }} />
        <input
          type="search"
          aria-label="재료 이름으로 찾기"
          placeholder="재료 이름으로 찾기"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!q && (
        <section className="starter">
          <div>
            <h2>자취 필수템 한 번에 담기</h2>
            <p style={{ color: '#d4ebdd', marginTop: 4 }}>처음이라면 기본부터 체크하고 시작해요</p>
          </div>
          <p>{STARTER_PACK.join(' · ')}</p>
          <button type="button" onClick={addStarter} disabled={starterDone}>
            {starterDone ? '모두 담았어요' : `${STARTER_PACK.length}개 모두 담기`}
          </button>
        </section>
      )}

      {!q && (
        <div className="pills" role="group" aria-label="카테고리">
          {(['all', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className="pill" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c === 'all' ? '전체' : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <div className="tiles">
        {items.map((item) => {
          const on = !!selected[item.name]
          return (
            <button key={item.name} type="button" className="tile" aria-pressed={on} onClick={() => toggle(item)}>
              {item.name}
              {on && (
                <span className="tile-check" aria-hidden="true">
                  <CheckIcon size={12} style={{ color: '#fff' }} />
                </span>
              )}
              {!on && owned.has(item.name) && <span className="tile-owned">냉장고에 있음</span>}
            </button>
          )
        })}
      </div>
      {q && items.length === 0 && <p className="subtitle">"{q}"은(는) 목록에 없어요. 아래에서 직접 추가해 주세요.</p>}

      {!customOpen ? (
        <button
          type="button"
          className="dashed-btn"
          onClick={() => {
            setCustom((c) => ({ ...c, name: q }))
            setCustomOpen(true)
          }}
        >
          <PlusIcon style={{ color: 'var(--brand)' }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>찾는 재료가 없나요?</span>
            <span className="row-sub">이름을 직접 입력해서 추가해요</span>
          </span>
        </button>
      ) : (
        <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="custom-name">재료 이름</label>
            <input
              id="custom-name"
              placeholder="예: 스리라차 소스"
              value={custom.name}
              onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <span className="field-label">어디에 둘까요?</span>
            <div className="chips">
              {PLACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="pill"
                  aria-pressed={custom.place === p}
                  onClick={() => setCustom((c) => ({ ...c, place: p }))}
                >
                  {PLACE_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">카테고리</span>
            <div className="chips">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="pill"
                  aria-pressed={custom.category === c}
                  onClick={() => setCustom((s) => ({ ...s, category: c }))}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn" onClick={addCustom} disabled={!custom.name.trim()} style={{ height: 48 }}>
            목록에 추가
          </button>
        </section>
      )}

      <div className="bottom-bar">
        <button type="button" className="btn" onClick={submit} disabled={count === 0}>
          {count > 0 ? `${count}개 냉장고에 넣기` : '재료를 골라 주세요'}
        </button>
      </div>
    </main>
  )
}
