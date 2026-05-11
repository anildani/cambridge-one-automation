const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const testData = require('../test-data/testData.json');
const LandingPage    = require('../pages/LandingPage');
const LoginPage      = require('../pages/LoginPage');
const DashboardPage  = require('../pages/DashboardPage');
const CreateClassPage = require('../pages/CreateClassPage');
const AddMaterialPage = require('../pages/AddMaterialPage');

const RESULTS_DIR = path.join(__dirname, 'test-results', 'mcp-run-chromium');

async function run() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: RESULTS_DIR, size: { width: 1280, height: 720 } },
  });

  const page = await context.newPage();

  const landingPage    = new LandingPage(page);
  const loginPage      = new LoginPage(page);
  const dashboardPage  = new DashboardPage(page);
  const createClassPage = new CreateClassPage(page);
  const addMaterialPage = new AddMaterialPage(page);

  let passed = true;

  try {
    console.log('[1/17] Navigate to site');
    await landingPage.navigate(testData.url);

    console.log('[2/17] Accept cookies');
    await landingPage.acceptCookies();

    console.log('[3/17] Click Log in');
    await landingPage.clickLogin();

    console.log('[4/17] Fill credentials & submit');
    await loginPage.login(testData.username, testData.password);

    console.log('[5/17] Verify teacher dashboard URL');
    if (!loginPage.isDashboardUrl()) throw new Error('Not on teacher dashboard after login');

    console.log('[6/17] Dismiss survey popup if present');
    await page.evaluate(() => {
      const survey = document.querySelector('cg-survey');
      if (survey) survey.remove();
    });

    console.log('[7/17] Click Create class');
    await dashboardPage.clickCreateClass();

    console.log('[8/17] Enter class name → Next');
    await createClassPage.enterClassName(testData.className);
    await createClassPage.clickNext();

    console.log('[9/17] Click + Add material');
    await createClassPage.clickAddMaterial();

    console.log('[10/17] Search material');
    await addMaterialPage.searchMaterial(testData.materialSearch);

    console.log('[11/17] Select suggestion');
    await addMaterialPage.selectSuggestion(testData.materialName);

    console.log('[12/17] Select material via JS');
    await addMaterialPage.selectMaterialViaJS();

    console.log('[13/17] Add to class');
    await addMaterialPage.clickAddToClass();

    console.log('[14/17] Close collaborative dialog');
    await addMaterialPage.closeCollaborativeDialog();

    console.log('[15/17] Click Finish');
    await createClassPage.clickFinish();

    console.log('[16/17] Verify success message');
    const created = await createClassPage.isClassCreated();
    if (!created) throw new Error('"Class successfully created" text not found');

    console.log('[17/17] Verify class card on dashboard');
    const visible = await dashboardPage.verifyClassOnDashboard(testData.className);
    if (!visible) throw new Error(`"${testData.className}" not visible on dashboard`);

    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-finished-1.png') });
    console.log('\n✅  PASSED — class created and visible on dashboard');

  } catch (err) {
    passed = false;
    console.error('\n❌  FAILED:', err.message);
    await page.screenshot({ path: path.join(RESULTS_DIR, 'test-failed.png') });
  } finally {
    // Capture video path before closing (path is only available after close)
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const tmpPath = await video.path();
      if (tmpPath && fs.existsSync(tmpPath)) {
        const dest = path.join(RESULTS_DIR, 'video.webm');
        fs.renameSync(tmpPath, dest);
        console.log(`Video  → ${dest}`);
      }
    }

    console.log(`PNG    → ${path.join(RESULTS_DIR, passed ? 'test-finished-1.png' : 'test-failed.png')}`);
    process.exit(passed ? 0 : 1);
  }
}

run();
