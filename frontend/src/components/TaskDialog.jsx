import { useLayoutEffect, useRef } from 'react'

export default function TaskDialog({ label, onClose, busy, compact = false, children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    dialog.showModal()
    dialog.querySelector('[data-initial-focus]')?.focus()
    return () => {
      dialog.close()
      requestAnimationFrame(() => {
        if (document.querySelector('dialog[open]')) return
        const target = opener?.isConnected && !opener.disabled ? opener : document.querySelector('.fab')
        target?.focus({ preventScroll: true })
      })
    }
  }, [])

  return (
    <dialog ref={ref} className={compact ? 'task-dialog task-dialog--compact' : 'task-dialog'}
      aria-label={label} onCancel={event => {
        event.preventDefault()
        if (!busy) onClose()
      }}>
      {children}
    </dialog>
  )
}
