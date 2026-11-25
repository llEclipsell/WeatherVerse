import { Vector3 } from 'three'

const DEG = Math.PI / 180

/**
 * Latitude/longitude to a point on the globe.
 * Matches three's SphereGeometry UV layout with an equirectangular texture whose
 * left edge is 180 W: longitude 0 faces +X, east is towards -Z, north is +Y.
 * `npm run check:geo` verifies this against the land mask for known cities.
 */
export function latLonToVector3(lat, lon, radius = 1, target = new Vector3()) {
  const phi = lat * DEG
  const lambda = lon * DEG
  return target.set(
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda),
  )
}

const UP = new Vector3(0, 1, 0)

/**
 * A simulated sun placed relative to the opening camera: about 50 degrees to one side and a
 * little above. Most of the visible disc is lit and the day-night line sits inside the frame.
 */
export function sunFromCamera(cameraPosition, target = new Vector3()) {
  return target
    .copy(cameraPosition)
    .normalize()
    .applyAxisAngle(UP, -52 * DEG)
    .add(new Vector3(0, 0.32, 0))
    .normalize()
}
