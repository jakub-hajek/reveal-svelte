<script lang="ts">
	import { BarChart } from 'reveal-svelte';

	const chartData = {
		labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
		datasets: [
			{
				label: 'Revenue',
				data: [12, 19, 15, 22]
			},
			{
				label: 'Expenses',
				data: [8, 11, 9, 13]
			}
		]
	};
</script>

<section>
	<h2>Bar Chart Example</h2>
	<BarChart data={chartData} width={800} height={450} />
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
