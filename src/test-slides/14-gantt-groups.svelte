<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		// with `groups`, each `section` becomes a foldable row instead of just a colour
		{ label: 'Průzkum trhu', start: '2026-01-05', end: '2026-01-30', section: 'Příprava', progress: 100 },
		{ label: 'Zadání', start: '2026-02-02', end: '2026-02-27', section: 'Příprava', progress: 100 },

		{ label: 'Architektura', start: '2026-02-09', end: '2026-03-06', section: 'Návrh', progress: 75 },
		{ label: 'UI design', start: '2026-02-23', end: '2026-03-27', section: 'Návrh', progress: 40 },

		// collapsed below: these four pack onto as few lanes as their dates allow,
		// and each carries its own label on its bar
		{ label: 'Backend', start: '2026-03-02', end: '2026-05-15', section: 'Realizace' },
		{ label: 'Frontend', start: '2026-03-16', end: '2026-05-29', section: 'Realizace', progress: 25 },
		{ label: 'API', start: '2026-03-02', end: '2026-04-10', section: 'Realizace' },
		{ label: 'Zámraz', start: '2026-06-01', section: 'Realizace' },

		// back to back, with labels far wider than their bars: they share one lane
		// anyway and truncate, because a label may never cost a task its lane
		{ label: 'Analýza požadavků', start: '2026-03-02', end: '2026-03-27', section: 'Dokumentace' },
		{ label: 'Uživatelská příručka', start: '2026-03-27', end: '2026-04-24', section: 'Dokumentace' },
		{ label: 'Provozní dokumentace', start: '2026-04-24', end: '2026-05-22', section: 'Dokumentace' },

		// a colour the chart can't measure (not hex/rgb) keeps its label beside the bar
		{ label: 'Audit', start: '2026-06-05', end: '2026-06-12', section: 'Nasazení', color: 'rebeccapurple' },
		{ label: 'Go / no-go', start: '2026-06-19', section: 'Nasazení', color: '#f38ba8' },
		// runs to the end of the axis, so its label flips to the left of the bar
		{ label: 'Rollout', start: '2026-06-22', end: '2026-07-10', section: 'Nasazení', progress: 0 }
	];
</script>

<section>
	<h2>Gantt Chart — Collapsible Groups (cs-CZ)</h2>
	<GanttChart
		{tasks}
		groups
		collapsed={['Realizace', 'Dokumentace', 'Nasazení']}
		today="2026-03-15"
		locale="cs-CZ"
		width={1050}
		rowHeight={34}
		labelWidth={200}
	/>
	<p class="hint">Klikněte na název skupiny (nebo Enter / mezerník) pro sbalení a rozbalení.</p>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		/* the new theming hooks */
		--gantt-group-indent: 16px;
		--gantt-disclosure-color: var(--ctp-lavender);
	}

	h2 {
		color: var(--ctp-text);
		font-size: 2rem;
		margin: 0;
	}

	.hint {
		color: var(--ctp-subtext0, #a6adc8);
		font-size: 1rem;
		margin: 0;
	}
</style>
