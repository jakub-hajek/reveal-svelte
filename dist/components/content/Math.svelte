<script lang="ts">
	import { onMount } from 'svelte';
	import katex from 'katex';
	import 'katex/dist/katex.min.css';

	/**
	 * Math component that renders LaTeX expressions using KaTeX.
	 * Supports both inline and display mode equations with automatic error handling.
	 *
	 * @example
	 * ```svelte
	 * <!-- Inline equation -->
	 * <Math latex="E = mc^2" />
	 *
	 * <!-- Display (block) equation -->
	 * <Math latex="\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" displayMode={true} />
	 *
	 * <!-- Fractions and symbols -->
	 * <Math latex="\frac{a}{b} + \sum_{i=1}^{n} x_i" />
	 *
	 * <!-- Greek letters and matrices -->
	 * <Math latex="\alpha, \beta, \gamma \quad \begin{pmatrix} a & b \\ c & d \end{pmatrix}" />
	 * ```
	 *
	 * @component
	 * @prop {string} latex - The LaTeX expression to render (e.g., "x^2 + y^2 = z^2")
	 * @prop {boolean} [displayMode=false] - If true, renders as block equation (centered); if false, renders inline
	 * @prop {string} [class=''] - Optional CSS class names to apply to the container
	 */
	let {
		latex,
		displayMode = false,
		class: className = ''
	}: {
		latex: string;
		displayMode?: boolean;
		class?: string;
	} = $props();

	let containerElement = $state<HTMLElement | undefined>(undefined);
	let errorMessage = $state('');

	onMount(() => {
		renderMath();
	});

	$effect(() => {
		if (containerElement) {
			renderMath();
		}
	});

	function renderMath() {
		if (!containerElement) return;

		try {
			errorMessage = '';
			katex.render(latex, containerElement, {
				displayMode,
				throwOnError: true,
				strict: 'warn',
				trust: false
			});
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Invalid LaTeX expression';
			containerElement.innerHTML = '';
		}
	}
</script>

{#if errorMessage}
	<div class="math-error {className}" role="alert">
		<strong>LaTeX Error:</strong>
		{errorMessage}
	</div>
{:else}
	<span bind:this={containerElement} class="math-container {className}"></span>
{/if}

<style>
	.math-container {
		color: var(--theme-text);
	}

	.math-error {
		color: var(--theme-chart-4);
		background-color: var(--theme-surface-0);
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		border-left: 3px solid var(--theme-chart-4);
		font-family: monospace;
		font-size: 0.9rem;
	}

	.math-error strong {
		color: var(--theme-chart-5);
	}
</style>
