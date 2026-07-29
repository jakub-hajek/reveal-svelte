import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import ThemeToggle from './ThemeToggle.svelte';

function mockMatchMedia(prefersLight: boolean) {
	window.matchMedia = ((query: string) => ({
		matches: query.includes('light') ? prefersLight : !prefersLight,
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {}
	})) as unknown as typeof window.matchMedia;
}

describe('ThemeToggle', () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		mockMatchMedia(false);
	});

	it('defaults to dark when there is no stored preference or config default', () => {
		render(ThemeToggle);
		expect(document.documentElement.dataset.theme).toBe('dark');
	});

	it('honors the OS light preference when no preference is stored', () => {
		mockMatchMedia(true);
		render(ThemeToggle);
		expect(document.documentElement.dataset.theme).toBe('light');
	});

	it('honors config.default over the OS preference', () => {
		mockMatchMedia(true);
		render(ThemeToggle, { props: { config: { default: 'dark' } } });
		expect(document.documentElement.dataset.theme).toBe('dark');
	});

	it('honors a stored preference over config.default', () => {
		window.localStorage.setItem('reveal-svelte-theme', 'light');
		render(ThemeToggle, { props: { config: { default: 'dark' } } });
		expect(document.documentElement.dataset.theme).toBe('light');
	});

	it('toggles the theme and persists the choice on click', async () => {
		const { getByRole } = render(ThemeToggle);
		expect(document.documentElement.dataset.theme).toBe('dark');

		const button = getByRole('button');
		await fireEvent.click(button);

		expect(document.documentElement.dataset.theme).toBe('light');
		expect(window.localStorage.getItem('reveal-svelte-theme')).toBe('light');

		await fireEvent.click(button);

		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(window.localStorage.getItem('reveal-svelte-theme')).toBe('dark');
	});

	it('positions itself in the requested corner', () => {
		const { getByRole } = render(ThemeToggle, { props: { config: { position: 'top-left' } } });
		expect(getByRole('button').getAttribute('style')).toContain('top: 20px; left: 20px;');
	});
});
