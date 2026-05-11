# Cambridge One Automation Framework

Playwright Page Object Model (POM) automation suite for testing the Cambridge One educational platform (`micro-nemo.comprodls.com`).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Test Data](#test-data)
- [Running Tests](#running-tests)
- [Framework Workflow](#framework-workflow)
- [Page Objects](#page-objects)
- [Test Artifacts](#test-artifacts)

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev/) | ^1.59.1 | Browser automation |
| @playwright/test | ^1.59.1 | Test runner & assertions |
| Node.js | Latest LTS | Runtime |
| JavaScript | ES6+ | Language |

---

## Project Structure

```
d:\AI Automation/
├── pages/                      # Page Object Model classes
│   ├── BasePage.js             # Parent class with shared helpers
│   ├── LandingPage.js          # Landing/home page (cookies, login nav)
│   ├── LoginPage.js            # Gigya authentication form
│   ├── DashboardPage.js        # Teacher dashboard
│   ├── CreateClassPage.js      # Class creation form
│   └── AddMaterialPage.js      # Material search & selection modal
├── tests/                      # Test specifications
│   ├── createClass.spec.js     # Main Playwright test (17 steps)
│   ├── fixtures.js             # Custom Playwright fixtures
│   └── run-test.js             # Standalone test runner (no framework)
├── test-data/
│   └── testData.json           # Test credentials and parameters
├── screenshots/                # Screenshots captured during runs
├── test-results/               # Videos and trace files
├── playwright-report/          # HTML test report
├── playwright.config.js        # Playwright configuration
├── create-class.js             # Standalone diagnostic script
├── diagnose.js                 # DOM inspection / debugging utility
└── package.json
```

---

## Setup & Installation

```bash
# Clone the repository
git clone <repo-url>
cd "AI Automation"

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

---

## Configuration

**playwright.config.js**

| Setting | Value | Description |
|---------|-------|-------------|
| `testDir` | `./tests` | Directory scanned for `.spec.js` files |
| `timeout` | 90,000 ms | Max duration per test |
| `expect.timeout` | 20,000 ms | Max wait for assertions |
| `fullyParallel` | `false` | Tests run sequentially |
| `retries` | `1` | Failed tests retry once |
| `headless` | `false` | Browser is visible during execution |
| `slowMo` | 400 ms | Delay between actions (easier to follow) |
| `screenshot` | `on` | Screenshot captured on every action |
| `video` | `on` | Video recorded for all test runs |
| `trace` | `retain-on-failure` | Trace kept only when a test fails |
| Browser | Chromium | Desktop Chrome, 1280×720 viewport |

---

## Test Data

All test parameters are stored in `test-data/testData.json`:

```json
{
  "url": "https://micro-nemo.comprodls.com/",
  "username": "anildaniteacher1@mailsac.com",
  "password": "Compro11",
  "className": "AI Test Class 1",
  "materialSearch": "R55",
  "materialName": "R55 Multi Component Umbrella"
}
```

Update this file to run tests with different credentials, class names, or materials — no code changes needed.

---

## Running Tests

### Standard Playwright runner

```bash
# Run all tests (headless override from config — actually headed per config)
npm test

# Run with visible browser
npm run test:headed

# Open the HTML report after a run
npm run report

# Interactive UI mode
npx playwright test --ui

# Run a specific test file
npx playwright test tests/createClass.spec.js
```

### Standalone runner (no Playwright test framework)

```bash
# Uses POM classes directly, records video to test-results/
node tests/run-test.js
```

### Diagnostic / debugging scripts

```bash
# Full standalone automation with step-by-step screenshots
node create-class.js

# DOM inspection — lists buttons, inputs, frames on each page
node diagnose.js
```

---

## Framework Workflow

### Data Flow

```
testData.json  →  Test Orchestration  →  Page Objects  →  Chromium  →  Reports
  (inputs)       (createClass.spec)      (pages/*.js)    (browser)    (HTML/screenshots/video)
```

### 17-Step Test Execution

| Phase | Steps | Actions |
|-------|-------|---------|
| **Authentication** | 1–5 | Navigate to site → accept cookies → click Login → fill credentials → verify dashboard URL |
| **Class Creation** | 6–8 | Click "Create Class" → enter class name → click Next |
| **Add Material** | 9–14 | Open material modal → search by keyword → select suggestion → confirm selection → click "Add to Class" → close dialog |
| **Verify Success** | 15–17 | Click Finish → confirm class created → verify class appears on dashboard |

### Execution Flow Diagram

```
[testData.json]
      │
      ▼
[createClass.spec.js] ──── orchestrates 17 steps ────────────────────────┐
      │                                                                    │
      ├──► LandingPage.navigate()          (Step 1)                       │
      ├──► LandingPage.acceptCookies()     (Step 2)                       │
      ├──► LandingPage.clickLogin()        (Step 3)                       │
      ├──► LoginPage.login()               (Step 4)  ◄── credentials      │
      ├──► LoginPage.isDashboardUrl()      (Step 5)                       │
      │                                                                    │
      ├──► DashboardPage.clickCreateClass()(Step 6)                       │
      ├──► CreateClassPage.enterClassName()(Step 7)  ◄── className        │
      ├──► CreateClassPage.clickNext()     (Step 8)                       │
      │                                                                    │
      ├──► CreateClassPage.clickAddMaterial()  (Step 9)                   │
      ├──► AddMaterialPage.searchMaterial()    (Step 10) ◄── materialSearch│
      ├──► AddMaterialPage.selectSuggestion()  (Step 11) ◄── materialName │
      ├──► AddMaterialPage.selectMaterialViaJS()(Step 12)                 │
      ├──► AddMaterialPage.clickAddToClass()   (Step 13)                  │
      ├──► AddMaterialPage.closeDialog()       (Step 14)                  │
      │                                                                    │
      ├──► CreateClassPage.clickFinish()   (Step 15)                      │
      ├──► CreateClassPage.isClassCreated()(Step 16)                      │
      └──► DashboardPage.verifyClass()     (Step 17)                      │
                                                                           │
[Artifacts] ◄──────────────────────────────────────────────────────────────┘
  ├── playwright-report/  (HTML report)
  ├── screenshots/        (PNG per step)
  └── test-results/       (video + trace on failure)
```

---

## Page Objects

All page classes extend `BasePage.js`, which provides the shared `page` reference and common navigation helpers.

### BasePage.js
Parent class inherited by all page objects. Provides:
- `page` reference
- Common timeouts
- Shared navigation utilities

### LandingPage.js
| Method | Description |
|--------|-------------|
| `navigate()` | Opens the application URL |
| `acceptCookies()` | Dismisses the cookie consent banner |
| `clickLogin()` | Navigates to the login screen |

### LoginPage.js
| Method | Description |
|--------|-------------|
| `login(username, password)` | Fills and submits the Gigya auth form |
| `isDashboardUrl()` | Verifies redirect to the teacher dashboard |

### DashboardPage.js
| Method | Description |
|--------|-------------|
| `clickCreateClass()` | Clicks the "Create class" button |
| `verifyClassOnDashboard(className)` | Confirms the new class appears in the list |

### CreateClassPage.js
| Method | Description |
|--------|-------------|
| `enterClassName(name)` | Types the class name into the input field |
| `clickNext()` | Proceeds to the material step |
| `clickAddMaterial()` | Opens the material selection modal |
| `clickFinish()` | Submits the class creation |
| `isClassCreated()` | Asserts success state |

### AddMaterialPage.js
| Method | Description |
|--------|-------------|
| `searchMaterial(keyword)` | Types a search term into the material search box |
| `selectSuggestion(materialName)` | Picks a material from the autocomplete dropdown |
| `selectMaterialViaJS()` | Uses `page.evaluate()` to click radio buttons blocked by overlays |
| `clickAddToClass()` | Confirms the material selection |
| `closeCollaborativeDialog()` | Dismisses any post-add dialog |

### Key Design Patterns

- **Multi-fallback selectors** — each locator tries 2–3 CSS/text variations to handle UI inconsistencies:
  ```js
  page.locator([
    'button:has-text("Create class")',
    'a:has-text("Create class")',
    'button:has-text("Create Class")',
  ].join(', ')).first()
  ```
- **State-based waits** — waits for `visible` state before acting; no fixed `sleep()` calls
- **JavaScript fallbacks** — uses `page.evaluate()` to interact with elements blocked by pointer-event overlays
- **Smart dialog handling** — tries multiple close button selectors, falls back to `Escape` key

---

## Test Artifacts

| Artifact | Location | Generated When |
|----------|----------|----------------|
| HTML Report | `playwright-report/` | Every run (`npm run report` to open) |
| Screenshots | `screenshots/` | Every action (config: `screenshot: 'on'`) |
| Videos | `test-results/` | Every run (config: `video: 'on'`) |
| Trace | `test-results/` | Only on failure (config: `trace: 'retain-on-failure'`) |
| Console logs | Terminal | Every run |
