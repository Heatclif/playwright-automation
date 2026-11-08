import { expect, test } from '../../src/eventhub/fixtures';
import { FEATURED_EVENT } from '../../src/eventhub/test-data';

test.describe('Browse events', { tag: '@events' }, () => {
  test.beforeEach(async ({ app }) => {
    await app.homePage.goto();
    await app.homePage.nav.goTo('Events');
  });

  test('search finds an event by title', async ({ app }) => {
    const { eventsPage } = app;

    await eventsPage.search(FEATURED_EVENT.title);

    await expect(eventsPage.eventCard(FEATURED_EVENT.title)).toBeVisible();
    await expect(eventsPage.eventCards.filter({ hasNotText: FEATURED_EVENT.title })).toHaveCount(0);
  });

  test('category filter shows only matching events', async ({ app }) => {
    const { eventsPage } = app;

    await eventsPage.filterBy('category', FEATURED_EVENT.category);

    await expect(eventsPage.eventCard(FEATURED_EVENT.title)).toBeVisible();
    await expect(eventsPage.eventCards.filter({ hasNotText: FEATURED_EVENT.category })).toHaveCount(0);
  });

  test('city filter shows only events in that city', async ({ app }) => {
    const { eventsPage } = app;

    await eventsPage.filterBy('city', FEATURED_EVENT.city);

    await expect(eventsPage.eventCard(FEATURED_EVENT.title)).toBeVisible();
    await expect(eventsPage.eventCards.filter({ hasNotText: FEATURED_EVENT.city })).toHaveCount(0);
  });

  test('Book Now opens the event details page', async ({ app, page }) => {
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(page).toHaveURL(/\/events\/\d+/);
    await expect(app.eventDetailsPage.title).toHaveText(FEATURED_EVENT.title);
    await expect(app.eventDetailsPage.confirmBookingButton).toBeVisible();
  });
});
