import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Level } from '../types'
import { findRecipe } from '../data/recipes'
import { STAPLES, normalize } from '../lib/recommend'
import { useKitchen } from '../store/KitchenContext'
import { BottomSheet } from '../components/BottomSheet'
import { LevelPicker } from '../components/level'
import { BackIcon, CheckIcon, PlayIcon } from '../components/icons'

export function RecipeDetailScreen() {
  const { id = '' } = useParams()
  const recipe = findRecipe(id)
  const { state, dispatch } = useKitchen()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, Level>>({})
  const [saved, setSaved] = useState(false)

  if (!recipe) {
    return (
      <main className="screen">
        <p>레시피를 찾을 수 없어요.</p>
        <Link to="/">레시피 목록으로</Link>
      </main>
    )
  }

  const fridgeByName = new Map(state.fridge.map((f) => [normalize(f.name), f]))
  const ingredients = recipe.ingredients.map((ing) => {
    const item = fridgeByName.get(normalize(ing.name))
    const has = (item?.level ?? 0) > 0
    return { ...ing, item, has, staple: STAPLES.has(normalize(ing.name)) }
  })
  // 요리 후 체크 대상: 이 레시피에 쓰였고 냉장고에 있는 재료
  const used = ingredients.filter((i) => i.item).map((i) => i.item!)
  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
  const toBuy = ingredients.filter((i) => !i.has && !i.staple && !inCart.has(i.name)).map((i) => i.name)
  const missingCount = ingredients.filter((i) => !i.has && !i.staple).length
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.name} 레시피`)}`

  const openSheet = () => {
    setDraft(Object.fromEntries(used.map((u) => [u.name, u.level])))
    setSaved(false)
    setSheetOpen(true)
  }
  const save = () => {
    for (const u of used) {
      const next = draft[u.name]
      if (next !== undefined && next !== u.level) dispatch({ type: 'setLevel', name: u.name, level: next })
    }
    setSheetOpen(false)
    setSaved(true)
  }

  return (
    <main style={{ paddingBottom: 120, background: 'var(--surface)', minHeight: '100dvh' }}>
      <div className="detail-hero">
        <Link to="/" className="icon-btn" aria-label="레시피 목록으로 돌아가기">
          <BackIcon />
        </Link>
        <span aria-hidden="true">{recipe.name[0]}</span>
      </div>

      <div className="screen" style={{ paddingBottom: 0, gap: 24 }}>
        <div>
          <h1 className="title" style={{ margin: 0 }}>
            {recipe.name}
          </h1>
          <p className="subtitle" style={{ fontSize: 14, marginTop: 6 }}>
            {recipe.minutes}분 · {recipe.difficulty} · {recipe.servings}인분
          </p>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="section-head">
            <h2 className="section-title" style={{ fontSize: 17 }}>
              재료
            </h2>
            <span className="count" style={{ color: missingCount ? '#b4531a' : 'var(--good)', fontWeight: 700 }}>
              {missingCount ? `${missingCount}개 부족해요` : '모두 있어요'}
            </span>
          </div>
          <div className="card">
            {ingredients.map((ing) => (
              <div key={ing.name} className="ing-row">
                {ing.has ? (
                  <CheckIcon size={16} style={{ color: 'var(--good)' }} />
                ) : (
                  <span style={{ width: 16, fontSize: 11, color: 'var(--muted)' }} aria-hidden="true">
                    ―
                  </span>
                )}
                <span>
                  {ing.name}
                  {!ing.has && (
                    <span className="row-sub" style={{ display: 'inline', marginLeft: 6, color: ing.staple ? 'var(--muted)' : '#b4531a' }}>
                      {ing.staple ? '기본 양념' : '없음'}
                    </span>
                  )}
                </span>
                {!ing.has && !ing.staple ? (
                  <button
                    type="button"
                    className="btn btn--outline"
                    style={{ height: 36, padding: '0 10px', fontSize: 12 }}
                    disabled={inCart.has(ing.name)}
                    aria-pressed={inCart.has(ing.name)}
                    onClick={() => dispatch({ type: 'addToCart', name: ing.name, source: 'recipe', note: `${recipe.name}에 필요해요` })}
                  >
                    {inCart.has(ing.name) ? '담았어요' : '담기'}
                  </button>
                ) : (
                  <span>{ing.amount}</span>
                )}
              </div>
            ))}
          </div>
          {toBuy.length > 1 && (
            <button
              type="button"
              className="btn btn--outline"
              style={{ width: '100%', height: 44 }}
              onClick={() =>
                toBuy.forEach((name) =>
                  dispatch({ type: 'addToCart', name, source: 'recipe', note: `${recipe.name}에 필요해요` }),
                )
              }
            >
              부족한 {toBuy.length}개 모두 장바구니에 담기
            </button>
          )}
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="section-title" style={{ fontSize: 17 }}>
            만드는 법
          </h2>
          {recipe.steps.map((step, i) => (
            <div key={i} className="step">
              <span className="step-num">{i + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </section>

        <a href={ytUrl} target="_blank" rel="noreferrer" className="yt-link">
          <span
            style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PlayIcon size={18} />
          </span>
          <span style={{ flex: 1 }}>
            유튜브에서 영상으로 보기
            <span className="row-sub" style={{ fontWeight: 400 }}>
              "{recipe.name} 레시피" 검색 결과가 열려요
            </span>
          </span>
        </a>
      </div>

      <div className="bottom-bar">
        {saved && <p className="note-good" style={{ marginBottom: 10 }}>남은 양을 업데이트했어요. 맛있게 드세요!</p>}
        <button type="button" className="btn" onClick={openSheet} disabled={used.length === 0}>
          {used.length === 0 ? '냉장고에 있는 재료가 없어요' : '요리 끝! 쓴 재료 체크하기'}
        </button>
      </div>

      {sheetOpen && (
        <BottomSheet label="요리 후 남은 양 체크" onClose={() => setSheetOpen(false)}>
          <div>
            <h2 style={{ fontSize: 20 }}>수고했어요! 재료 얼마나 남았어요?</h2>
            <p className="subtitle">지금 표시된 건 요리 전 양이에요. 바뀐 것만 눌러 주세요.</p>
          </div>
          {used.map((u) => (
            <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <strong style={{ fontSize: 14 }}>{u.name}</strong>
              <LevelPicker
                compact
                label={`${u.name} 남은 양`}
                value={draft[u.name] ?? u.level}
                onChange={(lv) => setDraft((d) => ({ ...d, [u.name]: lv }))}
              />
            </div>
          ))}
          <button type="button" className="btn" onClick={save}>
            저장하기
          </button>
        </BottomSheet>
      )}
    </main>
  )
}
