// src/eventhub/api/data/api-test-data.ts
import { Category, CreateEventInput } from '../types';
import { USER } from '../../config';

/**
 * Data layer containing the test values used across API test suites.
 * Test specs pass these values directly into concern methods to assemble payloads.
 */
export const apiTestData = {
  auth: {
    // Same account as the UI tests; comes from .env / GitHub secrets (see config.ts)
    credentials: { email: USER.email, password: USER.password },
    // Dynamic generator for fresh registration tests
    generateNewUser(prefix = 'apitest') {
      const stamp = Date.now();
      const rand = Math.floor(Math.random() * 10000);
      return {
        email: `${prefix}_${stamp}_${rand}@example.com`,
        password: 'Password@123',
        name: `Automated User ${rand}`,
      };
    },
    invalidEmailUser: {
      email: 'invalid-email-format-without-at',
      password: 'Password@123',
      name: 'Bad Email User',
    },
    shortPasswordUser: {
      email: 'shortpwd@example.com',
      password: '123',
      name: 'Short Pwd User',
    },
    boundary5CharPasswordUser: {
      email: 'boundary5@example.com',
      password: '12345',
      name: 'Boundary 5 Char',
    },
    boundary6CharPasswordUser(prefix = 'min6') {
      const stamp = Date.now();
      return {
        email: `${prefix}_${stamp}@example.com`,
        password: '123456',
        name: 'Boundary 6 Char',
      };
    },
    unregisteredUser: {
      email: 'unregistered_nobody_99999@example.com',
      password: 'Password@123',
    },
    wrongPassword: 'WrongPassword_999!',
  },

  events: {
    validEvent: {
      title: 'Global Tech Summit 2026',
      description: 'The premier technology and developer summit of 2026.',
      category: 'Conference' as Category,
      venue: 'Bangalore International Exhibition Centre',
      city: 'Bangalore',
      eventDate: '2026-11-20T10:00:00.000Z',
      price: 1500,
      totalSeats: 100,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    },
    generateUniqueEvent(prefix = 'Auto Event'): CreateEventInput {
      const stamp = Date.now();
      const rand = Math.floor(Math.random() * 10000);
      return {
        title: `${prefix} ${stamp}_${rand}`,
        description: `Automated test event created at ${new Date().toISOString()}`,
        category: 'Conference' as Category,
        venue: 'Bangalore Tech Park',
        city: 'Bangalore',
        eventDate: '2026-12-15T09:30:00.000Z',
        price: 999,
        totalSeats: 50,
        imageUrl: null,
      };
    },
    workshopEvent: {
      title: 'Hands-on AI & Agentic Coding Workshop',
      description: 'Deep dive into modern AI tools and architecture.',
      category: 'Workshop' as Category,
      venue: 'Innovation Lab',
      city: 'Mumbai',
      eventDate: '2026-12-05T14:00:00.000Z',
      price: 1200,
      totalSeats: 30,
      imageUrl: null,
    },
    singleSeatEvent: {
      title: 'Exclusive VIP Masterclass 2026',
      description: 'One-on-one executive masterclass with limited admission.',
      category: 'Workshop' as Category,
      venue: 'Private Suite A',
      city: 'Bangalore',
      eventDate: '2026-10-10T11:00:00.000Z',
      price: 5000,
      totalSeats: 1,
      imageUrl: null,
    },
    updateEventData: {
      title: 'Updated Global Tech Summit 2026 - Keynote Edition',
      price: 2200,
      totalSeats: 120,
    },
    filterData: {
      city: 'Bangalore',
      category: 'Conference',
      searchKeyword: 'Summit',
      page: 1,
      limit: 5,
    },
    invalidEventMissingTitle: {
      description: 'Event without title',
      category: 'Conference' as Category,
      venue: 'Venue 1',
      city: 'Delhi',
      eventDate: '2026-11-20T10:00:00.000Z',
      price: 500,
      totalSeats: 20,
    },
    invalidCategoryEvent: {
      title: 'Invalid Category Event',
      category: 'InvalidCategoryName',
      venue: 'Venue 2',
      city: 'Delhi',
      eventDate: '2026-11-20T10:00:00.000Z',
      price: 500,
      totalSeats: 20,
    },
  },

  bookings: {
    validBooking: {
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@example.com',
      customerPhone: '+91-9876543210',
      quantity: 2,
    },
    singleTicketBooking: {
      customerName: 'Aarav Mehta',
      customerEmail: 'aarav.mehta@example.com',
      customerPhone: '+91-9876543211',
      quantity: 1,
    },
    maxAllowedBooking: {
      customerName: 'Amit Patel',
      customerEmail: 'amit.patel@example.com',
      customerPhone: '+91-9876543212',
      quantity: 10,
    },
    exceedsMaxQuantityBooking: {
      customerName: 'Amit Patel',
      customerEmail: 'amit.patel@example.com',
      customerPhone: '+91-9876543212',
      quantity: 11,
    },
    zeroQuantityBooking: {
      customerName: 'Rohit Gupta',
      customerEmail: 'rohit.gupta@example.com',
      customerPhone: '+91-9876543213',
      quantity: 0,
    },
    shortNameBooking: {
      customerName: 'A',
      customerEmail: 'a@example.com',
      customerPhone: '+91-9876543214',
      quantity: 1,
    },
    invalidEmailBooking: {
      customerName: 'Kavita Singh',
      customerEmail: 'invalid-email-address-format',
      customerPhone: '+91-9876543215',
      quantity: 1,
    },
    shortPhoneBooking: {
      customerName: 'Sunil Kumar',
      customerEmail: 'sunil.kumar@example.com',
      customerPhone: '12345',
      quantity: 1,
    },
    filterData: {
      status: 'confirmed' as const,
      page: 1,
      limit: 10,
    },
  },

  health: {
    expectedStatus: 'ok',
    expectedDbStatus: 'connected',
    customHeaders: {
      'X-Client-Test': 'playwright-api-automation',
    },
  },
};
