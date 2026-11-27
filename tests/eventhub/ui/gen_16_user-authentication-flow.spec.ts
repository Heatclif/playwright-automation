import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { USER } from '../../../src/eventhub/config';

test.describe('User Authentication Flow', { tag: '@ui' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ app }) => {
    await app.loginPage.goto();
  });

  test('AC-LOGIN-001: Valid credentials authenticate the user', async ({ app, page }) => {
    await app.loginPage.login(USER.email, USER.password);

    await expect(page).toHaveURL('/');
    await expect(app.homePage.heading).toBeVisible();
    await expect(app.homePage.nav.userEmail).toHaveText(USER.email);
  });

  test('AC-LOGIN-002: Invalid credentials show error message', async ({ app, page }) => {
    await app.loginPage.login(USER.email, 'wrong-password');

    await expect(app.loginPage.message('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('AC-LOGIN-003: Password field masks input', async ({ app }) => {
    await expect(app.loginPage.form.field('Password')).toHaveAttribute('type', 'password');
  });

  test('AC-LOGIN-004: "Remember me" checkbox functionality', async ({ app, page }) => {
    await app.loginPage.login(USER.email, USER.password);
    await expect(app.homePage.nav.userEmail).toHaveText(USER.email);

    await page.reload();
    await expect(app.homePage.nav.userEmail).toHaveText(USER.email);
  });
});
