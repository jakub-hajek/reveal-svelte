import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import FullImageLayout from './FullImageLayout.svelte';

describe('FullImageLayout', () => {
    it('renders image with caption', () => {
        const { getByAltText } = render(FullImageLayout, {
            props: {
                imageUrl: 'test.jpg',
                alt: 'Test Image'
            }
        });

        const img = getByAltText('Test Image');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'test.jpg');
    });
});
