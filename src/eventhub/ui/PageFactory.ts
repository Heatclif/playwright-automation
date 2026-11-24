import { Page } from '@playwright/test';
import { AdminEventsPage } from './pages/AdminEventsPage';
import { BasePage } from './pages/BasePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { EventsPage } from './pages/EventsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyBookingsPage } from './pages/MyBookingsPage';

type PageCtor<T extends BasePage> = new (page: Page) => T;

/**
 * Lazily creates and caches exactly one instance of each page object per Playwright `page`.
 */
export class PageFactory {
  private readonly cache = new Map<PageCtor<BasePage>, BasePage>();

  constructor(readonly page: Page) {}

  private get<T extends BasePage>(ctor: PageCtor<T>): T {
    if (!this.cache.has(ctor)) this.cache.set(ctor, new ctor(this.page));
    return this.cache.get(ctor) as T;
  }

  get loginPage() { return this.get(LoginPage); }
  get homePage() { return this.get(HomePage); }
  get eventsPage() { return this.get(EventsPage); }
  get eventDetailsPage() { return this.get(EventDetailsPage); }
  get myBookingsPage() { return this.get(MyBookingsPage); }
  get adminEventsPage() { return this.get(AdminEventsPage); }
}
