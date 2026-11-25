import { lazy, Suspense } from 'react'

import { useWeatherStore } from '../../store/weatherStore'

// three.js and the globe only download when the globe is actually shown.
const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

/**
 * The opening experience: a full-viewport stage (100vw by 100dvh) that the planet fills.
 * It is a fixed layer behind the floating controls, never a card inside a page.
 */
export function GlobeExperience({ wanted, onSelect, hidden }) {
  const webgl = useWeatherStore((s) => s.webgl)
  return (
    <div className="globe-layer" style={{ visibility: hidden ? 'hidden' : 'visible' }} aria-hidden={hidden}>
      {wanted && webgl !== 'unsupported' && (
        <Suspense
          fallback={
            <p className="globe-loading" role="status">
              Loading the globe...
            </p>
          }
        >
          <GlobeCanvas onSelect={onSelect} />
        </Suspense>
      )}
    </div>
  )
}
