<script lang="ts">
	import { TwoColumnLayout } from 'reveal-svelte';
</script>

<TwoColumnLayout splitRatio="60% 40%">
	{#snippet left()}
		<h2>Two Column Layout</h2>
		<p>This layout splits the slide into two configurable columns.</p>
		<ul>
			<li>Responsive grid-based layout</li>
			<li>Configurable split ratio</li>
			<li>Flexible gap control</li>
		</ul>
	{/snippet}
	{#snippet right()}
		<div style="background: var(--ctp-surface0); padding: 2rem; border-radius: 0.5rem;">
			<h3>Features</h3>
			<p>Perfect for comparing concepts or showing code alongside explanations.</p>
		</div>
	{/snippet}
</TwoColumnLayout>
