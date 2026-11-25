/**
 * Thin bridge between DOM-side code and the lazily loaded 3D scene.
 * It imports nothing from three, so the main bundle stays light.
 */

export const globeBridge = {
  controller: null,
  planetRotationY: 0,
}
