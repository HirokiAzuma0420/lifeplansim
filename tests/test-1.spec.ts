import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://ishimok.my.salesforce.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('hiroki_azuma@ishimok.jp');
  await page.getByRole('textbox', { name: 'Username' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('sAGTwDUq0m');
  await page.getByText('Remember me').click();
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByTitle('商談', { exact: true }).click();
  await page.getByRole('button', { name: '新規' }).click();
  await page.getByRole('combobox', { name: '*エリア' }).click();
  await page.locator('span').filter({ hasText: '関東' }).nth(1).click();
});