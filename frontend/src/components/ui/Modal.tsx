import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

interface ModalProps {
  children: React.ReactNode
  onClose: () => void
}

export default function Modal({ children, onClose }: ModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" onClick={onClose} aria-label="닫기">
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}
