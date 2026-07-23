<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		{ label: 'Discovery', start: '2026-01-05', end: '2026-01-23', section: 'Research', progress: 100 },
		{ label: 'User interviews', start: '2026-01-19', end: '2026-02-06', section: 'Research', progress: 100 },
		{ label: 'Wireframes', start: '2026-02-02', end: '2026-02-27', section: 'Design', progress: 80 },
		{ label: 'Visual design', start: '2026-02-23', end: '2026-03-20', section: 'Design', progress: 45 },
		{ label: 'API + backend', start: '2026-03-02', end: '2026-04-24', section: 'Build', progress: 30 },
		{ label: 'Frontend', start: '2026-03-16', end: '2026-05-08', section: 'Build', progress: 15 },
		{ label: 'Beta release', start: '2026-05-15', section: 'Build' },
		{ label: 'QA + hardening', start: '2026-05-11', end: '2026-06-05', section: 'Launch' },
		{ label: 'Go live', start: '2026-06-12', section: 'Launch' }
	];
</script>

<section>
	<h2>Gantt Chart Example</h2>
	<GanttChart {tasks} today="2026-03-10" width={1000} rowHeight={40} />
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
