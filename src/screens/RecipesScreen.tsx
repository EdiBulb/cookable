import { Link } from 'react-router-dom'
import { RECIPES } from '../data/recipes'
import { recommend } from '../lib/recommend'
import { useKitchen } from '../store/KitchenContext'

export function RecipesScreen() {
  const { state, dispatch } = useKitchen()
  const { canCook, oneMore } = recommend(RECIPES, state.fridge)
  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))

  return (
    <main className="screen">
      <header>
        <span className="eyebrow">Cookable</span>
        <h1 className="title">오늘 뭐 해 먹지?</h1>
        <p className="subtitle">냉장고에 있는 재료로 찾았어요 · 소금, 식용유, 설탕 같은 기본 양념은 빼고 계산해요</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="section-head">
          <h2 className="section-title">지금 바로 만들 수 있어요</h2>
          <span className="count">{canCook.length}개</span>
        </div>
        {canCook.length === 0 ? (
          <div className="empty-state">
            <p>아직 재료가 다 갖춰진 요리가 없어요.{state.fridge.length === 0 && ' 먼저 냉장고에 재료를 넣어 주세요.'}</p>
            {state.fridge.length === 0 && (
              <Link to="/add" className="btn">
                재료 넣기
              </Link>
            )}
          </div>
        ) : (
          canCook.map(({ recipe, needed }) => (
            <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="recipe-card">
              <span className="recipe-thumb" aria-hidden="true">
                {recipe.name[0]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <h3>{recipe.name}</h3>
                <p className="recipe-meta">
                  {recipe.minutes}분 · {recipe.difficulty} · {recipe.servings}인분
                </p>
                <p className="recipe-uses">{needed.join(' · ')}</p>
              </span>
              <span className="score">
                {needed.length}/{needed.length}
              </span>
            </Link>
          ))
        )}
      </section>

      {oneMore.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 className="section-title">하나만 더 사면 돼요</h2>
            <p className="subtitle">부족한 재료를 바로 장바구니에 담을 수 있어요</p>
          </div>
          {oneMore.map(({ recipe, missing }) => {
            const item = missing[0]
            const added = inCart.has(item)
            return (
              <div key={recipe.id} className="card" style={{ padding: '14px 16px' }}>
                <Link
                  to={`/recipes/${recipe.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit' }}
                >
                  <strong style={{ fontSize: 16 }}>{recipe.name}</strong>
                  <span className="count" style={{ fontSize: 12 }}>
                    {recipe.minutes}분 · {recipe.difficulty}
                  </span>
                </Link>
                <div className="missing-row">
                  <span>
                    없는 재료: <b>{item}</b>
                  </span>
                  <button
                    type="button"
                    className="btn btn--outline"
                    aria-pressed={added}
                    disabled={added}
                    onClick={() => dispatch({ type: 'addToCart', name: item, source: 'recipe', note: `${recipe.name}에 필요해요` })}
                  >
                    {added ? '담았어요' : '장바구니에 담기'}
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )}
    </main>
  )
}
