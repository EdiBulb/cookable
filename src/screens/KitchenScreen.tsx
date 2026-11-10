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

function ItemChip({
  item,
  onOpen,
  selected,
}: {
  item: FridgeItem
  onOpen: () => void
  /** 편집 중이면 true/false, 아니면 undefined */
  selected?: boolean
}) {
  const selecting = selected !== undefined
  return (
    <button
      type="button"
      className={`chip${selecting ? ' chip--select' : ''}`}
      data-level={item.level}
      aria-pressed={selecting ? selected : undefined}
      aria-label={`${item.name}, 남은 양 ${LEVEL_LABEL[item.level]}${selecting ? (selected ? ', 선택됨' : '') : ''}`}
      onClick={onOpen}
    >
      {selecting && <span className="select-dot" aria-hidden="true" />}
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
  // 편집 모드: 여러 재료를 골라 한 번에 빼거나 다 떨어짐 처리
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmRemove, setConfirmRemove] = useState(false)

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
    if (selecting) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
      return
    }
    setOpenName(name)
    setEditing(false)
  }

  const startSelecting = () => {
    setSelecting(true)
    setSelected(new Set())
    track('kitchen_edit_start', { fridge_count: fridge.length })
  }
  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }
  const allSelected = fridge.length > 0 && selected.size === fridge.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(fridge.map((f) => f.name)))
  const sel = (name: string) => (selecting ? selected.has(name) : undefined)

  const emptySelected = () => {
    const names = [...selected].filter((n) => (fridge.find((f) => f.name === n)?.level ?? 0) > 0)
    track('kitchen_bulk', { action: 'empty', count: names.length, all: allSelected })
    dispatch({ type: 'emptyItems', names })
    stopSelecting()
  }
  const removeSelected = () => {
    track('kitchen_bulk', { action: 'remove', count: selected.size, all: allSelected })
    dispatch({ type: 'removeItems', names: [...selected] })
    setConfirmRemove(false)
    stopSelecting()
  }

  return (
    <main className="screen">
      <header className="kitchen-head">
        <div>
          <span className="eyebrow">Cookable</span>
          <h1 className="title">내 주방</h1>
        </div>
        {fridge.length > 0 && (
          <button type="button" className="text-btn" onClick={selecting ? stopSelecting : startSelecting}>
            {selecting ? '완료' : '편집'}
          </button>
        )}
      </header>

      {selecting && (
        <div className="select-bar">
          <span>재료를 눌러서 고르세요 · {selected.size}개 선택</span>
          <button type="button" className="text-btn" onClick={toggleAll}>
            {allSelected ? '선택 해제' : '전체 선택'}
          </button>
        </div>
      )}

      {!selecting && lowCount > 0 && (
        <Link to="/cart" className="alert">
          <CartIcon size={22} style={{ color: '#b4531a', flex: 'none' }} />
          <span style={{ flex: 1 }}>
            재료 <b>{lowCount}개</b>가 떨어졌거나 거의 없어요. 장바구니를 확인해 보세요.
          </span>
          <ChevronIcon style={{ color: 'var(--warn-text)', flex: 'none' }} />
        </Link>
      )}

      {!selecting && urgent.length > 0 && (
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
                            <ItemChip key={it.id} item={it} selected={sel(it.name)} onOpen={() => open(it.name)} />
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
                      <ItemChip key={it.id} item={it} selected={sel(it.name)} onOpen={() => open(it.name)} />
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
                      className={`row${selecting ? ' row--select' : ''}`}
                      aria-pressed={sel(it.name)}
                      aria-label={`${it.name}, 남은 양 ${LEVEL_LABEL[it.level]}`}
                      onClick={() => open(it.name)}
                    >
                      {selecting && <span className="select-dot" aria-hidden="true" />}
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

      {selecting ? (
        <div className="bottom-bar bottom-bar--above-tabs select-actions">
          <button type="button" className="btn btn--soft" disabled={selected.size === 0} onClick={emptySelected}>
            다 떨어졌어요
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={selected.size === 0}
            onClick={() => setConfirmRemove(true)}
          >
            {selected.size > 0 ? `${selected.size}개 빼기` : '빼기'}
          </button>
        </div>
      ) : (
        <Link to="/add" className="fab">
          <PlusIcon />
          재료 추가
        </Link>
      )}

      {confirmRemove && (
        <BottomSheet label="재료 빼기 확인" onClose={() => setConfirmRemove(false)}>
          <h2 style={{ fontSize: 20 }}>
            {allSelected ? '냉장고를 모두 비울까요?' : `재료 ${selected.size}개를 뺄까요?`}
          </h2>
          <p className="subtitle" style={{ margin: 0 }}>
            냉장고에서 지우기만 하고 장바구니에는 담지 않아요. 다시 사야 하는 재료라면 "다 떨어졌어요"를 눌러 주세요.
          </p>
          <button type="button" className="btn btn--danger" onClick={removeSelected}>
            {selected.size}개 빼기
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'transparent', color: 'var(--muted)', height: 44, fontSize: 15 }}
            onClick={() => setConfirmRemove(false)}
          >
            취소
          </button>
        </BottomSheet>
      )}

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
