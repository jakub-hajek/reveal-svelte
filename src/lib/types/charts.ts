import type { ChartData as ChartJSData, ChartOptions as ChartJSOptions } from 'chart.js';

export type ChartData = ChartJSData;
export type ChartOptions = ChartJSOptions;

export interface ChartProps {
	data: ChartData;
	options?: ChartOptions;
	width?: number;
	height?: number;
}
