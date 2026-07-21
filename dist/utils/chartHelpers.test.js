import { describe, it, expect, beforeAll, vi } from 'vitest';
import { getThemeColor, getThemeChartColors } from './chartHelpers';
describe('chartHelpers', () => {
    beforeAll(() => {
        const mockGetComputedStyle = vi.fn((element) => {
            const mockColors = {
                '--theme-chart-1': '#f38ba8',
                '--theme-chart-2': '#89b4fa',
                '--theme-chart-3': '#a6e3a1',
                '--theme-chart-4': '#fab387',
                '--theme-chart-5': '#cba6f7',
                '--theme-chart-6': '#74c7ec',
                '--theme-chart-7': '#f9e2af',
                '--theme-chart-8': '#94e2d5',
                '--theme-chart-9': '#f5c2e7',
                '--theme-chart-10': '#89dceb',
                '--theme-chart-11': '#eba0ac',
                '--theme-chart-12': '#b4befe',
                '--theme-bg': '#1e1e2e',
                '--theme-text': '#cdd6f4'
            };
            return {
                getPropertyValue: (varName) => mockColors[varName] || ''
            };
        });
        // @ts-ignore - mocking browser API
        global.getComputedStyle = mockGetComputedStyle;
    });
    it('getThemeColor returns CSS variable value', () => {
        const bgColor = getThemeColor('--theme-bg');
        expect(bgColor).toBe('#1e1e2e');
        const textColor = getThemeColor('--theme-text');
        expect(textColor).toBe('#cdd6f4');
    });
    it('getThemeColor returns fallback for undefined variable', () => {
        const unknownColor = getThemeColor('--theme-nonexistent');
        expect(unknownColor).toBe('#808080');
    });
    it('getThemeChartColors returns all 12 chart colors', () => {
        const colors = getThemeChartColors();
        expect(colors).toHaveLength(12);
        expect(colors[0]).toBe('#f38ba8');
        expect(colors[11]).toBe('#b4befe');
    });
});
