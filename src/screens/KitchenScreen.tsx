import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, FridgeItem, Level, Place } from '../types'
import { CATEGORIES, CATEGORY_LABEL, FRIDGE_PLACES, PLACE_LABEL } from '../data/catalog'
import { useKitchen } from '../store/KitchenContext'
import { track } from '../lib/analytics'
import { BottomSheet } from '../components/BottomSheet'
import { LEVEL_LABEL, LevelBars, LevelPicker, levelTextColor } from '../components/level'
import { CartIcon, ChevronIcon, PlusIcon } from '../components/icons'
import { DdayBadge, UseByEditor } from '../components/expiry'
import { dayLabel, daysLeft, urgencyOf, urgentItems } from '../lib/expiry'

const PLACES: Place[] = [...FRIDGE_PLACES, 'pantry']

function ItemChip({ item, onOpen }: { item: FridgeItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="chip"
      data-level={item.level}
      aria-label={`${item.name}, 남은 양 ${LEVEL_LABEL[item.level]}`}
      onClick={onOpen}
    >
      <span>{item.name}</span>
      <DdayBadge item={item} onlyUrgent />
      <LevelBars level={item.level} />
    </button>
  )
}

export function KitchenScreen() {
  const { state, dispatch } = useKitchen()
  const [view, setView] = useState<'fridge' | 'list'>('fridge')
  const [openName, setOpenName] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const fridge = state.fridge
  const openItem = fridge.find((f) => f.name === openName) ?? null
  const lowCount = fridge.filter((f) => f.level <= 1).length
  const byPlace = (place: FridgeItem['place']) => fridge.filter((f) => f.place === place)
  const pantry = byPlace('pantry')
  const urgent = urgentItems(fridge)
  // 전체 보기에서는 급한 재료가 위로 (날짜를 세지 않는 재료는 맨 아래)
  const byUrgency = (a: FridgeItem, b: FridgeItem) =>
    (daysLeft(a) ?? Infinity) - (daysLeft(b) ?? Infinity)

  const setLevel = (level: Level) => {
    if (!openItem) return
    track('level_changed', { from: openItem.level, to: level, where: 'kitchen' })
    dispatch({ type: 'setLevel', name: openItem.name, level })
  }
  const update = (changes: { place?: Place; category?: Category }) => {
    if (!openItem) return
    track('ingredient_edited', { field: changes.place ? 'place' : 'category' })
    dispatch({ type: 'updateItem', name: openItem.name, changes })
  }
  const open = (name: string) => {
    setOpenName(name)
    setEditing(false)
  }

  return (
    <main className="screen">
      <header>
        <span className="eyebrow">Cookable</span>
        <h1 className="title">내 주방</h1>
      </header>

      {lowCount > 0 && (
        <Link to="/cart" className="alert">
          <CartIcon size={22} style={{ color: '#b4531a', flex: 'none' }} />
          <span style={{ flex: 1 }}>
            재료 <b>{lowCount}개</b>가 떨어졌거나 거의 없어요. 장바구니를 확인해 보세요.
          </span>
          <ChevronIcon style={{ color: 'var(--warn-text)', flex: 'none' }} />
        </Link>
      )}

      {urgent.length > 0 && (
        <section className="eat-first" aria-label="먼저 먹어야 할 재료">
          <p className="eat-first-title">먼저 먹어야 해요</p>
          <div className="chips">
            {urgent.map((u) => (
              <button key={u.name} type="button" className="eat-chip" onClick={() => open(u.name)}>
                {u.name}
                <span className="dday" data-u={urgencyOf(u.days)}>
                  {dayLabel(u.days)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {fridge.length === 0 ? (
        <div className="empty-state">
          <p>
            냉장고가 비어 있어요.
            <br />
            지금 있는 재료를 넣으면 만들 수 있는 요리를 찾아 드려요.
          </p>
          <Link to="/add" className="btn">
            재료 넣으러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="segmented">
            <button type="button" aria-pressed={view === 'fridge'} onClick={() => setView('fridge')}>
              냉장고
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => { setView('list'); track('kitchen_list_view') }}>
              전체 보기
            </button>
          </div>

          {view === 'fridge' ? (
            <>
              <section className="fridge" aria-label="냉장고">
                {FRIDGE_PLACES.map((place) => {
                  const items = byPlace(place)
                  return (
                    <div key={place} className={`shelf shelf--${place}`}>
                      <div className="shelf-head">
                        <span>{PLACE_LABEL[place]}</span>
                        <span>{items.length}개</span>
                      </div>
                      {items.length === 0 ? (
                        <span className="shelf-empty">비어 있어요</span>
                      ) : (
                        <div className="chips">
                          {items.map((it) => (
                            <ItemChip key={it.id} item={it} onOpen={() => open(it.name)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>

              <section className="pantry" aria-label="찬장">
                <div className="shelf-head">
                  <span>찬장 · 양념과 건재료</span>
                  <span>{pantry.length}개</span>
                </div>
                {pantry.length === 0 ? (
                  <span className="shelf-empty">비어 있어요</span>
                ) : (
                  <div className="chips">
                    {pantry.map((it) => (
                      <ItemChip key={it.id} item={it} onOpen={() => open(it.name)} />
                    ))}
                  </div>
                )}
              </section>
              <p className="subtitle" style={{ textAlign: 'center', fontSize: 12 }}>
                재료를 누르면 남은 양과 먹을 날짜를 바로 바꿀 수 있어요
              </p>
            </>
          ) : (
            CATEGORIES.map((cat) => {
              const items = fridge.filter((f) => f.category === cat).sort(byUrgency)
              if (items.length === 0) return null
              return (
                <section key={cat} className="card">
                  <h2 className="card-head">
                    <span>{CATEGORY_LABEL[cat]}</span>
                    <span>{items.length}개</span>
                  </h2>
                  {items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="row"
                      aria-label={`${it.name}, 남은 양 ${LEVEL_LABEL[it.level]}`}
                      onClick={() => open(it.name)}
                    >
                      <span className="row-main">
                        {it.name}
                        <span className="row-sub">{PLACE_LABEL[it.place]}</span>
                      </span>
                      <DdayBadge item={it} />
                      <span className="tag" style={{ color: levelTextColor(it.level) }}>
                        {LEVEL_LABEL[it.level]}
                      </span>
                      <LevelBars level={it.level} />
                    </button>
                  ))}
                </section>
              )
            })
          )}
        </>
      )}

      <Link to="/add" className="fab">
        <PlusIcon />
        재료 추가
      </Link>

      {openItem && (
        <BottomSheet label="재료 상태" onClose={() => setOpenName(null)}>
          <div>
            <p className="subtitle" style={{ margin: 0 }}>
              남은 양 체크 · {PLACE_LABEL[openItem.place]}
            </p>
            <h2>{openItem.name}, 얼마나 남았어요?</h2>
          </div>
          <LevelPicker label="남은 양" value={openItem.level} onChange={setLevel} />
          {openItem.level === 0 && <p className="note-warn">다 떨어졌네요. 장바구니에 자동으로 담았어요.</p>}
          {openItem.level > 0 && (
            <UseByEditor
              item={openItem}
              onChange={(useBy) => {
                track('useby_changed', { auto: useBy === null })
                dispatch({ type: 'setUseBy', name: openItem.name, useBy })
              }}
            />
          )}

          <div className="edit-box">
            <button
              type="button"
              className="edit-toggle"
              aria-expanded={editing}
              onClick={() => setEditing((v) => !v)}
            >
              <span>
                {PLACE_LABEL[openItem.place]} · {CATEGORY_LABEL[openItem.category]}
              </span>
              <span className="edit-toggle-cta">{editing ? '닫기' : '칸·카테고리 바꾸기'}</span>
            </button>
            {editing && (
              <>
                <div className="field">
                  <span className="field-label">어디에 둘까요?</span>
                  <div className="chips">
                    {PLACES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="pill"
                        aria-pressed={openItem.place === p}
                        onClick={() => update({ place: p })}
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
                        aria-pressed={openItem.category === c}
                        onClick={() => update({ category: c })}
                      >
                        {CATEGORY_LABEL[c]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button type="button" className="btn" onClick={() => setOpenName(null)}>
            완료
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'transparent', color: 'var(--muted)', height: 44, fontSize: 14 }}
            onClick={() => {
              track('ingredient_removed')
              dispatch({ type: 'removeItem', name: openItem.name })
              setOpenName(null)
            }}
          >
            이제 안 사는 재료라 냉장고에서 빼기
          </button>
        </BottomSheet>
      )}
    </main>
  )
}
