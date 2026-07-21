<script lang="ts">
	import Highlight from 'svelte-highlight';
	import typescript from 'svelte-highlight/languages/typescript';
	import javascript from 'svelte-highlight/languages/javascript';
	import python from 'svelte-highlight/languages/python';
	import java from 'svelte-highlight/languages/java';
	import bash from 'svelte-highlight/languages/bash';
	import json from 'svelte-highlight/languages/json';
	import html from 'svelte-highlight/languages/xml';
	import 'svelte-highlight/styles/atom-one-dark.css';
	import type { Snippet } from 'svelte';

	interface Props {
		code?: string;
		language?: string;
		filename?: string;
		lineNumbers?: boolean;
		highlightLines?: number[];
		maxHeight?: string;
		copyButton?: boolean;
		children?: Snippet;
	}

	let {
		code = '',
		language = 'typescript',
		filename = '',
		lineNumbers = false,
		highlightLines = [],
		maxHeight = 'auto',
		copyButton = false
	}: Props = $props();

	const languageMap = {
		typescript,
		ts: typescript,
		javascript,
		js: javascript,
		python,
		py: python,
		java,
		bash,
		sh: bash,
		json,
		html,
		xml: html
	};

	type LanguageKey = keyof typeof languageMap;

	const languageHighlighter = $derived(
		languageMap[language.toLowerCase() as LanguageKey] || javascript
	);

	let codeLines = $derived(code.split('\n'));
	let copied = $state(false);

	function copyToClipboard() {
		navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	function isHighlighted(lineNum: number): boolean {
		return highlightLines.includes(lineNum);
	}
</script>

<div class="code-block" style="max-height: {maxHeight}">
	{#if filename}
		<div class="filename-header">
			<span class="filename">{filename}</span>
			{#if copyButton}
				<button class="copy-button" onclick={copyToClipboard}>
					{copied ? '✓ Copied' : '📋 Copy'}
				</button>
			{/if}
		</div>
	{/if}

	{#if lineNumbers}
		<div class="code-with-lines">
			<div class="line-numbers">
				{#each codeLines as _line, i (i)}
					<div class="line-number" class:highlighted={isHighlighted(i + 1)}>{i + 1}</div>
				{/each}
			</div>
			<div class="code-content">
				<Highlight language={languageHighlighter} {code} />
			</div>
		</div>
	{:else}
		<Highlight language={languageHighlighter} {code} />
	{/if}
</div>

<style>
	.code-block {
		position: relative;
		border-radius: 8px;
		overflow: hidden;
		background: var(--r-code-background, #1e1e2e);
		margin: 1rem 0;
		overflow-y: auto;
	}

	.filename-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--r-surface0, #313244);
		border-bottom: 1px solid var(--r-surface1, #45475a);
	}

	.filename {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.875rem;
		color: var(--r-subtext0, #a6adc8);
	}

	.copy-button {
		background: transparent;
		border: 1px solid var(--r-surface2, #585b70);
		color: var(--r-text, #cdd6f4);
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		transition: all 0.2s;
	}

	.copy-button:hover {
		background: var(--r-surface1, #45475a);
		border-color: var(--r-subtext1, #bac2de);
	}

	.code-with-lines {
		display: flex;
	}

	.line-numbers {
		background: var(--r-surface0, #313244);
		padding: 1rem 0.5rem;
		user-select: none;
		border-right: 1px solid var(--r-surface1, #45475a);
		min-width: 3rem;
		text-align: right;
	}

	.line-number {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.875rem;
		color: var(--r-subtext0, #6c7086);
		line-height: 1.6;
	}

	.line-number.highlighted {
		background: var(--r-yellow, #f9e2af);
		color: var(--r-base, #1e1e2e);
		padding: 0 0.5rem;
		margin: 0 -0.5rem;
	}

	.code-content {
		flex: 1;
		overflow-x: auto;
	}

	.code-content :global(pre) {
		margin: 0 !important;
		padding: 1rem !important;
		background: transparent !important;
	}

	.code-content :global(code) {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
	}
</style>
