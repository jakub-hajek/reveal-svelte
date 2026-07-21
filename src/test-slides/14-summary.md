# Summary

## What this deck demonstrates

- Component-first slides (`.svelte`) and content-first slides (`.md`)
- A consistent theme (colors + typography)
- A few reusable content blocks (charts, math, code, markdown)

## Markdown quick sample

```ts
type Slide = {
	id: string;
	title: string;
};

export const slides: Slide[] = [{ id: '14-summary', title: 'Summary' }];
```

## Next steps

1. Duplicate this file and rename the prefix to keep ordering
2. Keep slides short: one idea, one visual, one takeaway

## Safety (Sanitization)

<!--
This is intentionally unsafe HTML. It should be removed when Markdown is rendered with sanitization enabled:

<script>alert('xss');</script>
-->
