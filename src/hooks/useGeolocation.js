import { useCallback, useState } from 'react'
import { getBrowserLocation } from '../services/geolocation'

/**
 * Asks for the browser location only when `locate` is called (never on page load).
 * Uses then/catch on the geolocation Promise so both outcomes are handled in one place.
 */
export function useGeolocation(onLocated) {
  const [state, setState] = useState({ status: 'idle', message: null })

  const locate = useCallback(() => {
    setState({ status: 'locating', message: null })
    getBrowserLocation()
      .then((coords) => {
        setState({ status: 'idle', message: null })
        onLocated(coords)
      })
      .catch((error) => {
        setState({ status: 'error', message: error.message })
      })
  }, [onLocated])

  const dismiss = useCallback(() => setState({ status: 'idle', message: null }), [])
  return { ...state, locate, dismiss }
}
