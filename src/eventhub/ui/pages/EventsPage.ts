import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type EventFilter = 'category' | 'city';

export class EventsPage extends BasePage {
  readonly path = '/events';
  readonly searchInput: Locator;
  readonly eventCards: Locator;
  private readonly filters: Record<EventFilter, Locator>;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search events, venues…');
    this.eventCards = page.getByTestId('event-card');
    // The filter <select>s have no labels; identify each by its "All ..." default option.
    this.filters = {
      category: page.getByRole('combobox').filter({ hasText: 'All Categories' }),
      city: page.getByRole('combobox').filter({ hasText: 'All Cities' }),
    };
  }

  eventCard(title: string): Locator {
    return this.eventCards.filter({ hasText: title });
  }

  /** Waits for the (debounced) events API call so the list has re-rendered before the next action. */
  private async waitForResults(param: string, action: () => Promise<unknown>): Promise<void> {
    const response = this.page.waitForResponse(
      (res) => res.url().includes('/api/events?') && new URL(res.url()).searchParams.has(param),
    );
    await action();
    await response;
  }

  async search(text: string): Promise<void> {
    await this.waitForResults('search', () => this.searchInput.fill(text));
  }

  /** Pass '' to reset a filter to "All". */
  async filterBy(filter: EventFilter, value: string): Promise<void> {
    await this.filters[filter].selectOption(value);
  }

  async bookEvent(title: string): Promise<void> {
    await this.eventCard(title).getByRole('link', { name: 'Book Now' }).click();
  }
}
