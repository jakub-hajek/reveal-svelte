import type { ComponentType } from 'svelte';

export interface Slide {
	id: string;
	order: string;
	component: ComponentType;
	title?: string;
}

export interface SlideModule {
	default: ComponentType;
	metadata?: {
		title?: string;
		order?: number;
	};
}

export interface BaseSlideEntry {
	/** Stable identifier used for routing, anchors, and persistence. */
	id: string;
	/** Sort key (often derived from filename) used for deck ordering. */
	order: string;
	title?: string;
}

export interface SlideComponentEntry extends BaseSlideEntry {
	type: 'component';
	component: ComponentType;
}

export interface SlideMarkdownEntry extends BaseSlideEntry {
	type: 'markdown';
	/** Raw markdown content to render. */
	markdown: string;
	/** Optional source path (e.g. '/src/slides/10-intro.md') for diagnostics. */
	sourcePath?: string;
}

export type SlideEntry = SlideComponentEntry | SlideMarkdownEntry;

export interface FooterConfig {
	presentationName: string;
	authorName: string;
}

export interface SlideFooterProps {
	presentationName: string;
	authorName: string;
	class?: string;
}
