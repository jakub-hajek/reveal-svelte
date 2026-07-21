<script lang="ts">
	import type { SlideFooterProps } from '../../types/slides.js';

	let { presentationName, authorName, class: className = '' }: SlideFooterProps = $props();
</script>

<div class="slide-footer {className}">
	<div class="footer-left" title={presentationName}>
		{presentationName}
	</div>
	<div class="footer-right" title={authorName}>
		{authorName}
	</div>
</div>

<style>
	.slide-footer {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 1rem;
		font-size: 0.9em;
		font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		color: var(--theme-muted);
		z-index: 10;
		background: var(--theme-bg);
	}

	.footer-left,
	.footer-right {
		max-width: 45%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
