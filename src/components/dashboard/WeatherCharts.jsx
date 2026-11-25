import { useEffect, useMemo, useRef } from 'react'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

import { timeHM, toUnit, weekdayShort } from '../../lib/format'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'

// Only the Chart.js pieces these three charts use are registered, which keeps the chunk small.
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
)

// Series colours validated with the dataviz palette checker against a dark surface.
const TEMP = '#cf7a2c'
const FEELS = '#8a78ee'
const SINGLE = '#4fb6ea'
const INK = '#9fb0cf'
const GRID = 'rgba(159,176,207,0.14)'
const MONO = "'Spline Sans Mono Variable', ui-monospace, monospace"

function baseOptions(rows, unit, yMax, fromZero = yMax !== undefined) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 350 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7,12,34,0.95)',
        borderColor: 'rgba(159,176,207,0.25)',
        borderWidth: 1,
        titleColor: INK,
        bodyColor: '#eef1f6',
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { family: MONO, size: 11 },
        bodyFont: { family: MONO, size: 12 },
        callbacks: {
          title: (items) => {
            const row = rows[items[0]?.dataIndex ?? 0]
            return row ? `${weekdayShort(row.time)} ${timeHM(row.time)}` : ''
          },
          label: (item) =>
            `${item.dataset.label}: ${item.parsed.y === null ? 'unavailable' : `${Math.round(item.parsed.y * 10) / 10}${unit}`}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: INK,
          font: { family: MONO, size: 10 },
          maxRotation: 0,
          autoSkip: false,
          callback: (_value, index) => {
            const t = rows[index]?.time
            if (!t || Number(t.slice(11, 13)) % 6 !== 0) return null
            return t.slice(11, 13) === '00' ? weekdayShort(t) : timeHM(t)
          },
        },
      },
      y: {
        min: fromZero ? 0 : undefined,
        max: yMax,
        grid: { color: GRID },
        border: { display: false },
        ticks: { color: INK, font: { family: MONO, size: 10 }, maxTicksLimit: 5 },
      },
    },
  }
}

function ChartCanvas({ config, label }) {
  const canvas = useRef(null)
  useEffect(() => {
    if (!canvas.current) return
    const chart = new Chart(canvas.current, config)
    // Chart.js keeps listeners and a render loop per chart: destroy it when the data or page changes.
    return () => chart.destroy()
  }, [config])
  return <canvas ref={canvas} role="img" aria-label={label} />
}

function Frame({ title, legend, children }) {
  return (
    <figure className="panel p-4 sm:p-5">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="label">{title}</span>
        {legend}
      </figcaption>
      <div className="relative h-52">{children}</div>
    </figure>
  )
}

export default function WeatherCharts({ data, unit }) {
  const rows = useMemo(
    () =>
      data.hourly.slice(data.nowIndex, data.nowIndex + 48).map((h) => ({
        time: h.time,
        temp: h.temperature === null ? null : toUnit(h.temperature, unit),
        feels: h.feelsLike === null ? null : toUnit(h.feelsLike, unit),
        rain: h.precipitationProbability,
        wind: h.windSpeed,
      })),
    [data, unit],
  )
  const deg = `°${unit.toUpperCase()}`
  const labels = useMemo(() => rows.map((r) => r.time), [rows])
  const line = { borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.35, spanGaps: false }

  const tempConfig = useMemo(
    () => ({
      type: 'line',
      data: {
        labels,
        datasets: [
          { ...line, label: 'Air', data: rows.map((r) => r.temp), borderColor: TEMP, backgroundColor: TEMP },
          {
            ...line,
            label: 'Feels like',
            data: rows.map((r) => r.feels),
            borderColor: FEELS,
            backgroundColor: FEELS,
            borderDash: [5, 4],
          },
        ],
      },
      options: baseOptions(rows, deg),
    }),
    [rows, labels, deg],
  )

  const rainConfig = useMemo(
    () => ({
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Chance',
            data: rows.map((r) => r.rain),
            backgroundColor: SINGLE,
            borderRadius: 3,
            categoryPercentage: 0.9,
            barPercentage: 0.85,
          },
        ],
      },
      options: baseOptions(rows, '%', 100),
    }),
    [rows, labels],
  )

  const windConfig = useMemo(
    () => ({
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            ...line,
            label: 'Wind',
            data: rows.map((r) => r.wind),
            borderColor: SINGLE,
            backgroundColor: 'rgba(79,182,234,0.16)',
            fill: 'origin',
          },
        ],
      },
      options: baseOptions(rows, ' km/h', undefined, true),
    }),
    [rows, labels],
  )

  return (
    <section aria-labelledby="charts-title">
      <h3 id="charts-title" className="section-title">
        Next {rows.length} hours
      </h3>
      <div className="grid gap-3 xl:grid-cols-3">
        <Frame
          title={`Temperature, ${deg}`}
          legend={
            <span className="flex gap-4 font-mono text-[11px] text-haze">
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-4" style={{ background: TEMP }} />
                Air
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: FEELS }} />
                Feels like
              </span>
            </span>
          }
        >
          <ChartCanvas
            config={tempConfig}
            label={`Line chart of air and feels-like temperature for the next ${rows.length} hours. The same values are in the table below.`}
          />
        </Frame>
        <Frame title="Chance of precipitation, %">
          <ChartCanvas
            config={rainConfig}
            label={`Bar chart of the hourly chance of precipitation for the next ${rows.length} hours.`}
          />
        </Frame>
        <Frame title="Wind speed, km/h">
          <ChartCanvas config={windConfig} label={`Line chart of wind speed for the next ${rows.length} hours.`} />
        </Frame>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer font-mono text-xs text-haze hover:text-cloud">
          View these hours as a table
        </summary>
        <div className="panel mt-2 max-h-80 overflow-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-strato text-haze">
              <tr>
                <th className="px-3 py-2 font-normal">Local time</th>
                <th className="px-3 py-2 font-normal">Air {deg}</th>
                <th className="px-3 py-2 font-normal">Feels like {deg}</th>
                <th className="px-3 py-2 font-normal">Precip. chance %</th>
                <th className="px-3 py-2 font-normal">Wind km/h</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.time} className="border-t border-line">
                  <td className="px-3 py-1.5">
                    {weekdayShort(r.time)} {timeHM(r.time)}
                  </td>
                  {[r.temp, r.feels, r.rain, r.wind].map((v, i) => (
                    <td key={i} className="px-3 py-1.5">
                      {v === null ? 'n/a' : Math.round(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
