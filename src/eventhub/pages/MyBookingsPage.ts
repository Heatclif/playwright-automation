import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyBookingsPage extends BasePage {
  readonly path = '/bookings';
  readonly heading: Locator;
  readonly bookingCards: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'My Bookings' });
    this.bookingCards = page.getByTestId('booking-card');
  }

  /** Finds a booking card by any text on it: booking ref, event title, ... */
  bookingCard(text: string): Locator {
    return this.bookingCards.filter({ hasText: text });
  }

  async cancelBooking(text: string): Promise<void> {
    await this.bookingCard(text).getByTestId('cancel-booking-btn').click();
    await this.dialog.confirm('Yes, cancel it');
  }
}
