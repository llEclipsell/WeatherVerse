# WeatherVerse

An immersive weather explorer: a navigable 3D Earth, a cinematic dive into a city,
a pinned scroll story driven by live conditions, and a plain forecast section.

## Run it

    npm install
    copy .env.example .env.local     (macOS/Linux: cp .env.example .env.local)
    # paste your WeatherAPI.com key into .env.local
    npm run fetch:images             # one time: imports the 15 city photographs
    npm run dev                      # http://localhost:5173

`npm run build` builds into dist/. Needs Node 20 or newer.

Get a free key at https://www.weatherapi.com/ and put it in `.env.local` as `WEATHERAPI_KEY`.
`.env.local` is git-ignored.

### How the key stays private

The browser never sees the key. Every request goes, by XMLHttpRequest, to our own path
`/api/weather/forecast.json` or `/api/weather/search.json`. A small proxy
(`server/weatherProxy.mjs`) adds the key on the server and forwards the request to WeatherAPI.com.
It only forwards those two endpoints and their known parameters.

- On your machine, `npm run dev` and `npm run preview` run the proxy inside the Vite server
  (`vite.config.js`), reading `WEATHERAPI_KEY` from `.env.local`.
- On Netlify, `netlify/functions/weather.mjs` runs the same proxy as a serverless function.
  `netlify.toml` routes `/api/weather/*` to it.

## Deploy to Netlify

1. Push to GitHub and import the repository in Netlify. Build settings come from `netlify.toml`.
2. In Site configuration > Environment variables, add `WEATHERAPI_KEY` with your key.
   Do not name it `VITE_...`: that prefix is what puts a variable into the browser bundle.
3. Deploy. Check that a city loads, that refreshing `/city/tokyo` works, and in DevTools > Network
   that the requests go to `/api/weather/...` with no `key=` in the address.

For the assignment walkthrough (XHR, Promises, async/await, JSON, geolocation, alerts) see
`docs/ASSIGNMENT.md`.

## Stack

JavaScript (ES modules), React 19, Vite 8, Tailwind CSS 4, three + React Three Fiber 9 + Drei 10,
GSAP + ScrollTrigger, Framer Motion, Zustand, TanStack Query (caching only; its query functions
call the XHR service), Chart.js 4, React Router 7, lucide-react.

## The Earth

The globe is the opening screen: a fixed 100vw by 100dvh stage with floating controls on top.
It is built from separate layers in `src/components/globe/`, all sharing one sphere geometry, one
simulated sun and one set of textures (`earthTextures.js`):

| File | Layer |
|---|---|
| `EarthSurface.jsx` | Day map lit by the sun, terrain shading from the height map, ocean sun glint, cloud shadows |
| `EarthNightLights.jsx` | City lights, added only where the sun does not reach |
| `EarthClouds.jsx` | See-through cloud sphere just above the surface, drifting slowly |
| `EarthAtmosphere.jsx` | Thin blue haze over the limb and a narrow rim glow outside it |
| `StarField.jsx` | Sparse, dim stars in one draw call |
| `CityMarkers.jsx` | Markers placed from latitude and longitude, never by eye |
| `Earth.jsx` | Puts the layers in a slowly turning group |
| `GlobeCamera.jsx` | Orbit controls (no panning, limited zoom) and the fly-to move |
| `GlobeCanvas.jsx`, `GlobeExperience.jsx` | Canvas, quality profile, render loop, full-screen stage |

The sun is simulated, not real time: it is placed relative to the opening view so most of the disc
is lit and the day-night line is in frame. Turn the globe to see the night side.

Useful address parameters: `?stats` shows frame rate, draw calls, triangles and live GPU textures
(from three's renderer.info); `?quality=high|balanced|low` forces a profile.

### Texture memory

Approximate GPU memory for the Earth textures (uncompressed RGBA with mipmaps):

| Profile | Day | Night | Detail | About |
|---|---|---|---|---|
| High | 8K | 4K | 4K | 510 MB |
| Balanced | 4K | 2K | 2K | 130 MB |
| Low | 2K | 2K | 1K | 50 MB |

These are calculated, not measured. The blueprint suggests starting high at 4K; this build uses 8K
on high because you asked for a sharper globe. If your laptop struggles, choose Balanced, or
change `FILES.high.day` in `earthTextures.js` to the 4K file. KTX2 compression would cut GPU
memory by roughly four to six times and is the next step if memory is a problem.

## Weather data

- Provider: WeatherAPI.com. `forecast.json` returns current conditions, the forecast and alerts in
  one response, so each city costs one XMLHttpRequest. `search.json` powers city search.
- The app asks for 7 forecast days and shows however many the key's plan returns (the free plan
  has returned 3). The forecast title and charts adapt.
- Alerts depend on the plan and on the country's agencies. The alerts panel says which of four
  things happened: alerts returned, none active, not included in the response, or request failed.
- To switch to OpenWeatherMap, only `weatherApi.js`, `weatherNormaliser.js`, `geocodingApi.js` and
  the code table in `lib/weatherCodes.js` change. Nothing else knows the provider.

## City photographs

    public/images/cities/<city-key>/hero.webp     one per curated city
    public/images/cities/default-city.webp        used for every other place and as the fallback
    src/services/cityImages.js                    key -> image, alt text, crop position
    src/services/cityImageCredits.json            credit, licence and source per photo
    scripts/city-photos.json                      which Wikimedia Commons file each city uses

`npm run fetch:images` downloads the 15 pinned Commons files, converts them to 2400 px WebP and
fills in the credits file. A photo is only used once its credit is recorded; until then, and if a
file is missing or fails to load, the default image is shown. To change a picture, edit the
`File:` title in `city-photos.json` and run `npm run fetch:images -- <city-key>`. To add your own,
save `hero.webp` in a new folder, add the key in `cityImages.js` and a credit entry by hand.
Use `position` in `cityImages.js` (CSS object-position) if a crop cuts off the subject.

## How it is organised

    src/
      animations/   globeBridge (DOM <-> 3D), cityTransition (veil), scrollAnimations (story timelines)
      components/
        globe/      see "The Earth" above
        city/       CityStory, CityScene, CityImage, WeatherEffects, WeatherOverlay, StoryChapter
        dashboard/  Analytics, CurrentWeather, WeatherDetails, WeatherAlerts, HourlyForecast, MultiDayForecast, WeatherCharts
        search/     CitySearch, UseMyLocationButton
        ui/         Header
      hooks/        useWeather, useCitySelection, useGeolocation, useReducedMotion, useMediaQuery, ...
      lib/          format, weatherCodes (single condition-code map), storyDerive, gsap
      pages/        ExplorePage, CityPage
      services/     xhr, weatherApi, weatherNormaliser, geocodingApi, geolocation, cities, cityImages
      store/        weatherStore (Zustand)
    server/         weatherProxy.mjs - adds the API key on the server side
    netlify/        functions/weather.mjs - the proxy as a Netlify Function
    assets-src/     untouched original textures (not served)
    scripts/        fetch-city-images, build-textures, check-geo

Who owns what:

- GSAP owns the camera flight, the veil and the whole city story timeline.
- Framer Motion owns small interface motion only (search results, menu, explore panels).
- React Three Fiber owns the 3D scene. CSS owns hover and colour transitions.
- No element has the same property animated by two systems.

## Behaviour worth knowing

- **Experience manager.** The route decides which experience owns the screen.
  While a city is open the globe canvas is hidden and its frame loop is set to
  `never`, so it costs no GPU time. three.js itself is a lazy chunk that is not
  downloaded at all if someone opens a city link directly.
- **Transition.** Selecting a city starts the weather request (XHR) and the photograph together,
  flies the camera to the city, and cuts through a dark-blue veil into the photograph. The city
  opens when both are ready, or after 2.5 seconds at most with its own loading states. If you
  pick another city mid-flight, only the newest one completes.
- **Story.** On screens at least 900 px wide the stage is pinned and one scrubbed
  timeline re-frames a single image element through four chapters. On small
  screens, and with reduced motion, nothing is pinned: the scene sticks behind
  normally scrolling chapters. Fog, storm tint, rain, snow and wind streaks are
  scaled from the live values; with no data the scene stays neutral.
- **Data.** Components only see normalised types. Every measured field is
  `number | null`; missing values render as "--" or "Unavailable", never zero.
  All times are read from the API's local time strings, so they are always in the
  city's timezone regardless of the browser's.
- **Quality.** Auto picks high, balanced or low from device signals; it can be set by hand from
  the header. It sets the Earth textures, sphere detail, terrain and cloud shading, stars and
  particle counts. The frame-rate monitor only lowers render resolution; it never swaps textures.
- **Globe textures.** Loaded by hand and swapped in place: a 2K day map shows first, then the
  full one replaces it. No layer is removed while a texture loads.
- **Location privacy.** "Use my location" keeps coordinates in memory only. They are not written
  to the URL or to storage, so a reload asks again.
- **Fallbacks.** No WebGL: the city list and search still work over a static
  planet. Lost WebGL context: a message explains and the list stays usable.

## What was checked, and what was not

Checked in a headless Chromium run against the production build, with provider responses mocked
in WeatherAPI's shape: the new globe from the day side, night side and close zoom, the Cities
drawer, fly-to and transition, the city story with the imported photographs, alerts in all states,
search, geolocation (success, denial, reload), missing key, HTTP 401 and 500, network failure and
invalid JSON. `npm run check:geo` passes for London, Tokyo, Mumbai, Bengaluru, New York and Sydney.

Not checked here, so measure on your machine:

- Frame rate and GPU memory. The test browser used a software renderer at 2 to 5 fps, which says
  nothing about a real GPU. Open `/?stats`, try each profile, and use Chrome's Performance and
  Memory panels while turning the globe, flying to a city, switching cities and coming back.
- A lower-powered device and a phone (touch rotation and pinch zoom).
- Live WeatherAPI responses beyond what you have already seen with your key.

## Credits and licences

See `ASSET_CREDITS.md` for every asset, its source and what its licence requires.

## Ideas left out on purpose

KTX2/Basis textures, a physically based scattering shader, 3D city models, user accounts
and a backend. The blueprint lists these as later work; none is needed for the MVP.
