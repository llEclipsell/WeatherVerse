import { useEffect, useId, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCircle, MapPin, Search } from 'lucide-react'

import { searchCities } from '../../services/geocodingApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { fmtCoord } from '../../lib/format'

export function CitySearch({ onSelect }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const input = useRef(null)
  const listId = useId()
  const term = useDebouncedValue(text.trim(), 280)
  const enabled = term.length >= 3

  // The query function is the XHR-based search service. TanStack Query passes an AbortSignal, which
  // aborts the XMLHttpRequest of a superseded search, so an old response can never overwrite a newer one.
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['geocode', term.toLowerCase()],
    queryFn: ({ signal }) => searchCities(term, signal),
    enabled,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
  const results = enabled ? (data ?? []) : []

  useEffect(() => setCursor(0), [term])

  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (city) => {
    setText('')
    setOpen(false)
    input.current?.blur()
    onSelect(city)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      input.current?.blur()
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setCursor((c) => (c + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[cursor]
      if (pick) choose(pick)
    }
  }

  const showPanel = open && text.trim().length >= 3
  const waiting = isFetching || term !== text.trim()

  return (
    <div className="relative w-full max-w-sm">
      <label className="search-field">
        <Search size={16} className="shrink-0 text-haze" aria-hidden="true" />
        <span className="sr-only">Search for a city</span>
        <input
          ref={input}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search any city"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[cursor] ? `${listId}-${cursor}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        {waiting && enabled ? (
          <LoaderCircle size={15} className="shrink-0 animate-spin text-haze" aria-hidden="true" />
        ) : (
          <kbd className="hidden rounded border border-line px-1.5 font-mono text-[10px] text-haze sm:block">/</kbd>
        )}
      </label>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-deep/95 shadow-2xl backdrop-blur-md"
          >
            <ul id={listId} role="listbox" aria-label="Matching places">
              {results.map((city, i) => (
                <li
                  key={city.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(city)
                  }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === cursor ? 'bg-cloud/10' : ''}`}
                >
                  <MapPin size={15} className="shrink-0 text-dawn" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{city.name}</span>
                    <span className="block truncate text-xs text-haze">
                      {[city.admin1, city.country].filter(Boolean).join(', ')}
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-haze sm:block">
                    {fmtCoord(city.latitude, city.longitude)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="px-4 py-2.5 text-sm text-haze" role="status">
              {isError
                ? error.message
                : waiting
                  ? results.length
                    ? 'Updating...'
                    : 'Searching...'
                  : results.length === 0
                    ? `No places match "${text.trim()}". Check the spelling or try a nearby city.`
                    : `${results.length} ${results.length === 1 ? 'place' : 'places'}. Region and country are shown to tell them apart.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
