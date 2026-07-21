import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SlideFooter from './SlideFooter.svelte';
describe('SlideFooter', () => {
    it('renders presentation name and author name', () => {
        const props = {
            presentationName: 'My Awesome Presentation',
            authorName: 'John Doe'
        };
        render(SlideFooter, { props });
        expect(screen.getByText('My Awesome Presentation')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    it('applies custom class name', () => {
        const props = {
            presentationName: 'A',
            authorName: 'B',
            class: 'custom-class'
        };
        const { container } = render(SlideFooter, { props });
        const footer = container.querySelector('.slide-footer');
        expect(footer).toHaveClass('custom-class');
    });
    it('sets title attribute for truncation tooltips', () => {
        const props = {
            presentationName: 'Long Presentation Name',
            authorName: 'Long Author Name'
        };
        render(SlideFooter, { props });
        const left = screen.getByText('Long Presentation Name');
        const right = screen.getByText('Long Author Name');
        expect(left).toHaveAttribute('title', 'Long Presentation Name');
        expect(right).toHaveAttribute('title', 'Long Author Name');
    });
});
