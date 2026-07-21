import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import RevealWrapper from './RevealWrapper.svelte';

// Mock reveal.js using a formal class to satisfy the 'new' constructor call
vi.mock('reveal.js', () => {
	return {
		default: class {
			initialize = vi.fn().mockResolvedValue(undefined);
			destroy = vi.fn();
			on = vi.fn();
			off = vi.fn();
		}
	};
});

describe('RevealWrapper', () => {
	it('renders reveal container', () => {
		const { container } = render(RevealWrapper);
		expect(container.querySelector('.reveal')).not.toBeNull();
		expect(container.querySelector('.slides')).not.toBeNull();
	});
});
