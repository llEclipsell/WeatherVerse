import { slugify } from '../lib/format'
import { xhrGet } from './xhr'
import { PROXY_ENDPOINT, toWeatherError } from './weatherApi'

/** City lookup through the same proxy and the same XHR helper as the weather. */
export async function searchCities(query, signal) {
  const q = query.trim()
  if (q.length < 3) return []
  const params = new URLSearchParams({ q })
  try {
    const results = await xhrGet(`${PROXY_ENDPOINT}/search.json?${params.toString()}`, { signal })
    if (!Array.isArray(results)) return []
    return results
      .filter((p) => typeof p?.name === 'string' && typeof p.lat === 'number' && typeof p.lon === 'number')
      .map((p) => ({
        id: `${slugify(p.name)}-${p.id ?? `${p.lat.toFixed(2)}_${p.lon.toFixed(2)}`}`,
        name: p.name,
        country: p.country ?? '',
        admin1: p.region || undefined,
        latitude: p.lat,
        longitude: p.lon,
      }))
  } catch (err) {
    throw toWeatherError(err)
  }
}
