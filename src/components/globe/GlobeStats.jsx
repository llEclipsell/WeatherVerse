import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Renderer statistics for performance checks. Open the site with ?stats in the address to show it.
 * Reads three's renderer.info: frame rate, draw calls, triangles, and live GPU textures and geometries.
 */
export function GlobeStats({ quality }) {
  const gl = useThree((s) => s.gl)
  const el = useRef(null)
  const frames = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    const pre = document.createElement('pre')
    pre.className = 'globe-stats'
    document.body.appendChild(pre)
    el.current = pre
    return () => pre.remove()
  }, [])

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - last.current < 500 || !el.current) return
    const fps = Math.round((frames.current * 1000) / (now - last.current))
    frames.current = 0
    last.current = now
    const { render, memory } = gl.info
    el.current.textContent =
      `${fps} fps  quality ${quality}  dpr ${gl.getPixelRatio().toFixed(2)}\n` +
      `draw calls ${render.calls}  triangles ${render.triangles}\n` +
      `textures ${memory.textures}  geometries ${memory.geometries}`
  })
  return null
}
