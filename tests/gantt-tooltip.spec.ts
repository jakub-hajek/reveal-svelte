import { test, expect, type Page } from '@playwright/test';

/**
 * The hover popup is the one part of the Gantt chart a jsdom test cannot cover:
 * what broke it was hit testing, not markup. A collapsed group emits one
 * full-width `.gantt-lane` wrapper per *bar* rather than per packed lane, so
 * every bar sharing a lane with a later-emitted one sits under that one's
 * wrapper and never sees the pointer unless the wrapper opts out of hit
 * testing. Only a real browser can tell.
 */

async function openSlide(page: Page, heading: string) {
	await page.goto('/');
	await page.waitForSelector('.reveal.ready');
	await page.evaluate((text) => {
		const slides = [...document.querySelectorAll('.slides > section')];
		const index = slides.findIndex((slide) => slide.querySelector('h2')?.textContent?.includes(text));
		if (index < 0) throw new Error(`no slide titled ${text}`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).Reveal.slide(index);
	}, heading);
	await page.waitForTimeout(1000);
}

test.describe('Gantt hover popup', () => {
	test('opens for a bar packed under a lane-mate in a collapsed group', async ({ page }) => {
		await openSlide(page, 'Collapsible Groups');

		// first of three back-to-back tasks packed onto one lane of the collapsed
		// "Dokumentace" group — the last of the three is the one that used to roof
		// over the other two
		const bar = page.locator('.gantt-bar[aria-label^="Analýza požadavků"]');
		await expect(bar).toBeVisible();
		await bar.hover();

		await expect(page.locator('.gantt-tooltip-title')).toHaveText('Analýza požadavků');
	});

	test('leaves every bar reachable by the pointer', async ({ page }) => {
		await openSlide(page, 'Collapsible Groups');

		const unreachable = await page.evaluate(() => {
			const bars = [...document.querySelectorAll('.reveal .present .gantt-bar, .reveal .present .gantt-milestone')];
			return bars
				.filter((bar) => {
					const box = bar.getBoundingClientRect();
					const hit = document.elementFromPoint(
						box.left + box.width / 2,
						box.top + box.height / 2
					);
					// a hit on the bar's own progress fill still reaches the bar
					return hit !== bar && !bar.contains(hit);
				})
				.map((bar) => bar.getAttribute('aria-label'));
		});

		expect(unreachable).toEqual([]);
	});
});
