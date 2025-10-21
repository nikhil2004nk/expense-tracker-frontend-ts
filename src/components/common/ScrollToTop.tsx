import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  useEffect(() => {
    // Scroll window
    window.scrollTo(0, 0)
    // Scroll internal app container if present
    const el = document.getElementById('app-scroll')
    if (el) {
      el.scrollTo({ top: 0 })
    }
  }, [pathname, search, hash])
  return null
}
