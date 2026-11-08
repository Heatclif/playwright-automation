import { expect, Locator, Page } from '@playwright/test';
import { Form } from '../components/Form';
import { CustomerDetails } from '../types';
import { BasePage } from './BasePage';

export type ConfirmationField = 'Booking Ref' | 'Customer' | 'Tickets' | 'Total';

export class EventDetailsPage extends BasePage {
  /** Event pages are reached through the Events list; the id is dynamic. */
  readonly path = '/events';
  readonly title: Locator;
  readonly ticketCount: Locator;
  readonly bookingForm: Form;
  readonly confirmBookingButton: Locator;
  readonly confirmationPanel: Locator;
  readonly bookingRef: Locator;
  private readonly incrementTickets: Locator;
  private readonly decrementTickets: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { level: 1 });
    this.ticketCount = page.locator('#ticket-count');
    this.incrementTickets = page.getByRole('button', { name: '+', exact: true });
    this.decrementTickets = page.getByRole('button', { name: '−', exact: true });
    this.confirmBookingButton = page.getByRole('button', { name: 'Confirm Booking' });
    this.bookingForm = new Form(page.locator('form').filter({ has: this.confirmBookingButton }));
    this.confirmationPanel = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Booking Confirmed!' }) })
      .last();
    this.bookingRef = this.confirmationPanel.locator('.booking-ref');
  }

  async setTickets(count: number): Promise<void> {
    let current = Number(await this.ticketCount.innerText());
    while (current !== count) {
      await (current < count ? this.incrementTickets : this.decrementTickets).click();
      current += current < count ? 1 : -1;
      await expect(this.ticketCount).toHaveText(String(current));
    }
  }

  async fillCustomerDetails(customer: CustomerDetails): Promise<void> {
    await this.bookingForm.fill('Full Name', customer.fullName);
    await this.bookingForm.fill('Email', customer.email);
    await this.bookingForm.fill('Phone Number', customer.phone);
  }

  async book(customer: CustomerDetails, tickets = 1): Promise<void> {
    await this.setTickets(tickets);
    await this.fillCustomerDetails(customer);
    await this.confirmBookingButton.click();
  }

  /** Value shown next to a label in the "Booking Confirmed" summary. */
  confirmationValue(field: ConfirmationField): Locator {
    return this.confirmationPanel.locator(`div:has(> span:text-is("${field}")) > span`).last();
  }
}
