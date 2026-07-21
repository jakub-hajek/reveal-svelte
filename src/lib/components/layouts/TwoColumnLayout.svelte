<script lang="ts">
	import BaseSlide from '../slides/BaseSlide.svelte';
	import type { TwoColumnLayoutProps } from '../../types/layouts';

	/**
	 * TwoColumnLayout - Split slide into two columns with configurable ratio
	 *
	 * @example
	 * ```svelte
	 * <TwoColumnLayout splitRatio="2fr 1fr" gap="2rem">
	 *   {#snippet left()}
	 *     <h2>Left Content</h2>
	 *   {/snippet}
	 *   {#snippet right()}
	 *     <p>Right Content</p>
	 *   {/snippet}
	 * </TwoColumnLayout>
	 * ```
	 */

	type Props = TwoColumnLayoutProps & {
		background?: string;
		transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
	};

	let {
		left,
		right,
		splitRatio = '1fr 1fr',
		gap = '2rem',
		background,
		transition
	}: Props = $props();
</script>

<BaseSlide {background} {transition}>
	<div class="two-column-layout" style="grid-template-columns: {splitRatio}; gap: {gap};">
		<div class="column left">
			{@render left()}
		</div>
		<div class="column right">
			{@render right()}
		</div>
	</div>
</BaseSlide>

<style>
	.two-column-layout {
		display: grid;
		width: 100%;
		height: 100%;
		align-items: center;
	}

	.column {
		padding: 1rem;
	}
</style>
