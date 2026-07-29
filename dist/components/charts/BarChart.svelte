<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Title,
		Tooltip,
		Legend
	} from 'chart.js';
	import { getThemeChartColors, getThemeColor, onThemeChange } from '../../utils/chartHelpers';
	import type { ChartData, ChartOptions } from '../../types/charts';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

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
					position: 'top',
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
			},
			scales: {
				x: {
					grid: {
						color: getThemeColor('--theme-surface-1')
					},
					ticks: {
						color: getThemeColor('--theme-muted')
					}
				},
				y: {
					beginAtZero: true,
					grid: {
						color: getThemeColor('--theme-surface-1')
					},
					ticks: {
						color: getThemeColor('--theme-muted')
					}
				}
			}
		};
	}

	const processedData = $derived(() => {
		const processed = { ...data };
		processed.datasets = processed.datasets.map((dataset, index) => ({
			...dataset,
			backgroundColor:
				dataset.backgroundColor || chartColors[index % chartColors.length],
			borderColor:
				dataset.borderColor || chartColors[index % chartColors.length],
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
				type: 'bar',
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

<div class="bar-chart-container {className}" style="width: {width}px; height: {height}px;">
	<canvas bind:this={canvasElement}></canvas>
</div>

<style>
	.bar-chart-container {
		position: relative;
	}
</style>
