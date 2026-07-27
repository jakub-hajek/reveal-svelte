# reveal-svelte

Svelte 5 + Reveal.js component library for building presentations — slides,
layouts, charts, markdown, math, code, and Excalidraw diagrams, plus slide
discovery helpers.

## Install

The package is distributed via its git repository (built `dist/` is committed):

```bash
bun add reveal-svelte@github:jakub-hajek/reveal-svelte
```

This tracks the newest version on `main`; the resolved commit is recorded in the
consumer's lockfile, and `bun update reveal-svelte` pulls the latest again.

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
	import 'reveal-svelte/theme/catppuccin/theme.css';
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

Slides live in `src/slides/` as `.svelte` or `.md` files and are ordered by a
numeric filename prefix (`10-intro.md`, `20-agenda.svelte`).

## Components

Full props tables and examples: **[docs/components.md](docs/components.md)**.

| Group | Components |
|-------|------------|
| Deck | `RevealWrapper` |
| Slides | `BaseSlide`, `TitleSlide`, `MarkdownSlide`, `SlideFooter`, `LogoOverlay` |
| Layouts | `TwoColumnLayout`, `FullImageLayout`, `GridLayout` |
| Charts | `BarChart`, `LineChart`, `PieChart`, `GanttChart` |
| Content | `Markdown`, `Table`, `Math`, `Code`, `Excalidraw` |
| Helpers | `createSlideEntries`, `config`, `init` |

## Theming

Themes are plain CSS variables; Catppuccin Mocha ships by default. Token
reference, custom themes, logo and footer: **[docs/theming.md](docs/theming.md)**.

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
