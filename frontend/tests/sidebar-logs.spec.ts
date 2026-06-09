import { test, expect } from "@playwright/test";

test('Capture sidebar render logs', async ({ page }) => {
  // Open the dev server (assumes it is running on localhost:5174 as shown earlier)
  await page.goto('http://localhost:5174/dashboard');

  const messages: string[] = [];
  page.on('console', msg => {
    messages.push(msg.text());
  });

  // Wait a moment for the React components to render and logs to fire
  await page.waitForTimeout(1000);

  // Verify that our three logs appear
  const hasMain = messages.some(m => m.includes('Rendering MainLayout'));
  const hasA = messages.some(m => m.includes('Rendering SidebarA'));
  const hasB = messages.some(m => m.includes('Rendering SidebarB'));
  console.log('Console messages:', messages);
  expect(hasMain).toBeTruthy();
  expect(hasA).toBeTruthy();
  expect(hasB).toBeTruthy();
});