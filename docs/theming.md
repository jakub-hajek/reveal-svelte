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

Two Catppuccin flavors ship: **Mocha** (dark, the default — shown above) and
**Latte** (light). Swap the theme import for `catppuccin-latte/theme.css` to
default a deck to light instead:

```ts
import 'reveal-svelte/theme/catppuccin-latte/theme.css'; // Catppuccin Latte, light by default
```

A custom theme is a stylesheet that imports `reveal-svelte/theme/base.css` and
sets the tokens below — swap it in for the theme import above.

## Dark / light mode

Both theme files carry *both* flavors, gated by a `data-theme` attribute on
`<html>` — `catppuccin/theme.css` defaults to Mocha with a `[data-theme="light"]`
override, `catppuccin-latte/theme.css` is the reverse. Whichever one you import,
add `themeToggle` to `RevealConfig` to render a corner button that flips the
attribute and remembers the choice in `localStorage`:

```svelte
<RevealWrapper config={{ themeToggle: { position: 'bottom-left' } }}>
```

See [ThemeToggle](./components.md#themetoggle) for the full config.

`Code`'s syntax highlighting (`svelte-highlight`'s `atom-one-dark.css`) is not
theme-aware and stays dark in both modes — only the block's chrome (filename
header, copy button, line numbers) follows `--theme-*`.

`BarChart`, `LineChart`, and `PieChart` draw onto a `<canvas>`, so their colors
are baked in as pixels rather than following CSS live — they watch for the
toggle's `data-theme` change and redraw with fresh `--theme-*` values.
`GanttChart` and everything else is plain CSS/SVG, so it repaints on its own.

Because the toggle reads the stored/system preference in the browser after the
page has already painted, a deck with a strong preference for zero flash-of-
wrong-theme can set `data-theme` on `<html>` before hydration with a small
blocking script in `app.html`:

```html
<script>
	(function () {
		var stored = localStorage.getItem('reveal-svelte-theme');
		var theme = stored || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
		document.documentElement.dataset.theme = theme;
	})();
</script>
```

## Tokens

Components and `reveal.css` only ever read `--theme-*`; `base.css` maps those to
the reveal.js `--r-*` variables and to the legacy `--ctp-*` / `--catppuccin-*`
names, so overriding one token updates everything downstream.

| Token | Catppuccin Mocha (dark) | Catppuccin Latte (light) | Used for |
|-------|--------------------------|---------------------------|----------|
| `--theme-bg` | `#1e1e2e` | `#eff1f5` | Deck background |
| `--theme-surface-0` / `-1` / `-2` | `#313244` / `#45475a` / `#585b70` | `#ccd0da` / `#bcc0cc` / `#acb0be` | Cards, table rows, borders |
| `--theme-text` | `#cdd6f4` | `#4c4f69` | Body text |
| `--theme-heading` | `#b4befe` | `#7287fd` | Headings |
| `--theme-muted` | `#a6adc8` | `#6c6f85` | Footer, captions |
| `--theme-subtext` | `#bac2de` | `#5c5f77` | Secondary text |
| `--theme-primary` | `#fab387` | `#fe640b` | Accent, selection |
| `--theme-secondary` | `#cba6f7` | `#8839ef` | Titles, secondary accent |
| `--theme-border` | `#6c7086` | `#9ca0b0` | Borders |
| `--theme-link` / `--theme-link-hover` | `#89b4fa` / `#74c7ec` | `#1e66f5` / `#209fb5` | Links |
| `--theme-code-*` (`bg`, `text`, `keyword`, `string`, `number`, `comment`, `function`) | — | — | Code blocks |
| `--theme-chart-1` … `--theme-chart-12` | `#f38ba8`, `#89b4fa`, `#a6e3a1`, … | `#d20f39`, `#1e66f5`, `#40a02b`, … | Chart series, Gantt sections |

`GanttChart` also reads these tokens, all flavor-agnostic (a fixed size, or a
fallback onto one of the tokens above — so they already switch with the theme):

| Token | Default | Used for |
|-------|---------|----------|
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
