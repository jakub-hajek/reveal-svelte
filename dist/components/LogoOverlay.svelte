<script lang="ts">
	import type { LogoConfig } from '../types/reveal.js';

	let { config }: { config: LogoConfig } = $props();

	const position = $derived(config.position || 'bottom-right');
	const width = $derived(config.width || '100px');
	const height = $derived(config.height || 'auto');
	const inset = $derived(config.inset || '20px');
	const opacity = $derived(config.opacity ?? 1);

	const positionStyles = $derived<Record<string, string>>({
		'bottom-right': `bottom: ${inset}; right: ${inset};`,
		'bottom-left': `bottom: ${inset}; left: ${inset};`,
		'top-right': `top: ${inset}; right: ${inset};`,
		'top-left': `top: ${inset}; left: ${inset};`
	});
</script>

<div class="logo-overlay" style={positionStyles[position]}>
	<img src={config.src} alt={config.alt || 'Logo'} style:width style:height style:opacity />
</div>

<style>
	.logo-overlay {
		position: fixed;
		z-index: 100;
		pointer-events: none;
	}
	.logo-overlay img {
		display: block;
	}
</style>
