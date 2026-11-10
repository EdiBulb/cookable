import { useEffect, useState } from 'react'
import { track } from '../lib/analytics'
import { Link } from 'react-router-dom'
import { RECIPES } from '../data/recipes'
import { recommend, searchRecipes, type Match } from '../lib/recommend'
import { useKitchen } from '../store/KitchenContext'
import type { RecipeType } from '../types'
import { ChevronIcon, GridIcon, ListIcon, SearchIcon } from '../components/icons'
import { RecipeThumb } from '../components/RecipeThumb'
import { dayLabel, urgencyOf, urgentItems } from '../lib/expiry'
import { blockedBy, dietSummary, isDietActive, isLight, isMild } from '../lib/diet'
import { useDiet } from '../store/diet'

/** 레시피 카드 한 장: 부족한 재료가 있으면 바로 장바구니에 담을 수 있다 */
function RecipeCard({ match, blocked = [] }: { match: Match; blocked?: string[] }) {
  const { state, dispatch } = useKitchen()
  const { recipe, needed, missing, uses } = match
  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
  const toBuy = missing.filter((m) => !inCart.has(m))
  const ready = missing.length === 0
  const isBlocked = blocked.length > 0

  const addAll = () => {
    for (const name of toBuy) {
      dispatch({ type: 'addToCart', name, source: 'recipe', note: `${recipe.name}에 필요해요` })
    }
    track('cart_add', { source: 'recipe', count: toBuy.length, recipe: recipe.name, where: 'list' })
  }

  return (
    <div
      className={`recipe-card${isBlocked ? ' recipe-card--blocked' : ''}`}
      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}
    >
      <Link
        to={`/recipes/${recipe.id}`}
        style={{ display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
      >
        <RecipeThumb recipe={recipe} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <h3>{recipe.name}</h3>
          <p className="recipe-meta">
            {recipe.type} · {recipe.minutes}분 · {recipe.difficulty}
          </p>
          {ready ? (
            <p className="recipe-uses">{needed.join(' · ')}</p>
          ) : (
            <p className="recipe-meta">
              없는 재료: <b style={{ color: '#b4531a' }}>{missing.join(', ')}</b>
            </p>
          )}
          {isBlocked && <p className="recipe-blocked">내 식단에 맞지 않아요 · {blocked.join(', ')}</p>}
          {uses && uses.length > 0 && (
            <p className="recipe-rescue">
              {uses.map((u) => `${u.name} ${dayLabel(u.days)}`).join(' · ')} 사용
            </p>
          )}
        </span>
        <span className="score" style={ready ? undefined : { color: '#9a4514', background: 'var(--warn-soft)' }}>
          {needed.length - missing.length}/{needed.length}
        </span>
      </Link>
      {!ready && !isBlocked && (
        <div className="missing-row" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--outline"
            aria-pressed={toBuy.length === 0}
            disabled={toBuy.length === 0}
            onClick={addAll}
          >
            {toBuy.length === 0
              ? '장바구니에 담았어요'
              : missing.length === 1
                ? `${missing[0]} 장바구니에 담기`
                : `부족한 ${toBuy.length}개 장바구니에 담기`}
          </button>
        </div>
      )}
    </div>
  )
}

/** 타일 한 장: 사진 + 작은 이름 (자세한 건 누르면 상세에서) */
function RecipeTile({ match, blocked = [] }: { match: Match; blocked?: string[] }) {
  const { recipe, missing, uses } = match
  const ready = missing.length === 0
  const isBlocked = blocked.length > 0
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`recipe-tile${isBlocked ? ' recipe-card--blocked' : ''}`}
      aria-label={`${recipe.name}, ${isBlocked ? '내 식단에 맞지 않아요' : ready ? '바로 만들 수 있어요' : `재료 ${missing.length}개 부족`}`}
    >
      <span className="tile-photo-wrap">
        <RecipeThumb recipe={recipe} className="tile-photo" fullName />
        {!isBlocked && (
          <span className="tile-badge" data-ready={ready}>
            {ready ? '바로 가능' : `${missing.length}개 부족`}
          </span>
        )}
      </span>
      <span className="tile-name">{recipe.name}</span>
      {isBlocked ? (
        <span className="tile-sub tile-sub--blocked">식단에 안 맞음</span>
      ) : uses && uses.length > 0 ? (
        <span className="tile-sub tile-sub--rescue">
          {uses[0].name} {dayLabel(uses[0].days)}
        </span>
      ) : null}
    </Link>
  )
}

type RecipeView = 'tile' | 'list'
const VIEW_KEY = 'cookable:recipe-view'

function readView(): RecipeView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'tile'
  } catch {
    return 'tile'
  }
}

function ViewToggle({ view, onChange }: { view: RecipeView; onChange: (v: RecipeView) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="보기 방식">
      <button type="button" aria-label="타일로 보기" aria-pressed={view === 'tile'} onClick={() => onChange('tile')}>
        <GridIcon size={18} />
      </button>
      <button type="button" aria-label="목록으로 보기" aria-pressed={view === 'list'} onClick={() => onChange('list')}>
        <ListIcon size={18} />
      </button>
    </div>
  )
}

/** 보기 방식에 따라 타일 격자 또는 카드 목록 */
function RecipeResults({ items, view }: { items: { m: Match; blocked?: string[] }[]; view: RecipeView }) {
  if (view === 'tile') {
    return (
      <div className="recipe-grid">
        {items.map(({ m, blocked }) => (
          <RecipeTile key={m.recipe.id} match={m} blocked={blocked} />
        ))}
      </div>
    )
  }
  return (
    <>
      {items.map(({ m, blocked }) => (
        <RecipeCard key={m.recipe.id} match={m} blocked={blocked} />
      ))}
    </>
  )
}

const TYPES: RecipeType[] = ['국·찌개', '밥·덮밥', '면', '볶음·구이', '반찬', '분식·간식', '양식']

export function RecipesScreen() {
  const { state } = useKitchen()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<RecipeType | 'all'>('all')
  const [light, setLight] = useState(false)
  const [mild, setMild] = useState(false)
  const [view, setViewState] = useState<RecipeView>(readView)
  const setView = (v: RecipeView) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // 저장이 막힌 환경이면 이번만
    }
    track('recipe_view_mode', { view: v })
  }
  const diet = useDiet()
  const dietOn = isDietActive(diet)
  const q = query.trim()
  // 내 식단(알러지·베지테리안·싫어하는 재료)은 늘, 가벼운/안 매운 메뉴는 켰을 때만
  const allowed = RECIPES.filter((r) => blockedBy(r, diet).length === 0)
  const pool = allowed.filter(
    (r) => (type === 'all' || r.type === type) && (!light || isLight(r)) && (!mild || isMild(r)),
  )
  const { canCook, oneMore } = recommend(pool, state.fridge)
  // 검색은 숨기지 않고, 식단에 안 맞는 건 이유와 함께 맨 아래로
  const found = searchRecipes(RECIPES, state.fridge, q).map((m) => ({ m, blocked: blockedBy(m.recipe, diet) }))
  const results = [...found.filter((x) => x.blocked.length === 0), ...found.filter((x) => x.blocked.length > 0)]
  const emptyFridge = state.fridge.length === 0
  // 지난 재료는 추천하지 않고, 오늘~3일 안에 먹을 재료만
  const eatFirst = urgentItems(state.fridge).filter((u) => u.days >= 0)

  // 첫 화면에서 추천이 몇 개 나왔는지 (앱의 핵심 지표)
  useEffect(() => {
    track('recipe_home', { fridge_count: state.fridge.length, can_cook: canCook.length, one_more: oneMore.length })
    // 화면에 들어올 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 검색은 입력이 1초 멈추면 기록 (결과 0개인 검색어 = 다음에 넣을 레시피 후보)
  useEffect(() => {
    if (!q) return
    const t = window.setTimeout(() => track('recipe_search', { query: q, results: results.length }), 1000)
    return () => window.clearTimeout(t)
  }, [q, results.length])

  return (
    <main className="screen">
      <header>
        <span className="eyebrow">Cookable</span>
        <h1 className="title">오늘 뭐 해 먹지?</h1>
      </header>

      <label className="search">
        <SearchIcon style={{ color: 'var(--muted)', flex: 'none' }} />
        <input
          type="search"
          aria-label="먹고 싶은 요리나 재료 검색"
          placeholder="먹고 싶은 요리나 재료 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {dietOn && (
        <Link to="/diet" className="diet-on">
          <span>내 식단 적용 중 · {dietSummary(diet)}</span>
          <ChevronIcon style={{ flex: 'none' }} />
        </Link>
      )}

      {q ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-head">
            <h2 className="section-title">"{q}" 검색 결과</h2>
            <span className="count">{results.length}개</span>
            <ViewToggle view={view} onChange={setView} />
          </div>
          {results.length === 0 ? (
            <div className="empty-state">
              <p>
                아직 "{q}" 레시피가 없어요.
                <br />
                레시피는 계속 늘려갈게요.
              </p>
            </div>
          ) : (
            <>
              <p className="subtitle" style={{ margin: 0 }}>
                내 냉장고 기준으로 부족한 재료를 보여드려요
              </p>
              <RecipeResults items={results} view={view} />
            </>
          )}
        </section>
      ) : emptyFridge ? (
        <div className="empty-state">
          <p>
            냉장고에 있는 재료를 넣으면
            <br />
            지금 바로 만들 수 있는 요리를 찾아 드려요.
          </p>
          <Link to="/add" className="btn">
            재료 넣기
          </Link>
          <p style={{ fontSize: 12 }}>먹고 싶은 요리가 있다면 위에서 검색해 보세요</p>
        </div>
      ) : (
        <>
          {eatFirst.length > 0 && (
            <section className="eat-first" aria-label="먼저 먹어야 할 재료">
              <p className="eat-first-title">먼저 먹어야 해요</p>
              <div className="chips">
                {eatFirst.map((u) => (
                  <button
                    key={u.name}
                    type="button"
                    className="eat-chip"
                    onClick={() => {
                      setQuery(u.name)
                      track('eat_first_tap', { days: u.days })
                    }}
                  >
                    {u.name}
                    <span className="dday" data-u={urgencyOf(u.days)}>
                      {dayLabel(u.days)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="subtitle" style={{ margin: 0, fontSize: 12 }}>
                누르면 그 재료로 만들 수 있는 요리를 찾아요 · 아래 추천도 이 재료를 쓰는 요리부터 보여 드려요
              </p>
            </section>
          )}
          <div className="pills" role="group" aria-label="요리 종류">
            <button
              type="button"
              className="pill"
              aria-pressed={light}
              onClick={() => {
                setLight((v) => !v)
                track('recipe_filter', { type: 'light', on: !light })
              }}
            >
              가벼운 메뉴
            </button>
            <button
              type="button"
              className="pill"
              aria-pressed={mild}
              onClick={() => {
                setMild((v) => !v)
                track('recipe_filter', { type: 'mild', on: !mild })
              }}
            >
              안 매운 메뉴
            </button>
            <span className="pill-sep" aria-hidden="true" />
            {(['all', ...TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="pill"
                aria-pressed={type === t}
                onClick={() => {
                  setType(t)
                  track('recipe_filter', { type: t })
                }}
              >
                {t === 'all' ? '전체' : t}
              </button>
            ))}
          </div>
          <p className="subtitle" style={{ margin: 0 }}>
            레시피 {pool.length}개 중에서 냉장고 재료로 찾았어요 · 소금, 식용유, 설탕 같은 기본 양념은 빼고 계산해요
          </p>
          {!dietOn && (
            <Link to="/diet" className="diet-link">
              못 먹는 재료가 있나요? 내 식단 설정하기
            </Link>
          )}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="section-head">
              <h2 className="section-title">지금 바로 만들 수 있어요</h2>
              <span className="count">{canCook.length}개</span>
              <ViewToggle view={view} onChange={setView} />
            </div>
            {canCook.length === 0 ? (
              <div className="empty-state">
                <p>아직 재료가 다 갖춰진 요리가 없어요. 아래에서 하나만 더 사면 되는 요리를 확인해 보세요.</p>
              </div>
            ) : (
              <RecipeResults items={canCook.map((m) => ({ m }))} view={view} />
            )}
          </section>

          {oneMore.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 className="section-title">하나만 더 사면 돼요</h2>
                <p className="subtitle">
                  {view === 'list' ? '부족한 재료를 바로 장바구니에 담을 수 있어요' : '누르면 부족한 재료를 확인하고 장바구니에 담을 수 있어요'}
                </p>
              </div>
              <RecipeResults items={oneMore.map((m) => ({ m }))} view={view} />
            </section>
          )}
        </>
      )}
    </main>
  )
}
