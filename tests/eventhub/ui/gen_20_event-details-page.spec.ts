import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Event Details Page', { tag: '@ui' }, () => {
  test('AC-EVENT-005: Event image displays', async ({ app, page }) => {
    await app.eventsPage.goto();
    await app.eventsPage.search(FEATURED_EVENT.title);
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(app.eventDetailsPage.title).toHaveText(FEATURED_EVENT.title);
    const eventImage = page.locator('img').first();
    await expect(eventImage).toBeVisible();
    await expect(eventImage).toHaveAttribute('alt', /.+/);
  });
});
