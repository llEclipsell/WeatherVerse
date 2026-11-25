import gsap from 'gsap'

/** The veil is the "passing through the atmosphere" layer that joins the globe to the city photograph. */
let veil = null

export function registerVeil(el) {
  veil = el
  if (el) gsap.set(el, { autoAlpha: 0 })
}

/** Text shown on the veil while the city's photograph and weather finish loading. */
export function setVeilLabel(text) {
  const label = veil?.querySelector('.veil-label')
  if (label) label.textContent = text
}

export function veilIn(duration, delay = 0) {
  return new Promise((resolve) => {
    if (!veil) return resolve()
    gsap.killTweensOf(veil)
    gsap.fromTo(
      veil,
      { scale: 0.55 },
      { autoAlpha: 1, scale: 1.5, duration, delay, ease: 'power2.in', onComplete: resolve, onInterrupt: resolve },
    )
  })
}

export function veilOut(duration = 0.9) {
  if (!veil) return
  gsap.killTweensOf(veil)
  gsap.to(veil, { autoAlpha: 0, duration, ease: 'power2.out', onComplete: () => setVeilLabel('') })
}

export const veilVisible = () => (veil ? Number(gsap.getProperty(veil, 'opacity')) > 0.01 : false)
