<script lang="ts">
	import {
		BarChart,
		BaseSlide,
		Code,
		FullImageLayout,
		GridLayout,
		LineChart,
		Markdown,
		Math as MathComponent,
		PieChart,
		Table,
		TitleSlide,
		TwoColumnLayout
	} from 'reveal-svelte';
	import type { ChartData } from 'reveal-svelte';
	import type { TableColumn } from 'reveal-svelte';

	const barData: ChartData = {
		labels: ['Q1', 'Q2', 'Q3', 'Q4'],
		datasets: [
			{
				label: 'Revenue',
				data: [12, 19, 15, 25]
			}
		]
	};

	const lineData: ChartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
		datasets: [
			{
				label: 'Users',
				data: [10, 14, 18, 17, 24]
			}
		]
	};

	const pieData: ChartData = {
		labels: ['A', 'B', 'C'],
		datasets: [
			{
				label: 'Share',
				data: [55, 30, 15]
			}
		]
	};

	type Person = { name: string; role: string; score: number };
	const people: Person[] = [
		{ name: 'Alice', role: 'PM', score: 92 },
		{ name: 'Bob', role: 'Eng', score: 87 },
		{ name: 'Casey', role: 'Design', score: 95 }
	];
	const columns: TableColumn<Person>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'role', header: 'Role', sortable: true },
		{ key: 'score', header: 'Score', sortable: true, align: 'right' }
	];

	const md = `# Starter Kit

- Components are type-safe
- Slides auto-discover from \`src/slides/*.svelte\`
- Theme uses Catppuccin CSS variables

Try: **Markdown**, *Math*, charts, tables, and code.`;

	const snippet = `type Point = { x: number; y: number };

export function slope(a: Point, b: Point): number {
	return (b.y - a.y) / (b.x - a.x);
}`;

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
	<defs>
		<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#1e1e2e"/>
			<stop offset="1" stop-color="#45475a"/>
		</linearGradient>
	</defs>
	<rect width="1600" height="900" fill="url(#g)"/>
	<circle cx="1320" cy="220" r="180" fill="#cba6f7" fill-opacity="0.22"/>
	<circle cx="260" cy="680" r="240" fill="#89b4fa" fill-opacity="0.18"/>
	<text x="90" y="140" font-family="system-ui, sans-serif" font-size="72" fill="#cdd6f4" opacity="0.9">Showcase</text>
	<text x="90" y="220" font-family="system-ui, sans-serif" font-size="34" fill="#a6adc8" opacity="0.9">FullImageLayout background</text>
</svg>`;
	const imageUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

	// Keep local values referenced for tooling that doesn't track template usage.
	void BarChart;
	void BaseSlide;
	void Code;
	void FullImageLayout;
	void GridLayout;
	void LineChart;
	void Markdown;
	void MathComponent;
	void PieChart;
	void Table;
	void TitleSlide;
	void TwoColumnLayout;
	void barData;
	void lineData;
	void pieData;
	void people;
	void columns;
	void md;
	void snippet;
	void imageUrl;
</script>

<TitleSlide
	title="Component Showcase"
	subtitle="Layouts, charts, and rich content examples"
	author="Zamek"
	date=""
/>

<TwoColumnLayout splitRatio="1.2fr 0.8fr">
	{#snippet left()}
		<Markdown content={md} />
	{/snippet}
	{#snippet right()}
		<BarChart data={barData} width={420} height={260} />
	{/snippet}
</TwoColumnLayout>

<BaseSlide transition="fade">
	<h2>Charts</h2>
	<div class="charts">
		<BarChart data={barData} width={300} height={220} />
		<LineChart data={lineData} width={300} height={220} />
		<PieChart data={pieData} width={300} height={220} />
	</div>
</BaseSlide>

<FullImageLayout {imageUrl} overlayPosition="bottom" darken={0.35}>
	{#snippet overlay()}
		<div class="overlay">
			<h2>Math</h2>
			<p>
				Gaussian integral: <MathComponent
					latex={String.raw`\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`}
				/>
			</p>
			<p>
				Inline: <MathComponent latex={String.raw`E = mc^2`} />
			</p>
		</div>
	{/snippet}
</FullImageLayout>

<BaseSlide transition="zoom">
	<h2>Table + Code</h2>
	<div class="content-grid">
		<div class="panel">
			<Table {columns} data={people} striped bordered />
		</div>
		<div class="panel">
			<Code
				filename="utils.ts"
				language="typescript"
				lineNumbers
				highlightLines={[3, 4]}
				maxHeight="360px"
				code={snippet}
			/>
		</div>
	</div>
</BaseSlide>

<GridLayout
	items={[
		{ id: '1', content: 'Layouts: TwoColumnLayout, FullImageLayout, GridLayout' },
		{ id: '2', content: 'Charts: BarChart, LineChart, PieChart' },
		{ id: '3', content: 'Content: Markdown, Math, Table, Code' }
	]}
	columns={3}
	gap="1.25rem"
/>

<style>
	.charts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.25rem;
		align-items: center;
		justify-items: center;
		width: 100%;
		max-width: 62rem;
		margin-top: 1rem;
	}

	.overlay {
		max-width: 46rem;
		padding: 1.25rem 1.5rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--ctp-crust) 78%, transparent);
		border: 1px solid var(--ctp-surface1);
	}

	.overlay h2 {
		margin: 0 0 0.75rem 0;
	}

	.overlay p {
		margin: 0.5rem 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		width: 100%;
		max-width: 70rem;
		align-items: start;
	}

	.panel {
		background: var(--ctp-surface0);
		border: 1px solid var(--ctp-surface1);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	@media (max-width: 900px) {
		.charts {
			grid-template-columns: 1fr;
			max-width: 30rem;
		}

		.content-grid {
			grid-template-columns: 1fr;
			max-width: 36rem;
		}
	}
</style>
