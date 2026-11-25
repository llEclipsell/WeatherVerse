import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { Quaternion, Vector3 } from 'three'

import { globeBridge } from '../../animations/globeBridge'
import { useWeatherStore } from '../../store/weatherStore'

const FLY_END = 1.2
export const FOV = 32
const UP = new Vector3(0, 1, 0)

/** Camera distance at which the planet spans about 86% of the shorter side of the viewport. */
export function distanceForAspect(aspect) {
  const fractionOfHeight = 0.86 * Math.min(1, aspect / 0.96)
  const t = fractionOfHeight * Math.tan((FOV * Math.PI) / 360)
  return 1 / Math.sin(Math.atan(t))
}

export function GlobeCamera() {
  const controls = useRef(null)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const experience = useWeatherStore((s) => s.experience)
  const tween = useRef(null)
  const home = distanceForAspect(aspect)
  const homeRef = useRef(home)
  homeRef.current = home

  const api = useMemo(() => {
    const identity = new Quaternion()
    const step = new Quaternion()
    const dir = new Vector3()
    return {
      flyTo(latitude, longitude, duration) {
        tween.current?.kill()
        if (controls.current) controls.current.enabled = false
        const r0 = camera.position.length()
        const d0 = camera.position.clone().normalize()
        const phi = (latitude * Math.PI) / 180
        const lambda = (longitude * Math.PI) / 180
        // The city's position right now: its place on the sphere, turned by the planet's current rotation.
        const d1 = new Vector3(
          Math.cos(phi) * Math.cos(lambda),
          Math.sin(phi),
          -Math.cos(phi) * Math.sin(lambda),
        ).applyAxisAngle(UP, globeBridge.planetRotationY)
        const arc = new Quaternion().setFromUnitVectors(d0, d1)
        const state = { p: 0 }
        return new Promise((resolve) => {
          tween.current = gsap.to(state, {
            p: 1,
            duration,
            ease: 'power2.inOut',
            onUpdate: () => {
              // Turn first, dive late: the rotation leads and the zoom accelerates into the cut.
              const turn = Math.min(1, state.p * 1.25)
              step.copy(identity).slerp(arc, turn)
              dir.copy(d0).applyQuaternion(step)
              camera.position.copy(dir).multiplyScalar(r0 + (FLY_END - r0) * state.p ** 2.4)
              camera.lookAt(0, 0, 0)
              invalidate()
            },
            onComplete: resolve,
            onInterrupt: resolve,
          })
        })
      },
      pullBack(duration = 1.5) {
        tween.current?.kill()
        if (controls.current) controls.current.enabled = false
        const state = { r: camera.position.length() }
        dir.copy(camera.position).normalize()
        tween.current = gsap.to(state, {
          r: homeRef.current,
          duration,
          ease: 'power3.out',
          onUpdate: () => {
            camera.position.copy(dir).multiplyScalar(state.r)
            camera.lookAt(0, 0, 0)
            invalidate()
          },
          onComplete: () => {
            if (controls.current) {
              controls.current.enabled = true
              controls.current.update()
            }
          },
        })
      },
    }
  }, [camera, invalidate])

  useEffect(() => {
    globeBridge.controller = api
    return () => {
      tween.current?.kill()
      globeBridge.controller = null
    }
  }, [api])

  // Arriving on (or returning to) the globe always settles the camera at the home distance.
  useEffect(() => {
    if (experience === 'explore') api.pullBack()
  }, [experience, api])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      minDistance={1.7}
      maxDistance={home * 1.45}
    />
  )
}
