import { describe, it, expect } from 'vitest';
import {
	extractSlideStem,
	parseNumericPrefix,
	compareEntries,
	createMarkdownSlides
} from './slides';

describe('slides utility logic', () => {
	describe('extractSlideStem', () => {
		it('extracts stem from svelte files', () => {
			expect(extractSlideStem('/src/slides/01-intro.svelte', 'svelte')).toBe('01-intro');
		});

		it('extracts stem from markdown files', () => {
			expect(extractSlideStem('/src/slides/03-logic.md', 'md')).toBe('03-logic');
		});

		it('handles files without expected prefix', () => {
			expect(extractSlideStem('test.svelte', 'svelte')).toBe('test.svelte');
		});
	});

	describe('parseNumericPrefix', () => {
		it('parses numeric prefixes', () => {
			expect(parseNumericPrefix('01-test')).toEqual({ hasPrefix: true, prefix: 1, rest: 'test' });
			expect(parseNumericPrefix('test')).toEqual({
				hasPrefix: false,
				prefix: Number.POSITIVE_INFINITY,
				rest: 'test'
			});
		});
	});

	describe('compareEntries', () => {
		it('sorts by numeric order', () => {
			const a = { order: '01-a', type: 'component' as const, id: 'a' };
			const b = { order: '02-b', type: 'markdown' as const, id: 'b' };
			expect(compareEntries(a, b)).toBeLessThan(0);
		});

		it('sorts components before markdown on same order', () => {
			const a = { order: 'same', type: 'component' as const, id: 'comp' };
			const b = { order: 'same', type: 'markdown' as const, id: 'md' };
			expect(compareEntries(a, b)).toBeLessThan(0);
		});
	});

	describe('createMarkdownSlides', () => {
		it('handles ID collisions and disambiguation', () => {
			const markdownModules = {
				'/src/slides/collision.md': 'content',
				'/src/slides/collision--md.md': 'content 2'
			};
			const componentIds = new Set(['collision']);

			const result = createMarkdownSlides(markdownModules, componentIds);

			expect(result[0].id).toBe('collision--md');
			expect(result[1].id).toBe('collision--md--md');
		});
	});
});
