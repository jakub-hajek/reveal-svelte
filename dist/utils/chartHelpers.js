export function getThemeColor(varName) {
    if (typeof document === 'undefined')
        return '#808080';
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || '#808080';
}
export function getThemeChartColors() {
    return Array.from({ length: 12 }, (_, i) => getThemeColor(`--theme-chart-${i + 1}`));
}
/**
 * Chart.js bakes colors into canvas pixels at draw time, so it doesn't pick up
 * CSS variable changes on its own. Call `onUpdate` whenever a ThemeToggle
 * flips `data-theme`, so callers can recompute colors and redraw.
 */
export function onThemeChange(onUpdate) {
    if (typeof document === 'undefined')
        return () => { };
    const observer = new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
            onUpdate();
        }
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
}
