<script lang="ts">
	import { BaseSlide, Math as MathComponent } from 'reveal-svelte';

	const quadratic = String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`;
	const gaussian = String.raw`\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`;
	const summation = String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`;
	const matrix = String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}`;

	// Keep local values referenced for tooling that doesn't track template usage.
	void BaseSlide;
	void MathComponent;
	void quadratic;
	void gaussian;
	void summation;
	void matrix;
</script>

<BaseSlide>
	<h2>Math Playground</h2>

	<div class="grid">
		<div class="card">
			<h3>Inline</h3>
			<p>Quadratic: <MathComponent latex={quadratic} /></p>
			<p>Summation: <MathComponent latex={summation} /></p>
		</div>

		<div class="card">
			<h3>Display</h3>
			<MathComponent latex={gaussian} displayMode />
		</div>

		<div class="card">
			<h3>Matrix</h3>
			<MathComponent latex={matrix} displayMode />
		</div>
	</div>
</BaseSlide>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.25rem;
		width: 100%;
		max-width: 56rem;
	}

	.card {
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		background: var(--catppuccin-surface0);
		border: 1px solid var(--catppuccin-surface1);
	}

	.card h3 {
		margin: 0 0 0.75rem 0;
		color: var(--catppuccin-subtext0);
		font-size: 1.1em;
		font-weight: 600;
	}

	.card p {
		margin: 0.5rem 0;
		line-height: 1.35;
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
			max-width: 36rem;
		}
	}
</style>
