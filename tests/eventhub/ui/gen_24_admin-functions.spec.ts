import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { buildEvent } from '../../../src/eventhub/ui/test-data';

test.describe('Admin Functions', { tag: '@ui' }, () => {
  test.beforeEach(async ({ app }) => {
    await app.adminEventsPage.goto();
  });

  test('AC-ADMIN-001: Admin can create new event', async ({ app }) => {
    const { adminEventsPage } = app;
    const event = buildEvent({ category: 'Conference', price: 25 });

    await adminEventsPage.createEvent(event);

    await expect(adminEventsPage.message('Event created!')).toBeVisible();
    const row = adminEventsPage.eventRow(event.title);
    await expect(row).toContainText(event.category);
    await expect(row).toContainText(event.city);

    await adminEventsPage.deleteEvent(event.title);
    await expect(row).toHaveCount(0);
  });

  test('AC-ADMIN-002: Admin can edit existing event', async ({ app }) => {
    const { adminEventsPage } = app;
    const event = buildEvent();
    const updatedTitle = `${event.title} Updated`;

    await adminEventsPage.createEvent(event);
    await expect(adminEventsPage.message('Event created!')).toBeVisible();

    await adminEventsPage.editEvent(event.title);
    await adminEventsPage.form.fill('Title', updatedTitle);
    await adminEventsPage.form.root.locator('button[type="submit"]').click();

    await expect(adminEventsPage.eventRow(updatedTitle)).toBeVisible();

    await adminEventsPage.deleteEvent(updatedTitle);
    await expect(adminEventsPage.eventRow(updatedTitle)).toHaveCount(0);
  });

  test('AC-ADMIN-003: Admin can delete event', async ({ app }) => {
    const { adminEventsPage } = app;
    const event = buildEvent();

    await adminEventsPage.createEvent(event);
    await expect(adminEventsPage.message('Event created!')).toBeVisible();

    await adminEventsPage.deleteEvent(event.title);
    await expect(adminEventsPage.eventRow(event.title)).toHaveCount(0);
  });

  test('AC-ADMIN-004: Admin permissions check', async ({ app, page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await app.adminEventsPage.goto();
    await expect(page).toHaveURL(/\/login/);
    await expect(app.loginPage.heading).toBeVisible();
  });
});
