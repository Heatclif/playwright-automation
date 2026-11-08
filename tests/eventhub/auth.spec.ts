import { expect, test } from '../../src/eventhub/fixtures';
import { USER } from '../../src/eventhub/config';

test.describe('Authentication', { tag: '@auth' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ app }) => {
    await app.loginPage.goto();
  });

  test('user can log in with valid credentials', async ({ app, page }) => {
    await app.loginPage.login(USER.email, USER.password);

    await expect(page).toHaveURL('/');
    await expect(app.homePage.heading).toHaveText(/Discover & Book\s*Amazing Events/);
    await expect(app.homePage.nav.userEmail).toHaveText(USER.email);
  });

  test('shows an error for a wrong password', async ({ app, page }) => {
    await app.loginPage.login(USER.email, 'wrong-password');

    await expect(app.loginPage.message('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('validates the email format', async ({ app }) => {
    await app.loginPage.login('not-an-email', 'whatever');

    await expect(app.loginPage.message('Enter a valid email')).toBeVisible();
  });

  test('user can log out', async ({ app, page }) => {
    await app.loginPage.login(USER.email, USER.password);
    await expect(app.homePage.nav.userEmail).toBeVisible();

    await app.homePage.nav.logout();

    await expect(page).toHaveURL(/\/login/);
    await expect(app.loginPage.heading).toBeVisible();
  });

  // Intentionally flaky (50% pass rate); retries off so the CI-wide retries don't mask it.
  test.describe('Flaky demo', () => {
    test.describe.configure({ retries: 0 });

    test('passes randomly (50% chance)', async () => {
      expect(Math.random() < 0.5, 'INTENTIONAL FLAKY TEST: designed to fail ~50% of the time, not a real defect').toBe(true);
    });
  });
});
