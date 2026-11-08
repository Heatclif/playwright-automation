import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PageFactory } from './PageFactory';
import { LoginPage } from './pages/LoginPage';
import { BASE_URL, USER } from './config';

type TestFixtures = { app: PageFactory };
type WorkerFixtures = { workerStorageState: string };

/**
 * - `baseURL` points at EventHub so pages can use relative paths.
 * - Logs in once per worker and reuses the session via storageState.
 *   For logged-out tests: `test.use({ storageState: { cookies: [], origins: [] } })`.
 * - `app` is the PageFactory giving access to every page object.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  baseURL: BASE_URL,

  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      const file = path.join(workerInfo.project.outputDir, '.auth', `eventhub-${workerInfo.parallelIndex}.json`);
      if (!fs.existsSync(file)) {
        const context = await browser.newContext({ baseURL: BASE_URL, storageState: undefined });
        const page = await context.newPage();
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(USER.email, USER.password);
        await expect(loginPage.nav.userEmail).toHaveText(USER.email);
        await context.storageState({ path: file });
        await context.close();
      }
      await use(file);
    },
    { scope: 'worker' },
  ],

  app: async ({ page }, use) => {
    await use(new PageFactory(page));
  },
});

export { expect };
