import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, RotateCw, TriangleAlert } from 'lucide-react'

import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { buildFlowStory, buildPinnedStory, CHAPTER_STOPS } from '../../animations/scrollAnimations'
import { veilOut } from '../../animations/cityTransition'
import { getCityImage } from '../../services/cityImages'
import { MY_LOCATION_ID } from '../../services/cities'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useWeatherStore } from '../../store/weatherStore'
import { airPhrase, deriveLook, windPhrase } from '../../lib/storyDerive'
import { describeWeather } from '../../lib/weatherCodes'
import { compass, fmtCoord, fmtNum, fmtTemp, fmtVisibility, timeHM, tzLabel, uvLabel } from '../../lib/format'
import { CityScene } from './CityScene'
import { StoryChapter } from './StoryChapter'
import { Figure, RainOutlook, Readout, SunArc, WindDial } from './WeatherOverlay'

const CHAPTERS = ['Current conditions', 'The atmosphere', 'Wind and precipitation', 'The day ahead']

export function CityStory({ city, data, isPending, errorMessage, onRetry, onBack }) {
  const root = useRef(null)
  const fx = useRef(null)
  const trigger = useRef(null)
  const [settled, setSettled] = useState(false)
  const [active, setActive] = useState(0)
  const [photoFailed, setPhotoFailed] = useState(false)
  const onImageFallback = useCallback(() => setPhotoFailed(true), [])

  const reduced = useReducedMotion()
  const roomy = useMediaQuery('(min-width: 900px) and (min-height: 600px)')
  const mode = roomy && !reduced ? 'pinned' : 'flow'
  const quality = useWeatherStore((s) => s.quality)
  const unit = useWeatherStore((s) => s.tempUnit)
  const image = useMemo(() => getCityImage(city.id), [city.id])

  const look = deriveLook(data)
  const lookKey = `${look.fog.toFixed(2)}|${look.storm.toFixed(2)}|${look.fxKind}|${look.fxIntensity.toFixed(2)}|${look.nextSun}`

  const onImageSettled = useCallback(() => setSettled(true), [])
  // Never hold the text hostage to a slow image.
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 1400)
    return () => window.clearTimeout(id)
  }, [])

  // Arrival: lift the veil, ease the photograph back from the dive, bring the title in.
  useGSAP(
    () => {
      if (reduced) {
        if (settled) veilOut(0.2)
        return
      }
      if (!settled) {
        gsap.set('[data-in]', { autoAlpha: 0, y: 40 })
        return
      }
      veilOut(1)
      gsap.fromTo('[data-intro-zoom]', { scale: 1.22 }, { scale: 1, duration: 2.2, ease: 'power3.out' })
      gsap.to('[data-in]', { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09, ease: 'power3.out', delay: 0.2 })
    },
    { scope: root, dependencies: [settled, reduced] },
  )

  // The scroll story. Rebuilt (and fully reverted first) when layout mode or the real conditions change.
  useGSAP(
    () => {
      if (!root.current) return
      trigger.current = null
      if (mode === 'pinned') {
        trigger.current = buildPinnedStory({ root: root.current, look, fx: fx.current, onChapter: setActive })
      } else if (!reduced) {
        buildFlowStory({ root: root.current, look, fx: fx.current })
      }
      return () => fx.current?.setAmount(0)
    },
    { scope: root, dependencies: [mode, reduced, lookKey], revertOnUpdate: true },
  )

  // Pin distances depend on final layout: measure again once the image is in.
  useEffect(() => {
    if (settled) ScrollTrigger.refresh()
  }, [settled])

  const goToChapter = (i) => {
    const st = trigger.current
    if (st) {
      window.scrollTo({ top: st.start + (st.end - st.start) * CHAPTER_STOPS[i], behavior: 'smooth' })
    } else {
      root.current
        ?.querySelector(`[data-chapter="${i + 1}"]`)
        ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    }
  }
  const goToForecast = () =>
    document.getElementById('forecast')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })

  const c = data?.current
  const today = data?.daily[0]
  const info = describeWeather(c?.conditionCode ?? null, c?.isDay ?? null, c?.conditionText ?? null)
  const nextHours = data ? data.hourly.slice(data.nowIndex, data.nowIndex + 12) : []
  const loading = isPending && !data
  const isHere = city.id === MY_LOCATION_ID
  const title = isHere ? data?.place.name || 'Your location' : city.name
  const place = isHere
    ? [data?.place.region, data?.place.country].filter(Boolean).join(', ')
    : [city.admin1, city.country].filter(Boolean).join(', ')
  const alertCount = data?.alerts.status === 'active' ? data.alerts.items.length : 0
  const goToAlerts = () => document.getElementById('alerts')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })

  return (
    <section ref={root} className="story" data-mode={mode} aria-label={`Weather story for ${title}`}>
      <a
        href="#forecast"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          goToForecast()
        }}
      >
        Skip the story and go to the forecast
      </a>
      <div className="story-stage">
        <CityScene
          ref={fx}
          image={image}
          look={look}
          quality={quality}
          onImageSettled={onImageSettled}
          onImageFallback={onImageFallback}
        >
          <p className="credit">
            {image.isPhoto && !photoFailed ? `Photo: ${image.credit}. ` : 'Illustration. '}
            Not a live view. Effects follow current conditions{look.isNight ? '; tinted for local night' : ''}.
          </p>
        </CityScene>

        <div className="story-chapters">
          <article data-chapter="1" className="chapter chapter-1">
            <div className="chapter-body">
              <p className="kicker" data-in>
                {isHere ? 'Your location' : fmtCoord(city.latitude, city.longitude)}
                {data && (
                  <>
                    {' '}
                    &nbsp;/&nbsp; {timeHM(c?.time)} {tzLabel(data.timezone)}
                  </>
                )}
              </p>
              <h1 className="city-name" data-in>
                {title}
              </h1>
              {place && (
                <p className="city-place" data-in>
                  {place}
                </p>
              )}

              <div className="now-row" data-in>
                <span className={`now-temp ${loading ? 'shimmer' : ''}`}>{fmtTemp(c?.temperature ?? null, unit)}</span>
                <div className="now-meta">
                  {loading ? (
                    <p role="status">Fetching live conditions...</p>
                  ) : errorMessage ? (
                    <div role="alert">
                      <p className="font-medium">Live weather did not load.</p>
                      <p className="mt-1 text-sm text-cloud/80">{errorMessage}</p>
                      <div className="mt-3 flex gap-2">
                        <button className="btn btn-solid" onClick={onRetry}>
                          <RotateCw size={15} aria-hidden="true" /> Try again
                        </button>
                        <button className="btn" onClick={onBack}>
                          Back to the globe
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="now-desc">
                        <info.Icon size={22} aria-hidden="true" /> {info.label}
                      </p>
                      <p className="text-cloud/85">Feels like {fmtTemp(c?.feelsLike ?? null, unit)}</p>
                    </>
                  )}
                </div>
              </div>
              {alertCount > 0 && (
                <button type="button" className="alert-chip" data-in onClick={goToAlerts}>
                  <TriangleAlert size={15} aria-hidden="true" />
                  {alertCount} active weather {alertCount === 1 ? 'alert' : 'alerts'} - read below
                </button>
              )}
              <p className="scroll-cue" data-in>
                <ArrowDown size={14} aria-hidden="true" /> Scroll to read the sky
              </p>
            </div>
          </article>

          <StoryChapter index={2} kicker="Chapter 2 of 4" title="The atmosphere">
            <p className="lede">{airPhrase(c?.humidity ?? null)}</p>
            <div className="mt-6 space-y-5">
              <Readout
                label="Humidity"
                value={fmtNum(c?.humidity ?? null)}
                unit="%"
                loading={loading}
                fraction={c?.humidity == null ? null : c.humidity / 100}
              />
              <Readout
                label="Cloud cover"
                value={fmtNum(c?.cloudCover ?? null)}
                unit="%"
                loading={loading}
                fraction={c?.cloudCover == null ? null : c.cloudCover / 100}
              />
              <Readout
                label="Pressure at sea level"
                value={fmtNum(c?.pressure ?? null)}
                unit=" hPa"
                loading={loading}
                fraction={c?.pressure == null ? null : (c.pressure - 960) / 90}
              />
            </div>
          </StoryChapter>

          <StoryChapter index={3} kicker="Chapter 3 of 4" title="Wind and precipitation">
            <p className="lede">{windPhrase(c?.windSpeed ?? null)}</p>
            <div className="mt-6 flex items-center gap-6">
              <WindDial direction={c?.windDirection ?? null} />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Figure label="Wind">
                  {fmtNum(c?.windSpeed ?? null)}
                  <small> km/h {c?.windDirection != null && compass(c.windDirection)}</small>
                </Figure>
                <Figure label="Gusts">
                  {fmtNum(c?.windGusts ?? null)}
                  <small> km/h</small>
                </Figure>
                <Figure label="Falling now">
                  {fmtNum(c?.precipitation ?? null, 1)}
                  <small> mm</small>
                </Figure>
                <Figure label="Visibility">{fmtVisibility(c?.visibility ?? null)}</Figure>
              </div>
            </div>
            <div className="mt-6">
              <RainOutlook hours={nextHours} />
            </div>
          </StoryChapter>

          <StoryChapter index={4} kicker="Chapter 4 of 4" title="The day ahead">
            {today?.sunrise && today.sunset ? (
              <>
                <SunArc sunrise={timeHM(today.sunrise)} sunset={timeHM(today.sunset)} progress={look.dayProgress} />
                <div className="sun-times">
                  <span>
                    <b>{timeHM(today.sunrise)}</b> Sunrise
                  </span>
                  <span>
                    Sunset <b>{timeHM(today.sunset)}</b>
                  </span>
                </div>
              </>
            ) : (
              <p className="lede">
                {loading ? 'Loading sunrise and sunset...' : 'Sunrise and sunset are unavailable.'}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-end justify-center gap-x-10 gap-y-4">
              <Figure label="High">{fmtTemp(today?.tempMax ?? null, unit)}</Figure>
              <Figure label="Low">{fmtTemp(today?.tempMin ?? null, unit)}</Figure>
              <Figure label="Peak UV">
                {fmtNum(today?.uvIndexMax ?? null, 1)}
                <small> {today?.uvIndexMax != null && uvLabel(today.uvIndexMax)}</small>
              </Figure>
            </div>
            <button className="btn btn-solid mx-auto mt-8" onClick={goToForecast}>
              See the full forecast <ArrowDown size={15} aria-hidden="true" />
            </button>
          </StoryChapter>
        </div>

        {mode === 'pinned' && (
          <nav className="rail" aria-label="Story chapters">
            <span className="rail-track" aria-hidden="true">
              <i data-rail-fill />
            </span>
            {CHAPTERS.map((name, i) => (
              <button
                key={name}
                type="button"
                className="rail-stop"
                data-active={i === active}
                title={name}
                aria-current={i === active ? 'step' : undefined}
                onClick={() => goToChapter(i)}
              >
                <span className="sr-only">
                  Go to chapter {i + 1}: {name}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
