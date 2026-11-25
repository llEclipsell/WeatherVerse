import { isValidCoordinate } from './weatherApi'

/** Curated destinations shown as globe markers. Coordinates are city centres. */
export const CURATED_CITIES = [
  { id: 'london', name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { id: 'paris', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', latitude: 64.1466, longitude: -21.9426 },
  { id: 'new-york', name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
  { id: 'san-francisco', name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'Brazil', latitude: -22.9068, longitude: -43.1729 },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357 },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { id: 'bengaluru', name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { id: 'hyderabad', name: 'Hyderabad', country: 'India', latitude: 17.385, longitude: 78.4867 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
].map((c) => ({ ...c, curated: true }))

export const MY_LOCATION_ID = 'my-location'

export const myLocationCity = (c) => ({
  id: MY_LOCATION_ID,
  name: 'Your location',
  country: '',
  latitude: c.latitude,
  longitude: c.longitude,
})

export const findCurated = (id) => CURATED_CITIES.find((c) => c.id === id)

/** Curated cities get a clean URL; searched places carry their coordinates in the query string. */
export function cityPath(city) {
  // The location route carries no coordinates on purpose.
  if (city.curated || city.id === MY_LOCATION_ID) return `/city/${city.id}`
  const p = new URLSearchParams({
    lat: city.latitude.toFixed(4),
    lon: city.longitude.toFixed(4),
    name: city.name,
  })
  if (city.country) p.set('country', city.country)
  if (city.admin1) p.set('region', city.admin1)
  return `/city/${city.id}?${p}`
}

export function cityFromRoute(id, search, myLocation) {
  if (!id) return null
  if (id === MY_LOCATION_ID) return myLocation ? myLocationCity(myLocation) : null
  const curated = findCurated(id)
  if (curated) return curated
  const lat = Number(search.get('lat'))
  const lon = Number(search.get('lon'))
  const name = search.get('name')
  if (!name || search.get('lat') === null || search.get('lon') === null || !isValidCoordinate(lat, lon)) return null
  return {
    id,
    name,
    latitude: lat,
    longitude: lon,
    country: search.get('country') ?? '',
    admin1: search.get('region') ?? undefined,
  }
}
