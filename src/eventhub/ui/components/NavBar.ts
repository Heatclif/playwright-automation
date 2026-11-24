import { Locator, Page } from '@playwright/test';

export type NavLink = 'Home' | 'Events' | 'My Bookings';
export type AdminLink = 'Manage Events' | 'Manage Bookings';

export class NavBar {
  readonly root: Locator;
  readonly userEmail: Locator;
  readonly logoutButton: Locator;
  private readonly adminMenuButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('navigation');
    this.userEmail = page.getByTestId('user-email-display');
    this.logoutButton = page.getByTestId('logout-btn');
    this.adminMenuButton = this.root.getByRole('button', { name: 'Admin' });
  }

  async goTo(link: NavLink): Promise<void> {
    await this.root.getByRole('link', { name: link, exact: true }).click();
  }

  async goToAdmin(link: AdminLink): Promise<void> {
    await this.adminMenuButton.click();
    await this.root.getByRole('link', { name: link }).click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
