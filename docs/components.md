# Component API reference

Every component exported from `reveal-svelte`, documented in the same shape:
what it does, a minimal example, and a props table. Types come from
`reveal-svelte` as well:

```ts
import { RevealWrapper, BaseSlide, GanttChart } from 'reveal-svelte';
import type { RevealConfig, GanttTask, TableColumn, ChartData } from 'reveal-svelte';
```

Every slide-level component (`BaseSlide`, `TitleSlide`, `MarkdownSlide`, and the
three layouts) renders a reveal.js `<section>` and shares these two props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `background` | `string` | `undefined` | Background color or image URL (`data-background`) |
| `transition` | `'slide' \| 'fade' \| 'convex' \| 'concave' \| 'zoom'` | `undefined` | Per-slide transition override |

- [Deck](#deck): [RevealWrapper](#revealwrapper)
- [Slides](#slides): [BaseSlide](#baseslide), [TitleSlide](#titleslide), [MarkdownSlide](#markdownslide), [SlideFooter](#slidefooter), [LogoOverlay](#logooverlay)
- [Layouts](#layouts): [TwoColumnLayout](#twocolumnlayout), [FullImageLayout](#fullimagelayout), [GridLayout](#gridlayout)
- [Charts](#charts): [BarChart / LineChart / PieChart](#barchart--linechart--piechart), [GanttChart](#ganttchart)
- [Content](#content): [Table](#table), [Code](#code), [Math](#math), [Markdown](#markdown), [Excalidraw](#excalidraw)
- [Slide discovery helpers](#slide-discovery-helpers)

---

## Deck

### RevealWrapper

Top-level wrapper that creates and initializes the Reveal.js instance, registers
the zoom and notes plugins, and auto-fits overflowing slides. Wrap all slides in
it.

```svelte
<RevealWrapper config={{ footer: { presentationName: 'My Talk', authorName: 'Jane Doe' } }}>
	<TitleSlide title="My Talk" />
	<BaseSlide>…</BaseSlide>
</RevealWrapper>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `RevealConfig` | `{}` | Reveal.js options, merged over the library defaults |
| `class` | `string` | `''` | CSS class for the container element |
| `children` | `Snippet` | — | The slides |

`RevealConfig` extends [Reveal.js options](https://revealjs.com/config/) with two
extra fields:

- `footer?: { presentationName: string; authorName: string }` — renders a
  [`SlideFooter`](#slidefooter) below the deck (hidden in `?print-pdf` mode)
- `logo?: LogoConfig` — renders a [`LogoOverlay`](#logooverlay)

Library defaults (`config` from `reveal-svelte` exposes them): `width: 960`,
`height: 700`, `margin: 0.04`, `transition: 'slide'`, `controls`, `progress`,
`center`, `overview`, `fragments` on, `slideNumber` off.

For decks that manage their own DOM, `init(config)` (`initReveal`) creates and
initializes a Reveal instance without the wrapper.

---

## Slides

### BaseSlide

Generic slide container — a centered flex column. Everything else builds on it.

```svelte
<BaseSlide background="#1e1e2e" transition="fade">
	<h2>My Slide</h2>
	<p>Content here</p>
</BaseSlide>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `background` | `string` | `undefined` | Background color or image URL |
| `transition` | transition | `undefined` | Slide transition |
| `dataAutoAnimate` | `boolean` | `false` | Sets `data-auto-animate` for reveal.js auto-animate |
| `children` | `Snippet` | — | Slide content |

### TitleSlide

Centered title slide with optional subtitle, author, and date.

```svelte
<TitleSlide title="My Presentation" subtitle="A Deep Dive" author="Jane Doe" date="2026" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Main title |
| `subtitle` | `string` | `undefined` | Subtitle text |
| `author` | `string` | `undefined` | Author name |
| `date` | `string` | `undefined` | Date string (free-form) |
| `background` | `string` | `undefined` | Background color or image URL |
| `transition` | transition | `undefined` | Slide transition |

### MarkdownSlide

Renders a markdown string as a full slide. Used by the slide-discovery helpers
for `.md` files in `src/slides/`, and usable directly.

```svelte
<MarkdownSlide id="intro" sourcePath="/src/slides/10-intro.md" content={markdown} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | **required** | Markdown source |
| `sanitize` | `boolean` | `true` | Sanitize the rendered HTML |
| `id` | `string` | `undefined` | Identifier used in render-error messages |
| `sourcePath` | `string` | `undefined` | Source path used in render-error messages |
| `class` | `string` | `''` | CSS class on the content wrapper |
| `background` | `string` | `undefined` | Passed through to `BaseSlide` |
| `transition` | transition | `undefined` | Passed through to `BaseSlide` |
| `dataAutoAnimate` | `boolean` | `false` | Passed through to `BaseSlide` |

### SlideFooter

Two-slot footer bar (presentation name left, author right). `RevealWrapper`
renders it automatically when `config.footer` is set — use the component
directly only for custom deck shells.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `presentationName` | `string` | **required** | Left-hand text |
| `authorName` | `string` | **required** | Right-hand text |
| `class` | `string` | `''` | Extra CSS class |

### LogoOverlay

Fixed-position logo image. Rendered automatically from `config.logo`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `LogoConfig` | **required** | Logo configuration |

`LogoConfig`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `src` | `string` | **required** | Image URL |
| `alt` | `string` | `'Logo'` | Alt text |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Corner |
| `width` | `string` | `'100px'` | CSS width |
| `height` | `string` | `'auto'` | CSS height |
| `inset` | `string` | `'20px'` | Distance from both edges of its corner |
| `opacity` | `number` | `1` | Image opacity |

---

## Layouts

### TwoColumnLayout

Splits a slide into two columns with a configurable ratio.

```svelte
<TwoColumnLayout splitRatio="1.2fr 0.8fr" gap="2rem">
	{#snippet left()}
		<h2>Left</h2>
	{/snippet}
	{#snippet right()}
		<Excalidraw src={diagram} height="300px" />
	{/snippet}
</TwoColumnLayout>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `left` | `Snippet` | **required** | Left column content |
| `right` | `Snippet` | **required** | Right column content |
| `splitRatio` | `string` | `'1fr 1fr'` | `grid-template-columns` value |
| `gap` | `string` | `'2rem'` | Gap between columns |
| `background` | `string` | `undefined` | Background color or image URL |
| `transition` | transition | `undefined` | Slide transition |

### FullImageLayout

Full-bleed image with an optional darkened text overlay.

```svelte
<FullImageLayout imageUrl="/photo.jpg" darken={0.4} overlayPosition="bottom">
	{#snippet overlay()}
		<h2>Overlay text</h2>
	{/snippet}
</FullImageLayout>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | **required** | Image URL |
| `alt` | `string` | `''` | Alt text |
| `overlay` | `Snippet` | `undefined` | Overlay content |
| `overlayPosition` | `'top' \| 'center' \| 'bottom'` | `'center'` | Vertical placement of the overlay |
| `darken` | `number` | `0.3` | Opacity of the black backdrop (0–1) |
| `background` | `string` | `undefined` | Background color |
| `transition` | transition | `undefined` | Slide transition |

### GridLayout

Grid of items — each item's content is a snippet or a plain string.

```svelte
<GridLayout items={[{ id: 'a', content: 'First' }, { id: 'b', content: 'Second' }]} columns={3} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array<{ id: string; content: Snippet \| string }>` | **required** | Grid items, in order |
| `columns` | `number` | `2` | Column count |
| `gap` | `string` | `'1rem'` | Gap between items |
| `background` | `string` | `undefined` | Background color |
| `transition` | transition | `undefined` | Slide transition |

---

## Charts

### BarChart / LineChart / PieChart

Chart.js charts that pick up the theme colors automatically. All three take the
same props.

```svelte
<script lang="ts">
	import { BaseSlide, BarChart } from 'reveal-svelte';
	import type { ChartData } from 'reveal-svelte';

	const data: ChartData = {
		labels: ['Q1', 'Q2', 'Q3', 'Q4'],
		datasets: [{ label: 'Revenue', data: [100, 150, 200, 180] }]
	};
</script>

<BaseSlide>
	<h2>Revenue growth</h2>
	<BarChart {data} width={800} height={400} />
</BaseSlide>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ChartData` | **required** | Chart.js data (labels + datasets) |
| `options` | `ChartOptions` | `{}` | Chart.js options, merged over the theme defaults |
| `width` | `number` | `600` | Width in pixels |
| `height` | `number` | `400` | Height in pixels |
| `class` | `string` | `''` | CSS class |

Datasets without explicit `backgroundColor`/`borderColor` are colored from
`--theme-chart-1` … `--theme-chart-12`. `ChartData` and `ChartOptions` are
re-exports of the Chart.js types.

### GanttChart

Project timeline / roadmap: absolutely positioned elements with an SVG overlay
for the dependency arrows — no Chart.js. Tasks in the same `section` share a
color and get a legend entry; a task without `end` renders as a milestone
diamond. With `groups`, sections become collapsible rows.

```svelte
<script lang="ts">
	import { GanttChart, type GanttTask } from 'reveal-svelte';

	const tasks: GanttTask[] = [
		{ id: 'design', label: 'Design', start: '2026-01-05', end: '2026-01-30', section: 'Phase 1', progress: 80 },
		{ id: 'build', label: 'Build', start: '2026-02-02', end: '2026-03-20', section: 'Phase 2', progress: 30, dependsOn: 'design' },
		{ label: 'Launch', start: '2026-03-27', section: 'Phase 2', dependsOn: 'build' } // milestone
	];
</script>

<GanttChart {tasks} today="2026-02-15" width={1000} rowHeight={40} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tasks` | `GanttTask[]` | **required** | One entry per row, in display order |
| `today` | `boolean \| string \| Date` | `false` | `true` = now, or an explicit date; draws a dashed marker |
| `locale` | `string` | browser locale | BCP 47 tag for axis labels and tooltips (`'cs-CZ'`) |
| `otherLabel` | `string` | per locale | Legend label for tasks with no `section` (cs → "Ostatní", else "Other") |
| `dependencies` | `boolean` | `true` | `false` keeps the `dependsOn` data but hides the arrows |
| `groups` | `boolean` | `false` | Promotes each `section` to a collapsible group row |
| `collapsed` | `boolean \| string[]` | `false` | Groups collapsed on first render (`true` = all); clicks take over afterwards |
| `legend` | `boolean` | auto | Forces the legend on/off; auto = shown only when there are 2+ sections and `groups` is off |
| `width` | `number` | `900` | Total width in pixels |
| `rowHeight` | `number` | `36` | Row height in pixels |
| `laneHeight` | `number` | `max(20, rowHeight × 0.6)` | Height of one packed sub-lane inside a collapsed group |
| `barLabelSize` | `number` | `11` | Font size (px) of labels drawn on or beside bars |
| `labelWidth` | `number` | `180` | Width of the left-hand label column |
| `class` | `string` | `''` | CSS class |

`GanttTask`:

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Row label (**required**) |
| `start` | `string \| Date` | ISO date, e.g. `'2026-03-01'` (**required**) |
| `end` | `string \| Date` | Omit for a milestone |
| `id` | `string` | Stable key for `dependsOn`; defaults to `label` |
| `dependsOn` | `string \| string[]` | Predecessor `id`(s) or `label`(s) — draws finish-to-start arrows |
| `section` | `string` | Groups rows: one theme color per section, plus a legend entry — and the collapse key when `groups` is set |
| `progress` | `number` | 0–100; renders a solid fill over a translucent track |
| `color` | `string` | Overrides the section color for this row |
| `milestone` | `boolean` | Forces a diamond even when `end` is set |

The time axis picks day/week/month/quarter/year ticks automatically from the
date range, and dates are localized via `Intl` (`locale="cs-CZ"` → "5. 1.",
"bře 2026").

**Dependencies.** `dependsOn` resolves against `id` first, then `label` — with no
ids at all, `dependsOn: 'Design'` works. Arrows route straight when the successor
starts after the predecessor ends and elbow around the rows when the two overlap.
Unknown and self references are skipped silently. Recolor them with the
`--gantt-dependency-color` CSS variable on any ancestor:

```svelte
<style>
	section { --gantt-dependency-color: var(--ctp-lavender); }
</style>
```

**Groups.** With `groups`, each `section` gets a header row whose label is a
disclosure button — click it, or focus it and press Enter or Space. (The key
event is stopped so it doesn't also advance the slide.) The header carries a
faint bar spanning the whole group, and its progress is the duration-weighted
average of its tasks.

Collapsing does not hide anything. The group's tasks are packed onto as few
sub-lanes as their dates allow — tasks that don't overlap in time share a lane —
and each task's label moves onto its own bar, since the left gutter now shows
only the group name. A five-task group with no overlaps collapses to one lane;
in the worst case it is still a row shorter than it was expanded.

Label placement is chosen per bar: inside when it fits, otherwise to the right,
and to the left when the bar runs to the edge of the plot. Labels are clamped to
the space available and ellipsized, and the bar's hover tooltip always carries
the full text. Ink is picked by luminance against the bar, so it stays readable
on both pastel and near-black palettes — but a `color` that is neither hex nor
`rgb()` (a named color, `hsl()`, `var()`) can't be measured, so its label is
placed beside the bar rather than on it.

```svelte
<GanttChart {tasks} groups collapsed={['Build']} />
```

Collapsing changes the chart's height mid-slide, so it asks `RevealWrapper` to
re-run autofit. Dependency arrows are re-anchored to whatever rows are actually
drawn: arrows into a collapsed group land on the task's own bar, several arrows
that collapse onto the same pair of bars become one, and an arrow between two
tasks that end up on the same bar disappears.

---

## Content

### Table

Sortable, themed data table.

```svelte
<script lang="ts">
	import { Table, type TableColumn } from 'reveal-svelte';

	type Row = { name: string; value: number };

	const columns: TableColumn<Row>[] = [
		{ key: 'name', header: 'Name', width: '40%' },
		{ key: 'value', header: 'Value', align: 'right' }
	];
	const data: Row[] = [{ name: 'Item A', value: 100 }];
</script>

<Table {columns} {data} striped bordered />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn<T>[]` | **required** | Column definitions |
| `data` | `T[]` | **required** | Row data |
| `sortable` | `boolean` | `true` | Enable header-click sorting |
| `striped` | `boolean` | `false` | Striped row backgrounds |
| `bordered` | `boolean` | `false` | Cell borders |

`TableColumn<T>`:

| Field | Type | Description |
|-------|------|-------------|
| `key` | `keyof T` | Row property to display |
| `header` | `string` | Header text |
| `sortable` | `boolean` | Per-column override of the table's `sortable` |
| `width` | `string` | CSS width, e.g. `'30%'` |
| `align` | `'left' \| 'center' \| 'right'` | Cell alignment (default `'left'`) |
| `render` | `(value, row) => string` | Custom cell renderer |

### Code

Syntax-highlighted code block with an optional filename header, line numbers,
line highlighting, and a copy button.

```svelte
<Code code={source} language="typescript" filename="example.ts" lineNumbers highlightLines={[2]} copyButton />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | `''` | Code to render |
| `language` | `string` | `'typescript'` | Highlighting language |
| `filename` | `string` | `''` | Filename shown in the header bar |
| `lineNumbers` | `boolean` | `false` | Show line numbers |
| `highlightLines` | `number[]` | `[]` | 1-based lines to highlight |
| `maxHeight` | `string` | `'auto'` | Max height before scrolling, e.g. `'400px'` |
| `copyButton` | `boolean` | `false` | Show a copy-to-clipboard button (needs `filename`, which renders the header bar) |

Languages: `typescript`/`ts`, `javascript`/`js`, `python`/`py`, `java`,
`bash`/`sh`, `json`, `html`/`xml`. Anything else falls back to JavaScript.

### Math

KaTeX-rendered LaTeX.

```svelte
<Math latex="E = mc^2" />
<Math latex="\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" displayMode />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `latex` | `string` | **required** | LaTeX expression |
| `displayMode` | `boolean` | `false` | Block (centered) instead of inline |
| `class` | `string` | `''` | CSS class |

### Markdown

Renders a markdown string inline (headings, lists, code, tables, links).

```svelte
<Markdown content={"## Features\n- **Bold** text\n- `inline code`"} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | **required** | Markdown source |
| `sanitize` | `boolean` | `true` | Sanitize the rendered HTML |

### Excalidraw

Renders an Excalidraw drawing as inline SVG, either from a full scene object
(`src`) or from its parts.

```svelte
<script lang="ts">
	import { Excalidraw } from 'reveal-svelte';
	import diagramRaw from './my-diagram.excalidraw?raw';

	const diagram = JSON.parse(diagramRaw);
</script>

<Excalidraw src={diagram} height="300px" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `Record<string, unknown>` | `undefined` | Full `.excalidraw` scene (elements + appState + files) |
| `elements` | `unknown[]` | `undefined` | Elements array, if not using `src` |
| `appState` | `Record<string, unknown>` | `undefined` | App state, if not using `src` |
| `files` | `Record<string, unknown>` | `undefined` | Embedded files, if not using `src` |
| `width` | `string` | `undefined` | CSS width, e.g. `'600px'` |
| `height` | `string` | `undefined` | CSS height, e.g. `'300px'` |
| `exportPadding` | `number` | `undefined` | Padding around the exported SVG |
| `handDrawn` | `boolean` | `true` | Force roughness + the hand-drawn font |
| `class` | `string` | `''` | CSS class |

---

## Slide discovery helpers

`createSlideEntries` turns Vite glob imports of `src/slides/*.svelte` and
`src/slides/*.md` into one ordered list. Entries sort by numeric filename prefix
first (`10-intro` before `20-agenda`), then alphabetically; components come
before markdown on ties, and a markdown file colliding with a component id is
suffixed with `--md`.

```ts
const slideEntries = createSlideEntries({ slideModules, markdownModules });
// → Array<{ type: 'component'; id; order; component; title? }
//        | { type: 'markdown';  id; order; markdown; sourcePath? }>
```

| Export | Signature | Description |
|--------|-----------|-------------|
| `createSlideEntries` | `({ slideModules, markdownModules }) => SlideEntry[]` | Merged, ordered deck |
| `createSlideComponentEntries` | `(modules) => SlideComponentEntry[]` | `.svelte` slides only |
| `createMarkdownSlides` | `(modules, componentIds) => SlideMarkdownEntry[]` | `.md` slides only, de-duplicated against component ids |
| `extractSlideStem` | `(path, 'svelte' \| 'md') => string` | Filename stem used as id and sort key |
| `parseNumericPrefix` | `(value) => { hasPrefix, prefix, rest }` | Splits `10-intro` into `10` + `intro` |
| `compareOrder` / `compareEntries` | `(a, b) => number` | The sort used above |

A `.svelte` slide can export `metadata` to set its title:

```svelte
<script module lang="ts">
	export const metadata = { title: 'Introduction' };
</script>
```
