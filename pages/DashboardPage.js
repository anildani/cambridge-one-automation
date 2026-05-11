const BasePage = require('./BasePage');
const path = require('path');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.createClassBtn = page.locator([
      'button:has-text("Create class")',
      'a:has-text("Create class")',
      'button:has-text("Create Class")',
      'a:has-text("Create Class")',
    ].join(', ')).first();
  }

  isTeacherDashboard() {
    return this.page.url().includes('/dashboard/teacher');
  }

  async clickCreateClass() {
    await this.createClassBtn.waitFor({ state: 'visible' });
    await this.createClassBtn.click();
    await this.waitForPageSettle(2000);
  }

  async verifyClassOnDashboard(className) {
    // Success page shows "Go to dashboard" as a link styled as a button
    try {
      const goToDashBtn = this.page.getByText('Go to dashboard').first();
      await goToDashBtn.waitFor({ state: 'visible', timeout: 8000 });
      await goToDashBtn.click();
      await this.waitForPageSettle(5000);
    } catch {
      // Already on the dashboard, no button present
    }

    // Dump visible text to help diagnose if class name is present
    const bodyText = await this.page.evaluate(() => document.body.innerText);
    const found = bodyText.includes(className);
    console.log(`  Class "${className}" found in page text: ${found}`);

    // Use partial match in case the name is wrapped with extra whitespace
    const classCard = this.page.getByText(className, { exact: false }).first();

    await classCard.waitFor({ state: 'visible' });
    await classCard.scrollIntoViewIfNeeded();

    // Pin the header and highlight only the first matching class card with a red border
    await this.page.evaluate((name) => {
      // Make top-bar / header elements sticky so they appear in the viewport shot
      document.querySelectorAll('header, nav, [class*="header"], [class*="navbar"], [class*="top-bar"]')
        .forEach(el => {
          el.style.position = 'sticky';
          el.style.top      = '0';
          el.style.zIndex   = '9999';
        });

      // Walk the DOM and highlight only the first leaf element whose text matches
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.children.length === 0 && node.textContent.trim() === name) {
          node.style.outline       = '3px solid red';
          node.style.outlineOffset = '3px';
          node.scrollIntoView({ behavior: 'instant', block: 'center' });
          return; // stop at the first match
        }
      }
    }, className);

    await this.waitForPageSettle(1000);

    const screenshotPath = path.join('screenshots', 'dashboard-class-verified.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: false });

    return await classCard.isVisible();
  }
}

module.exports = DashboardPage;
