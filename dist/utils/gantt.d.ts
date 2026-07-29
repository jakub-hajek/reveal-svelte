import type { GanttSubtask, GanttTask } from '../types/charts';
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
export declare function toUTCms(value: string | Date): number;
export declare function formatGanttDate(ms: number, locale?: string): string;
/**
 * Half the milestone diamond, so arrows meet its vertices, not its centre.
 *
 * The diamond is a square turned 45°, so what it occupies horizontally is its
 * *diagonal* — side × √2 — not its side. Reading the CSS number straight off
 * understated the reach by a third, which quietly shrank the gap `clearMilestones`
 * leaves and pulled arrowheads inside the shape.
 */
export declare const GANTT_MILESTONE_HALF: number;
/** Half-width of the arrow head, in px; the connector line stops here. */
export declare const GANTT_ARROW_HEAD = 7;
/**
 * Orthogonal finish-to-start connector from (x1, y1) — the predecessor's end —
 * to (x2, y2) — the successor's start. Coordinates are px inside the plot
 * canvas. The line stops short of x2 to leave room for the arrow head.
 */
export declare function ganttDependencyPath(x1: number, y1: number, x2: number, y2: number, rowHeight: number): string;
/** Filled triangle pointing right, with its tip at (x, y). */
export declare function ganttArrowHead(x: number, y: number): string;
/**
 * Width of `text` in px, estimated from per-character advances for the
 * `Inter, system-ui, sans-serif` stack the chart hardcodes.
 *
 * Deliberately not `canvas.measureText`: that would make this impure and it
 * returns 0 under jsdom, where the component tests run.
 */
export declare function estimateTextWidth(text: string, fontSize: number, opts?: {
    bold?: boolean;
    scale?: number;
}): number;
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
export declare function resolveGanttLabel(input: GanttLabelInput): GanttLabelLayout;
export interface GanttExtent {
    startPx: number;
    endPx: number;
}
/**
 * Horizontal space a bar occupies *including* its label — the footprint the
 * lane packer has to keep clear.
 */
export declare function ganttBarExtent(input: {
    barX: number;
    barWidth: number;
    plotWidth: number;
    milestone?: boolean;
}, label: GanttLabelLayout): GanttExtent;
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
export declare function ganttSubtaskSegments(subtasks: readonly GanttSubtask[]): GanttSubtaskSegment[];
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
export declare function packGanttLanes(items: readonly GanttPackable[], gapPx?: number): {
    lanes: number[];
    laneCount: number;
};
/**
 * Hex (3/4/6/8 digit) and `rgb()`/`rgba()` in comma or space syntax, with 0–255
 * or percentage channels. Returns null for anything else — named colours,
 * `hsl()`, `color-mix()`, `var()` — which is the signal to keep text off the bar
 * rather than guess at its contrast.
 */
export declare function parseColorRGB(color: string): [number, number, number] | null;
/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export declare function relativeLuminance([r, g, b]: [number, number, number]): number;
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
/** Whichever of the light/dark inks contrasts better against `bg`. */
export declare function readableTextColor(bg: string, opts?: GanttInkOptions): string;
/**
 * Ink for one bar label. A label beside a bar sits on the slide, not on the
 * bar, so it takes the theme's text colour — and so does a label inside a
 * *progress* bar that overhangs the solid fill, because the track behind it is
 * only a 30% tint of the bar colour over the slide background.
 */
export declare function ganttLabelInk(input: {
    color: string;
    progress?: number;
    placement: GanttLabelPlacement;
    /** px; right edge of the label box */
    labelRight: number;
    barX: number;
    barWidth: number;
    ink?: GanttInkOptions;
}): GanttInk;
export interface GanttItem {
    task: GanttTask;
    /** index into the caller's `tasks` array — the identity dependencies resolve to */
    taskIndex: number;
    startMs: number;
    endMs: number;
    milestone: boolean;
}
export type GanttTreeNode = {
    kind: 'leaf';
    key: string;
    item: GanttItem;
    leaves: number[];
} | {
    kind: 'group';
    key: string;
    section: string;
    children: GanttTreeNode[];
    leaves: number[];
};
/** Every `GanttItem` under `node`, in document order. */
export declare function ganttLeafItems(node: GanttTreeNode): GanttItem[];
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
export declare function buildGanttTree(items: readonly GanttItem[], enabled: boolean): GanttTreeNode[];
/**
 * Span and progress of a group, for the bar that stands in for it.
 *
 * Progress is duration-weighted, with each task counting for at least a day so
 * that zero-length milestones can't divide the weight to nothing. Children
 * without `progress` count as 0% once any sibling has it — "x% of this group's
 * work is done" is the honest reading.
 */
export declare function rollUpGanttGroup(items: readonly GanttItem[]): {
    startMs: number;
    endMs: number;
    milestone: boolean;
    progress?: number;
} | null;
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
/**
 * Flattens the tree into rows with explicit `y` and `height`. A collapsed group
 * keeps every child visible by packing them onto lanes and moving their labels
 * onto the bars, so it is always shorter than the same group expanded.
 */
export declare function layoutGanttRows(tree: readonly GanttTreeNode[], o: GanttLayoutOptions): GanttLayout;
export declare function computeGanttScale(startMs: number, endMs: number, locale?: string): GanttScale;
export type GanttMarkerAnchor = 'start' | 'middle' | 'end';
/**
 * How a marker's caption hangs off its line. Centred everywhere except near the
 * ends of the axis, where centring would push half the caption off the plot.
 */
export declare function ganttMarkerLabelAnchor(pct: number): GanttMarkerAnchor;
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
export declare function buildGanttAnchorMap(rows: readonly GanttRow[]): Map<number, GanttAnchor>;
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
export declare function resolveGanttArrows(edges: readonly GanttEdge[], anchors: ReadonlyMap<number, GanttAnchor>, geom: {
    x: (ms: number) => number;
    rowY: (rowIndex: number, lane: number) => number;
}): GanttArrowSpec[];
/** Daylight between a bar's lane band and the popup pointing at it. */
export declare const GANTT_TOOLTIP_GAP = 8;
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
export declare function placeGanttTooltip(anchor: GanttTooltipAnchor, 
/** `height` is an *estimate*: it picks the side only, never the offsets */
size: {
    width: number;
    height: number;
}, bounds: GanttTooltipBounds): GanttTooltipPlacement;
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
export declare function ganttDurationDays(startMs: number, endMs: number): number;
/**
 * `19 days` / `19 dní`. Via ICU rather than a hand-rolled plural table, which
 * would get Czech's three-way 1 / 2–4 / 5+ split wrong.
 */
export declare function formatGanttDuration(days: number, locale?: string): string;
export interface GanttTooltipLabels {
    dependsOn: string;
    followedBy: string;
}
/** The popup's two static captions, matching `unnamedSectionLabel`'s cs/en split. */
export declare function ganttTooltipLabels(locale?: string): GanttTooltipLabels;
/**
 * Everything the popup shows for one bar.
 *
 * Dependencies come from `bar.covers` rather than `bar.taskIndex`, which is the
 * rule `resolveGanttArrows` already applies: for a leaf bar `covers` is just its
 * own index, and for a group roll-up it drops the edges internal to the group
 * and keeps the ones crossing its boundary. A roll-up has no comment — there is
 * no single task under it to have written one.
 */
export declare function buildGanttTooltipModel(bar: GanttBarSpec, tasks: readonly GanttTask[], edges: readonly GanttEdge[]): GanttTooltipModel;
/**
 * The same content as one flat line, for the bar's `aria-label` and for the
 * native `title` that `tooltip={false}` falls back to. One function so the
 * accessible name and the visible popup can never drift apart.
 */
export declare function ganttTooltipText(model: GanttTooltipModel, opts: {
    locale?: string;
    labels: GanttTooltipLabels;
}): string;
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
/**
 * How tall the popup will render, near enough.
 *
 * Only ever used to pick which side of the bar it goes on, so an estimate is
 * enough — and an estimate is all that is available, since the popup has to be
 * placed in the same pass that creates it, and `estimateTextWidth` exists
 * precisely because measuring is impossible under jsdom.
 */
export declare function estimateGanttTooltipHeight(model: GanttTooltipModel, metrics: GanttTooltipMetrics): number;
