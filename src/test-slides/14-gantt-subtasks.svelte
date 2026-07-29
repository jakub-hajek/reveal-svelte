<script lang="ts">
	import { GanttChart } from 'reveal-svelte';
	import type { GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		// `duration` is a unitless weight, not a real span — it only sets each
		// segment's share of the bar's width. 1 / 3 / 1 splits the bar 20% / 60% / 20%.
		{
			label: 'Backend',
			start: '2026-02-02',
			end: '2026-03-20',
			section: 'Realizace',
			subtasks: [
				{ description: 'API návrh', duration: 1 },
				{ description: 'Implementace', duration: 3 },
				{ description: 'Testy', duration: 1 }
			]
		},
		{
			label: 'Frontend',
			start: '2026-03-02',
			end: '2026-04-24',
			section: 'Realizace',
			subtasks: [
				{ description: 'Prototyp', duration: 1 },
				{ description: 'Sestavení', duration: 2 }
			]
		},

		// subtasks are hidden while a group is collapsed — expand "Nasazení" to see
		// this bar split into segments
		{
			label: 'Rollout',
			start: '2026-05-04',
			end: '2026-06-12',
			section: 'Nasazení',
			subtasks: [
				{ description: 'Staging', duration: 1 },
				{ description: 'Produkce', duration: 1 }
			]
		}
	];
</script>

<section>
	<h2>Gantt Chart — Subtasks</h2>
	<GanttChart
		{tasks}
		groups
		collapsed={['Nasazení']}
		locale="cs-CZ"
		width={1050}
		rowHeight={40}
		labelWidth={200}
	/>
	<p class="hint">
		Realizace je rozbalená, takže její úkoly ukazují segmenty podúkolů. Rozbalte
		Nasazení a segmenty se objeví i tam.
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
		color: var(--ctp-subtext0, #a6adc8);
		font-size: 1rem;
		margin: 0;
	}
</style>
