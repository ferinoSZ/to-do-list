import { AlertIcon, CheckIcon, CloseIcon } from './Icons.jsx'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
      <div className="toast__icon" aria-hidden="true">
        {isError ? <AlertIcon /> : <CheckIcon />}
      </div>

      <div className="toast__content">
        <strong>{toast.title}</strong>
        <span>{toast.message}</span>
      </div>

      <button className="icon-button icon-button--subtle" onClick={onClose} type="button" aria-label="Fechar aviso">
        <CloseIcon size={16} />
      </button>
    </div>
  )
}
