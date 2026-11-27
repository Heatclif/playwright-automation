import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Home Page / Events Listing', { tag: '@ui' }, () => {
  test.beforeEach(async ({ app }) => {
    await app.eventsPage.goto();
  });

  test('AC-HOME-001: Events page loads successfully', async ({ app, page }) => {
    await expect(page).toHaveURL(/\/events/);
    await expect(app.eventsPage.eventCards.first()).toBeVisible();
  });

  test('AC-HOME-002: Event cards display correct information', async ({ app }) => {
    const card = app.eventsPage.eventCard(FEATURED_EVENT.title);

    await expect(card).toBeVisible();
    await expect(card).toContainText(FEATURED_EVENT.category);
    await expect(card).toContainText(FEATURED_EVENT.city);
    await expect(card).toContainText(String(FEATURED_EVENT.price));
  });

  test('AC-HOME-003: Filter by category works', async ({ app }) => {
    await app.eventsPage.filterBy('category', FEATURED_EVENT.category);

    await expect(app.eventsPage.eventCard(FEATURED_EVENT.title)).toBeVisible();
    await expect(app.eventsPage.eventCards.filter({ hasNotText: FEATURED_EVENT.category })).toHaveCount(0);
  });

  test('AC-HOME-004: Search events by keyword', async ({ app }) => {
    await app.eventsPage.search(FEATURED_EVENT.title);

    await expect(app.eventsPage.eventCard(FEATURED_EVENT.title)).toBeVisible();
    await expect(app.eventsPage.eventCards.filter({ hasNotText: FEATURED_EVENT.title })).toHaveCount(0);
  });
});
