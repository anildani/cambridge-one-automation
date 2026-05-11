const BasePage = require('./BasePage');

class AddMaterialPage extends BasePage {
  constructor(page) {
    super(page);
    // Exact ID discovered via DOM inspection
    this.searchInput    = page.locator('#umbrellaNameForSearch, .search-input').first();
    this.addToClassBtn  = page.locator([
      'button:has-text("Add to class")',
      'button:has-text("Add to Class")',
    ].join(', ')).first();
  }

  async searchMaterial(searchText) {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(searchText);
    await this.waitForPageSettle(3000);
  }

  async selectSuggestion(materialName) {
    const suggestion = this.page.locator(`text=${materialName}`).first();
    await suggestion.waitFor({ state: 'visible' });
    await suggestion.click();
    await this.waitForPageSettle(2000);
  }

  // Radio button sits behind a pointer-events overlay — select via JS
  async selectMaterialViaJS() {
    await this.page.evaluate(() => {
      const radios = document.querySelectorAll('input[type="radio"]');
      if (radios.length > 0) {
        radios[0].checked = true;
        radios[0].dispatchEvent(new Event('change', { bubbles: true }));
        radios[0].dispatchEvent(new Event('input',  { bubbles: true }));
        radios[0].click();
        return;
      }
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        checkboxes[0].checked = true;
        checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
        checkboxes[0].click();
      }
    });
    await this.waitForPageSettle(1500);
  }

  async clickAddToClass() {
    await this.addToClassBtn.waitFor({ state: 'visible' });
    await this.addToClassBtn.click();
    await this.waitForPageSettle(3000);
  }

  // "This material is collaborative" info dialog — close via JS to avoid overlay issues
  async closeCollaborativeDialog() {
    await this.waitForPageSettle(1500);
    const closed = await this.page.evaluate(() => {
      const targets = ['close', 'ok', 'got it', 'dismiss', 'continue', 'done', 'i understand'];
      const clickable = Array.from(document.querySelectorAll('button, [role="button"], a'));
      const btn = clickable.find(el =>
        targets.includes((el.textContent || '').trim().toLowerCase())
      );
      if (btn) { btn.click(); return btn.textContent.trim(); }

      const icon = document.querySelector(
        '[aria-label="Close"], [aria-label="close"], .modal .close, button.close'
      );
      if (icon) { icon.click(); return 'close icon'; }
      return null;
    });

    if (!closed) {
      await this.page.keyboard.press('Escape');
    }
    await this.waitForPageSettle(2000);
  }
}

module.exports = AddMaterialPage;
