import { NAV_ITEMS, scrollToSection } from '../../constants/navigation'
import './MobileMenu.css'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  if (!open) return null

  const navigate = (id: string) => {
    onClose()
    scrollToSection(id)
  }

  return (
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="내비게이션 메뉴">
      <div className="mobile-menu__backdrop" onClick={onClose} />
      <div className="mobile-menu__panel">
        <nav className="mobile-menu__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className="mobile-menu__link"
              data-nav={item.id}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
