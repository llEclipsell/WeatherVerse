# Project 10: Weather Dashboard - where each requirement lives

Use this as the script for the demonstration. Every line points at the file to open.

| Requirement | Where it is | What to show |
|---|---|---|
| XMLHttpRequest for API calls | `src/services/xhr.js` | `new XMLHttpRequest()`, `open`, `send`, `onload`, `onerror`, `ontimeout`, `onabort`. In DevTools > Network, the weather and search requests have type `xhr`. There is no `fetch()` for API data anywhere. |
| Promises (construct, resolve, reject) | `src/services/xhr.js`, `src/services/geolocation.js`, `src/services/cityImages.js` (`preloadCityImage`) | `new Promise((resolve, reject) => ...)` wrapping callback APIs. |
| then / catch | `src/hooks/useGeolocation.js` | `getBrowserLocation().then(...).catch(...)`. |
| async / await with try / catch | `src/services/weatherApi.js` (`getWeatherByCoordinates`), `src/services/geocodingApi.js` (`searchCities`) | `await xhrGet(...)` inside `try`, errors mapped in `catch`. |
| Promise.allSettled / Promise.race | `src/hooks/useCitySelection.js` | Weather request and city photograph load independently; one failing does not block the other. |
| JSON parsing | `src/services/xhr.js` | `JSON.parse(xhr.responseText)` with invalid JSON handled. |
| JSON manipulation | `src/services/weatherNormaliser.js` | Flattens forecast days into hourly and daily lists, converts time formats, de-duplicates alerts, keeps missing values as `null`. |
| Public weather API | `src/services/weatherApi.js`, `server/weatherProxy.mjs` | WeatherAPI.com `forecast.json`: one request returns current, forecast and alerts. The browser's XHR goes to `/api/weather`; a server-side proxy adds the API key so it is never exposed. |
| Current weather | `src/components/city/CityStory.jsx`, `src/components/dashboard/CurrentWeather.jsx`, `WeatherDetails.jsx` | Story chapter 1 and the "in detail" panel. |
| Multi-day forecast | `src/components/dashboard/MultiDayForecast.jsx`, `HourlyForecast.jsx` | Title shows how many days the API plan returned. |
| Weather alerts | `src/components/dashboard/WeatherAlerts.jsx` | Four separate states: alerts shown, none active, not included in plan, request failed. |
| Search by city name | `src/components/search/CitySearch.jsx`, `src/services/geocodingApi.js` | Debounced, region and country shown, older requests aborted. |
| Browser geolocation | `src/services/geolocation.js`, `src/components/search/UseMyLocationButton.jsx` | Permission asked only on click; denial, timeout and unavailable each have a message. |
| Network and API error handling | `src/services/weatherApi.js` (`toWeatherError`) | Try: no key, wrong key, offline (DevTools > Network > Offline). |
| Charts (Chart.js) | `src/components/dashboard/WeatherCharts.jsx` | Temperature, chance of precipitation, wind. |
| City photographs | `src/services/cityImages.js`, `public/images/cities/` | Mapping, default image fallback, credits file. |
| Responsive CSS and animation | `src/index.css`, `src/animations/` | Resize the window; reduced-motion setting is respected. |

## Quick error demonstrations

1. Remove `WEATHERAPI_KEY` from `.env.local` and restart: the page says no key is set on the server.
2. Put a wrong key: "The WeatherAPI key was rejected" (HTTP 401/403 handled, not treated as success).
3. DevTools > Network > Offline, pick a city: "Could not reach the weather service", alerts section says the request failed.
4. Block location permission and press "Use my location": the denial message appears and search still works.

## Language

The project is plain JavaScript (ES modules) with React for the interface. The five service files
(`xhr`, `weatherApi`, `weatherNormaliser`, `geocodingApi`, `geolocation`) do not import React or
three.js, so they can be read and demonstrated on their own.

## Shape of the normalised weather object

`normaliseWeatherResponse()` returns one object that every component reads:

    {
      place:    { name, region, country },
      timezone: "Asia/Kolkata",
      current:  { time, temperature, feelsLike, humidity, conditionCode, conditionText, isDay,
                  windSpeed, windDirection, windGusts, cloudCover, precipitation, pressure,
                  visibility, uvIndex, precipitationProbability },
      hourly:   [ { time, temperature, feelsLike, humidity, precipitationProbability, ... } ],
      daily:    [ { date, tempMax, tempMin, sunrise, sunset, uvIndexMax, ... } ],
      alerts:   { status: "active" | "none" | "unsupported" | "unreadable", items: [ ... ] },
      nowIndex, fetchedAt
    }

Any measured value the provider did not send is `null`, and the interface shows it as unavailable.
