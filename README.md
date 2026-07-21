# reveal-svelte

Svelte + Reveal.js component library for building presentations with slide discovery helpers.

## Install

The package is distributed via its git repository (built `dist/` is committed). Pin a tag:

```bash
bun add reveal-svelte@github:jakub-hajek/reveal-svelte#v0.1.0
```

The fastest way to start a new presentation is the companion deck template:

```bash
bunx degit jakub-hajek/reveal-deck-template my-talk
cd my-talk && bun install && bun run dev
```

## Usage

```svelte
<script lang="ts">
	import { MarkdownSlide, RevealWrapper, createSlideEntries } from 'reveal-svelte';
	import 'reveal-svelte/theme/reveal-base.css';
	import 'reveal-svelte/theme/variables.css';
	import 'reveal-svelte/theme/reveal.css';

	const slideModules = import.meta.glob('/src/slides/*.svelte', { eager: true });
	const markdownModules = import.meta.glob('/src/slides/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	});

	const slideEntries = createSlideEntries({ slideModules, markdownModules });
</script>

<RevealWrapper>
	{#each slideEntries as slide (slide.id)}
		{#if slide.type === 'component'}
			<svelte:component this={slide.component} />
		{:else}
			<MarkdownSlide id={slide.id} sourcePath={slide.sourcePath} content={slide.markdown} />
		{/if}
	{/each}
</RevealWrapper>
```

## Theming

reveal-svelte supports multiple themes. Import the theme CSS files in your layout.

### Using Catppuccin (default)

```svelte
import 'reveal-svelte/theme/reveal-base.css';
import 'reveal-svelte/theme/catppuccin/theme.css';
import 'reveal-svelte/theme/reveal.css';
```

### Backward compatibility

The old import path still works (defaults to Catppuccin):

```svelte
import 'reveal-svelte/theme/variables.css';
```

### Adding a logo overlay

```svelte
<RevealWrapper config={{
  logo: {
    src: '/logo.svg',
    position: 'bottom-right',
    width: '120px',
    opacity: 0.9
  }
}}>
```

Logo positions: `bottom-right`, `bottom-left`, `top-right`, `top-left`.

## Development

```bash
bun run dev          # dev server with the test-slide harness
bun run test         # unit (vitest) + e2e (playwright)
```

## Releasing

`dist/` is committed so that git-URL installs work without lifecycle scripts.
To cut a release:

```bash
bun run release      # svelte-kit sync + svelte-package + publint + unit tests
git add -A && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z && git push && git push --tags
```

Decks then update by bumping the tag in their `package.json` and running
`bun update reveal-svelte`.
