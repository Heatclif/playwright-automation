import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Error Handling', { tag: '@ui' }, () => {
  test('AC-ERR-001: 404 page displays correctly', async ({ page }) => {
    await page.goto('/non-existent-route-404');

    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });

  test('AC-ERR-002: Network error handling', async ({ app, page }) => {
    await page.route('**/api/events*', (route) => route.abort());
    await app.eventsPage.goto();

    await expect(app.eventsPage.eventCards).toHaveCount(0);
    await expect(page.getByText(/error|failed|unable|no events/i).first()).toBeVisible();
  });

  test('AC-ERR-003: Form validation errors', async ({ app, page }) => {
    const { eventsPage, eventDetailsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.confirmBookingButton.click();

    await expect(page.locator('input:invalid').first()).toBeVisible();
    await expect(eventDetailsPage.bookingRef).toBeHidden();
  });

  test('AC-ERR-004: Session timeout handling', async ({ app, page }) => {
    await app.homePage.goto();
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await app.myBookingsPage.goto();
    await expect(page).toHaveURL(/\/login/);
    await expect(app.loginPage.heading).toBeVisible();
  });
});
