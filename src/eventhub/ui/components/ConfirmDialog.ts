import { Locator, Page } from '@playwright/test';

/** The app's in-page confirmation modal (used for cancelling bookings, deleting events, ...). */
export class ConfirmDialog {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
  }

  /** Clicks the affirmative button, e.g. 'Yes, cancel it' or 'Delete event'. */
  async confirm(buttonName: string): Promise<void> {
    await this.root.getByRole('button', { name: buttonName }).click();
  }

  async dismiss(): Promise<void> {
    await this.root.getByRole('button', { name: 'Cancel', exact: true }).click();
  }
}
