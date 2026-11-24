/** Environment configuration. Loaded from .env locally (by playwright.config.ts) and from GitHub secrets in CI. Credentials have no defaults. */

export const BASE_URL = process.env.EVENTHUB_BASE_URL ?? 'https://eventhub.rahulshettyacademy.com';
export const API_BASE_URL = process.env.EVENTHUB_API_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}. Set it in .env locally (see .env.example) or as a GitHub secret in CI.`);
  }
  return value;
}

/** Resolved lazily (on access), so importing config never throws; only tests that actually log in need the credentials. */
export const USER = {
  get email(): string {
    return required('EVENTHUB_EMAIL');
  },
  get password(): string {
    return required('EVENTHUB_PASSWORD');
  },
};
