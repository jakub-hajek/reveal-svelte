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
export function autoFitSlides(revealEl) {
    const slidesContainer = revealEl.querySelector('.slides');
    if (!slidesContainer)
        return;
    const slideHeight = slidesContainer.offsetHeight || 700;
    const sections = revealEl.querySelectorAll('.slides section');
    for (const section of sections) {
        // Skip vertical-stack wrappers – they contain child sections.
        if (section.querySelector(':scope > section'))
            continue;
        // ---- reset previous fit ------------------------------------------------
        section.style.transform = '';
        section.style.transformOrigin = '';
        // ---- measure natural content height ------------------------------------
        const prevHeight = section.style.height;
        section.style.height = 'auto';
        const contentHeight = section.scrollHeight;
        section.style.height = prevHeight;
        // 2 px tolerance to avoid sub-pixel false positives.
        if (contentHeight <= slideHeight + 2 || slideHeight === 0)
            continue;
        // ---- scale to fit ------------------------------------------------------
        const scale = slideHeight / contentHeight;
        // Never shrink below 40 % – anything smaller becomes unreadable.
        const clampedScale = Math.max(scale, 0.4);
        section.style.transform = `scale(${clampedScale.toFixed(4)})`;
        section.style.transformOrigin = 'top center';
    }
}
