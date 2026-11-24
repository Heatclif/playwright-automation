import { CustomerDetails, EventDetails } from './types';

/** Seeded, read-only event that is always available for booking practice. */
export const FEATURED_EVENT = {
  title: 'Dilli Diwali Mela',
  category: 'Festival',
  city: 'Delhi',
  price: 300,
};

export const CUSTOMER: CustomerDetails = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '9350589533',
};

/** Returns a datetime-local string `daysAhead` days from now. */
export function futureDateTime(daysAhead = 30): string {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Builds a unique event so parallel tests / browsers never collide. */
export function buildEvent(overrides: Partial<EventDetails> = {}): EventDetails {
  return {
    title: `PW Event ${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    description: 'Event created by Playwright automation.',
    category: 'Workshop',
    city: 'Kolkata',
    venue: 'Kolkata City Center',
    dateTime: futureDateTime(),
    price: 50,
    totalSeats: 100,
    ...overrides,
  };
}
