import type { RevealConfig } from '../types/reveal.js';

export const defaultConfig: RevealConfig = {
	width: 960,
	height: 700,
	margin: 0.04,
	minScale: 0.2,
	maxScale: 2.0,
	display: 'flex',
	controls: true,
	progress: true,
	slideNumber: false,
	transition: 'slide',
	transitionSpeed: 'default',
	backgroundTransition: 'fade',
	center: true,
	embedded: false,
	keyboard: true,
	overview: true,
	touch: true,
	loop: false,
	rtl: false,
	shuffle: false,
	fragments: true,
	autoSlide: 0,
	footer: {
		presentationName: 'Reveal.js Presentation',
		authorName: 'Author'
	}
};
