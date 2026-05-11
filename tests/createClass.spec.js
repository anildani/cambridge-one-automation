const { test, expect } = require('./fixtures');
const testData = require('../test-data/testData.json');

const LandingPage    = require('../pages/LandingPage');
const LoginPage      = require('../pages/LoginPage');
const DashboardPage  = require('../pages/DashboardPage');
const CreateClassPage = require('../pages/CreateClassPage');
const AddMaterialPage = require('../pages/AddMaterialPage');

test.describe('Teacher - Create Class with Material', () => {
  test('Create class "Happy Test Class 1" with R55 Multi Component Umbrella', async ({ page }) => {
    const landingPage    = new LandingPage(page);
    const loginPage      = new LoginPage(page);
    const dashboardPage  = new DashboardPage(page);
    const createClassPage = new CreateClassPage(page);
    const addMaterialPage = new AddMaterialPage(page);

    // ── 1. Navigate ────────────────────────────────────────────────
    await landingPage.navigate(testData.url);

    // ── 2. Accept cookie banner ────────────────────────────────────
    await landingPage.acceptCookies();

    // ── 3. Click Log in ────────────────────────────────────────────
    await landingPage.clickLogin();

    // ── 4–5. Fill credentials & submit ────────────────────────────
    await loginPage.login(testData.username, testData.password);

    // ── 6. Verify teacher dashboard URL ───────────────────────────
    expect(loginPage.isDashboardUrl()).toBeTruthy();
    expect(dashboardPage.isTeacherDashboard()).toBeTruthy();

    // ── 7. Click Create class ──────────────────────────────────────
    await dashboardPage.clickCreateClass();

    // ── 8. Enter class name → Next ─────────────────────────────────
    await createClassPage.enterClassName(testData.className);
    await createClassPage.clickNext();

    // ── 9. Click + Add material ────────────────────────────────────
    await createClassPage.clickAddMaterial();

    // ── 10. Type search term ───────────────────────────────────────
    await addMaterialPage.searchMaterial(testData.materialSearch);

    // ── 11. Click suggestion ───────────────────────────────────────
    await addMaterialPage.selectSuggestion(testData.materialName);

    // ── 12. Select material via JS (radio behind overlay) ──────────
    await addMaterialPage.selectMaterialViaJS();

    // ── 13. Add to class ───────────────────────────────────────────
    await addMaterialPage.clickAddToClass();

    // ── 14. Close "This material is collaborative" dialog via JS ───
    await addMaterialPage.closeCollaborativeDialog();

    // ── 15. Finish ─────────────────────────────────────────────────
    await createClassPage.clickFinish();

    // ── 16. Verify success ─────────────────────────────────────────
    const created = await createClassPage.isClassCreated();
    expect(created).toBeTruthy();

    // ── 17. On dashboard: verify class card, highlight it, screenshot ─
    const visibleOnDashboard = await dashboardPage.verifyClassOnDashboard(testData.className);
    expect(visibleOnDashboard).toBeTruthy();
  });
});
