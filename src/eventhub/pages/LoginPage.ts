import { Locator, Page } from '@playwright/test';
import { Form } from '../components/Form';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/login';
  readonly heading: Locator;
  readonly form: Form;
  readonly signInButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in to EventHub' });
    this.form = new Form(page.locator('form'));
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.registerLink = page.getByRole('link', { name: 'Register' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.form.fill('Email', email);
    await this.form.fill('Password', password);
    await this.signInButton.click();
  }
}
