import type Reveal from 'reveal.js';
import type { FooterConfig } from './slides.js';

export interface LogoConfig {
	src: string;
	alt?: string;
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
	width?: string;
	height?: string;
	inset?: string;
	opacity?: number;
}

export interface RevealConfig extends Reveal.Options {
	footer?: FooterConfig;
	logo?: LogoConfig;
}
