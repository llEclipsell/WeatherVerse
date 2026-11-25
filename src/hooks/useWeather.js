import { useQuery } from '@tanstack/react-query'

import { weatherQuery } from '../services/weatherApi'

export function useWeather(city) {
  return useQuery({
    ...weatherQuery(city ?? { latitude: 0, longitude: 0 }),
    enabled: city !== null,
  })
}
