import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALLERGENS, type Tag } from '../data/tags'
import { CATALOG } from '../data/catalog'
import { RECIPES } from '../data/recipes'
import { blockedBy, STYLE_HINT, STYLE_LABEL, type DietProfile, type DietStyle } from '../lib/diet'
import { setDiet, useDiet } from '../store/diet'
import { BackIcon } from '../components/icons'
import { track } from '../lib/analytics'

const STYLES: DietStyle[] = ['all', 'pesco', 'lacto-ovo', 'vegan']

export function DietScreen() {
  const navigate = useNavigate()
  const diet = useDiet()
  const [draft, setDraft] = useState('')

  const save = (next: DietProfile) => {
    setDiet(next)
    // 건강 정보라 어떤 알러지인지는 보내지 않고 개수만
    track('diet_changed', {
      style: next.style,
      allergy_count: next.allergies.length,
      dislike_count: next.dislikes.length,
    })
  }

  const toggleAllergy = (tag: Tag) =>
    save({
      ...diet,
      allergies: diet.allergies.includes(tag) ? diet.allergies.filter((t) => t !== tag) : [...diet.allergies, tag],
    })

  const addDislike = () => {
    const name = draft.trim()
    setDraft('')
    if (!name || diet.dislikes.includes(name)) return
    save({ ...diet, dislikes: [...diet.dislikes, name] })
  }

  const hidden = RECIPES.filter((r) => blockedBy(r, diet).length > 0).length

  return (
    <main className="screen screen--plain">
      <header className="header-row">
        <button type="button" className="icon-btn icon-btn--ghost" aria-label="뒤로" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          내 식단
        </h1>
      </header>

      <p className="subtitle" style={{ margin: 0 }}>
        여기서 고른 조건은 추천, 검색, 장바구니 제안에 늘 적용돼요.
        {hidden > 0 && (
          <>
            {' '}
            지금 레시피 <b>{RECIPES.length - hidden}개</b>가 맞고, {hidden}개는 빼고 보여 드려요.
          </>
        )}
      </p>

      <section className="card diet-card">
        <h2 className="field-label">못 먹는 재료가 있어요</h2>
        <div className="chips">
          {ALLERGENS.map((a) => (
            <button
              key={a.tag}
              type="button"
              className="pill pill--sm"
              aria-pressed={diet.allergies.includes(a.tag)}
              onClick={() => toggleAllergy(a.tag)}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="note-warn" style={{ fontWeight: 500, fontSize: 13 }}>
          간장의 밀·대두처럼 숨은 성분까지 넉넉하게 거르지만, 앱 정보는 참고용이에요. 제품 성분표를 꼭 확인하세요.
        </p>
      </section>

      <section className="card diet-card">
        <h2 className="field-label">고기를 먹나요?</h2>
        <div className="diet-styles" role="radiogroup" aria-label="베지테리안 단계">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={diet.style === s}
              className="diet-style"
              onClick={() => save({ ...diet, style: s })}
            >
              <span className="diet-style-name">{STYLE_LABEL[s]}</span>
              <span className="row-sub">{STYLE_HINT[s]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card diet-card">
        <h2 className="field-label">싫어하는 재료</h2>
        {diet.dislikes.length > 0 && (
          <div className="chips">
            {diet.dislikes.map((d) => (
              <button
                key={d}
                type="button"
                className="pill pill--sm"
                aria-pressed="true"
                aria-label={`${d} 빼기 취소`}
                onClick={() => save({ ...diet, dislikes: diet.dislikes.filter((x) => x !== d) })}
              >
                {d} ×
              </button>
            ))}
          </div>
        )}
        <form
          className="diet-add"
          onSubmit={(e) => {
            e.preventDefault()
            addDislike()
          }}
        >
          <input
            list="diet-catalog"
            aria-label="싫어하는 재료 이름"
            placeholder="고수"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <datalist id="diet-catalog">
            {CATALOG.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
          <button type="submit" className="btn btn--outline">
            추가
          </button>
        </form>
      </section>
    </main>
  )
}
