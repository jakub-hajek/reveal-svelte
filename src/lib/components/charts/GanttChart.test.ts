import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
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
