import Reveal from 'reveal.js';
import type { RevealConfig } from '../types/reveal.js';
import { defaultConfig } from './config.js';

export async function initReveal(config: Partial<RevealConfig> = {}): Promise<Reveal.Api> {
	const mergedConfig = { ...defaultConfig, ...config };
	const deck = new Reveal(mergedConfig);
	await deck.initialize();
	return deck;
}
