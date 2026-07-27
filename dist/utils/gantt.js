const DAY_MS = 86_400_000;
const MAX_LABELED_TICKS = 14;
export function toUTCms(value) {
    const ms = value instanceof Date ? value.getTime() : Date.parse(value);
    if (Number.isNaN(ms)) {
        throw new Error(`GanttChart: invalid date "${String(value)}"`);
    }
    return ms;
}
export function formatGanttDate(ms, locale) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms);
}
function startOfDay(ms) {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function startOfWeek(ms) {
    const day = startOfDay(ms);
    const weekday = (new Date(day).getUTCDay() + 6) % 7;
    return day - weekday * DAY_MS;
}
function snapToUnit(ms, unit) {
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
function addUnit(base, unit, count) {
    if (unit === 'day')
        return base + count * DAY_MS;
    if (unit === 'week')
        return base + count * 7 * DAY_MS;
    const monthsPer = unit === 'month' ? 1 : unit === 'quarter' ? 3 : 12;
    const d = new Date(base);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + count * monthsPer, 1);
}
function pickUnit(spanDays) {
    if (spanDays <= 31)
        return 'day';
    if (spanDays <= 180)
        return 'week';
    if (spanDays <= 750)
        return 'month';
    if (spanDays <= 1900)
        return 'quarter';
    return 'year';
}
function makeLabeler(unit, locale) {
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
/** Half the milestone diamond, so arrows meet its vertices, not its centre. */
export const GANTT_MILESTONE_HALF = 7;
/** Half-width of the arrow head, in px; the connector line stops here. */
export const GANTT_ARROW_HEAD = 7;
/** Length of the straight stub leaving a bar before the connector turns. */
const ARROW_STUB = 10;
/**
 * Orthogonal finish-to-start connector from (x1, y1) — the predecessor's end —
 * to (x2, y2) — the successor's start. Coordinates are px inside the plot
 * canvas. The line stops short of x2 to leave room for the arrow head.
 */
export function ganttDependencyPath(x1, y1, x2, y2, rowHeight) {
    const tip = x2 - GANTT_ARROW_HEAD;
    const round = (n) => Math.round(n * 100) / 100;
    if (tip - x1 >= ARROW_STUB) {
        const elbow = Math.max(x1, tip - ARROW_STUB);
        return `M ${round(x1)} ${round(y1)} H ${round(elbow)} V ${round(y2)} H ${round(tip)}`;
    }
    // successor starts at or before the predecessor's end: route around the rows
    const lane = y1 + (y2 >= y1 ? rowHeight / 2 : -rowHeight / 2);
    return (`M ${round(x1)} ${round(y1)} H ${round(x1 + ARROW_STUB)} V ${round(lane)} ` +
        `H ${round(tip - ARROW_STUB)} V ${round(y2)} H ${round(tip)}`);
}
/** Filled triangle pointing right, with its tip at (x, y). */
export function ganttArrowHead(x, y) {
    const round = (n) => Math.round(n * 100) / 100;
    const back = round(x - GANTT_ARROW_HEAD);
    return `M ${round(x)} ${round(y)} L ${back} ${round(y - 4.5)} L ${back} ${round(y + 4.5)} Z`;
}
// ---------------------------------------------------------------------------
// Bar labels
//
// When a group collapses, its tasks lose the left-hand gutter and carry their
// own labels instead. Placement is decided in px here; the component paints it
// with percentage arithmetic anchored to the bar, so the two never disagree
// about which side the label sits on.
// ---------------------------------------------------------------------------
/** Mirrors `.gantt-bar { min-width: 4px }` — a 1px bar still paints 4px wide. */
const MIN_BAR_PX = 4;
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
export function estimateTextWidth(text, fontSize, opts) {
    if (!text)
        return 0;
    let em = 0;
    for (const ch of text) {
        if (NARROW_CHARS.has(ch))
            em += 0.3;
        else if (WIDE_CHARS.has(ch))
            em += 0.88;
        else if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'))
            em += 0.62;
        else
            em += 0.52;
    }
    const weight = opts?.bold ? 1.04 : 1;
    const px = em * fontSize * weight * ESTIMATE_BIAS * (opts?.scale ?? 1);
    return Math.round(px * 100) / 100;
}
const NO_LABEL = {
    placement: 'none',
    maxWidth: 0,
    width: 0,
    truncated: false
};
function barSpan(input) {
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
 * `'none'` is not data loss: the bar keeps its `title` tooltip.
 */
export function resolveGanttLabel(input) {
    const { text, plotWidth, fontSize } = input;
    if (!text || plotWidth <= 0)
        return NO_LABEL;
    const [spanStart, spanEnd, barWidth] = barSpan(input);
    const insideAllowed = input.insideAllowed !== false && input.milestone !== true;
    const candidates = [
        ['inside', insideAllowed ? barWidth - 2 * LABEL_PAD_INSIDE : 0],
        ['right', plotWidth - spanEnd - 2 * LABEL_GAP_OUTSIDE],
        ['left', spanStart - 2 * LABEL_GAP_OUTSIDE]
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
        if (candidate[1] > best[1])
            best = candidate;
    }
    if (best[1] < MIN_LABEL_WIDTH)
        return NO_LABEL;
    return { placement: best[0], maxWidth: best[1], width: best[1], truncated: true };
}
/**
 * Horizontal space a bar occupies *including* its label — the footprint the
 * lane packer has to keep clear.
 */
export function ganttBarExtent(input, label) {
    if (input.plotWidth <= 0)
        return { startPx: 0, endPx: 0 };
    const [spanStart, spanEnd] = barSpan(input);
    let start = spanStart;
    let end = spanEnd;
    if (label.placement === 'right')
        end += LABEL_GAP_OUTSIDE + label.width;
    else if (label.placement === 'left')
        start -= LABEL_GAP_OUTSIDE + label.width;
    return {
        startPx: clamp(start, 0, input.plotWidth),
        endPx: clamp(end, 0, input.plotWidth)
    };
}
/**
 * Assigns each item the lowest lane that has room for it — greedy interval-graph
 * colouring. Sorting by start first is what makes it optimal: the lane count it
 * returns is exactly the largest number of items overlapping at any one point.
 *
 * Ties break on input index so the result never depends on sort stability.
 */
export function packGanttLanes(items, gapPx = 0) {
    const order = items.map((_, i) => i).sort((a, b) => items[a].startPx - items[b].startPx || a - b);
    const laneEnds = [];
    const lanes = new Array(items.length).fill(0);
    for (const i of order) {
        const { startPx, endPx } = items[i];
        let lane = laneEnds.findIndex((end) => end + gapPx <= startPx);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(endPx);
        }
        else {
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
export function parseColorRGB(color) {
    if (typeof color !== 'string')
        return null;
    const value = color.trim();
    const hex = /^#([0-9a-f]+)$/i.exec(value);
    if (hex) {
        const digits = hex[1];
        if (digits.length === 3 || digits.length === 4) {
            const at = (i) => Number.parseInt(digits[i] + digits[i], 16);
            return [at(0), at(1), at(2)];
        }
        if (digits.length === 6 || digits.length === 8) {
            const at = (i) => Number.parseInt(digits.slice(i, i + 2), 16);
            return [at(0), at(2), at(4)];
        }
        return null;
    }
    const fn = /^rgba?\(([^)]*)\)$/i.exec(value);
    if (!fn)
        return null;
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3)
        return null;
    const channel = (part) => {
        const n = Number.parseFloat(part);
        if (Number.isNaN(n))
            return NaN;
        return clamp(Math.round(part.endsWith('%') ? (n / 100) * 255 : n), 0, 255);
    };
    const [r, g, b] = [channel(parts[0]), channel(parts[1]), channel(parts[2])];
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b))
        return null;
    return [r, g, b];
}
/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]) {
    const linear = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}
function pickInk(bg, opts) {
    const light = opts?.light ?? DEFAULT_LIGHT_INK;
    const dark = opts?.dark ?? DEFAULT_DARK_INK;
    const rgb = parseColorRGB(bg);
    if (!rgb)
        return { color: opts?.fallback ?? DEFAULT_OUTSIDE_INK, tone: 'outside' };
    const inkLuminance = (ink, fallback) => {
        const parsed = parseColorRGB(ink);
        return parsed ? relativeLuminance(parsed) : fallback;
    };
    const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const bgLuminance = relativeLuminance(rgb);
    const onLight = contrast(bgLuminance, inkLuminance(light, 1));
    const onDark = contrast(bgLuminance, inkLuminance(dark, DARK_INK_LUMINANCE));
    return onLight >= onDark ? { color: light, tone: 'light' } : { color: dark, tone: 'dark' };
}
/** Whichever of the light/dark inks contrasts better against `bg`. */
export function readableTextColor(bg, opts) {
    return pickInk(bg, opts).color;
}
/**
 * Ink for one bar label. A label beside a bar sits on the slide, not on the
 * bar, so it takes the theme's text colour — and so does a label inside a
 * *progress* bar that overhangs the solid fill, because the track behind it is
 * only a 30% tint of the bar colour over the slide background.
 */
export function ganttLabelInk(input) {
    const outside = {
        color: input.ink?.fallback ?? DEFAULT_OUTSIDE_INK,
        tone: 'outside'
    };
    if (input.placement !== 'inside')
        return outside;
    if (input.progress == null)
        return pickInk(input.color, input.ink);
    const fillEnd = input.barX + (input.barWidth * clamp(input.progress, 0, 100)) / 100;
    return input.labelRight <= fillEnd ? pickInk(input.color, input.ink) : outside;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function leafNode(item) {
    return { kind: 'leaf', key: `t:${item.taskIndex}`, item, leaves: [item.taskIndex] };
}
/** Every `GanttItem` under `node`, in document order. */
export function ganttLeafItems(node) {
    if (node.kind === 'leaf')
        return [node.item];
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
export function buildGanttTree(items, enabled) {
    if (!enabled)
        return items.map(leafNode);
    const rootNodes = [];
    const groups = new Map();
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
export function rollUpGanttGroup(items) {
    if (!items.length)
        return null;
    let startMs = Infinity;
    let endMs = -Infinity;
    let weighted = 0;
    let weight = 0;
    let hasProgress = false;
    let allMilestones = true;
    for (const item of items) {
        startMs = Math.min(startMs, item.startMs);
        endMs = Math.max(endMs, item.endMs);
        if (!item.milestone)
            allMilestones = false;
        if (item.task.progress != null)
            hasProgress = true;
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
function barFromItem(item) {
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
function barFromGroup(node) {
    const rolled = rollUpGanttGroup(ganttLeafItems(node));
    if (!rolled)
        return null;
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
function barGeometry(bar, o) {
    const barX = o.msToPx(bar.startMs);
    const barWidth = bar.milestone ? 0 : Math.max(o.msToPx(bar.endMs) - barX, 0);
    return { barX, barWidth };
}
/** A bar on its own row: the gutter carries the label, so nothing sits on the bar. */
function gutterLane(bar, o) {
    return { lane: 0, bar, label: NO_LABEL, ...barGeometry(bar, o) };
}
/**
 * Flattens the tree into rows with explicit `y` and `height`. A collapsed group
 * keeps every child visible by packing them onto lanes and moving their labels
 * onto the bars, so it is always shorter than the same group expanded.
 */
export function layoutGanttRows(tree, o) {
    const rows = [];
    let y = 0;
    const walk = (nodes, depth) => {
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
                const rolled = barFromGroup(node);
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
                .filter((bar) => bar !== null);
            const placed = bars.map((bar) => {
                const geometry = barGeometry(bar, o);
                const label = resolveGanttLabel({
                    text: bar.label,
                    plotWidth: o.plotWidth,
                    fontSize: o.labelFontSize,
                    milestone: bar.milestone,
                    insideAllowed: parseColorRGB(o.barColor(bar)) !== null,
                    ...geometry
                });
                return {
                    bar,
                    label,
                    ...geometry,
                    extent: ganttBarExtent({ ...geometry, plotWidth: o.plotWidth, milestone: bar.milestone }, label)
                };
            });
            const { lanes, laneCount } = packGanttLanes(placed.map((entry) => entry.extent));
            const height = Math.max(laneCount, 1) * o.laneHeight;
            rows.push({
                key: node.key,
                kind: 'group-collapsed',
                depth,
                label: node.section,
                y,
                height,
                laneCount,
                lanes: placed.map((entry, i) => ({
                    lane: lanes[i],
                    bar: entry.bar,
                    label: entry.label,
                    barX: entry.barX,
                    barWidth: entry.barWidth
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
export function computeGanttScale(startMs, endMs, locale) {
    const end = endMs > startMs ? endMs : startMs + DAY_MS;
    const unit = pickUnit((end - startMs) / DAY_MS);
    const boundaries = [];
    const min = snapToUnit(startMs, unit);
    for (let i = 0, t = min;; i += 1, t = addUnit(min, unit, i)) {
        boundaries.push(t);
        if (t >= end)
            break;
    }
    const max = boundaries[boundaries.length - 1];
    const step = Math.max(1, Math.ceil(boundaries.length / MAX_LABELED_TICKS));
    const label = makeLabeler(unit, locale);
    const ticks = boundaries
        .filter((_, i) => i % step === 0)
        .map((ms, i) => ({ ms, label: label(ms, i) }));
    return { min, max, unit, ticks };
}
/**
 * Where each task's arrows should attach. Rows are visited in document order and
 * later writes win, so a group header's broad claim over its descendants is
 * overwritten by each child's own row — while a *collapsed* group stops the walk
 * and keeps the claim. That is "nearest visible ancestor", without searching for
 * one.
 */
export function buildGanttAnchorMap(rows) {
    const anchors = new Map();
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
/**
 * Re-anchors every dependency onto the rows that are actually drawn. Edges
 * inside one collapsed bar disappear, and several edges that collapse onto the
 * same pair of endpoints become one arrow instead of a bundle of identical ones.
 *
 * Two children packed onto *different* lanes of one collapsed row stay distinct,
 * so the arrow between them survives.
 */
export function resolveGanttArrows(edges, anchors, geom) {
    const seen = new Set();
    const arrows = [];
    for (const edge of edges) {
        const from = anchors.get(edge.fromTask);
        const to = anchors.get(edge.toTask);
        if (!from || !to)
            continue;
        if (from.rowIndex === to.rowIndex && from.lane === to.lane)
            continue;
        const pair = `${from.rowIndex}:${from.lane}->${to.rowIndex}:${to.lane}`;
        if (seen.has(pair))
            continue;
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
