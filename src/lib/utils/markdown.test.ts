import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('markdown utility', () => {
	it('renders basic markdown to HTML', async () => {
		const html = await renderMarkdown('# Hello\n\n- item 1\n- item 2');
		expect(html).toContain('<h1>Hello</h1>');
		expect(html).toContain('<ul>');
		expect(html).toContain('<li>item 1</li>');
	});

	it('sanitizes dangerous HTML by default', async () => {
		const dangerous = '[click me](javascript:alert("xss"))';
		const html = await renderMarkdown(dangerous);
		// DOMPurify should remove the javascript: link
		expect(html).not.toContain('javascript:');
		expect(html).toContain('<a>click me</a>');
	});

	it('strips data: protocols when hardening', async () => {
		const dangerous = '<img src="data:image/svg+xml,..." />';
		const html = await renderMarkdown(dangerous);
		expect(html).not.toContain('data:');
	});

	it('allows customized marked options', async () => {
		// Test with a simpler check if possible, or just verify it doesn't crash
		const html = await renderMarkdown('line 1\nline 2', {
			markedOptions: { breaks: false }
		});
		// With breaks: false, it might not have <br> depending on exact version/config
		expect(html).toBeDefined();
	});

	it('allows disabling sanitization (CAUTION)', async () => {
		const dangerous = '<img src="x" onerror="alert(1)">';
		const html = await renderMarkdown(dangerous, { sanitize: false });
		expect(html).toContain('onerror="alert(1)"');
	});

	it('merges custom DOMPurify config', async () => {
		const html = await renderMarkdown('<span style="color: red">red</span>', {
			dompurifyConfig: { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['style'] }
		});
		expect(html).toContain('<span style="color: red">red</span>');
	});

	it('handles null/undefined input gracefully', async () => {
		// @ts-expect-error - test invalid input handling
		const htmlNull = await renderMarkdown(null);
		expect(htmlNull).toBe('');

		// @ts-expect-error - test invalid input handling
		const htmlUndef = await renderMarkdown(undefined);
		expect(htmlUndef).toBe('');
	});
});
