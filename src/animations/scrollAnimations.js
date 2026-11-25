import { gsap } from '../lib/gsap'

/** Scroll progress at which each chapter is fully on screen. Used by the chapter rail. */
export const CHAPTER_STOPS = [0, 0.38, 0.63, 0.88]
const CHAPTER_STARTS = [0, 0.25, 0.5, 0.75]

export const chapterAt = (progress) => {
  let i = 0
  for (let k = 0; k < CHAPTER_STARTS.length; k++) if (progress >= CHAPTER_STARTS[k]) i = k
  return i
}

/**
 * Desktop story: the stage is pinned and one scrubbed timeline (12 units long, 3 per chapter)
 * drives the photograph's framing, the grades and the text. Only transforms and opacity are animated.
 */
export function buildPinnedStory({ root, look, fx, onChapter }) {
  const q = gsap.utils.selector(root)
  const stage = q('.story-stage')[0]
  const media = q('[data-media]')
  const ch = (n) => q(`[data-chapter="${n}"]`)
  const fxState = { amount: 0 }
  let current = 0

  gsap.set([ch(2), ch(3), ch(4)], { autoAlpha: 0, y: 56 })

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 3.4)}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const next = chapterAt(self.progress)
        if (next !== current) onChapter((current = next))
      },
    },
  })

  // Photograph: one continuous camera move, re-framed once per chapter.
  tl.to(media, { scale: 1.08, yPercent: -1.2, duration: 3, ease: 'sine.inOut' }, 0)
    .to(media, { scale: 1.2, xPercent: -3.5, yPercent: 0, duration: 3, ease: 'sine.inOut' }, 3)
    .to(media, { scale: 1.3, xPercent: 3, yPercent: 2.5, duration: 3, ease: 'sine.inOut' }, 6)
    .to(media, { scale: 1.05, xPercent: 0, yPercent: 0, duration: 3, ease: 'sine.inOut' }, 9)

  // Chapter text
  tl.to(ch(1), { autoAlpha: 0, y: -56, duration: 0.9 }, 2.1)
    .to(ch(2), { autoAlpha: 1, y: 0, duration: 0.9 }, 3)
    .to(ch(2), { autoAlpha: 0, y: -56, duration: 0.8 }, 5.2)
    .to(ch(3), { autoAlpha: 1, y: 0, duration: 0.9 }, 6)
    .to(ch(3), { autoAlpha: 0, y: -56, duration: 0.8 }, 8.2)
    .to(ch(4), { autoAlpha: 1, y: 0, duration: 0.9 }, 9)

  // Atmosphere, scaled by the real conditions
  tl.to(q('[data-grade="fog"]'), { opacity: look.fog, duration: 1.2 }, 2.8)
    .to(q('[data-grade="fog"]'), { opacity: look.fog * 0.35, duration: 1 }, 5.6)
    .to(q('[data-grade="fog"]'), { opacity: 0, duration: 1 }, 8.4)
    .to(q('[data-grade="storm"]'), { opacity: look.storm, duration: 1.1 }, 5.8)
    .to(q('[data-grade="storm"]'), { opacity: 0, duration: 1 }, 8.4)
    .to(fxState, { amount: 1, duration: 1, onUpdate: () => fx?.setAmount(fxState.amount) }, 6)
    .to(fxState, { amount: 0, duration: 0.8, onUpdate: () => fx?.setAmount(fxState.amount) }, 8.4)
    .to(q('[data-grade="sun"]'), { opacity: 0.85, duration: 1.6 }, 9)
    .to(q('[data-grade="handoff"]'), { opacity: 1, duration: 1.2, ease: 'power1.in' }, 10.8)

  tl.fromTo(q('[data-rail-fill]'), { scaleY: 0 }, { scaleY: 1, duration: 12, ease: 'none' }, 0)

  return tl.scrollTrigger
}

/**
 * Small screens: no pin and no scrub. The scene sticks behind normally scrolling chapters,
 * and each chapter simply switches its atmosphere on while it is in view.
 */
export function buildFlowStory({ root, look, fx }) {
  const q = gsap.utils.selector(root)
  const chapters = q('[data-chapter]')
  const fxState = { amount: 0 }
  const range = { start: 'top 62%', end: 'bottom 38%', toggleActions: 'play reverse play reverse' }

  chapters.slice(1).forEach((el) => {
    gsap.from(el.querySelector('.chapter-body'), {
      autoAlpha: 0,
      y: 36,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 72%', toggleActions: 'play none none reverse' },
    })
  })
  gsap.to(q('[data-grade="fog"]'), {
    opacity: look.fog,
    duration: 0.8,
    scrollTrigger: { trigger: chapters[1], ...range },
  })
  gsap.to(q('[data-grade="storm"]'), {
    opacity: look.storm,
    duration: 0.8,
    scrollTrigger: { trigger: chapters[2], ...range },
  })
  gsap.to(fxState, {
    amount: 1,
    duration: 0.8,
    onUpdate: () => fx?.setAmount(fxState.amount),
    scrollTrigger: { trigger: chapters[2], ...range },
  })
  gsap.to(q('[data-grade="sun"]'), {
    opacity: 0.8,
    duration: 1,
    scrollTrigger: { trigger: chapters[3], start: 'top 62%', toggleActions: 'play none none reverse' },
  })
}
