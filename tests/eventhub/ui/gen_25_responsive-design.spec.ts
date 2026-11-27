import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';

test.describe('Responsive Design', { tag: '@ui' }, () => {
  test('AC-RESP-001: Page renders on mobile', async ({ app, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await app.homePage.goto();

    await expect(app.homePage.heading).toBeVisible();
    await expect(app.homePage.browseEventsLink).toBeVisible();
  });

  test('AC-RESP-002: Page renders on tablet', async ({ app, page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await app.homePage.goto();

    await expect(app.homePage.heading).toBeVisible();
    await expect(app.homePage.browseEventsLink).toBeVisible();
  });

  test('AC-RESP-003: Navigation works on all sizes', async ({ app, page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await app.homePage.goto();
    await app.homePage.nav.goTo('Events');
    await expect(page).toHaveURL(/\/events/);

    await page.setViewportSize({ width: 375, height: 667 });
    await app.homePage.goto();
    await app.homePage.browseEventsLink.click();
    await expect(page).toHaveURL(/\/events/);
  });

  test('AC-RESP-004: Touch targets are appropriate', async ({ app, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await app.homePage.goto();

    const box = await app.homePage.browseEventsLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
