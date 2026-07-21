/**
 * Auto-fit slides by scaling down content that overflows the slide viewport.
 *
 * Strategy:
 * 1. For each leaf `<section>`, temporarily set height to `auto` so it expands
 *    to its natural content height.
 * 2. Compare the natural height with the configured slide viewport height.
 * 3. If the content is taller, apply `transform: scale(…)` so everything
 *    fits without clipping.
 *
 * Call after Reveal.js initialises and on `slidechanged` / `resize` events.
 */
export declare function autoFitSlides(revealEl: HTMLElement): void;
