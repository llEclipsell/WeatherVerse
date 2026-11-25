import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { proxyWeather } from './server/weatherProxy.mjs'

/** Serves /api/weather/* during `npm run dev` and `npm run preview`, adding the key on the server side. */
function weatherProxy(key) {
  const middleware = async (req, res, next) => {
    if (!req.url?.startsWith('/api/weather/')) return next()
    const url = new URL(req.url, 'http://localhost')
    const result = await proxyWeather(url.pathname.split('/').pop(), url.searchParams, key)
    res.statusCode = result.status
    res.setHeader('content-type', result.contentType)
    res.end(result.body)
  }
  return {
    name: 'weather-proxy',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => {
  // The empty prefix loads WEATHERAPI_KEY from .env.local for this server only. It is not a VITE_
  // variable, so Vite never puts it into the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), weatherProxy(env.WEATHERAPI_KEY || process.env.WEATHERAPI_KEY)],
    build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  }
})
