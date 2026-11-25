import { xhrGet, XhrError } from './xhr'
import { InvalidWeatherResponse, normaliseWeatherResponse } from './weatherNormaliser'

/**
 * Weather provider: WeatherAPI.com, reached through our own proxy at /api/weather.
 * The proxy (server/weatherProxy.mjs) adds the API key on the server, so the key is never in the browser.
 * One forecast.json request returns current conditions, the multi-day forecast and alerts,
 * so there is exactly one XHR per city (no duplicate requests).
 */
export const PROXY_ENDPOINT = '/api/weather'
const FORECAST_DAYS = 7 // The API returns as many of these as the key's plan allows (3 on the free plan).

export class WeatherError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = 'WeatherError'
    this.kind = kind
  }
}

export function isValidCoordinate(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
}

function buildWeatherUrl(lat, lon) {
  const params = new URLSearchParams({
    q: `${lat.toFixed(4)},${lon.toFixed(4)}`,
    days: String(FORECAST_DAYS),
    alerts: 'yes',
    aqi: 'no',
  })
  return `${PROXY_ENDPOINT}/forecast.json?${params.toString()}`
}

/** Maps a failed XHR to a message a person can act on. Aborts pass through untouched. */
export function toWeatherError(err) {
  if (err instanceof WeatherError) return err
  if (err instanceof InvalidWeatherResponse) return new WeatherError('invalid', err.message)
  if (!(err instanceof XhrError) || err.kind === 'abort') return err
  switch (err.kind) {
    case 'network':
      return new WeatherError('network', 'Could not reach the weather service. Check your connection.')
    case 'timeout':
      return new WeatherError('timeout', 'The weather service took too long to answer. Try again.')
    case 'parse':
      return new WeatherError('invalid', 'The weather service sent a response that could not be read.')
    default:
      break
  }
  // WeatherAPI error bodies look like { "error": { "code": 2006, "message": "API key is invalid." } }
  const body = err.body
  const code = body?.error?.code
  const detail = body?.error?.message
  if (code === 'proxy-no-key') {
    return new WeatherError(
      'config',
      'No WeatherAPI key is set on the server. Add WEATHERAPI_KEY to .env.local (or to the Netlify site settings).',
    )
  }
  if (code === 'proxy-upstream') {
    return new WeatherError('network', 'The weather service could not be reached. Try again in a moment.')
  }
  if (code === 1002 || code === 2006 || code === 2008 || err.status === 401) {
    return new WeatherError('auth', 'The WeatherAPI key was rejected. Check WEATHERAPI_KEY in .env.local or the Netlify site settings.')
  }
  if (code === 2007 || code === 2009) {
    return new WeatherError('quota', detail ?? 'The WeatherAPI plan limit was reached for this key.')
  }
  if (code === 1006) return new WeatherError('not-found', 'The weather service has no data for this location.')
  return new WeatherError('http', detail ?? `The weather service responded with an error (${err.status}).`)
}

/** Current conditions + multi-day forecast + alerts for a point. Awaits an XMLHttpRequest. */
export async function getWeatherByCoordinates(lat, lon, signal) {
  if (!isValidCoordinate(lat, lon)) throw new WeatherError('invalid', 'These coordinates are not valid.')
  try {
    const rawData = await xhrGet(buildWeatherUrl(lat, lon), { signal })
    return normaliseWeatherResponse(rawData)
  } catch (err) {
    throw toWeatherError(err)
  }
}

/** Coordinates are rounded so nearby selections of the same place share one cache entry. */
export const weatherKey = (city) => ['weather', city.latitude.toFixed(3), city.longitude.toFixed(3)]

/** TanStack Query only adds caching and de-duplication. The request itself is the XHR service above. */
export const weatherQuery = (city) => ({
  queryKey: weatherKey(city),
  queryFn: ({ signal }) => getWeatherByCoordinates(city.latitude, city.longitude, signal),
  staleTime: 10 * 60_000,
  gcTime: 45 * 60_000,
  retry: (failures, error) =>
    failures < 1 && error instanceof WeatherError && (error.kind === 'network' || error.kind === 'timeout'),
})
