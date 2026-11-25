import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { weatherQuery } from '../services/weatherApi'
import { cityPath } from '../services/cities'
import { preloadCityImage } from '../services/cityImages'
import { globeBridge } from '../animations/globeBridge'
import { setVeilLabel, veilIn, veilOut } from '../animations/cityTransition'
import { useWeatherStore } from '../store/weatherStore'
import { prefersReducedMotion } from './useReducedMotion'

// Only the newest selection is allowed to finish. Older ones resolve and do nothing.
let selectionToken = 0

export function useSelectCity() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  return useCallback(
    async (city) => {
      const token = ++selectionToken
      const store = useWeatherStore.getState()
      store.setHoveredCity(null)
      const fromGlobe = pathname === '/'
      if (fromGlobe) {
        store.setTransitionCity(city)
        store.setExperience('transitioning')
      }

      // The weather request (XHR) and the photograph are independent, so they start together and run
      // alongside the camera move. allSettled: if either one fails, the other is still used, and the
      // city page shows its own error or fallback instead of the transition breaking.
      const loading = Promise.allSettled([queryClient.fetchQuery(weatherQuery(city)), preloadCityImage(city)])

      const reduced = prefersReducedMotion()
      const controller = globeBridge.controller
      if (fromGlobe && controller && !reduced && store.webgl === 'ok') {
        const duration = store.quality === 'low' ? 1.3 : 1.9
        await Promise.all([controller.flyTo(city.latitude, city.longitude, duration), veilIn(0.7, duration - 0.75)])
      } else {
        await veilIn(reduced ? 0.15 : 0.4)
      }
      // Open the city scene once its photograph and weather are both ready. On a slow connection
      // stop waiting after a short while: the city page has its own loading and error states.
      setVeilLabel(`Arriving in ${city.name}`)
      await Promise.race([loading, new Promise((resolve) => window.setTimeout(resolve, 2500))])
      if (token !== selectionToken) return
      const target = cityPath(city)
      const alreadyThere = target === window.location.pathname + window.location.search
      navigate(target)
      // Re-selecting the city that is already open mounts nothing new, so lift the veil here.
      if (alreadyThere) veilOut(0.6)
    },
    [navigate, pathname, queryClient],
  )
}

export function useReturnToGlobe() {
  const navigate = useNavigate()
  return useCallback(async () => {
    ++selectionToken
    await veilIn(prefersReducedMotion() ? 0.15 : 0.35)
    navigate('/')
    window.scrollTo(0, 0)
    veilOut(0.8)
  }, [navigate])
}
