import { proxyWeather } from '../../server/weatherProxy.mjs'

/**
 * Netlify Function behind /api/weather/* (see netlify.toml).
 * The key comes from the WEATHERAPI_KEY environment variable set in the Netlify dashboard.
 */
export const handler = async (event) => {
  const endpoint = (event.path || '').split('/').pop()
  const params = new URLSearchParams(event.queryStringParameters || {})
  const result = await proxyWeather(endpoint, params, process.env.WEATHERAPI_KEY)
  return {
    statusCode: result.status,
    headers: {
      'content-type': result.contentType,
      'cache-control': result.status === 200 ? 'public, max-age=300' : 'no-store',
    },
    body: result.body,
  }
}
