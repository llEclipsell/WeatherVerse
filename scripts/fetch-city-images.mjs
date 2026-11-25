#!/usr/bin/env node
/**
 * Imports the curated city photographs into the project.
 *
 * For each city in scripts/city-photos.json it downloads the named, freely licensed file from
 * Wikimedia Commons, converts it to WebP (2400 px wide) at
 *   public/images/cities/<city-key>/hero.webp
 * and records credit, licence and source in src/services/cityImageCredits.json.
 *
 *   npm run fetch:images              every city that has no photo yet
 *   npm run fetch:images -- tokyo     only these city keys (replaces an existing photo)
 *
 * To use a different picture, change the "File:..." title in city-photos.json and run it again.
 * Check each licence in cityImageCredits.json before publishing. Requires Node 18+.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/images/cities')
const CREDITS = join(ROOT, 'src/services/cityImageCredits.json')
const API = 'https://commons.wikimedia.org/w/api.php'
const HEADERS = { 'User-Agent': 'WeatherVerse-student-project/1.1 (city image import script)' }
const WIDTH = 2400

const readJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch { return fallback }
}
const strip = (html = '') => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

async function describe(title) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', titles: title,
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(WIDTH),
  })
  const res = await fetch(`${API}?${params}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Commons API answered ${res.status}`)
  const page = (await res.json()).query?.pages?.[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error('file not found on Commons')
  return info
}

async function download(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`download answered ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

const photos = await readJson(join(ROOT, 'scripts/city-photos.json'), {})
const credits = await readJson(CREDITS, {})
const requested = process.argv.slice(2)
const ids = requested.length ? requested : Object.keys(photos).filter((id) => !credits[id])
let failed = 0

for (const id of ids) {
  const title = photos[id]
  if (!title) { console.warn(`${id}: no entry in scripts/city-photos.json`); failed++; continue }
  try {
    const info = await describe(title)
    let bytes
    try { bytes = await download(info.thumburl ?? info.url) } catch { bytes = await download(info.url) }
    const dir = join(OUT, id)
    await mkdir(dir, { recursive: true })
    await sharp(bytes, { limitInputPixels: false })
      .rotate()
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(join(dir, 'hero.webp'))
    const meta = info.extmetadata ?? {}
    credits[id] = {
      credit: strip(meta.Artist?.value) || 'Wikimedia Commons contributor',
      license: strip(meta.LicenseShortName?.value) || 'see source',
      source: info.descriptionurl,
    }
    await writeFile(CREDITS, `${JSON.stringify(credits, null, 2)}\n`)
    console.log(`${id}: saved hero.webp (${credits[id].license}, ${credits[id].credit})`)
  } catch (err) {
    failed++
    console.warn(`${id}: failed - ${err.message}. The default image stays in use.`)
  }
  await new Promise((r) => setTimeout(r, 500))
}
console.log(failed ? `Finished with ${failed} failure(s). Run the command again to retry those.` : 'All done.')
