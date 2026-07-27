<script lang="ts">
	import { onMount } from 'svelte';
	import { getThemeChartColors } from '../../utils/chartHelpers';
	import {
		computeGanttScale,
		formatGanttDate,
		ganttArrowHead,
		ganttDependencyPath,
		toUTCms
	} from '../../utils/gantt';
	import type { GanttTask } from '../../types/charts';

	let {
		tasks,
		today = false,
		locale = undefined,
		otherLabel = undefined,
		dependencies = true,
		width = 900,
		rowHeight = 36,
		labelWidth = 180,
		class: className = ''
	}: {
		tasks: GanttTask[];
		today?: boolean | string | Date;
		locale?: string;
		otherLabel?: string;
		dependencies?: boolean;
		width?: number;
		rowHeight?: number;
		labelWidth?: number;
		class?: string;
	} = $props();

	const FALLBACK_COLOR = '#808080';
	/** half the milestone diamond, so arrows meet its vertices, not its centre */
	const MILESTONE_HALF = 7;

	let chartColors: string[] = $state([]);
	let canvasEl: HTMLDivElement | undefined = $state();
	let canvasWidth = $state(0);

	onMount(() => {
		chartColors = getThemeChartColors();
	});

	// arrows need pixel coordinates; bars and gridlines stay percentage-based
	$effect(() => {
		const el = canvasEl;
		if (!el) return;
		canvasWidth = el.clientWidth;
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => {
			canvasWidth = el.clientWidth;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	const rows = $derived(
		tasks.map((task) => {
			const startMs = toUTCms(task.start);
			const endMs = task.end != null ? Math.max(toUTCms(task.end), startMs) : startMs;
			return { task, startMs, endMs, milestone: task.milestone === true || task.end == null };
		})
	);

	const sections = $derived([...new Set(tasks.map((task) => task.section ?? ''))]);

	const unnamedSectionLabel = $derived.by(() => {
		if (otherLabel != null) return otherLabel;
		const lang = (locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'))
			.split('-')[0]
			.toLowerCase();
		return lang === 'cs' ? 'Ostatní' : 'Other';
	});

	const scale = $derived(
		rows.length
			? computeGanttScale(
					Math.min(...rows.map((row) => row.startMs)),
					Math.max(...rows.map((row) => row.endMs)),
					locale
				)
			: null
	);

	const todayPct = $derived.by(() => {
		if (!scale || today === false) return null;
		const ms = today === true ? Date.now() : toUTCms(today);
		return ms >= scale.min && ms <= scale.max ? pct(ms) : null;
	});

	/** `dependsOn` accepts either an explicit `id` or a task `label`; ids win */
	const rowIndexByKey = $derived.by(() => {
		const map = new Map<string, number>();
		rows.forEach((row, i) => {
			if (!map.has(row.task.label)) map.set(row.task.label, i);
		});
		rows.forEach((row, i) => {
			if (row.task.id) map.set(row.task.id, i);
		});
		return map;
	});

	const plotWidth = $derived(canvasWidth || Math.max(width - labelWidth, 0));

	const arrows = $derived.by(() => {
		if (!dependencies || !scale || !plotWidth) return [];

		const x = (ms: number) => (pct(ms) / 100) * plotWidth;
		const y = (index: number) => index * rowHeight + rowHeight / 2;
		const out: { key: string; line: string; head: string }[] = [];

		rows.forEach((row, toIndex) => {
			const deps = row.task.dependsOn;
			if (deps == null) return;
			for (const key of Array.isArray(deps) ? deps : [deps]) {
				const fromIndex = rowIndexByKey.get(key);
				if (fromIndex === undefined || fromIndex === toIndex) continue;
				const from = rows[fromIndex];
				const x1 = x(from.endMs) + (from.milestone ? MILESTONE_HALF : 0);
				const x2 = x(row.startMs) - (row.milestone ? MILESTONE_HALF : 0);
				const y1 = y(fromIndex);
				const y2 = y(toIndex);
				out.push({
					key: `${fromIndex}->${toIndex}:${key}`,
					line: ganttDependencyPath(x1, y1, x2, y2, rowHeight),
					head: ganttArrowHead(x2, y2)
				});
			}
		});
		return out;
	});

	function pct(ms: number): number {
		if (!scale) return 0;
		return ((ms - scale.min) / (scale.max - scale.min)) * 100;
	}

	function sectionColor(section: string): string {
		if (!chartColors.length) return FALLBACK_COLOR;
		return chartColors[sections.indexOf(section) % chartColors.length];
	}

	function taskColor(task: GanttTask): string {
		return task.color ?? sectionColor(task.section ?? '');
	}

	function taskTitle(row: (typeof rows)[number]): string {
		const range = row.milestone
			? formatGanttDate(row.startMs, locale)
			: `${formatGanttDate(row.startMs, locale)} – ${formatGanttDate(row.endMs, locale)}`;
		const progress = row.task.progress != null ? ` · ${row.task.progress}%` : '';
		return `${row.task.label}: ${range}${progress}`;
	}

	function clampProgress(value: number): number {
		return Math.min(Math.max(value, 0), 100);
	}
</script>

<figure
	class="gantt-chart {className}"
	style="width: {width}px; --gantt-row-height: {rowHeight}px;"
>
	{#if sections.length > 1}
		<ul class="gantt-legend">
			{#each sections as section (section)}
				<li>
					<span class="legend-swatch" style="background: {sectionColor(section)};"></span>
					{section === '' ? unnamedSectionLabel : section}
				</li>
			{/each}
		</ul>
	{/if}

	{#if scale}
		<div class="gantt-body">
			<div class="gantt-labels" style="width: {labelWidth}px;">
				<div class="gantt-axis-spacer"></div>
				{#each rows as row, i (i)}
					<div class="gantt-label" title={row.task.label}>{row.task.label}</div>
				{/each}
			</div>
			<div class="gantt-plot">
				<div class="gantt-axis">
					{#each scale.ticks as tick (tick.ms)}
						<span class="gantt-tick" style="left: {pct(tick.ms)}%;">{tick.label}</span>
					{/each}
				</div>
				<div class="gantt-canvas" bind:this={canvasEl}>
					{#each scale.ticks as tick (tick.ms)}
						<div class="gantt-gridline" style="left: {pct(tick.ms)}%;"></div>
					{/each}
					{#if todayPct != null}
						<div class="gantt-today" style="left: {todayPct}%;"></div>
					{/if}
					{#each rows as row, i (i)}
						<div class="gantt-row">
							{#if row.milestone}
								<div
									class="gantt-milestone"
									style="left: {pct(row.startMs)}%; background: {taskColor(row.task)};"
									title={taskTitle(row)}
								></div>
							{:else}
								<div
									class="gantt-bar"
									style="left: {pct(row.startMs)}%; width: {pct(row.endMs) -
										pct(row.startMs)}%; background: {row.task.progress != null
										? `color-mix(in srgb, ${taskColor(row.task)} 30%, transparent)`
										: taskColor(row.task)};"
									title={taskTitle(row)}
								>
									{#if row.task.progress != null}
										<div
											class="gantt-progress"
											style="width: {clampProgress(row.task.progress)}%; background: {taskColor(
												row.task
											)};"
										></div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
					{#if arrows.length}
						<svg
							class="gantt-arrows"
							width={plotWidth}
							height={rows.length * rowHeight}
							aria-hidden="true"
						>
							{#each arrows as arrow (arrow.key)}
								<path class="gantt-arrow-line" d={arrow.line} />
								<path class="gantt-arrow-head" d={arrow.head} />
							{/each}
						</svg>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</figure>

<style>
	.gantt-chart {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-family: Inter, system-ui, sans-serif;
	}

	.gantt-legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px 18px;
		font-size: 13px;
		color: var(--theme-subtext, #666);
	}

	.gantt-legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}

	.gantt-body {
		display: flex;
	}

	.gantt-labels {
		flex: none;
	}

	.gantt-axis-spacer,
	.gantt-axis {
		height: 26px;
	}

	.gantt-label {
		height: var(--gantt-row-height);
		line-height: var(--gantt-row-height);
		padding-right: 14px;
		box-sizing: border-box;
		text-align: right;
		font-size: 14px;
		color: var(--theme-text, #333);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.gantt-plot {
		flex: 1;
		min-width: 0;
	}

	.gantt-axis {
		position: relative;
		font-size: 12px;
		color: var(--theme-muted, #888);
	}

	.gantt-tick {
		position: absolute;
		top: 4px;
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.gantt-canvas {
		position: relative;
	}

	.gantt-gridline {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--theme-surface-1, #e5e5e5);
	}

	.gantt-today {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 2px dashed var(--theme-muted, #888);
		transform: translateX(-1px);
	}

	.gantt-row {
		position: relative;
		height: var(--gantt-row-height);
	}

	.gantt-bar {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		height: 62%;
		min-width: 4px;
		border-radius: 4px;
		overflow: hidden;
	}

	.gantt-progress {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		border-radius: 4px;
	}

	.gantt-arrows {
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
		pointer-events: none;
	}

	.gantt-arrow-line {
		fill: none;
		stroke: var(--gantt-dependency-color, var(--theme-muted, #888));
		stroke-width: 1.5;
		stroke-linejoin: round;
	}

	.gantt-arrow-head {
		fill: var(--gantt-dependency-color, var(--theme-muted, #888));
	}

	.gantt-milestone {
		position: absolute;
		top: 50%;
		width: 13px;
		height: 13px;
		transform: translate(-50%, -50%) rotate(45deg);
		border-radius: 2px;
	}
</style>
