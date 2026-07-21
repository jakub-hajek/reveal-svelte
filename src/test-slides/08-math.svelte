<script lang="ts">
	import { Math } from 'reveal-svelte';

	const quadratic = String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`;
	const gaussian = String.raw`\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`;
	const summation = String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`;
	const matrix = String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}`;
</script>

<section>
	<h2>Mathematical Expressions</h2>

	<div class="content">
		<div class="example">
			<h3>Inline Equations</h3>
			<p>
				Einstein's famous equation: <Math latex="E = mc^2" />
			</p>
			<p>
				The quadratic formula: <Math latex={quadratic} />
			</p>
		</div>

		<div class="example">
			<h3>Display Equations</h3>
			<Math latex={gaussian} displayMode={true} />
			<Math latex={summation} displayMode={true} />
		</div>

		<div class="example">
			<h3>Matrices</h3>
			<Math latex={matrix} displayMode={true} />
		</div>
	</div>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		gap: 1rem;
	}

	h2 {
		color: var(--ctp-text);
		font-size: 2rem;
		margin: 0;
		text-align: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.example {
		background-color: var(--ctp-surface0);
		padding: 1.5rem;
		border-radius: 0.5rem;
		border-left: 4px solid var(--ctp-mauve);
	}

	h3 {
		color: var(--ctp-mauve);
		font-size: 1.3rem;
		margin: 0 0 1rem 0;
	}

	p {
		color: var(--ctp-text);
		font-size: 1.1rem;
		margin: 0.5rem 0;
		line-height: 1.8;
	}
</style>
