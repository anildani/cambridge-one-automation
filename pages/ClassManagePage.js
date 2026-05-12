const BasePage = require('./BasePage');

class ClassManagePage extends BasePage {
  constructor(page) {
    super(page);
  }

  // Click the first h4 class-name heading on the dashboard that matches
  async openClass(className) {
    const classHeading = this.page.locator('h4').filter({ hasText: className }).first();
    await classHeading.waitFor({ state: 'visible' });
    await classHeading.click();
    // Wait until the browser has landed on a class page
    await this.page.waitForURL(
      url => url.toString().includes('/class/teacher'),
      { timeout: 20000, waitUntil: 'domcontentloaded' }
    );
    await this.waitForPageSettle(2000);
  }

  // Click the custom checkbox for the teacher (div[role="checkbox"])
  async selectTeacherCheckbox() {
    // Wait for the Teachers section to finish rendering before looking for the checkbox
    await this.page.waitForSelector('h2:has-text("Teachers")', { timeout: 20000 });
    const checkbox = this.page.locator('div[role="checkbox"].custom-control-checkbox-wrapper').first();
    await checkbox.waitFor({ state: 'visible', timeout: 20000 });
    await checkbox.click();
    await this.waitForPageSettle(800);
  }

  // Click the Remove button that appears after the checkbox is selected
  async clickRemoveButton() {
    const removeBtn = this.page.locator('#remove-himself-teacher-btn').first();
    await removeBtn.waitFor({ state: 'visible' });
    await removeBtn.click();
    await this.waitForPageSettle(1500);
  }

  // Click "Remove" in the confirmation modal (#teacher-remove-himself-modal-remove)
  async confirmRemoval() {
    const confirmBtn = this.page.locator('#teacher-remove-himself-modal-remove').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 8000 });
    await confirmBtn.click();
    // Removing yourself auto-redirects to the teacher dashboard
    await this.page.waitForURL(
      url => url.toString().includes('/dashboard/teacher'),
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    );
    await this.waitForPageSettle(2000);
  }
}

module.exports = ClassManagePage;
