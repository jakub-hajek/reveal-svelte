<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		background?: string;
		transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
		dataAutoAnimate?: boolean;
		children?: Snippet;
	}

	let {
		background = undefined,
		transition = undefined,
		dataAutoAnimate = false,
		children
	}: Props = $props();
</script>

<section
	data-background={background}
	data-transition={transition}
	data-auto-animate={dataAutoAnimate ? '' : undefined}
>
	{@render children?.()}
</section>

<style>
	section {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
