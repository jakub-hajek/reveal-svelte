import Reveal from 'reveal.js';
import { defaultConfig } from './config.js';
export async function initReveal(config = {}) {
    const mergedConfig = { ...defaultConfig, ...config };
    const deck = new Reveal(mergedConfig);
    await deck.initialize();
    return deck;
}
