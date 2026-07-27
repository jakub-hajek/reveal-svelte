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
