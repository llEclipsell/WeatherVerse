import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const MAX = { high: 320, balanced: 200, low: 80 }
const STRIDE = 4 // x, y, speed, size

/**
 * One canvas, one preallocated buffer, one stroke per frame. It stays mounted for the whole story:
 * the scroll timeline only changes `amount`, and the loop parks itself whenever amount is zero.
 */
export const WeatherEffects = forwardRef(function WeatherEffects({ kind, intensity, slant, quality }, ref) {
  const canvasRef = useRef(null)
  const amount = useRef(0)
  const raf = useRef(0)
  const startRef = useRef(() => {})

  useImperativeHandle(
    ref,
    () => ({
      setAmount(v) {
        amount.current = v
        if (v > 0.01) startRef.current()
      },
    }),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || kind === 'none') return

    const count = Math.max(12, Math.round(MAX[quality] * (kind === 'wind' ? 0.18 : 0.3 + 0.7 * intensity)))
    const data = new Float32Array(count * STRIDE)
    let w = 0,
      h = 0,
      last = 0,
      running = false
    const scale = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1)

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
    }
    resize()
    for (let i = 0; i < count; i++) {
      const o = i * STRIDE
      data[o] = Math.random() * w
      data[o + 1] = Math.random() * h
      data[o + 2] = 0.6 + Math.random() * 0.8
      data[o + 3] = 0.5 + Math.random()
    }

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const a = amount.current
      ctx.clearRect(0, 0, w, h)
      if (a <= 0.01) {
        running = false
        return
      }

      const vx = kind === 'wind' ? (slant >= 0 ? 1 : -1) * 900 : slant * 520
      const vy = kind === 'rain' ? 1250 : kind === 'snow' ? 90 : 40
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const o = i * STRIDE
        const sp = data[o + 2],
          size = data[o + 3]
        let x = data[o] + vx * sp * dt
        let y = data[o + 1] + vy * sp * dt
        if (kind === 'snow') x += Math.sin(now / 900 + i) * 12 * dt
        if (y > h + 20) {
          y = -20
          x = Math.random() * w
        }
        if (x > w + 40) x = -40
        else if (x < -40) x = w + 40
        data[o] = x
        data[o + 1] = y
        if (kind === 'snow') {
          ctx.moveTo(x + size * 1.6, y)
          ctx.arc(x, y, size * 1.6, 0, 6.283)
        } else {
          const len = kind === 'rain' ? 0.016 * size : 0.09 * size
          ctx.moveTo(x, y)
          ctx.lineTo(x - vx * len * sp, y - vy * len * sp)
        }
      }
      if (kind === 'snow') {
        ctx.fillStyle = `rgba(255,255,255,${0.75 * a})`
        ctx.fill()
      } else {
        ctx.lineWidth = kind === 'rain' ? 1.1 : 1
        ctx.strokeStyle = `rgba(226,238,255,${(kind === 'rain' ? 0.42 : 0.16) * a})`
        ctx.stroke()
      }
      raf.current = requestAnimationFrame(frame)
    }

    startRef.current = () => {
      if (running) return
      running = true
      last = performance.now()
      raf.current = requestAnimationFrame(frame)
    }
    if (amount.current > 0.01) startRef.current()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf.current)
      ro.disconnect()
      startRef.current = () => {}
      ctx.clearRect(0, 0, w, h)
    }
  }, [kind, intensity, slant, quality])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
})
