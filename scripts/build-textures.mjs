#!/usr/bin/env node
/**
 * Builds the runtime Earth textures in public/textures/ from the untouched originals in assets-src/earth/.
 *
 *   npm run build:textures
 *
 * To try a different Earth (for example a NASA Visible Earth map), replace a file in assets-src/earth/
 * with another equirectangular image (2:1, left edge at 180 W) of the same name and run this again.
 * Record the new source in ASSET_CREDITS.md.
 */
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets-src/earth')
const OUT = join(ROOT, 'public/textures')
const open = (name) => sharp(join(SRC, name), { limitInputPixels: false })
await mkdir(OUT, { recursive: true })

// Day surface: colour photograph of land and ocean. WebP keeps the download small.
for (const [label, width, quality] of [['8k', 8192, 84], ['4k', 4096, 84], ['2k', 2048, 82]]) {
  await open('earth_day_8k.jpg').resize(width, width / 2).webp({ quality }).toFile(join(OUT, `earth-day-${label}.webp`))
}

// Night lights: mostly black, so it compresses well and can be smaller than the day map.
for (const [label, width] of [['4k', 4096], ['2k', 2048]]) {
  await open('earth_night_4k.jpg').resize(width, width / 2).webp({ quality: 82 }).toFile(join(OUT, `earth-night-${label}.webp`))
}

// Detail map: three greyscale maps packed into one image so the GPU holds one texture, not three.
//   red = terrain height, green = land mask (0 over ocean), blue = cloud cover.
// JPEG without chroma subsampling, because each colour channel is independent data here.
for (const [label, width] of [['4k', 4096], ['2k', 2048], ['1k', 1024]]) {
  await open('earth_bump_roughness_clouds_4k.jpg')
    .resize(width, width / 2)
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toFile(join(OUT, `earth-detail-${label}.jpg`))
}
console.log('Earth textures written to public/textures/')
