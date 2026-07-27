<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { getThemeChartColors } from '../../utils/chartHelpers';
	import {
		buildGanttAnchorMap,
		buildGanttTree,
		computeGanttScale,
		formatGanttDate,
		ganttArrowHead,
		ganttDependencyPath,
		ganttLabelInk,
		GANTT_MILESTONE_HALF,
		layoutGanttRows,
		resolveGanttArrows,
		toUTCms
	} from '../../utils/gantt';
	import type { GanttBarSpec, GanttEdge, GanttItem, GanttLane, GanttRow } from '../../utils/gantt';
	import type { GanttTask } from '../../types/charts';

	let {
		tasks,
		today = false,
		locale = undefined,
		otherLabel = undefined,
		dependencies = true,
		groups = false,
		collapsed = false,
		legend = undefined,
		width = 900,
		rowHeight = 36,
		laneHeight = undefined,
		barLabelSize = 11,
		labelWidth = 180,
		class: className = ''
	}: {
		tasks: GanttTask[];
		today?: boolean | string | Date;
		locale?: string;
		otherLabel?: string;
		dependencies?: boolean;
		groups?: boolean;
		collapsed?: boolean | string[];
		legend?: boolean;
		width?: number;
		rowHeight?: number;
		laneHeight?: number;
		barLabelSize?: number;
		labelWidth?: number;
		class?: string;
	} = $props();

	const FALLBACK_COLOR = '#808080';
	/** matches `.gantt-bar-label` padding in the stylesheet below */
	const LABEL_PAD_INSIDE = 8;
	const LABEL_GAP_OUTSIDE = 6;

	const uid = $props.id();

	/**
	 * `collapsed` seeds this once and then hands control to whoever is clicking.
	 * Deriving it from the prop instead would silently revert a viewer's toggle
	 * on any unrelated re-render.
	 */
	// svelte-ignore state_referenced_locally
	const collapsedKeys = new SvelteSet<string>(
		collapsed === true
			? [...new Set(tasks.map((task) => task.section ?? '').filter(Boolean))]
			: Array.isArray(collapsed)
				? collapsed
				: []
	);

	/**
	 * A lane is a full row by default: collapsing should buy its space back by
	 * putting tasks side by side, not by shrinking them into something thinner
	 * than the rows above.
	 */
	const laneSize = $derived(laneHeight ?? rowHeight);

	let chartColors: string[] = $state([]);
	let canvasEl: HTMLDivElement | undefined = $state();
	let figureEl: HTMLElement | undefined = $state();
	let canvasWidth = $state(0);
	let toggling = $state(false);

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

	const items: GanttItem[] = $derived(
		tasks.map((task, taskIndex) => {
			const startMs = toUTCms(task.start);
			const endMs = task.end != null ? Math.max(toUTCms(task.end), startMs) : startMs;
			return {
				task,
				taskIndex,
				startMs,
				endMs,
				milestone: task.milestone === true || task.end == null
			};
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
		items.length
			? computeGanttScale(
					Math.min(...items.map((item) => item.startMs)),
					Math.max(...items.map((item) => item.endMs)),
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
	const taskIndexByKey = $derived.by(() => {
		const map = new Map<string, number>();
		items.forEach((item, i) => {
			if (!map.has(item.task.label)) map.set(item.task.label, i);
		});
		items.forEach((item, i) => {
			if (item.task.id) map.set(item.task.id, i);
		});
		return map;
	});

	const plotWidth = $derived(canvasWidth || Math.max(width - labelWidth, 0));

	const layout = $derived(
		layoutGanttRows(buildGanttTree(items, groups), {
			collapsed: collapsedKeys,
			rowHeight,
			laneHeight: laneSize,
			plotWidth,
			msToPx,
			labelFontSize: barLabelSize,
			barColor
		})
	);

	const anchors = $derived(buildGanttAnchorMap(layout.rows));

	const edges = $derived.by(() => {
		const out: GanttEdge[] = [];
		items.forEach((item, toTask) => {
			const deps = item.task.dependsOn;
			if (deps == null) return;
			for (const depKey of Array.isArray(deps) ? deps : [deps]) {
				const fromTask = taskIndexByKey.get(depKey);
				if (fromTask === undefined || fromTask === toTask) continue;
				out.push({ fromTask, toTask, depKey });
			}
		});
		return out;
	});

	const arrows = $derived.by(() => {
		if (!dependencies || !scale || !plotWidth) return [];
		return resolveGanttArrows(edges, anchors, { x: msToPx, rowY }).map((arrow) => ({
			key: arrow.key,
			line: ganttDependencyPath(arrow.x1, arrow.y1, arrow.x2, arrow.y2, groups ? laneSize : rowHeight),
			head: ganttArrowHead(arrow.x2, arrow.y2)
		}));
	});

	function pct(ms: number): number {
		if (!scale) return 0;
		return ((ms - scale.min) / (scale.max - scale.min)) * 100;
	}

	function msToPx(ms: number): number {
		return (pct(ms) / 100) * plotWidth;
	}

	/**
	 * The band a lane occupies inside its row. Only a collapsed group subdivides
	 * its row; every other row has a single lane filling the whole of it, so its
	 * bar stays centred against the label in the gutter.
	 */
	function laneBand(row: GanttRow, lane: number): { top: number; height: number } {
		return row.kind === 'group-collapsed'
			? { top: lane * laneSize, height: laneSize }
			: { top: 0, height: row.height };
	}

	/** vertical centre of a bar, in plot-canvas coordinates */
	function rowY(rowIndex: number, lane: number): number {
		const row = layout.rows[rowIndex];
		if (!row) return 0;
		const band = laneBand(row, lane);
		return row.y + band.top + band.height / 2;
	}

	function sectionColor(section: string): string {
		if (!chartColors.length) return FALLBACK_COLOR;
		return chartColors[sections.indexOf(section) % chartColors.length];
	}

	function barColor(bar: GanttBarSpec): string {
		return bar.color ?? sectionColor(bar.section ?? '');
	}

	function barTitle(bar: GanttBarSpec): string {
		const range = bar.milestone
			? formatGanttDate(bar.startMs, locale)
			: `${formatGanttDate(bar.startMs, locale)} – ${formatGanttDate(bar.endMs, locale)}`;
		const progress = bar.progress != null ? ` · ${bar.progress}%` : '';
		return `${bar.label}: ${range}${progress}`;
	}

	function clampProgress(value: number): number {
		return Math.min(Math.max(value, 0), 100);
	}

	/** Once every group prints its own name, the legend is pure duplication. */
	const showLegend = $derived(legend ?? (!groups && sections.length > 1));

	function rowId(index: number): string {
		return `${uid}-r${index}`;
	}

	async function toggle(section: string | undefined) {
		if (!section) return;
		if (!collapsedKeys.delete(section)) collapsedKeys.add(section);

		// the arrow layer is one SVG sized to the whole chart, so it can't follow a
		// height animation — blink it out instead and let the geometry snap
		toggling = true;
		await tick();
		figureEl?.dispatchEvent(new CustomEvent('reveal-svelte:refit', { bubbles: true }));
		requestAnimationFrame(() => {
			toggling = false;
		});
	}

	/**
	 * Reveal binds Space to "next slide" and does not exempt focused buttons, so
	 * without stopping the event here a toggle would also advance the deck.
	 */
	function onToggleKey(section: string | undefined) {
		return (event: KeyboardEvent) => {
			if (event.key !== ' ' && event.key !== 'Enter') return;
			event.preventDefault();
			event.stopPropagation();
			toggle(section);
		};
	}

	/**
	 * Placement is decided in px (see `resolveGanttLabel`) but painted in
	 * percentages anchored to the bar, so the label tracks it exactly on resize
	 * and an over-long estimate costs an ellipsis rather than an overlap.
	 */
	function labelStyle(lane: GanttLane): string {
		const startPct = pct(lane.bar.startMs);
		const endPct = lane.bar.milestone ? startPct : pct(lane.bar.endMs);
		const edge = lane.bar.milestone ? GANTT_MILESTONE_HALF : 0;
		const gap = LABEL_GAP_OUTSIDE + edge;

		switch (lane.label.placement) {
			case 'inside':
				return `left: calc(${startPct}% + ${LABEL_PAD_INSIDE}px); max-width: calc(${
					endPct - startPct
				}% - ${LABEL_PAD_INSIDE * 2}px);`;
			case 'right':
				return `left: calc(${endPct}% + ${gap}px); max-width: calc(${100 - endPct}% - ${gap + LABEL_GAP_OUTSIDE}px);`;
			case 'left':
				return `left: calc(${startPct}% - ${gap}px); max-width: calc(${startPct}% - ${gap + LABEL_GAP_OUTSIDE}px);`;
			default:
				return '';
		}
	}

	function labelInk(lane: GanttLane) {
		return ganttLabelInk({
			color: barColor(lane.bar),
			progress: lane.bar.progress,
			placement: lane.label.placement,
			labelRight: lane.barX + LABEL_PAD_INSIDE + lane.label.width,
			barX: lane.barX,
			barWidth: lane.barWidth
		});
	}
</script>

<figure
	bind:this={figureEl}
	class="gantt-chart {className}"
	class:has-groups={groups}
	class:is-toggling={toggling}
	style="width: {width}px; --gantt-row-height: {rowHeight}px; --gantt-bar-label-size: {barLabelSize}px;"
>
	{#if showLegend}
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
				{#each layout.rows as row, i (row.key)}
					{#if row.kind === 'task'}
						<div
							class="gantt-label"
							style="--gantt-row-h: {row.height}px; --gantt-depth: {row.depth};"
							title={row.label}
						>
							{row.label}
						</div>
					{:else}
						<div
							class="gantt-group-label"
							style="--gantt-row-h: {row.height}px; --gantt-depth: {row.depth}; --gantt-band-h: {laneBand(
								row,
								0
							).height}px;"
						>
							<button
								type="button"
								class="gantt-group-toggle"
								aria-expanded={!row.collapsed}
								aria-controls={rowId(i)}
								title={row.label}
								onclick={(event) => event.detail > 0 && toggle(row.section)}
								onkeydown={onToggleKey(row.section)}
							>
								<!-- sits in the row's first lane, not its middle, so a tall
								     collapsed group reads as a heading over its bars -->
								<span class="gantt-group-toggle-inner">
									<span class="gantt-disclosure" aria-hidden="true"></span>
									<span class="gantt-group-name">{row.label}</span>
								</span>
							</button>
						</div>
					{/if}
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
					{#each layout.rows as row, i (row.key)}
						<div
							class="gantt-row"
							class:gantt-group-row={row.kind !== 'task'}
							class:is-collapsed={row.collapsed}
							id={rowId(i)}
							role={row.kind === 'task' ? undefined : 'group'}
							aria-label={row.kind === 'task' ? undefined : row.label}
							style="--gantt-row-h: {row.height}px;"
						>
							{#each row.lanes as lane (lane.bar.key)}
								{@const bar = lane.bar}
								{@const band = laneBand(row, lane.lane)}
								<div class="gantt-lane" style="top: {band.top}px; height: {band.height}px;">
									{#if bar.milestone}
										<div
											class="gantt-milestone"
											class:is-summary={bar.summary}
											style="left: {pct(bar.startMs)}%; background: {barColor(bar)};"
											title={barTitle(bar)}
										></div>
									{:else}
										<div
											class="gantt-bar"
											class:is-summary={bar.summary}
											style="left: {pct(bar.startMs)}%; width: {pct(bar.endMs) -
												pct(bar.startMs)}%; background: {bar.progress != null
												? `color-mix(in srgb, ${barColor(bar)} 30%, transparent)`
												: barColor(bar)};"
											title={barTitle(bar)}
										>
											{#if bar.progress != null}
												<div
													class="gantt-progress"
													style="width: {clampProgress(bar.progress)}%; background: {barColor(bar)};"
												></div>
											{/if}
										</div>
									{/if}
									<!-- sibling of the bar, never a child: `.gantt-bar` clips its overflow -->
									{#if lane.label.placement !== 'none'}
										{@const ink = labelInk(lane)}
										<span
											class="gantt-bar-label is-{lane.label.placement}"
											class:is-ink-light={ink.tone === 'light'}
											class:is-ink-dark={ink.tone === 'dark'}
											class:is-ink-outside={ink.tone === 'outside'}
											style="{labelStyle(lane)} color: {ink.color};"
										>
											{bar.label}
										</span>
									{/if}
								</div>
							{/each}
						</div>
					{/each}
					{#if arrows.length}
						<svg
							class="gantt-arrows"
							width={plotWidth}
							height={layout.totalHeight}
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
		height: var(--gantt-row-h, var(--gantt-row-height));
		line-height: var(--gantt-row-h, var(--gantt-row-height));
		padding-right: 14px;
		box-sizing: border-box;
		text-align: right;
		font-size: 14px;
		color: var(--theme-text, #333);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/*
	 * A grouped chart is a tree, so its gutter reads as an outline: flush left,
	 * indented one step per level. A flat chart has no hierarchy to express and
	 * keeps its labels tucked against the axis.
	 */
	.has-groups .gantt-label,
	.has-groups .gantt-group-toggle {
		text-align: left;
		padding-left: calc(var(--gantt-group-indent, 14px) * var(--gantt-depth, 0));
	}

	.has-groups .gantt-group-toggle-inner {
		justify-content: flex-start;
	}

	.gantt-group-toggle-inner {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		width: 100%;
		min-width: 0;
		height: var(--gantt-band-h, var(--gantt-row-h, var(--gantt-row-height)));
	}

	.gantt-group-label {
		height: var(--gantt-row-h, var(--gantt-row-height));
	}

	.gantt-group-toggle {
		/* explicitly flex-start: a button otherwise centres its content vertically
		   through an anonymous UA box that `display: block` does not override */
		display: flex;
		align-items: flex-start;
		/* full height so the whole row stays clickable, even though the label
		   itself only occupies the first lane */
		width: 100%;
		height: 100%;
		/* reset explicitly — `all: unset` would drop the box model and break row alignment */
		appearance: none;
		background: none;
		border: 0;
		margin: 0;
		padding: 0 14px 0 0;
		box-sizing: border-box;
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		text-align: right;
		color: var(--gantt-group-label-color, var(--theme-text, #333));
		cursor: pointer;
	}

	.gantt-group-toggle:focus-visible {
		outline: 2px solid var(--theme-primary, #888);
		outline-offset: 2px;
	}

	.gantt-group-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.gantt-disclosure {
		flex: none;
		width: 0;
		height: 0;
		border-left: 5px solid currentColor;
		border-top: 4px solid transparent;
		border-bottom: 4px solid transparent;
		color: var(--gantt-disclosure-color, var(--theme-muted, #888));
		transition: transform 120ms ease;
	}

	[aria-expanded='true'] .gantt-disclosure {
		transform: rotate(90deg);
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
		height: var(--gantt-row-h, var(--gantt-row-height));
	}

	/*
	 * Always present, even for a single-lane row: the bar geometry below is all
	 * percentages, so without this wrapper every bar in a multi-lane group row
	 * would resolve its height against the whole row and come out too tall.
	 */
	.gantt-lane {
		position: absolute;
		left: 0;
		right: 0;
	}

	.gantt-bar {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		height: var(--gantt-bar-thickness, 62%);
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

	/* a group's stand-in bar reads as scaffolding, not as work */
	.gantt-bar.is-summary,
	.gantt-milestone.is-summary {
		opacity: 0.45;
	}

	.gantt-bar.is-summary {
		height: 34%;
		border-radius: 2px;
	}

	.gantt-bar-label {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		/*
		 * Above the arrow overlay, which is painted later. A dependency leaving a
		 * bar exits at the lane's vertical centre — exactly where a label placed
		 * beside that bar sits — and would otherwise strike through the text.
		 */
		z-index: 1;
		font-size: var(--gantt-bar-label-size, 11px);
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		/* the bar underneath owns the tooltip */
		pointer-events: none;
	}

	/* the estimate only picks the side; the rendered offset is exact */
	.gantt-bar-label.is-left {
		transform: translate(-100%, -50%);
	}

	.gantt-bar-label.is-ink-light {
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
	}

	.gantt-bar-label.is-ink-dark {
		text-shadow: 0 1px 2px rgb(255 255 255 / 0.55);
	}

	/*
	 * A label beside a bar sits on the slide, where gridlines and dependency
	 * connectors run straight through the gaps between its letters. Knock a halo
	 * of the slide's own background out around the glyphs.
	 */
	.gantt-bar-label.is-ink-outside {
		text-shadow:
			0 0 3px var(--theme-bg, #1e1e2e),
			0 0 3px var(--theme-bg, #1e1e2e),
			0 0 2px var(--theme-bg, #1e1e2e);
	}

	/*
	 * Deliberately no entrance animation on `.gantt-lane`: animating opacity or
	 * transform would make it a stacking context, trapping `.gantt-bar-label`'s
	 * z-index inside the lane so labels could never paint above the arrow
	 * overlay. Toggling reads fine on the arrow blink alone.
	 */
	.gantt-arrows {
		transition: opacity 120ms ease;
	}

	.gantt-chart.is-toggling .gantt-arrows {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.gantt-arrows,
		.gantt-disclosure {
			transition: none;
		}
	}
</style>
