import { lazy, Suspense, useEffect, useState } from 'react'
import { GlobeExperience } from './components/globe/GlobeExperience'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { registerVeil } from './animations/cityTransition'
import { useReturnToGlobe, useSelectCity } from './hooks/useCitySelection'
import { useWeatherStore } from './store/weatherStore'
import { Header } from './components/ui/Header'
import ExplorePage from './pages/ExplorePage'

const CityPage = lazy(() => import('./pages/CityPage'))

export default function App() {
  const { pathname } = useLocation()
  const onCityPage = pathname.startsWith('/city/')
  const experience = useWeatherStore((s) => s.experience)
  const selectCity = useSelectCity()
  const backToGlobe = useReturnToGlobe()
  const [globeWanted, setGlobeWanted] = useState(!onCityPage)

  // Experience manager: the route decides which experience owns the screen.
  useEffect(() => {
    const s = useWeatherStore.getState()
    s.setTransitionCity(null)
    s.setHoveredCity(null)
    s.setExperience(onCityPage ? 'city' : 'explore')
    if (!onCityPage) setGlobeWanted(true)
  }, [onCityPage])

  return (
    <>
      {/* Hidden and paused (not rendering) while a city owns the screen. */}
      <GlobeExperience wanted={globeWanted} onSelect={selectCity} hidden={experience === 'city'} />

      <Header onCityPage={onCityPage} onSelect={selectCity} onBack={backToGlobe} />

      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<ExplorePage onSelect={selectCity} />} />
          <Route path="/city/:cityId" element={<CityPage onBack={backToGlobe} onSelect={selectCity} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <div ref={registerVeil} className="veil">
        <span className="veil-label" role="status" />
      </div>
    </>
  )
}
