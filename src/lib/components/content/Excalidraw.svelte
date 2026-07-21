<script lang="ts">
	const browser = typeof window !== 'undefined';

	let {
		src,
		elements,
		appState,
		files,
		width,
		height,
		exportPadding,
		handDrawn = true,
		class: className = ''
	}: {
		src?: Record<string, unknown>;
		elements?: unknown[];
		appState?: Record<string, unknown>;
		files?: Record<string, unknown>;
		width?: string;
		height?: string;
		exportPadding?: number;
		handDrawn?: boolean;
		class?: string;
	} = $props();

	let containerElement = $state<HTMLElement | undefined>(undefined);
	let errorMessage = $state('');
	let loading = $state(true);

	function applyHandDrawn(els: unknown[]): unknown[] {
		const VIRGIL = 1;
		return els.map((el) => {
			const e = el as Record<string, unknown>;
			return {
				...e,
				roughness: 1,
				...(typeof e.fontFamily === 'number' ? { fontFamily: VIRGIL } : {})
			};
		});
	}

	$effect(() => {
		const rawElements = src?.elements ?? elements;
		const diagramAppState = src?.appState ?? appState;
		const diagramFiles = src?.files ?? files;

		if (!browser || !containerElement || !rawElements) return;

		const diagramElements = handDrawn ? applyHandDrawn(rawElements as unknown[]) : rawElements;

		loading = true;
		errorMessage = '';

		import('@excalidraw/utils')
			.then(({ exportToSvg }) => {
				const opts: Record<string, unknown> = {
					elements: diagramElements,
					appState: diagramAppState ?? {},
					files: diagramFiles ?? null
				};
				if (exportPadding !== undefined) {
					opts.exportPadding = exportPadding;
				}
				return Promise.resolve(exportToSvg(opts as Parameters<typeof exportToSvg>[0]));
			})
			.then((svg: SVGSVGElement) => {
				if (width) svg.setAttribute('width', width);
				if (height) svg.setAttribute('height', height);
				if (containerElement) {
					containerElement.innerHTML = '';
					containerElement.appendChild(svg);
				}
				loading = false;
			})
			.catch((err: unknown) => {
				errorMessage = err instanceof Error ? err.message : 'Failed to render Excalidraw diagram';
				loading = false;
			});
	});
</script>

{#if errorMessage}
	<div class="excalidraw-error {className}" role="alert">
		<strong>Excalidraw Error:</strong>
		{errorMessage}
	</div>
{:else}
	<div bind:this={containerElement} class="excalidraw-container {className}" class:loading></div>
{/if}

<style>
	.excalidraw-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.excalidraw-container.loading {
		opacity: 0.5;
	}

	.excalidraw-container :global(svg) {
		max-width: 100%;
		max-height: 100%;
	}

	.excalidraw-error {
		color: var(--theme-chart-4);
		background-color: var(--theme-surface-0);
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		border-left: 3px solid var(--theme-chart-4);
		font-family: monospace;
		font-size: 0.9rem;
	}

	.excalidraw-error strong {
		color: var(--theme-chart-5);
	}
</style>
