import { describe, it, expect } from 'vitest';
import type { GanttTask } from '../types/charts';
import {
	buildGanttAnchorMap,
	buildGanttTree,
	computeGanttScale,
	estimateTextWidth,
	formatGanttDate,
	ganttArrowHead,
	ganttBarExtent,
	ganttDependencyPath,
	ganttLabelInk,
	layoutGanttRows,
	packGanttLanes,
	parseColorRGB,
	relativeLuminance,
	readableTextColor,
	resolveGanttArrows,
	resolveGanttLabel,
	rollUpGanttGroup,
	toUTCms
} from './gantt';
import type { GanttItem, GanttLayoutOptions, GanttRow } from './gantt';

const DAY_MS = 86_400_000;

describe('toUTCms', () => {
	it('parses ISO date strings as UTC midnight', () => {
		expect(toUTCms('2026-03-01')).toBe(Date.UTC(2026, 2, 1));
	});

	it('accepts Date objects', () => {
		const date = new Date(Date.UTC(2026, 5, 15));
		expect(toUTCms(date)).toBe(date.getTime());
	});

	it('throws on invalid dates', () => {
		expect(() => toUTCms('not-a-date')).toThrow(/invalid date/);
	});
});

describe('computeGanttScale', () => {
	it('uses day ticks for short ranges and snaps the domain to day boundaries', () => {
		const scale = computeGanttScale(toUTCms('2026-03-03'), toUTCms('2026-03-17'));
		expect(scale.unit).toBe('day');
		expect(scale.min).toBe(Date.UTC(2026, 2, 3));
		expect(scale.max).toBeGreaterThanOrEqual(Date.UTC(2026, 2, 17));
		expect(scale.ticks[0].ms).toBe(scale.min);
	});

	it('uses week ticks starting on Mondays for multi-month ranges', () => {
		const scale = computeGanttScale(toUTCms('2026-01-07'), toUTCms('2026-04-15'));
		expect(scale.unit).toBe('week');
		for (const tick of scale.ticks) {
			expect(new Date(tick.ms).getUTCDay()).toBe(1);
		}
		expect(scale.min).toBeLessThanOrEqual(toUTCms('2026-01-07'));
	});

	it('uses month ticks for a year-long range and labels January with the year', () => {
		const scale = computeGanttScale(toUTCms('2025-11-01'), toUTCms('2026-08-31'));
		expect(scale.unit).toBe('month');
		const january = scale.ticks.find((tick) => new Date(tick.ms).getUTCMonth() === 0);
		expect(january?.label).toContain('2026');
	});

	it('localizes day labels (Czech)', () => {
		const scale = computeGanttScale(toUTCms('2026-03-03'), toUTCms('2026-03-17'), 'cs-CZ');
		expect(scale.ticks[0].label).toBe('3. 3.');
	});

	it('localizes month labels and keeps the year label compact (Czech)', () => {
		const scale = computeGanttScale(toUTCms('2025-11-01'), toUTCms('2026-08-31'), 'cs-CZ');
		const january = scale.ticks.find((tick) => new Date(tick.ms).getUTCMonth() === 0);
		expect(january?.label).toBe('led 2026');
	});

	it('keeps English month-year labels compact', () => {
		const scale = computeGanttScale(toUTCms('2025-11-01'), toUTCms('2026-08-31'), 'en-US');
		const january = scale.ticks.find((tick) => new Date(tick.ms).getUTCMonth() === 0);
		expect(january?.label).toBe('Jan 2026');
	});

	it('uses quarter ticks for multi-year ranges', () => {
		const scale = computeGanttScale(toUTCms('2024-02-01'), toUTCms('2027-06-30'));
		expect(scale.unit).toBe('quarter');
		expect(scale.ticks[0].label).toMatch(/^Q\d 20\d\d$/);
	});

	it('promotes a zero-length range to one day', () => {
		const start = toUTCms('2026-05-01');
		const scale = computeGanttScale(start, start);
		expect(scale.max - scale.min).toBeGreaterThanOrEqual(DAY_MS);
	});

	it('keeps the number of ticks bounded', () => {
		const scale = computeGanttScale(toUTCms('2026-01-01'), toUTCms('2026-06-30'));
		expect(scale.ticks.length).toBeLessThanOrEqual(15);
	});
});

describe('formatGanttDate', () => {
	it('formats a timestamp without timezone shifts', () => {
		expect(formatGanttDate(Date.UTC(2026, 2, 1), 'en-US')).toBe('Mar 1, 2026');
	});
});

describe('ganttDependencyPath', () => {
	it('elbows once when the successor starts after the predecessor ends', () => {
		const d = ganttDependencyPath(100, 18, 300, 54, 36);
		// M x1 y1 → H elbow → V y2 → H tip
		expect(d).toBe('M 100 18 H 283 V 54 H 293');
	});

	it('stops the line short of the target to leave room for the arrow head', () => {
		const d = ganttDependencyPath(0, 18, 200, 54, 36);
		expect(d.endsWith('H 193')).toBe(true);
	});

	it('routes around the rows when the successor starts before the predecessor ends', () => {
		const d = ganttDependencyPath(300, 18, 120, 54, 36);
		expect(d).toBe('M 300 18 H 310 V 36 H 103 V 54 H 113');
	});

	it('routes through the lane above when the successor sits on an earlier row', () => {
		const d = ganttDependencyPath(300, 90, 120, 18, 36);
		expect(d).toContain('V 72');
	});
});

describe('ganttArrowHead', () => {
	it('draws a closed triangle with its tip at the given point', () => {
		expect(ganttArrowHead(200, 50)).toBe('M 200 50 L 193 45.5 L 193 54.5 Z');
	});
});

describe('estimateTextWidth', () => {
	it('returns zero for empty text', () => {
		expect(estimateTextWidth('', 11)).toBe(0);
	});

	it('grows with the number of characters', () => {
		expect(estimateTextWidth('Backend', 11)).toBeGreaterThan(estimateTextWidth('Back', 11));
	});

	it('scales linearly with the font size', () => {
		expect(estimateTextWidth('Rollout', 24)).toBeCloseTo(estimateTextWidth('Rollout', 12) * 2, 5);
	});

	it('charges more for wide glyphs than narrow ones', () => {
		expect(estimateTextWidth('mmm', 11)).toBeGreaterThan(estimateTextWidth('iii', 11));
	});

	it('handles Czech diacritics without producing NaN', () => {
		expect(estimateTextWidth('Příprava', 11)).toBeGreaterThan(0);
	});
});

describe('resolveGanttLabel', () => {
	const base = { plotWidth: 720, fontSize: 11 };

	it('puts a short label inside a wide bar', () => {
		const label = resolveGanttLabel({ ...base, text: 'Build', barX: 100, barWidth: 300 });
		expect(label.placement).toBe('inside');
		expect(label.maxWidth).toBe(300 - 16);
		expect(label.truncated).toBe(false);
	});

	it('puts the label to the right of a narrow bar with room to spare', () => {
		const label = resolveGanttLabel({ ...base, text: 'Build', barX: 100, barWidth: 12 });
		expect(label.placement).toBe('right');
	});

	it('flips to the left when the bar runs to the right edge of the plot', () => {
		const label = resolveGanttLabel({ ...base, text: 'Rollout', barX: 700, barWidth: 20 });
		expect(label.placement).toBe('left');
	});

	it('never places a label inside a milestone', () => {
		const label = resolveGanttLabel({
			...base,
			text: 'Go / no-go',
			barX: 300,
			barWidth: 0,
			milestone: true
		});
		expect(label.placement).toBe('right');
	});

	it('honours insideAllowed: false even for a full-width bar', () => {
		const label = resolveGanttLabel({
			...base,
			text: 'Audit',
			barX: 0,
			barWidth: 720,
			insideAllowed: false
		});
		expect(label.placement).not.toBe('inside');
	});

	it('drops the label when every candidate box is unusably small', () => {
		const label = resolveGanttLabel({
			text: 'Security audit',
			barX: 14,
			barWidth: 2,
			plotWidth: 40,
			fontSize: 11
		});
		expect(label.placement).toBe('none');
	});

	it('truncates into the roomiest box when nothing fits outright', () => {
		const label = resolveGanttLabel({
			text: 'Requirements gathering',
			barX: 0,
			barWidth: 60,
			plotWidth: 70,
			fontSize: 11
		});
		expect(label.truncated).toBe(true);
		expect(label.maxWidth).toBeGreaterThanOrEqual(24);
		expect(label.width).toBe(label.maxWidth);
	});

	it('judges a sub-pixel bar on the 4px CSS minimum width', () => {
		const thin = resolveGanttLabel({ ...base, text: 'A', barX: 100, barWidth: 1 });
		const min = resolveGanttLabel({ ...base, text: 'A', barX: 100, barWidth: 4 });
		expect(thin).toEqual(min);
	});

	it('never returns a box that overflows the plot', () => {
		for (const barX of [0, 5, 200, 700, 719]) {
			for (const barWidth of [1, 30, 400]) {
				const label = resolveGanttLabel({ ...base, text: 'Frontend', barX, barWidth });
				expect(label.maxWidth).toBeLessThanOrEqual(720);
				expect(label.maxWidth).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('drops the label when the plot has no width yet', () => {
		expect(resolveGanttLabel({ ...base, text: 'A', barX: 0, barWidth: 0, plotWidth: 0 }).placement).toBe(
			'none'
		);
	});

	it('measures the box beside the bar against the bounds, not the plot edge', () => {
		const input = { ...base, text: 'Frontend', barX: 100, barWidth: 20 };
		expect(resolveGanttLabel(input).maxWidth).toBe(720 - 120 - 12);
		expect(resolveGanttLabel({ ...input, boundRight: 300 }).maxWidth).toBe(300 - 120 - 12);
	});

	it('gives up the right of the bar once the bound leaves no room there', () => {
		const label = resolveGanttLabel({
			...base,
			text: 'Frontend',
			barX: 100,
			barWidth: 20,
			boundRight: 124
		});
		expect(label.placement).not.toBe('right');
	});

	it('measures the box left of the bar from boundLeft', () => {
		const input = { ...base, text: 'Rollout', barX: 700, barWidth: 20 };
		expect(resolveGanttLabel(input).placement).toBe('left');
		expect(resolveGanttLabel(input).maxWidth).toBe(700 - 12);
		expect(resolveGanttLabel({ ...input, boundLeft: 600 }).maxWidth).toBe(700 - 600 - 12);
	});
});

describe('ganttBarExtent', () => {
	const plotWidth = 720;

	it('widens the footprint to the right of the bar when the label sits there', () => {
		const input = { barX: 100, barWidth: 12, plotWidth };
		const label = resolveGanttLabel({ ...input, text: 'Build', fontSize: 11 });
		const extent = ganttBarExtent(input, label);
		expect(extent.startPx).toBe(100);
		expect(extent.endPx).toBeGreaterThan(112 + 6);
	});

	it('widens to the left when the label sits on the left', () => {
		const input = { barX: 700, barWidth: 20, plotWidth };
		const label = resolveGanttLabel({ ...input, text: 'Rollout', fontSize: 11 });
		const extent = ganttBarExtent(input, label);
		expect(extent.startPx).toBeLessThan(700);
		expect(extent.endPx).toBe(720);
	});

	it('adds nothing when the label fits inside the bar', () => {
		const input = { barX: 100, barWidth: 300, plotWidth };
		const label = resolveGanttLabel({ ...input, text: 'Build', fontSize: 11 });
		expect(ganttBarExtent(input, label)).toEqual({ startPx: 100, endPx: 400 });
	});

	it('gives a milestone the width of its diamond', () => {
		const input = { barX: 300, barWidth: 0, plotWidth, milestone: true };
		const label = resolveGanttLabel({ ...input, text: 'X', fontSize: 11 });
		expect(ganttBarExtent(input, label).startPx).toBe(293);
	});
});

describe('packGanttLanes', () => {
	it('puts a sequential chain on a single lane', () => {
		const { lanes, laneCount } = packGanttLanes([
			{ startPx: 0, endPx: 50 },
			{ startPx: 60, endPx: 100 },
			{ startPx: 110, endPx: 150 }
		]);
		expect(laneCount).toBe(1);
		expect(lanes).toEqual([0, 0, 0]);
	});

	it('needs exactly as many lanes as the largest overlapping set', () => {
		const { laneCount } = packGanttLanes([
			{ startPx: 0, endPx: 100 },
			{ startPx: 10, endPx: 110 },
			{ startPx: 20, endPx: 120 }
		]);
		expect(laneCount).toBe(3);
	});

	it('reuses a lane once its previous occupant has ended', () => {
		const { lanes, laneCount } = packGanttLanes([
			{ startPx: 0, endPx: 100 },
			{ startPx: 10, endPx: 40 },
			{ startPx: 50, endPx: 90 }
		]);
		expect(laneCount).toBe(2);
		expect(lanes).toEqual([0, 1, 1]);
	});

	it('is independent of input order', () => {
		const items = [
			{ startPx: 60, endPx: 100 },
			{ startPx: 0, endPx: 50 },
			{ startPx: 10, endPx: 40 }
		];
		expect(packGanttLanes(items).laneCount).toBe(packGanttLanes([...items].reverse()).laneCount);
	});

	it('honours a gap between neighbours on the same lane', () => {
		const items = [
			{ startPx: 0, endPx: 50 },
			{ startPx: 55, endPx: 90 }
		];
		expect(packGanttLanes(items, 0).laneCount).toBe(1);
		expect(packGanttLanes(items, 10).laneCount).toBe(2);
	});

	it('returns nothing for an empty list', () => {
		expect(packGanttLanes([])).toEqual({ lanes: [], laneCount: 0 });
	});
});

describe('parseColorRGB', () => {
	it('parses hex in 3, 4, 6 and 8 digit forms', () => {
		expect(parseColorRGB('#abc')).toEqual([170, 187, 204]);
		expect(parseColorRGB('#abcd')).toEqual([170, 187, 204]);
		expect(parseColorRGB('#AABBCC')).toEqual([170, 187, 204]);
		expect(parseColorRGB('  #aabbccff ')).toEqual([170, 187, 204]);
	});

	it('parses rgb() and rgba() in comma and space syntax', () => {
		expect(parseColorRGB('rgb(1, 2, 3)')).toEqual([1, 2, 3]);
		expect(parseColorRGB('rgba(1 2 3 / 50%)')).toEqual([1, 2, 3]);
		expect(parseColorRGB('rgb(100%, 0%, 50%)')).toEqual([255, 0, 128]);
	});

	it('returns null for colours it cannot measure', () => {
		for (const value of [
			'rebeccapurple',
			'hsl(200 50% 50%)',
			'color-mix(in srgb, #fff 30%, transparent)',
			'var(--ctp-mauve)',
			'#ab',
			''
		]) {
			expect(parseColorRGB(value)).toBeNull();
		}
	});
});

describe('relativeLuminance', () => {
	it('anchors at black and white', () => {
		expect(relativeLuminance([0, 0, 0])).toBe(0);
		expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
	});

	it('lands mid-scale for mid grey', () => {
		expect(relativeLuminance([128, 128, 128])).toBeCloseTo(0.2159, 3);
	});
});

describe('readableTextColor', () => {
	const ink = { light: '#ffffff', dark: '#000000' };

	// the shipped theme: pastel bars that must not carry the theme's light text
	it('picks dark ink for every Catppuccin chart colour', () => {
		const palette = [
			'#f38ba8',
			'#89b4fa',
			'#a6e3a1',
			'#fab387',
			'#cba6f7',
			'#74c7ec',
			'#f9e2af',
			'#94e2d5',
			'#f5c2e7',
			'#89dceb',
			'#eba0ac',
			'#b4befe'
		];
		for (const color of palette) {
			expect(readableTextColor(color, ink)).toBe('#000000');
		}
	});

	// the Generali deck theme is the exact inverse: near-black bars on white
	it('picks light ink for near-black corporate palette bars', () => {
		for (const color of ['#1a1a1a', '#212121', '#424242']) {
			expect(readableTextColor(color, ink)).toBe('#ffffff');
		}
	});

	it('defaults to themeable custom properties rather than raw hex', () => {
		expect(readableTextColor('#1a1a1a')).toContain('--gantt-bar-label-light');
		expect(readableTextColor('#f9e2af')).toContain('--gantt-bar-label-dark');
	});

	it('falls back when the background cannot be measured', () => {
		expect(readableTextColor('rebeccapurple', { ...ink, fallback: 'inherit' })).toBe('inherit');
	});
});

describe('ganttLabelInk', () => {
	const bar = { barX: 100, barWidth: 200, labelRight: 150 };

	it('uses the slide text colour for any label placed beside a bar', () => {
		for (const placement of ['right', 'left'] as const) {
			expect(ganttLabelInk({ ...bar, color: '#1a1a1a', placement }).tone).toBe('outside');
		}
	});

	it('uses contrasting ink inside a solid bar', () => {
		expect(ganttLabelInk({ ...bar, color: '#1a1a1a', placement: 'inside' }).tone).toBe('light');
		expect(ganttLabelInk({ ...bar, color: '#f9e2af', placement: 'inside' }).tone).toBe('dark');
	});

	it('keeps contrasting ink while the label stays over the solid progress fill', () => {
		const result = ganttLabelInk({ ...bar, color: '#1a1a1a', placement: 'inside', progress: 80 });
		expect(result.tone).toBe('light');
	});

	// past the fill the "bar" is a 30% tint over the slide, so bar contrast lies
	it('falls back to the slide text colour when the label overhangs the track', () => {
		const result = ganttLabelInk({ ...bar, color: '#1a1a1a', placement: 'inside', progress: 10 });
		expect(result.tone).toBe('outside');
	});
});

// --- rows -------------------------------------------------------------------

const day = (n: number) => Date.UTC(2026, 0, n);

function mkItem(
	taskIndex: number,
	label: string,
	startDay: number,
	endDay: number,
	section?: string,
	extra: Partial<GanttTask> = {}
): GanttItem {
	const startMs = day(startDay);
	const endMs = day(endDay);
	return {
		taskIndex,
		task: { label, start: new Date(startMs), end: new Date(endMs), section, ...extra },
		startMs,
		endMs,
		milestone: extra.milestone === true
	};
}

// 20px per day, with 1 January at x = 0
const layoutOpts = (
	collapsed: string[] = [],
	over: Partial<GanttLayoutOptions> = {}
): GanttLayoutOptions => ({
	collapsed: new Set(collapsed),
	rowHeight: 36,
	laneHeight: 22,
	plotWidth: 720,
	msToPx: (ms) => ((ms - day(1)) / DAY_MS) * 20,
	labelFontSize: 11,
	barColor: () => '#89b4fa',
	...over
});

describe('buildGanttTree', () => {
	const items = [
		mkItem(0, 'Research', 1, 5, 'Discovery'),
		mkItem(1, 'Spec', 5, 9, 'Discovery'),
		mkItem(2, 'Backend', 9, 20, 'Build')
	];

	it('is an identity transform when grouping is off', () => {
		const tree = buildGanttTree(items, false);
		expect(tree).toHaveLength(3);
		expect(tree.every((node) => node.kind === 'leaf')).toBe(true);
	});

	it('groups tasks by section in first-appearance order', () => {
		const tree = buildGanttTree(items, true);
		expect(tree.map((node) => (node.kind === 'group' ? node.section : '?'))).toEqual([
			'Discovery',
			'Build'
		]);
		expect(tree[0].kind === 'group' && tree[0].children).toHaveLength(2);
	});

	it('folds an interleaved section into one group rather than repeating it', () => {
		const interleaved = [
			mkItem(0, 'A', 1, 5, 'One'),
			mkItem(1, 'B', 5, 9, 'Two'),
			mkItem(2, 'C', 9, 12, 'One')
		];
		const tree = buildGanttTree(interleaved, true);
		expect(tree).toHaveLength(2);
		expect(tree[0].kind === 'group' && tree[0].leaves).toEqual([0, 2]);
	});

	it('leaves sectionless tasks as top-level rows', () => {
		const mixed = [mkItem(0, 'Loose', 1, 5), mkItem(1, 'Grouped', 5, 9, 'Build')];
		const tree = buildGanttTree(mixed, true);
		expect(tree[0].kind).toBe('leaf');
		expect(tree[1].kind).toBe('group');
	});
});

describe('rollUpGanttGroup', () => {
	it('returns null for an empty group', () => {
		expect(rollUpGanttGroup([])).toBeNull();
	});

	it('spans from the earliest start to the latest end', () => {
		const rolled = rollUpGanttGroup([mkItem(0, 'A', 5, 9), mkItem(1, 'B', 1, 7)]);
		expect(rolled?.startMs).toBe(day(1));
		expect(rolled?.endMs).toBe(day(9));
	});

	it('weights progress by duration', () => {
		// 8 days at 100% and 2 days at 0% ⇒ 80%
		const rolled = rollUpGanttGroup([
			mkItem(0, 'Long', 1, 9, undefined, { progress: 100 }),
			mkItem(1, 'Short', 9, 11, undefined, { progress: 0 })
		]);
		expect(rolled?.progress).toBe(80);
	});

	// a zero-length milestone would otherwise contribute no weight at all
	it('gives a milestone a full day of weight', () => {
		const rolled = rollUpGanttGroup([
			mkItem(0, 'Task', 1, 2, undefined, { progress: 100 }),
			mkItem(1, 'Gate', 3, 3, undefined, { progress: 0, milestone: true })
		]);
		expect(rolled?.progress).toBe(50);
	});

	it('leaves progress unset when no child reports any', () => {
		expect(rollUpGanttGroup([mkItem(0, 'A', 1, 5)])?.progress).toBeUndefined();
	});

	it('stays a milestone when every child is one on the same day', () => {
		const rolled = rollUpGanttGroup([
			mkItem(0, 'A', 4, 4, undefined, { milestone: true }),
			mkItem(1, 'B', 4, 4, undefined, { milestone: true })
		]);
		expect(rolled?.milestone).toBe(true);
	});
});

describe('layoutGanttRows', () => {
	const items = [
		mkItem(0, 'Research', 1, 5, 'Discovery'),
		mkItem(1, 'Spec', 6, 10, 'Discovery'),
		mkItem(2, 'Backend', 11, 20, 'Build')
	];

	it('stacks ungrouped tasks at a constant row height', () => {
		const { rows, totalHeight } = layoutGanttRows(buildGanttTree(items, false), layoutOpts());
		expect(rows.map((row) => row.y)).toEqual([0, 36, 72]);
		expect(rows.every((row) => row.kind === 'task')).toBe(true);
		expect(totalHeight).toBe(108);
	});

	it('gives an expanded group a header row above its children', () => {
		const { rows } = layoutGanttRows(buildGanttTree(items, true), layoutOpts());
		expect(rows.map((row) => row.kind)).toEqual([
			'group-header',
			'task',
			'task',
			'group-header',
			'task'
		]);
		expect(rows[1].depth).toBe(1);
	});

	// the children are right below it, so a roll-up would restate them
	it('leaves an expanded group header bare unless a summary bar is asked for', () => {
		const { rows } = layoutGanttRows(buildGanttTree(items, true), layoutOpts());
		expect(rows[0].lanes).toEqual([]);
	});

	it('draws the whole group span on the header bar', () => {
		const { rows } = layoutGanttRows(
			buildGanttTree(items, true),
			layoutOpts([], { summaryBar: true })
		);
		expect(rows[0].lanes[0].bar.summary).toBe(true);
		expect(rows[0].lanes[0].bar.startMs).toBe(day(1));
		expect(rows[0].lanes[0].bar.endMs).toBe(day(10));
	});

	it('packs a collapsed group onto one row and keeps every child visible', () => {
		const { rows } = layoutGanttRows(buildGanttTree(items, true), layoutOpts(['Discovery']));
		const collapsed = rows[0];
		expect(collapsed.kind).toBe('group-collapsed');
		expect(collapsed.lanes).toHaveLength(2);
		expect(collapsed.height).toBe(collapsed.laneCount * 22);
	});

	it('moves labels onto the bars only inside a collapsed group', () => {
		const expanded = layoutGanttRows(
			buildGanttTree(items, true),
			layoutOpts([], { summaryBar: true })
		);
		expect(expanded.rows.every((row) => row.lanes.every((l) => l.label.placement === 'none'))).toBe(
			true
		);

		const collapsed = layoutGanttRows(buildGanttTree(items, true), layoutOpts(['Discovery']));
		expect(collapsed.rows[0].lanes.every((l) => l.label.placement !== 'none')).toBe(true);
	});

	it('is always shorter collapsed than expanded', () => {
		const expanded = layoutGanttRows(buildGanttTree(items, true), layoutOpts());
		const collapsed = layoutGanttRows(
			buildGanttTree(items, true),
			layoutOpts(['Discovery', 'Build'])
		);
		expect(collapsed.totalHeight).toBeLessThan(expanded.totalHeight);
	});

	it('spends one lane per overlapping child', () => {
		const overlapping = [
			mkItem(0, 'A', 1, 30, 'Build'),
			mkItem(1, 'B', 2, 31, 'Build'),
			mkItem(2, 'C', 3, 32, 'Build')
		];
		const { rows } = layoutGanttRows(buildGanttTree(overlapping, true), layoutOpts(['Build']));
		expect(rows[0].laneCount).toBe(3);
	});

	// a label is not a reason to spend a lane: it can always truncate, and whether
	// it even needs the room depends on the lane it would have been given
	it('keeps back-to-back children on one lane however long their labels are', () => {
		const consecutive = [
			mkItem(0, 'Requirements analysis', 1, 4, 'Build'),
			mkItem(1, 'Core implementation', 4, 7, 'Build'),
			mkItem(2, 'Integration testing', 7, 10, 'Build')
		];
		const { rows } = layoutGanttRows(buildGanttTree(consecutive, true), layoutOpts(['Build']));
		expect(rows[0].laneCount).toBe(1);
		expect(rows[0].lanes.map((lane) => lane.lane)).toEqual([0, 0, 0]);
		expect(rows[0].lanes.every((lane) => lane.label.placement !== 'none')).toBe(true);
	});

	// however far it has to truncate, it stays on the lane the dates gave it
	it('does not spend a lane on a label that can shorten instead', () => {
		const laneCount = (labels: string[]) => {
			const items = labels.map((label, i) => mkItem(i, label, 1 + i * 3, 4 + i * 3, 'Build'));
			return layoutGanttRows(buildGanttTree(items, true), layoutOpts(['Build'])).rows[0].laneCount;
		};
		expect(laneCount(['A', 'B', 'C'])).toBe(1);
		expect(laneCount(['A very long task label indeed', 'B', 'C'])).toBe(1);
	});

	// the exception, and the only one: shortening it is no longer an option
	it('spends a lane on a label a neighbour would erase altogether', () => {
		// the milestone has no bar to sit in, and its neighbours leave it no gap
		const crowded = [
			mkItem(0, 'Audit', 1, 5, 'Ship'),
			mkItem(1, 'Go / no-go', 6, 6, 'Ship', { milestone: true }),
			mkItem(2, 'Rollout', 7, 20, 'Ship')
		];
		const { rows } = layoutGanttRows(buildGanttTree(crowded, true), layoutOpts(['Ship']));
		expect(rows[0].laneCount).toBe(2);

		const gate = rows[0].lanes.find((lane) => lane.bar.label === 'Go / no-go');
		expect(gate?.label.placement).not.toBe('none');
		// the lane it was given is its own; the other two still share the first
		expect(rows[0].lanes.filter((lane) => lane.lane === gate?.lane)).toHaveLength(1);
	});

	// one gap between two narrow bars: the first wants it on its right, the second
	// on its left, and only one of them may have it
	it('never lets two labels on one lane claim the same gap', () => {
		const items = [
			mkItem(0, 'Discovery workshop', 1, 3, 'Build'),
			// hard against the right edge, so its label has nowhere to go but left
			mkItem(1, 'Launch retrospective', 12, 14, 'Build')
		];
		const { rows } = layoutGanttRows(
			buildGanttTree(items, true),
			layoutOpts(['Build'], { plotWidth: 300 })
		);
		expect(rows[0].laneCount).toBe(1);
		expect(rows[0].lanes.map((lane) => lane.label.placement)).toEqual(['right', 'left']);

		const boxes = rows[0].lanes.map((lane) =>
			ganttBarExtent(
				{ barX: lane.barX, barWidth: lane.barWidth, plotWidth: 300, milestone: lane.bar.milestone },
				lane.label
			)
		);
		expect(boxes[0].endPx).toBeLessThanOrEqual(boxes[1].startPx);
	});

	// they share a lane and a section colour, so the seam is all that separates them
	it('marks a child that starts where its lane-mate ended', () => {
		const consecutive = [
			mkItem(0, 'First', 1, 4, 'Build'),
			mkItem(1, 'Second', 4, 7, 'Build'),
			// a clear week later: a visible gap already, so no seam
			mkItem(2, 'Third', 14, 17, 'Build')
		];
		const { rows } = layoutGanttRows(buildGanttTree(consecutive, true), layoutOpts(['Build']));
		expect(rows[0].laneCount).toBe(1);
		expect(rows[0].lanes.map((lane) => lane.abuts)).toEqual([false, true, false]);
	});

	it('leaves a milestone unseamed and never seams an uncollapsed row', () => {
		const items = [
			mkItem(0, 'Freeze', 1, 4, 'Ship'),
			mkItem(1, 'Gate', 4, 4, 'Ship', { milestone: true })
		];
		const tree = buildGanttTree(items, true);
		// the diamond has its own outline, so it needs no seam of its own
		expect(
			layoutGanttRows(tree, layoutOpts(['Ship'])).rows[0].lanes.every((lane) => !lane.abuts)
		).toBe(true);
		// expanded, every bar has a row to itself and nothing to abut
		expect(
			layoutGanttRows(tree, layoutOpts([], { summaryBar: true })).rows.every((row) =>
				row.lanes.every((lane) => !lane.abuts)
			)
		).toBe(true);
	});

	// half the diamond hangs back over the bar by definition, and a gate closing a
	// phase is the normal case — not worth a lane, and the row is as tall as it has
	// lanes
	it('lets a milestone share the lane of the bar it closes', () => {
		const closing = [
			mkItem(0, 'Analysis', 1, 4, 'Ship'),
			mkItem(1, 'Delivery', 4, 9, 'Ship'),
			mkItem(2, 'Go-live', 9, 9, 'Ship', { milestone: true })
		];
		const { rows } = layoutGanttRows(buildGanttTree(closing, true), layoutOpts(['Ship']));
		expect(rows[0].laneCount).toBe(1);
		expect(rows[0].lanes.map((lane) => lane.lane)).toEqual([0, 0, 0]);
		expect(rows[0].lanes.every((lane) => lane.label.placement !== 'none')).toBe(true);
	});

	// only the leading half is forgiven: a milestone inside a bar still overlaps it
	it('still spends a lane on a milestone that lands mid-bar', () => {
		const overlapping = [
			mkItem(0, 'Delivery', 1, 9, 'Ship'),
			mkItem(1, 'Checkpoint', 5, 5, 'Ship', { milestone: true })
		];
		const { rows } = layoutGanttRows(buildGanttTree(overlapping, true), layoutOpts(['Ship']));
		expect(rows[0].laneCount).toBe(2);
	});

	it('splits adjacent children too narrow to paint side by side', () => {
		const adjacent = [mkItem(0, 'A', 1, 2, 'Build'), mkItem(1, 'B', 2, 3, 'Build')];
		// 1px per day: two 1px bars 1px apart, which `.gantt-bar`'s 4px minimum
		// width paints on top of each other
		const { rows } = layoutGanttRows(
			buildGanttTree(adjacent, true),
			layoutOpts(['Build'], { msToPx: (ms) => (ms - day(1)) / DAY_MS })
		);
		expect(rows[0].lanes.map((lane) => lane.lane)).toEqual([0, 1]);
	});

	it('keeps text off a bar whose colour it cannot measure', () => {
		const { rows } = layoutGanttRows(
			buildGanttTree(items, true),
			layoutOpts(['Discovery'], { barColor: () => 'rebeccapurple' })
		);
		expect(rows[0].lanes.every((l) => l.label.placement !== 'inside')).toBe(true);
	});
});

// --- dependency arrows ------------------------------------------------------

describe('buildGanttAnchorMap', () => {
	const items = [
		mkItem(0, 'Research', 1, 5, 'Discovery'),
		mkItem(1, 'Spec', 6, 10, 'Discovery')
	];

	it('anchors each task to its own row when everything is expanded', () => {
		const { rows } = layoutGanttRows(buildGanttTree(items, true), layoutOpts());
		const anchors = buildGanttAnchorMap(rows);
		expect(anchors.get(0)?.rowIndex).toBe(1);
		expect(anchors.get(1)?.rowIndex).toBe(2);
	});

	it('anchors every child of a collapsed group to the one row that replaces them', () => {
		const { rows } = layoutGanttRows(buildGanttTree(items, true), layoutOpts(['Discovery']));
		const anchors = buildGanttAnchorMap(rows);
		expect(anchors.get(0)?.rowIndex).toBe(0);
		expect(anchors.get(1)?.rowIndex).toBe(0);
		// the two tasks don't overlap, so they share a lane and keep their own dates
		expect(anchors.get(0)?.endMs).toBe(day(5));
		expect(anchors.get(1)?.startMs).toBe(day(6));
	});

	it('separates overlapping children onto their own lanes of that row', () => {
		const overlapping = [mkItem(0, 'A', 1, 30, 'Build'), mkItem(1, 'B', 2, 31, 'Build')];
		const { rows } = layoutGanttRows(buildGanttTree(overlapping, true), layoutOpts(['Build']));
		const anchors = buildGanttAnchorMap(rows);
		expect(anchors.get(0)?.rowIndex).toBe(anchors.get(1)?.rowIndex);
		expect(anchors.get(0)?.lane).not.toBe(anchors.get(1)?.lane);
	});
});

describe('resolveGanttArrows', () => {
	const geom = { x: (ms: number) => ms / DAY_MS, rowY: (row: number, lane: number) => row * 100 + lane };

	const anchor = (rowIndex: number, lane: number, over = {}) => ({
		rowIndex,
		lane,
		startMs: day(1),
		endMs: day(5),
		milestone: false,
		...over
	});

	it('keeps one arrow per pair of distinct endpoints', () => {
		const anchors = new Map([
			[0, anchor(0, 0)],
			[1, anchor(1, 0)]
		]);
		const arrows = resolveGanttArrows([{ fromTask: 0, toTask: 1, depKey: 'a' }], anchors, geom);
		expect(arrows).toHaveLength(1);
		expect(arrows[0].y1).toBe(0);
		expect(arrows[0].y2).toBe(100);
	});

	it('drops an edge whose ends collapse onto the same bar', () => {
		const anchors = new Map([
			[0, anchor(0, 0)],
			[1, anchor(0, 0)]
		]);
		expect(resolveGanttArrows([{ fromTask: 0, toTask: 1, depKey: 'a' }], anchors, geom)).toEqual([]);
	});

	it('keeps an edge between two lanes of the same collapsed row', () => {
		const anchors = new Map([
			[0, anchor(0, 0)],
			[1, anchor(0, 1)]
		]);
		expect(resolveGanttArrows([{ fromTask: 0, toTask: 1, depKey: 'a' }], anchors, geom)).toHaveLength(
			1
		);
	});

	it('collapses many edges between the same two rows into one arrow', () => {
		const anchors = new Map([
			[0, anchor(0, 0)],
			[1, anchor(0, 0)],
			[2, anchor(1, 0)],
			[3, anchor(1, 0)]
		]);
		const arrows = resolveGanttArrows(
			[
				{ fromTask: 0, toTask: 2, depKey: 'a' },
				{ fromTask: 0, toTask: 3, depKey: 'b' },
				{ fromTask: 1, toTask: 2, depKey: 'c' }
			],
			anchors,
			geom
		);
		expect(arrows).toHaveLength(1);
	});

	it('skips references it cannot resolve', () => {
		const anchors = new Map([[0, anchor(0, 0)]]);
		expect(resolveGanttArrows([{ fromTask: 0, toTask: 9, depKey: 'a' }], anchors, geom)).toEqual([]);
	});

	// only reachable at depth ≥ 2, where a collapsed group packs another group
	it('takes its x coordinates from the rolled-up span of a stand-in bar', () => {
		const rows: GanttRow[] = [
			{
				key: 'g:Outer',
				kind: 'group-collapsed',
				depth: 0,
				label: 'Outer',
				y: 0,
				height: 22,
				laneCount: 1,
				collapsed: true,
				section: 'Outer',
				lanes: [
					{
						lane: 0,
						barX: 0,
						barWidth: 100,
						abuts: false,
						label: { placement: 'none', maxWidth: 0, width: 0, truncated: false },
						bar: {
							key: 'g:Inner:roll',
							label: 'Inner',
							startMs: day(1),
							endMs: day(30),
							milestone: false,
							taskIndex: -1,
							covers: [7, 8],
							summary: true
						}
					}
				]
			}
		];
		const anchors = buildGanttAnchorMap(rows);
		anchors.set(9, anchor(1, 0, { startMs: day(40) }));
		const arrows = resolveGanttArrows([{ fromTask: 7, toTask: 9, depKey: 'x' }], anchors, geom);
		// the hidden task ends on day 5, but the bar that stands in for it runs to day 30
		expect(arrows[0].x1).toBe(day(30) / DAY_MS);
	});

	it('meets a milestone at its vertex rather than its centre', () => {
		const anchors = new Map([
			[0, anchor(0, 0, { milestone: true })],
			[1, anchor(1, 0)]
		]);
		const arrows = resolveGanttArrows([{ fromTask: 0, toTask: 1, depKey: 'a' }], anchors, geom);
		expect(arrows[0].x1).toBe(day(5) / DAY_MS + 7);
	});
});
