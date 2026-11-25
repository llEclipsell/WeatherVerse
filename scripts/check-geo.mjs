#!/usr/bin/env node
/**
 * Checks that city coordinates land on the right part of the Earth texture.
 *
 *   npm run check:geo
 *
 * For each test point it runs the app's own latLonToVector3(), converts that 3D point back to the
 * texture coordinate three.js uses for a sphere, and reads the land mask (green channel of the
 * detail map) there. Cities must read as land and the open-ocean points must read as water.
 * If the longitude sign or texture orientation were wrong, these would fail.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { latLonToVector3 } from '../src/components/globe/geo.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const { data, info } = await sharp(join(ROOT, 'public/textures/earth-detail-2k.jpg')).raw().toBuffer({ resolveWithObject: true })

const POINTS = [
  ['London', 51.5074, -0.1278, 'land'],
  ['Tokyo', 35.6762, 139.6503, 'land'],
  ['Mumbai', 19.076, 72.8777, 'land'],
  ['Bengaluru', 12.9716, 77.5946, 'land'],
  ['New York', 40.7128, -74.006, 'land'],
  ['Sydney', -33.8688, 151.2093, 'land'],
  ['Mid Pacific', 0, -140, 'water'],
  ['Arabian Sea, west of Mumbai', 19, 66, 'water'],
  ['Bay of Bengal, east of Chennai', 13, 86, 'water'],
  ['North Atlantic', 40, -40, 'water'],
]

let failures = 0
for (const [name, lat, lon, expected] of POINTS) {
  const p = latLonToVector3(lat, lon)
  // Inverse of three's SphereGeometry: u runs west to east from the -X axis, v from south to north.
  const u = (Math.atan2(p.z, -p.x) / (2 * Math.PI) + 1) % 1
  const v = 1 - Math.acos(p.y) / Math.PI
  const px = Math.min(info.width - 1, Math.round(u * info.width))
  const py = Math.min(info.height - 1, Math.round((1 - v) * info.height))
  // Coastal cities sit on the shoreline, so look at a small neighbourhood.
  let land = 0
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const x = (px + dx + info.width) % info.width, y = Math.min(info.height - 1, Math.max(0, py + dy))
    land = Math.max(land, data[(y * info.width + x) * info.channels + 1])
  }
  const got = land > 128 ? 'land' : 'water'
  const ok = got === expected
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(32)} lat ${String(lat).padStart(8)} lon ${String(lon).padStart(9)}  -> ${got}`)
}
console.log(failures ? `${failures} point(s) are in the wrong place.` : 'All points match the texture.')
process.exit(failures ? 1 : 0)
