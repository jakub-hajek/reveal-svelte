import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Math from './Math.svelte';

describe('Math component', () => {
    it('renders inline math', async () => {
        const { container } = render(Math, {
            props: { latex: 'x^2', displayMode: false }
        });

        await waitFor(() => {
            const math = container.querySelector('.katex');
            expect(math).toBeInTheDocument();
        });
    });

    it('renders block math', async () => {
        const { container } = render(Math, {
            props: { latex: '\\int x dx', displayMode: true }
        });

        await waitFor(() => {
            const math = container.querySelector('.katex-display');
            expect(math).toBeInTheDocument();
        });
    });
});
