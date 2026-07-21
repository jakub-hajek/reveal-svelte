import { test, expect } from '@playwright/test';

test.describe('Presentation Navigation', () => {
	test('should display footer on the first slide', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.slide-footer');

		// Check for presentation name (configured in +page.svelte)
		const footerLeft = page.locator('.slide-footer .footer-left');
		await expect(footerLeft).toBeVisible();
		await expect(footerLeft).toContainText('Svelte Reveal.js Starter Kit');

		// Check for author name
		const footerRight = page.locator('.slide-footer .footer-right');
		await expect(footerRight).toBeVisible();
		await expect(footerRight).toContainText('Kuba Zamek');
	});

	test('should maintain footer after navigating to next slide', async ({ page }) => {
		await page.goto('/');

		// Wait for reveal to initialize
		await page.waitForSelector('.reveal.ready');

		// Press right arrow to navigate
		await page.keyboard.press('ArrowRight');

		// Wait for transition (default is 800ms, using 1500 for safety)
		await page.waitForTimeout(1500);

		// Check footer still exists and contains correct info
		await expect(page.locator('.slide-footer .footer-left')).toContainText(
			'Svelte Reveal.js Starter Kit'
		);
		await expect(page.locator('.slide-footer .footer-right')).toContainText('Kuba Zamek');
	});
});
