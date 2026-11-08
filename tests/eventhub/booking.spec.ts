import { expect, test } from '../../src/eventhub/fixtures';
import { CUSTOMER, FEATURED_EVENT } from '../../src/eventhub/test-data';

test.describe('Bookings', { tag: '@booking' }, () => {
  test('book tickets for an event and cancel the booking', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;
    const tickets = 2;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, tickets);

    await expect(eventDetailsPage.bookingRef).toBeVisible();
    await expect(eventDetailsPage.confirmationValue('Customer')).toHaveText(CUSTOMER.fullName);
    await expect(eventDetailsPage.confirmationValue('Tickets')).toHaveText(String(tickets));
    await expect(eventDetailsPage.confirmationValue('Total')).toHaveText(`$${FEATURED_EVENT.price * tickets}`);
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    await eventDetailsPage.nav.goTo('My Bookings');
    const card = myBookingsPage.bookingCard(bookingRef);
    await expect(card).toContainText(FEATURED_EVENT.title);
    await expect(card).toContainText('confirmed');

    await myBookingsPage.cancelBooking(bookingRef);

    await expect(myBookingsPage.message('Booking cancelled successfully')).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('booking form requires customer details', async ({ app }) => {
    const { eventsPage, eventDetailsPage } = app;

    await eventsPage.goto();
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.confirmBookingButton.click();

    await expect(eventDetailsPage.bookingRef).toBeHidden();
    await expect(eventDetailsPage.confirmBookingButton).toBeVisible();
  });

  // Intentionally flaky (50% pass rate); retries off so the CI-wide retries don't mask it.
  test.describe('Flaky demo', () => {
    test.describe.configure({ retries: 0 });

    test('passes randomly (50% chance)', async () => {
      expect(Math.random() < 0.5, 'INTENTIONAL FLAKY TEST: designed to fail ~50% of the time, not a real defect').toBe(true);
    });
  });
});
