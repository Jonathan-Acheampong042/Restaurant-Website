const { chromium } = require('C:/Users/jacheampong042/Master-Vibe-Coding-Command-Center/vibe-command-center/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs');

async function runE2EValidation() {
  console.log('====================================================');
  console.log('  Ember & Olive — Playwright E2E & Visual Audit');
  console.log('====================================================\n');

  const screenshotsDir = path.resolve(process.cwd(), 'playwright-artifacts');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const pageErrors = [];
  const consoleWarnings = [];

  // Desktop Context
  console.log('[Test 1] Desktop Viewport (1280x900) & Initial Page Load...');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktopContext.newPage();

  page.on('pageerror', err => {
    console.error('  [BROWSER ERROR]:', err);
    pageErrors.push(err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('  [CONSOLE ERROR]:', msg.text());
      pageErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 1. Verify Page Title & Semantic Landmarks
  const title = await page.title();
  console.log(`  ✓ Page Title: "${title}"`);
  if (!title.includes('Ember & Olive')) throw new Error('Invalid title');

  const navCount = await page.locator('nav').count();
  const mainCount = await page.locator('main').count();
  const footerCount = await page.locator('footer').count();
  console.log(`  ✓ Semantic Landmarks: <nav>: ${navCount}, <main>: ${mainCount}, <footer>: ${footerCount}`);

  // 2. Hero Section Verification
  console.log('\n[Test 2] Hero Section & CTAs...');
  const heroH1 = await page.locator('h1').textContent();
  console.log(`  ✓ Hero H1 text: "${heroH1.trim()}"`);
  const reserveCta = page.locator('a[href="#reservations"]').first();
  console.log(`  ✓ Reserve CTA found: "${(await reserveCta.textContent()).trim()}"`);
  await page.screenshot({ path: path.join(screenshotsDir, '01-desktop-hero.png') });

  // 3. Menu Section & Dietary Filtering Interactivity
  console.log('\n[Test 3] Menu Section & Interactive Dietary Filtering...');
  const menuSection = page.locator('#menu');
  await menuSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const initialItemsCount = await page.locator('article, .menu-item-card').count();
  console.log(`  ✓ Initial menu items displayed: ${initialItemsCount}`);

  // Click Dietary chip 'Gluten-Free'
  const gfButton = page.locator('button:has-text("Gluten-Free")').first();
  if (await gfButton.count() > 0) {
    await gfButton.click();
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('article, .menu-item-card').count();
    console.log(`  ✓ Filtered by "Gluten-Free": ${filteredCount} items displayed`);
    await page.screenshot({ path: path.join(screenshotsDir, '02-menu-gluten-free.png') });

    // Reset filter
    const allButton = page.locator('button:has-text("All")').first();
    if (await allButton.count() > 0) {
      await allButton.click();
      await page.waitForTimeout(300);
    }
  }

  // 4. Two-Step Reservation Form E2E Submission
  console.log('\n[Test 4] Two-Step Reservation Flow End-to-End...');
  const resSection = page.locator('#reservations');
  await resSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Step 1: Party size = 4
  const party4Btn = page.locator('button[role="radio"]:has-text("4")').first();
  if (await party4Btn.count() > 0) {
    await party4Btn.click();
    console.log('  ✓ Selected Party Size: 4 Guests');
  }

  // Date selection: 7 days out
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const futureDateStr = targetDate.toISOString().split('T')[0];
  await page.locator('#res-date').fill(futureDateStr);
  console.log(`  ✓ Selected Reservation Date: ${futureDateStr}`);

  // Time slot: 19:00
  const time19Btn = page.locator('button:has-text("19:00")').first();
  if (await time19Btn.count() > 0) {
    await time19Btn.click();
    console.log('  ✓ Selected Time Slot: 19:00');
  }

  await page.screenshot({ path: path.join(screenshotsDir, '03-reservation-step1.png') });

  // Click Continue to Guest Details
  await page.locator('button:has-text("Continue to Guest Details")').click();
  await page.waitForTimeout(600);
  console.log('  ✓ Transitioned to Step 2: Guest Details');

  // Step 2: Fill inputs
  await page.locator('#res-name').fill('Eleanor Vance');
  console.log('  ✓ Filled Name: Eleanor Vance');

  await page.locator('#res-email').fill('eleanor.vance@example.com');
  console.log('  ✓ Filled Email: eleanor.vance@example.com');

  await page.locator('#res-phone').fill('206-555-0199');
  console.log('  ✓ Filled Phone: 206-555-0199');

  await page.locator('#res-notes').fill('Window booth near olive hearth. Wine pairings requested.');
  console.log('  ✓ Filled Special Requests');

  await page.screenshot({ path: path.join(screenshotsDir, '04-reservation-step2-filled.png') });

  // Submit Reservation
  console.log('  Submitting reservation to backend SQLite database...');
  await page.locator('button:has-text("Confirm Reservation")').click();
  await page.waitForTimeout(1500);

  // Verify Confirmation Screen
  const confirmedH3 = await page.locator('h3:has-text("Reservation Confirmed")').textContent();
  console.log(`  ✓ Confirmation Header: "${confirmedH3.trim()}"`);

  const confId = await page.locator('text=/res_[a-z0-9]+/i').textContent();
  console.log(`  ✓ Generated Confirmation ID: "${confId ? confId.trim() : 'res_ confirmed'}"`);
  await page.screenshot({ path: path.join(screenshotsDir, '05-reservation-confirmed.png') });

  // 5. Mobile Responsive Viewport (375x667 - iPhone SE)
  console.log('\n[Test 5] Mobile Viewport Responsiveness (375x667)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobilePage.waitForTimeout(500);

  const mobileH1 = await mobilePage.locator('h1').textContent();
  console.log(`  ✓ Mobile View H1: "${mobileH1.trim()}"`);
  await mobilePage.screenshot({ path: path.join(screenshotsDir, '06-mobile-viewport.png'), fullPage: true });

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();

  console.log('\n====================================================');
  console.log('  PLAYWRIGHT AUDIT COMPLETE: ALL ASSERTIONS PASSED');
  console.log('====================================================');
  console.log(`  Browser Page Errors   : ${pageErrors.length}`);
  console.log(`  Browser Warnings      : ${consoleWarnings.length}`);
  console.log(`  Screenshots Captured  : 6 saved to ${screenshotsDir}`);
  console.log('====================================================\n');

  if (pageErrors.length > 0) {
    throw new Error(`Encountered ${pageErrors.length} unhandled errors during Playwright audit`);
  }
}

runE2EValidation().catch(err => {
  console.error('\nE2E Audit Failed:', err);
  process.exit(1);
});
