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
| Slides | `BaseSlide`, `TitleSlide`, `MarkdownSlide`, `SlideFooter`, `LogoOverlay`, `ThemeToggle` |
| Layouts | `TwoColumnLayout`, `FullImageLayout`, `GridLayout` |
| Charts | `BarChart`, `LineChart`, `PieChart`, `GanttChart` |
| Content | `Markdown`, `Table`, `Math`, `Code`, `Excalidraw` |
| Helpers | `createSlideEntries`, `config`, `init` |

## Theming

Themes are plain CSS variables; Catppuccin Mocha ships by default, with
Catppuccin Latte available for a light mode and a `ThemeToggle` component to
switch between them at runtime. Token reference, custom themes, logo and
footer: **[docs/theming.md](docs/theming.md)**.

## Development

```bash
bun run dev          # dev server with the test-slide harness
bun run test         # unit (vitest) + e2e (playwright)
```

## Releasing

`dist/` is committed so that git-URL installs work without lifecycle scripts —
which also means every push to `main` is a release. Rebuild `dist/` in the same
commit as the source change it belongs to:

```bash
bun run release      # svelte-kit sync + svelte-package + publint + unit tests
git add -A && git commit -m "..."
git push
```

Bump `version` in `package.json` for anything user-facing, so a deck can tell
what it resolved to.

Tags are not part of this: decks install untagged and track `main` (see
[Install](#install)), so they pick a change up with `bun update reveal-svelte`
and nothing to bump on their side. The `v0.1.x` tags are leftovers from before
that switch and are not maintained — a deck still pinned to one should drop the
`#vX.Y.Z` suffix from its dependency.
