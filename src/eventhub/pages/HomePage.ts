import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly path = '/';
  readonly heading: Locator;
  readonly browseEventsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.browseEventsLink = page.getByRole('link', { name: 'Browse Events →' });
  }
}
