import { expect, test } from '../../src/eventhub/fixtures';
import { buildEvent, CUSTOMER } from '../../src/eventhub/test-data';

test.describe('Admin - manage events', { tag: '@admin_event' }, () => {
  test.beforeEach(async ({ app }) => {
    await app.homePage.goto();
    await app.homePage.nav.goToAdmin('Manage Events');
  });

  test('admin can create and delete an event', async ({ app }) => {
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

  test('created event can be found and booked by a user', async ({ app }) => {
    const { adminEventsPage, eventsPage, eventDetailsPage, myBookingsPage } = app;
    const event = buildEvent();

    await adminEventsPage.createEvent(event);
    await expect(adminEventsPage.message('Event created!')).toBeVisible();

    await adminEventsPage.nav.goTo('Events');
    await eventsPage.search(event.title);
    await eventsPage.bookEvent(event.title);
    await eventDetailsPage.book(CUSTOMER);

    await expect(eventDetailsPage.confirmationValue('Total')).toHaveText(`$${event.price}`);
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    // Clean up: cancel the booking and delete the event.
    await eventDetailsPage.nav.goTo('My Bookings');
    await myBookingsPage.cancelBooking(bookingRef);
    await expect(myBookingsPage.bookingCard(bookingRef)).toHaveCount(0);

    await myBookingsPage.nav.goToAdmin('Manage Events');
    await adminEventsPage.deleteEvent(event.title);
    await expect(adminEventsPage.eventRow(event.title)).toHaveCount(0);
  });

  // Intentionally flaky (50% pass rate); retries off so the CI-wide retries don't mask it.
  test.describe('Flaky demo', () => {
    test.describe.configure({ retries: 0 });

    test('passes randomly (50% chance)', async () => {
      expect(Math.random() < 0.5, 'INTENTIONAL FLAKY TEST: designed to fail ~50% of the time, not a real defect').toBe(true);
    });
  });
});
