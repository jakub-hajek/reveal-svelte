<script lang="ts">
	import { PieChart } from 'reveal-svelte';

	const chartData = {
		labels: ['React', 'Vue', 'Angular', 'Svelte', 'Other'],
		datasets: [
			{
				label: 'Framework Usage',
				data: [35, 25, 20, 15, 5]
			}
		]
	};
</script>

<section>
	<h2>Pie Chart Example</h2>
	<PieChart data={chartData} width={600} height={450} />
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
