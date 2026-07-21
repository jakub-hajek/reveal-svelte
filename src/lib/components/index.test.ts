import { describe, it, expect } from 'vitest';
import * as components from './index';

describe('components index', () => {
    it('exports core components', () => {
        expect(components.BaseSlide).toBeDefined();
        expect(components.MarkdownSlide).toBeDefined();
        expect(components.TitleSlide).toBeDefined();
    });
});
