import creditsJson from './cityImageCredits.json'

/**
 * City key -> curated photograph bundled with the project.
 *
 * To add a city photograph:
 *   1. Save it as public/images/cities/<city-key>/hero.webp (wide landscape, about 2400 px).
 *   2. Add the key below with alt text and, if the crop needs it, an object-position.
 *   3. Record credit, licence and source in cityImageCredits.json.
 * `npm run fetch:images` does steps 1 and 3 for the curated cities.
 *
 * A photograph is only used once its licence is recorded. Everything else gets the default image.
 */

const cityImages = {
  london: { hero: '/images/cities/london/hero.webp', alt: 'London skyline' },
  paris: { hero: '/images/cities/paris/hero.webp', alt: 'Paris skyline' },
  reykjavik: { hero: '/images/cities/reykjavik/hero.webp', alt: 'Reykjavik cityscape' },
  'new-york': { hero: '/images/cities/new-york/hero.webp', alt: 'New York City skyline' },
  'san-francisco': { hero: '/images/cities/san-francisco/hero.webp', alt: 'San Francisco skyline' },
  'rio-de-janeiro': { hero: '/images/cities/rio-de-janeiro/hero.webp', alt: 'Rio de Janeiro cityscape' },
  'cape-town': { hero: '/images/cities/cape-town/hero.webp', alt: 'Cape Town cityscape' },
  cairo: { hero: '/images/cities/cairo/hero.webp', alt: 'Cairo skyline' },
  dubai: { hero: '/images/cities/dubai/hero.webp', alt: 'Dubai skyline' },
  mumbai: { hero: '/images/cities/mumbai/hero.webp', alt: 'Mumbai skyline' },
  bengaluru: { hero: '/images/cities/bengaluru/hero.webp', alt: 'Bengaluru cityscape' },
  hyderabad: { hero: '/images/cities/hyderabad/hero.webp', alt: 'Hyderabad cityscape' },
  singapore: { hero: '/images/cities/singapore/hero.webp', alt: 'Singapore skyline' },
  tokyo: { hero: '/images/cities/tokyo/hero.webp', alt: 'Tokyo skyline' },
  sydney: { hero: '/images/cities/sydney/hero.webp', alt: 'Sydney skyline' },
}

const credits = creditsJson

export const DEFAULT_CITY_IMAGE = '/images/cities/default-city.webp'

export function getCityImage(cityKey) {
  const entry = cityImages[cityKey]
  const credit = credits[cityKey]
  if (!entry || !credit) {
    return {
      src: DEFAULT_CITY_IMAGE,
      fallbackSrc: DEFAULT_CITY_IMAGE,
      alt: 'Illustrated city skyline at dusk',
      position: '50% 50%',
      isPhoto: false,
      credit: 'Illustration',
    }
  }
  return {
    src: entry.hero,
    fallbackSrc: DEFAULT_CITY_IMAGE,
    alt: entry.alt,
    position: entry.position ?? credit.position ?? '50% 50%',
    isPhoto: true,
    credit: [credit.credit, credit.license].filter(Boolean).join(' / ') || 'Photograph',
    source: credit.source,
  }
}

/** Starts loading the selected city's image. Resolves when it has loaded and rejects if it cannot. */
export function preloadCityImage(city) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`The image for ${city.name} did not load.`))
    img.src = getCityImage(city.id).src
  })
}
