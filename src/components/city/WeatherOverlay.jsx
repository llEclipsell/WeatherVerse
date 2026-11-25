import { clamp01, compass, NA } from '../../lib/format'

/** A labelled value with an optional thin meter. Used for the small in-scene readouts. */
export function Readout({ label, value, unit, fraction, loading }) {
  return (
    <div className="readout">
      <div className="flex items-baseline justify-between gap-6">
        <span className="label">{label}</span>
        <span className={`readout-value ${loading ? 'shimmer' : ''}`}>
          {value}
          {unit && value !== NA && <small>{unit}</small>}
        </span>
      </div>
      {fraction !== undefined && (
        <div className="meter" aria-hidden="true">
          {fraction !== null && <i style={{ transform: `scaleX(${clamp01(fraction)})` }} />}
        </div>
      )}
    </div>
  )
}

export function Figure({ label, children }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="figure-value">{children}</div>
    </div>
  )
}

/** Compass dial. The needle points where the wind is coming from. */
export function WindDial({ direction }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 shrink-0"
      role="img"
      aria-label={
        direction === null
          ? 'Wind direction unavailable'
          : `Wind from ${compass(direction)}, ${Math.round(direction)} degrees`
      }
    >
      <circle cx="60" cy="60" r="52" fill="rgba(7,12,34,.35)" stroke="rgba(238,241,246,.35)" strokeWidth="1" />
      {Array.from({ length: 16 }, (_, i) => (
        <line
          key={i}
          x1="60"
          y1="10"
          x2="60"
          y2={i % 4 === 0 ? 20 : 15}
          stroke="rgba(238,241,246,.55)"
          strokeWidth={i % 4 === 0 ? 1.5 : 1}
          transform={`rotate(${i * 22.5} 60 60)`}
        />
      ))}
      <text x="60" y="33" textAnchor="middle" className="fill-cloud font-mono" fontSize="10">
        N
      </text>
      {direction !== null && (
        <g transform={`rotate(${direction} 60 60)`}>
          <path d="M60 16 L67 60 L60 54 L53 60 Z" fill="#ffb26b" />
          <line x1="60" y1="54" x2="60" y2="98" stroke="#ffb26b" strokeWidth="2" strokeLinecap="round" opacity=".5" />
        </g>
      )}
      <circle cx="60" cy="60" r="3" fill="#eef1f6" />
    </svg>
  )
}

/** Chance of precipitation for the coming hours, as thin bars. Hours with no value leave a gap. */
export function RainOutlook({ hours }) {
  if (hours.length === 0) return null
  return (
    <div className="inline-block">
      <span className="label block">Chance of precipitation, next {hours.length} hours</span>
      <div
        className="mt-2 flex h-12 items-end gap-[3px]"
        role="img"
        aria-label={`Hourly chance of precipitation: ${hours.map((h) => `${h.time.slice(11, 13)}h ${h.precipitationProbability ?? 'n/a'}%`).join(', ')}`}
      >
        {hours.map((h) => (
          <div key={h.time} className="flex h-full w-2.5 items-end rounded-t-sm bg-cloud/10">
            {h.precipitationProbability !== null && (
              <i
                className="block w-full rounded-t-sm bg-ice"
                style={{ height: `${Math.max(4, h.precipitationProbability)}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-cloud/60">
        <span>{hours[0].time.slice(11, 16)}</span>
        <span>{hours[hours.length - 1].time.slice(11, 16)}</span>
      </div>
    </div>
  )
}

/** The sun's path from sunrise to sunset with its current position. */
export function SunArc({ sunrise, sunset, progress }) {
  const W = 640,
    H = 150,
    PAD = 24,
    BASE = 128,
    RISE = 104
  const pt = (t) => [PAD + t * (W - PAD * 2), BASE - Math.sin(Math.PI * t) * RISE]
  const d = Array.from({ length: 41 }, (_, i) => pt(i / 40))
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const sun = progress === null ? null : pt(progress)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[40rem]"
      role="img"
      aria-label={`Sunrise ${sunrise}, sunset ${sunset}. ${progress === null ? 'The sun is down.' : `The sun is ${Math.round(progress * 100)} percent of the way through the day.`}`}
    >
      <line x1="0" y1={BASE} x2={W} y2={BASE} stroke="rgba(238,241,246,.4)" strokeWidth="1" />
      <path
        d={d}
        fill="none"
        stroke="rgba(238,241,246,.45)"
        strokeWidth="1.5"
        strokeDasharray="2 6"
        strokeLinecap="round"
      />
      {sun && (
        <>
          <path
            d={Array.from({ length: 41 }, (_, i) => pt((i / 40) * progress))
              .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke="#ffb26b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={sun[0]} cy={sun[1]} r="16" fill="#ffb26b" opacity=".25" />
          <circle cx={sun[0]} cy={sun[1]} r="7" fill="#ffd9a0" stroke="#070c22" strokeWidth="2" />
        </>
      )}
      <circle cx={PAD} cy={BASE} r="3" fill="#eef1f6" />
      <circle cx={W - PAD} cy={BASE} r="3" fill="#eef1f6" />
    </svg>
  )
}
