const BasePage = require('./BasePage');

class CreateClassPage extends BasePage {
  constructor(page) {
    super(page);
    this.classNameInput   = page.locator('input[type="text"]').first();
    this.nextButton       = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    this.addMaterialBtn   = page.locator([
      'button:has-text("+ Add material")',
      'button:has-text("Add material")',
      'a:has-text("Add material")',
    ].join(', ')).first();
    this.finishButton     = page.locator([
      'button:has-text("Finish")',
      'button:has-text("Done")',
    ].join(', ')).first();
  }

  async enterClassName(name) {
    await this.classNameInput.waitFor({ state: 'visible' });
    await this.classNameInput.fill(name);
  }

  async clickNext() {
    await this.nextButton.waitFor({ state: 'visible' });
    await this.nextButton.click();
    await this.waitForPageSettle(2000);
  }

  async clickAddMaterial() {
    await this.addMaterialBtn.waitFor({ state: 'visible' });
    await this.addMaterialBtn.click();
    await this.waitForPageSettle(3000);
  }

  async clickFinish() {
    await this.finishButton.waitFor({ state: 'visible' });
    await this.finishButton.click();
    await this.waitForPageSettle(5000);
  }

  async isClassCreated() {
    const text = await this.page.evaluate(() => document.body.innerText.toLowerCase());
    return (
      text.includes('successfully created') ||
      text.includes('class created') ||
      text.includes('success')
    );
  }
}

module.exports = CreateClassPage;
