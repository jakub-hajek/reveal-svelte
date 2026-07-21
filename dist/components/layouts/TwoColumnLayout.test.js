import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SnippetWrapper from '../SnippetWrapper.test.svelte';
import TwoColumnLayout from './TwoColumnLayout.svelte';
describe('TwoColumnLayout', () => {
    it('renders left and right snippets via wrapper', () => {
        const { getByText, container } = render(SnippetWrapper, {
            props: {
                component: TwoColumnLayout,
                props: {
                    splitRatio: '60% 40%'
                }
            }
        });
        expect(getByText('Left Content')).toBeInTheDocument();
        expect(getByText('Right Content')).toBeInTheDocument();
        const layout = container.querySelector('.two-column-layout');
        expect(layout).toHaveStyle('grid-template-columns: 60% 40%');
    });
});
