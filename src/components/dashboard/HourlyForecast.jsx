import { describeWeather } from '../../lib/weatherCodes'
import { fmtTemp, timeHM } from '../../lib/format'

export function HourlyForecast({ data, unit }) {
  const hours = data.hourly.slice(data.nowIndex, data.nowIndex + 24)
  return (
    <section aria-labelledby="hourly-title">
      <h3 id="hourly-title" className="section-title">
        Next 24 hours
      </h3>
      <ul className="hour-strip" tabIndex={0} aria-label="Hourly forecast, scrolls sideways">
        {hours.map((h, i) => {
          const { label, Icon } = describeWeather(h.conditionCode, h.isDay, h.conditionText)
          return (
            <li
              key={h.time}
              className="panel flex w-[4.75rem] shrink-0 snap-start flex-col items-center gap-2 px-2 py-4"
            >
              <span className="font-mono text-xs text-haze">{i === 0 ? 'Now' : timeHM(h.time)}</span>
              <Icon size={22} className={h.isDay === false ? 'text-ice' : 'text-dawn'} role="img" aria-label={label} />
              <span className="font-mono text-lg">{fmtTemp(h.temperature, unit)}</span>
              <span className="font-mono text-[11px] text-ice" title="Chance of precipitation">
                {h.precipitationProbability === null ? '--' : `${h.precipitationProbability}%`}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
