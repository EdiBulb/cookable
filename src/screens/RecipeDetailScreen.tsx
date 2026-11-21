import { useEffect, useState } from 'react'
import { track } from '../lib/analytics'
import { Link, useParams } from 'react-router-dom'
import type { Level } from '../types'
import { findRecipe } from '../data/recipes'
import { STAPLES, normalize } from '../lib/recommend'
import { useKitchen } from '../store/KitchenContext'
import { BottomSheet } from '../components/BottomSheet'
import { LevelPicker } from '../components/level'
import { BackIcon, CheckIcon, PencilIcon, PlayIcon } from '../components/icons'
import { useOverrides, useRecipes } from '../store/custom'
import { isUrl } from '../lib/custom'
import { recordCook } from '../store/history'
import { addWish, completeWish, removeWish, useWishes } from '../store/wish'
import { blockedBy } from '../lib/diet'
import { recipePhoto } from '../components/RecipeThumb'
import { useDiet } from '../store/diet'

export function RecipeDetailScreen() {
  const { id = '' } = useParams()
  const all = useRecipes()
  const overrides = useOverrides()
  const recipe = all.find((r) => r.id === id)
  // 나만의 레시피면 원래 레시피, 기본 레시피면 내가 만든 나만의 버전
  const base = recipe?.baseId ? findRecipe(recipe.baseId) : recipe
  const override = recipe?.baseId ? overrides[recipe.baseId] : undefined
  const myVersion = recipe && !recipe.custom ? all.find((r) => r.baseId === recipe.id) : undefined
  const { state, dispatch } = useKitchen()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, Level>>({})
  const [saved, setSaved] = useState(false)
  const diet = useDiet()
  const wishes = useWishes()
  const wished = recipe ? wishes.find((w) => w.recipeId === recipe.id || w.name === recipe.name) : undefined

  useEffect(() => {
    if (recipe) track('recipe_view', { recipe: recipe.name, type: recipe.type })
  }, [recipe])

  if (!recipe) {
    return (
      <main className="screen">
        <p>레시피를 찾을 수 없어요.</p>
        <Link to="/">레시피 목록으로</Link>
      </main>
    )
  }

  const blocked = blockedBy(recipe, diet)
  const photo = recipePhoto(recipe.baseId ?? recipe.id)
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
    track('cook_done', {
      recipe: recipe.name,
      changed: used.filter((u) => draft[u.name] !== undefined && draft[u.name] !== u.level).length,
      ingredients: used.length,
      custom: Boolean(recipe.custom),
    })
    recordCook(recipe)
    completeWish(recipe)
    setSheetOpen(false)
    setSaved(true)
  }

  return (
    <main style={{ paddingBottom: 120, background: 'var(--surface)', minHeight: '100dvh' }}>
      <div className={`detail-hero${photo ? ' detail-hero--photo' : ''}`}>
        {photo ? <img src={photo} alt={recipe.name} /> : <span aria-hidden="true" className="detail-hero-name">{recipe.name}</span>}
        <Link to="/" className="icon-btn" aria-label="레시피 목록으로 돌아가기">
          <BackIcon />
        </Link>
        {recipe.custom && (
          <span className="hero-mine">
            <PencilIcon size={14} />내 레시피
          </span>
        )}
      </div>

      <div className="screen" style={{ paddingBottom: 0, gap: 24 }}>
        <div>
          <h1 className="title" style={{ margin: 0 }}>
            {recipe.name}
          </h1>
          <p className="subtitle" style={{ fontSize: 14, marginTop: 6 }}>
            {recipe.type} · {recipe.minutes}분 · {recipe.difficulty} · {recipe.servings}인분
          </p>
          <button
            type="button"
            className="wish-toggle"
            aria-pressed={!!wished}
            onClick={() => {
              if (wished) removeWish(wished.id)
              else addWish({ name: recipe.name, recipeId: recipe.id })
              track('wish_toggle', { on: !wished, where: 'detail', recipe: recipe.name })
            }}
          >
            {wished ? '해볼 요리에 있어요' : '+ 해볼 요리에 넣기'}
          </button>
        </div>

        {blocked.length > 0 && (
          <Link to="/diet" className="note-warn" style={{ textDecoration: 'none', display: 'block' }}>
            내 식단에 맞지 않아요 · {blocked.join(', ')}
            <br />
            <span style={{ fontSize: 12, fontWeight: 500 }}>제품마다 성분이 다를 수 있으니 성분표를 확인하세요</span>
          </Link>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="section-head" style={{ alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
            <h2 className="section-title" style={{ fontSize: 17 }}>
              재료
            </h2>
            <span className="count" style={{ color: missingCount ? '#b4531a' : 'var(--good)', fontWeight: 700 }}>
              {missingCount ? `${missingCount}개 부족해요` : '모두 있어요'}
            </span>
            <Link
              to={recipe.custom ? `/recipes/${recipe.baseId}/edit` : myVersion ? `/recipes/${myVersion.id}` : `/recipes/${id}/edit`}
              className="custom-entry"
              style={{ marginLeft: 'auto' }}
            >
              <PencilIcon size={16} />
              {recipe.custom ? '다시 고치기' : myVersion ? '나만의 레시피 보기' : '나만의 레시피 만들기'}
            </Link>
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
                  {recipe.custom && !base?.ingredients.some((b) => b.name === ing.name) && (
                    <span className="added-tag">내가 추가</span>
                  )}
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
                    onClick={() => {
                      dispatch({ type: 'addToCart', name: ing.name, source: 'recipe', note: `${recipe.name}에 필요해요` })
                      track('cart_add', { source: 'recipe', count: 1, recipe: recipe.name, where: 'detail' })
                    }}
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
              onClick={() => {
                toBuy.forEach((name) =>
                  dispatch({ type: 'addToCart', name, source: 'recipe', note: `${recipe.name}에 필요해요` }),
                )
                track('cart_add', { source: 'recipe', count: toBuy.length, recipe: recipe.name, where: 'detail' })
              }}
            >
              부족한 {toBuy.length}개 모두 장바구니에 담기
            </button>
          )}
        </section>

        {recipe.custom && override && override.remove.length > 0 && (
          <p className="subtitle" style={{ margin: '-12px 0 0', fontSize: 13 }}>
            원래 레시피에서 뺀 재료: {override.remove.join(', ')}
          </p>
        )}
        {recipe.custom && base && (
          <Link to={`/recipes/${base.id}`} className="custom-hint" style={{ textDecoration: 'none' }}>
            <span style={{ flex: 1 }}>
              원래 레시피 <b>{base.name}</b>도 그대로 있어요
            </span>
            <span style={{ color: 'var(--brand)', fontWeight: 700, flex: 'none' }}>보기 ›</span>
          </Link>
        )}
        {!recipe.custom && myVersion && (
          <Link to={`/recipes/${myVersion.id}`} className="custom-hint" style={{ textDecoration: 'none' }}>
            <PencilIcon size={18} style={{ color: 'var(--brand)', flex: 'none' }} />
            <span style={{ flex: 1 }}>
              내가 만든 <b>{myVersion.name}</b>이 있어요
            </span>
            <span style={{ color: 'var(--brand)', fontWeight: 700, flex: 'none' }}>보기 ›</span>
          </Link>
        )}
        {!recipe.custom && !myVersion && (
          <div className="custom-hint">
            <PencilIcon size={18} style={{ color: 'var(--brand)', flex: 'none' }} />
            <span>영상이랑 재료가 다르면? 나만의 레시피로 따로 저장해 두면 둘 다 추천받을 수 있어요</span>
          </div>
        )}
        {recipe.custom && override?.note?.trim() &&
          (isUrl(override.note) ? (
            <a href={override.note.trim()} target="_blank" rel="noreferrer" className="note-card">
              <span style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <PlayIcon size={16} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>내가 참고한 영상</b>
                <span className="row-sub">{override.note.trim()}</span>
              </span>
            </a>
          ) : (
            <div className="note-card">
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>내 메모</b>
                <span style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{override.note}</span>
              </span>
            </div>
          ))}

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

        <a href={ytUrl} target="_blank" rel="noreferrer" className="yt-link" onClick={() => track('youtube_click', { recipe: recipe.name })}>
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
