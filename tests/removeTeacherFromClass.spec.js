const { test, expect } = require('./fixtures');
const testData = require('../test-data/testData.json');

const LandingPage     = require('../pages/LandingPage');
const LoginPage       = require('../pages/LoginPage');
const DashboardPage   = require('../pages/DashboardPage');
const ClassManagePage = require('../pages/ClassManagePage');

const DASHBOARD_URL = `${testData.url}dashboard/teacher/dashboard`;

test.describe('Teacher - Remove Teacher from All Classes', () => {
  test('For every class on dashboard: open → select teacher checkbox → remove → verify count drops', async ({ page }) => {
    test.setTimeout(600000); // 10 min — processing all classes can take several minutes
    const landingPage     = new LandingPage(page);
    const loginPage       = new LoginPage(page);
    const dashboardPage   = new DashboardPage(page);
    const classManagePage = new ClassManagePage(page);

    // ── 1. Navigate ────────────────────────────────────────────────
    await landingPage.navigate(testData.url);

    // ── 2. Accept cookie banner ────────────────────────────────────
    await landingPage.acceptCookies();

    // ── 3. Click Log in ────────────────────────────────────────────
    await landingPage.clickLogin();

    // ── 4. Fill credentials & submit ──────────────────────────────
    await loginPage.login(testData.username, testData.password);

    // ── 5. Verify teacher dashboard ───────────────────────────────
    expect(loginPage.isDashboardUrl()).toBeTruthy();
    expect(dashboardPage.isTeacherDashboard()).toBeTruthy();

    // ── 6. Check initial class count ──────────────────────────────
    let classNames = await dashboardPage.getAllClassNames();
    const totalClasses = classNames.length;
    console.log(`\n  Total classes on dashboard: ${totalClasses}`);

    if (totalClasses === 0) {
      console.log('  No classes found — nothing to remove.');
      return;
    }

    // ── 7. Iteratively process one class at a time ─────────────────
    let iteration = 0;
    const maxIterations = totalClasses + 5; // safety ceiling

    while (iteration < maxIterations) {
      classNames = await dashboardPage.getAllClassNames();
      if (classNames.length === 0) break;

      const className   = classNames[0];
      const countBefore = classNames.length;
      iteration++;
      console.log(`\n  [${iteration}] Opening "${className}" (${countBefore} remaining)`);

      // 7a. Open the class from the dashboard
      await classManagePage.openClass(className);

      // 7b. Select teacher checkbox (custom div[role="checkbox"])
      await classManagePage.selectTeacherCheckbox();

      // 7c. Click the Remove button that appears
      await classManagePage.clickRemoveButton();

      // 7d. Confirm modal — auto-redirects to dashboard on success
      await classManagePage.confirmRemoval();

      // 7f. Verify the class count dropped by 1
      const reduced = await dashboardPage.isClassCountReduced(countBefore);
      console.log(`  Count reduced from ${countBefore}: ${reduced}`);
      expect(reduced, `Expected class count to drop after removing "${className}"`).toBeTruthy();
    }

    console.log(`\n  Done. Processed ${iteration} class(es).`);
  });
});
