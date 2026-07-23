<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		// `section` groups tasks: one theme color per section + a legend entry
		{ label: 'Market research', start: '2026-01-05', end: '2026-01-30', section: 'Discovery', progress: 100 },
		{ label: 'Requirements', start: '2026-01-26', end: '2026-02-13', section: 'Discovery', progress: 100 },

		// `progress` (0–100): solid fill over a translucent track
		{ label: 'Architecture', start: '2026-02-09', end: '2026-03-06', section: 'Design', progress: 75 },
		{ label: 'UI design', start: '2026-02-23', end: '2026-03-27', section: 'Design', progress: 40 },

		// no `progress` = plain solid bar
		{ label: 'Backend', start: '2026-03-09', end: '2026-05-15', section: 'Build' },
		{ label: 'Frontend', start: '2026-03-23', end: '2026-05-29', section: 'Build' },

		// no `end` = milestone (diamond)
		{ label: 'Feature freeze', start: '2026-06-01', section: 'Build' },

		// `milestone: true` forces a diamond even when `end` is set
		{ label: 'Security audit', start: '2026-06-05', end: '2026-06-05', section: 'Release', milestone: true },

		// `color` overrides the section color for one task
		{ label: 'Go / no-go', start: '2026-06-19', section: 'Release', color: '#f38ba8' },
		{ label: 'Rollout', start: '2026-06-22', end: '2026-07-10', section: 'Release', progress: 0 }
	];
</script>

<section>
	<h2>Gantt Chart — Sections &amp; Milestones (cs-CZ)</h2>
	<GanttChart
		{tasks}
		today="2026-03-15"
		locale="cs-CZ"
		width={1050}
		rowHeight={38}
		labelWidth={200}
	/>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;
	}

	h2 {
		color: var(--ctp-text);
		font-size: 2rem;
		margin: 0;
	}
</style>
