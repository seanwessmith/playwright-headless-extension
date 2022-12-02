import { test, expect } from './fixtures';

test('popup page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('h1')).toHaveText('Twitch Live Extension Options');
});
