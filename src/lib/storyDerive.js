import { clamp01, minutesOfDay } from './format'
import { effectForCode } from './weatherCodes'

const NEUTRAL = {
  isNight: false,
  fog: 0.12,
  storm: 0,
  fxKind: 'none',
  fxIntensity: 0,
  slant: 0,
  nextSun: 'sunset',
  dayProgress: null,
}

/** Maps real conditions to the scene treatment. With no data the scene stays neutral: no invented weather. */
export function deriveLook(data) {
  if (!data) return NEUTRAL
  const c = data.current
  const effect = effectForCode(c.conditionCode)
  const wind = c.windSpeed ?? 0
  const precip = c.precipitation ?? 0
  const wet = effect === 'rain' || effect === 'drizzle' || effect === 'storm'

  let fxKind = 'none'
  let fxIntensity = 0
  if (effect === 'snow') {
    fxKind = 'snow'
    fxIntensity = clamp01(0.45 + precip / 4)
  } else if (wet || precip > 0) {
    fxKind = 'rain'
    fxIntensity = clamp01((effect === 'drizzle' ? 0.25 : 0.4) + precip / 5)
  } else if (wind >= 14) {
    fxKind = 'wind'
    fxIntensity = clamp01(wind / 55)
  }

  const fog = clamp01(
    0.05 + ((c.cloudCover ?? 20) / 100) * 0.36 + (effect === 'fog' ? 0.4 : 0) + ((c.humidity ?? 0) > 88 ? 0.08 : 0),
  )
  const storm = wet || effect === 'snow' ? (effect === 'storm' ? 0.75 : 0.5) : clamp01(wind / 70) * 0.35

  const dirRad = ((c.windDirection ?? 270) * Math.PI) / 180
  // Direction is where the wind comes from, so streaks travel the opposite way.
  const slant = -Math.sin(dirRad) * clamp01(wind / 40)

  const today = data.daily[0]
  const now = minutesOfDay(c.time)
  const rise = minutesOfDay(today?.sunrise)
  const set = minutesOfDay(today?.sunset)
  let dayProgress = null
  let nextSun = 'sunset'
  if (now !== null && rise !== null && set !== null && set > rise) {
    if (now >= rise && now <= set) dayProgress = (now - rise) / (set - rise)
    else nextSun = 'sunrise'
  }
  return { isNight: c.isDay === false, fog, storm, fxKind, fxIntensity, slant, nextSun, dayProgress }
}

export function airPhrase(humidity) {
  if (humidity === null) return 'Humidity is unavailable right now.'
  if (humidity >= 85) return 'The air is heavy with moisture.'
  if (humidity >= 60) return 'There is some moisture in the air.'
  if (humidity >= 35) return 'The air is comfortable.'
  return 'The air is dry.'
}

export function windPhrase(speed) {
  if (speed === null) return 'Wind speed is unavailable right now.'
  if (speed < 6) return 'Barely a breath of wind.'
  if (speed < 20) return 'A light breeze is moving through.'
  if (speed < 39) return 'A fresh breeze you would notice outside.'
  if (speed < 62) return 'Strong wind. Loose things will move.'
  return 'Gale-force wind.'
}
