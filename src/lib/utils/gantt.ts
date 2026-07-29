import type { GanttSubtask, GanttTask } from '../types/charts';

const DAY_MS = 86_400_000;
const MAX_LABELED_TICKS = 14;

export type GanttTimeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface GanttTick {
	ms: number;
	label: string;
}

export interface GanttScale {
	min: number;
	max: number;
	unit: GanttTimeUnit;
	ticks: GanttTick[];
}

export function toUTCms(value: string | Date): number {
	const ms = value instanceof Date ? value.getTime() : Date.parse(value);
	if (Number.isNaN(ms)) {
		throw new Error(`GanttChart: invalid date "${String(value)}"`);
	}
	return ms;
}

export function formatGanttDate(ms: number, locale?: string): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms);
}

function startOfDay(ms: number): number {
	const d = new Date(ms);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function startOfWeek(ms: number): number {
	const day = startOfDay(ms);
	const weekday = (new Date(day).getUTCDay() + 6) % 7;
	return day - weekday * DAY_MS;
}

function snapToUnit(ms: number, unit: GanttTimeUnit): number {
	const d = new Date(ms);
	switch (unit) {
		case 'day':
			return startOfDay(ms);
		case 'week':
			return startOfWeek(ms);
		case 'month':
			return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
		case 'quarter':
			return Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1);
		case 'year':
			return Date.UTC(d.getUTCFullYear(), 0, 1);
	}
}

function addUnit(base: number, unit: GanttTimeUnit, count: number): number {
	if (unit === 'day') return base + count * DAY_MS;
	if (unit === 'week') return base + count * 7 * DAY_MS;
	const monthsPer = unit === 'month' ? 1 : unit === 'quarter' ? 3 : 12;
	const d = new Date(base);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + count * monthsPer, 1);
}

function pickUnit(spanDays: number): GanttTimeUnit {
	if (spanDays <= 31) return 'day';
	if (spanDays <= 180) return 'week';
	if (spanDays <= 750) return 'month';
	if (spanDays <= 1900) return 'quarter';
	return 'year';
}

function makeLabeler(unit: GanttTimeUnit, locale?: string): (ms: number, index: number) => string {
	const dayFormat = new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});
	const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });

	return (ms, index) => {
		const d = new Date(ms);
		switch (unit) {
			case 'day':
			case 'week':
				return dayFormat.format(ms);
			case 'month':
				// composed instead of a month+year Intl format: some locales (e.g. cs)
				// expand the short month to its full name when a year is present
				return d.getUTCMonth() === 0 || index === 0
					? `${monthFormat.format(ms)} ${d.getUTCFullYear()}`
					: monthFormat.format(ms);
			case 'quarter':
				return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
			case 'year':
				return String(d.getUTCFullYear());
		}
	};
}

/** Mirrors `.gantt-milestone { width/height }` — the square before it is rotated. */
const MILESTONE_SIDE = 13;
/**
 * Half the milestone diamond, so arrows meet its vertices, not its centre.
 *
 * The diamond is a square turned 45°, so what it occupies horizontally is its
 * *diagonal* — side × √2 — not its side. Reading the CSS number straight off
 * understated the reach by a third, which quietly shrank the gap `clearMilestones`
 * leaves and pulled arrowheads inside the shape.
 */
export const GANTT_MILESTONE_HALF = (MILESTONE_SIDE * Math.SQRT2) / 2;

/** Half-width of the arrow head, in px; the connector line stops here. */
export const GANTT_ARROW_HEAD = 7;
/** Length of the straight stub leaving a bar before the connector turns. */
const ARROW_STUB = 10;

/**
 * Orthogonal finish-to-start connector from (x1, y1) — the predecessor's end —
 * to (x2, y2) — the successor's start. Coordinates are px inside the plot
 * canvas. The line stops short of x2 to leave room for the arrow head.
 */
export function ganttDependencyPath(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	rowHeight: number
): string {
	const tip = x2 - GANTT_ARROW_HEAD;
	const round = (n: number) => Math.round(n * 100) / 100;

	if (tip - x1 >= ARROW_STUB) {
		const elbow = Math.max(x1, tip - ARROW_STUB);
		return `M ${round(x1)} ${round(y1)} H ${round(elbow)} V ${round(y2)} H ${round(tip)}`;
	}

	// successor starts at or before the predecessor's end: route around the rows
	const lane = y1 + (y2 >= y1 ? rowHeight / 2 : -rowHeight / 2);
	return (
		`M ${round(x1)} ${round(y1)} H ${round(x1 + ARROW_STUB)} V ${round(lane)} ` +
		`H ${round(tip - ARROW_STUB)} V ${round(y2)} H ${round(tip)}`
	);
}

/** Filled triangle pointing right, with its tip at (x, y). */
export function ganttArrowHead(x: number, y: number): string {
	const round = (n: number) => Math.round(n * 100) / 100;
	const back = round(x - GANTT_ARROW_HEAD);
	return `M ${round(x)} ${round(y)} L ${back} ${round(y - 4.5)} L ${back} ${round(y + 4.5)} Z`;
}

// ---------------------------------------------------------------------------
// Bar labels
//
// When a group collapses, its tasks lose the left-hand gutter and carry their
// own labels instead. Placement is decided in px here; the component anchors the
// label to its bar in percentages so it tracks the bar exactly, and takes the
// `maxWidth` below verbatim so the two never disagree about how much room the
// text has.
// ---------------------------------------------------------------------------

/** Mirrors `.gantt-bar { min-width: 4px }` — a 1px bar still paints 4px wide. */
const MIN_BAR_PX = 4;
/** Daylight left between a bar and the diamond of the milestone that closes it. */
const MILESTONE_CLEARANCE = 3;
/** Breathing room between a label and the edge of the bar it sits inside. */
const LABEL_PAD_INSIDE = 8;
/** Gap between a bar and a label placed beside it. */
const LABEL_GAP_OUTSIDE = 6;
/** Below this a truncated label is all ellipsis, so we drop it entirely. */
const MIN_LABEL_WIDTH = 24;
/**
 * Deliberate overestimate. Every label is also clamped by an inline
 * `max-width`, so guessing high costs an ellipsis while guessing low would
 * let two labels overlap.
 */
const ESTIMATE_BIAS = 1.04;

const NARROW_CHARS = new Set(" iljtfIr.,:;'\"`|!()[]{}/\\");
const WIDE_CHARS = new Set('mwMW@%');

/**
 * Width of `text` in px, estimated from per-character advances for the
 * `Inter, system-ui, sans-serif` stack the chart hardcodes.
 *
 * Deliberately not `canvas.measureText`: that would make this impure and it
 * returns 0 under jsdom, where the component tests run.
 */
export function estimateTextWidth(
	text: string,
	fontSize: number,
	opts?: { bold?: boolean; scale?: number }
): number {
	if (!text) return 0;
	let em = 0;
	for (const ch of text) {
		if (NARROW_CHARS.has(ch)) em += 0.3;
		else if (WIDE_CHARS.has(ch)) em += 0.88;
		else if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) em += 0.62;
		else em += 0.52;
	}
	const weight = opts?.bold ? 1.04 : 1;
	const px = em * fontSize * weight * ESTIMATE_BIAS * (opts?.scale ?? 1);
	return Math.round(px * 100) / 100;
}

export type GanttLabelPlacement = 'inside' | 'right' | 'left' | 'none';

export interface GanttLabelInput {
	text: string;
	/** px from the plot canvas' left edge to the bar's left edge */
	barX: number;
	/** px; ignored for a milestone, which uses its diamond half-width instead */
	barWidth: number;
	plotWidth: number;
	fontSize: number;
	milestone?: boolean;
	/** false when the bar colour can't be measured, so text must not sit on it */
	insideAllowed?: boolean;
	/**
	 * px; leftmost edge a label placed *beside* the bar may reach — the end of
	 * whatever is drawn to its left on the same lane. Defaults to the plot's own
	 * left edge, which is right for a bar that has nothing beside it.
	 */
	boundLeft?: number;
	/** px; rightmost edge such a label may reach. Defaults to the plot's right edge. */
	boundRight?: number;
}

export interface GanttLabelLayout {
	placement: GanttLabelPlacement;
	/** px the text is allowed to occupy; the component emits this as a max-width */
	maxWidth: number;
	/** px the text will actually occupy — `maxWidth` once truncated */
	width: number;
	/** true when the estimate overflows `maxWidth`, so the ellipsis will show */
	truncated: boolean;
}

const NO_LABEL: GanttLabelLayout = {
	placement: 'none',
	maxWidth: 0,
	width: 0,
	truncated: false
};

function barSpan(input: {
	barX: number;
	barWidth: number;
	milestone?: boolean;
}): [start: number, end: number, width: number] {
	if (input.milestone === true) {
		return [input.barX - GANTT_MILESTONE_HALF, input.barX + GANTT_MILESTONE_HALF, 0];
	}
	const width = Math.max(input.barWidth, MIN_BAR_PX);
	return [input.barX, input.barX + width, width];
}

/**
 * Picks where a task's label goes relative to its bar: inside it when it fits,
 * otherwise beside it — falling to the left when the bar runs to the right edge
 * of the plot, which is what makes edge overflow structurally impossible.
 *
 * The boxes beside the bar stop at `boundLeft`/`boundRight`, so a label can be
 * told to fit the gap its neighbours leave rather than the whole canvas.
 *
 * `'none'` is not data loss: the bar keeps its detail popup.
 */
export function resolveGanttLabel(input: GanttLabelInput): GanttLabelLayout {
	const { text, plotWidth, fontSize } = input;
	if (!text || plotWidth <= 0) return NO_LABEL;

	const [spanStart, spanEnd, barWidth] = barSpan(input);
	const insideAllowed = input.insideAllowed !== false && input.milestone !== true;
	const boundLeft = input.boundLeft ?? 0;
	const boundRight = input.boundRight ?? plotWidth;

	const candidates: [GanttLabelPlacement, number][] = [
		['inside', insideAllowed ? barWidth - 2 * LABEL_PAD_INSIDE : 0],
		['right', boundRight - spanEnd - 2 * LABEL_GAP_OUTSIDE],
		['left', spanStart - boundLeft - 2 * LABEL_GAP_OUTSIDE]
	];

	const textWidth = estimateTextWidth(text, fontSize);
	for (const [placement, box] of candidates) {
		if (box >= textWidth) {
			return { placement, maxWidth: box, width: textWidth, truncated: false };
		}
	}

	// nothing fits; take the roomiest box, preferring inside > right > left on ties
	let best = candidates[0];
	for (const candidate of candidates) {
		if (candidate[1] > best[1]) best = candidate;
	}
	if (best[1] < MIN_LABEL_WIDTH) return NO_LABEL;
	return { placement: best[0], maxWidth: best[1], width: best[1], truncated: true };
}

export interface GanttExtent {
	startPx: number;
	endPx: number;
}

/**
 * Horizontal space a bar occupies *including* its label — the footprint the
 * lane packer has to keep clear.
 */
export function ganttBarExtent(
	input: { barX: number; barWidth: number; plotWidth: number; milestone?: boolean },
	label: GanttLabelLayout
): GanttExtent {
	if (input.plotWidth <= 0) return { startPx: 0, endPx: 0 };

	const [spanStart, spanEnd] = barSpan(input);
	let start = spanStart;
	let end = spanEnd;
	if (label.placement === 'right') end += LABEL_GAP_OUTSIDE + label.width;
	else if (label.placement === 'left') start -= LABEL_GAP_OUTSIDE + label.width;

	return {
		startPx: clamp(start, 0, input.plotWidth),
		endPx: clamp(end, 0, input.plotWidth)
	};
}

export interface GanttSubtaskSegment {
	description: string;
	/** 0–1 fraction of the bar's own width */
	startFraction: number;
	endFraction: number;
}

/**
 * Splits a task's bar into segments proportional to each subtask's `duration`.
 * `duration` is a unitless weight, not a time span — only its share of the sum
 * matters. An empty or non-positive total falls back to no segments, so the
 * caller draws the bar plain instead of dividing by zero.
 */
export function ganttSubtaskSegments(
	subtasks: readonly GanttSubtask[]
): GanttSubtaskSegment[] {
	const total = subtasks.reduce((sum, s) => sum + Math.max(s.duration, 0), 0);
	if (total <= 0) return [];
	let cursor = 0;
	return subtasks.map((s) => {
		const width = Math.max(s.duration, 0) / total;
		const seg = { description: s.description, startFraction: cursor, endFraction: cursor + width };
		cursor += width;
		return seg;
	});
}

export interface GanttPackable {
	startPx: number;
	endPx: number;
}

/**
 * Assigns each item the lowest lane that has room for it — greedy interval-graph
 * colouring. Sorting by start first is what makes it optimal: the lane count it
 * returns is exactly the largest number of items overlapping at any one point.
 *
 * Ties break on input index so the result never depends on sort stability.
 */
export function packGanttLanes(
	items: readonly GanttPackable[],
	gapPx = 0
): { lanes: number[]; laneCount: number } {
	const order = items.map((_, i) => i).sort((a, b) => items[a].startPx - items[b].startPx || a - b);
	const laneEnds: number[] = [];
	const lanes = new Array<number>(items.length).fill(0);

	for (const i of order) {
		const { startPx, endPx } = items[i];
		let lane = laneEnds.findIndex((end) => end + gapPx <= startPx);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(endPx);
		} else {
			laneEnds[lane] = Math.max(laneEnds[lane], endPx);
		}
		lanes[i] = lane;
	}

	return { lanes, laneCount: laneEnds.length };
}

// ---------------------------------------------------------------------------
// Label contrast
//
// The ink can't come from a theme token: Catppuccin's chart colours are pastel
// under a light `--theme-text`, and the Generali palette is the exact inverse
// (near-black bars on white). Only the bar's own luminance can decide.
// ---------------------------------------------------------------------------

const DEFAULT_LIGHT_INK = 'var(--gantt-bar-label-light, #ffffff)';
const DEFAULT_DARK_INK = 'var(--gantt-bar-label-dark, #11111b)';
const DEFAULT_OUTSIDE_INK = 'var(--gantt-bar-label-outside-color, var(--theme-text, #333))';
/** Luminance of `#11111b`, used when the dark ink is an unresolvable `var()`. */
const DARK_INK_LUMINANCE = 0.006;

/**
 * Hex (3/4/6/8 digit) and `rgb()`/`rgba()` in comma or space syntax, with 0–255
 * or percentage channels. Returns null for anything else — named colours,
 * `hsl()`, `color-mix()`, `var()` — which is the signal to keep text off the bar
 * rather than guess at its contrast.
 */
export function parseColorRGB(color: string): [number, number, number] | null {
	if (typeof color !== 'string') return null;
	const value = color.trim();

	const hex = /^#([0-9a-f]+)$/i.exec(value);
	if (hex) {
		const digits = hex[1];
		if (digits.length === 3 || digits.length === 4) {
			const at = (i: number) => Number.parseInt(digits[i] + digits[i], 16);
			return [at(0), at(1), at(2)];
		}
		if (digits.length === 6 || digits.length === 8) {
			const at = (i: number) => Number.parseInt(digits.slice(i, i + 2), 16);
			return [at(0), at(2), at(4)];
		}
		return null;
	}

	const fn = /^rgba?\(([^)]*)\)$/i.exec(value);
	if (!fn) return null;
	const parts = fn[1].split(/[,/\s]+/).filter(Boolean);
	if (parts.length < 3) return null;

	const channel = (part: string): number => {
		const n = Number.parseFloat(part);
		if (Number.isNaN(n)) return NaN;
		return clamp(Math.round(part.endsWith('%') ? (n / 100) * 255 : n), 0, 255);
	};
	const [r, g, b] = [channel(parts[0]), channel(parts[1]), channel(parts[2])];
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
	return [r, g, b];
}

/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
	const linear = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export type GanttInkTone = 'light' | 'dark' | 'outside';

export interface GanttInk {
	color: string;
	tone: GanttInkTone;
}

export interface GanttInkOptions {
	light?: string;
	dark?: string;
	/** used when `bg` can't be parsed */
	fallback?: string;
}

function pickInk(bg: string, opts?: GanttInkOptions): GanttInk {
	const light = opts?.light ?? DEFAULT_LIGHT_INK;
	const dark = opts?.dark ?? DEFAULT_DARK_INK;
	const rgb = parseColorRGB(bg);
	if (!rgb) return { color: opts?.fallback ?? DEFAULT_OUTSIDE_INK, tone: 'outside' };

	const inkLuminance = (ink: string, fallback: number) => {
		const parsed = parseColorRGB(ink);
		return parsed ? relativeLuminance(parsed) : fallback;
	};
	const contrast = (a: number, b: number) =>
		(Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

	const bgLuminance = relativeLuminance(rgb);
	const onLight = contrast(bgLuminance, inkLuminance(light, 1));
	const onDark = contrast(bgLuminance, inkLuminance(dark, DARK_INK_LUMINANCE));
	return onLight >= onDark ? { color: light, tone: 'light' } : { color: dark, tone: 'dark' };
}

/** Whichever of the light/dark inks contrasts better against `bg`. */
export function readableTextColor(bg: string, opts?: GanttInkOptions): string {
	return pickInk(bg, opts).color;
}

/**
 * Ink for one bar label. A label beside a bar sits on the slide, not on the
 * bar, so it takes the theme's text colour — and so does a label inside a
 * *progress* bar that overhangs the solid fill, because the track behind it is
 * only a 30% tint of the bar colour over the slide background.
 */
export function ganttLabelInk(input: {
	color: string;
	progress?: number;
	placement: GanttLabelPlacement;
	/** px; right edge of the label box */
	labelRight: number;
	barX: number;
	barWidth: number;
	ink?: GanttInkOptions;
}): GanttInk {
	const outside: GanttInk = {
		color: input.ink?.fallback ?? DEFAULT_OUTSIDE_INK,
		tone: 'outside'
	};
	if (input.placement !== 'inside') return outside;
	if (input.progress == null) return pickInk(input.color, input.ink);

	const fillEnd = input.barX + (input.barWidth * clamp(input.progress, 0, 100)) / 100;
	return input.labelRight <= fillEnd ? pickInk(input.color, input.ink) : outside;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Rows
//
// The flat chart lets the task index double as the visual row position. Groups
// break that: rows have variable heights, and a collapsed group draws several
// tasks on lanes inside one row. Everything vertical therefore goes through
// `layoutGanttRows`, which hands back explicit `y`/`height` per row.
// ---------------------------------------------------------------------------

export interface GanttItem {
	task: GanttTask;
	/** index into the caller's `tasks` array — the identity dependencies resolve to */
	taskIndex: number;
	startMs: number;
	endMs: number;
	milestone: boolean;
}

export type GanttTreeNode =
	| { kind: 'leaf'; key: string; item: GanttItem; leaves: number[] }
	| {
			kind: 'group';
			key: string;
			section: string;
			children: GanttTreeNode[];
			leaves: number[];
	  };

function leafNode(item: GanttItem): GanttTreeNode {
	return { kind: 'leaf', key: `t:${item.taskIndex}`, item, leaves: [item.taskIndex] };
}

/** Every `GanttItem` under `node`, in document order. */
export function ganttLeafItems(node: GanttTreeNode): GanttItem[] {
	if (node.kind === 'leaf') return [node.item];
	return node.children.flatMap(ganttLeafItems);
}

/**
 * Groups tasks by `section`. Disabled, this is an identity transform — one leaf
 * per task, which is what keeps the ungrouped chart byte-for-byte unchanged.
 *
 * A section that appears in several places in `tasks` becomes ONE group at its
 * first appearance. Splitting it into separate runs would produce two rows
 * sharing a label, a colour, and a collapse key, so toggling one would toggle
 * the other. Tasks with no section stay top-level rows rather than being herded
 * into an "other" group.
 */
export function buildGanttTree(items: readonly GanttItem[], enabled: boolean): GanttTreeNode[] {
	if (!enabled) return items.map(leafNode);

	const rootNodes: GanttTreeNode[] = [];
	const groups = new Map<string, Extract<GanttTreeNode, { kind: 'group' }>>();

	for (const item of items) {
		const section = item.task.section ?? '';
		if (!section) {
			rootNodes.push(leafNode(item));
			continue;
		}
		let group = groups.get(section);
		if (!group) {
			group = { kind: 'group', key: `g:${section}`, section, children: [], leaves: [] };
			groups.set(section, group);
			rootNodes.push(group);
		}
		group.children.push(leafNode(item));
		group.leaves.push(item.taskIndex);
	}

	return rootNodes;
}

/**
 * Span and progress of a group, for the bar that stands in for it.
 *
 * Progress is duration-weighted, with each task counting for at least a day so
 * that zero-length milestones can't divide the weight to nothing. Children
 * without `progress` count as 0% once any sibling has it — "x% of this group's
 * work is done" is the honest reading.
 */
export function rollUpGanttGroup(items: readonly GanttItem[]): {
	startMs: number;
	endMs: number;
	milestone: boolean;
	progress?: number;
} | null {
	if (!items.length) return null;

	let startMs = Infinity;
	let endMs = -Infinity;
	let weighted = 0;
	let weight = 0;
	let hasProgress = false;
	let allMilestones = true;

	for (const item of items) {
		startMs = Math.min(startMs, item.startMs);
		endMs = Math.max(endMs, item.endMs);
		if (!item.milestone) allMilestones = false;
		if (item.task.progress != null) hasProgress = true;
		const span = Math.max(item.endMs - item.startMs, DAY_MS);
		weighted += span * clamp(item.task.progress ?? 0, 0, 100);
		weight += span;
	}

	return {
		startMs,
		endMs,
		milestone: allMilestones && startMs === endMs,
		progress: hasProgress ? Math.round(weighted / weight) : undefined
	};
}

export interface GanttBarSpec {
	key: string;
	label: string;
	startMs: number;
	endMs: number;
	milestone: boolean;
	progress?: number;
	color?: string;
	section?: string;
	/** -1 for a group's rolled-up bar, which is no single task */
	taskIndex: number;
	/** every leaf task index this bar visually stands for */
	covers: number[];
	/** true for a group roll-up, which renders thinner than a real task */
	summary: boolean;
}

export interface GanttLane {
	/** 0-based sub-row within the group row */
	lane: number;
	bar: GanttBarSpec;
	label: GanttLabelLayout;
	/** px, so the caller can pick the label ink without redoing the geometry */
	barX: number;
	barWidth: number;
	/**
	 * true when a lane-mate ends where this bar starts. They share a lane and a
	 * section colour, so without a seam down this edge the two read as one bar.
	 */
	abuts: boolean;
}

export type GanttRowKind = 'task' | 'group-header' | 'group-collapsed';

export interface GanttRow {
	key: string;
	kind: GanttRowKind;
	depth: number;
	/** what the left-hand gutter shows */
	label: string;
	/** px from the top of the plot canvas */
	y: number;
	height: number;
	laneCount: number;
	lanes: GanttLane[];
	collapsed: boolean;
	/** the collapse key; set on group rows only */
	section?: string;
}

export interface GanttLayout {
	rows: GanttRow[];
	totalHeight: number;
}

export interface GanttLayoutOptions {
	collapsed: ReadonlySet<string>;
	rowHeight: number;
	/** height of one packed sub-lane inside a collapsed group row */
	laneHeight: number;
	plotWidth: number;
	msToPx: (ms: number) => number;
	/** font size the on-bar labels will paint at */
	labelFontSize: number;
	/** resolved fill of a bar — decides whether its label may sit on top of it */
	barColor: (bar: GanttBarSpec) => string;
	/**
	 * Whether an *expanded* group's header row carries a rolled-up bar spanning
	 * its children. Off by default: the children are right below it, so the
	 * roll-up restates what the reader can already see. A collapsed group is
	 * unaffected — there the packed child bars are the row.
	 */
	summaryBar?: boolean;
}

function barFromItem(item: GanttItem): GanttBarSpec {
	return {
		key: `t:${item.taskIndex}`,
		label: item.task.label,
		startMs: item.startMs,
		endMs: item.endMs,
		milestone: item.milestone,
		progress: item.task.progress,
		color: item.task.color,
		section: item.task.section,
		taskIndex: item.taskIndex,
		covers: [item.taskIndex],
		summary: false
	};
}

function barFromGroup(node: Extract<GanttTreeNode, { kind: 'group' }>): GanttBarSpec | null {
	const rolled = rollUpGanttGroup(ganttLeafItems(node));
	if (!rolled) return null;
	return {
		key: `${node.key}:roll`,
		label: node.section,
		startMs: rolled.startMs,
		endMs: rolled.endMs,
		milestone: rolled.milestone,
		progress: rolled.progress,
		section: node.section,
		taskIndex: -1,
		covers: node.leaves,
		summary: true
	};
}

function barGeometry(bar: GanttBarSpec, o: GanttLayoutOptions) {
	const barX = o.msToPx(bar.startMs);
	const barWidth = bar.milestone ? 0 : Math.max(o.msToPx(bar.endMs) - barX, 0);
	return { barX, barWidth };
}

/** A bar on its own row: the gutter carries the label, so nothing sits on the bar. */
function gutterLane(bar: GanttBarSpec, o: GanttLayoutOptions): GanttLane {
	return { lane: 0, bar, label: NO_LABEL, abuts: false, ...barGeometry(bar, o) };
}

/** Indices grouped by the lane they were packed onto, ordered along it. */
function lanesInOrder(footprints: readonly GanttExtent[], lanes: readonly number[]): number[][] {
	const byLane = new Map<number, number[]>();
	lanes.forEach((lane, i) => {
		const members = byLane.get(lane);
		if (members) members.push(i);
		else byLane.set(lane, [i]);
	});
	return [...byLane.values()].map((members) =>
		members.sort((a, b) => footprints[a].startPx - footprints[b].startPx || a - b)
	);
}

function labelFor(
	bar: GanttBarSpec,
	geometry: { barX: number; barWidth: number },
	o: GanttLayoutOptions,
	bounds?: { boundLeft: number; boundRight: number }
): GanttLabelLayout {
	return resolveGanttLabel({
		text: bar.label,
		plotWidth: o.plotWidth,
		fontSize: o.labelFontSize,
		milestone: bar.milestone,
		insideAllowed: parseColorRGB(o.barColor(bar)) !== null,
		...bounds,
		...geometry
	});
}

function extentOf(
	bar: GanttBarSpec,
	geometry: { barX: number; barWidth: number },
	label: GanttLabelLayout,
	plotWidth: number
): GanttExtent {
	return ganttBarExtent({ ...geometry, plotWidth, milestone: bar.milestone }, label);
}

/**
 * The span the lane packer has to keep clear — the drawn footprint, except that a
 * milestone packs from its own date rather than from its left vertex.
 *
 * The diamond is centred on the day, so half of it always hangs back over
 * whatever ended there; a gate landing on the last day of the phase it closes is
 * the normal case, not a collision. Refusing to share costs a whole lane, and the
 * row is as tall as its lane count — so they share, and `clearMilestones` pulls
 * the bar's end back to keep the diamond legible.
 *
 * Labels are still bounded by the true footprint, so no text is written under the
 * diamond.
 */
function packingFootprint(
	bar: GanttBarSpec,
	geometry: { barX: number; barWidth: number },
	o: GanttLayoutOptions
): GanttExtent {
	const drawn = extentOf(bar, geometry, NO_LABEL, o.plotWidth);
	if (!bar.milestone) return drawn;
	return { startPx: clamp(geometry.barX, 0, o.plotWidth), endPx: drawn.endPx };
}

/**
 * Ends a bar short of the milestone that closes it, so the diamond keeps a rim of
 * daylight instead of growing out of the bar's tail.
 *
 * Sharing a lane is what makes this necessary: drawn honestly the gate's leading
 * half lies over the bar and the two read as a single mark with a notch. The bar
 * gives up those pixels — a phase drawn a few days short is a small lie about a
 * date the gate beside it already states, whereas two marks fused into one is a
 * lie about how many things happened.
 *
 * Only gates at or after a bar's end trim it. One landing mid-bar is a genuine
 * overlap that buys its own lane, and nothing there needs clearing.
 *
 * Applied across the whole row rather than per lane: trimming feeds the packing
 * that would decide the lanes, so consulting the lanes here would be circular.
 * The window is a few px wide, so a gate can only ever trim a bar it nearly meets.
 */
function clearMilestones(
	bars: readonly GanttBarSpec[],
	geometry: readonly { barX: number; barWidth: number }[]
): { barX: number; barWidth: number }[] {
	const gates = bars.flatMap((bar, i) => (bar.milestone ? [geometry[i].barX] : []));
	if (!gates.length) return [...geometry];

	return geometry.map((geo, i) => {
		if (bars[i].milestone) return geo;
		const end = geo.barX + geo.barWidth;
		const limit = Math.min(
			...gates
				.filter((gate) => gate >= end)
				.map((gate) => gate - GANTT_MILESTONE_HALF - MILESTONE_CLEARANCE)
		);
		if (!(limit < end)) return geo;
		return { barX: geo.barX, barWidth: Math.max(limit - geo.barX, MIN_BAR_PX) };
	});
}

/**
 * Places every bar's label, one lane at a time and left to right along it.
 *
 * Bars on other lanes are drawn above or below, never beside, so only the two
 * neighbours on a bar's own lane can bound its label: the ink already committed
 * to its left, and the next bar's leading edge to its right. Sweeping in start
 * order is what keeps those two bounds honest — the earlier bar claims the gap
 * first, and the later one sees the claim rather than re-offering the same room.
 * The first and last bar on a lane keep the full run to the plot edge.
 */
function placeLaneLabels(
	bars: readonly GanttBarSpec[],
	geometry: readonly { barX: number; barWidth: number }[],
	footprints: readonly GanttExtent[],
	lanes: readonly number[],
	o: GanttLayoutOptions
): GanttLabelLayout[] {
	const labels = new Array<GanttLabelLayout>(bars.length).fill(NO_LABEL);

	for (const members of lanesInOrder(footprints, lanes)) {
		let committed = 0;
		members.forEach((i, position) => {
			const next = members[position + 1];
			labels[i] = labelFor(bars[i], geometry[i], o, {
				boundLeft: committed,
				boundRight: next === undefined ? o.plotWidth : footprints[next].startPx
			});
			committed = extentOf(bars[i], geometry[i], labels[i], o.plotWidth).endPx;
		});
	}

	return labels;
}

/**
 * How close two bars have to be before the gap between them stops reading as a
 * gap. Rounding alone puts touching bars a fraction of a pixel apart, and 1px of
 * daylight is not something an audience can see from the back of a room.
 */
const ABUT_PX = 1.5;

/**
 * Which bars start where a lane-mate ended. Collapsing is what creates the
 * problem: two consecutive tasks that used to be rows apart now sit edge to edge
 * in the same section colour, and a continuous band is not what the dates say.
 * The renderer draws a hairline down these bars' leading edge.
 *
 * A milestone is a diamond with its own outline, so it needs no help.
 */
function abuttingBars(
	bars: readonly GanttBarSpec[],
	footprints: readonly GanttExtent[],
	lanes: readonly number[]
): boolean[] {
	const abuts = bars.map(() => false);
	for (const members of lanesInOrder(footprints, lanes)) {
		members.forEach((i, position) => {
			const before = members[position - 1];
			if (before === undefined || bars[i].milestone) return;
			abuts[i] = footprints[i].startPx - footprints[before].endPx <= ABUT_PX;
		});
	}
	return abuts;
}

/**
 * Bars a lane-mate squeezed out of a label altogether, paired with the footprint
 * they would need to keep one.
 *
 * A label must not cost a lane merely to stay whole — it can truncate. Being
 * dropped is different: an unlabelled bar in a collapsed group is a bar with
 * nothing on the slide to say what it is, and the popup that remains only shows
 * up on hover — no use to a room watching a projector. So these get the lane
 * after all.
 */
function labellessBars(
	bars: readonly GanttBarSpec[],
	geometry: readonly { barX: number; barWidth: number }[],
	labels: readonly GanttLabelLayout[],
	o: GanttLayoutOptions
): { index: number; extent: GanttExtent }[] {
	const out: { index: number; extent: GanttExtent }[] = [];
	bars.forEach((bar, i) => {
		if (labels[i].placement !== 'none' || !bar.label) return;
		// unbounded: what it could do with a lane to itself
		const alone = labelFor(bar, geometry[i], o);
		if (alone.placement === 'none') return;
		out.push({ index: i, extent: extentOf(bar, geometry[i], alone, o.plotWidth) });
	});
	return out;
}

/**
 * Flattens the tree into rows with explicit `y` and `height`. A collapsed group
 * keeps every child visible by packing them onto lanes and moving their labels
 * onto the bars, so it is always shorter than the same group expanded.
 */
export function layoutGanttRows(
	tree: readonly GanttTreeNode[],
	o: GanttLayoutOptions
): GanttLayout {
	const rows: GanttRow[] = [];
	let y = 0;

	const walk = (nodes: readonly GanttTreeNode[], depth: number) => {
		for (const node of nodes) {
			if (node.kind === 'leaf') {
				rows.push({
					key: node.key,
					kind: 'task',
					depth,
					label: node.item.task.label,
					y,
					height: o.rowHeight,
					laneCount: 1,
					lanes: [gutterLane(barFromItem(node.item), o)],
					collapsed: false
				});
				y += o.rowHeight;
				continue;
			}

			if (!o.collapsed.has(node.section)) {
				const rolled = o.summaryBar === true ? barFromGroup(node) : null;
				rows.push({
					key: node.key,
					kind: 'group-header',
					depth,
					label: node.section,
					y,
					height: o.rowHeight,
					laneCount: 1,
					lanes: rolled ? [gutterLane(rolled, o)] : [],
					collapsed: false,
					section: node.section
				});
				y += o.rowHeight;
				walk(node.children, depth + 1);
				continue;
			}

			const bars = node.children
				.map((child) => (child.kind === 'leaf' ? barFromItem(child.item) : barFromGroup(child)))
				.filter((bar): bar is GanttBarSpec => bar !== null);

			// Lanes are packed on the bars alone, before any label is placed. A label
			// must not be able to cost a lane: it only needs one when it collides
			// with a neighbour, and which bars are neighbours is exactly what the
			// packing decides. Resolving labels first made that circular, so two
			// tasks running back to back — touching, never overlapping — were split
			// apart by the footprint of a label that would have truncated happily.
			const geometry = clearMilestones(
				bars,
				bars.map((bar) => barGeometry(bar, o))
			);
			const footprints = bars.map((bar, i) => extentOf(bar, geometry[i], NO_LABEL, o.plotWidth));

			const { lanes, laneCount: packedLanes } = packGanttLanes(
				bars.map((bar, i) => packingFootprint(bar, geometry[i], o))
			);
			let laneCount = packedLanes;

			// labels second, each fitted to the room its own lane leaves it
			let labels = placeLaneLabels(bars, geometry, footprints, lanes, o);

			// then the one case worth a lane: a label a neighbour left no room for
			// at all. Moving those out only widens the bounds of everyone left
			// behind, so a single re-place settles it.
			const labelless = labellessBars(bars, geometry, labels, o);
			if (labelless.length) {
				const spill = packGanttLanes(labelless.map((entry) => entry.extent));
				labelless.forEach((entry, i) => {
					lanes[entry.index] = laneCount + spill.lanes[i];
				});
				laneCount += spill.laneCount;
				labels = placeLaneLabels(bars, geometry, footprints, lanes, o);
			}

			const abuts = abuttingBars(bars, footprints, lanes);
			const height = Math.max(laneCount, 1) * o.laneHeight;

			rows.push({
				key: node.key,
				kind: 'group-collapsed',
				depth,
				label: node.section,
				y,
				height,
				laneCount,
				lanes: bars.map((bar, i) => ({
					lane: lanes[i],
					bar,
					label: labels[i],
					abuts: abuts[i],
					...geometry[i]
				})),
				collapsed: true,
				section: node.section
			});
			y += height;
		}
	};

	walk(tree, 0);
	return { rows, totalHeight: y };
}

export function computeGanttScale(startMs: number, endMs: number, locale?: string): GanttScale {
	const end = endMs > startMs ? endMs : startMs + DAY_MS;
	const unit = pickUnit((end - startMs) / DAY_MS);

	const boundaries: number[] = [];
	const min = snapToUnit(startMs, unit);
	for (let i = 0, t = min; ; i += 1, t = addUnit(min, unit, i)) {
		boundaries.push(t);
		if (t >= end) break;
	}
	const max = boundaries[boundaries.length - 1];

	const step = Math.max(1, Math.ceil(boundaries.length / MAX_LABELED_TICKS));
	const label = makeLabeler(unit, locale);
	const ticks = boundaries
		.filter((_, i) => i % step === 0)
		.map((ms, i) => ({ ms, label: label(ms, i) }));

	return { min, max, unit, ticks };
}

export type GanttMarkerAnchor = 'start' | 'middle' | 'end';

/**
 * How a marker's caption hangs off its line. Centred everywhere except near the
 * ends of the axis, where centring would push half the caption off the plot.
 */
export function ganttMarkerLabelAnchor(pct: number): GanttMarkerAnchor {
	if (pct < 6) return 'start';
	if (pct > 94) return 'end';
	return 'middle';
}

// ---------------------------------------------------------------------------
// Dependency arrows
// ---------------------------------------------------------------------------

export interface GanttAnchor {
	rowIndex: number;
	lane: number;
	/** the interval actually drawn — a group's roll-up when the task itself isn't */
	startMs: number;
	endMs: number;
	milestone: boolean;
}

/**
 * Where each task's arrows should attach. Rows are visited in document order and
 * later writes win, so a group header's broad claim over its descendants is
 * overwritten by each child's own row — while a *collapsed* group stops the walk
 * and keeps the claim. That is "nearest visible ancestor", without searching for
 * one.
 */
export function buildGanttAnchorMap(rows: readonly GanttRow[]): Map<number, GanttAnchor> {
	const anchors = new Map<number, GanttAnchor>();
	rows.forEach((row, rowIndex) => {
		for (const { lane, bar } of row.lanes) {
			for (const taskIndex of bar.covers) {
				anchors.set(taskIndex, {
					rowIndex,
					lane,
					startMs: bar.startMs,
					endMs: bar.endMs,
					milestone: bar.milestone
				});
			}
		}
	});
	return anchors;
}

export interface GanttEdge {
	fromTask: number;
	toTask: number;
	/** the `dependsOn` string that produced this edge; only used to key the path */
	depKey: string;
}

export interface GanttArrowSpec {
	key: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/**
 * Re-anchors every dependency onto the rows that are actually drawn. Edges
 * inside one collapsed bar disappear, and several edges that collapse onto the
 * same pair of endpoints become one arrow instead of a bundle of identical ones.
 *
 * Two children packed onto *different* lanes of one collapsed row stay distinct,
 * so the arrow between them survives.
 */
export function resolveGanttArrows(
	edges: readonly GanttEdge[],
	anchors: ReadonlyMap<number, GanttAnchor>,
	geom: { x: (ms: number) => number; rowY: (rowIndex: number, lane: number) => number }
): GanttArrowSpec[] {
	const seen = new Set<string>();
	const arrows: GanttArrowSpec[] = [];

	for (const edge of edges) {
		const from = anchors.get(edge.fromTask);
		const to = anchors.get(edge.toTask);
		if (!from || !to) continue;
		if (from.rowIndex === to.rowIndex && from.lane === to.lane) continue;

		const pair = `${from.rowIndex}:${from.lane}->${to.rowIndex}:${to.lane}`;
		if (seen.has(pair)) continue;
		seen.add(pair);

		arrows.push({
			key: `${edge.fromTask}->${edge.toTask}:${edge.depKey}`,
			x1: geom.x(from.endMs) + (from.milestone ? GANTT_MILESTONE_HALF : 0),
			y1: geom.rowY(from.rowIndex, from.lane),
			x2: geom.x(to.startMs) - (to.milestone ? GANTT_MILESTONE_HALF : 0),
			y2: geom.rowY(to.rowIndex, to.lane)
		});
	}

	return arrows;
}

// ---------------------------------------------------------------------------
// Detail popup
//
// The popup replaces the browser's native `title` tooltip, which renders in the
// OS font at the OS size after a second of hovering — no use to a room watching
// a projector, and no room for more than one line.
//
// Everything here is pure and px-based, in plot-canvas coordinates, because the
// chart lives inside a reveal slide that autofit CSS-scales: a measured
// `getBoundingClientRect` would come back in scaled units, whereas the layout's
// own geometry is already in the space the popup is painted in.
// ---------------------------------------------------------------------------

/** Daylight between a bar's lane band and the popup pointing at it. */
export const GANTT_TOOLTIP_GAP = 8;
/** How close the caret may come to the popup's rounded corner. */
const TOOLTIP_ARROW_INSET = 14;

export interface GanttTooltipAnchor {
	/** px from the plot canvas' left edge — a bar's midpoint, a milestone's centre */
	x: number;
	/** px from the canvas' top edge to the top of the bar's lane band */
	top: number;
	/** px to the bottom of that band */
	bottom: number;
}

export interface GanttTooltipBounds {
	/** plot width in px; the popup is clamped inside [0, width] */
	width: number;
	/** the canvas' own height — `GanttLayout.totalHeight` */
	height: number;
	/** px above the canvas the popup may reach into: the axis strip. Default 0. */
	headroom?: number;
}

export interface GanttTooltipPlacement {
	placement: 'above' | 'below';
	/** px from the canvas' left edge */
	left: number;
	/** px from the canvas' top edge; null when placed above */
	top: number | null;
	/** px from the canvas' bottom edge; null when placed below */
	bottom: number | null;
	/** px from the popup's left edge to the caret's centre */
	arrowOffset: number;
}

/**
 * Where the detail popup goes, in plot-canvas px.
 *
 * Deliberately `left` plus one of `top`/`bottom` rather than a
 * `translateY(-100%)`: anchoring the far edge to the canvas' own far edge is
 * exact *without knowing how tall the popup renders*. Height is then needed only
 * to choose a side, where being wrong is cosmetic — which is what lets the
 * caller pass an estimate and keeps this testable under jsdom.
 *
 * Above is preferred on a tie because overflowing upward only overlaps the axis,
 * while overflowing below `bounds.height` becomes scrollable overflow that
 * `autoFitSlides` measures and would shrink the whole slide for.
 */
export function placeGanttTooltip(
	anchor: GanttTooltipAnchor,
	/** `height` is an *estimate*: it picks the side only, never the offsets */
	size: { width: number; height: number },
	bounds: GanttTooltipBounds
): GanttTooltipPlacement {
	const round = (n: number) => Math.round(n * 100) / 100;

	const left = clamp(anchor.x - size.width / 2, 0, Math.max(bounds.width - size.width, 0));
	const roomAbove = anchor.top + (bounds.headroom ?? 0) - GANTT_TOOLTIP_GAP;
	const roomBelow = bounds.height - anchor.bottom - GANTT_TOOLTIP_GAP;
	const above = roomAbove >= size.height || roomAbove >= roomBelow;

	const inset = Math.min(TOOLTIP_ARROW_INSET, size.width / 2);

	return {
		placement: above ? 'above' : 'below',
		left: round(left),
		top: above ? null : round(anchor.bottom + GANTT_TOOLTIP_GAP),
		bottom: above ? round(bounds.height - anchor.top + GANTT_TOOLTIP_GAP) : null,
		arrowOffset: round(clamp(anchor.x - left, inset, size.width - inset))
	};
}

export interface GanttTooltipModel {
	label: string;
	startMs: number;
	endMs: number;
	milestone: boolean;
	/** whole days the task spans, both ends inclusive; undefined for a milestone */
	days?: number;
	progress?: number;
	/** labels of the tasks this bar follows */
	predecessors: string[];
	/** labels of the tasks that follow it */
	successors: string[];
	comment?: string;
	/** true for a group roll-up: a section name, with no single task behind it */
	summary: boolean;
}

/**
 * Whole days a task spans, counting both end dates.
 *
 * Inclusive because `end: '2026-01-23'` means "through the 23rd" to whoever
 * authored it, and exclusive counting would print "0 days" for a same-day task.
 * The consequence is that the number is one greater than the bar's width in day
 * columns, since the bar itself runs midnight to midnight.
 *
 * The `Math.max(end - start, DAY_MS)` in `rollUpGanttGroup` is not a precedent
 * against this: that is a weighting floor for averaging progress, not a count
 * anyone reads.
 */
export function ganttDurationDays(startMs: number, endMs: number): number {
	return Math.max(1, Math.round((endMs - startMs) / DAY_MS) + 1);
}

/**
 * `19 days` / `19 dní`. Via ICU rather than a hand-rolled plural table, which
 * would get Czech's three-way 1 / 2–4 / 5+ split wrong.
 */
export function formatGanttDuration(days: number, locale?: string): string {
	try {
		return new Intl.NumberFormat(locale, {
			style: 'unit',
			unit: 'day',
			unitDisplay: 'long'
		}).format(days);
	} catch {
		// engines without `style: 'unit'`
		return `${days} d`;
	}
}

export interface GanttTooltipLabels {
	dependsOn: string;
	followedBy: string;
}

/** The popup's two static captions, matching `unnamedSectionLabel`'s cs/en split. */
export function ganttTooltipLabels(locale?: string): GanttTooltipLabels {
	const lang = (locale ?? 'en').split('-')[0].toLowerCase();
	return lang === 'cs'
		? { dependsOn: 'Navazuje na', followedBy: 'Předchází' }
		: { dependsOn: 'Depends on', followedBy: 'Followed by' };
}

/** Task labels on the far end of `edges`, in edge order, without repeats. */
function depLabels(
	edges: readonly GanttEdge[],
	tasks: readonly GanttTask[],
	covers: ReadonlySet<number>,
	near: 'toTask' | 'fromTask'
): string[] {
	const far = near === 'toTask' ? 'fromTask' : 'toTask';
	const seen = new Set<number>();
	const out: string[] = [];
	for (const edge of edges) {
		// edges wholly inside this bar describe nothing the reader can see
		if (!covers.has(edge[near]) || covers.has(edge[far])) continue;
		if (seen.has(edge[far])) continue;
		seen.add(edge[far]);
		const label = tasks[edge[far]]?.label;
		if (label) out.push(label);
	}
	return out;
}

/**
 * Everything the popup shows for one bar.
 *
 * Dependencies come from `bar.covers` rather than `bar.taskIndex`, which is the
 * rule `resolveGanttArrows` already applies: for a leaf bar `covers` is just its
 * own index, and for a group roll-up it drops the edges internal to the group
 * and keeps the ones crossing its boundary. A roll-up has no comment — there is
 * no single task under it to have written one.
 */
export function buildGanttTooltipModel(
	bar: GanttBarSpec,
	tasks: readonly GanttTask[],
	edges: readonly GanttEdge[]
): GanttTooltipModel {
	const covers = new Set(bar.covers);
	return {
		label: bar.label,
		startMs: bar.startMs,
		endMs: bar.endMs,
		milestone: bar.milestone,
		days: bar.milestone ? undefined : ganttDurationDays(bar.startMs, bar.endMs),
		progress: bar.progress,
		predecessors: depLabels(edges, tasks, covers, 'toTask'),
		successors: depLabels(edges, tasks, covers, 'fromTask'),
		comment: bar.taskIndex >= 0 ? tasks[bar.taskIndex]?.comment : undefined,
		summary: bar.summary
	};
}

/**
 * The same content as one flat line, for the bar's `aria-label` and for the
 * native `title` that `tooltip={false}` falls back to. One function so the
 * accessible name and the visible popup can never drift apart.
 */
export function ganttTooltipText(
	model: GanttTooltipModel,
	opts: { locale?: string; labels: GanttTooltipLabels }
): string {
	const { locale, labels } = opts;
	const parts: string[] = [
		model.milestone
			? formatGanttDate(model.startMs, locale)
			: `${formatGanttDate(model.startMs, locale)} – ${formatGanttDate(model.endMs, locale)}`
	];
	if (model.days != null) parts.push(formatGanttDuration(model.days, locale));
	if (model.progress != null) parts.push(`${clamp(Math.round(model.progress), 0, 100)}%`);
	if (model.predecessors.length) parts.push(`${labels.dependsOn} ${model.predecessors.join(', ')}`);
	if (model.successors.length) parts.push(`${labels.followedBy} ${model.successors.join(', ')}`);

	const head = `${model.label}: ${parts.join(' · ')}`;
	// newlines are content in the popup, but a flat string has no room for them
	return model.comment ? `${head}. ${model.comment.replace(/\s*\n\s*/g, ' ')}` : head;
}

export interface GanttTooltipMetrics {
	/** popup width minus its horizontal padding */
	innerWidth: number;
	titleSize: number;
	fontSize: number;
	lineHeight: number;
	/** vertical gap between two blocks */
	blockGap: number;
	/** vertical padding plus borders */
	chrome: number;
	/** height of the progress row, when there is one */
	progressHeight: number;
}

/** Wrapped line count for one block of text at `fontSize`. */
function wrappedLines(text: string, fontSize: number, innerWidth: number, bold = false): number {
	if (!text || innerWidth <= 0) return 1;
	// authored newlines are hard breaks; each resulting line then wraps on its own
	return text
		.split('\n')
		.reduce(
			(sum, line) =>
				sum + Math.max(1, Math.ceil(estimateTextWidth(line, fontSize, { bold }) / innerWidth)),
			0
		);
}

/**
 * How tall the popup will render, near enough.
 *
 * Only ever used to pick which side of the bar it goes on, so an estimate is
 * enough — and an estimate is all that is available, since the popup has to be
 * placed in the same pass that creates it, and `estimateTextWidth` exists
 * precisely because measuring is impossible under jsdom.
 */
export function estimateGanttTooltipHeight(
	model: GanttTooltipModel,
	metrics: GanttTooltipMetrics
): number {
	const { innerWidth, fontSize, lineHeight, blockGap, chrome } = metrics;
	const blocks: number[] = [];

	blocks.push(wrappedLines(model.label, metrics.titleSize, innerWidth, true) * lineHeight);

	const dates = model.milestone ? 'MMM 00, 0000' : 'MMM 00, 0000 – MMM 00, 0000 · 000 days';
	blocks.push(wrappedLines(dates, fontSize, innerWidth) * lineHeight);

	if (model.progress != null) blocks.push(metrics.progressHeight);
	if (model.predecessors.length) {
		blocks.push(wrappedLines(model.predecessors.join(', '), fontSize, innerWidth) * lineHeight);
	}
	if (model.successors.length) {
		blocks.push(wrappedLines(model.successors.join(', '), fontSize, innerWidth) * lineHeight);
	}
	if (model.comment) blocks.push(wrappedLines(model.comment, fontSize, innerWidth) * lineHeight);

	const total = blocks.reduce((a, b) => a + b, 0) + blockGap * Math.max(blocks.length - 1, 0);
	return Math.round((total + chrome) * 100) / 100;
}
