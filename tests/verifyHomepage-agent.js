// Claude AI agent: navigates to Cambridge One, logs in as a teacher, verifies dashboard shows "Anil".
// Run locally : node tests/verifyHomepage-agent.js
// Run on LambdaTest: LT_USERNAME=<user> LT_ACCESS_KEY=<key> node tests/verifyHomepage-agent.js
// Email report : set SMTP_USER, SMTP_PASS for auth; EMAIL_FROM for sender; EMAIL_HOST, EMAIL_PORT optional

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { chromium } = require('playwright');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const TARGET_URL   = process.env.TARGET_URL    || 'https://www.cambridgeone.org/';
const USERNAME     = 'anildaniteacher1@mailsac.com';
const PASSWORD     = 'Compro11';
const LT_USERNAME  = process.env.LT_USERNAME;
const LT_ACCESS_KEY = process.env.LT_ACCESS_KEY;
const USE_LAMBDATEST = !!(LT_USERNAME && LT_ACCESS_KEY);

const EMAIL_TO   = 'anil.dani@comprotechnologies.com';
const EMAIL_FROM = process.env.EMAIL_FROM;           // verified sender address (required)
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const SMTP_USER  = process.env.SMTP_USER;            // SMTP auth login
const SMTP_PASS  = process.env.SMTP_PASS;            // SMTP auth password

const client = new Anthropic();
const screenshotsDir = path.join(__dirname, 'test-results', 'homepage-agent');

let browser, context, page;

async function setupBrowser() {
  if (USE_LAMBDATEST) {
    const capabilities = {
      browserName: 'Chrome',
      browserVersion: 'latest',
      'LT:Options': {
        platform: 'Windows 11',
        build: 'Cambridge One – Teacher Login',
        name: 'verifyHomepage-agent',
        user: LT_USERNAME,
        accessKey: LT_ACCESS_KEY,
        network: true,
        video: true,
        console: true,
        tunnel: false,
      },
    };
    const wsEndpoint =
      `wss://cdp.lambdatest.com/playwright?capabilities=` +
      encodeURIComponent(JSON.stringify(capabilities));
    browser = await chromium.connect({ wsEndpoint });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  } else {
    const isCI = !!(process.env.CI || process.env.GITHUB_ACTIONS);
    browser = await chromium.launch({ headless: isCI, slowMo: isCI ? 0 : 300 });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  }
  page = await context.newPage();
}

// ── Tool implementations ──────────────────────────────────────────────────────

const toolHandlers = {
  async browser_navigate({ url }) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    return `Navigated to ${url}. Current URL: ${page.url()}`;
  },

  async browser_snapshot() {
    const title = await page.title();
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    let ariaTree = '';
    try {
      ariaTree = await page.ariaSnapshot();
    } catch (_) {
      try {
        const snap = await page.accessibility.snapshot();
        ariaTree = JSON.stringify(snap, null, 2);
      } catch (__) {}
    }
    const output = JSON.stringify({ title, url, bodyText }, null, 2) + '\n\nARIA:\n' + ariaTree;
    return output.slice(0, 8000);
  },

  async browser_click({ selector, text }) {
    if (!selector && !text) throw new Error('Provide selector or text');
    if (selector) {
      await page.locator(selector).first().click({ timeout: 12000 });
    } else {
      let clicked = false;
      for (const role of ['button', 'link', 'menuitem']) {
        try {
          await page.getByRole(role, { name: text, exact: false }).first().click({ timeout: 4000 });
          clicked = true;
          break;
        } catch (_) {}
      }
      if (!clicked) {
        await page.getByText(text, { exact: false }).first().click({ timeout: 8000 });
      }
    }
    await page.waitForTimeout(1500);
    return `Clicked "${selector || text}". URL: ${page.url()}`;
  },

  async browser_fill({ selector, value }) {
    await page.locator(selector).first().fill(value, { timeout: 10000 });
    await page.waitForTimeout(500);
    return `Filled "${selector}" with value`;
  },

  async browser_verify_elements({ elements }) {
    const results = [];
    for (const { name, selector, fallbackText } of elements) {
      let found = false;
      try {
        if (selector) {
          found = (await page.locator(selector).count()) > 0;
        }
        if (!found && fallbackText) {
          for (const role of ['link', 'button', 'heading']) {
            const count = await page.getByRole(role, { name: fallbackText, exact: false }).count();
            if (count > 0) { found = true; break; }
          }
        }
        if (!found && fallbackText) {
          found = (await page.getByText(fallbackText, { exact: false }).count()) > 0;
        }
      } catch (_) {
        found = false;
      }
      results.push({ element: name, found });
    }
    const allPassed = results.every(r => r.found);
    return JSON.stringify({ allPassed, results }, null, 2);
  },

  async browser_screenshot({ filename, fullPage = false }) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const name = filename || `screenshot-${Date.now()}.png`;
    const filePath = path.join(screenshotsDir, name);
    await page.screenshot({ path: filePath, fullPage });
    return `Screenshot saved: ${filePath}`;
  },

  async browser_wait_for({ text, selector, timeout = 10000 }) {
    if (text) {
      await page.waitForSelector(`text=${text}`, { timeout });
    } else if (selector) {
      await page.waitForSelector(selector, { timeout });
    } else {
      await page.waitForTimeout(2000);
    }
    return 'Wait complete';
  },

  async browser_evaluate({ script }) {
    const result = await page.evaluate(script);
    return String(result ?? 'undefined');
  },
};

// ── Tool schemas ──────────────────────────────────────────────────────────────

const tools = [
  {
    name: 'browser_navigate',
    description: 'Navigate the browser to a URL and wait for the page to load',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Get the current page state: URL, title, visible text, and ARIA tree',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'browser_click',
    description: 'Click an element by CSS selector or visible text/label',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        text: { type: 'string', description: 'Visible text of the element' },
      },
    },
  },
  {
    name: 'browser_fill',
    description: 'Clear and fill an input field by CSS selector',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input' },
        value: { type: 'string', description: 'Value to fill' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'browser_verify_elements',
    description: 'Verify that specific elements or text are visible on the page. Returns pass/fail per element.',
    input_schema: {
      type: 'object',
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              selector: { type: 'string' },
              fallbackText: { type: 'string' },
            },
            required: ['name'],
          },
        },
      },
      required: ['elements'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    input_schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        fullPage: { type: 'boolean', description: 'Capture entire scrollable page' },
      },
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for text or a selector to appear on the page',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        selector: { type: 'string' },
        timeout: { type: 'number' },
      },
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the browser page context',
    input_schema: {
      type: 'object',
      properties: { script: { type: 'string' } },
      required: ['script'],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

const systemPrompt = `You are a browser automation agent executing an end-to-end login and verification test.
You control a real Chromium browser through tool calls. Execute each step carefully, verify it worked, then move on.

## Test: Login as Teacher and Verify Dashboard

Credentials:
- URL: ${TARGET_URL}
- Username: ${USERNAME}
- Password: ${PASSWORD}
- Expected name on dashboard: "Anil"

## Steps

1. Navigate to ${TARGET_URL}
2. Take a screenshot named "01-homepage.png"
3. Take a snapshot to inspect the page
4. Accept cookie banner if present (click "Accept cookies", "Accept all", or similar)
5. Click the "Log in" link/button
6. Take a snapshot to see the login form
7. Fill the username field — try these selectors in order:
   - input[name="username"]
   - input[id*="loginID"]
   - input[type="email"]
8. Fill the password field — try these selectors in order:
   - input[type="password"]
   - input[id*="password"]
9. Click the submit/login button — try:
   - input[type="submit"]
   - button[type="submit"]
   - text: "Log in" or "Sign in"
10. Wait for navigation (wait for selector: [href*="dashboard"] or text "dashboard")
11. Take a screenshot named "02-dashboard.png"
12. Take a snapshot to inspect the dashboard
13. Verify the name "Anil" is visible on the dashboard page using browser_verify_elements:
    - element name: "User name Anil", fallbackText: "Anil"
14. Take a full-page screenshot named "03-dashboard-fullpage.png" (fullPage: true)
15. Report final result:
    - PASS ✓ if "Anil" is found on the dashboard
    - FAIL ✗ if "Anil" is not found, with details

## Rules
- Take a snapshot after each major step to confirm the outcome
- If a form fill or click fails with one selector, try the next alternative
- If an overlay blocks a click, use browser_evaluate to click via JavaScript
- Report clearly: PASS ✓ or FAIL ✗ with a summary`;

// ── Email report ──────────────────────────────────────────────────────────────

async function sendResultEmail(passed, summary, screenshotPath) {
  console.log('\n── Email report ──────────────────────────────────');
  console.log(`  SMTP_USER  : ${SMTP_USER  || '(not set)'}`);
  console.log(`  EMAIL_FROM : ${EMAIL_FROM || '(not set)'}`);
  console.log(`  EMAIL_HOST : ${EMAIL_HOST}`);
  console.log(`  EMAIL_PORT : ${EMAIL_PORT}`);
  console.log(`  SMTP_PASS  : ${SMTP_PASS ? '(set)' : '(not set)'}`);

  if (!SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    console.log('  → Skipped: SMTP_USER, SMTP_PASS, or EMAIL_FROM not set.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Verify SMTP connection before sending
  try {
    await transporter.verify();
    console.log('  SMTP connection verified ✓');
  } catch (err) {
    console.error(`  SMTP connection failed ✗ — ${err.message}`);
    return;
  }

  const status = passed ? 'PASS ✓' : 'FAIL ✗';
  const subject = `Cambridge One Verification – ${status}`;
  const runner  = USE_LAMBDATEST ? `LambdaTest (${LT_USERNAME})` : 'Local Chromium';
  const hasScreenshot = screenshotPath && fs.existsSync(screenshotPath);
  const html = `
    <h2 style="color:${passed ? '#2e7d32' : '#c62828'}">${status}</h2>
    <p><b>URL:</b> ${TARGET_URL}</p>
    <p><b>User:</b> ${USERNAME}</p>
    <p><b>Runner:</b> ${runner}</p>
    <p><b>Time:</b> ${new Date().toISOString()}</p>
    <hr/>
    <pre style="background:#f5f5f5;padding:12px;border-radius:4px">${summary}</pre>
    ${hasScreenshot ? '<p><b>Dashboard screenshot attached.</b></p>' : ''}
  `;
  const attachments = hasScreenshot
    ? [{ filename: 'dashboard.png', path: screenshotPath, contentType: 'image/png' }]
    : [];

  try {
    await transporter.sendMail({ from: EMAIL_FROM, to: EMAIL_TO, subject, html, attachments });
    console.log(`  Email sent to ${EMAIL_TO} — ${status}${hasScreenshot ? ' (with screenshot)' : ''}`);
  } catch (err) {
    console.error(`  Failed to send email ✗ — ${err.message}`);
  }
}

// ── Agent loop ────────────────────────────────────────────────────────────────

async function runAgent() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  await setupBrowser();

  console.log('='.repeat(60));
  console.log('  Teacher Login & Dashboard Verification Agent');
  console.log(`  URL      : ${TARGET_URL}`);
  console.log(`  Username : ${USERNAME}`);
  console.log(`  Verifying: name "Anil" on dashboard`);
  console.log(`  Runner   : ${USE_LAMBDATEST ? `LambdaTest (${LT_USERNAME})` : 'Local Chromium'}`);
  console.log(`  Screenshots: ${screenshotsDir}`);
  console.log('='.repeat(60) + '\n');

  const messages = [
    {
      role: 'user',
      content: `Execute the test: navigate to ${TARGET_URL}, log in as teacher ${USERNAME}, then verify the dashboard page shows the name "Anil". Report PASS or FAIL.`,
    },
  ];

  const maxIterations = 30;
  let testPassed = false;
  let finalSummary = 'No summary captured.';

  try {
    for (let i = 1; i <= maxIterations; i++) {
      process.stdout.write(`[Turn ${i}] `);

      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools,
        messages,
      });

      console.log(`stop=${response.stop_reason}  cache_read=${response.usage.cache_read_input_tokens ?? 0}`);

      const toolUses = [];
      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          console.log(`\nAgent: ${block.text}\n`);
          if (/PASS\s*[✓✓]/u.test(block.text)) { testPassed = true;  finalSummary = block.text; }
          if (/FAIL\s*[✗✗]/u.test(block.text)) { testPassed = false; finalSummary = block.text; }
        } else if (block.type === 'tool_use') {
          toolUses.push(block);
        }
      }

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        console.log('\nAgent finished.');
        break;
      }

      if (response.stop_reason !== 'tool_use') {
        console.log(`\nUnexpected stop: ${response.stop_reason}`);
        break;
      }

      const toolResults = [];
      for (const tu of toolUses) {
        const preview = JSON.stringify(tu.input).slice(0, 80);
        process.stdout.write(`  → ${tu.name}(${preview}${preview.length === 80 ? '...' : ''}) `);
        let content;
        try {
          const handler = toolHandlers[tu.name];
          if (!handler) throw new Error(`Unknown tool: ${tu.name}`);
          content = await handler(tu.input);
          console.log('✓');
        } catch (err) {
          content = `ERROR: ${err.message}`;
          console.log(`✗ ${err.message}`);
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: String(content).slice(0, 8000),
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }
  } finally {
    await page.waitForTimeout(1000);
    await context.close();
    await browser.close();
    console.log(`\nDone. Screenshots saved in: ${screenshotsDir}`);
    await sendResultEmail(testPassed, finalSummary, path.join(screenshotsDir, '02-dashboard.png'))
      .catch(err => console.error(`  Unexpected email error: ${err.message}`));
  }
}

runAgent().catch((err) => {
  console.error('Agent failed:', err.message);
  process.exit(1);
});
