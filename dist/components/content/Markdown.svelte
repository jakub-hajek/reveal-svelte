<script lang="ts">
	import { renderMarkdown } from '../../utils/markdown';

	interface Props {
		content: string;
		sanitize?: boolean;
	}

	// biome-ignore lint/style/useConst: props destructuring stays reactive
	let { content, sanitize = true }: Props = $props();

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
			console.error('Markdown rendering error:', error);
			htmlContent = '<p class="error">Failed to render markdown</p>';
		}
	}
</script>

<div class="markdown-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html htmlContent}
</div>

<style>
	.markdown-content {
		color: var(--theme-text);
		line-height: 1.6;
	}

	.markdown-content :global(h1) {
		color: var(--theme-secondary);
		font-size: 2rem;
		margin: 1.5rem 0 1rem;
		font-weight: 700;
		border-bottom: 2px solid var(--theme-surface-2);
		padding-bottom: 0.5rem;
	}

	.markdown-content :global(h2) {
		color: var(--theme-heading);
		font-size: 1.6rem;
		margin: 1.25rem 0 0.75rem;
		font-weight: 600;
	}

	.markdown-content :global(h3) {
		color: var(--theme-link);
		font-size: 1.3rem;
		margin: 1rem 0 0.5rem;
		font-weight: 600;
	}

	.markdown-content :global(h4),
	.markdown-content :global(h5),
	.markdown-content :global(h6) {
		color: var(--theme-chart-9);
		margin: 0.75rem 0 0.5rem;
		font-weight: 600;
	}

	.markdown-content :global(p) {
		margin: 0.75rem 0;
		color: var(--theme-text);
	}

	.markdown-content :global(a) {
		color: var(--theme-link-hover);
		text-decoration: none;
		border-bottom: 1px solid var(--theme-link-hover);
		transition:
			color 0.2s,
			border-color 0.2s;
	}

	.markdown-content :global(a:hover) {
		color: var(--theme-link);
		border-bottom-color: var(--theme-link);
	}

	.markdown-content :global(strong) {
		color: var(--theme-primary);
		font-weight: 700;
	}

	.markdown-content :global(em) {
		color: var(--theme-chart-6);
		font-style: italic;
	}

	.markdown-content :global(code) {
		background-color: var(--theme-surface-0);
		color: var(--theme-chart-3);
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
		font-size: 0.9em;
	}

	.markdown-content :global(pre) {
		background-color: var(--theme-surface-0);
		color: var(--theme-text);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
		border-left: 3px solid var(--theme-secondary);
	}

	.markdown-content :global(pre code) {
		background-color: transparent;
		padding: 0;
		color: inherit;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: 0.75rem 0;
		padding-left: 2rem;
		color: var(--theme-text);
	}

	.markdown-content :global(li) {
		margin: 0.25rem 0;
	}

	.markdown-content :global(blockquote) {
		border-left: 4px solid var(--theme-chart-8);
		padding-left: 1rem;
		margin: 1rem 0;
		color: var(--theme-subtext);
		font-style: italic;
		background-color: var(--theme-surface-0);
		padding: 0.75rem 1rem;
		border-radius: 0 0.25rem 0.25rem 0;
	}

	.markdown-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		background-color: var(--theme-bg);
	}

	.markdown-content :global(table th) {
		background-color: var(--theme-surface-0);
		color: var(--theme-secondary);
		padding: 0.75rem;
		text-align: left;
		border-bottom: 2px solid var(--theme-surface-2);
		font-weight: 600;
	}

	.markdown-content :global(table td) {
		padding: 0.75rem;
		border-bottom: 1px solid var(--theme-surface-1);
	}

	.markdown-content :global(table tr:hover) {
		background-color: var(--theme-surface-0);
	}

	.markdown-content :global(hr) {
		border: none;
		border-top: 2px solid var(--theme-surface-2);
		margin: 1.5rem 0;
	}

	.markdown-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.markdown-content :global(.error) {
		color: var(--theme-chart-4);
		background-color: var(--theme-surface-0);
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		border-left: 3px solid var(--theme-chart-4);
	}
</style>
