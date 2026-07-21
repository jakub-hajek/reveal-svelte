<script lang="ts">
	import BaseSlide from './BaseSlide.svelte';
	import type { TitleSlideProps } from '../../types/layouts';
	import type { FooterConfig } from '../../types/slides.js';

	interface Props extends TitleSlideProps {
		footerConfig?: FooterConfig;
	}

	let { title, subtitle, author, date, background, transition, footerConfig }: Props = $props();
</script>

<BaseSlide {background} {transition} {footerConfig}>
	<div class="title-slide">
		<h1>{title}</h1>
		{#if subtitle}
			<h2 class="subtitle">{subtitle}</h2>
		{/if}
		<div class="metadata">
			{#if author}
				<p class="author">{author}</p>
			{/if}
			{#if date}
				<p class="date">{date}</p>
			{/if}
		</div>
	</div>
</BaseSlide>

<style>
	.title-slide {
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100%;
		gap: 1.5rem;
	}

	h1 {
		font-size: 3em;
		margin: 0;
		color: var(--catppuccin-mauve);
	}

	.subtitle {
		font-size: 1.5em;
		margin: 0;
		color: var(--catppuccin-subtext1);
		font-weight: 400;
	}

	.metadata {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.author,
	.date {
		margin: 0;
		font-size: 1.2em;
		color: var(--catppuccin-subtext0);
	}
</style>
