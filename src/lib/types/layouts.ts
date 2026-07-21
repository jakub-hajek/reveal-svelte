import type { Snippet } from 'svelte';

export interface TitleSlideProps {
	title: string;
	subtitle?: string;
	author?: string;
	date?: string;
	background?: string;
	transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
}

export interface TwoColumnLayoutProps {
	left: Snippet;
	right: Snippet;
	splitRatio?: string;
	gap?: string;
	background?: string;
	transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
}

export interface FullImageLayoutProps {
	imageUrl: string;
	alt?: string;
	overlay?: Snippet;
	overlayPosition?: 'top' | 'center' | 'bottom';
	darken?: number;
	background?: string;
	transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
}

export interface GridLayoutProps {
	items: Array<{ id: string; content: Snippet | string }>;
	columns?: number;
	gap?: string;
	background?: string;
	transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
}
