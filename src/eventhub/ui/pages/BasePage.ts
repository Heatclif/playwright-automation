import { Locator, Page } from '@playwright/test';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NavBar } from '../components/NavBar';

export abstract class BasePage {
  /** Path relative to baseURL. */
  abstract readonly path: string;

  readonly nav: NavBar;
  readonly dialog: ConfirmDialog;

  constructor(readonly page: Page) {
    this.nav = new NavBar(page);
    this.dialog = new ConfirmDialog(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Toast / inline message by its text, e.g. 'Event created!'. */
  message(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
