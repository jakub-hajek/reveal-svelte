import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import TitleSlide from './TitleSlide.svelte';
describe('TitleSlide', () => {
    it('renders title and subtitle', () => {
        const { getByText } = render(TitleSlide, {
            props: {
                title: 'Main Title',
                subtitle: 'Sub Title'
            }
        });
        expect(getByText('Main Title')).toBeInTheDocument();
        expect(getByText('Sub Title')).toBeInTheDocument();
    });
});
