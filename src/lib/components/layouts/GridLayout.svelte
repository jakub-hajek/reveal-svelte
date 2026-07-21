<script lang="ts">
	import BaseSlide from '../slides/BaseSlide.svelte';
	import type { Snippet } from 'svelte';

	let {
		items,
		columns = 2,
		gap = '1rem',
		background,
		transition
	}: {
		items: Array<{ id: string; content: Snippet | string }>;
		columns?: number;
		gap?: string;
		background?: string;
		transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
	} = $props();
</script>

<BaseSlide {background} {transition}>
	<div class="grid-layout" style="grid-template-columns: repeat({columns}, 1fr); gap: {gap};">
		{#each items as item (item.id)}
			<div class="grid-item">
				{#if typeof item.content === 'string'}
					{item.content}
				{:else}
					{@render item.content()}
				{/if}
			</div>
		{/each}
	</div>
</BaseSlide>

<style>
	.grid-layout {
		display: grid;
		width: 100%;
		height: 100%;
		padding: 2rem;
	}

	.grid-item {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background: var(--theme-surface-0);
		border-radius: 0.5rem;
		color: var(--theme-text);
	}
</style>
