<script lang="ts">
	import BaseSlide from '../slides/BaseSlide.svelte';
	import type { Snippet } from 'svelte';

	let {
		imageUrl,
		alt = '',
		overlay,
		overlayPosition = 'center',
		darken = 0.3,
		background,
		transition
	}: {
		imageUrl: string;
		alt?: string;
		overlay?: Snippet;
		overlayPosition?: 'top' | 'center' | 'bottom';
		darken?: number;
		background?: string;
		transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
	} = $props();

	const alignmentMap = {
		top: 'flex-start',
		center: 'center',
		bottom: 'flex-end'
	};
</script>

<BaseSlide {background} {transition}>
	<div class="full-image-layout">
		<img src={imageUrl} {alt} class="background-image" />
		<div class="overlay-backdrop" style="opacity: {darken}"></div>
		{#if overlay}
			<div class="overlay-content" style="justify-content: {alignmentMap[overlayPosition]}">
				{@render overlay()}
			</div>
		{/if}
	</div>
</BaseSlide>

<style>
	.full-image-layout {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 1;
	}

	.overlay-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--theme-bg);
		z-index: 2;
	}

	.overlay-content {
		position: relative;
		z-index: 3;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		color: var(--theme-text);
	}
</style>
