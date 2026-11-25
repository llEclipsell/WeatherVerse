import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'

import { useWeatherStore } from '../../store/weatherStore'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { usePageVisible } from '../../hooks/usePageVisible'
import { Earth } from './Earth'
import { earthUniforms } from './earthTextures'
import { StarField } from './StarField'
import { CityMarkers } from './CityMarkers'
import { GlobeCamera, FOV, distanceForAspect } from './GlobeCamera'
import { GlobeStats } from './GlobeStats'
import { latLonToVector3, sunFromCamera } from './geo'

const DPR_CAP = { high: 2, balanced: 1.5, low: 1 }
const STARS = { high: 1600, balanced: 1000, low: 450 }
const SHOW_STATS = new URLSearchParams(window.location.search).has('stats')

export default function GlobeCanvas({ onSelect }) {
  const quality = useWeatherStore((s) => s.quality)
  const experience = useWeatherStore((s) => s.experience)
  const hovering = useWeatherStore((s) => s.hoveredCityId !== null)
  const setWebgl = useWeatherStore((s) => s.setWebgl)
  const reduced = useReducedMotion()
  const visible = usePageVisible()

  // The frame-rate monitor only ever lowers the render resolution. It never swaps textures.
  const [dprFactor, setDprFactor] = useState(1)
  const cap = Math.min(DPR_CAP[quality], window.devicePixelRatio || 1)
  const dpr = Math.max(0.75, Math.round((0.6 + 0.4 * dprFactor) * cap * 10) / 10)

  // Experience manager for the 3D layer: nothing renders while the city story owns the screen.
  // With motion on, the planet turns, so frames are continuous. With reduced motion or the low
  // profile the scene is still, and a frame is drawn only when something changes.
  const active = experience !== 'city' && visible
  const ambient = !reduced && quality !== 'low'
  const frameloop = !active ? 'never' : ambient || experience === 'transitioning' ? 'always' : 'demand'

  // Open on the side of the planet the visitor is on, judged from their clock offset,
  // and place the simulated sun relative to that first view.
  const initialPosition = useMemo(() => {
    const lon = (-new Date().getTimezoneOffset() / 60) * 15
    const d = distanceForAspect(window.innerWidth / window.innerHeight) + 2.4
    const position = latLonToVector3(16, lon, d)
    sunFromCamera(position, earthUniforms.sunDir.value)
    return position.toArray()
  }, [])

  return (
    <Canvas
      flat
      frameloop={frameloop}
      dpr={dpr}
      camera={{ fov: FOV, near: 0.05, far: 300, position: initialPosition }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl, invalidate }) => {
        const el = gl.domElement
        el.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          setWebgl('lost')
        })
        el.addEventListener('webglcontextrestored', () => {
          setWebgl('ok')
          invalidate()
        })
      }}
      aria-label="Interactive 3D globe. Drag to rotate, scroll or pinch to zoom. Cities are also available from the Cities button."
      role="img"
    >
      <color attach="background" args={['#02040b']} />
      <PerformanceMonitor onChange={({ factor }) => setDprFactor(factor)} />
      <StarField count={STARS[quality]} />
      <Earth quality={quality} spin={ambient && experience === 'explore' && !hovering} drift={ambient}>
        <CityMarkers onSelect={onSelect} animate={ambient} />
      </Earth>
      <GlobeCamera />
      {SHOW_STATS && <GlobeStats quality={quality} />}
    </Canvas>
  )
}
