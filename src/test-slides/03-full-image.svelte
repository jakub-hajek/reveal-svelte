<script lang="ts">
	import { FullImageLayout } from 'reveal-svelte';
</script>

<FullImageLayout
	imageUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920"
	alt="Earth from space"
	overlayPosition="bottom"
	darken={0.5}
>
	{#snippet overlay()}
		<h2>Full Image Layout</h2>
		<p>Display full-screen images with configurable text overlays.</p>
		<ul>
			<li>Overlay position control (top/center/bottom)</li>
			<li>Adjustable darkness for readability</li>
			<li>Perfect for visual storytelling</li>
		</ul>
	{/snippet}
</FullImageLayout>
