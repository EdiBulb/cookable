import type { Level } from '../types'

export const LEVEL_LABEL = ['없음', '거의 없음', '조금', '보통', '충분', '넉넉'] as const
export const LEVEL_SHORT = ['없음', '거의', '조금', '보통', '충분', '넉넉'] as const
export const LEVELS: Level[] = [0, 1, 2, 3, 4, 5]

export function levelColor(level: Level): string {
  if (level >= 3) return 'var(--good)'
  if (level === 2) return 'var(--warn)'
  if (level === 1) return 'var(--low)'
  return 'var(--empty)'
}

export function levelTextColor(level: Level): string {
  if (level === 0) return 'var(--muted)'
  return level <= 2 ? '#b4531a' : 'var(--good)'
}

/** 남은 양을 막대 5개로 보여주는 작은 표시 */
export function LevelBars({ level }: { level: Level }) {
  const color = levelColor(level)
  return (
    <span className="bars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ height: 4 + i * 2, background: i <= level ? color : undefined }} />
      ))}
    </span>
  )
}

interface LevelPickerProps {
  value: Level
  onChange: (level: Level) => void
  compact?: boolean
  label: string
}

/** 0~5 중 하나를 고르는 버튼 줄 */
export function LevelPicker({ value, onChange, compact, label }: LevelPickerProps) {
  return (
    <div className={compact ? 'levels levels--compact' : 'levels'} role="group" aria-label={label}>
      {LEVELS.map((n) => (
        <button
          key={n}
          type="button"
          className="level-btn"
          aria-pressed={n === value}
          aria-label={`${n}, ${LEVEL_LABEL[n]}`}
          onClick={() => onChange(n)}
        >
          <strong>{n}</strong>
          {!compact && <small>{LEVEL_SHORT[n]}</small>}
        </button>
      ))}
    </div>
  )
}
