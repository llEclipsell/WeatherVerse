import { MY_LOCATION_ID } from '../../services/cities'
import { describeWeather } from '../../lib/weatherCodes'
import { fmtTemp, timeHM, tzLabel, weekdayLong } from '../../lib/format'

function fetchedAtLocal(iso, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso))
  } catch {
    return null
  }
}

export function CurrentWeather({ city, data, unit }) {
  const c = data.current
  const today = data.daily[0]
  const { label, Icon } = describeWeather(c.conditionCode, c.isDay, c.conditionText)
  const tz = tzLabel(data.timezone)
  const fetched = fetchedAtLocal(data.fetchedAt, data.timezone)
  return (
    <div className="panel flex flex-col justify-between gap-8 p-6 sm:p-8">
      <div>
        <p className="label">
          Right now in {city.id === MY_LOCATION_ID ? data.place.name || 'your location' : city.name}
        </p>
        <p className="mt-1 font-mono text-xs text-haze">
          {weekdayLong(c.time)} {timeHM(c.time)} {tz} ({data.timezone})
        </p>
      </div>
      <div className="flex items-end gap-5">
        <span className="font-display text-[7rem] leading-[0.8] font-extrabold text-cloud">
          {fmtTemp(c.temperature, unit)}
        </span>
        <div className="pb-1">
          <Icon size={30} className="text-dawn" aria-hidden="true" />
          <p className="mt-2 text-lg font-medium">{label}</p>
          <p className="text-sm text-haze">Feels like {fmtTemp(c.feelsLike, unit)}</p>
        </div>
      </div>
      <p className="font-mono text-xs text-haze">
        Today {fmtTemp(today?.tempMax ?? null, unit)} / {fmtTemp(today?.tempMin ?? null, unit)}
        {fetched && (
          <>
            {' '}
            &nbsp;-&nbsp; data fetched {fetched} {tz}
          </>
        )}
      </p>
    </div>
  )
}
