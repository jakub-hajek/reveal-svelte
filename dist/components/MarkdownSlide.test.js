import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MarkdownSlide from './MarkdownSlide.svelte';
describe('MarkdownSlide', () => {
    it('renders markdown content', async () => {
        const { getByText } = render(MarkdownSlide, {
            props: { content: '# Markdown Title' }
        });
        // Use longer timeout and check for text
        await waitFor(() => {
            const el = getByText('Markdown Title');
            expect(el).toBeInTheDocument();
        }, { timeout: 3000 });
    });
    it('sanitizes dangerous content', async () => {
        const { container } = render(MarkdownSlide, {
            props: { content: '[xss](javascript:alert(1))' }
        });
        await waitFor(() => {
            const link = container.querySelector('a');
            expect(link).toBeInTheDocument();
            const href = link?.getAttribute('href');
            expect(href === null || href === '' || href === 'undefined').toBe(true);
        }, { timeout: 3000 });
    });
});
