import { Locator, Page } from '@playwright/test';
import { Form } from '../components/Form';
import { EventDetails } from '../types';
import { BasePage } from './BasePage';

export class AdminEventsPage extends BasePage {
  readonly path = '/admin/events';
  readonly form: Form;
  readonly descriptionInput: Locator;
  readonly addEventButton: Locator;
  readonly eventRows: Locator;

  constructor(page: Page) {
    super(page);
    this.form = new Form(page.locator('#admin-event-form'));
    // The Description label isn't associated with its textarea, so it can't go through Form.field().
    this.descriptionInput = this.form.root.getByPlaceholder('Describe the event…');
    this.addEventButton = page.getByTestId('add-event-btn');
    this.eventRows = page.getByTestId('event-table-row');
  }

  eventRow(title: string): Locator {
    return this.eventRows.filter({ hasText: title });
  }

  async fillEventForm(event: EventDetails): Promise<void> {
    await this.form.fill('Title', event.title);
    await this.descriptionInput.fill(event.description);
    await this.form.select('Category', event.category);
    await this.form.fill('City', event.city);
    await this.form.fill('Venue', event.venue);
    await this.form.fill('Event Date & Time', event.dateTime);
    await this.form.fill('Price ($)', event.price);
    await this.form.fill('Total Seats', event.totalSeats);
    if (event.imageUrl) await this.form.fill('Image URL', event.imageUrl);
  }

  async createEvent(event: EventDetails): Promise<void> {
    await this.fillEventForm(event);
    await this.addEventButton.click();
  }

  async editEvent(title: string): Promise<void> {
    await this.eventRow(title).getByTestId('edit-event-btn').click();
  }

  async deleteEvent(title: string): Promise<void> {
    await this.eventRow(title).getByTestId('delete-event-btn').click();
    await this.dialog.confirm('Delete event');
  }
}
