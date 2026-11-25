export class LocationError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = 'LocationError'
    this.kind = kind
  }
}

/** Browser Geolocation API as a Promise. Only call this after the person asks for their location. */
export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('unsupported', 'This browser cannot share a location. Search for your city instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new LocationError(
              'denied',
              'Location permission was denied. Allow it in the browser, or search for your city.',
            ),
          )
        } else if (error.code === error.TIMEOUT) {
          reject(
            new LocationError('timeout', 'Finding your location took too long. Try again, or search for your city.'),
          )
        } else {
          reject(
            new LocationError('unavailable', 'Your location is not available right now. Search for your city instead.'),
          )
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  })
}
