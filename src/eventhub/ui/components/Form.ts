import { Locator } from '@playwright/test';

/**
 * Generic form component. Fields are addressed by their visible label,
 * so one method serves every text/number/date/select field in a form.
 */
export class Form {
  constructor(readonly root: Locator) {}

  field(label: string): Locator {
    return this.root.getByLabel(label);
  }

  async fill(label: string, value: string | number): Promise<void> {
    await this.field(label).fill(String(value));
  }

  async select(label: string, option: string): Promise<void> {
    await this.field(label).selectOption(option);
  }
}
