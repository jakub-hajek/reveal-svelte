import { describe, it, expect } from 'vitest';
import {
	computeGanttScale,
	formatGanttDate,
	ganttArrowHead,
	ganttDependencyPath,
	toUTCms
} from './gantt';

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
