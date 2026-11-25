import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BackSide, ShaderMaterial } from 'three'
import { earthUniforms } from './earthTextures'

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const common = /* glsl */ `
  uniform vec3 sunDir;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  vec3 airColor(float ndl) {
    return mix(vec3(0.95, 0.42, 0.2), vec3(0.26, 0.52, 1.0), smoothstep(-0.28, 0.22, ndl));
  }
`

/**
 * Air, in two thin parts that both follow the sun:
 *  - haze: a blue veil over the surface that strengthens towards the planet's edge
 *  - rim: a narrow glow just outside the edge
 * Both are clamped and fade to nothing away from the limb, so there is no thick outline.
 */
export function EarthAtmosphere({ geometry }) {
  const [haze, rim] = useMemo(() => {
    const base = { transparent: true, depthWrite: false, blending: AdditiveBlending, vertexShader }
    return [
      new ShaderMaterial({
        ...base,
        uniforms: { sunDir: earthUniforms.sunDir },
        fragmentShader: /* glsl */ `${common}
          void main() {
            vec3 n = normalize(vNormalW);
            vec3 v = normalize(cameraPosition - vPosW);
            float ndl = dot(n, sunDir);
            float edge = pow(1.0 - max(dot(n, v), 0.0), 2.6);
            float lit = smoothstep(-0.2, 0.45, ndl);
            vec3 col = airColor(ndl) * edge * 0.5 * lit + vec3(0.05, 0.1, 0.22) * edge * 0.12;
            gl_FragColor = vec4(min(col, vec3(0.6)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
      new ShaderMaterial({
        ...base,
        side: BackSide,
        uniforms: { sunDir: earthUniforms.sunDir },
        fragmentShader: /* glsl */ `${common}
          void main() {
            vec3 n = normalize(vNormalW);
            vec3 v = normalize(cameraPosition - vPosW);
            // 0 at the shell's outer edge, rising towards the planet's limb, then cut off.
            float depth = clamp(-dot(n, v), 0.0, 1.0);
            float ring = pow(clamp(depth / 0.26, 0.0, 1.0), 2.4) * (1.0 - smoothstep(0.26, 0.42, depth));
            float ndl = dot(n, sunDir);
            float lit = smoothstep(-0.3, 0.45, ndl);
            vec3 col = airColor(ndl) * ring * 0.9 * lit + vec3(0.05, 0.1, 0.22) * ring * 0.1;
            gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    ]
  }, [])
  useEffect(
    () => () => {
      haze.dispose()
      rim.dispose()
    },
    [haze, rim],
  )

  return (
    <>
      <mesh geometry={geometry} material={haze} scale={1.009} renderOrder={3} raycast={() => null} />
      <mesh geometry={geometry} material={rim} scale={1.035} renderOrder={3} raycast={() => null} />
    </>
  )
}
