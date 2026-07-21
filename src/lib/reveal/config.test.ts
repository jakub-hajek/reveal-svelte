import { describe, it, expect } from 'vitest';
import { defaultConfig } from './config';

describe('defaultConfig', () => {
    it('has standard reveal.js defaults', () => {
        expect(defaultConfig.width).toBe(960);
        expect(defaultConfig.height).toBe(700);
        expect(defaultConfig.center).toBe(true);
        expect(defaultConfig.transition).toBe('slide');
    });

    it('includes default footer configuration', () => {
        expect(defaultConfig.footer).toBeDefined();
        expect(defaultConfig.footer?.presentationName).toBe('Reveal.js Presentation');
        expect(defaultConfig.footer?.authorName).toBe('Author');
    });
});
