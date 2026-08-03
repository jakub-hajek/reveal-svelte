<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { getThemeChartColors } from '../../utils/chartHelpers';
	import {
		buildGanttAnchorMap,
		buildGanttTooltipModel,
		buildGanttTree,
		computeGanttScale,
		estimateGanttTooltipHeight,
		formatGanttDate,
		formatGanttDuration,
		ganttArrowHead,
		ganttDependencyPath,
		ganttLabelInk,
		ganttMarkerLabelAnchor,
		ganttSubtaskSegments,
		ganttTooltipLabels,
		ganttTooltipText,
		GANTT_MILESTONE_HALF,
		layoutGanttRows,
		placeGanttMarkerLabelRows,
		placeGanttTooltip,
		readableTextColor,
		resolveGanttArrows,
		toUTCms
	} from '../../utils/gantt';
	import type {
		GanttBarSpec,
		GanttEdge,
		GanttItem,
		GanttLane,
		GanttRow,
		GanttSubtaskSegment,
		GanttTooltipModel
	} from '../../utils/gantt';
	import type { GanttMarker, GanttTask } from '../../types/charts';

	let {
		tasks,
		today = false,
		markers = [],
		locale = undefined,
		otherLabel = undefined,
		dependencies = true,
		groups = false,
		collapsed = true,
		summaryBar = false,
		legend = undefined,
		tooltip = true,
		tooltipWidth = 260,
		width = 900,
		rowHeight = 36,
		laneHeight = undefined,
		barLabelSize = 11,
		labelWidth = 180,
		class: className = ''
	}: {
		tasks: GanttTask[];
		today?: boolean | string | Date;
		markers?: GanttMarker[];
		locale?: string;
		otherLabel?: string;
		dependencies?: boolean;
		groups?: boolean;
		collapsed?: boolean | string[];
		summaryBar?: boolean;
		legend?: boolean;
		tooltip?: boolean;
		tooltipWidth?: number;
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
	/**
	 * Long enough that sweeping the pointer across a collapsed group's packed
	 * lanes doesn't strobe a popup for every bar on the way.
	 */
	const TOOLTIP_DELAY_MS = 120;
	/** matches `.gantt-axis { height: var(--gantt-axis-h, 26px) }` below */
	const AXIS_HEIGHT = 26;
	/** extra axis height claimed by each row of marker captions, when any marker has one */
	const MARKER_BAND = 18;
	/** matches `.gantt-marker-label { font-size: var(--gantt-marker-label-size, 11px) }` below */
	const MARKER_LABEL_SIZE = 11;
	/** matches `.gantt-tooltip` padding in the stylesheet below */
	const TOOLTIP_PAD_X = 10;

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

	/**
	 * Which bar the popup is describing, keyed by `GanttBarSpec.key` — never by
	 * row/lane index, which `layout` invalidates on every resize and every group
	 * toggle. (The key is `t:<taskIndex>` or `g:<section>:roll`, unique unless a
	 * section is literally named `t:3`.)
	 *
	 * Pin beats hover: reaching a pinned popup with the pointer means crossing
	 * other bars, so letting hover win would close the thing you're reaching for.
	 */
	let hoverKey: string | null = $state(null);
	let pinnedKey: string | null = $state(null);
	let tipEl: HTMLDivElement | undefined = $state();
	// plain `let`: read only from handlers, never rendered
	let hoverTimer: ReturnType<typeof setTimeout> | undefined;

	const activeKey = $derived(pinnedKey ?? hoverKey);

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

	/**
	 * Out-of-range markers are dropped rather than clamped to an edge, where they
	 * would claim a date they don't have — the same call `today` makes.
	 */
	const markerLines = $derived.by(() => {
		const range = scale;
		if (!range) return [];
		return markers
			.map((marker, i) => ({ marker, ms: toUTCms(marker.date), key: `m:${i}` }))
			.filter(({ ms }) => ms >= range.min && ms <= range.max)
			.map(({ marker, ms, key }) => ({
				key,
				pct: pct(ms),
				label: marker.label,
				color: marker.color,
				style: marker.style ?? 'dashed',
				anchor: ganttMarkerLabelAnchor(pct(ms))
			}));
	});

	/**
	 * Which row (0, 1, 2, ...) each marker's caption prints on, keyed by its
	 * `key`, so two dates close enough to collide stack onto extra lines instead
	 * of printing on top of each other.
	 */
	const markerLabelRows = $derived.by(() => {
		const labeled = markerLines.filter((marker): marker is typeof marker & { label: string } =>
			Boolean(marker.label)
		);
		if (!labeled.length) return new Map<string, number>();
		const rows = placeGanttMarkerLabelRows(
			labeled.map((marker) => ({
				x: (marker.pct / 100) * plotWidth,
				text: marker.label,
				anchor: marker.anchor
			})),
			MARKER_LABEL_SIZE
		);
		return new Map(labeled.map((marker, i) => [marker.key, rows[i]]));
	});

	/** the captions get their own band above the ticks, one row's worth per row it took */
	const axisHeight = $derived(
		AXIS_HEIGHT + (markerLabelRows.size ? MARKER_BAND * (Math.max(...markerLabelRows.values()) + 1) : 0)
	);

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
			barColor,
			summaryBar
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

	/**
	 * Segments a task's bar into its subtasks — only for a task drawn on its own
	 * row. A task rolled into a collapsed group's packed bar is a `'group-collapsed'`
	 * row, not `'task'`, so it stays a plain bar without extra lookup logic.
	 */
	function subtaskSegments(row: GanttRow, bar: GanttBarSpec): GanttSubtaskSegment[] | null {
		if (row.kind !== 'task' || bar.taskIndex < 0 || bar.milestone) return null;
		const subtasks = tasks[bar.taskIndex]?.subtasks;
		return subtasks?.length ? ganttSubtaskSegments(subtasks) : null;
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

		// the bar it pointed at may be about to disappear, and a popup overhanging
		// the slide's bottom edge would be measured by the refit dispatched below
		pinnedKey = null;
		hoverKey = null;

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
	 * The offset is painted in percentages anchored to the bar, so the label
	 * tracks it exactly on resize. The width is the px `maxWidth` the layout
	 * computed — the percentage the offset comes from would measure to the plot
	 * edge, whereas a label beside a bar may only have the gap up to its neighbour
	 * on the same lane. An over-long estimate then costs an ellipsis, never an
	 * overlap.
	 */
	/**
	 * Where the layout actually put this bar, as percentages of the plot.
	 *
	 * Reading the geometry back rather than re-deriving it from the dates is what
	 * lets the layout shorten a bar — which it does to leave the milestone that
	 * closes it some daylight. The two agree to the pixel for every bar the layout
	 * left alone, since `msToPx` is this same percentage scaled by `plotWidth`.
	 *
	 * Percent rather than the layout's own px so that a resize landing between
	 * layout passes rescales the bar with the plot instead of stranding it.
	 */
	function laneBox(lane: GanttLane): { startPct: number; endPct: number } {
		if (!(plotWidth > 0)) {
			const startPct = pct(lane.bar.startMs);
			return { startPct, endPct: lane.bar.milestone ? startPct : pct(lane.bar.endMs) };
		}
		const startPct = (lane.barX / plotWidth) * 100;
		return { startPct, endPct: startPct + (lane.barWidth / plotWidth) * 100 };
	}

	function labelStyle(lane: GanttLane): string {
		const { startPct, endPct } = laneBox(lane);
		const edge = lane.bar.milestone ? GANTT_MILESTONE_HALF : 0;
		const gap = LABEL_GAP_OUTSIDE + edge;
		const width = `max-width: ${Math.round(lane.label.maxWidth * 100) / 100}px;`;

		switch (lane.label.placement) {
			case 'inside':
				return `left: calc(${startPct}% + ${LABEL_PAD_INSIDE}px); ${width}`;
			case 'right':
				return `left: calc(${endPct}% + ${gap}px); ${width}`;
			case 'left':
				return `left: calc(${startPct}% - ${gap}px); ${width}`;
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

	// -----------------------------------------------------------------------
	// Detail popup
	// -----------------------------------------------------------------------

	const tipLabels = $derived(
		ganttTooltipLabels(locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'))
	);

	function tooltipModel(bar: GanttBarSpec): GanttTooltipModel {
		return buildGanttTooltipModel(bar, tasks, edges);
	}

	/** The one-line form, for the bar's accessible name and the `tooltip={false}` title. */
	function barSummary(bar: GanttBarSpec): string {
		return ganttTooltipText(tooltipModel(bar), { locale, labels: tipLabels });
	}

	/**
	 * One string rather than two dates around a literal dash in the markup: the
	 * space before the dash is significant, and markup whitespace around an
	 * `{#if}` is not something to stake typography on.
	 */
	function tipRange(model: GanttTooltipModel): string {
		return model.milestone
			? formatGanttDate(model.startMs, locale)
			: `${formatGanttDate(model.startMs, locale)} – ${formatGanttDate(model.endMs, locale)}`;
	}

	/** Re-found each pass: `layout` is rebuilt on resize and on every group toggle. */
	const activeLane = $derived.by(() => {
		if (!activeKey) return null;
		for (let i = 0; i < layout.rows.length; i += 1) {
			const lane = layout.rows[i].lanes.find((candidate) => candidate.bar.key === activeKey);
			if (lane) return { row: layout.rows[i], lane };
		}
		// the bar collapsed away under us — drop the popup rather than strand it
		return null;
	});

	const tip = $derived.by(() => {
		const found = activeLane;
		if (!found || !scale || !plotWidth) return null;

		const { row, lane } = found;
		const model = tooltipModel(lane.bar);
		const band = laneBand(row, lane.lane);
		/*
		 * Anchored to the bar's midpoint and to its lane *band*, not to the
		 * pointer and not to the bar's painted edges: `clientX` arrives in
		 * reveal's scaled coordinate space and there is no pointer at all on the
		 * focus path, while the bar's height is `--gantt-bar-thickness`, a CSS
		 * percentage this script can't read.
		 */
		const place = placeGanttTooltip(
			{
				x: lane.bar.milestone ? lane.barX : lane.barX + lane.barWidth / 2,
				top: row.y + band.top,
				bottom: row.y + band.top + band.height
			},
			{
				width: tooltipWidth,
				height: estimateGanttTooltipHeight(model, {
					innerWidth: tooltipWidth - 2 * TOOLTIP_PAD_X,
					titleSize: 13,
					fontSize: 12,
					lineHeight: 17,
					blockGap: 6,
					chrome: 18,
					progressHeight: 14
				})
			},
			{ width: plotWidth, height: layout.totalHeight, headroom: axisHeight }
		);

		return { model, place, color: barColor(lane.bar) };
	});

	function showTip(key: string) {
		clearTimeout(hoverTimer);
		hoverKey = key;
	}

	function showTipSoon(key: string) {
		clearTimeout(hoverTimer);
		hoverTimer = setTimeout(() => {
			hoverKey = key;
		}, TOOLTIP_DELAY_MS);
	}

	function hideTip(key: string) {
		clearTimeout(hoverTimer);
		if (hoverKey === key) hoverKey = null;
	}

	function togglePin(key: string) {
		pinnedKey = pinnedKey === key ? null : key;
		hoverKey = null;
	}

	$effect(() => () => clearTimeout(hoverTimer));

	/*
	 * Only mounted while something is pinned, so Escape reaches reveal — which
	 * binds it to the slide overview — every other time. Capture phase on
	 * `window` runs ahead of reveal's own document listener, which is what makes
	 * `stopPropagation` actually suppress it.
	 */
	$effect(() => {
		if (pinnedKey == null) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			pinnedKey = null;
		};
		const onDown = (event: MouseEvent) => {
			const target = event.target as Element | null;
			if (!target) return;
			if (tipEl?.contains(target)) return;
			// a bar in *this* chart re-pins through its own handler; the guard is
			// what keeps a second chart on the slide from unpinning this one
			if (figureEl?.contains(target) && target.closest('.gantt-bar, .gantt-milestone')) return;
			pinnedKey = null;
		};

		window.addEventListener('keydown', onKey, true);
		window.addEventListener('mousedown', onDown, true);
		return () => {
			window.removeEventListener('keydown', onKey, true);
			window.removeEventListener('mousedown', onDown, true);
		};
	});

	/**
	 * Reveal binds Space to "next slide" and Escape to the overview, and exempts
	 * neither for a focused button — the same trap `onToggleKey` above works
	 * around. Escape is only swallowed when there is actually a popup to close.
	 */
	function onBarKey(key: string) {
		return (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (pinnedKey == null && hoverKey == null) return;
				event.preventDefault();
				event.stopPropagation();
				pinnedKey = null;
				hoverKey = null;
				return;
			}
			if (event.key !== ' ' && event.key !== 'Enter') return;
			event.preventDefault();
			event.stopPropagation();
			togglePin(key);
		};
	}

	/**
	 * A bar is a `<button>` only when it has a popup to open. Without one it goes
	 * back to being a plain div — one tab stop per task is a real cost on a slide
	 * that has other controls on it.
	 */
	const barTag = $derived(tooltip ? 'button' : 'div');

	function barAttrs(bar: GanttBarSpec) {
		if (!tooltip) return { title: barSummary(bar) };
		return {
			type: 'button' as const,
			// the bar has no text child — `.gantt-bar-label` is a sibling — so this
			// is its whole accessible name, exactly what `title` used to supply
			'aria-label': barSummary(bar),
			// pinned, not merely hovered: otherwise every bar reads as expanded
			'aria-expanded': pinnedKey === bar.key,
			// enter/leave rather than over/out: they don't bubble between lanes
			onmouseenter: () => showTipSoon(bar.key),
			onmouseleave: () => hideTip(bar.key),
			onfocus: () => showTip(bar.key),
			onblur: () => hideTip(bar.key),
			// `detail > 0` for the same reason as the group toggle: a button
			// synthesises a detail-0 click from Enter and Space, and `onBarKey`
			// has already toggled by then
			onclick: (event: MouseEvent) => event.detail > 0 && togglePin(bar.key),
			onkeydown: onBarKey(bar.key)
		};
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
		<div class="gantt-body" style="--gantt-axis-h: {axisHeight}px;">
			<div class="gantt-labels" style="width: {labelWidth}px;">
				<div class="gantt-axis-spacer"></div>
				{#each layout.rows as row, i (row.key)}
					{#if row.kind === 'task'}
						<div
							class="gantt-label"
							class:is-root={row.depth === 0}
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
					<!-- captions live up here, not on the canvas, where they would land on bars -->
					{#each markerLines as marker (marker.key)}
						{#if marker.label}
							<span
								class="gantt-marker-label is-{marker.anchor}"
								style="left: {marker.pct}%; top: {(markerLabelRows.get(marker.key) ?? 0) *
									MARKER_BAND}px; {marker.color ? `color: ${marker.color};` : ''}"
								>{marker.label}</span
							>
						{/if}
					{/each}
				</div>
				<div class="gantt-canvas" bind:this={canvasEl}>
					{#each scale.ticks as tick (tick.ms)}
						<div class="gantt-gridline" style="left: {pct(tick.ms)}%;"></div>
					{/each}
					{#if todayPct != null}
						<div class="gantt-today" style="left: {todayPct}%;"></div>
					{/if}
					<!-- before the rows, like the gridlines: bars paint over their lines -->
					{#each markerLines as marker (marker.key)}
						<div
							class="gantt-marker"
							aria-hidden="true"
							style="left: {marker.pct}%; border-left-style: {marker.style}; {marker.color
								? `border-left-color: ${marker.color};`
								: ''}"
						></div>
					{/each}
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
								{@const box = laneBox(lane)}
								{@const segments = subtaskSegments(row, bar)}
								<div class="gantt-lane" style="top: {band.top}px; height: {band.height}px;">
									{#if bar.milestone}
										<svelte:element
											this={barTag}
											class="gantt-milestone"
											class:is-summary={bar.summary}
											class:is-active={activeKey === bar.key}
											style="left: {box.startPct}%; background: {barColor(bar)};"
											{...barAttrs(bar)}
										></svelte:element>
									{:else}
										<svelte:element
											this={barTag}
											class="gantt-bar"
											class:is-summary={bar.summary}
											class:abuts={lane.abuts}
											class:is-active={activeKey === bar.key}
											style="left: {box.startPct}%; width: {box.endPct -
												box.startPct}%; background: {segments || bar.progress == null
												? barColor(bar)
												: `color-mix(in srgb, ${barColor(bar)} 30%, transparent)`};"
											{...barAttrs(bar)}
										>
											<!-- a span, not a div: the bar is a button, whose content
											     model is phrasing only -->
											{#if segments}
												{#each segments as seg, si (si)}
													<span
														class="gantt-subtask"
														style="left: {seg.startFraction *
															100}%; width: {(seg.endFraction - seg.startFraction) *
															100}%; color: {readableTextColor(barColor(bar))};"
														aria-hidden="true"
													>
														<span class="gantt-subtask-label">{seg.description}</span>
													</span>
												{/each}
											{:else if bar.progress != null}
												<span
													class="gantt-progress"
													style="width: {clampProgress(bar.progress)}%; background: {barColor(bar)};"
												></span>
											{/if}
										</svelte:element>
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
					<!--
						One instance, and a child of the canvas rather than of a lane:
						`.gantt-bar` clips its children, and any positioned overlay inside
						`.gantt-lane` repeats the stacking-context trap documented at the
						bottom of this stylesheet. `aria-hidden` because it says exactly
						what each bar's `aria-label` already says.
					-->
					{#if tip}
						<div
							bind:this={tipEl}
							class="gantt-tooltip is-{tip.place.placement}"
							class:is-pinned={pinnedKey != null}
							aria-hidden="true"
							style="left: {tip.place.left}px; {tip.place.placement === 'above'
								? `bottom: ${tip.place.bottom}px`
								: `top: ${tip.place.top}px`}; width: {tooltipWidth}px; --gantt-tooltip-arrow: {tip
								.place.arrowOffset}px;"
						>
							<!-- the scroll clip lives here, not on the popup: `overflow` on the
							     popup itself would cut off the caret hanging off its edge -->
							<div class="gantt-tooltip-body">
								<p class="gantt-tooltip-title">{tip.model.label}</p>
							<p class="gantt-tooltip-dates">
								{tipRange(tip.model)}{#if tip.model.days != null}<span class="gantt-tooltip-sep"
										>·</span
									>{formatGanttDuration(tip.model.days, locale)}{/if}
							</p>
							{#if tip.model.progress != null}
								<div class="gantt-tooltip-progress">
									<span class="gantt-tooltip-track">
										<span
											class="gantt-tooltip-fill"
											style="width: {clampProgress(tip.model.progress)}%; background: {tip.color};"
										></span>
									</span>
									<span class="gantt-tooltip-pct">{clampProgress(tip.model.progress)}%</span>
								</div>
							{/if}
							{#if tip.model.predecessors.length}
								<p class="gantt-tooltip-deps">
									<span class="gantt-tooltip-key">{tipLabels.dependsOn}</span>
									{tip.model.predecessors.join(', ')}
								</p>
							{/if}
							{#if tip.model.successors.length}
								<p class="gantt-tooltip-deps">
									<span class="gantt-tooltip-key">{tipLabels.followedBy}</span>
									{tip.model.successors.join(', ')}
								</p>
							{/if}
								{#if tip.model.comment}
									<p class="gantt-tooltip-comment">{tip.model.comment}</p>
								{/if}
							</div>
						</div>
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

	/* grows to fit the marker captions; the gutter spacer has to grow with it */
	.gantt-axis-spacer,
	.gantt-axis {
		height: var(--gantt-axis-h, 26px);
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
	}

	.has-groups .gantt-group-toggle {
		padding-left: calc(var(--gantt-group-indent, 14px) * var(--gantt-depth, 0));
	}

	/*
	 * The disclosure triangle hangs in its own gutter, so a task's text and a
	 * group's name start on the same column at the same depth instead of the
	 * task sliding left into the space the triangle would have used.
	 */
	.has-groups .gantt-label {
		padding-left: calc(
			var(--gantt-group-indent, 14px) * var(--gantt-depth, 0) +
				var(--gantt-disclosure-slot, 11px)
		);
	}

	/* a task with no section is a peer of the group headings, so it reads like
	   one — just with nothing to expand */
	.has-groups .gantt-label.is-root {
		font-weight: 600;
		color: var(--gantt-group-label-color, var(--theme-text, #333));
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

	/* bottom-anchored: the ticks stay against the canvas whatever the caption
	   band above them costs */
	.gantt-tick {
		position: absolute;
		bottom: 6px;
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
		border-left: 2px dashed var(--gantt-today-color, var(--theme-muted, #888));
		transform: translateX(-1px);
	}

	/* `border-left-style` and `-color` are overridden per marker inline */
	.gantt-marker {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 2px dashed var(--gantt-marker-color, var(--theme-muted, #888));
		transform: translateX(-1px);
	}

	.gantt-marker-label {
		position: absolute;
		top: 0;
		padding: 0 4px;
		border-radius: 3px;
		font-size: var(--gantt-marker-label-size, 11px);
		line-height: 16px;
		white-space: nowrap;
		background: var(--gantt-marker-label-bg, var(--theme-surface-0, transparent));
		color: var(--gantt-marker-color, var(--theme-muted, #888));
	}

	/* `.is-start` keeps the caption's left edge on the line — no transform */
	.gantt-marker-label.is-middle {
		transform: translateX(-50%);
	}

	.gantt-marker-label.is-end {
		transform: translateX(-100%);
	}

	.gantt-row {
		position: relative;
		height: var(--gantt-row-h, var(--gantt-row-height));
	}

	/*
	 * Always present, even for a single-lane row: the bar geometry below is all
	 * percentages, so without this wrapper every bar in a multi-lane group row
	 * would resolve its height against the whole row and come out too tall.
	 *
	 * One lane element per *bar*, not per packed lane, and each spans the full
	 * width of the plot — so inside a collapsed group every bar sharing a lane
	 * is roofed over by the transparent wrapper of whichever lane-mate the
	 * layout emitted last. Transparent to the pointer, so the hit test falls
	 * through to the bar that is actually under the cursor.
	 */
	.gantt-lane {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.gantt-bar {
		position: absolute;
		/* back on: the lane above opts its whole subtree out */
		pointer-events: auto;
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

	/*
	 * No lane of their own: a segment fills the same box `.gantt-bar` already
	 * occupies, just sliced horizontally, and inherits its parent's rounded-corner
	 * clip via `overflow: hidden` on `.gantt-bar`.
	 */
	.gantt-subtask {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	/* same seam token as `.gantt-bar.abuts::before` — two adjacent things that
	   must not read as one */
	.gantt-subtask:not(:last-child) {
		border-right: 1px solid var(--gantt-bar-seam-color, var(--theme-bg, #1e1e2e));
	}

	.gantt-subtask-label {
		flex: 1;
		min-width: 0;
		padding: 0 4px;
		font-size: var(--gantt-bar-label-size, 11px);
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/*
	 * A task collapsed onto the same lane as the one it follows shares its colour
	 * and touches its edge, so the pair paints as one long bar. A hairline of the
	 * slide's own background down the leading edge separates them for the cost of
	 * a pixel — cheaper than the lane a real gap would have taken.
	 *
	 * Above `.gantt-progress`, which is a later sibling and would cover it.
	 */
	.gantt-bar.abuts::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: var(--gantt-bar-seam-width, 1px);
		background: var(--gantt-bar-seam-color, var(--theme-bg, #1e1e2e));
		z-index: 1;
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
		/* see `.gantt-bar` */
		pointer-events: auto;
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
		/* the bar underneath owns the hover popup */
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

	/* ------------------------------------------------------------------
	   Detail popup
	   ------------------------------------------------------------------ */

	/*
	 * Explicit reset rather than `all: unset`, which would drop the box model the
	 * absolute positioning above depends on — the same reasoning as on
	 * `.gantt-group-toggle`. `cursor: default`: a bar opens a popup, it doesn't
	 * navigate anywhere.
	 */
	button.gantt-bar,
	button.gantt-milestone {
		appearance: none;
		padding: 0;
		border: 0;
		font: inherit;
		color: inherit;
		cursor: default;
	}

	button.gantt-bar:focus-visible,
	button.gantt-milestone:focus-visible {
		outline: 2px solid var(--theme-primary, #888);
		outline-offset: 2px;
	}

	.gantt-bar.is-active,
	.gantt-milestone.is-active {
		filter: brightness(1.12);
	}

	.gantt-progress {
		display: block;
	}

	.gantt-tooltip {
		position: absolute;
		/* over `.gantt-arrows` and over `.gantt-bar-label`'s own z-index: 1 */
		z-index: 2;
		box-sizing: border-box;
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid var(--gantt-tooltip-border, var(--theme-border, #6c7086));
		/* must stay opaque: bars and gridlines run underneath it */
		background: var(--gantt-tooltip-bg, var(--theme-surface-0, #313244));
		color: var(--gantt-tooltip-color, var(--theme-text, #cdd6f4));
		box-shadow: var(--gantt-tooltip-shadow, 0 6px 18px rgb(0 0 0 / 0.35));
		font-size: var(--gantt-tooltip-font-size, 12px);
		line-height: 1.4;
		/* slides centre their text; a detail panel reads as a block */
		text-align: left;
		/*
		 * Transient by default, so it can never steal the hover from the bar it is
		 * describing — which is what removes the need for a hover bridge or a
		 * close delay. Pinning is the moment it becomes a thing you can point at.
		 */
		pointer-events: none;
	}

	.gantt-tooltip.is-pinned {
		pointer-events: auto;
		user-select: text;
	}

	/*
	 * The clip lives on the body rather than the popup: `overflow` on the popup
	 * would take the caret hanging off its edge with it.
	 */
	.gantt-tooltip-body {
		max-height: var(--gantt-tooltip-max-height, 320px);
		overflow: hidden;
	}

	.gantt-tooltip.is-pinned .gantt-tooltip-body {
		overflow-y: auto;
	}

	.gantt-tooltip p {
		margin: 0;
	}

	.gantt-tooltip-body > * + * {
		margin-top: 6px;
	}

	.gantt-tooltip-title {
		font-size: 13px;
		font-weight: 600;
	}

	.gantt-tooltip-dates,
	.gantt-tooltip-deps {
		color: var(--gantt-tooltip-muted, var(--theme-subtext, #bac2de));
	}

	.gantt-tooltip-sep {
		margin: 0 6px;
		opacity: 0.6;
	}

	.gantt-tooltip-key {
		color: var(--theme-muted, #888);
	}

	.gantt-tooltip-progress {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.gantt-tooltip-track {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--theme-surface-1, #45475a);
		overflow: hidden;
	}

	.gantt-tooltip-fill {
		display: block;
		height: 100%;
		border-radius: 3px;
	}

	.gantt-tooltip-pct {
		font-variant-numeric: tabular-nums;
	}

	/* the author's newlines are content; wrapping still applies on top */
	.gantt-tooltip-comment {
		white-space: pre-line;
	}

	/* a rotated square, so the caret inherits the popup's fill exactly */
	.gantt-tooltip::after {
		content: '';
		position: absolute;
		left: var(--gantt-tooltip-arrow, 50%);
		width: 8px;
		height: 8px;
		background: inherit;
		transform: translateX(-50%) rotate(45deg);
	}

	.gantt-tooltip.is-above::after {
		bottom: -5px;
		border-right: 1px solid var(--gantt-tooltip-border, var(--theme-border, #6c7086));
		border-bottom: 1px solid var(--gantt-tooltip-border, var(--theme-border, #6c7086));
	}

	.gantt-tooltip.is-below::after {
		top: -5px;
		border-left: 1px solid var(--gantt-tooltip-border, var(--theme-border, #6c7086));
		border-top: 1px solid var(--gantt-tooltip-border, var(--theme-border, #6c7086));
	}

	/*
	 * Deliberately no entrance animation on `.gantt-lane`: animating opacity or
	 * transform would make it a stacking context, trapping `.gantt-bar-label`'s
	 * z-index inside the lane so labels could never paint above the arrow
	 * overlay — and now the popup depends on the same invariant. Toggling reads
	 * fine on the arrow blink alone.
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
