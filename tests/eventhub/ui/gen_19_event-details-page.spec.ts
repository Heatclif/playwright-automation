import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { buildEvent, FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Event Details Page', { tag: '@ui' }, () => {
  test('AC-EVENT-001: Event details page loads', async ({ app, page }) => {
    await app.eventsPage.goto();
    await app.eventsPage.search(FEATURED_EVENT.title);
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(page).toHaveURL(/\/events\/\d+/);
    await expect(app.eventDetailsPage.title).toHaveText(FEATURED_EVENT.title);
  });

  test('AC-EVENT-002: Event details display correctly', async ({ app, page }) => {
    await app.eventsPage.goto();
    await app.eventsPage.search(FEATURED_EVENT.title);
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(app.eventDetailsPage.title).toHaveText(FEATURED_EVENT.title);
    await expect(app.eventDetailsPage.seatsAvailable).toBeVisible();
    await expect(app.eventDetailsPage.totalPrice).toBeVisible();
    await expect(page.getByText(FEATURED_EVENT.city)).toBeVisible();
  });

  test('AC-EVENT-003: Book event button functionality', async ({ app, page }) => {
    await app.eventsPage.goto();
    await app.eventsPage.search(FEATURED_EVENT.title);
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(page).toHaveURL(/\/events\/\d+/);
    await expect(app.eventDetailsPage.confirmBookingButton).toBeVisible();
    await expect(app.eventDetailsPage.confirmBookingButton).toBeEnabled();
  });

  test('AC-EVENT-004: Delete event option (admin)', async ({ app }) => {
    const { adminEventsPage } = app;
    const event = buildEvent();

    await adminEventsPage.goto();
    await adminEventsPage.createEvent(event);
    await expect(adminEventsPage.message('Event created!')).toBeVisible();

    await adminEventsPage.deleteEvent(event.title);
    await expect(adminEventsPage.eventRow(event.title)).toHaveCount(0);
  });
});
