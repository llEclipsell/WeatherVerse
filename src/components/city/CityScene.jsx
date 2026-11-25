import { forwardRef } from 'react'

import { CityImage } from './CityImage'
import { WeatherEffects } from './WeatherEffects'

/**
 * Layer order, bottom to top: photograph, colour grades, weather atmosphere, legibility scrims.
 * Typography lives outside this component so text never sits inside an animated layer.
 */
export const CityScene = forwardRef(function CityScene(
  { image, look, quality, onImageSettled, onImageFallback, children },
  fxRef,
) {
  return (
    <div className="story-scene">
      <div data-intro-zoom className="absolute inset-0">
        <div data-media className="absolute inset-0 will-change-transform">
          <CityImage image={image} onSettled={onImageSettled} onFallback={onImageFallback} />
        </div>
      </div>
      <div className="grade grade-night" style={{ opacity: look.isNight ? 1 : 0 }} aria-hidden="true" />
      <div data-grade="fog" className="grade grade-fog" aria-hidden="true">
        <span />
        <span />
      </div>
      <div data-grade="storm" className="grade grade-storm" aria-hidden="true" />
      <div
        data-grade="sun"
        className={`grade ${look.nextSun === 'sunset' ? 'grade-sunset' : 'grade-sunrise'}`}
        aria-hidden="true"
      />
      <WeatherEffects
        ref={fxRef}
        kind={look.fxKind}
        intensity={look.fxIntensity}
        slant={look.slant}
        quality={quality}
      />
      <div className="grade scrim" aria-hidden="true" />
      <div data-grade="handoff" className="grade grade-handoff" aria-hidden="true" />
      {children}
    </div>
  )
})
