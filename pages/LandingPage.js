const BasePage = require('./BasePage');

class LandingPage extends BasePage {
  constructor(page) {
    super(page);
    this.cookieBanner  = page.locator('a:has-text("Accept cookies")');
    this.loginLink     = page.locator('a[href="/login"]:has-text("Log in")').first();
  }

  async acceptCookies() {
    try {
      await this.cookieBanner.waitFor({ timeout: 5000, state: 'visible' });
      await this.cookieBanner.click();
      await this.waitForPageSettle(1000);
    } catch {
      // Cookie banner absent — continue
    }
  }

  async clickLogin() {
    await this.loginLink.waitFor({ state: 'visible' });
    await this.loginLink.click();
    await this.waitForPageSettle(4000);
  }
}

module.exports = LandingPage;
