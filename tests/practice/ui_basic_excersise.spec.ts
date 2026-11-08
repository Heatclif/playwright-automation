import { test, expect } from '@playwright/test';

test("Rahul Shetty ECom E2E automation", async ({ page, browser }) => {
    const url = 'https://rahulshettyacademy.com/client/#/auth/login';
    var email = 'johndoe1452@example.com';
    var password = 'Test@123';
    var products = [' ADIDAS ORIGINAL', 'IPHONE 13 PRO'];
    var orders = [];

    await page.goto(url);
    await page.locator('#userEmail').fill(email);
    await page.locator('#userPassword').fill(password);
    await page.locator('input#login').click();

    await page.waitForSelector('section#products');

    for (const product of products) {
        await page.locator('div.card-body', { hasText: product })
            .getByRole('button', { name: 'Add To Cart' }).click();

        await expect(page.locator('[routerlink="/dashboard/cart"]')
            .locator('label')).toHaveText(products.indexOf(product) + 1 + '');
    }

    await page.locator('[routerlink="/dashboard/cart"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    await page.locator('//div[text() = "CVV Code "]/following-sibling::input').fill('123');
    await page.locator('//div[text() = "Name on Card "]/following-sibling::input').fill('John Doe');
    await page.getByPlaceholder('Select Country').pressSequentially('India', { delay: 200 });
    await page.locator('[class = "ta-results list-group ng-star-inserted"]')
        .locator('button', { hasText: 'India' }).last().click();

    await page.locator('//div[text() = "Apply Coupon "]/following-sibling::input').fill('rahulshettyacademy');
    await page.getByRole('button', { name: 'Apply Coupon' }).click();
    expect(page.locator('//div[text() = "Apply Coupon "]/following-sibling::p')).toHaveText('* Coupon Applied');

    await page.getByText('Place Order').click();
    await expect (page.locator('[class="hero-primary"]')).toHaveText(' Thankyou for the order. ');

    for(var order of await page.locator('label.ng-star-inserted').allTextContents()) {
        orders.push(order.replace(/[^a-zA-Z0-9]/g, ''));
    }
    console.log(orders);

    await page.locator('button[routerlink="/dashboard/myorders"]').click();

    await page.locator('tbody').waitFor();

    for(var order of orders) {
        expect(await page.locator('tbody').locator('tr', { hasText: order }).count()).toBe(1);
    }
})

