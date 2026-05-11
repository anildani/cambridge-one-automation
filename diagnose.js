const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating...');
  await page.goto('https://micro-nemo.comprodls.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Find cookie banner
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body text snippet:', bodyText);

  // Look for cookie-related elements
  const cookieEls = await page.evaluate(() => {
    const els = document.querySelectorAll('button');
    return Array.from(els).map(b => b.textContent.trim()).filter(t => t.length < 50);
  });
  console.log('Buttons on landing page:', cookieEls.slice(0, 10));

  await page.screenshot({ path: 'diag-landing.png' });

  // Click Log in
  const loginBtns = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a, button')];
    return links.map(l => ({ tag: l.tagName, text: l.textContent.trim(), href: l.href || '' }))
      .filter(l => l.text.length < 30);
  });
  console.log('\nAll links/buttons:', loginBtns.slice(0, 20));

  // Click login
  await page.locator('a:has-text("Log in"), button:has-text("Log in"), a:has-text("Login")').first().click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'diag-login.png' });
  console.log('\nURL after login click:', page.url());

  // Inspect frames
  const frames = page.frames();
  console.log('\nFrames count:', frames.length);
  for (const f of frames) {
    console.log('  Frame URL:', f.url());
    try {
      const inputs = await f.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          visible: i.offsetWidth > 0 && i.offsetHeight > 0,
          display: window.getComputedStyle(i).display,
          visibility: window.getComputedStyle(i).visibility,
          opacity: window.getComputedStyle(i).opacity,
        }));
      });
      if (inputs.length) console.log('  Inputs:', JSON.stringify(inputs));
    } catch(e) {
      console.log('  Frame eval error:', e.message);
    }
  }

  // Inspect main page inputs
  const mainInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      placeholder: i.placeholder,
      visible: i.offsetWidth > 0 && i.offsetHeight > 0,
      display: window.getComputedStyle(i).display,
    }));
  });
  console.log('\nMain page inputs:', JSON.stringify(mainInputs, null, 2));

  // All buttons on login page
  const loginButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
      tag: b.tagName,
      type: b.type,
      text: b.textContent.trim(),
      value: b.value,
      class: b.className,
      visible: b.offsetWidth > 0 && b.offsetHeight > 0,
    }));
  });
  console.log('\nLogin page buttons:', JSON.stringify(loginButtons, null, 2));

  await browser.close();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
