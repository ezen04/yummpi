import { test, expect } from '@playwright/test';

test('homepage returns 200', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('/manifest.webmanifest returns 200 with standalone display', async ({
  request,
}) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.display).toBe('standalone');
});

test('/sw.js returns 200', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.status()).toBe(200);
});
