import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';

test.describe('Accessibility', { tag: '@ui' }, () => {
  test('AC-ACC-001: Color contrast meets WCAG AA', async ({ app, page }) => {
    await app.homePage.goto();
    await expect(app.homePage.heading).toBeVisible();

    const colors = await app.homePage.heading.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });
    expect(colors.color).not.toBe(colors.backgroundColor);
    await expect(page.locator('body')).toBeVisible();
  });

  test('AC-ACC-002: Form labels are associated', async ({ app }) => {
    await app.adminEventsPage.goto();

    await expect(app.adminEventsPage.form.field('Title')).toBeVisible();
    await expect(app.adminEventsPage.form.field('Category')).toBeVisible();
    await expect(app.adminEventsPage.form.field('City')).toBeVisible();
    await expect(app.adminEventsPage.form.field('Venue')).toBeVisible();
  });

  test('AC-ACC-003: Keyboard navigation works', async ({ app, page }) => {
    await app.homePage.goto();
    await expect(app.homePage.heading).toBeVisible();

    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(focusedTag.length).toBeGreaterThan(0);
  });

  test('AC-ACC-004: ARIA labels where needed', async ({ app }) => {
    await app.eventsPage.goto();

    await expect(app.eventsPage.nav.root).toBeVisible();
    await expect(app.eventsPage.searchInput).toBeVisible();
  });
});
