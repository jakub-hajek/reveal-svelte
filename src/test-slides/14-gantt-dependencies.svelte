<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		// a milestone as the source: the arrow leaves the diamond's right vertex
		{ id: 'kickoff', label: 'Kickoff', start: '2026-01-05', section: 'Plan' },

		// `dependsOn` referencing an `id`
		{ id: 'spec', label: 'Spec', start: '2026-01-08', end: '2026-01-28', section: 'Plan', progress: 100, dependsOn: 'kickoff' },

		// listed with the Plan rows but scheduled last: the arrow routes upward
		{ id: 'signoff', label: 'Client sign-off', start: '2026-04-24', section: 'Plan', dependsOn: 'uat' },

		// successor starts before the predecessor ends: the arrow elbows around the rows
		{ id: 'api', label: 'API', start: '2026-01-21', end: '2026-03-06', section: 'Build', progress: 70, dependsOn: 'spec' },

		// plain forward dependency: one elbow into the start of the bar
		{ id: 'ui', label: 'UI', start: '2026-02-09', end: '2026-03-20', section: 'Build', progress: 45, dependsOn: 'spec' },

		// an array fans several predecessors in: one arrow per entry
		{ id: 'integration', label: 'Integration', start: '2026-03-23', end: '2026-04-10', section: 'Build', dependsOn: ['api', 'ui'] },

		// no `id` anywhere? reference the task by its `label`
		{ label: 'Hardening', start: '2026-04-06', end: '2026-04-24', section: 'Ship', dependsOn: 'Integration' },

		// a milestone as the target: the arrow stops at the diamond's left vertex
		{ id: 'uat', label: 'UAT complete', start: '2026-04-20', section: 'Ship', dependsOn: 'Hardening' }
	];
</script>

<section>
	<h2>Gantt Chart — Dependencies</h2>
	<GanttChart {tasks} today="2026-03-02" width={1050} rowHeight={38} labelWidth={200} />
	<p class="hint">
		<code>dependsOn</code> takes an <code>id</code> or a <code>label</code> — or an array of them ·
		<code>dependencies=&#123;false&#125;</code> hides the arrows · recolor them with
		<code>--gantt-dependency-color</code>
	</p>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;

		/* the arrows default to the theme's muted color */
		--gantt-dependency-color: var(--ctp-lavender, #888);
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

	.hint code {
		font-size: 0.85em;
		color: var(--ctp-lavender, inherit);
		background: none;
	}
</style>
