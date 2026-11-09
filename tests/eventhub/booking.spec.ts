import { expect, test } from '../../src/eventhub/fixtures';
import { buildEvent, CUSTOMER, FEATURED_EVENT } from '../../src/eventhub/test-data';

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

  test('total price follows the number of tickets selected', async ({ app }) => {
    const { eventsPage, eventDetailsPage } = app;
    const totalFor = (tickets: number) => `$${(FEATURED_EVENT.price * tickets).toLocaleString('en-US')}`;

    await eventsPage.goto();
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await expect(eventDetailsPage.totalPrice).toHaveText(totalFor(1));

    // Increase, then decrease, one ticket at a time, then jump to many tickets.
    for (const tickets of [3, 2, 1, 9]) {
      await eventDetailsPage.setTickets(tickets);
      await expect(eventDetailsPage.ticketCount).toHaveText(String(tickets));
      await expect(eventDetailsPage.totalPrice).toHaveText(totalFor(tickets));
    }
  });

  test('booking form requires customer details', async ({ app }) => {
    const { eventsPage, eventDetailsPage } = app;

    await eventsPage.goto();
    await eventsPage.bookEvent(FEATURED_EVENT.title);
    await eventDetailsPage.confirmBookingButton.click();

    await expect(eventDetailsPage.bookingRef).toBeHidden();
    await expect(eventDetailsPage.confirmBookingButton).toBeVisible();
  });

  test('event shows Sold Out when fully booked and seats return after cancelling', async ({ app }) => {
    const { adminEventsPage, eventsPage, eventDetailsPage, myBookingsPage } = app;
    const event = buildEvent({ totalSeats: 3 });
    const ticketsPerBooking = [2, 1];
    const bookingRefs: string[] = [];

    await adminEventsPage.goto();
    await adminEventsPage.createEvent(event);
    await expect(adminEventsPage.message('Event created!')).toBeVisible();

    // Book every seat across two bookings.
    for (const tickets of ticketsPerBooking) {
      await eventsPage.goto();
      await eventsPage.search(event.title);
      await eventsPage.bookEvent(event.title);
      await eventDetailsPage.book(CUSTOMER, tickets);
      await expect(eventDetailsPage.confirmationValue('Tickets')).toHaveText(String(tickets));
      bookingRefs.push(await eventDetailsPage.bookingRef.innerText());
    }

    await eventDetailsPage.reload();
    await expect(eventDetailsPage.seatsAvailable).toHaveText('SOLD OUT');
    await expect(eventDetailsPage.soldOutButton).toBeDisabled();

    await eventDetailsPage.nav.goTo('My Bookings');
    for (const ref of bookingRefs) {
      await myBookingsPage.cancelBooking(ref);
      await expect(myBookingsPage.bookingCard(ref)).toHaveCount(0);
    }

    await myBookingsPage.nav.goTo('Events');
    await eventsPage.search(event.title);
    await expect(eventsPage.eventCard(event.title)).toContainText('3 seats left');
    await eventsPage.bookEvent(event.title);
    await eventDetailsPage.reload();
    await expect(eventDetailsPage.seatsAvailable).toHaveText('3 / 3 seats');
    await expect(eventDetailsPage.soldOutLabel).toHaveCount(0);
    await expect(eventDetailsPage.confirmBookingButton).toBeEnabled();

    // Clean up: delete the event.
    await eventDetailsPage.nav.goToAdmin('Manage Events');
    await adminEventsPage.deleteEvent(event.title);
    await expect(adminEventsPage.eventRow(event.title)).toHaveCount(0);
  });
});
