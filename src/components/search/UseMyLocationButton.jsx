import { useCallback } from 'react'
import { LoaderCircle, LocateFixed, X } from 'lucide-react'

import { myLocationCity } from '../../services/cities'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useWeatherStore } from '../../store/weatherStore'

/** Permission is requested only when this button is pressed. City search stays available either way. */
export function UseMyLocationButton({ onSelect, showLabel = false }) {
  const onLocated = useCallback(
    (coords) => {
      useWeatherStore.getState().setMyLocation(coords)
      onSelect(myLocationCity(coords))
    },
    [onSelect],
  )
  const { status, message, locate, dismiss } = useGeolocation(onLocated)
  const locating = status === 'locating'

  return (
    <div className="relative">
      <button
        type="button"
        className={`btn ${showLabel ? '' : 'btn-icon lg:w-auto lg:px-[0.95rem]'}`}
        onClick={locate}
        disabled={locating}
        aria-label="Use my location"
        aria-busy={locating}
      >
        {locating ? (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed size={16} aria-hidden="true" />
        )}
        <span className={showLabel ? '' : 'hidden lg:inline'}>{locating ? 'Locating...' : 'Use my location'}</span>
      </button>
      {message && (
        <div
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 flex w-72 items-start gap-2 rounded-xl border border-line bg-deep/95 p-3 text-left text-sm shadow-2xl"
        >
          <p className="flex-1">{message}</p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded p-0.5 text-haze hover:text-cloud"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
