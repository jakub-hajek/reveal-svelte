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

export interface ThemeToggleConfig {
	/** Theme to use before any stored preference exists. Defaults to the visitor's OS preference, falling back to 'dark'. */
	default?: 'dark' | 'light';
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
	inset?: string;
}

export interface RevealConfig extends Reveal.Options {
	footer?: FooterConfig;
	logo?: LogoConfig;
	themeToggle?: ThemeToggleConfig;
}
