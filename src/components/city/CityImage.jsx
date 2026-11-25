import { useEffect, useRef, useState } from 'react'

/**
 * A single <img> for the whole story. Only its transform and the layers above it ever change.
 * Load order: city photograph -> default image -> nothing (the scene's own gradient shows).
 */
export function CityImage({ image, onSettled, onFallback }) {
  const [stage, setStage] = useState('photo')
  const ref = useRef(null)
  const src = stage === 'photo' ? image.src : image.fallbackSrc

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) onSettled()
  }, [src, onSettled])

  if (stage === 'none') return null
  return (
    <img
      ref={ref}
      src={src}
      alt={`${stage === 'photo' ? image.alt : 'Illustrated city skyline'} (illustrative, not a live view)`}
      width={2400}
      height={1500}
      decoding="async"
      fetchPriority="high"
      draggable={false}
      onLoad={onSettled}
      onError={() => {
        onFallback()
        if (stage === 'photo' && image.fallbackSrc !== image.src) setStage('fallback')
        else {
          setStage('none')
          onSettled()
        }
      }}
      style={{ objectPosition: stage === 'photo' ? image.position : '50% 50%' }}
      className="h-full w-full select-none object-cover"
    />
  )
}
