import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import BaseSlide from './BaseSlide.svelte';
describe('BaseSlide', () => {
    it('renders section with data attributes', () => {
        const { container } = render(BaseSlide, {
            props: {
                background: 'red',
                transition: 'fade',
                dataAutoAnimate: true
            }
        });
        const section = container.querySelector('section');
        expect(section?.getAttribute('data-background')).toBe('red');
        expect(section?.getAttribute('data-transition')).toBe('fade');
        expect(section?.getAttribute('data-auto-animate')).toBe('');
    });
    it('does not render SlideFooter when footerConfig is missing', () => {
        const { container } = render(BaseSlide);
        expect(container.querySelector('.slide-footer')).toBeNull();
    });
});
