import { create } from 'zustand'

function guessQuality() {
  if (typeof navigator === 'undefined') return 'balanced'
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = navigator.deviceMemory ?? 8
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
  if (cores <= 2 || mem <= 2) return 'low'
  if (coarse || cores <= 4 || mem <= 4) return 'balanced'
  return 'high'
}

/** ?quality=high|balanced|low in the address forces a profile, which helps when comparing them. */
function urlQuality() {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('quality')
  return q === 'high' || q === 'balanced' || q === 'low' ? q : null
}

const savedUnit = () => {
  try {
    return localStorage.getItem('wv:unit') === 'f' ? 'f' : 'c'
  } catch {
    return 'c'
  }
}

export const useWeatherStore = create((set, get) => ({
  experience: 'explore',
  transitionCity: null,
  hoveredCityId: null,
  qualitySetting: urlQuality() ?? 'auto',
  quality: urlQuality() ?? guessQuality(),
  tempUnit: savedUnit(),
  webgl: 'ok',
  setExperience: (experience) => set({ experience }),
  setTransitionCity: (transitionCity) => set({ transitionCity }),
  setHoveredCity: (hoveredCityId) => {
    if (get().hoveredCityId !== hoveredCityId) set({ hoveredCityId })
  },
  setQualitySetting: (q) => set({ qualitySetting: q, quality: q === 'auto' ? guessQuality() : q }),
  myLocation: null,
  setMyLocation: (myLocation) => set({ myLocation }),
  setTempUnit: (tempUnit) => {
    try {
      localStorage.setItem('wv:unit', tempUnit)
    } catch {
      /* storage unavailable */
    }
    set({ tempUnit })
  },
  setWebgl: (webgl) => set({ webgl }),
}))
