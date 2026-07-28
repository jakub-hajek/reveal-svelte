<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttMarker, GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		{ label: 'Discovery', start: '2026-01-05', end: '2026-01-23', section: 'Research', progress: 100, comment: 'Ten stakeholder sessions, all written up in the research wiki.' },
		{ label: 'User interviews', start: '2026-01-19', end: '2026-02-06', section: 'Research', progress: 100, dependsOn: 'Discovery' },
		{ label: 'Wireframes', start: '2026-02-02', end: '2026-02-27', section: 'Design', progress: 80, dependsOn: 'User interviews' },
		{ label: 'Visual design', start: '2026-02-23', end: '2026-03-20', section: 'Design', progress: 45, dependsOn: 'Wireframes', comment: 'Waiting on the brand refresh before the final pass.\nColour tokens are provisional.' },
		{ label: 'API + backend', start: '2026-03-02', end: '2026-04-24', section: 'Build', progress: 30, dependsOn: 'Wireframes', comment: 'Blocked on the vendor SDK landing.\nOwner: platform team. Slipping this moves Go live.' },
		{ label: 'Frontend', start: '2026-03-16', end: '2026-05-08', section: 'Build', progress: 15, dependsOn: 'Visual design' },
		{ label: 'Beta release', start: '2026-05-15', section: 'Build', dependsOn: ['Frontend', 'API + backend'], comment: 'Invite-only, capped at 200 accounts.' },
		{ label: 'QA + hardening', start: '2026-05-11', end: '2026-06-05', section: 'Launch', dependsOn: 'Frontend' },
		{ label: 'Go live', start: '2026-06-12', section: 'Launch', dependsOn: ['QA + hardening', 'Beta release'] }
	];

	const markers: GanttMarker[] = [
		{ date: '2026-01-05', label: 'Kickoff' },
		{ date: '2026-05-15', label: 'Code freeze', color: 'var(--theme-primary)', style: 'solid' }
	];
</script>

<section>
	<h2>Gantt Chart Example</h2>
	<GanttChart {tasks} today="2026-03-10" {markers} width={1000} rowHeight={40} />
	<p class="hint">
		Hover a bar for details · click to pin it open · <kbd>Esc</kbd> to close · four tasks carry a
		<code>comment</code> · two <code>markers</code> beside the <code>today</code> line
	</p>
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

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--ctp-subtext0, #888);
	}

	.hint code,
	.hint kbd {
		font-size: 0.85em;
		color: var(--ctp-lavender, inherit);
		background: none;
	}
</style>
