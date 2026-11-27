import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { CUSTOMER, FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Booking Flow', { tag: '@ui' }, () => {
  test('AC-BOOK-005: Cancel booking functionality', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, 1);

    await expect(eventDetailsPage.bookingRef).toBeVisible();
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    await eventDetailsPage.nav.goTo('My Bookings');
    await myBookingsPage.cancelBooking(bookingRef);

    await expect(myBookingsPage.message('Booking cancelled successfully')).toBeVisible();
    await expect(myBookingsPage.bookingCard(bookingRef)).toHaveCount(0);
  });
});
