/** Environment configuration. Loaded from .env locally (by playwright.config.ts) and from GitHub secrets in CI. Credentials have no defaults. */

export const BASE_URL = process.env.EVENTHUB_BASE_URL ?? 'https://eventhub.rahulshettyacademy.com';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}. Set it in .env locally (see .env.example) or as a GitHub secret in CI.`);
  }
  return value;
}

export const USER = {
  email: required('EVENTHUB_EMAIL'),
  password: required('EVENTHUB_PASSWORD'),
};
