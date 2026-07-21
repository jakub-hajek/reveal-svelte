export function getThemeColor(varName: string): string {
	if (typeof document === 'undefined') return '#808080';
	const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return value || '#808080';
}

export function getThemeChartColors(): string[] {
	return Array.from({ length: 12 }, (_, i) => getThemeColor(`--theme-chart-${i + 1}`));
}
