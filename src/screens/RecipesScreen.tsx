import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RECIPES } from '../data/recipes'
import { recommend, searchRecipes, type Match } from '../lib/recommend'
import { useKitchen } from '../store/KitchenContext'
import { SearchIcon } from '../components/icons'

/** 레시피 카드 한 장: 부족한 재료가 있으면 바로 장바구니에 담을 수 있다 */
function RecipeCard({ match }: { match: Match }) {
  const { state, dispatch } = useKitchen()
  const { recipe, needed, missing } = match
  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
  const toBuy = missing.filter((m) => !inCart.has(m))
  const ready = missing.length === 0

  const addAll = () => {
    for (const name of toBuy) {
      dispatch({ type: 'addToCart', name, source: 'recipe', note: `${recipe.name}에 필요해요` })
    }
  }

  return (
    <div className="recipe-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
      <Link
        to={`/recipes/${recipe.id}`}
        style={{ display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
      >
        <span className="recipe-thumb" aria-hidden="true">
          {recipe.name[0]}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <h3>{recipe.name}</h3>
          <p className="recipe-meta">
            {recipe.minutes}분 · {recipe.difficulty} · {recipe.servings}인분
          </p>
          {ready ? (
            <p className="recipe-uses">{needed.join(' · ')}</p>
          ) : (
            <p className="recipe-meta">
              없는 재료: <b style={{ color: '#b4531a' }}>{missing.join(', ')}</b>
            </p>
          )}
        </span>
        <span className="score" style={ready ? undefined : { color: '#9a4514', background: 'var(--warn-soft)' }}>
          {needed.length - missing.length}/{needed.length}
        </span>
      </Link>
      {!ready && (
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

export function RecipesScreen() {
  const { state } = useKitchen()
  const [query, setQuery] = useState('')
  const q = query.trim()
  const { canCook, oneMore } = recommend(RECIPES, state.fridge)
  const results = searchRecipes(RECIPES, state.fridge, q)
  const emptyFridge = state.fridge.length === 0

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

      {q ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-head">
            <h2 className="section-title">"{q}" 검색 결과</h2>
            <span className="count">{results.length}개</span>
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
              {results.map((m) => (
                <RecipeCard key={m.recipe.id} match={m} />
              ))}
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
          <p className="subtitle" style={{ margin: 0 }}>
            냉장고 재료로 찾았어요 · 소금, 식용유, 설탕 같은 기본 양념은 빼고 계산해요
          </p>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="section-head">
              <h2 className="section-title">지금 바로 만들 수 있어요</h2>
              <span className="count">{canCook.length}개</span>
            </div>
            {canCook.length === 0 ? (
              <div className="empty-state">
                <p>아직 재료가 다 갖춰진 요리가 없어요. 아래에서 하나만 더 사면 되는 요리를 확인해 보세요.</p>
              </div>
            ) : (
              canCook.map((m) => <RecipeCard key={m.recipe.id} match={m} />)
            )}
          </section>

          {oneMore.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 className="section-title">하나만 더 사면 돼요</h2>
                <p className="subtitle">부족한 재료를 바로 장바구니에 담을 수 있어요</p>
              </div>
              {oneMore.map((m) => (
                <RecipeCard key={m.recipe.id} match={m} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
}
