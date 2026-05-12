const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // Gigya renders one visible login screenset among several hidden ones
    this.usernameField = page.locator('input[name="username"][id*="gigya-loginID"]:visible').first();
    this.passwordField = page.locator('input[type="password"][id*="gigya-password"]:visible').first();
    this.loginButton   = page.locator('input.gigya-input-submit[value="Log in"]:visible').first();
  }

  async login(username, password) {
    await this.usernameField.waitFor({ state: 'visible' });
    await this.usernameField.fill(username);

    await this.passwordField.waitFor({ state: 'visible' });
    await this.passwordField.fill(password);

    await this.loginButton.waitFor({ state: 'visible' });
    await this.loginButton.click();
    await this.page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000, waitUntil: 'domcontentloaded' });
  }

  isDashboardUrl() {
    return !this.page.url().includes('/login');
  }
}

module.exports = LoginPage;
