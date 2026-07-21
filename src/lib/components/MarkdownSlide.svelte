<script lang="ts">
	// biome-ignore lint/correctness/noUnusedImports: referenced in Svelte markup
	import BaseSlide from './slides/BaseSlide.svelte';
	import type { FooterConfig } from '../types/slides.js';
	import { renderMarkdown } from '../utils/markdown';

	interface Props {
		/** Optional identifier used for error reporting. */
		id?: string;
		/** Optional source path used for error reporting. */
		sourcePath?: string;
		content: string;
		sanitize?: boolean;
		class?: string;

		// BaseSlide pass-through
		background?: string;
		transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
		dataAutoAnimate?: boolean;
		footerConfig?: FooterConfig;
	}

	// biome-ignore lint/style/useConst: props destructuring stays reactive
	let {
		id = undefined,
		sourcePath = undefined,
		content,
		sanitize = true,
		// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
		class: className = '',
		// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
		background = undefined,
		// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
		transition = undefined,
		// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
		dataAutoAnimate = false,
		// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
		footerConfig = undefined
	}: Props = $props();

	function escapeHtml(value: string) {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	// biome-ignore lint/correctness/noUnusedVariables: referenced in Svelte markup
	let htmlContent = $state('');

	$effect(() => {
		const currentContent = content;
		const currentSanitize = sanitize;
		void updateHtml(currentContent, currentSanitize);
	});

	async function updateHtml(markdown: string, shouldSanitize: boolean) {
		try {
			htmlContent = await renderMarkdown(markdown, { sanitize: shouldSanitize });
		} catch (error) {
			const label = sourcePath ?? id ?? 'unknown';
			const message = error instanceof Error ? error.message : String(error);
			console.error('MarkdownSlide rendering error:', error);
			htmlContent =
				'<div class="markdown-slide__error">' +
				`<p>Failed to render markdown slide: <code>${escapeHtml(label)}</code></p>` +
				`<pre>${escapeHtml(message)}</pre>` +
				'</div>';
		}
	}
</script>

<BaseSlide {background} {transition} {dataAutoAnimate} {footerConfig}>
	<div class="markdown-slide {className}">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html htmlContent}
	</div>
</BaseSlide>

<style>
	.markdown-slide {
		width: min(80ch, 100%);
		text-align: left;
	}

	.markdown-slide :global(h1),
	.markdown-slide :global(h2),
	.markdown-slide :global(h3),
	.markdown-slide :global(h4),
	.markdown-slide :global(h5),
	.markdown-slide :global(h6) {
		margin: 1.2rem 0 0.6rem;
	}

	.markdown-slide :global(p) {
		margin: 0.75rem 0;
	}

	.markdown-slide :global(ul),
	.markdown-slide :global(ol) {
		margin: 0.75rem 0;
		padding-left: 1.5rem;
	}

	.markdown-slide :global(.markdown-slide__error) {
		font-family: monospace;
	}
</style>
