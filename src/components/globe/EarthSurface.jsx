import { useEffect, useMemo } from 'react'
import { ShaderMaterial } from 'three'
import { earthUniforms } from './earthTextures'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

/**
 * The day side of the planet: land and ocean colour lit by the simulated sun.
 * Terrain height tilts the lighting slightly so mountain ranges catch light, oceans get a soft
 * sun glint, and clouds drop a faint shadow. The night side is left almost black on purpose:
 * city lights are a separate layer drawn on top.
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D detailMap;
  uniform float dayReady;
  uniform float detailReady;
  uniform float cloudShift;
  uniform float relief;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float ndl = dot(n, sunDir);
    float dayAmt = smoothstep(-0.08, 0.28, ndl);

    // East and north directions on the sphere, used for terrain shading and the cloud shadow.
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
    vec3 north = cross(n, east);

    vec3 detail = texture2D(detailMap, vUv).rgb * detailReady;
    float ocean = (1.0 - detail.g) * detailReady;

    // Terrain: compare heights of neighbouring texels and lean the surface normal away from slopes.
    vec2 texel = vec2(1.0 / 4096.0, 1.0 / 2048.0);
    float hE = texture2D(detailMap, vUv + vec2(texel.x, 0.0)).r - texture2D(detailMap, vUv - vec2(texel.x, 0.0)).r;
    float hN = texture2D(detailMap, vUv + vec2(0.0, texel.y)).r - texture2D(detailMap, vUv - vec2(0.0, texel.y)).r;
    vec3 nb = normalize(n - relief * detailReady * (hE * east + hN * north));

    vec3 albedo = mix(vec3(0.02, 0.07, 0.17), texture2D(dayMap, vUv).rgb, dayReady);
    float luma = dot(albedo, vec3(0.299, 0.587, 0.114));
    albedo = mix(vec3(luma), albedo, 1.12);

    float diffuse = max(dot(nb, sunDir), 0.0);
    vec3 col = albedo * (diffuse * 0.96 + 0.05 * dayAmt);

    // Shadow of the cloud layer, offset a little towards the sun.
    vec2 toSun = vec2(dot(sunDir, east) * 0.5, dot(sunDir, north)) * 0.0035;
    float cloud = smoothstep(0.25, 0.95, texture2D(detailMap, vUv + vec2(cloudShift, 0.0) + toSun).b) * detailReady;
    col *= 1.0 - 0.32 * cloud * dayAmt;

    // Sun glint on water only: a wide soft sheen plus a small bright core.
    float glint = max(dot(reflect(-sunDir, n), v), 0.0);
    col += vec3(1.0, 0.95, 0.86) * (pow(glint, 26.0) * 0.14 + pow(glint, 180.0) * 0.45) * ocean * (1.0 - cloud) * dayAmt;

    // Warm band where day turns to night.
    float twilight = smoothstep(-0.12, 0.06, ndl) * (1.0 - smoothstep(0.06, 0.34, ndl));
    col *= mix(vec3(1.0), vec3(1.18, 0.9, 0.72), twilight);

    // The night half keeps a trace of the surface so coastlines are not lost entirely.
    col += albedo * vec3(0.02, 0.032, 0.07) * (1.0 - dayAmt);

    // A pinch of noise hides colour banding in the smooth ocean gradients.
    col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 160.0;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    #include <colorspace_fragment>
  }
`

export function EarthSurface({ geometry, relief }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          dayMap: earthUniforms.dayMap,
          detailMap: earthUniforms.detailMap,
          dayReady: earthUniforms.dayReady,
          detailReady: earthUniforms.detailReady,
          cloudShift: earthUniforms.cloudShift,
          sunDir: earthUniforms.sunDir,
          relief: { value: relief },
        },
      }),
    [],
  )
  useEffect(() => {
    material.uniforms.relief.value = relief
  }, [material, relief])
  useEffect(() => () => material.dispose(), [material])

  // The surface also blocks pointer events, so markers on the far side cannot be hovered through it.
  return (
    <mesh
      geometry={geometry}
      material={material}
      onPointerOver={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
