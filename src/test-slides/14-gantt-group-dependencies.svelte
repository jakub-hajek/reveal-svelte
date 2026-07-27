<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		// --- Plan stays expanded, so its rows are ordinary ones -------------------
		{ id: 'kickoff', label: 'Kickoff', start: '2026-01-05', section: 'Plan' },
		{ id: 'spec', label: 'Spec', start: '2026-01-06', end: '2026-02-06', section: 'Plan', progress: 100, dependsOn: 'kickoff' },

		// no `section` at all: stays a top-level row, and the legend calls it "Other"
		{ label: 'Budget review', start: '2026-03-02', end: '2026-03-13' },

		// --- Build collapses: API and UI overlap, so they take separate lanes -----
		// arrows from an expanded row still find the exact bar they point at
		{ id: 'api', label: 'API', start: '2026-02-09', end: '2026-03-20', section: 'Build', progress: 80, dependsOn: 'spec' },
		{ id: 'ui', label: 'UI', start: '2026-02-09', end: '2026-03-27', section: 'Build', progress: 60, dependsOn: 'spec' },

		// API and Integration land on the *same* lane, so that arrow is dropped —
		// they already read as sequential. UI sits on another lane, so its arrow stays
		{ id: 'integration', label: 'Integration', start: '2026-03-30', end: '2026-04-17', section: 'Build', dependsOn: ['api', 'ui'] },

		// same lane again as Integration: the arrow between them disappears too
		{ id: 'docs', label: 'Docs', start: '2026-04-20', end: '2026-05-01', section: 'Build', dependsOn: 'integration' },

		// --- Ship collapses too --------------------------------------------------
		// two predecessors that both sit on Build's lane 0 collapse to ONE arrow
		{ id: 'hardening', label: 'Hardening', start: '2026-05-04', end: '2026-05-22', section: 'Ship', dependsOn: ['integration', 'docs'] },

		// shares Hardening's lane, so this arrow is dropped as well.
		// Kept short on purpose: a connector leaving a bar runs at the same height
		// as a label placed beside it, so long labels here collect crossing lines
		{ id: 'uat', label: 'UAT', start: '2026-05-29', section: 'Ship', dependsOn: 'hardening' },

		// pushed onto its own lane by UAT, so this arrow survives
		{ label: 'Launch', start: '2026-06-12', section: 'Ship', dependsOn: 'uat' }
	];
</script>

<section>
	<h2>Gantt Chart — Dependencies Across Collapsed Groups</h2>
	<GanttChart
		{tasks}
		groups
		collapsed={['Build', 'Ship']}
		legend
		today="2026-03-20"
		width={1050}
		rowHeight={38}
		laneHeight={24}
		barLabelSize={11}
		labelWidth={200}
	/>
	<p class="hint">
		10 <code>dependsOn</code> edges, 6 arrows: 3 vanish between tasks that share a lane, and 2 that
		ended on the same pair of bars merge into 1. Expand a group to get them all back.
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
		--gantt-dependency-color: var(--ctp-lavender);
	}

	h2 {
		color: var(--ctp-text);
		font-size: 2rem;
		margin: 0;
	}

	.hint {
		color: var(--ctp-subtext0, #a6adc8);
		font-size: 0.95rem;
		max-width: 60rem;
		text-align: center;
		margin: 0;
	}

	.hint code {
		font-size: 0.9em;
	}
</style>
