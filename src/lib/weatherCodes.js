import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react'

/**
 * WeatherAPI.com condition codes grouped by what they look like.
 * This is the single place where codes are mapped to icons and scene effects.
 * The wording shown to people is the provider's own condition text.
 */
const GROUPS = [
  ['clear', [1000]],
  ['cloud', [1003, 1006, 1009]],
  ['fog', [1030, 1135, 1147]],
  ['drizzle', [1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183]],
  ['rain', [1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246]],
  [
    'snow',
    [1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264],
  ],
  ['storm', [1087, 1273, 1276, 1279, 1282]],
]
const EFFECT_BY_CODE = new Map(GROUPS.flatMap(([effect, codes]) => codes.map((c) => [c, effect])))

const ICONS = {
  clear: Sun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  unknown: HelpCircle,
}

export const effectForCode = (code) => (code === null ? 'unknown' : (EFFECT_BY_CODE.get(code) ?? 'unknown'))

export function describeWeather(code, isDay, text) {
  const effect = effectForCode(code)
  let Icon = ICONS[effect]
  if (code === 1000) Icon = isDay === false ? Moon : Sun
  else if (code === 1003) Icon = isDay === false ? CloudMoon : CloudSun
  return { label: text ?? 'Conditions unavailable', Icon, effect }
}
