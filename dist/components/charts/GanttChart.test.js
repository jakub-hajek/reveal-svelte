import { fireEvent, render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import GanttChart from './GanttChart.svelte';
const tasks = [
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
        const mixed = [
            { label: 'A', start: '2026-01-01', end: '2026-02-01', section: 'Fáze 1' },
            { label: 'B', start: '2026-02-01', end: '2026-03-01' }
        ];
        const { getByText } = render(GanttChart, { props: { tasks: mixed, locale: 'cs-CZ' } });
        expect(getByText('Ostatní')).toBeInTheDocument();
    });
    it('accepts a custom label for the unnamed section', () => {
        const mixed = [
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
        const linked = [
            { label: 'Design', start: '2026-01-05', end: '2026-01-30' },
            { label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'Design' },
            { label: 'Launch', start: '2026-03-27', dependsOn: ['Design', 'Build'] }
        ];
        const { container } = render(GanttChart, { props: { tasks: linked } });
        expect(container.querySelectorAll('.gantt-arrow-line').length).toBe(3);
        expect(container.querySelectorAll('.gantt-arrow-head').length).toBe(3);
    });
    it('resolves dependencies by id when one is set', () => {
        const linked = [
            { id: 'a', label: 'Design', start: '2026-01-05', end: '2026-01-30' },
            { id: 'b', label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'a' }
        ];
        const { container } = render(GanttChart, { props: { tasks: linked } });
        expect(container.querySelectorAll('.gantt-arrow-line').length).toBe(1);
    });
    it('ignores unknown and self references', () => {
        const linked = [
            { label: 'Design', start: '2026-01-05', end: '2026-01-30', dependsOn: 'Design' },
            { label: 'Build', start: '2026-02-02', end: '2026-03-20', dependsOn: 'Nope' }
        ];
        const { container } = render(GanttChart, { props: { tasks: linked } });
        expect(container.querySelector('.gantt-arrows')).toBeNull();
    });
    it('hides arrows when dependencies is false', () => {
        const linked = [
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
    const grouped = [
        { label: 'Research', start: '2026-01-05', end: '2026-01-30', section: 'Discovery' },
        { label: 'Spec', start: '2026-02-02', end: '2026-02-27', section: 'Discovery' },
        { label: 'Backend', start: '2026-03-02', end: '2026-05-15', section: 'Build' },
        { label: 'Frontend', start: '2026-03-16', end: '2026-05-29', section: 'Build' }
    ];
    it('changes nothing until groups is switched on', () => {
        const { container } = render(GanttChart, { props: { tasks: grouped } });
        expect(container.querySelector('.gantt-group-row')).toBeNull();
        expect(container.querySelector('.gantt-bar-label')).toBeNull();
        expect(container.querySelector('button')).toBeNull();
    });
    it('gives every section a header row, in first-appearance order', () => {
        const { container } = render(GanttChart, { props: { tasks: grouped, groups: true } });
        const headers = [...container.querySelectorAll('.gantt-group-toggle')];
        expect(headers.map((el) => el.textContent?.trim())).toEqual(['Discovery', 'Build']);
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
        const tops = [...(collapsedRow?.querySelectorAll('.gantt-lane') ?? [])].map((el) => el.style.top);
        expect(new Set(tops).size).toBe(1);
    });
    it('spends a lane per overlapping task', () => {
        const { container } = render(GanttChart, {
            props: { tasks: grouped, groups: true, collapsed: ['Build'] }
        });
        const tops = [...container.querySelectorAll('.gantt-row.is-collapsed .gantt-lane')].map((el) => el.style.top);
        expect(new Set(tops).size).toBe(2);
    });
    // what keeps getByText usable: collapsed → on the bar, expanded → in the gutter
    it('shows each task label exactly once in either state', () => {
        const expanded = render(GanttChart, { props: { tasks: grouped, groups: true } });
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
        for (const label of container.querySelectorAll('.gantt-bar-label')) {
            expect(label.style.color).not.toBe('');
            expect(label.classList.contains('is-ink-light') || label.classList.contains('is-ink-dark'))
                .toBe(true);
        }
    });
    it('keeps text off a bar whose colour it cannot measure', () => {
        const unmeasurable = [
            { label: 'Audit', start: '2026-01-05', end: '2026-06-30', section: 'Build', color: 'rebeccapurple' }
        ];
        const { container } = render(GanttChart, {
            props: { tasks: unmeasurable, groups: true, collapsed: true }
        });
        expect(container.querySelector('.gantt-bar-label.is-inside')).toBeNull();
    });
    it('keeps the arrow count stable when a group collapses', () => {
        const linked = [
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
        const internal = [
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
});
