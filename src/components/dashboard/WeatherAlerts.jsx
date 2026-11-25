import { CircleCheck, CircleHelp, CircleX, TriangleAlert } from 'lucide-react'

import { instantInZone } from '../../lib/format'

const tone = (severity) => {
  const s = (severity ?? '').toLowerCase()
  if (s === 'extreme' || s === 'severe') return 'alert-severe'
  if (s === 'moderate') return 'alert-moderate'
  return 'alert-minor'
}

function Notice({ Icon, children }) {
  return (
    <p className="panel flex items-center gap-3 px-4 py-3.5 text-sm text-cloud/90">
      <Icon size={18} className="shrink-0 text-haze" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

/**
 * Alerts are never invented. The four outcomes are kept apart on purpose:
 * alerts returned, none returned, not supported by this plan, and request failed.
 */
export function WeatherAlerts({ alerts, failed, timezone }) {
  let body
  if (failed || !alerts) {
    body = (
      <Notice Icon={CircleX}>
        The alert request failed, so it is not known whether any alerts are active. Try again.
      </Notice>
    )
  } else if (alerts.status === 'unsupported') {
    body = (
      <Notice Icon={CircleHelp}>
        This weather plan did not include alert data for this location, so alerts cannot be shown.
      </Notice>
    )
  } else if (alerts.status === 'unreadable') {
    body = <Notice Icon={CircleX}>The weather service sent alert data that could not be read.</Notice>
  } else if (alerts.status === 'none') {
    body = <Notice Icon={CircleCheck}>No active weather alerts are available for this location.</Notice>
  } else {
    body = (
      <ul className="grid gap-3 lg:grid-cols-2">
        {alerts.items.map((a) => {
          const from = instantInZone(a.effective, timezone)
          const to = instantInZone(a.expires, timezone)
          return (
            <li key={a.id} className={`alert-card ${tone(a.severity)}`}>
              <div className="flex items-start gap-3">
                <TriangleAlert size={20} className="alert-icon mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-snug">{a.event ?? a.headline}</p>
                  {a.event && a.headline && a.headline !== a.event && (
                    <p className="mt-0.5 text-sm text-cloud/80">{a.headline}</p>
                  )}
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                    {a.severity && (
                      <>
                        <dt className="text-haze">Severity</dt>
                        <dd>{a.severity}</dd>
                      </>
                    )}
                    {a.urgency && (
                      <>
                        <dt className="text-haze">Urgency</dt>
                        <dd>{a.urgency}</dd>
                      </>
                    )}
                    {from && (
                      <>
                        <dt className="text-haze">From</dt>
                        <dd>{from}</dd>
                      </>
                    )}
                    {to && (
                      <>
                        <dt className="text-haze">Until</dt>
                        <dd>{to}</dd>
                      </>
                    )}
                    {a.areas && (
                      <>
                        <dt className="text-haze">Areas</dt>
                        <dd className="break-words">{a.areas}</dd>
                      </>
                    )}
                  </dl>
                  {(a.description || a.instruction) && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-medium">Read the full alert</summary>
                      {a.description && <p className="mt-2 whitespace-pre-line text-cloud/85">{a.description}</p>}
                      {a.instruction && (
                        <p className="mt-2 whitespace-pre-line text-cloud/85">
                          <b>What to do: </b>
                          {a.instruction}
                        </p>
                      )}
                    </details>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section id="alerts" aria-labelledby="alerts-title" className="scroll-mt-24">
      <h3 id="alerts-title" className="section-title">
        Weather alerts
      </h3>
      {body}
      {alerts?.status === 'active' && (
        <p className="mt-2 font-mono text-[11px] text-haze">
          Issued by government agencies and relayed by the weather provider. Times are local to the city. Text may be in
          the local language.
        </p>
      )}
    </section>
  )
}
