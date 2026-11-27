import { test, expect } from '../../../src/eventhub/api/api-fixtures';
import { BookingFilterBuilder } from '../../../src/eventhub/api/builders';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('List all bookings', { tag: '@api' }, () => {
  test('GET--bookings-3: GET /bookings', async ({ authedApi: { bookingsApi } }) => {
    const params = new BookingFilterBuilder()
      .with_page(apiTestData.bookings.filterData.page)
      .with_limit(apiTestData.bookings.filterData.limit)
      .build();

    const response = await bookingsApi.get_bookings(params);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.pagination?.page).toBe(apiTestData.bookings.filterData.page);
  });
});
