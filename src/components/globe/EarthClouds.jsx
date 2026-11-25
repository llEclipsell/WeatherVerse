import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial } from 'three'
import { earthUniforms } from './earthTextures'

/** Cloud cover on its own sphere just above the surface, see-through so the land stays visible. */
export function EarthClouds({ geometry, drift, opacity, shaded }) {
  const mesh = useRef(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          detailMap: earthUniforms.detailMap,
          detailReady: earthUniforms.detailReady,
          sunDir: earthUniforms.sunDir,
          opacity: { value: opacity },
          shaded: { value: shaded ? 1 : 0 },
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
          uniform sampler2D detailMap;
          uniform float detailReady;
          uniform float opacity;
          uniform float shaded;
          uniform vec3 sunDir;
          varying vec2 vUv;
          varying vec3 vNormalW;
          void main() {
            vec3 n = normalize(vNormalW);
            float cover = smoothstep(0.22, 0.95, texture2D(detailMap, vUv).b) * detailReady;
            if (cover < 0.004) discard;

            // Thicker cloud leans the normal, which gives the tops a lit edge and a shaded edge.
            vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
            vec3 north = cross(n, east);
            vec2 texel = vec2(1.0 / 2048.0, 1.0 / 1024.0);
            float cE = texture2D(detailMap, vUv + vec2(texel.x, 0.0)).b - texture2D(detailMap, vUv - vec2(texel.x, 0.0)).b;
            float cN = texture2D(detailMap, vUv + vec2(0.0, texel.y)).b - texture2D(detailMap, vUv - vec2(0.0, texel.y)).b;
            vec3 nb = normalize(n - shaded * 1.6 * (cE * east + cN * north));

            float ndl = dot(n, sunDir);
            float dayAmt = smoothstep(-0.12, 0.3, ndl);
            float light = max(dot(nb, sunDir), 0.0) * 0.85 + 0.2;
            vec3 tint = mix(vec3(1.0, 0.72, 0.5), vec3(1.0), smoothstep(0.0, 0.4, ndl));
            vec3 col = tint * light * dayAmt + vec3(0.015, 0.02, 0.035) * (1.0 - dayAmt);
            gl_FragColor = vec4(min(col, vec3(1.0)), cover * opacity * mix(0.45, 1.0, dayAmt));
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useEffect(() => {
    material.uniforms.opacity.value = opacity
    material.uniforms.shaded.value = shaded ? 1 : 0
  }, [material, opacity, shaded])
  useEffect(() => () => material.dispose(), [material])

  // Clouds drift a little faster than the ground. The surface and night layers read the same
  // offset so cloud shadows and dimmed city lights stay under the clouds.
  useFrame((_, delta) => {
    if (!drift || !mesh.current) return
    mesh.current.rotation.y += Math.min(delta, 0.1) * 0.004
    earthUniforms.cloudShift.value = -mesh.current.rotation.y / (Math.PI * 2)
  })

  return <mesh ref={mesh} geometry={geometry} material={material} scale={1.006} renderOrder={2} raycast={() => null} />
}
