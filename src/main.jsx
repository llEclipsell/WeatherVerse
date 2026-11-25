import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import '@fontsource-variable/big-shoulders-display'
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource-variable/spline-sans-mono'
import './index.css'
import { ScrollTrigger } from './lib/gsap'
import { useWeatherStore } from './store/weatherStore'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
})

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
if (!hasWebGL()) useWeatherStore.getState().setWebgl('unsupported')

// Web fonts change text metrics, which moves scroll trigger positions.
void document.fonts?.ready.then(() => ScrollTrigger.refresh())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)
