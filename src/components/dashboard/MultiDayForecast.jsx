import { describeWeather } from '../../lib/weatherCodes'
import { dateShort, fmtTemp, weekdayShort } from '../../lib/format'

export function MultiDayForecast({ data, unit }) {
  const lows = data.daily.map((d) => d.tempMin).filter((v) => v !== null)
  const highs = data.daily.map((d) => d.tempMax).filter((v) => v !== null)
  const min = Math.min(...lows),
    max = Math.max(...highs)
  const span = max - min || 1
  return (
    <section aria-labelledby="week-title">
      <h3 id="week-title" className="section-title">
        {data.daily.length}-day forecast
      </h3>
      <ul className="panel divide-y divide-line">
        {data.daily.map((d, i) => {
          const { label, Icon } = describeWeather(d.conditionCode, true, d.conditionText)
          const hasRange = d.tempMin !== null && d.tempMax !== null
          return (
            <li
              key={d.date}
              className="grid grid-cols-[4.5rem_1.5rem_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[6rem_1.5rem_9rem_3rem_1fr] sm:px-5"
            >
              <div>
                <p className="font-medium">{i === 0 ? 'Today' : weekdayShort(d.date)}</p>
                <p className="font-mono text-[11px] text-haze">{dateShort(d.date)}</p>
              </div>
              <Icon size={20} className="text-dawn" aria-hidden="true" />
              <p className="hidden truncate text-sm text-haze sm:block">{label}</p>
              <p className="hidden font-mono text-xs text-ice sm:block" title="Chance of precipitation">
                {d.precipitationProbabilityMax === null ? '--' : `${d.precipitationProbabilityMax}%`}
              </p>
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="w-9 text-right text-haze">{fmtTemp(d.tempMin, unit)}</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-cloud/10" aria-hidden="true">
                  {hasRange && (
                    <i
                      className="absolute inset-y-0 rounded-full bg-linear-to-r from-ice to-dawn"
                      style={{
                        left: `${((d.tempMin - min) / span) * 100}%`,
                        right: `${((max - d.tempMax) / span) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <span className="w-9">{fmtTemp(d.tempMax, unit)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
