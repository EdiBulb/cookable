import { useState } from 'react'
import type { FridgeItem } from '../types'
import { shelfDaysFor } from '../data/catalog'
import {
  dayLabel,
  daysFromToday,
  daysLeft,
  optionLabel,
  quickOptions,
  startOfDay,
  urgencyOf,
} from '../lib/expiry'

/** D-n 배지. onlyUrgent면 3일 이내(또는 지남)일 때만 보여 준다 */
export function DdayBadge({ item, onlyUrgent = false }: { item: FridgeItem; onlyUrgent?: boolean }) {
  if (item.level === 0) return null
  const d = daysLeft(item)
  if (d === null) return null
  const u = urgencyOf(d)
  if (onlyUrgent && u === 'ok') return null
  return (
    <span className="dday" data-u={u}>
      {dayLabel(d)}
    </span>
  )
}

const toInputDate = (t: number) => {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 바텀시트 안 "언제까지 먹을까요?" — 재료마다 다른 빠른 버튼 + 숨겨 둔 달력 */
export function UseByEditor({
  item,
  onChange,
}: {
  item: FridgeItem
  onChange: (useBy: number | null) => void
}) {
  const [showDate, setShowDate] = useState(false)
  const shelf = shelfDaysFor(item.name, item.place)
  const left = daysLeft(item)
  const options = quickOptions(shelf ?? 30)
  const today = startOfDay(Date.now())

  return (
    <div className="field">
      <span className="field-label" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>언제까지 먹을까요?</span>
        {left === null ? (
          <span className="dday" data-u="off">
            오래가는 재료라 날짜를 세지 않아요
          </span>
        ) : (
          <span className="dday" data-u={urgencyOf(left)}>
            {dayLabel(left)}
          </span>
        )}
      </span>
      <div className="useby-opts">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className="pill"
            aria-pressed={left === n && item.useBy != null}
            onClick={() => onChange(daysFromToday(n))}
          >
            {optionLabel(n)}
            {n === shelf && <small>보통</small>}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="link-btn" onClick={() => setShowDate((v) => !v)}>
          {showDate ? '날짜 입력 닫기' : '포장지 날짜 직접 넣기'}
        </button>
        {item.useBy != null && shelf !== null && (
          <button type="button" className="link-btn" style={{ color: 'var(--muted)' }} onClick={() => onChange(null)}>
            자동으로 되돌리기
          </button>
        )}
      </div>
      {showDate && (
        <input
          type="date"
          aria-label="포장지에 적힌 날짜"
          min={toInputDate(today - 30 * 864e5)}
          value={toInputDate(item.useBy ?? daysFromToday(Math.max(left ?? 7, 0)))}
          onChange={(e) => {
            if (!e.target.value) return
            const [y, m, d] = e.target.value.split('-').map(Number)
            onChange(new Date(y, m - 1, d).getTime())
          }}
        />
      )}
    </div>
  )
}
