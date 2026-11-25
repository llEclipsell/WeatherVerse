# Asset credits

Every third-party asset in WeatherVerse, where it came from, and what its licence asks for.
Originals are kept untouched in `assets-src/`; the files the site loads are generated from them
into `public/` (`npm run build:textures`). Confirm each licence yourself before publishing.

## Earth

| Layer | Original (assets-src/earth/) | Runtime files (public/textures/) | Source | Licence / credit |
|---|---|---|---|---|
| Day surface | `earth_day_8k.jpg` (8192 x 4096, equirectangular) | `earth-day-8k.webp`, `-4k`, `-2k` | Solar System Scope "Earth day map", built from NASA Blue Marble imagery. https://www.solarsystemscope.com/textures/ | Published by Solar System Scope under CC BY 4.0. Credit: "Earth textures: Solar System Scope, based on NASA imagery". |
| Night lights | `earth_night_4k.jpg` (4096 x 2048) | `earth-night-4k.webp`, `-2k` | Same texture family, as shipped in the three.js examples (`examples/textures/planets/earth_night_4096.jpg`). City lights derive from NASA Black Marble. | As above. |
| Detail map: terrain height (red), land mask (green), clouds (blue) | `earth_bump_roughness_clouds_4k.jpg` (4096 x 2048) | `earth-detail-4k.jpg`, `-2k`, `-1k` | three.js examples (`examples/textures/planets/earth_bump_roughness_clouds_4096.jpg`), packed from the same texture family. | As above. three.js itself is MIT licensed. |

Notes:

- The day and night originals were obtained from public GitHub copies of these files, because the
  build environment could not reach solarsystemscope.com or NASA directly. Before publishing,
  download them again from the source page and confirm the CC BY 4.0 terms there.
- Projection and orientation: all three are 2:1 equirectangular with the left edge at 180 W.
  `npm run check:geo` verifies marker placement against the land mask.
- NASA alternative: any equirectangular map from NASA Visible Earth (https://visibleearth.nasa.gov/)
  can replace the day or night original. Keep the file name, run `npm run build:textures`, and
  update this table. NASA imagery is generally free to use with credit to NASA; check the page
  of the specific image.
- Not done: KTX2/Basis GPU compression. The runtime files are WebP and JPEG, which keeps downloads
  small but they are held uncompressed in GPU memory. See "Texture memory" in the README.

## Space background

Stars are generated in code (`StarField.jsx`). No asset.

## City photographs

Each photograph is from Wikimedia Commons under its own licence. Author, licence and source page
for every city are recorded in `src/services/cityImageCredits.json` by `npm run fetch:images`, and
the credit is shown on the city scene. Most are CC BY or CC BY-SA and must be credited.
`public/images/cities/default-city.webp` is an illustration generated for this project.

## Weather data

WeatherAPI.com (current conditions, forecast, alerts, city search). Follow their terms for
attribution; the forecast section links to them.

## Fonts and icons

Big Shoulders Display, Schibsted Grotesk and Spline Sans Mono (SIL Open Font License) via
Fontsource. Icons: lucide (ISC licence).
