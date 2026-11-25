import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector3 } from 'three'

/** Which file each quality profile loads. Night and detail maps can be smaller than the day map. */
const FILES = {
  high: {
    day: '/textures/earth-day-8k.webp',
    night: '/textures/earth-night-4k.webp',
    detail: '/textures/earth-detail-4k.jpg',
  },
  balanced: {
    day: '/textures/earth-day-4k.webp',
    night: '/textures/earth-night-2k.webp',
    detail: '/textures/earth-detail-2k.jpg',
  },
  low: {
    day: '/textures/earth-day-2k.webp',
    night: '/textures/earth-night-2k.webp',
    detail: '/textures/earth-detail-1k.jpg',
  },
}
const DAY_PREVIEW = FILES.low.day

/**
 * One set of uniforms shared by every Earth layer (surface, night lights, clouds, atmosphere).
 * Sharing them keeps the layers in step: one sun direction, one copy of each texture on the GPU.
 */
export const earthUniforms = {
  dayMap: { value: null },
  nightMap: { value: null },
  /** red = terrain height, green = land mask, blue = cloud cover */
  detailMap: { value: null },
  dayReady: { value: 0 },
  nightReady: { value: 0 },
  detailReady: { value: 0 },
  sunDir: { value: new Vector3(0.6, 0.35, 0.72).normalize() },
  /** How far the cloud layer has drifted, as a fraction of a full turn. */
  cloudShift: { value: 0 },
}

/**
 * Loads the textures for the current quality profile and swaps them in place.
 * A light 2K day map shows first, then the full one replaces it. Layers keep drawing with what
 * they already have while a new map downloads, so the planet never blanks out during a swap.
 */
export function useEarthTextures(quality) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  // An 8K map needs a GPU that accepts 8192 px textures. Fall back one profile if it does not.
  const tier = quality === 'high' && gl.capabilities.maxTextureSize < 8192 ? 'balanced' : quality

  useEffect(() => {
    let cancelled = false
    const loader = new TextureLoader()
    const maxAniso = gl.capabilities.getMaxAnisotropy()

    const apply = (slot, texture) => {
      if (cancelled) {
        texture.dispose()
        return
      }
      texture.colorSpace = slot === 'detail' ? LinearSRGBColorSpace : SRGBColorSpace
      texture.anisotropy = Math.min(slot === 'day' ? 16 : 4, maxAniso)
      texture.wrapS = RepeatWrapping
      const uniform = earthUniforms[`${slot}Map`]
      const previous = uniform.value
      uniform.value = texture
      earthUniforms[`${slot}Ready`].value = 1
      previous?.dispose()
      invalidate()
    }
    const load = (slot, url) =>
      loader
        .loadAsync(url)
        .then((t) => apply(slot, t))
        .catch(() => {
          /* keep what is already shown */
        })

    const files = FILES[tier]
    const preview =
      earthUniforms.dayMap.value || files.day === DAY_PREVIEW ? Promise.resolve() : load('day', DAY_PREVIEW)
    void preview.then(() => {
      if (!cancelled) void load('day', files.day)
    })
    void load('night', files.night)
    void load('detail', files.detail)

    return () => {
      cancelled = true
    }
  }, [tier, gl, invalidate])

  // Leaving the globe for good frees every texture from GPU memory.
  useEffect(
    () => () => {
      for (const slot of ['day', 'night', 'detail']) {
        earthUniforms[`${slot}Map`].value?.dispose()
        earthUniforms[`${slot}Map`].value = null
        earthUniforms[`${slot}Ready`].value = 0
      }
    },
    [],
  )
}
