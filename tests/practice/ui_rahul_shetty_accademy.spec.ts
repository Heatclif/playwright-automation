import { test, expect } from '@playwright/test';

const email = 'natsuerza4321@gmail.com';
const password = 'Natsu@1234';

// test.beforeEach(async ({ page }) => {
//     const WebAutomationTab = page.getByRole('tab', { name: 'Web Automation' });

//     page.goto('https://rahulshettyacademy.com/practice');
    
//     await WebAutomationTab.click();
//     await expect(WebAutomationTab).toHaveAttribute('aria-selected', 'true');
// })

test('EventHub Event Creation and Management E2E', async ({ page, context }) => {
    // const EvenHubButton = page.locator('//h3[text() = "EventHub"]/../following-sibling::button');
    // const eventHubPagePromise = context.waitForEvent('page');

    // await EvenHubButton.click();
    // const eventHubPage = await eventHubPagePromise;
    const eventName = 'Test Event' + new Date().toISOString();

    await page.goto('https://eventhub.rahulshettyacademy.com/');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('h1')).toHaveText('Discover & BookAmazing Events');

    await page.getByRole('button', { name: 'Admin' }).click();
    await page.getByRole('navigation').getByRole('link', { name: 'Manage Events' }).click();

    await page.locator('#event-title-input').fill(eventName);
    await page.getByPlaceholder('Describe the event…').fill('This is a test event created for automation testing purposes.');
    await page.locator('#category').selectOption('Workshop');
    await page.locator('#city').fill('Kolkata');
    await page.locator('#venue').fill('Kolkata City Center');
    await page.locator('[id="event-date-&-time"]').pressSequentially('11302026');
    await page.locator('[id="event-date-&-time"]').press('Tab');
    await page.locator('[id="event-date-&-time"]').pressSequentially('1130PM');
    await page.locator('[id="price-($)"]').fill('50');
    await page.locator('#total-seats').fill('100');
    await page.getByRole('button', { name: 'Add Event' }).click();
    await expect(page.locator('text=Event created!')).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Events' }).click();;
    await page.getByPlaceholder('Search events, venues…').fill(eventName);
    await page.waitForLoadState('networkidle');
    await page.locator('#event-card').filter({ hasText: eventName }).getByRole('link', { name: 'Book Now' }).click();

    await page.locator('#customerName').fill('John Doe');
    await page.locator('#customer-email').fill('john.doe@example.com');
    await page.locator('#phone').fill('9350589533');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page.locator('text=Booking Confirmed! 🎉')).toBeVisible();
})