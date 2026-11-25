import { Cloud, Droplets, Eye, Gauge, SunMedium, Sunrise, Sunset, Umbrella, Wind } from 'lucide-react'

import { compass, fmtNum, fmtVisibility, NA, timeHM, uvLabel } from '../../lib/format'

function Tile({ Icon, label, value, note }) {
  const missing = value === NA
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-haze">
        <Icon size={15} aria-hidden="true" />
        <span className="label">{label}</span>
      </div>
      <p className={`mt-3 font-mono text-2xl ${missing ? 'text-haze' : 'text-cloud'}`}>
        {missing ? <span title="Not provided by the weather service">Unavailable</span> : value}
      </p>
      {note && !missing && <p className="mt-1 text-xs text-haze">{note}</p>}
    </div>
  )
}

export function WeatherDetails({ data }) {
  const c = data.current
  const today = data.daily[0]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Tile Icon={Droplets} label="Humidity" value={fmtNum(c.humidity, 0, '%')} />
      <Tile
        Icon={Wind}
        label="Wind"
        value={fmtNum(c.windSpeed, 0, ' km/h')}
        note={`From ${compass(c.windDirection)}${c.windGusts !== null ? `, gusts ${Math.round(c.windGusts)} km/h` : ''}`}
      />
      <Tile Icon={Gauge} label="Pressure" value={fmtNum(c.pressure, 0, ' hPa')} note="Mean sea level" />
      <Tile Icon={Eye} label="Visibility" value={fmtVisibility(c.visibility)} />
      <Tile Icon={Cloud} label="Cloud cover" value={fmtNum(c.cloudCover, 0, '%')} />
      <Tile Icon={SunMedium} label="UV index" value={fmtNum(c.uvIndex, 1)} note={uvLabel(c.uvIndex)} />
      <Tile
        Icon={Umbrella}
        label="Precipitation"
        value={fmtNum(c.precipitation, 1, ' mm')}
        note={c.precipitationProbability !== null ? `${c.precipitationProbability}% chance this hour` : undefined}
      />
      <Tile Icon={Sunrise} label="Sunrise" value={timeHM(today?.sunrise)} note="City local time" />
      <Tile Icon={Sunset} label="Sunset" value={timeHM(today?.sunset)} note="City local time" />
    </div>
  )
}
