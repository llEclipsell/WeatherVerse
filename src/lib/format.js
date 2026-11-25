export const NA = '--'

export const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'place'

export const toUnit = (celsius, unit) => (unit === 'f' ? celsius * 1.8 + 32 : celsius)

export const fmtTemp = (v, unit, withUnit = false) =>
  v === null ? NA : `${Math.round(toUnit(v, unit))}°${withUnit ? unit.toUpperCase() : ''}`

export const fmtNum = (v, digits = 0, suffix = '') => (v === null ? NA : `${v.toFixed(digits)}${suffix}`)

export const fmtVisibility = (metres) =>
  metres === null ? NA : metres >= 10_000 ? `${Math.round(metres / 1000)} km` : `${(metres / 1000).toFixed(1)} km`

/** "2026-11-11T06:42" -> "06:42". Reads the string directly so the browser timezone never leaks in. */
export const timeHM = (iso) => (iso && iso.length >= 16 ? iso.slice(11, 16) : NA)

export const minutesOfDay = (iso) => {
  if (!iso || iso.length < 16) return null
  const h = Number(iso.slice(11, 13)),
    m = Number(iso.slice(14, 16))
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

const parseLocalDate = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
}
const dayFmt = (opts) => new Intl.DateTimeFormat('en', { ...opts, timeZone: 'UTC' })
const WEEKDAY = dayFmt({ weekday: 'short' })
const WEEKDAY_LONG = dayFmt({ weekday: 'long' })
const DATE = dayFmt({ day: 'numeric', month: 'short' })

export const weekdayShort = (iso) => WEEKDAY.format(parseLocalDate(iso))
export const weekdayLong = (iso) => WEEKDAY_LONG.format(parseLocalDate(iso))
export const dateShort = (iso) => DATE.format(parseLocalDate(iso))

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export const compass = (deg) => (deg === null ? NA : POINTS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16])

export const uvLabel = (uv) =>
  uv === null ? NA : uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme'

export const fmtCoord = (lat, lon) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`

/** Short zone label for an IANA timezone, for example "JST" or "GMT+5:30". Empty if the zone is unknown. */
export const tzLabel = (timeZone) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

/** Formats an absolute instant (ISO with offset) in the given city's timezone. */
export const instantInZone = (iso, timeZone) => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(date)
  } catch {
    return iso
  }
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
