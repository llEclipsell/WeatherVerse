import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CircleGeometry, MeshBasicMaterial, Quaternion, RingGeometry, SphereGeometry, Vector3 } from 'three'

import { CURATED_CITIES } from '../../services/cities'
import { useWeatherStore } from '../../store/weatherStore'
import { latLonToVector3 } from './geo'

const OUT = new Vector3(0, 0, 1)
const ACCENT = '#ffb26b'

export function CityMarkers({ onSelect, animate }) {
  const hoveredId = useWeatherStore((s) => s.hoveredCityId)
  const setHovered = useWeatherStore((s) => s.setHoveredCity)
  const transitionCity = useWeatherStore((s) => s.transitionCity)
  const interactive = useWeatherStore((s) => s.experience === 'explore')
  const rings = useRef([])

  const placed = useMemo(() => {
    const list = transitionCity && !transitionCity.curated ? [...CURATED_CITIES, transitionCity] : CURATED_CITIES
    return list.map((city) => {
      const normal = latLonToVector3(city.latitude, city.longitude, 1)
      return {
        city,
        position: normal.clone().multiplyScalar(1.016),
        quaternion: new Quaternion().setFromUnitVectors(OUT, normal),
      }
    })
  }, [transitionCity])

  // Every marker reuses the same three geometries and the same dot and hit-area materials.
  const shared = useMemo(
    () => ({
      dot: new CircleGeometry(0.0075, 20),
      ring: new RingGeometry(0.011, 0.0135, 40),
      hit: new SphereGeometry(0.045, 10, 10),
      dotMaterial: new MeshBasicMaterial({ color: ACCENT, toneMapped: false, depthWrite: false, transparent: true }),
      activeMaterial: new MeshBasicMaterial({
        color: '#ffffff',
        toneMapped: false,
        depthWrite: false,
        transparent: true,
      }),
      hitMaterial: new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  )
  useEffect(() => () => Object.values(shared).forEach((item) => item.dispose()), [shared])

  // One loop drives every pulse through refs. No React state changes per frame.
  useFrame(({ clock }) => {
    if (!animate) return
    const t = clock.elapsedTime
    for (let i = 0; i < rings.current.length; i++) {
      const ring = rings.current[i]
      if (!ring) continue
      const phase = (t * 0.45 + i * 0.37) % 1
      ring.scale.setScalar(1 + phase * 1.7)
      ring.material.opacity = (1 - phase) * 0.8
    }
  })

  const labelled = placed.find((p) => p.city.id === (transitionCity?.id ?? hoveredId))

  return (
    <group>
      {placed.map(({ city, position, quaternion }, i) => {
        const active = city.id === hoveredId || city.id === transitionCity?.id
        return (
          <group key={city.id} position={position} quaternion={quaternion}>
            <mesh
              renderOrder={5}
              scale={active ? 1.7 : 1}
              geometry={shared.dot}
              material={active ? shared.activeMaterial : shared.dotMaterial}
            />
            <mesh
              ref={(m) => {
                rings.current[i] = m
              }}
              renderOrder={5}
              geometry={shared.ring}
            >
              <meshBasicMaterial color={ACCENT} transparent opacity={0.8} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh
              geometry={shared.hit}
              material={shared.hitMaterial}
              onPointerOver={(e) => {
                if (!interactive) return
                e.stopPropagation()
                setHovered(city.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHovered(null)
                document.body.style.cursor = ''
              }}
              onClick={(e) => {
                if (!interactive) return
                e.stopPropagation()
                document.body.style.cursor = ''
                onSelect(city)
              }}
            />
          </group>
        )
      })}
      {labelled && (
        <Html position={labelled.position} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className="marker-label">
            <span>{labelled.city.name}</span>
            <small>{labelled.city.country}</small>
          </div>
        </Html>
      )}
    </group>
  )
}
