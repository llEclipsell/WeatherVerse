import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { List, X } from 'lucide-react'

import { CURATED_CITIES } from '../services/cities'
import { useWeatherStore } from '../store/weatherStore'
import { fmtCoord } from '../lib/format'

/**
 * Floating controls over the full-screen globe. Kept deliberately small: one instruction and a
 * Cities button. The list behind that button is also the keyboard and no-WebGL way to pick a city.
 */
export default function ExplorePage({ onSelect }) {
  const webgl = useWeatherStore((s) => s.webgl)
  const hoveredId = useWeatherStore((s) => s.hoveredCityId)
  const setHovered = useWeatherStore((s) => s.setHoveredCity)
  const transitionCity = useWeatherStore((s) => s.transitionCity)
  const busy = transitionCity !== null
  const [open, setOpen] = useState(webgl !== 'ok')

  useEffect(() => {
    if (webgl !== 'ok') setOpen(true)
  }, [webgl])
  // Closing the drawer slides it under the pointer, which can leave a marker stuck as "hovered".
  useEffect(() => {
    if (open && !busy) return
    const id = window.setTimeout(() => setHovered(null), 260)
    return () => window.clearTimeout(id)
  }, [open, busy, setHovered])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <main className="explore" aria-busy={busy}>
      <h1 className="sr-only">WeatherVerse: explore live weather on the globe</h1>
      {webgl !== 'ok' && <div className="fallback-planet" aria-hidden="true" />}

      {!busy && (
        <p className="explore-hint">
          {webgl === 'ok'
            ? 'Select a city to explore'
            : webgl === 'lost'
              ? 'The 3D globe stopped. Reload to bring it back, or pick a city below.'
              : 'The 3D globe is not available here. Pick a city or search.'}
          {webgl === 'ok' && <small>Drag to turn &nbsp;/&nbsp; scroll or pinch to zoom</small>}
        </p>
      )}

      <div className="city-drawer">
        <AnimatePresence>
          {open && !busy && (
            <motion.nav
              className="city-index"
              aria-label="Featured cities"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <ul>
                {CURATED_CITIES.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      data-active={hoveredId === city.id}
                      onClick={() => {
                        setOpen(webgl !== 'ok')
                        onSelect(city)
                      }}
                      onPointerEnter={() => setHovered(city.id)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered(city.id)}
                      onBlur={() => setHovered(null)}
                    >
                      <span>{city.name}</span>
                      <small>{fmtCoord(city.latitude, city.longitude)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
        {!busy && (
          <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />} Cities
          </button>
        )}
      </div>

      {busy && (
        <p className="flight-status" role="status">
          Flying to {transitionCity.name}
        </p>
      )}
    </main>
  )
}
