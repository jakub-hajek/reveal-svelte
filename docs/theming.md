# Theming

## CSS imports

A deck imports three stylesheets, in this order:

```ts
import 'reveal-svelte/theme/reveal-base.css'; // reveal.js core styles
import 'reveal-svelte/theme/catppuccin/theme.css'; // theme tokens
import 'reveal-svelte/theme/reveal.css'; // typography + slide styling built on the tokens
```

`reveal-svelte/theme/variables.css` is an alias that re-exports the Catppuccin
theme; older decks importing it keep working.

Catppuccin Mocha is the only theme shipped today. A custom theme is a stylesheet
that imports `reveal-svelte/theme/base.css` and sets the tokens below — swap it
in for the theme import above.

## Tokens

Components and `reveal.css` only ever read `--theme-*`; `base.css` maps those to
the reveal.js `--r-*` variables and to the legacy `--ctp-*` / `--catppuccin-*`
names, so overriding one token updates everything downstream.

| Token | Catppuccin Mocha | Used for |
|-------|------------------|----------|
| `--theme-bg` | `#1e1e2e` | Deck background |
| `--theme-surface-0` / `-1` / `-2` | `#313244` / `#45475a` / `#585b70` | Cards, table rows, borders |
| `--theme-text` | `#cdd6f4` | Body text |
| `--theme-heading` | `#b4befe` | Headings |
| `--theme-muted` | `#a6adc8` | Footer, captions |
| `--theme-subtext` | `#bac2de` | Secondary text |
| `--theme-primary` | `#fab387` | Accent, selection |
| `--theme-secondary` | `#cba6f7` | Titles, secondary accent |
| `--theme-border` | `#6c7086` | Borders |
| `--theme-link` / `--theme-link-hover` | `#89b4fa` / `#74c7ec` | Links |
| `--theme-code-*` (`bg`, `text`, `keyword`, `string`, `number`, `comment`, `function`) | — | Code blocks |
| `--theme-chart-1` … `--theme-chart-12` | `#f38ba8`, `#89b4fa`, `#a6e3a1`, … | Chart series, Gantt sections |
| `--gantt-dependency-color` | falls back to `--theme-muted` | `GanttChart` dependency arrows |
| `--gantt-today-color` | falls back to `--theme-muted` | The dashed `today` line |
| `--gantt-marker-color` | falls back to `--theme-muted` | Default line and caption color for `markers` (a marker's own `color` wins) |
| `--gantt-marker-label-bg` | falls back to `--theme-surface-0` | Chip behind a marker caption, so it reads over the tick labels |
| `--gantt-marker-label-size` | `11px` | Marker caption text size |
| `--gantt-group-label-color` | falls back to `--theme-text` | `GanttChart` group header text |
| `--gantt-disclosure-color` | falls back to `--theme-muted` | Group expand/collapse triangle |
| `--gantt-group-indent` | `14px` | Indent per tree level in a grouped chart's gutter |
| `--gantt-disclosure-slot` | `11px` | Width reserved for the expand/collapse triangle, so labels without one still line up |
| `--gantt-bar-label-light` / `--gantt-bar-label-dark` | `#ffffff` / `#11111b` | The two inks for labels drawn on bars; which one is used is decided per bar by luminance |
| `--gantt-bar-label-outside-color` | falls back to `--theme-text` | Labels drawn beside a bar, on the slide |
| `--gantt-bar-thickness` | `62%` | Bar height as a share of its lane |
| `--gantt-tooltip-bg` | falls back to `--theme-surface-0` | Detail popup background — must stay opaque, bars and gridlines run underneath it |
| `--gantt-tooltip-color` | falls back to `--theme-text` | Detail popup text |
| `--gantt-tooltip-muted` | falls back to `--theme-subtext` | Its date and dependency lines |
| `--gantt-tooltip-border` | falls back to `--theme-border` | Popup border and caret |
| `--gantt-tooltip-shadow` | `0 6px 18px rgb(0 0 0 / 0.35)` | Popup drop shadow |
| `--gantt-tooltip-font-size` | `12px` | Popup body text size |
| `--gantt-tooltip-max-height` | `320px` | Beyond this a pinned popup scrolls |

Override per deck or per slide:

```svelte
<style>
	:root { --theme-primary: #e30613; }
	section { --gantt-dependency-color: var(--ctp-lavender); }
</style>
```

## Logo overlay

```svelte
<RevealWrapper config={{ logo: { src: '/logo.svg', position: 'bottom-right', width: '120px', opacity: 0.9 } }}>
```

Positions: `bottom-right`, `bottom-left`, `top-right`, `top-left`. See
[LogoOverlay](./components.md#logooverlay) for all fields.

## Footer

```svelte
<RevealWrapper config={{ footer: { presentationName: 'My Talk', authorName: 'Jane Doe' } }}>
```

The footer sits below the slide area and is hidden in `?print-pdf` export.
