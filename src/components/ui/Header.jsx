import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Globe, SlidersHorizontal } from 'lucide-react'

import { useWeatherStore } from '../../store/weatherStore'
import { CitySearch } from '../search/CitySearch'
import { UseMyLocationButton } from '../search/UseMyLocationButton'

const QUALITY = [
  { value: 'auto', label: 'Auto', note: 'Adjusts to this device' },
  { value: 'high', label: 'High', note: 'Sharpest globe, most particles' },
  { value: 'balanced', label: 'Balanced', note: 'Lighter textures and effects' },
  { value: 'low', label: 'Low', note: 'Still globe, minimal effects' },
]

export function Header({ onCityPage, onSelect, onBack }) {
  const unit = useWeatherStore((s) => s.tempUnit)
  const setUnit = useWeatherStore((s) => s.setTempUnit)
  const setting = useWeatherStore((s) => s.qualitySetting)
  const quality = useWeatherStore((s) => s.quality)
  const setQuality = useWeatherStore((s) => s.setQualitySetting)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const close = (e) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target)) setMenu(false)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', close)
    }
  }, [menu])

  return (
    <header className="site-header" data-floating={!onCityPage}>
      <button
        type="button"
        className="wordmark"
        onClick={onCityPage ? onBack : undefined}
        aria-label={onCityPage ? 'WeatherVerse, back to the globe' : 'WeatherVerse'}
      >
        Weather<span>Verse</span>
      </button>

      <div className="header-search">
        <CitySearch onSelect={onSelect} />
      </div>

      <div className="header-controls">
        <UseMyLocationButton onSelect={onSelect} />

        {onCityPage && (
          <button type="button" className="btn" onClick={onBack}>
            <Globe size={16} aria-hidden="true" /> <span className="hidden sm:inline">Back to the globe</span>
            <span className="sm:hidden">Globe</span>
          </button>
        )}

        <div className="unit-toggle" role="group" aria-label="Temperature unit">
          {['c', 'f'].map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
            >{`°${u.toUpperCase()}`}</button>
          ))}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="btn btn-icon"
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label="Graphics quality"
            onClick={() => setMenu((m) => !m)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div
                role="menu"
                aria-label="Graphics quality"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-line bg-deep/95 p-1.5 shadow-2xl backdrop-blur-md"
              >
                <p className="label px-3 pt-2 pb-1.5">Graphics quality</p>
                {QUALITY.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={setting === q.value}
                    onClick={() => {
                      setQuality(q.value)
                      setMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-cloud/10"
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {q.label}
                        {q.value === 'auto' && setting === 'auto' ? ` (${quality} now)` : ''}
                      </span>
                      <span className="block text-xs text-haze">{q.note}</span>
                    </span>
                    {setting === q.value && <Check size={15} className="text-dawn" aria-hidden="true" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
