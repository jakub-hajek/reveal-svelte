<script lang="ts">
	import '../lib/theme/reveal-base.css';
	import '../lib/theme/variables.css';
	import '../lib/theme/reveal.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

{@render children?.()}
