import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKitchen } from '../store/KitchenContext'
import type { KitchenState } from '../store/kitchen'
import type { FridgeItem } from '../types'
import { shelfDaysFor } from '../data/catalog'
import { BottomSheet } from './BottomSheet'
import { track } from '../lib/analytics'

/** 냉동실 재료와, 날짜를 세지 않는 오래가는 재료(양념·건재료). 식빵처럼 찬장에 있어도 금방 상하는 건 제외 */
export function isLongLasting(f: FridgeItem): boolean {
  return f.place === 'freezer' || shelfDaysFor(f.name, f.place) === null
}

/**
 * 메인 화면 오른쪽 아래 "냉장고 비우기".
 * 가끔 요리하는 사람은 일주일 뒤 냉장고가 앱과 달라져서, 빠르게 다시 시작할 수 있게.
 * 실수 방지: 확인 창 + 비운 뒤 몇 초 동안 되돌리기.
 */
export function EmptyFridgeButton() {
  const { state, dispatch } = useKitchen()
  const [confirm, setConfirm] = useState(false)
  const [keepLong, setKeepLong] = useState(true)
  const [undo, setUndo] = useState<KitchenState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (state.fridge.length === 0 && !undo) return null

  const kept = state.fridge.filter(isLongLasting)
  const removeCount = keepLong ? state.fridge.length - kept.length : state.fridge.length

  const empty = () => {
    const before = state
    dispatch({
      type: 'reset',
      state: { ...state, fridge: keepLong ? kept : [] },
    })
    track('fridge_emptied', { removed: removeCount, kept: keepLong ? kept.length : 0 })
    setConfirm(false)
    setUndo(before)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUndo(null), 8000)
  }

  const restore = () => {
    if (!undo) return
    dispatch({ type: 'reset', state: undo })
    track('fridge_empty_undo')
    setUndo(null)
  }

  return (
    <>
      {undo ? (
        <div className="toast" role="status">
          <span>냉장고를 비웠어요</span>
          <button type="button" onClick={restore}>
            되돌리기
          </button>
          <Link to="/add" onClick={() => setUndo(null)}>
            오늘 재료 넣기
          </Link>
        </div>
      ) : (
        <button type="button" className="fab fab--quiet" onClick={() => setConfirm(true)}>
          냉장고 비우기
        </button>
      )}

      {confirm && (
        <BottomSheet label="냉장고 비우기 확인" onClose={() => setConfirm(false)}>
          <h2 style={{ fontSize: 20 }}>정말로 냉장고를 비울까요?</h2>
          <p className="subtitle" style={{ margin: 0 }}>
            오랜만에 열었다면 비우고, 오늘 눈에 보이는 재료만 다시 넣는 게 더 정확해요.
          </p>
          {kept.length > 0 && (
            <label className="check-row">
              <input type="checkbox" checked={keepLong} onChange={(e) => setKeepLong(e.target.checked)} />
              <span>
                양념·건재료·냉동실은 남기기
                <span className="row-sub">
                  {kept.slice(0, 4).map((k) => k.name).join(', ')}
                  {kept.length > 4 ? ` 외 ${kept.length - 4}개` : ''}
                </span>
              </span>
            </label>
          )}
          <button type="button" className="btn btn--danger" disabled={removeCount === 0} onClick={empty}>
            재료 {removeCount}개 비우기
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: 'transparent', color: 'var(--muted)', height: 44, fontSize: 15 }}
            onClick={() => setConfirm(false)}
          >
            취소
          </button>
        </BottomSheet>
      )}
    </>
  )
}
