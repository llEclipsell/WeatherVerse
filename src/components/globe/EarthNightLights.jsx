import { useEffect, useMemo } from 'react'
import { AdditiveBlending, ShaderMaterial } from 'three'
import { earthUniforms } from './earthTextures'

/**
 * City lights, added on top of the surface only where the sun does not reach.
 * This is a blend driven by the sun direction, never an opaque night map over the day map.
 */
export function EarthNightLights({ geometry }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          nightMap: earthUniforms.nightMap,
          detailMap: earthUniforms.detailMap,
          nightReady: earthUniforms.nightReady,
          detailReady: earthUniforms.detailReady,
          cloudShift: earthUniforms.cloudShift,
          sunDir: earthUniforms.sunDir,
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormalW;
          void main() {
            vUv = uv;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D nightMap;
          uniform sampler2D detailMap;
          uniform float nightReady;
          uniform float detailReady;
          uniform float cloudShift;
          uniform vec3 sunDir;
          varying vec2 vUv;
          varying vec3 vNormalW;
          void main() {
            float ndl = dot(normalize(vNormalW), sunDir);
            float darkness = 1.0 - smoothstep(-0.22, 0.08, ndl);
            vec3 lights = texture2D(nightMap, vUv).rgb * nightReady;
            float cloud = smoothstep(0.25, 0.95, texture2D(detailMap, vUv + vec2(cloudShift, 0.0)).b) * detailReady;
            vec3 col = lights * vec3(1.0, 0.8, 0.55) * 1.35 * darkness * (1.0 - 0.55 * cloud);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  return <mesh geometry={geometry} material={material} scale={1.0008} renderOrder={1} raycast={() => null} />
}
