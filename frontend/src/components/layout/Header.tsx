import { useEffect, useState } from 'react'
import { NAV_ITEMS, scrollToSection } from '../../constants/navigation'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import Button from '../ui/Button'
import MobileMenu from './MobileMenu'
import './Header.css'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useScrollSpy(NAV_ITEMS.map((n) => n.id))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner container">
        <button className="header__logo" onClick={() => scrollToSection('hero')} aria-label="오트스톤 홈">
          <img src="/assets/oatstone-logo.png" alt="OATSTONE" className="header__logo-img" />
        </button>

        <nav className="header__nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className="header__nav-link"
              data-nav={item.id}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Button size="sm" onClick={() => scrollToSection('contact')}>
          의뢰하기
        </Button>

        <button
          className={`header__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
