<script lang="ts">
	import { LineChart } from 'reveal-svelte';

	const chartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		datasets: [
			{
				label: 'Temperature (°C)',
				data: [5, 7, 12, 18, 23, 28, 31, 30, 25, 18, 11, 6]
			},
			{
				label: 'Precipitation (mm)',
				data: [65, 55, 70, 60, 50, 40, 30, 35, 45, 60, 75, 70]
			}
		]
	};
</script>

<section>
	<h2>Line Chart Example</h2>
	<LineChart data={chartData} width={800} height={450} />
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
