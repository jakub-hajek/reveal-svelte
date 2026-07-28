import { fireEvent, render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import GanttChart from './GanttChart.svelte';
import type { GanttTask } from '../../types/charts';

const tasks: GanttTask[] = [
	{ label: 'Design', start: '2026-01-05', end: '2026-01-30', section: 'Phase 1' },
	{ label: 'Build', start: '2026-02-02', end: '2026-03-20', section: 'Phase 2', progress: 40 },
	{ label: 'Launch', start: '2026-03-27', section: 'Phase 2' }
];

describe('GanttChart component', () => {
	it('renders a label for every task', () => {
		const { getByText } = render(GanttChart, { props: { tasks } });
		expect(getByText('Design')).toBeInTheDocument();
		expect(getByText('Build')).toBeInTheDocument();
		expect(getByText('Launch')).toBeInTheDocument();
	});

	it('renders bars for ranged tasks and a milestone for date-only tasks', () => {
		const { container } = render(GanttChart, { props: { tasks } });
		expect(container.querySelectorAll('.gantt-bar').length).toBe(2);
		expect(container.querySelectorAll('.gantt-milestone').length).toBe(1);
	});

	it('renders a progress fill only for tasks with progress', () => {
		const { container } = render(GanttChart, { props: { tasks } });
		expect(container.querySelectorAll('.gantt-progress').length).toBe(1);
	});

	it('shows a legend when there is more than one section', () => {
		const { getByText, container } = render(GanttChart, { props: { tasks } });
		expect(getByText('Phase 1')).toBeInTheDocument();
		expect(getByText('Phase 2')).toBeInTheDocument();
		expect(container.querySelectorAll('.legend-swatch').length).toBe(2);
	});

	it('localizes the unnamed-section legend label for Czech', () => {
		const mixed: GanttTask[] = [
			{ label: 'A', start: '2026-01-01', end: '2026-02-01', section: 'Fáze 1' },
			{ label: 'B', start: '2026-02-01', end: '2026-03-01' }
		];
		const { getByText } = render(GanttChart, { props: { tasks: mixed, locale: 'cs-CZ' } });
		expect(getByText('Ostatní')).toBeInTheDocument();
	});

	it('accepts a custom label for the unnamed section', () => {
		const mixed: GanttTask[] = [
			{ label: 'A', start: '2026-01-01', end: '2026-02-01', section: 'Team' },
			{ label: 'B', start: '2026-02-01', end: '2026-03-01' }
		];
		const { getByText } = render(GanttChart, {
			props: { tasks: mixed, locale: 'de-DE', otherLabel: 'Sonstige' }
		});
		expect(getByText('Sonstige')).toBeInTheDocument();
	});

	it('hides the legend for a single section', () => {
		const { container } = render(GanttChart, {
			props: { tasks: [{ label: 'Solo', start: '2026-01-01', end: '2026-02-01' }] }
		});
		expect(container.querySelector('.gantt-legend')).toBeNull();
	});

	it('renders a today marker when today falls inside the range', () => {
		const { container } = render(GanttChart, { props: { tasks, today: '2026-02-15' } });
		expect(container.querySelector('.gantt-today')).not.toBeNull();
	});

	it('omits the today marker when today is outside the range', () => {
		const { container } = render(GanttChart, { props: { tasks, today: '2030-01-01' } });
		expect(container.querySelector('.gantt-today')).toBeNull();
	});

	it('renders one marker line per in-range marker', () => {
		const { container } = render(GanttChart, {
			props: { tasks, markers: [{ date: '2026-02-01' }, { date: '2026-03-01' }] }
		});
		expect(container.querySelectorAll('.gantt-marker').length).toBe(2);
	});

	it('drops markers outside the date range', () => {
		const { container } = render(GanttChart, {
			props: { tasks, markers: [{ date: '2026-02-01' }, { date: '2030-01-01' }] }
		});
		expect(container.querySelectorAll('.gantt-marker').length).toBe(1);
	});

	it('draws marker captions in the axis strip, not on the canvas', () => {
		const { getByText } = render(GanttChart, {
			props: { tasks, markers: [{ date: '2026-02-01', label: 'Kickoff' }] }
		});
		const label = getByText('Kickoff');
		expect(label).toHaveClass('gantt-marker-label');
		expect(label.closest('.gantt-axis')).not.toBeNull();
	});

	it('applies per-marker color and line style', () => {
		const { container } = render(GanttChart, {
			props: { tasks, markers: [{ date: '2026-02-01', color: '#ff0000', style: 'solid' }] }
		});
		const style = container.querySelector<HTMLElement>('.gantt-marker')?.style;
		expect(style?.borderLeftStyle).toBe('solid');
		expect(style?.borderLeftColor).toBe('rgb(255, 0, 0)');
	});

	it('grows the axis only when a marker carries a caption', () => {
		const axisHeight = (root: HTMLElement) =>
			root.querySelector<HTMLElement>('.gantt-body')?.style.getPropertyValue('--gantt-axis-h');

		const bare = render(GanttChart, { props: { tasks, markers: [{ date: '2026-02-01' }] } });
		expect(axisHeight(bare.container as HTMLElement)).toBe('26px');

		const labelled = render(GanttChart, {
			props: { tasks, markers: [{ date: '2026-02-01', label: 'Kickoff' }] }
		});
		expect(axisHeight(labelled.container as HTMLElement)).toBe('44px');
	});

	it('renders axis ticks and matching gridlines', () => {
		const { container } = render(GanttChart, { props: { tasks } });
		const ticks = container.querySelectorAll('.gantt-tick');
		expect(ticks.length).toBeGreaterThan(1);
		expect(container.querySelectorAll('.gantt-gridline').length).toBe(ticks.length);
	});

	it('draws an arrow for each resolved dependency', () => {
		const linked: GanttTask[] = [
			{ label: 'Design', start: '2026-01-05', end: '2026-01-30' },
			{ label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'Design' },
			{ label: 'Launch', start: '2026-03-27', dependsOn: ['Design', 'Build'] }
		];
		const { container } = render(GanttChart, { props: { tasks: linked } });
		expect(container.querySelectorAll('.gantt-arrow-line').length).toBe(3);
		expect(container.querySelectorAll('.gantt-arrow-head').length).toBe(3);
	});

	it('resolves dependencies by id when one is set', () => {
		const linked: GanttTask[] = [
			{ id: 'a', label: 'Design', start: '2026-01-05', end: '2026-01-30' },
			{ id: 'b', label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'a' }
		];
		const { container } = render(GanttChart, { props: { tasks: linked } });
		expect(container.querySelectorAll('.gantt-arrow-line').length).toBe(1);
	});

	it('ignores unknown and self references', () => {
		const linked: GanttTask[] = [
			{ label: 'Design', start: '2026-01-05', end: '2026-01-30', dependsOn: 'Design' },
			{ label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'Nope' }
		];
		const { container } = render(GanttChart, { props: { tasks: linked } });
		expect(container.querySelector('.gantt-arrows')).toBeNull();
	});

	it('hides arrows when dependencies is false', () => {
		const linked: GanttTask[] = [
			{ label: 'Design', start: '2026-01-05', end: '2026-01-30' },
			{ label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'Design' }
		];
		const { container } = render(GanttChart, {
			props: { tasks: linked, dependencies: false }
		});
		expect(container.querySelector('.gantt-arrows')).toBeNull();
	});

	it('renders nothing but the figure for an empty task list', () => {
		const { container } = render(GanttChart, { props: { tasks: [] } });
		expect(container.querySelector('.gantt-body')).toBeNull();
	});
});

// jsdom reports clientWidth as 0, so plotWidth falls back to width - labelWidth
// (720 by default) and the pixel-driven label placement below is deterministic.
describe('GanttChart groups', () => {
	const grouped: GanttTask[] = [
		{ label: 'Research', start: '2026-01-05', end: '2026-01-30', section: 'Discovery' },
		{ label: 'Spec', start: '2026-02-02', end: '2026-02-27', section: 'Discovery' },
		{ label: 'Backend', start: '2026-03-02', end: '2026-05-15', section: 'Build' },
		{ label: 'Frontend', start: '2026-03-16', end: '2026-05-29', section: 'Build' }
	];

	it('changes nothing until groups is switched on', () => {
		const { container } = render(GanttChart, { props: { tasks: grouped } });
		expect(container.querySelector('.gantt-group-row')).toBeNull();
		expect(container.querySelector('.gantt-bar-label')).toBeNull();
		expect(container.querySelector('.gantt-group-toggle')).toBeNull();
	});

	it('gives every section a header row, in first-appearance order', () => {
		const { container } = render(GanttChart, { props: { tasks: grouped, groups: true } });
		const headers = [...container.querySelectorAll('.gantt-group-toggle')];
		expect(headers.map((el) => el.textContent?.trim())).toEqual(['Discovery', 'Build']);
	});

	// the compact reading is the useful default on a slide; expanding is one click
	it('collapses every group on first render unless told otherwise', () => {
		const { container } = render(GanttChart, { props: { tasks: grouped, groups: true } });
		expect(container.querySelectorAll('.gantt-row.is-collapsed').length).toBe(2);

		const expanded = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: false }
		});
		expect(expanded.container.querySelector('.gantt-row.is-collapsed')).toBeNull();
	});

	it('draws a summary bar on an expanded group header only when asked', () => {
		const bare = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: false }
		});
		expect(bare.container.querySelector('.gantt-group-row .gantt-bar')).toBeNull();
		bare.unmount();

		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: false, summaryBar: true }
		});
		const summaries = container.querySelectorAll('.gantt-group-row .gantt-bar.is-summary');
		expect(summaries.length).toBe(2);
	});

	// a collapsed group is made of its children's own bars, so it never had a
	// roll-up to suppress
	it('leaves a collapsed group untouched by summaryBar', () => {
		const off = render(GanttChart, { props: { tasks: grouped, groups: true } });
		const bars = off.container.querySelectorAll('.gantt-row.is-collapsed .gantt-bar').length;
		expect(bars).toBe(4);
		off.unmount();

		const on = render(GanttChart, { props: { tasks: grouped, groups: true, summaryBar: true } });
		expect(on.container.querySelectorAll('.gantt-row.is-collapsed .gantt-bar').length).toBe(bars);
		expect(on.container.querySelector('.gantt-bar.is-summary')).toBeNull();
	});

	// the gutter reads as an outline when there's a tree, and stays tucked
	// against the axis when there isn't
	it('indents gutter rows by their depth only once grouping is on', () => {
		// the depth var is always emitted; without `has-groups` it is inert, and
		// with no tree every row is at the root anyway
		const flat = render(GanttChart, { props: { tasks: grouped } });
		expect(flat.container.querySelector('.gantt-chart.has-groups')).toBeNull();
		const flatDepths = [...flat.container.querySelectorAll('.gantt-label')].map((el) =>
			(el as HTMLElement).style.getPropertyValue('--gantt-depth').trim()
		);
		expect(new Set(flatDepths)).toEqual(new Set(['0']));
		flat.unmount();

		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: false }
		});
		expect(container.querySelector('.gantt-chart.has-groups')).not.toBeNull();
		const depths = [...container.querySelectorAll('.gantt-label, .gantt-group-label')].map((el) =>
			(el as HTMLElement).style.getPropertyValue('--gantt-depth').trim()
		);
		// header, its two tasks, header, its two tasks
		expect(depths).toEqual(['0', '1', '1', '0', '1', '1']);
	});

	// only a collapsed group subdivides its row; anywhere else the single lane
	// must fill the row, or the bar floats above the label it belongs to
	it('gives a single-lane row a lane that fills it', () => {
		const flat = render(GanttChart, { props: { tasks: grouped, rowHeight: 40 } });
		for (const lane of flat.container.querySelectorAll<HTMLElement>('.gantt-lane')) {
			expect(lane.style.top).toBe('0px');
			expect(lane.style.height).toBe('40px');
		}
		flat.unmount();

		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'], rowHeight: 40, laneHeight: 22 }
		});
		for (const row of container.querySelectorAll('.gantt-row:not(.is-collapsed)')) {
			for (const lane of row.querySelectorAll<HTMLElement>('.gantt-lane')) {
				expect(lane.style.top).toBe('0px');
				expect(lane.style.height).toBe('40px');
			}
		}
		// the collapsed group is the one place lanes are banded
		const banded = [
			...container.querySelectorAll<HTMLElement>('.gantt-row.is-collapsed .gantt-lane')
		];
		expect(banded.map((el) => el.style.height)).toEqual(['22px', '22px']);
		expect(new Set(banded.map((el) => el.style.top)).size).toBe(2);
	});

	// a tall collapsed row reads as a heading over its bars, so its name sits on
	// the first lane rather than floating on the row's centre line
	it('sizes a group label to its first lane, not the whole row', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'], rowHeight: 40, laneHeight: 22 }
		});
		const bands = [...container.querySelectorAll<HTMLElement>('.gantt-group-label')].map((el) => ({
			row: el.style.getPropertyValue('--gantt-row-h').trim(),
			band: el.style.getPropertyValue('--gantt-band-h').trim()
		}));
		// Discovery is expanded (one full-height lane); Build is collapsed onto two
		expect(bands).toEqual([
			{ row: '40px', band: '40px' },
			{ row: '44px', band: '22px' }
		]);
	});

	// a task with no section sits alongside the group headings, so it is marked
	// as a peer of them rather than as a child of one
	it('marks a sectionless task as a root row', () => {
		const mixed: GanttTask[] = [
			...grouped,
			{ label: 'Budget review', start: '2026-02-02', end: '2026-02-27' }
		];
		const { container } = render(GanttChart, { props: { tasks: mixed, groups: true } });
		const roots = [...container.querySelectorAll('.gantt-label.is-root')].map((el) =>
			el.textContent?.trim()
		);
		expect(roots).toEqual(['Budget review']);
		// and it has no disclosure triangle, since there is nothing to expand
		expect(container.querySelector('.gantt-label.is-root .gantt-disclosure')).toBeNull();
	});

	it('keeps the gutter and the plot on the same number of rows', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'] }
		});
		const gutter = container.querySelectorAll('.gantt-label, .gantt-group-label').length;
		expect(gutter).toBe(container.querySelectorAll('.gantt-row').length);
	});

	it('packs a collapsed group onto fewer lanes than it has tasks', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Discovery'] }
		});
		const collapsedRow = container.querySelector('.gantt-row.is-collapsed');
		// Research and Spec don't overlap, so they share one lane
		expect(collapsedRow?.querySelectorAll('.gantt-bar').length).toBe(2);
		expect(collapsedRow?.querySelectorAll('.gantt-lane').length).toBe(2);
		const tops = [...(collapsedRow?.querySelectorAll('.gantt-lane') ?? [])].map(
			(el) => (el as HTMLElement).style.top
		);
		expect(new Set(tops).size).toBe(1);
	});

	it('spends a lane per overlapping task', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'] }
		});
		const tops = [...container.querySelectorAll('.gantt-row.is-collapsed .gantt-lane')].map(
			(el) => (el as HTMLElement).style.top
		);
		expect(new Set(tops).size).toBe(2);
	});

	// what keeps getByText usable: collapsed → on the bar, expanded → in the gutter
	it('shows each task label exactly once in either state', () => {
		const expanded = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: false }
		});
		expect(expanded.getAllByText('Backend')).toHaveLength(1);
		expect(expanded.container.querySelector('.gantt-bar-label')).toBeNull();
		expanded.unmount();

		const collapsed = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: true }
		});
		expect(collapsed.getAllByText('Backend')).toHaveLength(1);
		expect(collapsed.container.querySelectorAll('.gantt-bar-label').length).toBe(4);
	});

	it('hides the legend once groups label themselves, unless asked for it', () => {
		const auto = render(GanttChart, { props: { tasks: grouped, groups: true } });
		expect(auto.container.querySelector('.gantt-legend')).toBeNull();
		auto.unmount();

		const forced = render(GanttChart, { props: { tasks: grouped, groups: true, legend: true } });
		expect(forced.container.querySelector('.gantt-legend')).not.toBeNull();
	});

	it('reports collapsed state through aria-expanded and aria-controls', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'] }
		});
		const toggles = [...container.querySelectorAll('.gantt-group-toggle')];
		expect(toggles.map((el) => el.getAttribute('aria-expanded'))).toEqual(['true', 'false']);
		for (const toggle of toggles) {
			expect(container.querySelector(`#${toggle.getAttribute('aria-controls')}`)).not.toBeNull();
		}
	});

	it('expands a collapsed group when its header is clicked', async () => {
		const { container, getByTitle } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: true }
		});
		expect(container.querySelectorAll('.gantt-row.is-collapsed').length).toBe(2);

		await fireEvent.click(getByTitle('Build'), { detail: 1 });
		expect(container.querySelectorAll('.gantt-row.is-collapsed').length).toBe(1);
		expect(getByTitle('Build').getAttribute('aria-expanded')).toBe('true');
	});

	// reveal binds Space to "next slide" and does not exempt focused buttons
	it('toggles on Space without letting the event reach reveal', async () => {
		const onDocumentKey = vi.fn();
		document.addEventListener('keydown', onDocumentKey);
		const { container, getByTitle } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'] }
		});

		await fireEvent.keyDown(getByTitle('Build'), { key: ' ' });
		expect(container.querySelectorAll('.gantt-row.is-collapsed').length).toBe(0);
		expect(onDocumentKey).not.toHaveBeenCalled();
		document.removeEventListener('keydown', onDocumentKey);
	});

	it('does not toggle twice for a keyboard-synthesized click', async () => {
		const { container, getByTitle } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: ['Build'] }
		});
		await fireEvent.keyDown(getByTitle('Build'), { key: 'Enter' });
		await fireEvent.click(getByTitle('Build'), { detail: 0 });
		expect(getByTitle('Build').getAttribute('aria-expanded')).toBe('true');
	});

	it('gives every bar label an ink colour and a contrast tone', () => {
		const { container } = render(GanttChart, {
			props: { tasks: grouped, groups: true, collapsed: true }
		});
		const tones = ['is-ink-light', 'is-ink-dark', 'is-ink-outside'];
		for (const label of container.querySelectorAll('.gantt-bar-label')) {
			expect((label as HTMLElement).style.color).not.toBe('');
			expect(tones.filter((tone) => label.classList.contains(tone))).toHaveLength(1);
		}
	});

	// a label beside a bar sits on the slide, where gridlines and arrows cross it,
	// so it takes the slide's ink and a background halo rather than the bar's
	it('places the label beside a bar whose colour it cannot measure', () => {
		const unmeasurable: GanttTask[] = [
			{ label: 'Audit', start: '2026-02-02', end: '2026-02-27', section: 'Build', color: 'rebeccapurple' },
			{ label: 'Rollout', start: '2026-05-04', end: '2026-06-30', section: 'Build' }
		];
		const { container } = render(GanttChart, {
			props: { tasks: unmeasurable, groups: true, collapsed: true }
		});
		const audit = [...container.querySelectorAll('.gantt-bar-label')].find(
			(el) => el.textContent?.trim() === 'Audit'
		);
		expect(audit).toBeDefined();
		expect(audit?.classList.contains('is-inside')).toBe(false);
		expect(audit?.classList.contains('is-ink-outside')).toBe(true);
	});

	it('keeps the arrow count stable when a group collapses', () => {
		const linked: GanttTask[] = [
			{ label: 'Design', start: '2026-01-05', end: '2026-01-30', section: 'Discovery' },
			{ label: 'Build', start: '2026-02-02', end: '2026-03-20', section: 'Delivery', dependsOn: 'Design' }
		];
		const expanded = render(GanttChart, { props: { tasks: linked, groups: true } });
		expect(expanded.container.querySelectorAll('.gantt-arrow-line').length).toBe(1);
		expanded.unmount();

		const collapsed = render(GanttChart, {
			props: { tasks: linked, groups: true, collapsed: true }
		});
		expect(collapsed.container.querySelectorAll('.gantt-arrow-line').length).toBe(1);
	});

	it('drops a dependency that collapses inside a single bar', () => {
		const internal: GanttTask[] = [
			{ label: 'A', start: '2026-01-05', end: '2026-01-30', section: 'Build' },
			{ label: 'B', start: '2026-01-06', end: '2026-02-20', section: 'Build', dependsOn: 'A' },
			{ label: 'C', start: '2026-01-07', end: '2026-03-20', section: 'Build', dependsOn: 'A' }
		];
		const { container } = render(GanttChart, {
			props: { tasks: internal, groups: true, collapsed: true, laneHeight: 22 }
		});
		// all three overlap, so they keep separate lanes and both arrows survive
		expect(container.querySelectorAll('.gantt-arrow-line').length).toBe(2);
	});

	// the layout shortens the bar; the DOM has to be drawn from that geometry
	// rather than re-derived from the dates, or the trim never reaches the screen
	it('draws a bar short of the milestone sharing its lane', () => {
		const closing: GanttTask[] = [
			{ label: 'Delivery', start: '2026-01-05', end: '2026-04-04', section: 'Ship' },
			{ label: 'Go-live', start: '2026-04-04', section: 'Ship' }
		];
		const { container } = render(GanttChart, {
			props: { tasks: closing, groups: true, collapsed: true }
		});
		const pctOf = (el: Element, prop: 'left' | 'width') => {
			const match = (el.getAttribute('style') ?? '').match(new RegExp(`${prop}:\\s*([\\d.]+)%`));
			return match ? Number(match[1]) : NaN;
		};
		const bar = container.querySelector('.gantt-bar') as HTMLElement;
		const gate = container.querySelector('.gantt-milestone') as HTMLElement;

		// they share one lane, so the row stays a single lane tall
		expect(container.querySelectorAll('.gantt-row').length).toBe(1);
		// and the bar stops before the diamond's centre instead of running to it
		expect(pctOf(bar, 'left') + pctOf(bar, 'width')).toBeLessThan(pctOf(gate, 'left'));
	});
});

// jsdom has no layout, so nothing here may depend on a measured size — the
// popup's placement is driven entirely by the layout's own px geometry, and
// `plotWidth` falls back to the deterministic width - labelWidth (720).
describe('GanttChart detail popup', () => {
	const detailed: GanttTask[] = [
		{ label: 'Design', start: '2026-01-05', end: '2026-01-30' },
		{
			label: 'Build',
			start: '2026-02-02',
			end: '2026-03-20',
			progress: 40,
			dependsOn: 'Design',
			comment: 'Blocked on\nthe vendor SDK'
		},
		{ label: 'Launch', start: '2026-03-27', dependsOn: 'Build' }
	];

	const bars = (container: Element) => [...container.querySelectorAll('.gantt-bar')];
	const tipOf = (container: Element) => container.querySelector('.gantt-tooltip');

	it('leaves no native tooltip on a bar, while the gutter keeps its ellipsis aid', () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		expect(container.querySelector('.gantt-bar[title], .gantt-milestone[title]')).toBeNull();
		expect(container.querySelector('.gantt-label[title]')).not.toBeNull();
	});

	it('names each bar for assistive tech, since its label is a sibling not a child', () => {
		const { container } = render(GanttChart, { props: { tasks: detailed, locale: 'en' } });
		const label = bars(container)[1].getAttribute('aria-label') ?? '';
		expect(label).toContain('Build');
		expect(label).toContain('40%');
		expect(label).toContain('Depends on Design');
	});

	it('opens on focus, with the dates and the duration', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed, locale: 'en' } });
		expect(tipOf(container)).toBeNull();

		await fireEvent.focus(bars(container)[1]);
		const tip = tipOf(container) as HTMLElement;
		expect(tip.textContent).toContain('Build');
		expect(tip.textContent).toContain('Feb 2, 2026');
		expect(tip.textContent).toContain('Mar 20, 2026');
		expect(tip.textContent).toContain('47 days');
	});

	// it must be a child of the canvas: `.gantt-bar` clips its children, and a
	// positioned overlay inside `.gantt-lane` gets trapped under the arrow SVG
	it('renders exactly one popup, parented to the canvas', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.focus(bars(container)[0]);
		await fireEvent.focus(bars(container)[1]);

		expect(container.querySelectorAll('.gantt-tooltip').length).toBe(1);
		expect(tipOf(container)?.parentElement?.classList.contains('gantt-canvas')).toBe(true);
	});

	it('positions itself in px with one vertical edge pinned and a caret offset', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.focus(bars(container)[1]);
		const style = tipOf(container)?.getAttribute('style') ?? '';

		expect(style).toMatch(/left:\s*[\d.]+px/);
		expect(style).toMatch(/--gantt-tooltip-arrow:\s*[\d.]+px/);
		// exactly one of top/bottom — that is what makes the height irrelevant
		expect(/(^|;)\s*top:/.test(style) !== /(^|;)\s*bottom:/.test(style)).toBe(true);
	});

	it('waits out the hover delay before opening', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		try {
			const { container } = render(GanttChart, { props: { tasks: detailed } });
			await fireEvent.mouseEnter(bars(container)[1]);
			expect(tipOf(container)).toBeNull();

			await vi.advanceTimersByTimeAsync(200);
			expect(tipOf(container)).not.toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	it('pins on click, so the popup survives the pointer leaving the bar', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.click(bars(container)[1], { detail: 1 });
		await fireEvent.mouseLeave(bars(container)[1]);

		expect(tipOf(container)?.classList.contains('is-pinned')).toBe(true);
		expect(bars(container)[1].getAttribute('aria-expanded')).toBe('true');
	});

	it('unpins when the same bar is clicked again', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.click(bars(container)[1], { detail: 1 });
		await fireEvent.click(bars(container)[1], { detail: 1 });
		expect(tipOf(container)).toBeNull();
	});

	it('re-pins to another bar clicked while one is pinned', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed, locale: 'en' } });
		await fireEvent.click(bars(container)[1], { detail: 1 });
		await fireEvent.click(bars(container)[0], { detail: 1 });

		expect(tipOf(container)?.textContent).toContain('Design');
		expect(bars(container)[1].getAttribute('aria-expanded')).toBe('false');
	});

	it('unpins on a click outside the chart', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.click(bars(container)[1], { detail: 1 });
		await fireEvent.mouseDown(document.body);
		expect(tipOf(container)).toBeNull();
	});

	// reveal binds Escape to the slide overview
	it('closes on Escape without letting the event reach reveal', async () => {
		const onDocumentKey = vi.fn();
		document.addEventListener('keydown', onDocumentKey);
		const { container } = render(GanttChart, { props: { tasks: detailed } });

		await fireEvent.click(bars(container)[1], { detail: 1 });
		await fireEvent.keyDown(bars(container)[1], { key: 'Escape' });

		expect(tipOf(container)).toBeNull();
		expect(onDocumentKey).not.toHaveBeenCalled();
		document.removeEventListener('keydown', onDocumentKey);
	});

	it('lets Escape through to reveal when there is nothing to close', async () => {
		const onDocumentKey = vi.fn();
		document.addEventListener('keydown', onDocumentKey);
		const { container } = render(GanttChart, { props: { tasks: detailed } });

		await fireEvent.keyDown(bars(container)[1], { key: 'Escape' });
		expect(onDocumentKey).toHaveBeenCalled();
		document.removeEventListener('keydown', onDocumentKey);
	});

	// reveal binds Space to "next slide" and does not exempt focused buttons
	it('pins on Space without advancing the deck', async () => {
		const onDocumentKey = vi.fn();
		document.addEventListener('keydown', onDocumentKey);
		const { container } = render(GanttChart, { props: { tasks: detailed } });

		await fireEvent.keyDown(bars(container)[1], { key: ' ' });
		expect(tipOf(container)?.classList.contains('is-pinned')).toBe(true);
		expect(onDocumentKey).not.toHaveBeenCalled();
		document.removeEventListener('keydown', onDocumentKey);
	});

	it('does not toggle twice for the click a button synthesizes from Enter', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.keyDown(bars(container)[1], { key: 'Enter' });
		await fireEvent.click(bars(container)[1], { detail: 0 });
		expect(bars(container)[1].getAttribute('aria-expanded')).toBe('true');
	});

	it('keeps the newlines the author wrote in a comment', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed } });
		await fireEvent.focus(bars(container)[1]);
		expect(container.querySelector('.gantt-tooltip-comment')?.textContent).toBe(
			'Blocked on\nthe vendor SDK'
		);
	});

	it('lists dependencies in both directions', async () => {
		const { container } = render(GanttChart, { props: { tasks: detailed, locale: 'en' } });
		await fireEvent.focus(bars(container)[1]);
		const deps = [...container.querySelectorAll('.gantt-tooltip-deps')].map((el) =>
			el.textContent?.replace(/\s+/g, ' ').trim()
		);
		expect(deps).toEqual(['Depends on Design', 'Followed by Launch']);
	});

	// `dependencies` hides the arrows; it does not throw the data away
	it('still lists dependencies when the arrows are switched off', async () => {
		const { container } = render(GanttChart, {
			props: { tasks: detailed, locale: 'en', dependencies: false }
		});
		await fireEvent.focus(bars(container)[1]);
		expect(container.querySelectorAll('.gantt-tooltip-deps').length).toBe(2);
	});

	it('shows a zero progress rather than hiding the bar', async () => {
		const { container } = render(GanttChart, {
			props: { tasks: [{ label: 'Idle', start: '2026-01-05', end: '2026-01-30', progress: 0 }] }
		});
		await fireEvent.focus(bars(container)[0]);
		expect(container.querySelector('.gantt-tooltip-pct')?.textContent).toBe('0%');
	});

	it('gives a group roll-up its section name and no comment', async () => {
		const { container } = render(GanttChart, {
			props: {
				tasks: [
					{ label: 'Research', start: '2026-01-05', end: '2026-01-30', section: 'Discovery' },
					{ label: 'Spec', start: '2026-02-02', end: '2026-02-27', section: 'Discovery' }
				],
				groups: true,
				collapsed: false,
				summaryBar: true
			}
		});
		const roll = container.querySelector('.gantt-bar.is-summary') as HTMLElement;
		await fireEvent.focus(roll);

		expect(container.querySelector('.gantt-tooltip-title')?.textContent).toBe('Discovery');
		expect(container.querySelector('.gantt-tooltip-comment')).toBeNull();
	});

	it('clears a pinned popup when a group toggle rebuilds the layout under it', async () => {
		const { container, getByTitle } = render(GanttChart, {
			props: {
				tasks: [
					{ label: 'Research', start: '2026-01-05', end: '2026-01-30', section: 'Discovery' },
					{ label: 'Spec', start: '2026-02-02', end: '2026-02-27', section: 'Discovery' }
				],
				groups: true,
				collapsed: true
			}
		});
		await fireEvent.click(bars(container)[0], { detail: 1 });
		expect(tipOf(container)).not.toBeNull();

		await fireEvent.click(getByTitle('Discovery'), { detail: 1 });
		expect(tipOf(container)).toBeNull();
	});

	it('gives the bars back as plain divs when the popup is switched off', () => {
		const { container } = render(GanttChart, { props: { tasks: detailed, tooltip: false } });
		expect(container.querySelector('button')).toBeNull();
		expect(container.querySelector('.gantt-tooltip')).toBeNull();
		expect(container.querySelector('.gantt-bar')?.getAttribute('title')).toContain('Design');
	});
});
