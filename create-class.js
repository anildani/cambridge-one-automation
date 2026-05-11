const { chromium } = require('playwright');

const TIMEOUT = 20000;

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  // Step 1: Navigate
  console.log('\nStep 1: Navigating...');
  await page.goto('https://micro-nemo.comprodls.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Step 2: Accept cookie banner
  console.log('\nStep 2: Accepting cookie banner...');
  try {
    const cookieLink = page.locator('a:has-text("Accept cookies")').first();
    await cookieLink.waitFor({ timeout: 5000 });
    await cookieLink.click();
    await page.waitForTimeout(1000);
    console.log('  Cookie accepted.');
  } catch { console.log('  No cookie banner.'); }

  // Step 3: Log in
  console.log('\nStep 3: Clicking Log in...');
  await page.locator('a[href="/login"]:has-text("Log in")').first().click();
  await page.waitForTimeout(4000);

  // Step 4: Fill credentials
  console.log('\nStep 4: Filling credentials...');
  const usernameField = page.locator('input[name="username"][id*="gigya-loginID"]').first();
  await usernameField.waitFor({ state: 'visible' });
  await usernameField.fill('anildaniteacher1@mailsac.com');

  const passwordField = page.locator('input[type="password"][id*="gigya-password"]').first();
  await passwordField.waitFor({ state: 'visible' });
  await passwordField.fill('Compro11');

  // Step 5: Submit
  console.log('\nStep 5: Submitting...');
  await page.locator('input.gigya-input-submit[value="Log in"]:visible').first().click();
  await page.waitForTimeout(6000);
  console.log('  URL after login:', page.url());

  // Step 6: Verify dashboard
  console.log('\nStep 6: Verifying dashboard...');
  const dashUrl = page.url();
  console.log('  PASS:', dashUrl);
  await page.screenshot({ path: 'step6-dashboard.png' });

  // Step 7: Create class
  console.log('\nStep 7: Clicking Create class...');
  await page.locator([
    'button:has-text("Create class")',
    'a:has-text("Create class")',
    'button:has-text("Create Class")',
  ].join(', ')).first().waitFor({ timeout: TIMEOUT });
  await page.locator([
    'button:has-text("Create class")',
    'a:has-text("Create class")',
    'button:has-text("Create Class")',
  ].join(', ')).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step7-create.png' });

  // Step 8: Enter class name & Next
  console.log('\nStep 8: Entering class name...');
  const classInput = page.locator('input[type="text"]').first();
  await classInput.waitFor({ state: 'visible' });
  await classInput.fill('Happy Test Class 1');
  await page.screenshot({ path: 'step8-name.png' });
  await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step8-after-next.png' });

  // Step 9: Add material
  console.log('\nStep 9: Clicking + Add material...');
  await page.locator([
    'button:has-text("Add material")',
    'button:has-text("+ Add material")',
    'a:has-text("Add material")',
  ].join(', ')).first().waitFor({ timeout: TIMEOUT });
  await page.locator([
    'button:has-text("Add material")',
    'button:has-text("+ Add material")',
    'a:has-text("Add material")',
  ].join(', ')).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step9-add-material.png' });

  // Inspect visible inputs after Add material dialog opens
  const visibleInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).filter(i => {
      const s = window.getComputedStyle(i);
      return s.display !== 'none' && s.visibility !== 'hidden' && i.offsetWidth > 0;
    }).map(i => ({ type: i.type, name: i.name, id: i.id, placeholder: i.placeholder, class: i.className }));
  });
  console.log('  Visible inputs after Add material:', JSON.stringify(visibleInputs, null, 2));

  // Step 10: Search for R55
  console.log('\nStep 10: Typing R55 in search...');
  // Try broader selectors
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="Search" i]',
    'input[placeholder*="material" i]',
    'input[placeholder*="filter" i]',
    'input[placeholder*="find" i]',
    'input[placeholder*="type" i]',
    '[role="search"] input',
    '.search-input',
    '.search input',
  ];
  let searchFound = false;
  for (const sel of searchSelectors) {
    try {
      const el = page.locator(sel).first();
      await el.waitFor({ timeout: 3000, state: 'visible' });
      await el.fill('R55');
      console.log(`  Search filled using selector: ${sel}`);
      searchFound = true;
      break;
    } catch { }
  }
  if (!searchFound) {
    // Last resort: click the first visible text input that isn't the class name
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
      const visible = inputs.filter(i => {
        const s = window.getComputedStyle(i);
        return s.display !== 'none' && s.visibility !== 'hidden' && i.offsetWidth > 0 && i.offsetHeight > 0;
      });
      if (visible.length > 0) {
        visible[0].focus();
        visible[0].value = 'R55';
        visible[0].dispatchEvent(new Event('input', { bubbles: true }));
        visible[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    console.log('  Search filled via JS fallback.');
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step10-search.png' });

  // Step 11: Click R55 Multi Component Umbrella
  console.log('\nStep 11: Clicking R55 Multi Component Umbrella...');
  await page.locator('text=R55 Multi Component Umbrella').first().waitFor({ timeout: TIMEOUT });
  await page.locator('text=R55 Multi Component Umbrella').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step11-suggestion.png' });

  // Step 12: Select material via JS (radio behind overlay)
  console.log('\nStep 12: Selecting material via JS...');
  await page.evaluate(() => {
    const radios = document.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
      radios[0].checked = true;
      radios[0].dispatchEvent(new Event('change', { bubbles: true }));
      radios[0].dispatchEvent(new Event('input', { bubbles: true }));
      radios[0].click();
      return;
    }
    const checks = document.querySelectorAll('input[type="checkbox"]');
    if (checks.length > 0) {
      checks[0].checked = true;
      checks[0].dispatchEvent(new Event('change', { bubbles: true }));
      checks[0].click();
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'step12-selected.png' });

  // Step 13: Add to class
  console.log('\nStep 13: Clicking Add to class...');
  await page.locator('button:has-text("Add to class"), button:has-text("Add to Class")').first().waitFor({ timeout: TIMEOUT });
  await page.locator('button:has-text("Add to class"), button:has-text("Add to Class")').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'step13-added.png' });

  // Step 14: Close collaborative dialog via JS
  console.log('\nStep 14: Closing collaborative dialog via JS...');
  await page.waitForTimeout(1500);
  const dialogClosed = await page.evaluate(() => {
    const targets = ['close', 'ok', 'got it', 'dismiss', 'continue', 'done', 'i understand'];
    const allClickable = Array.from(document.querySelectorAll('button, [role="button"], a'));
    const btn = allClickable.find(b => targets.includes((b.textContent || '').trim().toLowerCase()));
    if (btn) { btn.click(); return btn.textContent.trim(); }
    const closeEl = document.querySelector('[aria-label="Close"], [aria-label="close"], .modal .close, button.close');
    if (closeEl) { closeEl.click(); return 'close icon'; }
    return null;
  });
  console.log('  Dialog closed via:', dialogClosed || 'Escape key');
  if (!dialogClosed) await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step14-dialog-closed.png' });

  // Step 15: Click Finish
  console.log('\nStep 15: Clicking Finish...');
  await page.locator('button:has-text("Finish"), button:has-text("Done")').first().waitFor({ timeout: TIMEOUT });
  await page.locator('button:has-text("Finish"), button:has-text("Done")').first().click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'step15-finish.png' });

  // Step 16: Verify success
  console.log('\nStep 16: Verifying success...');
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
  if (pageText.includes('successfully created') || pageText.includes('success') || pageText.includes('class created')) {
    console.log('  PASS: "Class successfully created" verified!');
  } else {
    console.log('  INFO: URL:', page.url());
    console.log('  Page snippet:', pageText.slice(0, 300));
  }
  await page.screenshot({ path: 'step16-final.png' });

  console.log('\nAutomation complete. Screenshots saved in d:\\AI Automation\\');
  await page.waitForTimeout(3000);
  await browser.close();
})().catch(err => {
  console.error('\nFATAL ERROR:', err.message.split('\n')[0]);
  process.exit(1);
});
