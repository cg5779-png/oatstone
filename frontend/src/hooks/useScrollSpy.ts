import { useEffect } from 'react'

export function useScrollSpy(sectionIds: string[]) {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 100
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY && el.offsetTop + el.offsetHeight > scrollY) {
          document.querySelectorAll('[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-nav') === id)
          })
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds])
}
