import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { SphereGeometry } from 'three'

import { globeBridge } from '../../animations/globeBridge'
import { useEarthTextures } from './earthTextures'
import { EarthSurface } from './EarthSurface'
import { EarthNightLights } from './EarthNightLights'
import { EarthClouds } from './EarthClouds'
import { EarthAtmosphere } from './EarthAtmosphere'

const SEGMENTS = { high: 160, balanced: 112, low: 72 }
const LOOK = {
  high: { relief: 2.4, cloudOpacity: 0.82, cloudShading: true },
  balanced: { relief: 2.0, cloudOpacity: 0.8, cloudShading: true },
  low: { relief: 0, cloudOpacity: 0.7, cloudShading: false },
}
const SPIN = 0.018 // radians per second: one turn in about six minutes

/**
 * The planet, assembled from separate layers that share one sphere geometry:
 * surface -> night lights -> clouds, all inside a slowly turning group, plus the atmosphere.
 * City markers are passed in as children so they turn with the ground.
 */
export function Earth({ quality, spin, drift, children }) {
  useEarthTextures(quality)
  const planet = useRef(null)
  const geometry = useMemo(() => new SphereGeometry(1, SEGMENTS[quality], SEGMENTS[quality] / 2), [quality])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (!spin || !planet.current) return
    planet.current.rotation.y += Math.min(delta, 0.1) * SPIN
    // The camera needs this to aim at a city on the turning globe.
    globeBridge.planetRotationY = planet.current.rotation.y
  })

  const look = LOOK[quality]
  return (
    <>
      <group ref={planet}>
        <EarthSurface geometry={geometry} relief={look.relief} />
        <EarthNightLights geometry={geometry} />
        <EarthClouds geometry={geometry} drift={drift} opacity={look.cloudOpacity} shaded={look.cloudShading} />
        {children}
      </group>
      <EarthAtmosphere geometry={geometry} />
    </>
  )
}
