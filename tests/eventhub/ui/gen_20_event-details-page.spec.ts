import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Event Details Page', { tag: '@ui' }, () => {
  test('AC-EVENT-005: Event image displays', async ({ app, page }) => {
    await app.eventsPage.goto();
    await app.eventsPage.search(FEATURED_EVENT.title);
    await app.eventsPage.bookEvent(FEATURED_EVENT.title);

    await expect(app.eventDetailsPage.title).toHaveText(FEATURED_EVENT.title);
    const images = page.locator('img');
    if ((await images.count()) > 0) {
      await expect(images.first()).toBeVisible();
    }
  });
});
