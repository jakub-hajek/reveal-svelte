export declare function getThemeColor(varName: string): string;
export declare function getThemeChartColors(): string[];
/**
 * Chart.js bakes colors into canvas pixels at draw time, so it doesn't pick up
 * CSS variable changes on its own. Call `onUpdate` whenever a ThemeToggle
 * flips `data-theme`, so callers can recompute colors and redraw.
 */
export declare function onThemeChange(onUpdate: () => void): () => void;
