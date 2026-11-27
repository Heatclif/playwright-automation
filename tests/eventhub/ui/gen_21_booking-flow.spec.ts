import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';
import { CUSTOMER, FEATURED_EVENT } from '../../../src/eventhub/ui/test-data';

test.describe('Booking Flow', { tag: '@ui' }, () => {
  test('AC-BOOK-001: User can book an event', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, 1);

    await expect(eventDetailsPage.bookingRef).toBeVisible();
    const bookingRef = await eventDetailsPage.bookingRef.innerText();

    await eventDetailsPage.nav.goTo('My Bookings');
    await myBookingsPage.cancelBooking(bookingRef);
    await expect(myBookingsPage.bookingCard(bookingRef)).toHaveCount(0);
  });

  test('AC-BOOK-002: Seat selection works', async ({ app }) => {
    const { eventsPage, eventDetailsPage } = app;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);

    for (const tickets of [3, 2, 1]) {
      await eventDetailsPage.setTickets(tickets);
      await expect(eventDetailsPage.ticketCount).toHaveText(String(tickets));
    }
  });

  test('AC-BOOK-003: Price calculation is correct', async ({ app }) => {
    const { eventsPage, eventDetailsPage } = app;
    const totalFor = (tickets: number) => `$${(FEATURED_EVENT.price * tickets).toLocaleString('en-US')}`;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await expect(eventDetailsPage.totalPrice).toHaveText(totalFor(1));

    for (const tickets of [2, 4]) {
      await eventDetailsPage.setTickets(tickets);
      await expect(eventDetailsPage.totalPrice).toHaveText(totalFor(tickets));
    }
  });

  test('AC-BOOK-004: Booking confirmation displayed', async ({ app }) => {
    const { eventsPage, eventDetailsPage, myBookingsPage } = app;
    const tickets = 2;

    await eventsPage.goto();
    await eventsPage.search(FEATURED_EVENT.title);
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.book(CUSTOMER, tickets);

    await expect(eventDetailsPage.confirmationPanel).toBeVisible();
    await expect(eventDetailsPage.bookingRef).toBeVisible();
    await expect(eventDetailsPage.confirmationValue('Customer')).toHaveText(CUSTOMER.fullName);
    await expect(eventDetailsPage.confirmationValue('Tickets')).toHaveText(String(tickets));
    await expect(eventDetailsPage.confirmationValue('Total')).toHaveText(`$${FEATURED_EVENT.price * tickets}`);

    const bookingRef = await eventDetailsPage.bookingRef.innerText();
    await eventDetailsPage.nav.goTo('My Bookings');
    await myBookingsPage.cancelBooking(bookingRef);
    await expect(myBookingsPage.bookingCard(bookingRef)).toHaveCount(0);
  });
});
