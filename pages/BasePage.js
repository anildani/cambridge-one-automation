class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
  }

  async waitForPageSettle(ms = 2000) {
    await this.page.waitForTimeout(ms);
  }
}

module.exports = BasePage;
