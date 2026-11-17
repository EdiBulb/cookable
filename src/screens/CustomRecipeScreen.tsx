import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { findRecipe } from '../data/recipes'
import { searchCatalog } from '../data/catalog'
import { normalize } from '../lib/recommend'
import { defaultCustomName } from '../lib/custom'
import { customId, removeOverride, saveOverride, useOverrides } from '../store/custom'
import { MinusCircleIcon, PlusIcon } from '../components/icons'
import { BottomSheet } from '../components/BottomSheet'
import { track } from '../lib/analytics'

/** 나만의 레시피로 고치기: 재료 빼기·추가, 이름, 참고한 영상 메모 */
export function CustomRecipeScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const base = findRecipe(id)
  const existing = useOverrides()[id]

  const [name, setName] = useState(existing?.name ?? (base ? defaultCustomName(base) : ''))
  const [remove, setRemove] = useState<string[]>(existing?.remove ?? [])
  const [add, setAdd] = useState<{ name: string; amount: string }[]>(existing?.add ?? [])
  const [note, setNote] = useState(existing?.note ?? '')
  const [draft, setDraft] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  if (!base) {
    return (
      <main className="screen">
        <p>레시피를 찾을 수 없어요.</p>
        <Link to="/">레시피 목록으로</Link>
      </main>
    )
  }

  const baseNames = new Set(base.ingredients.map((i) => i.name))
  const taken = new Set([...base.ingredients.map((i) => i.name), ...add.map((a) => a.name)])
  const suggestions = searchCatalog(draft, 5, normalize).filter((c) => !taken.has(c.name))

  const toggleRemove = (n: string) =>
    setRemove((r) => (r.includes(n) ? r.filter((x) => x !== n) : [...r, n]))

  const addIngredient = (raw: string) => {
    const n = raw.trim()
    setDraft('')
    if (!n) return
    // 기본 레시피에 있던 재료를 다시 적으면 "뺀 재료"를 되살린다
    if (baseNames.has(n)) {
      setRemove((r) => r.filter((x) => x !== n))
      return
    }
    if (add.some((a) => a.name === n)) return
    setAdd((a) => [...a, { name: n, amount: '' }])
  }

  const save = () => {
    const ov = { baseId: base.id, name: name.trim(), remove, add: add.filter((a) => a.name.trim()), note: note.trim(), updatedAt: Date.now() }
    // 기본 레시피는 그대로 두고 "나만의 ○○"를 따로 저장
    saveOverride(ov)
    track('custom_saved', { recipe: base.name, removed: remove.length, added: add.length, has_note: Boolean(note.trim()), first: !existing })
    navigate(`/recipes/${customId(base.id)}`, { replace: true })
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: 60 }}>
      <header className="edit-top">
        <button type="button" onClick={() => navigate(-1)}>
          취소
        </button>
        <h1>{existing ? '나만의 레시피 고치기' : '나만의 레시피 만들기'}</h1>
        <button type="button" className="save" onClick={save}>
          저장
        </button>
      </header>

      <div className="screen" style={{ paddingTop: 18, gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="custom-name" className="edit-label">
            이름
          </label>
          <input
            id="custom-name"
            className="edit-input"
            value={name}
            placeholder={base.name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="edit-label">재료</span>
            {(remove.length > 0 || add.length > 0) && (
              <span className="row-sub" style={{ fontSize: 12 }}>
                {[remove.length > 0 && `빼기 ${remove.length}`, add.length > 0 && `추가 ${add.length}`].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div className="card">
            {base.ingredients.map((ing) => {
              const removed = remove.includes(ing.name)
              return (
                <div key={ing.name} className={`edit-row${removed ? ' edit-row--removed' : ''}`}>
                  <span className="edit-name">{ing.name}</span>
                  {removed ? (
                    <>
                      <span className="row-sub" style={{ fontSize: 12, fontWeight: 700 }}>
                        뺐어요
                      </span>
                      <button type="button" className="small-btn" onClick={() => toggleRemove(ing.name)}>
                        되살리기
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="row-sub" style={{ fontSize: 14 }}>
                        {ing.amount}
                      </span>
                      <button
                        type="button"
                        className="icon-ghost"
                        aria-label={`${ing.name} 빼기`}
                        onClick={() => toggleRemove(ing.name)}
                      >
                        <MinusCircleIcon size={18} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
            {add.map((a, i) => (
              <div key={a.name} className="edit-row edit-row--added">
                <span className="edit-name">
                  {a.name}
                  <span className="added-tag">추가</span>
                </span>
                <input
                  className="edit-amount"
                  aria-label={`${a.name} 양`}
                  placeholder="양"
                  value={a.amount}
                  onChange={(e) => setAdd((list) => list.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                />
                <button
                  type="button"
                  className="icon-ghost"
                  aria-label={`${a.name} 빼기`}
                  onClick={() => setAdd((list) => list.filter((_, j) => j !== i))}
                >
                  <MinusCircleIcon size={18} />
                </button>
              </div>
            ))}
            <form
              style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
              onSubmit={(e) => {
                e.preventDefault()
                const exact = suggestions.find((c) => c.name === draft.trim() || c.name === normalize(draft))
                addIngredient(exact ? exact.name : draft)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', borderRadius: 10, background: 'var(--bg)' }}>
                <PlusIcon size={18} style={{ color: 'var(--brand)', flex: 'none' }} />
                <input
                  aria-label="재료 추가"
                  placeholder="재료 추가 (예: 스팸, 치즈)"
                  autoComplete="off"
                  enterKeyHint="done"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
                />
              </div>
              {draft.trim() && (
                <div className="suggest" style={{ marginTop: 0 }}>
                  {suggestions.map((c) => (
                    <button key={c.name} type="button" className="suggest-row" onClick={() => addIngredient(c.name)}>
                      <span>{c.name}</span>
                      <span className="row-sub">추가</span>
                    </button>
                  ))}
                  {!suggestions.some((c) => c.name === draft.trim() || c.name === normalize(draft)) && (
                    <button type="button" className="suggest-row" onClick={() => addIngredient(draft)}>
                      <span>"{draft.trim()}" 그대로 추가</span>
                      <span className="row-sub">목록에 없는 재료</span>
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="custom-note" className="edit-label">
            참고한 영상 · 메모 <span style={{ fontWeight: 500, color: 'var(--muted)' }}>(선택)</span>
          </label>
          <input
            id="custom-note"
            className="edit-input"
            placeholder="유튜브 링크나 짧은 메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {existing && (
          <button type="button" className="link-btn" style={{ color: 'var(--muted)' }} onClick={() => setConfirmReset(true)}>
            이 나만의 레시피 지우기
          </button>
        )}
      </div>

      {confirmReset && (
        <BottomSheet label="나만의 레시피 지우기" onClose={() => setConfirmReset(false)}>
          <h2 style={{ fontSize: 20 }}>{name.trim() || defaultCustomName(base)}을 지울까요?</h2>
          <p className="subtitle" style={{ margin: 0 }}>
            원래 레시피 {base.name}은 그대로 남아요. 해먹은 기록도 그대로예요.
          </p>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              removeOverride(base.id)
              track('custom_reset', { recipe: base.name })
              navigate(`/recipes/${base.id}`, { replace: true })
            }}
          >
            지우기
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'transparent', color: 'var(--muted)', height: 44, fontSize: 15 }}
            onClick={() => setConfirmReset(false)}
          >
            취소
          </button>
        </BottomSheet>
      )}
    </main>
  )
}
