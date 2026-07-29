<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';
	import { getThemeChartColors, getThemeColor, onThemeChange } from '../../utils/chartHelpers';
	import type { ChartData, ChartOptions } from '../../types/charts';

	Chart.register(PieController, ArcElement, Tooltip, Legend);

	let {
		data,
		options = {},
		width = 600,
		height = 400,
		class: className = ''
	}: {
		data: ChartData;
		options?: ChartOptions;
		width?: number;
		height?: number;
		class?: string;
	} = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;
	let chartColors: string[] = [];

	function buildDefaultOptions(): ChartOptions {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true,
					position: 'right',
					labels: {
						color: getThemeColor('--theme-text'),
						font: {
							family: 'Inter, system-ui, sans-serif'
						}
					}
				},
				tooltip: {
					backgroundColor: getThemeColor('--theme-surface-0'),
					titleColor: getThemeColor('--theme-text'),
					bodyColor: getThemeColor('--theme-subtext'),
					borderColor: getThemeColor('--theme-surface-2'),
					borderWidth: 1
				}
			}
		};
	}

	const processedData = $derived(() => {
		const processed = { ...data };
		processed.datasets = processed.datasets.map((dataset) => ({
			...dataset,
			backgroundColor: dataset.backgroundColor || chartColors,
			borderColor: dataset.borderColor || getThemeColor('--theme-bg'),
			borderWidth: dataset.borderWidth ?? 2
		})) as ChartData['datasets'];
		return processed;
	});

	function syncChart() {
		if (!chartInstance) return;
		chartColors = getThemeChartColors();
		chartInstance.data = processedData();
		chartInstance.options = { ...buildDefaultOptions(), ...options };
		chartInstance.update();
	}

	onMount(() => {
		chartColors = getThemeChartColors();
		if (canvasElement) {
			chartInstance = new Chart(canvasElement, {
				type: 'pie',
				data: processedData(),
				options: { ...buildDefaultOptions(), ...options }
			});
		}

		const stopWatchingTheme = onThemeChange(syncChart);

		return () => {
			stopWatchingTheme();
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	$effect(() => {
		if (chartInstance) {
			chartInstance.data = processedData();
			chartInstance.options = { ...buildDefaultOptions(), ...options };
			chartInstance.update();
		}
	});
</script>

<div class="pie-chart-container {className}" style="width: {width}px; height: {height}px;">
	<canvas bind:this={canvasElement}></canvas>
</div>

<style>
	.pie-chart-container {
		position: relative;
	}
</style>
