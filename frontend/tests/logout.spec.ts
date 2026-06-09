import { test, expect } from "@playwright/test";

test('logout clears JWT and redirects to login', async ({ page }) => {
  // Go to the app (assumes dev server is running on localhost:5173)
  await page.goto('http://127.0.0.1:5173');

  // Ensure we have a JWT (login flow simplified: set a dummy token)
  await page.evaluate(() => {
    const dummy = 'header.' + btoa(JSON.stringify({roles:['SuperAdmin']})) + '.signature';
    localStorage.setItem('jwt', dummy);
  });

  // Reload to pick up auth state
  await page.reload();

  // Verify token exists
  const before = await page.evaluate(() => localStorage.getItem('jwt'));
  expect(before).not.toBeNull();

  // Click the logout button
  await page.click('button:has-text("Logout")');

  // After logout, token should be removed
  const after = await page.evaluate(() => localStorage.getItem('jwt'));
  expect(after).toBeNull();

  // Should be redirected to /login
  await expect(page).toHaveURL(/\/login$/);
});

// New test to capture screenshot of the navigation bar with styling
test('capture navigation styling', async ({ page }) => {
  // Set a dummy JWT so SuperAdmin links appear
  const dummy = 'header.' + btoa(JSON.stringify({roles:['SuperAdmin']})) + '.signature';
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate((token) => {
    localStorage.setItem('jwt', token);
  }, dummy);
  await page.reload();
  // Wait for nav to be visible
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  // Capture screenshot of the nav element
  await nav.screenshot({ path: 'frontend/tests/nav-screenshot.png' });
});