import { test, expect } from '@playwright/test'
import { text } from 'stream/iter';

test('Rahul Shetty Academy Login Success', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    await expect(page).toHaveTitle(/LoginPage Practise/);

    var username = await page.locator('//p[contains(text(), "username is")]/b/i').first().textContent() || '';
    var password = await page.locator('//p[contains(text(), "username is")]/b/i').last().textContent() || '';

    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    await page.getByRole('textbox', { name: 'Username' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);

    await page.getByRole('radio', { name: 'User' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('combobox').selectOption('Teacher');
    
    await page.getByRole('checkbox', { name: 'terms' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect( page.getByRole('button', { name: 'Sign In' })).toBeVisible({ visible: false });
})

test('Rahul Shetty Academy Login Failure', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');
    await expect(page).toHaveTitle(/LoginPage Practise/);

    var username = await page.locator('//p[contains(text(), "username is")]/b[1]/i').textContent() || '';
    var password = 'wrongpassword';

    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    await page.getByRole('textbox', { name: 'Username' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    
    await page.getByRole('checkbox', { name: 'terms' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    expect(await page.locator('.alert-danger').textContent()).toContain('Incorrect username/password.');
})

test.skip('Rahul Shetty Academy Client Registration', async ({ page }) => {
    var email = 'johndoe1452@example.com';
    var password = 'Test@123';
    await page.goto('https://rahulshettyacademy.com/client/#/auth/register');

    await page.locator('#firstName').fill('John');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#userEmail').fill(email);
    await page.locator('#userMobile').fill('9350589533');
    await page.locator('select[formcontrolname="occupation"]').selectOption('Student');
    await page.locator('input[value="Male"]').click();
    await page.locator('#userPassword').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('checkbox').click();
    await page.getByRole('link', { name: 'Register' }).click();
})

test('Rahul Shetty Academy Login', async ({ page }) => {
    var email = 'johndoe1452@example.com';
    var password = 'Test@123';
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');

    await page.locator('#userEmail').fill(email);
    await page.locator('#userPassword').fill(password);
    await page.locator('input#login').click();

    // await page.waitForLoadState('networkidle');
    await page.waitForSelector('.card-body b');

    var products = await page.locator('.card-body b').allTextContents();
    expect(products).toContain('ADIDAS ORIGINAL');
})