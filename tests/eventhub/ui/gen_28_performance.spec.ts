import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';

test.describe('Performance', { tag: '@ui' }, () => {
  test('AC-PERF-001: Page load time under 3s', async ({ app }) => {
    const start = Date.now();
    await app.homePage.goto();
    await expect(app.homePage.heading).toBeVisible();

    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(3000);
  });

  test('AC-PERF-002: Event card rendering is fast', async ({ app }) => {
    const start = Date.now();
    await app.eventsPage.goto();
    await expect(app.eventsPage.eventCards.first()).toBeVisible();

    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(3000);
  });
});
