import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe, WishItem } from '../types'
import { track } from '../lib/analytics'
import { normalize, ownedSet } from '../lib/recommend'
import { findByName, similarRecipes, wishIngredients, wishNeeds, wishNote } from '../lib/wish'
import { searchCatalog } from '../data/catalog'
import { addWish, removeWish, updateWish, useWishes } from '../store/wish'
import { useKitchen } from '../store/KitchenContext'
import { RecipeThumb } from './RecipeThumb'

/** 레시피가 없는 메뉴의 재료를 직접 적는 칸 (재료 목록에서 자동완성) */
function IngredientEditor({ item, onDone }: { item: WishItem; onDone: () => void }) {
  const [draft, setDraft] = useState('')
  const list = item.ingredients ?? []
  const suggestions = searchCatalog(draft, 5, normalize).filter((c) => !list.includes(c.name))
  const add = (raw: string) => {
    const n = normalize(raw)
    setDraft('')
    if (!n || list.includes(n)) return
    updateWish(item.id, { ingredients: [...list, n] })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.length > 0 && (
        <div className="wish-chips">
          {list.map((n) => (
            <button
              key={n}
              type="button"
              className="wish-chip"
              data-owned="true"
              style={{ border: 0 }}
              onClick={() => updateWish(item.id, { ingredients: list.filter((x) => x !== n) })}
              aria-label={`${n} 빼기`}
            >
              {n} ✕
            </button>
          ))}
        </div>
      )}
      <form
        className="wish-add"
        onSubmit={(e) => {
          e.preventDefault()
          add(draft)
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="재료 이름 (예: 가지)" aria-label="재료 이름" />
        <button type="button" className="btn btn--outline" style={{ height: 44 }} onClick={onDone}>
          다 적었어요
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="suggest" style={{ marginTop: 0 }}>
          {suggestions.map((c) => (
            <button key={c.name} type="button" className="suggest-row" onClick={() => add(c.name)}>
              {c.name}
              <span className="row-sub">추가</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WishCard({ item, recipes, owned }: { item: WishItem; recipes: Recipe[]; owned: Set<string> }) {
  const recipe = item.recipeId ? recipes.find((r) => r.id === item.recipeId) : undefined
  const ingredients = wishIngredients(item, recipes)
  const [editing, setEditing] = useState(false)
  const similar = recipe ? [] : similarRecipes(recipes, item.name)
  const have = ingredients.filter((n) => owned.has(n)).length

  const swapTo = (r: Recipe) => {
    updateWish(item.id, { name: r.name, recipeId: r.id, ingredients: undefined })
    track('wish_swap', { from: item.name, to: r.name })
  }

  return (
    <div className="wish-card">
      <div className="wish-card-head">
        {recipe ? <RecipeThumb recipe={recipe} /> : <span className="recipe-thumb">{item.name[0]}</span>}
        {recipe ? (
          <Link to={`/recipes/${recipe.id}`} className="row-main">
            {item.name}
            <span className="row-sub">
              {ingredients.length === have ? '재료가 다 있어요' : `재료 ${ingredients.length}개 중 ${have}개 있어요`}
            </span>
          </Link>
        ) : (
          <span className="row-main">
            {item.name}
            <span className="row-sub">{ingredients.length ? `직접 적은 재료 ${ingredients.length}개` : '앱에 아직 없는 메뉴예요'}</span>
          </span>
        )}
        <button type="button" className="wish-x" aria-label={`${item.name} 빼기`} onClick={() => removeWish(item.id)}>
          ✕
        </button>
      </div>

      {ingredients.length > 0 && !editing && (
        <div className="wish-chips">
          {ingredients.map((n) => (
            <span key={n} className="wish-chip" data-owned={owned.has(n)}>
              {owned.has(n) ? '✓ ' : ''}
              {n}
            </span>
          ))}
        </div>
      )}

      {!recipe &&
        (editing ? (
          <IngredientEditor item={item} onDone={() => setEditing(false)} />
        ) : (
          <div className="wish-unknown">
            {ingredients.length === 0 && similar.length > 0 && (
              <>
                <span>비슷한 레시피가 있어요</span>
                <div className="wish-similar">
                  {similar.map((r) => (
                    <button key={r.id} type="button" onClick={() => swapTo(r)}>
                      {r.name}로 바꾸기
                    </button>
                  ))}
                </div>
              </>
            )}
            <div>
              <button type="button" className="wish-link" onClick={() => setEditing(true)}>
                {ingredients.length ? '재료 고치기' : '재료 직접 적기'}
              </button>
            </div>
          </div>
        ))}
    </div>
  )
}

/** 레시피 화면의 "해볼 요리": 메뉴를 적어 두면 필요한 재료를 모아 장보기로 */
export function WishList({ recipes }: { recipes: Recipe[] }) {
  const { state, dispatch } = useKitchen()
  const wishes = useWishes()
  const [draft, setDraft] = useState('')
  const q = draft.replace(/\s+/g, '')
  const matches = q ? recipes.filter((r) => r.name.replace(/\s+/g, '').includes(q)).slice(0, 5) : []
  const owned = ownedSet(state.fridge)
  const needs = wishNeeds(wishes, recipes, state.fridge)
  const inCart = new Set(state.cart.filter((c) => !c.done).map((c) => c.name))
  const missing = needs.filter((n) => !n.owned)
  const toBuy = missing.filter((n) => !inCart.has(n.name))

  const add = (name: string, recipe?: Recipe) => {
    const n = name.trim()
    if (!n) return
    const r = recipe ?? findByName(recipes, n)
    const ok = addWish(r ? { name: r.name, recipeId: r.id } : { name: n })
    setDraft('')
    track('wish_add', { known: Boolean(r), name: r ? r.name : n, duplicate: !ok })
  }

  const addAllToCart = () => {
    for (const n of toBuy) dispatch({ type: 'addToCart', name: n.name, source: 'wish', note: wishNote(n.forMenus) })
    track('cart_add', { source: 'wish', count: toBuy.length, menus: wishes.length })
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="section-head">
        <h2 className="section-title">해볼 요리</h2>
        <span className="count">{wishes.length}개</span>
      </div>

      <form
        className="wish-add"
        onSubmit={(e) => {
          e.preventDefault()
          add(draft)
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="해보고 싶은 메뉴 (예: 지삼선)"
          aria-label="해보고 싶은 메뉴"
        />
        <button type="submit" className="btn" style={{ height: 44, padding: '0 18px' }} disabled={!q}>
          추가
        </button>
      </form>
      {matches.length > 0 && (
        <div className="suggest" style={{ marginTop: -4 }}>
          {matches.map((r) => (
            <button key={r.id} type="button" className="suggest-row" onClick={() => add(r.name, r)}>
              {r.name}
              <span className="row-sub">레시피 있어요</span>
            </button>
          ))}
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="empty-state">
          <p>
            해보고 싶은 메뉴를 적어 두면
            <br />
            필요한 재료를 모아서 장보기에 담아 드려요.
          </p>
        </div>
      ) : (
        <>
          {needs.length > 0 && (
            <div className="wish-summary">
              <strong style={{ fontSize: 15 }}>
                {missing.length === 0
                  ? `필요한 재료 ${needs.length}개가 다 있어요`
                  : `필요한 재료 ${needs.length}개 중 ${missing.length}개를 사야 해요`}
              </strong>
              {missing.length > 0 && (
                <button type="button" className="btn" style={{ width: '100%', height: 44 }} onClick={addAllToCart} disabled={toBuy.length === 0}>
                  {toBuy.length === 0 ? '장바구니에 다 담겼어요' : `없는 재료 ${toBuy.length}개 장바구니에 담기`}
                </button>
              )}
            </div>
          )}
          {wishes.map((w) => (
            <WishCard key={w.id} item={w} recipes={recipes} owned={owned} />
          ))}
        </>
      )}
    </section>
  )
}
