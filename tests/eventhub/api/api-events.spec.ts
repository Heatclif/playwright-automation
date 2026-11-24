// tests/eventhub/api/api-events.spec.ts
import { test, expect } from '../../../src/eventhub/api-fixtures';
import { EventBuilder, EventFilterBuilder } from '../../../src/eventhub/api/builders/event-builder';
import { apiTestData } from '../../../src/eventhub/api/data/api-test-data';

test.describe('Events API @api_events', () => {
  test('creates a new event successfully with full details', async ({ authedApi: { eventsApi } }) => {
    // 1. Obtain test values from data layer
    const eventData = apiTestData.events.generateUniqueEvent('API Tech Summit');

    // 2. Pass values into EventBuilder methods
    const payload = new EventBuilder()
      .with_title(eventData.title)
      .with_description(eventData.description)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .with_price(eventData.price)
      .with_total_seats(eventData.totalSeats)
      .with_image_url(eventData.imageUrl)
      .build();

    // 3. Invoke API via events helper
    const response = await eventsApi.create_event(payload);

    // 4. Assert response
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.title).toBe(eventData.title);
    expect(response.data.data.city).toBe(eventData.city);
    expect(response.data.data.totalSeats).toBe(eventData.totalSeats);
    // availableSeats must be initialized equal to totalSeats
    expect(response.data.data.availableSeats).toBe(eventData.totalSeats);
  });

  test('returns a paginated list of events filtered by city', async ({ authedApi: { eventsApi } }) => {
    // 1. Obtain filter values from data layer
    const filterData = apiTestData.events.filterData;

    // 2. Build query parameters using EventFilterBuilder
    const queryParams = new EventFilterBuilder()
      .with_city(filterData.city)
      .with_limit(filterData.limit)
      .with_page(filterData.page)
      .build();

    // 3. Request events list
    const response = await eventsApi.get_events(queryParams);

    // 4. Assert response
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.pagination).toBeDefined();

    // Verify all returned items match the requested city
    for (const event of response.data.data) {
      expect(event.city.toLowerCase()).toBe(filterData.city.toLowerCase());
    }
  });

  test('retrieves an event by its numeric ID', async ({ authedApi: { eventsApi } }) => {
    // 1. Create a prerequisite event
    const eventData = apiTestData.events.workshopEvent;
    const createPayload = new EventBuilder()
      .with_title(`${eventData.title} ${Date.now()}`)
      .with_description(eventData.description)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .with_price(eventData.price)
      .with_total_seats(eventData.totalSeats)
      .build();

    const createRes = await eventsApi.create_event(createPayload);
    expect(createRes.status).toBe(201);
    const createdEventId = createRes.data.data.id;

    // 2. Fetch event by ID
    const getRes = await eventsApi.get_event_by_id(createdEventId);

    // 3. Assert correctness
    expect(getRes.status).toBe(200);
    expect(getRes.data.success).toBe(true);
    expect(getRes.data.data.id).toBe(createdEventId);
    expect(getRes.data.data.venue).toBe(eventData.venue);
  });

  test('updates an existing event price and title', async ({ authedApi: { eventsApi } }) => {
    // 1. Create event
    const eventData = apiTestData.events.generateUniqueEvent('Pre-Update Event');
    const createPayload = new EventBuilder()
      .with_title(eventData.title)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .with_price(eventData.price)
      .with_total_seats(eventData.totalSeats)
      .build();

    const createRes = await eventsApi.create_event(createPayload);
    expect(createRes.status).toBe(201);
    const eventId = createRes.data.data.id;

    // 2. Obtain update values from data layer and assemble with builder
    const updateValues = apiTestData.events.updateEventData;
    const updatePayload = new EventBuilder()
      .with_title(updateValues.title)
      .with_price(updateValues.price)
      .with_total_seats(updateValues.totalSeats)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .build();

    // 3. Perform update
    const updateRes = await eventsApi.update_event(eventId, updatePayload);

    // 4. Assert changes
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.success).toBe(true);
    expect(updateRes.data.data.title).toBe(updateValues.title);
    expect(updateRes.data.data.price).toBe(updateValues.price.toString());
  });

  test('deletes an event successfully and returns 404 on subsequent lookup', async ({ authedApi: { eventsApi } }) => {
    // 1. Create event to be deleted
    const eventData = apiTestData.events.generateUniqueEvent('Event to Delete');
    const createPayload = new EventBuilder()
      .with_title(eventData.title)
      .with_category(eventData.category)
      .with_venue(eventData.venue)
      .with_city(eventData.city)
      .with_event_date(eventData.eventDate)
      .with_price(eventData.price)
      .with_total_seats(eventData.totalSeats)
      .build();

    const createRes = await eventsApi.create_event(createPayload);
    expect(createRes.status).toBe(201);
    const eventId = createRes.data.data.id;

    // 2. Delete the event
    const deleteRes = await eventsApi.delete_event(eventId);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.data.success).toBe(true);

    // 3. Confirm event no longer exists
    const lookupRes = await eventsApi.get_event_by_id(eventId);
    expect(lookupRes.status).toBe(404);
    expect(lookupRes.data.success).toBe(false);
  });

  test('rejects creating an event when required title is missing', async ({ authedApi: { eventsApi } }) => {
    // 1. Data without title
    const invalidData = apiTestData.events.invalidEventMissingTitle;

    // 2. Use builder and omit title
    const payload = new EventBuilder()
      .with_description(invalidData.description)
      .with_category(invalidData.category)
      .with_venue(invalidData.venue)
      .with_city(invalidData.city)
      .with_event_date(invalidData.eventDate)
      .with_price(invalidData.price)
      .with_total_seats(invalidData.totalSeats)
      .without_field('title')
      .build();

    // 3. Attempt creation
    const response = await eventsApi.create_event(payload);

    // 4. Assert validation failure
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });
});
