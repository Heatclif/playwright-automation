import { expect, test } from '../../src/eventhub/fixtures';
import { USER } from '../../src/eventhub/config';

/**
 * Deliberately unreliable tests, useful for checking how reports, retries and
 * history (e.g. Allure) show failures. Not part of the regular regression matrix.
 */
test.describe('Failing demo', { tag: '@failing_demo' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  // Failures here are intentional, so never retry them (overrides the CI-wide retries).
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ app }) => {
    await app.loginPage.goto();
  });

  test('always fails: login with wrong credentials is expected to succeed', async ({ app, page }) => {
    await app.loginPage.login(USER.email, `${USER.password}-wrong`);

    // The login is rejected, so this assertion fails every time.
    await expect(page).toHaveURL('/');
  });

  test('fails randomly (50% chance): password gets a random extra suffix', async ({ app, page }) => {
    const breakPassword = Math.random() < 0.5;
    const password = breakPassword ? `${USER.password}-extra` : USER.password;
    test.info().annotations.push({ type: 'password-modified', description: String(breakPassword) });

    await app.loginPage.login(USER.email, password);

    await expect(page).toHaveURL('/');
    await expect(app.homePage.nav.userEmail).toHaveText(USER.email);
  });
});
