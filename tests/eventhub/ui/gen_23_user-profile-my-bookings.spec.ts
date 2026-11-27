import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { CUSTOMER, FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('User Profile / My Bookings', { tag: '@ui' }, () => {
  test('AC-PROFILE-001: My bookings page loads', async ({ app, page }) => {
    await app.myBookingsPage.goto();

    await expect(page).toHaveURL(/\/bookings/);
    await expect(app.myBookingsPage.heading).toBeVisible();
  });

  test('AC-PROFILE-002: Bookings list displays correctly', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, 1);

    await expect(eventDetailsPage.bookingRef).toBeVisible();
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    await eventDetailsPage.nav.goTo('My Bookings');
    const card = myBookingsPage.bookingCard(bookingRef);
    await expect(card).toBeVisible();
    await expect(card).toContainText(FEATURED_EVENT.title);

    await myBookingsPage.cancelBooking(bookingRef);
    await expect(card).toHaveCount(0);
  });

  test('AC-PROFILE-003: Cancel booking from profile', async ({ app }) => {
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

  test('AC-PROFILE-004: Booking status indicators', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, 1);

    await expect(eventDetailsPage.bookingRef).toBeVisible();
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    await eventDetailsPage.nav.goTo('My Bookings');
    const card = myBookingsPage.bookingCard(bookingRef);
    await expect(card).toContainText('confirmed');

    await myBookingsPage.cancelBooking(bookingRef);
    await expect(card).toHaveCount(0);
  });
});
