<script lang="ts">
	import type { ThemeToggleConfig } from '../types/reveal.js';

	let { config = {} }: { config?: ThemeToggleConfig } = $props();

	const STORAGE_KEY = 'reveal-svelte-theme';

	function systemTheme(): 'dark' | 'light' {
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	}

	function initialTheme(): 'dark' | 'light' {
		if (typeof window === 'undefined') return config.default ?? 'dark';
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored === 'dark' || stored === 'light') return stored;
		return config.default ?? systemTheme();
	}

	let theme = $state<'dark' | 'light'>(initialTheme());

	$effect(() => {
		document.documentElement.dataset.theme = theme;
	});

	const position = $derived(config.position || 'bottom-right');
	const inset = $derived(config.inset || '20px');

	const positionStyles = $derived<Record<string, string>>({
		'bottom-right': `bottom: ${inset}; right: ${inset};`,
		'bottom-left': `bottom: ${inset}; left: ${inset};`,
		'top-right': `top: ${inset}; right: ${inset};`,
		'top-left': `top: ${inset}; left: ${inset};`
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		window.localStorage.setItem(STORAGE_KEY, theme);
	}
</script>

<button
	type="button"
	class="theme-toggle"
	style={positionStyles[position]}
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
	{#if theme === 'dark'}
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<circle cx="12" cy="12" r="4" fill="currentColor" />
			<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</g>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		position: fixed;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border-radius: 50%;
		border: 1px solid var(--theme-border);
		background: var(--theme-surface-0);
		color: var(--theme-text);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.theme-toggle:hover {
		background: var(--theme-surface-1);
	}

	.theme-toggle:focus-visible {
		outline: 2px solid var(--theme-primary);
		outline-offset: 2px;
	}
</style>
