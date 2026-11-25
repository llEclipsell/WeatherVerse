import { useLayoutEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { cityFromRoute, MY_LOCATION_ID } from '../services/cities'
import { useWeatherStore } from '../store/weatherStore'
import { UseMyLocationButton } from '../components/search/UseMyLocationButton'

import { useWeather } from '../hooks/useWeather'
import { veilOut } from '../animations/cityTransition'
import { CityStory } from '../components/city/CityStory'
import { Analytics } from '../components/dashboard/Analytics'

export default function CityPage({ onBack, onSelect }) {
  const myLocation = useWeatherStore((s) => s.myLocation)
  const { cityId } = useParams()
  const [search] = useSearchParams()
  const city = useMemo(() => cityFromRoute(cityId, search, myLocation), [cityId, search, myLocation])
  const weather = useWeather(city)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    if (!city) veilOut(0.3)
  }, [city])

  if (!city && cityId === MY_LOCATION_ID) {
    return (
      <main className="grid min-h-dvh place-items-center bg-night px-6 text-center">
        <div>
          <h1 className="font-display text-6xl font-extrabold uppercase">Where are you?</h1>
          <p className="mx-auto mt-3 max-w-md text-haze">
            Your location is kept only while this page is open, so it has to be shared again after a reload. You can
            also search for your city.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <UseMyLocationButton onSelect={onSelect} showLabel />
            <button className="btn" onClick={onBack}>
              Back to the globe
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!city) {
    return (
      <main className="grid min-h-dvh place-items-center bg-night px-6 text-center">
        <div>
          <h1 className="font-display text-6xl font-extrabold uppercase">Place not found</h1>
          <p className="mt-3 text-haze">
            This link does not point to a city we can locate. Go back and pick one from the globe or the search.
          </p>
          <button className="btn btn-solid mx-auto mt-6" onClick={onBack}>
            Back to the globe
          </button>
        </div>
      </main>
    )
  }

  const errorMessage = weather.isError ? weather.error.message : null
  const retry = () => void weather.refetch()

  return (
    <main>
      {/* Keyed by city: switching city rebuilds the story from scratch and releases the old image and timelines. */}
      <CityStory
        key={`${city.id}:${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`}
        city={city}
        data={weather.data}
        isPending={weather.isPending}
        errorMessage={errorMessage}
        onRetry={retry}
        onBack={onBack}
      />
      <Analytics city={city} data={weather.data} errorMessage={errorMessage} onRetry={retry} />
    </main>
  )
}
