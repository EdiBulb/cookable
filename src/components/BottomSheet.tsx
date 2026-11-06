import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  label: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  // ESC로 닫기 (이 시트가 열려 있는 동안만)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop">
      <button type="button" className="sheet-dismiss" aria-label="닫기" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <span className="sheet-grip" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
