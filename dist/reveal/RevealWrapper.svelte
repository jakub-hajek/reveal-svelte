<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type Reveal from 'reveal.js';
	import { defaultConfig } from './config.js';
	import { autoFitSlides } from './autofit.js';
	import type { RevealConfig } from '../types/reveal.js';

	import SlideFooter from '../components/slides/SlideFooter.svelte';
	import LogoOverlay from '../components/LogoOverlay.svelte';

	export interface Props {
		config?: RevealConfig;
		class?: string;
		children?: Snippet;
	}

	let { config = {}, class: className = '', children }: Props = $props();

	const footerConfig = (() => config.footer)();
	if (footerConfig) {
		setContext('footerConfig', footerConfig);
	}

	const logoConfig = (() => config.logo)();

	let revealInstance: Reveal.Api | null = null;
	let revealElement: HTMLDivElement;

	function runAutoFit() {
		if (revealElement) {
			requestAnimationFrame(() => autoFitSlides(revealElement));
		}
	}

	onMount(async () => {
		if (typeof window === 'undefined') return;

		const [RevealModule, ZoomModule, NotesModule] = await Promise.all([
			import('reveal.js'),
			import('reveal.js/plugin/zoom/zoom.esm.js'),
			import('reveal.js/plugin/notes/notes.esm.js')
		]);
		const RevealClass = RevealModule.default;
		const RevealZoom = ZoomModule.default;
		const RevealNotes = NotesModule.default;

		revealInstance = new RevealClass(revealElement, {
			...defaultConfig,
			...config,
			plugins: [RevealZoom, RevealNotes, ...(config.plugins ?? [])]
		});

		await revealInstance.initialize();

		// Expose globally for PDF export tooling (?print-pdf)
		(window as any).Reveal = revealInstance;

		runAutoFit();
		revealInstance.on('slidechanged', runAutoFit);
		revealInstance.on('resize', runAutoFit);
		window.addEventListener('resize', runAutoFit);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', runAutoFit);
		}
		if (revealInstance) {
			revealInstance.off('slidechanged', runAutoFit);
			revealInstance.off('resize', runAutoFit);
			revealInstance.destroy();
			revealInstance = null;
		}
	});
</script>

<div class="reveal-container {className}">
	<div class="reveal" bind:this={revealElement}>
		<div class="slides">
			{@render children?.()}
		</div>
	</div>
	{#if footerConfig}
		<SlideFooter {...footerConfig} />
	{/if}
	{#if logoConfig}
		<LogoOverlay config={logoConfig} />
	{/if}
</div>

<style>
	.reveal-container {
		height: 100dvh;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	@supports (height: 100dvh) {
		.reveal-container {
			height: 100dvh;
		}
	}
	/* In print-pdf mode, reveal.js stacks all slides vertically — remove viewport constraint */
	:global(html.print-pdf) .reveal-container {
		height: auto;
	}
	/* The footer is a flex sibling of .reveal, so with height:auto it stacks below every
	   stacked slide and spills onto a trailing blank page. */
	:global(html.print-pdf) .reveal-container :global(.slide-footer) {
		display: none;
	}
	.reveal {
		flex: 1;
		min-height: 0;
	}
</style>
