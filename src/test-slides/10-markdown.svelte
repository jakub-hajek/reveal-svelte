<script lang="ts">
	import { Markdown, TwoColumnLayout } from 'reveal-svelte';
	import content from './example.md?raw';

	const simpleContent = `
## Key Benefits

1. **Easy authoring** with markdown syntax
2. **Safe rendering** with DOMPurify sanitization
3. **Themed styling** with Catppuccin colors

\`\`\`javascript
// Example code block
function fibonacci(n) {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`
	`.trim();
</script>

<TwoColumnLayout>
	{#snippet left()}
		<Markdown content={simpleContent} />
	{/snippet}
	{#snippet right()}
		<Markdown {content} />
	{/snippet}
</TwoColumnLayout>
