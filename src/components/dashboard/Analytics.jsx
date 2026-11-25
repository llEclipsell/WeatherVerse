import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'

import { MY_LOCATION_ID } from '../../services/cities'
import { useWeatherStore } from '../../store/weatherStore'
import { CurrentWeather } from './CurrentWeather'
import { WeatherDetails } from './WeatherDetails'
import { HourlyForecast } from './HourlyForecast'
import { MultiDayForecast } from './MultiDayForecast'
import { WeatherAlerts } from './WeatherAlerts'

// The chart library is the heaviest part of this section, so it loads only when the charts scroll near.
const WeatherCharts = lazy(() => import('./WeatherCharts'))

function useNearViewport() {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (near || !ref.current) return
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: '600px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near])
  return [ref, near]
}

export function Analytics({ city, data, errorMessage, onRetry }) {
  const unit = useWeatherStore((s) => s.tempUnit)
  const [chartsRef, chartsNear] = useNearViewport()
  const title = city.id === MY_LOCATION_ID ? data?.place.name || 'Your location' : city.name

  return (
    <section
      id="forecast"
      className="relative z-10 bg-night px-4 pt-20 pb-16 sm:px-8 lg:px-14"
      aria-labelledby="forecast-title"
    >
      <div className="mx-auto max-w-[88rem]">
        <p className="kicker text-dawn">Forecast</p>
        <h2
          id="forecast-title"
          className="mt-1 font-display text-5xl font-extrabold uppercase leading-none sm:text-7xl"
        >
          {title} in detail
        </h2>

        {!data ? (
          errorMessage ? (
            <div role="alert" className="panel mt-10 max-w-xl p-6">
              <p className="text-lg font-medium">The forecast did not load.</p>
              <p className="mt-1 text-haze">{errorMessage}</p>
              <button className="btn btn-solid mt-4" onClick={onRetry}>
                <RotateCw size={15} aria-hidden="true" /> Try again
              </button>
              <div className="mt-6">
                <WeatherAlerts alerts={undefined} failed timezone="UTC" />
              </div>
            </div>
          ) : (
            <div
              className="mt-10 grid gap-3 lg:grid-cols-[minmax(0,26rem)_1fr]"
              role="status"
              aria-label="Loading forecast"
            >
              <div className="panel shimmer h-72" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="panel shimmer h-24" />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="mt-10 space-y-12">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,26rem)_1fr]">
              <CurrentWeather city={city} data={data} unit={unit} />
              <WeatherDetails data={data} />
            </div>
            <WeatherAlerts alerts={data.alerts} failed={false} timezone={data.timezone} />
            <HourlyForecast data={data} unit={unit} />
            <MultiDayForecast data={data} unit={unit} />
            <div ref={chartsRef} className="min-h-72">
              {chartsNear && (
                <Suspense fallback={<div className="panel shimmer h-72" role="status" aria-label="Loading charts" />}>
                  <WeatherCharts data={data} unit={unit} />
                </Suspense>
              )}
            </div>
          </div>
        )}

        <footer className="mt-16 border-t border-line pt-6 font-mono text-xs leading-relaxed text-haze">
          <p>
            Weather data, city search and alerts by{' '}
            <a
              className="underline hover:text-cloud"
              href="https://www.weatherapi.com/"
              target="_blank"
              rel="noreferrer"
            >
              WeatherAPI.com
            </a>
            . All times are local to {title}
            {data ? ` (${data.timezone})` : ''}.
          </p>
          <p>
            City imagery is illustrative and is not a live camera. Earth imagery: Solar System Scope (day) and NASA
            Black Marble (night).
          </p>
        </footer>
      </div>
    </section>
  )
}
