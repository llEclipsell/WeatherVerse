import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'

/** A sparse, still star field. One draw call, and deliberately dim so the planet stays the subject. */
export function StarField({ count }) {
  const [geometry, material] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const looks = new Float32Array(count * 2) // size, brightness
    let seed = 1337
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < count; i++) {
      const z = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(1 - z * z)
      positions.set([r * Math.cos(a) * 90, z * 90, r * Math.sin(a) * 90], i * 3)
      const b = rand() ** 3 // most stars faint, a few brighter
      looks.set([1.1 + b * 1.7, 0.4 + b * 0.6], i * 2)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    g.setAttribute('look', new BufferAttribute(looks, 2))
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { pixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) } },
      vertexShader: /* glsl */ `
        attribute vec2 look;
        uniform float pixelRatio;
        varying float vBright;
        void main() {
          vBright = look.y;
          gl_PointSize = look.x * pixelRatio;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vBright;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d) * vBright;
          gl_FragColor = vec4(vec3(0.86, 0.9, 1.0) * a, 1.0);
        }`,
    })
    return [g, m]
  }, [count])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  return <points geometry={geometry} material={material} frustumCulled={false} raycast={() => null} />
}
