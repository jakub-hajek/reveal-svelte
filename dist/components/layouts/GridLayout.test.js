import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import GridLayout from './GridLayout.svelte';
describe('GridLayout', () => {
    it('applies grid styles and renders items', () => {
        const { container, getByText } = render(GridLayout, {
            props: {
                items: [
                    { id: '1', content: 'Item 1' },
                    { id: '2', content: 'Item 2' }
                ],
                columns: 3,
                gap: '2rem'
            }
        });
        const grid = container.querySelector('.grid-layout');
        expect(grid).toHaveStyle('grid-template-columns: repeat(3, 1fr)');
        expect(grid).toHaveStyle('gap: 2rem');
        expect(getByText('Item 1')).toBeInTheDocument();
        expect(getByText('Item 2')).toBeInTheDocument();
    });
});
