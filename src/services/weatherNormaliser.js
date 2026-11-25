/**
 * Turns WeatherAPI.com's forecast.json payload into the app's own shape.
 * This is the only file that knows the provider's field names.
 */

const obj = (v) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null)
const arr = (v) => (Array.isArray(v) ? v : [])
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : null)
const flag = (v) => (v === 1 ? true : v === 0 ? false : null)
const maxOf = (...vals) => {
  const present = vals.filter((v) => v !== null)
  return present.length ? Math.max(...present) : null
}

/** "2026-11-12 9:05" or "2026-11-12 09:05" -> "2026-11-12T09:05". */
export function toLocalIso(value) {
  const m = typeof value === 'string' ? /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/.exec(value) : null
  return m ? `${m[1]}T${m[2].padStart(2, '0')}:${m[3]}` : null
}

/** Astronomy times arrive as "06:42 AM". Returns "YYYY-MM-DDTHH:MM", or null (for example "No sunrise"). */
export function astroToLocalIso(date, value) {
  const m = typeof value === 'string' ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim()) : null
  if (!m) return null
  const hour = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)
  return `${date}T${String(hour).padStart(2, '0')}:${m[2]}`
}

export class InvalidWeatherResponse extends Error {}

function normaliseAlerts(raw) {
  if (!('alerts' in raw)) return { status: 'unsupported', items: [] }
  const list = obj(raw.alerts)?.alert
  if (!Array.isArray(list)) return { status: 'unreadable', items: [] }

  const seen = new Set()
  const items = []
  for (const entry of list) {
    const a = obj(entry)
    if (!a) continue
    const alert = {
      id: '',
      headline: str(a.headline),
      event: str(a.event),
      severity: str(a.severity),
      urgency: str(a.urgency),
      areas: str(a.areas),
      effective: str(a.effective),
      expires: str(a.expires),
      description: str(a.desc),
      instruction: str(a.instruction),
    }
    if (!alert.headline && !alert.event && !alert.description) continue
    // Providers often repeat the same alert once per area. Show each one once.
    alert.id = [alert.headline ?? alert.event, alert.effective, alert.expires].join('|')
    if (seen.has(alert.id)) continue
    seen.add(alert.id)
    items.push(alert)
  }
  return { status: items.length ? 'active' : 'none', items }
}

export function normaliseWeatherResponse(input) {
  const raw = obj(input)
  const location = obj(raw?.location)
  const cur = obj(raw?.current)
  const days = arr(obj(raw?.forecast)?.forecastday)
  const currentTime = toLocalIso(location?.localtime)
  if (!raw || !location || !cur || !currentTime || days.length === 0) {
    throw new InvalidWeatherResponse('The weather service returned an incomplete forecast.')
  }

  const hourly = []
  const daily = []

  for (const entry of days) {
    const fd = obj(entry)
    const date = str(fd?.date)
    if (!fd || !date) continue
    const day = obj(fd.day) ?? {}
    const astro = obj(fd.astro) ?? {}
    const condition = obj(day.condition)
    daily.push({
      date,
      conditionCode: num(condition?.code),
      conditionText: str(condition?.text),
      tempMax: num(day.maxtemp_c),
      tempMin: num(day.mintemp_c),
      sunrise: astroToLocalIso(date, astro.sunrise),
      sunset: astroToLocalIso(date, astro.sunset),
      uvIndexMax: num(day.uv),
      precipitationProbabilityMax: maxOf(num(day.daily_chance_of_rain), num(day.daily_chance_of_snow)),
      precipitationSum: num(day.totalprecip_mm),
      windSpeedMax: num(day.maxwind_kph),
    })
    for (const h of arr(fd.hour)) {
      const hour = obj(h)
      const time = toLocalIso(hour?.time)
      if (!hour || !time) continue
      const hc = obj(hour.condition)
      hourly.push({
        time,
        temperature: num(hour.temp_c),
        feelsLike: num(hour.feelslike_c),
        humidity: num(hour.humidity),
        precipitationProbability: maxOf(num(hour.chance_of_rain), num(hour.chance_of_snow)),
        precipitation: num(hour.precip_mm),
        conditionCode: num(hc?.code),
        conditionText: str(hc?.text),
        cloudCover: num(hour.cloud),
        windSpeed: num(hour.wind_kph),
        windDirection: num(hour.wind_degree),
        uvIndex: num(hour.uv),
        isDay: flag(hour.is_day),
      })
    }
  }
  if (daily.length === 0) throw new InvalidWeatherResponse('The weather service returned no forecast days.')

  // Times are city-local strings without an offset, so the hour bucket is a plain string compare.
  const found = hourly.findIndex((h) => h.time.slice(0, 13) === currentTime.slice(0, 13))
  const nowHour = found >= 0 ? hourly[found] : undefined
  const condition = obj(cur.condition)
  const visKm = num(cur.vis_km)

  const current = {
    time: currentTime,
    temperature: num(cur.temp_c),
    feelsLike: num(cur.feelslike_c),
    humidity: num(cur.humidity),
    conditionCode: num(condition?.code),
    conditionText: str(condition?.text),
    isDay: flag(cur.is_day),
    windSpeed: num(cur.wind_kph),
    windDirection: num(cur.wind_degree),
    windGusts: num(cur.gust_kph),
    cloudCover: num(cur.cloud),
    precipitation: num(cur.precip_mm),
    pressure: num(cur.pressure_mb),
    visibility: visKm === null ? null : visKm * 1000,
    uvIndex: num(cur.uv),
    // The provider gives a chance of precipitation per forecast hour, not for "now".
    precipitationProbability: nowHour?.precipitationProbability ?? null,
  }

  return {
    latitude: num(location.lat) ?? NaN,
    longitude: num(location.lon) ?? NaN,
    place: { name: str(location.name) ?? '', region: str(location.region) ?? '', country: str(location.country) ?? '' },
    timezone: str(location.tz_id) ?? 'UTC',
    current,
    hourly,
    daily,
    alerts: normaliseAlerts(raw),
    nowIndex: found >= 0 ? found : 0,
    fetchedAt: new Date().toISOString(),
  }
}
