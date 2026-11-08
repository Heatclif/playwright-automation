/** Environment configuration. Values can be overridden via .env (loaded by playwright.config.ts). */

export const BASE_URL = process.env.EVENTHUB_BASE_URL ?? 'https://eventhub.rahulshettyacademy.com';

export const USER = {
  email: process.env.EVENTHUB_EMAIL ?? 'natsuerza4321@gmail.com',
  password: process.env.EVENTHUB_PASSWORD ?? 'Natsu@1234',
};
