import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';

test.describe('Home Page / Events Listing', { tag: '@ui' }, () => {
  test('AC-HOME-005: Pagination works correctly', async ({ app, page }) => {
    await app.eventsPage.goto();

    await expect(page).toHaveURL(/\/events/);
    await expect(app.eventsPage.eventCards.first()).toBeVisible();

    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
    const firstCardBefore = (await app.eventsPage.eventCards.first().textContent()) ?? '';
    await nextButton.click();
    await expect(app.eventsPage.eventCards.first()).toBeVisible();
    await expect(app.eventsPage.eventCards.first()).not.toHaveText(firstCardBefore);
  });
});
