// Claude AI agent that autonomously executes the createClass test using Playwright.
// Run: node tests/createClass-agent.js

const Anthropic = require('@anthropic-ai/sdk');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const testData = require('../test-data/testData.json');

const client = new Anthropic();
const screenshotsDir = path.join(__dirname, 'test-results', 'agent-run');

let browser, context, page;

async function setupBrowser() {
  browser = await chromium.launch({ headless: false, slowMo: 300 });
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: screenshotsDir },
  });
  page = await context.newPage();
}

// ── Tool implementations ──────────────────────────────────────────────────────

const toolHandlers = {
  async browser_navigate({ url }) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    return `Navigated to ${url}. Current URL: ${page.url()}`;
  },

  async browser_snapshot() {
    const title = await page.title();
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
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
      for (const role of ['button', 'link', 'menuitem', 'option']) {
        try {
          await page.getByRole(role, { name: text, exact: false }).first().click({ timeout: 3000 });
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
    return `Filled "${selector}" with: ${value}`;
  },

  async browser_type({ selector, text }) {
    if (selector) {
      await page.locator(selector).first().fill(text, { timeout: 10000 });
    } else {
      await page.keyboard.type(text, { delay: 50 });
    }
    await page.waitForTimeout(500);
    return `Typed: ${text}`;
  },

  async browser_evaluate({ script }) {
    const result = await page.evaluate(script);
    return String(result ?? 'undefined');
  },

  async browser_screenshot({ filename }) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const name = filename || `screenshot-${Date.now()}.png`;
    const filePath = path.join(screenshotsDir, name);
    await page.screenshot({ path: filePath });
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
};

// ── Tool schemas ──────────────────────────────────────────────────────────────

const tools = [
  {
    name: 'browser_navigate',
    description: 'Navigate the browser to a URL and wait for the page to load',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The URL to navigate to' } },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Get the current page state: URL, title, visible text, and ARIA tree of interactive elements',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'browser_click',
    description: 'Click an element by CSS selector or visible text/label',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element' },
        text: { type: 'string', description: 'Visible text label of the element' },
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
    name: 'browser_type',
    description: 'Type text into the focused element or a specific input',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Optional CSS selector for the input' },
        text: { type: 'string', description: 'Text to type' },
      },
      required: ['text'],
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the browser. Use this when elements have pointer-events blocked by an overlay (e.g. to click a radio button: document.querySelector(\'input[type="radio"]\').click())',
    input_schema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript expression to evaluate' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page to document test progress',
    input_schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Optional filename e.g. "step-05-login.png"' },
      },
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for text or an element to appear on the page',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to wait for' },
        selector: { type: 'string', description: 'CSS selector to wait for' },
        timeout: { type: 'number', description: 'Timeout ms (default 10000)' },
      },
    },
  },
];

// ── System prompt (cached) ────────────────────────────────────────────────────

const systemPrompt = `You are a browser automation agent executing an end-to-end Playwright test.
You control a real Chromium browser through tool calls. Execute each step carefully, verify it worked, then move on.

## Test: Create Class with Material

Test data:
- URL: ${testData.url}
- Username: ${testData.username}
- Password: ${testData.password}
- Class name: ${testData.className}
- Material search: ${testData.materialSearch}
- Material name: ${testData.materialName}

## Steps

1. Navigate to URL
2. Accept cookie banner (click "Accept cookies" or similar)
3. Click "Log in" link
4. Fill Gigya login form:
   - Username: selector matching input[name="username"] or input[id*="gigya-loginID"]
   - Password: selector matching input[type="password"][id*="gigya-password"]
   - Click the submit button (input[type="submit"] or input.gigya-input-submit)
5. Verify dashboard URL contains /dashboard/teacher
6. Click "Create class" button
7. Type class name "${testData.className}" into the first text input
8. Click "Next" button
9. Click "+ Add material" button (wait up to 5s for it to appear)
10. Fill search input #umbrellaNameForSearch (or .search-input) with "${testData.materialSearch}"
11. Click suggestion "${testData.materialName}"
12. Select the material radio/checkbox — if pointer-events are blocked use browser_evaluate:
    document.querySelectorAll('input[type="radio"]')[0].dispatchEvent(new MouseEvent('click', {bubbles:true}))
13. Click "Add to class" or "Add to Class" button
14. Close "This material is collaborative" dialog — try buttons with text: close, ok, got it, continue, done
    or use: document.querySelector('[aria-label="Close"]').click()
15. Click "Finish" or "Done" button
16. Verify page contains success text: "successfully created", "class created", or "success"
17. Navigate to dashboard, verify "${testData.className}" is visible on the page

## Rules
- Take a snapshot after each major step to verify the outcome before continuing
- Take a screenshot at the start and before/after critical steps
- If a click fails due to an overlay, use browser_evaluate with JavaScript
- When done, report: PASS ✓ or FAIL ✗ with a summary of what happened`;

// ── Agent loop ────────────────────────────────────────────────────────────────

async function runAgent() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  await setupBrowser();

  console.log('Starting Claude agent for createClass test...\n');
  console.log(`Screenshots: ${screenshotsDir}\n`);

  const messages = [
    {
      role: 'user',
      content:
        'Execute the test. Navigate to the URL, follow every step, take snapshots to verify each one, and report PASS or FAIL at the end.',
    },
  ];

  const maxIterations = 60;

  try {
    for (let i = 1; i <= maxIterations; i++) {
      process.stdout.write(`[Turn ${i}] `);

      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 8192,
        thinking: { type: 'adaptive' },
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

      console.log(`stop=${response.stop_reason}  cache_read=${response.usage.cache_read_input_tokens}`);

      const toolUses = [];
      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          console.log(`\nAgent: ${block.text}\n`);
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

      // Execute tools
      const toolResults = [];
      for (const tu of toolUses) {
        const preview = JSON.stringify(tu.input).slice(0, 80);
        process.stdout.write(`  → ${tu.name}(${preview}${preview.length === 80 ? '...' : ''}) `);
        let content;
        try {
          content = await toolHandlers[tu.name](tu.input);
          if (!content) throw new Error(`Unknown tool: ${tu.name}`);
          console.log(`✓`);
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
    await page.waitForTimeout(1500);
    await context.close();
    await browser.close();
    console.log(`\nDone. Results in: ${screenshotsDir}`);
  }
}

runAgent().catch((err) => {
  console.error('Agent failed:', err.message);
  process.exit(1);
});
