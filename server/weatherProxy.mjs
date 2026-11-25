/**
 * Server-side half of the weather requests. The browser never sees the API key:
 * it sends its XMLHttpRequest to /api/weather/..., and this code adds the key and
 * forwards the request to WeatherAPI.com.
 *
 * Used in two places, so local and live behave the same:
 *   - netlify/functions/weather.mjs on the deployed site
 *   - the Vite dev and preview servers (vite.config.js) on your machine
 */
const ORIGIN = process.env.WEATHERAPI_ORIGIN || 'https://api.weatherapi.com'

// Only these endpoints and parameters are forwarded, so the proxy cannot be used for anything else.
const ENDPOINTS = {
  'forecast.json': ['q', 'days', 'alerts', 'aqi'],
  'search.json': ['q'],
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

export async function proxyWeather(endpoint, params, key) {
  const allowed = ENDPOINTS[endpoint]
  if (!allowed) {
    return json(404, { error: { code: 'proxy-unknown-endpoint', message: 'Unknown weather endpoint.' } })
  }
  if (!key) {
    return json(500, { error: { code: 'proxy-no-key', message: 'The server has no WeatherAPI key.' } })
  }

  const query = new URLSearchParams({ key })
  for (const name of allowed) {
    const value = params.get(name)
    if (value !== null) query.set(name, value.slice(0, 120))
  }

  try {
    const res = await fetch(`${ORIGIN}/v1/${endpoint}?${query}`, { signal: AbortSignal.timeout(9000) })
    return {
      status: res.status,
      contentType: res.headers.get('content-type') || 'application/json',
      body: await res.text(),
    }
  } catch {
    return json(502, { error: { code: 'proxy-upstream', message: 'The weather service could not be reached.' } })
  }
}
