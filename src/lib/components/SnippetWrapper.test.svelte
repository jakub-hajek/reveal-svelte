<script lang="ts">
	import type { Component as SvelteComponentType } from 'svelte';
	let {
		component: Component,
		props = {}
	}: { component: SvelteComponentType; props?: Record<string, unknown> } = $props();
</script>

<Component {...props}>
	{#snippet left()}
		Left Content
	{/snippet}
	{#snippet right()}
		Right Content
	{/snippet}
</Component>
