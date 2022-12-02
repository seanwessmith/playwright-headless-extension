import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
    context: BrowserContext;
    extensionId: string;
}>({
    context: async ({ }, use) => {
        const pathToExtension = path.join(__dirname, '../extensions/' ,'twitch-live');
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--headless=chrome`, // new headless flag
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
            ],
        });
        await use(context);
        await context.close();
    },
    extensionId: async ({ context }, use) => {
        let [background] = context.backgroundPages()
        if (!background)
          background = await context.waitForEvent('backgroundpage')
        const extensionId = background.url().split('/')[2];
        await use(extensionId);
    },
});
export const expect = test.expect;
