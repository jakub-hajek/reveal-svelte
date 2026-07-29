<script lang="ts">
	// biome-ignore assist/source/organizeImports: keep grouped imports for Svelte
	// biome-ignore lint/correctness/noUnusedImports: referenced in Svelte markup
	import { MarkdownSlide, RevealWrapper, createSlideEntries } from '../lib/index.js';
	import type { RevealConfig } from '../lib/index.js';
	import type { SlideModule } from '../lib/types/slides.js';

	const slideModules = import.meta.glob<SlideModule>('/src/test-slides/*.svelte', { eager: true });
	const markdownModules = import.meta.glob<string>('/src/test-slides/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	});

	// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
	const slideEntries = createSlideEntries({ slideModules, markdownModules });
	// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
	const config: RevealConfig = {
		footer: {
			presentationName: 'Svelte Reveal.js Starter Kit',
			authorName: 'Kuba Zamek'
		},
		themeToggle: {}
	};
</script>

<RevealWrapper {config}>
	{#each slideEntries as slide (slide.id)}
		{#if slide.type === 'component'}
			<svelte:component this={slide.component} />
		{:else}
			<MarkdownSlide id={slide.id} sourcePath={slide.sourcePath} content={slide.markdown} />
		{/if}
	{/each}
</RevealWrapper>
